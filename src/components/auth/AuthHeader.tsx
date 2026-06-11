import React from "react";
import { Pill } from "lucide-react";

interface AuthHeaderProps {
  isLogin: boolean;
}

/**
 * Renders the header for the authentication page, including the app icon and title.
 * 
 * Initial state: Component receives isLogin boolean.
 * Final state: Returns JSX for the header with appropriate text based on isLogin.
 */
export const AuthHeader: React.FC<AuthHeaderProps> = ({ isLogin }) => {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex justify-center text-blue-600">
        <Pill size={48} />
      </div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Health Assistant</h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        {isLogin ? "Sign in to your account" : "Register a new patient account"}
      </p>
    </div>
  );
};
