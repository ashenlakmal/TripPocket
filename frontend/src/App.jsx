import { useEffect, useState } from 'react';
import { apiRequest } from './services/api.js';
import Trips from './components/Trips.jsx';
import TripDetails from './components/TripDetails.jsx';
import Expenses from './components/Expenses.jsx';
import BudgetSummary from './components/BudgetSummary.jsx';

function getTripIdFromHash() {
  const match = window.location.hash.match(/^#\/trips\/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export default function App() {
  const [connection, setConnection] = useState('Checking backend connection...');
  const [selectedTripId, setSelectedTripId] = useState(getTripIdFromHash);

  // The selected trip lives in the URL (#/trips/<id>) so a browser refresh keeps the same Trip Details screen.
  useEffect(() => {
    const onHashChange = () => setSelectedTripId(getTripIdFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/health', { signal: controller.signal })
      .then(data => setConnection(`API connected · Database ${data.database}`))
      .catch(error => {
        if (error.name !== 'AbortError') setConnection('Backend unavailable. Start the server and check your API URL.');
      });
    return () => controller.abort();
  }, []);

  return (
    <main>
      <header>
        <p className="eyebrow">TRAVEL BUDGET PLANNER</p>
        <h1>TripPocket</h1>
        <p>A starting point for your team project.</p>
        <p className="connection" role="status">{connection}</p>
      </header>
      {selectedTripId ? (
        <TripDetails tripId={selectedTripId} onBack={() => { window.location.hash = ''; }}>
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
  );
}
