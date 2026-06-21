"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { AdherenceChart } from "@/components/compliance/AdherenceChart";
import { TodayMedicationList, TodayMedication } from "@/components/compliance/TodayMedicationList";
import { Printer } from "lucide-react";

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
      
      // 1. Fetch user's schedules
      const { data: scheduleData } = await supabase
        .from("medication_schedules")
        .select("*, medications(name)")
        .eq("patient_id", user?.id)
        .order("scheduled_time", { ascending: true });

      // Helper to get local date string YYYY-MM-DD
      const toLocalDateString = (d: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      };

      // 2. Fetch compliance logs for the last 7 days
      const today = new Date();
      const todayStr = toLocalDateString(today);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0); // local midnight
      
      const { data: complianceData } = await supabase
        .from("compliance_logs")
        .select("*")
        .eq("patient_id", user?.id)
        .gte("logged_at", sevenDaysAgo.toISOString());

      // Helper to check if a schedule applies to a specific date
      const appliesToDate = (s: any, d: Date) => {
        // Parse "YYYY-MM-DD" local safely
        const startParts = s.start_date.split("-");
        const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
        
        const compareDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        
        if (compareDate < startDate) return false;
        
        if (s.end_date) {
            const endParts = s.end_date.split("-");
            const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
            if (compareDate > endDate) return false;
        }

        const freq = s.instructions || 'daily';
        if (freq === 'weekly') {
          const diffTime = Math.abs(compareDate.getTime() - startDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return (diffDays % 7 === 0);
        } else if (freq === 'monthly') {
          return (compareDate.getDate() === startDate.getDate());
        }
        return true; // default to daily
      };

      // 3. Generate today's medicines list
      const generatedToday: any[] = [];
      (scheduleData || []).forEach((s: any) => {
        if (appliesToDate(s, today)) {
          const hr = parseInt(s.scheduled_time.split(":")[0]) || 8;
          const timeLabel = hr < 11 ? "Morning" : hr <= 15 ? "Afternoon" : hr <= 18 ? "Evening" : "Night";
          
          generatedToday.push({
            id: `${s.id}-${hr}`, // using composite id for uniqueness per time
            schedule_id: s.id,
            medication_id: s.medication_id,
            name: s.medications?.name || "Unknown",
            dosage: `${s.dosage_quantity || ''} ${s.dosage_unit || ''}`.trim() || s.dosis || '-',
            time: `${timeLabel} (${s.scheduled_time.substring(0, 5)})`,
            uniqueHour: hr,
            status: "pending" 
          });
        }
      });

      // Update today's status based on complianceData
      if (complianceData) {
        complianceData.forEach((log: any) => {
          const logDate = toLocalDateString(new Date(log.logged_at));
          if (logDate === todayStr) {
            const med = generatedToday.find(m => m.schedule_id === log.schedule_id);
            if (med && log.status === 'taken') med.status = "taken";
          }
        });
      }
      setTodayMedicines(generatedToday.sort((a,b) => a.uniqueHour - b.uniqueHour));

      // 4. Generate Chart Data based on actual compliance
      const actualChartData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = toLocalDateString(d);
        
        let scheduledCount = 0;
        (scheduleData || []).forEach((s: any) => {
           if (appliesToDate(s, d)) scheduledCount++;
        });

        let takenCount = 0;
        if (complianceData) {
            takenCount = complianceData.filter((log: any) => {
               const logDate = toLocalDateString(new Date(log.logged_at));
               return logDate === dStr && log.status === 'taken';
            }).length;
        }

        const safePercent = scheduledCount === 0 ? 0 : Math.min(100, Math.round((takenCount / scheduledCount) * 100));

        actualChartData.push({
          date: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
          percent: safePercent
        });
      }
      setChartData(actualChartData);

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

      const { error: logError } = await supabase
        .from("compliance_logs")
        .insert([{
          patient_id: user.id,
          schedule_id: med.schedule_id,
          status: 'taken',
          logged_at: new Date().toISOString()
        }]);

      if (logError) {
         console.error("Failed to insert log", logError);
      }

      if (med.medication_id) {
        // Decrement stock
        const { data: medData } = await supabase
          .from("medications")
          .select("stock_quantity")
          .eq("id", med.medication_id)
          .single();
          
        if (medData && medData.stock_quantity > 0) {
          await supabase
            .from("medications")
            .update({ stock_quantity: medData.stock_quantity - 1 })
            .eq("id", med.medication_id);
        }
      }
      
      // Refresh the graph data
      fetchComplianceData();
        
    } catch (err) {
      console.error("Failed to mark as taken", err);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Compliance Reports</h1>
            <p className="text-gray-500 mt-2">Monitor your daily medication adherence levels.</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium text-sm self-start sm:self-auto no-print"
          >
            <Printer size={16} /> Print to PDF
          </button>
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
