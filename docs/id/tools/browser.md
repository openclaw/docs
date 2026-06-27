---
read_when:
    - Menambahkan otomatisasi browser yang dikendalikan agen
    - Men-debug mengapa OpenClaw mengganggu Chrome Anda sendiri
    - Menerapkan pengaturan browser + siklus hidup di aplikasi macOS
summary: Layanan kontrol peramban terintegrasi + perintah tindakan
title: Browser (dikelola OpenClaw)
x-i18n:
    generated_at: "2026-06-27T18:16:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan agen.
Profil ini terisolasi dari browser pribadi Anda dan dikelola melalui layanan
kontrol lokal kecil di dalam Gateway (hanya loopback).

Tampilan pemula:

- Anggap ini sebagai **browser terpisah khusus agen**.
- Profil `openclaw` **tidak** menyentuh profil browser pribadi Anda.
- Agen dapat **membuka tab, membaca halaman, mengeklik, dan mengetik** di jalur yang aman.
- Profil `user` bawaan terhubung ke sesi Chrome Anda yang benar-benar sudah login melalui Chrome MCP.

## Yang Anda dapatkan

- Profil browser terpisah bernama **openclaw** (aksen oranye secara default).
- Kontrol tab deterministik (list/open/focus/close).
- Tindakan agen (click/type/drag/select), snapshot, tangkapan layar, PDF.
- Skill `browser-automation` bawaan yang mengajarkan agen loop pemulihan snapshot,
  tab stabil, referensi kedaluwarsa, dan pemblokir manual saat Plugin browser
  diaktifkan.
- Dukungan multi-profil opsional (`openclaw`, `work`, `remote`, ...).

Browser ini **bukan** browser harian Anda. Ini adalah permukaan yang aman dan
terisolasi untuk otomasi dan verifikasi agen.

## Mulai cepat

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jika Anda mendapatkan "Browser dinonaktifkan", aktifkan di konfigurasi (lihat di bawah) dan mulai ulang
Gateway.

