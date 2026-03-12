const express = require('express');
const {
  listWarehouses,
  createWarehouse,
  listLocations,
  createLocation,
  listParts,
  createPart,
  listBatches,
  createBatch
} = require('../controllers/master.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get('/warehouses', listWarehouses);
router.post('/warehouses', authorize('super_admin', 'admin'), createWarehouse);

router.get('/locations', listLocations);
router.post('/locations', authorize('super_admin', 'admin'), createLocation);

router.get('/parts', listParts);
router.post('/parts', authorize('super_admin', 'admin'), createPart);

router.get('/parts/:partId/batches', listBatches);
router.post('/parts/:partId/batches', authorize('super_admin', 'admin'), createBatch);

module.exports = router;
