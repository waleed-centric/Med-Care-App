"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getProfile, updateProfile } from "@/hooks/profile";
import { logout, updateAvailability, getAvailability } from "@/hooks/auth";
import Cookies from "js-cookie";
import {
  Users, Calendar, MessageSquare, FileText, Stethoscope, Grid,
  User, ChevronDown, LogOut, Camera, Search, Bell, MapPin,
  Pencil, X, Check, Upload, Trash2, Plus, Download, Loader2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// --- Components for Sections ---

function EditableField({
  label,
  value,
  isEditing,
  onChange,
  type = "text",
  placeholder = "",
  className = "",
  error
}: {
  label: string;
  value: any;
  isEditing: boolean;
  onChange: (val: any) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Label className="text-sm font-medium text-gray-500 uppercase">{label}</Label>
      {isEditing ? (
        <>
          <Input
            type={type}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`h-10 bg-gray-50 border-gray-200 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </>
      ) : (
        <p className="text-base font-semibold text-gray-900 min-h-6 wrap-break-word">
          {type === "password" ? "••••••••••••" : (value || "—")}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ title, onEdit, isEditing, onSave, onCancel, saving }: any) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onSave} disabled={saving} className="h-8 w-8 p-0 rounded-full bg-[#9AC63F]/10 hover:bg-[#9AC63F]/20 text-[#9AC63F]">
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-gray-400 hover:text-gray-900">
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function calculateAge(dob: any) {
  if (!dob) return "";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function MyProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  // State for edits
  const [activeTab, setActiveTab] = useState("basic");

  // Edit states for sections
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(false);

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});

  const validateBasicInfo = () => {
    const errors: any = {};

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone Validation
    // Allowing digits, spaces, dashes, plus sign, parentheses. Min 10 digits/chars approx.
    const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
    if (!form.phone || !phoneRegex.test(form.phone)) {
      errors.phone = "Please enter a valid phone number (min 10 characters)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const certificatesInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const data = await getProfile();
        if (!mounted) return;
        setProfile(data);
        setForm(data);

        // Fetch availability
        try {
          const avail = await getAvailability();
          if (mounted && avail && typeof avail.available === 'boolean') {
            setProfile((prev: any) => ({ ...prev, isOnline: avail.available }));
            setForm((prev: any) => ({ ...prev, isOnline: avail.available }));
          }
        } catch (e) {
          console.error("Failed to fetch availability", e);
        }

      } catch (e: any) {
        if (!mounted) return;
        setError("Failed to load profile");
      }
      setLoading(false);
    };
    run();

    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        setLoggedInUser(JSON.parse(userCookie));
      } catch { }
    }

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!profile?.avatarUrl) return;
    const updateStorage = () => {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem("user") : null;
        if (raw) {
          const obj = JSON.parse(raw);
          window.localStorage.setItem("user", JSON.stringify({ ...obj, avatarUrl: profile.avatarUrl }));
        }
      } catch { }
    };
    updateStorage();
  }, [profile?.avatarUrl]);

  const resolveAvatar = (url: string | undefined | null) => {
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const token = String(url || "").trim();
    if (!token) return "/images/avatar.PNG";
    if (token.startsWith("data:")) return token;
    if (/^https?:\/\//i.test(token)) return token;
    if (token.startsWith("/uploads")) return base ? `${base}${token}` : token;
    const cleaned = token.replace(/^\/?uploads\/?/, "");
    return base ? `${base}/uploads/${cleaned}` : `/uploads/${cleaned}`;
  };

  const navLinkClasses = (href: string) => {
    const isActive = pathname === href || pathname.endsWith(href);
    return `flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? "text-[#9AC63F] cursor-default" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
      }`;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    const formData = new FormData();
    formData.append("avatarUrl", file);

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      await updateProfile(formData);
      const refreshed = await getProfile();
      setProfile(refreshed);

      // Update local storage user object
      const userStr = Cookies.get("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedUser = { ...user, avatarUrl: refreshed.avatarUrl };
        Cookies.set("user", JSON.stringify(updatedUser), { secure: true, sameSite: "strict", expires: 7 });
        setLoggedInUser(updatedUser);

        // Trigger a storage event for other tabs/components
        window.localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Avatar upload failed", e);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    // Combine existing "certificates" (strings) with new "certificates" (Files)
    // Actually, we should probably keep them separate in form state if we want to display them differently
    // But updateProfile expects them in the payload.
    // Let's mix them into 'certificates' array in form, but be careful with display logic.

    const currentCerts = form.certificates || [];
    setForm({ ...form, certificates: [...currentCerts, ...newFiles] });
  };

  const handleSave = async (section: "basic" | "professional") => {
    if (section === "basic") {
      if (!validateBasicInfo()) return;
    }
    setSaving(true);
    try {
      const payload = { ...form };

      // Ensure specific fields are correctly formatted if necessary
      // e.g. converting strings to numbers if the API expects numbers
      if (payload.workExperience) payload.workExperience = Number(payload.workExperience);

      // Sanitize certificates: Extract URL strings from objects for existing certificates
      if (payload.certificates && Array.isArray(payload.certificates)) {
        payload.certificates = payload.certificates.map((cert: any) => {
          if (typeof File !== 'undefined' && cert instanceof File) return cert;
          if (typeof cert === 'string') return cert;
          if (typeof cert === 'object' && cert !== null) {
            // If it's an existing certificate object, send just the URL/path if possible
            // The backend likely expects a string path for existing files
            return cert.url || cert.path || cert.fileUrl || cert.avatarUrl || JSON.stringify(cert);
          }
          return cert;
        });
      }

      await updateProfile(payload);
      const refreshed = await getProfile();
      setProfile(refreshed);
      // Update form with clean data from server
      setForm(refreshed);

      if (section === "basic") setEditingBasic(false);
      if (section === "professional") setEditingProfessional(false);
    } catch (e) {
      console.error("Failed to save", e);
      // setSaveError("Failed to save changes."); 
      // Could add toast here
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (section: "basic" | "professional") => {
    setForm(profile); // Reset form to current profile
    setFormErrors({});
    if (section === "basic") setEditingBasic(false);
    if (section === "professional") setEditingProfessional(false);
  };

  const role = String(loggedInUser?.role || profile?.role || "").toLowerCase();

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Sidebar - HIDDEN ON MOBILE FOR NOW AS PER EXISTING PATTERN OR SIMPLIFIED */}
      <aside className="w-[280px] bg-white hidden md:flex flex-col border-r border-gray-100 z-20">
        <div className="p-8 pb-4">
          <Image src="/images/logo.svg" alt="Excel Connect" width={180} height={40} className="w-auto h-full" priority />
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto">
          <Link href="/my-profile" onClick={(e) => { e.preventDefault(); if (pathname !== "/my-profile") window.location.href = "/my-profile"; }} className={navLinkClasses("/my-profile")}>
            <div className="w-6"><User size={20} /></div>
            <span className="font-medium">Profile</span>
          </Link>

          {role === "patient" && (
            <>
              {/* <Link href="/patient/client" className={navLinkClasses("/patient/client")}>
                <div className="w-6"><Users size={20} /></div>
                <span className="font-medium">Clients</span>
              </Link> */}
              <Link href="/patient/schedule" onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/schedule") window.location.href = "/patient/schedule"; }} className={navLinkClasses("/patient/schedule")}>
                <div className="w-6"><Calendar size={20} /></div>
                <span className="font-medium">Schedule</span>
              </Link>
              <Link href="/patient/messages" onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/messages") window.location.href = "/patient/messages"; }} className={navLinkClasses("/patient/messages")}>
                <div className="w-6"><MessageSquare size={20} /></div>
                <span className="font-medium">Chats</span>
              </Link>
              {/* <Link href="/patient/get-assessment" onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/get-assessment") window.location.href = "/patient/get-assessment"; }} className={navLinkClasses("/patient/get-assessment")}>
                <div className="w-6"><FileText size={20} /></div>
                <span className="font-medium">Get an Assessment</span>
              </Link> */}
              <Link href="/patient/see-therapist" onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/see-therapist") window.location.href = "/patient/see-therapist"; }} className={navLinkClasses("/patient/see-therapist")}>
                <div className="w-6"><Stethoscope size={20} /></div>
                <span className="font-medium">See a Therapist</span>
              </Link>
            </>
          )}

          {role === "doctor" && (
            <>
              <Link href="/doctor/dashboard" onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/dashboard") window.location.href = "/doctor/dashboard"; }} className={navLinkClasses("/doctor/dashboard")}>
                <div className="w-6"><Users size={20} /></div>
                <span className="font-medium">Overview</span>
              </Link>
              <Link href="/doctor/patients" onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/patients") window.location.href = "/doctor/patients"; }} className={navLinkClasses("/doctor/patients")}>
                 <div className="w-6"><Users size={20} /></div>
                 <span className="font-medium">Clients</span>
               </Link>
              <Link href="/doctor/schedule" onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/schedule") window.location.href = "/doctor/schedule"; }} className={navLinkClasses("/doctor/schedule")}>
                <div className="w-6"><Calendar size={20} /></div>
                <span className="font-medium">Schedule</span>
              </Link>
              <Link href="/doctor/messages" onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/messages") window.location.href = "/doctor/messages"; }} className={navLinkClasses("/doctor/messages")}>
                <div className="w-6"><MessageSquare size={20} /></div>
                <span className="font-medium">Chats</span>
              </Link>
            </>
          )}
          {role === "marketer" && (
            <>
              <Link href="/marketer/client" onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/client") window.location.href = "/marketer/client"; }} className={navLinkClasses("/marketer/client")}>
                <div className="w-6"><Users size={20} /></div>
                <span className="font-medium">Client List</span>
              </Link>
              <Link href="/marketer/messages" onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/messages") window.location.href = "/marketer/messages"; }} className={navLinkClasses("/marketer/messages")}>
                <div className="w-6"><MessageSquare size={20} /></div>
                <span className="font-medium">Chats</span>
              </Link>
              <Link href="/marketer/get-assessment" onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/get-assessment") window.location.href = "/marketer/get-assessment"; }} className={navLinkClasses("/marketer/get-assessment")}>
                <div className="w-6"><FileText size={20} /></div>
                <span className="font-medium">Assign a Doctor</span>
              </Link>
              <Link href="/marketer/see-therapist" onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/see-therapist") window.location.href = "/marketer/see-therapist"; }} className={navLinkClasses("/marketer/see-therapist")}>
                <div className="w-6"><Stethoscope size={20} /></div>
                <span className="font-medium">Connect client to a therapist</span>
              </Link>
            </>
          )}

          {role === "lpc" && (
            <>
              <Link href="/lpc/dashboard" onClick={(e) => { e.preventDefault(); if (pathname !== "/lpc/dashboard") window.location.href = "/lpc/dashboard"; }} className={navLinkClasses("/lpc/dashboard")}>
                <div className="w-6"><Grid size={20} /></div>
                <span className="font-medium">Overview</span>
              </Link>
              <Link href="/lpc/patients" onClick={(e) => { e.preventDefault(); if (pathname !== "/lpc/patients") window.location.href = "/lpc/patients"; }} className={navLinkClasses("/lpc/patients")}>
                <div className="w-6"><Users size={20} /></div>
                <span className="font-medium">Clients</span>
              </Link>
              <Link href="/lpc/schedule" onClick={(e) => { e.preventDefault(); if (pathname !== "/lpc/schedule") window.location.href = "/lpc/schedule"; }} className={navLinkClasses("/lpc/schedule")}>
                <div className="w-6"><Calendar size={20} /></div>
                <span className="font-medium">Schedule</span>
              </Link>
              <Link href="/lpc/messages" onClick={(e) => { e.preventDefault(); if (pathname !== "/lpc/messages") window.location.href = "/lpc/messages"; }} className={navLinkClasses("/lpc/messages")}>
                <div className="w-6"><MessageSquare size={20} /></div>
                <span className="font-medium">Chats</span>
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white px-8 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10 h-20">
          <div className="relative w-96 hidden md:block">
            {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input className="pl-10 h-11 bg-[#F9FAFB] border-none rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-[#9AC63F]" placeholder="Search" /> */}
          </div>

          <div className="flex items-center gap-6 ml-auto">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">Available</span>
              <Switch checked={profile?.isOnline} onCheckedChange={async (c) => {
                setForm({ ...form, isOnline: c });
                setProfile({ ...profile, isOnline: c });
                try {
                  await updateAvailability(c);
                } catch (error) {
                  console.error("Failed to update availability", error);
                }
              }} className="data-[state=checked]:bg-[#9AC63F]" />
            </div>

            {/* <button className="relative p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-2.5 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 pl-2 cursor-pointer">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <Image
                      src={resolveAvatar(loggedInUser?.avatarUrl || profile?.avatarUrl)}
                      alt="Profile"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="bg-[#111827] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 min-w-[140px] justify-between transition-colors hover:bg-[#1f2937]">
                    <span className="text-sm font-medium truncate max-w-[100px]">{loggedInUser?.lastname || profile?.lastname || "User"}</span>
                    <ChevronDown className="h-4 w-4 text-white/70" />
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 md:p-8">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9AC63F]"></div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start border border-gray-100">
                <div className="relative group shrink-0">
                  <div className="h-32 w-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
                    <Image
                      src={avatarPreview || resolveAvatar(profile?.avatarUrl)}
                      alt={profile?.firstname || "User"}
                      fill
                      className={`object-cover transition-opacity duration-300 ${uploadingAvatar ? 'opacity-50' : 'opacity-100'}`}
                      unoptimized
                    />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                         <Loader2 className="h-8 w-8 text-[#9AC63F] animate-spin" />
                      </div>
                    )}
                  </div>
                  <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="absolute -bottom-2.5 -right-2.5 bg-white p-2.5 rounded-full shadow-md text-gray-700 hover:text-[#9AC63F] transition-colors border border-gray-100 z-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    <Camera className="h-4 w-4" />
                  </button>
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>

                <div className="flex-1 text-center md:text-left pt-2 w-full">
                  <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        {profile?.firstname} {profile?.lastname}
                      </h1>
                      <p className="text-gray-500 font-medium mb-6 capitalize">{profile?.specialization || profile?.role}</p>
                    </div>
                    {/* Status / Actions could go here */}
                  </div>

                  {/* Tabs List */}
                  <div className="bg-gray-100 p-1.5 rounded-xl inline-flex gap-1 w-full md:w-auto">
                    <button
                      onClick={() => setActiveTab("basic")}
                      className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 md:flex-none ${activeTab === "basic" ? "bg-[#9AC63F] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"}`}
                    >
                      Basic Information
                    </button>
                    {role !== "patient" && role !== "marketer" && (
                    <button
                      onClick={() => setActiveTab("professional")}
                      className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 md:flex-none ${activeTab === "professional" ? "bg-[#9AC63F] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"}`}
                    >
                      Professional Information
                    </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Sections */}

              {activeTab === "basic" && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SectionHeader
                    title=""
                    isEditing={editingBasic}
                    onEdit={() => { setEditingBasic(true); setForm(profile); setFormErrors({}); }}
                    onSave={() => handleSave("basic")}
                    onCancel={() => handleCancel("basic")}
                    saving={saving}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <EditableField
                      type="number"
                      label="Phone No."
                      value={form.phone}
                      isEditing={editingBasic}
                      onChange={(v) => {
                        setForm({ ...form, phone: v });
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                      }}
                      error={formErrors.phone}
                    />
                    <EditableField
                      label="Email"
                      value={form.email}
                      isEditing={editingBasic}
                      onChange={(v) => {
                        setForm({ ...form, email: v });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                      }}
                      error={formErrors.email}
                    />

                    {/* Password - Special Case */}
                    <div className="flex flex-col gap-2 relative">
                      <Label className="text-sm font-medium text-gray-500 uppercase">Password</Label>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-gray-900 min-h-6 tracking-widest mt-1">•••••••••••••</p>
                        {/* {!editingBasic && <button className="text-gray-400 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>} */}
                      </div>
                    </div>

                    <EditableField
                      label={role === "patient" ? "Age" : "Date of Birth"}
                      value={role === "patient"
                        ? (form.age ?? calculateAge(form.dateofBirth))
                        : (form.dateofBirth ? new Date(form.dateofBirth).toISOString().split("T")[0] : "")
                      }
                      isEditing={editingBasic}
                      onChange={(v) => role === "patient" ? setForm({ ...form, age: v }) : setForm({ ...form, dateofBirth: v })}
                      type={role === "patient" ? "number" : (editingBasic ? "date" : "text")}
                    />

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium text-gray-500 uppercase">Gender</Label>
                      {editingBasic ? (
                        <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                          <SelectTrigger className="h-10 bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-base font-semibold text-gray-900 min-h-6">{form?.sex || "—"}</p>
                      )}
                    </div>

                    <EditableField
                      label="Street Address"
                      value={form.streetAddress}
                      isEditing={editingBasic}
                      onChange={(v) => setForm({ ...form, streetAddress: v })}
                    />

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium text-gray-500 uppercase">City</Label>
                      {editingBasic ? (
                        <Input
                          value={form.city ?? ""}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          className="h-10 bg-gray-50 border-gray-200"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-gray-900">{profile?.city || "—"}</p>
                          {/* <ChevronDown className="h-4 w-4 text-gray-400" /> */}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium text-gray-500 uppercase">State</Label>
                      {editingBasic ? (
                        <Input
                          value={form.state ?? ""}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          className="h-10 bg-gray-50 border-gray-200"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-gray-900">{profile?.state || "—"}</p>
                          {/* <ChevronDown className="h-4 w-4 text-gray-400" /> */}
                        </div>
                      )}
                    </div>

                    <EditableField
                      label="Zip Code"
                      value={form.zipCode}
                      isEditing={editingBasic}
                      onChange={(v) => setForm({ ...form, zipCode: v })}
                    />
                  </div>
                </div>
              )}

              {activeTab === "professional" && role !== "patient" && (
                <div className="bg-white rounded-3xl p-8 shadow-sm space-y-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">About</h3>
                    {editingProfessional ? (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleCancel("professional")} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                          <X className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleSave("professional")} className="h-8 w-8 p-0 rounded-full bg-[#9AC63F]/10 hover:bg-[#9AC63F]/20 text-[#9AC63F]">
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => { setEditingProfessional(true); setForm(profile); }} className="h-8 w-8 text-gray-400 hover:text-gray-900">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* About Content */}
                  <div>
                    {editingProfessional ? (
                      <Textarea
                        value={form.about ?? ""}
                        onChange={(e) => setForm({ ...form, about: e.target.value })}
                        className="min-h-[120px] bg-gray-50 border-gray-200 resize-none focus-visible:ring-[#9AC63F]"
                      />
                    ) : (
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {profile?.about || "No information provided."}
                      </p>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Services */}
                    {role !== "patient" && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Services</h3>
                      </div>
                      <div className="space-y-3">
                        {form.services?.map((service: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 group">
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
                            {editingProfessional ? (
                              <Input
                                value={service}
                                onChange={(e) => {
                                  const next = [...(form.services || [])];
                                  next[idx] = e.target.value;
                                  setForm({ ...form, services: next });
                                }}
                                className="h-9 bg-gray-50 border-gray-200"
                              />
                            ) : (
                              <span className="text-sm text-gray-700">{service}</span>
                            )}
                            {editingProfessional && (
                              <button onClick={() => {
                                const next = form.services.filter((_: any, i: number) => i !== idx);
                                setForm({ ...form, services: next });
                              }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )) || null}
                        {(!form.services || form.services.length === 0) && !editingProfessional && (
                          <p className="text-sm text-gray-400 italic">No services listed</p>
                        )}

                        {editingProfessional && (
                          <Button variant="outline" size="sm" onClick={() => {
                            setForm({ ...form, services: [...(form.services || []), "New Service"] });
                          }} className="mt-2 text-xs border-dashed w-full">
                            + Add Service
                          </Button>
                        )}
                      </div>
                    </div>
                    )}

                    {/* Education */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Education</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {/* Assuming education is a string or array, simplified here as field */}
                        {editingProfessional ? (
                          <Textarea
                            value={form.education ?? ""}
                            onChange={(e) => setForm({ ...form, education: e.target.value })}
                            placeholder="List your education here..."
                            className="min-h-20 bg-gray-50 border-gray-200"
                          />
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-300 mt-2"></div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile?.education || "No education listed"}</p>
                          </div>
                        )}
                      </div>

                      {role !== "patient" && (
                        <>
                          <h3 className="text-lg font-bold text-gray-900 mb-4 mt-8">Specialization</h3>
                          {editingProfessional ? (
                            <Input
                              value={form.specialization ?? ""}
                              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                              className="bg-gray-50 border-gray-200"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                              <span className="text-sm text-gray-700">{profile?.specialization || "—"}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {role !== "patient" && (
                    <>
                      <hr className="border-gray-100" />

                      {/* Availability */}
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-gray-900">Time Of Availability</h3>
                          {editingProfessional && (
                            <button className="text-[#9AC63F] hover:text-[#8cb33a]">
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 font-semibold mb-3">Select the available days</p>
                            <div className="flex gap-2 flex-wrap">
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                                const isActive = (typeof form.availabilityDays === 'string' ? JSON.parse(form.availabilityDays) : (form.availabilityDays || [])).includes(day);
                                return (
                                  <button
                                    key={day}
                                    disabled={!editingProfessional}
                                    onClick={() => {
                                      let days = [...(typeof form.availabilityDays === 'string' ? JSON.parse(form.availabilityDays) : (form.availabilityDays || []))];
                                      if (isActive) days = days.filter(d => d !== day);
                                      else days.push(day);
                                      setForm({ ...form, availabilityDays: days });
                                    }}
                                    className={`h-11 w-[calc(14.28%-8px)] min-w-[50px] rounded-xl text-sm font-semibold transition-all ${isActive
                                      ? "bg-[#FFEAD1]/50 text-[#E58A1F] border border-[#E58A1F]"
                                      : "bg-white border border-gray-200 text-gray-400"
                                      } ${editingProfessional ? "hover:border-[#E58A1F] cursor-pointer" : ""}`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex-1 flex gap-4">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 font-semibold mb-3">From</p>
                              {editingProfessional ? (
                                <Input type="time" value={form.availabilityFrom ?? ""} onChange={(e) => setForm({ ...form, availabilityFrom: e.target.value })} className="h-12 bg-gray-50 border-gray-200" />
                              ) : (
                                <div className="h-12 bg-gray-50 rounded-lg flex items-center justify-center font-medium text-gray-900 border border-gray-100">
                                  {profile?.availabilityFrom || "00:00"}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 font-semibold mb-3">To</p>
                              {editingProfessional ? (
                                <Input type="time" value={form.availabilityTo ?? ""} onChange={(e) => setForm({ ...form, availabilityTo: e.target.value })} className="h-12 bg-gray-50 border-gray-200" />
                              ) : (
                                <div className="h-12 rounded-lg bg-[#F89F2E] flex items-center justify-center font-medium text-white shadow-sm">
                                  {profile?.availabilityTo || "00:00"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <hr className="border-gray-100" />

                  {/* Certificates */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900">Certificates</h3>
                      {editingProfessional && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 bg-gray-100 hover:bg-gray-200 border-none rounded-lg"
                            onClick={() => certificatesInputRef.current?.click()}
                          >
                            <Plus className="h-5 w-5 text-gray-600" />
                          </Button>
                          <input
                            type="file"
                            ref={certificatesInputRef}
                            className="hidden"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleCertificateChange}
                          />
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      {form.certificates?.map((cert: any, idx: number) => {
                        // Debugging: Log the certificate item to see its structure
                        console.log(`Certificate [${idx}]:`, cert);

                        let name = "Certificate";
                        let downloadUrl = "";
                        let isFile = false;

                        if (typeof File !== 'undefined' && cert instanceof File) {
                          isFile = true;
                          name = cert.name;
                        } else if (typeof cert === 'string') {
                          name = cert.split('/').pop() || "Certificate";
                          downloadUrl = resolveAvatar(cert);
                        } else if (typeof cert === 'object' && cert !== null) {
                          // Handle potential object structure (e.g. { url: "...", name: "..." })
                          name = cert.name || cert.fileName || cert.originalname || (cert.url ? String(cert.url).split('/').pop() : "Certificate");
                          downloadUrl = resolveAvatar(cert.url || cert.path || "");
                        }

                        return (
                          <div key={idx} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-8 bg-red-100/50 rounded flex items-center justify-center text-red-500">
                                <FileText className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isFile && (
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-900" onClick={() => {
                                  if (!downloadUrl) return;
                                  const link = document.createElement("a");
                                  link.href = downloadUrl;
                                  link.target = "_blank";
                                  link.download = name || "certificate";
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              {editingProfessional && (
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-500" onClick={() => {
                                  const next = [...(form.certificates || [])];
                                  next.splice(idx, 1);
                                  setForm({ ...form, certificates: next });
                                }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {(!form.certificates || form.certificates.length === 0) && (
                        <p className="text-sm text-gray-400 italic">No certificates uploaded</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