Jika `openclaw browser` sama sekali tidak ada, atau agen mengatakan alat browser
tidak tersedia, lanjutkan ke [Perintah atau alat browser hilang](/id/tools/browser#missing-browser-command-or-tool).

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

Default memerlukan `plugins.entries.browser.enabled` **dan** `browser.enabled=true`. Menonaktifkan hanya Plugin akan menghapus CLI `openclaw browser`, metode Gateway `browser.request`, alat agen, dan layanan kontrol sebagai satu unit; konfigurasi `browser.*` Anda tetap utuh untuk pengganti.

Perubahan konfigurasi browser memerlukan mulai ulang Gateway agar Plugin dapat mendaftarkan ulang layanannya.

## Panduan agen

Catatan profil alat: `tools.profile: "coding"` menyertakan `web_search` dan
`web_fetch`, tetapi tidak menyertakan alat `browser` lengkap. Jika agen atau
sub-agen yang dibuat harus menggunakan otomasi browser, tambahkan browser pada
tahap profil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Untuk satu agen, gunakan `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` saja tidak cukup karena kebijakan
sub-agen diterapkan setelah pemfilteran profil.

Plugin browser mengirim dua tingkat panduan agen:

- Deskripsi alat `browser` membawa kontrak ringkas yang selalu aktif: pilih
  profil yang tepat, pertahankan referensi pada tab yang sama, gunakan `tabId`/label untuk
  penargetan tab, dan muat Skill browser untuk pekerjaan multi-langkah.
- Skill `browser-automation` bawaan membawa loop operasi yang lebih panjang:
  periksa status/tab terlebih dahulu, beri label pada tab tugas, ambil snapshot sebelum bertindak, ambil ulang snapshot
  setelah perubahan UI, pulihkan referensi kedaluwarsa sekali, dan laporkan login/2FA/captcha atau
  pemblokir kamera/mikrofon sebagai tindakan manual alih-alih menebak.

Skills bawaan Plugin tercantum dalam Skills yang tersedia untuk agen saat
Plugin diaktifkan. Instruksi Skill lengkap dimuat sesuai permintaan, sehingga giliran
rutin tidak membayar biaya token penuh.

## Perintah atau alat browser hilang

Jika `openclaw browser` tidak dikenal setelah peningkatan, `browser.request` hilang, atau agen melaporkan alat browser tidak tersedia, penyebab biasanya adalah daftar `plugins.allow` yang tidak menyertakan `browser` dan tidak ada blok konfigurasi root `browser`. Tambahkan ini:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Blok root `browser` eksplisit, misalnya `browser.enabled=true` atau `browser.profiles.<name>`, mengaktifkan Plugin browser bawaan bahkan di bawah `plugins.allow` yang membatasi, selaras dengan perilaku konfigurasi channel. `plugins.entries.browser.enabled=true` dan `tools.alsoAllow: ["browser"]` tidak menggantikan keanggotaan allowlist dengan sendirinya. Menghapus `plugins.allow` sepenuhnya juga memulihkan default.

## Profil: `openclaw` vs `user`

- `openclaw`: browser terkelola dan terisolasi (tidak memerlukan ekstensi).
- `user`: profil lampiran Chrome MCP bawaan untuk sesi **Chrome Anda yang benar-benar sudah login**.

Untuk panggilan alat browser agen:

- Default: gunakan browser `openclaw` yang terisolasi.
- Utamakan `profile="user"` saat sesi login yang ada penting dan pengguna
  berada di komputer untuk mengeklik/menyetujui prompt lampiran apa pun.
- `profile` adalah override eksplisit saat Anda menginginkan mode browser tertentu.

Tetapkan `browser.defaultProfile: "openclaw"` jika Anda ingin mode terkelola secara default.

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

### Visi tangkapan layar (dukungan model hanya teks)

Saat model utama hanya teks (tanpa dukungan visi/multimodal), tangkapan layar
browser mengembalikan blok gambar yang tidak dapat dibaca model. Tangkapan layar browser
menggunakan ulang konfigurasi pemahaman gambar yang ada, sehingga model gambar
yang dikonfigurasi untuk pemahaman media dapat mendeskripsikan tangkapan layar sebagai teks tanpa
pengaturan model khusus browser.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Cara kerjanya:**

1. Agen memanggil `browser screenshot` → gambar ditangkap ke disk seperti biasa.
2. Alat browser menanyakan runtime pemahaman gambar yang ada apakah ia
   dapat mendeskripsikan tangkapan layar menggunakan model gambar media yang dikonfigurasi, model media bersama,
   default model gambar, atau penyedia gambar berbasis autentikasi.
3. Model visi mengembalikan deskripsi teks, yang dibungkus dengan
   `wrapExternalContent` (pelindung injeksi prompt) dan dikembalikan ke agen
   sebagai blok teks, bukan blok gambar.
4. Jika pemahaman gambar tidak tersedia, dilewati, atau gagal, browser kembali
   mengembalikan blok gambar asli.

Gunakan bidang `tools.media.image` / `tools.media.models` yang ada untuk fallback
model, timeout, batas byte, profil, dan pengaturan permintaan penyedia.

Jika model utama aktif sudah mendukung visi dan tidak ada model pemahaman gambar
eksplisit yang dikonfigurasi, OpenClaw mempertahankan hasil gambar normal sehingga
model utama dapat membaca tangkapan layar secara langsung.

<AccordionGroup>

<Accordion title="Ports and reachability">

- Layanan kontrol mengikat ke loopback pada port yang diturunkan dari `gateway.port` (default `18791` = gateway + 2). Meng-override `gateway.port` atau `OPENCLAW_GATEWAY_PORT` menggeser port turunan dalam keluarga yang sama.
- Profil `openclaw` lokal menetapkan `cdpPort`/`cdpUrl` secara otomatis; tetapkan itu hanya untuk
  profil CDP jarak jauh atau lampiran endpoint existing-session. `cdpUrl` secara default mengarah ke
  port CDP lokal terkelola saat tidak ditetapkan.
- `remoteCdpTimeoutMs` berlaku untuk pemeriksaan keterjangkauan HTTP CDP jarak jauh dan `attachOnly`
  serta permintaan HTTP pembukaan tab; `remoteCdpHandshakeTimeoutMs` berlaku untuk
  handshake WebSocket CDP mereka.
- `localLaunchTimeoutMs` adalah anggaran untuk proses Chrome terkelola yang diluncurkan secara lokal
  agar mengekspos endpoint HTTP CDP-nya. `localCdpReadyTimeoutMs` adalah
  anggaran lanjutan untuk kesiapan websocket CDP setelah proses ditemukan.
  Naikkan ini pada Raspberry Pi, VPS kelas bawah, atau perangkat keras lama ketika Chromium
  mulai dengan lambat. Nilai harus berupa bilangan bulat positif hingga `120000` ms; nilai
  konfigurasi yang tidak valid ditolak.
- Kegagalan peluncuran/kesiapan Chrome terkelola yang berulang diputus sirkuitnya per
  profil. Setelah beberapa kegagalan berturut-turut, OpenClaw menjeda upaya
  peluncuran baru sebentar alih-alih menjalankan Chromium pada setiap panggilan alat browser. Perbaiki
  masalah startup, nonaktifkan browser jika tidak diperlukan, atau mulai ulang
  Gateway setelah perbaikan.
- `actionTimeoutMs` adalah anggaran default untuk permintaan `act` browser saat pemanggil tidak meneruskan `timeoutMs`. Transport klien menambahkan jendela kelonggaran kecil agar penantian panjang dapat selesai alih-alih timeout di batas HTTP.
- `tabCleanup` adalah pembersihan upaya-terbaik untuk tab yang dibuka oleh sesi browser agen utama. Pembersihan siklus hidup subagen, cron, dan ACP tetap menutup tab terlacak eksplisit mereka pada akhir sesi; sesi utama mempertahankan tab aktif agar dapat digunakan ulang, lalu menutup tab terlacak yang idle atau berlebih di latar belakang.

</Accordion>

<Accordion title="SSRF policy">

- Navigasi browser dan tab terbuka dilindungi SSRF sebelum navigasi dan diperiksa ulang secara upaya terbaik pada URL akhir `http(s)` setelahnya.
- Dalam mode SSRF ketat, penemuan endpoint CDP jarak jauh dan probe `/json/version` (`cdpUrl`) juga diperiksa.
- Variabel lingkungan Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan `NO_PROXY` tidak otomatis mem-proxy browser yang dikelola OpenClaw. Chrome terkelola diluncurkan langsung secara default sehingga pengaturan proxy provider tidak melemahkan pemeriksaan SSRF browser.
- Probe kesiapan CDP lokal yang dikelola OpenClaw dan koneksi WebSocket DevTools melewati proxy jaringan terkelola untuk endpoint loopback yang diluncurkan persis, sehingga `openclaw browser start` tetap berfungsi ketika proxy operator memblokir egress loopback.
- Untuk mem-proxy browser terkelola itu sendiri, teruskan flag proxy Chrome eksplisit melalui `browser.extraArgs`, seperti `--proxy-server=...` atau `--proxy-pac-url=...`. Mode SSRF ketat memblokir perutean proxy browser eksplisit kecuali akses browser jaringan privat sengaja diaktifkan.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` nonaktif secara default; aktifkan hanya ketika akses browser jaringan privat sengaja dipercaya.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias legacy.

</Accordion>

<Accordion title="Perilaku profil">

- `attachOnly: true` berarti jangan pernah meluncurkan browser lokal; hanya attach jika sudah ada yang berjalan.
- `headless` dapat diatur secara global atau per profil terkelola lokal. Nilai per profil menimpa `browser.headless`, sehingga satu profil yang diluncurkan secara lokal dapat tetap headless sementara profil lain tetap terlihat.
- `POST /start?headless=true` dan `openclaw browser start --headless` meminta
  peluncuran headless sekali pakai untuk profil terkelola lokal tanpa menulis ulang
  `browser.headless` atau konfigurasi profil. Profil sesi yang sudah ada, attach-only, dan
  CDP jarak jauh menolak override karena OpenClaw tidak meluncurkan
  proses browser tersebut.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil terkelola lokal
  otomatis default ke headless ketika baik lingkungan maupun konfigurasi profil/global
  tidak secara eksplisit memilih mode dengan tampilan. `openclaw browser status --json`
  melaporkan `headlessSource` sebagai `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, atau `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` memaksa peluncuran terkelola lokal menjadi headless untuk
  proses saat ini. `OPENCLAW_BROWSER_HEADLESS=0` memaksa mode dengan tampilan untuk start
  biasa dan mengembalikan galat yang dapat ditindaklanjuti pada host Linux tanpa server tampilan;
  permintaan `start --headless` eksplisit tetap menang untuk peluncuran sekali itu.
- `executablePath` dapat diatur secara global atau per profil terkelola lokal. Nilai per profil menimpa `browser.executablePath`, sehingga profil terkelola yang berbeda dapat meluncurkan browser berbasis Chromium yang berbeda. Kedua bentuk menerima `~` untuk direktori home OS Anda.
- `color` (level teratas dan per profil) memberi warna pada UI browser sehingga Anda dapat melihat profil mana yang aktif.
- Profil default adalah `openclaw` (standalone terkelola). Gunakan `defaultProfile: "user"` untuk ikut menggunakan browser pengguna yang sudah masuk.
- Urutan deteksi otomatis: browser default sistem jika berbasis Chromium; jika tidak Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP alih-alih CDP mentah. Ini dapat attach melalui auto-connect Chrome MCP, atau melalui `cdpUrl` ketika Anda sudah memiliki endpoint DevTools untuk browser yang berjalan.
- Atur `browser.profiles.<name>.userDataDir` ketika profil existing-session harus attach ke profil pengguna Chromium non-default (Brave, Edge, dll.). Jalur ini juga menerima `~` untuk direktori home OS Anda.

</Accordion>

</AccordionGroup>

## Gunakan Brave atau browser berbasis Chromium lain

Jika browser **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll),
OpenClaw menggunakannya secara otomatis. Atur `browser.executablePath` untuk menimpa
deteksi otomatis. Nilai `executablePath` level teratas dan per profil menerima `~`
untuk direktori home OS Anda:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Atau atur dalam konfigurasi, per platform:

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

