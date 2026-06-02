import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, TrendingUp, Sparkles, CheckCircle, Brain, Calendar, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
      // Check for new notifications every minute (for demo)
      const interval = setInterval(checkForNewNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      // Try to fetch from API
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0);
      } else {
        // Fallback to demo notifications
        setNotifications(getDemoNotifications());
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications(getDemoNotifications());
    }
  };

  const checkForNewNotifications = async () => {
    // In real app, you'd poll for new notifications
    // For demo, just refresh
    loadNotifications();
  };

  const getDemoNotifications = () => {
    return [
      {
        id: 1,
        type: 'review_due',
        title: 'Flashcards Due for Review',
        message: 'You have 8 flashcards due for review today',
        icon: 'clock',
        timestamp: new Date(),
        read: false,
        action: '/flashcards'
      },
      {
        id: 2,
        type: 'streak',
        title: 'Study Streak! 🔥',
        message: 'You\'ve studied for 7 days in a row! Keep it up!',
        icon: 'trending',
        timestamp: new Date(Date.now() - 86400000),
        read: false,
        action: '/dashboard'
      },
      {
        id: 3,
        type: 'mastery',
        title: 'Mastery Achieved! 🎓',
        message: 'You\'ve reached 80% mastery in JavaScript',
        icon: 'check',
        timestamp: new Date(Date.now() - 172800000),
        read: true,
        action: '/dashboard'
      },
      {
        id: 4,
        type: 'ai_generated',
        title: 'AI Generated New Cards',
        message: 'New flashcards ready from "React Basics" document',
        icon: 'sparkles',
        timestamp: new Date(Date.now() - 259200000),
        read: true,
        action: '/flashcards'
      }
    ];
  };

  const getIcon = (iconName) => {
    const iconClass = "w-4 h-4";
    switch(iconName) {
      case 'clock': return <Clock className={`${iconClass} text-orange-500`} />;
      case 'trending': return <TrendingUp className={`${iconClass} text-green-500`} />;
      case 'sparkles': return <Sparkles className={`${iconClass} text-blue-500`} />;
      case 'check': return <CheckCircle className={`${iconClass} text-purple-500`} />;
      case 'brain': return <Brain className={`${iconClass} text-emerald-500`} />;
      case 'calendar': return <Calendar className={`${iconClass} text-pink-500`} />;
      case 'star': return <Star className={`${iconClass} text-yellow-500`} />;
      default: return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const markAsRead = async (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.action) {
      navigate(notif.action);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center w-10 h-10 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 group"
      >
        <Bell size={20} strokeWidth={2} className='group-hover:scale-110 transition-transform duration-200'/>
        {unreadCount > 0 && (
          <span className='absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ring-2 ring-white'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1">We'll notify you when something important happens!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${
                    !notif.read ? 'bg-emerald-50/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notif.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-slate-900 text-sm">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-slate-600 text-xs mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-slate-400 text-xs mt-2">
                        {formatTime(notif.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;