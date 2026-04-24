---
read_when:
    - Hub pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
summary: Runbook pemecahan masalah mendalam untuk gateway, kanal, otomatisasi, node, dan browser
title: Pemecahan masalah
x-i18n:
    generated_at: "2026-04-24T09:10:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20066bdab03f05304b3a620fbadc38e4dc74b740da151c58673dcf5196e5f1e1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah Gateway

Halaman ini adalah runbook mendalam.
Mulai dari [/help/troubleshooting](/id/help/troubleshooting) jika Anda menginginkan alur triase cepat terlebih dahulu.

## Tangga perintah

Jalankan ini terlebih dahulu, dalam urutan ini:

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
- `openclaw channels status --probe` menampilkan status transport live per akun dan,
  jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Anthropic 429 extra usage required for long context

Gunakan ini ketika log/error mencakup:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cari:

- Model Anthropic Opus/Sonnet yang dipilih memiliki `params.context1m: true`.
- Kredensial Anthropic saat ini tidak memenuhi syarat untuk penggunaan long-context.
- Permintaan gagal hanya pada sesi/model run panjang yang memerlukan jalur beta 1M.

Opsi perbaikan:

1. Nonaktifkan `context1m` untuk model tersebut agar fallback ke jendela konteks normal.
2. Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan long-context, atau beralih ke API key Anthropic.
3. Konfigurasikan model fallback agar run tetap berlanjut ketika permintaan long-context Anthropic ditolak.

Terkait:

- [/providers/anthropic](/id/providers/anthropic)
- [/reference/token-use](/id/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/id/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend lokal yang kompatibel dengan OpenAI lolos direct probe tetapi agent run gagal

Gunakan ini ketika:

- `curl ... /v1/models` berfungsi
- panggilan `/v1/chat/completions` kecil langsung berfungsi
- model run OpenClaw gagal hanya pada giliran agen normal

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cari:

- panggilan kecil langsung berhasil, tetapi run OpenClaw gagal hanya pada prompt yang lebih besar
- error backend tentang `messages[].content` yang mengharapkan string
- crash backend yang hanya muncul pada jumlah token prompt yang lebih besar atau prompt runtime agen penuh

Tanda umum:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  menolak structured Chat Completions content parts. Perbaikan: setel
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- permintaan kecil langsung berhasil, tetapi agent run OpenClaw gagal dengan crash backend/model
  (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw
  kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agen yang lebih besar.
- kegagalan berkurang setelah menonaktifkan tool tetapi tidak hilang → skema tool
  adalah bagian dari tekanan, tetapi masalah yang tersisa tetap merupakan keterbatasan kapasitas model/server upstream atau bug backend.

Opsi perbaikan:

1. Setel `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya menerima string.
2. Setel `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani
   permukaan skema tool OpenClaw secara andal.
3. Kurangi tekanan prompt jika memungkinkan: bootstrap workspace lebih kecil, riwayat
   sesi lebih pendek, model lokal lebih ringan, atau backend dengan dukungan long-context
   yang lebih kuat.
4. Jika permintaan kecil langsung tetap lolos sementara giliran agen OpenClaw masih crash
   di dalam backend, perlakukan ini sebagai keterbatasan server/model upstream dan ajukan
   repro ke sana dengan bentuk payload yang diterima.

Terkait:

- [/gateway/local-models](/id/gateway/local-models)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/id/gateway/configuration-reference#openai-compatible-endpoints)

## Tidak ada balasan

Jika kanal aktif tetapi tidak ada yang menjawab, periksa routing dan kebijakan sebelum menyambungkan ulang apa pun.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cari:

- Pairing tertunda untuk pengirim DM.
- Gating mention grup (`requireMention`, `mentionPatterns`).
- Ketidakcocokan allowlist kanal/grup.

Tanda umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim perlu disetujui.
- `blocked` / `allowlist` → pengirim/kanal difilter oleh kebijakan.

Terkait:

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/pairing](/id/channels/pairing)
- [/channels/groups](/id/channels/groups)

## Konektivitas control ui dashboard

Ketika dashboard/control UI tidak mau terhubung, validasi URL, mode autentikasi, dan asumsi secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cari:

- URL probe dan URL dashboard yang benar.
- Ketidakcocokan mode autentikasi/token antara klien dan gateway.
- Penggunaan HTTP ketika identitas perangkat diperlukan.

Tanda umum:

- `device identity required` → non-secure context atau autentikasi perangkat hilang.
- `origin not allowed` → browser `Origin` tidak ada dalam `gateway.controlUi.allowedOrigins`
  (atau Anda terhubung dari origin browser non-loopback tanpa allowlist
  eksplisit).
- `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan
  alur autentikasi perangkat berbasis challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah
  (atau timestamp usang) untuk handshake saat ini.
- `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu retry tepercaya dengan device token yang di-cache.
- Retry cached-token tersebut menggunakan ulang set scope yang di-cache bersama
  token perangkat yang telah dipair. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit mempertahankan set scope yang diminta.
- Di luar jalur retry itu, prioritas autentikasi koneksi adalah shared
  token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu device token tersimpan,
  lalu bootstrap token.
- Pada jalur async Tailscale Serve Control UI, percobaan gagal untuk `{scope, ip}` yang sama
  diserialkan sebelum limiter mencatat kegagalan. Dua retry buruk bersamaan dari klien yang sama karena itu dapat menampilkan `retry later`
  pada percobaan kedua alih-alih dua mismatch biasa.
- `too many failed authentication attempts (retry later)` dari klien loopback origin browser
  → kegagalan berulang dari `Origin` ternormalisasi yang sama itu dikunci sementara; origin localhost lain menggunakan bucket terpisah.
- `unauthorized` berulang setelah retry itu → drift shared token/device token; refresh konfigurasi token dan setujui ulang/rotasi device token jika perlu.
- `gateway connect failed:` → target host/port/url salah.

### Peta cepat detail code autentikasi

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Detail code                  | Arti                                                                                                                                                                                         | Tindakan yang direkomendasikan                                                                                                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim shared token yang diwajibkan.                                                                                                                                            | Tempel/setel token di klien lalu coba lagi. Untuk jalur dashboard: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan Control UI.                                                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | Shared token tidak cocok dengan token auth gateway.                                                                                                                                            | Jika `canRetryWithDeviceToken=true`, izinkan satu retry tepercaya. Retry cached-token menggunakan ulang scope tersimpan yang disetujui; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan scope yang diminta. Jika masih gagal, jalankan [checklist pemulihan drift token](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-perangkat yang di-cache sudah usang atau dicabut.                                                                                                                                   | Rotasi/setujui ulang device token menggunakan [CLI devices](/id/cli/devices), lalu sambungkan kembali.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Identitas perangkat memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` bila ada. | Setujui permintaan yang tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Upgrade scope/role menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                        |

Pemeriksaan migrasi autentikasi perangkat v2:

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

- sesi token paired-device hanya dapat mengelola **perangkatnya sendiri** kecuali
  pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta operator scope yang
  sudah dimiliki sesi pemanggil

Terkait:

- [/web/control-ui](/id/web/control-ui)
- [/gateway/configuration](/id/gateway/configuration) (mode autentikasi gateway)
- [/gateway/trusted-proxy-auth](/id/gateway/trusted-proxy-auth)
- [/gateway/remote](/id/gateway/remote)
- [/cli/devices](/id/cli/devices)

## Layanan Gateway tidak berjalan

Gunakan ini ketika layanan terinstal tetapi proses tidak tetap hidup.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga pindai layanan tingkat sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk exit.
- Ketidakcocokan konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

Tanda umum:

- `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal tidak diaktifkan, atau file konfigurasi rusak dan kehilangan `gateway.mode`. Perbaikan: setel `gateway.mode="local"` di konfigurasi Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk men-stempel ulang konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, path konfigurasi default adalah `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur autentikasi gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
- `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
- `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks usang atau paralel ada. Sebagian besar penyiapan sebaiknya mempertahankan satu gateway per mesin; jika Anda memang memerlukan lebih dari satu, isolasikan port + konfigurasi/status/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

Terkait:

- [/gateway/background-process](/id/gateway/background-process)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/doctor](/id/gateway/doctor)

## Gateway memulihkan konfigurasi last-known-good

Gunakan ini ketika Gateway berhasil mulai, tetapi log mengatakan bahwa ia memulihkan `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Cari:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- File `openclaw.json.clobbered.*` bertimestamp di samping konfigurasi aktif
- Event sistem agen utama yang dimulai dengan `Config recovery warning`

Apa yang terjadi:

- Konfigurasi yang ditolak tidak lolos validasi selama startup atau hot reload.
- OpenClaw mempertahankan payload yang ditolak sebagai `.clobbered.*`.
- Konfigurasi aktif dipulihkan dari salinan last-known-good terakhir yang tervalidasi.
- Giliran agen utama berikutnya diperingatkan agar tidak menulis ulang konfigurasi yang ditolak secara membabi buta.

Periksa dan perbaiki:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Tanda umum:

- `.clobbered.*` ada → edit langsung eksternal atau pembacaan saat startup dipulihkan.
- `.rejected.*` ada → penulisan konfigurasi milik OpenClaw gagal pada pemeriksaan skema atau clobber sebelum commit.
- `Config write rejected:` → penulisan mencoba menghapus bentuk wajib, mengecilkan file secara tajam, atau mempertahankan konfigurasi yang tidak valid.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → startup memperlakukan file saat ini sebagai clobbered karena kehilangan field atau ukuran dibanding cadangan last-known-good.
- `Config last-known-good promotion skipped` → kandidat berisi placeholder rahasia yang telah disamarkan seperti `***`.

Opsi perbaikan:

1. Pertahankan konfigurasi aktif yang dipulihkan jika memang sudah benar.
2. Salin hanya key yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
3. Jalankan `openclaw config validate` sebelum restart.
4. Jika Anda mengedit manual, pertahankan konfigurasi JSON5 lengkap, bukan hanya objek parsial yang ingin Anda ubah.

Terkait:

- [/gateway/configuration#strict-validation](/id/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/id/gateway/configuration#config-hot-reload)
- [/cli/config](/id/cli/config)
- [/gateway/doctor](/id/gateway/doctor)

## Peringatan probe Gateway

Gunakan ini ketika `openclaw gateway probe` menjangkau sesuatu, tetapi masih mencetak blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` dalam output JSON.
- Apakah peringatannya tentang fallback SSH, beberapa gateway, scope yang hilang, atau auth ref yang belum terselesaikan.

Tanda umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target terkonfigurasi/loopback secara langsung.
- `multiple reachable gateways detected` → lebih dari satu target merespons. Biasanya ini berarti penyiapan multi-gateway yang disengaja atau listener usang/duplikat.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi RPC detail dibatasi oleh scope; pair identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → gateway merespons, tetapi klien ini masih memerlukan pairing/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang belum terselesaikan → materi autentikasi tidak tersedia di jalur perintah ini untuk target yang gagal.

Terkait:

- [/cli/gateway](/id/cli/gateway)
- [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host)
- [/gateway/remote](/id/gateway/remote)

## Pesan kanal terhubung tetapi tidak mengalir

Jika status kanal menunjukkan terhubung tetapi aliran pesan mati, fokuslah pada kebijakan, izin, dan aturan pengiriman spesifik kanal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Cari:

- Kebijakan DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist grup dan persyaratan mention.
- Izin/scope API kanal yang hilang.

Tanda umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- jejak `pairing` / persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah autentikasi/izin kanal.

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

Cari:

- Cron aktif dan next wake ada.
- Status riwayat run job (`ok`, `skipped`, `error`).
- Alasan skip Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Tanda umum:

- `cron: scheduler disabled; jobs will not run automatically` → Cron dinonaktifkan.
- `cron: timer tick failed` → tick scheduler gagal; periksa error file/log/runtime.
- `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
- `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / header markdown, sehingga OpenClaw melewati panggilan model.
- `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
- `heartbeat: unknown accountId` → id akun tidak valid untuk target pengiriman Heartbeat.
- `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat diselesaikan ke tujuan bergaya DM saat `agents.defaults.heartbeat.directPolicy` (atau override per agen) diatur ke `block`.

Terkait:

- [/automation/cron-jobs#troubleshooting](/id/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/id/automation/cron-jobs)
- [/gateway/heartbeat](/id/gateway/heartbeat)

## Tool node pair gagal

Jika sebuah node sudah dipair tetapi tool gagal, isolasikan status foreground, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cari:

- Node online dengan kapabilitas yang diharapkan.
- Izin OS untuk kamera/mikrofon/lokasi/layar.
- Persetujuan exec dan status allowlist.

Tanda umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS hilang.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [/nodes/troubleshooting](/id/nodes/troubleshooting)
- [/nodes/index](/id/nodes/index)
- [/tools/exec-approvals](/id/tools/exec-approvals)

## Tool browser gagal

Gunakan ini ketika aksi tool browser gagal meskipun gateway sendiri sehat.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cari:

- Apakah `plugins.allow` diatur dan mencakup `browser`.
- Path executable browser yang valid.
- Keterjangkauan profil CDP.
- Ketersediaan Chrome lokal untuk profil `existing-session` / `user`.

Tanda umum:

- `unknown command "browser"` atau `unknown command 'browser'` → plugin browser bawaan dikecualikan oleh `plugins.allow`.
- tool browser hilang / tidak tersedia sementara `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga plugin tidak pernah dimuat.
- `Failed to start Chrome CDP on port` → proses browser gagal dijalankan.
- `browser.executablePath not found` → path yang dikonfigurasi tidak valid.
- `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
- `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
- `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP belum dapat attach ke data dir browser yang dipilih. Buka halaman inspect browser, aktifkan remote debugging, biarkan browser tetap terbuka, setujui prompt attach pertama, lalu coba lagi. Jika status sign-in tidak diperlukan, utamakan profil `openclaw` yang dikelola.
- `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
- `Remote CDP for profile "<name>" is not reachable` → endpoint CDP remote yang dikonfigurasi tidak dapat dijangkau dari host gateway.
- `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP menjawab tetapi WebSocket CDP tetap tidak dapat dibuka.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki dependensi runtime `playwright-core` milik plugin browser bawaan; jalankan `openclaw doctor --fix`, lalu restart gateway. Snapshot ARIA dan screenshot halaman dasar masih dapat berfungsi, tetapi navigasi, AI snapshot, screenshot elemen berbasis CSS-selector, dan ekspor PDF tetap tidak tersedia.
- `fullPage is not supported for element screenshots` → permintaan screenshot mencampur `--full-page` dengan `--ref` atau `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → panggilan screenshot Chrome MCP / `existing-session` harus menggunakan capture halaman atau `--ref` snapshot, bukan CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook upload Chrome MCP memerlukan snapshot ref, bukan selector CSS.
- `existing-session file uploads currently support one file at a time.` → kirim satu upload per panggilan pada profil Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
- `existing-session type does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:type` pada profil `profile="user"` / Chrome MCP existing-session, atau gunakan profil browser managed/CDP saat timeout kustom diperlukan.
- `existing-session evaluate does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:evaluate` pada profil `profile="user"` / Chrome MCP existing-session, atau gunakan profil browser managed/CDP saat timeout kustom diperlukan.
- `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
- override viewport / dark-mode / locale / offline yang usang pada profil attach-only atau remote CDP → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa merestart seluruh gateway.

Terkait:

- [/tools/browser-linux-troubleshooting](/id/tools/browser-linux-troubleshooting)
- [/tools/browser](/id/tools/browser)

## Jika Anda meng-upgrade dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah upgrade adalah drift konfigurasi atau default yang lebih ketat yang kini ditegakkan.

### 1) Perilaku autentikasi dan override URL berubah

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
- `unauthorized` → endpoint dapat dijangkau tetapi autentikasi salah.

### 2) Guardrail bind dan autentikasi lebih ketat

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Yang perlu diperiksa:

- Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur autentikasi gateway yang valid: autentikasi shared token/password, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
- Key lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

Tanda umum:

- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur autentikasi gateway yang valid.
- `Connectivity probe: failed` saat runtime berjalan → gateway hidup tetapi tidak dapat diakses dengan autentikasi/url saat ini.

### 3) Status pairing dan identitas perangkat berubah

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Yang perlu diperiksa:

- Persetujuan perangkat yang tertunda untuk dashboard/node.
- Persetujuan pairing DM yang tertunda setelah perubahan kebijakan atau identitas.

Tanda umum:

- `device identity required` → autentikasi perangkat tidak terpenuhi.
- `pairing required` → pengirim/perangkat harus disetujui.

Jika konfigurasi layanan dan runtime masih tidak sesuai setelah pemeriksaan, instal ulang metadata layanan dari profile/direktori status yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [/gateway/pairing](/id/gateway/pairing)
- [/gateway/authentication](/id/gateway/authentication)
- [/gateway/background-process](/id/gateway/background-process)

## Terkait

- [Runbook Gateway](/id/gateway)
- [Doctor](/id/gateway/doctor)
- [FAQ](/id/help/faq)
