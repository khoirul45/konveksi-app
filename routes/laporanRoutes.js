const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/laporanController');
const { isLoggedIn, isAdminOrOwner } = require('../middleware/auth');

router.get('/', isLoggedIn, isAdminOrOwner, ctrl.index);
router.get('/pdf-gaji', isLoggedIn, isAdminOrOwner, ctrl.exportPdfGaji);
router.get('/pdf-inventaris', isLoggedIn, isAdminOrOwner, ctrl.exportPdfInventaris);

module.exports = router;
