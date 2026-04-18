import Nav from './Nav'
import CornerBrackets from './CornerBrackets'

interface Props {
  title: string
  children?: React.ReactNode
}

export default function InnerPageShell({ title, children }: Props) {
  return (
    <>
      <Nav showSphere />
      <CornerBrackets />
      <div className="vignette" />
      <div className="tagline">Cultural&nbsp;&nbsp;Transmission</div>
      <div className="page-content">
        <h1 className="page-title">{title}</h1>
        <div className="page-body">{children}</div>
      </div>
    </>
  )
}
