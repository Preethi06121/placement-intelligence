/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiProgress, type CodingAnalysisResponse } from '../api'
import type { StepKey } from '../components/StepProgress'

export type ResumeAnalysis = {
  resume_score: number
  semantic_score?: number
  skill_score?: number
  strength_score?: number
  skills_required?: string[]
  skills_matched?: string[]
}

type AssessmentContextValue = {
  resumeComplete: boolean
  codingComplete: boolean
  codingUnavailable: boolean
  csComplete: boolean
  aptitudeComplete: boolean
  resumeScore: number | null
  resumeFile: File | null
  jobDescription: string
  resumeAnalysis: ResumeAnalysis | null
  codingFeedback: CodingAnalysisResponse['feedback'] | null
  improveTips: string[]
  setResumeResult: (file: File, jd: string, analysis: ResumeAnalysis) => void
  setCodingFeedback: (feedback: CodingAnalysisResponse['feedback']) => void
  skipCodingAnalysis: () => void
  markStepComplete: (step: 'cs-test' | 'aptitude') => void
  setImproveTips: (tips: string[]) => void
  resetAssessment: () => void
  getCompletedSteps: () => StepKey[]
  getFirstIncompleteStep: () => StepKey
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null)

const STORAGE_KEY = 'pi_assessment_meta'

function loadMeta() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as {
      resumeComplete: boolean
      codingComplete: boolean
      codingUnavailable: boolean
      csComplete: boolean
      aptitudeComplete: boolean
      resumeScore: number | null
      jobDescription: string
      resumeAnalysis: ResumeAnalysis | null
      improveTips: string[]
    }
  } catch {
    return null
  }
}

