---
read_when:
    - Menambahkan otomatisasi peramban yang dikendalikan agen
    - Men-debug penyebab OpenClaw mengganggu Chrome Anda sendiri
    - Menerapkan pengaturan browser + siklus hidup di aplikasi macOS
summary: Layanan kontrol browser terintegrasi + perintah tindakan
title: Peramban (dikelola OpenClaw)
x-i18n:
    generated_at: "2026-05-10T19:54:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51a78cc860ef4951548aba1e60bc686dfc19c156f69b6a59cf7c671eeaa67a0a
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan agen.
Profil ini terisolasi dari browser pribadi Anda dan dikelola melalui layanan kontrol
lokal kecil di dalam Gateway (hanya loopback).

Tampilan pemula:

- Anggap ini sebagai **browser terpisah yang hanya untuk agen**.
- Profil `openclaw` **tidak** menyentuh profil browser pribadi Anda.
- Agen dapat **membuka tab, membaca halaman, mengeklik, dan mengetik** di jalur yang aman.
- Profil bawaan `user` terhubung ke sesi Chrome Anda yang benar-benar sudah masuk melalui Chrome MCP.

## Yang Anda dapatkan

- Profil browser terpisah bernama **openclaw** (aksen oranye secara default).
- Kontrol tab deterministik (daftar/buka/fokus/tutup).
- Tindakan agen (klik/ketik/seret/pilih), snapshot, tangkapan layar, PDF.
- Skill `browser-automation` bawaan yang mengajarkan agen loop pemulihan snapshot,
  tab stabil, referensi usang, dan pemblokir manual saat Plugin browser
  diaktifkan.
- Dukungan multi-profil opsional (`openclaw`, `work`, `remote`, ...).

Browser ini **bukan** browser harian Anda. Ini adalah permukaan yang aman dan terisolasi untuk
otomatisasi dan verifikasi agen.

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

