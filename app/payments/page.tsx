"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardSidebar from "@/components/DashboardSidebar";

import {
  Search,
  Loader2,
  WalletCards,
  Plus,
  X,
} from "lucide-react";

type Payment = {
  id: number;
  created_at: string;
  customer_name: string | null;
  service: string | null;
  amount: number | null;
  payment_date: string | null;
  payment_method: string | null;
  status: string | null;
  reference: string | null;
  notes: string | null;
};

export default function PaymentsPage() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [newPayment, setNewPayment] = useState({
    customer_name: "",
    service: "",
    amount: "",
    payment_date: "",
    payment_method: "UPI",
    status: "Pending",
    reference: "",
    notes: "",
  });

  async function loadPayments() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setPayments(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadPayments);
    // Dashboard data should load once after the client mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createPayment(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSavingPayment(true);
    setError("");

    const { data, error } = await supabase
      .from("payments")
      .insert({
        customer_name: newPayment.customer_name,
        service: newPayment.service,
        amount: Number(newPayment.amount),
        payment_date: newPayment.payment_date || null,
        payment_method: newPayment.payment_method,
        status: newPayment.status,
        reference: newPayment.reference,
        notes: newPayment.notes,
      })
      .select("*")
      .single();

    if (error) {
      setError(error.message);
      setSavingPayment(false);
      return;
    }

    setPayments((current) => [data, ...current]);

    setNewPayment({
      customer_name: "",
      service: "",
      amount: "",
      payment_date: "",
      payment_method: "UPI",
      status: "Pending",
      reference: "",
      notes: "",
    });

    setShowAddPayment(false);
    setSavingPayment(false);
  }

  async function updateStatus(
    id: number,
    status: string
  ) {
    setUpdatingId(id);
    setError("");

    const { error } = await supabase
      .from("payments")
      .update({ status })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setUpdatingId(null);
      return;
    }

    setPayments((current) =>
      current.map((payment) =>
        payment.id === id
          ? { ...payment, status }
          : payment
      )
    );

    setUpdatingId(null);
  }
async function savePayment(payment: Payment) {
  setUpdatingId(payment.id);
  setError("");

  const { error } = await supabase
    .from("payments")
    .update({
      customer_name: payment.customer_name,
      service: payment.service,
      amount: payment.amount,
      payment_date: payment.payment_date || null,
      payment_method: payment.payment_method,
      status: payment.status,
      reference: payment.reference,
      notes: payment.notes,
    })
    .eq("id", payment.id);

  if (error) {
    setError(error.message);
    setUpdatingId(null);
    return;
  }

  setUpdatingId(null);
}
  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return payments;

    return payments.filter((payment) =>
      [
        payment.customer_name,
        payment.service,
        payment.payment_method,
        payment.status,
        payment.reference,
      ].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [payments, search]);

  const paidRevenue = payments
    .filter(
      (payment) =>
        payment.status?.toLowerCase() === "paid"
    )
    .reduce(
      (total, payment) =>
        total + (payment.amount ?? 0),
      0
    );

  const pendingAmount = payments
    .filter(
      (payment) =>
        payment.status?.toLowerCase() === "pending"
    )
    .reduce(
      (total, payment) =>
        total + (payment.amount ?? 0),
      0
    );

  const refundedAmount = payments
    .filter(
      (payment) =>
        payment.status?.toLowerCase() === "refunded"
    )
    .reduce(
      (total, payment) =>
        total + (payment.amount ?? 0),
      0
    );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin text-emerald-400" />
          Loading payments...
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
                  <WalletCards
                    size={22}
                    className="text-emerald-400"
                  />

                  <h1 className="text-2xl font-semibold">
                    Payments & Revenue
                  </h1>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  Track revenue, pending payments and transactions
                </p>
              </div>

              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap">
                <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 sm:w-[280px]">
                  <Search
                    size={17}
                    className="text-zinc-500"
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search payments..."
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />
                </div>

                <button
                  onClick={() =>
                    setShowAddPayment(true)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black sm:w-auto"
                >
                  <Plus size={17} />
                  Add Payment
                </button>
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
                title="Transactions"
                value={payments.length}
              />

              <Stat
                title="Paid Revenue"
                value={`₹${paidRevenue.toLocaleString(
                  "en-IN"
                )}`}
              />

              <Stat
                title="Pending"
                value={`₹${pendingAmount.toLocaleString(
                  "en-IN"
                )}`}
              />

              <Stat
                title="Refunded"
                value={`₹${refundedAmount.toLocaleString(
                  "en-IN"
                )}`}
              />
            </div>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c1118]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-zinc-600">
                      <th className="px-5 py-4">
                        Customer
                      </th>

                      <th className="px-5 py-4">
                        Service
                      </th>

                      <th className="px-5 py-4">
                        Amount
                      </th>

                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4">
                        Method
                      </th>

                      <th className="px-5 py-4">
                        Reference
                      </th>
<th className="px-5 py-4">
  Notes
</th>
         <th className="px-5 py-4">
  Actions
</th>             
                      <th className="px-5 py-4">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-14 text-center text-sm text-zinc-500"
                        >
                          No payments found.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map(
                        (payment) => (
                          <tr
                            key={payment.id}
                            className="border-t border-white/[0.06]"
                          >
                            <td className="px-5 py-4">
  <input
    value={payment.customer_name ?? ""}
    onChange={(e) =>
      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id
            ? { ...item, customer_name: e.target.value }
            : item
        )
      )
    }
    placeholder="Customer name"
    className="w-full bg-transparent font-medium outline-none"
  />
