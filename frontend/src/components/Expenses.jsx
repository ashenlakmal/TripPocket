import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api.js';

const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Activities', 'Other'];
const EMPTY_FORM = { title: '', category: 'Food', amount: '', date: '' };
const currency = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  minimumFractionDigits: 2,
});

function asList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.trips)) return value.trips;
  if (Array.isArray(value?.expenses)) return value.expenses;
  return [];
}

function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function today() {
  return toDateInputValue(new Date());
}

export function ExpenseCard({ onClick }) {
  return (
    <button type="button" className="module-card expense-card" onClick={onClick} aria-label="Open Expense Management">
      <span className="card-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2Z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      </span>
      <span className="card-title">Expense Management</span>
      <span className="card-description">Add, track, search and filter expenses for each trip.</span>
      <span className="card-action">Open module <span aria-hidden="true">→</span></span>
    </button>
  );
}

export default function ExpensePage({ onBack }) {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [tripsError, setTripsError] = useState('');
  const [expensesError, setExpensesError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [tripsKey, setTripsKey] = useState(0);
  const [expensesKey, setExpensesKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadingTrips(true);
    setTripsError('');
    apiRequest('/trips')
      .then(data => {
        if (!active) return;
        setTrips(asList(data));
      })
      .catch(error => {
        if (active) setTripsError(error.message || 'Unable to load trips.');
      })
      .finally(() => {
        if (active) setLoadingTrips(false);
      });
    return () => {
      active = false;
    };
  }, [tripsKey]);

  useEffect(() => {
    if (!trips.length) {
      setSelectedTripId('');
      return;
    }
    if (!trips.some(trip => trip._id === selectedTripId)) setSelectedTripId(trips[0]._id);
  }, [trips, selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) {
      setExpenses([]);
      setExpensesError('');
      return undefined;
    }
    let active = true;
    setLoadingExpenses(true);
    setExpensesError('');
    apiRequest(`/trips/${selectedTripId}/expenses`)
      .then(data => {
        if (active) setExpenses(asList(data));
      })
      .catch(error => {
        if (active) {
          setExpenses([]);
          setExpensesError(error.message || 'Unable to load expenses.');
        }
      })
      .finally(() => {
        if (active) setLoadingExpenses(false);
      });
    return () => {
      active = false;
    };
  }, [selectedTripId, expensesKey]);

  const selectedTrip = trips.find(trip => trip._id === selectedTripId);
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses.filter(expense => {
      const matchesSearch = !query || String(expense.title || '').toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || expense.category === categoryFilter;
      const matchesDate = !dateFilter || toDateInputValue(expense.date) === dateFilter;
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [expenses, search, categoryFilter, dateFilter]);

  function resetForm() {
    setFormOpen(false);
    setEditingExpense(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  }

  function closeForm() {
    if (!saving) resetForm();
  }

  function openCreateForm() {
    if (!selectedTripId) return;
    setEditingExpense(null);
    setForm({ ...EMPTY_FORM, date: today() });
    setFormErrors({});
    setFormOpen(true);
  }

  function openEditForm(expense) {
    setEditingExpense(expense);
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      date: toDateInputValue(expense.date),
    });
    setFormErrors({});
    setFormOpen(true);
  }

  function validateForm() {
    const errors = {};
    const title = form.title.trim();
    if (!title) errors.title = 'Expense title is required.';
    else if (title.length > 120) errors.title = 'Expense title cannot exceed 120 characters.';
    if (!CATEGORIES.includes(form.category)) errors.category = 'Choose a valid category.';
    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount greater than zero.';
    if (!form.date) errors.date = 'Expense date is required.';
    else if (Number.isNaN(new Date(form.date).getTime())) errors.date = 'Enter a valid date.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function saveExpense(event) {
    event.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
    };
    try {
      if (editingExpense) {
        await apiRequest(`/expenses/${editingExpense._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest(`/trips/${selectedTripId}/expenses`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      setExpensesKey(key => key + 1);
    } catch (error) {
      setFormErrors({ submit: error.message || 'Unable to save expense.' });
    } finally {
      setSaving(false);
    }
  }

  function cancelDelete() {
    if (!deleting) setDeleteTarget(null);
  }

  async function removeExpense() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/expenses/${deleteTarget._id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setExpensesKey(key => key + 1);
    } catch (error) {
      setExpensesError(error.message || 'Unable to delete expense.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function handleTripChange(event) {
    setSelectedTripId(event.target.value);
    setSearch('');
    setCategoryFilter('');
    setDateFilter('');
  }

  function clearFilters() {
    setSearch('');
    setCategoryFilter('');
    setDateFilter('');
  }

  return (
    <section className="expense-page" aria-labelledby="expense-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TRIP EXPENSES</p>
          <h2 id="expense-title">Expense Management</h2>
          <p className="page-subtitle">
            {selectedTrip ? `Managing expenses for ${selectedTrip.name || selectedTrip.destination || 'this trip'}.` : 'Record, search and manage spending for your selected trip.'}
          </p>
        </div>
        <button type="button" className="button secondary" onClick={onBack}>← Dashboard</button>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span className="stat-label">Total Expenses</span>
          <strong>{expenses.length}</strong>
        </article>
        <article className="stat-card accent">
          <span className="stat-label">Total Amount Spent</span>
          <strong>{currency.format(totalSpent)}</strong>
        </article>
      </div>

      <div className="toolbar">
        <label className="field trip-field">
          <span>Selected trip</span>
          <select value={selectedTripId} onChange={handleTripChange} disabled={loadingTrips}>
            <option value="">{loadingTrips ? 'Loading trips...' : 'Select a trip'}</option>
            {trips.map(trip => (
              <option key={trip._id} value={trip._id}>{trip.name || trip.destination || trip._id}</option>
            ))}
          </select>
        </label>
        <button type="button" className="button primary" onClick={openCreateForm} disabled={!selectedTripId}>
          Add Expense
        </button>
      </div>

      {tripsError && (
        <div className="notice error" role="alert">
          {tripsError}
          <button type="button" className="table-button" onClick={() => setTripsKey(key => key + 1)}>Retry</button>
        </div>
      )}
      {!tripsError && !loadingTrips && !trips.length && (
        <div className="notice empty">No trips available yet. Create a trip in the Trips module first.</div>
      )}

      <div className="filters">
        <label className="field">
          <span>Search expenses</span>
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search by title"
          />
        </label>
        <label className="field">
          <span>Category</span>
          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Date</span>
          <input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} />
        </label>
        {(search || categoryFilter || dateFilter) && (
          <button type="button" className="button ghost" onClick={clearFilters}>Clear filters</button>
        )}
      </div>

      {expensesError && (
        <div className="notice error" role="alert">
          {expensesError}
          <button type="button" className="table-button" onClick={() => setExpensesKey(key => key + 1)}>Retry</button>
        </div>
      )}

      {loadingExpenses ? (
        <div className="notice" role="status">Loading expenses...</div>
      ) : !selectedTripId ? (
        <div className="notice empty">Select a trip to view its expenses.</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="notice empty">
          {expenses.length ? 'No expenses match your filters.' : 'No expenses recorded for this trip yet.'}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="expense-table">
            <thead>
              <tr>
                <th scope="col">Expense</th>
                <th scope="col">Category</th>
                <th scope="col">Amount</th>
                <th scope="col">Date</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense._id}>
                  <td data-label="Expense">{expense.title}</td>
                  <td data-label="Category">
                    <span className={`badge ${String(expense.category).toLowerCase()}`}>{expense.category}</span>
                  </td>
                  <td data-label="Amount">{currency.format(Number(expense.amount))}</td>
                  <td data-label="Date">{toDateInputValue(expense.date)}</td>
                  <td data-label="Actions" className="actions">
                    <button type="button" className="table-button" onClick={() => openEditForm(expense)}>Edit</button>
                    <button type="button" className="table-button danger" onClick={() => setDeleteTarget(expense)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div className="modal-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
            <form onSubmit={saveExpense} noValidate>
              <div className="modal-header">
                <h3 id="form-title">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
                <button type="button" className="icon-button" onClick={closeForm} aria-label="Close">×</button>
              </div>
              <div className="form-grid">
                <label className="field full">
                  <span>Expense Title</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                    placeholder="e.g. Dinner at Galle"
                    autoFocus
                  />
                  {formErrors.title && <small role="alert">{formErrors.title}</small>}
                </label>
                <label className="field">
                  <span>Category</span>
                  <select
                    value={form.category}
                    onChange={event => setForm(current => ({ ...current, category: event.target.value }))}
                  >
                    {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                  {formErrors.category && <small role="alert">{formErrors.category}</small>}
                </label>
                <label className="field">
                  <span>Amount (LKR)</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={event => setForm(current => ({ ...current, amount: event.target.value }))}
                    placeholder="0.00"
                  />
                  {formErrors.amount && <small role="alert">{formErrors.amount}</small>}
                </label>
                <label className="field full">
                  <span>Expense Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={event => setForm(current => ({ ...current, date: event.target.value }))}
                  />
                  {formErrors.date && <small role="alert">{formErrors.date}</small>}
                </label>
              </div>
              {formErrors.submit && <p className="form-error" role="alert">{formErrors.submit}</p>}
              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={closeForm} disabled={saving}>Cancel</button>
                <button type="submit" className="button primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) cancelDelete();
        }}>
          <div className="modal small" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <h3 id="delete-title">Delete expense?</h3>
            <p>“{deleteTarget.title}” will be permanently removed.</p>
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={cancelDelete} disabled={deleting}>Cancel</button>
              <button type="button" className="button danger" onClick={removeExpense} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
