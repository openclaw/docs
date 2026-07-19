---
read_when:
    - Pusat pemecahan masalah mengarahkan Anda ke sini untuk diagnosis lebih lanjut
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
sidebarTitle: Troubleshooting
summary: Panduan pemecahan masalah mendalam untuk Gateway, channel, otomatisasi, Node, dan browser
title: Pemecahan Masalah
x-i18n:
    generated_at: "2026-07-19T05:08:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 104d84b73305cb1290562c5045e0733611f5d9c42be064773c288429604da7f4
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ini adalah runbook mendalam. Mulailah dari [/help/troubleshooting](/id/help/troubleshooting) untuk menjalankan alur triase cepat terlebih dahulu.

## Urutan perintah

Jalankan dengan urutan berikut:

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

- `Update restart` di `openclaw status` / `openclaw status --all`. Serah terima yang tertunda atau gagal menyertakan perintah berikutnya yang harus dijalankan.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` di bagian Channel: konfigurasi channel masih ada, tetapi pendaftaran plugin gagal sebelum channel dapat dimuat.
- 401 dari penyedia setelah autentikasi ulang: `openclaw doctor --fix` memeriksa bayangan autentikasi OAuth per agen yang kedaluwarsa dan menghapus salinan lama agar semua agen menggunakan profil bersama saat ini.

## Instalasi yang terpisah dan perlindungan konfigurasi yang lebih baru

Gunakan ketika layanan Gateway tiba-tiba berhenti setelah pembaruan, atau log menunjukkan satu biner `openclaw` lebih lama daripada versi yang terakhir menulis `openclaw.json`.

OpenClaw menandai penulisan konfigurasi dengan `meta.lastTouchedVersion`. Perintah hanya-baca dapat memeriksa konfigurasi yang ditulis oleh OpenClaw versi lebih baru, tetapi mutasi proses dan layanan tidak dapat dijalankan dari biner yang lebih lama. Tindakan yang diblokir: memulai/menghentikan/memulai ulang/menghapus instalasi layanan Gateway, memaksa instalasi ulang layanan, memulai Gateway dalam mode layanan, dan pembersihan port `gateway --force`.

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
  <Step title="Hapus wrapper kedaluwarsa">
    Hapus paket sistem kedaluwarsa atau entri wrapper lama yang masih mengarah ke biner `openclaw` versi lama.
  </Step>
</Steps>

<Warning>
Khusus untuk penurunan versi yang disengaja atau pemulihan darurat, atur `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` untuk satu perintah tersebut. Biarkan tidak diatur untuk operasi normal.
</Warning>

## Ketidakcocokan protokol setelah rollback

Gunakan ketika log terus mencetak `protocol mismatch` setelah penurunan versi atau rollback. Gateway yang lebih lama sedang berjalan, tetapi proses klien lokal yang lebih baru masih mencoba terhubung kembali dengan rentang protokol yang tidak didukung oleh Gateway lama.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Periksa:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` dalam log Gateway.
- `Established clients:` di `openclaw gateway status --deep` atau `Gateway clients` di `openclaw doctor --deep`: klien TCP aktif yang terhubung ke port Gateway, beserta PID dan baris perintah jika diizinkan oleh OS.
- Proses klien yang baris perintahnya mengarah ke instalasi atau wrapper OpenClaw lebih baru yang menjadi asal rollback.

Perbaikan:

1. Hentikan atau mulai ulang proses klien OpenClaw kedaluwarsa yang ditampilkan oleh `gateway status --deep`.
2. Mulai ulang aplikasi atau wrapper yang menyematkan OpenClaw: dasbor lokal, editor, pembantu server aplikasi, atau shell `openclaw logs --follow` yang berjalan lama.
3. Jalankan kembali `openclaw gateway status --deep` atau `openclaw doctor --deep` dan pastikan PID klien kedaluwarsa sudah tidak ada.

Jangan membuat Gateway lama menerima protokol baru yang tidak kompatibel. Peningkatan protokol melindungi kontrak komunikasi; pemulihan rollback merupakan masalah pembersihan proses/versi.

## Symlink Skills dilewati karena keluar dari jalur

Gunakan ketika log berisi:

```text
Melewati jalur skill yang keluar dari root yang dikonfigurasi: ... reason=symlink-escape
```

Setiap root skill merupakan batas penahanan. Symlink di bawah `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`, atau `~/.openclaw/skills` dilewati ketika target sebenarnya mengarah ke luar root tersebut, kecuali target dipercaya secara eksplisit.

Periksa tautan:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Jika target memang disengaja, konfigurasikan root skill langsung dan target symlink yang diizinkan:

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

Kemudian mulai sesi baru atau tunggu pemantau Skills melakukan penyegaran. Mulai ulang Gateway jika proses yang berjalan dimulai sebelum perubahan konfigurasi.

Jangan gunakan target luas seperti `~`, `/`, atau seluruh folder proyek yang disinkronkan. Batasi `allowSymlinkTargets` pada root skill sebenarnya yang berisi direktori `SKILL.md` tepercaya.

