---
read_when:
    - Menambahkan otomatisasi browser yang dikendalikan agen
    - Men-debug mengapa openclaw mengganggu Chrome Anda sendiri
    - Mengimplementasikan pengaturan browser + lifecycle di aplikasi macOS
summary: Layanan kontrol browser terintegrasi + perintah tindakan
title: Browser (dikelola OpenClaw)
x-i18n:
    generated_at: "2026-04-24T09:29:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan agen.
Profil ini terisolasi dari browser pribadi Anda dan dikelola melalui layanan kontrol
lokal kecil di dalam Gateway (hanya loopback).

Tampilan untuk pemula:

- Anggap ini sebagai **browser terpisah khusus agen**.
- Profil `openclaw` **tidak** menyentuh profil browser pribadi Anda.
- Agen dapat **membuka tab, membaca halaman, mengklik, dan mengetik** di jalur yang aman.
- Profil `user` bawaan menempel ke sesi Chrome Anda yang sebenarnya dan sudah login melalui Chrome MCP.

## Yang Anda dapatkan

- Profil browser terpisah bernama **openclaw** (aksen oranye secara default).
- Kontrol tab yang deterministik (list/open/focus/close).
- Tindakan agen (click/type/drag/select), snapshot, screenshot, PDF.
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

Jika Anda mendapatkan “Browser disabled”, aktifkan di konfigurasi (lihat di bawah) dan restart
Gateway.

Jika `openclaw browser` sama sekali tidak ada, atau agen mengatakan alat browser
tidak tersedia, lompat ke [Perintah atau alat browser hilang](/id/tools/browser#missing-browser-command-or-tool).

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

Perubahan konfigurasi browser memerlukan restart Gateway agar Plugin dapat mendaftarkan ulang layanannya.

## Perintah atau alat browser hilang

Jika `openclaw browser` tidak dikenal setelah upgrade, `browser.request` hilang, atau agen melaporkan alat browser tidak tersedia, penyebab biasanya adalah daftar `plugins.allow` yang tidak menyertakan `browser`. Tambahkan:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true`, dan `tools.alsoAllow: ["browser"]` tidak menggantikan keanggotaan allowlist — allowlist mengendalikan pemuatan Plugin, dan kebijakan alat hanya berjalan setelah pemuatan. Menghapus `plugins.allow` sepenuhnya juga memulihkan default.

## Profil: `openclaw` vs `user`

- `openclaw`: browser terkelola dan terisolasi (tanpa ekstensi tambahan).
- `user`: profil attach Chrome MCP bawaan untuk sesi **Chrome nyata Anda yang sudah login**.

Untuk pemanggilan alat browser oleh agen:

- Default: gunakan browser `openclaw` yang terisolasi.
- Utamakan `profile="user"` ketika sesi login yang sudah ada penting dan pengguna
  sedang berada di komputer untuk mengklik/menyetujui prompt attach.
- `profile` adalah override eksplisit ketika Anda menginginkan mode browser tertentu.

Atur `browser.defaultProfile: "openclaw"` jika Anda ingin mode terkelola secara default.

## Konfigurasi

Pengaturan browser berada di `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in hanya untuk akses private-network tepercaya
      // allowPrivateNetwork: true, // alias lama
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override profil tunggal lama
    remoteCdpTimeoutMs: 1500, // timeout HTTP CDP jarak jauh (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout handshake WebSocket CDP jarak jauh (ms)
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

<AccordionGroup>

<Accordion title="Port dan keterjangkauan">

- Layanan kontrol bind ke loopback pada port yang diturunkan dari `gateway.port` (default `18791` = gateway + 2). Mengoverride `gateway.port` atau `OPENCLAW_GATEWAY_PORT` menggeser port turunan dalam keluarga yang sama.
- Profil `openclaw` lokal menetapkan `cdpPort`/`cdpUrl` otomatis; atur itu hanya untuk CDP jarak jauh. `cdpUrl` default ke port CDP lokal terkelola saat tidak diatur.
- `remoteCdpTimeoutMs` berlaku untuk pemeriksaan keterjangkauan HTTP CDP jarak jauh (non-loopback); `remoteCdpHandshakeTimeoutMs` berlaku untuk handshake WebSocket CDP jarak jauh.

</Accordion>

<Accordion title="Kebijakan SSRF">

- Navigasi browser dan open-tab dijaga SSRF sebelum navigasi dan diperiksa ulang secara best-effort pada URL `http(s)` final sesudahnya.
- Dalam mode SSRF ketat, discovery endpoint CDP jarak jauh dan probe `/json/version` (`cdpUrl`) juga diperiksa.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` nonaktif secara default; aktifkan hanya ketika akses browser private-network memang tepercaya.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.

</Accordion>

<Accordion title="Perilaku profil">

- `attachOnly: true` berarti jangan pernah meluncurkan browser lokal; hanya attach jika browser sudah berjalan.
- `color` (tingkat atas dan per profil) memberi tint pada UI browser sehingga Anda dapat melihat profil mana yang aktif.
- Profil default adalah `openclaw` (standalone terkelola). Gunakan `defaultProfile: "user"` untuk memilih browser pengguna yang sudah login.
- Urutan deteksi otomatis: browser default sistem jika berbasis Chromium; jika tidak Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP alih-alih CDP mentah. Jangan atur `cdpUrl` untuk driver tersebut.
- Atur `browser.profiles.<name>.userDataDir` ketika profil existing-session perlu attach ke profil pengguna Chromium non-default (Brave, Edge, dll.).

</Accordion>

</AccordionGroup>

## Gunakan Brave (atau browser berbasis Chromium lainnya)

Jika browser **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll),
OpenClaw menggunakannya secara otomatis. Atur `browser.executablePath` untuk mengoverride
deteksi otomatis:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
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

## Kontrol lokal vs jarak jauh

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan browser lokal.
- **Kontrol jarak jauh (host Node):** jalankan host Node di mesin yang memiliki browser; Gateway mem-proxy tindakan browser ke sana.
- **CDP jarak jauh:** atur `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  attach ke browser berbasis Chromium jarak jauh. Dalam hal ini, OpenClaw tidak akan meluncurkan browser lokal.

Perilaku penghentian berbeda menurut mode profil:

- profil lokal terkelola: `openclaw browser stop` menghentikan proses browser yang
  diluncurkan OpenClaw
- profil attach-only dan CDP jarak jauh: `openclaw browser stop` menutup sesi
  kontrol aktif dan melepaskan override emulasi Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode, dan state serupa), meskipun
  tidak ada proses browser yang diluncurkan oleh OpenClaw

