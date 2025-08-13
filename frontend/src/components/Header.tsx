import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Header() {
  const { logout } = useAuth()
  const nav = useNavigate()
  return (
    <header className="bg-white/90 backdrop-blur border-b sticky top-0 z-30">
      <div className="container flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Fazenda Esperança" className="h-10 w-auto" />
          <span className="text-2xl font-extrabold text-brand-700">Fazenda Esperança</span>
        </Link>
        <nav className="flex gap-2 text-lg">
          <NavLink to="/" className={({isActive})=>`px-3 py-2 rounded-lg ${isActive?'bg-brand-100 text-brand-800':'hover:bg-gray-100'}`}>Início</NavLink>
          <NavLink to="/acolhidas" className={({isActive})=>`px-3 py-2 rounded-lg ${isActive?'bg-brand-100 text-brand-800':'hover:bg-gray-100'}`}>Acolhidas</NavLink>
          <NavLink to="/saidas-medicas" className={({isActive})=>`px-3 py-2 rounded-lg ${isActive?'bg-brand-100 text-brand-800':'hover:bg-gray-100'}`}>Saídas</NavLink>
          <NavLink to="/transacoes" className={({isActive})=>`px-3 py-2 rounded-lg ${isActive?'bg-brand-100 text-brand-800':'hover:bg-gray-100'}`}>Financeiro</NavLink>
          <NavLink to="/relatorios" className={({isActive})=>`px-3 py-2 rounded-lg ${isActive?'bg-brand-100 text-brand-800':'hover:bg-gray-100'}`}>Relatórios</NavLink>
        </nav>
        <button onClick={()=>{logout(); nav('/login')}} className="text-lg bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg">Sair</button>
      </div>
    </header>
  )
}


