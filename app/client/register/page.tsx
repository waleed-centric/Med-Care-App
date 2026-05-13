"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	User,
	ChevronLeft,
	ChevronRight,
	Upload,
	X,
	Check,
	Eye,
	EyeOff,
	FileText,
} from "lucide-react";
import { useSnackbar } from "notistack";
import {
	doctorAvailableTimes,
	AllAvailableDR,
} from "@/hooks/appointments";
import { marketerSignUp, registerPatient } from "@/hooks/auth";

export default function ClientRegister() {
	const router = useRouter();
	const { enqueueSnackbar } = useSnackbar();
	const [currentStep, setCurrentStep] = useState(1);
	const [submitting, setSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	// Client Image & Docs
	const [clientImage, setClientImage] = useState<File | null>(null);
	const [clientImagePreview, setClientImagePreview] = useState<string | null>(null);
	const [uploadingClientImage, setUploadingClientImage] = useState(false);
	const [certificates, setCertificates] = useState<File[]>([]);

	// Doctor Selection
	const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
	const [doctors, setDoctors] = useState<any>({ count: 0, doctors: [] });
	const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
	const [docSearchTerm, setDocSearchTerm] = useState("");
	const [docCurrentPage, setDocCurrentPage] = useState(1);
	const [docPageSize, setDocPageSize] = useState(9);
	const [docTotalItems, setDocTotalItems] = useState(0);
	const [docTotalPages, setDocTotalPages] = useState(1);

	// Slots (If needed for booking during register, keeping logic but might be optional)
	const [activeDateIndex, setActiveDateIndex] = useState(0);
	const [dateStartOffset, setDateStartOffset] = useState(0);
	const [selectedSlot, setSelectedSlot] = useState<"Morning" | "Afternoon" | "Evening">("Morning");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [availableTimes, setAvailableTimes] = useState<string[]>([]);
	const [isTimesLoading, setIsTimesLoading] = useState(false);

	// Form Data
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [formData, setFormData] = useState({
		firstname: "",
		lastname: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
		role: "patient",
		age: "",
		gender: "Other",
		height: "",
		weight: "",
		streetAddress: "",
		city: "",
		state: "",
		zipCode: "",
		history: "",
		primaryConcerns: [] as string[],
		medications: [] as string[],
		medicalAidProvider: "",
		planOption: "",
		membershipNumber: "",
		groupNumber: "",
	});

	// Helpers
	const [newConcern, setNewConcern] = useState("");
	const [newMedication, setNewMedication] = useState("");

	const resolveImageSrc = (url?: string) => {
		const u = String(url ?? "").trim();
		if (!u) return "/images/avatar.PNG";
		if (/^https?:\/\//i.test(u)) return u;
		if (u.startsWith("/images/") || u.startsWith("images/")) {
			return u.startsWith("/") ? u : `/${u}`;
		}
		const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
		const cleaned = u.replace(/^\/?uploads\/?/, "");
		if (!base) return `/uploads/${cleaned}`;
		return `${base}/uploads/${cleaned}`;
	};

	const formatSlotTime = (input: string, slot: "Morning" | "Afternoon" | "Evening"): string | null => {
		const s = String(input).trim();
		let h: number | null = null;
		let m: number | null = null;
		let suffix: "AM" | "PM" | null = null;
		const withSuffix = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
		const noSuffix = s.match(/^(\d{1,2}):(\d{2})$/);
		const hourOnlyWithSuffix = s.match(/^(\d{1,2})\s*(am|pm)$/i);
		const hourOnly = s.match(/^(\d{1,2})$/);
		if (withSuffix) {
			h = parseInt(withSuffix[1], 10);
			m = parseInt(withSuffix[2], 10);
			suffix = withSuffix[3].toUpperCase() as "AM" | "PM";
		} else if (noSuffix) {
			h = parseInt(noSuffix[1], 10);
			m = parseInt(noSuffix[2], 10);
		} else if (hourOnlyWithSuffix) {
			h = parseInt(hourOnlyWithSuffix[1], 10);
			m = 0;
			suffix = hourOnlyWithSuffix[2].toUpperCase() as "AM" | "PM";
		} else if (hourOnly) {
			h = parseInt(hourOnly[1], 10);
			m = 0;
		}
		if (h == null || m == null) return null;
		if (!withSuffix && !hourOnlyWithSuffix) {
			if (h === 0) { h = 12; suffix = "AM"; }
			else if (h < 12) { suffix = "AM"; }
			else if (h === 12) { suffix = "PM"; }
			else { suffix = "PM"; h = h - 12; }
		}
		suffix = slot === "Morning" ? "AM" : "PM";
		const hh = String(h).padStart(2, "0");
		const mm = String(m).padStart(2, "0");
		return `${hh}:${mm} ${suffix}`;
	};

	// Effects
	useEffect(() => {
		const run = async () => {
			setIsDoctorsLoading(true);
			try {
				const data = await AllAvailableDR(docPageSize, "approved", docCurrentPage, docSearchTerm);
				setDoctors(data);
				const total = Number((data as any)?.totalItems ?? (data as any)?.count ?? ((data as any)?.doctors?.length ?? 0));
				const pages = Number((data as any)?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, docPageSize))));
				setDocTotalItems(total);
				setDocTotalPages(pages);
				if (!selectedDoctorId) {
					const first = (data as any)?.doctors?.[0]?._id;
					if (first) setSelectedDoctorId(String(first));
				}
			} catch (e: any) { }
			setIsDoctorsLoading(false);
		};
		run();
	}, [docCurrentPage, docPageSize, docSearchTerm]);

	// useEffect(() => {
	// 	const run = async () => {
	// 		if (currentStep !== 4) return;
	// 		if (!selectedDoctorId) return;
	// 		setIsTimesLoading(true);
	// 		const baseDate = new Date();
	// 		const d = new Date(baseDate);
	// 		d.setDate(baseDate.getDate() + dateStartOffset + activeDateIndex);
	// 		const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	// 		try {
	// 			const slotKey = selectedSlot.toLowerCase();
	// 			const resp = await doctorAvailableTimes(selectedDoctorId, dateStr, slotKey);
	// 			let list: any = [];
	// 			if (resp?.slots) {
	// 				list = resp.slots[slotKey] ?? resp.slots[selectedSlot] ?? resp.slots[slotKey.toUpperCase()] ?? [];
	// 			} else if (Array.isArray(resp)) {
	// 				list = resp;
	// 			} else if ((resp as any)?.times) {
	// 				list = (resp as any).times;
	// 			}
	// 			const rawList: string[] = (Array.isArray(list) ? list : []).map((v: any) => String(v));
	// 			const formatted = rawList.map((t) => formatSlotTime(t, selectedSlot)).filter((t): t is string => Boolean(t));
	// 			setAvailableTimes(formatted);
	// 		} catch (e: any) {
	// 			setAvailableTimes([]);
	// 		} finally {
	// 			setIsTimesLoading(false);
	// 		}
	// 	};
	// 	run();
	// }, [currentStep, selectedDoctorId, dateStartOffset, activeDateIndex, selectedSlot]);

	// Handlers
	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			enqueueSnackbar("Please select an image file", { variant: "error" });
			e.target.value = "";
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			enqueueSnackbar("File size should be less than 5MB", { variant: "error" });
			e.target.value = "";
			return;
		}

		setClientImage(file);
		const reader = new FileReader();
		reader.onloadend = () => setClientImagePreview(reader.result as string);
		reader.readAsDataURL(file);

		setUploadingClientImage(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			fd.append("userId", "temp");
			const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
			const data = await res.json();
			if (res.ok && data?.success && data?.fileUrl) {
				setClientImagePreview(data.fileUrl);
			} else {
				enqueueSnackbar(data?.error || "Image upload failed", { variant: "error" });
			}
		} catch {
			enqueueSnackbar("Image upload failed", { variant: "error" });
		} finally {
			setUploadingClientImage(false);
			e.target.value = "";
		}
	};

	const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			setCertificates(Array.from(files));
		}
	};

	const addConcern = () => {
		const v = newConcern.trim();
		if (!v) return;
		setFormData({ ...formData, primaryConcerns: [...formData.primaryConcerns, v] });
		setNewConcern("");
	};

	const removeConcern = (idx: number) => {
		setFormData({ ...formData, primaryConcerns: formData.primaryConcerns.filter((_, i) => i !== idx) });
	};

	const addMedication = () => {
		const v = newMedication.trim();
		if (!v) return;
		setFormData({ ...formData, medications: [...formData.medications, v] });
		setNewMedication("");
	};

	const removeMedication = (idx: number) => {
		setFormData({ ...formData, medications: formData.medications.filter((_, i) => i !== idx) });
	};

	// Validation
	const validateBasics = () => {
		const errs: Record<string, string> = {};
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const phoneDigits = String(formData.phone || "").replace(/\D/g, "");
		const ageDigits = String(formData.age || "").match(/\d+/)?.[0];
		const weightDigits = String(formData.weight || "").match(/\d+/)?.[0];
		const heightDigits = String(formData.height || "").match(/\d+/)?.[0];

		if (!String(formData.firstname || '').trim()) errs.firstname = 'First Name is required';
		if (!String(formData.lastname || '').trim()) errs.lastname = 'Last Name is required';
		if (!emailRegex.test(String(formData.email || ''))) errs.email = 'Enter a valid email';
		if (!/^\d{10,15}$/.test(phoneDigits)) errs.phone = 'Phone must be 10-15 digits';
		if (!String(formData.gender || "").trim()) errs.gender = "Select gender";
		if (!ageDigits) errs.age = "Enter a valid age";
		if (!heightDigits) errs.height = "Enter a valid height";
		if (!weightDigits) errs.weight = "Enter a valid weight";
		if (!String(formData.streetAddress || "").trim()) errs.streetAddress = "Street address is required";
		if (!String(formData.city || "").trim()) errs.city = "Select city";
		if (!String(formData.state || "").trim()) errs.state = "State is required";
		if (!/^\d{5}$/.test(String(formData.zipCode || ""))) errs.zipCode = "ZIP must be 5 digits";

		// Password Validation
		if (formData.password.length < 8) errs.password = "Password must be at least 8 chars";
		if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";

		setFieldErrors(errs);
		if (Object.keys(errs).length) {
			enqueueSnackbar('Please fix the highlighted fields', { variant: 'error' });
			return false;
		}
		return true;
	};

	const validateMedicalInfo = () => {
		const errs: Record<string, string> = {};
		if (!String(formData.medicalAidProvider || "").trim()) errs.medicalAidProvider = "Provider is required";
		if (!String(formData.planOption || "").trim()) errs.planOption = "Plan is required";
		if (!String(formData.membershipNumber || "").trim()) errs.membershipNumber = "Membership No. is required";

		setFieldErrors(errs);

		if (formData.primaryConcerns.length === 0 || formData.medications.length === 0) {
			enqueueSnackbar('please add atlease 1 Primary Concern and Any Medication', { variant: 'error' });
			return false;
		}

		if (Object.keys(errs).length) {
			enqueueSnackbar('Please fill in the required Medical Aid details', { variant: 'error' });
			return false;
		}
		return true;
	};

	const handleNext = () => {
		if (currentStep === 1) {
			if (!validateBasics()) return;
		}
		if (currentStep === 2) {
			if (!validateMedicalInfo()) return;
		}
		if (currentStep < 3) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleSubmit = async () => {
		setSubmitting(true);
		try {
			// Create FormData for file upload
			const fd = new FormData();

			// Basic Info
			fd.append("role", formData.role);
			fd.append("firstname", formData.firstname);
			fd.append("lastname", formData.lastname);
			fd.append("email", formData.email);
			fd.append("phone", formData.phone);
			fd.append("password", formData.password);
			fd.append("age", formData.age);
			fd.append("gender", formData.gender);
			fd.append("height", formData.height);
			fd.append("weight", formData.weight);

			// Nested Objects (stringified)
			fd.append("address", JSON.stringify({
				street: formData.streetAddress,
				city: formData.city,
				state: formData.state,
				zipCode: formData.zipCode,
			}));

			fd.append("medicalInfo", JSON.stringify({
				history: formData.history,
				concerns: formData.primaryConcerns,
				medications: formData.medications,
				medicalAid: {
					provider: formData.medicalAidProvider,
					plan: formData.planOption,
					membershipNumber: formData.membershipNumber,
					groupNumber: formData.groupNumber
				}
			}));
			console.log(clientImage,"clientImage")
			// Files
			if (clientImage) {
				fd.append("avatar", clientImage);
			}
			if (certificates.length > 0) {
				certificates.forEach((cert) => {
					fd.append("certificates", cert);
				});
			}

			// Log data for debugging
			console.log("--- Patient Registration Data ---");
			for (let [key, value] of fd.entries()) {
				console.log(`${key}:`, value);
			}

			// Attempt registration
			// Use API: /api/auth/register-patient
			await registerPatient(fd);

			enqueueSnackbar("Registration successful! Please login.", { variant: "success" });
			router.push("/login");

		} catch (error: any) {
			console.error("Registration error:", error);
			enqueueSnackbar(error?.response?.data?.message || "Registration failed", { variant: "error" });
		} finally {
			setSubmitting(false);
		}
	};

	const steps = [
		{ number: 1, label: "Basic information" },
		{ number: 2, label: "Medical Information" },
		{ number: 3, label: "Upload Document" },
		// { number: 4, label: "Assign a Doctor" },
	];

	return (
		<div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
				{/* Header */}
				<div className="bg-[#9AC63F] px-8 py-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="bg-white p-2 rounded-lg">
								<Image src="/images/logo.svg" alt="Logo" width={32} height={32} />
							</div>
							<h1 className="text-2xl font-bold text-white">Patient Registration</h1>
						</div>
						<div className="text-white/80 text-sm">
							Already have an account? <Link href="/login" className="text-white font-semibold hover:underline">Login</Link>
						</div>
					</div>
				</div>

				<div className="p-8">
					{/* Progress Steps */}
					<div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4">
						{steps.map((step, index) => (
							<div key={step.number} className="flex items-center">
								<div className={`flex items-center gap-2 ${currentStep >= step.number ? "text-[#9AC63F]" : "text-gray-400"}`}>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold ${currentStep >= step.number ? "border-[#9AC63F] bg-[#9AC63F] text-white" : "border-gray-300"
										}`}>
										{currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
									</div>
									<span className="whitespace-nowrap font-medium">{step.label}</span>
								</div>
								{index < steps.length - 1 && (
									<div className={`w-12 h-0.5 mx-4 ${currentStep > step.number ? "bg-[#9AC63F]" : "bg-gray-200"}`} />
								)}
							</div>
						))}
					</div>

					{/* Step 1: Basic Information */}
					{currentStep === 1 && (
						<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Avatar Upload */}
								<div className="col-span-full flex justify-center mb-4">
									<div className="relative group cursor-pointer">
										<div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
											{clientImagePreview ? (
												<Image src={clientImagePreview} alt="Preview" fill className="object-cover" />
											) : (
												<User className="w-8 h-8 text-gray-400" />
											)}
										</div>
										<input type="file" accept="image/*" onChange={handleImageChange} disabled={uploadingClientImage} className={`absolute inset-0 opacity-0 ${uploadingClientImage ? "cursor-not-allowed" : "cursor-pointer"}`} />
										<div className="absolute bottom-0 right-0 bg-[#9AC63F] text-white p-1 rounded-full shadow-sm">
											<Upload className="w-3 h-3" />
										</div>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
									<input
										autoComplete="off"
										type="text"
										value={formData.firstname}
										onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
										placeholder="John"
									/>
									{fieldErrors.firstname && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstname}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
									<input
										autoComplete="off"
										type="text"
										value={formData.lastname}
										onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
										placeholder="Doe"
									/>
									{fieldErrors.lastname && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastname}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
									<input
										autoComplete="off"
										type="email"
										value={formData.email}
										onChange={(e) => setFormData({ ...formData, email: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
										placeholder="john@example.com"
									/>
									{fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
									<div className="relative">
										<input
											autoComplete="new-password"
											type={showPassword ? "text" : "password"}
											value={formData.password}
											onChange={(e) => setFormData({ ...formData, password: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
											placeholder="••••••••"
										/>
										<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">
											{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
										</button>
									</div>
									{fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
									<div className="relative">
										<input
											autoComplete="new-password"
											type={showConfirmPassword ? "text" : "password"}
											value={formData.confirmPassword}
											onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
											placeholder="••••••••"
										/>
										<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-400">
											{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
										</button>
									</div>
									{fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
									<input
										autoComplete="off"
										type="tel"
										value={formData.phone}
										onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
										placeholder="+1 234 567 8900"
									/>
									{fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
										<input
											type="number"
											value={formData.age}
											onChange={(e) => setFormData({ ...formData, age: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
										/>
										{fieldErrors.age && <p className="text-red-500 text-xs mt-1">{fieldErrors.age}</p>}
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
										<select
											value={formData.gender}
											onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
										>
											<option value="Male">Male</option>
											<option value="Female">Female</option>
											<option value="Other">Other</option>
										</select>
										{fieldErrors.gender && <p className="text-red-500 text-xs mt-1">{fieldErrors.gender}</p>}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Height *</label>
										<input
											type="text"
											value={formData.height}
											onChange={(e) => setFormData({ ...formData, height: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
											placeholder="e.g. 5'11"
										/>
										{fieldErrors.height && <p className="text-red-500 text-xs mt-1">{fieldErrors.height}</p>}
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Weight *</label>
										<input
											type="text"
											value={formData.weight}
											onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
											placeholder="e.g. 70kg"
										/>
										{fieldErrors.weight && <p className="text-red-500 text-xs mt-1">{fieldErrors.weight}</p>}
									</div>
								</div>

								<div className="col-span-full">
									<label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
									<input
										type="text"
										value={formData.streetAddress}
										onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
									/>
									{fieldErrors.streetAddress && <p className="text-red-500 text-xs mt-1">{fieldErrors.streetAddress}</p>}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
									<input
										type="text"
										value={formData.city}
										onChange={(e) => setFormData({ ...formData, city: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
									/>
									{fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
									<input
										type="text"
										value={formData.state}
										onChange={(e) => setFormData({ ...formData, state: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
									/>
									{fieldErrors.state && <p className="text-red-500 text-xs mt-1">{fieldErrors.state}</p>}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
									<input
										type="text"
										value={formData.zipCode}
										onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
									/>
									{fieldErrors.zipCode && <p className="text-red-500 text-xs mt-1">{fieldErrors.zipCode}</p>}
								</div>
							</div>
						</div>
					)}

					{/* Step 2: Medical Information */}
					{currentStep === 2 && (
						<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">History of Presenting Complaint</label>
								<textarea
									autoComplete="off"
									rows={4}
									value={formData.history}
									onChange={(e) => setFormData({ ...formData, history: e.target.value })}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9AC63F]/20 focus:border-[#9AC63F]"
									placeholder="Describe your symptoms and history..."
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Primary Concerns</label>
								<p className="text-sm text-gray-500 mb-2">Please add at least 1 Primary Concern</p>
								<div className="flex gap-2 mb-2">
									<input
										autoComplete="off"
										type="text"
										value={newConcern}
										onChange={(e) => setNewConcern(e.target.value)}
										className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
										placeholder="Add a concern"
										onKeyDown={(e) => e.key === "Enter" && addConcern()}
									/>
									<button onClick={addConcern} className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">Add</button>
								</div>
								<div className="flex flex-wrap gap-2">
									{formData.primaryConcerns.map((c, i) => (
										<span key={i} className="bg-[#9AC63F]/10 text-[#9AC63F] px-3 py-1 rounded-full text-sm flex items-center gap-2">
											{c} <X className="w-3 h-3 cursor-pointer" onClick={() => removeConcern(i)} />
										</span>
									))}
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Any Medication?</label>
								<p className="text-sm text-gray-500 mb-2">Please add at least 1 Medication</p>
								<div className="flex gap-2 mb-2">
									<input
										autoComplete="off"
										type="text"
										value={newMedication}
										onChange={(e) => setNewMedication(e.target.value)}
										className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
										placeholder="Add medication"
										onKeyDown={(e) => e.key === "Enter" && addMedication()}
									/>
									<button onClick={addMedication} className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">Add</button>
								</div>
								<div className="flex flex-wrap gap-2">
									{formData.medications.map((m, i) => (
										<span key={i} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm flex items-center gap-2">
											{m} <X className="w-3 h-3 cursor-pointer" onClick={() => removeMedication(i)} />
										</span>
									))}
								</div>
							</div>

							<div className="pt-6 border-t border-gray-200">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Aid Details</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Medical Aid Provider <span className="text-red-500">*</span></label>
										<input
											autoComplete="off"
											type="text"
											value={formData.medicalAidProvider}
											onChange={(e) => setFormData({ ...formData, medicalAidProvider: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg"
										/>
										{fieldErrors.medicalAidProvider && <p className="text-red-500 text-xs mt-1">{fieldErrors.medicalAidProvider}</p>}
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Plan / Option <span className="text-red-500">*</span></label>
										<input
											autoComplete="off"
											type="text"
											value={formData.planOption}
											onChange={(e) => setFormData({ ...formData, planOption: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg"
										/>
										{fieldErrors.planOption && <p className="text-red-500 text-xs mt-1">{fieldErrors.planOption}</p>}
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Membership / Policy Number <span className="text-red-500">*</span></label>
										<input
											autoComplete="off"
											type="text"
											value={formData.membershipNumber}
											onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg"
										/>
										{fieldErrors.membershipNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.membershipNumber}</p>}
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Group Number (if any)</label>
										<input
											autoComplete="off"
											type="text"
											value={formData.groupNumber}
											onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg"
										/>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Step 3: Upload Document */}
					{currentStep === 3 && (
						<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
							<div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
								{certificates.length > 0 ? (
									<div className="flex flex-col items-center">
										<FileText className="w-16 h-16 text-[#9AC63F] mb-4" />
										<div className="mb-4">
											{certificates.map((file, index) => (
												<p key={index} className="font-medium text-gray-900 mb-1">{file.name}</p>
											))}
										</div>
										<button onClick={() => setCertificates([])} className="text-red-500 hover:text-red-600 font-medium">Remove All</button>
									</div>
								) : (
									<div className="flex flex-col items-center">
										<Upload className="w-12 h-12 text-gray-400 mb-4" />
										<p className="text-lg font-medium text-gray-900 mb-2">Upload relevant medical documents</p>
										<p className="text-gray-500 mb-6">Drag and drop or click to browse (Multiple files allowed)</p>
										<input type="file" multiple onChange={handleDocumentChange} className="hidden" id="doc-upload" />
										<label htmlFor="doc-upload" className="bg-[#9AC63F] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#8AB631] transition-colors">
											Browse Files
										</label>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Step 4: Assign Doctor */}
					{/* {currentStep === 4 && (
						<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
							<div className="relative mb-6">
								<input
									type="text"
									placeholder="Search doctors..."
									value={docSearchTerm}
									onChange={(e) => setDocSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
								/>
								<User className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
								{isDoctorsLoading ? (
									<p className="text-center col-span-full py-8 text-gray-500">Loading doctors...</p>
								) : (
									(doctors as any)?.doctors?.map((doc: any) => (
										<div
											key={doc._id}
											onClick={() => setSelectedDoctorId(doc._id)}
											className={`p-4 border rounded-xl cursor-pointer transition-all ${
												selectedDoctorId === doc._id ? "border-[#9AC63F] bg-[#9AC63F]/5 ring-2 ring-[#9AC63F]/20" : "border-gray-200 hover:border-[#9AC63F]/50"
											}`}
										>
											<div className="flex items-center gap-3">
												<Image
													src={resolveImageSrc(doc.avatarUrl)}
													alt={doc.name}
													width={48}
													height={48}
													className="rounded-full object-cover"
												/>
												<div>
													<p className="font-semibold text-gray-900">{doc.displayName || doc.name}</p>
													<p className="text-xs text-gray-500">{doc.specialization || "General"}</p>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)} */}

					{/* Navigation Buttons */}
					<div className="flex justify-between pt-8 border-t border-gray-100 mt-8">
						<button
							onClick={handlePrevious}
							disabled={currentStep === 1}
							className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${currentStep === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"
								}`}
						>
							<ChevronLeft className="w-5 h-5 mr-1" /> Back
						</button>

						{currentStep === 3 ? (
							<button
								onClick={handleSubmit}
								disabled={submitting}
								className="flex items-center px-8 py-2 bg-[#9AC63F] text-white rounded-lg font-medium hover:bg-[#8AB631] transition-colors disabled:opacity-50"
							>
								{submitting ? "Registering..." : "Complete Registration"}
							</button>
						) : (
							<button
								onClick={handleNext}
								disabled={currentStep === 2 && (formData.primaryConcerns.length === 0 || formData.medications.length === 0)}
								className="flex items-center px-8 py-2 bg-[#9AC63F] text-white rounded-lg font-medium hover:bg-[#8AB631] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Next <ChevronRight className="w-5 h-5 ml-1" />
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
