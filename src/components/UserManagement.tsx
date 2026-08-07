import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchUsers,
  fetchRoles,
  createUser,
  activateUser,
  deactivateUser,
  type BackendUser,
  type BackendRole,
  type CreateUserPayload,
} from "../utils/apiClient";

export const UserManagement: React.FC = () => {
  const { hasPermission, hasRole } = useAuth();
  const isAdmin = hasPermission("USERS_MANAGE") || hasPermission("USER_WRITE") || hasRole("ADMIN");

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [roles, setRoles] = useState<BackendRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState<CreateUserPayload>({
    username: "",
    email: "",
    password: "",
    roleId: "",
    enabled: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Users and Roles from Backend API
  const loadUsersAndRoles = async () => {
    setLoading(true);
    try {
      const [userData, roleData] = await Promise.allSettled([fetchUsers(), fetchRoles()]);
      
      let fetchedUsers: BackendUser[] = [];
      if (userData.status === "fulfilled") {
        fetchedUsers = Array.isArray(userData.value) ? userData.value : (userData.value as any)?.data || [];
        setUsers(fetchedUsers);
      }

      if (roleData.status === "fulfilled" && Array.isArray(roleData.value) && roleData.value.length > 0) {
        setRoles(roleData.value);
      } else {
        // Extract existing roleId mappings from user list if /api/roles returns empty
        const roleMap = new Map<string, string>();
        fetchedUsers.forEach((u: any) => {
          if (u.roleId && u.roleName) {
            roleMap.set(u.roleName, u.roleId);
          }
        });
        if (roleMap.size > 0) {
          const extractedRoles: BackendRole[] = Array.from(roleMap.entries()).map(([name, id]) => ({
            id,
            name,
          }));
          setRoles(extractedRoles);
        }
      }
    } catch (err: any) {
      console.warn("Failed to load users from backend:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndRoles();
  }, []);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.roleName || "").toLowerCase().includes(term)
    );
  });

  // Select all logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle user status
  const handleToggleStatus = async (user: BackendUser) => {
    if (!isAdmin) return;
    try {
      if (user.enabled) {
        await deactivateUser(user.id);
      } else {
        await activateUser(user.id);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, enabled: !u.enabled } : u))
      );
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  // Bulk actions
  const handleBulkStatusChange = async (enable: boolean) => {
    if (!isAdmin || selectedUserIds.length === 0) return;
    try {
      await Promise.all(
        selectedUserIds.map((id) =>
          enable ? activateUser(id) : deactivateUser(id)
        )
      );
      setUsers((prev) =>
        prev.map((u) =>
          selectedUserIds.includes(u.id) ? { ...u, enabled: enable } : u
        )
      );
      setSelectedUserIds([]);
    } catch (err: any) {
      alert(`Bulk update failed: ${err.message}`);
    }
  };

  // Submit Create User
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!modalForm.roleId) {
      setFormError("Please select a role for the user.");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: CreateUserPayload = {
        username: modalForm.username,
        email: modalForm.email,
        password: modalForm.password,
        roleId: modalForm.roleId,
        enabled: modalForm.enabled ?? true,
      };

      const newUser = await createUser(payload);
      setUsers((prev) => [newUser, ...prev]);
      setIsModalOpen(false);
      setModalForm({
        username: "",
        email: "",
        password: "",
        roleId: "",
        enabled: true,
      });
    } catch (err: any) {
      setFormError(err.message || "Failed to create user");
    } finally {
      setFormSubmitting(false);
    }
  };

  const activeSessionsCount = users.filter((u) => u.enabled).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{
                color: "var(--color-primary)",
                backgroundColor: "var(--color-surface-container-high)",
                padding: "4px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              shield_person
            </span>
            <p
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-secondary)",
                fontWeight: 700,
              }}
            >
              Administration
            </p>
          </div>
          <h2 className="page-title">User Management</h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-secondary)",
              marginTop: "4px",
              maxWidth: "600px",
            }}
          >
            Manage system access, assign roles (Admin, Manager, Cashier), and monitor user activity across all Vino Health modules.
          </p>
        </div>

        {isAdmin && (
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "10px 20px", marginTop: 0 }}
            onClick={() => setIsModalOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New User
          </button>
        )}
      </div>

      {/* Analytics / Stats Row */}
      <div className="grid-3">
        <div className="stat-card" style={{ position: "relative", overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "var(--color-secondary)",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            <span>Total System Users</span>
            <span className="material-symbols-outlined">group</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "8px" }}>
            <span className="stat-val">{users.length}</span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-primary)",
                backgroundColor: "rgba(0, 108, 73, 0.1)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <span className="material-symbols-outlined text-[14px]">trending_up</span> Live count
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "var(--color-secondary)",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            <span>Active Enabled Accounts</span>
            <span className="material-symbols-outlined">login</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
            <span className="stat-val">{activeSessionsCount}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--color-secondary)" }}>
              of {users.length} enabled
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "var(--color-secondary)",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            <span>Governance Scope</span>
            <span className="material-symbols-outlined text-primary">verified_user</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-secondary)", marginTop: "8px" }}>
            Admin-only provisioning enforced. Cashiers & Managers cannot create or edit user accounts.
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="stat-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          {/* Search Box */}
          <div className="input-container" style={{ width: "280px" }}>
            <span className="material-symbols-outlined input-icon text-[18px]">search</span>
            <input
              type="text"
              className="form-input"
              style={{ padding: "8px 12px 8px 36px", fontSize: "0.85rem" }}
              placeholder="Search by name, email or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Bulk Actions */}
          {selectedUserIds.length > 0 && isAdmin && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-secondary)" }}>
                {selectedUserIds.length} selected
              </span>
              <button
                type="button"
                onClick={() => handleBulkStatusChange(true)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "var(--color-surface-container-high)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span> Activate
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange(false)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "#ffdad6",
                  color: "#93000a",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span className="material-symbols-outlined text-[16px]">block</span> Deactivate
              </button>
            </div>
          )}
        </div>

        {/* User Table */}
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--color-secondary)" }}>
            <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            <p style={{ marginTop: "8px" }}>Loading system users...</p>
          </div>
        ) : (
          <table className="data-table" style={{ border: "none" }}>
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.length > 0 &&
                      selectedUserIds.length === filteredUsers.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>User Details</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                {isAdmin && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "24px" }}>
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => (
                  <tr key={userItem.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(userItem.id)}
                        onChange={() => handleSelectUser(userItem.id)}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="user-avatar">
                          {userItem.username ? userItem.username.slice(0, 2).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: "var(--color-on-surface)" }}>
                            {userItem.username}
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-secondary)" }}>
                            {userItem.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                          backgroundColor:
                            userItem.roleName?.toUpperCase() === "ADMIN"
                              ? "var(--color-on-surface)"
                              : userItem.roleName?.toUpperCase() === "MANAGER"
                              ? "var(--color-primary)"
                              : "var(--color-surface-container-high)",
                          color:
                            userItem.roleName?.toUpperCase() === "ADMIN" ||
                            userItem.roleName?.toUpperCase() === "MANAGER"
                              ? "#ffffff"
                              : "var(--color-on-surface)",
                        }}
                      >
                        {userItem.roleName || "CASHIER"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: userItem.enabled ? "var(--color-primary)" : "var(--color-secondary)",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            color: userItem.enabled ? "var(--color-primary)" : "var(--color-secondary)",
                          }}
                        >
                          {userItem.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "var(--color-secondary)", fontSize: "0.8rem" }}>
                      {userItem.createdAt
                        ? new Date(userItem.createdAt).toLocaleDateString()
                        : "Oct 12, 2023"}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(userItem)}
                          title={userItem.enabled ? "Deactivate User" : "Activate User"}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            color: userItem.enabled ? "#ba1a1a" : "var(--color-primary)",
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {userItem.enabled ? "person_off" : "person_add"}
                          </span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-xl)",
              maxWidth: "480px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ fontWeight: 700, fontSize: "1.2rem" }}>Add New User</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && <div className="error-banner">{formError}</div>}

            <form onSubmit={handleCreateUserSubmit}>
              <div className="form-group">
                <label className="form-label">Full Username</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: "12px" }}
                  required
                  placeholder="e.g. janesmith"
                  value={modalForm.username}
                  onChange={(e) =>
                    setModalForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: "12px" }}
                  required
                  placeholder="e.g. jane@zeeshop.pro"
                  value={modalForm.email}
                  onChange={(e) =>
                    setModalForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <div className="input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    style={{ paddingLeft: "12px", paddingRight: "40px" }}
                    required
                    placeholder="Enter secure password"
                    value={modalForm.password || ""}
                    onChange={(e) =>
                      setModalForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-secondary)",
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Role</label>
                <select
                  className="form-input"
                  style={{ paddingLeft: "12px" }}
                  required
                  value={modalForm.roleId || ""}
                  onChange={(e) =>
                    setModalForm((prev) => ({ ...prev, roleId: e.target.value }))
                  }
                >
                  <option value="">Select a role (Manager / Cashier)...</option>
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id || r.name} value={r.id || r.name}>
                        {r.name} {r.description ? `- ${r.description}` : ""}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="MANAGER">Store Manager (MANAGER)</option>
                      <option value="CASHIER">Cashier / Staff (CASHIER)</option>
                      <option value="ADMIN">Super Administrator (ADMIN)</option>
                    </>
                  )}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--color-outline-variant)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid var(--color-outline-variant)",
                    background: "none",
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary"
                  style={{ width: "auto", padding: "8px 20px", marginTop: 0 }}
                >
                  {formSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
