export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';

export type Permission = 
  | 'ANALYTICS_READ'
  | 'USERS_MANAGE'
  | 'USER_READ'
  | 'USER_WRITE'
  | 'ROLES_MANAGE'
  | 'INVENTORY_READ'
  | 'INVENTORY_WRITE'
  | 'SALES_CREATE'
  | 'SALES_READ'
  | 'SALES_WRITE'
  | 'REFUNDS_CREATE'
  | 'SETTINGS_MANAGE'
  | string;

export interface AuthResponsePayload {
  accessToken: string;
  refreshToken: string;
  username: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

export interface User {
  username: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

export interface RolePermissions {
  role: Role;
  title: string;
  description: string;
  defaultPermissions: Permission[];
}

export const ROLE_DEFINITIONS: Record<Role, RolePermissions> = {
  ADMIN: {
    role: 'ADMIN',
    title: 'Super Administrator',
    description: 'Full access to system control, user management, and global store settings.',
    defaultPermissions: [
      'ANALYTICS_READ',
      'USERS_MANAGE',
      'ROLES_MANAGE',
      'INVENTORY_READ',
      'INVENTORY_WRITE',
      'SALES_CREATE',
      'SALES_READ',
      'REFUNDS_CREATE',
      'SETTINGS_MANAGE'
    ]
  },
  MANAGER: {
    role: 'MANAGER',
    title: 'Store Manager',
    description: 'Access to inventory management, sales reports, and customer refunds.',
    defaultPermissions: [
      'ANALYTICS_READ',
      'INVENTORY_READ',
      'INVENTORY_WRITE',
      'SALES_CREATE',
      'SALES_READ',
      'REFUNDS_CREATE'
    ]
  },
  CASHIER: {
    role: 'CASHIER',
    title: 'Cashier / Staff',
    description: 'Access to standard Checkout Terminal and viewing product catalog.',
    defaultPermissions: [
      'SALES_CREATE',
      'INVENTORY_READ',
      'SALES_READ'
    ]
  }
};

export const MOCK_USERS_DB: Record<string, AuthResponsePayload & { pass: string }> = {
  'admin@zeeshop.com': {
    accessToken: 'mock_jwt_access_token_admin_xyz123',
    refreshToken: 'mock_jwt_refresh_token_admin_abc789',
    username: 'ekwe_admin',
    email: 'admin@zeeshop.com',
    pass: 'admin@123',
    role: 'ADMIN',
    permissions: ROLE_DEFINITIONS.ADMIN.defaultPermissions
  },
  'manager@zeeshop.com': {
    accessToken: 'mock_jwt_access_token_manager_xyz123',
    refreshToken: 'mock_jwt_refresh_token_manager_abc789',
    username: 'alex_manager',
    email: 'ozed@zeeshop.com',
    pass: 'password123',
    role: 'MANAGER',
    permissions: ROLE_DEFINITIONS.MANAGER.defaultPermissions
  },
  'operator@zeeshop.com': {
    accessToken: 'mock_jwt_access_token_cashier_xyz123',
    refreshToken: 'mock_jwt_refresh_token_cashier_abc789',
    username: 'operator_john',
    email: 'nelson@zeeshop.com',
    pass: 'password123',
    role: 'CASHIER',
    permissions: ROLE_DEFINITIONS.CASHIER.defaultPermissions
  }
};
