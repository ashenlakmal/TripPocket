// Shared navigation shown on every screen. Links use the URL hash that App reads to pick the screen.
export default function AppNav({ onTripScreen }) {
  return (
    <header className="app-nav">
      <div className="app-nav-inner">
        <a className="app-brand" href="#">
          TripPocket
        </a>
        <nav aria-label="Main">
          <a className="app-nav-link" href="#" aria-current={onTripScreen ? undefined : 'page'}>
            My Trips
          </a>
          {onTripScreen && (
            <span className="app-nav-link" aria-current="page">
              Trip details
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
