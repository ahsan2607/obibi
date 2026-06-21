import React from "react";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  isCollapsed: boolean;
  onLogout: () => void;
}

/**
 * Renders a logout button for the sidebar.
 * 
 * Initial state: Component receives collapsed state and logout handler.
 * Final state: Returns a styled button with a logout icon and text if not collapsed.
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({ isCollapsed, onLogout }) => {
  return (
    <div className="p-4 border-t border-gray-200">
      <button
        onClick={onLogout}
        className={`flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition w-full ${isCollapsed ? "justify-center" : ""}`}
      >
        <LogOut size={20} />
        {!isCollapsed && <span>Logout</span>}
      </button>
    </div>
  );
};
