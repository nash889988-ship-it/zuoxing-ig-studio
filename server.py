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

def chat_ai(payload, key):
    if not key: raise ValueError('請先輸入自己的 OpenAI API 金鑰。')
    n=max(5,min(10,int(payload.get('count',7))))
    topic=str(payload.get('topic',''))[:180]
    details=str(payload.get('details',''))[:2000]
    goal=str(payload.get('goal','分享與收藏'))[:120]
    prompt=f'''你是台灣「作興趣農場」IG輪播腳本編輯。依主題生成 {n} 張IG輪播分鏡。全繁體中文，內容限於已給事實；未知設施價格或人物事蹟不可發明；創作傳說必須標為虛構。每張標題+內文合計最多80個中文字元（標點也計入），建議標題8~16字、內文35~60字。整組至少70%的分鏡聚焦『可核實的露營實用知識、原因、操作步驟、出遊資訊與安全注意事項』；故事/情緒只作為引子與收尾。每張只放一個清楚的知識重點，說明做法、適用情況、常見誤區。資料有來源才寫確定事實；不得捏造營地設施、旅遊最新公告、統計或數據；不確定就明確標記『待查證』。首張以知識鉤子吸引收藏，最後一張符合 {goal} 的CTA。固定品牌IG @interest558855、官方LINE @wifi558855、訂位 https://forinterest.hexa.tw/。主題：{topic}。用戶素材：{details or '未提供'}。只輸出有效JSON物件，格式：{{"slides":[{{"title":"...","body":"...","image_prompt":"描述圖片底圖，不要文字、不要Logo"}}],"caption":"100字內貼文，包含品牌導流","hashtags":["#...",...],"notes":"出版前須查證事項"}}。slides正好{n}項；Hashtag 5~8項。'''
    req={'model':os.environ.get('OPENAI_TEXT_MODEL','gpt-4.1-mini'),'input':prompt,'max_output_tokens':3800,'text':{'format':{'type':'json_object'}}}
    # Validate output strictly and retry once if the model misses the format or limits.
    last_error='AI 未產生符合規格的腳本'
    for attempt in range(2):
        if attempt:
            req['input']=prompt+'\n你上次的結果不符合規格：'+last_error+'。請修正並確保只輸出合法 JSON。'
        data=json.dumps(req,ensure_ascii=False).encode()
        try:
            result=get_json('https://api.openai.com/v1/responses',
                {'Authorization':'Bearer '+key,'Content-Type':'application/json'},'POST',data,70)
        except HTTPError as e:
            if e.code==401: raise ValueError('API 金鑰無效或沒有授權（401）')
            if e.code==429: raise ValueError('API 額度不足或觸發速率限制（429）')
            raise ValueError(f'AI 服務回覆 HTTP {e.code}，請檢查模型權限與額度')
        text=''.join(c.get('text','') for o in result.get('output',[])
                     for c in o.get('content',[]) if c.get('type')=='output_text')
        try:
            obj=json.loads(re.sub(r'^\x60\x60\x60(?:json)?\\s*|\\s*\x60\x60\x60$','',text.strip()))
            slides=obj.get('slides')
            if not isinstance(slides,list) or len(slides)!=n:
                raise ValueError('分鏡張數應為'+str(n))
            for x in slides:
                if not isinstance(x,dict): raise ValueError('分鏡欄位格式錯誤')
                x['title']=str(x.get('title','')).strip()
                x['body']=str(x.get('body','')).strip()
                x['image_prompt']=str(x.get('image_prompt',''))[:600]
                if not x['title'] or not x['body']: raise ValueError('分鏡有空白標題或內文')
                if len(x['title']+x['body'])>80: raise ValueError('單張超過80字')
            if not isinstance(obj.get('hashtags'),list) or not 5<=len(obj['hashtags'])<=8:
                raise ValueError('Hashtag 必須為5至8項')
            obj['notes']=str(obj.get('notes',''))
            obj['caption']=str(obj.get('caption',''))
            return obj
        except (ValueError,TypeError,AttributeError) as e:
            last_error=str(e)
    raise ValueError('AI 輸出未通過格式與80字檢查：'+last_error)


def generate_image(payload, key):
    if not key:raise ValueError('請先輸入自己的 OpenAI API 金鑰')
    prompt=str(payload.get('prompt',''))[:1100]
    style=str(payload.get('style','森林療癒'))[:70]
    if not prompt:raise ValueError('請先輸入圖片內容')
    spec=f'Generate ONE photorealistic vertical 4:5 editorial background photo for Taiwan family camping Instagram carousel. Visual style: {style}. Image context: {prompt}. No text, no typography, no logos, no watermarks, no text labels. Natural human appearance, realistic Taiwan scenery when relevant. Leave quiet dark space for later headline overlay.'
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
