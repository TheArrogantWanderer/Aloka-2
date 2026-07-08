import { useState, useEffect, useRef, useCallback } from "react";

const LS = {
  get: (key, fb) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  remove: (key) => { try { localStorage.removeItem(key); } catch {} },
};

const NEWS_API_KEY = "63yp_VLo0Fu-wEDdVOJvMpY4-KkMYHHnUjGrDUbfwoUgivXo";
const CATEGORIES = ["All","Breaking","World","Tech","Business","Politics","Sport","Health","Science","Entertainment"];
const CATEGORY_MAP = { "World":"general","Tech":"science_technology","Business":"economy_business_finance","Politics":"politics_government","Sport":"sport","Health":"health","Science":"science_technology","Entertainment":"arts_culture_entertainment" };
const BREAKING_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
const BIAS_COLORS = { "Centre":"#F5A623","Centre-Left":"#6B9FD4","Centre-Right":"#D47B6B","Left":"#4A7FB5","Right":"#B54A4A" };
const SOURCE_BIAS = { "BBC News":"Centre","Reuters":"Centre","Associated Press":"Centre","The Guardian":"Centre-Left","CNN":"Centre-Left","MSNBC":"Left","Fox News":"Right","The New York Times":"Centre-Left","The Washington Post":"Centre-Left","The Wall Street Journal":"Centre-Right","NPR":"Centre-Left","Al Jazeera":"Centre","The Economist":"Centre","Financial Times":"Centre","Sky News":"Centre","NBC News":"Centre-Left","ABC News":"Centre","CBS News":"Centre" };

