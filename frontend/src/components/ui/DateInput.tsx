import React from 'react'

type Props = {
  label?: string
  value?: string | null
  onChange: (value: string | null) => void
  required?: boolean
}

export default function DateInput({ label, value, onChange, required }: Props){
  return (
    <label className="block">
      {label && <span className="block mb-1">{label}</span>}
      <input
        type="date"
        className="w-full border rounded-lg p-3 text-lg"
        value={value ?? ''}
        onChange={(e)=> onChange(e.target.value || null)}
        required={required}
      />
    </label>
  )
}


