import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CSSubmitResponse, Question } from '../api'
import AppShell from './AppShell'
import Button from './Button'
import Card from './Card'
import ErrorMessage from './ErrorMessage'
import LoadingState from './LoadingState'
import StepProgress, { type StepKey } from './StepProgress'
import { fetchProgress, useAssessment } from '../context/AssessmentContext'

type AssessmentTestProps = {
  title: string; subtitle: string; current: 'cs-test' | 'aptitude'; nextPath: string; nextLabel: string
  getQuestions: () => Promise<{ questions: Question[] }>
  submitAnswers: (payload: { answers: string[] }) => Promise<CSSubmitResponse>
  userEmail?: string | null; onLogout: () => void
}

export default function AssessmentTest({ title, subtitle, current, nextPath, nextLabel, getQuestions, submitAnswers, userEmail, onLogout }: AssessmentTestProps) {
  const navigate = useNavigate()
  const { getCompletedSteps, markStepComplete } = useAssessment()
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<CSSubmitResponse | null>(null)
  const [completed, setCompleted] = useState<StepKey[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchProgress().then(() => setCompleted(getCompletedSteps())).catch(() => undefined) }, [getCompletedSteps])
  useEffect(() => {
    getQuestions().then((data) => { setQuestions(data.questions); setAnswers(new Array(data.questions.length).fill('')) })
      .catch((reason: Error) => setError(reason.message))
  }, [getQuestions])

  const answeredCount = answers.filter(Boolean).length
  const canSubmit = Boolean(questions?.length) && answeredCount === questions!.length
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true); setError(null)
    try {
      const response = await submitAnswers({ answers })
      setResult(response)
      markStepComplete(current)
      setCompleted((items) => items.includes(current) ? items : [...items, current])
    } catch (reason) { setError((reason as Error).message) } finally { setSubmitting(false) }
  }

  return <AppShell userEmail={userEmail} onLogout={onLogout}>
    <StepProgress current={current} completed={completed} />
    <Card title={title} subtitle={subtitle}>
      {error ? <ErrorMessage message={error} /> : null}
      {!questions ? <LoadingState message="Loading questions…" /> : result ? <div className="test-result">
        <p className="test-result__score">Score: <strong>{result.score.toFixed(1)}%</strong></p>
        <p>Your result is saved for final analysis.</p>
        <Button onClick={() => navigate(nextPath)}>{nextLabel}</Button>
      </div> : <form onSubmit={submit}>
        <p className="test-progress" aria-live="polite">{answeredCount} of {questions.length} answered</p>
        {questions.map((question, index) => <fieldset key={index} className="question-block">
          <legend className="question-block__text">{index + 1}. {question.question}</legend>
          {question.options.map((option) => {
            const selected = answers[index] === option
            return <label key={option} className={`option-label${selected ? ' option-label--selected' : ''}`}>
              <input type="radio" name={`question-${index}`} value={option} checked={selected}
                onChange={() => setAnswers((items) => items.map((answer, i) => i === index ? option : answer))} />
              {option}
            </label>
          })}
        </fieldset>)}
        <Button type="submit" disabled={submitting || !canSubmit}>{submitting ? 'Submitting…' : 'Submit test'}</Button>
      </form>}
    </Card>
  </AppShell>
}
