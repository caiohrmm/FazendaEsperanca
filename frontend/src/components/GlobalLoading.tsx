import { useEffect, useState } from 'react'
import { loadingBus } from '../system/loadingBus'

export default function GlobalLoading(){
  const [visible, setVisible] = useState(false)
  useEffect(()=>{
    loadingBus.setHandlers(()=> setVisible(true), ()=> setVisible(false))
  },[])
  return (
    <div className={`fixed inset-0 z-40 ${visible ? 'pointer-events-auto' : 'pointer-events-none'} transition` }>
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${visible?'opacity-100':'opacity-0'}`} />
      <div className={`absolute inset-0 flex items-center justify-center transition ${visible?'opacity-100':'opacity-0'}`}>
        <div className="bg-white rounded-xl shadow px-6 py-4 flex items-center gap-3">
          <Spinner />
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    </div>
  )
}

function Spinner(){
  return (
    <svg className="animate-spin h-6 w-6 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  )
}


