export const HOMEPAGE_SECTION_ORDER = [
  "hero",
  "profile",
  "skills",
  "projects",
  "contact",
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_ORDER)[number];

export type FeaturedProject = {
  readonly approved: true;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly installation?: string;
  readonly usage?: string;
  readonly keyFeatures: readonly string[];
  readonly technicalHighlights?: readonly string[];
  readonly technologies: readonly string[];
  readonly previewImage: string;
  readonly galleryImages: readonly {
    src: string;
    alt: string;
    width: number;
    height: number;
  }[];
  readonly liveUrl?: string;
  readonly sourceUrl?: string;
};

export const HOMEPAGE_NAV_ITEMS = [
  { id: "hero", label: "Hero", href: "#hero" },
  { id: "profile", label: "Profile", href: "#profile" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "projects", label: "Projects", href: "#projects" },
  { id: "contact", label: "Contact", href: "#contact" },
] as const;

export type SectionNavigation = {
  target: HomepageSectionId;
  label: string;
  direction: "down" | "up";
};

export function getSectionNavigation(
  activeSection: HomepageSectionId,
): SectionNavigation {
  const activeIndex = HOMEPAGE_SECTION_ORDER.indexOf(activeSection);
  const isLastSection = activeIndex === HOMEPAGE_SECTION_ORDER.length - 1;
  if (isLastSection) {
    return { target: "hero", label: "Up Hero", direction: "up" };
  }

  const target = HOMEPAGE_SECTION_ORDER[activeIndex + 1] ?? "hero";
  const targetItem = HOMEPAGE_NAV_ITEMS.find((item) => item.id === target);
  return {
    target,
    label: targetItem?.label ?? "Hero",
    direction: "down",
  };
}

export const HERO_PROOF = [
  { value: "5+", label: "Years of Experience" },
  { value: "10+", label: "Completed Projects" },
  { value: "10K+", label: "Hours Worked" },
] as const;

export const EXPERIENCE = [
  {
    period: "Mar 2026 – Present",
    location: "Canada, Remote",
    role: "AI Automation Engineer",
    organization: "Randstad Digital",
    summary:
      "Engineering AI-driven automation and production-grade applications with LLMs, APIs, cloud platforms, and measurable stakeholder outcomes.",
    technologies: "Claude Code · GPT Codex · Kimi AI",
  },
  {
    period: "Oct 2020 – Present",
    location: "Hybrid",
    role: "Full Stack Web Developer",
    organization: "Freelance · Business Client",
    summary:
      "Delivering scalable web applications, low-latency backend infrastructure, automated workflows, and secure RBAC architecture supporting 10K+ users.",
    technologies: "HTML · CSS · JavaScript · TypeScript · Node.js · Ubuntu LTS",
  },
  {
    period: "Jan 2018 – Feb 2026",
    location: "Onsite",
    role: "Software Consultant",
    organization: "Qwaider Group of Companies",
    summary:
      "Led technical discovery and feasibility assessments to deliver complex software designs within company budgets and project timelines.",
    technologies: "C# · Visual Basic · Python · SQL",
  },
] as const;

type Skill = {
  label: string;
  icon?: string;
};

type SkillGroup = {
  id: string;
  title: string;
  skills: readonly Skill[];
};

