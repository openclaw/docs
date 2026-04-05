---
read_when:
    - Menambahkan otomatisasi browser yang dikendalikan agen
    - Men-debug mengapa openclaw mengganggu Chrome Anda sendiri
    - Mengimplementasikan pengaturan + siklus hidup browser di aplikasi macOS
summary: Layanan kontrol browser terintegrasi + perintah tindakan
title: Browser (dikelola OpenClaw)
x-i18n:
    generated_at: "2026-04-05T14:08:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a41162efd397ea918469e16aa67e554bcbb517b3112df1d3e7927539b6a0926a
    source_path: tools/browser.md
    workflow: 15
---

# Browser (dikelola openclaw)

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan agen.
Profil ini terisolasi dari browser pribadi Anda dan dikelola melalui layanan kontrol
lokal kecil di dalam Gateway (hanya loopback).

Tampilan pemula:

- Anggap ini sebagai **browser terpisah, khusus agen**.
- Profil `openclaw` **tidak** menyentuh profil browser pribadi Anda.
- Agen dapat **membuka tab, membaca halaman, mengeklik, dan mengetik** di jalur yang aman.
- Profil bawaan `user` terhubung ke sesi Chrome asli Anda yang sudah login melalui Chrome MCP.

## Yang Anda dapatkan

- Profil browser terpisah bernama **openclaw** (aksen oranye secara default).
- Kontrol tab deterministik (daftar/buka/fokus/tutup).
- Tindakan agen (klik/ketik/seret/pilih), snapshot, tangkapan layar, PDF.
- Dukungan multi-profil opsional (`openclaw`, `work`, `remote`, ...).

Browser ini **bukan** browser harian Anda. Ini adalah permukaan yang aman dan terisolasi untuk
otomatisasi dan verifikasi agen.

## Mulai cepat

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jika Anda mendapatkan “Browser disabled”, aktifkan di config (lihat di bawah) dan mulai ulang
Gateway.

