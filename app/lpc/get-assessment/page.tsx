"use client";

import { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import Image from "next/image";
import {
    FileText,
    Upload,
    X,
    Search,
    ChevronLeft,
    ChevronRight,
    Check,
} from "lucide-react";
import { useRouter } from 'next/navigation';
import Cookies from "js-cookie";
import TopBarUserMenu from "@/components/TopBarUserMenu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	doctorAvailableTimes,
	AllAvailableDR,
	runExternalAppointment,
} from "@/hooks/appointments";
import LPCSidebar from "@/components/LPCSidebar";

export default function LPCGetAssessment() {
	const router = useRouter();
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [currentStep, setCurrentStep] = useState(1);
	const [clientImage, setClientImage] = useState<File | null>(null);
	const [clientImagePreview, setClientImagePreview] = useState<string | null>(null);
	const [documentFile, setDocumentFile] = useState<File | null>(null);
	const [documentPreview, setDocumentPreview] = useState<string | null>(null);
	const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
	const [isNotepadOpen, setIsNotepadOpen] = useState(false);
	const [notepadText, setNotepadText] = useState("");
	const [newConcern, setNewConcern] = useState("");
	const [newMedication, setNewMedication] = useState("");
	const [activeDateIndex, setActiveDateIndex] = useState(0);
	const [dateStartOffset, setDateStartOffset] = useState(0);
	const [selectedSlot, setSelectedSlot] = useState<"Morning" | "Afternoon" | "Evening">("Morning");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [availableTimes, setAvailableTimes] = useState<string[]>([]);
	const [isTimesLoading, setIsTimesLoading] = useState(false);
	const [slotsError, setSlotsError] = useState<string | null>(null);
	const [doctors, setDoctors] = useState<any>({ count: 0, doctors: [] });

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
		history: "",
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

		const fetchDoctors = async () => {
			try {
				const data = await AllAvailableDR();
				setDoctors(data);
				if (!selectedDoctorId) {
					const first = (data as any)?.doctors?.[0]?._id;
					if (first) setSelectedDoctorId(String(first));
				}
			} catch (e: any) {}
		};
		fetchDoctors();
	}, []);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setClientImage(file);
			const reader = new FileReader();
			reader.onloadend = () => setClientImagePreview(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setDocumentFile(file);
			const reader = new FileReader();
			reader.onloadend = () => setDocumentPreview(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const addConcern = () => {
		const v = newConcern.trim();
		if (!v) return;
		setFormData({ ...formData, primaryConcerns: [...formData.primaryConcerns, v] });
		setNewConcern("");
	};

	const addMedication = () => {
		const v = newMedication.trim();
		if (!v) return;
		setFormData({ ...formData, medications: [...formData.medications, v] });
		setNewMedication("");
	};

	const steps = [
		{ number: 1, label: "Basic information" },
		{ number: 2, label: "Medical Information" },
		{ number: 3, label: "Upload Document" },
		{ number: 4, label: "Assign a Doctor" },
	];

	const buildAssessmentPayload = () => {
		const formDataPayload = new FormData();
		const docList: any[] = (doctors as any)?.doctors || [];
		const selectedDoc: any = docList.find((d: any) => String(d?._id) === String(selectedDoctorId));
		
		const baseDate = new Date();
		const chosenDate = new Date(baseDate);
		chosenDate.setDate(baseDate.getDate() + dateStartOffset + activeDateIndex);
		const dateStr = `${chosenDate.getFullYear()}-${String(chosenDate.getMonth() + 1).padStart(2, "0")}-${String(chosenDate.getDate()).padStart(2, "0")}`;

		formDataPayload.append("basicInformation", JSON.stringify({
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
		}));

		formDataPayload.append("medicalInformation", JSON.stringify({
			history: formData.history,
			primaryConcerns: formData.primaryConcerns,
			medications: formData.medications,
		}));

		formDataPayload.append("appointment", JSON.stringify({
			date: dateStr,
			slot: selectedSlot,
			time: selectedTime,
		}));

		formDataPayload.append("assignDoctorId", selectedDoctorId || "");
		if (selectedDoc) {
			formDataPayload.append("assignDoctor", JSON.stringify({
				id: selectedDoc._id,
				name: selectedDoc.displayName || selectedDoc.name,
				title: selectedDoc.specialization || selectedDoc.title,
			}));
		}

		formDataPayload.append("meta", JSON.stringify({ userId: loggedInUser?.id ?? null }));
		if (clientImage) formDataPayload.append("clientImage", clientImage);
		if (documentFile) formDataPayload.append("documentFile", documentFile);

		return formDataPayload;
	};

	const handleSubmit = async () => {
		const payload = buildAssessmentPayload();
		try {
			const response = await runExternalAppointment(payload);
			if (response?.status >= 200 && response?.status < 300) {
				enqueueSnackbar("Assessment submitted successfully", { variant: "success" });
				router.push('/lpc/dashboard');
			} else {
				enqueueSnackbar(response?.message || "Submission failed", { variant: "error" });
			}
		} catch (error) {
			enqueueSnackbar("Assessment submission failed", { variant: "error" });
		}
	};

	return (
		<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
			<LPCSidebar className="hidden lg:flex" />

			<div className="flex-1 flex flex-col overflow-hidden">
				<header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
					<div className="flex items-center justify-between gap-4">
						{/* <div className="relative flex-1 max-w-md hidden sm:block">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
							<input
								type="text"
								placeholder="Search"
								className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
							/>
						</div> */}
						<TopBarUserMenu user={loggedInUser} />
					</div>
				</header>

				<main className="flex-1 overflow-y-auto p-6">
					<div className="max-w-4xl mx-auto">
						<div className="flex items-center gap-4 mb-8">
							{steps.map((step) => (
								<div key={step.number} className="flex items-center gap-3 flex-1">
									<div className={`px-3 py-1.5 rounded-lg flex items-center justify-center text-sm font-semibold ${currentStep >= step.number ? "bg-[#9AC63F] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>
										{step.number}
									</div>
									<span className={`text-sm ${currentStep >= step.number ? "text-[#111827] font-medium" : "text-[#9CA3AF]"}`}>
										{step.label}
									</span>
								</div>
							))}
						</div>

						<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
							{currentStep === 1 && (
								<div className="space-y-6">
									<h2 className="text-2xl font-bold text-[#111827]">Basic Information</h2>
									<div className="grid grid-cols-2 gap-4">
										<input className="border p-2 rounded" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
										<input className="border p-2 rounded" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
										<input className="border p-2 rounded" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
										<input className="border p-2 rounded" placeholder="Age" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
									</div>
									<div className="flex justify-end">
										<button onClick={() => setCurrentStep(2)} className="bg-[#9AC63F] text-white px-6 py-2 rounded">Next</button>
									</div>
								</div>
							)}

							{currentStep === 2 && (
								<div className="space-y-6">
									<h2 className="text-2xl font-bold text-[#111827]">Medical Information</h2>
									<textarea className="w-full border p-2 rounded min-h-[100px]" placeholder="Medical History" value={formData.history} onChange={e => setFormData({...formData, history: e.target.value})} />
									<div className="flex justify-between">
										<button onClick={() => setCurrentStep(1)} className="border px-6 py-2 rounded">Back</button>
										<button onClick={() => setCurrentStep(3)} className="bg-[#9AC63F] text-white px-6 py-2 rounded">Next</button>
									</div>
								</div>
							)}

							{currentStep === 3 && (
								<div className="space-y-6">
									<h2 className="text-2xl font-bold text-[#111827]">Upload Document</h2>
									<div className="border-2 border-dashed p-8 text-center rounded-xl bg-[#F9FAFB]">
										<input type="file" onChange={handleDocumentChange} className="mb-4" />
										{documentPreview && <p className="text-sm text-green-600">File uploaded!</p>}
									</div>
									<div className="flex justify-between">
										<button onClick={() => setCurrentStep(2)} className="border px-6 py-2 rounded">Back</button>
										<button onClick={() => setCurrentStep(4)} className="bg-[#9AC63F] text-white px-6 py-2 rounded">Next</button>
									</div>
								</div>
							)}

							{currentStep === 4 && (
								<div className="space-y-6">
									<h2 className="text-2xl font-bold text-[#111827]">Assign a Doctor</h2>
									<select className="w-full border p-2 rounded" value={selectedDoctorId || ""} onChange={e => setSelectedDoctorId(e.target.value)}>
										{doctors.doctors?.map((doc: any) => (
											<option key={doc._id} value={doc._id}>{doc.name}</option>
										))}
									</select>
									<div className="flex justify-between">
										<button onClick={() => setCurrentStep(3)} className="border px-6 py-2 rounded">Back</button>
										<button onClick={handleSubmit} className="bg-[#9AC63F] text-white px-6 py-2 rounded">Submit Assessment</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
