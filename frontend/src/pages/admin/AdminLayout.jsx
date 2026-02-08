import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userName = localStorage.getItem('userName') || 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Courses', path: '/admin/courses', icon: '📚' },
    { label: 'Instructors', path: '/admin/instructors', icon: '👨‍🏫' },
    { label: 'Users', path: '/admin/users', icon: '👥' },
    { label: 'Reports', path: '/admin/reports', icon: '📈' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="logo">🎓 LearnSphere</h1>
          <button 
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-widget">
            <div className="user-avatar">A</div>
            {sidebarOpen && (
              <div className="user-info">
                <p className="user-name">{userName}</p>
                <p className="user-role">Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h2 className="page-title">Admin Panel</h2>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="🔍 Search..."
              />
            </div>

            <button className="icon-btn notification-btn">
              🔔
              <span className="notification-badge">3</span>
            </button>

            <div className="user-dropdown">
              <button 
                className="user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="avatar-small">A</div>
                <span>{userName}</span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <a href="/profile" className="dropdown-item">
                    👤 Profile
                  </a>
                  <a href="/settings" className="dropdown-item">
                    ⚙️ Settings
                  </a>
                  <hr />
                  <button 
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
