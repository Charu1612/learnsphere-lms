import { useState, useEffect } from 'react';
import { Users, BookOpen, Shield, Eye, EyeOff, Info, MessageSquare, CheckCircle, XCircle, Send } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [messageForm, setMessageForm] = useState({ instructor_id: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    Promise.all([
      fetch('/api/admin/users/all', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/courses/all', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/instructors', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/messages/received', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([u, c, i, m]) => {
        setUsers(u.users || []);
        setCourses(c.courses || []);
        setInstructors(i.instructors || []);
        setMessages(m.messages || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleToggleCourse = async (courseId, published) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ published }),
      });
      
      if (response.ok) {
        // Update local state
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, published } : c));
        alert(`Course ${published ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert('Failed to update course status');
      }
    } catch (error) {
      console.error('Error toggling course:', error);
      alert('Failed to update course status');
    }
  };

  const handleViewCourse = async (courseId) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/full`, { credentials: 'include' });
      const data = await response.json();
      setCourseDetails(data);
      setSelectedCourse(courseId);
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const handleViewEnrollments = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/enrollments`, { credentials: 'include' });
      const data = await response.json();
      setUserEnrollments(data.enrollments || []);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const handleApproveInstructor = async (instructorId, isApproved) => {
    try {
      await fetch(`/api/admin/instructors/${instructorId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_approved: isApproved }),
      });
      setInstructors(prev => prev.map(i => i.id === instructorId ? { ...i, is_approved: isApproved } : i));
    } catch (error) {
      console.error('Error updating instructor:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageForm.instructor_id || !messageForm.message) return;
    
    setSendingMessage(true);
    try {
      await fetch('/api/admin/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          instructor_id: parseInt(messageForm.instructor_id),
          message: messageForm.message
        }),
      });
      setMessageForm({ instructor_id: '', message: '' });
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMarkMessageRead = async (messageId) => {
    try {
      await fetch(`/api/admin/messages/${messageId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: true } : m));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleCloseCourseDetails = () => {
    setSelectedCourse(null);
    setCourseDetails(null);
  };

  const handleCloseEnrollments = () => {
    setSelectedUser(null);
    setUserEnrollments([]);
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  return (
    <div>
      <h1 className="section-title">Admin Panel</h1>

      <div className="dashboard-grid mb-6">
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{instructors.length}</div>
          <div className="stat-label">Instructors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{courses.length}</div>
          <div className="stat-label">Total Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{messages.filter(m => !m.is_read).length}</div>
          <div className="stat-label">Unread Messages</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Users
        </button>
        <button className={`tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
          <BookOpen size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Courses
        </button>
        <button className={`tab ${activeTab === 'instructors' ? 'active' : ''}`} onClick={() => setActiveTab('instructors')}>
          <Shield size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Instructors
        </button>
        <button className={`tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
          <MessageSquare size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Messages
        </button>
      </div>

      {activeTab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Enrollments</th></tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-warning' : user.role === 'instructor' ? 'badge-info' : 'badge-success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => handleViewEnrollments(user.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {user.enrollment_count || 0} courses
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'courses' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {courses.map(course => (
              <div key={course.id} style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.1rem' }}>{course.title}</h3>
                
                <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
                  <p style={{ margin: '4px 0' }}><strong>Instructor:</strong> {course.instructor_name}</p>
                  <p style={{ margin: '4px 0' }}><strong>Students:</strong> {course.enrollment_count || 0}</p>
                  <p style={{ margin: '4px 0' }}><strong>Lessons:</strong> {course.lesson_count || 0}</p>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span className={`badge ${course.published ? 'badge-success' : 'badge-warning'}`}>
                    {course.published ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => handleViewCourse(course.id)}
                    style={{ flex: 1 }}
                  >
                    <Info size={14} style={{ marginRight: '4px' }} /> View
                  </button>
                  <button
                    className={`btn btn-sm ${course.published ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => handleToggleCourse(course.id, !course.published)}
                    style={{ flex: 1 }}
                  >
                    {course.published ? <><EyeOff size={14} style={{ marginRight: '4px' }} /> Deactivate</> : <><Eye size={14} style={{ marginRight: '4px' }} /> Activate</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'instructors' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Courses</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {instructors.map(instructor => (
                <tr key={instructor.id}>
                  <td>{instructor.id}</td>
                  <td>{instructor.full_name}</td>
                  <td>{instructor.email}</td>
                  <td>{instructor.course_count || 0}</td>
                  <td>
                    <span className={`badge ${instructor.is_approved ? 'badge-success' : 'badge-warning'}`}>
                      {instructor.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    {!instructor.is_approved && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleApproveInstructor(instructor.id, true)}
                        title="Approve"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                    )}
                    {instructor.is_approved && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleApproveInstructor(instructor.id, false)}
                        title="Revoke Access"
                      >
                        <XCircle size={14} /> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'messages' && (
        <div>
          <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '16px' }}>Send Message to Instructor</h3>
            <form onSubmit={handleSendMessage}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Select Instructor</label>
                <select
                  value={messageForm.instructor_id}
                  onChange={(e) => setMessageForm({ ...messageForm, instructor_id: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  required
                >
                  <option value="">-- Select Instructor --</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.full_name} ({instructor.email})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Message</label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', minHeight: '100px' }}
                  placeholder="Type your message here..."
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={sendingMessage}>
                <Send size={16} style={{ marginRight: '6px' }} />
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <h3 style={{ marginBottom: '16px' }}>Messages Sent to Instructors</h3>
          <div style={{ overflowX: 'auto', marginBottom: '32px' }}>
            <table className="data-table">
              <thead>
                <tr><th>To</th><th>Message</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {messages.filter(m => m.from_admin).length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No messages sent yet</td></tr>
                ) : (
                  messages.filter(m => m.from_admin).map(message => (
                    <tr key={message.id}>
                      <td>{message.instructor_name}</td>
                      <td>{message.message}</td>
                      <td>{new Date(message.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${message.is_completed ? 'badge-success' : 'badge-warning'}`}>
                          {message.is_completed ? '✓ Seen' : 'Sent'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginBottom: '16px' }}>Messages from Instructors</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>From</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {messages.filter(m => !m.from_admin).length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No messages yet</td></tr>
                ) : (
                  messages.filter(m => !m.from_admin).map(message => (
                    <tr key={message.id} style={{ backgroundColor: message.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.1)' }}>
                      <td>{message.instructor_name}</td>
                      <td>{message.message}</td>
                      <td>{new Date(message.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${message.is_read ? 'badge-success' : 'badge-warning'}`}>
                          {message.is_read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td>
                        {!message.is_read && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleMarkMessageRead(message.id)}
                          >
                            Mark as Read
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCourse && courseDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={handleCloseCourseDetails}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid var(--border-color)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>{courseDetails.course?.title}</h2>
              <button onClick={handleCloseCourseDetails} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Instructor:</strong> {courseDetails.course?.instructor_name}</p>
              <p><strong>Status:</strong> <span className={`badge ${courseDetails.course?.published ? 'badge-success' : 'badge-warning'}`}>{courseDetails.course?.published ? 'Active' : 'Inactive'}</span></p>
              <p><strong>Lessons:</strong> {courseDetails.lessons?.length || 0}</p>
              <p><strong>Access:</strong> {courseDetails.course?.access}</p>
              {courseDetails.course?.price > 0 && <p><strong>Price:</strong> ${courseDetails.course?.price}</p>}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4>Description</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{courseDetails.course?.description}</p>
            </div>

            {courseDetails.lessons && courseDetails.lessons.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4>Lessons ({courseDetails.lessons.length})</h4>
                <ul style={{ marginLeft: '20px', fontSize: '0.9rem' }}>
                  {courseDetails.lessons.map((lesson, idx) => (
                    <li key={lesson.id}>{idx + 1}. {lesson.title} <span style={{ color: 'var(--text-muted)' }}>({lesson.type}, {lesson.duration} min)</span></li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleCloseCourseDetails}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={handleCloseEnrollments}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid var(--border-color)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>User Enrollments</h2>
              <button onClick={handleCloseEnrollments} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            {userEnrollments.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>No enrollments found</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {userEnrollments.map(enrollment => (
                    <tr key={enrollment.id}>
                      <td>{enrollment.course_title}</td>
                      <td>{enrollment.progress_percentage}%</td>
                      <td>
                        <span className={`badge ${enrollment.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${enrollment.is_paid ? 'badge-success' : 'badge-danger'}`}>
                          {enrollment.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td>{enrollment.deadline ? new Date(enrollment.deadline).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button
              onClick={handleCloseEnrollments}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
