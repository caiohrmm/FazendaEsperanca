import axios from 'axios'
import { loadingBus } from '../system/loadingBus'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type AuthContextType = {
  token: string | null
  login: (email: string, senha: string) => Promise<void>
  register: (nome: string, email: string, senha: string, role?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({} as any)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'))

  // Configuração síncrona para evitar 403 em refresh antes dos interceptors
  const baseURL = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080/api'
  axios.defaults.baseURL = baseURL
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete axios.defaults.headers.common['Authorization']

  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'
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
  }

  const register = async (nome: string, email: string, senha: string, role = 'VISUALIZADOR') => {
    await axios.post('/auth/register', { nome, email, senha, role })
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  const value = useMemo(() => ({ token, login, register, logout }), [token])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)


