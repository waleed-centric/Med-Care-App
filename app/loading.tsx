import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-2000 bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Image src="/images/logo.svg" alt="Excel Connect" width={80} height={80} priority />
        <span className="text-xl font-semibold text-[#111827]">Excel Connect</span>
      </div>
    </div>
  );
}