Jika `openclaw browser` sepenuhnya tidak ada, atau agen mengatakan tool browser
tidak tersedia, lompat ke [Perintah atau tool browser tidak ada](/id/tools/browser#missing-browser-command-or-tool).

## Kontrol Plugin

Tool `browser` default adalah Plugin bawaan. Nonaktifkan untuk menggantinya dengan Plugin lain yang mendaftarkan nama tool `browser` yang sama:

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

Default memerlukan `plugins.entries.browser.enabled` **dan** `browser.enabled=true`. Menonaktifkan hanya Plugin akan menghapus CLI `openclaw browser`, metode Gateway `browser.request`, tool agen, dan layanan kontrol sebagai satu unit; konfigurasi `browser.*` Anda tetap utuh untuk pengganti.

Perubahan konfigurasi browser memerlukan restart Gateway agar Plugin dapat mendaftarkan ulang layanannya.

## Panduan agen

Catatan profil-tool: `tools.profile: "coding"` menyertakan `web_search` dan
`web_fetch`, tetapi tidak menyertakan tool `browser` lengkap. Jika agen atau
sub-agen yang dibuat harus menggunakan otomatisasi browser, tambahkan browser pada tahap
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

Plugin browser mengirimkan dua tingkat panduan agen:

- Deskripsi tool `browser` membawa kontrak ringkas yang selalu aktif: pilih
  profil yang tepat, pertahankan referensi pada tab yang sama, gunakan `tabId`/label untuk
  penargetan tab, dan muat Skill browser untuk pekerjaan multi-langkah.
- Skill `browser-automation` bawaan membawa loop operasi yang lebih panjang:
  periksa status/tab terlebih dahulu, beri label tab tugas, ambil snapshot sebelum bertindak, ambil ulang snapshot
  setelah perubahan UI, pulihkan referensi usang satu kali, dan laporkan login/2FA/captcha atau
  pemblokir kamera/mikrofon sebagai tindakan manual alih-alih menebak.

Skills bawaan Plugin tercantum dalam Skills yang tersedia untuk agen saat
Plugin diaktifkan. Instruksi Skill lengkap dimuat sesuai permintaan, sehingga giliran
rutin tidak membayar biaya token penuh.

## Perintah atau tool browser tidak ada

Jika `openclaw browser` tidak dikenal setelah upgrade, `browser.request` tidak ada, atau agen melaporkan tool browser sebagai tidak tersedia, penyebab biasanya adalah daftar `plugins.allow` yang menghilangkan `browser` dan tidak ada blok konfigurasi root `browser`. Tambahkan ini:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Blok root `browser` eksplisit, misalnya `browser.enabled=true` atau `browser.profiles.<name>`, mengaktifkan Plugin browser bawaan bahkan di bawah `plugins.allow` yang restriktif, sesuai perilaku konfigurasi channel. `plugins.entries.browser.enabled=true` dan `tools.alsoAllow: ["browser"]` tidak menggantikan keanggotaan allowlist dengan sendirinya. Menghapus `plugins.allow` sepenuhnya juga memulihkan default.

## Profil: `openclaw` vs `user`

- `openclaw`: browser terkelola dan terisolasi (tidak memerlukan ekstensi).
- `user`: profil attach Chrome MCP bawaan untuk sesi **Chrome Anda yang benar-benar sudah masuk**.

Untuk panggilan tool browser agen:

- Default: gunakan browser `openclaw` yang terisolasi.
- Lebih pilih `profile="user"` ketika sesi login yang ada penting dan pengguna
  berada di komputer untuk mengeklik/menyetujui prompt attach apa pun.
- `profile` adalah override eksplisit saat Anda menginginkan mode browser tertentu.

Tetapkan `browser.defaultProfile: "openclaw"` jika Anda menginginkan mode terkelola secara default.

## Konfigurasi

Pengaturan browser berada di `~/.openclaw/openclaw.json`.

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

<Accordion title="Port dan keterjangkauan">

- Layanan kontrol bind ke loopback pada port yang diturunkan dari `gateway.port` (default `18791` = gateway + 2). Meng-override `gateway.port` atau `OPENCLAW_GATEWAY_PORT` menggeser port turunan dalam kelompok yang sama.
- Profil `openclaw` lokal menetapkan otomatis `cdpPort`/`cdpUrl`; tetapkan itu hanya untuk CDP jarak jauh. `cdpUrl` default ke port CDP lokal terkelola saat tidak disetel.
- `remoteCdpTimeoutMs` berlaku untuk pemeriksaan keterjangkauan HTTP CDP jarak jauh dan `attachOnly`
  serta permintaan HTTP pembukaan tab; `remoteCdpHandshakeTimeoutMs` berlaku untuk
  handshake WebSocket CDP mereka.
- `localLaunchTimeoutMs` adalah anggaran untuk proses Chrome terkelola yang diluncurkan secara lokal
  agar mengekspos endpoint HTTP CDP-nya. `localCdpReadyTimeoutMs` adalah
  anggaran lanjutan untuk kesiapan websocket CDP setelah proses ditemukan.
  Naikkan nilai ini pada Raspberry Pi, VPS kelas rendah, atau perangkat keras lama tempat Chromium
  mulai lambat. Nilai harus berupa bilangan bulat positif hingga `120000` ms; nilai
  konfigurasi yang tidak valid ditolak.
- Kegagalan peluncuran/kesiapan Chrome terkelola yang berulang diputus sirkuit per
  profil. Setelah beberapa kegagalan berturut-turut, OpenClaw menjeda upaya peluncuran
  baru sebentar alih-alih memunculkan Chromium pada setiap panggilan tool browser. Perbaiki
  masalah startup, nonaktifkan browser jika tidak diperlukan, atau mulai ulang
  Gateway setelah perbaikan.
- `actionTimeoutMs` adalah anggaran default untuk permintaan `act` browser saat pemanggil tidak meneruskan `timeoutMs`. Transport klien menambahkan jendela toleransi kecil agar penantian panjang dapat selesai alih-alih timeout di batas HTTP.
- `tabCleanup` adalah pembersihan upaya-terbaik untuk tab yang dibuka oleh sesi browser agen utama. Pembersihan siklus hidup subagen, cron, dan ACP tetap menutup tab eksplisit yang dilacak di akhir sesi; sesi utama mempertahankan tab aktif agar dapat digunakan kembali, lalu menutup tab terlacak yang idle atau berlebih di latar belakang.

</Accordion>

<Accordion title="Kebijakan SSRF">

- Navigasi browser dan buka-tab dijaga SSRF sebelum navigasi dan diperiksa ulang dengan upaya terbaik pada URL `http(s)` final setelahnya.
- Dalam mode SSRF ketat, penemuan endpoint CDP jarak jauh dan probe `/json/version` (`cdpUrl`) juga diperiksa.
- Variabel lingkungan Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan `NO_PROXY` tidak secara otomatis mem-proxy browser yang dikelola OpenClaw. Chrome terkelola diluncurkan langsung secara default sehingga pengaturan proxy provider tidak melemahkan pemeriksaan SSRF browser.
- Untuk mem-proxy browser terkelola itu sendiri, teruskan flag proxy Chrome eksplisit melalui `browser.extraArgs`, seperti `--proxy-server=...` atau `--proxy-pac-url=...`. Mode SSRF ketat memblokir routing proxy browser eksplisit kecuali akses browser jaringan pribadi diaktifkan secara sengaja.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` nonaktif secara default; aktifkan hanya ketika akses browser jaringan pribadi dipercaya secara sengaja.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.

</Accordion>

<Accordion title="Perilaku profil">

- `attachOnly: true` berarti jangan pernah meluncurkan browser lokal; hanya lampirkan jika sudah ada yang berjalan.
- `headless` dapat diatur secara global atau per profil lokal terkelola. Nilai per profil menimpa `browser.headless`, sehingga satu profil yang diluncurkan secara lokal dapat tetap headless sementara yang lain tetap terlihat.
- `POST /start?headless=true` dan `openclaw browser start --headless` meminta
  peluncuran headless sekali pakai untuk profil lokal terkelola tanpa menulis ulang
  `browser.headless` atau konfigurasi profil. Profil sesi-yang-ada, hanya-lampirkan, dan
  CDP jarak jauh menolak override tersebut karena OpenClaw tidak meluncurkan proses
  browser tersebut.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil lokal terkelola
  secara otomatis default ke headless ketika baik lingkungan maupun konfigurasi profil/global
  tidak secara eksplisit memilih mode headed. `openclaw browser status --json`
  melaporkan `headlessSource` sebagai `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, atau `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` memaksa peluncuran lokal terkelola menjadi headless untuk
  proses saat ini. `OPENCLAW_BROWSER_HEADLESS=0` memaksa mode headed untuk start biasa
  dan mengembalikan galat yang dapat ditindaklanjuti pada host Linux tanpa server tampilan;
  permintaan eksplisit `start --headless` tetap menang untuk satu peluncuran itu.
- `executablePath` dapat diatur secara global atau per profil lokal terkelola. Nilai per profil menimpa `browser.executablePath`, sehingga profil terkelola yang berbeda dapat meluncurkan browser berbasis Chromium yang berbeda. Kedua bentuk menerima `~` untuk direktori home OS Anda.
- `color` (tingkat teratas dan per profil) memberi rona pada UI browser sehingga Anda dapat melihat profil mana yang aktif.
- Profil default adalah `openclaw` (standalone terkelola). Gunakan `defaultProfile: "user"` untuk memilih browser pengguna yang sudah masuk.
- Urutan deteksi otomatis: browser default sistem jika berbasis Chromium; jika tidak Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP alih-alih CDP mentah. Jangan atur `cdpUrl` untuk driver tersebut.
- Atur `browser.profiles.<name>.userDataDir` ketika profil sesi-yang-ada harus melampirkan ke profil pengguna Chromium non-default (Brave, Edge, dll.). Jalur ini juga menerima `~` untuk direktori home OS Anda.

</Accordion>

</AccordionGroup>

## Gunakan Brave atau browser berbasis Chromium lain

Jika browser **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll),
OpenClaw menggunakannya secara otomatis. Atur `browser.executablePath` untuk menimpa
deteksi otomatis. Nilai `executablePath` tingkat teratas dan per profil menerima `~`
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

