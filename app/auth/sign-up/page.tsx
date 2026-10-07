"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";

type AccountType = "brand" | "creator";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedRole, setSelectedRole] = useState<AccountType>(
    searchParams.get("role") === "creator" ? "creator" : "brand"
  );

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleSpecificName, setRoleSpecificName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Switch roles cleanly without adding history entries (no back-swipe looping)
  function handleRoleSwitch(role: AccountType) {
    setSelectedRole(role);
    setError("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/auth/sign-up?role=${role}`);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const normalizedUsername = username.trim().toLowerCase();

    // 1. Username Validation
    const usernameRegex = /^[a-z0-9_.]+$/;
    if (!normalizedUsername) {
      setError("Please create a username.");
      return;
    }
    if (!usernameRegex.test(normalizedUsername)) {
      setError("Username can only contain lowercase letters, numbers, underscores (_), and periods (.).");
      return;
    }

    if (!normalizedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!roleSpecificName.trim()) {
      setError(
        selectedRole === "brand"
          ? "Please enter your company or agency name."
          : "Please enter your professional headline."
      );
      return;
    }

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the Terms of Service.");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      // Check username uniqueness globally across brands and creators
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", normalizedUsername)
        .maybeSingle();

      if (existingUser) {
        setError(`The username @${normalizedUsername} is already taken by another user. Please choose a unique username.`);
        setIsLoading(false);
        return;
      }

      // Register with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role: selectedRole,
            username: normalizedUsername,
            display_name: normalizedName,
            role_specific_name: roleSpecificName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Attempt immediate login so user never has to re-login after sign-up
      try {
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
      } catch (signInErr) {
        console.warn("Auto-signin error (continuing with cached session):", signInErr);
      }

      // Upsert into profiles table to reserve username and store all details permanently
      if (data.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: normalizedEmail,
            username: normalizedUsername,
            display_name: normalizedName,
            role_specific_name: roleSpecificName.trim(),
            role: selectedRole,
          });
        } catch (dbErr) {
          console.warn("Profile table upsert error:", dbErr);
        }
      }

      // Save user profile details to persistent storage so they remain forever
      if (typeof window !== "undefined") {
        const profilePayload = {
          id: data.user?.id || `user-${Date.now()}`,
          email: normalizedEmail,
          username: normalizedUsername,
          displayName: normalizedName,
          fullName: normalizedName,
          headline: roleSpecificName.trim(),
          companyName: roleSpecificName.trim(),
          role: selectedRole,
          createdAt: new Date().toISOString(),
        };

        if (selectedRole === "creator") {
          localStorage.setItem(`creator_profile_${normalizedUsername}`, JSON.stringify(profilePayload));
          localStorage.setItem(`creator_profile_data_${normalizedUsername}`, JSON.stringify(profilePayload));
        } else {
          localStorage.setItem(`brand_profile_${normalizedUsername}`, JSON.stringify(profilePayload));
          localStorage.setItem(`brand_profile_data_${normalizedUsername}`, JSON.stringify(profilePayload));
        }

        localStorage.setItem(
          "ai_marketplace_active_user",
          JSON.stringify({
            id: data.user?.id || `user-${Date.now()}`,
            email: normalizedEmail,
            username: normalizedUsername,
            name: normalizedName,
            roleSpecificName: roleSpecificName.trim(),
            role: selectedRole,
          })
        );
      }

      // Directly navigate to the respective workspace without intermediate login loops
      const destination = selectedRole === "brand" ? "/brand/profile" : "/creator/profile";
      router.replace(destination);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
      {/* Top navigation - back to sign in */}
      <button
        type="button"
        onClick={() => router.replace("/")}
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Sign In</span>
      </button>

      <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-400">
        Create account
      </p>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {selectedRole === "brand"
          ? "Brand / Agency Sign Up"
          : "Creator Sign Up"}
      </h1>

      {/* Role Switcher: Uses state + replaceState so swiping back doesn't loop through roles */}
      <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5">
        <button
          type="button"
          onClick={() => handleRoleSwitch("brand")}
          className={`rounded-xl px-4 py-3 text-center text-sm font-medium transition ${
            selectedRole === "brand"
              ? "border border-violet-500 bg-violet-600/30 text-white shadow-lg shadow-violet-950/40"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          Brand / Agency
        </button>
        <button
          type="button"
          onClick={() => handleRoleSwitch("creator")}
          className={`rounded-xl px-4 py-3 text-center text-sm font-medium transition ${
            selectedRole === "creator"
              ? "border border-violet-500 bg-violet-600/30 text-white shadow-lg shadow-violet-950/40"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          Creator
        </button>
      </div>

      <form onSubmit={handleSignUp} className="mt-7 space-y-4" noValidate>
        {/* Username Field */}
        <div>
          <label htmlFor="username" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
            Username (lowercase only)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 text-sm">
              @
            </span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                setError("");
              }}
              placeholder="unique_username"
              className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.045] py-3 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:bg-white/[0.07] focus:ring-4 focus:ring-violet-500/10"
            />
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError("");
            }}
            placeholder="Alex Smith"
            className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:bg-white/[0.07]"
          />
        </div>

        {/* Dynamic Role-Specific Field */}
        <div>
          <label htmlFor="roleSpecificName" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
            {selectedRole === "brand" ? "Company / Agency Name" : "Professional Headline"}
          </label>
          <input
            id="roleSpecificName"
            type="text"
            value={roleSpecificName}
            onChange={(e) => {
              setRoleSpecificName(e.target.value);
              setError("");
            }}
            placeholder={
              selectedRole === "brand"
                ? "Acme Studios Worldwide"
                : "AI Film Director & Worldbuilder"
            }
            className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:bg-white/[0.07]"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="hello@example.com"
            className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:bg-white/[0.07]"
          />
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-[11px] text-slate-400 hover:text-white transition flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars"
              className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:bg-white/[0.07]"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-300">Confirm Password</label>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm"
              className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:bg-white/[0.07]"
            />
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 accent-violet-600"
          />
          <span>I agree to the Terms of Service & Privacy Policy.</span>
        </label>

        {error && (
          <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating account & launching workspace...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>Create Account & Enter Workspace</span>
              <Check className="h-4 w-4" />
            </span>
          )}
        </button>
      </form>

      {/* Direct switch to Sign In */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Already registered?{" "}
        <button
          type="button"
          onClick={() => router.replace(selectedRole === "brand" ? "/?role=brand" : "/?role=creator")}
          className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4"
        >
          Sign in here
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 text-sm text-violet-400">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      <span>Loading registration...</span>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b14] px-5 py-10 text-white">
      <Suspense fallback={<LoadingState />}>
        <SignUpContent />
      </Suspense>
    </main>
  );
}