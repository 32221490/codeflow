import { Cta } from "@/components/Cta";
import { Features } from "@/components/Features";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-slate-50">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Cta />
    </main>
  );
}
