import type { Species } from '@/lib/journal/summary'

const dayLabel = (time: number) =>
  new Date(time).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })

export function LifeList({ species }: { species: Species[] }) {
  return (
    <section aria-labelledby="life-list-heading" className="section lifelist">
      <div className="section-head">
        <h2 id="life-list-heading">Life list</h2>
        {species.length > 0 && <p className="count">{species.length} species</p>}
      </div>
      <div className="section-body">
        {species.length === 0 ? (
          <p className="empty">Every bird the camera identifies is added here. Start the live stream to begin.</p>
        ) : (
          <ul className="species">
            {species.map(bird => (
              <li key={bird.name} className="specimen">
                {/* Snapshots are wide camera frames with a small subject, so they are never cropped to a portrait. */}
                {bird.snapshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="shot"
                    src={`/api/snapshots/${bird.snapshot}`}
                    alt={`${bird.name} at the feeder`}
                    width={384}
                    height={216}
                    loading="lazy"
                  />
                ) : (
                  <p className="shot shot-empty">No snapshot yet</p>
                )}
                <h3>{bird.name}</h3>
                <p className="meta">
                  <span className="meta-first">First seen {dayLabel(bird.firstSeen)}.</span>{' '}
                  <span className="meta-visits">
                    {bird.visits} {bird.visits === 1 ? 'visit' : 'visits'}.
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
