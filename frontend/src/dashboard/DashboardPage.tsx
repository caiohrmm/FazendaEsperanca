import axios from 'axios'
import { useEffect, useState } from 'react'
import Button from '../components/ui/Button'

type Stats = {
  totalSaidas: number
  tempoMedioForaMin: number
  totalTransacoes: number
  totalAcolhidas: number
  totalAcolhidasAtivas: number
  totalAcolhidasEgressas: number
}

export default function DashboardPage(){
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string| null>(null)

  useEffect(()=>{
    (async()=>{
      try{
        // estatísticas de acolhidas
        const [page1, page2] = await Promise.all([
          axios.get('/acolhidas', { params: { page:0, size:1 } }),
          axios.get('/acolhidas', { params: { page:0, size:1, status: 'ATIVA' } }),
        ])
        const totalAcolhidas = page1.data.totalElements ?? 0
        const totalAcolhidasAtivas = page2.data.totalElements ?? 0
        const totalAcolhidasEgressas = totalAcolhidas - totalAcolhidasAtivas
        setStats({ totalSaidas: 0, tempoMedioForaMin: 0, totalTransacoes: 0, totalAcolhidas, totalAcolhidasAtivas, totalAcolhidasEgressas })
      } catch(e:any){ setError('Falha ao carregar estatísticas') }
      finally{ setLoading(false) }
    })()
  },[])

  return (
    <div className="space-y-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-10 pointer-events-none">
        <img src="/obra-inicio.png" alt="Obra" className="max-w-[80%] md:max-w-[50%]" />
      </div>
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        <h1 className="text-3xl font-bold">Bem-vindo(a) à Fazenda Esperança</h1>
      </div>
      {loading && <div>Carregando...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {stats && (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Saídas Médicas" value={stats.totalSaidas} />
            <Card title="Tempo médio fora (min)" value={stats.tempoMedioForaMin} />
            <Card title="Transações" value={stats.totalTransacoes} />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Acolhidas" value={stats.totalAcolhidas} />
            <Card title="Ativas" value={stats.totalAcolhidasAtivas} />
            <Card title="Egressas" value={stats.totalAcolhidasEgressas} />
          </div>
        </>
      )}
    </div>
  )
}

function Card({title, value}:{title:string; value:number}){
  return (
    <div className="bg-white/90 backdrop-blur p-6 rounded-xl shadow text-center border">
      <div className="text-xl mb-2 text-gray-700">{title}</div>
      <div className="text-4xl font-extrabold text-brand-700">{value}</div>
    </div>
  )
}


