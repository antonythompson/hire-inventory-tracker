import { route } from 'preact-router';
import Router from 'preact-router';
import { Link } from 'preact-router/match';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { Orders } from './Orders';
import { OrderDetail } from './OrderDetail';
import { ItemCatalog } from './ItemCatalog';
import { UserManagement } from './UserManagement';
import { useAuth } from '../hooks/useAuth';
import { canManageUsers, canManageCatalog, canDeleteOrders } from '../lib/permissions';

export function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const openOrder = (id: number) => {
    route(`/orders/${id}`);
  };

  return (
    <div class="min-h-screen flex flex-col">
      {/* Header */}
      <header class="bg-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 class="text-lg font-semibold">Fanfare Inventory</h1>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-300">{user.name}</span>
            <span class={`text-xs px-2 py-0.5 rounded-full ${
              user.role === 'admin' ? 'bg-purple-600 text-purple-100' :
              user.role === 'manager' ? 'bg-blue-600 text-blue-100' :
              'bg-slate-600 text-slate-100'
            }`}>
              {user.role}
            </span>
          </div>
          <button
            onClick={logout}
            class="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main class="flex-1 p-4 max-w-4xl mx-auto w-full">
        <Router>
          <Dashboard path="/" onViewOrders={() => route('/orders')} />
          <Orders path="/orders" onSelectOrder={openOrder} canDelete={canDeleteOrders(user.role)} />
          <OrderDetailRoute path="/orders/:id" canDelete={canDeleteOrders(user.role)} />
          <ItemCatalog path="/catalog" canManage={canManageCatalog(user.role)} />
          {canManageUsers(user.role) && <UserManagement path="/users" currentUser={user} />}
        </Router>
      </main>

      {/* Bottom navigation */}
      <nav class="bg-white border-t border-slate-200 px-4 py-2 sticky bottom-0">
        <div class="flex justify-around max-w-md mx-auto">
          <NavLink
            href="/"
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            label="Dashboard"
          />
          <NavLink
            href="/orders"
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            label="Orders"
          />
          <NavLink
            href="/catalog"
            icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            label="Catalog"
          />
          {canManageUsers(user.role) && (
            <NavLink
              href="/users"
              icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              label="Users"
            />
          )}
        </div>
      </nav>
    </div>
  );
}

// Wrapper component to extract route params for OrderDetail
function OrderDetailRoute({ id, canDelete }: { id?: string; canDelete: boolean; path?: string }) {
  const orderId = parseInt(id || '0');

  if (!orderId) {
    route('/orders');
    return null;
  }

  return <OrderDetail orderId={orderId} onBack={() => route('/orders')} canDelete={canDelete} />;
}

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
}

function NavLink({ href, icon, label }: NavLinkProps) {
  return (
    <Link
      href={href}
      activeClassName="text-slate-800"
      class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon} />
      </svg>
      <span class="text-xs font-medium">{label}</span>
    </Link>
  );
}
