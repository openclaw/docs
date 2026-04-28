---
read_when:
    - Hub pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
sidebarTitle: Troubleshooting
summary: Runbook pemecahan masalah mendalam untuk gateway, channel, otomasi, Node, dan browser
title: Pemecahan masalah
x-i18n:
    generated_at: "2026-04-26T11:31:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Halaman ini adalah runbook mendalam. Mulai dari [/help/troubleshooting](/id/help/troubleshooting) jika Anda ingin alur triase cepat terlebih dahulu.

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
- `openclaw doctor` melaporkan tidak ada masalah config/service yang memblokir.
- `openclaw channels status --probe` menampilkan status transport live per akun dan, jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Instalasi split brain dan guard config yang lebih baru

Gunakan ini saat sebuah service gateway tiba-tiba berhenti setelah pembaruan, atau log menunjukkan bahwa satu binary `openclaw` lebih lama daripada versi yang terakhir menulis `openclaw.json`.

OpenClaw menandai penulisan config dengan `meta.lastTouchedVersion`. Perintah read-only tetap dapat memeriksa config yang ditulis oleh OpenClaw yang lebih baru, tetapi mutasi proses dan service menolak melanjutkan dari binary yang lebih lama. Aksi yang diblokir mencakup start, stop, restart, uninstall service gateway, forced service reinstall, startup gateway mode service, dan pembersihan port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Perbaiki PATH">
    Perbaiki `PATH` agar `openclaw` di-resolve ke instalasi yang lebih baru, lalu jalankan ulang aksinya.
  </Step>
  <Step title="Instal ulang service gateway">
    Instal ulang service gateway yang dimaksud dari instalasi yang lebih baru:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Hapus wrapper basi">
    Hapus package sistem basi atau entri wrapper lama yang masih menunjuk ke binary `openclaw` lama.
  </Step>
</Steps>

<Warning>
Hanya untuk downgrade yang disengaja atau pemulihan darurat, atur `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` untuk satu perintah tersebut. Biarkan tetap tidak diatur untuk operasi normal.
</Warning>

## Anthropic 429 membutuhkan penggunaan tambahan untuk konteks panjang

Gunakan ini saat log/error mencakup: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cari:

- Model Opus/Sonnet Anthropic yang dipilih memiliki `params.context1m: true`.
- Kredensial Anthropic saat ini tidak memenuhi syarat untuk penggunaan konteks panjang.
- Permintaan gagal hanya pada sesi panjang/eksekusi model yang memerlukan jalur beta 1M.

Opsi perbaikan:

<Steps>
  <Step title="Nonaktifkan context1m">
    Nonaktifkan `context1m` untuk model tersebut agar fallback ke jendela konteks normal.
  </Step>
  <Step title="Gunakan kredensial yang memenuhi syarat">
    Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralih ke API key Anthropic.
  </Step>
  <Step title="Konfigurasikan model fallback">
    Konfigurasikan model fallback agar eksekusi tetap berlanjut saat permintaan konteks panjang Anthropic ditolak.
  </Step>
</Steps>

Terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan token dan biaya](/id/reference/token-use)
- [Mengapa saya melihat HTTP 429 dari Anthropic?](/id/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend lokal yang kompatibel dengan OpenAI lulus probe langsung tetapi eksekusi agen gagal

Gunakan ini saat:

- `curl ... /v1/models` berfungsi
- panggilan `/v1/chat/completions` langsung yang kecil berfungsi
- eksekusi model OpenClaw gagal hanya pada giliran agen normal

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cari:

- panggilan kecil langsung berhasil, tetapi eksekusi OpenClaw gagal hanya pada prompt yang lebih besar
- error backend tentang `messages[].content` yang mengharapkan string
- crash backend yang hanya muncul dengan jumlah token prompt yang lebih besar atau prompt runtime agen penuh

<AccordionGroup>
  <Accordion title="Tanda tangan umum">
    - `messages[...].content: invalid type: sequence, expected a string` → backend menolak bagian konten Chat Completions yang terstruktur. Perbaikan: atur `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - permintaan kecil langsung berhasil, tetapi eksekusi agen OpenClaw gagal dengan crash backend/model (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agen yang lebih besar.
    - kegagalan berkurang setelah tools dinonaktifkan tetapi tidak hilang → schema tool merupakan bagian dari tekanan, tetapi masalah yang tersisa tetap merupakan keterbatasan model/server upstream atau bug backend.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Atur `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya mendukung string.
    2. Atur `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani surface schema tool OpenClaw secara andal.
    3. Kurangi tekanan prompt bila memungkinkan: bootstrap workspace yang lebih kecil, riwayat sesi yang lebih pendek, model lokal yang lebih ringan, atau backend dengan dukungan konteks panjang yang lebih kuat.
    4. Jika permintaan kecil langsung tetap berhasil sementara giliran agen OpenClaw masih crash di dalam backend, perlakukan ini sebagai keterbatasan server/model upstream dan ajukan repro di sana dengan bentuk payload yang diterima.
  </Accordion>
</AccordionGroup>

Terkait:

- [Configuration](/id/gateway/configuration)
- [Model lokal](/id/gateway/local-models)
- [Endpoint yang kompatibel dengan OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)

## Tidak ada balasan

Jika channel aktif tetapi tidak ada yang menjawab, periksa routing dan kebijakan sebelum menghubungkan ulang apa pun.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cari:

- Pairing tertunda untuk pengirim DM.
- Pembatasan mention grup (`requireMention`, `mentionPatterns`).
- Ketidakcocokan allowlist channel/grup.

Tanda tangan umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim perlu disetujui.
- `blocked` / `allowlist` → pengirim/channel difilter oleh kebijakan.

Terkait:

- [Pemecahan masalah channel](/id/channels/troubleshooting)
- [Grup](/id/channels/groups)
- [Pairing](/id/channels/pairing)

## Konektivitas Dashboard Control UI

Saat dashboard/control UI tidak mau terhubung, validasi URL, mode auth, dan asumsi konteks aman.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cari:

- URL probe dan URL dashboard yang benar.
- Ketidakcocokan mode auth/token antara klien dan gateway.
- Penggunaan HTTP saat identitas device diperlukan.

<AccordionGroup>
  <Accordion title="Tanda tangan koneksi / auth">
    - `device identity required` → konteks tidak aman atau auth device hilang.
    - `origin not allowed` → browser `Origin` tidak ada di `gateway.controlUi.allowedOrigins` (atau Anda terhubung dari origin browser non-loopback tanpa allowlist eksplisit).
    - `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan alur auth device berbasis challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah (atau timestamp basi) untuk handshake saat ini.
    - `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu percobaan ulang tepercaya dengan token device yang di-cache.
    - Percobaan ulang token-cache tersebut menggunakan ulang kumpulan scope cache yang disimpan bersama token device yang sudah di-pairing. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan kumpulan scope yang diminta.
    - Di luar jalur percobaan ulang itu, prioritas auth koneksi adalah shared token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token device tersimpan, lalu token bootstrap.
    - Pada jalur async Tailscale Serve Control UI, percobaan gagal untuk `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan. Karena itu, dua percobaan ulang buruk yang bersamaan dari klien yang sama dapat menampilkan `retry later` pada percobaan kedua alih-alih dua mismatch biasa.
    - `too many failed authentication attempts (retry later)` dari klien loopback origin browser → kegagalan berulang dari `Origin` yang sama dan telah dinormalisasi itu dikunci sementara; origin localhost lain menggunakan bucket terpisah.
    - `unauthorized` berulang setelah percobaan ulang tersebut → drift shared token/device token; segarkan config token dan setujui/rotasi ulang token device jika perlu.
    - `gateway connect failed:` → target host/port/url salah.

  </Accordion>
</AccordionGroup>

### Peta cepat kode detail auth

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                  | Arti                                                                                                                                                                                         | Tindakan yang disarankan                                                                                                                                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim shared token yang diperlukan.                                                                                                                                            | Tempel/atur token di klien lalu coba lagi. Untuk jalur dashboard: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan Control UI.                                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | Shared token tidak cocok dengan token auth gateway.                                                                                                                                           | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang token-cache menggunakan ulang scope tersetujui yang disimpan; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan scope yang diminta. Jika masih gagal, jalankan [checklist pemulihan token drift](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-device yang di-cache sudah basi atau dicabut.                                                                                                                                       | Rotasi/setujui ulang token device menggunakan [CLI devices](/id/cli/devices), lalu hubungkan kembali.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Identitas device memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` bila ada. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Upgrade scope/role menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                              |

<Note>
RPC backend loopback langsung yang diautentikasi dengan shared token/password gateway seharusnya tidak bergantung pada baseline scope device yang sudah di-pairing milik CLI. Jika subagen atau pemanggilan internal lain masih gagal dengan `scope-upgrade`, verifikasi bahwa pemanggil menggunakan `client.id: "gateway-client"` dan `client.mode: "backend"` serta tidak memaksa `deviceIdentity` eksplisit atau token device.
</Note>

Pemeriksaan migrasi auth device v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan error nonce/signature, perbarui klien yang terhubung dan verifikasi:

<Steps>
  <Step title="Tunggu connect.challenge">
    Klien menunggu `connect.challenge` yang diterbitkan gateway.
  </Step>
  <Step title="Tandatangani payload">
    Klien menandatangani payload yang terikat pada challenge.
  </Step>
  <Step title="Kirim nonce device">
    Klien mengirim `connect.params.device.nonce` dengan nonce challenge yang sama.
  </Step>
</Steps>

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tidak terduga:

- sesi token device yang sudah di-pairing hanya dapat mengelola **device mereka sendiri** kecuali pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta scope operator yang sudah dimiliki oleh sesi pemanggil

Terkait:

- [Configuration](/id/gateway/configuration) (mode auth gateway)
- [Control UI](/id/web/control-ui)
- [Devices](/id/cli/devices)
- [Akses remote](/id/gateway/remote)
- [Auth trusted proxy](/id/gateway/trusted-proxy-auth)

## Service gateway tidak berjalan

Gunakan ini saat service terpasang tetapi proses tidak tetap hidup.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga pindai service level sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk exit.
- Ketidakcocokan config service (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Tanda tangan umum">
    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal tidak diaktifkan, atau file config tertimpa dan kehilangan `gateway.mode`. Perbaikan: atur `gateway.mode="local"` di config Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk menandai ulang config mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, path config default adalah `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
    - `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks yang basi atau paralel masih ada. Sebagian besar penyiapan sebaiknya mempertahankan satu gateway per mesin; jika Anda memang membutuhkan lebih dari satu, isolasikan port + config/status/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

  </Accordion>
</AccordionGroup>

Terkait:

- [Exec latar belakang dan tool process](/id/gateway/background-process)
- [Configuration](/id/gateway/configuration)
- [Doctor](/id/gateway/doctor)

## Gateway memulihkan config last-known-good

Gunakan ini saat Gateway mulai, tetapi log menyatakan bahwa `openclaw.json` dipulihkan.

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
- File `openclaw.json.clobbered.*` bertimestamp di samping config aktif
- System event agen utama yang diawali dengan `Config recovery warning`

<AccordionGroup>
  <Accordion title="Apa yang terjadi">
    - Config yang ditolak tidak lolos validasi selama startup atau hot reload.
    - OpenClaw menyimpan payload yang ditolak sebagai `.clobbered.*`.
    - Config aktif dipulihkan dari salinan last-known-good yang terakhir tervalidasi.
    - Giliran agen utama berikutnya diperingatkan agar tidak menulis ulang config yang ditolak secara membabi buta.
    - Jika semua masalah validasi berada di bawah `plugins.entries.<id>...`, OpenClaw tidak akan memulihkan seluruh file. Kegagalan lokal Plugin tetap terdengar jelas sementara pengaturan pengguna lain yang tidak terkait tetap berada dalam config aktif.

  </Accordion>
  <Accordion title="Periksa dan perbaiki">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Tanda tangan umum">
    - `.clobbered.*` ada → edit langsung eksternal atau pembacaan startup dipulihkan.
    - `.rejected.*` ada → penulisan config milik OpenClaw gagal pada pemeriksaan schema atau clobber sebelum commit.
    - `Config write rejected:` → penulisan mencoba menghapus bentuk yang diperlukan, menyusutkan file secara tajam, atau menyimpan config yang tidak valid.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → startup memperlakukan file saat ini sebagai clobbered karena kehilangan field atau ukuran dibanding backup last-known-good.
    - `Config last-known-good promotion skipped` → kandidat berisi placeholder secret yang disamarkan seperti `***`.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Pertahankan config aktif yang telah dipulihkan jika memang sudah benar.
    2. Salin hanya key yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
    3. Jalankan `openclaw config validate` sebelum restart.
    4. Jika Anda mengedit secara manual, pertahankan config JSON5 lengkap, bukan hanya objek parsial yang ingin Anda ubah.
  </Accordion>
</AccordionGroup>

Terkait:

- [Config](/id/cli/config)
- [Configuration: hot reload](/id/gateway/configuration#config-hot-reload)
- [Configuration: strict validation](/id/gateway/configuration#strict-validation)
- [Doctor](/id/gateway/doctor)

## Peringatan probe gateway

Gunakan ini saat `openclaw gateway probe` menjangkau sesuatu, tetapi masih mencetak blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` di output JSON.
- Apakah peringatan tersebut tentang fallback SSH, beberapa gateway, scope yang hilang, atau ref auth yang tidak dapat di-resolve.

Tanda tangan umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target langsung yang dikonfigurasi/loopback.
- `multiple reachable gateways detected` → lebih dari satu target menjawab. Biasanya ini berarti penyiapan multi-gateway yang disengaja atau listener yang basi/ganda.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi detail RPC dibatasi oleh scope; pair identitas device atau gunakan kredensial dengan `operator.read`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → gateway menjawab, tetapi klien ini masih memerlukan pairing/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang tidak dapat di-resolve → materi auth tidak tersedia dalam jalur perintah ini untuk target yang gagal.

Terkait:

- [Gateway](/id/cli/gateway)
- [Beberapa gateway pada host yang sama](/id/gateway#multiple-gateways-same-host)
- [Akses remote](/id/gateway/remote)

## Channel terhubung, pesan tidak mengalir

Jika status channel adalah connected tetapi aliran pesan mati, fokus pada kebijakan, izin, dan aturan pengiriman khusus channel.

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
- Izin/scope API channel yang hilang.

Tanda tangan umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- `pairing` / jejak persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah auth/izin channel.

Terkait:

- [Pemecahan masalah channel](/id/channels/troubleshooting)
- [Discord](/id/channels/discord)
- [Telegram](/id/channels/telegram)
- [WhatsApp](/id/channels/whatsapp)

## Pengiriman Cron dan Heartbeat

Jika Cron atau Heartbeat tidak berjalan atau tidak mengirim, verifikasi status scheduler terlebih dahulu, lalu target pengiriman.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cari:

- Cron aktif dan wake berikutnya ada.
- Status riwayat eksekusi job (`ok`, `skipped`, `error`).
- Alasan skip Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Tanda tangan umum">
    - `cron: scheduler disabled; jobs will not run automatically` → cron dinonaktifkan.
    - `cron: timer tick failed` → tick scheduler gagal; periksa file/log/error runtime.
    - `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela active hours.
    - `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / heading markdown, sehingga OpenClaw melewati pemanggilan model.
    - `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
    - `heartbeat: unknown accountId` → id akun tidak valid untuk target pengiriman Heartbeat.
    - `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat di-resolve ke tujuan bergaya DM sementara `agents.defaults.heartbeat.directPolicy` (atau override per agen) diatur ke `block`.

  </Accordion>
</AccordionGroup>

Terkait:

- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [Tugas terjadwal: pemecahan masalah](/id/automation/cron-jobs#troubleshooting)

## Node sudah di-pairing, tool gagal

Jika sebuah Node sudah di-pairing tetapi tool gagal, isolasi status foreground, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cari:

- Node online dengan kapabilitas yang diharapkan.
- Pemberian izin OS untuk kamera/mic/lokasi/layar.
- Persetujuan exec dan status allowlist.

Tanda tangan umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi Node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS hilang.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [Persetujuan exec](/id/tools/exec-approvals)
- [Pemecahan masalah Node](/id/nodes/troubleshooting)
- [Nodes](/id/nodes/index)

## Tool browser gagal

Gunakan ini saat aksi tool browser gagal meskipun gateway itu sendiri sehat.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cari:

- Apakah `plugins.allow` diatur dan menyertakan `browser`.
- Path executable browser yang valid.
- Keterjangkauan profil CDP.
- Ketersediaan Chrome lokal untuk profil `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Tanda tangan Plugin / executable">
    - `unknown command "browser"` atau `unknown command 'browser'` → Plugin browser bawaan dikecualikan oleh `plugins.allow`.
    - tool browser hilang / tidak tersedia sementara `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga Plugin tidak pernah dimuat.
    - `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
    - `browser.executablePath not found` → path yang dikonfigurasi tidak valid.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki dependensi runtime `playwright-core` milik Plugin browser bawaan; jalankan `openclaw doctor --fix`, lalu restart gateway. Snapshot ARIA dan screenshot halaman dasar mungkin tetap berfungsi, tetapi navigasi, snapshot AI, screenshot elemen selector CSS, dan ekspor PDF tetap tidak tersedia.

  </Accordion>
  <Accordion title="Tanda tangan Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP belum dapat attach ke direktori data browser yang dipilih. Buka halaman inspect browser, aktifkan remote debugging, biarkan browser tetap terbuka, setujui prompt attach pertama, lalu coba lagi. Jika status login tidak diperlukan, utamakan profil terkelola `openclaw`.
    - `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP remote yang dikonfigurasi tidak dapat dijangkau dari host gateway.
    - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP menjawab tetapi WebSocket CDP tetap tidak dapat dibuka.

  </Accordion>
  <Accordion title="Tanda tangan elemen / screenshot / upload">
    - `fullPage is not supported for element screenshots` → permintaan screenshot mencampur `--full-page` dengan `--ref` atau `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → pemanggilan screenshot Chrome MCP / `existing-session` harus menggunakan penangkapan halaman atau `--ref` snapshot, bukan CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook upload Chrome MCP memerlukan ref snapshot, bukan selector CSS.
    - `existing-session file uploads currently support one file at a time.` → kirim satu upload per panggilan pada profil Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
    - `existing-session type does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:type` pada profil `profile="user"` / Chrome MCP existing-session, atau gunakan profil browser terkelola/CDP saat timeout kustom diperlukan.
    - `existing-session evaluate does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:evaluate` pada profil `profile="user"` / Chrome MCP existing-session, atau gunakan profil browser terkelola/CDP saat timeout kustom diperlukan.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
    - override viewport / dark-mode / locale / offline yang basi pada profil attach-only atau CDP remote → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa me-restart seluruh gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Browser (dikelola OpenClaw)](/id/tools/browser)
- [Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting)

## Jika Anda melakukan upgrade dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah upgrade adalah drift config atau default yang lebih ketat yang kini diterapkan.

<AccordionGroup>
  <Accordion title="1. Perilaku override auth dan URL berubah">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Yang perlu diperiksa:

    - Jika `gateway.mode=remote`, pemanggilan CLI mungkin menargetkan remote sementara service lokal Anda baik-baik saja.
    - Pemanggilan `--url` eksplisit tidak melakukan fallback ke kredensial yang tersimpan.

    Tanda tangan umum:

    - `gateway connect failed:` → target URL salah.
    - `unauthorized` → endpoint dapat dijangkau tetapi auth salah.

  </Accordion>
  <Accordion title="2. Guardrail bind dan auth lebih ketat">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Yang perlu diperiksa:

    - Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur auth gateway yang valid: auth shared token/password, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
    - Key lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

    Tanda tangan umum:

    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid.
    - `Connectivity probe: failed` sementara runtime berjalan → gateway hidup tetapi tidak dapat diakses dengan auth/url saat ini.

  </Accordion>
  <Accordion title="3. Status pairing dan identitas device berubah">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Yang perlu diperiksa:

    - Persetujuan device tertunda untuk dashboard/Nodes.
    - Persetujuan DM pairing tertunda setelah perubahan kebijakan atau identitas.

    Tanda tangan umum:

    - `device identity required` → auth device tidak terpenuhi.
    - `pairing required` → pengirim/device harus disetujui.

  </Accordion>
</AccordionGroup>

Jika config service dan runtime masih tidak sesuai setelah pemeriksaan, instal ulang metadata service dari direktori profil/status yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [Authentication](/id/gateway/authentication)
- [Exec latar belakang dan tool process](/id/gateway/background-process)
- [Pairing milik Gateway](/id/gateway/pairing)

## Terkait

- [Doctor](/id/gateway/doctor)
- [FAQ](/id/help/faq)
- [Runbook Gateway](/id/gateway)
