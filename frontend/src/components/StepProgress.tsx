const STEPS = [
  { key: 'resume', label: 'Resume' },
  { key: 'coding', label: 'Coding' },
  { key: 'cs-test', label: 'CS Test' },
  { key: 'aptitude', label: 'Aptitude' },
  { key: 'final', label: 'Final' },
] as const

export type StepKey = (typeof STEPS)[number]['key']

type StepProgressProps = {
  current: StepKey
  completed: StepKey[]
}

export default function StepProgress({ current, completed }: StepProgressProps) {
  return (
    <nav className="step-progress" aria-label="Assessment progress">
      {STEPS.map((step) => {
        const isActive = step.key === current
        const isDone = completed.includes(step.key)
        let cls = 'step-progress__item'
        if (isActive) cls += ' step-progress__item--active'
        else if (isDone) cls += ' step-progress__item--done'
        return (
          <div key={step.key} className={cls}>
            {step.label}
          </div>
        )
      })}
    </nav>
  )
}

export { STEPS }
