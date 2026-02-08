import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReportingDashboard.css';

function ReportingDashboard({ isAdmin = false }) {
  const [reportData, setReportData] = useState({
    courses: [],
    stats: {},
    timeline: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('enrollments');
  const [selectedColumns, setSelectedColumns] = useState({
    course_title: true,
    instructor: true,
    enrollments: true,
    completion_rate: true,
    avg_rating: true,
    revenue: isAdmin
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = isAdmin 
        ? 'http://localhost:8000/api/admin/reports'
        : 'http://localhost:8000/api/instructor/reports';

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReportData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
      setLoading(false);
    }
  };

  const toggleColumn = (column) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const filteredAndSortedCourses = reportData.courses
    .filter(course => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'popular') return course.enrollments > 50;
      if (filterStatus === 'underperforming') return course.completion_rate < 50;
      return true;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'enrollments': return b.enrollments - a.enrollments;
        case 'completion': return b.completion_rate - a.completion_rate;
        case 'rating': return b.avg_rating - a.avg_rating;
        default: return 0;
      }
    });

  if (loading) {
    return <div className="reporting-dashboard loading">Loading reports...</div>;
  }

  return (
    <div className="reporting-dashboard">
      <div className="page-header">
        <h1>📊 {isAdmin ? 'Platform' : 'My'} Reports</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Courses</div>
          <div className="metric-value">{reportData.stats.total_courses || 0}</div>
          <div className="metric-change">+{reportData.stats.courses_this_month || 0} this month</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Enrollments</div>
          <div className="metric-value">{reportData.stats.total_enrollments || 0}</div>
          <div className="metric-change">+{reportData.stats.enrollments_this_month || 0} this month</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Completion Rate</div>
          <div className="metric-value">{reportData.stats.avg_completion_rate || 0}%</div>
          <div className="metric-change">Target: 70%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Rating</div>
          <div className="metric-value">{reportData.stats.avg_rating || 0}/5</div>
          <div className="metric-change">⭐ {reportData.stats.five_star_courses || 0} 5-star courses</div>
        </div>
        {isAdmin && (
          <div className="metric-card">
            <div className="metric-label">Total Revenue</div>
            <div className="metric-value">${reportData.stats.total_revenue || 0}</div>
            <div className="metric-change">+${reportData.stats.revenue_this_month || 0} this month</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="filters">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Courses</option>
            <option value="popular">Popular (50+ enrollments)</option>
            <option value="underperforming">Underperforming (&lt;50% completion)</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="enrollments">Sort by Enrollments</option>
            <option value="completion">Sort by Completion Rate</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>

        <div className="column-selector">
          <button className="toggle-btn">⚙️ Columns</button>
          <div className="column-menu">
            <label>
              <input 
                type="checkbox" 
                checked={selectedColumns.course_title}
                onChange={() => toggleColumn('course_title')}
              />
              Course Title
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={selectedColumns.instructor}
                onChange={() => toggleColumn('instructor')}
              />
              Instructor
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={selectedColumns.enrollments}
                onChange={() => toggleColumn('enrollments')}
              />
              Enrollments
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={selectedColumns.completion_rate}
                onChange={() => toggleColumn('completion_rate')}
              />
              Completion Rate
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={selectedColumns.avg_rating}
                onChange={() => toggleColumn('avg_rating')}
              />
              Avg Rating
            </label>
            {isAdmin && (
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedColumns.revenue}
                  onChange={() => toggleColumn('revenue')}
                />
                Revenue
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="table-container">
        <table className="reports-table">
          <thead>
            <tr>
              {selectedColumns.course_title && <th>Course Title</th>}
              {selectedColumns.instructor && <th>Instructor</th>}
              {selectedColumns.enrollments && <th className="number">Enrollments</th>}
              {selectedColumns.completion_rate && <th className="number">Completion Rate</th>}
              {selectedColumns.avg_rating && <th className="number">Avg Rating</th>}
              {selectedColumns.revenue && isAdmin && <th className="number">Revenue</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCourses.map(course => (
              <tr key={course.course_id}>
                {selectedColumns.course_title && (
                  <td>
                    <div className="course-info">
                      <span className="course-title">{course.course_title}</span>
                    </div>
                  </td>
                )}
                {selectedColumns.instructor && (
                  <td>{course.instructor_name}</td>
                )}
                {selectedColumns.enrollments && (
                  <td className="number">
                    <span className="badge enrollments">{course.enrollments}</span>
                  </td>
                )}
                {selectedColumns.completion_rate && (
                  <td className="number">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{width: `${course.completion_rate}%`}}
                      ></div>
                      <span className="progress-label">{course.completion_rate}%</span>
                    </div>
                  </td>
                )}
                {selectedColumns.avg_rating && (
                  <td className="number">
                    <span className="rating">⭐ {course.avg_rating.toFixed(1)}</span>
                  </td>
                )}
                {selectedColumns.revenue && isAdmin && (
                  <td className="number">
                    <span className="revenue">${course.revenue || 0}</span>
                  </td>
                )}
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm">📊 View</button>
                    <button className="btn-sm">📥 Export</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedCourses.length === 0 && (
          <div className="empty-state">
            <p>No courses found matching your filters</p>
          </div>
        )}
      </div>

      {/* Timeline Chart */}
      {reportData.timeline && reportData.timeline.length > 0 && (
        <div className="timeline-section">
          <h3>Enrollments Over Time</h3>
          <div className="timeline-chart">
            {reportData.timeline.map((point, idx) => (
              <div key={idx} className="timeline-point">
                <div className="timeline-bar" style={{height: `${(point.enrollments / Math.max(...reportData.timeline.map(p => p.enrollments))) * 100}%`}}></div>
                <span className="timeline-label">{point.month}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportingDashboard;
