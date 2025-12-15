import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const { user, logout, isAdmin, isOfficer } = useAuth();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const getUserRole = () => {
    if (isAdmin()) return 'Administrator';
    if (isOfficer()) return 'Officer';
    return 'User';
  };

  const toggleDrawer = (open) => () => setDrawerOpen(open);
  const drawerCloseRef = React.useRef(null);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  React.useEffect(() => {
    if (drawerOpen) {
      setTimeout(() => drawerCloseRef.current?.focus?.(), 0);
    }
  }, [drawerOpen]);

  return (
    <header className="md-appbar md-elevation-2" role="banner">
      <div className="md-appbar-left">
        <button aria-label="Open menu" aria-controls="main-drawer" aria-expanded={drawerOpen} className="icon-btn ripple md-hide-desktop" onClick={toggleDrawer(true)}>
          <span className="material-icons">menu</span>
        </button>
        <Link to="/" className="brand ripple" aria-label="ResolveIT Home">
          <span className="material-icons md-brand-icon">support_agent</span>
          <span className="brand-text">ResolveIT</span>
        </Link>
      </div>

      <nav className="md-appbar-nav md-hide-mobile" role="navigation" aria-label="Primary Navigation">
        <Link to="/" className="md-nav-link">Home</Link>
        {!user && (
          <>
            <Link to="/login" className="md-nav-link">Login</Link>
            <Link to="/signup" className="md-nav-link">Sign Up</Link>
            <Link to="/anonymous" className="md-nav-link">Anonymous Report</Link>
          </>
        )}
        {user && !isAdmin() && !isOfficer() && (
          <>
            <Link to="/submit-complaint" className="md-nav-link">Submit Complaint</Link>
            <Link to="/my-complaints" className="md-nav-link">My Complaints</Link>
          </>
        )}
        {user && isAdmin() && (
          <Link to="/admin/dashboard" className="md-nav-link">Admin Dashboard</Link>
        )}
        {user && isOfficer() && (
          <Link to="/officer/dashboard" className="md-nav-link">Officer Dashboard</Link>
        )}
        {user && (isAdmin() || isOfficer()) && (
          <Link to="/reports" className="md-nav-link">Reports</Link>
        )}
      </nav>

      <div className="md-appbar-right">
        <div className="icon-btn ripple" aria-hidden="false">
          <NotificationCenter />
        </div>

        {user ? (
          <div className="user-chip md-elevation-1">
            <div className="avatar">{user.username?.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-role">{getUserRole()}</div>
            </div>
            <button aria-label="Logout" className="icon-btn" onClick={logout}>
              <span className="material-icons">logout</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Mobile Drawer */}
      <div id="main-drawer" className={`md-drawer ${drawerOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!drawerOpen}>
        <div id="main-drawer-sheet" className="md-drawer-sheet" aria-hidden={!drawerOpen}>
          <button ref={drawerCloseRef} className="drawer-close icon-btn" aria-label="Close menu" onClick={toggleDrawer(false)}>
            <span className="material-icons">close</span>
          </button>
          <nav className="drawer-nav">
            <Link to="/" onClick={toggleDrawer(false)}>Home</Link>
            {!user && (
              <>
                <Link to="/login" onClick={toggleDrawer(false)}>Login</Link>
                <Link to="/signup" onClick={toggleDrawer(false)}>Sign Up</Link>
                <Link to="/anonymous" onClick={toggleDrawer(false)}>Anonymous Report</Link>
              </>
            )}
            {user && !isAdmin() && !isOfficer() && (
              <>
                <Link to="/submit-complaint" onClick={toggleDrawer(false)}>Submit Complaint</Link>
                <Link to="/my-complaints" onClick={toggleDrawer(false)}>My Complaints</Link>
              </>
            )}
            {user && isAdmin() && (
              <Link to="/admin/dashboard" onClick={toggleDrawer(false)}>Admin Dashboard</Link>
            )}
            {user && isOfficer() && (
              <Link to="/officer/dashboard" onClick={toggleDrawer(false)}>Officer Dashboard</Link>
            )}
            {user && (isAdmin() || isOfficer()) && (
              <Link to="/reports" onClick={toggleDrawer(false)}>Reports</Link>
            )}
          </nav>
        </div>
        <div className="md-drawer-backdrop" onClick={toggleDrawer(false)} />
      </div>
    </header>
  );
};

export default Navbar;
