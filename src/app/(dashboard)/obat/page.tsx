"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Obat } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function ObatPage() {
  const { user } = useAuth();
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [namaObat, setNamaObat] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [dosis, setDosis] = useState("");
  const [efekSamping, setEfekSamping] = useState("");

  useEffect(() => {
    fetchObat();
  }, []);

  const fetchObat = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("obat")
      .select("*")
      .order("obat_id", { ascending: false });

    if (error) {
      console.error("Failed to fetch obat", error);
    } else {
      setObatList(data || []);
    }
    setLoading(false);
  };

  const handleAddObat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaObat || !keterangan || !dosis) return;

    const newObat = {
      nama_obat: namaObat,
      keterangan,
      dosis,
      efek_samping: efekSamping,
    };

    const { data, error } = await supabase
      .from("obat")
      .insert([newObat])
      .select()
      .single();

    if (error) {
      alert("Failed to add medicine");
      console.error(error);
      return;
    }

    if (data) {
      setObatList([data as Obat, ...obatList]);
    }
    
    setShowForm(false);
    setNamaObat("");
    setKeterangan("");
    setDosis("");
    setEfekSamping("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    const { error } = await supabase.from("obat").delete().eq("obat_id", id);
    
    if (error) {
      alert("Failed to delete");
      console.error(error);
      return;
    }

    setObatList(obatList.filter((o) => o.obat_id !== id));
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-white text-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Medicine List (Obat)</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Tambah Obat
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddObat} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Obat</label>
              <input
                required
                type="text"
                value={namaObat}
                onChange={(e) => setNamaObat(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g. Paracetamol"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <input
                required
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g. Demam, Sakit Kepala"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
              <input
                required
                type="text"
                value={dosis}
                onChange={(e) => setDosis(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g. 3x Sehari"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Efek Samping</label>
              <input
                type="text"
                value={efekSamping}
                onChange={(e) => setEfekSamping(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g. Mengantuk"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Simpan
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading medicines...</div>
        ) : obatList.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            Belum ada obat yang dicatat.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obatList.map((obat) => (
              <div key={obat.obat_id} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition relative group">
                <button
                  onClick={() => handleDelete(obat.obat_id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={18} />
                </button>
                <h3 className="font-bold text-lg text-blue-900 mb-1">{obat.nama_obat}</h3>
                <div className="text-sm text-gray-500 mb-3">{obat.keterangan}</div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dosis:</span>
                    <span className="font-medium text-gray-800">{obat.dosis}</span>
                  </div>
                  {obat.efek_samping && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Efek Samping:</span>
                      <span className="font-medium text-gray-800">{obat.efek_samping}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
