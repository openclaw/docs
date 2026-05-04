---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk bug model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Kit pengujian: rangkaian unit/e2e/live, runner Docker, dan apa yang dicakup setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-05-04T07:06:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, live) dan sekumpulan kecil
runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, pra-push, debugging).
- Cara pengujian live menemukan kredensial dan memilih model/penyedia.
- Cara menambahkan regresi untuk masalah model/penyedia dunia nyata.

<Note>
**Tumpukan QA (qa-lab, qa-channel, lane transport live)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) — arsitektur, permukaan perintah, penulisan skenario.
- [QA matriks](/id/concepts/qa-matrix) — referensi untuk `pnpm openclaw qa matrix`.
- [Channel QA](/id/channels/qa-channel) — Plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini mencakup menjalankan suite pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([runner khusus QA](#qa-specific-runners)) mencantumkan pemanggilan `qa` konkret dan mengarahkan kembali ke referensi di atas.
</Note>

## Mulai cepat

Pada sebagian besar hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan suite penuh lokal yang lebih cepat pada mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan run tertarget lebih dulu saat Anda sedang mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan tambahan:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug penyedia/model nyata (memerlukan kredensial nyata):

- Suite live (model + probe tool/gambar Gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: dispatch `OpenClaw Performance` dengan
  `live_gpt54=true` untuk giliran agen `openai/gpt-5.4` nyata atau
  `deep_profile=true` untuk artefak CPU/heap/trace Kova. Run terjadwal harian
  menerbitkan artefak lane mock-provider, deep-profile, dan GPT 5.4 ke
  `openclaw/clawgrit-reports` saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi. Laporan
  mock-provider juga menyertakan angka boot Gateway tingkat sumber, memori,
  tekanan Plugin, hello-loop fake-model berulang, dan startup CLI.
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model terpilih sekarang menjalankan giliran teks plus probe kecil bergaya baca-file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang menyertakan job matriks model live Docker terpisah
    yang di-shard berdasarkan penyedia.
  - Untuk rerun CI yang terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret penyedia baru bernilai sinyal tinggi ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke chat terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan lane live Docker terhadap path app-server Codex, mengikat DM Slack sintetis
    dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan attachment gambar
    dirutekan melalui binding Plugin native, bukan ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe gambar,
    MCP Cron, sub-agen, dan Guardian. Nonaktifkan probe sub-agen dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan app-server Codex
    lainnya. Untuk pemeriksaan sub-agen yang terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in berlapis untuk permukaan perintah penyelamatan channel pesan.
    Ini menjalankan `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam container tanpa config dengan CLI Claude palsu di `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi tulis config bertipe yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Dimulai dari dir status OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan penulisan setup/model/agen/Plugin Discord + SecretRef,
    memvalidasi config, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya membutuhkan satu kasus gagal, utamakan mempersempit pengujian live melalui env var allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah ini berada di samping suite pengujian utama saat Anda membutuhkan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. Paritas agen bersarang di bawah
`QA-Lab - All Lanes` dan validasi rilis, bukan workflow PR mandiri.
Validasi luas sebaiknya menggunakan `Full Release Validation` dengan
`rerun_group=qa-parity` atau grup QA release-checks. `QA-Lab - All Lanes`
berjalan setiap malam di `main` dan dari dispatch manual dengan lane paritas mock, lane
Matrix live, lane Telegram live yang dikelola Convex, dan lane Discord live
yang dikelola Convex sebagai job paralel. QA terjadwal dan pemeriksaan rilis meneruskan
Matrix `--profile fast` secara eksplisit, sementara default input CLI Matrix dan workflow manual
tetap `all`; dispatch manual dapat melakukan shard `all` menjadi job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release
Checks` menjalankan paritas plus lane Matrix cepat dan Telegram sebelum persetujuan rilis,
menggunakan `mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap deterministik
dan menghindari startup Plugin penyedia normal. Gateway transport live ini
menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh suite paritas QA.

Shard media live rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit terpilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan worker
    Gateway yang terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    worker, atau `--concurrency 1` untuk lane serial lama.
  - Keluar dengan non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan fixture
    eksperimental dan protocol-mock tanpa mengganti lane `mock-openai` yang sadar skenario.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup Gateway plus paket skenario QA Lab mock kecil
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat dicatat sebagai metrik
    tanpa tampak seperti regresi Gateway peg yang berlangsung beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu ketika checkout belum
    memiliki output runtime yang baru.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan ulang flag pemilihan provider/model yang sama seperti `qa suite`.
  - Run live meneruskan input auth QA yang didukung dan praktis untuk guest:
    kunci provider berbasis env, path config provider live QA, dan `CODEX_HOME`
    ketika ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis kembali melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, memasangnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi runtime Plugin terpaket dimuat tanpa perbaikan dependensi
    startup, menjalankan doctor, dan menjalankan satu giliran agent lokal terhadap endpoint
    OpenAI yang di-mock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane packaged-install
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker built-app deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi disimpan sebagai
    pesan custom non-display alih-alih bocor ke giliran pengguna yang terlihat,
    lalu menanamkan JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke branch aktif dengan backup.
- `pnpm test:docker:npm-telegram-live`
  - Memasang kandidat paket OpenClaw di Docker, menjalankan onboarding installed-package,
    mengonfigurasi Telegram melalui CLI terpasang, lalu menggunakan ulang lane QA Telegram
    live dengan paket terpasang tersebut sebagai SUT Gateway.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; atur
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah di-resolve alih-alih
    memasang dari registry.
  - Menggunakan kredensial env Telegram atau sumber kredensial Convex yang sama seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, atur
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - Wrapper memvalidasi env kredensial Telegram atau Convex di host sebelum
    pekerjaan build/install Docker. Atur `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    hanya saat sengaja men-debug setup pra-kredensial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menimpa
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk lane ini.
  - GitHub Actions mengekspos lane ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow menggunakan
    environment `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk side-run
  terhadap satu paket kandidat. Ini menerima ref tepercaya, spec npm terpublikasi,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  scheduler Docker E2E yang ada dengan profil lane smoke, package, product, full, atau custom.
  Atur `telegram_mode=mock-openai` atau `live-frontier` untuk menjalankan workflow QA
  Telegram terhadap artefak `package-under-test` yang sama.
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

- Bukti artefak mengunduh artefak tarball dari run Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mengepak dan memasang build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI dikonfigurasi, lalu mengaktifkan channel/Plugin bawaan melalui edit
    config.
  - Memverifikasi discovery setup membiarkan Plugin yang dapat diunduh dan belum dikonfigurasi tetap tidak ada,
    perbaikan doctor terkonfigurasi pertama memasang setiap Plugin yang dapat diunduh dan hilang
    secara eksplisit, dan restart kedua tidak menjalankan perbaikan dependensi
    tersembunyi.
  - Juga memasang baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi doctor pasca-update kandidat
    membersihkan sisa dependensi Plugin lama tanpa perbaikan postinstall dari sisi
    harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke update packaged-install native di seluruh guest Parallels. Setiap
    platform terpilih terlebih dahulu memasang paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` terpasang di guest yang sama dan memverifikasi
    versi terpasang, status update, kesiapan Gateway, dan satu giliran agent
    lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    beriterasi pada satu guest. Gunakan `--json` untuk path artefak ringkasan dan
    status per-lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agent live secara
    default. Berikan `--model <provider/model>` atau atur
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ketika sengaja memvalidasi model OpenAI
    lain.
  - Bungkus run lokal panjang dalam timeout host agar stall transport Parallels tidak dapat
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bersarang di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap wrapper luar hang.
  - Update Windows dapat menghabiskan 10 hingga 15 menit dalam pekerjaan doctor pasca-update dan
    update paket pada guest dingin; itu masih sehat ketika log debug npm
    bersarang terus bergerak.
  - Jangan jalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi state VM dan dapat bertabrakan pada
    restore snapshot, penyajian paket, atau state Gateway guest.
  - Bukti pasca-update menjalankan permukaan Plugin bawaan normal karena
    facade capability seperti ucapan, pembuatan gambar, dan pemahaman media
    dimuat melalui API runtime bawaan meskipun giliran agent itu sendiri
    hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Memulai hanya server provider AIMock lokal untuk pengujian smoke protokol
    langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel sekali pakai berbasis Docker. Hanya source-checkout — install terpaket tidak mengirimkan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, env var, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat sungguhan menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial pooled bersama. Gunakan mode env secara default, atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut memakai lease pooled.
  - Keluar dengan non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati traffic bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak observed-messages di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang teramati.

Lane transport live berbagi satu kontrak standar sehingga transport baru tidak menyimpang; matriks cakupan per-lane berada di [ringkasan QA → cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Ketika `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA lab memperoleh lease eksklusif dari pool berbasis Convex, melakukan Heartbeat
pada lease tersebut saat lane berjalan, dan melepaskan lease saat shutdown.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Env var wajib:

- `OPENCLAW_QA_CONVEX_SITE_URL` (contohnya `https://your-deployment.convex.site`)
- Satu secret untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, `maintainer` jika tidak)

Env var opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID trace opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex `http://` loopback untuk pengembangan khusus lokal.

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

Gunakan `doctor` sebelum menjalankan live run untuk memeriksa URL situs Convex, rahasia broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/list tanpa mencetak
nilai rahasia. Gunakan `--json` untuk keluaran yang dapat dibaca mesin dalam skrip dan utilitas CI.

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
- `POST /admin/add` (hanya rahasia maintainer)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (hanya rahasia maintainer)
  - Permintaan: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Pelindung lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya rahasia maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string id chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang cacat.

### Menambahkan kanal ke QA

Arsitektur dan nama pembantu skenario untuk adaptor kanal baru berada di [Gambaran umum QA → Menambahkan kanal](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimum: implementasikan pelaksana transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` dalam manifes Plugin, pasang sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Rangkaian pengujian (apa yang berjalan di mana)

Anggap rangkaian ini sebagai “realisme yang meningkat” (dan peningkatan kerapuhan/biaya):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: eksekusi tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi konfigurasi per proyek untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (autentikasi Gateway, perutean, tooling, parsing, konfigurasi)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan pemuat permukaan publik harus membuktikan perilaku fallback luas `api.js` dan
    `runtime-api.js` dengan fixture Plugin kecil yang dihasilkan, bukan
    API sumber Plugin bundel nyata. Pemuatan API Plugin nyata termasuk dalam
    rangkaian kontrak/integrasi milik Plugin.

<AccordionGroup>
  <Accordion title="Proyek, shard, dan lane tercakup">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses proyek root native yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sibuk dan mencegah pekerjaan auto-reply/ekstensi membuat rangkaian yang tidak terkait kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan graf proyek root native `vitest.config.ts`, karena loop pemantauan multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane tercakup terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup proyek root penuh.
    - `pnpm test:changed` memperluas path git yang berubah menjadi lane tercakup murah secara default: edit pengujian langsung, file saudara `*.test.ts`, pemetaan sumber eksplisit, dan dependen graf impor lokal. Edit konfigurasi/setup/paket tidak menjalankan pengujian luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal cerdas normal untuk pekerjaan sempit. Ia mengklasifikasikan diff menjadi core, pengujian core, ekstensi, pengujian ekstensi, aplikasi, dokumen, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan perintah typecheck, lint, dan guard yang sesuai. Ia tidak menjalankan pengujian Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian. Kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root tertarget, dengan guard yang menolak perubahan paket di luar field versi tingkat atas.
    - Edit harness ACP Docker live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip autentikasi Docker live dan dry-run penjadwal Docker live. Perubahan `package.json` hanya disertakan saat diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, ekspor, versi, dan permukaan paket lain tetap menggunakan guard yang lebih luas.
    - Pengujian unit impor-ringan dari agen, perintah, plugins, pembantu auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file yang berstatus dan berat-runtime tetap berada pada lane yang ada.
    - File sumber pembantu `plugin-sdk` dan `commands` tertentu juga memetakan eksekusi mode berubah ke pengujian saudara eksplisit di lane ringan tersebut, sehingga edit pembantu menghindari menjalankan ulang seluruh rangkaian berat untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk pembantu core tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya membagi subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket berat-impor tidak menguasai seluruh ekor Node.
    - CI PR/main normal sengaja melewati sapuan batch ekstensi dan shard khusus rilis `agentic-plugins`. Validasi Rilis Penuh memicu alur kerja anak `Plugin Prerelease` terpisah untuk rangkaian berat Plugin/ekstensi tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input penemuan alat pesan atau konteks runtime Compaction,
      pertahankan kedua tingkat cakupan.
    - Tambahkan regresi pembantu terfokus untuk batas perutean dan normalisasi
      murni.
    - Jaga kesehatan rangkaian integrasi runner tertanam:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Rangkaian tersebut memverifikasi bahwa id tercakup dan perilaku Compaction tetap mengalir
      melalui jalur `run.ts` / `compact.ts` nyata; pengujian khusus pembantu
      bukan pengganti yang memadai untuk jalur integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Konfigurasi dasar Vitest default ke `threads`.
    - Konfigurasi Vitest bersama menetapkan `isolate: false` dan menggunakan
      runner non-terisolasi di seluruh proyek root, e2e, dan konfigurasi live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi juga berjalan pada
      runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari konfigurasi Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses anak Node
      Vitest secara default untuk mengurangi churn kompilasi V8 selama eksekusi lokal besar.
      Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku
      V8 standar.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menunjukkan lane arsitektur mana yang dipicu oleh sebuah diff.
    - Hook pre-commit hanya untuk pemformatan. Ia men-stage ulang file yang diformat dan
      tidak menjalankan lint, typecheck, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push saat Anda
      memerlukan gate pemeriksaan lokal cerdas.
    - `pnpm test:changed` dirutekan melalui lane tercakup murah secara default. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya saat agen
      memutuskan bahwa edit harness, konfigurasi, paket, atau kontrak benar-benar memerlukan
      cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku perutean
      yang sama, hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mundur
      saat rata-rata beban host sudah tinggi, sehingga beberapa eksekusi Vitest
      bersamaan menimbulkan dampak lebih kecil secara default.
    - Konfigurasi dasar Vitest menandai proyek/file konfigurasi sebagai
      `forceRerunTriggers` sehingga eksekusi ulang mode berubah tetap benar saat
      wiring pengujian berubah.
    - Konfigurasi mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada host yang didukung;
      setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest ditambah
      keluaran rincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data waktu shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Eksekusi seluruh konfigurasi menggunakan path konfigurasi sebagai kunci; shard CI
      pola-include menambahkan nama shard sehingga shard terfilter dapat dilacak
      secara terpisah.
    - Saat satu pengujian panas masih menghabiskan sebagian besar waktunya pada impor startup,
      simpan dependensi berat di balik seam lokal sempit `*.runtime.ts` dan
      mock seam itu secara langsung alih-alih melakukan deep-import pembantu runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan jalur proyek root native untuk diff yang sudah di-commit itu
      dan mencetak waktu wall plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mengukur tree kotor saat ini
      dengan merutekan daftar file berubah melalui
      `scripts/test-projects.mjs` dan konfigurasi Vitest root.
    - `pnpm test:perf:profile:main` menulis profil CPU thread utama untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      rangkaian unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Perintah: `pnpm test:stability:gateway`
- Konfigurasi: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway local loopback nyata dengan diagnostik aktif secara default
  - Menggerakkan churn pesan gateway sintetis, memori, dan payload besar melalui jalur peristiwa diagnostik
  - Mengkueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup pembantu persistensi bundel stabilitas diagnostik
  - Menegaskan bahwa perekam tetap berbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi kembali turun ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa kunci
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti rangkaian Gateway penuh

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Konfigurasi: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E bundled-plugin di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: default 1).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi hingga 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instans
  - Permukaan WebSocket/HTTP, pemasangan node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (jika diaktifkan dalam pipeline)
  - Tidak memerlukan kunci nyata
  - Lebih banyak komponen bergerak dibanding pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + eksekusi SSH
  - Memverifikasi perilaku sistem file remote-kanonis melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari eksekusi default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal ditambah daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway dan sandbox pengujian
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI non-default atau skrip wrapper

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live bundled-plugin di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (menyetel `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, keunikan pemanggilan alat, masalah autentikasi, dan perilaku batas laju
- Ekspektasi:
  - Sengaja tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, gangguan)
  - Menghabiskan uang / menggunakan batas laju
  - Lebih disarankan menjalankan subset yang dipersempit daripada “semuanya”
- Eksekusi live memuat `~/.profile` untuk mengambil kunci API yang hilang.
- Secara default, eksekusi live tetap mengisolasi `HOME` dan menyalin material konfigurasi/autentikasi ke home pengujian sementara sehingga fixture unit tidak dapat mengubah `~/.openclaw` nyata Anda.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya saat Anda memang perlu pengujian live menggunakan direktori home nyata Anda.
- `pnpm test:live` kini default ke mode yang lebih senyap: mode ini mempertahankan output progres `[live] ...`, tetapi menekan pemberitahuan ekstra `~/.profile` dan membisukan log bootstrap gateway/obrolan Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda menginginkan kembali log startup lengkap.
- Rotasi kunci API (spesifik provider): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba ulang pada respons batas laju.
- Output progres/heartbeat:
  - Suite live kini memancarkan baris progres ke stderr sehingga pemanggilan provider yang lama tetap terlihat aktif meskipun penangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway mengalir langsung selama eksekusi live.
  - Sesuaikan heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang sebaiknya saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda banyak mengubah)
- Menyentuh jaringan gateway / protokol WS / pemasangan: tambahkan `pnpm test:e2e`
- Men-debug “bot saya sedang down” / kegagalan spesifik provider / pemanggilan alat: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness server aplikasi Codex, dan semua pengujian live provider media (Deepgram, BytePlus, ComfyUI, gambar, musik, video, harness media) — ditambah penanganan kredensial untuk eksekusi live — lihat [Menguji suite live](/id/help/testing-live). Untuk checklist khusus pembaruan dan validasi plugin, lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini dibagi menjadi dua kelompok:

- Runner model live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang sesuai di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan memasang direktori konfigurasi lokal dan workspace Anda (serta memuat `~/.profile` jika dipasang). Entrypoint lokal yang sesuai adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker default ke batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override variabel env tersebut saat Anda
  secara eksplisit menginginkan pemindaian menyeluruh yang lebih besar.
- `test:docker:all` membangun image Docker live sekali melalui `test:docker:live-build`, mengemas OpenClaw sekali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan kembali dua image `scripts/e2e/Dockerfile`. Image bare hanyalah runner Node/Git untuk lane instal/pembaruan/dependensi-plugin; lane tersebut memasang tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas aplikasi yang dibangun. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas sumber daya mencegah lane live berat, npm-install, dan multi-service dimulai sekaligus. Jika satu lane lebih berat daripada batas aktif, scheduler masih dapat memulainya saat pool kosong lalu mempertahankannya berjalan sendiri hingga kapasitas tersedia kembali. Defaultnya adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya saat host Docker memiliki ruang tambahan. Runner melakukan preflight Docker secara default, menghapus kontainer OpenClaw E2E usang, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih lama lebih dulu pada eksekusi berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI bagi lane yang dipilih, kebutuhan paket/image, dan kredensial.
- `Package Acceptance` adalah gate paket native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Gate ini menyelesaikan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane Docker E2E yang dapat digunakan ulang terhadap tarball persis itu, bukan mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan keluasan: `smoke`, `package`, `product`, dan `full`. Lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins) untuk kontrak paket/pembaruan/plugin, matriks survivor published-upgrade, default rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri grafik built statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi paket seperti Commander, prompt UI, undici, atau logging sebelum dispatch perintah; guard ini juga menjaga chunk run gateway bundled tetap di bawah anggaran dan menolak impor statis jalur gateway dingin yang dikenal. Smoke CLI terpaket juga mencakup root help, onboard help, doctor help, status, skema konfigurasi, dan perintah daftar model.
- Kompatibilitas legacy Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga batas tersebut, harness hanya menoleransi celah metadata shipped-package: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi install-record plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Untuk paket setelah `2026.4.25`, jalur tersebut menjadi kegagalan ketat.
- Runner smoke kontainer: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` mem-boot satu atau lebih kontainer nyata dan memverifikasi jalur integrasi tingkat lebih tinggi.

Runner Docker model live juga hanya melakukan bind-mount home autentikasi CLI yang diperlukan (atau semua yang didukung saat eksekusi tidak dipersempit), lalu menyalinnya ke home kontainer sebelum eksekusi sehingga OAuth CLI eksternal dapat menyegarkan token tanpa mengubah penyimpanan autentikasi host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode yang ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observabilitas: `pnpm qa:otel:smoke` adalah lane checkout sumber QA privat. Ini sengaja tidak menjadi bagian dari lane rilis Docker paket karena tarball npm tidak menyertakan QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wisaya onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agen tarball npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang sudah dikemas secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, menjalankan doctor, dan menjalankan satu giliran agen OpenAI yang di-mock. Gunakan ulang tarball yang sudah dibuat sebelumnya dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke penggantian channel pembaruan: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang sudah dikemas secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipertahankan dan kerja Plugin pascapembaruan, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke penyintas upgrade: `pnpm test:docker:upgrade-survivor` menginstal tarball OpenClaw yang sudah dikemas di atas fixture pengguna lama yang kotor dengan agen, konfigurasi channel, allowlist Plugin, status dependensi Plugin usang, dan file workspace/sesi yang ada. Ini menjalankan pembaruan paket plus doctor noninteraktif tanpa penyedia live atau kunci channel, lalu memulai Gateway loopback dan memeriksa pelestarian konfigurasi/status plus anggaran startup/status.
- Smoke penyintas upgrade terpublikasi: `pnpm test:docker:published-upgrade-survivor` menginstal `openclaw@latest` secara default, menyemai file pengguna yang ada secara realistis, mengonfigurasi baseline tersebut dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi terpublikasi itu ke tarball kandidat, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent yang dikonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, dan anggaran status RPC. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta scheduler agregat memperluas baseline persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `all-since-2026.4.23`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; set reported-issues mencakup `configured-plugin-installs` untuk perbaikan instalasi Plugin OpenClaw eksternal otomatis. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor untuk cabang prompt-rewrite terdampak yang terduplikasi.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas tree saat ini, menginstalnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih menggantung. Gunakan ulang tarball yang sudah dibuat sebelumnya dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh kontainer root, update, dan direct-npm. Smoke update default ke npm `latest` sebagai baseline stable sebelum upgrade ke tarball kandidat. Timpa dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` milik workflow Install Smoke di GitHub. Pemeriksaan installer non-root menjaga cache npm terisolasi agar entri cache milik root tidak menutupi perilaku instalasi lokal pengguna. Tetapkan `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan ulang cache root/update/direct-npm pada rerun lokal.
- Install Smoke CI melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env tersebut ketika cakupan langsung `npm install -g` diperlukan.
- Smoke CLI hapus workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membangun image Dockerfile root secara default, menyemai dua agen dengan satu workspace dalam home kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku workspace yang dipertahankan. Gunakan ulang image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua kontainer, autentikasi WS + kesehatan): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image sumber E2E plus lapisan Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Regresi penalaran minimal OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI yang di-mock melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa schema penyedia menolak dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway yang disemai + bridge stdio + smoke frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundel Pi (server MCP stdio nyata + smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + teardown anak MCP stdio setelah Cron terisolasi dan run subagen one-shot): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke instalasi/pembaruan untuk path lokal, `file:`, registry npm dengan dependensi yang di-hoist, ref git bergerak, ClawHub kitchen-sink, pembaruan marketplace, dan enable/inspect bundle Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Tetapkan `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan paket/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal hermetik.
- Smoke pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks lifecycle Plugin: `pnpm test:docker:plugin-lifecycle-matrix` menginstal tarball OpenClaw yang sudah dikemas dalam kontainer kosong, menginstal Plugin npm, mengaktifkan/menonaktifkan, meng-upgrade dan men-downgrade-nya melalui registry npm lokal, menghapus kode yang terinstal, lalu memverifikasi uninstall tetap menghapus status usang sambil mencatat metrik RSS/CPU untuk setiap fase lifecycle.
- Smoke metadata reload konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke instalasi/pembaruan untuk path lokal, `file:`, registry npm dengan dependensi yang di-hoist, ref git bergerak, fixture ClawHub, pembaruan marketplace, dan enable/inspect bundle Claude. `pnpm test:docker:plugin-update` mencakup perilaku pembaruan tanpa perubahan untuk Plugin yang terinstal. `pnpm test:docker:plugin-lifecycle-matrix` mencakup instalasi Plugin npm yang dilacak sumber dayanya, enable, disable, upgrade, downgrade, dan uninstall kode-hilang.

