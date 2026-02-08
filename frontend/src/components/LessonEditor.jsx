import React, { useState } from 'react';
import axios from 'axios';
import './LessonEditor.css';

function LessonEditor({ lesson, courseId, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('content');
  const [lessonData, setLessonData] = useState(lesson || {
    title: '',
    lesson_type: 'video',
    description: '',
    video_url: '',
    duration_minutes: 0,
    order_index: 0
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      let endpoint = 'http://localhost:8000/api/instructor/lessons';
      let method = 'POST';
      
      if (lesson && lesson.lesson_id) {
        endpoint = `http://localhost:8000/api/instructor/lessons/${lesson.lesson_id}`;
        method = 'PUT';
      }

      const response = await axios({
        method,
        url: endpoint,
        data: {
          ...lessonData,
          course_id: courseId
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      onSave(response.data);
      alert('Lesson saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        'http://localhost:8000/api/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setAttachments([
        ...attachments,
        {
          id: Date.now(),
          name: file.name,
          url: response.data.file_url,
          size: file.size
        }
      ]);
    } catch (err) {
      setError('Failed to upload file');
    }
  };

  return (
    <div className="lesson-editor-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{lesson ? '✏️ Edit Lesson' : '➕ Create Lesson'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            📝 Content
          </button>
          <button
            className={`tab ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            📄 Description
          </button>
          <button
            className={`tab ${activeTab === 'attachments' ? 'active' : ''}`}
            onClick={() => setActiveTab('attachments')}
          >
            📎 Attachments
          </button>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Lesson Title *</label>
              <input
                type="text"
                value={lessonData.title}
                onChange={(e) => setLessonData({...lessonData, title: e.target.value})}
                placeholder="e.g., Introduction to Python"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Lesson Type</label>
                <select
                  value={lessonData.lesson_type}
                  onChange={(e) => setLessonData({...lessonData, lesson_type: e.target.value})}
                >
                  <option value="video">🎥 Video</option>
                  <option value="document">📄 Document</option>
                  <option value="image">🖼️ Image</option>
                  <option value="interactive">🎮 Interactive</option>
                </select>
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={lessonData.duration_minutes}
                  onChange={(e) => setLessonData({...lessonData, duration_minutes: parseInt(e.target.value)})}
                  min="0"
                />
              </div>
            </div>

            {lessonData.lesson_type === 'video' && (
              <div className="form-group">
                <label>Video URL</label>
                <input
                  type="text"
                  value={lessonData.video_url || ''}
                  onChange={(e) => setLessonData({...lessonData, video_url: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            )}

            <div className="form-group">
              <label>Order Index</label>
              <input
                type="number"
                value={lessonData.order_index}
                onChange={(e) => setLessonData({...lessonData, order_index: parseInt(e.target.value)})}
                min="0"
              />
            </div>
          </div>
        )}

        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Lesson Description</label>
              <textarea
                value={lessonData.description || ''}
                onChange={(e) => setLessonData({...lessonData, description: e.target.value})}
                placeholder="Write a detailed description of this lesson..."
                rows="8"
              ></textarea>
            </div>
            <small className="help-text">📝 Use this space to explain what students will learn</small>
          </div>
        )}

        {/* Attachments Tab */}
        {activeTab === 'attachments' && (
          <div className="tab-content">
            <div className="upload-area">
              <input
                type="file"
                id="file-input"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" className="upload-button">
                📤 Click to upload or drag files
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="attachments-list">
                <h4>Attached Files</h4>
                {attachments.map(att => (
                  <div key={att.id} className="attachment-item">
                    <span className="attachment-name">{att.name}</span>
                    <span className="attachment-size">
                      ({(att.size / 1024).toFixed(2)} KB)
                    </span>
                    <button
                      className="remove-btn"
                      onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : '💾 Save Lesson'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default LessonEditor;
