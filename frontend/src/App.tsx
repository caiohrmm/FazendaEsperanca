import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ToastProvider } from './system/toast'
import GlobalLoading from './components/GlobalLoading'
import LoginPage from './auth/LoginPage'
import DashboardPage from './dashboard/DashboardPage'
import AcolhidasPage from './modules/acolhidas/AcolhidasPage'
import SaidasPage from './modules/saidas/SaidasPage'
import TransacoesPage from './modules/transacoes/TransacoesPage'
import RelatoriosPage from './modules/relatorios/RelatoriosPage'
import Header from './components/Header'
import Footer from './components/Footer'

function PrivateLayout() {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="min-h-full">
      <Header />
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <GlobalLoading />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateLayout />}> 
            <Route path="/" element={<DashboardPage />} />
            <Route path="/acolhidas" element={<AcolhidasPage />} />
            <Route path="/saidas-medicas" element={<SaidasPage />} />
            <Route path="/transacoes" element={<TransacoesPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
          </Route>
        </Routes>
        <Footer />
      </AuthProvider>
    </ToastProvider>
  )
}


