#!/usr/bin/env python3
"""Local-only web server for 作興趣 IG Studio. Python standard library."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
import os, json, base64, re, hmac, xml.etree.ElementTree as ET, mimetypes
from urllib.error import HTTPError, URLError

ROOT=Path(__file__).resolve().parent
HOST=os.environ.get('IG_STUDIO_HOST', '0.0.0.0' if os.environ.get('RENDER') == 'true' else '127.0.0.1')
PORT=int(os.environ.get('PORT',os.environ.get('IG_STUDIO_PORT','8765')))
ACCESS_PASSWORD=os.environ.get('IG_STUDIO_PASSWORD','').strip()
MAX_BODY=2_500_000
TOPIC_QUERIES=[
    ('露營知識','台灣 露營 技巧 新手 裝備'),
    ('露營安全','台灣 露營 安全 防火 一氧化碳'),
    ('親子戶外知識','親子 戶外 教育 露營 安全'),
    ('生態環境知識','台灣 山林 保育 露營 生態'),
    ('露營景點','台灣 露營區 景點 新聞'),
    ('南投旅遊','南投 景點 旅遊 露營'),
    ('旅遊新消息','台灣 旅遊 景區 開放 新聞'),
    ('步道與戶外','台灣 步道 開放 封閉 登山 消息'),
    ('節慶與活動','台灣 露營 戶外 活動 市集'),
]

def get_json(url, headers=None, method=None, data=None, timeout=16):
    r=Request(url,data=data,headers=headers or {'User-Agent':'Mozilla/5.0 (IG studio local research)'},method=method)
    with urlopen(r,timeout=timeout) as resp:
        return json.loads(resp.read(5_000_000).decode())

def get_news(days=7):
    cutoff=datetime.now(timezone.utc)-timedelta(days=days)
    entries=[]; errors=[]; seen=set()
    for category, query in TOPIC_QUERIES:
        # These are news-search references, NOT Instagram engagement rankings.
        url='https://news.google.com/rss/search?q='+quote(query+' when:'+str(days)+'d')+'&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'
        try:
            req=Request(url,headers={'User-Agent':'Mozilla/5.0'})
            with urlopen(req,timeout=10) as r: xml=r.read(1_500_000)
            root=ET.fromstring(xml)
            for item in root.findall('.//item')[:12]:
                title=item.findtext('title') or ''
                link=item.findtext('link') or ''
                date=item.findtext('pubDate') or ''
                source=item.findtext('source') or ''
                if not title or not link: continue
                try: dt=parsedate_to_datetime(date).astimezone(timezone.utc)
                except Exception: continue
                if dt<cutoff or dt>datetime.now(timezone.utc)+timedelta(days=1): continue
                k=re.sub(r'\s+','',title).lower()
                if k in seen:continue
                seen.add(k)
                entries.append({'title':title[:240],'category':category,'source':source,'url':link,'published':dt.isoformat(), 'likes':None,'comments':None,'views':None,'kind':'新聞線索（非 IG 貼文）'})
        except Exception as e:
            errors.append(f'{category}：{type(e).__name__}（遠端新聞服務暫時無法存取）')
    entries.sort(key=lambda x:x['published'],reverse=True)
    return {'updated':datetime.now(timezone.utc).isoformat(),'range_days':days,'topics':entries[:100], 'errors':errors,
            'notice':'這是近期新聞/官方報導線索，不是 IG 熱門排名；未取得公開貼文互動量時顯示未取得。', 'accounts':[]}

def script_status_missing(topic, ctype, missing):
    return {
        'status':'needs_sources', 'topic':topic, 'content_type':ctype, 'slides':[],
        'caption':'', 'hashtags':[], 'missing_materials':missing,
        'verification_notes':['來源網址本身不代表系統已閱讀來源；請貼入實際摘要或來源內容。',
                              '未提供個人讀後心得時，不會假裝使用者已閱讀全書。'],
        'notes':'資料不足，尚未呼叫付費 AI。',
        'layout':{'width':1080,'height':1350,'max_chars_per_slide':120,
                  'style':'premium_editorial','show_top_left_logo':False,'show_slide_numbers':False}
    }

def chat_ai(payload, key):
    topic=str(payload.get('topic','')).strip()[:180]
    if not topic:raise ValueError('請先輸入主題名稱')
    ctype=str(payload.get('content_type','knowledge'))[:24]
    if ctype not in ('knowledge','book_review','travel','story'):ctype='knowledge'
    n=max(5,min(10,int(payload.get('slide_count',payload.get('count',7)))))
    details=str(payload.get('story_details',payload.get('details',''))).strip()[:5500]
    notes=str(payload.get('reading_notes','')).strip()[:2600]
    raw_materials=payload.get('important_materials',[])
    if isinstance(raw_materials,str):materials=[x.strip() for x in raw_materials.splitlines() if x.strip()]
    elif isinstance(raw_materials,list):materials=[str(x).strip() for x in raw_materials if str(x).strip()]
    else:materials=[]
    materials=materials[:24]
    sources=payload.get('sources',[])
    if not isinstance(sources,list):sources=[]
    clean_sources=[]
    for i,source in enumerate(sources[:8]):
        if not isinstance(source,dict):continue
        clean_sources.append({
            'id':str(source.get('id',f'source_{i+1}'))[:50],
            'title':str(source.get('title',''))[:160],
            'url':str(source.get('url',''))[:400],
            'verified_text':str(source.get('verified_text',''))[:6000],
            'verified':bool(source.get('verified',False))
        })
    verified_text=' '.join(x['verified_text'] for x in clean_sources).strip()
    goal=str(payload.get('goal','知識分享與收藏'))[:70]
    tone=str(payload.get('tone','專業、自然、有深度'))[:70]
    if ctype=='book_review':
        # Bookstore ranking metadata or a naked title is NOT enough to summarize a book.
        substantive_details='\n'.join(
            line for line in details.splitlines()
            if not any(marker in line for marker in
               ('來源：','資料日期：','參考連結：','官方榜單：','核對日期：',
                '參考書籍：','注意：','尚無完整內文','請自行提供摘要','請依此來源')))
        evidence=len(verified_text)+len(notes)+len(substantive_details)+sum(len(x) for x in materials)
        if evidence<110:
            return script_status_missing(topic,ctype,[
                '請提供出版社書籍介紹、可查證的故事大綱或章節摘要（建議至少110字）。',
                '如需第一人稱閱讀心得，請提供你自己的心得；否則改寫成閱讀觀點。'
            ])
    else:
        usable_details='\n'.join(line for line in details.splitlines()
            if not any(marker in line for marker in (
              '來源：','資料日期：','參考連結：','請補充來源','請依此來源','待查證')))
        if len(usable_details)+len(verified_text)+len(notes)+sum(len(x) for x in materials)<35:
            return script_status_missing(topic,ctype,[
                '請補充至少一段真實背景、已查證資訊或實際的來源文字。',
                '新聞標題和原始網址只是研究線索，不能據此編寫未確認細節。'
            ])
    if not key:raise ValueError('請先輸入個人 OpenAI API 金鑰')
    kind_guidance={
      'book_review':'以已提供的書籍介紹、情節摘要和章節／人物觀點為主，分析閱讀價值與有根據的感想。不得捏造任何具體情節、作者、書評、金句或主觀讀後經驗。',
      'knowledge':'介紹事實、成因、實用步驟、常見誤區；素材不支持之說法請標成待查證，不強制與露營相關。',
      'travel':'依提供的資訊寫景點亮點、交通、行程、適合族群、注意事項，最新票價與開放時間不得臆造。',
      'story':'以使用者提供的故事為核心，整理背景、發展、轉折、啟發；不得編造真實人物對話或把虛構故事寫成真實。'
    }[ctype]
    prompt=f"""你是臺灣繁體中文 Instagram 雜誌編輯與事實核查編輯。請為「作興趣農場」製作 {n} 張 IG 輪播。
