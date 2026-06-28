import { useEffect, useMemo, useState } from 'react';
import EmptyState from './ui/EmptyState';
import LoadingSkeleton from './ui/LoadingSkeleton';
import { formatCurrency } from '../utils/format';

const PAGE_SIZE = 6;

function exportCsv(rows) {
  const headers = ['Name', 'Email', 'Phone', 'Category', 'Segment', 'Spend'];
  const csvRows = rows.map((customer) => [
    customer.name,
    customer.email,
    customer.phone,
    customer.category,
    customer.segment,
    customer.total_spend,
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'customers.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function CustomerTable({ customers, onEdit, onDelete, loading = false }) {
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('');
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return customers
      .filter((customer) => {
        const matchesQuery = [customer.name, customer.email, customer.phone, customer.category]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesSegment = segment ? customer.segment === segment : true;
        return matchesQuery && matchesSegment;
      })
      .sort((a, b) => {
        const aValue = a[sort.key] ?? '';
        const bValue = b[sort.key] ?? '';
        if (sort.key === 'total_spend') {
          return sort.direction === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
        }
        return sort.direction === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
  }, [customers, query, segment, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const visibleCustomers = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  useEffect(() => {
    const validIds = new Set(filteredCustomers.map((customer) => customer.id));
    setSelectedIds((current) => current.filter((id) => validIds.has(id)));
  }, [filteredCustomers]);

  const updateSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortLabel = (key) => (sort.key === key ? (sort.direction === 'asc' ? ' up' : ' down') : '');
  const visibleIds = visibleCustomers.map((customer) => customer.id);
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
          <h2 className="text-lg font-bold text-slate-950">Customer List</h2>
          <p className="mt-1 text-sm text-slate-500">Search, sort, filter, and export customer data.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            aria-label="Search customers"
            placeholder="Search customers"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          />
          <select
            value={segment}
            onChange={(event) => {
              setSegment(event.target.value);
              setPage(1);
            }}
            aria-label="Filter customers by segment"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">All segments</option>
            <option value="New">New</option>
            <option value="Regular">Regular</option>
            <option value="VIP">VIP</option>
          </select>
          <button
            type="button"
            onClick={() => exportCsv(filteredCustomers)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : visibleCustomers.length === 0 ? (
          <EmptyState title="No customers found" description="Try adjusting the search or add a new customer profile." />
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
                      aria-label="Select visible customers"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updateSort('name')} className="font-bold text-slate-600">Name{sortLabel('name')}</button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updateSort('email')} className="font-bold text-slate-600">Email{sortLabel('email')}</button>
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-600">Phone</th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updateSort('segment')} className="font-bold text-slate-600">Segment{sortLabel('segment')}</button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updateSort('total_spend')} className="font-bold text-slate-600">Spend{sortLabel('total_spend')}</button>
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-indigo-50/40">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${customer.name}`}
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => toggleSelected(customer.id)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-950">{customer.name}</div>
                      <div className="text-xs text-slate-500">{customer.category}</div>
                    </td>
                    <td className="px-4 py-4">{customer.email}</td>
                    <td className="px-4 py-4">{customer.phone}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {customer.segment}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-950">{formatCurrency(customer.total_spend)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => onEdit(customer)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200">
                          Edit
                        </button>
                        <button onClick={() => onDelete(customer.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200">
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
          <span>{filteredCustomers.length} customers found</span>
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

export default CustomerTable;
