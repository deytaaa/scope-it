import { Hero } from "@/components/landing/Hero";
import { SampleQuote } from "@/components/landing/SampleQuote";
import { CoverageCards } from "@/components/landing/CoverageCards";

export default function Home() {
  return (
    <main>
      <Hero />
      <SampleQuote />
      <CoverageCards />
    </main>
  );
}
