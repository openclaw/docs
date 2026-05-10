---
read_when:
    - Pusat pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian panduan operasional berbasis gejala yang stabil dengan perintah yang tepat
sidebarTitle: Troubleshooting
summary: Runbook pemecahan masalah mendalam untuk Gateway, kanal, otomasi, node, dan peramban
title: Pemecahan Masalah
x-i18n:
    generated_at: "2026-05-10T19:38:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 798016211b615242abca327295c76223ff2dfd3d83dc8a08e396d9e65b9efed4
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Halaman ini adalah runbook mendalam. Mulai dari [/help/troubleshooting](/id/help/troubleshooting) jika Anda menginginkan alur triase cepat terlebih dahulu.

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

- `openclaw gateway status` shows `Runtime: running`, `Connectivity probe: ok`, and a `Capability: ...` line.
- `openclaw doctor` reports no blocking config/service issues.
- `openclaw channels status --probe` shows live per-account transport status and, where supported, probe/audit results such as `works` or `audit ok`.

## Instalasi split brain dan penjaga konfigurasi yang lebih baru

Gunakan ini ketika layanan gateway tiba-tiba berhenti setelah pembaruan, atau log menunjukkan bahwa satu binary `openclaw` lebih lama daripada versi yang terakhir menulis `openclaw.json`.

OpenClaw memberi stempel penulisan konfigurasi dengan `meta.lastTouchedVersion`. Perintah baca saja masih dapat memeriksa konfigurasi yang ditulis oleh OpenClaw yang lebih baru, tetapi mutasi proses dan layanan menolak melanjutkan dari binary yang lebih lama. Tindakan yang diblokir mencakup memulai, menghentikan, memulai ulang, menghapus layanan gateway, instal ulang layanan secara paksa, startup gateway mode layanan, dan pembersihan port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Perbaiki `PATH` agar `openclaw` mengarah ke instalasi yang lebih baru, lalu jalankan ulang tindakannya.
  </Step>
  <Step title="Reinstall the gateway service">
    Instal ulang layanan gateway yang dimaksud dari instalasi yang lebih baru:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Hapus paket sistem lama atau entri wrapper lama yang masih menunjuk ke binary `openclaw` lama.
  </Step>
</Steps>

<Warning>
Hanya untuk downgrade yang disengaja atau pemulihan darurat, setel `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` untuk satu perintah tersebut. Biarkan tidak disetel untuk operasi normal.
</Warning>

## Symlink skill dilewati sebagai path escape

