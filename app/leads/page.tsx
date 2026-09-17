"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardSidebar from "@/components/DashboardSidebar";

import {
  Search,
  Loader2,
  UserPlus,
  Plus,
  X,
  Save,
} from "lucide-react";

type Lead = {
  id: number;
  created_at: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  interest: string | null;
  status: string | null;
  follow_up_date: string | null;
  notes: string | null;
  potential_value: number | null;
};

export default function LeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [showAddLead, setShowAddLead] = useState(false);
  const [savingLead, setSavingLead] = useState(false);

  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    source: "Manual",
    interest: "",
    status: "New",
    follow_up_date: "",
    notes: "",
    potential_value: "",
  });

  async function loadLeads() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLeads(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadLeads);
    // Dashboard data should load once after the client mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createLead(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSavingLead(true);
    setError("");

    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        source: newLead.source,
        interest: newLead.interest,
        status: newLead.status,
        follow_up_date:
          newLead.follow_up_date || null,
        notes: newLead.notes,
        potential_value:
          Number(newLead.potential_value) || 0,
      })
      .select("*")
      .single();

    if (error) {
      setError(error.message);
      setSavingLead(false);
      return;
    }

    setLeads((current) => [data, ...current]);

    setNewLead({
      name: "",
      phone: "",
      email: "",
      source: "Manual",
      interest: "",
      status: "New",
      follow_up_date: "",
      notes: "",
      potential_value: "",
    });

    setShowAddLead(false);
    setSavingLead(false);
  }

  function updateLocalLead(
    id: number,
    changes: Partial<Lead>
  ) {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === id
          ? { ...lead, ...changes }
          : lead
      )
    );
  }

  async function updateStatus(
    id: number,
    status: string
  ) {
    setUpdatingId(id);
    setError("");

    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setUpdatingId(null);
      return;
    }

    updateLocalLead(id, { status });
    setUpdatingId(null);
  }

  async function saveLead(lead: Lead) {
    setUpdatingId(lead.id);
    setError("");

    const { error } = await supabase
      .from("leads")
      .update({
       name: lead.name,
phone: lead.phone,
email: lead.email,
source: lead.source,
interest: lead.interest,
status: lead.status,
        follow_up_date:
          lead.follow_up_date || null,
        notes: lead.notes,
        potential_value:
          lead.potential_value ?? 0,
      })
      .eq("id", lead.id);

    if (error) {
      setError(error.message);
    }

    setUpdatingId(null);
  }

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return leads;

    return leads.filter((lead) =>
      [
        lead.name,
        lead.phone,
        lead.email,
        lead.source,
        lead.interest,
        lead.status,
      ].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [leads, search]);

  const qualified = leads.filter(
    (lead) =>
      lead.status?.toLowerCase() === "qualified"
  ).length;

  const won = leads.filter(
    (lead) =>
      lead.status?.toLowerCase() === "won"
  ).length;

  const pipelineValue = leads
    .filter(
      (lead) =>
        lead.status?.toLowerCase() !== "lost" &&
        lead.status?.toLowerCase() !== "won"
    )
    .reduce(
      (total, lead) =>
        total + (lead.potential_value ?? 0),
      0
    );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin text-emerald-400" />
          Loading leads...
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
                  <UserPlus
                    size={22}
                    className="text-emerald-400"
                  />

                  <h1 className="text-2xl font-semibold">
                    Leads
                  </h1>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  Track enquiries, follow-ups and potential deals
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
                    placeholder="Search leads..."
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />
                </div>

                <button
                  onClick={() =>
                    setShowAddLead(true)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black sm:w-auto"
                >
                  <Plus size={17} />
                  Add Lead
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
                title="Total Leads"
                value={leads.length}
              />

              <Stat
                title="Qualified"
                value={qualified}
              />

              <Stat
                title="Won"
                value={won}
              />

              <Stat
                title="Pipeline Value"
                value={`₹${pipelineValue.toLocaleString(
                  "en-IN"
                )}`}
              />
            </div>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c1118]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1450px] text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-zinc-600">
                      <th className="px-5 py-4">
                        Lead
                      </th>

                      <th className="px-5 py-4">
                        Contact
                      </th>

                      <th className="px-5 py-4">
                        Interest
                      </th>

                      <th className="px-5 py-4">
                        Source
                      </th>

                      <th className="px-5 py-4">
                        Value
                      </th>

                      <th className="px-5 py-4">
                        Follow-up
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Notes
                      </th>

                      <th className="px-5 py-4">
                        Save
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-14 text-center text-sm text-zinc-500"
                        >
                          No leads found.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-t border-white/[0.06] align-top"
                        >
                          <td className="px-5 py-4">
                            <input
  value={lead.name ?? ""}
  onChange={(e) =>
    updateLocalLead(lead.id, {
      name: e.target.value,
    })
  }
  className="w-full bg-transparent font-medium outline-none"
/>

                            <p className="mt-1 text-xs text-zinc-600">
                              Lead #{lead.id}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                           <input
  value={lead.phone ?? ""}
  onChange={(e) =>
    updateLocalLead(lead.id, {
      phone: e.target.value,
    })
  }
  placeholder="Phone"
  className="w-full bg-transparent text-sm text-zinc-300 outline-none"
