import { useState, useEffect, useRef, useCallback } from "react";

const LS = {
  get: (key, fb) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  remove: (key) => { try { localStorage.removeItem(key); } catch {} },
};

const NEWS_API_KEY = "63yp_VLo0Fu-wEDdVOJvMpY4-KkMYHHnUjGrDUbfwoUgivXo";
const CATEGORIES = ["All","World","Tech","Business","Politics","Sport","Health","Science","Entertainment"];
const CATEGORY_MAP = { "World":"general","Tech":"science_technology","Business":"economy_business_finance","Politics":"politics_government","Sport":"sport","Health":"health","Science":"science_technology","Entertainment":"arts_culture_entertainment" };
const BIAS_COLORS = { "Centre":"#F5A623","Centre-Left":"#6B9FD4","Centre-Right":"#D47B6B","Left":"#4A7FB5","Right":"#B54A4A" };
const SOURCE_BIAS = { "BBC News":"Centre","Reuters":"Centre","Associated Press":"Centre","The Guardian":"Centre-Left","CNN":"Centre-Left","MSNBC":"Left","Fox News":"Right","The New York Times":"Centre-Left","The Washington Post":"Centre-Left","The Wall Street Journal":"Centre-Right","NPR":"Centre-Left","Al Jazeera":"Centre","The Economist":"Centre","Financial Times":"Centre","Sky News":"Centre","NBC News":"Centre-Left","ABC News":"Centre","CBS News":"Centre" };

