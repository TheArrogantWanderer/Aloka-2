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
    { id:1, category:"World", source:"Reuters", bias:"Centre", time:"3m ago", headline:"G7 leaders agree on new framework to tackle AI governance globally", description:"World leaders at the G7 summit reached a landmark agreement on artificial intelligence governance, setting the first international standards for AI safety and transparency. The framework requires signatories to implement AI auditing mechanisms by 2027.", url:"#" },
    { id:2, category:"Tech", source:"The Verge", bias:"Centre-Left", time:"11m ago", headline:"Apple unveils new spatial computing headset with 40-hour battery life", description:"Apple's next-generation Vision Pro successor promises a dramatic leap in battery life and a slimmer form factor, targeting mainstream consumers rather than enterprise users. Pre-orders open next month with a $2,499 starting price.", url:"#" },
    { id:3, category:"Business", source:"Financial Times", bias:"Centre", time:"28m ago", headline:"Global markets rally as US Federal Reserve signals pause in rate hikes", description:"Stock markets surged worldwide after Federal Reserve minutes revealed policymakers are leaning toward holding interest rates steady, easing pressure on borrowing costs for businesses and consumers alike.", url:"#" },
    { id:4, category:"Politics", source:"BBC News", bias:"Centre", time:"45m ago", headline:"European Parliament passes landmark digital identity legislation", description:"The EU's new digital identity framework gives all 450 million citizens a unified digital wallet for government services, banking, and healthcare — the most ambitious digital governance project in the bloc's history.", url:"#" },
    { id:5, category:"Health", source:"The Guardian", bias:"Centre-Left", time:"1h ago", headline:"New study links ultra-processed food consumption to accelerated brain aging", description:"A major longitudinal study tracking 30,000 adults over 15 years found those consuming the most ultra-processed foods showed cognitive decline equivalent to aging 3.6 years faster.", url:"#" },
    { id:6, category:"Science", source:"Nature", bias:"Centre", time:"2h ago", headline:"Scientists detect possible signs of ancient microbial life in Mars rock samples", description:"NASA researchers analyzing samples returned by the Perseverance rover found organic compounds and isotopic signatures consistent with ancient biological activity roughly 3.5 billion years ago.", url:"#" },
    { id:7, category:"Sport", source:"ESPN", bias:"Centre", time:"2h ago", headline:"FIFA confirms 2030 World Cup will span three continents for centenary celebration", description:"Football's governing body confirmed the 2030 World Cup will be hosted across Spain, Portugal, Morocco, Argentina, Uruguay, and Paraguay — marking the tournament's 100th anniversary.", url:"#" },
    { id:8, category:"Entertainment", source:"Variety", bias:"Centre-Left", time:"3h ago", headline:"Netflix's most-watched original film breaks 200 million views in record time", description:"The streaming giant's latest thriller surpassed 200 million views in just 18 days, shattering the platform's previous record. The film cost $180M to produce and has sparked a sequel announcement.", url:"#" },
  ],
  World: [
    { id:101, category:"World", source:"Reuters", bias:"Centre", time:"5m ago", headline:"United Nations Security Council votes on emergency ceasefire resolution", description:"The UN Security Council convened an emergency session to vote on a ceasefire resolution, with diplomatic tensions running high among permanent members.", url:"#" },
    { id:102, category:"World", source:"Al Jazeera", bias:"Centre", time:"22m ago", headline:"Pacific Island nations declare climate emergency, demand immediate action", description:"A coalition of twelve Pacific Island nations formally declared a climate emergency at the UN, warning that without immediate global action, several low-lying nations face uninhabitability within 30 years.", url:"#" },
    { id:103, category:"World", source:"BBC News", bias:"Centre", time:"1h ago", headline:"China and India agree to resume high-level diplomatic talks after border standoff", description:"Following months of tensions along disputed Himalayan borders, both nations announced a renewed diplomatic channel backed by a military disengagement agreement.", url:"#" },
    { id:104, category:"World", source:"Associated Press", bias:"Centre", time:"2h ago", headline:"Global refugee numbers reach record 120 million for third consecutive year", description:"The UNHCR's annual report confirmed forced displacement has hit a historic high for the third year running, driven by conflicts in Sudan, Myanmar, and climate-related disasters.", url:"#" },
  ],
  Tech: [
    { id:201, category:"Tech", source:"The Verge", bias:"Centre-Left", time:"8m ago", headline:"OpenAI releases GPT-5 with real-time reasoning and 1M token context window", description:"OpenAI's flagship model launch sets a new benchmark in AI capability, featuring native multimodal reasoning and improved accuracy on complex logical tasks.", url:"#" },
    { id:202, category:"Tech", source:"Wired", bias:"Centre-Left", time:"31m ago", headline:"Google's quantum computer solves problem that would take classical machines 47 years", description:"Google DeepMind announced a quantum computing breakthrough, demonstrating practical quantum advantage on a real-world optimization problem.", url:"#" },
    { id:203, category:"Tech", source:"TechCrunch", bias:"Centre", time:"55m ago", headline:"Startup raises $400M to build the world's first fully autonomous AI software engineer", description:"The San Francisco-based startup claims its AI can independently build, test, and deploy production-grade software with minimal human oversight.", url:"#" },
    { id:204, category:"Tech", source:"MIT Technology Review", bias:"Centre", time:"3h ago", headline:"New battery chemistry achieves 1,000 charge cycles with zero capacity loss", description:"Researchers at Stanford developed a lithium-metal battery variant that maintains full capacity across a thousand charge cycles — a breakthrough for EVs and grid storage.", url:"#" },
  ],
  Business: [
    { id:301, category:"Business", source:"Financial Times", bias:"Centre", time:"12m ago", headline:"Amazon acquires logistics startup in $4.2B deal to compete with FedEx", description:"Amazon's latest acquisition signals an aggressive push to build end-to-end logistics independence, directly challenging established carriers.", url:"#" },
    { id:302, category:"Business", source:"The Wall Street Journal", bias:"Centre-Right", time:"40m ago", headline:"OPEC+ agrees surprise output cut sending oil prices above $90 per barrel", description:"The oil producer cartel's unexpected decision to reduce output by 1.5 million barrels per day pushed crude prices sharply higher, raising inflation concerns.", url:"#" },
    { id:303, category:"Business", source:"Bloomberg", bias:"Centre", time:"1h ago", headline:"Tesla's energy division now generates more revenue than its auto business", description:"For the first time in company history, Tesla's energy storage and solar division outpaced vehicle sales in quarterly revenue.", url:"#" },
  ],
  Politics: [
    { id:401, category:"Politics", source:"BBC News", bias:"Centre", time:"15m ago", headline:"UK Prime Minister announces snap general election for September", description:"In a surprise announcement from Downing Street, the Prime Minister called a general election two years ahead of schedule.", url:"#" },
    { id:402, category:"Politics", source:"NPR", bias:"Centre-Left", time:"1h ago", headline:"US Senate passes bipartisan infrastructure bill with $1.2 trillion in spending", description:"The rare show of bipartisan cooperation delivers the largest infrastructure investment in American history, targeting roads, bridges, broadband, and clean energy.", url:"#" },
    { id:403, category:"Politics", source:"The Economist", bias:"Centre", time:"3h ago", headline:"France's ruling coalition collapses ahead of budget vote", description:"The French government faces a constitutional crisis after coalition partners withdrew support over austerity measures.", url:"#" },
  ],
  Sport: [
    { id:501, category:"Sport", source:"ESPN", bias:"Centre", time:"20m ago", headline:"Lionel Messi announces retirement from international football at 38", description:"The eight-time Ballon d'Or winner confirmed he will not participate in the next World Cup qualifying campaign.", url:"#" },
    { id:502, category:"Sport", source:"Sky Sports", bias:"Centre", time:"45m ago", headline:"Formula 1 confirms Las Vegas Grand Prix extended to 10-year deal", description:"The sport's fastest-growing race on the calendar has secured a long-term future on the Strip, with major infrastructure upgrades planned.", url:"#" },
    { id:503, category:"Sport", source:"BBC Sport", bias:"Centre", time:"2h ago", headline:"New Zealand All Blacks reclaim World Rugby number one ranking", description:"After a dominant series victory against the British & Irish Lions, the All Blacks returned to the top of world rugby rankings for the first time since 2022.", url:"#" },
  ],
  Health: [
    { id:601, category:"Health", source:"The Guardian", bias:"Centre-Left", time:"18m ago", headline:"WHO approves world's first malaria vaccine for widespread use in children", description:"The World Health Organization granted full approval to a second-generation malaria vaccine showing 77% efficacy in clinical trials.", url:"#" },
    { id:602, category:"Health", source:"Reuters", bias:"Centre", time:"50m ago", headline:"Ozempic found to reduce cardiovascular disease risk by 20% in landmark trial", description:"A major clinical trial involving 17,000 patients confirmed that semaglutide drugs reduce the risk of heart attack and stroke significantly.", url:"#" },
    { id:603, category:"Health", source:"BBC News", bias:"Centre", time:"2h ago", headline:"Global life expectancy hits 74 years for first time despite pandemic setback", description:"WHO data shows humanity has recovered the life expectancy gains lost during COVID-19, with improvements driven by reduced child mortality.", url:"#" },
  ],
  Science: [
    { id:701, category:"Science", source:"Nature", bias:"Centre", time:"35m ago", headline:"First complete map of a human brain's neural connections published by scientists", description:"An international team published the first full connectome of a cubic millimetre of human brain tissue, mapping 57,000 cells and 150 million synaptic connections.", url:"#" },
    { id:702, category:"Science", source:"Science", bias:"Centre", time:"1h ago", headline:"CRISPR gene editing reverses inherited blindness in first human trial", description:"Researchers at the University of Pennsylvania restored functional vision in three patients with a rare inherited retinal disease using in-vivo CRISPR.", url:"#" },
    { id:703, category:"Science", source:"MIT Technology Review", bias:"Centre", time:"4h ago", headline:"New material absorbs 99.9% of sunlight and converts it to electricity", description:"Scientists developed a perovskite-silicon tandem solar cell achieving 47% energy conversion efficiency in lab conditions.", url:"#" },
  ],
  Entertainment: [
    { id:801, category:"Entertainment", source:"Variety", bias:"Centre-Left", time:"10m ago", headline:"Beyoncé's Renaissance film breaks all-time opening weekend record for a concert film", description:"The visual companion to her critically acclaimed album shattered box office records in its opening weekend, earning $92M globally.", url:"#" },
    { id:802, category:"Entertainment", source:"The Hollywood Reporter", bias:"Centre", time:"55m ago", headline:"Succession creator announces new HBO series set in Silicon Valley", description:"Jesse Armstrong returns to television with a new limited series examining power and dysfunction inside a fictional AI company.", url:"#" },
    { id:803, category:"Entertainment", source:"BBC Culture", bias:"Centre", time:"3h ago", headline:"The Booker Prize awarded to debut Nigerian novelist in historic first", description:"The 2026 Booker Prize was awarded to a debut novelist from Lagos, making history as the youngest winner in the prize's 57-year history.", url:"#" },
  ],
};

