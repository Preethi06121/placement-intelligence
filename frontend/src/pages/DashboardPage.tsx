import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chart from 'chart.js/auto'
import { apiDashboard, type Attempt } from '../api'
import AppShell from '../components/AppShell'
import Button from '../components/Button'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import ScoreCard from '../components/ScoreCard'
import StatusBadge from '../components/StatusBadge'
import { useAssessment } from '../context/AssessmentContext'

type DashboardPageProps = {
  userEmail?: string | null
  onLogout: () => void
}

function buildFallbackTips(latest: Attempt): string[] {
  const scores = [
    { label: 'Resume', value: latest.resume_score },
    { label: 'Coding', value: latest.coding_score },
    { label: 'CS', value: latest.cs_score },
    { label: 'Aptitude', value: latest.aptitude_score },
  ]
  const weakest = [...scores].sort((a, b) => a.value - b.value)[0]
  return [`Focus on improving your ${weakest.label} score (${weakest.value.toFixed(1)}).`]
}

export default function DashboardPage({ userEmail, onLogout }: DashboardPageProps) {
  const navigate = useNavigate()
  const { improveTips, resetAssessment } = useAssessment()
  const [latest, setLatest] = useState<Attempt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const chartRef = useRef<Chart | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setError(null)
        const dash = await apiDashboard()
        setLatest(dash.latest)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !latest) {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
      return
    }

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Resume', 'Coding', 'CS', 'Aptitude'],
        datasets: [
          {
            label: 'Score',
            data: [
              latest.resume_score,
              latest.coding_score,
              latest.cs_score,
              latest.aptitude_score,
            ],
            backgroundColor: [
              'rgba(124, 108, 240, 0.7)',
              'rgba(91, 159, 212, 0.7)',
              'rgba(168, 180, 245, 0.85)',
              'rgba(124, 108, 240, 0.45)',
            ],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(124, 108, 240, 0.08)' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [latest])

  const tips = improveTips.length ? improveTips : latest ? buildFallbackTips(latest) : []

  const onNewAssessment = () => {
    resetAssessment()
    navigate('/assessment/resume')
  }

  if (loading) {
    return (
      <AppShell userEmail={userEmail} onLogout={onLogout}>
        <LoadingState message="Loading dashboard…" />
      </AppShell>
    )
  }

  if (!latest) {
    return (
      <AppShell userEmail={userEmail} onLogout={onLogout}>
        <Card title="No results yet">
          <p className="clay-card__subtitle">
            Complete the assessment flow to see your placement readiness.
          </p>
          {error ? <ErrorMessage message={error} /> : null}
          <Button onClick={onNewAssessment}>Start assessment</Button>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell userEmail={userEmail} onLogout={onLogout}>
      {error ? <ErrorMessage message={error} /> : null}

      <div className="dashboard-welcome">
        <p className="eyebrow">Placement readiness</p>
        <h1>Welcome back{userEmail ? `, ${userEmail}` : ''}</h1>
        <p>Review your latest preparation results and choose your next step.</p>
      </div>

      <Card title="Overall placement readiness">
        <div className="dashboard-hero">
          <StatusBadge label={latest.readiness_label} />
          <div className="dashboard-hero__score">{latest.overall_score.toFixed(1)}</div>
        </div>
      </Card>

      <Card title="Your scores">
        <div className="score-grid">
          <ScoreCard label="Resume" value={latest.resume_score} />
          <ScoreCard label="Coding" value={latest.coding_score} />
          <ScoreCard label="CS" value={latest.cs_score} />
          <ScoreCard label="Aptitude" value={latest.aptitude_score} />
        </div>
      </Card>

      <Card title="What to improve">
        <ul className="improve-list">
          {tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </Card>

      <Card title="Performance overview">
        <div className="chart-wrap">
          <canvas ref={canvasRef} />
        </div>
      </Card>

      <div className="btn-row">
        <Button variant="secondary" to="/attempts">
          View previous attempts
        </Button>
        <Button variant="secondary" onClick={onNewAssessment}>
          Start new assessment
        </Button>
      </div>
    </AppShell>
  )
}