Gunakan ini ketika log menyertakan:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw memperlakukan setiap root skill sebagai batas containment. Symlink di bawah
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`, atau
`~/.openclaw/skills` dilewati ketika target aslinya terselesaikan di luar root tersebut
kecuali targetnya dipercaya secara eksplisit.

Periksa tautannya:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Jika targetnya disengaja, konfigurasikan root skill langsung dan target symlink
yang diizinkan:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Lalu mulai sesi baru atau tunggu watcher skills melakukan refresh. Mulai ulang
gateway jika proses yang berjalan lebih lama daripada perubahan konfigurasi.

Jangan gunakan target yang terlalu luas seperti `~`, `/`, atau seluruh folder proyek tersinkron.
Pertahankan `allowSymlinkTargets` tetap terbatas pada root skill asli yang berisi direktori
`SKILL.md` tepercaya.

Terkait:

- [Konfigurasi Skills](/id/tools/skills-config#symlinked-sibling-repos)
- [Contoh konfigurasi](/id/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 memerlukan penggunaan ekstra untuk konteks panjang

Gunakan ini ketika log/error menyertakan: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

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
    Konfigurasikan model fallback agar proses tetap berlanjut ketika permintaan konteks panjang Anthropic ditolak.
  </Step>
</Steps>

Terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan token dan biaya](/id/reference/token-use)
- [Mengapa saya melihat HTTP 429 dari Anthropic?](/id/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend lokal kompatibel OpenAI lolos probe langsung tetapi proses agent gagal

Gunakan ini ketika:

- `curl ... /v1/models` berfungsi
- panggilan langsung kecil `/v1/chat/completions` berfungsi
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

- panggilan kecil langsung berhasil, tetapi proses OpenClaw gagal hanya pada prompt yang lebih besar
- error `model_not_found` atau 404 meskipun `/v1/chat/completions` langsung
  berfungsi dengan id model polos yang sama
- error backend tentang `messages[].content` yang mengharapkan string
- peringatan intermiten `incomplete turn detected ... stopReason=stop payloads=0` dengan backend lokal kompatibel OpenAI
- crash backend yang muncul hanya dengan jumlah token prompt lebih besar atau prompt runtime agent penuh

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` dengan server lokal bergaya MLX/vLLM → verifikasi `baseUrl` menyertakan `/v1`, `api` adalah `"openai-completions"` untuk backend `/v1/chat/completions`, dan `models.providers.<provider>.models[].id` adalah id lokal provider polos. Pilih dengan prefiks provider sekali, misalnya `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pertahankan entri katalog sebagai `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend menolak bagian konten Chat Completions terstruktur. Perbaikan: setel `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` atau kunci pesan yang diizinkan seperti `["role","content"]` → backend menolak metadata replay bergaya OpenAI pada pesan Chat Completions. Perbaikan: setel `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend menyelesaikan permintaan Chat Completions tetapi tidak mengembalikan teks asisten yang terlihat pengguna untuk giliran tersebut. OpenClaw mencoba ulang giliran kosong kompatibel OpenAI yang aman untuk replay satu kali; kegagalan persisten biasanya berarti backend memancarkan konten kosong/nonteks atau menekan teks jawaban akhir.
    - permintaan kecil langsung berhasil, tetapi proses agent OpenClaw gagal dengan crash backend/model (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agent yang lebih besar.
    - kegagalan berkurang setelah menonaktifkan tools tetapi tidak hilang → skema tool adalah bagian dari tekanan, tetapi masalah yang tersisa masih berupa kapasitas model/server upstream atau bug backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Setel `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya menerima string.
    2. Setel `compat.strictMessageKeys: true` untuk backend Chat Completions ketat yang hanya menerima `role` dan `content` pada setiap pesan.
    3. Setel `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani permukaan skema tool OpenClaw secara andal.
    4. Turunkan tekanan prompt jika memungkinkan: bootstrap workspace lebih kecil, riwayat sesi lebih pendek, model lokal lebih ringan, atau backend dengan dukungan konteks panjang yang lebih kuat.
    5. Jika permintaan kecil langsung tetap lolos sementara giliran agent OpenClaw masih crash di dalam backend, perlakukan itu sebagai batasan server/model upstream dan ajukan repro di sana dengan bentuk payload yang diterima.
  </Accordion>
</AccordionGroup>

Terkait:

- [Konfigurasi](/id/gateway/configuration)
- [Model lokal](/id/gateway/local-models)
- [Endpoint kompatibel OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)

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
- Gating mention grup (`requireMention`, `mentionPatterns`).
- Ketidaksesuaian allowlist channel/grup.

Tanda umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim perlu persetujuan.
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
- Ketidaksesuaian mode/token auth antara klien dan gateway.
- Penggunaan HTTP ketika identitas perangkat diperlukan.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → konteks tidak aman atau auth perangkat hilang.
    - `origin not allowed` → `Origin` browser tidak ada di `gateway.controlUi.allowedOrigins` (atau Anda terhubung dari origin browser non-loopback tanpa allowlist eksplisit).
    - `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan alur auth perangkat berbasis challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah (atau timestamp lama) untuk handshake saat ini.
    - `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu retry tepercaya dengan token perangkat yang di-cache.
    - Retry token ter-cache tersebut menggunakan kembali set cakupan ter-cache yang disimpan bersama token perangkat yang dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan set cakupan yang dimintanya.
    - Di luar jalur retry tersebut, presedensi auth koneksi adalah token/password bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
    - Pada jalur async Tailscale Serve Control UI, upaya gagal untuk `{scope, ip}` yang sama diserialisasi sebelum limiter mencatat kegagalan. Karena itu, dua retry buruk serentak dari klien yang sama dapat memunculkan `retry later` pada upaya kedua, bukan dua mismatch biasa.
    - `too many failed authentication attempts (retry later)` dari klien loopback origin browser → kegagalan berulang dari `Origin` ternormalisasi yang sama dikunci sementara; origin localhost lain menggunakan bucket terpisah.
    - `unauthorized` berulang setelah retry tersebut → drift token bersama/token perangkat; refresh konfigurasi token dan setujui ulang/rotasi token perangkat jika perlu.
    - `gateway connect failed:` → target host/port/url salah.

  </Accordion>
</AccordionGroup>

### Peta cepat kode detail auth

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                  | Makna                                                                                                                                                                                      | Tindakan yang disarankan                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim token bersama yang diperlukan.                                                                                                                                                 | Tempel/atur token di klien dan coba lagi. Untuk jalur dasbor: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan UI Kontrol.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Token bersama tidak cocok dengan token autentikasi Gateway.                                                                                                                                               | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang token yang di-cache menggunakan kembali cakupan tersetujui yang tersimpan; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan cakupan yang diminta. Jika masih gagal, jalankan [daftar periksa pemulihan penyimpangan token](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per perangkat yang di-cache sudah usang atau dicabut.                                                                                                                                                 | Rotasi/setujui ulang token perangkat menggunakan [CLI perangkat](/id/cli/devices), lalu sambungkan kembali.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Identitas perangkat memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` jika ada. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Peningkatan cakupan/peran menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                                               |

