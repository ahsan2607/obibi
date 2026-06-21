"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);
  const userRef = useRef<Patient | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
        
        if (session?.user) {
          setSessionUser(session.user);
        } else {
          setSessionUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Ignored Auth getSession error", err);
        if (mounted) setLoading(false);
      }

      if (!mounted) return;
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
        if (!mounted) return;
        if (event === "INITIAL_SESSION") return; 

        if (session?.user) {
          setSessionUser((prev) => {
            if (prev?.id === session.user.id) {
              return prev; // Return the exact same reference to prevent re-renders & downstream effects
            }
            return session.user;
          });
        } else {
          setSessionUser(null);
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
  }, []);

  // Separate effect to load patient data when session user changes,
  // preventing auth listener locks/deadlocks.
  useEffect(() => {
    let active = true;

    const fetchPatient = async () => {
      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Only set loading to true if we haven't loaded the user yet or the user ID changed
      if (!userRef.current || userRef.current.id !== sessionUser.id) {
        setLoading(true);
      }
      try {
        const { data: patientData, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", sessionUser.id)
          .single();

        if (!active) return;

        if (error) {
          console.error("Error fetching patient data:", error);
          const localUser: Patient = {
            id: sessionUser.id,
            email: sessionUser.email!,
            name: sessionUser.user_metadata?.name || sessionUser.email?.split("@")[0] || "",
          };
          if (typeof window !== "undefined") {
            const savedAvatar = localStorage.getItem(`obibi_avatar_${sessionUser.id}`);
            if (savedAvatar) {
              localUser.avatar_url = savedAvatar;
            }
          }
          setUser(localUser); 
        } else {
          const patient = patientData as Patient;
          if (typeof window !== "undefined") {
            const savedAvatar = localStorage.getItem(`obibi_avatar_${patient.id}`);
            if (savedAvatar) {
              patient.avatar_url = savedAvatar;
            }
          }
          setUser(patient); 
        }
      } catch (err) {
        console.error("Unexpected error loading patient data:", err);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPatient();

    return () => {
      active = false;
    };
  }, [sessionUser]);

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
    setSessionUser(null);
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
