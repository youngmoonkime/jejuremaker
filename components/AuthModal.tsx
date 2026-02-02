import React, { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthModalProps {
  supabase: SupabaseClient;
  onClose: () => void;
  currentView?: string;
  projectId?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ supabase, onClose, currentView, projectId }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = new URL(window.location.origin);
      if (currentView) {
        redirectUrl.searchParams.set('view', currentView);
      }
      if (projectId) {
        redirectUrl.searchParams.set('projectId', projectId);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
        }
      });
      if (error) throw error;
    } catch (error) {
      alert(`Google Login Error: ${error.message}`);
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
            className="w-full relative flex items-center justify-center gap-3 bg-white dark:bg-[#2c2c2e] hover:bg-gray-50 dark:hover:bg-[#3a3a3c] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-6 py-4 text-[15px] font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-sm group"
          >
            {loading ? (
              <div className="size-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <img
                  alt=""
                  className="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo1yGusJJnjp92uAj8CGS2QWRel_vxyk1pJccPfUr9EDya73mQc6rLvIuvlAwQcSQGTx2hQz0DVqNWwltktlQg5ZA4GDBEeZ6wfLDBDUbuvpO18-v0ZSlmhUurX9PLCq8alhwwgO7sOt7_yJP1HK201qlh1fUP6xQGlHoG2TueWST89GWlnnOlCAXKV2ZtCCUmVRF_0vgD1YN8FWVl0MHT5RkmPpoIVckqHB-VZ14IPQrzZMP1o_vdIVPNDXYbQ-4mwvc6O9kpUgY"
                />
                <span>Continue with Google</span>
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