const skillIcon = (filename: string) => `/assets/icons/skills/${filename}`;

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    id: "languages",
    title: "Programming Languages",
    skills: [
      { label: "C#", icon: skillIcon("csharp.svg") },
      { label: "VB", icon: skillIcon("visualbasic.svg") },
      { label: "Java", icon: skillIcon("java.svg") },
      { label: "Python", icon: skillIcon("python.svg") },
      { label: "Rust", icon: skillIcon("rust.svg") },
      { label: "Go", icon: skillIcon("go.svg") },
      { label: "JavaScript", icon: skillIcon("javascript.svg") },
      { label: "TypeScript", icon: skillIcon("typescript.svg") },
      { label: "SQL", icon: skillIcon("sql.svg") },
    ],
  },
  {
    id: "frameworks",
    title: "Frameworks and Technologies",
    skills: [
      { label: "HTML", icon: skillIcon("html.svg") },
      { label: "CSS", icon: skillIcon("css.svg") },
      { label: "Node.js", icon: skillIcon("node-js.svg") },
      { label: "Express.js", icon: skillIcon("expressjs-light.svg") },
      { label: "React.js", icon: skillIcon("file-type-reactjs.svg") },
      { label: "Next.js", icon: skillIcon("nextjs-solid.svg") },
      { label: "Tailwind CSS", icon: skillIcon("tailwind-css.svg") },
      { label: "REST APIs", icon: skillIcon("rest-api.svg") },
      { label: "PostgreSQL", icon: skillIcon("postgresql.svg") },
      { label: "Git", icon: skillIcon("git.svg") },
      { label: "Playwright", icon: skillIcon("playwright.svg") },
    ],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    skills: [
      { label: "TensorFlow", icon: skillIcon("tensorflow.svg") },
      { label: "Scikit-learn", icon: skillIcon("scikitlearn.svg") },
      { label: "Pandas", icon: skillIcon("pandas-icon.svg") },
      { label: "NumPy", icon: skillIcon("numpy.svg") },
    ],
  },
  {
    id: "llm-tools",
    title: "LLM Tools",
    skills: [
      { label: "Claude Code", icon: skillIcon("claude.svg") },
      { label: "GPT Codex", icon: skillIcon("chat-gpt.svg") },
      { label: "Kimi AI", icon: skillIcon("kimi.svg") },
      { label: "GLM AI", icon: skillIcon("glm-v.svg") },
    ],
  },
] as const;

