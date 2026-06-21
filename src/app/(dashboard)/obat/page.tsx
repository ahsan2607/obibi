"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Medication } from "@/lib/types";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { MedicationForm } from "@/components/medication/MedicationForm";
import { MedicationCard } from "@/components/medication/MedicationCard";

/**
 * MedicationsPage component that manages the user's medication list.
 * 
 * Initial state: Fetches the medication list for the logged-in user.
 * Final state: Renders a list of MedicationCard components and a MedicationForm for adding new ones.
 */
export default function MedicationsPage() {
  const { user } = useAuth();
  const [medicationList, setMedicationList] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sideEffects, setSideEffects] = useState("");
  const [form, setForm] = useState("tablet");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [stockUnit, setStockUnit] = useState("piece");
  
  // New Structured Dosage State
  const [dosisAmount, setDosisAmount] = useState("1");
  const [freqCount, setFreqCount] = useState<number>(3);
  const [freqRange, setFreqRange] = useState("daily");
  
  const [createSchedule, setCreateSchedule] = useState(false);
  // Default scheduled times based on freqCount
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(["08:00", "13:00", "20:00"]);
  const [endDate, setEndDate] = useState("");

  /**
   * Fetches medications from the Supabase database.
   */
  const fetchMedications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch medications", error);
    } else {
      setMedicationList(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchMedications();
    }
  }, [user]);

  // Adjust scheduledTimes array size when freqCount changes
  useEffect(() => {
    setScheduledTimes(prev => {
      if (freqCount === prev.length) return prev;
      const newTimes = [...prev];
      if (freqCount > prev.length) {
        // Add empty slots
        for (let i = prev.length; i < freqCount; i++) newTimes.push("");
      } else {
        // Trim slots
        newTimes.splice(freqCount);
      }
      return newTimes;
    });
  }, [freqCount]);

  const handleTimeChange = (index: number, val: string) => {
    const newTimes = [...scheduledTimes];
    newTimes[index] = val;
    setScheduledTimes(newTimes);
  };
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !user) return;

    // Convert structured dosage to string for medications table
    const rangeText = freqRange === 'daily' ? 'Hari' : freqRange === 'weekly' ? 'Minggu' : 'Bulan';
    const finalDosageString = `${freqCount}x Per ${rangeText} (${dosisAmount} ${stockUnit})`;

    const newMedication = {
      patient_id: user.id,
      name,
      description,
      dosage: finalDosageString,
      side_effects: sideEffects,
      form,
      stock_quantity: parseFloat(stockQuantity),
      stock_unit: stockUnit,
      is_active: true
    };

    const { data, error } = await supabase
      .from("medications")
      .insert([newMedication])
      .select()
      .single();

    if (error) {
      alert("Failed to add medication");
      console.error(error);
      return;
    }

    if (data) {
      setMedicationList([data as Medication, ...medicationList]);

      if (createSchedule) {
        // Create a schedule for each configured time
        const schedulePromises = scheduledTimes.map(time => {
          if (!time) return null;
          
          return supabase.from("medication_schedules").insert([{
            patient_id: user.id,
            medication_id: data.id,
            scheduled_time: time,
            dosis: `${dosisAmount} ${stockUnit}`,
            start_date: new Date().toISOString().split("T")[0],
            end_date: endDate || null,
            instructions: freqRange // Store 'daily', 'weekly', 'monthly' for laporan-kepatuhan
          }]);
        });

        const results = await Promise.all(schedulePromises.filter(Boolean));
        const hasError = results.some((r: any) => r?.error);
        if (hasError) {
          console.error("Failed to add some schedules", results);
        }
      }
    }
    
    // Reset form
    setShowForm(false);
    resetForm();
  };

  /**
   * Resets the medication form fields.
   */
  const resetForm = () => {
    setName("");
    setDescription("");
    setDosisAmount("1");
    setFreqCount(3);
    setFreqRange("daily");
    setSideEffects("");
    setForm("tablet");
    setStockQuantity("0");
    setStockUnit("piece");
    setCreateSchedule(false);
    setScheduledTimes(["08:00", "13:00", "20:00"]);
    setEndDate("");
  };

  /**
   * Handles deleting a medication.
   * 
   * @param id - The ID of the medication to delete.
   */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication? This will also delete all its schedules, logs, and reminders.")) return;

    try {
      // 1. Fetch schedules related to this medication
      const { data: schedules, error: fetchError } = await supabase
        .from("medication_schedules")
        .select("id")
        .eq("medication_id", id);

      if (fetchError) throw fetchError;

      const scheduleIds = schedules?.map((s) => s.id) || [];

      if (scheduleIds.length > 0) {
        // 2. Delete reminders referencing these schedules
        const { error: reminderError } = await supabase
          .from("reminder")
          .delete()
          .in("jadwal_id", scheduleIds);
        if (reminderError) throw reminderError;

        // 3. Delete compliance logs referencing these schedules
        const { error: logsError } = await supabase
          .from("compliance_logs")
          .delete()
          .in("schedule_id", scheduleIds);
        if (logsError) throw logsError;

        // 4. Delete medication schedules
        const { error: schedulesError } = await supabase
          .from("medication_schedules")
          .delete()
          .eq("medication_id", id);
        if (schedulesError) throw schedulesError;
      }

      // 5. Delete medication
      const { error: medError } = await supabase
        .from("medications")
        .delete()
        .eq("id", id);
      if (medError) throw medError;

      setMedicationList(medicationList.filter((m) => m.id !== id));
    } catch (err) {
      alert("Failed to delete medication");
      console.error("Delete cascade failed:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-white text-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Medication List</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Add Medication
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddMedication} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                placeholder="e.g. Paracetamol"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                required
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                placeholder="e.g. Fever, Headache"
              />
            </div>
            
            {/* New Structured Dosage Form */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Per Minum (Dose)</label>
                <div className="flex gap-2">
                  <input
                    required
                    type="number"
                    step="0.1"
                    min="0"
                    value={dosisAmount}
                    onChange={(e) => setDosisAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  <select
                    value={stockUnit}
                    onChange={(e) => setStockUnit(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                  >
                    <option value="piece">Piece (Buah/Butir)</option>
                    <option value="ml">ML (MiliLiter)</option>
                    <option value="mg">MG (MiliGram)</option>
                    <option value="tetes">Drop (Tetes)</option>
                    <option value="puff">Puff (Semprot)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Berapa Kali (Frequency)</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="24"
                  value={freqCount}
                  onChange={(e) => setFreqCount(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rentang Waktu (Period)</label>
                <select
                  value={freqRange}
                  onChange={(e) => setFreqRange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="daily">Per Hari (Daily)</option>
                  <option value="weekly">Per Minggu (Weekly)</option>
                  <option value="monthly">Per Bulan (Monthly)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
              <input
                type="text"
                value={sideEffects}
                onChange={(e) => setSideEffects(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                placeholder="e.g. Drowsiness"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Form (Bentuk Obat)</label>
              <select
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="tablet">Tablet</option>
                <option value="capsule">Kapsul (Capsule)</option>
                <option value="liquid">Cair (Liquid)</option>
                <option value="liquid">Sirup (Syrup)</option>
                <option value="drops">Tetes (Drops)</option>
                <option value="cream">Salep (Cream)</option>
                <option value="injection">Injeksi (Injection)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <div className="flex gap-2 w-full md:w-1/2">
                <input
                  type="number"
                  step="0.01"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                />
                <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                  {stockUnit}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createSchedule}
                  onChange={(e) => setCreateSchedule(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-800">Tambahkan ke Jadwal Pengingat (Add to Schedule)</span>
              </label>
              
              {createSchedule && (
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Waktu Minum ({freqCount}x {freqRange === 'daily' ? 'Sehari' : freqRange === 'weekly' ? 'Seminggu' : 'Sebulan'})
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {scheduledTimes.map((time, idx) => (
                        <div key={idx} className="flex flex-col">
                          <span className="text-xs text-gray-500 mb-1">Waktu {idx + 1}</span>
                          <input
                            required={createSchedule}
                            type="time"
                            value={time}
                            onChange={(e) => handleTimeChange(idx, e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Berakhir (End Date)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Biarkan kosong jika tidak ada batas waktu.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save Medication
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading medications...</div>
        ) : medicationList.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            No medications recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicationList.map((med) => (
              <MedicationCard key={med.id} medication={med} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