const MOCK_DATA = {
  All: [
    { id:1, category:"World", source:"Reuters", bias:"Centre", time:"3m ago", headline:"G7 leaders agree on new framework to tackle AI governance globally", description:"World leaders at the G7 summit reached a landmark agreement on artificial intelligence governance, setting the first international standards for AI safety and transparency.", url:"#" },
    { id:2, category:"Tech", source:"The Verge", bias:"Centre-Left", time:"11m ago", headline:"Apple unveils new spatial computing headset with 40-hour battery life", description:"Apple's next-generation Vision Pro successor promises a dramatic leap in battery life and a slimmer form factor, targeting mainstream consumers rather than enterprise users.", url:"#" },
    { id:3, category:"Business", source:"Financial Times", bias:"Centre", time:"28m ago", headline:"Global markets rally as US Federal Reserve signals pause in rate hikes", description:"Stock markets surged worldwide after Federal Reserve minutes revealed policymakers are leaning toward holding interest rates steady.", url:"#" },
    { id:4, category:"Politics", source:"BBC News", bias:"Centre", time:"45m ago", headline:"European Parliament passes landmark digital identity legislation", description:"The EU's new digital identity framework gives all 450 million citizens a unified digital wallet for government services, banking, and healthcare.", url:"#" },
    { id:5, category:"Health", source:"The Guardian", bias:"Centre-Left", time:"1h ago", headline:"New study links ultra-processed food consumption to accelerated brain aging", description:"A major longitudinal study tracking 30,000 adults over 15 years found those consuming the most ultra-processed foods showed cognitive decline 3.6 years faster.", url:"#" },
    { id:6, category:"Science", source:"Nature", bias:"Centre", time:"2h ago", headline:"Scientists detect possible signs of ancient microbial life in Mars rock samples", description:"NASA researchers analyzing samples returned by the Perseverance rover found organic compounds consistent with ancient biological activity roughly 3.5 billion years ago.", url:"#" },
    { id:7, category:"Sport", source:"ESPN", bias:"Centre", time:"2h ago", headline:"FIFA confirms 2030 World Cup will span three continents for centenary celebration", description:"Football's governing body confirmed the 2030 World Cup will be hosted across Spain, Portugal, Morocco, Argentina, Uruguay, and Paraguay.", url:"#" },
    { id:8, category:"Entertainment", source:"Variety", bias:"Centre-Left", time:"3h ago", headline:"Netflix's most-watched original film breaks 200 million views in record time", description:"The streaming giant's latest thriller surpassed 200 million views in just 18 days, shattering the platform's previous record.", url:"#" },
  ],
  World: [
    { id:101, category:"World", source:"Reuters", bias:"Centre", time:"5m ago", headline:"United Nations Security Council votes on emergency ceasefire resolution", description:"The UN Security Council convened an emergency session with diplomatic tensions running high among permanent members.", url:"#" },
    { id:102, category:"World", source:"Al Jazeera", bias:"Centre", time:"22m ago", headline:"Pacific Island nations declare climate emergency, demand immediate action", description:"A coalition of twelve Pacific Island nations formally declared a climate emergency at the UN, warning several low-lying nations face uninhabitability within 30 years.", url:"#" },
    { id:103, category:"World", source:"BBC News", bias:"Centre", time:"1h ago", headline:"China and India agree to resume high-level diplomatic talks after border standoff", description:"Following months of tensions along disputed Himalayan borders, both nations announced a renewed diplomatic channel.", url:"#" },
    { id:104, category:"World", source:"Associated Press", bias:"Centre", time:"2h ago", headline:"Global refugee numbers reach record 120 million for third consecutive year", description:"The UNHCR's annual report confirmed forced displacement has hit a historic high for the third year running.", url:"#" },
  ],
  Tech: [
    { id:201, category:"Tech", source:"The Verge", bias:"Centre-Left", time:"8m ago", headline:"OpenAI releases GPT-5 with real-time reasoning and 1M token context window", description:"OpenAI's flagship model launch sets a new benchmark in AI capability with native multimodal reasoning.", url:"#" },
    { id:202, category:"Tech", source:"Wired", bias:"Centre-Left", time:"31m ago", headline:"Google's quantum computer solves problem that would take classical machines 47 years", description:"Google DeepMind announced a quantum computing breakthrough demonstrating practical quantum advantage.", url:"#" },
    { id:203, category:"Tech", source:"TechCrunch", bias:"Centre", time:"55m ago", headline:"Startup raises $400M to build the world's first fully autonomous AI software engineer", description:"The San Francisco-based startup claims its AI can independently build, test, and deploy production-grade software.", url:"#" },
    { id:204, category:"Tech", source:"MIT Technology Review", bias:"Centre", time:"3h ago", headline:"New battery chemistry achieves 1,000 charge cycles with zero capacity loss", description:"Researchers at Stanford developed a lithium-metal battery variant that maintains full capacity across a thousand charge cycles.", url:"#" },
  ],
  Business: [
    { id:301, category:"Business", source:"Financial Times", bias:"Centre", time:"12m ago", headline:"Amazon acquires logistics startup in $4.2B deal to compete with FedEx", description:"Amazon's latest acquisition signals an aggressive push to build end-to-end logistics independence.", url:"#" },
    { id:302, category:"Business", source:"The Wall Street Journal", bias:"Centre-Right", time:"40m ago", headline:"OPEC+ agrees surprise output cut sending oil prices above $90 per barrel", description:"The oil producer cartel's unexpected decision to reduce output by 1.5 million barrels per day pushed crude prices sharply higher.", url:"#" },
    { id:303, category:"Business", source:"Bloomberg", bias:"Centre", time:"1h ago", headline:"Tesla's energy division now generates more revenue than its auto business", description:"For the first time in company history, Tesla's energy storage and solar division outpaced vehicle sales in quarterly revenue.", url:"#" },
  ],
  Politics: [
    { id:401, category:"Politics", source:"BBC News", bias:"Centre", time:"15m ago", headline:"UK Prime Minister announces snap general election for September", description:"In a surprise announcement from Downing Street, the Prime Minister called a general election two years ahead of schedule.", url:"#" },
    { id:402, category:"Politics", source:"NPR", bias:"Centre-Left", time:"1h ago", headline:"US Senate passes bipartisan infrastructure bill with $1.2 trillion in spending", description:"The rare show of bipartisan cooperation delivers the largest infrastructure investment in American history.", url:"#" },
    { id:403, category:"Politics", source:"The Economist", bias:"Centre", time:"3h ago", headline:"France's ruling coalition collapses ahead of budget vote", description:"The French government faces a constitutional crisis after coalition partners withdrew support over austerity measures.", url:"#" },
  ],
  Sport: [
    { id:501, category:"Sport", source:"ESPN", bias:"Centre", time:"20m ago", headline:"Lionel Messi announces retirement from international football at 38", description:"The eight-time Ballon d'Or winner confirmed he will not participate in the next World Cup qualifying campaign.", url:"#" },
    { id:502, category:"Sport", source:"Sky Sports", bias:"Centre", time:"45m ago", headline:"Formula 1 confirms Las Vegas Grand Prix extended to 10-year deal", description:"The sport's fastest-growing race on the calendar has secured a long-term future with major infrastructure upgrades planned.", url:"#" },
    { id:503, category:"Sport", source:"BBC Sport", bias:"Centre", time:"2h ago", headline:"New Zealand All Blacks reclaim World Rugby number one ranking", description:"After a dominant series victory against the British & Irish Lions, the All Blacks returned to the top of world rugby rankings.", url:"#" },
  ],
  Health: [
    { id:601, category:"Health", source:"The Guardian", bias:"Centre-Left", time:"18m ago", headline:"WHO approves world's first malaria vaccine for widespread use in children", description:"The World Health Organization granted full approval to a second-generation malaria vaccine showing 77% efficacy in clinical trials.", url:"#" },
    { id:602, category:"Health", source:"Reuters", bias:"Centre", time:"50m ago", headline:"Ozempic found to reduce cardiovascular disease risk by 20% in landmark trial", description:"A major clinical trial confirmed that semaglutide drugs reduce the risk of heart attack and stroke significantly.", url:"#" },
    { id:603, category:"Health", source:"BBC News", bias:"Centre", time:"2h ago", headline:"Global life expectancy hits 74 years for first time despite pandemic setback", description:"WHO data shows humanity has recovered the life expectancy gains lost during COVID-19.", url:"#" },
  ],
  Science: [
    { id:701, category:"Science", source:"Nature", bias:"Centre", time:"35m ago", headline:"First complete map of a human brain's neural connections published", description:"An international team published the first full connectome of a cubic millimetre of human brain tissue, mapping 57,000 cells.", url:"#" },
    { id:702, category:"Science", source:"Science", bias:"Centre", time:"1h ago", headline:"CRISPR gene editing reverses inherited blindness in first human trial", description:"Researchers restored functional vision in three patients with a rare inherited retinal disease using in-vivo CRISPR.", url:"#" },
    { id:703, category:"Science", source:"MIT Technology Review", bias:"Centre", time:"4h ago", headline:"New material absorbs 99.9% of sunlight and converts it to electricity", description:"Scientists developed a perovskite-silicon tandem solar cell achieving 47% energy conversion efficiency in lab conditions.", url:"#" },
  ],
  Entertainment: [
    { id:801, category:"Entertainment", source:"Variety", bias:"Centre-Left", time:"10m ago", headline:"Beyoncé's Renaissance film breaks all-time opening weekend record for a concert film", description:"The visual companion to her critically acclaimed album shattered box office records earning $92M globally.", url:"#" },
    { id:802, category:"Entertainment", source:"The Hollywood Reporter", bias:"Centre", time:"55m ago", headline:"Succession creator announces new HBO series set in Silicon Valley", description:"Jesse Armstrong returns with a new limited series examining power and dysfunction inside a fictional AI company.", url:"#" },
    { id:803, category:"Entertainment", source:"BBC Culture", bias:"Centre", time:"3h ago", headline:"The Booker Prize awarded to debut Nigerian novelist in historic first", description:"The 2026 Booker Prize was awarded to a debut novelist from Lagos, the youngest winner in the prize's 57-year history.", url:"#" },
  ],
};

