export type UserRole = 'admin' | 'manager' | 'staff';

// Check if user can view/manage users
export function canManageUsers(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

// Check if user can create a user with the target role
export function canCreateRole(userRole: UserRole, targetRole: UserRole): boolean {
  if (userRole === 'admin') {
    return true; // Admin can create any role
  }
  if (userRole === 'manager') {
    return targetRole === 'staff'; // Manager can only create staff
  }
  return false; // Staff cannot create users
}

// Check if user can edit another user
export function canEditUser(userRole: UserRole, targetRole: UserRole): boolean {
  return userRole === 'admin'; // Only admin can edit users
}

// Check if user can delete users
export function canDeleteUsers(role: UserRole): boolean {
  return role === 'admin';
}

// Check if user can manage catalog (add/edit/delete items)
export function canManageCatalog(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

// Check if user can delete orders
export function canDeleteOrders(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

// Get available roles for creation based on user's role
export function getCreatableRoles(userRole: UserRole): UserRole[] {
  if (userRole === 'admin') {
    return ['admin', 'manager', 'staff'];
  }
  if (userRole === 'manager') {
    return ['staff'];
  }
  return [];
}
