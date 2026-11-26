// Checks raw request values before Mongoose casts them. Without this, Mongoose saves `true` as a
// budget of 1, `0` as 1 January 1970, and rolls "2027-02-30" over to 2 March.

const TEXT_FIELDS = { name: 'Trip name', destination: 'Destination' };
const DATE_FIELDS = { startDate: 'Start date', endDate: 'End date' };

// Accepts "YYYY-MM-DD", optionally followed by the midnight UTC time the API itself returns.
const DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})(T00:00:00(\.000)?Z)?$/;

function isRealDate(value) {
  const match = typeof value === 'string' && value.match(DATE_PATTERN);
  if (!match) return false;
  const date = new Date(`${match[1]}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(match[1]);
}

function isNumeric(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value));
}

// Returns { field: message } for wrongly typed values. Missing values are left to the model's
// "required" rules.
export function findInputErrors(fields) {
  const errors = {};
  const isGiven = key => fields[key] !== undefined && fields[key] !== null && fields[key] !== '';

  for (const [key, label] of Object.entries(TEXT_FIELDS)) {
    if (isGiven(key) && typeof fields[key] !== 'string') errors[key] = `${label} must be text.`;
  }
  for (const [key, label] of Object.entries(DATE_FIELDS)) {
    if (isGiven(key) && !isRealDate(fields[key])) errors[key] = `${label} must be a real date (YYYY-MM-DD).`;
  }
  if (isGiven('budget') && !isNumeric(fields.budget)) errors.budget = 'Budget must be a number.';

  return errors;
}
