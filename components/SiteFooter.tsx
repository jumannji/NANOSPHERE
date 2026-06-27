const LINKS = [
  { label: 'TIKTOK',    href: '#' },
  { label: 'INSTAGRAM', href: '#' },
  { label: 'TWITTER',   href: '#' },
  { label: 'SUBSTACK',  href: '#' },
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