Jika `openclaw browser` sama sekali tidak ada, atau agen mengatakan tool browser
tidak tersedia, lompat ke [Perintah atau tool browser hilang](/tools/browser#missing-browser-command-or-tool).

## Kontrol plugin

Tool `browser` default sekarang adalah plugin bawaan yang dikirim dalam keadaan aktif secara
default. Artinya Anda dapat menonaktifkan atau menggantinya tanpa menghapus seluruh
sistem plugin OpenClaw:

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

Nonaktifkan plugin bawaan sebelum memasang plugin lain yang menyediakan
nama tool `browser` yang sama. Pengalaman browser default memerlukan keduanya:

- `plugins.entries.browser.enabled` tidak dinonaktifkan
- `browser.enabled=true`

Jika Anda hanya mematikan plugin, CLI browser bawaan (`openclaw browser`),
metode gateway (`browser.request`), tool agen, dan layanan kontrol browser
default semuanya hilang bersama-sama. Config `browser.*` Anda tetap utuh agar dapat digunakan kembali oleh plugin pengganti.

Plugin browser bawaan juga sekarang memiliki implementasi runtime browser.
Core hanya menyimpan helper Plugin SDK bersama ditambah compatibility re-exports untuk
jalur impor internal lama. Dalam praktiknya, menghapus atau mengganti paket plugin browser
menghapus set fitur browser alih-alih menyisakan runtime kedua milik core.

Perubahan config browser tetap memerlukan restart Gateway agar plugin bawaan
dapat mendaftarkan ulang layanan browsernya dengan pengaturan baru.

## Perintah atau tool browser hilang

Jika `openclaw browser` tiba-tiba menjadi perintah yang tidak dikenal setelah upgrade, atau
agen melaporkan bahwa tool browser hilang, penyebab yang paling umum adalah
daftar `plugins.allow` yang ketat dan tidak menyertakan `browser`.

Contoh config yang rusak:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Perbaiki dengan menambahkan `browser` ke allowlist plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Catatan penting:

- `browser.enabled=true` saja tidak cukup ketika `plugins.allow` disetel.
- `plugins.entries.browser.enabled=true` saja juga tidak cukup ketika `plugins.allow` disetel.
- `tools.alsoAllow: ["browser"]` **tidak** memuat plugin browser bawaan. Itu hanya menyesuaikan kebijakan tool setelah plugin sudah dimuat.
- Jika Anda tidak memerlukan allowlist plugin yang ketat, menghapus `plugins.allow` juga memulihkan perilaku browser bawaan default.

Gejala umum:

- `openclaw browser` adalah perintah yang tidak dikenal.
- `browser.request` hilang.
- Agen melaporkan tool browser tidak tersedia atau hilang.

## Profil: `openclaw` vs `user`

- `openclaw`: browser terkelola dan terisolasi (tidak memerlukan extension).
- `user`: profil attach Chrome MCP bawaan untuk sesi **Chrome asli Anda yang sudah login**.

Untuk pemanggilan tool browser agen:

- Default: gunakan browser `openclaw` yang terisolasi.
- Pilih `profile="user"` saat sesi login yang sudah ada penting dan pengguna
  sedang berada di depan komputer untuk mengeklik/menyetujui prompt attach.
- `profile` adalah override eksplisit saat Anda menginginkan mode browser tertentu.

Setel `browser.defaultProfile: "openclaw"` jika Anda ingin mode terkelola sebagai default.

## Konfigurasi

Pengaturan browser ada di `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default mode jaringan tepercaya
      // allowPrivateNetwork: true, // alias lama
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override profil tunggal lama
    remoteCdpTimeoutMs: 1500, // timeout HTTP CDP jarak jauh (md)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout handshake WebSocket CDP jarak jauh (md)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

Catatan:

- Layanan kontrol browser melakukan bind ke loopback pada port yang diturunkan dari `gateway.port`
  (default: `18791`, yaitu gateway + 2).
- Jika Anda mengoverride port Gateway (`gateway.port` atau `OPENCLAW_GATEWAY_PORT`),
  port browser turunannya bergeser agar tetap berada dalam “keluarga” yang sama.
- `cdpUrl` default ke port CDP lokal yang dikelola saat tidak disetel.
- `remoteCdpTimeoutMs` berlaku untuk pemeriksaan keterjangkauan CDP jarak jauh (bukan loopback).
- `remoteCdpHandshakeTimeoutMs` berlaku untuk pemeriksaan keterjangkauan WebSocket CDP jarak jauh.
- Navigasi browser/buka-tab dilindungi SSRF sebelum navigasi dan diperiksa ulang sebisanya pada URL `http(s)` final setelah navigasi.
- Dalam mode SSRF ketat, penemuan/probe endpoint CDP jarak jauh (`cdpUrl`, termasuk lookup `/json/version`) juga diperiksa.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` default ke `true` (model jaringan tepercaya). Setel ke `false` untuk penelusuran ketat hanya publik.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama untuk kompatibilitas.
- `attachOnly: true` berarti “jangan pernah meluncurkan browser lokal; hanya attach jika browser sudah berjalan.”
- `color` + `color` per profil memberi warna pada UI browser sehingga Anda dapat melihat profil mana yang aktif.
- Profil default adalah `openclaw` (browser mandiri yang dikelola OpenClaw). Gunakan `defaultProfile: "user"` untuk memilih browser pengguna yang sudah login.
- Urutan deteksi otomatis: browser default sistem jika berbasis Chromium; jika tidak maka Chrome → Brave → Edge → Chromium → Chrome Canary.
- Profil `openclaw` lokal mengalokasikan otomatis `cdpPort`/`cdpUrl` — setel itu hanya untuk CDP jarak jauh.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP alih-alih CDP mentah. Jangan
  setel `cdpUrl` untuk driver itu.
- Setel `browser.profiles.<name>.userDataDir` saat profil existing-session
  harus attach ke profil pengguna Chromium non-default seperti Brave atau Edge.

## Gunakan Brave (atau browser berbasis Chromium lainnya)

Jika browser **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll),
OpenClaw menggunakannya secara otomatis. Setel `browser.executablePath` untuk mengoverride
deteksi otomatis:

