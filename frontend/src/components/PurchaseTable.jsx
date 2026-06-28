import { useEffect, useMemo, useState } from 'react';
import EmptyState from './ui/EmptyState';
import LoadingSkeleton from './ui/LoadingSkeleton';
import { formatCurrency } from '../utils/format';

const PAGE_SIZE = 6;

function exportCsv(rows, customerNameById) {
  const headers = ['Customer', 'Category', 'Amount', 'Status', 'Date'];
  const csvRows = rows.map((purchase) => [
    customerNameById.get(Number(purchase.customer_id)) || purchase.customer_id,
    purchase.category,
    purchase.amount,
    purchase.payment_status,
    purchase.purchase_date,
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'purchases.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function PurchaseTable({ purchases, customers = [], onEdit, onDelete, loading = false }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'amount', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const customerNameById = useMemo(
    () => new Map(customers.map((customer) => [Number(customer.id), customer.name])),
    [customers],
  );

  const filteredPurchases = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return purchases
      .filter((purchase) => {
        const customerName = customerNameById.get(Number(purchase.customer_id)) || '';
        const matchesQuery = [customerName, purchase.category, purchase.payment_status]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesStatus = status ? purchase.payment_status === status : true;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[sort.key] ?? '';
        const bValue = b[sort.key] ?? '';
        if (sort.key === 'amount') {
          return sort.direction === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
        }
        return sort.direction === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
  }, [purchases, customerNameById, query, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredPurchases.length / PAGE_SIZE));
  const visiblePurchases = filteredPurchases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  useEffect(() => {
    const validIds = new Set(filteredPurchases.map((purchase) => purchase.id));
    setSelectedIds((current) => current.filter((id) => validIds.has(id)));
  }, [filteredPurchases]);

  const updateSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortLabel = (key) => (sort.key === key ? (sort.direction === 'asc' ? ' up' : ' down') : '');
  const visibleIds = visiblePurchases.map((purchase) => purchase.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const toggleAllVisible = () => {
    setSelectedIds((current) => (
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    ));
  };
  const toggleSelected = (id) => {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    ));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Purchase History</h2>
          <p className="mt-1 text-sm text-slate-500">Review transactions, payment status, and revenue activity.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            aria-label="Search purchases"
            placeholder="Search purchases"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter purchases by status"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">All statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
          </select>
          <button
            type="button"
            onClick={() => exportCsv(filteredPurchases, customerNameById)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : visiblePurchases.length === 0 ? (
          <EmptyState title="No purchases found" description="Record a new purchase or adjust the filters to find an existing transaction." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {selectedIds.length > 0 ? (
              <div className="flex flex-col gap-2 border-b border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold">{selectedIds.length} selected</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-100"
                >
                  Clear Selection
                </button>
              </div>
            ) : null}
          <div className="max-h-[460px] overflow-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select visible purchases"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updateSort('customer_id')} className="font-bold text-slate-600">Customer{sortLabel('customer_id')}</button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updateSort('category')} className="font-bold text-slate-600">Category{sortLabel('category')}</button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updateSort('amount')} className="font-bold text-slate-600">Amount{sortLabel('amount')}</button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updateSort('payment_status')} className="font-bold text-slate-600">Status{sortLabel('payment_status')}</button>
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {visiblePurchases.map((purchase) => (
                  <tr key={purchase.id} className="transition hover:bg-indigo-50/40">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        aria-label={`Select purchase ${purchase.id}`}
                        checked={selectedIds.includes(purchase.id)}
                        onChange={() => toggleSelected(purchase.id)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-950">
                      {customerNameById.get(Number(purchase.customer_id)) || `Customer #${purchase.customer_id}`}
                    </td>
                    <td className="px-4 py-4">{purchase.category}</td>
                    <td className="px-4 py-4 font-semibold text-slate-950">{formatCurrency(purchase.amount)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        purchase.payment_status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : purchase.payment_status === 'Pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                      }`}
                      >
                        {purchase.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => onEdit(purchase)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200">
                          Edit
                        </button>
                        <button onClick={() => onDelete(purchase.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{filteredPurchases.length} purchases found</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {pageCount}</span>
            <button
              type="button"
              disabled={page === pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseTable;
