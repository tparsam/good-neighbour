import type { Today } from '@/lib/journal/summary'

const hourLabel = (hour: number) =>
  new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function TodaySummary({ today }: { today: Today }) {
  const figures: [string, string | number][] = [
    ['Species', today.species],
    ['Visits', today.visits],
    ['Busiest hour', today.busiestHour === null ? 'None yet' : hourLabel(today.busiestHour)],
  ]
  return (
    <section id="today" aria-labelledby="today-heading" className="section today">
      <div className="section-head">
        <h2 id="today-heading">Today</h2>
      </div>
      <div className="section-body">
        {today.visits === 0 ? (
          <p className="empty">No birds have visited yet today.</p>
        ) : (
          <dl className="figures">
            {figures.map(([label, value]) => (
              <div key={label} className="figure">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}
