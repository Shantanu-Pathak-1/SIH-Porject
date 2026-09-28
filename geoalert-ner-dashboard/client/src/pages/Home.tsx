// Ethrix-Nowcast Landing Page: AI-Driven Hyper-Local Weather & Cloudburst Early Warning System (SIH Problem ID: 26077)
import { useState, useEffect, useRef } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BrainCircuit, Check, ChevronDown, ChevronRight, CloudLightning, CloudRain, Flame, Lock, LogIn, LogOut, MapPin, Radio, Satellite, ShieldAlert, Sparkles, User, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import GeoRiskMap from "@/components/GeoRiskMap";
import EthrixLogo from "@/components/EthrixLogo";
import { historicalSimulationSteps } from "@/lib/nowcastData";
import type { DistrictId } from "@/lib/districtsData";

export default function Home() {
  const auth = useAuth();
  const [, navigate] = useLocation();
  const isAuthenticated = auth.isAuthenticated;

  // Primed with step 3 (T-1h Trigger phase) for dramatic and realistic presentation
  const [simulationStep] = useState(3);
  const activeStep = historicalSimulationSteps[simulationStep];
  const [districts] = useState(activeStep.districts);
  const [selectedId, setSelectedId] = useState<DistrictId>("dharamshala");

  const selected = districts.find((d) => d.id === selectedId) || districts[0];

  // Topbar Account popover state
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsAccountOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsAccountOpen(false);
    }, 250);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    };

    const observerOptions = {
      threshold: 0.08,
      rootMargin: "0px 0px -20px 0px",
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const revealElements = document.querySelectorAll(".scroll-reveal");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleInstantJudgeAccess = () => {
    localStorage.setItem("geoalert-session", "active");
    localStorage.setItem("geoalert-user", "Evaluation Jury / Judge");
    localStorage.setItem("geoalert-role", "Admin / Operator");
    localStorage.setItem("geoalert-email", "jury.evaluator@sih.gov.in");
    navigate("/dashboard");
  };

  return (
    <div className="app-shell">
      {/* Top Hero Container with Video / Gradient Background */}
      <div className="relative overflow-hidden bg-[#082a27]">
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/hero-poster.webp"
            className="w-full h-full object-cover opacity-60 filter brightness-105 contrast-105 scale-105 transition-all duration-700"
          >
            <source src="/hero-bg.webm" type="video/webm" />
            <source src="/videos/hero-bg.webm" type="video/webm" />
            <source src="/hero-bg.mp4" type="video/mp4" />
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#082a27]/60 via-[#082a27]/30 to-[#082a27]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#082a27]/20 to-[#082a27]/85" />
        </div>

        {/* Top Header */}
        <header className="topbar relative z-10">
          <a className="brand-lockup flex items-center gap-3.5 group cursor-pointer" href="#top" aria-label="Ethrix-Nowcast home">
            <EthrixLogo size={42} className="group-hover:scale-105 transition-transform" />
            <span className="flex flex-col">
              <span className="flex items-center gap-1.5 leading-none">
                <strong className="text-lg font-serif tracking-wider text-white font-bold group-hover:text-emerald-300 transition-colors">ETHRIX</strong>
                <span className="text-base font-mono font-bold tracking-wider text-emerald-400">-NOWCAST</span>
              </span>
              <small className="text-[9px] font-mono text-emerald-400/80 tracking-wider mt-1">
                SIH PROBLEM ID: 26077 · 2–6H EARLY WARNING
              </small>
            </span>
          </a>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#top" className="text-xs font-mono uppercase tracking-wider text-white/75 hover:text-emerald-300 transition-colors">Overview</a>
            <a href="#architecture" className="text-xs font-mono uppercase tracking-wider text-white/75 hover:text-emerald-300 transition-colors">5-Tier Architecture</a>
            <a href="#risk-levels" className="text-xs font-mono uppercase tracking-wider text-white/75 hover:text-emerald-300 transition-colors">Risk Triggers</a>
            <a href="#field-note" className="text-xs font-mono uppercase tracking-wider text-white/75 hover:text-emerald-300 transition-colors">Earthformer AI</a>
          </nav>

          <div className="top-actions flex items-center gap-2.5 relative">
            <button
              onClick={handleInstantJudgeAccess}
              className="h-9 px-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} /> Judge Demo <ArrowUpRight size={14} />
            </button>
          </div>
        </header>

        <main id="top" className="relative z-10">
          {/* Full Viewport Hero Section */}
          <section className="hero-section">
            <div className="hero-copy">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  SMART INDIA HACKATHON 2026 · PROBLEM ID: 26077
                </span>
              </div>
              <h1 className="!text-white font-bold leading-tight">
                Hyper-Local Weather &amp;<br />
                <em className="hero-highlight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                  Cloudburst Early Warning
                </em>
              </h1>
              <p className="hero-description !text-white/90 leading-relaxed">
                Ethrix-Nowcast harnesses an <strong>Earthformer Spatiotemporal Backbone</strong> with Tri-Head U-Nets to predict Cloudbursts, Flash Floods, and Severe Thunderstorms with a <strong>2–6 hour lead time</strong> across mountainous catchments.
              </p>

              <div className="hero-actions flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                <button
                  className="h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-emerald-500/30 active:scale-95 cursor-pointer w-full sm:w-auto"
                  onClick={handleInstantJudgeAccess}
                >
                  <Sparkles size={15} /> Launch Live Prototype (Judge Access) <ArrowRight size={15} />
                </button>
                <a
                  className="secondary-cta !h-11 !px-5 !text-xs !rounded-xl !text-white !border-white/30 hover:!border-amber-400 hover:!text-amber-300 !bg-white/5 flex items-center justify-center w-full sm:w-auto cursor-pointer"
                  href="#architecture"
                >
                  Explore 5-Tier Architecture <ChevronRight size={15} />
                </a>
              </div>

              <div className="hero-meta flex flex-wrap gap-2 pt-2">
                <span className="!text-white/85 !border-white/20 !bg-[#06221f]/70 text-xs">
                  <Satellite size={13} className="text-cyan-400" /> ISRO INSAT-3D TIR1 + NCMRWF IMDAA
                </span>
                <span className="!text-white/85 !border-white/20 !bg-[#06221f]/70 text-xs">
                  <BrainCircuit size={13} className="text-emerald-400" /> Tier-3 Grad-CAM Explainable AI
                </span>
                <span className="!text-white/85 !border-white/20 !bg-[#06221f]/70 text-xs">
                  <Radio size={13} className="text-amber-400" /> Tier-4 Gemini Bilingual SMS Alerts
                </span>
              </div>
            </div>

            {/* Hero Visual Card with Live Map Preview */}
            <div className="hero-risk-card" aria-label="Interactive Nowcast Map Preview">
              <div className="hero-map-shell !mt-0">
                <GeoRiskMap
                  districts={districts}
                  selectedId={selectedId}
                  onSelectDistrict={setSelectedId}
                  gradCamZones={activeStep.activeGradCamZones}
                  hideOverlays={true}
                />
              </div>
              <div className="hero-risk-stats">
                <div>
                  <span>NOWCAST PROB</span>
                  <strong className="text-red-400">{selected.cloudburstProb}%</strong>
                </div>
                <div>
                  <span>INSAT-3D CTT</span>
                  <strong className="text-cyan-300">{selected.cloudTopTemp}°C</strong>
                </div>
                <div>
                  <span>EST. LEAD TIME</span>
                  <strong className="text-amber-300">{selected.leadTime}</strong>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Signal Band */}
      <section className="signal-band scroll-reveal">
        <div className="signal-lead reveal-text">
          <p className="eyebrow">ETHRIX NOWCAST ADVANTAGE</p>
          <strong>
            Deep atmospheric physics becomes actionable lead time.<br />
            <em className="text-shimmer">From 15-minute sirens to 4-hour pre-evacuation.</em>
          </strong>
        </div>
        <div className="signal-stat reveal-item reveal-delay-1">
          <strong>2–6h</strong>
          <span>Verified Early Warning Lead Time</span>
        </div>
        <div className="signal-stat reveal-item reveal-delay-2">
          <strong>30m</strong>
          <span>ISRO CartoDEM Topographic Resolution</span>
        </div>
        <div className="signal-stat reveal-item reveal-delay-3">
          <strong>05 Tiers</strong>
          <span>End-to-End AI Early Warning Architecture</span>
        </div>
      </section>

      {/* 5-Tier Architecture Section (Pitch Focus) */}
      <section className="workflow-section scroll-reveal" id="architecture">
        <div className="workflow-copy">
          <p className="eyebrow accent-eyebrow reveal-text">
            <span className="eyebrow-line" /> 02 / 5-TIER SYSTEM ARCHITECTURE
          </p>
          <h2 className="reveal-text reveal-delay-1">
            Engineered for high mountain terrain.<br />
            <em className="text-shimmer">From raw satellite bytes to life-saving SMS.</em>
          </h2>
          <p className="reveal-text reveal-delay-2">
            Standard radar nowcasts fail in the Himalayas due to beam blockage by high mountain ridges. Ethrix-Nowcast fuses satellite thermal dynamics, atmospheric reanalysis, and high-res digital elevation models.
          </p>

          <div className="workflow-steps space-y-4 pt-2">
            <div className="reveal-item reveal-delay-1 p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs font-mono font-bold text-cyan-400">TIER 1</span>
              <strong className="text-white block mt-1">Multi-Modal Data Ingestion</strong>
              <p className="text-xs text-zinc-300">
                ISRO INSAT-3D TIR1 half-hourly cloud top temperatures, NCMRWF IMDAA 12km atmospheric moisture flux, and ISRO 30m CartoDEM digital elevation models.
              </p>
            </div>
            <div className="reveal-item reveal-delay-2 p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs font-mono font-bold text-emerald-400">TIER 2</span>
              <strong className="text-white block mt-1">Earthformer AI Brain + Tri-Head U-Net</strong>
              <p className="text-xs text-zinc-300">
                Spatiotemporal transformer backbone outputs three simultaneous hazard probabilities: Severe Thunderstorm, Cloudburst Deluge, and Flash Flood Runoff.
              </p>
            </div>
            <div className="reveal-item reveal-delay-3 p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs font-mono font-bold text-amber-400">TIER 3</span>
              <strong className="text-white block mt-1">Grad-CAM Explainable AI (XAI) Verification</strong>
              <p className="text-xs text-zinc-300">
                Visual saliency heatmaps verify model attention over valley choke points, preventing false alarms and providing decision confidence to District Collectors.
              </p>
            </div>
            <div className="reveal-item reveal-delay-4 p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs font-mono font-bold text-rose-400">TIER 4</span>
              <strong className="text-white block mt-1">Tier-4 GenAI Bilingual Alert Engine</strong>
              <p className="text-xs text-zinc-300">
                Gemini/Groq LLMs convert raw ML risk indices into actionable bilingual (Hindi &amp; English) emergency SMS alerts with precise safe assembly refuges.
              </p>
            </div>
            <div className="reveal-item reveal-delay-5 p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-xs font-mono font-bold text-teal-400">TIER 5</span>
              <strong className="text-white block mt-1">FastAPI + GIS Command Surface</strong>
              <p className="text-xs text-zinc-300">
                Real-time Mapbox/Leaflet interactive dashboard equipped with historical time-scrubber, siren array trigger, and cell-broadcast gateways.
              </p>
            </div>
          </div>
        </div>
        <div className="workflow-image" />
      </section>

      {/* Atmospheric Triggers & Risk Levels */}
      <section className="risk-level-section scroll-reveal" id="risk-levels">
        <div className="risk-level-copy">
          <p className="eyebrow accent-eyebrow reveal-text">
            <span className="eyebrow-line" /> 03 / ATMOSPHERIC TRIGGERS
          </p>
          <h2 className="reveal-text reveal-delay-1">
            Physical signatures that precede<br />
            <em className="text-shimmer">catastrophic cloudburst events.</em>
          </h2>
          <p className="section-intro reveal-text reveal-delay-2">
            Cloudbursts are not random accidents. They leave measurable physical footprints across thermodynamic and satellite channels hours before impact.
          </p>
        </div>
        <div className="risk-level-list">
          <div className="level-item level-low reveal-item reveal-delay-1">
            <span>01</span>
            <div>
              <strong>Advisory Phase</strong>
              <p>CAPE &lt; 1500 J/kg · Nominal solar heating · Normal baseline telemetry</p>
            </div>
          </div>
          <div className="level-item level-moderate reveal-item reveal-delay-2">
            <span>02</span>
            <div>
              <strong>Convective Watch</strong>
              <p>CAPE 1500–2200 J/kg · CIN cap erosion · Towering cumulus initiation</p>
            </div>
          </div>
          <div className="level-item level-high reveal-item reveal-delay-3">
            <span>03</span>
            <div>
              <strong>Severe Warning</strong>
              <p>Radar dBZ &gt; 45 · CTT drops to -58°C · Valley choke constriction</p>
            </div>
          </div>
          <div className="level-item level-critical reveal-item reveal-delay-4">
            <span>04</span>
            <div>
              <strong>Cloudburst Nowcast</strong>
              <p>CTT &lt; -68°C · Rain rate &gt; 80 mm/h · 88%+ AI Cloudburst Certainty</p>
            </div>
          </div>
        </div>
      </section>

      {/* Field Note Section */}
      <section className="field-note-section scroll-reveal" id="field-note">
        <div className="field-note-copy">
          <p className="eyebrow reveal-text">04 / THE AI ARCHITECTURE</p>
          <h2 className="reveal-text reveal-delay-1">
            Earthformer Spatiotemporal<br />
            <em className="text-shimmer">Neural Nowcasting.</em>
          </h2>
          <p className="reveal-text reveal-delay-2">
            Traditional Numerical Weather Prediction (NWP) models require 3–6 hours of high-performance compute time. Ethrix-Nowcast’s transformer inference generates high-resolution risk heatmaps in under 4 seconds.
          </p>
          <button
            className="text-link reveal-text reveal-delay-3 cursor-pointer"
            onClick={handleInstantJudgeAccess}
          >
            Launch Interactive Nowcast Dashboard <ArrowUpRight size={14} />
          </button>
        </div>
        <div
          className="terrain-study rounded-xl border border-border/40 shadow-xl reveal-item reveal-delay-2"
          style={{ backgroundImage: "url('/images/geoalert-field-note-mini.png')" }}
        >
          <div className="terrain-study-overlay" />
          <span className="study-label">INSAT-3D &amp; CARTODEM FUSION</span>
          <span className="study-coordinates">32.2190° N, 76.3230° E · ELEV. 1,457M</span>
          <div className="study-readout">
            <div>
              CLOUD TOP TEMP<strong>-68.4°C</strong>
            </div>
            <div>
              SURFACE CAPE<strong>2,980 J/kg</strong>
            </div>
            <div>
              CLOUDBURST PROB<strong>88.4%</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-redesign scroll-reveal">
        <div className="footer-container">
          <div className="footer-brand-col">
            <div className="brand-lockup flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <CloudLightning size={20} />
              </div>
              <span>
                <strong className="text-base tracking-wider text-white">ETHRIX-NOWCAST</strong>
              </span>
            </div>
            <p className="footer-tagline">
              AI-Driven Hyper-Local Weather &amp; Cloudburst Early Warning System (SIH Problem ID: 26077). 2–6 hour lead time nowcasting with Grad-CAM XAI and Tier-4 bilingual evacuation alerts.
            </p>
            <div className="footer-status-pill">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ISRO INSAT-3D &amp; CARTODEM PIPELINE READY · SIH 2026</span>
            </div>
          </div>

          <div className="footer-nav-col">
            <span className="footer-col-title">NAVIGATION</span>
            <ul className="footer-nav-list">
              <li><a href="#top">Overview</a></li>
              <li><a href="#architecture">5-Tier Architecture</a></li>
              <li><a href="#risk-levels">Atmospheric Triggers</a></li>
              <li><button onClick={handleInstantJudgeAccess}>Judge Interactive Demo →</button></li>
            </ul>
          </div>

          <div className="footer-meta-col">
            <span className="footer-col-title">HIGH-RISK VALLEY CATCHMENTS</span>
            <div className="footer-meta-tags">
              <span>Kangra &amp; Bhagsu (HP)</span>
              <span>Beas River Gorge (HP)</span>
              <span>Parvati Valley (HP)</span>
              <span>Kedarnath Mandakini (UK)</span>
              <span>Chamoli Alaknanda (UK)</span>
              <span>Sohra Escarpment (Meghalaya)</span>
              <span>Teesta Basin (Sikkim)</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© 2026 ETHRIX-NOWCAST · HYPER-LOCAL CLOUDBURST EARLY WARNING (SIH PROBLEM ID: 26077)</span>
        </div>
      </footer>
    </div>
  );
}
