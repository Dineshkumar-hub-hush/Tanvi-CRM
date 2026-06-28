import { useEffect, useMemo, useState } from 'react';

const initialState = {
  customer_id: '',
  category: '',
  amount: '',
  payment_status: 'Paid',
  purchase_date: '',
  notes: '',
};

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100';

function FieldError({ message }) {
  return message ? <p className="mt-1 text-xs font-medium text-rose-600">{message}</p> : null;
}

function PurchaseForm({ customers, initialData, onSubmit, onCancel, isEditing, submitting }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const baseline = useMemo(() => (initialData ? { ...initialState, ...initialData } : initialState), [initialData]);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [baseline, form]);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialState,
        ...initialData,
      });
    } else {
      setForm(initialState);
    }
    setErrors({});
    setSuccess('');
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setSuccess('');
  };

  useEffect(() => {
    if (!isDirty) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const validate = () => {
    const nextErrors = {};
    if (!form.customer_id) nextErrors.customer_id = 'Select a customer.';
    if (!form.category.trim()) nextErrors.category = 'Category is required.';
    if (form.amount === '') {
      nextErrors.amount = 'Amount is required.';
    } else if (Number(form.amount) < 0) {
      nextErrors.amount = 'Amount cannot be negative.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        ...form,
        customer_id: Number(form.customer_id),
        amount: Number(form.amount || 0),
      });
      setSuccess(isEditing ? 'Purchase updated successfully.' : 'Purchase saved successfully.');
      if (!isEditing) {
        setForm(initialState);
      }
    } catch {
      setSuccess('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Revenue activity</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">{isEditing ? 'Edit Purchase' : 'Add Purchase'}</h2>
          <p className="mt-1 text-sm text-slate-500">Record customer purchases and payment status.</p>
        </div>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="purchase-customer">Customer <span className="text-rose-500">*</span></label>
          <select id="purchase-customer" required name="customer_id" value={form.customer_id} onChange={handleChange} className={inputClass} aria-invalid={Boolean(errors.customer_id)} aria-describedby="purchase-customer-error" disabled={customers.length === 0 && !isEditing}>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
          <div id="purchase-customer-error"><FieldError message={errors.customer_id || (customers.length === 0 && !isEditing ? 'Add a customer before recording a purchase.' : '')} /></div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="purchase-category">Category <span className="text-rose-500">*</span></label>
          <input id="purchase-category" required name="category" value={form.category} onChange={handleChange} className={inputClass} placeholder="Subscription, service, retail" aria-invalid={Boolean(errors.category)} aria-describedby="purchase-category-error" />
          <div id="purchase-category-error"><FieldError message={errors.category} /></div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="purchase-amount">Amount <span className="text-rose-500">*</span></label>
          <input id="purchase-amount" required type="number" min="0" name="amount" value={form.amount} onChange={handleChange} className={inputClass} aria-invalid={Boolean(errors.amount)} aria-describedby="purchase-amount-error" />
          <div id="purchase-amount-error"><FieldError message={errors.amount} /></div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="purchase-status">Payment Status</label>
          <select id="purchase-status" name="payment_status" value={form.payment_status} onChange={handleChange} className={inputClass}>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="purchase-date">Purchase Date</label>
          <input id="purchase-date" type="date" name="purchase_date" value={form.purchase_date || ''} onChange={handleChange} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-slate-700" htmlFor="purchase-notes">Notes</label>
          <textarea id="purchase-notes" name="notes" rows="3" value={form.notes || ''} onChange={handleChange} className={inputClass} placeholder="Invoice notes, payment context, or follow-up details" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-5 text-sm font-medium text-emerald-700">
          {success}
        </div>
        <button
          type="submit"
          disabled={submitting || !isDirty || (customers.length === 0 && !isEditing)}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : isEditing ? 'Update Purchase' : 'Save Purchase'}
        </button>
      </div>
    </form>
  );
}

export default PurchaseForm;
