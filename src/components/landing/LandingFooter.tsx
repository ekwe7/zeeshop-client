import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="landing-footer">
      <div className="section-wrapper footer-content">
        <div className="footer-logo">
          <div className="brand-badge">Z</div>
          <span>ZeeShop</span>
        </div>

        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>

        <div className="footer-copy">
          © {new Date().getFullYear()} ZeeShop Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
};