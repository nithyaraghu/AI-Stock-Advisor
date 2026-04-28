import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from "recharts";

/* ─── FONTS & GLOBAL STYLES ─────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Manrope:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:        #0A0F1E;
      --bg2:       #0F1629;
      --bg3:       #141D35;
      --border:    rgba(99,140,210,0.1);
      --border2:   rgba(99,140,210,0.18);
      --accent:    #5B8DEF;
      --accent2:   #3D6FD4;
      --warn:      #C4922A;
      --up:        #4CAF8A;
      --down:      #C75B6A;
      --text:      #D6E0F5;
      --text2:     #6B82AA;
      --text3:     #2E3F62;
      --mono:      'Space Mono', monospace;
      --sans:      'Manrope', sans-serif;
    }
    body { background: var(--bg); color: var(--text); font-family: var(--sans); }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(400px)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    html, body, #root { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; }
    .fade-up { animation: fadeUp 0.4s ease both; }
  `}</style>
);

/* ─── CONFIG ─────────────────────────────────────────────────── */
const BACKEND = "http://127.0.0.1:5000";
const USER_ID = "f079611d-7a90-4792-9774-392cdab1695b"; // replace with real user UUID

const WATCHLIST = [
  { sym: "AAPL",  name: "Apple",        flag: "🇺🇸" },
  { sym: "NVDA",  name: "NVIDIA",       flag: "🇺🇸" },
  { sym: "MSFT",  name: "Microsoft",    flag: "🇺🇸" },
  { sym: "GOOGL", name: "Alphabet",     flag: "🇺🇸" },
  { sym: "INFY",  name: "Infosys",      flag: "🇮🇳" },
  { sym: "WIT",   name: "Wipro",        flag: "🇮🇳" },
  { sym: "HDB",   name: "HDFC Bank",    flag: "🇮🇳" },
];

/* ─── MOCK DATA (replaced by real API in production) ─────────── */
function mockPrices(base, n = 60) {
  let p = base;
  return Array.from({ length: n }, (_, i) => {
    p = p * (1 + (Math.random() - 0.485) * 0.018);
    const rsi = 30 + Math.random() * 50;
    const macd = (Math.random() - 0.48) * 4;
    return {
      day: i,
      price: +p.toFixed(2),
      volume: Math.floor(Math.random() * 80 + 20) * 1e6,
      rsi: +rsi.toFixed(1),
      macd: +macd.toFixed(3),
      signal: +(macd * 0.85 + (Math.random() - 0.5) * 0.3).toFixed(3),
    };
  });
}

const BASE_PRICES = { AAPL:189, NVDA:875, MSFT:415, GOOGL:175, INFY:18, WIT:6, HDB:62 };

/* ─── SPARKLINE ──────────────────────────────────────────────── */
const Spark = ({ data, up, w = 72, h = 28 }) => {
  const prices = data.map(d => d.price);
  const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1;
  const pts = prices.map((p, i) =>
    `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * (h - 2) - 1}`
  ).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "#4CAF8A" : "#C75B6A"} stopOpacity={0.15} />
          <stop offset="100%" stopColor={up ? "#4CAF8A" : "#C75B6A"} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={up ? "#00E676" : "#FF3D57"} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

/* ─── RSI GAUGE ──────────────────────────────────────────────── */
const RSIGauge = ({ value }) => {
  if (!value) return null;
  const color = value > 70 ? "#FF3D57" : value < 30 ? "#00E676" : "#00FFB2";
  const label = value > 70 ? "OVERBOUGHT" : value < 30 ? "OVERSOLD" : "NEUTRAL";
  const pct = (value / 100) * 100;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--mono)", letterSpacing: "0.1em", marginBottom: 6 }}>RSI (14)</div>
      <div style={{ position: "relative", height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, #3D6FD4, ${color})`, borderRadius: 3, transition: "width 0.8s ease" }} />
        {/* Zone markers */}
        <div style={{ position: "absolute", left: "30%", top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.2)" }} />
        <div style={{ position: "absolute", left: "70%", top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.2)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color }}>{value}</span>
        <span style={{ fontSize: 9, color, fontFamily: "var(--mono)", letterSpacing: "0.08em", padding: "2px 6px", border: `0.5px solid ${color}`, borderRadius: 3 }}>{label}</span>
      </div>
    </div>
  );
};

