---
read_when:
    - Anda menggunakan `openclaw browser` dan ingin contoh untuk tugas umum
    - Anda ingin mengontrol browser yang berjalan di mesin lain melalui host node
    - Anda ingin menempel ke Chrome lokal yang sudah login melalui Chrome MCP
summary: Referensi CLI untuk `openclaw browser` (siklus hidup, profil, tab, aksi, status, dan debugging)
title: browser
x-i18n:
    generated_at: "2026-04-05T13:45:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: c89a7483dd733863dd8ebd47a14fbb411808ad07daaed515c1270978de9157e7
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Kelola permukaan kontrol browser OpenClaw dan jalankan aksi browser (siklus hidup, profil, tab, snapshot, tangkapan layar, navigasi, input, emulasi status, dan debugging).

Terkait:

- Tool + API browser: [Browser tool](/tools/browser)

## Flag umum

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (default dari config).
- `--token <token>`: token Gateway (jika diperlukan).
- `--timeout <ms>`: timeout permintaan (ms).
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

## Siklus hidup

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Catatan:

- Untuk profil `attachOnly` dan CDP jarak jauh, `openclaw browser stop` menutup
  sesi kontrol aktif dan menghapus override emulasi sementara meskipun
  OpenClaw tidak meluncurkan proses browser itu sendiri.
- Untuk profil terkelola lokal, `openclaw browser stop` menghentikan proses
  browser yang diluncurkan.

## Jika perintah tidak ada

Jika `openclaw browser` adalah perintah yang tidak dikenal, periksa `plugins.allow` di
`~/.openclaw/openclaw.json`.

Saat `plugins.allow` ada, plugin browser bawaan harus dicantumkan
secara eksplisit:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` tidak memulihkan subperintah CLI saat
allowlist plugin mengecualikan `browser`.

Terkait: [Browser tool](/tools/browser#missing-browser-command-or-tool)

## Profil

Profil adalah config routing browser bernama. Dalam praktiknya:

- `openclaw`: meluncurkan atau menempel ke instance Chrome khusus yang dikelola OpenClaw (direktori data pengguna terisolasi).
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
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / tangkapan layar / aksi

Snapshot:

```bash
openclaw browser snapshot
```

Tangkapan layar:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Catatan:

- `--full-page` hanya untuk pengambilan halaman; tidak dapat digabungkan dengan `--ref`
  atau `--element`.
- Profil `existing-session` / `user` mendukung tangkapan layar halaman dan tangkapan layar `--ref`
  dari output snapshot, tetapi tidak mendukung tangkapan layar CSS `--element`.

Navigasi/klik/ketik (otomasi UI berbasis ref):

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

## Chrome yang ada melalui MCP

Gunakan profil bawaan `user`, atau buat profil `existing-session` Anda sendiri:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Jalur ini hanya untuk host. Untuk Docker, server headless, Browserless, atau penyiapan jarak jauh lainnya, gunakan profil CDP.

Batas `existing-session` saat ini:

- aksi yang didorong snapshot menggunakan ref, bukan selektor CSS
- `click` hanya mendukung klik kiri
- `type` tidak mendukung `slowly=true`
- `press` tidak mendukung `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, dan `evaluate` menolak
  override timeout per panggilan
- `select` hanya mendukung satu nilai
- `wait --load networkidle` tidak didukung
- upload file memerlukan `--ref` / `--input-ref`, tidak mendukung CSS
  `--element`, dan saat ini mendukung satu file sekali waktu
- hook dialog tidak mendukung `--timeout`
- tangkapan layar mendukung pengambilan halaman dan `--ref`, tetapi tidak CSS `--element`
- `responsebody`, intersepsi unduhan, ekspor PDF, dan aksi batch masih
  memerlukan browser terkelola atau profil CDP mentah

## Kontrol browser jarak jauh (proxy host node)

Jika Gateway berjalan di mesin yang berbeda dari browser, jalankan **host node** di mesin yang memiliki Chrome/Brave/Edge/Chromium. Gateway akan mem-proxy aksi browser ke node tersebut (tidak memerlukan server kontrol browser terpisah).

Gunakan `gateway.nodes.browser.mode` untuk mengontrol auto-routing dan `gateway.nodes.browser.node` untuk menetapkan node tertentu jika beberapa node terhubung.

Keamanan + penyiapan jarak jauh: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)