export const FEATURED_PROJECTS: readonly FeaturedProject[] = [
  {
    approved: true,
    slug: "topspin",
    title: "TopSpin",
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
      "Auth.js",
      "Vercel",
    ],
    description:
      "A competitive tennis platform built to help players find opponents at a similar skill level, play verified ranked matches, climb singles and doubles leaderboards, and compete in prize-pool tournaments.",
    keyFeatures: [
      "🎾 Competitive Rating System: Separate singles and doubles rankings powered by the Glicko-2 rating system",
      "🏆 Challenge System: Rating-based player challenges designed to match competitors within an appropriate skill range",
      "✅ Verified Match Results: Match scores require proof uploads, opponent confirmation, and moderator approval",
      "📊 Live Leaderboards: Public singles and doubles rankings with player ratings and match records",
      "🏅 Prize Tournaments: Admin-managed tournaments with entry fees, prize pools, and permanent achievement badges",
      "🛡️ Fair Play System: Anti-farming rules, sanctions, dispute resolution, and audit logging",
      "📱 Responsive Platform: Competitive tennis experience designed for players across devices",
    ],
    liveUrl: "https://top-spin.gr/",
    previewImage: "/assets/projects/topspin/dashboard.webp",
    galleryImages: [
      {
        src: "/assets/projects/topspin/landing.webp",
        alt: "TopSpin landing page with tennis rankings and platform features",
        width: 1600,
        height: 2780,
      },
      {
        src: "/assets/projects/topspin/account.webp",
        alt: "TopSpin account creation form",
        width: 1600,
        height: 885,
      },
      {
        src: "/assets/projects/topspin/dashboard.webp",
        alt: "TopSpin player dashboard with challenges, ratings, and announcements",
        width: 1600,
        height: 1619,
      },
    ],
  },
  {
    approved: true,
    slug: "canva-clone",
    title: "Canva Clone",
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
      "Auth.js",
      "Zustand",
      "TanStack Query",
      "Replicate AI",
      "Unsplash",
      "UploadThing",
      "Stripe",
      "Vercel",
    ],
    description:
      "A full-featured graphic design SaaS platform inspired by Canva, featuring a powerful browser-based design editor, project management, AI-powered image tools, authentication, cloud storage, and subscription-based premium features.",
    keyFeatures: [
      "🎨 Design Editor: Interactive canvas editor with templates, text, shapes, layers, drawing tools, and object manipulation",
      "🤖 AI-Powered Tools: AI image generation and background removal powered by Replicate",
      "🔐 Multi-Provider Authentication: Secure authentication with Google, GitHub, and email/password",
      "💳 Subscription System: Stripe-powered subscriptions for premium projects, templates, AI generations, and high-resolution exports",
      "🖼️ Media Management: UploadThing for file uploads and Unsplash integration for stock photography",
      "📁 Project Management: Create, save, organize, and manage multiple design projects",
      "📤 Design Export: Export designs in PNG, JPG, SVG, and JSON formats",
      "📱 Responsive Interface: Responsive design system optimized across desktop and mobile devices",
      "⚡ Production Deployment: Deployed on Vercel with a modern Next.js application architecture",
    ],
    technicalHighlights: [
      "Implemented a browser-based design editor using Fabric.js for interactive canvas rendering and object manipulation",
      "Built the application architecture with Next.js 14, React 18, and TypeScript",
      "Developed reusable interface components with shadcn/ui and Tailwind CSS",
      "Implemented backend APIs using Hono.js with Drizzle ORM and Neon PostgreSQL",
      "Integrated Auth.js for Google, GitHub, and credential-based authentication",
      "Managed client-side application state with Zustand and server-state/data fetching with TanStack Query",
      "Integrated Replicate AI for image generation and automated background-removal workflows",
      "Implemented Stripe subscription and payment workflows for premium SaaS functionality",
      "Integrated UploadThing for user-generated media uploads and Unsplash for external stock imagery",
      "Implemented multi-format design serialization and export workflows including PNG, JPG, SVG, and JSON",
      "Configured the application for production deployment through Vercel",
    ],
    liveUrl: "https://canva-clone-ali.vercel.app/",
    previewImage: "/assets/projects/canva-clone/dashboard.webp",
    galleryImages: [
      {
        src: "/assets/projects/canva-clone/login.webp",
        alt: "Canva Clone login with email, Google, and GitHub options",
        width: 1600,
        height: 849,
      },
      {
        src: "/assets/projects/canva-clone/dashboard.webp",
        alt: "Canva Clone dashboard with design templates and project navigation",
        width: 1600,
        height: 842,
      },
      {
        src: "/assets/projects/canva-clone/editor.webp",
        alt: "Canva Clone design editor with drawing tools and a travel poster canvas",
        width: 1600,
        height: 842,
      },
    ],
  },
  {
    approved: true,
    slug: "zoom-clone",
    title: "Zoom Clone",
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "shadcn/ui",
      "Clerk",
      "Stream Video SDK",
      "Vercel",
    ],
    description:
      "A full-featured video conferencing platform inspired by Zoom, built for real-time online meetings with secure authentication, meeting management, screen sharing, recording, participant controls, and scheduled sessions.",
    keyFeatures: [
      "🎥 Real-Time Video Meetings: Host and join interactive video meetings with real-time audio and video communication",
      "🔐 Secure Authentication: User authentication and authorization powered by Clerk",
      "🖥️ Screen Sharing: Share your screen during meetings for presentations and collaboration",
      "🎙️ Meeting Controls: Manage microphone, camera, audio, video, and participant permissions",
      "😀 Interactive Meetings: Support for emoji reactions and participant interactions",
      "📅 Meeting Scheduling: Schedule future meetings with configurable date and time",
      "🔗 Instant Meetings: Create and share meeting links for immediate sessions",
      "📋 Meeting History: Access upcoming and previously hosted meetings",
      "🎬 Recording Support: Access recordings of completed meetings",
      "👤 Personal Meeting Room: Dedicated personal meeting room with a shareable meeting link",
      "📱 Responsive Interface: Adaptive UI designed for desktop and mobile experiences",
    ],
    technicalHighlights: [
      "Implemented real-time video and audio communication using the Stream Video SDK",
      "Integrated Clerk for authentication, authorization, and protected application routes",
      "Built reusable UI components with shadcn/ui and Tailwind CSS",
      "Developed meeting lifecycle management for creating, joining, scheduling, and ending calls",
      "Implemented participant controls including mute, video management, pinning, and participant moderation",
      "Integrated screen-sharing and meeting recording capabilities through the video platform",
      "Developed upcoming and past meeting views for organizing meeting history",
      "Created reusable meeting components and hooks to maintain a modular application architecture",
      "Implemented responsive layouts to provide a consistent conferencing experience across screen sizes",
      "Deployed the production application through Vercel",
    ],
    liveUrl: "https://zoom-clone-iota-six.vercel.app/",
    previewImage: "/assets/projects/zoom-clone/dashboard.webp",
    galleryImages: [
      {
        src: "/assets/projects/zoom-clone/login.webp",
        alt: "Zoom clone sign-in with Clerk authentication options",
        width: 1600,
        height: 842,
      },
      {
        src: "/assets/projects/zoom-clone/dashboard.webp",
        alt: "Zoom clone dashboard with instant meetings, scheduling, and recordings",
        width: 1600,
        height: 842,
      },
      {
        src: "/assets/projects/zoom-clone/meeting.webp",
        alt: "Zoom clone meeting room with participant tile and call controls",
        width: 1600,
        height: 842,
      },
    ],
  },
  {
    approved: true,
    slug: "durable-impact-academy",
    title: "Durable Impact Academy",
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "Radix UI",
      "Google Tag Manager",
      "Google Forms",
      "Vercel",
    ],
    description:
      "A comprehensive training and education platform built for Durable Impact Academy to showcase practical digital-skills programs, career pathways, specialized training, events, and opportunities for learners in Cameroon.",
    keyFeatures: [
      "🎓 Training Catalog: Structured presentation of 15+ accelerated certification programs covering web development, AI, cybersecurity, design, data, marketing, and entrepreneurship",
      "🚀 Career Programs: Dedicated career and specialized pathways for learners seeking deeper technical and professional development",
      "📚 Course Details: Individual training pages with program overviews, curriculum, learning outcomes, career paths, fees, schedules, and admission information",
      "📝 Student Registration: Integrated registration flows using online application forms for prospective students",
      "📅 Events & Training Sessions: Dedicated event listings for upcoming and past workshops, courses, and live training sessions",
      "🌍 Multilingual Experience: English and French versions of the platform to support a broader audience",
      "💬 Direct Communication: WhatsApp integration for prospective students and visitors to contact the academy",
      "🎥 Media Integration: YouTube video integration for testimonials and educational content",
      "🤝 Partner Showcase: Dedicated partnership section for organizations, businesses, and universities",
      "📱 Responsive Design: Mobile-friendly experience across different screen sizes",
      "🔍 SEO-Friendly Content: Structured course and informational pages designed to make training programs discoverable online",
    ],
    technicalHighlights: [
      "Implemented a structured training-content architecture covering accelerated, career, and specialized programs",
      "Developed reusable course-detail layouts containing curriculum, admission requirements, pricing, schedules, and career information",
      "Integrated Google Forms for learner registration and application workflows",
      "Integrated Google Tag Manager for website analytics and tag-management capabilities",
      "Embedded YouTube content for student testimonials and academy media",
      "Integrated WhatsApp-based communication for direct learner engagement",
      "Implemented English/French localized routes and content for the academy's multilingual audience",
      "Built structured event and training content pages for workshops, courses, and upcoming activities",
      "Optimized the information architecture around learners, training programs, events, partnerships, and registration",
      "Implemented responsive layouts and media sections for a consistent experience across desktop and mobile devices",
    ],
    liveUrl: "https://www.durableimpactacademy.com/",
    previewImage: "/assets/projects/durable-impact-academy/landing.webp",
    galleryImages: [
      {
        src: "/assets/projects/durable-impact-academy/landing.webp",
        alt: "Durable Impact Academy landing page with digital-skills training programs",
        width: 1600,
        height: 2560,
      },
      {
        src: "/assets/projects/durable-impact-academy/career.webp",
        alt: "Durable Impact Academy career and specialized training programs",
        width: 1600,
        height: 2101,
      },
      {
        src: "/assets/projects/durable-impact-academy/training.webp",
        alt: "Durable Impact Academy web development course with curriculum and admissions",
        width: 1600,
        height: 3401,
      },
    ],
  },
  {
    approved: true,
    slug: "local-notes",
    title: "Offline Local Notes (Desktop)",
    technologies: [
      "JavaScript",
      "Node.js",
      "React",
      "Vite",
      "Fastify",
      "NPM",
      "Vitest",
      "Markdown",
      "Filesystem API",
    ],
    description:
      "A local-first note-taking application designed for private, offline content management, combining a React/Vite interface with a lightweight Node.js/Fastify server and human-readable Markdown/text file persistence.",
    installation: "npx local-notes",
    usage: "Local URL: http://127.0.0.1:8989",
    keyFeatures: [
      "📝 Local Note Management: Create, edit, organize, and manage notes directly on the local filesystem",
      "📂 Filesystem-First Storage: Persists notes as human-readable .md and .txt files instead of relying on a cloud database",
      "🔎 Note Organization: Provides a structured workspace for browsing and managing local notes",
      "⚡ Offline-First: Fully functional without cloud services, external APIs, accounts, or telemetry",
      "🖥️ Local Web Application: Runs a browser-based interface through a locally hosted Node.js server",
      "🚀 Simple CLI Launch: Installable through NPM and launchable with npx local-notes",
      "🧪 Automated Testing: Includes Vitest configuration and a dedicated test suite",
      "🔒 Privacy-Focused Architecture: Keeps notes and application data on the user's local machine",
    ],
    technicalHighlights: [
      "Built a React frontend with Vite for a lightweight and fast local development experience",
      "Implemented a Node.js/Fastify backend to serve the local application and handle filesystem-based operations",
      "Designed a filesystem-first persistence model using human-readable Markdown and text files",
      "Stored application content locally under ~/.local-notes/, eliminating dependency on a remote database",
      "Implemented a fully offline architecture with no cloud services, external APIs, analytics, telemetry, or user accounts",
      "Packaged the application as an NPM-installable local tool with a simple npx local-notes launch workflow",
      "Configured Vitest for automated application testing",
      "Structured the project with separate frontend, backend, test, architecture, and operational documentation",
      "Designed the application around local ownership and portability of user-generated content",
    ],
    sourceUrl: "https://github.com/Jopy-Dev/local-notes",
    previewImage: "/assets/projects/local-notes/split-side-by-side.webp",
    galleryImages: [
      {
        src: "/assets/projects/local-notes/source.webp",
        alt: "Local Notes workspace with filesystem navigation and Markdown source editor",
        width: 1600,
        height: 878,
      },
      {
        src: "/assets/projects/local-notes/split-side-by-side.webp",
        alt: "Local Notes Markdown editor and rendered preview displayed side by side",
        width: 1600,
        height: 880,
      },
      {
        src: "/assets/projects/local-notes/split-preview-below.webp",
        alt: "Local Notes workspace with Markdown source above the rendered preview",
        width: 1600,
        height: 883,
      },
    ],
  },
  {
    approved: true,
    slug: "ai-powered-resume",
    title: "AI Powered Resume",
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "OpenAI",
      "GPT API",
      "Stripe",
      "Vercel",
    ],
    description:
      "An AI-powered resume optimization platform that analyzes resumes against ATS requirements, provides structured feedback, and generates tailored resume variants based on specific job descriptions while keeping the original master resume intact.",
    keyFeatures: [
      "🤖 AI Resume Analysis: Evaluates resumes and provides structured, actionable feedback on content and presentation",
      "📊 ATS Readiness: Analyzes resume content from an applicant-tracking-system perspective and identifies potential issues",
      "🎯 Job Description Matching: Tailors resume content against individual job descriptions while preserving the original information",
      "✍️ Bullet Optimization: Improves resume bullets using stronger verbs, scope, and quantified outcomes",
      "📄 PDF & DOCX Support: Accepts common resume document formats and converts them into reusable structured resume data",
      "🔄 Diff-Based Editing: Displays AI-generated changes so users can accept, reject, or regenerate individual edits",
      "📚 Master Resume: Maintains a reusable master version that can serve as the source for multiple job-specific variants",
      "⚡ Fast AI Workflow: Designed to provide resume analysis and job-specific tailoring within a short interactive workflow",
    ],
    technicalHighlights: [
      "Implemented an AI-driven resume analysis pipeline for evaluating content quality and ATS-oriented requirements",
      "Designed a structured resume representation that allows the same master resume to be reused across multiple applications",
      "Developed job-description matching logic to generate role-specific resume variants without modifying the master copy",
      "Implemented diff-based AI editing so users can review, accept, reject, or regenerate individual content changes",
      "Integrated document parsing workflows for PDF and DOCX resume input",
      "Applied structured prompt/response workflows to generate consistent resume recommendations and rewritten bullet points",
      "Designed the interface around a streamlined upload → analysis → tailoring workflow",
      "Implemented responsive UI patterns for an accessible resume optimization experience across devices",
    ],
    liveUrl: "https://resume-roaster.vercel.app/",
    previewImage: "/assets/projects/ai-powered-resume/screen-2.webp",
    galleryImages: [
      {
        src: "/assets/projects/ai-powered-resume/screen-1.webp",
        alt: "AI-powered resume landing page describing master resumes and job-specific tailoring",
        width: 1600,
        height: 1511,
      },
      {
        src: "/assets/projects/ai-powered-resume/screen-2.webp",
        alt: "AI-powered resume upload page with PDF and DOCX input and analysis workflow",
        width: 1600,
        height: 1742,
      },
      {
        src: "/assets/projects/ai-powered-resume/screen-3.webp",
        alt: "AI-powered resume workspace with the Tailor for a new job dialog",
        width: 1600,
        height: 849,
      },
    ],
  },
  {
    approved: true,
    slug: "figma-clone",
    title: "Figma Clone (Vanilla JavaScript)",
    technologies: [
      "HTML5",
      "CSS3",
      "Vanilla JavaScript",
      "HTML5 Canvas",
      "LocalStorage API",
      "File API",
      "Clipboard API",
      "Vercel",
    ],
    description:
      "A browser-based Figma-inspired design editor built entirely with vanilla HTML, CSS, and JavaScript, featuring an interactive infinite canvas, professional design tools, shape manipulation, image assets, comments, effects, multi-page projects, and PNG export.",
    keyFeatures: [
      "🎨 Design Editor: Create and manipulate rectangles, ellipses, lines, arrows, polygons, stars, paths, and text",
      "🖱️ Interactive Canvas: Infinite canvas with smooth pan, zoom, selection, resizing, and transformation controls",
      "📐 Design Tools: Multi-selection, alignment, rotation, flip, stroke, fill, opacity, and corner-radius controls",
      "🖼️ Image Management: Upload, paste, preview, and reuse images through a dedicated assets gallery",
      "💬 Comments System: Place persistent comments directly on canvas elements for design feedback",
      "✨ Effects System: Configurable drop shadows with X, Y, blur, spread, color, and opacity controls",
      "📄 Multi-Page Projects: Create, switch between, search, and manage multiple design pages",
      "🔍 Dynamic Search: Search project content with highlighting and automatic canvas focusing",
      "📤 PNG Export: Render designs to canvas and export them as PNG images",
      "💾 Local Persistence: Automatically saves project data in browser LocalStorage",
      "⌨️ Keyboard Shortcuts: Figma-style shortcuts for tools, selection, zooming, and command actions",
      "📱 Responsive UI: Adaptive interface with collapsible sidebars and floating controls",
    ],
    technicalHighlights: [
      "Built the entire editor using vanilla JavaScript without frontend frameworks",
      "Implemented a centralized application state for tools, shapes, selections, comments, pages, assets, and canvas configuration",
      "Developed a unified shape-rendering system with SVG generation for complex shapes such as arrows, polygons, and stars",
      "Implemented multi-selection, drag positioning, resizing, alignment, rotation, and horizontal/vertical flipping",
      "Built a configurable effects system using CSS filters for real-time drop-shadow previews",
      "Implemented a 10%–400% zoom system with zoom-to-fit and zoom-to-selection functionality",
      "Developed browser-based persistence using LocalStorage with debounced saving to reduce unnecessary writes",
      "Integrated the File API and Clipboard API for image uploads and clipboard-based image insertion",
      "Implemented PNG export through HTML5 Canvas rendering",
      "Used CSS transforms and hardware-accelerated animations for smoother canvas interactions",
      "Built responsive sidebars, inspector panels, toolbars, and micro-interactions to closely reproduce a professional design-tool workflow",
    ],
    liveUrl: "https://figclo.vercel.app/",
    previewImage: "/assets/projects/figma-clone/screen-1.webp",
    galleryImages: [
      {
        src: "/assets/projects/figma-clone/screen-1.webp",
        alt: "Figma Clone editor with selected mobile interface image and design inspector",
        width: 1600,
        height: 842,
      },
      {
        src: "/assets/projects/figma-clone/screen-2.webp",
        alt: "Figma Clone multi-page editor with text and shape layers on the canvas",
        width: 1600,
        height: 842,
      },
      {
        src: "/assets/projects/figma-clone/screen-3.webp",
        alt: "Figma Clone canvas showing a selected line, rounded shapes, and effects controls",
        width: 1600,
        height: 842,
      },
    ],
  },
  {
    approved: true,
    slug: "online-notes-management",
    title: "Online Notes Management",
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Radix UI",
      "Lucide React",
      "RESTful API",
      "Vercel",
    ],
    description:
      "A full-stack notes management application built with Next.js and React, providing a clean interface for creating, viewing, updating, and deleting notes through a RESTful CRUD workflow.",
    keyFeatures: [
      "📝 Note Management: Create, view, edit, and delete notes through an intuitive interface",
      "🔄 CRUD Operations: Complete Create, Read, Update, and Delete workflow for persistent note management",
      "🔌 RESTful API: Structured API endpoints for managing individual notes and note collections",
      "🎨 Modern UI: Clean and responsive interface built with Tailwind CSS and reusable UI components",
      "🔔 User Feedback: Toast notifications for successful actions and application states",
      "📱 Responsive Design: Adaptive interface optimized for different screen sizes",
      "⚡ Modern Next.js Architecture: Built using the Next.js App Router with React Server/Client capabilities",
      "🧩 Reusable Components: Modular component structure for maintainable UI development",
    ],
    technicalHighlights: [
      "Built the application using Next.js 15.5.4, React 19.1, and TypeScript",
      "Implemented RESTful note endpoints covering creation, retrieval, individual lookup, updating, and deletion",
      "Structured the application using Next.js App Router conventions with dedicated app, components, hooks, and lib directories",
      "Developed a reusable component system using Radix UI primitives and Tailwind CSS 4",
      "Integrated Lucide React for consistent, scalable interface icons",
      "Implemented Sonner-based toast notifications for user action feedback",
      "Configured ESLint and TypeScript for code quality and type-safe development",
      "Optimized the application for production deployment on Vercel",
    ],
    liveUrl: "https://notes-crud-2025.vercel.app/",
    previewImage: "/assets/projects/online-notes-management/screen-1.webp",
    galleryImages: [
      {
        src: "/assets/projects/online-notes-management/screen-1.webp",
        alt: "Online Notes Management welcome page listing RESTful note endpoints",
        width: 1600,
        height: 849,
      },
      {
        src: "/assets/projects/online-notes-management/screen-2.webp",
        alt: "Online Notes Management create-note dialog with title and content fields",
        width: 1600,
        height: 849,
      },
      {
        src: "/assets/projects/online-notes-management/screen-3.webp",
        alt: "Online Notes Management note details dialog with content and edit action",
        width: 1600,
        height: 849,
      },
    ],
  },
];

export function getFeaturedProject(slug: string): FeaturedProject | undefined {
  return FEATURED_PROJECTS.find((project) => project.slug === slug);
}

export function getProjectStaticParams(): Array<{ slug: string }> {
  return FEATURED_PROJECTS.map(({ slug }) => ({ slug }));
}
