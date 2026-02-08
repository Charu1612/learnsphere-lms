import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu, X, CheckCircle, Circle, Lock, Download, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BadgeNotification from '../../components/BadgeNotification';
import CelebrationModal from '../../components/CelebrationModal';
import '../../styles/LessonPlayer.css';

export default function LessonPlayer() {
  const { courseId, lessonId } = useParams();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [progress, setProgress] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseData();
    fetchLessonData();
    markLessonStarted();
  }, [lessonId]);

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`/api/learner/courses/${courseId}`, { credentials: 'include' });
      const data = await response.json();
      setCourse(data.course);
      setLessons(data.course.lessons || []);
      
      // Build progress map
      const progressMap = {};
      (data.course.completed_lessons || []).forEach(lid => {
        progressMap[lid] = 'completed';
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const fetchLessonData = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, { credentials: 'include' });
      const data = await response.json();
      setCurrentLesson(data.lesson);
      
      // Fetch attachments
      const attachRes = await fetch(`/api/lessons/${lessonId}/attachments`);
      const attachData = await attachRes.json();
      setAttachments(attachData.attachments || []);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonStarted = async () => {
    try {
      await fetch(`/api/learner/lessons/${lessonId}/start`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error marking lesson started:', error);
    }
  };

  const markLessonCompleted = async () => {
    try {
      const response = await fetch(`/api/learner/lessons/${lessonId}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          marks: 10 // Each lesson completion gives 10 marks
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress({ ...progress, [lessonId]: 'completed' });
        
        // Check if course was completed (reached 100%)
        if (data.course_completed && data.certificate) {
          // Fetch full certificate details
          const certResponse = await fetch(`/api/learner/certificates/${data.certificate.id}`, {
            credentials: 'include'
          });
          const certData = await certResponse.json();
          setCertificate(certData.certificate);
          setShowCelebration(true);
        } else {
          alert('✅ Lesson completed! +10 marks earned');
        }
        
        // Check if badge was earned
        if (data.badge_earned) {
          setEarnedBadge(data.badge);
          setShowBadgeNotification(true);
        }
        
        // Refresh course data to update progress
        fetchCourseData();
      }
    } catch (error) {
      console.error('Error marking lesson completed:', error);
    }
  };

  const handleDownloadCertificate = () => {
    if (!certificate || !course) return;
    
    // Calculate rank based on completion time and performance
    const rank = certificate.grade || 'A';
    const rankEmoji = rank === 'A+' ? '🏆' : rank === 'A' ? '🥇' : rank === 'B' ? '🥈' : '🥉';
    
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${certificate.certificate_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
          }
          .certificate-container {
            background: white;
            padding: 60px 80px;
            border: 15px solid #FFD700;
            border-radius: 20px;
            max-width: 900px;
            width: 100%;
            box-shadow: 0 30px 80px rgba(0,0,0,0.3);
            position: relative;
          }
          .certificate-container::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 2px solid #FFD700;
            border-radius: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .logo {
            font-size: 4rem;
            margin-bottom: 10px;
          }
          .title {
            font-size: 3.5rem;
            color: #1a1a1a;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 3px;
          }
          .subtitle {
            font-size: 1.3rem;
            color: #666;
            font-style: italic;
          }
          .content {
            text-align: center;
            margin: 50px 0;
          }
          .presented-to {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 20px;
          }
          .student-name {
            font-size: 3rem;
            color: #667eea;
            font-weight: bold;
            margin: 20px 0;
            text-decoration: underline;
            text-decoration-color: #FFD700;
            text-decoration-thickness: 3px;
          }
          .completion-text {
            font-size: 1.2rem;
            color: #666;
            margin: 30px 0 20px 0;
          }
          .course-title {
            font-size: 2.2rem;
            color: #1a1a1a;
            font-weight: bold;
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 10px;
          }
          .rank-section {
            margin: 40px 0;
            padding: 25px;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 15px;
            border: 3px solid #FFD700;
          }
          .rank-title {
            font-size: 1.5rem;
            color: #92400e;
            margin-bottom: 10px;
          }
          .rank-value {
            font-size: 4rem;
            color: #92400e;
            font-weight: bold;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
          }
          .footer-item {
            text-align: center;
            flex: 1;
          }
          .footer-label {
            font-size: 0.9rem;
            color: #999;
            margin-bottom: 5px;
          }
          .footer-value {
            font-size: 1.1rem;
            color: #333;
            font-weight: bold;
          }
          .signature-line {
            border-top: 2px solid #333;
            width: 200px;
            margin: 10px auto 5px auto;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8rem;
            color: rgba(102, 126, 234, 0.05);
            font-weight: bold;
            z-index: 0;
            pointer-events: none;
          }
          @media print {
            body { background: white; padding: 0; }
            .certificate-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">CERTIFIED</div>
        <div class="certificate-container">
          <div class="header">
            <div class="logo">🎓</div>
            <h1 class="title">Certificate of Completion</h1>
            <p class="subtitle">LearnSphere - Your Gateway to Knowledge</p>
          </div>

          <div class="content">
            <p class="presented-to">This certificate is proudly presented to</p>
            <h2 class="student-name">${user?.full_name || 'Student Name'}</h2>
            <p class="completion-text">for successfully completing the course</p>
            <div class="course-title">${course?.title || 'Course Title'}</div>

            <div class="rank-section">
              <div class="rank-title">Achievement Rank</div>
              <div class="rank-value">${rankEmoji} ${rank}</div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-item">
              <div class="footer-label">Certificate Number</div>
              <div class="footer-value">${certificate.certificate_number}</div>
            </div>
            <div class="footer-item">
              <div class="footer-label">Issue Date</div>
              <div class="footer-value">${new Date(certificate.issued_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="footer-item">
              <div class="footer-label">Instructor</div>
              <div class="signature-line"></div>
              <div class="footer-value">${course?.instructor_name || 'Instructor'}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate-${certificate.certificate_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Mark as downloaded
    fetch(`/api/learner/certificates/${certificate.id}/download`, {
      method: 'PUT',
      credentials: 'include'
    });
  };

  const goToNextLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === parseInt(lessonId));
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
    } else {
      alert('🎉 You have completed all lessons!');
      navigate(`/courses/${courseId}`);
    }
  };

  const goToPreviousLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === parseInt(lessonId));
    if (currentIndex > 0) {
      const prevLesson = lessons[currentIndex - 1];
      navigate(`/courses/${courseId}/lessons/${prevLesson.id}`);
    }
  };

  const getLessonStatus = (lesson) => {
    if (progress[lesson.id] === 'completed') return 'completed';
    if (lesson.id === parseInt(lessonId)) return 'current';
    return 'locked';
  };

  const renderContent = () => {
    if (!currentLesson) return null;

    switch (currentLesson.content_type) {
      case 'video':
        return (
          <div className="video-container">
            {currentLesson.video_url ? (
              <iframe
                src={currentLesson.video_url.replace('watch?v=', 'embed/')}
                title={currentLesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '500px', borderRadius: '8px' }}
              />
            ) : (
              <div className="no-video">No video available</div>
            )}
          </div>
        );
      
      case 'document':
        return (
          <div className="document-container">
            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
          </div>
        );
      
      case 'image':
        return (
          <div className="image-container">
            <img src={currentLesson.video_url} alt={currentLesson.title} style={{ maxWidth: '100%', borderRadius: '8px' }} />
          </div>
        );
      
      case 'quiz':
        return (
          <div className="quiz-intro">
            <h2>📝 Quiz Time!</h2>
            <p>Ready to test your knowledge?</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/courses/${courseId}/lessons/${lessonId}/quiz`)}
            >
              Start Quiz
            </button>
          </div>
        );
      
      default:
        return (
          <div className="text-content">
            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
          </div>
        );
    }
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  return (
    <div className="lesson-player">
      {/* Badge Notification */}
      {showBadgeNotification && earnedBadge && (
        <BadgeNotification
          badge={earnedBadge}
          onClose={() => setShowBadgeNotification(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`lesson-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h3>{course?.title}</h3>
          <div className="progress-badge">
            {course?.progress_percentage || 0}% Complete
          </div>
        </div>

        <div className="lessons-list">
          {lessons.map((lesson, index) => {
            const status = getLessonStatus(lesson);
            return (
              <div
                key={lesson.id}
                className={`lesson-item ${status}`}
                onClick={() => status !== 'locked' && navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
              >
                <div className="lesson-icon">
                  {status === 'completed' && <CheckCircle size={20} color="#10b981" />}
                  {status === 'current' && <Circle size={20} color="#3b82f6" />}
                  {status === 'locked' && <Lock size={20} color="#9ca3af" />}
                </div>
                <div className="lesson-info">
                  <div className="lesson-title">{lesson.title}</div>
                  <div className="lesson-meta">
                    {lesson.duration} min • {lesson.content_type}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="attachments-section">
            <h4>📎 Attachments</h4>
            {attachments.map(attachment => (
              <a
                key={attachment.id}
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-item"
              >
                <FileText size={16} />
                <span>{attachment.file_name}</span>
                <Download size={14} />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="lesson-content">
        {/* Top Bar */}
        <div className="lesson-topbar">
          <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/courses/${courseId}`)}>
            ← Back to Course
          </button>
        </div>

        {/* Lesson Header */}
        <div className="lesson-header">
          <h1>{currentLesson?.title}</h1>
          {currentLesson?.duration && (
            <span className="duration-badge">⏱️ {currentLesson.duration} minutes</span>
          )}
        </div>

        {/* Content Viewer */}
        <div className="content-viewer">
          {renderContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="lesson-navigation">
          <button
            className="btn btn-secondary"
            onClick={goToPreviousLesson}
            disabled={lessons.findIndex(l => l.id === parseInt(lessonId)) === 0}
          >
            <ChevronLeft size={20} />
            Previous Lesson
          </button>

          <button
            className="btn btn-success"
            onClick={markLessonCompleted}
            disabled={progress[lessonId] === 'completed'}
          >
            {progress[lessonId] === 'completed' ? '✓ Completed' : 'Mark as Complete'}
          </button>

          <button
            className="btn btn-primary"
            onClick={goToNextLesson}
          >
            Next Lesson
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Celebration Modal for Course Completion */}
      {showCelebration && certificate && (
        <CelebrationModal
          certificate={certificate}
          course={course}
          onClose={() => {
            setShowCelebration(false);
            navigate('/achievements');
          }}
          onDownload={handleDownloadCertificate}
        />
      )}
    </div>
  );
}
