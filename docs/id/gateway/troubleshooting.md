---
read_when:
    - Pusat pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
summary: Runbook pemecahan masalah mendalam untuk gateway, channel, otomasi, node, dan browser
title: Pemecahan masalah
x-i18n:
    generated_at: "2026-04-05T13:56:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah gateway

Halaman ini adalah runbook mendalam.
Mulai dari [/help/troubleshooting](/help/troubleshooting) jika Anda ingin alur triase cepat terlebih dahulu.

## Urutan perintah

Jalankan ini terlebih dahulu, dalam urutan berikut:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sinyal sehat yang diharapkan:

- `openclaw gateway status` menampilkan `Runtime: running` dan `RPC probe: ok`.
- `openclaw doctor` melaporkan tidak ada masalah konfigurasi/layanan yang memblokir.
- `openclaw channels status --probe` menampilkan status transport per akun secara langsung dan,
  jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Anthropic 429 memerlukan extra usage untuk konteks panjang

Gunakan ini saat log/error mencakup:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Periksa:

- Model Anthropic Opus/Sonnet yang dipilih memiliki `params.context1m: true`.
- Kredensial Anthropic saat ini tidak memenuhi syarat untuk penggunaan konteks panjang.
- Permintaan gagal hanya pada sesi/model berjalan yang panjang dan membutuhkan jalur beta 1M.

Opsi perbaikan:

1. Nonaktifkan `context1m` untuk model tersebut agar kembali ke jendela konteks normal.
2. Gunakan kunci API Anthropic dengan penagihan, atau aktifkan Anthropic Extra Usage pada akun OAuth/langganan Anthropic.
3. Konfigurasikan model fallback agar proses tetap berjalan saat permintaan konteks panjang Anthropic ditolak.

Terkait:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Tidak ada balasan

Jika channel aktif tetapi tidak ada yang menjawab, periksa routing dan kebijakan sebelum menyambungkan ulang apa pun.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Periksa:

- Pairing tertunda untuk pengirim DM.
- Pembatasan mention grup (`requireMention`, `mentionPatterns`).
- Ketidakcocokan allowlist channel/grup.

Tanda umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim memerlukan persetujuan.
- `blocked` / `allowlist` → pengirim/channel difilter oleh kebijakan.

Terkait:

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/pairing](/id/channels/pairing)
- [/channels/groups](/id/channels/groups)

## Konektivitas UI kontrol dashboard

Saat UI dashboard/kontrol tidak dapat terhubung, validasi URL, mode auth, dan asumsi secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Periksa:

- URL probe dan URL dashboard yang benar.
- Ketidakcocokan mode/token auth antara klien dan gateway.
- Penggunaan HTTP saat identitas perangkat diperlukan.

Tanda umum:

- `device identity required` → konteks tidak aman atau auth perangkat tidak ada.
- `origin not allowed` → `Origin` browser tidak ada di `gateway.controlUi.allowedOrigins`
  (atau Anda terhubung dari origin browser non-loopback tanpa
  allowlist eksplisit).
- `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan
  alur auth perangkat berbasis challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah
  (atau stempel waktu usang) untuk handshake saat ini.
- `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu kali percobaan ulang tepercaya dengan token perangkat yang di-cache.
- Percobaan ulang token cache tersebut menggunakan kembali set scope yang di-cache dan disimpan bersama
  token perangkat yang telah dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap menggunakan
  set scope yang diminta.
- Di luar jalur percobaan ulang itu, prioritas auth koneksi adalah shared
  token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat yang tersimpan,
  lalu token bootstrap.
