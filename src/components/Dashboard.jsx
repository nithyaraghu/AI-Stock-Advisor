import { useState, useEffect, useRef, useCallback, Component } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

/* ─── ERROR BOUNDARY ─────────────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div style={{background:"#0A0F1E",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:"monospace",color:"#D6E0F5"}}>
        <div style={{fontSize:14,color:"#C75B6A"}}>Dashboard Error</div>
        <div style={{fontSize:11,color:"#6B82AA",maxWidth:400,textAlign:"center"}}>{this.state.error?.message}</div>
        <button onClick={()=>window.location.reload()} style={{padding:"8px 16px",background:"#5B8DEF",color:"#000",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>Reload</button>
      </div>
    );
    return this.props.children;
  }
}

/* ─── STYLES ─────────────────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { width: 100%; height: 100%; overflow: hidden; background: #0A0F1E; }
    :root {
      --bg:#0A0F1E; --bg2:#0F1629; --bg3:#141D35; --bg4:#1A2440;
      --border:rgba(99,140,210,0.1); --border2:rgba(99,140,210,0.2);
      --accent:#5B8DEF; --accent2:#3D6FD4;
      --up:#4CAF8A; --down:#C75B6A; --warn:#C4922A;
      --text:#D6E0F5; --text2:#6B82AA; --text3:#2E3F62;
      --mono:'IBM Plex Mono',monospace; --sans:'IBM Plex Sans',sans-serif;
    }
    ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  `}</style>
);

/* ─── CONFIG ─────────────────────────────────────────────────── */
const BACKEND = "http://127.0.0.1:5000";
// USER_ID now comes from props

const ALL_STOCKS = [
  {sym:"AAPL",name:"Apple",sector:"Tech"},{sym:"NVDA",name:"NVIDIA",sector:"Tech"},
  {sym:"MSFT",name:"Microsoft",sector:"Tech"},{sym:"GOOGL",name:"Alphabet",sector:"Tech"},
  {sym:"META",name:"Meta Platforms",sector:"Tech"},{sym:"AMZN",name:"Amazon",sector:"Tech"},
  {sym:"TSLA",name:"Tesla",sector:"Tech"},{sym:"AMD",name:"AMD",sector:"Tech"},
  {sym:"INTC",name:"Intel",sector:"Tech"},{sym:"ORCL",name:"Oracle",sector:"Tech"},
  {sym:"TSM",name:"TSMC",sector:"Tech"},{sym:"AVGO",name:"Broadcom",sector:"Tech"},
  {sym:"QCOM",name:"Qualcomm",sector:"Tech"},{sym:"TXN",name:"Texas Instruments",sector:"Tech"},
  {sym:"MU",name:"Micron",sector:"Tech"},{sym:"NOW",name:"ServiceNow",sector:"Tech"},
  {sym:"CRM",name:"Salesforce",sector:"Tech"},{sym:"ADBE",name:"Adobe",sector:"Tech"},
  {sym:"SNOW",name:"Snowflake",sector:"Tech"},{sym:"PANW",name:"Palo Alto Networks",sector:"Tech"},
  {sym:"CRWD",name:"CrowdStrike",sector:"Tech"},{sym:"NET",name:"Cloudflare",sector:"Tech"},
  {sym:"PLTR",name:"Palantir",sector:"Tech"},{sym:"ARM",name:"ARM Holdings",sector:"Tech"},
  {sym:"UBER",name:"Uber",sector:"Tech"},{sym:"SHOP",name:"Shopify",sector:"Tech"},
  {sym:"JPM",name:"JPMorgan Chase",sector:"Finance"},{sym:"BAC",name:"Bank of America",sector:"Finance"},
  {sym:"GS",name:"Goldman Sachs",sector:"Finance"},{sym:"MS",name:"Morgan Stanley",sector:"Finance"},
  {sym:"WFC",name:"Wells Fargo",sector:"Finance"},{sym:"V",name:"Visa",sector:"Finance"},
  {sym:"MA",name:"Mastercard",sector:"Finance"},{sym:"AXP",name:"American Express",sector:"Finance"},
  {sym:"COIN",name:"Coinbase",sector:"Finance"},{sym:"PYPL",name:"PayPal",sector:"Finance"},
  {sym:"JNJ",name:"Johnson & Johnson",sector:"Health"},{sym:"UNH",name:"UnitedHealth",sector:"Health"},
  {sym:"PFE",name:"Pfizer",sector:"Health"},{sym:"LLY",name:"Eli Lilly",sector:"Health"},
  {sym:"ABBV",name:"AbbVie",sector:"Health"},{sym:"MRK",name:"Merck",sector:"Health"},
  {sym:"AMGN",name:"Amgen",sector:"Health"},{sym:"MRNA",name:"Moderna",sector:"Health"},
  {sym:"XOM",name:"ExxonMobil",sector:"Energy"},{sym:"CVX",name:"Chevron",sector:"Energy"},
  {sym:"COP",name:"ConocoPhillips",sector:"Energy"},{sym:"OXY",name:"Occidental",sector:"Energy"},
  {sym:"WMT",name:"Walmart",sector:"Consumer"},{sym:"COST",name:"Costco",sector:"Consumer"},
  {sym:"HD",name:"Home Depot",sector:"Consumer"},{sym:"MCD",name:"McDonald's",sector:"Consumer"},
  {sym:"SBUX",name:"Starbucks",sector:"Consumer"},{sym:"NKE",name:"Nike",sector:"Consumer"},
  {sym:"KO",name:"Coca-Cola",sector:"Consumer"},{sym:"ABNB",name:"Airbnb",sector:"Consumer"},
  {sym:"BA",name:"Boeing",sector:"Industrial"},{sym:"CAT",name:"Caterpillar",sector:"Industrial"},
  {sym:"GE",name:"GE Aerospace",sector:"Industrial"},{sym:"LMT",name:"Lockheed Martin",sector:"Industrial"},
  {sym:"NFLX",name:"Netflix",sector:"Media"},{sym:"DIS",name:"Disney",sector:"Media"},
  {sym:"T",name:"AT&T",sector:"Telecom"},{sym:"TMUS",name:"T-Mobile",sector:"Telecom"},
  {sym:"RIVN",name:"Rivian",sector:"Auto"},{sym:"F",name:"Ford",sector:"Auto"},
  {sym:"GM",name:"General Motors",sector:"Auto"},
  {sym:"SPY",name:"S&P 500 ETF",sector:"ETF"},{sym:"QQQ",name:"Nasdaq ETF",sector:"ETF"},
  {sym:"GLD",name:"Gold ETF",sector:"ETF"},{sym:"ARKK",name:"ARK Innovation ETF",sector:"ETF"},
];

