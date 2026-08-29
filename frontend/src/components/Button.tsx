import { Link } from 'react-router-dom'

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  to?: string
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  type = 'button',
  disabled,
  onClick,
  to,
  children,
}: ButtonProps) {
  const cls = `btn btn--${variant}`

  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
