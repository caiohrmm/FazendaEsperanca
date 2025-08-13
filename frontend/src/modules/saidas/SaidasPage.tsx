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
  motivo: 'CONSULTA'|'EXAME'|'RETORNO'|'OUTRO'
  destino: string
  dataHoraSaida: string
  dataHoraRetorno?: string
  responsavel?: 'ALCILEIA_FIGUEREDO'|'MARIA_ASSUNCION'
  duracaoMinutos?: number
}

export default function SaidasPage(){
  const toast = useToast()
  const [lista, setLista] = useState<Saida[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Saida | null>(null)
  const [form, setForm] = useState({ acolhidaId: 0, motivo: 'CONSULTA' as Saida['motivo'], destino: '', profissional: '', data: null as string | null, hora: '', meioTransporte:'', observacoes:'', responsavel: 'ALCILEIA_FIGUEREDO' as Saida['responsavel'], retornoData: null as string | null, retornoHora: '' })
  const [acolhidaNome, setAcolhidaNome] = useState<string>('')
  const [acolhidaNames, setAcolhidaNames] = useState<Record<number,string>>({})

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

  const load = async()=>{
    setLoading(true); loadingBus.start()
    try{
      const { data } = await axios.get('/saidas-medicas', { params: { page:0, size:20 }})
      const content = data.content?.map((d:any)=> ({ ...d })) ?? []
      setLista(content)
      // carregar nomes das acolhidas exibidas
      const ids: number[] = Array.from(new Set((content as any[]).map(s=> s.acolhidaId).filter((v:any)=> typeof v==='number')))
      const nameEntries = await Promise.allSettled(ids.map(id=> axios.get(`/acolhidas/${id}`).then(res=> [id, res.data?.nomeCompleto || `ID ${id}`] as [number,string])))
      const nameMap: Record<number,string> = {}
      nameEntries.forEach(r=>{ if (r.status==='fulfilled'){ const [id, nome] = r.value; nameMap[id]=nome } })
      setAcolhidaNames(prev=> ({ ...prev, ...nameMap }))
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

  useEffect(()=>{ load() },[])

  const openCreate = ()=>{ setEditing(null); setForm({ acolhidaId: 0, motivo:'CONSULTA', destino:'', profissional:'', data:null, hora:'', meioTransporte:'', observacoes:'', responsavel:'ALCILEIA_FIGUEREDO', retornoData:null, retornoHora:'' }); setAcolhidaNome(''); setOpen(true) }
  const openEdit = (s: Saida)=>{ setEditing(s); const dt = new Date(s.dataHoraSaida); const isoDate = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,10); const time = dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false}); const retornoDt = s.dataHoraRetorno ? new Date(s.dataHoraRetorno) : null; const retornoDate = retornoDt ? new Date(retornoDt.getTime() - retornoDt.getTimezoneOffset()*60000).toISOString().slice(0,10) : null; const retornoHora = retornoDt ? retornoDt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false}) : '';
    setForm({ acolhidaId: s.acolhidaId, motivo:s.motivo, destino:s.destino, profissional:(s as any).profissional||'', data: isoDate, hora: time, meioTransporte:(s as any).meioTransporte||'', observacoes:(s as any).observacoes||'', responsavel: s.responsavel||'ALCILEIA_FIGUEREDO', retornoData: retornoDate, retornoHora });
    // Buscar nome da acolhida para exibir
    axios.get(`/acolhidas/${s.acolhidaId}`).then(res=> setAcolhidaNome(res.data?.nomeCompleto || '')).catch(()=> setAcolhidaNome(''));
    setOpen(true)
  }
  const validate = ()=>{
    if (!form.acolhidaId || form.acolhidaId <= 0) { toast.error('Informe a acolhidaId'); return false }
    if (!form.destino.trim()) { toast.error('Informe o destino'); return false }
    if (!form.data || !/^\d{4}-\d{2}-\d{2}$/.test(form.data)) { toast.error('Data inválida'); return false }
    if (!form.hora || !/^\d{2}:\d{2}$/.test(form.hora)) { toast.error('Hora inválida'); return false }
    const [hh,mm] = form.hora.split(':').map(n=>parseInt(n,10));
    if (isNaN(hh) || isNaN(mm) || hh<0 || hh>23 || mm<0 || mm>59) { toast.error('Hora inválida'); return false }
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
    const dataHoraSaida = buildLocalDateTime(form.data!, form.hora).toISOString()
    const payload:any = { acolhidaId: form.acolhidaId, motivo: form.motivo, destino: form.destino, profissional: form.profissional || null, dataHoraSaida, meioTransporte: form.meioTransporte || null, observacoes: form.observacoes || null, responsavel: form.responsavel }
    if (form.retornoData && form.retornoHora) {
      payload.dataHoraRetorno = buildLocalDateTime(form.retornoData, form.retornoHora).toISOString()
    }
    loadingBus.start()
    try{
      if (editing) { await axios.put(`/saidas-medicas/${editing.id}`, payload) }
      else { await axios.post('/saidas-medicas', payload) }
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
    setGroupForm({ motivo:'CONSULTA', destino:'', profissional:'', data:null, hora:'', meioTransporte:'', observacoes:'', responsavel:'ALCILEIA_FIGUEREDO' })
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
    return true
  }

  const saveGroup = async()=>{
    if (!validateGroup()) return
    const dataHoraSaida = new Date(`${groupForm.data}T${groupForm.hora}:00Z`).toISOString()
    
    loadingBus.start()
    try{
      // Criar uma saída para cada acolhida selecionada
      const promises = groupSelected.map(acolhida => {
        const payload = { 
          acolhidaId: acolhida.id, 
          motivo: groupForm.motivo, 
          destino: groupForm.destino, 
          profissional: groupForm.profissional || null, 
          dataHoraSaida, 
          meioTransporte: groupForm.meioTransporte || null, 
          observacoes: groupForm.observacoes || null, 
          responsavel: groupForm.responsavel 
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
        <div className="flex gap-2">
          <Button onClick={openGroupCreate}>Saída em grupo</Button>
          <Button onClick={openCreate}>Nova saída</Button>
          <Button onClick={load} variant="secondary">Atualizar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-lg">Carregando...</div>
        ) : (
          <table className="w-full text-lg">
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
                  <td className="p-3">{acolhidaNames[s.acolhidaId] || `ID ${s.acolhidaId}`}</td>
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
        )}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title={editing? 'Editar saída' : 'Nova saída'}>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
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
            <DateInput label="Data da saída" value={form.data} onChange={(v)=>setForm({...form, data: v})} />
            <TimeInput label="Hora da saída (HH:mm)" value={form.hora} onChange={(v)=>setForm({...form, hora:v})} placeholder="08:30" />
            <DateInput label="Data do retorno (opcional)" value={form.retornoData} onChange={(v)=>setForm({...form, retornoData: v})} />
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
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={()=>setOpen(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </div>
      </Modal>

      <Modal open={pickerOpen} onClose={()=>setPickerOpen(false)} title="Selecionar Acolhida">
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] items-end">
            <Input label="Buscar por nome" value={pickerNome} onChange={e=>setPickerNome(e.target.value)} />
            <Button onClick={()=>loadPicker()} type="button">Buscar</Button>
          </div>
          <div className="bg-white rounded-xl border max-h-96 overflow-auto">
            <table className="w-full text-lg">
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
              <Button onClick={()=>{ setGroupPickerOpen(true); loadGroupPicker(); }} type="button" size="sm">Selecionar Acolhidas</Button>
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
          <div className="grid md:grid-cols-2 gap-4">
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
            <DateInput label="Data da saída" value={groupForm.data} onChange={(v)=>setGroupForm({...groupForm, data: v})} />
            <TimeInput label="Hora da saída (HH:mm)" value={groupForm.hora} onChange={(v)=>setGroupForm({...groupForm, hora:v})} placeholder="08:30" />
            <DateInput label="Data do retorno (opcional)" value={groupForm.retornoData} onChange={(v)=>setGroupForm({...groupForm, retornoData: v})} />
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
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={()=>setGroupOpen(false)}>Cancelar</Button>
          <Button onClick={saveGroup}>Criar {groupSelected.length} Saídas</Button>
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
            <table className="w-full text-lg">
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

function TimeInput({ label, value, onChange, placeholder }:{ label:string; value:string; onChange:(v:string)=>void; placeholder?:string }){
  const mask = (v:string)=>{
    const d = v.replace(/\D/g,'').slice(0,4)
    let h = d.slice(0,2)
    let m = d.slice(2,4)
    if (h.length===2) {
      let hi = parseInt(h,10)
      if (isNaN(hi)) hi = 0
      if (hi > 23) h = '23'
    }
    if (m.length===2) {
      let mi = parseInt(m,10)
      if (isNaN(mi)) mi = 0
      if (mi > 59) m = '59'
    }
    return m.length>0 ? `${h.padStart(2,'0')}:${m.padStart(2,'0')}` : h
  }
  const display = value
  return (
    <label className="block">
      <span className="block mb-1">{label}</span>
      <input className="w-full border rounded-lg p-3 text-lg" value={display} onChange={(e)=> onChange(mask(e.target.value))} placeholder={placeholder} inputMode="numeric" />
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

function formatDateTimeBR(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { hour12: false })
}

function formatResponsavel(r?: Saida['responsavel']): string {
  if (!r) return '-'
  return r.replace(/_/g,' ')
}


