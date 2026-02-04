import { useState, useEffect } from 'preact/hooks';
import { api } from '../api/client';

interface Order {
  id: number;
  customerName: string;
  status: string;
  eventDate: string | null;
  expectedReturnDate: string | null;
  itemCount: number;
}

interface OrdersProps {
  onSelectOrder: (id: number) => void;
  canDelete?: boolean;
}

export function Orders({ onSelectOrder, canDelete = true }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active');
  const [showNewOrder, setShowNewOrder] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    const status = filter === 'all' ? undefined : filter;
    api.getOrders(status)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-600',
      confirmed: 'bg-blue-100 text-blue-700',
      out: 'bg-orange-100 text-orange-700',
      partial_return: 'bg-yellow-100 text-yellow-700',
      returned: 'bg-green-100 text-green-700',
      completed: 'bg-slate-100 text-slate-500',
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-800">Orders</h2>
        <button
          onClick={() => setShowNewOrder(true)}
          class="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          + New Order
        </button>
      </div>

      {/* Filter tabs */}
      <div class="flex gap-2 overflow-x-auto pb-2">
        {['active', 'out', 'returned', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            class={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
        </div>
      ) : orders.length === 0 ? (
        <div class="text-center py-12 text-slate-400">
          No orders found
        </div>
      ) : (
        <div class="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              class="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-left hover:border-slate-300 transition-colors"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <h3 class="font-medium text-slate-800 truncate">
                    {order.customerName}
                  </h3>
                  <p class="text-sm text-slate-500 mt-1">
                    {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                    {order.eventDate && ` • ${formatDate(order.eventDate)}`}
                  </p>
                </div>
                <span class={`px-2 py-1 rounded text-xs font-medium ${statusBadge(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              {order.expectedReturnDate && order.status === 'out' && (
                <p class={`text-xs mt-2 ${
                  isOverdue(order.expectedReturnDate) ? 'text-red-600' : 'text-slate-400'
                }`}>
                  Return by {formatDate(order.expectedReturnDate)}
                  {isOverdue(order.expectedReturnDate) && ' (OVERDUE)'}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onCreated={(id) => {
            setShowNewOrder(false);
            onSelectOrder(id);
          }}
        />
      )}
    </div>
  );
}

interface NewOrderModalProps {
  onClose: () => void;
  onCreated: (id: number) => void;
}

function NewOrderModal({ onClose, onCreated }: NewOrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { id } = await api.createOrder({
        customerName,
        customerPhone: customerPhone || undefined,
        eventDate: eventDate || undefined,
        expectedReturnDate: expectedReturnDate || undefined,
        items: [],
      });
      onCreated(id);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div class="sticky top-0 bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">New Order</h3>
          <button onClick={onClose} class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={customerName}
              onInput={(e) => setCustomerName((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={customerPhone}
              onInput={(e) => setCustomerPhone((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Event Date
            </label>
            <input
              type="date"
              value={eventDate}
              onInput={(e) => setEventDate((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Expected Return Date
            </label>
            <input
              type="date"
              value={expectedReturnDate}
              onInput={(e) => setExpectedReturnDate((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !customerName}
            class="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </form>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
  });
}

function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
