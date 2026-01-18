import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { GraduationCap, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 max-w-lg w-full">
        
        {/* Logo / Icon */}
        <div className="flex justify-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-primary border border-slate-100 rotate-3 hover:rotate-0 transition-transform duration-500">
                <GraduationCap className="w-12 h-12" />
            </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight font-heading">
                IIC Results Page
            </h1>
            <p className="text-lg text-slate-500 font-medium">
                Check your performance, track progress, and view test results instantly.
            </p>
        </div>

        {/* Action */}
        <div className="pt-4">
            <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2 group">
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-slate-400 text-sm font-medium">
        © 2026 IIC Education System
      </div>
    </div>
  );
}
