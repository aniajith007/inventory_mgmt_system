import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import { useAuth } from '../App'

function SplashPage() {
  const navigate = useNavigate()
  const { isLoggedIn, isAuthReady } = useAuth()

  useEffect(() => {
    if (!isAuthReady) return undefined

    const timer = setTimeout(() => {
      navigate(isLoggedIn ? '/' : '/welcome', { replace: true })
    }, 2200)

    return () => clearTimeout(timer)
  }, [isAuthReady, isLoggedIn, navigate])

  return (
    <Box className="splash-shell">
      <Box className="splash-orb splash-orb-a" />
      <Box className="splash-orb splash-orb-b" />
      <Box className="splash-orb splash-orb-c" />

      <Box className="splash-center">
        <Box className="splash-ring ring-1" />
        <Box className="splash-ring ring-2" />
        <Box className="splash-ring ring-3" />

        <Box className="splash-logo">
          <BoltRoundedIcon sx={{ fontSize: 30 }} />
        </Box>

        <Typography className="splash-title">LTVS Inventory</Typography>
        <Typography className="splash-subtitle">Manangement System</Typography>
      </Box>
    </Box>
  )
}

export default SplashPage
