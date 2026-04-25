"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, Loader, AlertCircle } from "lucide-react";
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
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 16)); // Start from a Monday
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date(2025, 5)); // Start from June 2025

  // Slot waktu dari 00:00 hingga 23:00 (24 jam)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    return `${String(hour).padStart(2, "0")}:00`;
  });

  // Hari dalam seminggu (Senin hingga Minggu)
  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

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
        const waktuMinum = new Date(item.waktu_minum);
        const time = `${String(waktuMinum.getHours()).padStart(2, "0")}:${String(waktuMinum.getMinutes()).padStart(2, "0")}`;
        const year = waktuMinum.getFullYear();
        const month = String(waktuMinum.getMonth() + 1).padStart(2, "0");
        const day = String(waktuMinum.getDate()).padStart(2, "0");
        const date = `${year}-${month}-${day}`;

        return {
          id: String(item.jadwal_id),
          medicine_name: item.nama_obat,
          dosage: item.dosis,
          time: time,
          date: date,
          user_id: "",
        };
      });

      setSchedules(mappedSchedules);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError("Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  // Dapatkan minggu mulai dari Senin
  const getWeekDates = (date: Date): Date[] => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Sesuaikan ketika hari adalah Minggu
    const monday = new Date(d.setDate(diff));

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  // Dapatkan jadwal untuk hari dan waktu tertentu
  const getSchedulesForDayTime = (dayIndex: number, timeSlot: string) => {
    const date = weekDates[dayIndex];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    
    return schedules.filter(
      (s) => s.date === dateStr && s.time.startsWith(timeSlot.split(":")[0])
    );
  };

  // Penanganan navigasi
  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Helper functions untuk mini calendar
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const miniCalendarDays = Array.from(
    { length: getDaysInMonth(miniCalendarMonth) },
    (_, i) => i + 1
  );
  const firstDay = getFirstDayOfMonth(miniCalendarMonth);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      miniCalendarMonth.getFullYear(),
      miniCalendarMonth.getMonth(),
      day
    );
    setCurrentDate(selectedDate);
    setIsDatePickerOpen(false);
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(miniCalendarMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setMiniCalendarMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(miniCalendarMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setMiniCalendarMonth(newMonth);
  };

  // Check if a day is in the current week
  const isInCurrentWeek = (day: number) => {
    const testDate = new Date(
      miniCalendarMonth.getFullYear(),
      miniCalendarMonth.getMonth(),
      day
    );
    const dayOfWeek = testDate.getDay();
    const diff = testDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(testDate.getFullYear(), testDate.getMonth(), diff);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return currentDate >= weekStart && currentDate <= weekEnd;
  };

  const isSelectedDay = (day: number) => {
    return (
      day === currentDate.getDate() &&
      miniCalendarMonth.getMonth() === currentDate.getMonth() &&
      miniCalendarMonth.getFullYear() === currentDate.getFullYear()
    );
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Silakan masuk untuk melihat jadwal.</p>
      </div>
    );
  }

  const weekStartLabel = weekDates[0].toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const weekEndLabel = weekDates[6].toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-full flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Jadwal Minum Obat</h1>
            
            {/* Date Picker Trigger */}
            <div className="relative mt-3">
              <button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-100 transition font-medium"
              >
                <span>{weekStartLabel}</span>
                <span className="text-gray-500">-</span>
                <span>{weekEndLabel}</span>
                <ChevronRight
                  size={16}
                  className={`transition-transform ${
                    isDatePickerOpen ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Date Picker Dropdown */}
              {isDatePickerOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-50 w-80">
                  {/* Mini Calendar Header */}
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={handlePreviousMonth}
                      className="p-1 hover:bg-gray-100 rounded transition"
                    >
                      <ChevronLeft size={18} className="text-gray-600" />
                    </button>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {miniCalendarMonth.toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-gray-100 rounded transition"
                    >
                      <ChevronRight size={18} className="text-gray-600" />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                      (day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-semibold text-gray-500 py-2"
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {emptyDays.map((i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {miniCalendarDays.map((day) => {
                      const isSelected = isSelectedDay(day);
                      const isInWeek = isInCurrentWeek(day);

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateSelect(day)}
                          className={`py-2 text-sm font-medium rounded-lg transition ${
                            isSelected
                              ? "bg-teal-500 text-white"
                              : isInWeek
                                ? "bg-teal-50 text-teal-700"
                                : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setIsDatePickerOpen(false)}
                    className="w-full mt-4 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4 ml-6">
            <button
              onClick={handlePreviousWeek}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              <ChevronLeft size={18} />
              Minggu Sebelumnya
            </button>
            <button
              onClick={handleNextWeek}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              Minggu Berikutnya
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-full">
          {/* Status Memuat */}
          {loading && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
              <Loader
                size={32}
                className="text-teal-600 animate-spin mb-4"
              />
              <p className="text-gray-500">Memuat jadwal...</p>
            </div>
          )}

          {/* Status Error */}
          {error && (
            <div className="bg-white rounded-3xl shadow-sm border border-red-200 p-6 flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-red-600 flex-shrink-0 mt-1"
              />
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

          {/* Grid Kalender Mingguan */}
          {!loading && !error && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  {/* Header dengan nama hari */}
                  <div
                    className="grid gap-px bg-gray-100"
                    style={{
                      gridTemplateColumns: "100px repeat(7, 1fr)",
                    }}
                  >
                    {/* Sudut label waktu */}
                    <div className="bg-gray-100 p-4" />

                    {/* Hari dalam seminggu */}
                    {daysOfWeek.map((day, idx) => (
                      <div
                        key={day}
                        className="bg-white p-4 border-b border-gray-200 text-center"
                      >
                        <p className="text-sm font-semibold text-gray-900">
                          {day}
                        </p>
                        <p className="text-lg font-bold text-teal-600 mt-1">
                          {weekDates[idx].getDate()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {weekDates[idx].toLocaleDateString("id-ID", {
                            month: "short",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Slot waktu dan kartu obat */}
                  <div
                    className="grid gap-px bg-gray-100"
                    style={{
                      gridTemplateColumns: "100px repeat(7, 1fr)",
                    }}
                  >
                    {/* Baris grid untuk setiap slot waktu */}
                    {timeSlots.map((timeSlot) => (
                      <div key={timeSlot} className="contents">
                        {/* Label waktu */}
                        <div className="bg-white p-4 border-r border-gray-200 text-right">
                          <p className="text-xs font-semibold text-gray-600">
                            {timeSlot}
                          </p>
                        </div>

                        {/* Sel hari */}
                        {Array.from({ length: 7 }).map((_, dayIdx) => {
                          const daySchedules = getSchedulesForDayTime(
                            dayIdx,
                            timeSlot
                          );

                          return (
                            <div
                              key={`${timeSlot}-day${dayIdx}`}
                              className="bg-white p-2 border-r border-b border-gray-200 min-h-24 flex flex-col gap-2"
                            >
                              {daySchedules.map((schedule, scheduleIdx) => {
                                const colorIndex =
                                  scheduleIdx % colorPalette.length;
                                const { bg, border } =
                                  colorPalette[colorIndex];

                                return (
                                  <div
                                    key={schedule.id}
                                    className={`${bg} border-l-4 ${border} rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer`}
                                  >
                                    <p className="text-xs font-bold text-gray-900 line-clamp-2">
                                      {schedule.medicine_name}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {schedule.dosage}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1.5">
                                      {schedule.time}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status kosong */}
              {!loading && schedules.length === 0 && (
                <div className="text-center py-12 px-6">
                  <p className="text-gray-500 text-lg">
                    Tidak ada jadwal obat untuk minggu ini.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
