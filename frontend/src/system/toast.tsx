import React, { createContext, useContext, useEffect, useState } from 'react'

type Toast = { id: number; message: string; type: 'success'|'error' }
type Ctx = { success: (m:string)=>void; error:(m:string)=>void }

const ToastCtx = createContext<Ctx>({} as any)

export function ToastProvider({ children }:{ children: React.ReactNode }){
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = (t: Toast) => {
    setToasts((prev)=>[...prev, t])
    setTimeout(()=> setToasts(prev=> prev.filter(x=>x.id!==t.id)), 3500)
  }
  const success = (m:string)=> push({ id: Date.now(), message: m, type:'success' })
  const error = (m:string)=> push({ id: Date.now()+1, message: m, type:'error' })
  return (
    <ToastCtx.Provider value={{ success, error }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t=> (
          <div key={t.id} className={`rounded-xl shadow-lg px-4 py-3 text-white ${t.type==='success'?'bg-emerald-600':'bg-red-600'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)


