"use client";

import { useAuth } from "@/components/AuthProvider";
import { Bot, Pill, Calendar, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Selamat datang, {user.name}! 👋</h1>
          <p className="text-gray-500 text-sm sm:text-base md:text-lg">Pantau jadwal dan kepatuhan minum obat Anda agar selalu sehat dan bugar.</p>
        </div>

        {/* Halo AI Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 md:w-2/3">
            <div className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 backdrop-blur-sm border border-white/30">
              <Bot size={14} className="sm:w-4 sm:h-4 w-3 h-3" />
              <span>Halo AI - Asisten Kesehatan Anda</span>
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 leading-tight">
              Punya pertanyaan seputar obat Anda?
            </h2>
            <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">
              Tanyakan indikasi, efek samping, dosis, atau bagikan gambar resep Anda langsung ke Halo AI!
            </p>
            <Link 
              href="/chat"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-blue-50 transition shadow-sm text-sm sm:text-base min-h-[44px]"
            >
              Mulai Chat Sekarang
              <ArrowRight size={18} className="sm:w-5 sm:h-5 w-4 h-4" />
            </Link>
          </div>
          <Bot className="absolute -bottom-8 -right-8 sm:-bottom-10 sm:-right-10 w-40 sm:w-64 h-40 sm:h-64 text-white opacity-10" />
        </div>

        {/* Quick Menu / Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/jadwal-obat" className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-50 text-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-teal-600 group-hover:text-white transition">
              <Calendar size={24} className="sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Jadwal Hari Ini</h3>
            <p className="text-gray-500 text-sm">Lihat dan atur pengingat jadwal minum obat Anda.</p>
          </Link>
          
          <Link href="/obat" className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-50 text-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
              <Pill size={24} className="sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Daftar Obat</h3>
            <p className="text-gray-500 text-sm">Kelola inventaris obat-obatan yang sedang Anda konsumsi.</p>
          </Link>
          
          <Link href="/interaksi-obat" className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-50 text-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertTriangle size={24} className="sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Cek Interaksi</h3>
            <p className="text-gray-500 text-sm">Periksa potensi interaksi berbahaya antara obat Anda.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
