import type { PropsWithChildren } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../utils/supabaseClient";
import isEqual from "lodash/isEqual"; // Import lodash's isEqual for deep comparison

interface AuthContextProps {
  user: any;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps>(undefined!);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error getting user:", error);
      }


      // Only update state if the new user is different from the current one
      setUser((prevUser: any) => {
        if (!isEqual(prevUser, user)) {
          return user;
        }
        return prevUser;
      });
      setLoading(false); // Update loading state after user is set
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Only update state if the new session user is different from the current user
        setUser((prevUser: any) => {
          if (!isEqual(prevUser, session?.user)) {
            return session?.user || null;
          }
          return prevUser;
        });
        setLoading(false); // Ensure to set loading to false here as well
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true); // Consider setting loading to true to indicate starting the sign-in process
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Error during sign in:", error);
      setLoading(false); // Ensure to set loading to false in case of an error
      return { error };
    }
    // Only update state if the new user is different from the current one
    setUser((prevUser: any) => {
      if (!isEqual(prevUser, data.user)) {
        return data.user;
      }
      return prevUser;
    });
    setLoading(false);
    return { user: data.user };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      setLoading(false);
      return { error };
    }
    setUser(null);
    setLoading(false);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("Error during sign up:", error);
      setLoading(false);
      return { error };
    }
    // Only update state if the new user is different from the current one
    setUser((prevUser: any) => {
      if (!isEqual(prevUser, data.user)) {
        return data.user;
      }
      return prevUser;
    });
    setLoading(false);
    return { user: data.user };
  }, []);

  const contextValue = useMemo(
    () => ({ user, signIn, signOut, signUp, loading }),
    [user, signIn, signOut, signUp, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Add the whyDidYouRender property after defining the component
(AuthProvider as any).whyDidYouRender = true;

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (typeof context === "undefined") {
    throw new Error(
      "useAuthContext should be used within the AuthProvider provider!"
    );
  }

  return context;
}
