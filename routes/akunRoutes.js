const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/akunController');
const { isLoggedIn, isAdminOnly } = require('../middleware/auth');

router.get('/', isLoggedIn, isAdminOnly, ctrl.index);
router.get('/create', isLoggedIn, isAdminOnly, ctrl.create);
router.post('/', isLoggedIn, isAdminOnly, ctrl.store);
router.post('/:id/reset-password', isLoggedIn, isAdminOnly, ctrl.resetPassword);
router.delete('/:id', isLoggedIn, isAdminOnly, ctrl.destroy);

module.exports = router;
