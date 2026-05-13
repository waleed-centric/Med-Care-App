"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	Search,
	Bell,
	ChevronDown,
	Grid,
	Users,
	Calendar,
	MessageSquare,
	FileText,
	Stethoscope,
	Phone,
	Upload,
	X,
	Star,
	Check,
	ChevronLeft,
	ChevronRight,
	LogOut,
	User,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/utils";
import TopBarUserMenu from "@/components/TopBarUserMenu";
import Cookies from "js-cookie";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { addDays, format, isSameDay } from "date-fns";
import {
	submitAssessment,
	doctorAvailableTimes,
	AllAvailableDR,
	runExternalAppointment,
} from "@/hooks/appointments";
import { enqueueSnackbar } from "notistack";
import { usePathname, useRouter } from "next/navigation";

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
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [activeNow, setActiveNow] = useState(true);
	const [currentStep, setCurrentStep] = useState(1);
	const [submitting, setSubmitting] = useState(false);
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

	const toDateInfo = (d: Date) => ({
		id: d.getTime(),
		day: format(d, "EEE"),
		date: d.getDate(),
		month: format(d, "LLL"),
		fullDate: format(d, "yyyy-MM-dd"),
		isToday: isSameDay(d, new Date()),
	});
	const [cursorDate, setCursorDate] = useState<Date>(new Date());
	const [selectedDate, setSelectedDate] = useState(toDateInfo(new Date()));

	const handlePrevDates = () => {
		const today = new Date();
		if (!isSameDay(cursorDate, today) && cursorDate > today) {
			setCursorDate(addDays(cursorDate, -1));
		}
	};

	const handleNextDates = () => {
		setCursorDate(addDays(cursorDate, 1));
	};

	const visibleDates = Array.from({ length: 5 }, (_, i) =>
		toDateInfo(addDays(cursorDate, i))
	);

	const [selectedSlot, setSelectedSlot] = useState<
		"morning" | "afternoon" | "evening"
	>("morning");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [availableTimes, setAvailableTimes] = useState<string[]>([]);
	const [isTimesLoading, setIsTimesLoading] = useState(false);
	const [slotsError, setSlotsError] = useState<string | null>(null);
	const [doctors, setDoctors] = useState<any>({ count: 0, doctors: [] });
	const [docCurrentPage, setDocCurrentPage] = useState(1);
	const [docPageSize, setDocPageSize] = useState(9);
	const [docTotalItems, setDocTotalItems] = useState(0);
	const [docTotalPages, setDocTotalPages] = useState(1);
	const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
	const [docSearchTerm, setDocSearchTerm] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const [formData, setFormData] = useState({
		// Page 1: Basic Information
		name: "",
		email: "",
		phone: "",
		dob: "",
		age: "",
		gender: "Other",
		race: "",
		maritalStatus: "Single",
		ethnicity: "",
		guardianName: "",
		relationshipToClient: "",
		alternatePhone: "",
		height: "",
		weight: "",
		streetAddress: "",
		city: "",
		state: "",
		zipCode: "",
		enrolledInSchool: "No",
		schoolName: "",

		// Page 2: Behavioral Health
		history: "",
		primaryConcerns: [] as string[],
		pastDiagnosis: "No",
		diagnosisDetail: "",
		medications: [] as string[],
		medicationPrescribed: "No",
		medicationKind: "",
		enrolledInOtherAgency: "No",
		agencyLocation: "",
		referralSource: "",
		assessmentDate: "",
		assessmentTime: "",
		medicalAidProvider: "",
		planOption: "",
		membershipNumber: "",
		groupNumber: "",

		// Page 3: Rights & Consent
		parentGuardianName: "",
		childName: "",
		grade: "",
		teacherNames: "",
		recipientName: "",

		// Additional Consent Fields
		sectionB_allHealthInfo: false,
		sectionB_excludeHealthInfo: false,
		sectionB_excludeText: "",
		purposeOfRelease: "",
		authorizingAgency: "",
		emergencyContactRelationship: "",
		emergencyContactAddress: "",
		emergencyContactPhoneAlt: "",
		pcpAddress: "",
		pcpFax: "",

		// Page 4: Authorization & Contacts
		healthInfoAuth: false,
		schoolInfoExchange: false,
		schoolNamePrint: "",
		expirationDate: "",
		printName: "",
		relationship: "",
		recipientSignature: "",
		parentGuardianSignature: "",
		addressVerification: "",
		homeAltPhone: "",
		doctorNameClinic: "",
		doctorAddress: "",
		doctorPhone: "",
		emergencyContactName: "",
		emergencyContactPhone: "",

		// Page 5: Emergency Plan
		employeeClientName: "",
		emergencyContact: "",
		emergencyAddressPhone: "",
		evacuationPlace: "No",
		planToEvacuate: "No",
		whenEvacuate: "",
		planToReturn: "No",
		whoWith: "",
		necessities: "No",
		ownCellPhone: "No",
		alternativeContact: "",
		bestContactMethod: "Phone",
		additionalComments: "",
		grievancePolicyInitial: "",
		clientRecipientName: "",
		grievanceParentInitial: "",
		grievanceClientName: "",

		// Authorization for Outpatient Treatment
		authTreatment_clientName: "",
		authTreatment_date: "",
		authTreatment_services_assessment: false,
		authTreatment_services_group: false,
		authTreatment_services_education: false,
		authTreatment_services_family: false,
		authTreatment_services_psych: false,
		authTreatment_services_other: false,
		authTreatment_services_otherText: "",
		// Notice of Right to Appeal
		appealRights_clientInitial: "",
		// Second Party Involvement
		secondParty_clientName: "",
		secondParty_initial: "",
		secondParty_date: "",
		// Client Abuse and/or Neglect
		abuseNeglect_clientName: "",
		abuseNeglect_date: "",
		// Crisis Response Plan Acknowledgement
		crisisPlan_guardianName: "",
		crisisPlan_date: "",
		// 24-Hour Crisis Response Hospitalization Plan
		hospitalizationPlan_initial: "",
		hospitalizationPlan_date: "",
		// 24 Hours On Call Policy
		onCallPolicy_initial: "",
		onCallPolicy_printName: "",
		onCallPolicy_date: "",
		// Healthy Louisiana Member Choice
		choiceForm_providerName: "",
		choiceForm_providerPhone: "",
		choiceForm_contactName: "",
		choiceForm_npi: "",
		choiceForm_signature: "",
		choiceForm_date: "",
		choiceForm_guardianInitial: "",
		// Orientation Acknowledgement
		orientationInitial: "",
		orientationRecipientName: "",
		// After Hours & Weekend Policy
		weekendPolicy_initial: "",
		weekendPolicy_date: "",
		weekendPolicy_signature: "",
		weekendPolicy_signatureDate: "",
		weekendPolicy_printName: "",

		// Page 6: Final Signature
		finalName: "",
		finalDate: "",
	});

	const resolveImageSrc = (url?: string) => {
		const u = String(url ?? "").trim();
		if (!u) return "/images/avatar.PNG";
		if (/^https?:\/\//i.test(u)) return u;
		if (u.startsWith("/images/") || u.startsWith("images/")) {
			return u.startsWith("/") ? u : `/${u}`;
		}
		const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
		const cleaned = u.replace(/^\/?uploads\/?/, "");
		if (!base) {
			return `/uploads/${cleaned}`;
		}
		return `${base}/uploads/${cleaned}`;
	};

	const getDoctorAvatar = (d: any) =>
		resolveImageSrc(d?.avatarUrl ?? d?.avatar ?? "");
	const pathname = usePathname();

	const formatSlotTime = (
		input: string,
		slot: "morning" | "afternoon" | "evening"
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
		suffix = slot === "morning" ? "AM" : "PM";
		const hh = String(h).padStart(2, "0");
		const mm = String(m).padStart(2, "0");
		return `${hh}:${mm} ${suffix}`;
	};

	const formatWeight = (raw: string) => {
		const digits = String(raw || "").replace(/\D/g, "");
		return digits;
	};
	const isValidPhone = (val: string) => /^\d{10,15}$/.test(String(val || ""));
	const router = useRouter();


	const navLinkClasses = (href: string) => {
		const isActive =
			pathname === href ||
			pathname.endsWith(href) ||
			pathname.startsWith(`${href}/`);
		return `flex w-full items-center gap-3 px-0 py-3 rounded-xl ${isActive
			? "bg-[#9AC63F] text-white cursor-default"
			: "text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
			}`;
	};
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
		{ number: 3, label: "Emergency & Consent" },
		{ number: 4, label: "Upload Document" },
		{ number: 5, label: "Assign a Doctor" },
	];

	const extractMarketerIdFromToken = () => {
		try {
			const token =
				typeof window !== "undefined"
					? localStorage.getItem("token") || Cookies.get("token") || ""
					: "";
			const parts = token.split(".");
			if (parts.length > 1) {
				const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
				const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
				const decoded: any = padded ? JSON.parse(atob(padded)) : null;
				return (
					decoded?.id || decoded?.userId || decoded?._id || decoded?.sub || null
				);
			}
		} catch { }
		try {
			const userStr = Cookies.get("user");
			if (userStr) {
				const u = JSON.parse(userStr);
				return u?.id ?? null;
			}
		} catch { }
		return null;
	};

	useEffect(() => {
		const run = async () => {
			setIsDoctorsLoading(true);
			try {
				const data = await AllAvailableDR(docPageSize, "approved", docCurrentPage, docSearchTerm);
				setDoctors(data);
				const total = Number(
					(data as any)?.totalItems ?? (data as any)?.count ?? ((data as any)?.doctors?.length ?? 0)
				);
				const pages = Number(
					(data as any)?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, docPageSize)))
				);
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

	useEffect(() => {
		setDocCurrentPage(1);
	}, [docSearchTerm]);

	const filteredDoctors = (doctors as any)?.doctors ?? [];

	useEffect(() => {
		const run = async () => {
			if (currentStep !== 6) return;
			if (!selectedDoctorId) return;
			setIsTimesLoading(true);
			setSlotsError(null);
			const dateStr = selectedDate.fullDate;
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
					selectedSlot === "morning"
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
						: selectedSlot === "afternoon"
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
		selectedDate,
		selectedSlot,
	]);

	const validateBasics = () => {
		const errs: Record<string, string> = {};
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const phoneDigits = String(formData.phone || "").replace(/\D/g, "");
		const ageDigits = String(formData.age || "").match(/\d+/)?.[0];
		const weightDigits = String(formData.weight || "").match(/\d+/)?.[0];
		const heightDigits = String(formData.height || "").match(/\d+/)?.[0];

		if (!String(formData.name || '').trim()) errs.name = 'Name is required';
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

		// New Validations
		if (!String(formData.dob || "").trim()) errs.dob = "DOB is required";
		if (!String(formData.race || "").trim()) errs.race = "Race is required";
		if (!String(formData.guardianName || "").trim()) errs.guardianName = "Guardian Name is required";
		if (!String(formData.relationshipToClient || "").trim()) errs.relationshipToClient = "Relationship is required";

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
		if (!String(formData.assessmentDate || "").trim()) errs.assessmentDate = "Assessment Date is required";

		setFieldErrors(errs);
		if (Object.keys(errs).length) {
			enqueueSnackbar('Please fill in the required Medical Aid details', { variant: 'error' });
			return false;
		}
		return true;
	};

	const validateRightsConsent = () => {
		const errs: Record<string, string> = {};
		if (!String(formData.recipientName || "").trim()) errs.recipientName = "Recipient Name is required";

		setFieldErrors(errs);
		if (Object.keys(errs).length) {
			enqueueSnackbar('Please fill in the required Consent fields', { variant: 'error' });
			return false;
		}
		return true;
	};

	const validatePolicies = () => {
		const errs: Record<string, string> = {};
		if (!String(formData.orientationInitial || "").trim()) errs.orientationInitial = "Orientation Initial is required";
		if (!String(formData.orientationRecipientName || "").trim()) errs.orientationRecipientName = "Orientation Recipient Name is required";

		setFieldErrors(errs);
		if (Object.keys(errs).length) {
			enqueueSnackbar('Please fill in the required Policy fields', { variant: 'error' });
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
		if (currentStep === 3) {
			if (!validateRightsConsent()) return;
		}
		if (currentStep === 5) {
			if (!validatePolicies()) return;
		}
		if (currentStep < 5) {
			setCurrentStep(currentStep + 1);
		} else if (currentStep === 5) {
			setCurrentStep(6); // Go to scheduling
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
		const dateStr = selectedDate.fullDate;

		const basicInformation = {
			name: formData.name,
			email: formData.email,
			phone: formData.phone,
			dob: formData.dob,
			age: formData.age,
			gender: formData.gender,
			race: formData.race,
			maritalStatus: formData.maritalStatus,
			ethnicity: formData.ethnicity,
			guardianName: formData.guardianName,
			relationshipToClient: formData.relationshipToClient,
			alternatePhone: formData.alternatePhone,
			enrolledInSchool: formData.enrolledInSchool,
			schoolName: formData.schoolName,
			height: String(formData.height || "").replace(/\D/g, ""),
			weight: formData.weight,
			streetAddress: formData.streetAddress,
			city: formData.city,
			state: formData.state,
			zipCode: formData.zipCode,
		};

		const medicalInformation = {
			history: formData.history,
			primaryConcerns: formData.primaryConcerns,
			pastDiagnosis: formData.pastDiagnosis,
			diagnosisDetail: formData.diagnosisDetail,
			medications: formData.medications,
			medicationPrescribed: formData.medicationPrescribed,
			medicationKind: formData.medicationKind,
			enrolledInOtherAgency: formData.enrolledInOtherAgency,
			agencyLocation: formData.agencyLocation,
			referralSource: formData.referralSource,
			assessmentDate: formData.assessmentDate,
			assessmentTime: formData.assessmentTime,
			medicalAidProvider: formData.medicalAidProvider,
			planOption: formData.planOption,
			membershipNumber: formData.membershipNumber,
			groupNumber: formData.groupNumber,
		};

		const consentAndEmergency = {
			// Consent
			parentGuardianName: formData.parentGuardianName,
			childName: formData.childName,
			grade: formData.grade,
			teacherNames: formData.teacherNames,
			recipientName: formData.recipientName,
			// New Fields
			sectionB_allHealthInfo: formData.sectionB_allHealthInfo,
			sectionB_excludeHealthInfo: formData.sectionB_excludeHealthInfo,
			sectionB_excludeText: formData.sectionB_excludeText,
			purposeOfRelease: formData.purposeOfRelease,
			authorizingAgency: formData.authorizingAgency,
			emergencyContactRelationship: formData.emergencyContactRelationship,
			emergencyContactAddress: formData.emergencyContactAddress,
			emergencyContactPhoneAlt: formData.emergencyContactPhoneAlt,
			pcpAddress: formData.pcpAddress,
			pcpFax: formData.pcpFax,
			// Authorization
			healthInfoAuth: formData.healthInfoAuth,
			schoolInfoExchange: formData.schoolInfoExchange,
			schoolNamePrint: formData.schoolNamePrint,
			expirationDate: formData.expirationDate,
			printName: formData.printName,
			relationship: formData.relationship,
			recipientSignature: formData.recipientSignature,
			parentGuardianSignature: formData.parentGuardianSignature,
			addressVerification: formData.addressVerification,
			homeAltPhone: formData.homeAltPhone,
			doctorNameClinic: formData.doctorNameClinic,
			doctorAddress: formData.doctorAddress,
			doctorPhone: formData.doctorPhone,
			emergencyContactName: formData.emergencyContactName,
			emergencyContactPhone: formData.emergencyContactPhone,
			// Emergency Plan
			employeeClientName: formData.employeeClientName,
			emergencyContact: formData.emergencyContact,
			emergencyAddressPhone: formData.emergencyAddressPhone,
			evacuationPlace: formData.evacuationPlace,
			planToEvacuate: formData.planToEvacuate,
			whenEvacuate: formData.whenEvacuate,
			planToReturn: formData.planToReturn,
			whoWith: formData.whoWith,
			necessities: formData.necessities,
			ownCellPhone: formData.ownCellPhone,
			alternativeContact: formData.alternativeContact,
			bestContactMethod: formData.bestContactMethod,
			additionalComments: formData.additionalComments,
			grievancePolicyInitial: formData.grievancePolicyInitial,
			clientRecipientName: formData.clientRecipientName,
			grievanceParentInitial: formData.grievanceParentInitial,
			grievanceClientName: formData.grievanceClientName,
			// Authorization for Outpatient Treatment
			authTreatment_clientName: formData.authTreatment_clientName,
			authTreatment_date: formData.authTreatment_date,
			authTreatment_services_assessment: formData.authTreatment_services_assessment,
			authTreatment_services_group: formData.authTreatment_services_group,
			authTreatment_services_education: formData.authTreatment_services_education,
			authTreatment_services_family: formData.authTreatment_services_family,
			authTreatment_services_psych: formData.authTreatment_services_psych,
			authTreatment_services_other: formData.authTreatment_services_other,
			authTreatment_services_otherText: formData.authTreatment_services_otherText,
			// Notice of Right to Appeal
			appealRights_clientInitial: formData.appealRights_clientInitial,
			// Second Party Involvement
			secondParty_clientName: formData.secondParty_clientName,
			secondParty_initial: formData.secondParty_initial,
			secondParty_date: formData.secondParty_date,
			// Client Abuse and/or Neglect
			abuseNeglect_clientName: formData.abuseNeglect_clientName,
			abuseNeglect_date: formData.abuseNeglect_date,
			// Crisis Response Plan Acknowledgement
			crisisPlan_guardianName: formData.crisisPlan_guardianName,
			crisisPlan_date: formData.crisisPlan_date,
			// 24-Hour Crisis Response Hospitalization Plan
			hospitalizationPlan_initial: formData.hospitalizationPlan_initial,
			hospitalizationPlan_date: formData.hospitalizationPlan_date,
			// 24 Hours On Call Policy
			onCallPolicy_initial: formData.onCallPolicy_initial,
			onCallPolicy_printName: formData.onCallPolicy_printName,
			onCallPolicy_date: formData.onCallPolicy_date,
			// Healthy Louisiana Member Choice
			choiceForm_providerName: formData.choiceForm_providerName,
			choiceForm_providerPhone: formData.choiceForm_providerPhone,
			choiceForm_contactName: formData.choiceForm_contactName,
			choiceForm_npi: formData.choiceForm_npi,
			choiceForm_signature: formData.choiceForm_signature,
			choiceForm_date: formData.choiceForm_date,
			choiceForm_guardianInitial: formData.choiceForm_guardianInitial,
			// Orientation Acknowledgement
			orientationInitial: formData.orientationInitial,
			orientationRecipientName: formData.orientationRecipientName,
			// After Hours & Weekend Policy
			weekendPolicy_initial: formData.weekendPolicy_initial,
			weekendPolicy_date: formData.weekendPolicy_date,
			weekendPolicy_signature: formData.weekendPolicy_signature,
			weekendPolicy_signatureDate: formData.weekendPolicy_signatureDate,
			weekendPolicy_printName: formData.weekendPolicy_printName,
			// Final
			finalName: formData.finalName,
			finalDate: formData.finalDate,
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
				avatarUrl: selectedDoc.avatarUrl,
			}
			: null;

		const meta = { activeNow, userId: loggedInUser?.id ?? null };
		const marketerId = extractMarketerIdFromToken();

		formDataPayload.append(
			"basicInformation",
			JSON.stringify(basicInformation)
		);
		formDataPayload.append(
			"medicalInformation",
			JSON.stringify(medicalInformation)
		);
		// Assuming backend can handle this new field or we merge it.
		// For now appending as separate key, if backend ignores it, fine.
		// Ideally backend should be updated too, but I am only working on frontend.
		formDataPayload.append(
			"consentAndEmergency",
			JSON.stringify(consentAndEmergency)
		);

		formDataPayload.append("appointment", JSON.stringify(appointment));
		formDataPayload.append("assignDoctorId", selectedDoctorId || "");
		if (marketerId) {
			formDataPayload.append("marketerId", String(marketerId));
		}
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
		if (!String(formData.finalName || "").trim()) {
			enqueueSnackbar('Final Signature Name is required', { variant: 'error' });
			return;
		}
		setSubmitting(true);
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
				router.push("/marketer/client");
			} else {
				enqueueSnackbar(msg || "Assessment submission failed", {
					variant: "error",
				});
			}
		} catch (error) {
			enqueueSnackbar("Assessment submission failed", { variant: "error" });
		} finally {
			setSubmitting(false);
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
							width={100}
							height={100}
							priority
							className="w-auto h-auto"
						/>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-6 space-y-2">
					<Link
						href="/my-profile"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/my-profile") window.location.href = "/my-profile"; }}
						className={navLinkClasses("/my-profile")}
					>
						<User className="h-5 w-8" />
						<span className="font-medium">My Profile</span>
					</Link>
					<Link
						href="/marketer/client"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/client") window.location.href = "/marketer/client"; }}
						className={navLinkClasses("/marketer/client")}
					>
						<Users className="h-5 w-8" />
						<span className="font-medium">Client List</span>
					</Link>
					<Link
						href="/marketer/messages"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/messages") window.location.href = "/marketer/messages"; }}
						className={navLinkClasses("/marketer/messages")}
					>
						<MessageSquare className="h-5 w-8" />
						<span className="font-medium">Chats</span>
					</Link>
					<Link
						href="/marketer/get-assessment"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/get-assessment") window.location.href = "/marketer/get-assessment"; }}
						className={navLinkClasses("/marketer/get-assessment")}
					>
						<FileText className="h-5 w-8" />
						<span className="font-medium">Assign a Doctor</span>
					</Link>
					<Link
						href="/marketer/see-therapist"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/see-therapist") window.location.href = "/marketer/see-therapist"; }}
						className={navLinkClasses("/marketer/see-therapist")}
					>
						<Stethoscope className="h-5 w-8" />
						<span className="font-medium">Connect client to a therapist</span>
					</Link>
				</nav>
			</aside>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Global Header Bar */}
				<header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
					<div className="flex items-center justify-between">

						{/* Right Side */}
						<div className="flex justify-end w-full items-center gap-6">
							{/* User Profile */}
							<TopBarUserMenu user={loggedInUser} />
						</div>
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
											{fieldErrors.name && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												DOB
											</label>
											<input
												type="date"
												value={formData.dob}
												onChange={(e) =>
													setFormData({ ...formData, dob: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.dob && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.dob}</p>
											)}
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
											{fieldErrors.age && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.age}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Sex
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
											{fieldErrors.gender && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.gender}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Race
											</label>
											<input
												type="text"
												value={formData.race}
												onChange={(e) =>
													setFormData({ ...formData, race: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.race && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.race}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Marital Status
											</label>
											<select
												value={formData.maritalStatus}
												onChange={(e) =>
													setFormData({ ...formData, maritalStatus: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											>
												<option value="Single">Single</option>
												<option value="Married">Married</option>
												<option value="Divorced">Divorced</option>
												<option value="Widowed">Widowed</option>
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Ethnicity
											</label>
											<input
												type="text"
												value={formData.ethnicity}
												onChange={(e) =>
													setFormData({ ...formData, ethnicity: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Guardian Name (If minor)
											</label>
											<input
												type="text"
												value={formData.guardianName}
												onChange={(e) =>
													setFormData({ ...formData, guardianName: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.guardianName && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.guardianName}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Relationship to Client
											</label>
											<input
												type="text"
												value={formData.relationshipToClient}
												onChange={(e) =>
													setFormData({ ...formData, relationshipToClient: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.relationshipToClient && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.relationshipToClient}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Phone No.
											</label>
											<input
												type="tel"
												value={formData.phone}
												onChange={(e) => {
													const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
													setFormData({ ...formData, phone: digits });
													setFieldErrors((prev) => {
														const next = { ...prev };
														if (!isValidPhone(digits)) next.phone = 'Phone must be 10-15 digits';
														else delete next.phone;
														return next;
													});
												}}
												placeholder="1234567890"
												inputMode="tel"
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.phone && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Alternate Phone
											</label>
											<input
												type="tel"
												value={formData.alternatePhone}
												onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Address
											</label>
											<input
												type="text"
												value={formData.streetAddress}
												onChange={(e) =>
													setFormData({ ...formData, streetAddress: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.streetAddress && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.streetAddress}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												City
											</label>
											<input
												type="text"
												value={formData.city}
												onChange={(e) =>
													setFormData({ ...formData, city: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.city && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.city}</p>
											)}
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
											{fieldErrors.state && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.state}</p>
											)}
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
											{fieldErrors.zipCode && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.zipCode}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Enrolled in School?
											</label>
											<select
												value={formData.enrolledInSchool}
												onChange={(e) =>
													setFormData({ ...formData, enrolledInSchool: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											>
												<option value="No">No</option>
												<option value="Yes">Yes</option>
											</select>
										</div>
										{formData.enrolledInSchool === "Yes" && (
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-2">
													School Name
												</label>
												<input
													type="text"
													value={formData.schoolName}
													onChange={(e) =>
														setFormData({ ...formData, schoolName: e.target.value })
													}
													className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										)}
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
											{fieldErrors.email && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Height
											</label>
											<input
												type="text"
												value={formData.height}
												onChange={(e) => {
													const digits = e.target.value;
													setFormData({ ...formData, height: digits });
												}}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.height && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.height}</p>
											)}
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
											{fieldErrors.weight && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.weight}</p>
											)}
										</div>
									</div>
								</div>
							)}

							{/* Step 2: Medical Information */}
							{currentStep === 2 && (
								<div className="space-y-6">
									{/* History */}
									<div className="space-y-3">
										<h3 className="text-lg font-semibold text-[#111827]">
											History / Symptoms Checklist
										</h3>
										<textarea
											value={formData.history}
											onChange={(e) =>
												setFormData({ ...formData, history: e.target.value })
											}
											rows={4}
											className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20 resize-none"
										/>
									</div>

									{/* Primary Concern */}
									<div className="space-y-3">
										<div>
											<h3 className="text-lg font-semibold text-[#111827]">
												PRESENTING PROBLEM (S)
											</h3>
											<p className="text-sm text-gray-500">Please check all that applies</p>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											{[
												"Anxiety",
												"Criminal behavior(stealing, breaking into houses and vandalism)",
												"Constant restlessness",
												"Cutting Self",
												"Defiance (not wanting to do what they are told)",
												"Depression",
												"Destructiveness (e.g., destroying property)",
												"Difficulty concentrating",
												"Fidgety",
												"Fighting",
												"Fire-setting",
												"Forgetting Instructions",
												"Hitting or biting themselves",
												"Hurting pets or other animals",
												"Low self-esteem",
												"Lying",
												"Phobias",
												"Running away",
												"Suicidal",
												"Talking back or arguing with parents/teachers"
											].map((problem) => (
												<div key={problem} className="flex items-start gap-2">
													<input
														type="checkbox"
														id={`problem-${problem}`}
														checked={formData.primaryConcerns.includes(problem)}
														onChange={(e) => {
															const checked = e.target.checked;
															setFormData(prev => ({
																...prev,
																primaryConcerns: checked
																	? [...prev.primaryConcerns, problem]
																	: prev.primaryConcerns.filter(p => p !== problem)
															}));
														}}
														className="mt-1 h-4 w-4 text-[#9AC63F] border-gray-300 rounded focus:ring-[#9AC63F]"
													/>
													<label htmlFor={`problem-${problem}`} className="text-sm text-[#374151]">
														{problem}
													</label>
												</div>
											))}
										</div>
									</div>

									<div className="space-y-6">
										<h3 className="text-lg font-semibold text-[#111827] uppercase">
											PAST TREATMENT:
										</h3>

										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Has the client been diagnosed with a behavioral or mental disorder in the past?
											</label>
											<div className="flex gap-4">
												<label className="flex items-center gap-2">
													<input
														type="radio"
														name="pastDiagnosis"
														value="Yes"
														checked={formData.pastDiagnosis === "Yes"}
														onChange={(e) => setFormData({ ...formData, pastDiagnosis: e.target.value })}
														className="text-[#9AC63F] focus:ring-[#9AC63F]"
													/>
													<span className="text-sm text-[#374151]">Yes</span>
												</label>
												<label className="flex items-center gap-2">
													<input
														type="radio"
														name="pastDiagnosis"
														value="No"
														checked={formData.pastDiagnosis === "No"}
														onChange={(e) => setFormData({ ...formData, pastDiagnosis: e.target.value })}
														className="text-[#9AC63F] focus:ring-[#9AC63F]"
													/>
													<span className="text-sm text-[#374151]">No</span>
												</label>
											</div>
										</div>

										{formData.pastDiagnosis === "Yes" && (
											<div className="space-y-4 pl-4 border-l-2 border-[#E5E7EB]">
												<div>
													<label className="block text-sm font-medium text-[#111827] mb-2">
														If "Yes", what was it?
													</label>
													<input
														type="text"
														value={formData.diagnosisDetail}
														onChange={(e) => setFormData({ ...formData, diagnosisDetail: e.target.value })}
														className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
													/>
												</div>

												<div>
													<label className="block text-sm font-medium text-[#111827] mb-2">
														Was the client prescribed any medication for this diagnosis?
													</label>
													<div className="flex gap-4">
														<label className="flex items-center gap-2">
															<input
																type="radio"
																name="medicationPrescribed"
																value="Yes"
																checked={formData.medicationPrescribed === "Yes"}
																onChange={(e) => setFormData({ ...formData, medicationPrescribed: e.target.value })}
																className="text-[#9AC63F] focus:ring-[#9AC63F]"
															/>
															<span className="text-sm text-[#374151]">Yes</span>
														</label>
														<label className="flex items-center gap-2">
															<input
																type="radio"
																name="medicationPrescribed"
																value="No"
																checked={formData.medicationPrescribed === "No"}
																onChange={(e) => setFormData({ ...formData, medicationPrescribed: e.target.value })}
																className="text-[#9AC63F] focus:ring-[#9AC63F]"
															/>
															<span className="text-sm text-[#374151]">No</span>
														</label>
													</div>
												</div>

												{formData.medicationPrescribed === "Yes" && (
													<div>
														<label className="block text-sm font-medium text-[#111827] mb-2">
															If "yes" what kind?
														</label>
														<input
															type="text"
															value={formData.medicationKind}
															onChange={(e) => setFormData({ ...formData, medicationKind: e.target.value })}
															className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
														/>
													</div>
												)}
											</div>
										)}
									</div>

									{/* Any Medication */}
									<div className="space-y-3">
										<div>
											<h3 className="text-lg font-semibold text-[#111827]">
												Any Medication
											</h3>
										</div>
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

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Enrolled in other agency?
											</label>
											<select
												value={formData.enrolledInOtherAgency}
												onChange={(e) => setFormData({ ...formData, enrolledInOtherAgency: e.target.value })}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											>
												<option value="No">No</option>
												<option value="Yes">Yes</option>
											</select>
										</div>
										{formData.enrolledInOtherAgency === "Yes" && (
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-2">
													Agency Location
												</label>
												<input
													type="text"
													value={formData.agencyLocation}
													onChange={(e) => setFormData({ ...formData, agencyLocation: e.target.value })}
													className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										)}
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Referral Source
											</label>
											<input
												type="text"
												value={formData.referralSource}
												onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Assessment Date
											</label>
											<input
												type="date"
												value={formData.assessmentDate}
												onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.assessmentDate && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.assessmentDate}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Assessment Time
											</label>
											<input
												type="time"
												value={formData.assessmentTime}
												onChange={(e) => setFormData({ ...formData, assessmentTime: e.target.value })}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
									</div>

									{/* Medical Aid Information */}
									<div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
										<h3 className="text-lg font-semibold text-[#111827]">
											Medical Aid Details
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-2">
													Medical Aid Provider <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													value={formData.medicalAidProvider}
													onChange={(e) =>
														setFormData({ ...formData, medicalAidProvider: e.target.value })
													}
													className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
												{fieldErrors.medicalAidProvider && (
													<p className="text-red-600 text-xs mt-1">{fieldErrors.medicalAidProvider}</p>
												)}
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-2">
													Plan / Option <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													value={formData.planOption}
													onChange={(e) =>
														setFormData({ ...formData, planOption: e.target.value })
													}
													className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
												{fieldErrors.planOption && (
													<p className="text-red-600 text-xs mt-1">{fieldErrors.planOption}</p>
												)}
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-2">
													Membership / Policy Number <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													value={formData.membershipNumber}
													onChange={(e) =>
														setFormData({ ...formData, membershipNumber: e.target.value })
													}
													className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
												{fieldErrors.membershipNumber && (
													<p className="text-red-600 text-xs mt-1">{fieldErrors.membershipNumber}</p>
												)}
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-2">
													Group Number (if any)
												</label>
												<input
													type="text"
													value={formData.groupNumber}
													onChange={(e) =>
														setFormData({ ...formData, groupNumber: e.target.value })
													}
													className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Step 3: Emergency & Consent (NEW) */}
							{currentStep === 3 && (
								<div className="space-y-8">
									{/* Rights & Consent */}
									<div className="space-y-4">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">Rights & Consent</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Parent/Guardian Name</label>
												<input type="text" value={formData.parentGuardianName} onChange={(e) => setFormData({ ...formData, parentGuardianName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Child Name</label>
												<input type="text" value={formData.childName} onChange={(e) => setFormData({ ...formData, childName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Grade</label>
												<input type="text" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Teacher Names</label>
												<input type="text" value={formData.teacherNames} onChange={(e) => setFormData({ ...formData, teacherNames: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Recipient Name</label>
												<input type="text" value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
										</div>
									</div>

									{/* Section B: Information to be Released */}
									<div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
										<h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Section B: Information to be Released</h3>
										<div className="space-y-3">
											<label className="flex items-center gap-2">
												<input
													type="checkbox"
													checked={formData.sectionB_allHealthInfo}
													onChange={(e) =>
														setFormData({ ...formData, sectionB_allHealthInfo: e.target.checked })
													}
													className="h-4 w-4 text-[#9AC63F] border-gray-300 rounded focus:ring-[#9AC63F]"
												/>
												<span className="text-sm text-[#374151]">
													All health information
												</span>
											</label>
											<label className="flex items-center gap-2">
												<input
													type="checkbox"
													checked={formData.sectionB_excludeHealthInfo}
													onChange={(e) =>
														setFormData({ ...formData, sectionB_excludeHealthInfo: e.target.checked })
													}
													className="h-4 w-4 text-[#9AC63F] border-gray-300 rounded focus:ring-[#9AC63F]"
												/>
												<span className="text-sm text-[#374151]">
													Exclude the following information:
												</span>
											</label>
											{formData.sectionB_excludeHealthInfo && (
												<textarea
													value={formData.sectionB_excludeText}
													onChange={(e) => setFormData({ ...formData, sectionB_excludeText: e.target.value })}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
													rows={3}
													placeholder="Enter excluded information..."
												/>
											)}
										</div>
									</div>

									{/* Section C: Purpose of Request */}
									<div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
										<h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Section C: Purpose of Request</h3>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-1">
												Purpose
											</label>
											<input
												type="text"
												value={formData.purposeOfRelease}
												onChange={(e) =>
													setFormData({ ...formData, purposeOfRelease: e.target.value })
												}
												placeholder="e.g. Assessment, Treatment Planning, etc."
												className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
									</div>

									{/* Section D: Expiration */}
									<div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
										<h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Section D: Expiration</h3>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-1">
												Expiration Date
											</label>
											<input
												type="date"
												value={formData.expirationDate}
												onChange={(e) =>
													setFormData({ ...formData, expirationDate: e.target.value })
												}
												className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
									</div>

									{/* Authorization Details */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-1">
												I authorize (Agency Name)
											</label>
											<input
												type="text"
												value={formData.authorizingAgency}
												onChange={(e) =>
													setFormData({ ...formData, authorizingAgency: e.target.value })
												}
												placeholder="Name of Agency releasing info"
												className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-1">
												To release information to (Recipient)
											</label>
											<input
												type="text"
												value={formData.recipientName}
												onChange={(e) =>
													setFormData({ ...formData, recipientName: e.target.value })
												}
												placeholder="Name of person/agency receiving info"
												className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>
									</div>

									{/* Authorization & Contacts */}
									<div className="space-y-4">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">Authorization & Contacts</h2>
										<div className="flex flex-col gap-2">
											<label className="flex items-center gap-2">
												<input type="checkbox" checked={formData.healthInfoAuth} onChange={(e) => setFormData({ ...formData, healthInfoAuth: e.target.checked })} />
												<span className="text-sm">Authorize Health Info Exchange</span>
											</label>
											<label className="flex items-center gap-2">
												<input type="checkbox" checked={formData.schoolInfoExchange} onChange={(e) => setFormData({ ...formData, schoolInfoExchange: e.target.checked })} />
												<span className="text-sm">Authorize School Info Exchange</span>
											</label>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">School Name (Print)</label>
												<input type="text" value={formData.schoolNamePrint} onChange={(e) => setFormData({ ...formData, schoolNamePrint: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Expiration Date</label>
												<input type="date" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Print Name</label>
												<input type="text" value={formData.printName} onChange={(e) => setFormData({ ...formData, printName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Relationship</label>
												<input type="text" value={formData.relationship} onChange={(e) => setFormData({ ...formData, relationship: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>

											{/* Primary Care Physician */}
											<div className="md:col-span-2 border-t pt-4 mt-2">
												<h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Primary Care Physician</h3>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Doctor Name/Clinic</label>
												<input type="text" value={formData.doctorNameClinic} onChange={(e) => setFormData({ ...formData, doctorNameClinic: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Address</label>
												<input type="text" value={formData.pcpAddress} onChange={(e) => setFormData({ ...formData, pcpAddress: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Phone</label>
												<input type="tel" value={formData.doctorPhone} onChange={(e) => setFormData({ ...formData, doctorPhone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Fax</label>
												<input type="tel" value={formData.pcpFax} onChange={(e) => setFormData({ ...formData, pcpFax: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>

											{/* Emergency Contact */}
											<div className="md:col-span-2 border-t pt-4 mt-2">
												<h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Emergency Contact</h3>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Name</label>
												<input type="text" value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Relationship</label>
												<input type="text" value={formData.emergencyContactRelationship} onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-[#111827] mb-1">Address</label>
												<input type="text" value={formData.emergencyContactAddress} onChange={(e) => setFormData({ ...formData, emergencyContactAddress: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Phone</label>
												<input type="tel" value={formData.emergencyContactPhone} onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Alternative Phone</label>
												<input type="tel" value={formData.emergencyContactPhoneAlt} onChange={(e) => setFormData({ ...formData, emergencyContactPhoneAlt: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
										</div>
									</div>

									{/* Emergency Plan */}
									<div className="space-y-4">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">Emergency Plan</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Evacuation Place?</label>
												<select value={formData.evacuationPlace} onChange={(e) => setFormData({ ...formData, evacuationPlace: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
													<option value="No">No</option>
													<option value="Yes">Yes</option>
												</select>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Plan to Evacuate?</label>
												<select value={formData.planToEvacuate} onChange={(e) => setFormData({ ...formData, planToEvacuate: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
													<option value="No">No</option>
													<option value="Yes">Yes</option>
												</select>
											</div>
											{formData.planToEvacuate === "Yes" && (
												<div className="md:col-span-2">
													<label className="block text-sm font-medium text-[#111827] mb-1">When?</label>
													<input type="text" value={formData.whenEvacuate} onChange={(e) => setFormData({ ...formData, whenEvacuate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
												</div>
											)}
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Best Contact Method</label>
												<select value={formData.bestContactMethod} onChange={(e) => setFormData({ ...formData, bestContactMethod: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
													<option value="Phone">Phone</option>
													<option value="Text">Text</option>
													<option value="Email">Email</option>
												</select>
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-1">Additional Comments</label>
											<textarea value={formData.additionalComments} onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg resize-none" />
										</div>
									</div>

									{/* Grievance Acknowledgement */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
											GRIEVANCE ACKNOWLEDGEMENT
										</h2>
										<p className="text-sm text-gray-700">
											When clients of Louisiana Excel Care have a grievance concerning the rehabilitation services that they are receiving, they may request in writing a meeting with the Clinical Manager.
										</p>
										<p className="text-sm text-gray-700 font-medium">
											By signing below, I acknowledge I am aware and understand Louisiana Excel Care Grievance Policy
										</p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Parent/Guardian (Initial) <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													value={formData.grievanceParentInitial}
													onChange={(e) =>
														setFormData({ ...formData, grievanceParentInitial: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Client Name <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													value={formData.grievanceClientName}
													onChange={(e) =>
														setFormData({ ...formData, grievanceClientName: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>

									{/* Authorization for Outpatient Treatment */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">
											Authorization for Outpatient Treatment
										</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Client Name
												</label>
												<input
													type="text"
													value={formData.authTreatment_clientName}
													onChange={(e) =>
														setFormData({ ...formData, authTreatment_clientName: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Date
												</label>
												<input
													type="date"
													value={formData.authTreatment_date}
													onChange={(e) =>
														setFormData({ ...formData, authTreatment_date: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												The services provided are as follows:
											</label>
											<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
												{['Assessment', 'Group', 'Education', 'Family', 'Psychiatric', 'Other'].map((service) => (
													<label key={service} className="flex items-center gap-2">
														<input
															type="checkbox"
															checked={formData[`authTreatment_services_${service.toLowerCase()}` as keyof typeof formData] as boolean}
															onChange={(e) => setFormData({ ...formData, [`authTreatment_services_${service.toLowerCase()}`]: e.target.checked })}
															className="w-4 h-4 text-[#9AC63F] border-[#E5E7EB] rounded focus:ring-[#9AC63F]/20"
														/>
														<span className="text-sm text-[#4B5563]">
															{service === 'Group' ? 'Group Counseling' :
																service === 'Family' ? 'Family Counseling' :
																	service === 'Psychiatric' ? 'Psychiatric Evaluation' : service}
														</span>
													</label>
												))}
											</div>
											{formData.authTreatment_services_other && (
												<div className="mt-2">
													<input
														type="text"
														placeholder="Please specify"
														value={formData.authTreatment_services_otherText}
														onChange={(e) => setFormData({ ...formData, authTreatment_services_otherText: e.target.value })}
														className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
													/>
												</div>
											)}
										</div>
									</div>

									{/* Acknowledgement Receipt */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">
											Acknowledgement Receipt
										</h2>

										<div className="space-y-4">
											<h3 className="text-lg font-semibold text-[#111827]">Notice of Right to Appeal Determinations</h3>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Client's Initial
												</label>
												<input
													type="text"
													maxLength={4}
													value={formData.appealRights_clientInitial}
													onChange={(e) =>
														setFormData({ ...formData, appealRights_clientInitial: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>

										<div className="space-y-4">
											<h3 className="text-lg font-semibold text-[#111827]">Second Party Involvement Authorization</h3>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-[#111827] mb-1">
														Client Name
													</label>
													<input
														type="text"
														value={formData.secondParty_clientName}
														onChange={(e) =>
															setFormData({ ...formData, secondParty_clientName: e.target.value })
														}
														className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-[#111827] mb-1">
														Initial of recipient or Legal Guardian
													</label>
													<input
														type="text"
														maxLength={4}
														value={formData.secondParty_initial}
														onChange={(e) =>
															setFormData({ ...formData, secondParty_initial: e.target.value })
														}
														className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-[#111827] mb-1">
														Date
													</label>
													<input
														type="date"
														value={formData.secondParty_date}
														onChange={(e) =>
															setFormData({ ...formData, secondParty_date: e.target.value })
														}
														className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
													/>
												</div>
											</div>
										</div>
									</div>

									{/* Client Abuse and/or Neglect */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">
											Client Abuse and/or Neglect
										</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Client Name
												</label>
												<input
													type="text"
													value={formData.abuseNeglect_clientName}
													onChange={(e) =>
														setFormData({ ...formData, abuseNeglect_clientName: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Date
												</label>
												<input
													type="date"
													value={formData.abuseNeglect_date}
													onChange={(e) =>
														setFormData({ ...formData, abuseNeglect_date: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>

									{/* Crisis Response Plan Acknowledgement */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
											Crisis Response Plan Acknowledgement
										</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Parent/Legal Guardian Name
												</label>
												<input
													type="text"
													value={formData.crisisPlan_guardianName}
													onChange={(e) =>
														setFormData({ ...formData, crisisPlan_guardianName: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Date
												</label>
												<input
													type="date"
													value={formData.crisisPlan_date}
													onChange={(e) =>
														setFormData({ ...formData, crisisPlan_date: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>

									{/* 24-Hour Crisis Response Hospitalization Plan */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
											24-Hour Crisis Response Hospitalization Plan
										</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Recipient Initial
												</label>
												<input
													type="text"
													maxLength={4}
													value={formData.hospitalizationPlan_initial}
													onChange={(e) =>
														setFormData({ ...formData, hospitalizationPlan_initial: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Date
												</label>
												<input
													type="date"
													value={formData.hospitalizationPlan_date}
													onChange={(e) =>
														setFormData({ ...formData, hospitalizationPlan_date: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>

									{/* 24 Hours On Call Policy */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">
											24 Hours On Call Policy
										</h2>
										<p className="text-sm text-gray-700">
											Phone (225) 301-0219 - I acknowledge that I have read and received a copy of LA Excel Care's 24 hours On Call Policy.
										</p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Initial of Recipient or Legal Guardian
												</label>
												<input
													type="text"
													maxLength={4}
													value={formData.onCallPolicy_initial}
													onChange={(e) =>
														setFormData({ ...formData, onCallPolicy_initial: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Print Name
												</label>
												<input
													type="text"
													value={formData.onCallPolicy_printName}
													onChange={(e) =>
														setFormData({ ...formData, onCallPolicy_printName: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Date
												</label>
												<input
													type="date"
													value={formData.onCallPolicy_date}
													onChange={(e) =>
														setFormData({ ...formData, onCallPolicy_date: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>

									{/* Healthy Louisiana Member Choice */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">
											Healthy Louisiana Mental Health Rehabilitation Member Choice Form
										</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Provider Name
												</label>
												<input
													type="text"
													value={formData.choiceForm_providerName}
													onChange={(e) =>
														setFormData({ ...formData, choiceForm_providerName: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Provider Phone Number
												</label>
												<input
													type="text"
													value={formData.choiceForm_providerPhone}
													onChange={(e) =>
														setFormData({ ...formData, choiceForm_providerPhone: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Provider Contact Name
												</label>
												<input
													type="text"
													value={formData.choiceForm_contactName}
													onChange={(e) =>
														setFormData({ ...formData, choiceForm_contactName: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Provider NPI/TIN
												</label>
												<input
													type="text"
													value={formData.choiceForm_npi}
													onChange={(e) =>
														setFormData({ ...formData, choiceForm_npi: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Member/Legal Guardian Signature (type name)
												</label>
												<input
													type="text"
													value={formData.choiceForm_signature}
													onChange={(e) =>
														setFormData({ ...formData, choiceForm_signature: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Date
												</label>
												<input
													type="date"
													value={formData.choiceForm_date}
													onChange={(e) =>
														setFormData({ ...formData, choiceForm_date: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Initial of Legal Guardian (if applicable)
												</label>
												<input
													type="text"
													maxLength={4}
													value={formData.choiceForm_guardianInitial}
													onChange={(e) =>
														setFormData({ ...formData, choiceForm_guardianInitial: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>

									{/* Orientation Acknowledgement */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
											Orientation Acknowledgement
										</h2>
										<p className="text-sm text-gray-700 font-medium">
											I certify that I have explained all Louisiana Excel Care Policies and Procedures, Rights and Responsibilities to the client
										</p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Initial <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													value={formData.orientationInitial}
													onChange={(e) =>
														setFormData({ ...formData, orientationInitial: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Recipient's Name <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													value={formData.orientationRecipientName}
													onChange={(e) =>
														setFormData({ ...formData, orientationRecipientName: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>

									{/* After Hours & Weekend Policy */}
									<div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
											AFTER HOURS & WEEKEND ON-CALL COVERAGE POLICY
										</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Initial Below
												</label>
												<input
													type="text"
													maxLength={4}
													value={formData.weekendPolicy_initial}
													onChange={(e) =>
														setFormData({ ...formData, weekendPolicy_initial: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Date
												</label>
												<input
													type="date"
													value={formData.weekendPolicy_date}
													onChange={(e) =>
														setFormData({ ...formData, weekendPolicy_date: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Signature (Legal Guardian - type name)
												</label>
												<input
													type="text"
													value={formData.weekendPolicy_signature}
													onChange={(e) =>
														setFormData({ ...formData, weekendPolicy_signature: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Date
												</label>
												<input
													type="date"
													value={formData.weekendPolicy_signatureDate}
													onChange={(e) =>
														setFormData({ ...formData, weekendPolicy_signatureDate: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Print Name
												</label>
												<input
													type="text"
													value={formData.weekendPolicy_printName}
													onChange={(e) =>
														setFormData({ ...formData, weekendPolicy_printName: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>

									{/* Final Signature */}
									<div className="space-y-4">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">Final Signature</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Final Name</label>
												<input type="text" value={formData.finalName} onChange={(e) => setFormData({ ...formData, finalName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
												{fieldErrors.finalName && <p className="text-red-600 text-xs mt-1">{fieldErrors.finalName}</p>}
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">Date</label>
												<input type="date" value={formData.finalDate} onChange={(e) => setFormData({ ...formData, finalDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Step 4: Upload Document */}
							{currentStep === 4 && (
								<div className="space-y-6">
									<h2 className="text-2xl font-bold text-[#111827] mb-6">
										Upload Your Document
									</h2>

									<div
										onDragOver={handleDragOver}
										onDrop={handleDrop}
										onClick={() => document.getElementById('marketerAssessmentDocInput')?.click()}
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
												<label className="inline-block" onClick={(e) => e.stopPropagation()}>
													<span className="px-6 py-2 bg-[#9AC63F] text-white rounded-lg cursor-pointer hover:bg-[#85af34] transition-colors">
														Choose File
													</span>
													<input
														id="marketerAssessmentDocInput"
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

							{/* Step 5: Assign a Doctor */}
							{currentStep === 5 && (
								<div className="space-y-6">
									<div className="flex items-center justify-end">
										<div className="relative w-full max-w-md">
											<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-8 text-[#9CA3AF]" />
											<input
												type="text"
												placeholder="Search doctors"
												className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												value={docSearchTerm}
												onChange={(e) => setDocSearchTerm(e.target.value)}
											/>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
										{filteredDoctors.map((doc: any) => (
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
															src={getDoctorAvatar(doc)}
															alt={doc.displayName || doc.name || "Doctor"}
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
																{String(doc.workExperience).padStart(2, "0")}{" "}
																Years
															</p>
															<p className="text-xs text-[#6B7280]">
																Experience
															</p>
														</div>

													</div>
												</div>
											</button>
										))}
									</div>
									<div className="flex items-center justify-between mt-4">
										<span className="text-sm text-[#6B7280]">
											{Math.min((docCurrentPage - 1) * docPageSize + 1, docTotalItems)}-
											{Math.min(docCurrentPage * docPageSize, docTotalItems)} of {docTotalItems}
										</span>
										<div className="flex items-center gap-3">
											<button
												className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50"
												disabled={docCurrentPage === 1}
												onClick={() => setDocCurrentPage((p) => Math.max(1, p - 1))}
											>
												<ChevronLeft className="h-4 w-4 text-[#6B7280]" />
											</button>
											<button
												className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50"
												disabled={docCurrentPage >= docTotalPages}
												onClick={() => setDocCurrentPage((p) => Math.min(docTotalPages, p + 1))}
											>
												<ChevronRight className="h-4 w-4 text-[#6B7280]" />
											</button>
										</div>
									</div>
								</div>
							)}

							{/* Step 6: Schedule Tentative Appointment (Formerly 5) */}
							{currentStep === 6 && (
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
																doc.workExperience ?? doc.years ?? 0
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
									<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] max-w-10xl mx-auto mt-6">
										<div className="flex items-center justify-between mb-6">
											<h2 className="text-xl mx-auto font-bold text-[#111827]">
												Schedule A Tentative Appointment
											</h2>
										</div>

										{/* Date Selection */}
										<div className="mb-6">
											<div className="flex items-center justify-between mb-4">
												<button
													onClick={handlePrevDates}
													disabled={
														isSameDay(cursorDate, new Date()) || cursorDate < new Date()
													}
													className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
												>
													<ChevronLeft className="h-5 w-8 text-[#6B7280]" />
												</button>

												<div className="flex gap-3 mt-10 flex-1 justify-center">
													{visibleDates.map((date) => (
														<button
															key={date.id}
															onClick={() => { setSelectedDate(date); setSelectedTime(""); }}
															className={`flex flex-col items-center px-6 py-3 rounded-xl border-2 transition-all ${selectedDate.id === date.id
																? "border-[#FF9F43] bg-[#FFF4E6]"
																: "border-[#E5E7EB] hover:border-[#FFD4A3]"
																}`}
														>
															<span
																className={`text-xs font-medium mb-1 ${selectedDate.id === date.id
																	? "text-[#FF9F43]"
																	: "text-[#6B7280]"
																	}`}
															>
																{date.isToday ? "Today" : date.day}
															</span>
															<span
																className={`text-lg font-bold ${selectedDate.id === date.id
																	? "text-[#FF9F43]"
																	: "text-[#111827]"
																	}`}
															>
																{date.date}
															</span>
															<span className="text-xs text-[#6B7280]">{date.month}</span>
														</button>
													))}
												</div>

												<button
													onClick={handleNextDates}
													className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
												>
													<ChevronRight className="h-5 w-8 text-[#6B7280]" />
												</button>
											</div>
										</div>

										{/* Slot Selection */}
										<div className="mb-6">
											<label className="block text-sm font-semibold text-[#111827] mb-3">
												Slot
											</label>
											<div className="flex gap-3">
												{(["morning", "afternoon", "evening"] as const).map((slot) => (
													<button
														key={slot}
														onClick={() => {
															setSelectedSlot(slot);
															setSelectedTime("");
														}}
														className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedSlot === slot
															? "bg-[#9AC63F] text-white"
															: "bg-[#F9FAFB] text-[#6B7280] hover:bg-[#E5E7EB]"
															}`}
													>
														{slot.charAt(0).toUpperCase() + slot.slice(1)}
													</button>
												))}
											</div>
										</div>

										{/* Time Selection */}
										<div className="mb-6">
											<label className="block text-sm font-semibold text-[#111827] mb-3">
												Time
											</label>
											<div className="grid grid-cols-5 gap-3">
												{isTimesLoading ? (
													<span className="text-sm text-[#6B7280]">Loading…</span>
												) : availableTimes.length === 0 ? (
													<span className="text-sm text-[#6B7280]">No available times</span>
												) : (
													availableTimes.map((time) => (
														<button
															key={time}
															onClick={() => setSelectedTime(time)}
															className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedTime === time
																? "bg-[#FF9F43] text-white"
																: "bg-[#F9FAFB] text-[#111827] hover:bg-[#FFE5CC] border border-[#E5E7EB]"
																}`}
														>
															{time}
														</button>
													))
												)}
											</div>
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
										if (submitting) return;
										if (currentStep === 5) setCurrentStep(6);
										else if (currentStep === 6) handleSubmit();
										else handleNext();
									}}
									disabled={(currentStep === 6 && submitting) || (currentStep === 6 && !selectedTime) || (currentStep === 2 && (formData.primaryConcerns.length === 0 || formData.medications.length === 0))}
									className={`px-6 py-2 rounded-lg transition-colors ${currentStep === 6
										? "bg-[#F97316] text-white hover:bg-[#ef6b0e]"
										: "bg-[#9AC63F] text-white hover:bg-[#85af34]"
										} disabled:opacity-50 disabled:cursor-not-allowed`}
								>
									{currentStep === 5
										? "Schedule"
										: currentStep === 6
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
