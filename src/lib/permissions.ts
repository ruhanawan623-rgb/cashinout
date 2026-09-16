import { UserRole } from "@/types";

export interface PermissionCheckResult {
  allowed: boolean;
  message?: string;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  ACCOUNTANT: 2,
  CASHIER: 1,
};

/**
 * Checks whether a given role can perform specific actions
 */
export const permissions = {
  canManageUsers: (role: UserRole) => role === "ADMIN",
  
  canManageCategories: (role: UserRole) => role === "ADMIN" || role === "ACCOUNTANT",
  
  canVoidTransactions: (role: UserRole) => role === "ADMIN" || role === "ACCOUNTANT",
  
  canViewReports: (role: UserRole) => role === "ADMIN" || role === "ACCOUNTANT",
  
  canOperateRegister: (role: UserRole) => role === "ADMIN" || role === "CASHIER",
  
  canViewAllSessions: (role: UserRole) => role === "ADMIN" || role === "ACCOUNTANT",
};

export function requireRole(userRole: UserRole, allowedRoles: UserRole[]): PermissionCheckResult {
  if (allowedRoles.includes(userRole)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    message: `Access denied. Required role: ${allowedRoles.join(" or ")}, your role: ${userRole}`,
  };
}
