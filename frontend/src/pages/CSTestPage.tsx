import { useEffect, useState } from 'react'
import { apiGetCsTest, apiSubmitCsTest, type CSSubmitResponse, type Question } from '../api'

export default function CSTestPage() {
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CSSubmitResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setError(null)
        const data = await apiGetCsTest()
        setQuestions(data.questions)
        setAnswers(new Array(data.questions.length).fill(''))
        setResult(null)
      } catch (e) {
        setError((e as Error).message)
      }
    }
    run()
  }, [])

  const canSubmit = questions && answers.every((a) => a)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questions || !canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiSubmitCsTest({ answers })
      setResult(res)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: 24, textAlign: 'left', maxWidth: 980, margin: '0 auto' }}>
      <h2>CS Knowledge Test</h2>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      {!questions ? (
        <p>Loading questions...</p>
      ) : (
        <form onSubmit={onSubmit}>
          {questions.map((q, idx) => (
            <div key={idx} style={{ marginBottom: 18 }}>
              <p style={{ fontWeight: 700 }}>
                {idx + 1}. {q.question}
              </p>
              {q.options.map((opt) => (
                <label key={opt} style={{ display: 'block', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`q-${idx}`}
                    value={opt}
                    checked={answers[idx] === opt}
                    required
                    onChange={() => {
                      setAnswers((prev) => {
                        const next = [...prev]
                        next[idx] = opt
                        return next
                      })
                    }}
                  />{' '}
                  {opt}
                </label>
              ))}
            </div>
          ))}

          <button type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </form>
      )}

      {result ? (
        <div style={{ marginTop: 24 }}>
          <h3>Your Score: {result.score}%</h3>
          <hr />
          <h4>Detailed Review</h4>
          <ul style={{ paddingLeft: 18 }}>
            {result.results.map((item, i) => (
              <li key={i} style={{ marginBottom: 18 }}>
                <div>
                  <b>Question:</b> {item.question}
                </div>
                <div>
                  <b>Your Answer:</b> {item.selected}
                </div>
                <div>
                  <b>Correct Answer:</b> {item.correct}
                </div>
                <div style={{ color: item.is_correct ? 'green' : 'red' }}>
                  {item.is_correct ? 'Correct' : 'Incorrect'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

