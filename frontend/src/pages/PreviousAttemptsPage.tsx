import { useEffect, useState } from 'react'
import { apiDashboard, type Attempt } from '../api'
import AppShell from '../components/AppShell'
import Button from '../components/Button'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import PreviousAttemptCard from '../components/PreviousAttemptCard'

type PreviousAttemptsPageProps = {
  userEmail?: string | null
  onLogout: () => void
}

export default function PreviousAttemptsPage({ userEmail, onLogout }: PreviousAttemptsPageProps) {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        setError(null)
        const dash = await apiDashboard()
        setAttempts(dash.attempts)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <AppShell userEmail={userEmail} onLogout={onLogout}>
      <Card
        title="Previous attempts"
        subtitle={`${attempts.length} attempt${attempts.length === 1 ? '' : 's'} on record`}
      >
        {error ? <ErrorMessage message={error} /> : null}

        {loading ? (
          <LoadingState message="Loading attempts…" />
        ) : attempts.length === 0 ? (
          <div className="empty-state">
            <p>No attempts yet.</p>
            <Button to="/assessment/resume">Start assessment</Button>
          </div>
        ) : (
          <div className="attempts-list">
            {attempts.map((attempt) => (
              <PreviousAttemptCard key={attempt.id} attempt={attempt} />
            ))}
          </div>
        )}

        <div className="btn-row">
          <Button variant="secondary" to="/dashboard">
            Back to dashboard
          </Button>
        </div>
      </Card>
    </AppShell>
  )
}
