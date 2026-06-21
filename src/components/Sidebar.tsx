"use client";

import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { MessageSquare, Pill, Calendar, FileText, AlertTriangle, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { SidebarHeader } from "./layout/SidebarHeader";
import { SidebarLink } from "./layout/SidebarLink";
import { NewChatButton } from "./layout/NewChatButton";
import { LogoutButton } from "./layout/LogoutButton";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
}

interface ChatHistoryItem {
  id: string;
}

/**
 * Sidebar component that provides navigation and chat history.
 * 
 * Initial state: Fetches user chats from Supabase and manages open/collapsed states.
 * Final state: Renders a responsive sidebar with navigation links and chat history.
 */
export const Sidebar: React.FC<SidebarProps> = ({isOpen, setIsOpen, toggleSidebar}) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    if (user) {
      /**
       * Fetches the list of chats for the current user.
       */
      const fetchChats = async () => {
        const { data } = await supabase
          .from("chats")
          .select("id, title")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false });
        if (data) setChats(data.map((item: any) => ({ id: item.id })));
      };
      fetchChats();
    }
  }, [user]);

  /**
   * Handles user logout.
   */
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  /**
   * Creates a new chat session and navigates to it.
   */
  const handleNewChat = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("chats")
      .insert([{ patient_id: user.id, title: "New Conversation" }])
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create chat", error);
      return;
    }

    if (data) {
      setChats([{ id: data.id }, ...chats]);
      router.push(`/chat/${data.id}`);
      setIsOpen(false);
    }
  };

  /**
   * Toggles the collapsed state of the sidebar.
   */
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  if (!user) return null;

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50 
          w-64 bg-gray-50 border-r border-gray-200 
          flex flex-col h-full transition-all duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        <SidebarHeader 
          isCollapsed={isCollapsed} 
          userName={user.name} 
          onToggleCollapse={toggleCollapse} 
        />

        <NewChatButton isCollapsed={isCollapsed} onClick={handleNewChat} />

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" isCollapsed={isCollapsed} onClick={() => setIsOpen(false)} />
          <SidebarLink href="/obat" icon={Pill} label="Medications" isCollapsed={isCollapsed} onClick={() => setIsOpen(false)} />
          <SidebarLink href="/jadwal-obat" icon={Calendar} label="Schedule" isCollapsed={isCollapsed} onClick={() => setIsOpen(false)} />
          <SidebarLink href="/laporan-kepatuhan" icon={FileText} label="Compliance" isCollapsed={isCollapsed} onClick={() => setIsOpen(false)} />
          <SidebarLink href="/interaksi-obat" icon={AlertTriangle} label="Interactions" isCollapsed={isCollapsed} onClick={() => setIsOpen(false)} />

          {!isCollapsed && (
            <div className="pt-6 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Chat History
            </div>
          )}

          <div className="space-y-1">
            {chats.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl hover:bg-gray-100 transition text-sm ${isCollapsed ? "justify-center" : ""}`}
              >
                <MessageSquare size={18} />
                {!isCollapsed && <span className="truncate">Chat #{c.id.substring(0, 8)}</span>}
              </Link>
            ))}
          </div>
        </nav>

        <LogoutButton isCollapsed={isCollapsed} onLogout={handleLogout} />
      </div>
    </>
  );
}
