import { useState, useEffect } from 'react';
import { Award, Download, Trophy, Star, Target } from 'lucide-react';
import '../../styles/Achievements.css';

export default function Achievements() {
  const [data, setData] = useState({
    badges: [],
    achievements: [],
    certificates: [],
    points: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/learner/achievements', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const result = await response.json();
      console.log('Achievements API Response:', result);
      console.log('Certificates count:', result.certificates?.length);
      console.log('Certificates data:', result.certificates);
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificate) => {
    try {
      // Mark as downloaded
      await fetch(`http://localhost:8000/api/learner/certificates/${certificate.id}/download`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      // Generate and download certificate
      generateCertificatePDF(certificate);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateCertificatePDF = (cert) => {
    // Determine rank based on grade
    const rankMap = {
      'A+': { emoji: '🏆', label: 'Outstanding', color: '#FFD700' },
      'A': { emoji: '🥇', label: 'Excellent', color: '#FFD700' },
      'B': { emoji: '🥈', label: 'Very Good', color: '#C0C0C0' },
      'C': { emoji: '🥉', label: 'Good', color: '#CD7F32' }
    };
    const rank = rankMap[cert.grade] || rankMap['A'];
    
    // Create a beautiful HTML certificate with golden border
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${cert.certificate_number}</title>
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
            padding: 80px 60px;
            border: 15px solid #FFD700;
            border-radius: 30px;
            max-width: 900px;
            width: 100%;
            box-shadow: 0 30px 80px rgba(0,0,0,0.4);
            position: relative;
            overflow: hidden;
          }
          .certificate-container::before {
            content: '🎓';
            position: absolute;
            font-size: 400px;
            opacity: 0.03;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 0;
          }
          .content { position: relative; z-index: 1; text-align: center; }
          .logo { font-size: 4rem; margin-bottom: 20px; }
          h1 {
            font-size: 3.5rem;
            color: #2c3e50;
            margin-bottom: 15px;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 1.4rem;
            color: #7f8c8d;
            margin-bottom: 40px;
            font-style: italic;
          }
          .student-name {
            font-size: 3rem;
            color: #667eea;
            font-weight: bold;
            margin: 40px 0;
            text-decoration: underline;
            text-decoration-color: #FFD700;
            text-decoration-thickness: 3px;
          }
          .course-title {
            font-size: 2rem;
            color: #2c3e50;
            margin: 30px 0;
            font-weight: 600;
          }
          .rank-badge {
            display: inline-block;
            background: ${rank.color};
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            font-size: 1.8rem;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          .details {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #ecf0f1;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
          }
          .detail-item {
            margin: 10px 20px;
            text-align: center;
          }
          .detail-label {
            font-size: 0.9rem;
            color: #95a5a6;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .detail-value {
            font-size: 1.2rem;
            color: #2c3e50;
            font-weight: 600;
            margin-top: 5px;
          }
          .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: center;
          }
          .signature {
            text-align: center;
            padding: 0 40px;
          }
          .signature-line {
            border-top: 2px solid #2c3e50;
            width: 250px;
            margin: 0 auto 10px;
          }
          .signature-name {
            font-size: 1.1rem;
            color: #2c3e50;
            font-weight: 600;
          }
          .signature-title {
            font-size: 0.9rem;
            color: #7f8c8d;
            font-style: italic;
          }
          @media print {
            body { background: white; padding: 0; }
            .certificate-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="content">
            <div class="logo">🎓</div>
            <h1>Certificate of Completion</h1>
            <p class="subtitle">This is to certify that</p>
            
            <div class="student-name">${cert.users?.full_name || cert.user_name || 'Student Name'}</div>
            
            <p class="subtitle">has successfully completed the course</p>
            
            <div class="course-title">${cert.courses?.title || cert.course_title || 'Course Title'}</div>
            
            <div class="rank-badge">
              ${rank.emoji} ${rank.label} - Grade ${cert.grade}
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Certificate Number</div>
                <div class="detail-value">${cert.certificate_number}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Issue Date</div>
                <div class="detail-value">${new Date(cert.issued_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
            
            <div class="signature-section">
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">LearnSphere Team</div>
                <div class="signature-title">Platform Administrator</div>
              </div>
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
    a.download = `Certificate-${cert.certificate_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="page-loader"><div className="inline-loader" /></div>;
  }

  const points = data.points || {};

  return (
    <div className="achievements-page">
      <div className="page-header">
        <h1>🏆 My Achievements</h1>
        <p>Track your learning journey and celebrate your success!</p>
      </div>

      {/* Points Overview */}
      <div className="points-overview">
        <div className="points-card main-points">
          <Trophy size={48} />
          <div className="points-info">
            <div className="points-value">{points.total_points || 0}</div>
            <div className="points-label">Total Points</div>
          </div>
        </div>
        <div className="points-card">
          <Star size={32} />
          <div className="points-info">
            <div className="points-value">{points.badge_level || 'Newbie'}</div>
            <div className="points-label">Badge Level</div>
          </div>
        </div>
        <div className="points-card">
          <Award size={32} />
          <div className="points-info">
            <div className="points-value">{points.courses_completed || 0}</div>
            <div className="points-label">Courses Completed</div>
          </div>
        </div>
        <div className="points-card">
          <Target size={32} />
          <div className="points-info">
            <div className="points-value">{points.quizzes_passed || 0}</div>
            <div className="points-label">Quizzes Passed</div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="section">
        <h2>🎖️ Badges Earned ({data.badges?.length || 0})</h2>
        {data.badges && data.badges.length > 0 ? (
          <div className="badges-grid">
            {data.badges.map(userBadge => {
              const badge = userBadge.badges;
              
              // Map badge names to emoji/icons
              const badgeIcons = {
                'First Lesson': '📚',
                'Course Completed': '🎓',
                'Fast Learner': '⚡',
                'Quiz Master': '🧠',
                'Perfect Score': '💯',
                'Dedicated Learner': '🔥',
                'Early Bird': '🌅',
                'Night Owl': '🦉',
                'Streak Master': '📈',
                'Helpful': '🤝'
              };
              
              const badgeColors = {
                'First Lesson': '#4CAF50',
                'Course Completed': '#FFD700',
                'Fast Learner': '#FF9800',
                'Quiz Master': '#9C27B0',
                'Perfect Score': '#F44336',
                'Dedicated Learner': '#FF5722',
                'Early Bird': '#FFC107',
                'Night Owl': '#3F51B5',
                'Streak Master': '#00BCD4',
                'Helpful': '#8BC34A'
              };
              
              const icon = badgeIcons[badge.name] || badge.icon || '🏆';
              const color = badgeColors[badge.name] || badge.color || '#667eea';
              
              return (
                <div key={userBadge.id} className={`badge-card ${userBadge.is_new ? 'new-badge' : ''}`}>
                  <div className="badge-icon" style={{ 
                    fontSize: '4rem',
                    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: `0 10px 30px ${color}40`,
                    border: '4px solid white'
                  }}>
                    {icon}
                  </div>
                  <h3>{badge.name}</h3>
                  <p>{badge.description}</p>
                  <div className="badge-date">
                    Earned: {new Date(userBadge.earned_date).toLocaleDateString()}
                  </div>
                  {userBadge.is_new && <div className="new-badge-tag">NEW!</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Trophy size={64} />
            <p>No badges earned yet. Complete lessons and courses to earn badges!</p>
          </div>
        )}
      </div>

      {/* Learning Streak Section */}
      <div className="section">
        <h2>🔥 Learning Streak</h2>
        <div className="streak-container">
          <div className="streak-stats">
            <div className="streak-stat-card current-streak">
              <div className="streak-icon">🔥</div>
              <div className="streak-value">{data.streak?.current_streak || 0}</div>
              <div className="streak-label">Day Streak</div>
            </div>
            <div className="streak-stat-card longest-streak">
              <div className="streak-icon">🏆</div>
              <div className="streak-value">{data.streak?.longest_streak || 0}</div>
              <div className="streak-label">Longest Streak</div>
            </div>
            <div className="streak-stat-card total-days">
              <div className="streak-icon">📅</div>
              <div className="streak-value">{data.streak?.total_active_days || 0}</div>
              <div className="streak-label">Total Active Days</div>
            </div>
          </div>

          {/* Streak Calendar - Last 60 days */}
          <div className="streak-calendar">
            <h3>Activity in the last 60 days</h3>
            <div className="calendar-grid">
              {(() => {
                const days = [];
                const today = new Date();
                const activeDays = data.streak?.activity_calendar || [];
                
                for (let i = 59; i >= 0; i--) {
                  const date = new Date(today);
                  date.setDate(date.getDate() - i);
                  const dateStr = date.toISOString().split('T')[0];
                  const isActive = activeDays.includes(dateStr);
                  const isToday = i === 0;
                  
                  days.push(
                    <div
                      key={dateStr}
                      className={`calendar-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`}
                      title={`${dateStr}${isActive ? ' - Active' : ''}`}
                    >
                      <div className="day-dot"></div>
                    </div>
                  );
                }
                return days;
              })()}
            </div>
            <div className="calendar-legend">
              <span><div className="legend-box empty"></div> No activity</span>
              <span><div className="legend-box active"></div> Active day</span>
              <span><div className="legend-box today"></div> Today</span>
            </div>
            {data.streak?.current_streak > 0 && (
              <div className="streak-message">
                <p>🎉 Keep it up! You're on a {data.streak.current_streak} day streak!</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                  Complete a lesson today to maintain your streak. Missing 2 consecutive days will reset it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="section">
        <h2>🌟 Recent Achievements</h2>
        {data.achievements && data.achievements.length > 0 ? (
          <div className="achievements-list">
            {data.achievements.slice(0, 10).map(achievement => (
              <div key={achievement.id} className="achievement-item">
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                  <span className="achievement-date">
                    {new Date(achievement.achieved_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="achievement-points">
                  +{achievement.points_earned} pts
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Star size={64} />
            <p>Start learning to unlock achievements!</p>
          </div>
        )}
      </div>
    </div>
  );
}
