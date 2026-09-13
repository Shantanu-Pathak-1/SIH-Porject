// GeoAlert-NER style: protected access feels like a field station—quiet, precise, and clear about who can act.
import { FormEvent, useEffect, useState } from "react";
import { Activity, ArrowLeft, ArrowUpRight, Check, LockKeyhole, Moon, ShieldCheck, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

const roles = ["Disaster Management Authority", "District Collector", "Field Engineer"];

export default function LoginPage() {
  const [, navigate] = useLocation();
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.isAuthenticated || localStorage.getItem("geoalert-session") === "active") navigate("/dashboard");
  }, [auth.isAuthenticated, navigate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Enter your authorised username and access password to continue.");
      return;
    }
    localStorage.setItem("geoalert-session", "active");
    localStorage.setItem("geoalert-role", role);
    localStorage.setItem("geoalert-user", username.trim());
    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-art bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950">
        <div className="login-art-shade" />
        <a className="login-brand flex items-center gap-2.5" href="/">
          <img src="/logo.png" alt="GeoAlert Logo" className="h-8 w-auto object-contain shrink-0" />
          <span><strong>GEOALERT-NER</strong><small> / ETHRIX</small></span>
        </a>
        <div className="login-art-copy">
          <p className="eyebrow accent-eyebrow"><span className="eyebrow-line" /> DISASTER MANAGEMENT</p>
          <h1>Keep the signal<br /><em>close.</em></h1>
          <p>Sign in to review terrain signals, risk areas, and field telemetry.</p>
          <span className="login-art-foot"><ShieldCheck size={13} /> Protected response workspace</span>
        </div>
      </div>
      <main className="login-panel">
        <div className="login-panel-top">
          <a className="back-link" href="/"><ArrowLeft size={14} /> Back to site</a>
          <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        <div className="login-form-wrap">
          <p className="eyebrow accent-eyebrow"><span className="eyebrow-line" /> Dashboard / Access</p>
          <h2>Resume signal<br /><em>watch.</em></h2>
          <p className="login-intro">Authorised operators can sign in to monitor live terrain telemetry and coordinate district response.</p>
          <div className="secure-note">
            <LockKeyhole size={15} />
            <span><strong>Secure access layer</strong><small>Credentials are handled by the protected identity flow.</small></span>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            <label className="field-label" htmlFor="geoalert-username">USERNAME / WORK EMAIL</label>
            <input id="geoalert-username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="name@organisation.gov.in" autoComplete="username" />
            
            <label className="field-label" htmlFor="geoalert-password">PASSWORD / ACCESS CODE</label>
            <input id="geoalert-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your secure access code" autoComplete="current-password" />
            
            <label className="field-label" htmlFor="geoalert-role">OPERATIONAL ROLE</label>
            <select id="geoalert-role" value={role} onChange={(event) => setRole(event.target.value)}>
              {roles.map((option) => <option key={option}>{option}</option>)}
            </select>
            
            {error && <p className="login-error" role="alert">{error}</p>}
            <Button type="submit" className="login-submit">Sign in to Dashboard <ArrowUpRight size={15} /></Button>
          </form>
          <div className="oauth-divider"><span /> or <span /></div>
          <button className="oauth-button" onClick={() => { localStorage.setItem("geoalert-role", role); startLogin(); }}>
            Continue with protected OAuth <ArrowUpRight size={14} />
          </button>
          <p className="login-demo-note"><Check size={13} /> Demo mode stores a local session for presentation only.</p>
        </div>
        <footer className="login-footer">
          <span>GEOALERT-NER / TEAM ETHRIX</span>
          <span>DISASTER MANAGEMENT</span>
        </footer>
      </main>
    </div>
  );
}
