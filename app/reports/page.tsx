"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardSidebar from "@/components/DashboardSidebar";

import {
  Loader2,
  BarChart3,
  TrendingUp,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type Booking = {
  id: number;
  service: string | null;
  status: string | null;
  booking_date: string | null;
  created_at: string;
};

type Lead = {
  id: number;
  status: string | null;
  potential_value: number | null;
  created_at: string;
};

type Payment = {
  id: number;
  amount: number | null;
  payment_date: string | null;
  payment_method: string | null;
  status: string | null;
  service: string | null;
  created_at: string;
};

type Service = {
  id: number;
  name: string | null;
  status: string | null;
  bookings_count: number | null;
};

export default function ReportsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customerCount, setCustomerCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const [
      bookingsResult,
      customersResult,
      leadsResult,
      servicesResult,
      paymentsResult,
    ] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, service, status, booking_date, created_at"
        ),

      supabase
        .from("customer")
        .select("id", {
          count: "exact",
        }),

      supabase
        .from("leads")
        .select(
          "id, status, potential_value, created_at"
        ),

      supabase
        .from("services")
        .select(
          "id, name, status, bookings_count"
        ),

      supabase
        .from("payments")
        .select(
          "id, amount, payment_date, payment_method, status, service, created_at"
        ),
    ]);

    const firstError =
      bookingsResult.error ||
      customersResult.error ||
      leadsResult.error ||
      servicesResult.error ||
      paymentsResult.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setBookings(bookingsResult.data ?? []);
    setCustomerCount(
      customersResult.count ?? 0
    );
    setLeads(leadsResult.data ?? []);
    setServices(servicesResult.data ?? []);
    setPayments(paymentsResult.data ?? []);

    setLoading(false);
  }

  const paidPayments = useMemo(() => {
    return payments.filter(
      (payment) =>
        payment.status?.toLowerCase() ===
        "paid"
    );
  }, [payments]);

  const totalRevenue = paidPayments.reduce(
    (total, payment) =>
      total + (payment.amount ?? 0),
    0
  );

  const pendingRevenue = payments
    .filter(
      (payment) =>
        payment.status?.toLowerCase() ===
        "pending"
    )
    .reduce(
      (total, payment) =>
        total + (payment.amount ?? 0),
      0
    );

  const refundedRevenue = payments
    .filter(
      (payment) =>
        payment.status?.toLowerCase() ===
        "refunded"
    )
    .reduce(
      (total, payment) =>
        total + (payment.amount ?? 0),
      0
    );

  const currentMonthRevenue =
    paidPayments
      .filter((payment) => {
        const value =
          payment.payment_date ||
          payment.created_at;

        if (!value) return false;

        const paymentDate = new Date(value);
        const now = new Date();

        return (
          paymentDate.getMonth() ===
            now.getMonth() &&
          paymentDate.getFullYear() ===
            now.getFullYear()
        );
      })
      .reduce(
        (total, payment) =>
          total + (payment.amount ?? 0),
        0
      );

  const wonLeads = leads.filter(
    (lead) =>
      lead.status?.toLowerCase() === "won"
  ).length;

  const leadConversion =
    leads.length > 0
      ? Math.round(
          (wonLeads / leads.length) * 100
        )
      : 0;

  const completedBookings =
    bookings.filter(
      (booking) =>
        booking.status?.toLowerCase() ===
        "completed"
    ).length;

  const pendingBookings =
    bookings.filter(
      (booking) =>
        booking.status?.toLowerCase() ===
        "pending"
    ).length;

  const activeServices =
    services.filter(
      (service) =>
        service.status?.toLowerCase() ===
        "active"
    ).length;

  const potentialPipeline = leads
    .filter(
      (lead) =>
        lead.status?.toLowerCase() !==
          "lost" &&
        lead.status?.toLowerCase() !==
          "won"
    )
    .reduce(
      (total, lead) =>
        total +
        (lead.potential_value ?? 0),
      0
    );

  const revenueChart = useMemo(() => {
    const now = new Date();

    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        name: date.toLocaleString(
          "en-US",
          {
            month: "short",
          }
        ),
        revenue: 0,
      });
    }

    paidPayments.forEach((payment) => {
      const value =
        payment.payment_date ||
        payment.created_at;

      if (!value) return;

      const date = new Date(value);

      const month = months.find(
        (item) =>
          item.month === date.getMonth() &&
          item.year ===
            date.getFullYear()
      );

      if (month) {
        month.revenue +=
          payment.amount ?? 0;
      }
    });

    return months;
  }, [paidPayments]);

  const serviceChart = useMemo(() => {
    const counts: Record<
      string,
      number
    > = {};

    bookings.forEach((booking) => {
      const name =
        booking.service?.trim();

      if (!name) return;

      counts[name] =
        (counts[name] ?? 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, bookingCount]) => ({
        name,
        bookings: bookingCount,
      }))
      .sort(
        (a, b) =>
          b.bookings - a.bookings
      )
      .slice(0, 5);
  }, [bookings]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin text-emerald-400" />
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-white">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        <main className="min-w-0 flex-1">
          <header className="border-b border-white/10 px-5 py-5 md:px-8">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3
                  size={22}
                  className="text-emerald-400"
                />

                <h1 className="text-2xl font-semibold">
                  Reports & Analytics
                </h1>
              </div>

              <p className="mt-1 text-sm text-zinc-500">
                Automatic business
                performance insights
              </p>
            </div>
          </header>

          <div className="p-5 md:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* MAIN STATS */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                title="Total Revenue"
                value={`₹${totalRevenue.toLocaleString(
                  "en-IN"
                )}`}
              />

              <Stat
                title="This Month"
                value={`₹${currentMonthRevenue.toLocaleString(
                  "en-IN"
                )}`}
              />

              <Stat
                title="Total Bookings"
                value={bookings.length}
              />

              <Stat
                title="Lead Conversion"
                value={`${leadConversion}%`}
              />
            </div>

            {/* CHARTS */}
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#0c1118] p-5">
                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      size={18}
                      className="text-emerald-400"
                    />

                    <h2 className="font-semibold">
                      Revenue Trend
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    Last 6 months paid revenue
                  </p>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={revenueChart}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff0d"
                      />

                      <XAxis
                        dataKey="name"
                        stroke="#71717a"
                        fontSize={12}
                      />

                      <YAxis
                        stroke="#71717a"
                        fontSize={12}
                      />

                      <Tooltip
                        contentStyle={{
                          background:
                            "#111820",
                          border:
                            "1px solid rgba(255,255,255,0.1)",
                          borderRadius:
                            "12px",
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#34d399"
                        fill="#34d399"
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0c1118] p-5">
                <div className="mb-5">
                  <h2 className="font-semibold">
                    Top Services
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Based on total bookings
                  </p>
                </div>

                <div className="h-[300px]">
                  {serviceChart.length ===
                  0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                      No booking data yet.
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={serviceChart}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff0d"
                        />

                        <XAxis
                          dataKey="name"
                          stroke="#71717a"
                          fontSize={11}
                        />

                        <YAxis
                          stroke="#71717a"
                          fontSize={12}
                          allowDecimals={false}
                        />

                        <Tooltip
                          contentStyle={{
                            background:
                              "#111820",
                            border:
                              "1px solid rgba(255,255,255,0.1)",
                            borderRadius:
                              "12px",
                          }}
                        />

                        <Bar
                          dataKey="bookings"
                          fill="#34d399"
                          radius={[
                            6, 6, 0, 0,
                          ]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* SNAPSHOT */}
            <div className="mt-6">
              <h2 className="mb-4 text-lg font-semibold">
                Business Snapshot
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SmallStat
                  title="Customers"
                  value={customerCount}
                />

                <SmallStat
                  title="Active Services"
                  value={activeServices}
                />

                <SmallStat
                  title="Completed Bookings"
                  value={completedBookings}
                />

                <SmallStat
                  title="Pending Bookings"
                  value={pendingBookings}
                />

                <SmallStat
                  title="Pending Revenue"
                  value={`₹${pendingRevenue.toLocaleString(
                    "en-IN"
                  )}`}
                />

                <SmallStat
                  title="Refunded"
                  value={`₹${refundedRevenue.toLocaleString(
                    "en-IN"
                  )}`}
                />

                <SmallStat
                  title="Won Leads"
                  value={wonLeads}
                />

                <SmallStat
                  title="Pipeline Value"
                  value={`₹${potentialPipeline.toLocaleString(
                    "en-IN"
                  )}`}
                />
              </div>
            </div>
          </div>
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
  value: string | number;
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

function SmallStat({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1118] p-5">
      <p className="text-xs uppercase tracking-wide text-zinc-600">
        {title}
      </p>

      <p className="mt-2 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}