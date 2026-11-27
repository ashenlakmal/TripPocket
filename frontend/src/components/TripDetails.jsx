import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';
import TripTicket from './TripTicket.jsx';
import './trips.css';

export default function TripDetails({ tripId, children }) {
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
      <a className="trip-back" href="#">
        ← All trips
      </a>

      {error && (
        <div className="trip-state trip-state-error" role="alert">
          <p>{error}</p>
        </div>
      )}
      {!error && !trip && <p className="trip-state">Loading trip...</p>}

      {trip && (
        <>
          <TripTicket trip={trip} titleAs="h1" wide />
          {children}
        </>
      )}
    </section>
  );
}
