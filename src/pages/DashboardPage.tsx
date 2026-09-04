export function DashboardPage() {
  return (
    <main className="page-content">
      <p className="eyebrow">Mai helyzetkép</p>
      <h1>Kezdőlap</h1>
      <div className="dashboard-grid">
        <section className="metric-card"><strong>0</strong><span>Visszaigazolásra vár</span></section>
        <section className="metric-card"><strong>0</strong><span>Közelgő határidő</span></section>
        <section className="metric-card"><strong>0</strong><span>Mai esemény</span></section>
      </div>
      <p className="demo-note">A napi kártyák az I1 adatkapcsolat lezárásáig üres állapotot mutatnak.</p>
    </main>
  )
}
