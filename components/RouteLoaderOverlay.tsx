"use client";

import Image from "next/image";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteLoaderOverlay() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const overlayId = "excel-route-overlay";

	useEffect(() => {
		const overlay = document.getElementById(overlayId) as HTMLDivElement | null;
		const show = () => {
			if (overlay) overlay.style.display = "flex";
		};
		window.addEventListener("excel-route-start", show);
		const origPushState = history.pushState;
		const origReplaceState = history.replaceState;
		if (!(history as any).__excel_loader_patched) {
			(history as any).__excel_loader_patched = true;
			history.pushState = function (...args: any[]) {
				window.dispatchEvent(new Event("excel-route-start"));
				return Reflect.apply(origPushState, history, args as any);
			} as typeof history.pushState;
			history.replaceState = function (...args: any[]) {
				window.dispatchEvent(new Event("excel-route-start"));
				return Reflect.apply(origReplaceState, history, args as any);
			} as typeof history.replaceState;
		}
		const onPop = () => window.dispatchEvent(new Event("excel-route-start"));
		window.addEventListener("popstate", onPop);
		return () => {
			window.removeEventListener("excel-route-start", show);
			window.removeEventListener("popstate", onPop);
			history.pushState = origPushState;
			history.replaceState = origReplaceState;
			delete (history as any).__excel_loader_patched;
		};
	}, []);

	useEffect(() => {
		const overlay = document.getElementById(overlayId) as HTMLDivElement | null;
		const id = setTimeout(() => {
			if (overlay) overlay.style.display = "none";
		}, 300);
		return () => clearTimeout(id);
	}, [pathname, searchParams]);

	return (
		<div
			id={overlayId}
			style={{ display: "none" }}
            className="fixed inset-0 z-2000 bg-white flex items-center justify-center"
		>
			<div className="flex flex-col items-center gap-4">
				<Image
					src="/images/logo.svg"
					alt="Excel Connect"
					width={160}
					height={160}
					priority
				/>
			</div>
		</div>
	);
}
