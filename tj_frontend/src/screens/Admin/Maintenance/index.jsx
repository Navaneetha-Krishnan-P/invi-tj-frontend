import React from 'react'

const Maintenance = ({ onBack }) => {
  return (
   <div className="analyse-container">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <h3>Analyse Trades</h3>
      <p>Trade analytics content goes here.</p>
    </div>
  )
}

export default Maintenance