---
read_when:
    - Hub pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
sidebarTitle: Troubleshooting
summary: Runbook pemecahan masalah mendalam untuk Gateway, saluran, otomatisasi, Node, dan peramban
title: Pemecahan Masalah
x-i18n:
    generated_at: "2026-05-02T09:22:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
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
- `openclaw doctor` melaporkan tidak ada masalah konfigurasi/layanan yang memblokir.
- `openclaw channels status --probe` menampilkan status transport langsung per akun dan, jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Instalasi split brain dan pelindung konfigurasi yang lebih baru

Gunakan ini ketika layanan Gateway tiba-tiba berhenti setelah pembaruan, atau log menunjukkan bahwa satu biner `openclaw` lebih lama daripada versi yang terakhir menulis `openclaw.json`.

OpenClaw menandai penulisan konfigurasi dengan `meta.lastTouchedVersion`. Perintah hanya-baca masih dapat memeriksa konfigurasi yang ditulis oleh OpenClaw yang lebih baru, tetapi mutasi proses dan layanan menolak melanjutkan dari biner yang lebih lama. Tindakan yang diblokir mencakup start, stop, restart, uninstall layanan Gateway, instal ulang layanan paksa, startup Gateway mode layanan, dan pembersihan port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Perbaiki `PATH` agar `openclaw` mengarah ke instalasi yang lebih baru, lalu jalankan ulang tindakan tersebut.
  </Step>
  <Step title="Reinstall the gateway service">
    Instal ulang layanan Gateway yang dimaksud dari instalasi yang lebih baru:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Hapus paket sistem usang atau entri wrapper lama yang masih menunjuk ke biner `openclaw` lama.
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
  <Step title="Disable context1m">
    Nonaktifkan `context1m` untuk model tersebut agar kembali ke jendela konteks normal.
  </Step>
  <Step title="Use an eligible credential">
    Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralih ke kunci API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Konfigurasikan model fallback agar run berlanjut ketika permintaan konteks panjang Anthropic ditolak.
  </Step>
</Steps>

Terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan dan biaya token](/id/reference/token-use)
- [Mengapa saya melihat HTTP 429 dari Anthropic?](/id/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend lokal kompatibel OpenAI lolos probe langsung tetapi run agen gagal

Gunakan ini ketika:

- `curl ... /v1/models` berfungsi
- panggilan langsung kecil `/v1/chat/completions` berfungsi
- Run model OpenClaw gagal hanya pada giliran agen normal

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
- error `model_not_found` atau 404 meskipun `/v1/chat/completions` langsung
  berfungsi dengan id model polos yang sama
- error backend tentang `messages[].content` yang mengharapkan string
- peringatan `incomplete turn detected ... stopReason=stop payloads=0` yang sesekali muncul dengan backend lokal kompatibel OpenAI
- crash backend yang muncul hanya dengan jumlah token prompt lebih besar atau prompt runtime agen penuh

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` dengan server lokal bergaya MLX/vLLM → verifikasi `baseUrl` mencakup `/v1`, `api` adalah `"openai-completions"` untuk backend `/v1/chat/completions`, dan `models.providers.<provider>.models[].id` adalah id lokal provider polos. Pilih dengan prefiks provider satu kali, misalnya `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pertahankan entri katalog sebagai `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend menolak bagian konten Chat Completions terstruktur. Perbaikan: tetapkan `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend menyelesaikan permintaan Chat Completions tetapi tidak mengembalikan teks asisten yang terlihat pengguna untuk giliran tersebut. OpenClaw mencoba ulang giliran kosong kompatibel OpenAI yang aman diputar ulang satu kali; kegagalan persisten biasanya berarti backend memancarkan konten kosong/non-teks atau menekan teks jawaban akhir.
    - permintaan kecil langsung berhasil, tetapi run agen OpenClaw gagal dengan crash backend/model (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agen yang lebih besar.
    - kegagalan berkurang setelah menonaktifkan tool tetapi tidak hilang → skema tool adalah bagian dari tekanan, tetapi masalah yang tersisa masih kapasitas model/server upstream atau bug backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Tetapkan `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya menerima string.
    2. Tetapkan `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani permukaan skema tool OpenClaw secara andal.
    3. Kurangi tekanan prompt jika memungkinkan: bootstrap workspace yang lebih kecil, riwayat sesi yang lebih pendek, model lokal yang lebih ringan, atau backend dengan dukungan konteks panjang yang lebih kuat.
    4. Jika permintaan kecil langsung tetap lolos sementara giliran agen OpenClaw masih crash di dalam backend, perlakukan itu sebagai batasan server/model upstream dan ajukan repro di sana dengan bentuk payload yang diterima.
  </Accordion>
</AccordionGroup>

Terkait:

- [Konfigurasi](/id/gateway/configuration)
- [Model lokal](/id/gateway/local-models)
- [Endpoint kompatibel OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)

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

Tanda umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim memerlukan persetujuan.
- `blocked` / `allowlist` → pengirim/channel difilter oleh kebijakan.

Terkait:

- [Pemecahan masalah channel](/id/channels/troubleshooting)
- [Grup](/id/channels/groups)
- [Pairing](/id/channels/pairing)

## Konektivitas UI kontrol dasbor

Ketika UI dasbor/kontrol tidak dapat terhubung, validasi URL, mode autentikasi, dan asumsi konteks aman.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cari:

- URL probe dan URL dasbor yang benar.
- Ketidakcocokan mode/token autentikasi antara klien dan Gateway.
- Penggunaan HTTP ketika identitas perangkat diperlukan.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → konteks tidak aman atau autentikasi perangkat hilang.
    - `origin not allowed` → `Origin` browser tidak ada di `gateway.controlUi.allowedOrigins` (atau Anda terhubung dari origin browser non-loopback tanpa allowlist eksplisit).
    - `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan alur autentikasi perangkat berbasis tantangan (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah (atau timestamp usang) untuk handshake saat ini.
    - `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu percobaan ulang tepercaya dengan token perangkat yang di-cache.
    - Percobaan ulang token cache tersebut menggunakan kembali set cakupan cache yang disimpan bersama token perangkat yang dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan set cakupan yang dimintanya.
    - Di luar jalur percobaan ulang tersebut, prioritas autentikasi connect adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
    - Pada jalur UI Kontrol Tailscale Serve async, upaya gagal untuk `{scope, ip}` yang sama diserialkan sebelum pembatas mencatat kegagalan. Karena itu, dua percobaan ulang buruk bersamaan dari klien yang sama dapat menampilkan `retry later` pada upaya kedua, bukan dua mismatch biasa.
    - `too many failed authentication attempts (retry later)` dari klien loopback origin browser → kegagalan berulang dari `Origin` ternormalisasi yang sama dikunci sementara; origin localhost lain menggunakan bucket terpisah.
    - `unauthorized` berulang setelah percobaan ulang tersebut → token bersama/token perangkat bergeser; segarkan konfigurasi token dan setujui ulang/rotasi token perangkat jika perlu.
    - `gateway connect failed:` → target host/port/url salah.

  </Accordion>
</AccordionGroup>

### Peta cepat kode detail autentikasi

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                  | Arti                                                                                                                                                                                        | Tindakan yang disarankan                                                                                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim token bersama yang diperlukan.                                                                                                                                          | Tempel/atur token di klien lalu coba lagi. Untuk jalur dasbor: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan UI Kontrol.                                                                                                                                            |
| `AUTH_TOKEN_MISMATCH`        | Token bersama tidak cocok dengan token autentikasi Gateway.                                                                                                                                  | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang token cache memakai ulang cakupan tersetujui yang tersimpan; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan cakupan yang diminta. Jika masih gagal, jalankan [daftar periksa pemulihan drift token](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-perangkat yang di-cache sudah usang atau dicabut.                                                                                                                                  | Rotasi/setujui ulang token perangkat menggunakan [CLI perangkat](/id/cli/devices), lalu sambungkan kembali.                                                                                                                                                                                 |
| `PAIRING_REQUIRED`           | Identitas perangkat memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` jika ada. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Peningkatan cakupan/peran menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                         |

<Note>
RPC backend loopback langsung yang diautentikasi dengan token/kata sandi Gateway bersama tidak boleh bergantung pada baseline cakupan perangkat-terpasangkan milik CLI. Jika subagen atau panggilan internal lain masih gagal dengan `scope-upgrade`, verifikasi bahwa pemanggil menggunakan `client.id: "gateway-client"` dan `client.mode: "backend"` serta tidak memaksa `deviceIdentity` atau token perangkat eksplisit.
</Note>

Pemeriksaan migrasi autentikasi perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan kesalahan nonce/tanda tangan, perbarui klien yang tersambung dan verifikasi:

<Steps>
  <Step title="Tunggu connect.challenge">
    Klien menunggu `connect.challenge` yang diterbitkan Gateway.
  </Step>
  <Step title="Tandatangani payload">
    Klien menandatangani payload yang terikat challenge.
  </Step>
  <Step title="Kirim nonce perangkat">
    Klien mengirim `connect.params.device.nonce` dengan nonce challenge yang sama.
  </Step>
</Steps>

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tidak terduga:

- sesi token perangkat-terpasangkan hanya dapat mengelola perangkat **miliknya sendiri** kecuali pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta cakupan operator yang sudah dimiliki sesi pemanggil

Terkait:

- [Konfigurasi](/id/gateway/configuration) (mode autentikasi Gateway)
- [UI Kontrol](/id/web/control-ui)
- [Perangkat](/id/cli/devices)
- [Akses jarak jauh](/id/gateway/remote)
- [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth)

## Layanan Gateway tidak berjalan

Gunakan ini ketika layanan terpasang tetapi proses tidak tetap aktif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga pindai layanan tingkat sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk kode keluar.
- Ketidaksesuaian konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan ketika `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Tanda umum">
    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode Gateway lokal tidak diaktifkan, atau berkas konfigurasi tertimpa dan kehilangan `gateway.mode`. Perbaikan: atur `gateway.mode="local"` di konfigurasi Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk mencap ulang konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, jalur konfigurasi default adalah `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur autentikasi Gateway yang valid (token/kata sandi, atau trusted-proxy jika dikonfigurasi).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
    - `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks usang atau paralel masih ada. Sebagian besar penyiapan sebaiknya mempertahankan satu Gateway per mesin; jika Anda memang memerlukan lebih dari satu, isolasi port + konfigurasi/status/ruang kerja. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` dari doctor → unit sistem systemd ada sementara layanan tingkat pengguna hilang. Hapus atau nonaktifkan duplikat sebelum mengizinkan doctor memasang layanan pengguna, atau atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` jika unit sistem adalah supervisor yang dimaksudkan.
    - `Gateway service port does not match current gateway config` → supervisor terpasang masih mengunci `--port` lama. Jalankan `openclaw doctor --fix` atau `openclaw gateway install --force`, lalu mulai ulang layanan Gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Eksekusi latar belakang dan alat proses](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Doctor](/id/gateway/doctor)

## Gateway memulihkan konfigurasi last-known-good

Gunakan ini ketika Gateway mulai berjalan, tetapi log mengatakan bahwa `openclaw.json` dipulihkan.

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
- Berkas `openclaw.json.clobbered.*` bertimestamp di samping konfigurasi aktif
- Peristiwa sistem agen utama yang diawali dengan `Config recovery warning`

<AccordionGroup>
  <Accordion title="Apa yang terjadi">
    - Konfigurasi yang ditolak tidak lolos validasi saat startup atau hot reload.
    - OpenClaw mempertahankan payload yang ditolak sebagai `.clobbered.*`.
    - Konfigurasi aktif dipulihkan dari salinan last-known-good tervalidasi terakhir.
    - Giliran agen utama berikutnya diperingatkan agar tidak menulis ulang konfigurasi yang ditolak secara membabi buta.
    - Jika semua masalah validasi berada di bawah `plugins.entries.<id>...`, OpenClaw tidak akan memulihkan seluruh berkas. Kegagalan lokal Plugin tetap terlihat jelas sementara pengaturan pengguna yang tidak terkait tetap berada dalam konfigurasi aktif.

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
    - `.clobbered.*` ada → edit langsung eksternal atau pembacaan startup telah dipulihkan.
    - `.rejected.*` ada → penulisan konfigurasi milik OpenClaw gagal pada pemeriksaan skema atau clobber sebelum commit.
    - `Config write rejected:` → penulisan mencoba menghapus bentuk wajib, mengecilkan berkas secara tajam, atau mempertahankan konfigurasi tidak valid.
    - `Rejected validation details:` → log pemulihan atau pemberitahuan agen utama menyertakan jalur skema yang menyebabkan pemulihan, seperti `agents.defaults.execution` atau `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → startup memperlakukan berkas saat ini sebagai clobbered karena kehilangan field atau ukuran dibandingkan cadangan last-known-good.
    - `Config last-known-good promotion skipped` → kandidat berisi placeholder rahasia yang disamarkan seperti `***`.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Pertahankan konfigurasi aktif yang dipulihkan jika sudah benar.
    2. Salin hanya kunci yang dimaksudkan dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
    3. Jalankan `openclaw config validate` sebelum memulai ulang.
    4. Jika Anda mengedit secara manual, pertahankan konfigurasi JSON5 lengkap, bukan hanya objek parsial yang ingin Anda ubah.
  </Accordion>
</AccordionGroup>

Terkait:

- [Konfigurasi](/id/cli/config)
- [Konfigurasi: hot reload](/id/gateway/configuration#config-hot-reload)
- [Konfigurasi: validasi ketat](/id/gateway/configuration#strict-validation)
- [Doctor](/id/gateway/doctor)

## Peringatan probe Gateway

Gunakan ini ketika `openclaw gateway probe` mencapai sesuatu, tetapi masih mencetak blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` dalam output JSON.
- Apakah peringatan berkaitan dengan fallback SSH, beberapa Gateway, cakupan yang hilang, atau ref autentikasi yang belum terselesaikan.

Tanda umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah masih mencoba target terkonfigurasi/loopback langsung.
- `multiple reachable gateways detected` → lebih dari satu target menjawab. Biasanya ini berarti penyiapan multi-Gateway yang disengaja atau listener usang/duplikat.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi RPC detail dibatasi cakupan; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → koneksi berhasil, tetapi set RPC diagnostik penuh timeout atau gagal. Perlakukan ini sebagai Gateway yang dapat dijangkau dengan diagnostik terdegradasi; bandingkan `connect.ok` dan `connect.rpcOk` dalam output `--json`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → Gateway menjawab, tetapi klien ini masih memerlukan pemasangan/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang belum terselesaikan → materi autentikasi tidak tersedia di jalur perintah ini untuk target yang gagal.

Terkait:

- [Gateway](/id/cli/gateway)
- [Beberapa Gateway pada host yang sama](/id/gateway#multiple-gateways-same-host)
- [Akses jarak jauh](/id/gateway/remote)

## Channel tersambung, pesan tidak mengalir

Jika status channel tersambung tetapi aliran pesan mati, fokus pada kebijakan, izin, dan aturan pengiriman khusus channel.

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

Tanda umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- Jejak `pairing` / persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah autentikasi/izin channel.

Terkait:

- [Pemecahan masalah channel](/id/channels/troubleshooting)
- [Discord](/id/channels/discord)
- [Telegram](/id/channels/telegram)
- [WhatsApp](/id/channels/whatsapp)

## Pengiriman Cron dan Heartbeat

Jika cron atau heartbeat tidak berjalan atau tidak terkirim, verifikasi status penjadwal terlebih dahulu, lalu target pengiriman.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cari:

- Cron diaktifkan dan waktu bangun berikutnya tersedia.
- Status riwayat run job (`ok`, `skipped`, `error`).
- Alasan Heartbeat dilewati (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Tanda umum">
    - `cron: scheduler disabled; jobs will not run automatically` → cron dinonaktifkan.
    - `cron: timer tick failed` → tick penjadwal gagal; periksa kesalahan file/log/runtime.
    - `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
    - `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / header markdown, sehingga OpenClaw melewati panggilan model.
    - `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
    - `heartbeat: unknown accountId` → id akun tidak valid untuk target pengiriman heartbeat.
    - `heartbeat skipped` dengan `reason=dm-blocked` → target heartbeat diselesaikan menjadi tujuan bergaya DM sementara `agents.defaults.heartbeat.directPolicy` (atau override per agen) diatur ke `block`.

  </Accordion>
</AccordionGroup>

Terkait:

- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [Tugas terjadwal: pemecahan masalah](/id/automation/cron-jobs#troubleshooting)

## Node sudah dipasangkan, tool gagal

Jika node sudah dipasangkan tetapi tool gagal, isolasi status foreground, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cari:

- Node online dengan kapabilitas yang diharapkan.
- Pemberian izin OS untuk kamera/mikrofon/lokasi/layar.
- Persetujuan exec dan status allowlist.

Tanda umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS hilang.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [Persetujuan exec](/id/tools/exec-approvals)
- [Pemecahan masalah Node](/id/nodes/troubleshooting)
- [Node](/id/nodes/index)

## Tool browser gagal

Gunakan ini ketika aksi tool browser gagal meskipun gateway itu sendiri sehat.

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
  <Accordion title="Tanda Plugin / executable">
    - `unknown command "browser"` atau `unknown command 'browser'` → plugin browser bawaan dikecualikan oleh `plugins.allow`.
    - tool browser hilang / tidak tersedia saat `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga plugin tidak pernah dimuat.
    - `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
    - `browser.executablePath not found` → path yang dikonfigurasi tidak valid.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki dependensi runtime browser inti; instal ulang atau perbarui OpenClaw, lalu mulai ulang gateway. Snapshot ARIA dan screenshot halaman dasar masih dapat berfungsi, tetapi navigasi, snapshot AI, screenshot elemen selector CSS, dan ekspor PDF tetap tidak tersedia.

  </Accordion>
  <Accordion title="Tanda Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session belum dapat attach ke dir data browser yang dipilih. Buka halaman inspeksi browser, aktifkan remote debugging, biarkan browser tetap terbuka, setujui prompt attach pertama, lalu coba lagi. Jika status masuk tidak diperlukan, lebih baik gunakan profil `openclaw` terkelola.
    - `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP jarak jauh yang dikonfigurasi tidak dapat dijangkau dari host gateway.
    - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP merespons tetapi WebSocket CDP tetap tidak dapat dibuka.

  </Accordion>
  <Accordion title="Tanda elemen / screenshot / upload">
    - `fullPage is not supported for element screenshots` → permintaan screenshot mencampur `--full-page` dengan `--ref` atau `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → panggilan screenshot Chrome MCP / `existing-session` harus menggunakan tangkapan halaman atau `--ref` snapshot, bukan `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook upload Chrome MCP memerlukan ref snapshot, bukan selector CSS.
    - `existing-session file uploads currently support one file at a time.` → kirim satu upload per panggilan pada profil Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
    - `existing-session type does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:type` pada profil `profile="user"` / Chrome MCP existing-session, atau gunakan profil browser terkelola/CDP ketika timeout kustom diperlukan.
    - `existing-session evaluate does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:evaluate` pada profil `profile="user"` / Chrome MCP existing-session, atau gunakan profil browser terkelola/CDP ketika timeout kustom diperlukan.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
    - override viewport / dark-mode / locale / offline yang usang pada profil attach-only atau CDP jarak jauh → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepas status emulasi Playwright/CDP tanpa memulai ulang seluruh gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Browser (dikelola OpenClaw)](/id/tools/browser)
- [Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting)

## Jika Anda upgrade dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah upgrade adalah drift konfigurasi atau default yang lebih ketat yang kini diberlakukan.

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
    - Panggilan `--url` eksplisit tidak fallback ke kredensial tersimpan.

    Tanda umum:

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

    - Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan path autentikasi gateway yang valid: autentikasi token/kata sandi bersama, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
    - Kunci lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

    Tanda umum:

    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa path autentikasi gateway yang valid.
    - `Connectivity probe: failed` saat runtime berjalan → gateway hidup tetapi tidak dapat diakses dengan auth/url saat ini.

  </Accordion>
  <Accordion title="3. Status pairing dan identitas perangkat berubah">
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

    - `device identity required` → autentikasi perangkat belum terpenuhi.
    - `pairing required` → pengirim/perangkat harus disetujui.

  </Accordion>
</AccordionGroup>

Jika konfigurasi layanan dan runtime masih tidak cocok setelah pemeriksaan, instal ulang metadata layanan dari direktori profil/status yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [Autentikasi](/id/gateway/authentication)
- [Exec latar belakang dan tool proses](/id/gateway/background-process)
- [Pairing yang dimiliki Gateway](/id/gateway/pairing)

## Terkait

- [Doctor](/id/gateway/doctor)
- [FAQ](/id/help/faq)
- [Runbook Gateway](/id/gateway)
