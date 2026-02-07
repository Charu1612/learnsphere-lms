import { useState, useEffect } from 'react';
import { Users, BookOpen, Shield, Eye, EyeOff } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/courses', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([u, c]) => {
        setUsers(u.users || []);
        setCourses(c.courses || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {}
  };

  const handleToggleCourse = async (courseId, published) => {
    try {
      await fetch(`/api/admin/courses/${courseId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ published }),
      });
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, published } : c));
    } catch {}
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
          <div className="stat-value">{users.filter(u => u.role === 'instructor').length}</div>
          <div className="stat-label">Instructors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{courses.length}</div>
          <div className="stat-label">Total Courses</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Users
        </button>
        <button className={`tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
          <BookOpen size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Courses
        </button>
      </div>

      {activeTab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-warning' : user.role === 'instructor' ? 'badge-info' : 'badge-success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.8125rem', width: 'auto' }}
                    >
                      <option value="learner">Learner</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'courses' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Instructor</th><th>Students</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{course.instructor_name}</td>
                  <td>{course.enrollment_count || 0}</td>
                  <td>
                    <span className={`badge ${course.published ? 'badge-success' : 'badge-warning'}`}>
                      {course.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${course.published ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => handleToggleCourse(course.id, !course.published)}
                    >
                      {course.published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
