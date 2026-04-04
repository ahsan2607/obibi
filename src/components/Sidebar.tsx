"use client";

import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { LogOut, MessageSquare, Pill, Plus, Calendar, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Sidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<{chat_id: number}[]>([]);

  useEffect(() => {
    if (user) {
      const fetchChats = async () => {
        const { data } = await supabase
          .from("chat")
          .select("chat_id")
          .eq("pasien_id", user.id)
          .order("waktu", { ascending: false });
        if (data) {
          setChats(data);
        }
      };
      fetchChats();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleNewChat = async () => {
    if (!user) return;
    
    // Create new chat
    const { data, error } = await supabase
      .from("chat")
      .insert([{ pasien_id: user.id, chat: [] }])
      .select("chat_id")
      .single();

    if (error) {
      console.error("Failed to create chat", error);
      return;
    }

    if (data) {
      setChats([{ chat_id: data.chat_id }, ...chats]);
      router.push(`/chat/${data.chat_id}`);
    }
  };

  if (!user) return null;

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg text-blue-600 truncate">HealthAssist</h2>
        <p className="text-sm text-gray-500 truncate">Hi, {user.nama}</p>
      </div>

      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} /> New Chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <Link
          href="/obat"
          className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition"
        >
          <Pill size={18} /> Obat
        </Link>
        <Link
          href="/jadwal-obat"
          className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition"
        >
          <Calendar size={18} /> Jadwal Obat
        </Link>
        <Link
          href="/laporan-kepatuhan"
          className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition"
        >
          <FileText size={18} /> Laporan Kepatuhan
        </Link>
        <Link
          href="/interaksi-obat"
          className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition"
        >
          <AlertTriangle size={18} /> Interaksi Obat
        </Link>
        
        <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Chat History
        </div>
        {chats.map((c) => (
          <Link
            key={c.chat_id}
            href={`/chat/${c.chat_id}`}
            className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition truncate text-sm"
          >
            <MessageSquare size={16} /> Chat #{c.chat_id}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition w-full px-2 py-1"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
