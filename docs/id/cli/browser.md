---
read_when:
    - Anda menggunakan `openclaw browser` dan menginginkan contoh untuk tugas umum
    - Anda ingin mengendalikan browser yang berjalan di mesin lain melalui host node
    - Anda ingin terhubung ke Chrome lokal yang sudah digunakan untuk masuk melalui Chrome MCP
summary: Referensi CLI untuk `openclaw browser` (siklus hidup, profil, tab, tindakan, status, dan debugging)
title: Peramban
x-i18n:
    generated_at: "2026-07-16T17:53:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Kelola permukaan kontrol browser OpenClaw dan jalankan tindakan browser: siklus hidup, profil, tab, snapshot, tangkapan layar, navigasi, input, emulasi status, dan debugging.

Terkait: [Alat browser](/id/tools/browser)

## Flag umum

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (secara default menggunakan konfigurasi).
- `--token <token>`: token Gateway (jika diperlukan).
- `--timeout <ms>`: batas waktu permintaan dalam ms (default: `30000`).
- `--expect-final`: tunggu respons akhir Gateway.
- `--browser-profile <name>`: pilih profil browser (default: `openclaw`, atau `browser.defaultProfile`).
- `--json`: keluaran yang dapat dibaca mesin (jika didukung). Ini adalah opsi tingkat browser, jadi
  letakkan sebelum subperintah agar bentuknya tidak ambigu, seperti
  `openclaw browser --json status`. Penempatan di belakang seperti
  `openclaw browser status --json` juga berfungsi jika perintah turunan yang dipilih tidak
  mendefinisikan `--json` miliknya sendiri.

## Mulai cepat (lokal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agen dapat menjalankan pemeriksaan kesiapan yang sama dengan `browser({ action: "doctor" })`.

## Pemecahan masalah cepat

Jika `start` gagal dengan `not reachable after start`, selesaikan masalah kesiapan CDP terlebih dahulu. Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, bidang kontrol browser dalam keadaan sehat dan kegagalan biasanya disebabkan oleh pemblokiran kebijakan SSRF navigasi.

