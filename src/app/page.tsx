"use client";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ShieldCheck, GraduationCap, Search, Landmark, Zap, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fef7f0]">
      {/* Subtle warm background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200 rounded-full blur-3xl animate-pulse" style={{animationDuration: '4s'}}></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl animate-pulse" style={{animationDuration: '6s', animationDelay: '2s'}}></div>
      </div>

      <nav className="flex items-center justify-between px-10 py-8 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 p-2 rounded-lg shadow-lg shadow-amber-500/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic text-gray-800">EduVault</span>
        </div>
        <div className="flex items-center gap-2 text-amber-700 font-bold text-[10px] uppercase tracking-[0.3em]">
          <Lock size={12} /> Protocol v1.0 Secure
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-20 pb-32 text-center relative z-10">

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-none text-gray-800">
          THE FUTURE OF <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">ACADEMIC TRUST.</span>
        </h1>

        <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-20 font-medium leading-relaxed">
          The global immutable ledger for university credentials. Eliminating fraud through cryptographic proof.
        </p>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Landmark className="text-amber-500" />}
            title="Universities"
            description="Authorized nodes for minting digital certificates into the public ledger."
            link="/university/login"
            btnText="Admin Login"
          />
          <FeatureCard 
            icon={<GraduationCap className="text-gray-700" />}
            title="Students"
            description="Take ownership of your achievements. Instantly retrieve your unique hash for verification."
            link="/student"
            btnText="Open Student Vault"
          />
          <FeatureCard 
            icon={<Search className="text-amber-500" />}
            title="Employers"
            description="Eliminate fraud instantly. Verify any degree hash against our immutable ledger."
            link="/employer"
            btnText="Verify a Hash"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, link, btnText }: any) {
  return (
    <div className="glass p-10 rounded-2xl text-left hover:border-amber-500/30 transition-all duration-300 group relative overflow-hidden hover:shadow-xl hover:shadow-amber-500/10">
      <div className="bg-amber-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 border border-amber-200">
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-4 tracking-tight text-gray-800 uppercase italic">{title}</h3>
      <p className="text-gray-600 text-sm font-medium leading-relaxed mb-10 h-16">
        {description}
      </p>
      <Link href={link}>
        <Button className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold border border-transparent hover:border-amber-600 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 group-hover:scale-[1.02]">
          {btnText} <ArrowRight size={16} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </Link>
    </div>
  );
}
