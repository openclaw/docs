---
read_when:
    - Anda menggunakan `openclaw browser` dan menginginkan contoh untuk tugas umum
    - Anda ingin mengontrol browser yang berjalan di mesin lain melalui host node
    - Anda ingin terhubung ke Chrome lokal Anda yang sudah login melalui Chrome MCP
summary: Referensi CLI untuk `openclaw browser` (siklus hidup, profil, tab, aksi, state, dan debugging)
title: Browser
x-i18n:
    generated_at: "2026-04-24T09:00:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Kelola surface kontrol browser OpenClaw dan jalankan aksi browser (siklus hidup, profil, tab, snapshot, screenshot, navigasi, input, emulasi state, dan debugging).

Terkait:

- Tool browser + API: [Tool browser](/id/tools/browser)

## Flag umum

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (default dari config).
- `--token <token>`: token Gateway (jika diperlukan).
- `--timeout <ms>`: timeout permintaan (ms).
- `--expect-final`: tunggu respons final Gateway.
- `--browser-profile <name>`: pilih profil browser (default dari config).
- `--json`: output yang dapat dibaca mesin (jika didukung).

## Mulai cepat (lokal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Pemecahan masalah cepat

Jika `start` gagal dengan `not reachable after start`, pecahkan masalah kesiapan CDP terlebih dahulu. Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane browser sehat dan kegagalan biasanya adalah kebijakan SSRF navigasi.

Urutan minimal:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Panduan terperinci: [Pemecahan masalah browser](/id/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Siklus hidup

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Catatan:

- Untuk profil `attachOnly` dan CDP remote, `openclaw browser stop` menutup
  sesi kontrol aktif dan menghapus override emulasi sementara bahkan saat
  OpenClaw tidak meluncurkan proses browser itu sendiri.
- Untuk profil lokal yang dikelola, `openclaw browser stop` menghentikan proses
  browser yang dijalankan.

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

`browser.enabled=true` tidak memulihkan subperintah CLI saat allowlist Plugin
mengecualikan `browser`.

Terkait: [Tool browser](/id/tools/browser#missing-browser-command-or-tool)

## Profil

Profil adalah config perutean browser bernama. Dalam praktiknya:

- `openclaw`: meluncurkan atau terhubung ke instance Chrome terkelola khusus OpenClaw (direktori data pengguna terisolasi).
- `user`: mengontrol sesi Chrome Anda yang sudah login melalui Chrome DevTools MCP.
- profil CDP kustom: mengarah ke endpoint CDP lokal atau remote.

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
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / screenshot / aksi

Snapshot:

```bash
openclaw browser snapshot
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Catatan:

- `--full-page` hanya untuk pengambilan halaman; tidak dapat digabungkan dengan `--ref`
  atau `--element`.
- Profil `existing-session` / `user` mendukung screenshot halaman dan screenshot `--ref`
  dari output snapshot, tetapi tidak mendukung screenshot CSS `--element`.

Navigate/click/type (otomasi UI berbasis ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
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

Helper file + dialog:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

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

## Chrome yang sudah ada melalui MCP

Gunakan profil bawaan `user`, atau buat profil `existing-session` Anda sendiri:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Jalur ini hanya untuk host. Untuk Docker, server headless, Browserless, atau penyiapan remote lainnya, gunakan profil CDP sebagai gantinya.

Batasan `existing-session` saat ini:

- aksi berbasis snapshot menggunakan ref, bukan selector CSS
- `click` hanya mendukung klik kiri
- `type` tidak mendukung `slowly=true`
- `press` tidak mendukung `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, dan `evaluate` menolak
  override timeout per-panggilan
- `select` hanya mendukung satu nilai
- `wait --load networkidle` tidak didukung
- unggah file memerlukan `--ref` / `--input-ref`, tidak mendukung CSS
  `--element`, dan saat ini hanya mendukung satu file sekaligus
- hook dialog tidak mendukung `--timeout`
- screenshot mendukung pengambilan halaman dan `--ref`, tetapi tidak mendukung CSS `--element`
- `responsebody`, intersepsi unduhan, ekspor PDF, dan aksi batch masih
  memerlukan browser terkelola atau profil CDP mentah

## Kontrol browser remote (proxy host node)

Jika Gateway berjalan di mesin yang berbeda dari browser, jalankan **host node** di mesin yang memiliki Chrome/Brave/Edge/Chromium. Gateway akan mem-proxy aksi browser ke node tersebut (tidak perlu server kontrol browser terpisah).

Gunakan `gateway.nodes.browser.mode` untuk mengontrol perutean otomatis dan `gateway.nodes.browser.node` untuk menetapkan node tertentu jika ada beberapa node yang terhubung.

Keamanan + penyiapan remote: [Tool browser](/id/tools/browser), [Akses remote](/id/gateway/remote), [Tailscale](/id/gateway/tailscale), [Keamanan](/id/gateway/security)

## Terkait

- [Referensi CLI](/id/cli)
- [Browser](/id/tools/browser)