- Pada jalur async Tailscale Serve Control UI, upaya gagal untuk
  `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan. Karena itu, dua percobaan ulang buruk yang berjalan bersamaan dari klien yang sama dapat memunculkan `retry later`
  pada upaya kedua alih-alih dua ketidakcocokan biasa.
- `too many failed authentication attempts (retry later)` dari klien
  loopback asal browser → kegagalan berulang dari `Origin` ternormalisasi yang sama
  dikunci sementara; origin localhost lain menggunakan bucket terpisah.
- `unauthorized` berulang setelah percobaan ulang itu → shared token/token perangkat berubah; segarkan konfigurasi token dan setujui ulang/rotasi token perangkat jika diperlukan.
- `gateway connect failed:` → host/port/target URL salah.

### Peta cepat kode detail auth

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                | Arti                                                     | Tindakan yang disarankan                                                                                                                                                                                                                                                                 |
| -------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`       | Klien tidak mengirim shared token yang diwajibkan.       | Tempel/set token di klien lalu coba lagi. Untuk jalur dashboard: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan Control UI.                                                                                                                                      |
| `AUTH_TOKEN_MISMATCH`      | Shared token tidak cocok dengan token auth gateway.      | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang token cache menggunakan kembali scope yang disetujui dan tersimpan; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan scope yang diminta. Jika masih gagal, jalankan [daftar periksa pemulihan drift token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-perangkat yang di-cache sudah usang atau dicabut. | Rotasi/setujui ulang token perangkat menggunakan [devices CLI](/cli/devices), lalu sambungkan kembali.                                                                                                                                                                                 |
| `PAIRING_REQUIRED`         | Identitas perangkat dikenal tetapi tidak disetujui untuk peran ini. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`.                                                                                                                                                                                      |

Pemeriksaan migrasi auth perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan error nonce/signature, perbarui klien yang terhubung lalu verifikasi bahwa klien:

1. menunggu `connect.challenge`
2. menandatangani payload yang terikat ke challenge
3. mengirim `connect.params.device.nonce` dengan nonce challenge yang sama

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tak terduga:

- sesi token perangkat yang dipasangkan hanya dapat mengelola **perangkat mereka sendiri** kecuali jika
  pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta scope operator yang
  sudah dimiliki oleh sesi pemanggil

Terkait:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/id/gateway/configuration) (mode auth gateway)
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/id/gateway/remote)
- [/cli/devices](/cli/devices)

## Layanan gateway tidak berjalan

Gunakan ini saat layanan sudah terpasang tetapi proses tidak tetap berjalan.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga memindai layanan tingkat sistem
```

Periksa:

- `Runtime: stopped` dengan petunjuk keluar.
- Ketidakcocokan konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

Tanda umum:

- `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal tidak diaktifkan, atau file konfigurasi rusak dan kehilangan `gateway.mode`. Perbaikan: set `gateway.mode="local"` di konfigurasi Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk menulis ulang konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, jalur konfigurasi default adalah `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
- `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
- `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks yang usang atau paralel masih ada. Sebagian besar penyiapan sebaiknya mempertahankan satu gateway per mesin; jika Anda memang memerlukan lebih dari satu, pisahkan port + config/state/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

Terkait:

- [/gateway/background-process](/id/gateway/background-process)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/doctor](/id/gateway/doctor)

## Peringatan probe gateway

Gunakan ini saat `openclaw gateway probe` mencapai sesuatu, tetapi tetap menampilkan blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Periksa:

- `warnings[].code` dan `primaryTargetId` dalam output JSON.
- Apakah peringatannya tentang fallback SSH, beberapa gateway, scope yang hilang, atau auth ref yang tidak terpecahkan.

Tanda umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target loopback/yang dikonfigurasi secara langsung.
- `multiple reachable gateways detected` → lebih dari satu target merespons. Biasanya ini berarti penyiapan multi-gateway yang disengaja atau listener usang/duplikat.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi detail RPC dibatasi oleh scope; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang tidak terpecahkan → materi auth tidak tersedia dalam jalur perintah ini untuk target yang gagal.

Terkait:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host)
- [/gateway/remote](/id/gateway/remote)

## Pesan channel terhubung tidak mengalir

Jika status channel terhubung tetapi aliran pesan mati, fokus pada kebijakan, izin, dan aturan pengiriman khusus channel.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Periksa:

- Kebijakan DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist grup dan persyaratan mention.
- Izin/scope API channel yang hilang.

Tanda umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- `pairing` / jejak persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah auth/izin channel.

Terkait:

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/whatsapp](/id/channels/whatsapp)
- [/channels/telegram](/id/channels/telegram)
- [/channels/discord](/id/channels/discord)

## Pengiriman cron dan heartbeat

Jika cron atau heartbeat tidak berjalan atau tidak terkirim, verifikasi status scheduler terlebih dahulu, lalu target pengiriman.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Periksa:

- Cron diaktifkan dan waktu bangun berikutnya tersedia.
- Status riwayat eksekusi job (`ok`, `skipped`, `error`).
- Alasan heartbeat dilewati (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Tanda umum:

- `cron: scheduler disabled; jobs will not run automatically` → cron dinonaktifkan.
- `cron: timer tick failed` → tick scheduler gagal; periksa error file/log/runtime.
- `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
- `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / header markdown, jadi OpenClaw melewati pemanggilan model.
- `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
- `heartbeat: unknown accountId` → id akun tidak valid untuk target pengiriman heartbeat.
- `heartbeat skipped` dengan `reason=dm-blocked` → target heartbeat di-resolve menjadi tujuan bergaya DM saat `agents.defaults.heartbeat.directPolicy` (atau override per agen) disetel ke `block`.

Terkait:

- [/automation/cron-jobs#troubleshooting](/id/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/id/automation/cron-jobs)
- [/gateway/heartbeat](/id/gateway/heartbeat)

## Kegagalan alat node yang dipasangkan

Jika node sudah dipasangkan tetapi alat gagal, isolasi status foreground, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Periksa:

- Node online dengan kapabilitas yang diharapkan.
- Pemberian izin OS untuk kamera/mikrofon/lokasi/layar.
- Status persetujuan exec dan allowlist.

Tanda umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS belum diberikan.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec masih tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Kegagalan alat browser

Gunakan ini saat tindakan alat browser gagal meskipun gateway sendiri sehat.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Periksa:

- Apakah `plugins.allow` disetel dan mencakup `browser`.
- Jalur executable browser valid.
- Keterjangkauan profil CDP.
- Ketersediaan Chrome lokal untuk profil `existing-session` / `user`.

Tanda umum:

- `unknown command "browser"` atau `unknown command 'browser'` → plugin browser bawaan dikecualikan oleh `plugins.allow`.
- alat browser hilang / tidak tersedia saat `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga plugin tidak pernah dimuat.
- `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
- `browser.executablePath not found` → jalur yang dikonfigurasi tidak valid.
- `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
- `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
- `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
- `Remote CDP for profile "<name>" is not reachable` → endpoint CDP remote yang dikonfigurasi tidak dapat dijangkau dari host gateway.
- `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP merespons tetapi WebSocket CDP tetap tidak dapat dibuka.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki paket Playwright penuh; snapshot ARIA dan screenshot halaman dasar masih dapat berfungsi, tetapi navigasi, snapshot AI, screenshot elemen berbasis selektor CSS, dan ekspor PDF tetap tidak tersedia.
- `fullPage is not supported for element screenshots` → permintaan screenshot mencampurkan `--full-page` dengan `--ref` atau `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → panggilan screenshot Chrome MCP / `existing-session` harus menggunakan tangkapan halaman atau `--ref` dari snapshot, bukan CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook unggah Chrome MCP memerlukan snapshot ref, bukan selektor CSS.
- `existing-session file uploads currently support one file at a time.` → kirim satu unggahan per panggilan pada profil Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
- override viewport / dark-mode / locale / offline yang basi pada profil attach-only atau CDP remote → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa memulai ulang seluruh gateway.

Terkait:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Jika Anda melakukan upgrade dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah upgrade adalah drift konfigurasi atau default yang lebih ketat yang kini diterapkan.

### 1) Perilaku auth dan override URL berubah

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Yang perlu diperiksa:

- Jika `gateway.mode=remote`, panggilan CLI mungkin menargetkan remote sementara layanan lokal Anda baik-baik saja.
- Panggilan `--url` eksplisit tidak fallback ke kredensial yang tersimpan.

Tanda umum:

- `gateway connect failed:` → target URL salah.
- `unauthorized` → endpoint dapat dijangkau tetapi auth salah.

### 2) Guardrail bind dan auth lebih ketat

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Yang perlu diperiksa:

- Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur auth gateway yang valid: auth shared token/password, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
- Kunci lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

Tanda umum:

- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid.
- `RPC probe: failed` saat runtime berjalan → gateway hidup tetapi tidak dapat diakses dengan auth/url saat ini.

### 3) Status pairing dan identitas perangkat berubah

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Yang perlu diperiksa:

- Persetujuan perangkat tertunda untuk dashboard/node.
- Persetujuan pairing DM tertunda setelah perubahan kebijakan atau identitas.

Tanda umum:

- `device identity required` → auth perangkat tidak terpenuhi.
- `pairing required` → pengirim/perangkat harus disetujui.

Jika konfigurasi layanan dan runtime masih tidak cocok setelah pemeriksaan, pasang ulang metadata layanan dari direktori profil/state yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [/gateway/pairing](/id/gateway/pairing)
- [/gateway/authentication](/id/gateway/authentication)
- [/gateway/background-process](/id/gateway/background-process)
