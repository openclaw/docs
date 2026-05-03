---
read_when:
    - Hub pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian panduan operasional berbasis gejala yang stabil dengan perintah yang tepat
sidebarTitle: Troubleshooting
summary: Runbook pemecahan masalah mendalam untuk Gateway, saluran, automasi, node, dan peramban
title: Pemecahan Masalah
x-i18n:
    generated_at: "2026-05-03T21:33:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Halaman ini adalah runbook mendalam. Mulai dari [/help/troubleshooting](/id/help/troubleshooting) jika Anda ingin alur triase cepat terlebih dahulu.

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
- `openclaw channels status --probe` menampilkan status transport per akun secara langsung dan, jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Instalasi split brain dan pelindung konfigurasi yang lebih baru

Gunakan ini ketika layanan gateway tiba-tiba berhenti setelah pembaruan, atau log menunjukkan bahwa satu binary `openclaw` lebih lama daripada versi yang terakhir menulis `openclaw.json`.

OpenClaw menandai penulisan konfigurasi dengan `meta.lastTouchedVersion`. Perintah baca-saja masih dapat memeriksa konfigurasi yang ditulis oleh OpenClaw yang lebih baru, tetapi mutasi proses dan layanan menolak untuk melanjutkan dari binary yang lebih lama. Tindakan yang diblokir mencakup memulai, menghentikan, memulai ulang, menghapus instalasi layanan gateway, instalasi ulang layanan secara paksa, startup gateway mode layanan, dan pembersihan port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Perbaiki PATH">
    Perbaiki `PATH` agar `openclaw` mengarah ke instalasi yang lebih baru, lalu jalankan ulang tindakan tersebut.
  </Step>
  <Step title="Instal ulang layanan gateway">
    Instal ulang layanan gateway yang dimaksud dari instalasi yang lebih baru:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Hapus wrapper usang">
    Hapus paket sistem usang atau entri wrapper lama yang masih mengarah ke binary `openclaw` lama.
  </Step>
</Steps>

<Warning>
Hanya untuk downgrade yang disengaja atau pemulihan darurat, tetapkan `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` untuk satu perintah tersebut. Biarkan tidak ditetapkan untuk operasi normal.
</Warning>

## Anthropic 429 memerlukan penggunaan ekstra untuk konteks panjang

Gunakan ini ketika log/error mencakup: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cari:

- Model Anthropic Opus/Sonnet yang dipilih memiliki `params.context1m: true`.
- Kredensial Anthropic saat ini tidak memenuhi syarat untuk penggunaan konteks panjang.
- Permintaan gagal hanya pada sesi panjang/jalankan model yang memerlukan jalur beta 1M.

Opsi perbaikan:

<Steps>
  <Step title="Nonaktifkan context1m">
    Nonaktifkan `context1m` untuk model tersebut agar kembali ke jendela konteks normal.
  </Step>
  <Step title="Gunakan kredensial yang memenuhi syarat">
    Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralih ke kunci API Anthropic.
  </Step>
  <Step title="Konfigurasikan model fallback">
    Konfigurasikan model fallback agar proses tetap berjalan ketika permintaan konteks panjang Anthropic ditolak.
  </Step>
</Steps>

Terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan token dan biaya](/id/reference/token-use)
- [Mengapa saya melihat HTTP 429 dari Anthropic?](/id/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend lokal yang kompatibel dengan OpenAI lolos probe langsung tetapi proses agent gagal

Gunakan ini ketika:

- `curl ... /v1/models` berfungsi
- panggilan langsung kecil ke `/v1/chat/completions` berfungsi
- Proses model OpenClaw gagal hanya pada giliran agent normal

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cari:

- panggilan langsung kecil berhasil, tetapi proses OpenClaw gagal hanya pada prompt yang lebih besar
- error `model_not_found` atau 404 meskipun `/v1/chat/completions` langsung
  berfungsi dengan id model polos yang sama
- error backend tentang `messages[].content` yang mengharapkan string
- peringatan `incomplete turn detected ... stopReason=stop payloads=0` yang muncul sesekali dengan backend lokal yang kompatibel dengan OpenAI
- crash backend yang hanya muncul dengan jumlah token prompt yang lebih besar atau prompt runtime agent penuh

<AccordionGroup>
  <Accordion title="Tanda umum">
    - `model_not_found` dengan server lokal bergaya MLX/vLLM → verifikasi `baseUrl` menyertakan `/v1`, `api` adalah `"openai-completions"` untuk backend `/v1/chat/completions`, dan `models.providers.<provider>.models[].id` adalah id lokal provider polos. Pilih dengan prefiks provider satu kali, misalnya `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pertahankan entri katalog sebagai `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend menolak bagian konten Chat Completions terstruktur. Perbaikan: tetapkan `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend menyelesaikan permintaan Chat Completions tetapi tidak mengembalikan teks assistant yang terlihat pengguna untuk giliran tersebut. OpenClaw mencoba ulang giliran kosong yang kompatibel dengan OpenAI dan aman untuk diputar ulang satu kali; kegagalan persisten biasanya berarti backend mengeluarkan konten kosong/non-teks atau menyembunyikan teks jawaban akhir.
    - permintaan langsung kecil berhasil, tetapi proses agent OpenClaw gagal dengan crash backend/model (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agent yang lebih besar.
    - kegagalan berkurang setelah menonaktifkan tools tetapi tidak hilang → skema tool merupakan bagian dari tekanan, tetapi masalah yang tersisa masih pada kapasitas model/server upstream atau bug backend.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Tetapkan `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya menerima string.
    2. Tetapkan `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani permukaan skema tool OpenClaw dengan andal.
    3. Kurangi tekanan prompt jika memungkinkan: bootstrap workspace yang lebih kecil, riwayat sesi yang lebih pendek, model lokal yang lebih ringan, atau backend dengan dukungan konteks panjang yang lebih kuat.
    4. Jika permintaan langsung kecil tetap berhasil sementara giliran agent OpenClaw masih crash di dalam backend, perlakukan ini sebagai batasan server/model upstream dan ajukan repro di sana dengan bentuk payload yang diterima.
  </Accordion>
</AccordionGroup>

Terkait:

- [Konfigurasi](/id/gateway/configuration)
- [Model lokal](/id/gateway/local-models)
- [Endpoint yang kompatibel dengan OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)

## Tidak ada balasan

Jika channel aktif tetapi tidak ada yang menjawab, periksa routing dan kebijakan sebelum menyambungkan ulang apa pun.

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

Tanda umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim perlu disetujui.
- `blocked` / `allowlist` → pengirim/channel difilter oleh kebijakan.

Terkait:

- [Pemecahan masalah channel](/id/channels/troubleshooting)
- [Grup](/id/channels/groups)
- [Pairing](/id/channels/pairing)

## Konektivitas UI kontrol dashboard

Ketika dashboard/UI kontrol tidak dapat terhubung, validasi URL, mode auth, dan asumsi konteks aman.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cari:

- URL probe dan URL dashboard yang benar.
- Ketidakcocokan mode/token auth antara client dan gateway.
- Penggunaan HTTP ketika identitas perangkat diperlukan.

<AccordionGroup>
  <Accordion title="Tanda koneksi / auth">
    - `device identity required` → konteks tidak aman atau auth perangkat hilang.
    - `origin not allowed` → `Origin` browser tidak ada di `gateway.controlUi.allowedOrigins` (atau Anda terhubung dari origin browser non-loopback tanpa allowlist eksplisit).
    - `device nonce required` / `device nonce mismatch` → client tidak menyelesaikan alur auth perangkat berbasis challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client menandatangani payload yang salah (atau timestamp usang) untuk handshake saat ini.
    - `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → client dapat melakukan satu percobaan ulang tepercaya dengan token perangkat yang di-cache.
    - Percobaan ulang token yang di-cache itu menggunakan kembali kumpulan scope yang di-cache dan disimpan bersama token perangkat yang dipairing. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap menggunakan kumpulan scope yang dimintanya.
    - Di luar jalur percobaan ulang tersebut, prioritas auth koneksi adalah token/password bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
    - Pada jalur UI Kontrol Tailscale Serve asinkron, percobaan gagal untuk `{scope, ip}` yang sama diserialisasi sebelum limiter mencatat kegagalan. Karena itu, dua percobaan ulang buruk yang bersamaan dari client yang sama dapat memunculkan `retry later` pada percobaan kedua, bukan dua ketidakcocokan biasa.
    - `too many failed authentication attempts (retry later)` dari client loopback origin browser → kegagalan berulang dari `Origin` ternormalisasi yang sama dikunci sementara; origin localhost lain menggunakan bucket terpisah.
    - `unauthorized` berulang setelah percobaan ulang tersebut → token bersama/token perangkat bergeser; segarkan konfigurasi token dan setujui ulang/rotasi token perangkat jika diperlukan.
    - `gateway connect failed:` → target host/port/url salah.

  </Accordion>
</AccordionGroup>

### Peta cepat kode detail auth

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                 | Makna                                                                                                                                                                                            | Tindakan yang disarankan                                                                                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim token bersama yang diperlukan.                                                                                                                                              | Tempel/atur token di klien dan coba lagi. Untuk jalur dasbor: `openclaw config get gateway.auth.token` lalu tempelkan ke pengaturan Control UI.                                                                                                                                                     |
| `AUTH_TOKEN_MISMATCH`        | Token bersama tidak cocok dengan token auth Gateway.                                                                                                                                             | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang token cache menggunakan ulang cakupan tersetujui yang tersimpan; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan cakupan yang diminta. Jika masih gagal, jalankan [daftar periksa pemulihan penyimpangan token](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per perangkat yang di-cache sudah usang atau dicabut.                                                                                                                                      | Rotasi/setujui ulang token perangkat menggunakan [CLI perangkat](/id/cli/devices), lalu hubungkan kembali.                                                                                                                                                                                              |
| `PAIRING_REQUIRED`           | Identitas perangkat memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` jika ada. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Peningkatan cakupan/peran menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                                      |

<Note>
RPC backend loopback langsung yang diautentikasi dengan token/kata sandi Gateway bersama seharusnya tidak bergantung pada baseline cakupan perangkat-terpasangkan milik CLI. Jika subagen atau panggilan internal lain masih gagal dengan `scope-upgrade`, verifikasi bahwa pemanggil menggunakan `client.id: "gateway-client"` dan `client.mode: "backend"` serta tidak memaksa `deviceIdentity` atau token perangkat eksplisit.
</Note>

Pemeriksaan migrasi auth perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan galat nonce/tanda tangan, perbarui klien yang terhubung dan verifikasi:

<Steps>
  <Step title="Tunggu connect.challenge">
    Klien menunggu `connect.challenge` yang diterbitkan Gateway.
  </Step>
  <Step title="Tandatangani payload">
    Klien menandatangani payload yang terikat tantangan.
  </Step>
  <Step title="Kirim nonce perangkat">
    Klien mengirim `connect.params.device.nonce` dengan nonce tantangan yang sama.
  </Step>
</Steps>

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tidak terduga:

- sesi token perangkat-terpasangkan hanya dapat mengelola perangkat **miliknya sendiri** kecuali pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta cakupan operator yang sudah dimiliki sesi pemanggil

Terkait:

- [Konfigurasi](/id/gateway/configuration) (mode auth Gateway)
- [Control UI](/id/web/control-ui)
- [Perangkat](/id/cli/devices)
- [Akses jarak jauh](/id/gateway/remote)
- [Auth proxy tepercaya](/id/gateway/trusted-proxy-auth)

## Layanan Gateway tidak berjalan

Gunakan ini saat layanan terpasang tetapi proses tidak tetap aktif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Cari:

- `Runtime: stopped` dengan petunjuk keluar.
- Ketidakcocokan konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Tanda umum">
    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode Gateway lokal tidak diaktifkan, atau file konfigurasi tertimpa dan kehilangan `gateway.mode`. Perbaikan: atur `gateway.mode="local"` dalam konfigurasi Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk membubuhkan kembali konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, jalur konfigurasi default adalah `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth Gateway yang valid (token/kata sandi, atau trusted-proxy jika dikonfigurasi).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
    - `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks usang atau paralel ada. Sebagian besar penyiapan sebaiknya mempertahankan satu Gateway per mesin; jika Anda memang memerlukan lebih dari satu, isolasikan port + konfigurasi/status/ruang kerja. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` dari doctor → unit sistem systemd ada sementara layanan tingkat pengguna tidak ada. Hapus atau nonaktifkan duplikat sebelum mengizinkan doctor memasang layanan pengguna, atau atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` jika unit sistem adalah supervisor yang dimaksudkan.
    - `Gateway service port does not match current gateway config` → supervisor terpasang masih mengunci `--port` lama. Jalankan `openclaw doctor --fix` atau `openclaw gateway install --force`, lalu mulai ulang layanan Gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Eksekusi latar belakang dan alat proses](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Doctor](/id/gateway/doctor)

## Gateway menolak konfigurasi tidak valid

Gunakan ini saat startup Gateway gagal dengan `Invalid config` atau log hot reload mengatakan
ia melewati edit yang tidak valid.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Cari:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- File `openclaw.json.rejected.*` berstempel waktu di samping konfigurasi aktif
- File `openclaw.json.clobbered.*` berstempel waktu jika `doctor --fix` memperbaiki edit langsung yang rusak

<AccordionGroup>
  <Accordion title="Yang terjadi">
    - Konfigurasi tidak lolos validasi saat startup, hot reload, atau penulisan yang dimiliki OpenClaw.
    - Startup Gateway gagal tertutup alih-alih menulis ulang `openclaw.json`.
    - Hot reload melewati edit eksternal yang tidak valid dan mempertahankan konfigurasi runtime saat ini tetap aktif.
    - Penulisan yang dimiliki OpenClaw menolak payload tidak valid/destruktif sebelum commit dan menyimpan `.rejected.*`.
    - `openclaw doctor --fix` memiliki perbaikan. Ini dapat menghapus prefiks non-JSON atau memulihkan salinan terakhir yang diketahui baik sambil mempertahankan payload yang ditolak sebagai `.clobbered.*`.

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
  <Accordion title="Tanda umum">
    - `.clobbered.*` ada → doctor mempertahankan edit eksternal yang rusak saat memperbaiki konfigurasi aktif.
    - `.rejected.*` ada → penulisan konfigurasi yang dimiliki OpenClaw gagal pada pemeriksaan skema atau clobber sebelum commit.
    - `Config write rejected:` → penulisan mencoba menghapus bentuk yang diperlukan, mengecilkan file secara tajam, atau mempertahankan konfigurasi tidak valid.
    - `config reload skipped (invalid config):` → edit langsung gagal validasi dan diabaikan oleh Gateway yang sedang berjalan.
    - `Invalid config at ...` → startup gagal sebelum layanan Gateway boot.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → penulisan yang dimiliki OpenClaw ditolak karena kehilangan field atau ukuran dibandingkan cadangan terakhir yang diketahui baik.
    - `Config last-known-good promotion skipped` → kandidat berisi placeholder rahasia yang disunting seperti `***`.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Jalankan `openclaw doctor --fix` agar doctor memperbaiki konfigurasi berprefiks/tertindih atau memulihkan terakhir yang diketahui baik.
    2. Salin hanya kunci yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
    3. Jalankan `openclaw config validate` sebelum memulai ulang.
    4. Jika Anda mengedit manual, pertahankan konfigurasi JSON5 penuh, bukan hanya objek parsial yang ingin Anda ubah.
  </Accordion>
</AccordionGroup>

Terkait:

- [Config](/id/cli/config)
- [Konfigurasi: hot reload](/id/gateway/configuration#config-hot-reload)
- [Konfigurasi: validasi ketat](/id/gateway/configuration#strict-validation)
- [Doctor](/id/gateway/doctor)

## Peringatan probe Gateway

Gunakan ini saat `openclaw gateway probe` mencapai sesuatu, tetapi masih mencetak blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` dalam output JSON.
- Apakah peringatan berkaitan dengan fallback SSH, beberapa Gateway, cakupan yang hilang, atau ref auth yang belum terselesaikan.

Tanda umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah masih mencoba target terkonfigurasi/loopback langsung.
- `multiple reachable gateways detected` → lebih dari satu target menjawab. Biasanya ini berarti penyiapan multi-Gateway yang disengaja atau listener usang/duplikat.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi RPC detail dibatasi cakupan; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → koneksi berhasil, tetapi set RPC diagnostik lengkap timeout atau gagal. Perlakukan ini sebagai Gateway yang dapat dijangkau dengan diagnostik terdegradasi; bandingkan `connect.ok` dan `connect.rpcOk` dalam output `--json`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → Gateway menjawab, tetapi klien ini masih memerlukan pemasangan/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang belum terselesaikan → materi auth tidak tersedia di jalur perintah ini untuk target yang gagal.

Terkait:

- [Gateway](/id/cli/gateway)
- [Beberapa Gateway di host yang sama](/id/gateway#multiple-gateways-same-host)
- [Akses jarak jauh](/id/gateway/remote)

## Channel terhubung, pesan tidak mengalir

Jika status channel terhubung tetapi aliran pesan mati, fokus pada kebijakan, izin, dan aturan pengiriman khusus channel.

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

Signature umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- `pairing` / jejak persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah autentikasi/izin kanal.

Terkait:

- [Pemecahan masalah kanal](/id/channels/troubleshooting)
- [Discord](/id/channels/discord)
- [Telegram](/id/channels/telegram)
- [WhatsApp](/id/channels/whatsapp)

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

- Cron diaktifkan dan wake berikutnya ada.
- Status riwayat eksekusi job (`ok`, `skipped`, `error`).
- Alasan Heartbeat dilewati (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Signature umum">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron dinonaktifkan.
    - `cron: timer tick failed` → tick scheduler gagal; periksa kesalahan file/log/runtime.
    - `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
    - `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / header markdown, sehingga OpenClaw melewati pemanggilan model.
    - `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
    - `heartbeat: unknown accountId` → id akun tidak valid untuk target pengiriman Heartbeat.
    - `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat diselesaikan ke tujuan bergaya DM sementara `agents.defaults.heartbeat.directPolicy` (atau override per agen) diatur ke `block`.

  </Accordion>
</AccordionGroup>

Terkait:

- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [Tugas terjadwal: pemecahan masalah](/id/automation/cron-jobs#troubleshooting)

## Node dipasangkan, alat gagal

Jika Node dipasangkan tetapi alat gagal, isolasi status foreground, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cari:

- Node online dengan kemampuan yang diharapkan.
- Pemberian izin OS untuk kamera/mikrofon/lokasi/layar.
- Persetujuan exec dan status allowlist.

Signature umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi Node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS hilang.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [Persetujuan exec](/id/tools/exec-approvals)
- [Pemecahan masalah Node](/id/nodes/troubleshooting)
- [Node](/id/nodes/index)

## Alat browser gagal

Gunakan ini saat tindakan alat browser gagal meskipun Gateway itu sendiri sehat.

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
  <Accordion title="Signature Plugin / executable">
    - `unknown command "browser"` atau `unknown command 'browser'` → Plugin browser bawaan dikecualikan oleh `plugins.allow`.
    - alat browser hilang / tidak tersedia saat `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga Plugin tidak pernah dimuat.
    - `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
    - `browser.executablePath not found` → path yang dikonfigurasi tidak valid.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi Gateway saat ini tidak memiliki dependensi runtime browser inti; instal ulang atau perbarui OpenClaw, lalu mulai ulang Gateway. Snapshot ARIA dan tangkapan layar halaman dasar masih dapat berfungsi, tetapi navigasi, snapshot AI, tangkapan layar elemen selector CSS, dan ekspor PDF tetap tidak tersedia.

  </Accordion>
  <Accordion title="Signature Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP belum dapat melampirkan ke direktori data browser yang dipilih. Buka halaman inspect browser, aktifkan remote debugging, biarkan browser tetap terbuka, setujui prompt attach pertama, lalu coba lagi. Jika status masuk tidak diperlukan, pilih profil `openclaw` yang dikelola.
    - `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP jarak jauh yang dikonfigurasi tidak dapat dijangkau dari host Gateway.
    - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP merespons tetapi WebSocket CDP tetap tidak dapat dibuka.

  </Accordion>
  <Accordion title="Signature elemen / tangkapan layar / unggahan">
    - `fullPage is not supported for element screenshots` → permintaan tangkapan layar mencampur `--full-page` dengan `--ref` atau `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → panggilan tangkapan layar Chrome MCP / `existing-session` harus menggunakan capture halaman atau `--ref` snapshot, bukan CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook unggahan Chrome MCP memerlukan ref snapshot, bukan selector CSS.
    - `existing-session file uploads currently support one file at a time.` → kirim satu unggahan per panggilan pada profil Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
    - `existing-session type does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:type` pada profil `profile="user"` / existing-session Chrome MCP, atau gunakan profil browser terkelola/CDP saat timeout kustom diperlukan.
    - `existing-session evaluate does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:evaluate` pada profil `profile="user"` / existing-session Chrome MCP, atau gunakan profil browser terkelola/CDP saat timeout kustom diperlukan.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
    - override viewport / mode gelap / locale / offline yang kedaluwarsa pada profil attach-only atau CDP jarak jauh → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepas status emulasi Playwright/CDP tanpa memulai ulang seluruh Gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Browser (dikelola OpenClaw)](/id/tools/browser)
- [Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting)

## Jika Anda melakukan upgrade dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan pasca-upgrade adalah drift konfigurasi atau default yang lebih ketat yang kini diberlakukan.

<AccordionGroup>
  <Accordion title="1. Perilaku override autentikasi dan URL berubah">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Yang perlu diperiksa:

    - Jika `gateway.mode=remote`, panggilan CLI mungkin menargetkan remote sementara layanan lokal Anda baik-baik saja.
    - Panggilan eksplisit `--url` tidak fallback ke kredensial tersimpan.

    Signature umum:

    - `gateway connect failed:` → target URL salah.
    - `unauthorized` → endpoint dapat dijangkau tetapi autentikasi salah.

  </Accordion>
  <Accordion title="2. Guardrail bind dan autentikasi lebih ketat">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Yang perlu diperiksa:

    - Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur autentikasi Gateway yang valid: autentikasi token/kata sandi bersama, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
    - Kunci lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

    Signature umum:

    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur autentikasi Gateway yang valid.
    - `Connectivity probe: failed` sementara runtime sedang berjalan → Gateway hidup tetapi tidak dapat diakses dengan auth/url saat ini.

  </Accordion>
  <Accordion title="3. Status pairing dan identitas perangkat berubah">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Yang perlu diperiksa:

    - Persetujuan perangkat tertunda untuk dashboard/Node.
    - Persetujuan pairing DM tertunda setelah perubahan kebijakan atau identitas.

    Signature umum:

    - `device identity required` → autentikasi perangkat belum terpenuhi.
    - `pairing required` → pengirim/perangkat harus disetujui.

  </Accordion>
</AccordionGroup>

Jika konfigurasi layanan dan runtime masih tidak sesuai setelah pemeriksaan, instal ulang metadata layanan dari direktori profil/status yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [Autentikasi](/id/gateway/authentication)
- [Exec latar belakang dan alat proses](/id/gateway/background-process)
- [Pairing milik Gateway](/id/gateway/pairing)

## Terkait

- [Doctor](/id/gateway/doctor)
- [FAQ](/id/help/faq)
- [Runbook Gateway](/id/gateway)
