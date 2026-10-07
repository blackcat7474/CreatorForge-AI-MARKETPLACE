"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { BrandLeftNav, BrandHeaderNav } from "@/components/brand-navigation";
import {
  getCreatorRatingsSummary,
  getMarketplacePosts,
  getCreatorProjects,
} from "@/lib/marketplace-store";
import {
  Search,
  SlidersHorizontal,
  Star,
  Award,
  Film,
  ArrowLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export type EnrichedCreator = {
  id: string;
  username: string;
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  skills: string;
  skillsList: string[];
  specializationsList: string[];
  toolsList: string[];
  contentTypesList: string[];
  experienceLevel: string;
  portfolioQualityList: string[];
  languagesList: string[];
  ratingsHighlights: string[];
  availability: string;
  expectedDeliveryTime: string;
  budgetPreference: string;
  projectRating: number;
  postRating: number;
  overallRating: number;
  hasProjectRating: boolean;
  hasPostRating: boolean;
  completedProjectsCount: number;
  totalPostsCount: number;
  avatarUrl?: string;
  searchRelevanceScore?: number;
};

// Seed knowledge enrichment for prominent AI creators
const SEED_CREATORS_ENRICHMENT: Record<string, Partial<EnrichedCreator>> = {
  irfuu_20: {
    skillsList: [
      "AI content writing",
      "AI video generation",
      "Prompt Engineering",
      "Social Media content creation",
    ],
    specializationsList: ["Marketing", "YouTube / Instagram", "Education", "Product promotion"],
    toolsList: ["Runway Gen-3", "Midjourney", "ChatGPT", "Canva AI", "Gemini"],
    contentTypesList: ["Instagram reel", "YouTube video", "Social media post"],
    experienceLevel: "Advance",
    portfolioQualityList: ["Previous project", "Content quality", "Client review", "No. of completed projects"],
    languagesList: ["Tamil", "English"],
    ratingsHighlights: ["Overall rating", "Client feedback", "On-time delivery", "Communication score"],
    availability: "Available now",
    expectedDeliveryTime: "24-48 hours",
    budgetPreference: "$500 - $1,500",
  },
  alex_ai: {
    skillsList: [
      "AI video generation",
      "Prompt Engineering",
      "AI image generation",
      "Motion Dynamics",
    ],
    specializationsList: ["Marketing", "YouTube / Instagram", "Gaming"],
    toolsList: ["Runway Gen-3", "Midjourney", "ComfyUI", "ChatGPT"],
    contentTypesList: ["Instagram reel", "YouTube video"],
    experienceLevel: "Pro",
    portfolioQualityList: ["Previous project", "Content quality", "Client review", "No. of completed projects"],
    languagesList: ["English"],
    ratingsHighlights: ["Overall rating", "Client feedback", "On-time delivery"],
    availability: "Available now",
    expectedDeliveryTime: "2-3 days",
    budgetPreference: "$3,000+",
  },
  sarah_gen: {
    skillsList: [
      "AI image generation",
      "Prompt Engineering",
      "AI video generation",
      "Sound FX Design",
    ],
    specializationsList: ["Product promotion", "Education", "Marketing"],
    toolsList: ["Midjourney", "ChatGPT", "Canva AI"],
    contentTypesList: ["Instagram reel", "Social media post", "Blog post"],
    experienceLevel: "Advance",
    portfolioQualityList: ["Previous project", "Content quality", "Client review", "No. of completed projects"],
    languagesList: ["English", "Hindi"],
    ratingsHighlights: ["Overall rating", "Client feedback", "Communication score"],
    availability: "Part-time",
    expectedDeliveryTime: "3-5 days",
    budgetPreference: "$1,500 - $3,000",
  },
  mike_fx: {
    skillsList: ["AI video generation", "Prompt Engineering"],
    specializationsList: ["Gaming", "Product promotion", "Marketing"],
    toolsList: ["Runway Gen-3", "ComfyUI", "ChatGPT"],
    contentTypesList: ["YouTube video", "Instagram reel"],
    experienceLevel: "Pro",
    portfolioQualityList: ["Previous project", "Content quality"],
    languagesList: ["English"],
    ratingsHighlights: ["Overall rating", "On-time delivery"],
    availability: "Full-time",
    expectedDeliveryTime: "24-48 hours",
    budgetPreference: "$1,500 - $3,000",
  },
  lena_create: {
    skillsList: ["AI image generation", "AI video generation", "Social Media content creation"],
    specializationsList: ["Fashion technology", "Marketing", "YouTube / Instagram"],
    toolsList: ["Midjourney", "Runway Gen-3", "Canva AI"],
    contentTypesList: ["Instagram reel", "Social media post"],
    experienceLevel: "Pro",
    portfolioQualityList: ["Previous project", "Content quality", "Client review"],
    languagesList: ["English", "Tamil"],
    ratingsHighlights: ["Overall rating", "Client feedback", "Communication score"],
    availability: "Available now",
    expectedDeliveryTime: "2-3 days",
    budgetPreference: "$3,000+",
  },
};

// Attribute extraction and profile enrichment helper
function enrichCreator(base: {
  id: string;
  username: string;
  displayName: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string;
  avatarUrl?: string;
}): EnrichedCreator {
  const clean = base.username.trim().toLowerCase().replace(/^@/, "");
  const ratingsSummary = getCreatorRatingsSummary(clean);
  const posts = getMarketplacePosts().filter(
    (p) => p.creatorUsername.toLowerCase().replace(/^@/, "") === clean
  );
  const projects = getCreatorProjects(clean);

  // Extract from marketplace posts
  const postSkills = posts.flatMap((p) => p.skillsApplied || []);
  const postTools = posts.flatMap((p) => p.toolsUsed || []);
  const postContentTypes = posts.map((p) =>
    p.category === "video" ? "Instagram reel" : "Social media post"
  );

  // Read saved category filters from localStorage if present
  type CreatorFilterData = {
    skills?: string[];
    specialization?: string[];
    tools?: string[];
    contentType?: string[];
    experience?: string;
    portfolioQuality?: string[];
    language?: string[];
    ratings?: string[];
    availability?: string;
    expectedDeliveryTime?: string;
    budget?: string;
  };
  let storedFilters: CreatorFilterData = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`creator_filter_categories_${clean}`);
      if (raw) storedFilters = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  // Seed knowledge defaults
  const seed = SEED_CREATORS_ENRICHMENT[clean] || {};

  // Avatar lookup
  let avatarUrl = base.avatarUrl || "";
  if (!avatarUrl && typeof window !== "undefined") {
    avatarUrl = localStorage.getItem(`creator_avatar_${clean}`) || "";
  }

  // Raw skills parsing
  const rawSkillTokens = (base.skills || "")
    .split(/[,•\n/|]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const skillsList = Array.from(
    new Set([
      ...(Array.isArray(storedFilters.skills) ? storedFilters.skills : []),
      ...(seed.skillsList || []),
      ...postSkills,
      ...rawSkillTokens,
    ])
  );

  const specializationsList = Array.from(
    new Set([
      ...(Array.isArray(storedFilters.specialization) ? storedFilters.specialization : []),
      ...(seed.specializationsList || []),
      ...(base.headline ? [base.headline] : []),
    ])
  );

  const toolsList = Array.from(
    new Set([
      ...(Array.isArray(storedFilters.tools) ? storedFilters.tools : []),
      ...(seed.toolsList || []),
      ...postTools,
    ])
  );

  const contentTypesList = Array.from(
    new Set([
      ...(Array.isArray(storedFilters.contentType) ? storedFilters.contentType : []),
      ...(seed.contentTypesList || []),
      ...postContentTypes,
    ])
  );

  const languagesList = Array.from(
    new Set([
      ...(Array.isArray(storedFilters.language) ? storedFilters.language : []),
      ...(seed.languagesList || []),
      ...(base.bio?.toLowerCase().includes("tamil") || base.location?.toLowerCase().includes("tamil") ? ["Tamil"] : []),
      ...(base.bio?.toLowerCase().includes("hindi") ? ["Hindi"] : []),
      ...(base.bio?.toLowerCase().includes("malayalam") ? ["Malayalam"] : []),
      "English",
    ])
  );

  const portfolioQualityList = Array.from(
    new Set([
      ...(Array.isArray(storedFilters.portfolioQuality) ? storedFilters.portfolioQuality : []),
      ...(seed.portfolioQualityList || []),
      ...(projects.length > 0 ? ["Previous project", "No. of completed projects", "Client review"] : []),
      ...(posts.length > 0 ? ["Content quality"] : []),
    ])
  );

  const ratingsHighlights = Array.from(
    new Set([
      ...(Array.isArray(storedFilters.ratings) ? storedFilters.ratings : []),
      ...(seed.ratingsHighlights || []),
      ...(ratingsSummary.overallRating >= 4.0 ? ["Overall rating"] : []),
      ...(ratingsSummary.hasProjectRating ? ["Client feedback"] : []),
    ])
  );

  const experienceLevel =
    storedFilters.experience ||
    seed.experienceLevel ||
    (projects.length >= 2 || ratingsSummary.overallRating >= 4.7 ? "Pro" : "Advance");

  const availability =
    storedFilters.availability ||
    seed.availability ||
    "Available now";

  const expectedDeliveryTime =
    storedFilters.expectedDeliveryTime ||
    seed.expectedDeliveryTime ||
    "24-48 hours";

  const budgetPreference =
    storedFilters.budget ||
    seed.budgetPreference ||
    "$500 - $1,500";

  return {
    id: base.id,
    username: clean,
    displayName: base.displayName || clean,
    headline: base.headline || "",
    bio: base.bio || "",
    location: base.location || "",
    skills: base.skills || skillsList.join(", ") || "AI Creator",
    skillsList,
    specializationsList,
    toolsList,
    contentTypesList,
    experienceLevel,
    portfolioQualityList,
    languagesList,
    ratingsHighlights,
    availability,
    expectedDeliveryTime,
    budgetPreference,
    projectRating: ratingsSummary.projectRating,
    postRating: ratingsSummary.postRating,
    overallRating: ratingsSummary.overallRating,
    hasProjectRating: ratingsSummary.hasProjectRating,
    hasPostRating: ratingsSummary.hasPostRating,
    completedProjectsCount: ratingsSummary.completedProjectsCount,
    totalPostsCount: ratingsSummary.totalPostsCount,
    avatarUrl,
  };
}

// Check if creator satisfies a single selected filter option in a category
function matchesSingleOption(creator: EnrichedCreator, categoryId: string, option: string): boolean {
  const opt = option.trim().toLowerCase();

  switch (categoryId) {
    case "skills": {
      return (
        creator.skillsList.some(
          (s) => s.toLowerCase().includes(opt) || opt.includes(s.toLowerCase())
        ) ||
        creator.skills.toLowerCase().includes(opt) ||
        creator.bio.toLowerCase().includes(opt)
      );
    }
    case "specialization": {
      return (
        creator.specializationsList.some(
          (s) => s.toLowerCase().includes(opt) || opt.includes(s.toLowerCase())
        ) ||
        creator.headline.toLowerCase().includes(opt) ||
        creator.bio.toLowerCase().includes(opt) ||
        creator.skills.toLowerCase().includes(opt)
      );
    }
    case "tools": {
      return (
        creator.toolsList.some(
          (t) => t.toLowerCase().includes(opt) || opt.includes(t.toLowerCase())
        ) ||
        creator.skills.toLowerCase().includes(opt) ||
        creator.bio.toLowerCase().includes(opt)
      );
    }
    case "contentType": {
      return (
        creator.contentTypesList.some(
          (c) => c.toLowerCase().includes(opt) || opt.includes(c.toLowerCase())
        ) ||
        creator.skills.toLowerCase().includes(opt) ||
        creator.bio.toLowerCase().includes(opt) ||
        creator.totalPostsCount > 0
      );
    }
    case "experience": {
      const hierarchy = ["beginner", "intermediate", "advance", "pro"];
      const creatorExp = (creator.experienceLevel || "intermediate").toLowerCase();
      const targetExp = opt;
      if (creatorExp === targetExp) return true;
      const cIdx = hierarchy.indexOf(creatorExp);
      const tIdx = hierarchy.indexOf(targetExp);
      if (cIdx >= 0 && tIdx >= 0) {
        return cIdx >= tIdx;
      }
      return creatorExp.includes(targetExp) || targetExp.includes(creatorExp);
    }
    case "portfolioQuality": {
      if (opt.includes("previous project")) {
        return creator.completedProjectsCount > 0 || creator.totalPostsCount > 0;
      }
      if (opt.includes("content quality")) {
        return creator.overallRating >= 4.0 || creator.totalPostsCount > 0;
      }
      if (opt.includes("client review")) {
        return creator.completedProjectsCount > 0 || creator.hasProjectRating;
      }
      if (opt.includes("completed")) {
        return creator.completedProjectsCount > 0;
      }
      return creator.portfolioQualityList.some((pq) => pq.toLowerCase().includes(opt));
    }
    case "language": {
      return (
        creator.languagesList.some(
          (l) => l.toLowerCase() === opt || l.toLowerCase().includes(opt)
        ) ||
        creator.bio.toLowerCase().includes(opt) ||
        creator.location.toLowerCase().includes(opt)
      );
    }
    case "ratings": {
      if (opt.includes("overall")) {
        return creator.overallRating >= 4.0;
      }
      if (opt.includes("feedback")) {
        return creator.hasProjectRating || creator.hasPostRating;
      }
      if (opt.includes("delivery") || opt.includes("on-time")) {
        return creator.overallRating >= 4.3 || creator.ratingsHighlights.some((r) => r.toLowerCase().includes("delivery"));
      }
      if (opt.includes("communication")) {
        return creator.overallRating >= 4.3 || creator.ratingsHighlights.some((r) => r.toLowerCase().includes("communication"));
      }
      return creator.overallRating > 0;
    }
    case "availability": {
      const avail = (creator.availability || "").toLowerCase();
      if (opt.includes("available now")) {
        return avail.includes("available") || avail.includes("now");
      }
      if (opt.includes("part-time")) {
        return avail.includes("part");
      }
      if (opt.includes("full-time")) {
        return avail.includes("full");
      }
      if (opt.includes("delivery time")) {
        return Boolean(creator.expectedDeliveryTime);
      }
      return avail.includes(opt);
    }
    case "budget": {
      const cBudget = (creator.budgetPreference || "").toLowerCase();
      if (cBudget.includes(opt) || opt.includes(cBudget)) return true;
      if (opt.includes("under $500") && (cBudget.includes("500") || cBudget.includes("under"))) return true;
      if (opt.includes("$500 - $1,500") && (cBudget.includes("500") || cBudget.includes("1,500"))) return true;
      if (opt.includes("$1,500 - $3,000") && (cBudget.includes("1,500") || cBudget.includes("3,000"))) return true;
      if (opt.includes("$3,000+") && (cBudget.includes("3,000") || cBudget.includes("custom"))) return true;
      if (opt.includes("custom") && (cBudget.includes("custom") || cBudget.includes("milestone"))) return true;
      return true;
    }
    default:
      return true;
  }
}

// Evaluates conjunction (AND) across all selected categories, and disjunction (OR) within each category
function matchesAllAppliedCategories(
  creator: EnrichedCreator,
  filters: Record<string, string[]>
): boolean {
  for (const [catId, options] of Object.entries(filters)) {
    if (!options || options.length === 0) continue;
    // Disjunction (OR) within this category
    const hasCategoryMatch = options.some((option) =>
      matchesSingleOption(creator, catId, option)
    );
    if (!hasCategoryMatch) {
      // Failed this category requirement: fails conjunction (AND) across categories
      return false;
    }
  }
  return true;
}

// Compute relevance score for text query matching
function computeSearchScore(creator: EnrichedCreator, term: string): number {
  if (!term) return 1;
  const clean = term.toLowerCase().trim().replace(/^@/, "");
  if (!clean) return 1;

  let score = 0;
  const username = creator.username.toLowerCase();
  const id = creator.id.toLowerCase();
  const displayName = creator.displayName.toLowerCase();
  const skills = creator.skills.toLowerCase();
  const bio = creator.bio.toLowerCase();
  const headline = creator.headline.toLowerCase();
  const location = creator.location.toLowerCase();

  // Exact matches (highest priority)
  if (username === clean) score += 250;
  if (id === clean) score += 250;
  if (displayName === clean) score += 180;

  // Prefix matches
  if (username.startsWith(clean)) score += 120;
  if (displayName.startsWith(clean)) score += 100;
  if (id.startsWith(clean)) score += 90;

  // Substring matches
  if (username.includes(clean)) score += 70;
  if (displayName.includes(clean)) score += 60;
  if (id.includes(clean)) score += 50;

  // Skill / Tool matches
  if (creator.skillsList.some((s) => s.toLowerCase() === clean)) score += 80;
  if (creator.skillsList.some((s) => s.toLowerCase().includes(clean))) score += 50;
  if (creator.toolsList.some((t) => t.toLowerCase() === clean)) score += 60;
  if (creator.toolsList.some((t) => t.toLowerCase().includes(clean))) score += 40;
  if (skills.includes(clean)) score += 40;

  // Specialization matches
  if (creator.specializationsList.some((sp) => sp.toLowerCase().includes(clean))) score += 40;

  // Language matches
  if (creator.languagesList.some((l) => l.toLowerCase() === clean)) score += 50;

  // Headline / Bio / Location
  if (headline.includes(clean)) score += 30;
  if (bio.includes(clean)) score += 20;
  if (location.includes(clean)) score += 20;

  return score;
}

// Filter Categories and Sub-options exactly as requested
export const FILTER_CATEGORIES = [
  {
    id: "skills",
    name: "Skills",
    subOptions: [
      "AI content writing",
      "AI image generation",
      "AI video generation",
      "Prompt Engineering",
      "Social Media content creation",
    ],
  },
  {
    id: "specialization",
    name: "Specialization",
    subOptions: [
      "Marketing",
      "Product promotion",
      "Education",
      "Fashion technology",
      "Gaming",
      "YouTube / Instagram",
    ],
  },
  {
    id: "tools",
    name: "AI Tools Used",
    subOptions: ["ChatGPT", "Canva AI", "Gemini", "Runway Gen-3", "Midjourney", "ComfyUI"],
  },
  {
    id: "contentType",
    name: "Content Type",
    subOptions: [
      "Instagram reel",
      "YouTube video",
      "Blog post",
      "Social media post",
    ],
  },
  {
    id: "experience",
    name: "Experience Level",
    subOptions: ["Beginner", "Intermediate", "Advance", "Pro"],
  },
  {
    id: "portfolioQuality",
    name: "Portfolio Quality",
    subOptions: [
      "Previous project",
      "Content quality",
      "Client review",
      "No. of completed projects",
    ],
  },
  {
    id: "language",
    name: "Language",
    subOptions: ["Tamil", "English", "Hindi", "Malayalam"],
  },
  {
    id: "ratings",
    name: "Client Rating / Creator Rating",
    subOptions: [
      "Overall rating",
      "Client feedback",
      "On-time delivery",
      "Communication score",
    ],
  },
  {
    id: "availability",
    name: "Availability",
    subOptions: [
      "Available now",
      "Part-time",
      "Full-time",
      "Expected delivery time",
    ],
  },
  {
    id: "budget",
    name: "Budget",
    subOptions: [
      "Under $500",
      "$500 - $1,500",
      "$1,500 - $3,000",
      "$3,000+",
      "Custom / Milestone",
    ],
  },
];

function CreatorSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery.trim()));
  const [results, setResults] = useState<EnrichedCreator[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // Filter Modal & State Management (Matching Handwritten Sketch)
  // -------------------------------------------------------------
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState("skills");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  // Staging filters inside the modal
  const [stagedFilters, setStagedFilters] = useState<Record<string, string[]>>({});
  // Applied filters that actually filter the search results
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  // Role authorization check: Only brands can browse creator directory
  useEffect(() => {
    async function checkRole() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login?role=brand");
        return;
      }
      if (user.user_metadata?.role && user.user_metadata.role !== "brand") {
        router.replace("/creator/profile");
      }
    }
    checkRole();
  }, [router]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const totalAppliedFilters = Object.values(appliedFilters).flat().length;

  // -------------------------------------------------------------
  // Search & Filter Execution
  // -------------------------------------------------------------
  const executeSearch = useCallback(
    async (
      searchTerm: string,
      currentFilters: Record<string, string[]>,
      showAll = false
    ) => {
      const cleanTerm = searchTerm.trim().toLowerCase().replace(/^@/, "");
      const activeFilterList = Object.values(currentFilters).flat();

      // If query is empty, no filters applied, and not in browse-all mode: keep space completely blank
      if (!cleanTerm && activeFilterList.length === 0 && !showAll) {
        setHasSearched(false);
        setResults([]);
        setIsSearching(false);
        return;
      }

      setHasSearched(true);
      setIsSearching(true);

      try {
        const supabase = createClient();

        // 1. Query registered profiles from Supabase profiles table
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, bio, location, skills, headline, role_specific_name, avatar_url");

        const creatorsMap = new Map<
          string,
          {
            id: string;
            username: string;
            displayName: string;
            headline?: string;
            skills: string;
            bio: string;
            location: string;
            avatarUrl?: string;
          }
        >();

        // Seed creators baseline registration (ensures foundational creators are never missing)
        const SEED_BASE: Array<{
          id: string;
          username: string;
          displayName: string;
          headline: string;
          skills: string;
          bio: string;
          location: string;
        }> = [
          {
            id: "ce4c4f17-a556-4bd4-9889-ce57633d25aa",
            username: "irfuu_20",
            displayName: "Irfan M",
            headline: "AI Engineer & Generative Video Producer",
            skills: "AI Content Writing, AI Video Generation, Prompt Engineering",
            bio: "Specializing in enterprise AI marketing videos, custom LoRA generation, and cyber security explainer reels in Tamil & English.",
            location: "Chennai, India",
          },
          {
            id: "creator-alex",
            username: "alex_ai",
            displayName: "Alex Vance",
            headline: "Cinematic Neo-Tokyo Visual Director",
            skills: "AI Video Generation, Consistent Character LoRA, Motion Dynamics",
            bio: "Directing high-octane 4K commercial reels with Runway Gen-3 and Midjourney v6.",
            location: "Tokyo / San Francisco",
          },
          {
            id: "creator-sarah",
            username: "sarah_gen",
            displayName: "Sarah Chen",
            headline: "Biomorphic Visual Architect",
            skills: "AI Image Generation, Prompt Engineering, Sound FX Design",
            bio: "Crafting organic, hyper-stylized commercial product drops using Kling AI and ElevenLabs.",
            location: "London, UK",
          },
          {
            id: "creator-mike",
            username: "mike_fx",
            displayName: "Mike Reynolds",
            headline: "Kinetic Motion & 3D Specialist",
            skills: "AI Video Generation, Prompt Engineering, 3D Camera Tracking",
            bio: "Translating brand concepts into broadcast-grade kinetic AI advertisements.",
            location: "New York, USA",
          },
          {
            id: "creator-lena",
            username: "lena_create",
            displayName: "Lena Rostova",
            headline: "Generative Fashion Director",
            skills: "AI Image Generation, AI Video Generation, Fashion Styling",
            bio: "Pioneering zero-gravity high-fashion simulations and aesthetic brand campaigns.",
            location: "Milan / Paris",
          },
        ];

        SEED_BASE.forEach((seed) => {
          creatorsMap.set(seed.username.toLowerCase(), seed);
        });

        if (!error && Array.isArray(data)) {
          data.forEach((p) => {
            if (p.username) {
              const cleanUser = p.username.trim().toLowerCase().replace(/^@/, "");
              creatorsMap.set(cleanUser, {
                id: p.id,
                username: cleanUser,
                displayName: p.display_name || cleanUser,
                headline: p.headline || p.role_specific_name || "",
                skills:
                  p.skills ||
                  p.headline ||
                  p.role_specific_name ||
                  p.bio ||
                  "AI Content Creator",
                bio: p.bio || "",
                location: p.location || "",
                avatarUrl: p.avatar_url || "",
              });
            }
          });
        }

        // 2. Also include any creators who published posts in the local marketplace store
        const localPosts = getMarketplacePosts();
        localPosts.forEach((post) => {
          const cleanUser = post.creatorUsername.trim().toLowerCase().replace(/^@/, "");
          if (!creatorsMap.has(cleanUser)) {
            creatorsMap.set(cleanUser, {
              id: post.creatorId,
              username: cleanUser,
              displayName: post.creatorName || cleanUser,
              headline: "AI Content Creator",
              skills:
                post.skillsApplied?.join(", ") ||
                post.toolsUsed?.join(", ") ||
                "AI Content Creator",
              bio: post.description || "",
              location: "",
              avatarUrl: post.creatorAvatar || "",
            });
          }
        });

        // 3. Also check localStorage for active logged-in creator or cached creators
        if (typeof window !== "undefined") {
          try {
            const rawActive = localStorage.getItem("ai_marketplace_active_user");
            if (rawActive) {
              const active = JSON.parse(rawActive);
              if (active?.username) {
                const activeClean = active.username.trim().toLowerCase().replace(/^@/, "");
                if (!creatorsMap.has(activeClean)) {
                  creatorsMap.set(activeClean, {
                    id: active.id || `active-${activeClean}`,
                    username: activeClean,
                    displayName: active.name || active.displayName || activeClean,
                    headline: active.headline || active.roleSpecificName || "AI Creator",
                    skills: active.skills || "AI Content Creator",
                    bio: active.bio || "",
                    location: active.location || "",
                    avatarUrl: active.avatarUrl || "",
                  });
                }
              }
            }
          } catch {
            // ignore
          }
        }

        // 4. Enrich every creator profile with full attributes, ratings, and projects
        const allEnriched: EnrichedCreator[] = Array.from(creatorsMap.values()).map((raw) =>
          enrichCreator(raw)
        );

        // 5. Accurate Text Query Matching & Scoring
        let candidateCreators: EnrichedCreator[] = allEnriched;
        if (cleanTerm) {
          candidateCreators = candidateCreators
            .map((c) => ({
              ...c,
              searchRelevanceScore: computeSearchScore(c, cleanTerm),
            }))
            .filter((c) => (c.searchRelevanceScore || 0) > 0);
        } else {
          candidateCreators = candidateCreators.map((c) => ({
            ...c,
            searchRelevanceScore: 1,
          }));
        }

        // 6. Accurate Multi-Category Conjunction (AND across categories, OR within category)
        if (activeFilterList.length > 0) {
          candidateCreators = candidateCreators.filter((c) =>
            matchesAllAppliedCategories(c, currentFilters)
          );
        }

        // 7. Sort by:
        // Priority A: Search relevance score (exact handle / ID matches at the very top)
        // Priority B: Overall rating descending
        // Priority C: Completed projects count descending
        candidateCreators.sort((a, b) => {
          const scoreA = a.searchRelevanceScore || 0;
          const scoreB = b.searchRelevanceScore || 0;
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          if (b.overallRating !== a.overallRating) {
            return b.overallRating - a.overallRating;
          }
          return b.completedProjectsCount - a.completedProjectsCount;
        });

        setResults(candidateCreators);
      } catch (err) {
        console.error("Error executing creator search:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    executeSearch(initialQuery, appliedFilters);
  }, [initialQuery, appliedFilters, executeSearch]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/brand/creators?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/brand/creators");
    }
    executeSearch(trimmed, appliedFilters);
  }

  // -------------------------------------------------------------
  // Filter Modal Actions
  // -------------------------------------------------------------
  function openFilterModal() {
    // Clone applied filters into staged state
    setStagedFilters({ ...appliedFilters });
    setCategorySearchQuery("");
    setIsFilterModalOpen(true);
  }

  function closeFilterModal() {
    setIsFilterModalOpen(false);
  }

  function toggleSubOption(catId: string, option: string) {
    setStagedFilters((prev) => {
      const currentList = prev[catId] || [];
      const exists = currentList.includes(option);
      const updatedList = exists
        ? currentList.filter((item) => item !== option)
        : [...currentList, option];

      const next = { ...prev };
      if (updatedList.length > 0) {
        next[catId] = updatedList;
      } else {
        delete next[catId];
      }
      return next;
    });
  }

  function handleApplyFilters() {
    setAppliedFilters({ ...stagedFilters });
    setIsFilterModalOpen(false);
    executeSearch(query, stagedFilters);
  }

  function handleClearAllFilters() {
    setStagedFilters({});
    setAppliedFilters({});
    executeSearch(query, {});
  }

  function removeIndividualFilter(catId: string, option: string) {
    setAppliedFilters((prev) => {
      const currentList = prev[catId] || [];
      const updatedList = currentList.filter((item) => item !== option);
      const next = { ...prev };
      if (updatedList.length > 0) {
        next[catId] = updatedList;
      } else {
        delete next[catId];
      }
      executeSearch(query, next);
      return next;
    });
  }

  // Sensible Empty State Recovery Handlers
  function handleClearFiltersKeepSearch() {
    setStagedFilters({});
    setAppliedFilters({});
    executeSearch(query, {});
  }

  function handleClearSearchKeepFilters() {
    setQuery("");
    router.push("/brand/creators");
    executeSearch("", appliedFilters);
  }

  function handleBrowseAllCreators() {
    setQuery("");
    setStagedFilters({});
    setAppliedFilters({});
    router.push("/brand/creators");
    executeSearch("", {}, true);
  }

  function handleQuickSearch(term: string) {
    setQuery(term);
    router.push(`/brand/creators?q=${encodeURIComponent(term)}`);
    executeSearch(term, appliedFilters);
  }

  // Active Category object in Modal
  const activeCategory =
    FILTER_CATEGORIES.find((c) => c.id === activeCategoryTab) || FILTER_CATEGORIES[0];

  // Filter sub-options by internal search input: `[ search skill 🔍 ]`
  const displayedSubOptions = activeCategory.subOptions.filter((opt) =>
    opt.toLowerCase().includes(categorySearchQuery.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/brand/profile"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Profile</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Find AI Creators</h1>
            <p className="text-xs text-slate-400">Search by creator ID, username, or advanced criteria</p>
          </div>
        </div>

        <BrandHeaderNav />
      </div>

      {/* ============================================================== */}
      {/* SEARCH BAR & FILTER ICON BUTTON (MATCHING HANDWRITTEN SKETCH)  */}
      {/* ============================================================== */}
      <div className="flex items-center gap-3">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
            <Search className="h-5 w-5" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim() && totalAppliedFilters === 0) {
                setHasSearched(false);
                setResults([]);
              }
            }}
            placeholder="Content Creator, username (e.g. irfuu_20), or skill..."
            className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.045] py-3.5 pl-12 pr-28 text-sm text-white shadow-lg outline-none transition focus:border-violet-500 focus:bg-white/[0.07]"
          />
          <button
            type="submit"
            className="absolute inset-y-2 right-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-md transition hover:bg-violet-500"
          >
            Search
          </button>
        </form>

        {/* Filter Button (When pressed opens Pop-up as in sketch) */}
        <button
          type="button"
          onClick={openFilterModal}
          title="Open Search Filter Options"
          className={`flex h-14 shrink-0 items-center gap-2 rounded-2xl border px-4 font-semibold text-sm transition shadow-lg ${
            totalAppliedFilters > 0
              ? "border-violet-500/50 bg-violet-600/20 text-white"
              : "border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <SlidersHorizontal className="h-5 w-5 text-violet-400" />
          <span className="hidden sm:inline">Filter</span>
          {totalAppliedFilters > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-[11px] font-bold text-white shadow">
              {totalAppliedFilters}
            </span>
          )}
        </button>
      </div>

      {/* Applied Filters Chips Display */}
      {totalAppliedFilters > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 animate-in fade-in">
          <span className="text-xs font-medium text-slate-400">Active Filters:</span>
          {Object.entries(appliedFilters).map(([catId, options]) =>
            options.map((opt) => (
              <span
                key={`${catId}-${opt}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-600/15 px-3 py-1 text-xs font-medium text-violet-200"
              >
                <span>{opt}</span>
                <button
                  type="button"
                  onClick={() => removeIndividualFilter(catId, opt)}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white ml-2 underline"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* RESULTS SECTION (BLANK BEFORE SEARCH AS REQUESTED)            */}
      {/* ============================================================== */}
      <div className="mt-8">
        {isSearching ? (
          <div className="flex justify-center py-12 text-sm text-violet-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : !hasSearched && totalAppliedFilters === 0 ? (
          /* When not searched yet & no filters: Keep the space completely blank as requested */
          <div className="min-h-[160px]" />
        ) : results.length > 0 ? (
          /* Match State: Display found creators */
          <>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Matched Creators ({results.length})
            </p>

            <div className="space-y-4">
              {results.map((creator) => (
                <div
                  key={creator.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-violet-500/50 hover:bg-white/[0.05]"
                >
                  <Link
                    href={`/brand/creators/${creator.username || creator.id}`}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-lg font-bold text-white shadow-md group-hover:ring-2 group-hover:ring-violet-400 transition overflow-hidden">
                      {creator.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={creator.avatarUrl} alt={creator.displayName} className="h-full w-full object-cover" />
                      ) : (
                        creator.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white group-hover:text-violet-300 transition">
                          {creator.displayName}
                        </p>
                        <span className="text-xs text-violet-300 font-medium">
                          @{creator.username}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{creator.skills}</p>
                    </div>
                  </Link>

                  {/* Ratings Display & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Priority 1: Project Rating */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                      <Award className="h-3.5 w-3.5 text-amber-400" />
                      <span>
                        Project: {creator.hasProjectRating ? `${creator.projectRating.toFixed(1)}★` : "Unrated"}
                      </span>
                    </div>

                    {/* Priority 2: Reel Rating */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
                      <Film className="h-3.5 w-3.5 text-violet-400" />
                      <span>
                        Reel: {creator.postRating > 0 ? `${creator.postRating.toFixed(1)}★` : "—"}
                      </span>
                    </div>

                    {/* Overall Score */}
                    <div className="flex items-center gap-1 rounded-xl bg-violet-600/30 border border-violet-500/40 px-3 py-1.5 text-xs font-bold text-white">
                      <Star className="h-3.5 w-3.5 fill-violet-400 text-violet-400" />
                      <span>
                        {creator.overallRating > 0 ? creator.overallRating.toFixed(1) : "New"}
                      </span>
                    </div>

                    {/* View Creator Profile Button */}
                    <Link
                      href={`/brand/creators/${creator.username || creator.id}`}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Sensible Empty Results Architecture */
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 sm:p-12 text-center animate-in fade-in duration-300">
            {/* Scenario 1: Both Search Query AND Filters are Active */}
            {query.trim() && totalAppliedFilters > 0 ? (
              <div className="mx-auto max-w-lg">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-inner">
                  <SlidersHorizontal className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  No creators match both &ldquo;{query.trim()}&rdquo; and active filters
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  We found 0 creators matching the search keyword while simultaneously satisfying all {totalAppliedFilters} applied filter constraints.
                </p>

                {/* Quick Recovery Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearFiltersKeepSearch}
                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 active:scale-95"
                  >
                    Clear Filters &amp; Search &ldquo;{query.trim()}&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSearchKeepFilters}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white active:scale-95"
                  >
                    Keep Filters &amp; Clear Search Text
                  </button>
                </div>

                {/* Active Bottleneck Filters Section */}
                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Active Bottleneck Filters (Tap &times; to remove):
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {Object.entries(appliedFilters).map(([catId, options]) =>
                      options.map((opt) => (
                        <button
                          key={`empty-${catId}-${opt}`}
                          type="button"
                          onClick={() => removeIndividualFilter(catId, opt)}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-600/20 px-3 py-1 text-xs text-violet-200 hover:border-red-400 hover:bg-red-500/20 hover:text-red-200 transition"
                          title="Remove this filter"
                        >
                          <span>{opt}</span>
                          <X className="h-3 w-3 text-slate-400 group-hover:text-red-200" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : query.trim() && totalAppliedFilters === 0 ? (
              /* Scenario 2: Search Query Only (No Filters) */
              <div className="mx-auto max-w-lg">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 shadow-inner">
                  <Search className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  No creator found for &ldquo;{query.trim()}&rdquo;
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  No registered creator profile matches this keyword. Search by exact handle (e.g. <span className="text-violet-300 font-mono">@irfuu_20</span> or <span className="text-violet-300 font-mono">irfuu_20</span>), display name, or specific AI skill.
                </p>

                {/* Popular Discovery Suggestions */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span>Try searching popular creators &amp; skills:</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "@irfuu_20 (Irfan M)", term: "irfuu_20" },
                      { label: "@alex_ai (Alex Vance)", term: "alex_ai" },
                      { label: "@sarah_gen (Sarah Chen)", term: "sarah_gen" },
                      { label: "AI video generation", term: "AI video generation" },
                      { label: "Prompt Engineering", term: "Prompt Engineering" },
                      { label: "Runway Gen-3", term: "Runway Gen-3" },
                      { label: "Tamil", term: "Tamil" },
                    ].map((item) => (
                      <button
                        key={item.term}
                        type="button"
                        onClick={() => handleQuickSearch(item.term)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500/50 hover:bg-violet-600/20 hover:text-white transition active:scale-95"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleBrowseAllCreators}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/15 transition active:scale-95"
                  >
                    <span>Browse All Creators</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            ) : (
              /* Scenario 3: Filters Only (No Search Query) */
              <div className="mx-auto max-w-lg">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/10 border border-violet-500/25 text-violet-400 shadow-inner">
                  <SlidersHorizontal className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  No creators match the selected filters
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Your combination of {totalAppliedFilters} filter(s) is too restrictive. Try removing one or more active filters below to view creators matching broader criteria.
                </p>

                {/* Removable Active Filter Pills */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {Object.entries(appliedFilters).map(([catId, options]) =>
                    options.map((opt) => (
                      <button
                        key={`empty-filters-${catId}-${opt}`}
                        type="button"
                        onClick={() => removeIndividualFilter(catId, opt)}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-600/20 px-3 py-1 text-xs text-violet-200 hover:border-red-400 hover:bg-red-500/20 hover:text-red-200 transition"
                        title="Remove this filter"
                      >
                        <span>{opt}</span>
                        <X className="h-3 w-3 text-slate-400 group-hover:text-red-200" />
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 active:scale-95"
                  >
                    Reset All Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleBrowseAllCreators}
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition active:scale-95"
                  >
                    Browse All Creators
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* FILTER POP-UP MODAL (MATCHING HANDWRITTEN SKETCH EXACTLY)      */}
      {/* Left Column: Categories | Right Pane: Search & Checkboxes      */}
      {/* ============================================================== */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative flex h-[580px] w-full max-w-3xl flex-col rounded-3xl border border-white/15 bg-[#0a0f1d] shadow-2xl text-white overflow-hidden ring-1 ring-white/10">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-violet-400" />
                  <span>Search Filters</span>
                </h3>
                <p className="text-xs text-slate-400">Refine creators by category and specifications</p>
              </div>
              <button
                type="button"
                onClick={closeFilterModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Left Sidebar + Right Sub-options */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Left Column: Categories List (from Sketch) */}
              <div className="w-1/3 border-r border-white/10 overflow-y-auto bg-black/30 p-2 space-y-1">
                {FILTER_CATEGORIES.map((cat) => {
                  const isSelected = activeCategoryTab === cat.id;
                  const selectedCount = stagedFilters[cat.id]?.length || 0;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategoryTab(cat.id);
                        setCategorySearchQuery("");
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-xs font-semibold transition ${
                        isSelected
                          ? "bg-violet-600/25 border border-violet-500/40 text-white shadow-sm"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {selectedCount > 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                          {selectedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Pane: Search within Category & Checkboxes */}
              <div className="flex flex-1 flex-col overflow-hidden p-6 bg-white/[0.01]">
                
                {/* Search Skill / Sub-option input (Matching Sketch: `search skill 🔍`) */}
                <div className="relative mb-4">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder={`Search within ${activeCategory.name.toLowerCase()}...`}
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500"
                  />
                </div>

                {/* Sub-options Checkboxes List (Matching Sketch) */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {displayedSubOptions.length > 0 ? (
                    displayedSubOptions.map((option) => {
                      const isChecked = stagedFilters[activeCategoryTab]?.includes(option) || false;

                      return (
                        <label
                          key={option}
                          onClick={() => toggleSubOption(activeCategoryTab, option)}
                          className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                            isChecked
                              ? "border-violet-500/40 bg-violet-600/15 text-white"
                              : "border-white/5 bg-white/[0.02] text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="text-xs font-medium">{option}</span>
                          
                          {/* Styled Checkbox matching sketch */}
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                              isChecked
                                ? "border-violet-500 bg-violet-600 text-white"
                                : "border-white/20 bg-white/5"
                            }`}
                          >
                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No options matching &ldquo;{categorySearchQuery}&rdquo;
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Footer: Reset + Apply Button (Matching Sketch `[ APPLY ]`) */}
            <div className="flex items-center justify-between border-t border-white/10 bg-black/40 px-6 py-4">
              <button
                type="button"
                onClick={() => setStagedFilters({})}
                className="text-xs font-medium text-slate-400 hover:text-white underline"
              >
                Clear All
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {Object.values(stagedFilters).flat().length} selected
                </span>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-95 active:scale-[0.98]"
                >
                  APPLY
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatorSearchPage() {
  return (
    <main className="min-h-screen bg-[#070b14] pl-16 sm:pl-20 pr-4 sm:pr-6 pb-28 pt-8 text-white">
      <BrandLeftNav />
      <Suspense fallback={<div className="text-center text-violet-400 mt-20">Loading search...</div>}>
        <CreatorSearchContent />
      </Suspense>
    </main>
  );
}