import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { useAuth } from '../App'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    control,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm({
    defaultValues: {
      username: 'user1',
      password: '1234'
    }
  })

  const onSubmit = async (values) => {
    setApiError('')

    try {
      await login({
        username: String(values.username || '').trim(),
        password: String(values.password || '')
      })
      navigate('/', { replace: true })
    } catch (error) {
      setApiError(error?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <Box className="auth-shell">
      <Container maxWidth="xs">
        <Paper elevation={0} className="auth-card">
          <Stack spacing={2.3} component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton size="small" onClick={() => navigate('/welcome')}>
                <ArrowBackRoundedIcon fontSize="small" />
              </IconButton>
              <Typography variant="h5" fontWeight={800}>
                Login
              </Typography>
              <Box sx={{ width: 30 }} />
            </Stack>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Enter your username and password
            </Typography>

            {apiError && <Alert severity="error">{apiError}</Alert>}

            <Controller
              name="username"
              control={control}
              rules={{ required: 'Username is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Username"
                  required
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={{ required: 'Password is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword((prev) => !prev)}>
                          {showPassword ? (
                            <VisibilityOffRoundedIcon fontSize="small" />
                          ) : (
                            <VisibilityRoundedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            <Link href="#" underline="hover" variant="body2" sx={{ textAlign: 'right' }}>
              Forgot password?
            </Link>

            <Button
              type="submit"
              size="large"
              variant="contained"
              disabled={isSubmitting}
              sx={{ borderRadius: 99, py: 1.2 }}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}

export default LoginPage
