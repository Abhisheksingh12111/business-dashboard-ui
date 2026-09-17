"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardSidebar from "@/components/DashboardSidebar";

import {
  Search,
  Loader2,
  BriefcaseBusiness,
  Plus,
  X,
  Clock3,
  IndianRupee,
  Save,
} from "lucide-react";

type Service = {
  id: number;
  created_at: string;
  name: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  duration_minutes: number | null;
  status: string | null;
  bookings_count: number | null;
};

export default function ServicesPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [showAddService, setShowAddService] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    duration_minutes: "",
    status: "Active",
  });

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

   const { data: bookingData, error: bookingError } = await supabase
  .from("bookings")
  .select("service");

if (bookingError) {
  setError(bookingError.message);
  setLoading(false);
  return;
}

const servicesWithCounts = (data ?? []).map((service) => ({
  ...service,
  bookings_count: (bookingData ?? []).filter(
    (booking) =>
      booking.service?.trim().toLowerCase() ===
      service.name?.trim().toLowerCase()
  ).length,
}));

setServices(servicesWithCounts);
    setLoading(false);
  }

  async function createService(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSavingService(true);
    setError("");

    const { data, error } = await supabase
      .from("services")
      .insert({
        name: newService.name,
        description: newService.description,
        category: newService.category,
        price: Number(newService.price),
        duration_minutes: Number(
          newService.duration_minutes
        ),
        status: newService.status,
        bookings_count: 0,
      })
      .select("*")
      .single();

    if (error) {
      setError(error.message);
      setSavingService(false);
      return;
    }

    setServices((current) => [data, ...current]);

    setNewService({
      name: "",
      description: "",
      category: "",
      price: "",
      duration_minutes: "",
      status: "Active",
    });

    setShowAddService(false);
    setSavingService(false);
  }

  function updateLocalService(
    id: number,
    changes: Partial<Service>
  ) {
    setServices((current) =>
      current.map((service) =>
        service.id === id
          ? { ...service, ...changes }
          : service
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
      .from("services")
      .update({ status })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setUpdatingId(null);
      return;
    }

    updateLocalService(id, { status });
    setUpdatingId(null);
  }

  async function saveService(service: Service) {
    setUpdatingId(service.id);
    setError("");

    const { error } = await supabase
      .from("services")
      .update({
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        duration_minutes: service.duration_minutes,
        status: service.status,
      })
      .eq("id", service.id);

    if (error) {
      setError(error.message);
    }

    setUpdatingId(null);
  }

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return services;

    return services.filter((service) =>
      [
        service.name,
        service.description,
        service.category,
        service.status,
      ].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [services, search]);

  const activeServices = services.filter(
    (service) =>
      service.status?.toLowerCase() === "active"
  ).length;

  const totalBookings = services.reduce(
    (total, service) =>
      total + (service.bookings_count ?? 0),
    0
  );

  const averagePrice =
    services.length > 0
      ? Math.round(
          services.reduce(
            (total, service) =>
              total + (service.price ?? 0),
            0
          ) / services.length
        )
      : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin text-emerald-400" />
          Loading services...
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
                  <BriefcaseBusiness
                    size={22}
                    className="text-emerald-400"
                  />

                  <h1 className="text-2xl font-semibold">
                    Services
                  </h1>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  Manage services, pricing and availability
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex w-[280px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4">
                  <Search
                    size={17}
                    className="text-zinc-500"
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search services..."
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />
                </div>

                <button
                  onClick={() =>
                    setShowAddService(true)
                  }
                  className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black"
                >
                  <Plus size={17} />
                  Add Service
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
                title="Total Services"
                value={services.length}
              />

              <Stat
                title="Active Services"
                value={activeServices}
              />

              <Stat
                title="Average Price"
                value={`₹${averagePrice.toLocaleString(
                  "en-IN"
                )}`}
              />

              <Stat
                title="Total Bookings"
                value={totalBookings}
              />
            </div>

            {filteredServices.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0c1118] px-5 py-16 text-center text-sm text-zinc-500">
                No services found.
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-white/10 bg-[#0c1118] p-5"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <input
                          value={service.name ?? ""}
                          onChange={(e) =>
                            updateLocalService(
                              service.id,
                              {
                                name: e.target.value,
                              }
                            )
                          }
                          className="w-full bg-transparent text-lg font-semibold outline-none"
                        />

                        <input
                          value={
                            service.category ?? ""
                          }
                          onChange={(e) =>
                            updateLocalService(
                              service.id,
                              {
                                category:
                                  e.target.value,
                              }
                            )
                          }
                          placeholder="Category"
                          className="mt-1 w-full bg-transparent text-sm text-zinc-500 outline-none"
                        />
                      </div>

                      <select
                        value={
                          service.status ?? "Active"
                        }
                        disabled={
                          updatingId === service.id
                        }
                        onChange={(e) =>
                          updateStatus(
                            service.id,
                            e.target.value
                          )
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-medium outline-none ${statusStyle(
                          service.status ?? "Active"
                        )}`}
                      >
                        <option
                          className="bg-[#111820]"
                          value="Active"
                        >
                          Active
                        </option>

                        <option
                          className="bg-[#111820]"
                          value="Inactive"
                        >
                          Inactive
                        </option>
                      </select>
                    </div>

                    <textarea
                      value={
                        service.description ?? ""
                      }
                      onChange={(e) =>
                        updateLocalService(
                          service.id,
                          {
                            description:
                              e.target.value,
                          }
                        )
                      }
                      placeholder="Service description..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-zinc-300 outline-none"
                    />

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <IndianRupee size={14} />
                          Price
                        </div>

                        <input
                          type="number"
                          value={
                            service.price ?? ""
                          }
                          onChange={(e) =>
                            updateLocalService(
                              service.id,
                              {
                                price:
                                  Number(
                                    e.target.value
                                  ) || 0,
                              }
                            )
                          }
                          className="mt-2 w-full bg-transparent text-lg font-semibold outline-none"
                        />
                      </div>

                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock3 size={14} />
                          Duration
                        </div>

                        <div className="mt-2 flex items-center gap-1">
                          <input
                            type="number"
                            value={
                              service.duration_minutes ??
                              ""
                            }
                            onChange={(e) =>
                              updateLocalService(
                                service.id,
                                {
                                  duration_minutes:
                                    Number(
                                      e.target
                                        .value
                                    ) || 0,
                                }
                              )
                            }
                            className="w-16 bg-transparent text-lg font-semibold outline-none"
                          />

                          <span className="text-xs text-zinc-500">
                            min
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <p className="text-xs text-zinc-500">
                          Bookings
                        </p>

                        <p className="mt-2 text-lg font-semibold">
                          {service.bookings_count ??
                            0}
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={
                        updatingId === service.id
                      }
                      onClick={() =>
                        saveService(service)
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-400/15 disabled:opacity-50"
                    >
                      {updatingId ===
                      service.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={16} />
                      )}

                      Save Changes
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showAddService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0c1118] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Add Service
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Create a new service
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddService(false)
                }
                className="rounded-lg border border-white/10 p-2 text-zinc-400"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={createService}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Input
                required
                placeholder="Service name"
                value={newService.name}
                onChange={(value) =>
                  setNewService({
                    ...newService,
                    name: value,
                  })
                }
              />

              <Input
                required
                placeholder="Category"
                value={newService.category}
                onChange={(value) =>
                  setNewService({
                    ...newService,
                    category: value,
                  })
                }
              />

              <Input
                type="number"
                required
                placeholder="Price"
                value={newService.price}
                onChange={(value) =>
                  setNewService({
                    ...newService,
                    price: value,
                  })
                }
              />

              <Input
                type="number"
                required
                placeholder="Duration in minutes"
                value={
                  newService.duration_minutes
                }
                onChange={(value) =>
                  setNewService({
                    ...newService,
                    duration_minutes: value,
                  })
                }
              />

              <select
                value={newService.status}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    status: e.target.value,
                  })
                }
                className="rounded-xl border border-white/10 bg-[#111820] px-4 py-3 outline-none sm:col-span-2"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <textarea
                value={newService.description}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    description:
                      e.target.value,
                  })
                }
                placeholder="Description"
                rows={3}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none sm:col-span-2"
              />

              <button
                type="submit"
                disabled={savingService}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 font-semibold text-black disabled:opacity-50 sm:col-span-2"
              >
                {savingService && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                )}

                {savingService
                  ? "Saving..."
                  : "Save Service"}
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
  if (status.toLowerCase() === "active") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";
  }

  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-400";
}