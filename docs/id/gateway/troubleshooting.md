---
read_when:
    - Pusat pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
sidebarTitle: Troubleshooting
summary: Runbook pemecahan masalah mendalam untuk gateway, saluran, automasi, node, dan browser
title: Pemecahan Masalah
x-i18n:
    generated_at: "2026-06-27T17:34:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
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
- `openclaw doctor` tidak melaporkan masalah konfigurasi/layanan yang memblokir.
- `openclaw channels status --probe` menampilkan status transport per akun secara langsung dan, jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Setelah pembaruan

Gunakan ini saat pembaruan selesai tetapi Gateway mati, channel kosong, atau
panggilan model mulai gagal dengan 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Cari:

- `Update restart` di `openclaw status` / `openclaw status --all`. Handoff yang tertunda atau
  gagal menyertakan perintah berikutnya untuk dijalankan.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  di bawah Channels. Itu berarti konfigurasi channel masih ada, tetapi pendaftaran Plugin
  gagal sebelum channel dapat dimuat.
- 401 provider setelah autentikasi ulang. `openclaw doctor --fix` memeriksa
  bayangan autentikasi OAuth per agen yang usang dan menghapus salinan lama agar semua agen me-resolve
  profil bersama saat ini.

## Instalasi split-brain dan guard konfigurasi yang lebih baru

Gunakan ini saat layanan gateway berhenti tiba-tiba setelah pembaruan, atau log menunjukkan bahwa satu biner `openclaw` lebih lama daripada versi yang terakhir menulis `openclaw.json`.

OpenClaw menandai penulisan konfigurasi dengan `meta.lastTouchedVersion`. Perintah baca-saja masih dapat memeriksa konfigurasi yang ditulis oleh OpenClaw yang lebih baru, tetapi mutasi proses dan layanan menolak melanjutkan dari biner yang lebih lama. Tindakan yang diblokir mencakup memulai, menghentikan, memulai ulang, menghapus instalasi layanan gateway, instal ulang layanan paksa, startup gateway mode layanan, dan pembersihan port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Perbaiki PATH">
    Perbaiki `PATH` agar `openclaw` me-resolve ke instalasi yang lebih baru, lalu jalankan ulang tindakan tersebut.
  </Step>
  <Step title="Instal ulang layanan gateway">
    Instal ulang layanan gateway yang dimaksud dari instalasi yang lebih baru:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Hapus wrapper usang">
    Hapus paket sistem usang atau entri wrapper lama yang masih menunjuk ke biner `openclaw` lama.
  </Step>
</Steps>

<Warning>
Hanya untuk downgrade yang disengaja atau pemulihan darurat, setel `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` untuk satu perintah tersebut. Biarkan tidak disetel untuk operasi normal.
</Warning>

## Ketidakcocokan protokol setelah rollback

Gunakan ini saat log terus mencetak `protocol mismatch` setelah Anda menurunkan versi atau melakukan rollback OpenClaw. Ini berarti Gateway yang lebih lama sedang berjalan, tetapi proses klien lokal yang lebih baru masih mencoba menyambung kembali dengan rentang protokol yang tidak dapat digunakan oleh Gateway yang lebih lama.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Cari:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` di log Gateway.
- `Established clients:` di `openclaw gateway status --deep` atau `Gateway clients` di `openclaw doctor --deep`. Ini mencantumkan klien TCP aktif yang terhubung ke port Gateway, termasuk PID dan baris perintah jika OS mengizinkannya.
- Proses klien yang baris perintahnya menunjuk ke instalasi OpenClaw atau wrapper lebih baru yang Anda rollback.

Perbaikan:

1. Hentikan atau mulai ulang proses klien OpenClaw usang yang ditampilkan oleh `gateway status --deep`.
2. Mulai ulang aplikasi atau wrapper yang menyematkan OpenClaw, seperti dasbor lokal, editor, pembantu server aplikasi, atau shell `openclaw logs --follow` yang berjalan lama.
3. Jalankan ulang `openclaw gateway status --deep` atau `openclaw doctor --deep` dan konfirmasi PID klien usang sudah hilang.

Jangan membuat Gateway yang lebih lama menerima protokol baru yang tidak kompatibel. Kenaikan protokol melindungi kontrak wire; pemulihan rollback adalah masalah pembersihan proses/versi.

## Symlink Skills dilewati sebagai pelarian jalur

Gunakan ini saat log menyertakan:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw memperlakukan setiap root skill sebagai batas containment. Symlink di bawah
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`, atau
`~/.openclaw/skills` dilewati saat target aslinya me-resolve ke luar root tersebut
kecuali target secara eksplisit dipercaya.

