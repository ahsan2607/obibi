"use client"

import { Sidebar } from "@/components/Sidebar";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import ButtonBita from "./ButtonBita";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer
  const toggleSidebar = () => setIsOpen(!isOpen);
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} toggleSidebar={toggleSidebar} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-0">
        {/* Mobile Hamburger Button */}
        <div className="sticky z-10 flex p-4 shadow-md border bg-white border-gray-200">
          <button onClick={toggleSidebar} className="">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
