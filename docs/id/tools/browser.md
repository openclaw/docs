---
read_when:
    - Menambahkan otomatisasi browser yang dikendalikan agen
    - Men-debug alasan OpenClaw mengganggu Chrome Anda sendiri
    - Mengimplementasikan pengaturan browser + siklus hidup di aplikasi macOS
summary: Layanan kontrol browser terintegrasi + perintah tindakan
title: Browser (dikelola OpenClaw)
x-i18n:
    generated_at: "2026-07-16T18:45:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan oleh agen. Profil ini berjalan melalui layanan kontrol lokal kecil di dalam Gateway (khusus loopback) dan terisolasi dari peramban pribadi Anda.

- Anggap saja sebagai **peramban terpisah khusus agen**. Profil `openclaw` tidak pernah menyentuh profil peramban pribadi Anda.
- Agen membuka tab, membaca halaman, mengeklik, dan mengetik di jalur terisolasi ini.
- Sebagai gantinya, profil bawaan `user` terhubung ke sesi Chrome nyata Anda yang sudah login melalui Chrome DevTools MCP.

## Yang Anda dapatkan

- Profil peramban terpisah bernama **openclaw** (aksen oranye secara default).
- Kontrol tab deterministik (daftar/buka/fokus/tutup).
- Tindakan agen (klik/ketik/seret/pilih), snapshot, tangkapan layar, PDF.
- Profil berbasis Playwright menyimpan navigasi langsung ke lampiran di direktori unduhan terkelola dan mengembalikan metadata `{ url, suggestedFilename, path }` setelah validasi kebijakan URL akhir.
- Tindakan agen berbasis Playwright mengembalikan array `downloads` dengan metadata terkelola yang sama ketika tindakan tersebut segera memulai satu atau beberapa unduhan.
- Skills `browser-automation` terpaket yang mengajarkan agen tentang alur pemulihan snapshot,
  tab stabil, referensi kedaluwarsa, dan penghambat manual ketika Plugin peramban
  diaktifkan.
- Dukungan multiprofil opsional (`openclaw`, `work`, `remote`, ...).

Peramban ini **bukan** peramban utama Anda sehari-hari. Ini merupakan permukaan yang aman dan terisolasi untuk
otomatisasi dan verifikasi agen.

