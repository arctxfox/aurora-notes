const KEY="aurora-notes:v1",PK="aurora-notes:palette",TK="aurora-notes:tasks",$=s=>document.querySelector(s),DEF=["#0a3d6b","#f08a2e","#1a9e6b","#7a56d6","#111111"];
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
let palette=(Array.isArray(load(PK))?load(PK):DEF).filter(c=>/^#[0-9a-f]{6}$/.test(c));if(!palette.length)palette=[...DEF];
let notes=load(KEY,[]),cur=null,timer,cs=null,pan=null,vx=0,vy=0,z=1,hh=0,ss=1,vv=1,hist={},redo={},tool={c:palette[0],t:"p",pw:4,ew:24};
if(!Array.isArray(notes))notes=[];
notes.forEach(n=>{n.strokes=Array.isArray(n.strokes)?n.strokes:[];n.mode=n.mode==="draw"?"draw":"text";n.items=Array.isArray(n.items)?n.items:[]});
const get=()=>notes.find(n=>n.id===cur),cv=$("#cv"),g=cv.getContext("2d"),itemsEl=$("#items"),ring=$("#ring"),width=()=>tool.t==="e"?tool.ew:tool.pw;
const cloneState=n=>({strokes:n.strokes.map(s=>({...s,p:s.p?s.p.map(pt=>[...pt]):undefined})),items:n.items.map(it=>({...it}))});
function pushHist(n=get()){if(!n)return;(hist[n.id]=hist[n.id]||[]).push(cloneState(n));if(hist[n.id].length>60)hist[n.id].shift();redo[n.id]=[]}
function applyState(n,st){n.strokes=st.strokes;n.items=st.items;renderItems();redraw();touch()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(notes));$("#st").textContent="Saved "+new Date().toLocaleTimeString()}catch{$("#st").textContent="Could not save (storage blocked or full)"}}
function touch(){const n=get();if(!n)return;n.updated=Date.now();count();list();clearTimeout(timer);timer=setTimeout(save,300)}
function list(){const q=$("#q").value.toLowerCase(),ul=$("#notes");ul.textContent="";
 notes.filter(n=>(n.title+" "+n.body).toLowerCase().includes(q)).sort((a,b)=>b.pinned-a.pinned||b.updated-a.updated).forEach(n=>{
  const li=document.createElement("li"),b=document.createElement("button"),s=document.createElement("strong"),p=document.createElement("span");
  b.type="button";b.className=n.id===cur?"on":"";s.textContent=(n.pinned?"★ ":"")+(n.title||"Untitled");p.textContent=n.body.slice(0,60)||(n.strokes.length||n.items.length?"Drawing":"Empty note");
  b.append(s,p);b.onclick=()=>open(n.id);li.append(b);ul.append(li)});
 if(!ul.children.length){const li=document.createElement("li");li.className="none";li.textContent=notes.length?"No matches.":"No notes yet.";ul.append(li)}}
function count(){const n=get();if(!n)return;if(n.mode==="draw"){const k=n.strokes.length;$("#wc").textContent=k+(k===1?" stroke":" strokes")}
 else{const w=n.body.trim().split(/\s+/).filter(Boolean).length;$("#wc").textContent=w+(w===1?" word":" words")}}
/* drawing: world coordinates are CSS pixels, the view is offset by (vx,vy) */
const IM=new WeakMap();
function imgFor(s){let i=IM.get(s);if(!i){i=new Image();i.onload=()=>redraw();i.src=s.src;IM.set(s,i)}return i}
function seg(s,a,b){g.save();g.lineCap=g.lineJoin="round";g.lineWidth=s.w;g.globalCompositeOperation=s.e?"destination-out":"source-over";g.strokeStyle=g.fillStyle=s.c;
 g.beginPath();if(!b)g.arc(a[0],a[1],s.w/2,0,7),g.fill();else{g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke()}g.restore()}
