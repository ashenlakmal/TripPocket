import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';
import { formatDate, formatLKR, toDateInputValue } from './tripFormat.js';
import './trips.css';

const EMPTY_FORM = { name: '', destination: '', startDate: '', endDate: '', budget: '' };

function validateTrip(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Trip name is required.';
  if (!values.destination.trim()) errors.destination = 'Destination is required.';
  if (!values.startDate) errors.startDate = 'Start date is required.';
  if (!values.endDate) errors.endDate = 'End date is required.';
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = 'End date must be on or after the start date.';
  }
  const budget = Number(values.budget);
  if (values.budget === '' || Number.isNaN(budget)) errors.budget = 'Budget is required.';
  else if (budget <= 0) errors.budget = 'Budget must be a positive amount.';
  return errors;
}

// Closes a dialog with the Escape key, except while a request is still running.
function useEscapeKey(onEscape, disabled) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !disabled) onEscape();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, disabled]);
}

function TripForm({ trip, onSaved, onCancel }) {
  const [values, setValues] = useState(
    trip
      ? {
          name: trip.name,
          destination: trip.destination,
          startDate: toDateInputValue(trip.startDate),
          endDate: toDateInputValue(trip.endDate),
          budget: String(trip.budget),
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  useEscapeKey(onCancel, saving);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateTrip(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const body = JSON.stringify({
        name: values.name.trim(),
        destination: values.destination.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        budget: Number(values.budget),
      });
      const saved = trip
        ? await apiRequest(`/trips/${trip._id}`, { method: 'PUT', body })
        : await apiRequest('/trips', { method: 'POST', body });
      onSaved(saved, Boolean(trip));
    } catch (error) {
      setFormError(error.message);
      setSaving(false);
    }
  }

  const field = (name, label, props = {}) => (
    <div className="trip-field">
      <label htmlFor={`trip-${name}`}>{label}</label>
      <input
        id={`trip-${name}`}
        name={name}
        value={values[name]}
        onChange={handleChange}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `trip-${name}-error` : undefined}
        {...props}
      />
      {errors[name] && (
        <p className="trip-error" id={`trip-${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="trip-overlay" role="dialog" aria-modal="true" aria-labelledby="trip-form-title">
      <form className="trip-dialog" onSubmit={handleSubmit} noValidate>
        <h2 id="trip-form-title">{trip ? 'Edit trip' : 'New trip'}</h2>
        {field('name', 'Trip name', { type: 'text', maxLength: 100, autoFocus: true })}
        {field('destination', 'Destination', { type: 'text', maxLength: 100 })}
        <div className="trip-row">
          {field('startDate', 'Start date', { type: 'date' })}
          {field('endDate', 'End date', { type: 'date', min: values.startDate || undefined })}
        </div>
        {field('budget', 'Budget (LKR)', { type: 'number', min: '0', step: '0.01', inputMode: 'decimal' })}
        {formError && (
          <p className="trip-error trip-form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="trip-actions">
          <button type="button" className="trip-btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="trip-btn trip-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : trip ? 'Save changes' : 'Create trip'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteDialog({ trip, onDeleted, onCancel }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  useEscapeKey(onCancel, deleting);

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await apiRequest(`/trips/${trip._id}`, { method: 'DELETE' });
      onDeleted(trip);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="trip-overlay" role="alertdialog" aria-modal="true" aria-labelledby="trip-delete-title">
      <div className="trip-dialog">
        <h2 id="trip-delete-title">Delete this trip?</h2>
        <p>
          "{trip.name}" to {trip.destination} will be permanently deleted. This cannot be undone.
        </p>
        {error && (
          <p className="trip-error trip-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="trip-actions">
          <button type="button" className="trip-btn" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className="trip-btn trip-btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete trip'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Trips({ onSelectTrip }) {
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new trip, trip = edit
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState('');

  const loadTrips = useCallback(async signal => {
    setStatus('loading');
    try {
      const data = await apiRequest('/trips', { signal });
      setTrips(data);
      setStatus('ready');
    } catch (error) {
      if (error.name === 'AbortError') return;
      setLoadError(error.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadTrips(controller.signal);
    return () => controller.abort();
  }, [loadTrips]);

  function handleSaved(trip, wasEdit) {
    setEditing(null);
    setNotice(wasEdit ? 'Trip updated.' : 'Trip created.');
    loadTrips();
  }

  function handleDeleted() {
    setDeleting(null);
    setNotice('Trip deleted.');
    loadTrips();
  }

  return (
    <section className="trips" aria-labelledby="my-trips-title">
      <div className="trips-header">
        <h2 id="my-trips-title">My Trips</h2>
        <button type="button" className="trip-btn trip-btn-primary" onClick={() => setEditing({})}>
          + New trip
        </button>
      </div>

      {notice && (
        <p className="trip-notice" role="status">
          {notice}
        </p>
      )}

      {status === 'loading' && <p className="trip-state">Loading trips...</p>}

      {status === 'error' && (
        <div className="trip-state trip-state-error" role="alert">
          <p>Could not load trips: {loadError}</p>
          <button type="button" className="trip-btn" onClick={() => loadTrips()}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && trips.length === 0 && (
        <div className="trip-state">
          <p>No trips yet. Create your first trip to start planning your budget.</p>
        </div>
      )}

      {status === 'ready' && trips.length > 0 && (
        <ul className="trip-list">
          {trips.map(trip => (
            <li key={trip._id} className="trip-card">
              <div className="trip-card-body">
                <h3>{trip.name}</h3>
                <p className="trip-destination">{trip.destination}</p>
                <p className="trip-meta">
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </p>
                <p className="trip-budget">Budget: {formatLKR(trip.budget)}</p>
              </div>
              <div className="trip-card-actions">
                <button type="button" className="trip-btn trip-btn-primary" onClick={() => onSelectTrip?.(trip)}>
                  Open
                </button>
                <button type="button" className="trip-btn" onClick={() => setEditing(trip)}>
                  Edit
                </button>
                <button type="button" className="trip-btn trip-btn-danger-outline" onClick={() => setDeleting(trip)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <TripForm trip={editing._id ? editing : null} onSaved={handleSaved} onCancel={() => setEditing(null)} />
      )}
      {deleting && <DeleteDialog trip={deleting} onDeleted={handleDeleted} onCancel={() => setDeleting(null)} />}
    </section>
  );
}
