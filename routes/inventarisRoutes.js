const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventarisController');
const { isLoggedIn, isAdminOrOwner, isAdminAction } = require('../middleware/auth');

router.get('/', isLoggedIn, isAdminOrOwner, ctrl.index);
router.post('/koreksi', isLoggedIn, isAdminAction, ctrl.koreksi);

module.exports = router;