function stroke(s){if(s.f){const im=imgFor(s);if(im.complete!==false&&im.width)g.drawImage(im,s.x,s.y,s.w,s.h);return}const p=s.p;g.save();g.lineCap=g.lineJoin="round";g.lineWidth=s.w;g.globalCompositeOperation=s.e?"destination-out":"source-over";g.strokeStyle=g.fillStyle=s.c;
 if(p.length===1){g.beginPath();g.arc(p[0][0],p[0][1],s.w/2,0,7);g.fill()}
 else{g.beginPath();g.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length-1;i++)g.quadraticCurveTo(p[i][0],p[i][1],(p[i][0]+p[i+1][0])/2,(p[i][1]+p[i+1][1])/2);const l=p[p.length-1];g.lineTo(l[0],l[1]);g.stroke()}g.restore()}
function redraw(){const d=(devicePixelRatio||1)*z;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.setTransform(d,0,0,d,-vx*d,-vy*d);(get()?.strokes||[]).forEach(stroke);itemsEl.style.transform=`translate(${-vx*z}px,${-vy*z}px) scale(${z})`}
function fit(){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);redraw()}
const pt=e=>{const r=cv.getBoundingClientRect();return[+((e.clientX-r.left)/z+vx).toFixed(1),+((e.clientY-r.top)/z+vy).toFixed(1)]};
function moveRing(e){if(e.pointerType==="touch"||pan||tool.t==="s"||tool.t==="f"||tool.t==="t"){ring.hidden=true;return}const w=Math.max(width()*z,4);ring.hidden=false;ring.className=tool.t==="e"?"e":"";ring.style.width=ring.style.height=w+"px";ring.style.left=e.clientX+"px";ring.style.top=e.clientY+"px"}
function clearSel(){itemsEl.querySelectorAll(".it.sel").forEach(el=>el.classList.remove("sel"))}
cv.onmousedown=e=>{if(e.button===1)e.preventDefault()};
cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);
 if(e.button===1){e.preventDefault();pan={x:e.clientX,y:e.clientY,vx,vy};cv.classList.add("pan");ring.hidden=true;return}
 const n=get();if(e.button!==0||!n)return;
 clearSel();
 if(tool.t==="s")return;
 if(tool.t==="f"){doFill(e);return}
 if(tool.t==="t"){pushHist(n);const[x0,y0]=pt(e);n.items.push({k:"t",x:x0,y:y0,w:200,h:64,txt:"",c:tool.c});renderItems();const last=itemsEl.lastChild;if(last){last.classList.add("sel");const ta=last.querySelector("textarea");setTimeout(()=>ta.focus(),0)}touch();return}
 pushHist(n);cs={c:tool.c,w:width(),e:tool.t==="e",p:[pt(e)]};n.strokes.push(cs);seg(cs,cs.p[0])};
cv.onpointermove=e=>{moveRing(e);if(pan){vx=pan.vx-(e.clientX-pan.x)/z;vy=pan.vy-(e.clientY-pan.y)/z;redraw();return}
 if(cs)(e.getCoalescedEvents?.()||[e]).forEach(v=>{const q=pt(v),a=cs.p[cs.p.length-1];cs.p.push(q);seg(cs,a,q)})};
const end=()=>{if(pan){pan=null;cv.classList.remove("pan")}if(cs){cs=null;touch()}};
cv.onpointerup=end;cv.onpointercancel=end;cv.onpointerleave=()=>ring.hidden=true;
cv.onwheel=e=>{if(!e.ctrlKey)return;e.preventDefault();const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,wx=mx/z+vx,wy=my/z+vy;
 z=Math.min(4,Math.max(.25,z*(e.deltaY<0?1.1:1/1.1)));vx=wx-mx/z;vy=wy-my/z;$("#zv").textContent=Math.round(z*100)+"%";redraw();moveRing(e);setTool(tool.t)};
