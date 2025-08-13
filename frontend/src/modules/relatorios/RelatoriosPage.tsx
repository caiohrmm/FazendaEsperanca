import axios from 'axios'
import { useState } from 'react'

export default function RelatoriosPage(){
  const [de, setDe] = useState('2025-01-01T00:00:00Z')
  const [ate, setAte] = useState('2025-12-31T23:59:59Z')

  const baixar = async (path:string, filename:string)=>{
    const res = await axios.get(`${path}?de=${encodeURIComponent(de)}&ate=${encodeURIComponent(ate)}`, { responseType:'blob' })
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Relatórios</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1">De (UTC ISO)</label>
          <input className="w-full border rounded-lg p-3 text-lg" value={de} onChange={e=>setDe(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Até (UTC ISO)</label>
          <input className="w-full border rounded-lg p-3 text-lg" value={ate} onChange={e=>setAte(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={()=>baixar('/relatorios/saidas-medicas.csv','relatorio-saidas.csv')} className="bg-brand-600 text-white px-6 py-3 rounded-lg text-lg">Saídas CSV</button>
        <button onClick={()=>baixar('/relatorios/financeiro.csv','relatorio-financeiro.csv')} className="bg-brand-600 text-white px-6 py-3 rounded-lg text-lg">Financeiro CSV</button>
      </div>
    </div>
  )
}


