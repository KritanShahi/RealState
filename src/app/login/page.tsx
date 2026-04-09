"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, registerUser } from "@/store/portalSlice";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { authLoading, authError } = useAppSelector((state) => state.portal);
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isRegister = mode === "register";
  const heading = useMemo(
    () => (isRegister ? "Create your buyer account" : "Welcome back"),
    [isRegister]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (isRegister) {
        await dispatch(registerUser({ name, email, password })).unwrap();
      } else {
        await dispatch(loginUser({ email, password })).unwrap();
      }
      router.push("/dashboard");
    } catch {
      // handled by Redux state
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden rounded-r-[4rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              RealState Portal
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white">
              Find and save your next dream property.
            </h1>
            <p className="max-w-md text-sm leading-7 text-violet-100/95">
              Track favourites in one place, revisit properties instantly, and manage your
              buyer journey with a clean dashboard.
            </p>
          </div>
          <div className="rounded-3xl border border-white/30 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm text-violet-100">Preview</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl bg-white/85 p-4 text-slate-900">
                <p className="font-medium">Modern Apartment</p>
                <p className="text-xs text-slate-600">Downtown • $125,000</p>
              </div>
              <div className="rounded-xl bg-white/15 p-4 text-white">
                <p className="font-medium">Villa with Garden</p>
                <p className="text-xs text-violet-100">Green Park • $340,000</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-violet-900/20 backdrop-blur">
            <div className="mb-8 flex items-center rounded-xl border border-white/10 bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`w-1/2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  !isRegister ? "bg-white text-slate-900" : "text-slate-300 hover:text-white"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`w-1/2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isRegister ? "bg-white text-slate-900" : "text-slate-300 hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>

            <h2 className="text-2xl font-semibold text-white">{heading}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {isRegister
                ? "Start saving properties to your favourites dashboard."
                : "Log in to access your favourites dashboard."}
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {isRegister && (
                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm text-slate-300">
                    Full name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm outline-none ring-violet-500 transition focus:ring-2"
                    placeholder="John Buyer"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm outline-none ring-violet-500 transition focus:ring-2"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm outline-none ring-violet-500 transition focus:ring-2"
                  placeholder="At least 8 characters"
                />
              </div>

              {authError && (
                <p
                  className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                >
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {authLoading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

