import Button from '../components/Button'
import Card from '../components/Card'

export default function NotFoundPage() {
  return (
    <div className="app-main app-main--center">
      <div className="auth-page">
        <Card title="Page not found">
          <p className="clay-card__subtitle">The page you requested does not exist.</p>
          <Button to="/dashboard">Go to dashboard</Button>
        </Card>
      </div>
    </div>
  )
}
