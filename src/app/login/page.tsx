"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthForm } from "@/components/auth/AuthForm";

/**
 * LoginPage component that handles user authentication (login and registration).
 * 
 * Initial state: Manages isLogin, email, password, name, error, and isLoading states.
 * Final state: Renders the AuthHeader and AuthForm components, and handles navigation after successful authentication.
 */
export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * Handles the form submission for both login and registration.
   * 
   * @param e - The form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name },
          },
        });

        if (authError) throw authError;

        if (authData.user && !authData.session) {
          alert("Please check your email for the confirmation link!");
          return;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Authentication failed.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <AuthHeader isLogin={isLogin} />
      <AuthForm
        isLogin={isLogin}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        name={name}
        setName={setName}
        error={error}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
        toggleMode={() => setIsLogin(!isLogin)}
      />
    </div>
  );
}
