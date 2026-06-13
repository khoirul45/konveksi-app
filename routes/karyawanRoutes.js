const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/karyawanController');
const { isLoggedIn, isAdminOrOwner, isAdminAction } = require('../middleware/auth');

router.get('/', isLoggedIn, isAdminOrOwner, ctrl.index);
router.get('/create', isLoggedIn, isAdminAction, ctrl.create);
router.post('/', isLoggedIn, isAdminAction, ctrl.upload.single('foto'), ctrl.store);
router.get('/:id/edit', isLoggedIn, isAdminAction, ctrl.edit);
router.put('/:id', isLoggedIn, isAdminAction, ctrl.upload.single('foto'), ctrl.update);
router.delete('/:id', isLoggedIn, isAdminAction, ctrl.destroy);

module.exports = router;