`executablePath` per profil hanya memengaruhi profil terkelola lokal yang diluncurkan
OpenClaw. Profil `existing-session` attach ke browser yang sudah berjalan
sebagai gantinya, dan profil CDP jarak jauh menggunakan browser di balik `cdpUrl`.

## Kontrol lokal vs jarak jauh

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan browser lokal.
- **Kontrol jarak jauh (host Node):** jalankan host Node pada mesin yang memiliki browser; Gateway mem-proxy tindakan browser ke sana.
- **CDP jarak jauh:** atur `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  attach ke browser berbasis Chromium jarak jauh. Dalam kasus ini, OpenClaw tidak akan meluncurkan browser lokal.
- Untuk layanan CDP yang dikelola eksternal pada loopback (misalnya Browserless di
  Docker yang dipublikasikan ke `127.0.0.1`), atur juga `attachOnly: true`. CDP loopback
  tanpa `attachOnly` diperlakukan sebagai profil browser lokal yang dikelola OpenClaw.
- `headless` hanya memengaruhi profil terkelola lokal yang diluncurkan OpenClaw. Ini tidak memulai ulang atau mengubah browser existing-session atau CDP jarak jauh.
- `executablePath` mengikuti aturan profil terkelola lokal yang sama. Mengubahnya pada
  profil terkelola lokal yang berjalan menandai profil tersebut untuk restart/reconcile sehingga
  peluncuran berikutnya menggunakan biner baru.

Perilaku penghentian berbeda berdasarkan mode profil:

- profil terkelola lokal: `openclaw browser stop` menghentikan proses browser yang
  diluncurkan OpenClaw
- profil attach-only dan CDP jarak jauh: `openclaw browser stop` menutup sesi kontrol
  aktif dan melepas override emulasi Playwright/CDP (viewport,
  skema warna, locale, zona waktu, mode offline, dan status serupa), meskipun
  tidak ada proses browser yang diluncurkan oleh OpenClaw

URL CDP jarak jauh dapat menyertakan auth:

- Token kueri (mis., `https://provider.example?token=<token>`)
- Auth HTTP Basic (mis., `https://user:pass@provider.example`)

