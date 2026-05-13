"use client";

import { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import Image from "next/image";
import Link from "next/link";
import {
	Calendar,
	ChevronDown,
	FileText,
	Grid,
	LogOut as LogOutIcon,
	MessageSquare,
	Upload,
	Users,
	X,
	Search,
	Clock,
	MapPin,
	ChevronLeft,
	ChevronRight,
	Check,
	LogOut,
	Bell,
	Stethoscope,
	Phone,
	Star,
	User,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";
import Cookies from "js-cookie";
import TopBarUserMenu from "@/components/TopBarUserMenu";
import { usePathname } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	submitAssessment,
	doctorAvailableTimes,
	AllAvailableDR,
	runExternalAppointment,
} from "@/hooks/appointments";

type DoctorItem = {
	id: string | number;
	name: string;
	title: string;
	avatar: string;
	years: number;
	rating: number;
	reviews: number;
};

export default function GetAssessment() {
	const pathname = usePathname();
	const navLinkClasses = (href: string) =>
		`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === href
			? "bg-[#9AC63F] text-white cursor-default"
			: "text-[#6B7280] hover:bg-[#F9FAFB]"
		}`;
	const router = useRouter();
	const [loggedInUser, setLoggedInUser] = useState<any>(null);

	const logout = () => {
		Cookies.remove('token');
		Cookies.remove('user');
		router.push('/');
	};
	const [activeNow, setActiveNow] = useState(true);
	const [currentStep, setCurrentStep] = useState(1);
	const [clientImage, setClientImage] = useState<File | null>(null);
	const [clientImagePreview, setClientImagePreview] = useState<string | null>(
		null
	);
	const [documentFile, setDocumentFile] = useState<File | null>(null);
	const [documentPreview, setDocumentPreview] = useState<string | null>(null);
	const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
	const [isNotepadOpen, setIsNotepadOpen] = useState(false);
	const [notepadText, setNotepadText] = useState("");
	const [newConcern, setNewConcern] = useState("");
	const [newMedication, setNewMedication] = useState("");
	const [activeDateIndex, setActiveDateIndex] = useState(0);
	const [dateStartOffset, setDateStartOffset] = useState(0);
	const [selectedSlot, setSelectedSlot] = useState<
		"Morning" | "Afternoon" | "Evening"
	>("Morning");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [availableTimes, setAvailableTimes] = useState<string[]>([]);
	const [isTimesLoading, setIsTimesLoading] = useState(false);
	const [slotsError, setSlotsError] = useState<string | null>(null);
	const [doctors, setDoctors] = useState<any>({ count: 0, doctors: [] });

	const formatHeight = (raw: string) => {
		const digits = String(raw || "").replace(/\D/g, "");
		if (!digits) return "";
		const feet = digits.charAt(0);
		let inches = digits.slice(1, 3);
		if (!inches) return `${feet}'`;
		const n = parseInt(inches, 10);
		if (!isNaN(n) && n > 11) {
			inches = "11";
		}
		return `${feet}'${inches}`;
	};

	const formatWeight = (raw: string) => {
		const digits = String(raw || "").replace(/\D/g, "");
		return digits;
	};

	const resolveImageSrc = (url?: string) => {
		const u = String(url ?? "").trim();
		if (!u) return "/images/doctor-placeholder.svg";
		if (/^https?:\/\//i.test(u)) return u;
		const base = process.env.NEXT_PUBLIC_API_URL || "";
		if (base) return `${base}${u.startsWith("/") ? u : `/${u}`}`;
		return u;
	};

	const getDoctorAvatar = (d: any) =>
		resolveImageSrc(d?.avatarUrl ?? d?.avatar ?? "/images/avatar.PNG");

	const formatSlotTime = (
		input: string,
		slot: "Morning" | "Afternoon" | "Evening"
	): string | null => {
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
			if (h === 0) {
				h = 12;
				suffix = "AM";
			} else if (h < 12) {
				suffix = "AM";
			} else if (h === 12) {
				suffix = "PM";
			} else {
				suffix = "PM";
				h = h - 12;
			}
		}
		suffix = slot === "Morning" ? "AM" : "PM";
		const hh = String(h).padStart(2, "0");
		const mm = String(m).padStart(2, "0");
		return `${hh}:${mm} ${suffix}`;
	};
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		age: "",
		gender: "Other",
		height: "",
		weight: "",
		streetAddress: "",
		city: "",
		state: "",
		zipCode: "",
		history:
			"",
		primaryConcerns: [""],
		medications: [""],
	});

	useEffect(() => {
		const user = Cookies.get("user");
		if (user) {
			try {
				const parsedUser = JSON.parse(user);
				setLoggedInUser(parsedUser);
			} catch (err) {
				console.error("Failed to parse user cookie", err);
			}
		}
	}, []);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setClientImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setClientImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setDocumentFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setDocumentPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const file = e.dataTransfer.files[0];
		if (file) {
			setDocumentFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setDocumentPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const openNotepad = () => {
		setNotepadText(formData.history);
		setIsNotepadOpen(true);
	};

	const saveNotepad = () => {
		setFormData({ ...formData, history: notepadText });
		setIsNotepadOpen(false);
	};

	const addConcern = () => {
		const v = newConcern.trim();
		if (!v) return;
		setFormData({
			...formData,
			primaryConcerns: [...formData.primaryConcerns, v],
		});
		setNewConcern("");
	};

	const removeConcern = (idx: number) => {
		setFormData({
			...formData,
			primaryConcerns: formData.primaryConcerns.filter((_, i) => i !== idx),
		});
	};

	const addMedication = () => {
		const v = newMedication.trim();
		if (!v) return;
		setFormData({ ...formData, medications: [...formData.medications, v] });
		setNewMedication("");
	};

	const removeMedication = (idx: number) => {
		setFormData({
			...formData,
			medications: formData.medications.filter((_, i) => i !== idx),
		});
	};

	const steps = [
		{ number: 1, label: "Basic information" },
		{ number: 2, label: "Medical Information" },
		{ number: 3, label: "Upload Document" },
		{ number: 4, label: "Assign a Doctor" },
	];

	useEffect(() => {
		const run = async () => {
			try {
				const data = await AllAvailableDR();
				setDoctors(data);
				if (!selectedDoctorId) {
					const first = (data as any)?.doctors?.[0]?._id;
					if (first) setSelectedDoctorId(String(first));
				}
			} catch (e: any) { }
		};
		run();
	}, []);

	useEffect(() => {
		const run = async () => {
			if (currentStep !== 5) return;
			if (!selectedDoctorId) return;
			setIsTimesLoading(true);
			setSlotsError(null);
			const baseDate = new Date();
			const d = new Date(baseDate);
			d.setDate(baseDate.getDate() + dateStartOffset + activeDateIndex);
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
				2,
				"0"
			)}-${String(d.getDate()).padStart(2, "0")}`;
			try {
				const slotKey = selectedSlot.toLowerCase();
				const resp = await doctorAvailableTimes(
					selectedDoctorId,
					dateStr,
					slotKey
				);
				let list: any = [];
				if (resp?.slots) {
					list =
						resp.slots[slotKey] ??
						resp.slots[selectedSlot] ??
						resp.slots[slotKey.toUpperCase()] ??
						[];
				} else if (Array.isArray(resp)) {
					list = resp;
				} else if ((resp as any)?.times) {
					list = (resp as any).times;
				} else {
					list = [];
				}
				const rawList: string[] = (Array.isArray(list) ? list : []).map(
					(v: any) => String(v)
				);
				const formatted = rawList
					.map((t) => formatSlotTime(t, selectedSlot))
					.filter((t): t is string => Boolean(t));
				const grid =
					selectedSlot === "Morning"
						? [
							"06:00 AM",
							"06:30 AM",
							"07:00 AM",
							"07:30 AM",
							"08:00 AM",
							"08:30 AM",
							"09:00 AM",
							"09:30 AM",
							"10:00 AM",
							"10:30 AM",
							"11:00 AM",
							"11:30 AM",
						]
						: selectedSlot === "Afternoon"
							? [
								"12:00 PM",
								"12:30 PM",
								"01:00 PM",
								"01:30 PM",
								"02:00 PM",
								"02:30 PM",
								"03:00 PM",
								"03:30 PM",
								"04:00 PM",
								"04:30 PM",
							]
							: [
								"05:00 PM",
								"05:30 PM",
								"06:00 PM",
								"06:30 PM",
								"07:00 PM",
								"07:30 PM",
								"08:00 PM",
								"08:30 PM",
								"09:00 PM",
								"09:30 PM",
							];
				const normalized = formatted.filter((t) => grid.includes(t));
				setAvailableTimes(normalized);
			} catch (e: any) {
				setAvailableTimes([]);
				setSlotsError(e?.message || "Failed to load times");
			} finally {
				setIsTimesLoading(false);
			}
		};
		run();
	}, [
		currentStep,
		selectedDoctorId,
		dateStartOffset,
		activeDateIndex,
		selectedSlot,
	]);

	const handleNext = () => {
		if (currentStep < 4) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const buildAssessmentPayload = () => {
		const formDataPayload = new FormData();

		const docList: any[] = (doctors as any)?.doctors || [];
		const selectedDoc: any =
			docList.find((d: any) => String(d?._id) === String(selectedDoctorId)) ||
			undefined;
		const baseDate = new Date();
		const chosenDate = new Date(baseDate);
		chosenDate.setDate(baseDate.getDate() + dateStartOffset + activeDateIndex);
		const dateStr = `${chosenDate.getFullYear()}-${String(
			chosenDate.getMonth() + 1
		).padStart(2, "0")}-${String(chosenDate.getDate()).padStart(2, "0")}`;

		const basicInformation = {
			name: formData.name,
			email: formData.email,
			phone: formData.phone,
			age: formData.age,
			gender: formData.gender,
			height: formData.height,
			weight: formData.weight,
			streetAddress: formData.streetAddress,
			city: formData.city,
			state: formData.state,
			zipCode: formData.zipCode,
		};

		const medicalInformation = {
			history: formData.history,
			primaryConcerns: formData.primaryConcerns,
			medications: formData.medications,
		};

		const appointment = {
			date: dateStr,
			slot: selectedSlot,
			time: selectedTime,
		};

		const assignDoctor = selectedDoc
			? {
				id: selectedDoc._id,
				name: selectedDoc.displayName || selectedDoc.name,
				title: selectedDoc.specialization || selectedDoc.title,
				years: Number(selectedDoc.yearsExperience ?? selectedDoc.years ?? 0),
				rating: Number(selectedDoc.rating ?? 0),
				reviews: Number(selectedDoc.reviewsCount ?? selectedDoc.reviews ?? 0),
			}
			: null;

		const meta = { activeNow, userId: loggedInUser?.id ?? null };

		formDataPayload.append(
			"basicInformation",
			JSON.stringify(basicInformation)
		);
		formDataPayload.append(
			"medicalInformation",
			JSON.stringify(medicalInformation)
		);
		formDataPayload.append("appointment", JSON.stringify(appointment));
		formDataPayload.append("assignDoctorId", selectedDoctorId || "");
		if (assignDoctor) {
			formDataPayload.append("assignDoctor", JSON.stringify(assignDoctor));
		}
		formDataPayload.append("meta", JSON.stringify(meta));

		if (clientImage) {
			formDataPayload.append("clientImage", clientImage);
		}
		if (documentFile) {
			formDataPayload.append("documentFile", documentFile);
		}

		return formDataPayload;
	};

	const handleSubmit = async () => {
		const payload = buildAssessmentPayload();
		try {
			const response = await runExternalAppointment(payload);
			const statusCode = Number(response?.status);
			const isOk = statusCode >= 200 && statusCode < 300;
			const msg = response?.message;
			if (
				isOk &&
				typeof msg === "string" &&
				msg.toLowerCase().includes("assessment submitted successfully")
			) {
				enqueueSnackbar(msg, { variant: "success" });
			} else {
				enqueueSnackbar(msg || "Assessment submission failed", {
					variant: "error",
				});
			}
		} catch (error) {
			enqueueSnackbar("Assessment submission failed", { variant: "error" });
		}
	};

	return (
		<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
			{/* Left Sidebar */}
			<aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
				{/* Logo Section */}
				<div className="p-6 border-b border-[#E5E7EB]">
					<div className="flex items-center gap-3 mb-2">
						<Image
							src="/images/logo.svg"
							alt="Excel Connect logo"
							width={80}
							height={80}
							priority
							className="w-auto h-auto"
						/>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-4 space-y-2">
					<Link
						href="/my-profile"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/my-profile") window.location.href = "/my-profile"; }}
						className={navLinkClasses("/my-profile")}
					>
						<User className="h-5 w-8" />
						<span className="font-medium">My Profile</span>
					</Link>
					<Link
						href="/doctor/dashboard"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/dashboard") window.location.href = "/doctor/dashboard"; }}
						className={navLinkClasses("/doctor/dashboard")}
					>
						<Grid className="h-5 w-8" />
						<span className="font-medium">Overview</span>
					</Link>
					<Link
						href="/doctor/patients"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/patients") window.location.href = "/doctor/patients"; }}
						className={navLinkClasses("/doctor/patients")}
					>
						<Users className="h-5 w-8" />
						<span className="font-medium">Clients</span>
					</Link>
					<Link
						href="/doctor/schedule"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/schedule") window.location.href = "/doctor/schedule"; }}
						className={navLinkClasses("/doctor/schedule")}
					>
						<Calendar className="h-5 w-8" />
						<span className="font-medium">Schedule</span>
					</Link>
					<Link
						href="/doctor/messages"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/messages") window.location.href = "/doctor/messages"; }}
						className={navLinkClasses("/doctor/messages")}
					>
						<MessageSquare className="h-5 w-8" />
						<span className="font-medium">Chats</span>
					</Link>
					<Link
						href="/doctor/get-assessment"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/get-assessment") window.location.href = "/doctor/get-assessment"; }}
						className={navLinkClasses("/doctor/get-assessment")}
					>
						<FileText className="h-5 w-8" />
						<span className="font-medium">Get an Assessment</span>
					</Link>
				</nav>
			</aside>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Global Header Bar */}
				<header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
					<div className="w-full flex justify-end">
						<TopBarUserMenu user={loggedInUser} />
					</div>
				</header>

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto bg-[#F5F5F5] p-6">
					<div className="max-w-4xl mx-auto">
						{/* Progress Steps */}
						<div className="flex items-center gap-4 mb-8">
							{steps.map((step, index) => (
								<div
									key={step.number}
									className="flex items-center gap-4 flex-1"
								>
									<div className="flex items-center gap-3">
										<div
											className={`px-3 py-1.5 rounded-lg flex items-center justify-center text-sm font-semibold ${currentStep >= step.number
													? "bg-[#9AC63F] text-white"
													: "bg-[#F3F4F6] text-[#9CA3AF]"
												}`}
										>
											{step.number}
										</div>
										<span
											className={`text-sm ${currentStep >= step.number
													? "text-[#111827] font-medium"
													: "text-[#9CA3AF]"
												}`}
										>
											{step.label}
										</span>
									</div>
								</div>
							))}
						</div>

						{/* Form Content */}
						<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
							{/* Step 1: Basic Information */}
							{currentStep === 1 && (
								<div className="space-y-6">
									<h2 className="text-2xl font-bold text-[#111827] mb-6">
										Basic Information
									</h2>

									{/* Client Image Section */}
									<div className="space-y-4">
										<h3 className="text-lg font-semibold text-[#111827]">
											Client Image
										</h3>
										<div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center bg-[#F9FAFB]">
											{clientImagePreview ? (
												<div className="relative inline-block">
													<Image
														src={clientImagePreview}
														alt="Client preview"
														width={200}
														height={200}
														className="rounded-lg object-cover"
													/>
													<button
														onClick={() => {
															setClientImage(null);
															setClientImagePreview(null);
														}}
														className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
													>
														<X className="h-4 w-4" />
													</button>
												</div>
											) : (
												<div className="space-y-4">
													<div className="flex justify-center">
														<div className="w-32 h-32 bg-[#E5E7EB] rounded-lg flex items-center justify-center">
															<Upload className="h-12 w-12 text-[#9CA3AF]" />
														</div>
													</div>
													<p className="text-sm text-[#6B7280]">
														Please upload or take a image, size less than 100KB
													</p>
													<label className="inline-block cursor-pointer" onClick={() => document.getElementById('doctorAssessmentImageInput')?.click()}>
														<span className="px-6 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors">
															Choose File
														</span>
														<input
															id="doctorAssessmentImageInput"
															type="file"
															accept="image/*"
															onChange={handleImageChange}
															className="hidden"
														/>
													</label>
													<p className="text-xs text-[#6B7280]">
														No File Chosen
													</p>
												</div>
											)}
										</div>
									</div>

									{/* Basic Information Form */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Name
											</label>
											<input
												type="text"
												value={formData.name}
												onChange={(e) =>
													setFormData({ ...formData, name: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Email
											</label>
											<input
												type="email"
												value={formData.email}
												onChange={(e) =>
													setFormData({ ...formData, email: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Phone No.
											</label>
											<input
												type="tel"
												value={formData.phone}
												onChange={(e) =>
													setFormData({ ...formData, phone: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Gender
											</label>
											<select
												value={formData.gender}
												onChange={(e) =>
													setFormData({ ...formData, gender: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											>
												<option value="Female">Female</option>
												<option value="Male">Male</option>
												<option value="Other">Other</option>
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Age
											</label>
											<input
												type="text"
												value={formData.age}
												onChange={(e) =>
													setFormData({ ...formData, age: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Height
											</label>
											<input
												type="text"
												value={formData.height}
												onChange={(e) =>
													setFormData({ ...formData, height: formatHeight(e.target.value) })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Weight
											</label>
											<div className="relative">
												<input
													type="text"
													value={formData.weight}
													onChange={(e) =>
														setFormData({ ...formData, weight: formatWeight(e.target.value) })
													}
													className="w-full pl-4 pr-12 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
												<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">lb</span>
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Street Address
											</label>
											<input
												type="text"
												value={formData.streetAddress}
												onChange={(e) =>
													setFormData({
														...formData,
														streetAddress: e.target.value,
													})
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												City
											</label>
											<select
												value={formData.city}
												onChange={(e) =>
													setFormData({ ...formData, city: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											>
												<option value="Fort Lauderdale">Fort Lauderdale</option>
												<option value="Miami">Miami</option>
												<option value="Orlando">Orlando</option>
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												State
											</label>
											<input
												type="text"
												value={formData.state}
												onChange={(e) =>
													setFormData({ ...formData, state: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Zip Code
											</label>
											<input
												type="text"
												value={formData.zipCode}
												onChange={(e) =>
													setFormData({ ...formData, zipCode: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
									</div>
								</div>
							)}

							{/* Step 2: Medical Information */}
							{currentStep === 2 && (
								<div className="space-y-6">
									{/* <div className="flex items-center justify-between mb-2">
										<h2 className="text-2xl font-bold text-[#111827]">
											Medical Information
										</h2>
										<button
											onClick={openNotepad}
											className="px-4 py-2 bg-[#9AC63F] text-white rounded-xl text-sm font-medium hover:bg-[#85af34] transition-colors"
										>
											Notepad
										</button>
									</div> */}

									{/* History */}
									<div className="space-y-3">
										<h3 className="text-lg font-semibold text-[#111827]">
											History
										</h3>
										<textarea
											value={formData.history}
											onChange={(e) =>
												setFormData({ ...formData, history: e.target.value })
											}
											rows={6}
											className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20 resize-none"
										/>
									</div>

									{/* Primary Concern */}
									<div className="space-y-3">
										<h3 className="text-lg font-semibold text-[#111827]">
											Primary Concern
										</h3>
										<div className="flex flex-wrap gap-2">
											{formData.primaryConcerns.map((concern, index) => (
												<div
													key={index}
													className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm"
												>
													<span className="font-medium">{concern}</span>
													<button
														onClick={() => removeConcern(index)}
														className="h-5 w-8 flex items-center justify-center rounded-full hover:bg-[#E5E7EB]"
													>
														<X className="h-3 w-3" />
													</button>
												</div>
											))}
										</div>
										<div className="flex items-center gap-3 mt-2">
											<input
												type="text"
												value={newConcern}
												onChange={(e) => setNewConcern(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") addConcern();
												}}
												placeholder="Add concern"
												className="w-full max-w-xs px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											<button
												onClick={addConcern}
												className="px-4 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors"
											>
												Add
											</button>
										</div>
									</div>

									{/* Any Medication */}
									<div className="space-y-3">
										<h3 className="text-lg font-semibold text-[#111827]">
											Any Medication
										</h3>
										<div className="flex flex-wrap gap-2">
											{formData.medications.map((medication, index) => (
												<div
													key={index}
													className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm"
												>
													<span className="font-medium">{medication}</span>
													<button
														onClick={() => removeMedication(index)}
														className="h-5 w-8 flex items-center justify-center rounded-full hover:bg-[#E5E7EB]"
													>
														<X className="h-3 w-3" />
													</button>
												</div>
											))}
										</div>
										<div className="flex items-center gap-3 mt-2">
											<input
												type="text"
												value={newMedication}
												onChange={(e) => setNewMedication(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") addMedication();
												}}
												placeholder="Add medication"
												className="w-full max-w-xs px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											<button
												onClick={addMedication}
												className="px-4 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors"
											>
												Add
											</button>
										</div>
									</div>
								</div>
							)}

							{/* Step 3: Upload Document */}
							{currentStep === 3 && (
								<div className="space-y-6">
									<h2 className="text-2xl font-bold text-[#111827] mb-6">
										Upload Your Document
									</h2>

									<div
										onDragOver={handleDragOver}
										onDrop={handleDrop}
										onClick={() => document.getElementById('doctorAssessmentDocInput')?.click()}
										className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-12 text-center bg-[#F9FAFB] cursor-pointer hover:border-[#9AC63F] transition-colors"
									>
										{documentPreview ? (
											<div className="space-y-4">
												<div className="flex justify-center">
													<Image
														src={documentPreview}
														alt="Document preview"
														width={100}
														height={100}
														className="rounded-lg object-cover"
													/>
												</div>
												<p className="text-sm text-[#6B7280]">
													{documentFile?.name}
												</p>
												<button
													onClick={(e) => {
														e.stopPropagation();
														setDocumentFile(null);
														setDocumentPreview(null);
													}}
													className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
												>
													Remove
												</button>
											</div>
										) : (
											<div className="space-y-4">
												<div className="flex justify-center">
													<div className="w-24 h-24 bg-[#E5E7EB] rounded-lg flex items-center justify-center">
														<Upload className="h-12 w-12 text-[#9CA3AF]" />
													</div>
												</div>
												<p className="text-sm font-medium text-[#111827]">
													Drag and drop your document here
												</p>
												<p className="text-sm text-[#6B7280]">
													or click to browse from your device
												</p>
												<label className="inline-block cursor-pointer" onClick={() => document.getElementById('doctorAssessmentDocInput')?.click()}>
													<span className="px-6 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors">
														Choose File
													</span>
													<input
														id="doctorAssessmentDocInput"
														type="file"
														accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
														onChange={handleDocumentChange}
														className="hidden"
													/>
												</label>
												<p className="text-xs text-[#6B7280]">
													Supported file types: PDF, DOC, JPG, PNG
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Step 4: Assign a Doctor */}
							{currentStep === 4 && (
								<div className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
										{(doctors as any)?.doctors?.map((doc: any) => (
											<button
												key={doc._id}
												// onClick={() => console.log(doc)}
												onClick={() => setSelectedDoctorId(doc._id)}
												className={`relative bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border transition-colors ${selectedDoctorId === doc._id
														? "border-[#9AC63F]"
														: "border-[#E5E7EB] hover:border-[#9AC63F]"
													}`}
											>
												<div className="flex flex-col items-center text-center">
													<div className="relative h-20 w-20 rounded-2xl overflow-hidden mb-4">
														<Image
															src={getDoctorAvatar(doc) ?? "/images/avatar.PNG"}
															alt={doc.displayName}
															fill
															unoptimized
															className="object-cover"
														/>
													</div>
													<p className="text-lg font-bold text-[#111827]">
														{doc.displayName}
													</p>
													<p className="text-sm text-[#6B7280]">
														{doc?.specialization}
													</p>
													<div className="absolute top-4 right-4">
														<span
															className={`flex h-6 w-6 items-center justify-center rounded-lg border ${selectedDoctorId === doc._id
																	? "bg-[#F97316] border-[#F97316]"
																	: "bg-[#F3F4F6] border-[#E5E7EB]"
																}`}
														>
															{selectedDoctorId === doc._id && (
																<Check className="h-4 w-4 text-white" />
															)}
														</span>
													</div>
												</div>
												<div className="pt-4 mt-4 border-t border-[#E5E7EB]">
													<div className="flex items-center justify-center">
														<div className="min-w-[140px] text-center">
															<p className="text-sm font-semibold text-[#111827]">
																{String(doc.yearsExperience).padStart(2, "0")}{" "}
																Years
															</p>
															<p className="text-xs text-[#6B7280]">
																Experience
															</p>
														</div>
														<div className="mx-6 h-6 w-px bg-[#E5E7EB]" />

													</div>
												</div>
											</button>
										))}
									</div>
								</div>
							)}

							{/* Step 5: Schedule Tentative Appointment */}
							{currentStep === 5 && (
								<div className="space-y-6">
									{/* Selected Doctor Header */}
									{(() => {
										const doc: any = (doctors as any)?.doctors?.find(
											(d: any) => String(d?._id) === String(selectedDoctorId)
										);
										if (!doc) return null;
										return (
											<div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
												<div className="flex items-center gap-5">
													<div className="relative h-14 w-14 rounded-xl overflow-hidden">
														<Image
															src={getDoctorAvatar(doc)}
															alt={doc.displayName || doc.name}
															fill
															unoptimized
															className="object-cover"
														/>
													</div>
													<div>
														<p className="text-lg font-bold text-[#111827]">
															{doc.displayName || doc.name}
														</p>
														<p className="text-sm text-[#6B7280]">
															{doc.specialization || doc.title}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-6">
													<div className="text-right">
														<p className="text-sm font-semibold text-[#111827]">
															{String(
																doc.yearsExperience ?? doc.years ?? 0
															).padStart(2, "0")}{" "}
															Years
														</p>
														<p className="text-xs text-[#6B7280]">Experience</p>
													</div>

												</div>
											</div>
										);
									})()}

									{/* Scheduler */}
									<div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E7EB]">
										<h3 className="text-xl font-bold text-[#111827] mb-4">
											Schedule A Tentative Appointment
										</h3>

										{/* Date rail */}
										<div className="flex items-center justify-between mb-6">
											<button
												onClick={() => {
													if (activeDateIndex > 0) {
														setActiveDateIndex(activeDateIndex - 1);
													} else {
														setDateStartOffset(
															Math.max(0, dateStartOffset - 1)
														);
													}
												}}
												className="h-9 w-9 bg-[#F3F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E7EB]"
											>
												<ChevronLeft className="h-5 w-8 text-[#6B7280]" />
											</button>
											<div className="flex items-center gap-8">
												{Array.from({ length: 5 }).map((_, i) => {
													const base = new Date();
													const d = new Date(base);
													d.setDate(base.getDate() + dateStartOffset + i);
													const isToday = dateStartOffset + i === 0;
													const label = isToday
														? `Today, ${String(d.getDate()).padStart(2, "0")}`
														: d.toLocaleDateString(undefined, {
															month: "short",
															day: "numeric",
														});
													const active = i === activeDateIndex;
													return (
														<div
															key={i}
															className="flex flex-col items-center gap-1"
														>
															<button
																onClick={() => setActiveDateIndex(i)}
																className={`px-4 py-2 rounded-xl text-sm ${active
																		? "text-[#111827] font-semibold"
																		: "text-[#6B7280]"
																	}`}
															>
																{label}
															</button>
															{active && (
																<div className="h-0.5 w-14 bg-[#F97316] rounded-full" />
															)}
														</div>
													);
												})}
											</div>
											<button
												onClick={() => {
													if (activeDateIndex < 4) {
														setActiveDateIndex(activeDateIndex + 1);
													} else {
														setDateStartOffset(dateStartOffset + 1);
													}
												}}
												className="h-9 w-9 bg-[#F3F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E7EB]"
											>
												<ChevronRight className="h-5 w-8 text-[#6B7280]" />
											</button>
										</div>

										{/* Slot tabs */}
										<div className="mb-2 text-sm font-medium text-[#111827]">
											Slot
										</div>
										<div className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl p-2 mb-6">
											{(["Morning", "Afternoon", "Evening"] as const).map(
												(slot) => (
													<button
														key={slot}
														onClick={() => setSelectedSlot(slot)}
														className={`px-4 py-2 rounded-xl text-sm font-medium ${selectedSlot === slot
																? "bg-[#9AC63F] text-white"
																: "bg-[#F9FAFB] text-[#6B7280]"
															}`}
													>
														{slot}
													</button>
												)
											)}
										</div>

										<div className="mb-2 text-sm font-medium text-[#111827]">
											Time
										</div>
										{isTimesLoading && (
											<div className="text-xs text-[#6B7280] mb-2">
												Loading available times…
											</div>
										)}
										{slotsError && (
											<div className="text-xs text-red-600 mb-2">
												{slotsError}
											</div>
										)}
										<div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
											{(selectedSlot === "Morning"
												? [
													"06:00 AM",
													"06:30 AM",
													"07:00 AM",
													"07:30 AM",
													"08:00 AM",
													"08:30 AM",
													"09:00 AM",
													"09:30 AM",
													"10:00 AM",
													"10:30 AM",
													"11:00 AM",
													"11:30 AM",
												]
												: selectedSlot === "Afternoon"
													? [
														"12:00 PM",
														"12:30 PM",
														"01:00 PM",
														"01:30 PM",
														"02:00 PM",
														"02:30 PM",
														"03:00 PM",
														"03:30 PM",
														"04:00 PM",
														"04:30 PM",
													]
													: [
														"05:00 PM",
														"05:30 PM",
														"06:00 PM",
														"06:30 PM",
														"07:00 PM",
														"07:30 PM",
														"08:00 PM",
														"08:30 PM",
														"09:00 PM",
														"09:30 PM",
													]
											).map((t) => (
												<button
													key={t}
													onClick={() =>
														availableTimes.includes(t) && setSelectedTime(t)
													}
													disabled={!availableTimes.includes(t)}
													className={`px-4 py-2 rounded-xl border text-sm min-w-[120px] text-center ${selectedTime === t
															? "bg-[#FFF7ED] border-[#F97316] text-[#F97316]"
															: "bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
														} ${!availableTimes.includes(t)
															? "opacity-50 cursor-not-allowed"
															: ""
														}`}
												>
													{t}
												</button>
											))}
										</div>
									</div>
								</div>
							)}

							{/* Navigation Buttons */}
							<div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E5E7EB]">
								<button
									onClick={handlePrevious}
									disabled={currentStep === 1}
									className="px-6 py-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Previous
								</button>
								<button
									onClick={() => {
										if (currentStep === 4) setCurrentStep(5);
										else if (currentStep === 5) handleSubmit();
										else handleNext();
									}}
									className={`px-6 py-2 rounded-lg transition-colors ${currentStep === 5
											? "bg-[#F97316] text-white hover:bg-[#ef6b0e]"
											: "bg-[#9AC63F] text-white hover:bg-[#85af34]"
										}`}
								>
									{currentStep === 4
										? "Schedule"
										: currentStep === 5
											? "Submit"
											: "Next"}
								</button>
							</div>
						</div>
					</div>
				</main>
			</div>
			<Dialog open={isNotepadOpen} onOpenChange={setIsNotepadOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Notepad</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<textarea
							value={notepadText}
							onChange={(e) => setNotepadText(e.target.value)}
							rows={8}
							className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20 resize-none"
						/>
						<div className="flex items-center justify-end gap-3">
							<button
								onClick={() => setIsNotepadOpen(false)}
								className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F9FAFB] transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={saveNotepad}
								className="px-4 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors"
							>
								Save
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