URL CDP jarak jauh dapat menyertakan auth:

- Token query (mis. `https://provider.example?token=<token>`)
- HTTP Basic auth (mis. `https://user:pass@provider.example`)

OpenClaw mempertahankan auth saat memanggil endpoint `/json/*` dan saat terhubung
ke CDP WebSocket. Utamakan environment variable atau secret manager untuk
token alih-alih meng-commit-nya ke file konfigurasi.

## Proxy browser Node (default tanpa konfigurasi)

Jika Anda menjalankan **host Node** di mesin yang memiliki browser, OpenClaw dapat
merutekan otomatis pemanggilan alat browser ke Node itu tanpa konfigurasi browser tambahan.
Ini adalah jalur default untuk gateway jarak jauh.

Catatan:

- Host Node mengekspos layanan kontrol browser lokalnya melalui **perintah proxy**.
- Profil berasal dari konfigurasi `browser.profiles` milik Node itu sendiri (sama seperti lokal).
- `nodeHost.browserProxy.allowProfiles` bersifat opsional. Biarkan kosong untuk perilaku lama/default: semua profil yang dikonfigurasi tetap dapat dijangkau melalui proxy, termasuk rute create/delete profil.
- Jika Anda mengatur `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas least-privilege: hanya profil yang ada di allowlist yang dapat ditargetkan, dan rute create/delete profil persisten diblokir pada permukaan proxy.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Di node: `nodeHost.browserProxy.enabled=false`
  - Di gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP jarak jauh terhosting)

[Browserless](https://browserless.io) adalah layanan Chromium terhosting yang mengekspos
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
- Pilih endpoint region yang sesuai dengan akun Browserless Anda (lihat dokumen mereka).
- Jika Browserless memberi Anda base URL HTTPS, Anda dapat mengubahnya menjadi
  `wss://` untuk koneksi CDP langsung atau mempertahankan URL HTTPS dan membiarkan OpenClaw
  menemukan `/json/version`.

