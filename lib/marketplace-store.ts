// Store and helper library for AI Creator Marketplace
// Manages Creator Showcase Posts, Brand Reel Ratings, and Brand Verified Project Awards

export type PostCategory = "video" | "image" | "ai" | "motion";

export type PostRating = {
  brandId: string;
  brandUsername: string;
  brandName?: string;
  rating: number; // 1 to 5 stars
  ratedAt: string;
};

export type MarketplacePost = {
  id: string;
  creatorId: string;
  creatorUsername: string;
  creatorName: string;
  creatorAvatar?: string;
  category: PostCategory;
  mediaUrl: string;
  mediaType: "video" | "image";
  thumbnailUrl?: string;
  title: string;
  toolsUsed: string[];
  skillsApplied: string[];
  description: string;
  createdAt: string;
  ratingsCount: number;
  averageRating: number;
  ratings: PostRating[];
  views?: number;
  likes?: number;
  comments?: number;
  collabRequests?: number;
};

export type CompletedProject = {
  id: string;
  creatorId: string;
  creatorUsername: string;
  brandId: string;
  brandName: string;
  brandUsername: string;
  title: string;
  deliverable: string;
  description: string;
  budget?: string;
  rating: number; // 1 to 5 stars (Priority 1)
  reviewText: string;
  completedAt: string;
  views?: number;
  likes?: number;
  comments?: number;
  collabRequests?: number;
};

