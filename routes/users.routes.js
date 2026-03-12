const express = require('express');
const {
  listUsers,
  createUser,
  updateUser
} = require('../controllers/users.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('super_admin', 'admin'), listUsers);
router.post('/', authorize('super_admin', 'admin'), createUser);
router.patch('/:id', authorize('super_admin', 'admin'), updateUser);

module.exports = router;