<Note>
RPC backend loopback langsung yang diautentikasi dengan token/kata sandi Gateway bersama seharusnya tidak bergantung pada baseline cakupan perangkat-terpasang milik CLI. Jika subagen atau panggilan internal lain masih gagal dengan `scope-upgrade`, verifikasi bahwa pemanggil menggunakan `client.id: "gateway-client"` dan `client.mode: "backend"` serta tidak memaksakan `deviceIdentity` atau token perangkat eksplisit.
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

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tak terduga:

- sesi token perangkat-terpasang hanya dapat mengelola perangkat **mereka sendiri** kecuali pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta cakupan operator yang sudah dimiliki sesi pemanggil

Terkait:

- [Konfigurasi](/id/gateway/configuration) (mode autentikasi Gateway)
- [UI Kontrol](/id/web/control-ui)
- [Perangkat](/id/cli/devices)
- [Akses jarak jauh](/id/gateway/remote)
- [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth)

## Layanan Gateway tidak berjalan

Gunakan ini saat layanan terpasang tetapi proses tidak tetap berjalan.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Cari:

- `Runtime: stopped` dengan petunjuk kode keluar.
- Ketidakcocokan konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Tanda umum">
    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode Gateway lokal tidak diaktifkan, atau file konfigurasi tertimpa dan kehilangan `gateway.mode`. Perbaikan: atur `gateway.mode="local"` dalam konfigurasi Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk mencap ulang konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, jalur konfigurasi default adalah `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur autentikasi Gateway yang valid (token/kata sandi, atau trusted-proxy jika dikonfigurasi).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
    - `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks lama atau paralel ada. Sebagian besar penyiapan sebaiknya mempertahankan satu Gateway per mesin; jika Anda memang memerlukan lebih dari satu, isolasi port + konfigurasi/status/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` dari doctor → unit sistem systemd ada sementara layanan tingkat pengguna hilang. Hapus atau nonaktifkan duplikat sebelum mengizinkan doctor memasang layanan pengguna, atau atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` jika unit sistem adalah supervisor yang dimaksud.
    - `Gateway service port does not match current gateway config` → supervisor yang terpasang masih mematok `--port` lama. Jalankan `openclaw doctor --fix` atau `openclaw gateway install --force`, lalu mulai ulang layanan Gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Eksekusi latar belakang dan alat proses](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Doctor](/id/gateway/doctor)

## Gateway menolak konfigurasi tidak valid

Gunakan ini saat startup Gateway gagal dengan `Invalid config` atau log hot reload mengatakan
bahwa edit tidak valid dilewati.

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
- File `openclaw.json.rejected.*` bertimestamp di samping konfigurasi aktif
- File `openclaw.json.clobbered.*` bertimestamp jika `doctor --fix` memperbaiki edit langsung yang rusak

