---
read_when:
    - Menjalankan OpenClaw Gateway di WSL2 sementara Chrome berjalan di Windows
    - Melihat kesalahan peramban/control-ui yang tumpang tindih di WSL2 dan Windows
    - Memutuskan antara Chrome MCP lokal-host dan CDP jarak jauh mentah dalam penyiapan host terpisah
summary: Pecahkan masalah WSL2 Gateway + CDP jarak jauh Windows Chrome secara berlapis
title: Pemecahan masalah WSL2 + Windows + Chrome CDP jarak jauh
x-i18n:
    generated_at: "2026-04-30T10:13:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Dalam pengaturan split-host umum, OpenClaw Gateway berjalan di dalam WSL2, Chrome berjalan di Windows, dan kontrol peramban harus melintasi batas WSL2 dan Windows. Pola kegagalan berlapis dari [issue #39369](https://github.com/openclaw/openclaw/issues/39369) berarti beberapa masalah independen dapat muncul sekaligus, sehingga lapisan yang salah tampak rusak terlebih dahulu.

## Pilih mode peramban yang tepat terlebih dahulu

Ada dua pola valid:

### Opsi 1: CDP remote mentah dari WSL2 ke Windows

Gunakan profil peramban remote yang mengarah dari WSL2 ke endpoint CDP Chrome Windows.

Pilih ini saat:

- Gateway tetap berada di dalam WSL2
- Chrome berjalan di Windows
- Anda perlu kontrol peramban melintasi batas WSL2/Windows

### Opsi 2: Chrome MCP lokal-host

Gunakan `existing-session` / `user` hanya saat Gateway itu sendiri berjalan di host yang sama dengan Chrome.

Pilih ini saat:

- OpenClaw dan Chrome berada di mesin yang sama
- Anda menginginkan status peramban lokal yang sudah masuk
- Anda tidak memerlukan transport peramban lintas-host
- Anda tidak memerlukan rute lanjutan khusus managed/raw-CDP seperti `responsebody`, ekspor PDF, intersepsi unduhan, atau tindakan batch

Untuk WSL2 Gateway + Windows Chrome, pilih CDP remote mentah. Chrome MCP bersifat lokal-host, bukan jembatan WSL2-ke-Windows.

## Arsitektur yang berfungsi

Bentuk referensi:

- WSL2 menjalankan Gateway di `127.0.0.1:18789`
- Windows membuka UI Kontrol di peramban normal pada `http://127.0.0.1:18789/`
- Windows Chrome mengekspos endpoint CDP pada port `9222`
- WSL2 dapat menjangkau endpoint CDP Windows tersebut
- OpenClaw mengarahkan profil peramban ke alamat yang dapat dijangkau dari WSL2

## Mengapa pengaturan ini membingungkan

Beberapa kegagalan dapat tumpang tindih:

- WSL2 tidak dapat menjangkau endpoint CDP Windows
- UI Kontrol dibuka dari origin yang tidak aman
- `gateway.controlUi.allowedOrigins` tidak cocok dengan origin halaman
- token atau pairing hilang
- profil peramban mengarah ke alamat yang salah

Karena itu, memperbaiki satu lapisan masih dapat menyisakan error berbeda yang terlihat.

## Aturan penting untuk UI Kontrol

Saat UI dibuka dari Windows, gunakan localhost Windows kecuali Anda memiliki pengaturan HTTPS yang disengaja.

Gunakan:

`http://127.0.0.1:18789/`

Jangan default ke IP LAN untuk UI Kontrol. HTTP biasa pada alamat LAN atau tailnet dapat memicu perilaku insecure-origin/device-auth yang tidak terkait dengan CDP itu sendiri. Lihat [UI Kontrol](/id/web/control-ui).

## Validasi berlapis

Kerjakan dari atas ke bawah. Jangan melompat.

### Lapisan 1: Verifikasi Chrome menyajikan CDP di Windows

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

### Lapisan 2: Verifikasi WSL2 dapat menjangkau endpoint Windows tersebut

