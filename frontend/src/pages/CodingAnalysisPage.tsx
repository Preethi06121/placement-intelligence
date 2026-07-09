import { useState } from 'react'
import { apiCodingAnalysis, type CodingAnalysisResponse } from '../api'

export default function CodingAnalysisPage() {
  const [leetcodeUrl, setLeetcodeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CodingAnalysisResponse | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const res = await apiCodingAnalysis({ leetcode_url: leetcodeUrl })
      setResult(res)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, textAlign: 'left', maxWidth: 980, margin: '0 auto' }}>
      <h2>Analyze LeetCode Profile</h2>

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      <form onSubmit={onSubmit}>
        <input
          style={{ width: 520, padding: 10 }}
          type="text"
          placeholder="Paste LeetCode profile URL"
          value={leetcodeUrl}
          onChange={(e) => setLeetcodeUrl(e.target.value)}
          required
        />
        <div>
          <button style={{ marginTop: 16 }} type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>

      {result ? (
        <div style={{ marginTop: 24 }}>
          <h3>Final Coding Score: {result.score}%</h3>
          <p>
            Total Solved: <b>{result.total_stats.total}</b> | Easy: <b>{result.total_stats.easy}</b> | Medium:{' '}
            <b>{result.total_stats.medium}</b> | Hard: <b>{result.total_stats.hard}</b>
          </p>

          <hr />
          <h4>Topic Distribution (Recent Problems)</h4>
          <ul>
            {Object.entries(result.topic_count).map(([topic, count]) => (
              <li key={topic}>
                {topic}: {count}
              </li>
            ))}
          </ul>

          <hr />
          <h4>Recommended Focus Areas</h4>
          {result.feedback.recommendations.length ? (
            <ul>
              {result.feedback.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p>No specific recommendations right now.</p>
          )}

          <h4 style={{ marginTop: 16 }}>Suggestions</h4>
          <ul>
            {result.feedback.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