<AccordionGroup>
  <Accordion title="Apa yang terjadi">
    - Konfigurasi tidak lolos validasi saat startup, hot reload, atau penulisan milik OpenClaw.
    - Startup Gateway gagal tertutup alih-alih menulis ulang `openclaw.json`.
    - Hot reload melewati edit eksternal yang tidak valid dan mempertahankan konfigurasi runtime saat ini tetap aktif.
    - Penulisan milik OpenClaw menolak payload tidak valid/destruktif sebelum commit dan menyimpan `.rejected.*`.
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
    - `.rejected.*` ada → penulisan konfigurasi milik OpenClaw gagal pada pemeriksaan skema atau clobber sebelum commit.
    - `Config write rejected:` → penulisan mencoba menghapus bentuk yang diperlukan, memperkecil file secara tajam, atau menyimpan konfigurasi tidak valid.
    - `config reload skipped (invalid config):` → edit langsung gagal validasi dan diabaikan oleh Gateway yang sedang berjalan.
    - `Invalid config at ...` → startup gagal sebelum layanan Gateway boot.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → penulisan milik OpenClaw ditolak karena kehilangan bidang atau ukuran dibandingkan dengan cadangan terakhir yang diketahui baik.
    - `Config last-known-good promotion skipped` → kandidat berisi placeholder rahasia yang disamarkan seperti `***`.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Jalankan `openclaw doctor --fix` agar doctor memperbaiki konfigurasi berprefiks/tertimpakan atau memulihkan terakhir yang diketahui baik.
    2. Salin hanya kunci yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
    3. Jalankan `openclaw config validate` sebelum memulai ulang.
    4. Jika Anda mengedit manual, pertahankan konfigurasi JSON5 lengkap, bukan hanya objek parsial yang ingin Anda ubah.
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
- Apakah peringatan berkaitan dengan fallback SSH, beberapa Gateway, cakupan yang hilang, atau ref autentikasi yang tidak terselesaikan.

Tanda umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target langsung yang dikonfigurasi/loopback.
- `multiple reachable gateways detected` → lebih dari satu target menjawab. Biasanya ini berarti penyiapan multi-Gateway yang disengaja atau listener lama/duplikat.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi RPC detail dibatasi cakupan; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → koneksi berhasil, tetapi rangkaian RPC diagnostik penuh timeout atau gagal. Perlakukan ini sebagai Gateway yang dapat dijangkau dengan diagnostik terdegradasi; bandingkan `connect.ok` dan `connect.rpcOk` dalam output `--json`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → Gateway menjawab, tetapi klien ini masih memerlukan pemasangan/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang tidak terselesaikan → materi autentikasi tidak tersedia di jalur perintah ini untuk target yang gagal.

Terkait:

