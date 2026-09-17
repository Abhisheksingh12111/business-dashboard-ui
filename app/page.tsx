"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

import {
  CalendarDays,
  Users,
  Search,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Clock3,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Loader2,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Booking = {
  id: number;
  customer_name: string | null;
  service: string | null;
  booking_date: string | null;
  booking_time: string | null;
  status: string | null;
  created_at: string;
};

type Customer = {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string | null;
  notes: string | null;
};

type ChartItem = {
  day: string;
  bookings: number;
};

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(0);
 const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [error, setError] = useState("");
const [showNewBooking, setShowNewBooking] = useState(false);
const [showNotifications, setShowNotifications] = useState(false);
const [openBookingMenu, setOpenBookingMenu] = useState<number | null>(null);
const [searchQuery, setSearchQuery] = useState("");
const [chartRange, setChartRange] = useState("7");
const [showSearchResults, setShowSearchResults] = useState(false);
const [savingBooking, setSavingBooking] = useState(false);

const [newBooking, setNewBooking] = useState({
  customer_name: "",
  phone: "",
  email: "",
  service: "",
  booking_date: "",
  booking_time: "",
  source: "Dashboard",
  notes: "",
});
  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const [customerResult, bookingResult] = await Promise.all([
        supabase
          .from("customer")
          .select("id, name, phone, email, source, status, notes"),

        supabase
          .from("bookings")
          .select(
            "id, customer_name, service, booking_date, booking_time, status, created_at"
          )
          .order("created_at", { ascending: false }),
      ]);

      if (customerResult.error) {
        setError(customerResult.error.message);
        setLoading(false);
        return;
      }

      if (bookingResult.error) {
        setError(bookingResult.error.message);
        setLoading(false);
        return;
      }

      const bookingRows = bookingResult.data ?? [];

     setCustomers(customerResult.data ?? []);
setTotalCustomers(customerResult.data?.length ?? 0);
      setBookings(bookingRows);
      setChartData(buildChartData(bookingRows));
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

async function createBooking(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  setSavingBooking(true);
  setError("");

  // 1. Create booking
  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      customer_name: newBooking.customer_name,
      phone: newBooking.phone,
      email: newBooking.email,
      service: newBooking.service,
      booking_date: newBooking.booking_date,
      booking_time: newBooking.booking_time,
      source: newBooking.source,
      notes: newBooking.notes,
      status: "Pending",
    })
    .select(
      "id, customer_name, service, booking_date, booking_time, status, created_at"
    )
    .single();

  if (bookingError) {
    setError(bookingError.message);
    setSavingBooking(false);
    return;
  }

  // 2. Check whether this customer already exists
  const { data: existingCustomers, error: customerCheckError } =
    await supabase.from("customer").select("id, email, phone");

  if (customerCheckError) {
    setError(customerCheckError.message);
    setSavingBooking(false);
    return;
  }

  const email = newBooking.email.trim().toLowerCase();
  const phone = newBooking.phone.replace(/\s/g, "");

  const customerExists = existingCustomers?.some((customer) => {
    const existingEmail = customer.email?.trim().toLowerCase() ?? "";
    const existingPhone = customer.phone?.replace(/\s/g, "") ?? "";

    return (
      (email !== "" && existingEmail === email) ||
      (phone !== "" && existingPhone === phone)
    );
  });

  // 3. If new customer, add them to customer table
  if (!customerExists) {
    const { error: customerInsertError } = await supabase
      .from("customer")
      .insert({
        name: newBooking.customer_name,
        phone: newBooking.phone,
        email: newBooking.email,
        source: newBooking.source,
        status: "New",
        notes: newBooking.notes,
      });

    if (customerInsertError) {
      setError(customerInsertError.message);
      setSavingBooking(false);
      return;
    }

    setTotalCustomers((current) => current + 1);
  }

  // 4. Update dashboard instantly
  const updatedBookings = [bookingData, ...bookings];

  setBookings(updatedBookings);
  setChartData(buildChartData(updatedBookings));

  setNewBooking({
    customer_name: "",
    phone: "",
    email: "",
    service: "",
    booking_date: "",
    booking_time: "",
    source: "Dashboard",
    notes: "",
  });

  setShowNewBooking(false);
  setSavingBooking(false);
}
if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin text-emerald-400" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  const pendingCount = bookings.filter(
    (item) => item.status?.toLowerCase() === "pending"
  ).length;

  const completedCount = bookings.filter(
    (item) => item.status?.toLowerCase() === "completed"
  ).length;

  const recentBookings = bookings.slice(0, 5);
