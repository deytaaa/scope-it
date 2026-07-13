export interface Project {
  title: string;
  description: string;
  url: string;
  thumbnail: string;
}

// Manually curated — update this by hand as projects ship. Not database-driven.
export const projects: Project[] = [];
