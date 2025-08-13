import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, token } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, senha)
      nav('/')
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Falha no login')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (token) nav('/', { replace: true })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white shadow rounded-xl p-8 w-full max-w-md space-y-6" autoComplete="off" noValidate>
        <img src="/logo.png" alt="Fazenda Esperança" className="h-16 w-auto mx-auto" />
        <h1 className="text-2xl font-bold text-center">Fazenda Esperança</h1>
        <div>
          <label className="block text-lg mb-1">E-mail</label>
          <input className="w-full border rounded-lg p-3 text-lg" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username" inputMode="email" />
        </div>
        <div>
          <label className="block text-lg mb-1">Senha</label>
          <input className="w-full border rounded-lg p-3 text-lg" type="password" value={senha} onChange={e=>setSenha(e.target.value)} required autoComplete="current-password" />
        </div>
        {error && <div className="text-red-600 text-center">{error}</div>}
        <button disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xl py-3 rounded-lg">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <div className="text-center text-sm text-gray-600">Precisa de acesso? Contate um administrador.</div>
      </form>
    </div>
  )
}


