import { useState } from 'react';
import { X, Plus, Video, FileText, Image as ImageIcon, Award, Trash2 } from 'lucide-react';
import '../../styles/EnhancedCourseForm.css';

export default function EnhancedCourseForm({ course, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    short_description: course?.short_description || '',
    image_url: course?.image_url || '',
    tags: course?.tags || '',
    visibility: course?.visibility || 'public',
    access: course?.access || 'free',
    price: course?.price || 0,
    published: course?.published || false,
    lessons: course?.lessons || []
  });

  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    content_type: 'video',
    video_url: '',
    content: '',
    duration: 10,
    order_index: formData.lessons.length + 1
  });

  const lessonTemplates = {
    video: { title: 'Video Lesson', content_type: 'video', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 15 },
    text: { title: 'Text Lesson', content_type: 'text', content: '<h2>Lesson Content</h2><p>Add your content here...</p>', duration: 10 },
    image: { title: 'Image Lesson', content_type: 'image', video_url: 'https://picsum.photos/800/600', duration: 5 },
    quiz: { title: 'Quiz', content_type: 'quiz', content: 'Quiz content', duration: 20 }
  };

  const addLesson = () => {
    if (!currentLesson.title) {
      alert('Please enter lesson title');
      return;
    }
    
    const newLesson = {
      ...currentLesson,
      order_index: formData.lessons.length + 1,
      id: Date.now() // Temporary ID
    };
    
    setFormData({
      ...formData,
      lessons: [...formData.lessons, newLesson]
    });
    
    setCurrentLesson({
      title: '',
      content_type: 'video',
      video_url: '',
      content: '',
      duration: 10,
      order_index: formData.lessons.length + 2
    });
  };

  const removeLesson = (index) => {
    const newLessons = formData.lessons.filter((_, i) => i !== index);
    setFormData({ ...formData, lessons: newLessons });
  };

  const addQuickLessons = (count) => {
    const newLessons = [];
    const types = ['video', 'text', 'video', 'text', 'quiz'];
    
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const template = lessonTemplates[type];
      
      newLessons.push({
        ...template,
        title: `${template.title} ${formData.lessons.length + i + 1}`,
        order_index: formData.lessons.length + i + 1,
        id: Date.now() + i
      });
    }
    
    setFormData({
      ...formData,
      lessons: [...formData.lessons, ...newLessons]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.lessons.length < 10) {
      if (!confirm(`You have only ${formData.lessons.length} lessons. Recommended: 15-19 lessons. Continue anyway?`)) {
        return;
      }
    }
    
    await onSave(formData);
  };

  return (
    <div className="enhanced-form-overlay">
      <div className="enhanced-form-container">
        <div className="form-header">
          <h2>{course ? 'Edit Course' : 'Create New Course'}</h2>
          <button className="btn-close" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="enhanced-form">
          {/* Course Details */}
          <div className="form-section">
            <h3>📚 Course Details</h3>
            
            <div className="form-group">
              <label>Course Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Complete Python Programming"
                required
              />
            </div>

            <div className="form-group">
              <label>Short Description *</label>
              <textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Brief description (2-3 sentences)"
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Course Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="python, programming, beginner"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Visibility</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                >
                  <option value="public">Public</option>
                  <option value="signed_in">Signed In Only</option>
                </select>
              </div>

              <div className="form-group">
                <label>Access Type</label>
                <select
                  value={formData.access}
                  onChange={(e) => setFormData({ ...formData, access: e.target.value })}
                >
                  <option value="free">Free</option>
                  <option value="payment">Paid</option>
                  <option value="invitation">Invitation Only</option>
                </select>
              </div>

              {formData.access === 'payment' && (
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    min="0"
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                />
                <span>Publish course (make it visible to students)</span>
              </label>
            </div>
          </div>

          {/* Lessons Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>📝 Course Lessons ({formData.lessons.length})</h3>
              <div className="quick-add-buttons">
                <button type="button" className="btn-quick" onClick={() => addQuickLessons(15)}>
                  + Add 15 Lessons
                </button>
                <button type="button" className="btn-quick" onClick={() => addQuickLessons(19)}>
                  + Add 19 Lessons
                </button>
              </div>
            </div>

            {/* Current Lesson Form */}
            <div className="lesson-form-card">
              <h4>Add New Lesson</h4>
              
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Lesson Title</label>
                  <input
                    type="text"
                    value={currentLesson.title}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                    placeholder="e.g., Introduction to Variables"
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={currentLesson.content_type}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, content_type: e.target.value })}
                  >
                    <option value="video">Video</option>
                    <option value="text">Text/Document</option>
                    <option value="image">Image</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration (min)</label>
                  <input
                    type="number"
                    value={currentLesson.duration}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, duration: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              {(currentLesson.content_type === 'video' || currentLesson.content_type === 'image') && (
                <div className="form-group">
                  <label>{currentLesson.content_type === 'video' ? 'Video URL (YouTube/Vimeo)' : 'Image URL'}</label>
                  <input
                    type="url"
                    value={currentLesson.video_url}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, video_url: e.target.value })}
                    placeholder={currentLesson.content_type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://example.com/image.jpg'}
                  />
                </div>
              )}

              {currentLesson.content_type === 'text' && (
                <div className="form-group">
                  <label>Content (HTML)</label>
                  <textarea
                    value={currentLesson.content}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, content: e.target.value })}
                    placeholder="<h2>Lesson Title</h2><p>Your content here...</p>"
                    rows="4"
                  />
                </div>
              )}

              <button type="button" className="btn btn-primary" onClick={addLesson}>
                <Plus size={16} />
                Add Lesson
              </button>
            </div>

            {/* Lessons List */}
            <div className="lessons-list">
              {formData.lessons.map((lesson, index) => (
                <div key={lesson.id} className="lesson-item">
                  <div className="lesson-icon">
                    {lesson.content_type === 'video' && <Video size={20} />}
                    {lesson.content_type === 'text' && <FileText size={20} />}
                    {lesson.content_type === 'image' && <ImageIcon size={20} />}
                    {lesson.content_type === 'quiz' && <Award size={20} />}
                  </div>
                  <div className="lesson-info">
                    <div className="lesson-title">{index + 1}. {lesson.title}</div>
                    <div className="lesson-meta">
                      <span className="type-badge">{lesson.content_type}</span>
                      <span>{lesson.duration} min</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => removeLesson(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {formData.lessons.length < 15 && (
              <div className="warning-box">
                ⚠️ Recommended: Add 15-19 lessons for a complete course
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              {course ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
