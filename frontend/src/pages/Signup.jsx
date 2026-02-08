import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/RoleBasedSignup.css';

export default function Signup() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const isValidPassword = (pwd) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    return passwordRegex.test(pwd);
  };

  // Get password strength feedback
  const getPasswordStrengthFeedback = (pwd) => {
    if (!pwd) return '';
    let feedback = [];
    if (!/[a-z]/.test(pwd)) feedback.push('lowercase letter');
    if (!/[A-Z]/.test(pwd)) feedback.push('uppercase letter');
    if (!/[!@#$%^&*]/.test(pwd)) feedback.push('special character (!@#$%^&*)');
    if (pwd.length < 8) feedback.push('at least 8 characters');
    return feedback.length > 0 ? `Password must contain: ${feedback.join(', ')}` : '';
  };

  // Get redirect path based on role
  const getRedirectPath = (role) => {
    switch(role) {
      case 'admin':
        return '/admin';
      case 'instructor':
        return '/instructor';
      case 'learner':
      default:
        return '/my-courses';
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }
    
    // Validate all fields
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    // Validate name
    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate password strength
    if (!isValidPassword(password)) {
      setError(getPasswordStrengthFeedback(password) || 'Password does not meet requirements');
      return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await signup(fullName, email, password, selectedRole);
      const redirectPath = getRedirectPath(selectedRole);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-based-signup-page">
      <div className="signup-container">
        {/* Role Selection Panel */}
        {!selectedRole ? (
          <div className="role-selection-panel">
            <div className="role-header">
              <h1>Join LearnSphere</h1>
              <p>Select your role to get started</p>
            </div>

            <div className="role-cards-grid">
              {/* Learner Card */}
              <div 
                className="role-card learner-card"
                onClick={() => handleRoleSelect('learner')}
              >
                <div className="role-icon">👨‍🎓</div>
                <h3>Learner</h3>
                <p>Browse courses, learn new skills</p>
                <ul className="role-features">
                  <li>✓ Enroll in courses</li>
                  <li>✓ Watch lessons</li>
                  <li>✓ Take quizzes</li>
                  <li>✓ Track progress</li>
                </ul>
                <button className="role-btn">Sign up as Learner</button>
              </div>

              {/* Instructor Card */}
              <div 
                className="role-card instructor-card"
                onClick={() => handleRoleSelect('instructor')}
              >
                <div className="role-icon">👨‍🏫</div>
                <h3>Instructor</h3>
                <p>Create and manage courses</p>
                <ul className="role-features">
                  <li>✓ Create courses</li>
                  <li>✓ Upload lessons</li>
                  <li>✓ Create quizzes</li>
                  <li>✓ View student progress</li>
                </ul>
                <button className="role-btn">Sign up as Instructor</button>
              </div>

              {/* Admin Card */}
              <div 
                className="role-card admin-card"
                onClick={() => handleRoleSelect('admin')}
              >
                <div className="role-icon">⚙️</div>
                <h3>Administrator</h3>
                <p>Manage platform and users</p>
                <ul className="role-features">
                  <li>✓ Manage users</li>
                  <li>✓ Manage courses</li>
                  <li>✓ View analytics</li>
                  <li>✓ System settings</li>
                </ul>
                <button className="role-btn">Sign up as Admin</button>
              </div>
            </div>

            <p className="login-link">
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        ) : (
          /* Signup Form Panel */
          <div className="signup-form-panel">
            <button 
              className="back-btn"
              onClick={() => {
                setSelectedRole(null);
                setFullName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setError('');
              }}
            >
              ← Back to role selection
            </button>

            <div className="form-header">
              <div className="role-badge">
                {selectedRole === 'learner' && <span>👨‍🎓 Learner</span>}
                {selectedRole === 'instructor' && <span>👨‍🏫 Instructor</span>}
                {selectedRole === 'admin' && <span>⚙️ Administrator</span>}
              </div>
              <h2>Create Account</h2>
              <p>Fill in your details to get started</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  placeholder="John Doe"
                  disabled={loading}
                  required
                  autoFocus
                />
                {fullName && fullName.trim().length < 2 && (
                  <small style={{color: '#dc2626', marginTop: '4px', display: 'block'}}>
                    Name must be at least 2 characters
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value.trim())} 
                  placeholder="you@example.com"
                  disabled={loading}
                  required
                />
                {email && !isValidEmail(email) && (
                  <small style={{color: '#dc2626', marginTop: '4px', display: 'block'}}>
                    Invalid email format
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Min 8 chars, 1 uppercase, 1 special char"
                  disabled={loading}
                  required
                />
                {password && getPasswordStrengthFeedback(password) && (
                  <small style={{color: '#dc2626', marginTop: '4px', display: 'block'}}>
                    {getPasswordStrengthFeedback(password)}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm your password"
                  disabled={loading}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <small style={{color: '#dc2626', marginTop: '4px', display: 'block'}}>
                    Passwords do not match
                  </small>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary signup-btn" 
                disabled={loading || !fullName || !email || !password || !confirmPassword}
              >
                {loading ? <span className="inline-loader" /> : 'Create Account'}
              </button>
            </form>

            <p className="text-center mt-4 text-sm">
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}