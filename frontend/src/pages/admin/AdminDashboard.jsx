import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Admin Dashboard Component
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Fetch admin dashboard stats
      const response = await axios.get(
        'http://localhost:8000/api/admin/dashboard',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <div className="error-message">{error}</div>
        <button onClick={fetchAdminStats}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, Admin! Here's an overview of your platform.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total-courses">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Total Courses</h3>
            <p className="stat-value">{stats?.total_courses || 0}</p>
          </div>
          <button onClick={() => navigate('/admin/courses')}>View</button>
        </div>

        <div className="stat-card total-instructors">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>Instructors</h3>
            <p className="stat-value">{stats?.total_instructors || 0}</p>
          </div>
          <button onClick={() => navigate('/admin/instructors')}>Manage</button>
        </div>

        <div className="stat-card total-learners">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Learners</h3>
            <p className="stat-value">{stats?.total_learners || 0}</p>
          </div>
          <button onClick={() => navigate('/admin/users')}>Manage</button>
        </div>

        <div className="stat-card total-enrollments">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Enrollments</h3>
            <p className="stat-value">{stats?.total_enrollments || 0}</p>
          </div>
          <button onClick={() => navigate('/admin/reports')}>Reports</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/admin/courses')}
          >
            ➕ Manage Courses
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/instructors')}
          >
            👨‍🏫 Manage Instructors
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/users')}
          >
            👥 Manage Users
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/reports')}
          >
            📊 View Reports
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <p>Activity logs will appear here...</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
