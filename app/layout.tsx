import type { Metadata } from 'next'
import { Cinzel, Italiana } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'NanoSphere — Cultural Transmission',
  description: 'NanoSphere — Cultural Transmission',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${italiana.variable}`}>
      <head>
        {/* Runs synchronously before paint — no theme flash */}
        <script dangerouslySetInnerHTML={{ __html: `if(Math.random()<.5)document.documentElement.dataset.theme='2'` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
