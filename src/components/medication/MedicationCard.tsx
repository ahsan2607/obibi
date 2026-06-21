import React from "react";
import { Trash2 } from "lucide-react";
import { Medication } from "@/lib/types";

interface MedicationCardProps {
  medication: Medication;
  onDelete: (id: string) => void;
}

/**
 * Renders an individual medication card with details and a delete action.
 * 
 * Initial state: Component receives a Medication object and a delete handler.
 * Final state: Returns a styled card displaying medication info and a trash icon button.
 */
export const MedicationCard: React.FC<MedicationCardProps> = ({ medication, onDelete }) => {
  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition relative group">
      <button
        onClick={() => onDelete(medication.id)}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
      >
        <Trash2 size={18} />
      </button>
      <h3 className="font-bold text-lg text-blue-900 mb-1">{medication.name}</h3>
      <div className="text-sm text-gray-500 mb-3">{medication.description}</div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Dosage:</span>
          <span className="font-medium text-gray-800">{medication.dosage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Form:</span>
          <span className="font-medium text-gray-800 capitalize">{medication.form}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Stock:</span>
          {medication.stock_quantity <= 0 ? (
            <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs">Habis</span>
          ) : (
            <span className="font-medium text-gray-800">{medication.stock_quantity} {medication.stock_unit}</span>
          )}
        </div>
        {medication.side_effects && (
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-gray-500 text-xs uppercase font-semibold">Side Effects:</span>
            <span className="text-gray-700 italic">{medication.side_effects}</span>
          </div>
        )}
      </div>
    </div>
  );
};
