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
    title: "CESSCA",
    image: "/projects/CESSCA.png",
    description: "Add a one- to two-sentence summary of this project for the card view.",
    techStack: ["Add tech stack"],
    summary: "Add a complete project summary — what it is, who it's for, and the outcome.",
    problem: "Describe the problem this project solves.",
    keyFeatures: ["Add a key feature", "Add another key feature"],
    role: "Describe your role in this project.",
    challenges: "Describe a challenge you encountered while building this.",
    solutions: "Describe how you solved it.",
  },
  {
    slug: "ducksitet",
    title: "Ducksitet",
    image: "/projects/DUCKSITET.png",
    description: "Add a one- to two-sentence summary of this project for the card view.",
    techStack: ["Add tech stack"],
    summary: "Add a complete project summary — what it is, who it's for, and the outcome.",
    problem: "Describe the problem this project solves.",
    keyFeatures: ["Add a key feature", "Add another key feature"],
    role: "Describe your role in this project.",
    challenges: "Describe a challenge you encountered while building this.",
    solutions: "Describe how you solved it.",
  },
  {
    slug: "inventory-system",
    title: "Inventory System",
    image: "/projects/INVENTORYSYSTEM.png",
    description: "Add a one- to two-sentence summary of this project for the card view.",
    techStack: ["Add tech stack"],
    summary: "Add a complete project summary — what it is, who it's for, and the outcome.",
    problem: "Describe the problem this project solves.",
    keyFeatures: ["Add a key feature", "Add another key feature"],
    role: "Describe your role in this project.",
    challenges: "Describe a challenge you encountered while building this.",
    solutions: "Describe how you solved it.",
  },
  {
    slug: "rfid",
    title: "RFID System",
    image: "/projects/RFID.png",
    description: "Add a one- to two-sentence summary of this project for the card view.",
    techStack: ["Add tech stack"],
    summary: "Add a complete project summary — what it is, who it's for, and the outcome.",
    problem: "Describe the problem this project solves.",
    keyFeatures: ["Add a key feature", "Add another key feature"],
    role: "Describe your role in this project.",
    challenges: "Describe a challenge you encountered while building this.",
    solutions: "Describe how you solved it.",
  },
  {
    slug: "smart-attendance",
    title: "Smart Attendance",
    image: "/projects/SMARTENDANCE.png",
    description: "Add a one- to two-sentence summary of this project for the card view.",
    techStack: ["Add tech stack"],
    summary: "Add a complete project summary — what it is, who it's for, and the outcome.",
    problem: "Describe the problem this project solves.",
    keyFeatures: ["Add a key feature", "Add another key feature"],
    role: "Describe your role in this project.",
    challenges: "Describe a challenge you encountered while building this.",
    solutions: "Describe how you solved it.",
  },
];
