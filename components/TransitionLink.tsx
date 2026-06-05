'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { navigateTo } from '@/lib/navigate'

type Props = React.ComponentPropsWithoutRef<typeof Link> & { href: string }

export default function TransitionLink({ href, children, ...rest }: Props) {
  const router = useRouter()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    navigateTo(href, h => router.push(h))
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
