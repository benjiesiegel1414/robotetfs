// RobotETFs.com static site builder.  node scripts/build.mjs
// Reads data/funds.csv (synced daily from the Google Sheet), content/funds.json and
// content/articles/*.html, and writes the whole site to the repo root.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const SITE="https://robotetfs.com";
const GA_ID="G-PQJN03K789";   // GA4 measurement ID for RobotETFs (e.g. "G-XXXXXXX"). Leave blank to disable.
const SHEET="";   // Published Google Sheet CSV URL (File > Share > Publish to web > CSV). The workflow pulls it daily.
const EMAIL="Business@TopDividendETFs.com";
const PRO="https://topdividendetfspro.com/";
const NOW=new Date();
const YEAR=NOW.getFullYear();
const ASSETV=crypto.createHash("md5").update(fs.readFileSync(path.join(ROOT,"assets","site.css"))).update(fs.readFileSync(path.join(ROOT,"assets","app.js"))).digest("hex").slice(0,8);

const FOCUS=[
 {id:"core robotics",c:"#4E7D57",bg:"#E6EFE7",label:"Core robotics",name:"Core robotics & automation",desc:"Industrial robots, automation systems, motion control and the software that runs factories and warehouses."},
 {id:"humanoid",c:"#7A6847",bg:"#F3EEE3",label:"Humanoid",name:"Humanoid robotics",desc:"Robots built in a human shape, plus the actuators, sensors, reducers and AI chips that make them move and think."},
 {id:"physical ai",c:"#3F6B6E",bg:"#E3EEEE",label:"Physical AI",name:"Physical AI",desc:"AI that acts in the real world: humanoids, drones and machines that see, decide and move on their own."},
 {id:"ai & robotics",c:"#55606A",bg:"#ECEEF0",label:"AI & robotics",name:"AI & robotics",desc:"Broader AI funds that pair robotics with the chips, cloud and software powering machine intelligence."},
 {id:"autonomous & drones",c:"#6B7A3A",bg:"#EEF1E2",label:"Autonomy & drones",name:"Autonomous vehicles & drones",desc:"Robotaxis, self-driving systems and unmanned aircraft for commercial and defense use."},
 {id:"leveraged",c:"#9A4B3C",bg:"#F6E8E4",label:"Leveraged",name:"Leveraged robotics",desc:"Funds that seek a multiple of a robotics index's daily return. Built for short-term trading."}];
const FBY=Object.fromEntries(FOCUS.map(f=>[f.id,f]));
// Big, well-known funds that get head-to-head pages against each other. Same-category pairs are always added.
const MAJOR=["BOTZ","ROBO","ARKQ","AIQ","ROBT","THNQ","IQM","FBOT","IBOT","KOID","HUMN","BOTT"];

