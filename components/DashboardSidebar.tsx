"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserPlus,
  BriefcaseBusiness,
  WalletCards,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Bookings",
    href: "/bookings",
    icon: CalendarDays,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Leads",
    href: "/leads",
    icon: UserPlus,
  },
  {
    name: "Services",
    href: "/services",
    icon: BriefcaseBusiness,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: WalletCards,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside className="hidden w-[250px] shrink-0 border-r border-white/10 bg-[#090d13] p-5 lg:flex lg:flex-col">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-bold text-black">
          B
        </div>

        <div>
          <p className="font-semibold text-white">
            BusinessFlow
          </p>
          <p className="text-xs text-zinc-500">
            Admin Dashboard
          </p>
        </div>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                active
                  ? "bg-emerald-400 font-medium text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
            pathname === "/settings"
              ? "bg-emerald-400 font-medium text-black"
              : "text-zinc-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings size={18} />
          Settings
        </Link>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}