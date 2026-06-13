const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notifikasiController');
const { isLoggedIn } = require('../middleware/auth');

router.get('/', isLoggedIn, ctrl.getNotifikasi);
router.post('/baca', isLoggedIn, ctrl.tandaiDibaca);
router.post('/hapus-semua', isLoggedIn, ctrl.hapusSemua);

module.exports = router;