Di macOS, Anda dapat secara eksplisit menyalin cookie dari profil sistem keluarga Chrome ke profil terkelola yang terpisah. Peramban terkelola tetap menggunakan direktori data penggunanya sendiri; hanya cookie yang dipilih yang disalin, sedangkan penyimpanan lokal dan IndexedDB tetap tidak disalin. Lihat [Profil](#profiles-multi-browser) atau [referensi CLI `openclaw browser`](/id/cli/browser) untuk perintah impor dan batasannya.

## Mulai cepat

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Peramban dinonaktifkan" berarti Plugin atau `browser.enabled` dinonaktifkan; lihat
[Konfigurasi](#configuration) dan [Kontrol Plugin](#plugin-control).

Jika `openclaw browser` sama sekali tidak tersedia, atau agen menyatakan bahwa alat peramban
tidak tersedia, buka [Perintah atau alat peramban tidak tersedia](#missing-browser-command-or-tool).

## Kontrol Plugin

Alat `browser` default adalah Plugin terpaket. Nonaktifkan untuk menggantinya dengan Plugin lain yang mendaftarkan nama alat `browser` yang sama:

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

Konfigurasi default memerlukan `plugins.entries.browser.enabled` **dan** `browser.enabled=true`. Menonaktifkan Plugin saja akan menghapus CLI `openclaw browser`, metode Gateway `browser.request`, alat agen, dan layanan kontrol sebagai satu kesatuan; konfigurasi `browser.*` Anda tetap utuh untuk penggantinya.

Perubahan konfigurasi peramban memerlukan mulai ulang Gateway agar Plugin dapat mendaftarkan ulang layanannya.

## Panduan agen

Catatan profil alat: `tools.profile: "coding"` mencakup `web_search` dan
`web_fetch`, tetapi tidak mencakup alat `browser` lengkap. Agar agen atau
subagen yang dibuat dapat menggunakan otomatisasi peramban, tambahkan browser pada tahap
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
`tools.subagents.tools.allow: ["browser"]` saja tidak cukup karena kebijakan subagen
diterapkan setelah pemfilteran profil.

Plugin peramban menyertakan dua tingkat panduan agen:

- Deskripsi alat `browser` memuat kontrak ringkas yang selalu aktif: pilih
  profil yang tepat, pertahankan referensi pada tab yang sama, gunakan `tabId`/label untuk menargetkan
  tab, dan muat Skills peramban untuk pekerjaan bertahap.
- Skills `browser-automation` terpaket memuat alur operasi yang lebih panjang:
  periksa status/tab terlebih dahulu, beri label pada tab tugas, buat snapshot sebelum bertindak, buat snapshot ulang
  setelah perubahan UI, pulihkan referensi kedaluwarsa satu kali, dan laporkan penghambat login/2FA/captcha atau
  kamera/mikrofon sebagai tindakan manual alih-alih menebak.

Skills yang terpaket bersama Plugin dicantumkan dalam Skills yang tersedia bagi agen ketika
Plugin diaktifkan. Instruksi Skills lengkap dimuat sesuai permintaan, sehingga giliran
rutin tidak menanggung seluruh biaya token.

## Perintah atau alat peramban tidak tersedia

Jika `openclaw browser` tidak dikenali setelah peningkatan, `browser.request` tidak tersedia, atau agen melaporkan bahwa alat peramban tidak tersedia, penyebab umumnya adalah daftar `plugins.allow` yang tidak menyertakan `browser` dan tidak adanya blok konfigurasi root `browser`. Tambahkan:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Blok root `browser` yang eksplisit (kunci apa pun di bawah `browser`, seperti
`browser.enabled=true` atau `browser.profiles.<name>`) mengaktifkan Plugin peramban
terpaket bahkan dengan `plugins.allow` yang ketat, selaras dengan perilaku konfigurasi
kanal terpaket. `plugins.entries.browser.enabled=true` dan
`tools.alsoAllow: ["browser"]` saja tidak dapat menggantikan keanggotaan daftar izin.
Menghapus `plugins.allow` sepenuhnya juga memulihkan konfigurasi default.

## Profil: `openclaw`, `user`, `chrome`

- `openclaw`: peramban terkelola dan terisolasi (tidak memerlukan ekstensi).
- `user`: profil lampiran Chrome DevTools MCP bawaan untuk sesi **Chrome nyata
  Anda yang sudah login**. Chrome menampilkan perintah pemblokiran "Allow remote debugging?"
  saat pertama kali OpenClaw terhubung, sehingga seseorang harus berada di depan komputer.
- `chrome`: profil [ekstensi Chrome](/id/tools/chrome-extension) bawaan untuk
  sesi **Chrome nyata Anda yang sudah login**. Dapat digunakan dari ponsel tanpa ada orang di
  depan komputer karena profil ini mengendalikan tab melalui ekstensi peramban OpenClaw, bukan melalui
  port debugging jarak jauh, sehingga tidak ada perintah "Allow remote debugging?".

Untuk pemanggilan alat peramban oleh agen:

- Default: gunakan peramban `openclaw` yang terisolasi.
- Utamakan `profile="chrome"` (ekstensi) ketika sesi login yang ada diperlukan
  dan pengguna **jauh dari komputer** (Telegram, WhatsApp, dll.).
- Utamakan `profile="user"` (Chrome MCP) ketika sesi login yang ada diperlukan
  dan pengguna **berada di depan komputer** untuk menyetujui perintah koneksi.
- `profile` adalah penggantian eksplisit ketika Anda menginginkan mode peramban tertentu.

Atur `browser.defaultProfile: "openclaw"` jika Anda ingin menggunakan mode terkelola secara default.

## Konfigurasi

Pengaturan peramban berada di `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    evaluateEnabled: true, // default: true; false disables act:evaluate (arbitrary JS)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
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
    // snapshotDefaults: { mode: "efficient" }, // default snapshot mode when the caller omits one
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

`browser.snapshotDefaults.mode: "efficient"` mengubah mode ekstraksi `snapshot`
default ketika pemanggil tidak meneruskan `snapshotFormat` atau
`mode` secara eksplisit; lihat [API kontrol peramban](/id/tools/browser-control) untuk opsi
snapshot per pemanggilan.

### Penglihatan tangkapan layar (dukungan model khusus teks)

Ketika model utama hanya mendukung teks (tanpa dukungan penglihatan/multimodal), tangkapan layar
peramban mengembalikan blok gambar yang tidak dapat dibaca oleh model. Tangkapan layar peramban
menggunakan kembali konfigurasi pemahaman gambar yang ada, sehingga model gambar yang
dikonfigurasi untuk pemahaman media dapat mendeskripsikan tangkapan layar sebagai teks tanpa
pengaturan model khusus peramban.

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

1. Agen memanggil `browser screenshot` dan gambar diambil serta disimpan ke disk seperti biasa.
2. Alat peramban menanyakan runtime pemahaman gambar yang ada apakah runtime tersebut
   dapat mendeskripsikan tangkapan layar menggunakan model gambar media yang dikonfigurasi, model media
   bersama, konfigurasi default model gambar, atau penyedia gambar yang didukung autentikasi.
3. Model penglihatan mengembalikan deskripsi teks, yang dibungkus dengan
   `wrapExternalContent` (perlindungan injeksi prompt) dan dikembalikan kepada agen
   sebagai blok teks, bukan blok gambar.
4. Jika pemahaman gambar tidak tersedia, dilewati, atau gagal, peramban akan
   kembali mengembalikan blok gambar asli.

Blok gambar tangkapan layar adalah hasil alat privat: agen dapat memeriksanya,
tetapi OpenClaw tidak secara otomatis melampirkannya ke balasan kanal. Untuk membagikan
tangkapan layar, minta agen mengirimkannya secara eksplisit dengan alat pesan.

Gunakan kolom `tools.media.image` / `tools.media.models` yang ada untuk fallback
model, batas waktu, batas byte, profil, dan pengaturan permintaan penyedia.

Jika model utama yang aktif sudah mendukung penglihatan dan tidak ada model
pemahaman gambar eksplisit yang dikonfigurasi, OpenClaw mempertahankan hasil gambar normal agar
model utama dapat membaca tangkapan layar secara langsung.

<AccordionGroup>

<Accordion title="Port dan keterjangkauan">

- Layanan kontrol melakukan bind ke loopback pada port yang diturunkan dari `gateway.port` (default `18791` = gateway + 2). `OPENCLAW_GATEWAY_PORT` lebih diprioritaskan daripada `gateway.port`; keduanya menggeser port turunan dalam kelompok yang sama.
- Profil `openclaw` lokal menetapkan `cdpPort`/`cdpUrl` secara otomatis dari rentang yang dimulai 9 port di atas port kontrol (default `18800`-`18899`); tetapkan nilai tersebut hanya untuk
  profil CDP jarak jauh atau penyambungan endpoint sesi yang sudah ada. `cdpUrl` secara default menggunakan
  port CDP lokal terkelola jika tidak ditetapkan.
- `remoteCdpTimeoutMs` berlaku untuk pemeriksaan keterjangkauan HTTP CDP jarak jauh dan `attachOnly`
  serta permintaan HTTP untuk membuka tab; `remoteCdpHandshakeTimeoutMs` berlaku untuk
  handshake WebSocket CDP-nya. Enumerasi tab Playwright jarak jauh persisten
  menggunakan nilai yang lebih besar dari keduanya sebagai tenggat operasinya.
- `localLaunchTimeoutMs` adalah jatah waktu bagi proses Chrome terkelola yang diluncurkan secara lokal
  untuk mengekspos endpoint HTTP CDP-nya. `localCdpReadyTimeoutMs` adalah
  jatah waktu lanjutan untuk kesiapan websocket CDP setelah proses ditemukan.
  Naikkan nilai ini pada Raspberry Pi, VPS kelas bawah, atau perangkat keras lama tempat Chromium
  dimulai dengan lambat. Nilai harus berupa bilangan bulat positif hingga `120000` md; nilai
  konfigurasi yang tidak valid akan ditolak.
- Kegagalan berulang pada peluncuran/kesiapan Chrome terkelola diputus oleh circuit breaker per
  profil. Setelah beberapa kegagalan berturut-turut, OpenClaw menjeda upaya
  peluncuran baru sejenak alih-alih menjalankan Chromium pada setiap pemanggilan alat peramban. Perbaiki
  masalah startup, nonaktifkan peramban jika tidak diperlukan, atau mulai ulang
  Gateway setelah perbaikan.
- `actionTimeoutMs` adalah jatah waktu default untuk permintaan `act` peramban saat pemanggil tidak meneruskan `timeoutMs`. Transport klien menambahkan sedikit kelonggaran waktu agar penantian panjang dapat selesai alih-alih kehabisan waktu pada batas HTTP.
- `tabCleanup` adalah pembersihan upaya terbaik untuk tab yang dibuka oleh sesi peramban agen utama. Pembersihan siklus hidup subagen, cron, dan ACP tetap menutup tab terlacak eksplisitnya pada akhir sesi; sesi utama mempertahankan tab aktif agar dapat digunakan kembali, lalu menutup tab terlacak yang menganggur atau berlebih di latar belakang.

</Accordion>

<Accordion title="Kebijakan SSRF">

- Permintaan navigasi peramban dan pembukaan tab diperiksa sebelum dijalankan. Selama tindakan dan masa tenggang terbatas setelah tindakan, interaksi Playwright yang dilindungi (klik, klik koordinat, arahkan penunjuk, seret, gulir, pilih, tekan, ketik, isi formulir, dan evaluasi) mencegat pemuatan dokumen tingkat teratas dan subframe yang ditolak kebijakan sebelum byte permintaan HTTP dikirim, lalu memeriksa ulang URL `http(s)` akhir dengan upaya terbaik.
- Sebelum setiap peluncuran baru Chrome yang dikelola OpenClaw, OpenClaw menonaktifkan prediksi jaringan dengan upaya terbaik, sehingga menekan preconnect spekulatif Chromium yang teramati untuk pemuatan yang ditolak tersebut. Ini adalah pertahanan berlapis, bukan batas kebijakan: peramban yang digunakan kembali setelah layanan kontrol dimulai ulang dan backend peramban lain mungkin tidak menerapkan penguatan yang sama. Perutean Playwright tetap bukan firewall jaringan dan tidak mencegat lompatan pengalihan, permintaan pertama popup, lalu lintas Service Worker, kode halaman yang berjalan setelah jendela perlindungan terbatas, atau setiap jalur latar belakang/subsumber daya. Isolasi egress menyeluruh memerlukan isolasi di sisi pemilik atau proksi yang menegakkan kebijakan.
- Dalam mode SSRF ketat, penemuan endpoint CDP jarak jauh dan probe `/json/version` (`cdpUrl`) juga diperiksa.
- Variabel lingkungan `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan `NO_PROXY` Gateway/penyedia tidak secara otomatis memproksikan peramban yang dikelola OpenClaw. Chrome terkelola diluncurkan langsung secara default agar pengaturan proksi penyedia tidak melemahkan pemeriksaan SSRF peramban.
- Probe kesiapan CDP lokal yang dikelola OpenClaw dan koneksi WebSocket DevTools melewati proksi jaringan terkelola untuk endpoint loopback yang diluncurkan tersebut secara persis, sehingga `openclaw browser start` tetap berfungsi saat proksi operator memblokir egress loopback.
- Untuk memproksikan peramban terkelola itu sendiri, teruskan flag proksi Chrome eksplisit melalui `browser.extraArgs`, seperti `--proxy-server=...` atau `--proxy-pac-url=...`. Mode SSRF ketat memblokir perutean proksi peramban eksplisit kecuali akses peramban ke jaringan privat sengaja diaktifkan.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan secara default; aktifkan hanya jika akses peramban ke jaringan privat sengaja dipercaya.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.

</Accordion>

<Accordion title="Perilaku profil">

- `attachOnly: true` berarti jangan pernah meluncurkan peramban lokal; hanya sambungkan jika peramban sudah berjalan.
- `headless` dapat ditetapkan secara global atau per profil terkelola lokal. Nilai per profil menggantikan `browser.headless`, sehingga satu profil yang diluncurkan secara lokal dapat tetap headless sementara profil lain tetap terlihat.
- `POST /start?headless=true` dan `openclaw browser start --headless` meminta
  peluncuran headless satu kali untuk profil terkelola lokal tanpa menulis ulang
  `browser.headless` atau konfigurasi profil. Profil sesi yang sudah ada, hanya-sambung, dan
  CDP jarak jauh menolak penggantian tersebut karena OpenClaw tidak meluncurkan
  proses peramban itu.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil terkelola lokal
  secara otomatis menggunakan headless secara default jika lingkungan maupun konfigurasi profil/global
  tidak secara eksplisit memilih mode dengan tampilan. Gunakan bentuk tingkat peramban yang tidak ambigu
  `openclaw browser --json status`; `openclaw browser status --json` di bagian akhir
  juga berfungsi karena `status` tidak mendefinisikan `--json` miliknya sendiri. Perintah melaporkan
  `headlessSource` sebagai `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, atau `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` memaksa peluncuran terkelola lokal menggunakan headless untuk
  proses saat ini. `OPENCLAW_BROWSER_HEADLESS=0` memaksa mode dengan tampilan untuk startup
  biasa dan mengembalikan galat yang dapat ditindaklanjuti pada host Linux tanpa server tampilan;
  permintaan `start --headless` eksplisit tetap lebih diprioritaskan untuk peluncuran satu kali tersebut.
- Rute kontrol peramban dan klien terprogram mempertahankan
  `error` yang mudah dibaca manusia dari galat tanpa tampilan serta mengekspos alasan stabil
  `no_display_for_headed_profile`. `details`-nya hanya berisi `profile`,
  `requestedHeadless`, `headlessSource`, dan `displayPresent`, sehingga klien API dapat
  memilih remediasi yang tepat tanpa mencocokkan teks pesan.
- Untuk profil terkelola lokal yang sedang berjalan, status dan doctor meminta endpoint CDP
  tingkat peramban Chrome untuk mengetahui status perender, backend, perangkat/driver, fitur,
  solusi sementara driver, dan kemampuan video terakselerasi. Hasilnya
  disimpan dalam cache untuk proses peramban tersebut dan diekspos sepenuhnya oleh
  `openclaw browser --json status`. Pemanggilan status pasif tidak meluncurkan Chrome.
  Peramban sesi yang sudah ada, ekstensi, CDP jarak jauh, dan sandbox tetap terpisah
  dan tidak diperiksa melalui jalur host terkelola ini.
- Chrome terkelola headless tetap menggunakan default `--disable-gpu` yang konservatif.
  Diagnostik tidak mengaktifkan akselerasi, menambahkan pengaturan akselerasi global,
  atau memberikan akses perangkat kepada peramban sandbox.
- `executablePath` dapat ditetapkan secara global atau per profil terkelola lokal. Nilai per profil menggantikan `browser.executablePath`, sehingga profil terkelola yang berbeda dapat meluncurkan peramban berbasis Chromium yang berbeda. Kedua bentuk menerima `~` untuk direktori beranda OS Anda.
- `color` (tingkat teratas dan per profil) memberi warna pada UI peramban agar Anda dapat melihat profil mana yang aktif.
- Profil default adalah `openclaw` (mandiri terkelola). Gunakan `defaultProfile: "user"` untuk memilih menggunakan peramban pengguna yang telah login.
- Urutan deteksi otomatis: peramban default sistem jika berbasis Chromium; jika tidak, Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP alih-alih CDP mentah. Profil ini dapat tersambung melalui koneksi otomatis Chrome MCP, atau melalui `cdpUrl` jika Anda sudah memiliki endpoint DevTools untuk peramban yang berjalan.
- `driver: "extension"` mengendalikan Chrome yang telah login melalui [ekstensi Chrome OpenClaw](/id/tools/chrome-extension). Relay memiliki endpoint loopback-nya sendiri, sehingga profil ini tidak menerima `cdpUrl`. Ini adalah satu-satunya mode peramban yang telah login yang berfungsi tanpa siapa pun berada di depan komputer.
- Tetapkan `browser.profiles.<name>.userDataDir` saat profil sesi yang sudah ada harus tersambung ke profil pengguna Chromium non-default (Brave, Edge, dll.). Jalur ini juga menerima `~` untuk direktori beranda OS Anda.

</Accordion>

</AccordionGroup>

## Gunakan Brave atau peramban berbasis Chromium lainnya

Jika peramban **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll.),
OpenClaw menggunakannya secara otomatis. Tetapkan `browser.executablePath` untuk mengganti
deteksi otomatis. Nilai `executablePath` tingkat teratas dan per profil menerima `~`
untuk direktori beranda OS Anda:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Atau tetapkan dalam konfigurasi, per platform:

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

`executablePath` per profil hanya memengaruhi profil terkelola lokal yang
diluncurkan OpenClaw. Profil `existing-session` tersambung ke peramban yang sudah berjalan,
sedangkan profil CDP jarak jauh menggunakan peramban di balik `cdpUrl`.

## Kontrol lokal vs jarak jauh

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan peramban lokal.
- **Kontrol jarak jauh (host node):** jalankan host node pada mesin yang memiliki peramban; Gateway memproksikan tindakan peramban kepadanya.
- **CDP jarak jauh:** tetapkan `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  tersambung ke peramban berbasis Chromium jarak jauh. Dalam hal ini, OpenClaw tidak akan meluncurkan peramban lokal.
- Untuk layanan CDP yang dikelola secara eksternal pada loopback (misalnya Browserless dalam
  Docker yang dipublikasikan ke `127.0.0.1`), tetapkan juga `attachOnly: true`. CDP loopback
  tanpa `attachOnly` diperlakukan sebagai profil peramban lokal yang dikelola OpenClaw.
- `headless` hanya memengaruhi profil terkelola lokal yang diluncurkan OpenClaw. Nilai ini tidak memulai ulang atau mengubah peramban sesi yang sudah ada maupun CDP jarak jauh.
- `executablePath` mengikuti aturan profil terkelola lokal yang sama. Mengubahnya pada
  profil terkelola lokal yang sedang berjalan menandai profil tersebut untuk dimulai ulang/direkonsiliasi agar
  peluncuran berikutnya menggunakan biner baru.

Perilaku penghentian berbeda menurut mode profil:

- profil terkelola lokal: `openclaw browser stop` menghentikan proses peramban yang
  diluncurkan OpenClaw
- profil hanya-sambung dan CDP jarak jauh: `openclaw browser stop` menutup sesi
  kontrol aktif dan melepaskan penggantian emulasi Playwright/CDP (viewport,
  skema warna, locale, zona waktu, mode offline, dan status serupa),
  meskipun tidak ada proses peramban yang diluncurkan oleh OpenClaw

URL CDP jarak jauh dapat menyertakan autentikasi:

- Token kueri (misalnya, `https://provider.example?token=<token>`)
- Autentikasi HTTP Basic (misalnya, `https://user:pass@provider.example`)

OpenClaw mempertahankan autentikasi saat memanggil endpoint `/json/*` dan saat tersambung
ke WebSocket CDP. Utamakan variabel lingkungan atau pengelola rahasia untuk
token daripada memasukkannya ke file konfigurasi.

## Proksi peramban Node (default tanpa konfigurasi)

Jika Anda menjalankan **host node** pada mesin yang memiliki browser Anda, OpenClaw dapat
secara otomatis merutekan panggilan alat browser ke node tersebut tanpa konfigurasi browser tambahan.
Ini adalah jalur default untuk Gateway jarak jauh.

Catatan:

- Host node mengekspos server kontrol browser lokalnya melalui **perintah proksi**.
- Profil berasal dari konfigurasi `browser.profiles` milik node itu sendiri (sama seperti lokal).
- Perintah proksi tidak pernah mengizinkan mutasi profil persisten (`create-profile`, `delete-profile`, `reset-profile`) terlepas dari `allowProfiles`; lakukan perubahan tersebut langsung pada node.
- `nodeHost.browserProxy.allowProfiles` bersifat opsional. Biarkan kosong untuk perilaku lama/default: semua profil yang dikonfigurasi tetap dapat dijangkau melalui proksi.
- Jika Anda menetapkan `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas hak akses minimum yang membatasi nama profil yang akan ditargetkan proksi.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Pada node: `nodeHost.browserProxy.enabled=false`
  - Pada Gateway: `gateway.nodes.browser.mode="off"` (juga menerima `"auto"` untuk memilih satu node browser yang terhubung, atau `"manual"` untuk mewajibkan parameter node eksplisit)

## Browserless (CDP jarak jauh yang dihosting)

[Browserless](https://browserless.io) adalah layanan Chromium yang dihosting dan mengekspos
URL koneksi CDP melalui HTTPS dan WebSocket. OpenClaw dapat menggunakan kedua bentuk tersebut, tetapi
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

- Ganti `<BROWSERLESS_API_KEY>` dengan token Browserless Anda yang sebenarnya.
- Pilih endpoint wilayah yang sesuai dengan akun Browserless Anda (lihat dokumentasinya).
- Jika Browserless memberi Anda URL dasar HTTPS, Anda dapat mengonversinya menjadi
  `wss://` untuk koneksi CDP langsung atau mempertahankan URL HTTPS dan membiarkan OpenClaw
  menemukan `/json/version`.

### Browserless Docker pada host yang sama

Saat Browserless dihosting sendiri dalam Docker dan OpenClaw berjalan pada host, perlakukan
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

Alamat dalam `browser.profiles.browserless.cdpUrl` harus dapat dijangkau dari
proses OpenClaw. Browserless juga harus mengiklankan endpoint yang cocok dan dapat dijangkau;
tetapkan `EXTERNAL` Browserless ke basis WebSocket publik-ke-OpenClaw yang sama, seperti
`ws://127.0.0.1:3000`, `ws://browserless:3000`, atau alamat jaringan privat Docker
yang stabil. Jika `/json/version` mengembalikan `webSocketDebuggerUrl` yang mengarah ke
alamat yang tidak dapat dijangkau OpenClaw, HTTP CDP dapat terlihat sehat sementara
penyambungan WebSocket tetap gagal.

Jangan biarkan `attachOnly` tidak ditetapkan untuk profil Browserless loopback. Tanpa
`attachOnly`, OpenClaw memperlakukan port loopback sebagai profil browser lokal
yang dikelola dan dapat melaporkan bahwa port sedang digunakan tetapi bukan milik OpenClaw.

## Penyedia CDP WebSocket langsung

Beberapa layanan browser yang dihosting mengekspos endpoint **WebSocket langsung**, bukan
penemuan CDP berbasis HTTP standar (`/json/version`). OpenClaw menerima tiga
bentuk URL CDP dan secara otomatis memilih strategi koneksi yang tepat:

- **Penemuan HTTP(S)** - `http://host[:port]` atau `https://host[:port]`.
  OpenClaw memanggil `/json/version` untuk menemukan URL debugger WebSocket, lalu
  terhubung. Tidak ada fallback WebSocket.
- **Endpoint WebSocket langsung** - `ws://host[:port]/devtools/<kind>/<id>` atau
  `wss://...` dengan jalur `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw terhubung langsung melalui handshake WebSocket dan sepenuhnya melewati
  `/json/version`.
- **Root WebSocket polos** - `ws://host[:port]` atau `wss://host[:port]` tanpa
  jalur `/devtools/...` (misalnya [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw mencoba penemuan HTTP
  `/json/version` terlebih dahulu (menormalkan skema menjadi `http`/`https`);
  jika penemuan mengembalikan `webSocketDebuggerUrl`, nilai tersebut digunakan; jika tidak, OpenClaw
  melakukan fallback ke handshake WebSocket langsung pada root polos. Jika endpoint
  WebSocket yang diiklankan menolak handshake CDP tetapi root polos yang dikonfigurasi
  menerimanya, OpenClaw juga melakukan fallback ke root tersebut. Ini memungkinkan `ws://` polos
  yang diarahkan ke Chrome lokal tetap terhubung, karena Chrome hanya menerima peningkatan WebSocket
  pada jalur khusus per target dari `/json/version`, sementara penyedia yang dihosting
  tetap dapat menggunakan endpoint WebSocket root mereka ketika endpoint penemuannya
  mengiklankan URL berumur pendek yang tidak cocok untuk CDP Playwright.

`openclaw browser doctor` menggunakan logika penemuan-dahulu, fallback-WebSocket
yang sama seperti penyambungan saat runtime, sehingga URL root polos yang berhasil terhubung tidak
dilaporkan sebagai tidak dapat dijangkau oleh diagnostik.

### Browserbase

[Browserbase](https://www.browserbase.com) adalah platform cloud untuk menjalankan
browser headless dengan pemecahan CAPTCHA bawaan, mode siluman, dan proksi
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
  Anda dari [dasbor Overview](https://www.browserbase.com/overview).
- Ganti `<BROWSERBASE_API_KEY>` dengan kunci API Browserbase Anda yang sebenarnya.
- Browserbase secara otomatis membuat sesi browser saat WebSocket terhubung, sehingga tidak
  diperlukan langkah pembuatan sesi manual.
- Lihat [harga](https://www.browserbase.com/pricing) untuk batas tingkat gratis dan paket berbayar saat ini.
- Lihat [dokumentasi Browserbase](https://docs.browserbase.com) untuk referensi API lengkap,
  panduan SDK, dan contoh integrasi.

### Notte

[Notte](https://www.notte.cc) adalah platform cloud untuk menjalankan browser
headless dengan mode siluman bawaan, proksi residensial, dan Gateway WebSocket
asli CDP.

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

- [Daftar](https://console.notte.cc) dan salin **API Key** Anda dari
  halaman pengaturan konsol.
- Ganti `<NOTTE_API_KEY>` dengan kunci API Notte Anda yang sebenarnya.
- Notte secara otomatis membuat sesi browser saat WebSocket terhubung, sehingga tidak diperlukan
  langkah pembuatan sesi manual. Sesi dihancurkan ketika
  WebSocket terputus.
- Lihat [harga](https://www.notte.cc/#pricing) untuk batas tingkat gratis dan paket berbayar saat ini.
- Lihat [dokumentasi Notte](https://docs.notte.cc) untuk referensi API lengkap, panduan
  SDK, dan contoh integrasi.

## Keamanan

Gagasan utama:

- Kontrol browser hanya tersedia melalui loopback; akses mengalir melalui autentikasi Gateway atau pemasangan node.
- API HTTP browser loopback mandiri menggunakan **hanya autentikasi rahasia bersama**:
  autentikasi bearer token Gateway, `x-openclaw-password`, atau autentikasi HTTP Basic dengan
  kata sandi Gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"`
  **tidak** mengautentikasi API browser loopback mandiri ini.
- Jika kontrol browser diaktifkan dan tidak ada autentikasi rahasia bersama yang dikonfigurasi, OpenClaw
  secara otomatis membuat dan menyimpan kredensial kontrol browser saat startup:
  token ketika `gateway.auth.mode` adalah `none`, atau kata sandi ketika nilainya
  `trusted-proxy` (disimpan melalui `gateway.auth.password` agar klien loopback
  di luar proses dapat menentukannya). Pembuatan otomatis dilewati ketika kredensial
  string eksplisit sudah dikonfigurasi untuk mode tersebut, atau ketika
  `gateway.auth.mode` adalah `password`.
- Konfigurasikan `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, atau
  `OPENCLAW_GATEWAY_PASSWORD` secara eksplisit jika Anda menginginkan rahasia stabil yang Anda kendalikan,
  bukan rahasia yang dihasilkan.

Kiat CDP jarak jauh:

- Utamakan endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek jika memungkinkan.
- Hindari menyematkan token berumur panjang langsung dalam file konfigurasi.
- Pertahankan Gateway dan setiap host node dalam jaringan privat (Tailscale); hindari paparan publik.
- Perlakukan URL/token CDP jarak jauh sebagai rahasia; utamakan variabel lingkungan atau pengelola rahasia.

## Profil (multi-browser)

OpenClaw mendukung beberapa profil bernama (konfigurasi perutean). Profil dapat berupa:

- **dikelola OpenClaw**: instans browser berbasis Chromium khusus dengan direktori data pengguna + port CDP sendiri
- **jarak jauh**: URL CDP eksplisit (browser berbasis Chromium yang berjalan di tempat lain)
- **sesi yang ada**: profil Chrome Anda yang sudah ada melalui koneksi otomatis Chrome DevTools MCP

Default:

- Profil `openclaw` dibuat secara otomatis jika tidak ada.
- Profil `user` merupakan bawaan untuk penyambungan sesi yang ada melalui Chrome MCP.
- Profil sesi yang ada bersifat opsional selain `user`; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800-18899** secara default.
- Menghapus profil memindahkan direktori data lokalnya ke Trash.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Sesi yang ada melalui Chrome DevTools MCP

OpenClaw juga dapat menyambung ke profil browser berbasis Chromium yang sedang berjalan melalui
server resmi Chrome DevTools MCP. Ini menggunakan kembali tab dan status login
yang sudah terbuka dalam profil browser tersebut.

Referensi latar belakang dan penyiapan resmi:

- [Chrome untuk Developer: Gunakan Chrome DevTools MCP dengan sesi browser Anda](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan: `user`. Buat profil sesi yang ada khusus milik Anda jika
Anda menginginkan nama, warna, atau direktori data browser yang berbeda.

Secara default, profil bawaan `user` menggunakan koneksi otomatis Chrome MCP, yang
menargetkan profil Google Chrome lokal default. Gunakan `userDataDir` untuk Brave,
Edge, Chromium, atau profil Chrome non-default. `~` diperluas menjadi direktori home
OS Anda:

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

Kemudian, di browser yang sesuai:

1. Buka halaman inspeksi browser tersebut untuk debugging jarak jauh.
2. Aktifkan debugging jarak jauh.
3. Biarkan browser tetap berjalan dan setujui perintah koneksi ketika OpenClaw menyambung.

Halaman inspeksi umum:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Uji cepat penyambungan langsung:

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
- `snapshot` mengembalikan referensi dari tab aktif yang dipilih

Hal yang perlu diperiksa jika pelampiran tidak berfungsi:

- browser berbasis Chromium target menggunakan versi `144+`
- debugging jarak jauh diaktifkan di halaman inspeksi browser tersebut
- browser menampilkan permintaan persetujuan pelampiran dan Anda menyetujuinya
- jika Chrome dimulai dengan `--remote-debugging-port` eksplisit, atur
  `browser.profiles.<name>.cdpUrl` ke endpoint DevTools tersebut alih-alih mengandalkan
  koneksi otomatis Chrome MCP
- `openclaw doctor` memigrasikan konfigurasi browser lama berbasis ekstensi dan memeriksa bahwa
  Chrome terinstal secara lokal untuk profil koneksi otomatis default, tetapi tidak dapat
  mengaktifkan debugging jarak jauh di sisi browser untuk Anda

Penggunaan oleh agen:

- Gunakan `profile="user"` saat Anda memerlukan status browser pengguna yang telah masuk.
- Jika Anda menggunakan profil sesi yang sudah ada khusus, teruskan nama profil eksplisit tersebut.
- Pilih mode ini hanya saat pengguna berada di depan komputer untuk menyetujui permintaan
  pelampiran.
- Host Gateway atau node dapat menjalankan `npx chrome-devtools-mcp@latest --autoConnect`.

Catatan:

- Jalur ini berisiko lebih tinggi daripada profil `openclaw` yang terisolasi karena dapat
  bertindak di dalam sesi browser Anda yang telah masuk.
- OpenClaw tidak menjalankan browser untuk driver ini; OpenClaw hanya melakukan pelampiran.
- OpenClaw menggunakan alur resmi Chrome DevTools MCP `--autoConnect` di sini. Jika
  `userDataDir` ditetapkan, nilai tersebut diteruskan untuk menargetkan direktori data pengguna itu.
- Sesi yang sudah ada dapat dilampirkan pada host yang dipilih atau melalui
  node browser yang terhubung. Jika Chrome berada di tempat lain dan tidak ada node browser yang terhubung, gunakan
  CDP jarak jauh atau host node sebagai gantinya.
- Target Chrome MCP dan referensi snapshot terbatas pada satu subproses MCP. Setelah
  proses tersebut dimulai ulang, jalankan `browser tabs` lagi, pilih target baru secara eksplisit
  sebelum melakukan pekerjaan khusus target, dan ambil snapshot baru sebelum menggunakan referensi.
  Setiap referensi hanya berlaku untuk targetnya dan snapshot terbaru. Alias lama tidak
  ditransfer ke tab pengganti, meskipun URL-nya sama.
- Chrome DevTools MCP saat ini merutekan alat halaman berdasarkan ID halaman numerik
  lokal proses. Handle yang terbatas pada proses mencegah penggunaan ulang setelah penggantian subproses, tetapi
  penggantian konteks browser di dalam proses di antara pemanggilan alat yang berurutan masih dapat
  mengalihkan target tindakan. Perutean yang sepenuhnya atomik memerlukan dukungan alat halaman upstream
  untuk ID target yang stabil.

### Peluncuran Chrome MCP khusus

Ganti server Chrome DevTools MCP yang dijalankan per profil jika alur default
`npx chrome-devtools-mcp@latest` bukan yang Anda inginkan (host luring,
versi yang dipatok, biner yang disertakan):

| Bidang       | Fungsinya                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Berkas yang dapat dieksekusi untuk dijalankan sebagai pengganti `npx`. Di-resolve apa adanya; path absolut dipatuhi.                         |
| `mcpArgs`    | Larik argumen yang diteruskan apa adanya ke `mcpCommand`. Menggantikan argumen default `chrome-devtools-mcp@latest --autoConnect`. |

Saat `cdpUrl` ditetapkan pada profil sesi yang sudah ada, OpenClaw melewati
`--autoConnect` dan meneruskan endpoint ke Chrome MCP secara otomatis:

- `http(s)://...` → `--browserUrl <url>` (endpoint penemuan HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP langsung).

Flag endpoint dan `userDataDir` tidak dapat digabungkan: saat `cdpUrl` ditetapkan,
`userDataDir` diabaikan untuk peluncuran Chrome MCP, karena Chrome MCP melampirkan ke
browser yang berjalan di balik endpoint tersebut alih-alih membuka direktori
profil.

<Accordion title="Batasan fitur sesi yang sudah ada">

Dibandingkan dengan profil `openclaw` terkelola, driver sesi yang sudah ada memiliki lebih banyak batasan:

- **Tangkapan layar** - pengambilan halaman dan pengambilan elemen `--ref` berfungsi; selektor CSS `--element` tidak. Playwright tidak diperlukan untuk tangkapan layar halaman atau elemen berbasis referensi. (`--full-page` tidak dapat digabungkan dengan `--ref` atau `--element` pada profil apa pun, bukan hanya sesi yang sudah ada.)
- **Tindakan** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan referensi snapshot (tanpa selektor CSS). `click-coords` mengeklik koordinat viewport yang terlihat dan tidak memerlukan referensi snapshot. `click` hanya mendukung tombol kiri (tanpa penggantian tombol atau tombol pengubah). `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`. `press` tidak mendukung `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, dan `fill` tidak mendukung penggantian `timeoutMs` per pemanggilan; `evaluate` mendukungnya. `select` menerima satu nilai. `batch` tidak didukung; kirim tindakan satu per satu.
- **Tunggu / unggah / dialog** - `wait --url` mendukung pola persis, substring, dan glob (sama seperti terkelola); `wait --load networkidle` tidak didukung pada profil sesi yang sudah ada (fitur ini berfungsi pada profil CDP terkelola dan mentah/jarak jauh). Hook unggahan memerlukan `ref` atau `inputRef`, satu berkas setiap kali, tanpa CSS `element`. Hook dialog tidak mendukung penggantian batas waktu atau `dialogId`.
- **Visibilitas dialog** - Respons tindakan browser terkelola menyertakan `blockedByDialog` dan `browserState.dialogs.pending` saat suatu tindakan membuka dialog modal; snapshot juga menyertakan status dialog yang tertunda. Tanggapi dengan `browser dialog --accept/--dismiss --dialog-id <id>` saat dialog tertunda. Dialog yang ditangani di luar OpenClaw muncul di bawah `browserState.dialogs.recent`.
- **Fitur khusus terkelola** - Ekspor PDF, intersepsi unduhan, dan `responsebody` tetap memerlukan jalur browser terkelola.

</Accordion>

## Jaminan isolasi

- **Direktori data pengguna khusus**: tidak pernah menyentuh profil browser pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah benturan dengan alur kerja pengembangan.
- **Kontrol tab deterministik**: `tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu
  handle `tabId` yang stabil seperti `t1`, label opsional, dan `targetId` mentah.
  Agen harus menggunakan kembali `suggestedTargetId`; ID mentah tetap tersedia untuk
  debugging dan kompatibilitas.

## Pemilihan browser

Saat dijalankan secara lokal, OpenClaw memilih yang pertama tersedia:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Anda dapat menggantinya dengan `browser.executablePath`.

Platform:

- macOS: memeriksa `/Applications` dan `~/Applications`.
- Linux: memeriksa lokasi umum Chrome/Brave/Edge/Chromium di bawah `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, dan
  `/usr/lib/chromium-browser`, serta Chromium yang dikelola Playwright di bawah
  `PLAYWRIGHT_BROWSERS_PATH` atau `~/.cache/ms-playwright`.
- Windows: memeriksa lokasi instalasi umum.

## API kontrol (opsional)

Untuk pembuatan skrip dan debugging, Gateway menyediakan **API kontrol HTTP yang
hanya dapat diakses melalui loopback** serta CLI `openclaw browser` yang sesuai (snapshot, referensi, peningkatan kemampuan
tunggu, keluaran JSON, alur kerja debugging). Lihat
[API kontrol browser](/id/tools/browser-control) untuk referensi lengkap.

## Pemecahan masalah

Untuk masalah khusus Linux (terutama Chromium snap), lihat
[Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting).

Untuk penyiapan host terpisah Gateway WSL2 + Chrome Windows, lihat
[Pemecahan masalah WSL2 + Windows + CDP Chrome jarak jauh](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Kegagalan memulai CDP vs pemblokiran SSRF navigasi

Ini adalah kelas kegagalan yang berbeda dan mengarah ke jalur kode yang berbeda.

- **Kegagalan memulai atau kesiapan CDP** berarti OpenClaw tidak dapat memastikan bahwa bidang kontrol browser dalam keadaan sehat.
- **Pemblokiran SSRF navigasi** berarti bidang kontrol browser dalam keadaan sehat, tetapi target navigasi halaman ditolak oleh kebijakan.

Contoh umum:

- Kegagalan memulai atau kesiapan CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` saat
    layanan CDP eksternal loopback dikonfigurasi tanpa `attachOnly: true`
- Pemblokiran SSRF navigasi:
  - Alur `open`, `navigate`, snapshot, atau pembukaan tab gagal dengan kesalahan kebijakan browser/jaringan sementara `start` dan `tabs` tetap berfungsi

Gunakan urutan minimal ini untuk membedakan keduanya:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cara membaca hasilnya:

- Jika `start` gagal dengan `not reachable after start`, pecahkan masalah kesiapan CDP terlebih dahulu.
- Jika `start` berhasil tetapi `tabs` gagal, bidang kontrol masih tidak sehat. Perlakukan ini sebagai masalah keterjangkauan CDP, bukan masalah navigasi halaman.
- Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, bidang kontrol browser aktif dan kegagalannya berada pada kebijakan navigasi atau halaman target.
- Jika `start`, `tabs`, dan `open` semuanya berhasil, jalur kontrol browser terkelola dasar dalam keadaan sehat.

Detail perilaku penting:

- Konfigurasi browser menggunakan objek kebijakan SSRF yang gagal dalam kondisi tertutup secara default meskipun Anda tidak mengonfigurasi `browser.ssrfPolicy`.
- Untuk profil terkelola loopback lokal `openclaw`, pemeriksaan kesehatan CDP sengaja melewati penerapan keterjangkauan SSRF browser untuk bidang kontrol lokal milik OpenClaw.
- Perlindungan navigasi bersifat terpisah. Hasil `start` atau `tabs` yang berhasil tidak berarti target `open` atau `navigate` berikutnya diizinkan.

Panduan keamanan:

- **Jangan** melonggarkan kebijakan SSRF browser secara default.
- Utamakan pengecualian host yang sempit seperti `hostnameAllowlist` atau `allowedHostnames` daripada akses jaringan privat yang luas.
- Gunakan `dangerouslyAllowPrivateNetwork: true` hanya dalam lingkungan yang sengaja dipercaya, tempat akses browser ke jaringan privat diperlukan dan telah ditinjau.

## Alat agen + cara kerja kontrol

Agen mendapatkan **satu alat** untuk otomatisasi browser:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cara pemetaannya:

- `browser snapshot` mengembalikan pohon UI yang stabil (AI atau ARIA).
- `browser act` menggunakan ID `ref` dari snapshot untuk mengeklik/mengetik/menyeret/memilih.
- `browser screenshot` menangkap piksel (halaman penuh, elemen, atau referensi berlabel).
- `browser doctor` memeriksa kesiapan Gateway, plugin, profil, browser, dan tab.
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP jarak jauh).
  - `target` (`sandbox` | `host` | `node`) untuk memilih lokasi browser dijalankan.
  - Dalam sesi yang di-sandbox, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` dihilangkan: sesi yang di-sandbox secara default menggunakan `sandbox`, sedangkan sesi tanpa sandbox secara default menggunakan `host`.
  - Jika Node berkemampuan browser terhubung, alat ini dapat merutekan secara otomatis ke Node tersebut, kecuali Anda menetapkan `target="host"` atau `target="node"`.

Hal ini menjaga agen tetap deterministik dan menghindari selektor yang rapuh.

## Terkait

- [Ikhtisar Alat](/id/tools) - semua alat agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) - kontrol browser dalam lingkungan yang di-sandbox
- [Keamanan](/id/gateway/security) - risiko kontrol browser dan penguatan keamanan
