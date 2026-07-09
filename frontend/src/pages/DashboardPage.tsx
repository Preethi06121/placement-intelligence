import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Chart from 'chart.js/auto'
import { apiDashboard, apiProgress, type Attempt } from '../api'

function badgeColor(readiness: string) {
  if (readiness === 'READY') return 'green'
  if (readiness === 'ALMOST_READY') return 'orange'
  return 'red'
}

export default function DashboardPage({
  apiLogout,
  onNeedAuthRefresh,
}: {
  apiLogout: () => Promise<{ ok: boolean }>
  onNeedAuthRefresh: () => void
}) {
  const [dashboard, setDashboard] = useState<{
    attempts: Attempt[]
    latest: Attempt | null
  } | null>(null)
  const [progress, setProgress] = useState<{
    cs_score: number | null
    coding_score: number | null
    aptitude_score: number | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setError(null)
        const [dash, prog] = await Promise.all([apiDashboard(), apiProgress()])
        setDashboard(dash)
        setProgress(prog)
      } catch (e) {
        setError((e as Error).message)
      }
    }
    run()
  }, [])

  const latest = dashboard?.latest ?? null

  const radarData = useMemo(() => {
    if (!latest) return null
    return {
      labels: ['Resume', 'Coding', 'CS', 'Aptitude'],
      data: [latest.resume_score ?? 0, latest.coding_score ?? 0, latest.cs_score ?? 0, latest.aptitude_score ?? 0],
    }
  }, [latest])

  useEffect(() => {
    const canvas = document.getElementById('performanceChart') as HTMLCanvasElement | null
    if (!canvas) return

    if (!radarData) {
      if (chartRef.current) chartRef.current.destroy()
      chartRef.current = null
      return
    }

    // Recreate chart for simplicity.
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: radarData.labels,
        datasets: [
          {
            label: 'Latest Attempt',
            data: radarData.data,
            fill: true,
          },
        ],
      },
      options: {
        scales: {
          r: { min: 0, max: 100 },
        },
      },
    })
  }, [radarData])

  const onLogout = async () => {
    await apiLogout()
    onNeedAuthRefresh()
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: 24, textAlign: 'left', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Placement Intelligence</h2>
        <button onClick={onLogout}>Logout</button>
      </div>

      <hr />

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      <h3>Progress</h3>
      <p>
        CS: <b>{progress?.cs_score ?? 'Not Taken'}</b> | Coding: <b>{progress?.coding_score ?? 'Not Calculated'}</b> | Aptitude:{' '}
        <b>{progress?.aptitude_score ?? 'Not Taken'}</b>
      </p>

      <h3>Start</h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link to="/cs-test">Take CS Test</Link>
        <Link to="/aptitude-test">Take Aptitude Test</Link>
        <Link to="/coding-analysis">Analyze Coding Profile</Link>
        <Link to="/full-analysis">Upload Resume + Job Description</Link>
      </div>

      <hr />

      <h3>Your Previous Attempts</h3>
      {dashboard?.attempts?.length ? (
        <ul style={{ paddingLeft: 18 }}>
          {dashboard.attempts.map((a) => (
            <li key={a.id} style={{ marginBottom: 12 }}>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  color: 'white',
                  backgroundColor: badgeColor(a.readiness_label),
                  display: 'inline-block',
                  marginRight: 12,
                }}
              >
                {a.readiness_label}
              </span>
              <div>Overall: {a.overall_score?.toFixed(2)}</div>
              <div>
                Resume: {a.resume_score?.toFixed(2)} | Coding: {a.coding_score?.toFixed(2)} | CS: {a.cs_score?.toFixed(2)} | Aptitude:{' '}
                {a.aptitude_score?.toFixed(2)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No attempts yet. Do a full analysis to generate your chart.</p>
      )}

      <hr />

      <h3>Performance Overview (Latest Attempt)</h3>
      {latest ? (
        <>
          <canvas id="performanceChart" width="520" height="520"></canvas>
        </>
      ) : (
        <p>Run a full analysis to generate the radar chart.</p>
      )}
    </div>
  )
}

