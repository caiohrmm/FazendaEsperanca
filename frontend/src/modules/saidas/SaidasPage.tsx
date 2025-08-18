import axios from 'axios'
import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import DateInput from '../../components/ui/DateInput'
import { useToast } from '../../system/toast'
import { loadingBus } from '../../system/loadingBus'

type Saida = {
  id: number
  acolhidaId: number
  acolhidaNome?: string
  motivo: 'CONSULTA'|'EXAME'|'RETORNO'|'OUTRO'
  destino: string
  profissional?: string
  dataHoraSaida: string
  dataHoraRetorno?: string
  meioTransporte?: string
  observacoes?: string
  responsavel?: 'ALCILEIA_FIGUEREDO'|'MARIA_ASSUNCION'
  duracaoMinutos?: number
}

function SaidasPage(){
  const toast = useToast()
  const [lista, setLista] = useState<Saida[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Saida | null>(null)
  const [form, setForm] = useState({ acolhidaId: 0, motivo: 'CONSULTA' as Saida['motivo'], destino: '', profissional: '', data: null as string | null, hora: '', meioTransporte:'', observacoes:'', responsavel: 'ALCILEIA_FIGUEREDO' as Saida['responsavel'], retornoData: null as string | null, retornoHora: '' })
  const [acolhidaNome, setAcolhidaNome] = useState<string>('')

  // Filtros
  const [filtroAcolhidaId, setFiltroAcolhidaId] = useState<number | null>(null)
  const [filtroAcolhidaNome, setFiltroAcolhidaNome] = useState<string>('')
  const [filtroMotivo, setFiltroMotivo] = useState<'' | Saida['motivo']>('')
  const [filtroDe, setFiltroDe] = useState<string | null>(null)
  const [filtroAte, setFiltroAte] = useState<string | null>(null)

  // Picker de acolhidas
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerNome, setPickerNome] = useState('')
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerData, setPickerData] = useState<Array<{id:number; nomeCompleto:string; status:string}>>([])
  // Saída em grupo
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupForm, setGroupForm] = useState({ motivo: 'CONSULTA' as Saida['motivo'], destino: '', profissional: '', data: null as string | null, hora: '', meioTransporte:'', observacoes:'', responsavel: 'ALCILEIA_FIGUEREDO' as Saida['responsavel'], retornoData: null as string | null, retornoHora: '' })
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)
  const [groupPickerNome, setGroupPickerNome] = useState('')
  const [groupPickerLoading, setGroupPickerLoading] = useState(false)
  const [groupPickerData, setGroupPickerData] = useState<Array<{id:number; nomeCompleto:string; status:string}>>([])
  const [groupSelected, setGroupSelected] = useState<Array<{id:number; nomeCompleto:string}>>([])

  // Picker para filtro por acolhida
  const [filterPickerOpen, setFilterPickerOpen] = useState(false)
  const [filterPickerNome, setFilterPickerNome] = useState('')
  const [filterPickerLoading, setFilterPickerLoading] = useState(false)
  const [filterPickerData, setFilterPickerData] = useState<Array<{id:number; nomeCompleto:string; status:string}>>([])

  const load = async()=>{
    setLoading(true); loadingBus.start()
    try{
      const params:any = { page:0, size:20 }
      if (filtroAcolhidaId) params.acolhidaId = filtroAcolhidaId
      if (filtroDe) params.de = buildLocalDateTime(filtroDe, '00:00').toISOString()
      if (filtroAte) params.ate = buildLocalDateTime(filtroAte, '23:59').toISOString()
      if (filtroMotivo) params.motivo = filtroMotivo
      const { data } = await axios.get('/saidas-medicas', { params })
      const content = data.content?.map((d:any)=> ({ ...d })) ?? []
      setLista(content)
    } catch(e:any){ toast.error('Falha ao carregar saídas') }
    finally { setLoading(false); loadingBus.end() }
  }

  // carrega acolhidas para o picker
  const loadPicker = async()=>{
    setPickerLoading(true)
    try{
      const { data } = await axios.get('/acolhidas', { params: { page:0, size:20, nome: pickerNome || undefined, status: 'ATIVA' }})
      setPickerData(Array.isArray(data?.content) ? data.content : [])
    } finally { setPickerLoading(false) }
  }
  const loadGroupPicker = async()=>{
    setGroupPickerLoading(true)
    try{
      const { data } = await axios.get('/acolhidas', { params: { page:0, size:50, nome: groupPickerNome || undefined, status: 'ATIVA' }})
      setGroupPickerData(Array.isArray(data?.content) ? data.content : [])
    } finally { setGroupPickerLoading(false) }
  }

  const loadFilterPicker = async()=>{
    setFilterPickerLoading(true)
    try{
      const { data } = await axios.get('/acolhidas', { params: { page:0, size:50, nome: filterPickerNome || undefined, status: 'ATIVA' }})
      setFilterPickerData(Array.isArray(data?.content) ? data.content : [])
    } finally { setFilterPickerLoading(false) }
  }

  useEffect(()=>{ load() },[])

  const openCreate = ()=>{ setEditing(null); setForm({ acolhidaId: 0, motivo:'CONSULTA', destino:'', profissional:'', data:null, hora:'', meioTransporte:'', observacoes:'', responsavel:'ALCILEIA_FIGUEREDO', retornoData:null, retornoHora:'' }); setAcolhidaNome(''); setOpen(true) }
  const openEdit = (s: Saida)=>{ setEditing(s); const dt = new Date(s.dataHoraSaida); const isoDate = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,10); const time = dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false}); const retornoDt = s.dataHoraRetorno ? new Date(s.dataHoraRetorno) : null; const retornoDate = retornoDt ? new Date(retornoDt.getTime() - retornoDt.getTimezoneOffset()*60000).toISOString().slice(0,10) : null; const retornoHora = retornoDt ? retornoDt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false}) : '';
    setForm({ acolhidaId: s.acolhidaId, motivo:s.motivo, destino:s.destino, profissional:s.profissional||'', data: isoDate, hora: time, meioTransporte:s.meioTransporte||'', observacoes:s.observacoes||'', responsavel: s.responsavel||'ALCILEIA_FIGUEREDO', retornoData: retornoDate, retornoHora });
    setAcolhidaNome(s.acolhidaNome || '');
    setOpen(true)
  }
  const validate = ()=>{
    if (!form.acolhidaId || form.acolhidaId <= 0) { toast.error('Informe a acolhidaId'); return false }
    if (!form.destino.trim()) { toast.error('Informe o destino'); return false }
    if (!form.data || !/^\d{4}-\d{2}-\d{2}$/.test(form.data)) { toast.error('Data inválida'); return false }
    if (!form.hora || !/^\d{2}:\d{2}$/.test(form.hora)) { toast.error('Hora inválida'); return false }
    const [hh,mm] = form.hora.split(':').map(n=>parseInt(n,10));
    if (isNaN(hh) || isNaN(mm) || hh<0 || hh>23 || mm<0 || mm>59) { toast.error('Hora inválida'); return false }
    // Data de saída não pode estar muito distante (ex.: +/- 1 ano) do dia atual
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const saidaDia = buildLocalDateTime(form.data, '00:00')
    const umAnoMs = 365*24*60*60*1000
    if (Math.abs(saidaDia.getTime()) - hoje.getTime() > umAnoMs) { toast.error('Data da saída muito distante do dia atual (±1 ano)'); return false }
    if (saidaDia.getTime() > hoje.getTime()) { toast.error('Data da saída não pode ser no futuro'); return false }
    if ((form.retornoData && !form.retornoHora) || (!form.retornoData && form.retornoHora)) { toast.error('Informe data e hora do retorno ou deixe ambos vazios'); return false }
    if (form.retornoData && form.retornoHora) {
      const saida = buildLocalDateTime(form.data!, form.hora)
      const retorno = buildLocalDateTime(form.retornoData, form.retornoHora)
      if (retorno < saida) { toast.error('Retorno não pode ser antes da saída'); return false }
    }
    return true
  }
  const save = async()=>{
    if (!validate()) return
    const dataHoraSaida = toLocalOffsetIso(buildLocalDateTime(form.data!, form.hora))
    loadingBus.start()
    try{
      if (editing) {
        // Atualiza detalhes permitidos
        const updateReq:any = { motivo: form.motivo, destino: form.destino, profissional: form.profissional || null, meioTransporte: form.meioTransporte || null }
        await axios.put(`/saidas-medicas/${editing.id}`, updateReq)
        // Registra retorno se informado e ainda não existe
        if (form.retornoData && form.retornoHora && !editing.dataHoraRetorno) {
          const dataHoraRetorno = toLocalOffsetIso(buildLocalDateTime(form.retornoData, form.retornoHora))
          await axios.put(`/saidas-medicas/${editing.id}/retorno`, { dataHoraRetorno })
        }
      } else {
        const payload:any = { acolhidaId: form.acolhidaId, motivo: form.motivo, destino: form.destino, profissional: form.profissional || null, dataHoraSaida, meioTransporte: form.meioTransporte || null, observacoes: form.observacoes || null, responsavel: form.responsavel }
        if (form.retornoData && form.retornoHora) {
          payload.dataHoraRetorno = toLocalOffsetIso(buildLocalDateTime(form.retornoData, form.retornoHora))
        }
        await axios.post('/saidas-medicas', payload)
      }
      setOpen(false); toast.success('Salvo com sucesso'); await load()
    } catch(e:any){ toast.error(e?.response?.data?.message ?? 'Erro ao salvar') }
    finally { loadingBus.end() }
  }
  const remove = async(id:number)=>{
    if (!confirm('Tem certeza que deseja excluir?')) return
    loadingBus.start()
    try{ await axios.delete(`/saidas-medicas/${id}`); toast.success('Excluído com sucesso'); await load() }
    catch(e:any){ toast.error(e?.response?.data?.message ?? 'Erro ao excluir') }
    finally { loadingBus.end() }
  }

  // Funções para saída em grupo
  const openGroupCreate = ()=>{
    setGroupForm({ motivo:'CONSULTA', destino:'', profissional:'', data:null, hora:'', meioTransporte:'', observacoes:'', responsavel:'ALCILEIA_FIGUEREDO', retornoData: null, retornoHora: '' })
    setGroupSelected([])
    setGroupOpen(true)
  }

  const validateGroup = ()=>{
    if (groupSelected.length === 0) { toast.error('Selecione pelo menos uma acolhida'); return false }
    if (!groupForm.destino.trim()) { toast.error('Informe o destino'); return false }
    if (!groupForm.data || !/^\d{4}-\d{2}-\d{2}$/.test(groupForm.data)) { toast.error('Data inválida'); return false }
    if (!groupForm.hora || !/^\d{2}:\d{2}$/.test(groupForm.hora)) { toast.error('Hora inválida'); return false }
    const [hh,mm] = groupForm.hora.split(':').map(n=>parseInt(n,10));
    if (isNaN(hh) || isNaN(mm) || hh<0 || hh>23 || mm<0 || mm>59) { toast.error('Hora inválida'); return false }
    // Janela de ±1 ano
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const saidaDia = buildLocalDateTime(groupForm.data, '00:00')
    const umAnoMs = 365*24*60*60*1000
    if (Math.abs(saidaDia.getTime() - hoje.getTime()) > umAnoMs) { toast.error('Data da saída muito distante do dia atual (±1 ano)'); return false }
    // Retorno opcional, mas se tiver um precisa do outro
    if ((groupForm.retornoData && !groupForm.retornoHora) || (!groupForm.retornoData && groupForm.retornoHora)) { toast.error('Informe data e hora do retorno ou deixe ambos vazios'); return false }
    if (groupForm.retornoData && groupForm.retornoHora) {
      const saida = buildLocalDateTime(groupForm.data!, groupForm.hora)
      const retorno = buildLocalDateTime(groupForm.retornoData, groupForm.retornoHora)
      if (retorno < saida) { toast.error('Retorno não pode ser antes da saída'); return false }
    }
    return true
  }

  const saveGroup = async()=>{
    if (!validateGroup()) return
    const dataHoraSaida = toLocalOffsetIso(buildLocalDateTime(groupForm.data!, groupForm.hora))
    
    loadingBus.start()
    try{
      // Criar uma saída para cada acolhida selecionada
      const promises = groupSelected.map(acolhida => {
        const payload:any = { 
          acolhidaId: acolhida.id, 
          motivo: groupForm.motivo, 
          destino: groupForm.destino, 
          profissional: groupForm.profissional || null, 
          dataHoraSaida, 
          meioTransporte: groupForm.meioTransporte || null, 
          observacoes: groupForm.observacoes || null, 
          responsavel: groupForm.responsavel 
        }
        if (groupForm.retornoData && groupForm.retornoHora) {
          payload.dataHoraRetorno = toLocalOffsetIso(buildLocalDateTime(groupForm.retornoData, groupForm.retornoHora))
        }
        return axios.post('/saidas-medicas', payload)
      })
      
      await Promise.all(promises)
      setGroupOpen(false)
      toast.success(`${groupSelected.length} saídas criadas com sucesso`)
      await load()
    } catch(e:any){ 
      toast.error(e?.response?.data?.message ?? 'Erro ao salvar saídas em grupo') 
    }
    finally { loadingBus.end() }
  }

  const toggleGroupSelection = (acolhida: {id:number; nomeCompleto:string})=>{
    const isSelected = groupSelected.some(a => a.id === acolhida.id)
    if (isSelected) {
      setGroupSelected(prev => prev.filter(a => a.id !== acolhida.id))
    } else {
      setGroupSelected(prev => [...prev, acolhida])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Saídas Médicas</h1>
        <div className="hidden md:flex gap-2">
          <Button onClick={openGroupCreate}>Saída em grupo</Button>
          <Button onClick={openCreate}>Nova saída</Button>
          <Button onClick={load} variant="secondary">Atualizar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Filtros */}
        <div className="p-4 border-b bg-white">
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block">
                <span className="block mb-1">Acolhida</span>
                <div className="hidden md:flex gap-2">
                  <input className="flex-1 border rounded-lg p-3 text-lg bg-gray-50" value={filtroAcolhidaNome || (filtroAcolhidaId?`ID ${filtroAcolhidaId}`:'')} readOnly placeholder="Selecione a acolhida (opcional)" />
                  {filtroAcolhidaId && (<Button type="button" variant="secondary" onClick={()=>{ setFiltroAcolhidaId(null); setFiltroAcolhidaNome('') }}>Limpar</Button>)}
                  <Button type="button" onClick={()=>{ setFilterPickerOpen(true); loadFilterPicker(); }}>Selecionar</Button>
                </div>
                <div className="md:hidden">
                  <input className="w-full border rounded-lg p-4 text-xl bg-gray-50" value={filtroAcolhidaNome || (filtroAcolhidaId?`ID ${filtroAcolhidaId}`:'')} readOnly placeholder="Selecione a acolhida (opcional)" />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {filtroAcolhidaId ? (
                      <Button type="button" variant="secondary" className="text-xl py-3" onClick={()=>{ setFiltroAcolhidaId(null); setFiltroAcolhidaNome('') }}>Limpar</Button>
                    ) : (
                      <div />
                    )}
                    <Button type="button" className="text-xl py-3" onClick={()=>{ setFilterPickerOpen(true); loadFilterPicker(); }}>Selecionar</Button>
                  </div>
                </div>
              </label>
            </div>
            <label className="block">
              <span className="block mb-1">De</span>
              <DateInput label="" value={filtroDe} onChange={setFiltroDe} />
            </label>
            <label className="block">
              <span className="block mb-1">Até</span>
              <DateInput label="" value={filtroAte} onChange={setFiltroAte} />
            </label>
            <label className="block">
              <span className="block mb-1">Motivo</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={filtroMotivo} onChange={e=> setFiltroMotivo(e.target.value as any)}>
                <option value="">Todos</option>
                <option value="CONSULTA">CONSULTA</option>
                <option value="EXAME">EXAME</option>
                <option value="RETORNO">RETORNO</option>
                <option value="OUTRO">OUTRO</option>
              </select>
            </label>
            <div className="hidden md:flex md:col-span-4 gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={()=>{ setFiltroAcolhidaId(null); setFiltroAcolhidaNome(''); setFiltroMotivo(''); setFiltroDe(null); setFiltroAte(null); load(); }}>Limpar</Button>
              <Button type="button" onClick={load}>Buscar</Button>
            </div>
            <div className="md:hidden grid grid-cols-2 gap-2 mt-2">
              <Button type="button" variant="secondary" className="text-xl py-3" onClick={()=>{ setFiltroAcolhidaId(null); setFiltroAcolhidaNome(''); setFiltroMotivo(''); setFiltroDe(null); setFiltroAte(null); load(); }}>Limpar</Button>
              <Button type="button" className="text-xl py-3" onClick={load}>Buscar</Button>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-6 text-center text-lg">Carregando...</div>
        ) : (
          <>
            {/* Mobile: lista em cartões */}
            <div className="md:hidden p-2 space-y-3">
              {lista.map(s => (
                <div key={s.id} className="bg-white rounded-xl border shadow-sm p-3">
                  <div className="font-semibold text-base mb-1">{s.acolhidaNome || `ID ${s.acolhidaId}`}</div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div><span className="text-gray-500">Motivo:</span> {s.motivo}</div>
                    <div><span className="text-gray-500">Saída:</span> {formatDateTimeBR(s.dataHoraSaida)}</div>
                    <div><span className="text-gray-500">Retorno:</span> {s.dataHoraRetorno ? formatDateTimeBR(s.dataHoraRetorno) : '-'}</div>
                    <div><span className="text-gray-500">Resp.:</span> {formatResponsavel(s.responsavel)}</div>
                    <div><span className="text-gray-500">Duração:</span> {typeof s.duracaoMinutos === 'number' ? `${s.duracaoMinutos} min` : (s.dataHoraRetorno ? Math.round((new Date(s.dataHoraRetorno).getTime() - new Date(s.dataHoraSaida).getTime())/60000) : '-')}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={()=>openEdit(s)} className="flex-1 text-xl px-6 py-3 md:text-lg md:px-4 md:py-2">Editar</Button>
                    <Button onClick={()=>remove(s.id)} variant="danger" className="flex-1 text-xl px-6 py-3 md:text-lg md:px-4 md:py-2">Excluir</Button>
                  </div>
                </div>
              ))}
              {lista.length === 0 && (
                <div className="p-4 text-center text-gray-600">Nenhum registro</div>
              )}
            </div>

            {/* Desktop: tabela permanece inalterada */}
            <table className="hidden md:table w-full text-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Acolhida</th>
                  <th className="text-left p-3">Motivo</th>
                  <th className="text-left p-3">Saída</th>
                  <th className="text-left p-3">Retorno</th>
                  <th className="text-left p-3">Responsável</th>
                  <th className="text-left p-3">Duração (min)</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(s=> (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{s.acolhidaNome || `ID ${s.acolhidaId}`}</td>
                    <td className="p-3">{s.motivo}</td>
                    <td className="p-3">{formatDateTimeBR(s.dataHoraSaida)}</td>
                    <td className="p-3">{s.dataHoraRetorno ? formatDateTimeBR(s.dataHoraRetorno) : '-'}</td>
                    <td className="p-3">{formatResponsavel(s.responsavel)}</td>
                    <td className="p-3">{typeof s.duracaoMinutos === 'number' ? s.duracaoMinutos : (s.dataHoraRetorno ? Math.round((new Date(s.dataHoraRetorno).getTime() - new Date(s.dataHoraSaida).getTime())/60000) : '-')}</td>
                    <td className="p-3 text-right">
                      <Button onClick={()=>openEdit(s)} className="mr-2">Editar</Button>
                      <Button onClick={()=>remove(s.id)} variant="danger">Excluir</Button>
                    </td>
                  </tr>
                ))}
                {(!loading && lista.length===0) && (
                  <tr><td className="p-4" colSpan={7}>Nenhum registro</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Barra fixa de ações (somente mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="container p-3 flex gap-2">
          <Button type="button" onClick={openGroupCreate} variant="secondary" className="flex-1 text-xl py-3 md:text-lg md:py-2">Em grupo</Button>
          <Button type="button" onClick={openCreate} className="flex-1 text-xl py-3 md:text-lg md:py-2">Nova saída</Button>
          <Button type="button" onClick={load} variant="secondary" className="flex-1 text-xl py-3 md:text-lg md:py-2">Atualizar</Button>
        </div>
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title={editing? 'Editar saída' : 'Nova saída'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block">
                <span className="block mb-1">Acolhida</span>
                <div className="flex gap-2">
                  <input className="flex-1 border rounded-lg p-3 text-lg bg-gray-50" value={acolhidaNome || (form.acolhidaId?`ID ${form.acolhidaId}`:'')} readOnly placeholder="Selecione a acolhida" />
                  <Button onClick={()=>{ setPickerOpen(true); loadPicker(); }} type="button">Escolher</Button>
                </div>
              </label>
            </div>
            <label className="block">
              <span className="block mb-1">Motivo</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={form.motivo} onChange={e=>setForm({...form, motivo: e.target.value as any})}>
                <option value="CONSULTA">CONSULTA</option>
                <option value="EXAME">EXAME</option>
                <option value="RETORNO">RETORNO</option>
                <option value="OUTRO">OUTRO</option>
              </select>
            </label>
            <Input label="Destino" value={form.destino} onChange={e=>setForm({...form, destino:e.target.value})} placeholder="Hospital Municipal" />
            <Input label="Profissional" value={form.profissional} onChange={e=>setForm({...form, profissional:e.target.value})} placeholder="Dra. Ana" />
            <DateInput label="Data da saída" value={form.data} onChange={(v)=>setForm({...form, data: v, retornoData: v && (!form.retornoData || form.retornoData === '') ? v : form.retornoData })} />
            <TimeInput label="Hora da saída" value={form.hora} onChange={(v)=>setForm({...form, hora:v})} placeholder="08:30" />
            <DateInput label="Data do retorno (opcional)" value={form.retornoData} onChange={(v)=>setForm({...form, retornoData: v || form.data })} />
            <TimeInput label="Hora do retorno (opcional)" value={form.retornoHora} onChange={(v)=>setForm({...form, retornoHora: v})} placeholder="10:30" />
            <Input label="Meio de transporte" value={form.meioTransporte} onChange={e=>setForm({...form, meioTransporte:e.target.value})} placeholder="Carro" />
            <label className="block">
              <span className="block mb-1">Responsável</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value as any})}>
                <option value="ALCILEIA_FIGUEREDO">ALCILEIA_FIGUEREDO</option>
                <option value="MARIA_ASSUNCION">MARIA_ASSUNCION</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <Input label="Observações" value={form.observacoes} onChange={e=>setForm({...form, observacoes:e.target.value})} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse md:flex-row md:justify-end gap-3">
          <Button variant="secondary" onClick={()=>setOpen(false)} className="text-xl py-3 md:text-lg md:py-2">Cancelar</Button>
          <Button onClick={save} className="text-xl py-3 md:text-lg md:py-2">Salvar</Button>
        </div>
      </Modal>

      {/* Modal filtro: selecionar acolhida */}
      <Modal open={filterPickerOpen} onClose={()=>setFilterPickerOpen(false)} title="Selecionar Acolhida (Filtro)">
        <div className="space-y-3">
          <div className="grid gap-2 grid-cols-1 md:grid-cols-[1fr_auto] items-end">
            <Input label="Buscar por nome" value={filterPickerNome} onChange={e=>setFilterPickerNome(e.target.value)} />
            <Button onClick={()=>loadFilterPicker()} type="button" className="text-xl py-3 md:text-lg md:py-2">Buscar</Button>
          </div>
          <div className="bg-white rounded-xl border max-h-96 overflow-auto">
            <div className="md:hidden divide-y">
              {filterPickerLoading ? (
                <div className="p-4">Carregando...</div>
              ) : filterPickerData.length===0 ? (
                <div className="p-4">Nenhum registro</div>
              ) : filterPickerData.map(a => (
                <div key={a.id} className="p-3">
                  <div className="font-medium text-base">{a.nomeCompleto}</div>
                  <div className="text-sm text-gray-600 mb-2">{a.status}</div>
                  <Button type="button" className="w-full text-xl py-3" onClick={()=>{ setFiltroAcolhidaId(a.id); setFiltroAcolhidaNome(a.nomeCompleto); setFilterPickerOpen(false); }}>Selecionar</Button>
                </div>
              ))}
            </div>
            <table className="hidden md:table w-full text-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filterPickerLoading ? (
                  <tr><td className="p-4" colSpan={3}>Carregando...</td></tr>
                ) : filterPickerData.length===0 ? (
                  <tr><td className="p-4" colSpan={3}>Nenhum registro</td></tr>
                ) : filterPickerData.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.nomeCompleto}</td>
                    <td className="p-3">{a.status}</td>
                    <td className="p-3 text-right"><Button type="button" onClick={()=>{ setFiltroAcolhidaId(a.id); setFiltroAcolhidaNome(a.nomeCompleto); setFilterPickerOpen(false); }}>Selecionar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal open={pickerOpen} onClose={()=>setPickerOpen(false)} title="Selecionar Acolhida">
        <div className="space-y-3">
          <div className="grid gap-2 grid-cols-1 md:grid-cols-[1fr_auto] items-end">
            <Input label="Buscar por nome" value={pickerNome} onChange={e=>setPickerNome(e.target.value)} />
            <Button onClick={()=>loadPicker()} type="button" className="text-xl py-3 md:text-lg md:py-2">Buscar</Button>
          </div>
          <div className="bg-white rounded-xl border max-h-96 overflow-auto">
            <div className="md:hidden divide-y">
              {pickerLoading ? (
                <div className="p-4">Carregando...</div>
              ) : pickerData.length===0 ? (
                <div className="p-4">Nenhum registro</div>
              ) : pickerData.map(a => (
                <div key={a.id} className="p-3">
                  <div className="font-medium text-base">{a.nomeCompleto}</div>
                  <div className="text-sm text-gray-600 mb-2">{a.status}</div>
                  <Button type="button" className="w-full text-xl py-3" onClick={()=>{ setForm({...form, acolhidaId:a.id}); setAcolhidaNome(a.nomeCompleto); setPickerOpen(false); }}>Selecionar</Button>
                </div>
              ))}
            </div>
            <table className="hidden md:table w-full text-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pickerLoading ? (
                  <tr><td className="p-4" colSpan={3}>Carregando...</td></tr>
                ) : pickerData.length===0 ? (
                  <tr><td className="p-4" colSpan={3}>Nenhum registro</td></tr>
                ) : pickerData.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.nomeCompleto}</td>
                    <td className="p-3">{a.status}</td>
                    <td className="p-3 text-right"><Button type="button" onClick={()=>{ setForm({...form, acolhidaId:a.id}); setAcolhidaNome(a.nomeCompleto); setPickerOpen(false); }}>Selecionar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal Saída em Grupo */}
      <Modal open={groupOpen} onClose={()=>setGroupOpen(false)} title="Saída em Grupo">
        <div className="space-y-4">
          {/* Seleção de Acolhidas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block font-medium">Acolhidas Selecionadas ({groupSelected.length})</span>
              <Button onClick={()=>{ setGroupPickerOpen(true); loadGroupPicker(); }} type="button" size="sm" className="text-base md:text-lg">Selecionar Acolhidas</Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 min-h-[60px] max-h-32 overflow-auto">
              {groupSelected.length === 0 ? (
                <p className="text-gray-500">Nenhuma acolhida selecionada</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groupSelected.map(a => (
                    <span key={a.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      {a.nomeCompleto}
                      <button type="button" onClick={()=>toggleGroupSelection(a)} className="text-blue-600 hover:text-blue-800 ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Formulário comum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block mb-1">Motivo</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={groupForm.motivo} onChange={e=>setGroupForm({...groupForm, motivo: e.target.value as any})}>
                <option value="CONSULTA">CONSULTA</option>
                <option value="EXAME">EXAME</option>
                <option value="RETORNO">RETORNO</option>
                <option value="OUTRO">OUTRO</option>
              </select>
            </label>
            <Input label="Destino" value={groupForm.destino} onChange={e=>setGroupForm({...groupForm, destino:e.target.value})} placeholder="Hospital Municipal" />
            <Input label="Profissional" value={groupForm.profissional} onChange={e=>setGroupForm({...groupForm, profissional:e.target.value})} placeholder="Dra. Ana" />
            <DateInput label="Data da saída" value={groupForm.data} onChange={(v)=>setGroupForm({...groupForm, data: v, retornoData: v && (!groupForm.retornoData || groupForm.retornoData === '') ? v : groupForm.retornoData })} />
            <TimeInput label="Hora da saída" value={groupForm.hora} onChange={(v)=>setGroupForm({...groupForm, hora:v})} placeholder="08:30" />
            <DateInput label="Data do retorno (opcional)" value={groupForm.retornoData} onChange={(v)=>setGroupForm({...groupForm, retornoData: v || groupForm.data })} />
            <TimeInput label="Hora do retorno (opcional)" value={groupForm.retornoHora} onChange={(v)=>setGroupForm({...groupForm, retornoHora: v})} placeholder="10:30" />
            <Input label="Meio de transporte" value={groupForm.meioTransporte} onChange={e=>setGroupForm({...groupForm, meioTransporte:e.target.value})} placeholder="Carro" />
            <label className="block">
              <span className="block mb-1">Responsável</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={groupForm.responsavel} onChange={e=>setGroupForm({...groupForm, responsavel: e.target.value as any})}>
                <option value="ALCILEIA_FIGUEREDO">ALCILEIA_FIGUEREDO</option>
                <option value="MARIA_ASSUNCION">MARIA_ASSUNCION</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <Input label="Observações" value={groupForm.observacoes} onChange={e=>setGroupForm({...groupForm, observacoes:e.target.value})} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse md:flex-row md:justify-end gap-3">
          <Button variant="secondary" onClick={()=>setGroupOpen(false)} className="text-xl py-3 md:text-lg md:py-2">Cancelar</Button>
          <Button onClick={saveGroup} className="text-xl py-3 md:text-lg md:py-2">Criar {groupSelected.length} Saídas</Button>
        </div>
      </Modal>

      {/* Modal Picker para Grupo */}
      <Modal open={groupPickerOpen} onClose={()=>setGroupPickerOpen(false)} title="Selecionar Acolhidas para Grupo">
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] items-end">
            <Input label="Buscar por nome" value={groupPickerNome} onChange={e=>setGroupPickerNome(e.target.value)} />
            <Button onClick={()=>loadGroupPicker()} type="button">Buscar</Button>
          </div>
          <div className="bg-white rounded-xl border max-h-96 overflow-auto">
            <div className="md:hidden divide-y">
              {groupPickerLoading ? (
                <div className="p-4">Carregando...</div>
              ) : groupPickerData.length===0 ? (
                <div className="p-4">Nenhum registro</div>
              ) : groupPickerData.map(a => {
                const isSelected = groupSelected.some(s => s.id === a.id)
                return (
                  <label key={a.id} className="flex items-center gap-3 p-3">
                    <input type="checkbox" className="w-5 h-5" checked={isSelected} onChange={()=>toggleGroupSelection({id: a.id, nomeCompleto: a.nomeCompleto})} />
                    <div className="flex-1">
                      <div className="font-medium text-base">{a.nomeCompleto}</div>
                      <div className="text-sm text-gray-600">{a.status}</div>
                    </div>
                  </label>
                )
              })}
            </div>
            <table className="hidden md:table w-full text-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">
                    <input 
                      type="checkbox" 
                      checked={groupPickerData.length > 0 && groupPickerData.every(a => groupSelected.some(s => s.id === a.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSelections = groupPickerData.filter(a => !groupSelected.some(s => s.id === a.id))
                          setGroupSelected(prev => [...prev, ...newSelections.map(a => ({id: a.id, nomeCompleto: a.nomeCompleto}))])
                        } else {
                          const idsToRemove = groupPickerData.map(a => a.id)
                          setGroupSelected(prev => prev.filter(s => !idsToRemove.includes(s.id)))
                        }
                      }}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {groupPickerLoading ? (
                  <tr><td className="p-4" colSpan={3}>Carregando...</td></tr>
                ) : groupPickerData.length===0 ? (
                  <tr><td className="p-4" colSpan={3}>Nenhum registro</td></tr>
                ) : groupPickerData.map(a => {
                  const isSelected = groupSelected.some(s => s.id === a.id)
                  return (
                    <tr key={a.id} className="border-t">
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={()=>toggleGroupSelection({id: a.id, nomeCompleto: a.nomeCompleto})}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-3">{a.nomeCompleto}</td>
                      <td className="p-3">{a.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{groupSelected.length} acolhida(s) selecionada(s)</span>
            <Button onClick={()=>setGroupPickerOpen(false)} type="button">Fechar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SaidasPage

function TimeInput({ label, value, onChange, placeholder }:{ label:string; value:string; onChange:(v:string)=>void; placeholder?:string }){
  return (
    <label className="block">
      <span className="block mb-1">{label}</span>
      <input type="time" className="w-full border rounded-lg p-3 text-lg" value={value} onChange={(e)=> onChange(e.target.value)} placeholder={placeholder} />
    </label>
  )
}

async function loadPicker(){ /* noop for TS, real implementation bound in component scope */ }

// Helpers de data/hora para fuso horário local com envio correto em ISO
function buildLocalDateTime(dateStr: string, timeStr: string): Date {
  // dateStr: yyyy-MM-dd, timeStr: HH:mm
  const [year, month, day] = dateStr.split('-').map(n=>parseInt(n,10))
  const [hour, minute] = timeStr.split(':').map(n=>parseInt(n,10))
  return new Date(year, (month-1), day, hour, minute, 0, 0)
}

// Converte Date local para ISO com offset local (ex.: 2025-08-18T10:30:00-03:00)
function toLocalOffsetIso(d: Date): string {
  const tzOffsetMin = d.getTimezoneOffset()
  const sign = tzOffsetMin > 0 ? '-' : '+'
  const abs = Math.abs(tzOffsetMin)
  const hh = String(Math.floor(abs / 60)).padStart(2,'0')
  const mm = String(abs % 60).padStart(2,'0')
  const yyyy = d.getFullYear()
  const MM = String(d.getMonth()+1).padStart(2,'0')
  const DD = String(d.getDate()).padStart(2,'0')
  const HH = String(d.getHours()).padStart(2,'0')
  const mi = String(d.getMinutes()).padStart(2,'0')
  const ss = String(d.getSeconds()).padStart(2,'0')
  return `${yyyy}-${MM}-${DD}T${HH}:${mi}:${ss}${sign}${hh}:${mm}`
}

function formatDateTimeBR(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { hour12: false })
}

function formatResponsavel(r?: Saida['responsavel']): string {
  if (!r) return '-'
  return r.replace(/_/g,' ')
}


