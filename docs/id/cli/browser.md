---
read_when:
    - Anda menggunakan `openclaw browser` dan menginginkan contoh untuk tugas-tugas umum
    - Anda ingin mengontrol browser yang berjalan di mesin lain melalui host node
    - Anda ingin terhubung ke Chrome lokal Anda yang sudah masuk melalui Chrome MCP
summary: Referensi CLI untuk `openclaw browser` (siklus hidup, profil, tab, tindakan, state, dan debugging)
title: Peramban
x-i18n:
    generated_at: "2026-06-27T17:17:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Kelola permukaan kontrol browser OpenClaw dan jalankan tindakan browser (siklus hidup, profil, tab, snapshot, tangkapan layar, navigasi, input, emulasi state, dan debugging).

Terkait:

- Tool browser + API: [Tool browser](/id/tools/browser)

## Flag umum

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (default ke config).
- `--token <token>`: token Gateway (jika diperlukan).
- `--timeout <ms>`: batas waktu permintaan (ms).
- `--expect-final`: tunggu respons Gateway final.
- `--browser-profile <name>`: pilih profil browser (default dari config).
- `--json`: output yang dapat dibaca mesin (jika didukung).

## Mulai cepat (lokal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agent dapat menjalankan pemeriksaan kesiapan yang sama dengan `browser({ action: "doctor" })`.

## Pemecahan masalah cepat

Jika `start` gagal dengan `not reachable after start`, selesaikan kesiapan CDP terlebih dahulu. Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, bidang kontrol browser sehat dan kegagalan biasanya adalah kebijakan SSRF navigasi.

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

Catatan:

- `doctor --deep` menambahkan probe snapshot langsung. Ini berguna ketika kesiapan CDP dasar
  sudah hijau tetapi Anda menginginkan bukti bahwa tab saat ini dapat diinspeksi.
- Untuk profil `attachOnly` dan CDP jarak jauh, `openclaw browser stop` menutup
  sesi kontrol aktif dan membersihkan override emulasi sementara bahkan ketika
  OpenClaw tidak meluncurkan proses browser itu sendiri.
- Untuk profil lokal terkelola, `openclaw browser stop` menghentikan proses
  browser yang dibuat.
- `openclaw browser start --headless` hanya berlaku untuk permintaan start tersebut dan
  hanya ketika OpenClaw meluncurkan browser lokal terkelola. Perintah ini tidak menulis ulang
  `browser.headless` atau config profil, dan tidak melakukan apa pun untuk browser yang sudah berjalan.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil lokal terkelola
  berjalan headless secara otomatis kecuali `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false`, atau `browser.profiles.<name>.headless=false`
  secara eksplisit meminta browser terlihat.

## Jika perintah tidak ada

Jika `openclaw browser` adalah perintah yang tidak dikenal, periksa `plugins.allow` di
`~/.openclaw/openclaw.json`.

Ketika `plugins.allow` ada, cantumkan Plugin browser bawaan secara eksplisit
kecuali config sudah memiliki blok root `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Blok root `browser` eksplisit, misalnya `browser.enabled=true` atau
`browser.profiles.<name>`, juga mengaktifkan Plugin browser bawaan di bawah
allowlist Plugin yang restriktif.

Terkait: [Tool browser](/id/tools/browser#missing-browser-command-or-tool)

## Profil

Profil adalah config routing browser bernama. Dalam praktiknya:

- `openclaw`: meluncurkan atau melampirkan ke instance Chrome khusus yang dikelola OpenClaw (direktori data pengguna terisolasi).
- `user`: mengontrol sesi Chrome Anda yang sudah login melalui Chrome DevTools MCP.
- profil CDP kustom: mengarah ke endpoint CDP lokal atau jarak jauh.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Gunakan profil tertentu:

```bash
openclaw browser --browser-profile work tabs
```

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

`tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu `tabId` stabil seperti `t1`,
label opsional, dan `targetId` mentah. Agent harus meneruskan
`suggestedTargetId` kembali ke `focus`, `close`, snapshot, dan tindakan. Anda dapat
menetapkan label dengan `open --label`, `tab new --label`, atau `tab label`; label,
id tab, id target mentah, dan prefiks target-id unik semuanya diterima.
Field permintaan tetap bernama `targetId` untuk kompatibilitas, tetapi menerima
referensi tab ini. Perlakukan id target mentah sebagai handle diagnostik, bukan
memori agent yang tahan lama.
Ketika Chromium mengganti target mentah yang mendasari selama navigasi atau submit
formulir, OpenClaw mempertahankan `tabId`/label stabil yang terpasang ke tab pengganti
ketika dapat membuktikan kecocokannya. Id target mentah tetap volatil; utamakan
`suggestedTargetId`.

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

Catatan:

- `--full-page` hanya untuk tangkapan halaman; ini tidak dapat digabungkan dengan `--ref`
  atau `--element`.
- Profil `existing-session` / `user` mendukung tangkapan layar halaman dan tangkapan layar
  `--ref` dari output snapshot, tetapi bukan tangkapan layar CSS `--element`.
