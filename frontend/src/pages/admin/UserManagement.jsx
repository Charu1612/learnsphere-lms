import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        'http://localhost:8000/api/admin/users/all',
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      setUsers(response.data.users || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
      setLoading(false);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        `http://localhost:8000/api/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setUsers(users.map(user => 
        user.user_id === userId 
          ? response.data 
          : user
      ));
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(
        `http://localhost:8000/api/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setUsers(users.filter(user => user.user_id !== userId));
      alert('User deleted successfully');
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return '#e74c3c';
      case 'instructor': return '#f39c12';
      case 'learner': return '#3498db';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return <div className="user-management loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>👥 User Management</h1>
        <div className="header-stats">
          <span className="stat">Total: {users.length}</span>
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
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.user_id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar" style={{background: getRoleColor(user.role)}}>
                      {user.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="info">
                      <p className="name">{user.user_name}</p>
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
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="center">
                  {user.last_login 
                    ? new Date(user.last_login).toLocaleDateString()
                    : 'Never'
                  }
                </td>
                <td>
                  <div className="action-buttons">
                    <select 
                      className="role-select"
                      value={user.role}
                      onChange={(e) => changeUserRole(user.user_id, e.target.value)}
                    >
                      <option value="learner">→ Learner</option>
                      <option value="instructor">→ Instructor</option>
                      <option value="admin">→ Admin</option>
                    </select>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteUser(user.user_id)}
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

export default UserManagement;
