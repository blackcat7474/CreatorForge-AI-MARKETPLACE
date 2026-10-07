"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getMarketplacePosts,
  rateMarketplacePost,
  MarketplacePost,
} from "@/lib/marketplace-store";
import { BrandLeftNav, BrandHeaderNav } from "@/components/brand-navigation";
import {
  Star,
  Play,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Flame,
  Shuffle,
  Wrench,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  X,
  Send,
} from "lucide-react";

export default function BrandReelsPage() {
  const router = useRouter();

  // Authentication & Authorization
  const [brandId, setBrandId] = useState<string>("");
  const [brandUsername, setBrandUsername] = useState<string>("");
  const [brandCompanyName, setBrandCompanyName] = useState<string>("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Reels feed state
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedMode, setFeedMode] = useState<"popular" | "random">("popular");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Video playback state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  // Vertical 5-Star Rating State (matching the handwritten sketch)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [ratingMessage, setRatingMessage] = useState<string>("");
  const [userRatingForCurrent, setUserRatingForCurrent] = useState<number | null>(null);

  // Invite / Hire Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteBriefTitle, setInviteBriefTitle] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // ----------------------------------------------------------------
  // 1. ROLE GUARD: Strictly Brand only
  // ----------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function checkRole() {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error || !user) {
        setIsLoadingAuth(false);
        router.replace("/auth/login?role=brand");
        return;
      }

      const role = user.user_metadata?.role;
      if (role && role !== "brand") {
        setIsLoadingAuth(false);
        router.replace("/creator/profile");
        return;
      }

      const meta = user.user_metadata || {};
      setBrandId(user.id);
      setBrandUsername(meta.username || "brand_user");
      setBrandCompanyName(meta.role_specific_name || meta.display_name || "Brand Partner");
      setIsLoadingAuth(false);
    }

    checkRole();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // ----------------------------------------------------------------
  // 2. LOAD REELS AND APPLY FEED LOGIC (Popular vs Random)
  // ----------------------------------------------------------------
  const loadFeed = useCallback(
    (mode: "popular" | "random", category: string) => {
      let all = getMarketplacePosts();

      if (category !== "all") {
        all = all.filter((p) => p.category === category);
      }

      if (mode === "popular") {
        // Sort by average rating descending, then ratings count
        all.sort((a, b) => b.averageRating - a.averageRating || b.ratingsCount - a.ratingsCount);
      } else {
        // Random shuffle
        all = [...all].sort(() => Math.random() - 0.5);
      }

      setPosts(all);
      setCurrentIndex(0);
      setProgress(0);
    },
    []
  );

  useEffect(() => {
    loadFeed(feedMode, selectedCategory);
  }, [feedMode, selectedCategory, loadFeed]);

  const currentPost: MarketplacePost | undefined = posts[currentIndex];

  // Check if current brand already rated this post
  useEffect(() => {
    if (!currentPost || !brandId) {
      setUserRatingForCurrent(null);
      return;
    }
    const found = currentPost.ratings.find((r) => r.brandId === brandId);
    setUserRatingForCurrent(found ? found.rating : null);
    setRatingMessage("");
  }, [currentPost, brandId]);

  // Video playback listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setProgress(0);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }

    function handleTimeUpdate() {
      if (video && video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [currentIndex, currentPost]);

  // Keyboard navigation (Arrow Up/Down, Space, M)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInviteModalOpen) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        handlePrevReel();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  function handleNextReel() {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Loop or re-shuffle if random
      setCurrentIndex(0);
    }
  }

  function handlePrevReel() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  // ----------------------------------------------------------------
  // 3. VERTICAL 5-STAR RATING SYSTEM (Cumulative fill logic)
  // "if 3 is selected the down stars automatically selected"
  // ----------------------------------------------------------------
  function handleRateStar(starScore: number) {
    if (!currentPost) return;

    setUserRatingForCurrent(starScore);
    const { updatedPost, allPosts } = rateMarketplacePost(
      currentPost.id,
      brandId || "brand-anon",
      brandUsername || "brand_user",
      brandCompanyName || "Brand Partner",
      starScore
    );

    if (updatedPost) {
      // Update local post in list
      setPosts(allPosts);
      setRatingMessage(`Rated ${starScore}/5 stars! Creator's post rating updated.`);
      setTimeout(() => setRatingMessage(""), 3500);
    }
  }

  // Send collaboration invite to creator
  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setIsInviteModalOpen(false);
      setInviteBriefTitle("");
      setInviteMessage("");
    }, 1500);
  }

  if (isLoadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-violet-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading reels discovery feed...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b14] pl-16 sm:pl-20 pr-4 sm:pr-6 pb-28 pt-6 text-white">
      <BrandLeftNav />
      {/* Top Desktop Navigation & Controls Header */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/brand/profile"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Brand Profile</span>
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">
                Brand Discovery Feed
              </p>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Creator Reels &amp; Showcase Evaluation
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <BrandHeaderNav />
          </div>
        </header>

        {/* Feed Controls: Popular vs. Random & Categories */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm">
          {/* Feed Switcher */}
          <div className="flex items-center gap-1.5 rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setFeedMode("popular")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                feedMode === "popular"
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Popular Videos (Top Rated)</span>
            </button>

            <button
              type="button"
              onClick={() => setFeedMode("random")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                feedMode === "random"
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Random Discovery</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            {[
              { id: "all", label: "All Reels" },
              { id: "video", label: "🎬 Videos" },
              { id: "image", label: "🖼️ Generative Art" },
              { id: "ai", label: "⚡ AI Workflows" },
              { id: "motion", label: "🎨 3D & Motion" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 transition ${
                  selectedCategory === cat.id
                    ? "border border-violet-500/40 bg-violet-600/30 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Desktop Reels Stage */}
      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        {posts.length > 0 && currentPost ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
            
            {/* Desktop Reel Player (Center 7 cols) */}
            <div className="relative mx-auto flex w-full max-w-[420px] flex-col items-center lg:col-span-7">
              <div className="relative aspect-[9/16] w-full max-h-[720px] overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl ring-1 ring-white/10 group">
                
                {/* Video Tag */}
                <video
                  ref={videoRef}
                  src={currentPost.mediaUrl}
                  loop
                  playsInline
                  muted={isMuted}
                  onClick={togglePlay}
                  className="h-full w-full object-cover cursor-pointer"
                />

                {/* Progress Bar Scrubber */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Play / Pause Center Overlay Trigger */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-20"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                      <Play className="h-8 w-8 translate-x-0.5 fill-white" />
                    </div>
                  </div>
                )}

                {/* Top Video Overlay Controls (Mute / Sound) */}
                <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-red-400" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-emerald-400" />
                    )}
                  </button>
                </div>

                {/* Left/Bottom Overlay: Creator Info, Tools, Skills & Description */}
                <div className="absolute bottom-0 left-0 right-14 z-30 bg-gradient-to-t from-black via-black/80 to-transparent p-5 text-white">
                  {/* Creator Identity */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-sm font-bold text-white shadow-md">
                      {currentPost.creatorAvatar || currentPost.creatorName.charAt(0) || "C"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {currentPost.creatorName}
                      </h3>
                      <p className="text-xs font-medium text-violet-300">
                        @{currentPost.creatorUsername}
                      </p>
                    </div>
                  </div>

                  {/* Title / Hook */}
                  <p className="mt-2.5 text-sm font-semibold text-white line-clamp-1">
                    {currentPost.title}
                  </p>

                  {/* Tools Used Badges */}
                  {currentPost.toolsUsed && currentPost.toolsUsed.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {currentPost.toolsUsed.slice(0, 3).map((tool, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-violet-200 backdrop-blur-sm"
                        >
                          {tool}
                        </span>
                      ))}
                      {currentPost.toolsUsed.length > 3 && (
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                          +{currentPost.toolsUsed.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Skills Applied Badges */}
                  {currentPost.skillsApplied && currentPost.skillsApplied.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {currentPost.skillsApplied.slice(0, 2).map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description / Creation Workflow */}
                  <p className="mt-2 text-xs leading-relaxed text-slate-300 line-clamp-2">
                    {currentPost.description}
                  </p>
                </div>

                {/* ============================================================== */}
                {/* 5-STAR VERTICAL RATING COLUMN (MATCHING REFERENCE SKETCH!)     */}
                {/* "if 3 is selected the down stars automatically selected"       */}
                {/* Numbers 5 at top down to 1 (or 1 to 5)                          */}
                {/* ============================================================== */}
                <div className="absolute right-3 bottom-6 z-40 flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-black/70 p-2.5 backdrop-blur-md shadow-xl">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                    Rate
                  </div>

                  {/* 5 Vertical Stars from 5 down to 1 */}
                  <div className="flex flex-col-reverse items-center gap-2">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      // Cumulative selection logic:
                      // If hovered, highlight all stars <= hoveredStar
                      // Else if rated, highlight all stars <= userRatingForCurrent
                      const activeScore =
                        hoveredStar !== null ? hoveredStar : userRatingForCurrent || 0;
                      const isHighlighted = starValue <= activeScore;

                      return (
                        <button
                          key={starValue}
                          type="button"
                          onMouseEnter={() => setHoveredStar(starValue)}
                          onMouseLeave={() => setHoveredStar(null)}
                          onClick={() => handleRateStar(starValue)}
                          title={`Rate ${starValue} Star${starValue > 1 ? "s" : ""}`}
                          aria-label={`Rate ${starValue} stars`}
                          className="group relative flex flex-col items-center transition-transform active:scale-125"
                        >
                          <Star
                            className={`h-6 w-6 transition-all ${
                              isHighlighted
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                                : "fill-white/10 text-white/30 group-hover:text-amber-300/60"
                            }`}
                          />
                          <span
                            className={`text-[9px] font-bold ${
                              isHighlighted ? "text-amber-300" : "text-slate-500"
                            }`}
                          >
                            {starValue}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Average badge */}
                  <div className="border-t border-white/10 pt-1 text-center">
                    <span className="text-xs font-extrabold text-white">
                      {currentPost.averageRating > 0 ? currentPost.averageRating.toFixed(1) : "—"}
                    </span>
                    <span className="block text-[8px] text-slate-400">
                      {currentPost.ratingsCount} {currentPost.ratingsCount === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                </div>

              </div>

              {/* Up & Down Desktop Navigation Buttons */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handlePrevReel}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
                >
                  <ChevronUp className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <span className="text-xs font-mono text-slate-400">
                  {currentIndex + 1} / {posts.length}
                </span>

                <button
                  type="button"
                  onClick={handleNextReel}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-violet-500"
                >
                  <span>Next Reel</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {ratingMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{ratingMessage}</span>
                </div>
              )}
            </div>

            {/* Right Information & Action Panel (Desktop 5 cols) */}
            <div className="flex flex-col gap-5 lg:col-span-5">
              
              {/* Creator Card & Rating Overview */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-lg font-bold text-white shadow-lg">
                      {currentPost.creatorAvatar || currentPost.creatorName.charAt(0) || "C"}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{currentPost.creatorName}</h2>
                      <p className="text-xs font-medium text-violet-300">
                        @{currentPost.creatorUsername}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/brand/creators?q=${encodeURIComponent(currentPost.creatorUsername)}`}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:underline"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                {/* Rating Hierarchy Breakdown */}
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        ⭐ Post Reel Rating (Priority 2)
                      </span>
                      <p className="text-xs text-slate-400">Evaluated by brands on discovery feed</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-white">
                        {currentPost.averageRating > 0 ? `${currentPost.averageRating.toFixed(1)} / 5.0` : "Unrated"}
                      </span>
                      <p className="text-[10px] text-slate-400">{currentPost.ratingsCount} brand ratings</p>
                    </div>
                  </div>

                  <div className="pt-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Your rating influences which creators are ranked and suggested when brands filter for top AI talent.
                    </p>
                  </div>
                </div>

                {/* Tools Used Section */}
                <div className="mt-5">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <Wrench className="h-3.5 w-3.5 text-violet-400" />
                    <span>Tools &amp; Tech Stack Used</span>
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentPost.toolsUsed && currentPost.toolsUsed.length > 0 ? (
                      currentPost.toolsUsed.map((tool, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200"
                        >
                          {tool}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None specified</span>
                    )}
                  </div>
                </div>

                {/* Skills Applied Section */}
                <div className="mt-4">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
                    <span>Skills Applied</span>
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentPost.skillsApplied && currentPost.skillsApplied.length > 0 ? (
                      currentPost.skillsApplied.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None specified</span>
                    )}
                  </div>
                </div>

                {/* Full Creation Workflow Description */}
                <div className="mt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Workflow &amp; How It Was Built
                  </h4>
                  <div className="mt-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-slate-200">
                    {currentPost.description}
                  </div>
                </div>

                {/* Hire / Invite CTA */}
                <div className="mt-6 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-95"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Hire / Invite @{currentPost.creatorUsername}</span>
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Direct brand collaboration with verified milestone escrow
                  </p>
                </div>
              </div>

              {/* Feed Tips Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Desktop Shortcuts:</span>
                <span className="ml-2">
                  <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">↓</kbd> / <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">↑</kbd> Next / Previous &bull; <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">Space</kbd> Play / Pause &bull; <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">M</kbd> Mute
                </span>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] py-20 text-center">
            <Sparkles className="h-10 w-10 text-violet-400 mb-3" />
            <h3 className="text-lg font-bold text-white">No reels found in this category</h3>
            <p className="mt-1 text-xs text-slate-400">
              Try switching back to &apos;All Reels&apos; or check back once creators upload new work.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Show All Reels
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* COLLABORATE / HIRE MODAL                                        */}
      {/* ============================================================== */}
      {isInviteModalOpen && currentPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0a0f1d] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Collaborate with @{currentPost.creatorUsername}
                </h3>
                <p className="text-xs text-slate-400">Send a campaign brief invitation</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="my-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-2" />
                <h4 className="text-base font-bold text-white">Invitation Dispatched!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  @{currentPost.creatorUsername} has been notified and will review your campaign details.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Campaign / Brief Title
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteBriefTitle}
                    onChange={(e) => setInviteBriefTitle(e.target.value)}
                    placeholder="e.g. Q4 Generative 3D Commercial"
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Project Deliverable &amp; Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Describe what you want to build together, timeline, and estimated compensation..."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-violet-500"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Invite</span>
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
