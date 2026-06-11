import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
  onClick: () => void;
}

/**
 * Renders a navigation link for the sidebar.
 * 
 * Initial state: Component receives href, icon, label, collapsed state, and click handler.
 * Final state: Returns a styled link with an icon and optional label.
 */
export const SidebarLink: React.FC<SidebarLinkProps> = ({
  href,
  icon: Icon,
  label,
  isCollapsed,
  onClick,
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition ${isCollapsed ? "justify-center" : ""}`}
    >
      <Icon size={20} />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );
};
