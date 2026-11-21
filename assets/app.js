/* RobotETFs.com front end. Pages are pre-rendered by scripts/build.mjs;
   this file adds sorting, search, category filters and TradingView price widgets. */
(function(){
"use strict";
var D=document,FOCUS=window.RB_FOCUS||[],FBY={};FOCUS.forEach(function(f){FBY[f.id]=f;});
function ga(n,p){if(typeof gtag==="function"){try{gtag("event",n,p||{});}catch(e){}}}
var bg=D.getElementById("burger"),nv=D.getElementById("nav");
if(bg&&nv){bg.addEventListener("click",function(){var hd=D.querySelector("header.site");if(hd)D.documentElement.style.setProperty("--hh",hd.getBoundingClientRect().bottom+"px");var o=nv.classList.toggle("open");D.body.style.overflow=o?"hidden":"";bg.setAttribute("aria-expanded",String(o));bg.innerHTML=o?"&#10005;":"&#9776;";});
  nv.addEventListener("click",function(e){if(e.target.closest("a")&&nv.classList.contains("open")){nv.classList.remove("open");D.body.style.overflow="";bg.setAttribute("aria-expanded","false");bg.innerHTML="&#9776;";}});}
D.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-copy]");if(!b)return;var v=b.getAttribute("data-copy"),done=function(){var t=b.textContent;b.textContent="Copied";setTimeout(function(){b.textContent=t;},1600);};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(v).then(done,function(){});});
function h(x){return String(x==null?"":x).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}

/* ---------- site search ---------- */
(function(){var q=D.getElementById("sq"),dd=D.getElementById("sdd");if(!q||!dd)return;var IDX=null,loading=null,sel=-1,items=[];
  function load(){if(IDX)return Promise.resolve(IDX);if(!loading)loading=fetch("/assets/search.json").then(function(r){return r.json();}).then(function(j){j.forEach(function(e){e._t=e.t.toLowerCase().replace(/\$/g,"");e._k=(e.t+" "+(e.s||"")+" "+(e.k||"")).toLowerCase();});IDX=j;return j;}).catch(function(){IDX=[];return IDX;});return loading;}
  function hl(t,w){var out=h(t);w.forEach(function(x){if(x.length<2)return;var i=out.toLowerCase().indexOf(x);if(i>-1&&out.slice(0,i).lastIndexOf("<")<=out.slice(0,i).lastIndexOf(">"))out=out.slice(0,i)+"<mark>"+out.slice(i,i+x.length)+"</mark>"+out.slice(i+x.length);});return out;}
  var GW={ETF:40,Category:22,Tool:18,Guide:14,Compare:8,Page:4};
  function score(e,raw,w){var sc=0,t=e._t;if(t===raw)sc+=200;else if(t.indexOf(raw)===0)sc+=120;else if(t.indexOf(raw)>-1)sc+=60;
    for(var i=0;i<w.length;i++){var x=w[i],ti=t.indexOf(x);if(ti===0||(ti>0&&/[\s(]/.test(t[ti-1])))sc+=30;else if(ti>-1)sc+=14;else if(e._k.indexOf(" "+x)>-1||e._k.indexOf(x)===0)sc+=9;else if(e._k.indexOf(x)>-1)sc+=4;else return 0;}return sc?sc+(GW[e.g]||0):0;}
  function row(e,w){return '<a role="option" href="'+e.u+'"><span class="sk">'+e.g+'</span><span class="st"><b>'+hl(e.t,w)+'</b>'+(e.s?'<span>'+h(e.s)+'</span>':'')+'</span>'+(e.x?'<span class="sx">'+h(e.x)+'</span>':'')+'</a>';}
  function show(){var raw=q.value.trim().toLowerCase().replace(/\$/g,""),w=raw.split(/\s+/).filter(Boolean),html="";
    if(!IDX){dd.innerHTML='<div class="se">Loading...</div>';open();return;}
    if(!raw){var by=function(g,n){return IDX.filter(function(e){return e.g===g;}).slice(0,n).map(function(e){return row(e,[]);}).join("");};html='<div class="sg">Largest robotics ETFs</div>'+by("ETF",6)+'<div class="sg">Categories</div>'+by("Category",6)+'<div class="sg">Tools</div>'+by("Tool",5);}
    else{var r=IDX.map(function(e){return [score(e,raw,w),e];}).filter(function(x){return x[0]>0;}).sort(function(a,b){return b[0]-a[0];});var cap=/\bvs?\b/.test(raw)||w.length>1?8:2,cc=0;r=r.filter(function(x){if(x[1].g!=="Compare")return true;return ++cc<=cap;}).slice(0,9);
      html=r.length?r.map(function(x){return row(x[1],w);}).join(""):'<div class="se">No matches for "'+h(q.value.trim())+'". Try a ticker like BOTZ, a word like humanoid or a tool like fee calculator.</div>';}
    dd.innerHTML=html;items=[].slice.call(dd.querySelectorAll("a"));sel=raw&&items.length?0:-1;mark();open();}
  function mark(){items.forEach(function(a,i){a.classList.toggle("on",i===sel);});if(sel>-1&&items[sel])items[sel].scrollIntoView({block:"nearest"});}
  function open(){dd.hidden=false;q.setAttribute("aria-expanded","true");}function close(){dd.hidden=true;q.setAttribute("aria-expanded","false");}
  function refresh(){load().then(function(){if(D.activeElement===q)show();});if(!IDX)show();}
  function go(a){ga("site_search_click",{search_term:q.value.trim().slice(0,60),result:a.getAttribute("href")});close();location.href=a.getAttribute("href");}
  q.addEventListener("focus",refresh);q.addEventListener("input",refresh);
  q.addEventListener("keydown",function(e){if(e.key==="ArrowDown"){e.preventDefault();if(items.length){sel=(sel+1)%items.length;mark();}}else if(e.key==="ArrowUp"){e.preventDefault();if(items.length){sel=(sel-1+items.length)%items.length;mark();}}else if(e.key==="Enter"){e.preventDefault();var a=items[sel>-1?sel:0];if(a&&q.value.trim())go(a);}else if(e.key==="Escape"){close();q.blur();}});
  dd.addEventListener("mousedown",function(e){e.preventDefault();});dd.addEventListener("click",function(e){var a=e.target.closest("a");if(a){e.preventDefault();go(a);}});
  q.form&&q.form.addEventListener("submit",function(e){e.preventDefault();});
  D.addEventListener("click",function(e){if(!e.target.closest(".hsearch"))close();});
  D.addEventListener("keydown",function(e){if(e.key==="/"&&!/input|textarea|select/i.test((D.activeElement||{}).tagName||"")){e.preventDefault();q.focus();}});})();

/* ---------- tools ---------- */
(function(){var F=window.RB_FUNDS||[],BYT={};F.forEach(function(f){BYT[f.ticker]=f;});if(!F.length)return;var PAIRS=window.RB_PAIRS||[];
  var MONS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function $$(n){return "$"+Math.round(n).toLocaleString("en-US");}
  function aum(v){return v==null?"n/a":v>=1e9?"$"+(v/1e9).toFixed(2)+"B":v>=1e6?"$"+(v>=1e7?Math.round(v/1e6):(v/1e6).toFixed(1))+"M":"$"+Math.round(v/1e3)+"K";}
  function pc(v){return v==null?"n/a":v.toFixed(2)+"%";}
  function dt(s){if(!s)return "n/a";var p=s.split("-");return MONS[+p[1]-1]+" "+(+p[2])+", "+p[0];}
  function val(el,n,d){var x=el.querySelector('[name="'+n+'"]');if(!x)return d;if(x.type==="checkbox")return x.checked;var v=x.tagName==="SELECT"?x.value:parseFloat(x.value);return (typeof v==="number"&&isNaN(v))?d:v;}
  function bars(rows){var mx=Math.max.apply(null,rows.map(function(r){return r[1];}))||1;return '<div class="tbars">'+rows.map(function(r){return '<div class="tbar'+(r[3]?" me":"")+'"><span>'+h(r[0])+'</span><span class="bt"><i style="width:'+Math.max(1.5,r[1]/mx*100).toFixed(1)+'%"></i></span><b>'+r[2]+'</b></div>';}).join("")+'</div>';}
  function res(cells){return '<div class="tres">'+cells.map(function(c){return '<div><div class="k">'+c[0]+'</div><div class="v'+(c[3]?" "+c[3]:"")+'">'+c[1]+'</div><div class="s">'+(c[2]||"")+'</div></div>';}).join("")+'</div>';}
  var exps=F.filter(function(f){return f.exp!=null&&f.focus!=="leveraged";}),cheap=exps.slice().sort(function(a,b){return a.exp-b.exp;})[0],dear=exps.slice().sort(function(a,b){return b.exp-a.exp;})[0],avg=exps.reduce(function(s,f){return s+f.exp;},0)/exps.length;
  var T={
   fee:function(el,out){var f=BYT[val(el,"t","BOTZ")]||F[0],amt=Math.max(0,val(el,"amt",10000)),y=Math.min(50,Math.max(1,val(el,"yrs",10))),r=val(el,"ret",7)/100,e=(f.exp||0)/100;
     var end=function(x){return amt*Math.pow(1+r-x,y);},noFee=end(0),withFee=end(e),cost=noFee-withFee;
     out.innerHTML='<p class="tsum"><b>$'+f.ticker+'</b> charges <b>'+pc(f.exp)+'</b> a year. On '+$$(amt)+' held '+y+' year'+(y===1?"":"s")+' at '+(r*100).toFixed(1)+'% a year before fees:</p>'+res([["Ending value",$$(withFee),"After the fund's fee","good"],["Lost to fees",$$(cost),"Fees plus the growth they would have earned","bad"],["First-year fee",$$(amt*e),"On the starting amount"]])+bars([["$"+f.ticker+" "+pc(f.exp),withFee,$$(withFee),1],["Cheapest: $"+cheap.ticker+" "+pc(cheap.exp),end(cheap.exp/100),$$(end(cheap.exp/100))],["Average fund "+pc(avg),end(avg/100),$$(end(avg/100))],["Priciest: $"+dear.ticker+" "+pc(dear.exp),end(dear.exp/100),$$(end(dear.exp/100))]]);},
   growth:function(el,out){var f=BYT[val(el,"t","BOTZ")]||F[0],amt=Math.max(0,val(el,"amt",5000)),mo=Math.max(0,val(el,"mo",200)),y=Math.min(50,Math.max(1,val(el,"yrs",15))),r=val(el,"ret",7)/100,e=(f.exp||0)/100;
     var run=function(x){var m=Math.pow(1+r-x,1/12)-1,b=amt;for(var i=0;i<y*12;i++){b=b*(1+m)+mo;}return b;},a=run(e),b=run(0),put=amt+mo*12*y;
     out.innerHTML='<p class="tsum">Starting with '+$$(amt)+' and adding '+$$(mo)+' a month for '+y+' years in <b>$'+f.ticker+'</b> ('+pc(f.exp)+' fee):</p>'+res([["Ending balance",$$(a),"After fees","good"],["You put in",$$(put),"Start plus monthly adds"],["Fee drag",$$(b-a),"Versus a fund with no fee","bad"]])+bars([["You put in",put,$$(put)],["Ending balance",a,$$(a),1]]);},
   lev:function(el,out){var R=val(el,"ret",0)/100,s=Math.max(0,val(el,"vol",2))/100,n=Math.max(2,Math.round(val(el,"days",126))),L=+val(el,"lev","2");if(n%2)n++;
     var lo=-0.2,hi=0.2,g=0;for(var i=0;i<60;i++){g=(lo+hi)/2;var tot=Math.pow((1+g+s)*(1+g-s),n/2)-1;if(tot<R)lo=g;else hi=g;}
     var lv=Math.pow(Math.max(0,(1+L*(g+s)))*Math.max(0,(1+L*(g-s))),n/2)-1,simple=L*R,p=function(x){return (x>=0?"+":"")+(x*100).toFixed(1)+"%";};
     out.innerHTML='<p class="tsum">Over '+n+' trading days with typical daily swings of '+(s*100).toFixed(2)+'%:</p>'+res([["Index",p(R),"What the index did"],[L+"x daily fund",p(lv),"What daily-reset leverage returned",lv<simple?"bad":"good"],["Simple "+L+"x",p(simple),"What many people expect"]])+'<p class="tsum">The gap between the last two numbers is <b>'+p(lv-simple).replace("+","")+'</b>. '+(lv<simple?"That drag comes from resetting every day while prices bounce around. The bigger the daily swings, the bigger the drag.":"In a steady trend with small swings, daily compounding can beat the simple multiple.")+'</p>';},
   compare:function(el,out){var a=BYT[val(el,"a","BOTZ")],b=BYT[val(el,"b","ROBO")];if(!a||!b)return;if(a===b){out.innerHTML='<p class="tsum">Pick two different funds to compare.</p>';return;}
     var fo=function(f){return (FBY[f.focus]||{}).name||f.focus;},rows=[["Fund name",h(a.name),h(b.name)],["Provider",h(a.issuer),h(b.issuer)],["Category",h(fo(a)),h(fo(b))],["AUM",aum(a.aum),aum(b.aum),a.aum,b.aum,1],["Expense ratio",pc(a.exp),pc(b.exp),a.exp,b.exp,0],["Fee on $10,000 a year",a.exp!=null?$$(a.exp*100):"n/a",b.exp!=null?$$(b.exp*100):"n/a",a.exp,b.exp,0],["Dividend yield",pc(a.yld),pc(b.yld),a.yld,b.yld,1],["Pays",h(a.pays),h(b.pays)],["Launched",dt(a.inception),dt(b.inception)]];
     var k=[a.ticker,b.ticker].sort().join("-"),has=PAIRS.indexOf(k)>-1,u="/compare/"+k.toLowerCase().replace("-","-vs-");
     out.innerHTML='<table class="tcmp dtable"><thead><tr><th class="l">Metric</th><th><a href="/etf/'+a.ticker.toLowerCase()+'">$'+a.ticker+'</a></th><th><a href="/etf/'+b.ticker.toLowerCase()+'">$'+b.ticker+'</a></th></tr></thead><tbody>'+rows.map(function(r){var w=null;if(r.length>3&&r[3]!=null&&r[4]!=null&&r[3]!==r[4])w=(r[5]?r[3]>r[4]:r[3]<r[4])?0:1;return '<tr><td class="l">'+r[0]+'</td><td'+(w===0?' class="win"':'')+'>'+r[1]+'</td><td'+(w===1?' class="win"':'')+'>'+r[2]+'</td></tr>';}).join("")+'</tbody></table><p class="more" style="margin:14px 0 0">'+(has?'<a href="'+u+'">Read the full $'+a.ticker+' vs $'+b.ticker+' comparison with live prices &rarr;</a>':'<a href="/etf/'+a.ticker.toLowerCase()+'">$'+a.ticker+' profile &rarr;</a> &nbsp; <a href="/etf/'+b.ticker.toLowerCase()+'">$'+b.ticker+' profile &rarr;</a>')+'</p>';},
   finder:function(el,out){var cat=val(el,"cat","all"),fee=+val(el,"fee","9"),mn=+val(el,"aum","0"),so=val(el,"sort","aum"),dv=val(el,"div",false),nl=val(el,"nolev",true);
     var l=F.filter(function(f){return (cat==="all"||f.focus===cat)&&(f.exp==null||f.exp<=fee+1e-9)&&(f.aum||0)>=mn&&(!dv||f.yld>0)&&(!nl||f.focus!=="leveraged"||cat==="leveraged");});
     l.sort(function(a,b){return so==="exp"?(a.exp||9)-(b.exp||9):so==="yld"?(b.yld||0)-(a.yld||0):so==="inception"?String(b.inception).localeCompare(String(a.inception)):(b.aum||0)-(a.aum||0);});
     out.innerHTML='<p class="tcount">'+l.length+' of '+F.length+' funds match</p>'+(l.length?'<div class="ft"><div class="ft-h"><span>ETF</span><span>Category</span><span>AUM</span><span>Expense</span><span>Yield</span><span>Launched</span></div>'+l.map(function(f){var fo=FBY[f.focus]||{};return '<a class="ft-r" href="/etf/'+f.ticker.toLowerCase()+'" style="--c:'+fo.c+'"><span class="ft-n"><b>$'+f.ticker+'</b><em>'+h(f.name)+'</em><small>'+h(f.issuer)+'</small></span><span class="ft-f"><span class="chip" style="--c:'+fo.c+';--bg:'+fo.bg+'">'+h(fo.label)+'</span></span><span class="ft-v" data-l="AUM">'+aum(f.aum)+'</span><span class="ft-v" data-l="Expense">'+pc(f.exp)+'</span><span class="ft-v" data-l="Yield">'+pc(f.yld)+'</span><span class="ft-v" data-l="Launched">'+dt(f.inception)+'</span></a>';}).join("")+'</div>':'<p class="tsum">Nothing matches. Loosen a filter.</p>');}};
  D.querySelectorAll("[data-tool]").forEach(function(el){var k=el.getAttribute("data-tool"),out=el.querySelector(".tool-out"),fn=T[k];if(!fn||!out)return;var used=false,run=function(){try{fn(el,out);}catch(e){}};
    el.addEventListener("input",function(){run();if(!used){used=true;ga("tool_use",{tool:k});}});el.addEventListener("change",run);run();});})();
D.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-ga]");if(a)ga("promo_click",{placement:a.getAttribute("data-ga"),site:"robotetfs"});});

/* TradingView live price */
(function(){var els=D.querySelectorAll("[data-tv]");if(!els.length)return;
  function tv(el){var s=D.createElement("script"),box=D.createElement("div"),w=D.createElement("div");box.className="tradingview-widget-container";w.className="tradingview-widget-container__widget";box.appendChild(w);
    s.async=true;s.src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    s.text=JSON.stringify({symbol:el.getAttribute("data-tv"),width:"100%",height:220,locale:"en",dateRange:"ALL",colorTheme:"light",isTransparent:true,autosize:true,trendLineColor:"rgba(78,125,87,1)",underLineColor:"rgba(78,125,87,0.15)",underLineBottomColor:"rgba(78,125,87,0)"});
    box.appendChild(s);el.innerHTML="";el.appendChild(box);}
  if("IntersectionObserver" in window){var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){o.unobserve(e.target);tv(e.target);}});},{rootMargin:"300px"});els.forEach(function(el){o.observe(el);});}else els.forEach(tv);})();

