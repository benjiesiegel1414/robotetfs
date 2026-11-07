/* RobotETFs.com front end. Pages are pre-rendered by scripts/build.mjs;
   this file adds sorting, search, category filters and TradingView price widgets. */
(function(){
"use strict";
var D=document,FOCUS=window.RB_FOCUS||[],FBY={};FOCUS.forEach(function(f){FBY[f.id]=f;});
function ga(n,p){if(typeof gtag==="function"){try{gtag("event",n,p||{});}catch(e){}}}
var bg=D.getElementById("burger"),nv=D.getElementById("nav");
if(bg&&nv){bg.addEventListener("click",function(){var o=nv.classList.toggle("open");bg.setAttribute("aria-expanded",String(o));bg.innerHTML=o?"&#10005;":"&#9776;";});}
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
