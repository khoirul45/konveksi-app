const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/penggajianController');
const { isLoggedIn, isAdminOrOwner, isNotOwner } = require('../middleware/auth');

router.get('/', isLoggedIn, ctrl.index);
router.get('/create', isLoggedIn, isNotOwner, ctrl.create);
router.post('/', isLoggedIn, isNotOwner, ctrl.store);
router.post('/:id/approve', isLoggedIn, isAdminOrOwner, ctrl.approve);
router.delete('/:id', isLoggedIn, isNotOwner, ctrl.destroy);
router.get('/tarif/:proses', isLoggedIn, ctrl.getTarif);

module.exports = router;