export type HireProposal = {
  id: string;
  creatorUsername: string;
  brandId: string;
  brandName: string;
  brandUsername: string;
  projectTitle: string;
  scope: string;
  budget: string;
  timeline?: string;
  message: string;
  similarToTitle?: string;
  // Brief Definition (clear & complete specification)
  contentType?: string;
  style?: string;
  formatAspectRatio?: string;
  commercialUseRequirements?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

const STORAGE_KEY_POSTS = "ai_marketplace_posts_v2";
const STORAGE_KEY_PROJECTS = "ai_marketplace_projects_v2";

// High-quality public domain / Google Cloud sample videos for rich reel viewing
export const DEFAULT_POSTS: MarketplacePost[] = [
  {
    id: "reel-1",
    creatorId: "creator-alex",
    creatorUsername: "alex_ai",
    creatorName: "Alex Vance",
    creatorAvatar: "A",
    category: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "video",
    title: "Cinematic Neo-Tokyo Cyber Chase",
    toolsUsed: ["Runway Gen-3", "Midjourney v6", "ComfyUI", "Topaz Video AI"],
    skillsApplied: ["AI Video Generation", "Consistent Character LoRA", "Motion Dynamics", "Color Grading"],
    description: "Generated base cinematic frames in Midjourney v6 using a custom cyber-noir LoRA. Animate motion with Runway Gen-3 camera controls and motion brush. Upscaled to 4K 60fps in Topaz with custom audio pass.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    ratingsCount: 14,
    averageRating: 4.8,
    ratings: [
      { brandId: "brand-1", brandUsername: "acme_studios", rating: 5, ratedAt: new Date().toISOString() },
      { brandId: "brand-2", brandUsername: "neon_media", rating: 5, ratedAt: new Date().toISOString() },
      { brandId: "brand-3", brandUsername: "future_brand", rating: 4, ratedAt: new Date().toISOString() },
    ],
    views: 124500,
    likes: 8940,
    comments: 640,
    collabRequests: 12,
  },
  {
    id: "reel-irfuu-1",
    creatorId: "ce4c4f17-a556-4bd4-9889-ce57633d25aa",
    creatorUsername: "irfuu_20",
    creatorName: "Irfan M",
    creatorAvatar: "I",
    category: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "video",
    title: "AI Cybersecurity & Threat Intelligence Explainer",
    toolsUsed: ["Runway Gen-3", "Midjourney v6", "ChatGPT", "Canva AI"],
    skillsApplied: ["AI Content Writing", "AI Video Generation", "Prompt Engineering"],
    description: "Multi-modal generative visual narrative explaining Zero-Trust cloud network architecture using cinematic stylized neural network nodes.",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    ratingsCount: 8,
    averageRating: 4.8,
    ratings: [
      { brandId: "brand-1", brandUsername: "acme_studios", rating: 5, ratedAt: new Date().toISOString() },
      { brandId: "brand-2", brandUsername: "neon_media", rating: 5, ratedAt: new Date().toISOString() },
    ],
    views: 45200,
    likes: 3840,
    comments: 215,
    collabRequests: 5,
  },
  {
    id: "reel-2",
    creatorId: "creator-sarah",
    creatorUsername: "sarah_gen",
    creatorName: "Sarah Chen",
    creatorAvatar: "S",
    category: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    mediaType: "video",
    title: "Organic Biomorphic Architecture Exploration",
    toolsUsed: ["Kling AI", "Midjourney v6", "After Effects", "ElevenLabs"],
    skillsApplied: ["Prompt Engineering", "Camera Trajectory Design", "Sound FX Design"],
    description: "Multi-prompt temporal interpolation exploring futuristic eco-habitats. Stitched seamless camera dollies through 3 biomes, synchronized to ambient organic sound design synthesized with ElevenLabs.",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    ratingsCount: 9,
    averageRating: 4.7,
    ratings: [
      { brandId: "brand-1", brandUsername: "acme_studios", rating: 5, ratedAt: new Date().toISOString() },
      { brandId: "brand-4", brandUsername: "apex_creative", rating: 4, ratedAt: new Date().toISOString() },
    ],
    views: 89000,
    likes: 6420,
    comments: 310,
    collabRequests: 7,
  },
  {
    id: "reel-3",
    creatorId: "creator-mike",
    creatorUsername: "mike_fx",
    creatorName: "Mike Reynolds",
    creatorAvatar: "M",
    category: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    mediaType: "video",
    title: "High-Energy Kinetic Brand Commercial",
    toolsUsed: ["Luma Dream Machine", "Stable Diffusion XL", "Blender", "Premiere Pro"],
    skillsApplied: ["3D Camera Tracking", "Kinetic Typography", "Visual Pacing", "Compositing"],
    description: "Combined 3D camera tracks from Blender with latent space transitions using Luma Dream Machine. Fine-tuned frame transitions with optical flow and motion blur for commercial broadcast specs.",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    ratingsCount: 11,
    averageRating: 4.5,
    ratings: [
      { brandId: "brand-2", brandUsername: "neon_media", rating: 4, ratedAt: new Date().toISOString() },
      { brandId: "brand-3", brandUsername: "future_brand", rating: 5, ratedAt: new Date().toISOString() },
    ],
    views: 61000,
    likes: 4100,
    comments: 180,
    collabRequests: 4,
  },
  {
    id: "reel-4",
    creatorId: "creator-lena",
    creatorUsername: "lena_create",
    creatorName: "Lena Rostova",
    creatorAvatar: "L",
    category: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    mediaType: "video",
    title: "Ethereal Fashion Runway in Deep Space",
    toolsUsed: ["Runway Gen-3", "Magnific AI", "Photoshop Generative Fill"],
    skillsApplied: ["Fashion Styling", "Fabric Simulation", "Photorealistic Lighting"],
    description: "Designed haute couture holographic fabrics using SDXL and Magnific upscaling, then animated realistic cloth physics and zero-gravity runway choreography in Runway Gen-3.",
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    ratingsCount: 16,
    averageRating: 4.9,
    ratings: [
      { brandId: "brand-1", brandUsername: "acme_studios", rating: 5, ratedAt: new Date().toISOString() },
      { brandId: "brand-2", brandUsername: "neon_media", rating: 5, ratedAt: new Date().toISOString() },
      { brandId: "brand-4", brandUsername: "apex_creative", rating: 5, ratedAt: new Date().toISOString() },
    ],
    views: 195000,
    likes: 14200,
    comments: 980,
    collabRequests: 18,
  },
];

// Seed projects awarded by brands for default showcase
export const DEFAULT_PROJECTS: CompletedProject[] = [
  {
    id: "proj-1",
    creatorId: "creator-alex",
    creatorUsername: "alex_ai",
    brandId: "brand-1",
    brandName: "Acme Studios Worldwide",
    brandUsername: "acme_studios",
    title: "Global AI Commercial Campaign: 'Tomorrow Electric'",
    deliverable: "4x 30s High-Res Generative Ad Creatives (4K 16:9 & 9:16)",
    description: "Full end-to-end generative AI commercial production featuring photorealistic product integrations and stylized environment generation.",
    budget: "$4,500",
    rating: 5,
    reviewText: "Outstanding creative director and AI engineer. Delivered beyond expectations ahead of schedule. The visual fidelity blew our executive team away.",
    completedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    views: 280000,
    likes: 19400,
    comments: 1120,
    collabRequests: 15,
  },
  {
    id: "proj-2",
    creatorId: "creator-sarah",
    creatorUsername: "sarah_gen",
    brandId: "brand-2",
    brandName: "Neon Media Lab",
    brandUsername: "neon_media",
    title: "Social Product Launch: Holographic Sneaker Drop",
    deliverable: "6x Dynamic 9:16 TikTok / IG Reels & Keyframe Assets",
    description: "High-retention 3D biomorphic visual campaign showcasing limited footwear design concepts.",
    budget: "$3,200",
    rating: 5,
    reviewText: "Sarah's aesthetic sensibility and mastery of Kling & Midjourney generated 2.4M organic views in our first launch week. Highly recommended!",
    completedAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    views: 310000,
    likes: 22600,
    comments: 1450,
    collabRequests: 21,
  },
];

// -------------------------------------------------------------
// POSTS STORAGE & MANAGEMENT
// -------------------------------------------------------------
export function getMarketplacePosts(): MarketplacePost[] {
  if (typeof window === "undefined") return DEFAULT_POSTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POSTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(DEFAULT_POSTS));
      return DEFAULT_POSTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_POSTS;
  } catch {
    return DEFAULT_POSTS;
  }
}

