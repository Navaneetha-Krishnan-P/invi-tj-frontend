import React, { useState } from 'react';
import './style.css';
import { FaChartLine, FaUserTie, FaTools } from 'react-icons/fa';

import AnalyseTrades from './AnalyseTrades';
import TradersProfile from './TradersProfile';
import Maintenance from './Maintenance';

const Admin = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);

  const openSection = (component) => {
    setActiveSection(component);
    setShowDashboard(false);
  };

  const goBack = () => {
    setActiveSection(null);
    setShowDashboard(true);
  };

  const adminMenu = [
    {
      title: 'Analyse Trades',
      icon: (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1976d2 40%, #64b5f6 100%)',
        }}>
          <FaChartLine size={50} color="#fff" />
        </span>
      ),
      component: <AnalyseTrades onBack={goBack} />,
    },
    {
      title: 'Traders Profile',
      icon: (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #388e3c 40%, #a5d6a7 100%)',
        }}>
          <FaUserTie size={50} color="#fff" />
        </span>
      ),
      component: <TradersProfile onBack={goBack} />,
    },
    {
      title: 'Maintenance',
      icon: (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #f9a825 40%, #fff59d 100%)',
        }}>
          <FaTools size={50} color="#fff" />
        </span>
      ),
      component: <Maintenance onBack={goBack} />,
    },
  ];

  return (
    <div className="admin-screen">

      <div className="screen-header">
        <h2>Admin Panel</h2>
        <p>Quick access to administrative tools and user management.</p>
      </div>

      <div className="admin-content">

        {/* DASHBOARD */}
        {showDashboard && (
          <div className="admin-grid">
            {adminMenu.map((item, index) => (
              <div
                key={index}
                className="admin-tile"
                onClick={() => openSection(item.component)}
              >
                <div className="tile-icon">{item.icon}</div>
                <div className="tile-label">{item.title}</div>
              </div>
            ))}
          </div>
        )}

        {/* SELECTED SECTION */}
        {!showDashboard && (
          <div className="admin-section">
            {activeSection}
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;
