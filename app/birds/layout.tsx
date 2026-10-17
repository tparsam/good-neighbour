import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ring Bird Journal',
  description: 'Turn a Ring camera into a smart bird feeder camera',
}

export default function BirdsLayout({ children }: { children: React.ReactNode }) {
  return children
}
