import React, { useState } from 'react';
import axios from 'axios';
import './QuizBuilder.css';

function QuizBuilder({ quiz, courseId, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('settings');
  const [quizData, setQuizData] = useState(quiz || {
    title: '',
    description: '',
    reward_points: 10,
    passing_score: 70,
    allow_retake: true,
    time_limit_minutes: null
  });
  const [questions, setQuestions] = useState(quiz?.questions || []);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question_text: '',
      question_type: 'mcq',
      explanation: '',
      options: [
        { id: 1, text: '', is_correct: true },
        { id: 2, text: '', is_correct: false }
      ]
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion.id);
  };

  const deleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    if (editingQuestion === questionId) {
      setEditingQuestion(null);
    }
  };

  const updateQuestion = (questionId, updates) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: [...q.options, { id: Date.now(), text: '', is_correct: false }]
        };
      }
      return q;
    }));
  };

  const updateOption = (questionId, optionId, updates) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.map(o => o.id === optionId ? { ...o, ...updates } : o)
        };
      }
      return q;
    }));
  };

  const deleteOption = (questionId, optionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.filter(o => o.id !== optionId)
        };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      if (questions.length === 0) {
        setError('Please add at least one question');
        return;
      }

      let endpoint = 'http://localhost:8000/api/instructor/quizzes';
      let method = 'POST';

      if (quiz && quiz.quiz_id) {
        endpoint = `http://localhost:8000/api/instructor/quizzes/${quiz.quiz_id}`;
        method = 'PUT';
      }

      const response = await axios({
        method,
        url: endpoint,
        data: {
          ...quizData,
          course_id: courseId,
          questions: questions
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      onSave(response.data);
      alert('Quiz saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions.find(q => q.id === editingQuestion);

  return (
    <div className="quiz-builder-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{quiz ? '✏️ Edit Quiz' : '➕ Create Quiz'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="quiz-builder">
          {/* Left Panel - Questions List */}
          <div className="questions-panel">
            <div className="panel-header">
              <h3>Questions ({questions.length})</h3>
              <button className="add-btn" onClick={addQuestion}>➕ Add</button>
            </div>

            <div className="questions-list">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`question-item ${editingQuestion === q.id ? 'active' : ''}`}
                  onClick={() => setEditingQuestion(q.id)}
                >
                  <span className="question-number">Q{idx + 1}</span>
                  <span className="question-preview">
                    {q.question_text || '(Untitled)'}
                  </span>
                  <span className="question-type">{q.question_type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Editor */}
          <div className="editor-panel">
            {/* Tabs */}
            {!currentQuestion && (
              <>
                <div className="tabs">
                  <button
                    className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                  >
                    ⚙️ Settings
                  </button>
                </div>

                {/* Quiz Settings */}
                <div className="tab-content">
                  <div className="form-group">
                    <label>Quiz Title *</label>
                    <input
                      type="text"
                      value={quizData.title}
                      onChange={(e) => setQuizData({...quizData, title: e.target.value})}
                      placeholder="e.g., Chapter 1 Assessment"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={quizData.description || ''}
                      onChange={(e) => setQuizData({...quizData, description: e.target.value})}
                      placeholder="Describe what this quiz covers..."
                      rows="4"
                    ></textarea>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Passing Score (%)</label>
                      <input
                        type="number"
                        value={quizData.passing_score}
                        onChange={(e) => setQuizData({...quizData, passing_score: parseInt(e.target.value)})}
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="form-group">
                      <label>Reward Points</label>
                      <input
                        type="number"
                        value={quizData.reward_points}
                        onChange={(e) => setQuizData({...quizData, reward_points: parseInt(e.target.value)})}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Time Limit (minutes)</label>
                      <input
                        type="number"
                        value={quizData.time_limit_minutes || ''}
                        onChange={(e) => setQuizData({...quizData, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null})}
                        min="0"
                        placeholder="Optional"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={quizData.allow_retake}
                          onChange={(e) => setQuizData({...quizData, allow_retake: e.target.checked})}
                        />
                        ↻ Allow Retakes
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Question Editor */}
            {currentQuestion && (
              <div className="question-editor">
                <button 
                  className="back-btn"
                  onClick={() => setEditingQuestion(null)}
                >
                  ← Back to List
                </button>

                <div className="form-group">
                  <label>Question Text *</label>
                  <textarea
                    value={currentQuestion.question_text}
                    onChange={(e) => updateQuestion(currentQuestion.id, { question_text: e.target.value })}
                    placeholder="Type your question here..."
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Question Type</label>
                  <select
                    value={currentQuestion.question_type}
                    onChange={(e) => updateQuestion(currentQuestion.id, { question_type: e.target.value })}
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>

                {/* Options */}
                {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'true_false') && (
                  <div className="options-section">
                    <label>Answer Options</label>
                    {currentQuestion.options.map((opt, idx) => (
                      <div key={opt.id} className="option-item">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOption(currentQuestion.id, opt.id, { text: e.target.value })}
                          placeholder={`Option ${idx + 1}`}
                        />
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={opt.is_correct}
                            onChange={(e) => updateOption(currentQuestion.id, opt.id, { is_correct: e.target.checked })}
                          />
                          Correct
                        </label>
                        {currentQuestion.options.length > 2 && (
                          <button
                            className="delete-option"
                            onClick={() => deleteOption(currentQuestion.id, opt.id)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {currentQuestion.question_type === 'mcq' && (
                      <button
                        className="add-option-btn"
                        onClick={() => addOption(currentQuestion.id)}
                      >
                        ➕ Add Option
                      </button>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label>Explanation (shown after answer)</label>
                  <textarea
                    value={currentQuestion.explanation || ''}
                    onChange={(e) => updateQuestion(currentQuestion.id, { explanation: e.target.value })}
                    placeholder="Explain why this answer is correct..."
                    rows="3"
                  ></textarea>
                </div>

                <button
                  className="delete-question-btn"
                  onClick={() => deleteQuestion(currentQuestion.id)}
                >
                  🗑️ Delete Question
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : '💾 Save Quiz'}
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

export default QuizBuilder;
