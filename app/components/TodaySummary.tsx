import type { Today } from '@/lib/journal/summary'

const hourLabel = (hour: number) =>
  new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric' })

export function TodaySummary({ today }: { today: Today }) {
  return (
    <section aria-labelledby="today-heading">
      <h2 id="today-heading">Today</h2>
      {today.visits === 0 ? (
        <p>No birds have visited yet today.</p>
      ) : (
        <dl>
          <dt>Species</dt>
          <dd>{today.species}</dd>
          <dt>Visits</dt>
          <dd>{today.visits}</dd>
          <dt>Busiest hour</dt>
          <dd>{today.busiestHour === null ? 'None yet' : hourLabel(today.busiestHour)}</dd>
        </dl>
      )}
    </section>
  )
}