function resetView(){vx=vy=0;z=1;$("#zv").textContent="100%"}
function undo(){const n=get(),h=n&&hist[n.id];if(h&&h.length){(redo[n.id]=redo[n.id]||[]).push(cloneState(n));applyState(n,h.pop())}}
function redoIt(){const n=get(),r=n&&redo[n.id];if(r&&r.length){(hist[n.id]=hist[n.id]||[]).push(cloneState(n));applyState(n,r.pop())}}
$("#undo").onclick=undo;$("#redo").onclick=redoIt;$("#home").onclick=()=>{resetView();redraw();setTool(tool.t)};
$("#clr").onclick=()=>{const n=get();if(n&&(n.strokes.length||n.items.length)&&confirm("Clear the whole drawing?")){pushHist(n);n.strokes=[];n.items=[];renderItems();redraw();touch()}};
function setMode(m,persist){const n=get();if(!n)return;n.mode=m;const d=m==="draw";
 $("#b").hidden=d;cv.hidden=!d;$("#cw").hidden=!d;$("#pen").hidden=!d;$("#edw").classList.toggle("drawing",d);$("#mText").setAttribute("aria-pressed",!d);$("#mDraw").setAttribute("aria-pressed",d);
 if(d)fit();count();if(persist)save()}
$("#mText").onclick=()=>setMode("text",true);$("#mDraw").onclick=()=>setMode("draw",true);
/* tools and colours */
const PRE={p:[2,5,10,20],e:[10,20,40,70]};
function setTool(t){tool.t=t;
 $("#ts")?.setAttribute("aria-pressed",t==="s");$("#tp").setAttribute("aria-pressed",t==="p");$("#te").setAttribute("aria-pressed",t==="e");$("#tf").setAttribute("aria-pressed",t==="f");$("#tt").setAttribute("aria-pressed",t==="t");
 cv.dataset.t=t;$("#cw").classList.toggle("objs",t==="t"||t==="s");
 if(t!=="t"&&t!=="s"){clearSel();if(document.activeElement&&itemsEl.contains(document.activeElement))document.activeElement.blur()}
 $("#pz").value=tool.pw;$("#ez").value=tool.ew;$("#pv").textContent=tool.pw;$("#ev").textContent=tool.ew;
 document.querySelectorAll(".pre button").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.s===tool[b.dataset.k+"w"]));
 const i=$("#rc"),w=Math.max(2,Math.min(width()*z,44));i.style.width=i.style.height=w+"px";i.style.background=t==="e"?"#fff":tool.c;i.style.borderStyle=t==="e"?"dashed":"solid";renderPal()}
["p","e"].forEach(k=>PRE[k].forEach(n=>{const b=document.createElement("button");b.type="button";b.className="b";b.textContent=n;b.dataset.s=n;b.dataset.k=k;
 b.title=(k==="p"?"Pencil ":"Eraser ")+n+" px";b.onclick=()=>{tool[k+"w"]=n;setTool(k)};$(k==="p"?"#pp":"#ep").append(b)}));
if($("#ts"))$("#ts").onclick=()=>setTool("s");
$("#tp").onclick=()=>setTool("p");$("#te").onclick=()=>setTool("e");$("#tf").onclick=()=>setTool("f");$("#tt").onclick=()=>setTool("t");
/* fill: flood-fills what is visible and stores the result as a bitmap layer */
function flood(D,W,H,sx,sy){const si=(sy*W+sx)*4,sr=D[si],sg=D[si+1],sb=D[si+2],sa=D[si+3],M=new Uint8Array(W*H);
 const ok=i=>sa<40?D[i+3]<110:Math.abs(D[i]-sr)+Math.abs(D[i+1]-sg)+Math.abs(D[i+2]-sb)+Math.abs(D[i+3]-sa)<60;
 const st=[sx,sy];while(st.length){const y=st.pop();let x=st.pop();while(x>=0&&!M[y*W+x]&&ok((y*W+x)*4))x--;x++;let up=false,dn=false;
  for(;x<W&&!M[y*W+x]&&ok((y*W+x)*4);x++){M[y*W+x]=1;
   if(y>0){const m=!M[(y-1)*W+x]&&ok(((y-1)*W+x)*4);if(m&&!up)st.push(x,y-1);up=m}
   if(y<H-1){const m=!M[(y+1)*W+x]&&ok(((y+1)*W+x)*4);if(m&&!dn)st.push(x,y+1);dn=m}}}
 return M}
