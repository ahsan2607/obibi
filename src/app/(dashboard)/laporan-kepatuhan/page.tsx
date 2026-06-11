"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { AdherenceChart } from "@/components/compliance/AdherenceChart";
import { TodayMedicationList, TodayMedication } from "@/components/compliance/TodayMedicationList";

interface ChartData {
  date: string;
  percent: number;
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
  };
}

/**
 * ComplianceLogsPage component that displays adherence reports and today's medication list.
 * 
 * Initial state: Fetches compliance data and today's schedule from Supabase.
 * Final state: Renders adherence analysis chart and a list of medications to take today.
 */
export default function ComplianceLogsPage() {
  const { user } = useAuth();
  
  const [todayMedicines, setTodayMedicines] = useState<TodayMedication[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches compliance data and generates today's medication schedule.
   */
  const fetchComplianceData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch user's schedules
      const { data: scheduleData } = await supabase
        .from("medication_schedules")
        .select("*, medications(name)")
        .eq("patient_id", user?.id)
        .order("scheduled_time", { ascending: true });

      // Generate today's schedule based on frequency
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const generatedToday: TodayMedication[] = [];

      ((scheduleData as unknown as MedicationScheduleWithMedication[]) || []).forEach(s => {
        const hours = [parseInt(s.scheduled_time.split(":")[0]) || 8];
        const appliesToThisDay = true;

        const startDate = new Date(s.start_date);
        startDate.setHours(0, 0, 0, 0);
        
        if (today < startDate) return;

        if (appliesToThisDay) {
          hours.forEach(hr => {
            const timeLabel = hr < 11 ? "Morning" : hr <= 15 ? "Afternoon" : hr <= 18 ? "Evening" : "Night";
            generatedToday.push({
              id: `${s.id}-${hr}`,
              schedule_id: s.id,
              name: s.medications?.name || "Unknown",
              dosage: `${s.dosage_quantity} ${s.dosage_unit}`,
              time: `${timeLabel} (${String(hr).padStart(2, "0")}:00)`,
              uniqueHour: hr,
              status: "pending" 
            });
          });
        }
      });

      // Fetch compliance status for today
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: complianceData } = await supabase
        .from("compliance_logs")
        .select("*")
        .eq("patient_id", user?.id)
        .gte("logged_at", todayStr + "T00:00:00Z");

      if (complianceData && complianceData.length > 0) {
        complianceData.forEach(log => {
          const med = generatedToday.find(m => m.schedule_id === log.schedule_id);
          if (med && log.status === 'taken') med.status = "taken";
        });
      }

      setTodayMedicines(generatedToday.sort((a,b) => a.uniqueHour - b.uniqueHour));

      // Generate dummy chart data
      const mockChart = Array.from({length: 7}, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
          percent: Math.floor(Math.random() * 40) + 60 
        };
      });
      setChartData(mockChart);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchComplianceData();
    }
  }, [fetchComplianceData, user]);

  /**
   * Marks a medication as taken in the database and updates local state.
   * 
   * @param med - The medication to mark as taken.
   */
  const markAsTaken = async (med: TodayMedication) => {
    if (!user) return;
    try {
      // Optimistic update
      setTodayMedicines(prev => prev.map(m => m.id === med.id ? { ...m, status: "taken" } : m));

      await supabase
        .from("compliance_logs")
        .insert([{
          patient_id: user.id,
          schedule_id: med.schedule_id,
          status: 'taken',
          logged_at: new Date().toISOString()
        }]);
        
    } catch (err) {
      console.error("Failed to mark as taken", err);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Compliance Reports</h1>
          <p className="text-gray-500 mt-2">Monitor your daily medication adherence levels.</p>
        </div>

        <AdherenceChart data={chartData} />

        <TodayMedicationList 
          loading={loading} 
          medications={todayMedicines} 
          onMarkAsTaken={markAsTaken} 
        />

      </div>
    </div>
  );
}
