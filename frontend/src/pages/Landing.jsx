import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Award, TrendingUp, Star, Play, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Landing.css';

export default function Landing() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ courses: 0, students: 0, instructors: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data.courses?.slice(0, 6) || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - you can create an endpoint for this
      setStats({
        courses: 15,
        students: 1250,
        instructors: 45
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title animate-fade-in">
              Learn Without Limits
            </h1>
            <p className="hero-subtitle animate-fade-in-delay">
              Discover thousands of courses from expert instructors. Build your skills, advance your career, and achieve your goals.
            </p>
            <div className="hero-buttons animate-fade-in-delay-2">
              {user ? (
                <button className="btn btn-primary btn-large" onClick={() => navigate('/courses')}>
                  Browse Courses
                  <ArrowRight size={20} />
                </button>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-large">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-large">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hero-image animate-slide-in">
            <div className="floating-card card-1">
              <BookOpen size={32} color="#3b82f6" />
              <div>
                <div className="card-title">15+ Courses</div>
                <div className="card-subtitle">Expert-led content</div>
              </div>
            </div>
            <div className="floating-card card-2">
              <Award size={32} color="#f59e0b" />
              <div>
                <div className="card-title">Earn Badges</div>
                <div className="card-subtitle">Track your progress</div>
              </div>
            </div>
            <div className="floating-card card-3">
              <Users size={32} color="#10b981" />
              <div>
                <div className="card-title">1000+ Students</div>
                <div className="card-subtitle">Join the community</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-icon">
              <BookOpen size={40} />
            </div>
            <div className="stat-number">{stats.courses}+</div>
            <div className="stat-label">Courses</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <Users size={40} />
            </div>
            <div className="stat-number">{stats.students}+</div>
            <div className="stat-label">Students</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <Award size={40} />
            </div>
            <div className="stat-number">{stats.instructors}+</div>
            <div className="stat-label">Instructors</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <TrendingUp size={40} />
            </div>
            <div className="stat-number">95%</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose LearnSphere?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Play size={32} />
            </div>
            <h3>Video Lessons</h3>
            <p>High-quality video content from industry experts with lifetime access</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <CheckCircle size={32} />
            </div>
            <h3>Interactive Quizzes</h3>
            <p>Test your knowledge with quizzes and earn points for each completion</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Award size={32} />
            </div>
            <h3>Earn Badges</h3>
            <p>Unlock achievements and badges as you progress through courses</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={32} />
            </div>
            <h3>Track Progress</h3>
            <p>Monitor your learning journey with detailed progress tracking</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Users size={32} />
            </div>
            <h3>Expert Instructors</h3>
            <p>Learn from experienced professionals in their respective fields</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Star size={32} />
            </div>
            <h3>Reviews & Ratings</h3>
            <p>Read reviews from other students to find the perfect course</p>
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="courses-section">
        <div className="section-header">
          <h2 className="section-title">Popular Courses</h2>
          <Link to="/courses" className="view-all-link">
            View All Courses <ArrowRight size={16} />
          </Link>
        </div>
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card" onClick={() => navigate(`/course/${course.id}`)}>
              <div className="course-image">
                <img src={course.image_url || 'https://via.placeholder.com/400x200'} alt={course.title} />
                {course.average_rating > 0 && (
                  <div className="course-rating">
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    <span>{course.average_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="course-content">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.short_description}</p>
                <div className="course-footer">
                  <div className="course-instructor">
                    <Users size={14} />
                    <span>{course.instructor_name}</span>
                  </div>
                  {course.price > 0 ? (
                    <div className="course-price">${course.price}</div>
                  ) : (
                    <div className="course-free">Free</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Learning?</h2>
          <p>Join thousands of students already learning on LearnSphere</p>
          {user ? (
            <button className="btn btn-primary btn-large" onClick={() => navigate('/courses')}>
              Explore Courses
            </button>
          ) : (
            <Link to="/signup" className="btn btn-primary btn-large">
              Sign Up Now - It's Free!
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