function doFill(e){const n=get(),W=cv.width,H=cv.height,r=cv.getBoundingClientRect(),k=W/r.width,sx=Math.floor((e.clientX-r.left)*k),sy=Math.floor((e.clientY-r.top)*k);
 if(!n||sx<0||sy<0||sx>=W||sy>=H)return;pushHist(n);const M=flood(g.getImageData(0,0,W,H).data,W,H,sx,sy),c=parseInt(tool.c.slice(1),16);
 const o=document.createElement("canvas");o.width=W;o.height=H;const og=o.getContext("2d"),od=og.createImageData(W,H);
 for(let i=0;i<M.length;i++)if(M[i])od.data.set([c>>16,c>>8&255,c&255,255],i*4);og.putImageData(od,0,0);
 const d=(devicePixelRatio||1)*z,it={f:1,x:vx,y:vy,w:W/d,h:H/d,src:o.toDataURL()};IM.set(it,o);n.strokes.push(it);redraw();touch()}
/* text boxes and images: movable, resizable, deletable objects below the drawing layer */
function mkItem(it,n){const d=document.createElement("div"),bar=document.createElement("div"),del=document.createElement("button"),rz=document.createElement("div");
 d.className="it "+it.k;bar.className="bar";bar.title="Drag to move";rz.className="rz";del.type="button";del.textContent="×";del.title="Delete";del.setAttribute("aria-label","Delete");bar.append(del);
 const place=()=>{d.style.left=it.x+"px";d.style.top=it.y+"px";d.style.width=it.w+"px";d.style.height=it.h+"px"};place();
 const sel=()=>{if(tool.t==="s"||tool.t==="t"){clearSel();d.classList.add("sel")}};
 d.onpointerdown=e=>{if(tool.t==="s"||tool.t==="t"){sel();e.stopPropagation()}};
 if(it.k==="t"){const t=document.createElement("textarea");t.value=it.txt||"";t.style.color=it.c;t.setAttribute("aria-label","Text box");
  let snap=false;t.onfocus=()=>{snap=false;sel()};t.onblur=()=>snap=false;
  t.oninput=()=>{if(!snap){pushHist(n);snap=true}it.txt=t.value;touch()};d.append(bar,t,rz)}
 else{const im=document.createElement("img");im.src=it.src;im.alt="Inserted image";im.draggable=false;d.append(bar,im,rz)}
 del.onclick=e=>{e.stopPropagation();pushHist(n);n.items=n.items.filter(x=>x!==it);renderItems();touch()};
 const drag=(el,fn)=>el.onpointerdown=e=>{if(e.button!==0||e.target.tagName==="BUTTON")return;e.preventDefault();e.stopPropagation();sel();el.setPointerCapture(e.pointerId);
  const o={x:e.clientX,y:e.clientY,ix:it.x,iy:it.y,iw:it.w,ih:it.h,moved:false};
  el.onpointermove=v=>{if(!o.moved){pushHist(n);o.moved=true}fn(o,(v.clientX-o.x)/z,(v.clientY-o.y)/z);place()};
  el.onpointerup=()=>{el.onpointermove=el.onpointerup=null;if(o.moved)touch()}};
 drag(bar,(o,dx,dy)=>{it.x=o.ix+dx;it.y=o.iy+dy});drag(rz,(o,dx,dy)=>{it.w=Math.max(40,o.iw+dx);it.h=it.k==="i"?it.w*it.r:Math.max(30,o.ih+dy)});itemsEl.append(d)}
function renderItems(){itemsEl.textContent="";const n=get();if(n)n.items.forEach(it=>mkItem(it,n))}
$("#img").onclick=()=>$("#imf").click();
$("#imf").onchange=e=>{const f=e.target.files[0],n=get();e.target.value="";if(!f||!n||!f.type.startsWith("image/"))return;const rd=new FileReader();
 rd.onload=()=>{const im=new Image();im.onerror=()=>alert("Could not read that image.");im.onload=()=>{const sc=Math.min(1,800/Math.max(im.width,im.height)),c2=document.createElement("canvas");
  c2.width=Math.round(im.width*sc);c2.height=Math.round(im.height*sc);c2.getContext("2d").drawImage(im,0,0,c2.width,c2.height);
  const src=c2.toDataURL(f.type==="image/png"?"image/png":"image/jpeg",.85),w=Math.min(300,c2.width),r=c2.height/c2.width,q=cv.getBoundingClientRect();
  pushHist(n);n.items.push({k:"i",x:vx+(q.width/z-w)/2,y:vy+(q.height/z-w*r)/2,w,h:w*r,r,src});renderItems();setTool("s");if(itemsEl.lastChild)itemsEl.lastChild.classList.add("sel");touch()};im.src=rd.result};rd.readAsDataURL(f)};
