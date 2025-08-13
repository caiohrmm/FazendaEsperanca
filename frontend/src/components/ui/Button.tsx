import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary'|'secondary'|'danger'
  size?: 'md'|'lg'
}

export default function Button({ variant='primary', size='md', className='', children, ...props }: Props){
  const base = 'inline-flex items-center justify-center rounded-lg font-semibold focus:outline-none focus:ring-2 transition'
  const sizeCls = size==='lg' ? 'text-xl px-6 py-3' : 'text-lg px-4 py-2'
  const variants: Record<string,string> = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  }
  return (
    <button {...props} className={`${base} ${sizeCls} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}


