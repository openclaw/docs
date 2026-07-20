---
read_when:
    - Menambahkan otomatisasi browser yang dikendalikan agen
    - Men-debug alasan OpenClaw mengganggu Chrome Anda sendiri
    - Mengimplementasikan pengaturan browser + siklus hidup di aplikasi macOS
summary: Layanan kontrol browser terintegrasi + perintah tindakan
title: Browser (dikelola OpenClaw)
x-i18n:
    generated_at: "2026-07-20T03:58:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f87da83e30a15e4899b352c81a666d9e3324124781d103f443a75bc384382d36
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan oleh agen. Profil ini berjalan melalui layanan kontrol lokal kecil di dalam Gateway (khusus loopback) dan terisolasi dari browser pribadi Anda.

- Anggap saja sebagai **browser terpisah khusus agen**. Profil `openclaw` tidak pernah menyentuh profil browser pribadi Anda.
- Agen membuka tab, membaca halaman, mengeklik, dan mengetik dalam jalur terisolasi ini.
- Sebagai gantinya, profil bawaan `user` terhubung ke sesi Chrome nyata Anda yang sudah login melalui Chrome DevTools MCP.

## Yang Anda dapatkan

- Profil browser terpisah bernama **openclaw** (aksen oranye secara default).
- Kontrol tab deterministik (daftar/buka/fokus/tutup).
- Tindakan agen (klik/ketik/seret/pilih), snapshot, tangkapan layar, PDF.
- Profil berbasis Playwright menyimpan navigasi langsung ke lampiran di bawah direktori unduhan terkelola dan mengembalikan metadata `{ url, suggestedFilename, path }` setelah validasi kebijakan URL akhir.
- Tindakan agen berbasis Playwright mengembalikan array `downloads` dengan metadata terkelola yang sama ketika tindakan tersebut langsung memulai satu atau beberapa unduhan.
- Skills `browser-automation` bawaan yang mengajarkan agen tentang siklus pemulihan snapshot,
  tab stabil, referensi kedaluwarsa, dan penghambat manual ketika Plugin browser
  diaktifkan.
- Dukungan multiprofil opsional (`openclaw`, `work`, `remote`, ...).

Browser ini **bukan** browser harian Anda. Browser ini merupakan antarmuka yang aman dan terisolasi untuk
otomatisasi dan verifikasi agen.

