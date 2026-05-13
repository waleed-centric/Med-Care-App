"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendForgotPassword } from "@/hooks/auth";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center" />
            }
        >
            <ForgotPasswordInner />
        </Suspense>
    );
}

function ForgotPasswordInner() {
    const router = useRouter();
    const search = useSearchParams();
    const [email, setEmail] = useState<string>(search.get("email") || "");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const submit = async () => {
        if (!email) {
            setError("Email is required");
            return;
        }
        const valid = /.+@.+\..+/.test(email);
        if (!valid) {
            setError("Please enter a valid email");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const res = await sendForgotPassword({ email });
            const msg = res?.message || "Check your email for the reset link.";
            setSuccess(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F5] grid grid-cols-1 lg:grid-cols-2">
            <div className="flex items-center justify-center p-6 lg:p-10">
                <div className="w-full max-w-lg">
                    <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_24px_60px_rgba(198,205,221,0.25)] overflow-hidden">
                        <div className="px-8 pt-8">
                            <div className="text-center">
                                <div className="text-3xl font-extrabold text-[#111827]">Forgot Password</div>
                                <p className="mt-2 text-sm text-[#6B7280]">Enter your registered email. We will send you a reset link.</p>
                            </div>
                            <div className="mt-6">
                                <label className="text-sm font-semibold text-[#4B5563]">Email</label>
                                <div className="relative mt-2">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-8 text-[#9CA3AF]" />
                                    <Input
                                        autoComplete="off"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                                        className="h-11 pl-10 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus-visible:ring-2 focus-visible:ring-[#9AC63F]/30"
                                    />
                                </div>
                                {error && (
                                    <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="mt-2 flex items-center gap-2 text-emerald-600 text-sm">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>{success}</span>
                                    </div>
                                )}
                                <Button
                                    onClick={submit}
                                    className="mt-6 h-11 w-full rounded-xl bg-[#9AC63F] text-white font-semibold hover:bg-[#86b132]"
                                    disabled={loading}
                                >
                                    {loading ? "Sending..." : "Send"}
                                </Button>
                                {/* <Button
                                    variant="outline"
                                    onClick={() => router.push("/login")}
                                    className="mt-3 h-11 w-full rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                                </Button> */}
                            </div>
                        </div>
                        <div className="mt-8 px-8 pb-8">
                           
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative hidden lg:flex items-center justify-center p-0">
                <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-l-[40px] bg-white/50 backdrop-blur-sm">
                    {/* Logo Section */}
                    <div className="absolute left-10 top-12 flex flex-col z-20">
                        <Image
                            src="/images/logo.svg"
                            alt="Excel Connect logo"
                            width={240}
                            height={48}
                            priority
                            className="h-auto w-auto"
                        />
                        <div className="mt-2 text-sm font-medium text-[#6B7280]">
                            therapy brought to you...
                        </div>
                    </div>

                    {/* Main Image */}
                    <div className="relative z-10 mt-16 transform transition-transform hover:scale-105 duration-500">
                        <Image
                            src="/images/image 99.png"
                            alt="Stethoscope"
                            width={420}
                            height={520}
                            className="w-[380px] drop-shadow-2xl"
                            priority
                        />
                    </div>

                    {/* Decorative Background */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-[500px] bg-[url('/images/right_splash.svg')] bg-no-repeat bg-bottom-right bg-contain opacity-80" />
                </div>
            </div>
        </div>
	);
}
