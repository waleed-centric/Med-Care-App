// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Explicit public routes
const publicPaths = [
  "/",
  "/doctor/login",
  "/patient/login",
  "/marketer/login",
  "/login",
  "/marketer/register",
  "/doctor/register",
  "/lpc/register",
  "/client/register",
  "/verify-otp",
  "/create-password",
  "/pending-approval",
  "/forgot-password",
  "/(auth)/verify-otp",
  "/(auth)/create-password",
  "/lpc",
  "/lpc/login",
  "/lpc/dashboard",
  "/lpc/clients",
  "/lpc/patients",
  "/lpc/schedule",
  "/lpc/see-therapist",
  "/lpc/profile",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check token from cookies
  const token = req.cookies.get("token")?.value;
  // const userCookie = req.cookies.get("user")?.value;

  if (!token) {
    if (publicPaths.includes(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Decode JWT to get role
  let role = "";
  let decoded: any = null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = atob(payload);
      decoded = JSON.parse(jsonPayload);
      role = (decoded.role || "").toLowerCase();
      
      // Check expiration
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.delete("token");
        response.cookies.delete("user");
        return response;
      }
    }
  } catch (e) {
    console.error("Failed to decode token", e);
  }

  // If we couldn't get the role from token, try user cookie or redirect to login
  if (!role) {
     const userCookie = req.cookies.get("user")?.value;
     if (userCookie) {
         try {
             const user = JSON.parse(userCookie);
             role = (user.role || "").toLowerCase();
         } catch (e) {}
     }
  }

  if (!role) {
      // Invalid session
      if (publicPaths.includes(pathname)) return NextResponse.next();
      return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect authenticated users away from auth pages
  if (
      pathname === "/" || 
      pathname === "/doctor/login" || 
      pathname === "/lpc/login" ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/client/register" ||
      pathname === "/doctor/register" ||
      pathname === "/lpc/register" ||
      pathname === "/marketer/register"
  ) {
         if (role === "doctor") {
             // We still need status for doctors to handle pending-approval
             // If status is not in token, we might need to rely on user cookie or assume approved if we want "foran route"
             // But let's try to be safe. If user cookie exists, check it.
             const userCookie = req.cookies.get("user")?.value;
             let status = "approved"; // Default to approved if we can't find it, to satisfy "foran route", OR strictly check.
             if (userCookie) {
                 try {
                     const user = JSON.parse(userCookie);
                     if (user.status) status = user.status;
                 } catch (e) {}
             }
             
             if (status === "approved") {
                 return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
             } else {
                 return NextResponse.redirect(new URL("/pending-approval", req.url));
             }
         }
         if (role === "patient") return NextResponse.redirect(new URL("/patient/schedule", req.url));
         if (role === "lpc") return NextResponse.redirect(new URL("/lpc/dashboard", req.url));
         if (role === "marketer") return NextResponse.redirect(new URL("/marketer/client", req.url));
  }

  // If public path and we didn't redirect above (meaning user is logged in but visiting a public page that isn't an auth page? e.g. /about)
  // Actually publicPaths list contains mostly auth pages.
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Protected Routes Logic based on Role
  if (role === "doctor" && pathname.startsWith("/marketer")) {
    return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
  }
  if (role === "marketer" && pathname.startsWith("/doctor")) {
    return NextResponse.redirect(new URL("/marketer/client", req.url));
  }
  if (role === "patient" && (pathname.startsWith("/doctor") || pathname.startsWith("/marketer"))) {
    return NextResponse.redirect(new URL("/patient/schedule", req.url));
  }
  
  // Pending approval check for doctor on protected routes
  if (role === "doctor") {
       const userCookie = req.cookies.get("user")?.value;
       let status = "approved";
       if (userCookie) {
           try {
                const user = JSON.parse(userCookie);
                if (user.status) status = user.status;
           } catch (e) {}
       }
       if (status !== "approved" && pathname !== "/pending-approval") {
           return NextResponse.redirect(new URL("/pending-approval", req.url));
       }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|api/public).*)"],
};
