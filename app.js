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
function resetEditorialForNewTopic(){readerRequestSerial++;state.slides=[];state.images=[];state.current=0;$('#captionInput').value='';$('#hashtagsInput').value='';$('#verificationNotice').hidden=true;$('#extraSources').replaceChildren();$('#readerOpinionsInput').value='';$('#readingNotesInput').value='';$('#readerResults').replaceChildren();$('#readerResults').hidden=true;$('#readerFetchStatus').textContent='選擇書籍後可自動整理公開來源';$('#scriptMode').textContent='新主題｜待生成';renderScript()}
let topicContextSerial=0;
function expertAdvice(category,title,hasSources){
 const c=category+' '+title;
 const points=/安全|防火|一氧化碳|爐|火/.test(c)?
 ['燃燒式爐具不可在帳篷內使用，並確認通風與設備規範。','親子出遊請先約定遠離火源、車道與水邊的安全動線。']:
 /生態|環境|山林|步道/.test(c)?
 ['先確認步道開放與管制公告，依天候及同行者體能調整行程。','遵守無痕山林原則，不餵食野生動物並將垃圾帶走。']:
 /親子|家庭|兒童/.test(c)?
 ['確認營區動線與衛生飲水設施，依孩子年齡調整活動。','留意夜間溫差、照明與備用保暖用品。']:
 /旅遊|景點|活動|南投/.test(c)?
 ['優先核對官方開放時間、交通管制與預約規定。','天氣、價格與名額可能變動，出發前再次向官方確認。']:
 ['留意內容日期、消息來源與適用條件，避免把轉載當成現場保證。','從安全、親子友善與環境責任角度提出可執行的檢查項目。'];
 return '【作興趣農場專家觀點｜一般實務建議，非本人親身體驗】\n'+points.map(x=>'• '+x).join('\n')+
 (hasSources?'\n【查核提醒】上述為專家一般建議，不代表已驗證所選文章所有主張。':'\n【查核提醒】目前沒有可用正文，不能據此斷言該主題的事件細節。');
}
async function selectTopic(item){
 resetEditorialForNewTopic();const serial=++topicContextSerial;
 const headline=String(item.title||item.handle||'');
 $('#topicInput').value=headline;
 $('#contentTypeInput').value=/旅遊|景點|步道|活動|南投/.test(item.category||'')?'travel':'knowledge';
 $('#detailsInput').value='主題：'+headline+'\n搜尋來源：'+(item.platform||item.source||'使用者匯入')+
 '\n資料日期：'+formatTime(item.published||item.observed_at)+'\n參考連結：'+(item.url||'');
 $('#sourceTitleInput').value=item.source||'';$('#sourceUrlInput').value=item.url||'';$('#reviewArticleUrl').value=item.url||'';
 $('#sourceTextInput').value='';$('#materialsInput').value='';
 $('#readerOpinionsInput').value='';$('#readingNotesInput').value='';$('#expertCommentInput').value='';
 activate('write');
 $('#detailsExtractStatus').textContent='正在比對跨來源公開摘要；搜尋結果不等於已讀取文章全文。';
 try{
  const response=await fetch('/api/topic-context',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({title:headline,category:item.category||'',source:item.source||'',url:item.url||'',snippet:item.snippet||''})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'搜尋服務失敗');
  if(serial!==topicContextSerial)return;
  const sources=(data.sources||[]).filter(x=>x.text&&x.url);
  const passages=sources.slice(0,5).map((x,i)=>'【來源 '+(i+1)+'｜'+(x.source||'未註明')+'｜'+x.quality+'】\n'+x.text+'\n網址：'+x.url);
  $('#detailsInput').value='主題：'+headline+'\n'+(passages.join('\n\n')||'【資料不足】目前只有搜尋標題，請人工核對原文。');
  $('#materialsInput').value=sources.length?sources.slice(0,5).map((x,i)=>'• 來源 '+(i+1)+' 提及（未核實全文）：'+x.text.slice(0,165)).join('\n'):'【資料不足】未取得可供核對的摘要或正文。';
  $('#sourceTitleInput').value=sources[0]?.source||item.source||'';
  $('#sourceUrlInput').value=sources[0]?.url||item.url||'';
  $('#sourceTextInput').value=passages.length?'【搜尋摘要或公開中繼資料，非經核對的文章全文】\n'+passages.join('\n\n'):'【資料不足】尚未取得可引用的原文內容。';
  $('#readerOpinionsInput').value='【資料不足】跨平台新聞搜尋不等於實際公開讀者評論；尚無可核實評論正文。';
  $('#readingNotesInput').value='【待本人填寫】未取得你的親身經歷，不會編造個人心得。';
  $('#expertCommentInput').value=expertAdvice(item.category||'',headline,sources.length>0);
  refreshCaption(true);
  $('#detailsExtractStatus').textContent='取得 '+sources.length+' 則跨來源短摘要，已自動整理；公開評論與本人心得仍需獨立來源。';
  toast('已帶入來源摘要，現在嘗試閱讀所選文章正文。');
  if($('#reviewArticleUrl').value.startsWith('https://'))await reviewSelectedArticle(true);
 }catch(error){
  if(serial!==topicContextSerial)return;
  $('#materialsInput').value='【資料不足】只有搜尋標題，請開啟原文補充事實。';
  $('#readerOpinionsInput').value='【資料不足】沒有可核實的公開評論。';
  $('#readingNotesInput').value='【待本人填寫】請補充親身經驗。';
  $('#expertCommentInput').value=expertAdvice(item.category||'',headline,false);
  refreshCaption(true);
  $('#detailsExtractStatus').textContent='搜尋暫不可用：'+error.message+'。已提供一般建議，並標註查核限制。';
 }
}
let articleReviewSerial=0;
async function reviewSelectedArticle(automatic=false){
 const url=$('#reviewArticleUrl').value.trim(),btn=$('#reviewArticleBtn'),status=$('#reviewArticleStatus');
 if(!url.startsWith('https://')){status.textContent='請提供原始文章 HTTPS 網址。';if(!automatic)toast(status.textContent);return}
 const serial=++articleReviewSerial,topic=$('#topicInput').value;
 btn.disabled=true;btn.textContent='正在讀取文章正文…';
 status.textContent='正在從所選網址讀取可公開取得的文章正文；只有讀取成功才會寫心得。';
 try{
  const response=await fetch('/api/article-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
  const result=await response.json();if(!response.ok)throw Error(result.error||'文章無法讀取');
  if(serial!==articleReviewSerial||topic!==$('#topicInput').value||url!==$('#reviewArticleUrl').value.trim())return;
  if(result.status!=='ready'||!result.review||!result.materials?.length)throw Error('文章內容不足，未更新欄位');
  $('#materialsInput').value=result.materials.map(x=>'• 文章提及：'+x).join('\n');
  $('#expertCommentInput').value=result.review;
  $('#sourceTitleInput').value=result.title||'所選文章';
  $('#sourceUrlInput').value=result.url;
  $('#sourceTextInput').value='【從文章正文擷取的短段落；不是全文】\n'+result.source_summary+'\n原文：'+result.url;
  // Reflection derived from reading a third-party article must not impersonate the user's personal experience.
  $('#readingNotesInput').value='【文章閱讀觀察，非本人真實體驗】\n'+result.review;
  $('#readerOpinionsInput').value='【資料不足】文章內容不等於多位讀者的公開評論；請另附實際評論來源。';
  status.textContent='已讀取可見正文 '+result.extracted_chars+' 字，整理出 '+result.materials.length+' 項重點及來源心得。'+result.note;
  refreshCaption(true);
  toast('已依實際擷取的文章正文寫出專家閱讀觀察，請發布前對照原文。');
 }catch(error){
  if(serial!==articleReviewSerial||topic!==$('#topicInput').value)return;
  status.textContent='未能讀取文章正文：'+error.message+'。原本欄位未被覆蓋。請貼上原始文章網址，或將文章內容貼入背景資料。';
  if(!automatic)toast('文章讀取失敗：'+error.message);
 }finally{
  if(serial===articleReviewSerial){btn.disabled=false;btn.textContent='✦ 讀取文章全文並產生專家閱讀心得'}
 }
}
$('#reviewArticleBtn').addEventListener('click',()=>reviewSelectedArticle(false));
function safeResearchItem(item,type){if(!item||typeof item!=='object')return null;let u=type==='accounts'?item.url:item.url; if(!linkOk(u))return null;const o={...item};o.title=String(o.title||o.handle||'未命名').slice(0,220);o.category=String(o.category||'未分類').slice(0,40);o.url=u;o.source=String(o.source||o.source_url||'來源未提供').slice(0,130);['likes','views','comments'].forEach(k=>{if(!Number.isFinite(o[k])||o[k]<0)o[k]=null});return o}
function renderResearch(){const topicFilter=$('#topicFilter').value,platformFilter=$('#platformFilter').value;let topics=state.topics.filter(t=>(topicFilter==='all'||t.category===topicFilter)&&(platformFilter==='all'||(t.platform||'使用者匯入')===platformFilter));$('#topicNum').textContent=state.topics.length;$('#accountNum').textContent=state.accounts.length;const tc=$('#topicCards');tc.replaceChildren();if(!topics.length){tc.innerHTML='<div class="empty">目前沒有符合類別的已取得資料。可更新新聞線索或匯入有來源的資料。</div>'}topics.slice(0,40).forEach(item=>tc.appendChild(createCard(item,false)));const ac=$('#accountCards');ac.replaceChildren();if(!state.accounts.length)ac.innerHTML='<div class="empty">目前無法取得可核實的每週帳號觀察值。請匯入具來源的 IG 帳號資料，不會憑空湊滿十個。</div>';state.accounts.slice(0,10).forEach(item=>ac.appendChild(createCard(item,true)))}
function createCard(item,isAccount){const card=document.createElement('article');card.className='research-card';const published=item.published||item.observed_at;const source=item.source||item.source_url||'來源未註明';const tag=isAccount?'可驗證參考帳號（非排行）':(item.kind||'來源線索（非 IG 排名）');card.innerHTML=`<span class="pill">${esc(item.category||'露營')}</span><h3>${esc(item.title)}</h3><div class="meta">${esc(tag)}<br>資料日期：${esc(formatTime(published))}<br>來源：${esc(source)}</div><div class="metrics">公開互動量｜按讚 ${metric(item.likes)} · 留言 ${metric(item.comments)} · 觀看 ${metric(item.views)}</div><div class="card-actions"><button class="secondary">＋ 選這個主題</button><a rel="noopener noreferrer" target="_blank">查看來源 ↗</a></div>`;card.querySelector('a').href=item.url;card.querySelector('button').addEventListener('click',()=>selectTopic(item));return card}
$('#topicFilter').addEventListener('change',renderResearch);
$('#platformFilter').addEventListener('change',renderResearch);
function syncResearchFilters(){for(const [id,values] of [['topicFilter',[...new Set(state.topics.map(x=>x.category).filter(Boolean))]],['platformFilter',[...new Set(state.topics.map(x=>x.platform||'使用者匯入'))]]]){const el=$('#'+id),before=el.value;el.replaceChildren();const all=document.createElement('option');all.value='all';all.textContent=id==='topicFilter'?'全部類別':'全部來源';el.append(all);for(const value of values.sort()){const opt=document.createElement('option');opt.value=value;opt.textContent=value;el.append(opt)}el.value=values.includes(before)?before:'all'}}

$('#researchBtn').addEventListener('click',async()=>{const b=$('#researchBtn');b.disabled=true;b.textContent='正在讀取可驗證線索…';try{let r=await fetch('/api/research');let data=await r.json();if(!r.ok)throw Error(data.error||'讀取失敗');state.topics=(data.topics||[]).map(x=>safeResearchItem(x,'topics')).filter(Boolean);state.accounts=[];syncResearchFilters();renderResearch();$('#researchDate').textContent='資料抓取：'+formatTime(data.updated)+'｜最近7天｜來源：'+Object.keys(data.platforms||{}).join('、');toast(state.topics.length?`找到 ${state.topics.length} 則近期新聞線索（不是IG排名）`:(data.errors||[]).join('；')||'本次沒有取得有效線索，可手動匯入');}catch(e){toast('研究服務暫時無法連線：'+e.message)}finally{b.disabled=false;b.textContent='↻ 跨平台搜尋近 7 天'}});
$('#importBtn').addEventListener('click',()=>{try{let d=JSON.parse($('#importJson').value);let ts=(Array.isArray(d.topics)?d.topics:[]).map(x=>({...x,kind:'使用者匯入（待人工查證）'})).map(x=>safeResearchItem(x,'topics')).filter(Boolean);let ac=(Array.isArray(d.accounts)?d.accounts:[]).filter(x=>/^@[\w.]{1,40}$/.test(String(x.handle||''))&&linkOk(x.url)).map(x=>({...x,title:x.handle,kind:'使用者匯入（非IG排名）'})).map(x=>safeResearchItem(x,'accounts')).filter(Boolean);state.topics=[...ts,...state.topics].slice(0,80);state.accounts=ac.slice(0,10);syncResearchFilters();renderResearch();toast(`匯入 ${ts.length} 則議題、${ac.length} 個帳號；請自行核對來源`)}catch(e){toast('JSON 格式有誤：'+e.message)}});
const baseTitles=['這個露營知識你知道嗎？','先確認環境與氣象','裝備準備這樣分類','孩子的戶外安全重點','營地周遭如何觀察？','飲食、用火與清潔細節','常見錯誤與正確做法','出發前的最後檢查','收藏這份重點清單'];
const baseBodies=['先確認這個主題的來源與適用情境。資料若尚未查證，請以實際公告為準，不要只憑網路傳聞安排旅程。','出發前查看中央氣象署預報與目的地最新公告。遇豪雨、強風或警戒資訊，應調整或取消行程。','先列睡眠、照明、飲水、保暖和個人衛生用品清單；按孩子年齡、季節與營區規定調整，不必盲目購買裝備。','先劃定孩子可活動的範圍，遠離水域、爐具與車道；戲水時由成人持續在旁看顧，不讓孩子單獨靠近水邊。','觀察地面排水、樹枝、坡度與通道，不在危險邊坡、乾溪床或警示區搭設帳篷；遵守現場管理人員指示。','炊事器具只在通風良好的戶外安全區使用，帳內不可使用炭火及燃燒式爐具；並妥善保存食物與清理垃圾。','常見誤區是把網路推薦當成現場保證。出發前應核對營區開放、道路通行、預約方式與最新注意事項。','將天氣、道路、預訂、裝備和緊急聯絡資訊重新檢查一次；資訊不足的部分，先向管理單位求證。','將這份露營知識收藏起來，也分享給準備帶孩子出遊的朋友。'];
function template(){
 const topic=$('#topicInput').value.trim(),n=Number($('#countInput').value)||7;
 if(!topic){toast('請先選擇或輸入主題');return}
 const sourceLines=$('#materialsInput').value.split('\n').map(x=>x.replace(/^[\s•\-]+/,'').trim())
  .filter(x=>x.length>=15&&!x.startsWith('【資料不足】')).slice(0,6);
 const expertLines=$('#expertCommentInput').value.split('\n').map(x=>x.replace(/^[\s•\-]+/,'').trim())
  .filter(x=>x.length>=12&&!x.startsWith('【')).slice(0,3);
 const goal=$('#goalInput').value;
 const cta=goal==='LINE詢問與訂位'?'有露營需求可透過 LINE @wifi558855 詢問。':
 goal==='增加追蹤'?'追蹤 @interest558855，查看更多親子戶外資訊。':
 goal==='留言互動'?'你怎麼看？留言分享你的經驗。':'收藏這篇提醒，發布前記得核對原始來源。';
 const slides=[{title:topic.slice(0,35),body:'整理來源摘要與作興趣農場專家實務提醒；搜尋線索不等於已核實全文。'}];
 for(const [i,line] of sourceLines.entries()){
  slides.push({title:'重點 '+(i+1)+'｜來源摘要',body:line.slice(0,88)});
 }
 for(const [i,line] of expertLines.entries()){
  slides.push({title:'作興趣農場專家提醒 '+(i+1),body:line.slice(0,90)});
 }
 while(slides.length<n-1){
  slides.push({title:'發布前要確認的事',body:'對照來源原文與日期、適用條件及官方公告；缺乏可核實資料時不應作肯定結論。'});
 }
 const chosen=slides.slice(0,n-1);
 chosen.push({title:'重點整理｜收藏這篇',body:cta});
 state.slides=chosen.map(x=>({...x,image_prompt:''}));
 state.images=Array.from({length:n},()=>null);state.current=0;
 $('#scriptMode').textContent='來源摘要與專家建議｜離線可編輯';
 renderScript();refreshCaption(true);
 toast('已依來源摘要和專家建議建立 '+n+' 張分鏡；請核對來源再發布。');
}
$('#templateBtn').addEventListener('click',()=>{template();if(state.slides.length)refreshCaption(true)});
// Remove legacy API key from browser storage; no external OpenAI calls remain.
try{localStorage.removeItem('zuoxing_openai_key_optin_v1')}catch{}

/* Local extractive organizer. Only supplied text is used: no API, fabricated reviews or experiences. */
const localFieldIds=['materialsInput','readerOpinionsInput','readingNotesInput'];
const localPrevious=new Map();
const localEmpty='【資料不足】';
function localSentences(text){
 return String(text||'').replace(/\r/g,'').split(/\n+|(?<=[。！？!?；;])(?=[^\n])/u)
  .map(x=>x.trim().replace(/^[•●\-\d.、．\s]+/u,'').trim()).filter(Boolean);
}
function localExtractDetails(force=false){
 const raw=$('#detailsInput').value.trim(),status=$('#detailsExtractStatus');
 if(!raw){status.textContent='請先在「主題故事內容／背景資料」貼入可核對的文章內容、書籍介紹或真實紀錄。';return}
 const rows=localSentences(raw),opinion=[],personal=[],materials=[];
 let section='',sourceName=$('#sourceTitleInput').value.trim();
 // Explicit headings are essential for attributing third-party opinion or first-person experience.
 const headPublic=/^(?:公開讀者(?:分享|觀點|評論|心得)?|讀者(?:分享|評論|心得|觀點)|書評|網友評論|網友分享|他人心得)\s*[：:]/u;
 const headPersonal=/^(?:個人(?:閱讀)?心得|我(?:的)?(?:閱讀)?心得|本人(?:閱讀)?心得|我的(?:真實)?體驗|親身經歷|個人真實體驗)\s*[：:]/u;
 const headMaterials=/^(?:重要素材|重點|背景資料|故事背景|內容摘要|書籍介紹|文章摘要|核心觀點)\s*[：:]/u;
 const headOther=/^(?:來源|參考(?:連結|網址|資料)?|資料日期|核對日期|官方榜單|網址|URL|注意)\s*[：:]/iu;
 for(const row of rows){
  const m=row.match(/^([^：:\n]{1,26})\s*[：:]\s*(.*)$/u);
  const heading=m?.[1]?.trim()||'';
  let val=m?.[2]?.trim()||'';
  if(headPublic.test(row)){section='opinion';if(val)opinion.push(val);continue}
  if(headPersonal.test(row)){section='personal';if(val)personal.push(val);continue}
  if(headMaterials.test(row)){section='materials';if(val)materials.push(val);continue}
  if(headOther.test(row)){section='';continue}
  if(/^(?:https?:\/\/|【資料不足】|注意：目前僅取得)/u.test(row))continue;
  if(heading && /^(?:評論者|讀者姓名|出處)$/u.test(heading)){continue}
  if(section==='opinion'){if(row.length>=5)opinion.push(row);continue}
  if(section==='personal'){if(row.length>=5)personal.push(row);continue}
  if(row.length>=10&&row.length<=330&&!/^(?:參考書籍|來源|官方榜單|資料日期|核對日期)\s*[:：]/u.test(row))
   materials.push(row);
 }
 const unique=arr=>[...new Set(arr.map(v=>v.trim()).filter(Boolean))];
 const important=unique(materials).slice(0,6).map(v=>'• '+v.slice(0,190)).join('\n');
 const opinions=unique(opinion).slice(0,5).map(v=>'• '+v.slice(0,230)).join('\n');
 const experiences=unique(personal).slice(0,5).map(v=>'• '+v.slice(0,230)).join('\n');
 const output={
  materialsInput:important||localEmpty+'背景文字不足以提取具體重點，請補充實際內容。',
  readerOpinionsInput:opinions? '【由貼入資料整理，讀者身分及來源請人工核實】\n'+opinions+(sourceName?'\n參考來源：'+sourceName:'\n【待補來源】請附上評論原始網址或出處。'):localEmpty+'背景資料沒有明確標示的公開讀者評論，不會推測他人觀點。',
  readingNotesInput:experiences?'【由貼入資料中明確標示的本人心得整理，請核對】\n'+experiences:localEmpty+'背景資料沒有明確標示的本人閱讀心得／真實體驗，請自行補充，不能由他人評論代填。'
 };
 let applied=0,skipped=0;
 for(const id of localFieldIds){
  const el=$('#'+id),current=el.value.trim(),last=localPrevious.get(id);
  if(force||!current||current===last||current.startsWith(localEmpty)||current.startsWith('【由貼入資料')){
   el.value=output[id];localPrevious.set(id,output[id]);applied++;
  }else skipped++;
 }
 status.textContent='已從貼入文字擷取 '+unique(materials).length+' 項素材、'+unique(opinion).length+' 段標示讀者觀點、'+unique(personal).length+' 段標示本人心得；更新 '+applied+' 欄'+(skipped?'，保留 '+skipped+' 欄手動內容。':'。')+' 無 API 費用。';
 if(!$('#expertCommentInput').value.trim())$('#expertCommentInput').value=expertAdvice($('#contentTypeInput').selectedOptions[0]?.textContent||'',$('#topicInput').value,important.length>0);
 if($('#autoExtractDetails').checked&&applied)refreshCaption(true);
 if(force)toast('已根據背景資料整理三個欄位，資料不足部分已明確標示。');
}
$('#extractDetailsBtn').addEventListener('click',()=>localExtractDetails(true));
let localExtractTimer=null;
$('#detailsInput').addEventListener('input',()=>{
 if(!$('#autoExtractDetails').checked)return;
 clearTimeout(localExtractTimer);
 localExtractTimer=setTimeout(()=>localExtractDetails(false),500);
});

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
  // 公開讀者評論不得當作使用者本人的閱讀經驗。
  if(!$('#readingNotesInput').value.trim() || $('#readingNotesInput').value.startsWith('【自動整理：')) $('#readingNotesInput').value='【資料不足】公開讀者評論不是本人閱讀心得；請自行填入真實體驗。';
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
   const choose=document.createElement('button');choose.type='button';choose.className='secondary small';choose.textContent='選擇這篇文章作為參考';
   choose.addEventListener('click',()=>{$('#sourceTitleInput').value=item.title;$('#sourceUrlInput').value=item.url;toast('已帶入文章來源；請閱讀原文並自行填入實際內容。')});
   line.append(a,small,choose);panel.appendChild(line);
  }
  panel.hidden=false;
  $('#readerFetchStatus').textContent=(publisher||opinions.length)?'三個欄位已填寫，請核對內容與來源':'三個欄位已標示資料不足，尚無可引用正文';
  toast((publisher||opinions.length)?'已自動填好三個欄位，請檢查來源':'只找到搜尋線索，已在三欄標示資料不足，未編造內容');
 }catch(e){$('#readerFetchStatus').textContent='搜尋失敗，原欄位未變更';toast('自動填寫失敗：'+e.message)}
 finally{if(serial===readerRequestSerial){button.disabled=false;button.textContent='↻ 自動搜尋並填寫三個欄位'}}
}
$('#fetchReaderBtn').addEventListener('click',fetchReaderResearch);
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
function renderScript(){let root=$('#slideEditor');root.replaceChildren();$('#slideCountText').textContent=state.slides.length+' 張';if(!state.slides.length){root.innerHTML='<div class="empty">尚未建立腳本。</div>';return}state.slides.forEach((s,i)=>{let el=document.createElement('div');el.className='script-item';el.innerHTML=`<div>分鏡 ${i+1} · 編輯排序標記僅在工作台顯示</div><input aria-label="本張標題"/><textarea rows="2" aria-label="本張內容"></textarea><div class="count"></div>`;let [a,b]=[el.querySelector('input'),el.querySelector('textarea')];a.value=s.title;b.value=s.body;let c=el.querySelector('.count');function sync(){s.title=a.value;s.body=b.value;let n=Array.from(s.title+s.body).length;c.textContent=`${n} / 120 字`;(c.style.color=n>120?'#bd4d34':'#78847d');if(state.current===i)renderPreview()}a.addEventListener('input',sync);b.addEventListener('input',sync);sync();root.appendChild(el)})}
function cleanEditorialLine(value){
 return String(value||'').replace(/^[-•\s]+/,'').replace(/^來源\s*\d+\s*提及（未核實全文）：/,'')
 .replace(/【[^】]+】/g,'').trim().slice(0,125);
}
function refreshCaption(fromTopic=false){
 const title=$('#topicInput').value.trim();
 if(!title){$('#captionStatus').textContent='請先選擇或輸入主題。';return}
 const raw=$('#materialsInput').value.split('\n').map(cleanEditorialLine)
  .filter(x=>x.length>=12&&!/^(?:資料不足|待本人|搜尋來源|網址)/.test(x)).slice(0,3);
 const expert=$('#expertCommentInput').value.split('\n').map(cleanEditorialLine)
  .filter(x=>x.startsWith('先')||x.startsWith('留意')||x.startsWith('確認')||x.startsWith('優先')||
   x.startsWith('燃燒')||x.startsWith('親子')||x.startsWith('遵守')||x.startsWith('從')||x.startsWith('天氣')||
   x.startsWith('營區')||x.startsWith('評估')).slice(0,2);
 const c=$('#contentTypeInput').value, goal=$('#goalInput').value;
 const cta=goal==='LINE詢問與訂位'?'有露營需求可透過 LINE @wifi558855 詢問營區資訊。':
 goal==='增加追蹤'?'追蹤 @interest558855，持續收藏親子戶外實用資訊。':
 goal==='留言互動'?'你會優先確認哪一點？歡迎留言分享。':
 '先收藏這份查核提醒，規劃下一趟出遊時再確認。';
 const lead=c==='book_review'?'📚 閱讀觀點｜':c==='travel'?'🌿 出遊前先看｜':'🏕️ 戶外知識整理｜';
 const sections=[lead+title,raw.length?'【目前可查到的摘要重點】\n'+raw.map((x,i)=>(i+1)+'｜'+x).join('\n'):
 '【資訊限制】目前尚無足夠的公開正文內容，不能只憑標題判斷實際情況。'];
 if(expert.length)sections.push('【作興趣農場專家提醒】\n'+expert.join('\n'));
 sections.push('來源資訊與日期請見原始連結；搜尋摘要非完整報導，發布前請再次核對。',cta,
  'IG｜@interest558855');
 $('#captionInput').value=sections.join('\n\n');
 let tags=['#作興趣農場','#戶外生活'];
 if(c==='book_review')tags=['#作興趣農場','#閱讀分享','#讀書筆記','#好書推薦'];
 else if(/親子|小孩|兒童/.test(title))tags.push('#親子戶外','#親子旅行');
 else if(/南投|竹山|埔里|魚池/.test(title))tags.push('#南投旅遊','#南投景點');
 else if(/安全|防火|用火|一氧化碳/.test(title))tags.push('#露營安全','#戶外安全');
 else if(/步道|登山|山林/.test(title))tags.push('#山林教育','#步道旅行');
 else tags.push('#露營知識','#親子露營');
 if(c==='travel'&&!tags.includes('#台灣旅遊'))tags.push('#台灣旅遊');
 if(c==='knowledge'&&!tags.includes('#知識分享'))tags.push('#知識分享');
 $('#hashtagsInput').value=[...new Set(tags)].slice(0,6).join(' ');
 $('#captionStatus').textContent='依 '+raw.length+' 條來源摘要與 '+expert.length+' 條專家提醒產出；未核對事項已標示。'+(fromTopic?' 選題後自動填入。':'');
 if(!fromTopic)toast('貼文和 Hashtag 已根據目前可查資料重新編排。');
}
$('#refreshCaptionBtn').addEventListener('click',()=>refreshCaption(false));
$('#copyCaptionBtn').addEventListener('click',async()=>{let text=$('#captionInput').value+'\n\n'+$('#hashtagsInput').value;try{await navigator.clipboard.writeText(text);toast('已複製貼文與 Hashtag')}catch{toast('瀏覽器限制剪貼簿，請手動選取文案複製')}});
$('#toDesignBtn').addEventListener('click',()=>{if(!state.slides.length){toast('請先產生輪播腳本');return}activate('design')});
const pick=$('#stylePicker');Object.entries(styles).forEach(([id,s])=>{let b=document.createElement('button');b.className='style-swatch'+(state.style===id?' selected':'');b.style.background=s.bg;b.style.color=s.fg;b.innerHTML=`<strong>${esc(s.name)}</strong><span>故事開始</span>`;b.addEventListener('click',()=>{state.style=id;$$('.style-swatch').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');renderPreview()});pick.appendChild(b)});
function renderEditor(){const sel=$('#slideSelect');sel.replaceChildren();state.slides.forEach((s,i)=>{let o=document.createElement('option');o.value=i;o.textContent=`分鏡 ${i+1}｜${s.title.slice(0,16)}`;sel.appendChild(o)});if(!state.slides.length){renderPreview();return}state.current=Math.max(0,Math.min(state.current,state.slides.length-1));sel.value=state.current;const s=state.slides[state.current];$('#editTitle').value=s.title;$('#editBody').value=s.body;$('#previewIndex').textContent=`${state.current+1} / ${state.slides.length}（僅編輯介面顯示）`;renderPreview();syncCleanReview()}
$('#slideSelect').addEventListener('change',()=>{state.current=Number($('#slideSelect').value);renderEditor()});['editTitle','editBody'].forEach(id=>$('#'+id).addEventListener('input',()=>{let s=state.slides[state.current];if(!s)return;s.title=$('#editTitle').value;s.body=$('#editBody').value;renderPreview()}));
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
async function status(){try{let r=await fetch('/api/status');let d=await r.json();state.ai=false;$('#apiStatus').textContent='免金鑰｜離線編輯與圖片輸出';}catch{$('#apiStatus').textContent='服務異常，請確認 Python 已啟動'}}
status();renderPreview();