const normalizedSearch = searchQuery.trim().toLowerCase();

const customerSearchResults = normalizedSearch
  ? customers
      .filter((customer) =>
        [
          customer.name,
          customer.phone,
          customer.email,
          customer.source,
          customer.status,
        ].some((value) =>
          value?.toLowerCase().includes(normalizedSearch)
        )
      )
      .slice(0, 4)
  : [];

const bookingSearchResults = normalizedSearch
  ? bookings
      .filter((booking) =>
        [
          booking.customer_name,
          booking.service,
          booking.status,
        ].some((value) =>
          value?.toLowerCase().includes(normalizedSearch)
        )
      )
      .slice(0, 4)
  : [];
  return (
    <div className="min-h-screen bg-[#070a0f] text-white">
      <div className="flex min-h-screen">
     <DashboardSidebar />

        <main className="min-w-0 flex-1 pt-16 lg:pt-0">
          <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 md:px-8">
            <div>
              <h1 className="text-xl font-semibold">Dashboard Overview</h1>
              <p className="text-sm text-zinc-500">
                Monitor your business performance
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 md:flex">
                <Search size={16} className="text-zinc-500" />
                <input
  value={searchQuery}
  onChange={(e) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
  }}
  onFocus={() => setShowSearchResults(true)}
  placeholder="Search..."
  className="w-36 bg-transparent text-sm outline-none placeholder:text-zinc-600"
/>
  {showSearchResults && normalizedSearch && (
  <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0c1118] shadow-2xl">
    <div className="border-b border-white/10 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Search Results
      </p>
    </div>

    {customerSearchResults.length === 0 &&
    bookingSearchResults.length === 0 ? (
      <div className="px-4 py-8 text-center text-sm text-zinc-500">
        No results found
      </div>
    ) : (
      <div className="max-h-[360px] overflow-y-auto">
        {customerSearchResults.length > 0 && (
          <>
            <p className="px-4 pb-2 pt-4 text-xs font-medium text-zinc-600">
              CUSTOMERS
            </p>

            {customerSearchResults.map((customer) => (
              <button
                key={`customer-${customer.id}`}
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchQuery("");
                  router.push("/customers");
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-sm font-medium">
                    {customer.name ?? "Unknown customer"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {customer.email || customer.phone || "No contact"}
                  </p>
                </div>

                <span className="text-xs text-zinc-600">
                  {customer.status ?? "New"}
                </span>
              </button>
            ))}
          </>
        )}

        {bookingSearchResults.length > 0 && (
          <>
            <p className="border-t border-white/[0.06] px-4 pb-2 pt-4 text-xs font-medium text-zinc-600">
              BOOKINGS
            </p>

            {bookingSearchResults.map((booking) => (
              <button
                key={`booking-${booking.id}`}
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchQuery("");
                  router.push("/bookings");
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-sm font-medium">
                    {booking.customer_name ?? "Unknown customer"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {booking.service ?? "No service"}
                  </p>
                </div>

                <span className="text-xs text-zinc-600">
                  {booking.status ?? "Pending"}
                </span>
              </button>
            ))}
          </>
        )}
      </div>
    )}
  </div>
)}            
              </div>

              <div className="relative">
  <button
    onClick={() => setShowNotifications(!showNotifications)}
    className="relative rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
  >
    <Bell size={18} />

    {pendingCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-black">
        {pendingCount}
      </span>
    )}
  </button>

  {showNotifications && (
    <div className="absolute right-0 top-14 z-50 w-[min(340px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0c1118] shadow-2xl">
      <div className="border-b border-white/10 px-4 py-4">
        <p className="font-semibold">Notifications</p>
        <p className="mt-1 text-xs text-zinc-500">
          {pendingCount} pending bookings
        </p>
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {bookings
          .filter(
            (booking) => booking.status?.toLowerCase() === "pending"
          )
          .slice(0, 5)
          .map((booking) => (
            <button
              key={booking.id}
              onClick={() => {
                setShowNotifications(false);
                router.push("/bookings");
              }}
              className="flex w-full items-start gap-3 border-b border-white/[0.06] px-4 py-4 text-left hover:bg-white/[0.03]"
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />

              <div>
                <p className="text-sm font-medium">
                  New booking from {booking.customer_name ?? "Customer"}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {booking.service ?? "Service"} •{" "}
                  {formatDate(booking.booking_date)}
                </p>
              </div>
            </button>
          ))}
      </div>

      <button
        onClick={() => {
          setShowNotifications(false);
          router.push("/bookings");
        }}
        className="w-full px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-white/[0.03]"
      >
        View all bookings
      </button>
    </div>
  )}
