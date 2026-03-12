import { Box, Card, CardContent, Grid, LinearProgress, Stack, Typography } from '@mui/material'

function ExplorePage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Explore
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Roadmap progress and workspace initiatives.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight={700}>UI Refresh</Typography>
              <LinearProgress variant="determinate" value={88} sx={{ mt: 2, height: 9, borderRadius: 4 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                88% complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight={700}>Automation Pipeline</Typography>
              <LinearProgress variant="determinate" value={64} color="secondary" sx={{ mt: 2, height: 9, borderRadius: 4 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                64% complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 1 }}>
            Initiative Notes
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">Standardize mobile navigation transitions.</Typography>
            <Typography variant="body2">Finalize KPI widgets for purchasing leads.</Typography>
            <Typography variant="body2">Add role-specific dashboards in next sprint.</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ExplorePage
