---
read_when:
    - Menjalankan OpenClaw Gateway di WSL2 sementara Chrome berada di Windows
    - Melihat error browser/control-ui yang saling tumpang tindih di WSL2 dan Windows
    - Menentukan antara Chrome MCP lokal host dan CDP jarak jauh mentah dalam penyiapan host terpisah
summary: Memecahkan masalah Gateway WSL2 + Chrome Windows CDP jarak jauh secara berlapis
title: Pemecahan masalah WSL2 + Windows + Chrome CDP jarak jauh
x-i18n:
    generated_at: "2026-04-05T14:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# Pemecahan masalah WSL2 + Windows + Chrome CDP jarak jauh

Panduan ini membahas penyiapan host terpisah yang umum, yaitu:

- OpenClaw Gateway berjalan di dalam WSL2
- Chrome berjalan di Windows
- kontrol browser harus melintasi batas WSL2/Windows

Panduan ini juga mencakup pola kegagalan berlapis dari [issue #39369](https://github.com/openclaw/openclaw/issues/39369): beberapa masalah independen dapat muncul sekaligus, yang membuat lapisan yang salah terlihat seperti rusak lebih dulu.

## Pilih mode browser yang tepat terlebih dahulu

Anda memiliki dua pola yang valid:

### Opsi 1: CDP jarak jauh mentah dari WSL2 ke Windows

Gunakan profil browser jarak jauh yang menunjuk dari WSL2 ke endpoint CDP Chrome di Windows.

Pilih ini saat:

- Gateway tetap berada di dalam WSL2
- Chrome berjalan di Windows
- Anda memerlukan kontrol browser untuk melintasi batas WSL2/Windows

### Opsi 2: Chrome MCP lokal host

Gunakan `existing-session` / `user` hanya saat Gateway sendiri berjalan di host yang sama dengan Chrome.

Pilih ini saat:

- OpenClaw dan Chrome berada di mesin yang sama
- Anda menginginkan status browser lokal yang sudah login
- Anda tidak memerlukan transport browser lintas host
- Anda tidak memerlukan rute lanjutan khusus managed/raw-CDP seperti `responsebody`, ekspor PDF, intersepsi unduhan, atau aksi batch

Untuk Gateway WSL2 + Chrome Windows, utamakan CDP jarak jauh mentah. Chrome MCP bersifat lokal host, bukan jembatan WSL2-ke-Windows.

## Arsitektur yang berfungsi

Bentuk referensi:

- WSL2 menjalankan Gateway di `127.0.0.1:18789`
- Windows membuka UI Kontrol di browser biasa pada `http://127.0.0.1:18789/`
- Chrome Windows mengekspos endpoint CDP pada port `9222`
- WSL2 dapat menjangkau endpoint CDP Windows tersebut
- OpenClaw mengarahkan profil browser ke alamat yang dapat dijangkau dari WSL2

## Mengapa penyiapan ini membingungkan

Beberapa kegagalan dapat tumpang tindih:

- WSL2 tidak dapat menjangkau endpoint CDP Windows
- UI Kontrol dibuka dari origin yang tidak aman
- `gateway.controlUi.allowedOrigins` tidak cocok dengan origin halaman
- token atau pairing tidak ada
- profil browser menunjuk ke alamat yang salah

Karena itu, memperbaiki satu lapisan tetap dapat meninggalkan error berbeda yang masih terlihat.

## Aturan penting untuk UI Kontrol

Saat UI dibuka dari Windows, gunakan localhost Windows kecuali Anda memang memiliki penyiapan HTTPS yang disengaja.

Gunakan:

`http://127.0.0.1:18789/`

Jangan secara default menggunakan IP LAN untuk UI Kontrol. HTTP biasa pada alamat LAN atau tailnet dapat memicu perilaku insecure-origin/device-auth yang tidak terkait dengan CDP itu sendiri. Lihat [UI Kontrol](/web/control-ui).

## Validasi secara berlapis

Kerjakan dari atas ke bawah. Jangan melompat ke depan.

### Lapisan 1: Verifikasi bahwa Chrome melayani CDP di Windows

Mulai Chrome di Windows dengan remote debugging diaktifkan:

```powershell
chrome.exe --remote-debugging-port=9222
```

Dari Windows, verifikasi Chrome itu sendiri terlebih dahulu:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Jika ini gagal di Windows, berarti OpenClaw belum menjadi masalahnya.

### Lapisan 2: Verifikasi bahwa WSL2 dapat menjangkau endpoint Windows tersebut

Dari WSL2, uji alamat persis yang Anda rencanakan untuk digunakan di `cdpUrl`:

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

Perbaiki itu sebelum menyentuh konfigurasi OpenClaw.

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

- gunakan alamat yang dapat dijangkau WSL2, bukan yang hanya berfungsi di Windows
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
- auth token atau pairing dikonfigurasi dengan benar
- Anda tidak sedang men-debug masalah auth UI Kontrol seolah-olah itu masalah browser

Halaman yang berguna:

- [UI Kontrol](/web/control-ui)

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

Perlakukan setiap pesan sebagai petunjuk khusus lapisan:

- `control-ui-insecure-auth`
  - masalah origin UI / secure-context, bukan masalah transport CDP
- `token_missing`
  - masalah konfigurasi auth
- `pairing required`
  - masalah persetujuan perangkat
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 tidak dapat menjangkau `cdpUrl` yang dikonfigurasi
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - endpoint HTTP menjawab, tetapi WebSocket DevTools tetap tidak bisa dibuka
- override viewport / dark-mode / locale / offline yang basi setelah sesi jarak jauh
  - jalankan `openclaw browser stop --browser-profile remote`
  - ini menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa me-restart gateway atau browser eksternal
- `gateway timeout after 1500ms`
  - sering kali tetap merupakan masalah keterjangkauan CDP atau endpoint jarak jauh yang lambat/tidak dapat dijangkau
- `No Chrome tabs found for profile="user"`
  - profil Chrome MCP lokal dipilih ketika tidak ada tab lokal host yang tersedia

## Daftar periksa triase cepat

1. Windows: apakah `curl http://127.0.0.1:9222/json/version` berfungsi?
2. WSL2: apakah `curl http://WINDOWS_HOST_OR_IP:9222/json/version` berfungsi?
3. Konfigurasi OpenClaw: apakah `browser.profiles.<name>.cdpUrl` menggunakan alamat persis yang dapat dijangkau WSL2 itu?
4. UI Kontrol: apakah Anda membuka `http://127.0.0.1:18789/` alih-alih IP LAN?
5. Apakah Anda mencoba menggunakan `existing-session` lintas WSL2 dan Windows alih-alih CDP jarak jauh mentah?

## Inti praktis

Penyiapan ini biasanya layak digunakan. Bagian yang sulit adalah karena transport browser, keamanan origin UI Kontrol, dan token/pairing masing-masing dapat gagal secara independen sambil terlihat mirip dari sisi pengguna.

Jika ragu:

- verifikasi endpoint Chrome Windows secara lokal terlebih dahulu
- verifikasi endpoint yang sama dari WSL2 kedua
- baru kemudian debug konfigurasi OpenClaw atau auth UI Kontrol
