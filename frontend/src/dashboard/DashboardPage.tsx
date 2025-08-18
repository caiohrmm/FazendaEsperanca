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

        // estatísticas de saídas
        const saidasRes = await axios.get('/saidas-medicas', { params: { page:0, size:1 }})
        const totalSaidas = saidasRes.data.totalElements ?? 0
        // tempo médio fora (aproximação pela primeira página)
        const saidasRes2 = await axios.get('/saidas-medicas', { params: { page:0, size:50 }})
        const listSaidas = Array.isArray(saidasRes2.data?.content) ? saidasRes2.data.content : []
        const medias = listSaidas.map((s:any)=> typeof s.duracaoMinutos==='number'? s.duracaoMinutos : null).filter((x:any)=> typeof x==='number')
        const tempoMedioForaMin = medias.length>0 ? Math.round(medias.reduce((a:number,b:number)=>a+b,0)/medias.length) : 0

        // estatísticas de transações
        const transRes = await axios.get('/transacoes', { params: { page:0, size:1 }})
        const totalTransacoes = transRes.data.totalElements ?? 0

        setStats({ totalSaidas, tempoMedioForaMin, totalTransacoes, totalAcolhidas, totalAcolhidasAtivas, totalAcolhidasEgressas })
      } catch(e:any){ setError('Falha ao carregar estatísticas') }
      finally{ setLoading(false) }
    })()
  },[])

  const baixarRelatorioFinanceiro = async()=>{
    const ate = new Date()
    const de = new Date(); de.setMonth(de.getMonth()-1)
    const toIso = (d:Date)=> new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString()
    const res = await axios.get(`/relatorios/financeiro.csv`, { params:{ de: toIso(de), ate: toIso(ate) }, responseType:'blob' })
    const blob = new Blob([res.data], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `relatorio-financeiro.csv`; a.click()
    URL.revokeObjectURL(url)
  }

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

          <div className="bg-white/90 backdrop-blur p-6 rounded-xl shadow border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Atalhos</h2>
              <div className="flex gap-2">
                <Button onClick={()=>window.location.assign('/transacoes')}>Ir para Financeiro</Button>
                <Button onClick={()=>window.location.assign('/saidas-medicas')} variant="secondary">Ir para Saídas</Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={baixarRelatorioFinanceiro} variant="secondary">Baixar Relatório Financeiro (30 dias)</Button>
            </div>
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


