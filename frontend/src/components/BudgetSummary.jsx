import { useEffect, useState } from "react";
import { apiRequest } from '../services/api.js';

const currencyFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
});

function formatMoney(value) {
  return currencyFormatter.format(value);
}

function useBudgetSummary({ tripId, refreshKey }) {
  const [state, setState] = useState({ status: 'loading', data: null, message: '' });

  useEffect(() => {
    if (!tripId) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    setState({ status: 'loading', data: null, message: '' });

    Promise.all([
      apiRequest(`/trips/${tripId}/summary`, { signal }),
      apiRequest(`/trips/${tripId}/category-summary`, { signal }),
    ])
      .then(([totals, categoryData]) => {
        setState({
          status: 'success',
          data: { ...totals, categories: categoryData.categories },
          message: '',
        });
      })
      .catch(error => {
        setState({status: 'error', data: null, message: error.message });
      });
    
    return () => controller.abort();
  }, [tripId, refreshKey]);

  return state;
}

function SummaryCard({label, value}) {
  return (
    <div className="summary-card">
      <dt>{label}</dt>
      <dt>{formatMoney(value)}</dt>
    </div>
  );
}

function SummaryContent({ tripId, status, data, message }) {
  if (!tripId) return <p>Select a trip to see its budget summary.</p>
  if (status == 'loading') return <p role="status">Loading budget summary...</p>
  if (status == 'error') return <p role="alert">{message}</p>

  return (
    <>
      <dl>
        <SummaryCard label="Budget" value={data.budget}/>
        <SummaryCard label="Total" value={data.total} />
        <SummaryCard label="Remaining" value={data.remaining} />
      </dl>
      {data.categories.length === 0 && (
        <p>No expenses yet. Add an expense to see how your money is spent</p>
      )}
    </>
  )
}

export default function BudgetSummary({ tripId = null, refreshKey = 0}) {
  const { status, data, message } = useBudgetSummary(tripId, refreshKey);

  return (
    <section aria-labelledby="budget-summary-title">
      <h2 id="budget-summary-title">Budget Summary</h2>
      <SummaryContent tripId={tripId} status={status} data={data} message={message}/>
    </section>
  );
}