function getBias(n) { if(!n) return "Centre"; for(const [k,v] of Object.entries(SOURCE_BIAS)){ if(n.toLowerCase().includes(k.toLowerCase())) return v; } return "Centre"; }
function timeAgo(d) { if(!d) return "Recently"; const diff=Math.floor((Date.now()-new Date(d))/1000); if(diff<60) return `${diff}s ago`; if(diff<3600) return `${Math.floor(diff/60)}m ago`; if(diff<86400) return `${Math.floor(diff/3600)}h ago`; return `${Math.floor(diff/86400)}d ago`; }
function formatArticle(raw, cat) { return { id: raw.article_id||raw.link||Math.random().toString(), category:cat, source:raw.source_name||"Unknown", bias:getBias(raw.source_name), time:raw.pubDate?timeAgo(raw.pubDate):"Recently", headline:raw.title||"No headline", description:raw.description||"", url:raw.link||"#", aiSummary:null, aiLoading:false }; }

async function generateAISummary(headline, description) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1000, messages:[{ role:"user", content:`You are a news analyst for Aloka. Given this article, respond ONLY with valid JSON (no markdown, no backticks):\n{"bullets":["point 1","point 2","point 3"],"why":"One sentence why this matters to everyday people under 25 words."}\n\nHeadline: ${headline}\nDescription: ${description}` }] }) });
    const data = await res.json();
    return JSON.parse(data.content?.[0]?.text?.trim());
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
  const [open, 
