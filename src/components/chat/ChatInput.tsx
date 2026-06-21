import React, { useRef } from "react";
import { Paperclip, Send, X } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  selectedImage: string | null;
  setSelectedImage: (v: string | null) => void;
  sending: boolean;
  handleSend: (e: React.FormEvent) => void;
}

/**
 * Renders the chat input area, including image attachment and message sending.
 * 
 * Initial state: Component receives input value, image state, sending status, and handlers.
 * Final state: Returns a styled input form with attachment and send buttons.
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  selectedImage,
  setSelectedImage,
  sending,
  handleSend,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {selectedImage && (
        <div className="max-w-4xl mx-auto mb-2 relative inline-block">
          <img src={selectedImage} alt="Preview" className="h-20 rounded-lg object-cover border border-gray-200" />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 hover:text-blue-600 p-2"
        >
          <Paperclip size={24} />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your health questions here..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-800 bg-white"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || (!input.trim() && !selectedImage)}
          className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
