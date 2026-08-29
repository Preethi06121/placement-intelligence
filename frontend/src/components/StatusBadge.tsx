type StatusBadgeProps = {
  label: string
}

export default function StatusBadge({ label }: StatusBadgeProps) {
  let variant = 'not'
  if (label === 'READY') variant = 'ready'
  else if (label === 'ALMOST_READY') variant = 'almost'

  const display = label.replace(/_/g, ' ')

  return <span className={`status-badge status-badge--${variant}`}>{display}</span>
}
