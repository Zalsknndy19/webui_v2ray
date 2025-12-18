# ZHStore VPN Configurator

![ZHStore Logo](https://zhwifi.web.id/favicon.ico) <!-- Ganti dengan URL logo jika ada -->

Sebuah aplikasi web sederhana namun kuat untuk membuat konfigurasi VLESS secara dinamis. Proyek ini direplikasi dari fungsionalitas [FoolVPN Nautica](https://foolvpn.me/nautica) dengan menggunakan HTML dan JavaScript murni (Vanilla JS), membuatnya sangat ringan dan bisa di-deploy di mana saja, termasuk GitHub Pages.

**Akses Live Demo:** [https://zalsknndy19.github.io/webui_v2ray/](https://zalsknndy19.github.io/webui_v2ray/) <!-- Ganti dengan URL GitHub Pages Anda -->

---

## ✨ Fitur Utama

- **Daftar Server Dinamis:** Secara otomatis mengambil dan menampilkan daftar server terbaru dari sumber eksternal.
- **Antarmuka Reaktif:** Filter berdasarkan negara dan cari server secara *real-time* tanpa me-refresh halaman.
- **Generator Konfigurasi Sisi-Klien:** Semua proses pembuatan URI VLESS terjadi langsung di browser Anda. Tidak ada data yang dikirim ke server.
- **Kustomisasi Penuh:** Atur sendiri Bug CDN, Worker Host (SNI), UUID, dan parameter lainnya melalui menu Settings.
- **Pembacaan Parameter URL:** Secara otomatis mendeteksi Worker Host dari parameter URL (`?host=...`) untuk kemudahan berbagi.
- **Export Sekali Klik:** Pilih server yang Anda inginkan dan salin semua URI yang sudah jadi ke clipboard dengan satu tombol.
- **100% Statis:** Dibangun hanya dengan HTML, CSS, dan JavaScript murni. Tidak memerlukan *backend* dan sangat cepat.

---

## 🚀 Cara Menggunakan

Ini adalah panduan untuk pengguna akhir yang ingin menggunakan aplikasi ini.

1.  **Buka Halaman Aplikasi:** Kunjungi tautan [Live Demo](https://zalsknndy19.github.io/webui_v2ray/) di atas.
2.  **(Opsional) Gunakan Worker Anda:** Jika Anda memiliki alamat Cloudflare Worker sendiri, tambahkan di akhir URL, contoh:
    ```
    https://zalsknndy19.github.io/webui_v2ray/?host=domain.workers.kalian
    ```
3.  **Buka Settings:** Klik tombol **"Settings"** di bagian bawah.
    - **Worker Host (SNI)** dan **UUID** seharusnya sudah terisi secara otomatis.
    - Masukkan **Bug CDN / Host** yang Anda miliki.
    - Klik **"Done"**.
4.  **Pilih Server:** Klik pada kartu-kartu server yang ingin Anda gunakan. Kartu yang dipilih akan ditandai dengan warna hijau. Anda bisa menggunakan filter negara atau pencarian untuk mempermudah.
5.  **Export Konfigurasi:** Klik tombol **"Export"**. Semua URI VLESS dari server yang Anda pilih akan secara otomatis tersalin ke clipboard Anda.
6.  **Impor ke Aplikasi Anda:** Buka aplikasi V2Ray (seperti v2rayNG, Nekobox, dll.) dan impor konfigurasi dari clipboard.

---

## 🔧 Untuk Developer: Cara Menjalankan Secara Lokal

Jika Anda ingin meng-hosting atau memodifikasi proyek ini sendiri.

### Prasyarat

- Web server lokal sederhana (misalnya, server bawaan PHP, Live Server di VS Code).

### Instalasi

1.  **Clone repositori ini:**
    ```bash
    git clone https://github.com/zalsknndy19/webui_v2ray.git
    ```
2.  **Masuk ke direktori proyek:**
    ```bash
    cd webui_v2ray
    ```
3.  **Jalankan di web server:**
    Buka file `index.html` langsung di browser atau jalankan melalui web server lokal Anda.

### Kustomisasi

- **Sumber Daftar Server:** Ubah URL di dalam file `script.js` pada konstanta `PROXY_LIST_URL` untuk menunjuk ke file `.txt` Anda sendiri. Format file `.txt` harus: `IP,PORT,KODE_NEGARA,NAMA_PROVIDER`
- **Tampilan:** Semua gaya visual bisa diubah di dalam file `style.css`.
- **Logika:** Semua fungsionalitas inti berada di dalam file `script.js`.

---

## 🤝 Kontribusi

Merasa ada yang bisa ditingkatkan? Silakan buka *issue* untuk mendiskusikan perubahan atau ajukan *pull request*. Semua kontribusi sangat diterima!

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [Lisensi MIT](LICENSE). <!-- Buat file LICENSE jika perlu -->
