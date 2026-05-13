"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Upload, Plus, X } from "lucide-react";
import { registerDoctor } from "@/hooks/registration";

export default function RegisterLPC() {
	const router = useRouter();
	const [step, setStep] = useState<number>(1);
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [newService, setNewService] = useState<string>("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	type FormDataShape = {
		firstName: string;
		middleName: string;
		lastName: string;
		phone: string;
		email: string;
		password: string;
		confirmPassword: string;
		dateOfBirth: string;
		gender: string;
		streetAddress: string;
		city: string;
		state: string;
		zipCode: string;
		specialization: string;
		workExperience: string;
		services: string[];
		education: string;
		about: string;
		avatarFile: File | null;
		certificates: File[];
	};

	const [formData, setFormData] = useState<FormDataShape>({
		firstName: "",
		middleName: "",
		lastName: "",
		phone: "",
		email: "",
		password: "",
		confirmPassword: "",
		dateOfBirth: "",
		gender: "other",
		streetAddress: "",
		city: "",
		state: "",
		zipCode: "",
		specialization: "",
		workExperience: "",
		services: [],
		education: "",
		about: "",
		avatarFile: null,
		certificates: [],
	});

	const isValidPhone = (val: string) => /^\d{10,15}$/.test(String(val || ""));

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		if (name === "phone") {
			const digits = value.replace(/\D/g, "").slice(0, 15);
			setFormData((prev) => ({ ...prev, phone: digits }));
			setFieldErrors((prev) => {
				const next = { ...prev };
				if (!isValidPhone(digits)) next.phone = "Phone must be 10-15 digits";
				else delete next.phone;
				return next;
			});
			return;
		}
		if (name === "zipCode" || name === "workExperience") {
			const digits = value.replace(/\D/g, "");
			setFormData((prev) => ({ ...prev, [name]: digits }));
			return;
		}
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, files } = e.target;
		if (name === "avatarFile") {
			const file = files?.[0] ?? null;

			setFieldErrors((prev) => {
				const { avatarFile, ...rest } = prev;
				return rest;
			});
			setFormData((prev) => ({ ...prev, avatarFile: file }));
		} else if (name === "certificates") {
			setFormData((prev) => ({
				...prev,
				certificates: Array.from(files ?? []),
			}));
		}
	};

	React.useEffect(() => {
		if (formData.avatarFile) {
			const url = URL.createObjectURL(formData.avatarFile);
			setAvatarPreview(url);
			return () => URL.revokeObjectURL(url);
		} else {
			setAvatarPreview(null);
		}
	}, [formData.avatarFile]);

	const handleNextStep = () => {
		setError("");
		setFieldErrors({});
		const errs: Record<string, string> = {};
		const passOk = !!formData.password && formData.password.length >= 8;
		const passMatch = formData.password === formData.confirmPassword;
		const dobOk = /^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth);
		const phoneOk = isValidPhone(formData.phone);
		if (!formData.firstName.trim()) errs.firstName = "First name is required";
		if (!formData.lastName.trim()) errs.lastName = "Last name is required";
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) errs.email = "Enter a valid email";
		if (!formData.gender) errs.gender = "Select gender";
		if (!formData.streetAddress.trim()) errs.streetAddress = "Street address is required";
		if (!formData.city) errs.city = "Select city";
		if (!formData.state) errs.state = "Select state";
		if (!/^\d{5}$/.test(formData.zipCode)) errs.zipCode = "ZIP must be 5 digits";
		if (!passOk) {
			errs.password = "Password must be at least 8 characters";
		}
		if (!passMatch) {
			errs.confirmPassword = "Passwords do not match";
		}
		if (!dobOk) {
			errs.dateOfBirth = "Date of birth must be yyyy-mm-dd";
		}
		if (!phoneOk) {
			errs.phone = "Phone must be 10-15 digits";
		}
		if (Object.keys(errs).length) {
			setFieldErrors(errs);
			setError("Please fix the highlighted fields");
			return;
		}
		setStep(2);
	};

	const addService = () => {
		const v = newService.trim();
		if (!v) return;
		if (!formData.services.includes(v)) {
			setFormData((prev) => ({ ...prev, services: [...prev.services, v] }));
		}
		setNewService("");
	};

	const toggleService = (service: string) => {
		setFormData((prev) => ({
			...prev,
			services: prev.services.includes(service)
				? prev.services.filter((s) => s !== service)
				: [...prev.services, service],
		}));
	};

	const removeService = (service: string) => {
		setFormData((prev) => ({
			...prev,
			services: prev.services.filter((s) => s !== service),
		}));
	};

	const handleSubmit = async () => {
		setError("");
		setFieldErrors({});
		const errs: Record<string, string> = {};
		if (!isValidPhone(formData.phone)) errs.phone = "Phone must be 10-15 digits";
		if (!formData.specialization.trim()) errs.specialization = "Specialization is required";
		if (!formData.workExperience || !/^\d+$/.test(formData.workExperience)) errs.workExperience = "Work experience must be a number";
		if (formData.services.length === 0) errs.services = "Select or add at least one service";
		if (Object.keys(errs).length) {
			setFieldErrors(errs);
			setError("Please fix the highlighted fields");
			return;
		}

		setIsSubmitting(true);

		try {
			const payload = {
				firstname: formData.firstName,
				lastname: formData.lastName,
				email: formData.email,
				phone: formData.phone,
				password: formData.password,
				role: "lpc",
				sex: formData.gender || undefined,
				dateOfBirth: formData.dateOfBirth || undefined,
				streetAddress: formData.streetAddress || undefined,
				city: formData.city || undefined,
				state: formData.state || undefined,
				zipCode: formData.zipCode || undefined,
				workExperience: formData.workExperience ? Number(formData.workExperience) : undefined,
				specialization: formData.specialization || undefined,
				services: formData.services.length > 0 ? formData.services : undefined,
				education: formData.education || undefined,
				about: formData.about || undefined,
				avatar: formData.avatarFile || undefined,
				certificates: formData.certificates.length > 0 ? formData.certificates : undefined,
			};

			await registerDoctor(payload);
			router.push("/pending-approval");
		} catch (err: any) {
			console.error("Registration error:", err);
			setError(err.message || "Registration failed. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 py-8 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 text-center">
						Register As LPC
					</h1>
				</div>

				{/* Progress Indicator */}
				<div className="flex items-center justify-center gap-3 mb-8">
					<div
						className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold ${step === 1 ? "bg-[#9AC63F]" : "bg-gray-300"
							}`}
					>
						1
					</div>
					<span
						className={`text-sm font-medium ${step === 1 ? "text-gray-900" : "text-gray-400"
							}`}
					>
						Basic information
					</span>

					<svg
						className="h-4 w-4 text-gray-300"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M7 5l5 5-5 5" />
					</svg>

					<div
						className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold ${step === 2 ? "bg-[#9AC63F]" : "bg-gray-300"
							}`}
					>
						2
					</div>
					<span
						className={`text-sm font-medium ${step === 2 ? "text-gray-900" : "text-gray-400"
							}`}
					>
						Professional Information
					</span>
				</div>

				{/* Card */}
				<div className="bg-white rounded-lg shadow p-8 border border-gray-200">
					<div className="text-lg font-semibold text-gray-900 mb-6">
						{step === 1 ? "Basic Information" : "Professional Information"}
					</div>

					{/* Error Message */}
					{error && (
						<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-600 text-sm">{error}</p>
						</div>
					)}

					{step === 1 ? (
						<div className="space-y-6">
							{/* LPC Image Section */}
							<div className="border border-gray-200 rounded-2xl p-6 bg-gray-50 cursor-pointer" onClick={() => { if (!avatarPreview) document.getElementById('avatarFileInput')?.click(); }}>
								<h3 className="text-lg font-bold text-gray-900 mb-4">
									LPC Image
								</h3>
								<div className="flex items-center gap-4">
									<div className="h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
										{avatarPreview ? (
											<img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
										) : (
											<svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
												<path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
											</svg>
										)}
									</div>
									<div className="flex-1">
										<label className="block" onClick={(e) => e.stopPropagation()}>
											<span className="choose px-4 py-2 rounded font-medium cursor-pointer inline-block">
												Choose File
											</span>
											<input
												autoComplete="off"
												type="file"
												name="avatarFile"
												id="avatarFileInput"
												accept="image/*"
												onChange={handleFileChange}
												className="hidden"
											/>
										</label>
										<p className="text-gray-700 text-sm mt-2">
											{formData.avatarFile?.name || "No File Chosen"}
										</p>
										<p className="text-gray-500 text-xs mt-1">
											Please upload or take a image
										</p>
										{fieldErrors.avatarFile && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.avatarFile}</p>
										)}
									</div>
								</div>
							</div>

							{/* Basic Information */}
							<div className="border-t pt-6">
								<h3 className="text-lg font-bold text-gray-900 mb-4">
									Basic Information
								</h3>

								{/* Name Row */}
								<div className="grid grid-cols-2 gap-6 mb-6">
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											First Name
										</label>
										<input
											autoComplete="off"
											type="text"
											name="firstName"
											value={formData.firstName}
											onChange={handleInputChange}
											placeholder="Jonathan"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
										/>
										{fieldErrors.firstName && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.firstName}</p>
										)}
									</div>
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											Last Name
										</label>
										<input
											autoComplete="off"
											type="text"
											name="lastName"
											value={formData.lastName}
											onChange={handleInputChange}
											placeholder="Turner"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
										/>
										{fieldErrors.lastName && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.lastName}</p>
										)}
									</div>
								</div>

								{/* Phone and Email */}
								<div className="grid grid-cols-2 gap-6 mb-6">
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											Phone No.
										</label>
										<input
											autoComplete="off"
											type="tel"
											name="phone"
											value={formData.phone}
											onChange={handleInputChange}
											placeholder="1234567890"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
											inputMode="tel"
											pattern="\d{10,15}"
											title="Enter a valid phone number: 10-15 digits"
											maxLength={15}
											onBlur={(e) => {
												const digits = e.target.value.replace(/\D/g, "");
												setFieldErrors((prev) => {
													const next = { ...prev };
													if (!isValidPhone(digits)) next.phone = "Phone must be 10-15 digits";
													else delete next.phone;
													return next;
												});
											}}
										/>
										{fieldErrors.phone && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
										)}
									</div>
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											Email
										</label>
										<input
											autoComplete="off"
											type="email"
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											placeholder="abc@mail.com"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
										/>
										{fieldErrors.email && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
										)}
									</div>
								</div>

								{/* Password */}
								<div className="grid grid-cols-2 gap-6 mb-6">
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											Password
										</label>
										<div className="relative">
											<input
												autoComplete="new-password"
												type={showPassword ? "text" : "password"}
												name="password"
												value={formData.password}
												onChange={handleInputChange}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
											/>
											{fieldErrors.password && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
											)}
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
											>
												{showPassword ? (
													<EyeOff size={18} />
												) : (
													<Eye size={18} />
												)}
											</button>
										</div>
									</div>
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											Confirm Password
										</label>
										<div className="relative">
											<input
												autoComplete="new-password"
												type={showPassword ? "text" : "password"}
												name="confirmPassword"
												value={formData.confirmPassword}
												onChange={handleInputChange}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
											/>
											{fieldErrors.confirmPassword && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</p>
											)}
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
											>
												{showPassword ? (
													<EyeOff size={18} />
												) : (
													<Eye size={18} />
												)}
											</button>
										</div>
									</div>
								</div>

								{/* Date of Birth and Gender */}
								<div className="grid grid-cols-2 gap-6 mb-6">
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											Date of Birth
										</label>
										<input
											autoComplete="off"
											name="dateOfBirth"
											value={formData.dateOfBirth}
											onChange={handleInputChange}
											placeholder="YYYY-MM-DD"
											type="date"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
										/>
										{fieldErrors.dateOfBirth && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.dateOfBirth}</p>
										)}
									</div>
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											Gender
										</label>
										<select
											name="gender"
											value={formData.gender}
											onChange={handleInputChange}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none  bg-white"
										>
											<option value="">Select</option>
											<option value="male">Male</option>
											<option value="female">Female</option>
											<option value="other">Other</option>
										</select>
										{fieldErrors.gender && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.gender}</p>
										)}
									</div>
								</div>

								{/* Address */}
								<div className="grid grid-cols-2 gap-6 mb-6">
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											Street Address
										</label>
										<input
											autoComplete="off"
											type="text"
											name="streetAddress"
											value={formData.streetAddress}
											onChange={handleInputChange}
											placeholder="100 Terminal"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
										/>
										{fieldErrors.streetAddress && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.streetAddress}</p>
										)}
									</div>
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											City
										</label>
										<input
											autoComplete="off"
											type="text"
											name="city"
											value={formData.city}
											onChange={handleInputChange}
											placeholder="Fort Lauderdale"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
										/>
										{fieldErrors.city && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.city}</p>
										)}
									</div>
								</div>

								{/* State and Zip */}
								<div className="grid grid-cols-2 gap-6 mb-6">
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											State
										</label>
										{/* <select
											name="state"
											value={formData.state}
											onChange={handleInputChange}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none  bg-white"
										>
											<option value="">Select</option>
											<option value="fl">Florida</option>
											<option value="ny">New York</option>
											<option value="ca">California</option>
										</select> */}
										<input
											autoComplete="off"
											type="text"
											name="state"
											value={formData.state}
											onChange={handleInputChange}
											placeholder="FL"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
										/>
										{fieldErrors.state && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.state}</p>
										)}
									</div>
									<div>
										<label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
											Zip Code
										</label>
										<input
											autoComplete="off"
											type="text"
											name="zipCode"
											value={formData.zipCode}
											onChange={handleInputChange}
											placeholder="33315"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
										/>
										{fieldErrors.zipCode && (
											<p className="text-red-600 text-xs mt-1">{fieldErrors.zipCode}</p>
										)}
									</div>
								</div>
							</div>

							{/* Next Button */}
							<div className="flex justify-end pt-4">
								<button
									type="button"
									onClick={handleNextStep}
									className="next  text-white font-semibold  rounded-lg transition-colors"
								>
									Next
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-6">
							{/* Specialization and Experience */}
							<div className="grid grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Specialization
									</label>
									<input
										autoComplete="off"
										type="text"
										name="specialization"
										value={formData.specialization}
										onChange={handleInputChange}
										placeholder="Physiotherapist"
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
									/>
									{fieldErrors.specialization && (
										<p className="text-red-600 text-xs mt-1">{fieldErrors.specialization}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Work Experience
									</label>
									<input
										autoComplete="off"
										type="text"
										name="workExperience"
										value={formData.workExperience}
										onChange={handleInputChange}
										placeholder="22 Years"
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none "
									/>
									{fieldErrors.workExperience && (
										<p className="text-red-600 text-xs mt-1">{fieldErrors.workExperience}</p>
									)}
								</div>
							</div>
							{fieldErrors.services && (
								<p className="text-red-600 text-xs mt-2">{fieldErrors.services}</p>
							)}

							{/* Services */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-3">
									Services
								</label>
								<div className="flex flex-wrap gap-3">
									{[
										// "Acupuncture",
										// "Cervical Spine",
										// "Dry Needling",
										// "Frozen Shoulder",
										// "Joint Pain",
										// "Carpal Tunnel Syndrome",
									].map((service) => (
										<button
											key={service}
											type="button"
											onClick={() => toggleService(service)}
											className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${formData.services.includes(service)
												? "bg-[#9AC63F] text-white border-[#9AC63F]"
												: "bg-gray-100 text-gray-900 border-gray-300"
												}`}
										>
											{service}
										</button>
									))}
								</div>
								<div className="mt-3 flex items-center gap-2">
									<input
										autoComplete="off"
										type="text"
										value={newService}
										onChange={(e) => setNewService(e.target.value)}
										placeholder="Add new service"
										className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none "
									/>
									<button
										type="button"
										onClick={addService}
										className="px-4 py-2 rounded-lg bg-[#9AC63F] text-white"
									>
										<Plus className="h-5 w-5" />
									</button>
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									{formData.services
										.filter(
											(s) =>
												![
													"Acupuncture",
													"Cervical Spine",
													"Dry Needling",
													"Frozen Shoulder",
													"Joint Pain",
													"Carpal Tunnel Syndrome",
												].includes(s)
										)
										.map((s) => (
											<div key={s} className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 text-gray-900 text-sm">
												<button type="button" onClick={() => removeService(s)} className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-gray-300">
													<X className="h-3 w-3" />
												</button>
												<span>{s}</span>
											</div>
										))}
								</div>
							</div>

							{/* Education */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Education
								</label>
								<textarea
									name="education"
									value={formData.education}
									onChange={handleInputChange}
									placeholder="D.P.T, Master of Science..."
									rows={3}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none  resize-none"
								/>
							</div>

							{/* About */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									About
								</label>
								<textarea
									name="about"
									value={formData.about}
									onChange={handleInputChange}
									placeholder="Write about yourself"
									rows={5}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none  resize-none"
								/>
							</div>

							{/* Certificates */}
							<div className="border border-gray-200 rounded-2xl p-6 bg-gray-50 cursor-pointer" onClick={() => { if (!formData.certificates || formData.certificates.length === 0) document.getElementById('certificatesInput')?.click(); }}>
								<div className="flex items-center gap-4">
									<div className="h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
										<Upload className="h-6 w-6 text-gray-400" />
									</div>
									<div className="flex-1">
										<div className="text-base font-medium text-gray-900 mb-1">
											Upload Your Certificates
										</div>
										<label className="block">
											<input
												autoComplete="off"
												type="file"
												name="certificates"
												id="certificatesInput"
												multiple
												accept=".pdf,.doc,.docx,.jpg,.png"
												onChange={handleFileChange}
												className="text-sm text-gray-500 mb-1"
											/>
										</label>
										<p className="text-gray-500 text-xs">
											Supported file types: PDF, DOC, JPG, PNG
										</p>
									</div>
								</div>
							</div>


							{/* Buttons */}
							<div className="flex justify-between pt-4">
								<button
									type="button"
									onClick={() => setStep(1)}
									className="border border-gray-300 text-gray-900 font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Back
								</button>
								<button
									type="button"
									onClick={handleSubmit}
									disabled={isSubmitting}
									className="next text-white font-semibold  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? "Submitting..." : "Submit"}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
