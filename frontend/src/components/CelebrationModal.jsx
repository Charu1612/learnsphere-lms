import { useEffect, useState } from 'react';
import { Award, Download, X, Star, Trophy } from 'lucide-react';
import './CelebrationModal.css';

export default function CelebrationModal({ certificate, course, onClose, onDownload }) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(certificate, course);
    }
  };

  const rank = certificate?.grade || 'A';
  const rankEmoji = rank === 'A+' ? '🏆' : rank === 'A' ? '🥇' : rank === 'B' ? '🥈' : '🥉';

  return (
    <div className="celebration-overlay">
      {showConfetti && <Confetti />}
      
      <div className="celebration-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="celebration-content">
          {/* Trophy Animation */}
          <div className="trophy-container">
            <div className="trophy-glow"></div>
            <Trophy size={120} className="trophy-icon" />
            <div className="sparkles">
              <Star className="sparkle sparkle-1" size={20} />
              <Star className="sparkle sparkle-2" size={16} />
              <Star className="sparkle sparkle-3" size={18} />
              <Star className="sparkle sparkle-4" size={14} />
            </div>
          </div>

          {/* Congratulations Message */}
          <h1 className="celebration-title">🎉 Congratulations! 🎉</h1>
          <p className="celebration-subtitle">You've completed the course!</p>

          {/* Certificate Preview */}
          <div className="certificate-preview">
            <div className="certificate-border">
              <div className="certificate-content">
                <Award size={48} className="cert-icon" />
                <h2>Certificate of Completion</h2>
                <p className="cert-course">{course?.title || certificate?.courses?.title || 'Course Title'}</p>
                <p className="cert-student">{certificate?.users?.full_name || 'Student Name'}</p>
                <p className="cert-number">Certificate No: {certificate?.certificate_number}</p>
                <p className="cert-date">
                  Issued: {new Date(certificate?.issued_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="completion-stats">
            <div className="stat-item">
              <div className="stat-icon">🏆</div>
              <div className="stat-value">+100</div>
              <div className="stat-label">Points Earned</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">{rankEmoji}</div>
              <div className="stat-value">{rank}</div>
              <div className="stat-label">Achievement Rank</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🎓</div>
              <div className="stat-value">1</div>
              <div className="stat-label">Course Completed</div>
            </div>
          </div>

          {/* Actions */}
          <div className="celebration-actions">
            <button className="btn btn-primary btn-download" onClick={handleDownload}>
              <Download size={20} />
              Download Certificate
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              View Achievements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  return (
    <div className="confetti-container">
      {confettiPieces.map(piece => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`
          }}
        />
      ))}
    </div>
  );
}