/>

                            <input
  type="email"
  value={lead.email ?? ""}
  onChange={(e) =>
    updateLocalLead(lead.id, {
      email: e.target.value,
    })
  }
  placeholder="Email"
  className="mt-1 w-full bg-transparent text-xs text-zinc-500 outline-none"
/>
                          </td>

                          <td className="px-5 py-4">
  <input
    value={lead.interest ?? ""}
    onChange={(e) =>
      updateLocalLead(lead.id, {
        interest: e.target.value,
      })
    }
    placeholder="Interest"
    className="w-full bg-transparent text-sm text-zinc-400 outline-none"
  />
</td>

                         <td className="px-5 py-4">
  <input
    value={lead.source ?? ""}
    onChange={(e) =>
      updateLocalLead(lead.id, {
        source: e.target.value,
      })
    }
    placeholder="Source"
    className="w-full bg-transparent text-sm text-zinc-400 outline-none"
  />
</td>

                          <td className="px-5 py-4">
                            <div className="flex items-center">
                              <span className="text-zinc-500">
                                ₹
                              </span>

                              <input
                                type="number"
                                value={
                                  lead.potential_value ?? 0
                                }
                                onChange={(e) =>
                                  updateLocalLead(
                                    lead.id,
                                    {
                                      potential_value:
                                        Number(
                                          e.target.value
                                        ) || 0,
                                    }
                                  )
                                }
                                className="w-[100px] bg-transparent font-medium outline-none"
                              />
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <input
                              type="date"
                              value={
                                lead.follow_up_date ??
                                ""
                              }
                              onChange={(e) =>
                                updateLocalLead(
                                  lead.id,
                                  {
                                    follow_up_date:
                                      e.target.value,
                                  }
                                )
                              }
                              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none"
                            />
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                lead.status ?? "New"
                              }
                              disabled={
                                updatingId === lead.id
                              }
                              onChange={(e) =>
                                updateStatus(
                                  lead.id,
                                  e.target.value
                                )
                              }
                              className={`rounded-lg border px-3 py-2 text-xs font-medium outline-none ${statusStyle(
                                lead.status ?? "New"
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
                                value="Won"
                              >
                                Won
                              </option>

                              <option
                                className="bg-[#111820]"
                                value="Lost"
                              >
                                Lost
                              </option>
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            <textarea
                              rows={2}
                              value={lead.notes ?? ""}
                              onChange={(e) =>
                                updateLocalLead(
                                  lead.id,
                                  {
                                    notes: e.target.value,
                                  }
                                )
                              }
                              placeholder="Notes..."
                              className="w-[240px] resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none"
                            />
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() =>
                                saveLead(lead)
                              }
                              disabled={
                                updatingId === lead.id
                              }
                              className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-400 disabled:opacity-50"
                            >
                              {updatingId ===
                              lead.id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Save size={15} />
                              )}

                              Save
                            </button>
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

      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0c1118] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Add Lead
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Add an offline or manually received enquiry
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddLead(false)
                }
                className="rounded-lg border border-white/10 p-2 text-zinc-400"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={createLead}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Input
                required
                placeholder="Lead name"
                value={newLead.name}
                onChange={(value) =>
                  setNewLead({
                    ...newLead,
                    name: value,
                  })
                }
              />

              <Input
                placeholder="Phone"
                value={newLead.phone}
                onChange={(value) =>
                  setNewLead({
                    ...newLead,
                    phone: value,
                  })
                }
              />

              <Input
                type="email"
                placeholder="Email"
                value={newLead.email}
                onChange={(value) =>
                  setNewLead({
                    ...newLead,
                    email: value,
                  })
                }
              />

              <Input
                placeholder="Interest / Service"
                value={newLead.interest}
                onChange={(value) =>
                  setNewLead({
                    ...newLead,
                    interest: value,
                  })
                }
              />

              <Input
                placeholder="Source"
                value={newLead.source}
                onChange={(value) =>
                  setNewLead({
                    ...newLead,
                    source: value,
                  })
                }
              />

              <Input
                type="number"
                placeholder="Potential value"
                value={newLead.potential_value}
                onChange={(value) =>
                  setNewLead({
                    ...newLead,
                    potential_value: value,
                  })
                }
              />

              <input
                type="date"
                value={newLead.follow_up_date}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    follow_up_date:
                      e.target.value,
                  })
                }
                className={inputClass}
              />

              <select
                value={newLead.status}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    status: e.target.value,
                  })
                }
                className="rounded-xl border border-white/10 bg-[#111820] px-4 py-3 outline-none"
              >
                <option>New</option>
                <option>Contacted</option>
                <option>Qualified</option>
                <option>Won</option>
                <option>Lost</option>
              </select>

              <textarea
                rows={3}
                value={newLead.notes}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    notes: e.target.value,
                  })
                }
                placeholder="Notes"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none sm:col-span-2"
              />

              <button
                type="submit"
                disabled={savingLead}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 font-semibold text-black disabled:opacity-50 sm:col-span-2"
              >
                {savingLead && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                )}

                {savingLead
                  ? "Saving..."
                  : "Save Lead"}
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
    case "won":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";

    case "lost":
      return "border-red-400/20 bg-red-400/10 text-red-400";

    case "qualified":
      return "border-blue-400/20 bg-blue-400/10 text-blue-400";

    case "contacted":
      return "border-violet-400/20 bg-violet-400/10 text-violet-400";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-400";
  }
}
