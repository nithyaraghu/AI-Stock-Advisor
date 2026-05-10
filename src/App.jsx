import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import AuthPage from "./components/AuthPage";

const BACKEND = "http://127.0.0.1:5000";

export default function App() {
  const [user, setUser]       = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("mi_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validate UUID format
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (parsed.userId && uuidPattern.test(parsed.userId)) {
          setUser(parsed);
        } else {
          // Bad session - clear and re-login
          localStorage.removeItem("mi_user");
        }
      } catch {
        localStorage.removeItem("mi_user");
      }
    }
    setChecking(false);
  }, []);

  const handleLogin  = userData => setUser(userData);
  const handleLogout = () => { localStorage.removeItem("mi_user"); setUser(null); };

  if (checking) return (
    <div style={{background:"#0A0F1E",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
      <div style={{width:24,height:24,border:"2px solid rgba(99,140,210,0.2)",borderTop:"2px solid #5B8DEF",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{fontFamily:"IBM Plex Mono,monospace",fontSize:10,color:"#2E3F62",letterSpacing:"0.1em"}}>MARKET INTELLIGENCE</span>
    </div>
  );

  if (!user) return <AuthPage onLogin={handleLogin}/>;

  return <Dashboard user={user} onLogout={handleLogout}/>;
}