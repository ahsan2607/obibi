"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Loader, AlertCircle, Bell, Pill, TrendingUp, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/schedule/StatCard";
import { ScheduleCard } from "@/components/schedule/ScheduleCard";
import { CalendarPicker } from "@/components/schedule/CalendarPicker";

// Types
interface UISchedule {
  id: string;
  medicine_name: string;
  description?: string;
  dosage: string;
  time: string;
  date: string;
  dateISO: string;
  user_id: string;
}

interface MedicationScheduleWithMedication {
  id: string;
  patient_id: string;
  medication_id: string;
  scheduled_time: string;
  dosage_quantity: number;
  dosage_unit: string;
  start_date: string;
  end_date?: string;
  instructions?: string;
  medications: {
    name: string;
    description?: string;
  };
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

/**
 * MedicationSchedulesPage component that displays the user's medication schedule.
 *
 * Initial state: Fetches medication schedules from Supabase.
 * Final state: Renders stat cards, navigation tabs, and a calendar/list view of schedules.
 */
export default function MedicationSchedulesPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<UISchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"calendar" | "all" | "upcoming">("calendar");

  /**
   * Fetches medication schedules for the current user.
   */
  const fetchSchedules = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("medication_schedules")
        .select("*, medications(name)")
        .eq("patient_id", user.id)
        .order("start_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        setError("Failed to load schedules. Please try again.");
        return;
      }

      const mappedSchedules = ((data as unknown as MedicationScheduleWithMedication[]) || []).map((item) => {
        try {
          const [hours = "00", minutes = "00"] = item.scheduled_time?.toString().split(":") || [];
          const time = `${hours.padStart(2, "0")}.${minutes.padStart(2, "0")}`;

          const scheduleDate = item.start_date ? new Date(item.start_date) : null;
          const safeDate = scheduleDate && !isNaN(scheduleDate.getTime()) ? scheduleDate : new Date();
          const year = safeDate.getFullYear();
          const month = String(safeDate.getMonth() + 1).padStart(2, "0");
          const day = String(safeDate.getDate()).padStart(2, "0");
          const date = `${year}-${month}-${day}`;
          const dateISO = date;

          const medication = item.medications;
          const medicineName = medication?.name;
          const medicineDescription = medication?.description || "";

          return {
            id: String(item.id),
            medicine_name: medicineName || "Unknown Medication",
            description: medicineDescription,
            dosage: item.dosage_quantity ? `${item.dosage_quantity} ${item.dosage_unit || ""}` : "-",
            time,
            date,
            dateISO,
            user_id: String(item.patient_id || ""),
          };
        } catch (err) {
          console.error("Error mapping schedule item:", item, err);
          return {
            id: String(item.id) || "unknown",
            medicine_name: item.medications?.name || "Unknown Medication",
            description: "",
            dosage: "-",
            time: "00.00",
            date: "",
            dateISO: "",
            user_id: String(item.patient_id || ""),
          };
        }
      });

      setSchedules(mappedSchedules);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch schedules from Supabase
  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [fetchSchedules, user]);

  /**
   * Filters and returns schedules for the currently selected date.
   */
  const getSchedulesForSelectedDate = () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const dateISO = `${year}-${month}-${day}`;

    return schedules.filter((s) => s.dateISO === dateISO).sort((a, b) => a.time.localeCompare(b.time));
  };

  const stats = {
    active: schedules.length,
    today: getSchedulesForSelectedDate().length,
    compliance: 0,
    upcoming: schedules.filter((s) => {
      const today = new Date();
      const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      return s.dateISO >= todayISO;
    }).length,
  };

  const selectedDateFormatted = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentMonthFormatted = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedSchedules = getSchedulesForSelectedDate();

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-4 md:p-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Medication Schedule</h1>
          <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-2 rounded-lg mt-3 w-fit">
            <Bell size={16} />
            <p className="text-sm font-medium">Set reminders to help you take your medicine on time.</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Active Reminders"
            value={stats.active}
            icon={Bell}
            iconBgClass="bg-blue-100"
            iconColorClass="text-blue-600"
          />
          <StatCard
            label="Today's Dosage"
            value={stats.today}
            icon={Pill}
            iconBgClass="bg-green-100"
            iconColorClass="text-green-600"
          />
          <StatCard
            label="Compliance Rate"
            value={`${stats.compliance}%`}
            icon={TrendingUp}
            iconBgClass="bg-purple-100"
            iconColorClass="text-purple-600"
          />
          <StatCard
            label="Upcoming"
            value={stats.upcoming}
            icon={Clock}
            iconBgClass="bg-orange-100"
            iconColorClass="text-orange-600"
          />
        </div>
      </div>

      <div className="px-4 md:px-6 border-b border-gray-200 bg-white">
        <div className="flex gap-0">
          {(["calendar", "all", "upcoming"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base border-b-2 transition capitalize ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "calendar" ? "Calendar View" : tab === "all" ? "All Reminders" : "Upcoming"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 md:px-6 py-6">
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 flex flex-col items-center justify-center">
            <Loader size={32} className="text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 text-center">Loading schedule...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-4 md:p-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-1" />
            <div>
              <p className="font-medium text-red-900">{error}</p>
              <button onClick={fetchSchedules} className="text-sm text-red-600 hover:text-red-700 mt-2 underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CalendarPicker
                currentMonthFormatted={currentMonthFormatted}
                onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              />
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Schedule for {selectedDateFormatted}</h3>
                <div className="space-y-4">
                  {selectedSchedules.length > 0 ? (
                    selectedSchedules.map((schedule, idx) => {
                      const colorIndex = idx % colorPalette.length;
                      return (
                        <ScheduleCard
                          key={schedule.id}
                          medicineName={schedule.medicine_name}
                          description={schedule.description}
                          dosage={schedule.dosage}
                          time={schedule.time}
                          bgClass={colorPalette[colorIndex].bg}
                          borderClass={colorPalette[colorIndex].border}
                        />
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 py-8">No medications scheduled for this day.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