`executablePath` per profil hanya memengaruhi profil lokal terkelola yang
diluncurkan OpenClaw. Profil `existing-session` melampirkan ke browser yang sudah berjalan
sebagai gantinya, dan profil CDP jarak jauh menggunakan browser di balik `cdpUrl`.

## Kontrol lokal vs jarak jauh

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan browser lokal.
- **Kontrol jarak jauh (host node):** jalankan host node pada mesin yang memiliki browser; Gateway mem-proxy tindakan browser ke host tersebut.
- **CDP jarak jauh:** atur `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  melampirkan ke browser berbasis Chromium jarak jauh. Dalam kasus ini, OpenClaw tidak akan meluncurkan browser lokal.
- Untuk layanan CDP yang dikelola secara eksternal pada loopback (misalnya Browserless di
  Docker yang dipublikasikan ke `127.0.0.1`), atur juga `attachOnly: true`. CDP loopback
  tanpa `attachOnly` diperlakukan sebagai profil browser yang dikelola OpenClaw secara lokal.
- `headless` hanya memengaruhi profil lokal terkelola yang diluncurkan OpenClaw. Itu tidak memulai ulang atau mengubah browser sesi-yang-ada atau CDP jarak jauh.
- `executablePath` mengikuti aturan profil lokal terkelola yang sama. Mengubahnya pada
  profil lokal terkelola yang sedang berjalan menandai profil tersebut untuk restart/rekonsiliasi sehingga
  peluncuran berikutnya menggunakan binary baru.

Perilaku penghentian berbeda menurut mode profil:

- profil lokal terkelola: `openclaw browser stop` menghentikan proses browser yang
  diluncurkan OpenClaw
- profil hanya-lampirkan dan CDP jarak jauh: `openclaw browser stop` menutup sesi
  kontrol aktif dan melepaskan override emulasi Playwright/CDP (viewport,
  skema warna, locale, zona waktu, mode offline, dan status serupa), meskipun
  tidak ada proses browser yang diluncurkan oleh OpenClaw

URL CDP jarak jauh dapat menyertakan auth:

- Token query (misalnya, `https://provider.example?token=<token>`)
- Auth HTTP Basic (misalnya, `https://user:pass@provider.example`)

