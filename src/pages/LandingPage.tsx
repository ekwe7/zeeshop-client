import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import '../styles/landing.css';

export const LandingPage: React.FC = () => {
  const handleStartTrial = () => {
    window.location.href = '/login';
  };

  return (
    <div className="landing-container">
      <HeroSection onStartTrial={handleStartTrial} />
    </div>
  );
};