import React, { useState, useCallback, useEffect } from "react";
import PropTypes from 'prop-types';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Database,
  Microscope,
  Users,
  LogOut,
  User,
  Bell,
  Settings
} from 'lucide-react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, reset } from "../../redux/authSlice";
import { toast } from "react-toastify";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error('Layout Error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-red-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">The layout encountered an error. Please refresh the page.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Collapse Toggle Button
const CollapseToggleButton = ({ collapsed, onToggle }) => (
  <button
    onClick={onToggle}
    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    aria-expanded={!collapsed}
    className={`absolute z-10 p-2 rounded-md transition-all duration-200 hover:bg-blue-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      collapsed ? 'right-2 top-17' : 'right-1 top-6'
    }`}
  >
    {collapsed ? (
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="text-slate-600 hover:text-blue-600" aria-hidden="true">
        <line x1="17" y1="2" x2="17" y2="14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M3 8L11 8M11 8L8 5M11 8L8 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="text-slate-600 hover:text-blue-600" aria-hidden="true">
        <rect x="2" y="2" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
        <line x1="7" y1="2" x2="7" y2="14" stroke="currentColor" strokeWidth="1" />
      </svg>
    )}
  </button>
);

CollapseToggleButton.propTypes = { collapsed: PropTypes.bool.isRequired, onToggle: PropTypes.func.isRequired };

// Logo Section with fallback
const LogoSection = ({ collapsed }) => {
  const [logoError, setLogoError] = useState({ small: false, large: false });
  const handleLogoError = (type) => setLogoError(prev => ({ ...prev, [type]: true }));

  return (
    <div className="flex items-center space-x-2 pb-4 -mx-4 px-4 border-b border-slate-200">
      <div className={`rounded flex items-center justify-center ${collapsed ? 'h-8 w-8' : 'h-8 w-32'}`}>
        {collapsed ? (
          logoError.small ? (
            <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-sm">A</div>
          ) : (
            <img src="/src/assets/AccusterLogoTrans.svg" alt="Accuster Logo Small" className="h-8 w-8" onError={() => handleLogoError('small')} />
          )
        ) : (
          logoError.large ? (
            <div className="h-8 w-32 bg-blue-500 rounded flex items-center justify-center text-white font-bold">Accuster</div>
          ) : (
            <img src="/src/assets/AccusterLogoLong.svg" alt="Accuster Logo" className="h-8 w-32" onError={() => handleLogoError('large')} />
          )
        )}
      </div>
    </div>
  );
};
LogoSection.propTypes = { collapsed: PropTypes.bool.isRequired };

// Navigation Menu - Simplified for Pathologist Only
const NavigationMenu = ({ collapsed }) => {
  const location = useLocation();
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, route: "/dashboard" },
    { label: 'Reports', icon: FileText, route: "/reports" },
    { label: 'Microscopy Report', icon: Microscope, route: "/microscopy" },
    { label: 'Patient Management', icon: Users, route: "/patients" },
    { label: 'Camp Management', icon: ClipboardList, route: "/camps" },
    { label: 'QC Data', icon: Database, route: "/qc-data" }
  ];

  return (
    <nav className="mt-10 space-y-2 flex-1" role="navigation" aria-label="Main navigation">
      {navItems.map(({ label, icon: Icon, route }) => {
        const isActive = location.pathname === route;
        return (
          <Link
            to={route}
            key={label}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex items-center group transition-all duration-300 transform hover:scale-105 hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
              collapsed
                ? `justify-center w-10 h-10 rounded-lg text-sm font-medium ${isActive ? 'bg-slate-200 text-blue-600 shadow-md' : 'text-slate-700 hover:bg-blue-50'}`
                : `space-x-3 px-3 py-2 rounded text-sm font-medium ${isActive ? 'bg-slate-200 text-blue-600 shadow-md' : 'text-slate-700 hover:bg-blue-50'}`
            }`}
          >
            <Icon className={`${isActive ? 'text-blue-500' : 'text-slate-600'} ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-300`} aria-hidden="true" />
            {!collapsed && <span>{label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {label}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
};
NavigationMenu.propTypes = { collapsed: PropTypes.bool.isRequired };

// Logout Section
const LogoutSection = ({ collapsed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    toast.success("Logged out successfully");
    navigate("/login");
  };
  return (
    <div className="mt-auto pt-4">
      <button
        onClick={handleLogout}
        aria-label="Logout"
        className={`relative flex items-center cursor-pointer hover:text-red-600 hover:bg-red-50 text-sm font-medium text-slate-700 group transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 w-full ${
          collapsed ? 'justify-center h-10 rounded-lg' : 'space-x-2 px-3 py-2 rounded-lg'
        }`}
      >
        <LogOut className={`text-red-500 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} aria-hidden="true" />
        {!collapsed && <span>Logout</span>}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Logout
          </div>
        )}
      </button>
      {!collapsed && <div className="mt-2 text-xs ml-6 text-slate-400">Version 1.0.0</div>}
    </div>
  );
};
LogoutSection.propTypes = { collapsed: PropTypes.bool.isRequired };