Di macOS, Anda dapat secara eksplisit menyalin cookie dari profil sistem keluarga Chrome ke profil terkelola yang terpisah. Browser terkelola tetap menggunakan direktori data penggunanya sendiri; hanya cookie yang dipilih yang disalin, sedangkan penyimpanan lokal dan IndexedDB tidak ikut disalin. Lihat [Profil](#profiles-multi-browser) atau [referensi CLI `openclaw browser`](/id/cli/browser) untuk perintah dan batasan impor.

## Mulai cepat

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Browser dinonaktifkan" berarti Plugin atau `browser.enabled` dinonaktifkan; lihat
[Konfigurasi](#configuration) dan [Kontrol Plugin](#plugin-control).

Jika `openclaw browser` sama sekali tidak ada, atau agen menyatakan alat browser
tidak tersedia, langsung buka [Perintah atau alat browser tidak ada](#missing-browser-command-or-tool).

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

Pengaturan default memerlukan `plugins.entries.browser.enabled` **dan** `browser.enabled=true`. Menonaktifkan Plugin saja akan menghapus CLI `openclaw browser`, metode gateway `browser.request`, alat agen, dan layanan kontrol sebagai satu kesatuan; konfigurasi `browser.*` Anda tetap utuh untuk penggantinya.

Perubahan konfigurasi browser memerlukan mulai ulang Gateway agar Plugin dapat mendaftarkan ulang layanannya.

## Panduan agen

Catatan profil alat: `tools.profile: "coding"` mencakup `web_search` dan
`web_fetch`, tetapi tidak mencakup alat `browser` secara lengkap. Agar agen atau
subagen yang dibuat dapat menggunakan otomatisasi browser, tambahkan browser pada tahap
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

Plugin browser menyediakan dua tingkat panduan agen:

- Deskripsi alat `browser` memuat kontrak ringkas yang selalu aktif: pilih
  profil yang tepat, pertahankan referensi di tab yang sama, gunakan `tabId`/label untuk menargetkan
  tab, dan muat Skills browser untuk pekerjaan dengan beberapa langkah.
- Skills `browser-automation` bawaan memuat siklus operasi yang lebih panjang:
  periksa status/tab terlebih dahulu, beri label pada tab tugas, buat snapshot sebelum bertindak, buat ulang snapshot
  setelah perubahan UI, pulihkan referensi kedaluwarsa satu kali, dan laporkan penghambat login/2FA/captcha atau
  kamera/mikrofon sebagai tindakan manual alih-alih menebak.

Skills bawaan Plugin tercantum dalam Skills yang tersedia untuk agen ketika
Plugin diaktifkan. Instruksi Skills lengkap dimuat sesuai permintaan, sehingga giliran
rutin tidak menanggung biaya token penuh.

## Perintah atau alat browser tidak ada

Jika `openclaw browser` tidak dikenali setelah peningkatan versi, `browser.request` tidak ada, atau agen melaporkan bahwa alat browser tidak tersedia, penyebab umumnya adalah daftar `plugins.allow` yang tidak menyertakan `browser` dan tidak ada blok konfigurasi `browser` tingkat akar. Tambahkan:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Blok `browser` tingkat akar yang eksplisit (kunci apa pun di bawah `browser`, seperti
`browser.enabled=true` atau `browser.profiles.<name>`) mengaktifkan Plugin
browser bawaan meskipun `plugins.allow` membatasi, sesuai dengan perilaku konfigurasi
kanal bawaan. `plugins.entries.browser.enabled=true` dan
`tools.alsoAllow: ["browser"]` sendiri tidak dapat menggantikan keanggotaan dalam daftar yang diizinkan.
Menghapus `plugins.allow` sepenuhnya juga akan memulihkan pengaturan default.

## Profil: `openclaw`, `user`, `chrome`

- `openclaw`: browser terkelola dan terisolasi (tidak memerlukan ekstensi).
- `user`: profil koneksi Chrome DevTools MCP bawaan untuk sesi **Chrome nyata
  Anda yang sudah login**. Chrome menampilkan perintah konfirmasi "Allow remote debugging?"
  yang memblokir saat OpenClaw terhubung untuk pertama kalinya, sehingga seseorang harus berada di depan komputer.
- `chrome`: profil [ekstensi Chrome](/id/tools/chrome-extension) bawaan untuk
  sesi **Chrome nyata Anda yang sudah login**. Dapat digunakan dari ponsel tanpa perlu ada orang di
  depan komputer karena profil ini mengendalikan tab melalui ekstensi browser OpenClaw, bukan
  port debugging jarak jauh, sehingga perintah konfirmasi "Allow remote debugging?" tidak muncul.

Untuk panggilan alat browser agen:

- Default: gunakan browser `openclaw` yang terisolasi.
- Utamakan `profile="chrome"` (ekstensi) ketika sesi login yang ada diperlukan
  dan pengguna **berada jauh dari komputer** (Telegram, WhatsApp, dll.).
- Utamakan `profile="user"` (Chrome MCP) ketika sesi login yang ada diperlukan
  dan pengguna **berada di depan komputer** untuk menyetujui perintah konfirmasi koneksi.
- `profile` merupakan penggantian eksplisit ketika Anda menginginkan mode browser tertentu.

Atur `browser.defaultProfile: "openclaw"` jika Anda ingin mode terkelola digunakan secara default.

## Konfigurasi

Pengaturan browser berada di `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    evaluateEnabled: true, // default: true; false menonaktifkan act:evaluate (JS arbitrer)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // pilih hanya untuk akses jaringan privat tepercaya
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // penggantian profil tunggal lama
    tabCleanup: {
      enabled: true, // default: true
    },
    // snapshotDefaults: { mode: "efficient" }, // mode snapshot default ketika pemanggil tidak menentukannya
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
`mode` secara eksplisit; lihat [API kontrol browser](/id/tools/browser-control) untuk opsi
snapshot per panggilan.

### Kepemilikan pembersihan tab

Pembersihan tab sesi hanya berlaku untuk tab yang dibuat oleh alat browser OpenClaw
dengan `action: "open"`. OpenClaw tidak mengambil alih tab yang sudah terbuka,
dibuka oleh pengguna, atau yang kepemilikannya tidak diketahui. Blok
`browser.tabCleanup` mengontrol pemeriksaan berkala batas dan waktu menganggur untuk sesi
utama; menonaktifkannya tidak menonaktifkan pembersihan siklus hidup sesi secara eksplisit.

Untuk pembukaan lokal di host, kepemilikan dengan target CDP native dan identitas browser
yang stabil disimpan dalam status SQLite bersama. Catatan tersebut bertahan setelah Gateway
dimulai ulang dan tetap memenuhi syarat untuk `/new` serta pembersihan siklus hidup sesi lainnya;
pembersihan siklus hidup sesi mencakup berakhirnya sesi subagen, cron, dan ACP.
Catatan yang targetnya untuk alat merupakan target CDP native juga tetap memenuhi syarat
untuk pemeriksaan waktu menganggur dan batas per sesi setelah dimulai ulang. Handel target Chrome MCP
bersifat lokal bagi proses, sehingga catatan existing-session yang dingin menunggu pembersihan siklus hidup
alih-alih berisiko menjalani pemeriksaan waktu menganggur terhadap aktivitas yang tidak dapat dikaitkan
secara aman setelah dimulai ulang. Jalur persisten ini dapat mencakup profil yang dikelola OpenClaw,
profil CDP jarak jauh reguler, dan profil existing-session dengan
`cdpUrl` eksplisit, asalkan OpenClaw dapat menentukan target native dan identitas
browser yang stabil. Sebelum menutup catatan persisten, OpenClaw memverifikasi bahwa
profil dan instans browser yang dikonfigurasi masih cocok.

`--autoConnect` Chrome MCP, titik akhir CDP yang respons `/json/version`-nya tidak memiliki
identitas browser stabil, serta pembukaan yang target native-nya tidak dapat ditentukan
tetap menjadi pelacakan upaya terbaik yang bersifat lokal bagi proses. Semuanya dapat dibersihkan saat
proses Gateway tersebut berjalan, tetapi tidak ditutup secara otomatis setelah
Gateway dimulai ulang. Tab yang dibiarkan terbuka sebelum pelacakan persisten tersedia tidak
diambil alih secara retroaktif; tutup tab tersebut secara manual.

Pembersihan dilakukan berdasarkan upaya terbaik, bukan jaminan bahwa setiap tab yang memenuhi syarat akan langsung
ditutup. Kegagalan sementara dalam pemeriksaan kepemilikan atau penutupan membuat pembersihan
persisten tetap tertunda untuk dicoba kembali nanti.

### Visi tangkapan layar (dukungan model khusus teks)

Jika model utama hanya mendukung teks (tanpa dukungan visi/multimodal), tangkapan layar
browser mengembalikan blok gambar yang tidak dapat dibaca oleh model. Tangkapan layar browser
menggunakan kembali konfigurasi pemahaman gambar yang ada, sehingga model gambar
yang dikonfigurasi untuk memahami media dapat mendeskripsikan tangkapan layar sebagai teks tanpa
pengaturan model khusus browser.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Tambahkan kandidat cadangan; keberhasilan pertama digunakan
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Model media bersama juga berfungsi ketika ditandai untuk dukungan gambar.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Default model gambar yang ada juga tetap digunakan.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Cara kerjanya:**

1. Agen memanggil `browser screenshot` dan gambar disimpan ke disk seperti biasa.
2. Alat browser menanyakan kepada runtime pemahaman gambar yang ada apakah runtime tersebut
   dapat mendeskripsikan tangkapan layar menggunakan model gambar media yang dikonfigurasi, model media
   bersama, default model gambar, atau penyedia gambar yang didukung autentikasi.
3. Model visi mengembalikan deskripsi teks, yang dibungkus dengan
   `wrapExternalContent` (pelindung injeksi prompt) dan dikembalikan kepada agen
   sebagai blok teks, bukan blok gambar.
4. Jika pemahaman gambar tidak tersedia, dilewati, atau gagal, browser kembali
   mengembalikan blok gambar asli.

Blok gambar tangkapan layar adalah hasil alat privat: agen dapat memeriksanya,
tetapi OpenClaw tidak secara otomatis melampirkannya ke balasan saluran. Untuk membagikan
tangkapan layar, minta agen mengirimkannya secara eksplisit dengan alat pesan.

Gunakan bidang `tools.media.image` / `tools.media.models` yang ada untuk fallback
model, batas waktu, batas byte, profil, dan pengaturan permintaan penyedia.

Jika model utama yang aktif sudah mendukung visi dan tidak ada model pemahaman
gambar eksplisit yang dikonfigurasi, OpenClaw mempertahankan hasil gambar normal agar
model utama dapat membaca tangkapan layar secara langsung.

<AccordionGroup>

<Accordion title="Port dan keterjangkauan">

- Layanan kontrol terikat ke loopback pada port yang diturunkan dari `gateway.port` (default `18791` = gateway + 2). `OPENCLAW_GATEWAY_PORT` diprioritaskan daripada `gateway.port`; keduanya menggeser port turunan dalam kelompok yang sama.
- Profil `openclaw` lokal menetapkan `cdpPort`/`cdpUrl` secara otomatis dari rentang yang dimulai 9 port di atas port kontrol (default `18800`-`18899`); tetapkan nilai tersebut hanya untuk
  profil CDP jarak jauh atau pengaitan endpoint sesi yang sudah ada. `cdpUrl` secara default menggunakan
  port CDP lokal terkelola jika tidak ditetapkan.
- Keterjangkauan CDP jarak jauh dan `attachOnly`, handshake WebSocket, serta pengaktifan
  Chrome terkelola lokal menggunakan tenggat bawaan.
- Kegagalan berulang saat meluncurkan/mempersiapkan Chrome terkelola diputus oleh circuit breaker per
  profil. Setelah beberapa kegagalan berturut-turut, OpenClaw menjeda upaya
  peluncuran baru sejenak, alih-alih menjalankan Chromium pada setiap pemanggilan alat browser. Perbaiki
  masalah pengaktifan, nonaktifkan browser jika tidak diperlukan, atau mulai ulang
  Gateway setelah perbaikan.

</Accordion>

<Accordion title="Kebijakan SSRF">

- Permintaan navigasi browser dan pembukaan tab diperiksa terlebih dahulu. Selama tindakan dan masa toleransi pascatindakan yang terbatas, interaksi Playwright yang dilindungi (klik, klik koordinat, arahkan kursor, seret, gulir, pilih, tekan, ketik, isi formulir, dan evaluasi) mencegat pemuatan dokumen tingkat atas dan subframe yang ditolak kebijakan sebelum byte permintaan HTTP, lalu sebisa mungkin memeriksa ulang URL `http(s)` akhir.
- Sebelum setiap peluncuran baru Chrome yang dikelola OpenClaw, OpenClaw sebisa mungkin menonaktifkan prediksi jaringan untuk menekan preconnect spekulatif Chromium yang teramati bagi pemuatan yang ditolak tersebut. Ini merupakan pertahanan berlapis, bukan batas kebijakan: browser yang digunakan kembali setelah layanan kontrol dimulai ulang dan backend browser lainnya mungkin tidak menerapkan penguatan yang sama. Perutean Playwright tetap bukan firewall jaringan dan tidak mencegat lompatan pengalihan, permintaan pertama popup, lalu lintas Service Worker, kode halaman yang berjalan setelah jendela perlindungan terbatas, atau setiap jalur latar belakang/subsumber daya. Isolasi egress menyeluruh memerlukan isolasi dari pihak pemilik atau proksi yang menerapkan kebijakan.
- Dalam mode SSRF ketat, penemuan endpoint CDP jarak jauh dan probe `/json/version` (`cdpUrl`) juga diperiksa.
- Variabel lingkungan `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan `NO_PROXY` Gateway/penyedia tidak secara otomatis memproksikan browser yang dikelola OpenClaw. Chrome terkelola diluncurkan secara langsung secara default agar pengaturan proksi penyedia tidak melemahkan pemeriksaan SSRF browser.
- Probe kesiapan CDP lokal yang dikelola OpenClaw dan koneksi WebSocket DevTools melewati proksi jaringan terkelola untuk endpoint loopback yang diluncurkan secara tepat, sehingga `openclaw browser start` tetap berfungsi saat proksi operator memblokir egress loopback.
- Untuk memproksikan browser terkelola itu sendiri, teruskan flag proksi Chrome secara eksplisit melalui `browser.extraArgs`, seperti `--proxy-server=...` atau `--proxy-pac-url=...`. Mode SSRF ketat memblokir perutean proksi browser eksplisit kecuali akses browser jaringan privat sengaja diaktifkan.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan secara default; aktifkan hanya jika akses browser jaringan privat sengaja dipercaya.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.

</Accordion>

<Accordion title="Perilaku profil">

- `attachOnly: true` berarti jangan pernah meluncurkan browser lokal; hanya kaitkan jika browser sudah berjalan.
- `headless` dapat ditetapkan secara global atau per profil terkelola lokal. Nilai per profil menggantikan `browser.headless`, sehingga satu profil yang diluncurkan secara lokal dapat tetap headless sementara profil lainnya tetap terlihat.
- `POST /start?headless=true` dan `openclaw browser start --headless` meminta
  peluncuran headless sekali pakai untuk profil terkelola lokal tanpa menulis ulang
  `browser.headless` atau konfigurasi profil. Profil sesi yang sudah ada, hanya-kait,
  dan CDP jarak jauh menolak penggantian tersebut karena OpenClaw tidak meluncurkan
  proses browser tersebut.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil terkelola lokal
  secara otomatis menggunakan mode headless secara default ketika lingkungan maupun konfigurasi
  profil/global tidak secara eksplisit memilih mode headed. Gunakan bentuk tingkat browser yang tidak ambigu
  `openclaw browser --json status`; `openclaw browser status --json` di bagian akhir
  juga berfungsi karena `status` tidak mendefinisikan `--json` miliknya sendiri. Perintah melaporkan
  `headlessSource` sebagai `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, atau `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` memaksa peluncuran terkelola lokal menggunakan mode headless untuk
  proses saat ini. `OPENCLAW_BROWSER_HEADLESS=0` memaksa mode headed untuk pengaktifan
  biasa dan mengembalikan kesalahan yang dapat ditindaklanjuti pada host Linux tanpa server tampilan;
  permintaan `start --headless` eksplisit tetap diprioritaskan untuk peluncuran tersebut.
- Rute kontrol browser dan klien terprogram mempertahankan `error`
  kesalahan tanpa tampilan yang mudah dibaca manusia serta mengekspos alasan stabil
  `no_display_for_headed_profile`. `details` miliknya hanya berisi `profile`,
  `requestedHeadless`, `headlessSource`, dan `displayPresent`, sehingga klien API dapat
  memilih perbaikan yang tepat tanpa mencocokkan teks pesan.
- Untuk profil terkelola lokal yang sedang berjalan, status dan doctor meminta endpoint CDP
  tingkat browser Chrome untuk informasi perender, backend, perangkat/driver, status
  fitur, solusi sementara driver, dan kemampuan video terakselerasi. Hasilnya
  di-cache untuk proses browser tersebut dan diekspos secara lengkap oleh
  `openclaw browser --json status`. Pemanggilan status pasif tidak meluncurkan Chrome.
  Browser sesi yang sudah ada, ekstensi, CDP jarak jauh, dan sandbox tetap terpisah
  serta tidak diperiksa melalui jalur host terkelola ini.
- Chrome terkelola headless tetap menggunakan default `--disable-gpu` yang konservatif.
  Diagnostik tidak mengaktifkan akselerasi, menambahkan pengaturan akselerasi global,
  atau memberikan akses perangkat browser sandbox.
- `executablePath` dapat ditetapkan secara global atau per profil terkelola lokal. Nilai per profil menggantikan `browser.executablePath`, sehingga profil terkelola yang berbeda dapat meluncurkan browser berbasis Chromium yang berbeda. Kedua bentuk menerima `~` untuk direktori beranda OS Anda.
- `color` (tingkat atas dan per profil) memberi warna pada UI browser agar Anda dapat melihat profil yang aktif.
- Profil default adalah `openclaw` (mandiri terkelola). Gunakan `defaultProfile: "user"` untuk memilih menggunakan browser pengguna yang sudah masuk.
- Urutan deteksi otomatis: browser default sistem jika berbasis Chromium; jika tidak, Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP, bukan CDP mentah. Profil ini dapat dikaitkan melalui koneksi otomatis Chrome MCP, atau melalui `cdpUrl` jika Anda sudah memiliki endpoint DevTools untuk browser yang sedang berjalan.
- `driver: "extension"` mengendalikan Chrome yang sudah Anda masuki melalui [ekstensi Chrome OpenClaw](/id/tools/chrome-extension). Relay memiliki endpoint loopback-nya, sehingga profil ini tidak menerima `cdpUrl`. Ini adalah satu-satunya mode browser yang sudah masuk yang berfungsi tanpa seorang pun berada di depan komputer.
- Tetapkan `browser.profiles.<name>.userDataDir` ketika profil sesi yang sudah ada harus dikaitkan ke profil pengguna Chromium non-default (Brave, Edge, dll.). Jalur ini juga menerima `~` untuk direktori beranda OS Anda.

</Accordion>

</AccordionGroup>

## Menggunakan Brave atau browser berbasis Chromium lainnya

Jika browser **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll.),
OpenClaw menggunakannya secara otomatis. Tetapkan `browser.executablePath` untuk mengganti
deteksi otomatis. Nilai `executablePath` tingkat atas dan per profil menerima `~`
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

`executablePath` per profil hanya memengaruhi profil terkelola lokal yang diluncurkan
OpenClaw. Sebaliknya, profil `existing-session` dikaitkan ke browser yang sudah berjalan,
dan profil CDP jarak jauh menggunakan browser di balik `cdpUrl`.

## Kontrol lokal dibandingkan dengan jarak jauh

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan browser lokal.
- **Kontrol jarak jauh (host node):** jalankan host node pada mesin yang memiliki browser; Gateway memproksikan tindakan browser kepadanya.
- **CDP jarak jauh:** tetapkan `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  dikaitkan ke browser berbasis Chromium jarak jauh. Dalam hal ini, OpenClaw tidak akan meluncurkan browser lokal.
- Untuk layanan CDP yang dikelola secara eksternal pada loopback (misalnya Browserless dalam
  Docker yang dipublikasikan ke `127.0.0.1`), tetapkan juga `attachOnly: true`. CDP loopback
  tanpa `attachOnly` diperlakukan sebagai profil browser lokal yang dikelola OpenClaw.
- `headless` hanya memengaruhi profil terkelola lokal yang diluncurkan OpenClaw. Nilai ini tidak memulai ulang atau mengubah browser sesi yang sudah ada maupun CDP jarak jauh.
- `executablePath` mengikuti aturan profil terkelola lokal yang sama. Mengubahnya pada
  profil terkelola lokal yang sedang berjalan menandai profil tersebut untuk dimulai ulang/diselaraskan agar
  peluncuran berikutnya menggunakan biner baru.

Perilaku penghentian berbeda menurut mode profil:

- profil terkelola lokal: `openclaw browser stop` menghentikan proses browser yang
  diluncurkan OpenClaw
- profil hanya-kait dan CDP jarak jauh: `openclaw browser stop` menutup sesi
  kontrol aktif dan melepaskan penggantian emulasi Playwright/CDP (viewport,
  skema warna, lokal, zona waktu, mode offline, dan status serupa), meskipun
  tidak ada proses browser yang diluncurkan oleh OpenClaw

URL CDP jarak jauh dapat menyertakan autentikasi:

- Token kueri (misalnya, `https://provider.example?token=<token>`)
- Autentikasi HTTP Basic (misalnya, `https://user:pass@provider.example`)

OpenClaw mempertahankan autentikasi saat memanggil endpoint `/json/*` dan saat terhubung
ke WebSocket CDP. Utamakan variabel lingkungan atau pengelola rahasia untuk
token daripada memasukkannya ke file konfigurasi.

## Proksi browser Node (bawaan tanpa konfigurasi)

Jika Anda menjalankan **host node** pada mesin yang memiliki browser, OpenClaw dapat
secara otomatis merutekan panggilan alat browser ke node tersebut tanpa konfigurasi browser tambahan.
Ini adalah jalur bawaan untuk gateway jarak jauh.

Catatan:

- Host node mengekspos server kontrol browser lokalnya melalui **perintah proksi**.
- Profil berasal dari konfigurasi `browser.profiles` milik node sendiri (sama seperti lokal).
- Perintah proksi tidak pernah mengizinkan mutasi profil persisten (`create-profile`, `delete-profile`, `reset-profile`) terlepas dari `allowProfiles`; lakukan perubahan tersebut langsung pada node.
- `nodeHost.browserProxy.allowProfiles` bersifat opsional. Biarkan kosong untuk perilaku lama/bawaan: semua profil yang dikonfigurasi tetap dapat dijangkau melalui proksi.
- Jika Anda menetapkan `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas hak akses minimum yang membatasi nama profil yang dapat ditargetkan oleh proksi.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Pada node: `nodeHost.browserProxy.enabled=false`
  - Pada gateway: `gateway.nodes.browser.mode="off"` (juga menerima `"auto"` untuk memilih satu node browser yang terhubung, atau `"manual"` untuk mewajibkan parameter node eksplisit)

## Browserless (CDP jarak jauh yang di-host)

[Browserless](https://browserless.io) adalah layanan Chromium yang di-host dan mengekspos
URL koneksi CDP melalui HTTPS dan WebSocket. OpenClaw dapat menggunakan kedua bentuk tersebut, tetapi
untuk profil browser jarak jauh, opsi paling sederhana adalah URL WebSocket langsung
dari dokumentasi koneksi Browserless.

Contoh:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
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
- Jika Browserless memberi Anda URL dasar HTTPS, Anda dapat mengubahnya menjadi
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

Alamat dalam `browser.profiles.browserless.cdpUrl` harus dapat dijangkau dari
proses OpenClaw. Browserless juga harus mengiklankan endpoint sesuai yang dapat dijangkau;
tetapkan `EXTERNAL` Browserless ke basis WebSocket publik-ke-OpenClaw yang sama, seperti
`ws://127.0.0.1:3000`, `ws://browserless:3000`, atau alamat jaringan Docker privat
yang stabil. Jika `/json/version` mengembalikan `webSocketDebuggerUrl` yang mengarah ke
alamat yang tidak dapat dijangkau OpenClaw, HTTP CDP dapat tampak sehat sementara
penautan WebSocket tetap gagal.

Jangan biarkan `attachOnly` tidak ditetapkan untuk profil Browserless loopback. Tanpa
`attachOnly`, OpenClaw memperlakukan port loopback sebagai profil browser lokal
yang dikelola dan mungkin melaporkan bahwa port sedang digunakan tetapi tidak dimiliki oleh OpenClaw.

## Penyedia CDP WebSocket langsung

Beberapa layanan browser yang di-host mengekspos endpoint **WebSocket langsung**, bukan
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
  menerimanya, OpenClaw juga melakukan fallback ke root tersebut. Hal ini memungkinkan `ws://`
  polos yang diarahkan ke Chrome lokal tetap terhubung, karena Chrome hanya menerima upgrade WebSocket
  pada jalur spesifik per target dari `/json/version`, sementara penyedia
  yang di-host tetap dapat menggunakan endpoint WebSocket root mereka ketika endpoint penemuannya
  mengiklankan URL berumur pendek yang tidak sesuai untuk CDP Playwright.

`openclaw browser doctor` menggunakan logika penemuan-terlebih-dahulu dan fallback-WebSocket
yang sama seperti penautan runtime, sehingga URL root polos yang berhasil terhubung tidak
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
- Browserbase secara otomatis membuat sesi browser saat WebSocket terhubung, sehingga
  tidak diperlukan langkah pembuatan sesi manual.
- Lihat [harga](https://www.browserbase.com/pricing) untuk batas tingkat gratis dan paket berbayar saat ini.
- Lihat [dokumentasi Browserbase](https://docs.browserbase.com) untuk referensi API lengkap,
  panduan SDK, dan contoh integrasi.

### Notte

[Notte](https://www.notte.cc) adalah platform cloud untuk menjalankan browser
headless dengan mode siluman bawaan, proksi residensial, dan gateway WebSocket
asli CDP.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
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
  autentikasi bearer token gateway, `x-openclaw-password`, atau autentikasi HTTP Basic dengan
  kata sandi gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"`
  **tidak** mengautentikasi API browser loopback mandiri ini.
- Jika kontrol browser diaktifkan dan tidak ada autentikasi rahasia bersama yang dikonfigurasi, OpenClaw
  secara otomatis membuat dan menyimpan kredensial kontrol browser saat memulai:
  token ketika `gateway.auth.mode` adalah `none`, atau kata sandi ketika nilainya
  `trusted-proxy` (disimpan melalui `gateway.auth.password` agar klien
  loopback di luar proses dapat mengatasinya). Pembuatan otomatis dilewati ketika kredensial
  string eksplisit sudah dikonfigurasi untuk mode tersebut, atau ketika
  `gateway.auth.mode` adalah `password`.
- Konfigurasikan `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, atau
  `OPENCLAW_GATEWAY_PASSWORD` secara eksplisit jika Anda menginginkan rahasia stabil yang Anda kendalikan,
  bukan rahasia yang dibuat secara otomatis.

Kiat CDP jarak jauh:

- Utamakan endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek jika memungkinkan.
- Hindari menyematkan token berumur panjang secara langsung dalam file konfigurasi.
- Pertahankan Gateway dan semua host node dalam jaringan privat (Tailscale); hindari eksposur publik.
- Perlakukan URL/token CDP jarak jauh sebagai rahasia; utamakan variabel lingkungan atau pengelola rahasia.

## Profil (multi-browser)

OpenClaw mendukung beberapa profil bernama (konfigurasi perutean). Profil dapat berupa:

- **dikelola OpenClaw**: instans browser berbasis Chromium khusus dengan direktori data pengguna + port CDP sendiri
- **jarak jauh**: URL CDP eksplisit (browser berbasis Chromium yang berjalan di tempat lain)
- **sesi yang sudah ada**: profil Chrome Anda yang sudah ada melalui koneksi otomatis Chrome DevTools MCP

Bawaan:

- Profil `openclaw` dibuat secara otomatis jika tidak ada.
- Profil `user` tersedia secara bawaan untuk penautan sesi yang sudah ada melalui Chrome MCP.
- Profil sesi yang sudah ada bersifat opsional selain `user`; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800-18899** secara bawaan.
- Menghapus profil memindahkan direktori data lokalnya ke Trash.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Sesi yang sudah ada melalui Chrome DevTools MCP

OpenClaw juga dapat menautkan ke profil browser berbasis Chromium yang sedang berjalan melalui
server resmi Chrome DevTools MCP. Ini menggunakan kembali tab dan status login
yang sudah terbuka dalam profil browser tersebut.

Referensi latar belakang dan penyiapan resmi:

- [Chrome untuk Pengembang: Menggunakan Chrome DevTools MCP dengan sesi browser Anda](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan: `user`. Buat profil sesi yang sudah ada kustom jika
Anda menginginkan nama, warna, atau direktori data browser yang berbeda.

Secara bawaan, profil `user` bawaan menggunakan koneksi otomatis Chrome MCP, yang
menargetkan profil Google Chrome lokal bawaan. Gunakan `userDataDir` untuk Brave,
Edge, Chromium, atau profil Chrome nonbawaan. `~` diperluas menjadi direktori beranda
sistem operasi Anda:

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

Kemudian, pada browser yang sesuai:

1. Buka halaman inspeksi browser tersebut untuk debugging jarak jauh.
2. Aktifkan debugging jarak jauh.
3. Biarkan browser tetap berjalan dan setujui permintaan koneksi ketika OpenClaw menautkan.

Halaman inspeksi umum:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Uji singkat penautan langsung:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Tampilan saat berhasil:

- `status` menampilkan `driver: existing-session`
- `status` menampilkan `transport: chrome-mcp`
- `status` menampilkan `running: true`
- `tabs` mencantumkan tab browser Anda yang sudah terbuka
- `snapshot` mengembalikan ref dari tab aktif yang dipilih

Hal yang perlu diperiksa jika penyambungan tidak berfungsi:

- browser target berbasis Chromium menggunakan versi `144+`
- debugging jarak jauh diaktifkan di halaman inspeksi browser tersebut
- browser menampilkan prompt persetujuan penyambungan dan Anda menerimanya
- jika Chrome dimulai dengan `--remote-debugging-port` eksplisit, atur
  `browser.profiles.<name>.cdpUrl` ke endpoint DevTools tersebut alih-alih mengandalkan
  koneksi otomatis Chrome MCP
- `openclaw doctor` memigrasikan konfigurasi browser lama berbasis ekstensi dan memeriksa bahwa
  Chrome terinstal secara lokal untuk profil koneksi otomatis bawaan, tetapi tidak dapat
  mengaktifkan debugging jarak jauh di sisi browser untuk Anda

Penggunaan oleh agen:

- Gunakan `profile="user"` saat Anda memerlukan status browser pengguna yang sudah masuk.
- Jika Anda menggunakan profil sesi yang sudah ada khusus, teruskan nama profil eksplisit tersebut.
- Pilih mode ini hanya ketika pengguna berada di depan komputer untuk menyetujui prompt
  penyambungan.
- Host Gateway atau Node dapat menjalankan `npx chrome-devtools-mcp@latest --autoConnect`.

Catatan:

- Jalur ini memiliki risiko lebih tinggi daripada profil `openclaw` yang terisolasi karena dapat
  bertindak di dalam sesi browser Anda yang sudah masuk.
- OpenClaw tidak meluncurkan browser untuk driver ini; OpenClaw hanya menyambungkannya.
- OpenClaw menggunakan alur resmi Chrome DevTools MCP `--autoConnect` di sini. Jika
  `userDataDir` ditetapkan, nilai tersebut diteruskan untuk menargetkan direktori data pengguna itu.
- Sesi yang sudah ada dapat disambungkan pada host yang dipilih atau melalui
  Node browser yang terhubung. Jika Chrome berada di tempat lain dan tidak ada Node browser yang terhubung, gunakan
  CDP jarak jauh atau host Node sebagai gantinya.
- Target Chrome MCP dan ref snapshot dibatasi pada satu subproses MCP. Setelah
  proses tersebut dimulai ulang, jalankan kembali `browser tabs`, pilih target baru secara eksplisit
  sebelum melakukan pekerjaan khusus target, dan ambil snapshot baru sebelum menggunakan ref.
  Setiap ref hanya berlaku untuk target dan snapshot terbarunya. Alias lama tidak
  dipindahkan ke tab pengganti, meskipun URL-nya cocok.
- Chrome DevTools MCP saat ini merutekan alat halaman berdasarkan ID halaman numerik
  lokal proses. Handle yang dibatasi per proses mencegah penggunaan kembali setelah penggantian subproses, tetapi
  penggantian konteks browser dalam proses di antara pemanggilan alat yang berurutan masih dapat
  mengalihkan target tindakan. Perutean yang sepenuhnya atomik memerlukan dukungan alat halaman dari upstream
  untuk ID target yang stabil.

### Peluncuran Chrome MCP khusus

Ganti server Chrome DevTools MCP yang dijalankan untuk setiap profil jika alur
`npx chrome-devtools-mcp@latest` bawaan tidak sesuai dengan kebutuhan Anda (host luring,
versi yang disematkan, biner yang disertakan):

| Bidang        | Fungsinya                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Berkas yang dapat dieksekusi untuk dijalankan sebagai pengganti `npx`. Di-resolve apa adanya; path absolut digunakan.                                          |
| `mcpArgs`    | Array argumen yang diteruskan apa adanya ke `mcpCommand`. Menggantikan argumen `chrome-devtools-mcp@latest --autoConnect` bawaan. |

Ketika `cdpUrl` ditetapkan pada profil sesi yang sudah ada, OpenClaw melewati
`--autoConnect` dan meneruskan endpoint ke Chrome MCP secara otomatis:

- `http(s)://...` → `--browserUrl <url>` (endpoint penemuan HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP langsung).

Flag endpoint dan `userDataDir` tidak dapat digabungkan: ketika `cdpUrl` ditetapkan,
`userDataDir` diabaikan untuk peluncuran Chrome MCP karena Chrome MCP tersambung ke
browser yang sedang berjalan di balik endpoint, bukan membuka direktori
profil.

<Accordion title="Batasan fitur sesi yang sudah ada">

Dibandingkan dengan profil `openclaw` terkelola, driver sesi yang sudah ada lebih terbatas:

- **Tangkapan layar** - tangkapan halaman dan tangkapan elemen `--ref` berfungsi; pemilih CSS `--element` tidak. Playwright tidak diperlukan untuk tangkapan layar halaman atau elemen berbasis ref. (`--full-page` tidak dapat digabungkan dengan `--ref` atau `--element` pada profil apa pun, bukan hanya sesi yang sudah ada.)
- **Tindakan** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan ref snapshot (tanpa pemilih CSS). `click-coords` mengeklik koordinat viewport yang terlihat dan tidak memerlukan ref snapshot. `click` hanya mendukung tombol kiri (tanpa penggantian tombol atau tombol pengubah). `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`. `press` tidak mendukung `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, dan `fill` tidak mendukung penggantian `timeoutMs` per pemanggilan; `evaluate` mendukungnya. `select` menerima satu nilai. `batch` tidak didukung; kirim tindakan satu per satu.
- **Menunggu / unggah / dialog** - `wait --url` mendukung pola persis, substring, dan glob (sama seperti profil terkelola); `wait --load networkidle` tidak didukung pada profil sesi yang sudah ada (fitur ini berfungsi pada profil CDP terkelola dan mentah/jarak jauh). Hook unggahan memerlukan `ref` atau `inputRef`, satu berkas dalam satu waktu, tanpa `element` CSS. Hook dialog tidak mendukung penggantian batas waktu atau `dialogId`.
- **Visibilitas dialog** - Respons tindakan browser terkelola menyertakan `blockedByDialog` dan `browserState.dialogs.pending` ketika suatu tindakan membuka dialog modal; snapshot juga menyertakan status dialog yang tertunda. Tanggapi dengan `browser dialog --accept/--dismiss --dialog-id <id>` selagi dialog tertunda. Dialog yang ditangani di luar OpenClaw muncul di bawah `browserState.dialogs.recent`.
- **Fitur khusus terkelola** - Ekspor PDF, intersepsi unduhan, dan `responsebody` tetap memerlukan jalur browser terkelola.

</Accordion>

## Jaminan isolasi

- **Direktori data pengguna khusus**: tidak pernah menyentuh profil browser pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah konflik dengan alur kerja pengembangan.
- **Kontrol tab deterministik**: `tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu
  handle `tabId` yang stabil seperti `t1`, label opsional, dan `targetId` mentah.
  Agen harus menggunakan kembali `suggestedTargetId`; ID mentah tetap tersedia untuk
  debugging dan kompatibilitas.

## Pemilihan browser

Saat meluncurkan secara lokal, OpenClaw memilih yang pertama tersedia:

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

Untuk pembuatan skrip dan debugging, Gateway menyediakan **API kontrol HTTP khusus
loopback** berukuran kecil serta CLI `openclaw browser` yang sesuai (snapshot, ref, peningkatan kemampuan tunggu,
output JSON, alur kerja debugging). Lihat
[API kontrol browser](/id/tools/browser-control) untuk referensi lengkap.

## Pemecahan masalah

Untuk masalah khusus Linux (terutama Chromium snap), lihat
[Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting).

Untuk penyiapan host terpisah antara Gateway WSL2 dan Chrome Windows, lihat
[Pemecahan masalah WSL2 + Windows + CDP Chrome jarak jauh](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Kegagalan memulai CDP vs pemblokiran SSRF navigasi

Keduanya merupakan kelas kegagalan yang berbeda dan mengarah ke jalur kode yang berbeda.

- **Kegagalan memulai atau kesiapan CDP** berarti OpenClaw tidak dapat memastikan bahwa bidang kontrol browser dalam kondisi sehat.
- **Pemblokiran SSRF navigasi** berarti bidang kontrol browser dalam kondisi sehat, tetapi target navigasi halaman ditolak oleh kebijakan.

Contoh umum:

- Kegagalan memulai atau kesiapan CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` ketika
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
- Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, bidang kontrol browser sudah aktif dan kegagalan berada pada kebijakan navigasi atau halaman target.
- Jika `start`, `tabs`, dan `open` semuanya berhasil, jalur kontrol browser terkelola dasar dalam kondisi sehat.

Detail perilaku penting:

- Konfigurasi browser secara bawaan menggunakan objek kebijakan SSRF yang menolak saat gagal, meskipun Anda tidak mengonfigurasi `browser.ssrfPolicy`.
- Untuk profil terkelola `openclaw` loopback lokal, pemeriksaan kesehatan CDP sengaja melewati penerapan keterjangkauan SSRF browser untuk bidang kontrol lokal milik OpenClaw.
- Perlindungan navigasi bersifat terpisah. Hasil `start` atau `tabs` yang berhasil tidak berarti target `open` atau `navigate` berikutnya diizinkan.

Panduan keamanan:

- **Jangan** melonggarkan kebijakan SSRF browser secara bawaan.
- Utamakan pengecualian host yang sempit seperti `hostnameAllowlist` atau `allowedHostnames` daripada akses jaringan privat yang luas.
- Gunakan `dangerouslyAllowPrivateNetwork: true` hanya di lingkungan yang memang tepercaya, tempat akses browser ke jaringan privat diperlukan dan telah ditinjau.

## Alat agen + cara kerja kontrol

Agen mendapatkan **satu alat** untuk otomatisasi browser:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Pemetaan cara kerjanya:

- `browser snapshot` mengembalikan pohon UI yang stabil (AI atau ARIA).
- `browser act` menggunakan ID `ref` dari snapshot untuk mengeklik/mengetik/menyeret/memilih.
- `browser screenshot` menangkap piksel (halaman penuh, elemen, atau referensi berlabel).
- `browser doctor` memeriksa kesiapan Gateway, plugin, profil, browser, dan tab.
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP jarak jauh).
  - `target` (`sandbox` | `host` | `node`) untuk memilih lokasi browser dijalankan.
  - Dalam sesi yang di-sandbox, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` tidak disertakan: sesi yang di-sandbox secara default menggunakan `sandbox`, sedangkan sesi tanpa sandbox secara default menggunakan `host`.
  - Jika Node berkemampuan browser terhubung, alat ini dapat merutekan secara otomatis ke Node tersebut kecuali Anda menetapkan `target="host"` atau `target="node"`.

Hal ini menjaga agen tetap deterministik dan menghindari selektor yang rapuh.

## Terkait

- [Ikhtisar Alat](/id/tools) - semua alat agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) - kontrol browser di lingkungan yang di-sandbox
- [Keamanan](/id/gateway/security) - risiko kontrol browser dan penguatan keamanan
