import { Features } from '@/components/Features';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Navbar } from '@/components/Navbar';
import { ProblemList } from '@/components/ProblemList';

export default function Home() {
    return (
        <main className="min-h-screen bg-bg text-slate-50">
            <Navbar />
            <Hero />
            <ProblemList />
            <Features />
            <HowItWorks />
        </main>
    );
}
