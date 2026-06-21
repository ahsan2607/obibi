import React, { useRef, useState, useEffect } from "react";
import { Mic, MicOff, Paperclip, Send, X } from "lucide-react";

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
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef(input);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = typeof navigator !== "undefined" ? (navigator.language || "id-ID") : "id-ID";

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            const prev = inputRef.current;
            const space = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
            setInput(prev + space + transcript);
          }
        };

        recognitionRef.current = rec;
      }
    }
  }, [setInput]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value so selecting the same file again triggers onChange
    e.target.value = "";
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
          placeholder={isListening ? "Listening... Speak now." : "Type your health questions here..."}
          className={`flex-1 border rounded-full px-4 py-3 focus:outline-none focus:ring-1 text-sm text-gray-800 bg-white transition-all duration-300 ${
            isListening
              ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/10 placeholder-red-400"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
          disabled={sending || isListening}
        />
        {isSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={sending}
            className={`rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? "bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}
        <button
          type="submit"
          disabled={sending || isListening || (!input.trim() && !selectedImage)}
          className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
