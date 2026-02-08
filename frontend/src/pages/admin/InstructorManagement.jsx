import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InstructorManagement.css';

function InstructorManagement() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        'http://localhost:8000/api/admin/instructors',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInstructors(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load instructors');
      setLoading(false);
    }
  };

  const toggleInstructorStatus = async (instructorId, currentStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        `http://localhost:8000/api/admin/instructors/${instructorId}/status`,
        { is_active: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setInstructors(instructors.map(inst => 
        inst.instructor_id === instructorId 
          ? response.data 
          : inst
      ));
    } catch (err) {
      alert('Failed to update instructor status');
    }
  };

  const inviteInstructor = async () => {
    if (!inviteEmail) {
      alert('Please enter an email address');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        'http://localhost:8000/api/admin/instructors/invite',
        { email: inviteEmail },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setInviteEmail('');
      setShowInviteModal(false);
      alert('Invitation sent successfully!');
      fetchInstructors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const filteredInstructors = instructors.filter(inst => {
    const matchesSearch = inst.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inst.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' ? inst.is_active : !inst.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="instructor-management loading">Loading instructors...</div>;
  }

  return (
    <div className="instructor-management">
      <div className="page-header">
        <h1>👨‍🏫 Instructor Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowInviteModal(true)}
        >
          ➕ Invite Instructor
        </button>
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Instructors</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Stats */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{instructors.length}</div>
          <div className="stat-label">Total Instructors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{instructors.filter(i => i.is_active).length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{instructors.filter(i => !i.is_active).length}</div>
          <div className="stat-label">Inactive</div>
        </div>
      </div>

      {/* Instructors Table */}
      <div className="table-container">
        <table className="instructors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Courses</th>
              <th>Students</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstructors.map(instructor => (
              <tr key={instructor.instructor_id} className={instructor.is_active ? 'active' : 'inactive'}>
                <td>
                  <div className="instructor-cell">
                    <div className="avatar">{instructor.user_name?.charAt(0).toUpperCase()}</div>
                    <div className="info">
                      <p className="name">{instructor.user_name}</p>
                    </div>
                  </div>
                </td>
                <td>{instructor.email}</td>
                <td className="center">{instructor.total_courses || 0}</td>
                <td className="center">{instructor.total_students || 0}</td>
                <td>{new Date(instructor.created_at).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${instructor.is_active ? 'active' : 'inactive'}`}>
                    {instructor.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className={`btn btn-sm ${instructor.is_active ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleInstructorStatus(instructor.instructor_id, instructor.is_active)}
                    >
                      {instructor.is_active ? '🔒 Deactivate' : '🔓 Activate'}
                    </button>
                    <button className="btn btn-sm">
                      📊 View Courses
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInstructors.length === 0 && (
          <div className="empty-state">
            <p>No instructors found</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Invite New Instructor</h2>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="instructor@example.com"
                onKeyPress={(e) => e.key === 'Enter' && inviteInstructor()}
              />
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={inviteInstructor}
              >
                📧 Send Invitation
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorManagement;
