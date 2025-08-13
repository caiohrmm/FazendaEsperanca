import axios from "axios";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import DateInput from "../../components/ui/DateInput";
import { useToast } from "../../system/toast";
import { loadingBus } from "../../system/loadingBus";

type Acolhida = {
  id: number;
  nomeCompleto: string;
  dataNascimento?: string;
  dataEntrada?: string;
  status: "ATIVA" | "EGRESSA";
};

export default function AcolhidasPage() {
  const toast = useToast();
  const [data, setData] = useState<Acolhida[]>([]);
  const [nome, setNome] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODAS" | "ATIVA" | "EGRESSA">("TODAS");
  const [dataEntradaDe, setDataEntradaDe] = useState<string | null>(null);
  const [dataEntradaAte, setDataEntradaAte] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Acolhida | null>(null);
  const [form, setForm] = useState({
    nomeCompleto: "",
    dataNascimento: "",
    dataEntrada: "",
    documento: "",
    telefone: "",
    status: "ATIVA" as "ATIVA" | "EGRESSA",
    fotoUrl: "",
    observacoes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const todayStr = new Date().toISOString().slice(0, 10);
  const addYears = (yyyyMmDd: string, years: number) => {
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    const date = new Date(Date.UTC((y || 0) + years, (m || 1) - 1, d || 1));
    return date.toISOString().slice(0, 10);
  };

  const load = async () => {
    setLoading(true);
    loadingBus.start();
    try {
      const { data } = await axios.get("/acolhidas", {
        params: {
          page: 0,
          size: 20,
          nome: nome || undefined,
          status: statusFilter !== 'TODAS' ? statusFilter : undefined,
          dataEntradaDe: dataEntradaDe || undefined,
          dataEntradaAte: dataEntradaAte || undefined,
        },
      });
      const content = Array.isArray(data?.content) ? data.content : [];
      setData(content);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Falha ao carregar acolhidas";
      toast.error(msg);
    } finally {
      setLoading(false);
      loadingBus.end();
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nomeCompleto: "",
      dataNascimento: "",
      dataEntrada: "",
      documento: "",
      telefone: "",
      status: "ATIVA",
      fotoUrl: "",
      observacoes: "",
    });
    setOpen(true);
  };
  const openEdit = (a: Acolhida) => {
    setEditing(a);
    setForm({
      nomeCompleto: a.nomeCompleto,
      dataNascimento: a.dataNascimento || "",
      dataEntrada: a.dataEntrada || "",
      documento: (a as any).documento || "",
      telefone: (a as any).telefone || "",
      status: a.status,
      fotoUrl: (a as any).fotoUrl || "",
      observacoes: (a as any).observacoes || "",
    });
    setOpen(true);
  };
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nomeCompleto.trim()) e.nomeCompleto = "Nome é obrigatório";
    if (form.dataNascimento) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dataNascimento))
        e.dataNascimento = "Formato YYYY-MM-DD";
      else {
        const eighteen = addYears(form.dataNascimento, 18);
        if (eighteen > todayStr)
          e.dataNascimento = "Acolhida deve ter 18 anos ou mais";
      }
    }
    if (form.dataEntrada) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dataEntrada))
        e.dataEntrada = "Formato YYYY-MM-DD";
      else if (form.dataEntrada > todayStr)
        e.dataEntrada = "Data de entrada não pode ser futura";
      else if (form.dataNascimento && form.dataEntrada < form.dataNascimento)
        e.dataEntrada = "Entrada não pode ser antes do nascimento";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const save = async () => {
    if (!validate()) return;
    const payload = {
      ...form,
      documento: form.documento || null,
      dataNascimento: form.dataNascimento || null,
      dataEntrada: form.dataEntrada || null,
      fotoUrl: form.fotoUrl || null,
      observacoes: form.observacoes || null,
    };
    loadingBus.start();
    try {
      if (editing) {
        await axios.put(`/acolhidas/${editing.id}`, payload);
      } else {
        await axios.post("/acolhidas", payload);
      }
      setOpen(false);
      toast.success("Salvo com sucesso");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Erro ao salvar");
    } finally {
      loadingBus.end();
    }
  };
  const remove = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    loadingBus.start();
    try {
      await axios.delete(`/acolhidas/${id}`);
      toast.success("Excluído com sucesso");
      await load();
    } catch (e: any) {
      if (e?.response?.status === 409)
        toast.error(
          "Não é possível excluir: existem saídas médicas vinculadas."
        );
      else toast.error(e?.response?.data?.message ?? "Erro ao excluir");
    } finally {
      loadingBus.end();
    }
  };

  return (
      <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-4 items-end">
        <Input
          label="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Buscar por nome"
        />
        <label className="block">
          <span className="block mb-1">Status</span>
          <select className="w-full border rounded-lg p-3 text-lg" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)}>
            <option value="TODAS">Todas</option>
            <option value="ATIVA">Ativas</option>
            <option value="EGRESSA">Egressas</option>
          </select>
        </label>
        <DateInput label="Entrada de" value={dataEntradaDe} onChange={setDataEntradaDe} />
        <DateInput label="Entrada até" value={dataEntradaAte} onChange={setDataEntradaAte} />
        <div className="md:col-span-2 flex gap-2">
          <Button onClick={load} variant="primary" size="lg">Aplicar filtros</Button>
          <Button onClick={()=>{ setNome(""); setStatusFilter('TODAS'); setDataEntradaDe(null); setDataEntradaAte(null); load(); }} variant="secondary" size="lg">Limpar</Button>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={openCreate} size="lg">Nova acolhida</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-lg">Carregando...</div>
        ) : (
          <table className="w-full text-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Documento</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Entrada</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.nomeCompleto}</td>
                  <td className="p-3">{formatCpf((a as any).documento)}</td>
                  <td className="p-3">{renderStatus(a.status)}</td>
                  <td className="p-3">{formatDateBr(a.dataEntrada)}</td>
                  <td className="p-3 text-right">
                    <Button onClick={() => openEdit(a)} className="mr-2">
                      Editar
                    </Button>
                    <Button onClick={() => remove(a.id)} variant="danger">
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td className="p-4" colSpan={4}>
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar acolhida" : "Nova acolhida"}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Nome completo"
              value={form.nomeCompleto}
              onChange={(e) =>
                setForm({ ...form, nomeCompleto: e.target.value })
              }
            />
            {errors.nomeCompleto && (
              <div className="text-red-600 text-sm mt-1">
                {errors.nomeCompleto}
              </div>
            )}
          </div>
          <div>
            <DateInput
              label="Data de nascimento"
              value={form.dataNascimento || null}
              onChange={(v) => setForm({ ...form, dataNascimento: v || "" })}
            />
            {errors.dataNascimento && (
              <div className="text-red-600 text-sm mt-1">
                {errors.dataNascimento}
              </div>
            )}
          </div>
          <div>
            <DateInput
              label="Data de entrada"
              value={form.dataEntrada || null}
              onChange={(v) => setForm({ ...form, dataEntrada: v || "" })}
            />
            {errors.dataEntrada && (
              <div className="text-red-600 text-sm mt-1">
                {errors.dataEntrada}
              </div>
            )}
          </div>
          <div>
            <CpfInput
              label="CPF (somente números)"
              value={form.documento}
              onChange={(v) => setForm({ ...form, documento: v })}
            />
            {errors.documento && (
              <div className="text-red-600 text-sm mt-1">
                {errors.documento}
              </div>
            )}
          </div>
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
          <label className="block">
            <span className="block mb-1">Status</span>
            <select
              className="w-full border rounded-lg p-3 text-lg"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as any })
              }
            >
              <option value="ATIVA">ATIVA</option>
              <option value="EGRESSA">EGRESSA</option>
            </select>
          </label>
          <Input
            label="Foto URL"
            value={form.fotoUrl}
            onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
          />
          <Input
            label="Observações"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          />
        </div>
        <div className="mt-6 flex justify-between items-center gap-3">
          <div className="text-red-600 text-sm">
            {Object.values(errors)[0] ?? ""}
          </div>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar</Button>
        </div>
      </Modal>
    </div>
  );
}

function renderStatus(s: "ATIVA"|"EGRESSA"){ return s === 'ATIVA' ? 'Ativa' : 'Egressa' }
function formatDateBr(v?: string){ if (!v) return '-'; const d = new Date(v+'T00:00:00Z'); return d.toLocaleDateString('pt-BR') }
function formatCpf(v?: string){ if (!v) return '-'; const digits = v.replace(/\D/g,'').padEnd(11,'_').slice(0,11); return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9,11)}` }

function CpfInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const mask = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    let out = digits;
    if (digits.length > 3) out = digits.slice(0, 3) + "." + digits.slice(3);
    if (digits.length > 6) out = out.slice(0, 7) + "." + digits.slice(6);
    if (digits.length > 9) out = out.slice(0, 11) + "-" + digits.slice(9);
    return { masked: out, raw: digits };
  };
  const display = mask(value).masked;
  return (
    <label className="block">
      <span className="block mb-1">{label}</span>
      <input
        className="w-full border rounded-lg p-3 text-lg"
        value={display}
        onChange={(e) => onChange(mask(e.target.value).masked)}
        placeholder="000.000.000-00"
      />
    </label>
  );
}
