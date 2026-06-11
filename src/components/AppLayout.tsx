"use client"

import { Sidebar } from "@/components/Sidebar";
import { Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { MobileHeader } from "./layout/MobileHeader";

/**
 * AppLayout component that provides the core layout structure for authenticated pages.
 * 
 * Initial state: Checks if the user is authenticated and manages the mobile sidebar state.
 * Final state: Renders the sidebar and main content area, or a loading spinner if authenticating.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer
  const toggleSidebar = () => setIsOpen(!isOpen);
  
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} toggleSidebar={toggleSidebar} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <MobileHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        {children}
      </main>
    </div>
  );
}
