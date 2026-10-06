import type { Species } from '@/lib/journal/summary'

const dayLabel = (time: number) =>
  new Date(time).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })

export function LifeList({ species }: { species: Species[] }) {
  return (
    <section aria-labelledby="life-list-heading">
      <h2 id="life-list-heading">Life list</h2>
      {species.length === 0 ? (
        <p>Every bird the camera identifies is added here. Start the live stream to begin.</p>
      ) : (
        <ul>
          {species.map(bird => (
            <li key={bird.name}>
              {bird.snapshot && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/snapshots/${bird.snapshot}`} alt={`${bird.name} at the feeder`} width={384} height={216} />
              )}
              <h3>{bird.name}</h3>
              <p>
                First seen {dayLabel(bird.firstSeen)}. {bird.visits} {bird.visits === 1 ? 'visit' : 'visits'}.
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