function getBias(n) { if(!n) return "Centre"; for(const [k,v] of Object.entries(SOURCE_BIAS)){ if(n.toLowerCase().includes(k.toLowerCase())) return v; } return "Centre"; }
function timeAgo(d) { if(!d) return "Recently"; const diff=Math.floor((Date.now()-new Date(d))/1000); if(diff<60) return `${diff}s ago`; if(diff<3600) return `${Math.floor(diff/60)}m ago`; if(diff<86400) return `${Math.floor(diff/3600)}h ago`; return `${Math.floor(diff/86400)}d ago`; }
function formatArticle(raw, cat) { return { id:raw.id||Math.random().toString(), category:cat, source:raw.author||raw.source||"Unknown", bias:getBias(raw.author||raw.source), time:raw.published?timeAgo(raw.published):"Recently", headline:raw.title||"No headline", description:raw.description||"", url:raw.url||"#", image:raw.image||null, aiSummary:null, aiLoading:false }; }

// Call our Vercel serverless proxy instead of Anthropic directly
async function generateAISummary(headline, description) {
  try {
    const res = await fetch("/api/summarise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline, description }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch { return null; }
}

// ── Auth Modal ─────────────────────────────────────────────────────────────
function AuthModal({ mode, onClose, onAuth }) {
  const [view, setView] = useState(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inp = { width:"100%", padding:"13px 16px", background:"#111", border:"1px solid #2A2A2A", borderRadius:12, color:"#fff", fontSize:14, fontFamily:"'Inter',sans-serif", outline:"none", boxSizing:"border-box", marginBottom:10 };
  const lbl = { fontSize:11, fontWeight:700, color:"#555", letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:6 };
  const handleSubmit = async () => {
    setError("");
    if(!email||!password){setError("Please fill in all fields.");return;}
    if(view==="signup"&&!name){setError("Please enter your name.");return;}
    if(password.length<6){setError("Password must be at least 6 characters.");return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,900));
    const user={name:view==="signup"?name:email.split("@")[0], email, joinedAt:new Date().toISOString()};
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
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:14,background:loading?"#7A5200":"#F5A623",border:"none",borderRadius:12,color:"#000",fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",fontFamily:"'Inter',sans-serif",marginTop:6,transition:"background 0.2s"}}>
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

// ── First launch swipe tutorial overlay ───────────────────────────────────
function SwipeTutorial({ onDone }) {
  return (
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.96)",zIndex:50,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{fontSize:40,marginBottom:16}}>👋</div>
      <p style={{fontSize:17,fontWeight:700,color:"#fff",textAlign:"center",marginBottom:24,fontFamily:"'Playfair Display',Georgia,serif"}}>Welcome to Aloka</p>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:28,width:"100%",maxWidth:340}}>
        <div style={{display:"flex",alignItems:"center",gap:14,background:"#1A1A1A",borderRadius:14,padding:"14px 16px"}}>
          <span style={{fontSize:24}}>👈</span>
          <div><p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>Swipe left to skip</p><p style={{fontSize:12,color:"#555",margin:0}}>Not interested? Move on.</p></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,background:"#1A1A1A",borderRadius:14,padding:"14px 16px"}}>
          <span style={{fontSize:24}}>👉</span>
          <div><p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>Swipe right to read</p><p style={{fontSize:12,color:"#555",margin:0}}>Opens it inside Aloka.</p></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,background:"#1A1A1A",borderRadius:14,padding:"14px 16px"}}>
          <span style={{fontSize:24}}>🔖</span>
          <div><p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>Tap Save to bookmark</p><p style={{fontSize:12,color:"#555",margin:0}}>Find it later in your Saved tab.</p></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,background:"#1A1A1A",borderRadius:14,padding:"14px 16px"}}>
          <span style={{fontSize:24}}>✨</span>
          <div><p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>Tap AI Analysis</p><p style={{fontSize:12,color:"#555",margin:0}}>Get instant AI summaries.</p></div>
        </div>
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
    <div style={{position:"absolute",top:0,left:0,right:0,background:"#1A1A1A",borderRadius:20,padding:24,border:"1px solid #2A2A2A",zIndex:10}}>
      {[80,40,100,65,90,55,75].map((w,i)=>(
        <div key={i} style={{height:i===2?22:12,width:`${w}%`,background:"#252525",borderRadius:6,marginBottom:14,animation:"pulse 1.5s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>
      ))}
    </div>
  );
}