export function saveMarketplacePost(post: MarketplacePost): MarketplacePost[] {
  if (typeof window === "undefined") return [post, ...DEFAULT_POSTS];
  try {
    const existing = getMarketplacePosts();
    // Check if duplicate ID exists, replace or prepend
    const index = existing.findIndex((p) => p.id === post.id);
    let updated: MarketplacePost[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = post;
    } else {
      updated = [post, ...existing];
    }
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Error saving post to store:", err);
    return getMarketplacePosts();
  }
}

export function rateMarketplacePost(
  postId: string,
  brandId: string,
  brandUsername: string,
  brandName: string,
  rating: number
): { updatedPost: MarketplacePost | null; allPosts: MarketplacePost[] } {
  const posts = getMarketplacePosts();
  const index = posts.findIndex((p) => p.id === postId);
  if (index === -1) return { updatedPost: null, allPosts: posts };

  const post = posts[index];
  const existingRatingIndex = post.ratings.findIndex((r) => r.brandId === brandId);

  let newRatings: PostRating[];
  if (existingRatingIndex >= 0) {
    newRatings = [...post.ratings];
    newRatings[existingRatingIndex] = {
      brandId,
      brandUsername,
      brandName,
      rating,
      ratedAt: new Date().toISOString(),
    };
  } else {
    newRatings = [
      ...post.ratings,
      {
        brandId,
        brandUsername,
        brandName,
        rating,
        ratedAt: new Date().toISOString(),
      },
    ];
  }

  const sum = newRatings.reduce((acc, r) => acc + r.rating, 0);
  const avg = Number((sum / newRatings.length).toFixed(1));

  const updatedPost: MarketplacePost = {
    ...post,
    ratings: newRatings,
    ratingsCount: newRatings.length,
    averageRating: avg,
  };

  const updatedAll = [...posts];
  updatedAll[index] = updatedPost;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(updatedAll));
  }

  return { updatedPost, allPosts: updatedAll };
}

