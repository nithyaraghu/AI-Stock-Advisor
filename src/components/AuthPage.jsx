import { useState } from "react";

const BACKEND = "http://127.0.0.1:5000";

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { width: 100%; height: 100%; background: #0A0F1E; }
    :root {
      --bg:#0A0F1E; --bg2:#0F1629; --bg3:#141D35; --bg4:#1A2440;
      --border:rgba(99,140,210,0.12); --border2:rgba(99,140,210,0.25);
      --accent:#5B8DEF; --accent2:#3D6FD4;
      --up:#4CAF8A; --down:#C75B6A;
      --text:#D6E0F5; --text2:#6B82AA; --text3:#2E3F62;
      --mono:'IBM Plex Mono',monospace; --sans:'IBM Plex Sans',sans-serif;
    }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes drift    { 0%,100%{transform:translateY(0px) translateX(0px)} 33%{transform:translateY(-12px) translateX(6px)} 66%{transform:translateY(8px) translateX(-4px)} }
    @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes blink    { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} 99%{opacity:0} }
    input:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #141D35 inset !important; -webkit-text-fill-color:#D6E0F5 !important; }
  `}</style>
);

/* ── Background grid animation ───────────────────────────────── */
const GridBg = () => (
  <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
    {/* Grid lines */}
    <svg width="100%" height="100%" style={{position:"absolute",inset:0,opacity:0.04}}>
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#5B8DEF" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)"/>
    </svg>
    {/* Floating orbs */}
    {[
      {x:"10%",y:"20%",size:300,color:"#5B8DEF",delay:"0s",dur:"8s"},
      {x:"80%",y:"60%",size:200,color:"#3D6FD4",delay:"2s",dur:"10s"},
      {x:"50%",y:"80%",size:150,color:"#4CAF8A",delay:"4s",dur:"7s"},
    ].map((o,i)=>(
      <div key={i} style={{
        position:"absolute",left:o.x,top:o.y,
        width:o.size,height:o.size,
        borderRadius:"50%",
        background:`radial-gradient(circle, ${o.color}18 0%, transparent 70%)`,
        animation:`drift ${o.dur} ease-in-out infinite`,
        animationDelay:o.delay,
        transform:"translate(-50%,-50%)",
      }}/>
    ))}
    {/* Ticker-like lines at the bottom */}
    <div style={{position:"absolute",bottom:40,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(91,141,239,0.2),transparent)"}}/>
    <div style={{position:"absolute",bottom:60,left:0,right:0,height:0.5,background:"linear-gradient(90deg,transparent,rgba(91,141,239,0.1),transparent)"}}/>
  </div>
);

/* ── Ticker symbols decoration ───────────────────────────────── */
const TickerDecor = () => {
  const symbols = ["AAPL +2.3%","NVDA +4.1%","MSFT +1.8%","GOOGL +0.9%","TSLA -1.2%","META +3.4%","SPY +0.8%","QQQ +1.5%"];
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,height:28,overflow:"hidden",background:"rgba(8,14,28,0.8)",borderTop:"0.5px solid var(--border)",display:"flex",alignItems:"center",zIndex:1}}>
      <div style={{display:"inline-flex",animation:"shimmer 20s linear infinite",backgroundSize:"200% 100%"}}>
        {[...symbols,...symbols,...symbols].map((s,i)=>{
          const isUp = s.includes("+");
          return (
            <span key={i} style={{padding:"0 24px",fontSize:11,fontFamily:"var(--mono)",color:isUp?"var(--up)":"var(--down)",whiteSpace:"nowrap",borderRight:"0.5px solid var(--border)"}}>
              {s}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main Auth Component ─────────────────────────────────────── */
export default function AuthPage({ onLogin }) {
  const [mode,     setMode]     = useState("login"); // "login" | "signup"
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  // Login fields
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [name,       setName]       = useState("");
  const [signEmail,  setSignEmail]  = useState("");
  const [signPass,   setSignPass]   = useState("");
  const [goal,       setGoal]       = useState("growth");
  const [risk,       setRisk]       = useState("medium");
  const [horizon,    setHorizon]    = useState("1-3 years");

  const handleLogin = async e => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res  = await fetch(`${BACKEND}/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Fetch user details to get UUID
        const detailRes  = await fetch(`${BACKEND}/user-details/${email}`);
        const detailData = await detailRes.json();
        // Store in localStorage
        localStorage.setItem("mi_user", JSON.stringify({
          email:    data.email,
          username: data.username,
          userId:   detailData.userId || detailData.id || email,
        }));
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => onLogin({
          email:    data.email,
          username: data.username,
          userId:   detailData.userId || detailData.id || email,
        }), 800);
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Cannot connect to server — is Flask running?");
    }
    setLoading(false);
  };

  const handleSignup = async e => {
    e.preventDefault();
    if (!name || !signEmail || !signPass) { setError("Please fill in all required fields"); return; }
    if (signPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res  = await fetch(`${BACKEND}/signup`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          username:      name,
          email:         signEmail,
          password:      signPass,
          gender:        "",
          age:           "",
          investmentGoal: goal,
          riskAppetite:  risk,
          timeHorizon:   horizon,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Account created! Please log in.");
        setTimeout(() => {
          setMode("login");
          setEmail(signEmail);
          setError(""); setSuccess("");
        }, 1200);
      } else {
        setError(data.message || "Signup failed");
      }
    } catch {
      setError("Cannot connect to server — is Flask running?");
    }
    setLoading(false);
  };

  const inputStyle = {
    width:"100%", background:"var(--bg3)", border:"0.5px solid var(--border2)",
    borderRadius:6, padding:"10px 14px", color:"var(--text)", fontSize:13,
    fontFamily:"var(--sans)", outline:"none", transition:"border-color 0.2s",
  };

  const labelStyle = {
    fontSize:10, fontFamily:"var(--mono)", color:"var(--text3)",
    letterSpacing:"0.1em", marginBottom:5, display:"block",
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--sans)",position:"relative",paddingBottom:40}}>
      <Styles/>
      <GridBg/>
      <TickerDecor/>

      {/* Card */}
      <div style={{
        position:"relative",zIndex:10,
        width:"100%",maxWidth:420,margin:"0 20px",
        animation:"fadeUp 0.5s ease both",
      }}>
        {/* Logo area */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",boxShadow:"0 0 12px var(--accent)",animation:"pulse 2s infinite"}}/>
            <span style={{fontFamily:"var(--mono)",fontSize:16,fontWeight:600,color:"var(--text)",letterSpacing:"0.15em"}}>MARKET INTELLIGENCE</span>
          </div>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",letterSpacing:"0.08em"}}>AI-POWERED STOCK ADVISOR</div>
        </div>

        {/* Card box */}
        <div style={{background:"var(--bg2)",border:"0.5px solid var(--border2)",borderRadius:12,overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.4)"}}>
          {/* Tabs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"0.5px solid var(--border)"}}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}}
                style={{
                  padding:"14px",fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.12em",
                  textTransform:"uppercase",cursor:"pointer",border:"none",
                  background:mode===m?"var(--bg3)":"transparent",
                  color:mode===m?"var(--accent)":"var(--text3)",
                  borderBottom:`2px solid ${mode===m?"var(--accent)":"transparent"}`,
                  transition:"all 0.2s",
                }}>
                {m==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>

          <div style={{padding:"28px 28px 24px"}}>
            {/* Error / Success */}
            {error&&(
              <div style={{background:"rgba(199,91,106,0.1)",border:"0.5px solid rgba(199,91,106,0.3)",borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--down)",fontFamily:"var(--sans)"}}>
                {error}
              </div>
            )}
            {success&&(
              <div style={{background:"rgba(76,175,138,0.1)",border:"0.5px solid rgba(76,175,138,0.3)",borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--up)",fontFamily:"var(--sans)"}}>
                {success}
              </div>
            )}

            {/* LOGIN FORM */}
            {mode==="login"&&(
              <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:16}}>
                <div>
                  <label style={labelStyle}>EMAIL</label>
                  <input value={email} onChange={e=>setEmail(e.target.value)}
                    type="email" placeholder="your@email.com" style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="var(--accent)"}
                    onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
                </div>
                <div>
                  <label style={labelStyle}>PASSWORD</label>
                  <input value={password} onChange={e=>setPassword(e.target.value)}
                    type="password" placeholder="••••••••" style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="var(--accent)"}
                    onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
                </div>
                <button type="submit" disabled={loading}
                  style={{
                    marginTop:4,padding:"12px",background:loading?"var(--bg3)":"var(--accent)",
                    color:loading?"var(--text3)":"#000",border:"none",borderRadius:6,
                    fontSize:11,fontFamily:"var(--mono)",fontWeight:600,letterSpacing:"0.12em",
                    cursor:loading?"default":"pointer",transition:"all 0.2s",
                  }}>
                  {loading?"SIGNING IN...":"SIGN IN →"}
                </button>
                <div style={{textAlign:"center",fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>
                  No account?{" "}
                  <button type="button" onClick={()=>{setMode("signup");setError("");}}
                    style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontSize:11,fontFamily:"var(--mono)"}}>
                    Create one
                  </button>
                </div>
              </form>
            )}

            {/* SIGNUP FORM */}
            {mode==="signup"&&(
              <form onSubmit={handleSignup} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={labelStyle}>FULL NAME</label>
                  <input value={name} onChange={e=>setName(e.target.value)}
                    type="text" placeholder="Your name" style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="var(--accent)"}
                    onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
                </div>
                <div>
                  <label style={labelStyle}>EMAIL</label>
                  <input value={signEmail} onChange={e=>setSignEmail(e.target.value)}
                    type="email" placeholder="your@email.com" style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="var(--accent)"}
                    onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
                </div>
                <div>
                  <label style={labelStyle}>PASSWORD</label>
                  <input value={signPass} onChange={e=>setSignPass(e.target.value)}
                    type="password" placeholder="Min 6 characters" style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="var(--accent)"}
                    onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
                </div>

                {/* Investor profile */}
                <div style={{padding:"12px 14px",background:"var(--bg3)",borderRadius:6,border:"0.5px solid var(--border)"}}>
                  <div style={{fontSize:9,fontFamily:"var(--mono)",color:"var(--text3)",letterSpacing:"0.1em",marginBottom:10}}>INVESTOR PROFILE</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    <div>
                      <label style={{...labelStyle,fontSize:8}}>GOAL</label>
                      <select value={goal} onChange={e=>setGoal(e.target.value)}
                        style={{...inputStyle,padding:"7px 10px",fontSize:11,cursor:"pointer"}}>
                        <option value="growth">Growth</option>
                        <option value="income">Income</option>
                        <option value="preservation">Preserve</option>
                        <option value="speculation">Speculate</option>
                      </select>
                    </div>
                    <div>
                      <label style={{...labelStyle,fontSize:8}}>RISK</label>
                      <select value={risk} onChange={e=>setRisk(e.target.value)}
                        style={{...inputStyle,padding:"7px 10px",fontSize:11,cursor:"pointer"}}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label style={{...labelStyle,fontSize:8}}>HORIZON</label>
                      <select value={horizon} onChange={e=>setHorizon(e.target.value)}
                        style={{...inputStyle,padding:"7px 10px",fontSize:11,cursor:"pointer"}}>
                        <option value="< 1 year">{"< 1yr"}</option>
                        <option value="1-3 years">1-3 yr</option>
                        <option value="3-5 years">3-5 yr</option>
                        <option value="5+ years">5+ yr</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{
                    padding:"12px",background:loading?"var(--bg3)":"var(--accent)",
                    color:loading?"var(--text3)":"#000",border:"none",borderRadius:6,
                    fontSize:11,fontFamily:"var(--mono)",fontWeight:600,letterSpacing:"0.12em",
                    cursor:loading?"default":"pointer",transition:"all 0.2s",
                  }}>
                  {loading?"CREATING ACCOUNT...":"CREATE ACCOUNT →"}
                </button>
                <div style={{textAlign:"center",fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>
                  Already have an account?{" "}
                  <button type="button" onClick={()=>{setMode("login");setError("");}}
                    style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontSize:11,fontFamily:"var(--mono)"}}>
                    Sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div style={{textAlign:"center",marginTop:16,fontSize:9,color:"var(--text3)",fontFamily:"var(--mono)",letterSpacing:"0.06em"}}>
          ⚠️ For educational purposes only. Not financial advice.
        </div>
      </div>
    </div>
  );
}