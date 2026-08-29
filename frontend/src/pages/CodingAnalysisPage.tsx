import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCodingAnalysis, type ApiError, type CodingAnalysisResponse } from '../api'
import AppShell from '../components/AppShell'
import AssessmentGate from '../components/AssessmentGate'
import Button from '../components/Button'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import ScoreCard from '../components/ScoreCard'
import StepProgress from '../components/StepProgress'
import { fetchProgress, useAssessment } from '../context/AssessmentContext'

type CodingAnalysisPageProps = {
  userEmail?: string | null
  onLogout: () => void
}

function CodingAnalysisContent({ userEmail, onLogout }: CodingAnalysisPageProps) {
  const navigate = useNavigate()
  const { setCodingFeedback, skipCodingAnalysis, codingUnavailable, getCompletedSteps } = useAssessment()
  const [leetcodeUrl, setLeetcodeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [result, setResult] = useState<CodingAnalysisResponse | null>(null)
  const [platformUnavailable, setPlatformUnavailable] = useState(false)
  const [completed, setCompleted] = useState<ReturnType<typeof getCompletedSteps>>([])

  useEffect(() => {
    fetchProgress().then((p) => {
      setCompleted(getCompletedSteps())
      if (!codingUnavailable && p.coding_score != null) setScore(p.coding_score)
    })
  }, [codingUnavailable, getCompletedSteps])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPlatformUnavailable(false)
    setLoading(true)
    try {
      const res = await apiCodingAnalysis({ leetcode_url: leetcodeUrl })
      setScore(res.score)
      setResult(res)
      setCodingFeedback(res.feedback)
      setCompleted((prev) => (prev.includes('coding') ? prev : [...prev, 'coding']))
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message)
      setPlatformUnavailable(apiError.code === 'CODING_PLATFORM_UNAVAILABLE')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell userEmail={userEmail} onLogout={onLogout}>
      <StepProgress current="coding" completed={completed} />
      <Card
        title="Coding profile analysis"
        subtitle="Paste your LeetCode profile URL. Your coding score will be saved for the final analysis."
      >
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="leetcode">LeetCode profile URL</label>
            <input
              id="leetcode"
              className="input"
              type="url"
              placeholder="https://leetcode.com/u/your-username/"
              value={leetcodeUrl}
              onChange={(e) => setLeetcodeUrl(e.target.value)}
              required
            />
          </div>
          {error ? <ErrorMessage message={error} /> : null}
          <Button type="submit" disabled={loading}>
            {loading ? 'Analyzing…' : 'Analyze profile'}
          </Button>
        </form>

        {platformUnavailable ? (
          <div className="analysis-summary">
            <p>The coding platform is temporarily unavailable. You can continue the assessment without coding analysis for now.</p>
            <Button onClick={() => {
              skipCodingAnalysis()
              setCompleted((prev) => (prev.includes('coding') ? prev : [...prev, 'coding']))
              navigate('/assessment/cs-test')
            }}>
              Continue without coding analysis
            </Button>
          </div>
        ) : null}

        {score != null ? (
          <div className="analysis-summary">
            <ScoreCard label="Coding score" value={score} />
            {result ? (
              <>
                <p><strong>Solved:</strong> {result.total_stats.total} · Easy {result.total_stats.easy} · Medium {result.total_stats.medium} · Hard {result.total_stats.hard}</p>
                <p><strong>Readiness:</strong> {result.feedback.readiness}</p>
                <AnalysisList title="Strengths" items={result.feedback.strengths} />
                <AnalysisList title="Developing areas" items={result.feedback.moderate} />
                <AnalysisList title="Focus areas" items={result.feedback.weaknesses} />
                <AnalysisList title="Recommendations" items={result.feedback.recommendations} />
                <AnalysisList title="Suggestions" items={result.feedback.suggestions} />
              </>
            ) : null}
            <div className="btn-row">
              <Button to="/assessment/cs-test">Continue to CS Test</Button>
            </div>
          </div>
        ) : null}
      </Card>
    </AppShell>
  )
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="analysis-list">
      <strong>{title}</strong>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  )
}

export default function CodingAnalysisPage(props: CodingAnalysisPageProps) {
  return (
    <AssessmentGate requiredStep="coding">
      <CodingAnalysisContent {...props} />
    </AssessmentGate>
  )
}
