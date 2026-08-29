export type MeResponse = {
  authenticated: boolean
  user: { id: number; email: string } | null
}

const TOKEN_KEY = 'placement_access_token'

export type Attempt = {
  id: number
  user_id: number
  resume_score: number
  coding_score: number
  cs_score: number
  aptitude_score: number
  overall_score: number
  readiness_label: string
  cluster_label: string
  created_at: string | null
}

export type DashboardResponse = {
  attempts: Attempt[]
  latest: Attempt | null
}

export type Question = { question: string; options: string[] }

export type CSSubmitResponse = {
  score: number
  results: Array<{
    question: string
    selected: string
    correct: string
    is_correct: boolean
  }>
}

export type ResumeUploadResponse = {
  resume_score: number
  skills_found: string[]
  analysis: {
    resume_score: number
    semantic_score: number
    skill_score: number
    strength_score: number
    skills_required: string[]
    skills_matched: string[]
  }
}

export type CodingAnalysisResponse = {
  total_stats: { easy: number; medium: number; hard: number; total: number }
  topic_count: Record<string, number>
  score: number
  feedback: {
    strengths: string[]
    moderate: string[]
    weaknesses: string[]
    recommendations: string[]
    suggestions: string[]
    readiness: string
  }
}

type ErrorResponse = {
  error?: string | { code?: string; message?: string }
  message?: string
}

export type ApiError = Error & { code?: string }

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  })

  const text = await res.text()
  const json = text ? safeJsonParse(text) : null

  if (!res.ok) {
    const errorJson = isErrorResponse(json) ? json : undefined
    const errorValue = errorJson?.error
    const message =
      (typeof errorValue === 'string' ? errorValue : errorValue?.message) ||
      errorJson?.message ||
      `Request failed (${res.status})`
    const error = new Error(message) as ApiError
    if (typeof errorValue === 'object' && errorValue?.code) error.code = errorValue.code
    throw error
  }

  return json as T
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return typeof value === 'object' && value !== null
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function apiMe() {
  return apiFetch<MeResponse>('/api/me')
}

export function apiLogout() {
  return apiFetch<{ ok: boolean }>('/api/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }).finally(() => localStorage.removeItem(TOKEN_KEY))
}

export function apiSignup(payload: { email: string; password: string }) {
  return apiFetch<{ ok: boolean; access_token: string; user: { id: number; email: string } }>('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((result) => { localStorage.setItem(TOKEN_KEY, result.access_token); return result })
}

export function apiLogin(payload: { email: string; password: string }) {
  return apiFetch<{ ok: boolean; access_token: string; user: { id: number; email: string } }>(
    '/api/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  ).then((result) => { localStorage.setItem(TOKEN_KEY, result.access_token); return result })
}

export function apiResumeUpload(formData: FormData) {
  return apiFetch<ResumeUploadResponse>('/api/resume/upload', {
    method: 'POST',
    body: formData,
  })
}

export function apiProgress() {
  return apiFetch<{ cs_score: number | null; coding_score: number | null; aptitude_score: number | null }>(
    '/api/progress',
  )
}

export function apiDashboard() {
  return apiFetch<DashboardResponse>('/api/dashboard')
}

export function apiGetCsTest() {
  return apiFetch<{ questions: Question[] }>('/api/cs_test')
}

export function apiSubmitCsTest(payload: { answers: string[] }) {
  return apiFetch<CSSubmitResponse>('/api/cs_test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function apiGetAptitudeTest() {
  return apiFetch<{ questions: Question[] }>('/api/aptitude_test')
}

export function apiSubmitAptitudeTest(payload: { answers: string[] }) {
  return apiFetch<CSSubmitResponse>('/api/aptitude_test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function apiCodingAnalysis(payload: { leetcode_url: string }) {
  return apiFetch<CodingAnalysisResponse>('/api/coding_analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export type FullAnalysisResponse = {
  ok: boolean
  attempt: Attempt
  resume_analysis: ResumeUploadResponse['analysis']
  placement_prediction: unknown
}

export function apiFullAnalysis(formData: FormData) {
  return apiFetch<FullAnalysisResponse>('/api/full_analysis', {
    method: 'POST',
    body: formData,
  })
}