OpenClaw mempertahankan auth saat memanggil endpoint `/json/*` dan saat menghubungkan
ke WebSocket CDP. Sebaiknya gunakan variabel lingkungan atau pengelola rahasia untuk
token, alih-alih meng-commit token ke file konfigurasi.

## Proxy browser Node (default tanpa konfigurasi)

Jika Anda menjalankan **host node** pada mesin yang memiliki browser Anda, OpenClaw dapat
secara otomatis merutekan panggilan alat browser ke node tersebut tanpa konfigurasi browser tambahan.
Ini adalah jalur default untuk gateway jarak jauh.

Catatan:

- Host node mengekspos server kontrol browser lokalnya melalui **perintah proxy**.
- Profil berasal dari konfigurasi `browser.profiles` milik node itu sendiri (sama seperti lokal).
- `nodeHost.browserProxy.allowProfiles` bersifat opsional. Biarkan kosong untuk perilaku lama/default: semua profil yang dikonfigurasi tetap dapat dijangkau melalui proxy, termasuk rute pembuatan/penghapusan profil.
- Jika Anda mengatur `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas hak-istimewa-minimum: hanya profil yang ada dalam daftar izinkan yang dapat ditargetkan, dan rute pembuatan/penghapusan profil persisten diblokir pada permukaan proxy.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Pada node: `nodeHost.browserProxy.enabled=false`
  - Pada gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP jarak jauh yang di-host)

[Browserless](https://browserless.io) adalah layanan Chromium yang di-host yang mengekspos
URL koneksi CDP melalui HTTPS dan WebSocket. OpenClaw dapat menggunakan salah satu bentuk, tetapi
untuk profil browser jarak jauh opsi paling sederhana adalah URL WebSocket langsung
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

- Ganti `<BROWSERLESS_API_KEY>` dengan token Browserless Anda yang sebenarnya.
- Pilih endpoint wilayah yang cocok dengan akun Browserless Anda (lihat dokumentasi mereka).
- Jika Browserless memberi Anda URL basis HTTPS, Anda dapat mengubahnya menjadi
  `wss://` untuk koneksi CDP langsung atau tetap memakai URL HTTPS dan membiarkan OpenClaw
  menemukan `/json/version`.

