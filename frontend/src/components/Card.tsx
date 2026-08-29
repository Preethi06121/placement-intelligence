type CardProps = {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export default function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <section className={`clay-card ${className}`.trim()}>
      {title ? <h2 className="clay-card__title">{title}</h2> : null}
      {subtitle ? <p className="clay-card__subtitle">{subtitle}</p> : null}
      {children}
    </section>
  )
}
