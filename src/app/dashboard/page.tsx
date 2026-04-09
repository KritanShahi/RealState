"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDashboard, logoutUser, toggleFavourite as toggleFavouriteAction } from "@/store/portalSlice";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { me, properties, favourites, loading, error } = useAppSelector((state) => state.portal);
  const [busyPropertyId, setBusyPropertyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "priceAsc" | "priceDesc">("latest");

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const favouriteCount = useMemo(() => favourites.length, [favourites]);
  const filteredProperties = useMemo(() => {
    const lower = search.toLowerCase();
    const base = properties.filter((property) => {
      const text = `${property.title} ${property.city ?? ""} ${property.country ?? ""}`.toLowerCase();
      return text.includes(lower);
    });

    return base.sort((a, b) => {
      if (sortBy === "priceAsc") return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
      if (sortBy === "priceDesc") return (b.price ?? 0) - (a.price ?? 0);
      return a.createdAt > b.createdAt ? -1 : 1;
    });
  }, [properties, search, sortBy]);

  function formatPriceRs(price: number | null): string {
    if (price === null) return "Price on request";
    return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(price)}`;
  }

  async function onToggleFavourite(propertyId: string) {
    setBusyPropertyId(propertyId);
    setFeedback(null);
    try {
      const wasFavourite = favourites.includes(propertyId);
      await dispatch(toggleFavouriteAction(propertyId)).unwrap();
      await dispatch(fetchDashboard());
      setFeedback(wasFavourite ? "Removed from favourites." : "Added to favourites.");
    } catch {
      // handled in slice error
    } finally {
      setBusyPropertyId(null);
    }
  }

  async function logout() {
    await dispatch(logoutUser());
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-6 py-4">
          Loading dashboard...
        </div>
      </main>
    );
  }

  if (error && !me) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
          <h1 className="text-xl font-semibold">Session issue</h1>
          <p className="mt-2 text-sm">{error}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
            onClick={() => router.push("/login")}
          >
            Go to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 shadow-xl shadow-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-indigo-300">Buyer Dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold">Hi, {me?.name}</h1>
              <p className="mt-1 text-sm text-slate-300">Role: {me?.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-slate-900"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total properties" value={properties.length} />
            <StatCard label="My favourites" value={favouriteCount} />
            <StatCard label="Saved today" value={favouriteCount > 0 ? 1 : 0} />
            <StatCard label="Account status" value="Active" />
          </div>
        </header>

        {(error || feedback) && (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-red-400/30 bg-red-500/10 text-red-100"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
            }`}
          >
            {error ?? feedback}
          </div>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Properties</h2>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search location or title"
                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
              />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as "latest" | "priceAsc" | "priceDesc")}
                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="latest">Latest</option>
                <option value="priceAsc">Price Low-High</option>
                <option value="priceDesc">Price High-Low</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProperties.map((property) => {
              const isFavourite = favourites.includes(property.id);
              const isBusy = busyPropertyId === property.id;

              return (
                <article
                  key={property.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-indigo-400/40"
                >
                  <div className="mb-4 overflow-hidden rounded-xl bg-slate-800">
                    <img
                      src={property.images?.[0]?.imageUrl || "https://placehold.co/800x500?text=No+Image"}
                      alt={property.title}
                      className="h-44 w-full cursor-pointer object-cover transition hover:scale-[1.02]"
                      onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                    />
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{property.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {[property.city, property.country].filter(Boolean).join(", ") || "Location TBD"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onToggleFavourite(property.id)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        isFavourite
                          ? "bg-pink-500/20 text-pink-200 hover:bg-pink-500/30"
                          : "bg-white/10 text-slate-200 hover:bg-white/20"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {isBusy ? "..." : isFavourite ? "Liked" : "Like"}
                    </button>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <p className="text-sm text-slate-400">Price</p>
                    <p className="text-xl font-bold text-indigo-200">
                      {formatPriceRs(property.price)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

