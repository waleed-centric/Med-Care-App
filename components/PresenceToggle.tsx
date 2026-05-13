"use client";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { updateOnlineStatus } from "@/hooks/auth";
import { getProfile } from "@/hooks/profile";

export default function PresenceToggle() {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const override = typeof window !== "undefined" ? window.localStorage.getItem("presence_override") : null;
        if (override === "true" || override === "false") {
          setChecked(override === "true");
          await updateOnlineStatus(override === "true");
          return;
        }
        const profile = await getProfile();
        if (!mounted) return;
        const onlineFlag = !!profile?.isOnline;
        setChecked(onlineFlag);
      } catch {}
    };
    init();
    return () => { mounted = false; };
  }, []);

  const onChange = async (val: boolean) => {
    setChecked(val);
    setLoading(true);
    try {
      await updateOnlineStatus(val);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("presence_override", val ? "true" : "false");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border ${
        checked ? "bg-green-50 border-green-300 text-green-700" : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      <span className="text-sm font-semibold">{checked ? "You are Active" : "You are InActive"}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={loading} />
    </div>
  );
}

