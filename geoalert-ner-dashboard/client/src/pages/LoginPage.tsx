// GeoAlert-NER: Modern split-card authentication with lush nature visual & editorial green climate-tech palette.
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail, Shield, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { startLogin } from "@/const";

const roles = [
  "Disaster Management Authority",
  "District Collector",
  "Field Engineer",
  "Response Team Lead",
];

const natureQuotes = [
  {
    title: "Finally, all your risk intelligence in one place.",
    subtitle: "Real-time rainfall, soil saturation, and landslide early warning.",
  },
  {
    title: "Know the slope before it moves.",
    subtitle: "AI + GIS hazard modeling tailored for North-East India terrain.",
  },
  {
    title: "Connected field telemetry across 7 NER states.",
    subtitle: "Sensor-aware, response-ready, and resilient through network loss.",
  },
];

export default function LoginPage() {
  const [, navigate] = useLocation();
  const auth = useAuth();

  // Mode: "login" or "signup"
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Nature card quote carousel
  const [quoteIndex, setQuoteIndex] = useState(0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isSignUp && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Please enter your credentials to continue.");
      return;
    }

    // Save session
    localStorage.setItem("geoalert-session", "active");
    localStorage.setItem("geoalert-role", role);
    localStorage.setItem("geoalert-user", (name.trim() || email.split("@")[0] || "District Operator").trim());

    if (isSignUp) {
      setSuccessMessage("Account created successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } else {
      setSuccessMessage("Signed in successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 300);
    }
  };

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % natureQuotes.length);
  };

  const prevQuote = () => {
    setQuoteIndex((prev) => (prev - 1 + natureQuotes.length) % natureQuotes.length);
  };

  return (
    <div className="min-h-screen bg-[#082a27] text-white flex flex-col justify-center items-center p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans">
      {/* Background ambient glow matching landing page theme */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#082a27]/80 to-[#082a27] pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4 sm:mb-6 z-10">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-300/80 hover:text-amber-400 transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to GeoAlert
        </a>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="GeoAlert Logo" className="h-7 w-auto object-contain filter drop-shadow-sm" />
          <span className="font-mono text-xs font-bold tracking-widest text-white">GEOALERT</span>
        </div>
      </div>

      {/* Main Split Authentication Card */}
      <div className="w-full max-w-5xl bg-[#0b3530]/90 backdrop-blur-2xl border border-emerald-500/25 rounded-3xl sm:rounded-[32px] shadow-2xl shadow-black/60 overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
        
        {/* Left Column: Form Section */}
        <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
                {isSignUp ? "Create account" : "Hello Again!"}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/70">
                {isSignUp
                  ? "Let's get started with your early warning field access."
                  : "Welcome back! Enter your credentials to access the console."}
              </p>
            </div>

            {/* If user is already authenticated, show friendly session info */}
            {auth.isAuthenticated && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-400/30 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="text-emerald-300 font-medium truncate">
                    Currently signed in: <strong>{auth.user?.name}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-200/70 truncate">{auth.user?.role}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => (window.location.href = "/dashboard")}
                    className="h-7 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    Dashboard →
                  </button>
                  <button
                    type="button"
                    onClick={auth.logout}
                    className="h-7 px-2 rounded hover:bg-white/10 text-white/70 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name field (Sign Up only) */}
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-emerald-200/80">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tenzing Norbu"
                      className="w-full h-11 px-4 pl-10 rounded-xl bg-[#062421]/90 border border-emerald-500/30 text-white placeholder-emerald-100/35 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                    />
                    <User size={16} className="absolute left-3.5 top-3 text-emerald-400/60" />
                  </div>
                </div>
              )}

              {/* Email / Username */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-emerald-200/80">
                  {isSignUp ? "Official Email" : "Email or Username"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isSignUp ? "name@disaster.gov.in" : "name@organisation.gov.in"}
                    autoComplete="username"
                    className="w-full h-11 px-4 pl-10 rounded-xl bg-[#062421]/90 border border-emerald-500/30 text-white placeholder-emerald-100/35 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                  />
                  <Mail size={16} className="absolute left-3.5 top-3 text-emerald-400/60" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-emerald-200/80">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="w-full h-11 px-4 pl-10 pr-10 rounded-xl bg-[#062421]/90 border border-emerald-500/30 text-white placeholder-emerald-100/35 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                  />
                  <Lock size={16} className="absolute left-3.5 top-3 text-emerald-400/60" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-emerald-300/60 hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Recovery Password link (Sign In only) */}
              {!isSignUp && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setError("Password recovery link sent to your registered department email.")}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-mono cursor-pointer"
                  >
                    Recovery Password
                  </button>
                </div>
              )}

              {/* Operational Role Select */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-emerald-200/80">
                  Operational Role
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-11 px-4 pl-10 rounded-xl bg-[#062421]/90 border border-emerald-500/30 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all appearance-none cursor-pointer"
                  >
                    {roles.map((option) => (
                      <option key={option} value={option} className="bg-[#082a27] text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                  <Shield size={16} className="absolute left-3.5 top-3 text-emerald-400/60 pointer-events-none" />
                </div>
              </div>

              {/* Messages */}
              {error && (
                <p className="text-xs text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg p-2.5" role="alert">
                  {error}
                </p>
              )}
              {successMessage && (
                <p className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-lg p-2.5 flex items-center gap-1.5">
                  <Check size={14} /> {successMessage}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-11.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-emerald-950/50 transition-all hover:shadow-emerald-500/20 active:scale-[0.98] cursor-pointer mt-2"
              >
                {isSignUp ? "Create account" : "Sign In"}
              </button>
            </form>

            {/* Toggle Link between Login & Create Account */}
            <div className="text-center mt-3">
              {isSignUp ? (
                <p className="text-xs text-emerald-200/70">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="text-amber-400 font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Login
                  </button>
                </p>
              ) : (
                <p className="text-xs text-emerald-200/70">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="text-amber-400 font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Create account
                  </button>
                </p>
              )}
            </div>

            {/* Or continue with */}
            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-emerald-500/20 w-full" />
              <span className="bg-[#0b3530] px-3 text-[10px] text-emerald-300/60 uppercase tracking-wider font-mono shrink-0">
                Or continue with
              </span>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-3 gap-3">
              {/* Google */}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("geoalert-role", role);
                  startLogin();
                }}
                className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-emerald-500/20 flex items-center justify-center transition-all hover:border-emerald-400/40 active:scale-95 cursor-pointer"
                title="Continue with Google"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("geoalert-role", role);
                  startLogin();
                }}
                className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-emerald-500/20 flex items-center justify-center transition-all hover:border-emerald-400/40 active:scale-95 cursor-pointer"
                title="Continue with Apple"
              >
                <svg className="w-4.5 h-4.5 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-.99 1.68-.86 2.7 1 .08 2.02-.49 2.54-1.19z" />
                </svg>
              </button>

              {/* Protected OAuth */}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("geoalert-role", role);
                  startLogin();
                }}
                className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-emerald-500/20 flex items-center justify-center transition-all hover:border-emerald-400/40 active:scale-95 cursor-pointer"
                title="Protected Gov / Team OAuth"
              >
                <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1">
                  OAuth <span className="text-[10px] opacity-70">2.0</span>
                </span>
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-emerald-500/15 mt-4 flex items-center justify-between text-[10px] font-mono text-emerald-200/50">
            <span>GEOALERT-NER · TEAM ETHRIX</span>
            <span>SIH 2026</span>
          </div>
        </div>

        {/* Right Column: Nature Graphic Card */}
        <div className="p-3 sm:p-4 md:p-5 flex">
          <div className="w-full relative rounded-2xl sm:rounded-[26px] overflow-hidden min-h-[380px] md:min-h-full flex flex-col justify-between p-6 sm:p-8 bg-emerald-950">
            {/* Nature Landscape Background Image */}
            <img
              src="/images/login-nature.webp"
              alt="North-East India Mountain Nature Landscape"
              className="absolute inset-0 w-full h-full object-cover filter brightness-95 contrast-105"
            />

            {/* Gradient Overlay for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 pointer-events-none" />

            {/* Top Brand Pill */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[11px] font-mono text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>NORTHEAST INDIA REGIONAL NODE</span>
              </div>
            </div>

            {/* Bottom Content & Quote Carousel */}
            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug drop-shadow-md">
                  {natureQuotes[quoteIndex].title}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1.5 drop-shadow-sm max-w-sm">
                  {natureQuotes[quoteIndex].subtitle}
                </p>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                {/* Carousel dots */}
                <div className="flex items-center gap-1.5">
                  {natureQuotes.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setQuoteIndex(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === quoteIndex ? "w-6 bg-amber-400" : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Arrow Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevQuote}
                    className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/25 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                    aria-label="Previous quote"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={nextQuote}
                    className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/25 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                    aria-label="Next quote"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
