import './globals.css'

export const metadata = {
  title: 'Ring Bird Journal',
  description: 'Turn a Ring camera into a smart bird feeder camera',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
