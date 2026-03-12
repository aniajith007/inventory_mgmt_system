import { Avatar, Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import { useAuth } from '../App'

function ProfilePage() {
  const { user } = useAuth()
  const name = user?.name || 'User'
  const email = user?.email || '-'
  const role = user?.role || 'user'

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Profile
      </Typography>
      <Card sx={{ maxWidth: 520 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
              {name
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
            </Avatar>
            <Box>
              <Typography fontWeight={700}>{name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {email}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={role.replace('_', ' ')} color="primary" variant="outlined" />
            <Chip label={user?.activeStatus ? 'Active' : 'Inactive'} color={user?.activeStatus ? 'success' : 'default'} />
            {user?.warehouseName && <Chip label={`Warehouse: ${user.warehouseName}`} variant="outlined" />}
            {user?.locationName && <Chip label={`Location: ${user.locationName}`} variant="outlined" />}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ProfilePage
