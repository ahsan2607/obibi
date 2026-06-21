import React from "react";
import { AlertCircle, Loader, CheckCircle2, Circle } from "lucide-react";

export interface TodayMedication {
  id: string;
  schedule_id: string;
  medication_id?: string;
  name: string;
  dosage: string;
  time: string;
  uniqueHour: number;
  status: string;
}

interface TodayMedicationListProps {
  loading: boolean;
  medications: TodayMedication[];
  onMarkAsTaken: (med: TodayMedication) => void;
}

/**
 * Renders a list of medications to be taken today.
 * 
 * Initial state: Component receives loading status, a list of medications, and an action handler.
 * Final state: Returns a styled list of medication items with status indicators and action buttons.
 */
export const TodayMedicationList: React.FC<TodayMedicationListProps> = ({
  loading,
  medications,
  onMarkAsTaken,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Medications to take today:
        </h2>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : medications.length === 0 ? (
        <div className="text-center p-8 text-gray-500">No medications scheduled for today.</div>
      ) : (
        <div className="space-y-4">
          {medications.map((med) => (
            <div 
              key={med.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors gap-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{med.name}</h3>
                <div className="text-sm text-gray-500 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span>{med.dosage}</span>
                  <span className="hidden sm:inline text-gray-300">•</span>
                  <span className="text-blue-600 font-medium">{med.time}</span>
                </div>
              </div>
              
              <button 
                onClick={() => med.status !== 'taken' && onMarkAsTaken(med)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shrink-0
                  ${med.status === 'taken' 
                    ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow active:scale-95'}`}
              >
                {med.status === 'taken' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Taken
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    Mark as taken
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