$("#pz").oninput=e=>{tool.pw=+e.target.value;setTool("p")};$("#ez").oninput=e=>{tool.ew=+e.target.value;setTool("e")};
const savePal=()=>{try{localStorage.setItem(PK,JSON.stringify(palette))}catch{}};
const rgbStr=c=>{const n=parseInt(c.slice(1),16);return`rgb(${n>>16}, ${n>>8&255}, ${n&255})`};
function parseColor(s){s=s.trim();let m=s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
 if(m){let h=m[1].toLowerCase();if(h.length===3)h=[...h].map(x=>x+x).join("");return"#"+h}
 m=s.match(/^(?:rgba?\()?\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/][^)]*)?\)?$/i);
 return m&&m.slice(1,4).every(v=>+v<=255)?"#"+m.slice(1,4).map(v=>(+v).toString(16).padStart(2,"0")).join(""):null}
function renderPal(){const box=$("#pal");box.textContent="";palette.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="sw";b.style.background=c;
 b.title=c;b.setAttribute("aria-label","Colour "+c);b.setAttribute("aria-pressed",c===tool.c&&(tool.t==="p"||tool.t==="f"||tool.t==="t"));b.onclick=()=>setColor(c);box.append(b)})}
const hsv=(h,s,v)=>{const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return[f(5),f(3),f(1)].map(x=>Math.round(x*255))};
const hex=a=>"#"+a.map(n=>n.toString(16).padStart(2,"0")).join("");
function toHsv(c){const n=parseInt(c.slice(1),16),r=(n>>16)/255,q=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,q,b),d=mx-Math.min(r,q,b);let h=0;
 if(d){h=mx===r?((q-b)/d)%6:mx===q?(b-r)/d+2:(r-q)/d+4;h=(h*60+360)%360}return[h,mx?d/mx:0,mx]}
const cp=$("#cp"),cb=$("#cb"),wh=$("#wh"),wg=wh.getContext("2d"),WR=90;
function drawWheel(){const im=wg.createImageData(180,180);for(let y=0;y<180;y++)for(let u=0;u<180;u++){const dx=u-WR,dy=y-WR,d=Math.hypot(dx,dy);
  if(d<=WR)im.data.set([...hsv((Math.atan2(dy,dx)*180/Math.PI+360)%360,d/WR,vv),255],(y*180+u)*4)}
 wg.putImageData(im,0,0);const a=hh*Math.PI/180,mx=WR+Math.cos(a)*ss*WR,my=WR+Math.sin(a)*ss*WR;
 wg.lineWidth=3;wg.strokeStyle="#fff";wg.beginPath();wg.arc(mx,my,7,0,7);wg.stroke();wg.lineWidth=1.5;wg.strokeStyle="#0a3d6b";wg.beginPath();wg.arc(mx,my,9,0,7);wg.stroke()}
function setColor(c,src){tool.c=c;if(src!=="wheel"){[hh,ss,vv]=toHsv(c);$("#bv").value=Math.round(vv*100)}
 if(src!=="text")$("#hx").value=c;$("#hx").removeAttribute("aria-invalid");$("#rg").textContent=c.toUpperCase()+"  "+rgbStr(c);$("#cbs").style.background=c;if(!cp.hidden)drawWheel();setTool(tool.t==="e"||tool.t==="s"?"p":tool.t)}
