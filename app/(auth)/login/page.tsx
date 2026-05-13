"use client";

import { useEffect, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { login, loginFormSchema, logout } from "@/hooks/auth";
import Footer from "@/components/Footer";
import Image from "next/image";

import { Button } from "@/components/ui/button";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, Eye, EyeOff, Loader, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = loginFormSchema;

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<"splash" | "transition" | "ready">("splash");
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setError("");

    try {
      const { user } = await login(data);

      const role = (user?.role ?? "").toLowerCase();
      if (role === "doctor") {
        if (user?.status !== "approved") router.push("/pending-approval");
        else router.push("/doctor/dashboard");
        return;
      }
      if (role === "patient") {
        router.push("/patient/schedule");
        return;
      }
      if (role === "lpc") {
        router.push("/lpc/dashboard");
        return;
      }
      if (role === "marketer") {
        router.push("/marketer/client");
        return;
      }
      setError("Unauthorized access.");
      logout(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
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

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("transition"), 1500);
    const t2 = setTimeout(() => setPhase("ready"), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${phase === "ready" ? "content-ready" : "opacity-0"}`}>
      {phase !== "ready" && (
        <div className={`splash-overlay ${phase === "splash" ? "splash-enter" : "splash-exit"}`}>
          <div className="relative w-full h-full flex items-center justify-center">
            <Image src="/images/logo.svg" alt="Excel Connect" width={220} height={120} priority />
            <div className="absolute left-0 top-0 h-full w-28 sm:w-36 md:w-40 opacity-90 pointer-events-none">
              <Image src="/images/Group 2.png" alt="" fill className="object-contain" sizes="(max-width: 768px) 8rem, 10rem" />
            </div>
            <div className="absolute right-0 top-0 h-full w-28 sm:w-36 md:w-40 opacity-90 pointer-events-none rotate-180">
              <Image src="/images/Group 2.png" alt="" fill className="object-contain" sizes="(max-width: 768px) 8rem, 10rem" />
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 bg-gray-50">
        <div className="flex items-center justify-center py-10 md:py-14">
          <Card className="w-[360px] sm:w-[420px] shadow-xl rounded-2xl border border-gray-200">
            <CardHeader className="pb-2">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
                <p className="text-gray-500 text-sm">Welcome back! Please enter your details.</p>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-semibold">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="h-4 w-4 absolute left-3 top-2.5 text-gray-500" />
                          <Input className="mt-0 pl-10" placeholder="abc@mail.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 flex justify-between">
                        <span className="font-semibold">Password</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="h-4 w-4 absolute left-3 top-2.5 text-gray-500" />
                          <Input placeholder="************" type={showPassword ? "text" : "password"} className="pl-10 pr-10" {...field} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-gray-700 font-normal">
                            Keep me signed in
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Link href="/forgot-password" className="text-sm text-orange-500">Forgot Password?</Link>
                </div>

                <Button variant="secondary" type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <div className="flex items-center justify-center font-bold">
                      <Loader className="spinner-border animate-spin" />
                      <span className="ml-2">Signing in...</span>
                    </div>
                  ) : (
                    <span className="font-bold cursor-pointer">
                      Sign In <ArrowRight className="inline-block ml-1" />
                    </span>
                  )}
                </Button>
                
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
        <div className="relative bg-white rounded-l-4xl px-8 md:px-14 py-10 md:py-16 shadow-sm flex flex-col justify-center h-full overflow-hidden">
          <div className="flex items-start gap-4 mb-8">
            <Image src="/images/logo.svg" alt="Excel Connect" width={220} height={80} className="object-contain" />
          </div>
          <div className="space-y-4 relative z-10">
            <p className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Welcome Back
            </p>
            <p className="text-gray-600 text-lg max-w-md leading-relaxed">
              You can connect and assess patients through a convenient, safe and secure environment
            </p>
          </div>
          <div className="relative mt-12 flex-1 min-h-[300px]">
            <Image src="/images/image 99.png" alt="Stethoscope" fill className="object-contain" priority />
          </div>
          <div className="absolute left-0 -rotate-90 top-0 h-full  w-full  pointer-events-none overflow-hidden rounded-l-4xl">
            <Image src="/images/Group 2.png" alt="" fill className="object-cover object-left" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
