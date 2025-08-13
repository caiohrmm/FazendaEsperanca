import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(nome, email, senha)
      nav('/login')
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Falha no cadastro')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white shadow rounded-xl p-8 w-full max-w-md space-y-6" autoComplete="off">
        <h1 className="text-2xl font-bold text-center">Criar conta</h1>
        <div>
          <label className="block text-lg mb-1">Nome</label>
          <input className="w-full border rounded-lg p-3 text-lg" value={nome} onChange={e=>setNome(e.target.value)} required autoComplete="new-name" />
        </div>
        <div>
          <label className="block text-lg mb-1">E-mail</label>
          <input className="w-full border rounded-lg p-3 text-lg" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="new-email" inputMode="email" />
        </div>
        <div>
          <label className="block text-lg mb-1">Senha</label>
          <input className="w-full border rounded-lg p-3 text-lg" type="password" value={senha} onChange={e=>setSenha(e.target.value)} required autoComplete="new-password" />
        </div>
        {error && <div className="text-red-600 text-center">{error}</div>}
        <button disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xl py-3 rounded-lg">
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
    </div>
  )
}


