---
read_when:
    - Pusat pemecahan masalah mengarahkan Anda ke sini untuk diagnosis lebih lanjut
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
sidebarTitle: Troubleshooting
summary: Panduan pemecahan masalah mendalam untuk Gateway, channel, otomatisasi, Node, dan browser
title: Pemecahan Masalah
x-i18n:
    generated_at: "2026-07-20T03:49:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a6e3da86a5f655582ea17e1ed3988fc32294c25a34cee04dbcc3e492c997c366
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ini adalah panduan operasional mendalam. Mulailah dari [/help/troubleshooting](/id/help/troubleshooting) untuk mengikuti alur triase cepat terlebih dahulu.

## Urutan perintah

Jalankan dalam urutan berikut:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Indikator kondisi sehat:

- `openclaw gateway status` menampilkan `Runtime: running`, `Connectivity probe: ok`, dan baris `Capability: ...`.
- `openclaw doctor` melaporkan tidak ada masalah konfigurasi/layanan yang menghambat.
- `openclaw channels status --probe` menampilkan status transportasi langsung per akun dan, jika didukung, `works` atau `audit ok`.

## Setelah pembaruan

Gunakan ketika pembaruan selesai, tetapi Gateway tidak aktif, channel kosong, atau panggilan model gagal dengan 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Periksa:

- `Update restart` dalam `openclaw status` / `openclaw status --all`. Serah terima yang tertunda atau gagal menyertakan perintah berikutnya yang harus dijalankan.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` pada Channels: konfigurasi channel masih ada, tetapi pendaftaran plugin gagal sebelum channel dapat dimuat.
- 401 dari penyedia setelah autentikasi ulang: `openclaw doctor --fix` memeriksa bayangan autentikasi OAuth per agen yang sudah usang dan menghapus salinan lama agar semua agen menggunakan profil bersama saat ini.

## Instalasi yang tidak sinkron dan perlindungan konfigurasi yang lebih baru

Gunakan ketika layanan Gateway berhenti secara tidak terduga setelah pembaruan, atau log menunjukkan bahwa satu biner `openclaw` lebih lama daripada versi yang terakhir menulis `openclaw.json`.

OpenClaw menandai penulisan konfigurasi dengan `meta.lastTouchedVersion`. Perintah hanya-baca dapat memeriksa konfigurasi yang ditulis oleh OpenClaw versi lebih baru, tetapi mutasi proses dan layanan tidak dapat dijalankan dari biner yang lebih lama. Tindakan yang diblokir: memulai/menghentikan/memulai ulang/menghapus instalasi layanan Gateway, instalasi ulang layanan secara paksa, memulai Gateway dalam mode layanan, dan pembersihan port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Perbaiki PATH">
    Perbaiki `PATH` agar `openclaw` mengarah ke instalasi yang lebih baru, lalu jalankan kembali tindakan tersebut.
  </Step>
  <Step title="Instal ulang layanan Gateway">
    Instal ulang layanan Gateway yang dimaksud dari instalasi yang lebih baru:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Hapus wrapper usang">
    Hapus entri paket sistem usang atau wrapper lama yang masih mengarah ke biner `openclaw` lama.
  </Step>
</Steps>

<Warning>
Hanya untuk penurunan versi yang disengaja atau pemulihan darurat, tetapkan `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` untuk satu perintah tersebut. Biarkan tidak ditetapkan untuk operasi normal.
</Warning>

## Ketidakcocokan protokol setelah rollback

Gunakan ketika log terus menampilkan `protocol mismatch` setelah penurunan versi atau rollback. Gateway yang lebih lama sedang berjalan, tetapi proses klien lokal yang lebih baru masih mencoba menyambung kembali dengan rentang protokol yang tidak didukung oleh Gateway lama.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Periksa:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` dalam log Gateway.
- `Established clients:` dalam `openclaw gateway status --deep` atau `Gateway clients` dalam `openclaw doctor --deep`: klien TCP aktif yang terhubung ke port Gateway, beserta PID dan baris perintah jika diizinkan oleh OS.
- Proses klien dengan baris perintah yang mengarah ke instalasi atau wrapper OpenClaw lebih baru yang menjadi asal rollback.

Perbaikan:

1. Hentikan atau mulai ulang proses klien OpenClaw usang yang ditampilkan oleh `gateway status --deep`.
2. Mulai ulang aplikasi atau wrapper yang menyematkan OpenClaw: dasbor lokal, editor, pembantu server aplikasi, atau shell `openclaw logs --follow` yang berjalan lama.
3. Jalankan kembali `openclaw gateway status --deep` atau `openclaw doctor --deep` dan pastikan PID klien usang sudah tidak ada.

Jangan membuat Gateway lama menerima protokol baru yang tidak kompatibel. Peningkatan versi protokol melindungi kontrak komunikasi; pemulihan rollback merupakan masalah pembersihan proses/versi.

## Symlink Skills dilewati karena keluar dari jalur

Gunakan ketika log mencakup:

```text
Melewati jalur Skills yang keluar dari root yang dikonfigurasi: ... reason=symlink-escape
```

Setiap root Skills merupakan batas penampungan. Symlink di bawah `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`, atau `~/.openclaw/skills` dilewati jika target sebenarnya mengarah ke luar root tersebut, kecuali target secara eksplisit dipercaya.

Periksa tautan:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Jika target memang disengaja, konfigurasikan root Skills langsung dan target symlink yang diizinkan:

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

Kemudian mulai sesi baru atau tunggu pemantau Skills dimuat ulang. Mulai ulang Gateway jika proses yang sedang berjalan dimulai sebelum perubahan konfigurasi.

