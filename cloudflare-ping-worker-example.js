// Cloudflare Worker: Ping Tester
// Deskripsi: Worker ini menerima permintaan POST dengan IP dan port,
// kemudian mencoba membuka koneksi TCP ke target tersebut untuk mengukur latensi.

export default {
  async fetch(request, env, ctx) {
    // --- Menangani Preflight Request untuk CORS ---
    // Ini penting agar browser mengizinkan web app Anda memanggil worker ini.
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // --- Hanya izinkan metode POST ---
    if (request.method !== 'POST') {
      return new Response('Metode tidak diizinkan. Harap gunakan POST.', { status: 405 });
    }

    // --- Membaca dan memvalidasi body JSON ---
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createJsonResponse({ error: 'Body JSON tidak valid.' }, 400);
    }

    const { ip, port } = body;
    if (!ip || !port) {
      return createJsonResponse({ error: 'Parameter "ip" dan "port" diperlukan.' }, 400);
    }

    // --- Melakukan Tes Koneksi ---
    const startTime = Date.now();
    try {
      // connect() adalah API dari Cloudflare Workers untuk membuka koneksi TCP.
      // Ini adalah cara paling efisien untuk tes latensi.
      const socket = await connect({ hostname: ip, port: parseInt(port, 10) });

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Tutup socket setelah berhasil terhubung.
      socket.close();

      return createJsonResponse({ ping: latency });

    } catch (error) {
      // Jika koneksi gagal (misal, timeout, ditolak), kembalikan -1.
      console.error(`Gagal terhubung ke ${ip}:${port}: ${error}`);
      return createJsonResponse({ ping: -1, error: error.message });
    }
  },
};

// Fungsi bantuan untuk membuat respons JSON dengan header CORS yang benar
function createJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Izinkan semua domain (untuk kemudahan)
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Fungsi bantuan untuk menangani preflight request
function handleOptions(request) {
  const headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS preflight requests.
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: 'POST, OPTIONS',
      },
    });
  }
}
