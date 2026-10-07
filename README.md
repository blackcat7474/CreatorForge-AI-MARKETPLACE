# ⚡ CreatorForge — The AI Creator & Brand Collaboration Marketplace

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.8-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**CreatorForge** is a high-performance marketplace platform connecting forward-thinking brands with elite Generative AI video directors, prompt engineers, digital artists, and creative technologists. Built with Next.js 16 (Turbopack), Supabase, and Tailwind CSS in a dark luxury cyberpunk aesthetic.

---

## 🚀 Key Features

### 1. 🔍 High-Precision Creator Search Engine
- **Direct Handle & ID Lookup**: Instant discovery by username (`@irfuu_20`, `irfuu_20`), creator UUID (`ce4c4f17-...`), display name, or technical skill.
- **Priority Relevance Scoring**:
  - Exact handle / ID match: **+250 points** (guaranteed top rank).
  - Display name match: **+180 points**.
  - Prefix / Substring matches: **+120 / +70 points**.
  - Skills, tools, languages: **+80 / +60 / +50 points**.
  - Secondary sorting by verified star ratings and completed project counts.
- **Multi-Source Aggregation**: Seamlessly queries Supabase `profiles`, active accounts, published reels, and completed projects without data loss.

### 2. 🎛️ 10-Category Multi-Attribute Filtering (Cross-Category AND / Intra-Category OR)
Filters creators across 10 specialized categories with strict logical conjunction:
1. **Skills**: AI content writing, AI image generation, AI video generation, Prompt Engineering, Social Media content creation
2. **Specialization**: Marketing, Product promotion, Education, Fashion technology, Gaming, YouTube / Instagram
3. **AI Tools Used**: ChatGPT, Canva AI, Gemini, Runway Gen-3, Midjourney, ComfyUI
4. **Content Type**: Instagram reel, YouTube video, Blog post, Social media post
5. **Experience Level**: Beginner, Intermediate, Advance, Pro
6. **Portfolio Quality**: Previous project, Content quality, Client review, No. of completed projects
7. **Language**: Tamil, English, Hindi, Malayalam
8. **Client / Creator Rating**: Overall rating, Client feedback, On-time delivery, Communication score
9. **Availability**: Available now, Part-time, Full-time, Expected delivery time
10. **Budget**: Under $500, $500 - $1,500, $1,500 - $3,000, $3,000+, Custom / Milestone

*Rule: Selecting options across multiple categories enforces **AND** logic (e.g. Prompt Engineering **AND** Tamil), while selecting multiple options within the same category enforces **OR** logic.*

### 3. 💡 Sensible Empty Results Diagnostics & Recovery States
- **Clean Blank Canvas**: Initial search space remains completely blank prior to querying or filtering.
- **3-Scenario Contextual Recovery**:
  - **Query + Filters Mismatch**: Explains zero creators matched the keyword while satisfying all filters; provides one-click buttons to *"Clear Filters & Keep Query"* or *"Keep Filters & Clear Query"*, plus removable filter pill tags.
  - **Query Only (0 Results)**: Explains no profile was found; offers instant clickable suggestion chips (`@irfuu_20`, `@alex_ai`, `@sarah_gen`, `AI video generation`, `Prompt Engineering`, `Tamil`) and a *"Browse All Creators"* button.
  - **Filters Only (0 Results)**: Informs that the filter combination is too narrow; displays active filter tags with `×` remove buttons, *"Reset All Filters"*, and *"Browse All Creators"*.

### 4. 📋 Complete Brief Definition Specification
When hiring or proposing a collaboration, the platform enforces comprehensive creative briefs:
- **Content Type**: (e.g., Short-form Video Ad, Product Demo, Cinematic Worldbuilding)
- **Visual Style**: (e.g., Cyberpunk Photorealism, Biomorphic Surrealism, Minimalist Luxury)
- **Format / Aspect Ratio**: Strict specifications (`16:9 Horizontal`, `9:16 Vertical Reel/TikTok`, `1:1 Square`, `4:5 Portrait`)
- **Commercial-Use Requirements**: Licensing terms, distribution rights, paid ads usage, and raw asset delivery

### 5. 🤝 Two-Way Real-Time Collaboration Lifecycle
- **Hire Creator Workflow**: Brands can trigger the Hire modal directly from creator profile headers or specific portfolio cards (pre-filling *"Hire for similar project"*).
- **Creator Notification Feed**: Creators receive real-time notifications with brand profile summaries, campaign deliverables, and budget snapshots.
- **Interactive Decision**: Creators can **Accept** or **Decline** directly inside the notification dropdown.
- **Brand Feedback Alerts**: Brands immediately receive a follow-up notification when an offer is accepted or declined.

