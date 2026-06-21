"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type FontSize = "normal" | "large" | "extra-large";
type ColorBlindMode = "none" | "grayscale" | "protanopia" | "deuteranopia" | "tritanopia";

interface AccessibilityContextType {
  fontSize: FontSize;
  highContrast: boolean;
  dyslexicFont: boolean;
  reducedMotion: boolean;
  enhancedFocus: boolean;
  colorBlindMode: ColorBlindMode;
  setFontSize: (size: FontSize) => void;
  setHighContrast: (val: boolean) => void;
  setDyslexicFont: (val: boolean) => void;
  setReducedMotion: (val: boolean) => void;
  setEnhancedFocus: (val: boolean) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      try {
        return (localStorage.getItem("accessibility_fontSize") as FontSize) || "normal";
      } catch (e) {
        console.error("Failed to read accessibility_fontSize from localStorage", e);
      }
    }
    return "normal";
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("accessibility_highContrast") === "true";
      } catch (e) {
        console.error("Failed to read accessibility_highContrast from localStorage", e);
      }
    }
    return false;
  });

  const [dyslexicFont, setDyslexicFontState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("accessibility_dyslexicFont") === "true";
      } catch (e) {
        console.error("Failed to read accessibility_dyslexicFont from localStorage", e);
      }
    }
    return false;
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("accessibility_reducedMotion") === "true";
      } catch (e) {
        console.error("Failed to read accessibility_reducedMotion from localStorage", e);
      }
    }
    return false;
  });

  const [enhancedFocus, setEnhancedFocusState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("accessibility_enhancedFocus") === "true";
      } catch (e) {
        console.error("Failed to read accessibility_enhancedFocus from localStorage", e);
      }
    }
    return false;
  });

  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>(() => {
    if (typeof window !== "undefined") {
      try {
        return (localStorage.getItem("accessibility_colorBlindMode") as ColorBlindMode) || "none";
      } catch (e) {
        console.error("Failed to read accessibility_colorBlindMode from localStorage", e);
      }
    }
    return "none";
  });


  // Update HTML/Body tags when settings change
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // 1. Font Size classes
    html.classList.remove("accessibility-font-large", "accessibility-font-xl");
    if (fontSize === "large") {
      html.classList.add("accessibility-font-large");
    } else if (fontSize === "extra-large") {
      html.classList.add("accessibility-font-xl");
    }

    // 2. High Contrast
    if (highContrast) {
      body.classList.add("accessibility-high-contrast");
    } else {
      body.classList.remove("accessibility-high-contrast");
    }

    // 3. Dyslexic Font
    if (dyslexicFont) {
      body.classList.add("accessibility-dyslexic");
    } else {
      body.classList.remove("accessibility-dyslexic");
    }

    // 4. Reduced Motion
    if (reducedMotion) {
      html.classList.add("accessibility-reduced-motion");
    } else {
      html.classList.remove("accessibility-reduced-motion");
    }

    // 5. Enhanced Focus
    if (enhancedFocus) {
      html.classList.add("accessibility-enhanced-focus");
    } else {
      html.classList.remove("accessibility-enhanced-focus");
    }

    // 6. Colorblind Mode
    html.classList.remove(
      "accessibility-colorblind-grayscale",
      "accessibility-colorblind-protanopia",
      "accessibility-colorblind-deuteranopia",
      "accessibility-colorblind-tritanopia"
    );
    if (colorBlindMode !== "none") {
      html.classList.add(`accessibility-colorblind-${colorBlindMode}`);
    }
  }, [fontSize, highContrast, dyslexicFont, reducedMotion, enhancedFocus, colorBlindMode]);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("accessibility_fontSize", size);
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    localStorage.setItem("accessibility_highContrast", String(val));
  };

  const setDyslexicFont = (val: boolean) => {
    setDyslexicFontState(val);
    localStorage.setItem("accessibility_dyslexicFont", String(val));
  };

  const setReducedMotion = (val: boolean) => {
    setReducedMotionState(val);
    localStorage.setItem("accessibility_reducedMotion", String(val));
  };

  const setEnhancedFocus = (val: boolean) => {
    setEnhancedFocusState(val);
    localStorage.setItem("accessibility_enhancedFocus", String(val));
  };

  const setColorBlindMode = (mode: ColorBlindMode) => {
    setColorBlindModeState(mode);
    localStorage.setItem("accessibility_colorBlindMode", mode);
  };

  const resetSettings = () => {
    setFontSize("normal");
    setHighContrast(false);
    setDyslexicFont(false);
    setReducedMotion(false);
    setEnhancedFocus(false);
    setColorBlindMode("none");
  };

  return (
    <AccessibilityContext.Provider
      value={{
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
      }}
    >
      {children}
      <ColorBlindFilters />
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};

function ColorBlindFilters() {
  return (
    <svg
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="protanopia">
          <feColorMatrix
            type="matrix"
            values="0.567, 0.433, 0,     0, 0
                    0.558, 0.442, 0,     0, 0
                    0,     0.242, 0.758, 0, 0
                    0,     0,     0,     1, 0"
          />
        </filter>
        <filter id="deuteranopia">
          <feColorMatrix
            type="matrix"
            values="0.625, 0.375, 0,   0, 0
                    0.7,   0.3,   0,   0, 0
                    0,     0.3,   0.7, 0, 0
                    0,     0,     0,   1, 0"
          />
        </filter>
        <filter id="tritanopia">
          <feColorMatrix
            type="matrix"
            values="0.95, 0.05,  0,     0, 0
                    0,    0.433, 0.567, 0, 0
                    0,    0.475, 0.525, 0, 0
                    0,    0,     0,     1, 0"
          />
        </filter>
      </defs>
    </svg>
  );
}
