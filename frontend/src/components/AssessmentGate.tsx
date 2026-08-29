import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  fetchProgress,
  STEP_PATHS,
  stepIndex,
  useAssessment,
} from '../context/AssessmentContext'
import type { StepKey } from './StepProgress'
import LoadingState from '../components/LoadingState'

type AssessmentGateProps = {
  requiredStep: StepKey
  children: React.ReactNode
}

export default function AssessmentGate({ requiredStep, children }: AssessmentGateProps) {
  const location = useLocation()
  const assessment = useAssessment()
  const [ready, setReady] = useState(false)
  const [redirect, setRedirect] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        await fetchProgress()
        if (cancelled) return
        const first = assessment.getFirstIncompleteStep()
        const requiredIdx = stepIndex(requiredStep)
        const firstIdx = stepIndex(first)

        if (requiredIdx > firstIdx) {
          setRedirect(STEP_PATHS[first])
        } else {
          setReady(true)
        }
      } catch {
        if (!cancelled) setReady(true)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [assessment, requiredStep, location.pathname])

  if (redirect) return <Navigate to={redirect} replace />
  if (!ready) return <LoadingState message="Checking progress…" />
  return <>{children}</>
}
