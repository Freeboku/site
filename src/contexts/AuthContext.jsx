
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from '@/services/authService';
import { getUserProfile } from '@/services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async (currentAuthUser, isMountedRef) => {
    if (!currentAuthUser?.id) {
      if (isMountedRef?.current) setProfile(null);
      return null;
    }
    setLoading(true); 
    try {
      const userProfileData = await getUserProfile(currentAuthUser.id);
      if (!isMountedRef?.current) return null;

      if (userProfileData) {
        const fetchedProfile = {
          id: userProfileData.id,
          username: userProfileData.username,
          avatarUrl: userProfileData.avatarUrl, 
          roleName: userProfileData.role || 'user',
          bio: userProfileData.bio,
          email: currentAuthUser.email 
        };
        if (isMountedRef.current) setProfile(fetchedProfile);
        return fetchedProfile;
      } else {
        console.warn(`No profile found for user ID: ${currentAuthUser.id}. Defaulting.`);
        const defaultProfile = {
          id: currentAuthUser.id,
          username: currentAuthUser.email?.split('@')[0] || 'Utilisateur',
          avatarUrl: null,
          roleName: 'user',
          bio: '',
          email: currentAuthUser.email
        }
        if (isMountedRef.current) setProfile(defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error('Error fetching profile (AuthContext):', error.message);
      if (isMountedRef?.current) {
        const errorProfile = {
          id: currentAuthUser.id,
          username: 'Erreur Profil',
          avatarUrl: null,
          roleName: 'user', 
          bio: '',
          email: currentAuthUser.email
        };
        setProfile(errorProfile);
      }
      return null;
    } finally {
      if(isMountedRef?.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isMountedRef = { current: true };
    let authStateChangeUnsubscriber = null;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;
        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);
          await fetchProfileData(session.user, isMountedRef);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false); 
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        if (isMountedRef.current) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
      
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!isMountedRef.current) return;
           if (_event === 'SIGNED_IN' && session?.user) {
            setUser(session.user); 
            await fetchProfileData(session.user, isMountedRef);
          } else if (_event === 'SIGNED_OUT') {
            if (isMountedRef.current) {
              setUser(null);
              setProfile(null);
            }
          } else if (_event === 'USER_UPDATED' && session?.user) {
             setUser(session.user);
             await fetchProfileData(session.user, isMountedRef); 
          } else if (session?.user) {
            if (user?.id !== session.user.id || !profile || profile.id !== session.user.id) { 
               setUser(session.user);
               await fetchProfileData(session.user, isMountedRef);
            }
          } else {
             if (isMountedRef.current) {
               setUser(null);
               setProfile(null);
             }
          }
          if(isMountedRef.current) setLoading(false);
        }
      );
      authStateChangeUnsubscriber = authListener?.subscription;
    };

    initializeAuth();

    return () => {
      isMountedRef.current = false;
      if (authStateChangeUnsubscriber) {
        authStateChangeUnsubscriber.unsubscribe();
      }
    };
  }, [fetchProfileData]); 

  const signIn = async (credentials) => {
    const data = await authSignIn(credentials);
    return data;
  };

  const signUp = async (credentials) => {
    const data = await authSignUp(credentials);
    return data;
  };
  
  const signOut = async () => {
    await authSignOut();
  };
  
  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchProfileData(user, {current: true});
    }
  }, [user, fetchProfileData]);

  const value = {
    user,
    profile,
    isAdmin: profile?.roleName === 'admin',
    userRole: profile?.roleName || 'user',
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile: refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
