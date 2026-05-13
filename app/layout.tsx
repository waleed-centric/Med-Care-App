import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Loading from "./loading";
import NextTopLoader from "nextjs-toploader";
import RouteLoaderOverlay from "@/components/RouteLoaderOverlay";
import GlobalProvider from "@/components/GlobalProvider";
import { cookies } from "next/headers";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Excel Connect",
  description: "Excel Connect - Therapy Brought to You",
  icons: {
    icon: "/images/favicon.svg", 
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");
  let initialUser = null;
  if (userCookie) {
    try {
      initialUser = JSON.parse(userCookie.value);
    } catch (e) {
      console.error("Failed to parse user cookie on server", e);
    }
  }

  return (
    <html lang="en">
      <body className={raleway.className}>
        <NextTopLoader color="#9AC63F" height={3} showSpinner={false} />
        <Suspense fallback={null}>
          <RouteLoaderOverlay />
        </Suspense>
        <GlobalProvider initialUser={initialUser}>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </GlobalProvider>
      </body>
    </html>
  );
}