Untuk membangun sebelumnya dan menggunakan ulang image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Timpa image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang ketika ditetapkan. Ketika `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip akan menariknya jika belum tersedia lokal. Pengujian Docker QR dan installer mempertahankan Dockerfile masing-masing karena mereka memvalidasi perilaku paket/instalasi, bukan runtime aplikasi yang dibangun bersama.

Runner Docker live-model juga mengikat-mount checkout saat ini sebagai hanya-baca dan
men-stage-nya ke workdir sementara di dalam kontainer. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal persis Anda.
Langkah staging melewati cache besar yang hanya lokal dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build`
lokal aplikasi atau Gradle sehingga run live Docker tidak menghabiskan menit-menit untuk menyalin
artefak khusus mesin.
Runner tersebut juga menyetel `OPENCLAW_SKIP_CHANNELS=1` agar probe live gateway tidak memulai
worker kanal Telegram/Discord/dll. sungguhan di dalam kontainer.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live gateway
dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ini memulai
kontainer Gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai kontainer Open WebUI yang dipin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat sungguhan melalui proxy `/api/chat/completions` Open WebUI.
Run pertama bisa terasa jauh lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start-nya sendiri.
Lane ini mengharapkan kunci model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run yang di-Docker-kan.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage sungguhan. Ini mem-boot kontainer Gateway
yang sudah di-seed, memulai kontainer kedua yang men-spawn `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan terarah, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, perutean kirim keluar, serta notifikasi kanal +
izin bergaya Claude melalui bridge MCP stdio sungguhan. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
benar-benar dipancarkan bridge, bukan hanya apa yang kebetulan diekspos SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan kunci model live.
Ini membangun image Docker repo, memulai server probe MCP stdio sungguhan
di dalam kontainer, mematerialisasikan server tersebut melalui runtime MCP bundle Pi
tersemat, mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` tetap
mempertahankan tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan kunci model live.
Ini memulai Gateway yang sudah di-seed dengan server probe MCP stdio sungguhan, menjalankan
giliran cron terisolasi dan giliran child sekali jalan `/subagents spawn`, lalu memverifikasi
proses child MCP keluar setelah setiap run.

