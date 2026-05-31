import React, { createContext, useContext, useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';
import { movieService } from '../services/api';
import { chatService } from '@/services/api';

interface Notification {
  title: string;
  message: string;
  timestamp: string;
}

interface NotificationContextType {
  notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    let pusher: Pusher | null = null;
    const init = async () => {
      const cfg = await chatService.getPusherConfig();
      if (!cfg?.enabled || !cfg?.key || !cfg?.cluster) return;
      pusher = new Pusher(cfg.key, { cluster: cfg.cluster });
      const channel = pusher.subscribe('global-notifications');
      channel.bind('notify', (data: Notification) => {
        setNotifications(prev => [data, ...prev]);
      });
    };

    init().catch(console.error);
    return () => pusher?.unsubscribe('global-notifications');
  }, []);

  // Welcome notification on first login/signup
  useEffect(() => {
    if (user) {
      setNotifications(prev => [{
        title: 'Welcome to flixvzn.movie!',
        message: `Glad to have you back, ${user.name || user.email}! Start exploring our new movies and series.`,
        timestamp: new Date().toISOString()
      }, ...prev]);
    }
  }, [user]);

  // Periodic notification for trending movies every hour (simulated on frontend for this demo)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const trending = await movieService.getTrending();
        const topMovie = trending[0];
        if (topMovie) {
          setNotifications(prev => [{
            title: '🔥 Trending Now',
            message: `Check out "${topMovie.title}", it's trending this hour!`,
            timestamp: new Date().toISOString()
          }, ...prev]);
        }
      } catch (e) {
        console.error('Failed to fetch trending for notification', e);
      }
    }, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
