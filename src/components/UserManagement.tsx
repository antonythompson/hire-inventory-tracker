import { useState, useEffect } from 'preact/hooks';
import { api, type User, type UserRole } from '../api/client';
import { canCreateRole, canDeleteUsers, canEditUser, getCreatableRoles } from '../lib/permissions';

interface Props {
  currentUser: User;
}

export function UserManagement({ currentUser }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await api.deleteUser(user.id);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  if (loading) {
    return (
      <div class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const creatableRoles = getCreatableRoles(currentUser.role);

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-800">Users</h2>
        {creatableRoles.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            class="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            + Add User
          </button>
        )}
      </div>

      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Name</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-slate-600 hidden sm:table-cell">Email/Username</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Role</th>
              <th class="text-center px-4 py-3 text-sm font-medium text-slate-600">Active</th>
              <th class="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} class={!user.isActive ? 'opacity-50' : ''}>
                <td class="px-4 py-3">
                  <div class="font-medium text-slate-800">{user.name}</div>
                  <div class="text-xs text-slate-500 sm:hidden">
                    {user.username || user.email}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                  <div>{user.email}</div>
                  {user.username && (
                    <div class="text-xs text-slate-400">@{user.username}</div>
                  )}
                </td>
                <td class="px-4 py-3">
                  <span class={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  {user.isActive ? (
                    <span class="text-green-600">Yes</span>
                  ) : (
                    <span class="text-red-600">No</span>
                  )}
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    {canEditUser(currentUser.role, user.role as UserRole) && (
                      <button
                        onClick={() => openEditModal(user)}
                        class="text-slate-500 hover:text-slate-700 text-sm"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => openPasswordModal(user)}
                      class="text-slate-500 hover:text-slate-700 text-sm"
                    >
                      Password
                    </button>
                    {canDeleteUsers(currentUser.role) && user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDelete(user)}
                        class="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddUserModal
          currentUserRole={currentUser.role}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadUsers();
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}

      {showPasswordModal && selectedUser && (
        <PasswordModal
          user={selectedUser}
          isAdmin={currentUser.role === 'admin'}
          isSelf={currentUser.id === selectedUser.id}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

interface AddUserModalProps {
  currentUserRole: UserRole;
  onClose: () => void;
  onSuccess: () => void;
}

function AddUserModal({ currentUserRole, onClose, onSuccess }: AddUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatableRoles = getCreatableRoles(currentUserRole);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createUser({
        name,
        email,
        username: username || undefined,
        password,
        role,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-800">Add User</h3>
          <button onClick={onClose} class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4">
          {error && (
            <div class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Username (optional)</label>
            <input
              type="text"
              value={username}
              onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              placeholder="For quick login"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              minLength={6}
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole((e.target as HTMLSelectElement).value as UserRole)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
            >
              {creatableRoles.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              class="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username || '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.updateUser(user.id, {
        name,
        email,
        username: username || undefined,
        role,
        isActive,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-800">Edit User</h3>
          <button onClick={onClose} class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4">
          {error && (
            <div class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              placeholder="For quick login"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole((e.target as HTMLSelectElement).value as UserRole)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive((e.target as HTMLInputElement).checked)}
              class="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
            />
            <label for="isActive" class="text-sm text-slate-700">Active</label>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              class="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PasswordModalProps {
  user: User;
  isAdmin: boolean;
  isSelf: boolean;
  onClose: () => void;
}

function PasswordModal({ user, isAdmin, isSelf, onClose }: PasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Admin doesn't need current password (except for self)
  const needsCurrentPassword = isSelf && !isAdmin;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSelf) {
        await api.changePassword(currentPassword, newPassword);
      } else {
        await api.changeUserPassword(user.id, newPassword);
      }
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-800">
            {isSelf ? 'Change Password' : `Change Password for ${user.name}`}
          </h3>
          <button onClick={onClose} class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-6 space-y-4">
          {error && (
            <div class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div class="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
              Password changed successfully!
            </div>
          )}

          {needsCurrentPassword && (
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onInput={(e) => setCurrentPassword((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
                required
              />
            </div>
          )}

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              minLength={6}
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              minLength={6}
              required
            />
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              class="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
