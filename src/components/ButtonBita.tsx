"use client";

import React from "react";

/**
 * A simple button component labeled 'Uwaw'.
 * 
 * Initial state: None.
 * Final state: Returns a styled button with the text 'Uwaw'.
 */
export const ButtonBita: React.FC = () => {
  return (
    <button
      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
    >
       Uwaw
    </button>
  );
};

export default ButtonBita;
