import type { Metadata } from 'next'
import { Cinzel, Italiana, Press_Start_2P } from 'next/font/google'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-cinzel',
  display: 'swap',
})

const italiana = Italiana({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-italiana',
  display: 'swap',
})

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-press-start',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NanoSphere — Cultural Transmission',
  description: 'NanoSphere — Cultural Transmission',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${italiana.variable} ${pressStart2P.variable}`}>
      <head>
        {/* Runs synchronously before paint — no theme flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var h=location.pathname==='/';var s=sessionStorage.getItem('ns-theme');var t;if(h){t=String(Math.floor(Math.random()*4)+1);sessionStorage.setItem('ns-theme',t);}else{t=s||String(Math.floor(Math.random()*4)+1);if(!s)sessionStorage.setItem('ns-theme',t);}if(t!=='1')document.documentElement.dataset.theme=t;})()` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
