import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth.js';
import './Sidebar.css';
import { FaChartBar, FaUserShield } from "react-icons/fa";
import { FaHandHoldingDollar } from "react-icons/fa6";
import { HiDocumentCurrencyRupee } from "react-icons/hi2";
import { TbTablePlus } from "react-icons/tb";




const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (isMobile) {
      onClose();
    }
  };

  const sidebarClass = isMobile 
    ? `sidebar ${isOpen ? 'mobile-open' : ''}` 
    : `sidebar ${isOpen ? 'desktop-open' : ''}`;

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen && isMobile ? 'active' : ''}`}
        onClick={onClose}
      />
      <aside className={sidebarClass}>
        <nav className="sidebar-nav">
           {hasRole && hasRole('ADMIN') && (
            <NavLink 
              to="/admin" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
              style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
            >
              <span><FaUserShield size={24} /></span>
              <span>Admin</span>
            </NavLink> 
          )}
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
            style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
          >
            <FaChartBar size={24}/>
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/forex-market" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
            style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
          >
            <span><FaHandHoldingDollar size={24} /></span>
            <span>Forex Market</span>
          </NavLink>
          
          <NavLink 
            to="/indian-market" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
            style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
          >
            <span><HiDocumentCurrencyRupee size={24} /></span>
            <span>Indian Market</span>
          </NavLink>
          
          <NavLink 
            to="/trade-details" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
            style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
          >
            <span> <TbTablePlus size={24} /></span>
            <span>Trade Details</span>
          </NavLink>
          
        </nav>
        <div className="sidebar-footer">
          <small>© {new Date().getFullYear()} Invikings. All rights reserved.</small>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
