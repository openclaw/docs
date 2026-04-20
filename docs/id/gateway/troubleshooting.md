---
read_when:
    - Pusat pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
summary: Runbook pemecahan masalah mendalam untuk gateway, channel, otomatisasi, node, dan browser
title: Pemecahan masalah
x-i18n:
    generated_at: "2026-04-20T09:27:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d93a82407dbb1314b91a809ff9433114e1e9a3b56d46547ef53a8196bac06260
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah Gateway

Halaman ini adalah runbook mendalam.
Mulai dari [/help/troubleshooting](/id/help/troubleshooting) jika Anda ingin alur triase cepat terlebih dahulu.

## Tangga perintah

Jalankan ini terlebih dahulu, dalam urutan berikut:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sinyal sehat yang diharapkan:

- `openclaw gateway status` menampilkan `Runtime: running`, `Connectivity probe: ok`, dan baris `Capability: ...`.
- `openclaw doctor` melaporkan tidak ada masalah konfigurasi/layanan yang memblokir.
- `openclaw channels status --probe` menampilkan status transport per akun secara live dan,
  jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Anthropic 429 memerlukan penggunaan tambahan untuk konteks panjang

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
- Permintaan gagal hanya pada sesi panjang/jalankan model yang memerlukan jalur beta 1M.

Opsi perbaikan:

1. Nonaktifkan `context1m` untuk model tersebut agar kembali ke jendela konteks normal.
2. Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralih ke Anthropic API key.
3. Konfigurasikan model fallback agar proses tetap berjalan saat permintaan konteks panjang Anthropic ditolak.

Terkait:

- [/providers/anthropic](/id/providers/anthropic)
- [/reference/token-use](/id/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/id/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend lokal yang kompatibel dengan OpenAI lolos probe langsung tetapi jalankan agent gagal

Gunakan ini saat:

- `curl ... /v1/models` berfungsi
- panggilan `/v1/chat/completions` langsung yang kecil berfungsi
- jalankan model OpenClaw gagal hanya pada giliran agent normal

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Periksa:

- panggilan langsung kecil berhasil, tetapi jalankan OpenClaw gagal hanya pada prompt yang lebih besar
- error backend tentang `messages[].content` yang mengharapkan string
- crash backend yang hanya muncul dengan jumlah token prompt yang lebih besar atau prompt runtime agent penuh

Ciri umum:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  menolak bagian konten Chat Completions yang terstruktur. Perbaikan: tetapkan
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- permintaan langsung kecil berhasil, tetapi jalankan agent OpenClaw gagal dengan crash
  backend/model (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw
  kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agent yang lebih besar.
- kegagalan berkurang setelah menonaktifkan tools tetapi tidak hilang → skema tool
  merupakan bagian dari tekanan, tetapi masalah yang tersisa tetap kapasitas model/server
  upstream atau bug backend.

Opsi perbaikan:

1. Tetapkan `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya mendukung string.
2. Tetapkan `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani
   permukaan skema tool OpenClaw secara andal.
3. Kurangi tekanan prompt jika memungkinkan: bootstrap workspace yang lebih kecil, riwayat
   sesi yang lebih pendek, model lokal yang lebih ringan, atau backend dengan dukungan
   konteks panjang yang lebih kuat.
4. Jika permintaan langsung kecil terus lolos sementara giliran agent OpenClaw tetap crash
   di dalam backend, anggap ini sebagai keterbatasan server/model upstream dan buat
   repro di sana dengan bentuk payload yang diterima.

Terkait:

- [/gateway/local-models](/id/gateway/local-models)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/id/gateway/configuration-reference#openai-compatible-endpoints)

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

Ciri umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim perlu persetujuan.
- `blocked` / `allowlist` → pengirim/channel difilter oleh kebijakan.

Terkait:

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/pairing](/id/channels/pairing)
- [/channels/groups](/id/channels/groups)

## Konektivitas control UI dashboard

Saat dashboard/control UI tidak dapat terhubung, validasi URL, mode auth, dan asumsi konteks aman.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Periksa:

- URL probe dan URL dashboard sudah benar.
- Ketidakcocokan mode auth/token antara klien dan gateway.
- Penggunaan HTTP ketika identitas perangkat diperlukan.

Ciri umum:

- `device identity required` → konteks tidak aman atau auth perangkat tidak ada.
- `origin not allowed` → `Origin` browser tidak ada di `gateway.controlUi.allowedOrigins`
  (atau Anda terhubung dari origin browser non-loopback tanpa
  allowlist eksplisit).
- `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan
  alur auth perangkat berbasis challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klien menandatangani payload
  yang salah (atau timestamp lama) untuk handshake saat ini.
- `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu kali retry tepercaya dengan token perangkat yang di-cache.
- Retry token yang di-cache tersebut menggunakan kembali kumpulan scope yang di-cache dan disimpan bersama
  token perangkat yang telah dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan
  kumpulan scope yang diminta.
- Di luar jalur retry itu, prioritas auth connect adalah shared
  token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan,
  lalu token bootstrap.
- Pada jalur async Tailscale Serve Control UI, upaya gagal untuk
  `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan. Karena itu, dua retry buruk yang
  bersamaan dari klien yang sama dapat memunculkan `retry later`
  pada percobaan kedua, bukan dua mismatch biasa.
- `too many failed authentication attempts (retry later)` dari klien loopback
  origin browser → kegagalan berulang dari `Origin` yang sama yang telah dinormalisasi akan
  diblokir sementara; origin localhost lain menggunakan bucket terpisah.
- `unauthorized` berulang setelah retry itu → shared token/token perangkat drift; segarkan konfigurasi token dan setujui ulang/putar token perangkat jika diperlukan.
- `gateway connect failed:` → target host/port/url salah.

### Peta cepat kode detail auth

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                  | Arti                                                                                                                                                                                         | Tindakan yang direkomendasikan                                                                                                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim shared token yang diwajibkan.                                                                                                                                            | Tempel/tetapkan token di klien lalu coba lagi. Untuk jalur dashboard: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan Control UI.                                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Shared token tidak cocok dengan token auth gateway.                                                                                                                                           | Jika `canRetryWithDeviceToken=true`, izinkan satu retry tepercaya. Retry token yang di-cache menggunakan kembali scope yang disetujui dan disimpan; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan scope yang diminta. Jika masih gagal, jalankan [checklist pemulihan drift token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-perangkat yang di-cache sudah usang atau dicabut.                                                                                                                                  | Putar/setujui ulang token perangkat menggunakan [devices CLI](/cli/devices), lalu sambungkan kembali.                                                                                                                                                                                   |
| `PAIRING_REQUIRED`           | Identitas perangkat memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` jika ada. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Peningkatan scope/peran menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                      |

Pemeriksaan migrasi auth perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan error nonce/signature, perbarui klien yang terhubung dan verifikasi bahwa klien:

1. menunggu `connect.challenge`
2. menandatangani payload yang terikat ke challenge
3. mengirim `connect.params.device.nonce` dengan nonce challenge yang sama

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tidak terduga:

- sesi token paired-device hanya dapat mengelola **perangkat mereka sendiri** kecuali
  pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta scope operator yang
  sudah dimiliki oleh sesi pemanggil

Terkait:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/id/gateway/configuration) (mode auth gateway)
- [/gateway/trusted-proxy-auth](/id/gateway/trusted-proxy-auth)
- [/gateway/remote](/id/gateway/remote)
- [/cli/devices](/cli/devices)

