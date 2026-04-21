import type { UserRole } from "@/lib/auth";

const roles = {
  reviewer: "reviewer",
  jury: "jury",
  sultan: "sultan",
  sysadmin: "sysadmin",
  admin: "admin",
  audit: "audit",
} as const;

export function hasAnyRole(userRole: UserRole | undefined, allowed: UserRole[]): boolean {
  if (!userRole) return false;
  return allowed.includes(userRole);
}

export function canAccessUsers(userRole: UserRole | undefined): boolean {
  return hasAnyRole(userRole, [roles.sysadmin, roles.admin]);
}

export function canAccessJuryPanel(userRole: UserRole | undefined): boolean {
  return hasAnyRole(userRole, [roles.reviewer, roles.sysadmin, roles.admin]);
}

export function canAccessReports(userRole: UserRole | undefined): boolean {
  return hasAnyRole(userRole, [roles.reviewer, roles.sultan, roles.sysadmin, roles.admin, roles.audit]);
}

export function canAccessSubmissionDetail(userRole: UserRole | undefined): boolean {
  return hasAnyRole(userRole, [roles.reviewer, roles.sultan, roles.sysadmin, roles.admin, roles.audit]);
}

export function canAccessEvaluations(userRole: UserRole | undefined): boolean {
  return hasAnyRole(userRole, [roles.reviewer, roles.jury, roles.sultan, roles.sysadmin, roles.admin, roles.audit]);
}
