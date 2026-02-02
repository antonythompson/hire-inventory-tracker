import { useState, useEffect } from 'preact/hooks';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { Orders } from './Orders';
import { OrderDetail } from './OrderDetail';
import { ItemCatalog } from './ItemCatalog';
import { useAuth } from '../hooks/useAuth';

type View = 'dashboard' | 'orders' | 'order-detail' | 'catalog';

export function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

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
    setSelectedOrderId(id);
    setView('order-detail');
  };

  const backToOrders = () => {
    setSelectedOrderId(null);
    setView('orders');
  };

  return (
    <div class="min-h-screen flex flex-col">
      {/* Header */}
      <header class="bg-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 class="text-lg font-semibold">Fanfare Inventory</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-slate-300">{user.name}</span>
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
        {view === 'dashboard' && <Dashboard onViewOrders={() => setView('orders')} />}
        {view === 'orders' && <Orders onSelectOrder={openOrder} />}
        {view === 'order-detail' && selectedOrderId && (
          <OrderDetail orderId={selectedOrderId} onBack={backToOrders} />
        )}
        {view === 'catalog' && <ItemCatalog />}
      </main>

      {/* Bottom navigation */}
      <nav class="bg-white border-t border-slate-200 px-4 py-2 sticky bottom-0">
        <div class="flex justify-around max-w-md mx-auto">
          <NavButton
            active={view === 'dashboard'}
            onClick={() => setView('dashboard')}
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            label="Dashboard"
          />
          <NavButton
            active={view === 'orders' || view === 'order-detail'}
            onClick={() => setView('orders')}
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            label="Orders"
          />
          <NavButton
            active={view === 'catalog'}
            onClick={() => setView('catalog')}
            icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            label="Catalog"
          />
        </div>
      </nav>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      class={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
        active ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon} />
      </svg>
      <span class="text-xs font-medium">{label}</span>
    </button>
  );
}