</div>
               <button
  onClick={() => setShowNewBooking(true)}
  className="flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2.5 text-sm font-semibold text-black sm:px-4"
>
                <Plus size={16} />
                <span className="hidden sm:inline">New Booking</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </header>

          <div className="p-5 md:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Customers"
                value={totalCustomers.toString()}
                icon={<Users size={20} />}
               href="/customers"
              />

              <StatCard
                title="Total Bookings"
                value={bookings.length.toString()}
                icon={<CalendarDays size={20} />}
             href="/bookings"
             />

              <StatCard
                title="Pending"
                value={pendingCount.toString()}
                icon={<Clock3 size={20} />}
             href="/bookings?status=Pending"
             />

              <StatCard
                title="Completed"
                value={completedCount.toString()}
                icon={<CheckCircle2 size={20} />}
              href="/bookings?status=Completed"
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <section className="rounded-2xl border border-white/10 bg-[#0c1118] p-5">
                <div className="mb-7 flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">Booking Analytics</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Real booking activity
                    </p>
                  </div>

                  <select
  value={chartRange}
  onChange={(e) => {
    setChartRange(e.target.value);
    setChartData(
      buildChartData(bookings, Number(e.target.value))
    );
  }}
  className="rounded-xl border border-white/10 bg-[#111820] px-4 py-2 text-sm text-zinc-300 outline-none"
>
  <option value="7">Last 7 days</option>
  <option value="30">Last 30 days</option>
  <option value="90">Last 90 days</option>
</select>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="bookingGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#34d399"
                            stopOpacity={0.32}
                          />
                          <stop
                            offset="95%"
                            stopColor="#34d399"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                        vertical={false}
                      />

                     <XAxis
  dataKey="day"
  stroke="#71717a"
  tickLine={false}
  axisLine={false}
  interval={chartRange === "7" ? 0 : chartRange === "30" ? 4 : 13}
/>

                      <YAxis
                        allowDecimals={false}
                        stroke="#71717a"
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#111820",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="bookings"
                        stroke="#34d399"
                        strokeWidth={3}
                        fill="url(#bookingGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0c1118] p-5">
                <p className="text-lg font-semibold">Performance</p>
                <p className="mt-1 text-sm text-zinc-500">
                  This month at a glance
                </p>

                <div className="mt-7 rounded-2xl bg-emerald-400 p-5 text-black">
                  <div className="flex items-center justify-between">
                    <TrendingUp size={24} />
                    <ArrowUpRight size={20} />
                  </div>

                  <p className="mt-8 text-sm font-medium opacity-70">
                    Total activity
                  </p>

                  <p className="mt-1 text-4xl font-bold">
                    {bookings.length}
                  </p>

                  <p className="mt-2 text-sm opacity-70">
                    Bookings currently recorded
                  </p>
                </div>

                <div className="mt-5 space-y-5">
                  <Progress
                    label="Pending bookings"
                    value={`${pendingCount}`}
                    width={percentage(pendingCount, bookings.length)}
                  />

                  <Progress
                    label="Completed bookings"
                    value={`${completedCount}`}
                    width={percentage(completedCount, bookings.length)}
                  />

                  <Progress
                    label="Total customers"
                    value={`${totalCustomers}`}
                    width="75%"
                  />
                </div>
              </section>
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1118]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
                <div>
                  <p className="text-lg font-semibold">Recent Bookings</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Live data from Supabase
                  </p>
                </div>

                <Link
  href="/bookings"
  className="text-sm font-medium text-emerald-400"
>
  View all
</Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="text-xs uppercase tracking-wider text-zinc-600">
                    <tr>
                      <th className="px-5 py-4 font-medium">Customer</th>
                      <th className="px-5 py-4 font-medium">Service</th>
                      <th className="px-5 py-4 font-medium">Date</th>
                      <th className="px-5 py-4 font-medium">Time</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {recentBookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-sm text-zinc-500"
                        >
                          No bookings found.
                        </td>
                      </tr>
                    ) : (
                      recentBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-t border-white/[0.06]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                                {booking.customer_name?.charAt(0) ?? "?"}
                              </div>

                              <span className="font-medium">
                                {booking.customer_name ?? "Unknown"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-zinc-400">
                            {booking.service ?? "-"}
                          </td>

                          <td className="px-5 py-4 text-sm text-zinc-400">
                            {formatDate(booking.booking_date)}
                          </td>

                          <td className="px-5 py-4 text-sm text-zinc-400">
                            {formatTime(booking.booking_time)}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={booking.status ?? "Pending"} />
                          </td>

                         <td className="relative px-5 py-4">
  <button
    type="button"
    onClick={() =>
  setOpenBookingMenu(
    openBookingMenu === booking.id ? null : booking.id
  )
}
    className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
  >
    <MoreHorizontal size={18} />
  </button>
{openBookingMenu === booking.id && (
  <div className="absolute right-5 top-12 z-50 w-40 rounded-xl border border-white/10 bg-[#111820] p-1 shadow-2xl">
    <Link
     href={`/bookings?booking=${booking.id}`}
      className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
    >
      Open booking
    </Link>
  </div>
)}
</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    {showNewBooking && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0c1118] p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">New Booking</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Create a new customer booking
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewBooking(false)}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-400"
        >
          Close
        </button>
      </div>

      <form onSubmit={createBooking} className="grid gap-4 sm:grid-cols-2">
        <input
          required
          placeholder="Customer name"
          value={newBooking.customer_name}
          onChange={(e) =>
            setNewBooking({
              ...newBooking,
              customer_name: e.target.value,
            })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <input
          placeholder="Phone"
          value={newBooking.phone}
          onChange={(e) =>
            setNewBooking({ ...newBooking, phone: e.target.value })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <input
          type="email"
          placeholder="Email"
          value={newBooking.email}
          onChange={(e) =>
            setNewBooking({ ...newBooking, email: e.target.value })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <input
          required
          placeholder="Service"
          value={newBooking.service}
          onChange={(e) =>
            setNewBooking({ ...newBooking, service: e.target.value })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <input
          required
          type="date"
          value={newBooking.booking_date}
          onChange={(e) =>
            setNewBooking({
              ...newBooking,
              booking_date: e.target.value,
            })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <input
          required
          type="time"
          value={newBooking.booking_time}
          onChange={(e) =>
            setNewBooking({
              ...newBooking,
              booking_time: e.target.value,
            })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <select
          value={newBooking.source}
          onChange={(e) =>
            setNewBooking({ ...newBooking, source: e.target.value })
          }
          className="rounded-xl border border-white/10 bg-[#111820] px-4 py-3 outline-none"
        >
          <option>Dashboard</option>
          <option>Website</option>
          <option>WhatsApp</option>
          <option>Instagram</option>
          <option>Referral</option>
        </select>

        <input
          placeholder="Notes"
          value={newBooking.notes}
          onChange={(e) =>
            setNewBooking({ ...newBooking, notes: e.target.value })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
        />

        <button
          disabled={savingBooking}
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 font-semibold text-black disabled:opacity-50 sm:col-span-2"
        >
          {savingBooking && <Loader2 size={18} className="animate-spin" />}
          {savingBooking ? "Saving..." : "Save Booking"}
        </button>
      </form>
    </div>
  </div>
)}
    </div>
  );
}

function buildChartData(bookings: Booking[], range = 7): ChartItem[] {
  const days: ChartItem[] = [];

  for (let i = range - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const dateString = date.toISOString().split("T")[0];

    const count = bookings.filter(
      (booking) => booking.booking_date === dateString
    ).length;

    days.push({
     day: date.toLocaleDateString("en-US", {
  day: "2-digit",
  month: "short",
}),
      bookings: count,
    });
  }

  return days;
}

function percentage(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function formatDate(date: string | null) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string | null) {
  if (!time) return "-";

  const [hourString, minute] = time.split(":");
  const hour = Number(hourString);

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
}) {
  const card = (
    <div className="rounded-2xl border border-white/10 bg-[#0c1118] p-5 transition hover:border-white/20 hover:bg-white/[0.03]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
          {icon}
        </div>
      </div>

      {href && (
        <div className="mt-5 flex items-center justify-end text-emerald-400">
          <ArrowUpRight size={18} />
        </div>
      )}
    </div>
  );

  if (!href) return card;

  return (
    <Link href={href}>
      {card}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "completed"
      ? "bg-emerald-400/10 text-emerald-400"
      : normalized === "confirmed"
        ? "bg-sky-400/10 text-sky-400"
        : "bg-amber-400/10 text-amber-400";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}
function Progress({
  label,
  value,
  width,
}: {
  label: string;
  value: string | number;
  width: string | number;
}) {
  const normalizedWidth =
    typeof width === "number"
      ? `${Math.min(Math.max(width, 0), 100)}%`
      : width;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: normalizedWidth }}
        />
      </div>
    </div>
  );
}
