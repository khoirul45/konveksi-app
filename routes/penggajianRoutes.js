const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/penggajianController');
const { isLoggedIn } = require('../middleware/auth');

router.get('/', isLoggedIn, ctrl.index);
router.get('/create', isLoggedIn, ctrl.create);
router.post('/', isLoggedIn, ctrl.store);
router.delete('/:id', isLoggedIn, ctrl.destroy);
router.get('/tarif/:proses', isLoggedIn, ctrl.getTarif);

module.exports = router;