const MOCK_DATA = {
  All: [
    { id:"m1", category:"World", source:"Reuters", bias:"Centre", time:"3m ago", headline:"G7 leaders agree on new framework to tackle AI governance globally", description:"World leaders at the G7 summit reached a landmark agreement on artificial intelligence governance, setting the first international standards for AI safety and transparency.", url:"#", image:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80" },
    { id:"m2", category:"Tech", source:"The Verge", bias:"Centre-Left", time:"11m ago", headline:"Apple unveils new spatial computing headset with 40-hour battery life", description:"Apple's next-generation Vision Pro successor promises a dramatic leap in battery life and a slimmer form factor, targeting mainstream consumers rather than enterprise users.", url:"#", image:"https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=80" },
    { id:"m3", category:"Business", source:"Financial Times", bias:"Centre", time:"28m ago", headline:"Global markets rally as US Federal Reserve signals pause in rate hikes", description:"Stock markets surged worldwide after Federal Reserve minutes revealed policymakers are leaning toward holding interest rates steady.", url:"#", image:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80" },
    { id:"m4", category:"Politics", source:"BBC News", bias:"Centre", time:"45m ago", headline:"European Parliament passes landmark digital identity legislation", description:"The EU's new digital identity framework gives all 450 million citizens a unified digital wallet for government services, banking, and healthcare.", url:"#", image:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80" },
    { id:"m5", category:"Health", source:"The Guardian", bias:"Centre-Left", time:"1h ago", headline:"New study links ultra-processed food consumption to accelerated brain aging", description:"A major longitudinal study tracking 30,000 adults over 15 years found those consuming the most ultra-processed foods showed cognitive decline 3.6 years faster.", url:"#", image:"https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80" },
    { id:"m6", category:"Science", source:"Nature", bias:"Centre", time:"2h ago", headline:"Scientists detect possible signs of ancient microbial life in Mars rock samples", description:"NASA researchers analyzing samples returned by the Perseverance rover found organic compounds consistent with ancient biological activity roughly 3.5 billion years ago.", url:"#", image:"https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&q=80" },
    { id:"m7", category:"Sport", source:"ESPN", bias:"Centre", time:"2h ago", headline:"FIFA confirms 2030 World Cup will span three continents for centenary celebration", description:"Football's governing body confirmed the 2030 World Cup will be hosted across Spain, Portugal, Morocco, Argentina, Uruguay, and Paraguay.", url:"#", image:"https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80" },
    { id:"m8", category:"Entertainment", source:"Variety", bias:"Centre-Left", time:"3h ago", headline:"Netflix's most-watched original film breaks 200 million views in record time", description:"The streaming giant's latest thriller surpassed 200 million views in just 18 days, shattering the platform's previous record.", url:"#", image:"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80" },
  ],
  World: [
    { id:"m101", category:"World", source:"Reuters", bias:"Centre", time:"5m ago", headline:"United Nations Security Council votes on emergency ceasefire resolution", description:"The UN Security Council convened an emergency session with diplomatic tensions running high among permanent members.", url:"#", image:"https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&q=80" },
    { id:"m102", category:"World", source:"Al Jazeera", bias:"Centre", time:"22m ago", headline:"Pacific Island nations declare climate emergency, demand immediate action", description:"A coalition of twelve Pacific Island nations formally declared a climate emergency at the UN, warning several low-lying nations face uninhabitability within 30 years.", url:"#", image:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80" },
    { id:"m103", category:"World", source:"BBC News", bias:"Centre", time:"1h ago", headline:"China and India agree to resume high-level diplomatic talks after border standoff", description:"Following months of tensions along disputed Himalayan borders, both nations announced a renewed diplomatic channel.", url:"#", image:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80" },
    { id:"m104", category:"World", source:"Associated Press", bias:"Centre", time:"2h ago", headline:"Global refugee numbers reach record 120 million for third consecutive year", description:"The UNHCR's annual report confirmed forced displacement has hit a historic high for the third year running.", url:"#", image:"https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80" },
  ],
  Tech: [
    { id:"m201", category:"Tech", source:"The Verge", bias:"Centre-Left", time:"8m ago", headline:"OpenAI releases GPT-5 with real-time reasoning and 1M token context window", description:"OpenAI's flagship model launch sets a new benchmark in AI capability with native multimodal reasoning.", url:"#", image:"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80" },
    { id:"m202", category:"Tech", source:"Wired", bias:"Centre-Left", time:"31m ago", headline:"Google's quantum computer solves problem that would take classical machines 47 years", description:"Google DeepMind announced a quantum computing breakthrough demonstrating practical quantum advantage.", url:"#", image:"https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80" },
    { id:"m203", category:"Tech", source:"TechCrunch", bias:"Centre", time:"55m ago", headline:"Startup raises $400M to build the world's first fully autonomous AI software engineer", description:"The San Francisco-based startup claims its AI can independently build, test, and deploy production-grade software.", url:"#", image:"https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&q=80" },
    { id:"m204", category:"Tech", source:"MIT Technology Review", bias:"Centre", time:"3h ago", headline:"New battery chemistry achieves 1,000 charge cycles with zero capacity loss", description:"Researchers at Stanford developed a lithium-metal battery variant that maintains full capacity across a thousand charge cycles.", url:"#", image:"https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80" },
  ],
  Business: [
    { id:"m301", category:"Business", source:"Financial Times", bias:"Centre", time:"12m ago", headline:"Amazon acquires logistics startup in $4.2B deal to compete with FedEx", description:"Amazon's latest acquisition signals an aggressive push to build end-to-end logistics independence.", url:"#", image:"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80" },
    { id:"m302", category:"Business", source:"The Wall Street Journal", bias:"Centre-Right", time:"40m ago", headline:"OPEC+ agrees surprise output cut sending oil prices above $90 per barrel", description:"The oil producer cartel's unexpected decision to reduce output by 1.5 million barrels per day pushed crude prices sharply higher.", url:"#", image:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80" },
    { id:"m303", category:"Business", source:"Bloomberg", bias:"Centre", time:"1h ago", headline:"Tesla's energy division now generates more revenue than its auto business", description:"For the first time in company history, Tesla's energy storage and solar division outpaced vehicle sales in quarterly revenue.", url:"#", image:"https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80" },
  ],
  Politics: [
    { id:"m401", category:"Politics", source:"BBC News", bias:"Centre", time:"15m ago", headline:"UK Prime Minister announces snap general election for September", description:"In a surprise announcement from Downing Street, the Prime Minister called a general election two years ahead of schedule.", url:"#", image:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80" },
    { id:"m402", category:"Politics", source:"NPR", bias:"Centre-Left", time:"1h ago", headline:"US Senate passes bipartisan infrastructure bill with $1.2 trillion in spending", description:"The rare show of bipartisan cooperation delivers the largest infrastructure investment in American history.", url:"#", image:"https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80" },
    { id:"m403", category:"Politics", source:"The Economist", bias:"Centre", time:"3h ago", headline:"France's ruling coalition collapses ahead of budget vote", description:"The French government faces a constitutional crisis after coalition partners withdrew support over austerity measures.", url:"#", image:"https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800&q=80" },
  ],
  Sport: [
    { id:"m501", category:"Sport", source:"ESPN", bias:"Centre", time:"20m ago", headline:"Lionel Messi announces retirement from international football at 38", description:"The eight-time Ballon d'Or winner confirmed he will not participate in the next World Cup qualifying campaign.", url:"#", image:"https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80" },
    { id:"m502", category:"Sport", source:"Sky Sports", bias:"Centre", time:"45m ago", headline:"Formula 1 confirms Las Vegas Grand Prix extended to 10-year deal", description:"The sport's fastest-growing race on the calendar has secured a long-term future with major infrastructure upgrades planned.", url:"#", image:"https://images.unsplash.com/photo-1541773367336-d3f5f5a54818?w=800&q=80" },
    { id:"m503", category:"Sport", source:"BBC Sport", bias:"Centre", time:"2h ago", headline:"New Zealand All Blacks reclaim World Rugby number one ranking", description:"After a dominant series victory against the British & Irish Lions, the All Blacks returned to the top of world rugby rankings.", url:"#", image:"https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80" },
  ],
  Health: [
    { id:"m601", category:"Health", source:"The Guardian", bias:"Centre-Left", time:"18m ago", headline:"WHO approves world's first malaria vaccine for widespread use in children", description:"The World Health Organization granted full approval to a second-generation malaria vaccine showing 77% efficacy in clinical trials.", url:"#", image:"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80" },
    { id:"m602", category:"Health", source:"Reuters", bias:"Centre", time:"50m ago", headline:"Ozempic found to reduce cardiovascular disease risk by 20% in landmark trial", description:"A major clinical trial confirmed that semaglutide drugs reduce the risk of heart attack and stroke significantly.", url:"#", image:"https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80" },
    { id:"m603", category:"Health", source:"BBC News", bias:"Centre", time:"2h ago", headline:"Global life expectancy hits 74 years for first time despite pandemic setback", description:"WHO data shows humanity has recovered the life expectancy gains lost during COVID-19.", url:"#", image:"https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80" },
  ],
  Science: [
    { id:"m701", category:"Science", source:"Nature", bias:"Centre", time:"35m ago", headline:"First complete map of a human brain's neural connections published", description:"An international team published the first full connectome of a cubic millimetre of human brain tissue, mapping 57,000 cells.", url:"#", image:"https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&q=80" },
    { id:"m702", category:"Science", source:"Science", bias:"Centre", time:"1h ago", headline:"CRISPR gene editing reverses inherited blindness in first human trial", description:"Researchers restored functional vision in three patients with a rare inherited retinal disease using in-vivo CRISPR.", url:"#", image:"https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80" },
    { id:"m703", category:"Science", source:"MIT Technology Review", bias:"Centre", time:"4h ago", headline:"New material absorbs 99.9% of sunlight and converts it to electricity", description:"Scientists developed a perovskite-silicon tandem solar cell achieving 47% energy conversion efficiency in lab conditions.", url:"#", image:"https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80" },
  ],
  Entertainment: [
    { id:"m801", category:"Entertainment", source:"Variety", bias:"Centre-Left", time:"10m ago", headline:"Beyoncé's Renaissance film breaks all-time opening weekend record for a concert film", description:"The visual companion to her critically acclaimed album shattered box office records earning $92M globally.", url:"#", image:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80" },
    { id:"m802", category:"Entertainment", source:"The Hollywood Reporter", bias:"Centre", time:"55m ago", headline:"Succession creator announces new HBO series set in Silicon Valley", description:"Jesse Armstrong returns with a new limited series examining power and dysfunction inside a fictional AI company.", url:"#", image:"https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80" },
    { id:"m803", category:"Entertainment", source:"BBC Culture", bias:"Centre", time:"3h ago", headline:"The Booker Prize awarded to debut Nigerian novelist in historic first", description:"The 2026 Booker Prize was awarded to a debut novelist from Lagos, the youngest winner in the prize's 57-year history.", url:"#", image:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80" },
  ],
};

function getBias(n) { if(!n) return "Centre"; for(const [k,v] of Object.entries(SOURCE_BIAS)){ if(n.toLowerCase().includes(k.toLowerCase())) return v; } return "Centre"; }
function timeAgo(d) { if(!d) return "Recently"; const diff=Math.floor((Date.now()-new Date(d))/1000); if(diff<60) return `${diff}s ago`; if(diff<3600) return `${Math.floor(diff/60)}m ago`; if(diff<86400) return `${Math.floor(diff/3600)}h ago`; return `${Math.floor(diff/86400)}d ago`; }

function formatArticle(raw, cat) {
  const stableId = raw.url ? `cur_${raw.url.replace(/[^a-zA-Z0-9]/g,"").slice(-40)}` : (raw.id||`rand_${Math.random().toString(36).slice(2)}`);
  return { id:stableId, category:cat, source:raw.author||raw.source||"Unknown", bias:getBias(raw.author||raw.source), time:raw.published?timeAgo(raw.published):"Recently", headline:raw.title||"No headline", description:raw.description||"", url:raw.url||"#", image:raw.image||null };
}

function dedupeArticles(list, existingIds) {
  const seen = new Set(existingIds||[]);
  const out = [];
  for (const a of list) {
    const key=(a.headline||"").trim().toLowerCase();
    if(seen.has(key)||seen.has(a.id)) continue;
    seen.add(key); seen.add(a.id);
    out.push(a);
  }
  return out;
}

// ── Auth Modal ─────────────────────────────────────────────────────────────
function AuthModal({ mode, onClose, onAuth }) {
  const [view,setView]=useState(mode);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const inp={width:"100%",padding:"13px 16px",background:"#111",border:"1px solid #2A2A2A",borderRadius:12,color:"#fff",fontSize:14,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:10};
  const lbl={fontSize:11,fontWeight:700,color:"#555",letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:6};
  const handleSubmit=async()=>{
    setError("");
    if(!email||!password){setError("Please fill in all fields.");return;}
    if(view==="signup"&&!name){setError("Please enter your name.");return;}
    if(password.length<6){setError("Password must be at least 6 characters.");return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,900));
    const user={name:view==="signup"?name:email.split("@")[0],email,joinedAt:new Date().toISOString()};
    LS.set("aloka_user",user);
    setLoading(false);
    onAuth(user);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"#0D0D0D",borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",border:"1px solid #1A1A1A"}}>
        <div style={{width:36,height:4,background:"#2A2A2A",borderRadius:2,margin:"0 auto 24px"}}/>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:800,color:"#fff",marginBottom:6}}>{view==="signup"?"Create your account":"Welcome back"}</div>
        <p style={{fontSize:13,color:"#555",marginBottom:24,fontFamily:"'Inter',sans-serif"}}>{view==="signup"?"Sync your preferences across all devices. Always free.":"Sign in to access your saved preferences."}</p>
        {view==="signup"&&<><label style={lbl}>Your name</label><input style={inp} placeholder="e.g. Mas" value={name} onChange={e=>setName(e.target.value)}/></>}
        <label style={lbl}>Email</label>
        <input style={inp} type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
        <label style={lbl}>Password</label>
        <input style={inp} type="password" placeholder="Min. 6 characters" value={password} onChange={e=>setPassword(e.target.value)}/>
        {error&&<p style={{fontSize:12,color:"#D47B6B",marginBottom:10,fontFamily:"'Inter',sans-serif"}}>⚠ {error}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:14,background:loading?"#7A5200":"#F5A623",border:"none",borderRadius:12,color:"#000",fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",fontFamily:"'Inter',sans-serif",marginTop:6}}>
          {loading?"Please wait…":view==="signup"?"Create account":"Sign in"}
        </button>
        <p style={{textAlign:"center",fontSize:13,color:"#444",marginTop:16,fontFamily:"'Inter',sans-serif"}}>
          {view==="signup"?"Already have an account? ":"Don't have an account? "}
          <span onClick={()=>{setView(view==="signup"?"signin":"signup");setError("");}} style={{color:"#F5A623",cursor:"pointer",fontWeight:600}}>{view==="signup"?"Sign in":"Create one"}</span>
        </p>
      </div>
    </div>
  );
}

// ── Swipe tutorial ─────────────────────────────────────────────────────────
function SwipeTutorial({ onDone }) {
  return (
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.96)",zIndex:50,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{fontSize:40,marginBottom:16}}>👋</div>
      <p style={{fontSize:17,fontWeight:700,color:"#fff",textAlign:"center",marginBottom:24,fontFamily:"'Playfair Display',Georgia,serif"}}>Welcome to Aloka</p>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:28,width:"100%",maxWidth:340}}>
        {[["👈","Swipe left to skip","Not interested? Move on."],["👉","Swipe right to read","Opens it inside Aloka. You can always come back."],["🔖","Tap Save to bookmark","Find it later in your Saved tab."]].map(([icon,title,desc])=>(
          <div key={title} style={{display:"flex",alignItems:"center",gap:14,background:"#1A1A1A",borderRadius:14,padding:"14px 16px"}}>
            <span style={{fontSize:24}}>{icon}</span>
            <div><p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{title}</p><p style={{fontSize:12,color:"#555",margin:0}}>{desc}</p></div>
          </div>
        ))}
      </div>
      <button onClick={onDone} style={{width:"100%",maxWidth:340,padding:14,background:"#F5A623",border:"none",borderRadius:12,color:"#000",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Got it — show me the news</button>
    </div>
  );
}

// ── Bias tag ───────────────────────────────────────────────────────────────
function BiasTag({bias}) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,letterSpacing:"0.04em",color:BIAS_COLORS[bias]||"#F5A623",textTransform:"uppercase"}}><span style={{width:6,height:6,borderRadius:"50%",background:BIAS_COLORS[bias]||"#F5A623",display:"inline-block"}}/>{bias}</span>;
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{position:"absolute",top:0,left:0,right:0,background:"#1A1A1A",borderRadius:20,overflow:"hidden",border:"1px solid #2A2A2A",zIndex:10}}>
      <div style={{height:200,background:"#252525",animation:"pulse 1.5s ease-in-out infinite"}}/>
      <div style={{padding:20}}>
        {[70,100,60,80].map((w,i)=>(
          <div key={i} style={{height:i===1?20:12,width:`${w}%`,background:"#252525",borderRadius:6,marginBottom:12,animation:"pulse 1.5s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>
        ))}
      </div>
    </div>
  );
}

// ── News Card ──────────────────────────────────────────────────────────────
function NewsCard({article, onSkip, onRead, onSave, isTop, stackIndex}) {
  const startX=useRef(null), currentX=useRef(0);
  const [dragging,setDragging]=useState(false);
  const [offset,setOffset]=useState(0);
  const [imgError,setImgError]=useState(false);

  const handleStart=(x)=>{if(!isTop)return;startX.current=x;setDragging(true);};
  const handleMove=(x)=>{if(!dragging||!isTop)return;const d=x-startX.current;currentX.current=d;setOffset(d);};
  const handleEnd=()=>{
    if(!dragging||!isTop)return;
    setDragging(false);
    if(Math.abs(currentX.current)>100){
      currentX.current>0?onRead(article):onSkip(article);
    } else setOffset(0);
    currentX.current=0;
  };

  const rotation=isTop?offset*0.07:0;
  const swipeDir=offset>60?"read":offset<-60?"skip":null;
  const stackStyles={
    0:{transform:`translateX(${offset}px) rotate(${rotation}deg)`,zIndex:10,opacity:Math.max(0.3,1-Math.abs(offset)/300)},
    1:{transform:"translateX(0) rotate(0deg)",zIndex:9,opacity:0.55,pointerEvents:"none"},
    2:{transform:"translateX(0) rotate(0deg)",zIndex:8,opacity:0.25,pointerEvents:"none"},
  };

  const hasImage = article.image && !imgError;

  return (
    <div onMouseDown={e=>handleStart(e.clientX)} onMouseMove={e=>handleMove(e.clientX)} onMouseUp={handleEnd} onMouseLeave={handleEnd}
      onTouchStart={e=>handleStart(e.touches[0].clientX)} onTouchMove={e=>{e.preventDefault();handleMove(e.touches[0].clientX);}} onTouchEnd={handleEnd}
      style={{position:"absolute",top:0,left:0,right:0,background:"#1A1A1A",borderRadius:20,cursor:isTop?"grab":"default",userSelect:"none",transition:dragging?"none":"transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease",border:"1px solid #2A2A2A",boxShadow:isTop?"0 20px 60px rgba(0,0,0,0.6)":"none",overflow:"hidden",maxHeight:600,...(stackStyles[stackIndex]||{display:"none"})}}>

      {/* Swipe indicators */}
      {isTop&&swipeDir==="read"&&<div style={{position:"absolute",top:16,left:16,background:"#F5A623",color:"#000",padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:700,opacity:Math.min(1,(offset-60)/60),zIndex:20,boxShadow:"0 2px 12px rgba(245,166,35,0.5)"}}>READ →</div>}
      {isTop&&swipeDir==="skip"&&<div style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,0.7)",color:"#888",padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:700,opacity:Math.min(1,(-offset-60)/60),zIndex:20,border:"1px solid #333"}}>← SKIP</div>}

      {/* Hero image */}
      {hasImage ? (
        <div style={{position:"relative",height:200,overflow:"hidden",background:"#111"}}>
          <img src={article.image} alt="" onError={()=>setImgError(true)}
            style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:0.9}}/>
          {/* Gradient overlay for text readability */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent, #1A1A1A)"}}/>
          {/* Category badge over image */}
          <div style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",padding:"4px 10px",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#F5A623",letterSpacing:"0.08em",textTransform:"uppercase"}}>{article.category}</span>
          </div>
        </div>
      ) : (
        // No image fallback — coloured gradient banner
        <div style={{height:80,background:"linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",display:"flex",alignItems:"center",padding:"0 20px",position:"relative"}}>
          <span style={{fontSize:10,fontWeight:700,color:"#F5A623",letterSpacing:"0.08em",textTransform:"uppercase",background:"rgba(0,0,0,0.4)",padding:"4px 10px",borderRadius:20}}>{article.category}</span>
        </div>
      )}

      {/* Card content */}
      <div style={{padding:"16px 20px 20px",overflowY:isTop?"auto":"hidden",maxHeight:hasImage?360:480}}>
        {/* Source + bias + time */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,fontWeight:700,color:"#fff"}}>{article.source}</span>
            <BiasTag bias={article.bias}/>
          </div>
          <span style={{fontSize:11,color:"#555"}}>{article.time}</span>
        </div>

        {/* Headline */}
        <h2 style={{fontSize:19,fontWeight:700,lineHeight:1.3,color:"#fff",margin:"0 0 12px",fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:"-0.01em"}}>{article.headline}</h2>

        {/* Description */}
        {article.description&&<p style={{fontSize:14,lineHeight:1.6,color:"#888",margin:"0 0 16px",fontFamily:"'Inter',sans-serif"}}>{article.description}</p>}

        {/* Actions */}
        {isTop&&(
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>onSkip(article)} style={{flex:1,padding:11,background:"#111",border:"1px solid #2A2A2A",borderRadius:12,color:"#666",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Skip</button>
            <button onClick={()=>onRead(article)} style={{flex:2,padding:11,background:"#F5A623",border:"none",borderRadius:12,color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Read →</button>
            <button onClick={()=>onSave(article)} style={{flex:1,padding:11,background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:12,color:"#CCC",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>🔖</button>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Article Body — rich typography renderer ────────────────────────────────
function ArticleBody({ text }) {
  if (!text) return null;

  const paragraphs = text
    .split("\n\n")
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Detect if a paragraph is likely a pull quote candidate:
  // short, punchy, ends without a period or with an exclamation/question
  const isPullQuote = (p, i) => {
    if (i === 0) return false; // never pull quote the standfirst
    const words = p.split(" ").length;
    return words >= 8 && words <= 30 && (p.endsWith("!") || p.endsWith("?") || (words <= 20 && !p.endsWith(".")));
  };

  // Detect likely section break: very short line (subheading-like)
  const isSectionBreak = (p) => {
    const words = p.split(" ").length;
    return words <= 6 && p === p.toUpperCase() || (words <= 8 && !p.includes(",") && !p.endsWith(".") && p.length < 60);
  };

  // Track pull quotes so we don't show more than 2
  let pullQuoteCount = 0;

  return (
    <div style={{ marginBottom: 28 }}>
      {paragraphs.map((para, i) => {
        // Standfirst — first paragraph, larger and lighter
        if (i === 0) {
          return (
            <p key={i} style={{
              fontSize: 20,
              lineHeight: 1.7,
              color: "#E0E0E0",
              margin: "0 0 24px",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              borderLeft: "3px solid #F5A623",
              paddingLeft: 16,
            }}>{para}</p>
          );
        }

        // Section break — style as a subheading
        if (isSectionBreak(para)) {
          return (
            <div key={i} style={{ margin: "28px 0 16px" }}>
              <div style={{ height: 1, background: "#1A1A1A", marginBottom: 16 }} />
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#F5A623",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                margin: 0,
                fontFamily: "'Inter', sans-serif",
              }}>{para}</p>
            </div>
          );
        }

        // Pull quote — max 2 per article
        if (isPullQuote(para, i) && pullQuoteCount < 2) {
          pullQuoteCount++;
          return (
            <blockquote key={i} style={{
              margin: "24px 0",
              padding: "16px 20px",
              background: "rgba(245,166,35,0.06)",
              borderLeft: "3px solid #F5A623",
              borderRadius: "0 12px 12px 0",
            }}>
              <p style={{
                fontSize: 18,
                lineHeight: 1.6,
                color: "#F5A623",
                margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
              }}>{para}</p>
            </blockquote>
          );
        }

        // Short paragraph — give more breathing room
        const isShort = para.split(" ").length < 20;

        // Regular paragraph
        return (
          <p key={i} style={{
            fontSize: 16,
            lineHeight: 1.8,
            color: "#BBBBBB",
            margin: isShort ? "0 0 20px" : "0 0 16px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
          }}>{para}</p>
        );
      })}
    </div>
  );
}

// ── In-App Reader ──────────────────────────────────────────────────────────
function ReaderView({article, onClose, onSave}) {
  const [fullText,setFullText]=useState(null);
  const [extracting,setExtracting]=useState(true);
  const [byline,setByline]=useState(null);
  const [imgError,setImgError]=useState(false);

  // Swipe-to-close
  const swipeStartX=useRef(null);
  const swipeCurrX=useRef(0);
  const [swipeOffset,setSwipeOffset]=useState(0);
  const [swiping,setSwiping]=useState(false);

  const onSwipeStart=(x)=>{ swipeStartX.current=x; setSwiping(true); };
  const onSwipeMove=(x)=>{
    if(!swiping||swipeStartX.current===null) return;
    const d=x-swipeStartX.current;
    if(d<0){ swipeCurrX.current=0; setSwipeOffset(0); return; }
    swipeCurrX.current=d; setSwipeOffset(d);
  };
  const onSwipeEnd=()=>{
    setSwiping(false);
    if(swipeCurrX.current>110) onClose();
    else setSwipeOffset(0);
    swipeCurrX.current=0;
  };

  useEffect(()=>{
    if(!article)return;
    setFullText(null);setByline(null);setExtracting(true);
    fetch("/api/extract",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:article.url})})
      .then(r=>r.json())
      .then(data=>{
        if(data.success&&data.content){setFullText(data.content);setByline(data.byline||null);}
        setExtracting(false);
      })
      .catch(()=>setExtracting(false));
  },[article]);

  if(!article)return null;

  const swipeProgress=Math.min(swipeOffset/200,1);

  return (
    <div
      onMouseDown={e=>onSwipeStart(e.clientX)} onMouseMove={e=>onSwipeMove(e.clientX)} onMouseUp={onSwipeEnd} onMouseLeave={onSwipeEnd}
      onTouchStart={e=>onSwipeStart(e.touches[0].clientX)} onTouchMove={e=>onSwipeMove(e.touches[0].clientX)} onTouchEnd={onSwipeEnd}
      style={{position:"fixed",inset:0,background:"#0D0D0D",zIndex:600,display:"flex",flexDirection:"column",maxWidth:420,margin:"0 auto",
        transform:`translateX(${swipeOffset}px)`,
        transition:swiping?"none":"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        opacity:1-swipeProgress*0.3,
      }}>
      {/* Swipe back hint */}
      {swipeOffset>20&&(
        <div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",background:"#F5A623",color:"#000",padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:700,zIndex:10,opacity:Math.min(1,swipeProgress*3),pointerEvents:"none"}}>← Back</div>
      )}
      {/* Header */}
      <div style={{padding:"52px 20px 16px",borderBottom:"1px solid #1A1A1A",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={onClose} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:"50%",width:36,height:36,color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        <span style={{fontSize:11,color:"#F5A623",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>Aloka Reader</span>
        <button onClick={()=>onSave(article)} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:"50%",width:36,height:36,color:"#fff",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>🔖</button>
      </div>

      <div style={{flex:1,overflowY:"auto"}}>
        {/* Hero image in reader */}
        {article.image&&!imgError&&(
          <div style={{height:240,overflow:"hidden",background:"#111"}}>
            <img src={article.image} alt="" onError={()=>setImgError(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          </div>
        )}

        <div style={{padding:"24px 20px 60px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{article.source}</span><BiasTag bias={article.bias}/></div>
            <span style={{fontSize:12,color:"#555"}}>{article.time}</span>
          </div>

          <div style={{marginBottom:14}}><span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#F5A623",textTransform:"uppercase",background:"rgba(245,166,35,0.1)",padding:"3px 8px",borderRadius:4}}>{article.category}</span></div>

          <h1 style={{fontSize:26,fontWeight:800,lineHeight:1.3,color:"#fff",margin:"0 0 12px",fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:"-0.01em"}}>{article.headline}</h1>

          {byline&&<p style={{fontSize:12,color:"#555",margin:"0 0 20px",fontFamily:"'Inter',sans-serif",fontStyle:"italic"}}>By {byline}</p>}

          {extracting?(
            <div style={{marginBottom:24}}>
              {[100,95,88,92,70,98,85,60].map((w,i)=>(
                <div key={i} style={{height:13,width:`${w}%`,background:"#1A1A1A",borderRadius:5,marginBottom:10,animation:"pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.08}s`}}/>
              ))}
              <p style={{fontSize:12,color:"#444",marginTop:12,textAlign:"center"}}>Loading full article…</p>
            </div>
          ):fullText?(
            <ArticleBody text={fullText}/>
          ):(
            <div style={{marginBottom:24}}>
              {article.description&&<p style={{fontSize:17,lineHeight:1.8,color:"#CCC",margin:"0 0 20px",fontFamily:"'Inter',sans-serif",fontWeight:400}}>{article.description}</p>}
              <div style={{background:"rgba(245,166,35,0.07)",border:"1px solid rgba(245,166,35,0.2)",borderRadius:12,padding:14}}>
                <p style={{fontSize:12,color:"#AAA",margin:0,lineHeight:1.5}}>⚠ Aloka couldn't pull the full text from this source. Tap below to read it on the original site.</p>
              </div>
            </div>
          )}

          <div style={{paddingTop:20,borderTop:"1px solid #1A1A1A"}}>
            <p style={{fontSize:12,color:"#444",marginBottom:10}}>{fullText?"Continue reading on the original site:":"Read the complete original article:"}</p>
            <a href={article.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:14,background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:12,color:"#F5A623",fontSize:14,fontWeight:700,textDecoration:"none",fontFamily:"'Inter',sans-serif"}}>
              Open original source on {article.source} ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function AlokaApp() {
  const [activeCategory,setActiveCategory]=useState("All");
  const [articles,setArticles]=useState([]);
  const [cursor,setCursor]=useState(0);
  const [saved,setSaved]=useState(()=>dedupeArticles(LS.get("aloka_saved",[]).filter(a=>a&&a.headline&&a.url)));
  const [activeTab,setActiveTab]=useState("home");
  const [searchQuery,setSearchQuery]=useState("");
  const [loading,setLoading]=useState(true);
  const [isLive,setIsLive]=useState(false);
  const [toast,setToast]=useState(null);
  const [user,setUser]=useState(()=>LS.get("aloka_user",null));
  const [authModal,setAuthModal]=useState(null);
  const [enabledCategories,setEnabledCategories]=useState(()=>LS.get("aloka_cats",["Breaking","World","Tech","Business","Politics","Sport","Health","Science","Entertainment"]));
  const [displayPrefs,setDisplayPrefs]=useState(()=>LS.get("aloka_prefs",{showBiasLabels:true,paywallFreeOnly:true}));
  const [textSize,setTextSize]=useState(()=>LS.get("aloka_textsize","Medium"));
  const [readerArticle,setReaderArticle]=useState(null);
  const [showTutorial,setShowTutorial]=useState(()=>!LS.get("aloka_tutorialdone",false));
  const [fetchingMore,setFetchingMore]=useState(false);
  const cycleIndexRef=useRef(0);

  useEffect(()=>LS.set("aloka_saved",saved),[saved]);
  useEffect(()=>LS.set("aloka_cats",enabledCategories),[enabledCategories]);
  useEffect(()=>LS.set("aloka_prefs",displayPrefs),[displayPrefs]);
  useEffect(()=>LS.set("aloka_textsize",textSize),[textSize]);

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(null),2200);};

  const fetchBatch=useCallback(async(category,existingIds)=>{
    try {
      // Breaking: fetch general news across all categories, filter to last 2 hours
      const isBreaking = category === "Breaking";
      const cat = isBreaking ? null : (category==="All"?null:CATEGORY_MAP[category]);
      const apiUrl=`https://api.currentsapi.services/v1/latest-news?apiKey=${NEWS_API_KEY}&language=en${cat?`&category=${cat}`:""}`;
      const proxyUrl=`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
      const res=await fetch(proxyUrl,{signal:AbortSignal.timeout(10000)});
      const outer=await res.json();
      const data=JSON.parse(outer.contents);
      if(data.status==="ok"&&data.news?.length>0){
        let news = data.news.filter(a=>a.title&&a.title!=="[Removed]");
        if(isBreaking){
          const cutoff = Date.now() - BREAKING_WINDOW_MS;
          news = news.filter(a => a.published && new Date(a.published).getTime() > cutoff);
        }
        const formatted=news.map(a=>formatArticle(a, isBreaking?"Breaking":category==="All"?"World":category));
        const deduped=dedupeArticles(formatted,existingIds);
        if(deduped.length>0)return{items:deduped,live:true};
      }
    } catch(_){}
    // Breaking fallback: use All mock data filtered to simulate recency
    const mockCat = category==="Breaking"?"All":category;
    const mock=dedupeArticles((MOCK_DATA[mockCat]||MOCK_DATA["All"]).map(a=>({...a})),existingIds);
    return{items:mock,live:false};
  },[]);

  const loadNews=useCallback(async(category)=>{
    setLoading(true);setIsLive(false);setCursor(0);cycleIndexRef.current=0;
    const{items,live}=await fetchBatch(category,[]);
    setArticles(items);setIsLive(live);setLoading(false);
  },[fetchBatch]);

  useEffect(()=>{loadNews(activeCategory);},[activeCategory,loadNews]);

  // Infinite scroll — fetch more when cursor nears the end
  useEffect(()=>{
    if(loading||fetchingMore)return;
    if(articles.length-cursor>3)return;
    const rotation=["World","Tech","Business","Politics","Sport","Health","Science","Entertainment"]; // Breaking excluded from auto-rotation
    setFetchingMore(true);
    (async()=>{
      const existingIds=articles.map(a=>a.id);
      let newItems=[];
      let attempts=0;
      while(newItems.length===0&&attempts<3){
        const nextCat=rotation[cycleIndexRef.current%rotation.length];
        cycleIndexRef.current+=1;attempts+=1;
        const{items}=await fetchBatch(nextCat,[...existingIds,...newItems.map(a=>a.id)]);
        newItems=newItems.concat(items);
      }
      if(newItems.length>0) setArticles(prev=>[...prev,...dedupeArticles(newItems,prev.map(a=>a.id))]);
      setFetchingMore(false);
    })();
  },[cursor,articles,loading,fetchingMore,fetchBatch]);

  const handleSkip=()=>setCursor(prev=>prev+1);
  const handleRead=(article)=>setReaderArticle(article);
  const handleCloseReader=()=>setReaderArticle(null); // cursor untouched — same card on top
  const handleSave=(article)=>{setSaved(prev=>prev.find(a=>a.id===article.id)?prev:[...prev,article]);showToast("Saved 🔖");};
  const handleRemoveSaved=(id)=>{setSaved(prev=>prev.filter(a=>a.id!==id));showToast("Removed");};
  const handleAuth=(u)=>{setUser(u);setAuthModal(null);showToast(`Welcome, ${u.name}! ✓`);};
  const handleSignOut=()=>{LS.remove("aloka_user");setUser(null);showToast("Signed out");};
  const handleTutorialDone=()=>{LS.set("aloka_tutorialdone",true);setShowTutorial(false);};

  const allMock=Object.values(MOCK_DATA).flat();
  const searchResults=allMock.filter(a=>a.headline.toLowerCase().includes(searchQuery.toLowerCase())||a.category.toLowerCase().includes(searchQuery.toLowerCase())||a.source.toLowerCase().includes(searchQuery.toLowerCase()));
  const tsz=textSize==="Small"?13:textSize==="Large"?17:15;
  const visibleStack=articles.slice(cursor,cursor+3);

  return (
    <div style={{minHeight:"100vh",background:"#0D0D0D",fontFamily:"'Inter',-apple-system,sans-serif",color:"#fff",display:"flex",flexDirection:"column",maxWidth:420,margin:"0 auto",position:"relative",fontSize:tsz}}>

      {authModal&&<AuthModal mode={authModal} onClose={()=>setAuthModal(null)} onAuth={handleAuth}/>}
      {readerArticle&&<ReaderView article={readerArticle} onClose={handleCloseReader} onSave={handleSave}/>}
      {showTutorial&&!readerArticle&&<div style={{position:"fixed",inset:0,zIndex:550,maxWidth:420,margin:"0 auto"}}><SwipeTutorial onDone={handleTutorialDone}/></div>}
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"#F5A623",color:"#000",padding:"8px 20px",borderRadius:20,fontSize:13,fontWeight:700,zIndex:1000,boxShadow:"0 4px 20px rgba(245,166,35,0.4)",animation:"fadeIn 0.2s ease",whiteSpace:"nowrap"}}>{toast}</div>}

      {/* Header */}
      <div style={{padding:"52px 20px 16px",borderBottom:"1px solid #1A1A1A"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div>
            <div style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:"-0.02em",color:"#fff",lineHeight:1}}>Aloka</div>
            <div style={{fontSize:11,color:"#F5A623",letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:500,marginTop:3}}>News, clearly.</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:loading?"#F5A623":isLive?"#4CAF50":"#888",boxShadow:`0 0 6px ${loading?"#F5A623":isLive?"#4CAF50":"#888"}`,transition:"all 0.3s"}}/>
              <span style={{fontSize:11,color:"#555"}}>{loading?"Loading…":isLive?"Live":"Demo"}</span>
            </div>
            {user&&<span style={{fontSize:11,color:"#F5A623",fontWeight:600}}>👤 {user.name}</span>}
          </div>
        </div>
      </div>

      {/* HOME */}
      {activeTab==="home"&&<>
        <div style={{display:"flex",gap:8,padding:"14px 20px",overflowX:"auto",scrollbarWidth:"none",borderBottom:"1px solid #1A1A1A"}}>
          {CATEGORIES.map(cat=>{
            const isBreakingTab = cat === "Breaking";
            const isActive = activeCategory === cat;
            return (
              <button key={cat} onClick={()=>setActiveCategory(cat)} style={{
                flexShrink:0, padding:"6px 14px", borderRadius:20, border:"none",
                background: isActive ? (isBreakingTab ? "#FF3B30" : "#F5A623") : (isBreakingTab ? "rgba(255,59,48,0.15)" : "#1A1A1A"),
                color: isActive ? "#fff" : (isBreakingTab ? "#FF3B30" : "#666"),
                fontSize:12, fontWeight: isBreakingTab ? 700 : 600,
                cursor:"pointer", transition:"all 0.2s", fontFamily:"'Inter',sans-serif",
                display:"flex", alignItems:"center", gap:5,
              }}>
                {isBreakingTab && <span style={{width:6,height:6,borderRadius:"50%",background: isActive ? "#fff" : "#FF3B30",display:"inline-block",animation:"breakingPulse 1.2s ease-in-out infinite"}}/>}
                {cat}
              </button>
            );
          })}
        </div>
        <div style={{flex:1,padding:"16px 20px 110px"}}>
          <div style={{display:"flex",justifyContent:"space-between",padding:"0 8px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:15}}>←</span><span style={{fontSize:11,color:"#444"}}>Skip</span></div>
            <span style={{fontSize:11,color:"#333",letterSpacing:"0.06em",textTransform:"uppercase"}}>Swipe to navigate</span>
            <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:11,color:"#444"}}>Read</span><span style={{fontSize:15}}>→</span></div>
          </div>
          {loading?<div style={{position:"relative",height:520}}><SkeletonCard/></div>
          :visibleStack.length>0?<div style={{position:"relative",height:620}}>{visibleStack.map((article,i)=><NewsCard key={article.id} article={article} isTop={i===0} stackIndex={i} onSkip={handleSkip} onRead={handleRead} onSave={handleSave}/>)}</div>
          :<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:400,gap:16}}>
            <div style={{fontSize:48}}>⏳</div>
            <p style={{color:"#444",fontSize:15,fontWeight:600}}>Loading more stories…</p>
          </div>}
          {fetchingMore&&!loading&&<p style={{textAlign:"center",fontSize:11,color:"#333",marginTop:12}}>Fetching more stories…</p>}
        </div>
      </>}

      {/* SAVED */}
      {activeTab==="saved"&&<div style={{flex:1,padding:"20px 20px 100px",overflowY:"auto"}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:20,fontFamily:"'Playfair Display',Georgia,serif"}}>Saved stories</h2>
        {saved.length===0?<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:12}}><div style={{fontSize:40}}>🔖</div><p style={{color:"#444",fontSize:14,textAlign:"center"}}>Tap 🔖 on any card to save stories here.</p></div>
        :saved.map(article=>(
          <div key={article.id} style={{background:"#1A1A1A",borderRadius:14,overflow:"hidden",border:"1px solid #2A2A2A",marginBottom:12}}>
            {article.image&&<div style={{height:120,overflow:"hidden",background:"#111"}}><img src={article.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.display="none"}/></div>}
            <div style={{padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:10,fontWeight:700,color:"#F5A623",letterSpacing:"0.06em",textTransform:"uppercase"}}>{article.category}</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}><BiasTag bias={article.bias}/><button onClick={()=>handleRemoveSaved(article.id)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:16,padding:0}}>×</button></div>
              </div>
              <p style={{fontSize:15,fontWeight:700,lineHeight:1.35,color:"#fff",margin:"0 0 8px",fontFamily:"'Playfair Display',Georgia,serif"}}>{article.headline}</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <p style={{fontSize:12,color:"#555",margin:0}}>{article.source} · {article.time}</p>
                <button onClick={()=>setReaderArticle(article)} style={{fontSize:12,color:"#F5A623",background:"none",border:"none",cursor:"pointer",fontWeight:600,padding:0}}>Read →</button>
              </div>
            </div>
          </div>
        ))}
      </div>}

      {/* SEARCH */}
      {activeTab==="search"&&<div style={{flex:1,padding:"20px 20px 100px",overflowY:"auto"}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:16,fontFamily:"'Playfair Display',Georgia,serif"}}>Search</h2>
        <input type="text" placeholder="Search topics, sources..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{width:"100%",padding:"13px 16px",background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:12,color:"#fff",fontSize:14,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:20}}/>
        {searchQuery?<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {searchResults.length===0?<p style={{color:"#444",fontSize:14,textAlign:"center",marginTop:40}}>No stories found for "{searchQuery}"</p>
          :searchResults.map(a=>(
            <div key={a.id} style={{background:"#1A1A1A",borderRadius:14,overflow:"hidden",border:"1px solid #2A2A2A"}}>
              {a.image&&<div style={{height:100,overflow:"hidden",background:"#111"}}><img src={a.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.display="none"}/></div>}
              <div style={{padding:14}}>
                <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><span style={{fontSize:10,fontWeight:700,color:"#F5A623",textTransform:"uppercase",letterSpacing:"0.06em"}}>{a.category}</span><span style={{color:"#333"}}>·</span><span style={{fontSize:11,color:"#555"}}>{a.source}</span></div>
                <p style={{fontSize:15,fontWeight:700,lineHeight:1.35,color:"#fff",margin:"0 0 8px",fontFamily:"'Playfair Display',Georgia,serif"}}>{a.headline}</p>
                <button onClick={()=>setReaderArticle(a)} style={{fontSize:12,color:"#F5A623",background:"none",border:"none",cursor:"pointer",fontWeight:600,padding:0}}>Read →</button>
              </div>
            </div>
          ))}
        </div>:<div>
          <p style={{fontSize:12,color:"#444",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Browse by topic</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {CATEGORIES.filter(c=>c!=="All").map(cat=>(
              <button key={cat} onClick={()=>{setActiveCategory(cat);setActiveTab("home");}} style={{padding:"8px 16px",borderRadius:20,background:"#1A1A1A",border:"1px solid #2A2A2A",color:"#888",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>{cat}</button>
            ))}
          </div>
        </div>}
      </div>}

      {/* SETTINGS */}
      {activeTab==="settings"&&<div style={{flex:1,padding:"20px 20px 100px",overflowY:"auto"}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:6,fontFamily:"'Playfair Display',Georgia,serif"}}>Settings</h2>
        <p style={{fontSize:12,color:"#444",marginBottom:24}}>Preferences saved {user?"to your account":"locally on this device"}.</p>

        <div style={{marginBottom:28}}>
          <p style={{fontSize:11,fontWeight:700,color:"#F5A623",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Account</p>
          {user?(
            <div style={{background:"#1A1A1A",borderRadius:14,padding:20,border:"1px solid #222"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:"#F5A623",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#000",flexShrink:0}}>{user.name[0].toUpperCase()}</div>
                <div><p style={{fontSize:15,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{user.name}</p><p style={{fontSize:12,color:"#555",margin:0}}>{user.email}</p></div>
              </div>
              <button onClick={handleSignOut} style={{width:"100%",padding:12,background:"transparent",border:"1px solid #2A2A2A",borderRadius:12,color:"#666",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Sign out</button>
            </div>
          ):(
            <div style={{background:"#1A1A1A",borderRadius:14,padding:20,border:"1px solid #222"}}>
              <p style={{fontSize:15,fontWeight:700,color:"#fff",margin:"0 0 6px"}}>Sync across devices</p>
              <p style={{fontSize:13,color:"#555",margin:"0 0 16px",lineHeight:1.5}}>Create a free account to save your preferences and reading history everywhere.</p>
              <button onClick={()=>setAuthModal("signup")} style={{width:"100%",padding:13,background:"#F5A623",border:"none",borderRadius:12,color:"#000",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Create free account</button>
              <button onClick={()=>setAuthModal("signin")} style={{width:"100%",padding:13,background:"transparent",border:"1px solid #2A2A2A",borderRadius:12,color:"#666",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginTop:8}}>Sign in</button>
              <p style={{fontSize:11,color:"#333",textAlign:"center",margin:"12px 0 0"}}>No credit card. No ads. Always free.</p>
            </div>
          )}
        </div>

        <div style={{marginBottom:28}}>
          <p style={{fontSize:11,fontWeight:700,color:"#F5A623",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Feed Categories</p>
          {CATEGORIES.filter(c=>c!=="All").map(cat=>(
            <div key={cat} onClick={()=>setEnabledCategories(prev=>prev.includes(cat)?prev.filter(c=>c!==cat):[...prev,cat])} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:"#1A1A1A",borderRadius:12,cursor:"pointer",marginBottom:6,border:"1px solid #222"}}>
              <span style={{fontSize:14,fontWeight:600,color:enabledCategories.includes(cat)?"#fff":"#444"}}>{cat}</span>
              <div style={{width:44,height:26,borderRadius:13,background:enabledCategories.includes(cat)?"#F5A623":"#2A2A2A",position:"relative",transition:"background 0.25s",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left:enabledCategories.includes(cat)?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.25s",boxShadow:"0 1px 4px rgba(0,0,0,0.4)"}}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:28}}>
          <p style={{fontSize:11,fontWeight:700,color:"#F5A623",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Display</p>
          {[{key:"showBiasLabels",label:"Show bias labels",desc:"Display Left / Centre / Right tags on sources"},{key:"paywallFreeOnly",label:"Paywall-free only",desc:"Hide articles that may require a subscription"}].map(({key,label,desc})=>(
            <div key={key} onClick={()=>setDisplayPrefs(prev=>({...prev,[key]:!prev[key]}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:"#1A1A1A",borderRadius:12,cursor:"pointer",marginBottom:6,border:"1px solid #222"}}>
              <div><p style={{fontSize:14,fontWeight:600,color:"#fff",margin:"0 0 3px"}}>{label}</p><p style={{fontSize:12,color:"#555",margin:0}}>{desc}</p></div>
              <div style={{width:44,height:26,borderRadius:13,background:displayPrefs[key]?"#F5A623":"#2A2A2A",position:"relative",transition:"background 0.25s",flexShrink:0,marginLeft:12}}>
                <div style={{position:"absolute",top:3,left:displayPrefs[key]?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.25s",boxShadow:"0 1px 4px rgba(0,0,0,0.4)"}}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:28}}>
          <p style={{fontSize:11,fontWeight:700,color:"#F5A623",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Text Size</p>
          <div style={{display:"flex",gap:8}}>
            {["Small","Medium","Large"].map(size=>(
              <button key={size} onClick={()=>setTextSize(size)} style={{flex:1,padding:"12px 0",borderRadius:12,border:"none",background:textSize===size?"#F5A623":"#1A1A1A",color:textSize===size?"#000":"#666",fontSize:size==="Small"?12:size==="Medium"?14:16,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all 0.2s"}}>{size}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <p style={{fontSize:11,fontWeight:700,color:"#F5A623",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>About</p>
          <div style={{background:"#1A1A1A",borderRadius:14,padding:20,border:"1px solid #222"}}>
            {[["App","Aloka"],["Version","0.8.0 Beta"],["Tagline","News, clearly."],["Name origin","Sinhala — light"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,color:"#888"}}>{k}</span><span style={{fontSize:13,color:k==="Tagline"?"#F5A623":"#fff",fontWeight:600,fontStyle:k==="Tagline"?"italic":"normal"}}>{v}</span></div>
            ))}
          </div>
        </div>
        <p style={{fontSize:11,color:"#2A2A2A",textAlign:"center",marginTop:20}}>Aloka · Built with ❤️ for the love of news</p>
      </div>}

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"rgba(13,13,13,0.96)",backdropFilter:"blur(20px)",borderTop:"1px solid #1A1A1A",display:"flex",justifyContent:"space-around",padding:"12px 0 24px",zIndex:100}}>
        {[{tab:"home",icon:"⚡",label:"Feed"},{tab:"search",icon:"⌕",label:"Search"},{tab:"saved",icon:"🔖",label:`Saved${saved.length?` (${saved.length})`:""}`},{tab:"settings",icon:"⚙️",label:"Settings"}].map(({tab,icon,label})=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:"4px 14px",color:activeTab===tab?"#F5A623":"#444",transition:"color 0.2s",fontFamily:"'Inter',sans-serif"}}>
            <span style={{fontSize:20,lineHeight:1}}>{icon}</span>
            <span style={{fontSize:10,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeIn { from{opacity:0;transform:translateX(-50%) translateY(-8px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:0.3}50%{opacity:0.7} }
        @keyframes breakingPulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)} }
      `}</style>
    </div>
  );
}
