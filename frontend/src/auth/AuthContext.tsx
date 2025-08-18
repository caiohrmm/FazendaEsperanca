import axios from 'axios'
import { loadingBus } from '../system/loadingBus'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type AuthContextType = {
  token: string | null
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({} as any)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const idleTimeoutMinutes = Number((import.meta as any).env?.VITE_IDLE_TIMEOUT_MINUTES ?? 30)
  const idleTimeoutMs = isFinite(idleTimeoutMinutes) && idleTimeoutMinutes > 0 ? idleTimeoutMinutes * 60 * 1000 : 30 * 60 * 1000

  // Configuração síncrona para evitar 403 em refresh antes dos interceptors
  const baseURL = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080/api'
  axios.defaults.baseURL = baseURL
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete axios.defaults.headers.common['Authorization']

  useEffect(() => {
    const baseURL = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080/api'
    axios.defaults.baseURL = baseURL
    let active = 0
    const reqId = axios.interceptors.request.use((config) => {
      active++
      if (active === 1) loadingBus.start()
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    // refresh automático
    let isRefreshing = false
    let refreshQueue: Array<(token: string|null)=>void> = []

    const processQueue = (newToken: string|null) => {
      refreshQueue.forEach(cb => cb(newToken))
      refreshQueue = []
    }

    const resId = axios.interceptors.response.use(
      (res) => { active--; if (active === 0) loadingBus.end(); return res },
      async (error) => {
        active--; if (active === 0) loadingBus.end()
        // Ignorar requisições canceladas (ex.: múltiplos cliques em exportar)
        if ((error && (error.code === 'ERR_CANCELED' || error.message === 'canceled'))){
          return Promise.reject(error)
        }
        const original = error.config || {}
        const status = error?.response?.status
        const isAuthEndpoint = original?.url?.includes('/auth/')
        if (status === 401 && !isAuthEndpoint && !original._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              refreshQueue.push((newTok) => {
                if (newTok) {
                  original.headers = original.headers || {}
                  original.headers.Authorization = `Bearer ${newTok}`
                  resolve(axios(original))
                } else {
                  reject(error)
                }
              })
            })
          }
          original._retry = true
          isRefreshing = true
          try {
            const rt = localStorage.getItem('refreshToken')
            if (!rt) throw new Error('No refresh token')
            const { data } = await axios.post('/auth/refresh', { refreshToken: rt })
            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)
            setToken(data.accessToken)
            original.headers = original.headers || {}
            original.headers.Authorization = `Bearer ${data.accessToken}`
            processQueue(data.accessToken)
            return axios(original)
          } catch (e) {
            processQueue(null)
            logout()
            return Promise.reject(error)
          } finally {
            isRefreshing = false
          }
        }
        // 403 (forbidden) também deve deslogar e enviar ao login
        if (status === 403 && !isAuthEndpoint) {
          logout()
          return Promise.reject(error)
        }
        // Para erros de rede/servidor, manter sessão e apenas propagar erro
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.request.eject(reqId)
      axios.interceptors.response.eject(resId)
    }
  }, [token])

  const login = async (email: string, senha: string) => {
    const { data } = await axios.post('/auth/login', { email, senha })
    setToken(data.accessToken)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('lastActivityAt', String(Date.now()))
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('lastActivityAt')
  }

  // Sempre iniciar sessão deslogada ao abrir/atualizar a aplicação
  useEffect(() => {
    logout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Idle logout + cross-tab sync
  useEffect(() => {
    let idleTimer: number | null = null
    const activityEvents = ['mousemove','keydown','click','scroll','touchstart','visibilitychange'] as const

    const markActivity = () => {
      if (!token) return
      localStorage.setItem('lastActivityAt', String(Date.now()))
      schedule()
    }

    const checkIdle = () => {
      if (!token) return
      const last = Number(localStorage.getItem('lastActivityAt') || 0)
      const since = Date.now() - last
      if (since >= idleTimeoutMs) {
        logout()
      } else {
        schedule(idleTimeoutMs - since)
      }
    }

    const schedule = (timeout = idleTimeoutMs) => {
      if (idleTimer) window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(checkIdle, timeout)
    }

    // start/stop by token
    if (token) {
      if (!localStorage.getItem('lastActivityAt')) localStorage.setItem('lastActivityAt', String(Date.now()))
      schedule()
      activityEvents.forEach(evt => window.addEventListener(evt, markActivity, { passive: true }))
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        // cross-tab login/logout
        setToken(e.newValue)
      }
      if (e.key === 'lastActivityAt' && token) {
        schedule()
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      if (idleTimer) window.clearTimeout(idleTimer)
      activityEvents.forEach(evt => window.removeEventListener(evt, markActivity))
      window.removeEventListener('storage', onStorage)
    }
  }, [token, idleTimeoutMs])

  const value = useMemo(() => ({ token, login, logout }), [token])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)


