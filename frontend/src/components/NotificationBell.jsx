import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const API_BASE = 'http://localhost:8000';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/instructor/notifications`, {
        credentials: 'include'
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      const unread = data.notifications?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/instructor/notifications`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/instructor/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          credentials: 'include'
        }
      );
      
      if (!response.ok) return;
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read one by one
      for (const notification of notifications.filter(n => !n.is_read)) {
        await fetch(
          `${API_BASE}/api/instructor/notifications/${notification.id}/read`,
          {
            method: 'PUT',
            credentials: 'include'
          }
        );
      }
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleBellClick = () => {
    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowDropdown(false);
    
    // Navigate based on notification type
    if (notification.related_course_id) {
      navigate(`/instructor/courses/${notification.related_course_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'approval': return '✅';
      case 'course_feedback': return '💬';
      case 'admin_message': return '📢';
      case 'system': return 'ℹ️';
      default: return '🔔';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container">
      <button className="notification-bell" onClick={handleBellClick}>
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    {notification.course_title && (
                      <span className="course-tag">📚 {notification.course_title}</span>
                    )}
                    <span className="notification-time">{getTimeAgo(notification.created_at)}</span>
                  </div>
                  {!notification.is_read && (
                    <div className="unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="notification-footer">
              <button onClick={() => {
                setShowDropdown(false);
                navigate('/notifications');
              }}>
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
