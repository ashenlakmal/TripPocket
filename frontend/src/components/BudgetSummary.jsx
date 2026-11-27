import { useEffect, useState } from "react";
import { apiRequest } from '../services/api.js';
import './BudgetSummary.css';

const currencyFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
});

function formatMoney(value) {
  return currencyFormatter.format(value);
}

function calculatePercentUsed(budget, totalSpent) {
  if (budget <= 0) return 0;
  return (totalSpent / budget) * 100;
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

function SpendingProgress({budget, totalSpent, isOverBudget}) {
  const percentUsed = calculatePercentUsed(budget, totalSpent);
  const barWidth = Math.min(percentUsed, 100);
  const percentLabel = Math.floor(percentUsed)

  return (
    <div className="summary-progress">
      <p className="summary-progress-label">{percentLabel}% of budget used</p>
      <div 
        className="summary-progress-track"
        role="progressbar"
        aria-label="Budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percentLabel, 100)}
      >
        <div 
          className={isOverBudget ? 'summary-progress-fill summary-progress-fill--over' : 'summary-progress-fill'}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function OverBudgetWarning({ overSpent }) {
  return (
    <p className="summary-warning" role="alert">
      Over budget. You have spent {formatMoney(overSpent)} more than planned.
    </p>
  );
}

function CategoryBreakdown({ categories }) {
  return (
    <div>
      <h3 className="summary-category-title">Spending by category</h3>
      {categories.length === 0 ? (
        <p>No expenses yet. Add an expense to see how your money is spent.</p>
      ) : (
        <ul className="summary-categories">
          {categories.map(({ category, total }) => (
            <li key={category}>
              <span>{category}</span>
              <span>{formatMoney(total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryContent({ tripId, status, data, message }) {
  if (!tripId) return <p>Select a trip to see its budget summary.</p>
  if (status == 'loading') return <p role="status">Loading budget summary...</p>
  if (status == 'error') return <p role="alert">{message}</p>

  const isOverBudget = data.remaining < 0;

  return (
    <>
      <dl>
        <SummaryCard label="Budget" value={data.budget}/>
        <SummaryCard label="Total spent" value={data.totalSpent} />
        <SummaryCard label="Remaining" value={data.remaining} />
      </dl>
      <SpendingProgress 
        budget={data.budget}
        totalSpent={data.totalSpent}
        isOverBudget={isOverBudget}
      />
      {isOverBudget && <OverBudgetWarning overSpent={Math.abs(data.remaining)} />}
      <CategoryBreakdown categories={data.categories} />
    </>
  )
}

export default function BudgetSummary({ tripId = null, refreshKey = 0}) {
  const { status, data, message } = useBudgetSummary({ tripId, refreshKey });

  return (
    <section aria-labelledby="budget-summary-title">
      <h2 id="budget-summary-title">Budget Summary</h2>
      <SummaryContent tripId={tripId} status={status} data={data} message={message}/>
    </section>
  );
}
