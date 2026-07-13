const LINKS = [
  { label: 'TIKTOK',    href: '#' },
  { label: 'INSTAGRAM', href: 'https://www.instagram.com/nanosphereee/' },
  { label: 'TWITTER',   href: 'https://x.com/xNanoSphere' },
  { label: 'SUBSTACK',  href: 'https://nanospherex.substack.com/' },
]

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      {LINKS.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          className="site-footer-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      ))}
    </footer>
  )
}
