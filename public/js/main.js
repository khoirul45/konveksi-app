// Konveksi App - Main JS

// Auto-hide flash messages
setTimeout(() => {
  document.querySelectorAll('.alert-dismissible').forEach(el => {
    el.style.transition = 'opacity 0.5s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
  });
}, 4000);

// Konfirmasi delete global
document.querySelectorAll('[data-confirm]').forEach(el => {
  el.addEventListener('click', e => {
    if (!confirm(el.dataset.confirm)) e.preventDefault();
  });
});

// Format angka rupiah saat input
document.querySelectorAll('.currency-input').forEach(el => {
  el.addEventListener('blur', function () {
    const val = parseFloat(this.value.replace(/\D/g, ''));
    if (!isNaN(val)) this.value = val;
  });
});
