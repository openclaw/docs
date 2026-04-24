---
read_when:
    - Menjalankan Gateway OpenClaw di WSL2 sementara Chrome berada di Windows
    - Melihat error browser/control-ui yang saling tumpang tindih di WSL2 dan Windows
    - Memutuskan antara host-local Chrome MCP dan CDP jarak jauh mentah dalam penyiapan host-terpisah
summary: Pemecahan masalah Gateway WSL2 + Chrome Windows remote CDP secara berlapis
title: Pemecahan masalah WSL2 + Windows + Chrome jarak jauh CDP
x-i18n:
    generated_at: "2026-04-24T09:29:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

Panduan ini membahas penyiapan split-host yang umum, yaitu saat:

- OpenClaw Gateway berjalan di dalam WSL2
- Chrome berjalan di Windows
- kontrol browser harus melintasi batas WSL2/Windows

Panduan ini juga membahas pola kegagalan berlapis dari [issue #39369](https://github.com/openclaw/openclaw/issues/39369): beberapa masalah independen dapat muncul sekaligus, yang membuat lapisan yang salah terlihat rusak lebih dulu.

## Pilih mode browser yang tepat terlebih dahulu

Anda memiliki dua pola yang valid:

### Opsi 1: CDP jarak jauh mentah dari WSL2 ke Windows

Gunakan profil browser jarak jauh yang menunjuk dari WSL2 ke endpoint CDP Chrome di Windows.

Pilih ini saat:

- Gateway tetap berada di dalam WSL2
- Chrome berjalan di Windows
- Anda memerlukan kontrol browser yang melintasi batas WSL2/Windows

### Opsi 2: Chrome MCP host-local

Gunakan `existing-session` / `user` hanya saat Gateway sendiri berjalan pada host yang sama dengan Chrome.

Pilih ini saat:

- OpenClaw dan Chrome berada di mesin yang sama
- Anda menginginkan state browser lokal yang sudah login
- Anda tidak memerlukan transport browser lintas host
- Anda tidak memerlukan rute lanjutan yang hanya tersedia pada managed/raw-CDP seperti `responsebody`, ekspor PDF, intersepsi unduhan, atau aksi batch

Untuk Gateway WSL2 + Chrome Windows, utamakan CDP jarak jauh mentah. Chrome MCP bersifat host-local, bukan bridge WSL2-ke-Windows.

## Arsitektur yang berfungsi

Bentuk referensi:

- WSL2 menjalankan Gateway di `127.0.0.1:18789`
- Windows membuka UI Kontrol di browser normal pada `http://127.0.0.1:18789/`
- Chrome Windows mengekspos endpoint CDP pada port `9222`
- WSL2 dapat menjangkau endpoint CDP Windows tersebut
- OpenClaw mengarahkan profil browser ke alamat yang dapat dijangkau dari WSL2

## Mengapa penyiapan ini membingungkan

Beberapa kegagalan dapat saling tumpang tindih:

- WSL2 tidak dapat menjangkau endpoint CDP Windows
- UI Kontrol dibuka dari origin yang tidak aman
- `gateway.controlUi.allowedOrigins` tidak cocok dengan origin halaman
- token atau pairing tidak ada
- profil browser menunjuk ke alamat yang salah

Karena itu, memperbaiki satu lapisan masih dapat meninggalkan error lain yang tetap terlihat.

## Aturan penting untuk UI Kontrol

Saat UI dibuka dari Windows, gunakan localhost Windows kecuali Anda memiliki penyiapan HTTPS yang disengaja.

Gunakan:

`http://127.0.0.1:18789/`

Jangan menggunakan IP LAN sebagai default untuk UI Kontrol. HTTP biasa pada alamat LAN atau tailnet dapat memicu perilaku insecure-origin/device-auth yang tidak terkait dengan CDP itu sendiri. Lihat [UI Kontrol](/id/web/control-ui).

## Validasi secara berlapis

Kerjakan dari atas ke bawah. Jangan melompat.

### Lapisan 1: Verifikasi bahwa Chrome menyajikan CDP di Windows

Mulai Chrome di Windows dengan remote debugging diaktifkan:

```powershell
chrome.exe --remote-debugging-port=9222
```

Dari Windows, verifikasi Chrome itu sendiri terlebih dahulu:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Jika ini gagal di Windows, OpenClaw belum menjadi masalahnya.

### Lapisan 2: Verifikasi bahwa WSL2 dapat menjangkau endpoint Windows tersebut

Dari WSL2, uji alamat persis yang akan Anda gunakan di `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Hasil yang baik:

- `/json/version` mengembalikan JSON dengan metadata Browser / Protocol-Version
- `/json/list` mengembalikan JSON (array kosong tidak masalah jika tidak ada halaman yang terbuka)

Jika ini gagal:

- Windows belum mengekspos port tersebut ke WSL2
- alamatnya salah untuk sisi WSL2
- firewall / port forwarding / proxy lokal masih belum ada

Perbaiki itu sebelum menyentuh config OpenClaw.

### Lapisan 3: Konfigurasikan profil browser yang benar

Untuk CDP jarak jauh mentah, arahkan OpenClaw ke alamat yang dapat dijangkau dari WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Catatan:

- gunakan alamat yang dapat dijangkau WSL2, bukan alamat yang hanya berfungsi di Windows
- pertahankan `attachOnly: true` untuk browser yang dikelola secara eksternal
- `cdpUrl` dapat berupa `http://`, `https://`, `ws://`, atau `wss://`
- gunakan HTTP(S) saat Anda ingin OpenClaw menemukan `/json/version`
- gunakan WS(S) hanya saat penyedia browser memberi Anda URL socket DevTools langsung
- uji URL yang sama dengan `curl` sebelum mengharapkan OpenClaw berhasil

### Lapisan 4: Verifikasi lapisan UI Kontrol secara terpisah

Buka UI dari Windows:

`http://127.0.0.1:18789/`

Lalu verifikasi:

- origin halaman cocok dengan yang diharapkan `gateway.controlUi.allowedOrigins`
- autentikasi token atau pairing dikonfigurasi dengan benar
- Anda tidak sedang men-debug masalah autentikasi UI Kontrol seolah-olah itu masalah browser

Halaman yang membantu:

- [UI Kontrol](/id/web/control-ui)

### Lapisan 5: Verifikasi kontrol browser end-to-end

Dari WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Hasil yang baik:

- tab terbuka di Chrome Windows
- `openclaw browser tabs` mengembalikan target
- aksi berikutnya (`snapshot`, `screenshot`, `navigate`) berfungsi dari profil yang sama

## Error umum yang menyesatkan

Perlakukan setiap pesan sebagai petunjuk spesifik lapisan:

- `control-ui-insecure-auth`
  - masalah origin UI / secure-context, bukan masalah transport CDP
- `token_missing`
  - masalah konfigurasi autentikasi
- `pairing required`
  - masalah persetujuan perangkat
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 tidak dapat menjangkau `cdpUrl` yang dikonfigurasi
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - endpoint HTTP menjawab, tetapi WebSocket DevTools masih tidak dapat dibuka
- override viewport / dark-mode / locale / offline yang stale setelah sesi jarak jauh
  - jalankan `openclaw browser stop --browser-profile remote`
  - ini menutup sesi kontrol aktif dan melepaskan state emulasi Playwright/CDP tanpa memulai ulang gateway atau browser eksternal
- `gateway timeout after 1500ms`
  - sering kali tetap merupakan masalah keterjangkauan CDP atau endpoint jarak jauh yang lambat/tidak dapat dijangkau
- `No Chrome tabs found for profile="user"`
  - profil Chrome MCP lokal dipilih saat tidak ada tab host-local yang tersedia

## Checklist triase cepat

1. Windows: apakah `curl http://127.0.0.1:9222/json/version` berfungsi?
2. WSL2: apakah `curl http://WINDOWS_HOST_OR_IP:9222/json/version` berfungsi?
3. Config OpenClaw: apakah `browser.profiles.<name>.cdpUrl` menggunakan alamat persis yang dapat dijangkau WSL2 itu?
4. UI Kontrol: apakah Anda membuka `http://127.0.0.1:18789/` alih-alih IP LAN?
5. Apakah Anda mencoba menggunakan `existing-session` lintas WSL2 dan Windows alih-alih CDP jarak jauh mentah?

## Kesimpulan praktis

Penyiapan ini biasanya layak dilakukan. Bagian sulitnya adalah transport browser, keamanan origin UI Kontrol, dan token/pairing masing-masing dapat gagal secara independen sambil terlihat mirip dari sisi pengguna.

Jika ragu:

- verifikasi endpoint Chrome Windows secara lokal terlebih dahulu
- verifikasi endpoint yang sama dari WSL2 setelah itu
- baru kemudian debug config OpenClaw atau autentikasi UI Kontrol

## Terkait

- [Browser](/id/tools/browser)
- [Login browser](/id/tools/browser-login)
- [Pemecahan masalah Browser Linux](/id/tools/browser-linux-troubleshooting)