function wpick(e){const r=wh.getBoundingClientRect(),k=180/r.width,dx=(e.clientX-r.left)*k-WR,dy=(e.clientY-r.top)*k-WR;hh=(Math.atan2(dy,dx)*180/Math.PI+360)%360;ss=Math.min(1,Math.hypot(dx,dy)/WR);setColor(hex(hsv(hh,ss,vv)),"wheel")}
let wd=false;wh.onpointerdown=e=>{wd=true;wh.setPointerCapture(e.pointerId);wpick(e)};wh.onpointermove=e=>wd&&wpick(e);wh.onpointerup=()=>wd=false;
$("#bv").oninput=e=>{vv=e.target.value/100;setColor(hex(hsv(hh,ss,vv)),"wheel")};
function pop(o){cp.hidden=!o;cb.setAttribute("aria-expanded",o);if(o)drawWheel()}
cb.onclick=e=>{e.stopPropagation();pop(cp.hidden)};
document.addEventListener("click",e=>{if(!cp.hidden&&!e.target.closest(".popwrap"))pop(false)});
$("#hx").oninput=()=>{const c=parseColor($("#hx").value);if(c)setColor(c,"text");else $("#hx").setAttribute("aria-invalid",true)};
$("#hx").onchange=()=>{const c=parseColor($("#hx").value);if(c)setColor(c);else $("#st").textContent="Not a valid colour. Try #F08A2E or rgb(240, 138, 46)."};
$("#sv").onclick=()=>{if(palette.includes(tool.c))$("#st").textContent=tool.c+" is already in the palette";
 else if(palette.length>=16)$("#st").textContent="Palette is full (16). Remove one first.";
 else{palette.push(tool.c);savePal();$("#st").textContent="Saved "+tool.c+" to the palette"}renderPal()};
$("#rm").onclick=()=>{const i=palette.indexOf(tool.c);if(i<0)$("#st").textContent="Select a palette colour to remove it.";
 else if(palette.length<2)$("#st").textContent="Keep at least one colour in the palette.";
 else{palette.splice(i,1);savePal();$("#st").textContent="Removed "+tool.c;setColor(palette[0])}};
setColor(palette[0]);
/* notes */
function open(id){cur=id;resetView();const n=get();$("#empty").hidden=!!n;$("#ed").hidden=!n;
 if(n){$("#t").value=n.title;$("#b").value=n.body;$("#pin").textContent=n.pinned?"Unpin":"Pin";$("#st").textContent="Edited "+new Date(n.updated).toLocaleString();setMode(n.mode,false)}else full(false);renderItems();list()}
function create(){const n={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:"",body:"",pinned:false,updated:Date.now(),mode:"text",strokes:[],items:[]};
 notes.unshift(n);$("#q").value="";open(n.id);save();$("#t").focus()}
$("#new").onclick=create;$("#q").oninput=list;
$("#t").oninput=()=>{const n=get();if(n){n.title=$("#t").value;touch()}};
$("#b").oninput=()=>{const n=get();if(n){n.body=$("#b").value;touch()}};
$("#pin").onclick=()=>{const n=get();if(!n)return;n.pinned=!n.pinned;$("#pin").textContent=n.pinned?"Unpin":"Pin";save();list()};
$("#del").onclick=()=>{if(!get()||!confirm("Delete this note? This cannot be undone."))return;notes=notes.filter(n=>n.id!==cur);save();open(null)};
function full(on){$("#edw").classList.toggle("full",on);document.body.classList.toggle("lock",on);$("#fs").textContent=$("#fs2").textContent=on?"Exit":"Fullscreen";if(!cv.hidden)fit()}
$("#fs").onclick=$("#fs2").onclick=()=>full(!$("#edw").classList.contains("full"));
new ResizeObserver(()=>{if(!cv.hidden)fit()}).observe($("#cw"));
addEventListener("resize",()=>{if(!cv.hidden)fit()});
$("#export").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(notes,null,2)],{type:"application/json"}));a.download="aurora-notes-backup.json";a.click();URL.revokeObjectURL(a.href)};
$("#import").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d))throw 0;let k=0;
  d.forEach(n=>{if(n&&typeof n.id==="string"&&typeof n.title==="string"&&typeof n.body==="string"&&!notes.some(x=>x.id===n.id)){
   notes.push({id:n.id,title:n.title,body:n.body,pinned:!!n.pinned,updated:+n.updated||Date.now(),mode:n.mode==="draw"?"draw":"text",
    strokes:Array.isArray(n.strokes)?n.strokes.filter(s=>s&&((Array.isArray(s.p)&&s.p.length&&typeof s.c==="string"&&+s.w>0)||(s.f&&typeof s.src==="string"&&s.src.startsWith("data:image/")))):[],
    items:Array.isArray(n.items)?n.items.filter(i=>i&&(i.k==="t"||(i.k==="i"&&typeof i.src==="string"&&i.src.startsWith("data:image/")))&&isFinite(i.x)&&isFinite(i.y)&&i.w>0&&i.h>0):[]});k++}});
  save();list();alert("Imported "+k+" note"+(k===1?"":"s")+".")}catch{alert("That file is not a valid Aurora Notes backup.")}e.target.value=""};r.readAsText(f)};