function saveMeta(data: {
  resumeComplete: boolean
  codingComplete: boolean
  codingUnavailable: boolean
  csComplete: boolean
  aptitudeComplete: boolean
  resumeScore: number | null
  jobDescription: string
  resumeAnalysis: ResumeAnalysis | null
  improveTips: string[]
}) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const meta = loadMeta()
  const [resumeComplete, setResumeComplete] = useState(meta?.resumeComplete ?? false)
  const [codingComplete, setCodingComplete] = useState(meta?.codingComplete ?? false)
  const [codingUnavailable, setCodingUnavailable] = useState(meta?.codingUnavailable ?? false)
  const [csComplete, setCsComplete] = useState(meta?.csComplete ?? false)
  const [aptitudeComplete, setAptitudeComplete] = useState(meta?.aptitudeComplete ?? false)
  const [resumeScore, setResumeScore] = useState<number | null>(meta?.resumeScore ?? null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState(meta?.jobDescription ?? '')
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(meta?.resumeAnalysis ?? null)
  const [codingFeedback, setCodingFeedbackState] = useState<CodingAnalysisResponse['feedback'] | null>(null)
  const [improveTips, setImproveTipsState] = useState<string[]>(meta?.improveTips ?? [])

  const persist = useCallback(
    (patch: Partial<{
      resumeComplete: boolean
      codingComplete: boolean
      codingUnavailable: boolean
      csComplete: boolean
      aptitudeComplete: boolean
      resumeScore: number | null
      jobDescription: string
      resumeAnalysis: ResumeAnalysis | null
      improveTips: string[]
    }>) => {
      saveMeta({
        resumeComplete: patch.resumeComplete ?? resumeComplete,
        codingComplete: patch.codingComplete ?? codingComplete,
        codingUnavailable: patch.codingUnavailable ?? codingUnavailable,
        csComplete: patch.csComplete ?? csComplete,
        aptitudeComplete: patch.aptitudeComplete ?? aptitudeComplete,
        resumeScore: patch.resumeScore ?? resumeScore,
        jobDescription: patch.jobDescription ?? jobDescription,
        resumeAnalysis: patch.resumeAnalysis ?? resumeAnalysis,
        improveTips: patch.improveTips ?? improveTips,
      })
    },
    [resumeComplete, codingComplete, codingUnavailable, csComplete, aptitudeComplete, resumeScore, jobDescription, resumeAnalysis, improveTips],
  )

  const setResumeResult = useCallback(
    (file: File, jd: string, analysis: ResumeAnalysis) => {
      setResumeFile(file)
      setJobDescription(jd)
      setResumeScore(analysis.resume_score)
      setResumeAnalysis(analysis)
      setResumeComplete(true)
      persist({
        resumeComplete: true,
        resumeScore: analysis.resume_score,
        jobDescription: jd,
        resumeAnalysis: analysis,
      })
    },
    [persist],
  )

  const setCodingFeedback = useCallback((feedback: CodingAnalysisResponse['feedback']) => {
    setCodingFeedbackState(feedback)
    setCodingComplete(true)
    setCodingUnavailable(false)
    persist({ codingComplete: true, codingUnavailable: false })
  }, [persist])

  const skipCodingAnalysis = useCallback(() => {
    setCodingFeedbackState(null)
    setCodingComplete(true)
    setCodingUnavailable(true)
    persist({ codingComplete: true, codingUnavailable: true })
  }, [persist])

  const markStepComplete = useCallback((step: 'cs-test' | 'aptitude') => {
    if (step === 'cs-test') {
      setCsComplete(true)
      persist({ csComplete: true })
    } else {
      setAptitudeComplete(true)
      persist({ aptitudeComplete: true })
    }
  }, [persist])

  const setImproveTips = useCallback(
    (tips: string[]) => {
      setImproveTipsState(tips)
      persist({ improveTips: tips })
    },
    [persist],
  )

  const resetAssessment = useCallback(() => {
    setResumeComplete(false)
    setCodingComplete(false)
    setCodingUnavailable(false)
    setCsComplete(false)
    setAptitudeComplete(false)
    setResumeScore(null)
    setResumeFile(null)
    setJobDescription('')
    setResumeAnalysis(null)
    setCodingFeedbackState(null)
    setImproveTipsState([])
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const getCompletedSteps = useCallback(
    (): StepKey[] => {
      const done: StepKey[] = []
      if (resumeComplete) done.push('resume')
      if (codingComplete) done.push('coding')
      if (csComplete) done.push('cs-test')
      if (aptitudeComplete) done.push('aptitude')
      return done
    },
    [resumeComplete, codingComplete, csComplete, aptitudeComplete],
  )

  const getFirstIncompleteStep = useCallback(
    (): StepKey => {
      if (!resumeComplete) return 'resume'
      if (!codingComplete) return 'coding'
      if (!csComplete) return 'cs-test'
      if (!aptitudeComplete) return 'aptitude'
      return 'final'
    },
    [resumeComplete, codingComplete, csComplete, aptitudeComplete],
  )

  const value = useMemo(
    () => ({
      resumeComplete,
      codingComplete,
      codingUnavailable,
      csComplete,
      aptitudeComplete,
      resumeScore,
      resumeFile,
      jobDescription,
      resumeAnalysis,
      codingFeedback,
      improveTips,
      setResumeResult,
      setCodingFeedback,
      skipCodingAnalysis,
      markStepComplete,
      setImproveTips,
      resetAssessment,
      getCompletedSteps,
      getFirstIncompleteStep,
    }),
    [
      resumeComplete,
      codingComplete,
      codingUnavailable,
      csComplete,
      aptitudeComplete,
      resumeScore,
      resumeFile,
      jobDescription,
      resumeAnalysis,
      codingFeedback,
      improveTips,
      setResumeResult,
      setCodingFeedback,
      skipCodingAnalysis,
      markStepComplete,
      setImproveTips,
      resetAssessment,
      getCompletedSteps,
      getFirstIncompleteStep,
    ],
  )

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider')
  return ctx
}

export async function fetchProgress() {
  return apiProgress()
}

export const STEP_PATHS: Record<StepKey, string> = {
  resume: '/assessment/resume',
  coding: '/assessment/coding',
  'cs-test': '/assessment/cs-test',
  aptitude: '/assessment/aptitude',
  final: '/assessment/final',
}

export const STEP_ORDER: StepKey[] = ['resume', 'coding', 'cs-test', 'aptitude', 'final']

export function stepIndex(step: StepKey) {
  return STEP_ORDER.indexOf(step)
}
