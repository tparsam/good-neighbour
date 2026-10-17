import { Archivo, Instrument_Serif, Shippori_Mincho } from 'next/font/google'
import './globals.css'

// next/font downloads these at build time and serves them from this app, so the page works offline.
const grot = Archivo({ subsets: ['latin'], variable: '--f-grot', display: 'swap' })
const tall = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--f-tall', display: 'swap' })
// Used by the PARCO-look preview for body text, standing in for PARCO's Kozuka Mincho.
const mincho = Shippori_Mincho({ subsets: ['latin'], weight: ['400', '600'], variable: '--f-mincho', display: 'swap' })

export const metadata = {
  title: 'Good Neighbour',
  description: 'Is your camera being a good neighbour? Finds what a Ring camera records that is not yours.',
  appleWebApp: { capable: true, title: 'Good Neighbour', statusBarStyle: 'default' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grot.variable} ${tall.variable} ${mincho.variable}`}>
      <body>{children}</body>
    </html>
  )
}
