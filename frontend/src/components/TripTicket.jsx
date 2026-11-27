import { countTripDays, formatDate, formatLKR, getTripStatus } from './tripFormat.js';

// Ticket-style trip card used by the trip list and the Trip Details screen.
export default function TripTicket({ trip, titleAs: Title = 'h2', wide = false, children }) {
  const days = countTripDays(trip.startDate, trip.endDate);
  const status = getTripStatus(trip.startDate, trip.endDate);

  return (
    <div className={wide ? 'trip-ticket trip-ticket-wide' : 'trip-ticket'}>
      <div className="trip-ticket-main">
        <div className="trip-ticket-top">
          <p className="trip-destination">{trip.destination}</p>
          <span className={`trip-status trip-status-${status.toLowerCase()}`}>{status}</span>
        </div>
        <Title className="trip-title">{trip.name}</Title>
        <p className="trip-dates">
          {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
          <span className="trip-days">
            {days} {days === 1 ? 'day' : 'days'}
          </span>
        </p>
      </div>
      <div className="trip-ticket-stub">
        <p className="trip-budget-label">Budget</p>
        <p className="trip-budget">{formatLKR(trip.budget)}</p>
        {children}
      </div>
    </div>
  );
}
