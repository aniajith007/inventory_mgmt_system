import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { AnimatePresence, motion } from 'framer-motion'

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'View today summary and operational highlights',
    tag: 'Overview',
    to: '/',
    icon: <DashboardRoundedIcon color="primary" />
  },
  {
    id: 'entry',
    title: 'Inventory Entry',
    description: 'Select location and push counted quantities',
    tag: 'Audit',
    to: '/audit',
    icon: <FactCheckRoundedIcon color="primary" />
  },
  {
    id: 'explore',
    title: 'Explore',
    description: 'Track roadmap and initiatives',
    tag: 'Insights',
    to: '/explore',
    icon: <ExploreRoundedIcon color="primary" />
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Manage account details and status',
    tag: 'User',
    to: '/profile',
    icon: <PersonRoundedIcon color="primary" />
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Change theme, preferences, and app options',
    tag: 'Config',
    to: '/settings',
    icon: <SettingsRoundedIcon color="primary" />
  }
]

function getGridSpan(index, total) {
  if (total === 1) {
    return { xs: 12, sm: 12, md: 12 }
  }

  const isLast = index === total - 1
  const smRemainder = total % 2
  const mdRemainder = total % 3

  return {
    xs: 12,
    sm: isLast && smRemainder === 1 ? 12 : 6,
    md: isLast && mdRemainder === 1 ? 12 : 4
  }
}

function DashboardPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filteredMenus = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return menuItems

    return menuItems.filter((item) =>
      [item.title, item.description, item.tag].some((text) => text.toLowerCase().includes(query))
    )
  }, [search])

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Home
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.3 }}>
        Search app menu items and open quickly.
      </Typography>

      <Card sx={{ mb: 2.2, borderRadius: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <TextField
            fullWidth
            placeholder="Search menu items..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={2} alignItems="stretch">
        <AnimatePresence mode="popLayout">
          {filteredMenus.map((item, index) => {
            const span = getGridSpan(index, filteredMenus.length)

            return (
              <Grid item xs={span.xs} sm={span.sm} md={span.md} key={item.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.22, delay: index * 0.04 }}
                  whileHover={{ y: -4 }}
                  style={{ height: '100%' }}
                >
                  <Card sx={{ borderRadius: 2, height: '100%' }}>
                    <CardActionArea sx={{ height: '100%' }} onClick={() => navigate(item.to)}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, minHeight: 152 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Stack direction="row" spacing={1} alignItems="center">
                            {item.icon}
                            <Typography fontWeight={700}>{item.title}</Typography>
                          </Stack>

                          <Tooltip title={item.description} arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={(event) => event.preventDefault()}
                              sx={{ mt: -0.5, mr: -0.5 }}
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>

                        <Box sx={{ mt: 'auto' }}>
                          <Chip label={item.tag} size="small" />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </motion.div>
              </Grid>
            )
          })}
        </AnimatePresence>
      </Grid>

      {filteredMenus.length === 0 && (
        <Card sx={{ mt: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography fontWeight={700}>No menu found</Typography>
            <Typography variant="body2" color="text.secondary">
              Try another keyword.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default DashboardPage
