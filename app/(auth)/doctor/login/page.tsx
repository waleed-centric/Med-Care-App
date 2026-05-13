"use client";

import { useEffect, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { login, loginFormSchema, logout } from "@/hooks/auth";

import { Button } from "@/components/ui/button";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader, ArrowRight, Mail } from "lucide-react";
import Image from "next/image";

const formSchema = loginFormSchema;

type FormValues = z.infer<typeof formSchema>;

export default function DoctorLogin() {
	const [error, setError] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showSplash, setShowSplash] = useState(true);
	const router = useRouter();
	const [selectedRole, setSelectedRole] = useState<
		"doctor" | "marketer" | "patient" | "lpc"
	>("doctor");
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
	});

	useEffect(() => {
		const timer = setTimeout(() => setShowSplash(false), 2000);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		setError("");
	}, [selectedRole]);

	const onSubmit = async (data: FormValues) => {
		setError("");

		try {
			const { user, token } = await login(data);

			const parts = token?.split(".") || [];
			const payload = parts.length > 1 ? parts[1] : "";
			const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
			const padded = normalized.padEnd(
				Math.ceil(normalized.length / 4) * 4,
				"="
			);
			let decoded: any = null;
			try {
				decoded = padded ? JSON.parse(atob(padded)) : null;
			} catch {
				decoded = null;
			}
			const roleFromToken = (decoded?.role ?? user?.role ?? "").toLowerCase();

			if (selectedRole === "doctor" && roleFromToken !== "doctor") {
				setError("Unauthorized access. Please log in as a doctor.");
				logout();
				return;
			}

			if (selectedRole === "marketer" && roleFromToken !== "marketer") {
				setError("Unauthorized access. Please log in as a marketer.");
				logout();
				return;
			}

			if (selectedRole === "patient" && roleFromToken !== "patient") {
				setError("Unauthorized access. Please log in as a patient.");
				logout();
				return;
			}

			if (selectedRole === "lpc" && roleFromToken !== "lpc") {
				setError("Unauthorized access. Please log in as an LPC.");
				logout();
				return;
			}

			if (
				(user.role ?? "").toLowerCase() === "doctor" &&
				user?.status != "approved"
			) {
				router.push("/pending-approval");
			} else if (
				(user.role ?? "").toLowerCase() === "doctor" &&
				user?.status === "approved"
			) {
				// router.push("/doctor/dashboard");
				window.location.href = "/doctor/dashboard";
			} else if (roleFromToken === "marketer") {
				// router.push("/marketer/client");
				window.location.href = "/marketer/client";
			} else if (roleFromToken === "patient") {
				// router.push("/patient/schedule");
				window.location.href = "/patient/schedule";
			} else if (roleFromToken === "lpc") {
				// router.push("/lpc/dashboard");
				window.location.href = "/lpc/dashboard";
			} else {
				setError("Unauthorized access. Please log in as a marketer.");
				logout(false);
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			console.log(err);
			const status = err?.response?.status;
			const apiMessage = err?.response?.data?.error || err?.response?.data?.message;
      if (status === 401 || status === 400) {
        // Agar backend se specific message aya hai to wo dikhao, warna generic
        setError(apiMessage || "Invalid credentials");
      } else if (typeof apiMessage === "string" && apiMessage.toLowerCase().includes("invalid")) {
        setError(apiMessage || "Invalid credentials");
      } else {
        setError(apiMessage || "Failed to login. Please try again.");
      }
		}
	};

	return (
		<div className="min-h-screen bg-[#F5F5F5]">
			<div className="relative min-h-screen overflow-hidden">
				<div
					className={`fixed inset-0 z-50 transition-all duration-700 ease-out ${
						showSplash
							? "translate-y-0 opacity-100"
							: "-translate-y-full opacity-0 pointer-events-none"
					}`}
				>
                    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white before:content-[''] before:absolute before:inset-y-0 before:left-0 before:h-full before:w-[320px] before:bg-[url('/images/left_splash.svg')] before:bg-no-repeat before:bg-size-[420px_780px] before:bg-position-[left_0_top_-70px] before:opacity-100 before:pointer-events-none after:content-[''] after:absolute after:top-auto after:bottom-0 after:right-0 after:h-full after:w-[320px] after:bg-[url('/images/right_splash.svg')] after:bg-bottom-right after:bg-no-repeat after:bg-size-[420px] after:opacity-100 after:pointer-events-none">
						{/* Central Content */}
						<div className="relative z-10 flex flex-col items-center justify-center gap-3">
							{/* Logo with text - horizontal layout */}
							<div className="flex items-center gap-3">
								<Image
									src="/images/logo.svg"
									alt="Excel Connect logo"
									width={400}
									height={64}
									priority
									className=""
								/>
							</div>
						</div>
					</div>
				</div>

				<div
					className={`relative z-10 flex min-h-screen w-full flex-col transition-all duration-700 ease-out ${
						showSplash
							? "translate-y-8 opacity-0 pointer-events-none"
							: "translate-y-0 opacity-100"
					}`}
				>
					<div className="flex min-h-screen w-full flex-col md:flex-row">
						<div className="flex flex-1 items-center justify-center px-6 py-12 md:px-12">
							<div className="relative w-full max-w-lg">
								<div className="relative z-10 overflow-hidden rounded-[30px] border border-[#E5E7EB] shadow-[0_24px_60px_rgba(198,205,221,0.35)]">
									<div className="relative h-16 bg-[#F1F4F9] px-8 text-sm font-semibold text-[#9CA3AF]">
										<div className="relative flex h-full items-center justify-between">
											<span
												className="absolute bottom-0 h-1 w-12 -translate-x-1/2 rounded-b-full bg-[#9AC63F] transition-all duration-300"
												style={{
													left:
														selectedRole === "patient"
															? "12.5%"
															: selectedRole === "marketer"
															? "37.5%"
															: selectedRole === "doctor"
															? "62.5%"
															: selectedRole === "lpc"
															? "87.5%"
															: "0%",
												}}
											/>
											<button
												type="button"
												className={`relative flex-1 text-center transition-colors duration-200 ${
													selectedRole === "patient"
														? "font-bold text-[#111827]"
														: "text-[#9CA3AF]"
												}`}
												onClick={() => setSelectedRole("patient")}
											>
												Client
											</button>
											<button
												type="button"
												className={`relative flex-1 text-center transition-colors duration-200 ${
													selectedRole === "marketer"
														? "font-bold text-[#111827]"
														: "text-[#9CA3AF]"
												}`}
												onClick={() => setSelectedRole("marketer")}
											>
												Marketer
											</button>
											<button
												type="button"
												className={`relative flex-1 text-center transition-colors duration-200 ${
													selectedRole === "doctor"
														? "font-bold text-[#111827]"
														: "text-[#9CA3AF]"
												}`}
												onClick={() => setSelectedRole("doctor")}
											>
												Doctor
											</button>
											<button
												type="button"
												className={`relative flex-1 text-center transition-colors duration-200 ${
													selectedRole === "lpc"
														? "font-bold text-[#111827]"
														: "text-[#9CA3AF]"
												}`}
												onClick={() => setSelectedRole("lpc")}
											>
												LPC
											</button>
										</div>
									</div>

									<div className="rounded-4xl bg-white px-10 pb-10 pt-8">
										<div className="mb-6">
											<p className="text-3xl font-bold text-[#111827]">
												Sign in
											</p>
										</div>

										{error && (
											<Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
												<AlertDescription className="text-red-600 font-medium">{error}</AlertDescription>
											</Alert>
										)}

										<Form {...form}>
											<form
												onSubmit={form.handleSubmit(onSubmit)}
												className="space-y-6"
											>
												<FormField
													control={form.control}
													name="email"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm font-semibold text-[#4B5563]">
																Email
															</FormLabel>
															<FormControl>
																<div className="relative mt-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_5px_15px_rgba(235,239,246,0.8)]">
																	<input
																		className="h-full w-full border-none bg-transparent text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0"
																		placeholder="abc@mail.com"
																		type="email"
																		{...field}
																	/>
																	<Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
																</div>
															</FormControl>
															<FormMessage className="text-red-500" />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="password"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm font-semibold text-[#4B5563]">
																Password
															</FormLabel>
															<FormControl>
																<div className="relative mt-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_5px_15px_rgba(235,239,246,0.8)]">
																	<input
																		className="h-full w-full border-none bg-transparent text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0"
																		placeholder="************"
																		type={showPassword ? "text" : "password"}
																		{...field}
																	/>
																	<button
																		type="button"
																		onClick={() => setShowPassword((s) => !s)}
																		className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
																	>
																		{showPassword ? (
																			<EyeOff className="h-4 w-4" />
																		) : (
																			<Eye className="h-4 w-4" />
																		)}
																	</button>
																</div>
															</FormControl>
															<FormMessage className="text-red-500" />
														</FormItem>
													)}
												/>

												<div className="flex items-center justify-between text-sm">
													<FormField
														control={form.control}
														name="rememberMe"
														render={({ field }) => (
															<FormItem className="flex flex-row items-start space-x-3 space-y-0">
																<FormControl>
																	<label
																		htmlFor="keep"
																		className="flex items-center gap-3 text-[#4B5563]"
																	>
																		<input
																			id="keep"
																			type="checkbox"
																			checked={field.value}
																			onChange={field.onChange}
																			className="h-5 w-8 rounded-md border border-[#D1D5DB] accent-[#9AC63F]"
																		/>
																		Keep me signed in
																	</label>
																</FormControl>
															</FormItem>
														)}
													/>
													<Link
														href="/forgot-password"
														className="font-semibold text-[#F97316] hover:text-[#ef6b0e]"
													>
														Forgot Password?
													</Link>
												</div>

												<Button
													type="submit"
													className="mt-2 h-12 w-full rounded-xl bg-[#9AC63F] text-base font-semibold text-white hover:bg-[#85af34]"
													disabled={form.formState.isSubmitting}
												>
													{form.formState.isSubmitting ? (
														<div className="flex items-center justify-center gap-2 font-semibold">
															<Loader className="h-4 w-4 animate-spin" />
															Logging in...
														</div>
													) : (
														<span className="flex items-center justify-center gap-2">
															Sign In
															<ArrowRight className="h-4 w-4" />
														</span>
													)}
												</Button>
											</form>
										</Form>
									</div>
									{selectedRole !== "marketer" && (
										<div className="rounded-xl bg-[#F4F4F5] px-4 py-4 text-center text-sm text-[#6B7280]">
											Don’t have an account?{" "}
											<Link
												href={
													selectedRole === "patient"
														? "/client/register"
														: selectedRole === "lpc"
														? "/lpc/register"
														: "/doctor/register"
												}
											className="font-semibold text-[#F97316] hover:text-[#ef6b0e]"
										>
											{selectedRole === "patient"
												? "Register as a Patient"
												: selectedRole === "lpc"
												? "Register as a LPC"
												: "Register as a Doctor"}
										</Link>
									</div>
									)}
								</div>
							</div>
						</div>

						<div className="relative hidden flex-1 items-center justify-center overflow-hidden rounded-l-[40px] bg-white md:flex">
							<Image
								src="/images/1308017_22-01 1.png"
								alt="Decorative leaf pattern"
								width={900}
								height={900}
								priority
								className="pointer-events-none absolute -mr-32 h-full w-auto opacity-90"
							/>

							<div className="absolute left-16 top-16">
								<Image
									src="/images/logo.svg"
									alt="Excel Connect logo"
									className="w-[65%]"
									width={280}
									height={56}
									priority
								/>
							</div>

							<div className="relative z-10 px-4 flex w-full flex-col gap-6 text-left top-10">
								<h2 className="text-4xl font-extrabold text-[#111827]">
									Welcome Back,
								</h2>
								<p className="text-base font-medium leading-relaxed text-[#6B7280]">
									You can connect and assess patients through a convenient, safe
									and secure environment
								</p>
								<Image
									src="/images/image 99.png"
									alt="Stethoscope"
									width={360}
									height={50}
									priority
									className="ml-12 mt-4 h-[50%] w-[50%]"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
