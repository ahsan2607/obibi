import React from "react";
import { Clock } from "lucide-react";

interface ScheduleCardProps {
  medicineName: string;
  dosage: string;
  time: string;
  bgClass: string;
  borderClass: string;
}

/**
 * Renders an individual schedule item card.
 * 
 * Initial state: Component receives medicine details and styling classes.
 * Final state: Returns a styled card with medication info and scheduled time.
 */
export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  medicineName,
  dosage,
  time,
  bgClass,
  borderClass,
}) => {
  return (
    <div className={`${bgClass} border-l-4 ${borderClass} rounded-lg p-4 shadow-sm`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-base font-bold text-gray-900">{medicineName}</p>
          <p className="text-sm text-gray-600 mt-1">{dosage}</p>
        </div>
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Active</div>
      </div>
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-gray-500" />
        <p className="text-sm text-gray-600">at {time}</p>
      </div>
    </div>
  );
};
