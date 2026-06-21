import React from "react";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  userName: string;
  onToggleCollapse: () => void;
}

/**
 * Renders the header of the sidebar, including the logo and user greeting.
 * 
 * Initial state: Component receives collapsed state, user name, and collapse toggle handler.
 * Final state: Returns a styled header with app branding and user info.
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  userName,
  onToggleCollapse,
}) => {
  return (
    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
      <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">H</span>
        </div>
        {!isCollapsed && (
          <div>
            <h2 className="font-semibold text-lg text-blue-600">Obibi</h2>
            <p className="text-sm text-gray-500 truncate">Hi, {userName}</p>
          </div>
        )}
      </div>

      <button
        onClick={onToggleCollapse}
        className="hidden lg:block p-1.5 hover:bg-gray-200 rounded-lg transition"
      >
        {isCollapsed ? "→" : "←"}
      </button>
    </div>
  );
};