// -------------------------------------------------------------
// PROJECTS & COLLABORATION STORAGE & MANAGEMENT
// -------------------------------------------------------------
export function getCompletedProjects(): CompletedProject[] {
  if (typeof window === "undefined") return DEFAULT_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
      return DEFAULT_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PROJECTS;
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export function getCreatorProjects(username: string): CompletedProject[] {
  const clean = username.trim().toLowerCase().replace(/^@/, "");
  if (!clean) return [];
  const projects = getCompletedProjects();
  return projects.filter(
    (p) => p.creatorUsername.toLowerCase().replace(/^@/, "") === clean
  );
}

export function awardCreatorProject(
  projectData: Omit<CompletedProject, "id" | "completedAt">
): CompletedProject {
  const newProject: CompletedProject = {
    ...projectData,
    id: `proj-${Date.now()}`,
    completedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const existing = getCompletedProjects();
    const updated = [newProject, ...existing];
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
  }

  return newProject;
}

// -------------------------------------------------------------
// RATINGS SUMMARY CALCULATION (Priority 1: Project, Priority 2: Post)
// -------------------------------------------------------------
export type CreatorRatingSummary = {
  // Priority 1: Verified Brand Collaboration Projects
  projectRating: number; // 0.0 to 5.0
  completedProjectsCount: number;
  hasProjectRating: boolean;

  // Priority 2: Brand Community Reel Feed Ratings
  postRating: number; // 0.0 to 5.0
  postRatingsCount: number;
  totalPostsCount: number;
  hasPostRating: boolean;

  // Combined Average Rating
  overallRating: number; // 0.0 to 5.0
  totalEvaluations: number;
};

export function getCreatorRatingsSummary(username: string): CreatorRatingSummary {
  const clean = username.trim().toLowerCase().replace(/^@/, "");
  if (!clean) {
    return {
      projectRating: 0,
      completedProjectsCount: 0,
      hasProjectRating: false,
      postRating: 0,
      postRatingsCount: 0,
      totalPostsCount: 0,
      hasPostRating: false,
      overallRating: 0,
      totalEvaluations: 0,
    };
  }

  // 1. Projects (Priority 1)
  const creatorProjects = getCreatorProjects(clean);
  const completedProjectsCount = creatorProjects.length;
  let projectRating = 0;
  if (completedProjectsCount > 0) {
    const sum = creatorProjects.reduce((acc, p) => acc + p.rating, 0);
    projectRating = Number((sum / completedProjectsCount).toFixed(1));
  }

  // 2. Posts (Priority 2)
  const allPosts = getMarketplacePosts();
  const creatorPosts = allPosts.filter(
    (p) => p.creatorUsername.toLowerCase().replace(/^@/, "") === clean
  );
  const totalPostsCount = creatorPosts.length;

  let totalPostStars = 0;
  let postRatingsCount = 0;
  creatorPosts.forEach((p) => {
    p.ratings.forEach((r) => {
      totalPostStars += r.rating;
      postRatingsCount += 1;
    });
  });

  let postRating = 0;
  if (postRatingsCount > 0) {
    postRating = Number((totalPostStars / postRatingsCount).toFixed(1));
  }

  // 3. Combined Average Rating
  let overallRating = 0;
  const hasProjectRating = completedProjectsCount > 0;
  const hasPostRating = postRatingsCount > 0;

  if (hasProjectRating && hasPostRating) {
    // Project rating holds 70% priority, post rating holds 30% priority
    overallRating = Number((projectRating * 0.7 + postRating * 0.3).toFixed(1));
  } else if (hasProjectRating) {
    overallRating = projectRating;
  } else if (hasPostRating) {
    overallRating = postRating;
  }

  return {
    projectRating,
    completedProjectsCount,
    hasProjectRating,
    postRating,
    postRatingsCount,
    totalPostsCount,
    hasPostRating,
    overallRating,
    totalEvaluations: completedProjectsCount + postRatingsCount,
  };
}

// -------------------------------------------------------------
// HIRE PROPOSALS & COLLABORATION OFFERS
// -------------------------------------------------------------
const STORAGE_KEY_PROPOSALS = "ai_marketplace_hire_proposals_v1";

export function getHireProposals(): HireProposal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROPOSALS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function sendHireProposal(
  proposalData: Omit<HireProposal, "id" | "status" | "createdAt">
): HireProposal {
  const newProposal: HireProposal = {
    ...proposalData,
    id: `hire-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const existing = getHireProposals();
    const updated = [newProposal, ...existing];
    localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(updated));

    // Automatically notify creator of the new campaign proposal
    sendNotification({
      recipientRole: "creator",
      recipientUsername: proposalData.creatorUsername,
      senderUsername: proposalData.brandUsername,
      senderName: proposalData.brandName,
      type: "hire_offer",
      proposalId: newProposal.id,
      projectTitle: proposalData.projectTitle,
      budget: proposalData.budget,
      scope: proposalData.scope,
      message: proposalData.message,
      contentType: proposalData.contentType,
      style: proposalData.style,
      formatAspectRatio: proposalData.formatAspectRatio,
      commercialUseRequirements: proposalData.commercialUseRequirements,
      status: "pending",
    });
  }

  return newProposal;
}

export function getCreatorCollabs(username: string): CompletedProject[] {
  return getCreatorProjects(username);
}

// -------------------------------------------------------------
// NOTIFICATIONS SYSTEM (HIRE OFFERS, SINGLE-LINE VIEW & RESPONSES)
// -------------------------------------------------------------
export type MarketplaceNotification = {
  id: string;
  recipientRole: "creator" | "brand";
  recipientUsername: string;
  senderUsername: string;
  senderName: string;
  senderAvatar?: string;
  type: "hire_offer" | "hire_accepted" | "hire_declined";
  proposalId?: string;
  projectTitle: string;
  budget?: string;
  scope?: string;
  message?: string;
  // Brief Definition (content type, style, aspect ratio, commercial-use)
  contentType?: string;
  style?: string;
  formatAspectRatio?: string;
  commercialUseRequirements?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY_NOTIFICATIONS = "ai_marketplace_notifications_v3";

export const DEFAULT_NOTIFICATIONS: MarketplaceNotification[] = [
  {
    id: "notif-seed-1",
    recipientRole: "creator",
    recipientUsername: "irfuu_20",
    senderUsername: "acme_studios",
    senderName: "Acme Studios Worldwide",
    senderAvatar: "A",
    type: "hire_offer",
    projectTitle: "Global AI Commercial Campaign: 'Tomorrow Electric'",
    budget: "$3,500",
    scope: "4x 30s High-Res Generative Ad Creatives (4K 16:9 & 9:16)",
    message: "We loved your cyber-intelligence motion explainers and want to partner on our upcoming global product launch.",
    contentType: "AI Video Commercial",
    style: "Cinematic Sci-Fi / Cyber Threat Explainer",
    formatAspectRatio: "16:9 Landscape & 9:16 Vertical",
    commercialUseRequirements: "Full Commercial Buyout & Paid Ad Whitelisting",
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
  },
  {
    id: "notif-seed-2",
    recipientRole: "creator",
    recipientUsername: "alex_ai",
    senderUsername: "acme_studios",
    senderName: "Acme Studios Worldwide",
    senderAvatar: "A",
    type: "hire_offer",
    projectTitle: "Sci-Fi Autonomous Vehicle Film Sequence",
    budget: "$4,500",
    scope: "Full generative video pipeline with LoRA character continuity",
    message: "We have an open campaign brief ready for your specialized Runway & ComfyUI workflow.",
    contentType: "AI Video Commercial",
    style: "Cinematic Cyberpunk / LoRA Character Consistency",
    formatAspectRatio: "16:9 Landscape (4K)",
    commercialUseRequirements: "Full Commercial Buyout & Workflow Handoff",
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    read: false,
  },
];

export function getNotifications(
  role: "creator" | "brand",
  username?: string
): MarketplaceNotification[] {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATIONS.filter((n) => n.recipientRole === role);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    let list: MarketplaceNotification[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
      list = DEFAULT_NOTIFICATIONS;
    } else {
      list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) {
        list = DEFAULT_NOTIFICATIONS;
      }
    }

    const clean = username ? username.trim().toLowerCase().replace(/^@/, "") : "";
    return list.filter((n) => {
      if (n.recipientRole !== role) return false;
      if (!clean) return true;

      const targetUser = (n.recipientUsername || "").toLowerCase().replace(/^@/, "");

      if (role === "brand") {
        // Brand accounts see notifications targeted to their username,
        // or targeted to the demo accounts ("acme_studios", "active-brand"),
        // or any reciprocal creator responses (hire_accepted / hire_declined).
        if (
          targetUser === clean ||
          targetUser === "acme_studios" ||
          targetUser === "active-brand" ||
          targetUser === "all" ||
          targetUser === "" ||
          n.type === "hire_accepted" ||
          n.type === "hire_declined"
        ) {
          return true;
        }
        return false;
      }

      // Creator accounts
      if (
        targetUser === clean ||
        targetUser === "all" ||
        targetUser === "" ||
        (clean === "alex_ai" && (targetUser === "alex_ai" || targetUser === "irfuu_20")) ||
        (clean === "irfuu_20" && (targetUser === "irfuu_20" || targetUser === "alex_ai"))
      ) {
        return true;
      }

      return false;
    });
  } catch {
    return DEFAULT_NOTIFICATIONS.filter((n) => n.recipientRole === role);
  }
}

export function sendNotification(
  notificationData: Omit<MarketplaceNotification, "id" | "createdAt" | "read">
): MarketplaceNotification {
  const newNotif: MarketplaceNotification = {
    ...notificationData,
    id: `notif-${Date.now()}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      const list = raw ? JSON.parse(raw) : [...DEFAULT_NOTIFICATIONS];
      const updated = [newNotif, ...list];
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event("marketplace_notifications_updated"));
    } catch (e) {
      console.error("Error storing notification:", e);
    }
  }

  return newNotif;
}

