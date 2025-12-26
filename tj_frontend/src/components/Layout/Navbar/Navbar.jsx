import { useAuth } from '../../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Navbar.css';
import { CgProfile } from "react-icons/cg";
import invikingsLogo from '../../../assets/InvikingsPic.png';


const Navbar = ({ onMenuToggle }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      setIsLoggingOut(true);
      
      await signOut;
      
      setTimeout(() => {
        setIsLoggingOut(false);
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.profile-container')) {
      setShowProfileMenu(false);
    }
  };

  useEffect(() => {
    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileMenu]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="menu-toggle" onClick={onMenuToggle}>
              <img src={invikingsLogo} alt="Menu" style={{ width: '24px', height: '24px' }} />
            </button>
            <div className="navbar-brand">
              <h2>Trading Journal</h2>
            </div>
          </div>
          <div className="navbar-user">
            <div 
              className="profile-container"
              onClick={toggleProfileMenu}
            >
            <div className="profile-icon">
              <CgProfile size={24} />
            </div>
            
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="profile-info">
                    <h4>{user?.name || 'User'}</h4>
                    <p className="profile-email">{user?.email}</p>
                    {user?.role_type && (
                      <p className="profile-role">{user.role_type}</p>
                    )}
                  </div>
                </div>
                                
                <button className="profile-logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </nav>

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="logout-confirm-buttons">
              <button className="logout-confirm-btn" onClick={confirmLogout}>
                Confirm
              </button>
              <button className="logout-cancel-btn" onClick={cancelLogout}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoggingOut && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <h3>Logging Out...</h3>
            <p>Please wait while we sign you out.</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
