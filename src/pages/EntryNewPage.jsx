import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { Controller, useForm, useWatch } from 'react-hook-form'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { listPartBatchesApi, listPartsApi } from '../api/master'
import { submitTransactionApi } from '../api/transactions'
import { useAuth } from '../App'

function EntryNewPage() {
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const { user } = useAuth()

  const selectedLocationId =
    routeLocation.state?.locationId ||
    Number(localStorage.getItem('auditSelectedLocationId') || 0) ||
    null

  const selectedLocationCode = routeLocation.state?.locationCode || user?.locationName || ''
  const warehouseId = routeLocation.state?.warehouseId || user?.warehouseId || null

  const [parts, setParts] = useState([])
  const [batches, setBatches] = useState([])
  const [loadingParts, setLoadingParts] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [apiError, setApiError] = useState('')
  const [submittedId, setSubmittedId] = useState(null)

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      partNumber: '',
      countedQuantity: '',
      remarks: ''
    }
  })

  const watchedPartNumber = useWatch({ control, name: 'partNumber' })
  const watchedCountedQuantity = useWatch({ control, name: 'countedQuantity' })

  const normalizedPart = String(watchedPartNumber || '').trim().toUpperCase()

  const selectedPart = useMemo(
    () => parts.find((part) => String(part.part_number).toUpperCase() === normalizedPart) || null,
    [parts, normalizedPart]
  )

  const partExists = Boolean(selectedPart)

  useEffect(() => {
    if (!selectedLocationId) return

    let ignore = false

    async function loadParts() {
      setLoadingParts(true)
      setApiError('')

      try {
        const rows = await listPartsApi({ locationId: selectedLocationId })
        if (!ignore) {
          setParts(rows || [])
        }
      } catch (error) {
        if (!ignore) {
          setApiError(error?.message || 'Failed to load parts')
        }
      } finally {
        if (!ignore) {
          setLoadingParts(false)
        }
      }
    }

    loadParts()

    return () => {
      ignore = true
    }
  }, [selectedLocationId])

  useEffect(() => {
    if (!selectedPart?.id) {
      setBatches([])
      return
    }

    let ignore = false

    async function loadBatches() {
      setLoadingBatches(true)
      setApiError('')

      try {
        const rows = await listPartBatchesApi(selectedPart.id)
        if (!ignore) {
          setBatches(rows || [])
        }
      } catch (error) {
        if (!ignore) {
          setApiError(error?.message || 'Failed to load part batches')
        }
      } finally {
        if (!ignore) {
          setLoadingBatches(false)
        }
      }
    }

    loadBatches()

    return () => {
      ignore = true
    }
  }, [selectedPart?.id])

  const systemTotal = useMemo(
    () => batches.reduce((sum, batch) => sum + Number(batch.system_quantity || 0), 0),
    [batches]
  )

  const parsedCountedQty = watchedCountedQuantity === '' ? null : Number(watchedCountedQuantity)
  const isCountedQtyValid =
    parsedCountedQty !== null && Number.isFinite(parsedCountedQty) && parsedCountedQty >= 0

  const batchAdjustments = useMemo(() => {
    if (!partExists || !isCountedQtyValid) return []

    let remaining = parsedCountedQty
    const adjustments = batches.map((batch) => {
      const systemQty = Number(batch.system_quantity || 0)
      const countedQty = Math.min(systemQty, Math.max(remaining, 0))
      remaining -= countedQty

      return {
        partBatchId: batch.id,
        batchNo: batch.batch_no,
        systemQuantity: systemQty,
        countedQuantity: countedQty,
        varianceQuantity: countedQty - systemQty
      }
    })

    if (remaining > 0 && adjustments.length > 0) {
      const lastIndex = adjustments.length - 1
      adjustments[lastIndex].countedQuantity += remaining
      adjustments[lastIndex].varianceQuantity =
        adjustments[lastIndex].countedQuantity - adjustments[lastIndex].systemQuantity
    }

    return adjustments
  }, [partExists, isCountedQtyValid, parsedCountedQty, batches])

  const varianceTotal = useMemo(
    () => batchAdjustments.reduce((sum, item) => sum + item.varianceQuantity, 0),
    [batchAdjustments]
  )

  const onSubmit = async (values) => {
    if (!selectedLocationId || !partExists || !isCountedQtyValid || !warehouseId) return

    setApiError('')

    try {
      const response = await submitTransactionApi({
        warehouseId,
        locationId: selectedLocationId,
        partId: selectedPart.id,
        countedQuantity: parsedCountedQty,
        remarks: values.remarks?.trim() || null,
        batches: batchAdjustments
      })

      setSubmittedId(response?.id || null)
      reset({ partNumber: '', countedQuantity: '', remarks: '' })
      setBatches([])
    } catch (error) {
      setApiError(error?.message || 'Failed to push entry')
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        New Inventory Entry
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Enter a part number and adjust counted quantity across all batches.
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <Button
              variant="text"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ alignSelf: 'flex-start' }}
              onClick={() => navigate('/audit')}
            >
              Back to Entry
            </Button>

            {!selectedLocationId && (
              <Alert severity="warning">
                No location selected. Please choose a location in Entry page first.
              </Alert>
            )}

            {selectedLocationId && (
              <Alert severity="info">Selected Location: {selectedLocationCode || selectedLocationId}</Alert>
            )}

            {apiError && <Alert severity="error">{apiError}</Alert>}

            {loadingParts ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading part list...
                </Typography>
              </Stack>
            ) : (
              <Controller
                name="partNumber"
                control={control}
                rules={{ required: 'Part number is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Part Number"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      setSubmittedId(null)
                      field.onChange(event.target.value.toUpperCase())
                    }}
                    placeholder="Example: PN-C12-001"
                  />
                )}
              />
            )}

            {!!normalizedPart &&
              (partExists ? (
                <Alert severity="success">Part number found in selected location.</Alert>
              ) : (
                <Alert severity="error">Part number not available in selected location list.</Alert>
              ))}

            {partExists && (
              <>
                <Alert severity="info">System total quantity for this part: {systemTotal}</Alert>

                <Controller
                  name="countedQuantity"
                  control={control}
                  rules={{
                    required: 'Counted quantity is required',
                    validate: (value) => {
                      const num = Number(value)
                      if (!Number.isFinite(num) || num < 0) return 'Counted quantity must be 0 or more'
                      return true
                    }
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Enter Counted Quantity"
                      type="number"
                      inputProps={{ min: 0 }}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />

                {isCountedQtyValid && (
                  <>
                    <Alert severity={varianceTotal === 0 ? 'success' : 'warning'}>
                      Variance Total: {varianceTotal >= 0 ? `+${varianceTotal}` : varianceTotal}
                    </Alert>

                    <Typography variant="subtitle2" color="text.secondary">
                      Batch Adjustment (applied in batch order)
                    </Typography>
                    {loadingBatches ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
                        <CircularProgress size={18} />
                        <Typography variant="body2" color="text.secondary">
                          Loading batches...
                        </Typography>
                      </Stack>
                    ) : (
                      <TableContainer
                        sx={{ border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 2, maxHeight: 260 }}
                      >
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Batch No</TableCell>
                              <TableCell>System Qty</TableCell>
                              <TableCell>Adjusted Qty</TableCell>
                              <TableCell>Variance</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {batchAdjustments.map((batch) => (
                              <TableRow key={batch.batchNo}>
                                <TableCell>{batch.batchNo}</TableCell>
                                <TableCell>{batch.systemQuantity}</TableCell>
                                <TableCell>{batch.countedQuantity}</TableCell>
                                <TableCell>
                                  {batch.varianceQuantity >= 0
                                    ? `+${batch.varianceQuantity}`
                                    : batch.varianceQuantity}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}

                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Remarks"
                      placeholder="Optional remarks"
                      multiline
                      minRows={3}
                      fullWidth
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<CheckCircleRoundedIcon />}
                  disabled={!isCountedQtyValid || loadingBatches}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Push Entry
                </Button>
              </>
            )}

            {submittedId && <Alert severity="success">Entry pushed successfully. Transaction ID: {submittedId}</Alert>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default EntryNewPage
