import React from "react";

interface WelcomeBannerProps {
  name: string;
}

/**
 * Renders a welcome banner for the user on the dashboard.
 * 
 * Initial state: Component receives the user's name.
 * Final state: Returns a styled banner with a greeting message.
 */
export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ name }) => {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {name}! 👋</h1>
      <p className="text-gray-500 text-lg">Monitor your medication schedule and adherence to stay healthy and fit.</p>
    </div>
  );
};
