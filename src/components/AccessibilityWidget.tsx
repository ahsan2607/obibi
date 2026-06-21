"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAccessibility } from "./AccessibilityProvider";
import { Accessibility, X, RotateCcw } from "lucide-react";

export const AccessibilityWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const {
    fontSize,
    highContrast,
    dyslexicFont,
    reducedMotion,
    enhancedFocus,
    colorBlindMode,
    setFontSize,
    setHighContrast,
    setDyslexicFont,
    setReducedMotion,
    setEnhancedFocus,
    setColorBlindMode,
    resetSettings,
  } = useAccessibility();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] no-print" ref={widgetRef}>
      {/* Floating Action Button */}
      <button
        ref={triggerRef}
        onClick={toggleOpen}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300`}
        aria-label="Accessibility Settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Accessibility className="h-6 w-6" />}
      </button>

      {/* Accessibility Control Panel */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 w-80 max-w-[90vw] rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl transition-all duration-200 ease-out"
          role="dialog"
          aria-label="Accessibility Controls"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Accessibility</h2>
              <p className="text-xs text-gray-500">Customize your viewing experience</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              aria-label="Close Accessibility Controls"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Options */}
          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            
            {/* 1. Font Size Control */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Text Size</label>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">
                {(["normal", "large", "extra-large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`rounded-md py-1.5 text-xs font-medium capitalize transition-all ${
                      fontSize === size
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Dyslexia Font Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <label htmlFor="dyslexia-toggle" className="text-xs font-semibold text-gray-700 block cursor-pointer">
                  Dyslexic-Friendly Font
                </label>
                <span className="text-[10px] text-gray-500 block">
                  Easier reading for users with dyslexia
                </span>
              </div>
              <button
                id="dyslexia-toggle"
                onClick={() => setDyslexicFont(!dyslexicFont)}
                role="switch"
                aria-checked={dyslexicFont}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  dyslexicFont ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    dyslexicFont ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 3. High Contrast Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <label htmlFor="contrast-toggle" className="text-xs font-semibold text-gray-700 block cursor-pointer">
                  High Contrast Theme
                </label>
                <span className="text-[10px] text-gray-500 block">
                  High contrast colors for visual clarity
                </span>
              </div>
              <button
                id="contrast-toggle"
                onClick={() => setHighContrast(!highContrast)}
                role="switch"
                aria-checked={highContrast}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  highContrast ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    highContrast ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 4. Enhanced Keyboard Focus */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <label htmlFor="focus-toggle" className="text-xs font-semibold text-gray-700 block cursor-pointer">
                  Enhanced Focus Outline
                </label>
                <span className="text-[10px] text-gray-500 block">
                  Clear visual focus indicator for keyboards
                </span>
              </div>
              <button
                id="focus-toggle"
                onClick={() => setEnhancedFocus(!enhancedFocus)}
                role="switch"
                aria-checked={enhancedFocus}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enhancedFocus ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enhancedFocus ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 5. Reduced Motion Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <label htmlFor="motion-toggle" className="text-xs font-semibold text-gray-700 block cursor-pointer">
                  Reduced Motion
                </label>
                <span className="text-[10px] text-gray-500 block">
                  Turn off animations and page transitions
                </span>
              </div>
              <button
                id="motion-toggle"
                onClick={() => setReducedMotion(!reducedMotion)}
                role="switch"
                aria-checked={reducedMotion}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  reducedMotion ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    reducedMotion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 6. Colorblind Assistance Select */}
            <div className="space-y-2">
              <label htmlFor="colorblind-select" className="text-xs font-semibold text-gray-700 block">
                Color Blindness Filter
              </label>
              <select
                id="colorblind-select"
                value={colorBlindMode}
                onChange={(e) => setColorBlindMode(e.target.value as "none" | "grayscale" | "protanopia" | "deuteranopia" | "tritanopia")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="none">None (Standard Colors)</option>
                <option value="grayscale">Grayscale / Monochrome</option>
                <option value="protanopia">Red-Blind (Protanopia)</option>
                <option value="deuteranopia">Green-Blind (Deuteranopia)</option>
                <option value="tritanopia">Blue-Blind (Tritanopia)</option>
              </select>
            </div>

          </div>

          {/* Footer Reset */}
          <div className="mt-5 border-t border-gray-100 pt-3 flex justify-between items-center">
            <button
              onClick={resetSettings}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition focus:outline-none"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Settings
            </button>
            <span className="text-[10px] text-gray-400">obibi inclusive</span>
          </div>

        </div>
      )}
    </div>
  );
};