/* ---------- data ---------- */
function splitCSV(line){const o=[];let c="",q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(q){if(ch==='"'){if(line[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else if(ch==='"')q=true;else if(ch===","){o.push(c);c="";}else c+=ch;}o.push(c);return o.map(v=>v.trim());}
const AL={ticker:["symbol","ticker"],name:["name","etf name","fund name"],issuer:["issuer","etf provider","provider"],focus:["focus","category"],aum:["aum","assets"],exp:["expense","expense ratio","er"],inception:["inception","inception date","launch date"],yld:["dividend yield","yield"],pays:["pays","frequency","distribution frequency"],url:["issuer url","url","website"]};
const pAum=v=>{const m=String(v||"").replace(/[$,\s]/g,"").match(/^(-?[\d.]+)([KMBT]?)$/i);return m?+m[1]*({K:1e3,M:1e6,B:1e9,T:1e12}[(m[2]||"M").toUpperCase()]):null;};
const pPct=v=>{const n=parseFloat(String(v||"").replace(/[%\s]/g,""));return isNaN(n)?null:n;};
const pDate=v=>{let m=String(v||"").trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);if(m){let y=+m[3];if(y<100)y+=2000;return `${y}-${String(m[1]).padStart(2,"0")}-${String(m[2]).padStart(2,"0")}`;}m=String(v||"").match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[0]:null;};
const pPays=v=>{const s=String(v||"").trim();return !s||/^(n\/a|none|-)$/i.test(s)?"None yet":s;};
const raw=fs.readFileSync(path.join(ROOT,"data","funds.csv"),"utf8").replace(/^﻿/,"").trim().split(/\r?\n/);
const hdr=splitCSV(raw.shift()).map(h=>h.toLowerCase());const ix={};for(const k in AL)ix[k]=AL[k].map(a=>hdr.indexOf(a)).find(i=>i>-1)??-1;
const PROF=JSON.parse(fs.readFileSync(path.join(ROOT,"content","funds.json"),"utf8"));
const FUNDS=raw.map((l,i)=>{const c=splitCSV(l),g=k=>ix[k]>-1?(c[ix[k]]||""):"";const t=g("ticker").replace(/\$/g,"").toUpperCase().trim(),f=g("focus").toLowerCase().trim();if(!t||!FBY[f])return null;
  const inc=pDate(g("inception"));return {ticker:t,slug:t.toLowerCase(),name:g("name")||t,issuer:g("issuer"),focus:f,fo:FBY[f],aum:pAum(g("aum")),exp:pPct(g("exp")),yld:pPct(g("yld")),pays:pPays(g("pays")),url:/^https?:\/\//.test(g("url"))?g("url"):"",inception:inc,age:inc?(NOW-new Date(inc+"T12:00:00"))/864e5:null,curated:i,prof:PROF[t]||null};}).filter(Boolean);
if(!FUNDS.length)throw new Error("No funds parsed from data/funds.csv");
const BY=Object.fromEntries(FUNDS.map(f=>[f.ticker,f]));
const byAum=[...FUNDS].sort((a,b)=>(b.aum??-1)-(a.aum??-1));
const pick={largest:byAum[0],cheapest:[...FUNDS].filter(f=>f.exp!=null).sort((a,b)=>a.exp-b.exp||(b.aum||0)-(a.aum||0))[0],priciest:[...FUNDS].filter(f=>f.exp!=null).sort((a,b)=>b.exp-a.exp)[0],newest:[...FUNDS].filter(f=>f.inception).sort((a,b)=>b.inception.localeCompare(a.inception))[0],oldest:[...FUNDS].filter(f=>f.inception).sort((a,b)=>a.inception.localeCompare(b.inception))[0],yield:[...FUNDS].filter(f=>f.yld!=null&&f.focus!=="leveraged").sort((a,b)=>b.yld-a.yld)[0],humanoid:[...FUNDS].filter(f=>f.focus==="humanoid").sort((a,b)=>(b.aum||0)-(a.aum||0))[0]};
const TOTAL=FUNDS.reduce((s,f)=>s+(f.aum||0),0);
const AVGEXP=(()=>{const l=FUNDS.filter(f=>f.exp!=null);return l.length?l.reduce((s,f)=>s+f.exp,0)/l.length:null;})();
const COUNT=id=>FUNDS.filter(x=>x.focus===id).length;

const ALPHA=[...FUNDS].sort((a,b)=>a.ticker.localeCompare(b.ticker));
const PAIRS=[];for(let i=0;i<ALPHA.length;i++)for(let j=i+1;j<ALPHA.length;j++){const a=ALPHA[i],b=ALPHA[j];if((MAJOR.includes(a.ticker)&&MAJOR.includes(b.ticker))||(a.focus===b.focus&&a.focus!=="leveraged"))PAIRS.push([a,b]);}
const PAIRS_POP=[...PAIRS].sort((p,q)=>((q[0].aum||0)+(q[1].aum||0))-((p[0].aum||0)+(p[1].aum||0)));
const pairUrl=(a,b)=>{const [x,y]=[a,b].sort((m,n)=>m.ticker.localeCompare(n.ticker));return `/compare/${x.slug}-vs-${y.slug}`;};
const hasPair=(a,b)=>PAIRS.some(p=>(p[0]===a&&p[1]===b)||(p[0]===b&&p[1]===a));
const slugify=x=>String(x).toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const CATS=FOCUS.map(f=>{const l=byAum.filter(x=>x.focus===f.id),e=l.filter(x=>x.exp!=null),tot=l.reduce((s,x)=>s+(x.aum||0),0);return {...f,slug:{"core robotics":"core-robotics-etfs","humanoid":"humanoid-robot-etfs","physical ai":"physical-ai-etfs","ai & robotics":"ai-and-robotics-etfs","autonomous & drones":"drone-and-robotaxi-etfs","leveraged":"leveraged-robotics-etfs"}[f.id],own:!["humanoid","autonomous & drones","leveraged"].includes(f.id),funds:l,n:l.length,aum:tot,share:TOTAL?tot/TOTAL*100:0,avg:e.length?e.reduce((s,x)=>s+x.exp,0)/e.length:null,min:e.length?Math.min(...e.map(x=>x.exp)):null,max:e.length?Math.max(...e.map(x=>x.exp)):null,top:l[0],newest:[...l].filter(x=>x.inception).sort((a,b)=>b.inception.localeCompare(a.inception))[0]};}).filter(c=>c.n);
const CBY=Object.fromEntries(CATS.map(c=>[c.id,c]));
const CICON={"core robotics":'<path d="M5 20h14M8 20v-5l4-7 5 2M12 8V5m5 5 2 3-2 2" /><circle cx="12" cy="4" r="1.6"/>',"humanoid":'<rect x="8" y="3" width="8" height="6" rx="2"/><path d="M12 9v6m-5-4h10M9 21l3-6 3 6"/>',"physical ai":'<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M18 6l-2 2M8 16l-2 2"/>',"ai & robotics":'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M10 10h4v4h-4zM9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3"/>',"autonomous & drones":'<circle cx="5" cy="6" r="2.4"/><circle cx="19" cy="6" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="M7 8l3 2m4 0 3-2M7 16l3-2m4 0 3 2"/><rect x="10" y="10" width="4" height="4" rx="1"/>',"leveraged":'<path d="M4 18l5-6 4 3 7-10M15 5h5v5"/>'};
const icon=id=>`<svg class="cico" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CICON[id]||""}</svg>`;

/* ---------- format ---------- */
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],MONL=["January","February","March","April","May","June","July","August","September","October","November","December"];
const fAum=v=>v==null?"n/a":v>=1e9?"$"+(v/1e9).toFixed(v>=1e10?1:2)+"B":v>=1e6?"$"+(v>=1e7?Math.round(v/1e6):(v/1e6).toFixed(1))+"M":"$"+Math.round(v/1e3)+"K";
const fExp=v=>v==null?"n/a":v.toFixed(2)+"%";
const fYld=v=>v==null?"n/a":v.toFixed(2)+"%";
const fDate=s=>{if(!s)return "n/a";const p=s.split("-");return `${MON[+p[1]-1]} ${+p[2]}, ${p[0]}`;};
const fDateL=s=>{if(!s)return "";const p=s.split("-");return `${MONL[+p[1]-1]} ${+p[2]}, ${p[0]}`;};
const age=f=>f.age==null?"":f.age<60?Math.max(1,Math.round(f.age))+" days":f.age<730?Math.round(f.age/30.4)+" months":(f.age/365.25).toFixed(1)+" years";
const live=(f,k,fm)=>`<span data-live="${f.ticker}:${k}">${fm(f[k])}</span>`;
const tlink=f=>`<a href="/etf/${f.slug}">$${f.ticker}</a>`;
const chip=fo=>`<span class="chip" style="--c:${fo.c};--bg:${fo.bg}">${fo.label}</span>`;

/* ---------- brand ---------- */
const BOT=(s=40,id="m")=>`<svg class="bot" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F7F8"/><stop offset="1" stop-color="#A9B0B5"/></linearGradient></defs><line x1="32" y1="5" x2="32" y2="12" stroke="#6B7378" stroke-width="3"/><circle class="ant" cx="32" cy="4.5" r="3.6" fill="#5E8C61"/><rect x="8" y="12" width="48" height="40" rx="11" fill="url(#${id})" stroke="#6B7378" stroke-width="2"/><rect x="15" y="22" width="34" height="14" rx="7" fill="#2F4F3A"/><circle class="eye" cx="25" cy="29" r="3.2" fill="#9BE3A8"/><circle class="eye" cx="39" cy="29" r="3.2" fill="#9BE3A8"/><path d="M24 43h16" stroke="#6B7378" stroke-width="2.5" stroke-linecap="round"/><rect x="3" y="26" width="5" height="12" rx="2" fill="#C8B89A"/><rect x="56" y="26" width="5" height="12" rx="2" fill="#C8B89A"/></svg>`;
const MARK=(id)=>`<a class="mark" href="/" aria-label="RobotETFs home">${BOT(40,id)}<b>Robot<span>ETFs</span></b></a>`;

/* ---------- layout ---------- */
const NETWORK=[["TopETFs","topetfs.com"],["TopDividendETFs","topdividendetfs.com"],["TopDividendETFsPRO","topdividendetfspro.com"],["WeeklyETFs","weeklyetfs.com"],["MonthlyETFs","monthlyetfs.com"],["GrowthETFs","growthetfs.com"],["PhotonicsETFs","photonicsetfs.com"],["ETFTotalReturns","etftotalreturns.com"],["TopDividendTools","topdividendtools.com"],["DividendProjection","dividendprojection.com"]];
const NAV=[["All ETFs","/#rankings"],["Humanoid","/humanoid-robot-etfs"],["Compare","/compare/"],["Guides","/blog"],["About","/about"],["Advertise","/advertise"]];
const OG=SITE+"/robotetfs.png";
function head({title,desc,canonical,type="website",ld,faq,extra="",og=OG}){
  const t=esc(title),d=esc(desc);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t}</title>
<meta name="description" content="${d}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#DADDE0">
<link rel="canonical" href="${SITE}${canonical}">
<meta property="og:site_name" content="RobotETFs">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${SITE}${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="628">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@DevotedDividend">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v=${ASSETV}">
<script>document.documentElement.className+=" js";</script>
${GA_ID?`<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>`:""}
${ld?`<script type="application/ld+json">${JSON.stringify(ld)}</script>`:""}
${faq&&faq.length?`<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a.replace(/<[^>]+>/g,"")}}))})}</script>`:""}
${extra}
</head>`;
}
const SICON=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;
const TOOLS=[["fee-calculator","Fee calculator","See what any robotics ETF's expense ratio costs you over time."],["etf-finder","ETF finder","Filter every fund by category, fee, size and dividends."],["compare","Compare any two","Line up any two of the funds side by side, instantly."],["growth-calculator","Growth calculator","Project a starting amount plus monthly investing, after fees."],["leverage-simulator","Leverage simulator","See how a 2x daily fund drifts from 2x over time."]];
const top=active=>{
  const cur=h=>active===h?' aria-current="page"':"";
  const menu=(label,href,inner,cls="")=>`<div class="mi${cls}"><a class="mb" href="${href}"${cur(href)} aria-haspopup="true">${label}<i aria-hidden="true">&#9662;</i></a><div class="menu"><div class="mcol">${inner}</div></div></div>`;
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap hbar">
${MARK("mh")}
<form class="hsearch" role="search" action="/" autocomplete="off">${SICON}<input type="search" id="sq" placeholder="Search ETFs, guides and tools" aria-label="Search RobotETFs" aria-controls="sdd" aria-expanded="false" autocomplete="off" spellcheck="false"><kbd aria-hidden="true">/</kbd><div class="sdd" id="sdd" role="listbox" hidden></div></form>
<button id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="nav">&#9776;</button>
<nav class="main" id="nav" aria-label="Primary">
${menu("ETFs","/#rankings",`<div class="mcats">${CATS.map(c=>`<div class="mcat" style="--c:${c.c};--bg:${c.bg}"><a class="mch" href="/${c.slug}">${c.label} <em>${c.n}</em></a><div>${c.funds.slice(0,8).map(f=>`<a href="/etf/${f.slug}">$${f.ticker}</a>`).join("")}</div></div>`).join("")}</div><a class="mall" href="/#rankings">See all ${FUNDS.length} robotics ETFs &rarr;</a>`," wide")}
${menu("Compare","/compare/",`<span class="mh">Popular matchups</span><div class="mlist two">${PAIRS_POP.slice(0,10).map(([a,b])=>`<a href="${pairUrl(a,b)}">${a.ticker} vs ${b.ticker}</a>`).join("")}</div><a class="mall" href="/tools#compare">Compare any two funds &rarr;</a><a class="mall" href="/compare/">All ${PAIRS.length} comparisons &rarr;</a>`)}
${menu("Guides","/blog",`<span class="mh">Start here</span><div class="mlist">${["best-robotics-etfs","what-is-a-robotics-etf","how-to-invest-in-robotics-etfs","humanoid-robot-etfs","koid-vs-humn","robotics-etf-dividends","robotics-etf-risks"].map(sl=>ARTICLES.find(a=>a.slug===sl)).filter(Boolean).map(a=>`<a href="/${a.slug}">${esc(a.short||a.title)}</a>`).join("")}</div><a class="mall" href="/blog">All ${ARTICLES.length} guides &rarr;</a>`)}
${menu("Tools","/tools",`<span class="mh">Free robotics ETF tools</span><div class="mlist">${TOOLS.map(([id,n,d])=>`<a href="/tools#${id}"><b>${n}</b><span>${d}</span></a>`).join("")}</div>`)}
<a href="/about"${cur("/about")}>About</a><a class="navcta" href="/advertise"${cur("/advertise")}>Advertise</a>
</nav>
</div></header>`;};
const DISC=`RobotETFs.com is published by Dividend Empire LLC for informational and educational purposes only and does not constitute investment, financial, tax or legal advice. Nothing here is a buy or sell signal. Fund data comes from our own data sheet and issuer materials, is refreshed daily and can be delayed, incomplete or incorrect. Always verify against the issuer's website and prospectus, do your own research and consult a licensed financial professional. Past performance does not guarantee future results. Investing involves risk, including possible loss of principal. Leveraged ETFs reset daily and are not suitable for most long-term investors. Price charts are provided by TradingView and may be delayed.`;
const foot=()=>`
<div class="network" id="network"><div class="wrap"><div class="lbl">Our network</div><div class="pills">${NETWORK.map(([n,d])=>`<a class="pill" href="https://${d}/" target="_blank" rel="noopener">${n}</a>`).join("")}<a class="pill here" href="/">RobotETFs</a></div></div></div>
<footer><div class="wrap">
<div class="fgrid">
<div class="fabout">${MARK("mf")}<p>Independent research and daily data on every ETF built around robotics: industrial automation, humanoid robots, physical AI, autonomous vehicles and drones. Part of the Dividend Empire network.</p></div>
<div><h4>Robotics ETFs</h4>${byAum.slice(0,8).map(f=>`<a href="/etf/${f.slug}">$${f.ticker} ${esc(f.issuer)}</a>`).join("")}</div>
<div><h4>Categories</h4>${CATS.map(c=>`<a href="/${c.slug}">${c.name}</a>`).join("")}<h4 style="margin-top:16px">Tools</h4>${TOOLS.map(([id,n])=>`<a href="/tools#${id}">${n}</a>`).join("")}</div>
<div><h4>Research</h4><a href="/#rankings">All robotics ETFs</a><a href="/compare/">Compare robotics ETFs</a><a href="/best-robotics-etfs">Best robotics ETFs</a><a href="/what-is-a-robotics-etf">What is a robotics ETF?</a><a href="/how-to-invest-in-robotics-etfs">How to invest in robotics ETFs</a><a href="/koid-vs-humn">KOID vs HUMN</a><a href="/robotics-etf-dividends">Robotics ETF dividends</a><a href="/blog">All guides</a></div>
<div><h4>Company</h4><a href="/about">About</a><a href="/advertise">Advertise</a><a href="/disclaimer">Disclaimer</a><a href="/privacy-policy">Privacy policy</a><a href="/terms-of-use">Terms of use</a><a href="mailto:${EMAIL}">${EMAIL}</a></div>
</div>
<div class="legal"><div class="top"><span>&copy; ${YEAR} Dividend Empire LLC</span><span>RobotETFs.com</span></div>${DISC}</div>
</div></footer>
<script>window.RB_FOCUS=${JSON.stringify(FOCUS.map(({id,c,bg,label,name})=>({id,c,bg,label,name})))};window.RB_FUNDS=${JSON.stringify(FUNDS.map(({ticker,name,issuer,focus,aum,exp,yld,pays,inception,curated})=>({ticker,name,issuer,focus,aum,exp,yld,pays,inception,curated})))};window.RB_PAIRS=${JSON.stringify(PAIRS.map(([a,b])=>a.ticker+"-"+b.ticker))};</script>
<script src="/assets/app.js?v=${ASSETV}" defer></script>
</body>
</html>`;
const page=(o,body)=>head(o)+`\n<body>\n${top(o.active)}\n<main id="main">\n${body}\n</main>\n${foot()}`;

/* ---------- shared blocks ---------- */
const advSlot=`<a class="slot" href="/advertise" data-ga="slot-advertise"><div><b>Your robotics ETF here</b><span>Reach investors actively researching robotics and humanoid funds. One placement per page.</span></div><em>Advertise &rarr;</em></a>`;
const proSlot=`<a class="slot pro" href="${PRO}" target="_blank" rel="noopener" data-ga="slot-pro"><div><b>TopDividendETFs<span>PRO</span></b><span>Screen 160+ income ETFs with grades, tax treatment and advanced filters.</span></div><em>Go PRO &rarr;</em></a>`;
const slot=(s,lbl="Advertisement")=>`<div class="sponsor"><div class="wrap"><div class="lbl">${lbl}</div>${s}</div></div>`;
const ADVISORY=`<div class="advisory"><b>Not financial advice:</b> Nothing on this site is a buy or sell signal. Data can lag the issuer. Informational and educational purposes only.</div>`;
function fundTable(list,me){return `<div class="ft"><div class="ft-h"><span>ETF</span><span>Category</span><span>AUM</span><span>Expense</span><span>Yield</span><span>Launched</span></div>${list.map(f=>`<a class="ft-r${me&&f.ticker===me?" me":""}" href="/etf/${f.slug}" style="--c:${f.fo.c}"><span class="ft-n"><b>$${f.ticker}</b><em>${esc(f.name)}</em><small>${esc(f.issuer)}</small></span><span class="ft-f">${chip(f.fo)}</span><span class="ft-v" data-l="AUM">${live(f,"aum",fAum)}</span><span class="ft-v" data-l="Expense">${live(f,"exp",fExp)}</span><span class="ft-v" data-l="Yield">${live(f,"yld",fYld)}</span><span class="ft-v" data-l="Launched">${fDate(f.inception)}</span></a>`).join("")}</div>`;}
/* ---------- tools (markup here, behavior in assets/app.js) ---------- */
const fundOpts=(sel,list=byAum)=>list.map(f=>`<option value="${f.ticker}"${f.ticker===sel?" selected":""}>$${f.ticker} &middot; ${esc(f.name.length>44?f.name.slice(0,42)+"...":f.name)}</option>`).join("");
const toolFee=(t="BOTZ")=>`<div class="tool" data-tool="fee"><div class="tool-in"><label>Fund<select name="t">${fundOpts(t)}</select></label><label>Amount invested ($)<input name="amt" type="number" min="100" step="100" value="10000" inputmode="numeric"></label><label>Years held<input name="yrs" type="number" min="1" max="50" value="10" inputmode="numeric"></label><label>Yearly return before fees (%)<input name="ret" type="number" min="-20" max="30" step="0.5" value="7" inputmode="decimal"></label></div><div class="tool-out" aria-live="polite"></div><p class="tool-note">Hypothetical math, not a forecast. Assumes a steady return and that the fee is taken evenly each year.</p></div>`;
const toolFinder=()=>`<div class="tool" data-tool="finder"><div class="tool-in"><label>Category<select name="cat"><option value="all">Any category</option>${CATS.map(c=>`<option value="${c.id}">${c.label} (${c.n})</option>`).join("")}</select></label><label>Maximum fee<select name="fee"><option value="9">Any fee</option><option value="0.5">0.50% or less</option><option value="0.7">0.70% or less</option><option value="0.8">0.80% or less</option></select></label><label>Minimum size<select name="aum"><option value="0">Any size</option><option value="10000000">$10M+</option><option value="100000000">$100M+</option><option value="1000000000">$1B+</option></select></label><label>Sort by<select name="sort"><option value="aum">Largest first</option><option value="exp">Cheapest first</option><option value="yld">Highest yield</option><option value="inception">Newest first</option></select></label><label class="chk"><input type="checkbox" name="div"> Pays a dividend</label><label class="chk"><input type="checkbox" name="nolev" checked> Hide leveraged funds</label></div><div class="tool-out" aria-live="polite"></div></div>`;
const toolCompare=(a="BOTZ",b="ROBO")=>`<div class="tool" data-tool="compare"><div class="tool-in two"><label>First fund<select name="a">${fundOpts(a)}</select></label><label>Second fund<select name="b">${fundOpts(b)}</select></label></div><div class="tool-out" aria-live="polite"></div></div>`;
const toolGrowth=(t="BOTZ")=>`<div class="tool" data-tool="growth"><div class="tool-in"><label>Fund (for the fee)<select name="t">${fundOpts(t)}</select></label><label>Starting amount ($)<input name="amt" type="number" min="0" step="100" value="5000" inputmode="numeric"></label><label>Added each month ($)<input name="mo" type="number" min="0" step="25" value="200" inputmode="numeric"></label><label>Years<input name="yrs" type="number" min="1" max="50" value="15" inputmode="numeric"></label><label>Yearly return before fees (%)<input name="ret" type="number" min="-20" max="30" step="0.5" value="7" inputmode="decimal"></label></div><div class="tool-out" aria-live="polite"></div><p class="tool-note">Hypothetical math, not a forecast. Real returns are uneven and can be negative for long stretches.</p></div>`;
const toolLev=()=>`<div class="tool" data-tool="lev"><div class="tool-in"><label>Index return over the period (%)<input name="ret" type="number" min="-80" max="200" step="1" value="0" inputmode="decimal"></label><label>Typical daily swing (%)<input name="vol" type="number" min="0" max="10" step="0.25" value="2" inputmode="decimal"></label><label>Trading days<input name="days" type="number" min="2" max="756" step="1" value="126" inputmode="numeric"></label><label>Daily leverage<select name="lev"><option value="2" selected>2x</option><option value="3">3x</option></select></label></div><div class="tool-out" aria-live="polite"></div><p class="tool-note">Simplified model: the index alternates up and down days of the size you choose while ending at the return you choose. Fees and financing costs are left out, so real results are a little worse.</p></div>`;
const toolBox=`<div class="box tools"><h3>Free tools</h3>${TOOLS.map(([id,n])=>`<a class="ln" href="/tools#${id}"><b>${n}</b><span class="num">&rarr;</span></a>`).join("")}</div>`;
const out={};

/* ---------- articles ---------- */
const artDir=path.join(ROOT,"content","articles");
const ARTICLES=fs.readdirSync(artDir).filter(f=>f.endsWith(".html")).map(f=>{const r=fs.readFileSync(path.join(artDir,f),"utf8");const m=r.match(/^<!--meta\s*([\s\S]*?)-->/);if(!m)throw new Error("No meta in "+f);const meta=JSON.parse(m[1]);meta.body=r.slice(m[0].length);meta.slug=f.replace(/\.html$/,"");return meta;}).sort((a,b)=>b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
function listOf(list){return list.map((f,i)=>`<h3>${i+1}. ${tlink(f)}: ${esc(f.name)}</h3><p><strong>${esc(f.issuer)}</strong>${f.prof&&f.prof.style?" &middot; "+esc(f.prof.style):""} &middot; ${live(f,"aum",fAum)} in assets &middot; ${live(f,"exp",fExp)} expense ratio &middot; launched ${fDateL(f.inception)||"n/a"}</p>${f.prof?`<p>${esc(f.prof.about)}</p><p><strong>Worth knowing:</strong> ${esc(f.prof.watch)}</p>`:""}<p><a href="/etf/${f.slug}">Full $${f.ticker} profile and live price &rarr;</a></p>`).join("");}

/* ---------- article visuals ---------- */
const nonLev=()=>FUNDS.filter(f=>f.focus!=="leveraged");
function barChart({title,sub,rows,fmt,note}){
  const W=720,rowH=32,lw=170,rw=96,bw=W-lw-rw,H=rows.length*rowH+12,mx=Math.max(...rows.map(r=>r.v||0))||1;
  const g=rows.map((r,i)=>{const y=6+i*rowH,w=Math.max(3,(r.v||0)/mx*bw);const lab=r.href?`<a href="${r.href}"><text x="${lw-12}" y="${y+19}" text-anchor="end" class="cl${r.hl?" hl":""}">${esc(r.label)}</text></a>`:`<text x="${lw-12}" y="${y+19}" text-anchor="end" class="cl${r.hl?" hl":""}">${esc(r.label)}</text>`;
    return `<g class="cr"><title>${esc(r.label)}: ${fmt(r.v)}</title><rect x="0" y="${y}" width="${W}" height="${rowH}" class="hit"/>${lab}<rect x="${lw}" y="${y+5}" width="${w.toFixed(1)}" height="20" rx="4" class="bar${r.hl?" hl":""}"/><text x="${(lw+w+8).toFixed(1)}" y="${y+19}" class="cv">${fmt(r.v)}</text></g>`;}).join("");
  return `<figure class="chart"><figcaption><b>${title}</b>${sub?`<span>${sub}</span>`:""}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}. ${esc(rows.map(r=>r.label+" "+fmt(r.v)).join(", "))}">${g}</svg><p class="src">Source: RobotETFs fund data, updated ${fDateL(NOW.toISOString().slice(0,10))}. ${note||""}</p></figure>`;
}
const fundRows=(l,k,hl=[])=>l.map(f=>({label:"$"+f.ticker,href:"/etf/"+f.slug,v:f[k],hl:hl.includes(f.ticker)}));
function chartToken(spec){
  const [kind,arg,arg2]=spec.split(":");const hl=(arg2||"").split(",");
  if(kind==="aum"){const n=+arg||15;return barChart({title:`Largest robotics ETFs by assets`,sub:`Top ${n} non-leveraged funds, assets under management`,rows:fundRows([...nonLev()].sort((a,b)=>(b.aum||0)-(a.aum||0)).slice(0,n),"aum",hl),fmt:fAum});}
  if(kind==="exp"){const l=[...nonLev()].filter(f=>f.exp!=null).sort((a,b)=>a.exp-b.exp);return barChart({title:"Robotics ETF expense ratios, cheapest first",sub:`All ${l.length} non-leveraged funds, annual fee`,rows:fundRows(l,"exp",hl),fmt:fExp,note:`Average across all funds: ${fExp(AVGEXP)}.`});}
  if(kind==="yld"){const n=+arg||12;const l=[...nonLev()].filter(f=>f.yld).sort((a,b)=>b.yld-a.yld).slice(0,n);return barChart({title:"Highest-yielding robotics ETFs",sub:"Trailing dividend yield, non-leveraged funds",rows:fundRows(l,"yld",hl),fmt:fYld});}
  if(kind==="cats"){return barChart({title:"Robotics ETFs by category",sub:"Number of funds we track in each category",rows:FOCUS.map(f=>({label:f.label,v:COUNT(f.id)})),fmt:v=>v+(v===1?" fund":" funds")});}
  if(kind==="catsaum"){return barChart({title:"Where the money sits",sub:"Combined assets by category",rows:FOCUS.map(f=>({label:f.label,v:FUNDS.filter(x=>x.focus===f.id).reduce((s,x)=>s+(x.aum||0),0)})).sort((a,b)=>b.v-a.v),fmt:fAum});}
  if(kind==="launch"){const ys={};FUNDS.forEach(f=>{if(f.inception){const y=f.inception.slice(0,4);ys[y]=(ys[y]||0)+1;}});return barChart({title:"Robotics ETF launches by year",sub:"Funds on our list by the year they started trading",rows:Object.keys(ys).sort().map(y=>({label:y,v:ys[y],hl:+y>=2025})),fmt:v=>v+(v===1?" launch":" launches")});}
  if(kind==="of"){const l=arg.split(",").map(t=>BY[t]).filter(Boolean);const k=arg2||"aum";const fm=k==="exp"?fExp:k==="yld"?fYld:fAum;const nm={aum:"Assets under management",exp:"Expense ratio",yld:"Dividend yield"}[k];return barChart({title:`${nm}: ${l.map(f=>"$"+f.ticker).join(" vs ")}`,rows:fundRows(l,k),fmt:fm});}
  if(kind==="fees"){const fees=[0.35,AVGEXP,0.95];const yrs=+arg||20;return barChart({title:`What $10,000 grows to in ${yrs} years at different fees`,sub:"Illustration only: assumes a steady 7% yearly return before fees",rows:fees.map((f,i)=>({label:f.toFixed(2)+"% fee"+(i===1?" (avg)":""),v:Math.round(10000*Math.pow(1.07-f/100,yrs)),hl:i===0})),fmt:v=>"$"+v.toLocaleString("en-US"),note:"Hypothetical example, not a projection of any fund's returns."});}
  throw new Error("Unknown chart "+spec);
}
function heroArt(a){
  const lines=String(a.hero||a.tag).split("|");
  const tick=byAum.slice(0,9).map((f,i)=>`<text x="${40+i*128}" y="356" class="ht">$${f.ticker}</text>`).join("");
  const bot=BOT(10,"hb").replace(/<svg[^>]*>/,"").replace("</svg>","");
  return `<figure class="hero-art"><svg viewBox="0 0 1200 400" role="img" aria-label="${esc(a.title)}"><defs><linearGradient id="hg${a.slug.length}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F2B25"/><stop offset="1" stop-color="#2F4F3A"/></linearGradient><pattern id="hgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.06)"/></pattern></defs>
<rect width="1200" height="400" fill="url(#hg${a.slug.length})"/><rect width="1200" height="400" fill="url(#hgrid)"/>
<rect x="0" y="322" width="1200" height="78" fill="rgba(0,0,0,.25)"/>${tick}
<text x="60" y="92" class="hk">${esc(a.tag).toUpperCase()}</text>${lines.map((l,i)=>`<text x="60" y="${172+i*76}" class="hh">${esc(l)}</text>`).join("")}
<g transform="translate(860 40) scale(4.3)">${bot}</g></svg></figure>`;
}
function tokens(html){
  const res=t=>t.startsWith("@")?pick[t.slice(1)]:BY[t];
  const cat=id=>byAum.filter(f=>f.focus===id);
  return html
   .replace(/\{\{n\}\}/g,String(FUNDS.length)).replace(/\{\{total_aum\}\}/g,fAum(TOTAL)).replace(/\{\{avg_exp\}\}/g,fExp(AVGEXP))
   .replace(/\{\{count:([a-z &]+)\}\}/g,(m,id)=>String(COUNT(id)))
   .replace(/\{\{table\}\}/g,()=>`<div class="tbl">${fundTable(byAum)}</div>`)
   .replace(/\{\{table:([a-z &]+)\}\}/g,(m,id)=>`<div class="tbl">${fundTable(cat(id))}</div>`)
   .replace(/\{\{table_by:(exp|inception|yld)(?::(\d+))?\}\}/g,(m,k,n)=>{const l=FUNDS.filter(f=>f[k]!=null&&f.focus!=="leveraged").sort((a,b)=>k==="exp"?a.exp-b.exp:k==="yld"?b.yld-a.yld:b.inception.localeCompare(a.inception));return `<div class="tbl">${fundTable(n?l.slice(0,+n):l)}</div>`;})
   .replace(/\{\{table_of:([A-Z,]+)\}\}/g,(m,t)=>`<div class="tbl">${fundTable(t.split(",").map(x=>BY[x]).filter(Boolean))}</div>`)
   .replace(/\{\{chart:([a-z]+(?::[A-Za-z0-9,]*)?(?::[A-Za-z0-9,]*)?)\}\}/g,(m,sp)=>chartToken(sp))
   .replace(/\{\{tool:(fee|growth|compare|finder|lev)(?::([A-Z,]+))?\}\}/g,(m,k,arg)=>k==="fee"?toolFee(arg||"BOTZ"):k==="growth"?toolGrowth(arg||"BOTZ"):k==="compare"?toolCompare(...(arg||"BOTZ,ROBO").split(",")):k==="finder"?toolFinder():toolLev())
   .replace(/\{\{n_pairs\}\}/g,String(PAIRS.length))
   .replace(/\{\{list\}\}/g,()=>listOf(byAum))
   .replace(/\{\{list:([a-z &]+)\}\}/g,(m,id)=>listOf(cat(id)))
   .replace(/\{\{(link|aum|exp|yld|inc|name):([@A-Za-z.]+)\}\}/g,(m,k,t)=>{const f=res(t);if(!f)return t.startsWith("@")?"":"$"+t;return k==="link"?tlink(f):k==="aum"?live(f,"aum",fAum):k==="exp"?live(f,"exp",fExp):k==="yld"?live(f,"yld",fYld):k==="inc"?fDateL(f.inception):esc(f.name);});
}
function sideBoxes(skip){return `<div class="box"><h3>Robotics ETFs by size</h3>${byAum.filter(f=>f.ticker!==skip).slice(0,14).map(f=>`<a class="ln" href="/etf/${f.slug}"><b>$${f.ticker}</b><span class="num">${live(f,"aum",fAum)}</span></a>`).join("")}<a class="ln more" href="/#rankings">See all ${FUNDS.length} &rarr;</a></div>
<div class="box pro"><h3>TopDividendETFsPRO</h3><p>Our premium terminal: 160+ income ETFs with grades, tax treatment, payout schedules and advanced filters.</p><a class="btn" href="${PRO}" target="_blank" rel="noopener" data-ga="side-pro">Go PRO &rarr;</a></div>`;}
for(const a of ARTICLES){
  const url="/"+a.slug;
  a.html=tokens(a.body);
  const toc=[];let hi=0;a.html=a.html.replace(/<h2>([\s\S]*?)<\/h2>/g,(m,t)=>{const id="s"+(++hi)+"-"+t.replace(/<[^>]+>/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);toc.push([id,t.replace(/<[^>]+>/g,"")]);return `<h2 id="${id}">${t}</h2>`;});
  const words=a.html.replace(/<[^>]+>/g," ").split(/\s+/).filter(Boolean).length;a.mins=Math.max(3,Math.round(words/230));
  const pre=`${a.image?`<figure class="hero-photo"><img src="/images/guides/${a.slug}.jpg" width="1600" height="893" alt="${esc(a.imageAlt||a.title)}" fetchpriority="high"><figcaption>${esc(a.imageAlt||"")}${a.imageAlt?". ":""}AI-generated illustration.</figcaption></figure>`:heroArt(a)}${a.takeaways?`<div class="takeaways"><h2 class="tk-h">Key takeaways</h2><ul>${a.takeaways.map(t=>`<li>${tokens(t)}</li>`).join("")}</ul></div>`:""}${toc.length>3?`<nav class="toc" aria-label="On this page"><b>On this page</b><ol>${toc.map(([id,t])=>`<li><a href="#${id}">${t}</a></li>`).join("")}</ol></nav>`:""}`;
  const post=`${a.sources?`<section class="sources"><h2 class="h2">Sources and methodology</h2><p>Fund figures (assets, expense ratios, yields, launch dates) come from our RobotETFs data sheet, which we check against issuer materials and refresh daily. Always confirm the latest numbers with the issuer before investing.</p><ul>${a.sources.map(([l,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener nofollow">${esc(l)}</a></li>`).join("")}</ul></section>`:""}<div class="author">${BOT(56,"ab"+a.slug.length)}<div><b>Written by Benjie Siegel</b><p>Founder of Dividend Empire and the RobotETFs network of ETF research sites. Benjie is a self-taught investor with more than ten years of experience researching and investing in ETFs, and shares his research with 85K+ followers on X as @DevotedDividend.</p></div></div>`;
  a.html=pre+a.html+post;
  if(/\{\{/.test(a.html))throw new Error("Unresolved token in "+a.slug);
  if(/—|–/.test(a.html.replace(/<[^>]+>/g,"")))console.warn("Dash found in",a.slug);
  const more=ARTICLES.filter(x=>x!==a);
  out[a.slug+".html"]=page({og:a.image?SITE+"/images/guides/"+a.slug+"-og.jpg":OG,title:a.seo+" | RobotETFs",desc:a.dek,canonical:url,type:"article",active:a.nav||"/blog",faq:a.faq,
    ld:{"@context":"https://schema.org","@type":"Article",headline:a.title,description:a.dek,datePublished:a.date,dateModified:NOW.toISOString().slice(0,10),author:{"@type":"Person",name:"Benjie Siegel"},publisher:{"@type":"Organization",name:"Dividend Empire LLC"},image:a.image?SITE+"/images/guides/"+a.slug+".jpg":OG,mainEntityOfPage:SITE+url}},
  `<div class="phead"><div class="wrap"><div class="crumbs"><a href="/">Home</a> / <a href="/blog">Guides</a></div><span class="badge">${esc(a.tag)}</span><h1>${esc(a.title)}</h1><p class="lede">${esc(a.dek)}</p><p class="byline">By Benjie Siegel &middot; Published ${fDateL(a.date)} &middot; Updated ${fDateL(NOW.toISOString().slice(0,10))} &middot; ${a.mins} min read</p></div></div>
${slot(advSlot)}
<div class="wrap body"><div class="layout"><article><div class="prose">${a.html}</div>
${a.faq?`<section class="faq"><h2 class="h2">Frequently asked questions</h2>${a.faq.map(([q,x])=>`<h3>${esc(q)}</h3><p>${esc(x)}</p>`).join("")}</section>`:""}
<p class="note">${DISC}</p></article>
<aside class="side">${sideBoxes()}${toolBox}<div class="box"><h3>More guides</h3>${more.slice(0,12).map(x=>`<a class="ln" href="/${x.slug}">${esc(x.short||x.title)}</a>`).join("")}<a class="ln more" href="/blog">All ${ARTICLES.length} guides &rarr;</a></div></aside></div></div>
${slot(proSlot,"From our network")}`);
}

/* ---------- home ---------- */
const present=FOCUS.filter(f=>COUNT(f.id));
const homeRows=FUNDS.map(f=>`<tr data-t="${f.ticker}"><td class="l"><a class="tk" href="/etf/${f.slug}">$${f.ticker}</a></td><td class="l nm">${esc(f.name)}</td><td class="l prov">${esc(f.issuer)}</td><td class="l">${chip(f.fo)}</td><td class="num">${fAum(f.aum)}</td><td class="num">${fExp(f.exp)}</td><td class="num">${fYld(f.yld)}</td><td class="l pays">${esc(f.pays)}</td><td class="dt">${fDate(f.inception)}</td></tr>`).join("");
const homeFaq=[
 ["What is a robotics ETF?","A robotics ETF is a fund that holds companies building robots and automation: industrial robot makers, motion and sensor suppliers, surgical robotics, humanoid robot developers and the AI chips and software that power them."],
 ["How many robotics ETFs are there?",`We currently track ${FUNDS.length} US-listed ETFs focused on robotics, humanoids, physical AI, autonomous vehicles and drones, holding about ${fAum(TOTAL)} combined.`],
 ["What is the largest robotics ETF?",`${pick.largest.ticker} (${pick.largest.name}) is the largest fund on our list with about ${fAum(pick.largest.aum)} in assets. Among pure robotics funds, BOTZ is the biggest.`],
 ["What is the cheapest robotics ETF?",`${pick.cheapest.ticker} has the lowest expense ratio on our list at ${fExp(pick.cheapest.exp)} a year.`],
 ["Is there a humanoid robot ETF?",`Yes. There are now ${COUNT("humanoid")} humanoid-focused ETFs on our list, including KOID, HUMN and BOTT. See our humanoid robot ETF page for the full list.`],
 ["Do robotics ETFs pay dividends?","Most pay small dividends, usually under 1% a year, and many pay only once or twice a year. These are growth funds, not income funds. Check the yield and payout schedule columns in the table."]];
const snap=[["Largest",pick.largest,"aum",fAum],["Lowest fee",pick.cheapest,"exp",fExp],["Highest yield",pick.yield,"yld",fYld],["Biggest humanoid",pick.humanoid,"aum",fAum],["Newest",pick.newest,null,f=>fDate(f.inception)]].filter(x=>x[1]);
out["index.html"]=page({title:`Robotics ETFs ${YEAR}: Every Robot and Humanoid ETF Ranked and Compared | RobotETFs`,desc:`Compare all ${FUNDS.length} robotics ETFs side by side: BOTZ, ROBO, KOID, ARKQ, HUMN and more, with daily AUM, expense ratios, yields and live prices. Humanoid, automation and physical AI funds.`,canonical:"/",active:"",faq:homeFaq,
  ld:{"@context":"https://schema.org","@graph":[{"@type":"WebSite",name:"RobotETFs",url:SITE+"/",publisher:{"@type":"Organization",name:"Dividend Empire LLC",email:EMAIL,logo:SITE+"/favicon.svg"}},{"@type":"ItemList",name:"Robotics ETFs",itemListElement:FUNDS.map((f,i)=>({"@type":"ListItem",position:i+1,url:`${SITE}/etf/${f.slug}`,name:`${f.ticker} ${f.name}`}))}]},
},
`<div class="hero"><div class="wrap"><div class="hgrid"><div class="hcopy">
<div class="eyebrow"><span class="dot"></span>Updated daily &middot; ${FUNDS.length} funds tracked</div>
<h1>Every robotics, humanoid and automation ETF in one place.</h1>
<p class="lede">Robots are moving from factory cages to warehouses, hospitals and homes. <strong>Here is every US-listed robotics ETF</strong> with assets, fees, yields and live prices, plus a plain-English read on what each fund really owns.</p>
<div class="hbtns"><a class="btn primary" href="#rankings">Browse all ${FUNDS.length} ETFs</a><a class="btn ghost" href="/compare/">Compare funds</a></div>
<div class="hstats"><div><b>${FUNDS.length}</b><span>Robotics ETFs</span></div><div><b>${fAum(TOTAL)}</b><span>Combined AUM</span></div><div><b>${fExp(AVGEXP)}</b><span>Avg. expense</span></div></div>
</div>
<div class="snap"><div class="snaphead">${BOT(54,"ms")}<div><b>Robotics ETF snapshot</b><span>As of ${fDate(NOW.toISOString().slice(0,10))}</span></div></div>
${snap.map(([l,f,k,fm])=>`<a class="srow" href="/etf/${f.slug}"><span class="k">${l}</span><span class="t">$${f.ticker}</span><span class="v">${k?live(f,k,fm):fm(f)}</span></a>`).join("")}
<div class="tape" aria-label="Every robotics ETF we track"><div class="tape-in">${[0,1].map(n=>`<div class="tape-set"${n?' aria-hidden="true"':""}>${byAum.map(f=>`<a href="/etf/${f.slug}"${n?' tabindex="-1"':""}><b>$${f.ticker}</b><span>${fAum(f.aum)}</span><em>${f.yld?fYld(f.yld)+" yld":fExp(f.exp)+" fee"}</em></a>`).join("")}</div>`).join("")}</div></div></div>
</div></div></div>
${slot(advSlot)}
<section id="rankings"><div class="wrap">
<div class="shead"><div><h2>All robotics ETFs</h2><p>Every fund we track, in our curated order. Click a ticker for the full profile and live price, click a header to sort, or search by ticker, fund or provider.</p></div></div>
<div class="controls"><label class="search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" id="q" placeholder="Search ticker, fund or provider" aria-label="Search ETFs"></label>
<div class="cats" id="cats" role="group" aria-label="Filter by category"><button type="button" class="on" data-f="all">All <i>${FUNDS.length}</i></button>${present.map(f=>`<button type="button" data-f="${f.id}" style="--c:${f.c};--bg:${f.bg}">${f.label} <i>${COUNT(f.id)}</i></button>`).join("")}</div></div>
${ADVISORY}
<div class="tablewrap"><div class="scroller"><table class="ptable"><thead><tr><th class="l" data-s="ticker">Ticker</th><th class="l" data-s="name">Fund name</th><th class="l" data-s="issuer">Provider</th><th class="l" data-s="focus">Category</th><th data-s="aum">AUM</th><th data-s="exp">Expense</th><th data-s="yld">Yield</th><th class="l" data-s="pays">Pays</th><th data-s="inception">Launched</th></tr></thead><tbody id="tbody">${homeRows}</tbody></table></div>
<div class="tfoot"><span id="shown">Showing ${FUNDS.length} of ${FUNDS.length} ETFs</span><span>Data as of ${fDate(NOW.toISOString().slice(0,10))} &middot; Not investment advice</span></div></div>
<p class="tnote"><b>How this list is built:</b> funds are included when robotics, automation, humanoids, physical AI or autonomous machines are central to the strategy. A few broader AI funds with large robotics exposure are included for comparison. Inclusion is never a buy or sell signal and the order is not a ranking of quality. Figures come from our data sheet, refresh daily and can lag the issuer, so always verify with the fund's own materials.</p>
</div></section>

<section id="categories"><div class="wrap"><div class="shead"><div><h2>Robotics ETF categories</h2><p>Robotics is not one industry. Here is how the ${FUNDS.length} funds split up, with the money, fees and biggest fund in each corner.</p></div></div>
<div class="catboard"><div class="cb-h"><span>Category</span><span>Funds</span><span>Assets</span><span>Share of assets</span><span>Fee range</span><span>Largest</span><span></span></div>
${CATS.map(c=>`<a class="cb-r" href="/${c.slug}" style="--c:${c.c};--bg:${c.bg}"><span class="cb-n"><i>${icon(c.id)}</i><span><b>${c.name}</b><small>${c.desc}</small></span></span><span class="cb-v" data-l="Funds">${c.n}</span><span class="cb-v" data-l="Assets">${fAum(c.aum)}</span><span class="cb-s" data-l="Share of assets"><span class="cb-bar"><i style="width:${Math.max(2,c.share).toFixed(1)}%"></i></span><em>${c.share<1?"<1":c.share.toFixed(0)}%</em></span><span class="cb-v" data-l="Fee range">${c.min===c.max?fExp(c.min):c.min.toFixed(2)+" to "+fExp(c.max)}</span><span class="cb-v tk2" data-l="Largest">$${c.top.ticker}</span><span class="cb-go">View &rarr;</span></a>`).join("")}</div>
<div class="catchips">${CATS.map(c=>`<div style="--c:${c.c};--bg:${c.bg}"><b>${c.label}</b>${c.funds.map(x=>`<a href="/etf/${x.slug}">$${x.ticker}</a>`).join("")}</div>`).join("")}</div>
</div></section>

<section id="tools"><div class="wrap"><div class="shead"><div><h2>Robotics ETF tools</h2><p>Free calculators built on the same daily data as the table above.</p></div><a class="pill" href="/tools">All tools &rarr;</a></div>
<div class="cards five">${TOOLS.map(([id,n,d])=>`<a class="card mini tl" href="/tools#${id}"><div class="kk">Tool</div><h3>${n}</h3><p>${d}</p></a>`).join("")}</div>
<h3 class="h3">Quick compare</h3>${toolCompare()}
</div></section>

<section id="compare"><div class="wrap"><div class="shead"><div><h2>Compare robotics ETFs</h2><p>Line up two funds on fees, size, yield, strategy and live price.</p></div><a class="pill" href="/compare/">All ${PAIRS.length} comparisons &rarr;</a></div>
<div class="pills">${PAIRS_POP.slice(0,14).map(([a,b])=>`<a class="pill" href="${pairUrl(a,b)}">${a.ticker} vs ${b.ticker}</a>`).join("")}</div></div></section>

${slot(proSlot,"From our network")}
<section id="research"><div class="wrap"><div class="shead"><div><h2>Robotics ETF guides</h2><p>Plain-English research on robotics ETFs and the technology behind them, with live numbers.</p></div><a class="pill" href="/blog">All guides &rarr;</a></div>
<div class="cards">${ARTICLES.slice(0,9).map(a=>`<a class="card post" href="/${a.slug}"><div class="meta"><span class="tag">${esc(a.tag)}</span><span class="date">${fDate(a.date)}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.dek)}</p><span class="go">Read the guide &rarr;</span></a>`).join("")}</div></div></section>

<section id="faq"><div class="wrap"><div class="shead"><div><h2>Robotics ETF FAQ</h2></div></div><div class="faq">${homeFaq.map(([q,a])=>`<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}</div></div></section>`);

/* ---------- ETF pages ---------- */
function rankOf(f,key,asc){const l=FUNDS.filter(x=>x[key]!=null).sort((a,b)=>asc?a[key]-b[key]:b[key]-a[key]);const i=l.indexOf(f);return i<0?null:`#${i+1} of ${l.length}`;}
for(const f of FUNDS){
  const others=byAum.filter(x=>x!==f),i=byAum.indexOf(f),prev=byAum[(i-1+byAum.length)%byAum.length],next=byAum[(i+1)%byAum.length];
  const peers=others.filter(o=>o.focus===f.focus);
  const p=f.prof||{style:"",about:`${f.name} is a ${f.fo.name.toLowerCase()} ETF from ${f.issuer}.`,watch:"Check the issuer's website for the latest holdings and strategy details."};
  const lev=f.focus==="leveraged";
  const faq=[[`What is ${f.ticker}?`,`${f.ticker} is the ${f.name}, a ${f.fo.name.toLowerCase()} ETF from ${f.issuer}. ${p.about}`],
   [`What is ${f.ticker}'s expense ratio?`,f.exp!=null?`${f.ticker} charges ${fExp(f.exp)} a year, about $${(f.exp*100).toFixed(0)} for every $10,000 invested.`:"Check the fund's prospectus for its current expense ratio."],
   [`How big is ${f.ticker}?`,f.aum!=null?`${f.ticker} has about ${fAum(f.aum)} in assets under management, ${rankOf(f,"aum")} robotics ETFs by size.`:"Assets are not available yet."],
   [`Does ${f.ticker} pay a dividend?`,f.yld?`Yes. ${f.ticker} yields about ${fYld(f.yld)} and pays ${f.pays.toLowerCase()==="none yet"?"on an irregular schedule":f.pays.toLowerCase()}. Robotics ETFs are growth funds, so income is small.`:`${f.ticker} has not paid a meaningful dividend yet. Robotics ETFs are growth funds, so income is usually small.`],
   [`When did ${f.ticker} launch?`,f.inception?`${f.ticker} launched on ${fDateL(f.inception)}.`:"Check the issuer's website for the launch date."],
   [`Is ${f.ticker} a good investment?`,"We do not make buy or sell recommendations. Compare its strategy, fees and size with the other robotics ETFs and read the prospectus before deciding."]];
  const cmp=others.filter(o=>hasPair(f,o));
  out[`etf/${f.slug}.html`]=page({title:`${f.ticker} ETF: ${f.name} Price, AUM, Fees and Yield | RobotETFs`,desc:`${f.ticker} (${f.name}) from ${f.issuer}: live price, ${fAum(f.aum)} AUM, ${fExp(f.exp)} expense ratio, ${fYld(f.yld)} yield, launched ${fDate(f.inception)}. What it holds and how it compares with every other robotics ETF.`,canonical:`/etf/${f.slug}`,active:"/#rankings",faq,
    ld:{"@context":"https://schema.org","@type":"WebPage",name:`${f.ticker} ETF`,url:`${SITE}/etf/${f.slug}`,about:{"@type":"FinancialProduct",name:f.name,alternateName:f.ticker,category:"Exchange-traded fund",provider:{"@type":"Organization",name:f.issuer}},breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Robotics ETFs",item:SITE+"/"},{"@type":"ListItem",position:2,name:f.ticker,item:`${SITE}/etf/${f.slug}`}]}}},
`<div class="phead"><div class="wrap"><div class="crumbs"><a href="/">Robotics ETFs</a> / ${f.ticker}</div>
<div class="layout"><div>${chip(f.fo)}${p.style?`<span class="badge">${esc(p.style)}</span>`:""}${lev?`<span class="badge warn">Leveraged</span>`:""}
<h1>$${f.ticker} <span class="sub">${esc(f.name)}</span></h1><p class="lede">${esc(f.issuer)} &middot; launched ${fDateL(f.inception)||"n/a"}${f.age!=null?` (${age(f)} ago)`:""}</p></div>
<div class="tvbox"><div class="k"><span>$${f.ticker} live price</span><span>Since launch</span></div><div data-tv="${f.ticker}">Loading live price...</div></div></div></div></div>
<div class="wrap body"><div class="layout"><div>
<div class="stats"><div><div class="k">AUM</div><div class="v">${live(f,"aum",fAum)}</div><div class="s">${rankOf(f,"aum")||""} by size</div></div><div><div class="k">Expense ratio</div><div class="v">${live(f,"exp",fExp)}</div><div class="s">${f.exp!=null?`$${(f.exp*100).toFixed(0)} a year per $10K`:""}</div></div><div><div class="k">Dividend yield</div><div class="v">${live(f,"yld",fYld)}</div><div class="s">Pays: ${esc(f.pays)}</div></div><div><div class="k">Launched</div><div class="v">${fDate(f.inception)}</div><div class="s">${f.age!=null?age(f)+" of history":""}</div></div><div><div class="k">Provider</div><div class="v sm">${esc(f.issuer)}</div><div class="s">${esc(p.style||"")}</div></div><div><div class="k">Fee rank</div><div class="v">${rankOf(f,"exp",true)||"n/a"}</div><div class="s">Cheapest first</div></div></div>
${lev?`<div class="advisory"><b>Leveraged fund:</b> ${f.ticker} seeks a multiple of its index's daily return and resets every day. Over longer periods its return can differ a lot from the multiple of the index. It is built for short-term trading.</div>`:""}
<nav class="onpage" aria-label="On this page"><a href="#about">About</a><a href="#fees">Fee calculator</a>${lev?'<a href="#leverage">Leverage simulator</a>':""}<a href="#peers">Peers</a><a href="#all">All funds</a><a href="#faq">FAQ</a><a href="/${CBY[f.focus].slug}">${f.fo.label} ETFs</a></nav>
<h2 class="h2" id="about">What $${f.ticker} is</h2><div class="prose"><p>${esc(p.about)}</p><h3>Worth knowing</h3><p>${esc(p.watch)}</p>${f.url?`<p>Check the latest holdings and prospectus on the <a href="${esc(f.url)}" target="_blank" rel="noopener nofollow">${esc(f.issuer)} website</a>.</p>`:""}</div>
<h2 class="h2" id="fees">What $${f.ticker}'s fee costs you</h2><div class="prose"><p>${f.exp!=null?`$${f.ticker} charges ${fExp(f.exp)} a year, which ranks ${rankOf(f,"exp",true)} on our list, cheapest first. The average ${f.fo.label.toLowerCase()} fund charges ${fExp(CBY[f.focus].avg)} and the average across all ${FUNDS.length} funds is ${fExp(AVGEXP)}. Change the numbers below to see what that fee adds up to.`:"Check the prospectus for the current fee."}</p></div>${toolFee(f.ticker)}
${lev?`<h2 class="h2" id="leverage">How daily leverage drifts</h2><div class="prose"><p>$${f.ticker} resets its leverage every day. Try a flat index with big daily swings below and watch what happens to a leveraged fund.</p></div>${toolLev()}`:""}
${peers.length?`<h2 class="h2" id="peers">Other ${f.fo.name.toLowerCase()} ETFs</h2>${fundTable([f].concat(peers),f.ticker)}<p class="more"><a href="/${CBY[f.focus].slug}">See the full ${f.fo.name.toLowerCase()} category &rarr;</a></p>`:`<span id="peers"></span>`}
<h2 class="h2" id="all">$${f.ticker} vs. every robotics ETF</h2>${fundTable([f].concat(others.filter(o=>o.focus!==f.focus)),f.ticker)}
${cmp.length?`<h2 class="h2">Head-to-head comparisons</h2><div class="pills">${cmp.map(o=>`<a class="pill" href="${pairUrl(f,o)}">${f.ticker} vs ${o.ticker}</a>`).join("")}</div>`:""}
<section class="faq" id="faq"><h2 class="h2">$${f.ticker} FAQ</h2>${faq.map(([q,a])=>`<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}</section>
<nav class="pnav" aria-label="More robotics ETFs"><a href="/etf/${prev.slug}"><span>&larr; Previous</span><b>$${prev.ticker}</b> ${esc(prev.issuer)}</a><a href="/etf/${next.slug}"><span>Next &rarr;</span><b>$${next.ticker}</b> ${esc(next.issuer)}</a></nav>
<p class="note">${DISC}</p></div>
<aside class="side">${sideBoxes(f.ticker)}${toolBox}<div class="box"><h3>Guides</h3>${ARTICLES.filter(a=>a.slug.startsWith(f.slug+"-")||a.slug.includes("-"+f.slug)).concat(ARTICLES.filter(a=>!(a.slug.startsWith(f.slug+"-")||a.slug.includes("-"+f.slug)))).slice(0,10).map(a=>`<a class="ln" href="/${a.slug}">${esc(a.short||a.title)}</a>`).join("")}<a class="ln more" href="/blog">All ${ARTICLES.length} guides &rarr;</a></div></aside></div></div>
${slot(advSlot)}`);
}
out["etf.html"]=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Robotics ETF profile | RobotETFs</title><meta name="robots" content="noindex"><link rel="canonical" href="${SITE}/"><script>var t=(new URLSearchParams(location.search).get("symbol")||new URLSearchParams(location.search).get("t")||"").toLowerCase().replace(/[^a-z0-9]/g,"");location.replace(t?"/etf/"+t:"/");</script></head><body><a href="/">RobotETFs</a></body></html>`;

/* ---------- compare ---------- */
for(const [a,b] of PAIRS){
  const rows=[["Provider",x=>esc(x.issuer)],["Category",x=>x.fo.name],["Management",x=>esc(x.prof?.style||"n/a")],["AUM",x=>live(x,"aum",fAum),x=>x.aum,1],["Expense ratio",x=>live(x,"exp",fExp),x=>x.exp,0],["Yearly fee on $10,000",x=>x.exp!=null?"$"+(x.exp*100).toFixed(0):"n/a",x=>x.exp,0],["Dividend yield",x=>live(x,"yld",fYld),x=>x.yld,1],["Pays",x=>esc(x.pays)],["Launched",x=>fDate(x.inception)]];
  const win=(get,hi)=>{const va=get(a),vb=get(b);if(va==null||vb==null||va===vb)return null;return (hi?va>vb:va<vb)?a.ticker:b.ticker;};
  const cheaper=win(x=>x.exp,0),bigger=win(x=>x.aum,1),older=a.inception&&b.inception&&a.inception!==b.inception?(a.inception<b.inception?a:b):null;
  const url=pairUrl(a,b);
  const faq=[[`What is the difference between ${a.ticker} and ${b.ticker}?`,`${a.ticker} is the ${a.name} from ${a.issuer} (${a.fo.name.toLowerCase()}), while ${b.ticker} is the ${b.name} from ${b.issuer} (${b.fo.name.toLowerCase()}). They differ in strategy, fees and size.`],
   [`Which is cheaper, ${a.ticker} or ${b.ticker}?`,cheaper?`${cheaper} has the lower expense ratio: ${fExp(BY[cheaper].exp)} vs ${fExp((cheaper===a.ticker?b:a).exp)}.`:`They charge the same expense ratio, or data is not available.`],
   [`Which is bigger, ${a.ticker} or ${b.ticker}?`,bigger?`${bigger} has more assets: ${fAum(BY[bigger].aum)} vs ${fAum((bigger===a.ticker?b:a).aum)}.`:"Asset data is not available for both funds."]];
  out[`compare/${a.slug}-vs-${b.slug}.html`]=page({title:`${a.ticker} vs ${b.ticker}: Robotics ETF Comparison (Fees, AUM, Yield) | RobotETFs`,desc:`${a.ticker} vs ${b.ticker} side by side: expense ratio, AUM, yield, launch date, strategy and live prices. ${a.name} vs ${b.name}.`,canonical:url,active:"/compare/",faq},
`<div class="phead"><div class="wrap"><div class="crumbs"><a href="/">Robotics ETFs</a> / <a href="/compare/">Compare</a></div><h1>$${a.ticker} vs $${b.ticker}</h1><p class="lede">${esc(a.name)} vs. ${esc(b.name)}: fees, size, yield, strategy and live prices side by side.</p></div></div>
<div class="wrap body"><div class="layout"><div>
<div class="duo"><div class="tvbox"><div class="k"><span>$${a.ticker}</span><a href="/etf/${a.slug}">Profile &rarr;</a></div><div data-tv="${a.ticker}">Loading...</div></div><div class="tvbox"><div class="k"><span>$${b.ticker}</span><a href="/etf/${b.slug}">Profile &rarr;</a></div><div data-tv="${b.ticker}">Loading...</div></div></div>
<h2 class="h2">Side by side</h2><div class="tw"><table class="dtable"><thead><tr><th class="l">Metric</th><th>$${a.ticker}</th><th>$${b.ticker}</th></tr></thead><tbody>${rows.map(([l,fm,get,hi])=>{const w=get?win(get,hi):null;return `<tr><td class="l">${l}</td><td${w===a.ticker?' class="win"':""}>${fm(a)}</td><td${w===b.ticker?' class="win"':""}>${fm(b)}</td></tr>`;}).join("")}</tbody></table></div>
<div class="prose" style="margin-top:22px"><h2>The short version</h2><p>${cheaper?`<strong>$${cheaper}</strong> is cheaper to own, at ${fExp(BY[cheaper].exp)} a year versus ${fExp((cheaper===a.ticker?b:a).exp)}. `:""}${bigger?`<strong>$${bigger}</strong> is the bigger fund, with ${fAum(BY[bigger].aum)} in assets. `:""}${older?`<strong>$${older.ticker}</strong> has been around longer, launching on ${fDateL(older.inception)}.`:""}</p>
<h3>$${a.ticker}</h3><p>${esc(a.prof?.about||"")} ${esc(a.prof?.watch||"")}</p><h3>$${b.ticker}</h3><p>${esc(b.prof?.about||"")} ${esc(b.prof?.watch||"")}</p>
<p>Lower fees and more assets are helpful, but they are not the whole story. The bigger question is which strategy matches what you want to own. This comparison is not a recommendation to buy or sell either fund.</p></div>
<section class="faq"><h2 class="h2">FAQ</h2>${faq.map(([q,x])=>`<h3>${esc(q)}</h3><p>${esc(x)}</p>`).join("")}</section>
<h2 class="h2">More comparisons</h2><div class="pills">${PAIRS.filter(p=>p[0]!==a||p[1]!==b).filter(p=>p.includes(a)||p.includes(b)).map(([x,y])=>`<a class="pill" href="${pairUrl(x,y)}">${x.ticker} vs ${y.ticker}</a>`).join("")}</div>
<p class="note">${DISC}</p></div><aside class="side">${sideBoxes()}</aside></div></div>${slot(advSlot)}`);
}
out["compare/index.html"]=page({title:"Compare Robotics ETFs Side by Side | RobotETFs",desc:`Head-to-head comparisons of robotics and humanoid ETFs: ${PAIRS_POP.slice(0,6).map(([a,b])=>`${a.ticker} vs ${b.ticker}`).join(", ")} and more.`,canonical:"/compare/",active:"/compare/"},
`<div class="phead"><div class="wrap"><div class="crumbs"><a href="/">Robotics ETFs</a> / Compare</div><h1>Compare robotics ETFs</h1><p class="lede">${PAIRS.length} head-to-head matchups covering fees, size, yield, launch dates, strategy and live prices.</p></div></div>
<section><div class="wrap"><h2 class="h2" style="margin-top:0">Compare any two funds</h2>${toolCompare()}<h2 class="h2">Every fund at a glance</h2>${fundTable(byAum)}<h2 class="h2">All matchups</h2><div class="cards">${PAIRS_POP.map(([a,b])=>`<a class="card mini" href="${pairUrl(a,b)}"><div class="kk">${a.fo.label} vs ${b.fo.label}</div><h3>${a.ticker} vs ${b.ticker}</h3><p>${esc(a.issuer)} vs ${esc(b.issuer)} &middot; ${fExp(a.exp)} vs ${fExp(b.exp)}</p></a>`).join("")}</div></div></section>`);

/* ---------- blog + static pages ---------- */
out["blog.html"]=page({title:"Robotics ETF Guides and Research | RobotETFs",desc:"Plain-English guides to robotics ETFs, humanoid robot funds, automation and the companies inside these funds, with live data.",canonical:"/blog",active:"/blog"},
`<div class="phead"><div class="wrap"><div class="crumbs"><a href="/">Home</a> / Guides</div><h1>Robotics ETF guides</h1><p class="lede">Research on robotics ETFs and the technology behind them, written in plain English with live numbers.</p></div></div>
<section><div class="wrap"><div class="cards">${ARTICLES.map(a=>`<a class="card post" href="/${a.slug}"><div class="meta"><span class="tag">${esc(a.tag)}</span><span class="date">${fDate(a.date)}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.dek)}</p><span class="go">Read the guide &rarr;</span></a>`).join("")}</div></div></section>`);
const simple=(file,title,desc,h1,lede,html)=>{out[file+".html"]=page({title:title+" | RobotETFs",desc,canonical:"/"+file,active:"/"+file},`<div class="phead"><div class="wrap"><h1>${h1}</h1>${lede?`<p class="lede">${lede}</p>`:""}</div></div><section><div class="wrap"><div class="prose narrow">${html}</div></div></section>`);};
simple("about","About RobotETFs","RobotETFs.com tracks every robotics, humanoid and automation ETF with daily data. Published by Dividend Empire LLC.","About RobotETFs","One place to track, compare and understand every robotics ETF.",
`<p>RobotETFs.com tracks every US-listed exchange-traded fund built around robotics: industrial automation, humanoid robots, physical AI, autonomous vehicles and drones. Between 2025 and 2026 a wave of new humanoid and robotics funds launched, joining veterans like BOTZ and ROBO, and there was no simple place to compare them all. This site is that place.</p>
<p>Every fund has its own profile with assets, fees, yield, launch date and live price, plus side-by-side comparisons. Fund data lives in our own data sheet and refreshes daily.</p>
<p>RobotETFs is part of the Dividend Empire network, alongside <a href="https://topetfs.com/">TopETFs.com</a>, <a href="https://topdividendetfs.com/">TopDividendETFs.com</a>, <a href="${PRO}">TopDividendETFsPRO</a>, <a href="https://weeklyetfs.com/">WeeklyETFs.com</a>, <a href="https://photonicsetfs.com/">PhotonicsETFs.com</a> and more. The network was founded by Benjie Siegel, a self-taught investor with more than ten years of experience.</p>
<p>Nothing on this site is investment advice. Some placements are paid sponsorships from ETF issuers and are always labeled. Questions, corrections or partnership ideas: <a href="mailto:${EMAIL}">${EMAIL}</a></p>`);
{
const MAILTO=`mailto:${EMAIL}?subject=${encodeURIComponent("RobotETFs sponsorship")}`;
out["advertise.html"]=page({title:"Advertise on RobotETFs: Reach Robotics and Humanoid ETF Investors | RobotETFs",desc:`Sponsor the site built around robotics ETFs. A niche, high-intent audience researching ${byAum.slice(0,5).map(f=>f.ticker).join(", ")} and every other robotics and humanoid fund. One sponsor per placement, sold directly.`,canonical:"/advertise",active:"/advertise"},
`<div class="phead"><div class="wrap"><div class="crumbs"><a href="/">Home</a> / Advertise</div><span class="badge">For ETF issuers</span>
<h1 style="max-width:820px">The most targeted place to reach robotics ETF investors</h1>
<p class="lede">RobotETFs.com does one thing: it tracks every robotics, humanoid and automation ETF. Nobody lands here by accident. Every visitor is already researching this theme, comparing these funds and deciding which one to own.</p>
<div class="hbtns"><a class="btn primary" href="${MAILTO}" data-ga="advertise-hero-email">Request placements</a><a class="btn ghost" href="#placements">See the placements</a></div>
<div class="hstats"><div><b>${FUNDS.length}</b><span>ETFs tracked</span></div><div><b>${fAum(TOTAL)}</b><span>Assets in those funds</span></div><div><b>${PAIRS.length}</b><span>Head-to-head pages</span></div><div><b>${ARTICLES.length}</b><span>Long-form guides</span></div><div><b>85K+</b><span>Followers on X</span></div></div>
</div></div>
<section><div class="wrap"><div class="shead"><div><h2>Super niche. Very high intent.</h2><p>A broad finance site sells you impressions. This site sells you the small group of people already shopping for a robotics fund.</p></div></div>
<div class="cards four">${[["Intent","They arrive searching by ticker","Visitors come in on searches like a fund's ticker, \"humanoid robot ETF\" or one fund versus another. That is the last step before a buy decision."],["Focus","One theme, zero waste","Every page is about robotics, humanoid, physical AI and autonomy funds, so every impression lands on someone who cares about the category."],["Timing","A category being decided now",`${FUNDS.filter(f=>f.inception&&f.inception>="2025").length} of the ${FUNDS.length} funds we track launched in 2025 or 2026. Investors are still choosing, and the names they see repeatedly are the ones they remember.`],["Scarcity","One sponsor per placement","Each position is sold to a single sponsor, directly. No ad networks, no rotation with competitors, no programmatic clutter around your fund."]].map(([k,h,d],i)=>`<div class="card cat" style="--c:${FOCUS[i].c}"><div class="kk">0${i+1} &middot; ${k}</div><h3>${h}</h3><p>${d}</p></div>`).join("")}</div></div></section>
<section><div class="wrap"><div class="shead"><div><h2>Who you reach</h2><p>The audience is small on purpose. These are the readers a robotics fund wants.</p></div></div>
<div class="who"><div><h3>Self-directed investors</h3><p>People who buy ETFs in their own brokerage accounts and want fees, size and strategy before they do.</p></div><div><h3>Advisors and analysts</h3><p>Professionals doing due diligence on a fast-growing theme who need every fund on one page.</p></div><div><h3>AI and automation followers</h3><p>Readers who already own AI names and are looking for the physical side of the trade.</p></div><div><h3>Our network's income investors</h3><p>The Dividend Empire audience across TopDividendETFs, WeeklyETFs and DevotedDividend on X.</p></div></div>
<div class="prose" style="margin-top:22px"><h3>What they do here</h3><ul><li><strong>Compare funds head to head</strong> on ${PAIRS.length} comparison pages, or any two funds with the compare tool.</li><li><strong>Read full fund profiles</strong> for all ${FUNDS.length} funds, each with live price, fee math and peers.</li><li><strong>Use the tools:</strong> fee calculator, ETF finder, growth calculator and leverage simulator.</li><li><strong>Read long-form research:</strong> ${ARTICLES.length} guides and fund reviews.</li></ul></div></div></section>
<section id="placements"><div class="wrap"><div class="shead"><div><h2>Placements</h2><p>Flat monthly pricing, clearly labeled, with your approved creative and disclosures.</p></div></div>
<div class="cards">${[["Most visible","Homepage banner","The first thing visitors see after the hero, directly above the table of every robotics ETF.",["Banner or native text card","Links to your fund page","Exclusive: one sponsor"]],["Widest reach","Site-wide banner","Your fund on every fund profile, comparison page and guide, including competitor profiles.",[`${FUNDS.length+PAIRS.length+ARTICLES.length}+ pages`,"Top and bottom positions","Exclusive: one sponsor"]],["Deepest","Sponsored deep dive","A long-form, clearly labeled review of your fund with live data, kept on the site and in search.",["Featured in Guides and search","Compliance review before publishing","Promoted across our network"]],["Tools","Tool sponsorship","Your fund named as the sponsor of the fee calculator, ETF finder or compare tool.",["Shown where investors make decisions","Your fund preselected where it fits","Always labeled"]],["Amplify","Social and video","Features on our X accounts, including DevotedDividend with 85K+ followers, and our YouTube channels.",["Posts built around your fund's data","Sponsored tags and disclosures","Bundle with any site placement"]],["Network","Dividend Empire bundle","Extend the campaign to TopETFs, TopDividendETFs, WeeklyETFs, PhotonicsETFs and the rest of the network.",["One contract, one invoice","Placement matched to each site","Best value per month"]]].map(([k,h,d,l])=>`<div class="card plc"><div class="kk">${k}</div><h3>${h}</h3><p>${d}</p><ul>${l.map(x=>`<li>${x}</li>`).join("")}</ul></div>`).join("")}</div>
<div class="sponsor"><div class="lbl">What the banner position looks like</div><div class="slot"><div><b>Your robotics ETF here</b><span>Your headline, your ticker and a link to your fund page.</span></div><em>Learn more &rarr;</em></div></div></div></section>
<section><div class="wrap"><div class="shead"><div><h2>How it works</h2></div></div>
<ol class="steps"><li><b>1</b><h3>Email us</h3><p>Send the fund and timing. We reply with what is open and a flat monthly rate.</p></li><li><b>2</b><h3>Send creative</h3><p>Banner, logo and approved language. We can draft copy for your compliance team to review.</p></li><li><b>3</b><h3>Go live</h3><p>Once you approve it, the placement goes live, labeled as sponsored.</p></li><li><b>4</b><h3>See results</h3><p>We track clicks on every placement and can share the numbers with you.</p></li></ol></div></section>
<section><div class="wrap"><div class="duo"><div class="box"><h3>Our standards</h3><p class="bp">Sponsored content is always labeled. We use your approved language, include your disclosures and send creative for compliance review before it goes live. Fund data stays accurate and neutral for every fund on the list, sponsor or not, and sponsorship never changes the order of the table.</p></div><div class="box"><h3>Partners across our network</h3><p class="bp">Issuers who have sponsored or partnered across the Dividend Empire network include:</p><div class="pills">${["REX Shares","VistaShares","VegaShares","IncomeShares","Liquid Strategies","Tuttle Capital","GraniteShares"].map(x=>`<span class="pill">${x}</span>`).join("")}</div></div></div>
<div class="contact" id="contact"><div><span class="kk">Get in touch</span><h2>Tell us which fund you want in front of robotics investors</h2><p>Email us the ticker and the dates you have in mind. We reply with the open placements and a flat monthly rate.</p></div><div><a class="mailbig" href="${MAILTO}" data-ga="advertise-email">${EMAIL}</a><div class="hbtns" style="margin-top:16px"><a class="btn primary" href="${MAILTO}" data-ga="advertise-email-btn">Email us</a><button class="btn ghost" type="button" data-copy="${EMAIL}">Copy address</button></div></div></div>
</div></section>`);
}
simple("disclaimer","Disclaimer","Important information about the data and content on RobotETFs.com.","Disclaimer","",
`<p>${DISC}</p><p>RobotETFs.com and Dividend Empire LLC are not registered investment advisors or broker-dealers. Inclusion of a fund on this site is not an endorsement or recommendation. Fund descriptions summarize public information from issuers and may not reflect the most recent holdings or strategy changes.</p><p>Some placements on this site are paid sponsorships from ETF issuers. Sponsored placements are labeled, and sponsors do not control fund data or editorial content.</p><p>Leveraged ETFs seek a multiple of daily returns and reset daily. They are not suitable for most long-term investors.</p>`);
simple("privacy-policy","Privacy Policy","How RobotETFs.com handles visitor data.","Privacy policy",`Last updated ${fDateL(NOW.toISOString().slice(0,10))}`,
`<p>RobotETFs.com is operated by Dividend Empire LLC. We do not ask you to create an account and we do not sell personal information.</p><h2>Analytics</h2><p>We use Google Analytics to understand how visitors use the site. Google Analytics uses cookies to collect information such as pages visited, time on site and general location. You can opt out with the Google Analytics opt-out browser add-on.</p><h2>Third-party content</h2><p>Price charts are provided by TradingView and fonts by Google Fonts. These services may collect technical information such as your IP address under their own privacy policies.</p><h2>Contact</h2><p>Questions about this policy: <a href="mailto:${EMAIL}">${EMAIL}</a></p>`);
simple("terms-of-use","Terms of Use","Terms for using RobotETFs.com.","Terms of use","",
`<p>By using RobotETFs.com you agree to these terms. The site and its content are provided "as is" for informational and educational purposes only, without warranties of any kind.</p><p>Nothing on this site is investment, financial, tax or legal advice. You are solely responsible for your investment decisions. Dividend Empire LLC is not liable for any losses arising from the use of this site or its data.</p><p>Content on this site is owned by Dividend Empire LLC. You may share links and short quotes with attribution. Do not copy or republish the site or its data without permission.</p><p>Contact: <a href="mailto:${EMAIL}">${EMAIL}</a></p>`);
out["404.html"]=page({title:"Page not found | RobotETFs",desc:"That page does not exist.",canonical:"/404"},`<div class="phead center"><div class="wrap">${BOT(96,"m404")}<h1>Our robot could not find that page</h1><p class="lede">The page you are looking for moved or never existed.</p><p style="margin-top:20px"><a class="btn primary" href="/">See every robotics ETF</a></p></div></div>`);

/* ---------- category pages ---------- */
const CATCOPY={"core robotics":["These are the classic robotics funds. They own the companies that build industrial robot arms, warehouse automation, motion control, machine vision and surgical robots, along with the chips and software that run them.","Core robotics funds are the most established part of this list, with the longest track records and the most assets. They differ mainly in how they weight their holdings: some lean on a few large companies, others spread money evenly across 70 or more."],"physical ai":["Physical AI means artificial intelligence that acts in the real world instead of on a screen: humanoid robots, drones, autonomous machines and the sensors and chips that let them see and move.","This is the newest label in the category. Funds here cut across humanoids, drones and smart factories instead of sticking to one type of machine."],"ai & robotics":["These funds pair robotics with the wider AI trade: chip designers, cloud platforms and software companies sit next to robot and automation makers.","They are usually larger and less volatile than pure robotics funds, and they overlap more with broad technology ETFs. If you want robots specifically, check how much of each fund is really robotics."],"leveraged":["Leveraged robotics funds aim for a multiple of a robotics index's return for a single day. They are trading tools.","Because they reset daily, their return over weeks or months can be very different from the multiple in the name, especially when the index swings up and down."]};
for(const c of CATS.filter(c=>c.own)){
  const [p1,p2]=CATCOPY[c.id]||[c.desc,""];const cheapest=[...c.funds].filter(f=>f.exp!=null).sort((a,b)=>a.exp-b.exp)[0];
  const cp=PAIRS.filter(([a,b])=>a.focus===c.id&&b.focus===c.id);
  const faq=[[`How many ${c.name.toLowerCase()} ETFs are there?`,`We track ${c.n} ${c.name.toLowerCase()} ETF${c.n===1?"":"s"} holding about ${fAum(c.aum)} combined.`],[`What is the largest ${c.label.toLowerCase()} ETF?`,`${c.top.ticker} (${c.top.name}) is the largest, with about ${fAum(c.top.aum)} in assets.`],...(cheapest?[[`What is the cheapest ${c.label.toLowerCase()} ETF?`,`${cheapest.ticker} has the lowest expense ratio in the category at ${fExp(cheapest.exp)} a year. The category average is ${fExp(c.avg)}.`]]:[])];
  out[c.slug+".html"]=page({title:`${c.name} ETFs ${YEAR}: All ${c.n} Funds Compared | RobotETFs`,desc:`Every ${c.name.toLowerCase()} ETF (${c.funds.slice(0,6).map(f=>f.ticker).join(", ")}) with daily AUM, expense ratios, yields and launch dates, plus what the category means.`,canonical:"/"+c.slug,active:"/#rankings",faq,
   ld:{"@context":"https://schema.org","@type":"CollectionPage",name:`${c.name} ETFs`,url:SITE+"/"+c.slug,breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Robotics ETFs",item:SITE+"/"},{"@type":"ListItem",position:2,name:c.name,item:SITE+"/"+c.slug}]},mainEntity:{"@type":"ItemList",itemListElement:c.funds.map((f,i)=>({"@type":"ListItem",position:i+1,url:`${SITE}/etf/${f.slug}`,name:`${f.ticker} ${f.name}`}))}}},
`<div class="phead"><div class="wrap"><div class="crumbs"><a href="/">Robotics ETFs</a> / <a href="/#categories">Categories</a></div>${chip(c)}<h1>${c.name} ETFs</h1><p class="lede">${c.desc} Here ${c.n===1?"is the one fund":`are all ${c.n} funds`} we track in this category, with daily data.</p>
<div class="hstats"><div><b>${c.n}</b><span>Fund${c.n===1?"":"s"}</span></div><div><b>${fAum(c.aum)}</b><span>Combined assets</span></div><div><b>${fExp(c.avg)}</b><span>Average fee</span></div><div><b>$${c.top.ticker}</b><span>Largest fund</span></div></div></div></div>
${slot(advSlot)}
<div class="wrap body"><div class="layout"><div>
<nav class="onpage" aria-label="Categories">${CATS.map(x=>`<a href="/${x.slug}"${x===c?' aria-current="page"':""}>${x.label} <em>${x.n}</em></a>`).join("")}</nav>
<h2 class="h2" style="margin-top:8px">All ${c.name.toLowerCase()} ETFs</h2>${fundTable(c.funds)}
<div class="prose"><h2>What counts as ${c.name.toLowerCase()}</h2><p>${p1}</p><p>${p2}</p></div>
${c.n>1?barChart({title:`${c.name} ETFs by assets`,rows:fundRows(c.funds,"aum"),fmt:fAum})+barChart({title:`${c.name} ETF fees, cheapest first`,rows:fundRows([...c.funds].filter(f=>f.exp!=null).sort((a,b)=>a.exp-b.exp),"exp"),fmt:fExp,note:`Category average: ${fExp(c.avg)}. Average across all funds: ${fExp(AVGEXP)}.`}):""}
<h2 class="h2">Each fund in plain English</h2><div class="prose">${listOf(c.funds)}</div>
${cp.length?`<h2 class="h2">Head-to-head comparisons</h2><div class="pills">${cp.map(([a,b])=>`<a class="pill" href="${pairUrl(a,b)}">${a.ticker} vs ${b.ticker}</a>`).join("")}</div>`:""}
<h2 class="h2">Find a fund in this category</h2>${toolFinder().replace(`value="${c.id}"`,`value="${c.id}" selected`)}
<section class="faq"><h2 class="h2">FAQ</h2>${faq.map(([q,a])=>`<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}</section>
<p class="note">${DISC}</p></div><aside class="side">${sideBoxes()}${toolBox}</aside></div></div>`);
}

/* ---------- tools ---------- */
out["tools.html"]=page({title:`Robotics ETF Tools: Fee Calculator, ETF Finder, Compare and More | RobotETFs`,desc:`Free robotics ETF tools: an expense ratio fee calculator, an ETF finder, compare any two of ${FUNDS.length} funds, a growth calculator and a leveraged ETF simulator, all on daily data.`,canonical:"/tools",active:"/tools",
 faq:[["Are these robotics ETF tools free?","Yes. Every tool on this page is free and needs no account."],["Where does the data come from?",`The tools use the same data sheet as the rest of RobotETFs.com: assets, expense ratios, yields and launch dates for all ${FUNDS.length} funds, checked against issuer materials and refreshed daily.`],["Do the calculators predict returns?","No. They do simple math on the numbers you enter. Real returns are uneven and can be negative. Nothing here is a forecast or a recommendation."]],
 ld:{"@context":"https://schema.org","@type":"WebPage",name:"Robotics ETF tools",url:SITE+"/tools",breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Robotics ETFs",item:SITE+"/"},{"@type":"ListItem",position:2,name:"Tools",item:SITE+"/tools"}]}}},
`<div class="phead"><div class="wrap"><div class="crumbs"><a href="/">Robotics ETFs</a> / Tools</div><span class="badge">Free tools</span><h1>Robotics ETF tools</h1><p class="lede">Five free calculators that run on the same daily data as our fund table. Pick a fund, change the numbers and see the answer update as you type.</p></div></div>
<div class="wrap body"><div class="layout"><div>
<nav class="onpage" aria-label="Tools">${TOOLS.map(([id,n])=>`<a href="#${id}">${n}</a>`).join("")}</nav>
<h2 class="h2" id="fee-calculator" style="margin-top:8px">Robotics ETF fee calculator</h2><div class="prose"><p>An expense ratio looks tiny as a percent. This shows it in dollars. Fees on our list run from ${fExp(pick.cheapest.exp)} ($${pick.cheapest.ticker}) to ${fExp(pick.priciest.exp)} ($${pick.priciest.ticker}).</p></div>${toolFee()}
<h2 class="h2" id="etf-finder">Robotics ETF finder</h2><div class="prose"><p>Narrow all ${FUNDS.length} funds down by what matters to you. Click any result for the full profile.</p></div>${toolFinder()}
<h2 class="h2" id="compare">Compare any two robotics ETFs</h2><div class="prose"><p>Choose any two funds. We have full write-ups for ${PAIRS.length} popular pairs, and this tool covers every other combination.</p></div>${toolCompare()}
<h2 class="h2" id="growth-calculator">Robotics ETF growth calculator</h2><div class="prose"><p>See what a starting amount plus a monthly contribution could add up to, with the fund's real fee taken out along the way.</p></div>${toolGrowth()}
<h2 class="h2" id="leverage-simulator">Leveraged ETF simulator</h2><div class="prose"><p>Leveraged funds such as <a href="/etf/ubot">$UBOT</a> multiply each day's move, not the long-run return. Set the index to end flat with big daily swings and see what is left.</p></div>${toolLev()}
<section class="faq"><h2 class="h2">Tools FAQ</h2><h3>Are these robotics ETF tools free?</h3><p>Yes. Every tool on this page is free and needs no account.</p><h3>Where does the data come from?</h3><p>The tools use the same data sheet as the rest of RobotETFs.com, checked against issuer materials and refreshed daily.</p><h3>Do the calculators predict returns?</h3><p>No. They do simple math on the numbers you enter. Real returns are uneven and can be negative. Nothing here is a forecast or a recommendation.</p></section>
<p class="note">${DISC}</p></div><aside class="side">${sideBoxes()}<div class="box"><h3>Guides</h3>${ARTICLES.slice(0,8).map(a=>`<a class="ln" href="/${a.slug}">${esc(a.short||a.title)}</a>`).join("")}</div></aside></div></div>${slot(advSlot)}`);

/* ---------- search index ---------- */
out["assets/search.json"]=JSON.stringify([
 ...byAum.map(f=>({g:"ETF",t:"$"+f.ticker,s:f.name,u:`/etf/${f.slug}`,k:[f.ticker,f.name,f.issuer,f.fo.name].join(" "),x:fAum(f.aum)+" · "+fExp(f.exp)})),
 ...CATS.map(c=>({g:"Category",t:c.name+" ETFs",s:`${c.n} funds · ${fAum(c.aum)}`,u:"/"+c.slug,k:c.id+" "+c.label+" category"})),
 ...TOOLS.map(([id,n,d])=>({g:"Tool",t:n,s:d,u:"/tools#"+id,k:"tool calculator "+n})),
 ...ARTICLES.map(a=>({g:"Guide",t:a.title,s:a.tag,u:"/"+a.slug,k:[a.title,a.seo,a.dek].join(" ")})),
 ...PAIRS_POP.map(([a,b])=>({g:"Compare",t:`${a.ticker} vs ${b.ticker}`,s:`${a.issuer} vs ${b.issuer}`,u:pairUrl(a,b),k:`${a.ticker} ${b.ticker} ${b.ticker} vs ${a.ticker} compare`})),
 ...[["All robotics ETFs","The full table","/#rankings","list table all"],["Compare robotics ETFs",`${PAIRS.length} matchups`,"/compare/","compare versus"],["All guides","Research and reviews","/blog","guides blog"],["Advertise","Sponsor RobotETFs","/advertise","advertise sponsor contact"],["About","Who runs this site","/about","about contact"]].map(([t,s2,u,k])=>({g:"Page",t,s:s2,u,k}))]);

/* ---------- sitemap, robots, misc ---------- */
const today=NOW.toISOString().slice(0,10);
const urls=["/","/compare/","/blog","/tools",...CATS.filter(c=>c.own).map(c=>"/"+c.slug),"/about","/advertise",...FUNDS.map(f=>`/etf/${f.slug}`),...PAIRS.map(([a,b])=>pairUrl(a,b)),...ARTICLES.map(a=>"/"+a.slug),"/disclaimer","/privacy-policy","/terms-of-use"];
out["sitemap.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`;
out["robots.txt"]=`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`;
out["CNAME"]="robotetfs.com\n";
out[".nojekyll"]="";
out["favicon.svg"]=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F7F8"/><stop offset="1" stop-color="#A9B0B5"/></linearGradient></defs><line x1="32" y1="5" x2="32" y2="12" stroke="#6B7378" stroke-width="3"/><circle cx="32" cy="4.5" r="3.6" fill="#5E8C61"/><rect x="8" y="12" width="48" height="40" rx="11" fill="url(#s)" stroke="#6B7378" stroke-width="2"/><rect x="15" y="22" width="34" height="14" rx="7" fill="#2F4F3A"/><circle cx="25" cy="29" r="3.6" fill="#9BE3A8"/><circle cx="39" cy="29" r="3.6" fill="#9BE3A8"/><path d="M24 43h16" stroke="#6B7378" stroke-width="2.5" stroke-linecap="round"/><rect x="3" y="26" width="5" height="12" rx="2" fill="#C8B89A"/><rect x="56" y="26" width="5" height="12" rx="2" fill="#C8B89A"/></svg>`;
for(const [f,c] of Object.entries(out)){const p=path.join(ROOT,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,c);}
console.log(`Built ${Object.keys(out).length} files: ${FUNDS.length} funds, ${PAIRS.length} comparisons, ${ARTICLES.length} guides.`);
