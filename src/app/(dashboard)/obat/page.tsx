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
  const [dosage, setDosage] = useState("");
  const [sideEffects, setSideEffects] = useState("");
  const [form, setForm] = useState("tablet");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [stockUnit, setStockUnit] = useState("piece");

  useEffect(() => {
    if (user) {
      fetchMedications();
    }
  }, [user]);

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

  /**
   * Handles adding a new medication.
   * 
   * @param e - The form event.
   */
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !dosage || !user) return;

    const newMedication = {
      patient_id: user.id,
      name,
      description,
      dosage,
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
    }
    
    setShowForm(false);
    resetForm();
  };

  /**
   * Resets the medication form fields.
   */
  const resetForm = () => {
    setName("");
    setDescription("");
    setDosage("");
    setSideEffects("");
    setForm("tablet");
    setStockQuantity("0");
    setStockUnit("piece");
  };

  /**
   * Handles deleting a medication.
   * 
   * @param id - The ID of the medication to delete.
   */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication?")) return;

    const { error } = await supabase.from("medications").delete().eq("id", id);
    
    if (error) {
      alert("Failed to delete");
      console.error(error);
      return;
    }

    setMedicationList(medicationList.filter((m) => m.id !== id));
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
          <MedicationForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            dosage={dosage}
            setDosage={setDosage}
            sideEffects={sideEffects}
            setSideEffects={setSideEffects}
            form={form}
            setForm={setForm}
            stockQuantity={stockQuantity}
            setStockQuantity={setStockQuantity}
            stockUnit={stockUnit}
            setStockUnit={setStockUnit}
            handleSubmit={handleAddMedication}
            onCancel={() => setShowForm(false)}
          />
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
