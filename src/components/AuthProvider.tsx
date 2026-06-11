"use client";

import { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Patient } from "@/lib/types";
import { User as SupabaseUser, Subscription } from "@supabase/supabase-js";

type AuthContextType = {
  user: Patient | null;
  loading: boolean;
  login: (userData: Patient) => void; // kept for backward compatibility if needed
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that manages the authentication state of the application.
 * 
 * Initial state: Sets up Supabase auth listener and checks for existing session.
 * Final state: Provides the authentication context (user, loading, logout) to all children.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  /**
   * Fetches full patient data from the 'patients' table based on the Supabase user ID.
   * 
   * @param supabaseUser - The Supabase user object.
   */
  const loadPatientData = useCallback(
    async (supabaseUser: SupabaseUser) => {
      try {
        const { data: patientData, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", supabaseUser.id)
          .single();

        if (error) {
          console.error("Error fetching patient data:", error);
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "",
          }); 
        } else {
          setUser(patientData as Patient); 
        }
      } catch (err) {
        console.error("Unexpected error loading patient data:", err);
        setUser(null);
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    let authSubscription: Subscription | null = null;

    /**
     * Initializes authentication by checking the current session and subscribing to auth state changes.
     */
    const initializeAuth = async () => {
      if (initRef.current) return;
      initRef.current = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (session) {
          await loadPatientData(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn("Ignored Auth getSession error", err);
      } finally {
        if (mounted) setLoading(false);
      }

      if (!mounted) return;
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (event === "INITIAL_SESSION") return; 

        if (session?.user) {
          await loadPatientData(session.user);
        } else {
          setUser(null);
        }
      });
      authSubscription = subscription;
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [loadPatientData]);

  /**
   * Manually sets the user data in the context.
   * 
   * @param userData - The patient data to set.
   */
  const login = (userData: Patient) => {
    setUser(userData);
  };

  /**
   * Signs the user out of Supabase and clears the user state.
   */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access the authentication context.
 * 
 * @returns The AuthContextType object.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
