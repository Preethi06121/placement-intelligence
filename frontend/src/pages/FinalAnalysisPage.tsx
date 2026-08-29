import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFullAnalysis } from '../api'
import AppShell from '../components/AppShell'
import AssessmentGate from '../components/AssessmentGate'
import Button from '../components/Button'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import ScoreCard from '../components/ScoreCard'
import StepProgress from '../components/StepProgress'
import { fetchProgress, useAssessment } from '../context/AssessmentContext'

type FinalAnalysisPageProps = {
  userEmail?: string | null
  onLogout: () => void
}

function buildImproveTips(
  attempt: {
    resume_score: number
    coding_score: number
    cs_score: number
    aptitude_score: number
  },
  resumeAnalysis: {
    skills_required?: string[]
    skills_matched?: string[]
  } | null,
  codingFeedback: {
    recommendations: string[]
    suggestions: string[]
    weaknesses: string[]
  } | null,
): string[] {
  const tips: string[] = []
  const scores = [
    { label: 'Resume', value: attempt.resume_score },
    { label: 'Coding', value: attempt.coding_score },
    { label: 'CS', value: attempt.cs_score },
    { label: 'Aptitude', value: attempt.aptitude_score },
  ]
  const weakest = [...scores].sort((a, b) => a.value - b.value)[0]
  tips.push(`Focus on improving your ${weakest.label} score (${weakest.value.toFixed(1)}).`)

  if (resumeAnalysis?.skills_required && resumeAnalysis.skills_matched) {
    const missing = resumeAnalysis.skills_required.filter(
      (s) => !resumeAnalysis.skills_matched!.includes(s),
    )
    if (missing.length) {
      tips.push(`Add these skills to your resume: ${missing.slice(0, 5).join(', ')}.`)
    }
  }

  codingFeedback?.recommendations.slice(0, 2).forEach((r) => tips.push(r))
  codingFeedback?.suggestions.slice(0, 1).forEach((s) => tips.push(s))

  return tips.slice(0, 6)
}

function FinalAnalysisContent({ userEmail, onLogout }: FinalAnalysisPageProps) {
  const navigate = useNavigate()
  const {
    resumeFile,
    jobDescription,
    resumeScore,
    codingFeedback,
    setImproveTips,
    getCompletedSteps,
  } = useAssessment()
  const [fallbackFile, setFallbackFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState<ReturnType<typeof getCompletedSteps>>([])

  useEffect(() => {
    fetchProgress().then(() => setCompleted(getCompletedSteps()))
  }, [getCompletedSteps])

  const fileToUse = resumeFile ?? fallbackFile

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!fileToUse) {
      setError('Resume PDF is required. Please re-upload if you refreshed the page.')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('job_description', jobDescription)
      formData.append('resume', fileToUse)

      const res = await apiFullAnalysis(formData)
      const tips = buildImproveTips(res.attempt, res.resume_analysis, codingFeedback)
      setImproveTips(tips)
      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell userEmail={userEmail} onLogout={onLogout}>
      <StepProgress current="final" completed={completed} />
      <Card
        title="Final analysis"
        subtitle="Combine your resume with session scores from coding, CS, and aptitude tests."
      >
        <div className="score-grid">
          <ScoreCard label="Resume (preview)" value={resumeScore} />
        </div>

        {!resumeFile ? (
          <div className="field field--spaced">
            <label htmlFor="resume-fallback">Re-upload resume (PDF)</label>
            <p className="field-hint">
              Your resume file was lost after a page refresh. Please upload it again.
            </p>
            <input
              id="resume-fallback"
              className="input"
              type="file"
              accept=".pdf"
              onChange={(e) => setFallbackFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
        ) : null}

        {error ? <ErrorMessage message={error} /> : null}

        <form onSubmit={onSubmit}>
          <div className="btn-row">
            <Button type="submit" disabled={loading || !fileToUse}>
              {loading ? 'Running analysis…' : 'Run final analysis'}
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  )
}

export default function FinalAnalysisPage(props: FinalAnalysisPageProps) {
  return (
    <AssessmentGate requiredStep="final">
      <FinalAnalysisContent {...props} />
    </AssessmentGate>
  )
}
