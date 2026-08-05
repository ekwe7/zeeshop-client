import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await login(email, password);
      if (res.success) {
        setGranted(true);
      } else {
        setErrorMsg(res.error || 'Invalid credentials');
      }
    } catch {
      setErrorMsg('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-wrapper">
      <div className="login-card">
        {/* Left Side: Brand Imagery */}
        <div className="login-brand-side">
          <div className="brand-logo-area">
            <div className="brand-logo-icon">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                shopping_bag
              </span>
            </div>
            <span className="brand-title">ZeeShop</span>
          </div>

          <div>
            <div className="brand-badge">
              <span className="pulse-dot" />
              <span>Secure Authentication</span>
            </div>
            <h2 className="brand-headline">Retail Management Terminal</h2>
            <p className="brand-description">
              Enter authorized credentials to access your store portal.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-form-side">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="login-header-title">Welcome Back</h1>
              <p className="login-header-sub">Enter your credentials to log in.</p>
            </div>
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Home
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="error-banner">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address / Username
              </label>
              <div className="input-container">
                <span className="material-symbols-outlined input-icon text-[20px]">mail</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email Address"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-container">
                <span className="material-symbols-outlined input-icon text-[20px]">lock</span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '13px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              id="submitBtn"
              type="submit"
              disabled={loading}
              className={`btn-primary ${granted ? 'granted' : ''}`}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Authenticating...
                </>
              ) : granted ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  Authenticated
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
