# Heavenly Demons VLESS Configurator

Ini adalah aplikasi web statis untuk menghasilkan konfigurasi VLESS berdasarkan daftar proxy yang disediakan.

## Skrip Cloudflare Ping Worker

Untuk fungsionalitas ping yang akurat, aplikasi ini mengandalkan Cloudflare Worker. Worker ini menerima permintaan dengan IP dan port, kemudian mengukur latensi koneksi HTTP ke target. Metode ini sangat kompatibel dan tidak memerlukan pengaturan khusus.

### Cara Deploy

1.  Buat Worker baru di dasbor Cloudflare Anda.
2.  Salin kode di bawah ini dan tempelkan ke editor Worker.
3.  Klik **Deploy**.
4.  Salin URL Worker yang telah di-deploy dan tempelkan ke kolom "URL Ping Kustom" di aplikasi web.

### Kode Worker (Sangat Kompatibel)

```javascript
// Nama Worker: ping-tester-worker-http
// TIDAK memerlukan compatibility flag

export default {
  async fetch(request, env, ctx) {
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Error: Method not allowed. Please use POST.', {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      const { ip, port } = await request.json();

      if (!ip || !port) {
        return new Response(JSON.stringify({ error: 'IP and port are required.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Gunakan AbortController untuk mengatur timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 detik timeout

      const startTime = Date.now();

      // Metode alternatif: kirim permintaan HEAD dan ukur waktu respons.
      // Ini mengukur latensi HTTP, yang merupakan proxy yang bagus untuk ping.
      await fetch(`http://${ip}:${port}`, {
        method: 'HEAD', // HEAD lebih ringan daripada GET
        signal: controller.signal,
        mode: 'no-cors' // Penting untuk menghindari error CORS di sisi worker
      });

      const endTime = Date.now();
      clearTimeout(timeoutId);

      const ping = endTime - startTime;

      return new Response(JSON.stringify({ ip, port, ping }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (e) {
      // Jika fetch gagal (timeout, koneksi ditolak, dll.)
      console.error(`Fetch to ${ip}:${port} failed: ${e.message}`);
      return new Response(JSON.stringify({ ping: -1, error: e.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
```