- [Gateway](/id/cli/gateway)
- [Beberapa Gateway pada host yang sama](/id/gateway#multiple-gateways-same-host)
- [Akses jarak jauh](/id/gateway/remote)

## Channel tersambung, pesan tidak mengalir

Jika status channel tersambung tetapi aliran pesan mati, fokus pada kebijakan, izin, dan aturan pengiriman spesifik channel.

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
- Izin/cakupan API channel yang hilang.

Tanda umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- `pairing` / jejak persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah auth/izin channel.

Terkait:

- [Pemecahan masalah channel](/id/channels/troubleshooting)
- [Discord](/id/channels/discord)
- [Telegram](/id/channels/telegram)
- [WhatsApp](/id/channels/whatsapp)

## Pengiriman Cron dan Heartbeat

Jika Cron atau Heartbeat tidak berjalan atau tidak terkirim, verifikasi status penjadwal terlebih dahulu, lalu target pengiriman.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cari:

- Cron aktif dan wake berikutnya tersedia.
- Status riwayat eksekusi tugas (`ok`, `skipped`, `error`).
- Alasan Heartbeat dilewati (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron dinonaktifkan.
    - `cron: timer tick failed` → tick penjadwal gagal; periksa kesalahan file/log/runtime.
    - `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
    - `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / header markdown, sehingga OpenClaw melewati panggilan model.
    - `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
    - `heartbeat: unknown accountId` → id akun tidak valid untuk target pengiriman Heartbeat.
    - `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat terselesaikan ke tujuan bergaya DM sementara `agents.defaults.heartbeat.directPolicy` (atau override per agen) diatur ke `block`.

  </Accordion>
</AccordionGroup>

Terkait:

- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [Tugas terjadwal: pemecahan masalah](/id/automation/cron-jobs#troubleshooting)

## Node dipasangkan, alat gagal

Jika Node sudah dipasangkan tetapi alat gagal, isolasi status foreground, izin, dan persetujuan.

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
- Jalur executable browser yang valid.
- Keterjangkauan profil CDP.
- Ketersediaan Chrome lokal untuk profil `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` atau `unknown command 'browser'` → Plugin browser bawaan dikecualikan oleh `plugins.allow`.
    - alat browser hilang / tidak tersedia sementara `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga Plugin tidak pernah dimuat.
    - `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
    - `browser.executablePath not found` → jalur yang dikonfigurasi tidak valid.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port buruk atau di luar rentang.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi Gateway saat ini tidak memiliki dependensi runtime browser inti; instal ulang atau perbarui OpenClaw, lalu mulai ulang Gateway. Snapshot ARIA dan screenshot halaman dasar masih dapat berfungsi, tetapi navigasi, snapshot AI, screenshot elemen selector CSS, dan ekspor PDF tetap tidak tersedia.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP belum dapat terhubung ke direktori data browser yang dipilih. Buka halaman inspect browser, aktifkan remote debugging, biarkan browser tetap terbuka, setujui prompt attach pertama, lalu coba lagi. Jika status masuk tidak diperlukan, gunakan profil `openclaw` terkelola.
    - `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP jarak jauh yang dikonfigurasi tidak dapat dijangkau dari host Gateway.
    - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP menjawab tetapi WebSocket CDP tetap tidak dapat dibuka.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → permintaan screenshot mencampur `--full-page` dengan `--ref` atau `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → panggilan screenshot Chrome MCP / `existing-session` harus menggunakan capture halaman atau `--ref` snapshot, bukan CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook unggah Chrome MCP memerlukan ref snapshot, bukan selector CSS.
    - `existing-session file uploads currently support one file at a time.` → kirim satu unggahan per panggilan pada profil Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
    - `existing-session type does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:type` pada `profile="user"` / profil existing-session Chrome MCP, atau gunakan profil browser terkelola/CDP saat timeout kustom diperlukan.
    - `existing-session evaluate does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:evaluate` pada `profile="user"` / profil existing-session Chrome MCP, atau gunakan profil browser terkelola/CDP saat timeout kustom diperlukan.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
    - override viewport / dark-mode / locale / offline yang usang pada profil attach-only atau CDP jarak jauh → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepas status emulasi Playwright/CDP tanpa memulai ulang seluruh Gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Browser (dikelola OpenClaw)](/id/tools/browser)
- [Pemecahan masalah Browser Linux](/id/tools/browser-linux-troubleshooting)

## Jika Anda meningkatkan versi dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah peningkatan versi adalah drift konfigurasi atau default yang lebih ketat yang sekarang diberlakukan.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Yang perlu diperiksa:

    - Jika `gateway.mode=remote`, panggilan CLI mungkin menargetkan jarak jauh sementara layanan lokal Anda baik-baik saja.
    - Panggilan `--url` eksplisit tidak fallback ke kredensial tersimpan.

    Tanda umum:

    - `gateway connect failed:` → target URL salah.
    - `unauthorized` → endpoint dapat dijangkau tetapi auth salah.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Yang perlu diperiksa:

    - Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur auth Gateway yang valid: auth token/kata sandi bersama, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
    - Key lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

    Tanda umum:

    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth Gateway yang valid.
    - `Connectivity probe: failed` saat runtime berjalan → Gateway hidup tetapi tidak dapat diakses dengan auth/url saat ini.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Yang perlu diperiksa:

    - Persetujuan perangkat tertunda untuk dashboard/Node.
    - Persetujuan pairing DM tertunda setelah perubahan kebijakan atau identitas.

    Tanda umum:

    - `device identity required` → auth perangkat belum terpenuhi.
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
- [Exec latar belakang dan alat proses](/id/gateway/background-process)
- [Pairing yang dimiliki Gateway](/id/gateway/pairing)

## Terkait

- [Doctor](/id/gateway/doctor)
- [FAQ](/id/help/faq)
- [Runbook Gateway](/id/gateway)
