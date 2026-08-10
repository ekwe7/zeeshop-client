import React, { createContext, useContext, useState, ReactNode } from "react";
import type {
  User,
  Role,
  Permission,
  AuthResponsePayload,
} from "../types/auth-permissions";
import {
  ROLE_DEFINITIONS,
} from "../types/auth-permissions";
import { API_ENDPOINTS } from "../utils/apiConfig";

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
   * Calls POST /api/v1/auth/login on live Render backend
   */
  const login = async (
    email: string,
    pass: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail: email,
          password: pass,
        }),
      });

      const resJson = await response.json().catch(() => ({}));

      if (!response.ok || (resJson.success !== undefined && !resJson.success)) {
        return {
          success: false,
          error:
            resJson.message ||
            resJson.error ||
            `Authentication failed (HTTP ${response.status})`,
        };
      }

      // Backend returns payload wrapped inside `data` property
      const data = resJson.data || resJson;

      const userData: User = {
        username: data.username || email.split("@")[0],
        email: data.email || email,
        role: data.role || "ADMIN",
        permissions:
          data.permissions ||
          ROLE_DEFINITIONS[data.role || "ADMIN"]?.defaultPermissions ||
          [],
      };

      const tokenData = {
        accessToken:
          data.accessToken ||
          data.token ||
          data.jwt ||
          resJson.accessToken ||
          resJson.token ||
          resJson.jwt ||
          "",
        refreshToken:
          data.refreshToken ||
          resJson.refreshToken ||
          "",
      };

      setUser(userData);
      setTokens(tokenData);
      localStorage.setItem("zeeshop_user", JSON.stringify(userData));
      localStorage.setItem("zeeshop_tokens", JSON.stringify(tokenData));
      if (tokenData.accessToken) {
        localStorage.setItem("accessToken", tokenData.accessToken);
      }
      if (tokenData.refreshToken) {
        localStorage.setItem("refreshToken", tokenData.refreshToken);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Backend login request failed:", err);
      const isNetworkErr = err.name === "TypeError" || err.message?.includes("fetch");
      return {
        success: false,
        error: isNetworkErr
          ? "Network connection changed or server unreachable. Please check your internet connection and try again."
          : err.message || "Failed to reach backend server. Please try again.",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem("zeeshop_user");
    localStorage.removeItem("zeeshop_tokens");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
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