document.addEventListener("keydown",e=>{const k=e.key.toLowerCase(),m=e.ctrlKey||e.metaKey;
 if(m&&k==="s"){e.preventDefault();save();return}
 if(e.key==="Escape"){if(!cp.hidden)pop(false);else if($("#edw").classList.contains("full"))full(false);else clearSel();return}
 const act=document.activeElement,inCanvasText=act&&itemsEl.contains(act),typing=act&&act.matches("textarea,input:not([type=range])")&&!inCanvasText;
 if(cv.hidden||typing)return;
 if(m&&(k==="z"||k==="y")){e.preventDefault();k==="y"||e.shiftKey?redoIt():undo()}
 else if(!inCanvasText&&e.ctrlKey&&(k==="e"||k==="q")){e.preventDefault();setTool(k==="e"?"p":"e")}});
/* multitool: scientific calculator */
let deg=true,ans=0,fresh=false;const cd=$("#cd"),cr=$("#cr");
function calc(src){const T=src.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/π/g,"pi").replace(/√/g,"sqrt").match(/\d+\.?\d*(?:e[+-]?\d+)?|\.\d+|[a-z]+|\S/gi)||[];let i=0;
 const rd=x=>deg?x*Math.PI/180:x,dg=x=>deg?x*180/Math.PI:x;
 const F={sin:x=>Math.sin(rd(x)),cos:x=>Math.cos(rd(x)),tan:x=>Math.tan(rd(x)),asin:x=>dg(Math.asin(x)),acos:x=>dg(Math.acos(x)),atan:x=>dg(Math.atan(x)),sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,ln:Math.log,log:Math.log10,sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,exp:Math.exp};
 const C={pi:Math.PI,e:Math.E,ans},eat=t=>T[i]===t?(i++,true):false;
 const fact=n=>{if(n<0||n>170||n%1)throw 0;let r=1;for(let k=2;k<=n;k++)r*=k;return r};
 function expr(){let v=term();for(;;){if(eat("+"))v+=term();else if(eat("-"))v-=term();else return v}}
 function term(){let v=unary();for(;;){if(eat("*"))v*=unary();else if(eat("/"))v/=unary();else if(T[i]&&(/^[\d.a-z]/i.test(T[i])||T[i]==="("))v*=power();else return v}}
 function unary(){return eat("-")?-unary():eat("+")?unary():power()}
 function power(){const b=post();return eat("^")?Math.pow(b,unary()):b}
 function post(){let v=prim();for(;;){if(eat("!"))v=fact(v);else if(eat("%"))v/=100;else return v}}
 function prim(){const t=T[i++];if(t===undefined)throw 0;if(/^[\d.]/.test(t))return parseFloat(t);
  if(t==="("){const v=expr();eat(")");return v}
  const k=t.toLowerCase();if(k in F){if(!eat("("))throw 0;const a=expr();eat(")");return F[k](a)}
  if(k in C)return C[k];throw 0}
 const v=expr();if(i<T.length||!Number.isFinite(v))throw 0;return v}