### 6. 📊 Dual-Priority Ratings Engine
- **Priority 1 (Brand Collaborations)**: Verified star rating (1.0–5.0★) awarded by brands upon completed client deliverables.
- **Priority 2 (Community Reel Feed)**: Public community ratings from brands watching creator video feeds.
- **Combined Overall Rating**: Mathematically balanced composite score prominently displayed on all search cards and profile headers.

### 7. 📂 Instagram-Style 3-Column Portfolio Grids
- **Brand Profile & Creator Profile**:
  - Column 1: **Projects / Campaigns**
  - Column 2: **Posts / Reels** (with built-in video players)
  - Column 3: **Collabs** (past brand/creator partnerships)
- **Rich Metric Modals**: Tapping any card opens detailed metrics (Reach, Likes, Comments, Engagement, and ROI snapshots).

### 8. 🎨 Dark Luxury Cyberpunk UX
- Built on a deep obsidian palette (`#070b14`), bordered by subtle glowing lines (`border-white/10`), neon violet/fuchsia accents, and floating left-side navigation icons.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.3.8](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Authentication & Backend**: [Supabase](https://supabase.com/) (`@supabase/ssr`, PostgreSQL, Auth)
- **Deployment**: [Vercel](https://vercel.com/) (Edge CDN, SSL, Automatic Git Deploys)

---

## 📁 Project Structure

```text
ai-creator-marketplace/
├── app/
│   ├── auth/
│   │   ├── confirm/route.ts       # Supabase Auth email confirmation handler
│   │   ├── login/page.tsx         # Role-aware login (Brand vs Creator)
│   │   └── sign-up/page.tsx       # Onboarding form with auto-login & metadata
│   ├── brand/
│   │   ├── creators/
│   │   │   ├── page.tsx           # Advanced Search & 10-Category Filter Engine
│   │   │   └── [id]/page.tsx      # Brand view of Creator profile & Hire modal
│   │   ├── profile/page.tsx       # Brand Profile workspace & campaigns manager
│   │   └── reels/page.tsx         # Brand video feed with community star rating
│   ├── creator/
│   │   ├── brand/[id]/page.tsx    # Creator view of Brand profile
│   │   └── profile/page.tsx       # Creator Profile workspace, portfolio & filter tags
│   ├── layout.tsx                 # Root layout with fonts & providers
│   └── page.tsx                   # Landing page with role selector
├── components/
│   ├── brand-navigation.tsx       # Floating Left Nav & Header Nav
│   ├── notification-bell.tsx      # Real-time notifications with Accept/Decline
│   └── login-form.tsx             # Shared login component
├── lib/
│   ├── marketplace-store.ts       # Unified data store, ratings engine & proposal store
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── proxy.ts               # Middleware session updater
│   │   └── server.ts              # Server-side Supabase client
│   └── utils.ts                   # Tailwind merge helper
├── .env.example                   # Environment variable template
└── tailwind.config.ts             # Custom cyberpunk theme definitions
```

---

## 🏁 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.18+ or 20+)
- [Git](https://git-scm.com/)
- A free [Supabase](https://supabase.com/) project

### 1. Clone the repository
```bash
git clone https://github.com/blackcat7474/CreatorForge-AI-MARKETPLACE.git
cd CreatorForge-AI-MARKETPLACE
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```
*(Supports both `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)*

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deploying to Vercel

CreatorForge is pre-configured for zero-config deployment on Vercel:

1. Push your repository to GitHub (`main` branch).
2. Go to [vercel.com/new](https://vercel.com/new) and click **Import** next to `CreatorForge-AI-MARKETPLACE`.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Click **Deploy**.
5. In your [Supabase Dashboard](https://supabase.com/dashboard) under **Authentication ➔ URL Configuration**, add your Vercel URL to **Redirect URLs**:
   - `https://your-app-name.vercel.app/**`
   - `https://your-app-name.vercel.app/auth/confirm`

---

## 🧪 Quality Assurance

Run static analysis and production build verification:
```bash
# Run ESLint
npm run lint

# Compile production Next.js build
npm run build
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **[Irfan M (@blackcat7474)](https://github.com/blackcat7474)**
