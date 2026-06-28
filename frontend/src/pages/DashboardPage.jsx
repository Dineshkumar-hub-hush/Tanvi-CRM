import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import CustomerForm from '../components/CustomerForm';
import CustomerTable from '../components/CustomerTable';
import PurchaseForm from '../components/PurchaseForm';
import PurchaseTable from '../components/PurchaseTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/ToastProvider';
import { customerApi, getApiErrorMessage } from '../api/client';
import { purchaseApi } from '../api/purchases';
import { formatCurrency } from '../utils/format';

function StatCard({ label, value, detail, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <span className={`rounded-xl px-3 py-2 text-xs font-bold ${tones[tone]}`}>Live</span>
      </div>
    </div>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Revenue Trend</h2>
          <p className="mt-1 text-sm text-slate-500">Dummy monthly analytics for visual planning.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">+12.4%</span>
      </div>
      <div className="mt-6 flex h-44 items-end gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end rounded-full bg-slate-100 px-1.5">
              <div
                className="w-full rounded-full bg-indigo-600 transition-all"
                style={{ height: `${Math.max(12, (item.value / max) * 100)}%` }}
                aria-label={`${item.label} revenue ${item.value}`}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ customers, purchases }) {
  const customerById = useMemo(
    () => new Map(customers.map((customer) => [Number(customer.id), customer.name])),
    [customers],
  );
  const activity = useMemo(() => purchases.slice(0, 5).map((purchase) => ({
    id: purchase.id,
    title: customerById.get(Number(purchase.customer_id)) || `Customer #${purchase.customer_id}`,
    detail: `${purchase.category} purchase marked ${purchase.payment_status}`,
    amount: Number(purchase.amount || 0),
  })), [customerById, purchases]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Recent Activity</h2>
      <div className="mt-4 space-y-3">
        {activity.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No activity yet. Add a purchase to start building a timeline.</p>
        ) : activity.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50">
            <div>
              <p className="text-sm font-bold text-slate-950">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
            <span className="text-sm font-bold text-emerald-700">{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarWidget({ pendingCount }) {
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      day: date.getDate(),
      active: index === 0,
    };
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">This Week</h2>
          <p className="mt-1 text-sm text-slate-500">Follow-ups and payment review focus.</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{pendingCount} pending</span>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2">
        {days.map((item) => (
          <div
            key={`${item.label}-${item.day}`}
            className={`rounded-xl border px-2 py-3 text-center ${
              item.active ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <p className="text-[11px] font-bold uppercase">{item.label}</p>
            <p className="mt-1 text-lg font-bold">{item.day}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Priority workflow</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">Review pending payments, add missing customer notes, and export weekly activity.</p>
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Quick Actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        {[
          { label: 'Add customer', to: '/customers', tone: 'bg-teal-600 text-white hover:bg-teal-700' },
          { label: 'Record purchase', to: '/purchases', tone: 'bg-slate-950 text-white hover:bg-slate-800' },
          { label: 'View reports', to: '/reports', tone: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className={`rounded-xl px-4 py-3 text-center text-sm font-bold shadow-sm transition focus:outline-none focus:ring-4 focus:ring-teal-100 ${action.tone}`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardPage({ activeView = 'dashboard', onLogout, user }) {
  const [customers, setCustomers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const { showToast } = useToast();

  const stats = useMemo(() => {
    const spend = customers.reduce((sum, customer) => sum + Number(customer.total_spend || 0), 0);
    const purchaseRevenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
    return {
      total: customers.length,
      vip: customers.filter((customer) => customer.segment === 'VIP').length,
      spend,
      purchaseRevenue,
      pending: purchases.filter((purchase) => purchase.payment_status === 'Pending').length,
    };
  }, [customers, purchases]);

  const chartData = useMemo(() => [
    { label: 'Jan', value: Math.max(1200, stats.purchaseRevenue * 0.14) },
    { label: 'Feb', value: Math.max(1800, stats.purchaseRevenue * 0.2) },
    { label: 'Mar', value: Math.max(1500, stats.purchaseRevenue * 0.16) },
    { label: 'Apr', value: Math.max(2400, stats.purchaseRevenue * 0.26) },
    { label: 'May', value: Math.max(2100, stats.purchaseRevenue * 0.22) },
    { label: 'Jun', value: Math.max(2900, stats.purchaseRevenue * 0.32) },
  ], [stats.purchaseRevenue]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await customerApi.list({});
      setCustomers(response.data);
      setError('');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to load customers. Check the API server and try again.');
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadPurchases = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const response = await purchaseApi.list();
      setPurchases(response.data);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to load purchases. Check the API server and try again.');
      setError(message);
      showToast(message, 'error');
    } finally {
      setPurchaseLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCustomers();
    loadPurchases();
  }, [loadCustomers, loadPurchases]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await customerApi.update(editingCustomer.id, payload);
        showToast('Customer updated successfully.');
      } else {
        await customerApi.create(payload);
        showToast('Customer added successfully.');
      }
      setEditingCustomer(null);
      await loadCustomers();
      await loadPurchases();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to save customer.');
      setError(message);
      showToast(message, 'error');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchaseSubmit = async (payload) => {
    setPurchaseSubmitting(true);
    try {
      if (editingPurchase) {
        await purchaseApi.update(editingPurchase.id, payload);
        showToast('Purchase updated successfully.');
      } else {
        await purchaseApi.create(payload);
        showToast('Purchase added successfully.');
      }
      setEditingPurchase(null);
      await loadPurchases();
      await loadCustomers();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to save purchase.');
      setError(message);
      showToast(message, 'error');
      throw err;
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      if (pendingDelete.type === 'customer') {
        await customerApi.remove(pendingDelete.id);
        await loadCustomers();
        await loadPurchases();
        showToast('Customer deleted successfully.');
      } else {
        await purchaseApi.remove(pendingDelete.id);
        await loadPurchases();
        showToast('Purchase deleted successfully.');
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to delete item.');
      setError(message);
      showToast(message, 'error');
    } finally {
      setPendingDelete(null);
    }
  };

  const retry = () => {
    setError('');
    loadCustomers();
    loadPurchases();
  };

  const showDashboard = activeView === 'dashboard';
  const showReports = activeView === 'dashboard' || activeView === 'reports';
  const showCustomerWorkspace = activeView === 'dashboard' || activeView === 'customers';
  const showPurchaseWorkspace = activeView === 'dashboard' || activeView === 'purchases';

  return (
    <AppShell onLogout={onLogout} user={user}>
      <div className="mx-auto max-w-7xl space-y-6">
        {showDashboard ? (
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-indigo-200">Commercial CRM</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Run customer growth from one polished workspace.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Monitor customer segments, purchase activity, pending revenue, and quick actions without leaving the dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/customers" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-white/30">Add Customer</Link>
                <Link to="/purchases" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/20">Record Purchase</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-300">Conversion</p>
                <p className="mt-2 text-2xl font-bold">38%</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-300">Retention</p>
                <p className="mt-2 text-2xl font-bold">91%</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-teal-500 p-4">
                <p className="text-xs text-teal-50">Open pipeline</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(stats.purchaseRevenue + 4800)}</p>
              </div>
            </div>
          </div>
        </section>
        ) : null}

        {error ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">{error}</p>
            <button type="button" onClick={retry} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700">
              Retry
            </button>
          </div>
        ) : null}

        {showDashboard ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Customers" value={stats.total} detail="Profiles in your CRM" tone="indigo" />
          <StatCard label="VIP Customers" value={stats.vip} detail="High value relationships" tone="emerald" />
          <StatCard label="Customer Spend" value={formatCurrency(stats.spend)} detail="Stored customer value" tone="amber" />
          <StatCard label="Pending Payments" value={stats.pending} detail="Transactions to follow up" tone="rose" />
        </section>
        ) : null}

        {showReports ? (
        <section id="reports" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <MiniBarChart data={chartData} />
          <RecentActivity customers={customers} purchases={purchases} />
        </section>
        ) : null}

        {showDashboard ? (
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <QuickActions />
          <CalendarWidget pendingCount={stats.pending} />
        </section>
        ) : null}

        {(showCustomerWorkspace || showPurchaseWorkspace) ? (
        <section className="grid gap-6 xl:grid-cols-2">
          {showCustomerWorkspace ? (
          <div id="customer-form">
            <CustomerForm
              initialData={editingCustomer}
              onSubmit={handleSubmit}
              onCancel={() => setEditingCustomer(null)}
              isEditing={Boolean(editingCustomer)}
              submitting={submitting}
            />
          </div>
          ) : null}

          {showPurchaseWorkspace ? (
          <div id="purchase-form">
            <PurchaseForm
              customers={customers}
              initialData={editingPurchase}
              onSubmit={handlePurchaseSubmit}
              onCancel={() => setEditingPurchase(null)}
              isEditing={Boolean(editingPurchase)}
              submitting={purchaseSubmitting}
            />
          </div>
          ) : null}
        </section>
        ) : null}

        {showCustomerWorkspace ? (
        <section id="customers">
          <CustomerTable
            customers={customers}
            loading={loading}
            onEdit={(customer) => {
              setEditingCustomer(customer);
              document.getElementById('customer-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onDelete={(customerId) => setPendingDelete({ type: 'customer', id: customerId })}
          />
        </section>
        ) : null}

        {showPurchaseWorkspace ? (
        <section id="purchases">
          <PurchaseTable
            customers={customers}
            purchases={purchases}
            loading={purchaseLoading}
            onEdit={(purchase) => {
              setEditingPurchase(purchase);
              document.getElementById('purchase-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onDelete={(purchaseId) => setPendingDelete({ type: 'purchase', id: purchaseId })}
          />
        </section>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.type || 'item'}?`}
        description="This action cannot be undone. Please confirm before removing this record from the CRM."
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

export default DashboardPage;
