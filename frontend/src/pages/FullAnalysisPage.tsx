import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFullAnalysis } from '../api'

export default function FullAnalysisPage() {
  const navigate = useNavigate()
  const [jobDescription, setJobDescription] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [attemptId, setAttemptId] = useState<number | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setAttemptId(null)

    try {
      if (!resumeFile) throw new Error('Resume PDF is required')
      if (!jobDescription.trim()) throw new Error('Job description is required')

      const formData = new FormData()
      formData.append('job_description', jobDescription)
      formData.append('resume', resumeFile)

      const res = await apiFullAnalysis(formData)
      setAttemptId(res.attempt.id)
      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, textAlign: 'left', maxWidth: 980, margin: '0 auto' }}>
      <h2>Full Analysis</h2>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      <form onSubmit={onSubmit}>
        <div>
          <label>Paste Job Description</label>
          <textarea
            style={{ width: '100%', height: 160, marginTop: 8, padding: 10 }}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Upload Resume (PDF)</label>
          <input
            style={{ display: 'block', marginTop: 8 }}
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setResumeFile(f)
            }}
            required
          />
        </div>

        <button style={{ marginTop: 16 }} type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {attemptId ? <p style={{ marginTop: 16 }}>Saved attempt #{attemptId}</p> : null}
    </div>
  )
}