Contoh CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Kontrol lokal vs jarak jauh

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan browser lokal.
- **Kontrol jarak jauh (host node):** jalankan host node pada mesin yang memiliki browser; Gateway memproksikan tindakan browser ke host itu.
- **CDP jarak jauh:** setel `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  attach ke browser berbasis Chromium jarak jauh. Dalam hal ini, OpenClaw tidak akan meluncurkan browser lokal.

Perilaku penghentian berbeda menurut mode profil:

- profil terkelola lokal: `openclaw browser stop` menghentikan proses browser yang
  diluncurkan OpenClaw
- profil attach-only dan CDP jarak jauh: `openclaw browser stop` menutup sesi
  kontrol aktif dan melepas override emulasi Playwright/CDP (viewport,
  skema warna, locale, timezone, mode offline, dan status serupa), meskipun
  tidak ada proses browser yang diluncurkan oleh OpenClaw

URL CDP jarak jauh dapat menyertakan autentikasi:

- Token query (misalnya, `https://provider.example?token=<token>`)
- Autentikasi HTTP Basic (misalnya, `https://user:pass@provider.example`)

OpenClaw mempertahankan autentikasi saat memanggil endpoint `/json/*` dan saat terhubung
ke CDP WebSocket. Pilih env var atau secrets manager untuk
token alih-alih meng-commit-nya ke file config.

## Proksi browser node (default tanpa config)

Jika Anda menjalankan **host node** di mesin yang memiliki browser Anda, OpenClaw dapat
secara otomatis merutekan panggilan tool browser ke node tersebut tanpa config browser tambahan.
Ini adalah jalur default untuk gateway jarak jauh.

Catatan:

- Host node mengekspos server kontrol browser lokalnya melalui **proxy command**.
- Profil berasal dari config `browser.profiles` milik node sendiri (sama seperti lokal).
- `nodeHost.browserProxy.allowProfiles` bersifat opsional. Biarkan kosong untuk perilaku lama/default: semua profil yang dikonfigurasi tetap dapat dijangkau melalui proksi, termasuk rute buat/hapus profil.
- Jika Anda menyetel `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas least-privilege: hanya profil dalam allowlist yang dapat ditargetkan, dan rute buat/hapus profil persisten diblokir pada permukaan proksi.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Pada node: `nodeHost.browserProxy.enabled=false`
  - Pada gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP jarak jauh terhosting)

[Browserless](https://browserless.io) adalah layanan Chromium terhosting yang mengekspos
URL koneksi CDP melalui HTTPS dan WebSocket. OpenClaw dapat menggunakan keduanya, tetapi
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
- Pilih endpoint region yang sesuai dengan akun Browserless Anda (lihat dokumentasinya).
- Jika Browserless memberi Anda base URL HTTPS, Anda dapat mengubahnya menjadi
  `wss://` untuk koneksi CDP langsung atau tetap menggunakan URL HTTPS dan biarkan OpenClaw
  menemukan `/json/version`.

## Penyedia CDP WebSocket langsung

Beberapa layanan browser terhosting mengekspos endpoint **WebSocket langsung** alih-alih
penemuan CDP berbasis HTTP standar (`/json/version`). OpenClaw mendukung keduanya:

- **Endpoint HTTP(S)** — OpenClaw memanggil `/json/version` untuk menemukan
  URL debugger WebSocket, lalu terhubung.
- **Endpoint WebSocket** (`ws://` / `wss://`) — OpenClaw terhubung langsung,
  melewati `/json/version`. Gunakan ini untuk layanan seperti
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com), atau penyedia mana pun yang memberi Anda
  URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) adalah platform cloud untuk menjalankan
browser headless dengan penyelesaian CAPTCHA bawaan, mode stealth, dan proxy
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
- Ganti `<BROWSERBASE_API_KEY>` dengan kunci API Browserbase asli Anda.
- Browserbase otomatis membuat sesi browser saat koneksi WebSocket dibuka, jadi
  tidak perlu langkah pembuatan sesi manual.
