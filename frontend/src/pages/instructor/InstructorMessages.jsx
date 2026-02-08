import { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle, Bell } from 'lucide-react';

export default function InstructorMessages() {
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    Promise.all([
      fetch('/api/instructor/messages/received', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/instructor/notifications', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([m, n]) => {
        setMessages(m.messages || []);
        setNotifications(n.notifications || []);
      })
      .catch(err => console.error('Error loading data:', err))
      .finally(() => setLoading(false));
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/instructor/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: replyText }),
      });

      if (response.ok) {
        setReplyText('');
        alert('Message sent to admin successfully!');
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMarkComplete = async (messageId) => {
    try {
      const response = await fetch(`/api/instructor/messages/${messageId}/complete`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.ok) {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, is_completed: true } : m
        ));
        alert('Message marked as completed!');
      } else {
        alert('Failed to mark message as completed');
      }
    } catch (error) {
      console.error('Error marking message as completed:', error);
      alert('Failed to mark message as completed');
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await fetch(`/api/instructor/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <h1 className="section-title">Messages & Notifications</h1>

      {/* Notifications Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Bell size={24} />
          <h2 style={{ margin: 0 }}>Notifications</h2>
          {unreadNotifications > 0 && (
            <span className="badge badge-warning">{unreadNotifications} unread</span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            No notifications yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map(notification => (
              <div
                key={notification.id}
                style={{
                  padding: '16px',
                  backgroundColor: notification.is_read ? 'var(--bg-secondary)' : 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
                onClick={() => !notification.is_read && handleMarkNotificationRead(notification.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{notification.message}</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <span className="badge badge-warning">New</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Message to Admin */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={20} />
          Send Message to Admin
        </h3>
        <form onSubmit={handleSendReply}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              minHeight: '120px',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
            placeholder="Type your message to the admin here..."
            required
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending}
            style={{ marginTop: '12px' }}
          >
            <Send size={16} style={{ marginRight: '6px' }} />
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      {/* Messages from Admin */}
      <div>
        <h2 style={{ marginBottom: '16px' }}>Messages from Admin</h2>
        
        {messages.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            No messages from admin yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map(message => (
              <div
                key={message.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1rem' }}>Admin Message</strong>
                    <span className={`badge ${message.is_completed ? 'badge-success' : 'badge-warning'}`}>
                      {message.is_completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {message.message}
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Received: {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>

                {!message.is_completed && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleMarkComplete(message.id)}
                  >
                    <CheckCircle size={14} style={{ marginRight: '6px' }} />
                    Mark as Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
