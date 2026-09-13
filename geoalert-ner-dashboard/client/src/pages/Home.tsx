// GeoAlert Landing Page: Clean, modern climate-tech surface for North-East India landslide early warning.
import { useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, ChevronRight, Layers3, Moon, Radio, ShieldAlert, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import GeoRiskMap from "@/components/GeoRiskMap";
import { defaultDistricts, type DistrictId } from "@/lib/districtsData";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const auth = useAuth();
  const [, navigate] = useLocation();
  const isAuthenticated = auth.isAuthenticated;
  const [districts] = useState(defaultDistricts);
  const [selectedId, setSelectedId] = useState<DistrictId>("tawang");

  const selected = districts.find((d) => d.id === selectedId) || districts[0];

  return (
    <div className="app-shell">
      {/* Completely Transparent Top Header - No Border, Pure Clean */}
      <header className="topbar">
        <a className="brand-lockup flex items-center gap-3" href="#top" aria-label="GeoAlert home">
          <img src="/logo.png" alt="GeoAlert Logo" className="h-11 md:h-12 w-auto object-contain shrink-0 filter drop-shadow-md transition-transform hover:scale-105" />
          <span className="flex flex-col">
            <strong className="text-sm font-mono tracking-widest text-foreground font-bold">GEOALERT</strong>
            <small className="text-[9px] font-mono text-emerald-400/80 tracking-wider">EARLY WARNING SYSTEM</small>
          </span>
        </a>

        {/* Clean Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#top" className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-emerald-400 transition-colors">Overview</a>
          <a href="#workflow" className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-emerald-400 transition-colors">Workflow</a>
          <a href="#risk-levels" className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-emerald-400 transition-colors">Risk Levels</a>
          <a href="#field-note" className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-emerald-400 transition-colors">Field Note</a>
        </nav>

        <div className="top-actions flex items-center gap-3">
          {/* Stylish Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-emerald-300" />}
          </button>

          {/* Compact Sleek Open Dashboard Button */}
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
            className="h-8 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            Open Dashboard <ArrowUpRight size={14} />
          </button>
        </div>
      </header>

      <main id="top">
        {/* Full Viewport Hero Section */}
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow accent-eyebrow"><span className="eyebrow-line" /> AI + GIS EARLY WARNING · NER</p>
            <h1>Know the slope<br /><em>before</em> it moves.</h1>
            <p className="hero-description">GeoAlert turns rainfall, terrain, satellite context, and live sensor signals into a clear window for action across North-East India.</p>
            <div className="hero-actions">
              <button
                className="h-9 px-4.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] uppercase tracking-wider font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-emerald-500/25 active:scale-95 cursor-pointer"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
              >
                Open Dashboard <ArrowUpRight size={15} />
              </button>
              <a className="secondary-cta !h-9 !px-4 !text-[11px] !rounded-md" href="#workflow">Explore System <ChevronRight size={14} /></a>
            </div>
            <div className="hero-meta">
              <span><ShieldAlert size={13} /> Built for response teams</span>
              <span><Radio size={13} /> Works through network loss</span>
            </div>
          </div>

          {/* Hero Visual Card with Live Short Map */}
          <div className="hero-visual" aria-label="Interactive North-East region risk map preview">
            <div className="hero-risk-card">
              <div className="card-topline">
                <span><Layers3 size={14} /> Interactive Regional Map</span>
                <span className="muted-label"><span className="tiny-live-dot" /> Click a district</span>
              </div>
              <div className="hero-map-shell">
                <GeoRiskMap districts={districts} selectedId={selectedId} onSelectDistrict={setSelectedId} />
              </div>
              <div className="hero-risk-stats">
                <div><span>RISK INDEX</span><strong>{selected.riskIndex.toFixed(2)}<small> / 1.00</small></strong></div>
                <div><span>SENSORS LIVE</span><strong>{selected.sensorCount.split("/")[0].trim()}<small> / {selected.sensorCount.split("/")[1]?.trim()}</small></strong></div>
                <div><span>LEAD TIME</span><strong>{selected.leadTime}</strong></div>
              </div>
            </div>
            <span className="scroll-note">SCROLL TO READ SYSTEM WORKFLOW <ArrowDownRight size={14} /></span>
          </div>
        </section>

        {/* Signal Band */}
        <section className="signal-band">
          <div className="signal-lead"><p className="eyebrow">THE IDEA IN BRIEF</p><strong>Signals become time.<br /><em>Time becomes safer decisions.</em></strong></div>
          <div className="signal-stat"><strong>07</strong><span>NER states in scope</span></div>
          <div className="signal-stat"><strong>03</strong><span>core signal families</span></div>
          <div className="signal-stat"><strong>03</strong><span>alert channels planned</span></div>
        </section>

        {/* Workflow Section with Full Background */}
        <section className="workflow-section" id="workflow">
          <div className="workflow-copy">
            <p className="eyebrow accent-eyebrow"><span className="eyebrow-line" /> 02 / SIGNALS → ACTION</p>
            <h2>From a wet hillside<br /><em>to a clear next step.</em></h2>
            <p>Designed to make complex terrain legible at the moment it matters—not bury your response team in another dashboard.</p>
            <div className="workflow-steps">
              <div><span>01</span><strong>Read the rain.</strong><p>Rain gauges, soil moisture, satellite context, and local weather patterns create a living baseline.</p></div>
              <div><span>02</span><strong>Model the risk.</strong><p>Random Forest and XGBoost signals combine rolling rainfall, terrain, saturation, and past-event patterns.</p></div>
              <div><span>03</span><strong>Alert the right people.</strong><p>Risk areas appear on a live map, with SMS, web, and response-team notifications ready for action.</p></div>
            </div>
          </div>
          <div className="workflow-image" />
        </section>

        {/* Risk Level Section */}
        <section className="risk-level-section" id="risk-levels">
          <div className="risk-level-copy">
            <p className="eyebrow accent-eyebrow"><span className="eyebrow-line" /> 03 / FOR RESPONSE TEAMS</p>
            <h2>Clarity for the people<br />who have to <em>move first.</em></h2>
            <p className="section-intro">The hardest part is not collecting data. It is turning a changing slope into enough time to prepare, respond, and move to safety.</p>
          </div>
          <div className="risk-level-list">
            <div className="level-item level-low"><span>01</span><div><strong>Low</strong><p>Routine monitoring</p></div></div>
            <div className="level-item level-moderate"><span>02</span><div><strong>Moderate</strong><p>Stay informed</p></div></div>
            <div className="level-item level-high"><span>03</span><div><strong>High</strong><p>Prepare to respond</p></div></div>
            <div className="level-item level-critical"><span>04</span><div><strong>Critical</strong><p>Act now</p></div></div>
          </div>
        </section>

        {/* Field Note Section */}
        <section className="field-note-section" id="field-note">
          <div className="field-note-copy">
            <p className="eyebrow">04 / THE FIELD NOTE</p>
            <h2>Read the risk.<br /><em>Ready the response.</em></h2>
            <p>Affordable sensor nodes, open mapping, weather APIs, and local context become more useful when the interface answers one question clearly: what should we do next?</p>
            <button className="text-link" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}>
              Open Dashboard <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="terrain-study rounded-xl border border-border/40 shadow-xl" style={{ backgroundImage: "url('/images/geoalert-field-note-mini.png')" }}>
            <div className="terrain-study-overlay" />
            <span className="study-label">SENSOR FIELD TELEMETRY</span>
            <span className="study-coordinates">27.4728° N, 94.9120° E · ELEV. 1,420M</span>
            <div className="study-readout">
              <div>SOIL SATURATION<strong>78.4%</strong></div>
              <div>RAINFALL RATE<strong>42 mm/hr</strong></div>
              <div>SLOPE DISPLACEMENT<strong>+1.8 mm</strong></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Redesign */}
      <footer className="footer-redesign">
        <div className="footer-container">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <div className="brand-lockup flex items-center gap-3">
              <img src="/logo.png" alt="GeoAlert Logo" className="h-12 md:h-14 w-auto object-contain shrink-0 filter drop-shadow-sm" />
              <span><strong className="text-base tracking-wider">GEOALERT</strong><small className="text-[10px] opacity-75"> / ETHRIX</small></span>
            </div>
            <p className="footer-tagline">
              AI + GIS-driven landslide early warning platform tailored for Northeast India terrain. Sensor-aware · Response-ready.
            </p>
            <div className="footer-status-pill">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ALL SENSOR NODES OPERATIONAL · 07 NER STATES</span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="footer-nav-col">
            <span className="footer-col-title">NAVIGATION</span>
            <ul className="footer-nav-list">
              <li><a href="#workflow">02 / Workflow & Signals</a></li>
              <li><a href="#risk-levels">03 / For Response Teams</a></li>
              <li><a href="#field-note">04 / The Field Note</a></li>
              <li><button onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}>Open Response Console →</button></li>
            </ul>
          </div>

          {/* Regional Coverage Column */}
          <div className="footer-meta-col">
            <span className="footer-col-title">REGIONAL COVERAGE</span>
            <div className="footer-meta-tags">
              <span>Arunachal Pradesh</span>
              <span>Meghalaya</span>
              <span>Sikkim</span>
              <span>Assam</span>
              <span>Mizoram</span>
              <span>Manipur</span>
              <span>Nagaland</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <span>© 2026 GEOALERT · ETHRIX SIH PROJECT</span>
          <span className="font-mono text-[10px] opacity-70">LAT 26.2006° N · LON 92.9376° E</span>
        </div>
      </footer>
    </div>
  );
}