## Provider CDP WebSocket langsung

Beberapa layanan browser terhosting mengekspos endpoint **WebSocket** langsung alih-alih
discovery CDP berbasis HTTP standar (`/json/version`). OpenClaw menerima tiga
bentuk URL CDP dan memilih strategi koneksi yang tepat secara otomatis:

- **Discovery HTTP(S)** — `http://host[:port]` atau `https://host[:port]`.
  OpenClaw memanggil `/json/version` untuk menemukan URL debugger WebSocket, lalu
  terhubung. Tidak ada fallback WebSocket.
- **Endpoint WebSocket langsung** — `ws://host[:port]/devtools/<kind>/<id>` atau
  `wss://...` dengan path `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw terhubung langsung melalui handshake WebSocket dan melewati
  `/json/version` sepenuhnya.
- **Root WebSocket polos** — `ws://host[:port]` atau `wss://host[:port]` tanpa
  path `/devtools/...` (mis. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw mencoba discovery HTTP
  `/json/version` terlebih dahulu (menormalisasi skema ke `http`/`https`);
  jika discovery mengembalikan `webSocketDebuggerUrl`, URL itu digunakan, jika tidak OpenClaw
  fallback ke handshake WebSocket langsung pada root polos. Ini memungkinkan
  `ws://` polos yang diarahkan ke Chrome lokal tetap terhubung, karena Chrome hanya
  menerima upgrade WebSocket pada path spesifik per-target dari
  `/json/version`.

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
- Ganti `<BROWSERBASE_API_KEY>` dengan API key Browserbase asli Anda.
- Browserbase otomatis membuat sesi browser saat koneksi WebSocket, jadi
  tidak diperlukan langkah pembuatan sesi manual.
- Tingkat gratis mengizinkan satu sesi bersamaan dan satu jam browser per bulan.
  Lihat [pricing](https://www.browserbase.com/pricing) untuk batas paket berbayar.
- Lihat [dokumen Browserbase](https://docs.browserbase.com) untuk referensi API
  lengkap, panduan SDK, dan contoh integrasi.

## Keamanan

Gagasan utama:

- Kontrol browser hanya loopback; akses mengalir melalui auth Gateway atau pairing Node.
- API HTTP browser loopback standalone hanya menggunakan **auth shared-secret**:
  auth bearer token gateway, `x-openclaw-password`, atau HTTP Basic auth dengan
  password gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"` tidak
  mengautentikasi API browser loopback standalone ini.
- Jika kontrol browser diaktifkan dan tidak ada auth shared-secret yang dikonfigurasi, OpenClaw
  membuat otomatis `gateway.auth.token` saat startup dan mempertahankannya ke konfigurasi.
- OpenClaw **tidak** membuat otomatis token itu ketika `gateway.auth.mode` sudah
  `password`, `none`, atau `trusted-proxy`.
- Pertahankan Gateway dan host Node apa pun pada jaringan privat (Tailscale); hindari paparan publik.
- Perlakukan URL/token CDP jarak jauh sebagai secret; utamakan env vars atau secret manager.

Tips CDP jarak jauh:

- Utamakan endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek bila memungkinkan.
- Hindari menanamkan token berumur panjang langsung di file konfigurasi.

## Profil (multi-browser)

OpenClaw mendukung beberapa profil bernama (konfigurasi perutean). Profil dapat berupa:

- **dikelola-openclaw**: instance browser berbasis Chromium khusus dengan direktori data pengguna + port CDP sendiri
- **jarak jauh**: URL CDP eksplisit (browser berbasis Chromium yang berjalan di tempat lain)
- **sesi yang sudah ada**: profil Chrome Anda yang sudah ada melalui auto-connect Chrome DevTools MCP

Default:

- Profil `openclaw` dibuat otomatis jika belum ada.
- Profil `user` bawaan digunakan untuk attach existing-session Chrome MCP.
- Profil existing-session bersifat opt-in di luar `user`; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800–18899** secara default.
- Menghapus profil akan memindahkan direktori data lokalnya ke Trash.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Existing-session melalui Chrome DevTools MCP

OpenClaw juga dapat menempel ke profil browser berbasis Chromium yang sedang berjalan melalui
server resmi Chrome DevTools MCP. Ini menggunakan ulang tab dan state login
yang sudah terbuka di profil browser itu.

Referensi latar belakang dan penyiapan resmi:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan:

- `user`

Opsional: buat profil existing-session kustom Anda sendiri jika Anda menginginkan
nama, warna, atau direktori data browser yang berbeda.

Perilaku default:

- Profil `user` bawaan menggunakan auto-connect Chrome MCP, yang menargetkan
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

1. Buka halaman inspect browser itu untuk remote debugging.
2. Aktifkan remote debugging.
3. Biarkan browser tetap berjalan dan setujui prompt koneksi saat OpenClaw menempel.

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

Seperti apa keberhasilan itu:

- `status` menampilkan `driver: existing-session`
- `status` menampilkan `transport: chrome-mcp`
- `status` menampilkan `running: true`
- `tabs` mencantumkan tab browser Anda yang sudah terbuka
- `snapshot` mengembalikan ref dari tab live yang dipilih

Yang perlu diperiksa jika attach tidak berfungsi:

- browser berbasis Chromium target berversi `144+`
- remote debugging diaktifkan di halaman inspect browser itu
- browser menampilkan prompt persetujuan attach dan Anda menerimanya
- `openclaw doctor` memigrasikan konfigurasi browser lama berbasis ekstensi dan memeriksa bahwa
  Chrome terinstal secara lokal untuk profil auto-connect default, tetapi tidak dapat
  mengaktifkan remote debugging sisi browser untuk Anda

Penggunaan agen:

- Gunakan `profile="user"` saat Anda membutuhkan state browser pengguna yang sudah login.
- Jika Anda menggunakan profil existing-session kustom, berikan nama profil eksplisit itu.
- Pilih mode ini hanya ketika pengguna berada di komputer untuk menyetujui prompt
  attach.
- Gateway atau host Node dapat memunculkan `npx chrome-devtools-mcp@latest --autoConnect`

Catatan:

- Jalur ini berisiko lebih tinggi daripada profil `openclaw` yang terisolasi karena
  dapat bertindak di dalam sesi browser Anda yang sudah login.
- OpenClaw tidak meluncurkan browser untuk driver ini; OpenClaw hanya menempel.
- OpenClaw menggunakan alur resmi `--autoConnect` Chrome DevTools MCP di sini. Jika
  `userDataDir` diatur, nilai tersebut diteruskan untuk menargetkan direktori data pengguna itu.
- Existing-session dapat menempel pada host yang dipilih atau melalui Node browser yang terhubung. Jika Chrome berada di tempat lain dan tidak ada Node browser yang terhubung, gunakan CDP jarak jauh atau host Node sebagai gantinya.

<Accordion title="Batasan fitur existing-session">

Dibandingkan profil `openclaw` terkelola, driver existing-session lebih terbatas:

- **Screenshot** — tangkapan halaman dan tangkapan elemen `--ref` berfungsi; selector CSS `--element` tidak. `--full-page` tidak dapat digabungkan dengan `--ref` atau `--element`. Playwright tidak diperlukan untuk screenshot halaman atau elemen berbasis ref.
- **Tindakan** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan ref snapshot (tanpa selector CSS). `click` hanya untuk tombol kiri. `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`. `press` tidak mendukung `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, dan `evaluate` tidak mendukung timeout per panggilan. `select` menerima satu nilai.
- **Wait / upload / dialog** — `wait --url` mendukung pola exact, substring, dan glob; `wait --load networkidle` tidak didukung. Hook upload memerlukan `ref` atau `inputRef`, satu file pada satu waktu, tanpa CSS `element`. Hook dialog tidak mendukung override timeout.
- **Fitur khusus managed** — tindakan batch, ekspor PDF, intersepsi unduhan, dan `responsebody` masih memerlukan jalur browser terkelola.

</Accordion>

## Jaminan isolasi

- **Direktori data pengguna khusus**: tidak pernah menyentuh profil browser pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah benturan dengan alur kerja dev.
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

## API kontrol (opsional)

Untuk scripting dan debugging, Gateway mengekspos **API kontrol HTTP hanya-loopback** kecil
plus CLI `openclaw browser` yang sesuai (snapshot, ref, peningkatan wait,
output JSON, alur kerja debug). Lihat
[Browser control API](/id/tools/browser-control) untuk referensi lengkap.

## Pemecahan masalah

Untuk masalah khusus Linux (terutama snap Chromium), lihat
[Pemecahan masalah Browser](/id/tools/browser-linux-troubleshooting).

Untuk penyiapan host-terpisah WSL2 Gateway + Windows Chrome, lihat
[Pemecahan masalah WSL2 + Windows + Chrome CDP jarak jauh](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Kegagalan startup CDP vs blok SSRF navigasi

Ini adalah kelas kegagalan yang berbeda dan menunjukkan jalur kode yang berbeda.

- **Kegagalan startup atau readiness CDP** berarti OpenClaw tidak dapat mengonfirmasi bahwa control plane browser sehat.
- **Blok SSRF navigasi** berarti control plane browser sehat, tetapi target navigasi halaman ditolak oleh kebijakan.

Contoh umum:

- Kegagalan startup atau readiness CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blok SSRF navigasi:
  - alur `open`, `navigate`, snapshot, atau pembukaan tab gagal dengan error kebijakan browser/jaringan sementara `start` dan `tabs` tetap berfungsi

Gunakan urutan minimal ini untuk memisahkan keduanya:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cara membaca hasilnya:

- Jika `start` gagal dengan `not reachable after start`, pecahkan masalah readiness CDP terlebih dahulu.
- Jika `start` berhasil tetapi `tabs` gagal, control plane masih tidak sehat. Perlakukan ini sebagai masalah keterjangkauan CDP, bukan masalah navigasi halaman.
- Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane browser aktif dan kegagalannya ada pada kebijakan navigasi atau halaman target.
- Jika `start`, `tabs`, dan `open` semuanya berhasil, jalur kontrol browser terkelola dasar sehat.

Detail perilaku penting:

- Konfigurasi browser default ke objek kebijakan SSRF fail-closed bahkan ketika Anda tidak mengonfigurasi `browser.ssrfPolicy`.
- Untuk profil terkelola `openclaw` loopback lokal, pemeriksaan kesehatan CDP dengan sengaja melewati penegakan keterjangkauan SSRF browser untuk control plane lokal OpenClaw sendiri.
- Perlindungan navigasi terpisah. Hasil `start` atau `tabs` yang berhasil tidak berarti target `open` atau `navigate` berikutnya diizinkan.

Panduan keamanan:

- **Jangan** melonggarkan kebijakan SSRF browser secara default.
- Utamakan pengecualian host sempit seperti `hostnameAllowlist` atau `allowedHostnames` daripada akses private-network yang luas.
- Gunakan `dangerouslyAllowPrivateNetwork: true` hanya di environment tepercaya yang memang memerlukan akses browser private-network dan telah ditinjau.

## Alat agen + cara kontrol bekerja

Agen mendapatkan **satu alat** untuk otomatisasi browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cara pemetaannya:

- `browser snapshot` mengembalikan pohon UI yang stabil (AI atau ARIA).
- `browser act` menggunakan ID `ref` snapshot untuk click/type/drag/select.
- `browser screenshot` menangkap piksel (halaman penuh atau elemen).
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP jarak jauh).
  - `target` (`sandbox` | `host` | `node`) untuk memilih tempat browser berada.
  - Dalam sesi yang di-sandbox, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` dihilangkan: sesi sandbox default ke `sandbox`, sesi non-sandbox default ke `host`.
  - Jika Node yang mampu menjalankan browser terhubung, alat dapat merutekan otomatis ke Node itu kecuali Anda menyematkan `target="host"` atau `target="node"`.

Ini menjaga agen tetap deterministik dan menghindari selector yang rapuh.

## Terkait

- [Ikhtisar alat](/id/tools) — semua alat agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) — kontrol browser di environment yang di-sandbox
- [Keamanan](/id/gateway/security) — risiko kontrol browser dan hardening
