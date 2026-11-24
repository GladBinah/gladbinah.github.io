function verseKey(ref){if(typeof ref!=="string"||!/^[1-9]\d*:[1-9]\d*$/.test(ref))throw Error("Invalid verse reference");const [c,v]=ref.split(":").map(Number);if(!Number.isSafeInteger(c)||!Number.isSafeInteger(v))throw Error("Invalid verse number");return [c,v]}

function compareRef(a,b){const x=verseKey(a),y=verseKey(b);return x[0]-y[0]||x[1]-y[1]}

function expectedRefs(start,end,counts){const [a,b]=verseKey(start),[c,d]=verseKey(end);if(compareRef(start,end)>0||!Array.isArray(counts)||a<1||c>counts.length||b>counts[a-1]||d>counts[c-1])throw Error("Invalid canonical range");const refs=[];for(let ch=a;ch<=c;ch++){const max=counts[ch-1];if(!Number.isSafeInteger(max)||max<1||max>200)throw Error("Invalid chapter count");for(let v=ch===a?b:1;v<=(ch===c?d:max);v++)refs.push(ch+":"+v)}return refs}

function selectPassage(data,language,start,end,counts){
 if(compareRef(start,end)>0)throw Error("Reversed reading range");
 if(!data||data.preview!==false||!data.version?.[language]||!data.verses?.[language]||!Array.isArray(data.paragraphs))return {paragraphs:[],refs:[],ranges:[],full:false};
 const expected=expectedRefs(start,end,counts),index=new Map(expected.map((r,i)=>[r,i])),raw=data.verses[language],paragraphs=[],refs=[],ranges=[];let last=-2,range=null;
 for(const p of data.paragraphs){if(!Array.isArray(p))throw Error("Invalid paragraph");const matches=[];for(const ref of p){const i=index.get(ref);if(i===undefined||typeof raw[ref]!=="string"||!raw[ref].trim())continue;if(i<=last)throw Error("Duplicate or out-of-order verse");if(!range||i!==last+1){range={start:ref,end:ref};ranges.push(range)}else range.end=ref;matches.push(ref);refs.push(ref);last=i;}if(matches.length)paragraphs.push(matches);}
 return {paragraphs,refs,ranges,full:refs.length===expected.length};
}

function overlaps(a,b,c,d){return compareRef(a,d)<=0&&compareRef(c,b)<=0}

