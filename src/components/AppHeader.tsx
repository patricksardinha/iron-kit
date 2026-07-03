// En-tête de marque : logo minimal + nom « IronKit ».
export function AppHeader() {
  return (
    <header className="app-header">
      <span className="app-logo" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="5" r="2.4" fill="currentColor" stroke="none" />
          <path d="M4 19 L12 10 L20 19" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="app-wordmark">
        Iron<b>Kit</b>
      </span>
    </header>
  )
}
