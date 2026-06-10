// routes/inventarisRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventarisController');
const { isLoggedIn } = require('../middleware/auth');

router.get('/', isLoggedIn, ctrl.index);
router.post('/koreksi', isLoggedIn, ctrl.koreksi);

module.exports = router;