Periksa link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Jika target disengaja, konfigurasikan root skill langsung dan
target symlink yang diizinkan:

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

Lalu mulai sesi baru atau tunggu watcher skills menyegarkan. Mulai ulang
gateway jika proses yang berjalan sudah ada sebelum perubahan konfigurasi.

Jangan gunakan target luas seperti `~`, `/`, atau seluruh folder proyek yang disinkronkan.
Jaga `allowSymlinkTargets` tetap terbatas pada root skill asli yang berisi direktori
`SKILL.md` tepercaya.

Jika Skill Workshop apply juga harus menulis melalui jalur skill workspace
tersymlink tepercaya tersebut, aktifkan `skills.workshop.allowSymlinkTargetWrites`. Biarkan
dinonaktifkan untuk root skill bersama baca-saja.

Terkait:

- [Konfigurasi Skills](/id/tools/skills-config#symlinked-skill-roots)
- [Contoh konfigurasi](/id/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 memerlukan penggunaan ekstra untuk konteks panjang

Gunakan ini saat log/error menyertakan: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cari:

- Model Anthropic yang dipilih adalah model Claude 4.x 1M berkemampuan GA, atau model memiliki `params.context1m: true` lama.
- Kredensial Anthropic saat ini tidak memenuhi syarat untuk penggunaan konteks panjang.
- Permintaan gagal hanya pada sesi panjang/run model yang memerlukan jalur konteks 1M.

Opsi perbaikan:

<Steps>
  <Step title="Gunakan jendela konteks standar">
    Beralih ke model dengan jendela standar, atau hapus `context1m` lama dari konfigurasi
    model lama yang tidak berkemampuan GA untuk konteks 1M.
  </Step>
  <Step title="Gunakan kredensial yang memenuhi syarat">
    Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralih ke kunci API Anthropic.
  </Step>
  <Step title="Konfigurasikan model fallback">
    Konfigurasikan model fallback agar run berlanjut saat permintaan konteks panjang Anthropic ditolak.
  </Step>
</Steps>

Terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan token dan biaya](/id/reference/token-use)
- [Mengapa saya melihat HTTP 429 dari Anthropic?](/id/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Respons upstream 403 diblokir

Gunakan ini saat provider LLM upstream mengembalikan `403` generik seperti
`Your request was blocked`.

Jangan berasumsi ini selalu merupakan masalah konfigurasi OpenClaw. Respons dapat
berasal dari lapisan keamanan upstream seperti CDN, WAF, aturan manajemen bot, atau
reverse proxy di depan endpoint kompatibel OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Cari:

- beberapa model di bawah provider yang sama gagal dengan cara yang sama
- HTML atau teks keamanan generik, bukan error API provider normal
- peristiwa keamanan sisi provider untuk waktu permintaan yang sama
- probe `curl` langsung kecil berhasil sementara permintaan berbentuk SDK normal gagal

Perbaiki pemfilteran sisi provider terlebih dahulu saat bukti mengarah ke blokir WAF/CDN.
Utamakan aturan allow atau skip yang terbatas sempit untuk jalur API yang digunakan OpenClaw,
dan hindari menonaktifkan perlindungan untuk seluruh situs.

<Warning>
`curl` minimal yang berhasil tidak menjamin bahwa permintaan bergaya SDK nyata akan
melewati lapisan keamanan upstream yang sama.
</Warning>

Terkait:

- [Endpoint kompatibel OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)
- [Konfigurasi provider](/id/providers)
- [Log](/id/logging)

## Backend lokal kompatibel OpenAI lolos probe langsung tetapi run agen gagal

Gunakan ini saat:

- `curl ... /v1/models` berfungsi
- panggilan langsung kecil `/v1/chat/completions` berfungsi
- run model OpenClaw gagal hanya pada giliran agen normal

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cari:

- panggilan langsung kecil berhasil, tetapi run OpenClaw gagal hanya pada prompt yang lebih besar
- error `model_not_found` atau 404 meskipun `/v1/chat/completions` langsung
  berfungsi dengan id model polos yang sama
- error backend tentang `messages[].content` yang mengharapkan string
- peringatan `incomplete turn detected ... stopReason=stop payloads=0` intermiten dengan backend lokal kompatibel OpenAI
- crash backend yang muncul hanya dengan jumlah token prompt lebih besar atau prompt runtime agen penuh

<AccordionGroup>
  <Accordion title="Tanda umum">
    - `model_not_found` dengan server lokal bergaya MLX/vLLM → verifikasi `baseUrl` menyertakan `/v1`, `api` adalah `"openai-completions"` untuk backend `/v1/chat/completions`, dan `models.providers.<provider>.models[].id` adalah id lokal-provider polos. Pilih dengan prefiks provider sekali, misalnya `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pertahankan entri katalog sebagai `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend menolak bagian konten Chat Completions terstruktur. Perbaikan: setel `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` atau key pesan yang diizinkan seperti `["role","content"]` → backend menolak metadata replay bergaya OpenAI pada pesan Chat Completions. Perbaikan: setel `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend menyelesaikan permintaan Chat Completions tetapi tidak mengembalikan teks asisten yang terlihat pengguna untuk giliran tersebut. OpenClaw mencoba ulang giliran kosong kompatibel OpenAI yang aman replay satu kali; kegagalan persisten biasanya berarti backend mengeluarkan konten kosong/non-teks atau menekan teks jawaban akhir.
    - permintaan langsung kecil berhasil, tetapi run agen OpenClaw gagal dengan crash backend/model (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agen yang lebih besar.
    - kegagalan berkurang setelah menonaktifkan tools tetapi tidak hilang → skema tool adalah bagian dari tekanan, tetapi masalah yang tersisa masih berupa kapasitas model/server upstream atau bug backend.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Setel `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya menerima string.
    2. Setel `compat.strictMessageKeys: true` untuk backend Chat Completions ketat yang hanya menerima `role` dan `content` pada setiap pesan.
    3. Setel `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani permukaan skema tool OpenClaw secara andal.
    4. Kurangi tekanan prompt jika memungkinkan: bootstrap workspace lebih kecil, riwayat sesi lebih pendek, model lokal lebih ringan, atau backend dengan dukungan konteks panjang yang lebih kuat.
    5. Jika permintaan langsung kecil tetap lolos sementara giliran agen OpenClaw masih crash di dalam backend, perlakukan sebagai keterbatasan server/model upstream dan ajukan repro di sana dengan bentuk payload yang diterima.
  </Accordion>
</AccordionGroup>

Terkait:

- [Konfigurasi](/id/gateway/configuration)
- [Model lokal](/id/gateway/local-models)
- [Endpoint kompatibel OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)

## Tidak ada balasan

Jika saluran aktif tetapi tidak ada yang menjawab, periksa perutean dan kebijakan sebelum menghubungkan ulang apa pun.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cari:

- Penyandingan tertunda untuk pengirim DM.
- Pembatasan penyebutan grup (`requireMention`, `mentionPatterns`).
- Ketidakcocokan allowlist saluran/grup.

Tanda umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada penyebutan.
- `pairing request` → pengirim perlu persetujuan.
- `blocked` / `allowlist` → pengirim/saluran difilter oleh kebijakan.

Terkait:

- [Pemecahan masalah saluran](/id/channels/troubleshooting)
- [Grup](/id/channels/groups)
- [Penyandingan](/id/channels/pairing)

## Konektivitas UI kontrol dasbor

Saat UI dasbor/kontrol tidak dapat terhubung, validasi URL, mode autentikasi, dan asumsi konteks aman.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cari:

- URL probe dan URL dasbor yang benar.
- Ketidakcocokan mode/token autentikasi antara klien dan gateway.
- Penggunaan HTTP saat identitas perangkat diperlukan.

Jika browser lokal tidak dapat terhubung ke `127.0.0.1:18789` setelah pembaruan, pertama
pulihkan layanan Gateway lokal dan pastikan layanan tersebut menyajikan dasbor:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Jika `curl` mengembalikan HTML OpenClaw, Gateway berfungsi dan masalah yang tersisa
kemungkinan adalah cache browser, tautan dalam lama, atau status tab yang kedaluwarsa. Buka
`http://127.0.0.1:18789` secara langsung dan navigasi dari dasbor. Jika mulai ulang
tidak membuat layanan tetap berjalan, jalankan `openclaw gateway start` dan periksa ulang
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Tanda koneksi / autentikasi">
    - `device identity required` → konteks tidak aman atau autentikasi perangkat hilang.
    - `origin not allowed` → `Origin` browser tidak ada di `gateway.controlUi.allowedOrigins` (atau Anda terhubung dari asal browser non-loopback tanpa allowlist eksplisit).
    - `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan alur autentikasi perangkat berbasis tantangan (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah (atau timestamp kedaluwarsa) untuk handshake saat ini.
    - `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu percobaan ulang tepercaya dengan token perangkat yang di-cache.
    - Percobaan ulang token yang di-cache tersebut menggunakan kembali kumpulan scope yang di-cache dan disimpan bersama token perangkat yang dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap memakai kumpulan scope yang mereka minta.
    - `AUTH_SCOPE_MISMATCH` → token perangkat dikenali, tetapi scope yang disetujui tidak mencakup permintaan koneksi ini; pasangkan ulang atau setujui kontrak scope yang diminta alih-alih merotasi token gateway bersama.
    - Di luar jalur percobaan ulang tersebut, prioritas autentikasi koneksi adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
    - Pada jalur UI Kontrol Tailscale Serve asinkron, upaya gagal untuk `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan. Karena itu, dua percobaan ulang buruk yang bersamaan dari klien yang sama dapat menampilkan `retry later` pada percobaan kedua alih-alih dua ketidakcocokan biasa.
    - `too many failed authentication attempts (retry later)` dari klien loopback asal browser → kegagalan berulang dari `Origin` ternormalisasi yang sama dikunci sementara; asal localhost lain menggunakan bucket terpisah.
    - `unauthorized` berulang setelah percobaan ulang tersebut → token bersama/token perangkat bergeser; segarkan konfigurasi token dan setujui ulang/rotasi token perangkat jika perlu.
    - `gateway connect failed:` → target host/port/url salah.

  </Accordion>
</AccordionGroup>

### Peta cepat kode detail autentikasi

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                  | Arti                                                                                                                                                                                      | Tindakan yang disarankan                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim token bersama yang diperlukan.                                                                                                                                                 | Tempel/atur token di klien dan coba lagi. Untuk jalur dasbor: `openclaw config get gateway.auth.token` lalu tempelkan ke pengaturan UI Kontrol.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Token bersama tidak cocok dengan token autentikasi gateway.                                                                                                                                               | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang token yang di-cache menggunakan kembali scope yang disetujui dan tersimpan; pemanggil `deviceToken` / `scopes` eksplisit tetap memakai scope yang diminta. Jika masih gagal, jalankan [daftar periksa pemulihan pergeseran token](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per perangkat yang di-cache sudah usang atau dicabut.                                                                                                                                                 | Rotasi/setujui ulang token perangkat menggunakan [CLI perangkat](/id/cli/devices), lalu hubungkan ulang.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Token perangkat valid, tetapi peran/scope yang disetujui tidak mencakup permintaan koneksi ini.                                                                                                       | Pasangkan ulang perangkat atau setujui kontrak scope yang diminta; jangan perlakukan ini sebagai pergeseran token bersama.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Identitas perangkat perlu persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` jika ada. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Peningkatan scope/peran menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                                               |

<Note>
RPC backend loopback langsung yang diautentikasi dengan token/kata sandi gateway bersama seharusnya tidak bergantung pada baseline scope perangkat yang dipasangkan milik CLI. Jika subagen atau panggilan internal lain masih gagal dengan `scope-upgrade`, pastikan pemanggil menggunakan `client.id: "gateway-client"` dan `client.mode: "backend"` serta tidak memaksa `deviceIdentity` atau token perangkat eksplisit.
</Note>

Pemeriksaan migrasi auth perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan kesalahan nonce/tanda tangan, perbarui klien yang terhubung dan verifikasi:

<Steps>
  <Step title="Tunggu connect.challenge">
    Klien menunggu `connect.challenge` yang diterbitkan gateway.
  </Step>
  <Step title="Tandatangani payload">
    Klien menandatangani payload yang terikat tantangan.
  </Step>
  <Step title="Kirim nonce perangkat">
    Klien mengirim `connect.params.device.nonce` dengan nonce tantangan yang sama.
  </Step>
</Steps>

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tidak terduga:

- sesi token perangkat yang dipasangkan hanya dapat mengelola perangkat **miliknya sendiri** kecuali pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta scope operator yang sudah dimiliki sesi pemanggil

Terkait:

- [Konfigurasi](/id/gateway/configuration) (mode autentikasi gateway)
- [UI Kontrol](/id/web/control-ui)
- [Perangkat](/id/cli/devices)
- [Akses jarak jauh](/id/gateway/remote)
- [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth)

## Layanan Gateway tidak berjalan

Gunakan ini saat layanan terinstal tetapi proses tidak tetap aktif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga pindai layanan tingkat sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk kode keluar.
- Ketidakcocokan konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Tanda umum">
    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal tidak diaktifkan, atau file konfigurasi tertimpa dan kehilangan `gateway.mode`. Perbaikan: atur `gateway.mode="local"` di konfigurasi Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk mencap ulang konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, path konfigurasi default adalah `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur autentikasi gateway yang valid (token/kata sandi, atau proxy tepercaya jika dikonfigurasi).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
    - `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks yang kedaluwarsa atau paralel ada. Sebagian besar setup sebaiknya mempertahankan satu gateway per mesin; jika Anda memang memerlukan lebih dari satu, pisahkan port + konfigurasi/status/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` dari doctor → unit sistem systemd ada sementara layanan tingkat pengguna hilang. Hapus atau nonaktifkan duplikat sebelum mengizinkan doctor memasang layanan pengguna, atau atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` jika unit sistem adalah supervisor yang dimaksud.
    - `Gateway service port does not match current gateway config` → supervisor terinstal masih mengunci `--port` lama. Jalankan `openclaw doctor --fix` atau `openclaw gateway install --force`, lalu mulai ulang layanan gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Eksekusi latar belakang dan alat proses](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Doctor](/id/gateway/doctor)

## Gateway macOS berhenti merespons diam-diam, lalu pulih saat Anda menyentuh dasbor

Gunakan ini saat saluran (Telegram, WhatsApp, dll.) pada host macOS menjadi senyap selama beberapa menit hingga berjam-jam, dan gateway tampaknya kembali begitu Anda membuka UI Kontrol, masuk melalui SSH, atau berinteraksi dengan host dengan cara lain. Biasanya tidak ada gejala jelas di `openclaw status` karena saat Anda memeriksa, gateway sudah hidup kembali.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Cari:

- Satu atau beberapa bundle `*-uncaught_exception.json` di `~/.openclaw/logs/stability/` dengan `error.code` diatur ke kode jaringan transien seperti `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH`, atau `ECONNREFUSED`.
- Baris `pmset -g log` seperti `Entering Sleep state due to 'Maintenance Sleep'` atau `en0 driver is slow (msg: WillChangeState to 0)` yang selaras dengan timestamp crash. Power Nap / Maintenance Sleep secara singkat menempatkan driver Wi-Fi ke status 0; setiap `connect()` keluar yang terjadi dalam jendela itu dapat gagal dengan `ENETDOWN` bahkan pada host yang selain itu memiliki konektivitas jaringan penuh.
- Output `launchctl print` yang menunjukkan `state = not running` dengan beberapa `runs` terbaru dan kode keluar, terutama ketika jeda antara crash dan peluncuran berikutnya berada di kisaran satu jam, bukan detik. macOS launchd menerapkan gerbang perlindungan respawn yang tidak terdokumentasi setelah rentetan crash yang dapat berhenti menghormati `KeepAlive=true` sampai pemicu eksternal seperti login interaktif, koneksi dasbor, atau `launchctl kickstart` mengaktifkannya kembali.

Tanda umum:

- Bundle stabilitas yang `error.code`-nya adalah `ENETDOWN` atau kode terkait, dengan stack panggilan mengarah ke Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` dan yang lebih baru mengklasifikasikan ini sebagai kesalahan jaringan transien jinak sehingga tidak lagi menyebar ke handler uncaught tingkat atas; jika Anda memakai rilis yang lebih lama, tingkatkan versi terlebih dahulu.
- Periode senyap panjang yang berakhir seketika saat Anda terhubung ke Control UI atau SSH ke host: aktivitas yang terlihat oleh pengguna itulah yang mengaktifkan kembali gerbang respawn launchd, bukan apa pun yang dilakukan dasbor pada Gateway.
- Hitungan `runs` bertambah sepanjang hari tanpa baris `received SIG*; shutting down` yang sesuai di `~/Library/Logs/openclaw/gateway.log`: shutdown bersih mencatat sinyal; crash transien tidak.

Yang harus dilakukan:

1. **Tingkatkan Gateway** jika Anda menjalankan rilis sebelum `2026.5.26`. Setelah peningkatan, kesalahan `ENETDOWN` berikutnya dicatat sebagai peringatan, bukan menghentikan proses.
2. **Kurangi aktivitas maintenance sleep** pada host Mac mini / desktop yang dimaksudkan berjalan sebagai server selalu aktif:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Ini secara signifikan mengurangi, tetapi tidak sepenuhnya menghilangkan, flap driver yang mendasarinya. Sistem masih dapat melakukan sebagian maintenance sleep untuk TCP keepalive dan pemeliharaan mDNS terlepas dari flag ini.

3. **Tambahkan watchdog liveness** agar rentetan crash di masa depan yang diparkir oleh launchd tertangkap dengan cepat:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Intinya adalah mengaktifkan kembali gerbang respawn secara eksternal; `KeepAlive=true` saja tidak cukup di macOS setelah rentetan crash.

Terkait:

- [Catatan platform macOS](/id/platforms/macos)
- [Pencatatan](/id/logging)
- [Doctor](/id/gateway/doctor)

## Gateway keluar selama penggunaan memori tinggi

Gunakan ini saat Gateway menghilang saat beban tinggi, supervisor melaporkan restart bergaya OOM, atau log menyebutkan `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Cari:

- `Reason: diagnostic.memory.pressure.critical` di bundle stabilitas terbaru.
- `Memory pressure:` dengan `critical/rss_threshold`, `critical/heap_threshold`, atau `critical/rss_growth`.
- Nilai `V8 heap:` yang mendekati batas heap.
- Entri `Largest session files:` seperti `agents/<agent>/sessions/<session>.jsonl` atau `sessions/<session>.jsonl`.
- Counter memori cgroup Linux saat Gateway berjalan di dalam container atau layanan dengan batas memori.

Tanda umum:

- `critical memory pressure bundle written` muncul tidak lama sebelum restart → OpenClaw menangkap bundle stabilitas pra-OOM. Periksa dengan `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` muncul di log Gateway → OpenClaw mendeteksi tekanan memori kritis, tetapi snapshot stabilitas pra-OOM dimatikan.
- `Largest session files:` mengarah ke path transkrip tersunting yang sangat besar → kurangi riwayat sesi yang dipertahankan, periksa pertumbuhan sesi, atau pindahkan transkrip lama keluar dari penyimpanan aktif sebelum restart.
- Byte terpakai `V8 heap:` mendekati batas heap → turunkan tekanan prompt/sesi, kurangi pekerjaan serentak, atau naikkan batas heap Node hanya setelah memastikan workload memang diharapkan.
- `Memory pressure: critical/rss_growth` → memori tumbuh cepat dalam satu jendela sampling. Periksa log terbaru untuk impor besar, output tool yang tidak terkendali, retry berulang, atau batch pekerjaan agen yang antre.
- Tekanan memori kritis muncul di log tetapi tidak ada bundle → ini adalah default. Atur `diagnostics.memoryPressureSnapshot: true` untuk menangkap bundle stabilitas pra-OOM pada peristiwa tekanan memori kritis berikutnya.

Bundle stabilitas bebas payload. Isinya mencakup bukti memori operasional dan path file relatif yang disunting, bukan teks pesan, body webhook, kredensial, token, cookie, atau id sesi mentah. Lampirkan ekspor diagnostik ke laporan bug alih-alih menyalin log mentah.

Terkait:

- [Kesehatan Gateway](/id/gateway/health)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Sesi](/id/cli/sessions)

