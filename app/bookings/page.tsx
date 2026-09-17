"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardSidebar from "@/components/DashboardSidebar";

import {
  Search,
  Loader2,
  CalendarDays,
Pencil,
X,
} from "lucide-react";

type Booking = {
  id: number;
  customer_name: string | null;
  service: string | null;
  booking_date: string | null;
  booking_time: string | null;
  status: string | null;
  created_at: string;
};

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-white">
          <div className="flex items-center gap-3 text-zinc-400">
            <Loader2 className="animate-spin text-emerald-400" />
            Loading bookings...
          </div>
        </div>
      }
    >
      <BookingsPageContent />
    </Suspense>
  );
}

function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const statusFilter = searchParams.get("status");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  async function loadBookings() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, customer_name, service, booking_date, booking_time, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setBookings(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadBookings);
    // Dashboard data should load once after the client mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    setError("");

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setUpdatingId(null);
      return;
    }

    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? { ...booking, status }
          : booking
      )
    );

    setUpdatingId(null);
  }
async function saveBookingChanges() {
  if (!editingBooking) return;

  setUpdatingId(editingBooking.id);
  setError("");

  const { error } = await supabase
    .from("bookings")
    .update({
      customer_name: editingBooking.customer_name,
      service: editingBooking.service,
      booking_date: editingBooking.booking_date,
      booking_time: editingBooking.booking_time,
      status: editingBooking.status,
    })
    .eq("id", editingBooking.id);

  if (error) {
    setError(error.message);
    setUpdatingId(null);
    return;
  }

  setBookings((current) =>
    current.map((booking) =>
      booking.id === editingBooking.id
        ? editingBooking
        : booking
    )
  );

  setEditingBooking(null);
  setUpdatingId(null);
}
  const filteredBookings = useMemo(() => {
   if (bookingId) {
  return bookings.filter(
    (booking) => String(booking.id) === bookingId
  );
}
   if (statusFilter) {
  return bookings.filter(
    (booking) =>
      booking.status?.toLowerCase() ===
      statusFilter.toLowerCase()
  );
}
const query = search.trim().toLowerCase();

    if (!query) return bookings;

    return bookings.filter((booking) =>
      [
        booking.customer_name,
        booking.service,
        booking.status,
        booking.booking_date,
      ].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
 }, [bookings, search, bookingId, statusFilter]);
  const pending = bookings.filter(
    (booking) =>
      booking.status?.toLowerCase() === "pending"
  ).length;

  const confirmed = bookings.filter(
    (booking) =>
      booking.status?.toLowerCase() === "confirmed"
  ).length;

  const completed = bookings.filter(
    (booking) =>
      booking.status?.toLowerCase() === "completed"
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin text-emerald-400" />
          Loading bookings...
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={22}
                    className="text-emerald-400"
                  />

                  <h1 className="text-2xl font-semibold">
                    Bookings
                  </h1>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  Manage customer bookings and status
                </p>
              </div>

              <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 sm:w-[300px]">
                <Search
                  size={17}
                  className="text-zinc-500"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search bookings..."
                  className="w-full bg-transparent py-3 text-sm outline-none"
                />
              </div>
            </div>
          </header>

          <div className="p-5 md:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                title="Total Bookings"
                value={bookings.length}
              />

              <Stat
                title="Pending"
                value={pending}
              />

              <Stat
                title="Confirmed"
                value={confirmed}
              />

              <Stat
                title="Completed"
                value={completed}
              />
            </div>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c1118]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-zinc-600">
                      <th className="px-5 py-4">
                        Customer
                      </th>

                      <th className="px-5 py-4">
                        Service
                      </th>

                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4">
                        Time
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>
                    <th className="px-5 py-4">
  Action
</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-14 text-center text-sm text-zinc-500"
                        >
                          No bookings found.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map(
                        (booking) => (
                          <tr
                            key={booking.id}
                            className="border-t border-white/[0.06]"
                          >
                            <td className="px-5 py-4">
                              <p className="font-medium">
                                {booking.customer_name ||
                                  "-"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-zinc-400">
                              {booking.service || "-"}
                            </td>

                            <td className="px-5 py-4 text-sm text-zinc-400">
                              {booking.booking_date ||
                                "-"}
                            </td>

                            <td className="px-5 py-4 text-sm text-zinc-400">
                              {booking.booking_time ||
                                "-"}
                            </td>

                            <td className="px-5 py-4">
                              <select
                                value={
                                  booking.status ??
                                  "Pending"
                                }
                                disabled={
                                  updatingId ===
                                  booking.id
                                }
                                onChange={(e) =>
                                  updateStatus(
                                    booking.id,
                                    e.target.value
                                  )
                                }
                                className={`rounded-lg border px-3 py-2 text-xs font-medium outline-none ${statusStyle(
                                  booking.status ??
                                    "Pending"
                                )}`}
                              >
                                <option
                                  value="Pending"
                                  className="bg-[#111820]"
                                >
                                  Pending
                                </option>

                                <option
                                  value="Confirmed"
                                  className="bg-[#111820]"
                                >
                                  Confirmed
                                </option>

                                <option
                                  value="Completed"
                                  className="bg-[#111820]"
                                >
                                  Completed
                                </option>
                              </select>
                            </td>
                          <td className="px-5 py-4">
  <button
    type="button"
    onClick={() => setEditingBooking(booking)}
    className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
  >
    <Pencil size={15} />
    Edit
  </button>
</td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
       {editingBooking && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0c1118] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Edit Booking
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Update booking details
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditingBooking(null)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          value={editingBooking.customer_name ?? ""}
          onChange={(e) =>
            setEditingBooking({
              ...editingBooking,
              customer_name: e.target.value,
            })
          }
          placeholder="Customer name"
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <input
          value={editingBooking.service ?? ""}
          onChange={(e) =>
            setEditingBooking({
              ...editingBooking,
              service: e.target.value,
            })
          }
          placeholder="Service"
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <input
          type="date"
          value={editingBooking.booking_date ?? ""}
          onChange={(e) =>
            setEditingBooking({
              ...editingBooking,
              booking_date: e.target.value,
            })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <input
          type="time"
          value={editingBooking.booking_time ?? ""}
          onChange={(e) =>
            setEditingBooking({
              ...editingBooking,
              booking_time: e.target.value,
            })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <select
          value={editingBooking.status ?? "Pending"}
          onChange={(e) =>
            setEditingBooking({
              ...editingBooking,
              status: e.target.value,
            })
          }
          className="rounded-xl border border-white/10 bg-[#111820] px-4 py-3 outline-none sm:col-span-2"
        >
          <option>Pending</option>
          <option>Confirmed</option>
          <option>Completed</option>
        </select>

        <button
          type="button"
          onClick={saveBookingChanges}
          disabled={updatingId === editingBooking.id}
          className="rounded-xl bg-emerald-400 py-3 font-semibold text-black disabled:opacity-50 sm:col-span-2"
        >
          {updatingId === editingBooking.id
            ? "Saving..."
            : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
)}
        </main>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1118] p-5">
      <p className="text-sm text-zinc-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";

    case "confirmed":
      return "border-blue-400/20 bg-blue-400/10 text-blue-400";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-400";
  }
}
