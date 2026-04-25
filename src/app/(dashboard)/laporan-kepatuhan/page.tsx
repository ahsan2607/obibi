"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { LaporanKepatuhan } from "@/lib/types";
import { BellRing, CalendarCheck2, ClipboardList, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StatusKategori = "patuh" | "cukup" | "tidak" | "lainnya";

function getStatusKategori(status: string): StatusKategori {
  const normalized = status.toLowerCase().trim();

  if (normalized === "patuh" || normalized.includes("taat")) {
    return "patuh";
  }
  if (normalized.includes("kurang") || normalized.includes("cukup")) {
    return "cukup";
  }
  if (normalized.includes("tidak") || normalized.includes("non")) {
    return "tidak";
  }
  return "lainnya";
}

function formatTanggal(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusBadgeClass(status: StatusKategori): string {
  if (status === "patuh") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "cukup") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "tidak") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function LaporanKepatuhanPage() {
  const { user } = useAuth();
  const [laporanList, setLaporanList] = useState<LaporanKepatuhan[]>([]);
  const [totalJadwal, setTotalJadwal] = useState(0);
  const [reminderAktif, setReminderAktif] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLaporanKepatuhan = async () => {
      setLoading(true);

      const { data: laporanData, error: laporanError } = await supabase
        .from("laporan_kepatuhan")
        .select("laporan_id, pasien_id, tanggal, status_kepatuhan")
        .eq("pasien_id", user.id)
        .order("tanggal", { ascending: false });

      if (laporanError) {
        console.error("Failed to fetch laporan_kepatuhan", laporanError);
        setLoading(false);
        return;
      }

      const laporan = (laporanData || []) as LaporanKepatuhan[];
      setLaporanList(laporan);

      if (laporan.length === 0) {
        setTotalJadwal(0);
        setReminderAktif(0);
        setLoading(false);
        return;
      }

      const laporanIds = laporan.map((item) => item.laporan_id);

      const { data: jadwalData, error: jadwalError } = await supabase
        .from("jadwal_obat")
        .select("jadwal_id")
        .in("laporan_id", laporanIds);

      if (jadwalError) {
        console.error("Failed to fetch jadwal_obat", jadwalError);
        setTotalJadwal(0);
        setReminderAktif(0);
        setLoading(false);
        return;
      }

      const jadwalIds = (jadwalData || []).map((item: { jadwal_id: number }) => item.jadwal_id);
      setTotalJadwal(jadwalIds.length);

      if (jadwalIds.length === 0) {
        setReminderAktif(0);
        setLoading(false);
        return;
      }

      const { data: reminderData, error: reminderError } = await supabase
        .from("reminder")
        .select("reminder_id")
        .in("jadwal_id", jadwalIds)
        .eq("status", true);

      if (reminderError) {
        console.error("Failed to fetch reminder", reminderError);
        setReminderAktif(0);
      } else {
        setReminderAktif((reminderData || []).length);
      }

      setLoading(false);
    };

    fetchLaporanKepatuhan();
  }, [user]);

  const summary = useMemo(() => {
    let patuh = 0;
    let cukup = 0;
    let tidak = 0;

    laporanList.forEach((item) => {
      const kategori = getStatusKategori(item.status_kepatuhan || "");
      if (kategori === "patuh") patuh += 1;
      if (kategori === "cukup") cukup += 1;
      if (kategori === "tidak") tidak += 1;
    });

    const total = laporanList.length;
    const skor = total > 0 ? Math.round((patuh / total) * 100) : 0;

    return { patuh, cukup, tidak, total, skor };
  }, [laporanList]);

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-white text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Laporan Kepatuhan</h1>
          <p className="text-sm text-gray-600 mt-1">
            Ringkasan kepatuhan minum obat untuk {user.nama}. Data diperbarui dari catatan laporan dan jadwal obat Anda.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 py-12 text-center text-gray-500">
            Memuat laporan kepatuhan...
          </div>
        ) : laporanList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <ClipboardList size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Belum Ada Data Laporan</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
              Data kepatuhan akan muncul setelah Anda memiliki entri di tabel laporan kepatuhan dan jadwal obat.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Skor Kepatuhan</p>
                  <CalendarCheck2 size={18} className="text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.skor}%</p>
                <p className="text-xs text-gray-500 mt-2">Berdasarkan {summary.total} laporan</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Status Patuh</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Patuh</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.patuh}</p>
                <p className="text-xs text-gray-500 mt-2">Entri dengan kepatuhan baik</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Total Jadwal Obat</p>
                  <ShieldAlert size={18} className="text-amber-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalJadwal}</p>
                <p className="text-xs text-gray-500 mt-2">Jadwal terhubung ke laporan</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Reminder Aktif</p>
                  <BellRing size={18} className="text-cyan-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reminderAktif}</p>
                <p className="text-xs text-gray-500 mt-2">Reminder dengan status aktif</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Riwayat Laporan Terbaru</h2>
                <span className="text-xs text-gray-500">{laporanList.length} entri</span>
              </div>

              <div className="divide-y divide-gray-100">
                {laporanList.slice(0, 8).map((item) => {
                  const kategori = getStatusKategori(item.status_kepatuhan || "");

                  return (
                    <div
                      key={item.laporan_id}
                      className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">Laporan #{item.laporan_id}</p>
                        <p className="text-sm text-gray-500">Tanggal: {formatTanggal(item.tanggal)}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold w-fit ${statusBadgeClass(kategori)}`}
                      >
                        {item.status_kepatuhan || "Belum Diisi"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
