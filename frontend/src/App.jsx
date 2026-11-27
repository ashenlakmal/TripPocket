import { useEffect, useState } from 'react';
import { apiRequest } from './services/api.js';
import AppNav from './components/AppNav.jsx';
import Trips from './components/Trips.jsx';
import TripDetails from './components/TripDetails.jsx';
import Expenses from './components/Expenses.jsx';
import BudgetSummary from './components/BudgetSummary.jsx';

function getTripIdFromHash() {
  const match = window.location.hash.match(/^#\/trips\/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export default function App() {
  const [connectionError, setConnectionError] = useState('');
  const [selectedTripId, setSelectedTripId] = useState(getTripIdFromHash);

  // The selected trip lives in the URL (#/trips/<id>) so a browser refresh keeps the same Trip Details screen.
  useEffect(() => {
    const onHashChange = () => setSelectedTripId(getTripIdFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Only problems are shown to the user; a healthy connection needs no message.
  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/health', { signal: controller.signal })
      .then(data => {
        if (data.database !== 'connected') setConnectionError('The database is not connected. Please try again later.');
      })
      .catch(error => {
        if (error.name !== 'AbortError') setConnectionError('The server cannot be reached. Please try again later.');
      });
    return () => controller.abort();
  }, []);

  return (
    <>
      <AppNav onTripScreen={Boolean(selectedTripId)} />
      <main>
        {connectionError && (
          <p className="connection-error" role="alert">{connectionError}</p>
        )}
        {selectedTripId ? (
          <TripDetails tripId={selectedTripId}>
            {/* TODO: pass tripId={selectedTripId} to the expense and summary modules once they accept it. */}
            <div className="modules">
              <Expenses />
              <BudgetSummary />
            </div>
          </TripDetails>
        ) : (
          <Trips onSelectTrip={trip => { window.location.hash = `#/trips/${trip._id}`; }} />
        )}
      </main>
    </>
  );
}
