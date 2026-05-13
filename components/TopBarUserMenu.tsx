"use client";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";
import { logout } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

type Props = {
  user?: any;
};

const resolveUserAvatar = (user?: any) => {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const u = String((user?.avatarUrl || user?.avatar) ?? "").trim();
  if (!u) return "/images/avatar.PNG";
  if (u.startsWith("data:")) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/uploads")) return base ? `${base}${u}` : u;
  const cleaned = u.replace(/^\/?uploads\/?/, "");
  return base ? `${base}/uploads/${cleaned}` : `/uploads/${cleaned}`;
};

export default function TopBarUserMenu({ user }: Props) {
  return (
    <div className="flex justify-end w-full items-center gap-6">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 px-4 py-2 bg-[#111827] rounded-xl cursor-pointer hover:bg-[#1F2937] transition-colors">
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              <Image src={resolveUserAvatar(user)} alt="Profile" fill unoptimized className="object-cover" />
            </div>
            <span className="text-sm font-medium text-white">{user?.email || user?.name || "User"}</span>
            <ChevronDown className="h-4 w-4 text-white" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white">
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
