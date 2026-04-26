---
read_when:
    - Anda menggunakan `openclaw browser` dan menginginkan contoh untuk tugas umum
    - Anda ingin mengontrol browser yang berjalan di mesin lain melalui host Node
    - Anda ingin menautkan ke Chrome lokal Anda yang sudah login melalui Chrome MCP
summary: Referensi CLI untuk `openclaw browser` (siklus hidup, profil, tab, aksi, status, dan debugging)
title: Browser
x-i18n:
    generated_at: "2026-04-26T11:24:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Kelola surface kontrol browser OpenClaw dan jalankan aksi browser (siklus hidup, profil, tab, snapshot, screenshot, navigasi, input, emulasi status, dan debugging).

Terkait:

- Tool browser + API: [Tool browser](/id/tools/browser)

## Flag umum

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (default dari konfigurasi).
- `--token <token>`: token Gateway (jika diperlukan).
- `--timeout <ms>`: waktu tunggu permintaan (md).
- `--expect-final`: tunggu respons final Gateway.
- `--browser-profile <name>`: pilih profil browser (default dari konfigurasi).
- `--json`: output yang dapat dibaca mesin (jika didukung).

## Mulai cepat (lokal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agen dapat menjalankan pemeriksaan kesiapan yang sama dengan `browser({ action: "doctor" })`.

## Pemecahan masalah cepat

Jika `start` gagal dengan `not reachable after start`, lakukan pemecahan masalah kesiapan CDP terlebih dahulu. Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane browser sehat dan kegagalan biasanya disebabkan oleh kebijakan SSRF navigasi.

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

- `doctor --deep` menambahkan probe snapshot langsung. Ini berguna saat
  kesiapan CDP dasar berstatus hijau tetapi Anda menginginkan bukti bahwa tab
  saat ini dapat diinspeksi.
- Untuk profil `attachOnly` dan CDP jarak jauh, `openclaw browser stop` menutup
  sesi kontrol aktif dan menghapus override emulasi sementara meskipun
  OpenClaw tidak meluncurkan proses browser itu sendiri.
- Untuk profil lokal yang dikelola, `openclaw browser stop` menghentikan proses
  browser yang diluncurkan.
- `openclaw browser start --headless` hanya berlaku untuk permintaan start itu
  saja dan hanya ketika OpenClaw meluncurkan browser lokal yang dikelola. Ini
  tidak menulis ulang `browser.headless` atau konfigurasi profil, dan menjadi
  no-op untuk browser yang sudah berjalan.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil lokal yang dikelola
  berjalan dalam mode headless secara otomatis kecuali `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false`, atau `browser.profiles.<name>.headless=false`
  secara eksplisit meminta browser yang terlihat.

## Jika perintah tidak ada

Jika `openclaw browser` adalah perintah yang tidak dikenal, periksa `plugins.allow` di
`~/.openclaw/openclaw.json`.

Saat `plugins.allow` ada, Plugin browser bawaan harus dicantumkan
secara eksplisit:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` tidak memulihkan subperintah CLI ketika allowlist Plugin
tidak menyertakan `browser`.

Terkait: [Tool browser](/id/tools/browser#missing-browser-command-or-tool)

## Profil

Profil adalah konfigurasi perutean browser bernama. Dalam praktiknya:

- `openclaw`: meluncurkan atau menautkan ke instance Chrome yang dikelola OpenClaw secara khusus (direktori data pengguna yang terisolasi).
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
label opsional, dan `targetId` mentah. Agen harus meneruskan
`suggestedTargetId` kembali ke `focus`, `close`, snapshot, dan aksi. Anda dapat
memberikan label dengan `open --label`, `tab new --label`, atau `tab label`; label,
ID tab, ID target mentah, dan prefiks ID target unik semuanya diterima.
Ketika Chromium mengganti target mentah yang mendasarinya selama navigasi atau
pengiriman formulir, OpenClaw menjaga `tabId`/label stabil tetap terpasang pada tab
pengganti saat OpenClaw dapat membuktikan kecocokannya. ID target mentah tetap volatil;
gunakan `suggestedTargetId`.

## Snapshot / screenshot / aksi

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Catatan:

- `--full-page` hanya untuk pengambilan halaman; tidak dapat digabungkan dengan `--ref`
  atau `--element`.
- Profil `existing-session` / `user` mendukung screenshot halaman dan screenshot `--ref`
  dari output snapshot, tetapi tidak mendukung screenshot CSS `--element`.
- `--labels` menumpangkan ref snapshot saat ini pada screenshot.
- `snapshot --urls` menambahkan tujuan tautan yang ditemukan ke snapshot AI agar
  agen dapat memilih target navigasi langsung alih-alih menebak hanya dari teks
  tautan.

Navigate/click/type (otomatisasi UI berbasis ref):

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
```

