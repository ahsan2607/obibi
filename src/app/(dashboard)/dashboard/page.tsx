"use client";

import { useAuth } from "@/components/AuthProvider";
import { Pill, Calendar, AlertTriangle } from "lucide-react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { AIBanner } from "@/components/dashboard/AIBanner";
import { QuickMenuCard } from "@/components/dashboard/QuickMenuCard";

/**
 * DashboardPage component that serves as the main landing page for authenticated users.
 * 
 * Initial state: Retrieves the current user from useAuth.
 * Final state: Renders the welcome banner, AI assistant banner, and quick navigation menu.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
        <WelcomeBanner name={user.name} />
        
        <AIBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickMenuCard
            href="/jadwal-obat"
            icon={Calendar}
            title="Today's Schedule"
            description="View and manage your medication intake reminders."
            iconColorClass="text-teal-600"
            iconBgClass="bg-teal-50"
            hoverIconBgClass="bg-teal-600"
          />
          
          <QuickMenuCard
            href="/obat"
            icon={Pill}
            title="Medication List"
            description="Manage the inventory of medications you are currently taking."
            iconColorClass="text-purple-600"
            iconBgClass="bg-purple-50"
            hoverIconBgClass="bg-purple-600"
          />
          
          <QuickMenuCard
            href="/interaksi-obat"
            icon={AlertTriangle}
            title="Check Interactions"
            description="Check for potential harmful interactions between your medications."
            iconColorClass="text-rose-600"
            iconBgClass="bg-rose-50"
            hoverIconBgClass="bg-rose-600"
          />
        </div>
      </div>
    </div>
  );
}
