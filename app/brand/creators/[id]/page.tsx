"use client";

import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLeftNav, BrandHeaderNav } from "@/components/brand-navigation";
import {
  CompletedProject,
  getCreatorCollabs,
  getCreatorProjects,
  getCreatorRatingsSummary,
  getMarketplacePosts,
  MarketplacePost,
  sendHireProposal,
} from "@/lib/marketplace-store";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  Film,
  FolderGit2,
  Heart,
  MessageSquare,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";

type CreatorProfileData = {
  id: string;
  username: string;
  displayName: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string;
  portfolioUrl?: string;
  avatarUrl?: string;
};

function CreatorProfileContent() {
  const params = useParams();
  const identifier = (params?.id as string) || "";

  const [creator, setCreator] = useState<CreatorProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Creator's Works
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [collabs, setCollabs] = useState<CompletedProject[]>([]);
  const [ratingsSummary, setRatingsSummary] = useState({
    projectRating: 0,
    completedProjectsCount: 0,
    hasProjectRating: false,
    postRating: 0,
    postRatingsCount: 0,
    totalPostsCount: 0,
    hasPostRating: false,
    overallRating: 0,
    totalEvaluations: 0,
  });

  // Modals State
  const [selectedItem, setSelectedItem] = useState<{
    type: "project" | "post" | "collab";
    data: MarketplacePost | CompletedProject;
  } | null>(null);

  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<{
    id: string;
    username: string;
    companyName: string;
    logoUrl?: string;
  }>({
    id: "active-brand",
    username: "acme_studios",
    companyName: "Acme Studios Worldwide",
  });
  const [hireForm, setHireForm] = useState({
    projectTitle: "",
    scope: "",
    budget: "$2,500",
    timeline: "2 weeks",
    message: "",
    similarToTitle: "",
    contentType: "AI Video Commercial",
    style: "Cinematic Sci-Fi / Cyberpunk",
    formatAspectRatio: "9:16 Vertical (Reel / TikTok / Shorts)",
    commercialUseRequirements: "Full Commercial Buyout & Paid Ad Whitelisting",
  });
  const [hireSubmitted, setHireSubmitted] = useState(false);

  useEffect(() => {
    async function loadCreatorData() {
      setLoading(true);
      const cleanId = identifier.trim().toLowerCase().replace(/^@/, "");

      // Check current logged in brand user
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const meta = user.user_metadata || {};
          const bUser = (meta.username || "").toLowerCase();
          const bName = meta.role_specific_name || meta.display_name || bUser || "My Brand";
          const bLogo = typeof window !== "undefined" && bUser ? localStorage.getItem(`brand_avatar_${bUser}`) || meta.avatar_url : meta.avatar_url;
          if (bUser) {
            setCurrentBrand({
              id: user.id,
              username: bUser,
              companyName: bName,
              logoUrl: bLogo,
            });
          }
        } else if (typeof window !== "undefined") {
          const rawActive = localStorage.getItem("ai_marketplace_active_user");
          if (rawActive) {
            const parsed = JSON.parse(rawActive);
            if (parsed.username && parsed.role === "brand") {
              setCurrentBrand({
                id: parsed.id || "active-brand",
                username: parsed.username.toLowerCase(),
                companyName: parsed.roleSpecificName || parsed.name || parsed.username,
                logoUrl: localStorage.getItem(`brand_avatar_${parsed.username.toLowerCase()}`) || undefined,
              });
            }
          }
        }
      } catch (e) {
        console.warn("Could not detect logged in brand:", e);
      }

      // 1. Check Supabase profiles
      const supabase = createClient();
      let foundProfile: CreatorProfileData | null = null;

      try {
        const { data: byUsername } = await supabase
          .from("profiles")
          .select("id, username, email, bio, location, skills, portfolio_url, headline, display_name, role_specific_name")
          .eq("username", cleanId)
          .maybeSingle();

        if (byUsername) {
          foundProfile = {
            id: byUsername.id,
            username: byUsername.username,
            displayName: byUsername.display_name || byUsername.username,
            headline: byUsername.headline || byUsername.role_specific_name || "AI Creative Specialist",
            bio: byUsername.bio || "Crafting next-generation AI visuals, commercial video campaigns, and synthetic assets.",
            location: byUsername.location || "Global Remote",
            skills: byUsername.skills || "Runway Gen-3, Midjourney v6, ComfyUI, Prompt Engineering",
            portfolioUrl: byUsername.portfolio_url,
          };
        } else {
          // Try UUID lookup
          const { data: byId } = await supabase
            .from("profiles")
            .select("id, username, email, bio, location, skills, portfolio_url, headline, display_name, role_specific_name")
            .eq("id", cleanId)
            .maybeSingle();

          if (byId) {
            foundProfile = {
              id: byId.id,
              username: byId.username,
              displayName: byId.display_name || byId.username,
              headline: byId.headline || byId.role_specific_name || "AI Creative Specialist",
              bio: byId.bio || "Crafting next-generation AI visuals, commercial video campaigns, and synthetic assets.",
              location: byId.location || "Global Remote",
              skills: byId.skills || "Runway Gen-3, Midjourney v6, ComfyUI, Prompt Engineering",
              portfolioUrl: byId.portfolio_url,
            };
          }
        }
      } catch (err) {
        console.warn("Supabase profile fetch error:", err);
      }

      // Fallback fallback profiles if not found in DB
      if (!foundProfile) {
        if (cleanId === "alex_ai" || cleanId.includes("alex")) {
          foundProfile = {
            id: "creator-alex",
            username: "alex_ai",
            displayName: "Alex Vance",
            headline: "AI Film Director & Worldbuilder",
            bio: "Specializing in cinematic sci-fi commercial storytelling, generative video direction, and fine-tuned LoRA styling.",
            location: "San Francisco, CA",
            skills: "Runway Gen-3, Midjourney v6, ComfyUI, Topaz Video AI, Prompt Engineering",
          };
        } else if (cleanId === "irfuu_20" || cleanId.includes("irfuu_20")) {
          foundProfile = {
            id: "ce4c4f17-a556-4bd4-9889-ce57633d25aa",
            username: "irfuu_20",
            displayName: "Irfan M",
            headline: "AI & Cybersecurity Content Specialist",
            bio: "Bridging cutting-edge GenAI motion design with enterprise tech narratives and high-conversion social content.",
            location: "Chennai, India",
            skills: "AI Content Writing, AI Video Generation, Prompt Engineering, Runway Gen-3",
          };
        } else if (cleanId === "irfuu_29" || cleanId.includes("irfuu_29")) {
          foundProfile = {
            id: "fe099576-f5f6-40b6-a875-25ba2ca99dc5",
            username: "irfuu_29",
            displayName: "Irfan M",
            headline: "3D Motion & Generative Art Director",
            bio: "Experimenting with latent space transitions, biomorphic architectures, and neural product visuals.",
            location: "Chennai, India",
            skills: "AI Image Generation, Prompt Engineering, 3D Motion, ComfyUI",
          };
        } else {
          // Generic placeholder for any searched creator
          foundProfile = {
            id: cleanId,
            username: cleanId,
            displayName: cleanId.charAt(0).toUpperCase() + cleanId.slice(1),
            headline: "AI Creative Professional",
            bio: "Specialized in AI-assisted video workflows, prompt engineering, and visual media production.",
            location: "Remote",
            skills: "Prompt Engineering, AI Video Generation, Midjourney v6",
          };
        }
      }

      if (foundProfile && typeof window !== "undefined") {
        const u = foundProfile.username.toLowerCase();
        const savedAvatar = localStorage.getItem(`creator_avatar_${u}`) || localStorage.getItem(`creator_avatar_${cleanId}`);
        if (savedAvatar) {
          foundProfile.avatarUrl = savedAvatar;
        }
      }

      setCreator(foundProfile);

      // Load Works & Ratings
      const uname = foundProfile.username;
      const allPosts = getMarketplacePosts();
      const creatorPosts = allPosts.filter(
        (p) => p.creatorUsername.toLowerCase().replace(/^@/, "") === uname.toLowerCase()
      );
      const creatorProjects = getCreatorProjects(uname);
      const creatorCollabs = getCreatorCollabs(uname);
      const ratings = getCreatorRatingsSummary(uname);

      setPosts(creatorPosts);
      setProjects(creatorProjects);
      setCollabs(creatorCollabs);
      setRatingsSummary(ratings);

      setLoading(false);
    }

    loadCreatorData();
  }, [identifier]);

  // Open Hire Modal with optional project prefill
  function handleOpenHireModal(similarTitle?: string) {
    if (similarTitle) {
      setHireForm((prev) => ({
        ...prev,
        projectTitle: `Similar to: ${similarTitle}`,
        similarToTitle: similarTitle,
        scope: `Produce deliverables matching the aesthetic and pipeline of "${similarTitle}".`,
      }));
    }
    setHireSubmitted(false);
    setIsHireModalOpen(true);
  }

  function handleHireSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!creator) return;

    sendHireProposal({
      creatorUsername: creator.username,
      brandId: currentBrand.id,
      brandName: currentBrand.companyName,
      brandUsername: currentBrand.username,
      projectTitle: hireForm.projectTitle,
      scope: hireForm.scope,
      budget: hireForm.budget,
      timeline: hireForm.timeline,
      message: hireForm.message,
      similarToTitle: hireForm.similarToTitle || undefined,
      contentType: hireForm.contentType,
      style: hireForm.style,
      formatAspectRatio: hireForm.formatAspectRatio,
      commercialUseRequirements: hireForm.commercialUseRequirements,
    });

    setHireSubmitted(true);
    setTimeout(() => {
      setIsHireModalOpen(false);
      setHireSubmitted(false);
    }, 2200);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <span>Loading creator profile...</span>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white p-8">
        <div className="mx-auto max-w-xl text-center py-20">
          <h2 className="text-xl font-bold">Creator Not Found</h2>
          <p className="mt-2 text-xs text-slate-400">Could not find a creator matching &ldquo;{identifier}&rdquo;.</p>
          <Link
            href="/brand/creators"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Creator Search
          </Link>
        </div>
      </div>
    );
  }

  // Exact counts matching handwritten sketch
  const projectCount = projects.length;
  const postCount = posts.length;
  const collabCount = collabs.length;

  // Handwritten note conditional rule:
  // "if project not done dont show project section in view"
  // "if post also not done then show 'Nothing done yet' don't show project and post heading"
  const hasProjects = projectCount > 0;
  const hasPosts = postCount > 0;
  const hasCollabs = collabCount > 0;
  const hasZeroWork = !hasProjects && !hasPosts;

  return (
    <div className="min-h-screen bg-[#070b14] text-white antialiased pl-16 sm:pl-20 pr-4 sm:pr-6 pb-28">
      <BrandLeftNav />
      {/* Top Global Brand Navigation */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-xl px-6 py-3.5 shadow-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/brand/creators"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Search</span>
            </Link>
            <span className="hidden sm:inline text-xs text-slate-500">|</span>
            <span className="hidden sm:inline text-xs font-semibold text-violet-300">Creator Dossier</span>
          </div>

          <BrandHeaderNav />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">

        {/* ============================================================== */}
        {/* 1. RATINGS HEADER CAPSULE (FROM HANDWRITTEN SKETCH TOP BAR)   */}
        {/* ============================================================== */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/20 to-violet-500/20 border border-amber-500/30 text-amber-300">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Evaluation Summary
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white">
                  {ratingsSummary.overallRating > 0 ? `${ratingsSummary.overallRating.toFixed(1)} / 5.0` : "New Talent"}
                </span>
                <span className="text-xs text-slate-400">
                  ({ratingsSummary.totalEvaluations} verified brand evaluations)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Priority 1 Project Rating */}
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-semibold text-amber-300">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>
                Priority 1 (Project): {ratingsSummary.hasProjectRating ? `${ratingsSummary.projectRating.toFixed(1)}★` : "Unrated"}
              </span>
            </div>

            {/* Priority 2 Reel Rating */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-slate-200">
              <Film className="h-3.5 w-3.5 text-violet-400" />
              <span>
                Priority 2 (Reel): {ratingsSummary.hasPostRating ? `${ratingsSummary.postRating.toFixed(1)}★` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. IDENTITY CARD & QUICK STATS (MATCHING HANDWRITTEN SKETCH)   */}
        {/* Photo, Name, username, bio, [Hire] Button, [Project 00] [Post 01] */}
        {/* ============================================================== */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8 shadow-2xl ring-1 ring-white/5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            
            {/* Left: Circle Photo + Name + Username + Bio */}
            <div className="flex items-start gap-5">
              {/* Profile Photo (Circle as in Sketch) */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-500 text-3xl font-bold text-white shadow-xl ring-4 ring-white/10 overflow-hidden">
                {creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.avatarUrl} alt={creator.displayName} className="h-full w-full object-cover" />
                ) : (
                  creator.username.charAt(0).toUpperCase()
                )}
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-[#070b14]" title="Available Now">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">{creator.displayName}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/40 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                    <ShieldCheck className="h-3 w-3 text-violet-400" />
                    Verified Creator
                  </span>
                </div>

                <p className="text-xs font-semibold text-violet-300 mt-0.5">@{creator.username}</p>

                {/* Short Tagline (Niche) */}
                <p className="mt-1 text-sm font-medium text-slate-200">{creator.headline}</p>

                {/* Bio */}
                <p className="mt-2 text-xs leading-relaxed text-slate-400 max-w-2xl">{creator.bio}</p>

                {/* Location & Response Badge */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    Available now &bull; Typical response &lt; 2 hrs
                  </span>
                  <span>&bull;</span>
                  <span>{creator.location}</span>
                </div>
              </div>
            </div>

            {/* Right: [Hire] Button (Highlighted in Sketch: "Button to hire the creator") */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenHireModal()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/25 transition hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]"
              >
                <Zap className="h-4 w-4 fill-white" />
                <span>Hire Creator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Profile link copied to clipboard!");
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>

          {/* Quick Stats: [ Project | 00 ] and [ Post | 01 ] (Exactly as drawn in Sketch) */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
            
            {/* Project Box (from sketch: [ Project | 00 ]) */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project</span>
                <p className="text-[10px] text-amber-400/90 font-medium">Verified Awards</p>
              </div>
              <span className="text-2xl font-mono font-bold text-amber-300">
                {String(projectCount).padStart(2, "0")}
              </span>
            </div>

            {/* Post Box (from sketch: [ Post | 01 ]) */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Post</span>
                <p className="text-[10px] text-violet-300/90 font-medium">Reels &amp; Work</p>
              </div>
              <span className="text-2xl font-mono font-bold text-violet-300">
                {String(postCount).padStart(2, "0")}
              </span>
            </div>

            {/* Collabs Count */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collabs</span>
                <p className="text-[10px] text-emerald-400/90 font-medium">Completed</p>
              </div>
              <span className="text-2xl font-mono font-bold text-emerald-300">
                {String(collabCount).padStart(2, "0")}
              </span>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. PORTFOLIO GRID (3-COLUMN LAYOUT) & CONDITIONAL LOGIC        */}
        {/* Rule 1: if project not done dont show project section in view */}
        {/* Rule 2: if post also not done then show "Nothing done yet"    */}
        {/* ============================================================== */}
        <section className="mt-10">
          
          {/* Conditional Branch 1: BOTH ZERO WORK -> Show "Nothing done yet" without headings */}
          {hasZeroWork ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.015] py-20 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
                <FolderGit2 className="h-7 w-7 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Nothing done yet</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                This creator has not published any projects or showcase posts yet. You can still initiate contact or invite them to a campaign brief.
              </p>
              <button
                type="button"
                onClick={() => handleOpenHireModal()}
                className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-violet-500 transition"
              >
                Send Direct Brief &rarr;
              </button>
            </div>
          ) : (
            <>
              {/* Dynamic Grid Layout:
                  - If hasProjects, hasPosts, hasCollabs -> 3 Columns
                  - If !hasProjects (e.g. project not done), project section is HIDDEN! Posts and Collabs take the stage.
              */}
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span>Creator Portfolio &amp; Deliverables</span>
                </h2>
                <span className="text-xs text-slate-400">
                  {hasProjects ? "Projects &bull; Posts &bull; Collabs" : "Showcase Posts &bull; Collaborations"}
                </span>
              </div>

              <div className={`grid grid-cols-1 gap-6 ${hasProjects ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
                
                {/* -------------------------------------------------------- */}
                {/* COLUMN 1: PROJECTS (HIDDEN IF PROJECT COUNT IS 0)       */}
                {/* -------------------------------------------------------- */}
                {hasProjects && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5" />
                        <span>Column 1: Projects ({projectCount})</span>
                      </span>
                    </div>

                    <div className="space-y-4">
                      {projects.map((proj) => (
                        <article
                          key={proj.id}
                          onClick={() => setSelectedItem({ type: "project", data: proj })}
                          className="group cursor-pointer rounded-2xl border border-amber-500/20 bg-amber-500/[0.035] p-5 transition hover:border-amber-400/50 hover:bg-amber-500/[0.08]"
                        >
                          <div className="flex items-start justify-between">
                            <span className="rounded-lg bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                              Priority 1 Project
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span>{proj.rating.toFixed(1)}</span>
                            </div>
                          </div>

                          <h3 className="mt-2 text-sm font-bold text-white group-hover:text-amber-200 transition">
                            {proj.title}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                            {proj.description}
                          </p>

                          <div className="mt-3 rounded-xl border border-white/5 bg-black/40 p-2.5 text-[11px] text-slate-300">
                            <strong>Deliverable:</strong> {proj.deliverable}
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                            <span>Client: <strong>{proj.brandName}</strong></span>
                            <span className="text-amber-400 font-semibold group-hover:underline">Details &rarr;</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* COLUMN 2: POSTS (VIDEO REELS / AI MEDIA WITH 5-STARS)   */}
                {/* Matching sketch: "Preview of work" + 5 stars rating      */}
                {/* -------------------------------------------------------- */}
                {hasPosts && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                        <Film className="h-3.5 w-3.5" />
                        <span>Column 2: Posts ({postCount})</span>
                      </span>
                    </div>

                    <div className="space-y-4">
                      {posts.map((post) => (
                        <article
                          key={post.id}
                          onClick={() => setSelectedItem({ type: "post", data: post })}
                          className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.035] overflow-hidden transition hover:border-violet-500/50 hover:bg-white/[0.06]"
                        >
                          {/* Preview of Work Container (from Sketch) */}
                          <div className="relative aspect-video w-full bg-black overflow-hidden">
                            <video
                              src={post.mediaUrl}
                              playsInline
                              muted
                              loop
                              className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute top-2.5 right-2.5 rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                              {post.category}
                            </div>
                            <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1">
                              <Eye className="h-3 w-3 text-slate-300" />
                              <span>{(post.views || 45200).toLocaleString()} views</span>
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="text-sm font-bold text-white group-hover:text-violet-200 transition">
                              {post.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                              {post.description}
                            </p>

                            {/* 5-Star Rating Row (from Sketch: ★★★★★ -> 3.8 / average) */}
                            <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-white/10">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3.5 w-3.5 ${
                                      s <= Math.round(post.averageRating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-slate-600"
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-xs font-bold text-amber-300">
                                  {post.averageRating.toFixed(1)}
                                </span>
                              </div>

                              <span className="text-[11px] text-violet-300 font-semibold group-hover:underline">
                                Inspect &rarr;
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* COLUMN 3: COLLABS (COMPLETED BRAND COLLABORATIONS)       */}
                {/* -------------------------------------------------------- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>Column 3: Collabs ({collabCount})</span>
                    </span>
                  </div>

                  {hasCollabs ? (
                    <div className="space-y-4">
                      {collabs.map((collab) => (
                        <article
                          key={collab.id}
                          onClick={() => setSelectedItem({ type: "collab", data: collab })}
                          className="group cursor-pointer rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.035] p-5 transition hover:border-emerald-400/50 hover:bg-emerald-500/[0.08]"
                        >
                          <div className="flex items-start justify-between">
                            <span className="rounded-lg bg-emerald-400/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                              Brand Collab
                            </span>
                            <span className="text-xs font-semibold text-slate-300">
                              {collab.budget || "$3,000+"}
                            </span>
                          </div>

                          <h3 className="mt-2 text-sm font-bold text-white group-hover:text-emerald-200 transition">
                            {collab.title}
                          </h3>

                          <p className="mt-2 text-xs italic text-slate-300 line-clamp-2">
                            &ldquo;{collab.reviewText}&rdquo;
                          </p>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                            <span>Partner: <strong className="text-slate-200">@{collab.brandUsername}</strong></span>
                            <span className="text-emerald-400 font-semibold group-hover:underline">Review &rarr;</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-xs text-slate-400">
                      No brand collabs completed yet. Be the first brand to collaborate with this creator!
                    </div>
                  )}
                </div>

              </div>
            </>
          )}

        </section>

        {/* ============================================================== */}
        {/* 4. SKILLS & STRENGTHS                                          */}
        {/* ============================================================== */}
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-violet-400" />
            <span>Skills &amp; Technical Strengths</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-xs font-medium text-slate-400">AI Video Generation</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-white">98% Strength</span>
                <span className="text-xs text-violet-300 font-mono">Runway Gen-3</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600" style={{ width: "98%" }} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-xs font-medium text-slate-400">Prompt Engineering</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-white">95% Strength</span>
                <span className="text-xs text-violet-300 font-mono">Multi-modal</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600" style={{ width: "95%" }} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-xs font-medium text-slate-400">LoRA &amp; Character Consistency</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-white">92% Strength</span>
                <span className="text-xs text-violet-300 font-mono">ComfyUI</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600" style={{ width: "92%" }} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-xs font-medium text-slate-400">Commercial Pacing &amp; Audio</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-white">90% Strength</span>
                <span className="text-xs text-violet-300 font-mono">ElevenLabs</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600" style={{ width: "90%" }} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-white/5 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Tools Applied:</span>
            {creator.skills?.split(",").map((tool) => (
              <span key={tool} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-violet-200">
                {tool.trim()}
              </span>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. COLLABORATION HISTORY & CERTIFIED AWARDS                    */}
        {/* ============================================================== */}
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-amber-400" />
            <span>Collaboration History &amp; Testimonials</span>
          </h2>

          {hasCollabs ? (
            <div className="space-y-4">
              {collabs.map((collab) => (
                <div
                  key={collab.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{collab.title}</h4>
                      <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        ★ {collab.rating.toFixed(1)} Certified
                      </span>
                    </div>
                    <p className="mt-1 text-xs italic text-slate-300">&ldquo;{collab.reviewText}&rdquo;</p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Commissioned by <strong>{collab.brandName}</strong> (@{collab.brandUsername})
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-emerald-400">{collab.budget || "$3,500"}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenHireModal(collab.title)}
                      className="rounded-xl border border-violet-500/30 bg-violet-600/15 px-3.5 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition"
                    >
                      Hire for Similar Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-xs text-slate-400">
              No collaboration history recorded yet.
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* 6. CONTACT & HIRE (PRIMARY CTA)                                */}
        {/* ============================================================== */}
        <section className="mt-12 rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-black p-8 sm:p-10 shadow-2xl text-center">
          <div className="mx-auto max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Available for New Campaigns
            </span>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Ready to collaborate with {creator.displayName}?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Submit your project brief directly. Your proposal is protected with milestone escrows and evaluated through Priority 1 Project Rating upon successful completion.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleOpenHireModal()}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/25 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="h-4 w-4 fill-white" />
                <span>Hire Creator Now</span>
              </button>

              <Link
                href="/brand/creators"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                Explore Other Creators
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ============================================================== */}
      {/* MODAL: PROJECT / POST DETAILS (WHEN CLICKED)                   */}
      {/* Shows Metrics: Views, Likes, Comments, Collab Requests        */}
      {/* + "Hire for similar project" button                            */}
      {/* ============================================================== */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative flex h-[620px] w-full max-w-2xl flex-col rounded-3xl border border-white/15 bg-[#0a0f1d] shadow-2xl text-white overflow-hidden ring-1 ring-white/10">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  {selectedItem.type === "project" ? "Verified Project" : selectedItem.type === "post" ? "Showcase Post" : "Collaboration"}
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedItem.data.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Media Preview if Post */}
              {"mediaUrl" in selectedItem.data && (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                  <video src={selectedItem.data.mediaUrl} controls className="h-full w-full object-cover" />
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Description &amp; Workflow</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {selectedItem.data.description}
                </p>
              </div>

              {/* METRICS GRID (REQUESTED BY USER) */}
              {/* Views, Likes, Comments, Collab Requests */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Performance Metrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <Eye className="mx-auto h-4 w-4 text-violet-400 mb-1" />
                    <span className="text-xs text-slate-400 block">Views</span>
                    <span className="text-sm font-bold text-white">
                      {(selectedItem.data.views || 45200).toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <Heart className="mx-auto h-4 w-4 text-rose-400 mb-1" />
                    <span className="text-xs text-slate-400 block">Likes</span>
                    <span className="text-sm font-bold text-white">
                      {(selectedItem.data.likes || 3840).toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <MessageSquare className="mx-auto h-4 w-4 text-amber-400 mb-1" />
                    <span className="text-xs text-slate-400 block">Comments</span>
                    <span className="text-sm font-bold text-white">
                      {(selectedItem.data.comments || 215).toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <Users className="mx-auto h-4 w-4 text-emerald-400 mb-1" />
                    <span className="text-xs text-slate-400 block">Collab Requests</span>
                    <span className="text-sm font-bold text-white">
                      {selectedItem.data.collabRequests || 6}
                    </span>
                  </div>

                </div>
              </div>

              {/* Tools & Skills if post */}
              {"toolsUsed" in selectedItem.data && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">Tools &amp; Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.data.toolsUsed.map((t) => (
                      <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-violet-300">
                        {t}
                      </span>
                    ))}
                    {selectedItem.data.skillsApplied.map((s) => (
                      <span key={s} className="rounded-md border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] text-fuchsia-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Review text if project/collab */}
              {"reviewText" in selectedItem.data && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <strong>Brand Review:</strong> &ldquo;{selectedItem.data.reviewText}&rdquo;
                </div>
              )}

            </div>

            {/* Modal Footer with "Hire for similar project" button */}
            <div className="flex items-center justify-between border-t border-white/10 bg-black/40 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const title = selectedItem.data.title;
                  setSelectedItem(null);
                  handleOpenHireModal(title);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:opacity-95"
              >
                <Zap className="h-3.5 w-3.5 fill-white" />
                <span>Hire for similar project</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: HIRE CREATOR / CAMPAIGN BRIEF FORM                     */}
      {/* ============================================================== */}
      {isHireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0a0f1d] p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Campaign Brief Offer</span>
                <h3 className="text-lg font-bold text-white">Hire @{creator.username}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHireModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {hireSubmitted ? (
              <div className="py-12 text-center animate-in zoom-in-95">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-white">Proposal Sent!</h4>
                <p className="mt-1 text-xs text-slate-300">
                  Your project brief and offer of {hireForm.budget} has been delivered to @{creator.username}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleHireSubmit} className="mt-5 space-y-4">
                {hireForm.similarToTitle && (
                  <div className="rounded-xl border border-violet-500/30 bg-violet-600/15 p-3 text-xs text-violet-200">
                    <strong>Reference Work:</strong> &ldquo;{hireForm.similarToTitle}&rdquo;
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Project / Campaign Title
                  </label>
                  <input
                    type="text"
                    required
                    value={hireForm.projectTitle}
                    onChange={(e) => setHireForm({ ...hireForm, projectTitle: e.target.value })}
                    placeholder="e.g. Q4 Futuristic Brand Reel Series"
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Deliverables &amp; Scope
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={hireForm.scope}
                    onChange={(e) => setHireForm({ ...hireForm, scope: e.target.value })}
                    placeholder="Describe needed video assets, keyframes, character LoRAs, or references..."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                {/* BRIEF DEFINITION: 4 ESSENTIAL CRITERIA */}
                <div className="rounded-2xl border border-violet-500/20 bg-violet-950/15 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Brief Definition &amp; Requirements</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* 1. Content Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">
                        1. Content Type
                      </label>
                      <select
                        value={hireForm.contentType}
                        onChange={(e) => setHireForm({ ...hireForm, contentType: e.target.value })}
                        className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-[#0d1424] px-3 text-xs text-white outline-none focus:border-violet-500"
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
                        value={hireForm.style}
                        onChange={(e) => setHireForm({ ...hireForm, style: e.target.value })}
                        className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-[#0d1424] px-3 text-xs text-white outline-none focus:border-violet-500"
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
                        value={hireForm.formatAspectRatio}
                        onChange={(e) => setHireForm({ ...hireForm, formatAspectRatio: e.target.value })}
                        className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-[#0d1424] px-3 text-xs text-white outline-none focus:border-violet-500 font-mono"
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
                        value={hireForm.commercialUseRequirements}
                        onChange={(e) => setHireForm({ ...hireForm, commercialUseRequirements: e.target.value })}
                        className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-[#0d1424] px-3 text-xs text-white outline-none focus:border-violet-500"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Budget Offer ($)
                    </label>
                    <input
                      type="text"
                      required
                      value={hireForm.budget}
                      onChange={(e) => setHireForm({ ...hireForm, budget: e.target.value })}
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white outline-none focus:border-violet-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Expected Timeline
                    </label>
                    <input
                      type="text"
                      required
                      value={hireForm.timeline}
                      onChange={(e) => setHireForm({ ...hireForm, timeline: e.target.value })}
                      placeholder="e.g. 2 weeks"
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Personalized Message
                  </label>
                  <textarea
                    rows={2}
                    value={hireForm.message}
                    onChange={(e) => setHireForm({ ...hireForm, message: e.target.value })}
                    placeholder="Tell the creator why you'd love to work with them..."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsHireModalOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:opacity-95"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Proposal &rarr;</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatorProfileViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <span>Loading creator profile...</span>
          </div>
        </div>
      }
    >
      <CreatorProfileContent />
    </Suspense>
  );
}