- `--labels` menimpa ref snapshot saat ini pada tangkapan layar. Pada
  profil berbasis Playwright, ini bekerja dengan `--full-page` (overlay label seluruh halaman),
  `--ref` (overlay label klip elemen berdasarkan ref ARIA), dan `--element`
  (overlay label klip elemen berdasarkan selector CSS); dalam mode klip elemen, label
  diproyeksikan relatif terhadap elemen. Respons juga mencakup array
  `annotations` dengan kotak pembatas setiap ref. Setiap item memiliki `ref`,
  `number`, `role`, `name` opsional, dan `box: {x, y, width, height}`;
  koordinat berada dalam ruang gambar yang ditangkap (viewport / fullpage /
  relatif-elemen). Field dihilangkan saat kosong.
  Profil `existing-session` merender overlay chrome-mcp pada tangkapan layar halaman
  tetapi tidak menggunakan helper proyeksi Playwright dan tidak menyertakan
  `annotations`; tangkapan layar CSS `--element` tidak didukung di sana. Tanpa
  Playwright atau chrome-mcp, tangkapan layar berlabel tidak tersedia. Rilis
  sebelumnya mengabaikan `--full-page`, `--ref`, dan `--element` pada tangkapan layar
  Playwright berlabel dan selalu mengembalikan tangkapan viewport; tangkapan layar
  berlabel kini menghormati cakupan tersebut.
- `snapshot --urls` menambahkan tujuan tautan yang ditemukan ke snapshot AI agar
  agent dapat memilih target navigasi langsung alih-alih menebak dari teks tautan saja.

Navigasi/klik/ketik (otomasi UI berbasis ref):

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

`evaluate --fn` menerima sumber fungsi, ekspresi, atau body statement.
Body statement dibungkus sebagai fungsi async, jadi gunakan `return` untuk nilai
yang ingin Anda dapatkan kembali. Gunakan `evaluate --timeout-ms <ms>` ketika fungsi sisi halaman mungkin
membutuhkan waktu lebih lama daripada batas waktu evaluate default.

Respons tindakan mengembalikan `targetId` mentah saat ini setelah penggantian halaman
yang dipicu tindakan ketika OpenClaw dapat membuktikan tab penggantinya. Skrip tetap harus
menyimpan dan meneruskan `suggestedTargetId`/label untuk alur kerja jangka panjang.

Helper file + dialog:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Profil Chrome terkelola menyimpan unduhan biasa yang dipicu klik ke direktori
unduhan OpenClaw (`/tmp/openclaw/downloads` secara default, atau root temp yang dikonfigurasi).
Gunakan `waitfordownload` atau `download` ketika agent perlu menunggu file
tertentu dan mengembalikan path-nya; waiter eksplisit tersebut memiliki unduhan berikutnya.
Unggahan menerima file dari root unggahan temp OpenClaw dan media masuk yang dikelola
OpenClaw, termasuk referensi `media://inbound/<id>` dan
`media/inbound/<id>` yang relatif sandbox. Ref media bersarang, traversal, dan path
lokal arbitrer tetap ditolak.
Ketika suatu tindakan membuka dialog modal, respons tindakan mengembalikan
`blockedByDialog` dengan `browserState.dialogs.pending`; teruskan `--dialog-id` untuk
menjawabnya secara langsung. Dialog yang ditangani di luar OpenClaw muncul di bawah
`browserState.dialogs.recent`.

## State dan penyimpanan

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

## Chrome yang ada melalui MCP

Gunakan profil bawaan `user`, atau buat profil `existing-session` Anda sendiri:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Path existing-session default adalah auto-connect Chrome MCP khusus host. Jika browser sudah
berjalan dengan endpoint DevTools, teruskan `--cdp-url` agar Chrome MCP melampirkan ke endpoint tersebut.
Untuk Docker, Browserless, atau setup jarak jauh lain yang tidak membutuhkan semantik Chrome MCP, gunakan
profil CDP.

Batas existing-session saat ini:

- tindakan berbasis snapshot menggunakan ref, bukan selector CSS
- `browser.actionTimeoutMs` menetapkan default permintaan `act` yang didukung ke 60000 ms saat
  pemanggil menghilangkan `timeoutMs`; `timeoutMs` per panggilan tetap diutamakan.
- `click` hanya klik kiri
- `type` tidak mendukung `slowly=true`
- `press` tidak mendukung `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, dan `evaluate` menolak
  penimpaan timeout per panggilan
- `select` hanya mendukung satu nilai
- `wait --load networkidle` tidak didukung pada profil sesi yang sudah ada (berfungsi pada CDP terkelola dan mentah/jarak jauh)
- unggahan file memerlukan `--ref` / `--input-ref`, tidak mendukung CSS
  `--element`, dan saat ini mendukung satu file dalam satu waktu
- hook dialog tidak mendukung `--timeout`
- tangkapan layar mendukung tangkapan halaman dan `--ref`, tetapi bukan CSS `--element`
- `responsebody`, intersepsi unduhan, ekspor PDF, dan tindakan batch masih
  memerlukan browser terkelola atau profil CDP mentah

## Kontrol browser jarak jauh (proxy host node)

Jika Gateway berjalan di mesin yang berbeda dari browser, jalankan **host node** pada mesin yang memiliki Chrome/Brave/Edge/Chromium. Gateway akan mem-proxy tindakan browser ke node tersebut (tidak diperlukan server kontrol browser terpisah).

Gunakan `gateway.nodes.browser.mode` untuk mengontrol perutean otomatis dan `gateway.nodes.browser.node` untuk menetapkan node tertentu jika beberapa node terhubung.

Keamanan + penyiapan jarak jauh: [Alat browser](/id/tools/browser), [Akses jarak jauh](/id/gateway/remote), [Tailscale](/id/gateway/tailscale), [Keamanan](/id/gateway/security)

## Terkait

- [Referensi CLI](/id/cli)
- [Browser](/id/tools/browser)
