---
read_when:
    - Menambahkan otomatisasi browser yang dikendalikan agen
    - Mendiagnosis mengapa openclaw mengganggu Chrome Anda sendiri
    - Mengimplementasikan pengaturan peramban + siklus hidup di aplikasi macOS
summary: Layanan kontrol browser terintegrasi + perintah tindakan
title: Peramban (dikelola oleh OpenClaw)
x-i18n:
    generated_at: "2026-05-06T18:00:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan oleh agen.
Profil ini terisolasi dari peramban pribadi Anda dan dikelola melalui layanan kontrol lokal kecil di dalam Gateway (hanya loopback).

Tampilan pemula:

- Anggap ini sebagai **peramban terpisah yang khusus untuk agen**.
- Profil `openclaw` **tidak** menyentuh profil peramban pribadi Anda.
- Agen dapat **membuka tab, membaca halaman, mengeklik, dan mengetik** di jalur yang aman.
- Profil `user` bawaan terhubung ke sesi Chrome Anda yang benar-benar sudah masuk melalui Chrome MCP.

## Yang Anda dapatkan

- Profil peramban terpisah bernama **openclaw** (aksen oranye secara default).
- Kontrol tab deterministik (daftar/buka/fokus/tutup).
- Tindakan agen (klik/ketik/seret/pilih), snapshot, tangkapan layar, PDF.
- Skills `browser-automation` bawaan yang mengajarkan agen loop pemulihan snapshot,
  tab stabil, ref kedaluwarsa, dan penghambat manual saat Plugin peramban
  diaktifkan.
- Dukungan multi-profil opsional (`openclaw`, `work`, `remote`, ...).

Peramban ini **bukan** peramban harian Anda. Ini adalah permukaan yang aman dan terisolasi untuk
otomasi dan verifikasi agen.

## Mulai cepat

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jika Anda mendapatkan "Browser disabled", aktifkan di konfigurasi (lihat di bawah) dan mulai ulang
Gateway.