const DEFAULT_PINS = ["AAPL","NVDA","MSFT","GOOGL","TSLA"];

const BASE_PRICES = {
  AAPL:267,NVDA:216,MSFT:424,GOOGL:350,META:580,AMZN:195,TSLA:250,AMD:105,
  INTC:21,ORCL:165,JPM:240,BAC:45,GS:520,V:330,MA:520,JNJ:155,UNH:580,
  PFE:28,LLY:780,ABBV:195,XOM:115,CVX:165,WMT:95,KO:65,MCD:305,
  SPY:580,QQQ:490,GLD:235,COIN:225,PYPL:65,NFLX:985,DIS:95,
};

const SECTOR_COLORS = {
  Tech:"#5B8DEF",Finance:"#C4922A",Health:"#4CAF8A",Energy:"#C75B6A",
  Consumer:"#A78BFA",ETF:"#38BDF8",Industrial:"#94A3B8",
  Media:"#F472B6",Telecom:"#34D399",Auto:"#FB923C",
};

/* ─── MATH ───────────────────────────────────────────────────── */
function computeRSI(closes, period=14) {
  if (closes.length < period+1) return null;
  let ag=0, al=0;
  for (let i=1; i<=period; i++) { const d=closes[i]-closes[i-1]; if(d>0)ag+=d; else al-=d; }
  ag/=period; al/=period;
  for (let i=period+1; i<closes.length; i++) {
    const d=closes[i]-closes[i-1];
    ag=(ag*(period-1)+(d>0?d:0))/period;
    al=(al*(period-1)+(d<0?-d:0))/period;
  }
  return al===0 ? 100 : +(100-100/(1+ag/al)).toFixed(1);
}
function computeEMA(closes, period) {
  const k=2/(period+1); let e=closes[0];
  return closes.map(p=>{e=p*k+e*(1-k);return e;});
}
function transformTimeSeries(data) {
  const closes = data.map(d=>d.close);
  const ema12=computeEMA(closes,12), ema26=computeEMA(closes,26);
  const macdLine=ema12.map((v,i)=>v-ema26[i]);
  const sigLine=computeEMA(macdLine.slice(25),9);
  return data.map((d,i)=>({
    day:i, date:d.time, price:d.close,
    open:d.open, high:d.high, low:d.low, volume:d.volume,
    rsi: computeRSI(closes.slice(0,i+1)) || 50,
    macd: i>=26 ? +macdLine[i].toFixed(3) : 0,
    signal: i>=35 ? +(sigLine[i-25]||0).toFixed(3) : 0,
  }));
}

/* ─── COMPONENTS ─────────────────────────────────────────────── */
const Spark = ({data, up, w=64, h=24}) => {
  if (!data?.length) return null;
  const prices=data.map(d=>d.price);
  const mn=Math.min(...prices), mx=Math.max(...prices), rng=mx-mn||1;
  const pts=prices.map((p,i)=>`${(i/(prices.length-1))*w},${h-((p-mn)/rng)*(h-2)-1}`).join(" ");
  return <svg width={w} height={h} style={{overflow:"visible"}}><polyline points={pts} fill="none" stroke={up?"var(--up)":"var(--down)"} strokeWidth="1.5" strokeLinejoin="round"/></svg>;
};

