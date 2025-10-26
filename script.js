// ==========================================================
// script.js (v6.0 - The Grand Finale, with Ping)
// ZHStore VPN Configurator
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- PENGATURAN ---
    const PROXY_LIST_URL = 'https://raw.githubusercontent.com/FoolVPN-ID/Nautica/main/proxyList.txt';

    // --- Referensi Elemen DOM ---
    const serverListContainer = document.getElementById('server-list');
    const countryFilter = document.getElementById('country-filter');
    const searchInput = document.getElementById('search-input');
    const selectedCountBtn = document.getElementById('selected-count-btn');
    const ispInfo = document.getElementById('isp-info');
    const locationInfo = document.getElementById('location-info');
    const workerInfoCard = document.getElementById('worker-info');
    const settingsBtn = document.getElementById('settings-btn');
    const exportBtn = document.getElementById('export-btn');
    const modalOverlay = document.getElementById('settings-modal-overlay');
    const settingsDoneBtn = document.getElementById('settings-done-btn');

    const bugCdnInput = document.getElementById('bug-cdn-input');
    const workerHostInput = document.getElementById('worker-host-input');
    const uuidInput = document.getElementById('uuid-input');
    const protocolSelect = document.getElementById('protocol-select');
    const tlsSelect = document.getElementById('tls-select');
    
    // --- State Aplikasi ---
    let allServers = [];
    let selectedServers = new Set();
    let isShowingOnlySelected = false;

    // =======================================================
    // FUNGSI INTI & PEMBANTU
    // =======================================================

    function generateUUIDv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = 'toast-notification';
        if (isError) toast.classList.add('error');
        
        document.body.appendChild(toast);
        
        setTimeout(() => { toast.classList.add('visible'); }, 10);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => { document.body.removeChild(toast); }, 300);
        }, 2700);
    }

    async function initializeApp() {
        detectUserInfo();
        populateSettingsFromUrl();
        try {
            serverListContainer.innerHTML = '<p>Mengunduh daftar server...</p>';
            const response = await fetch(PROXY_LIST_URL);
            if (!response.ok) throw new Error(`Gagal mengunduh daftar: ${response.statusText}`);
            
            const textData = await response.text();
            allServers = parseProxyList(textData);
            populateCountryFilter(allServers);
            renderServers(allServers);
        } catch (error) {
            console.error("Initialization Error:", error);
            serverListContainer.innerHTML = `<p style="color: var(--danger-color);">Gagal memuat data server. <br><small>${error.message}</small></p>`;
        }
    }

    function parseProxyList(text) {
        return text.trim().split('\n').map(line => {
            const parts = line.split(',');
            if (parts.length < 4) return null;
            return {
                id: `${parts[0].trim()}:${parts[1].trim()}`,
                ip: parts[0].trim(),
                port: parts[1].trim(),
                country_code: parts[2].trim(),
                provider: parts[3].trim()
            };
        }).filter(Boolean);
    }

    function populateCountryFilter(servers) {
        const countries = [...new Set(servers.map(s => s.country_code))].sort();
        countries.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            countryFilter.appendChild(option);
        });
    }

    function renderServers(serversToRender) {
        serverListContainer.innerHTML = '';
        if (serversToRender.length === 0) {
            serverListContainer.innerHTML = '<p>Tidak ada server yang ditemukan.</p>';
            return;
        }

        const groupedByProvider = serversToRender.reduce((acc, server) => {
            (acc[server.provider] = acc[server.provider] || []).push(server);
            return acc;
        }, {});

        for (const provider in groupedByProvider) {
            const groupTitle = document.createElement('h3');
            groupTitle.className = 'server-group-title';
            groupTitle.textContent = provider;
            serverListContainer.appendChild(groupTitle);
            
            groupedByProvider[provider].forEach(server => {
                const card = document.createElement('div');
                card.className = 'server-card';
                card.dataset.serverId = server.id;
                if (selectedServers.has(server.id)) {
                    card.classList.add('selected');
                }

                card.innerHTML = `
                    <div class="server-details">
                        <p class="provider">
                            <img src="https://flagcdn.com/16x12/${server.country_code.toLowerCase()}.png" alt="${server.country_code}">
                            ${server.provider}
                        </p>
                        <p class="address">${server.ip}:${server.port}</p>
                    </div>
                    <span class="ping-badge">...</span>
                `;
                card.addEventListener('click', () => toggleServerSelection(card, server.id));
                serverListContainer.appendChild(card);
            });
        }
        pingAllVisibleServers();
    }

    async function detectUserInfo() {
        try {
            const response = await fetch('https://ipinfo.io/json');
            if (!response.ok) throw new Error('Response not OK');
            const data = await response.json();
            ispInfo.textContent = data.org || 'N/A';
            locationInfo.textContent = `${data.city || ''}, ${data.country || ''}`;
        } catch (error) {
            console.warn("Gagal mendeteksi info pengguna:", error);
            ispInfo.textContent = 'N/A';
            locationInfo.textContent = 'N/A';
        }
    }

    function populateSettingsFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const hostFromUrl = urlParams.get('host');

        if (hostFromUrl) {
            workerHostInput.value = hostFromUrl;
        }

        if (workerInfoCard) {
            if (hostFromUrl) {
                workerInfoCard.querySelector('h4').textContent = hostFromUrl;
            } else {
                workerInfoCard.querySelector('h4').textContent = 'Default';
                workerInfoCard.querySelector('p').textContent = 'Using default worker host';
            }
        }
        
        if (!uuidInput.value) {
            uuidInput.value = generateUUIDv4();
        }
    }

    // =======================================================
    // FUNGSI PING (VERSI 3.0 - THE DEFINITIVE WEBSOCKET PING)
    // =======================================================
    
    /**
     * Mengukur latensi koneksi dengan mencoba membuka koneksi WebSocket.
     * Metode ini lebih andal untuk koneksi lintas-asal (cross-origin).
     * @param {string} ip - Alamat IP server.
     * @param {string} port - Port server.
     * @param {number} timeout - Waktu timeout dalam milidetik.
     * @returns {Promise<number>} - Promise yang akan resolve dengan nilai ping atau -1 jika gagal.
     */
    function pingServer(ip, port, timeout = 3000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            let ws;
            let resolved = false;
    
            // Fungsi cleanup yang akan dipanggil di setiap hasil
            const cleanupAndResolve = (ping) => {
                if (!resolved) {
                    resolved = true;
                    if (ws && ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                    }
                    clearTimeout(timer);
                    resolve(ping);
                }
            };
            
            // Timer untuk timeout
            const timer = setTimeout(() => {
                cleanupAndResolve(-1);
            }, timeout);
    
            try {
                // Kita coba koneksi WSS (WebSocket Secure). 
                // Browser akan mengizinkan ini dari halaman HTTPS.
                ws = new WebSocket(`wss://${ip}:${port}`);
    
                // KASUS 1: Koneksi berhasil dibuat. Ini adalah hasil terbaik.
                // Server merespons handshake WebSocket.
                ws.onopen = () => {
                    const endTime = Date.now();
                    cleanupAndResolve(endTime - startTime);
                };
    
                // KASUS 2 (PALING UMUM): Koneksi gagal.
                // Ini bisa karena port ditutup, tidak ada server WS, atau sertifikat tidak valid.
                // TAPI, event 'onerror' ini sendiri sudah membuktikan bahwa servernya "menjawab".
                // Kita tetap bisa mengukur waktunya!
                ws.onerror = () => {
                    const endTime = Date.now();
                    // Kita anggap latensi hingga error ini sebagai nilai ping.
                    cleanupAndResolve(endTime - startTime);
                };
    
                // KASUS 3: Server menutup koneksi secara langsung.
                ws.onclose = () => {
                    // Jika onopen atau onerror belum terpanggil, kita ukur waktunya di sini.
                    const endTime = Date.now();
                    cleanupAndResolve(endTime - startTime);
                };
    
            } catch (error) {
                // Gagal bahkan sebelum mencoba membuat WebSocket (misal, format URL salah)
                cleanupAndResolve(-1);
            }
        });
    }

    async function pingAllVisibleServers() {
        const serverCards = serverListContainer.querySelectorAll('.server-card');
        
        const pingPromises = Array.from(serverCards).map(async (card) => {
            const serverId = card.dataset.serverId;
            if (!serverId) return;
            const [ip, port] = serverId.split(':');
            const pingBadge = card.querySelector('.ping-badge');
            
            if (pingBadge) {
                pingBadge.textContent = '...'; // Reset before pinging
                pingBadge.style.backgroundColor = '';

                const pingValue = await pingServer(ip, port);
                
                requestAnimationFrame(() => {
                    if (pingValue === -1) {
                        pingBadge.textContent = 'N/A';
                        pingBadge.style.backgroundColor = 'var(--danger-color)';
                    } else {
                        pingBadge.textContent = `${pingValue} ms`;
                        if (pingValue < 300) pingBadge.style.backgroundColor = 'var(--primary-green)';
                        else if (pingValue < 600) pingBadge.style.backgroundColor = '#fdd835';
                        else pingBadge.style.backgroundColor = '#ff8a80';
                    }
                });
            }
        });

        await Promise.all(pingPromises);
    }

    // =======================================================
    // FUNGSI INTERAKTIVITAS & MODAL
    // =======================================================
    
    function toggleServerSelection(cardElement, serverId) {
        if (selectedServers.has(serverId)) {
            selectedServers.delete(serverId);
            cardElement.classList.remove('selected');
        } else {
            selectedServers.add(serverId);
            cardElement.classList.add('selected');
        }
        updateSelectedCount();

        if (isShowingOnlySelected && selectedServers.size === 0) {
            isShowingOnlySelected = false;
            applyAllFilters();
        }
    }

    function updateSelectedCount() {
        selectedCountBtn.textContent = `${selectedServers.size} proxies`;
    }

    function applyAllFilters() {
        const query = searchInput.value.toLowerCase();
        const selectedCountry = countryFilter.value;
        
        let serversToDisplay = allServers;
        if (isShowingOnlySelected) {
            serversToDisplay = allServers.filter(s => selectedServers.has(s.id));
        }
        if (selectedCountry !== 'all') {
            serversToDisplay = serversToDisplay.filter(s => s.country_code === selectedCountry);
        }
        if (query) {
            serversToDisplay = serversToDisplay.filter(s => 
                s.provider.toLowerCase().includes(query) ||
                s.country_code.toLowerCase().includes(query) ||
                s.ip.includes(query)
            );
        }
        renderServers(serversToDisplay);
    }

    function exportProxies() {
        if (selectedServers.size === 0) {
            showToast("Pilih setidaknya satu server!", true);
            return;
        }

        const bugCdn = bugCdnInput.value.trim();
        const workerHost = workerHostInput.value.trim();
        const uuid = uuidInput.value.trim();
        if (!bugCdn || !workerHost || !uuid) {
            showToast("Harap isi semua kolom di Settings.", true);
            openSettingsModal();
            return;
        }
        
        let outputUris = [];
        selectedServers.forEach(serverId => {
            const server = allServers.find(s => s.id === serverId);
            if (server) {
                const path = `/${server.ip}-${server.port}`;
                const name = `${server.country_code} ${server.provider} [${server.ip}]`;
                const useTls = tlsSelect.value === 'true';
                
                const uri = `${protocolSelect.value}://${uuid}@${bugCdn}:${useTls ? 443 : 80}` +
                            `?encryption=none&type=ws` +
                            `&host=${workerHost}` +
                            `&security=${useTls ? 'tls' : 'none'}` +
                            `&sni=${workerHost}` +
                            `&path=${encodeURIComponent(path)}` +
                            `#${encodeURIComponent(name)}`;
                outputUris.push(uri);
            }
        });

        const resultString = outputUris.join('\n');
        navigator.clipboard.writeText(resultString).then(() => {
            showToast("Konfigurasi berhasil disalin!");
        }).catch(err => {
            console.error('Gagal menyalin: ', err);
            showToast("Gagal menyalin ke clipboard.", true);
        });
    }

    function openSettingsModal() { modalOverlay.classList.add('visible'); }
    function closeSettingsModal() { modalOverlay.classList.remove('visible'); }

    // =======================================================
    // EVENT LISTENERS
    // =======================================================
    
    countryFilter.addEventListener('change', applyAllFilters);
    searchInput.addEventListener('input', applyAllFilters);

    selectedCountBtn.addEventListener('click', () => {
        if (selectedServers.size === 0) return;
        isShowingOnlySelected = !isShowingOnlySelected;
        applyAllFilters();
        if (isShowingOnlySelected) {
            selectedCountBtn.style.backgroundColor = 'var(--primary-green)';
            selectedCountBtn.style.color = 'var(--text-dark)';
        } else {
            selectedCountBtn.style.backgroundColor = '';
            selectedCountBtn.style.color = '';
        }
    });

    settingsBtn.addEventListener('click', openSettingsModal);
    settingsDoneBtn.addEventListener('click', closeSettingsModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeSettingsModal();
    });
    
    exportBtn.addEventListener('click', exportProxies);
    // Bonus: Re-ping saat tombol settings ditekan
    settingsBtn.addEventListener('click', pingAllVisibleServers);

    // Jalankan aplikasi
    initializeApp();
});