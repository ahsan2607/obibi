import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
}

/**
 * Renders a statistical card for the medication schedule page.
 * 
 * Initial state: Component receives label, value, icon, and styling classes.
 * Final state: Returns a styled card displaying the stat value and icon.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  iconBgClass,
  iconColorClass,
}) => {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${iconBgClass} p-3 rounded-full`}>
          <Icon size={24} className={iconColorClass} />
        </div>
      </div>
    </div>
  );
};