Respons aksi mengembalikan `targetId` mentah saat ini setelah penggantian halaman
yang dipicu aksi ketika OpenClaw dapat membuktikan tab pengganti. Skrip tetap harus
menyimpan dan meneruskan `suggestedTargetId`/label untuk alur kerja jangka panjang.

Pembantu file + dialog:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Profil Chrome terkelola menyimpan unduhan biasa yang dipicu klik ke direktori unduhan OpenClaw
(`/tmp/openclaw/downloads` secara default, atau root temp yang dikonfigurasi). Gunakan
`waitfordownload` atau `download` ketika agen perlu menunggu file tertentu dan
mengembalikan path-nya; penunggu eksplisit tersebut memiliki kendali atas unduhan berikutnya.

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

## Chrome yang sudah ada melalui MCP

Gunakan profil `user` bawaan, atau buat profil `existing-session` Anda sendiri:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Jalur ini hanya untuk host. Untuk Docker, server headless, Browserless, atau penyiapan jarak jauh lainnya, gunakan profil CDP sebagai gantinya.

Batasan existing-session saat ini:

- aksi berbasis snapshot menggunakan ref, bukan selector CSS
- `browser.actionTimeoutMs` default untuk permintaan `act` yang didukung menjadi 60000 md ketika
  pemanggil tidak menyertakan `timeoutMs`; `timeoutMs` per-panggilan tetap menang.
- `click` hanya klik kiri
- `type` tidak mendukung `slowly=true`
- `press` tidak mendukung `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, dan `evaluate` menolak
  override waktu tunggu per-panggilan
- `select` hanya mendukung satu nilai
- `wait --load networkidle` tidak didukung
- upload file memerlukan `--ref` / `--input-ref`, tidak mendukung CSS
  `--element`, dan saat ini hanya mendukung satu file dalam satu waktu
- hook dialog tidak mendukung `--timeout`
- screenshot mendukung pengambilan halaman dan `--ref`, tetapi tidak CSS `--element`
- `responsebody`, intersepsi unduhan, ekspor PDF, dan aksi batch masih
  memerlukan browser terkelola atau profil CDP mentah

## Kontrol browser jarak jauh (proxy host node)

Jika Gateway berjalan pada mesin yang berbeda dari browser, jalankan **host node** pada mesin yang memiliki Chrome/Brave/Edge/Chromium. Gateway akan mem-proxy aksi browser ke node tersebut (tidak memerlukan server kontrol browser terpisah).

Gunakan `gateway.nodes.browser.mode` untuk mengontrol perutean otomatis dan `gateway.nodes.browser.node` untuk menyematkan node tertentu jika ada beberapa node yang terhubung.

Keamanan + penyiapan jarak jauh: [Tool browser](/id/tools/browser), [Akses jarak jauh](/id/gateway/remote), [Tailscale](/id/gateway/tailscale), [Keamanan](/id/gateway/security)

## Terkait

- [Referensi CLI](/id/cli)
- [Browser](/id/tools/browser)
