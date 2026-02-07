import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';

export default function Quiz({ quiz, courseId, lessonId, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timer_seconds || 0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (quiz.timer_seconds > 0 && !submitted) {
      setTimeLeft(quiz.timer_seconds);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [quiz.id, submitted]);

  const handleSelect = (questionId, optionIndex) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
      if (data.passed && onComplete) onComplete();
    } catch {}
    setSubmitting(false);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setTimeLeft(quiz.timer_seconds || 0);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const allAnswered = quiz.questions?.length > 0 && Object.keys(answers).length === quiz.questions.length;

  if (submitted && result) {
    return (
      <div className="quiz-result">
        <div className={`quiz-score ${result.passed ? 'passed' : 'failed'}`}>{result.score}%</div>
        <h2>{result.passed ? 'Congratulations!' : 'Not quite there yet'}</h2>
        <p className="text-muted mb-6">
          You got {result.correct} out of {result.total} questions correct.
          {result.passed ? ' Great job!' : ` You need ${quiz.pass_score}% to pass.`}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {result.passed ? (
            <span className="badge badge-success" style={{ fontSize: '1rem', padding: '8px 16px' }}>
              <CheckCircle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Passed
            </span>
          ) : (
            <button className="btn btn-primary" onClick={handleRetry}>
              <RotateCcw size={18} /> Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="flex-between mb-6">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{quiz.title}</h2>
        {quiz.timer_seconds > 0 && (
          <div className="quiz-timer" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} />
            <span style={{ color: timeLeft < 60 ? 'var(--danger)' : 'inherit' }}>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {quiz.questions?.map((q, qi) => (
        <div key={q.id} className="quiz-question">
          <h3>Question {qi + 1}: {q.prompt}</h3>
          <div>
            {(Array.isArray(q.options) ? q.options : []).map((opt, oi) => (
              <div
                key={oi}
                className={`quiz-option ${answers[q.id] === oi ? 'selected' : ''}`}
                onClick={() => handleSelect(q.id, oi)}
              >
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: answers[q.id] === oi ? 'var(--accent)' : 'transparent' }}>
                  {answers[q.id] === oi && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </span>
                {opt}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        className="btn btn-primary btn-lg"
        style={{ width: '100%', marginTop: 16 }}
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
      >
        {submitting ? <span className="inline-loader" /> : 'Submit Quiz'}
      </button>
      {!allAnswered && (
        <p className="text-sm text-muted text-center mt-4">Answer all questions to submit</p>
      )}
    </div>
  );
}