</td>

                            <td className="px-5 py-4">
  <input
    value={payment.service ?? ""}
    onChange={(e) =>
      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id
            ? { ...item, service: e.target.value }
            : item
        )
      )
    }
    placeholder="Service"
    className="w-full bg-transparent text-sm text-zinc-400 outline-none"
  />
</td>

                            <td className="px-5 py-4">
  <div className="flex items-center gap-1">
    <span className="text-zinc-500">₹</span>

    <input
      type="number"
      value={payment.amount ?? 0}
      onChange={(e) =>
        setPayments((current) =>
          current.map((item) =>
            item.id === payment.id
              ? {
                  ...item,
                  amount: Number(e.target.value) || 0,
                }
              : item
          )
        )
      }
      className="w-[110px] bg-transparent font-semibold outline-none"
    />
  </div>
</td>

                            <td className="px-5 py-4">
  <input
    type="date"
    value={payment.payment_date ?? ""}
    onChange={(e) =>
      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id
            ? {
                ...item,
                payment_date: e.target.value,
              }
            : item
        )
      )
    }
    className="bg-transparent text-sm text-zinc-400 outline-none"
  />
</td>

                           <td className="px-5 py-4">
  <input
    value={payment.payment_method ?? ""}
    onChange={(e) =>
      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id
            ? {
                ...item,
                payment_method: e.target.value,
              }
            : item
        )
      )
    }
    placeholder="Payment method"
    className="w-full bg-transparent text-sm text-zinc-400 outline-none"
  />
</td>

                           <td className="px-5 py-4">
  <input
    value={payment.reference ?? ""}
    onChange={(e) =>
      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id
            ? {
                ...item,
                reference: e.target.value,
              }
            : item
        )
      )
    }
    placeholder="Reference"
    className="w-full bg-transparent text-sm text-zinc-400 outline-none"
  />
</td>
<td className="px-5 py-4">
  <textarea
    value={payment.notes ?? ""}
    onChange={(e) =>
      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id
            ? {
                ...item,
                notes: e.target.value,
              }
            : item
        )
      )
    }
    placeholder="Notes"
    rows={1}
    className="min-w-[160px] resize-none bg-transparent text-sm text-zinc-400 outline-none"
  />
</td>
 <td className="px-5 py-4">
  <button
    type="button"
    onClick={() => savePayment(payment)}
    disabled={updatingId === payment.id}
    className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
  >
    {updatingId === payment.id ? "Saving..." : "Save"}
  </button>
</td>                           
                            <td className="px-5 py-4">
                              <select
                                value={
                                  payment.status ??
                                  "Pending"
                                }
                                disabled={
                                  updatingId ===
                                  payment.id
                                }
                                onChange={(e) =>
                                  updateStatus(
                                    payment.id,
                                    e.target.value
                                  )
                                }
                                className={`rounded-lg border px-3 py-2 text-xs font-medium outline-none ${statusStyle(
                                  payment.status ??
                                    "Pending"
                                )}`}
                              >
                                <option
                                  className="bg-[#111820]"
                                  value="Pending"
                                >
                                  Pending
                                </option>

                                <option
                                  className="bg-[#111820]"
                                  value="Paid"
                                >
                                  Paid
                                </option>

                                <option
                                  className="bg-[#111820]"
                                  value="Refunded"
                                >
                                  Refunded
                                </option>
                              </select>
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
        </main>
      </div>

      {showAddPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0c1118] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Add Payment
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Add an offline or manually received payment
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddPayment(false)
                }
                className="rounded-lg border border-white/10 p-2 text-zinc-400"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={createPayment}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Input
                required
                placeholder="Customer name"
                value={newPayment.customer_name}
                onChange={(value) =>
                  setNewPayment({
                    ...newPayment,
                    customer_name: value,
                  })
                }
              />

              <Input
                placeholder="Service"
                value={newPayment.service}
                onChange={(value) =>
                  setNewPayment({
                    ...newPayment,
                    service: value,
                  })
                }
              />

              <Input
                type="number"
                required
                placeholder="Amount"
                value={newPayment.amount}
                onChange={(value) =>
                  setNewPayment({
                    ...newPayment,
                    amount: value,
                  })
                }
              />

              <input
                required
                type="date"
                value={newPayment.payment_date}
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    payment_date:
                      e.target.value,
                  })
                }
                className={inputClass}
              />

              <select
                value={newPayment.payment_method}
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    payment_method:
                      e.target.value,
                  })
                }
                className="rounded-xl border border-white/10 bg-[#111820] px-4 py-3 outline-none"
              >
                <option>UPI</option>
                <option>Cash</option>
                <option>Card</option>
                <option>Bank Transfer</option>
                <option>Other</option>
              </select>

              <select
                value={newPayment.status}
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    status: e.target.value,
                  })
                }
                className="rounded-xl border border-white/10 bg-[#111820] px-4 py-3 outline-none"
              >
                <option>Pending</option>
                <option>Paid</option>
                <option>Refunded</option>
              </select>

              <Input
                placeholder="Reference / Transaction ID"
                value={newPayment.reference}
                onChange={(value) =>
                  setNewPayment({
                    ...newPayment,
                    reference: value,
                  })
                }
              />

              <Input
                placeholder="Notes"
                value={newPayment.notes}
                onChange={(value) =>
                  setNewPayment({
                    ...newPayment,
                    notes: value,
                  })
                }
              />

              <button
                type="submit"
                disabled={savingPayment}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 font-semibold text-black disabled:opacity-50 sm:col-span-2"
              >
                {savingPayment && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                )}

                {savingPayment
                  ? "Saving..."
                  : "Save Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none";

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

function Input({
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className={inputClass}
    />
  );
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";

    case "refunded":
      return "border-red-400/20 bg-red-400/10 text-red-400";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-400";
  }
}
