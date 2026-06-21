"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Medication, DrugInteraction } from "@/lib/types";
import { AlertTriangle, Plus, Trash2, ShieldAlert, Loader } from "lucide-react";

export default function DrugInteractionsPage() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [med1, setMed1] = useState("");
  const [med2, setMed2] = useState("");
  const [riskLevel, setRiskLevel] = useState("Moderate");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch medications
    const { data: medsData } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", user?.id);
    
    if (medsData) setMedications(medsData);

    // Fetch interactions
    const { data: interactionData } = await supabase
      .from("drug_interactions")
      .select("*")
      .eq("patient_id", user?.id)
      .order("created_at", { ascending: false });

    if (interactionData) setInteractions(interactionData);
    setLoading(false);
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !med1 || !med2 || !details) return;

    if (med1 === med2) {
      alert("Silakan pilih dua obat yang berbeda.");
      return;
    }

    setIsSubmitting(true);
    const newInteraction = {
      patient_id: user.id,
      medication_pair: [med1, med2],
      target_medication: med1,
      risk_level: riskLevel,
      finding_details: details
    };

    const { data, error } = await supabase
      .from("drug_interactions")
      .insert([newInteraction])
      .select()
      .single();

    if (error) {
      console.error("Error adding interaction:", error);
      alert("Gagal menyimpan interaksi obat.");
    } else if (data) {
      setInteractions([data as DrugInteraction, ...interactions]);
      setShowForm(false);
      setMed1("");
      setMed2("");
      setRiskLevel("Moderate");
      setDetails("");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan interaksi ini?")) return;
    const { error } = await supabase.from("drug_interactions").delete().eq("id", id);
    if (!error) {
      setInteractions(interactions.filter(i => i.id !== id));
    }
  };

  const getRiskColor = (level: string) => {
    switch(level.toLowerCase()) {
      case "low": return "bg-green-100 text-green-800 border-green-200";
      case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "severe": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!user) return null;
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="text-blue-600" />
              Interaksi Obat
            </h1>
            <p className="text-gray-500 mt-1">Catat dan pantau potensi interaksi antara obat-obatan Anda.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} /> Tambah Interaksi
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Catat Interaksi Baru</h2>
            <form onSubmit={handleAddInteraction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Obat Pertama (1)</label>
                  <select 
                    required 
                    value={med1} 
                    onChange={e => setMed1(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                  >
                    <option value="">-- Pilih Obat --</option>
                    {medications.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Obat Kedua (2)</label>
                  <select 
                    required 
                    value={med2} 
                    onChange={e => setMed2(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                  >
                    <option value="">-- Pilih Obat --</option>
                    {medications.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Risiko (Risk Level)</label>
                <select 
                  value={riskLevel} 
                  onChange={e => setRiskLevel(e.target.value)}
                  className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 bg-white"
                >
                  <option value="Low">Low (Rendah)</option>
                  <option value="Moderate">Moderate (Sedang)</option>
                  <option value="High">High (Tinggi)</option>
                  <option value="Severe">Severe (Sangat Bahaya)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Efek Samping & Detail Interaksi</label>
                <textarea 
                  required
                  rows={3}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                  placeholder="Deskripsikan efek samping atau risiko bila mengonsumsi kedua obat ini secara bersamaan..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Interaksi"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : interactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center text-center">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <ShieldAlert className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Belum ada interaksi obat</h3>
            <p className="text-gray-500 max-w-sm">
              Anda belum mencatat interaksi obat apapun. Gunakan tombol "Tambah Interaksi" untuk mencatat efek samping gabungan antar obat yang Anda ketahui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {interactions.map(interaction => {
              const meds = interaction.medication_pair || [interaction.target_medication, "Unknown"];
              const medA = meds[0] || interaction.target_medication;
              const medB = meds[1] || "Unknown";

              return (
                <div key={interaction.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row gap-4 relative group">
                  <div className="hidden sm:flex items-center justify-center p-3 bg-red-50 rounded-lg text-red-500 h-fit">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900">{medA}</span>
                      <span className="text-gray-400 text-sm">berinteraksi dengan</span>
                      <span className="font-bold text-gray-900">{medB}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ml-auto sm:ml-2 ${getRiskColor(interaction.risk_level)}`}>
                        {interaction.risk_level} Risk
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{interaction.finding_details}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(interaction.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 md:group-hover:opacity-100 transition-opacity"
                    title="Hapus catatan ini"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
