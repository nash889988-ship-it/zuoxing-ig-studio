#!/usr/bin/env python3
"""Local-only web server for 作興趣 IG Studio. Python standard library."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler
from urllib.parse import quote, urlsplit
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
import os, json, base64, re, hmac, xml.etree.ElementTree as ET, mimetypes, html, ipaddress, socket
from html.parser import HTMLParser
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

def rss_topics(url, category, platform, cutoff, limit=10):
    req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; ZuoxingResearch/2.0)'})
    with urlopen(req,timeout=8) as response:
        root=ET.fromstring(response.read(1_200_000))
    result=[]
    for item in root.findall('.//item')[:limit]:
        title=short_text(item.findtext('title'),200)
        href=(item.findtext('link') or '').strip()
        if not title or not href.startswith('https://'):continue
        date=item.findtext('pubDate') or ''
        try: dt=parsedate_to_datetime(date).astimezone(timezone.utc)
        except Exception:continue
        if dt<cutoff or dt>datetime.now(timezone.utc)+timedelta(days=1):continue
        source=short_text(item.findtext('source'),100) or platform
        snippet=short_text(item.findtext('description'),300)
        # An RSS snippet is a search excerpt, not verified article body or a user review.
        result.append({'title':title,'category':category,'source':source,'platform':platform,
             'url':href,'published':dt.isoformat(),'snippet':snippet,'likes':None,
             'comments':None,'views':None,'kind':platform+' 搜尋摘要（全文未查證）'})
    return result

def get_news(days=7):
    cutoff=datetime.now(timezone.utc)-timedelta(days=days)
    entries=[]; errors=[]; seen=set(); platform_count={}
    # Independent search feeds, not social-platform metrics or official article verification.
    tasks=[]
    for category, query in TOPIC_QUERIES:
        g='https://news.google.com/rss/search?q='+quote(query+' when:'+str(days)+'d')+'&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'
        b='https://www.bing.com/news/search?q='+quote(query)+'&format=rss'
        tasks.extend([(g,category,'Google News'),(b,category,'Bing News')])
    from concurrent.futures import ThreadPoolExecutor, as_completed
    with ThreadPoolExecutor(max_workers=8) as executor:
        jobs={executor.submit(rss_topics,url,cat,platform,cutoff,8):(cat,platform) for url,cat,platform in tasks}
        for job in as_completed(jobs):
            cat,platform=jobs[job]
            try:
                for item in job.result():
                    key=re.sub(r'[^\w一-龥]','',item['title']).lower()[:110]
                    if key in seen:continue
                    seen.add(key);entries.append(item)
                    platform_count[platform]=platform_count.get(platform,0)+1
            except Exception as e:errors.append(cat+'／'+platform+'：'+type(e).__name__)
    entries.sort(key=lambda x:x['published'],reverse=True)
    return {'updated':datetime.now(timezone.utc).isoformat(),'range_days':days,'topics':entries[:150],
        'errors':errors[:12],'platforms':platform_count,'accounts':[],
        'notice':'搜尋來源：Google News、Bing News 聚合報導與來源站名稱；搜尋摘要並非已核實全文，也不是 IG/YouTube 互動量。'}



class PageMetaParser(HTMLParser):
    """Public article metadata only, not entire copyrighted reviews."""
    def __init__(self):
        super().__init__();self.title='';self.description='';self.in_title=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='title':self.in_title=True
        if tag=='meta':
            key=(a.get('property') or a.get('name') or '').lower()
            if key in ('og:description','description','twitter:description') and not self.description:
                self.description=a.get('content','')
    def handle_endtag(self,tag):
        if tag=='title':self.in_title=False
    def handle_data(self,data):
        if self.in_title:self.title+=data

def short_text(v,n=360):
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',str(v or '')))).strip()[:n]

def safe_public_url(url):
    """Prevent URL-provided SSRF, even through DNS aliases."""
    try:
        p=urlsplit(url)
        if p.scheme!='https' or not p.hostname or p.username or p.password: return False
        if p.port not in (None,443):return False
        host=p.hostname.lower().rstrip('.')
        if host in ('localhost','localhost.localdomain') or host.endswith('.local') or '.' not in host:return False
        addrs=socket.getaddrinfo(host,443,proto=socket.IPPROTO_TCP)
        return bool(addrs) and all(ipaddress.ip_address(x[4][0]).is_global for x in addrs)
    except (ValueError,OSError,TypeError):return False

def fetch_public_description(url):
    if not safe_public_url(url):return None
    try:
        req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; ZuoxingReaderResearch/1.0)'})
        with urlopen(req,timeout=7) as res:
            final=res.geturl()
            if not safe_public_url(final):return None
            if 'html' not in res.headers.get('Content-Type','').lower():return None
            raw=res.read(180_000)
        parser=PageMetaParser()
        parser.feed(raw.decode('utf-8','replace'))
        return {'url':final,'page_title':short_text(parser.title,180),
                'description':short_text(parser.description,280)}
    except Exception:return None

class ArticleBodyParser(HTMLParser):
    """Extract readable public article text, not a paywall or JS-only document."""
    def __init__(self):
        super().__init__();self.stack=[];self.skip=0;self.blocks=[];self.scoped=[];self.current='';self.title='';self.heading=False
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style','noscript','nav','footer','header','aside','form','svg'):
            self.skip+=1
        if tag in ('p','h1','h2','h3','blockquote','li') and not self.skip:
            self.current=''
        if tag in ('title',):self.heading=True
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):
            self.stack.append(tag)
    def handle_data(self,data):
        if self.skip:return
        tag=self.stack[-1] if self.stack else ''
        if self.heading and tag=='title':self.title+=data
        if any(t in ('p','h1','h2','h3','blockquote','li') for t in self.stack):
            self.current+=data
    def handle_endtag(self,tag):
        if tag in ('p','h1','h2','h3','blockquote','li') and not self.skip:
            p=short_text(self.current,1600)
            if len(p)>=24 and not re.search(r'(cookie|隱私權政策|登入.*註冊|相關文章|您可能也喜歡|廣告合作)',p,re.I):
                self.blocks.append(p)
                if 'article' in self.stack or 'main' in self.stack:self.scoped.append(p)
            self.current=''
        if tag=='title':self.heading=False
        if tag in ('script','style','noscript','nav','footer','header','aside','form','svg') and self.skip:
            self.skip-=1
        if self.stack:
            # Recover from common malformed HTML by unwinding to the closing element.
            if tag in self.stack:
                idx=len(self.stack)-1-self.stack[::-1].index(tag)
                del self.stack[idx:]
            else:self.stack.pop()

class PublicOnlyRedirect(HTTPRedirectHandler):
    def __init__(self):self.hops=0
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        self.hops+=1
        if self.hops>3 or not safe_public_url(newurl):
            raise ValueError('文章轉址不安全或次數過多，已停止讀取')
        return super().redirect_request(req,fp,code,msg,headers,newurl)

def read_selected_article(url):
    if not safe_public_url(url):
        raise ValueError('請提供公開的 HTTPS 文章網址，不可使用內部網路或本機位址')
    try:
        req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; ZuoxingEditorialResearch/2.0)',
                                 'Accept':'text/html,application/xhtml+xml'})
        with build_opener(PublicOnlyRedirect()).open(req,timeout=12) as response:
            final=response.geturl()
            if not safe_public_url(final):raise ValueError('不允許讀取此轉址網址')
            ctype=response.headers.get('Content-Type','').lower()
            if 'text/html' not in ctype and 'application/xhtml+xml' not in ctype:
                raise ValueError('目前僅支援可公開閱讀的 HTML 文章')
            content=response.read(600_000)
            enc=response.headers.get_content_charset() or 'utf-8'
        parser=ArticleBodyParser()
        parser.feed(content.decode(enc,'replace'))
        uniq=[];seen=set()
        candidates=parser.scoped if sum(len(p) for p in parser.scoped)>=240 else parser.blocks
        for block in candidates:
            key=block[:90]
            if key in seen:continue
            seen.add(key);uniq.append(block)
        article='\n'.join(uniq)[:12500]
        if len(article)<240:
            raise ValueError('這篇文章的可讀正文不足，可能需要登入、禁止抓取，或由 JavaScript 載入。請換公開文章網址。')
        return {'url':final,'title':short_text(parser.title,180),'text':article,'extracted_chars':len(article)}
    except HTTPError as e:
        if e.code in (401,403):raise ValueError('網站限制讀取（401/403），請改選可公開閱讀的文章')
        if e.code==429:raise ValueError('對方網站限制擷取頻率，請稍後再試')
        raise ValueError(f'文章網站回傳 HTTP {e.code}，無法擷取正文')
    except (URLError,TimeoutError) as e:raise ValueError('無法連線至文章網站，請稍後重試')
 
def reader_research(payload):
    """Collect attributable public reader-review leads; do not claim the book was read."""
    subject=str(payload.get('topic','')).strip()[:140]
    subject=re.sub(r'^(閱讀話題|讀書心得|書評)\s*[｜:：]\s*','',subject).strip()
    if not subject:raise ValueError('請先選擇或輸入書名')
    # Remove marketing labels but keep an identifiable book title.
    subject=re.sub(r'〔[^〕]*〕|〖[^〗]*〗','',subject).strip()[:90]
    queries=[f'"{subject}" 書評 心得',f'"{subject}" 讀後感 讀者']
    found=[];errors=[];seen=set()
    for query in queries:
        url='https://news.google.com/rss/search?q='+quote(query)+'&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'
        try:
            req=Request(url,headers={'User-Agent':'Mozilla/5.0'})
            with urlopen(req,timeout=9) as resp:tree=ET.fromstring(resp.read(850_000))
            for item in tree.findall('.//item')[:12]:
                label=short_text(item.findtext('title'),170)
                href=item.findtext('link') or ''
                publisher=short_text(item.findtext('source'),80)
                date=short_text(item.findtext('pubDate'),70)
                if not href.startswith('https://news.google.com/'):continue
                if not (subject[:4] in label or subject[:4] in short_text(item.findtext('description'))):continue
                if href in seen:continue
                seen.add(href)
                found.append({'title':label,'url':href,'publisher':publisher,
                              'published':date,'kind':'公開搜尋線索・內容待查證',
                              'summary':'','usable':False})
                if len(found)>=8:break
        except Exception as e:errors.append(type(e).__name__)
        if len(found)>=8:break
    opinions=[]
    # Read only short public metadata descriptions, not full copyrighted review text.
    for lead in found[:4]:
        page=fetch_public_description(lead['url'])
        if not page or not page['description']:continue
        descriptor=page['description']
        if subject[:4] not in (page['page_title']+' '+descriptor):continue
        # Metadata can be a teaser or site-generated snippet, so label as a limited excerpt.
        lead['summary']=descriptor[:220]
        lead['kind']='公開文章摘要（未核對完整讀者評論）'
        lead['usable']=True
        opinions.append({'source':lead['publisher'] or '公開閱讀分享網頁',
                         'title':lead['title'],'url':lead['url'],
                         'excerpt':descriptor[:200],
                         'status':'網頁公開摘要／讀者觀點待核實'})
    # Independently obtain publisher-provided book summary, not a reader review.
    publisher=None
    try:
        qurl='https://www.googleapis.com/books/v1/volumes?q='+quote('intitle:'+subject)+'&maxResults=5&printType=books'
        data=get_json(qurl,timeout=9)
        for volume in data.get('items',[]):
            info=volume.get('volumeInfo') or {}
            name=short_text(info.get('title'),150)
            desc=short_text(info.get('description'),850)
            if name and desc and (subject[:5] in name or name[:5] in subject):
                publisher={'title':name,'source':'Google Books 書籍中繼資料・出版社介紹（非讀者心得）',
                           'url':info.get('infoLink') or 'https://books.google.com/',
                           'text':desc,'kind':'書籍介紹・供核對'}
                break
    except Exception as e:errors.append('book_metadata_'+type(e).__name__)
    # Search snippets and page metadata are NOT substantiated reader sentiments.
    # Only provide a bibliography of discoverable links if review bodies cannot be read.
    result={'book':subject,'searched_at':datetime.now(timezone.utc).isoformat(),
            'reader_leads':found,'publisher_summary':publisher,
            'important_materials':[],'reader_viewpoints':opinions,'sources':[],
            'status':'leads_only','errors':errors,
            'notice':'讀者評論搜尋僅回傳可點擊線索；沒有取得評論正文就不填入讀者心得。書籍介紹若找到則可獨立用作大綱參考；讀者心得不得冒充本人已閱讀。'}
    if opinions:
        result['status']='public_excerpt_unverified'
        for opinion in opinions:
            result['sources'].append({'title':'公開讀者分享摘要｜'+opinion['source'],'url':opinion['url'],
                                     'verified_text':opinion['excerpt'],'verified':False,'kind':'reader_excerpt'})
    if publisher:
        result['sources'].append({'title':publisher['source']+'｜'+publisher['title'],
                 'url':publisher['url'],'verified_text':publisher['text'],'verified':False,
                 'kind':'publisher_summary'})
        result['important_materials']=['書籍介紹（出版社／書目資料，非讀者意見）','書籍內容仍需對照原書核實']
        result['status']='publisher_and_reader_leads' if opinions else 'publisher_only'
    return result

def topic_context(payload):
    title=short_text(payload.get('title'),180)
    url=str(payload.get('url') or '').strip()
    snippet=short_text(payload.get('snippet'),350)
    category=short_text(payload.get('category'),80)
    if not title:raise ValueError('請先選擇主題')
    sources=[];errors=[]
    if url.startswith('https://'):
        # An RSS snippet is labeled separately until an original public article is readable.
        if snippet:
            sources.append({'title':title,'url':url,'source':short_text(payload.get('source'),90) or '搜尋平台',
                            'text':snippet,'quality':'搜尋摘要／未核對文章正文'})
        page=fetch_public_description(url)
        if page and page.get('description'):
            sources.insert(0,{'title':page.get('page_title') or title,'url':page['url'],
                'source':short_text(payload.get('source'),90) or '原始網頁',
                'text':page['description'],'quality':'公開網頁中繼資料／非正文'})
    query=title.split(' - ')[0][:75]
    cutoff=datetime.now(timezone.utc)-timedelta(days=45)
    feeds=[
      ('Google News','https://news.google.com/rss/search?q='+quote(query)+'&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'),
      ('Bing News','https://www.bing.com/news/search?q='+quote(query)+'&format=rss')
    ]
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=2) as pool:
        jobs=[(p,pool.submit(rss_topics,u,category,p,cutoff,6)) for p,u in feeds]
        for platform,job in jobs:
            try:
                for result in job.result():
                    summary=short_text(result.get('snippet'),250)
                    if not summary:continue
                    if not any(q in result['title'] for q in [query[:6],title[:6]]) and title[:6] not in summary:continue
                    if any(x['url']==result['url'] for x in sources):continue
                    sources.append({'title':result['title'],'url':result['url'],'source':result['source'],
                        'platform':platform,'text':summary,'quality':'跨平台搜尋摘要／未核對文章正文'})
                    if len(sources)>=6:break
            except Exception as e:errors.append(platform+' '+type(e).__name__)
    return {'title':title,'category':category,'sources':sources[:6],
        'errors':errors,'notice':'只使用公開來源中繼資料與搜尋摘要，未取得完整文章或實際讀者評論，不應推論個人經驗。'}

def article_review(payload):
    """Create an extractive, clearly attributed editorial reading note from a public article."""
    url=str(payload.get('url') or '').strip()
    if not url:raise ValueError('請先選取文章或貼入原始文章 HTTPS 網址')
    article=read_selected_article(url)
    text=article['text']
    # Preserve article wording and avoid inventing claims or faux personal experience.
    blocks=[short_text(x,260) for x in text.split('\n')]
    blocks=[x for x in blocks if len(x)>=35 and not re.search(r'訂閱|廣告|分享至|相關新聞|延伸閱讀|版權所有',x)]
    if len(blocks)<2:raise ValueError('文章正文不足以可靠整理心得，請更換可公開閱讀的原始網址')
    keywords=('安全','親子','家庭','露營','營地','環境','山林','步道','天氣','交通','教育','活動','預約','管理')
    scored=sorted(enumerate(blocks),key=lambda item:(-sum(2 for k in keywords if k in item[1]), item[0]))
    indices=sorted(i for i,_ in scored[:min(4,len(scored))])
    excerpts=[blocks[i][:145] for i in indices]
    topic=' '.join(excerpts)
    if re.search('火源|一氧化碳|安全|風險|事故',topic):
        perspective='從營區管理與親子安全的角度，這類資訊值得特別留意。實際行動前應查核現場規範、風險條件及最新公告。'
    elif re.search('環境|生態|步道|山林|保育',topic):
        perspective='從戶外教育與環境友善的角度，除了關注文章事件，也值得思考如何減少活動對自然環境的干擾。實地規劃前仍須確認管制資訊。'
    elif re.search('親子|孩子|家庭|教育',topic):
        perspective='從親子戶外活動的角度，這些內容提醒我們留意孩子年齡、陪同安排及安全邊界；具體做法需要依現場條件評估。'
    else:
        perspective='從作興趣農場的戶外實務角度，閱讀這篇文章的價值在於辨識重要資訊與適用條件，而非只看標題作判斷；發布或規劃前應再核對原始來源。'
    note='【作興趣農場專家閱讀觀察｜依實際取得的文章正文整理，非本人親身經歷】\n'
    note+='文章提及的重點包括：\n'+'\n'.join('• '+p for p in excerpts[:3])
    note+='\n\n閱讀後的專業思考：'+perspective
    note+='\n\n【來源】'+(article['title'] or '公開文章')+'\n'+article['url']
    return {'status':'ready','url':article['url'],'title':article['title'],
      'extracted_chars':article['extracted_chars'],'materials':excerpts,
      'review':note,'source_summary':'\n'.join('• '+x for x in excerpts),
      'note':'擷取到可讀 HTML 正文後才整理，以上為來源摘錄與規則式編輯觀察；非生成式 AI，非個人閱讀經驗，也未驗證文章全部主張。'}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
    def do_GET(self):
        if self.path.startswith('/api/status'):
            self.reply(200,{'ai_configured':False,'bring_your_own_key':False,'research_mode':'即時新聞 RSS；非 Instagram 排名','mode':'offline_editor'});return
        if self.path.startswith('/api/research'):
            self.reply(200,get_news());return
        return super().do_GET()
    def do_POST(self):
        if self.path not in ('/api/reader-research','/api/topic-context','/api/article-review'):
            self.reply(404,{'error':'功能已移除：本站不再提供 OpenAI API 呼叫。'});return
        try:
            length=int(self.headers.get('Content-Length','0'))
            if length<2 or length>12000:raise ValueError('請求資料超出限制')
            payload=json.loads(self.rfile.read(length))
            self.reply(200,article_review(payload) if self.path=='/api/article-review' else topic_context(payload) if self.path=='/api/topic-context' else reader_research(payload))
        except Exception as e:self.reply(400,{'error':str(e)[:250]})
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
    print(f'作興趣 IG 輪播設計中心 http://{HOST}:{PORT} | 免金鑰模板與圖片編輯模式')
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