OpenClaw mempertahankan auth saat memanggil endpoint `/json/*` dan saat tersambung
ke WebSocket CDP. Lebih baik gunakan variabel lingkungan atau pengelola rahasia untuk
token daripada meng-commit-nya ke file konfigurasi.

## Proxy browser Node (default tanpa konfigurasi)

Jika Anda menjalankan **host Node** pada mesin yang memiliki browser Anda, OpenClaw dapat
merutekan otomatis panggilan alat browser ke Node tersebut tanpa konfigurasi browser tambahan.
Ini adalah jalur default untuk Gateway jarak jauh.

Catatan:

- Host Node mengekspos server kontrol browser lokalnya melalui **perintah proxy**.
- Profil berasal dari konfigurasi `browser.profiles` milik Node sendiri (sama seperti lokal).
- `nodeHost.browserProxy.allowProfiles` opsional. Biarkan kosong untuk perilaku legacy/default: semua profil terkonfigurasi tetap dapat dijangkau melalui proxy, termasuk route pembuatan/penghapusan profil.
- Jika Anda mengatur `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas hak istimewa minimum: hanya profil dalam allowlist yang dapat ditargetkan, dan route pembuatan/penghapusan profil persisten diblokir pada permukaan proxy.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Pada Node: `nodeHost.browserProxy.enabled=false`
  - Pada Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP jarak jauh terhosting)

[Browserless](https://browserless.io) adalah layanan Chromium terhosting yang mengekspos
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

- Ganti `<BROWSERLESS_API_KEY>` dengan token Browserless asli Anda.
- Pilih endpoint wilayah yang cocok dengan akun Browserless Anda (lihat dokumentasi mereka).
- Jika Browserless memberi Anda URL dasar HTTPS, Anda dapat mengonversinya ke
  `wss://` untuk koneksi CDP langsung atau mempertahankan URL HTTPS dan membiarkan OpenClaw
  menemukan `/json/version`.

### Browserless Docker pada host yang sama

Ketika Browserless di-self-host dalam Docker dan OpenClaw berjalan pada host, perlakukan
Browserless sebagai layanan CDP yang dikelola eksternal:

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

