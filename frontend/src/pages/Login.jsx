import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/RoleBasedLogin.css';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
        return '/home';
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
    
    // Validate all fields are filled
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    try {
      const user = await login(email, password, selectedRole);
      
      // Verify user has the selected role
      if (user.role !== selectedRole) {
        setError(`This account is registered as a ${user.role}, not a ${selectedRole}. Please select the correct role.`);
        setLoading(false);
        return;
      }
      
      // Redirect based on actual user role (not selected role)
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-based-login-page">
      <div className="login-container">
        {/* Role Selection Panel */}
        {!selectedRole ? (
          <div className="role-selection-panel">
            <div className="role-header">
              <h1>Welcome to LearnSphere</h1>
              <p>Select your role to continue</p>
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
                <button className="role-btn">Continue as Learner</button>
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
                <button className="role-btn">Continue as Instructor</button>
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
                <button className="role-btn">Continue as Admin</button>
              </div>
            </div>

            <p className="signup-link">
              Don't have an account? <Link to="/signup">Sign up here</Link>
            </p>
          </div>
        ) : (
          /* Login Form Panel */
          <div className="login-form-panel">
            <button 
              className="back-btn"
              onClick={() => {
                setSelectedRole(null);
                setEmail('');
                setPassword('');
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
              <h2>Sign In</h2>
              <p>Enter your credentials to continue</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value.trim())} 
                  placeholder="you@example.com"
                  disabled={loading}
                  required
                  autoFocus
                />
                {email && !isValidEmail(email) && (
                  <small style={{color: '#dc2626', marginTop: '4px', display: 'block'}}>
                    Please enter a valid email
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Your password (min 6 characters)"
                  disabled={loading}
                  required
                />
                {password && password.length < 6 && (
                  <small style={{color: '#dc2626', marginTop: '4px', display: 'block'}}>
                    Password must be at least 6 characters
                  </small>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary login-btn" 
                disabled={loading || !email || !password}
              >
                {loading ? <span className="inline-loader" /> : 'Sign In'}
              </button>
            </form>

            <p className="text-center mt-4 text-sm">
              Don't have an account? <Link to="/signup">Sign up here</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

