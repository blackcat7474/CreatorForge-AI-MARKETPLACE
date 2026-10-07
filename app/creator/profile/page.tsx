"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getMarketplacePosts,
  saveMarketplacePost,
  getCreatorProjects,
  getCreatorRatingsSummary,
  MarketplacePost,
  CompletedProject,
  CreatorRatingSummary,
  PostCategory,
} from "@/lib/marketplace-store";
import { NotificationBell } from "@/components/notification-bell";
import {
  Folder,
  Image as ImageIcon,
  Pencil,
  Plus,
  LogOut,
  MapPin,
  Mail,
  Globe,
  X,
  Star,
  Film,
  Upload,
  ShieldCheck,
  Award,
  Camera,
  Trash2,
  SlidersHorizontal,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";

type MessageState = {
  type: "success" | "error" | "";
  text: string;
};

export default function CreatorProfilePage() {
  const router = useRouter();

  // User Profile State (loaded directly from Supabase authentication & profiles table)
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 10 Filter Categories State
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "AI video generation",
    "Prompt Engineering",
  ]);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([
    "Marketing",
    "YouTube / Instagram",
  ]);
  const [selectedTools, setSelectedTools] = useState<string[]>([
    "ChatGPT",
    "Runway Gen-3",
    "Midjourney",
  ]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([
    "Instagram reel",
    "YouTube video",
  ]);
  const [experienceLevel, setExperienceLevel] = useState<string>("Advance");
  const [selectedPortfolioQuality, setSelectedPortfolioQuality] = useState<string[]>([
    "Previous project",
    "Content quality",
    "Client review",
  ]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "English",
    "Tamil",
  ]);
  const [selectedRatingsHighlights, setSelectedRatingsHighlights] = useState<string[]>([
    "Overall rating",
    "On-time delivery",
    "Communication score",
  ]);
  const [availability, setAvailability] = useState<string>("Available now");
  const [expectedDeliveryTime, setExpectedDeliveryTime] = useState<string>("24-48 hours");
  const [budgetPreference, setBudgetPreference] = useState<string>("$500 - $1,500");

  function toggleMultiOption(list: string[], setList: (val: string[]) => void, item: string) {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  }

  // App & UI State
  const [activeTab, setActiveTab] = useState<"posts" | "projects">("posts");
  const [creatorPosts, setCreatorPosts] = useState<MarketplacePost[]>([]);
  const [creatorProjects, setCreatorProjects] = useState<CompletedProject[]>([]);
  const [ratingSummary, setRatingSummary] = useState<CreatorRatingSummary>({
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

  const [isEditing, setIsEditing] = useState(false);
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });

  // -----------------------------------------------------------------
  // ADD POST MODAL FORM STATE (Category -> Resource -> Tech Specs)
  // -----------------------------------------------------------------
  const [postCategory, setPostCategory] = useState<PostCategory>("video");
  const [postTitle, setPostTitle] = useState("");
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [mediaFilePreview, setMediaFilePreview] = useState<string | null>(null);
  const [mediaFileName, setMediaFileName] = useState("");
  const [postTools, setPostTools] = useState("");
  const [postSkills, setPostSkills] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -------------------------------------------------------
  // LOAD LOGGED-IN CREATOR DATA WITH STRICT ROLE AUTHORIZATION
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
            if (cachedActiveUser?.role === "creator") {
              userRole = "creator";
            }
          }
        } catch {
          // ignore
        }
      }

      if (!activeUser && !cachedActiveUser) {
        setIsLoading(false);
        router.replace("/?role=creator");
        return;
      }

      // 2. Strict Role Authorization: Only Creator accounts can access Creator Workspace
      if (userRole && userRole !== "creator") {
        setIsLoading(false);
        router.replace("/brand/profile");
        return;
      }

      const effectiveUserId = activeUser?.id || cachedActiveUser?.id || "active-creator";
      const effectiveEmail = activeUser?.email || cachedActiveUser?.email || "";
      setUserId(effectiveUserId);
      setEmail(effectiveEmail);

      // 3. Hydrate from user_metadata collected at sign-up
      const meta = activeUser?.user_metadata || {};
      const metaUsername = (meta.username || cachedActiveUser?.username || "").toLowerCase();
      let metaName = meta.display_name || meta.full_name || cachedActiveUser?.name || "";
      let metaHeadline = meta.role_specific_name || meta.headline || cachedActiveUser?.roleSpecificName || "";
      let metaLocation = meta.location || meta.address || "";
      let metaBio = meta.bio || meta.description || "";
      let metaSkills = meta.skills || "";
      let metaPortfolio = meta.portfolio_url || "";

      // Also hydrate from creator permanent local profile store
      if (typeof window !== "undefined" && metaUsername) {
        try {
          const rawLocal = localStorage.getItem(`creator_profile_${metaUsername}`) || localStorage.getItem(`creator_profile_data_${metaUsername}`);
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (!metaName && (parsed.displayName || parsed.fullName)) metaName = parsed.displayName || parsed.fullName;
            if (!metaHeadline && (parsed.headline || parsed.roleSpecificName)) metaHeadline = parsed.headline || parsed.roleSpecificName;
            if (!metaLocation && parsed.location) metaLocation = parsed.location;
            if (!metaBio && parsed.bio) metaBio = parsed.bio;
            if (!metaSkills && parsed.skills) metaSkills = parsed.skills;
            if (!metaPortfolio && parsed.portfolioUrl) metaPortfolio = parsed.portfolioUrl;
          }
        } catch {
          // ignore
        }
      }

      let activeUsername = metaUsername;
      setUsername(metaUsername);
      setFullName(metaName);
      setHeadline(metaHeadline);
      setLocation(metaLocation);
      setBio(metaBio);
      setSkills(metaSkills);
      setPortfolioUrl(metaPortfolio);

      // Hydrate avatar
      const cleanHandle = metaUsername.toLowerCase();
      const savedAvatar = typeof window !== "undefined" ? localStorage.getItem(`creator_avatar_${cleanHandle}`) : null;
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      } else if (meta.avatar_url) {
        setAvatarUrl(meta.avatar_url);
      }

      // Hydrate 10 filter categories from storage
      if (typeof window !== "undefined") {
        try {
          const savedFiltersRaw = localStorage.getItem(`creator_filter_categories_${cleanHandle}`);
          if (savedFiltersRaw) {
            const parsed = JSON.parse(savedFiltersRaw);
            if (Array.isArray(parsed.skills) && parsed.skills.length > 0) setSelectedSkills(parsed.skills);
            if (Array.isArray(parsed.specialization) && parsed.specialization.length > 0) setSelectedSpecializations(parsed.specialization);
            if (Array.isArray(parsed.tools) && parsed.tools.length > 0) setSelectedTools(parsed.tools);
            if (Array.isArray(parsed.contentType) && parsed.contentType.length > 0) setSelectedContentTypes(parsed.contentType);
            if (parsed.experience) setExperienceLevel(parsed.experience);
            if (Array.isArray(parsed.portfolioQuality) && parsed.portfolioQuality.length > 0) setSelectedPortfolioQuality(parsed.portfolioQuality);
            if (Array.isArray(parsed.language) && parsed.language.length > 0) setSelectedLanguages(parsed.language);
            if (Array.isArray(parsed.ratings) && parsed.ratings.length > 0) setSelectedRatingsHighlights(parsed.ratings);
            if (parsed.availability) setAvailability(parsed.availability);
            if (parsed.expectedDeliveryTime) setExpectedDeliveryTime(parsed.expectedDeliveryTime);
            if (parsed.budget) setBudgetPreference(parsed.budget);
          }
        } catch {
          // Ignore parse errors
        }
      }

      // 4. Query the profiles table for any persistent updates
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", effectiveUserId)
        .single();

      if (profile && isMounted) {
        if (profile.role && profile.role !== "creator") {
          setIsLoading(false);
          router.replace("/brand/profile");
          return;
        }

        if (profile.username) {
          activeUsername = profile.username.toLowerCase();
          setUsername(activeUsername);
          const pSavedAvatar = typeof window !== "undefined" ? localStorage.getItem(`creator_avatar_${activeUsername}`) : null;
          if (pSavedAvatar) setAvatarUrl(pSavedAvatar);
        }
        if (profile.display_name || profile.full_name) {
          setFullName(profile.display_name || profile.full_name);
        }
        if (profile.role_specific_name || profile.headline) {
          setHeadline(profile.role_specific_name || profile.headline);
        }
        if (profile.location) setLocation(profile.location);
        if (profile.bio || profile.description) {
          setBio(profile.bio || profile.description);
        }
        if (profile.skills) setSkills(profile.skills);
        if (profile.portfolio_url) setPortfolioUrl(profile.portfolio_url);
        if (profile.avatar_url) {
          setAvatarUrl((prev) => prev || profile.avatar_url);
        }
      }

      // 5. Hydrate Creator Posts & Verified Brand Projects
      refreshActivity(activeUsername);

      if (isMounted) {
        setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function refreshActivity(creatorHandle: string) {
    const cleanHandle = creatorHandle.trim().toLowerCase().replace(/^@/, "");
    const allPosts = getMarketplacePosts();
    const userPosts = allPosts.filter(
      (p) => p.creatorUsername.toLowerCase().replace(/^@/, "") === cleanHandle
    );
    const userProjects = getCreatorProjects(cleanHandle);
    const summary = getCreatorRatingsSummary(cleanHandle);

    setCreatorPosts(userPosts);
    setCreatorProjects(userProjects);
    setRatingSummary(summary);
  }

  // -------------------------------------------------------
  // AVATAR FILE UPLOAD & REMOVE HANDLERS
  // -------------------------------------------------------
  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Profile picture size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        const cleanHandle = username.trim().toLowerCase().replace(/^@/, "");
        if (cleanHandle && typeof window !== "undefined") {
          localStorage.setItem(`creator_avatar_${cleanHandle}`, result);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatarUrl("");
    const cleanHandle = username.trim().toLowerCase().replace(/^@/, "");
    if (cleanHandle && typeof window !== "undefined") {
      localStorage.removeItem(`creator_avatar_${cleanHandle}`);
    }
  }

  // -------------------------------------------------------
  // SAVE UPDATED PROFILE WITH STRICT UNIQUE LOWERCASE USERNAME
  // -------------------------------------------------------
  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
    const cleanFullName = fullName.trim();
    const cleanHeadline = headline.trim();
    const cleanLocation = location.trim();
    const cleanBio = bio.trim();
    const cleanSkills = skills.trim();
    const cleanPortfolioUrl = portfolioUrl.trim();

    // 1. Strict Username Validation (lowercase only, no uppercase, alphanumeric + _ .)
    const usernameRegex = /^[a-z0-9_.]+$/;
    if (!cleanUsername) {
      setMessage({ type: "error", text: "Username is required." });
      return;
    }
    if (!usernameRegex.test(cleanUsername)) {
      setMessage({
        type: "error",
        text: "Username can only contain lowercase letters, numbers, underscores (_), and periods (.). Uppercase is not allowed.",
      });
      return;
    }

    if (!cleanFullName) {
      setMessage({ type: "error", text: "Full name is required." });
      return;
    }

    if (!cleanHeadline) {
      setMessage({ type: "error", text: "Professional headline is required." });
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

      // 3. Persist Avatar to localStorage
      if (typeof window !== "undefined" && cleanUsername) {
        if (avatarUrl) {
          localStorage.setItem(`creator_avatar_${cleanUsername}`, avatarUrl);
        } else {
          localStorage.removeItem(`creator_avatar_${cleanUsername}`);
        }
      }

      // 4. Persist all 10 Filter Categories
      const filterConfig = {
        skills: selectedSkills,
        specialization: selectedSpecializations,
        tools: selectedTools,
        contentType: selectedContentTypes,
        experience: experienceLevel,
        portfolioQuality: selectedPortfolioQuality,
        language: selectedLanguages,
        ratings: selectedRatingsHighlights,
        availability,
        expectedDeliveryTime,
        budget: budgetPreference,
      };

      if (typeof window !== "undefined" && cleanUsername) {
        localStorage.setItem(`creator_filter_categories_${cleanUsername}`, JSON.stringify(filterConfig));
      }

      // Combine filter tags with text skills for global discovery matching
      const combinedSkills = Array.from(
        new Set([
          ...cleanSkills.split(/[,•]/).map((s) => s.trim()).filter(Boolean),
          ...selectedSkills,
          ...selectedTools,
          ...selectedSpecializations,
        ])
      ).join(", ");

      // 5. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username: cleanUsername,
          display_name: cleanFullName,
          role_specific_name: cleanHeadline,
          headline: cleanHeadline,
          location: cleanLocation,
          bio: cleanBio,
          skills: combinedSkills,
          portfolio_url: cleanPortfolioUrl,
          avatar_url: avatarUrl,
          filter_categories: filterConfig,
        },
      });

      if (authError) {
        setMessage({ type: "error", text: authError.message });
        setIsSaving(false);
        return;
      }

      // 6. Sync to Supabase profiles table
      if (userId) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          email,
          username: cleanUsername,
          display_name: cleanFullName,
          role_specific_name: cleanHeadline,
          headline: cleanHeadline,
          location: cleanLocation,
          bio: cleanBio,
          skills: combinedSkills,
          portfolio_url: cleanPortfolioUrl,
          avatar_url: avatarUrl,
        });

        if (profileError) {
          console.warn("Could not sync to profiles table:", profileError.message);
        }
      }

      // 7. Permanently update local persistent store
      if (typeof window !== "undefined") {
        const creatorData = {
          username: cleanUsername,
          displayName: cleanFullName,
          fullName: cleanFullName,
          headline: cleanHeadline,
          location: cleanLocation,
          bio: cleanBio,
          skills: combinedSkills,
          portfolioUrl: cleanPortfolioUrl,
          avatarUrl: avatarUrl,
          email,
          role: "creator",
        };
        localStorage.setItem(`creator_profile_${cleanUsername}`, JSON.stringify(creatorData));
        localStorage.setItem(`creator_profile_data_${cleanUsername}`, JSON.stringify(creatorData));
        localStorage.setItem(
          "ai_marketplace_active_user",
          JSON.stringify({
            id: userId,
            email,
            username: cleanUsername,
            name: cleanFullName,
            roleSpecificName: cleanHeadline,
            role: "creator",
          })
        );
      }

      setUsername(cleanUsername);
      setFullName(cleanFullName);
      setHeadline(cleanHeadline);
      setLocation(cleanLocation);
      setBio(cleanBio);
      setSkills(combinedSkills);
      setPortfolioUrl(cleanPortfolioUrl);

      setMessage({ type: "success", text: "Creator profile, photo, and filter categories updated successfully." });
      setIsEditing(false);
      refreshActivity(cleanUsername);
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred while saving." });
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

  // -----------------------------------------------------------------
  // FILE SELECTION FOR POST RESOURCE
  // -----------------------------------------------------------------
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setMediaFileName(file.name);

    // Create instant local blob object URL for live in-browser preview & playback
    const objectUrl = URL.createObjectURL(file);
    setMediaFilePreview(objectUrl);
    setPostMediaUrl(objectUrl);
    setIsUploadingMedia(false);
  }

  // -----------------------------------------------------------------
  // PUBLISH POST FLOW (Category -> Resource -> Tools & Skills -> Push to Brands)
  // -----------------------------------------------------------------
  function handlePublishPost(e: FormEvent) {
    e.preventDefault();

    const mediaSrc = postMediaUrl.trim() || mediaFilePreview;
    if (!mediaSrc) {
      alert("Please upload a media file or provide a resource URL for your post.");
      return;
    }

    if (!postTitle.trim()) {
      alert("Please provide a title for your post.");
      return;
    }

    const toolsList = postTools
      .split(/[,•]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const skillsList = postSkills
      .split(/[,•]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newPost: MarketplacePost = {
      id: `post-${Date.now()}`,
      creatorId: userId || `c-${Date.now()}`,
      creatorUsername: username || "creator_user",
      creatorName: fullName || "Creator",
      creatorAvatar: fullName.charAt(0) || "C",
      category: postCategory,
      mediaUrl: mediaSrc,
      mediaType: postCategory === "image" ? "image" : "video",
      title: postTitle.trim(),
      toolsUsed: toolsList.length > 0 ? toolsList : ["Runway Gen-3", "Midjourney"],
      skillsApplied: skillsList.length > 0 ? skillsList : ["AI Video Generation"],
      description:
        postDescription.trim() ||
        "Created with generative AI pipelines, specialized prompt engineering, and cinematic color grading.",
      createdAt: new Date().toISOString(),
      ratingsCount: 0,
      averageRating: 0,
      ratings: [],
    };

    saveMarketplacePost(newPost);
    refreshActivity(username);

    // Reset Form
    setPostTitle("");
    setPostMediaUrl("");
    setMediaFilePreview(null);
    setMediaFileName("");
    setPostTools("");
    setPostSkills("");
    setPostDescription("");
    setIsAddPostModalOpen(false);
    setActiveTab("posts");
  }

  const avatarInitial = fullName.trim().charAt(0) || username.trim().charAt(0) || "C";
  const skillArray = skills
    ? skills.split(/[,•]/).map((s) => s.trim()).filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-violet-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading creator workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        
        {/* Desktop Header - Strictly Creator Workspace with no cross-portal leakage */}
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-400">
              Creator Workspace
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
              Creator Profile
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell role="creator" currentUsername={username} />
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

        {/* ========================================================= */}
        {/* RATINGS HIERARCHY DASHBOARD                               */}
        {/* Priority 1: Project Rating > Priority 2: Post Rating     */}
        {/* ========================================================= */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-r from-violet-950/30 via-black to-fuchsia-950/20 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            
            {/* Overall Rating Badge */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20">
                <Star className="h-8 w-8 fill-white text-white drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-white">
                    {ratingSummary.overallRating > 0
                      ? `${ratingSummary.overallRating.toFixed(1)} / 5.0`
                      : "0.0 / 5.0"}
                  </span>
                  <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                    Combined Score
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Weighted average of verified brand projects and discovery feed evaluations
                </p>
              </div>
            </div>

            {/* Two Tier Ratings Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Priority 1: Project Rating */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" />
                    Priority 1: Project Rating
                  </span>
                  <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    Highest Priority
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">
                    {ratingSummary.hasProjectRating
                      ? `${ratingSummary.projectRating.toFixed(1)} / 5.0`
                      : "0.0 / 5.0"}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({ratingSummary.completedProjectsCount} {ratingSummary.completedProjectsCount === 1 ? "project" : "projects"})
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-tight text-slate-300">
                  Awarded strictly by Brands upon successful project completion
                </p>
              </div>

              {/* Priority 2: Post & Reel Rating */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                    <Film className="h-3.5 w-3.5" />
                    Priority 2: Post Rating
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                    Secondary
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">
                    {ratingSummary.hasPostRating
                      ? `${ratingSummary.postRating.toFixed(1)} / 5.0`
                      : "0.0 / 5.0"}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({ratingSummary.postRatingsCount} {ratingSummary.postRatingsCount === 1 ? "evaluation" : "evaluations"})
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-tight text-slate-300">
                  Evaluated by Brands watching your videos on Discovery Reels
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Main Desktop Profile Card */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 sm:p-10 shadow-xl">
          {!isEditing ? (
            /* --- DESKTOP VIEW MODE --- */
            <div>
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                
                {/* Standard Theme Avatar / Uploaded Profile Picture */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={fullName || "Creator"}
                      className="h-28 w-28 rounded-full object-cover ring-2 ring-violet-500/40 shadow-xl"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-4xl font-semibold uppercase text-white shadow-lg">
                      {avatarInitial}
                    </div>
                  )}
                </div>

                {/* Profile Identity & Information */}
                <div className="flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {fullName || "Creator Name"}
                      </h2>
                      <p className="mt-0.5 text-sm font-medium text-slate-400">
                        @{username || "username"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMessage({ type: "", text: "" });
                        setIsEditing(true);
                      }}
                      className="inline-flex w-max items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 active:scale-[0.99]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit profile</span>
                    </button>
                  </div>

                  {/* Headline */}
                  {headline && (
                    <p className="mt-3 text-base font-medium text-violet-300">
                      {headline}
                    </p>
                  )}

                  {/* Metadata Tags (Location & Email) */}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    {location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {location}
                      </span>
                    )}
                    {email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        {email}
                      </span>
                    )}
                    {portfolioUrl && (
                      <a
                        href={portfolioUrl.startsWith("http") ? portfolioUrl : `https://${portfolioUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-violet-400 hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Portfolio link &rarr;
                      </a>
                    )}
                  </div>

                  {/* Bio Paragraph */}
                  <div className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {bio || "No bio added yet. Click 'Edit profile' to introduce yourself and describe your creative services."}
                  </div>

                  {/* Skills Pills */}
                  {skillArray.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {skillArray.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Box (Starts at 0 until creator adds items or brand awards projects) */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                <div className="grid grid-cols-2 divide-x divide-white/10">
                  <div
                    onClick={() => setActiveTab("projects")}
                    className="flex cursor-pointer flex-col items-center justify-center pr-4 transition hover:opacity-85"
                  >
                    <div className="flex items-center gap-2 text-slate-400">
                      <Folder className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        Verified Projects (Priority 1)
                      </span>
                    </div>
                    <span className="mt-1 text-2xl font-bold tracking-tight text-white">
                      {creatorProjects.length}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab("posts")}
                    className="flex cursor-pointer flex-col items-center justify-center pl-4 transition hover:opacity-85"
                  >
                    <div className="flex items-center gap-2 text-slate-400">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        Showcase Posts (Priority 2)
                      </span>
                    </div>
                    <span className="mt-1 text-2xl font-bold tracking-tight text-white">
                      {creatorPosts.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* DISCOVERY & FILTER CATEGORIES PREVIEW CARD                */}
              {/* Displays how this creator appears across all 10 filters   */}
              {/* ========================================================= */}
              <div className="mt-8 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-[#0a0f1d] to-[#070b14] p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300">
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Marketplace Discovery &amp; Filter Attributes
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Configured filter categories used by brands to match and discover your profile
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-violet-500/10 border border-violet-500/30 px-2.5 py-1 text-[10px] font-bold text-violet-300">
                    10 Active Categories
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* 1. Skills & 3. AI Tools */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      Skills &amp; AI Tools Used
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSkills.map((s) => (
                        <span key={s} className="rounded-lg bg-violet-500/20 text-violet-200 border border-violet-500/30 px-2 py-0.5 text-[11px]">
                          {s}
                        </span>
                      ))}
                      {selectedTools.map((t) => (
                        <span key={t} className="rounded-lg bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30 px-2 py-0.5 text-[11px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 2. Specialization & 4. Content Type */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Film className="h-3.5 w-3.5 text-fuchsia-400" />
                      Specialization &amp; Content Types
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSpecializations.map((spec) => (
                        <span key={spec} className="rounded-lg bg-white/10 text-slate-200 border border-white/15 px-2 py-0.5 text-[11px]">
                          {spec}
                        </span>
                      ))}
                      {selectedContentTypes.map((c) => (
                        <span key={c} className="rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/30 px-2 py-0.5 text-[11px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 5. Experience & 6. Portfolio Quality */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-amber-400" />
                      Experience &amp; Track Record
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-white">Level:</span>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold">
                        {experienceLevel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPortfolioQuality.map((pq) => (
                        <span key={pq} className="rounded-lg bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 text-[10px]">
                          &bull; {pq}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 7. Languages, 9. Availability & 10. Budget */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      Languages, Availability &amp; Rates
                    </p>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Languages:</span>
                        <span className="text-white font-medium">{selectedLanguages.join(", ") || "English"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Availability:</span>
                        <span className="text-emerald-300 font-semibold">{availability} ({expectedDeliveryTime})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Budget Range:</span>
                        <span className="text-amber-300 font-bold">{budgetPreference}</span>
                      </div>
                    </div>
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
                  <h2 className="text-xl font-semibold text-white">Edit Creator Profile</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Update your account details and professional credentials (usernames must be strictly lowercase and unique)
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
                
                {/* Profile Picture Upload Control */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-3xl font-bold uppercase text-white shadow-lg overflow-hidden ring-2 ring-white/10">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-sm font-semibold text-white">Creator Profile Picture</h4>
                      <p className="mt-1 text-xs text-slate-400">
                        Upload your high-resolution profile photo. Displayed on search results, video reels, hire offers, and public portfolio.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-violet-500 transition"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>{avatarUrl ? "Change Photo" : "Upload Profile Photo"}</span>
                        </button>
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
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
                  {/* Full Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>

                  {/* Strictly Lowercase Username */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-200">
                        Username
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
                        // Force strictly lowercase and strip illegal characters
                        const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "");
                        setUsername(clean);
                      }}
                      placeholder="e.g. alex_ai"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Headline */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Professional Headline
                    </label>
                    <input
                      type="text"
                      required
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. 3D Generative Filmmaker"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Remote / London"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Skills &amp; Specialties (comma-separated keywords)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Runway Gen-3, Midjourney, Motion Design, ComfyUI"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                  />
                </div>

                {/* Portfolio URL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Portfolio or Website URL
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Biography &amp; Overview
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your background, creative approach, and past client projects..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
                  />
                </div>

                {/* ========================================================= */}
                {/* ALL 10 DISCOVERY & FILTER CATEGORIES QUESTIONS           */}
                {/* Every single category from search filters is asked here  */}
                {/* ========================================================= */}
                <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/25 via-[#0b1020] to-[#070b14] p-6 shadow-2xl">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300">
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Marketplace Discovery &amp; Filter Categories (10 Categories)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Select and configure all 10 filter categories so brands can accurately discover, filter, and hire you.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">

                    {/* 1. Skills Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>1. Skills</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Select all that apply</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          "AI content writing",
                          "AI image generation",
                          "AI video generation",
                          "Prompt Engineering",
                          "Social Media content creation",
                        ].map((item) => {
                          const isSelected = selectedSkills.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleMultiOption(selectedSkills, setSelectedSkills, item)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Specialization Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>2. Specialization</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Your content niches</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          "Marketing",
                          "Product promotion",
                          "Education",
                          "Fashion technology",
                          "Gaming",
                          "YouTube / Instagram",
                        ].map((item) => {
                          const isSelected = selectedSpecializations.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleMultiOption(selectedSpecializations, setSelectedSpecializations, item)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. AI Tools Used Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>3. AI Tools Used</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Software &amp; generative engines</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["ChatGPT", "Canva AI", "Gemini", "Runway Gen-3", "Midjourney", "ComfyUI"].map((item) => {
                          const isSelected = selectedTools.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleMultiOption(selectedTools, setSelectedTools, item)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30 ring-1 ring-fuchsia-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Content Type Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>4. Content Type</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Media formats produced</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Instagram reel", "YouTube video", "Blog post", "Social media post"].map((item) => {
                          const isSelected = selectedContentTypes.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleMultiOption(selectedContentTypes, setSelectedContentTypes, item)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. Experience Level Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>5. Experience Level</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Choose primary tier</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
                        {["Beginner", "Intermediate", "Advance", "Pro"].map((item) => {
                          const isSelected = experienceLevel === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setExperienceLevel(item)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                                isSelected
                                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 ring-2 ring-violet-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 6. Portfolio Quality Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>6. Portfolio Quality</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Verification highlights</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Previous project", "Content quality", "Client review", "No. of completed projects"].map((item) => {
                          const isSelected = selectedPortfolioQuality.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleMultiOption(selectedPortfolioQuality, setSelectedPortfolioQuality, item)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 7. Language Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>7. Language</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Languages supported for campaigns</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Tamil", "English", "Hindi", "Malayalam"].map((item) => {
                          const isSelected = selectedLanguages.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleMultiOption(selectedLanguages, setSelectedLanguages, item)}
                              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 8. Client Rating / Creator Rating Attributes Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>8. Client Rating / Creator Rating Attributes</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Quality benchmarks evaluated</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Overall rating", "Client feedback", "On-time delivery", "Communication score"].map((item) => {
                          const isSelected = selectedRatingsHighlights.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleMultiOption(selectedRatingsHighlights, setSelectedRatingsHighlights, item)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 9. Availability Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>9. Availability &amp; Turnaround</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Workload capacity</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Available now", "Part-time", "Full-time"].map((item) => {
                          const isSelected = availability === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setAvailability(item)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3">
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Expected Delivery Time:
                        </label>
                        <input
                          type="text"
                          value={expectedDeliveryTime}
                          onChange={(e) => setExpectedDeliveryTime(e.target.value)}
                          placeholder="e.g. 24-48 hours, 3-5 days"
                          className="h-10 w-full sm:max-w-xs rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-xs text-white outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* 10. Budget Category */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                          <span>10. Budget Preference</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Expected compensation range</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Under $500", "$500 - $1,500", "$1,500 - $3,000", "$3,000+", "Custom / Milestone"].map((item) => {
                          const isSelected = budgetPreference === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setBudgetPreference(item)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400"
                                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
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

        {/* ========================================================= */}
        {/* SHOWCASE SECTION (Posts & Verified Projects)              */}
        {/* ========================================================= */}
        <section className="mt-12">
          {/* Section Navigation Header */}
          <div className="flex flex-col gap-4 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between pb-3">
            <div className="flex gap-8">
              <button
                type="button"
                onClick={() => setActiveTab("posts")}
                className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition ${
                  activeTab === "posts"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Film className="h-4 w-4" />
                <span>Showcase Posts ({creatorPosts.length})</span>
                {activeTab === "posts" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("projects")}
                className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition ${
                  activeTab === "projects"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Award className="h-4 w-4 text-amber-400" />
                <span>Verified Brand Projects ({creatorProjects.length})</span>
                {activeTab === "projects" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-500" />
                )}
              </button>
            </div>

            {/* Post Button: Only allows adding Posts. Projects are strictly awarded by brands! */}
            {activeTab === "posts" ? (
              <button
                type="button"
                onClick={() => setIsAddPostModalOpen(true)}
                className="inline-flex w-max items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-95"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Add Post</span>
              </button>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Projects awarded by verified brand partners</span>
              </span>
            )}
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === "posts" ? (
              <div>
                {creatorPosts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {creatorPosts.map((post) => (
                      <article
                        key={post.id}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-violet-500/40 hover:bg-white/[0.05]"
                      >
                        {/* Video / Image Preview Thumbnail */}
                        <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
                          {post.mediaType === "video" ? (
                            <video
                              src={post.mediaUrl}
                              playsInline
                              muted
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.mediaUrl}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          )}

                          {/* Category Badge */}
                          <div className="absolute top-3 right-3 z-10">
                            <span className="rounded-full bg-black/70 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase text-white backdrop-blur-md">
                              {post.category}
                            </span>
                          </div>

                          {/* Reel Rating Pill */}
                          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>
                              {post.averageRating > 0 ? post.averageRating.toFixed(1) : "New"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({post.ratingsCount} {post.ratingsCount === 1 ? "rating" : "ratings"})
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="text-base font-semibold text-white group-hover:text-violet-300">
                            {post.title}
                          </h3>

                          {/* Tools */}
                          {post.toolsUsed && post.toolsUsed.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {post.toolsUsed.map((tool, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-violet-200"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Workflow snippet */}
                          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {post.description}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  /* Clean Empty State - Strictly starts at 0 */
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-3">
                      <Film className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-semibold text-white">No showcase posts published yet</h4>
                    <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
                      Publish your video reels, AI artwork, and workflows. They will be pushed to every brand on Discovery Reels and evaluated with ratings.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddPostModalOpen(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 shadow-md"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Publish Your First Post</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* VERIFIED BRAND PROJECTS (Priority 1) */}
                {creatorProjects.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                    {creatorProjects.map((proj) => (
                      <article
                        key={proj.id}
                        className="flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 transition hover:border-amber-500/40"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                                <Award className="h-4 w-4" />
                                <span>Verified Collaboration</span>
                              </div>
                              <h3 className="mt-1 text-lg font-bold text-white">
                                {proj.title}
                              </h3>
                              <p className="text-xs font-medium text-slate-300">
                                Awarded by {proj.brandName} (@{proj.brandUsername})
                              </p>
                            </div>

                            {/* Priority 1 Rating Badge */}
                            <div className="flex items-center gap-1 rounded-xl bg-amber-400/15 border border-amber-400/30 px-3 py-1.5 text-sm font-bold text-amber-300">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span>{proj.rating}.0</span>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-white/5 bg-black/40 p-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Deliverable
                            </span>
                            <p className="text-xs font-medium text-slate-200 mt-0.5">
                              {proj.deliverable}
                            </p>
                          </div>

                          {proj.reviewText && (
                            <blockquote className="mt-4 border-l-2 border-amber-400/60 pl-3 text-xs italic text-slate-300">
                              &ldquo;{proj.reviewText}&rdquo;
                            </blockquote>
                          )}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-400">
                          {proj.budget && <span>Budget: {proj.budget}</span>}
                          <span>Completed on {new Date(proj.completedAt).toLocaleDateString()}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  /* Clean Empty State for Projects */
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                      <Award className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-semibold text-white">No verified projects completed yet</h4>
                    <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
                      Projects and Project Ratings hold the highest priority on your profile. They are awarded exclusively by Brands once you complete a successful client campaign with them.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ======================================================= */}
      {/* DESKTOP ADD POST MODAL (Category -> Resource -> Tech)   */}
      {/* ======================================================= */}
      {isAddPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-md">
          <div className="animate-in fade-in zoom-in-95 relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0a0f1d] p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Publish New Post</h2>
                <p className="text-xs text-slate-400">
                  Published to all brands on Discovery Reels and evaluated with ratings
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPostModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePublishPost} className="mt-6 space-y-5">
              
              {/* STEP 1: CATEGORY SELECTION */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. Which type of post are you publishing?
                </label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "video", label: "🎬 Video Reel" },
                    { id: "image", label: "🖼️ AI Image" },
                    { id: "ai", label: "⚡ AI Workflow" },
                    { id: "motion", label: "🎨 3D / Motion" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setPostCategory(cat.id as PostCategory);
                        setMediaFilePreview(null);
                        setPostMediaUrl("");
                      }}
                      className={`rounded-xl p-3 text-xs font-semibold transition text-center ${
                        postCategory === cat.id
                          ? "border border-violet-500 bg-violet-600/30 text-white shadow-md shadow-violet-500/20"
                          : "border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 2: RESOURCE UPLOAD (FILE OR URL) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Upload {postCategory.toUpperCase()} Resource
                </label>

                {/* Upload Card */}
                <div className="mt-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-5 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept={
                      postCategory === "image"
                        ? "image/*"
                        : "video/mp4,video/webm,video/quicktime"
                    }
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {mediaFilePreview ? (
                    <div className="flex flex-col items-center">
                      {postCategory === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaFilePreview}
                          alt="Resource preview"
                          className="max-h-48 rounded-xl object-contain border border-white/10"
                        />
                      ) : (
                        <video
                          src={mediaFilePreview}
                          controls
                          className="max-h-52 rounded-xl object-contain border border-white/10"
                        />
                      )}
                      <p className="mt-2 text-xs font-medium text-emerald-400">
                        ✓ {mediaFileName || "Resource selected"}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 text-xs text-violet-400 underline hover:text-violet-300"
                      >
                        Change file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-2">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-white">
                        Click to upload your {postCategory} file
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {postCategory === "image"
                          ? "PNG, JPG, WebP supported"
                          : "MP4, WebM (Recommended for Discovery Reels)"}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 rounded-xl bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                      >
                        Choose Local File
                      </button>
                    </div>
                  )}

                  {/* Or Enter Media Link */}
                  <div className="mt-4 border-t border-white/10 pt-3 text-left">
                    <label className="text-[11px] font-medium text-slate-400">
                      Or paste a direct {postCategory} URL:
                    </label>
                    <input
                      type="url"
                      value={postMediaUrl}
                      onChange={(e) => {
                        setPostMediaUrl(e.target.value);
                        setMediaFilePreview(e.target.value);
                      }}
                      placeholder={
                        postCategory === "video"
                          ? "https://example.com/video.mp4"
                          : "https://example.com/image.png"
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: TITLE, TOOLS, SKILLS, DESCRIPTION */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Post Title / Hook
                  </label>
                  <input
                    type="text"
                    required
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. Cyberpunk Tokyo Noir - Generative Short"
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Tools Used
                    </label>
                    <input
                      type="text"
                      required
                      value={postTools}
                      onChange={(e) => setPostTools(e.target.value)}
                      placeholder="e.g. Runway Gen-3, Midjourney, ComfyUI, Topaz"
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Skills Applied
                    </label>
                    <input
                      type="text"
                      required
                      value={postSkills}
                      onChange={(e) => setPostSkills(e.target.value)}
                      placeholder="e.g. Prompt Engineering, LoRA, Color Grading"
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs text-white outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    How It Was Built / Creation Workflow
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    placeholder="Explain your prompt chaining, motion controls, upscaling, and workflow so brands understand your technical skill..."
                    className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddPostModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingMedia}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-95 disabled:opacity-50"
                >
                  Publish Post &rarr;
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </main>
  );
}