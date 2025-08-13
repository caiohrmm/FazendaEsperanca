import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string }

export default function Input({ label, className='', ...props }: Props){
  return (
    <label className="block">
      {label && <span className="block mb-1">{label}</span>}
      <input {...props} className={`w-full border rounded-lg p-3 text-lg ${className}`} />
    </label>
  )
}


