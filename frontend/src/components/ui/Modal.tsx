import React from 'react'

export default function Modal({ open, onClose, title, children }:{ open:boolean; onClose:()=>void; title:string; children: React.ReactNode }){
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}


