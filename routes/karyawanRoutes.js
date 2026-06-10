const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/karyawanController');
const { isLoggedIn } = require('../middleware/auth');

router.get('/', isLoggedIn, ctrl.index);
router.get('/create', isLoggedIn, ctrl.create);
router.post('/', isLoggedIn, ctrl.upload.single('foto'), ctrl.store);
router.get('/:id/edit', isLoggedIn, ctrl.edit);
router.put('/:id', isLoggedIn, ctrl.upload.single('foto'), ctrl.update);
router.delete('/:id', isLoggedIn, ctrl.destroy);

module.exports = router;