export function respondToHireNotification(
  notificationId: string,
  response: "accepted" | "declined"
): { updatedNotification: MarketplaceNotification | null; brandNotification: MarketplaceNotification | null } {
  if (typeof window === "undefined") return { updatedNotification: null, brandNotification: null };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    const list: MarketplaceNotification[] = raw ? JSON.parse(raw) : [...DEFAULT_NOTIFICATIONS];
    const index = list.findIndex((n) => n.id === notificationId);

    if (index === -1) return { updatedNotification: null, brandNotification: null };

    const target = list[index];
    target.status = response;
    target.read = true;

    const cleanCreator = target.recipientUsername.replace(/^@/, "");

    // Create a reciprocal notification for the brand
    const brandNotif: MarketplaceNotification = {
      id: `notif-resp-${Date.now()}`,
      recipientRole: "brand",
      recipientUsername: target.senderUsername || "acme_studios",
      senderUsername: target.recipientUsername,
      senderName: target.recipientUsername.startsWith("@") ? target.recipientUsername : `@${target.recipientUsername}`,
      type: response === "accepted" ? "hire_accepted" : "hire_declined",
      projectTitle: target.projectTitle,
      budget: target.budget,
      status: response,
      createdAt: new Date().toISOString(),
      read: false,
      message:
        response === "accepted"
          ? `Creator @${cleanCreator} accepted your offer of ${target.budget} for "${target.projectTitle}".`
          : `Creator @${cleanCreator} declined your offer of ${target.budget} for "${target.projectTitle}".`,
    };

    list[index] = target;
    const updated = [brandNotif, ...list];
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));

    // Update corresponding proposal status if proposalId exists
    if (target.proposalId) {
      try {
        const propRaw = localStorage.getItem(STORAGE_KEY_PROPOSALS);
        if (propRaw) {
          const propList: HireProposal[] = JSON.parse(propRaw);
          const pIndex = propList.findIndex((p) => p.id === target.proposalId);
          if (pIndex !== -1) {
            propList[pIndex].status = response;
            localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(propList));
          }
        }
      } catch (err) {
        console.warn("Could not sync proposal status:", err);
      }
    }

    // Trigger instant UI event across all tabs/components
    window.dispatchEvent(new Event("marketplace_notifications_updated"));

    return { updatedNotification: target, brandNotification: brandNotif };
  } catch (err) {
    console.error("Error responding to notification:", err);
    return { updatedNotification: null, brandNotification: null };
  }
}

