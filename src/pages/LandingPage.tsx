import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { CoreCapabilities } from '../components/landing/CoreCapabilities';
import { LandingFooter } from '../components/landing/LandingFooter';
import '../styles/landing.css';

export const LandingPage: React.FC = () => {
  const handleStartTrial = () => {
    window.location.href = '/login';
  };

  const handleViewDemo = () => {
    console.log('Open Demo View');
  };

  return (
    <div className="landing-container">
      <HeroSection onStartTrial={handleStartTrial} onViewDemo={handleViewDemo} />
      <CoreCapabilities />
      <LandingFooter />
    </div>
  );
};