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
function selectTopic(item){$('#topicInput').value=item.title||item.handle||'';$('#detailsInput').value=`來源：${item.source||item.source_url||'使用者提供'}\n資料日期：${formatTime(item.published||item.observed_at)}\n參考連結：${item.url||''}\n請依此來源核實事實，勿推斷來源未明示的內容。`;activate('write');toast('已帶入主題，請檢查素材後產生腳本')}
function safeResearchItem(item,type){if(!item||typeof item!=='object')return null;let u=type==='accounts'?item.url:item.url; if(!linkOk(u))return null;const o={...item};o.title=String(o.title||o.handle||'未命名').slice(0,220);o.category=String(o.category||'未分類').slice(0,40);o.url=u;o.source=String(o.source||o.source_url||'來源未提供').slice(0,130);['likes','views','comments'].forEach(k=>{if(!Number.isFinite(o[k])||o[k]<0)o[k]=null});return o}
function renderResearch(){const topicFilter=$('#topicFilter').value;let topics=state.topics.filter(t=>topicFilter==='all'||t.category===topicFilter);$('#topicNum').textContent=state.topics.length;$('#accountNum').textContent=state.accounts.length;const tc=$('#topicCards');tc.replaceChildren();if(!topics.length){tc.innerHTML='<div class="empty">目前沒有符合類別的已取得資料。可更新新聞線索或匯入有來源的資料。</div>'}topics.slice(0,40).forEach(item=>tc.appendChild(createCard(item,false)));const ac=$('#accountCards');ac.replaceChildren();if(!state.accounts.length)ac.innerHTML='<div class="empty">目前無法取得可核實的每週帳號觀察值。請匯入具來源的 IG 帳號資料，不會憑空湊滿十個。</div>';state.accounts.slice(0,10).forEach(item=>ac.appendChild(createCard(item,true)))}
function createCard(item,isAccount){const card=document.createElement('article');card.className='research-card';const published=item.published||item.observed_at;const source=item.source||item.source_url||'來源未註明';const tag=isAccount?'可驗證參考帳號（非排行）':(item.kind||'來源線索（非 IG 排名）');card.innerHTML=`<span class="pill">${esc(item.category||'露營')}</span><h3>${esc(item.title)}</h3><div class="meta">${esc(tag)}<br>資料日期：${esc(formatTime(published))}<br>來源：${esc(source)}</div><div class="metrics">公開互動量｜按讚 ${metric(item.likes)} · 留言 ${metric(item.comments)} · 觀看 ${metric(item.views)}</div><div class="card-actions"><button class="secondary">＋ 選這個主題</button><a rel="noopener noreferrer" target="_blank">查看來源 ↗</a></div>`;card.querySelector('a').href=item.url;card.querySelector('button').addEventListener('click',()=>selectTopic(item));return card}
$('#topicFilter').addEventListener('change',renderResearch);
$('#researchBtn').addEventListener('click',async()=>{const b=$('#researchBtn');b.disabled=true;b.textContent='正在讀取可驗證線索…';try{let r=await fetch('/api/research');let data=await r.json();if(!r.ok)throw Error(data.error||'讀取失敗');state.topics=(data.topics||[]).map(x=>safeResearchItem(x,'topics')).filter(Boolean);state.accounts=[];renderResearch();$('#researchDate').textContent='資料抓取：'+formatTime(data.updated)+'｜最近7天';toast(state.topics.length?`找到 ${state.topics.length} 則近期新聞線索（不是IG排名）`:(data.errors||[]).join('；')||'本次沒有取得有效線索，可手動匯入');}catch(e){toast('研究服務暫時無法連線：'+e.message)}finally{b.disabled=false;b.textContent='↻ 更新近 7 天資料'}});
$('#importBtn').addEventListener('click',()=>{try{let d=JSON.parse($('#importJson').value);let ts=(Array.isArray(d.topics)?d.topics:[]).map(x=>({...x,kind:'使用者匯入（待人工查證）'})).map(x=>safeResearchItem(x,'topics')).filter(Boolean);let ac=(Array.isArray(d.accounts)?d.accounts:[]).filter(x=>/^@[\w.]{1,40}$/.test(String(x.handle||''))&&linkOk(x.url)).map(x=>({...x,title:x.handle,kind:'使用者匯入（非IG排名）'})).map(x=>safeResearchItem(x,'accounts')).filter(Boolean);state.topics=[...ts,...state.topics].slice(0,80);state.accounts=ac.slice(0,10);renderResearch();toast(`匯入 ${ts.length} 則議題、${ac.length} 個帳號；請自行核對來源`)}catch(e){toast('JSON 格式有誤：'+e.message)}});
const baseTitles=['這個露營知識你知道嗎？','先確認環境與氣象','裝備準備這樣分類','孩子的戶外安全重點','營地周遭如何觀察？','飲食、用火與清潔細節','常見錯誤與正確做法','出發前的最後檢查','收藏這份重點清單'];
const baseBodies=['先確認這個主題的來源與適用情境。資料若尚未查證，請以實際公告為準，不要只憑網路傳聞安排旅程。','出發前查看中央氣象署預報與目的地最新公告。遇豪雨、強風或警戒資訊，應調整或取消行程。','先列睡眠、照明、飲水、保暖和個人衛生用品清單；按孩子年齡、季節與營區規定調整，不必盲目購買裝備。','先劃定孩子可活動的範圍，遠離水域、爐具與車道；戲水時由成人持續在旁看顧，不讓孩子單獨靠近水邊。','觀察地面排水、樹枝、坡度與通道，不在危險邊坡、乾溪床或警示區搭設帳篷；遵守現場管理人員指示。','炊事器具只在通風良好的戶外安全區使用，帳內不可使用炭火及燃燒式爐具；並妥善保存食物與清理垃圾。','常見誤區是把網路推薦當成現場保證。出發前應核對營區開放、道路通行、預約方式與最新注意事項。','將天氣、道路、預訂、裝備和緊急聯絡資訊重新檢查一次；資訊不足的部分，先向管理單位求證。','將這份露營知識收藏起來，也分享給準備帶孩子出遊的朋友。'];
function template(){let n=Number($('#countInput').value), topic=$('#topicInput').value.trim();if(!topic){toast('請先輸入主題');return}const goal=$('#goalInput').value;state.slides=Array.from({length:n},(_,i)=>({title:i===0?topic.slice(0,25):i===n-1?'下一趟親子旅行，一起出發！':baseTitles[Math.min(i,baseTitles.length-1)],body:i===n-1?goal==='LINE詢問與訂位'?'加入 LINE @wifi558855，詢問露營與訂位資訊。':goal==='增加追蹤'?'追蹤 @interest558855，發現更多南投露營故事。':goal==='留言互動'?'你有哪些露營經驗？歡迎留言和大家分享。':'收藏這份內容，分享給想一起露營的朋友。':baseBodies[Math.min(i,baseBodies.length-1)],image_prompt:topic+'，臺灣露營親子生活自然攝影、無字背景'}));state.images=Array.from({length:n},()=>null);state.current=0;$('#captionInput').value=`🌿 ${topic}\n和家人一起走進南投山林，留下值得記住的時光。\n📩 官賴 @wifi558855\n🔗 訂位 https://forinterest.hexa.tw/`;$('#hashtagsInput').value='#作興趣農場 #南投露營 #親子露營 #露營知識 #親子旅行 #週末去哪玩';$('#scriptMode').textContent='離線模板（可手動編輯）';renderScript();toast('已產生可編輯的模板腳本；請逐張補充真實素材')}
$('#templateBtn').addEventListener('click',template);
async function postJSON(url,obj){let r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)});let d=await r.json();if(!r.ok)throw Error(d.error||'API 錯誤');return d}
$('#aiScriptBtn').addEventListener('click',async()=>{let topic=$('#topicInput').value.trim();if(!topic){toast('請輸入主題');return}let b=$('#aiScriptBtn');b.disabled=true;b.textContent='AI 正在產生…';try{let d=await postJSON('/api/script',{topic,details:$('#detailsInput').value,count:Number($('#countInput').value),goal:$('#goalInput').value});state.slides=d.slides.map(s=>({title:s.title||'',body:s.body||'',image_prompt:s.image_prompt||''}));state.images=Array.from({length:state.slides.length},()=>null);$('#captionInput').value=d.caption||'';$('#hashtagsInput').value=(d.hashtags||[]).join(' ');state.current=0;$('#scriptMode').textContent='AI 腳本已產生';renderScript();if(d.notes)toast('AI 生成完成｜發布前核對：'+d.notes);else toast('AI 腳本已產生，請逐張人工校稿')}catch(e){toast('AI 腳本失敗：'+e.message)}finally{b.disabled=false;b.textContent='✦ AI 自動產生腳本'}});
function renderScript(){let root=$('#slideEditor');root.replaceChildren();$('#slideCountText').textContent=state.slides.length+' 張';if(!state.slides.length){root.innerHTML='<div class="empty">尚未建立腳本。</div>';return}state.slides.forEach((s,i)=>{let el=document.createElement('div');el.className='script-item';el.innerHTML=`<div>分鏡 ${i+1} · 編輯排序標記僅在工作台顯示</div><input aria-label="本張標題"/><textarea rows="2" aria-label="本張內容"></textarea><div class="count"></div>`;let [a,b]=[el.querySelector('input'),el.querySelector('textarea')];a.value=s.title;b.value=s.body;let c=el.querySelector('.count');function sync(){s.title=a.value;s.body=b.value;let n=Array.from(s.title+s.body).length;c.textContent=`${n} / 80 字`;(c.style.color=n>80?'#bd4d34':'#78847d');if(state.current===i)renderPreview()}a.addEventListener('input',sync);b.addEventListener('input',sync);sync();root.appendChild(el)})}
$('#copyCaptionBtn').addEventListener('click',async()=>{let text=$('#captionInput').value+'\n\n'+$('#hashtagsInput').value;try{await navigator.clipboard.writeText(text);toast('已複製貼文與 Hashtag')}catch{toast('瀏覽器限制剪貼簿，請手動選取文案複製')}});
$('#toDesignBtn').addEventListener('click',()=>{if(!state.slides.length){toast('請先產生輪播腳本');return}activate('design')});
const pick=$('#stylePicker');Object.entries(styles).forEach(([id,s])=>{let b=document.createElement('button');b.className='style-swatch'+(state.style===id?' selected':'');b.style.background=s.bg;b.style.color=s.fg;b.innerHTML=`<strong>${esc(s.name)}</strong><span>故事開始</span>`;b.addEventListener('click',()=>{state.style=id;$$('.style-swatch').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');renderPreview()});pick.appendChild(b)});
function renderEditor(){const sel=$('#slideSelect');sel.replaceChildren();state.slides.forEach((s,i)=>{let o=document.createElement('option');o.value=i;o.textContent=`分鏡 ${i+1}｜${s.title.slice(0,16)}`;sel.appendChild(o)});if(!state.slides.length){renderPreview();return}state.current=Math.max(0,Math.min(state.current,state.slides.length-1));sel.value=state.current;const s=state.slides[state.current];$('#editTitle').value=s.title;$('#editBody').value=s.body;$('#editImagePrompt').value=s.image_prompt;$('#previewIndex').textContent=`${state.current+1} / ${state.slides.length}（僅編輯介面顯示）`;renderPreview()}
$('#slideSelect').addEventListener('change',()=>{state.current=Number($('#slideSelect').value);renderEditor()});['editTitle','editBody','editImagePrompt'].forEach(id=>$('#'+id).addEventListener('input',()=>{let s=state.slides[state.current];if(!s)return;s.title=$('#editTitle').value;s.body=$('#editBody').value;s.image_prompt=$('#editImagePrompt').value;renderPreview()}));
$('#prevBtn').addEventListener('click',()=>{state.current=(state.current-1+state.slides.length)%state.slides.length;renderEditor()});$('#nextBtn').addEventListener('click',()=>{state.current=(state.current+1)%state.slides.length;renderEditor()});
$('#photosInput').addEventListener('change',async e=>{const files=[...e.target.files].filter(f=>f.type.startsWith('image/')).slice(0,15);state.uploads=[];for(let f of files){try{let url=URL.createObjectURL(f);let image=await loadImage(url);state.uploads.push(image)}catch{}}$('#photosStatus').textContent=`已選 ${state.uploads.length} 張照片，僅在本機瀏覽器處理`;toast(`已讀取 ${state.uploads.length} 張照片，按「依序套用上傳照片」即可套用`)});
$('#applyPhotos').addEventListener('click',()=>{if(!state.slides.length||!state.uploads.length){toast('請先產生腳本並上傳照片');return}state.images=state.slides.map((_,i)=>state.uploads[i%state.uploads.length]);renderPreview();toast(`已套用 ${state.uploads.length} 張上傳照片；可逐張下載`) });
function loadImage(src){return new Promise((resolve,reject)=>{let img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
$('#aiBgBtn').addEventListener('click',async()=>{if(!state.slides.length){toast('請先產生腳本');return}let b=$('#aiBgBtn');b.disabled=true;b.textContent='正在生成圖片（付費 API）…';try{let s=state.slides[state.current];let d=await postJSON('/api/image',{prompt:s.image_prompt||s.title,style:styles[state.style].name});state.images[state.current]=await loadImage(d.data_url);renderPreview();toast('AI 背景已套用。中文文字由網站排版，請檢查畫面。')}catch(e){toast('AI 生圖失敗：'+e.message)}finally{b.disabled=false;b.textContent='✦ AI 產生這一張背景'}});
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function textLines(ctx,text,maxWidth){let output=[];for(let raw of String(text||'').split('\n')){if(!raw){output.push('');continue}let line='';for(let ch of raw){if(ctx.measureText(line+ch).width>maxWidth && line){output.push(line);line=ch}else line+=ch}if(line)output.push(line)}return output}
function drawCover(ctx,img){let sc=Math.max(1080/img.naturalWidth,1350/img.naturalHeight);let w=img.naturalWidth*sc,h=img.naturalHeight*sc;ctx.drawImage(img,(1080-w)/2,(1350-h)/2,w,h)}
function drawSlide(canvas,i){
 const ctx=canvas.getContext('2d');
 const s=state.slides[i]||{title:'作興趣農場',body:'南投親子露營知識整理'};
 const st=styles[state.style], photo=state.images[i];
 ctx.clearRect(0,0,1080,1350);ctx.fillStyle=st.bg;ctx.fillRect(0,0,1080,1350);
 if(photo){
  drawCover(ctx,photo);
  const shade=ctx.createLinearGradient(0,0,0,1350);
  shade.addColorStop(0,'rgba(8,14,14,.14)');
  shade.addColorStop(.35,'rgba(8,14,14,.06)');
  shade.addColorStop(.76,'rgba(8,14,14,.36)');
  shade.addColorStop(1,'rgba(8,14,14,.61)');
  ctx.fillStyle=shade;ctx.fillRect(0,0,1080,1350);
 }else{
  ctx.save();ctx.globalAlpha=.15;ctx.fillStyle=st.accent;ctx.beginPath();
  ctx.ellipse(830,470,400,570,-.3,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 ctx.textBaseline='top';
 const family='"Noto Sans TC","Microsoft JhengHei",sans-serif';
 const head=String(s.title||'').trim();
 const body=String(s.body||'').trim();
 // Professional photograph-first layout: no top-left brand or logo, no slide index.
 // 50% translucent black panel with generous padding; auto-fit to avoid clipped 80-character scripts.
 const panelX=57,panelW=966,padX=47,innerW=panelW-2*padX;
 let titleSize=70,bodySize=37,titleLines=[],bodyLines=[],lineTitle=0,lineBody=0,panelH=0;
 const available=900;
 for(let attempt=0;attempt<30;attempt++){
  ctx.font='800 '+titleSize+'px '+family;
  titleLines=textLines(ctx,head,innerW);
  ctx.font='500 '+bodySize+'px '+family;
  bodyLines=textLines(ctx,body,innerW);
  lineTitle=Math.round(titleSize*1.3);lineBody=Math.round(bodySize*1.48);
  panelH=72+titleLines.length*lineTitle+30+bodyLines.length*lineBody+74;
  if(panelH<=available)break;
  if(titleSize>45)titleSize-=3;
  if(bodySize>25)bodySize-=2;
  if(titleSize<=45&&bodySize<=25)break;
 }
 panelH=Math.min(available,panelH);
 const y=Math.max(235,1208-panelH);
 ctx.fillStyle='rgba(0,0,0,.50)';rounded(ctx,panelX,y,panelW,panelH,28);ctx.fill();
 ctx.fillStyle=st.accent;ctx.fillRect(panelX+padX,y+36,86,5);
 let cursor=y+59;
 ctx.fillStyle='#fff';ctx.font='800 '+titleSize+'px '+family;
 for(let line of titleLines){ctx.fillText(line,panelX+padX,cursor);cursor+=lineTitle}
 cursor+=22;ctx.font='500 '+bodySize+'px '+family;ctx.fillStyle='#f6f6f3';
 for(let line of bodyLines){ctx.fillText(line,panelX+padX,cursor);cursor+=lineBody}
 // Fixed brand handle only in bottom right, outside photo text panel.
 ctx.font='700 29px '+family;ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.6)';
 ctx.shadowBlur=8;const handle='@interest558855';
 ctx.fillText(handle,1010-ctx.measureText(handle).width,1280);
 ctx.shadowBlur=0;
}
function renderPreview(){drawSlide($('#previewCanvas'),state.current)}
function downloadSlide(i){if(!state.slides.length){toast('請先產生腳本');return}let canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;drawSlide(canvas,i);canvas.toBlob(blob=>{if(!blob){toast('圖片轉檔失敗');return}let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download=`作興趣_IG輪播_${String(i+1).padStart(2,'0')}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)},'image/png')}
$('#downloadOne').addEventListener('click',()=>downloadSlide(state.current));
$('#toDownloadBtn').addEventListener('click',()=>{if(!state.slides.length){toast('請先產生腳本');return}activate('download')});$('#backDesignBtn').addEventListener('click',()=>activate('design'));
function renderExports(){const root=$('#exportGrid');root.replaceChildren();if(!state.slides.length){root.innerHTML='<div class="empty">目前沒有可下載圖片，請先完成腳本。</div>';return}state.slides.forEach((s,i)=>{let card=document.createElement('div');card.className='export-card';let can=document.createElement('canvas');can.width=1080;can.height=1350;drawSlide(can,i);can.title='點擊圖片即可下載 PNG';can.addEventListener('click',()=>downloadSlide(i));let actions=document.createElement('div');actions.className='export-actions';let label=document.createElement('strong');label.textContent=s.title.slice(0,23);let btn=document.createElement('button');btn.className='primary';btn.textContent='↓ 下載這張';btn.addEventListener('click',()=>downloadSlide(i));actions.append(label,btn);card.append(can,actions);root.appendChild(card)})}
async function status(){try{let r=await fetch('/api/status');let d=await r.json();state.ai=d.ai_configured;$('#apiStatus').textContent=state.ai?'AI API 已設定｜正式 AI 模式':'模板模式｜可選擇設定 AI API';}catch{$('#apiStatus').textContent='服務異常，請確認 Python 已啟動'}}
status();renderPreview();
