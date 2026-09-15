import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { triggerTieredAlert } from "@/lib/audioAlert";
import { defaultDistricts } from "@/lib/districtsData";
import { User } from "@shared/types";
import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle2,
  Filter,
  Globe,
  MapPin,
  Megaphone,
  Navigation,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function AdminControlPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");

  // Targeted Alert Dispatch State
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [targetState, setTargetState] = useState<string>("");
  const [targetDistrict, setTargetDistrict] = useState<string>("");
  const [alertTier, setAlertTier] = useState<"EMERGENCY_EVACUATION" | "NEARBY_CAUTION">("EMERGENCY_EVACUATION");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertAdvisory, setAlertAdvisory] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  // Compute unique NER states
  const nerStates = useMemo(() => Array.from(new Set(defaultDistricts.map((d) => d.state))), []);

  // Load registered users from API
  const loadUsers = async () => {
    setLoading(true);
    const data = await api.admin.getUsers();
    if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter districts options based on target or filter state
  const stateDistrictsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    defaultDistricts.forEach((d) => {
      if (!map[d.state]) map[d.state] = [];
      if (!map[d.state].includes(d.name)) map[d.state].push(d.name);
    });
    return map;
  }, []);

  const filteredDistricts = useMemo(() => {
    if (selectedState === "ALL") {
      return defaultDistricts.map((d) => d.name);
    }
    return stateDistrictsMap[selectedState] || [];
  }, [selectedState, stateDistrictsMap]);

  const targetFilteredDistricts = useMemo(() => {
    if (!targetState || targetState === "ALL") {
      return defaultDistricts.map((d) => d.name);
    }
    return stateDistrictsMap[targetState] || [];
  }, [targetState, stateDistrictsMap]);

  // Filter Users Table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesState = selectedState === "ALL" || u.state === selectedState;
      const matchesDistrict = selectedDistrict === "ALL" || u.district === selectedDistrict;

      return matchesSearch && matchesState && matchesDistrict;
    });
  }, [users, searchQuery, selectedState, selectedDistrict]);

  // Toggle User Block / Unblock Action
  const handleToggleBlock = async (userToToggle: User) => {
    try {
      const updated = await api.admin.toggleBlockUser(userToToggle.id);
      if (updated) {
        const isBlocked = updated.status === "blocked";
        toast.success(
          isBlocked
            ? `🚫 User ${updated.name} has been blocked.`
            : `✅ User ${updated.name} has been unblocked.`
        );
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        toast.error("Failed to update user status.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating user status.");
    }
  };

  // Open Alert Modal prefilled with location
  const handleOpenAlertModal = (stateName?: string, districtName?: string) => {
    setTargetState(stateName || (selectedState !== "ALL" ? selectedState : "Assam"));
    setTargetDistrict(districtName || (selectedDistrict !== "ALL" ? selectedDistrict : "Karbi Anglong (Diphu)"));
    setAlertTitle("🚨 MANUAL ADMIN HAZARD ALERT");
    setAlertAdvisory("Critical weather & landslide warning issued by District Disaster Management Command. Please take shelter immediately.");
    setIsAlertDialogOpen(true);
  };

  // Dispatch Targeted Alert
  const handleSendTargetedAlert = async () => {
    if (!targetDistrict) {
      toast.error("Please select a target district for the alert.");
      return;
    }

    setIsDispatching(true);
    try {
      const res = await api.admin.sendTargetedAlert({
        state: targetState,
        district: targetDistrict,
        alertTier,
        title: alertTitle,
        advisory: alertAdvisory,
      });

      if (res && res.success) {
        // Trigger audio alert sound & notification locally
        triggerTieredAlert(alertTier, alertTitle || "GeoAlert Notice", alertAdvisory);

        toast.success(`📢 Alert successfully dispatched to ${targetDistrict}, ${targetState || "NER"}!`, {
          description: alertAdvisory,
          duration: 6000,
        });

        setIsAlertDialogOpen(false);
      } else {
        toast.error("Failed to dispatch targeted alert.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Dispatch error occurred.");
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border border-emerald-500/30 rounded-2xl p-6 shadow-xl backdrop-blur">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-100">
                Admin & Operator Control Panel
              </h1>
            </div>
            <p className="text-sm text-emerald-300/80">
              User monitoring, GPS / fallback location verification, account access controls & manual targeted geo-alert dispatches.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleOpenAlertModal()}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 gap-2 px-5 py-2.5 rounded-xl border border-amber-400/40"
            >
              <Megaphone className="h-4 w-4 text-slate-950 animate-bounce" />
              Send Targeted Alert
            </Button>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/80 border-slate-800 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase font-medium text-slate-400">Total System Users</CardTitle>
              <Users className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{users.length}</div>
              <p className="text-xs text-slate-400 mt-1">Registered across North East Region</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase font-medium text-slate-400">Active Accounts</CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {users.filter((u) => u.status !== "blocked").length}
              </div>
              <p className="text-xs text-emerald-500/80 mt-1">Operational & Receiving Alerts</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase font-medium text-slate-400">Blocked Accounts</CardTitle>
              <UserX className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {users.filter((u) => u.status === "blocked").length}
              </div>
              <p className="text-xs text-red-400/80 mt-1">Access Suspended by Admin</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase font-medium text-slate-400">Districts Covered</CardTitle>
              <Globe className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{defaultDistricts.length}</div>
              <p className="text-xs text-cyan-400/80 mt-1">Active Hazard Monitoring Stations</p>
            </CardContent>
          </Card>
        </div>

        {/* Location Selectors & Search Controls */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
          <CardHeader className="pb-4 border-b border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-emerald-400" />
                  Filter Users by Location & Search
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Select state or district to isolate specific location users for review or targeted alert dispatches.
                </CardDescription>
              </div>

              {/* Reset Filter button if active */}
              {(selectedState !== "ALL" || selectedDistrict !== "ALL" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedState("ALL");
                    setSelectedDistrict("ALL");
                    setSearchQuery("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 self-start md:self-auto"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Search Bar */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Search User / Email</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search name, email, role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* State Select Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">State (राज्य)</Label>
                <Select
                  value={selectedState}
                  onValueChange={(val) => {
                    setSelectedState(val);
                    setSelectedDistrict("ALL"); // Reset district when state changes
                  }}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="ALL">🌐 All States (सभी राज्य)</SelectItem>
                    {nerStates.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District Select Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">District (जिला)</Label>
                <Select value={selectedDistrict} onValueChange={(val) => setSelectedDistrict(val)}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 max-h-60 overflow-y-auto">
                    <SelectItem value="ALL">📍 All Districts (सभी जिले)</SelectItem>
                    {filteredDistricts.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Table */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                Registered System Users ({filteredUsers.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                View live GPS coordinates (if active) or fallback login location (State & District).
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading user database...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No matching users found for selected filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-950/80">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-xs font-bold text-slate-300">User Details</TableHead>
                      <TableHead className="text-xs font-bold text-slate-300">Role</TableHead>
                      <TableHead className="text-xs font-bold text-slate-300">
                        Location (Live GPS / Fallback)
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-300">Status</TableHead>
                      <TableHead className="text-xs font-bold text-slate-300 text-right">Admin Controls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const isBlocked = u.status === "blocked";
                      const isCurrent = u.id === currentUser?.id;

                      return (
                        <TableRow key={u.id} className="border-slate-800 hover:bg-slate-850/50 transition-colors">
                          {/* User Name & Email */}
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 text-sm">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-100 flex items-center gap-2">
                                  <span>{u.name}</span>
                                  {isCurrent && (
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                                      YOU
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Role Badge */}
                          <TableCell className="py-3.5">
                            <Badge
                              variant="outline"
                              className={
                                u.role === "Admin / Operator"
                                  ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                                  : u.role === "District Collector"
                                  ? "bg-purple-500/15 text-purple-300 border-purple-500/40"
                                  : u.role === "Field Engineer"
                                  ? "bg-blue-500/15 text-blue-300 border-blue-500/40"
                                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                              }
                            >
                              {u.role || "Citizen"}
                            </Badge>
                          </TableCell>

                          {/* Location Column */}
                          <TableCell className="py-3.5">
                            {u.liveLatitude && u.liveLongitude ? (
                              <div className="space-y-1">
                                <Badge className="bg-emerald-950 text-emerald-300 border-emerald-500/40 gap-1 font-mono text-xs">
                                  <Navigation className="h-3 w-3 text-emerald-400 animate-pulse" />
                                  Live GPS: {u.liveLatitude.toFixed(2)}, {u.liveLongitude.toFixed(2)}
                                </Badge>
                                <div className="text-[11px] text-slate-400 pl-1">
                                  {u.district || "NER Region"}, {u.state || "India"}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 gap-1 text-xs">
                                  <MapPin className="h-3 w-3 text-amber-400" />
                                  Fallback Location (Saved)
                                </Badge>
                                <div className="text-xs font-medium text-slate-200 pl-1">
                                  State: <span className="text-emerald-400">{u.state || "Assam"}</span> | District:{" "}
                                  <span className="text-amber-400">{u.district || "Karbi Anglong"}</span>
                                </div>
                              </div>
                            )}
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell className="py-3.5">
                            {isBlocked ? (
                              <Badge className="bg-red-950/80 text-red-400 border-red-500/40 gap-1">
                                <Ban className="h-3 w-3" />
                                Blocked
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-950/80 text-emerald-400 border-emerald-500/40 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </Badge>
                            )}
                          </TableCell>

                          {/* Actions Column */}
                          <TableCell className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Send Target Alert to User's location */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenAlertModal(u.state, u.district)}
                                className="h-8 bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 text-xs gap-1"
                              >
                                <Bell className="h-3.5 w-3.5" />
                                Alert Location
                              </Button>

                              {/* Block / Unblock Toggle */}
                              {!isCurrent && (
                                <Button
                                  size="sm"
                                  variant={isBlocked ? "default" : "destructive"}
                                  onClick={() => handleToggleBlock(u)}
                                  className={`h-8 text-xs font-semibold gap-1 ${
                                    isBlocked
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : "bg-red-600 hover:bg-red-700 text-white"
                                  }`}
                                >
                                  {isBlocked ? (
                                    <>
                                      <UserCheck className="h-3.5 w-3.5" />
                                      Unblock
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="h-3.5 w-3.5" />
                                      Block
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Targeted Geo-Alert Dispatch Dialog Modal */}
        <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-amber-400 flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-amber-400" />
                Dispatch Targeted Geo-Location Alert
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Manually broadcast an emergency alert to all registered users in a specific State & District.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Alert Severity Tier */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Alert Tier Level</Label>
                <Select
                  value={alertTier}
                  onValueChange={(val: any) => setAlertTier(val)}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="EMERGENCY_EVACUATION">
                      🚨 Tier 1: Emergency Evacuation Alert (Siren & Alarm)
                    </SelectItem>
                    <SelectItem value="NEARBY_CAUTION">
                      ⚠️ Tier 2: Nearby Area Caution Advisory (Chime)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">Target State (राज्य)</Label>
                  <Select
                    value={targetState}
                    onValueChange={(val) => {
                      setTargetState(val);
                      setTargetDistrict(stateDistrictsMap[val]?.[0] || "");
                    }}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      {nerStates.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target District */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">Target District (जिला)</Label>
                  <Select value={targetDistrict} onValueChange={(val) => setTargetDistrict(val)}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 max-h-48 overflow-y-auto">
                      {targetFilteredDistricts.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Alert Title */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Alert Title Header</Label>
                <Input
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="e.g. 🚨 CRITICAL LANDSLIDE WARNING"
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>

              {/* Advisory Message Textarea */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Advisory Warning Message</Label>
                <Textarea
                  rows={3}
                  value={alertAdvisory}
                  onChange={(e) => setAlertAdvisory(e.target.value)}
                  placeholder="Type emergency instructions for citizens in this location..."
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsAlertDialogOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendTargetedAlert}
                disabled={isDispatching}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2"
              >
                {isDispatching ? "Dispatching Alert..." : "📢 Dispatch Alert Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
