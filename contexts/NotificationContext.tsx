import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth, getVirtualNickname } from './AuthContext';

interface NotificationContextType {
  notifications: any[];
  onlineUsers: any[];
  toastNotification: any | null;
  setToastNotification: (notif: any | null) => void;
  fetchNotifications: () => Promise<void>;
  handleNotificationClick: (notif: any, callback?: () => void) => void;
  handleNotificationDelete: (id: string) => Promise<void>;
  setActiveChatPartnerId: (id: string | null) => void;
  activeChatPartnerId: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [toastNotification, setToastNotification] = useState<any | null>(null);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);
  
  // Refs to prevent re-subscription spam
  const globalChannelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const userProfileRef = useRef(userProfile);
  const activeChatPartnerIdRef = useRef<string | null>(null);

  // Keep userProfileRef updated without causing re-renders
  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  // Keep activeChatPartnerIdRef updated
  useEffect(() => {
    activeChatPartnerIdRef.current = activeChatPartnerId;
    console.log("NotificationContext: activeChatPartnerId updated to", activeChatPartnerId);
  }, [activeChatPartnerId]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('id, content, project_id, sender_id, created_at, metadata')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        let profilesMap: Record<string, any> = {};

        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, nickname, avatar_url')
            .in('user_id', senderIds);

          profilesMap = (profiles || []).reduce((acc: any, p: any) => {
            acc[p.user_id] = p;
            return acc;
          }, {});
        }

        const newNotifications = data.map(m => {
          const profile = profilesMap[m.sender_id];
          const metadata = m.metadata || {};
          return {
            id: m.id,
            sender: profile?.nickname || getVirtualNickname(m.sender_id),
            senderAvatar: profile?.avatar_url,
            senderUserId: m.sender_id,
            message: m.content,
            projectId: m.project_id || 'direct_message',
            projectTitle: metadata.projectTitle || (m.project_id && m.project_id !== 'direct_message' ? 'Project Message' : 'Direct Message'),
            read: false,
            timestamp: m.created_at,
            metadata: m.metadata || {},
            accessType: metadata.accessType,
            relatedProjectId: metadata.relatedProjectId || m.project_id
          };
        });

        setNotifications(prev => {
          const combined = [...newNotifications, ...prev];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique.slice(0, 50);
        });
      }
    } catch (err) {
      console.error("Error in fetchNotifications:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime Subscriptions - FIXED: Separate dependency arrays
  useEffect(() => {
    if (!user) return;

    // Direct Messages Listener - Client-side filtering for reliability
    const msgChannel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        async (payload: any) => {
          const newMsg = payload.new;
          if (!newMsg) return;
          
          // Client-side filter: Only process if the current user is the receiver
          if (newMsg.receiver_id !== user.id) {
            return;
          }

          console.log("NotificationContext: New Realtime Message received for current user:", newMsg);
          
          // CRITICAL: If this message is from the active chat partner, ignore notification and mark as read
          const currentPartner = activeChatPartnerIdRef.current;
          if (currentPartner && newMsg.sender_id === currentPartner) {
             console.log("NotificationContext: Suppressing notification for active chat partner:", currentPartner);
             supabase.from('direct_messages').update({ is_read: true }).eq('id', newMsg.id).then();
             return;
          }

          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('nickname, avatar_url')
              .eq('user_id', newMsg.sender_id)
              .maybeSingle();

            const metadata = newMsg.metadata || {};
            const notificationData = {
              sender: profile?.nickname || getVirtualNickname(newMsg.sender_id),
              senderAvatar: profile?.avatar_url,
              senderUserId: newMsg.sender_id,
              message: newMsg.content,
              projectId: newMsg.project_id || 'direct_message',
              projectTitle: metadata.projectTitle || (newMsg.project_id && newMsg.project_id !== 'direct_message' ? 'Project Message' : 'Direct Message'),
              targetUserId: user.id,
              metadata: metadata,
              accessType: metadata.accessType,
              relatedProjectId: metadata.relatedProjectId || newMsg.project_id
            };

            console.log("NotificationContext: Triggering toast and updating state for:", notificationData.sender);
            setNotifications(prev => [{ ...notificationData, id: newMsg.id, timestamp: newMsg.created_at, read: false }, ...prev]);
            setToastNotification(notificationData);
            
            setTimeout(() => setToastNotification(null), 8000);
          } catch (e) {
            console.error("NotificationContext: Error processing realtime message:", e);
          }
        }
      )
      .subscribe((status) => {
        console.log(`NotificationContext: Realtime status for user-notifications: ${status}`);
      });

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [user?.id]); // Only user.id, not user object

  // Global Presence - SEPARATE useEffect with stable dependencies
  useEffect(() => {
    if (isSubscribedRef.current) return;

    isSubscribedRef.current = true;

    const channel = supabase.channel('global-presence', {
      config: { presence: { key: user?.id || 'guest-' + Math.random().toString(36).substring(2, 9) } }
    });

    globalChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const currentUserId = user?.id;
        
        // unique users by user_id and exclude current user
        const uniqueUsers = Object.keys(newState)
          .filter(key => {
            // If logged in, filter out myself. If guest, show everyone who is a maker (has user_id)
            if (currentUserId && key === currentUserId) return false;
            return true;
          })
          .map(key => (newState[key] as any[])[0])
          .filter(u => u && u.user_id); // Only show actual makers (not guests)
          
        setOnlineUsers(uniqueUsers);
      })
      // Remove join/leave logging to reduce console spam
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          if (user) {
            // Use ref to get latest profile without re-subscribing
            const profile = userProfileRef.current;
            await channel.track({
              user_id: user.id,
              nickname: profile?.nickname || '',
              virtual_nickname: getVirtualNickname(user.id),
              avatar: profile?.avatarUrl || user.user_metadata?.avatar_url,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      isSubscribedRef.current = false;
      if (globalChannelRef.current) {
        supabase.removeChannel(globalChannelRef.current);
        globalChannelRef.current = null;
      }
    };
  }, [user?.id]); // Only user.id!

  // Update presence when profile changes (without re-subscribing)
  useEffect(() => {
    if (!globalChannelRef.current || !user || !userProfile) return;

    // Just update the track data, don't re-subscribe
    globalChannelRef.current.track({
      user_id: user.id,
      nickname: userProfile.nickname || '',
      virtual_nickname: getVirtualNickname(user.id),
      avatar: userProfile.avatarUrl || user.user_metadata?.avatar_url,
      online_at: new Date().toISOString(),
    });
  }, [userProfile?.nickname, userProfile?.avatarUrl]);

  const handleNotificationDelete = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await supabase.from('direct_messages').update({ is_read: true }).eq('id', id);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleNotificationClick = (notif: any, callback?: () => void) => {
    handleNotificationDelete(notif.id);
    if (callback) callback();
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      onlineUsers,
      toastNotification,
      setToastNotification,
      fetchNotifications,
      handleNotificationClick,
      handleNotificationDelete,
      setActiveChatPartnerId,
      activeChatPartnerId
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};