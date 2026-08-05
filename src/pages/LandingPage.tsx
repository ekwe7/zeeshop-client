import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import '../styles/landing.css';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  return (
    <div className="landing-container">
      <HeroSection onStartTrial={onNavigateToLogin} />
    </div>
  );
};