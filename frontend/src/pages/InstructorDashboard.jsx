import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Users, BookOpen, List, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [students, setStudents] = useState([]);
  const [showStudents, setShowStudents] = useState(null);

  const [form, setForm] = useState({ title: '', short_description: '', full_description: '', image_url: '', tags: '', visibility: 'public', access: 'free', price: 0, published: false });
  const [lessonForm, setLessonForm] = useState({ title: '', lesson_type: 'document', content: '', duration: 0, order_index: 0 });
  const [quizForm, setQuizForm] = useState({ title: '', timer_seconds: 300, pass_score: 70 });
  const [questionForm, setQuestionForm] = useState({ prompt: '', options: ['', '', '', ''], correct_index: 0 });

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = () => {
    fetch('/api/instructor/courses', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCourses(d.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchLessons = (courseId) => {
    fetch(`/api/instructor/courses/${courseId}/lessons`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setLessons(d.lessons || []))
      .catch(() => {});
  };

  const fetchStudents = (courseId) => {
    fetch(`/api/instructor/courses/${courseId}/students`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setStudents(d.students || []))
      .catch(() => {});
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    const url = editingCourse ? `/api/instructor/courses/${editingCourse.id}` : '/api/instructor/courses';
    const method = editingCourse ? 'PUT' : 'POST';
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setEditingCourse(null);
      setForm({ title: '', short_description: '', full_description: '', image_url: '', tags: '', visibility: 'public', access: 'free', price: 0, published: false });
      fetchCourses();
    } catch {}
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    await fetch(`/api/instructor/courses/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchCourses();
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setForm({
      title: course.title, short_description: course.short_description || '', full_description: course.full_description || '',
      image_url: course.image_url || '', tags: course.tags || '', visibility: course.visibility || 'public',
      access: course.access || 'free', price: course.price || 0, published: course.published,
    });
    setShowForm(true);
  };

  const handleToggleExpand = (courseId) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    fetchLessons(courseId);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    const url = selectedLesson ? `/api/instructor/lessons/${selectedLesson.id}` : `/api/instructor/courses/${expandedCourse}/lessons`;
    const method = selectedLesson ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(lessonForm) });
    setShowLessonForm(false);
    setSelectedLesson(null);
    setLessonForm({ title: '', lesson_type: 'document', content: '', duration: 0, order_index: 0 });
    fetchLessons(expandedCourse);
  };

  const handleDeleteLesson = async (id) => {
    if (!confirm('Delete this lesson?')) return;
    await fetch(`/api/instructor/lessons/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchLessons(expandedCourse);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/instructor/lessons/${selectedLesson.id}/quiz`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify(quizForm),
    });
    const data = await res.json();
    setShowQuizForm(false);
    if (data.quiz) {
      setSelectedLesson({ ...selectedLesson, quizId: data.quiz.id });
    }
    fetchLessons(expandedCourse);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const quizId = selectedLesson?.quizId;
    if (!quizId) return;
    await fetch(`/api/instructor/quizzes/${quizId}/questions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ prompt: questionForm.prompt, options: questionForm.options.filter(o => o), correct_index: questionForm.correct_index }),
    });
    setQuestionForm({ prompt: '', options: ['', '', '', ''], correct_index: 0 });
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 className="section-title" style={{ margin: 0 }}>Instructor Dashboard</h1>
        <button className="btn btn-primary" onClick={() => { setEditingCourse(null); setForm({ title: '', short_description: '', full_description: '', image_url: '', tags: '', visibility: 'public', access: 'free', price: 0, published: false }); setShowForm(true); }}>
          <Plus size={18} /> New Course
        </button>
      </div>

      <div className="dashboard-grid mb-6">
        <div className="stat-card">
          <div className="stat-value">{courses.length}</div>
          <div className="stat-label">Total Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{courses.filter(c => c.published).length}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{courses.reduce((s, c) => s + (c.enrollment_count || 0), 0)}</div>
          <div className="stat-label">Total Students</div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
            <form onSubmit={handleSaveCourse}>
              <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label>Short Description</label><input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} /></div>
              <div className="form-group"><label>Full Description</label><textarea rows={4} value={form.full_description} onChange={e => setForm({ ...form, full_description: e.target.value })} /></div>
              <div className="form-group"><label>Image URL</label><input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
              <div className="form-group"><label>Tags (comma separated)</label><input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Visibility</label><select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}><option value="public">Public</option><option value="signed-in">Signed-in only</option></select></div>
                <div className="form-group"><label>Access</label><select value={form.access} onChange={e => setForm({ ...form, access: e.target.value })}><option value="free">Free</option><option value="paid">Paid</option></select></div>
              </div>
              {form.access === 'paid' && <div className="form-group"><label>Price ($)</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></div>}
              <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} style={{ width: 'auto' }} /> Publish immediately</label></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingCourse ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLessonForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowLessonForm(false); setSelectedLesson(null); } }}>
          <div className="modal">
            <h2>{selectedLesson ? 'Edit Lesson' : 'Add Lesson'}</h2>
            <form onSubmit={handleSaveLesson}>
              <div className="form-group"><label>Title</label><input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} required /></div>
              <div className="form-group"><label>Type</label><select value={lessonForm.lesson_type} onChange={e => setLessonForm({ ...lessonForm, lesson_type: e.target.value })}><option value="document">Document</option><option value="video">Video</option><option value="image">Image</option><option value="quiz">Quiz</option></select></div>
              <div className="form-group"><label>Content (HTML)</label><textarea rows={6} value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Duration (min)</label><input type="number" value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })} /></div>
                <div className="form-group"><label>Order</label><input type="number" value={lessonForm.order_index} onChange={e => setLessonForm({ ...lessonForm, order_index: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowLessonForm(false); setSelectedLesson(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{selectedLesson ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuizForm && selectedLesson && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowQuizForm(false); }}>
          <div className="modal">
            <h2>Create Quiz for: {selectedLesson.title}</h2>
            <form onSubmit={handleCreateQuiz}>
              <div className="form-group"><label>Quiz Title</label><input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Timer (seconds, 0=none)</label><input type="number" value={quizForm.timer_seconds} onChange={e => setQuizForm({ ...quizForm, timer_seconds: parseInt(e.target.value) || 0 })} /></div>
                <div className="form-group"><label>Pass Score (%)</label><input type="number" value={quizForm.pass_score} onChange={e => setQuizForm({ ...quizForm, pass_score: parseInt(e.target.value) || 70 })} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuizForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Quiz</button>
              </div>
            </form>

            {selectedLesson.quizId && (
              <div style={{ marginTop: 24, borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                <h3 style={{ marginBottom: 12 }}>Add Question</h3>
                <form onSubmit={handleAddQuestion}>
                  <div className="form-group"><label>Question</label><input value={questionForm.prompt} onChange={e => setQuestionForm({ ...questionForm, prompt: e.target.value })} required /></div>
                  {questionForm.options.map((opt, i) => (
                    <div className="form-group" key={i}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="radio" name="correct" checked={questionForm.correct_index === i} onChange={() => setQuestionForm({ ...questionForm, correct_index: i })} style={{ width: 'auto' }} />
                        Option {i + 1}
                      </label>
                      <input value={opt} onChange={e => { const opts = [...questionForm.options]; opts[i] = e.target.value; setQuestionForm({ ...questionForm, options: opts }); }} />
                    </div>
                  ))}
                  <button type="submit" className="btn btn-primary btn-sm">Add Question</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {showStudents !== null && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowStudents(null); }}>
          <div className="modal">
            <h2>Enrolled Students</h2>
            {students.length === 0 ? (
              <p className="text-muted">No students enrolled yet.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Progress</th></tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}><td>{s.full_name}</td><td>{s.email}</td><td>{s.progress_pct || 0}%</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowStudents(null)}>Close</button></div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} style={{ marginBottom: 16, color: 'var(--text-muted)' }} />
            <h3>No courses yet</h3>
            <p className="text-muted">Create your first course to get started.</p>
          </div>
        ) : courses.map(course => (
          <div key={course.id} className="card">
            <div className="flex-between">
              <div onClick={() => handleToggleExpand(course.id)} style={{ cursor: 'pointer', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {expandedCourse === course.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{course.title}</h3>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span className={`badge ${course.published ? 'badge-success' : 'badge-warning'}`}>
                        {course.published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-sm text-muted">{course.enrollment_count || 0} students</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setShowStudents(course.id); fetchStudents(course.id); }}><Users size={16} /></button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleEditCourse(course)}><Edit size={16} /></button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCourse(course.id)}><Trash2 size={16} /></button>
              </div>
            </div>

            {expandedCourse === course.id && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <div className="flex-between mb-4">
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Lessons</h4>
                  <button className="btn btn-primary btn-sm" onClick={() => { setSelectedLesson(null); setLessonForm({ title: '', lesson_type: 'document', content: '', duration: 0, order_index: 0 }); setShowLessonForm(true); }}>
                    <Plus size={14} /> Add Lesson
                  </button>
                </div>
                {lessons.length === 0 ? (
                  <p className="text-sm text-muted">No lessons yet. Add your first lesson.</p>
                ) : (
                  <div className="lesson-list">
                    {lessons.map((l, i) => (
                      <div key={l.id} className="lesson-item" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="text-sm text-muted">{i + 1}.</span>
                          <span>{l.title}</span>
                          <span className="badge badge-info">{l.lesson_type}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {l.lesson_type === 'quiz' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedLesson(l); setQuizForm({ title: l.title + ' Quiz', timer_seconds: 300, pass_score: 70 }); setShowQuizForm(true); }}><HelpCircle size={14} /></button>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedLesson(l); setLessonForm({ title: l.title, lesson_type: l.lesson_type, content: l.content || '', duration: l.duration || 0, order_index: l.order_index || 0 }); setShowLessonForm(true); }}><Edit size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLesson(l.id)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
