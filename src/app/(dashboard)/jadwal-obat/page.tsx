"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, Loader, AlertCircle, Bell, Pill, TrendingUp, Clock } from "lucide-react";
import { useEffect, useState } from "react";

// Types
interface Schedule {
  id: string;
  medicine_name: string;
  dosage: string;
  time: string;
  date: string;
  user_id: string;
}

// Pastel color palette with thick left border
const colorPalette = [
  { bg: "bg-blue-50", border: "border-l-blue-500" },
  { bg: "bg-purple-50", border: "border-l-purple-500" },
  { bg: "bg-pink-50", border: "border-l-pink-500" },
  { bg: "bg-orange-50", border: "border-l-orange-500" },
  { bg: "bg-green-50", border: "border-l-green-500" },
  { bg: "bg-indigo-50", border: "border-l-indigo-500" },
  { bg: "bg-cyan-50", border: "border-l-cyan-500" },
  { bg: "bg-amber-50", border: "border-l-amber-500" },
];

export default function JadwalObatPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"kalender" | "semua" | "mendatang">("kalender");

  // Fetch schedules from Supabase
  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("jadwal_obat")
        .select("*")
        .order("waktu_minum", { ascending: true });

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        setError("Gagal memuat jadwal. Silakan coba lagi.");
        return;
      }

      // Mapping data dari jadwal_obat ke format Schedule
      const mappedSchedules = (data || []).map((item: any) => {
        try {
          let waktuMinum = new Date(item.waktu_minum);
          
          // Validate date parsing
          if (isNaN(waktuMinum.getTime())) {
            console.warn("Invalid date for item:", item);
            waktuMinum = new Date();
          }

          const time = `${String(waktuMinum.getHours()).padStart(2, "0")}.${String(waktuMinum.getMinutes()).padStart(2, "0")}`;
          const year = waktuMinum.getFullYear();
          const month = String(waktuMinum.getMonth() + 1).padStart(2, "0");
          const day = String(waktuMinum.getDate()).padStart(2, "0");
          const date = `${year}-${month}-${day}`;

          return {
            id: String(item.jadwal_id),
            medicine_name: item.nama_obat || "Obat Tidak Diketahui",
            dosage: item.dosis || "-",
            time: time,
            date: date,
            user_id: "",
          };
        } catch (err) {
          console.error("Error mapping schedule item:", item, err);
          return {
            id: String(item.jadwal_id) || "unknown",
            medicine_name: item.nama_obat || "Obat Tidak Diketahui",
            dosage: item.dosis || "-",
            time: "00.00",
            date: new Date().toISOString().split("T")[0],
            user_id: "",
          };
        }
      });

      setSchedules(mappedSchedules);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError("Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getCurrentMonthDays = () => {
    const today = new Date();
    return Array.from({ length: getDaysInMonth(today) }, (_, i) => i + 1);
  };

  const getCurrentFirstDay = () => {
    const today = new Date();
    return getFirstDayOfMonth(today);
  };

  // Get schedules for selected date
  const getSchedulesForSelectedDate = () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    return schedules.filter((s) => s.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
  };

  // Calculate stats
  const stats = {
    active: schedules.length,
    today: getSchedulesForSelectedDate().length,
    compliance: 0,
    upcoming: schedules.filter((s) => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      return s.date >= todayStr;
    }).length,
  };

  // Calendar days
  const calendarDays = getCurrentMonthDays();
  const firstDay = getCurrentFirstDay();
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const handleDateSelect = (day: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isSelectedDay = (day: number) => {
    return (
      day === currentDate.getDate() &&
      currentDate.getMonth() === new Date().getMonth() &&
      currentDate.getFullYear() === new Date().getFullYear()
    );
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Silakan masuk untuk melihat jadwal.</p>
      </div>
    );
  }

  const selectedDateFormatted = currentDate.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentMonthFormatted = currentDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const selectedSchedules = getSchedulesForSelectedDate();

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 md:p-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pengingat Obat</h1>
          <div className="flex items-center gap-2 text-teal-700 bg-teal-50 px-3 py-2 rounded-lg mt-3 w-fit">
            <Bell size={16} />
            <p className="text-sm font-medium">Atur pengingat untuk membantu Anda minum obat tepat waktu. Jangan sampai terlewat lagi!</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 md:px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Pengingat Aktif */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pengingat Aktif</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Bell size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* Dosis Hari Ini */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Dosis Hari Ini</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{stats.today}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Pill size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          {/* Tingkat Kepatuhan */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tingkat Kepatuhan</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{stats.compliance}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          {/* Mendatang */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Mendatang</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{stats.upcoming}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6 border-b border-gray-200 bg-white">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab("kalender")}
            className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base border-b-2 transition ${
              activeTab === "kalender"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Tampilan Kalender
          </button>
          <button
            onClick={() => setActiveTab("semua")}
            className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base border-b-2 transition ${
              activeTab === "semua"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Semua Pengingat
          </button>
          <button
            onClick={() => setActiveTab("mendatang")}
            className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base border-b-2 transition ${
              activeTab === "mendatang"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Mendatang
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-6">
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 flex flex-col items-center justify-center">
            <Loader size={32} className="text-teal-600 animate-spin mb-4" />
            <p className="text-gray-500 text-center">Memuat jadwal...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-4 md:p-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium text-red-900">{error}</p>
              <button
                onClick={fetchSchedules}
                className="text-sm text-red-600 hover:text-red-700 mt-2 underline"
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "kalender" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Picker */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Pilih Tanggal</h3>
                <p className="text-sm text-gray-600 mb-4">Pilih tanggal untuk melihat jadwal pengobatan</p>

                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-1 hover:bg-gray-100 rounded transition"
                  >
                    <ChevronLeft size={18} className="text-gray-600" />
                  </button>
                  <h4 className="text-sm font-semibold text-gray-900">{currentMonthFormatted}</h4>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-gray-100 rounded transition"
                  >
                    <ChevronRight size={18} className="text-gray-600" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {emptyDays.map((i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {calendarDays.map((day) => {
                    const isSelected = isSelectedDay(day);
                    const dayStr = String(day).padStart(2, "0");
                    const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
                    const yearStr = String(currentDate.getFullYear());
                    const checkDateStr = `${yearStr}-${monthStr}-${dayStr}`;
                    const hasSchedules = schedules.some((s) => s.date === checkDateStr);

                    return (
                      <button
                        key={day}
                        onClick={() => handleDateSelect(day)}
                        className={`py-2 text-sm font-medium rounded-lg transition touch-manipulation relative ${
                          isSelected
                            ? "bg-teal-500 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {day}
                        {hasSchedules && !isSelected && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Schedule for Selected Date */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Jadwal {selectedDateFormatted}</h3>
                <p className="text-sm text-gray-600 mb-6">Obat yang dijadwalkan untuk hari ini</p>

                <div className="space-y-4">
                  {selectedSchedules.length > 0 ? (
                    selectedSchedules.map((schedule, idx) => {
                      const colorIndex = idx % colorPalette.length;
                      const { bg, border } = colorPalette[colorIndex];

                      return (
                        <div
                          key={schedule.id}
                          className={`${bg} border-l-4 ${border} rounded-lg p-4 shadow-sm hover:shadow-md transition`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-base font-bold text-gray-900">{schedule.medicine_name}</p>
                              <p className="text-sm text-gray-600 mt-1">{schedule.dosage}</p>
                            </div>
                            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Aktif
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-500" />
                            <p className="text-sm text-gray-600">pukul {schedule.time || "00.00"}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-3">Konsumsi bersama makanan</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Tidak ada jadwal untuk hari ini</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "semua" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Semua Pengingat Obat</h3>
            <div className="space-y-4">
              {schedules.length > 0 ? (
                schedules.map((schedule, idx) => {
                  const colorIndex = idx % colorPalette.length;
                  const { bg, border } = colorPalette[colorIndex];

                  return (
                    <div
                      key={schedule.id}
                      className={`${bg} border-l-4 ${border} rounded-lg p-4 shadow-sm hover:shadow-md transition`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-base font-bold text-gray-900">{schedule.medicine_name}</p>
                          <p className="text-sm text-gray-600 mt-1">{schedule.dosage}</p>
                        </div>
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Aktif
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {schedule.time || "00.00"}
                        </div>
                        <div>Tanggal: {schedule.date || "-"}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Tidak ada jadwal obat</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "mendatang" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Jadwal Mendatang</h3>
            <div className="space-y-4">
              {schedules
                .filter((s) => {
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                  return s.date >= todayStr;
                })
                .map((schedule, idx) => {
                  const colorIndex = idx % colorPalette.length;
                  const { bg, border } = colorPalette[colorIndex];

                  return (
                    <div
                      key={schedule.id}
                      className={`${bg} border-l-4 ${border} rounded-lg p-4 shadow-sm hover:shadow-md transition`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-base font-bold text-gray-900">{schedule.medicine_name}</p>
                          <p className="text-sm text-gray-600 mt-1">{schedule.dosage}</p>
                        </div>
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Aktif
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {schedule.time || "00.00"}
                        </div>
                        <div>Tanggal: {schedule.date || "-"}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}