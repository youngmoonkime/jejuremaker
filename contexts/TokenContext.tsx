import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface TokenContextType {
  userTokens: number;
  updateUserTokens: (newTokenCount: number) => Promise<void>;
  refreshTokens: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userTokens, setUserTokens] = useState<number>(100);
  const isSuperAdmin = user?.id === '9f906164-adf7-4eef-b247-26bc3fca5024';

  const fetchUserTokens = useCallback(async () => {
    if (!user) {
      setUserTokens(100);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('user_id, tokens_remaining, tokens_used, next_reset_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record exists, create one
        const { data: newRecord, error: insertError } = await supabase
          .from('user_tokens')
          .insert({
            user_id: user.id,
            tokens_remaining: 100,
            tokens_used: 0,
            signup_date: new Date().toISOString(),
            last_reset_at: new Date().toISOString(),
            next_reset_at: (() => {
              const d = new Date();
              d.setHours(24, 0, 0, 0);
              return d.toISOString();
            })()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to create token record:', insertError);
          setUserTokens(100);
        } else {
          setUserTokens(newRecord.tokens_remaining);
        }
      } else if (data) {
        const nextReset = new Date(data.next_reset_at);
        const now = new Date();

        if (now >= nextReset && !isSuperAdmin) {
          // Reset tokens
          const { data: resetData, error: resetError } = await supabase
            .from('user_tokens')
            .update({
              tokens_remaining: 100,
              tokens_used: 0,
              last_reset_at: now.toISOString(),
              next_reset_at: (() => {
                const d = new Date();
                d.setHours(24, 0, 0, 0);
                return d.toISOString();
              })()
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (resetError) {
            console.error('Failed to reset tokens:', resetError);
            setUserTokens(data.tokens_remaining);
          } else {
            setUserTokens(resetData.tokens_remaining);
          }
        } else {
          setUserTokens(data.tokens_remaining);
          // Special case: if super-admin has low tokens, they might want to "refill"
          // but the system should generally just trust the DB value unless they manually override.
        }
      }
    } catch (err) {
      console.error("Error in fetchUserTokens:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchUserTokens();
  }, [fetchUserTokens]);

  const updateUserTokens = async (newTokenCount: number) => {
    if (!user) return;

    setUserTokens(newTokenCount);

    try {
      const { error } = await supabase
        .from('user_tokens')
        .update({
          tokens_remaining: newTokenCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync tokens to DB:', error);
    }
  };

  return (
    <TokenContext.Provider value={{
      userTokens,
      updateUserTokens,
      refreshTokens: fetchUserTokens
    }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useTokens must be used within a TokenProvider');
  }
  return context;
};