Smoke thread ACP bahasa biasa manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk workflow regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi routing thread ACP, jadi jangan hapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk install CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount hanya-baca di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum test dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run penyedia yang dipersempit hanya me-mount direktori/file yang diperlukan dan diinferensikan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter penyedia di dalam kontainer
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan kembali image `openclaw:local-live` yang ada untuk rerun yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipin

## Sanity docs

Jalankan pemeriksaan docs setelah edit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga memerlukan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline sungguhan” tanpa penyedia sungguhan:

- Pemanggilan tool Gateway (mock OpenAI, gateway + agent loop sungguhan): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis config + auth ditegakkan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Eval keandalan agen (skills)

Kita sudah memiliki beberapa test aman untuk CI yang berperilaku seperti “eval keandalan agen”:

- Pemanggilan tool mock melalui gateway + agent loop sungguhan (`src/gateway/gateway.test.ts`).
- Flow wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih hilang untuk skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat skills dicantumkan dalam prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak workflow:** skenario multi-giliran yang mengassert urutan tool, penerusan riwayat sesi, dan batas sandbox.

Eval masa depan sebaiknya tetap deterministik terlebih dahulu:

- Runner skenario menggunakan penyedia mock untuk mengassert pemanggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, prompt injection).
- Eval live opsional (opt-in, dibatasi env) hanya setelah suite aman untuk CI tersedia.

