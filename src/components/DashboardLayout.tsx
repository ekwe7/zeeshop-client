import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/auth-permissions";
import { ROLE_DEFINITIONS } from "../types/auth-permissions";
import { fetchProducts } from "../utils/apiClient";

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
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Vino Health</h1>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="user-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-avatar">{initials}</div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.username}</p>
                <span className="role-badge">{currentRoleInfo?.title || user.role}</span>
              </div>
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
                if (hasPermission("USERS_MANAGE") || hasPermission("USER_READ") || hasPermission("USER_WRITE") || hasRole("ADMIN")) {
                  setActiveTab("users");
                }
              }}
              disabled={
                !hasPermission("USERS_MANAGE") &&
                !hasPermission("USER_READ") &&
                !hasPermission("USER_WRITE") &&
                !hasRole("ADMIN")
              }
              className={`nav-item ${activeTab === "users" ? "active" : ""} ${
                !hasPermission("USERS_MANAGE") &&
                !hasPermission("USER_READ") &&
                !hasPermission("USER_WRITE") &&
                !hasRole("ADMIN")
                  ? "disabled"
                  : ""
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

import { OverviewTab } from "./OverviewTab";

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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(Array.isArray(data) ? data : data.content || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load live products from server");
        setLoading(false);
      });
  }, []);

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Inventory Catalog (Live Server Data)</h3>
        {canWrite && <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}>Add Item</button>}
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-secondary)' }}>
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          <p style={{ marginTop: '8px' }}>Fetching products from live backend...</p>
        </div>
      ) : error ? (
        <div className="error-banner" style={{ marginBottom: '16px' }}>
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID / SKU</th>
              <th>Product Name</th>
              <th>Stock</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '16px' }}>
                  No products found in backend catalog.
                </td>
              </tr>
            ) : (
              products.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td style={{ fontFamily: 'monospace' }}>{item.sku || item.id || `PROD-${idx + 1}`}</td>
                  <td>{item.name || item.title || "Unnamed Product"}</td>
                  <td>{item.stockQuantity ?? item.stock ?? item.quantity ?? 0} units</td>
                  <td>${Number(item.price || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

import { UserManagement } from "./UserManagement";

const UsersTab: React.FC = () => {
  return <UserManagement />;
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
