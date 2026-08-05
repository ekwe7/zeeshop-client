import React, { createContext, useContext, useState, ReactNode } from "react";
import type {
  User,
  Role,
  Permission,
  AuthResponsePayload,
} from "../types/auth-permissions";
import {
  MOCK_USERS_DB,
  ROLE_DEFINITIONS,
} from "../types/auth-permissions";

interface AuthContextType {
  user: User | null;
  tokens: { accessToken: string; refreshToken: string } | null;
  login: (
    email: string,
    pass: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: Role | Role[]) => boolean;
  switchRoleDemo: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("zeeshop_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [tokens, setTokens] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(() => {
    const savedTokens = localStorage.getItem("zeeshop_tokens");
    if (savedTokens) {
      try {
        return JSON.parse(savedTokens);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  /**
   * Simulates calling POST /api/v1/auth/login to AuthService.java
   */
  const login = async (
    email: string,
    pass: string,
  ): Promise<{ success: boolean; error?: string }> => {
    // Simulate HTTP POST request latency to /api/v1/auth/login
    await new Promise((res) => setTimeout(res, 800));

    const mockKey = Object.keys(MOCK_USERS_DB).find(
      (k) => k.toLowerCase() === email.toLowerCase(),
    );
    let payload: AuthResponsePayload;

    if (mockKey && MOCK_USERS_DB[mockKey]) {
      const dbRecord = MOCK_USERS_DB[mockKey];
      payload = {
        accessToken: dbRecord.accessToken,
        refreshToken: dbRecord.refreshToken,
        username: dbRecord.username,
        email: dbRecord.email,
        role: dbRecord.role,
        permissions: dbRecord.permissions,
      };
    } else {
      // Dynamic fallback mapping for custom login tests
      let role: Role = "CASHIER";
      if (email.includes("admin")) role = "ADMIN";
      else if (email.includes("manager")) role = "MANAGER";

      payload = {
        accessToken: `jwt_access_${Math.random().toString(36).substring(2)}`,
        refreshToken: `jwt_refresh_${Math.random().toString(36).substring(2)}`,
        username: email.split("@")[0],
        email: email,
        role: role,
        permissions: ROLE_DEFINITIONS[role].defaultPermissions,
      };
    }

    const userData: User = {
      username: payload.username,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };

    const tokenData = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    };

    setUser(userData);
    setTokens(tokenData);
    localStorage.setItem("zeeshop_user", JSON.stringify(userData));
    localStorage.setItem("zeeshop_tokens", JSON.stringify(tokenData));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem("zeeshop_user");
    localStorage.removeItem("zeeshop_tokens");
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const switchRoleDemo = (role: Role) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      role,
      permissions: ROLE_DEFINITIONS[role].defaultPermissions,
    };
    setUser(updatedUser);
    localStorage.setItem("zeeshop_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        login,
        logout,
        hasPermission,
        hasRole,
        switchRoleDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
