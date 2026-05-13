"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { verifyOtp, sendOtp } from "@/hooks/auth";
export default function VerifyOtpPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]" />}>
			<VerifyOtpInner />
		</Suspense>
	);
}

function VerifyOtpInner() {
	const router = useRouter();
	const search = useSearchParams();
	const email = search.get("email") || "";
	const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
	const [loading, setLoading] = useState(false);

	const inputs = [
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
	];

	useEffect(() => {
		inputs[0].current?.focus();
	}, []);

	const handleChange = (index: number, value: string) => {
		const v = value.replace(/\D/g, "");
        if (v.length > 1) {
             // Handle case where multiple digits are entered at once (though onPaste handles most pastes)
             const chars = v.split("").slice(0, 4);
             const next = [...digits];
             chars.forEach((c, i) => {
                 if (index + i < 4) {
                     next[index + i] = c;
                 }
             });
             setDigits(next);
             const nextIndex = Math.min(index + chars.length, 3);
             inputs[nextIndex].current?.focus();
             return;
        }

		const next = [...digits];
		next[index] = v.slice(0, 1);
		setDigits(next);
		if (v && index < inputs.length - 1) inputs[index + 1].current?.focus();
	};

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
        
        if (pastedData) {
            const next = [...digits];
            for (let i = 0; i < pastedData.length; i++) {
                next[i] = pastedData[i];
            }
            setDigits(next);
            
            // Focus logic
            const nextIndex = Math.min(pastedData.length, 3);
            inputs[nextIndex].current?.focus();
        }
    };

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "Backspace" && !digits[index] && index > 0)
			inputs[index - 1].current?.focus();
	};

	const verify = async () => {
		const code = digits.join("");
		if (code.length !== 4) return;
		setLoading(true);
		try {
			const res: any = await verifyOtp({ email, code });
			if (res?.success) {
                Cookies.remove("token");
                Cookies.remove("user");
                if (typeof window !== "undefined") {
                    localStorage.clear();
                    window.location.href = "/login";
                }
			}
		} finally {
			setLoading(false);
		}
	};

	const resend = async () => {
		if (!email) return;
		await sendOtp({ email });
	};

	return (
		<div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row">
			{/* Left Side */}
			<div className="flex-1 flex items-center justify-center py-6">
				<div className="w-full max-w-[400px] bg-[#F3F4F6] rounded-[2rem] py-4 shadow-sm border border-gray-100">
					<div className="bg-white rounded-3xl py-8 sm:p-10 shadow-sm text-center relative">
						{/* Icon */}
						<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-[#9AC63F] text-white mb-6">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
								/>
							</svg>
						</div>

						{/* Texts */}
						<h2 className="text-2xl font-bold text-[#111827] mb-2">
							Verify Your Code
						</h2>
						<p className="text-sm text-[#9CA3AF] mb-8">
							Enter the code we sent to your email.
						</p>

						{/* Inputs */}
						<div className="flex items-center justify-center gap-3 mb-8">
							{digits.map((d, i) => (
								<input
									autoComplete="off"
									key={i}
									ref={inputs[i]}
									value={d}
									onChange={(e) => handleChange(i, e.target.value)}
									onPaste={handlePaste}
									onKeyDown={(e) => handleKeyDown(i, e)}
									className="w-[60px] h-[60px] rounded-xl bg-[#F3F4F6] focus:bg-white focus:ring-2 focus:ring-[#f97316] outline-none text-center text-xl font-semibold text-gray-800 transition-all  border-[0.1 px] border-transparent focus:border-[#f97316]"
									inputMode="numeric"
								/>
							))}
						</div>

						{/* Links */}
						<div className="flex items-center justify-between text-sm mb-8 font-medium">
							<button onClick={() => router.back()} className="text-[#9CA3AF] hover:text-gray-700 transition-colors">
								Back
							</button>
							<button onClick={resend} className="text-[#f97316] underline underline-offset-4 hover:text-orange-600 transition-colors">
								Don’t receive your code
							</button>
						</div>

						{/* Button */}
						<Button
							onClick={verify}
							className="w-full h-12 bg-[#9AC63F] hover:bg-[#86b132] text-white rounded-xl font-semibold text-base transition-colors"
							disabled={loading}
						>
							{loading ? "Verifying..." : "Verify"}
						</Button>
					</div>
				</div>
			</div>

			{/* Right Side */}
			<div className="hidden md:flex relative md:w-1/2 bg-white rounded-l-[3rem] px-8 py-10 shadow-sm flex-col justify-center h-full min-h-screen overflow-hidden">
				<div className="absolute top-10 left-10 z-10">
					<div className="text-3xl font-bold tracking-tight">
						<span className="text-[#9AC63F]">Medcare</span>
						<span className="text-[#f97316]">Track</span>
					</div>
				</div>

				<div className="relative flex-1 flex items-center justify-center min-h-[400px] z-10 mt-16">
					<Image
						src="/images/image 99.png"
						alt="Stethoscope"
						width={500}
						height={500}
						className="object-contain"
						priority
					/>
				</div>

				{/* Background Patterns */}
				<Image
					src="/images/Group 2.png"
					alt="pattern"
					width={240}
					height={240}
					className="absolute -right-10 bottom-0 opacity-40 pointer-events-none"
				/>
				<Image
					src="/images/Group 2.png"
					alt="pattern"
					width={200}
					height={200}
					className="absolute right-10 -top-10 opacity-40 rotate-180 pointer-events-none"
				/>
			</div>
		</div>
	);
}
