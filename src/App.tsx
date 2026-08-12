import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import './styles/global.css';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // If user is already authenticated, show the dashboard
  if (user) {
    return <DashboardLayout />;
  }

  // If user clicked any action button on LandingPage, navigate to LoginPage
  if (showLogin) {
    return <LoginPage onBackToLanding={() => setShowLogin(false)} />;
  }

  // Default initial page: LandingPage
  return <LandingPage onNavigateToLogin={() => setShowLogin(true)} />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;