export function markNotificationAsRead(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    const list: MarketplaceNotification[] = raw ? JSON.parse(raw) : [...DEFAULT_NOTIFICATIONS];
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event("marketplace_notifications_updated"));
  } catch (err) {
    console.error("Error marking notification read:", err);
  }
}

// -------------------------------------------------------------
// BRAND DATA STORE FOR CREATOR VIEWING BRAND PAGE (FROM SKETCH)
// -------------------------------------------------------------
export type BrandCampaignItem = {
  id: string;
  title: string;
  deliverable: string;
  budget: string;
  deadline: string;
  description: string;
  reach?: string;
  engagement?: string;
  roi?: string;
  status: "Open" | "Reviewing" | "Completed";
  // Brief Definition (content type, style, aspect ratio, commercial-use requirements)
  contentType?: string;
  style?: string;
  formatAspectRatio?: string;
  commercialUseRequirements?: string;
};

export type BrandPostItem = {
  id: string;
  title: string;
  mediaUrl: string;
  category: string;
  description: string;
  reach: string;
  engagement: string;
  roi: string;
  postedAt: string;
};

export type BrandProfileDetails = {
  id: string;
  username: string;
  companyName: string;
  logoUrl?: string;
  verified: boolean;
  industry: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  location: string;
  campaignsCount: number;
  openProjectsCount: number;
  creatorsHiredCount: number;
  briefs: BrandCampaignItem[];
  posts: BrandPostItem[];
  collabs: CompletedProject[];
  pastCreators: {
    name: string;
    username: string;
    avatar: string;
    quote: string;
  }[];
};

