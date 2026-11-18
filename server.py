#!/usr/bin/env python3
"""Local-only web server for 作興趣 IG Studio. Python standard library."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
import os, json, base64, re, hmac, xml.etree.ElementTree as ET, mimetypes

ROOT=Path(__file__).resolve().parent
HOST=os.environ.get('IG_STUDIO_HOST', '0.0.0.0' if os.environ.get('RENDER') == 'true' else '127.0.0.1')
PORT=int(os.environ.get('PORT',os.environ.get('IG_STUDIO_PORT','8765')))
ACCESS_PASSWORD=os.environ.get('IG_STUDIO_PASSWORD','').strip()
MAX_BODY=2_500_000
TOPIC_QUERIES=[('露營知識','露營 安全 裝備 防潮 野炊'),('露營景點','台灣 露營區 親子 景點'),('南投戶外','南投 露營 山林 景點')]

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
            for item in root.findall('.//item'):
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
    return {'updated':datetime.now(timezone.utc).isoformat(),'range_days':days,'topics':entries[:70], 'errors':errors,
            'notice':'這是近期新聞/官方報導線索，不是 IG 熱門排名；未取得公開貼文互動量時顯示未取得。', 'accounts':[]}

def chat_ai(payload):
    key=os.environ.get('OPENAI_API_KEY','').strip()
    if not key: raise ValueError('尚未設定 OPENAI_API_KEY。可先使用模板腳本。')
    n=max(5,min(10,int(payload.get('count',7))))
    topic=str(payload.get('topic',''))[:180]
    details=str(payload.get('details',''))[:2000]
    goal=str(payload.get('goal','分享與收藏'))[:120]
    prompt=f'''你是台灣「作興趣農場」IG輪播腳本編輯。依主題生成 {n} 張IG輪播分鏡。全繁體中文，內容限於已給事實；未知設施價格或人物事蹟不可發明；創作傳說必須標為虛構。每張標題+內文合計最多50字。首張有吸引力，最後一張符合 {goal} 的CTA。固定品牌IG @interest558855、官方LINE @wifi558855、訂位 https://forinterest.hexa.tw/。主題：{topic}。用戶素材：{details or '未提供'}。只輸出有效JSON物件，格式：{{"slides":[{{"title":"...","body":"...","image_prompt":"描述圖片底圖，不要文字、不要Logo"}}],"caption":"100字內貼文，包含品牌導流","hashtags":["#...",...],"notes":"出版前須查證事項"}}。slides正好{n}項；Hashtag 5~8項。'''
    req={'model':os.environ.get('OPENAI_TEXT_MODEL','gpt-4.1-mini'),'input':prompt,'max_output_tokens':2200}
    data=json.dumps(req,ensure_ascii=False).encode()
    result=get_json('https://api.openai.com/v1/responses',{'Authorization':'Bearer '+key,'Content-Type':'application/json'},'POST',data,45)
    text=''.join(c.get('text','') for o in result.get('output',[]) for c in o.get('content',[]) if c.get('type')=='output_text')
    if not text: raise ValueError('API 未回傳有效文字')
    text=re.sub(r'^```(?:json)?\s*|\s*```$','',text.strip())
    obj=json.loads(text)
    if not isinstance(obj.get('slides'),list) or len(obj['slides'])!=n: raise ValueError('AI 腳本張數不符，請重新生成')
    for x in obj['slides']:
        x['title']=str(x.get('title',''))[:100]
        x['body']=str(x.get('body',''))[:130]
        x['image_prompt']=str(x.get('image_prompt',''))[:600]
    return obj

def generate_image(payload):
    key=os.environ.get('OPENAI_API_KEY','').strip()
    if not key:raise ValueError('尚未設定 OPENAI_API_KEY')
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
    def authenticate(self):
        # On a public service require login even for static assets; otherwise anonymous
        # users could exhaust the paid API budget via /api/script and /api/image.
        if not ACCESS_PASSWORD:
            if os.environ.get('RENDER') == 'true':
                self.send_error(503,'Set IG_STUDIO_PASSWORD in Render environment settings')
                return False
            return True
        authorization=self.headers.get('Authorization','')
        try:
            scheme, token=authorization.split(' ',1)
            decoded=base64.b64decode(token,validate=True).decode('utf-8') if scheme.lower()=='basic' else ''
            username, supplied_password=decoded.split(':',1)
        except (ValueError,UnicodeError,base64.binascii.Error):
            supplied_password=''
        if hmac.compare_digest(supplied_password, ACCESS_PASSWORD):return True
        self.send_response(401)
        self.send_header('WWW-Authenticate','Basic realm="Zuoxing IG Studio", charset="UTF-8"')
        self.send_header('Cache-Control','no-store')
        self.send_header('Content-Length','0')
        self.end_headers()
        return False
    def do_GET(self):
        if not self.authenticate():return
        if self.path.startswith('/api/status'):
            self.reply(200,{'ai_configured':bool(os.environ.get('OPENAI_API_KEY')),'research_mode':'即時新聞 RSS；非 Instagram 排名','text_model':os.environ.get('OPENAI_TEXT_MODEL','gpt-4.1-mini')});return
        if self.path.startswith('/api/research'):
            self.reply(200,get_news());return
        return super().do_GET()
    def do_POST(self):
        if not self.authenticate():return
        if self.path not in ['/api/script','/api/image']:
            self.reply(404,{'error':'Not Found'});return
        try:
            l=int(self.headers.get('Content-Length','0'))
            if l<=0 or l>MAX_BODY:raise ValueError('請求資料大小不符合限制')
            obj=json.loads(self.rfile.read(l))
            result=chat_ai(obj) if self.path=='/api/script' else generate_image(obj)
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
    print(f'作興趣 AI IG 輪播設計中心 http://{HOST}:{PORT} | AI:'+('已設定' if os.environ.get('OPENAI_API_KEY') else '未設定（模板可用）'))
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
