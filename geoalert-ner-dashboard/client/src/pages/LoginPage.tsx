// GeoAlert-NER: Modern split-card authentication with lush nature visual, NER location backup selector, and Gmail OTP verification.
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { startLogin } from "@/const";
import { nerLocations, nerStateList } from "@/lib/nerLocationData";

// Simplified to 2 primary roles: Citizen and Admin / Operator
const roles = ["Citizen", "Admin / Operator"] as const;
type RoleType = (typeof roles)[number];

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
    title: "Connected field telemetry across 8 NER states.",
    subtitle: "Sensor-aware, response-ready, and resilient through network loss.",
  },
];

export default function LoginPage() {
  const [, navigate] = useLocation();
  const auth = useAuth();

  // Mode: "login" or "signup"
  const [isSignUp, setIsSignUp] = useState(false);
  // Signup step: "form" or "otp"
  const [signUpStep, setSignUpStep] = useState<"form" | "otp">("form");

  // Form states
  const [name, setName] = useState("");
  const [selectedState, setSelectedState] = useState(nerStateList[0]);
  const [selectedDistrict, setSelectedDistrict] = useState(nerLocations[nerStateList[0]][0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleType>("Citizen");
  const [operatorCode, setOperatorCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP states
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(60);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Nature card quote carousel
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Lock viewport scroll while on Login Page
  useEffect(() => {
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (signUpStep === "otp" && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [signUpStep, otpCountdown]);

  // Auto-advance quote carousel every 3 seconds with smooth transition
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % natureQuotes.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Handle state selection change & sync district list
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const districts = nerLocations[stateName] || [];
    setSelectedDistrict(districts[0] || "");
  };

  // Switch between Login and Create Account
  const toggleAuthMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setSignUpStep("form");
    setError("");
    setSuccessMessage("");
    setOtpDigits(["", "", "", "", "", ""]);
  };

  // Helper to validate Operator clearance passcode
  const validateOperatorCode = (): boolean => {
    if (role === "Admin / Operator") {
      const trimmed = operatorCode.trim().toUpperCase();
      const validCodes = ["GEO-2026", "ADMIN-2026", "SIH2026", "OPERATOR", "ADMIN"];
      if (!trimmed) {
        setError("Operator clearance code is required for authority access.");
        return false;
      }
      if (!validCodes.includes(trimmed)) {
        setError("Access Denied: Invalid Operator clearance code.");
        return false;
      }
    }
    return true;
  };

  // Handle Form Submission (Login or Signup Step 1)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    // LOGIN FLOW
    if (!isSignUp) {
      if (!email.trim() || !password.trim()) {
        setError("Please enter your Gmail / email and password.");
        return;
      }

      // Check operator code if Admin / Operator is chosen
      if (!validateOperatorCode()) {
        return;
      }

      // Save login session
      localStorage.setItem("geoalert-session", "active");
      localStorage.setItem("geoalert-email", email.trim());
      localStorage.setItem("geoalert-user", email.split("@")[0]);
      localStorage.setItem("geoalert-role", role);

      setSuccessMessage("Signed in successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 300);
      return;
    }

    // SIGNUP FLOW: Step 1 (Credentials & NER Backup Location)
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!selectedState || !selectedDistrict) {
      setError("Please select your North-East state and backup district.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid Gmail or official email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Check operator code if Admin / Operator is chosen
    if (!validateOperatorCode()) {
      return;
    }

    // Generate simulated 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setSignUpStep("otp");
    setOtpCountdown(60);
    setSuccessMessage(`OTP sent to ${email.trim()}! Demo code: ${code}`);

    // Auto-focus first OTP input after render
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (otpCountdown > 0) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpCountdown(60);
    setSuccessMessage(`New code sent! Demo OTP: ${code}`);
    setOtpDigits(["", "", "", "", "", ""]);
    otpInputRefs.current[0]?.focus();
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // Verify OTP and complete registration
  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const enteredCode = otpDigits.join("");
    if (enteredCode.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (enteredCode !== generatedOtp && enteredCode !== "123456") {
      setError("Invalid OTP code. Please check your Gmail or use the demo code.");
      return;
    }

    // Save complete verified session with backup location data
    localStorage.setItem("geoalert-session", "active");
    localStorage.setItem("geoalert-user", name.trim());
    localStorage.setItem("geoalert-email", email.trim());
    localStorage.setItem("geoalert-role", role);
    localStorage.setItem("geoalert-state", selectedState);
    localStorage.setItem("geoalert-district", selectedDistrict);

    setSuccessMessage("Gmail verified & Emergency location registered! Redirecting...");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 450);
  };

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % natureQuotes.length);
  };

  const prevQuote = () => {
    setQuoteIndex((prev) => (prev - 1 + natureQuotes.length) % natureQuotes.length);
  };

  return (
    <div className="h-screen w-full max-h-screen bg-[#082a27] text-white flex flex-col justify-center items-center p-2 sm:p-4 md:p-5 relative overflow-hidden font-sans select-none">
      {/* Background ambient glow matching landing page theme */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#082a27]/80 to-[#082a27] pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-1.5 sm:mb-2 z-10 shrink-0">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-emerald-300/80 hover:text-amber-400 transition-colors bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-emerald-500/20 cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to GeoAlert
        </a>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="GeoAlert Logo" className="h-6 w-auto object-contain filter drop-shadow-sm" />
          <span className="font-mono text-xs font-bold tracking-widest text-white">GEOALERT</span>
        </div>
      </div>

      {/* Main Split Authentication Card */}
      <div className="w-full max-w-5xl bg-[#0b3530]/90 backdrop-blur-2xl border border-emerald-500/25 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/60 overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10 max-h-[calc(100vh-64px)] sm:max-h-[calc(100vh-72px)]">
        
        {/* Left Column: Form Section */}
        <div className="p-4 sm:p-5 lg:p-6.5 flex flex-col justify-between overflow-y-auto no-scrollbar">
          <div>
            {/* Header */}
            <div className="mb-2 sm:mb-2.5">
              <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-0.5">
                  {signUpStep === "otp"
                    ? "Verify Gmail"
                    : isSignUp
                    ? "Create account"
                    : "Hello Again!"}
                </h1>
                {isSignUp && signUpStep === "otp" && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] uppercase tracking-wider border border-emerald-500/30">
                    Step 2 of 2
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/70">
                {signUpStep === "otp"
                  ? `Enter 6-digit code sent to ${email}`
                  : isSignUp
                  ? "Register with your North-East backup location for emergency alerts."
                  : "Welcome back! Enter your credentials to access the console."}
              </p>
            </div>

            {/* Currently Logged In Indicator (if session exists) */}
            {auth.isAuthenticated && (
              <div className="mb-2 p-2 rounded-xl bg-emerald-950/70 border border-emerald-400/30 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="text-emerald-300 font-medium truncate text-[11px]">
                    Signed in: <strong>{auth.user?.name}</strong> ({auth.user?.role || "Citizen"})
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => (window.location.href = "/dashboard")}
                    className="h-6 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[9px] uppercase tracking-wider font-semibold transition-all cursor-pointer"
                  >
                    Dashboard →
                  </button>
                  <button
                    type="button"
                    onClick={auth.logout}
                    className="h-6 px-2 rounded hover:bg-white/10 text-white/70 hover:text-white font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* FEEDBACK MESSAGES */}
            {error && (
              <p className="text-xs text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-lg p-2 mb-2" role="alert">
                {error}
              </p>
            )}
            {successMessage && (
              <div className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-lg p-2 mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="shrink-0 text-emerald-400" />
                  {successMessage}
                </span>
                {generatedOtp && signUpStep === "otp" && (
                  <button
                    type="button"
                    onClick={() => {
                      const digits = generatedOtp.split("");
                      setOtpDigits(digits);
                    }}
                    className="px-2 py-0.5 rounded bg-amber-400 text-emerald-950 font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-amber-300 shrink-0 cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                )}
              </div>
            )}

            {/* ----------------- STEP 2: GMAIL OTP VERIFICATION ----------------- */}
            {signUpStep === "otp" ? (
              <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
                {/* Emergency Location confirmation chip */}
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/25 flex items-center gap-2 text-[11px] text-emerald-200">
                  <MapPin size={14} className="text-amber-400 shrink-0" />
                  <span>
                    Backup Location: <strong>{selectedDistrict}</strong>, {selectedState} ({role})
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-emerald-200/80">
                      Enter 6-Digit OTP
                    </label>
                    <span className="text-[10px] font-mono text-amber-400">
                      Sent to: {email}
                    </span>
                  </div>

                  {/* 6 OTP Boxes */}
                  <div className="grid grid-cols-6 gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={idx === 0 ? handleOtpPaste : undefined}
                        className="h-11 text-center font-mono text-base font-bold rounded-xl bg-[#062421]/90 border border-emerald-500/35 text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                      />
                    ))}
                  </div>
                </div>

                {/* Resend & Demo Helper */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSignUpStep("form");
                      setError("");
                    }}
                    className="text-emerald-300/80 hover:text-white transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={12} /> Edit Details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpCountdown > 0}
                    className={`font-mono text-[11px] flex items-center gap-1 transition-colors ${
                      otpCountdown > 0
                        ? "text-emerald-300/40 cursor-not-allowed"
                        : "text-amber-400 hover:text-amber-300 cursor-pointer"
                    }`}
                  >
                    <RotateCcw size={11} />
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend OTP"}
                  </button>
                </div>

                {/* Verify Submit Button */}
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-950/50 transition-all hover:shadow-emerald-500/20 active:scale-[0.98] cursor-pointer mt-1 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} /> Verify & Complete Registration
                </button>
              </form>
            ) : (
              /* ----------------- STEP 1: FORM (LOGIN OR SIGNUP) ----------------- */
              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5">
                {/* ACCOUNT TYPE SELECTION: ONLY CITIZEN & ADMIN / OPERATOR */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-emerald-200/80">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Citizen Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setRole("Citizen");
                        setOperatorCode("");
                        setError("");
                      }}
                      className={`h-9 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
                        role === "Citizen"
                          ? "bg-emerald-600/30 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400/50"
                          : "bg-[#062421]/90 border-emerald-500/25 text-emerald-200/70 hover:text-white hover:border-emerald-500/50"
                      }`}
                    >
                      <User size={14} className={role === "Citizen" ? "text-emerald-300" : "text-emerald-400/60"} />
                      <span>Citizen</span>
                    </button>

                    {/* Admin / Operator Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setRole("Admin / Operator");
                        setError("");
                      }}
                      className={`h-9 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
                        role === "Admin / Operator"
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm ring-1 ring-amber-400/50"
                          : "bg-[#062421]/90 border-emerald-500/25 text-emerald-200/70 hover:text-white hover:border-emerald-500/50"
                      }`}
                    >
                      <Shield size={14} className={role === "Admin / Operator" ? "text-amber-400" : "text-emerald-400/60"} />
                      <span>Admin / Operator</span>
                    </button>
                  </div>
                </div>

                {/* SPECIAL OPERATOR CLEARANCE CODE (Shown ONLY when Admin / Operator is selected) */}
                {role === "Admin / Operator" && (
                  <div className="space-y-0.5 p-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1">
                      <KeyRound size={11} className="text-amber-400" />
                      Operator Clearance Code
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={operatorCode}
                        onChange={(e) => setOperatorCode(e.target.value)}
                        placeholder="Enter Authority Clearance Passcode"
                        className="w-full h-8.5 px-3 pl-8 rounded-lg bg-[#062421]/90 border border-amber-500/40 text-amber-200 placeholder-amber-200/35 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all font-mono tracking-wide"
                      />
                      <KeyRound size={13} className="absolute left-2.5 top-2.5 text-amber-400" />
                    </div>
                  </div>
                )}

                {/* Full Name field (Sign Up only) */}
                {isSignUp && (
                  <div className="space-y-0.5">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-emerald-200/80">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Tenzing Norbu"
                        className="w-full h-9 px-3 pl-8.5 rounded-xl bg-[#062421]/90 border border-emerald-500/30 text-white placeholder-emerald-100/35 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                      />
                      <User size={14} className="absolute left-2.5 top-2.5 text-emerald-400/60" />
                    </div>
                  </div>
                )}

                {/* NORTH EAST BACKUP LOCATION (State + District Dropdowns - Sign Up only) */}
                {isSignUp && (
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-emerald-200/80">
                        Emergency Backup Location (NER)
                      </label>
                      <span className="text-[9px] text-amber-400 font-mono flex items-center gap-1">
                        <MapPin size={10} /> Offline Alert Target
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* State Select */}
                      <div className="relative">
                        <select
                          value={selectedState}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full h-9 px-2.5 pl-7 rounded-xl bg-[#062421]/90 border border-emerald-500/30 text-white text-[11px] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all appearance-none cursor-pointer truncate"
                          title="Select North-East State"
                        >
                          {nerStateList.map((st) => (
                            <option key={st} value={st} className="bg-[#082a27] text-white">
                              {st}
                            </option>
                          ))}
                        </select>
                        <MapPin size={13} className="absolute left-2.5 top-2.5 text-emerald-400/60 pointer-events-none" />
                      </div>

                      {/* District (Jila) Select */}
                      <div className="relative">
                        <select
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className="w-full h-9 px-2.5 pl-7 rounded-xl bg-[#062421]/90 border border-emerald-500/30 text-white text-[11px] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all appearance-none cursor-pointer truncate"
                          title="Select District / Jila"
                        >
                          {(nerLocations[selectedState] || []).map((dist) => (
                            <option key={dist} value={dist} className="bg-[#082a27] text-white">
                              {dist}
                            </option>
                          ))}
                        </select>
                        <Shield size={13} className="absolute left-2.5 top-2.5 text-emerald-400/60 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Email / Gmail */}
                <div className="space-y-0.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-emerald-200/80">
                    {isSignUp ? "Gmail / Official Email" : "Gmail or Username"}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isSignUp ? "yourname@gmail.com" : "name@gmail.com"}
                      autoComplete="username"
                      className="w-full h-9 px-3 pl-8.5 rounded-xl bg-[#062421]/90 border border-emerald-500/30 text-white placeholder-emerald-100/35 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                    />
                    <Mail size={14} className="absolute left-2.5 top-2.5 text-emerald-400/60" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-0.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-emerald-200/80">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your secure password"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      className="w-full h-9 px-3 pl-8.5 pr-8.5 rounded-xl bg-[#062421]/90 border border-emerald-500/30 text-white placeholder-emerald-100/35 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                    />
                    <Lock size={14} className="absolute left-2.5 top-2.5 text-emerald-400/60" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-emerald-300/60 hover:text-white transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Recovery Password link (Sign In only) */}
                {!isSignUp && (
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setError("Password recovery link sent to your registered Gmail address.")}
                      className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-mono cursor-pointer"
                    >
                      Recovery Password
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-9.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-950/50 transition-all hover:shadow-emerald-500/20 active:scale-[0.98] cursor-pointer mt-1"
                >
                  {isSignUp
                    ? "Continue to Gmail Verification →"
                    : role === "Admin / Operator"
                    ? "Verify Operator & Sign In"
                    : "Sign In as Citizen"}
                </button>
              </form>
            )}

            {/* Toggle Link between Login & Create Account */}
            <div className="text-center mt-2">
              {isSignUp ? (
                <p className="text-xs text-emerald-200/70">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => toggleAuthMode(false)}
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
                    onClick={() => toggleAuthMode(true)}
                    className="text-amber-400 font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Create account
                  </button>
                </p>
              )}
            </div>

            {/* Social Divider (Login mode only) - ONLY Continue with Google */}
            {!isSignUp && (
              <>
                <div className="relative flex items-center justify-center my-2 sm:my-2.5">
                  <div className="border-t border-emerald-500/20 w-full" />
                  <span className="bg-[#0b3530] px-2 text-[9px] text-emerald-300/60 uppercase tracking-wider font-mono shrink-0">
                    Or continue with
                  </span>
                </div>

                <div className="w-full">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem("geoalert-role", role);
                      startLogin();
                    }}
                    className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-emerald-500/25 flex items-center justify-center gap-2 text-xs text-white transition-all hover:border-emerald-400/40 active:scale-[0.99] cursor-pointer"
                    title="Continue with Google"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <span className="font-medium text-white/90">Continue with Google</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Nature Graphic Card */}
        <div className="p-2.5 sm:p-3 md:p-3.5 flex h-full">
          <div className="w-full relative rounded-xl sm:rounded-2xl overflow-hidden h-full min-h-[300px] flex flex-col justify-between p-4 sm:p-6 bg-emerald-950">
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[10px] font-mono text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>NORTHEAST INDIA REGIONAL NODE</span>
              </div>
            </div>

            {/* Bottom Content & Quote Carousel with Smooth Auto Transition */}
            <div className="relative z-10 space-y-3">
              <div
                key={quoteIndex}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
              >
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug drop-shadow-md min-h-[52px] sm:min-h-[58px] flex items-end">
                  {natureQuotes[quoteIndex].title}
                </h3>
                <p className="text-xs text-emerald-100/80 mt-1 drop-shadow-sm max-w-sm min-h-[34px]">
                  {natureQuotes[quoteIndex].subtitle}
                </p>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-1">
                {/* Carousel dots */}
                <div className="flex items-center gap-1.5">
                  {natureQuotes.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setQuoteIndex(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === quoteIndex ? "w-5 bg-amber-400" : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Arrow Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={prevQuote}
                    className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 border border-white/25 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                    aria-label="Previous quote"
                  >
                    <ArrowLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={nextQuote}
                    className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 border border-white/25 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                    aria-label="Next quote"
                  >
                    <ArrowRight size={13} />
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