// Sidebar Component
const Sidebar = ({ collapsed, onToggleCollapse }) => {
  return (
    <aside
      className={`relative h-full bg-white/90 backdrop-blur-sm p-4 transition-all border-r border-blue-100 flex flex-col shadow-lg z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      aria-label="Sidebar navigation"
      onClick={(e) => { e.stopPropagation(); }}
    >
      <CollapseToggleButton collapsed={collapsed} onToggle={onToggleCollapse} />
      <LogoSection collapsed={collapsed} />
      <NavigationMenu collapsed={collapsed} />
      <LogoutSection collapsed={collapsed} />
    </aside>
  );
};
Sidebar.propTypes = { collapsed: PropTypes.bool.isRequired, onToggleCollapse: PropTypes.func.isRequired };

// Header Component with Database Integration
const Header = ({ pageTitle = "Dashboard" }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux auth
  const { user, token } = useSelector((state) => state.auth);

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Helper: initials
  const getInitials = (name, username) => {
    if (name && name.trim().length) {
      const parts = name.trim().split(/\s+/);
      const first = parts[0]?.[0] || '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
      return (first + last || first).toUpperCase();
    }
    return (username || 'U').slice(0, 2).toUpperCase();
  };

  // Fetch pathologist profile data
  const fetchUserProfile = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { user: u } = await res.json(); // { success, user }

      setUserProfile({
        name: u?.name || user?.name || user?.username,
        title: u?.designation || user?.designation || 'Pathologist',
        initials: getInitials(u?.name || user?.name, user?.username),
        photo: u?.photo
      });
    } catch (error) {
      // fallback to what we already have from Redux auth
      setUserProfile(prev => prev || {
        name: user?.name || user?.username,
        title: user?.designation || 'Pathologist',
        initials: getInitials(user?.name, user?.username),
        photo: user?.photo
      });
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, token, user]);

  // Notifications (demo-safe)
  const fetchNotificationCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/count`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count || 0);
      }
    } catch {
      setNotificationCount(1);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    if (user && token) {
      fetchUserProfile();
      fetchNotificationCount();
    }
  }, [user, token, fetchUserProfile, fetchNotificationCount]);

  const toggleUserDropdown = useCallback(() => setShowUserDropdown(p => !p), []);
  const closeDropdown = useCallback(() => setShowUserDropdown(false), []);
  useEffect(() => {
    const handleClickOutside = () => { if (showUserDropdown) closeDropdown(); };
    if (showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserDropdown, closeDropdown]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Compute displayed values (prefer API profile, then Redux user, then fallbacks)
  const displayName  = userProfile?.name ?? user?.name ?? user?.username ?? 'Pathologist';
  const displayTitle = userProfile?.title ?? user?.designation ?? 'Pathologist';

  // Loading state
  if (loading && !userProfile) {
    return (
      <header className="relative h-16 bg-white border-b border-gray-200 z-40">
        <div className="h-full flex items-center justify-between px-6">
          <div><h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1></div>
          <div className="flex items-center space-x-4">
            <div className="animate-pulse w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="animate-pulse">
              <div className="w-20 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative h-16 bg-white border-b border-gray-200 z-40">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left side - Page Title */}
        <div><h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1></div>

        {/* Right side - Notifications and User */}
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => navigate('/notifications')}>
            <Bell className="w-5 h-5 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Button */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); toggleUserDropdown(); }}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                showUserDropdown ? 'bg-gray-100' : 'hover:bg-gray-100'
              }`}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {userProfile?.photo ? (
                  <img
                    src={userProfile.photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className={`text-white text-sm font-semibold ${userProfile?.photo ? 'hidden' : 'flex'}`}>
                  {getInitials(displayName, user?.username)}
                </span>
              </div>

              {/* User Info */}
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{displayTitle}</p>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                onClick={(e) => e.stopPropagation()}
                role="menu"
                aria-label="User menu"
              >
                <div className="py-1">
                  <button
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-gray-700 focus:outline-none focus:bg-gray-50"
                    onClick={() => { navigate("/profile"); closeDropdown(); }}
                    role="menuitem"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-gray-700 focus:outline-none focus:bg-gray-50"
                    onClick={() => { navigate("/settings"); closeDropdown(); }}
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-red-600 focus:outline-none focus:bg-gray-50"
                    onClick={() => { handleLogout(); closeDropdown(); }}
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
Header.propTypes = { pageTitle: PropTypes.string };

// Main Layout Component
export default function LayoutShell({ children, pageTitle }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = useCallback(() => {
    if (pageTitle) return pageTitle;
    const routeTitles = {
      '/dashboard': 'Dashboard',
      '/reports': 'Reports',
      '/microscopy': 'Microscopy Report',
      '/patients': 'Patient Management',
      '/camps': 'Camp Management',
      '/qc-data': 'QC Data',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/notifications': 'Notifications'
    };
    return routeTitles[location.pathname] || 'Dashboard';
  }, [pageTitle, location.pathname]);

  const handleToggleCollapse = useCallback(() => setCollapsed(prev => !prev), []);

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 flex bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header pageTitle={getPageTitle()} />
          <main className="flex-1 overflow-auto">
            <div className="h-full w-full">{children}</div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
LayoutShell.propTypes = { children: PropTypes.node.isRequired, pageTitle: PropTypes.string };
