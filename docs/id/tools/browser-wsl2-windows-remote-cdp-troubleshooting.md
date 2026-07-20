---
read_when:
    - Menjalankan Gateway OpenClaw di WSL2 sementara Chrome berada di Windows
    - Melihat kesalahan browser/control-ui yang tumpang tindih di WSL2 dan Windows
    - Memilih antara Chrome MCP lokal host dan CDP jarak jauh mentah dalam penyiapan host terpisah
summary: Pecahkan masalah Gateway WSL2 + CDP jarak jauh Chrome Windows secara bertahap
title: Pemecahan masalah WSL2 + Windows + CDP Chrome jarak jauh
x-i18n:
    generated_at: "2026-07-20T03:58:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 66ec4ed5bfccc66b594a43d56296c69242e8b9cf50b36c6cb3990b1d6ea58faa
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Dalam konfigurasi host-terpisah yang umum, OpenClaw Gateway berjalan di dalam WSL2, Chrome berjalan
di Windows, dan kontrol browser harus melintasi batas WSL2/Windows. Beberapa
masalah independen dapat muncul sekaligus (lihat
[isu #39369](https://github.com/openclaw/openclaw/issues/39369)): transportasi
CDP, keamanan origin Control UI, serta token/pairing masing-masing dapat gagal
secara mandiri sekaligus menghasilkan galat yang tampak serupa. Periksa lapisan
di bawah ini secara berurutan alih-alih menebak bagian mana yang rusak.

## Pilih mode browser yang tepat terlebih dahulu

### Opsi 1: CDP jarak jauh mentah dari WSL2 ke Windows

Gunakan profil browser jarak jauh yang mengarah dari WSL2 ke endpoint CDP
Chrome Windows. Pilih ini ketika Gateway tetap berada di dalam WSL2, Chrome berjalan di
Windows, dan kontrol browser perlu melintasi batas WSL2/Windows.

### Opsi 2: MCP Chrome lokal-host

Gunakan driver `existing-session` (profil `user`) hanya ketika Gateway berjalan
pada host yang sama dengan Chrome, Anda menginginkan status browser lokal yang sudah masuk,
tidak memerlukan transportasi browser lintas-host, dan tidak memerlukan `responsebody`,
ekspor PDF, intersepsi unduhan, atau tindakan batch (profil MCP Chrome
tidak mendukungnya).

Untuk Gateway WSL2 + Chrome Windows, gunakan CDP jarak jauh mentah. MCP Chrome
bersifat lokal-host, bukan jembatan WSL2-ke-Windows.

## Arsitektur yang berfungsi

- WSL2 menjalankan Gateway pada `127.0.0.1:18789`
- Windows membuka Control UI di browser normal pada `http://127.0.0.1:18789/`
- Chrome Windows mengekspos endpoint CDP pada port `9222`
- WSL2 dapat menjangkau endpoint CDP Windows tersebut
- OpenClaw mengarahkan profil browser ke alamat yang dapat dijangkau dari WSL2

## Aturan penting untuk Control UI

Ketika UI dibuka dari Windows, gunakan localhost Windows kecuali Anda memiliki
konfigurasi HTTPS yang disengaja:

```text
http://127.0.0.1:18789/
```

Jangan gunakan IP LAN secara default. HTTP biasa pada alamat LAN atau tailnet dapat
memicu perilaku origin-tidak-aman/autentikasi-perangkat yang tidak terkait dengan CDP itu sendiri. Lihat
[Control UI](/id/web/control-ui).

## Validasi berdasarkan lapisan

Kerjakan dari atas ke bawah; jangan melompat ke depan. Memperbaiki satu lapisan masih dapat menyisakan
galat berbeda yang terlihat dari lapisan di bawahnya.

### Lapisan 1: pastikan Chrome menyediakan CDP di Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 dan versi lebih baru mengabaikan opsi baris perintah debugging jarak jauh untuk
direktori data Chrome default. Gunakan direktori data terpisah yang bukan default seperti
yang ditampilkan di atas. Lihat
[perubahan keamanan debugging jarak jauh](https://developer.chrome.com/blog/remote-debugging-port) Chrome.
Ini tidak membuat profil Chrome normal yang sudah masuk dapat dikontrol dari jarak jauh.

Dari Windows, pastikan Chrome itu sendiri terlebih dahulu:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Jika ini gagal, diagnosis listener Windows di bawah. OpenClaw belum menjadi
masalahnya.

#### Diagnosis IPv4 dan IPv6 sebelum mengubah portproxy

Chromium mencoba mengikat debugging jarak jauh ke `127.0.0.1` terlebih dahulu dan beralih ke
`[::1]` hanya jika pengikatan IPv4 gagal. Aturan `v4tov4` persisten yang mendengarkan pada
`127.0.0.1:9222` dapat menggunakan endpoint tersebut sebelum Chrome dimulai. Chrome kemudian
beralih ke `[::1]:9222`, sementara aturan lama meneruskan lalu lintas IPv4 kembali ke
listener-nya sendiri dan mengembalikan balasan kosong.

Periksa listener dan aturan proksi yang sebenarnya dari Windows alih-alih menyimpulkannya
dari versi Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Gunakan `tasklist /fi "PID eq <PID>"` untuk setiap PID dari `netstat`.

- Jika `chrome.exe` merespons pada `127.0.0.1`, hapus setiap aturan portproxy yang juga
  mendengarkan pada `127.0.0.1:9222`. Teruskan hanya alamat adaptor Windows yang
  dapat dijangkau WSL2 ke `127.0.0.1`.
- Jika `chrome.exe` hanya merespons pada `[::1]`, arahkan listener yang dapat dijangkau WSL2 ke
  `::1` dengan `v4tov6`, alih-alih meneruskan ke alamat IPv4 yang tidak digunakan:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Ikat listener ke alamat adaptor yang diperlukan WSL2. Jangan mengekspos port
CDP pada `0.0.0.0`, alamat LAN, atau alamat tailnet: CDP memberikan kontrol atas
sesi browser.

### Lapisan 2: pastikan WSL2 dapat menjangkau endpoint Windows tersebut

Dari WSL2, uji alamat persis yang akan digunakan dalam `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Hasil yang benar:

- `/json/version` mengembalikan JSON dengan metadata Browser / Protocol-Version
- `/json/list` mengembalikan JSON (array kosong tidak masalah jika tidak ada halaman yang terbuka)

Jika ini gagal, Windows belum mengekspos port tersebut ke WSL2, alamatnya
salah untuk sisi WSL2, atau firewall/penerusan-port/proksi belum tersedia. Perbaiki
hal tersebut sebelum menyentuh konfigurasi OpenClaw.

### Lapisan 3: konfigurasikan profil browser yang benar

Arahkan OpenClaw ke alamat yang dapat dijangkau dari WSL2:

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
- gunakan HTTP(S) ketika Anda ingin OpenClaw menemukan `/json/version`
- gunakan WS(S) hanya ketika penyedia browser memberikan URL soket DevTools
  langsung
- uji URL yang sama dengan `curl` sebelum mengharapkan OpenClaw berhasil

### Lapisan 4: pastikan lapisan Control UI secara terpisah

Buka `http://127.0.0.1:18789/` dari Windows, lalu pastikan:

- origin halaman sesuai dengan yang diharapkan `gateway.controlUi.allowedOrigins`
- autentikasi token atau pairing dikonfigurasi dengan benar
- Anda tidak men-debug masalah autentikasi Control UI seolah-olah itu masalah
  browser

Halaman yang membantu: [Control UI](/id/web/control-ui).

### Lapisan 5: pastikan kontrol browser secara menyeluruh

Dari WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Hasil yang benar:

- tab terbuka di Chrome Windows
- `browser tabs` mengembalikan target
- tindakan selanjutnya (`snapshot`, `screenshot`, `navigate`) berfungsi dari profil
  yang sama

## Galat umum yang menyesatkan

| Pesan                                                                                   | Arti                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                                      | masalah origin/konteks-aman UI, bukan masalah transportasi CDP                                                                                                                    |
| `token_missing`                                                                      | masalah konfigurasi autentikasi                                                                                                                                                   |
| `pairing required`                                                                      | masalah persetujuan perangkat                                                                                                                                                     |
| `Remote CDP for profile "remote" is not reachable`                                                                      | WSL2 tidak dapat menjangkau `cdpUrl` yang dikonfigurasi                                                                                                                 |
| balasan CDP kosong / `other side closed` melalui portproxy                               | ketidakcocokan listener Windows atau perulangan mandiri; periksa kedua keluarga loopback dan `netsh interface portproxy show all`                                                                  |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`                                                                      | endpoint HTTP merespons, tetapi WebSocket DevTools tidak dapat dibuka                                                                                                             |
| viewport / mode gelap / lokal / pengesampingan offline yang usang setelah sesi jarak jauh | jalankan `openclaw browser --browser-profile remote stop` untuk menutup sesi dan melepaskan koneksi Playwright/CDP yang di-cache tanpa memulai ulang Gateway atau browser eksternal                             |
| batas waktu selama keterjangkauan CDP                                                    | biasanya masih terkait keterjangkauan CDP, atau endpoint jarak jauh yang lambat/tidak dapat dijangkau                                                                             |
| `Playwright page enumeration timed out after 3000ms`                                                                      | CDP jarak jauh terhubung, tetapi pembacaan tab persistennya macet                                                                                                                 |
| `No Chrome tabs found for profile="user"`                                                                      | profil MCP Chrome lokal dipilih ketika tidak tersedia tab lokal-host                                                                                                              |

## Daftar periksa triase cepat

1. Windows: mana dari `127.0.0.1` atau `[::1]` yang merespons pada `/json/version`, dan
   apakah listener tersebut milik `chrome.exe`?
2. WSL2: apakah `curl http://WINDOWS_HOST_OR_IP:9222/json/version` berfungsi?
3. Konfigurasi OpenClaw: apakah `browser.profiles.<name>.cdpUrl` menggunakan alamat persis
   yang dapat dijangkau WSL2 tersebut?
4. Control UI: apakah Anda membuka `http://127.0.0.1:18789/`, bukan IP LAN?
5. Apakah Anda mencoba menggunakan `existing-session` melintasi WSL2 dan Windows alih-alih
   CDP jarak jauh mentah?

Pastikan endpoint Chrome Windows secara lokal terlebih dahulu, pastikan endpoint yang sama
dari WSL2 selanjutnya, dan baru setelah itu debug konfigurasi OpenClaw atau autentikasi Control UI.

## Terkait

- [Browser](/id/tools/browser)
- [Login browser](/id/tools/browser-login)
- [Pemecahan masalah browser Linux](/id/tools/browser-linux-troubleshooting)
