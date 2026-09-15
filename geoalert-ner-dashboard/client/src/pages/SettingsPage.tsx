import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { triggerTieredAlert } from "@/lib/audioAlert";
import { nerLocations, nerStateList } from "@/lib/nerLocationData";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Edit3,
  Globe,
  Info,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Moon,
  Navigation,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  User,
  Volume2,
  VolumeX,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const isAdmin = user?.role === "Admin / Operator";

  // Name Edit State
  const [name, setName] = useState(user?.name || "");
  const [isSavingName, setIsSavingName] = useState(false);

  // Basic Settings States
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [autoLocationEnabled, setAutoLocationEnabled] = useState(true);

  // Fallback Location States
  const [selectedState, setSelectedState] = useState(user?.state || nerStateList[0]);
  const [selectedDistrict, setSelectedDistrict] = useState(
    user?.district || nerLocations[nerStateList[0]]?.[0] || ""
  );
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // Browser Permission Live States
  const [gpsPermission, setGpsPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Delete Account Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync initial values
  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.state) setSelectedState(user.state);
    if (user?.district) setSelectedDistrict(user.district);
  }, [user]);

  // Check initial browser permissions
  useEffect(() => {
    // Check Notification Permission
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }

    // Check Geolocation Permission status API if supported
    if (typeof window !== "undefined" && "navigator" in window && "permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as any })
        .then((result) => {
          setGpsPermission(result.state as any);
          result.onchange = () => {
            setGpsPermission(result.state as any);
          };
        })
        .catch(() => {});
    }
  }, []);

  // Handle Name Change Save
  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("Please enter a valid full name.");
      return;
    }

    setIsSavingName(true);
    try {
      const updated = await updateProfile({ name: name.trim() });
      if (updated) {
        toast.success("✅ Profile Name Updated Successfully!", {
          description: `Account name updated to ${name.trim()}.`,
        });
      } else {
        toast.error("Failed to update name.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error updating name.");
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle State Change -> Update Available District Options
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const districts = nerLocations[stateName] || [];
    setSelectedDistrict(districts[0] || "");
  };

  // Save Fallback Location Update
  const handleSaveLocation = async () => {
    setIsSavingLocation(true);
    try {
      const updated = await updateProfile({
        state: selectedState,
        district: selectedDistrict,
      });

      if (updated) {
        toast.success("✅ Fallback Location Updated Successfully!", {
          description: `Default Location set to ${selectedDistrict}, ${selectedState}.`,
        });
      } else {
        toast.error("Failed to update location.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error updating fallback location.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Browser Permission Triggers
  const handleRequestGpsPermission = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    toast.info("📍 Requesting GPS Location Access...", {
      description: "Please click 'Allow' in your browser popup window.",
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsPermission("granted");
        toast.success(`✅ GPS Permission Granted!`, {
          description: `Lat: ${pos.coords.latitude.toFixed(2)}, Lon: ${pos.coords.longitude.toFixed(2)}`,
        });
      },
      (err) => {
        setGpsPermission("denied");
        toast.error(`❌ GPS Permission Denied (${err.message})`, {
          description: "Location permission is required for auto hazard proximity evaluation.",
        });
      },
      { timeout: 10000 }
    );
  };

  const handleRequestPushPermission = () => {
    if (!("Notification" in window)) {
      toast.error("Push Notifications are not supported by your browser.");
      return;
    }

    Notification.requestPermission().then((permission) => {
      setPushPermission(permission);
      if (permission === "granted") {
        toast.success("🔔 Browser Push Notification Permission Granted!", {
          description: "You will now receive emergency hazard popups from Vercel web deployment.",
        });
        // Send sample browser notification
        new Notification("GeoAlert Push Verification", {
          body: "Push notification permissions are fully active and working!",
          icon: "/favicon.ico",
        });
      } else {
        toast.error("❌ Notification permission was blocked or denied.");
      }
    });
  };

  const handleTestAudioEngine = () => {
    triggerTieredAlert("NEARBY_CAUTION", "🔊 Web Audio Engine Initialized", "AudioContext active & ready.");
    setAudioUnlocked(true);
    toast.success("🔊 Web Audio Siren Engine Initialized!", {
      description: "Web AudioContext unlocked for emergency siren playback.",
    });
  };

  // Delete Account Confirmation
  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteAccount();
      if (success) {
        toast.success("🗑️ Your account has been permanently deleted.");
        setIsDeleteDialogOpen(false);
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Account deletion error.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <SettingsIcon className="h-7 w-7 text-emerald-400" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
                System & Account Settings
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Manage your name, fallback location, browser permissions (Vercel/Chrome), alert demos, and account settings.
            </p>
          </div>

          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 px-3 py-1.5 self-start md:self-auto text-xs font-mono">
            STATUS: ACTIVE USER
          </Badge>
        </div>

        {/* ADMIN EXCLUSIVE: Alert Demo Panel */}
        {isAdmin && (
          <Card className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-amber-500/40 shadow-xl">
            <CardHeader className="pb-3 border-b border-amber-500/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                  🔊 Admin Emergency Audio & Alert Demo Panel
                </CardTitle>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                  ADMIN / OPERATOR ONLY
                </Badge>
              </div>
              <CardDescription className="text-xs text-amber-200/70">
                Test Tier-1 Emergency Evacuation Siren and Tier-2 Caution Chime sounds with instant browser push alert.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tier 1 Siren Demo */}
                <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-red-300 flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-red-400 animate-pulse" />
                      Tier-1 Emergency Siren Demo
                    </div>
                    <p className="text-xs text-red-200/70">
                      Plays loud 2-tone emergency evacuation alarm siren sound & triggers browser push alert.
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      triggerTieredAlert(
                        "EMERGENCY_EVACUATION",
                        "🚨 DEMO EMERGENCY EVACUATION",
                        "High hazard risk detected near your location. Immediate evacuation advised."
                      )
                    }
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold gap-2 text-xs shadow-lg shadow-red-600/20"
                  >
                    <Volume2 className="h-4 w-4" />
                    🚨 Test Tier-1 Emergency Siren
                  </Button>
                </div>

                {/* Tier 2 Chime Demo */}
                <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-amber-400" />
                      Tier-2 Caution Chime Demo
                    </div>
                    <p className="text-xs text-amber-200/70">
                      Plays soft 2-note neighboring area caution advisory chime sound & push notification.
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      triggerTieredAlert(
                        "NEARBY_CAUTION",
                        "⚠️ DEMO NEARBY AREA CAUTION",
                        "Heavy rainfall observed in neighboring district. Stay alert for slope corridors."
                      )
                    }
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2 text-xs shadow-lg shadow-amber-500/20"
                  >
                    <Volume2 className="h-4 w-4 text-slate-950" />
                    ⚠️ Test Tier-2 Caution Chime
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Card & Name Edit */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              User Profile & Name Edit
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              View your registered email, authority clearance role, and update your account display name.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name Edit Input */}
              <div className="space-y-1.5 sm:col-span-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <Label className="text-xs text-slate-300 uppercase font-semibold flex items-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5 text-emerald-400" />
                  Full Display Name (edit permission enabled)
                </Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-slate-900 border-slate-700 text-slate-100 focus:border-emerald-500 flex-1"
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={isSavingName || !name.trim() || name === user?.name}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shrink-0"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingName ? "Saving..." : "Save Name"}
                  </Button>
                </div>
              </div>

              <div className="space-y-1 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Email Address</div>
                <div className="text-sm font-bold text-slate-100">{user?.email || "user@gmail.com"}</div>
              </div>

              <div className="space-y-1 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Account Role</div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      user?.role === "Admin / Operator"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }
                  >
                    {user?.role || "Citizen"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BROWSER PERMISSIONS MANAGER (Vercel & Chrome Deployment) */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-400" />
              🔒 Browser Permissions Manager (Vercel & Chrome Deployment)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Manage browser security permissions required for live GPS proximity tracking, Web Audio siren playback, and push alerts.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 divide-y divide-slate-800">
            {/* GPS Location Permission */}
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-cyan-400" />
                  GPS Location Satellite Fix Permission
                </div>
                <div className="text-xs text-slate-400">
                  Required for real-time Haversine distance evaluation from active landslide zones.
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge
                  className={
                    gpsPermission === "granted"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                      : gpsPermission === "denied"
                      ? "bg-red-950 text-red-300 border-red-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }
                >
                  {gpsPermission === "granted" ? "✅ GRANTED" : gpsPermission === "denied" ? "❌ DENIED" : "📌 NOT PROMPTED"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestGpsPermission}
                  className="h-8 text-xs bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                >
                  Request GPS Access
                </Button>
              </div>
            </div>

            {/* Push Notification Permission */}
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-emerald-400" />
                  Browser Emergency Push Notification Permission
                </div>
                <div className="text-xs text-slate-400">
                  Allows Chrome/Edge to trigger push advisory popups even when tab is minimized.
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge
                  className={
                    pushPermission === "granted"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                      : pushPermission === "denied"
                      ? "bg-red-950 text-red-300 border-red-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }
                >
                  {pushPermission === "granted" ? "✅ GRANTED" : pushPermission === "denied" ? "❌ DENIED" : "📌 DEFAULT"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestPushPermission}
                  className="h-8 text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                >
                  Enable Push Alerts
                </Button>
              </div>
            </div>

            {/* Web Audio Siren Permission */}
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-amber-400" />
                  Web Audio Siren Engine Initialization
                </div>
                <div className="text-xs text-slate-400">
                  Chrome autoplay security policy requires 1 user click gesture to unlock WebAudio Context.
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge
                  className={
                    audioUnlocked
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-950 text-amber-300 border-amber-500/40"
                  }
                >
                  {audioUnlocked ? "✅ UNLOCKED" : "⚠️ REQUIRES GESTURE"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestAudioEngine}
                  className="h-8 text-xs bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                >
                  Unlock Audio Engine
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-3 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>
              Note for Vercel deployment: HTTPS protocol automatically handles browser permission security popups across Chrome, Edge, Safari, and Mobile browsers.
            </span>
          </CardFooter>
        </Card>

        {/* Change Fallback Location */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-400" />
              Change Fallback Location (राज्य / जिला)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Update your primary North-East State and District used when GPS location permissions are disabled.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select State */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Select State (राज्य)</Label>
                <Select value={selectedState} onValueChange={handleStateChange}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    {nerStateList.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select District */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Select District (जिला)</Label>
                <Select value={selectedDistrict} onValueChange={(val) => setSelectedDistrict(val)}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 max-h-56 overflow-y-auto">
                    {(nerLocations[selectedState] || []).map((dist) => (
                      <SelectItem key={dist} value={dist}>
                        {dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
              <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Your fallback location is used by the hazard engine to deliver satellite rainfall and slope risk alerts
                specific to <strong className="text-emerald-300">{selectedDistrict}</strong>.
              </span>
            </div>
          </CardContent>

          <CardFooter className="border-t border-slate-800 pt-4 flex justify-end">
            <Button
              onClick={handleSaveLocation}
              disabled={isSavingLocation}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Save className="h-4 w-4" />
              {isSavingLocation ? "Saving Changes..." : "Save Fallback Location"}
            </Button>
          </CardFooter>
        </Card>

        {/* Delete Account (Danger Zone) */}
        <Card className="bg-red-950/20 border-red-500/40 shadow-xl">
          <CardHeader className="pb-3 border-b border-red-500/30">
            <CardTitle className="text-lg font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Danger Zone - Delete Account
            </CardTitle>
            <CardDescription className="text-xs text-red-300/80">
              Permanently remove your account and stored preferences from the GeoAlert database.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Once you delete your account, your profile information, authority access permissions, and saved location preferences will be permanently wiped. This action is irreversible.
            </p>
          </CardContent>

          <CardFooter className="border-t border-red-500/30 pt-4 flex justify-between items-center">
            <div className="text-xs text-red-400/80">
              User: <strong className="text-slate-200">{user?.email}</strong>
            </div>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete My Account
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                    Confirm Account Deletion
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Are you sure you want to permanently delete your account?
                  </DialogDescription>
                </DialogHeader>

                <div className="py-3 text-xs text-slate-300 space-y-2">
                  <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-200">
                    ⚠️ <strong>Warning:</strong> You will be signed out immediately and all account data for{" "}
                    <strong>{user?.email}</strong> will be erased.
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccountConfirm}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                  >
                    {isDeleting ? "Deleting Account..." : "Yes, Delete Account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
