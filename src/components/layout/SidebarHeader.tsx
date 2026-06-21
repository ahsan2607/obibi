import React from "react";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  userName: string;
  avatarUrl?: string;
  onToggleCollapse: () => void;
}

/**
 * Renders the header of the sidebar, including the logo and user greeting.
 * 
 * Initial state: Component receives collapsed state, user name, avatar url, and collapse toggle handler.
 * Final state: Returns a styled header with dynamic user avatar and branding.
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  userName,
  avatarUrl,
  onToggleCollapse,
}) => {
  const PRESET_AVATARS = [
    { id: "ocean", class: "bg-gradient-to-tr from-blue-500 to-teal-400 text-white" },
    { id: "sunset", class: "bg-gradient-to-tr from-orange-500 to-amber-400 text-white" },
    { id: "berry", class: "bg-gradient-to-tr from-purple-600 to-pink-500 text-white" },
    { id: "forest", class: "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white" },
    { id: "midnight", class: "bg-gradient-to-tr from-slate-800 to-indigo-950 text-white" },
    { id: "rose", class: "bg-gradient-to-tr from-rose-500 to-red-400 text-white" },
  ];

  const initial = userName ? userName.charAt(0).toUpperCase() : "U";
  const activePreset = PRESET_AVATARS.find(p => p.id === avatarUrl);
  
  const renderAvatarMini = () => {
    if (avatarUrl && avatarUrl.startsWith("http")) {
      return (
        <div className="w-8 h-8 rounded-xl overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        </div>
      );
    }
    const bgClass = activePreset ? activePreset.class : "bg-blue-600 text-white";
    return (
      <div className={`w-8 h-8 ${bgClass} rounded-xl flex items-center justify-center font-bold text-sm shadow-sm select-none shrink-0`}>
        {initial}
      </div>
    );
  };

  return (
    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
      <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
        {renderAvatarMini()}
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
