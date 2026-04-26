---
read_when:
    - Menambahkan otomatisasi browser yang dikendalikan agen
    - Men-debug mengapa openclaw mengganggu Chrome Anda sendiri
    - Menerapkan pengaturan + siklus hidup browser di aplikasi macOS
summary: Layanan kontrol browser terintegrasi + perintah tindakan
title: Browser (dikelola OpenClaw)
x-i18n:
    generated_at: "2026-04-26T11:39:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan agen.
Profil ini terisolasi dari browser pribadi Anda dan dikelola melalui layanan
kontrol lokal kecil di dalam Gateway (hanya loopback).

Tampilan untuk pemula:

- Anggap ini sebagai **browser terpisah khusus agen**.
- Profil `openclaw` **tidak** menyentuh profil browser pribadi Anda.
- Agen dapat **membuka tab, membaca halaman, mengklik, dan mengetik** di jalur yang aman.
- Profil bawaan `user` menempel ke sesi Chrome Anda yang sebenarnya dan sudah login melalui Chrome MCP.

## Yang Anda dapatkan

- Profil browser terpisah bernama **openclaw** (aksen oranye secara default).
- Kontrol tab deterministik (daftar/buka/fokus/tutup).
- Tindakan agen (klik/ketik/seret/pilih), snapshot, screenshot, PDF.
- Skill `browser-automation` bawaan yang mengajarkan agen loop pemulihan
  snapshot, tab-stabil, ref-usang, dan pemblokir-manual saat plugin browser diaktifkan.
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

Jika Anda mendapatkan “Browser disabled”, aktifkan di konfigurasi (lihat di bawah) dan mulai ulang
Gateway.