Jika `openclaw browser` sama sekali tidak ada, atau agen mengatakan alat peramban
tidak tersedia, lompat ke [Perintah atau alat peramban hilang](/id/tools/browser#missing-browser-command-or-tool).

## Kontrol Plugin

Alat `browser` default adalah Plugin bawaan. Nonaktifkan untuk menggantinya dengan Plugin lain yang mendaftarkan nama alat `browser` yang sama:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Default memerlukan `plugins.entries.browser.enabled` **dan** `browser.enabled=true`. Menonaktifkan hanya Plugin akan menghapus CLI `openclaw browser`, metode gateway `browser.request`, alat agen, dan layanan kontrol sebagai satu unit; konfigurasi `browser.*` Anda tetap utuh untuk pengganti.

Perubahan konfigurasi peramban memerlukan mulai ulang Gateway agar Plugin dapat mendaftarkan ulang layanannya.

## Panduan agen

Catatan profil alat: `tools.profile: "coding"` menyertakan `web_search` dan
`web_fetch`, tetapi tidak menyertakan alat `browser` lengkap. Jika agen atau
sub-agen yang dibuat harus menggunakan otomasi peramban, tambahkan browser pada tahap
profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Untuk satu agen, gunakan `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` saja tidak cukup karena kebijakan sub-agen
diterapkan setelah pemfilteran profil.

Plugin peramban menyertakan dua tingkat panduan agen:

- Deskripsi alat `browser` membawa kontrak ringkas yang selalu aktif: pilih
  profil yang tepat, pertahankan ref pada tab yang sama, gunakan `tabId`/label untuk penargetan
  tab, dan muat Skills peramban untuk pekerjaan multi-langkah.
- Skills `browser-automation` bawaan membawa loop operasi yang lebih panjang:
  periksa status/tab terlebih dahulu, beri label pada tab tugas, ambil snapshot sebelum bertindak, ambil snapshot ulang
  setelah perubahan UI, pulihkan ref kedaluwarsa sekali, dan laporkan login/2FA/captcha atau
  penghambat kamera/mikrofon sebagai tindakan manual alih-alih menebak.

Skills bawaan Plugin tercantum dalam Skills yang tersedia bagi agen saat
Plugin diaktifkan. Instruksi Skills lengkap dimuat sesuai permintaan, sehingga giliran
rutin tidak membayar biaya token penuh.

## Perintah atau alat peramban hilang

Jika `openclaw browser` tidak dikenal setelah peningkatan, `browser.request` hilang, atau agen melaporkan alat peramban tidak tersedia, penyebab biasanya adalah daftar `plugins.allow` yang menghilangkan `browser` dan tidak ada blok konfigurasi root `browser`. Tambahkan ini:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Blok root `browser` eksplisit, misalnya `browser.enabled=true` atau `browser.profiles.<name>`, mengaktifkan Plugin peramban bawaan bahkan di bawah `plugins.allow` yang membatasi, sesuai dengan perilaku konfigurasi kanal. `plugins.entries.browser.enabled=true` dan `tools.alsoAllow: ["browser"]` tidak menggantikan keanggotaan allowlist secara mandiri. Menghapus `plugins.allow` sepenuhnya juga memulihkan default.

## Profil: `openclaw` vs `user`

- `openclaw`: peramban terkelola dan terisolasi (tidak memerlukan ekstensi).
- `user`: profil attach Chrome MCP bawaan untuk sesi **Chrome Anda yang benar-benar sudah masuk**.

Untuk panggilan alat peramban agen:

- Default: gunakan peramban `openclaw` yang terisolasi.
- Pilih `profile="user"` saat sesi yang sudah masuk yang ada penting dan pengguna
  berada di depan komputer untuk mengeklik/menyetujui prompt attach apa pun.
- `profile` adalah override eksplisit saat Anda menginginkan mode peramban tertentu.

Atur `browser.defaultProfile: "openclaw"` jika Anda menginginkan mode terkelola secara default.

## Konfigurasi

Pengaturan peramban berada di `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Ports and reachability">

- Layanan kontrol mengikat ke loopback pada port yang diturunkan dari `gateway.port` (default `18791` = gateway + 2). Mengganti `gateway.port` atau `OPENCLAW_GATEWAY_PORT` akan menggeser port turunan dalam keluarga yang sama.
- Profil `openclaw` lokal menetapkan `cdpPort`/`cdpUrl` secara otomatis; atur itu hanya untuk CDP jarak jauh. `cdpUrl` secara default mengarah ke port CDP lokal terkelola saat tidak diatur.
- `remoteCdpTimeoutMs` berlaku untuk pemeriksaan keterjangkauan HTTP CDP jarak jauh dan `attachOnly`
  serta permintaan HTTP pembukaan tab; `remoteCdpHandshakeTimeoutMs` berlaku untuk
  handshake WebSocket CDP mereka.
- `localLaunchTimeoutMs` adalah anggaran untuk proses Chrome terkelola yang diluncurkan secara lokal
  agar mengekspos endpoint HTTP CDP-nya. `localCdpReadyTimeoutMs` adalah
  anggaran lanjutan untuk kesiapan websocket CDP setelah proses ditemukan.
  Naikkan nilai ini pada Raspberry Pi, VPS kelas rendah, atau perangkat keras lama tempat Chromium
  mulai dengan lambat. Nilai harus berupa bilangan bulat positif hingga `120000` ms; nilai
  konfigurasi yang tidak valid akan ditolak.
- Kegagalan peluncuran/kesiapan Chrome terkelola yang berulang diputus sirkuitnya per
  profil. Setelah beberapa kegagalan berturut-turut, OpenClaw menjeda upaya peluncuran baru
  sebentar alih-alih membuat Chromium pada setiap panggilan alat peramban. Perbaiki
  masalah startup, nonaktifkan peramban jika tidak diperlukan, atau mulai ulang
  Gateway setelah perbaikan.
- `actionTimeoutMs` adalah anggaran default untuk permintaan `act` peramban saat pemanggil tidak meneruskan `timeoutMs`. Transport klien menambahkan jendela toleransi kecil agar penantian panjang dapat selesai alih-alih timeout di batas HTTP.
- `tabCleanup` adalah pembersihan upaya terbaik untuk tab yang dibuka oleh sesi peramban agen utama. Pembersihan siklus hidup subagen, cron, dan ACP tetap menutup tab terlacak eksplisit mereka pada akhir sesi; sesi utama mempertahankan tab aktif agar dapat digunakan kembali, lalu menutup tab terlacak yang idle atau berlebih di latar belakang.

</Accordion>

<Accordion title="SSRF policy">

- Navigasi peramban dan buka-tab dijaga SSRF sebelum navigasi dan diperiksa ulang dengan upaya terbaik pada URL `http(s)` final setelahnya.
- Dalam mode SSRF ketat, penemuan endpoint CDP jarak jauh dan probe `/json/version` (`cdpUrl`) juga diperiksa.
- Variabel lingkungan Gateway/penyedia `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan `NO_PROXY` tidak otomatis mem-proxy peramban yang dikelola OpenClaw. Chrome terkelola diluncurkan langsung secara default sehingga pengaturan proxy penyedia tidak melemahkan pemeriksaan SSRF peramban.
- Untuk mem-proxy peramban terkelola itu sendiri, teruskan flag proxy Chrome eksplisit melalui `browser.extraArgs`, seperti `--proxy-server=...` atau `--proxy-pac-url=...`. Mode SSRF ketat memblokir perutean proxy peramban eksplisit kecuali akses peramban jaringan privat diaktifkan secara sengaja.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` nonaktif secara default; aktifkan hanya saat akses peramban jaringan privat dipercaya secara sengaja.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` berarti jangan pernah meluncurkan browser lokal; hanya lampirkan jika sudah ada yang berjalan.
- `headless` dapat diatur secara global atau per profil lokal yang dikelola. Nilai per profil menimpa `browser.headless`, sehingga satu profil yang diluncurkan secara lokal dapat tetap headless sementara profil lain tetap terlihat.
- `POST /start?headless=true` dan `openclaw browser start --headless` meminta
  peluncuran headless sekali pakai untuk profil lokal yang dikelola tanpa menulis ulang
  `browser.headless` atau konfigurasi profil. Profil sesi yang sudah ada, attach-only, dan
  CDP jarak jauh menolak override tersebut karena OpenClaw tidak meluncurkan
  proses browser tersebut.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil lokal yang dikelola
  secara otomatis menggunakan headless secara default ketika lingkungan maupun konfigurasi
  profil/global tidak secara eksplisit memilih mode dengan tampilan. `openclaw browser status --json`
  melaporkan `headlessSource` sebagai `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, atau `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` memaksa peluncuran lokal yang dikelola menjadi headless untuk
  proses saat ini. `OPENCLAW_BROWSER_HEADLESS=0` memaksa mode dengan tampilan untuk start
  biasa dan mengembalikan galat yang dapat ditindaklanjuti pada host Linux tanpa server tampilan;
  permintaan eksplisit `start --headless` tetap menang untuk satu peluncuran tersebut.
- `executablePath` dapat diatur secara global atau per profil lokal yang dikelola. Nilai per profil menimpa `browser.executablePath`, sehingga profil terkelola yang berbeda dapat meluncurkan browser berbasis Chromium yang berbeda. Kedua bentuk menerima `~` untuk direktori home OS Anda.
- `color` (tingkat atas dan per profil) memberi warna pada UI browser sehingga Anda dapat melihat profil mana yang aktif.
- Profil default adalah `openclaw` (standalone terkelola). Gunakan `defaultProfile: "user"` untuk memilih browser pengguna yang sudah masuk.
- Urutan deteksi otomatis: browser default sistem jika berbasis Chromium; jika tidak, Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP alih-alih CDP mentah. Jangan atur `cdpUrl` untuk driver tersebut.
- Atur `browser.profiles.<name>.userDataDir` ketika profil sesi yang sudah ada harus dilampirkan ke profil pengguna Chromium non-default (Brave, Edge, dll.). Jalur ini juga menerima `~` untuk direktori home OS Anda.

</Accordion>

</AccordionGroup>

## Gunakan Brave atau browser berbasis Chromium lainnya

Jika browser **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll.),
OpenClaw menggunakannya secara otomatis. Atur `browser.executablePath` untuk menimpa
deteksi otomatis. Nilai `executablePath` tingkat atas dan per profil menerima `~`
untuk direktori home OS Anda:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Atau atur di konfigurasi, per platform:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` per profil hanya memengaruhi profil lokal yang dikelola yang
diluncurkan OpenClaw. Profil `existing-session` dilampirkan ke browser yang sudah berjalan
sebagai gantinya, dan profil CDP jarak jauh menggunakan browser di balik `cdpUrl`.

## Kontrol lokal vs jarak jauh

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan browser lokal.
- **Kontrol jarak jauh (host Node):** jalankan host Node pada mesin yang memiliki browser; Gateway mem-proxy tindakan browser ke sana.
- **CDP jarak jauh:** atur `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  dilampirkan ke browser berbasis Chromium jarak jauh. Dalam kasus ini, OpenClaw tidak akan meluncurkan browser lokal.
- Untuk layanan CDP yang dikelola secara eksternal pada loopback (misalnya Browserless di
  Docker yang dipublikasikan ke `127.0.0.1`), atur juga `attachOnly: true`. CDP loopback
  tanpa `attachOnly` diperlakukan sebagai profil browser lokal yang dikelola OpenClaw.
- `headless` hanya memengaruhi profil lokal yang dikelola yang diluncurkan OpenClaw. Itu tidak memulai ulang atau mengubah browser sesi yang sudah ada atau CDP jarak jauh.
- `executablePath` mengikuti aturan profil lokal yang dikelola yang sama. Mengubahnya pada
  profil lokal yang dikelola yang sedang berjalan menandai profil tersebut untuk restart/rekonsiliasi sehingga
  peluncuran berikutnya menggunakan biner baru.

Perilaku penghentian berbeda menurut mode profil:

- profil lokal yang dikelola: `openclaw browser stop` menghentikan proses browser yang
  diluncurkan OpenClaw
- profil attach-only dan CDP jarak jauh: `openclaw browser stop` menutup sesi
  kontrol aktif dan melepaskan override emulasi Playwright/CDP (viewport,
  skema warna, locale, zona waktu, mode offline, dan status serupa), meskipun
  tidak ada proses browser yang diluncurkan oleh OpenClaw

URL CDP jarak jauh dapat menyertakan auth:

- Token kueri (mis., `https://provider.example?token=<token>`)
- Auth HTTP Basic (mis., `https://user:pass@provider.example`)

OpenClaw mempertahankan auth saat memanggil endpoint `/json/*` dan saat terhubung
ke WebSocket CDP. Pilih variabel lingkungan atau pengelola rahasia untuk
token alih-alih meng-commit-nya ke file konfigurasi.

## Proksi browser Node (default tanpa konfigurasi)

Jika Anda menjalankan **host Node** pada mesin yang memiliki browser, OpenClaw dapat
mengalihkan otomatis pemanggilan alat browser ke Node tersebut tanpa konfigurasi browser tambahan.
Ini adalah jalur default untuk Gateway jarak jauh.

Catatan:

- Host Node mengekspos server kontrol browser lokalnya melalui **perintah proxy**.
- Profil berasal dari konfigurasi `browser.profiles` milik Node sendiri (sama seperti lokal).
- `nodeHost.browserProxy.allowProfiles` bersifat opsional. Biarkan kosong untuk perilaku lama/default: semua profil yang dikonfigurasi tetap dapat dijangkau melalui proxy, termasuk rute pembuatan/penghapusan profil.
- Jika Anda mengatur `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas hak istimewa minimum: hanya profil dalam allowlist yang dapat ditargetkan, dan rute pembuatan/penghapusan profil persisten diblokir pada permukaan proxy.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Pada Node: `nodeHost.browserProxy.enabled=false`
  - Pada Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP jarak jauh yang di-host)

[Browserless](https://browserless.io) adalah layanan Chromium yang di-host yang mengekspos
URL koneksi CDP melalui HTTPS dan WebSocket. OpenClaw dapat menggunakan salah satu bentuk, tetapi
untuk profil browser jarak jauh, opsi paling sederhana adalah URL WebSocket langsung
dari dokumentasi koneksi Browserless.

Contoh:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Catatan:

- Ganti `<BROWSERLESS_API_KEY>` dengan token Browserless asli Anda.
- Pilih endpoint region yang sesuai dengan akun Browserless Anda (lihat dokumentasi mereka).
- Jika Browserless memberi Anda URL dasar HTTPS, Anda dapat mengonversinya ke
  `wss://` untuk koneksi CDP langsung atau mempertahankan URL HTTPS dan membiarkan OpenClaw
  menemukan `/json/version`.

### Docker Browserless pada host yang sama

Ketika Browserless di-host sendiri di Docker dan OpenClaw berjalan pada host, perlakukan
Browserless sebagai layanan CDP yang dikelola secara eksternal:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Alamat di `browser.profiles.browserless.cdpUrl` harus dapat dijangkau dari
proses OpenClaw. Browserless juga harus mengiklankan endpoint terjangkau yang cocok;
atur `EXTERNAL` Browserless ke basis WebSocket publik-ke-OpenClaw yang sama, seperti
`ws://127.0.0.1:3000`, `ws://browserless:3000`, atau alamat jaringan Docker
privat yang stabil. Jika `/json/version` mengembalikan `webSocketDebuggerUrl` yang menunjuk ke
alamat yang tidak dapat dijangkau OpenClaw, HTTP CDP dapat terlihat sehat sementara lampiran
WebSocket tetap gagal.

Jangan biarkan `attachOnly` tidak diatur untuk profil Browserless loopback. Tanpa
`attachOnly`, OpenClaw memperlakukan port loopback sebagai profil browser lokal yang dikelola
dan dapat melaporkan bahwa port sedang digunakan tetapi tidak dimiliki oleh OpenClaw.

## Penyedia CDP WebSocket langsung

Beberapa layanan browser yang di-host mengekspos endpoint **WebSocket langsung** alih-alih
penemuan CDP berbasis HTTP standar (`/json/version`). OpenClaw menerima tiga
bentuk URL CDP dan memilih strategi koneksi yang tepat secara otomatis:

- **Penemuan HTTP(S)** - `http://host[:port]` atau `https://host[:port]`.
  OpenClaw memanggil `/json/version` untuk menemukan URL debugger WebSocket, lalu
  terhubung. Tidak ada fallback WebSocket.
- **Endpoint WebSocket langsung** - `ws://host[:port]/devtools/<kind>/<id>` atau
  `wss://...` dengan jalur `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw terhubung langsung melalui handshake WebSocket dan melewati
  `/json/version` sepenuhnya.
- **Root WebSocket polos** - `ws://host[:port]` atau `wss://host[:port]` tanpa
  jalur `/devtools/...` (mis. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw mencoba penemuan HTTP
  `/json/version` terlebih dahulu (menormalkan skema ke `http`/`https`);
  jika penemuan mengembalikan `webSocketDebuggerUrl`, URL tersebut digunakan, jika tidak OpenClaw
  fallback ke handshake WebSocket langsung di root polos. Jika endpoint
  WebSocket yang diiklankan menolak handshake CDP tetapi root polos yang dikonfigurasi
  menerimanya, OpenClaw fallback ke root tersebut juga. Ini memungkinkan `ws://` polos
  yang diarahkan ke Chrome lokal tetap terhubung, karena Chrome hanya menerima upgrade WebSocket
  pada jalur per-target spesifik dari `/json/version`, sementara penyedia yang di-host
  tetap dapat menggunakan endpoint WebSocket root mereka ketika endpoint penemuan mereka
  mengiklankan URL berumur pendek yang tidak cocok untuk CDP Playwright.

### Browserbase

[Browserbase](https://www.browserbase.com) adalah platform cloud untuk menjalankan
browser headless dengan penyelesaian CAPTCHA bawaan, mode stealth, dan proksi
residensial.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Catatan:

- [Daftar](https://www.browserbase.com/sign-up) dan salin **API Key** Anda
  dari [dashboard Overview](https://www.browserbase.com/overview).
- Ganti `<BROWSERBASE_API_KEY>` dengan kunci API Browserbase asli Anda.
- Browserbase membuat sesi browser secara otomatis saat WebSocket terhubung, jadi tidak diperlukan
  langkah pembuatan sesi manual.
- Tier gratis mengizinkan satu sesi bersamaan dan satu jam browser per bulan.
  Lihat [harga](https://www.browserbase.com/pricing) untuk batas paket berbayar.
- Lihat [dokumentasi Browserbase](https://docs.browserbase.com) untuk referensi API
  lengkap, panduan SDK, dan contoh integrasi.

## Keamanan

Ide utama:

- Kontrol peramban hanya untuk loopback; akses mengalir melalui autentikasi Gateway atau pemasangan node.
- API HTTP peramban loopback mandiri hanya menggunakan **autentikasi rahasia bersama**:
  autentikasi bearer token gateway, `x-openclaw-password`, atau autentikasi HTTP Basic dengan
  kata sandi gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"` **tidak**
  mengautentikasi API peramban loopback mandiri ini.
- Jika kontrol peramban diaktifkan dan tidak ada autentikasi rahasia bersama yang dikonfigurasi, OpenClaw
  menghasilkan token gateway khusus runtime untuk startup tersebut. Konfigurasikan
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, atau
  `OPENCLAW_GATEWAY_PASSWORD` secara eksplisit jika klien membutuhkan rahasia yang stabil di seluruh
  restart.
- OpenClaw **tidak** menghasilkan token tersebut secara otomatis ketika `gateway.auth.mode` sudah
  `password`, `none`, atau `trusted-proxy`.
- Simpan Gateway dan host node apa pun di jaringan privat (Tailscale); hindari eksposur publik.
- Perlakukan URL/token CDP jarak jauh sebagai rahasia; utamakan env vars atau pengelola rahasia.

Kiat CDP jarak jauh:

- Utamakan endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek jika memungkinkan.
- Hindari menanamkan token berumur panjang langsung di file konfigurasi.

## Profil (multi-peramban)

OpenClaw mendukung beberapa profil bernama (konfigurasi perutean). Profil dapat berupa:

- **dikelola openclaw**: instance peramban berbasis Chromium khusus dengan direktori data pengguna + port CDP sendiri
- **jarak jauh**: URL CDP eksplisit (peramban berbasis Chromium yang berjalan di tempat lain)
- **sesi yang ada**: profil Chrome Anda yang sudah ada melalui koneksi otomatis Chrome DevTools MCP

Default:

- Profil `openclaw` dibuat otomatis jika tidak ada.
- Profil `user` sudah terpasang bawaan untuk attach sesi yang ada Chrome MCP.
- Profil sesi yang ada bersifat opt-in selain `user`; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800-18899** secara default.
- Menghapus profil memindahkan direktori data lokalnya ke Trash.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Sesi yang ada melalui Chrome DevTools MCP

OpenClaw juga dapat attach ke profil peramban berbasis Chromium yang sedang berjalan melalui
server resmi Chrome DevTools MCP. Ini menggunakan ulang tab dan status login
yang sudah terbuka di profil peramban tersebut.

Referensi resmi untuk latar belakang dan penyiapan:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan:

- `user`

Opsional: buat profil sesi yang ada kustom sendiri jika Anda menginginkan
nama, warna, atau direktori data peramban yang berbeda.

Perilaku default:

- Profil bawaan `user` menggunakan koneksi otomatis Chrome MCP, yang menargetkan
  profil Google Chrome lokal default.

Gunakan `userDataDir` untuk Brave, Edge, Chromium, atau profil Chrome non-default.
`~` diperluas ke direktori home OS Anda:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Lalu di peramban yang sesuai:

1. Buka halaman inspect peramban tersebut untuk debugging jarak jauh.
2. Aktifkan debugging jarak jauh.
3. Biarkan peramban tetap berjalan dan setujui prompt koneksi saat OpenClaw attach.

Halaman inspect umum:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Uji smoke attach langsung:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Tanda keberhasilan:

- `status` menampilkan `driver: existing-session`
- `status` menampilkan `transport: chrome-mcp`
- `status` menampilkan `running: true`
- `tabs` mencantumkan tab peramban Anda yang sudah terbuka
- `snapshot` mengembalikan ref dari tab langsung yang dipilih

Hal yang perlu diperiksa jika attach tidak berfungsi:

- peramban berbasis Chromium target adalah versi `144+`
- debugging jarak jauh diaktifkan di halaman inspect peramban tersebut
- peramban menampilkan prompt persetujuan attach dan Anda menerimanya
- `openclaw doctor` memigrasikan konfigurasi peramban lama berbasis Plugin dan memeriksa bahwa
  Chrome terinstal secara lokal untuk profil koneksi otomatis default, tetapi tidak dapat
  mengaktifkan debugging jarak jauh sisi peramban untuk Anda

Penggunaan agen:

- Gunakan `profile="user"` saat Anda membutuhkan status peramban pengguna yang sudah login.
- Jika Anda menggunakan profil sesi yang ada kustom, teruskan nama profil eksplisit tersebut.
- Pilih mode ini hanya saat pengguna berada di depan komputer untuk menyetujui prompt
  attach.
- Gateway atau host node dapat menjalankan `npx chrome-devtools-mcp@latest --autoConnect`

Catatan:

- Jalur ini berisiko lebih tinggi daripada profil `openclaw` yang terisolasi karena dapat
  bertindak di dalam sesi peramban Anda yang sudah masuk.
- OpenClaw tidak meluncurkan peramban untuk driver ini; OpenClaw hanya attach.
- OpenClaw menggunakan alur resmi Chrome DevTools MCP `--autoConnect` di sini. Jika
  `userDataDir` diatur, nilai tersebut diteruskan untuk menargetkan direktori data pengguna itu.
- Sesi yang ada dapat attach pada host yang dipilih atau melalui node peramban yang terhubung.
  Jika Chrome berada di tempat lain dan tidak ada node peramban yang terhubung, gunakan
  CDP jarak jauh atau host node sebagai gantinya.

### Peluncuran Chrome MCP kustom

Timpa server Chrome DevTools MCP yang dijalankan per profil saat alur default
`npx chrome-devtools-mcp@latest` bukan yang Anda inginkan (host offline,
versi yang dipin, biner vendored):

| Bidang       | Fungsinya                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executable yang dijalankan sebagai pengganti `npx`. Di-resolve apa adanya; path absolut dihormati.                         |
| `mcpArgs`    | Array argumen yang diteruskan verbatim ke `mcpCommand`. Menggantikan argumen default `chrome-devtools-mcp@latest --autoConnect`. |

Saat `cdpUrl` diatur pada profil sesi yang ada, OpenClaw melewati
`--autoConnect` dan meneruskan endpoint ke Chrome MCP secara otomatis:

- `http(s)://...` → `--browserUrl <url>` (endpoint discovery HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket langsung).

Flag endpoint dan `userDataDir` tidak dapat digabungkan: saat `cdpUrl` diatur,
`userDataDir` diabaikan untuk peluncuran Chrome MCP, karena Chrome MCP attach ke
peramban yang sedang berjalan di balik endpoint, bukan membuka direktori
profil.

<Accordion title="Existing-session feature limitations">

Dibandingkan dengan profil `openclaw` terkelola, driver sesi yang ada lebih terbatas:

- **Tangkapan layar** - tangkapan halaman dan tangkapan elemen `--ref` berfungsi; selector CSS `--element` tidak. `--full-page` tidak dapat digabungkan dengan `--ref` atau `--element`. Playwright tidak diperlukan untuk tangkapan layar halaman atau elemen berbasis ref.
- **Tindakan** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan ref snapshot (tanpa selector CSS). `click-coords` mengklik koordinat viewport yang terlihat dan tidak memerlukan ref snapshot. `click` hanya tombol kiri. `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`. `press` tidak mendukung `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, dan `evaluate` tidak mendukung timeout per panggilan. `select` menerima satu nilai.
- **Tunggu / unggah / dialog** - `wait --url` mendukung pola persis, substring, dan glob; `wait --load networkidle` tidak didukung. Hook unggah memerlukan `ref` atau `inputRef`, satu file pada satu waktu, tanpa CSS `element`. Hook dialog tidak mendukung penimpaan timeout.
- **Fitur khusus terkelola** - tindakan batch, ekspor PDF, intersepsi unduhan, dan `responsebody` tetap memerlukan jalur peramban terkelola.

</Accordion>

## Jaminan isolasi

- **Direktori data pengguna khusus**: tidak pernah menyentuh profil peramban pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah bentrokan dengan alur kerja dev.
- **Kontrol tab deterministik**: `tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu
  handle `tabId` stabil seperti `t1`, label opsional, dan `targetId` mentah.
  Agen sebaiknya menggunakan ulang `suggestedTargetId`; id mentah tetap tersedia untuk
  debugging dan kompatibilitas.

## Pemilihan peramban

Saat meluncurkan secara lokal, OpenClaw memilih yang pertama tersedia:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Anda dapat menimpanya dengan `browser.executablePath`.

Platform:

- macOS: memeriksa `/Applications` dan `~/Applications`.
- Linux: memeriksa lokasi umum Chrome/Brave/Edge/Chromium di bawah `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, dan
  `/usr/lib/chromium-browser`.
- Windows: memeriksa lokasi instalasi umum.

## API kontrol (opsional)

Untuk scripting dan debugging, Gateway mengekspos **API kontrol HTTP khusus loopback**
kecil serta CLI `openclaw browser` yang sesuai (snapshot, ref, peningkatan wait,
output JSON, alur kerja debug). Lihat
[API kontrol peramban](/id/tools/browser-control) untuk referensi lengkap.

## Pemecahan masalah

Untuk masalah khusus Linux (terutama snap Chromium), lihat
[Pemecahan masalah peramban](/id/tools/browser-linux-troubleshooting).

Untuk penyiapan split-host WSL2 Gateway + Windows Chrome, lihat
[Pemecahan masalah WSL2 + Windows + CDP Chrome jarak jauh](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Kegagalan startup CDP vs pemblokiran SSRF navigasi

Ini adalah kelas kegagalan yang berbeda dan menunjuk ke jalur kode yang berbeda.

- **Kegagalan startup atau kesiapan CDP** berarti OpenClaw tidak dapat memastikan bahwa control plane peramban sehat.
- **Pemblokiran SSRF navigasi** berarti control plane peramban sehat, tetapi target navigasi halaman ditolak oleh kebijakan.

Contoh umum:

- Kegagalan startup atau kesiapan CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` saat
    layanan CDP eksternal loopback dikonfigurasi tanpa `attachOnly: true`
- Pemblokiran SSRF navigasi:
  - alur `open`, `navigate`, snapshot, atau pembukaan tab gagal dengan error kebijakan peramban/jaringan sementara `start` dan `tabs` masih berfungsi

Gunakan urutan minimal ini untuk memisahkan keduanya:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cara membaca hasilnya:

- Jika `start` gagal dengan `not reachable after start`, pecahkan masalah kesiapan CDP terlebih dahulu.
- Jika `start` berhasil tetapi `tabs` gagal, control plane masih tidak sehat. Perlakukan ini sebagai masalah keterjangkauan CDP, bukan masalah navigasi halaman.
- Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane peramban sudah aktif dan kegagalannya berada pada kebijakan navigasi atau halaman target.
- Jika `start`, `tabs`, dan `open` semuanya berhasil, jalur kontrol peramban terkelola dasar sehat.

Detail perilaku penting:

- Konfigurasi peramban default ke objek kebijakan SSRF fail-closed meskipun Anda tidak mengonfigurasi `browser.ssrfPolicy`.
- Untuk profil terkelola `openclaw` loopback lokal, pemeriksaan kesehatan CDP sengaja melewati penegakan keterjangkauan SSRF peramban untuk control plane lokal OpenClaw sendiri.
- Perlindungan navigasi terpisah. Hasil `start` atau `tabs` yang berhasil tidak berarti target `open` atau `navigate` berikutnya diizinkan.

Panduan keamanan:

- **Jangan** melonggarkan kebijakan SSRF peramban secara default.
- Utamakan pengecualian host sempit seperti `hostnameAllowlist` atau `allowedHostnames` daripada akses jaringan privat yang luas.
- Gunakan `dangerouslyAllowPrivateNetwork: true` hanya di lingkungan tepercaya yang disengaja ketika akses peramban jaringan privat diperlukan dan telah ditinjau.

## Alat agen + cara kerja kontrol

Agen mendapatkan **satu alat** untuk otomasi browser:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cara pemetaannya:

- `browser snapshot` mengembalikan pohon UI stabil (AI atau ARIA).
- `browser act` menggunakan ID `ref` snapshot untuk mengeklik/mengetik/menyeret/memilih.
- `browser screenshot` menangkap piksel (halaman penuh, elemen, atau ref berlabel).
- `browser doctor` memeriksa kesiapan Gateway, plugin, profil, browser, dan tab.
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP jarak jauh).
  - `target` (`sandbox` | `host` | `node`) untuk memilih tempat browser berada.
  - Dalam sesi bersandbox, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` dihilangkan: sesi bersandbox menggunakan default `sandbox`, sesi non-sandbox menggunakan default `host`.
  - Jika node berkemampuan browser terhubung, alat dapat merutekan otomatis ke node tersebut kecuali Anda menyematkan `target="host"` atau `target="node"`.

Ini menjaga agen tetap deterministik dan menghindari selektor yang rapuh.

## Terkait

- [Gambaran Umum Alat](/id/tools) - semua alat agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) - kontrol browser di lingkungan bersandbox
- [Keamanan](/id/gateway/security) - risiko kontrol browser dan hardening
