import { useEffect, useMemo, useState } from 'react';

const initialState = {
  name: '',
  email: '',
  phone: '',
  category: '',
  segment: 'New',
  total_spend: 0,
  last_purchase_date: '',
  notes: '',
};

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100';

function FieldError({ message }) {
  return message ? <p className="mt-1 text-xs font-medium text-rose-600">{message}</p> : null;
}

function CustomerForm({ initialData, onSubmit, onCancel, isEditing, submitting }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const baseline = useMemo(() => (initialData ? { ...initialState, ...initialData } : initialState), [initialData]);

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

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [baseline, form]);

  useEffect(() => {
    if (!isDirty) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setSuccess('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required.';
    if (!form.category.trim()) nextErrors.category = 'Category is required.';
    if (Number(form.total_spend || 0) < 0) nextErrors.total_spend = 'Spend cannot be negative.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      total_spend: Number(form.total_spend || 0),
    };
    try {
      await onSubmit(payload);
      setSuccess(isEditing ? 'Customer updated successfully.' : 'Customer saved successfully.');
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
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Customer profile</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">{isEditing ? 'Edit Customer' : 'Add Customer'}</h2>
          <p className="mt-1 text-sm text-slate-500">Capture customer details and segment them quickly.</p>
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
          <label className="text-sm font-semibold text-slate-700" htmlFor="customer-name">Name <span className="text-rose-500">*</span></label>
          <input id="customer-name" required name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Customer name" aria-invalid={Boolean(errors.name)} aria-describedby="customer-name-error" />
          <div id="customer-name-error"><FieldError message={errors.name} /></div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="customer-email">Email <span className="text-rose-500">*</span></label>
          <input id="customer-email" required type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="customer@example.com" aria-invalid={Boolean(errors.email)} aria-describedby="customer-email-error" />
          <div id="customer-email-error"><FieldError message={errors.email} /></div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="customer-phone">Phone <span className="text-rose-500">*</span></label>
          <input id="customer-phone" required name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+1 555 0100" aria-invalid={Boolean(errors.phone)} aria-describedby="customer-phone-error" />
          <div id="customer-phone-error"><FieldError message={errors.phone} /></div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="customer-category">Category <span className="text-rose-500">*</span></label>
          <input id="customer-category" required name="category" value={form.category} onChange={handleChange} className={inputClass} placeholder="Retail, SaaS, Wholesale" aria-invalid={Boolean(errors.category)} aria-describedby="customer-category-error" />
          <div id="customer-category-error"><FieldError message={errors.category} /></div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="customer-segment">Segment</label>
          <select id="customer-segment" name="segment" value={form.segment} onChange={handleChange} className={inputClass}>
            <option value="New">New</option>
            <option value="Regular">Regular</option>
            <option value="VIP">VIP</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="customer-spend">Total Spend</label>
          <input id="customer-spend" type="number" min="0" name="total_spend" value={form.total_spend} onChange={handleChange} className={inputClass} aria-invalid={Boolean(errors.total_spend)} aria-describedby="customer-spend-error" />
          <div id="customer-spend-error"><FieldError message={errors.total_spend} /></div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="customer-last-purchase">Last Purchase</label>
          <input id="customer-last-purchase" type="date" name="last_purchase_date" value={form.last_purchase_date || ''} onChange={handleChange} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-slate-700" htmlFor="customer-notes">Notes</label>
          <textarea id="customer-notes" name="notes" rows="3" value={form.notes || ''} onChange={handleChange} className={inputClass} placeholder="Internal notes, preferences, or reminders" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-5 text-sm font-medium text-emerald-700">
          {success}
        </div>
        <button
          type="submit"
          disabled={submitting || !isDirty}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : isEditing ? 'Update Customer' : 'Save Customer'}
        </button>
      </div>
    </form>
  );
}

export default CustomerForm;