Dari WSL2, uji alamat persis yang akan Anda gunakan di `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Hasil yang baik:

- `/json/version` mengembalikan JSON dengan metadata Browser / Protocol-Version
- `/json/list` mengembalikan JSON (array kosong tidak masalah jika tidak ada halaman yang terbuka)

Jika ini gagal:

- Windows belum mengekspos port ke WSL2
- alamatnya salah untuk sisi WSL2
- firewall / port forwarding / proxy lokal masih belum ada

Perbaiki itu sebelum menyentuh konfigurasi OpenClaw.

### Lapisan 3: Konfigurasikan profil peramban yang benar

Untuk CDP remote mentah, arahkan OpenClaw ke alamat yang dapat dijangkau dari WSL2:

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
- pertahankan `attachOnly: true` untuk peramban yang dikelola secara eksternal
- `cdpUrl` dapat berupa `http://`, `https://`, `ws://`, atau `wss://`
- gunakan HTTP(S) saat Anda ingin OpenClaw menemukan `/json/version`
- gunakan WS(S) hanya saat penyedia peramban memberi Anda URL soket DevTools langsung
- uji URL yang sama dengan `curl` sebelum mengharapkan OpenClaw berhasil

### Lapisan 4: Verifikasi lapisan UI Kontrol secara terpisah

Buka UI dari Windows:

`http://127.0.0.1:18789/`

Lalu verifikasi:

- origin halaman cocok dengan yang diharapkan `gateway.controlUi.allowedOrigins`
- autentikasi token atau pairing dikonfigurasi dengan benar
- Anda tidak sedang men-debug masalah autentikasi UI Kontrol seolah-olah itu masalah peramban

Halaman berguna:

- [UI Kontrol](/id/web/control-ui)

### Lapisan 5: Verifikasi kontrol peramban end-to-end

Dari WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Hasil yang baik:

- tab terbuka di Windows Chrome
- `openclaw browser tabs` mengembalikan target
- tindakan berikutnya (`snapshot`, `screenshot`, `navigate`) berfungsi dari profil yang sama

## Error umum yang menyesatkan

Perlakukan setiap pesan sebagai petunjuk khusus lapisan:

- `control-ui-insecure-auth`
  - masalah origin UI / secure-context, bukan masalah transport CDP
- `token_missing`
  - masalah konfigurasi autentikasi
- `pairing required`
  - masalah persetujuan perangkat
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 tidak dapat menjangkau `cdpUrl` yang dikonfigurasi
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - endpoint HTTP merespons, tetapi WebSocket DevTools masih tidak dapat dibuka
- override viewport / dark-mode / locale / offline yang usang setelah sesi remote
  - jalankan `openclaw browser stop --browser-profile remote`
  - ini menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa memulai ulang gateway atau peramban eksternal
- `gateway timeout after 1500ms`
  - sering kali masih terkait keterjangkauan CDP atau endpoint remote yang lambat/tidak terjangkau
- `No Chrome tabs found for profile="user"`
  - profil Chrome MCP lokal dipilih saat tidak ada tab lokal-host yang tersedia

## Checklist triase cepat

1. Windows: apakah `curl http://127.0.0.1:9222/json/version` berfungsi?
2. WSL2: apakah `curl http://WINDOWS_HOST_OR_IP:9222/json/version` berfungsi?
3. Konfigurasi OpenClaw: apakah `browser.profiles.<name>.cdpUrl` menggunakan alamat persis yang dapat dijangkau WSL2 itu?
4. UI Kontrol: apakah Anda membuka `http://127.0.0.1:18789/` alih-alih IP LAN?
5. Apakah Anda mencoba menggunakan `existing-session` melintasi WSL2 dan Windows alih-alih CDP remote mentah?

## Kesimpulan praktis

Pengaturan ini biasanya layak digunakan. Bagian sulitnya adalah transport peramban, keamanan origin UI Kontrol, dan token/pairing masing-masing dapat gagal secara independen sambil tampak serupa dari sisi pengguna.

Jika ragu:

- verifikasi endpoint Windows Chrome secara lokal terlebih dahulu
- verifikasi endpoint yang sama dari WSL2 berikutnya
- baru kemudian debug konfigurasi OpenClaw atau autentikasi UI Kontrol

## Terkait

- [Peramban](/id/tools/browser)
- [Login peramban](/id/tools/browser-login)
- [Pemecahan masalah peramban Linux](/id/tools/browser-linux-troubleshooting)