function installCommentaryReader(){
 const current=document.currentScript;if(!current?.src)return;
 const siteRoot=new URL("../",current.src),cache=new Map();
 function json(path){const url=new URL(path,siteRoot);if(url.origin!==siteRoot.origin)throw Error("Invalid internal URL");if(!cache.has(url.href))cache.set(url.href,fetch(url).then(r=>{if(!r.ok)throw Error("Content unavailable");return r.json()}).catch(e=>{cache.delete(url.href);throw e}));return cache.get(url.href)}
 const catalog=()=>json("assets/scripture/catalog.json"),add=(p,t,cls,txt)=>{const x=document.createElement(t);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;p.append(x);return x};
 const uiEn=(document.documentElement.lang||"ko").toLowerCase().startsWith("en"),tr=(k,e)=>uiEn?e:k;
 const safePath=p=>typeof p==="string"&&/^[a-z0-9][a-z0-9/._-]*\/?$/i.test(p)&&!p.split("/").includes("..");
 const dataFor=entry=>safePath(entry?.data)&&entry.data.endsWith(".json")?json("assets/scripture/"+entry.data):Promise.resolve(null);
 function href(p,path,hash,text){if(!safePath(path))return;const a=add(p,"a","",text),url=new URL(path,siteRoot);if(hash)url.hash=hash;a.href=url.href;return a}
 function appendVerse(p,text,spans){let last=0;for(const s of Array.isArray(spans)?[...spans].sort((a,b)=>a.start-b.start):[]){if(!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start<last||s.end<=s.start||s.end>text.length)continue;p.append(document.createTextNode(text.slice(last,s.start)));add(p,"strong","sr-divine-name",text.slice(s.start,s.end));last=s.end;}p.append(document.createTextNode(text.slice(last)))}
 async function mount(root){
  if(root.dataset.loaded==="true"||root.dataset.loading==="true")return;root.dataset.loading="true";
  const start=root.dataset.start,end=root.dataset.end,book=root.dataset.book,panel=add(root,"div","commentary-scripture-content");
  try{
   if(compareRef(start,end)>0)throw Error("Invalid range");
   const c=await catalog(),entry=Object.prototype.hasOwnProperty.call(c.books||{},book)?c.books[book]:null,data=await dataFor(entry);
   const versions=data?.preview===false?data.version:null,selections={ko:selectPassage(data,"ko",start,end,entry?.chapter_verse_counts),en:selectPassage(data,"en",start,end,entry?.chapter_verse_counts)};
   const available=["ko","en"].filter(l=>selections[l].refs.length),fallback=root.querySelector(".commentary-scripture-fallback");
   if(!available.length){add(panel,"p","sr-meta",tr("이 읽기 범위의 자체 번역은 아직 공개되지 않았습니다. 가지고 계신 성경으로 먼저 읽어 주세요.","No project translation is published for this reading range. Please use your own Bible."));return;}
   const controls=add(panel,"div","commentary-scripture-controls");controls.setAttribute("role","group");controls.setAttribute("aria-label",tr("본문 언어","Scripture language"));
   const body=add(panel,"div","commentary-scripture-passage"),buttons=new Map();
   const render=l=>{
    body.replaceChildren();body.lang=l;for(const [k,b] of buttons)b.setAttribute("aria-pressed",String(k===l));
    const sel=selections[l],rangeLabel=sel.ranges.map(r=>r.start===r.end?r.start:r.start+"–"+r.end).join(", ");
    add(body,"p","sr-meta",(l==="ko"?"KJV 한글성경":"KJV Reading Edition")+" · v"+versions[l]+" · "+rangeLabel);
    if(!sel.full)add(body,"p","commentary-scripture-status",tr("부분 공개: 위에 표시된 범위만 제공됩니다. 나머지는 가지고 계신 성경으로 읽어 주세요.","Partial publication: only the displayed ranges are available. Please read the remainder in your own Bible."));
    for(const p of sel.paragraphs){const el=add(body,"p","sr-paragraph");let previousChapter=null;for(const ref of p){if(previousChapter!==null)el.append(document.createTextNode(" "));const [chapter,verse]=verseKey(ref),v=add(el,"span","sr-verse");add(v,"strong","sr-verse-number",previousChapter!==chapter?ref:String(verse));v.append(document.createTextNode(" "));appendVerse(v,data.verses[l][ref],data.typography?.[l]?.[ref]);previousChapter=chapter;}}
    if(safePath(entry.reader)){const links=add(body,"p","commentary-scripture-links"),hash="sr-"+l+"-"+sel.refs[0].replace(":","-");href(links,entry.reader,hash,tr("성경 본문 열기","Open Scripture"));links.append(document.createTextNode(" · "));href(links,entry.reader,hash+"-study",tr("원어 학습 열기","Open original-language study"));}
   };
   for(const l of available){const b=add(controls,"button","sr-control",l==="ko"?"한국어":"English KJV");b.type="button";b.addEventListener("click",()=>render(l));buttons.set(l,b)}
   render(available.includes(root.dataset.lang)?root.dataset.lang:(available.includes("ko")?"ko":available[0]));
   if(fallback)fallback.hidden=true;
  }catch(e){console.warn("Commentary scripture reader:",e);panel.replaceChildren();add(panel,"p","sr-meta",tr("본문 데이터를 불러오지 못했습니다. 확인된 본문 링크 또는 가지고 계신 성경을 이용해 주세요.","Scripture could not be loaded. Use the verified link or your own Bible."))}
  finally{root.dataset.loaded="true";root.dataset.loading="false"}
 }
 async function decorateTranslation(root){
  try{
   const c=await catalog(),entry=Object.entries(c.books||{}).find(([,x])=>x.data===root.dataset.section+".json");if(!entry)return;
   const [book,rec]=entry,commentary=rec.commentary;if(!commentary||!safePath(commentary.manifest)||!safePath(commentary.reader))return;
   const [data,manifest]=await Promise.all([dataFor(rec),json(commentary.manifest)]);if(!data||data.preview!==false||manifest.book!==book||!Array.isArray(manifest.units))return;
   const units=manifest.units.filter(u=>u.status==="published"&&["section","part_reading"].includes(u.kind)&&/^[A-Z0-9-]+$/.test(u.id)&&typeof u.start_ref==="string"&&typeof u.end_ref==="string"&&compareRef(u.start_ref,u.end_ref)<=0);
   const refs=data.paragraphs.flat(),sections=data.sections||[];
   function refresh(){for(let i=0;i<sections.length;i++){const sec=sections[i];if(!/^[A-Z0-9-]+$/.test(sec.id))continue;const head=root.querySelector("h2.sr-reading-section[id='"+sec.id+"']");if(!head||head.nextElementSibling?.classList.contains("commentary-related"))continue;const lo=refs.indexOf(sec.start_ref),hi=i+1<sections.length?refs.indexOf(sections[i+1].start_ref)-1:refs.length-1;if(lo<0||hi<lo)continue;const matches=units.filter(u=>overlaps(refs[lo],refs[hi],u.start_ref,u.end_ref));if(!matches.length)continue;const p=document.createElement("p");p.className="commentary-related sr-meta";p.append(document.createTextNode(tr("관련 해설: ","Related commentary: ")));matches.forEach((u,j)=>{if(j)p.append(document.createTextNode(" · "));const title=typeof u.title==="string"?u.title:u.title?.[uiEn?"en":"ko"];href(p,commentary.reader,u.id,title||u.start_ref+"–"+u.end_ref)});head.after(p);}}
   refresh();new MutationObserver(refresh).observe(root,{childList:true,subtree:true});
  }catch(e){console.warn("Related commentary links:",e)}
 }
 function init(){for(const d of document.querySelectorAll("details.commentary-scripture[data-book][data-start][data-end]")){d.addEventListener("toggle",()=>{if(d.open)mount(d)});if(d.open)mount(d)}for(const root of document.querySelectorAll(".scripture-reader[data-section]"))decorateTranslation(root);}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}

installCommentaryReader();