Jika `openclaw browser` sama sekali tidak ada, atau agen mengatakan alat browser
tidak tersedia, lompat ke [Perintah atau alat browser tidak ada](/id/tools/browser#missing-browser-command-or-tool).

## Kontrol Plugin

Alat `browser` default adalah Plugin bawaan. Nonaktifkan untuk menggantinya dengan plugin lain yang mendaftarkan nama alat `browser` yang sama:

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

Default memerlukan `plugins.entries.browser.enabled` **dan** `browser.enabled=true`. Menonaktifkan hanya plugin akan menghapus CLI `openclaw browser`, metode gateway `browser.request`, alat agen, dan layanan kontrol sebagai satu kesatuan; konfigurasi `browser.*` Anda tetap utuh untuk pengganti.

Perubahan konfigurasi browser memerlukan restart Gateway agar plugin dapat mendaftarkan ulang layanannya.

## Panduan agen

Catatan profil alat: `tools.profile: "coding"` mencakup `web_search` dan
`web_fetch`, tetapi tidak mencakup alat `browser` penuh. Jika agen atau
sub-agen yang dihasilkan harus menggunakan otomatisasi browser, tambahkan browser pada tahap profil:

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

Plugin browser menyediakan dua tingkat panduan agen:

- Deskripsi alat `browser` membawa kontrak ringkas yang selalu aktif: pilih
  profil yang tepat, simpan ref di tab yang sama, gunakan `tabId`/label untuk penargetan tab, dan muat skill browser untuk pekerjaan multi-langkah.
- Skill `browser-automation` bawaan membawa loop operasi yang lebih panjang:
  periksa status/tab terlebih dahulu, beri label pada tab tugas, ambil snapshot sebelum bertindak, ambil snapshot ulang
  setelah perubahan UI, pulihkan ref usang sekali, dan laporkan penghalang login/2FA/captcha atau
  kamera/mikrofon sebagai tindakan manual alih-alih menebak.

Skill bawaan plugin dicantumkan dalam skills yang tersedia bagi agen saat
plugin diaktifkan. Instruksi skill lengkap dimuat sesuai permintaan, jadi giliran rutin tidak menanggung biaya token penuh.

## Perintah atau alat browser tidak ada

Jika `openclaw browser` tidak dikenali setelah upgrade, `browser.request` tidak ada, atau agen melaporkan alat browser tidak tersedia, penyebab yang umum adalah daftar `plugins.allow` yang tidak menyertakan `browser`. Tambahkan:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true`, dan `tools.alsoAllow: ["browser"]` tidak menggantikan keanggotaan allowlist — allowlist mengendalikan pemuatan plugin, dan kebijakan alat hanya berjalan setelah pemuatan. Menghapus `plugins.allow` sepenuhnya juga memulihkan default.

## Profil: `openclaw` vs `user`

- `openclaw`: browser terkelola dan terisolasi (tidak memerlukan ekstensi).
- `user`: profil attach Chrome MCP bawaan untuk sesi Chrome Anda yang **sebenarnya dan sudah login**.

Untuk panggilan alat browser agen:

- Default: gunakan browser `openclaw` yang terisolasi.
- Pilih `profile="user"` saat sesi yang sudah login penting dan pengguna
  sedang berada di komputer untuk mengeklik/menyetujui prompt attach.
- `profile` adalah override eksplisit saat Anda menginginkan mode browser tertentu.

Tetapkan `browser.defaultProfile: "openclaw"` jika Anda ingin mode terkelola menjadi default.

## Konfigurasi

Pengaturan browser berada di `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // pilih masuk hanya untuk akses private-network tepercaya
      // allowPrivateNetwork: true, // alias lama
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override profil tunggal lama
    remoteCdpTimeoutMs: 1500, // batas waktu HTTP CDP jarak jauh (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // batas waktu handshake WebSocket CDP jarak jauh (ms)
    localLaunchTimeoutMs: 15000, // batas waktu penemuan Chrome terkelola lokal (ms)
    localCdpReadyTimeoutMs: 8000, // batas waktu kesiapan CDP lokal pasca-peluncuran (ms)
    actionTimeoutMs: 60000, // batas waktu tindakan browser default (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // tetapkan 0 untuk menonaktifkan pembersihan idle
      maxTabsPerSession: 8, // tetapkan 0 untuk menonaktifkan batas per sesi
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

- Layanan kontrol bind ke loopback pada port yang diturunkan dari `gateway.port` (default `18791` = gateway + 2). Menimpa `gateway.port` atau `OPENCLAW_GATEWAY_PORT` menggeser port turunan dalam keluarga yang sama.
- Profil `openclaw` lokal otomatis menetapkan `cdpPort`/`cdpUrl`; tetapkan itu hanya untuk CDP jarak jauh. `cdpUrl` default ke port CDP lokal terkelola saat tidak ditetapkan.
- `remoteCdpTimeoutMs` berlaku untuk pemeriksaan keterjangkauan HTTP CDP jarak jauh dan `attachOnly`
  serta permintaan HTTP pembukaan tab; `remoteCdpHandshakeTimeoutMs` berlaku untuk
  handshake WebSocket CDP keduanya.
- `localLaunchTimeoutMs` adalah anggaran bagi proses Chrome terkelola yang diluncurkan secara lokal
  untuk mengekspos endpoint HTTP CDP-nya. `localCdpReadyTimeoutMs` adalah
  anggaran lanjutan untuk kesiapan websocket CDP setelah proses ditemukan.
  Naikkan nilai ini pada Raspberry Pi, VPS kelas bawah, atau perangkat keras lama tempat Chromium
  memulai dengan lambat. Nilai harus berupa bilangan bulat positif hingga `120000` ms; nilai konfigurasi yang tidak valid
  ditolak.
- `actionTimeoutMs` adalah anggaran default untuk permintaan `act` browser saat pemanggil tidak memberikan `timeoutMs`. Transport klien menambahkan sedikit jendela kelonggaran agar penantian panjang dapat selesai alih-alih timeout di batas HTTP.
- `tabCleanup` adalah pembersihan best-effort untuk tab yang dibuka oleh sesi browser agen utama. Pembersihan siklus hidup subagent, Cron, dan ACP tetap menutup tab eksplisit yang mereka lacak saat sesi berakhir; sesi utama menjaga tab aktif tetap dapat digunakan ulang, lalu menutup tab idle atau berlebih yang terlacak di latar belakang.

</Accordion>

<Accordion title="Kebijakan SSRF">

- Navigasi browser dan pembukaan tab dijaga SSRF sebelum navigasi dan diperiksa ulang secara best-effort pada URL `http(s)` akhir setelahnya.
- Dalam mode SSRF ketat, penemuan endpoint CDP jarak jauh dan probe `/json/version` (`cdpUrl`) juga diperiksa.
- Variabel lingkungan Gateway/penyedia `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan `NO_PROXY` tidak secara otomatis mem-proxy browser yang dikelola OpenClaw. Chrome terkelola diluncurkan langsung secara default agar pengaturan proxy penyedia tidak melemahkan pemeriksaan SSRF browser.
- Untuk mem-proxy browser terkelola itu sendiri, berikan flag proxy Chrome eksplisit melalui `browser.extraArgs`, seperti `--proxy-server=...` atau `--proxy-pac-url=...`. Mode SSRF ketat memblokir perutean proxy browser eksplisit kecuali akses browser private-network memang diaktifkan secara sengaja.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` nonaktif secara default; aktifkan hanya jika akses browser private-network memang tepercaya.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.

</Accordion>

<Accordion title="Perilaku profil">

- `attachOnly: true` berarti jangan pernah meluncurkan browser lokal; hanya attach jika browser sudah berjalan.
- `headless` dapat ditetapkan secara global atau per profil terkelola lokal. Nilai per profil menimpa `browser.headless`, sehingga satu profil yang diluncurkan secara lokal dapat tetap headless sementara yang lain tetap terlihat.
- `POST /start?headless=true` dan `openclaw browser start --headless` meminta
  peluncuran headless satu kali untuk profil terkelola lokal tanpa menulis ulang
  `browser.headless` atau konfigurasi profil. Profil existing-session, attach-only, dan
  CDP jarak jauh menolak override itu karena OpenClaw tidak meluncurkan proses
  browser tersebut.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil terkelola lokal
  default ke headless secara otomatis saat lingkungan maupun konfigurasi profil/global
  tidak secara eksplisit memilih mode bertampilan. `openclaw browser status --json`
  melaporkan `headlessSource` sebagai `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, atau `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` memaksa peluncuran terkelola lokal menjadi headless untuk
  proses saat ini. `OPENCLAW_BROWSER_HEADLESS=0` memaksa mode bertampilan untuk
  start biasa dan mengembalikan galat yang dapat ditindaklanjuti pada host Linux tanpa display server;
  permintaan `start --headless` eksplisit tetap menang untuk satu peluncuran itu.
- `executablePath` dapat ditetapkan secara global atau per profil terkelola lokal. Nilai per profil menimpa `browser.executablePath`, sehingga profil terkelola yang berbeda dapat meluncurkan browser berbasis Chromium yang berbeda. Kedua bentuk menerima `~` untuk direktori home OS Anda.
- `color` (level atas dan per profil) memberi warna pada UI browser sehingga Anda dapat melihat profil mana yang aktif.
- Profil default adalah `openclaw` (mandiri terkelola). Gunakan `defaultProfile: "user"` untuk memilih browser pengguna yang sudah login.
- Urutan deteksi otomatis: browser default sistem jika berbasis Chromium; jika tidak Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP alih-alih CDP mentah. Jangan tetapkan `cdpUrl` untuk driver itu.
- Tetapkan `browser.profiles.<name>.userDataDir` saat profil existing-session harus attach ke profil pengguna Chromium non-default (Brave, Edge, dll.). Jalur ini juga menerima `~` untuk direktori home OS Anda.

</Accordion>

</AccordionGroup>

## Gunakan Brave (atau browser berbasis Chromium lain)

Jika browser **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll),
OpenClaw menggunakannya secara otomatis. Tetapkan `browser.executablePath` untuk menimpa
deteksi otomatis. Nilai `executablePath` level atas dan per profil menerima `~`
untuk direktori home OS Anda:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Atau tetapkan di konfigurasi, per platform:

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

`executablePath` per profil hanya memengaruhi profil terkelola lokal yang diluncurkan OpenClaw
. Profil `existing-session` akan attach ke browser yang sudah berjalan,
sedangkan profil CDP jarak jauh menggunakan browser di balik `cdpUrl`.

## Kontrol lokal vs jarak jauh

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan browser lokal.
- **Kontrol jarak jauh (host node):** jalankan host node pada mesin yang memiliki browser; Gateway mem-proxy tindakan browser ke host tersebut.
- **CDP jarak jauh:** tetapkan `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  attach ke browser berbasis Chromium jarak jauh. Dalam kasus ini, OpenClaw tidak akan meluncurkan browser lokal.
- Untuk layanan CDP yang dikelola secara eksternal di loopback (misalnya Browserless di
  Docker yang dipublikasikan ke `127.0.0.1`), tetapkan juga `attachOnly: true`. CDP loopback
  tanpa `attachOnly` diperlakukan sebagai profil browser yang dikelola OpenClaw secara lokal.
- `headless` hanya memengaruhi profil terkelola lokal yang diluncurkan OpenClaw. Ini tidak me-restart atau mengubah browser existing-session atau CDP jarak jauh.
- `executablePath` mengikuti aturan profil terkelola lokal yang sama. Mengubahnya pada
  profil terkelola lokal yang sedang berjalan menandai profil itu untuk restart/rekonsiliasi sehingga
  peluncuran berikutnya menggunakan biner baru.

Perilaku penghentian berbeda menurut mode profil:

- profil terkelola lokal: `openclaw browser stop` menghentikan proses browser yang
  diluncurkan OpenClaw
- profil attach-only dan CDP jarak jauh: `openclaw browser stop` menutup sesi
  kontrol aktif dan melepaskan override emulasi Playwright/CDP (viewport,
  skema warna, locale, timezone, mode offline, dan status serupa), meskipun
  tidak ada proses browser yang diluncurkan oleh OpenClaw

URL CDP jarak jauh dapat menyertakan auth:

- Token query (misalnya `https://provider.example?token=<token>`)
- Auth Basic HTTP (misalnya `https://user:pass@provider.example`)

OpenClaw mempertahankan auth saat memanggil endpoint `/json/*` dan saat terhubung
ke WebSocket CDP. Gunakan variabel lingkungan atau pengelola secret untuk
token alih-alih meng-commit-nya ke file konfigurasi.

## Proksi browser node (default tanpa konfigurasi)

Jika Anda menjalankan **host node** pada mesin yang memiliki browser Anda, OpenClaw dapat
secara otomatis merutekan panggilan alat browser ke node tersebut tanpa konfigurasi browser tambahan.
Ini adalah jalur default untuk gateway jarak jauh.

Catatan:

- Host node mengekspos server kontrol browser lokalnya melalui **perintah proxy**.
- Profil berasal dari konfigurasi `browser.profiles` milik node itu sendiri (sama seperti lokal).
- `nodeHost.browserProxy.allowProfiles` bersifat opsional. Biarkan kosong untuk perilaku lama/default: semua profil yang dikonfigurasi tetap dapat dijangkau melalui proxy, termasuk rute pembuatan/penghapusan profil.
- Jika Anda menetapkan `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas least-privilege: hanya profil yang ada di allowlist yang dapat ditargetkan, dan rute pembuatan/penghapusan profil persisten diblokir pada permukaan proxy.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Di node: `nodeHost.browserProxy.enabled=false`
  - Di gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP jarak jauh terhosting)

[Browserless](https://browserless.io) adalah layanan Chromium terhosting yang mengekspos
URL koneksi CDP melalui HTTPS dan WebSocket. OpenClaw dapat menggunakan keduanya, tetapi
untuk profil browser jarak jauh opsi yang paling sederhana adalah URL WebSocket langsung
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
- Pilih endpoint region yang sesuai dengan akun Browserless Anda (lihat dokumen mereka).
- Jika Browserless memberi Anda base URL HTTPS, Anda dapat mengubahnya menjadi
  `wss://` untuk koneksi CDP langsung atau tetap menggunakan URL HTTPS dan membiarkan OpenClaw
  menemukan `/json/version`.

### Docker Browserless pada host yang sama

Saat Browserless di-host sendiri di Docker dan OpenClaw berjalan di host, perlakukan
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
tetapkan `EXTERNAL` Browserless ke basis WebSocket publik-ke-OpenClaw yang sama, seperti
`ws://127.0.0.1:3000`, `ws://browserless:3000`, atau alamat Docker private network yang
stabil. Jika `/json/version` mengembalikan `webSocketDebuggerUrl` yang mengarah ke
alamat yang tidak dapat dijangkau OpenClaw, HTTP CDP dapat terlihat sehat sementara
attach WebSocket tetap gagal.

Jangan biarkan `attachOnly` tidak ditetapkan untuk profil Browserless loopback. Tanpa
`attachOnly`, OpenClaw memperlakukan port loopback sebagai profil browser terkelola lokal
dan dapat melaporkan bahwa port sedang digunakan tetapi bukan dimiliki oleh OpenClaw.

## Penyedia CDP WebSocket langsung

Beberapa layanan browser terhosting mengekspos endpoint **WebSocket langsung** alih-alih
penemuan CDP berbasis HTTP standar (`/json/version`). OpenClaw menerima tiga
bentuk URL CDP dan otomatis memilih strategi koneksi yang tepat:

- **Penemuan HTTP(S)** — `http://host[:port]` atau `https://host[:port]`.
  OpenClaw memanggil `/json/version` untuk menemukan URL debugger WebSocket, lalu
  terhubung. Tidak ada fallback WebSocket.
- **Endpoint WebSocket langsung** — `ws://host[:port]/devtools/<kind>/<id>` atau
  `wss://...` dengan path `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw terhubung langsung melalui handshake WebSocket dan sepenuhnya melewati
  `/json/version`.
- **Root WebSocket kosong** — `ws://host[:port]` atau `wss://host[:port]` tanpa
  path `/devtools/...` (misalnya [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw mencoba penemuan HTTP
  `/json/version` terlebih dahulu (menormalkan skema menjadi `http`/`https`);
  jika penemuan mengembalikan `webSocketDebuggerUrl`, itu akan digunakan, jika tidak OpenClaw
  fallback ke handshake WebSocket langsung pada root kosong tersebut. Jika endpoint
  WebSocket yang diiklankan menolak handshake CDP tetapi root kosong yang dikonfigurasi
  menerimanya, OpenClaw juga fallback ke root tersebut. Ini memungkinkan `ws://` kosong
  yang diarahkan ke Chrome lokal tetap terhubung, karena Chrome hanya menerima
  upgrade WebSocket pada path spesifik per target dari `/json/version`, sementara penyedia
  terhosting tetap dapat menggunakan endpoint WebSocket root mereka saat endpoint penemuan mereka
  mengiklankan URL berumur pendek yang tidak cocok untuk Playwright CDP.

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

- [Daftar](https://www.browserbase.com/sign-up) dan salin **API Key**
  Anda dari [dashboard Overview](https://www.browserbase.com/overview).
- Ganti `<BROWSERBASE_API_KEY>` dengan API key Browserbase Anda yang sebenarnya.
- Browserbase otomatis membuat sesi browser saat WebSocket terhubung, jadi tidak
  diperlukan langkah pembuatan sesi manual.
- Tingkat gratis memungkinkan satu sesi konkuren dan satu jam browser per bulan.
  Lihat [harga](https://www.browserbase.com/pricing) untuk batas paket berbayar.
- Lihat [dokumen Browserbase](https://docs.browserbase.com) untuk referensi API
  lengkap, panduan SDK, dan contoh integrasi.

## Keamanan

Konsep utama:

- Kontrol browser hanya loopback; akses mengalir melalui auth Gateway atau pairing node.
- API HTTP browser loopback mandiri menggunakan **hanya auth shared-secret**:
  auth bearer token gateway, `x-openclaw-password`, atau auth Basic HTTP dengan
  kata sandi gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"` tidak
  mengautentikasi API browser loopback mandiri ini.
- Jika kontrol browser diaktifkan dan tidak ada auth shared-secret yang dikonfigurasi, OpenClaw
  secara otomatis membuat `gateway.auth.token` saat startup dan menyimpannya ke konfigurasi.
- OpenClaw **tidak** membuat token itu secara otomatis ketika `gateway.auth.mode` sudah
  `password`, `none`, atau `trusted-proxy`.
- Pertahankan Gateway dan host node apa pun pada private network (Tailscale); hindari paparan publik.
- Perlakukan URL/token CDP jarak jauh sebagai secret; pilih variabel lingkungan atau pengelola secret.

Tips CDP jarak jauh:

- Pilih endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek jika memungkinkan.
- Hindari menyematkan token berumur panjang langsung di file konfigurasi.

## Profil (multi-browser)

OpenClaw mendukung beberapa profil bernama (konfigurasi perutean). Profil dapat berupa:

- **dikelola OpenClaw**: instance browser berbasis Chromium khusus dengan direktori data pengguna + port CDP miliknya sendiri
- **jarak jauh**: URL CDP eksplisit (browser berbasis Chromium yang berjalan di tempat lain)
- **sesi yang ada**: profil Chrome Anda yang ada melalui sambung otomatis Chrome DevTools MCP

Default:

- Profil `openclaw` dibuat otomatis jika tidak ada.
- Profil `user` tersedia bawaan untuk attach existing-session Chrome MCP.
- Profil existing-session bersifat opt-in di luar `user`; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800–18899** secara default.
- Menghapus profil memindahkan direktori data lokalnya ke Trash.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Sesi yang ada melalui Chrome DevTools MCP

OpenClaw juga dapat attach ke profil browser berbasis Chromium yang sedang berjalan melalui
server MCP Chrome DevTools resmi. Ini menggunakan kembali tab dan status login
yang sudah terbuka di profil browser tersebut.

Referensi latar belakang dan penyiapan resmi:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan:

- `user`

Opsional: buat profil existing-session kustom Anda sendiri jika Anda ingin
nama, warna, atau direktori data browser yang berbeda.

Perilaku default:

- Profil `user` bawaan menggunakan sambung otomatis Chrome MCP, yang menargetkan
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

Lalu pada browser yang sesuai:

1. Buka halaman inspect browser tersebut untuk remote debugging.
2. Aktifkan remote debugging.
3. Biarkan browser tetap berjalan dan setujui prompt koneksi saat OpenClaw melakukan attach.

Halaman inspect yang umum:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Uji smoke attach live:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Seperti inilah kondisi berhasil:

- `status` menampilkan `driver: existing-session`
- `status` menampilkan `transport: chrome-mcp`
- `status` menampilkan `running: true`
- `tabs` mencantumkan tab browser Anda yang sudah terbuka
- `snapshot` mengembalikan ref dari tab live yang dipilih

Yang perlu diperiksa jika attach tidak berfungsi:

- browser berbasis Chromium target memiliki versi `144+`
- remote debugging diaktifkan di halaman inspect browser tersebut
- browser menampilkan prompt persetujuan attach dan Anda menerimanya
- `openclaw doctor` memigrasikan konfigurasi browser lama berbasis ekstensi dan memeriksa bahwa
  Chrome terpasang secara lokal untuk profil sambung otomatis default, tetapi alat ini tidak dapat
  mengaktifkan remote debugging sisi browser untuk Anda

Penggunaan agen:

- Gunakan `profile="user"` saat Anda memerlukan status browser pengguna yang sudah login.
- Jika Anda menggunakan profil existing-session kustom, berikan nama profil eksplisit tersebut.
- Pilih mode ini hanya saat pengguna berada di depan komputer untuk menyetujui prompt
  attach.
- Gateway atau host node dapat menjalankan `npx chrome-devtools-mcp@latest --autoConnect`

Catatan:

- Jalur ini berisiko lebih tinggi daripada profil `openclaw` yang terisolasi karena dapat
  bertindak di dalam sesi browser Anda yang sudah login.
- OpenClaw tidak meluncurkan browser untuk driver ini; alat ini hanya melakukan attach.
- OpenClaw menggunakan alur `--autoConnect` Chrome DevTools MCP resmi di sini. Jika
  `userDataDir` ditetapkan, nilainya akan diteruskan untuk menargetkan direktori data pengguna tersebut.
- Existing-session dapat melakukan attach pada host yang dipilih atau melalui
  node browser yang terhubung. Jika Chrome berada di tempat lain dan tidak ada node browser yang terhubung, gunakan
  CDP jarak jauh atau host node sebagai gantinya.

### Peluncuran Chrome MCP kustom

Timpa server Chrome DevTools MCP yang dijalankan per profil saat alur default
`npx chrome-devtools-mcp@latest` bukan yang Anda inginkan (host offline,
versi yang dipatok, biner yang disertakan):

| Field        | Fungsinya                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executable yang dijalankan alih-alih `npx`. Diresolusikan apa adanya; path absolut dihormati.                            |
| `mcpArgs`    | Array argumen yang diberikan apa adanya ke `mcpCommand`. Menggantikan argumen default `chrome-devtools-mcp@latest --autoConnect`. |

Saat `cdpUrl` ditetapkan pada profil existing-session, OpenClaw melewati
`--autoConnect` dan meneruskan endpoint ke Chrome MCP secara otomatis:

- `http(s)://...` → `--browserUrl <url>` (endpoint penemuan HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP langsung).

Flag endpoint dan `userDataDir` tidak dapat digabungkan: saat `cdpUrl` ditetapkan,
`userDataDir` diabaikan untuk peluncuran Chrome MCP, karena Chrome MCP melakukan attach ke
browser yang berjalan di balik endpoint alih-alih membuka direktori
profil.

<Accordion title="Batasan fitur existing-session">

Dibandingkan profil `openclaw` yang terkelola, driver existing-session lebih terbatas:

- **Screenshot** — pengambilan halaman dan pengambilan elemen `--ref` berfungsi; selector CSS `--element` tidak. `--full-page` tidak dapat digabungkan dengan `--ref` atau `--element`. Playwright tidak diperlukan untuk screenshot halaman atau elemen berbasis ref.
- **Tindakan** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan ref snapshot (tanpa selector CSS). `click-coords` mengklik koordinat viewport yang terlihat dan tidak memerlukan ref snapshot. `click` hanya untuk tombol kiri. `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`. `press` tidak mendukung `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, dan `evaluate` tidak mendukung timeout per panggilan. `select` menerima satu nilai.
- **Wait / upload / dialog** — `wait --url` mendukung pola exact, substring, dan glob; `wait --load networkidle` tidak didukung. Hook upload memerlukan `ref` atau `inputRef`, satu file sekaligus, tanpa CSS `element`. Hook dialog tidak mendukung override timeout.
- **Fitur khusus terkelola** — tindakan batch, ekspor PDF, intersepsi unduhan, dan `responsebody` tetap memerlukan jalur browser terkelola.

</Accordion>

## Jaminan isolasi

- **Direktori data pengguna khusus**: tidak pernah menyentuh profil browser pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah benturan dengan alur kerja developer.
- **Kontrol tab deterministik**: `tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu
  handle `tabId` stabil seperti `t1`, label opsional, dan `targetId` mentah.
  Agen sebaiknya menggunakan kembali `suggestedTargetId`; id mentah tetap tersedia untuk
  debugging dan kompatibilitas.

## Pemilihan browser

Saat diluncurkan secara lokal, OpenClaw memilih yang pertama tersedia:

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

Untuk scripting dan debugging, Gateway mengekspos **API kontrol HTTP hanya loopback**
kecil plus CLI `openclaw browser` yang sesuai (snapshot, ref, peningkatan wait,
output JSON, alur kerja debug). Lihat
[API kontrol browser](/id/tools/browser-control) untuk referensi lengkap.

## Pemecahan masalah

Untuk masalah khusus Linux (terutama snap Chromium), lihat
[Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting).

Untuk penyiapan host-terpisah WSL2 Gateway + Windows Chrome, lihat
[Pemecahan masalah WSL2 + Windows + Chrome CDP jarak jauh](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Kegagalan startup CDP vs blok SSRF navigasi

Ini adalah kelas kegagalan yang berbeda dan menunjuk ke jalur kode yang berbeda.

- **Kegagalan startup atau kesiapan CDP** berarti OpenClaw tidak dapat memastikan bahwa control plane browser sehat.
- **Blok SSRF navigasi** berarti control plane browser sehat, tetapi target navigasi halaman ditolak oleh kebijakan.

Contoh umum:

- Kegagalan startup atau kesiapan CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` saat sebuah
    layanan CDP eksternal loopback dikonfigurasi tanpa `attachOnly: true`
- Blok SSRF navigasi:
  - alur `open`, `navigate`, snapshot, atau pembukaan tab gagal dengan galat kebijakan browser/jaringan sementara `start` dan `tabs` tetap berfungsi

Gunakan urutan minimal ini untuk membedakan keduanya:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cara membaca hasilnya:

- Jika `start` gagal dengan `not reachable after start`, tangani masalah kesiapan CDP terlebih dahulu.
- Jika `start` berhasil tetapi `tabs` gagal, control plane masih tidak sehat. Perlakukan ini sebagai masalah keterjangkauan CDP, bukan masalah navigasi halaman.
- Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane browser aktif dan kegagalannya ada pada kebijakan navigasi atau halaman target.
- Jika `start`, `tabs`, dan `open` semuanya berhasil, jalur kontrol browser terkelola dasar sehat.

Detail perilaku penting:

- Konfigurasi browser secara default menggunakan objek kebijakan SSRF fail-closed bahkan saat Anda tidak mengonfigurasi `browser.ssrfPolicy`.
- Untuk profil terkelola loopback lokal `openclaw`, pemeriksaan kesehatan CDP sengaja melewati penegakan keterjangkauan SSRF browser untuk control plane lokal OpenClaw sendiri.
- Perlindungan navigasi bersifat terpisah. Hasil `start` atau `tabs` yang berhasil tidak berarti target `open` atau `navigate` berikutnya diizinkan.

Panduan keamanan:

- **Jangan** melonggarkan kebijakan SSRF browser secara default.
- Pilih pengecualian host yang sempit seperti `hostnameAllowlist` atau `allowedHostnames` daripada akses private-network yang luas.
- Gunakan `dangerouslyAllowPrivateNetwork: true` hanya di lingkungan yang memang tepercaya tempat akses browser private-network diperlukan dan telah ditinjau.

## Alat agen + cara kerja kontrol

Agen mendapatkan **satu alat** untuk otomatisasi browser:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Pemetaan kerjanya:

- `browser snapshot` mengembalikan pohon UI stabil (AI atau ARIA).
- `browser act` menggunakan id `ref` dari snapshot untuk klik/ketik/seret/pilih.
- `browser screenshot` menangkap piksel (halaman penuh, elemen, atau ref berlabel).
- `browser doctor` memeriksa Gateway, plugin, profil, browser, dan kesiapan tab.
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP jarak jauh).
  - `target` (`sandbox` | `host` | `node`) untuk memilih lokasi browser.
  - Dalam sesi sandbox, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` tidak diberikan: sesi sandbox default ke `sandbox`, sesi non-sandbox default ke `host`.
  - Jika node yang mampu menjalankan browser terhubung, alat dapat merutekan otomatis ke node tersebut kecuali Anda mematok `target="host"` atau `target="node"`.

Ini menjaga agen tetap deterministik dan menghindari selector yang rapuh.

## Terkait

- [Ikhtisar Tools](/id/tools) — semua alat agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) — kontrol browser di lingkungan sandbox
- [Keamanan](/id/gateway/security) — risiko kontrol browser dan hardening
