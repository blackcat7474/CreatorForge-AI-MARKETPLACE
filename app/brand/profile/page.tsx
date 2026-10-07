"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getCompletedProjects,
  awardCreatorProject,
  CompletedProject,
} from "@/lib/marketplace-store";
import { BrandLeftNav, BrandHeaderNav } from "@/components/brand-navigation";
import { NotificationBell } from "@/components/notification-bell";
import {
  MapPin,
  Mail,
  Globe,
  Pencil,
  Plus,
  Search,
  LogOut,
  Briefcase,
  Users,
  Sparkles,
  Clock,
  DollarSign,
  X,
  ChevronRight,
  Star,
  Award,
  CheckCircle2,
  Film,
  Camera,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type MessageState = {
  type: "success" | "error" | "";
  text: string;
};

type CampaignBrief = {
  id: string;
  title: string;
  deliverable: string;
  budget: string;
  proposalsCount: number;
  deadline: string;
  status: "Open" | "Reviewing" | "Completed";
  description: string;
  // Brief Definition (content type, style, aspect ratio, commercial-use)
  contentType?: string;
  style?: string;
  formatAspectRatio?: string;
  commercialUseRequirements?: string;
};

type ShortlistedCreator = {
  id: string;
  name: string;
  handle: string;
  specialty: string;
  rating: string;
  avatarLetter: string;
};

export default function BrandProfilePage() {
  const router = useRouter();

  // User & Brand Identity State (loaded from Supabase)
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // App & Workflow State (Clean real activity tracking - starts strictly at 0)
  const [activeTab, setActiveTab] = useState<
    "briefs" | "shortlist" | "awarded-projects" | "ai-helper"
  >("briefs");
  const [briefs, setBriefs] = useState<CampaignBrief[]>([]);
  const [shortlist] = useState<ShortlistedCreator[]>([]);
  const [awardedProjects, setAwardedProjects] = useState<CompletedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateBriefOpen, setIsCreateBriefOpen] = useState(false);
  const [isAwardProjectOpen, setIsAwardProjectOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });

  // Create Brief Form State (Brief Definition: Content type, style, format/aspect ratio, commercial-use)
  const [newBriefTitle, setNewBriefTitle] = useState("");
  const [newDeliverable, setNewDeliverable] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newBriefDesc, setNewBriefDesc] = useState("");
  const [newContentType, setNewContentType] = useState("AI Video Commercial");
  const [newStyle, setNewStyle] = useState("Cinematic Sci-Fi / Cyberpunk");
  const [newFormatAspectRatio, setNewFormatAspectRatio] = useState("9:16 Vertical (Reel / TikTok / Shorts)");
  const [newCommercialUse, setNewCommercialUse] = useState("Full Commercial Buyout & Paid Ad Whitelisting");

  // Award Project Form State (Priority 1 Project Rating)
  const [awardCreatorUsername, setAwardCreatorUsername] = useState("");
  const [awardProjectTitle, setAwardProjectTitle] = useState("");
  const [awardDeliverable, setAwardDeliverable] = useState("");
  const [awardBudget, setAwardBudget] = useState("");
  const [awardRating, setAwardRating] = useState<number>(5);
  const [awardReviewText, setAwardReviewText] = useState("");
  const [awardSuccessMsg, setAwardSuccessMsg] = useState("");

  // AI Brief Helper State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGeneratedOutput, setAiGeneratedOutput] = useState("");
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  // -------------------------------------------------------
  // LOAD LOGGED-IN BRAND DATA WITH STRICT ROLE AUTHORIZATION
  // -------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      // 1. Authentication Check: Check Supabase session first, then active user cache
      const activeUser = user;
      let userRole = user?.user_metadata?.role;
      let cachedActiveUser: {
        id?: string;
        email?: string;
        username?: string;
        name?: string;
        roleSpecificName?: string;
        role?: string;
      } | null = null;

      if (!activeUser && typeof window !== "undefined") {
        try {
          const rawActive = localStorage.getItem("ai_marketplace_active_user");
          if (rawActive) {
            cachedActiveUser = JSON.parse(rawActive);
            if (cachedActiveUser?.role === "brand") {
              userRole = "brand";
            }
          }
        } catch {
          // ignore
        }
      }

      if (!activeUser && !cachedActiveUser) {
        setIsLoading(false);
        router.replace("/?role=brand");
        return;
      }

      // 2. Strict Role Authorization: Only Brand accounts can access Brand Workspace
      if (userRole && userRole !== "brand") {
        setIsLoading(false);
        router.replace("/creator/profile");
        return;
      }

      const effectiveUserId = activeUser?.id || cachedActiveUser?.id || "active-brand";
      const effectiveEmail = activeUser?.email || cachedActiveUser?.email || "";
      setUserId(effectiveUserId);
      setEmail(effectiveEmail);

      // 3. Hydrate from user_metadata collected at sign-up
      const meta = activeUser?.user_metadata || {};
      let metaCompany = meta.role_specific_name || meta.display_name || cachedActiveUser?.roleSpecificName || "";
      let metaManager = meta.display_name || cachedActiveUser?.name || "";
      const metaUsername = (meta.username || cachedActiveUser?.username || "").toLowerCase();
      let metaAddress = meta.address || meta.location || "";
      let metaDescription = meta.description || meta.bio || "";
      let metaWebsite = meta.website_url || meta.portfolio_url || "";
      let metaIndustry = meta.industry || "";

      // Also hydrate from brand permanent local profile store
      if (typeof window !== "undefined" && metaUsername) {
        try {
          const rawLocal = localStorage.getItem(`brand_profile_${metaUsername}`) || localStorage.getItem(`brand_profile_data_${metaUsername}`);
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (!metaCompany && (parsed.companyName || parsed.roleSpecificName)) metaCompany = parsed.companyName || parsed.roleSpecificName;
            if (!metaManager && (parsed.managerName || parsed.displayName)) metaManager = parsed.managerName || parsed.displayName;
            if (!metaAddress && parsed.location) metaAddress = parsed.location;
            if (!metaDescription && parsed.description) metaDescription = parsed.description;
            if (!metaWebsite && parsed.websiteUrl) metaWebsite = parsed.websiteUrl;
            if (!metaIndustry && parsed.industry) metaIndustry = parsed.industry;
          }
        } catch {
          // ignore
        }
      }

      setCompanyName(metaCompany);
      setManagerName(metaManager);
      setUsername(metaUsername);
      setAddress(metaAddress);
      setDescription(metaDescription);
      setWebsiteUrl(metaWebsite);
      setIndustry(metaIndustry);

      // Hydrate brand logo / avatar
      const savedLogo = typeof window !== "undefined" && metaUsername ? localStorage.getItem(`brand_avatar_${metaUsername}`) : null;
      if (savedLogo) {
        setLogoUrl(savedLogo);
      } else if (meta.avatar_url) {
        setLogoUrl(meta.avatar_url);
      }

      // Hydrate saved briefs from localStorage
      if (typeof window !== "undefined") {
        try {
          const savedBriefsRaw = localStorage.getItem(`brand_briefs_${metaUsername}`);
          if (savedBriefsRaw) {
            const parsed = JSON.parse(savedBriefsRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBriefs(parsed);
            }
          }
        } catch {
          // ignore parsing error
        }
      }

      // 4. Query profiles table for persistent database updates
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", effectiveUserId)
        .single();

      if (profile && isMounted) {
        if (profile.role && profile.role !== "brand") {
          setIsLoading(false);
          router.replace("/creator/profile");
          return;
        }

        if (profile.role_specific_name || profile.display_name) {
          setCompanyName(profile.role_specific_name || profile.display_name);
        }
        if (profile.username) {
          const profileUser = profile.username.toLowerCase();
          setUsername(profileUser);
          const userSavedLogo = typeof window !== "undefined" ? localStorage.getItem(`brand_avatar_${profileUser}`) : null;
          if (userSavedLogo) setLogoUrl(userSavedLogo);
        }
        if (profile.location || profile.address) {
          setAddress(profile.location || profile.address);
        }
        if (profile.description || profile.bio) {
          setDescription(profile.description || profile.bio);
        }
        if (profile.portfolio_url || profile.website_url) {
          setWebsiteUrl(profile.portfolio_url || profile.website_url);
        }
        if (profile.industry) {
          setIndustry(profile.industry);
        }
        if (profile.avatar_url) {
          setLogoUrl((prev) => prev || profile.avatar_url);
        }
      }

      // 5. Load Completed Collaborations
      const completed = getCompletedProjects();
      setAwardedProjects(completed);

      if (isMounted) {
        setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // -------------------------------------------------------
  // LOGO UPLOAD & REMOVE HANDLERS
  // -------------------------------------------------------
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Logo image size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        const cleanHandle = username.trim().toLowerCase().replace(/^@/, "");
        if (cleanHandle && typeof window !== "undefined") {
          localStorage.setItem(`brand_avatar_${cleanHandle}`, result);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    const cleanHandle = username.trim().toLowerCase().replace(/^@/, "");
    if (cleanHandle && typeof window !== "undefined") {
      localStorage.removeItem(`brand_avatar_${cleanHandle}`);
    }
  }

  // -------------------------------------------------------
  // SAVE UPDATED BRAND PROFILE TO SUPABASE WITH UNIQUE LOWERCASE CHECK
  // -------------------------------------------------------
  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
    const cleanCompany = companyName.trim();
    const cleanAddress = address.trim();
    const cleanIndustry = industry.trim();
    const cleanWebsite = websiteUrl.trim();
    const cleanDesc = description.trim();

    // 1. Strict Username Validation
    const usernameRegex = /^[a-z0-9_.]+$/;
    if (!cleanUsername) {
      setMessage({ type: "error", text: "Username handle is required." });
      return;
    }
    if (!usernameRegex.test(cleanUsername)) {
      setMessage({
        type: "error",
        text: "Username can only contain lowercase letters, numbers, underscores (_), and periods (.). Uppercase is not allowed.",
      });
      return;
    }

    if (!cleanCompany) {
      setMessage({ type: "error", text: "Company or agency name is required." });
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();

      // 2. Global Uniqueness Check: Ensure no other user (brand or creator) holds this username
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanUsername)
        .neq("id", userId || "")
        .maybeSingle();

      if (!checkError && existingUser) {
        setMessage({
          type: "error",
          text: `@${cleanUsername} is already taken by another user. Usernames must be globally unique across all brands and creators.`,
        });
        setIsSaving(false);
        return;
      }

      // Persist logo to localStorage
      if (typeof window !== "undefined" && cleanUsername) {
        if (logoUrl) {
          localStorage.setItem(`brand_avatar_${cleanUsername}`, logoUrl);
        } else {
          localStorage.removeItem(`brand_avatar_${cleanUsername}`);
        }
      }

      // 3. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username: cleanUsername,
          display_name: cleanCompany,
          role_specific_name: cleanCompany,
          manager_name: managerName.trim(),
          address: cleanAddress,
          location: cleanAddress,
          industry: cleanIndustry,
          website_url: cleanWebsite,
          description: cleanDesc,
          avatar_url: logoUrl,
        },
      });

      if (authError) {
        setMessage({ type: "error", text: authError.message });
        setIsSaving(false);
        return;
      }

      // 4. Sync to profiles table
      if (userId) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          email,
          username: cleanUsername,
          display_name: cleanCompany,
          role_specific_name: cleanCompany,
          location: cleanAddress,
          headline: cleanIndustry,
          portfolio_url: cleanWebsite,
          bio: cleanDesc,
          avatar_url: logoUrl,
        });

        if (profileError) {
          console.warn("Could not sync to profiles table:", profileError.message);
        }
      }

      // 5. Permanently update local persistent store
      if (typeof window !== "undefined") {
        const brandData = {
          username: cleanUsername,
          companyName: cleanCompany,
          managerName,
          address: cleanAddress,
          industry: cleanIndustry,
          websiteUrl: cleanWebsite,
          description: cleanDesc,
          logoUrl,
          email,
          role: "brand",
        };
        localStorage.setItem(`brand_profile_${cleanUsername}`, JSON.stringify(brandData));
        localStorage.setItem(`brand_profile_data_${cleanUsername}`, JSON.stringify(brandData));
        localStorage.setItem(
          "ai_marketplace_active_user",
          JSON.stringify({
            id: userId,
            email,
            username: cleanUsername,
            name: managerName || cleanCompany,
            roleSpecificName: cleanCompany,
            role: "brand",
          })
        );
      }

      setUsername(cleanUsername);
      setCompanyName(cleanCompany);
      setAddress(cleanAddress);
      setIndustry(cleanIndustry);
      setWebsiteUrl(cleanWebsite);
      setDescription(cleanDesc);

      setMessage({ type: "success", text: "Brand profile and logo updated successfully." });
      setIsEditing(false);
    } catch {
      setMessage({ type: "error", text: "An error occurred while saving." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/brand/creators?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/brand/creators");
    }
  }

  function handleCreateBrief(e: FormEvent) {
    e.preventDefault();
    if (!newBriefTitle.trim()) return;

    const newBrief: CampaignBrief = {
      id: `b-${Date.now()}`,
      title: newBriefTitle.trim(),
      deliverable: newDeliverable.trim() || "Creative AI Assets",
      budget: newBudget.trim() || "$1,000",
      proposalsCount: 0,
      deadline: newDeadline.trim() || "In 14 days",
      status: "Open",
      description: newBriefDesc.trim() || "Newly published campaign brief for AI creators.",
      contentType: newContentType,
      style: newStyle,
      formatAspectRatio: newFormatAspectRatio,
      commercialUseRequirements: newCommercialUse,
    };

    const updatedBriefs = [newBrief, ...briefs];
    setBriefs(updatedBriefs);

    if (typeof window !== "undefined") {
      const cleanHandle = username.trim().toLowerCase().replace(/^@/, "");
      if (cleanHandle) {
        localStorage.setItem(`brand_briefs_${cleanHandle}`, JSON.stringify(updatedBriefs));
      }
    }

    setNewBriefTitle("");
    setNewDeliverable("");
    setNewBudget("");
    setNewDeadline("");
    setNewBriefDesc("");
    setNewContentType("AI Video Commercial");
    setNewStyle("Cinematic Sci-Fi / Cyberpunk");
    setNewFormatAspectRatio("9:16 Vertical (Reel / TikTok / Shorts)");
    setNewCommercialUse("Full Commercial Buyout & Paid Ad Whitelisting");
    setIsCreateBriefOpen(false);
    setActiveTab("briefs");
  }

  // -------------------------------------------------------
  // AWARD COMPLETED PROJECT & RATING (Priority 1)
  // -------------------------------------------------------
  function handleAwardProject(e: FormEvent) {
    e.preventDefault();
    const cleanCreator = awardCreatorUsername.trim().toLowerCase().replace(/^@/, "");
    if (!cleanCreator) {
      alert("Please provide the creator's username.");
      return;
    }
    if (!awardProjectTitle.trim()) {
      alert("Please provide a project title.");
      return;
    }

    const awarded = awardCreatorProject({
      creatorId: `c-${cleanCreator}`,
      creatorUsername: cleanCreator,
      brandId: userId || "brand-id",
      brandName: companyName || "Brand Partner",
      brandUsername: username || "brand_user",
      title: awardProjectTitle.trim(),
      deliverable: awardDeliverable.trim() || "Completed Campaign Deliverables",
      description: "Successfully delivered milestone deliverables and passed quality review.",
      budget: awardBudget.trim() || "$2,500",
      rating: awardRating,
      reviewText:
        awardReviewText.trim() ||
        "Exceptional creativity and flawless execution. Highly recommended creator!",
    });

    setAwardedProjects([awarded, ...awardedProjects]);
    setAwardSuccessMsg(
      `Awarded ${awardRating}-star Project Rating to @${cleanCreator}! It is now live on their profile as a verified project.`
    );

    setTimeout(() => {
      setAwardSuccessMsg("");
      setIsAwardProjectOpen(false);
      setAwardCreatorUsername("");
      setAwardProjectTitle("");
      setAwardDeliverable("");
      setAwardBudget("");
      setAwardReviewText("");
      setActiveTab("awarded-projects");
    }, 2500);
  }

  function handleGenerateAiBrief() {
    if (!aiPrompt.trim()) return;
    setIsGeneratingBrief(true);

    setTimeout(() => {
      setAiGeneratedOutput(
        `# Structured Brief Definition: ${aiPrompt}\n\n` +
          `• Content Type: AI Video Commercial & Social Motion Asset\n` +
          `• Visual Style: Cinematic Hyper-Realistic Sci-Fi / Luxury Lighting\n` +
          `• Format / Aspect Ratio: 9:16 Vertical (Reel / TikTok / Shorts)\n` +
          `• Commercial-Use Requirements: Full Commercial Buyout & Paid Ad Whitelisting (12 Months)\n` +
          `• Key Deliverable: 3x 30s 4K Motion Deliverables + Master Seeds\n` +
          `• Estimated Budget: $2,500 - $3,500\n` +
          `• Recommended Timeline: 14 business days\n` +
          `• Recommended Tool Stack: Runway Gen-3, Midjourney v6, ComfyUI, Topaz Video AI`
      );
      setIsGeneratingBrief(false);
    }, 800);
  }

  function handleUseAiBriefInPostModal() {
    setNewBriefTitle(aiPrompt.trim() || "AI Commercial Campaign");
    setNewDeliverable("3x 30s 4K Motion Deliverables + Master Seeds");
    setNewBudget("$2,500");
    setNewDeadline("In 14 days");
    setNewBriefDesc(
      `AI Commercial Campaign concept: "${aiPrompt}". Requires Runway Gen-3, Midjourney v6, and ComfyUI character consistency.`
    );
    setNewContentType("AI Video Commercial");
    setNewStyle("Cinematic Sci-Fi / Cyberpunk");
    setNewFormatAspectRatio("9:16 Vertical (Reel / TikTok / Shorts)");
    setNewCommercialUse("Full Commercial Buyout & Paid Ad Whitelisting");
    setIsCreateBriefOpen(true);
  }

  const avatarInitial = companyName.trim().charAt(0) || username.trim().charAt(0) || "B";

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-violet-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading brand workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b14] pl-16 sm:pl-20 pr-4 sm:pr-6 pb-28 pt-8 text-white">
      <BrandLeftNav />
      <div className="mx-auto max-w-5xl">
        
        {/* Desktop Header - Strictly Brand Workspace with no cross-portal leakage */}
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-400">
              Brand Workspace
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
              Brand Profile &amp; Campaigns
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <BrandHeaderNav />
            <NotificationBell role="brand" currentUsername={username} />
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Discovery Reels Banner CTA */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-[#0a0f1d] to-fuchsia-950/30 p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Discover &amp; Rate Creator Video Reels
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Watch popular and random video showcases, review tools and skills, and submit 5-star ratings to rank talent.
              </p>
            </div>
          </div>

          <Link
            href="/brand/reels"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-95"
          >
            <span>Open Discovery Reels</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Main Desktop Brand Profile Card */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 sm:p-10 shadow-xl">
          {!isEditing ? (
            /* --- DESKTOP VIEW MODE --- */
            <div>
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                {/* Standard Brand Avatar / Uploaded Logo */}
                <div className="relative shrink-0">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={companyName || "Brand Logo"}
                      className="h-28 w-28 rounded-3xl object-cover ring-2 ring-violet-500/40 shadow-xl"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-4xl font-semibold uppercase text-white shadow-lg">
                      {avatarInitial}
                    </div>
                  )}
                </div>

                {/* Brand Identity & Details */}
                <div className="flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {companyName || "Company / Brand Name"}
                      </h2>
                      <p className="mt-0.5 text-sm font-medium text-slate-400">
                        @{username || "brand_username"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMessage({ type: "", text: "" });
                          setIsEditing(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAwardProjectOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/30"
                      >
                        <Award className="h-4 w-4 text-amber-400" />
                        <span>Award Project Rating</span>
                      </button>
                    </div>
                  </div>

                  {/* Industry Specialty */}
                  {industry && (
                    <p className="mt-3 text-base font-medium text-violet-300">{industry}</p>
                  )}

                  {/* Metadata Tags */}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    {address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {address}
                      </span>
                    )}
                    {email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        {email}
                      </span>
                    )}
                    {websiteUrl && (
                      <a
                        href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-violet-400 hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Official website &rarr;
                      </a>
                    )}
                  </div>

                  {/* Brand Description */}
                  <div className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {description ||
                      "No brand overview provided yet. Click 'Edit profile' to specify your brand creative requirements and style."}
                  </div>
                </div>
              </div>

              {/* Activity Stats Box (Starts strictly at 0 until real activity occurs) */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                <div className="grid grid-cols-3 divide-x divide-white/10">
                  <div
                    onClick={() => setActiveTab("briefs")}
                    className="flex cursor-pointer flex-col items-center justify-center transition hover:opacity-85"
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Active Briefs
                    </span>
                    <span className="mt-1 text-2xl font-bold tracking-tight text-white">
                      {briefs.length}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab("shortlist")}
                    className="flex cursor-pointer flex-col items-center justify-center transition hover:opacity-85"
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Shortlisted Creators
                    </span>
                    <span className="mt-1 text-2xl font-bold tracking-tight text-white">
                      {shortlist.length}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab("awarded-projects")}
                    className="flex cursor-pointer flex-col items-center justify-center transition hover:opacity-85"
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      Awarded Projects
                    </span>
                    <span className="mt-1 text-2xl font-bold tracking-tight text-amber-300">
                      {awardedProjects.length}
                    </span>
                  </div>
                </div>
              </div>

              {message.text && (
                <div
                  className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                    message.type === "error"
                      ? "border-red-400/20 bg-red-500/10 text-red-300"
                      : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          ) : (
            /* --- DESKTOP EDIT MODE --- */
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Edit Brand Profile</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Update company information (usernames must be strictly lowercase and unique)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage({ type: "", text: "" });
                  }}
                  disabled={isSaving}
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* Brand Logo Upload Control */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-3xl font-bold uppercase text-white shadow-lg overflow-hidden ring-2 ring-white/10">
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt="Logo preview" className="h-full w-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-sm font-semibold text-white">Brand Logo / Profile Picture</h4>
                      <p className="mt-1 text-xs text-slate-400">
                        Upload your official brand logo. This will be shown on all campaign briefs, search listings, hire notifications, and collaborations.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-violet-500 transition"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>{logoUrl ? "Change Brand Logo" : "Upload Brand Logo"}</span>
                        </button>
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Company / Agency Name
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Studios"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-200">
                        Brand Username Handle
                      </label>
                      <span className="text-[11px] text-violet-400">
                        Lowercase only &bull; Globally unique
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => {
                        const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "");
                        setUsername(clean);
                      }}
                      placeholder="e.g. acme_studios"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Industry / Sector
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Consumer Electronics & Gaming"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Headquarters / Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Official Website URL
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://company.com"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Primary Contact / Manager
                    </label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g. Irfan M"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    About the Brand / Creative Needs
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your brand identity, standard deliverables, and how you collaborate with creators..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                  />
                </div>

                {message.text && (
                  <div
                    className={`rounded-xl border p-3.5 text-sm ${
                      message.type === "error"
                        ? "border-red-400/20 bg-red-500/10 text-red-300"
                        : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* Talent Search Bar Section */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">Find Specialized Creators</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Search verified AI filmmakers, 3D artists, prompt designers, and VFX artists
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by skill, e.g. Midjourney, 3D, VFX..."
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-10 pr-24 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
              />
              <button
                type="submit"
                className="absolute inset-y-1.5 right-1.5 rounded-lg bg-violet-600 px-3.5 text-xs font-semibold text-white transition hover:bg-violet-500"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* Brand Workflow & Campaign Tabs */}
        <section className="mt-12">
          {/* Section Navigation Header */}
          <div className="flex flex-col gap-4 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between pb-3">
            <div className="flex flex-wrap gap-8">
              <button
                type="button"
                onClick={() => setActiveTab("briefs")}
                className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition ${
                  activeTab === "briefs"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Campaign Briefs ({briefs.length})</span>
                {activeTab === "briefs" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("shortlist")}
                className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition ${
                  activeTab === "shortlist"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Shortlisted Creators ({shortlist.length})</span>
                {activeTab === "shortlist" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("awarded-projects")}
                className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition ${
                  activeTab === "awarded-projects"
                    ? "text-amber-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Award className="h-4 w-4 text-amber-400" />
                <span>Awarded Projects ({awardedProjects.length})</span>
                {activeTab === "awarded-projects" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ai-helper")}
                className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition ${
                  activeTab === "ai-helper"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>AI Brief Helper</span>
                {activeTab === "ai-helper" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-500" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAwardProjectOpen(true)}
                className="inline-flex w-max items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30"
              >
                <Award className="h-3.5 w-3.5" />
                <span>Award Project Rating</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateBriefOpen(true)}
                className="inline-flex w-max items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 shadow-md"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Post Brief</span>
              </button>
            </div>
          </div>

          {/* Tab Content Panes */}
          <div className="mt-8">
            {activeTab === "briefs" && (
              <div>
                {briefs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {briefs.map((brief) => (
                      <article
                        key={brief.id}
                        className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-violet-500/40 hover:bg-white/[0.05]"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-base font-semibold text-white">{brief.title}</h4>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                brief.status === "Open"
                                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                                    : brief.status === "Reviewing"
                                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                                    : "bg-slate-500/10 border border-slate-500/30 text-slate-300"
                              }`}
                            >
                              {brief.status}
                            </span>
                          </div>

                          <p className="mt-2 text-xs font-medium text-violet-300">
                            {brief.deliverable}
                          </p>

                          {/* Brief Definition Badges */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {brief.contentType && (
                              <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                                🎬 {brief.contentType}
                              </span>
                            )}
                            {brief.style && (
                              <span className="rounded-md border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300">
                                🎨 {brief.style}
                              </span>
                            )}
                            {brief.formatAspectRatio && (
                              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 font-mono">
                                📐 {brief.formatAspectRatio.split(" ")[0]}
                              </span>
                            )}
                            {brief.commercialUseRequirements && (
                              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                ⚖️ Commercial Use
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
                            {brief.description}
                          </p>
                        </div>

                        <div className="mt-6 border-t border-white/5 pt-4">
                          <div className="flex items-center justify-between text-xs text-slate-300 mb-3">
                            <span className="flex items-center gap-1 font-semibold text-white">
                              <DollarSign className="h-3.5 w-3.5 text-violet-400" />
                              {brief.budget}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="h-3.5 w-3.5" />
                              {brief.deadline}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <span className="text-xs text-slate-400">
                              <strong className="text-white">{brief.proposalsCount}</strong> proposals received
                            </span>
                            <span className="flex items-center gap-1 text-xs font-medium text-violet-400">
                              Active <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  /* Clean Empty State - Reflects 0 Active Briefs */
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-3">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-semibold text-white">No active campaign briefs yet</h4>
                    <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
                      Publish a campaign brief to outline your deliverables and budget. AI creators on the platform will review and submit customized proposals.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCreateBriefOpen(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Post Your First Brief</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* AWARDED PROJECTS TAB (Priority 1 Collaborations) */}
            {activeTab === "awarded-projects" && (
              <div>
                {awardedProjects.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {awardedProjects.map((proj) => (
                      <article
                        key={proj.id}
                        className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                              <Award className="h-3.5 w-3.5" />
                              Priority 1 Project Rating Awarded
                            </span>
                            <h4 className="text-base font-bold text-white mt-1">
                              {proj.title}
                            </h4>
                            <p className="text-xs text-slate-300">
                              Collaborator: <strong className="text-violet-300">@{proj.creatorUsername}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1 rounded-xl bg-amber-400/15 border border-amber-400/30 px-3 py-1 text-sm font-bold text-amber-300">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span>{proj.rating}.0</span>
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-white/5 bg-black/40 p-3">
                          <p className="text-xs text-slate-300">
                            <strong>Deliverable:</strong> {proj.deliverable}
                          </p>
                          {proj.reviewText && (
                            <p className="mt-2 text-xs italic text-slate-300">
                              &ldquo;{proj.reviewText}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                          <span>Budget: {proj.budget}</span>
                          <span>Completed: {new Date(proj.completedAt).toLocaleDateString()}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                      <Award className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-semibold text-white">No projects awarded yet</h4>
                    <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
                      When you finish a campaign collaboration with a creator, award their official project completion certificate and 5-star Project Rating.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAwardProjectOpen(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30"
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>Award Project Rating</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "shortlist" && (
              <div>
                {shortlist.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {shortlist.map((creator) => (
                      <article
                        key={creator.id}
                        className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-violet-500/40 hover:bg-white/[0.05]"
                      >
                        <div>
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-lg font-bold text-white shadow-md">
                              {creator.avatarLetter}
                            </div>
                            <div>
                              <h4 className="text-base font-semibold text-white">{creator.name}</h4>
                              <p className="text-xs text-slate-400">@{creator.handle}</p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-medium text-violet-300">{creator.specialty}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Rating: <strong className="text-amber-400">★ {creator.rating}</strong>
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  /* Clean Empty State - Reflects 0 Shortlisted Creators */
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-semibold text-white">No shortlisted creators yet</h4>
                    <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
                      Use the search bar above or browse Discovery Reels to find and bookmark creators matching your brand aesthetic.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ai-helper" && (
              /* AI Creative Brief Builder */
              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-transparent p-6 sm:p-8">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-violet-300 font-semibold text-base">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                    <span>AI Campaign Brief Assistant</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Describe your campaign concept or desired deliverable in plain words. Our AI assistant will outline creative scope, budget range, and technical specifications for you.
                  </p>

                  <div className="mt-5 space-y-3">
                    <textarea
                      rows={3}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. We need 3 photorealistic 3D product animation reels for our upcoming product launch."
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white outline-none transition focus:border-violet-500"
                    />

                    <button
                      type="button"
                      onClick={handleGenerateAiBrief}
                      disabled={isGeneratingBrief || !aiPrompt.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                    >
                      {isGeneratingBrief ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Generating Brief...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Generate Structured Brief</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiGeneratedOutput && (
                    <div className="mt-6 space-y-3">
                      <div className="rounded-xl border border-white/10 bg-black/40 p-5 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                        {aiGeneratedOutput}
                      </div>
                      <button
                        type="button"
                        onClick={handleUseAiBriefInPostModal}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:opacity-95 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Populate into Post Brief Form &rarr;</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ======================================================= */}
      {/* POST NEW BRIEF MODAL */}
      {/* ======================================================= */}
      {isCreateBriefOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0a0f1d] p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Campaign Creation</span>
                <h2 className="text-lg font-bold text-white">Post New Campaign Brief</h2>
                <p className="text-xs text-slate-400">Clearly captures content type, style, format/aspect ratio, and commercial-use requirements.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateBriefOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBrief} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={newBriefTitle}
                  onChange={(e) => setNewBriefTitle(e.target.value)}
                  placeholder="e.g. Commercial 3D Product Video"
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>

              {/* BRIEF DEFINITION: 4 CRITICAL ATTRIBUTES */}
              <div className="rounded-2xl border border-violet-500/20 bg-violet-950/15 p-4 space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Brief Definition &amp; Technical Specifications</span>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {/* 1. Content Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      1. Content Type
                    </label>
                    <select
                      value={newContentType}
                      onChange={(e) => setNewContentType(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#0d1424] px-3 text-xs text-white outline-none focus:border-violet-500"
                    >
                      <option value="AI Video Commercial">AI Video Commercial</option>
                      <option value="Social Media Reel / Shorts / TikTok">Social Media Reel / Shorts / TikTok</option>
                      <option value="3D Motion Graphics & VFX">3D Motion Graphics &amp; VFX</option>
                      <option value="Photorealistic Key Visual / Image Ad">Photorealistic Key Visual / Image Ad</option>
                      <option value="Explainer Video / AI Avatar">Explainer Video / AI Avatar</option>
                      <option value="Interactive / Multi-Modal Asset">Interactive / Multi-Modal Asset</option>
                    </select>
                  </div>

                  {/* 2. Visual Style */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      2. Visual Style
                    </label>
                    <select
                      value={newStyle}
                      onChange={(e) => setNewStyle(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#0d1424] px-3 text-xs text-white outline-none focus:border-violet-500"
                    >
                      <option value="Cinematic Sci-Fi / Cyberpunk">Cinematic Sci-Fi / Cyberpunk</option>
                      <option value="Photorealistic Luxury Commercial">Photorealistic Luxury Commercial</option>
                      <option value="Clean Minimalist 3D Motion">Clean Minimalist 3D Motion</option>
                      <option value="Vibrant Anime / Stylized Illustration">Vibrant Anime / Stylized Illustration</option>
                      <option value="Editorial Studio / Fashion High-Gloss">Editorial Studio / Fashion High-Gloss</option>
                      <option value="Documentary Tech & Data Visualization">Documentary Tech &amp; Data Visualization</option>
                    </select>
                  </div>

                  {/* 3. Format / Aspect Ratio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      3. Format / Aspect Ratio
                    </label>
                    <select
                      value={newFormatAspectRatio}
                      onChange={(e) => setNewFormatAspectRatio(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#0d1424] px-3 text-xs text-white outline-none focus:border-violet-500 font-mono"
                    >
                      <option value="9:16 Vertical (Reel / TikTok / Shorts)">9:16 Vertical (Reel / TikTok / Shorts)</option>
                      <option value="16:9 Landscape (YouTube / Desktop / Web)">16:9 Landscape (YouTube / Desktop / Web)</option>
                      <option value="1:1 Square (Feed & Carousel)">1:1 Square (Feed &amp; Carousel)</option>
                      <option value="4:5 Portrait (Instagram / LinkedIn Feed)">4:5 Portrait (Instagram / LinkedIn Feed)</option>
                      <option value="21:9 Ultrawide (Cinematic Teaser)">21:9 Ultrawide (Cinematic Teaser)</option>
                    </select>
                  </div>

                  {/* 4. Commercial-Use Requirements */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      4. Commercial-Use Requirements
                    </label>
                    <select
                      value={newCommercialUse}
                      onChange={(e) => setNewCommercialUse(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#0d1424] px-3 text-xs text-white outline-none focus:border-violet-500"
                    >
                      <option value="Full Commercial Buyout & Paid Ad Whitelisting">Full Commercial Buyout &amp; Paid Ad Whitelisting</option>
                      <option value="Paid Digital Ads (Meta / TikTok / Google - 12 Months)">Paid Digital Ads (Meta / TikTok / Google - 12 Months)</option>
                      <option value="Organic Social Media Distribution Only">Organic Social Media Distribution Only</option>
                      <option value="Broadcast Television & Global Digital OOH">Broadcast Television &amp; Global Digital OOH</option>
                      <option value="Strict AI Training Exclusion & ComfyUI / Prompt Asset Handoff">Strict AI Training Exclusion &amp; ComfyUI / Prompt Asset Handoff</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Deliverable</label>
                  <input
                    type="text"
                    required
                    value={newDeliverable}
                    onChange={(e) => setNewDeliverable(e.target.value)}
                    placeholder="e.g. 60s 4K Video + Assets"
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300">Budget ($)</label>
                  <input
                    type="text"
                    required
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="e.g. $1,500"
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-violet-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Deadline</label>
                <input
                  type="text"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  placeholder="e.g. In 14 days"
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Brief Scope &amp; Creative Guidelines</label>
                <textarea
                  rows={3}
                  value={newBriefDesc}
                  onChange={(e) => setNewBriefDesc(e.target.value)}
                  placeholder="Detail the creative vision, required tool stacks, LoRA consistency, and guidelines..."
                  className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateBriefOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition hover:opacity-95"
                >
                  Publish Defined Brief &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* AWARD COMPLETED PROJECT & RATING MODAL (Priority 1)     */}
      {/* ======================================================= */}
      {isAwardProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-[#0a0f1d] p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Award className="h-4 w-4" />
                  <span>Priority 1: Project Rating</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  Award Completed Project to Creator
                </h2>
                <p className="text-xs text-slate-400">
                  Certify a completed brand collaboration and award their Priority 1 Project Rating
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAwardProjectOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {awardSuccessMsg ? (
              <div className="my-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-2" />
                <h4 className="text-base font-bold text-white">Project Rating Awarded!</h4>
                <p className="text-xs text-slate-300 mt-1">{awardSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleAwardProject} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Creator Username (e.g. alex_ai)
                  </label>
                  <input
                    type="text"
                    required
                    value={awardCreatorUsername}
                    onChange={(e) => setAwardCreatorUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. alex_ai"
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Project Deliverable Title
                  </label>
                  <input
                    type="text"
                    required
                    value={awardProjectTitle}
                    onChange={(e) => setAwardProjectTitle(e.target.value)}
                    placeholder="e.g. National 3D Commercial Campaign"
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Deliverable Description
                    </label>
                    <input
                      type="text"
                      required
                      value={awardDeliverable}
                      onChange={(e) => setAwardDeliverable(e.target.value)}
                      placeholder="e.g. 3x 4K Video Reels"
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Budget Paid ($)
                    </label>
                    <input
                      type="text"
                      value={awardBudget}
                      onChange={(e) => setAwardBudget(e.target.value)}
                      placeholder="e.g. $3,500"
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Rating 1 to 5 Stars */}
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Project Rating (Priority 1)
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setAwardRating(star)}
                        className="flex flex-col items-center transition active:scale-125"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= awardRating
                              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                              : "text-slate-600 fill-transparent"
                          }`}
                        />
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {star}★
                        </span>
                      </button>
                    ))}
                    <span className="ml-3 text-sm font-bold text-amber-300">
                      {awardRating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Written Testimonial / Performance Review
                  </label>
                  <textarea
                    rows={3}
                    value={awardReviewText}
                    onChange={(e) => setAwardReviewText(e.target.value)}
                    placeholder="Describe their creative excellence, delivery speed, and professionalism..."
                    className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAwardProjectOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 text-slate-950 font-bold px-5 py-2 text-xs shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
                  >
                    Submit Project Award
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}