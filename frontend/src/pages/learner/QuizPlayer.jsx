import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Award } from 'lucide-react';
import '../../styles/QuizPlayer.css';

export default function QuizPlayer() {
  const { courseId, lessonId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  const fetchQuiz = async () => {
    try {
      // Get lesson to find quiz
      const lessonRes = await fetch(`/api/lessons/${lessonId}`, { credentials: 'include' });
      const lessonData = await lessonRes.json();
      
      // Get quiz by lesson_id
      const quizRes = await fetch(`/api/quizzes?lesson_id=${lessonId}`, { credentials: 'include' });
      const quizData = await quizRes.json();
      
      if (quizData.quizzes && quizData.quizzes.length > 0) {
        setQuiz(quizData.quizzes[0]);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setAnswers(new Array(quiz.questions.length).fill(null));
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    try {
      const response = await fetch(`/api/learner/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers: finalAnswers })
      });

      const data = await response.json();
      setResult(data);
      setQuizCompleted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const retakeQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setResult(null);
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;
  if (!quiz) return <div className="quiz-error">Quiz not found</div>;

  // Quiz Intro Screen
  if (!quizStarted && !quizCompleted) {
    return (
      <div className="quiz-intro-screen">
        <div className="quiz-intro-card">
          <div className="quiz-icon">📝</div>
          <h1>{quiz.title}</h1>
          <p className="quiz-description">{quiz.description}</p>

          <div className="quiz-info-grid">
            <div className="info-item">
              <div className="info-label">Total Questions</div>
              <div className="info-value">{quiz.questions?.length || 0}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Passing Score</div>
              <div className="info-value">{quiz.passing_score}%</div>
            </div>
            <div className="info-item">
              <div className="info-label">Multiple Attempts</div>
              <div className="info-value">{quiz.multiple_attempts ? 'Yes' : 'No'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Current Attempt</div>
              <div className="info-value">#{(quiz.attempt_count || 0) + 1}</div>
            </div>
          </div>

          {quiz.attempt_rewards && (
            <div className="rewards-info">
              <h3>🏆 Points Rewards</h3>
              <div className="rewards-grid">
                <div>1st Attempt: {quiz.attempt_rewards.attempt_1} pts</div>
                <div>2nd Attempt: {quiz.attempt_rewards.attempt_2} pts</div>
                <div>3rd Attempt: {quiz.attempt_rewards.attempt_3} pts</div>
                <div>4th+ Attempt: {quiz.attempt_rewards.attempt_4} pts</div>
              </div>
            </div>
          )}

          <div className="quiz-actions">
            <button className="btn btn-secondary" onClick={() => navigate(`/course/${courseId}/lesson/${lessonId}`)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={startQuiz}>
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Completed Screen
  if (quizCompleted && result) {
    const passed = result.score >= quiz.passing_score;
    
    return (
      <div className="quiz-result-screen">
        <div className="quiz-result-card">
          <div className={`result-icon ${passed ? 'success' : 'fail'}`}>
            {passed ? <CheckCircle size={80} /> : <XCircle size={80} />}
          </div>

          <h1>{passed ? '🎉 Congratulations!' : '😔 Keep Trying!'}</h1>
          <p className="result-message">
            {passed 
              ? 'You passed the quiz!' 
              : `You need ${quiz.passing_score}% to pass. You got ${result.score}%`}
          </p>

          <div className="result-stats">
            <div className="stat-item">
              <div className="stat-label">Score</div>
              <div className="stat-value">{result.score}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Correct Answers</div>
              <div className="stat-value">{result.correct_count}/{result.total_questions}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Attempt</div>
              <div className="stat-value">#{result.attempt_number}</div>
            </div>
          </div>

          <div className="points-earned">
            <Award size={24} color="#f59e0b" />
            <span>You earned {result.points_earned} points!</span>
          </div>

          <div className="result-actions">
            <button className="btn btn-secondary" onClick={() => navigate(`/course/${courseId}`)}>
              Back to Course
            </button>
            {quiz.multiple_attempts && !passed && (
              <button className="btn btn-primary" onClick={retakeQuiz}>
                Retake Quiz
              </button>
            )}
            {passed && (
              <button className="btn btn-success" onClick={() => navigate(`/course/${courseId}`)}>
                Continue Learning
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Question Screen
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="quiz-player">
      <div className="quiz-header">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="quiz-progress-text">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>
      </div>

      <div className="quiz-question-card">
        <h2 className="question-text">{question.question}</h2>

        <div className="options-list">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${selectedAnswer === index ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(index)}
            >
              <div className="option-radio">
                {selectedAnswer === index && <div className="option-radio-dot" />}
              </div>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

        <div className="quiz-navigation">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>

          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={selectedAnswer === null}
          >
            {currentQuestion === quiz.questions.length - 1 ? 'Complete Quiz' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
