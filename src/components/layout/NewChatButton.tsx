import React from "react";
import { Plus } from "lucide-react";

interface NewChatButtonProps {
  isCollapsed: boolean;
  onClick: () => void;
}

/**
 * Renders a button to start a new chat session.
 * 
 * Initial state: Component receives collapsed state and click handler.
 * Final state: Returns a styled button with a 'plus' icon and 'New Chat' text if not collapsed.
 */
export const NewChatButton: React.FC<NewChatButtonProps> = ({ isCollapsed, onClick }) => {
  return (
    <div className="p-4">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition font-medium"
      >
        <Plus size={20} />
        {!isCollapsed && <span>New Chat</span>}
      </button>
    </div>
  );
};
