"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Calendar,
	Dna,
	Phone,
	Eye,
	EyeOff,
	Edit2,
	X,
	Upload,
	FileText,
	CreditCard,
	Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import UpdateClientSignatureForm from "@/components/forms/UpdateClientSignatureForm";
import ChangePinForm from "@/components/forms/ChangePinForm";
import AvatarUpload from "@/components/AvatarUpload";
import Image from "next/image";
import { format } from "date-fns";
import { getProfile, updatePassword, updateProfile } from "@/hooks/profile"; // 🔑 add update function in backend
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatInTimeZone } from "date-fns-tz";
import Cookies from "js-cookie";

export default function MarketerProfile() {
	const [profile, setProfile] = useState<any>(null);
	const [editableProfile, setEditableProfile] = useState<any>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [uploadedFiles, setUploadedFiles] = useState<{
		certificate?: File;
		driversLicense?: File;
		ssn?: File;
		resume?: File;
	}>({});
	const [passwordError, setPasswordError] = useState("");

	useEffect(() => {
		const fetchProfileData = async () => {
			try {
				const response = await getProfile();
				console.log("profile, ", profile);

				setProfile(response);
				setEditableProfile(response); // copy for editing
			} catch (error) {
				console.log(error);
			}
		};
		fetchProfileData();
	}, []);

	const handleSave = async () => {
		try {
			const updated = await updateProfile(editableProfile);

			if (updated?.user) {
				setProfile(updated.user);
				setIsEditing(false);

				// ✅ Update "user" cookie with new avatarUrl
				const existingUser = Cookies.get("user");
				if (existingUser) {
					try {
						const parsedUser = JSON.parse(existingUser);
						const updatedUser = {
							...parsedUser,
							avatarUrl: updated.user.avatarUrl, // ✅ update avatar only
						};

						Cookies.set("user", JSON.stringify(updatedUser), { expires: 7 }); // optional: keep for 7 days
					} catch (err) {
						console.error("Failed to parse user cookie", err);
					}
				}
			}
		} catch (err) {
			console.error("Failed to update profile", err);
		}
	};

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("userId", profile?._id || "");

			const res = await fetch("/api/upload/avatar", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();

			if (data.success && data.fileUrl) {
				// Update local profile state with new avatar
				setEditableProfile({
					...editableProfile,
					avatarUrl: data.fileUrl,
				});
			} else {
				console.error("Upload failed:", data.error);
			}
		} catch (err) {
			console.error("Upload error:", err);
		}
	};

	const handleResetPassword = async () => {
		setPasswordError("");
		if (newPassword !== confirmPassword) {
			setPasswordError("Passwords do not match");
			return;
		}

		try {
			const response = await updatePassword({ currentPassword, newPassword });

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setPasswordError("");
		} catch (error: any) {
			setPasswordError(
				error.response?.data?.message || "Failed to reset password"
			);
		}
	};

	const formattedDOB = profile?.dateofBirth
		? formatInTimeZone(new Date(profile.dateofBirth), "UTC", "do MMM yyyy")
		: "";

	return (
		<div className="container max-w-[1350px] mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
			<div className="flex justify-end">
				{isEditing ? (
					<>
						<Button variant="secondary" onClick={handleSave} className="mr-2">
							Save
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setEditableProfile(profile);
								setIsEditing(false);
							}}
						>
							<X className="w-4 h-4 mr-1" /> Cancel
						</Button>
					</>
				) : (
					<Button variant="secondary" onClick={() => setIsEditing(true)}>
						<Edit2 className="w-4 h-4 mr-1" /> Edit
					</Button>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Doctor Info Card */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base sm:text-lg font-medium">
							Marketer Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 sm:space-y-4">
						<div className="flex sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
							{isEditing ? (
								<AvatarUpload
									onImageChange={(file) => {
										const fakeEvent = {
											target: { files: [file] },
										} as unknown as React.ChangeEvent<HTMLInputElement>;
										handleAvatarChange(fakeEvent);
									}}
								/>
							) : (
								<img
									src={profile?.avatarUrl || "/images/avatar.PNG"}
									alt="User Avatar"
									className="w-24 h-24 rounded-full object-cover bg-green-400"
								/>
							)}

							<div className="flex flex-col text-center sm:text-left">
								{isEditing ? (
									<>
										<Input
											value={editableProfile?.firstname || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													firstname: e.target.value,
												})
											}
											placeholder="First Name"
											className="mb-2"
										/>
										<Input
											value={editableProfile?.lastname || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													lastname: e.target.value,
												})
											}
											placeholder="Last Name"
										/>

										{/* Address fields */}
										<Input
											value={editableProfile?.address?.street || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													address: {
														...editableProfile?.address,
														street: e.target.value,
													},
												})
											}
											placeholder="Street"
											className="mt-2"
										/>
										<Input
											value={editableProfile?.address?.streetLine2 || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													address: {
														...editableProfile?.address,
														streetLine2: e.target.value,
													},
												})
											}
											placeholder="Street Line 2"
										/>
										<Input
											value={editableProfile?.address?.city || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													address: {
														...editableProfile?.address,
														city: e.target.value,
													},
												})
											}
											placeholder="City"
										/>
										<Input
											value={editableProfile?.address?.region || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													address: {
														...editableProfile?.address,
														region: e.target.value,
													},
												})
											}
											placeholder="State"
										/>
										<Input
											value={editableProfile?.address?.postalCode || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													address: {
														...editableProfile?.address,
														postalCode: e.target.value,
													},
												})
											}
											placeholder="Postal Code"
										/>
										<Input
											value={editableProfile?.address?.country || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													address: {
														...editableProfile?.address,
														country: e.target.value,
													},
												})
											}
											placeholder="Country"
										/>
									</>
								) : (
									<>
										<h3 className="font-semibold text-secondary text-base sm:text-lg">
											{profile?.firstname} {profile?.lastname}
										</h3>
										<p className="text-xs sm:text-sm text-muted-foreground">
											{profile?.address?.street || "Nil"},{" "}
											{profile?.address?.streetLine2 || "Nil"} <br />
											{profile?.address?.city || "Nil"},{" "}
											{profile?.address?.region || "Nil"}{" "}
											{profile?.address?.postalCode || "Nil"} <br />
											{profile?.address?.country || "Nil"}
										</p>
									</>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							<div className="flex items-center gap-2 border rounded-lg p-2 sm:p-3">
								<div className="p-2 bg-emerald-100 rounded-lg">
									<Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600" />
								</div>
								<div>
									<p className="text-xs sm:text-sm text-muted-foreground">
										DOB:
									</p>
									{isEditing ? (
										<Input
											type="date"
											value={editableProfile?.dateofBirth || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													dateofBirth: e.target.value,
												})
											}
										/>
									) : (
										<p className="font-medium text-sm sm:text-base">
											{formattedDOB}
										</p>
									)}
								</div>
							</div>

							<div className="flex items-center gap-2 border rounded-lg p-2 sm:p-3">
								<div className="p-2 bg-orange-100 rounded-lg">
									<Dna className="w-5 h-5 sm:w-7 sm:h-7 text-orange-600" />
								</div>
								<div>
									<p className="text-xs sm:text-sm text-muted-foreground">
										Sex:
									</p>
									{isEditing ? (
										<Input
											value={editableProfile?.sex || ""}
											onChange={(e) =>
												setEditableProfile({
													...editableProfile,
													sex: e.target.value,
												})
											}
											placeholder="male/female"
										/>
									) : (
										<p className="font-medium text-sm sm:text-base">
											{profile?.sex}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* <div className="grid gap-6 ">
              {renderFileSection("certificate", <FileText className="h-6 w-6 text-gray-400" />, "Certificate")}
              {renderFileSection("driversLicense", <CreditCard className="h-6 w-6 text-gray-400" />, "Driver's License")}
              {renderFileSection("ssn", <Shield className="h-6 w-6 text-gray-400" />, "SSN")}
              {renderFileSection("resume", <FileText className="h-6 w-6 text-gray-400" />, "Resume")}
            </div> */}
					</CardContent>
				</Card>

				{/* Clinic Information Card */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base sm:text-lg font-medium">
							Clinic Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 sm:space-y-4">
						<div>
							{isEditing ? (
								<>
									<Input
										value={editableProfile?.clinicInfo?.clinicName || ""}
										onChange={(e) =>
											setEditableProfile({
												...editableProfile,
												clinicInfo: {
													...editableProfile?.clinicInfo,
													clinicName: e.target.value,
												},
											})
										}
										placeholder="Clinic Name"
										className="mb-2"
									/>

									<Input
										value={editableProfile?.clinicInfo?.clinicAddress || ""}
										onChange={(e) =>
											setEditableProfile({
												...editableProfile,
												clinicInfo: {
													...editableProfile?.clinicInfo,
													clinicAddress: e.target.value,
												},
											})
										}
										placeholder="Street Address"
										className="mb-2"
									/>

									<Input
										value={editableProfile?.clinicInfo?.clinicEmail || ""}
										onChange={(e) =>
											setEditableProfile({
												...editableProfile,
												clinicInfo: {
													...editableProfile?.clinicInfo,
													clinicEmail: e.target.value,
												},
											})
										}
										placeholder="abc@example.com"
										className="mb-2"
									/>

									<Input
										value={editableProfile?.clinicInfo?.clinicPhone || ""}
										onChange={(e) =>
											setEditableProfile({
												...editableProfile,
												clinicInfo: {
													...editableProfile?.clinicInfo,
													clinicPhone: e.target.value,
												},
											})
										}
										placeholder="Phone Number"
									/>
								</>
							) : (
								<>
									<h3 className="font-semibold text-secondary text-base sm:text-lg">
										{profile?.clinicInfo?.clinicName}
									</h3>
									<p className="text-xs sm:text-sm text-muted-foreground">
										{profile?.clinicInfo?.clinicEmail}
									</p>
									<p className="text-xs sm:text-sm text-muted-foreground">
										{profile?.clinicInfo?.clinicAddress}
									</p>
									<div className="flex items-center gap-2 border rounded-lg p-2 mt-2 text-emerald-600">
										<Phone className="w-4 h-4" />
										<span className="text-sm sm:text-base">
											{profile?.clinicInfo?.clinicPhone}
										</span>
									</div>
								</>
							)}
						</div>

						<div className="grid grid-cols-1 gap-4 sm:gap-6">
							<div className="space-y-3 sm:space-y-4 mt-1">
								<p className="font-medium text-sm sm:text-base">
									Reset Password
								</p>

								{passwordError && (
									<Alert variant="destructive" className="mb-6">
										<AlertDescription className="border-red-500 text-red-500">
											{passwordError}
										</AlertDescription>
									</Alert>
								)}

								{/* Password Input */}
								<div>
									<label className="block mb-1 text-xs sm:text-sm">
										Current Password
									</label>
									<div className="relative">
										<Input
											name="currentPassword"
											placeholder="Enter your password"
											type={showPassword ? "text" : "password"}
											autoComplete="current-password"
											className="pr-10 text-sm sm:text-base"
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
										>
											{showPassword ? (
												<Eye className="h-4 w-4" />
											) : (
												<EyeOff className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>

								{/* Password Input */}
								<div>
									<label className="block mb-1 text-xs sm:text-sm">
										New Password
									</label>
									<div className="relative">
										<Input
											name="newPassword"
											placeholder="Enter new password"
											type={showPassword ? "text" : "password"}
											autoComplete="current-password"
											className="pr-10 text-sm sm:text-base"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
										>
											{showPassword ? (
												<Eye className="h-4 w-4" />
											) : (
												<EyeOff className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>

								{/* Confirm Password Input */}
								<div>
									<label className="block mb-1 text-xs sm:text-sm">
										Confirm Password
									</label>
									<div className="relative">
										<Input
											name="confirmPassword"
											placeholder="Confirm new password"
											type={showPassword ? "text" : "password"}
											autoComplete="new-password"
											className="pr-10 text-sm sm:text-base"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
										>
											{showPassword ? (
												<Eye className="h-4 w-4" />
											) : (
												<EyeOff className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>

								<Button
									onClick={handleResetPassword}
									variant="secondary"
									className="w-full text-sm sm:text-base cursor-pointer"
								>
									Reset Password
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
