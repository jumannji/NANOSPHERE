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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bitcount+Grid+Double&display=swap" rel="stylesheet" />
        {/* Runs synchronously before paint — no theme flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var h=location.pathname==='/';var s=sessionStorage.getItem('ns-theme');var t;if(h){t=Math.random()<.5?'2':'1';sessionStorage.setItem('ns-theme',t);}else{t=s||(Math.random()<.5?'2':'1');if(!s)sessionStorage.setItem('ns-theme',t);}if(t==='2')document.documentElement.dataset.theme='2';})()` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
