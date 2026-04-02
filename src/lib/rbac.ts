// Babadoc RBAC — Role-Based Access Control
// Roles: admin > editor > member

export type Role = "admin" | "editor" | "member";

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  editor: 2,
  member: 1,
};

export function hasRole(userRole: string, requiredRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole as Role] ?? 0) >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessAdmin(userRole: string): boolean {
  return hasRole(userRole, "admin");
}

/** Can change artifact status (publish, deprecate, archive, restore) */
export function canChangeArtifactStatus(userRole: string): boolean {
  return hasRole(userRole, "editor");
}

/** Can create new artifacts */
export function canCreateArtifact(userRole: string): boolean {
  return hasRole(userRole, "member"); // Todos podem criar
}

/**
 * Can edit an existing facet (resposta)?
 * - Admin/Editor: pode editar qualquer facet
 * - Member: só pode editar a própria facet
 */
export function canEditFacet(
  userRole: string,
  userId: string,
  facetAuthorId: string | null
): boolean {
  if (hasRole(userRole, "editor")) return true;
  if (!facetAuthorId) return true; // Nova resposta (sem autor ainda)
  return userId === facetAuthorId;
}

/**
 * Can delete (soft) a facet?
 * - Admin: pode deletar qualquer facet
 * - Outros: só as próprias
 */
export function canDeleteFacet(
  userRole: string,
  userId: string,
  facetAuthorId: string
): boolean {
  if (hasRole(userRole, "admin")) return true;
  return userId === facetAuthorId;
}

export function canManageUsers(userRole: string): boolean {
  return hasRole(userRole, "admin");
}

export function canManageQuestions(userRole: string): boolean {
  return hasRole(userRole, "admin");
}
