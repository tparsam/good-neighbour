import { Archivo, Instrument_Serif } from 'next/font/google'
import './globals.css'

// next/font downloads these at build time and serves them from this app, so the page works offline.
const grot = Archivo({ subsets: ['latin'], variable: '--f-grot', display: 'swap' })
const tall = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--f-tall', display: 'swap' })

export const metadata = {
  title: 'Ring Bird Journal',
  description: 'Turn a Ring camera into a smart bird feeder camera',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grot.variable} ${tall.variable}`}>
      <body>{children}</body>
    </html>
  )
}
