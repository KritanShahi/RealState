"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { Property, User } from "@/types/api";

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [favourites, setFavourites] = useState<Set<number>>(new Set<number>());
  const [busyPropertyId, setBusyPropertyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [user, allProperties, userFavourites] = await Promise.all([
          apiRequest<User>("/me"),
          apiRequest<Property[]>("/properties"),
          apiRequest<Property[]>("/favourites")
        ]);

        if (!mounted) return;
        setMe(user);
        setProperties(allProperties);
        setFavourites(new Set(userFavourites.map((item) => item.id)));
        setError(null);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const favouriteCount = useMemo(() => favourites.size, [favourites]);

  async function toggleFavourite(propertyId: number) {
    const isFavourite = favourites.has(propertyId);
    setBusyPropertyId(propertyId);
    setFeedback(null);
    setError(null);

    try {
      await apiRequest(`/favourites/${propertyId}`, {
        method: isFavourite ? "DELETE" : "POST"
      });

      setFavourites((prev) => {
        const next = new Set(prev);
        if (isFavourite) {
          next.delete(propertyId);
        } else {
          next.add(propertyId);
        }
        return next;
      });
      setFeedback(isFavourite ? "Removed from favourites." : "Added to favourites.");
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Action failed");
    } finally {
      setBusyPropertyId(null);
    }
  }

  async function logout() {
    await apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
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
            <p className="text-sm text-slate-400">Click heart to add or remove favourites.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => {
              const isFavourite = favourites.has(property.id);
              const isBusy = busyPropertyId === property.id;

              return (
                <article
                  key={property.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-indigo-400/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{property.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{property.location}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => toggleFavourite(property.id)}
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
                      ${property.price.toLocaleString()}
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

