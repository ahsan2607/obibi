import React from "react";

interface AuthFormProps {
  isLogin: boolean;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  error: string;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  toggleMode: () => void;
}

/**
 * Renders the authentication form for login and registration.
 * 
 * Initial state: Component receives form fields, error message, loading state, and handlers.
 * Final state: Returns a styled form with input fields and action buttons.
 */
export const AuthForm: React.FC<AuthFormProps> = ({
  isLogin,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  error,
  isLoading,
  handleSubmit,
  toggleMode,
}) => {
  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isLoading ? "Processing..." : isLogin ? "Sign in" : "Register"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button onClick={toggleMode} className="text-sm text-blue-600 hover:text-blue-500">
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
