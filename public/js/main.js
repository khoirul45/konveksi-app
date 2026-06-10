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

// Proteksi double submit — tombol disabled setelah klik
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', function(e) {
    // Kecualikan form delete (method DELETE)
    const method = this.querySelector('input[name="_method"]');
    if (method && method.value === 'DELETE') return;

    const submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Menyimpan...';
      // Re-enable setelah 5 detik (fallback kalau gagal)
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalText || 'Simpan';
      }, 5000);
    }
  });
});