/* table */
var tbody=D.getElementById("tbody");if(!tbody)return;
var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var fmt={aum:function(v){return v==null?"n/a":v>=1e9?"$"+(v/1e9).toFixed(v>=1e10?1:2)+"B":v>=1e6?"$"+(v>=1e7?Math.round(v/1e6):(v/1e6).toFixed(1))+"M":"$"+Math.round(v/1e3)+"K";},pct:function(v){return v==null?"n/a":v.toFixed(2)+"%";},
  date:function(s){if(!s)return "n/a";var p=s.split("-");return MON[+p[1]-1]+" "+(+p[2])+", "+p[0];}};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
var FUNDS=(window.RB_FUNDS||[]).slice(),sortKey="curated",dir=1,focus="all",q=D.getElementById("q"),shown=D.getElementById("shown");
var DESC={aum:1,yld:1,inception:1};
function render(){var s=(q&&q.value||"").trim().toLowerCase();
  var rows=FUNDS.filter(function(f){if(focus!=="all"&&f.focus!==focus)return false;return !s||(f.ticker+" "+f.name+" "+f.issuer+" "+((FBY[f.focus]||{}).name||"")).toLowerCase().indexOf(s)>-1;});
  rows.sort(function(a,b){var x=a[sortKey],y=b[sortKey];if(x==null&&y==null)return a.curated-b.curated;if(x==null)return 1;if(y==null)return -1;if(typeof x==="string")return x.localeCompare(y)*dir;return (x-y)*dir;});
  tbody.innerHTML=rows.length?rows.map(function(f){var fo=FBY[f.focus]||{};return '<tr data-t="'+f.ticker+'"><td class="l"><a class="tk" href="/etf/'+f.ticker.toLowerCase()+'">$'+esc(f.ticker)+'</a></td><td class="l nm">'+esc(f.name)+'</td><td class="l prov">'+esc(f.issuer)+'</td><td class="l"><span class="chip" style="--c:'+fo.c+';--bg:'+fo.bg+'">'+esc(fo.label)+'</span></td><td class="num">'+fmt.aum(f.aum)+'</td><td class="num">'+fmt.pct(f.exp)+'</td><td class="num">'+fmt.pct(f.yld)+'</td><td class="l pays">'+esc(f.pays)+'</td><td class="dt">'+fmt.date(f.inception)+'</td></tr>';}).join(""):'<tr><td class="l" colspan="9">No ETFs match that search.</td></tr>';
  if(shown)shown.textContent="Showing "+rows.length+" of "+FUNDS.length+" ETFs";}
D.querySelectorAll(".ptable th[data-s]").forEach(function(th){th.addEventListener("click",function(){var k=th.getAttribute("data-s");if(sortKey===k)dir=-dir;else{sortKey=k;dir=DESC[k]?-1:1;}
  D.querySelectorAll(".ptable th").forEach(function(x){x.classList.remove("sorted","asc");});th.classList.add("sorted");if(dir>0)th.classList.add("asc");render();ga("table_sort",{key:k});});});
if(q)q.addEventListener("input",render);
D.querySelectorAll("#cats button").forEach(function(b){b.addEventListener("click",function(){focus=b.getAttribute("data-f");D.querySelectorAll("#cats button").forEach(function(x){x.classList.toggle("on",x===b);});render();ga("table_filter",{focus:focus});});});
})();
