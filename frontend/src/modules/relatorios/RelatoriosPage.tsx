import axios from 'axios'
import { useMemo, useState } from 'react'
import Button from '../../components/ui/Button'
import DateInput from '../../components/ui/DateInput'
import { useToast } from '../../system/toast'

export default function RelatoriosPage(){
  const toast = useToast()
  const now = new Date()
  const toDateStr = (d: Date) => d.toISOString().slice(0,10)
  const pad = (n:number)=> String(n).padStart(2,'0')
  const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

  const [deDate, setDeDate] = useState<string | null>(toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [deTime, setDeTime] = useState<string>('00:00')
  const [ateDate, setAteDate] = useState<string | null>(toDateStr(now))
  const [ateTime, setAteTime] = useState<string>(toTimeStr(now))
  const [allDay, setAllDay] = useState<boolean>(true)

  const isTimeValid = (t:string)=> /^\d{2}:\d{2}$/.test(t)
  const rangeInvalid = useMemo(()=>{
    if (!deDate || !ateDate) return true
    if (!isTimeValid(deTime) || !isTimeValid(ateTime)) return true
    const deDt = buildLocalDateTime(deDate, deTime)
    const ateDt = buildLocalDateTime(ateDate, ateTime)
    return deDt.getTime() > ateDt.getTime()
  }, [deDate, deTime, ateDate, ateTime])

  const toIsoZ = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString()
  const buildStart = (dateStr:string, timeStr:string)=> buildLocalDateTime(dateStr, timeStr)
  const buildEnd = (dateStr:string, timeStr:string)=> {
    const base = buildLocalDateTime(dateStr, timeStr)
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), base.getMinutes(), 59, 999)
  }

  const [downloading, setDownloading] = useState<{[k:string]: boolean}>({})

  const baixar = async (path:string, filename:string)=>{
    if (!deDate || !ateDate) { toast.error('Informe as datas inicial e final.'); return }
    if (!isTimeValid(deTime) || !isTimeValid(ateTime)) { toast.error('Informe horas válidas (HH:mm).'); return }
    if (rangeInvalid) { toast.error('Período inválido: a data inicial deve ser menor ou igual à final.'); return }
    if (downloading[path]) return
    const de = toIsoZ(buildStart(deDate, allDay ? '00:00' : deTime))
    const ate = toIsoZ(buildEnd(ateDate, allDay ? '23:59' : ateTime))
    setDownloading(prev=>({ ...prev, [path]: true }))
    try{
      const res = await axios.get(path, { params: { de, ate }, responseType:'blob' })
      const mime = path.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv;charset=utf-8;'
      const blob = new Blob([res.data], { type: mime })
      if (!blob || blob.size === 0){
        toast.error('Nenhum registro encontrado no período informado.')
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
      toast.success('Relatório gerado com sucesso.')
    } catch (e:any) {
      const msg = e?.response?.data?.message || 'Falha ao gerar relatório. Verifique o período e tente novamente.'
      toast.error(msg)
    } finally {
      setDownloading(prev=>({ ...prev, [path]: false }))
    }
  }

  const setPreset = (preset: 'hoje'|'7d'|'30d'|'mes'|'mespassado') => {
    const now = new Date()
    if (preset === 'hoje'){
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      setDeDate(toDateStr(start)); setDeTime('00:00')
      setAteDate(toDateStr(now)); setAteTime(toTimeStr(now))
    }
    if (preset === '7d'){
      const start = new Date(now); start.setDate(start.getDate()-7); start.setHours(0,0,0,0)
      setDeDate(toDateStr(start)); setDeTime('00:00')
      setAteDate(toDateStr(now)); setAteTime(toTimeStr(now))
    }
    if (preset === '30d'){
      const start = new Date(now); start.setDate(start.getDate()-30); start.setHours(0,0,0,0)
      setDeDate(toDateStr(start)); setDeTime('00:00')
      setAteDate(toDateStr(now)); setAteTime(toTimeStr(now))
    }
    if (preset === 'mes'){
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      setDeDate(toDateStr(start)); setDeTime('00:00')
      setAteDate(toDateStr(now)); setAteTime(toTimeStr(now))
    }
    if (preset === 'mespassado'){
      const start = new Date(now.getFullYear(), now.getMonth()-1, 1, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 0)
      setDeDate(toDateStr(start)); setDeTime('00:00')
      setAteDate(toDateStr(end)); setAteTime('23:59')
    }
  }

  return (
    <div className="space-y-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-5 pointer-events-none">
        <img src="/obra-inicio.png" alt="Obra" className="max-w-[80%] md:max-w-[50%]" />
      </div>
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        <h1 className="text-3xl font-bold">Relatórios - Fazenda Esperança</h1>
      </div>

      <div className="bg-white rounded-xl shadow border">
        <div className="p-4 border-b flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Escolha um período:</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={()=>setPreset('hoje')}>Hoje</Button>
            <Button variant="secondary" onClick={()=>setPreset('7d')}>Últimos 7 dias</Button>
            <Button variant="secondary" onClick={()=>setPreset('30d')}>Últimos 30 dias</Button>
            <Button variant="secondary" onClick={()=>setPreset('mes')}>Este mês</Button>
            <Button variant="secondary" onClick={()=>setPreset('mespassado')}>Mês passado</Button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-700">Período</div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allDay} onChange={(e)=> setAllDay(e.target.checked)} />
              Dia inteiro (00:00–23:59)
            </label>
          </div>
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <DateInput label="De" value={deDate} onChange={setDeDate} />
            <TimeInput label="Hora" value={deTime} onChange={setDeTime} disabled={allDay} />
            <DateInput label="Até" value={ateDate} onChange={setAteDate} />
            <TimeInput label="Hora" value={ateTime} onChange={setAteTime} disabled={allDay} />
          </div>
          {(!deDate || !ateDate) && (
            <div className="mt-2 text-sm text-red-600">Informe as datas inicial e final.</div>
          )}
          {(!isTimeValid(deTime) || !isTimeValid(ateTime)) && (
            <div className="mt-2 text-sm text-red-600">Informe horas válidas (HH:mm).</div>
          )}
          {deDate && ateDate && isTimeValid(deTime) && isTimeValid(ateTime) && rangeInvalid && (
            <div className="mt-2 text-sm text-red-600">Período inválido: a data inicial deve ser menor ou igual à final.</div>
          )}
          <div className="mt-2 text-sm text-gray-500">Os horários consideram seu fuso local e são enviados corretamente para o servidor.</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/90 backdrop-blur rounded-xl shadow border p-4 space-y-3">
          <h2 className="text-xl font-semibold">Saídas Médicas</h2>
          <p className="text-sm text-gray-600">Gere um relatório detalhado com motivo, destino, profissional, duração e mais.</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={()=>baixar('/relatorios/saidas-medicas.xlsx','relatorio-saidas.xlsx') } disabled={rangeInvalid || !!downloading['/relatorios/saidas-medicas.xlsx']}>{downloading['/relatorios/saidas-medicas.xlsx']? 'Gerando...' : 'Exportar XLSX'}</Button>
            <Button onClick={()=>baixar('/relatorios/saidas-medicas.csv','relatorio-saidas.csv')} variant="secondary" disabled={rangeInvalid || !!downloading['/relatorios/saidas-medicas.csv']}>{downloading['/relatorios/saidas-medicas.csv']? 'Gerando...' : 'CSV'}</Button>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-xl shadow border p-4 space-y-3">
          <h2 className="text-xl font-semibold">Financeiro</h2>
          <p className="text-sm text-gray-600">Inclui tipo, valor, forma, recibo, origem, descrição e responsável.</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={()=>baixar('/relatorios/financeiro.xlsx','relatorio-financeiro.xlsx') } disabled={rangeInvalid || !!downloading['/relatorios/financeiro.xlsx']}>{downloading['/relatorios/financeiro.xlsx']? 'Gerando...' : 'Exportar XLSX'}</Button>
            <Button onClick={()=>baixar('/relatorios/financeiro.csv','relatorio-financeiro.csv')} variant="secondary" disabled={rangeInvalid || !!downloading['/relatorios/financeiro.csv']}>{downloading['/relatorios/financeiro.csv']? 'Gerando...' : 'CSV'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimeInput({ label, value, onChange }:{ label:string; value:string; onChange:(v:string)=>void }){
  return (
    <label className="block">
      <span className="block mb-1">{label}</span>
      <input type="time" className="w-full border rounded-lg p-3 text-lg" value={value} onChange={(e)=> onChange(e.target.value)} />
    </label>
  )
}

function buildLocalDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(n=>parseInt(n,10))
  const [hour, minute] = timeStr.split(':').map(n=>parseInt(n,10))
  return new Date(year, (month-1), day, hour, minute, 0, 0)
}


