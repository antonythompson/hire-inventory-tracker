import { useState, useEffect } from 'preact/hooks';
import { api } from '../api/client';

interface OrderDetailData {
  id: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  eventDate: string | null;
  outDate: string | null;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: string;
  notes: string | null;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    quantityCheckedOut: number;
    quantityCheckedIn: number;
    notes: string | null;
  }>;
}

interface OrderDetailProps {
  orderId: number;
  onBack: () => void;
  canDelete?: boolean;
}

export function OrderDetail({ orderId, onBack, canDelete = true }: OrderDetailProps) {
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  const loadOrder = () => {
    setLoading(true);
    api.getOrder(orderId)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div class="text-center py-12">
        <p class="text-slate-500">Order not found</p>
        <button onClick={onBack} class="mt-4 text-slate-600 underline">
          Back to orders
        </button>
      </div>
    );
  }

  const canCheckout = order.status === 'confirmed' || order.status === 'draft';
  const canCheckin = order.status === 'out' || order.status === 'partial_return';

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center gap-4">
        <button
          onClick={onBack}
          class="p-2 -ml-2 text-slate-400 hover:text-slate-600"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-slate-800">{order.customerName}</h2>
          <p class="text-sm text-slate-500">Order #{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Customer info */}
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
        <h3 class="font-medium text-slate-800 mb-3">Customer Details</h3>
        {order.customerPhone && (
          <p class="text-sm">
            <span class="text-slate-500">Phone:</span>{' '}
            <a href={`tel:${order.customerPhone}`} class="text-blue-600">{order.customerPhone}</a>
          </p>
        )}
        {order.customerEmail && (
          <p class="text-sm">
            <span class="text-slate-500">Email:</span>{' '}
            <a href={`mailto:${order.customerEmail}`} class="text-blue-600">{order.customerEmail}</a>
          </p>
        )}
        {order.deliveryAddress && (
          <p class="text-sm">
            <span class="text-slate-500">Address:</span> {order.deliveryAddress}
          </p>
        )}
        {order.eventDate && (
          <p class="text-sm">
            <span class="text-slate-500">Event:</span> {formatDate(order.eventDate)}
          </p>
        )}
        {order.expectedReturnDate && (
          <p class="text-sm">
            <span class="text-slate-500">Return by:</span> {formatDate(order.expectedReturnDate)}
          </p>
        )}
      </div>

      {/* Items */}
      <div class="bg-white rounded-xl shadow-sm border border-slate-200">
        <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 class="font-medium text-slate-800">Items ({order.items.length})</h3>
          <button
            onClick={() => setShowAddItem(true)}
            class="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Item
          </button>
        </div>
        <div class="divide-y divide-slate-100">
          {order.items.length === 0 ? (
            <div class="px-4 py-8 text-center text-slate-400">
              No items added yet
            </div>
          ) : (
            order.items.map((item) => (
              <div key={item.id} class="px-4 py-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-slate-800">{item.name}</p>
                    <p class="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <div class="text-right text-sm">
                    <p class="text-orange-600">
                      Out: {item.quantityCheckedOut}/{item.quantity}
                    </p>
                    <p class="text-green-600">
                      In: {item.quantityCheckedIn}/{item.quantity}
                    </p>
                  </div>
                </div>
                {item.notes && (
                  <p class="text-xs text-slate-400 mt-1">{item.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div class="bg-yellow-50 rounded-xl p-4">
          <h3 class="font-medium text-yellow-800 mb-1">Notes</h3>
          <p class="text-sm text-yellow-700">{order.notes}</p>
        </div>
      )}

      {/* Action buttons */}
      <div class="flex gap-3">
        {canCheckout && (
          <button
            onClick={() => setShowCheckout(true)}
            class="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Check Out
          </button>
        )}
        {canCheckin && (
          <button
            onClick={() => setShowCheckin(true)}
            class="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Check In
          </button>
        )}
      </div>

      {/* Check Out Modal */}
      {showCheckout && (
        <CheckModal
          type="checkout"
          items={order.items}
          onClose={() => setShowCheckout(false)}
          onSubmit={async (items) => {
            await api.checkoutOrder(orderId, items);
            setShowCheckout(false);
            loadOrder();
          }}
        />
      )}

      {/* Check In Modal */}
      {showCheckin && (
        <CheckModal
          type="checkin"
          items={order.items}
          onClose={() => setShowCheckin(false)}
          onSubmit={async (items) => {
            await api.checkinOrder(orderId, items);
            setShowCheckin(false);
            loadOrder();
          }}
        />
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemModal
          orderId={orderId}
          onClose={() => setShowAddItem(false)}
          onAdded={() => {
            setShowAddItem(false);
            loadOrder();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    confirmed: 'bg-blue-100 text-blue-700',
    out: 'bg-orange-100 text-orange-700',
    partial_return: 'bg-yellow-100 text-yellow-700',
    returned: 'bg-green-100 text-green-700',
    completed: 'bg-slate-100 text-slate-500',
  };
  return (
    <span class={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-slate-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

interface CheckModalProps {
  type: 'checkout' | 'checkin';
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    quantityCheckedOut: number;
    quantityCheckedIn: number;
  }>;
  onClose: () => void;
  onSubmit: (items: Array<{ itemId: number; quantity: number }>) => Promise<void>;
}

function CheckModal({ type, items, onClose, onSubmit }: CheckModalProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    items.forEach((item) => {
      if (type === 'checkout') {
        initial[item.id] = item.quantity - item.quantityCheckedOut;
      } else {
        initial[item.id] = item.quantityCheckedOut - item.quantityCheckedIn;
      }
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);

  const handleCheckAll = () => {
    const newQuantities: Record<number, number> = {};
    items.forEach((item) => {
      if (type === 'checkout') {
        newQuantities[item.id] = item.quantity - item.quantityCheckedOut;
      } else {
        newQuantities[item.id] = item.quantityCheckedOut - item.quantityCheckedIn;
      }
    });
    setQuantities(newQuantities);
  };

  const handleClearAll = () => {
    const newQuantities: Record<number, number> = {};
    items.forEach((item) => {
      newQuantities[item.id] = 0;
    });
    setQuantities(newQuantities);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const itemsToSubmit = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([id, quantity]) => ({ itemId: parseInt(id), quantity }));
      await onSubmit(itemsToSubmit);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const totalSelected = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <div class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div class="sticky top-0 bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">
            {type === 'checkout' ? 'Check Out Items' : 'Check In Items'}
          </h3>
          <button onClick={onClose} class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-4">
          {/* Bulk actions */}
          <div class="flex gap-2 mb-4">
            <button
              onClick={handleCheckAll}
              class="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Check All
            </button>
            <button
              onClick={handleClearAll}
              class="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Items list */}
          <div class="space-y-3 mb-4">
            {items.map((item) => {
              const maxQty = type === 'checkout'
                ? item.quantity - item.quantityCheckedOut
                : item.quantityCheckedOut - item.quantityCheckedIn;

              if (maxQty <= 0) return null;

              return (
                <div key={item.id} class="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div class="flex-1">
                    <p class="font-medium text-slate-800">{item.name}</p>
                    <p class="text-xs text-slate-500">Max: {maxQty}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      onClick={() => setQuantities((q) => ({
                        ...q,
                        [item.id]: Math.max(0, (q[item.id] || 0) - 1)
                      }))}
                      class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
                    >
                      -
                    </button>
                    <span class="w-8 text-center font-medium">
                      {quantities[item.id] || 0}
                    </span>
                    <button
                      onClick={() => setQuantities((q) => ({
                        ...q,
                        [item.id]: Math.min(maxQty, (q[item.id] || 0) + 1)
                      }))}
                      class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || totalSelected === 0}
            class={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              type === 'checkout'
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {loading
              ? 'Processing...'
              : `${type === 'checkout' ? 'Check Out' : 'Check In'} ${totalSelected} Items`}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

interface AddItemModalProps {
  orderId: number;
  onClose: () => void;
  onAdded: () => void;
}

function AddItemModal({ orderId, onClose, onAdded }: AddItemModalProps) {
  const [catalogItems, setCatalogItems] = useState<Array<{ id: number; name: string; category: string | null }>>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog');

  useEffect(() => {
    api.getCatalogItems().then((items) => {
      setCatalogItems(items.filter((i) => i.isActive));
    });
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'catalog') {
        // Add all items with qty > 0
        const itemsToAdd = Object.entries(quantities)
          .filter(([, qty]) => qty > 0)
          .map(([id, qty]) => ({ catalogItemId: parseInt(id), quantity: qty }));

        for (const item of itemsToAdd) {
          await api.addItemToOrder(orderId, item);
        }
      } else {
        // Add custom item
        await api.addItemToOrder(orderId, {
          customItemName: customName,
          quantity: customQty,
        });
      }
      onAdded();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  const canSubmit = mode === 'catalog' ? totalItems > 0 : customName.trim() !== '';

  // Group items by category
  const categories = [...new Set(catalogItems.map((i) => i.category || 'Other'))];

  return (
    <div class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div class="sticky top-0 bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between z-10">
          <h3 class="font-semibold text-slate-800">Add Items</h3>
          <button onClick={onClose} class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-4 space-y-4">
          {/* Mode toggle */}
          <div class="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('catalog')}
              class={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'catalog'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              From Catalog
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              class={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'custom'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Custom Item
            </button>
          </div>

          {mode === 'catalog' ? (
            <div class="space-y-4">
              {categories.map((category) => (
                <div key={category}>
                  <h4 class="text-sm font-medium text-slate-500 mb-2">{category}</h4>
                  <div class="space-y-2">
                    {catalogItems
                      .filter((item) => (item.category || 'Other') === category)
                      .map((item) => (
                        <div
                          key={item.id}
                          class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <span class="font-medium text-slate-800 flex-1">{item.name}</span>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQuantities((q) => ({
                                ...q,
                                [item.id]: Math.max(0, (q[item.id] || 0) - 1)
                              }))}
                              class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 text-lg font-medium"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={quantities[item.id] || 0}
                              onInput={(e) => {
                                const val = parseInt((e.target as HTMLInputElement).value) || 0;
                                setQuantities((q) => ({ ...q, [item.id]: Math.max(0, val) }));
                              }}
                              class="w-12 text-center font-medium text-slate-800 border border-slate-200 rounded py-1"
                            />
                            <button
                              type="button"
                              onClick={() => setQuantities((q) => ({
                                ...q,
                                [item.id]: (q[item.id] || 0) + 1
                              }))}
                              class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 text-lg font-medium"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onInput={(e) => setCustomName((e.target as HTMLInputElement).value)}
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
                  placeholder="Enter custom item name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Quantity
                </label>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    class="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={customQty}
                    onInput={(e) => setCustomQty(parseInt((e.target as HTMLInputElement).value) || 1)}
                    min="1"
                    class="w-20 text-center px-2 py-2 border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => q + 1)}
                    class="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            class="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : mode === 'catalog' ? `Add ${totalItems} Item${totalItems !== 1 ? 's' : ''} to Order` : 'Add to Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
