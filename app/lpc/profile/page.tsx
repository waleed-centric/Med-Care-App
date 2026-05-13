"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getProfile, updateProfile } from "@/hooks/profile";
import Cookies from "js-cookie";
import { logout } from "@/lib/utils";
import { Users, Calendar, MessageSquare, FileText, Stethoscope, Phone, User, ChevronDown, LogOut, Camera } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LPCSidebar from "@/components/LPCSidebar";
import { updateAvailability } from "@/hooks/auth";
import { Switch } from "@/components/ui/switch";

function InfoCard({ icon, label, value }: { icon: string; label: string; value: any }) {
  return (
    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow transition-all">
      <div className="flex items-start gap-2">
        {/* <span className="text-xl">{icon}</span> */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">{label}</p>
          <p className="text-sm font-semibold text-gray-800 wrap-break-word">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, color }: { label: string; value: any; unit: string; color: string }) {
  const toFeetInches = (raw: any) => {
    if (raw === null || raw === undefined) return "";
    const cleaned = String(raw).replace(/[^\d]/g, "");
    if (!cleaned) return "";
    const n = Number(cleaned);
    if (!isFinite(n) || n <= 0) return "";
    if (n > 300) {
      const feetStr = cleaned.slice(0, cleaned.length - 2);
      const inchesStr = cleaned.slice(-2);
      const feet = Number(feetStr);
      const inches = Number(inchesStr);
      if (!isFinite(feet) || !isFinite(inches)) return "";
      return `${feet}\`${inches}`;
    }
    const totalInches = n / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}\`${inches}`;
  };

  const displayValue = label === "Height" ? toFeetInches(value) || "—" : (value ?? "—");
  const showUnit = !!value && label !== "Height";

  return (
    <div className="p-6 rounded-lg bg-white border-2 hover:shadow-md transition-all" style={{ borderColor: color }}>
      <p className="text-sm font-medium text-gray-500 uppercase mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold" style={{ color }}>
          {displayValue}
        </span>
        {showUnit && <span className="text-base text-gray-500 font-medium">{unit}</span>}
      </div>
    </div>
  );
}