## Layanan gateway tidak berjalan

Gunakan ini saat layanan terpasang tetapi proses tidak tetap berjalan.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga memindai layanan tingkat sistem
```

Periksa:

- `Runtime: stopped` dengan petunjuk exit.
- Ketidakcocokan konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

Ciri umum:

- `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal tidak diaktifkan, atau file konfigurasi tertimpa dan kehilangan `gateway.mode`. Perbaikan: tetapkan `gateway.mode="local"` di konfigurasi Anda, atau jalankan kembali `openclaw onboard --mode local` / `openclaw setup` untuk menerapkan ulang konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, path konfigurasi default adalah `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
- `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
- `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks yang usang atau paralel masih ada. Sebagian besar setup sebaiknya mempertahankan satu gateway per mesin; jika Anda memang memerlukan lebih dari satu, pisahkan port + konfigurasi/state/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

Terkait:

- [/gateway/background-process](/id/gateway/background-process)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/doctor](/id/gateway/doctor)

## Peringatan probe gateway

Gunakan ini saat `openclaw gateway probe` menjangkau sesuatu, tetapi masih menampilkan blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Periksa:

- `warnings[].code` dan `primaryTargetId` dalam output JSON.
- Apakah peringatannya tentang fallback SSH, beberapa gateway, scope yang hilang, atau referensi auth yang tidak terselesaikan.

Ciri umum:

- `SSH tunnel failed to start; falling back to direct probes.` → setup SSH gagal, tetapi perintah tetap mencoba target langsung yang dikonfigurasi/loopback.
- `multiple reachable gateways detected` → lebih dari satu target merespons. Biasanya ini berarti setup multi-gateway yang disengaja atau listener yang usang/duplikat.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi detail RPC dibatasi oleh scope; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → gateway merespons, tetapi klien ini masih memerlukan pairing/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang tidak terselesaikan → materi auth tidak tersedia di jalur perintah ini untuk target yang gagal.

Terkait:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host)
- [/gateway/remote](/id/gateway/remote)

## Channel terhubung tetapi pesan tidak mengalir

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

Ciri umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- jejak `pairing` / persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah auth/izin channel.

Terkait:

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/whatsapp](/id/channels/whatsapp)
- [/channels/telegram](/id/channels/telegram)
- [/channels/discord](/id/channels/discord)

## Pengiriman Cron dan Heartbeat

Jika Cron atau Heartbeat tidak berjalan atau tidak terkirim, verifikasi status scheduler terlebih dahulu, lalu target pengiriman.

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
- Alasan Heartbeat dilewati (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Ciri umum:

- `cron: scheduler disabled; jobs will not run automatically` → Cron dinonaktifkan.
- `cron: timer tick failed` → tick scheduler gagal; periksa error file/log/runtime.
- `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
- `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / heading markdown, sehingga OpenClaw melewati panggilan model.
- `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada task yang jatuh tempo pada tick ini.
- `heartbeat: unknown accountId` → account id tidak valid untuk target pengiriman Heartbeat.
- `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat terurai menjadi tujuan bergaya DM sementara `agents.defaults.heartbeat.directPolicy` (atau override per-agent) disetel ke `block`.

Terkait:

- [/automation/cron-jobs#troubleshooting](/id/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/id/automation/cron-jobs)
- [/gateway/heartbeat](/id/gateway/heartbeat)

## Tool node berpasangan gagal

Jika sebuah node sudah dipasangkan tetapi tools gagal, pisahkan kondisi foreground, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Periksa:

- Node online dengan capability yang diharapkan.
- Pemberian izin OS untuk kamera/mikrofon/lokasi/layar.
- Status persetujuan exec dan allowlist.

Ciri umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS belum diberikan.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [/nodes/troubleshooting](/id/nodes/troubleshooting)
- [/nodes/index](/id/nodes/index)
- [/tools/exec-approvals](/id/tools/exec-approvals)

## Tool browser gagal

Gunakan ini saat aksi tool browser gagal meskipun gateway itu sendiri sehat.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Periksa:

- Apakah `plugins.allow` disetel dan menyertakan `browser`.
- Path executable browser valid.
- Keterjangkauan profil CDP.
- Ketersediaan Chrome lokal untuk profil `existing-session` / `user`.

Ciri umum:

- `unknown command "browser"` atau `unknown command 'browser'` → Plugin browser bawaan dikecualikan oleh `plugins.allow`.
- tool browser hilang / tidak tersedia saat `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga Plugin tidak pernah dimuat.
- `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
- `browser.executablePath not found` → path yang dikonfigurasi tidak valid.
- `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
- `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
- `No Chrome tabs found for profile="user"` → profil lampiran Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
- `Remote CDP for profile "<name>" is not reachable` → endpoint CDP remote yang dikonfigurasi tidak dapat dijangkau dari host gateway.
- `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP merespons tetapi WebSocket CDP tetap tidak dapat dibuka.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki paket Playwright penuh; snapshot ARIA dan screenshot halaman dasar masih dapat berfungsi, tetapi navigasi, snapshot AI, screenshot elemen dengan selektor CSS, dan ekspor PDF tetap tidak tersedia.
- `fullPage is not supported for element screenshots` → permintaan screenshot mencampurkan `--full-page` dengan `--ref` atau `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → panggilan screenshot Chrome MCP / `existing-session` harus menggunakan page capture atau `--ref` dari snapshot, bukan CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook unggah Chrome MCP memerlukan ref snapshot, bukan selektor CSS.
- `existing-session file uploads currently support one file at a time.` → kirim satu unggahan per panggilan pada profil Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
- override viewport / dark-mode / locale / offline yang basi pada profil attach-only atau CDP remote → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa me-restart seluruh gateway.

Terkait:

- [/tools/browser-linux-troubleshooting](/id/tools/browser-linux-troubleshooting)
- [/tools/browser](/id/tools/browser)

## Jika Anda melakukan upgrade dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah upgrade disebabkan oleh drift konfigurasi atau default yang lebih ketat yang kini diberlakukan.

### 1) Perilaku override auth dan URL berubah

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Yang harus diperiksa:

- Jika `gateway.mode=remote`, panggilan CLI mungkin menargetkan remote sementara layanan lokal Anda baik-baik saja.
- Panggilan `--url` eksplisit tidak melakukan fallback ke kredensial yang tersimpan.

Ciri umum:

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

Yang harus diperiksa:

- Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur auth gateway yang valid: auth shared token/password, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
- Kunci lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

Ciri umum:

- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid.
- `Connectivity probe: failed` saat runtime berjalan → gateway hidup tetapi tidak dapat diakses dengan auth/url saat ini.

### 3) Status pairing dan identitas perangkat berubah

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Yang harus diperiksa:

- Persetujuan perangkat tertunda untuk dashboard/nodes.
- Persetujuan pairing DM tertunda setelah perubahan kebijakan atau identitas.

Ciri umum:

- `device identity required` → auth perangkat belum terpenuhi.
- `pairing required` → pengirim/perangkat harus disetujui.

Jika konfigurasi layanan dan runtime masih tidak sesuai setelah pemeriksaan, instal ulang metadata layanan dari profil/direktori state yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [/gateway/pairing](/id/gateway/pairing)
- [/gateway/authentication](/id/gateway/authentication)
- [/gateway/background-process](/id/gateway/background-process)