export const DEFAULT_BRANDS: Record<string, BrandProfileDetails> = {
  "acme_studios": {
    id: "brand-1",
    username: "acme_studios",
    companyName: "Acme Studios Worldwide",
    verified: true,
    industry: "Generative Entertainment & Commercial Media",
    tagline: "Leading AI-assisted commercial production studio & brand agency",
    description: "Acme Studios Worldwide collaborates with the globe's top GenAI artists, motion designers, and cinematic prompt engineers to produce broadcast commercials, product launch campaigns, and virtual worlds.",
    websiteUrl: "https://acmestudios.global",
    location: "New York & London",
    campaignsCount: 12,
    openProjectsCount: 3,
    creatorsHiredCount: 14,
    briefs: [
      {
        id: "brief-1",
        title: "Q4 Futuristic Autonomous Vehicle Commercial",
        deliverable: "4x 30s 4K video reels with custom LoRA vehicle consistency",
        budget: "$4,500",
        deadline: "Nov 15, 2026",
        description: "Need high-fidelity cyberpunk cityscapes and consistent character interactions featuring our concept electric vehicle.",
        reach: "3.2M Estimated",
        engagement: "8.4%",
        roi: "3.8x Target",
        status: "Open",
        contentType: "AI Video Commercial",
        style: "Cinematic Sci-Fi / Cyberpunk Noir",
        formatAspectRatio: "16:9 Landscape & 9:16 Vertical",
        commercialUseRequirements: "Full Commercial Buyout & Paid Digital Ad Whitelisting",
      },
      {
        id: "brief-2",
        title: "Holographic AI Apparel & Digital Runway Lookbook",
        deliverable: "6x 9:16 vertical motion assets & 10 keyframes",
        budget: "$3,200",
        deadline: "Nov 25, 2026",
        description: "Haute couture synthetic fabrics that morph with biomorphic illumination across high-fashion models.",
        reach: "1.8M Estimated",
        engagement: "9.1%",
        roi: "4.2x Target",
        status: "Open",
        contentType: "Social Media Reel & Motion Asset",
        style: "Editorial Haute Couture / Digital Fashion",
        formatAspectRatio: "9:16 Vertical (Reel / TikTok / Shorts)",
        commercialUseRequirements: "Global Digital Ad & Social Whitelisting (12 Months)",
      },
      {
        id: "brief-3",
        title: "Neural Audio-Visual Brand Anthem",
        deliverable: "60s master commercial & cutdowns",
        budget: "$5,000",
        deadline: "Dec 05, 2026",
        description: "Full end-to-end pipeline from generative script to ElevenLabs audio pass and Runway Gen-3 camera control.",
        reach: "4.5M Estimated",
        engagement: "7.9%",
        roi: "3.5x Target",
        status: "Open",
        contentType: "Commercial Film & Brand Anthem",
        style: "Photorealistic Futuristic Commercial",
        formatAspectRatio: "16:9 Landscape (4K 60fps)",
        commercialUseRequirements: "Broadcast Television & Global Digital Ad Rights",
      },
    ],
    posts: [
      {
        id: "bpost-1",
        title: "Tomorrow Electric Global Commercial Reveal",
        mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        category: "Commercial Film",
        description: "Official launch video produced in partnership with @alex_ai. 100% generative neural video pipeline.",
        reach: "2.4M Views",
        engagement: "9.2%",
        roi: "4.5x",
        postedAt: "3 days ago",
      },
      {
        id: "bpost-2",
        title: "Biomorphic Architecture Concept Campaign",
        mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        category: "Digital Exhibition",
        description: "Eco-habitat conceptual spatial design created with @sarah_gen.",
        reach: "1.6M Views",
        engagement: "8.1%",
        roi: "3.9x",
        postedAt: "1 week ago",
      },
    ],
    collabs: [
      {
        id: "proj-1",
        creatorId: "creator-alex",
        creatorUsername: "alex_ai",
        brandId: "brand-1",
        brandName: "Acme Studios Worldwide",
        brandUsername: "acme_studios",
        title: "Global AI Commercial Campaign: 'Tomorrow Electric'",
        deliverable: "4x 30s High-Res Generative Ad Creatives (4K 16:9 & 9:16)",
        description: "Full end-to-end generative AI commercial production featuring photorealistic product integrations and stylized environment generation.",
        budget: "$4,500",
        rating: 5,
        reviewText: "Outstanding creative director and AI engineer. Delivered beyond expectations ahead of schedule. The visual fidelity blew our executive team away.",
        completedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
        views: 280000,
        likes: 19400,
        comments: 1120,
        collabRequests: 15,
      },
    ],
    pastCreators: [
      {
        name: "Alex Vance",
        username: "alex_ai",
        avatar: "A",
        quote: "Acme Studios provided the clearest creative brief and fastest milestone approvals I've experienced on a brand engagement.",
      },
      {
        name: "Sarah Chen",
        username: "sarah_gen",
        avatar: "S",
        quote: "Phenomenal creative synergy. They understand the nuances of generative AI diffusion workflows and trust creators.",
      },
    ],
  },
};

