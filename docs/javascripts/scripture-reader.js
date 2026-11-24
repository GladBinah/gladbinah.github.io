function mountScriptureReader(root,data,initialLang){
if(root.dataset.ready==="true")return;
root.dataset.ready="true";
let lang=initialLang==="en"?"en":"ko",mode="plain",view="reading",active=null,previousFocus=null;
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined&&text!==null)e.textContent=text;return e};
const tr=(ko,en)=>lang==="ko"?ko:en;
const append=(p,tag,cls,text)=>{const e=node(tag,cls,text);p.append(e);return e};
const link=(p,url,text)=>{if(!/^https:\/\//.test(url||""))return;const e=append(p,"a","sr-source-link",text);e.href=url;e.target="_blank";e.rel="noopener noreferrer";return e};
const heb=(p,text,cls="sr-hebrew")=>{let e=append(p,"bdi",cls,text);e.dir="rtl";e.lang="he";return e};
const btn=(p,label,fn,cls="sr-control")=>{const e=append(p,"button",cls,label);e.type="button";e.onclick=fn;return e};
root.replaceChildren();
const head=append(root,"div","sr-header"), heading=append(head,"h2","sr-title"),meta=append(head,"div","sr-meta");
const vg=append(root,"div","sr-view-tabs");vg.setAttribute("role","group");
const controls=append(root,"div","sr-controls sr-reading-controls"),lg=append(controls,"div","sr-controls-group"),mg=append(controls,"div","sr-controls-group");lg.setAttribute("role","group");mg.setAttribute("role","group");
const koBtn=btn(lg,"한국어",()=>setLang("ko")),enBtn=btn(lg,"영어",()=>setLang("en"));
const readBtn=btn(vg,"",()=>showReading(),"sr-view-tab"),notesBtn=btn(vg,"",()=>showNotes(),"sr-view-tab");
const plainBtn=btn(mg,"",()=>setMode("plain")),studyBtn=btn(mg,"",()=>setMode("study"));
const tip=append(root,"p","sr-tip"),reading=append(root,"article","sr-reading"),notesView=append(root,"section","sr-notes");
const noteHead=append(notesView,"h3","sr-subheading"),noteBar=append(notesView,"div","sr-notes-toolbar"),search=append(noteBar,"input","sr-search");
search.type="search";search.addEventListener("input",()=>filterNotes());
const expand=btn(noteBar,"",()=>noteList.querySelectorAll("details:not([hidden])").forEach(d=>d.open=true)),collapse=btn(noteBar,"",()=>noteList.querySelectorAll("details").forEach(d=>d.open=false));
const notesCount=append(notesView,"p","sr-meta"),noteList=append(notesView,"div","sr-note-list");
let noteSection=null;
const noteSectionTitles=[];
for(const n of data.notes){const group=(data.sections||[]).find(s=>n.id.startsWith(s.id+"-"));if(group&&group.id!==noteSection){noteSection=group.id;const h=append(noteList,"h4","sr-note-section",group.coverage+" — "+group.title[lang]);noteSectionTitles.push([h,group]);}const d=append(noteList,"details","sr-note");d.id=n.id;d.dataset.search=(n.title+" "+n.body_html.replace(/<[^>]+>/g," ")).toLowerCase();const s=append(d,"summary","",n.title);const body=append(d,"div","sr-note-body");body.lang="ko";body.innerHTML=n.body_html}
const extra=append(notesView,"div","sr-notes-extra");
const extraPanels=[["대조 출처","Comparison sources",data.notes_sources_html],["나머지 절의 대조 및 공통 원칙","Other comparisons and shared principles",data.notes_general_html],["결정 및 수정 이력","Decision and revision history",data.notes_history_html]].map(([k,e,h])=>{const d=append(extra,"details","sr-note");const s=append(d,"summary","",k);const b=append(d,"div","sr-note-body");b.lang="ko";b.innerHTML=h;return [s,k,e]});
const footer=append(root,"footer","sr-footer");
const dlg=append(root,"dialog","sr-dialog");dlg.setAttribute("aria-labelledby","sr-dialog-title-"+data.section_id);const dt=append(dlg,"div","sr-dialog-top");const dl=append(dt,"span","sr-meta");const close=btn(dt,"×",()=>dlg.close(),"sr-close");close.setAttribute("aria-label","Close");
const title=append(dlg,"h3","sr-dialog-title");title.id="sr-dialog-title-"+data.section_id;
const content=append(dlg,"div","sr-dialog-content");
dlg.addEventListener("close",()=>{active=null;if(previousFocus?.isConnected)previousFocus.focus()});
dlg.addEventListener("click",e=>{if(e.target===dlg){const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close()}});
const pressed=(b,val)=>b.setAttribute("aria-pressed",String(val));
function filterNotes(){const q=search.value.trim().toLowerCase();let count=0;for(const d of noteList.querySelectorAll(':scope > details')){d.hidden=!!q&&!d.dataset.search.includes(q);if(!d.hidden)count++}for(const [h,s] of noteSectionTitles){h.hidden=!!q;h.textContent=s.coverage+' — '+s.title[lang]}notesCount.textContent=tr(`번역 쟁점 ${count} / ${data.notes.length}개`,`Translation issues ${count} / ${data.notes.length}`)}
function renderReading(){
reading.replaceChildren();reading.lang=lang;
const starts=new Map((data.sections||[]).map(s=>[s.start_ref,s]));
function appendRange(parent,raw,from,to,spans){
let last=from;
for(const s of spans){const a=Math.max(from,s.start),b=Math.min(to,s.end);if(b<=a)continue;if(a>last)parent.append(document.createTextNode(raw.slice(last,a)));append(parent,"strong","sr-divine-name",raw.slice(a,b));last=b}
if(last<to)parent.append(document.createTextNode(raw.slice(last,to)));
}
for(const p of data.paragraphs){
const section=starts.get(p[0]);if(section){const h=append(reading,"h3","sr-reading-section",section.coverage+" — "+section.title[lang]);h.id=section.id;}
const el=append(reading,"p","sr-paragraph");
for(let i=0;i<p.length;i++){const ref=p[i];if(i)el.append(document.createTextNode(" "));const v=append(el,"span","sr-verse");v.id="sr-"+lang+"-"+ref.replace(":","-");const label=ref.endsWith(":1")||starts.has(ref)?ref:ref.split(":")[1];append(v,"strong","sr-verse-number",label);v.append(document.createTextNode(" "));const raw=data.verses[lang][ref],spans=data.typography?.[lang]?.[ref]||[];
if(mode==="plain"){appendRange(v,raw,0,raw.length,spans);continue}
const links=data.alignments.filter(a=>a.verse_ref===ref&&a.click_spans[lang]).sort((a,b)=>a.click_spans[lang].start-b.click_spans[lang].start);let last=0;
for(const a of links){const s=a.click_spans[lang];if(s.start<last||raw.slice(s.start,s.end)!==s.text)throw Error("Invalid stored lexical span "+a.id);appendRange(v,raw,last,s.start,spans);const b=btn(v,"",()=>openLex(a,b),"sr-lex");appendRange(b,raw,s.start,s.end,spans);b.dataset.alignment=a.id;b.setAttribute("aria-label",s.text+tr(" — 원어 학습"," — Hebrew lexicon"));last=s.end}
appendRange(v,raw,last,raw.length,spans);
}}
}
function refresh(){heading.textContent=data.book[lang]+" "+data.coverage+" — "+data.title[lang];meta.textContent=tr(`한국어 번역 ${data.version.ko} · 영어 편집본 ${data.version.en}`,`Korean translation ${data.version.ko} · KJV Reading Edition ${data.version.en}`)+(data.preview?tr(" · 출판 전 검토용"," · private publication preview"):data.publication_date?tr(" · 공개 "," · Published ")+data.publication_date:"");lg.setAttribute("aria-label",tr("읽기 언어","Reading language"));vg.setAttribute("aria-label",tr("자료 선택","Content view"));mg.setAttribute("aria-label",tr("읽기 방식","Reading mode"));koBtn.textContent=tr("한국어","Korean");enBtn.textContent=tr("영어","English");readBtn.textContent=tr("성경 본문","Scripture");notesBtn.textContent=tr("번역 기록","Translation Notes");plainBtn.textContent=tr("일반 읽기","Reading");studyBtn.textContent=tr("원어 학습","Original-language study");pressed(koBtn,lang==="ko");pressed(enBtn,lang==="en");pressed(readBtn,view==="reading");pressed(notesBtn,view==="notes");pressed(plainBtn,mode==="plain");pressed(studyBtn,mode==="study");controls.hidden=view!=="reading";reading.hidden=view!=="reading";notesView.hidden=view!=="notes";tip.hidden=view!=="reading"||mode!=="study";tip.textContent=tr("밑줄 친 핵심 어휘나 어구를 클릭하여 실제 히브리어와 사전 설명을 확인할 수 있습니다.","Select an underlined key word or phrase to explore its Hebrew text form and dictionary entries.");noteHead.textContent=tr("구절별 Translation Notes","Translation Notes (Korean)");search.placeholder=tr("구절·번역어·논점 검색","Search Korean translation notes");search.setAttribute("aria-label",search.placeholder);expand.textContent=tr("모두 펼치기","Expand all");collapse.textContent=tr("모두 접기","Collapse all");extraPanels.forEach(([s,k,e])=>s.textContent=lang==="ko"?k:e);filterNotes();footer.replaceChildren();
const copyrightLine=append(footer,"p","sr-footer-license");
append(copyrightLine,"span","",tr("한국어 번역 © GladBinah · ","Korean translation © GladBinah · "));
link(copyrightLine,"https://creativecommons.org/licenses/by-nc-sa/4.0/","CC BY-NC-SA 4.0");
const sourcesLine=append(footer,"p","sr-footer-sources");
append(sourcesLine,"span","",tr("원어 자료: ","Original-language resources: "));
link(sourcesLine,data.source_url,"Open Scriptures Hebrew Bible Project");
sourcesLine.append(document.createTextNode(" · "));link(sourcesLine,data.license_url,"CC BY 4.0");
sourcesLine.append(document.createTextNode(" · "));link(sourcesLine,lang==="ko"?"https://gladbinah.github.io/policies/":"https://gladbinah.github.io/en/policies/",tr("저작권 및 AI 활용 안내","Copyright & AI Use"));
sourcesLine.append(document.createTextNode(" · "));link(sourcesLine,"https://github.com/GladBinah/gladbinah.github.io/issues",tr("오류 제보","Report an error"));
renderReading();}
function setLang(l){if(dlg.open)dlg.close();lang=l;refresh()}
function setMode(m){mode=m;view="reading";refresh()}
function showReading(){view="reading";if(/^#GEN-S\d+-T\d+$/.test(location.hash))history.replaceState(null,"",location.pathname+location.search);refresh()}
function showNotes(id){view="notes";refresh();if(id){search.value="";filterNotes();const d=document.getElementById(id);if(d&&root.contains(d)){d.open=true;d.scrollIntoView({block:"start"});d.querySelector("summary").focus({preventScroll:true});if(location.hash!=="#"+id)history.replaceState(null,"","#"+id)}}}
const label=(p,k,e)=>append(p,"div","sr-label",tr(k,e));
const field=(p,k,e,value,he=false)=>{const f=append(p,"div","sr-field");label(f,k,e);if(he)heb(f,value);else append(f,"div","sr-field-value",value??"—");return f};
// Render source hierarchy without cumulative font scaling or label-only rows.
// An empty numbered parent is retained as a prefix on its descendants.
function senseTree(parent,tree){
const wrap=append(parent,"div","sr-bdb-tree");
if(tree.text)append(wrap,"p","sr-source-text sr-bdb-head",tree.text);
function branch(p,children,prefix=[]){
if(!children?.length)return;
const ul=append(p,"ul","sr-senses");ul.setAttribute("role","list");
function add(s,carry){
const marks=s.number?[...carry,s.number]:carry;
if(!s.text&&s.children?.length){for(const child of s.children)add(child,marks);return}
const li=append(ul,"li","sr-sense-item");
const row=append(li,"div","sr-sense-line"+(marks.length?" sr-numbered":"")+(s.children?.length?" sr-sense-parent":""));
if(marks.length){const display=marks.map(n=>/[.)]$/.test(n)?n:n+".").join(" ");append(row,"span","sr-sense-number",display)}
if(s.text)append(row,"div","sr-source-text",s.text);
if(s.children?.length)branch(li,s.children);
}
for(const s of children)add(s,prefix);
}
branch(wrap,tree.children);
}
function openLex(a,trigger){
previousFocus=trigger;active=a;const context=data.context[a.context_id];title.textContent=a.click_spans[lang].text;dl.textContent=tr("원어 학습 · 창세기 ","Original-language study · Genesis ")+a.verse_ref;close.setAttribute("aria-label",tr("닫기","Close"));
content.replaceChildren();const source=append(content,"div","sr-source-hero");label(source,"본문 원어","Hebrew text form");heb(source,a.source_phrase,"sr-hebrew sr-hero");append(source,"div","sr-transliteration",a.source_phrase_transliteration);const other=a.click_spans[lang==="ko"?"en":"ko"];if(other)append(source,"p","sr-counterpart",other.text);
if(context.scope_note_ko)append(source,"p","sr-scope",lang==="ko"?context.scope_note_ko:context.scope_note_en);
append(content,"h4","sr-section-title",tr("본문 원어 ↔ 번역 대응","Hebrew ↔ translation correspondence"));
for(const p of a.correspondence){const block=append(content,"div","sr-align-card");for(const id of p.token_ids){const t=data.tokens[id];const d=data.lexicon[t.lexeme_id];const row=append(block,"div","sr-fields");field(row,"본문형","Text form",t.surface,true);field(row,"사전 표제어","Dictionary lemma",d.lemma,true);field(row,"어휘 ID","Lexical ID",d.external_ids.strong+(d.external_ids.oshb_augmented_strong!==d.external_ids.strong.slice(1)?" · "+d.external_ids.oshb_augmented_strong:""));}
const pair=append(block,"div","sr-fields sr-pairs");field(pair,"한국어 대응","Korean correspondence",p.ko.map(x=>x.text).join(" … ")||"—");field(pair,"KJV 영어 대응","KJV correspondence",p.en.map(x=>x.text).join(" … ")||"—")}
append(content,"h4","sr-section-title",tr("사전 표제어와 정의","Dictionary entries"));
for(const id of new Set(a.lexical_token_ids.map(i=>data.tokens[i].lexeme_id))){const d=data.lexicon[id];const card=append(content,"div","sr-dict-card");const h=append(card,"div","sr-dict-heading");heb(h,d.lemma);append(h,"span","sr-meta",d.transliteration+" · "+d.external_ids.strong);append(card,"strong","sr-dict-name","Brown–Driver–Briggs (BDB)");append(card,"p","sr-definitions",(lang==="ko"?d.bdb.primary_definitions_ko:d.bdb.primary_definitions_en).join(lang==="ko"?", ":", "));
const details=append(card,"details","sr-detail");append(details,"summary","",tr("BDB 상세 의미 분류·용례","BDB detailed senses and examples"));if(lang==="ko"){append(details,"p","sr-meta","AI 한국어 의미 분류 요약");append(details,"p","sr-overview",d.bdb.sense_overview_ko);const original=append(details,"details","sr-detail");append(original,"summary","","영어 사전 원문 구조");senseTree(original,d.bdb.entry_en);}else senseTree(details,d.bdb.entry_en);if(!d.bdb.entry_en.children.length)append(details,"p","sr-meta",tr("이 전자 사전 항목에는 별도의 상세 의미 분류가 수록되지 않았습니다.","No additional sense divisions are present in this digital entry."));link(card,d.bdb.source_url,tr("BDB 원자료","BDB source entry")+" · "+d.external_ids.bdb);
const strong=append(card,"details","sr-detail");append(strong,"summary","","Strong’s Hebrew Dictionary");append(strong,"p","",lang==="ko"?d.strong.meaning_ko:d.strong.meaning_en);if(lang==="ko"){const sd=append(strong,"details","sr-detail");append(sd,"summary","","영어 원문");append(sd,"p","",d.strong.meaning_en)}append(strong,"p","sr-meta",tr("Strong의 포괄적 정의가 여러 어휘를 포함할 수 있습니다. 모든 의미가 이 구절에 적용되는 것은 아닙니다.","Strong may group distinct lexemes. Not every listed sense applies here."));link(strong,d.strong.source_url,tr("Strong 원자료","Strong source entry")); }
const note=append(content,"section","sr-context");append(note,"h4","",tr("우리의 문맥별 번역 해설","Our contextual translation note"));append(note,"p","",lang==="ko"?context.context_ko:context.context_en);if(context.translation_note_id){btn(note,tr("상세 Translation Notes →","Translation Notes (Korean) →"),()=>{dlg.close();showNotes(context.translation_note_id)},"sr-notes-link")}
const disclaimer=append(content,"div","sr-disclaimer");append(disclaimer,"p","",tr("한국어 사전 설명: ChatGPT 번역 및 원자료 대조. 개별 인간 검수는 필수 절차가 아닙니다. BDB 전자 자료의 수록 범위는 항목마다 다릅니다.","Korean dictionary explanations are translated and source-checked by ChatGPT without mandatory individual human review. BDB digital coverage varies by entry."));append(disclaimer,"span","",data.attribution+" · ");link(disclaimer,data.license_url,"CC BY 4.0");dlg.showModal();dlg.scrollTop=0;close.focus();
}
refresh();const route=()=>{const id=location.hash.slice(1);if(data.notes.some(n=>n.id===id))showNotes(id)};window.addEventListener("hashchange",route);route();
}
(function bootstrap(){
const current=document.currentScript;
const urlBase=current?.src?new URL("../assets/scripture/",current.src):null;
function init(){for(const root of document.querySelectorAll(".scripture-reader[data-section]")){if(root.dataset.ready==="true"||root.dataset.loading==="true")continue;root.dataset.loading="true";const inline=root.querySelector('script[type="application/json"]');const lang=root.dataset.lang||"ko";if(inline){try{mountScriptureReader(root,JSON.parse(inline.textContent),lang)}catch(e){console.error(e);root.dataset.loading="false"}}else if(urlBase){const path=root.dataset.section;if(!/^[a-z0-9-]+\/[A-Z0-9-]+$/.test(path))continue;fetch(new URL(path+".json",urlBase)).then(r=>{if(!r.ok)throw Error("Reader data unavailable");return r.json()}).then(d=>mountScriptureReader(root,d,lang)).catch(e=>{console.error(e);root.dataset.loading="false";const msg=document.createElement("p");msg.textContent=lang==="ko"?"원어 학습 데이터를 불러오지 못했습니다. 성경 본문은 아래에서 읽을 수 있습니다.":"Study data could not be loaded. The Scripture text remains available below.";root.prepend(msg)})}}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