### Browserless Docker pada host yang sama

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
proses OpenClaw. Browserless juga harus mengiklankan endpoint cocok yang dapat dijangkau;
atur `EXTERNAL` Browserless ke basis WebSocket publik-ke-OpenClaw yang sama, seperti
`ws://127.0.0.1:3000`, `ws://browserless:3000`, atau alamat jaringan Docker privat
yang stabil. Jika `/json/version` mengembalikan `webSocketDebuggerUrl` yang menunjuk ke
alamat yang tidak dapat dijangkau OpenClaw, CDP HTTP dapat terlihat sehat sementara
lampiran WebSocket tetap gagal.

Jangan biarkan `attachOnly` tidak diatur untuk profil Browserless loopback. Tanpa
`attachOnly`, OpenClaw memperlakukan port loopback sebagai profil browser lokal terkelola
dan mungkin melaporkan bahwa port sedang digunakan tetapi bukan dimiliki oleh OpenClaw.

## Penyedia CDP WebSocket langsung

Beberapa layanan browser yang di-host mengekspos endpoint **WebSocket langsung** alih-alih
penemuan CDP berbasis HTTP standar (`/json/version`). OpenClaw menerima tiga
bentuk URL CDP dan memilih strategi koneksi yang tepat secara otomatis:

- **Penemuan HTTP(S)** - `http://host[:port]` atau `https://host[:port]`.
  OpenClaw memanggil `/json/version` untuk menemukan URL debugger WebSocket, lalu
  menghubungkan. Tidak ada fallback WebSocket.