Jika penerapan Skill Workshop juga harus menulis melalui jalur skill ruang kerja bersymlink tepercaya tersebut, aktifkan `skills.workshop.allowSymlinkTargetWrites`. Biarkan tetap dinonaktifkan untuk root skill bersama yang hanya-baca.

Terkait:

- [Konfigurasi Skills](/id/tools/skills-config#symlinked-skill-roots)
- [Contoh konfigurasi](/id/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Penggunaan tambahan Anthropic 429 diperlukan untuk konteks panjang

Gunakan ketika log/kesalahan berisi: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Periksa:

- Model Anthropic yang dipilih adalah model Claude 4.x berkemampuan GA dengan 1M konteks (Opus 4.6/4.7/4.8, Sonnet 4.6), atau konfigurasi model masih berisi `params.context1m: true` lama.
- Kredensial Anthropic saat ini tidak memenuhi syarat untuk penggunaan konteks panjang.
- Permintaan hanya gagal pada sesi panjang/proses model yang memerlukan jalur konteks 1M.

Opsi perbaikan:

<Steps>
  <Step title="Gunakan jendela konteks standar">
    Beralihlah ke model dengan jendela standar, atau hapus `context1m` lama dari
    konfigurasi model lama yang tidak berkemampuan GA untuk konteks 1M.
  </Step>
  <Step title="Gunakan kredensial yang memenuhi syarat">
    Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralihlah ke kunci API Anthropic.
  </Step>
  <Step title="Konfigurasikan model fallback">
    Konfigurasikan model fallback agar proses tetap berlanjut ketika permintaan konteks panjang Anthropic ditolak.
  </Step>
</Steps>

Terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan dan biaya token](/id/reference/token-use)
- [Mengapa saya melihat HTTP 429 dari Anthropic?](/id/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Respons 403 yang diblokir upstream

Gunakan ketika penyedia LLM upstream mengembalikan `403` generik seperti `Your request was blocked`.

Jangan berasumsi bahwa ini selalu merupakan masalah konfigurasi OpenClaw. Respons tersebut dapat berasal dari lapisan keamanan upstream seperti CDN, WAF, aturan pengelolaan bot, atau proksi terbalik di depan endpoint yang kompatibel dengan OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Periksa:

- Beberapa model dari penyedia yang sama gagal dengan cara yang sama.
- HTML atau teks keamanan generik alih-alih kesalahan API penyedia yang normal.
- Peristiwa keamanan di sisi penyedia untuk waktu permintaan yang sama.
- Probe `curl` langsung berukuran kecil berhasil, sedangkan permintaan normal berbentuk SDK gagal.

Perbaiki pemfilteran di sisi penyedia terlebih dahulu ketika bukti menunjukkan pemblokiran WAF/CDN. Utamakan aturan izin atau lewati dengan cakupan sempit untuk jalur API yang digunakan OpenClaw, dan hindari menonaktifkan perlindungan untuk seluruh situs.

<Warning>
Keberhasilan `curl` minimal tidak menjamin bahwa permintaan nyata bergaya SDK akan melewati lapisan keamanan upstream yang sama.
</Warning>

Terkait:

- [Endpoint yang kompatibel dengan OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)
- [Konfigurasi penyedia](/id/providers)
- [Log](/id/logging)

## Backend lokal yang kompatibel dengan OpenAI lolos probe langsung, tetapi proses agen gagal

Gunakan ketika:

- `curl ... /v1/models` berfungsi.
- Panggilan langsung `/v1/chat/completions` berukuran kecil berfungsi.
- Proses model OpenClaw hanya gagal pada giliran agen normal.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Periksa:

- Panggilan langsung berukuran kecil berhasil, tetapi proses OpenClaw hanya gagal pada prompt yang lebih besar.
- Kesalahan `model_not_found` atau 404 meskipun `/v1/chat/completions` langsung berfungsi dengan ID model polos yang sama.
- Kesalahan backend tentang `messages[].content` yang mengharapkan string.
- Peringatan `incomplete turn detected ... stopReason=stop payloads=0` yang berselang-seling pada backend lokal yang kompatibel dengan OpenAI.
- Backend mengalami crash yang hanya muncul dengan jumlah token prompt yang lebih besar atau prompt runtime agen lengkap.

<AccordionGroup>
  <Accordion title="Pola umum">
    - `model_not_found` dengan server lokal bergaya MLX/vLLM: pastikan `baseUrl` menyertakan `/v1`, `api` adalah `"openai-completions"` untuk backend `/v1/chat/completions`, dan `models.providers.<provider>.models[].id` adalah ID lokal penyedia polos. Pilih dengan awalan penyedia satu kali, misalnya `mlx/mlx-community/Qwen3-30B-A3B-6bit`; pertahankan entri katalog sebagai `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: backend menolak bagian konten Chat Completions terstruktur. Perbaikan: atur `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` atau kunci pesan yang diizinkan seperti `["role","content"]`: backend menolak metadata pemutaran ulang bergaya OpenAI pada pesan Chat Completions. Perbaikan: atur `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: backend menyelesaikan permintaan Chat Completions, tetapi tidak mengembalikan teks asisten yang terlihat oleh pengguna untuk giliran tersebut. OpenClaw mencoba ulang satu kali giliran kosong yang kompatibel dengan OpenAI dan aman untuk diputar ulang; kegagalan berulang biasanya berarti backend menghasilkan konten kosong/nonteks atau menyembunyikan teks jawaban akhir.
    - Permintaan langsung berukuran kecil berhasil, tetapi proses agen OpenClaw gagal karena crash backend/model (misalnya Gemma pada beberapa build `inferrs`): transportasi OpenClaw kemungkinan sudah benar; backend gagal menangani bentuk prompt runtime agen yang lebih besar.
    - Kegagalan berkurang setelah alat dinonaktifkan, tetapi tidak hilang: skema alat merupakan bagian dari beban, tetapi masalah yang tersisa tetap berupa kapasitas model/server upstream atau bug backend.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Atur `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya menerima string.
    2. Atur `compat.strictMessageKeys: true` untuk backend Chat Completions ketat yang hanya menerima `role` dan `content` pada setiap pesan.
    3. Atur `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani permukaan skema alat OpenClaw secara andal.
    4. Kurangi beban prompt jika memungkinkan: bootstrap ruang kerja yang lebih kecil, riwayat sesi yang lebih pendek, model lokal yang lebih ringan, atau backend dengan dukungan konteks panjang yang lebih kuat.
    5. Jika permintaan langsung berukuran kecil terus berhasil sementara giliran agen OpenClaw masih mengalami crash di dalam backend, perlakukan hal tersebut sebagai keterbatasan server/model upstream dan ajukan reproduksi di sana dengan bentuk payload yang diterima.
  </Accordion>
</AccordionGroup>

Terkait:

- [Konfigurasi](/id/gateway/configuration)
- [Model lokal](/id/gateway/local-models)
- [Endpoint yang kompatibel dengan OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)

## Tidak ada balasan

Jika saluran aktif tetapi tidak ada yang merespons, periksa perutean dan kebijakan sebelum menghubungkan kembali apa pun.

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
- Ketidakcocokan daftar izin saluran/grup.

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
- Ketidakcocokan mode autentikasi/token antara klien dan Gateway.
- Penggunaan HTTP saat identitas perangkat diperlukan.

Jika peramban lokal tidak dapat terhubung ke `127.0.0.1:18789` setelah pembaruan, pulihkan layanan Gateway lokal terlebih dahulu dan pastikan layanan tersebut menyajikan dasbor:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Jika `curl` mengembalikan HTML OpenClaw, Gateway berfungsi dan masalah yang tersisa kemungkinan adalah cache peramban, tautan dalam lama, atau status tab yang sudah usang. Buka `http://127.0.0.1:18789` secara langsung dan lakukan navigasi dari dasbor. Jika layanan tidak tetap berjalan setelah dimulai ulang, jalankan `openclaw gateway start` dan periksa kembali `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Pola koneksi/autentikasi">
    - `device identity required` → konteks tidak aman atau autentikasi perangkat tidak tersedia.
    - `origin not allowed` → `Origin` peramban tidak ada dalam `gateway.controlUi.allowedOrigins` (atau Anda terhubung dari origin peramban non-loopback tanpa daftar izin eksplisit).
    - `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan alur autentikasi perangkat berbasis tantangan (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah (atau stempel waktu usang) untuk handshake saat ini.
    - `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu percobaan ulang tepercaya menggunakan token perangkat yang disimpan dalam cache.
    - Percobaan ulang dengan token dalam cache tersebut menggunakan kembali kumpulan cakupan dalam cache yang disimpan bersama token perangkat terpasang. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap menggunakan kumpulan cakupan yang dimintanya.
    - `AUTH_SCOPE_MISMATCH` → token perangkat dikenali, tetapi cakupan yang disetujuinya tidak mencakup permintaan koneksi ini; pasang ulang atau setujui kontrak cakupan yang diminta alih-alih merotasi token Gateway bersama.
    - Di luar jalur percobaan ulang tersebut, urutan prioritas autentikasi koneksi adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, kemudian token perangkat tersimpan, lalu token bootstrap.
    - Pada jalur UI Kontrol Tailscale Serve asinkron, percobaan yang gagal untuk `{scope, ip}` yang sama diserialkan sebelum pembatas mencatat kegagalan. Karena itu, dua percobaan ulang buruk secara bersamaan dari klien yang sama dapat menampilkan `retry later` pada percobaan kedua, bukan dua ketidakcocokan biasa.
    - `too many failed authentication attempts (retry later)` dari klien loopback dengan origin peramban → kegagalan berulang dari `Origin` ternormalisasi yang sama dikunci sementara; origin localhost lain menggunakan bucket terpisah.
    - `unauthorized` berulang setelah percobaan ulang tersebut → token bersama/token perangkat tidak sinkron; segarkan konfigurasi token dan setujui ulang/rotasi token perangkat jika diperlukan.
    - `gateway connect failed:` → target host/port/URL salah.

  </Accordion>
</AccordionGroup>

### Peta ringkas kode detail autentikasi

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                  | Arti                                                                                                                                                                                      | Tindakan yang disarankan                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim token bersama yang diwajibkan.                                                                                                                                                 | Tempelkan/tetapkan token di klien dan coba lagi. Untuk jalur dasbor: `openclaw config get gateway.auth.token`, lalu tempelkan ke pengaturan UI Kontrol.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Token bersama tidak cocok dengan token autentikasi Gateway.                                                                                                                                               | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang dengan token dalam cache menggunakan kembali cakupan tersimpan yang telah disetujui; pemanggil `deviceToken` / `scopes` eksplisit tetap menggunakan cakupan yang diminta. Jika masih gagal, jalankan [daftar periksa pemulihan ketidaksinkronan token](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per perangkat dalam cache sudah usang atau dicabut.                                                                                                                                                 | Rotasi/setujui ulang token perangkat menggunakan [CLI perangkat](/id/cli/devices), lalu hubungkan kembali.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Token perangkat valid, tetapi peran/cakupan yang disetujuinya tidak mencakup permintaan koneksi ini.                                                                                                       | Pasang ulang perangkat atau setujui kontrak cakupan yang diminta; jangan perlakukan ini sebagai ketidaksinkronan token bersama.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Identitas perangkat memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` jika tersedia. | Setujui permintaan tertunda: `openclaw devices list`, lalu `openclaw devices approve <requestId>`. Peningkatan cakupan/peran menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                                               |

<Note>
RPC backend loopback langsung yang diautentikasi dengan token/kata sandi Gateway bersama tidak boleh bergantung pada dasar cakupan perangkat terpasang milik CLI. Jika subagen atau panggilan internal lain masih gagal dengan `scope-upgrade`, pastikan pemanggil menggunakan `client.id: "gateway-client"` dan `client.mode: "backend"` serta tidak memaksakan `deviceIdentity` eksplisit atau token perangkat.
</Note>

Pemeriksaan migrasi autentikasi perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan kesalahan nonce/tanda tangan, perbarui klien yang terhubung dan verifikasi:

<Steps>
  <Step title="Tunggu connect.challenge">
    Klien menunggu `connect.challenge` yang diterbitkan Gateway.
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
- `openclaw devices rotate --scope ...` hanya dapat meminta cakupan operator yang sudah dimiliki sesi pemanggil.

Terkait:

- [Konfigurasi](/id/gateway/configuration) (mode autentikasi Gateway)
- [UI Kontrol](/id/web/control-ui)
- [Perangkat](/id/cli/devices)
- [Akses jarak jauh](/id/gateway/remote)
- [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth)

## Layanan Gateway tidak berjalan

Gunakan saat layanan sudah diinstal tetapi proses tidak tetap berjalan.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga pindai layanan tingkat sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk penghentian.
- Ketidakcocokan konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Pola umum">
    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode Gateway lokal tidak diaktifkan, atau file konfigurasi tertimpa dan kehilangan `gateway.mode`. Perbaikan: tetapkan `gateway.mode="local"` dalam konfigurasi Anda, atau jalankan kembali `openclaw onboard --mode local` / `openclaw setup` untuk menetapkan ulang konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, jalur konfigurasi default adalah `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → pengikatan non-loopback tanpa jalur autentikasi Gateway yang valid (token/kata sandi, atau proksi tepercaya jika dikonfigurasi).
    - `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
    - `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks yang usang atau paralel masih ada. Sebagian besar penyiapan sebaiknya mempertahankan satu Gateway per mesin; jika Anda memang memerlukan lebih dari satu, isolasikan port + konfigurasi/status/ruang kerja. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` dari doctor → unit sistem systemd tersedia sementara layanan tingkat pengguna tidak ada. Hapus atau nonaktifkan duplikat tersebut sebelum mengizinkan doctor menginstal layanan pengguna, atau tetapkan `OPENCLAW_SERVICE_REPAIR_POLICY=external` jika unit sistem tersebut adalah supervisor yang dimaksudkan.
    - `Gateway service port does not match current gateway config` → supervisor yang terinstal masih menyematkan `--port` lama. Jalankan `openclaw doctor --fix` atau `openclaw gateway install --force`, lalu mulai ulang layanan Gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Eksekusi latar belakang dan alat proses](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Doctor](/id/gateway/doctor)

## Gateway macOS diam-diam berhenti merespons, lalu kembali merespons saat Anda menyentuh dasbor

Gunakan saat saluran (Telegram, WhatsApp, dll.) pada host macOS tidak merespons selama beberapa menit hingga beberapa jam, dan Gateway tampak kembali aktif tepat ketika Anda membuka Control UI, masuk melalui SSH, atau berinteraksi dengan host dengan cara lain. Biasanya tidak ada gejala yang jelas dalam `openclaw status` karena saat Anda memeriksanya, Gateway sudah aktif kembali.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Periksa adanya:

- Satu atau beberapa bundel `*-uncaught_exception.json` dalam `~/.openclaw/logs/stability/` dengan `error.code` yang ditetapkan ke kode jaringan sementara seperti `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH`, atau `ECONNREFUSED`.
- Baris `pmset -g log` seperti `Entering Sleep state due to 'Maintenance Sleep'` atau `en0 driver is slow (msg: WillChangeState to 0)` yang waktunya bertepatan dengan stempel waktu crash. Power Nap / Maintenance Sleep secara singkat menempatkan driver Wi-Fi dalam status 0; setiap `connect()` keluar yang terjadi dalam interval tersebut dapat gagal dengan `ENETDOWN`, bahkan pada host yang selain itu memiliki konektivitas jaringan penuh.
- Keluaran `launchctl print` yang menampilkan `state = not running` dengan beberapa `runs` terbaru dan kode keluar, terutama ketika jeda antara crash dan peluncuran berikutnya berlangsung sekitar satu jam, bukan beberapa detik. launchd macOS menerapkan gerbang perlindungan respawn yang tidak terdokumentasi setelah serangkaian crash, yang dapat berhenti mematuhi `KeepAlive=true` hingga pemicu eksternal seperti login interaktif, koneksi dasbor, atau `launchctl kickstart` mengaktifkannya kembali.

Ciri umum:

- Bundel stabilitas dengan `error.code` berupa `ENETDOWN` atau kode terkait, dengan tumpukan panggilan mengarah ke Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` dan yang lebih baru mengklasifikasikan ini sebagai kesalahan jaringan sementara yang tidak berbahaya sehingga tidak lagi diteruskan ke penangan tingkat atas untuk pengecualian yang tidak tertangkap; jika Anda menggunakan rilis lama, lakukan peningkatan terlebih dahulu.
- Periode tidak aktif yang panjang dan berakhir seketika saat Anda terhubung ke Control UI atau masuk ke host melalui SSH: aktivitas yang terlihat oleh pengguna itulah yang mengaktifkan kembali gerbang respawn launchd, bukan tindakan apa pun yang dilakukan dasbor terhadap Gateway.
- Jumlah `runs` bertambah sepanjang hari tanpa baris `received SIG*; shutting down` yang sesuai dalam `~/Library/Logs/openclaw/gateway.log`: penghentian normal mencatat sinyal; crash sementara tidak.

Yang harus dilakukan:

1. **Tingkatkan Gateway** jika Anda menjalankan rilis sebelum `2026.5.26`. Setelah peningkatan, kesalahan `ENETDOWN` berikutnya dicatat sebagai peringatan alih-alih menghentikan proses.
2. **Kurangi aktivitas tidur pemeliharaan** pada host Mac mini / desktop yang ditujukan untuk beroperasi sebagai server yang selalu aktif:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Ini secara signifikan mengurangi, tetapi tidak sepenuhnya menghilangkan, gangguan driver yang mendasarinya. Sistem masih dapat melakukan beberapa tidur pemeliharaan untuk TCP keepalive dan pemeliharaan mDNS terlepas dari flag tersebut.

3. **Tambahkan pengawas keaktifan** agar serangkaian crash mendatang yang dihentikan oleh launchd dapat dideteksi dengan cepat:

   ```bash
   # Contoh pemeriksaan keaktifan yang memahami launchd, cocok untuk Cron atau LaunchAgent setiap 5 menit
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Tujuannya adalah mengaktifkan kembali gerbang respawn secara eksternal; `KeepAlive=true` saja tidak memadai pada macOS setelah serangkaian crash.

Terkait:

- [Catatan platform macOS](/id/platforms/macos)
- [Pencatatan log](/id/logging)
- [Doctor](/id/gateway/doctor)

## Loop supervisor launchd macOS dengan LaunchAgent Gateway/Node duplikat

Gunakan ini ketika instalasi macOS terus dimulai ulang setiap beberapa detik, pemeriksaan kesehatan `openclaw`
bergantian antara sehat dan tidak tersedia, serta pengiriman saluran terhenti
meskipun layanan tampak berjalan.

Hal ini diamati pada instalasi lama ketika LaunchAgent `ai.openclaw.gateway` dan
`ai.openclaw.node` sama-sama aktif dan masing-masing menyuntikkan
`OPENCLAW_LAUNCHD_LABEL`. Dalam kondisi tersebut, OpenClaw dapat mendeteksi supervisi
launchd, mencoba menyerahkan kembali proses mulai ulang kepada launchd, lalu terjebak dalam loop
`EADDRINUSE`/respawn yang cepat alih-alih menjalankan satu proses Gateway yang stabil.

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

Periksa adanya:

- Lebih dari satu PID Gateway selama sampel 30 detik, bukan satu
  proses yang stabil.
- `EADDRINUSE`, `another gateway instance is already listening`, atau baris
  mulai ulang/serah-terima berulang dalam `gateway.log`.
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

2. Instal pembungkus Gateway persisten yang menghapus penanda launchd
   yang diwariskan sebelum memulai OpenClaw. Gunakan opsi `--wrapper` yang didukung; jangan
   mengedit berkas yang dihasilkan dalam `~/.openclaw/service-env/`, karena penginstalan ulang layanan,
   pembaruan, dan perbaikan Doctor akan menghasilkan ulang berkas tersebut:

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

   `gateway install` mempertahankan jalur pembungkus selama penginstalan ulang paksa,
   pembaruan, dan perbaikan doctor.

3. Pastikan Gateway stabil dan melayani RPC, bukan sekadar mendengarkan:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   Sampel PID seharusnya menunjukkan satu proses stabil, bukan sekumpulan
   PID yang terus berganti, dan pengiriman saluran masuk seharusnya kembali berjalan.

4. Setelah meningkatkan ke rilis yang telah memperbaiki loop dual-LaunchAgent
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

Gunakan ketika Gateway menghilang saat berada di bawah beban, pengawas melaporkan mulai ulang bergaya OOM, atau log menyebutkan `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Cari:

- `Reason: diagnostic.memory.pressure.critical` dalam bundel stabilitas terbaru.
- `Memory pressure:` dengan `critical/rss_threshold`, `critical/heap_threshold`, atau `critical/rss_growth`.
- Nilai `V8 heap:` yang mendekati batas heap.
- Entri `Largest session files:` seperti `agents/<agent>/sessions/<session>.jsonl` atau `sessions/<session>.jsonl`.
- Penghitung memori cgroup Linux ketika Gateway berjalan di dalam kontainer atau layanan dengan memori terbatas.

Ciri-ciri umum:

- `critical memory pressure bundle written` muncul sesaat sebelum mulai ulang → OpenClaw merekam bundel stabilitas pra-OOM. Periksa dengan `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` muncul dalam log Gateway → OpenClaw mendeteksi tekanan memori kritis, tetapi snapshot stabilitas pra-OOM dinonaktifkan.
- `Largest session files:` menunjuk ke jalur transkrip tersunting yang sangat besar → kurangi riwayat sesi yang dipertahankan, periksa pertumbuhan sesi, atau pindahkan transkrip lama dari penyimpanan aktif sebelum memulai ulang.
- Byte terpakai `V8 heap:` mendekati batas heap → turunkan tekanan prompt/sesi atau kurangi pekerjaan bersamaan terlebih dahulu. Untuk layanan terkelola, periksa `Gateway heap:` dalam `openclaw gateway status`; jika tertulis `not set`, buat ulang metadata layanan lama dengan `openclaw gateway install --force`. `NODE_OPTIONS` dari shell sekitar sengaja diabaikan. Gunakan penggantian batas heap secara eksplisit pada tingkat pengawas hanya setelah mengonfirmasi beban kerja berkelanjutan dan menyisakan ruang memori native yang cukup.
- `Memory pressure: critical/rss_growth` → memori meningkat dengan cepat dalam satu jendela pengambilan sampel. Periksa log terbaru untuk impor besar, keluaran alat yang tidak terkendali, percobaan ulang berulang, atau sekumpulan pekerjaan agen dalam antrean.
- Tekanan memori kritis muncul dalam log tetapi tidak ada bundel → ini adalah perilaku bawaan. Tetapkan `diagnostics.memoryPressureSnapshot: true` untuk merekam bundel stabilitas pra-OOM pada peristiwa tekanan memori kritis mendatang.

Bundel stabilitas tidak memuat payload. Bundel ini mencakup bukti operasional memori dan jalur file relatif yang disunting, bukan teks pesan, isi webhook, kredensial, token, cookie, atau ID sesi mentah. Lampirkan ekspor diagnostik ke laporan bug alih-alih menyalin log mentah.

Terkait:

- [Kesehatan Gateway](/id/gateway/health)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Sesi](/id/cli/sessions)

## Gateway menolak konfigurasi yang tidak valid

Gunakan ketika Gateway gagal dimulai dengan `Invalid config` atau log pemuatan ulang langsung menyatakan bahwa pengeditan yang tidak valid dilewati.

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
- File `openclaw.json.rejected.*` bertanda waktu di sebelah konfigurasi aktif.
- File `openclaw.json.clobbered.*` bertanda waktu jika `doctor --fix` memperbaiki pengeditan langsung yang rusak.
- OpenClaw menyimpan 32 file `.clobbered.*` terbaru untuk setiap jalur konfigurasi dan merotasi file yang lebih lama.

<AccordionGroup>
  <Accordion title="Apa yang terjadi">
    - Konfigurasi gagal divalidasi saat memulai, memuat ulang langsung, atau melakukan penulisan milik OpenClaw.
    - Proses memulai Gateway gagal secara tertutup alih-alih menulis ulang `openclaw.json`.
    - Pemuatan ulang langsung melewati pengeditan eksternal yang tidak valid dan mempertahankan konfigurasi runtime saat ini tetap aktif.
    - Penulisan milik OpenClaw menolak payload yang tidak valid/destruktif sebelum commit dan menyimpan `.rejected.*`.
    - `openclaw doctor --fix` menangani perbaikan. Fitur ini dapat menghapus prefiks non-JSON atau memulihkan salinan terakhir yang diketahui baik sambil mempertahankan payload yang ditolak sebagai `.clobbered.*`.
    - Ketika banyak perbaikan terjadi untuk satu jalur konfigurasi, OpenClaw merotasi file `.clobbered.*` yang lebih lama agar payload terbaru yang diperbaiki tetap tersedia.

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
  <Accordion title="Ciri-ciri umum">
    - `.clobbered.*` ada → doctor mempertahankan hasil edit eksternal yang rusak sambil memperbaiki konfigurasi aktif.
    - `.rejected.*` ada → penulisan konfigurasi milik OpenClaw gagal dalam pemeriksaan skema atau penimpaan sebelum commit.
    - `Config write rejected:` → penulisan mencoba menghapus struktur yang diwajibkan, memperkecil berkas secara drastis, atau menyimpan konfigurasi yang tidak valid.
    - `config reload skipped (invalid config):` → pengeditan langsung gagal divalidasi dan diabaikan oleh Gateway yang sedang berjalan.
    - `Invalid config at ...` → proses mulai gagal sebelum layanan Gateway dimulai.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → penulisan milik OpenClaw ditolak karena kehilangan bidang atau ukuran dibandingkan dengan cadangan terakhir yang diketahui baik.
    - `Config last-known-good promotion skipped` → kandidat berisi placeholder rahasia yang disamarkan seperti `***`.

  </Accordion>
  <Accordion title="Opsi perbaikan">
    1. Jalankan `openclaw doctor --fix` agar doctor memperbaiki konfigurasi berprefiks/tertimpa atau memulihkan versi terakhir yang diketahui baik.
    2. Salin hanya kunci yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
    3. Jalankan `openclaw config validate` sebelum memulai ulang.
    4. Jika mengedit secara manual, pertahankan konfigurasi JSON5 lengkap, bukan hanya objek parsial yang ingin diubah.
  </Accordion>
</AccordionGroup>

Terkait:

- [Konfigurasi](/id/cli/config)
- [Konfigurasi: pemuatan ulang langsung](/id/gateway/configuration#config-hot-reload)
- [Konfigurasi: validasi ketat](/id/gateway/configuration#strict-validation)
- [Doctor](/id/gateway/doctor)

## Peringatan pemeriksaan Gateway

Gunakan ketika `openclaw gateway probe` berhasil menjangkau sesuatu, tetapi masih menampilkan blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` dalam keluaran JSON.
- Apakah peringatan berkaitan dengan fallback SSH, beberapa Gateway, cakupan yang tidak tersedia, atau referensi autentikasi yang belum terselesaikan.

Ciri-ciri umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target langsung yang dikonfigurasi/loopback.
- `multiple reachable gateway identities detected` → Gateway yang berbeda merespons, atau OpenClaw tidak dapat membuktikan bahwa target yang dapat dijangkau adalah Gateway yang sama. Terowongan SSH, URL proksi, atau URL jarak jauh yang dikonfigurasi menuju Gateway yang sama diperlakukan sebagai satu Gateway dengan beberapa transportasi, meskipun port transportasinya berbeda.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi RPC detail dibatasi oleh cakupan; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → koneksi berhasil, tetapi seluruh rangkaian RPC diagnostik mengalami batas waktu atau gagal. Perlakukan ini sebagai Gateway yang dapat dijangkau dengan diagnostik yang terdegradasi; bandingkan `connect.ok` dan `connect.rpcOk` dalam keluaran `--json`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → Gateway merespons, tetapi klien ini masih memerlukan pemasangan/persetujuan sebelum akses operator normal.
- Teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang belum terselesaikan → materi autentikasi tidak tersedia dalam jalur perintah ini untuk target yang gagal.

Terkait:

- [Gateway](/id/cli/gateway)
- [Beberapa Gateway pada host yang sama](/id/gateway#multiple-gateways-same-host)
- [Akses jarak jauh](/id/gateway/remote)

## Kanal terhubung, tetapi pesan tidak mengalir

Jika status kanal terhubung tetapi aliran pesan terhenti, fokuskan pada kebijakan, izin, dan aturan pengiriman khusus kanal.

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
- Izin/cakupan API kanal yang tidak tersedia.

Ciri-ciri umum:

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
  <Accordion title="Ciri-ciri umum">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron dinonaktifkan.
    - `cron: timer tick failed` → detak penjadwal gagal; periksa galat berkas/log/runtime.
    - `heartbeat skipped` dengan `reason=quiet-hours` → berada di luar rentang jam aktif.
    - `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi struktur awal kosong, komentar, header, fence, atau daftar periksa kosong, sehingga OpenClaw melewati pemanggilan model.
    - `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada detak ini.
    - `heartbeat: unknown accountId` → ID akun tidak valid untuk target pengiriman Heartbeat.
    - `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat ditetapkan ke tujuan bergaya DM saat `agents.defaults.heartbeat.directPolicy` (atau penggantian per agen) diatur ke `block`.

  </Accordion>
</AccordionGroup>

Terkait:

- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [Tugas terjadwal: pemecahan masalah](/id/automation/cron-jobs#troubleshooting)

## Node terpasang, alat gagal

Jika Node telah dipasangkan tetapi alat gagal, isolasi status latar depan, izin, dan persetujuan.

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
- Status persetujuan eksekusi dan daftar yang diizinkan.

Ciri-ciri umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi Node harus berada di latar depan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS tidak tersedia.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan eksekusi tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh daftar yang diizinkan.

Terkait:

- [Persetujuan eksekusi](/id/tools/exec-approvals)
- [Pemecahan masalah Node](/id/nodes/troubleshooting)
- [Node](/id/nodes/index)

## Alat peramban gagal

Gunakan ketika tindakan alat peramban gagal meskipun Gateway itu sendiri dalam kondisi sehat.

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
  <Accordion title="Ciri-ciri Plugin / berkas eksekusi">
    - `unknown command "browser"` atau `unknown command 'browser'` → Plugin peramban bawaan dikecualikan oleh `plugins.allow`.
    - Alat peramban tidak ada / tidak tersedia saat `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga Plugin tidak pernah dimuat.
    - `Failed to start Chrome CDP on port` → proses peramban gagal diluncurkan.
    - `browser.executablePath not found` → jalur yang dikonfigurasi tidak valid.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang tidak valid atau berada di luar rentang.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi Gateway saat ini tidak memiliki dependensi runtime peramban inti; instal ulang atau perbarui OpenClaw, lalu mulai ulang Gateway. Snapshot ARIA dan tangkapan layar halaman dasar masih dapat berfungsi, tetapi navigasi, snapshot AI, tangkapan layar elemen dengan selektor CSS, dan ekspor PDF tetap tidak tersedia.

  </Accordion>
  <Accordion title="Ciri-ciri Chrome MCP / sesi yang sudah ada">
    - `Could not find DevToolsActivePort for chrome` → sesi yang sudah ada di Chrome MCP belum dapat dilampirkan ke direktori data peramban yang dipilih. Buka halaman inspeksi peramban, aktifkan debugging jarak jauh, biarkan peramban tetap terbuka, setujui permintaan pelampiran pertama, lalu coba lagi. Jika status masuk tidak diperlukan, gunakan profil `openclaw` terkelola.
    - `No browser tabs found for profile="user"` → profil pelampiran Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP jarak jauh yang dikonfigurasi tidak dapat dijangkau dari host Gateway.
    - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil khusus pelampiran tidak memiliki target yang dapat dijangkau, atau endpoint HTTP merespons tetapi WebSocket CDP tetap tidak dapat dibuka.

  </Accordion>
  <Accordion title="Ciri-ciri elemen / tangkapan layar / unggahan">
    - `fullPage is not supported for element screenshots` → permintaan tangkapan layar mencampurkan `--full-page` dengan `--ref` atau `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → pemanggilan tangkapan layar Chrome MCP / `existing-session` harus menggunakan pengambilan halaman atau `--ref` snapshot, bukan `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook unggahan Chrome MCP memerlukan referensi snapshot, bukan selektor CSS.
    - `existing-session file uploads currently support one file at a time.` → kirim satu unggahan per pemanggilan pada profil Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung penggantian batas waktu.
    - `existing-session type does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:type` pada profil sesi yang sudah ada `profile="user"` / Chrome MCP, atau gunakan profil peramban terkelola/CDP ketika batas waktu khusus diperlukan.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` tetap memerlukan peramban terkelola atau profil CDP mentah.
    - Penggantian viewport / mode gelap / lokal / luring yang kedaluwarsa pada profil khusus pelampiran atau CDP jarak jauh → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa memulai ulang seluruh Gateway.

  </Accordion>
</AccordionGroup>

Terkait:

- [Peramban (dikelola OpenClaw)](/id/tools/browser)
- [Pemecahan masalah peramban](/id/tools/browser-linux-troubleshooting)

## Jika Anda melakukan peningkatan dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah peningkatan disebabkan oleh penyimpangan konfigurasi atau default lebih ketat yang kini diberlakukan.

<AccordionGroup>
  <Accordion title="1. Perilaku autentikasi dan penggantian URL telah berubah">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Hal yang perlu diperiksa:

    - Jika `gateway.mode=remote`, panggilan CLI mungkin menargetkan layanan jarak jauh sementara layanan lokal Anda tidak bermasalah.
    - Panggilan `--url` eksplisit tidak beralih menggunakan kredensial tersimpan.

    Indikasi umum:

    - `gateway connect failed:` → target URL salah.
    - `unauthorized` → endpoint dapat dijangkau, tetapi autentikasi salah.

  </Accordion>
  <Accordion title="2. Pembatasan pengikatan dan autentikasi lebih ketat">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Hal yang perlu diperiksa:

    - Pengikatan non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur autentikasi Gateway yang valid: autentikasi token/kata sandi bersama, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
    - Kunci lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

    Indikasi umum:

    - `refusing to bind gateway ... without auth` → pengikatan non-loopback tanpa jalur autentikasi Gateway yang valid.
    - `Connectivity probe: failed` saat runtime sedang berjalan → Gateway aktif, tetapi tidak dapat diakses dengan autentikasi/URL saat ini.

  </Accordion>
  <Accordion title="3. Status pemasangan dan identitas perangkat telah berubah">
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
- [Tanya Jawab Umum](/id/help/faq)
- [Panduan operasional Gateway](/id/gateway)
