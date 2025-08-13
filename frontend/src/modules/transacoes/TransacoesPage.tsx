import axios from 'axios'
import { useEffect, useState } from 'react'

type Transacao = {
  id: number
  tipo: 'DOACAO_EXTERNA'|'RECEBIMENTO_ACOLHIDA'|'ENTREGA_ACOLHIDA'
  valor: number
  formaPagamento: 'PIX'|'DINHEIRO'|'DEPOSITO'|'CARTAO'|'TRANSFERENCIA'
  numeroRecibo: string
  status: 'PENDENTE_ASSINATURA'|'CONCLUIDA'|'CANCELADA'
  dataHora: string
}

export default function TransacoesPage(){
  const [lista, setLista] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(false)

  const load = async()=>{
    setLoading(true)
    try{
      const { data } = await axios.get('/transacoes', { params: { page:0, size:20 }})
      setLista(data.content ?? [])
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() },[])

  const baixarRecibo = async (id:number)=>{
    const res = await axios.get(`/transacoes/${id}/recibo/pdf`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `recibo-${id}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <button onClick={load} className="bg-brand-600 text-white px-6 py-3 rounded-lg text-lg">Atualizar</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Valor</th>
              <th className="text-left p-3">Forma</th>
              <th className="text-left p-3">Recibo</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(t=> (
              <tr key={t.id} className="border-t">
                <td className="p-3">{t.tipo}</td>
                <td className="p-3">R$ {t.valor.toFixed(2)}</td>
                <td className="p-3">{t.formaPagamento}</td>
                <td className="p-3">{t.numeroRecibo}</td>
                <td className="p-3">{t.status}</td>
                <td className="p-3">{new Date(t.dataHora).toLocaleString()}</td>
                <td className="p-3">
                  <button onClick={()=>baixarRecibo(t.id)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">PDF</button>
                </td>
              </tr>
            ))}
            {(!loading && lista.length===0) && (
              <tr><td className="p-4" colSpan={7}>Nenhum registro</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


