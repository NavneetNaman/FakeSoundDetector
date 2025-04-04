import React from "react";
import "./Accuracy.css";

function Accuracy() {
  const accuracyPercentage = 71; // Dynamic accuracy value

  return (
    <div className="accuracy-container">
      <h2>System Accuracy</h2>
      <p className="accuracy-score">Model Accuracy: {accuracyPercentage}%</p>

      {/* Progress Bar Visualization */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${accuracyPercentage}%` }}
        >
          {accuracyPercentage}%
        </div>
      </div>
    </div>
  );
}

export default Accuracy;
