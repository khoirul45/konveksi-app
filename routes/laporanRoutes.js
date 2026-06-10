const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/laporanController');
const { isLoggedIn } = require('../middleware/auth');

router.get('/', isLoggedIn, ctrl.index);
router.get('/pdf-gaji', isLoggedIn, ctrl.exportPdfGaji);
router.get('/pdf-inventaris', isLoggedIn, ctrl.exportPdfInventaris);

module.exports = router;
