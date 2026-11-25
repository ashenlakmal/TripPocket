const currency = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  minimumFractionDigits: 2,
});

export function formatLKR(value) {
  return currency.format(value);
}

// Trip dates are stored at midnight UTC, so format in UTC to avoid showing the wrong day.
export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Value for <input type="date"> (YYYY-MM-DD).
export function toDateInputValue(value) {
  return new Date(value).toISOString().slice(0, 10);
}
