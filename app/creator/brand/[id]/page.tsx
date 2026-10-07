"use client";

import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { NotificationBell } from "@/components/notification-bell";
import {
  BrandCampaignItem,
  BrandPostItem,
  BrandProfileDetails,
  CompletedProject,
  getBrandProfile,
} from "@/lib/marketplace-store";
import {
  ArrowLeft,
  Briefcase,
  Eye,
  Globe,
  Layers,
  MapPin,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

function CreatorBrandViewContent() {
  const params = useParams();
  const identifier = (params?.id as string) || "acme_studios";

  const [brand, setBrand] = useState<BrandProfileDetails | null>(null);
  const [selectedItem, setSelectedItem] = useState<{
    type: "brief" | "post" | "collab";
    data: BrandCampaignItem | BrandPostItem | CompletedProject;
  } | null>(null);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    targetTitle: "",
    pitch: "I specialize in generative AI video storytelling and consistent character LoRA models.",
    deliverable: "4x 30s High-Res 4K Reels",
    proposedRate: "$3,500",
    portfolioUrl: "https://my-creator-portfolio.com",
  });
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const data = getBrandProfile(identifier);
    setBrand(data);
  }, [identifier]);

  if (!brand) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  function handleOpenApplyModal(campaignTitle?: string) {
    if (campaignTitle) {
      setApplyForm((prev) => ({
        ...prev,
        targetTitle: campaignTitle,
      }));
    } else {
      setApplyForm((prev) => ({
        ...prev,
        targetTitle: "General Collaboration Application",
      }));
    }
    setApplySuccess(false);
    setIsApplyModalOpen(true);
  }

  function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    setApplySuccess(true);
    setTimeout(() => {
      setIsApplyModalOpen(false);
      setApplySuccess(false);
    }, 2200);
  }

  const hasBriefs = brand.briefs && brand.briefs.length > 0;
  const hasPosts = brand.posts && brand.posts.length > 0;
  const hasCollabs = brand.collabs && brand.collabs.length > 0;

  return (
    <div className="min-h-screen bg-[#070b14] text-white antialiased pb-28">
      
      {/* Top Global Header Bar */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-xl px-6 py-3.5 shadow-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/creator/profile"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Creator Profile</span>
            </Link>
            <span className="hidden sm:inline text-xs text-slate-500">|</span>
            <span className="hidden sm:inline text-xs font-semibold text-violet-300">
              Brand Profile (Creator View)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell with Hire Briefs */}
            <NotificationBell role="creator" currentUsername="creator_user" />

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Brand profile link copied!");
              }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">

        {/* ============================================================== */}
        {/* 1. IDENTITY SECTION (FROM HANDWRITTEN SKETCH)                  */}
        {/* Brand Logo (left, circle), Brand Name (bold) + Verified badge, */}
        {/* Short tagline, "About the company", Collaborate/Apply button   */}
        {/* ============================================================== */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8 shadow-2xl ring-1 ring-white/5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            
            {/* Left: Brand Logo + Company Details */}
            <div className="flex items-start gap-5">
              {/* Brand Logo (Circle, like profile photo in sketch) */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-500 text-3xl font-bold text-white shadow-xl ring-4 ring-white/10">
                {brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logoUrl} alt={brand.companyName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  brand.companyName.charAt(0).toUpperCase()
                )}
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white ring-2 ring-[#070b14]" title="Verified Brand">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    {brand.companyName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/40 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
                    <ShieldCheck className="h-3 w-3 text-violet-400" />
                    Verified Brand
                  </span>
                </div>

                <p className="text-xs font-semibold text-violet-300 mt-0.5">
                  @{brand.username}
                </p>

                {/* Short Tagline / Industry Niche */}
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {brand.tagline}
                </p>

                {/* "About the company" (from sketch) */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    About the Company
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300 max-w-2xl">
                    {brand.description}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    {brand.location}
                  </span>
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-violet-300 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Visit Website
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Main CTA - Collaborate / Apply button (highlighted) */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenApplyModal()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/25 transition hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]"
              >
                <Zap className="h-4 w-4 fill-white" />
                <span>Collaborate / Apply</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 📊 QUICK STATS ROW (REQUESTED BY USER)                         */}
          {/* Campaigns Posted, Projects Open, Creators Hired                */}
          {/* ============================================================== */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 max-w-2xl">
            
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Campaigns</span>
                <p className="text-[10px] text-violet-300 font-medium">Posted</p>
              </div>
              <span className="text-2xl font-mono font-bold text-violet-300">
                {String(brand.campaignsCount).padStart(2, "0")}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Projects</span>
                <p className="text-[10px] text-amber-400 font-medium">Collaboration</p>
              </div>
              <span className="text-2xl font-mono font-bold text-amber-300">
                {String(brand.openProjectsCount).padStart(2, "0")}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Creators Hired</span>
                <p className="text-[10px] text-emerald-400 font-medium">Completed</p>
              </div>
              <span className="text-2xl font-mono font-bold text-emerald-300">
                {String(brand.creatorsHiredCount).padStart(2, "0")}
              </span>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* ACTIVE BRIEFS ROW (FROM HANDWRITTEN SKETCH)                    */}
        {/* "Active Briefs [ Count ]" -> [ 1-Brief ] [ 2-Brief ] [ 3-Brief ]*/}
        {/* Note: "If it still didn't post the no active briefs"           */}
        {/* ============================================================== */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-400" />
              <span>Active Briefs</span>
              <span className="rounded-lg bg-amber-400/20 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                [{brand.briefs.length}]
              </span>
            </h2>
            <span className="text-xs text-slate-400">Open for creator pitches</span>
          </div>

          {hasBriefs ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {brand.briefs.map((brief, idx) => (
                <div
                  key={brief.id}
                  onClick={() => setSelectedItem({ type: "brief", data: brief })}
                  className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-amber-400/50 hover:bg-white/[0.06] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                        {idx + 1} - Brief with Detail
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {brief.budget}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-sm font-bold text-white group-hover:text-amber-200 transition line-clamp-1">
                      {brief.title}
                    </h3>

                    {/* Brief Definition Specifications */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {brief.contentType && (
                        <span className="rounded bg-violet-500/15 border border-violet-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-violet-300">
                          🎬 {brief.contentType}
                        </span>
                      )}
                      {brief.style && (
                        <span className="rounded bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-300">
                          🎨 {brief.style}
                        </span>
                      )}
                      {brief.formatAspectRatio && (
                        <span className="rounded bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300 font-mono">
                          📐 {brief.formatAspectRatio.split(" ")[0]}
                        </span>
                      )}
                      {brief.commercialUseRequirements && (
                        <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                          ⚖️ Commercial
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                      {brief.description}
                    </p>

                    <div className="mt-3 rounded-xl border border-white/5 bg-black/40 p-2.5 text-[11px] text-slate-300">
                      <strong>Deliverable:</strong> {brief.deliverable}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                    <span className="text-slate-400">Deadline: {brief.deadline}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenApplyModal(brief.title);
                      }}
                      className="text-amber-400 font-semibold group-hover:underline"
                    >
                      Apply Now &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-xs text-slate-400">
              No active briefs currently posted by this brand.
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* 📂 PORTFOLIO GRID (INSTAGRAM-STYLE, 3-COLUMN)                  */}
        {/* Column 1: Campaigns | Column 2: Posts | Column 3: Collabs      */}
        {/* ============================================================== */}
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-400" />
              <span>Brand Campaigns &amp; Collaborations Portfolio</span>
            </h2>
            <span className="text-xs text-slate-400">3-Column Grid</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* COLUMN 1: CAMPAIGNS */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                <span>Column 1 &rarr; Campaigns</span>
              </span>

              <div className="space-y-4">
                {brand.briefs.map((camp) => (
                  <article
                    key={camp.id}
                    onClick={() => setSelectedItem({ type: "brief", data: camp })}
                    className="group cursor-pointer rounded-2xl border border-amber-500/20 bg-amber-500/[0.035] p-5 transition hover:border-amber-400/50 hover:bg-amber-500/[0.08]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                      <span className="text-amber-300">Campaign Call</span>
                      <span className="text-emerald-400 font-mono">{camp.budget}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-white group-hover:text-amber-200 transition">
                      {camp.title}
                    </h3>

                    {/* Brief Definition Specifications */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {camp.contentType && (
                        <span className="rounded bg-violet-500/15 border border-violet-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-violet-300">
                          🎬 {camp.contentType}
                        </span>
                      )}
                      {camp.style && (
                        <span className="rounded bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-300">
                          🎨 {camp.style}
                        </span>
                      )}
                      {camp.formatAspectRatio && (
                        <span className="rounded bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300 font-mono">
                          📐 {camp.formatAspectRatio.split(" ")[0]}
                        </span>
                      )}
                      {camp.commercialUseRequirements && (
                        <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                          ⚖️ Commercial
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                      {camp.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                      <span>Reach: <strong>{camp.reach || "2M+"}</strong></span>
                      <span className="text-amber-400 font-semibold group-hover:underline">Inspect &rarr;</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* COLUMN 2: POSTS (BRAND CONTENT / ADS) */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Column 2 &rarr; Posts &amp; Commercials</span>
              </span>

              <div className="space-y-4">
                {hasPosts ? (
                  brand.posts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => setSelectedItem({ type: "post", data: post })}
                      className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.035] overflow-hidden transition hover:border-violet-500/50 hover:bg-white/[0.06]"
                    >
                      <div className="relative aspect-video w-full bg-black overflow-hidden">
                        <video src={post.mediaUrl} playsInline muted loop className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute top-2.5 right-2.5 rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          {post.category}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-sm font-bold text-white group-hover:text-violet-200 transition">{post.title}</h4>
                        <p className="mt-1 text-xs text-slate-400 line-clamp-2">{post.description}</p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
                          <span>Reach: <strong>{post.reach}</strong></span>
                          <span className="text-violet-300 font-semibold group-hover:underline">Metrics &rarr;</span>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-xs text-slate-400">
                    No posts published yet.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: COLLABS (CREATORS THEY WORKED WITH) */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>Column 3 &rarr; Collabs</span>
              </span>

              <div className="space-y-4">
                {hasCollabs ? (
                  brand.collabs.map((collab) => (
                    <article
                      key={collab.id}
                      onClick={() => setSelectedItem({ type: "collab", data: collab })}
                      className="group cursor-pointer rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.035] p-5 transition hover:border-emerald-400/50 hover:bg-emerald-500/[0.08]"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span className="text-emerald-300">Awarded Collab</span>
                        <span className="text-amber-400">★ {collab.rating.toFixed(1)}</span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-white group-hover:text-emerald-200 transition">{collab.title}</h4>
                      <p className="mt-1 text-xs italic text-slate-300 line-clamp-2">&ldquo;{collab.reviewText}&rdquo;</p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                        <span>Creator: <strong>@{collab.creatorUsername}</strong></span>
                        <span className="text-emerald-400 font-semibold group-hover:underline">Review &rarr;</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-xs text-slate-400">
                    No collabs registered yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 🤝 COLLABORATION HISTORY (CREATOR LOGOS & TESTIMONIALS)        */}
        {/* ============================================================== */}
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-emerald-400" />
            <span>Collaboration History &amp; Creator Testimonials</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {brand.pastCreators.map((item) => (
              <div key={item.username} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 font-bold text-white text-lg">
                  {item.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <span className="text-xs text-violet-300">@{item.username}</span>
                  </div>
                  <p className="mt-1 text-xs italic text-slate-300">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ============================================================== */}
      {/* 📈 DETAIL VIEW MODAL (WHEN CLICKED)                            */}
      {/* Metrics: Reach, Engagement, ROI snapshot                      */}
      {/* Apply / Collaborate button inside detail view                  */}
      {/* ============================================================== */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative flex h-[580px] w-full max-w-2xl flex-col rounded-3xl border border-white/15 bg-[#0a0f1d] shadow-2xl text-white overflow-hidden ring-1 ring-white/10">
            
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {selectedItem.type === "brief" ? "Campaign Brief" : selectedItem.type === "post" ? "Brand Post" : "Collab Detail"}
                </span>
                <h3 className="text-base font-bold text-white">{selectedItem.data.title}</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {"mediaUrl" in selectedItem.data && (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                  <video src={selectedItem.data.mediaUrl} controls className="h-full w-full object-cover" />
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Overview &amp; Deliverables</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {selectedItem.data.description}
                </p>
              </div>

              {/* BRIEF DEFINITION & REQUIREMENTS (CONTENT TYPE, STYLE, FORMAT, COMMERCIAL-USE) */}
              {selectedItem.type === "brief" && (
                <div className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-300">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span>Brief Definition &amp; Requirements</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">🎬 Content Type</span>
                      <span className="font-semibold text-white">
                        {("contentType" in selectedItem.data && selectedItem.data.contentType) || "AI Video Commercial"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">🎨 Visual Style</span>
                      <span className="font-semibold text-fuchsia-300">
                        {("style" in selectedItem.data && selectedItem.data.style) || "Cinematic Sci-Fi / Cyberpunk"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">📐 Format / Aspect Ratio</span>
                      <span className="font-semibold text-cyan-300 font-mono">
                        {("formatAspectRatio" in selectedItem.data && selectedItem.data.formatAspectRatio) || "9:16 Vertical (Reel / TikTok / Shorts)"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">⚖️ Commercial-Use Requirements</span>
                      <span className="font-semibold text-emerald-300">
                        {("commercialUseRequirements" in selectedItem.data && selectedItem.data.commercialUseRequirements) || "Full Commercial Buyout & Paid Ad Whitelisting"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* METRICS: REACH, ENGAGEMENT, ROI SNAPSHOT (REQUESTED BY USER) */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Campaign Performance Metrics</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <Eye className="mx-auto h-4 w-4 text-violet-400 mb-1" />
                    <span className="text-xs text-slate-400 block">Estimated Reach</span>
                    <span className="text-sm font-bold text-white">
                      {("reach" in selectedItem.data && selectedItem.data.reach) || "2.4M Views"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <TrendingUp className="mx-auto h-4 w-4 text-emerald-400 mb-1" />
                    <span className="text-xs text-slate-400 block">Engagement Rate</span>
                    <span className="text-sm font-bold text-white">
                      {("engagement" in selectedItem.data && selectedItem.data.engagement) || "8.5%"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <Zap className="mx-auto h-4 w-4 text-amber-400 mb-1" />
                    <span className="text-xs text-slate-400 block">ROI Target</span>
                    <span className="text-sm font-bold text-white">
                      {("roi" in selectedItem.data && selectedItem.data.roi) || "4.2x"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer with Apply / Collaborate button */}
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
                  handleOpenApplyModal(title);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:opacity-95"
              >
                <Zap className="h-3.5 w-3.5 fill-white" />
                <span>Apply / Collaborate for this Brief</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: APPLY / COLLABORATE APPLICATION FORM                    */}
      {/* ============================================================== */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0a0f1d] p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Creator Application</span>
                <h3 className="text-lg font-bold text-white">Collaborate with {brand.companyName}</h3>
              </div>
              <button onClick={() => setIsApplyModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {applySuccess ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-2xl font-bold">
                  ✓
                </div>
                <h4 className="text-base font-bold text-white">Pitch Delivered!</h4>
                <p className="mt-1 text-xs text-slate-300">
                  Your collaboration pitch has been submitted to {brand.companyName}. They will review your portfolio and response.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Target Campaign / Project
                  </label>
                  <input
                    type="text"
                    required
                    value={applyForm.targetTitle}
                    onChange={(e) => setApplyForm({ ...applyForm, targetTitle: e.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Pitch &amp; Creative Approach
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={applyForm.pitch}
                    onChange={(e) => setApplyForm({ ...applyForm, pitch: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Proposed Rate / Fee ($)
                    </label>
                    <input
                      type="text"
                      required
                      value={applyForm.proposedRate}
                      onChange={(e) => setApplyForm({ ...applyForm, proposedRate: e.target.value })}
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white outline-none focus:border-violet-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Deliverable Scope
                    </label>
                    <input
                      type="text"
                      required
                      value={applyForm.deliverable}
                      onChange={(e) => setApplyForm({ ...applyForm, deliverable: e.target.value })}
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:opacity-95"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Application &rarr;</span>
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

export default function CreatorBrandViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      }
    >
      <CreatorBrandViewContent />
    </Suspense>
  );
}
