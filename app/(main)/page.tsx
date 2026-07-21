import { Hero } from "@/components/landing/Hero";
import { SampleQuote } from "@/components/landing/SampleQuote";
import { CoverageCards } from "@/components/landing/CoverageCards";
import { PortfolioTeaser } from "@/components/landing/PortfolioTeaser";

export default function Home() {
  return (
    <main>
      <Hero />
      <SampleQuote />
      <CoverageCards />
      <PortfolioTeaser />
    </main>
  );
}
