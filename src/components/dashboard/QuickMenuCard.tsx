import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface QuickMenuCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  iconColorClass: string;
  iconBgClass: string;
  hoverIconBgClass: string;
}

/**
 * Renders a quick access card for dashboard navigation.
 * 
 * Initial state: Component receives href, icon, title, description, and styling classes.
 * Final state: Returns a linked card with an icon and text.
 */
export const QuickMenuCard: React.FC<QuickMenuCardProps> = ({
  href,
  icon: Icon,
  title,
  description,
  iconColorClass,
  iconBgClass,
  hoverIconBgClass,
}) => {
  return (
    <Link href={href} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition group">
      <div className={`w-14 h-14 ${iconBgClass} ${iconColorClass} rounded-2xl flex items-center justify-center mb-4 group-hover:${hoverIconBgClass} group-hover:text-white transition`}>
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </Link>
  );
};
