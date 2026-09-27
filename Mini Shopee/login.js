document.addEventListener('DOMContentLoaded', () => {
  const AUTH_KEY = 'loggedInUser';
  const LEGACY_AUTH_KEY = 'userFirstName';

  const getStoredUser = () => {
    try {
      const currentUser = localStorage.getItem(AUTH_KEY);
      if (currentUser) return currentUser;

      const legacyUser = localStorage.getItem(LEGACY_AUTH_KEY);
      if (legacyUser) {
        localStorage.setItem(AUTH_KEY, legacyUser);
        return legacyUser;
      }

      return null;
    } catch (error) {
      console.error('Gagal membaca sesi login:', error);
      return null;
    }
  };

  // 1. Check Session Persistence / Auth Guard
  // Jika pengguna sudah login sebelumnya, langsung arahkan ke catalog.html
  if (getStoredUser()) {
    window.location.href = 'catalog.html';
    return;
  }

  // Elemen DOM
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const btnSubmit = document.getElementById('btn-submit');
  const btnText = btnSubmit.querySelector('.btn-text');
  const loadingSpinner = document.getElementById('loading-spinner');
  const errorMessageDiv = document.getElementById('error-message');
  const togglePasswordBtn = document.getElementById('toggle-password');

  // Helper: Tampilkan/Sembunyikan Pesan Error
  const showError = (message) => {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
  };

  const clearError = () => {
    errorMessageDiv.textContent = '';
    errorMessageDiv.classList.add('hidden');
  };

  // Helper: Toggle Loading State
  const setLoadingState = (isLoading) => {
    if (isLoading) {
      btnSubmit.disabled = true;
      btnText.textContent = 'Memverifikasi...';
      loadingSpinner.classList.remove('hidden');
    } else {
      btnSubmit.disabled = false;
      btnText.textContent = 'Masuk';
      loadingSpinner.classList.add('hidden');
    }
  };

  // Bonus Feature: Toggle Show/Hide Password
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    });
  }

  // 2. Handle Submit Form
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Validasi input sederhana di sisi klien
    if (!username || !password) {
      showError('Username dan password wajib diisi.');
      return;
    }

    setLoadingState(true);

    try {
      // Fetch data seluruh pengguna dari DummyJSON Users API
      const response = await fetch('https://dummyjson.com/users');

      if (!response.ok) {
        throw new Error(`Gagal terhubung ke server (Status: ${response.status})`);
      }

      const data = await response.json();
      const users = data.users;

      // Autentikasi Kredensial
      const matchedUser = users.find(
        (u) => u.username === username && u.password === password
      );

      if (matchedUser) {
        // Session Persistence: Simpan nama pengguna di satu key yang konsisten
        const userName = matchedUser.firstName;
        localStorage.setItem(AUTH_KEY, userName);
        localStorage.setItem(LEGACY_AUTH_KEY, userName);

        // Auto Redirect ke Halaman Katalog Produk
        window.location.href = 'catalog.html';
      } else {
        showError('Username atau password salah. Silakan coba lagi.');
      }
    } catch (error) {
      // Global & Network Error Handling
      showError(
        error.message || 'Terjadi kesalahan jaringan. Periksa koneksi Anda.'
      );
    } finally {
      setLoadingState(false);
    }
  });
});