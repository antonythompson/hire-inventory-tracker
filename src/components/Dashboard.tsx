import { useState, useEffect } from 'preact/hooks';
import { api } from '../api/client';

interface DashboardData {
  itemsOut: number;
  overdueOrders: number;
  activeOrders: number;
  recentActivity: Array<{
    id: number;
    type: 'checkout' | 'checkin';
    orderName: string;
    itemCount: number;
    timestamp: string;
  }>;
}

interface DashboardProps {
  onViewOrders: () => void;
}

export function Dashboard({ onViewOrders }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div class="text-center py-12 text-slate-500">
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <h2 class="text-xl font-semibold text-slate-800">Dashboard</h2>

      {/* Stats cards */}
      <div class="grid grid-cols-3 gap-4">
        <StatCard
          label="Items Out"
          value={data.itemsOut}
          color="blue"
        />
        <StatCard
          label="Overdue"
          value={data.overdueOrders}
          color={data.overdueOrders > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Active Orders"
          value={data.activeOrders}
          color="slate"
          onClick={onViewOrders}
        />
      </div>

      {/* Recent activity */}
      <div class="bg-white rounded-xl shadow-sm border border-slate-200">
        <div class="px-4 py-3 border-b border-slate-200">
          <h3 class="font-medium text-slate-800">Recent Activity</h3>
        </div>
        <div class="divide-y divide-slate-100">
          {data.recentActivity.length === 0 ? (
            <div class="px-4 py-8 text-center text-slate-400">
              No recent activity
            </div>
          ) : (
            data.recentActivity.map((activity) => (
              <div key={activity.id} class="px-4 py-3 flex items-center gap-3">
                <div class={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'checkout' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  <svg
                    class={`w-4 h-4 ${
                      activity.type === 'checkout' ? 'text-orange-600' : 'text-green-600'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d={activity.type === 'checkout'
                        ? 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                        : 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'}
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-800 truncate">
                    {activity.orderName}
                  </p>
                  <p class="text-xs text-slate-500">
                    {activity.itemCount} item{activity.itemCount !== 1 ? 's' : ''}{' '}
                    {activity.type === 'checkout' ? 'picked up' : 'returned'}
                  </p>
                </div>
                <div class="text-xs text-slate-400">
                  {formatRelativeTime(activity.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'blue' | 'red' | 'green' | 'slate';
  onClick?: () => void;
}

function StatCard({ label, value, color, onClick }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
    slate: 'bg-slate-50 text-slate-700',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      class={`rounded-xl p-4 text-center ${colorClasses[color]} ${
        onClick ? 'hover:opacity-80 transition-opacity cursor-pointer' : ''
      }`}
    >
      <div class="text-2xl font-bold">{value}</div>
      <div class="text-xs font-medium opacity-80">{label}</div>
    </Component>
  );
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
