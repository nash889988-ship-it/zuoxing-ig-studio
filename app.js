'use strict';
const $ = s=>document.querySelector(s);
const $$ = s=>[...document.querySelectorAll(s)];
const styles={
 forest:{name:'森林療癒',bg:'#244938',fg:'#ffffff',accent:'#d3bc7e'},
 family:{name:'親子溫馨',bg:'#926d59',fg:'#ffffff',accent:'#f8d7ad'},
 premium:{name:'精品質感',bg:'#2b2a29',fg:'#ffffff',accent:'#c9a876'},
 viral:{name:'強對比爆款',bg:'#191919',fg:'#ffffff',accent:'#f5cd44'},
 dark:{name:'暗黑懸疑',bg:'#131b29',fg:'#ffffff',accent:'#b4bad2'},
 minimal:{name:'極簡雜誌',bg:'#e1e1dc',fg:'#272b2a',accent:'#b9a16d'}
};
const state={topics:[],accounts:[],slides:[],images:[],uploads:[],style:'forest',current:0,ai:false};
let noticeTimer;
function toast(s){const e=$('#toast');e.textContent=s;e.classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>e.classList.remove('show'),5000)}
function activate(id){$$('.page').forEach(x=>x.classList.toggle('active',x.id===id));$$('.step').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));window.scrollTo({top:0,behavior:'smooth'});if(id==='design')renderEditor();if(id==='download')renderExports()}
$$('.step').forEach(e=>e.addEventListener('click',()=>activate(e.dataset.tab)));
$$('.subtab').forEach(e=>e.addEventListener('click',()=>{$$('.subtab').forEach(x=>x.classList.toggle('current',x===e));$$('.list-view').forEach(x=>x.classList.toggle('active',x.id===e.dataset.list))}));
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function linkOk(url){try{let u=new URL(url);return ['https:','http:'].includes(u.protocol)}catch{return false}}
function formatTime(x){if(!x)return'日期未取得';let d=new Date(x);return isNaN(d)?String(x):new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
const metric=x=>(typeof x==='number'&&Number.isFinite(x))?x.toLocaleString('zh-TW'):'未取得';
const bookMonthSnapshot=[{"rank":1,"title":"臺灣漫遊錄","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"},{"rank":2,"title":"我的黑道姑姑：教我的99件事","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"},{"rank":3,"title":"都市傳說第三部3：密室逃脫","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"},{"rank":4,"title":"老派少女購物路線〖暢銷紀念版〗","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"},{"rank":5,"title":"百六：第二卷 萬廟之都（隨書附贈劍指沉浸式體驗卡）","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"},{"rank":6,"title":"日花閃爍（十刷限量結穗版）","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"},{"rank":7,"title":"賣瓜的人〖文壇年度耀眼新星〗","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"},{"rank":8,"title":"截金","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"},{"rank":9,"title":"早春晴朗〖01－04套書〗：Netflix熱播同名電視劇原著小說","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"},{"rank":10,"title":"工頭堅的京都時光2（限量作者親簽版）：近現代篇","source":"博客來｜本月暢銷榜・華文創作","source_url":"https://activity.books.com.tw/crosscat/show/books66_top","observed_at":"2026-11-18","category":"華文創作","rank_scope":"單一書店・單一分類月榜；非全台統計"}];
function renderBooks(){
 const root=$('#bookCards');if(!root)return;
 root.replaceChildren();
 $('#bookNum').textContent=String(bookMonthSnapshot.length);
 for(const item of bookMonthSnapshot){
  const el=document.createElement('article');el.className='research-card';
  const pill=document.createElement('span');pill.className='pill';pill.textContent='TOP '+item.rank+' ｜ 華文創作';
  const h=document.createElement('h3');h.textContent=item.title;
  const meta=document.createElement('div');meta.className='meta';meta.textContent='來源：'+item.source+'\n資料核對：2026/11/18｜固定快照，最新名次請查原始榜單';
  meta.style.whiteSpace='pre-line';
  const actions=document.createElement('div');actions.className='card-actions';
  const choose=document.createElement('button');choose.className='secondary';choose.textContent='＋ 以這本書為主題';
  choose.addEventListener('click',()=>{
    resetEditorialForNewTopic();$('#topicInput').value='閱讀話題｜'+item.title;$('#contentTypeInput').value='book_review';$('#materialsInput').value='';$('#readingNotesInput').value='';$('#sourceTitleInput').value=item.source;$('#sourceUrlInput').value=item.source_url;$('#sourceTextInput').value='';
    $('#readerOpinionsInput').value='';$('#detailsInput').value='參考書籍：'+item.title+'\n來源：'+item.source+'\n核對日期：2026/11/18\n官方榜單：'+item.source_url+'\n注意：目前僅取得書名與分類排行，尚無完整內文授權資料；請自行提供摘要或可引用的資訊後，再製作知識性輪播，不能編造書中內容。';
    activate('write');toast('已帶入書籍主題，正在搜尋公開讀者分享…');fetchReaderResearch();
  });
  const link=document.createElement('a');link.href=item.source_url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='查官方榜單 ↗';
  actions.append(choose,link);el.append(pill,h,meta,actions);root.appendChild(el);
 }
}
renderBooks();
function resetEditorialForNewTopic(){readerRequestSerial++;articleRequestSerial++;$('#selectedArticleUrl').value='';$('#articleExtractStatus').textContent='請選擇搜尋到的文章，或貼入可公開閱讀的網址。';state.slides=[];state.images=[];state.current=0;$('#captionInput').value='';$('#hashtagsInput').value='';$('#verificationNotice').hidden=true;$('#extraSources').replaceChildren();$('#readerOpinionsInput').value='';$('#readingNotesInput').value='';$('#readerResults').replaceChildren();$('#readerResults').hidden=true;$('#readerFetchStatus').textContent='選擇書籍後可自動整理公開來源';$('#scriptMode').textContent='新主題｜待生成';renderScript()}
function selectTopic(item){resetEditorialForNewTopic();$('#topicInput').value=item.title||item.handle||'';$('#contentTypeInput').value=/旅遊|景點|步道|活動|南投/.test(item.category||'')?'travel':'knowledge';$('#detailsInput').value=`來源：${item.source||item.source_url||'使用者提供'}\n資料日期：${formatTime(item.published||item.observed_at)}\n參考連結：${item.url||''}\n請補充來源內文或可查證的事實，AI 不會僅憑標題猜測。`;$('#sourceTitleInput').value=item.source||'';$('#sourceUrlInput').value=item.url||'';$('#sourceTextInput').value='';$('#materialsInput').value='';$('#readingNotesInput').value='';$('#selectedArticleUrl').value=item.url||'';activate('write');toast('已選主題與原始來源，可點「讀取這篇文章」自動帶入重點；Google News 中轉連結若無法讀取，請貼原始文章網址。')}
function safeResearchItem(item,type){if(!item||typeof item!=='object')return null;let u=type==='accounts'?item.url:item.url; if(!linkOk(u))return null;const o={...item};o.title=String(o.title||o.handle||'未命名').slice(0,220);o.category=String(o.category||'未分類').slice(0,40);o.url=u;o.source=String(o.source||o.source_url||'來源未提供').slice(0,130);['likes','views','comments'].forEach(k=>{if(!Number.isFinite(o[k])||o[k]<0)o[k]=null});return o}
function renderResearch(){const topicFilter=$('#topicFilter').value;let topics=state.topics.filter(t=>topicFilter==='all'||t.category===topicFilter);$('#topicNum').textContent=state.topics.length;$('#accountNum').textContent=state.accounts.length;const tc=$('#topicCards');tc.replaceChildren();if(!topics.length){tc.innerHTML='<div class="empty">目前沒有符合類別的已取得資料。可更新新聞線索或匯入有來源的資料。</div>'}topics.slice(0,40).forEach(item=>tc.appendChild(createCard(item,false)));const ac=$('#accountCards');ac.replaceChildren();if(!state.accounts.length)ac.innerHTML='<div class="empty">目前無法取得可核實的每週帳號觀察值。請匯入具來源的 IG 帳號資料，不會憑空湊滿十個。</div>';state.accounts.slice(0,10).forEach(item=>ac.appendChild(createCard(item,true)))}
function createCard(item,isAccount){const card=document.createElement('article');card.className='research-card';const published=item.published||item.observed_at;const source=item.source||item.source_url||'來源未註明';const tag=isAccount?'可驗證參考帳號（非排行）':(item.kind||'來源線索（非 IG 排名）');card.innerHTML=`<span class="pill">${esc(item.category||'露營')}</span><h3>${esc(item.title)}</h3><div class="meta">${esc(tag)}<br>資料日期：${esc(formatTime(published))}<br>來源：${esc(source)}</div><div class="metrics">公開互動量｜按讚 ${metric(item.likes)} · 留言 ${metric(item.comments)} · 觀看 ${metric(item.views)}</div><div class="card-actions"><button class="secondary">＋ 選這個主題</button><button class="secondary article-pick">讀取文章重點</button><a rel="noopener noreferrer" target="_blank">查看來源 ↗</a></div>`;card.querySelector('a').href=item.url;card.querySelector('button').addEventListener('click',()=>selectTopic(item));card.querySelector('.article-pick').addEventListener('click',()=>{selectTopic(item);extractArticleIntoFields()});return card}
$('#topicFilter').addEventListener('change',renderResearch);
$('#researchBtn').addEventListener('click',async()=>{const b=$('#researchBtn');b.disabled=true;b.textContent='正在讀取可驗證線索…';try{let r=await fetch('/api/research');let data=await r.json();if(!r.ok)throw Error(data.error||'讀取失敗');state.topics=(data.topics||[]).map(x=>safeResearchItem(x,'topics')).filter(Boolean);state.accounts=[];renderResearch();$('#researchDate').textContent='資料抓取：'+formatTime(data.updated)+'｜最近7天';toast(state.topics.length?`找到 ${state.topics.length} 則近期新聞線索（不是IG排名）`:(data.errors||[]).join('；')||'本次沒有取得有效線索，可手動匯入');}catch(e){toast('研究服務暫時無法連線：'+e.message)}finally{b.disabled=false;b.textContent='↻ 更新近 7 天資料'}});
$('#importBtn').addEventListener('click',()=>{try{let d=JSON.parse($('#importJson').value);let ts=(Array.isArray(d.topics)?d.topics:[]).map(x=>({...x,kind:'使用者匯入（待人工查證）'})).map(x=>safeResearchItem(x,'topics')).filter(Boolean);let ac=(Array.isArray(d.accounts)?d.accounts:[]).filter(x=>/^@[\w.]{1,40}$/.test(String(x.handle||''))&&linkOk(x.url)).map(x=>({...x,title:x.handle,kind:'使用者匯入（非IG排名）'})).map(x=>safeResearchItem(x,'accounts')).filter(Boolean);state.topics=[...ts,...state.topics].slice(0,80);state.accounts=ac.slice(0,10);renderResearch();toast(`匯入 ${ts.length} 則議題、${ac.length} 個帳號；請自行核對來源`)}catch(e){toast('JSON 格式有誤：'+e.message)}});
const baseTitles=['這個露營知識你知道嗎？','先確認環境與氣象','裝備準備這樣分類','孩子的戶外安全重點','營地周遭如何觀察？','飲食、用火與清潔細節','常見錯誤與正確做法','出發前的最後檢查','收藏這份重點清單'];
const baseBodies=['先確認這個主題的來源與適用情境。資料若尚未查證，請以實際公告為準，不要只憑網路傳聞安排旅程。','出發前查看中央氣象署預報與目的地最新公告。遇豪雨、強風或警戒資訊，應調整或取消行程。','先列睡眠、照明、飲水、保暖和個人衛生用品清單；按孩子年齡、季節與營區規定調整，不必盲目購買裝備。','先劃定孩子可活動的範圍，遠離水域、爐具與車道；戲水時由成人持續在旁看顧，不讓孩子單獨靠近水邊。','觀察地面排水、樹枝、坡度與通道，不在危險邊坡、乾溪床或警示區搭設帳篷；遵守現場管理人員指示。','炊事器具只在通風良好的戶外安全區使用，帳內不可使用炭火及燃燒式爐具；並妥善保存食物與清理垃圾。','常見誤區是把網路推薦當成現場保證。出發前應核對營區開放、道路通行、預約方式與最新注意事項。','將天氣、道路、預訂、裝備和緊急聯絡資訊重新檢查一次；資訊不足的部分，先向管理單位求證。','將這份露營知識收藏起來，也分享給準備帶孩子出遊的朋友。'];
function template(){if($('#contentTypeInput').value==='book_review'){toast('閱讀書評不能套用露營模板；請提供書籍摘要與心得後使用 AI，避免編造內容。');return}let n=Number($('#countInput').value), topic=$('#topicInput').value.trim();if(!topic){toast('請先輸入主題');return}const goal=$('#goalInput').value;state.slides=Array.from({length:n},(_,i)=>({title:i===0?topic.slice(0,25):i===n-1?'下一趟親子旅行，一起出發！':baseTitles[Math.min(i,baseTitles.length-1)],body:i===n-1?goal==='LINE詢問與訂位'?'加入 LINE @wifi558855，詢問露營與訂位資訊。':goal==='增加追蹤'?'追蹤 @interest558855，發現更多南投露營故事。':goal==='留言互動'?'你有哪些露營經驗？歡迎留言和大家分享。':'收藏這份內容，分享給想一起露營的朋友。':baseBodies[Math.min(i,baseBodies.length-1)],image_prompt:topic+'，臺灣露營親子生活自然攝影、無字背景'}));state.images=Array.from({length:n},()=>null);state.current=0;$('#captionInput').value=`🌿 ${topic}\n和家人一起走進南投山林，留下值得記住的時光。\n📩 官賴 @wifi558855\n🔗 訂位 https://forinterest.hexa.tw/`;$('#hashtagsInput').value='#作興趣農場 #南投露營 #親子露營 #露營知識 #親子旅行 #週末去哪玩';$('#scriptMode').textContent='離線模板（可手動編輯）';renderScript();toast('已產生可編輯的模板腳本；請逐張補充真實素材')}
$('#templateBtn').addEventListener('click',template);
// One API key can be used for repeated calls; persistence is strictly opt-in.
// Browser localStorage is unencrypted and must not be enabled on shared devices.
const API_KEY_STORAGE='zuoxing_openai_key_optin_v1';
const keyField=$('#apiKeyInput'),rememberField=$('#rememberKeyInput'),forgetButton=$('#forgetKeyBtn'),keyStatus=$('#keyStorageStatus');
function validApiKey(key){return /^sk-[A-Za-z0-9_-]{16,250}$/.test(key)}
function showKeyStatus(message){keyStatus.textContent=message}
function removeStoredKey(){try{localStorage.removeItem(API_KEY_STORAGE);return true}catch{return false}}
function saveKeyIfOptedIn(){
 const key=keyField.value.trim();
 if(!rememberField.checked){removeStoredKey();showKeyStatus('目前不會持久儲存金鑰；關閉頁面後需再次貼入。');return}
 if(!validApiKey(key)){removeStoredKey();showKeyStatus('請先貼入有效的 API 金鑰才能記住。');return}
 try{localStorage.setItem(API_KEY_STORAGE,key);showKeyStatus('已記住這台裝置的 API 金鑰（瀏覽器未加密儲存）；下次開啟會自動帶入。')}
 catch{rememberField.checked=false;showKeyStatus('瀏覽器不允許儲存金鑰；本次仍可直接使用。')}
}
try{
 const stored=localStorage.getItem(API_KEY_STORAGE);
 if(stored && validApiKey(stored)){
  keyField.value=stored;rememberField.checked=true;
  showKeyStatus('已從這台裝置恢復你原本的 API 金鑰；不需要重新建立。若不是私人裝置請立即清除。');
 }else if(stored){removeStoredKey()}
}catch{showKeyStatus('瀏覽器儲存空間無法使用；貼入金鑰後仍可在本次頁面使用。')}
rememberField.addEventListener('change',saveKeyIfOptedIn);
keyField.addEventListener('change',saveKeyIfOptedIn);
keyField.addEventListener('input',()=>{
 if(rememberField.checked)showKeyStatus('正在修改金鑰，離開欄位後會更新已記住的內容。');
});
forgetButton.addEventListener('click',()=>{
 removeStoredKey();rememberField.checked=false;keyField.value='';
 showKeyStatus('已清除這台裝置記住的金鑰，也清空目前輸入欄位。');
 toast('已清除本裝置儲存的 API 金鑰');
});
async function postJSON(url,obj){const key=$('#apiKeyInput').value.trim();if(!validApiKey(key))throw Error('請先輸入有效的個人 OpenAI API 金鑰');let r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-User-OpenAI-Key':key},cache:'no-store',body:JSON.stringify(obj)});let d=await r.json();if(!r.ok)throw Error(d.error||'API 錯誤');return d}
let readerRequestSerial=0;
const AUTO_READER_MARK='【自動整理：公開讀者觀點，非本人閱讀心得】';
const NO_REVIEW='【資料不足】尚未取得可核對的公開讀者心得正文，不能自行編造讀後感。';
const NO_SOURCE='【資料不足】只找到搜尋連結，尚未取得可供引用的文章或書籍介紹文字。';
function renderAutoReviewText(reviews){
 if(!reviews.length)return AUTO_READER_MARK+'\n'+NO_REVIEW;
 return AUTO_READER_MARK+'\n'+reviews.slice(0,4).map((x,i)=>
  '讀者分享摘要 '+(i+1)+'（來源：'+(x.source||'未標明')+'）\n'+x.excerpt+'\n原始連結：'+x.url
 ).join('\n\n')+'\n（以上是公開網站摘要，需人工核對，不代表使用者已閱讀本書）';
}
function uniqueMaterialLines(publisher,reviews){
 const arr=[];
 if(publisher && publisher.text){
  const phrases=publisher.text.split(/[。！？\n]/).map(x=>x.trim()).filter(x=>x.length>=10&&x.length<=180);
  for(const p of phrases.slice(0,4))arr.push('書籍介紹：'+p);
 }
 for(const v of reviews.slice(0,2)){
  if(v.excerpt)arr.push('公開讀者觀點（待核實）：'+v.excerpt.slice(0,105)+'（來源：'+(v.source||'公開評論')+'）');
 }
 return arr.length?arr.slice(0,6).join('\n'):'【資料不足】未取得可確認的內容重點，請提供書籍介紹或可核對的評論。';
}
async function fetchReaderResearch(){
 const topic=$('#topicInput').value.trim();
 if(!topic){toast('請先選擇書籍或輸入書名');return}
 const button=$('#fetchReaderBtn'),serial=++readerRequestSerial;
 button.disabled=true;button.textContent='正在搜尋並填寫…';
 $('#readerFetchStatus').textContent='正在擷取書籍介紹、公開讀者分享與可引用的來源摘要';
 try{
  const response=await fetch('/api/reader-research',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({topic})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'研究服務無法讀取');
  if(serial!==readerRequestSerial || topic!==$('#topicInput').value.trim())return;
  const opinions=(data.reader_viewpoints||[]).filter(x=>x.excerpt&&x.url);
  const leads=data.reader_leads||[],publisher=data.publisher_summary;
  const readerText=renderAutoReviewText(opinions);
  // Fill the three explicitly requested fields while keeping clear provenance and editability.
  $('#materialsInput').value=uniqueMaterialLines(publisher,opinions);
  $('#readingNotesInput').value=readerText;
  $('#readerOpinionsInput').value=readerText;
  const quoted=[];
  if(publisher?.text)quoted.push('【書籍介紹；非原書全文】\n'+publisher.text+'\n來源：'+publisher.source+'\n網址：'+publisher.url);
  for(const x of opinions.slice(0,3))
   quoted.push('【公開讀者文章短摘要；非完整評論】\n'+x.excerpt+'\n來源：'+(x.source||'公開網頁')+'\n網址：'+x.url);
  $('#sourceTextInput').value=quoted.length?quoted.join('\n\n'):NO_SOURCE;
  if(publisher){
   $('#sourceTitleInput').value=publisher.source;
   $('#sourceUrlInput').value=publisher.url;
  }else if(opinions.length){
   $('#sourceTitleInput').value='公開讀者分享摘要（待核對）';
   $('#sourceUrlInput').value=opinions[0].url;
  }else{
   $('#sourceTitleInput').value='';$('#sourceUrlInput').value='';
  }
  const panel=$('#readerResults');panel.replaceChildren();
  const note=document.createElement('p');note.className='fineprint';
  note.textContent='已自動填寫三個欄位；找到 '+leads.length+' 則書評線索、'+opinions.length+' 則可讀短摘要，'+(publisher?'取得書籍介紹。':'未取得書籍介紹。')+' 欄位中的公開觀點不是你的親身心得。';
  panel.appendChild(note);
  for(const item of leads.slice(0,8)){
   const line=document.createElement('div');line.className='reader-result-line';
   const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.title;
   const small=document.createElement('small');
   small.textContent=(item.publisher||'公開搜尋')+(item.usable?'｜短摘要已擷取':'｜僅搜尋線索，無法確認正文');
   const choose=document.createElement('button');choose.type='button';choose.className='secondary small';choose.textContent='選擇這篇文章並擷取正文';
   choose.addEventListener('click',()=>{$('#selectedArticleUrl').value=item.url;extractArticleIntoFields();});
   line.append(a,small,choose);panel.appendChild(line);
  }
  panel.hidden=false;
  $('#readerFetchStatus').textContent=(publisher||opinions.length)?'三個欄位已填寫，請核對內容與來源':'三個欄位已標示資料不足，尚無可引用正文';
  toast((publisher||opinions.length)?'已自動填好三個欄位，請檢查來源':'只找到搜尋線索，已在三欄標示資料不足，未編造內容');
 }catch(e){$('#readerFetchStatus').textContent='搜尋失敗，原欄位未變更';toast('自動填寫失敗：'+e.message)}
 finally{if(serial===readerRequestSerial){button.disabled=false;button.textContent='↻ 自動搜尋並填寫三個欄位'}}
}
$('#fetchReaderBtn').addEventListener('click',fetchReaderResearch);
let articleRequestSerial=0;
async function extractArticleIntoFields(){
 const url=$('#selectedArticleUrl').value.trim();
 if(!url || !linkOk(url) || !url.startsWith('https://')){toast('請先選擇或貼入公開 HTTPS 文章網址');return}
 const button=$('#extractArticleBtn'),serial=++articleRequestSerial;
 button.disabled=true;button.textContent='正在讀取正文與整理文章…';
 $('#articleExtractStatus').textContent='正在取得選擇的文章正文，並由 AI 整理成三個欄位；這會使用你的 API 額度。';
 try{
  const result=await postJSON('/api/article-extract',{url,topic:$('#topicInput').value.trim()});
  if(serial!==articleRequestSerial || url!==$('#selectedArticleUrl').value.trim())return;
  if(result.status!=='ready' || !result.source_summary || !result.reader_viewpoint ||
      !Array.isArray(result.materials) || !result.materials.length)
   throw Error('文章擷取結果不完整，未更新欄位');
  const from='【根據所選文章的 AI 提要，非本人閱讀心得】';
  $('#materialsInput').value=result.materials.map(v=>'• '+v).join('\n');
  $('#readingNotesInput').value=from+'\n'+result.reader_viewpoint+
    '\n\n資料來源：'+(result.article_title||url)+'\n原始網址：'+result.url;
  $('#readerOpinionsInput').value=from+'\n'+result.reader_viewpoint+'\n來源：'+result.url;
  $('#sourceTextInput').value='【已讀取文章正文後的 AI 摘要；非原文逐字引用】\n'+result.source_summary+
    '\n\n文章：'+(result.article_title||'')+'\n來源：'+result.url;
  $('#sourceTitleInput').value=result.article_title||'所選公開文章';
  $('#sourceUrlInput').value=result.url;
  $('#articleExtractStatus').textContent='已從所選文章正文整理 '+result.extracted_chars+
    ' 字，成功自動填寫三個欄位。原文未完整複製，請在發布前核對。';
  toast('文章正文已整理完畢，三個指定欄位已自動填寫。');
 }catch(e){$('#articleExtractStatus').textContent='無法擷取這篇文章：'+e.message+'。原本的三個欄位未被覆蓋。';toast('文章提要失敗：'+e.message)}
 finally{if(serial===articleRequestSerial){button.disabled=false;button.textContent='✦ 讀取這篇文章並自動填寫三個欄位'}}
}
$('#extractArticleBtn').addEventListener('click',extractArticleIntoFields);

$('#addSourceBtn').addEventListener('click',()=>{
 const host=$('#extraSources');if(host.children.length>=7){toast('最多可填入8組來源');return}
 const box=document.createElement('div');box.className='source-row';
 box.innerHTML='<div class="row-between"><strong>其他資料來源</strong><button type="button" class="secondary small remove-source">移除</button></div><label>來源名稱<input class="extra-source-title" placeholder="例：出版社介紹、官方旅遊公告"/></label><label>原始網址<input class="extra-source-url" placeholder="https://..."/></label><label>已閱讀的實際摘要或段落<textarea class="extra-source-text" rows="3" placeholder="貼入可以作為內容依據的資訊，勿只貼網址"></textarea></label>';
 box.querySelector('.remove-source').addEventListener('click',()=>box.remove());
 host.appendChild(box);
});
function collectExtraSources(){
 return [...document.querySelectorAll('.source-row')].map((box,i)=>({
  id:'source_'+(i+2),title:box.querySelector('.extra-source-title').value.trim(),
  url:box.querySelector('.extra-source-url').value.trim(),
  verified_text:box.querySelector('.extra-source-text').value.trim(),verified:false
 })).filter(x=>x.title||x.url||x.verified_text);
}
$('#aiScriptBtn').addEventListener('click',async()=>{
 const topic=$('#topicInput').value.trim();if(!topic){toast('請先輸入主題');return}
 const b=$('#aiScriptBtn');b.disabled=true;b.textContent='AI 正在核對資料並撰寫…';
 $('#verificationNotice').hidden=true;
 try{
  const sourceUrl=$('#sourceUrlInput').value.trim(),sourceText=$('#sourceTextInput').value.trim(),sourceTitle=$('#sourceTitleInput').value.trim();
  if(sourceUrl&&!linkOk(sourceUrl))throw Error('來源網址必須是有效的 HTTP/HTTPS 網址');
  const sources=[...((sourceUrl||sourceText||sourceTitle)?[{id:'source_1',title:sourceTitle,url:sourceUrl,verified_text:sourceText,verified:false}]:[]),...collectExtraSources()];if(sources.some(x=>x.url&&!linkOk(x.url)))throw Error('有資料來源網址格式不正確，請檢查網址');
  const payload={
   topic,content_type:$('#contentTypeInput').value,story_details:$('#detailsInput').value,
   important_materials:$('#materialsInput').value.split('\n').map(x=>x.trim()).filter(Boolean),
   reading_notes:($('#readingNotesInput').value.startsWith(AUTO_READER_MARK)||$('#readingNotesInput').value.startsWith('【根據所選文章的 AI 提要，非本人閱讀心得】'))?'':$('#readingNotesInput').value,public_reader_viewpoints:$('#readerOpinionsInput').value,sources,
   slide_count:Number($('#countInput').value),max_chars_per_slide:120,
   goal:$('#goalInput').value,tone:$('#toneInput').value,visual_style:state.style
  };
  const d=await postJSON('/api/script',payload);
  if(d.status==='needs_sources'){
   $('#scriptMode').textContent='資料不足｜請補充可靠摘要';
   const list=(d.missing_materials||[]).map(x=>'• '+x).join('\n');
   const el=$('#verificationNotice');el.textContent='生成前需要補充資料：\n'+list;el.hidden=false;
   toast('資料不足：請補充來源摘要或真實心得；未產生付費 AI 腳本。');return;
  }
  if(d.status!=='ready'||!Array.isArray(d.slides)||d.slides.length!==payload.slide_count)throw Error('AI 沒有回傳符合張數的正式腳本');
  if(d.slides.some(x=>Array.from((x.title||'')+(x.body||'')).length>120))throw Error('AI 有分鏡超過120字，已停止套用');
  state.slides=d.slides.map(x=>({title:x.title||'',body:x.body||'',image_prompt:x.image_prompt||'',source_ids:x.source_ids||[]}));
  state.images=Array.from({length:state.slides.length},()=>null);
  $('#captionInput').value=d.caption||'';$('#hashtagsInput').value=(d.hashtags||[]).join(' ');state.current=0;
  $('#scriptMode').textContent='V2.0｜精準腳本已產生';renderScript();
  const verification=(d.verification_notes||[]).filter(Boolean);
  if(verification.length){const el=$('#verificationNotice');el.textContent='發布前請核對：\n'+verification.map(x=>'• '+x).join('\n');el.hidden=false}
  toast('AI 腳本完成：已檢查張數與120字限制，發布前仍請確認書籍或旅遊事實。');
 }catch(e){toast('AI 腳本失敗：'+e.message)}
 finally{b.disabled=false;b.textContent='✦ AI 自動產生精準腳本'}
});
function renderScript(){let root=$('#slideEditor');root.replaceChildren();$('#slideCountText').textContent=state.slides.length+' 張';if(!state.slides.length){root.innerHTML='<div class="empty">尚未建立腳本。</div>';return}state.slides.forEach((s,i)=>{let el=document.createElement('div');el.className='script-item';el.innerHTML=`<div>分鏡 ${i+1} · 編輯排序標記僅在工作台顯示</div><input aria-label="本張標題"/><textarea rows="2" aria-label="本張內容"></textarea><div class="count"></div>`;let [a,b]=[el.querySelector('input'),el.querySelector('textarea')];a.value=s.title;b.value=s.body;let c=el.querySelector('.count');function sync(){s.title=a.value;s.body=b.value;let n=Array.from(s.title+s.body).length;c.textContent=`${n} / 120 字`;(c.style.color=n>120?'#bd4d34':'#78847d');if(state.current===i)renderPreview()}a.addEventListener('input',sync);b.addEventListener('input',sync);sync();root.appendChild(el)})}
$('#copyCaptionBtn').addEventListener('click',async()=>{let text=$('#captionInput').value+'\n\n'+$('#hashtagsInput').value;try{await navigator.clipboard.writeText(text);toast('已複製貼文與 Hashtag')}catch{toast('瀏覽器限制剪貼簿，請手動選取文案複製')}});
$('#toDesignBtn').addEventListener('click',()=>{if(!state.slides.length){toast('請先產生輪播腳本');return}activate('design')});
const pick=$('#stylePicker');Object.entries(styles).forEach(([id,s])=>{let b=document.createElement('button');b.className='style-swatch'+(state.style===id?' selected':'');b.style.background=s.bg;b.style.color=s.fg;b.innerHTML=`<strong>${esc(s.name)}</strong><span>故事開始</span>`;b.addEventListener('click',()=>{state.style=id;$$('.style-swatch').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');renderPreview()});pick.appendChild(b)});
function renderEditor(){const sel=$('#slideSelect');sel.replaceChildren();state.slides.forEach((s,i)=>{let o=document.createElement('option');o.value=i;o.textContent=`分鏡 ${i+1}｜${s.title.slice(0,16)}`;sel.appendChild(o)});if(!state.slides.length){renderPreview();return}state.current=Math.max(0,Math.min(state.current,state.slides.length-1));sel.value=state.current;const s=state.slides[state.current];$('#editTitle').value=s.title;$('#editBody').value=s.body;$('#editImagePrompt').value=s.image_prompt;$('#previewIndex').textContent=`${state.current+1} / ${state.slides.length}（僅編輯介面顯示）`;renderPreview();syncCleanReview()}
$('#slideSelect').addEventListener('change',()=>{state.current=Number($('#slideSelect').value);renderEditor()});['editTitle','editBody','editImagePrompt'].forEach(id=>$('#'+id).addEventListener('input',()=>{let s=state.slides[state.current];if(!s)return;s.title=$('#editTitle').value;s.body=$('#editBody').value;s.image_prompt=$('#editImagePrompt').value;renderPreview()}));
$('#prevBtn').addEventListener('click',()=>{state.current=(state.current-1+state.slides.length)%state.slides.length;renderEditor()});$('#nextBtn').addEventListener('click',()=>{state.current=(state.current+1)%state.slides.length;renderEditor()});
$('#photosInput').addEventListener('change',async e=>{const files=[...e.target.files].filter(f=>f.type.startsWith('image/')).slice(0,15);state.uploads=[];for(let f of files){try{let url=URL.createObjectURL(f);let image=await loadImage(url);state.uploads.push(image)}catch{}}$('#photosStatus').textContent=`已選 ${state.uploads.length} 張照片，僅在本機瀏覽器處理`;toast(`已讀取 ${state.uploads.length} 張照片，按「依序套用上傳照片」即可套用`)});
$('#applyPhotos').addEventListener('click',()=>{if(!state.slides.length||!state.uploads.length){toast('請先產生腳本並上傳照片');return}state.images=state.slides.map((slide,i)=>{watermarkEdits.delete(slide);return state.uploads[i%state.uploads.length]});cleanReviews.clear();renderPreview();syncCleanReview();toast(`已套用 ${state.uploads.length} 張上傳照片；可逐張下載`) });
function loadImage(src){return new Promise((resolve,reject)=>{let img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
const cleanReviews=new Map();
function syncCleanReview(){
 const i=state.current;
 $('#cleanReviewedInput').checked=cleanReviews.get(i)===state.images[i]&&!!state.images[i];
 $('#cleanOutputStatus').textContent=$('#cleanReviewedInput').checked?
 '本張已人工確認；若重新生成或更換背景，需再次檢查。':
 '本張尚未完成可見標記人工檢查。AI 生圖可能仍出現雜字或假 LOGO。';
}
$('#cleanReviewedInput').addEventListener('change',()=>{
 if(!state.images[state.current]){
  $('#cleanReviewedInput').checked=false;toast('請先選擇或生成背景圖片');return;
 }
 if($('#cleanReviewedInput').checked)cleanReviews.set(state.current,state.images[state.current]);
 else cleanReviews.delete(state.current);
 syncCleanReview();
});
function cleanImagePrompt(slide){
 const base=(slide.image_prompt||slide.title||'精緻編輯攝影背景').trim();
 return $('#cleanBgInput').checked?
 base+'\nIMPORTANT: background image ONLY; no lettering, no typography, no words, no glyphs, no numerals, no signatures, no fake brand marks, no graphic stamps, no decorative watermark-like elements. Leave intentional clean negative space for separate website typography. Do not alter or obscure third-party rights marks in existing reference images.':
 base;
}
async function generateCleanBackground(force=false){
 if(!state.slides.length){toast('請先產生腳本');return}
 const index=state.current,slide=state.slides[index],previousImage=state.images[index],btn=force?$('#regenerateCleanBtn'):$('#aiBgBtn');
 btn.disabled=true;btn.textContent='AI 正在生成背景（付費 API）…';
 try{
  const data=await postJSON('/api/image',{prompt:cleanImagePrompt(slide),style:styles[state.style].name});
  const image=await loadImage(data.data_url);
  if(state.slides[index]!==slide||state.images[index]!==previousImage){toast('分鏡或背景已更換，生成結果未套用。');return}
  watermarkEdits.delete(slide);
  state.images[index]=image;cleanReviews.delete(index);
  if(state.current===index){renderPreview();syncCleanReview()}
  toast('已生成背景。請目視檢查是否有多餘文字、假 LOGO 或浮水印樣式。');
 }catch(e){toast('AI 背景生成失敗：'+e.message)}
 finally{btn.disabled=false;btn.textContent=force?'↻ 重新生成乾淨背景':'✦ AI 產生這一張背景'}
}
$('#aiBgBtn').addEventListener('click',()=>generateCleanBackground(false));
$('#regenerateCleanBtn').addEventListener('click',()=>generateCleanBackground(true));
$('#removeBgBtn').addEventListener('click',()=>{
 if(!state.slides.length){toast('請先產生腳本');return}
 watermarkEdits.delete(state.slides[state.current]);
 state.images[state.current]=null;cleanReviews.delete(state.current);
 renderPreview();syncCleanReview();toast('已改用無照片的純色設計背景，保留標題與內文。');
});
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function textLines(ctx,text,maxWidth){let output=[];for(let raw of String(text||'').split('\n')){if(!raw){output.push('');continue}let line='';for(let ch of raw){if(ctx.measureText(line+ch).width>maxWidth && line){output.push(line);line=ch}else line+=ch}if(line)output.push(line)}return output}
function drawCover(ctx,img){let sc=Math.max(1080/img.naturalWidth,1350/img.naturalHeight);let w=img.naturalWidth*sc,h=img.naturalHeight*sc;ctx.drawImage(img,(1080-w)/2,(1350-h)/2,w,h)}
function drawSlide(canvas,i){
 const ctx=canvas.getContext('2d'),W=1080,H=1350;
 const slide=state.slides[i]||{title:'作興趣農場',body:'歡迎分享值得收藏的內容'};
 const style=styles[state.style],image=state.images[i],variant=((i%3)+3)%3;
 const title=String(slide.title||'').trim(),body=String(slide.body||'').trim();
 const family='"Noto Sans TC","Microsoft JhengHei",Arial,sans-serif';
 ctx.save();ctx.clearRect(0,0,W,H);ctx.fillStyle=style.bg;ctx.fillRect(0,0,W,H);
 if(image){
  ctx.save();ctx.filter='contrast(1.045) saturate(.93) brightness(.84)';
  const edit=watermarkEdits.get(slide);
  if(edit?.image===image)ctx.drawImage(edit.canvas,0,0);
  else drawCover(ctx,image);ctx.restore();
  const grad=ctx.createLinearGradient(0,0,variant===1?W:H,variant===1?0:H);
  grad.addColorStop(0,'rgba(8,13,13,.08)');grad.addColorStop(.5,'rgba(8,13,13,.24)');
  grad.addColorStop(1,'rgba(8,13,13,.62)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 }else{
  const grad=ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,style.bg);grad.addColorStop(1,'#121d1b');
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.19;ctx.fillStyle=style.accent;ctx.beginPath();
  ctx.ellipse(870,390,380,520,-.38,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 }
 // Three editorial layouts: A = lower inset, B = left editorial column, C = center feature.
 // Never stamp a top-left logo, sequence number or extra words onto the exported image.
 const presets=[
  {x:59,w:962,maxH:820,anchor:'bottom',minY:255,pad:49},
  {x:60,w:830,maxH:940,anchor:'middle',minY:175,pad:51},
  {x:95,w:890,maxH:860,anchor:'middle',minY:205,pad:55}
 ];
 const p=presets[variant],inner=p.w-2*p.pad;
 let titleSize=variant===0?58:54, bodySize=variant===0?30:29;
 let titleLines=[],bodyLines=[],titleLineH=0,bodyLineH=0,panelH=0;
 const metrics=()=>{
  ctx.font='800 '+titleSize+'px '+family;titleLines=textLines(ctx,title,inner);
  ctx.font='500 '+bodySize+'px '+family;bodyLines=textLines(ctx,body,inner);
  titleLineH=Math.round(titleSize*1.24);bodyLineH=Math.round(bodySize*1.52);
  panelH=61+titleLines.length*titleLineH+28+bodyLines.length*bodyLineH+78;
 };
 metrics();
 for(let n=0;n<50&&panelH>p.maxH;n++){
  if(titleSize>38)titleSize=Math.max(38,titleSize-2);
  if(bodySize>23)bodySize=Math.max(23,bodySize-1);
  metrics();
 }
 const panelY=p.anchor==='bottom'?Math.max(p.minY,1197-panelH):Math.max(p.minY,Math.round((1220-panelH)/2));
 ctx.fillStyle='rgba(0,0,0,.50)';rounded(ctx,p.x,panelY,p.w,panelH,variant===2?22:28);ctx.fill();
 ctx.fillStyle=style.accent;ctx.fillRect(p.x+p.pad,panelY+34,variant===2?58:82,5);
 let cursor=panelY+57;
 ctx.textBaseline='top';ctx.fillStyle='#fff';ctx.font='800 '+titleSize+'px '+family;
 for(const line of titleLines){ctx.fillText(line,p.x+p.pad,cursor);cursor+=titleLineH}
 cursor+=25;ctx.font='500 '+bodySize+'px '+family;ctx.fillStyle='rgba(255,255,255,.96)';
 for(const line of bodyLines){ctx.fillText(line,p.x+p.pad,cursor);cursor+=bodyLineH}
 // Thin editorial detail below image; the handle is the only permanent export branding.
 ctx.fillStyle='rgba(255,255,255,.38)';ctx.fillRect(66,1245,947,1);
 ctx.font='500 23px '+family;ctx.fillStyle='rgba(255,255,255,.9)';
 ctx.shadowColor='rgba(0,0,0,.64)';ctx.shadowBlur=7;
 const handle='@interest558855';ctx.fillText(handle,1012-ctx.measureText(handle).width,1274);
 ctx.restore();
}
const watermarkEdits=new WeakMap();
const watermarkDialog=$('#watermarkDialog');
const watermarkCanvas=$('#watermarkCanvas');
const selectionCanvas=$('#watermarkSelection');
const watermarkStatus=$('#watermarkStatus');
const repairButton=$('#repairWatermark');
const saveWatermark=$('#saveWatermark');
let watermarkSession, selection, drag;

function showWatermarkSelection(){
 const ctx=selectionCanvas.getContext('2d');
 ctx.clearRect(0,0,selectionCanvas.width,selectionCanvas.height);
 repairButton.disabled=!selection||selection.w<3||selection.h<3||!!drag;
 if(!selection)return;
 const {x,y,w,h}=selection;
 ctx.fillStyle='rgba(255,226,126,.22)';
 ctx.fillRect(x,y,w,h);
 ctx.strokeStyle='#ffe27e';
 ctx.lineWidth=5;
 ctx.strokeRect(x,y,w,h);
}

$('#openWatermark').addEventListener('click',()=>{
 const i=state.current, slide=state.slides[i], image=state.images[i];
 if(!slide||!image)return;
 const edit=watermarkEdits.get(slide);
 watermarkSession={i,slide,image,repaired:edit?.image===image};
 const ctx=watermarkCanvas.getContext('2d',{willReadFrequently:true});
 ctx.clearRect(0,0,watermarkCanvas.width,watermarkCanvas.height);
 if(watermarkSession.repaired)ctx.drawImage(edit.canvas,0,0);
 else drawCover(ctx,image);
 selection=drag=null;
 showWatermarkSelection();
 saveWatermark.disabled=true;
 watermarkStatus.textContent=watermarkSession.repaired?'已載入這張的修補結果。':'';
 watermarkDialog.showModal();
});

function watermarkPoint(event){
 const bounds=selectionCanvas.getBoundingClientRect();
 return {
  x:Math.max(0,Math.min(selectionCanvas.width,Math.round((event.clientX-bounds.left)*selectionCanvas.width/bounds.width))),
  y:Math.max(0,Math.min(selectionCanvas.height,Math.round((event.clientY-bounds.top)*selectionCanvas.height/bounds.height)))
 };
}

selectionCanvas.addEventListener('pointerdown',event=>{
 if(drag||event.button!==0)return;
 drag={id:event.pointerId,start:watermarkPoint(event)};
 selection=null;
 selectionCanvas.setPointerCapture(event.pointerId);
 showWatermarkSelection();
});

function updateWatermarkSelection(event){
 const {x,y}=watermarkPoint(event);
 const start=drag.start;
 selection={x:Math.min(start.x,x),y:Math.min(start.y,y),w:Math.abs(start.x-x),h:Math.abs(start.y-y)};
}

selectionCanvas.addEventListener('pointermove',event=>{
 if(drag?.id!==event.pointerId)return;
 updateWatermarkSelection(event);
 showWatermarkSelection();
});
selectionCanvas.addEventListener('pointerup',event=>{
 if(drag?.id!==event.pointerId)return;
 updateWatermarkSelection(event);
 drag=null;
 showWatermarkSelection();
});
selectionCanvas.addEventListener('lostpointercapture',event=>{
 if(drag?.id!==event.pointerId)return;
 drag=selection=null;
 showWatermarkSelection();
});

// Interpolate between the closest available edges outside the selected rectangle.
function repairVisibleMark(ctx,{x,y,w,h}){
 const {width,height}=ctx.canvas;
 const left=x>0, right=x+w<width, top=y>0, bottom=y+h<height;
 if(!left&&!right&&!top&&!bottom)return false;
 const source=ctx.getImageData(0,0,width,height).data;
 const patch=ctx.createImageData(w,h);
 for(let row=0;row<h;row++){
  const py=y+row;
  const topWeight=top?1/(row+1):0;
  const bottomWeight=bottom?1/(h-row):0;
  const leftOffset=(py*width+Math.max(0,x-1))*4;
  const rightOffset=(py*width+Math.min(width-1,x+w))*4;
  for(let col=0;col<w;col++){
   const px=x+col;
   const leftWeight=left?1/(col+1):0;
   const rightWeight=right?1/(w-col):0;
   const topOffset=(Math.max(0,y-1)*width+px)*4;
   const bottomOffset=(Math.min(height-1,y+h)*width+px)*4;
   const total=leftWeight+rightWeight+topWeight+bottomWeight;
   const dest=(row*w+col)*4;
   for(let channel=0;channel<4;channel++){
    patch.data[dest+channel]=(
     source[leftOffset+channel]*leftWeight+source[rightOffset+channel]*rightWeight+
     source[topOffset+channel]*topWeight+source[bottomOffset+channel]*bottomWeight
    )/total;
   }
  }
 }
 ctx.putImageData(patch,x,y);
 return true;
}

repairButton.addEventListener('click',()=>{
 if(!repairVisibleMark(watermarkCanvas.getContext('2d'),selection)){
  watermarkStatus.textContent='請縮小選區，留下周圍像素供修補。';
  return;
 }
 watermarkSession.repaired=true;
 selection=null;
 showWatermarkSelection();
 saveWatermark.disabled=false;
 watermarkStatus.textContent='已修補選區。請確認結果後套用。';
});

$('#resetWatermark').addEventListener('click',()=>{
 const ctx=watermarkCanvas.getContext('2d');
 ctx.clearRect(0,0,watermarkCanvas.width,watermarkCanvas.height);
 drawCover(ctx,watermarkSession.image);
 watermarkSession.repaired=false;
 selection=null;
 showWatermarkSelection();
 saveWatermark.disabled=false;
 watermarkStatus.textContent='已預覽原始背景。按「套用到這張」確認還原。';
});
$('#cancelWatermark').addEventListener('click',()=>watermarkDialog.close());
watermarkDialog.addEventListener('close',()=>{if(!watermarkDialog.open)watermarkSession=selection=drag=null});
saveWatermark.addEventListener('click',()=>{
 const {i,slide,image,repaired}=watermarkSession;
 watermarkDialog.close();
 if(state.slides[i]!==slide||state.images[i]!==image){
  toast('這張背景已更換，請重新框選。');
  return;
 }
 if(repaired){
  const canvas=document.createElement('canvas');
  canvas.width=watermarkCanvas.width;
  canvas.height=watermarkCanvas.height;
  canvas.getContext('2d').drawImage(watermarkCanvas,0,0);
  watermarkEdits.set(slide,{image,canvas});
 }else watermarkEdits.delete(slide);
 cleanReviews.delete(i);
 renderPreview();
 syncCleanReview();
 toast(repaired?'修補已套用，可下載這張 PNG。':'已還原原始背景。');
});

function renderPreview(){
 const slide=state.slides[state.current], image=state.images[state.current];
 $('#openWatermark').disabled=!image;
 $('#downloadOne').textContent=image&&watermarkEdits.get(slide)?.image===image
  ?'↓ 下載修補後 PNG':'↓ 下載這張 PNG';
 drawSlide($('#previewCanvas'),state.current);
}
function downloadSlide(i){if(state.images[i]&&cleanReviews.get(i)!==state.images[i])toast('提醒：本張尚未人工檢查可見標記，請確認圖片授權與畫面。');if(!state.slides.length){toast('請先產生腳本');return}if(Array.from((state.slides[i].title||'')+(state.slides[i].body||'')).length>120){toast('這張圖超過120字，請先精簡內容再下載。');return}let canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;drawSlide(canvas,i);canvas.toBlob(blob=>{if(!blob){toast('圖片轉檔失敗');return}let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download=`作興趣_IG輪播_${String(i+1).padStart(2,'0')}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)},'image/png')}
$('#downloadOne').addEventListener('click',()=>downloadSlide(state.current));
$('#toDownloadBtn').addEventListener('click',()=>{if(!state.slides.length){toast('請先產生腳本');return}activate('download')});$('#backDesignBtn').addEventListener('click',()=>activate('design'));
function renderExports(){if(state.slides.some(s=>Array.from((s.title||'')+(s.body||'')).length>120)){toast('部分腳本超過120字，請返回編輯後再匯出。');activate('design');return}const root=$('#exportGrid');root.replaceChildren();if(!state.slides.length){root.innerHTML='<div class="empty">目前沒有可下載圖片，請先完成腳本。</div>';return}state.slides.forEach((s,i)=>{let card=document.createElement('div');card.className='export-card';let can=document.createElement('canvas');can.width=1080;can.height=1350;drawSlide(can,i);can.title='點擊圖片即可下載 PNG';can.addEventListener('click',()=>downloadSlide(i));let actions=document.createElement('div');actions.className='export-actions';let label=document.createElement('strong');label.textContent=s.title.slice(0,23);let btn=document.createElement('button');btn.className='primary';btn.textContent=watermarkEdits.has(s)?'↓ 下載修補後 PNG':'↓ 下載這張';btn.addEventListener('click',()=>downloadSlide(i));actions.append(label,btn);card.append(can,actions);root.appendChild(card)})}
async function status(){try{let r=await fetch('/api/status');let d=await r.json();state.ai=!!d.bring_your_own_key;$('#apiStatus').textContent=state.ai?'AI 腳本可用｜輸入個人 API 金鑰':'模板模式｜無 AI API';}catch{$('#apiStatus').textContent='服務異常，請確認 Python 已啟動'}}
status();renderPreview();
