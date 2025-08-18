import axios from 'axios'
import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import DateInput from '../../components/ui/DateInput'
import { useToast } from '../../system/toast'
import { loadingBus } from '../../system/loadingBus'

type Transacao = {
  id: number
  tipo: 'DOACAO_EXTERNA'|'RECEBIMENTO_ACOLHIDA'
  valor: number
  formaPagamento: 'PIX'|'DINHEIRO'|'DEPOSITO'|'CARTAO'|'TRANSFERENCIA'
  numeroRecibo: string
  status: 'PENDENTE_ASSINATURA'|'CONCLUIDA'|'CANCELADA'
  dataHora: string
  arquivoAssinadoPath?: string | null
}

const tipoLabel: Record<Transacao['tipo'], string> = {
  DOACAO_EXTERNA: 'Doação Externa',
  RECEBIMENTO_ACOLHIDA: 'Recebimento de Acolhida'
}
const formaLabel: Record<Transacao['formaPagamento'], string> = {
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
  DEPOSITO: 'Depósito',
  CARTAO: 'Cartão',
  TRANSFERENCIA: 'Transferência'
}
const statusLabel: Record<Transacao['status'], string> = {
  PENDENTE_ASSINATURA: 'Pendente de Assinatura',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada'
}

export default function TransacoesPage(){
  const toast = useToast()
  const [lista, setLista] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(false)

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<''|Transacao['tipo']>('')
  const [filtroForma, setFiltroForma] = useState<''|Transacao['formaPagamento']>('')
  const [filtroStatus, setFiltroStatus] = useState<''|Transacao['status']>('')
  const [filtroAcolhidaId, setFiltroAcolhidaId] = useState<number | null>(null)
  const [filtroAcolhidaNome, setFiltroAcolhidaNome] = useState<string>('')
  const [filtroDe, setFiltroDe] = useState<string | null>(null)
  const [filtroAte, setFiltroAte] = useState<string | null>(null)

  // Picker para filtro por acolhida
  const [filterPickerOpen, setFilterPickerOpen] = useState(false)
  const [filterPickerNome, setFilterPickerNome] = useState('')
  const [filterPickerLoading, setFilterPickerLoading] = useState(false)
  const [filterPickerData, setFilterPickerData] = useState<Array<{id:number; nomeCompleto:string; status:string}>>([])

  // Modal criação
  const [openCreate, setOpenCreate] = useState(false)
  const [form, setForm] = useState({ tipo: 'DOACAO_EXTERNA' as Transacao['tipo'], origemNome: '', origemDocumento: '', acolhidaId: 0, acolhidaNome: '', valor: '', data: null as string | null, hora: '', formaPagamento: 'PIX' as Transacao['formaPagamento'], descricao: '' })
  const [formAcolhidaPickerOpen, setFormAcolhidaPickerOpen] = useState(false)
  const [formPickerNome, setFormPickerNome] = useState('')
  const [formPickerLoading, setFormPickerLoading] = useState(false)
  const [formPickerData, setFormPickerData] = useState<Array<{id:number; nomeCompleto:string; status:string}>>([])

  // Removido fluxo de upload assinado (não é mais necessário)

  const load = async()=>{
    setLoading(true); loadingBus.start()
    try{
      const params:any = { page:0, size:20 }
      if (filtroTipo) params.tipo = filtroTipo
      if (filtroForma) params.formaPagamento = filtroForma
      if (filtroStatus) params.status = filtroStatus
      if (filtroAcolhidaId) params.acolhidaId = filtroAcolhidaId
      if (filtroDe) params.de = buildLocalDateTime(filtroDe, '00:00').toISOString()
      if (filtroAte) params.ate = buildLocalDateTime(filtroAte, '23:59').toISOString()
      const { data } = await axios.get('/transacoes', { params })
      setLista(data.content ?? [])
    } catch(e:any){ toast.error('Falha ao carregar transações') }
    finally { setLoading(false); loadingBus.end() }
  }

  useEffect(()=>{ load() },[])

  const baixarRecibo = async (id:number)=>{
    const res = await axios.get(`/transacoes/${id}/recibo/pdf`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `recibo-${id}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  const cancelar = async(id:number)=>{
    if (!confirm('Tem certeza que deseja cancelar esta transação?')) return
    loadingBus.start()
    try{ await axios.post(`/transacoes/${id}/cancelar`); toast.success('Transação cancelada'); await load() }
    catch(e:any){ toast.error(e?.response?.data?.message ?? 'Falha ao cancelar') }
    finally { loadingBus.end() }
  }

  const save = async()=>{
    // validação mínima
    if (!form.tipo) { toast.error('Informe o tipo'); return }
    if (form.tipo === 'DOACAO_EXTERNA'){
      if (!form.origemNome.trim()) { toast.error('Informe o nome do doador'); return }
    } else {
      if (!form.acolhidaId || form.acolhidaId <= 0) { toast.error('Selecione a acolhida'); return }
    }
    const valorNum = Number(String(form.valor).replace(',', '.'))
    if (!isFinite(valorNum) || valorNum <= 0) { toast.error('Valor inválido'); return }
    const payload:any = {
      tipo: form.tipo,
      valor: valorNum,
      formaPagamento: form.formaPagamento,
      descricao: form.descricao || null
    }
    if (form.tipo === 'DOACAO_EXTERNA') {
      payload.origemNome = form.origemNome
      payload.origemDocumento = form.origemDocumento || null
    } else {
      payload.acolhidaId = form.acolhidaId
    }
    if (form.data && form.hora) payload.dataHora = buildLocalDateTime(form.data, form.hora).toISOString()

    loadingBus.start()
    try{
      await axios.post('/transacoes', payload)
      setOpenCreate(false); toast.success('Transação criada'); await load()
    } catch(e:any){ toast.error(e?.response?.data?.message ?? 'Erro ao criar transação') }
    finally { loadingBus.end() }
  }

  // uploadAssinado removido

  const excluir = async(id:number)=>{
    if (!confirm('Excluir esta transação? Esta ação não pode ser desfeita.')) return
    loadingBus.start()
    try{ await axios.delete(`/transacoes/${id}`); toast.success('Transação excluída'); await load() }
    catch(e:any){ toast.error(e?.response?.data?.message ?? 'Falha ao excluir') }
    finally { loadingBus.end() }
  }

  // pickers
  const loadFilterPicker = async()=>{
    setFilterPickerLoading(true)
    try{
      const { data } = await axios.get('/acolhidas', { params: { page:0, size:50, nome: filterPickerNome || undefined, status: 'ATIVA' }})
      setFilterPickerData(Array.isArray(data?.content) ? data.content : [])
    } finally { setFilterPickerLoading(false) }
  }
  const loadFormPicker = async()=>{
    setFormPickerLoading(true)
    try{
      const { data } = await axios.get('/acolhidas', { params: { page:0, size:50, nome: formPickerNome || undefined, status: 'ATIVA' }})
      setFormPickerData(Array.isArray(data?.content) ? data.content : [])
    } finally { setFormPickerLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <div className="flex gap-2">
          <Button onClick={()=>setOpenCreate(true)}>Nova transação</Button>
          <Button onClick={load} variant="secondary">Atualizar</Button>
        </div>
      </div>
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b">
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block">
                <span className="block mb-1">Acolhida (opcional)</span>
                <div className="flex gap-2">
                  <input className="flex-1 border rounded-lg p-3 text-lg bg-gray-50" value={filtroAcolhidaNome || (filtroAcolhidaId?`ID ${filtroAcolhidaId}`:'')} readOnly placeholder="Selecione a acolhida" />
                  {filtroAcolhidaId && (<Button type="button" variant="secondary" onClick={()=>{ setFiltroAcolhidaId(null); setFiltroAcolhidaNome('') }}>Limpar</Button>)}
                  <Button type="button" onClick={()=>{ setFilterPickerOpen(true); loadFilterPicker(); }}>Selecionar</Button>
                </div>
              </label>
            </div>
            <label className="block">
              <span className="block mb-1">Tipo</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={filtroTipo} onChange={e=> setFiltroTipo(e.target.value as any)}>
                <option value="">Todos</option>
                <option value="DOACAO_EXTERNA">{tipoLabel['DOACAO_EXTERNA']}</option>
                <option value="RECEBIMENTO_ACOLHIDA">{tipoLabel['RECEBIMENTO_ACOLHIDA']}</option>
              </select>
            </label>
            <label className="block">
              <span className="block mb-1">Forma</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={filtroForma} onChange={e=> setFiltroForma(e.target.value as any)}>
                <option value="">Todas</option>
                <option value="PIX">{formaLabel['PIX']}</option>
                <option value="DINHEIRO">{formaLabel['DINHEIRO']}</option>
                <option value="DEPOSITO">{formaLabel['DEPOSITO']}</option>
                <option value="CARTAO">{formaLabel['CARTAO']}</option>
                <option value="TRANSFERENCIA">{formaLabel['TRANSFERENCIA']}</option>
              </select>
            </label>
            <label className="block">
              <span className="block mb-1">Status</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={filtroStatus} onChange={e=> setFiltroStatus(e.target.value as any)}>
                <option value="">Todos</option>
                <option value="PENDENTE_ASSINATURA">{statusLabel['PENDENTE_ASSINATURA']}</option>
                <option value="CONCLUIDA">{statusLabel['CONCLUIDA']}</option>
                <option value="CANCELADA">{statusLabel['CANCELADA']}</option>
              </select>
            </label>
            <label className="block">
              <span className="block mb-1">De</span>
              <DateInput label="" value={filtroDe} onChange={setFiltroDe} />
            </label>
            <label className="block">
              <span className="block mb-1">Até</span>
              <DateInput label="" value={filtroAte} onChange={setFiltroAte} />
            </label>
            <div className="md:col-span-4 flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={()=>{ setFiltroAcolhidaId(null); setFiltroAcolhidaNome(''); setFiltroTipo(''); setFiltroForma(''); setFiltroStatus(''); setFiltroDe(null); setFiltroAte(null); load(); }}>Limpar</Button>
              <Button type="button" onClick={load}>Buscar</Button>
            </div>
          </div>
        </div>
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
                  <th className="text-left p-3">Assinado</th>
                  <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(t=> (
              <tr key={t.id} className="border-t">
                <td className="p-3">{tipoLabel[t.tipo]}</td>
                <td className="p-3">R$ {t.valor.toFixed(2)}</td>
                <td className="p-3">{formaLabel[t.formaPagamento]}</td>
                <td className="p-3">{t.numeroRecibo}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm ${t.status==='CONCLUIDA' ? 'bg-emerald-100 text-emerald-800' : t.status==='CANCELADA' ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-800'}`}>
                    <span className={`h-2 w-2 rounded-full ${t.status==='CONCLUIDA' ? 'bg-emerald-500' : t.status==='CANCELADA' ? 'bg-gray-500' : 'bg-amber-500'}`}></span>
                    {statusLabel[t.status]}
                  </span>
                </td>
                <td className="p-3">
                  {t.status === 'CONCLUIDA' ? (
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800">Assinado</span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm bg-amber-100 text-amber-800">Pendente</span>
                  )}
                </td>
                <td className="p-3">{new Date(t.dataHora).toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={()=>baixarRecibo(t.id)} size="sm">PDF</Button>
                    {t.status === 'PENDENTE_ASSINATURA' && (
                      <Button onClick={()=>cancelar(t.id)} variant="danger" size="sm">Cancelar</Button>
                    )}
                    <Button onClick={()=>excluir(t.id)} variant="danger" size="sm">Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!loading && lista.length===0) && (
              <tr><td className="p-4" colSpan={7}>Nenhum registro</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Transação */}
      <Modal open={openCreate} onClose={()=>setOpenCreate(false)} title="Nova Transação">
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block mb-1">Tipo</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={form.tipo} onChange={e=> setForm({...form, tipo: e.target.value as any })}>
                <option value="DOACAO_EXTERNA">{tipoLabel['DOACAO_EXTERNA']}</option>
                <option value="RECEBIMENTO_ACOLHIDA">{tipoLabel['RECEBIMENTO_ACOLHIDA']}</option>
              </select>
            </label>
            <Input label="Valor (R$)" value={form.valor} onChange={e=> setForm({...form, valor: e.target.value})} placeholder="100,00" inputMode="decimal" />
            <label className="block">
              <span className="block mb-1">Forma de pagamento</span>
              <select className="w-full border rounded-lg p-3 text-lg" value={form.formaPagamento} onChange={e=> setForm({...form, formaPagamento: e.target.value as any })}>
                <option value="PIX">{formaLabel['PIX']}</option>
                <option value="DINHEIRO">{formaLabel['DINHEIRO']}</option>
                <option value="DEPOSITO">{formaLabel['DEPOSITO']}</option>
                <option value="CARTAO">{formaLabel['CARTAO']}</option>
                <option value="TRANSFERENCIA">{formaLabel['TRANSFERENCIA']}</option>
              </select>
            </label>
            <Input label="Descrição (opcional)" value={form.descricao} onChange={e=> setForm({...form, descricao: e.target.value})} />

            {form.tipo === 'DOACAO_EXTERNA' ? (
              <>
                <Input label="Nome do doador" value={form.origemNome} onChange={e=> setForm({...form, origemNome: e.target.value})} placeholder="Maria Silva" />
                <Input label="Documento (opcional)" value={form.origemDocumento} onChange={e=> setForm({...form, origemDocumento: e.target.value})} placeholder="CPF/CNPJ" />
              </>
            ) : (
              <>
                <label className="block md:col-span-2">
                  <span className="block mb-1">Acolhida</span>
                  <div className="flex gap-2">
                    <input className="flex-1 border rounded-lg p-3 text-lg bg-gray-50" value={form.acolhidaNome || ''} readOnly placeholder="Selecione a acolhida" />
                    <Button onClick={()=>{ setFormAcolhidaPickerOpen(true); loadFormPicker(); }} type="button">Selecionar</Button>
                  </div>
                </label>
              </>
            )}

            <DateInput label="Data (opcional)" value={form.data} onChange={(v)=> setForm({...form, data: v })} />
            <TimeInput label="Hora (opcional)" value={form.hora} onChange={(v)=> setForm({...form, hora: v })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={()=>setOpenCreate(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </div>
      </Modal>

      {/* Picker Acolhida para filtros */}
      <Modal open={filterPickerOpen} onClose={()=>setFilterPickerOpen(false)} title="Selecionar Acolhida (Filtro)">
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] items-end">
            <Input label="Buscar por nome" value={filterPickerNome} onChange={e=>setFilterPickerNome(e.target.value)} />
            <Button onClick={()=>loadFilterPicker()} type="button">Buscar</Button>
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

      {/* Picker Acolhida para formulário */}
      <Modal open={formAcolhidaPickerOpen} onClose={()=>setFormAcolhidaPickerOpen(false)} title="Selecionar Acolhida">
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] items-end">
            <Input label="Buscar por nome" value={formPickerNome} onChange={e=>setFormPickerNome(e.target.value)} />
            <Button onClick={()=>loadFormPicker()} type="button">Buscar</Button>
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
                {formPickerLoading ? (
                  <tr><td className="p-4" colSpan={3}>Carregando...</td></tr>
                ) : formPickerData.length===0 ? (
                  <tr><td className="p-4" colSpan={3}>Nenhum registro</td></tr>
                ) : formPickerData.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.nomeCompleto}</td>
                    <td className="p-3">{a.status}</td>
                     <td className="p-3 text-right"><Button type="button" onClick={()=>{ setForm({...form, acolhidaId:a.id, acolhidaNome: a.nomeCompleto}); setFormAcolhidaPickerOpen(false); }}>Selecionar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Fluxo de upload removido */}
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


