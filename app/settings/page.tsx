"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardSidebar from "@/components/DashboardSidebar";

import {
  Settings,
  Loader2,
  Bell,
  Lock,
  LogOut,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    setEmail(session.user.email ?? "");

    const savedNotificationSetting =
      localStorage.getItem(
        "businessflow_notifications"
      );

    if (savedNotificationSetting !== null) {
      setNotifications(
        savedNotificationSetting === "true"
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadSettings);
    // Account data should load once after the client mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleNotifications() {
    const newValue = !notifications;

    setNotifications(newValue);

    localStorage.setItem(
      "businessflow_notifications",
      String(newValue)
    );
  }

  async function updatePassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);

    const { error } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (error) {
      setError(error.message);
      setSavingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");

    setMessage("Password updated successfully.");
    setSavingPassword(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin text-emerald-400" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-white">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        <main className="min-w-0 flex-1 pt-16 lg:pt-0">
          <header className="border-b border-white/10 px-5 py-5 md:px-8">
            <div className="flex items-center gap-2">
              <Settings
                size={22}
                className="text-emerald-400"
              />

              <div>
                <h1 className="text-2xl font-semibold">
                  Settings
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                  Manage account and dashboard preferences
                </p>
              </div>
            </div>
          </header>

          <div className="max-w-4xl p-5 md:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-400">
                {message}
              </div>
            )}

            {/* ACCOUNT */}
            <section className="rounded-2xl border border-white/10 bg-[#0c1118] p-6">
              <h2 className="text-lg font-semibold">
                Account
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Logged-in administrator
              </p>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-wide text-zinc-600">
                  Email
                </p>

                <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                  {email}
                </div>
              </div>
            </section>

            {/* NOTIFICATIONS */}
            <section className="mt-5 rounded-2xl border border-white/10 bg-[#0c1118] p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
                    <Bell size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Booking Notifications
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Store your notification preference
                    </p>
                  </div>
                </div>

                <button
                  onClick={toggleNotifications}
                  className={`relative h-7 w-12 rounded-full transition ${
                    notifications
                      ? "bg-emerald-400"
                      : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                      notifications
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              <p className="mt-4 text-xs text-zinc-600">
                Notification automation can be connected later.
              </p>
            </section>

            {/* PASSWORD */}
            <section className="mt-5 rounded-2xl border border-white/10 bg-[#0c1118] p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
                  <Lock size={20} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Change Password
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Update your admin account password
                  </p>
                </div>
              </div>

              <form
                onSubmit={updatePassword}
                className="mt-6 grid gap-4 sm:grid-cols-2"
              >
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="New password"
                  className={inputClass}
                />

                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm password"
                  className={inputClass}
                />

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 font-semibold text-black disabled:opacity-50 sm:col-span-2"
                >
                  {savingPassword ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={18} />
                  )}

                  {savingPassword
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </form>
            </section>

            {/* LOGOUT */}
            <section className="mt-5 rounded-2xl border border-red-500/10 bg-[#0c1118] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    Logout
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Sign out of this dashboard
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/15"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

const inputClass =
  "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none";