- Tingkat gratis mengizinkan satu sesi bersamaan dan satu jam browser per bulan.
  Lihat [pricing](https://www.browserbase.com/pricing) untuk batas paket berbayar.
- Lihat [dokumentasi Browserbase](https://docs.browserbase.com) untuk referensi API lengkap,
  panduan SDK, dan contoh integrasi.

## Keamanan

Gagasan utama:

- Kontrol browser hanya loopback; akses mengalir melalui autentikasi Gateway atau pairing node.
- API HTTP browser loopback mandiri menggunakan **autentikasi shared-secret saja**:
  autentikasi bearer token gateway, `x-openclaw-password`, atau HTTP Basic auth dengan
  password gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"` **tidak**
  mengautentikasi API browser loopback mandiri ini.
- Jika kontrol browser diaktifkan dan tidak ada autentikasi shared-secret yang dikonfigurasi, OpenClaw
  otomatis membuat `gateway.auth.token` saat startup dan menyimpannya ke config.
- OpenClaw **tidak** otomatis membuat token itu saat `gateway.auth.mode` sudah
  `password`, `none`, atau `trusted-proxy`.
- Simpan Gateway dan host node apa pun di jaringan pribadi (Tailscale); hindari eksposur publik.
- Perlakukan URL/token CDP jarak jauh sebagai rahasia; pilih env var atau secrets manager.

Tips CDP jarak jauh:

- Pilih endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek jika memungkinkan.
- Hindari menyematkan token berumur panjang langsung di file config.

## Profil (multi-browser)

OpenClaw mendukung beberapa profil bernama (routing config). Profil dapat berupa:

- **dikelola openclaw**: instance browser berbasis Chromium khusus dengan direktori data pengguna + port CDP sendiri
- **jarak jauh**: URL CDP eksplisit (browser berbasis Chromium yang berjalan di tempat lain)
- **sesi yang ada**: profil Chrome Anda yang ada melalui koneksi otomatis Chrome DevTools MCP

Default:

- Profil `openclaw` dibuat otomatis jika belum ada.
- Profil `user` bersifat bawaan untuk attach existing-session Chrome MCP.
- Profil existing-session selain `user` bersifat opt-in; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800–18899** secara default.
- Menghapus profil memindahkan direktori data lokalnya ke Trash.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Existing-session melalui Chrome DevTools MCP

OpenClaw juga dapat attach ke profil browser berbasis Chromium yang sedang berjalan melalui
server Chrome DevTools MCP resmi. Ini menggunakan kembali tab dan status login
yang sudah terbuka di profil browser tersebut.

Latar belakang resmi dan referensi penyiapan:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan:

- `user`

Opsional: buat profil existing-session kustom Anda sendiri jika Anda menginginkan
nama, warna, atau direktori data browser yang berbeda.

Perilaku default:

- Profil `user` bawaan menggunakan koneksi otomatis Chrome MCP, yang menargetkan
  profil Google Chrome lokal default.

Gunakan `userDataDir` untuk Brave, Edge, Chromium, atau profil Chrome non-default:

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

Lalu di browser yang sesuai:

1. Buka halaman inspect browser tersebut untuk remote debugging.
2. Aktifkan remote debugging.
3. Biarkan browser tetap berjalan dan setujui prompt koneksi saat OpenClaw attach.

Halaman inspect yang umum:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test attach langsung:

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
- `tabs` menampilkan daftar tab browser Anda yang sudah terbuka
- `snapshot` mengembalikan ref dari tab live yang dipilih

Yang perlu diperiksa jika attach tidak berfungsi:

- browser berbasis Chromium target versinya `144+`
- remote debugging diaktifkan di halaman inspect browser itu
- browser menampilkan prompt persetujuan attach dan Anda menerimanya
- `openclaw doctor` memigrasikan config browser berbasis extension lama dan memeriksa bahwa
  Chrome terpasang secara lokal untuk profil koneksi otomatis default, tetapi tidak dapat
  mengaktifkan remote debugging di sisi browser untuk Anda

Penggunaan agen:

- Gunakan `profile="user"` saat Anda memerlukan status browser pengguna yang sudah login.
- Jika Anda menggunakan profil existing-session kustom, teruskan nama profil eksplisit tersebut.
- Pilih mode ini hanya saat pengguna sedang berada di depan komputer untuk menyetujui
  prompt attach.
- Gateway atau host node dapat menjalankan `npx chrome-devtools-mcp@latest --autoConnect`

Catatan:

- Jalur ini berisiko lebih tinggi daripada profil `openclaw` yang terisolasi karena dapat
  bertindak di dalam sesi browser Anda yang sudah login.
- OpenClaw tidak meluncurkan browser untuk driver ini; OpenClaw hanya attach ke
  sesi yang sudah ada.
- OpenClaw menggunakan alur `--autoConnect` Chrome DevTools MCP resmi di sini. Jika
  `userDataDir` disetel, OpenClaw meneruskannya untuk menargetkan direktori data pengguna
  Chromium eksplisit tersebut.
- Tangkapan layar existing-session mendukung tangkapan halaman dan tangkapan elemen `--ref`
  dari snapshot, tetapi tidak mendukung selector CSS `--element`.
- Tangkapan layar halaman existing-session berfungsi tanpa Playwright melalui Chrome MCP.
  Tangkapan layar elemen berbasis ref (`--ref`) juga berfungsi di sana, tetapi `--full-page`
  tidak dapat digabungkan dengan `--ref` atau `--element`.
- Tindakan existing-session masih lebih terbatas daripada jalur browser terkelola:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan
    ref snapshot alih-alih selector CSS
  - `click` hanya untuk tombol kiri (tanpa override tombol atau modifier)
  - `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`
  - `press` tidak mendukung `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill`, dan `evaluate` tidak
    mendukung override timeout per panggilan
  - `select` saat ini hanya mendukung satu nilai
- Existing-session `wait --url` mendukung pola exact, substring, dan glob
  seperti driver browser lainnya. `wait --load networkidle` belum didukung.
- Hook upload existing-session memerlukan `ref` atau `inputRef`, mendukung satu file
  dalam satu waktu, dan tidak mendukung penargetan CSS `element`.
- Hook dialog existing-session tidak mendukung override timeout.
- Beberapa fitur masih memerlukan jalur browser terkelola, termasuk tindakan batch,
  ekspor PDF, intersepsi download, dan `responsebody`.
- Existing-session bersifat lokal terhadap host. Jika Chrome berada di mesin lain atau namespace jaringan lain, gunakan CDP jarak jauh atau host node.

## Jaminan isolasi

- **Direktori data pengguna khusus**: tidak pernah menyentuh profil browser pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah bentrokan dengan alur kerja dev.
- **Kontrol tab deterministik**: targetkan tab berdasarkan `targetId`, bukan “tab terakhir”.

## Pemilihan browser

Saat meluncurkan secara lokal, OpenClaw memilih yang pertama tersedia:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Anda dapat mengoverride dengan `browser.executablePath`.

Platform:

- macOS: memeriksa `/Applications` dan `~/Applications`.
- Linux: mencari `google-chrome`, `brave`, `microsoft-edge`, `chromium`, dll.
- Windows: memeriksa lokasi instalasi umum.

## API Kontrol (opsional)

Hanya untuk integrasi lokal, Gateway mengekspos API HTTP loopback kecil:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/tangkapan layar: `GET /snapshot`, `POST /screenshot`
- Tindakan: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Download: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Jaringan: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Pengaturan: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Semua endpoint menerima `?profile=<name>`.

Jika autentikasi gateway shared-secret dikonfigurasi, rute HTTP browser juga memerlukan autentikasi:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` atau HTTP Basic auth dengan password tersebut

Catatan:

- API browser loopback mandiri ini **tidak** menggunakan header trusted-proxy atau
  identitas Tailscale Serve.
- Jika `gateway.auth.mode` adalah `none` atau `trusted-proxy`, rute browser loopback ini
  tidak mewarisi mode pembawa identitas tersebut; tetap pertahankan hanya loopback.

### Persyaratan Playwright

Beberapa fitur (navigate/act/snapshot AI/role snapshot, tangkapan layar elemen,
PDF) memerlukan Playwright. Jika Playwright tidak terpasang, endpoint tersebut mengembalikan
error 501 yang jelas.

Yang tetap berfungsi tanpa Playwright:

- Snapshot ARIA
- Tangkapan layar halaman untuk browser `openclaw` terkelola saat tersedia
  WebSocket CDP per tab
- Tangkapan layar halaman untuk profil `existing-session` / Chrome MCP
- Tangkapan layar existing-session berbasis ref (`--ref`) dari output snapshot

Yang masih memerlukan Playwright:

- `navigate`
- `act`
- Snapshot AI / role snapshot
- Tangkapan layar elemen selector CSS (`--element`)
- Ekspor PDF browser penuh

Tangkapan layar elemen juga menolak `--full-page`; rute mengembalikan `fullPage is
not supported for element screenshots`.

Jika Anda melihat `Playwright is not available in this gateway build`, instal paket
Playwright penuh (bukan `playwright-core`) dan mulai ulang gateway, atau instal ulang
OpenClaw dengan dukungan browser.

#### Instalasi Playwright di Docker

Jika Gateway Anda berjalan di Docker, hindari `npx playwright` (konflik override npm).
Gunakan CLI bawaan sebagai gantinya:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Untuk mempertahankan download browser, setel `PLAYWRIGHT_BROWSERS_PATH` (misalnya,
`/home/node/.cache/ms-playwright`) dan pastikan `/home/node` dipertahankan melalui
`OPENCLAW_HOME_VOLUME` atau bind mount. Lihat [Docker](/id/install/docker).

## Cara kerjanya (internal)

Alur tingkat tinggi:

- Sebuah **server kontrol** kecil menerima permintaan HTTP.
- Server ini terhubung ke browser berbasis Chromium (Chrome/Brave/Edge/Chromium) melalui **CDP**.
- Untuk tindakan lanjutan (klik/ketik/snapshot/PDF), server ini menggunakan **Playwright** di atas
  CDP.
- Saat Playwright tidak tersedia, hanya operasi non-Playwright yang tersedia.

Desain ini menjaga agen tetap pada antarmuka yang stabil dan deterministik sambil memungkinkan
Anda menukar browser dan profil lokal/jarak jauh.

## Referensi cepat CLI

Semua perintah menerima `--browser-profile <name>` untuk menargetkan profil tertentu.
Semua perintah juga menerima `--json` untuk output yang dapat dibaca mesin (payload stabil).

Dasar:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspeksi:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Catatan siklus hidup:

- Untuk profil attach-only dan CDP jarak jauh, `openclaw browser stop` tetap
  merupakan perintah pembersihan yang tepat setelah pengujian. Ini menutup sesi kontrol aktif dan
  membersihkan override emulasi sementara alih-alih mematikan browser
  dasarnya.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Tindakan:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Status:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Catatan:

- `upload` dan `dialog` adalah panggilan **arming**; jalankan keduanya sebelum klik/tekan
  yang memicu chooser/dialog.
- Jalur output download dan trace dibatasi ke root temp OpenClaw:
  - trace: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - download: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Jalur upload dibatasi ke root upload temp OpenClaw:
  - upload: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` juga dapat menyetel input file secara langsung melalui `--input-ref` atau `--element`.
- `snapshot`:
  - `--format ai` (default saat Playwright terpasang): mengembalikan snapshot AI dengan ref numerik (`aria-ref="<n>"`).
  - `--format aria`: mengembalikan pohon aksesibilitas (tanpa ref; hanya untuk inspeksi).
  - `--efficient` (atau `--mode efficient`): preset role snapshot ringkas (interactive + compact + depth + maxChars lebih rendah).
  - Default config (hanya tool/CLI): setel `browser.snapshotDefaults.mode: "efficient"` untuk menggunakan snapshot efisien saat pemanggil tidak meneruskan mode (lihat [Konfigurasi gateway](/id/gateway/configuration-reference#browser)).
  - Opsi role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) memaksa role-based snapshot dengan ref seperti `ref=e12`.
  - `--frame "<iframe selector>"` membatasi role snapshot ke iframe (berpasangan dengan role ref seperti `e12`).
  - `--interactive` menghasilkan daftar datar elemen interaktif yang mudah dipilih (terbaik untuk mendorong tindakan).
  - `--labels` menambahkan tangkapan layar khusus viewport dengan label ref yang dioverlay (mencetak `MEDIA:<path>`).
- `click`/`type`/dll memerlukan `ref` dari `snapshot` (baik numerik `12` maupun role ref `e12`).
  Selector CSS sengaja tidak didukung untuk tindakan.

## Snapshot dan ref

OpenClaw mendukung dua gaya “snapshot”:

- **Snapshot AI (ref numerik)**: `openclaw browser snapshot` (default; `--format ai`)
  - Output: snapshot teks yang menyertakan ref numerik.
  - Tindakan: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Secara internal, ref diresolusikan melalui `aria-ref` milik Playwright.

- **Role snapshot (role ref seperti `e12`)**: `openclaw browser snapshot --interactive` (atau `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: daftar/pohon berbasis role dengan `[ref=e12]` (dan opsional `[nth=1]`).
  - Tindakan: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Secara internal, ref diresolusikan melalui `getByRole(...)` (ditambah `nth()` untuk duplikat).
  - Tambahkan `--labels` untuk menyertakan tangkapan layar viewport dengan label `e12` yang dioverlay.

Perilaku ref:

- Ref **tidak stabil antar navigasi**; jika sesuatu gagal, jalankan ulang `snapshot` dan gunakan ref baru.
- Jika role snapshot diambil dengan `--frame`, role ref dibatasi ke iframe tersebut sampai role snapshot berikutnya.

## Peningkatan `wait`

Anda dapat menunggu lebih dari sekadar waktu/teks:

- Tunggu URL (glob didukung oleh Playwright):
  - `openclaw browser wait --url "**/dash"`
- Tunggu status load:
  - `openclaw browser wait --load networkidle`
- Tunggu predikat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Tunggu selector menjadi terlihat:
  - `openclaw browser wait "#main"`

Ini dapat digabungkan:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Alur kerja debugging

Saat tindakan gagal (misalnya “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Gunakan `click <ref>` / `type <ref>` (pilih role ref dalam mode interactive)
3. Jika masih gagal: `openclaw browser highlight <ref>` untuk melihat apa yang ditargetkan Playwright
4. Jika halaman berperilaku aneh:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Untuk debugging mendalam: rekam trace:
   - `openclaw browser trace start`
   - reproduksi masalahnya
   - `openclaw browser trace stop` (mencetak `TRACE:<path>`)

## Output JSON

`--json` ditujukan untuk skrip dan tool terstruktur.

Contoh:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshot dalam JSON menyertakan `refs` plus blok `stats` kecil (lines/chars/refs/interactive) agar tool dapat menalar ukuran dan kepadatan payload.

## Kenop status dan environment

Ini berguna untuk alur kerja “buat situs berperilaku seperti X”:

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` tetap didukung)
- HTTP basic auth: `set credentials user pass` (atau `--clear`)
- Geolokasi: `set geo <lat> <lon> --origin "https://example.com"` (atau `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (preset perangkat Playwright)
  - `set viewport 1280 720`

## Keamanan & privasi

- Profil browser openclaw dapat berisi sesi yang sudah login; perlakukan sebagai sesuatu yang sensitif.
- `browser act kind=evaluate` / `openclaw browser evaluate` dan `wait --fn`
  mengeksekusi JavaScript arbitrer dalam konteks halaman. Prompt injection dapat
  mengarahkan ini. Nonaktifkan dengan `browser.evaluateEnabled=false` jika Anda tidak membutuhkannya.
- Untuk login dan catatan anti-bot (X/Twitter, dll.), lihat [Login browser + posting X/Twitter](/tools/browser-login).
- Simpan Gateway/host node tetap privat (hanya loopback atau tailnet).
- Endpoint CDP jarak jauh sangat kuat; tunnel dan lindungi endpoint tersebut.

Contoh mode ketat (blokir tujuan privat/internal secara default):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // exact allow opsional
    },
  },
}
```

## Pemecahan masalah

Untuk masalah khusus Linux (terutama snap Chromium), lihat
[Pemecahan masalah browser](/tools/browser-linux-troubleshooting).

Untuk penyiapan host-terpisah WSL2 Gateway + Chrome Windows, lihat
[Pemecahan masalah WSL2 + Windows + CDP Chrome jarak jauh](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Tool agen + cara kerja kontrol

Agen mendapatkan **satu tool** untuk otomatisasi browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Pemetaan kerjanya:

- `browser snapshot` mengembalikan pohon UI yang stabil (AI atau ARIA).
- `browser act` menggunakan ID `ref` dari snapshot untuk klik/ketik/seret/pilih.
- `browser screenshot` menangkap piksel (halaman penuh atau elemen).
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP jarak jauh).
  - `target` (`sandbox` | `host` | `node`) untuk memilih tempat browser berada.
  - Dalam sesi sandboxed, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` dihilangkan: sesi sandboxed default ke `sandbox`, sesi non-sandbox default ke `host`.
  - Jika node yang mendukung browser terhubung, tool dapat otomatis diarahkan ke node itu kecuali Anda mengunci `target="host"` atau `target="node"`.

Ini menjaga agen tetap deterministik dan menghindari selector yang rapuh.

## Terkait

- [Ikhtisar Tools](/tools) — semua tool agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) — kontrol browser dalam environment sandboxed
- [Keamanan](/id/gateway/security) — risiko kontrol browser dan hardening
