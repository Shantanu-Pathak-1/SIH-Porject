import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { nerLocations, nerStateList } from "@/lib/nerLocationData";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Globe,
  Info,
  Lock,
  LogOut,
  MapPin,
  Moon,
  Save,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  User,
  Volume2
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, updateProfile, deleteAccount } = useAuth();

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

  // Delete Account Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state & district if user data updates
  useEffect(() => {
    if (user?.state) setSelectedState(user.state);
    if (user?.district) setSelectedDistrict(user.district);
  }, [user]);

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
              Manage your preferences, fallback location, alert notifications, and account settings.
            </p>
          </div>

          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 px-3 py-1.5 self-start md:self-auto text-xs font-mono">
            STATUS: ACTIVE USER
          </Badge>
        </div>

        {/* Profile Card */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              User Profile Overview
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Your registered user details and authority clearance role.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Full Name</div>
                <div className="text-sm font-bold text-slate-100">{user?.name || "User"}</div>
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

              <div className="space-y-1 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Active Saved Location</div>
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  {user?.district || "Karbi Anglong"}, {user?.state || "Assam"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic System Settings */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-400" />
              Basic System Preferences
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Configure alert audio sirens, browser notifications, and high-contrast view options.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-slate-800">
            {/* Audio Alerts */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-amber-400" />
                  Emergency Audio Siren & Chime Sound
                </div>
                <div className="text-xs text-slate-400">
                  Play automatic 2-tone audio alarm when critical landslide danger is evaluated.
                </div>
              </div>
              <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
            </div>

            {/* Push Notifications */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-emerald-400" />
                  Real-Time Browser Push Alerts
                </div>
                <div className="text-xs text-slate-400">
                  Receive browser notifications for extreme rainfall & slope movement warnings.
                </div>
              </div>
              <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
            </div>

            {/* GPS Auto-Tracking */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  Automatic Live Location Fallback
                </div>
                <div className="text-xs text-slate-400">
                  Use saved State & District when live GPS satellite fix is unavailable.
                </div>
              </div>
              <Switch checked={autoLocationEnabled} onCheckedChange={setAutoLocationEnabled} />
            </div>

            {/* Theme Display */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Moon className="h-4 w-4 text-purple-400" />
                  High-Contrast Climate-Tech Dark Mode
                </div>
                <div className="text-xs text-slate-400">
                  Optimized dark forest palette for outdoor readability and field deployment.
                </div>
              </div>
              <Badge className="bg-purple-950 text-purple-300 border-purple-500/40 text-xs">
                ENABLED BY DEFAULT
              </Badge>
            </div>
          </CardContent>
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

              {/* Select Jila / District */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Select Jila / District (जिला)</Label>
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
