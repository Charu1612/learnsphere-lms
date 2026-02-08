import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, BookOpen, LogOut, User, Layout, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <BookOpen size={24} />
          LearnSphere
        </Link>

        <div className="navbar-center">
          {user?.role === 'learner' && (
            <>
              <NavLink to="/home" className={({ isActive }) => isActive ? 'active' : ''}>
                Home
              </NavLink>
              <NavLink to="/courses" className={({ isActive }) => isActive ? 'active' : ''}>
                Browse Courses
              </NavLink>
              <NavLink to="/my-courses" className={({ isActive }) => isActive ? 'active' : ''}>
                My Courses
              </NavLink>
              <NavLink to="/achievements" className={({ isActive }) => isActive ? 'active' : ''}>
                🏆 Achievements
              </NavLink>
            </>
          )}
          {user?.role === 'instructor' && (
            <NavLink to="/instructor" className={({ isActive }) => isActive ? 'active' : ''}>
              Course Plans
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
              Admin Panel
            </NavLink>
          )}
          {!user && (
            <NavLink to="/courses" className={({ isActive }) => isActive ? 'active' : ''}>
              Courses
            </NavLink>
          )}
        </div>

        <div className="navbar-right">
          {user && <NotificationBell />}
          
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            <div className="user-dropdown" ref={dropdownRef}>
              <div className="user-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {user.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div style={{ padding: '8px 12px', fontSize: '0.8125rem' }}>
                    <div style={{ fontWeight: 600 }}>{user.full_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user.email}</div>
                    <span className="badge badge-info" style={{ marginTop: 4, display: 'inline-block' }}>{user.role}</span>
                  </div>
                  <div className="dropdown-divider" />
                  {user.role === 'admin' ? (
                    <>
                      <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <Shield size={16} /> Admin Panel
                      </Link>
                    </>
                  ) : user.role === 'instructor' ? (
                    <>
                      <Link to="/my-courses" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <BookOpen size={16} /> My Courses
                      </Link>
                      <Link to="/instructor" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <Layout size={16} /> Instructor Dashboard
                      </Link>
                    </>
                  ) : (
                    <Link to="/my-courses" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <BookOpen size={16} /> My Courses
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
