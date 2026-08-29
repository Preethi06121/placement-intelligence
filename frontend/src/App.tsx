import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { apiMe } from './api'
import { AssessmentProvider, fetchProgress, STEP_PATHS, useAssessment } from './context/AssessmentContext'
import LoadingState from './components/LoadingState'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ResumeAnalysisPage from './pages/assessment/ResumeAnalysisPage'
import CodingAnalysisPage from './pages/CodingAnalysisPage'
import CSTestPage from './pages/CSTestPage'
import AptitudeTestPage from './pages/AptitudeTestPage'
import FinalAnalysisPage from './pages/assessment/FinalAnalysisPage'
import DashboardPage from './pages/DashboardPage'
import PreviousAttemptsPage from './pages/PreviousAttemptsPage'
import NotFoundPage from './pages/NotFoundPage'

type MeResponse = { authenticated: boolean; user: { id: number; email: string } | null }

function RequireAuth({
  authed,
  children,
}: {
  authed: boolean | null
  children: React.ReactNode
}) {
  if (authed === null) return <LoadingState message="Checking session…" />
  if (!authed) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestOnly({
  authed,
  children,
}: {
  authed: boolean | null
  children: React.ReactNode
}) {
  if (authed === null) return <LoadingState message="Checking session…" />
  if (authed) return <Navigate to="/" replace />
  return <>{children}</>
}

function HomeRedirect({ authed }: { authed: boolean | null }) {
  if (authed === null) return <LoadingState />
  if (!authed) return <Navigate to="/login" replace />
  return <AuthenticatedHomeRedirect />
}

function AuthenticatedHomeRedirect() {
  const [target, setTarget] = useState<string | null>(null)
  const assessment = useAssessment()

  useEffect(() => {
    fetchProgress()
      .then(() => setTarget(STEP_PATHS[assessment.getFirstIncompleteStep()]))
      .catch(() => setTarget('/assessment/resume'))
  }, [assessment])

  if (!target) return <LoadingState />
  return <Navigate to={target} replace />
}

function AppRoutes() {
  const [me, setMe] = useState<MeResponse | null>(null)

  const refreshMe = async () => {
    try {
      const data = await apiMe()
      setMe(data)
    } catch {
      setMe({ authenticated: false, user: null })
    }
  }

  useEffect(() => {
    void Promise.resolve().then(refreshMe)
  }, [])

  const authed = me === null ? null : me.authenticated
  const userEmail = me?.user?.email ?? null
  const onLogout = () => refreshMe()

  const authProps = { userEmail, onLogout }

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect authed={authed} />} />

      <Route
        path="/login"
        element={
          <GuestOnly authed={authed}>
            <LoginPage onLoggedIn={refreshMe} />
          </GuestOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnly authed={authed}>
            <SignupPage onSignedUp={refreshMe} />
          </GuestOnly>
        }
      />

      <Route
        path="/assessment/resume"
        element={
          <RequireAuth authed={authed}>
            <ResumeAnalysisPage {...authProps} />
          </RequireAuth>
        }
      />
      <Route
        path="/assessment/coding"
        element={
          <RequireAuth authed={authed}>
            <CodingAnalysisPage {...authProps} />
          </RequireAuth>
        }
      />
      <Route
        path="/assessment/cs-test"
        element={
          <RequireAuth authed={authed}>
            <CSTestPage {...authProps} />
          </RequireAuth>
        }
      />
      <Route
        path="/assessment/aptitude"
        element={
          <RequireAuth authed={authed}>
            <AptitudeTestPage {...authProps} />
          </RequireAuth>
        }
      />
      <Route
        path="/assessment/final"
        element={
          <RequireAuth authed={authed}>
            <FinalAnalysisPage {...authProps} />
          </RequireAuth>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth authed={authed}>
            <DashboardPage {...authProps} />
          </RequireAuth>
        }
      />
      <Route
        path="/attempts"
        element={
          <RequireAuth authed={authed}>
            <PreviousAttemptsPage {...authProps} />
          </RequireAuth>
        }
      />

      {/* Legacy route redirects */}
      <Route path="/cs-test" element={<Navigate to="/assessment/cs-test" replace />} />
      <Route path="/aptitude-test" element={<Navigate to="/assessment/aptitude" replace />} />
      <Route path="/coding-analysis" element={<Navigate to="/assessment/coding" replace />} />
      <Route path="/full-analysis" element={<Navigate to="/assessment/final" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AssessmentProvider>
        <AppRoutes />
      </AssessmentProvider>
    </BrowserRouter>
  )
}
