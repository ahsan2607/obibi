import React from "react";

interface MedicationFormProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  dosage: string;
  setDosage: (v: string) => void;
  sideEffects: string;
  setSideEffects: (v: string) => void;
  form: string;
  setForm: (v: string) => void;
  stockQuantity: string;
  setStockQuantity: (v: string) => void;
  stockUnit: string;
  setStockUnit: (v: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

/**
 * Renders a form to add or edit medication details.
 * 
 * Initial state: Component receives form field values and update handlers.
 * Final state: Returns a styled form with input fields for medication information.
 */
export const MedicationForm: React.FC<MedicationFormProps> = ({
  name,
  setName,
  description,
  setDescription,
  dosage,
  setDosage,
  sideEffects,
  setSideEffects,
  form,
  setForm,
  stockQuantity,
  setStockQuantity,
  stockUnit,
  setStockUnit,
  handleSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
        <input
          required
          type="text"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
          placeholder="e.g. 3x Daily"
        />
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
        <select
          value={form}
          onChange={(e) => setForm(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
        >
          <option value="tablet">Tablet</option>
          <option value="capsule">Capsule</option>
          <option value="liquid">Liquid</option>
          <option value="drops">Drops</option>
          <option value="cream">Cream</option>
          <option value="injection">Injection</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
          <input
            type="number"
            step="0.01"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <select
            value={stockUnit}
            onChange={(e) => setStockUnit(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="piece">Piece</option>
            <option value="ml">ML</option>
            <option value="mg">MG</option>
            <option value="drop">Drop</option>
            <option value="puff">Puff</option>
          </select>
        </div>
      </div>
      <div className="md:col-span-2 flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
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
  );
};
