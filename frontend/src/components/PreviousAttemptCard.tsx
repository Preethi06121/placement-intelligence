import type { Attempt } from '../api'
import ScoreCard from './ScoreCard'
import StatusBadge from './StatusBadge'

type PreviousAttemptCardProps = {
  attempt: Attempt
}

function formatDate(iso: string | null) {
  if (!iso) return 'Unknown date'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export default function PreviousAttemptCard({ attempt }: PreviousAttemptCardProps) {
  return (
    <article className="attempt-card">
      <div className="attempt-card__header">
        <div>
          <StatusBadge label={attempt.readiness_label} />
          <div className="attempt-card__date">{formatDate(attempt.created_at)}</div>
        </div>
        <div className="attempt-card__overall-score">
          {attempt.overall_score.toFixed(1)}
        </div>
      </div>
      <div className="score-grid attempt-card__score-grid">
        <ScoreCard label="Resume" value={attempt.resume_score} />
        <ScoreCard label="Coding" value={attempt.coding_score} />
        <ScoreCard label="CS" value={attempt.cs_score} />
        <ScoreCard label="Aptitude" value={attempt.aptitude_score} />
      </div>
    </article>
  )
}
