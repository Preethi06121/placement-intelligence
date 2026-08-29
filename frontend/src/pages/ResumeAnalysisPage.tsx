import { useEffect, useState } from 'react'
import { apiResumeUpload } from '../api'
import AppShell from '../components/AppShell'
import AssessmentGate from '../components/AssessmentGate'
import Button from '../components/Button'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import ScoreCard from '../components/ScoreCard'
import StepProgress from '../components/StepProgress'
import { fetchProgress, useAssessment } from '../context/AssessmentContext'

type ResumeAnalysisPageProps = {
  userEmail?: string | null
  onLogout: () => void
}

function ResumeAnalysisContent({ userEmail, onLogout }: ResumeAnalysisPageProps) {
  const { setResumeResult, resumeComplete, resumeScore, resumeAnalysis, getCompletedSteps } = useAssessment()
  const [jobDescription, setJobDescription] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState<ReturnType<typeof getCompletedSteps>>([])

  useEffect(() => {
    fetchProgress().then(() => setCompleted(getCompletedSteps()))
  }, [getCompletedSteps])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!resumeFile) {
      setError('Please choose a PDF resume.')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('resume', resumeFile)
      fd.append('job_description', jobDescription)
      const res = await apiResumeUpload(fd)
      setResumeResult(resumeFile, jobDescription, res.analysis)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell userEmail={userEmail} onLogout={onLogout}>
      <StepProgress current="resume" completed={completed} />
      <Card
        title="Resume analysis"
        subtitle="Upload your resume to get an initial score. You can optionally add a job description for better skill matching."
      >
        {resumeComplete && resumeScore != null ? (
          <>
            <p>Resume step completed. Score: <strong>{resumeScore.toFixed(1)}</strong></p>
            <div className="score-grid">
              <ScoreCard label="Resume score" value={resumeScore} />
              <ScoreCard label="Skill match" value={resumeAnalysis?.skill_score ?? null} />
              <ScoreCard label="Resume strength" value={resumeAnalysis?.strength_score ?? null} />
            </div>
            <div className="btn-row">
              <Button to="/assessment/coding">Continue to Coding</Button>
            </div>
            {resumeAnalysis ? (
              <div className="analysis-summary">
                <p><strong>Skills matched:</strong> {resumeAnalysis.skills_matched?.join(', ') || 'None detected'}</p>
                <p><strong>Skills requested:</strong> {resumeAnalysis.skills_required?.join(', ') || 'No job-specific skills supplied'}</p>
              </div>
            ) : null}
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="jd">
                Job description <span className="field-hint">(optional)</span>
              </label>
              <textarea
                id="jd"
                className="textarea"
                placeholder="Paste a job description if you have one…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="resume">Resume (PDF)</label>
              <input
                id="resume"
                className="input"
                type="file"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            {error ? <ErrorMessage message={error} /> : null}
            <Button type="submit" disabled={loading}>
              {loading ? 'Analyzing…' : 'Analyze resume'}
            </Button>
          </form>
        )}
      </Card>
    </AppShell>
  )
}

export default function ResumeAnalysisPage(props: ResumeAnalysisPageProps) {
  return (
    <AssessmentGate requiredStep="resume">
      <ResumeAnalysisContent {...props} />
    </AssessmentGate>
  )
}
