import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  Typography
} from '@mui/material'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import { useAppSettings, useColorMode } from '../App'

function SettingsPage() {
  const { colorMode, setColorMode, toggleColorMode } = useColorMode()
  const { printEnabled, togglePrintEnabled } = useAppSettings()

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage your app preferences.
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SettingsBrightnessRoundedIcon color="primary" />
              <Typography fontWeight={700}>Theme Mode</Typography>
            </Stack>

            <FormControlLabel
              control={<Switch checked={colorMode === 'dark'} onChange={toggleColorMode} />}
              label={colorMode === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
              <Card
                variant="outlined"
                sx={{
                  flex: 1,
                  cursor: 'pointer',
                  borderColor: colorMode === 'light' ? 'primary.main' : 'divider'
                }}
                onClick={() => setColorMode('light')}
              >
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LightModeRoundedIcon fontSize="small" color="primary" />
                    <Typography fontWeight={700}>Light</Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Card
                variant="outlined"
                sx={{
                  flex: 1,
                  cursor: 'pointer',
                  borderColor: colorMode === 'dark' ? 'primary.main' : 'divider'
                }}
                onClick={() => setColorMode('dark')}
              >
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DarkModeRoundedIcon fontSize="small" color="primary" />
                    <Typography fontWeight={700}>Dark</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PrintRoundedIcon color="primary" />
              <Typography fontWeight={700}>Entry Printing</Typography>
            </Stack>
            <FormControlLabel
              control={<Switch checked={printEnabled} onChange={togglePrintEnabled} />}
              label={printEnabled ? 'Print option enabled for entries' : 'Print option disabled'}
            />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default SettingsPage
