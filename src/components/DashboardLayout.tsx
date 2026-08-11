import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/auth-permissions";
import { ROLE_DEFINITIONS } from "../types/auth-permissions";
import { fetchProducts } from "../utils/apiClient";

export const DashboardLayout: React.FC = () => {
  const { user, tokens, logout, hasPermission, hasRole, switchRoleDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "catalog" | "inventory" | "users" | "sales" | "settings" | "debt" | "suppliers"
  >(() => (user?.role === "CASHIER" ? "sales" : "catalog"));
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
              onClick={() => setActiveTab("catalog")}
              className={`nav-item ${activeTab === "catalog" ? "active" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px]">category</span>
              Master Catalog
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`nav-item ${activeTab === "inventory" ? "active" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              Stock Inventory
            </button>

            <button
              onClick={() => setActiveTab("suppliers")}
              className={`nav-item ${activeTab === "suppliers" ? "active" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              Suppliers
            </button>

            <button
              onClick={() => setActiveTab("debt")}
              className={`nav-item ${activeTab === "debt" ? "active" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              Debt Management
            </button>

            {(hasPermission("USERS_MANAGE") || hasPermission("USER_READ") || hasPermission("USER_WRITE") || hasRole("ADMIN")) && (
              <button
                onClick={() => setActiveTab("users")}
                className={`nav-item ${activeTab === "users" ? "active" : ""}`}
              >
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                Users & Roles
              </button>
            )}

            {(hasPermission("SETTINGS_MANAGE") || hasRole("ADMIN")) && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Store Settings
              </button>
            )}
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


        {/* Render Active Tab */}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "catalog" && <CatalogTab />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "sales" && <SalesTab />}
        {activeTab === "suppliers" && <SupplierManagementTab />}
        {activeTab === "debt" && <DebtManagementTab />}
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

import { PosCheckoutTab } from "./PosCheckoutTab";

const SalesTab: React.FC = () => {
  return <PosCheckoutTab />;
};

import { CatalogDashboard } from "./CatalogDashboard";

const CatalogTab: React.FC = () => {
  return <CatalogDashboard />;
};

import { InventoryDashboard } from "./InventoryDashboard";
import { SupplierManagementTab } from "./SupplierManagementTab";
import { DebtManagementTab } from "./DebtManagementTab";

const InventoryTab: React.FC = () => {
  return <InventoryDashboard />;
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
