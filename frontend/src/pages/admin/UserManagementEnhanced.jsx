import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManagement.css';

const API_BASE = 'http://localhost:8000';

function UserManagementEnhanced() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE}/api/admin/users/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      setUsers(response.data.users || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users');
      setLoading(false);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_BASE}/api/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      alert('User role updated successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  const approveInstructor = async (userId) => {
    if (!window.confirm('Approve this instructor to create courses?')) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_BASE}/api/admin/users/${userId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_approved: true, approved_at: new Date().toISOString() }
          : user
      ));
      alert('Instructor approved successfully! They can now create courses.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve instructor');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(
        `${API_BASE}/api/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      setUsers(users.filter(user => user.id !== userId));
      alert('User deleted successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesApproval = filterApproval === 'all' || 
                           (filterApproval === 'approved' && user.is_approved) ||
                           (filterApproval === 'pending' && !user.is_approved && user.role === 'instructor');
    return matchesSearch && matchesRole && matchesApproval;
  });

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return '#e74c3c';
      case 'instructor': return '#f39c12';
      case 'learner': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const pendingInstructors = users.filter(u => u.role === 'instructor' && !u.is_approved).length;

  if (loading) {
    return <div className="user-management loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>👥 User Management</h1>
        <div className="header-stats">
          <span className="stat">Total: {users.length}</span>
          {pendingInstructors > 0 && (
            <span className="stat pending-badge">
              ⚠️ {pendingInstructors} Pending Approval{pendingInstructors > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="learner">Learner</option>
        </select>
        <select 
          value={filterApproval}
          onChange={(e) => setFilterApproval(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending Approval</option>
        </select>
      </div>

      {/* Role Stats */}
      <div className="role-stats">
        <div className="role-stat">
          <span className="role-label">Admin</span>
          <span className="role-count">{users.filter(u => u.role === 'admin').length}</span>
        </div>
        <div className="role-stat">
          <span className="role-label">Instructor</span>
          <span className="role-count">{users.filter(u => u.role === 'instructor').length}</span>
        </div>
        <div className="role-stat">
          <span className="role-label">Learner</span>
          <span className="role-count">{users.filter(u => u.role === 'learner').length}</span>
        </div>
        <div className="role-stat pending">
          <span className="role-label">Pending</span>
          <span className="role-count">{pendingInstructors}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar" style={{background: getRoleColor(user.role)}}>
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="info">
                      <p className="name">{user.full_name}</p>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span 
                    className="role-badge"
                    style={{background: getRoleColor(user.role) + '20', color: getRoleColor(user.role)}}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td>
                  {user.role === 'instructor' && (
                    user.is_approved ? (
                      <span className="status-badge approved">✓ Approved</span>
                    ) : (
                      <span className="status-badge pending">⏳ Pending</span>
                    )
                  )}
                  {user.role !== 'instructor' && (
                    <span className="status-badge active">Active</span>
                  )}
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="center">
                  {user.last_login 
                    ? new Date(user.last_login).toLocaleDateString()
                    : 'Never'
                  }
                </td>
                <td>
                  <div className="action-buttons">
                    {user.role === 'instructor' && !user.is_approved && (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => approveInstructor(user.id)}
                        title="Approve instructor to create courses"
                      >
                        ✓ Approve
                      </button>
                    )}
                    <select 
                      className="role-select"
                      value={user.role}
                      onChange={(e) => changeUserRole(user.id, e.target.value)}
                    >
                      <option value="learner">→ Learner</option>
                      <option value="instructor">→ Instructor</option>
                      <option value="admin">→ Admin</option>
                    </select>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteUser(user.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagementEnhanced;
