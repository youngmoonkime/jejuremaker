import React, { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthModalProps {
  supabase: SupabaseClient;
  onClose: () => void;
  currentView?: string;
  projectId?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ supabase, onClose, currentView, projectId }) => {
  const [isLoginMode, setIsLoginMode] = useState(false); // Default to Sign Up
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('regular');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleGoogleLogin = async () => {
    try {
      // Construct the redirect URL with current view state
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLoginMode) {
        // --- Login Logic ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Success
        alert("로그인 성공!");
        onClose();
        
      } else {
        // --- Sign Up Logic ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: userType,
            },
          },
        });
        if (error) throw error;

        // Success
        alert("계정이 생성되었습니다! 이메일을 확인하여 인증을 완료해주세요.");
        setIsLoginMode(true); // Switch to login mode
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Main Container */}
      <div className="relative w-full max-w-[520px] flex flex-col items-center z-10" onClick={(e) => e.stopPropagation()}>
        
        {/* Ambient Background Gradients (Local to modal) */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b77f]/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Header / Branding */}
        <div className="mb-8 flex flex-col items-center text-center relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-full bg-[#10b77f]/10 flex items-center justify-center text-[#10b77f] shadow-[0_20px_40px_-10px_rgba(16,183,127,0.1)]">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                        auto_awesome
                    </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[#111816] dark:text-white">Jeju Re-Maker Hub</h2>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111816] dark:text-white mt-4">
                {isLoginMode ? 'Welcome back!' : 'Join the sustainable revolution'}
            </h1>
            <p className="text-[#61897c] dark:text-gray-400 mt-2 text-sm font-medium">
                {isLoginMode ? 'Log in to continue your journey.' : 'Create, collaborate, and craft a greener future.'}
            </p>
        </div>

        {/* Glass Card */}
        <div className="w-full rounded-3xl p-8 sm:p-10 relative overflow-hidden transition-all duration-300 bg-white/75 dark:bg-[#10221c]/80 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-20"
            >
                <span className="material-symbols-outlined">close</span>
            </button>

            {/* Social Login */}
            <button 
                onClick={handleGoogleLogin}
                className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 px-6 py-3.5 text-sm font-bold text-[#111816] dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-white/15 transition-all mb-8"
            >
                <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo1yGusJJnjp92uAj8CGS2QWRel_vxyk1pJccPfUr9EDya73mQc6rLvIuvlAwQcSQGTx2hQz0DVqNWwltktlQg5ZA4GDBEeZ6wfLDBDUbuvpO18-v0ZSlmhUurX9PLCq8alhwwgO7sOt7_yJP1HK201qlh1fUP6xQGlHoG2TueWST89GWlnnOlCAXKV2ZtCCUmVRF_0vgD1YN8FWVl0MHT5RkmPpoIVckqHB-VZ14IPQrzZMP1o_vdIVPNDXYbQ-4mwvc6O9kpUgY"/>
                <span>Continue with Google</span>
                <div className="absolute inset-0 rounded-xl ring-2 ring-[#10b77f]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <div className="relative flex items-center py-2 mb-8">
                <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Or with email</span>
                <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
            </div>

            {/* User Type Selector (Only show on Sign Up) */}
            {!isLoginMode && (
                <div className="mb-8 p-1.5 bg-gray-100 dark:bg-black/20 rounded-2xl flex relative">
                    <label className="flex-1 relative z-10 cursor-pointer">
                        <input 
                            className="peer sr-only" 
                            name="user_type" 
                            type="radio" 
                            value="regular" 
                            checked={userType === 'regular'}
                            onChange={() => setUserType('regular')}
                        />
                        <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 text-[#61897c] hover:text-[#111816] dark:hover:text-white peer-checked:bg-white peer-checked:text-[#10b77f] peer-checked:shadow-sm dark:peer-checked:bg-[#2A3F38] dark:peer-checked:text-[#10b77f]">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            <span>Regular User</span>
                        </div>
                    </label>
                    <label className="flex-1 relative z-10 cursor-pointer">
                        <input 
                            className="peer sr-only" 
                            name="user_type" 
                            type="radio" 
                            value="maker" 
                            checked={userType === 'maker'}
                            onChange={() => setUserType('maker')}
                        />
                        <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 text-[#61897c] hover:text-[#111816] dark:hover:text-white peer-checked:bg-white peer-checked:text-[#10b77f] peer-checked:shadow-sm dark:peer-checked:bg-[#2A3F38] dark:peer-checked:text-[#10b77f]">
                            <span className="material-symbols-outlined text-[18px]">handyman</span>
                            <span>Professional Maker</span>
                        </div>
                    </label>
                </div>
            )}

            {/* Form Fields */}
            <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Full Name (Only show on Sign Up) */}
                {!isLoginMode && (
                    <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 group-focus-within:text-[#10b77f] transition-colors">
                            <span className="material-symbols-outlined text-[20px]">badge</span>
                        </div>
                        <input 
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 dark:bg-white/5 dark:border-white/10 py-3.5 pl-11 pr-4 text-sm text-[#111816] dark:text-white placeholder-gray-400 focus:border-[#10b77f] focus:bg-white dark:focus:bg-black/20 focus:ring-1 focus:ring-[#10b77f] transition-all shadow-sm outline-none" 
                            placeholder="Nickname (Full Name)" 
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required={!isLoginMode}
                        />
                    </div>
                )}
                
                {/* Email */}
                <div className="group relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 group-focus-within:text-[#10b77f] transition-colors">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <input 
                        className="block w-full rounded-xl border-gray-200 bg-gray-50/50 dark:bg-white/5 dark:border-white/10 py-3.5 pl-11 pr-4 text-sm text-[#111816] dark:text-white placeholder-gray-400 focus:border-[#10b77f] focus:bg-white dark:focus:bg-black/20 focus:ring-1 focus:ring-[#10b77f] transition-all shadow-sm outline-none" 
                        placeholder="Email Address" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                {/* Password */}
                <div className="group relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 group-focus-within:text-[#10b77f] transition-colors">
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <input 
                        className="block w-full rounded-xl border-gray-200 bg-gray-50/50 dark:bg-white/5 dark:border-white/10 py-3.5 pl-11 pr-4 text-sm text-[#111816] dark:text-white placeholder-gray-400 focus:border-[#10b77f] focus:bg-white dark:focus:bg-black/20 focus:ring-1 focus:ring-[#10b77f] transition-all shadow-sm outline-none" 
                        placeholder="Password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <button className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" type="button">
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                </div>

                {/* Submit Button */}
                <button 
                    disabled={loading}
                    className="w-full relative overflow-hidden rounded-xl bg-[#10b77f] hover:bg-[#0e9f6e] text-white py-4 font-bold text-sm shadow-lg shadow-[#10b77f]/30 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2 group disabled:opacity-70 disabled:cursor-not-allowed" 
                    type="submit"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? 'Processing...' : (isLoginMode ? 'Log In' : 'Create Account')}
                        {!loading && <span className="material-symbols-outlined text-[18px]">{isLoginMode ? 'login' : 'arrow_forward'}</span>}
                    </span>
                    {/* Shine Effect */}
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine transition-all duration-500" style={{ left: '-100%' }}></div>
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-[#61897c] dark:text-gray-400">
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"} 
                    <button 
                        type="button"
                        onClick={() => setIsLoginMode(!isLoginMode)}
                        className="text-[#10b77f] font-bold hover:underline decoration-2 decoration-[#10b77f]/30 underline-offset-4 transition-all ml-1"
                    >
                        {isLoginMode ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 text-xs text-gray-400 font-medium">
            <a className="hover:text-[#10b77f] transition-colors" href="#">Privacy Policy</a>
            <span>•</span>
            <a className="hover:text-[#10b77f] transition-colors" href="#">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;