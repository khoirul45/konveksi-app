// middleware/auth.js

exports.isLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) return next();
  req.flash('error', 'Silakan login terlebih dahulu.');
  res.redirect('/login');
};

exports.isAdmin = (req, res, next) => {
  if (req.session?.user?.role === 'admin') return next();
  req.flash('error', 'Akses ditolak. Hanya admin yang diizinkan.');
  res.redirect('/dashboard');
};

exports.isAdminOrOwner = (req, res, next) => {
  const role = req.session?.user?.role;
  if (role === 'admin' || role === 'owner') return next();
  req.flash('error', 'Akses ditolak.');
  res.redirect('/dashboard');
};

exports.isNotOwner = (req, res, next) => {
  const role = req.session?.user?.role;
  if (role === 'admin' || role === 'karyawan') return next();
  req.flash('error', 'Owner hanya bisa melihat data.');
  res.redirect('/dashboard');
};

exports.isAdminOnly = (req, res, next) => {
  if (req.session?.user?.role === 'admin') return next();
  req.flash('error', 'Akses ditolak. Hanya admin yang diizinkan.');
  res.redirect('/dashboard');
};
