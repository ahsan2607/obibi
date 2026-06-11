import React from "react";
import { Menu, X } from "lucide-react";

interface MobileHeaderProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

/**
 * Renders the header visible on mobile devices, including the hamburger menu button.
 * 
 * Initial state: Component receives the sidebar open state and toggle handler.
 * Final state: Returns a styled header for mobile navigation.
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <div className="lg:hidden sticky top-0 z-10 flex p-4 shadow-sm bg-white border-b border-gray-200 items-center gap-4">
      <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <span className="font-bold text-gray-800">Obibi</span>
    </div>
  );
};
