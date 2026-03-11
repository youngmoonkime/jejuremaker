import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// Re-using ViewState type from App (or we could move it to types.ts later)
type ViewState = 'discovery' | 'detail' | 'workspace' | 'upload' | 'trending' | 'community' | 'profile' | 'lab';

interface AuthContextType {
  user: User | null;
  userProfile: { nickname: string; avatarUrl: string } | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  showAuthModal: boolean;
  authTargetView: ViewState | null;
  refreshUserProfile: () => Promise<void>;
  handleLogout: (language: 'ko' | 'en') => Promise<void>;
  handleLoginClick: (targetView?: ViewState) => void;
  setShowAuthModal: (show: boolean) => void;
  getVirtualNickname: (userId: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FUN_NICKNAMES = [
  '제주의 아들',
  '고독한 소나',
  '귤 줍는 청년',
  '서핑하는 돌하르방',
  '한라산 등반왕',
  '우도 버스기사',
  '성산일출봉 지킴이',
  '바람 부는 날의 억새',
  '재활용하는 해녀',
  '업사이클링 마스터'
];

export const getVirtualNickname = (userId: string) => {
   let hash = 0;
   for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
   }
   return FUN_NICKNAMES[Math.abs(hash) % FUN_NICKNAMES.length];
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ nickname: string; avatarUrl: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTargetView, setAuthTargetView] = useState<ViewState | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  // For now, allow all logged-in users to access upload (admin) features
  const isAdmin = !!user;
  // Super Admin IDs (고리고당 and existing admin)
  const isSuperAdmin = user?.id === '301508ba-e928-484f-8617-17f7c96c5d1f' || user?.id === '9f906164-adf7-4eef-b247-26bc3fca5024';

  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('nickname, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Failed to refresh user profile:', error.message);
        return;
      }

      if (profile) {
        setUserProfile({ nickname: profile.nickname, avatarUrl: profile.avatar_url });
      }
    } catch (error) {
      console.error('Unexpected error in refreshUserProfile:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [user, refreshUserProfile]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      const currentId = currentUser?.id || null;
      
      console.log(`AuthContext: onAuthStateChange event="${_event}" user="${currentId}" (prev="${lastUserIdRef.current || 'null'}")`);
      
      if (currentId !== lastUserIdRef.current) {
          console.log(`AuthContext: State change detected. Updating user from "${lastUserIdRef.current || 'null'}" to "${currentId}"`);
          lastUserIdRef.current = currentId;
          setUser(currentUser);
      }
      
      if (currentUser && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || _event === 'TOKEN_REFRESHED')) {
        console.log("AuthContext: Valid session detected, closing modal.");
        setShowAuthModal(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async (language: 'ko' | 'en') => {
    try {
      console.log("AuthContext: Initiating logout...");
      await supabase.auth.signOut();
      lastUserIdRef.current = null; // CRITICAL: Clear ref so next login is detected
      setUser(null);
      setUserProfile(null);
      alert(language === 'ko' ? '로그아웃 되었습니다.' : 'Logged out successfully.');
      setShowAuthModal(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleLoginClick = (targetView?: ViewState) => {
    setAuthTargetView(targetView || null);
    setShowAuthModal(true);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAdmin,
      isSuperAdmin,
      showAuthModal,
      authTargetView,
      refreshUserProfile,
      handleLogout,
      handleLoginClick,
      setShowAuthModal,
      getVirtualNickname
    }}>
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
