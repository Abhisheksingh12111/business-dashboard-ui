"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardSidebar from "@/components/DashboardSidebar";

import {
  Search,
  Loader2,
  Users,
  Save,
Pencil,
X,
} from "lucide-react";

type Customer = {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string | null;
  notes: string | null;
};

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("customer")
      .select("id, name, phone, email, source, status, notes")
      .order("id", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setCustomers(data ?? []);
    setLoading(false);
  }

  function updateLocalCustomer(
    id: number,
    changes: Partial<Customer>
  ) {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id
          ? { ...customer, ...changes }
          : customer
      )
    );
  }

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    setError("");

    const { error } = await supabase
      .from("customer")
      .update({ status })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setUpdatingId(null);
      return;
    }

    updateLocalCustomer(id, { status });
    setUpdatingId(null);
  }

  async function saveNotes(customer: Customer) {
    setUpdatingId(customer.id);
    setError("");

    const { error } = await supabase
      .from("customer")
      .update({
        notes: customer.notes,
      })
      .eq("id", customer.id);

    if (error) {
      setError(error.message);
    }

    setUpdatingId(null);
  }
async function saveCustomerChanges() {
  if (!editingCustomer) return;

  setUpdatingId(editingCustomer.id);
  setError("");

  const { error } = await supabase
    .from("customer")
    .update({
      name: editingCustomer.name,
      phone: editingCustomer.phone,
      email: editingCustomer.email,
      source: editingCustomer.source,
      status: editingCustomer.status,
      notes: editingCustomer.notes,
    })
    .eq("id", editingCustomer.id);

  if (error) {
    setError(error.message);
    setUpdatingId(null);
    return;
  }

  setCustomers((current) =>
    current.map((customer) =>
      customer.id === editingCustomer.id
        ? editingCustomer
        : customer
    )
  );

  setEditingCustomer(null);
  setUpdatingId(null);
}
  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.email,
        customer.source,
        customer.status,
      ].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [customers, search]);

  const newCustomers = customers.filter(
    (customer) =>
      customer.status?.toLowerCase() === "new"
  ).length;

  const qualifiedCustomers = customers.filter(
    (customer) =>
      customer.status?.toLowerCase() === "qualified"
  ).length;

  const convertedCustomers = customers.filter(
    (customer) =>
      customer.status?.toLowerCase() === "converted"
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin text-emerald-400" />
          Loading customers...
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users
                    size={22}
                    className="text-emerald-400"
                  />

                  <h1 className="text-2xl font-semibold">
                    Customers
                  </h1>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  Manage customer details, status and notes
                </p>
              </div>

              <div className="flex w-[300px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4">
                <Search
                  size={17}
                  className="text-zinc-500"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search customers..."
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
                title="Total Customers"
                value={customers.length}
              />

              <Stat
                title="New"
                value={newCustomers}
              />

              <Stat
                title="Qualified"
                value={qualifiedCustomers}
              />

              <Stat
                title="Converted"
                value={convertedCustomers}
              />
            </div>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c1118]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-zinc-600">
                      <th className="px-5 py-4">
                        Customer
                      </th>

                      <th className="px-5 py-4">
                        Contact
                      </th>

                      <th className="px-5 py-4">
                        Source
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Notes
                      </th>

                      <th className="px-5 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-14 text-center text-sm text-zinc-500"
                        >
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map(
                        (customer) => (
                          <tr
                            key={customer.id}
                            className="border-t border-white/[0.06] align-top"
                          >
                            <td className="px-5 py-4">
                              <p className="font-medium">
                                {customer.name || "-"}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500">
                                Customer #{customer.id}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm text-zinc-300">
                                {customer.phone || "-"}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500">
                                {customer.email || "-"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-zinc-400">
                              {customer.source || "-"}
                            </td>

                            <td className="px-5 py-4">
                              <select
                                value={
                                  customer.status ?? "New"
                                }
                                disabled={
                                  updatingId === customer.id
                                }
                                onChange={(e) =>
                                  updateStatus(
                                    customer.id,
                                    e.target.value
                                  )
                                }
                                className={`rounded-lg border px-3 py-2 text-xs font-medium outline-none ${statusStyle(
                                  customer.status ?? "New"
                                )}`}
                              >
                                <option
                                  className="bg-[#111820]"
                                  value="New"
                                >
                                  New
                                </option>

                                <option
                                  className="bg-[#111820]"
                                  value="Contacted"
                                >
                                  Contacted
                                </option>

                                <option
                                  className="bg-[#111820]"
                                  value="Qualified"
                                >
                                  Qualified
                                </option>

                                <option
                                  className="bg-[#111820]"
                                  value="Converted"
                                >
                                  Converted
                                </option>
                              </select>
                            </td>

                            <td className="px-5 py-4">
                              <textarea
                                rows={2}
                                value={customer.notes ?? ""}
                                onChange={(e) =>
                                  updateLocalCustomer(
                                    customer.id,
                                    {
                                      notes: e.target.value,
                                    }
                                  )
                                }
                                placeholder="Add notes..."
                                className="w-[260px] resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none"
                              />
                            </td>

                            <td className="px-5 py-4">
                              <button
                                disabled={
                                  updatingId === customer.id
                                }
                                onClick={() =>
                                  saveNotes(customer)
                                }
                                className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-400 disabled:opacity-50"
                              >
                                {updatingId ===
                                customer.id ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Save size={15} />
                                )}

                                Save
                              </button>
                           <button
  type="button"
  onClick={() => setEditingCustomer(customer)}
  className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
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
       {editingCustomer && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0c1118] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Edit Customer
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Update customer details
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditingCustomer(null)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          value={editingCustomer.name ?? ""}
          onChange={(e) =>
            setEditingCustomer({
              ...editingCustomer,
              name: e.target.value,
            })
          }
          placeholder="Customer name"
          className={editInputClass}
        />

        <input
          value={editingCustomer.phone ?? ""}
          onChange={(e) =>
            setEditingCustomer({
              ...editingCustomer,
              phone: e.target.value,
            })
          }
          placeholder="Phone"
          className={editInputClass}
        />

        <input
          type="email"
          value={editingCustomer.email ?? ""}
          onChange={(e) =>
            setEditingCustomer({
              ...editingCustomer,
              email: e.target.value,
            })
          }
          placeholder="Email"
          className={editInputClass}
        />

        <input
          value={editingCustomer.source ?? ""}
          onChange={(e) =>
            setEditingCustomer({
              ...editingCustomer,
              source: e.target.value,
            })
          }
          placeholder="Source"
          className={editInputClass}
        />

        <select
          value={editingCustomer.status ?? "New"}
          onChange={(e) =>
            setEditingCustomer({
              ...editingCustomer,
              status: e.target.value,
            })
          }
          className="rounded-xl border border-white/10 bg-[#111820] px-4 py-3 outline-none sm:col-span-2"
        >
          <option>New</option>
          <option>Contacted</option>
          <option>Qualified</option>
          <option>Converted</option>
        </select>

        <textarea
          rows={3}
          value={editingCustomer.notes ?? ""}
          onChange={(e) =>
            setEditingCustomer({
              ...editingCustomer,
              notes: e.target.value,
            })
          }
          placeholder="Notes"
          className={`${editInputClass} resize-none sm:col-span-2`}
        />

        <button
          type="button"
          onClick={saveCustomerChanges}
          disabled={updatingId === editingCustomer.id}
          className="rounded-xl bg-emerald-400 py-3 font-semibold text-black disabled:opacity-50 sm:col-span-2"
        >
          {updatingId === editingCustomer.id
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
const editInputClass =
  "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none";
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
    case "converted":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";

    case "qualified":
      return "border-blue-400/20 bg-blue-400/10 text-blue-400";

    case "contacted":
      return "border-violet-400/20 bg-violet-400/10 text-violet-400";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-400";
  }
}