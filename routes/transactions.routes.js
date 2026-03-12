const express = require('express');
const {
  submitTransaction,
  listTransactions,
  getTransactionById
} = require('../controllers/transactions.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.post('/submit', authorize('super_admin', 'admin', 'user'), submitTransaction);
router.get('/', authorize('super_admin', 'admin', 'user'), listTransactions);
router.get('/:id', authorize('super_admin', 'admin', 'user'), getTransactionById);

module.exports = router;
