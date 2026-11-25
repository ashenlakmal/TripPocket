import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';
import { formatDate, formatLKR } from './tripFormat.js';
import './trips.css';

export default function TripDetails({ tripId, onBack, children }) {
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setTrip(null);
    setError('');
    apiRequest(`/trips/${tripId}`, { signal: controller.signal })
      .then(setTrip)
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, [tripId]);

  return (
    <section className="trip-details" aria-live="polite">
      <button type="button" className="trip-btn" onClick={onBack}>
        ← Back to My Trips
      </button>

      {error && (
        <div className="trip-state trip-state-error" role="alert">
          <p>{error}</p>
        </div>
      )}
      {!error && !trip && <p className="trip-state">Loading trip...</p>}

      {trip && (
        <>
          <div className="trip-summary-card">
            <h2>{trip.name}</h2>
            <p className="trip-destination">{trip.destination}</p>
            <p className="trip-meta">
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </p>
            <p className="trip-budget">Budget: {formatLKR(trip.budget)}</p>
          </div>
          {children}
        </>
      )}
    </section>
  );
}
