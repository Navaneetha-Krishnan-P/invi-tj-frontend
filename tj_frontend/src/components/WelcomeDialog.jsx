import './WelcomeDialog.css';

const WelcomeDialog = ({ onClose }) => {
  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div className="welcome-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-header">
          <h2>Welcome to Trading Journal ! </h2>
          <button className="welcome-close" onClick={onClose}>×</button>
        </div>
        <div className="welcome-content">
          <p className="welcome-intro">
            Track and analyze your trading performance across Forex and Indian markets
          </p>
          <div className="welcome-features">
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Real-time Analytics</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💹</span>
              <span>Performance Calculator</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <span>Visual Reports</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDialog;