## Gateway menolak config yang tidak valid

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
- File `openclaw.json.rejected.*` bertimestamp di samping config aktif
- File `openclaw.json.clobbered.*` bertimestamp jika `doctor --fix` memperbaiki edit langsung yang rusak
- OpenClaw menyimpan 32 file `.clobbered.*` terbaru untuk setiap path config dan merotasi yang lebih lama

<AccordionGroup>
  <Accordion title="What happened">
    - Config tidak lolos validasi selama startup, hot reload, atau penulisan milik OpenClaw.
    - Startup Gateway gagal tertutup alih-alih menulis ulang `openclaw.json`.
    - Hot reload melewati edit eksternal yang tidak valid dan menjaga config runtime saat ini tetap aktif.
    - Penulisan milik OpenClaw menolak payload yang tidak valid/destruktif sebelum commit dan menyimpan `.rejected.*`.
    - `openclaw doctor --fix` memiliki perbaikan. Ia dapat menghapus prefiks non-JSON atau memulihkan salinan terakhir yang diketahui baik sambil mempertahankan payload yang ditolak sebagai `.clobbered.*`.
    - Saat banyak perbaikan terjadi untuk satu path config, OpenClaw merotasi file `.clobbered.*` lama sehingga payload yang paling baru diperbaiki masih tersedia.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` ada → doctor mempertahankan edit eksternal yang rusak saat memperbaiki config aktif.
    - `.rejected.*` ada → penulisan config milik OpenClaw gagal schema atau pemeriksaan clobber sebelum commit.
    - `Config write rejected:` → penulisan mencoba menghapus bentuk yang wajib, mengecilkan file secara tajam, atau mempertahankan config yang tidak valid.
    - `config reload skipped (invalid config):` → edit langsung gagal validasi dan diabaikan oleh Gateway yang sedang berjalan.
    - `Invalid config at ...` → startup gagal sebelum layanan Gateway boot.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → penulisan milik OpenClaw ditolak karena kehilangan field atau ukuran dibandingkan backup terakhir yang diketahui baik.
    - `Config last-known-good promotion skipped` → kandidat berisi placeholder rahasia tersunting seperti `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Jalankan `openclaw doctor --fix` agar doctor memperbaiki config berprefiks/ter-clobber atau memulihkan terakhir yang diketahui baik.
    2. Salin hanya key yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
    3. Jalankan `openclaw config validate` sebelum restart.
    4. Jika Anda mengedit manual, pertahankan config JSON5 lengkap, bukan hanya objek parsial yang ingin Anda ubah.
  </Accordion>
