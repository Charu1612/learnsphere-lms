import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, FileText, Image, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Quiz from './Quiz';

export default function LessonPlayer() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const fetchLesson = useCallback(() => {
    setLoading(true);
    fetch(`/api/learn/${courseId}/${lessonId}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(d => {
        setLesson(d.lesson);
        setAllLessons(d.all_lessons || []);
        setProgressMap(d.progress || {});
        setQuiz(d.quiz);
      })
      .catch(() => navigate('/my-courses'))
      .finally(() => setLoading(false));
  }, [courseId, lessonId, navigate]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  const currentIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const markComplete = async () => {
    setCompleting(true);
    try {
      await fetch(`/api/learn/${courseId}/${lessonId}/complete`, {
        method: 'POST',
        credentials: 'include',
      });
      setProgressMap(prev => ({ ...prev, [parseInt(lessonId)]: 'completed' }));
    } catch {}
    setCompleting(false);
  };

  const isCompleted = progressMap[parseInt(lessonId)] === 'completed';

  const typeIcon = (type) => {
    switch (type) {
      case 'video': return <BookOpen size={16} />;
      case 'document': return <FileText size={16} />;
      case 'image': return <Image size={16} />;
      case 'quiz': return <HelpCircle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;
  if (!lesson) return <div className="empty-state"><h3>Lesson not found</h3></div>;

  return (
    <div className="lesson-layout">
      <div className="lesson-sidebar">
        <Link to={`/courses/${courseId}`} className="text-sm text-muted" style={{ display: 'block', marginBottom: 16 }}>
          &larr; Back to Course
        </Link>
        <div className="lesson-list">
          {allLessons.map((l, i) => (
            <div
              key={l.id}
              className={`lesson-item ${l.id === parseInt(lessonId) ? 'active' : ''}`}
              onClick={() => navigate(`/learn/${courseId}/${l.id}`)}
              style={{ padding: 12 }}
            >
              {progressMap[l.id] === 'completed' ? (
                <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
              ) : (
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{typeIcon(l.lesson_type)}</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: l.id === parseInt(lessonId) ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.duration || 5} min</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lesson-content">
        <div style={{ marginBottom: 24 }}>
          <div className="flex-between">
            <div>
              <div className="text-sm text-muted mb-4">Lesson {currentIndex + 1} of {allLessons.length}</div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{lesson.title}</h1>
            </div>
            {isCompleted && (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={14} /> Completed
              </span>
            )}
          </div>
        </div>

        {lesson.lesson_type === 'quiz' && quiz ? (
          <Quiz quiz={quiz} courseId={courseId} lessonId={lessonId} onComplete={markComplete} />
        ) : (
          <div>
            <div dangerouslySetInnerHTML={{ __html: lesson.content }} style={{ lineHeight: 1.8, fontSize: '1rem' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
          {prevLesson ? (
            <button className="btn btn-secondary" onClick={() => navigate(`/learn/${courseId}/${prevLesson.id}`)}>
              <ChevronLeft size={18} /> Previous
            </button>
          ) : <div />}
          
          <div style={{ display: 'flex', gap: 12 }}>
            {!isCompleted && lesson.lesson_type !== 'quiz' && (
              <button className="btn btn-success" onClick={markComplete} disabled={completing}>
                {completing ? <span className="inline-loader" /> : <><CheckCircle size={18} /> Mark Complete</>}
              </button>
            )}
          </div>

          {nextLesson ? (
            <button className="btn btn-primary" onClick={() => navigate(`/learn/${courseId}/${nextLesson.id}`)}>
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <Link to={`/courses/${courseId}`} className="btn btn-primary">
              Back to Course
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
