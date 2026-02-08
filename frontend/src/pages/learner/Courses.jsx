import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Courses.css';

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState(['All']);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses/published');
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();
      setCourses(data.courses || []);
      setFilteredCourses(data.courses || []);
      
      // Extract unique tags
      const allTags = new Set(['All']);
      data.courses?.forEach(course => {
        course.tags?.forEach(tag => allTags.add(tag));
      });
      setTags(Array.from(allTags));
    } catch (err) {
      console.log('Using mock courses');
      // Mock data
      const mockCourses = [
        {
          id: 1,
          title: 'React Fundamentals',
          description: 'Learn the basics of React.js and build interactive web applications',
          image: 'https://via.placeholder.com/300x200?text=React+Fundamentals',
          instructor: 'John Doe',
          rating: 4.8,
          reviews: 245,
          enrolledCount: 1250,
          totalLessons: 12,
          tags: ['React', 'JavaScript', 'Web Development'],
          level: 'Beginner',
          price: null
        },
        {
          id: 2,
          title: 'Advanced JavaScript',
          description: 'Master advanced JavaScript concepts and ES6+ features',
          image: 'https://via.placeholder.com/300x200?text=Advanced+JavaScript',
          instructor: 'Jane Smith',
          rating: 4.9,
          reviews: 189,
          enrolledCount: 890,
          totalLessons: 15,
          tags: ['JavaScript', 'Web Development', 'Programming'],
          level: 'Advanced',
          price: null
        },
        {
          id: 3,
          title: 'Full Stack Web Development',
          description: 'Build complete web applications from frontend to backend',
          image: 'https://via.placeholder.com/300x200?text=Full+Stack+Web+Dev',
          instructor: 'Mike Johnson',
          rating: 4.7,
          reviews: 312,
          enrolledCount: 2100,
          totalLessons: 20,
          tags: ['Web Development', 'Full Stack', 'Backend'],
          level: 'Intermediate',
          price: null
        },
        {
          id: 4,
          title: 'Python for Data Science',
          description: 'Learn Python and data analysis with pandas, numpy, and matplotlib',
          image: 'https://via.placeholder.com/300x200?text=Python+Data+Science',
          instructor: 'Sarah Williams',
          rating: 4.6,
          reviews: 278,
          enrolledCount: 1567,
          totalLessons: 18,
          tags: ['Python', 'Data Science', 'Programming'],
          level: 'Intermediate',
          price: null
        },
        {
          id: 5,
          title: 'UI/UX Design Principles',
          description: 'Master the principles of user interface and user experience design',
          image: 'https://via.placeholder.com/300x200?text=UI+UX+Design',
          instructor: 'Emma Brown',
          rating: 4.5,
          reviews: 156,
          enrolledCount: 756,
          totalLessons: 14,
          tags: ['Design', 'UI/UX', 'Creative'],
          level: 'Beginner',
          price: null
        },
        {
          id: 6,
          title: 'Node.js Backend Development',
          description: 'Build scalable backend applications with Node.js and Express',
          image: 'https://via.placeholder.com/300x200?text=Node.js+Backend',
          instructor: 'David Lee',
          rating: 4.7,
          reviews: 198,
          enrolledCount: 1023,
          totalLessons: 16,
          tags: ['Node.js', 'Backend', 'JavaScript'],
          level: 'Intermediate',
          price: null
        }
      ];

      setCourses(mockCourses);
      setFilteredCourses(mockCourses);

      // Extract unique tags
      const allTags = new Set(['All']);
      mockCourses.forEach(course => {
        course.tags?.forEach(tag => allTags.add(tag));
      });
      setTags(Array.from(allTags));
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filtering
  useEffect(() => {
    let filtered = courses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tag
    if (selectedTag !== 'All') {
      filtered = filtered.filter(course =>
        course.tags?.includes(selectedTag)
      );
    }

    setFilteredCourses(filtered);
  }, [searchTerm, selectedTag, courses]);

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return <div className="loading">Loading courses...</div>;
  }

  return (
    <div className="courses-page">
      {/* Search and Filter Section */}
      <div className="courses-header">
        <h1>Explore Courses</h1>
        <p>Discover a wide range of courses to enhance your skills</p>

        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search courses by title or keyword..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* Tag Filter */}
        <div className="tag-filter">
          <span className="filter-label">Filter by category:</span>
          <div className="tags-container">
            {tags.map(tag => (
              <button
                key={tag}
                className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-container">
        {filteredCourses.length === 0 ? (
          <div className="no-courses">
            <p>No courses found matching your search.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="course-card"
                onClick={() => handleCourseClick(course.id)}
              >
                {/* Course Image */}
                <div className="course-image">
                  <img src={course.image} alt={course.title} />
                  <div className="course-overlay">
                    <button className="view-btn">View Course</button>
                  </div>
                </div>

                {/* Course Content */}
                <div className="course-content">
                  {/* Level Badge */}
                  <span className={`level-badge ${course.level?.toLowerCase()}`}>
                    {course.level}
                  </span>

                  {/* Title and Description */}
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-desc">{course.description}</p>

                  {/* Course Meta */}
                  <div className="course-meta">
                    <div className="meta-item">
                      <span className="meta-icon">⭐</span>
                      <span>{course.rating}</span>
                      <span className="reviews">({course.reviews})</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span>{course.enrolledCount}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📚</span>
                      <span>{course.totalLessons} lessons</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="course-tags">
                    {course.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {course.tags?.length > 2 && (
                      <span className="tag more">+{course.tags.length - 2}</span>
                    )}
                  </div>

                  {/* Instructor */}
                  <div className="instructor-section">
                    <span>by {course.instructor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
