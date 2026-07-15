export interface Project {
  slug: string;
  title: string;
  image: string;
  /** Short 1-2 sentence blurb shown on the card. */
  description: string;
  techStack: string[];
  /** Full case-study copy shown in the modal. */
  summary: string;
  problem: string;
  keyFeatures: string[];
  role: string;
  challenges: string;
  solutions: string;
  /** Optional — omit to hide the section entirely. */
  timeline?: string;
  /** Optional extra screenshots shown in the modal, beyond the main image. */
  screenshots?: string[];
  /**
   * Left unset until a real demo clip is ready — the modal already renders a
   * placeholder section when this is empty, so adding a video later is just
   * setting this string (a file path in /public or a hosted URL); no
   * component changes needed.
   */
  videoUrl?: string;
}

// Manually curated — update this by hand as projects ship. Not database-driven.
//
// PLACEHOLDER CONTENT: every field below except title/image/slug is starter
// copy to replace with the real case-study details for each project —
// nothing here should be treated as an actual claim about what these
// projects do until you've edited it in.
export const projects: Project[] = [
  {
    slug: "cessca",
    title: "CESSCA - PTC",
    image: "/projects/CESSCA.png",
    description: "Student organizations hub for Pateros Technological College with event management and member directory.",
    techStack: ["Next.js", "Tailwind CSS", "JavaScript", "Supabase", "PostgreSQL"],
    summary: "A centralized digital hub designed specifically for the student organizations of Pateros Technological College (PTC) to streamline their operations, communications, and directories.",
    problem: "Student organizations at PTC lacked a unified digital platform to announce events, manage members, and showcase their activities, leading to fragmented communication and manual tracking.",
    keyFeatures: [
      "Student organization directory",
      "Event management and announcements dashboard",
      "Interactive member registry and profile management"
    ],
    role: "Full Stack Developer responsible for database design, API integration, and crafting a responsive frontend user interface.",
    challenges: "Ensuring secure and structured data access so that different student organizations can only manage their respective event listings and directories without interfering with others.",
    solutions: "Implemented robust Row-Level Security (RLS) policies in Supabase coupled with Next.js middleware to strictly enforce role-based access control."
  },
  {
    slug: "ducksitet",
    title: "DucksiteT",
    image: "/projects/DUCKSITET.png",
    description: "Interactive quiz platform for Pateros Technological College with scoring, progress tracking, and leaderboards.",
    techStack: ["Next.js", "Tailwind CSS", "JavaScript", "Supabase", "PostgreSQL"],
    summary: "An interactive and engaging web-based quiz platform tailored for students of Pateros Technological College to test their knowledge, track their academic progress, and compete on leaderboards.",
    problem: "Traditional academic assessments can feel repetitive or stressful, reducing student engagement and making it difficult for learners to visually monitor their study improvements over time.",
    keyFeatures: [
      "Interactive quiz interface with real-time scoring",
      "Gamified leaderboards to encourage friendly competition",
      "Personal progress tracking dashboard for students"
    ],
    role: "Lead Full Stack Developer in charge of designing the database architecture, managing state transitions for the quizzes, and designing the responsive gamified UI.",
    challenges: "Handling real-time state management for quiz timers and scoring, ensuring that page reloads or minor disruptions do not corrupt the student's quiz session or leaderboard score submissions.",
    solutions: "Utilized local state persistence alongside Supabase transactions to reliably process and lock in final quiz scores once completed."
  },
  {
    slug: "inventory-system",
    title: "Inventory And Job Order System",
    image: "/projects/INVENTORYSYSTEM.png",
    description: "Enterprise system for Vista CCTV managing inventory tracking, job orders, and workflow automation.",
    techStack: ["Next.js", "Tailwind CSS", "JavaScript", "Supabase", "PostgreSQL"],
    summary: "An enterprise-grade internal management system built for Vista CCTV to efficiently oversee physical inventory levels, streamline job orders, and automate service workflows.",
    problem: "Manual inventory logs and paper-based job orders led to tracking errors, communication delays between technicians and administrators, and general inefficiencies in day-to-day operations.",
    keyFeatures: [
      "Real-time physical inventory tracking with low-stock alerts",
      "Job order dispatching and status tracking for technicians",
      "Automated operational workflow updates and reports"
    ],
    role: "Full Stack Developer tasked with building the schema relation models, developing the CRUD operations, and designing the admin control panel.",
    challenges: "Syncing inventory stock counts accurately during simultaneous operations, such as when a job order deducts items from the warehouse in real-time while a physical audit is ongoing.",
    solutions: "Implemented database-level triggers and transaction rollbacks to maintain strict inventory integrity, ensuring that stock levels never desynchronize."
  },
  {
    slug: "rfid",
    title: "RFID Student Monitoring",
    image: "/projects/RFID.png",
    description: "Smart student tracking system using RFID technology for campus security and attendance automation.",
    techStack: ["React", "Node.js", "JavaScript", "MongoDB"],
    summary: "A hardware-integrated software system leveraging Radio-Frequency Identification (RFID) technology to automate campus attendance, streamline check-ins, and enhance overall campus security.",
    problem: "Manual pen-and-paper attendance logs at campus entrance gates cause heavy foot-traffic bottlenecks and provide no real-time data verification for security personnel.",
    keyFeatures: [
      "Instant RFID tap-and-log attendance scanning",
      "Real-time monitoring panel displaying student details upon entry",
      "Secure centralized database managing student credentials and logs"
    ],
    role: "Hardware-to-Software Integration Developer and Backend Engineer in charge of setting up the Node.js event listener and data ingestion flow.",
    challenges: "Achieving near-zero latency when streaming scanned RFID badge data from physical readers directly to the web application monitor.",
    solutions: "Implemented WebSockets to establish a persistent, bidirectional connection, enabling real-time visual updates on the administrator dashboard the exact millisecond a card is tapped."
  },
  {
    slug: "smart-attendance",
    title: "Smartendance",
    image: "/projects/SMARTENDANCE.png",
    description: "Automated attendance management system for barangay operations with real-time tracking and reporting.",
    techStack: ["Next.js", "Tailwind CSS", "JavaScript", "Supabase", "PostgreSQL"],
    summary: "A localized automated attendance and tracking management system designed to optimize barangay operations, public meetings, and community service event logs.",
    problem: "Local barangay offices struggle with tedious manual attendance registration during community programs, leading to unorganized physical records and delayed official reports.",
    keyFeatures: [
      "Digital participant registry and quick check-in portal",
      "Real-time tracking of attendance metrics for community programs",
      "Exportable and formatted reports for local administration auditing"
    ],
    role: "Lead Developer responsible for translating administrative tracking requirements into a clean, easy-to-use digital application with comprehensive report generation features.",
    challenges: "Creating a highly intuitive user interface that can easily be navigated by barangay staff and citizens of all ages, including those who are not digitally savvy.",
    solutions: "Focused on clean typography, large click targets, minimal input requirements, and clear step-by-step visual prompts to guide users through the registration process."
  }
];