最高優先：主題與使用者提供的故事內容、重要素材相符。絕不可將書籍閱讀主題硬改為露營文案。
內容類型：{ctype}。編輯指令：{kind_guidance}
主題：{topic}
主題故事與背景資料（使用者提供，可能未查證）：{details or '未提供'}
一定要涵蓋的素材：{json.dumps(materials,ensure_ascii=False)}
使用者真實閱讀心得／體驗：{notes or '未提供，不得假裝讀過'}
提供的來源與文字資料：{json.dumps(clean_sources,ensure_ascii=False)}
文字語氣：{tone}。行銷目標：{goal}。
編輯要求：
1. 每張 title + body 合計嚴格 <=120 個 Unicode 字元（含標點），title 建議 8–16 字，body 有具體重點；每張只承載一個不同的知識或分析重點。
2. 第一張勾起想閱讀的好奇心；中間循序整理可靠大綱、知識或分析；最後一張摘要、共鳴或適當的 CTA。不要空泛句，不重複。
3. 高比例內容應為可靠知識、已提供資料的具體解析；勿臆造人物、章節、價格、統計、旅行開放消息。
4. 只有來源網址但未提供其文章文字時，不要假裝已經閱讀該網址。若資料不足以支持特定說法，使用審慎描述並在 verification_notes 說明。
5. 只有使用者明確提供閱讀心得，才可用第一人稱「我讀後」。不以你自己的臆想假扮讀者。
6. 每張 image_prompt 應為貼合該張內容、無文字無標誌的攝影或雜誌風背景，不要仿冒書籍封面、名人照片；每張 source_ids 是引用的已提供來源 id 陣列，未用來源時空陣列。
7. 固定 IG：@interest558855；LINE：@wifi558855；訂位：https://forinterest.hexa.tw/。非露營／非品牌類主題不要硬塞農場訂位文案，品牌只放在適當 CTA。
8. 生成適當貼文 caption、5–8 個 hashtags、待查證事項 verification_notes。
回傳純 JSON 物件，結構：
{{"status":"ready","topic":"...","content_type":"{ctype}","slides":[{{"title":"...","body":"...","image_prompt":"...","source_ids":[]}}],"caption":"...","hashtags":["#..."],"verification_notes":["..."],"missing_materials":[],"notes":"..."}}
slides 必須恰好 {n} 筆。"""
    req={'model':os.environ.get('OPENAI_TEXT_MODEL','gpt-4.1-mini'),'input':prompt,
         'max_output_tokens':4800,'text':{'format':{'type':'json_object'}}}
    last_error='輸出無法驗證'
    for attempt in range(2):
        if attempt:req['input']=prompt+'\n請修正上次輸出格式：'+last_error+'。重新確認120字限制與張數。'
        try:
            result=get_json('https://api.openai.com/v1/responses',{
                'Authorization':'Bearer '+key,'Content-Type':'application/json'},'POST',
                json.dumps(req,ensure_ascii=False).encode(),70)
        except HTTPError as e:
            if e.code==401:raise ValueError('API 金鑰無效或未授權（401）')
            if e.code==429:
                try:
                    d=json.loads(e.read(2000).decode())
                    code=d.get('error',{}).get('code','')
                except Exception:code=''
                raise ValueError('API 可用額度不足，請檢查帳戶餘額（429）' if code=='insufficient_quota'
                      else 'API 達到速率或額度限制（429），請檢查專案限制')
            raise ValueError(f'AI API 回傳 HTTP {e.code}，請檢查模型權限或帳單設定')
        text=''.join(c.get('text','') for out in result.get('output',[])
                     for c in out.get('content',[]) if c.get('type')=='output_text')
        try:
            obj=json.loads(text.strip())
            slides=obj.get('slides',[])
            if obj.get('status')!='ready' or not isinstance(slides,list) or len(slides)!=n:
                raise ValueError('腳本狀態或分鏡張數不符')
            allowed={src['id'] for src in clean_sources}
            for x in slides:
                if not isinstance(x,dict):raise ValueError('分鏡欄位格式錯誤')
                x['title']=str(x.get('title','')).strip()
                x['body']=str(x.get('body','')).strip()
                x['image_prompt']=str(x.get('image_prompt',''))[:700]
                ids=x.get('source_ids',[])
                x['source_ids']=[str(v) for v in ids if str(v) in allowed] if isinstance(ids,list) else []
                if not x['title'] or not x['body']:raise ValueError('缺少標題或內文')
                if len(x['title']+x['body'])>120:raise ValueError('有分鏡超過120字')
            hashtags=obj.get('hashtags',[])
            if not isinstance(hashtags,list) or not 5<=len(hashtags)<=8:
                raise ValueError('Hashtag 必須有5至8個')
            obj['verification_notes']=[str(v)[:300] for v in obj.get('verification_notes',[])][:10]
            obj['missing_materials']=[]
            obj['caption']=str(obj.get('caption',''))[:1500]
            obj['notes']=str(obj.get('notes',''))[:600]
            obj['layout']={'width':1080,'height':1350,'max_chars_per_slide':120,
                           'style':'premium_editorial','show_top_left_logo':False,'show_slide_numbers':False}
            return obj
        except (ValueError,TypeError,AttributeError) as e:
            last_error=str(e)
    raise ValueError('AI 輸出未通過精準腳本格式檢查：'+last_error)

def generate_image(payload, key):
    if not key:raise ValueError('請先輸入自己的 OpenAI API 金鑰')
    prompt=str(payload.get('prompt',''))[:1100]
    style=str(payload.get('style','森林療癒'))[:70]
    if not prompt:raise ValueError('請先輸入圖片內容')
    spec=f'Generate ONE refined, professional vertical 4:5 editorial background image for an Instagram carousel. Visual style: {style}. Actual subject and context: {prompt}. Respect the subject: for books use tasteful literary editorial photography or symbolic objects, and do NOT force any camping or Taiwan scenery unless the subject asks for it. Do NOT imitate any copyrighted book cover or real person. No text, no typography, no logos, no watermarks or text labels. Natural credible visual treatment; leave quiet darker negative space for later headline overlay.'
    req={'model':os.environ.get('OPENAI_IMAGE_MODEL','gpt-image-1'),'prompt':spec,'size':'1024x1536','quality':'medium'}
    raw=json.dumps(req,ensure_ascii=False).encode()
    r=get_json('https://api.openai.com/v1/images/generations',{'Authorization':'Bearer '+key,'Content-Type':'application/json'},'POST',raw,100)
    blob=(r.get('data') or [{}])[0].get('b64_json')
    if not blob:raise ValueError('AI 圖像 API 未提供圖片資料')
    return {'data_url':'data:image/png;base64,'+blob}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
    def do_GET(self):
        if self.path.startswith('/api/status'):
            self.reply(200,{'ai_configured':False,'bring_your_own_key':True,'research_mode':'即時新聞 RSS；非 Instagram 排名','text_model':os.environ.get('OPENAI_TEXT_MODEL','gpt-4.1-mini')});return
        if self.path.startswith('/api/research'):
            self.reply(200,get_news());return
        return super().do_GET()
    def do_POST(self):
        if self.path not in ['/api/script','/api/image']:
            self.reply(404,{'error':'Not Found'});return
        key=self.headers.get('X-User-OpenAI-Key','').strip()
        if not re.fullmatch(r'sk-[A-Za-z0-9_\\-]{16,250}',key):
            self.reply(403,{'error':'請先在網站輸入有效格式的個人 OpenAI API 金鑰，本站不使用共用金鑰。'});return
        try:
            l=int(self.headers.get('Content-Length','0'))
            if l<=0 or l>MAX_BODY:raise ValueError('請求資料大小不符合限制')
            obj=json.loads(self.rfile.read(l))
            result=chat_ai(obj,key) if self.path=='/api/script' else generate_image(obj,key)
            self.reply(200,result)
        except Exception as e:
            self.reply(400,{'error':str(e)[:400]})
    def reply(self,status,data):
        body=json.dumps(data,ensure_ascii=False).encode('utf-8')
        self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def end_headers(self):
        if not self.path.startswith('/api/'):
            self.send_header('Content-Security-Policy',"default-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: blob:; connect-src 'self';")
        super().end_headers()

if __name__=='__main__':
    print(f'作興趣 AI IG 輪播設計中心 http://{HOST}:{PORT} | 公開免登入模式（付費 AI API 禁用）')
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
