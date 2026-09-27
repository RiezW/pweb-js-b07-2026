# Laporan Praktikum Modul 2 (pweb-js-b07-2026)

Anggota Kelompok B07:
- Ganestri Naurah Sawestri (5027251014)
- Riezco Eka Bayu Witantra (5027251057)
- Muhammad Ridwan (5027251113)

## Login Page & Product Catalog 

## 1. Pendahuluan

Aplikasi ini merupakan bentuk implementasi platform e-commerce sederhana yang terdiri dari dua halaman utama, yaitu **Halaman Login** (Login Page) dan **Katalog Produk** (Product Catalog Page). Aplikasi dirancang murni menggunakan **HTML5**, **CSS3**, dan **Native JavaScript (Vanilla JS)** tanpa menggunakan framework maupun library eksternal.

Data pengguna serta katalog produk diambil secara dinamis dari REST API publik ([DummyJSON API](https://dummyjson.com/)) memanfaatkan fitur `fetch()`. Proyek ini bertujuan untuk mendemonstrasikan pemahaman mendalam mengenai alur kerja JavaScript asinkron, pengelolaan state lokal, optimasi performa UI, serta penerapan clean code dalam pengembangan web dasar.

## 2. Struktur Proyek

Struktur berkas pada proyek ini disusun secara modular dan terpisah berdasarkan fungsinya untuk mempermudah pemeliharaan kode:

```
Mini Shopee/
├── login.html        # Struktur antarmuka halaman login
├── login.css         # Penataan gaya visual halaman login
├── login.js          # Logika autentikasi dan validasi login
├── catalog.html       # Struktur antarmuka katalog produk dan modal
├── catalog.css        # Penataan gaya visual katalog, navbar, dan modal
└── catalog.js         # Logika interaktif katalog, cart, filter, dan API
```

## 3. Penjelasan Kode dan Logika Aplikasi — Halaman Login

### 3.1 Struktur HTML (`login.html`)

Halaman ini memuat formulir autentikasi yang terdiri dari:

- Input `username` dan `password`
- Tombol submit **"Masuk"**
- Elemen kontainer `#error-message` untuk menampilkan notifikasi kesalahan
- Indikator pemuatan `#loading-spinner`
- Tombol `#toggle-password` yang memungkinkan pengguna melihat atau menyembunyikan karakter kata sandi

Berkas `login.js` dihubungkan menggunakan atribut `defer`. Hal ini memastikan proses pembacaan (parsing) HTML selesai terlebih dahulu sebelum skrip dieksekusi, sehingga tidak menghambat pemuatan visual halaman.

### 3.2 Logika Pemrograman (`login.js`)

#### A. Auth Guard dan Pemeriksaan Sesi (Session Check)

```javascript
const getStoredUser = () => { ... }
if (getStoredUser()) {
  window.location.href = 'catalog.html';
  return;
}
```

Sebelum skrip utama dijalankan, sistem secara otomatis memeriksa status autentikasi pada `localStorage` (menggunakan kunci `loggedInUser`, serta dukungan kompatibilitas balik ke kunci `userFirstName`). Jika data sesi ditemukan, pengguna akan langsung dialihkan ke `catalog.html`. Langkah ini mencegah pengguna yang sudah terautentikasi mengakses kembali halaman login secara tidak sengaja.

#### B. Fungsi Pembantu (Helper Functions)

- **`showError()`** dan **`clearError()`**: Mengatur visibilitas papan notifikasi kesalahan dengan melakukan toggle pada kelas CSS `hidden`.
- **`setLoadingState(isLoading)`**: Mengubah status responsivitas tombol submit (mengubah teks antara "Masuk" dan "Memverifikasi...") serta menampilkan atau menyembunyikan spinner sesuai status proses.

#### C. Fitur Visualisasi Kata Sandi (Toggle Password)

```javascript
togglePasswordBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  ...
});
```

Fungsi ini mengubah atribut `type` pada elemen input antara `password` dan `text` secara dinamis setiap kali ikon mata diklik oleh pengguna.

#### D. Penanganan Autentikasi (Submit Handler)

```javascript
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  ...
  const response = await fetch('https://dummyjson.com/users');
  const data = await response.json();
  const matchedUser = users.find(u => u.username === username && u.password === password);
  ...
});
```

Alur eksekusi saat formulir dikirimkan:

1. **`event.preventDefault()`**: Menghentikan perilaku bawaan peramban yang memicu penyegaran (reload) halaman.
2. **Validasi Input**: Memastikan bidang `username` dan `password` tidak dalam keadaan kosong.
3. **Aktivasi Indikator**: Memanggil `setLoadingState(true)` untuk memberikan umpan balik visual kepada pengguna.
4. **Permintaan Data (Fetch)**: Mengambil data pengguna dari DummyJSON API, kemudian mencocokkan kredensial yang dimasukkan menggunakan pustaka bawaan `Array.prototype.find()`.
5. **Kondisi Berhasil**: Jika data sesuai, nama pengguna disimpan ke dalam `localStorage` sebagai penanda sesi aktif, lalu pengguna diarahkan ke `catalog.html`.
6. **Kondisi Gagal**: Jika tidak ditemukan kecocokan, pesan kesalahan yang relevan akan ditampilkan pada antarmuka.
7. **Penanganan Eksepsi (`try...catch`)**: Menangkap gangguan koneksi jaringan atau kegagalan respons API.
8. **Blok `finally`**: Memastikan `setLoadingState(false)` selalu dipanggil di akhir proses untuk mengembalikan kondisi tombol ke keadaan semula.

## 4. Penjelasan Kode dan Logika Aplikasi — Halaman Katalog Produk

### 4.1 Struktur HTML (`catalog.html`)

Halaman katalog dirancang secara komprehensif mencakup:

- **Bar Navigasi (Navbar)**: Menyediakan pencarian cepat, ucapan selamat datang dinamis, menu akun, dan tombol akses keranjang belanja
- **Mega Menu Kategori**: Navigasi kategori bertingkat dengan animasi visual
- **Filter dan Pengurutan**: Panel kontrol untuk menyaring dan mengurutkan daftar produk
- **Grid Produk (`#productGrid`)**: Area utama penayangan kartu produk
- **Pagination**: Tombol "Load More" untuk memuat produk secara bertahap
- **Komponen Modal**: Dua jendela pop-up independen untuk detail produk (`#modal`) dan keranjang belanja (`#cartModal`)

### 4.2 Logika Pemrograman (`catalog.js`)

#### A. Proteksi Halaman (Auth Guard)

```javascript
function authGuard(navGreetingEl) {
  let user = localStorage.getItem(AUTH_KEY) || localStorage.getItem(LEGACY_AUTH_KEY);
  if (!user) {
    window.location.replace(LOGIN_PAGE);
    return false;
  }
  ...
}
```

Fungsi `authGuard()` dieksekusi pada tahap inisialisasi (`init()`). Apabila tidak ada sesi login yang sah, peramban akan mengalihkan halaman secara paksa ke `login.html` menggunakan `location.replace()`. Penggunaan fungsi ini bertujuan agar halaman katalog tidak terekam dalam riwayat peramban (browser history). Sebaliknya, jika pengguna terverifikasi, sistem akan menyapa pengguna pada bar navigasi (contoh: "Halo, NamaPengguna").

#### B. Pengendali Kesalahan Global (Global Error Controller)

```javascript
function createGlobalErrorController(globalError, globalErrorText, globalErrorClose) {
  function show(message) { ... }
  function hide() { ... }
  return { show, hide };
}
```

Menerapkan pola desain yang menyediakan objek reusable (`window.AppError`). Objek ini memuat metode `show()` dan `hide()` untuk menampilkan spanduk pemberitahuan kesalahan di bagian atas halaman saat pengambilan data produk mengalami kegagalan.

#### C. Dynamic Mega Menu

Struktur data kategori beserta sub-item disimpan dalam objek `megaData`. Ketika tab kategori diklik, fungsi `buildColumns()` merender elemen HTML secara dinamis. Tab "New" memanfaatkan logika khusus (`buildNewArrivalsColumns()`) yang menyaring item dengan atribut `highlight: true` dari seluruh kategori yang ada.

#### D. Pencarian Real-Time (Debounce dan Closure)

```javascript
function debounce(fn, delay) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

Penerapan fungsi `debounce()` bertujuan untuk mengoptimalkan performa pencarian. Fungsi ini memanfaatkan konsep *closure* untuk mempertahankan variabel `timeoutId` di dalam memori.

Setiap kali pengguna mengetik karakter baru, timer terdahulu dibatalkan (`clearTimeout`). Hasilnya, eksekusi pembaruan katalog (`emitSearch`) baru dipicu setelah pengguna berhenti mengetik selama 300ms, sehingga menghindarkan proses kalkulasi berulang yang tidak perlu pada setiap ketukan tombol (keystroke).

Pencarian yang telah diproses kemudian dikirimkan menggunakan Custom Event (`catalog:search`):

```javascript
const emitSearch = debounce(function () {
  const query = searchInput.value.trim();
  document.dispatchEvent(new CustomEvent("catalog:search", { detail: { query } }));
}, SEARCH_DEBOUNCE_MS);
```

#### E. Pengelolaan Keranjang Belanja (LocalStorage CRUD)

Sistem keranjang belanja dikelola secara mandiri menggunakan operasi *Create, Read, Update, Delete* (CRUD) yang terhubung ke `localStorage`:

- **`getCart()`**: Membaca dan mengonversi data JSON keranjang dari penyimpanan lokal.
- **`saveCart(cart)`**: Menyimpan status keranjang terbaru dan secara otomatis memperbarui antarmuka melalui `updateCartUI()` dan `renderCart()` (single source of truth).
- **`addToCart(product)`**: Menambahkan produk ke keranjang; jika produk sudah ada, kuantitas akan bertambah secara otomatis.
- **`changeQuantity(id, amount)`**: Mengatur penambahan atau pengurangan jumlah item. Item dengan kuantitas kurang dari atau sama dengan 0 akan dihapus otomatis dari daftar.
- **`removeFromCart(id)`**: Menghapus produk tertentu dari keranjang berdasarkan ID.
- **`renderCart()`**: Merender ulang komponen `#cartItems` menggunakan teknik *Event Delegation* (`data-cart-action` dan `data-product-id`).
- **`updateCartUI()`**: Mengkalkulasi akumulasi kuantitas dan total harga belanjaan untuk diperbarui pada badge navigasi serta tampilan modal.

#### F. Pengolahan Data Produk (Filtering, Sorting, dan Pagination)

```javascript
function sortProducts(products) { ... }
function updateProductResults(resetVisibleCount) { ... }
function renderProducts() { ... }
```

- **Filtering**: Kombinasi kata kunci pencarian dan kategori diproses di dalam `updateProductResults()` untuk memfilter array `allProducts` menjadi `filteredProducts`.
- **Sorting**: Pengurutan data dilakukan menggunakan `Array.prototype.sort()` berdasarkan kriteria harga terendah, harga tertinggi, maupun rating terbaik.
- **Pagination (Load More)**: Penampilan produk menggunakan teknik array slicing (`slice()`). Nilai acuan `visibleProductCount` dimulai dari 12 item. Saat tombol "Load More" diklik, batas penayangan bertambah (+12) tanpa perlu melakukan request ulang ke API server.

#### G. Pengambilan Data Produk (API Fetching)

```javascript
async function loadProducts() {
  try {
    const response = await fetch(PRODUCTS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allProducts = data.products;
    fillCategoryFilter();
    updateProductResults(true);
  } catch (error) {
    window.AppError.show("Produk gagal dimuat. Sila periksa koneksi internet Anda.");
  }
}
```

Aplikasi memuat data 100 produk sekaligus (`?limit=100`) dari DummyJSON. Kegagalan respons jaringan atau status HTTP non-2xx akan ditangkap oleh blok `catch` dan memicu penayangan notifikasi error global.

#### H. Modal Detail Produk dan Event Delegation

```javascript
productGrid.addEventListener("click", function (e) {
  const card = e.target.closest(".product-card");
  if (!card) return;
  const product = JSON.parse(card.dataset.productJson || "{}");

  if (e.target.closest(".btn-add-card")) {
    addToCart(product);
    return;
  }
  openModal(product);
});
```

Penanganan aksi klik pada kartu produk menerapkan teknik *Event Delegation*. Event listener dipasang satu kali pada kontainer induk (`#productGrid`). Data masing-masing produk disimpan dalam format string JSON pada atribut HTML `data-product-json`.

Saat bagian kartu diklik:

- Jika elemen yang diklik adalah tombol "Tambah ke Keranjang", fungsi `addToCart()` akan langsung dijalankan.
- Jika area kartu lainnya yang diklik, aplikasi akan memanggil `openModal()` untuk menampilkan rincian informasi produk seperti merek, ketersediaan stok, deskripsi lengkap, serta harga.
