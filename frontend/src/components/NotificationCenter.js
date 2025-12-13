import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async (pageNum = 0, append = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await notificationService.getUserNotifications(pageNum, 10);
      const newNotifications = response.data.content || [];
      
      if (append) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }
      
      setHasMore(!response.data.last);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Don't set error state on fetch failure - just silently fail
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      // Silently fail - don't log every error
      // This is just a notification count, not critical
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, true);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      COMPLAINT_ESCALATED: '🚨',
      COMPLAINT_ASSIGNED: '📋',
      COMPLAINT_STATUS_UPDATE: '🔄',
      COMPLAINT_DEADLINE_UPDATE: '⏰',
      SYSTEM_ANNOUNCEMENT: '📢',
      ESCALATION_ALERT: '⚠️'
    };
    return icons[type] || '📝';
  };

  const getTypeColor = (type) => {
    const colors = {
      COMPLAINT_ESCALATED: '#ff5722',
      COMPLAINT_ASSIGNED: '#2196f3',
      COMPLAINT_STATUS_UPDATE: '#4caf50',
      COMPLAINT_DEADLINE_UPDATE: '#ff9800',
      SYSTEM_ANNOUNCEMENT: '#9c27b0',
      ESCALATION_ALERT: '#f44336'
    };
    return colors[type] || '#666';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (!user) return null;

  return (
    <div className="notification-center">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {error && (
              <div className="notification-error">
                {error}
              </div>
            )}

            {notifications.length === 0 && !loading ? (
              <div className="no-notifications">
                <span>📭</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="notification-icon" style={{ color: getTypeColor(notification.type) }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.complaint && (
                        <span className="notification-complaint">
                          Complaint #{notification.complaint.id}
                        </span>
                      )}
                    </div>
                  </div>

                  {!notification.read && (
                    <div className="notification-unread-dot"></div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="notification-loading">
                Loading notifications...
              </div>
            )}

            {hasMore && notifications.length > 0 && !loading && (
              <button 
                className="load-more-btn"
                onClick={loadMore}
              >
                Load more notifications
              </button>
            )}
          </div>

          <div className="notification-footer">
            <small>
              Real-time notifications for escalations and assignments
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;