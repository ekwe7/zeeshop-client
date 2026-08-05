import React from 'react';

export const CoreCapabilities: React.FC = () => {
  return (
    <section className="features-section">
      <div className="section-wrapper">
        <div className="features-header">
          <h2 className="features-title">Core Capabilities</h2>
          <p className="features-subtitle">Everything you need to scale your retail operations.</p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div className="icon-wrapper primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}></span>
            </div>
            <h3 className="card-title">Stock Accuracy</h3>
            <p className="card-body">
              Real-time inventory synchronization across all locations. Prevent stockouts and reduce holding costs with predictive reordering.
            </p>
            <div className="card-graphic bar-chart">
              <div className="bar bar-1" />
              <div className="bar bar-2" />
              <div className="bar bar-3" />
              <div className="bar bar-4" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div className="icon-wrapper secondary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}></span>
            </div>
            <h3 className="card-title">Sales Tracking</h3>
            <p className="card-body">
              Granular sales analytics. Monitor daily performance, identify top-selling products, and track revenue across channels effortlessly.
            </p>
            <div className="card-graphic" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none" style={{ padding: '8px 16px' }}>
                <path d="M0,40 Q20,30 40,35 T70,15 T100,20" fill="none" stroke="#565e74" strokeWidth="3" />
                <circle cx="70" cy="15" r="4" fill="#565e74" />
              </svg>
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="icon-wrapper tertiary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}></span>
            </div>
            <h3 className="card-title">Customer Management</h3>
            <p className="card-body">
              Build lasting relationships. Track purchase history, manage loyalty programs, and segment your audience for targeted campaigns.
            </p>
            <div className="card-graphic customer-stack">
              <div className="stack-row" style={{ opacity: 0.8 }}>
                <div className="avatar" />
                <div className="bar-skeleton" style={{ width: '66%' }} />
              </div>
              <div className="stack-row" style={{ opacity: 0.6 }}>
                <div className="avatar" />
                <div className="bar-skeleton" style={{ width: '50%' }} />
              </div>
              <div className="stack-row" style={{ opacity: 0.4 }}>
                <div className="avatar" />
                <div className="bar-skeleton" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};