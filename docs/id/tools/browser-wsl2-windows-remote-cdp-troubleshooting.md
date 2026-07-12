---
read_when:
    - Menjalankan Gateway OpenClaw di WSL2 sementara Chrome berada di Windows
    - Melihat kesalahan browser/control-ui yang tumpang tindih di WSL2 dan Windows
    - Memilih antara Chrome MCP lokal-host dan CDP jarak jauh mentah dalam penyiapan host terpisah
summary: Atasi masalah Gateway WSL2 + CDP jarak jauh Chrome Windows secara bertahap
title: Pemecahan masalah WSL2 + Windows + CDP Chrome jarak jauh
x-i18n:
    generated_at: "2026-07-12T14:45:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Dalam penyiapan umum dengan host terpisah, OpenClaw Gateway berjalan di dalam WSL2, Chrome berjalan
di Windows, dan kontrol browser harus melintasi batas WSL2/Windows. Beberapa
masalah independen dapat muncul sekaligus (lihat
[isu #39369](https://github.com/openclaw/openclaw/issues/39369)): transportasi
CDP, keamanan asal Control UI, serta token/pemasangan masing-masing dapat gagal
secara terpisah sekaligus menghasilkan galat yang tampak serupa. Telusuri lapisan
di bawah ini secara berurutan, alih-alih menebak lapisan mana yang bermasalah.

## Pilih mode browser yang tepat terlebih dahulu

### Opsi 1: CDP jarak jauh mentah dari WSL2 ke Windows

Gunakan profil browser jarak jauh yang mengarah dari WSL2 ke titik akhir CDP
Chrome di Windows. Pilih ini ketika Gateway tetap berada di dalam WSL2, Chrome
berjalan di Windows, dan kontrol browser perlu melintasi batas WSL2/Windows.

### Opsi 2: MCP Chrome lokal-host

Gunakan driver `existing-session` (profil `user`) hanya ketika Gateway berjalan
di host yang sama dengan Chrome, Anda ingin menggunakan status browser lokal
yang sudah masuk, Anda tidak memerlukan transportasi browser lintas host, dan
Anda tidak memerlukan `responsebody`, ekspor PDF, intersepsi unduhan, atau
tindakan batch (profil MCP Chrome tidak mendukung fitur-fitur ini).

Untuk Gateway WSL2 + Chrome Windows, gunakan CDP jarak jauh mentah. MCP Chrome
bersifat lokal-host, bukan jembatan WSL2-ke-Windows.

## Arsitektur yang berfungsi

- WSL2 menjalankan Gateway pada `127.0.0.1:18789`
- Windows membuka Control UI di browser biasa pada `http://127.0.0.1:18789/`
- Chrome Windows mengekspos titik akhir CDP pada porta `9222`
- WSL2 dapat menjangkau titik akhir CDP Windows tersebut
- OpenClaw mengarahkan profil browser ke alamat yang dapat dijangkau dari WSL2

## Aturan penting untuk Control UI

Saat UI dibuka dari Windows, gunakan localhost Windows kecuali Anda memiliki
penyiapan HTTPS yang disengaja:

```text
http://127.0.0.1:18789/
```

Jangan gunakan IP LAN secara default. HTTP biasa pada alamat LAN atau tailnet
dapat memicu perilaku asal tidak aman/autentikasi perangkat yang tidak terkait
dengan CDP itu sendiri. Lihat
[Control UI](/id/web/control-ui).

## Validasi berdasarkan lapisan

Telusuri dari atas ke bawah; jangan melompat ke depan. Memperbaiki satu lapisan
masih dapat menyisakan galat berbeda yang terlihat dari lapisan di bawahnya.

### Lapisan 1: pastikan Chrome menyajikan CDP di Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 dan yang lebih baru mengabaikan opsi baris perintah penelusuran jarak
jauh untuk direktori data Chrome default. Gunakan direktori data terpisah yang
bukan default seperti yang ditunjukkan di atas. Lihat
[perubahan keamanan penelusuran jarak jauh Chrome](https://developer.chrome.com/blog/remote-debugging-port).
Hal ini tidak membuat profil Chrome biasa yang sudah masuk dapat dikontrol dari
jarak jauh.

Dari Windows, pastikan Chrome itu sendiri terlebih dahulu:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Jika ini gagal, diagnosis listener Windows di bawah ini. OpenClaw belum menjadi
masalahnya.

#### Diagnosis IPv4 dan IPv6 sebelum mengubah portproxy

Chromium mencoba mengikat penelusuran jarak jauh ke `127.0.0.1` terlebih dahulu
dan beralih ke `[::1]` hanya jika pengikatan IPv4 gagal. Aturan `v4tov4` persisten
yang mendengarkan pada `127.0.0.1:9222` dapat menempati titik akhir tersebut
sebelum Chrome dimulai. Chrome kemudian beralih ke `[::1]:9222`, sedangkan aturan
lama meneruskan lalu lintas IPv4 kembali ke listener-nya sendiri dan
mengembalikan balasan kosong.

Periksa listener dan aturan proksi yang sebenarnya dari Windows, alih-alih
menyimpulkannya dari versi Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Gunakan `tasklist /fi "PID eq <PID>"` untuk setiap PID dari `netstat`.

- Jika `chrome.exe` merespons pada `127.0.0.1`, hapus aturan portproxy apa pun
  yang juga mendengarkan pada `127.0.0.1:9222`. Teruskan hanya alamat adaptor
  Windows yang dapat dijangkau WSL2 ke `127.0.0.1`.
- Jika `chrome.exe` hanya merespons pada `[::1]`, arahkan listener yang dapat
  dijangkau WSL2 ke `::1` dengan `v4tov6`, alih-alih meneruskannya ke alamat IPv4
  yang tidak digunakan:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Ikat listener ke alamat adaptor yang diperlukan WSL2. Jangan mengekspos porta
CDP pada `0.0.0.0`, alamat LAN, atau alamat tailnet: CDP memberikan kontrol atas
sesi browser.

### Lapisan 2: pastikan WSL2 dapat menjangkau titik akhir Windows tersebut

Dari WSL2, uji alamat persis yang akan Anda gunakan dalam `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Hasil yang baik:

- `/json/version` mengembalikan JSON dengan metadata Browser / Protocol-Version
- `/json/list` mengembalikan JSON (larik kosong tidak masalah jika tidak ada
  halaman yang terbuka)

Jika ini gagal, Windows belum mengekspos porta tersebut ke WSL2, alamatnya salah
untuk sisi WSL2, atau firewall/penerusan porta/proksi belum tersedia. Perbaiki
hal tersebut sebelum menyentuh konfigurasi OpenClaw.

### Lapisan 3: konfigurasikan profil browser yang tepat

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
- gunakan HTTP(S) jika Anda ingin OpenClaw menemukan `/json/version`
- gunakan WS(S) hanya jika penyedia browser memberi Anda URL soket DevTools
  langsung
- uji URL yang sama dengan `curl` sebelum mengharapkan OpenClaw berhasil

### Lapisan 4: pastikan lapisan Control UI secara terpisah

Buka `http://127.0.0.1:18789/` dari Windows, lalu pastikan:

- asal halaman cocok dengan yang diharapkan `gateway.controlUi.allowedOrigins`
- autentikasi token atau pemasangan dikonfigurasi dengan benar
- Anda tidak sedang menelusuri masalah autentikasi Control UI seolah-olah itu
  masalah browser

Halaman yang membantu: [Control UI](/id/web/control-ui).

### Lapisan 5: pastikan kontrol browser menyeluruh

Dari WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Hasil yang baik:

- tab terbuka di Chrome Windows
- `browser tabs` mengembalikan target
- tindakan berikutnya (`snapshot`, `screenshot`, `navigate`) berfungsi dari
  profil yang sama

## Galat umum yang menyesatkan

| Pesan                                                                                   | Arti                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | masalah asal UI/konteks aman, bukan masalah transportasi CDP                                                                                                                                         |
| `token_missing`                                                                         | masalah konfigurasi autentikasi                                                                                                                                                                      |
| `pairing required`                                                                      | masalah persetujuan perangkat                                                                                                                                                                        |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 tidak dapat menjangkau `cdpUrl` yang dikonfigurasi                                                                                                                                               |
| balasan CDP kosong / `other side closed` melalui portproxy                              | ketidakcocokan listener Windows atau perulangan ke diri sendiri; periksa kedua keluarga loopback dan `netsh interface portproxy show all`                                                            |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | titik akhir HTTP merespons, tetapi WebSocket DevTools tidak dapat dibuka                                                                                                                              |
| viewport / mode gelap / lokal / penggantian offline usang setelah sesi jarak jauh        | jalankan `openclaw browser --browser-profile remote stop` untuk menutup sesi dan melepaskan koneksi Playwright/CDP yang tersimpan dalam cache tanpa memulai ulang Gateway atau browser eksternal        |
| batas waktu di sekitar `remoteCdpTimeoutMs` (default 1500ms)                            | biasanya masih terkait keterjangkauan CDP, atau titik akhir jarak jauh yang lambat/tidak dapat dijangkau                                                                                             |
| `Playwright page enumeration timed out after 3000ms`                                    | CDP jarak jauh tersambung, tetapi pembacaan tab persistennya macet; tenggatnya adalah nilai yang lebih besar antara `remoteCdpTimeoutMs` dan `remoteCdpHandshakeTimeoutMs`                             |
| `No Chrome tabs found for profile="user"`                                               | profil MCP Chrome lokal dipilih ketika tidak ada tab lokal-host yang tersedia                                                                                                                        |

## Daftar periksa triase cepat

1. Windows: manakah dari `127.0.0.1` atau `[::1]` yang merespons pada
   `/json/version`, dan apakah listener tersebut milik `chrome.exe`?
2. WSL2: apakah `curl http://WINDOWS_HOST_OR_IP:9222/json/version` berfungsi?
3. Konfigurasi OpenClaw: apakah `browser.profiles.<name>.cdpUrl` menggunakan
   alamat persis yang dapat dijangkau WSL2 tersebut?
4. Control UI: apakah Anda membuka `http://127.0.0.1:18789/`, bukan IP LAN?
5. Apakah Anda mencoba menggunakan `existing-session` melintasi WSL2 dan
   Windows, alih-alih CDP jarak jauh mentah?

Pastikan titik akhir Chrome Windows secara lokal terlebih dahulu, pastikan titik
akhir yang sama dari WSL2 berikutnya, dan baru setelah itu telusuri konfigurasi
OpenClaw atau autentikasi Control UI.

## Terkait

- [Browser](/id/tools/browser)
- [Login browser](/id/tools/browser-login)
- [Pemecahan masalah Browser Linux](/id/tools/browser-linux-troubleshooting)