export default function MyProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "contact" | "health" | "professional" | "account">("overview");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const data = await getProfile();
        if (!mounted) return;
        setProfile(data);
      } catch (e: any) {
        if (!mounted) return;
        setError("Failed to load profile");
      }
      setLoading(false);
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const user = Cookies.get("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setLoggedInUser(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const avatarToken = String(profile?.avatarUrl || profile?.avatar || "").trim();
    if (!avatarToken) return;
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("user");
        let obj: any = null;
        if (raw) {
          try { obj = JSON.parse(raw); } catch { try { obj = JSON.parse(decodeURIComponent(raw)); } catch {} }
        }
        const next = { ...(obj || {}), avatarUrl: avatarToken };
        window.localStorage.setItem("user", JSON.stringify(next));
      }
    } catch {}
    try {
      const c = Cookies.get("user");
      if (c) {
        let obj: any = null;
        try { obj = JSON.parse(c); } catch { try { obj = JSON.parse(decodeURIComponent(c)); } catch {} }
        const next = { ...(obj || {}), avatarUrl: avatarToken };
        Cookies.set("user", JSON.stringify(next));
      }
    } catch {}
    setLoggedInUser((prev: any) => ({ ...(prev || {}), avatarUrl: avatarToken }));
  }, [profile?.avatarUrl]);

  const resolveAvatar = () => {
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const token = String((profile?.avatarUrl || profile?.avatar) ?? "").trim();
    if (!token) return "/images/avatar.PNG";
    if (token.startsWith("data:")) return token;
    if (/^https?:\/\//i.test(token)) return token;
    if (token.startsWith("/uploads")) return base ? `${base}${token}` : token;
    const cleaned = token.replace(/^\/?uploads\/?/, "");
    return base ? `${base}/uploads/${cleaned}` : `/uploads/${cleaned}`;
  };

  const resolveUserAvatar = () => {
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const u = String((loggedInUser?.avatarUrl || loggedInUser?.avatar) ?? "").trim();
    if (!u) return "/images/avatar.PNG";
    if (u.startsWith("data:")) return u;
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/uploads")) return base ? `${base}${u}` : u;
    const cleaned = u.replace(/^\/?uploads\/?/, "");
    return base ? `${base}/uploads/${cleaned}` : `/uploads/${cleaned}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const role = String(loggedInUser?.role || profile?.role || "").toLowerCase();
  const isPresent = (v: any) => {
    if (v === null || v === undefined) return false;
    const s = String(v).trim();
    return s !== "";
  };

  const isNumberValid = (v: any) => (typeof v === "number" ? v > 0 : isPresent(v));

  const hasKey = (k: string) => {
    const obj: any = profile || {};
    return Object.prototype.hasOwnProperty.call(obj, k);
  };

  const contactFields = [
    { icon: "📧", label: "Email", value: profile?.email },
    { icon: "📱", label: "Phone", value: profile?.phone },
    { icon: "👤", label: "Gender", value: profile?.sex },
    { icon: "🏠", label: "Street Address", value: profile?.streetAddress },
    { icon: "🏙️", label: "City", value: profile?.city },
    { icon: "🗺️", label: "State", value: profile?.state },
    { icon: "📮", label: "ZIP Code", value: profile?.zipCode },
    { icon: "🆔", label: "Peer ID", value: profile?.peerId },
  ].filter((f) => isPresent(f.value));

  const healthMetrics = [
    { label: "Age", value: profile?.age, unit: "years", color: "#0861DC" },
    { label: "Weight", value: profile?.weight, unit: "lb", color: "#9AC63F" },
    { label: "Height", value: profile?.height, unit: "cm", color: "#0861DC" },
  ].filter((m) => isNumberValid(m.value));

  const accountFields = [
    { icon: "📅", label: "Created At", value: profile?.createdAt ? formatDate(profile.createdAt) : "" },
    { icon: "🔄", label: "Updated At", value: profile?.updatedAt ? formatDate(profile.updatedAt) : "" },
    { icon: "🔑", label: "Account ID", value: profile?._id },
  ].filter((f) => isPresent(f.value));

  const nameEditConfig = [
    { key: "firstname", label: "First Name" },
    { key: "lastname", label: "Last Name" },
  ].filter((f) => hasKey(f.key));

  const contactEditConfig = [
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "sex", label: "Gender", type: "text" },
    { key: "streetAddress", label: "Street Address", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "state", label: "State", type: "text" },
    { key: "zipCode", label: "ZIP Code", type: "text" },
    { key: "peerId", label: "Peer ID", type: "text" },
  ].filter((f) => hasKey(f.key));

  const healthEditConfig = [
    { key: "age", label: "Age", type: "number" },
    { key: "weight", label: "Weight", type: "number" },
    { key: "height", label: "Height", type: "number" },
  ].filter((f) => hasKey(f.key));

  const triggerAvatarInput = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setSaveError("Image must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setSaveError("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string | null;
      setAvatarPreview(url);
    };
    reader.readAsDataURL(file);
    setSaveError(null);
    setSaveSuccess(null);
    setField("avatarUrl", file);
  };

  const startEdit = () => {
    const next: any = {};
    nameEditConfig.forEach((f) => {
      next[f.key] = profile?.[f.key] ?? "";
    });
    contactEditConfig.forEach((f) => {
      next[f.key] = profile?.[f.key] ?? "";
    });
    healthEditConfig.forEach((f) => {
      next[f.key] = profile?.[f.key] ?? "";
    });
    setForm(next);
    setEditMode(true);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const stopEdit = () => {
    setEditMode(false);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const setField = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const payload: any = { ...form };
      Object.keys(payload).forEach((k) => {
        const v: any = payload[k];
        if (healthEditConfig.find((f) => f.key === k)) {
          const num = typeof v === "string" ? parseFloat(v) : v;
          payload[k] = isNaN(num) ? null : num;
        }
      });
      await updateProfile(payload);
      const refreshed = await getProfile();
      setProfile(refreshed);
      setSaveSuccess("Profile updated successfully");
      setEditMode(false);
    } catch (e: any) {
      setSaveError("Failed to update profile");
    }
    setSaving(false);
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
      <LPCSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-[#111827]">My Profile</div>
            <div className="flex justify-end w-full items-center gap-6">
              <div className="flex items-center gap-2 mr-auto">
                {!editMode ? (
                  <Button onClick={startEdit} className="h-9 rounded-xl bg-[#9AC63F] text-white font-semibold hover:bg-[#86b132]">Edit Profile</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={stopEdit} className="h-9 rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]">Cancel</Button>
                    <Button onClick={onSave} disabled={saving} className="h-9 rounded-xl bg-[#0861DC] text-white font-semibold hover:bg-[#074fb3]">{saving ? "Saving..." : "Save Changes"}</Button>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">Available</span>
                  <Switch 
                    checked={!!profile?.isOnline} 
                    onCheckedChange={async (c: boolean) => {
                      setProfile({ ...profile, isOnline: c });
                      try {
                        await updateAvailability(c);
                      } catch (error) {
                        console.error("Failed to update availability", error);
                      }
                    }} 
                    className="data-[state=checked]:bg-[#9AC63F]" 
                  />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-4 py-2 bg-[#111827] rounded-xl cursor-pointer hover:bg-[#1F2937] transition-colors">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                      <Image src={resolveUserAvatar()} alt="Profile" fill unoptimized className="object-cover" />
                    </div>
                    <span className="text-sm font-medium text-white">{loggedInUser?.email || loggedInUser?.name || "User"}</span>
                    <ChevronDown className="h-4 w-4 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white">
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
        {saveError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">{saveError}</div>
        )}
        {saveSuccess && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700">{saveSuccess}</div>
        )}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200" style={{ borderTopColor: '#0861DC' }}></div>
              <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header Section */}
            <div id="overview" className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar */}
                <div className="relative">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md">
                    <Image src={avatarPreview || resolveAvatar()} alt="Profile" fill className="object-cover" unoptimized />
                  </div>
                  {profile?.isOnline !== undefined && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 shadow-md border border-gray-200">
                      <div className={`h-2 w-2 rounded-full ${profile.isOnline ? 'bg-[#9AC63F]' : 'bg-gray-400'}`}></div>
                      <span className="text-xs font-medium text-gray-700">
                        {profile.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  )}
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  {editMode && (
                    <button type="button" onClick={triggerAvatarInput} disabled={saving} className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111827] text-white text-xs font-medium hover:bg-[#1F2937]">
                      <Camera className="h-3 w-3" />
                      {saving ? "Saving..." : "Choose Photo"}
                    </button>
                  )}
                </div>

                {/* Name and Quick Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    {profile?.firstname} {profile?.lastname}
                  </h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase tracking-wider">{role}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm font-medium">{profile?.phone || "No phone"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Profile Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Metrics & Quick Actions */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🛠️ Account Details
                  </h3>
                  <div className="space-y-3">
                    {accountFields.map((field, idx) => (
                      <InfoCard key={idx} {...field} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Detailed Info & Tabs */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <div id="contact" className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      📍 Contact Information
                    </h3>
                  </div>
                  {!editMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contactFields.map((field, idx) => (
                        <InfoCard key={idx} {...field} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nameEditConfig.map((f) => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{f.label}</label>
                            <Input value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} className="rounded-lg border-gray-200" />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contactEditConfig.map((f) => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{f.label}</label>
                            <Input type={f.type} value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} className="rounded-lg border-gray-200" />
                          </div>
                        ))}
                        {healthEditConfig.map((f) => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{f.label}</label>
                            <Input type={f.type} value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} className="rounded-lg border-gray-200" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Professional/Role Specific section if any */}
                {(role === 'doctor' || role === 'marketer' || role === 'lpc') && (
                  <div id="professional" className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      💼 Professional Profile
                    </h3>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-sm text-gray-600 italic">
                        Professional details and certifications are managed by the administration.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
