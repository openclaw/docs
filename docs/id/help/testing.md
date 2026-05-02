---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk bug model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Perangkat pengujian: rangkaian unit/e2e/live, eksekutor Docker, dan cakupan tiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-05-02T09:24:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, live) dan sekumpulan kecil
runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk workflow umum (lokal, sebelum push, debugging).
- Cara pengujian live menemukan kredensial dan memilih model/provider.
- Cara menambahkan regresi untuk masalah model/provider di dunia nyata.

<Note>
**Stack QA (qa-lab, qa-channel, jalur transport live)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) — arsitektur, permukaan perintah, penulisan skenario.
- [Matrix QA](/id/concepts/qa-matrix) — referensi untuk `pnpm openclaw qa matrix`.
- [Kanal QA](/id/channels/qa-channel) — plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini membahas cara menjalankan suite pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([Runner khusus QA](#qa-specific-runners)) mencantumkan invokasi `qa` konkret dan mengarah kembali ke referensi di atas.
</Note>

## Mulai cepat

Pada sebagian besar hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan suite penuh lokal yang lebih cepat di mesin yang lega: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung kini juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan run bertarget terlebih dahulu saat Anda mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Jalur QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan ekstra:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (membutuhkan kredensial nyata):

- Suite live (model + probe alat/gambar Gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model terpilih kini menjalankan satu giliran teks ditambah probe kecil bergaya baca-file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan satu giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan provider.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker
    terpisah yang di-shard berdasarkan provider.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret provider bernilai sinyal tinggi baru ke `scripts/ci-hydrate-live-auth.sh`
    serta `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan
    pemanggil terjadwal/rilisnya.
- Smoke chat terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan jalur live Docker terhadap path app-server Codex, mengikat DM
    Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui binding plugin native alih-alih ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness app-server Codex milik plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe gambar,
    cron MCP, sub-agen, dan Guardian. Nonaktifkan probe sub-agen dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan
    app-server Codex lainnya. Untuk pemeriksaan sub-agen terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in berlapis untuk permukaan perintah penyelamatan kanal pesan.
    Ini menjalankan `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/konfigurasi.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam kontainer tanpa konfigurasi dengan CLI Claude palsu di `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi penulisan konfigurasi
    bertipe yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Memulai dari direktori state OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan penulisan setup/model/agen/plugin Discord + SecretRef,
    memvalidasi konfigurasi, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya membutuhkan satu kasus gagal, utamakan mempersempit pengujian live melalui variabel env allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah ini berada berdampingan dengan suite pengujian utama saat Anda membutuhkan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. `Parity gate` berjalan pada PR yang cocok dan
dari dispatch manual dengan provider tiruan. `QA-Lab - All Lanes` berjalan setiap malam di
`main` dan dari dispatch manual dengan gate paritas tiruan, jalur Matrix live,
jalur Telegram live yang dikelola Convex, dan jalur Discord live yang dikelola Convex sebagai
job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix `--profile fast`
secara eksplisit, sementara CLI Matrix dan input workflow manual tetap default
`all`; dispatch manual dapat memecah `all` menjadi job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release Checks` menjalankan paritas plus
jalur Matrix dan Telegram cepat sebelum persetujuan rilis, menggunakan
`mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap deterministik
dan menghindari startup plugin provider normal. Gateway transport live ini menonaktifkan
pencarian memori; perilaku memori tetap dicakup oleh suite paritas QA.

Shard media live rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit terpilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan worker
    gateway terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario terpilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    worker, atau `--concurrency 1` untuk jalur serial lama.
  - Keluar non-nol saat skenario mana pun gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan
    fixture eksperimental dan protocol-mock tanpa menggantikan jalur
    `mock-openai` yang sadar skenario.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup gateway plus paket kecil skenario QA Lab tiruan
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat direkam sebagai metrik
    tanpa terlihat seperti regresi gateway peg berdurasi menit.
  - Menggunakan artefak `dist` yang telah dibangun; jalankan build terlebih dahulu saat checkout belum
    memiliki output runtime baru.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Menjaga perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan ulang flag pemilihan provider/model yang sama seperti `qa suite`.
  - Run live meneruskan input auth QA yang didukung dan praktis untuk guest:
    key provider berbasis env, path konfigurasi provider live QA, dan `CODEX_HOME`
    saat ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis kembali melalui
    workspace yang dipasang.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi runtime plugin terpaket dimuat tanpa perbaikan
    dependensi startup, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap
    endpoint OpenAI tiruan.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan jalur packaged-install
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi terbangun yang deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipertahankan sebagai
    pesan kustom non-tampilan alih-alih bocor ke giliran pengguna yang terlihat,
    lalu men-seed JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke cabang aktif dengan cadangan.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan onboarding paket terpasang,
    mengonfigurasi Telegram melalui CLI terpasang, lalu menggunakan ulang jalur QA Telegram
    live dengan paket terpasang tersebut sebagai Gateway SUT.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah di-resolve alih-alih
    menginstal dari registry.
  - Menggunakan kredensial env Telegram atau sumber kredensial Convex yang sama seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menimpa
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk jalur ini.
  - GitHub Actions mengekspos jalur ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow menggunakan environment
    `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk side-run
  terhadap satu kandidat paket. Ini menerima ref tepercaya, spesifikasi npm terpublikasi,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  scheduler Docker E2E yang sudah ada dengan profil jalur smoke, package, product, full, atau custom.
  Setel `telegram_mode=mock-openai` atau `live-frontier` untuk menjalankan workflow QA
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
  - Mengemas dan memasang build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/plugin bawaan melalui pengeditan
    config.
  - Memverifikasi bahwa penemuan setup membiarkan plugin unduhan yang belum dikonfigurasi tetap tidak ada,
    repair doctor pertama yang dikonfigurasi memasang setiap plugin unduhan yang hilang
    secara eksplisit, dan restart kedua tidak menjalankan repair dependency
    tersembunyi.
  - Juga memasang baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi doctor pasca-update kandidat
    membersihkan sisa dependency plugin legacy tanpa repair postinstall
    dari sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke update install terpaket native di seluruh guest Parallels. Setiap
    platform yang dipilih pertama-tama memasang package baseline yang diminta, lalu menjalankan
    perintah `openclaw update` yang terpasang di guest yang sama dan memverifikasi
    versi terpasang, status update, kesiapan gateway, dan satu giliran agent
    lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    mengiterasi pada satu guest. Gunakan `--json` untuk path artefak ringkasan dan
    status per lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agent live secara
    default. Berikan `--model <provider/model>` atau setel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` saat sengaja memvalidasi model
    OpenAI lain.
  - Bungkus run lokal yang panjang dalam timeout host agar macetnya transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script menulis log lane bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap wrapper luar macet.
  - Update Windows dapat menghabiskan 10 hingga 15 menit dalam doctor pasca-update dan pekerjaan
    update package pada guest dingin; itu masih sehat ketika log debug npm
    bertingkat terus bergerak.
  - Jangan jalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Semuanya berbagi state VM dan dapat bertabrakan pada
    restore snapshot, penyajian package, atau state gateway guest.
  - Bukti pasca-update menjalankan permukaan plugin bawaan normal karena
    facade capability seperti speech, image generation, dan media
    understanding dimuat melalui API runtime bawaan bahkan ketika giliran agent
    itu sendiri hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server provider AIMock lokal untuk pengujian smoke protokol
    langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel sekali pakai yang didukung Docker. Hanya source-checkout — install terpaket tidak mengirimkan `qa-lab`.
  - CLI lengkap, katalog profile/scenario, env vars, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat sungguhan menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial pool bersama. Gunakan mode env secara default, atau setel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut menggunakan lease pool.
  - Keluar non-zero saat scenario mana pun gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa exit code gagal.
  - Memerlukan dua bot berbeda di grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati traffic bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak observed-messages di bawah `.artifacts/qa-e2e/...`. Scenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang teramati.

Lane transport live berbagi satu kontrak standar agar transport baru tidak menyimpang; matriks cakupan per lane berada di [Ikhtisar QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA lab memperoleh lease eksklusif dari pool yang didukung Convex, melakukan Heartbeat
lease tersebut selama lane berjalan, dan melepas lease saat shutdown.

Scaffold project Convex referensi:

- `qa/convex-credential-broker/`

Env vars yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk role yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan role kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, jika tidak `maintainer`)

Env vars opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex `http://` loopback untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (pool add/remove/list) secara khusus memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum run live untuk memeriksa URL situs Convex, secret broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/list tanpa mencetak
nilai secret. Gunakan `--json` untuk output yang dapat dibaca mesin di script dan utilitas
CI.

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
- `POST /admin/add` (khusus secret maintainer)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (khusus secret maintainer)
  - Permintaan: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Guard lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (khusus secret maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string ID chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang tidak valid.

### Menambahkan channel ke QA

Arsitektur dan nama helper scenario untuk adapter channel baru berada di [Ikhtisar QA → Menambahkan channel](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` dalam manifest plugin, mount sebagai `openclaw qa <runner>`, dan tulis scenario di bawah `qa/scenarios/`.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite sebagai “realisme yang meningkat” (dan flakiness/biaya yang meningkat):

### Unit / integration (default)

- Perintah: `pnpm test`
- Config: run tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-project menjadi config per-project untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integration dalam proses (auth gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader public-surface harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture plugin kecil yang dihasilkan, bukan
    API source plugin bawaan nyata. Load API plugin nyata termasuk dalam
    suite contract/integration milik plugin.

<AccordionGroup>
  <Accordion title="Project, shard, dan lane tercakup">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses proyek root native yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sedang sibuk dan mencegah pekerjaan auto-reply/extension membuat suite yang tidak terkait kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan grafik proyek root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane yang terskop lebih dulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup penuh proyek root.
    - `pnpm test:changed` memperluas path git yang berubah menjadi lane terskop yang murah secara default: edit test langsung, file saudara `*.test.ts`, pemetaan sumber eksplisit, dan dependen grafik impor lokal. Edit config/setup/package tidak menjalankan test secara luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal pintar normal untuk pekerjaan sempit. Ia mengklasifikasikan diff ke dalam core, test core, extensions, test extension, aplikasi, docs, metadata rilis, tooling live Docker, dan tooling, lalu menjalankan perintah typecheck, lint, dan guard yang sesuai. Ia tidak menjalankan test Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti test. Kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi root yang ditargetkan, dengan guard yang menolak perubahan package di luar field versi tingkat atas.
    - Edit harness live Docker ACP menjalankan pemeriksaan terfokus: sintaks shell untuk script auth live Docker dan dry-run penjadwal live Docker. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, export, versi, dan permukaan package lain tetap menggunakan guard yang lebih luas.
    - Test unit yang ringan impor dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file yang stateful/berat runtime tetap berada pada lane yang ada.
    - File sumber helper `plugin-sdk` dan `commands` tertentu juga memetakan run mode berubah ke test saudara eksplisit di lane ringan tersebut, sehingga edit helper menghindari menjalankan ulang suite berat penuh untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, test integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya memecah subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket yang berat impor tidak memiliki seluruh ekor Node.
    - CI PR/main normal sengaja melewati sweep batch extension dan shard `agentic-plugins` khusus rilis. Full Release Validation menjalankan workflow anak `Plugin Prerelease` terpisah untuk suite yang berat plugin/extension tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input discovery message-tool atau konteks runtime
      compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi
      murni.
    - Jaga agar suite integrasi runner tertanam tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id terskop dan perilaku compaction tetap mengalir
      melalui path `run.ts` / `compact.ts` yang sebenarnya; test khusus helper saja
      bukan pengganti yang memadai untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Config Vitest dasar default ke `threads`.
    - Config Vitest bersama menetapkan `isolate: false` dan menggunakan
      runner non-terisolasi di seluruh proyek root, e2e, dan config live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom` miliknya, tetapi juga berjalan pada
      runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari config Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node anak Vitest
      secara default untuk mengurangi churn kompilasi V8 selama run lokal besar.
      Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku V8
      standar.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh diff.
    - Hook pre-commit hanya untuk formatting. Ia men-stage ulang file yang diformat dan
      tidak menjalankan lint, typecheck, atau test.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push ketika Anda
      membutuhkan gate pemeriksaan lokal pintar.
    - `pnpm test:changed` dirutekan melalui lane terskop yang murah secara default. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agent
      memutuskan bahwa edit harness, config, package, atau kontrak benar-benar memerlukan
      cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing
      yang sama, hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mundur
      ketika rata-rata beban host sudah tinggi, sehingga beberapa run Vitest bersamaan
      secara default menimbulkan lebih sedikit dampak.
    - Config Vitest dasar menandai proyek/file config sebagai
      `forceRerunTriggers` sehingga rerun mode berubah tetap benar ketika wiring test
      berubah.
    - Config mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada host yang didukung;
      setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
      output rincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data timing shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Run seluruh config menggunakan path config sebagai kunci; shard CI include-pattern
      menambahkan nama shard sehingga shard terfilter dapat dilacak
      secara terpisah.
    - Ketika satu test panas masih menghabiskan sebagian besar waktunya pada impor startup,
      simpan dependensi berat di balik seam lokal `*.runtime.ts` yang sempit dan
      mock seam itu secara langsung alih-alih melakukan deep-import helper runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan path proyek root native untuk diff yang sudah di-commit itu
      dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark terhadap tree kotor saat ini
      dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan config Vitest root.
    - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Perintah: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara default
  - Menggerakkan churn pesan gateway sintetis, memori, dan payload besar melalui path event diagnostik
  - Mengueri `diagnostics.stability` melalui Gateway WS RPC
  - Mencakup helper persistensi bundle stabilitas diagnostik
  - Memastikan recorder tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi kembali terkuras ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa kunci
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan test E2E bundled-plugin di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: default 1).
  - Berjalan dalam mode silent secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi pada 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan ulang output konsol verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan networking yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan kunci nyata
  - Lebih banyak bagian bergerak dibanding test unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + exec SSH
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway dan sandbox test
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan test saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI non-default atau script wrapper

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan test live bundled-plugin di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, kekhasan tool-calling, masalah auth, dan perilaku batas laju
- Ekspektasi:
  - Tidak stabil untuk CI secara desain (jaringan nyata, kebijakan provider nyata, kuota, outage)
  - Menghabiskan uang / menggunakan batas laju
  - Lebih baik menjalankan subset yang dipersempit daripada “semuanya”
- Run live melakukan source `~/.profile` untuk mengambil API key yang hilang.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin material config/auth ke home test sementara sehingga fixture unit tidak dapat memutasi `~/.openclaw` nyata Anda.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda sengaja membutuhkan test live untuk menggunakan direktori home nyata Anda.
- `pnpm test:live` sekarang default ke mode yang lebih senyap: ia mempertahankan output progres `[live] ...`, tetapi menekan notice tambahan `~/.profile` dan membisukan log bootstrap gateway/obrolan Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda menginginkan log startup penuh kembali.
- Rotasi API key (spesifik provider): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; test mencoba ulang pada respons batas laju.
- Output progres/heartbeat:
  - Suite live sekarang memancarkan baris progres ke stderr sehingga panggilan provider yang lama tampak aktif bahkan ketika capture konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway mengalir langsung selama run live.
  - Sesuaikan heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan Gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya down” / kegagalan khusus penyedia / pemanggilan tool: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness app-server Codex, dan semua pengujian live penyedia media (Deepgram, BytePlus, ComfyUI, gambar, musik, video, harness media) — plus penanganan kredensial untuk run live — lihat [Menguji suite live](/id/help/testing-live). Untuk checklist khusus pembaruan dan validasi Plugin, lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini dibagi menjadi dua bucket:

- Runner model live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang sesuai di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori konfigurasi lokal dan workspace Anda (serta mengambil sumber dari `~/.profile` jika di-mount). Entry point lokal yang sesuai adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker secara default menggunakan batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut ketika Anda
  secara eksplisit menginginkan pemindaian menyeluruh yang lebih besar.
- `test:docker:all` membangun image Docker live satu kali melalui `test:docker:live-build`, mengemas OpenClaw satu kali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan kembali dua image `scripts/e2e/Dockerfile`. Image bare hanyalah runner Node/Git untuk lane instalasi/pembaruan/dependensi Plugin; lane tersebut me-mount tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas aplikasi yang dibangun. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi plan yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas resource mencegah lane live berat, npm-install, dan multi-service dimulai bersamaan. Jika satu lane lebih berat daripada batas aktif, scheduler tetap dapat memulainya ketika pool kosong lalu menjalankannya sendirian hingga kapasitas tersedia lagi. Default-nya 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya ketika host Docker memiliki ruang lebih. Runner menjalankan preflight Docker secara default, menghapus container OpenClaw E2E yang kedaluwarsa, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih lama terlebih dahulu pada run berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifest lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak plan CI bagi lane yang dipilih, kebutuhan paket/image, dan kredensial.
- `Package Acceptance` adalah gate paket native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Gate ini menyelesaikan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane Docker E2E reusable terhadap tarball persis itu alih-alih mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan keluasan: `smoke`, `package`, `product`, dan `full`. Lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins) untuk kontrak paket/pembaruan/Plugin, matriks survivor published-upgrade, default rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri graph build statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi paket seperti Commander, UI prompt, undici, atau logging sebelum dispatch command; guard juga menjaga chunk run Gateway yang dibundel tetap di bawah anggaran dan menolak import statis dari path Gateway cold yang dikenal. Smoke CLI terpaket juga mencakup root help, onboard help, doctor help, status, skema config, dan command daftar model.
- Kompatibilitas legacy Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga cutoff tersebut, harness hanya menoleransi celah metadata paket yang sudah dikirim: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` yang tidak dipersistenkan, lokasi install-record Plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi metadata config selama `plugins update`. Untuk paket setelah `2026.4.25`, path tersebut menjadi kegagalan ketat.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, dan `test:docker:config-reload` mem-boot satu atau beberapa container nyata dan memverifikasi path integrasi tingkat lebih tinggi.

Runner Docker model live juga hanya bind-mount home auth CLI yang dibutuhkan (atau semua yang didukung ketika run tidak dipersempit), lalu menyalinnya ke home container sebelum run agar OAuth CLI eksternal dapat me-refresh token tanpa memutasi auth store host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Uji asap pengikatan ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Uji asap backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Uji asap rangkaian aplikasi-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen pengembang: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Uji asap observabilitas: `pnpm qa:otel:smoke` adalah lajur pemeriksaan sumber QA privat. Ini sengaja bukan bagian dari lajur rilis Docker paket karena tarball npm tidak menyertakan QA Lab.
- Uji asap langsung Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wisaya onboarding (TTY, scaffolding lengkap): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Uji asap onboarding/saluran/agen tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` memasang tarball OpenClaw yang sudah dikemas secara global di Docker, mengonfigurasi OpenAI melalui onboarding rujukan-env ditambah Telegram secara default, menjalankan doctor, dan menjalankan satu putaran agen OpenAI tiruan. Gunakan ulang tarball yang sudah dibuat dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati pembangunan ulang host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti saluran dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Uji asap pergantian saluran pembaruan: `pnpm test:docker:update-channel-switch` memasang tarball OpenClaw yang sudah dikemas secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi saluran tersimpan dan kerja plugin pascapembaruan, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Uji asap penyintas peningkatan: `pnpm test:docker:upgrade-survivor` memasang tarball OpenClaw yang sudah dikemas di atas perlengkapan pengguna lama yang kotor dengan agen, konfigurasi saluran, daftar izin plugin, status dependensi plugin usang, dan berkas ruang kerja/sesi yang sudah ada. Ini menjalankan pembaruan paket ditambah doctor noninteraktif tanpa penyedia langsung atau kunci saluran, lalu memulai Gateway loopback dan memeriksa pelestarian konfigurasi/status ditambah anggaran startup/status.
- Uji asap penyintas peningkatan terbitan: `pnpm test:docker:published-upgrade-survivor` memasang `openclaw@latest` secara default, menyemai berkas pengguna yang sudah ada secara realistis, mengonfigurasi baseline itu dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui pemasangan terbitan itu ke tarball kandidat, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent yang dikonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, dan anggaran status RPC. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta penjadwal agregat memperluas baseline persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, dan perluas perlengkapan berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`.
- Uji asap konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi ditambah perbaikan doctor untuk cabang penulisan ulang prompt terduplikasi yang terdampak.
- Uji asap pemasangan global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas pohon saat ini, memasangnya dengan `bun install -g` di beranda terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih macet. Gunakan ulang tarball yang sudah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati pembangunan host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Uji asap Docker pemasang: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di antara kontainer root, pembaruan, dan direct-npm miliknya. Uji asap pembaruan secara default memakai npm `latest` sebagai baseline stabil sebelum meningkatkan ke tarball kandidat. Timpa dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan masukan `update_baseline_version` milik alur kerja Install Smoke di GitHub. Pemeriksaan pemasang non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku pemasangan lokal pengguna. Tetapkan `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan ulang cache root/pembaruan/direct-npm di seluruh pengulangan lokal.
- Install Smoke CI melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env itu saat cakupan `npm install -g` langsung diperlukan.
- Uji asap CLI agen menghapus ruang kerja bersama: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membangun image Dockerfile root secara default, menyemai dua agen dengan satu ruang kerja dalam beranda kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid ditambah perilaku ruang kerja yang dipertahankan. Gunakan ulang image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua kontainer, autentikasi WS + kesehatan): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Uji asap snapshot CDP peramban: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber ditambah lapisan Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, elemen dapat diklik yang dipromosikan kursor, rujukan iframe, dan metadata frame.
- Regresi penalaran minimal OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan skema penyedia dan memeriksa detail mentah muncul di log Gateway.
- Jembatan saluran MCP (Gateway tersemai + jembatan stdio + uji asap frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Alat MCP bundel Pi (server MCP stdio nyata + uji asap izinkan/tolak profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + pembongkaran turunan MCP stdio setelah cron terisolasi dan eksekusi subagen sekali-jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (uji asap pemasangan/pembaruan untuk jalur lokal, `file:`, registri npm dengan dependensi dinaikkan, ref git bergerak, ClawHub serba-ada, pembaruan marketplace, dan aktifkan/periksa bundel Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Tetapkan `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan paket/runtime serba-ada default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian memakai server perlengkapan ClawHub lokal yang hermetis.
- Uji asap pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Uji asap metadata muat ulang konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` mencakup uji asap pemasangan/pembaruan untuk jalur lokal, `file:`, registri npm dengan dependensi dinaikkan, ref git bergerak, perlengkapan ClawHub, pembaruan marketplace, dan aktifkan/periksa bundel Claude. `pnpm test:docker:plugin-update` mencakup perilaku pembaruan tanpa perubahan untuk plugin yang terpasang.

Untuk membangun lebih dulu dan menggunakan ulang image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Timpa image khusus rangkaian seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat ditetapkan. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip menariknya jika belum ada secara lokal. Pengujian QR dan Docker pemasang mempertahankan Dockerfile sendiri karena pengujian itu memvalidasi perilaku paket/pemasangan, bukan runtime aplikasi-terbangun bersama.

Runner Docker model langsung juga melakukan bind-mount checkout saat ini sebagai hanya-baca dan
menyiapkannya ke workdir sementara di dalam kontainer. Ini menjaga image runtime
tetap ramping sekaligus tetap menjalankan Vitest terhadap sumber/konfigurasi lokal persis milik Anda.
Langkah penyiapan melewati cache besar yang hanya lokal dan keluaran build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori `.build` lokal aplikasi atau
keluaran Gradle agar eksekusi langsung Docker tidak menghabiskan menit-menit untuk menyalin
artefak khusus mesin.
Runner itu juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` agar probe langsung gateway tidak memulai
pekerja saluran Telegram/Discord/dll. nyata di dalam kontainer.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan langsung gateway
dari lajur Docker itu.
`test:docker:openwebui` adalah uji asap kompatibilitas tingkat lebih tinggi: ini memulai
kontainer gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai kontainer Open WebUI yang dipin terhadap gateway itu, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan obrolan nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Eksekusi pertama dapat terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan penyiapan cold-start miliknya sendiri.
Lajur ini mengharapkan kunci model langsung yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam eksekusi terdockerisasi.
Eksekusi berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage nyata. Ini mem-boot kontainer Gateway tersemai,
memulai kontainer kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan terarah, pembacaan transkrip, metadata lampiran,
perilaku antrean peristiwa langsung, perutean kirim keluar, serta notifikasi saluran +
izin bergaya Claude melalui jembatan MCP stdio nyata. Pemeriksaan notifikasi
memeriksa frame MCP stdio mentah secara langsung sehingga uji asap memvalidasi apa yang
benar-benar dipancarkan jembatan, bukan hanya apa yang kebetulan ditampilkan SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan kunci model langsung.
Ini membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam kontainer, mewujudkan server itu melalui runtime MCP bundel Pi tertanam,
mengeksekusi alat, lalu memverifikasi `coding` dan `messaging` mempertahankan
alat `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan kunci model langsung.
Ini memulai Gateway tersemai dengan server probe MCP stdio nyata, menjalankan
putaran cron terisolasi dan putaran turunan sekali-jalan `/subagents spawn`, lalu memverifikasi
proses turunan MCP keluar setelah setiap eksekusi.

Uji asap thread ACP bahasa alami manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi perutean thread ACP, jadi jangan hapus.

Variabel env yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) dipasang ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) dipasang ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) dipasang ke `/home/node/.profile` dan di-`source` sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env vars yang di-`source` dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount autentikasi CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) dipasang ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file autentikasi CLI eksternal di bawah `$HOME` dipasang hanya-baca di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Proses penyedia yang dipersempit hanya memasang direktori/file yang diperlukan yang disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar dipisahkan koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit proses
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter penyedia di dalam kontainer
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang sudah ada untuk proses ulang yang tidak memerlukan build ulang
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh Gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang di-pin

## Pemeriksaan kewarasan docs

Jalankan pemeriksaan docs setelah pengeditan dokumen: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga memerlukan pemeriksaan heading di dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa penyedia nyata:

- Pemanggilan alat Gateway (mock OpenAI, Gateway nyata + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis config + autentikasi ditegakkan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agen (skills)

Kita sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti “evaluasi keandalan agen”:

- Pemanggilan alat mock melalui Gateway nyata + loop agen (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat skills tercantum di prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak workflow:** skenario multi-turn yang menegaskan urutan alat, penerusan riwayat sesi, dan batas sandbox.

Evaluasi mendatang harus tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan penyedia mock untuk menegaskan pemanggilan alat + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, prompt injection).
- Evaluasi live opsional (opt-in, dibatasi env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk plugin dan saluran)

Pengujian kontrak memverifikasi bahwa setiap Plugin dan saluran terdaftar mematuhi
kontrak antarmukanya. Pengujian ini mengiterasi semua Plugin yang ditemukan dan menjalankan suite
asersi bentuk dan perilaku. Lane unit `pnpm test` default sengaja
melewati file seam bersama dan smoke ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh permukaan saluran atau penyedia bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Kontrak saluran saja: `pnpm test:contracts:channels`
- Kontrak penyedia saja: `pnpm test:contracts:plugins`

### Kontrak saluran

Berada di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk Plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard penyiapan
- **session-binding** - Perilaku binding sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler tindakan saluran
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status penyedia

Berada di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status saluran
- **registry** - Bentuk registry Plugin

### Kontrak penyedia

Berada di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur autentikasi
- **auth-choice** - Pilihan/seleksi autentikasi
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime penyedia
- **shape** - Bentuk/antarmuka Plugin
- **wizard** - Wizard penyiapan

### Kapan dijalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi Plugin saluran atau penyedia
- Setelah melakukan refactor pendaftaran atau penemuan Plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan kunci API nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah penyedia/model yang ditemukan secara live:

- Tambahkan regresi aman untuk CI jika memungkinkan (penyedia mock/stub, atau tangkap transformasi bentuk permintaan yang persis)
- Jika secara inheren hanya live (batas laju, kebijakan autentikasi), pertahankan pengujian live tetap sempit dan opt-in melalui env vars
- Lebih baik menargetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan penyedia → pengujian model langsung
  - bug pipeline sesi/riwayat/alat Gateway → smoke live Gateway atau pengujian mock Gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` memperoleh satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan bahwa exec id segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian itu. Pengujian sengaja gagal pada id target yang tidak diklasifikasikan agar kelas baru tidak bisa dilewati diam-diam.

## Terkait

- [Pengujian live](/id/help/testing-live)
- [Pengujian pembaruan dan Plugin](/id/help/testing-updates-plugins)
- [CI](/id/ci)