const fmt=v=>String(+v.toPrecision(12));
function run(){try{ans=calc(cd.value);cd.value=fmt(ans);cr.textContent="Ans = "+fmt(ans);fresh=true}catch{cr.textContent="Error"}}
function ins(t){if(fresh){if(!/^[\^!%+×÷−)]/.test(t))cd.value="";fresh=false}cd.focus();cd.setRangeText(t,cd.selectionStart,cd.selectionEnd,"end")}
const LB={"^":"xʸ","^2":"x²","×10^":"EXP","1/(":"1/x",ans:"Ans"};
"Deg|sin(|cos(|tan(|⌫|π|asin(|acos(|atan(|C|e|ln(|log(|√(|^|^2|!|(|)|÷|7|8|9|×|ans|4|5|6|−|abs(|1|2|3|+|%|0|.|×10^|1/(|=".split("|").forEach(k=>{
 const b=document.createElement("button");b.type="button";b.textContent=LB[k]||(k.length>1&&k.endsWith("(")?k.slice(0,-1):k);
 if(["÷","×","−","+","^","^2","!","%"].includes(k))b.className="op";if(k==="=")b.className="eq";
 b.onclick=()=>{if(k==="Deg"){deg=!deg;b.textContent=deg?"Deg":"Rad"}else if(k==="C"){cd.value="";cr.textContent="";fresh=false}
  else if(k==="⌫"){fresh=false;cd.focus();const s=cd.selectionStart,e=cd.selectionEnd;if(s===e&&s>0)cd.setRangeText("",s-1,e,"end");else cd.setRangeText("",s,e,"end")}
  else if(k==="=")run();else ins(k)};$("#keys").append(b)});
cd.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();run()}};cd.oninput=()=>fresh=false;
/* multitool: tasks */
let tasks=load(TK,[]);tasks=Array.isArray(tasks)?tasks.filter(t=>t&&typeof t.t==="string"):[];
const saveT=()=>{try{localStorage.setItem(TK,JSON.stringify(tasks))}catch{}};
function renderT(){const ul=$("#tl");ul.textContent="";tasks.forEach((t,i)=>{const li=document.createElement("li"),l=document.createElement("label"),c=document.createElement("input"),s=document.createElement("span"),x=document.createElement("button");
 c.type="checkbox";c.checked=!!t.d;c.onchange=()=>{t.d=c.checked;saveT();renderT()};s.textContent=t.t;if(t.d)li.className="done";
 x.type="button";x.className="x";x.textContent="×";x.setAttribute("aria-label","Delete task");x.onclick=()=>{tasks.splice(i,1);saveT();renderT()};
 l.append(c,s);li.append(l,x);ul.append(li)});$("#tc").textContent=tasks.filter(t=>t.d).length+" of "+tasks.length+" done"}
function addT(){const v=$("#ti").value.trim();if(!v)return;tasks.push({t:v.slice(0,200),d:false});$("#ti").value="";saveT();renderT()}
$("#ta").onclick=addT;$("#ti").onkeydown=e=>{if(e.key==="Enter")addT()};
$("#tclr").onclick=()=>{tasks=tasks.filter(t=>!t.d);saveT();renderT()};
function tab(c){$("#calc").hidden=!c;$("#tasks").hidden=c;$("#tCalc").setAttribute("aria-pressed",c);$("#tTask").setAttribute("aria-pressed",!c)}
$("#tCalc").onclick=()=>tab(true);$("#tTask").onclick=()=>tab(false);renderT();
open(notes.length?[...notes].sort((a,b)=>b.updated-a.updated)[0].id:null);
/* snow */
const c=$("#snow"),x=c.getContext("2d");let W,H;const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight};rs();addEventListener("resize",rs);
if(!matchMedia("(prefers-reduced-motion:reduce)").matches){const f=[...Array(60)].map(()=>({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*2.5,s:.3+Math.random(),d:Math.random()*6}));
 (function a(){x.clearRect(0,0,W,H);x.fillStyle="rgba(255,255,255,.8)";f.forEach(p=>{p.y+=p.s;p.d+=.01;p.x+=Math.sin(p.d)*.5;if(p.y>H){p.y=-5;p.x=Math.random()*W}x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()});requestAnimationFrame(a)})()}