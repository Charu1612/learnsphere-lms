import { Award, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './BadgeNotification.css';

export default function BadgeNotification({ badge, onClose }) {
  const navigate = useNavigate();

  const handleViewAchievements = () => {
    onClose();
    navigate('/achievements');
  };

  return (
    <div className="badge-notification-overlay" onClick={onClose}>
      <div className="badge-notification" onClick={(e) => e.stopPropagation()}>
        <button className="badge-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="badge-content">
          <div className="badge-icon-large">
            <Award size={64} color="#FFD700" />
          </div>
          
          <h2>🎉 New Badge Earned!</h2>
          
          <div className="badge-details">
            <div className="badge-name">{badge.name}</div>
            <div className="badge-description">{badge.description}</div>
          </div>

          <div className="badge-logo">
            <span className="learnsphere-logo">🎓 LearnSphere</span>
          </div>

          <button className="btn btn-primary" onClick={handleViewAchievements}>
            View All Achievements
          </button>
        </div>
      </div>
    </div>
  );
}
