import { apiGetAptitudeTest, apiSubmitAptitudeTest } from '../api'
import AssessmentGate from '../components/AssessmentGate'
import AssessmentTest from '../components/AssessmentTest'

type Props = { userEmail?: string | null; onLogout: () => void }

export default function AptitudeTestPage(props: Props) {
  return <AssessmentGate requiredStep="aptitude"><AssessmentTest {...props}
    title="Aptitude test" subtitle="Answer every question before submitting your response."
    current="aptitude" nextPath="/assessment/final" nextLabel="Continue to Final Analysis"
    getQuestions={apiGetAptitudeTest} submitAnswers={apiSubmitAptitudeTest} />
  </AssessmentGate>
}