Urutan minimal:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Panduan terperinci: [Pemecahan masalah browser](/id/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Siklus hidup

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

- `doctor --deep` menambahkan pemeriksaan snapshot langsung: berguna ketika kesiapan CDP dasar sudah baik, tetapi diperlukan bukti bahwa tab saat ini dapat diperiksa.
- Untuk profil terkelola lokal yang sedang berjalan, `status` dan `doctor` melaporkan diagnostik
  grafis yang di-cache dari Chrome: klasifikasi perangkat keras/perangkat lunak, perender,
  backend, perangkat/driver, detail fitur dan status penonaktifan, serta kemampuan
  video terakselerasi. `openclaw browser --json status` mengembalikan seluruh payload terstruktur.
  Status pasif tidak pernah meluncurkan Chrome hanya untuk mengumpulkan fakta ini.
- `stop` menutup sesi kontrol aktif dan menghapus penggantian emulasi sementara, bahkan untuk `attachOnly` dan profil CDP jarak jauh ketika OpenClaw tidak meluncurkan proses browser itu sendiri. Untuk profil terkelola lokal, `stop` juga menghentikan proses browser yang dijalankan.
- `start --headless` hanya berlaku untuk permintaan mulai tersebut, dan hanya ketika OpenClaw meluncurkan browser terkelola lokal. Opsi ini tidak menulis ulang `browser.headless` atau konfigurasi profil, serta tidak melakukan apa pun untuk browser yang sudah berjalan.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil terkelola lokal otomatis berjalan tanpa antarmuka grafis, kecuali `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false`, atau `browser.profiles.<name>.headless=false` secara eksplisit meminta browser yang terlihat.

## Jika perintah tidak tersedia

Jika `openclaw browser` merupakan perintah yang tidak dikenal, periksa `plugins.allow` di `~/.openclaw/openclaw.json`. Jika `plugins.allow` tersedia, cantumkan Plugin browser bawaan secara eksplisit, kecuali konfigurasi sudah memiliki blok `browser` tingkat akar:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Blok `browser` tingkat akar yang eksplisit (misalnya `browser.enabled=true` atau `browser.profiles.<name>`) juga mengaktifkan Plugin browser bawaan di bawah daftar izin Plugin yang ketat.

Terkait: [Alat browser](/id/tools/browser#missing-browser-command-or-tool)

## Profil

Profil adalah konfigurasi perutean browser yang memiliki nama:

- `openclaw` (default): meluncurkan atau terhubung ke instans Chrome khusus yang dikelola OpenClaw (direktori data pengguna terisolasi).
- `user`: mengontrol sesi Chrome Anda yang sudah login melalui Chrome DevTools MCP.
- profil CDP kustom: mengarah ke endpoint CDP lokal atau jarak jauh.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Gunakan profil tertentu dengan `--browser-profile <name>` pada subperintah apa pun, misalnya `openclaw browser --browser-profile work tabs`.

Di macOS, `system-profiles` mencantumkan profil Chrome, Brave, Edge, atau Chromium sebenarnya yang tersedia di host. `import-profile` mendekripsi cookie profil tersebut setelah satu perintah persetujuan macOS Keychain/Touch ID dan menyuntikkannya ke profil baru yang dikelola OpenClaw. Fitur ini hanya mengimpor cookie; penyimpanan lokal dan IndexedDB tidak berubah. Beberapa sesi Google menggunakan kredensial sesi yang terikat ke perangkat (DBSC) dan mungkin masih memerlukan autentikasi ulang setelah impor.

Ketika aplikasi macOS menggunakan Gateway lokal, aplikasi dapat menawarkan impor ini sekali dan menjadikan profil impor yang terisolasi sebagai default untuk penjelajahan agen. Impor selalu memerlukan klik eksplisit; impor yang berhasil atau penolakan akan mencegah perintah otomatis berikutnya, dan **Settings → General → Browser login** tetap tersedia untuk mengimpor ulang.

Impor profil sistem diaktifkan secara default. Atur `browser.allowSystemProfileImport=false` untuk menonaktifkan impor yang dipicu oleh CLI maupun agen. Impor bersifat lokal pada host dan tidak dapat dijalankan melalui proksi Node browser.

## Tab

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu `tabId` yang stabil (seperti `t1`), label opsional, dan `targetId` mentah. Teruskan kembali `suggestedTargetId` ke `focus`, `close`, snapshot, dan tindakan. Tetapkan label dengan `open --label`, `tab new --label`, atau `tab label`; label, id tab, id target mentah, dan prefiks id target unik semuanya diterima. Bidang permintaan masih bernama `targetId` demi kompatibilitas, tetapi menerima semua referensi tab tersebut.

Id target mentah adalah handel diagnostik volatil, bukan memori agen yang tahan lama: ketika Chromium mengganti target mentah yang mendasarinya selama navigasi atau pengiriman formulir, OpenClaw tetap mengaitkan `tabId`/label yang stabil ke tab pengganti jika kecocokannya dapat dibuktikan. Utamakan `suggestedTargetId`.

## Snapshot / tangkapan layar / tindakan

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Tangkapan layar:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` hanya untuk tangkapan halaman; opsi ini tidak dapat digabungkan dengan `--ref` atau `--element`.
- Profil `existing-session` / `user` mendukung tangkapan layar halaman dan tangkapan layar `--ref` dari keluaran snapshot, tetapi tidak mendukung tangkapan layar CSS `--element`.
- `--labels` menempatkan referensi snapshot saat ini sebagai lapisan di atas tangkapan layar. Pada profil berbasis Playwright, opsi ini berfungsi dengan `--full-page` (lapisan halaman penuh), `--ref` (lapisan klip elemen berdasarkan referensi ARIA), dan `--element` (lapisan klip elemen berdasarkan pemilih CSS); dalam mode klip elemen, label diproyeksikan relatif terhadap elemen. Respons juga menyertakan larik `annotations` (dihilangkan jika kosong) yang berisi kotak pembatas setiap referensi: `ref`, `number`, `role`, `name` opsional, dan `box: {x, y, width, height}` dalam ruang koordinat gambar yang ditangkap (viewport / halaman penuh / relatif terhadap elemen).
  Profil `existing-session` merender lapisan chrome-mcp pada tangkapan layar halaman, tetapi tidak menggunakan pembantu proyeksi Playwright dan tidak menyertakan `annotations`; tangkapan layar CSS `--element` tidak didukung pada profil tersebut. Tanpa Playwright atau chrome-mcp, tangkapan layar berlabel tidak tersedia.
- `snapshot --urls` menambahkan tujuan tautan yang ditemukan ke snapshot AI agar agen dapat memilih target navigasi langsung, alih-alih menebaknya hanya dari teks tautan.

Navigasi/klik/ketik (otomatisasi UI berbasis referensi):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` menerima sumber fungsi, ekspresi, atau isi pernyataan. Isi pernyataan dibungkus sebagai fungsi asinkron, jadi gunakan `return` untuk nilai yang ingin dikembalikan. Gunakan `--timeout-ms` ketika fungsi di sisi halaman mungkin memerlukan waktu lebih lama daripada batas waktu evaluasi default. `browser.evaluateEnabled=false` (default: `true`) menonaktifkan `evaluate` dan `wait --fn`.

Respons tindakan mengembalikan `targetId` mentah saat ini setelah penggantian halaman yang dipicu tindakan jika OpenClaw dapat membuktikan tab penggantinya. Skrip tetap harus menyimpan dan meneruskan `suggestedTargetId`/label untuk alur kerja berumur panjang.

Pembantu file + dialog:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Profil Chrome terkelola menyimpan unduhan biasa yang dipicu klik ke direktori unduhan OpenClaw (`/tmp/openclaw/downloads` secara default, atau akar sementara yang dikonfigurasi). Gunakan `waitfordownload` atau `download` ketika agen perlu menunggu file tertentu dan mengembalikan jalurnya; penunggu eksplisit tersebut memiliki unduhan berikutnya. Unggahan menerima file dari akar unggahan sementara OpenClaw dan media masuk yang dikelola OpenClaw, termasuk referensi `media://inbound/<id>` dan `media/inbound/<id>` yang relatif terhadap sandbox. Referensi media bertingkat, traversal, dan jalur lokal arbitrer ditolak.

Ketika suatu tindakan membuka dialog modal, respons tindakan mengembalikan `blockedByDialog` dengan `browserState.dialogs.pending`; teruskan `--dialog-id` untuk menjawabnya secara langsung. Dialog yang ditangani di luar OpenClaw muncul di bawah `browserState.dialogs.recent`.

## Status dan penyimpanan

Viewport + emulasi:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookie + penyimpanan:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Debugging

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome yang Ada melalui MCP

Gunakan profil bawaan `user`, atau buat profil `existing-session` Anda sendiri:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Jalur existing-session default adalah penyambungan otomatis Chrome MCP khusus host. Jika browser sudah berjalan dengan endpoint DevTools, teruskan `--cdp-url` agar Chrome MCP terhubung ke endpoint tersebut. Untuk Docker, Browserless, atau konfigurasi jarak jauh lainnya yang tidak memerlukan semantik Chrome MCP, gunakan profil CDP sebagai gantinya.

Batasan existing-session saat ini:

- Tindakan berbasis snapshot menggunakan ref, bukan selektor CSS.
- `browser.actionTimeoutMs` menetapkan permintaan `act` yang didukung ke 60000 ms secara default ketika pemanggil menghilangkan `timeoutMs`; `timeoutMs` per panggilan tetap diutamakan.
- `click` hanya mendukung klik kiri.
- `type` tidak mendukung `slowly=true`.
- `press` tidak mendukung `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select`, dan `fill` menolak penggantian batas waktu per panggilan; `evaluate` menerima `--timeout-ms`.
- `select` hanya mendukung satu nilai.
- `wait --load networkidle` tidak didukung (berfungsi pada profil CDP terkelola dan mentah/jarak jauh).
- Pengunggahan file memerlukan `--ref` / `--input-ref`, tidak mendukung `--element` CSS, dan hanya mendukung satu file pada satu waktu.
- Hook dialog tidak mendukung `--timeout`.
- Tangkapan layar mendukung pengambilan halaman dan `--ref`, tetapi tidak mendukung `--element` CSS.
- `responsebody`, intersepsi unduhan, ekspor PDF, dan tindakan batch masih memerlukan browser terkelola atau profil CDP mentah.

## Kontrol browser jarak jauh (proksi host node)

Jika Gateway berjalan di mesin yang berbeda dari browser, jalankan **host node** di mesin yang memiliki Chrome/Brave/Edge/Chromium. Gateway memproksikan tindakan browser ke node tersebut; server kontrol browser terpisah tidak diperlukan.

Gunakan `gateway.nodes.browser.mode` untuk mengontrol perutean otomatis dan `gateway.nodes.browser.node` untuk menyematkan node tertentu jika beberapa node terhubung.

Keamanan + konfigurasi jarak jauh: [Alat browser](/id/tools/browser), [Akses jarak jauh](/id/gateway/remote), [Tailscale](/id/gateway/tailscale), [Keamanan](/id/gateway/security)

## Terkait

- [Referensi CLI](/id/cli)
- [Browser](/id/tools/browser)
