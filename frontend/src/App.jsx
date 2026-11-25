import { useEffect, useState } from 'react';
import { apiRequest } from './services/api.js';
import Trips from './components/Trips.jsx';
import Expenses from './components/Expenses.jsx';
import BudgetSummary from './components/BudgetSummary.jsx';

export default function App() {
  const [connection, setConnection] = useState('Checking backend connection...');

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
      {/* TODO: Connect trip selection to the expense and summary modules. */}
      <div className="modules">
        <Trips />
        <Expenses />
        <BudgetSummary />
      </div>
    </main>
  );
}
