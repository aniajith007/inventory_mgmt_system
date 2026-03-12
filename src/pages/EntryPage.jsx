import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import { Controller, useForm, useWatch } from 'react-hook-form'
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded'
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded'
import GridOnRoundedIcon from '@mui/icons-material/GridOnRounded'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import QRCode from 'qrcode'
import { listLocationsApi, listPartsApi, listWarehousesApi } from '../api/master'
import { getTransactionApi, listTransactionsApi } from '../api/transactions'
import { useAppSettings, useAuth } from '../App'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function createPrintableMarkup(entry, qrDataUrl) {
  const rows = (entry.batches || [])
    .map(
      (batch) =>
        `<tr><td>${escapeHtml(batch.batch_no || '-')}</td><td>${escapeHtml(batch.system_quantity)}</td><td>${escapeHtml(batch.counted_quantity)}</td><td>${escapeHtml(batch.variance_quantity >= 0 ? `+${batch.variance_quantity}` : batch.variance_quantity)}</td></tr>`
    )
    .join('')

  return `
    <html>
      <head>
        <title>Inventory Entry Print</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
          h2 { margin: 0 0 12px; }
          .row { margin-bottom: 6px; font-size: 14px; }
          .qr-wrap { margin: 12px 0 14px; padding: 10px; border: 1px dashed #94a3b8; border-radius: 8px; background: #f8fafc; display: inline-block; }
          .qr-wrap img { width: 130px; height: 130px; display: block; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h2>Inventory Audit Entry</h2>
        <div class="qr-wrap"><img src="${qrDataUrl}" alt="entry qr" /></div>
        <div class="row"><strong>ID:</strong> ${escapeHtml(entry.id)}</div>
        <div class="row"><strong>Warehouse:</strong> ${escapeHtml(entry.warehouse_name || '-')}</div>
        <div class="row"><strong>Location:</strong> ${escapeHtml(entry.location_name || '-')}</div>
        <div class="row"><strong>Part Number:</strong> ${escapeHtml(entry.part_number || '-')}</div>
        <div class="row"><strong>Counted Quantity:</strong> ${escapeHtml(entry.counted_quantity)}</div>
        <div class="row"><strong>Remarks:</strong> ${escapeHtml(entry.remarks || '-')}</div>
        <div class="row"><strong>Submitted By:</strong> ${escapeHtml(entry.submitted_by_username || '-')}</div>
        <div class="row"><strong>Created At:</strong> ${escapeHtml(new Date(entry.submitted_at).toLocaleString())}</div>

        ${rows ? `<table><thead><tr><th>Batch</th><th>System Qty</th><th>Counted Qty</th><th>Variance</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
      </body>
    </html>
  `
}

function EntryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { printEnabled } = useAppSettings()
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])
  const [parts, setParts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loadingMaster, setLoadingMaster] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')

  const { control, setValue } = useForm({
    defaultValues: {
      locationId: localStorage.getItem('auditSelectedLocationId') || String(user?.locationId || '')
    }
  })

  const locationId = useWatch({ control, name: 'locationId' })
  const selectedLocation = useMemo(
    () => locations.find((item) => item.id === Number(locationId)) || null,
    [locationId, locations]
  )

  useEffect(() => {
    let ignore = false

    async function loadMasters() {
      setLoadingMaster(true)
      setError('')

      try {
        const query = user?.warehouseId ? { warehouseId: user.warehouseId } : undefined
        const [warehouseRows, locationRows] = await Promise.all([
          listWarehousesApi(),
          listLocationsApi(query)
        ])

        if (ignore) return

        setWarehouses(warehouseRows || [])
        setLocations(locationRows || [])

        if (!locationId && user?.locationId) {
          setValue('locationId', String(user.locationId))
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError?.message || 'Failed to load master data')
        }
      } finally {
        if (!ignore) {
          setLoadingMaster(false)
        }
      }
    }

    loadMasters()

    return () => {
      ignore = true
    }
  }, [locationId, setValue, user?.locationId, user?.warehouseId])

  useEffect(() => {
    if (!locationId) {
      setParts([])
      setTransactions([])
      return
    }

    let ignore = false

    async function loadByLocation() {
      setLoadingData(true)
      setError('')

      try {
        const [partRows, transactionRows] = await Promise.all([
          listPartsApi({ locationId }),
          listTransactionsApi({ locationId })
        ])

        if (ignore) return

        setParts(partRows || [])
        setTransactions(transactionRows || [])
      } catch (loadError) {
        if (!ignore) {
          setError(loadError?.message || 'Failed to load entry data')
        }
      } finally {
        if (!ignore) {
          setLoadingData(false)
        }
      }
    }

    loadByLocation()

    return () => {
      ignore = true
    }
  }, [locationId])

  const locationParts = useMemo(() => parts.map((part) => part.part_number), [parts])

  const handlePrintEntry = async (entry) => {
    if (!printEnabled) return

    const detailed = await getTransactionApi(entry.id)

    const qrPayload = JSON.stringify({
      id: detailed.id,
      location: detailed.location_name,
      partNumber: detailed.part_number,
      countedQuantity: detailed.counted_quantity,
      createdAt: detailed.submitted_at
    })

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 180,
      color: { dark: '#111827', light: '#ffffff' }
    })

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    printWindow.document.open()
    printWindow.document.write(createPrintableMarkup(detailed, qrDataUrl))
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleExportXlsx = () => {
    if (transactions.length === 0) return

    const sheetRows = transactions.map((entry) => ({
      Id: entry.id,
      Warehouse: entry.warehouse_name,
      Location: entry.location_name,
      PartNumber: entry.part_number,
      PartName: entry.part_name || '',
      CountedQty: entry.counted_quantity,
      Remarks: entry.remarks || '',
      ReferenceNo: entry.reference_no || '',
      SubmittedBy: entry.submitted_by_username,
      SubmittedAt: new Date(entry.submitted_at).toLocaleString()
    }))

    const ws = XLSX.utils.json_to_sheet(sheetRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Entries')
    XLSX.writeFile(wb, `inventory_entries_${selectedLocation?.code || 'all'}.xlsx`)
  }

  const handleExportPdf = () => {
    if (transactions.length === 0) return

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })

    doc.setFontSize(14)
    doc.text('Inventory Audit Entries', 40, 40)
    doc.setFontSize(10)
    doc.text(`Location: ${(selectedLocation?.code || 'ALL').toUpperCase()}`, 40, 58)

    const body = transactions.map((entry) => [
      String(entry.id),
      entry.part_number,
      String(entry.counted_quantity),
      entry.remarks || '-',
      entry.submitted_by_username,
      new Date(entry.submitted_at).toLocaleString()
    ])

    autoTable(doc, {
      startY: 74,
      head: [['ID', 'Part Number', 'Counted Qty', 'Remarks', 'Submitted By', 'Created At']],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110] }
    })

    doc.save(`inventory_entries_${selectedLocation?.code || 'all'}.pdf`)
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Inventory Audit Entry
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Select location, verify part numbers, and push counted quantities.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Controller
              name="locationId"
              control={control}
              rules={{ required: 'Location is required' }}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="audit-location-label">Location</InputLabel>
                  <Select
                    {...field}
                    labelId="audit-location-label"
                    label="Location"
                    onChange={(event) => {
                      const selected = event.target.value
                      field.onChange(selected)
                      localStorage.setItem('auditSelectedLocationId', String(selected))
                    }}
                  >
                    {locations.map((option) => {
                      const warehouse = warehouses.find((item) => item.id === option.warehouse_id)

                      return (
                        <MenuItem key={option.id} value={String(option.id)}>
                          {option.code} - {option.name}
                          {warehouse?.name ? ` (${warehouse.name})` : ''}
                        </MenuItem>
                      )
                    })}
                  </Select>
                </FormControl>
              )}
            />

            {loadingMaster ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading locations...
                </Typography>
              </Stack>
            ) : !locationId ? (
              <Alert severity="info">Please select a location to continue.</Alert>
            ) : (
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Part Numbers in {selectedLocation?.code || '-'}
                </Typography>
                {locationParts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No active part numbers found for this location.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {locationParts.map((part) => (
                      <Chip key={part} label={part} size="small" />
                    ))}
                  </Stack>
                )}
              </Stack>
            )}

            <Button
              variant="contained"
              startIcon={<AddCircleRoundedIcon />}
              disabled={!locationId}
              onClick={() =>
                navigate('/audit/new', {
                  state: {
                    locationId: Number(locationId),
                    locationCode: selectedLocation?.code || '',
                    locationName: selectedLocation?.name || '',
                    warehouseId: selectedLocation?.warehouse_id || null,
                    warehouseName:
                      warehouses.find((item) => item.id === selectedLocation?.warehouse_id)?.name || ''
                  }
                })
              }
              sx={{ alignSelf: 'flex-start' }}
            >
              New Entry
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.2}
            sx={{ mb: 1.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <ChecklistRoundedIcon color="primary" fontSize="small" />
              <Typography fontWeight={700}>Pushed Entries {selectedLocation?.code ? `(${selectedLocation.code})` : ''}</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PictureAsPdfRoundedIcon fontSize="small" />}
                disabled={transactions.length === 0}
                onClick={handleExportPdf}
              >
                PDF
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<GridOnRoundedIcon fontSize="small" />}
                disabled={transactions.length === 0}
                onClick={handleExportXlsx}
              >
                XLSX
              </Button>
            </Stack>
          </Stack>

          {loadingData ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading pushed entries...
              </Typography>
            </Stack>
          ) : transactions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No entries pushed yet.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 360, border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Part Number</TableCell>
                    <TableCell>Counted Qty</TableCell>
                    <TableCell>Remarks</TableCell>
                    <TableCell>Submitted By</TableCell>
                    <TableCell>Created At</TableCell>
                    {printEnabled && <TableCell align="center">Print</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.id}</TableCell>
                      <TableCell>{entry.part_number}</TableCell>
                      <TableCell>{entry.counted_quantity}</TableCell>
                      <TableCell>{entry.remarks || '-'}</TableCell>
                      <TableCell>{entry.submitted_by_username}</TableCell>
                      <TableCell>{new Date(entry.submitted_at).toLocaleString()}</TableCell>
                      {printEnabled && (
                        <TableCell align="center">
                          <Tooltip title="Print this entry" arrow>
                            <IconButton size="small" onClick={() => handlePrintEntry(entry)}>
                              <PrintRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default EntryPage
