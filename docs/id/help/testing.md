---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan pengujian regresi untuk bug model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Perangkat pengujian: rangkaian pengujian unit/e2e/live, pelaksana Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-05-05T01:47:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga rangkaian Vitest (unit/integrasi, e2e, live) dan sekumpulan kecil
runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap rangkaian (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, sebelum push, debugging).
- Bagaimana pengujian live menemukan kredensial dan memilih model/provider.
- Bagaimana menambahkan regresi untuk masalah model/provider dunia nyata.

<Note>
**Stack QA (qa-lab, qa-channel, lane transport live)** didokumentasikan secara terpisah:

- [Ringkasan QA](/id/concepts/qa-e2e-automation) — arsitektur, permukaan perintah, penulisan skenario.
- [QA Matriks](/id/concepts/qa-matrix) — referensi untuk `pnpm openclaw qa matrix`.
- [QA channel](/id/channels/qa-channel) — Plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini membahas menjalankan rangkaian pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([runner khusus QA](#qa-specific-runners)) mencantumkan invocation `qa` konkret dan mengarahkan kembali ke referensi di atas.
</Note>

## Mulai cepat

Pada kebanyakan hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Menjalankan rangkaian penuh lokal lebih cepat di mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path ekstensi/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan menjalankan target tertentu terlebih dahulu saat Anda melakukan iterasi pada satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan tambahan:

- Gate cakupan: `pnpm test:coverage`
- Rangkaian E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Rangkaian live (model + probe alat/gambar Gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: dispatch `OpenClaw Performance` dengan
  `live_gpt54=true` untuk satu giliran agen `openai/gpt-5.4` nyata atau
  `deep_profile=true` untuk artefak CPU/heap/trace Kova. Jalankan terjadwal harian
  menerbitkan artefak lane mock-provider, deep-profile, dan GPT 5.4 ke
  `openclaw/clawgrit-reports` saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi. Laporan
  mock-provider juga mencakup angka boot Gateway tingkat sumber, memori,
  tekanan Plugin, hello-loop fake-model berulang, dan startup CLI.
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih sekarang menjalankan satu giliran teks ditambah probe kecil bergaya pembacaan file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan satu giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan provider.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan manual
    `OpenClaw Release Checks` sama-sama memanggil workflow live/E2E pakai ulang dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang di-shard berdasarkan provider.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret provider bersinyal tinggi baru ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan caller
    terjadwal/rilisnya.
- Smoke chat terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan lane live Docker terhadap path app-server Codex, mengikat DM Slack sintetis
    dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan attachment gambar
    dirutekan melalui binding Plugin native, bukan ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe gambar,
    MCP cron, sub-agent, dan Guardian. Nonaktifkan probe sub-agent dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan app-server Codex
    lainnya. Untuk pemeriksaan sub-agent terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agent kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in berlapis untuk permukaan perintah penyelamatan message-channel.
    Ini menjalankan `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/config.
- Smoke Docker perencana Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam container tanpa config dengan CLI Claude palsu di `PATH`
    dan memverifikasi fallback perencana fuzzy diterjemahkan menjadi penulisan config bertipe yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Memulai dari direktori status OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan penulisan setup/model/agent/Plugin Discord + SecretRef,
    memvalidasi config, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  yang terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya memerlukan satu kasus gagal, utamakan mempersempit pengujian live melalui variabel env allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah-perintah ini berada di samping rangkaian pengujian utama saat Anda memerlukan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. Paritas agentic berada di dalam
`QA-Lab - All Lanes` dan validasi rilis, bukan workflow PR mandiri.
Validasi luas sebaiknya menggunakan `Full Release Validation` dengan
`rerun_group=qa-parity` atau grup QA release-checks. Pemeriksaan rilis stable/default
menyimpan soak live/Docker menyeluruh di balik `run_release_soak=true`; profil
`full` memaksa soak aktif. `QA-Lab - All Lanes`
berjalan tiap malam di `main` dan dari dispatch manual dengan lane paritas mock, lane
Matrix live, lane Telegram live yang dikelola Convex, dan lane Discord live yang dikelola Convex
sebagai job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix
`--profile fast` secara eksplisit, sedangkan input workflow manual dan CLI Matrix
tetap default ke `all`; dispatch manual dapat melakukan shard `all` menjadi job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release
Checks` menjalankan paritas plus lane Matrix cepat dan Telegram sebelum persetujuan rilis,
menggunakan `mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap
deterministik dan menghindari startup provider-plugin normal. Gateway transport live ini
menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh rangkaian paritas
QA.

Shard media live rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit yang dipilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di mesin host.
  - Secara default menjalankan beberapa skenario terpilih secara paralel dengan
    pekerja Gateway terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    pekerja, atau `--concurrency 1` untuk jalur serial lama.
  - Menghasilkan kode keluar bukan nol saat skenario apa pun gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode penyedia `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server penyedia lokal berbasis AIMock untuk cakupan
    fixture dan mock protokol eksperimental tanpa menggantikan jalur
    `mock-openai` yang sadar skenario.
- `pnpm test:plugins:kitchen-sink-live`
  - Menjalankan rangkaian uji Plugin OpenAI Kitchen Sink langsung melalui QA Lab. Ini
    menginstal paket Kitchen Sink eksternal, memverifikasi inventaris permukaan SDK Plugin,
    memeriksa `/healthz` dan `/readyz`, merekam bukti CPU/RSS
    Gateway, menjalankan satu giliran OpenAI langsung, dan memeriksa diagnostik adversarial.
    Memerlukan autentikasi OpenAI langsung seperti `OPENAI_API_KEY`. Dalam sesi Testbox
    terhidrasi, ini otomatis memuat profil autentikasi langsung Testbox saat
    utilitas `openclaw-testbox-env` tersedia.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan benchmark startup Gateway plus paket skenario QA Lab tiruan kecil
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat direkam sebagai metrik
    tanpa terlihat seperti regresi Gateway yang terpaku pada beban tinggi selama beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu saat checkout belum
    memiliki output runtime segar.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan rangkaian QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
  - Menggunakan kembali flag pemilihan penyedia/model yang sama seperti `qa suite`.
  - Jalur langsung meneruskan input autentikasi QA yang didukung dan praktis untuk tamu:
    kunci penyedia berbasis variabel lingkungan, jalur konfigurasi penyedia langsung QA, dan `CODEX_HOME`
    saat ada.
  - Direktori output harus tetap berada di bawah root repo agar tamu dapat menulis balik melalui
    ruang kerja yang dipasang.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan penyiapan awal kunci API OpenAI noninteraktif, mengonfigurasi Telegram
    secara default, memverifikasi runtime Plugin terpaket dimuat tanpa perbaikan
    dependensi startup, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap
    endpoint OpenAI tiruan.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan jalur instalasi-terpaket
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan uji smoke Docker aplikasi terbangun yang deterministik untuk transkrip konteks
    runtime tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipertahankan sebagai
    pesan kustom non-tampilan alih-alih bocor ke giliran pengguna yang terlihat,
    lalu menanam JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke cabang aktif dengan cadangan.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan penyiapan awal paket terinstal,
    mengonfigurasi Telegram melalui CLI terinstal, lalu menggunakan kembali
    jalur QA Telegram langsung dengan paket terinstal tersebut sebagai Gateway SUT.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; atur
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah ditentukan alih-alih
    menginstal dari registri.
  - Menggunakan kredensial variabel lingkungan Telegram atau sumber kredensial Convex yang sama seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, atur
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan rahasia peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan rahasia peran Convex ada di CI,
    pembungkus Docker memilih Convex secara otomatis.
  - Pembungkus memvalidasi variabel lingkungan kredensial Telegram atau Convex pada host sebelum
    pekerjaan build/install Docker. Atur `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    hanya saat sengaja mendiagnosis penyiapan pra-kredensial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` mengganti
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk jalur ini.
  - GitHub Actions mengekspos jalur ini sebagai alur kerja maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat penggabungan. Alur kerja menggunakan
    lingkungan `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk yang dijalankan terpisah
  terhadap satu paket kandidat. Ini menerima ref tepercaya, spesifikasi npm terpublikasi,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari eksekusi lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  penjadwal E2E Docker yang ada dengan profil jalur smoke, paket, produk, penuh, atau kustom.
  Atur `telegram_mode=mock-openai` atau `live-frontier` untuk menjalankan
  alur kerja QA Telegram terhadap artefak `package-under-test` yang sama.
  - Bukti produk beta terbaru:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bukti URL tarball persis memerlukan digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Bukti artefak mengunduh artefak tarball dari eksekusi Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mengemas dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI dikonfigurasi, lalu mengaktifkan saluran/Plugin bawaan melalui edit
    konfigurasi.
  - Memverifikasi penemuan penyiapan membiarkan Plugin unduhan yang belum dikonfigurasi tetap absen,
    perbaikan doctor terkonfigurasi pertama menginstal setiap Plugin unduhan yang hilang
    secara eksplisit, dan restart kedua tidak menjalankan perbaikan dependensi
    tersembunyi.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi doctor pascapembaruan kandidat
    membersihkan sisa dependensi Plugin lawas tanpa perbaikan pascainstal
    di sisi kerangka uji.
- `pnpm test:parallels:npm-update`
  - Menjalankan uji smoke pembaruan instalasi-terpaket asli di seluruh tamu Parallels. Setiap
    platform terpilih terlebih dahulu menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` terinstal di tamu yang sama dan memverifikasi
    versi terinstal, status pembaruan, kesiapan Gateway, dan satu giliran agen
    lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    mengulang pengujian pada satu tamu. Gunakan `--json` untuk jalur artefak ringkasan dan
    status per jalur.
  - Jalur OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agen langsung secara
    default. Berikan `--model <provider/model>` atau atur
    `OPENCLAW_PARALLELS_OPENAI_MODEL` saat sengaja memvalidasi model
    OpenAI lain.
  - Bungkus eksekusi lokal yang lama dengan timeout pada host agar kemacetan transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log jalur bersarang di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap pembungkus luar macet.
  - Pembaruan Windows dapat menghabiskan 10 hingga 15 menit dalam pekerjaan doctor
    pascapembaruan dan pembaruan paket pada tamu yang baru dinyalakan; itu masih sehat saat log
    debug npm bersarang terus bergerak.
  - Jangan jalankan pembungkus agregat ini secara paralel dengan jalur smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi status VM dan dapat bertabrakan pada
    pemulihan snapshot, penyajian paket, atau status Gateway tamu.
  - Bukti pascapembaruan menjalankan permukaan Plugin bawaan normal karena
    fasad kemampuan seperti ucapan, pembuatan gambar, dan pemahaman media
    dimuat melalui API runtime bawaan bahkan saat giliran agen itu sendiri hanya
    memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server penyedia AIMock lokal untuk pengujian smoke protokol
    langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan jalur QA Matrix langsung terhadap homeserver Tuwunel sekali pakai berbasis Docker. Hanya checkout sumber — instalasi terpaket tidak mengirimkan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, variabel lingkungan, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan jalur QA Telegram langsung terhadap grup privat nyata menggunakan token bot driver dan SUT dari variabel lingkungan.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID obrolan Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial bersama dari kumpulan. Gunakan mode variabel lingkungan secara default, atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut memakai lease terkumpul.
  - Menghasilkan kode keluar bukan nol saat skenario apa pun gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda di grup privat yang sama, dengan bot SUT mengekspos nama pengguna Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Mode Komunikasi Bot-ke-Bot di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati lalu lintas bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak pesan-teramati di bawah `.artifacts/qa-e2e/...`. Skenario membalas mencakup RTT dari permintaan kirim driver hingga balasan SUT teramati.

Jalur transportasi langsung berbagi satu kontrak standar agar transportasi baru tidak menyimpang; matriks cakupan per jalur ada di [ikhtisar QA → cakupan transportasi langsung](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah rangkaian sintetis luas dan bukan bagian dari matriks itu.

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA Lab memperoleh lease eksklusif dari kumpulan berbasis Convex, mengirim Heartbeat
untuk lease itu selama jalur berjalan, dan melepas lease saat dimatikan.

Kerangka proyek Convex referensi:

- `qa/convex-credential-broker/`

Variabel lingkungan wajib:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu rahasia untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default variabel lingkungan: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, selain itu `maintainer`)

Variabel lingkungan opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID jejak opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex loopback `http://` untuk pengembangan lokal saja.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (pool add/remove/list) memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` secara khusus.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum live run untuk memeriksa URL situs Convex, secret broker,
prefiks endpoint, waktu habis HTTP, serta keterjangkauan admin/list tanpa mencetak
nilai secret. Gunakan `--json` untuk keluaran yang dapat dibaca mesin di skrip dan
utilitas CI.

Kontrak endpoint default (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Permintaan: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Berhasil: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Habis/dapat dicoba ulang: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Berhasil: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /release`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Berhasil: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /admin/add` (hanya secret maintainer)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (hanya secret maintainer)
  - Permintaan: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Penjaga lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya secret maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string id chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang salah bentuk.

### Menambahkan channel ke QA

Nama arsitektur dan helper skenario untuk adapter channel baru berada di [ikhtisar QA → Menambahkan channel](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` di manifes Plugin, pasang sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Rangkaian pengujian (apa yang berjalan di mana)

Anggap rangkaian ini sebagai “realisme yang meningkat” (dan flakiness/biaya yang meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: run tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi konfigurasi per proyek untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (autentikasi Gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture Plugin kecil yang dihasilkan, bukan
    API sumber Plugin bundled nyata. Pemuatan API Plugin nyata berada di
    rangkaian kontrak/integrasi milik Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses native root-project raksasa. Ini memangkas puncak RSS pada mesin yang terbebani dan mencegah pekerjaan auto-reply/extension membuat rangkaian yang tidak terkait kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan grafik proyek root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane tercakup terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup proyek root penuh.
    - `pnpm test:changed` secara default memperluas path git yang berubah menjadi lane tercakup murah: edit pengujian langsung, file saudara `*.test.ts`, pemetaan sumber eksplisit, dan dependen grafik impor lokal. Edit config/setup/package tidak menjalankan pengujian luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal cerdas normal untuk pekerjaan sempit. Ini mengklasifikasikan diff menjadi core, pengujian core, extensions, pengujian extension, apps, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan perintah typecheck, lint, dan guard yang sesuai. Ini tidak menjalankan pengujian Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian. Kenaikan versi yang hanya metadata rilis menjalankan pemeriksaan versi/config/root-dependency bertarget, dengan guard yang menolak perubahan package di luar field version tingkat atas.
    - Edit harness ACP Docker live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip auth Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependency, export, version, dan permukaan package lainnya tetap menggunakan guard yang lebih luas.
    - Pengujian unit ringan impor dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file yang stateful/berat runtime tetap berada di lane yang ada.
    - File sumber helper `plugin-sdk` dan `commands` tertentu juga memetakan run mode berubah ke pengujian saudara eksplisit di lane ringan tersebut, sehingga edit helper menghindari menjalankan ulang seluruh rangkaian berat untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya membagi subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket yang berat impor tidak menguasai seluruh ekor Node.
    - CI PR/main normal sengaja melewati sweep batch extension dan shard `agentic-plugins` khusus rilis. Validasi Rilis Penuh menjalankan workflow anak `Plugin Prerelease` terpisah untuk rangkaian yang berat Plugin/extension tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Saat Anda mengubah input penemuan message-tool atau konteks runtime compaction,
      pertahankan kedua tingkat coverage.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi
      murni.
    - Jaga rangkaian integrasi embedded runner tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Rangkaian tersebut memverifikasi bahwa id tercakup dan perilaku compaction tetap mengalir
      melalui path `run.ts` / `compact.ts` nyata; pengujian helper saja
      bukan pengganti yang memadai untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Konfigurasi dasar Vitest default ke `threads`.
    - Konfigurasi Vitest bersama menetapkan `isolate: false` dan menggunakan
      runner non-terisolasi di seluruh proyek root, e2e, dan config live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`, tetapi juga berjalan pada
      runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari konfigurasi Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node anak
      Vitest secara default guna mengurangi churn kompilasi V8 selama run lokal besar.
      Tetapkan `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku
      V8 stok.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh diff.
    - Hook pre-commit hanya untuk pemformatan. Hook ini men-stage ulang file yang diformat dan
      tidak menjalankan lint, typecheck, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push saat Anda
      membutuhkan gate pemeriksaan lokal cerdas.
    - `pnpm test:changed` dirutekan melalui lane tercakup murah secara default. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agent
      memutuskan bahwa edit harness, config, package, atau kontrak benar-benar memerlukan coverage
      Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing
      yang sama, hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mundur
      ketika rata-rata beban host sudah tinggi, sehingga beberapa run Vitest
      serentak secara default menimbulkan dampak lebih kecil.
    - Konfigurasi dasar Vitest menandai file proyek/config sebagai
      `forceRerunTriggers` sehingga rerun mode berubah tetap benar saat wiring pengujian
      berubah.
    - Konfigurasi menjaga `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada host yang didukung;
      tetapkan `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
      keluaran rincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data waktu shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Run seluruh config menggunakan path config sebagai key; shard CI
      include-pattern menambahkan nama shard sehingga shard terfilter dapat dilacak
      secara terpisah.
    - Ketika satu pengujian panas masih menghabiskan sebagian besar waktunya di impor startup,
      letakkan dependency berat di belakang seam lokal `*.runtime.ts` yang sempit dan
      mock seam itu langsung alih-alih melakukan deep-import helper runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan terhadap path root-project native untuk diff yang sudah
      di-commit itu dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark pada tree kotor saat ini
      dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan konfigurasi root Vitest.
    - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      rangkaian unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Perintah: `pnpm test:stability:gateway`
- Konfigurasi: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara default
  - Mendorong churn pesan gateway sintetis, memori, dan payload besar melalui path peristiwa diagnostik
  - Mengkueri `diagnostics.stability` melalui WS RPC Gateway
  - Mencakup helper persistensi bundle stabilitas diagnostik
  - Memastikan recorder tetap terbatas, sampel RSS sintetis tetap di bawah budget tekanan, dan kedalaman antrean per sesi terkuras kembali ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti rangkaian Gateway penuh

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Konfigurasi: `vitest.e2e.config.ts`
- Berkas: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E Plugin bawaan di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: default 1).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi maksimum 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali keluaran konsol verbose.
- Cakupan:
  - Perilaku end-to-end Gateway multi-instans
  - Permukaan WebSocket/HTTP, pemasangan node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan kunci nyata
  - Lebih banyak bagian bergerak dibandingkan pengujian unit (bisa lebih lambat)

### E2E: validasi dasar backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- Berkas: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai Gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + eksekusi SSH
  - Memverifikasi perilaku sistem berkas kanonis jarak jauh melalui jembatan fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari eksekusi default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan Gateway pengujian dan sandbox
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI non-default atau skrip wrapper

### Live (penyedia nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- Berkas: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live Plugin bawaan di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah penyedia/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format penyedia, kekhasan pemanggilan alat, masalah autentikasi, dan perilaku batas laju
- Ekspektasi:
  - Sengaja tidak stabil untuk CI (jaringan nyata, kebijakan penyedia nyata, kuota, gangguan layanan)
  - Menghabiskan biaya / menggunakan batas laju
  - Utamakan menjalankan subset yang dipersempit daripada “semuanya”
- Eksekusi live memuat sumber `~/.profile` untuk mengambil kunci API yang hilang.
- Secara default, eksekusi live tetap mengisolasi `HOME` dan menyalin material konfigurasi/autentikasi ke home pengujian sementara agar fixture unit tidak dapat mengubah `~/.openclaw` nyata Anda.
- Tetapkan `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda sengaja memerlukan pengujian live untuk menggunakan direktori home nyata Anda.
- `pnpm test:live` kini default ke mode yang lebih senyap: mode ini mempertahankan keluaran progres `[live] ...`, tetapi menyembunyikan pemberitahuan `~/.profile` tambahan dan membisukan log bootstrap Gateway/obrolan Bonjour. Tetapkan `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin mengembalikan log startup lengkap.
- Rotasi kunci API (khusus penyedia): tetapkan `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba ulang pada respons batas laju.
- Keluaran progres/Heartbeat:
  - Suite live kini mengeluarkan baris progres ke stderr sehingga panggilan penyedia yang lama terlihat aktif bahkan ketika penangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres penyedia/Gateway mengalir segera selama eksekusi live.
  - Atur Heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Atur Heartbeat Gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan Gateway / protokol WS / pemasangan: tambahkan `pnpm test:e2e`
- Men-debug “bot saya mati” / kegagalan khusus penyedia / pemanggilan alat: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, validasi dasar backend CLI, validasi dasar ACP, harness server aplikasi Codex, dan semua pengujian live penyedia media (Deepgram, BytePlus, ComfyUI, gambar, musik, video, harness media) — plus penanganan kredensial untuk eksekusi live — lihat [Menguji suite live](/id/help/testing-live). Untuk checklist khusus validasi pembaruan dan Plugin, lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan berkas live kunci profil yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori konfigurasi lokal dan workspace Anda (serta memuat `~/.profile` jika di-mount). Entry point lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker default ke batas validasi dasar yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut ketika Anda
  secara eksplisit menginginkan pemindaian menyeluruh yang lebih besar.
- `test:docker:all` membangun image Docker live sekali melalui `test:docker:live-build`, mengemas OpenClaw sekali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image dasar hanya runner Node/Git untuk jalur instalasi/pembaruan/dependensi-Plugin; jalur tersebut me-mount tarball prabangun. Image fungsional menginstal tarball yang sama ke `/app` untuk jalur fungsionalitas aplikasi terbangun. Definisi jalur Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sedangkan batas sumber daya mencegah jalur live berat, instalasi npm, dan multi-layanan dimulai sekaligus. Jika satu jalur lebih berat daripada batas aktif, scheduler tetap dapat memulainya ketika pool kosong lalu mempertahankannya berjalan sendiri hingga kapasitas tersedia lagi. Default adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; atur `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya ketika host Docker memiliki ruang lebih besar. Runner menjalankan preflight Docker secara default, menghapus container E2E OpenClaw yang usang, mencetak status setiap 30 detik, menyimpan timing jalur yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai jalur yang lebih lama terlebih dahulu pada eksekusi berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes jalur berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI bagi jalur yang dipilih, kebutuhan paket/image, dan kredensial.
- `Package Acceptance` adalah gate paket native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Gate ini menyelesaikan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan jalur E2E Docker yang dapat digunakan ulang terhadap tarball tepat tersebut, bukan mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan keluasan: `smoke`, `package`, `product`, dan `full`. Lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins) untuk kontrak paket/pembaruan/Plugin, matriks survivor published-upgrade, default rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri grafik build statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi paket seperti Commander, UI prompt, undici, atau logging sebelum dispatch perintah; guard ini juga menjaga chunk eksekusi Gateway bawaan tetap dalam anggaran dan menolak impor statis dari jalur Gateway dingin yang diketahui. Validasi dasar CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema konfigurasi, dan perintah daftar model.
- Kompatibilitas legacy Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga batas tersebut, harness hanya menoleransi celah metadata paket terkirim: entri inventaris QA private yang dihilangkan, `gateway install --wrapper` yang hilang, berkas patch yang hilang dalam fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi catatan instalasi Plugin legacy, persistensi catatan instalasi marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Untuk paket setelah `2026.4.25`, jalur tersebut menjadi kegagalan ketat.
- Runner validasi dasar container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` mem-boot satu atau lebih container nyata dan memverifikasi jalur integrasi tingkat lebih tinggi.

Runner Docker model live juga hanya melakukan bind-mount home autentikasi CLI yang diperlukan (atau semuanya yang didukung ketika eksekusi tidak dipersempit), lalu menyalinnya ke home container sebelum eksekusi sehingga OAuth CLI eksternal dapat memperbarui token tanpa mengubah penyimpanan autentikasi host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode yang ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observabilitas: `pnpm qa:otel:smoke` adalah lane QA privat untuk checkout sumber. Ini sengaja bukan bagian dari lane rilis Docker paket karena tarball npm tidak menyertakan QA Lab.
- Smoke langsung Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent tarball npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang sudah dikemas secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, menjalankan doctor, dan menjalankan satu giliran agen OpenAI tiruan. Gunakan kembali tarball yang sudah dibuat dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` atau `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke peralihan channel pembaruan: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang sudah dikemas secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipersistenkan dan pekerjaan pascapembaruan Plugin, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke penyintas upgrade: `pnpm test:docker:upgrade-survivor` menginstal tarball OpenClaw yang sudah dikemas di atas fixture pengguna lama yang kotor dengan agen, konfigurasi channel, allowlist Plugin, status dependensi Plugin kedaluwarsa, dan file workspace/sesi yang sudah ada. Ini menjalankan pembaruan paket plus doctor noninteraktif tanpa kunci penyedia langsung atau channel, lalu memulai Gateway loopback dan memeriksa pelestarian konfigurasi/status plus anggaran startup/status.
- Smoke penyintas upgrade terpublikasi: `pnpm test:docker:published-upgrade-survivor` menginstal `openclaw@latest` secara default, menanam file pengguna yang sudah ada secara realistis, mengonfigurasi baseline tersebut dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi terpublikasi itu ke tarball kandidat, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent terkonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, dan anggaran status RPC. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta penjadwal agregat memperluas baseline persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `all-since-2026.4.23`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; set reported-issues menyertakan `configured-plugin-installs` untuk perbaikan otomatis instalasi Plugin OpenClaw eksternal. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`; Full Release Validation menggunakan baseline latest default di jalur pemblokir dan memperluas ke all-since/reported-issues hanya untuk `run_release_soak=true` atau `release_profile=full`.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor pada cabang prompt-rewrite duplikat yang terdampak.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas tree saat ini, menginstalnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih macet. Gunakan kembali tarball yang sudah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker penginstal: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh kontainer root, update, dan direct-npm. Smoke update default menggunakan npm `latest` sebagai baseline stable sebelum upgrade ke tarball kandidat. Timpa dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` milik workflow Install Smoke di GitHub. Pemeriksaan penginstal non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku instalasi lokal pengguna. Setel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/update/direct-npm di rerun lokal.
- CI Install Smoke melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env itu ketika cakupan direct `npm install -g` diperlukan.
- Smoke CLI hapus workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membuat image Dockerfile root secara default, menanam dua agen dengan satu workspace di home kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku workspace yang dipertahankan. Gunakan kembali image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua kontainer, autentikasi WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membuat image E2E sumber plus layer Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dipromosikan kursor, referensi iframe, dan metadata frame.
- Regresi reasoning minimal OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan skema penyedia dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway tertanam + bridge stdio + smoke notification-frame Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundel Pi (server MCP stdio nyata + smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + teardown child MCP stdio setelah cron terisolasi dan run subagen sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke instal/update untuk path lokal, `file:`, registri npm dengan dependensi hoisted, ref git bergerak, kitchen-sink ClawHub, pembaruan marketplace, dan enable/inspect bundel Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Setel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan paket/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal hermetik.
- Smoke pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks siklus hidup Plugin: `pnpm test:docker:plugin-lifecycle-matrix` menginstal tarball OpenClaw yang sudah dikemas di kontainer kosong, menginstal Plugin npm, mengalihkan enable/disable, meng-upgrade dan downgrade melalui registri npm lokal, menghapus kode yang terinstal, lalu memverifikasi uninstall tetap menghapus status kedaluwarsa sambil mencatat metrik RSS/CPU untuk setiap fase siklus hidup.
- Smoke metadata reload konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke install/update untuk path lokal, `file:`, registri npm dengan dependensi hoisted, ref git bergerak, fixture ClawHub, pembaruan marketplace, dan enable/inspect bundel Claude. `pnpm test:docker:plugin-update` mencakup perilaku update tanpa perubahan untuk Plugin yang terinstal. `pnpm test:docker:plugin-lifecycle-matrix` mencakup instalasi, enable, disable, upgrade, downgrade, dan uninstall kode hilang untuk Plugin npm dengan pelacakan sumber daya.

Untuk membuat sebelumnya dan menggunakan kembali image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat disetel. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip menariknya jika belum lokal. Pengujian QR dan Docker penginstal mempertahankan Dockerfile masing-masing karena memvalidasi perilaku paket/instal, bukan runtime aplikasi bawaan bersama.

Runner Docker live-model juga melakukan bind-mount checkout saat ini secara read-only dan
menyiapkannya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda yang persis.
Langkah staging melewati cache besar yang hanya lokal dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build` lokal aplikasi atau
Gradle sehingga run live Docker tidak menghabiskan beberapa menit menyalin
artefak khusus mesin.
Runner itu juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` sehingga probe live gateway tidak memulai
worker channel Telegram/Discord/dll. yang nyata di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live gateway
dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ia memulai
container gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang dipin terhadap gateway itu, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` Open WebUI.
Run pertama dapat terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start-nya sendiri.
Lane ini mengharapkan kunci model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run yang dijalankan via Docker.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak membutuhkan akun
Telegram, Discord, atau iMessage nyata. Ia mem-boot container Gateway yang sudah di-seed,
memulai container kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, routing pengiriman outbound, serta notifikasi channel +
izin bergaya Claude melalui bridge MCP stdio nyata. Pemeriksaan notifikasi
memeriksa frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
benar-benar dipancarkan bridge, bukan hanya apa yang kebetulan ditampilkan SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak membutuhkan kunci model live.
Ia membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam container, mewujudkan server itu melalui runtime MCP bundle Pi yang tertanam,
mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak membutuhkan kunci model live.
Ia memulai Gateway yang sudah di-seed dengan server probe MCP stdio nyata, menjalankan
turn cron terisolasi dan turn child sekali jalan `/subagents spawn`, lalu memverifikasi
proses child MCP keluar setelah setiap run.

Smoke thread ACP bahasa biasa manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk workflow regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi routing thread ACP, jadi jangan hapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya me-mount direktori/file yang diperlukan yang disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang sudah ada untuk rerun yang tidak membutuhkan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari store profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipin

## Sanity docs

Jalankan pemeriksaan docs setelah edit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga membutuhkan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Pemanggilan tool Gateway (OpenAI mock, gateway nyata + loop agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis config + auth diberlakukan): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval keandalan agent (skills)

Kita sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti “eval keandalan agent”:

- Pemanggilan tool mock melalui gateway nyata + loop agent (`src/gateway/gateway.test.ts`).
- Flow wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat skills tercantum dalam prompt, apakah agent memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agent membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak workflow:** skenario multi-turn yang menegaskan urutan tool, carryover riwayat sesi, dan batas sandbox.

Eval mendatang harus tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan provider mock untuk menegaskan panggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario berfokus skill (gunakan vs hindari, gating, prompt injection).
- Eval live opsional (opt-in, dibatasi env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk plugin dan channel)

Pengujian kontrak memverifikasi bahwa setiap plugin dan channel terdaftar mematuhi
kontrak interface-nya. Pengujian ini mengiterasi semua plugin yang ditemukan dan menjalankan suite
assertion bentuk dan perilaku. Lane unit `pnpm test` default sengaja
melewati file smoke dan seam bersama ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh surface channel atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak channel

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, capabilities)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku binding sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan inbound
- **actions** - Handler aksi channel
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status provider

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Bentuk registry plugin

### Kontrak provider

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak flow auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan plugin
- **loader** - Pemuatan plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/interface plugin
- **wizard** - Wizard setup

### Kapan menjalankan

- Setelah mengubah export atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi channel atau provider plugin
- Setelah merefaktor registrasi atau penemuan plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan kunci API nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan secara live:

- Tambahkan regresi aman untuk CI jika memungkinkan (provider mock/stub, atau tangkap transformasi bentuk permintaan yang persis)
- Jika secara inheren hanya live (rate limit, kebijakan auth), pertahankan pengujian live tetap sempit dan opt-in via env var
- Lebih pilih menargetkan layer terkecil yang menangkap bug:
  - bug konversi/replay permintaan provider → pengujian model langsung
  - bug pipeline sesi/riwayat/tool gateway → smoke live gateway atau pengujian mock gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan exec id segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian itu. Pengujian itu sengaja gagal pada id target yang tidak terklasifikasi sehingga kelas baru tidak dapat dilewati diam-diam.

## Terkait

- [Pengujian live](/id/help/testing-live)
- [Pengujian update dan plugin](/id/help/testing-updates-plugins)
- [CI](/id/ci)
