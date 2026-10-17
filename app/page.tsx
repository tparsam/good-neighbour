import { redirect } from 'next/navigation'

// The app is Good Neighbour; the earlier bird journal lives at /birds.
export default function Home() {
  redirect('/privacy')
}