Jangan gunakan target luas seperti `~`, `/`, atau seluruh folder proyek yang disinkronkan. Batasi cakupan `allowSymlinkTargets` pada root Skills sebenarnya yang berisi direktori `SKILL.md` tepercaya.

Jika penerapan Skill Workshop juga harus menulis melalui jalur Skills ruang kerja bersymlink yang tepercaya tersebut, aktifkan `skills.workshop.allowSymlinkTargetWrites`. Biarkan tetap dinonaktifkan untuk root Skills bersama yang hanya-baca.

Terkait:

- [Konfigurasi Skills](/id/tools/skills-config#symlinked-skill-roots)
- [Contoh konfigurasi](/id/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Penggunaan tambahan Anthropic 429 diperlukan untuk konteks panjang

Gunakan ketika log/kesalahan mencakup: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Periksa:

- Model Anthropic yang dipilih adalah model Claude 4.x 1M yang mendukung GA (Opus 4.6/4.7/4.8, Sonnet 4.6), atau konfigurasi model masih memuat `params.context1m: true` lama.
- Kredensial Anthropic saat ini tidak memenuhi syarat untuk penggunaan konteks panjang.
- Permintaan hanya gagal pada sesi panjang/eksekusi model yang memerlukan jalur konteks 1M.

Opsi perbaikan:

<Steps>
  <Step title="Gunakan jendela konteks standar">
    Beralihlah ke model dengan jendela standar, atau hapus `context1m` lama dari
    konfigurasi model lama yang tidak mendukung GA untuk konteks 1M.
  </Step>
  <Step title="Gunakan kredensial yang memenuhi syarat">
    Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralihlah ke kunci API Anthropic.
  </Step>
  <Step title="Konfigurasikan model fallback">
    Konfigurasikan model fallback agar eksekusi berlanjut ketika permintaan konteks panjang Anthropic ditolak.
  </Step>
</Steps>

Terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan dan biaya token](/id/reference/token-use)
- [Mengapa saya melihat HTTP 429 dari Anthropic?](/id/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Respons 403 yang diblokir upstream

Gunakan ketika penyedia LLM upstream mengembalikan `403` generik seperti `Your request was blocked`.

Jangan berasumsi bahwa hal ini selalu merupakan masalah konfigurasi OpenClaw. Respons dapat berasal dari lapisan keamanan upstream seperti CDN, WAF, aturan pengelolaan bot, atau proksi terbalik di depan endpoint yang kompatibel dengan OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Periksa:

- Beberapa model dari penyedia yang sama gagal dengan cara yang sama.
- HTML atau teks keamanan generik, bukan kesalahan API penyedia normal.
- Peristiwa keamanan di sisi penyedia untuk waktu permintaan yang sama.
- Probe langsung `curl` yang sangat kecil berhasil, sedangkan permintaan normal berbentuk SDK gagal.

Perbaiki pemfilteran di sisi penyedia terlebih dahulu jika bukti mengarah pada pemblokiran WAF/CDN. Utamakan aturan pengizinan atau pelewatan yang dibatasi secara ketat untuk jalur API yang digunakan OpenClaw, dan hindari menonaktifkan perlindungan untuk seluruh situs.

<Warning>
Keberhasilan `curl` minimal tidak menjamin bahwa permintaan nyata bergaya SDK akan melewati lapisan keamanan upstream yang sama.
</Warning>

Terkait:

- [Endpoint yang kompatibel dengan OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)
- [Konfigurasi penyedia](/id/providers)
- [Log](/id/logging)

## Backend lokal yang kompatibel dengan OpenAI lolos probe langsung, tetapi eksekusi agen gagal

Gunakan ketika:

- `curl ... /v1/models` berfungsi.
- Panggilan langsung `/v1/chat/completions` yang sangat kecil berfungsi.
- Eksekusi model OpenClaw hanya gagal pada giliran agen normal.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Periksa:

- Panggilan langsung yang sangat kecil berhasil, tetapi eksekusi OpenClaw hanya gagal pada prompt yang lebih besar.
- Kesalahan `model_not_found` atau 404 meskipun `/v1/chat/completions` langsung berfungsi dengan ID model polos yang sama.
- Kesalahan backend tentang `messages[].content` yang mengharapkan string.
- Peringatan `incomplete turn detected ... stopReason=stop payloads=0` berselang-seling dengan backend lokal yang kompatibel dengan OpenAI.
- Backend mengalami crash yang hanya muncul dengan jumlah token prompt lebih besar atau prompt runtime agen lengkap.

<AccordionGroup>
  <Accordion title="Pola umum">
    - `model_not_found` dengan server lokal bergaya MLX/vLLM: pastikan `baseUrl` menyertakan `/v1`, `api` adalah `"openai-completions"` untuk backend `/v1/chat/completions`, dan `models.providers.<provider>.models[].id` merupakan ID lokal penyedia yang polos. Pilih sekali dengan prefiks penyedia, misalnya `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pertahankan entri katalog sebagai `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: backend menolak bagian konten Chat Completions terstruktur. Perbaikan: tetapkan `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` atau kunci pesan yang diizinkan seperti `["role","content"]`: backend menolak metadata pemutaran ulang bergaya OpenAI pada pesan Chat Completions. Perbaikan: tetapkan `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: backend menyelesaikan permintaan Chat Completions, tetapi tidak mengembalikan teks asisten yang terlihat oleh pengguna untuk giliran tersebut. OpenClaw mencoba kembali satu kali untuk giliran kosong kompatibel dengan OpenAI yang aman diputar ulang; kegagalan berulang biasanya berarti backend menghasilkan konten kosong/nonteks atau menyembunyikan teks jawaban akhir.
    - Permintaan langsung yang sangat kecil berhasil, tetapi eksekusi agen OpenClaw gagal akibat crash backend/model (misalnya Gemma pada beberapa build `inferrs`): transportasi OpenClaw kemungkinan sudah benar; backend gagal menangani bentuk prompt runtime agen yang lebih besar.
    - Kegagalan berkurang setelah alat dinonaktifkan, tetapi tidak hilang: skema alat merupakan bagian dari beban, tetapi masalah yang tersisa tetap berupa kapasitas model/server upstream atau bug backend.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Tetapkan `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya menerima string.
    2. Tetapkan `compat.strictMessageKeys: true` untuk backend Chat Completions ketat yang hanya menerima `role` dan `content` pada setiap pesan.
    3. Tetapkan `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani permukaan skema alat OpenClaw secara andal.
    4. Kurangi beban prompt jika memungkinkan: bootstrap ruang kerja yang lebih kecil, riwayat sesi yang lebih pendek, model lokal yang lebih ringan, atau backend dengan dukungan konteks panjang yang lebih kuat.
    5. Jika permintaan langsung yang sangat kecil tetap berhasil sementara giliran agen OpenClaw masih mengalami crash di dalam backend, perlakukan hal tersebut sebagai keterbatasan server/model upstream dan ajukan reproduksi di sana dengan bentuk payload yang diterima.
  </Accordion>
</AccordionGroup>

Terkait:

- [Konfigurasi](/id/gateway/configuration)
- [Model lokal](/id/gateway/local-models)
- [Endpoint yang kompatibel dengan OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)

## Tidak ada balasan

Jika saluran aktif tetapi tidak ada yang menjawab, periksa perutean dan kebijakan sebelum menyambungkan kembali apa pun.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cari:

- Pemasangan tertunda untuk pengirim DM.
- Pembatasan penyebutan grup (`requireMention`, `mentionPatterns`).
- Ketidakcocokan daftar yang diizinkan untuk saluran/grup.

Pola umum:

- `drop guild message (mention required` → pesan grup diabaikan hingga ada penyebutan.
- `pairing request` → pengirim memerlukan persetujuan.
- `blocked` / `allowlist` → pengirim/saluran difilter oleh kebijakan.

Terkait:

- [Pemecahan masalah saluran](/id/channels/troubleshooting)
- [Grup](/id/channels/groups)
- [Pemasangan](/id/channels/pairing)

## Konektivitas UI kontrol dasbor

Jika dasbor/UI kontrol tidak dapat terhubung, validasi URL, mode autentikasi, dan asumsi konteks aman.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cari:

- URL pemeriksaan dan URL dasbor yang benar.
- Ketidakcocokan mode autentikasi/token antara klien dan gateway.
- Penggunaan HTTP saat identitas perangkat diwajibkan.

Jika peramban lokal tidak dapat terhubung ke `127.0.0.1:18789` setelah pembaruan, pulihkan layanan Gateway lokal terlebih dahulu dan pastikan layanan tersebut menyajikan dasbor:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Jika `curl` mengembalikan HTML OpenClaw, Gateway berfungsi dan masalah yang tersisa kemungkinan adalah cache peramban, tautan dalam lama, atau status tab yang usang. Buka `http://127.0.0.1:18789` secara langsung dan navigasikan dari dasbor. Jika layanan tidak tetap berjalan setelah dimulai ulang, jalankan `openclaw gateway start` dan periksa kembali `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Pola koneksi/autentikasi">
    - `device identity required` → konteks tidak aman atau autentikasi perangkat tidak ada.
    - `origin not allowed` → `Origin` peramban tidak ada di `gateway.controlUi.allowedOrigins` (atau Anda terhubung dari origin peramban non-loopback tanpa daftar yang diizinkan secara eksplisit).
    - `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan alur autentikasi perangkat berbasis tantangan (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah (atau stempel waktu usang) untuk handshake saat ini.
    - `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu percobaan ulang tepercaya dengan token perangkat yang disimpan dalam cache.
    - Percobaan ulang dengan token cache tersebut menggunakan kembali kumpulan cakupan cache yang disimpan bersama token perangkat yang telah dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap menggunakan kumpulan cakupan yang dimintanya.
    - `AUTH_SCOPE_MISMATCH` → token perangkat dikenali, tetapi cakupan yang disetujuinya tidak mencakup permintaan koneksi ini; pasangkan ulang atau setujui kontrak cakupan yang diminta alih-alih merotasi token gateway bersama.
    - Di luar jalur percobaan ulang tersebut, urutan prioritas autentikasi koneksi adalah token bersama/kata sandi eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, kemudian token perangkat tersimpan, lalu token bootstrap.
    - Pada jalur UI Kontrol Tailscale Serve asinkron, percobaan gagal untuk `{scope, ip}` yang sama diserialisasi sebelum pembatas mencatat kegagalan. Oleh karena itu, dua percobaan ulang bersamaan yang salah dari klien yang sama dapat menampilkan `retry later` pada percobaan kedua, bukan dua ketidakcocokan biasa.
    - `too many failed authentication attempts (retry later)` dari klien loopback ber-origin peramban → kegagalan berulang dari `Origin` ternormalisasi yang sama diblokir sementara; origin localhost lain menggunakan bucket terpisah.
    - `unauthorized` yang berulang setelah percobaan ulang tersebut → pergeseran token bersama/token perangkat; segarkan konfigurasi token dan setujui ulang/rotasi token perangkat jika diperlukan.
    - `gateway connect failed:` → target host/port/URL salah.

  </Accordion>
</AccordionGroup>

### Peta ringkas kode detail autentikasi

Gunakan `error.details.code` dari respons `connect` yang gagal untuk menentukan tindakan berikutnya:

| Kode detail                  | Arti                                                                                                                                                                                      | Tindakan yang disarankan                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim token bersama yang diwajibkan.                                                                                                                                                 | Tempelkan/atur token di klien dan coba lagi. Untuk jalur dasbor: `openclaw config get gateway.auth.token`, lalu tempelkan ke pengaturan UI Kontrol.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Token bersama tidak cocok dengan token autentikasi gateway.                                                                                                                                               | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang dengan token cache menggunakan kembali cakupan tersimpan yang telah disetujui; pemanggil `deviceToken` / `scopes` eksplisit tetap menggunakan cakupan yang diminta. Jika masih gagal, jalankan [daftar periksa pemulihan pergeseran token](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per perangkat yang disimpan dalam cache sudah usang atau dicabut.                                                                                                                                                 | Rotasi/setujui ulang token perangkat menggunakan [CLI perangkat](/id/cli/devices), lalu sambungkan kembali.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Token perangkat valid, tetapi peran/cakupan yang disetujuinya tidak mencakup permintaan koneksi ini.                                                                                                       | Pasangkan ulang perangkat atau setujui kontrak cakupan yang diminta; jangan perlakukan ini sebagai pergeseran token bersama.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Identitas perangkat memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` jika tersedia. | Setujui permintaan tertunda: `openclaw devices list`, lalu `openclaw devices approve <requestId>`. Peningkatan cakupan/peran menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                                               |

<Note>
RPC backend loopback langsung yang diautentikasi dengan token/kata sandi gateway bersama tidak boleh bergantung pada garis dasar cakupan perangkat terpasang milik CLI. Jika subagen atau panggilan internal lainnya masih gagal dengan `scope-upgrade`, pastikan pemanggil menggunakan `client.id: "gateway-client"` dan `client.mode: "backend"` serta tidak memaksakan `deviceIdentity` eksplisit atau token perangkat.
</Note>

Pemeriksaan migrasi autentikasi perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menunjukkan kesalahan nonce/tanda tangan, perbarui klien yang terhubung dan verifikasi:

<Steps>
  <Step title="Tunggu connect.challenge">
    Klien menunggu `connect.challenge` yang diterbitkan gateway.
  </Step>
  <Step title="Tandatangani payload">
    Klien menandatangani payload yang terikat pada tantangan.
  </Step>
  <Step title="Kirim nonce perangkat">
    Klien mengirim `connect.params.device.nonce` dengan nonce tantangan yang sama.
  </Step>
</Steps>

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tidak terduga:

- Sesi token perangkat terpasang hanya dapat mengelola perangkat **miliknya sendiri**, kecuali pemanggil juga memiliki `operator.admin`.
- `openclaw devices rotate --scope ...` hanya dapat meminta cakupan operator yang sudah dimiliki oleh sesi pemanggil.

Terkait:

- [Konfigurasi](/id/gateway/configuration) (mode autentikasi gateway)
- [UI Kontrol](/id/web/control-ui)
- [Perangkat](/id/cli/devices)
- [Akses jarak jauh](/id/gateway/remote)
- [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth)

## Layanan Gateway tidak berjalan

Gunakan ketika layanan terpasang tetapi proses tidak tetap aktif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga pindai layanan tingkat sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk keluar.
- Ketidakcocokan konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Pola umum">
    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal tidak diaktifkan, atau file konfigurasi tertimpa dan kehilangan `gateway.mode`. Perbaikan: atur `gateway.mode="local"` dalam konfigurasi Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk menetapkan ulang konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, jalur konfigurasi default adalah `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur autentikasi gateway yang valid (token/kata sandi, atau proksi tepercaya jika dikonfigurasi).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
    - `Other gateway-like services detected (best effort)` → terdapat unit launchd/systemd/schtasks yang usang atau berjalan paralel. Sebagian besar penyiapan sebaiknya mempertahankan satu gateway per mesin; jika Anda memang memerlukan lebih dari satu, pisahkan port + konfigurasi/status/ruang kerja. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` dari doctor → terdapat unit sistem systemd sementara layanan tingkat pengguna tidak ada. Hapus atau nonaktifkan duplikat sebelum mengizinkan doctor memasang layanan pengguna, atau atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` jika unit sistem tersebut adalah supervisor yang dimaksudkan.
    - `Gateway service port does not match current gateway config` → supervisor yang terpasang masih menetapkan `--port` lama. Jalankan `openclaw doctor --fix` atau `openclaw gateway install --force`, lalu mulai ulang layanan gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Eksekusi latar belakang dan alat proses](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Doctor](/id/gateway/doctor)

## Gateway macOS berhenti merespons tanpa pemberitahuan, lalu kembali merespons saat Anda menyentuh dasbor

Gunakan ketika channel (Telegram, WhatsApp, dll.) pada host macOS tidak merespons selama beberapa menit hingga beberapa jam, dan Gateway tampak kembali aktif begitu Anda membuka Control UI, masuk melalui SSH, atau berinteraksi dengan host dengan cara lain. Biasanya tidak ada gejala yang jelas di `openclaw status` karena saat Anda memeriksanya, Gateway sudah aktif kembali.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Periksa:

- Satu atau beberapa bundel `*-uncaught_exception.json` di `~/.openclaw/logs/stability/` dengan `error.code` yang ditetapkan ke kode jaringan sementara seperti `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH`, atau `ECONNREFUSED`.
- Baris `pmset -g log` seperti `Entering Sleep state due to 'Maintenance Sleep'` atau `en0 driver is slow (msg: WillChangeState to 0)` yang waktunya selaras dengan stempel waktu crash. Power Nap / Maintenance Sleep secara singkat menempatkan driver Wi-Fi ke status 0; setiap `connect()` keluar yang terjadi dalam rentang waktu tersebut dapat gagal dengan `ENETDOWN`, bahkan pada host yang selain itu memiliki konektivitas jaringan penuh.
- Output `launchctl print` yang menampilkan `state = not running` dengan beberapa `runs` terbaru dan kode keluar, terutama ketika jeda antara crash dan peluncuran berikutnya sekitar satu jam, bukan beberapa detik. launchd macOS menerapkan gerbang perlindungan respawn yang tidak terdokumentasi setelah serangkaian crash, yang dapat berhenti mematuhi `KeepAlive=true` hingga pemicu eksternal seperti login interaktif, koneksi dasbor, atau `launchctl kickstart` mengaktifkannya kembali.

Pola umum:

- Bundel stabilitas dengan `error.code` berupa `ENETDOWN` atau kode sejenis, dengan tumpukan panggilan yang mengarah ke Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` dan yang lebih baru mengklasifikasikannya sebagai kesalahan jaringan sementara yang tidak berbahaya sehingga tidak lagi diteruskan ke handler uncaught tingkat atas; jika Anda menggunakan rilis yang lebih lama, lakukan upgrade terlebih dahulu.
- Periode hening yang panjang dan berakhir seketika saat Anda terhubung ke Control UI atau masuk ke host melalui SSH: aktivitas yang terlihat oleh pengguna itulah yang mengaktifkan kembali gerbang respawn launchd, bukan tindakan apa pun yang dilakukan dasbor terhadap Gateway.
- Jumlah `runs` bertambah sepanjang hari tanpa baris `received SIG*; shutting down` yang sesuai di `~/Library/Logs/openclaw/gateway.log`: penghentian bersih mencatat sinyal; crash sementara tidak.

Yang harus dilakukan:

1. **Upgrade Gateway** jika Anda menjalankan rilis sebelum `2026.5.26`. Setelah upgrade, kesalahan `ENETDOWN` berikutnya dicatat sebagai peringatan, bukan menghentikan proses.
2. **Kurangi aktivitas maintenance sleep** pada host Mac mini / desktop yang dimaksudkan untuk berjalan sebagai server yang selalu aktif:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Ini secara signifikan mengurangi, tetapi tidak sepenuhnya menghilangkan, gangguan driver yang mendasarinya. Sistem masih dapat menjalankan beberapa maintenance sleep untuk pemeliharaan TCP keepalive dan mDNS terlepas dari flag ini.

3. **Tambahkan watchdog keaktifan** agar serangkaian crash mendatang yang ditahan oleh launchd dapat dideteksi dengan cepat:

   ```bash
   # Contoh pemeriksaan keaktifan yang memahami launchd, cocok untuk cron atau LaunchAgent setiap 5 menit
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Tujuannya adalah mengaktifkan kembali gerbang respawn secara eksternal; `KeepAlive=true` saja tidak cukup di macOS setelah serangkaian crash.

Terkait:

- [Catatan platform macOS](/id/platforms/macos)
- [Pencatatan log](/id/logging)
- [Doctor](/id/gateway/doctor)

## Loop supervisor launchd macOS dengan LaunchAgent Gateway/Node duplikat

Gunakan ini ketika instalasi macOS terus dimulai ulang setiap beberapa detik, pemeriksaan kesehatan `openclaw`
berganti-ganti antara sehat dan tidak tersedia, serta pengiriman channel terhenti
meskipun layanan tampak berjalan.

Hal ini diamati pada instalasi lama ketika `ai.openclaw.gateway` dan
`ai.openclaw.node` LaunchAgent sama-sama aktif dan masing-masing menyuntikkan
`OPENCLAW_LAUNCHD_LABEL`. Dalam keadaan tersebut, OpenClaw dapat mendeteksi supervisi
launchd, mencoba menyerahkan kembali proses mulai ulang kepada launchd, lalu masuk ke loop cepat
`EADDRINUSE`/respawn alih-alih menjalankan satu proses Gateway yang stabil.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Periksa:

- Lebih dari satu PID Gateway selama sampel 30 detik, bukan satu proses
  yang stabil.
- `EADDRINUSE`, `another gateway instance is already listening`, atau baris
  mulai ulang/serah-terima berulang di `gateway.log`.
- `~/Library/LaunchAgents/ai.openclaw.gateway.plist` dan
  `~/Library/LaunchAgents/ai.openclaw.node.plist` dimuat secara bersamaan pada
  host yang seharusnya hanya menjalankan satu layanan Gateway terkelola.

Yang harus dilakukan:

1. Jika host ini seharusnya hanya menjalankan layanan Gateway, hapus layanan Node
   terkelola melalui OpenClaw. **Lewati langkah ini** jika Anda secara aktif mengandalkan layanan Node
   untuk fitur Node jarak jauh; menghapus instalasinya akan menghentikan fitur tersebut pada
   host ini:

   ```bash
   openclaw node uninstall
   ```

2. Instal wrapper Gateway persisten yang menghapus penanda launchd
   yang diwariskan sebelum memulai OpenClaw. Gunakan opsi `--wrapper` yang didukung; jangan
   mengedit berkas yang dihasilkan di bawah `~/.openclaw/service-env/`, karena instalasi ulang
   layanan, pembaruan, dan perbaikan Doctor akan membuat ulang berkas tersebut:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` mempertahankan path wrapper saat instalasi ulang paksa,
   pembaruan, dan perbaikan Doctor.

3. Verifikasi bahwa Gateway stabil dan melayani RPC, bukan sekadar mendengarkan:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   Sampel PID seharusnya menampilkan satu proses stabil, bukan sekumpulan
   PID yang terus berganti, dan pengiriman channel masuk seharusnya berlanjut kembali.

4. Setelah melakukan upgrade ke rilis yang telah memperbaiki loop dua LaunchAgent
   yang mendasarinya, hapus solusi sementara dan instal ulang layanan terkelola normal:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Terkait:

- [Catatan platform macOS](/id/platforms/mac/bundled-gateway)
- [Doctor](/id/gateway/doctor)
- [CLI Gateway](/id/cli/gateway)

## Gateway berhenti saat penggunaan memori tinggi

Gunakan ketika Gateway menghilang saat menerima beban, supervisor melaporkan mulai ulang bergaya OOM, atau log menyebutkan `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Periksa:

- `Reason: diagnostic.memory.pressure.critical` dalam bundel stabilitas terbaru.
- `Memory pressure:` dengan `critical/rss_threshold`, `critical/heap_threshold`, atau `critical/rss_growth`.
- Nilai `V8 heap:` mendekati batas heap.
- Entri `Largest session files:` seperti `agents/<agent>/sessions/<session>.jsonl` atau `sessions/<session>.jsonl`.
- Penghitung memori cgroup Linux ketika Gateway berjalan di dalam container atau layanan dengan batas memori.

Pola umum:

- `critical memory pressure bundle written` muncul sesaat sebelum mulai ulang → OpenClaw merekam bundel stabilitas pra-OOM. Periksa dengan `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical` muncul di log Gateway → OpenClaw mendeteksi tekanan memori kritis dan mencatat fakta memori dalam proses yang tersedia.
- `Largest session files:` mengarah ke path transkrip tersamarkan yang sangat besar → kurangi riwayat sesi yang dipertahankan, periksa pertumbuhan sesi, atau pindahkan transkrip lama keluar dari penyimpanan aktif sebelum memulai ulang.
- Byte `V8 heap:` yang digunakan mendekati batas heap → kurangi tekanan prompt/sesi atau pekerjaan bersamaan terlebih dahulu. Untuk layanan terkelola, periksa `Gateway heap:` di `openclaw gateway status`; jika tertulis `not set`, buat ulang metadata layanan lama dengan `openclaw gateway install --force`. `NODE_OPTIONS` shell sekitar sengaja diabaikan. Gunakan penggantian batas heap eksplisit pada tingkat supervisor hanya setelah memastikan beban kerja berkelanjutan dan menyisakan ruang memori native yang cukup.
- `Memory pressure: critical/rss_growth` → memori bertambah dengan cepat dalam satu rentang pengambilan sampel. Periksa log terbaru untuk impor besar, output alat yang tidak terkendali, percobaan ulang berulang, atau sekumpulan pekerjaan agen yang mengantre.
- Tekanan memori kritis muncul di log tetapi tidak ada bundel → rekam `openclaw gateway diagnostics export` setelah kejadian untuk mendapatkan bukti operasional yang tersedia.

Bundel stabilitas tidak berisi payload. Bundel ini mencakup bukti operasional memori dan path berkas relatif yang disamarkan, bukan teks pesan, isi Webhook, kredensial, token, cookie, atau ID sesi mentah. Lampirkan ekspor diagnostik ke laporan bug alih-alih menyalin log mentah.

Terkait:

- [Kesehatan Gateway](/id/gateway/health)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Sesi](/id/cli/sessions)

## Gateway menolak konfigurasi yang tidak valid

Gunakan ketika startup Gateway gagal dengan `Invalid config` atau log hot reload menyatakan bahwa pengeditan yang tidak valid dilewati.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Periksa:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Berkas `openclaw.json.rejected.*` berstempel waktu di samping konfigurasi aktif.
- Berkas `openclaw.json.clobbered.*` berstempel waktu jika `doctor --fix` memperbaiki pengeditan langsung yang rusak.
- OpenClaw menyimpan 32 berkas `.clobbered.*` terbaru untuk setiap path konfigurasi dan merotasi berkas yang lebih lama.

<AccordionGroup>
  <Accordion title="Yang terjadi">
    - Konfigurasi tidak lolos validasi saat startup, hot reload, atau penulisan milik OpenClaw.
    - Startup Gateway gagal secara tertutup alih-alih menulis ulang `openclaw.json`.
    - Hot reload melewati pengeditan eksternal yang tidak valid dan mempertahankan konfigurasi runtime saat ini tetap aktif.
    - Penulisan milik OpenClaw menolak payload yang tidak valid/destruktif sebelum commit dan menyimpan `.rejected.*`.
    - `openclaw doctor --fix` menangani perbaikan. Ini dapat menghapus prefiks non-JSON atau memulihkan salinan terakhir yang diketahui baik sambil mempertahankan payload yang ditolak sebagai `.clobbered.*`.
    - Ketika banyak perbaikan terjadi untuk satu path konfigurasi, OpenClaw merotasi berkas `.clobbered.*` yang lebih lama agar payload terbaru yang diperbaiki tetap tersedia.

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
  <Accordion title="Pola umum">
    - `.clobbered.*` ada → doctor mempertahankan pengeditan eksternal yang rusak saat memperbaiki konfigurasi aktif.
    - `.rejected.*` ada → penulisan konfigurasi milik OpenClaw gagal dalam pemeriksaan skema atau penimpaan sebelum commit.
    - `Config write rejected:` → penulisan mencoba menghilangkan struktur yang diwajibkan, memperkecil berkas secara drastis, atau menyimpan konfigurasi yang tidak valid.
    - `config reload skipped (invalid config):` → pengeditan langsung gagal divalidasi dan diabaikan oleh Gateway yang sedang berjalan.
    - `Invalid config at ...` → proses awal gagal sebelum layanan Gateway dimulai.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → penulisan milik OpenClaw ditolak karena kehilangan bidang atau ukuran dibandingkan dengan cadangan terakhir yang diketahui baik.
    - `Config last-known-good promotion skipped` → kandidat berisi placeholder rahasia yang disamarkan seperti `***`.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Jalankan `openclaw doctor --fix` agar doctor memperbaiki konfigurasi yang memiliki prefiks/tertimpa atau memulihkan konfigurasi terakhir yang diketahui baik.
    2. Salin hanya kunci yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
    3. Jalankan `openclaw config validate` sebelum memulai ulang.
    4. Jika Anda mengedit secara manual, pertahankan konfigurasi JSON5 lengkap, bukan hanya objek parsial yang ingin diubah.
  </Accordion>
</AccordionGroup>

Terkait:

- [Konfigurasi](/id/cli/config)
- [Konfigurasi: muat ulang langsung](/id/gateway/configuration#config-hot-reload)
- [Konfigurasi: validasi ketat](/id/gateway/configuration#strict-validation)
- [Doctor](/id/gateway/doctor)

## Peringatan pemeriksaan Gateway

Gunakan ketika `openclaw gateway probe` berhasil menjangkau sesuatu, tetapi masih mencetak blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` dalam keluaran JSON.
- Apakah peringatan berkaitan dengan fallback SSH, beberapa gateway, cakupan yang tidak ada, atau referensi autentikasi yang belum terselesaikan.

Pola umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah masih mencoba target langsung yang dikonfigurasi/loopback.
- `multiple reachable gateway identities detected` → beberapa gateway yang berbeda merespons, atau OpenClaw tidak dapat membuktikan bahwa target yang dapat dijangkau adalah gateway yang sama. Terowongan SSH, URL proksi, atau URL jarak jauh yang dikonfigurasi ke gateway yang sama diperlakukan sebagai satu gateway dengan beberapa transportasi, bahkan ketika port transportasi berbeda.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi RPC detail dibatasi oleh cakupan; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → koneksi berhasil, tetapi rangkaian lengkap RPC diagnostik kehabisan waktu atau gagal. Perlakukan ini sebagai Gateway yang dapat dijangkau dengan diagnostik yang menurun; bandingkan `connect.ok` dan `connect.rpcOk` dalam keluaran `--json`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → gateway merespons, tetapi klien ini masih memerlukan pemasangan/persetujuan sebelum akses operator normal.
- Teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang belum terselesaikan → materi autentikasi tidak tersedia dalam jalur perintah ini untuk target yang gagal.

Terkait:

- [Gateway](/id/cli/gateway)
- [Beberapa gateway pada host yang sama](/id/gateway#multiple-gateways-same-host)
- [Akses jarak jauh](/id/gateway/remote)

## Kanal terhubung, pesan tidak mengalir

Jika status kanal terhubung tetapi aliran pesan terhenti, fokuslah pada kebijakan, izin, dan aturan pengiriman khusus kanal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Cari:

- Kebijakan DM (`pairing`, `allowlist`, `open`, `disabled`).
- Daftar yang diizinkan untuk grup dan persyaratan penyebutan.
- Izin/cakupan API kanal yang tidak ada.

Pola umum:

- `mention required` → pesan diabaikan oleh kebijakan penyebutan grup.
- `pairing` / jejak persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah autentikasi/izin kanal.

Terkait:

- [Pemecahan masalah kanal](/id/channels/troubleshooting)
- [Discord](/id/channels/discord)
- [Telegram](/id/channels/telegram)
- [WhatsApp](/id/channels/whatsapp)

## Pengiriman Cron dan Heartbeat

Jika Cron atau Heartbeat tidak berjalan atau tidak mengirim, verifikasi status penjadwal terlebih dahulu, lalu target pengiriman.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cari:

- Cron diaktifkan dan waktu bangun berikutnya tersedia.
- Status riwayat eksekusi tugas (`ok`, `skipped`, `error`).
- Alasan Heartbeat dilewati (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Pola umum">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron dinonaktifkan.
    - `cron: timer tick failed` → tick penjadwal gagal; periksa kesalahan berkas/log/runtime.
    - `heartbeat skipped` dengan `reason=quiet-hours` → berada di luar rentang jam aktif.
    - `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi kerangka kosong, komentar, header, fence, atau daftar periksa kosong, sehingga OpenClaw melewati pemanggilan model.
    - `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
    - `heartbeat: unknown accountId` → ID akun tidak valid untuk target pengiriman Heartbeat.
    - `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat diidentifikasi sebagai tujuan bergaya DM saat `agents.defaults.heartbeat.directPolicy` (atau penggantian per agen) diatur ke `block`.

  </Accordion>
</AccordionGroup>

Terkait:

- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [Tugas terjadwal: pemecahan masalah](/id/automation/cron-jobs#troubleshooting)

## Node terpasang, alat gagal

Jika Node telah dipasangkan tetapi alat gagal, pisahkan status latar depan, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cari:

- Node daring dengan kemampuan yang diharapkan.
- Pemberian izin OS untuk kamera/mikrofon/lokasi/layar.
- Persetujuan eksekusi dan status daftar yang diizinkan.

Pola umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi Node harus berada di latar depan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS tidak ada.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan eksekusi tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh daftar yang diizinkan.

Terkait:

- [Persetujuan eksekusi](/id/tools/exec-approvals)
- [Pemecahan masalah Node](/id/nodes/troubleshooting)
- [Node](/id/nodes/index)

## Alat peramban gagal

Gunakan ketika tindakan alat peramban gagal meskipun gateway itu sendiri sehat.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cari:

- Apakah `plugins.allow` diatur dan menyertakan `browser`.
- Jalur berkas eksekusi peramban yang valid.
- Keterjangkauan profil CDP.
- Ketersediaan Chrome lokal untuk profil `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Pola Plugin / berkas eksekusi">
    - `unknown command "browser"` atau `unknown command 'browser'` → Plugin peramban bawaan dikecualikan oleh `plugins.allow`.
    - Alat peramban tidak ada / tidak tersedia saat `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga Plugin tidak pernah dimuat.
    - `Failed to start Chrome CDP on port` → proses peramban gagal diluncurkan.
    - `browser.executablePath not found` → jalur yang dikonfigurasi tidak valid.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang salah atau di luar rentang.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki dependensi runtime peramban inti; instal ulang atau perbarui OpenClaw, lalu mulai ulang gateway. Snapshot ARIA dan tangkapan layar halaman dasar masih dapat berfungsi, tetapi navigasi, snapshot AI, tangkapan layar elemen dengan pemilih CSS, dan ekspor PDF tetap tidak tersedia.

  </Accordion>
  <Accordion title="Pola Chrome MCP / sesi yang ada">
    - `Could not find DevToolsActivePort for chrome` → sesi yang ada di Chrome MCP belum dapat terhubung ke direktori data peramban yang dipilih. Buka halaman pemeriksaan peramban, aktifkan debugging jarak jauh, biarkan peramban tetap terbuka, setujui permintaan koneksi pertama, lalu coba lagi. Jika status masuk tidak diperlukan, utamakan profil `openclaw` yang dikelola.
    - `No browser tabs found for profile="user"` → profil koneksi Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
    - `Remote CDP for profile "<name>" is not reachable` → titik akhir CDP jarak jauh yang dikonfigurasi tidak dapat dijangkau dari host gateway.
    - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil khusus koneksi tidak memiliki target yang dapat dijangkau, atau titik akhir HTTP merespons tetapi WebSocket CDP masih tidak dapat dibuka.

  </Accordion>
  <Accordion title="Pola elemen / tangkapan layar / unggahan">
    - `fullPage is not supported for element screenshots` → permintaan tangkapan layar mencampurkan `--full-page` dengan `--ref` atau `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → pemanggilan tangkapan layar Chrome MCP / `existing-session` harus menggunakan pengambilan halaman atau `--ref` snapshot, bukan `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook unggahan Chrome MCP memerlukan referensi snapshot, bukan pemilih CSS.
    - `existing-session file uploads currently support one file at a time.` → kirim satu unggahan per pemanggilan pada profil Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung penggantian batas waktu.
    - `existing-session type does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:type` pada profil sesi yang ada `profile="user"` / Chrome MCP, atau gunakan profil peramban terkelola/CDP ketika batas waktu khusus diperlukan.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan peramban terkelola atau profil CDP mentah.
    - Penggantian viewport / mode gelap / lokal / luring yang usang pada profil khusus koneksi atau CDP jarak jauh → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa memulai ulang seluruh gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Peramban (dikelola OpenClaw)](/id/tools/browser)
- [Pemecahan masalah peramban](/id/tools/browser-linux-troubleshooting)

## Jika Anda melakukan peningkatan dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah peningkatan disebabkan oleh penyimpangan konfigurasi atau default yang lebih ketat dan kini diberlakukan.

<AccordionGroup>
  <Accordion title="1. Perilaku autentikasi dan penggantian URL berubah">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Hal yang perlu diperiksa:

    - Jika `gateway.mode=remote`, panggilan CLI mungkin menargetkan sistem jarak jauh sementara layanan lokal Anda berfungsi dengan baik.
    - Panggilan `--url` eksplisit tidak beralih menggunakan kredensial tersimpan.

    Indikasi umum:

    - `gateway connect failed:` → target URL salah.
    - `unauthorized` → endpoint dapat dijangkau, tetapi autentikasi salah.

  </Accordion>
  <Accordion title="2. Batasan pengikatan dan autentikasi lebih ketat">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Hal yang perlu diperiksa:

    - Pengikatan non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur autentikasi gateway yang valid: autentikasi token/kata sandi bersama, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
    - Kunci lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

    Indikasi umum:

    - `refusing to bind gateway ... without auth` → pengikatan non-loopback tanpa jalur autentikasi gateway yang valid.
    - `Connectivity probe: failed` saat runtime berjalan → gateway aktif, tetapi tidak dapat diakses dengan autentikasi/URL saat ini.

  </Accordion>
  <Accordion title="3. Status pemasangan dan identitas perangkat berubah">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Hal yang perlu diperiksa:

    - Persetujuan perangkat yang tertunda untuk dasbor/node.
    - Persetujuan pemasangan DM yang tertunda setelah perubahan kebijakan atau identitas.

    Indikasi umum:

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
- [Eksekusi latar belakang dan alat proses](/id/gateway/background-process)
- [Pemasangan Node](/id/gateway/pairing)

## Terkait

- [Doctor](/id/gateway/doctor)
- [Tanya jawab umum](/id/help/faq)
- [Panduan operasional Gateway](/id/gateway)
