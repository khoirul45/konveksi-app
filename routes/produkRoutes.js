const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/produkController');
const { isLoggedIn } = require('../middleware/auth');

router.get('/', isLoggedIn, ctrl.index);
router.get('/create', isLoggedIn, ctrl.create);
router.post('/', isLoggedIn, ctrl.store);
router.get('/:id/detail', isLoggedIn, ctrl.detail);
router.get('/:id/edit', isLoggedIn, ctrl.edit);
router.put('/:id', isLoggedIn, ctrl.update);
router.delete('/:id', isLoggedIn, ctrl.destroy);

module.exports = router;
