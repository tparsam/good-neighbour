import { Archivo, IBM_Plex_Mono, Instrument_Sans, Instrument_Serif, Newsreader, Outfit } from 'next/font/google'
import './globals.css'
import './looks/journal.css'
import './looks/print.css'
import './looks/window.css'
import './looks/museum.css'

// PREVIEW ONLY: three sample looks are loaded side by side so one can be chosen.
// When a look is chosen, keep its fonts and stylesheet and delete the others.
// next/font downloads these at build time and serves them from this app, so the page works offline.
const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--f-serif', display: 'swap' })
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--f-sans', display: 'swap' })
const grot = Archivo({ subsets: ['latin'], variable: '--f-grot', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--f-mono', display: 'swap' })
const soft = Outfit({ subsets: ['latin'], variable: '--f-soft', display: 'swap' })
const tall = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--f-tall', display: 'swap' })

export const metadata = {
  title: 'Ring Bird Journal',
  description: 'Turn a Ring camera into a smart bird feeder camera',
}

// Sets the look from ?look= before first paint, so the page never flashes the wrong sample.
const pickLook = `try{var l=new URLSearchParams(location.search).get('look');document.documentElement.classList.add('look-'+(['journal','print','window','museum'].indexOf(l)>-1?l:'journal'))}catch(e){document.documentElement.classList.add('look-journal')}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${grot.variable} ${mono.variable} ${soft.variable} ${tall.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: pickLook }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
