type LoadingStateProps = {
  message?: string
}

export default function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return <div className="loading-state">{message}</div>
}