</AccordionGroup>

Terkait:

- [Config](/id/cli/config)
- [Konfigurasi: hot reload](/id/gateway/configuration#config-hot-reload)
- [Konfigurasi: validasi ketat](/id/gateway/configuration#strict-validation)
- [Doctor](/id/gateway/doctor)

## Peringatan probe Gateway

Gunakan ini saat `openclaw gateway probe` mencapai sesuatu, tetapi tetap mencetak blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` di output JSON.
- Apakah peringatan terkait fallback SSH, beberapa Gateway, scope yang hilang, atau ref auth yang tidak terselesaikan.

Tanda umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target langsung yang dikonfigurasi/loopback.
- `multiple reachable gateway identities detected` → Gateway berbeda menjawab, atau OpenClaw tidak dapat membuktikan target yang dapat dijangkau adalah Gateway yang sama. Tunnel SSH, URL proxy, atau URL remote yang dikonfigurasi ke Gateway yang sama diperlakukan sebagai satu Gateway dengan beberapa transport, bahkan saat port transport berbeda.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi RPC detail dibatasi scope; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → koneksi berhasil, tetapi set RPC diagnostik penuh timeout atau gagal. Perlakukan ini sebagai Gateway yang dapat dijangkau dengan diagnostik terdegradasi; bandingkan `connect.ok` dan `connect.rpcOk` di output `--json`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → Gateway menjawab, tetapi klien ini masih membutuhkan pairing/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang tidak terselesaikan → material auth tidak tersedia di path perintah ini untuk target yang gagal.

Terkait:

- [Gateway](/id/cli/gateway)
- [Beberapa Gateway di host yang sama](/id/gateway#multiple-gateways-same-host)
- [Akses remote](/id/gateway/remote)

## Channel terhubung, pesan tidak mengalir

Jika status channel terhubung tetapi alur pesan mati, fokus pada kebijakan, izin, dan aturan pengiriman khusus channel.

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
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah auth/izin channel.

Terkait:

- [Pemecahan masalah channel](/id/channels/troubleshooting)
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

- Cron aktif dan wake berikutnya tersedia.
- Status riwayat eksekusi job (`ok`, `skipped`, `error`).
- Alasan Heartbeat dilewati (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Tanda umum">
    - `cron: scheduler disabled; jobs will not run automatically` → cron dinonaktifkan.
    - `cron: timer tick failed` → tick penjadwal gagal; periksa kesalahan file/log/runtime.
    - `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
    - `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi scaffolding kosong, komentar, header, fence, atau checklist kosong, sehingga OpenClaw melewati panggilan model.
    - `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
    - `heartbeat: unknown accountId` → id akun tidak valid untuk target pengiriman heartbeat.
    - `heartbeat skipped` dengan `reason=dm-blocked` → target heartbeat diselesaikan ke tujuan bergaya DM saat `agents.defaults.heartbeat.directPolicy` (atau override per agen) diatur ke `block`.

  </Accordion>
</AccordionGroup>

Terkait:

- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [Tugas terjadwal: pemecahan masalah](/id/automation/cron-jobs#troubleshooting)

## Node dipasangkan, alat gagal

Jika sebuah node dipasangkan tetapi alat gagal, isolasi status foreground, izin, dan persetujuan.

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
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS tidak ada.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [Persetujuan exec](/id/tools/exec-approvals)
- [Pemecahan masalah Node](/id/nodes/troubleshooting)
- [Node](/id/nodes/index)

## Alat browser gagal

Gunakan ini saat tindakan alat browser gagal meskipun gateway itu sendiri sehat.

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
    - alat browser hilang / tidak tersedia saat `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga plugin tidak pernah dimuat.
    - `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
    - `browser.executablePath not found` → path yang dikonfigurasi tidak valid.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki dependensi runtime browser inti; instal ulang atau perbarui OpenClaw, lalu mulai ulang gateway. Snapshot ARIA dan tangkapan layar halaman dasar masih dapat berfungsi, tetapi navigasi, snapshot AI, tangkapan layar elemen pemilih CSS, dan ekspor PDF tetap tidak tersedia.

  </Accordion>
  <Accordion title="Tanda Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP belum dapat melampirkan ke dir data browser yang dipilih. Buka halaman inspeksi browser, aktifkan debugging jarak jauh, biarkan browser tetap terbuka, setujui prompt lampiran pertama, lalu coba lagi. Jika status masuk tidak diperlukan, pilih profil `openclaw` yang dikelola.
    - `No Chrome tabs found for profile="user"` → profil lampiran Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP jarak jauh yang dikonfigurasi tidak dapat dijangkau dari host gateway.
    - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP menjawab tetapi WebSocket CDP tetap tidak dapat dibuka.

  </Accordion>
  <Accordion title="Tanda elemen / tangkapan layar / unggahan">
    - `fullPage is not supported for element screenshots` → permintaan tangkapan layar mencampur `--full-page` dengan `--ref` atau `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → panggilan tangkapan layar Chrome MCP / `existing-session` harus menggunakan pengambilan halaman atau `--ref` snapshot, bukan `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook unggahan Chrome MCP memerlukan ref snapshot, bukan pemilih CSS.
    - `existing-session file uploads currently support one file at a time.` → kirim satu unggahan per panggilan pada profil Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
    - `existing-session type does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:type` pada profil `profile="user"` / existing-session Chrome MCP, atau gunakan profil browser terkelola/CDP saat timeout kustom diperlukan.
    - `existing-session evaluate does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:evaluate` pada profil `profile="user"` / existing-session Chrome MCP, atau gunakan profil browser terkelola/CDP saat timeout kustom diperlukan.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
    - override viewport / mode gelap / lokal / offline yang basi pada profil attach-only atau CDP jarak jauh → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepas status emulasi Playwright/CDP tanpa memulai ulang seluruh gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Browser (dikelola OpenClaw)](/id/tools/browser)
- [Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting)

## Jika Anda memutakhirkan dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan pascapemutakhiran adalah drift konfigurasi atau default yang lebih ketat yang kini diberlakukan.

<AccordionGroup>
  <Accordion title="1. Perilaku override auth dan URL berubah">
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

    - Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan path auth gateway yang valid: auth token/kata sandi bersama, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
    - Kunci lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

    Tanda umum:

    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa path auth gateway yang valid.
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

    - Persetujuan perangkat yang tertunda untuk dashboard/node.
    - Persetujuan pairing DM yang tertunda setelah perubahan kebijakan atau identitas.

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
- [Pairing milik Gateway](/id/gateway/pairing)

## Terkait

- [Doctor](/id/gateway/doctor)
- [FAQ](/id/help/faq)
- [Runbook Gateway](/id/gateway)