// ── AI Summary section ─────────────────────────────────────────────────────
function AISummarySection({article, onGenerate}) {
  const [open, setOpen] = useState(false);
  const handleToggle = () => { if(!open&&!article.aiSummary&&!article.aiLoading) onGenerate(article.id); setOpen(!open); };
  return (
    <div onClick={handleToggle} style={{background:"rgba(245,166,35,0.07)",border:"1px solid rgba(245,166,35,0.2)",borderRadius:12,padding:"12px 14px",cursor:"pointer",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:15}}>✨</span>
          <span style={{fontSize:11,fontWeight:700,color:"#F5A623",letterSpacing:"0.07em",textTransform:"uppercase"}}>{article.aiLoading?"Generating…":article.aiSummary?"AI Analysis":"Tap for AI Analysis"}</span>
        </div>
        <span style={{color:"#F5A623",fontSize:14,display:"inline-block",transform:open?"rotate(45deg)":"none",transition:"transform 0.2s"}}>+</span>
      </div>
      {open&&(
        <div style={{marginTop:12}}>
          {article.aiLoading?(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[90,70,85].map((w,i)=><div key={i} style={{height:10,width:`${w}%`,background:"rgba(245,166,35,0.15)",borderRadius:5,animation:"pulse 1.2s ease-in-out infinite",animationDelay:`${i*0.15}s`}}/>)}
            </div>
          ):article.aiSummary?(
            <div>
              <div style={{marginBottom:12}}>
                {article.aiSummary.bullets.map((pt,i)=>(
                  <div key={i} style={{display:"flex",gap:9,marginBottom:8,alignItems:"flex-start"}}>
                    <span style={{width:17,height:17,borderRadius:"50%",background:"#F5A623",color:"#000",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</span>
                    <p style={{fontSize:13,lineHeight:1.55,color:"#CCC",margin:0,fontFamily:"'Inter',sans-serif"}}>{pt}</p>
                  </div>
                ))}
              </div>
              <div style={{borderTop:"1px solid rgba(245,166,35,0.15)",paddingTop:10}}>
                <p style={{fontSize:10,fontWeight:700,color:"#F5A623",letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 5px"}}>Why it matters</p>
                <p style={{fontSize:13,color:"#AAA",margin:0,lineHeight:1.55,fontFamily:"'Inter',sans-serif",fontStyle:"italic"}}>{article.aiSummary.why}</p>
              </div>
            </div>
          ):<p style={{fontSize:12,color:"#666",margin:0,fontFamily:"'Inter',sans-serif"}}>Couldn't generate summary. Try again.</p>}
        </div>
      )}
    </div>
  );
}

// ── News Card ──────────────────────────────────────────────────────────────
function NewsCard({article, onSkip, onRead, onSave, isTop, stackIndex, onGenerateAI}) {
  const startX=useRef(null), currentX=useRef(0);
  const [dragging,setDragging]=useState(false);
  const [offset,setOffset]=useState(0);

  const handleStart=(x)=>{if(!isTop)return;startX.current=x;setDragging(true);};
  const handleMove=(x)=>{if(!dragging||!isTop)return;const d=x-startX.current;currentX.current=d;setOffset(d);};
  const handleEnd=()=>{
    if(!dragging||!isTop)return;
    setDragging(false);
    if(Math.abs(currentX.current)>100){
      if(currentX.current>0) onRead(article);
      else onSkip(article);
    } else setOffset(0);
    currentX.current=0;
  };

  const rotation=isTop?offset*0.07:0;
  const swipeDir=offset>60?"read":offset<-60?"skip":null;
  const stackStyles={
    0:{transform:`translateX(${offset}px) rotate(${rotation}deg)`,zIndex:10,opacity:Math.max(0.3,1-Math.abs(offset)/300)},
    1:{transform:"translateY(10px) scale(0.97)",zIndex:9,opacity:0.85},
    2:{transform:"translateY(20px) scale(0.94)",zIndex:8,opacity:0.6}
  };

  return (
    <div onMouseDown={e=>handleStart(e.clientX)} onMouseMove={e=>handleMove(e.clientX)} onMouseUp={handleEnd} onMouseLeave={handleEnd}
      onTouchStart={e=>handleStart(e.touches[0].clientX)} onTouchMove={e=>{e.preventDefault();handleMove(e.touches[0].clientX);}} onTouchEnd={handleEnd}
      style={{position:"absolute",top:0,left:0,right:0,background:"#1A1A1A",borderRadius:20,padding:24,cursor:isTop?"grab":"default",userSelect:"none",transition:dragging?"none":"transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease",border:"1px solid #2A2A2A",boxShadow:isTop?"0 20px 60px rgba(0,0,0,0.6)":"none",overflowY:isTop?"auto":"hidden",maxHeight:580,...(stackStyles[stackIndex]||{display:"none"})}}>

      {/* Swipe indicators */}
      {isTop&&swipeDir==="read"&&(
        <div style={{position:"absolute",top:20,left:20,background:"#F5A623",color:"#000",padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:700,opacity:Math.min(1,(offset-60)/60),zIndex:20}}>READ →</div>
      )}
      {isTop&&swipeDir==="skip"&&(
        <div style={{position:"absolute",top:20,right:20,background:"#2A2A2A",color:"#888",padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:700,opacity:Math.min(1,(-offset-60)/60),zIndex:20}}>← SKIP</div>
      )}

      {/* Meta */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:12,fontWeight:700,color:"#fff"}}>{article.source}</span><BiasTag bias={article.bias}/></div>
        <span style={{fontSize:11,color:"#555"}}>{article.time}</span>
      </div>

      {/* Category */}
      <div style={{marginBottom:10}}><span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#F5A623",textTransform:"uppercase",background:"rgba(245,166,35,0.1)",padding:"3px 8px",borderRadius:4}}>{article.category}</span></div>

      {/* Headline */}
      <h2 style={{fontSize:20,fontWeight:700,lineHeight:1.3,color:"#fff",margin:"0 0 14px",fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:"-0.01em"}}>{article.headline}</h2>

      {/* Description */}
      {article.description&&<p style={{fontSize:14,lineHeight:1.6,color:"#888",margin:"0 0 16px",fontFamily:"'Inter',sans-serif"}}>{article.description}</p>}

      {/* AI Summary */}
      <AISummarySection article={article} onGenerate={onGenerateAI}/>

      {/* Actions */}
      {isTop&&(
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onSkip(article)} style={{flex:1,padding:11,background:"#111",border:"1px solid #2A2A2A",borderRadius:12,color:"#666",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Skip</button>
          <button onClick={()=>onRead(article)} style={{flex:2,padding:11,background:"#F5A623",border:"none",borderRadius:12,color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Read →</button>
          <button onClick={()=>onSave(article)} style={{flex:1,padding:11,background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:12,color:"#CCC",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>🔖</button>
        </div>
      )}
    </div>
  );
}

// ── In-App Reader ──────────────────────────────────────────────────────────
function ReaderView({article, onClose, onGenerateAI, onSave}) {
  if(!article) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#0D0D0D",zIndex:600,display:"flex",flexDirection:"column",maxWidth:420,margin:"0 auto"}}>
      {/* Reader header */}
      <div style={{padding:"52px 20px 16px",borderBottom:"1px solid #1A1A1A",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={onClose} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:"50%",width:36,height:36,color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        <span style={{fontSize:11,color:"#F5A623",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>Aloka Reader</span>
        <button onClick={()=>onSave(article)} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:"50%",width:36,height:36,color:"#fff",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>🔖</button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"24px 20px 60px"}}>
        {/* Meta */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{article.source}</span><BiasTag bias={article.bias}/></div>
          <span style={{fontSize:12,color:"#555"}}>{article.time}</span>
        </div>

        <div style={{marginBottom:14}}><span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#F5A623",textTransform:"uppercase",background:"rgba(245,166,35,0.1)",padding:"3px 8px",borderRadius:4}}>{article.category}</span></div>

        {/* Headline */}
        <h1 style={{fontSize:26,fontWeight:800,lineHeight:1.3,color:"#fff",margin:"0 0 20px",fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:"-0.01em"}}>{article.headline}</h1>

        {/* Image */}
        {article.image&&<div style={{borderRadius:14,overflow:"hidden",marginBottom:20,background:"#111"}}><img src={article.image} alt="" style={{width:"100%",display:"block"}} onError={e=>{e.target.parentElement.style.display="none";}}/></div>}

        {/* Description / body */}
        {article.description&&<p style={{fontSize:16,lineHeight:1.75,color:"#CCC",margin:"0 0 24px",fontFamily:"'Inter',sans-serif"}}>{article.description}</p>}

        {/* AI Summary inline */}
        <AISummarySection article={article} onGenerate={onGenerateAI}/>

        {/* Source link */}
        <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid #1A1A1A"}}>
          <p style={{fontSize:12,color:"#444",marginBottom:10}}>This is a summary. For the complete, original reporting:</p>
          <a href={article.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:14,background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:12,color:"#F5A623",fontSize:14,fontWeight:700,textDecoration:"none",fontFamily:"'Inter',sans-serif"}}>
            Open original source on {article.source} ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function AlokaApp() {
  const [activeCategory,setActiveCategory]=useState("All");
  const [articles,setArticles]=useState([]);
  const [saved,setSaved]=useState(()=>LS.get("aloka_saved",[]));
  const [activeTab,setActiveTab]=useState("home");
  const [searchQuery,setSearchQuery]=useState("");
  const [loading,setLoading]=useState(true);
  const [isLive,setIsLive]=useState(false);
  const [toast,setToast]=useState(null);
  const [user,setUser]=useState(()=>LS.get("aloka_user",null));
  const [authModal,setAuthModal]=useState(null);
  const [enabledCategories,setEnabledCategories]=useState(()=>LS.get("aloka_cats",["World","Tech","Business","Politics","Sport","Health","Science","Entertainment"]));
  const [displayPrefs,setDisplayPrefs]=useState(()=>LS.get("aloka_prefs",{showBiasLabels:true,showWhyItMatters:true,paywallFreeOnly:true}));
  const [textSize,setTextSize]=useState(()=>LS.get("aloka_textsize","Medium"));
  const [readerArticle,setReaderArticle]=useState(null);
  const [showTutorial,setShowTutorial]=useState(()=>!LS.get("aloka_tutorialdone",false));

  useEffect(()=>LS.set("aloka_saved",saved),[saved]);
  useEffect(()=>LS.set("aloka_cats",enabledCategories),[enabledCategories]);
  useEffect(()=>LS.set("aloka_prefs",displayPrefs),[displayPrefs]);
  useEffect(()=>LS.set("aloka_textsize",textSize),[textSize]);

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(null),2200);};

  const loadNews=useCallback(async(category)=>{
    setLoading(true);setIsLive(false);
    try {
      const cat=category==="All"?null:CATEGORY_MAP[category];
      const apiUrl=`https://api.currentsapi.services/v1/latest-news?apiKey=${NEWS_API_KEY}&language=en${cat?`&category=${cat}`:""}`;
      const proxyUrl=`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
      const res=await fetch(proxyUrl,{signal:AbortSignal.timeout(8000)});
      const outer=await res.json();
      const data=JSON.parse(outer.contents);
      if(data.status==="ok"&&data.news?.length>0){
        const formatted=data.news.filter(a=>a.title&&a.title!=="[Removed]").map(a=>formatArticle(a,category==="All"?"World":category));
        setArticles(formatted);setIsLive(true);setLoading(false);return;
      }
    } catch(_){}
    const mock=(MOCK_DATA[category]||MOCK_DATA["All"]).map(a=>({...a,aiSummary:null,aiLoading:false}));
    setArticles(mock);setIsLive(false);setLoading(false);
  },[]);

  useEffect(()=>{loadNews(activeCategory);},[activeCategory,loadNews]);

  const handleGenerateAI=useCallback(async(articleId)=>{
    setArticles(prev=>prev.map(a=>a.id===articleId?{...a,aiLoading:true}:a));
    const article=articles.find(a=>a.id===articleId);
    if(!article)return;
    const result=await generateAISummary(article.headline,article.description);
    setArticles(prev=>prev.map(a=>a.id===articleId?{...a,aiLoading:false,aiSummary:result}:a));
  },[articles]);

  const handleSkip=(article)=>{setArticles(prev=>prev.filter(a=>a.id!==article.id));showToast("Skipped");};
  const handleRead=(article)=>{setReaderArticle(article);};
  const handleCloseReader=()=>{
    if(readerArticle) setArticles(prev=>prev.filter(a=>a.id!==readerArticle.id));
    setReaderArticle(null);
  };
  const handleSave=(article)=>{setSaved(prev=>prev.find(a=>a.id===article.id)?prev:[...prev,article]);showToast("Saved 🔖");};
  const handleRemoveSaved=(id)=>{setSaved(prev=>prev.filter(a=>a.id!==id));showToast("Removed");};
  const handleAuth=(u)=>{setUser(u);setAuthModal(null);showToast(`Welcome, ${u.name}! ✓`);};
  const handleSignOut=()=>{LS.remove("aloka_user");setUser(null);showToast("Signed out");};
  const handleTutorialDone=()=>{LS.set("aloka_tutorialdone",true);setShowTutorial(false);};

  const allArticles=Object.values(MOCK_DATA).flat();
  const searchResults=allArticles.filter(a=>a.headline.toLowerCase().includes(searchQuery.toLowerCase())||a.category.toLowerCase().includes(searchQuery.toLowerCase())||a.source.toLowerCase().includes(searchQuery.toLowerCase()));
  const tsz=textSize==="Small"?13:textSize==="Large"?17:15;

  return (
    <div style={{minHeight:"100vh",background:"#0D0D0D",fontFamily:"'Inter',-apple-system,sans-serif",color:"#fff",display:"flex",flexDirection:"column",maxWidth:420,margin:"0 auto",position:"relative",fontSize:tsz}}>

      {authModal&&<AuthModal mode={authModal} onClose={()=>setAuthModal(null)} onAuth={handleAuth}/>}
      {readerArticle&&<ReaderView article={readerArticle} onClose={handleCloseReader} onGenerateAI={handleGenerateAI} onSave={handleSave}/>}
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
          {CATEGORIES.map(cat=>(
            <button key={cat} onClick={()=>setActiveCategory(cat)} style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:"none",background:activeCategory===cat?"#F5A623":"#1A1A1A",color:activeCategory===cat?"#000":"#666",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Inter',sans-serif"}}>{cat}</button>
          ))}
        </div>
        <div style={{flex:1,padding:"20px 20px 110px"}}>
          {/* Swipe hint bar */}
          <div style={{display:"flex",justifyContent:"space-between",padding:"0 8px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:15}}>←</span><span style={{fontSize:11,color:"#444"}}>Skip</span></div>
            <span style={{fontSize:11,color:"#333",letterSpacing:"0.06em",textTransform:"uppercase"}}>Swipe to navigate</span>
            <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:11,color:"#444"}}>Read</span><span style={{fontSize:15}}>→</span></div>
          </div>
          {loading?<div style={{position:"relative",height:500}}><SkeletonCard/></div>
          :articles.length>0?<div style={{position:"relative",height:600}}>{articles.slice(0,3).map((article,i)=><NewsCard key={article.id} article={article} isTop={i===0} stackIndex={i} onSkip={handleSkip} onRead={handleRead} onSave={handleSave} onGenerateAI={handleGenerateAI}/>)}</div>
          :<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:400,gap:16}}>
            <div style={{fontSize:48}}>☀️</div>
            <p style={{color:"#444",fontSize:15,fontWeight:600}}>You're all caught up.</p>
            <button onClick={()=>loadNews(activeCategory)} style={{padding:"12px 24px",background:"#F5A623",border:"none",borderRadius:12,color:"#000",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Refresh feed</button>
          </div>}
          {!loading&&articles.length>0&&<div style={{textAlign:"center",marginTop:12,fontSize:12,color:"#333"}}>{articles.length} {articles.length===1?"story":"stories"} remaining</div>}
        </div>
      </>}

      {/* SAVED */}
      {activeTab==="saved"&&<div style={{flex:1,padding:"20px 20px 100px",overflowY:"auto"}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:20,fontFamily:"'Playfair Display',Georgia,serif"}}>Saved stories</h2>
        {saved.length===0?<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:12}}><div style={{fontSize:40}}>🔖</div><p style={{color:"#444",fontSize:14,textAlign:"center"}}>Tap 🔖 on any card to save stories here.</p></div>
        :saved.map(article=>(
          <div key={article.id} style={{background:"#1A1A1A",borderRadius:14,padding:16,border:"1px solid #2A2A2A",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,color:"#F5A623",letterSpacing:"0.06em",textTransform:"uppercase"}}>{article.category}</span>
              <div style={{display:"flex",alignItems:"center",gap:10}}><BiasTag bias={article.bias}/><button onClick={()=>handleRemoveSaved(article.id)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:16,padding:0}}>×</button></div>
            </div>
            <p style={{fontSize:15,fontWeight:700,lineHeight:1.35,color:"#fff",margin:"0 0 8px",fontFamily:"'Playfair Display',Georgia,serif"}}>{article.headline}</p>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={{fontSize:12,color:"#555",margin:0}}>{article.source} · {article.time}</p>
              <a href={article.url} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#F5A623",textDecoration:"none",fontWeight:600}}>Read →</a>
            </div>
            {article.aiSummary&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #2A2A2A"}}><p style={{fontSize:10,color:"#F5A623",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",margin:"0 0 4px"}}>✨ Why it matters</p><p style={{fontSize:12,color:"#888",margin:0,fontStyle:"italic",lineHeight:1.5}}>{article.aiSummary.why}</p></div>}
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
            <div key={a.id} style={{background:"#1A1A1A",borderRadius:14,padding:16,border:"1px solid #2A2A2A"}}>
              <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><span style={{fontSize:10,fontWeight:700,color:"#F5A623",textTransform:"uppercase",letterSpacing:"0.06em"}}>{a.category}</span><span style={{color:"#333"}}>·</span><span style={{fontSize:11,color:"#555"}}>{a.source}</span></div>
              <p style={{fontSize:15,fontWeight:700,lineHeight:1.35,color:"#fff",margin:"0 0 8px",fontFamily:"'Playfair Display',Georgia,serif"}}>{a.headline}</p>
              <a href={a.url} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#F5A623",textDecoration:"none",fontWeight:600}}>Read →</a>
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
          {[{key:"showBiasLabels",label:"Show bias labels",desc:"Display Left / Centre / Right tags on sources"},{key:"showWhyItMatters",label:"Show AI Analysis button",desc:"Show ✨ AI Analysis on every card"},{key:"paywallFreeOnly",label:"Paywall-free only",desc:"Hide articles that may require a subscription"}].map(({key,label,desc})=>(
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
            {[["App","Aloka"],["Version","0.5.0 Beta"],["Tagline","News, clearly."],["Name origin","Sinhala — light"]].map(([k,v])=>(
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
      `}</style>
    </div>
  );
}
