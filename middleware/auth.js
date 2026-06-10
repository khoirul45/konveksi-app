// middleware/auth.js

exports.isLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Silakan login terlebih dahulu.');
  res.redirect('/login');
};

exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Akses ditolak. Hanya admin yang diizinkan.');
  res.redirect('/dashboard');
};
