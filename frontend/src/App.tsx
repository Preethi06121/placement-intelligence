import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { apiLogin, apiLogout, apiMe, apiSignup } from './api'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CSTestPage from './pages/CSTestPage'
import AptitudeTestPage from './pages/AptitudeTestPage'
import CodingAnalysisPage from './pages/CodingAnalysisPage'
import FullAnalysisPage from './pages/FullAnalysisPage'
import NotFoundPage from './pages/NotFoundPage'

type MeResponse = { authenticated: boolean; user: { id: number; email: string } | null }

function RequireAuth({
  authed,
  children,
}: {
  authed: boolean | null
  children: React.ReactNode
}) {
  if (authed === null) return <div style={{ padding: 24 }}>Loading...</div>
  if (!authed) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
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
    refreshMe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/login"
          element={
            <LoginPage
              apiLogin={apiLogin}
              onLoggedIn={() => {
                refreshMe()
              }}
            />
          }
        />

        <Route
          path="/signup"
          element={<SignupPage apiSignup={apiSignup} onSignedUp={() => refreshMe()} />}
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth authed={me?.authenticated ?? null}>
              <DashboardPage
                apiLogout={() => apiLogout()}
                onNeedAuthRefresh={() => refreshMe()}
              />
            </RequireAuth>
          }
        />

        <Route
          path="/cs-test"
          element={
            <RequireAuth authed={me?.authenticated ?? null}>
              <CSTestPage />
            </RequireAuth>
          }
        />

        <Route
          path="/aptitude-test"
          element={
            <RequireAuth authed={me?.authenticated ?? null}>
              <AptitudeTestPage />
            </RequireAuth>
          }
        />

        <Route
          path="/coding-analysis"
          element={
            <RequireAuth authed={me?.authenticated ?? null}>
              <CodingAnalysisPage />
            </RequireAuth>
          }
        />

        <Route
          path="/full-analysis"
          element={
            <RequireAuth authed={me?.authenticated ?? null}>
              <FullAnalysisPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