## Test kontrak (bentuk plugin dan kanal)

Test kontrak memverifikasi bahwa setiap plugin dan kanal terdaftar mematuhi
kontrak interface-nya. Test ini mengiterasi semua plugin yang ditemukan dan menjalankan suite
assertion bentuk dan perilaku. Lane unit `pnpm test` default sengaja
melewati file seam bersama dan smoke ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh permukaan kanal atau penyedia bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak kanal: `pnpm test:contracts:channels`
- Hanya kontrak penyedia: `pnpm test:contracts:plugins`

### Kontrak kanal

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku binding sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi kanal
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status penyedia

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status kanal
- **registry** - Bentuk registry Plugin

### Kontrak penyedia

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak flow auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime penyedia
- **shape** - Bentuk/interface Plugin
- **wizard** - Wizard setup

### Kapan menjalankan

- Setelah mengubah export atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi plugin kanal atau penyedia
- Setelah refactor registrasi atau penemuan plugin

Test kontrak berjalan di CI dan tidak memerlukan kunci API sungguhan.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah penyedia/model yang ditemukan secara live:

- Tambahkan regresi aman untuk CI jika memungkinkan (penyedia mock/stub, atau tangkap transformasi bentuk permintaan persisnya)
- Jika secara inheren hanya live (batas rate, kebijakan auth), jaga test live tetap sempit dan opt-in melalui env var
- Utamakan menargetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan penyedia → test model langsung
  - bug pipeline sesi/riwayat/tool gateway → smoke live gateway atau test mock gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu mengassert id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam test tersebut. Test sengaja gagal pada id target yang tidak terklasifikasi agar kelas baru tidak bisa dilewati diam-diam.

## Terkait

- [Menguji live](/id/help/testing-live)
- [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins)
- [CI](/id/ci)
