"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

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
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const navigationItems = (
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
            onClick={() => setMobileMenuOpen(false)}
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
  );

  const footerItems = (
    <div className="mt-auto space-y-2 pt-6">
      <Link
        href="/settings"
        onClick={() => setMobileMenuOpen(false)}
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
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#090d13]/95 px-4 backdrop-blur lg:hidden">
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 font-bold text-black">
            B
          </div>
          <div>
            <p className="text-sm font-semibold text-white">BusinessFlow</p>
            <p className="text-[11px] text-zinc-500">Admin Dashboard</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-zinc-200"
        >
          <Menu size={20} />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <aside className="relative flex h-full w-[min(82vw,300px)] flex-col border-r border-white/10 bg-[#090d13] p-5 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-bold text-black">
                  B
                </div>
                <div>
                  <p className="font-semibold text-white">BusinessFlow</p>
                  <p className="text-xs text-zinc-500">Admin Dashboard</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-xl border border-white/10 p-2 text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            {navigationItems}
            {footerItems}
          </aside>
        </div>
      )}

      <aside className="hidden w-[250px] shrink-0 border-r border-white/10 bg-[#090d13] p-5 lg:flex lg:flex-col">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-bold text-black">
            B
          </div>

          <div>
            <p className="font-semibold text-white">BusinessFlow</p>
            <p className="text-xs text-zinc-500">Admin Dashboard</p>
          </div>
        </div>

        {navigationItems}
        {footerItems}
      </aside>
    </>
  );
}