const RSIGauge = ({value}) => {
  if (!value) return null;
  const color=value>70?"var(--down)":value<30?"var(--up)":"var(--accent)";
  const label=value>70?"OVERBOUGHT":value<30?"OVERSOLD":"NEUTRAL";
  return (
    <div>
      <div style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--mono)",letterSpacing:"0.1em",marginBottom:4}}>RSI (14)</div>
      <div style={{position:"relative",height:4,background:"var(--bg3)",borderRadius:2,overflow:"hidden",marginBottom:5,width:80}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${value}%`,background:`linear-gradient(90deg,var(--accent2),${color})`,borderRadius:2,transition:"width 0.8s ease"}}/>
        <div style={{position:"absolute",left:"30%",top:0,width:1,height:"100%",background:"rgba(255,255,255,0.15)"}}/>
        <div style={{position:"absolute",left:"70%",top:0,width:1,height:"100%",background:"rgba(255,255,255,0.15)"}}/>
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:6}}>
        <span style={{fontFamily:"var(--mono)",fontSize:18,fontWeight:600,color}}>{value}</span>
        <span style={{fontSize:8,color,fontFamily:"var(--mono)",padding:"1px 5px",border:`0.5px solid ${color}`,borderRadius:2}}>{label}</span>
      </div>
    </div>
  );
};

const ChartTip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  const d=payload[0].payload;
  return (
    <div style={{background:"var(--bg2)",border:"0.5px solid var(--border2)",borderRadius:6,padding:"8px 12px",fontFamily:"var(--mono)",fontSize:10,color:"var(--text2)"}}>
      <div style={{color:"var(--text)",marginBottom:3}}>{d.date||`Day ${label}`}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color||"var(--text)"}}>{p.name}: {typeof p.value==="number"?p.value.toFixed(2):p.value}</div>)}
    </div>
  );
};

const SentimentBadge = ({label, score}) => {
  const s = parseFloat(score||0);
  const color = s>0.15?"var(--up)":s<-0.15?"var(--down)":"var(--text3)";
  const text  = label||"Neutral";
  return (
    <span style={{fontSize:8,fontFamily:"var(--mono)",padding:"2px 6px",borderRadius:3,background:`${color}18`,color,border:`0.5px solid ${color}`}}>
      {text.toUpperCase()}
    </span>
  );
};

/* ─── MAIN DASHBOARD ─────────────────────────────────────────── */
function DashboardInner({ user, onLogout }) {
  const [selected,    setSelected]    = useState("AAPL");
  const [pinnedSyms,  setPinnedSyms]  = useState(DEFAULT_PINS);
  const [priceData,   setPriceData]   = useState({});
  const [livePrice,   setLivePrice]   = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [stockNews,   setStockNews]   = useState([]);
  const [marketNews,  setMarketNews]  = useState([]);
  const [tickerLines, setTickerLines] = useState([]);
  const [stockNewsLoading,  setStockNewsLoading]  = useState(false);
  const [marketNewsLoading, setMarketNewsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([{role:"assistant",content:"Hi! Ask me about any stock — RSI analysis, news, portfolio risk, or market sentiment.\n\nTry: \"Analyze AAPL technically\" or \"What's driving NVDA today?\""}]);
  const [chatInput,  setChatInput]  = useState("");
  const [chatLoading,setChatLoading]= useState(false);
  const [activeChart,setActiveChart]= useState("price");
  const [tab,        setTab]        = useState("chart");
  const [newsTab,    setNewsTab]    = useState("market");
  const [showNews,   setShowNews]   = useState(false);
  const [loadingSyms,setLoadingSyms]= useState(new Set());
  const chatEndRef = useRef(null);
  const searchRef  = useRef(null);

  const pinnedStocks   = ALL_STOCKS.filter(s=>pinnedSyms.includes(s.sym));
  const searchResults  = searchQuery.length>0
    ? ALL_STOCKS.filter(s=>s.sym.toLowerCase().includes(searchQuery.toLowerCase())||s.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,8)
    : [];

  const togglePin = useCallback(sym=>{
    setPinnedSyms(prev=>prev.includes(sym)?prev.filter(s=>s!==sym):[...prev,sym]);
  },[]);

  const loadStock = useCallback(async sym=>{
    if (priceData[sym]) return;
    setLoadingSyms(prev=>new Set([...prev,sym]));
    try {
      const res  = await fetch(`${BACKEND}/stocks/yf/history?symbol=${sym}&period=3mo&interval=1d`);
      const json = await res.json();
      if (json.data?.length>0) {
        setPriceData(prev=>({...prev,[sym]:transformTimeSeries(json.data)}));
        const last=json.data[json.data.length-1], first=json.data[0];
        setLivePrice(prev=>({...prev,[sym]:{price:last.close,prev:first.close}}));
      } else throw new Error("No data");
    } catch {
      const base=BASE_PRICES[sym]||100; let p=base;
      const mock=Array.from({length:60},(_,i)=>{p=p*(1+(Math.random()-0.485)*0.018);return{day:i,price:+p.toFixed(2),rsi:30+Math.random()*50,macd:0,signal:0,volume:50e6};});
      setPriceData(prev=>({...prev,[sym]:mock}));
      setLivePrice(prev=>({...prev,[sym]:{price:base,prev:base*0.99}}));
    }
    setLoadingSyms(prev=>{const n=new Set(prev);n.delete(sym);return n;});
  },[priceData]);

  // Load pinned stocks
  useEffect(()=>{pinnedSyms.forEach(s=>loadStock(s));},[pinnedSyms]);
  // Load selected stock
  useEffect(()=>{loadStock(selected);},[selected]);

  // Live quotes every 30s
  useEffect(()=>{
    const fetchQ=async()=>{
      if (!pinnedSyms.length) return;
      try {
        const res=await fetch(`${BACKEND}/stocks/yf/multi?symbols=${pinnedSyms.join(' ')}`);
        const json=await res.json();
        setLivePrice(prev=>{
          const next={...prev};
          Object.entries(json).forEach(([sym,q])=>{if(q.price>0)next[sym]={price:q.price,prev:q.prev_close};});
          return next;
        });
      } catch {}
    };
    fetchQ();
    const t=setInterval(fetchQ,30000);
    return()=>clearInterval(t);
  },[pinnedSyms]);

  // Stock-specific news — try yfinance first, fallback to Alpha Vantage
  useEffect(()=>{
    setStockNewsLoading(true);
    fetch(`${BACKEND}/stocks/yf/news?symbol=${selected}`)
      .then(r=>r.json())
      .then(d=>{
        if (d.articles?.length > 0) {
          setStockNews(d.articles);
        } else {
          // fallback to Alpha Vantage sentiment news
          return fetch(`${BACKEND}/stocks/news?symbol=${selected}`)
            .then(r=>r.json())
            .then(d2=>setStockNews((d2.feed||[]).slice(0,10)));
        }
      })
      .catch(()=>setStockNews([]))
      .finally(()=>setStockNewsLoading(false));
  },[selected]);

  // Market-wide news
  useEffect(()=>{
    setMarketNewsLoading(true);
    fetch(`${BACKEND}/stocks/news/market`)
      .then(r=>r.json())
      .then(d=>setMarketNews(d.articles||[]))
      .catch(()=>setMarketNews([]))
      .finally(()=>setMarketNewsLoading(false));
  },[]);

  // Ticker tape headlines
  useEffect(()=>{
    fetch(`${BACKEND}/stocks/news/ticker`)
      .then(r=>r.json())
      .then(d=>setTickerLines(d.headlines||[]))
      .catch(()=>{});
  },[]);

  // Auto-scroll chat
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatMessages]);

  // Close search on outside click
  useEffect(()=>{
    const h=e=>{if(searchRef.current&&!searchRef.current.contains(e.target))setSearchOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const sendChat = useCallback(async()=>{
    if (!chatInput.trim()||chatLoading) return;
    const msg=chatInput.trim(); setChatInput("");
    setChatMessages(p=>[...p,{role:"user",content:msg}]);
    setChatLoading(true);
    try {
      const res=await fetch(`${BACKEND}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:user?.userId||"",message:msg})});
      const d=await res.json();
      setChatMessages(p=>[...p,{role:"assistant",content:d.response||"No response.",agent:d.agent_used,symbol:d.symbol}]);
    } catch {
      setChatMessages(p=>[...p,{role:"assistant",content:"Connection error — is Flask running on port 5000?"}]);
    }
    setChatLoading(false);
  },[chatInput,chatLoading]);

  const current   = priceData[selected]||[];
  const live      = livePrice[selected]||{};
  const changePct = live.prev?(((live.price-live.prev)/live.prev)*100).toFixed(2):"0.00";
  const isUp      = parseFloat(changePct)>=0;
  const lastBar   = current[current.length-1]||{};
  const isLoading = loadingSyms.has(selected);

  return (
    <div style={{
      fontFamily:"var(--sans)",background:"var(--bg)",
      width:"100vw",height:"100vh",
      display:"grid",
      gridTemplateColumns:"clamp(200px,17vw,260px) 1fr clamp(280px,23vw,360px)",
      gridTemplateRows:"clamp(44px,4vh,56px) 1fr 28px",
      overflow:"hidden"
    }}>
      <Styles/>

      {/* TOP BAR */}
      <div style={{gridColumn:"1/-1",background:"var(--bg2)",borderBottom:"0.5px solid var(--border)",display:"flex",alignItems:"center",padding:"0 16px",gap:16,justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"var(--accent)",boxShadow:"0 0 8px var(--accent)",animation:"pulse 2s infinite"}}/>
          <span style={{fontFamily:"var(--mono)",fontSize:"clamp(10px,0.9vw,13px)",fontWeight:600,color:"var(--text)",letterSpacing:"0.12em"}}>MARKET INTELLIGENCE</span>
          <span style={{fontSize:8,color:"var(--text3)",fontFamily:"var(--mono)",padding:"2px 5px",border:"0.5px solid var(--border2)",borderRadius:2}}>LIVE</span>
        </div>
        <div style={{display:"flex",gap:20}}>
          {[["S&P 500","+0.87%",true],["NASDAQ","+1.24%",true],["DOW","-0.12%",false],["VIX","14.82",false],["10Y","4.38%",false]].map(([n,v,u])=>(
            <div key={n} style={{textAlign:"center"}}>
              <div style={{fontSize:8,color:"var(--text3)",fontFamily:"var(--mono)"}}>{n}</div>
              <div style={{fontSize:10,color:u?"var(--up)":"var(--down)",fontFamily:"var(--mono)"}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--text3)"}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
          <button onClick={()=>{setShowNews(true);setNewsTab("market");}}
            style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",background:showNews?"var(--accent)":"transparent",border:`0.5px solid ${showNews?"var(--accent)":"var(--border2)"}`,borderRadius:4,cursor:"pointer",color:showNews?"#000":"var(--text2)",fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.08em",transition:"all 0.2s"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M4 10h16"/></svg>
            NEWS
          </button>
          {user&&(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",background:"var(--bg3)",borderRadius:4,border:"0.5px solid var(--border)"}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:"var(--accent2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:"var(--mono)",color:"#fff",fontWeight:600}}>
                {user.username?user.username[0].toUpperCase():"U"}
              </div>
              <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--text2)"}}>{user.username||user.email}</span>
              <button onClick={onLogout}
                style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:9,fontFamily:"var(--mono)",padding:"0 4px",letterSpacing:"0.06em"}}
                title="Sign out">
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LEFT — WATCHLIST */}
      <div style={{background:"var(--bg2)",borderRight:"0.5px solid var(--border)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Search */}
        <div ref={searchRef} style={{padding:"10px",borderBottom:"0.5px solid var(--border)",position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--bg3)",border:`0.5px solid ${searchOpen?"var(--accent)":"var(--border2)"}`,borderRadius:6,padding:"7px 10px",transition:"border-color 0.2s"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={searchQuery} onChange={e=>{setSearchQuery(e.target.value);setSearchOpen(true);}} onFocus={()=>setSearchOpen(true)}
              placeholder="Search any stock to pin..."
              style={{background:"transparent",border:"none",outline:"none",color:"var(--text)",fontSize:11,fontFamily:"var(--mono)",width:"100%"}}/>
            {searchQuery&&<button onClick={()=>{setSearchQuery("");setSearchOpen(false);}} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>}
          </div>
          {searchOpen&&searchResults.length>0&&(
            <div style={{position:"absolute",top:"calc(100% - 2px)",left:10,right:10,background:"var(--bg3)",border:"0.5px solid var(--border2)",borderRadius:"0 0 8px 8px",zIndex:100,overflow:"hidden",boxShadow:"0 12px 32px rgba(0,0,0,0.5)"}}>
              {searchResults.map(s=>{
                const isPinned=pinnedSyms.includes(s.sym);
                const lp=livePrice[s.sym];
                return (
                  <div key={s.sym} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",cursor:"pointer",borderBottom:"0.5px solid var(--border)",transition:"background 0.1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--bg4)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    onClick={()=>{setSelected(s.sym);setSearchQuery("");setSearchOpen(false);loadStock(s.sym);}}>
                    <div>
                      <span style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:600,color:"var(--text)"}}>{s.sym}</span>
                      <span style={{fontSize:10,color:"var(--text2)",marginLeft:8}}>{s.name}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {lp&&<span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text)"}}>${lp.price?.toFixed(2)}</span>}
                      <span style={{fontSize:7,padding:"2px 5px",background:`${SECTOR_COLORS[s.sector]||"#5B8DEF"}20`,color:SECTOR_COLORS[s.sector]||"#5B8DEF",borderRadius:3,fontFamily:"var(--mono)"}}>{s.sector}</span>
                      <button onClick={e=>{e.stopPropagation();togglePin(s.sym);}}
                        style={{background:"none",border:`0.5px solid ${isPinned?"var(--accent)":"var(--border2)"}`,borderRadius:3,color:isPinned?"var(--accent)":"var(--text3)",cursor:"pointer",padding:"2px 7px",fontSize:9,fontFamily:"var(--mono)"}}>
                        {isPinned?"★":"☆"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pinned header */}
        <div style={{padding:"8px 12px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:8,fontFamily:"var(--mono)",color:"var(--text3)",letterSpacing:"0.12em"}}>PINNED ({pinnedSyms.length})</span>
          <span style={{fontSize:8,color:"var(--text3)",fontFamily:"var(--mono)"}}>★ to unpin</span>
        </div>

        {/* Pinned list */}
        <div style={{flex:1,overflowY:"auto"}}>
          {pinnedStocks.length===0&&(
            <div style={{padding:"24px 12px",textAlign:"center",color:"var(--text3)",fontSize:10,fontFamily:"var(--mono)",lineHeight:2}}>
              No pinned stocks.<br/>Search above and<br/>tap ☆ to pin ★
            </div>
          )}
          {pinnedStocks.map(({sym,name,sector})=>{
            const lp=livePrice[sym]||{};
            const chg=lp.prev?(((lp.price-lp.prev)/lp.prev)*100).toFixed(2):"0.00";
            const up=parseFloat(chg)>=0;
            const data=priceData[sym]||[];
            const isSel=sym===selected;
            const isLoad=loadingSyms.has(sym);
            return (
              <div key={sym} onClick={()=>setSelected(sym)}
                style={{padding:"8px 12px",cursor:"pointer",borderLeft:`2px solid ${isSel?"var(--accent)":"transparent"}`,background:isSel?"rgba(91,141,239,0.05)":"transparent",transition:"all 0.15s",borderBottom:"0.5px solid var(--border)",animation:"slideIn 0.3s ease"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:"clamp(11px,0.9vw,13px)",fontFamily:"var(--mono)",fontWeight:600,color:isSel?"var(--accent)":"var(--text)"}}>{sym}</span>
                      <span style={{fontSize:7,padding:"1px 4px",background:`${SECTOR_COLORS[sector]||"#5B8DEF"}18`,color:SECTOR_COLORS[sector]||"#5B8DEF",borderRadius:2,fontFamily:"var(--mono)"}}>{sector}</span>
                      <button onClick={e=>{e.stopPropagation();togglePin(sym);}}
                        style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontSize:11,padding:0,marginLeft:"auto",opacity:0.6}}>★</button>
                    </div>
                    <div style={{fontSize:9,color:"var(--text3)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                    {isLoad
                      ? <div style={{width:44,height:11,background:"var(--bg3)",borderRadius:3,animation:"pulse 1.5s infinite",marginBottom:3}}/>
                      : <>
                          <div style={{fontSize:"clamp(11px,0.9vw,13px)",fontFamily:"var(--mono)",color:"var(--text)"}}>${lp.price?.toFixed(2)||"—"}</div>
                          <div style={{fontSize:9,fontFamily:"var(--mono)",color:up?"var(--up)":"var(--down)"}}>{up?"▲":"▼"}{Math.abs(chg)}%</div>
                        </>
                    }
                  </div>
                </div>
                {data.length>0&&!isLoad&&(
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <Spark data={data.slice(-20)} up={up} w={64} h={22}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick add */}
        <div style={{borderTop:"0.5px solid var(--border)",padding:"8px 12px"}}>
          <div style={{fontSize:8,fontFamily:"var(--mono)",color:"var(--text3)",letterSpacing:"0.1em",marginBottom:6}}>QUICK ADD</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {ALL_STOCKS.filter(s=>!pinnedSyms.includes(s.sym)).slice(0,10).map(s=>(
              <button key={s.sym} onClick={()=>{togglePin(s.sym);setSelected(s.sym);}}
                style={{padding:"3px 7px",fontSize:8,fontFamily:"var(--mono)",background:"transparent",border:"0.5px solid var(--border2)",borderRadius:3,color:"var(--text2)",cursor:"pointer",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.target.style.borderColor="var(--accent)";e.target.style.color="var(--accent)";}}
                onMouseLeave={e=>{e.target.style.borderColor="var(--border2)";e.target.style.color="var(--text2)";}}>
                +{s.sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER — CHART + NEWS */}
      <div style={{display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"0.5px solid var(--border)"}}>
        {/* Header */}
        <div style={{padding:"10px 16px 8px",borderBottom:"0.5px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"baseline",gap:10}}>
            <span style={{fontFamily:"var(--mono)",fontSize:"clamp(14px,1.4vw,20px)",fontWeight:700,color:"var(--text)"}}>{selected}</span>
            {isLoading
              ? <div style={{width:130,height:24,background:"var(--bg3)",borderRadius:4,animation:"pulse 1.5s infinite"}}/>
              : <>
                  <span style={{fontSize:"clamp(18px,2vw,28px)",fontFamily:"var(--mono)",fontWeight:700,color:"var(--text)"}}>${live.price?.toFixed(2)||"—"}</span>
                  <span style={{fontSize:13,fontFamily:"var(--mono)",color:isUp?"var(--up)":"var(--down)"}}>{isUp?"▲":"▼"} {Math.abs(changePct)}%</span>
                </>
            }
          </div>
          <div style={{display:"flex",gap:4}}>
            {["chart"].map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{padding:"4px 12px",fontSize:9,fontFamily:"var(--mono)",background:tab===t?"var(--accent)":"transparent",color:tab===t?"#000":"var(--text3)",border:`0.5px solid ${tab===t?"var(--accent)":"var(--border)"}`,borderRadius:4,cursor:"pointer",letterSpacing:"0.08em",textTransform:"uppercase"}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* CHART TAB */}
        {tab==="chart"&&(
          <>
            <div style={{padding:"5px 14px",display:"flex",gap:3,borderBottom:"0.5px solid var(--border)"}}>
              {["price","rsi","macd","volume"].map(c=>(
                <button key={c} onClick={()=>setActiveChart(c)}
                  style={{padding:"3px 10px",fontSize:8,fontFamily:"var(--mono)",background:activeChart===c?"var(--bg3)":"transparent",color:activeChart===c?"var(--accent)":"var(--text3)",border:`0.5px solid ${activeChart===c?"var(--border2)":"transparent"}`,borderRadius:3,cursor:"pointer",letterSpacing:"0.08em",textTransform:"uppercase"}}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{flex:1,padding:"8px 8px 0",minHeight:0}}>
              {isLoading
                ? <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
                    <div style={{width:24,height:24,border:"2px solid var(--border2)",borderTop:"2px solid var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                    <span style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--mono)"}}>Loading {selected}...</span>
                  </div>
                : <ResponsiveContainer width="100%" height="100%">
                    {activeChart==="price"
                      ? <AreaChart data={current} margin={{top:4,right:4,bottom:0,left:0}}>
                          <defs>
                            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isUp?"#4CAF8A":"#C75B6A"} stopOpacity={0.08}/>
                              <stop offset="95%" stopColor={isUp?"#4CAF8A":"#C75B6A"} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.03)" vertical={false}/>
                          <XAxis dataKey="date" hide/>
                          <YAxis tick={{fill:"var(--text3)",fontSize:9,fontFamily:"var(--mono)"}} tickLine={false} axisLine={false} width={55} tickFormatter={v=>`$${v}`} domain={["dataMin * 0.995","dataMax * 1.005"]}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Area type="monotone" dataKey="price" stroke={isUp?"var(--up)":"var(--down)"} strokeWidth={1.5} fill="url(#pg)" dot={false} name="Price"/>
                        </AreaChart>
                      : activeChart==="rsi"
                      ? <LineChart data={current} margin={{top:4,right:4,bottom:0,left:0}}>
                          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.03)" vertical={false}/>
                          <XAxis dataKey="date" hide/>
                          <YAxis domain={[0,100]} tick={{fill:"var(--text3)",fontSize:9,fontFamily:"var(--mono)"}} tickLine={false} axisLine={false} width={35}/>
                          <Tooltip content={<ChartTip/>}/>
                          <ReferenceLine y={70} stroke="var(--down)" strokeDasharray="3 3" strokeWidth={0.8}/>
                          <ReferenceLine y={30} stroke="var(--up)" strokeDasharray="3 3" strokeWidth={0.8}/>
                          <Line type="monotone" dataKey="rsi" stroke="var(--accent)" strokeWidth={2} dot={false} name="RSI"/>
                        </LineChart>
                      : activeChart==="macd"
                      ? <LineChart data={current} margin={{top:4,right:4,bottom:0,left:0}}>
                          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.03)" vertical={false}/>
                          <XAxis dataKey="date" hide/>
                          <YAxis tick={{fill:"var(--text3)",fontSize:9,fontFamily:"var(--mono)"}} tickLine={false} axisLine={false} width={40}/>
                          <Tooltip content={<ChartTip/>}/>
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)"/>
                          <Line type="monotone" dataKey="macd" stroke="var(--accent)" strokeWidth={1.5} dot={false} name="MACD"/>
                          <Line type="monotone" dataKey="signal" stroke="var(--warn)" strokeWidth={1} dot={false} strokeDasharray="3 2" name="Signal"/>
                        </LineChart>
                      : <BarChart data={current} margin={{top:4,right:4,bottom:0,left:0}}>
                          <XAxis dataKey="date" hide/>
                          <YAxis hide/>
                          <Tooltip content={<ChartTip/>}/>
                          <Bar dataKey="volume" fill="var(--accent2)" opacity={0.4} radius={[1,1,0,0]} name="Volume"/>
                        </BarChart>
                    }
                  </ResponsiveContainer>
              }
            </div>
            <div style={{padding:"6px 16px 8px",borderTop:"0.5px solid var(--border)",display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
              <RSIGauge value={lastBar.rsi}/>
              <div style={{flex:1}}>
                <div style={{fontSize:8,fontFamily:"var(--mono)",color:"var(--text3)",letterSpacing:"0.1em",marginBottom:4}}>MACD</div>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  {[["MACD",lastBar.macd,"var(--accent)"],["Signal",lastBar.signal,"var(--warn)"]].map(([l,v,c])=>(
                    <div key={l}>
                      <div style={{fontSize:8,color:"var(--text3)",fontFamily:"var(--mono)"}}>{l}</div>
                      <div style={{fontSize:13,fontFamily:"var(--mono)",color:c,fontWeight:600}}>{v?.toFixed(3)||"—"}</div>
                    </div>
                  ))}
                  <div style={{fontSize:9,fontFamily:"var(--mono)",color:lastBar.macd>0?"var(--up)":"var(--down)",padding:"2px 7px",border:`0.5px solid ${lastBar.macd>0?"var(--up)":"var(--down)"}`,borderRadius:3}}>
                    {lastBar.macd>0?"BULLISH":"BEARISH"}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* NEWS FULL PAGE OVERLAY — triggered by top bar button */}
        {showNews&&(
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"var(--bg)",zIndex:200,display:"flex",flexDirection:"column",animation:"fadeUp 0.2s ease"}}>
            {/* News overlay header */}
            <div style={{background:"var(--bg2)",borderBottom:"0.5px solid var(--border)",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <span style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:600,color:"var(--text)",letterSpacing:"0.1em"}}>MARKET NEWS</span>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>setNewsTab("market")}
                    style={{padding:"4px 14px",fontSize:9,fontFamily:"var(--mono)",background:newsTab==="market"?"var(--accent)":"transparent",color:newsTab==="market"?"#000":"var(--text3)",border:`0.5px solid ${newsTab==="market"?"var(--accent)":"var(--border)"}`,borderRadius:4,cursor:"pointer",letterSpacing:"0.08em"}}>
                    MARKET
                  </button>
                  <button onClick={()=>setNewsTab("stock")}
                    style={{padding:"4px 14px",fontSize:9,fontFamily:"var(--mono)",background:newsTab==="stock"?"var(--accent)":"transparent",color:newsTab==="stock"?"#000":"var(--text3)",border:`0.5px solid ${newsTab==="stock"?"var(--accent)":"var(--border)"}`,borderRadius:4,cursor:"pointer",letterSpacing:"0.08em"}}>
                    {selected}
                  </button>
                </div>
              </div>
              <button onClick={()=>setShowNews(false)}
                style={{background:"transparent",border:"0.5px solid var(--border2)",borderRadius:4,color:"var(--text2)",cursor:"pointer",padding:"6px 14px",fontSize:11,fontFamily:"var(--mono)",display:"flex",alignItems:"center",gap:6}}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                CLOSE
              </button>
            </div>

            {/* News content — two column layout */}
            <div style={{flex:1,overflow:"hidden",display:"grid",gridTemplateColumns:newsTab==="market"?"1fr 1fr":"1fr",gap:0}}>

              {/* Market news column */}
              {newsTab==="market"&&(
                <div style={{borderRight:"0.5px solid var(--border)",overflowY:"auto",padding:"20px 24px"}}>
                  <div style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)",letterSpacing:"0.12em",marginBottom:16}}>TOP MARKET STORIES</div>
                  {marketNewsLoading
                    ? Array.from({length:6}).map((_,i)=><div key={i} style={{height:80,background:"var(--bg3)",borderRadius:6,animation:"pulse 1.5s infinite",marginBottom:12}}/>)
                    : marketNews.length===0
                    ? <div style={{color:"var(--text3)",fontFamily:"var(--mono)",fontSize:11,padding:40,textAlign:"center"}}>Loading market news...</div>
                    : marketNews.map((a,i)=>{
                        const secColor=SECTOR_COLORS[ALL_STOCKS.find(s=>s.sym===a.symbol)?.sector||"Tech"]||"#5B8DEF";
                        const timeAgo=(()=>{
                        if(!a.published) return "";
                        try {
                          const ts = isNaN(Number(a.published))
                            ? Math.floor(new Date(a.published).getTime()/1000)
                            : Number(a.published);
                          const hrs = Math.floor((Date.now()/1000 - ts)/3600);
                          if(hrs < 0 || hrs > 9999) return "";
                          return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs/24)}d ago`;
                        } catch { return ""; }
                      })();
                        return(
                          <div key={i} style={{marginBottom:16,padding:"14px",background:"var(--bg2)",borderRadius:8,border:"0.5px solid var(--border)",display:"flex",gap:12,transition:"border-color 0.15s",animation:`fadeUp 0.3s ease ${i*0.04}s both`}}
                            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--border2)"}
                            onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                            {a.thumbnail&&(
                              <img src={a.thumbnail} alt="" style={{width:80,height:60,objectFit:"cover",borderRadius:6,flexShrink:0}}
                                onError={e=>{e.currentTarget.style.display="none";}}/>
                            )}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                                <span style={{fontSize:8,fontFamily:"var(--mono)",padding:"2px 6px",background:`${secColor}20`,color:secColor,borderRadius:3,fontWeight:600}}>{a.symbol}</span>
                                <span style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--mono)"}}>{a.source}</span>
                                {timeAgo&&<span style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--mono)",marginLeft:"auto"}}>{timeAgo}</span>}
                              </div>
                              <a href={a.url||"#"} target="_blank" rel="noreferrer"
                                style={{fontSize:13,color:"var(--text)",lineHeight:1.55,textDecoration:"none",display:"block",fontWeight:500}}
                                onMouseEnter={e=>e.target.style.color="var(--accent)"}
                                onMouseLeave={e=>e.target.style.color="var(--text)"}>
                                {a.title}
                              </a>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              )}

              {/* Stock-specific news column */}
              {newsTab==="market"&&(
                <div style={{overflowY:"auto",padding:"20px 24px"}}>
                  <div style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)",letterSpacing:"0.12em",marginBottom:16}}>{selected} — SENTIMENT NEWS</div>
                  {stockNewsLoading
                    ? Array.from({length:5}).map((_,i)=><div key={i} style={{height:80,background:"var(--bg3)",borderRadius:6,animation:"pulse 1.5s infinite",marginBottom:12}}/>)
                    : stockNews.length===0
                    ? <div style={{color:"var(--text3)",fontFamily:"var(--mono)",fontSize:11,padding:40,textAlign:"center",lineHeight:2}}>No sentiment news for {selected}.<br/>Alpha Vantage free tier may be rate limited.</div>
                    : stockNews.map((a,i)=>{
                        const score=parseFloat(a.overall_sentiment_score||0);
                        return(
                          <div key={i} style={{marginBottom:16,padding:"14px",background:"var(--bg2)",borderRadius:8,border:"0.5px solid var(--border)",animation:`fadeUp 0.3s ease ${i*0.05}s both`}}>
                            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                              <SentimentBadge label={a.overall_sentiment_label} score={a.overall_sentiment_score}/>
                              <span style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--mono)"}}>{a.source}</span>
                              {score !== 0 && <span style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--mono)",marginLeft:"auto"}}>Score: {score.toFixed(3)}</span>}
                            </div>
                            <a href={a.url||"#"} target="_blank" rel="noreferrer"
                              style={{fontSize:13,color:"var(--text)",lineHeight:1.55,textDecoration:"none",display:"block",fontWeight:500}}
                              onMouseEnter={e=>e.target.style.color="var(--accent)"}
                              onMouseLeave={e=>e.target.style.color="var(--text)"}>
                              {a.title}
                            </a>
                          </div>
                        );
                      })
                  }
                </div>
              )}

              {/* Single column stock news view */}
              {newsTab==="stock"&&(
                <div style={{overflowY:"auto",padding:"20px 24px",maxWidth:800,margin:"0 auto",width:"100%"}}>
                  <div style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)",letterSpacing:"0.12em",marginBottom:16}}>{selected} — SENTIMENT & NEWS ANALYSIS</div>
                  {stockNewsLoading
                    ? Array.from({length:5}).map((_,i)=><div key={i} style={{height:80,background:"var(--bg3)",borderRadius:6,animation:"pulse 1.5s infinite",marginBottom:12}}/>)
                    : stockNews.length===0
                    ? <div style={{color:"var(--text3)",fontFamily:"var(--mono)",fontSize:11,padding:40,textAlign:"center",lineHeight:2}}>No sentiment news for {selected}.<br/>Alpha Vantage free tier may be rate limited.</div>
                    : stockNews.map((a,i)=>{
                        const score=parseFloat(a.overall_sentiment_score||0);
                        const color=score>0.15?"var(--up)":score<-0.15?"var(--down)":"var(--text3)";
                        return(
                          <div key={i} style={{marginBottom:16,padding:"16px",background:"var(--bg2)",borderRadius:8,border:"0.5px solid var(--border)",display:"flex",gap:12,animation:`fadeUp 0.3s ease ${i*0.05}s both`}}>
                            <div style={{width:4,borderRadius:2,background:color,flexShrink:0,alignSelf:"stretch"}}/>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                                <SentimentBadge label={a.overall_sentiment_label} score={a.overall_sentiment_score}/>
                                <span style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--mono)"}}>{a.source}</span>
                                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}>
                                  <div style={{width:40,height:4,background:"var(--bg3)",borderRadius:2,overflow:"hidden"}}>
                                    <div style={{height:"100%",width:`${Math.abs(score)*100}%`,background:color,borderRadius:2}}/>
                                  </div>
                                  <span style={{fontSize:9,color,fontFamily:"var(--mono)"}}>{score.toFixed(3)}</span>
                                </div>
                              </div>
                              <a href={a.url||"#"} target="_blank" rel="noreferrer"
                                style={{fontSize:13,color:"var(--text)",lineHeight:1.6,textDecoration:"none",display:"block",fontWeight:500}}
                                onMouseEnter={e=>e.target.style.color="var(--accent)"}
                                onMouseLeave={e=>e.target.style.color="var(--text)"}>
                                {a.title}
                              </a>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — AI CHAT */}
      <div style={{background:"var(--bg2)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 14px",borderBottom:"0.5px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"var(--up)",animation:"pulse 2s infinite"}}/>
          <span style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--text3)",letterSpacing:"0.1em"}}>AI ANALYST · GROQ / LLAMA 3</span>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
          {chatMessages.map((m,i)=>(
            <div key={i} style={{animation:"fadeUp 0.3s ease",display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
              {m.agent&&<div style={{fontSize:7,color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:3,letterSpacing:"0.1em"}}>[{m.agent.toUpperCase()} AGENT{m.symbol?` · ${m.symbol}`:""}]</div>}
              <div style={{maxWidth:"90%",padding:"9px 12px",background:m.role==="user"?"rgba(91,141,239,0.1)":"var(--bg3)",border:`0.5px solid ${m.role==="user"?"rgba(91,141,239,0.25)":"var(--border)"}`,borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",fontSize:12,lineHeight:1.65,color:m.role==="user"?"#93C5FD":"var(--text)",fontFamily:"var(--sans)",whiteSpace:"pre-wrap"}}>
                {m.content}
              </div>
            </div>
          ))}
          {chatLoading&&(
            <div style={{display:"flex",gap:5,padding:"6px 10px"}}>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"var(--accent)",animation:"pulse 1.2s ease infinite",animationDelay:`${i*0.2}s`}}/>)}
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>
        <div style={{padding:"6px 10px",borderTop:"0.5px solid var(--border)",display:"flex",gap:4,flexWrap:"wrap"}}>
          {[`Analyze ${selected} technically`,`News for ${selected}`,"Portfolio risk","Market overview"].map((p,i)=>(
            <button key={i} onClick={()=>setChatInput(p)}
              style={{padding:"3px 8px",fontSize:8,fontFamily:"var(--mono)",background:"transparent",border:"0.5px solid var(--border2)",borderRadius:3,color:"var(--text2)",cursor:"pointer",whiteSpace:"nowrap"}}>
              {p}
            </button>
          ))}
        </div>
        <div style={{padding:"10px",borderTop:"0.5px solid var(--border)",display:"flex",gap:8}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}
            placeholder="Ask about any stock..."
            style={{flex:1,background:"var(--bg3)",border:"0.5px solid var(--border2)",borderRadius:6,padding:"8px 12px",color:"var(--text)",fontSize:12,fontFamily:"var(--sans)",outline:"none"}}/>
          <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()}
            style={{padding:"8px 14px",background:chatLoading||!chatInput.trim()?"var(--bg3)":"var(--accent)",color:chatLoading||!chatInput.trim()?"var(--text3)":"#000",border:"none",borderRadius:6,fontSize:9,fontWeight:700,cursor:chatLoading||!chatInput.trim()?"default":"pointer",fontFamily:"var(--mono)",letterSpacing:"0.08em"}}>
            SEND
          </button>
        </div>
      </div>

      {/* NEWS TICKER TAPE */}
      <div style={{gridColumn:"1/-1",background:"#080E1C",borderTop:"0.5px solid var(--border)",height:28,overflow:"hidden",display:"flex",alignItems:"center"}}>
        <div style={{background:"var(--accent2)",padding:"0 10px",height:"100%",display:"flex",alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:9,fontFamily:"var(--mono)",fontWeight:600,color:"#fff",letterSpacing:"0.1em"}}>LIVE</span>
        </div>
        <div style={{flex:1,overflow:"hidden"}}>
          {tickerLines.length===0
            ? <span style={{padding:"0 16px",fontSize:10,color:"var(--text3)",fontFamily:"var(--mono)"}}>Loading headlines...</span>
            : <div style={{display:"inline-flex",animation:"ticker 50s linear infinite",whiteSpace:"nowrap"}}>
                {[...tickerLines,...tickerLines].map((h,i)=>(
                  <span key={i} style={{display:"inline-flex",alignItems:"center",padding:"0 24px",gap:8,borderRight:"0.5px solid var(--border)"}}>
                    <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--accent)",fontWeight:600}}>{h.symbol}</span>
                    <span style={{fontSize:11,color:"var(--text2)"}}>{h.title}</span>
                  </span>
                ))}
              </div>
          }
        </div>
      </div>

    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  return (
    <ErrorBoundary>
      <DashboardInner user={user} onLogout={onLogout}/>
    </ErrorBoundary>
  );
}