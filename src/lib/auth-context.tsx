import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getSession, getCurrentUser, isEmailWhitelisted } from './supabase';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await getSession();
        setSession(session);
        
        if (session) {
          const { data: { user } } = await getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to fetch session');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      
      // First check if email is whitelisted
      const isWhitelisted = await isEmailWhitelisted(email);
      
      if (!isWhitelisted) {
        throw new Error('This email is not authorized to sign up. Please contact an administrator.');
      }
      
      // Proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }
      
      // If we have a user, make sure their profile is created correctly
      if (data.user) {
        // Check if the profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        // If profile doesn't exist, create it with required fields
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: fullName,
              created_at: new Date().toISOString(),
              is_doctor: false,
              is_admin: false,
              emergency_info: {
                allergies: [],
                conditions: [],
                medications: [],
                bloodType: '',
                medicationReminders: []
              }
            });
            
          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // We don't throw here as the user is already created
          }
        }
      }

      setSession(data.session);
      setUser(data.user);
    } catch (error: any) {
      console.error('Error signing up:', error);
      setError(error.message || 'An error occurred during sign up');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setSession(data.session);
      setUser(data.user);
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError(error.message || 'An error occurred during sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Import dataCache function lazily to avoid circular dependencies
      const { dataCache } = await import('./utils');
      
      // Clear all cache on sign out
      dataCache.clear();
      
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message || 'An error occurred during sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};