Alamat dalam `browser.profiles.browserless.cdpUrl` harus dapat dijangkau dari
proses OpenClaw. Browserless juga harus mengiklankan endpoint terjangkau yang cocok;
atur `EXTERNAL` Browserless ke basis WebSocket publik-ke-OpenClaw yang sama, seperti
`ws://127.0.0.1:3000`, `ws://browserless:3000`, atau alamat jaringan Docker privat
yang stabil. Jika `/json/version` mengembalikan `webSocketDebuggerUrl` yang menunjuk ke
alamat yang tidak dapat dijangkau OpenClaw, HTTP CDP dapat terlihat sehat sementara attach
WebSocket tetap gagal.

Jangan biarkan `attachOnly` tidak diatur untuk profil Browserless loopback. Tanpa
`attachOnly`, OpenClaw memperlakukan port loopback sebagai profil browser terkelola lokal
dan mungkin melaporkan bahwa port sedang digunakan tetapi tidak dimiliki oleh OpenClaw.

## Provider CDP WebSocket langsung

Beberapa layanan browser terhosting mengekspos endpoint **WebSocket langsung** alih-alih
penemuan CDP berbasis HTTP standar (`/json/version`). OpenClaw menerima tiga
bentuk URL CDP dan otomatis memilih strategi koneksi yang tepat:

- **Penemuan HTTP(S)** - `http://host[:port]` atau `https://host[:port]`.
  OpenClaw memanggil `/json/version` untuk menemukan URL debugger WebSocket, lalu
  tersambung. Tidak ada fallback WebSocket.
