import React from 'react';

interface HeroSectionProps {
  onStartTrial?: () => void;
  onViewDemo?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartTrial, onViewDemo }) => {
  return (
    <section className="hero-section">
      {/* Background SVG Grid */}
      <div className="hero-bg-pattern">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#bbcabf" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="hero-content">

        <h1 className="hero-title">
          Modern Retail Management for Growth
        </h1>

        <p className="hero-description">
          Streamline operations, optimize inventory and unlock data-driven insights. Built for high-velocity teams who demand speed without sacrificing control
        </p>

        <div className="hero-actions">
          <button className="btn-primary" onClick={onStartTrial}>
            Start Free Trial
          </button>
          
        </div>
      </div>
    </section>
  );
};