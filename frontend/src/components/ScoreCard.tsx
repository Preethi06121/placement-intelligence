type ScoreCardProps = {
  label: string
  value: number | string | null
  suffix?: string
}

export default function ScoreCard({ label, value, suffix = '' }: ScoreCardProps) {
  const display =
    value === null || value === undefined
      ? '—'
      : typeof value === 'number'
        ? `${value.toFixed(1)}${suffix}`
        : value

  return (
    <div className="score-card">
      <div className="score-card__label">{label}</div>
      <div className="score-card__value">{display}</div>
    </div>
  )
}