- **Endpoint WebSocket langsung** - `ws://host[:port]/devtools/<kind>/<id>` atau
  `wss://...` dengan jalur `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw menghubungkan langsung melalui handshake WebSocket dan melewati
  `/json/version` sepenuhnya.
- **Root WebSocket polos** - `ws://host[:port]` atau `wss://host[:port]` tanpa
  jalur `/devtools/...` (misalnya [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw mencoba penemuan
  `/json/version` HTTP terlebih dahulu (menormalkan skema menjadi `http`/`https`);
  jika penemuan mengembalikan `webSocketDebuggerUrl`, nilai itu digunakan, jika tidak OpenClaw
  fallback ke handshake WebSocket langsung pada root polos. Jika endpoint
  WebSocket yang diiklankan menolak handshake CDP tetapi root polos yang dikonfigurasi
  menerimanya, OpenClaw juga fallback ke root tersebut. Ini memungkinkan `ws://` polos
  yang diarahkan ke Chrome lokal tetap terhubung, karena Chrome hanya menerima upgrade WebSocket
  pada jalur per target tertentu dari `/json/version`, sementara penyedia
  yang di-host tetap dapat menggunakan endpoint WebSocket root mereka ketika endpoint
  penemuan mereka mengiklankan URL berumur pendek yang tidak cocok untuk CDP Playwright.

### Browserbase

[Browserbase](https://www.browserbase.com) adalah platform cloud untuk menjalankan
browser headless dengan penyelesaian CAPTCHA bawaan, mode stealth, dan proxy residensial.

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
- Ganti `<BROWSERBASE_API_KEY>` dengan kunci API Browserbase Anda yang sebenarnya.
- Browserbase otomatis membuat sesi browser saat WebSocket terhubung, sehingga tidak
  diperlukan langkah pembuatan sesi manual.
- Tingkat gratis memungkinkan satu sesi bersamaan dan satu jam browser per bulan.
  Lihat [harga](https://www.browserbase.com/pricing) untuk batas paket berbayar.
- Lihat [dokumentasi Browserbase](https://docs.browserbase.com) untuk referensi API
  lengkap, panduan SDK, dan contoh integrasi.

## Keamanan

Gagasan utama:

- Kontrol peramban hanya loopback; akses mengalir melalui autentikasi Gateway atau pemasangan node.
- API HTTP peramban loopback mandiri hanya menggunakan **autentikasi rahasia bersama**:
  autentikasi bearer token gateway, `x-openclaw-password`, atau autentikasi HTTP Basic dengan
  kata sandi gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"` **tidak**
  mengautentikasi API peramban loopback mandiri ini.
- Jika kontrol peramban diaktifkan dan tidak ada autentikasi rahasia bersama yang dikonfigurasi,
  OpenClaw menghasilkan token gateway khusus runtime untuk startup tersebut. Konfigurasikan
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, atau
  `OPENCLAW_GATEWAY_PASSWORD` secara eksplisit jika klien membutuhkan rahasia yang stabil di seluruh
  restart.
- OpenClaw **tidak** menghasilkan token tersebut secara otomatis ketika `gateway.auth.mode` sudah
  berupa `password`, `none`, atau `trusted-proxy`.
- Simpan Gateway dan host node apa pun di jaringan privat (Tailscale); hindari paparan publik.
- Perlakukan URL/token CDP jarak jauh sebagai rahasia; prioritaskan env var atau pengelola rahasia.

Kiat CDP jarak jauh:

- Prioritaskan endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek jika memungkinkan.
- Hindari menyematkan token berumur panjang langsung di file konfigurasi.

## Profil (multi-peramban)

OpenClaw mendukung beberapa profil bernama (konfigurasi perutean). Profil dapat berupa:

- **dikelola openclaw**: instance peramban berbasis Chromium khusus dengan direktori data pengguna + port CDP miliknya sendiri
- **jarak jauh**: URL CDP eksplisit (peramban berbasis Chromium yang berjalan di tempat lain)
- **sesi yang ada**: profil Chrome Anda yang sudah ada melalui koneksi otomatis Chrome DevTools MCP

Default:

- Profil `openclaw` dibuat otomatis jika tidak ada.
- Profil `user` adalah bawaan untuk lampiran sesi yang ada Chrome MCP.
- Profil sesi yang ada bersifat ikut serta selain `user`; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800-18899** secara default.
- Menghapus profil memindahkan direktori data lokalnya ke Trash.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Sesi yang ada melalui Chrome DevTools MCP

OpenClaw juga dapat melampir ke profil peramban berbasis Chromium yang sedang berjalan melalui
server Chrome DevTools MCP resmi. Ini menggunakan ulang tab dan status login
yang sudah terbuka di profil peramban tersebut.

Referensi latar belakang dan penyiapan resmi:

- [Chrome untuk Developer: Gunakan Chrome DevTools MCP dengan sesi peramban Anda](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan:

- `user`

Opsional: buat profil sesi yang ada kustom milik Anda sendiri jika Anda menginginkan
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

1. Buka halaman inspeksi peramban tersebut untuk debugging jarak jauh.
2. Aktifkan debugging jarak jauh.
3. Biarkan peramban tetap berjalan dan setujui prompt koneksi saat OpenClaw melampir.

Halaman inspeksi umum:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Uji asap lampiran langsung:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Seperti apa keberhasilan terlihat:

- `status` menampilkan `driver: existing-session`
- `status` menampilkan `transport: chrome-mcp`
- `status` menampilkan `running: true`
- `tabs` mencantumkan tab peramban Anda yang sudah terbuka
- `snapshot` mengembalikan ref dari tab langsung yang dipilih

Yang perlu diperiksa jika lampiran tidak bekerja:

- peramban target berbasis Chromium adalah versi `144+`
- debugging jarak jauh diaktifkan di halaman inspeksi peramban tersebut
- peramban menampilkan dan Anda menerima prompt persetujuan lampiran
- `openclaw doctor` memigrasikan konfigurasi peramban lama berbasis ekstensi dan memeriksa bahwa
  Chrome terpasang secara lokal untuk profil koneksi otomatis default, tetapi tidak dapat
  mengaktifkan debugging jarak jauh sisi peramban untuk Anda

Penggunaan agen:

- Gunakan `profile="user"` saat Anda membutuhkan status peramban pengguna yang sudah login.
- Jika Anda menggunakan profil sesi yang ada kustom, teruskan nama profil eksplisit tersebut.
- Pilih mode ini hanya saat pengguna berada di depan komputer untuk menyetujui prompt
  lampiran.
- Gateway atau host node dapat menjalankan `npx chrome-devtools-mcp@latest --autoConnect`

Catatan:

- Jalur ini berisiko lebih tinggi daripada profil `openclaw` yang terisolasi karena dapat
  bertindak di dalam sesi peramban Anda yang sudah login.
- OpenClaw tidak meluncurkan peramban untuk driver ini; OpenClaw hanya melampir.
- OpenClaw menggunakan alur resmi Chrome DevTools MCP `--autoConnect` di sini. Jika
  `userDataDir` ditetapkan, nilainya diteruskan untuk menargetkan direktori data pengguna tersebut.
- Sesi yang ada dapat melampir di host yang dipilih atau melalui node peramban yang terhubung.
  Jika Chrome berada di tempat lain dan tidak ada node peramban yang terhubung, gunakan
  CDP jarak jauh atau host node sebagai gantinya.

### Peluncuran Chrome MCP kustom

Timpa server Chrome DevTools MCP yang dijalankan per profil saat alur default
`npx chrome-devtools-mcp@latest` bukan yang Anda inginkan (host offline,
versi yang dipinkan, biner yang di-vendor-kan):

| Bidang       | Fungsinya                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executable yang dijalankan sebagai pengganti `npx`. Di-resolve apa adanya; path absolut dihormati.                       |
| `mcpArgs`    | Array argumen yang diteruskan verbatim ke `mcpCommand`. Menggantikan argumen default `chrome-devtools-mcp@latest --autoConnect`. |

Saat `cdpUrl` ditetapkan pada profil sesi yang ada, OpenClaw melewati
`--autoConnect` dan meneruskan endpoint ke Chrome MCP secara otomatis:

- `http(s)://...` → `--browserUrl <url>` (endpoint penemuan HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket langsung).

Flag endpoint dan `userDataDir` tidak dapat digabungkan: saat `cdpUrl` ditetapkan,
`userDataDir` diabaikan untuk peluncuran Chrome MCP, karena Chrome MCP melampir ke
peramban yang berjalan di balik endpoint, bukan membuka direktori profil.

<Accordion title="Batasan fitur sesi yang ada">

Dibandingkan dengan profil `openclaw` terkelola, driver sesi yang ada lebih terbatas:

- **Tangkapan layar** - tangkapan halaman dan tangkapan elemen `--ref` berfungsi; selector CSS `--element` tidak. `--full-page` tidak dapat digabungkan dengan `--ref` atau `--element`. Playwright tidak diperlukan untuk tangkapan layar halaman atau elemen berbasis ref.
- **Aksi** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan ref snapshot (tanpa selector CSS). `click-coords` mengeklik koordinat viewport yang terlihat dan tidak memerlukan ref snapshot. `click` hanya tombol kiri. `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`. `press` tidak mendukung `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, dan `evaluate` tidak mendukung timeout per panggilan. `select` menerima satu nilai.
- **Tunggu / unggah / dialog** - `wait --url` mendukung pola persis, substring, dan glob; `wait --load networkidle` tidak didukung. Hook unggah memerlukan `ref` atau `inputRef`, satu file pada satu waktu, tanpa CSS `element`. Hook dialog tidak mendukung override timeout.
- **Fitur khusus terkelola** - aksi batch, ekspor PDF, intersepsi unduhan, dan `responsebody` masih memerlukan jalur peramban terkelola.

</Accordion>

## Jaminan isolasi

- **Direktori data pengguna khusus**: tidak pernah menyentuh profil peramban pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah benturan dengan alur kerja pengembangan.
- **Kontrol tab deterministik**: `tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu
  handle `tabId` yang stabil seperti `t1`, label opsional, dan `targetId` mentah.
  Agen sebaiknya menggunakan ulang `suggestedTargetId`; id mentah tetap tersedia untuk
  debugging dan kompatibilitas.

## Pemilihan peramban

Saat meluncurkan secara lokal, OpenClaw memilih yang pertama tersedia:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Anda dapat menimpa dengan `browser.executablePath`.

Platform:

- macOS: memeriksa `/Applications` dan `~/Applications`.
- Linux: memeriksa lokasi umum Chrome/Brave/Edge/Chromium di bawah `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, dan
  `/usr/lib/chromium-browser`, ditambah Chromium yang dikelola Playwright di bawah
  `PLAYWRIGHT_BROWSERS_PATH` atau `~/.cache/ms-playwright`.
- Windows: memeriksa lokasi pemasangan umum.

## API Kontrol (opsional)

Untuk scripting dan debugging, Gateway mengekspos **API HTTP kontrol khusus loopback**
kecil plus CLI `openclaw browser` yang sesuai (snapshot, ref, wait
power-up, output JSON, alur kerja debug). Lihat
[API kontrol peramban](/id/tools/browser-control) untuk referensi lengkap.

## Pemecahan masalah

Untuk masalah khusus Linux (terutama snap Chromium), lihat
[Pemecahan masalah peramban](/id/tools/browser-linux-troubleshooting).

Untuk penyiapan host terpisah WSL2 Gateway + Windows Chrome, lihat
[Pemecahan masalah WSL2 + Windows + CDP Chrome jarak jauh](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Kegagalan startup CDP vs blok SSRF navigasi

Ini adalah kelas kegagalan yang berbeda dan mengarah ke jalur kode yang berbeda.

- **Kegagalan startup atau kesiapan CDP** berarti OpenClaw tidak dapat mengonfirmasi bahwa control plane peramban sehat.
- **Blok SSRF navigasi** berarti control plane peramban sehat, tetapi target navigasi halaman ditolak oleh kebijakan.

Contoh umum:

- Kegagalan startup atau kesiapan CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` saat layanan
    CDP eksternal loopback dikonfigurasi tanpa `attachOnly: true`
- Blok SSRF navigasi:
  - Alur `open`, `navigate`, snapshot, atau pembukaan tab gagal dengan kesalahan kebijakan peramban/jaringan sementara `start` dan `tabs` masih berfungsi

Gunakan urutan minimal ini untuk memisahkan keduanya:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cara membaca hasil:

- Jika `start` gagal dengan `not reachable after start`, pecahkan masalah kesiapan CDP terlebih dahulu.
- Jika `start` berhasil tetapi `tabs` gagal, control plane masih tidak sehat. Perlakukan ini sebagai masalah keterjangkauan CDP, bukan masalah navigasi halaman.
- Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane peramban sudah aktif dan kegagalan ada pada kebijakan navigasi atau halaman target.
- Jika `start`, `tabs`, dan `open` semuanya berhasil, jalur kontrol dasar peramban terkelola sehat.

Detail perilaku penting:

- Konfigurasi peramban default ke objek kebijakan SSRF fail-closed bahkan saat Anda tidak mengonfigurasi `browser.ssrfPolicy`.
- Untuk profil terkelola `openclaw` local loopback, pemeriksaan kesehatan CDP sengaja melewati penegakan keterjangkauan SSRF peramban untuk control plane lokal milik OpenClaw sendiri.
- Perlindungan navigasi terpisah. Hasil `start` atau `tabs` yang berhasil tidak berarti target `open` atau `navigate` berikutnya diizinkan.

Panduan keamanan:

- Jangan **longgarkan** kebijakan SSRF browser secara default.
- Lebih pilih pengecualian host yang sempit seperti `hostnameAllowlist` atau `allowedHostnames` daripada akses jaringan pribadi yang luas.
- Gunakan `dangerouslyAllowPrivateNetwork: true` hanya di lingkungan tepercaya yang disengaja, ketika akses browser ke jaringan pribadi diperlukan dan telah ditinjau.

## Alat agen + cara kerja kontrol

Agen mendapatkan **satu alat** untuk otomasi browser:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cara pemetaannya:

- `browser snapshot` mengembalikan pohon UI yang stabil (AI atau ARIA).
- `browser act` menggunakan ID `ref` snapshot untuk mengeklik/mengetik/menyeret/memilih.
- `browser screenshot` menangkap piksel (halaman penuh, elemen, atau ref berlabel).
- `browser doctor` memeriksa kesiapan Gateway, plugin, profil, browser, dan tab.
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP jarak jauh).
  - `target` (`sandbox` | `host` | `node`) untuk memilih tempat browser berada.
  - Dalam sesi sandbox, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` dihilangkan: sesi sandbox default ke `sandbox`, sesi non-sandbox default ke `host`.
  - Jika node yang mendukung browser terhubung, alat dapat merutekan otomatis ke node tersebut kecuali Anda memasang pin `target="host"` atau `target="node"`.

Ini menjaga agen tetap deterministik dan menghindari selector yang rapuh.

## Terkait

- [Ikhtisar Alat](/id/tools) - semua alat agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) - kontrol browser di lingkungan sandbox
- [Keamanan](/id/gateway/security) - risiko kontrol browser dan pengerasan
