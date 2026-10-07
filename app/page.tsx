"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountType = "brand" | "creator";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountType, setAccountType] = useState<AccountType>(
    searchParams.get("role") === "creator" ? "creator" : "brand"
  );
  
  // 1. Changed state from 'email' to 'identifier' to handle both formats
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleSelectRole(type: AccountType) {
    setAccountType(type);
    setError("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/?role=${type}`);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!normalizedIdentifier) {
      setError("Please enter your email or username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      let loginEmail = normalizedIdentifier;

      // 2. If it's a username (no '@'), look up the email in the profiles table first
      if (!normalizedIdentifier.includes("@")) {
        // Note: You must have a 'profiles' table in Supabase where username and email are saved
        const { data: profile, error: profileError } = await supabase
          .from("profiles") 
          .select("email")
          .eq("username", normalizedIdentifier)
          .single();

        if (profileError || !profile) {
          setError("Username not found. Please try logging in with your email.");
          setIsLoading(false);
          return;
        }
        
        loginEmail = profile.email;
      }

      // 3. Proceed with Supabase Auth using the resolved email
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError || !data.user) {
        setError(signInError?.message ?? "Unable to sign in.");
        return;
      }

      const registeredRole = data.user.user_metadata?.role as AccountType | undefined;

      if (registeredRole && registeredRole !== accountType) {
        await supabase.auth.signOut();

        setError(
          `This account is registered as ${
            registeredRole === "brand" ? "Brand / Agency" : "Creator"
          }. Please select the correct account type.`
        );

        return;
      }

      if (typeof window !== "undefined" && data.user) {
        const meta = data.user.user_metadata || {};
        localStorage.setItem(
          "ai_marketplace_active_user",
          JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            username: (meta.username || identifier).toLowerCase(),
            name: meta.display_name || meta.full_name,
            roleSpecificName: meta.role_specific_name,
            role: accountType,
          })
        );
      }

      const destination = accountType === "brand" ? "/brand/profile" : "/creator/profile";
      router.replace(destination);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.30),transparent_32%),radial-gradient(circle_at_85%_70%,rgba(6,182,212,0.18),transparent_34%)]" />
          <div className="absolute -left-32 bottom-16 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="relative z-10">
            <Logo />

            <div className="mt-24 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                AI-native creative marketplace
              </div>

              <h1 className="mt-7 text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
                Where ambitious brands meet{" "}
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
                  AI creators.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Discover specialized AI filmmakers, animators and generative
                creators. Review their tools, workflows, portfolios and
                commercial experience in one place.
              </p>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
                <FeatureStat value="AI" label="Native portfolios" />
                <FeatureStat value="360°" label="Workflow visibility" />
                <FeatureStat value="5★" label="Trusted reviews" />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-sm text-slate-500">
            <p>Built for modern creative production.</p>
            <p>Secure marketplace access</p>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(124,58,237,0.14),transparent_33%)] lg:hidden" />

          <div className="relative z-10 w-full max-w-[460px]">
            <div className="mb-10 lg:hidden">
              <Logo />
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-violet-400">
                Welcome back
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Sign in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Select your account type and enter your login information.
              </p>
            </div>

            <div className="mb-7 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
              <button
                type="button"
                onClick={() => handleSelectRole("brand")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  accountType === "brand"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <BriefcaseIcon />
                Brand / Agency
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole("creator")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  accountType === "creator"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <CreatorIcon />
                Creator
              </button>
            </div>

            <div className="mb-6 rounded-xl border border-violet-400/15 bg-violet-500/[0.07] px-4 py-3 text-sm leading-6 text-slate-300">
              {accountType === "brand" ? (
                <p>
                  Sign in to discover creators, publish briefs and manage engagements.
                </p>
              ) : (
                <p>
                  Sign in to manage your AI portfolio, proposals and creative projects.
                </p>
              )}
            </div>

            <form onSubmit={handleLogin} noValidate>
              <div className="space-y-5">
                <div>
                  {/* 4. Updated Label to reflect Username capability */}
                  <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-slate-200">
                    Email or Username
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                      <EmailIcon />
                    </span>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text" // Changed from 'email' to 'text'
                      autoComplete="username"
                      value={identifier} // Updated state variable
                      onChange={(event) => {
                        setIdentifier(event.target.value);
                        setError("");
                      }}
                      // Updated placeholder to show examples
                      placeholder={
                        accountType === "brand"
                          ? "acme_brand or brand@company.com"
                          : "alex_ai or creator@example.com"
                      }
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] py-3.5 pr-4 pl-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:bg-white/[0.07] focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-slate-200">
                      Password
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-medium text-violet-400 transition hover:text-violet-300"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                      <LockIcon />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError("");
                      }}
                      placeholder="Enter your password"
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] py-3.5 pr-12 pl-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:bg-white/[0.07] focus:ring-4 focus:ring-violet-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-white"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-600"
                  />
                  Keep me signed in
                </label>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-fuchsia-500 focus:ring-4 focus:ring-violet-500/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading
                    ? "Signing in..."
                    : `Sign in as ${
                        accountType === "brand" ? "Brand / Agency" : "Creator"
                      }`}
                  {!isLoading && <ArrowIcon />}
                </button>
              </div>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-center text-xs uppercase tracking-widest text-slate-600">
                New to the marketplace?
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Link
              href={`/auth/sign-up?role=${accountType}`}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.025] px-5 py-3.5 text-center text-sm font-medium text-slate-200 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
            >
              Create a {accountType === "brand" ? "Brand / Agency" : "Creator"} account
            </Link>

            <p className="mt-8 text-center text-xs leading-5 text-slate-600">
              By continuing, you agree to the marketplace Terms of Service and Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Icons                                   */
/* -------------------------------------------------------------------------- */

function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 text-white">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-950/40">
        <SparkIcon />
      </span>
      <span>
        <span className="block text-lg leading-none font-semibold tracking-tight">
          CreatorForge
        </span>
        <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.24em] text-violet-400">
          AI Marketplace
        </span>
      </span>
    </Link>
  );
}

function FeatureStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur">
      <p className="text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{label}</p>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.5C12.7 7.2 16.3 10.8 21 11.5C16.3 12.2 12.7 15.8 12 20.5C11.3 15.8 7.7 12.2 3 11.5C7.7 10.8 11.3 7.2 12 2.5Z" fill="currentColor" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 10.5h16M5 7h14a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CreatorIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 4 16 16M10.5 6.2c.5-.1 1-.2 1.5-.2 6 0 9.5 6 9.5 6a17 17 0 0 1-2.3 3M6.2 7.5A17.6 17.6 0 0 0 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14]" />}>
      <LoginContent />
    </Suspense>
  );
}