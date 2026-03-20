import React, { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

import { Language } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  supabase: SupabaseClient;
  onClose: () => void;
  onSuccess?: () => void;
  language: Language;
  currentView?: string;
  projectId?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, supabase, onClose, onSuccess, language, currentView, projectId }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      console.log("AuthModal: handleGoogleLogin initiated");
      setLoading(true);
      const redirectUrl = new URL(window.location.origin);
      if (currentView) {
        redirectUrl.searchParams.set('view', currentView);
      }
      if (projectId) {
        redirectUrl.searchParams.set('projectId', projectId);
      }

      console.log("AuthModal: Redirecting to Google OAuth via Supabase...", redirectUrl.toString());
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
        }
      });
      if (error) {
        console.error("AuthModal: signInWithOAuth error:", error);
        throw error;
      }
    } catch (error) {
      console.error("AuthModal: Login process failed:", error);
      showToast(`Google 로그인 오류: ${(error as any).message}`, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Card */}
      <div
        className="relative w-full max-w-[400px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Close Button Details */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors z-20 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">close</span>
        </button>

        <div className="flex flex-col items-center pt-12 pb-10 px-8 text-center">

          {/* Logo Icon */}
          <div className="size-16 rounded-2xl bg-gradient-to-br from-[#10b77f] to-[#0e9f6e] flex items-center justify-center text-white shadow-lg mb-6">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Jeju Re-Maker
          </h2>

          <p className="text-gray-500 dark:text-gray-400 text-sm mb-10 leading-relaxed">
            Sign in to create, collaborate, and <br /> craft a sustainable future.
          </p>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full relative flex items-center justify-center gap-3 bg-white dark:bg-[#131314] hover:bg-gray-50 dark:hover:bg-[#1e1e1f] text-gray-900 dark:text-white border border-gray-300 dark:border-[#444746] rounded-full px-6 py-3 text-[15px] font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-sm group"
          >
            {loading ? (
              <div className="size-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <div className="bg-white p-1 rounded-full flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                </div>
                <span className="font-semibold">{language === 'ko' ? 'Google 계정으로 로그인' : 'Sign in with Google'}</span>
              </>
            )}
          </button>

          {/* Minimal Footer */}
          <p className="mt-8 text-[11px] text-gray-400 dark:text-gray-500 max-w-[240px] leading-normal">
            By continuing, you acknowledge that you have read and understood, and agree to our <a href="#" className="underline hover:text-gray-600 dark:hover:text-gray-300">Terms</a> and <a href="#" className="underline hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;