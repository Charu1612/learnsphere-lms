import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, TrendingUp, Award, Clock, Play, ArrowRight, Star, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/LearnerHome.css';

export default function LearnerHome() {
  const [stats, setStats] = useState({ 
    courses: 0, 
    progress: 0, 
    points: 0, 
    badge: 'Newbie',
    completed: 0,
    inProgress: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const profileRes = await fetch('/api/learner/profile', { credentials: 'include' });
      const profileData = await profileRes.json();
      
      setStats({
        courses: profileData.profile?.total_courses || 0,
        progress: 0,
        points: profileData.profile?.total_points || 0,
        badge: profileData.profile?.badge_level || 'Newbie',
        completed: profileData.profile?.completed_courses || 0,
        inProgress: profileData.profile?.in_progress_courses || 0
      });

      // Fetch my courses
      const coursesRes = await fetch('/api/learner/my-courses', { credentials: 'include' });
      const coursesData = await coursesRes.json();
      setRecentCourses((coursesData.courses || []).slice(0, 3));

      // Fetch recommended courses
      const recRes = await fetch('/api/learner/courses', { credentials: 'include' });
      const recData = await recRes.json();
      setRecommendedCourses((recData.courses || []).filter(c => !c.enrolled).slice(0, 6));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="learner-home">
      {/* Hero Section */}
      <div className="hero-welcome">
        <div className="hero-content">
          <div className="welcome-text animate-slide-up">
            <h1>Welcome back, {user?.full_name || 'Learner'}! 👋</h1>
            <p>Continue your learning journey and achieve your goals</p>
          </div>

          <div className="stats-cards animate-fade-in">
            <div className="stat-card card-1">
              <div className="stat-icon">
                <BookOpen size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.courses}</div>
                <div className="stat-label">Total Courses</div>
              </div>
            </div>

            <div className="stat-card card-2">
              <div className="stat-icon">
                <TrendingUp size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>

            <div className="stat-card card-3">
              <div className="stat-icon">
                <Award size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>

            <div className="stat-card card-4">
              <div className="stat-icon">
                <Zap size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.points}</div>
                <div className="stat-label">Total Points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="floating-elements">
          <div className="float-element element-1">📚</div>
          <div className="float-element element-2">🎯</div>
          <div className="float-element element-3">⭐</div>
          <div className="float-element element-4">🚀</div>
          <div className="float-element element-5">💡</div>
        </div>
      </div>

      {/* Continue Learning Section */}
      {recentCourses.length > 0 && (
        <div className="section continue-learning animate-slide-up-delay">
          <div className="section-header">
            <h2>📖 Continue Learning</h2>
            <button className="btn-link" onClick={() => navigate('/my-courses')}>
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="courses-grid">
            {recentCourses.map(course => (
              <div
                key={course.id}
                className="course-card hover-lift"
                onClick={() => navigate(`/course/${course.id}/study-plan`)}
              >
                <div className="course-image">
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <BookOpen size={64} color="white" />
                    </div>
                  )}
                  <div className="progress-overlay">
                    <div className="progress-circle">
                      <svg viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeDasharray={`${course.progress_percentage || 0}, 100`}
                        />
                      </svg>
                      <span className="progress-text">{course.progress_percentage || 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="course-content">
                  <h3>{course.title}</h3>
                  <div className="course-meta">
                    <span><Clock size={14} /> {course.total_lessons || 0} lessons</span>
                  </div>
                  <button className="btn-continue">
                    <Play size={16} />
                    Continue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Courses */}
      <div className="section recommended-courses animate-slide-up-delay-2">
        <div className="section-header">
          <h2>🌟 Recommended for You</h2>
          <button className="btn-link" onClick={() => navigate('/courses')}>
            Browse All <ArrowRight size={16} />
          </button>
        </div>

        <div className="courses-grid-large">
          {recommendedCourses.map((course, index) => (
            <div
              key={course.id}
              className="recommended-card hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <div className="card-badge">
                {course.access === 'free' ? (
                  <span className="badge-free">FREE</span>
                ) : (
                  <span className="badge-price">${course.price}</span>
                )}
              </div>
              <div className="card-image">
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <BookOpen size={48} color="white" />
                  </div>
                )}
              </div>
              <div className="card-content">
                <h4>{course.title}</h4>
                <p>{course.short_description}</p>
                <div className="card-footer">
                  <div className="instructor">
                    <span>{course.instructor_name}</span>
                  </div>
                  {course.average_rating > 0 && (
                    <div className="rating">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{course.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions animate-fade-in-delay">
        <div className="action-card" onClick={() => navigate('/courses')}>
          <BookOpen size={32} />
          <h3>Browse Courses</h3>
          <p>Explore our course library</p>
        </div>
        <div className="action-card" onClick={() => navigate('/my-courses')}>
          <TrendingUp size={32} />
          <h3>My Progress</h3>
          <p>Track your learning journey</p>
        </div>
        <div className="action-card">
          <Award size={32} />
          <h3>Achievements</h3>
          <p>View your badges & points</p>
        </div>
      </div>
    </div>
  );
}
