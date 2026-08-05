import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/auth-permissions";
import { ROLE_DEFINITIONS } from "../types/auth-permissions";

export const DashboardLayout: React.FC = () => {
  const { user, tokens, logout, hasPermission, switchRoleDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "users" | "sales" | "settings"
  >("overview");
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);

  if (!user) return null;

  const currentRoleInfo = ROLE_DEFINITIONS[user.role];
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          {/* Brand header */}
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shopping_bag
              </span>
            </div>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>ZeeShop</h1>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
                POST /api/v1/auth/login
              </span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="user-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="user-avatar">{initials}</div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.username}</p>
                <span className="role-badge">{currentRoleInfo.title}</span>
              </div>
            </div>

            <button
              onClick={() => setShowTokenModal(true)}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '0.75rem',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                marginTop: '8px',
              }}
            >
              <span className="material-symbols-outlined text-[14px]">key</span>
              Inspect JWT Tokens
            </button>

            {/* Interactive Role Switcher */}
            <div style={{ position: 'relative', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-outline-variant)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>
                  Role: <strong style={{ color: 'var(--color-primary)' }}>{user.role}</strong>
                </span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {showRoleSwitcher && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    zIndex: 30,
                    padding: '4px',
                    marginTop: '4px',
                  }}
                >
                  {(["ADMIN", "MANAGER", "CASHIER"] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRoleDemo(r);
                        setShowRoleSwitcher(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 8px',
                        fontSize: '0.75rem',
                        border: 'none',
                        background: user.role === r ? 'var(--color-surface-container)' : 'transparent',
                        fontWeight: user.role === r ? 700 : 400,
                        color: user.role === r ? 'var(--color-primary)' : 'var(--color-on-surface)',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="nav-list">
            <button
              onClick={() => setActiveTab("overview")}
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab("sales")}
              className={`nav-item ${activeTab === "sales" ? "active" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
              POS / Checkout
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`nav-item ${activeTab === "inventory" ? "active" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              Inventory Catalog
            </button>

            <button
              onClick={() => {
                if (hasPermission("USERS_MANAGE")) setActiveTab("users");
              }}
              disabled={!hasPermission("USERS_MANAGE")}
              className={`nav-item ${activeTab === "users" ? "active" : ""} ${
                !hasPermission("USERS_MANAGE") ? "disabled" : ""
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              Users & Roles
            </button>

            <button
              onClick={() => {
                if (hasPermission("SETTINGS_MANAGE")) setActiveTab("settings");
              }}
              disabled={!hasPermission("SETTINGS_MANAGE")}
              className={`nav-item ${activeTab === "settings" ? "active" : ""} ${
                !hasPermission("SETTINGS_MANAGE") ? "disabled" : ""
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Store Settings
            </button>
          </nav>
        </div>

        {/* Logout Action */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '10px',
              border: 'none',
              backgroundColor: '#ffdad6',
              color: '#93000a',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top bar info */}
        <header className="page-header">
          <div>
            <h2 className="page-title" style={{ textTransform: 'capitalize' }}>
              {activeTab} Section
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', marginTop: '4px' }}>
              Authenticated User: <strong>{user.username}</strong> ({user.email}) &bull; Role:{" "}
              <strong style={{ color: 'var(--color-primary)' }}>{user.role}</strong>
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)', display: 'block', marginBottom: '4px' }}>
              Permissions:
            </span>
            {user.permissions.map((p) => (
              <span key={p} className="perm-pill">
                {p}
              </span>
            ))}
          </div>
        </header>

        {/* Render Active Tab */}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "sales" && <SalesTab />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "settings" && <SettingsTab />}

        {/* Token Modal */}
        {showTokenModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: 'var(--radius-xl)',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>JWT Tokens</h3>
                <button onClick={() => setShowTokenModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                <p style={{ fontWeight: 700, marginBottom: '4px' }}>accessToken:</p>
                <div style={{ padding: '8px', background: 'var(--color-surface)', borderRadius: '4px', marginBottom: '12px' }}>
                  {tokens?.accessToken}
                </div>
                <p style={{ fontWeight: 700, marginBottom: '4px' }}>refreshToken:</p>
                <div style={{ padding: '8px', background: 'var(--color-surface)', borderRadius: '4px' }}>
                  {tokens?.refreshToken}
                </div>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="btn-primary"
                style={{ marginTop: '20px' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/* --- TAB COMPONENTS WITH PURE CSS --- */

const OverviewTab: React.FC = () => {
  const { hasPermission, user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #005c3e 0%, #006c49 100%)',
          color: '#ffffff',
        }}
      >
        <span className="brand-badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          Unified Architecture
        </span>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '8px 0' }}>
          Authenticated as {user?.role}
        </h3>
        <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          UI routes and action buttons adapt dynamically according to the permissions array.
        </p>
      </div>

      {hasPermission("ANALYTICS_READ") ? (
        <div className="grid-3">
          <div className="stat-card">
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 700 }}>
              Total Sales Today
            </span>
            <p className="stat-val">$4,850.00</p>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 700 }}>
              Items Sold
            </span>
            <p className="stat-val">142 Units</p>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 700 }}>
              Low Stock Alerts
            </span>
            <p className="stat-val" style={{ color: '#ba1a1a' }}>3 Products</p>
          </div>
        </div>
      ) : (
        <div className="stat-card" style={{ textAlign: 'center', padding: '32px' }}>
          <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--color-secondary)' }}>lock</span>
          <p style={{ fontWeight: 600, marginTop: '8px' }}>Analytics Locked</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-secondary)' }}>Requires ANALYTICS_READ permission.</p>
        </div>
      )}
    </div>
  );
};

const SalesTab: React.FC = () => {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>POS Checkout</h3>
      <div className="grid-3">
        {["Minimalist Hoodie", "Leather Wallet", "Denim Jacket"].map((item, idx) => (
          <div key={item} className="role-picker-box" style={{ marginBottom: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item}</p>
            <p style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
              ${(29.99 + idx * 15).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const InventoryTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("INVENTORY_WRITE");

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Inventory Catalog</h3>
        {canWrite && <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}>Add Item</button>}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product Name</th>
            <th>Stock</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontFamily: 'monospace' }}>Z-101</td>
            <td>Minimalist Hoodie</td>
            <td>45 units</td>
            <td>$29.99</td>
          </tr>
          <tr>
            <td style={{ fontFamily: 'monospace' }}>Z-102</td>
            <td>Leather Wallet</td>
            <td>12 units</td>
            <td>$44.99</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const UsersTab: React.FC = () => {
  return (
    <div className="stat-card">
      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>User & Role Governance</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-secondary)' }}>Manage store operators and permissions.</p>
    </div>
  );
};

const SettingsTab: React.FC = () => {
  return (
    <div className="stat-card" style={{ maxWidth: '600px' }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>Store Configuration</h3>
      <div className="form-group">
        <label className="form-label">Store Name</label>
        <input className="form-input" defaultValue="ZeeShop Retail Terminal" />
      </div>
      <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>Save Settings</button>
    </div>
  );
};
