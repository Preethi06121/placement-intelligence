import { apiGetCsTest, apiSubmitCsTest } from '../api'
import AssessmentGate from '../components/AssessmentGate'
import AssessmentTest from '../components/AssessmentTest'

type Props = { userEmail?: string | null; onLogout: () => void }

export default function CSTestPage(props: Props) {
  return <AssessmentGate requiredStep="cs-test"><AssessmentTest {...props}
    title="Computer science test" subtitle="Answer every question before submitting your response."
    current="cs-test" nextPath="/assessment/aptitude" nextLabel="Continue to Aptitude"
    getQuestions={apiGetCsTest} submitAnswers={apiSubmitCsTest} />
  </AssessmentGate>
}