- **Endpoint WebSocket langsung** - `ws://host[:port]/devtools/<kind>/<id>` atau
  `wss://...` dengan jalur `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw tersambung langsung melalui handshake WebSocket dan melewati
  `/json/version` sepenuhnya.
- **Root WebSocket polos** - `ws://host[:port]` atau `wss://host[:port]` tanpa
  jalur `/devtools/...` (mis., [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw mencoba penemuan HTTP
  `/json/version` terlebih dahulu (menormalkan skema ke `http`/`https`);
  jika penemuan mengembalikan `webSocketDebuggerUrl`, URL itu digunakan, jika tidak OpenClaw
  fallback ke handshake WebSocket langsung pada root polos. Jika endpoint
  WebSocket yang diiklankan menolak handshake CDP tetapi root polos yang dikonfigurasi
  menerimanya, OpenClaw juga fallback ke root tersebut. Ini memungkinkan `ws://` polos
  yang diarahkan ke Chrome lokal tetap tersambung, karena Chrome hanya menerima upgrade WebSocket
  pada jalur per-target spesifik dari `/json/version`, sementara provider terhosting
  tetap dapat menggunakan endpoint WebSocket root mereka ketika endpoint penemuan mereka
  mengiklankan URL berumur pendek yang tidak cocok untuk CDP Playwright.

`openclaw browser doctor` menggunakan logika discovery-first, WebSocket-fallback
yang sama seperti attach runtime, sehingga URL root polos yang berhasil tersambung tidak
dilaporkan sebagai tidak dapat dijangkau oleh diagnostik.

### Browserbase

[Browserbase](https://www.browserbase.com) adalah platform cloud untuk menjalankan
browser headless dengan pemecahan CAPTCHA bawaan, mode stealth, dan proxy residensial.

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
  dari [dasbor Ikhtisar](https://www.browserbase.com/overview).
- Ganti `<BROWSERBASE_API_KEY>` dengan kunci API Browserbase Anda yang asli.
- Browserbase otomatis membuat sesi peramban saat koneksi WebSocket, sehingga
  langkah pembuatan sesi manual tidak diperlukan.
- Tingkat gratis mengizinkan satu sesi bersamaan dan satu jam peramban per bulan.
  Lihat [harga](https://www.browserbase.com/pricing) untuk batas paket berbayar.
- Lihat [dokumentasi Browserbase](https://docs.browserbase.com) untuk referensi API
  lengkap, panduan SDK, dan contoh integrasi.

### Notte

[Notte](https://www.notte.cc) adalah platform cloud untuk menjalankan peramban
headless dengan stealth bawaan, proksi residensial, dan gateway WebSocket
native CDP.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Catatan:

- [Daftar](https://console.notte.cc) dan salin **API Key** Anda dari halaman
  pengaturan konsol.
- Ganti `<NOTTE_API_KEY>` dengan kunci API Notte Anda yang asli.
- Notte otomatis membuat sesi peramban saat koneksi WebSocket, sehingga langkah
  pembuatan sesi manual tidak diperlukan. Sesi dihancurkan saat WebSocket
  terputus.
- Tingkat gratis mengizinkan lima sesi bersamaan dan 100 jam peramban seumur
  hidup. Lihat [harga](https://www.notte.cc/#pricing) untuk batas paket berbayar.
- Lihat [dokumentasi Notte](https://docs.notte.cc) untuk referensi API lengkap,
  panduan SDK, dan contoh integrasi.

## Keamanan

Gagasan utama:

- Kontrol peramban hanya local loopback; akses mengalir melalui autentikasi Gateway atau pemasangan Node.
- API HTTP peramban local loopback mandiri menggunakan **autentikasi shared-secret saja**:
  autentikasi bearer token gateway, `x-openclaw-password`, atau autentikasi HTTP Basic dengan
  kata sandi gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"` **tidak**
  mengautentikasi API peramban local loopback mandiri ini.
- Jika kontrol peramban diaktifkan dan tidak ada autentikasi shared-secret yang dikonfigurasi, OpenClaw
  menghasilkan token gateway khusus runtime untuk startup tersebut. Konfigurasikan
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, atau
  `OPENCLAW_GATEWAY_PASSWORD` secara eksplisit jika klien memerlukan secret yang stabil di seluruh
  restart.
- OpenClaw **tidak** otomatis menghasilkan token tersebut saat `gateway.auth.mode` sudah
  `password`, `none`, atau `trusted-proxy`.
- Simpan Gateway dan host Node apa pun di jaringan privat (Tailscale); hindari paparan publik.
- Perlakukan URL/token CDP jarak jauh sebagai secret; utamakan env vars atau secrets manager.

Tips CDP jarak jauh:

- Utamakan endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek jika memungkinkan.
- Hindari menyematkan token berumur panjang langsung di file konfigurasi.

## Profil (multi-peramban)

OpenClaw mendukung beberapa profil bernama (konfigurasi routing). Profil dapat berupa:

- **dikelola openclaw**: instance peramban berbasis Chromium khusus dengan direktori data pengguna + port CDP sendiri
- **jarak jauh**: URL CDP eksplisit (peramban berbasis Chromium yang berjalan di tempat lain)
- **sesi yang sudah ada**: profil Chrome Anda yang sudah ada melalui koneksi otomatis Chrome DevTools MCP

Default:

- Profil `openclaw` otomatis dibuat jika tidak ada.
- Profil `user` adalah bawaan untuk attach sesi yang sudah ada Chrome MCP.
- Profil sesi yang sudah ada bersifat opt-in selain `user`; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800-18899** secara default.
- Menghapus profil memindahkan direktori data lokalnya ke Sampah.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Sesi yang sudah ada melalui Chrome DevTools MCP

OpenClaw juga dapat attach ke profil peramban berbasis Chromium yang sedang berjalan melalui
server resmi Chrome DevTools MCP. Ini menggunakan kembali tab dan status login
yang sudah terbuka di profil peramban tersebut.

Referensi latar belakang dan penyiapan resmi:

- [Chrome for Developers: Gunakan Chrome DevTools MCP dengan sesi peramban Anda](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan:

- `user`

Opsional: buat profil sesi yang sudah ada kustom milik Anda sendiri jika Anda menginginkan
nama, warna, atau direktori data peramban yang berbeda.

Perilaku default:

- Profil bawaan `user` menggunakan koneksi otomatis Chrome MCP, yang menargetkan
  profil Google Chrome lokal default.

Gunakan `userDataDir` untuk Brave, Edge, Chromium, atau profil Chrome non-default.
`~` diperluas menjadi direktori home OS Anda:

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
3. Biarkan peramban tetap berjalan dan setujui prompt koneksi saat OpenClaw attach.

Halaman inspeksi umum:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Uji smoke pemasangan live:

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
- `tabs` mencantumkan tab browser Anda yang sudah terbuka
- `snapshot` mengembalikan ref dari tab live yang dipilih

Yang perlu diperiksa jika pemasangan tidak berfungsi:

- browser target berbasis Chromium adalah versi `144+`
- debugging jarak jauh diaktifkan di halaman inspeksi browser tersebut
- browser menampilkan prompt persetujuan pemasangan dan Anda menerimanya
- jika Chrome dimulai dengan `--remote-debugging-port` eksplisit, atur
  `browser.profiles.<name>.cdpUrl` ke endpoint DevTools tersebut alih-alih bergantung
  pada koneksi otomatis Chrome MCP
- `openclaw doctor` memigrasikan konfigurasi browser lama berbasis ekstensi dan memeriksa bahwa
  Chrome terinstal secara lokal untuk profil koneksi otomatis default, tetapi tidak dapat
  mengaktifkan debugging jarak jauh sisi browser untuk Anda

Penggunaan agen:

- Gunakan `profile="user"` saat Anda membutuhkan status browser pengguna yang sudah login.
- Jika Anda menggunakan profil kustom sesi yang sudah ada, teruskan nama profil eksplisit tersebut.
- Pilih mode ini hanya saat pengguna berada di depan komputer untuk menyetujui prompt
  pemasangan.
- Gateway atau host node dapat menjalankan `npx chrome-devtools-mcp@latest --autoConnect`

Catatan:

- Jalur ini lebih berisiko daripada profil `openclaw` yang terisolasi karena dapat
  bertindak di dalam sesi browser Anda yang sudah login.
- OpenClaw tidak meluncurkan browser untuk driver ini; OpenClaw hanya memasang.
- OpenClaw menggunakan alur resmi Chrome DevTools MCP `--autoConnect` di sini. Jika
  `userDataDir` diatur, nilai tersebut diteruskan untuk menargetkan direktori data pengguna itu.
- Sesi yang sudah ada dapat dipasang pada host yang dipilih atau melalui
  browser node yang terhubung. Jika Chrome berada di tempat lain dan tidak ada browser node yang terhubung, gunakan
  CDP jarak jauh atau host node sebagai gantinya.

### Peluncuran Chrome MCP kustom

Timpa server Chrome DevTools MCP yang dijalankan per profil ketika alur default
`npx chrome-devtools-mcp@latest` bukan yang Anda inginkan (host offline,
versi yang dipin, biner yang diventor):

| Bidang       | Fungsinya                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executable yang dijalankan alih-alih `npx`. Diselesaikan apa adanya; path absolut dihormati.                              |
| `mcpArgs`    | Larik argumen yang diteruskan verbatim ke `mcpCommand`. Menggantikan argumen default `chrome-devtools-mcp@latest --autoConnect`. |

Ketika `cdpUrl` diatur pada profil sesi yang sudah ada, OpenClaw melewati
`--autoConnect` dan meneruskan endpoint ke Chrome MCP secara otomatis:

- `http(s)://...` → `--browserUrl <url>` (endpoint penemuan HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP langsung).

Flag endpoint dan `userDataDir` tidak dapat digabungkan: ketika `cdpUrl` diatur,
`userDataDir` diabaikan untuk peluncuran Chrome MCP, karena Chrome MCP memasang ke
browser yang sedang berjalan di balik endpoint, bukan membuka direktori
profil.

<Accordion title="Existing-session feature limitations">

Dibandingkan dengan profil `openclaw` terkelola, driver sesi yang sudah ada lebih terbatas:

- **Tangkapan layar** - pengambilan halaman dan pengambilan elemen `--ref` berfungsi; selector CSS `--element` tidak. `--full-page` tidak dapat digabungkan dengan `--ref` atau `--element`. Playwright tidak diperlukan untuk tangkapan layar halaman atau elemen berbasis ref.
- **Tindakan** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan ref snapshot (tanpa selector CSS). `click-coords` mengklik koordinat viewport yang terlihat dan tidak memerlukan ref snapshot. `click` hanya tombol kiri. `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`. `press` tidak mendukung `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, dan `evaluate` tidak mendukung timeout per panggilan. `select` menerima satu nilai.
- **Tunggu / unggah / dialog** - `wait --url` mendukung pola persis, substring, dan glob; `wait --load networkidle` tidak didukung pada profil sesi yang sudah ada (berfungsi pada profil terkelola dan profil CDP mentah/jarak jauh). Hook unggah memerlukan `ref` atau `inputRef`, satu file setiap kali, tanpa CSS `element`. Hook dialog tidak mendukung penggantian timeout atau `dialogId`.
- **Visibilitas dialog** - Respons tindakan browser terkelola menyertakan `blockedByDialog` dan `browserState.dialogs.pending` saat suatu tindakan membuka dialog modal; snapshot juga menyertakan status dialog tertunda. Respons dengan `browser dialog --accept/--dismiss --dialog-id <id>` saat dialog tertunda. Dialog yang ditangani di luar OpenClaw muncul di bawah `browserState.dialogs.recent`.
- **Fitur khusus terkelola** - tindakan batch, ekspor PDF, intersepsi unduhan, dan `responsebody` masih memerlukan jalur browser terkelola.

</Accordion>

## Jaminan isolasi

- **Direktori data pengguna khusus**: tidak pernah menyentuh profil browser pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah benturan dengan alur kerja pengembangan.
- **Kontrol tab deterministik**: `tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu
  handle `tabId` stabil seperti `t1`, label opsional, dan `targetId` mentah.
  Agen harus menggunakan ulang `suggestedTargetId`; id mentah tetap tersedia untuk
  debugging dan kompatibilitas.

## Pemilihan browser

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
  `/usr/lib/chromium-browser`, ditambah Chromium yang dikelola Playwright di bawah
  `PLAYWRIGHT_BROWSERS_PATH` atau `~/.cache/ms-playwright`.
- Windows: memeriksa lokasi instalasi umum.

## API kontrol (opsional)

Untuk skrip dan debugging, Gateway mengekspos **API kontrol HTTP khusus loopback
saja** yang kecil plus CLI `openclaw browser` yang sesuai (snapshot, ref, peningkatan
wait, output JSON, alur kerja debug). Lihat
[API kontrol browser](/id/tools/browser-control) untuk referensi lengkap.

## Pemecahan masalah

Untuk masalah khusus Linux (terutama snap Chromium), lihat
[Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting).

Untuk penyiapan split-host WSL2 Gateway + Windows Chrome, lihat
[Pemecahan masalah WSL2 + Windows + remote Chrome CDP](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Kegagalan startup CDP vs blok SSRF navigasi

Ini adalah kelas kegagalan yang berbeda dan mengarah ke jalur kode yang berbeda.

- **Kegagalan startup atau kesiapan CDP** berarti OpenClaw tidak dapat memastikan bahwa control plane browser sehat.
- **Blok SSRF navigasi** berarti control plane browser sehat, tetapi target navigasi halaman ditolak oleh kebijakan.

Contoh umum:

- Kegagalan startup atau kesiapan CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` saat layanan CDP eksternal loopback
    dikonfigurasi tanpa `attachOnly: true`
- Blok SSRF navigasi:
  - Alur `open`, `navigate`, snapshot, atau pembukaan tab gagal dengan kesalahan kebijakan browser/jaringan sementara `start` dan `tabs` masih berfungsi

Gunakan urutan minimal ini untuk membedakan keduanya:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cara membaca hasilnya:

- Jika `start` gagal dengan `not reachable after start`, pecahkan masalah kesiapan CDP terlebih dahulu.
- Jika `start` berhasil tetapi `tabs` gagal, control plane masih tidak sehat. Perlakukan ini sebagai masalah keterjangkauan CDP, bukan masalah navigasi halaman.
- Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane browser sudah aktif dan kegagalannya ada pada kebijakan navigasi atau halaman target.
- Jika `start`, `tabs`, dan `open` semuanya berhasil, jalur kontrol dasar browser terkelola sehat.

Detail perilaku penting:

- Konfigurasi browser secara default menggunakan objek kebijakan SSRF fail-closed meskipun Anda tidak mengonfigurasi `browser.ssrfPolicy`.
- Untuk profil terkelola `openclaw` local loopback, pemeriksaan kesehatan CDP sengaja melewati penerapan keterjangkauan SSRF browser untuk control plane lokal milik OpenClaw sendiri.
- Perlindungan navigasi terpisah. Hasil `start` atau `tabs` yang berhasil tidak berarti target `open` atau `navigate` berikutnya diizinkan.

Panduan keamanan:

- Jangan **mengendurkan** kebijakan SSRF browser secara default.
- Lebih pilih pengecualian host yang sempit seperti `hostnameAllowlist` atau `allowedHostnames` daripada akses jaringan privat yang luas.
- Gunakan `dangerouslyAllowPrivateNetwork: true` hanya di lingkungan tepercaya yang disengaja, tempat akses browser ke jaringan privat diperlukan dan telah ditinjau.

## Alat agen + cara kerja kontrol

Agen mendapatkan **satu alat** untuk otomasi browser:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cara pemetaannya:

- `browser snapshot` mengembalikan pohon UI yang stabil (AI atau ARIA).
- `browser act` menggunakan ID `ref` snapshot untuk mengeklik/mengetik/menyeret/memilih.
- `browser screenshot` menangkap piksel (halaman penuh, elemen, atau refs berlabel).
- `browser doctor` memeriksa kesiapan Gateway, plugin, profil, browser, dan tab.
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP jarak jauh).
  - `target` (`sandbox` | `host` | `node`) untuk memilih tempat browser berada.
  - Dalam sesi bersandbox, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` dihilangkan: sesi bersandbox secara default menggunakan `sandbox`, sesi non-sandbox secara default menggunakan `host`.
  - Jika node berkemampuan browser terhubung, alat dapat melakukan perutean otomatis ke sana kecuali Anda menetapkan `target="host"` atau `target="node"`.

Ini menjaga agen tetap deterministik dan menghindari selector yang rapuh.

## Terkait

- [Ikhtisar Alat](/id/tools) - semua alat agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) - kontrol browser di lingkungan bersandbox
- [Keamanan](/id/gateway/security) - risiko dan pengerasan kontrol browser
