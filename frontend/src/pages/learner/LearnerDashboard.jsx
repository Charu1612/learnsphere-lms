import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/LearnerDashboard.css';

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    badgeLevel: 'Newbie',
    completedCourses: 0,
    inProgressCourses: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserCourses();
  }, [user, navigate]);

  const fetchUserCourses = async () => {
    try {
      setLoading(true);
      // API call to fetch user's courses
      const response = await fetch('/api/learner/my-courses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();
      setEnrolledCourses(data.courses || []);
      setUserStats({
        totalPoints: data.stats?.totalPoints || 0,
        badgeLevel: calculateBadge(data.stats?.totalPoints || 0),
        completedCourses: data.stats?.completedCourses || 0,
        inProgressCourses: data.stats?.inProgressCourses || 0
      });
    } catch (err) {
      console.log(err);
      // Mock data
      const mockCourses = [
        {
          id: 1,
          title: 'React Fundamentals',
          description: 'Learn React basics',
          image: 'https://via.placeholder.com/300x200?text=React',
          progress: 65,
          status: 'inProgress',
          lessonsCompleted: 8,
          totalLessons: 12,
          enrolledDate: '2024-01-15',
          startDate: '2024-01-20'
        },
        {
          id: 2,
          title: 'JavaScript Advanced',
          description: 'Master advanced JS',
          image: 'https://via.placeholder.com/300x200?text=JavaScript',
          progress: 100,
          status: 'completed',
          lessonsCompleted: 15,
          totalLessons: 15,
          enrolledDate: '2023-11-10',
          startDate: '2023-11-15',
          completedDate: '2024-01-10'
        }
      ];
      setEnrolledCourses(mockCourses);
      setUserStats({
        totalPoints: 450,
        badgeLevel: 'Achiever',
        completedCourses: 1,
        inProgressCourses: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateBadge = (points) => {
    if (points >= 120) return 'Master';
    if (points >= 100) return 'Expert';
    if (points >= 80) return 'Specialist';
    if (points >= 60) return 'Achiever';
    if (points >= 40) return 'Explorer';
    return 'Newbie';
  };

  const handleStartCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const filteredCourses = enrolledCourses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBadgeIcon = (badge) => {
    const badges = {
      'Newbie': '🌱',
      'Explorer': '🔍',
      'Achiever': '🏆',
      'Specialist': '⭐',
      'Expert': '👑',
      'Master': '💎'
    };
    return badges[badge] || '🏅';
  };

  if (!user) {
    return <div className="loading">Redirecting...</div>;
  }

  return (
    <div className="learner-dashboard">
      <div className="dashboard-header">
        <h1>My Courses</h1>
        <p>Continue your learning journey</p>
      </div>

      <div className="dashboard-container">
        {/* Profile Panel */}
        <div className="profile-panel">
          <div className="profile-card">
            <div className="profile-header">
              <div className="avatar">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="profile-info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="stats-section">
              <h4>Your Progress</h4>
              <div className="stat-item">
                <span className="stat-label">Total Points</span>
                <span className="stat-value">{userStats.totalPoints}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Badge Level</span>
                <span className="stat-value badge">
                  {getBadgeIcon(userStats.badgeLevel)} {userStats.badgeLevel}
                </span>
              </div>
            </div>

            <div className="stats-section">
              <h4>Courses</h4>
              <div className="stat-item">
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{userStats.inProgressCourses}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{userStats.completedCourses}</span>
              </div>
            </div>

            <div className="badge-levels">
              <h4>Badge Levels</h4>
              <div className="badges-grid">
                <div className="badge-info">
                  <span>🌱</span>
                  <small>Newbie (20)</small>
                </div>
                <div className="badge-info">
                  <span>🔍</span>
                  <small>Explorer (40)</small>
                </div>
                <div className="badge-info">
                  <span>🏆</span>
                  <small>Achiever (60)</small>
                </div>
                <div className="badge-info">
                  <span>⭐</span>
                  <small>Specialist (80)</small>
                </div>
                <div className="badge-info">
                  <span>👑</span>
                  <small>Expert (100)</small>
                </div>
                <div className="badge-info">
                  <span>💎</span>
                  <small>Master (120)</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="courses-section">
          <div className="section-header">
            <h2>Your Courses ({filteredCourses.length})</h2>
            <input
              type="text"
              placeholder="Search your courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading">Loading your courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="empty-state">
              <h3>No courses yet</h3>
              <p>Start learning by browsing available courses</p>
              <a href="/courses" className="btn-primary">Browse Courses</a>
            </div>
          ) : (
            <div className="courses-list">
              {filteredCourses.map(course => (
                <div key={course.id} className="course-row">
                  <div className="course-image-col">
                    <img src={course.image} alt={course.title} />
                  </div>

                  <div className="course-info-col">
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <div className="course-meta">
                      <span>📚 {course.lessonsCompleted}/{course.totalLessons} lessons</span>
                      <span>📅 Started: {new Date(course.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="course-progress-col">
                    <div className="progress-wrapper">
                      <div className="progress-value">{course.progress}%</div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
                      </div>
                    </div>
                    <span className={`status-badge status-${course.status}`}>
                      {course.status === 'inProgress' ? 'In Progress' : 'Completed'}
                    </span>
                  </div>

                  <div className="course-action-col">
                    <button
                      className={`btn ${course.progress === 100 ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleStartCourse(course.id)}
                    >
                      {course.progress === 100 ? 'Review' : 'Continue'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboard;
