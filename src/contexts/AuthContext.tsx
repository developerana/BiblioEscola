import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'bibliotecario' | 'user' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  userName: string | null;
  isAdmin: boolean;
  canManageBooks: boolean;
  mustChangePassword: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'anahelouise.ss@gmail.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    return data?.role as AppRole || null;
  };

  const fetchProfileData = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('must_change_password, name')
      .eq('user_id', userId)
      .single();
    
    return {
      mustChangePassword: data?.must_change_password ?? false,
      name: data?.name ?? null
    };
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role and profile data fetching with setTimeout
        if (session?.user) {
          setTimeout(async () => {
            const [userRole, profileData] = await Promise.all([
              fetchUserRole(session.user.id),
              fetchProfileData(session.user.id)
            ]);
            setRole(userRole);
            setUserName(profileData.name);
            setMustChangePassword(profileData.mustChangePassword);
            setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setUserName(null);
          setMustChangePassword(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        Promise.all([
          fetchUserRole(session.user.id),
          fetchProfileData(session.user.id)
        ]).then(([userRole, profileData]) => {
          setRole(userRole);
          setUserName(profileData.name);
          setMustChangePassword(profileData.mustChangePassword);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { error };
    }

    // Check if user is active and fetch role/profile in parallel for speed
    if (data.user) {
      const [profileResult, roleResult, profileDataResult] = await Promise.all([
        supabase.from('profiles').select('is_active').eq('user_id', data.user.id).maybeSingle(),
        fetchUserRole(data.user.id),
        fetchProfileData(data.user.id)
      ]);
      
      if (profileResult.data && profileResult.data.is_active === false) {
        await supabase.auth.signOut();
        return { error: new Error('Sua conta está desativada. Entre em contato com o administrador.') };
      }

      // Pre-set role and profile data immediately for instant UI update
      setRole(roleResult);
      setUserName(profileDataResult.name);
      setMustChangePassword(profileDataResult.mustChangePassword);
    }
    
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setUserName(null);
    setMustChangePassword(false);
  };

  const clearMustChangePassword = () => {
    setMustChangePassword(false);
  };

  const isAdmin = role === 'admin' || user?.email === ADMIN_EMAIL;
  const canManageBooks = isAdmin || role === 'bibliotecario';

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role,
      userName,
      isAdmin,
      canManageBooks,
      mustChangePassword,
      loading, 
      signIn, 
      signOut,
      clearMustChangePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