/* ─── CUSTOM TOOLTIP ─────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg2)", border: "0.5px solid var(--border2)", borderRadius: 8, padding: "8px 12px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>
      <div style={{ color: "var(--text)", marginBottom: 4 }}>Day {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}</div>
      ))}
    </div>
  );
};

/* ─── SENTIMENT BADGE ────────────────────────────────────────── */
const SentimentBadge = ({ label }) => {
  const cfg = {
    "Bullish":         { color: "#00E676", bg: "rgba(0,230,118,0.1)" },
    "Somewhat-Bullish":{ color: "#00E676", bg: "rgba(0,230,118,0.07)" },
    "Bearish":         { color: "#FF3D57", bg: "rgba(255,61,87,0.1)" },
    "Somewhat-Bearish":{ color: "#FF3D57", bg: "rgba(255,61,87,0.07)" },
    "Neutral":         { color: "#7A8BAA", bg: "rgba(122,139,170,0.1)" },
  };
  const c = cfg[label] || cfg["Neutral"];
  return (
    <span style={{ fontSize: 9, fontFamily: "var(--mono)", padding: "2px 7px", borderRadius: 3, background: c.bg, color: c.color, border: `0.5px solid ${c.color}`, letterSpacing: "0.06em" }}>
      {label?.toUpperCase()}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [selected, setSelected]   = useState("AAPL");
  const [priceData, setPriceData] = useState({});
  const [livePrice, setLivePrice] = useState({});
  const [news, setNews]           = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI analyst. Ask me about any stock — RSI, news, portfolio analysis, or market sentiment." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeChart, setActiveChart] = useState("price");
  const [tab, setTab]             = useState("chart");
  const chatEndRef = useRef(null);

  // Generate mock price data
  useEffect(() => {
    const d = {};
    WATCHLIST.forEach(({ sym }) => { d[sym] = mockPrices(BASE_PRICES[sym]); });
    setPriceData(d);
    const prices = {};
    WATCHLIST.forEach(({ sym }) => {
      const arr = d[sym];
      prices[sym] = { price: arr[arr.length-1].price, prev: arr[0].price };
    });
    setLivePrice(prices);
  }, []);

  // Fetch news from backend
  useEffect(() => {
    setNewsLoading(true);
    fetch(`${BACKEND}/stocks/news?symbol=${selected}`)
      .then(r => r.json())
      .then(data => {
        const feed = data.feed || [];
        setNews(feed.slice(0, 8));
      })
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [selected]);

  // Fetch portfolio
  useEffect(() => {
    fetch(`${BACKEND}/user-details/test@test.com`)
      .then(r => r.json())
      .then(data => setPortfolio(data.portfolio || []))
      .catch(() => {});
  }, []);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Live price simulation
  useEffect(() => {
    const t = setInterval(() => {
      setLivePrice(prev => {
        const next = { ...prev };
        WATCHLIST.forEach(({ sym }) => {
          if (next[sym]) next[sym] = { ...next[sym], price: +(next[sym].price * (1 + (Math.random()-0.499)*0.001)).toFixed(2) };
        });
        return next;
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(p => [...p, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID, message: msg })
      });
      const data = await res.json();
      setChatMessages(p => [...p, {
        role: "assistant",
        content: data.response || "No response.",
        agent: data.agent_used,
        symbol: data.symbol,
      }]);
    } catch (e) {
      setChatMessages(p => [...p, { role: "assistant", content: "Connection error — is the Flask backend running?" }]);
    }
    setChatLoading(false);
  }, [chatInput, chatLoading]);

  const current    = priceData[selected] || [];
  const latestRSI  = current[current.length - 1]?.rsi;
  const latestMACD = current[current.length - 1]?.macd;
  const live       = livePrice[selected] || {};
  const changePct  = live.prev ? (((live.price - live.prev) / live.prev) * 100).toFixed(2) : "0.00";
  const isUp       = parseFloat(changePct) >= 0;

  const quickPrompts = [
    `Analyze ${selected} technically`,
    `Sentiment for ${selected}`,
    "Check my portfolio risk",
    "Market overview today",
  ];

  return (
    <div style={{ fontFamily: "var(--sans)", background: "var(--bg)", width: "100vw", display: "grid", gridTemplateColumns: "clamp(200px, 18vw, 280px) 1fr clamp(280px, 24vw, 380px)", gridTemplateRows: "clamp(44px, 4vh, 60px) 1fr", height: "100vh", overflow: "hidden" }}>
      <Styles />

      {/* ── TOP BAR ── */}
      <div style={{ gridColumn: "1/-1", background: "var(--bg2)", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", padding: "0 20px", gap: 20, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)", animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: "clamp(11px, 1vw, 14px)", fontWeight: 700, color: "var(--text)", letterSpacing: "0.12em" }}>MARKET INTELLIGENCE</span>
          <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)", padding: "2px 6px", border: "0.5px solid var(--border2)", borderRadius: 3 }}>LIVE</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["S&P 500", "+0.87%", true], ["NASDAQ", "+1.24%", true], ["VIX", "14.82", false], ["10Y", "4.38%", false]].map(([n, v, u]) => (
            <div key={n} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)" }}>{n}</div>
              <div style={{ fontSize: 11, color: u ? "var(--up)" : "var(--down)", fontFamily: "var(--mono)" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>

      {/* ── LEFT PANEL — WATCHLIST ── */}
      <div style={{ background: "var(--bg2)", borderRight: "0.5px solid var(--border)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 14px 8px", fontSize: 9, fontFamily: "var(--mono)", color: "var(--text3)", letterSpacing: "0.12em" }}>WATCHLIST</div>
        {WATCHLIST.map(({ sym, name, flag }) => {
          const lp   = livePrice[sym] || {};
          const chg  = lp.prev ? (((lp.price - lp.prev) / lp.prev) * 100).toFixed(2) : "0.00";
          const up   = parseFloat(chg) >= 0;
          const data = priceData[sym] || [];
          const isSel = sym === selected;
          return (
            <div key={sym} onClick={() => setSelected(sym)}
              style={{ padding: "10px 14px", cursor: "pointer", borderLeft: `2px solid ${isSel ? "var(--accent)" : "transparent"}`, background: isSel ? "rgba(91,141,239,0.06)" : "transparent", transition: "all 0.15s", borderBottom: "0.5px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: "clamp(11px, 1vw, 14px)", fontFamily: "var(--mono)", fontWeight: 700, color: isSel ? "var(--accent)" : "var(--text)" }}>{flag} {sym}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--text)" }}>${lp.price?.toFixed(2)}</div>
                  <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: up ? "var(--up)" : "var(--down)" }}>{up ? "▲" : "▼"}{Math.abs(chg)}%</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Spark data={data.slice(-20)} up={up} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CENTER PANEL ── */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "0.5px solid var(--border)" }}>
        {/* Stock header */}
        <div style={{ padding: "10px 16px 8px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{selected}</span>
              <span style={{ fontSize: "clamp(20px, 2.2vw, 32px)", fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text)" }}>${live.price?.toFixed(2)}</span>
              <span style={{ fontSize: 14, fontFamily: "var(--mono)", color: isUp ? "var(--up)" : "var(--down)" }}>
                {isUp ? "▲" : "▼"} {Math.abs(changePct)}%
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["chart", "news"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "5px 12px", fontSize: 10, fontFamily: "var(--mono)", background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "#000" : "var(--text3)", border: `0.5px solid ${tab === t ? "var(--accent)" : "var(--border)"}`, borderRadius: 4, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "chart" && (
          <>
            {/* Chart type selector */}
            <div style={{ padding: "5px 16px", display: "flex", gap: 4, borderBottom: "0.5px solid var(--border)" }}>
              {["price", "rsi", "macd", "volume"].map(c => (
                <button key={c} onClick={() => setActiveChart(c)}
                  style={{ padding: "3px 10px", fontSize: 9, fontFamily: "var(--mono)", background: activeChart === c ? "var(--bg3)" : "transparent", color: activeChart === c ? "var(--accent)" : "var(--text3)", border: `0.5px solid ${activeChart === c ? "var(--border2)" : "transparent"}`, borderRadius: 3, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {c}
                </button>
              ))}
            </div>

            {/* Main chart */}
            <div style={{ flex: 1, padding: "8px 8px 0px", minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                {activeChart === "price" ? (
                  <AreaChart data={current} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isUp ? "#4CAF8A" : "#C75B6A"} stopOpacity={0.06} />
                        <stop offset="95%" stopColor={isUp ? "#4CAF8A" : "#C75B6A"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" hide />
                    <YAxis tick={{ fill: "var(--text3)", fontSize: 9, fontFamily: "var(--mono)" }} tickLine={false} axisLine={false} width={55} tickFormatter={v => `$${v}`} domain={["dataMin * 0.995", "dataMax * 1.005"]} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="price" stroke={isUp ? "var(--up)" : "var(--down)"} strokeWidth={1.5} fill="url(#pg)" dot={false} />
                  </AreaChart>
                ) : activeChart === "rsi" ? (
                  <LineChart data={current} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" hide />
                    <YAxis domain={[0, 100]} tick={{ fill: "var(--text3)", fontSize: 9, fontFamily: "var(--mono)" }} tickLine={false} axisLine={false} width={35} />
                    <Tooltip content={<ChartTip />} />
                    <ReferenceLine y={70} stroke="#FF3D57" strokeDasharray="3 3" strokeWidth={0.8} label={{ value: "70", fill: "#FF3D57", fontSize: 8, fontFamily: "var(--mono)" }} />
                    <ReferenceLine y={30} stroke="#00E676" strokeDasharray="3 3" strokeWidth={0.8} label={{ value: "30", fill: "#00E676", fontSize: 8, fontFamily: "var(--mono)" }} />
                    <Line type="monotone" dataKey="rsi" stroke="var(--accent)" strokeWidth={2} dot={false} name="RSI" />
                  </LineChart>
                ) : activeChart === "macd" ? (
                  <LineChart data={current} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" hide />
                    <YAxis tick={{ fill: "var(--text3)", fontSize: 9, fontFamily: "var(--mono)" }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip content={<ChartTip />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                    <Line type="monotone" dataKey="macd" stroke="#00FFB2" strokeWidth={1.5} dot={false} name="MACD" />
                    <Line type="monotone" dataKey="signal" stroke="#FF6B35" strokeWidth={1} dot={false} strokeDasharray="3 2" name="Signal" />
                  </LineChart>
                ) : (
                  <BarChart data={current} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="volume" fill="var(--accent2)" opacity={0.4} radius={[1, 1, 0, 0]} name="Volume" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Stats row */}
            <div style={{ padding: "6px 16px 8px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <RSIGauge value={latestRSI} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 6 }}>MACD</div>
                <div style={{ display: "flex", gap: 14 }}>
                  {[["MACD", latestMACD, "var(--accent)"], ["Signal", current[current.length-1]?.signal, "var(--warn)"]].map(([l, v, c]) => (
                    <div key={l}>
                      <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)" }}>{l}</div>
                      <div style={{ fontSize: 14, fontFamily: "var(--mono)", color: c, fontWeight: 700 }}>{v?.toFixed(3)}</div>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)" }}>Signal</div>
                    <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: latestMACD > 0 ? "var(--up)" : "var(--down)", padding: "2px 6px", border: `0.5px solid ${latestMACD > 0 ? "var(--up)" : "var(--down)"}`, borderRadius: 3, marginTop: 2 }}>
                      {latestMACD > 0 ? "BULLISH" : "BEARISH"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "news" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
            {newsLoading ? (
              <div style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11, padding: 20 }}>Loading news...</div>
            ) : news.length === 0 ? (
              <div style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11, padding: 20 }}>No news available — check your Alpha Vantage API key.</div>
            ) : (
              news.map((article, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: "0.5px solid var(--border)", animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <SentimentBadge label={article.overall_sentiment_label} />
                    <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)" }}>{article.source}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, marginBottom: 4 }}>{article.title}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                    Score: <span style={{ color: parseFloat(article.overall_sentiment_score) > 0 ? "var(--up)" : "var(--down)" }}>
                      {parseFloat(article.overall_sentiment_score || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL — AI CHAT ── */}
      <div style={{ background: "var(--bg2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--up)", animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: "0.12em" }}>AI ANALYST — GROQ / LLAMA 3</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
          {chatMessages.map((m, i) => (
            <div key={i} style={{ animation: "fadeUp 0.3s ease", display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.agent && (
                <div style={{ fontSize: 8, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 3, letterSpacing: "0.1em" }}>
                  [{m.agent.toUpperCase()} AGENT{m.symbol ? ` · ${m.symbol}` : ""}]
                </div>
              )}
              <div style={{
                maxWidth: "90%", padding: "9px 12px",
                background: m.role === "user" ? "rgba(0,144,255,0.1)" : "var(--bg3)",
                border: `0.5px solid ${m.role === "user" ? "rgba(0,144,255,0.3)" : "var(--border)"}`,
                borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                fontSize: 12, lineHeight: 1.65, color: m.role === "user" ? "#93C5FD" : "var(--text)",
                fontFamily: "var(--sans)",
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: "flex", gap: 5, padding: "8px 12px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1.2s ease infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ padding: "6px 10px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 5, flexWrap: "wrap" }}>
          {quickPrompts.map((p, i) => (
            <button key={i} onClick={() => setChatInput(p)}
              style={{ padding: "3px 8px", fontSize: 9, fontFamily: "var(--mono)", background: "transparent", border: "0.5px solid var(--border2)", borderRadius: 3, color: "var(--text2)", cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "10px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8 }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendChat()}
            placeholder="Ask about any stock..."
            style={{ flex: 1, background: "var(--bg3)", border: "0.5px solid var(--border2)", borderRadius: 6, padding: "8px 12px", color: "var(--text)", fontSize: 12, fontFamily: "var(--sans)", outline: "none" }}
          />
          <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
            style={{ padding: "8px 14px", background: chatLoading || !chatInput.trim() ? "var(--bg3)" : "var(--accent)", color: chatLoading || !chatInput.trim() ? "var(--text3)" : "#000", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: chatLoading || !chatInput.trim() ? "default" : "pointer", fontFamily: "var(--mono)", letterSpacing: "0.08em" }}>
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}