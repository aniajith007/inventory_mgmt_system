import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, CircularProgress, CssBaseline, ThemeProvider, Typography, createTheme } from '@mui/material'
import { IonApp } from '@ionic/react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import SplashPage from './pages/SplashPage'
import StartPage from './pages/StartPage'
import LoginPage from './pages/LoginPage'
import MainLayout from './pages/MainLayout'
import DashboardPage from './pages/DashboardPage'
import EntryPage from './pages/EntryPage'
import EntryNewPage from './pages/EntryNewPage'
import ExplorePage from './pages/ExplorePage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import { loginApi, meApi } from './api/auth'
import { setAuthTokenGetter, setUnauthorizedHandler } from './api/client'

import '@ionic/react/css/core.css'

const AuthContext = createContext(null)
const ColorModeContext = createContext(null)
const AppSettingsContext = createContext(null)

export const useAuth = () => useContext(AuthContext)
export const useColorMode = () => useContext(ColorModeContext)
export const useAppSettings = () => useContext(AppSettingsContext)

const ignoreNativeError = () => undefined

function mapUser(rawUser) {
  if (!rawUser) return null

  return {
    id: rawUser.id,
    username: rawUser.username,
    name: rawUser.fullName || rawUser.full_name || rawUser.username || 'User',
    email: rawUser.email || '',
    role: rawUser.role,
    warehouseId: rawUser.warehouseId ?? rawUser.warehouse_id ?? null,
    warehouseName: rawUser.warehouseName ?? rawUser.warehouse_name ?? null,
    locationId: rawUser.locationId ?? rawUser.location_id ?? null,
    locationName: rawUser.locationName ?? rawUser.location_name ?? null,
    activeStatus: rawUser.activeStatus ?? rawUser.active_status ?? true,
    lastLoginAt: rawUser.lastLoginAt ?? rawUser.last_login_at ?? null
  }
}

function LoadingScreen() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        p: 2
      }}
    >
      <Box>
        <CircularProgress size={34} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2 }}>
          Loading...
        </Typography>
      </Box>
    </Box>
  )
}

function ProtectedLayout() {
  const { isLoggedIn, isAuthReady } = useAuth()

  if (!isAuthReady) return <LoadingScreen />
  return isLoggedIn ? <MainLayout /> : <Navigate to="/splash" replace />
}

function PublicOnly({ children }) {
  const { isLoggedIn, isAuthReady } = useAuth()

  if (!isAuthReady) return <LoadingScreen />
  return isLoggedIn ? <Navigate to="/" replace /> : children
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('authToken') || '')
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('authToken')))
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [user, setUser] = useState(null)
  const [colorMode, setColorMode] = useState(localStorage.getItem('appThemeMode') || 'light')
  const [printEnabled, setPrintEnabled] = useState(localStorage.getItem('appPrintEnabled') !== 'false')

  useEffect(() => {
    setAuthTokenGetter(() => token)
  }, [token])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken('')
      setIsLoggedIn(false)
      setUser(null)
    })
  }, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.removeItem('authToken')
    }
  }, [token])

  useEffect(() => {
    let ignore = false

    async function hydrateUser() {
      if (!token) {
        setIsLoggedIn(false)
        setUser(null)
        setIsAuthReady(true)
        return
      }

      setIsAuthReady(false)

      try {
        const me = await meApi()
        if (ignore) return

        setUser(mapUser(me))
        setIsLoggedIn(true)
      } catch {
        if (ignore) return

        setToken('')
        setIsLoggedIn(false)
        setUser(null)
      } finally {
        if (!ignore) {
          setIsAuthReady(true)
        }
      }
    }

    hydrateUser()

    return () => {
      ignore = true
    }
  }, [token])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    StatusBar.setStyle({ style: colorMode === 'dark' ? Style.Light : Style.Dark }).catch(ignoreNativeError)
    StatusBar.setBackgroundColor({ color: colorMode === 'dark' ? '#0b1220' : '#ffffff' }).catch(ignoreNativeError)
    StatusBar.setOverlaysWebView({ overlay: false }).catch(ignoreNativeError)
    Keyboard.setResizeMode({ mode: 'body' }).catch(ignoreNativeError)
    SplashScreen.hide().catch(ignoreNativeError)

    let backButtonHandle
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
        return
      }
      CapacitorApp.exitApp()
    })
      .then((handle) => {
        backButtonHandle = handle
      })
      .catch(ignoreNativeError)

    return () => {
      backButtonHandle?.remove()
    }
  }, [colorMode])

  useEffect(() => {
    localStorage.setItem('appThemeMode', colorMode)
    document.body.setAttribute('data-theme-mode', colorMode)
  }, [colorMode])

  useEffect(() => {
    localStorage.setItem('appPrintEnabled', String(printEnabled))
  }, [printEnabled])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: colorMode,
          primary: { main: '#0f766e' },
          secondary: { main: '#1e293b' },
          background:
            colorMode === 'dark'
              ? { default: '#0b1220', paper: '#10192b' }
              : { default: '#f3f6fb', paper: '#ffffff' }
        },
        shape: { borderRadius: 10 },
        typography: {
          fontFamily: '"Segoe UI", "Inter", sans-serif'
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                border:
                  colorMode === 'dark'
                    ? '1px solid rgba(148, 163, 184, 0.22)'
                    : '1px solid rgba(15, 23, 42, 0.08)',
                boxShadow:
                  colorMode === 'dark'
                    ? '0 10px 22px rgba(2, 6, 23, 0.5)'
                    : '0 12px 26px rgba(15, 23, 42, 0.06)'
              }
            }
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 10
              }
            }
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                textTransform: 'none',
                fontWeight: 600
              }
            }
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: 10
              }
            }
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8
              }
            }
          }
        }
      }),
    [colorMode]
  )

  const colorModeValue = useMemo(
    () => ({
      colorMode,
      setColorMode,
      toggleColorMode: () => setColorMode((prev) => (prev === 'light' ? 'dark' : 'light'))
    }),
    [colorMode]
  )

  const appSettingsValue = useMemo(
    () => ({
      printEnabled,
      setPrintEnabled,
      togglePrintEnabled: () => setPrintEnabled((prev) => !prev)
    }),
    [printEnabled]
  )

  const authValue = useMemo(
    () => ({
      token,
      isLoggedIn,
      isAuthReady,
      user,
      login: async (credentials) => {
        const response = await loginApi(credentials)

        setToken(response.token)
        setUser(mapUser(response.user))
        setIsLoggedIn(true)

        return response.user
      },
      logout: () => {
        setToken('')
        setUser(null)
        setIsLoggedIn(false)
      }
    }),
    [token, isLoggedIn, isAuthReady, user]
  )

  return (
    <IonApp>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ColorModeContext.Provider value={colorModeValue}>
          <AppSettingsContext.Provider value={appSettingsValue}>
            <AuthContext.Provider value={authValue}>
              <Routes>
                <Route path="/splash" element={<SplashPage />} />
                <Route
                  path="/welcome"
                  element={
                    <PublicOnly>
                      <StartPage />
                    </PublicOnly>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicOnly>
                      <LoginPage />
                    </PublicOnly>
                  }
                />
                <Route path="/" element={<ProtectedLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="audit" element={<EntryPage />} />
                  <Route path="audit/new" element={<EntryNewPage />} />
                  <Route path="explore" element={<ExplorePage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
                <Route path="*" element={<Navigate to="/splash" replace />} />
              </Routes>
            </AuthContext.Provider>
          </AppSettingsContext.Provider>
        </ColorModeContext.Provider>
      </ThemeProvider>
    </IonApp>
  )
}

export default App
