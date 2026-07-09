import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SignupPage({
  apiSignup,
  onSignedUp,
}: {
  apiSignup: (payload: { email: string; password: string }) => Promise<{ ok: boolean }>
  onSignedUp: () => void
}) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiSignup({ email, password })
      onSignedUp()
      navigate('/login')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Signup</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginTop: 12 }}>
          <input
            style={{ width: 320, padding: 10 }}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <input
            style={{ width: 320, padding: 10 }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p style={{ color: 'red' }}>{error}</p> : null}
        <button style={{ marginTop: 16 }} type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Signup'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Already have an account?{' '}
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault()
            navigate('/login')
          }}
        >
          Login
        </a>
      </p>
    </div>
  )
}