export function getBrandProfile(identifier: string): BrandProfileDetails {
  const clean = identifier.trim().toLowerCase().replace(/^@/, "");
  
  const base: BrandProfileDetails = DEFAULT_BRANDS[clean]
    ? { ...DEFAULT_BRANDS[clean] }
    : {
        id: `brand-${clean}`,
        username: clean,
        companyName: clean
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        verified: true,
        industry: "AI Advertising & Media",
        tagline: "Commercial production and generative AI campaign creator partner",
        description: `Leading advertising agency connecting with creators for commercial video campaigns, digital asset production, and multi-modal marketing.`,
        websiteUrl: `https://${clean}.com`,
        location: "Global Remote",
        campaignsCount: 3,
        openProjectsCount: 1,
        creatorsHiredCount: 4,
        briefs: [
          {
            id: "brief-default-1",
            title: "Commercial AI Video Series",
            deliverable: "3x 30s Generative Reels (9:16)",
            budget: "$3,000",
            deadline: "Dec 01, 2026",
            description: "High-retention commercial reels showcasing digital transformation concepts.",
            reach: "1.2M",
            engagement: "7.5%",
            roi: "3.2x",
            status: "Open",
            contentType: "AI Video Commercial",
            style: "Photorealistic Luxury Commercial",
            formatAspectRatio: "9:16 Vertical (Reel / TikTok / Shorts)",
            commercialUseRequirements: "Full Commercial Buyout & Paid Ad Whitelisting",
          },
        ],
        posts: [],
        collabs: [],
        pastCreators: [],
      };

  if (typeof window !== "undefined") {
    try {
      const savedAvatar = localStorage.getItem(`brand_avatar_${clean}`);
      if (savedAvatar) {
        base.logoUrl = savedAvatar;
      }

      const savedBriefsRaw = localStorage.getItem(`brand_briefs_${clean}`);
      if (savedBriefsRaw) {
        const parsedBriefs = JSON.parse(savedBriefsRaw);
        if (Array.isArray(parsedBriefs) && parsedBriefs.length > 0) {
          base.briefs = parsedBriefs.map((b: {
            id?: string;
            title?: string;
            deliverable?: string;
            budget?: string;
            deadline?: string;
            description?: string;
            contentType?: string;
            style?: string;
            formatAspectRatio?: string;
            commercialUseRequirements?: string;
          }) => ({
            id: b.id || `b-${Date.now()}`,
            title: b.title || "Custom Campaign Brief",
            deliverable: b.deliverable || "Creative Deliverable",
            budget: b.budget || "$1,000",
            deadline: b.deadline || "Within 14 days",
            description: b.description || "Active brief looking for specialized AI creator partners.",
            reach: "500K+",
            engagement: "6.2%",
            roi: "2.8x",
            status: "Open" as const,
            contentType: b.contentType || "AI Video Commercial",
            style: b.style || "Cinematic Sci-Fi / Cyberpunk",
            formatAspectRatio: b.formatAspectRatio || "9:16 Vertical (Reel / TikTok / Shorts)",
            commercialUseRequirements: b.commercialUseRequirements || "Full Commercial Buyout & Paid Ad Whitelisting",
          }));
          base.openProjectsCount = base.briefs.length;
        }
      }
    } catch (e) {
      console.warn("Error hydrating brand dynamic data:", e);
    }
  }

  return base;
}


