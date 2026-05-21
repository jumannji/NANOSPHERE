'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { fireNav } from '@/lib/navTransition'

type Props = React.ComponentPropsWithoutRef<typeof Link> & { href: string }

export default function TransitionLink({ href, children, onClick, ...rest }: Props) {
  const pathname = usePathname()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    e.preventDefault()
    fireNav({ href, fromHome: pathname === '/' })
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
