---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk masalah model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Kit pengujian: rangkaian unit/e2e/live, runner Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-05-03T09:17:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
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
**Stack QA (qa-lab, qa-channel, jalur transport live)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) — arsitektur, permukaan perintah, penulisan skenario.
- [QA Matrix](/id/concepts/qa-matrix) — referensi untuk `pnpm openclaw qa matrix`.
- [Kanal QA](/id/channels/qa-channel) — Plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini mencakup menjalankan suite pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([Runner khusus QA](#qa-specific-runners)) mencantumkan invocation `qa` konkret dan mengarah kembali ke referensi di atas.
</Note>

## Mulai cepat

Sebagian besar hari:

- Gate lengkap (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan suite lengkap lokal yang lebih cepat di mesin lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung kini juga merutekan path ekstensi/kanal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan menjalankan target spesifik terlebih dahulu saat Anda mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Jalur QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan ekstra:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug penyedia/model nyata (memerlukan kredensial nyata):

- Suite live (model + probe alat/gambar Gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: dispatch `OpenClaw Performance` dengan
  `live_gpt54=true` untuk giliran agen `openai/gpt-5.4` nyata atau
  `deep_profile=true` untuk artefak CPU/heap/trace Kova. Jalankan terjadwal harian
  memublikasikan artefak jalur penyedia mock, profil mendalam, dan GPT 5.4 ke
  `openclaw/clawgrit-reports` saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi. Laporan
  penyedia mock juga menyertakan angka boot Gateway tingkat sumber, memori,
  tekanan Plugin, hello-loop model palsu berulang, dan startup CLI.
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih kini menjalankan giliran teks plus probe kecil bergaya pembacaan file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan manual
    `OpenClaw Release Checks` keduanya memanggil alur kerja live/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang menyertakan job matriks model live Docker terpisah
    yang di-shard berdasarkan penyedia.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret penyedia baru bernilai sinyal tinggi ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke chat terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan jalur live Docker terhadap path app-server Codex, mengikat DM
    Slack sintetis dengan `/codex bind`, menguji `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui binding Plugin native, bukan ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menguji probe gambar,
    cron MCP, sub-agen, dan Guardian. Nonaktifkan probe sub-agen dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan app-server
    Codex lainnya. Untuk pemeriksaan sub-agen terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in berlapis untuk permukaan perintah penyelamatan kanal pesan.
    Ini menguji `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/konfigurasi.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam kontainer tanpa konfigurasi dengan CLI Claude palsu di `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi penulisan konfigurasi bertipe
    yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Dimulai dari dir state OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan setup/model/agen/Plugin Discord + penulisan SecretRef,
    memvalidasi konfigurasi, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  yang terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya membutuhkan satu kasus gagal, utamakan mempersempit pengujian live melalui env var allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah-perintah ini berada di samping suite pengujian utama saat Anda membutuhkan realisme QA-lab:

CI menjalankan QA Lab dalam alur kerja khusus. Paritas agentik berada di bawah
`QA-Lab - All Lanes` dan validasi rilis, bukan alur kerja PR mandiri.
Validasi luas harus menggunakan `Full Release Validation` dengan
`rerun_group=qa-parity` atau grup QA release-checks. `QA-Lab - All Lanes`
berjalan setiap malam di `main` dan dari dispatch manual dengan jalur paritas mock, jalur
Matrix live, jalur Telegram live yang dikelola Convex, dan jalur Discord live
yang dikelola Convex sebagai job paralel. QA terjadwal dan pemeriksaan rilis meneruskan
Matrix `--profile fast` secara eksplisit, sementara input workflow CLI Matrix dan manual
tetap default ke `all`; dispatch manual dapat melakukan shard `all` menjadi job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release
Checks` menjalankan paritas plus jalur Matrix cepat dan Telegram sebelum persetujuan rilis,
menggunakan `mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap
deterministik dan menghindari startup Plugin penyedia normal. Gateway transport live ini
menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh suite paritas QA.

Shard media live rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit yang dipilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung pada host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan pekerja
    Gateway terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    pekerja, atau `--concurrency 1` untuk lane serial lama.
  - Keluar dengan non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode penyedia `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server penyedia lokal berbasis AIMock untuk cakupan fixture
    dan mock protokol eksperimental tanpa menggantikan lane `mock-openai`
    yang sadar skenario.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup Gateway ditambah paket kecil skenario QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat direkam sebagai metrik
    tanpa tampak seperti regresi Gateway peg yang berlangsung beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu saat checkout belum
    memiliki output runtime yang segar.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
  - Menggunakan kembali flag pemilihan penyedia/model yang sama seperti `qa suite`.
  - Run live meneruskan input auth QA yang didukung dan praktis untuk guest:
    kunci penyedia berbasis env, jalur konfigurasi penyedia live QA, dan `CODEX_HOME`
    saat tersedia.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis kembali melalui
    workspace yang dipasang.
  - Menulis laporan + ringkasan QA normal ditambah log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi runtime plugin yang dipaketkan dimuat tanpa perbaikan
    dependensi startup, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap
    endpoint OpenAI yang dimock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane packaged-install
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi hasil build yang deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipersistensikan sebagai
    pesan kustom non-tampilan alih-alih bocor ke giliran pengguna yang terlihat,
    lalu menanam JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke branch aktif dengan backup.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan onboarding paket terinstal,
    mengonfigurasi Telegram melalui CLI terinstal, lalu menggunakan kembali lane QA Telegram
    live dengan paket terinstal tersebut sebagai SUT Gateway.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah di-resolve alih-alih
    menginstal dari registry.
  - Menggunakan kredensial env Telegram atau sumber kredensial Convex yang sama seperti
    `pnpm openclaw qa telegram`. Untuk otomasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret role. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret role Convex tersedia di CI,
    wrapper Docker memilih Convex secara otomatis.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menimpa
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk lane ini.
  - GitHub Actions mengekspos lane ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow menggunakan
    environment `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk side-run
  terhadap satu kandidat paket. Ini menerima ref tepercaya, spec npm terpublikasi,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  scheduler Docker E2E yang ada dengan profil lane smoke, package, product, full, atau custom.
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

- Bukti URL tarball eksak memerlukan digest:

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
  - Memaketkan dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI dikonfigurasi, lalu mengaktifkan channel/plugin bawaan melalui edit
    konfigurasi.
  - Memverifikasi discovery setup membiarkan plugin unduhan yang belum dikonfigurasi tetap tidak ada,
    perbaikan doctor pertama yang dikonfigurasi menginstal setiap plugin unduhan yang hilang
    secara eksplisit, dan restart kedua tidak menjalankan perbaikan dependensi tersembunyi.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi doctor pascapembaruan kandidat
    membersihkan sisa dependensi plugin legacy tanpa perbaikan postinstall dari sisi
    harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke pembaruan packaged-install native lintas guest Parallels. Setiap
    platform terpilih terlebih dahulu menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` terinstal di guest yang sama dan memverifikasi
    versi terinstal, status pembaruan, kesiapan Gateway, dan satu giliran agen lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    melakukan iterasi pada satu guest. Gunakan `--json` untuk jalur artefak ringkasan dan
    status per-lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agen live secara
    default. Berikan `--model <provider/model>` atau setel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` saat sengaja memvalidasi model
    OpenAI lain.
  - Bungkus run lokal panjang dengan timeout host agar stall transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum mengasumsikan wrapper luar macet.
  - Pembaruan Windows dapat menghabiskan 10 hingga 15 menit dalam pekerjaan doctor pascapembaruan dan
    pembaruan paket pada guest dingin; itu masih sehat saat log debug npm
    bertingkat terus berjalan.
  - Jangan menjalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi status VM dan dapat bertabrakan pada
    pemulihan snapshot, penyajian paket, atau status Gateway guest.
  - Bukti pascapembaruan menjalankan permukaan plugin bawaan normal karena
    facade kapabilitas seperti ucapan, pembuatan gambar, dan pemahaman media
    dimuat melalui API runtime bawaan bahkan saat giliran agen itu sendiri
    hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Memulai hanya server penyedia AIMock lokal untuk pengujian smoke protokol
    langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel sekali pakai berbasis Docker. Hanya checkout sumber — install paket tidak menyertakan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, env var, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial pooled bersama. Gunakan mode env secara default, atau setel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut menggunakan lease pooled.
  - Keluar dengan non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Mode Komunikasi Bot-to-Bot di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati traffic bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak pesan yang diamati di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang diamati.

Lane transport live berbagi satu kontrak standar agar transport baru tidak menyimpang; matriks cakupan per-lane berada di [ikhtisar QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, lab QA memperoleh lease eksklusif dari pool berbasis Convex, mengirim Heartbeat
untuk lease tersebut saat lane berjalan, dan melepaskan lease saat shutdown.

Scaffold proyek Convex rujukan:

- `qa/convex-credential-broker/`

Env var wajib:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk role yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan role kredensial:
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
nilai secret. Gunakan `--json` untuk output yang dapat dibaca mesin dalam skrip dan utilitas
CI.

Kontrak endpoint bawaan (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Penjaga lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya rahasia maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string id chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang salah bentuk.

### Menambahkan saluran ke QA

Arsitektur dan nama helper skenario untuk adapter saluran baru ada di [Gambaran umum QA → Menambahkan saluran](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimumnya: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` dalam manifes plugin, mount sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite sebagai “realisme yang meningkat” (dan flakiness/biaya yang meningkat):

### Unit / integrasi (bawaan)

- Perintah: `pnpm test`
- Konfigurasi: proses tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi konfigurasi per proyek untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan dalam shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (auth gateway, perutean, tooling, parsing, konfigurasi)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture plugin kecil yang dihasilkan, bukan
    API sumber plugin bundel nyata. Pemuatan API plugin nyata berada di
    suite kontrak/integrasi milik plugin.

<AccordionGroup>
  <Accordion title="Proyek, shard, dan lane bercakupan">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses proyek-root native yang besar. Ini mengurangi RSS puncak pada mesin yang sibuk dan mencegah pekerjaan auto-reply/extension membuat suite yang tidak terkait kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan grafik proyek root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane bercakupan terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup proyek root penuh.
    - `pnpm test:changed` memperluas path git yang berubah menjadi lane bercakupan murah secara bawaan: edit pengujian langsung, file sibling `*.test.ts`, pemetaan sumber eksplisit, dan dependensi grafik impor lokal. Edit konfigurasi/setup/paket tidak menjalankan pengujian secara luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal cerdas normal untuk pekerjaan sempit. Ini mengklasifikasikan diff menjadi core, pengujian core, extensions, pengujian extension, apps, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan typecheck, lint, dan perintah guard yang sesuai. Ini tidak menjalankan pengujian Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian. Kenaikan versi yang hanya metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi-root bertarget, dengan guard yang menolak perubahan paket di luar field versi tingkat atas.
    - Edit harness ACP Docker live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip auth Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, ekspor, versi, dan permukaan paket lainnya tetap menggunakan guard yang lebih luas.
    - Pengujian unit ringan impor dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/berat runtime tetap berada di lane yang ada.
    - File sumber helper `plugin-sdk` dan `commands` terpilih juga memetakan proses mode-changed ke pengujian sibling eksplisit di lane ringan tersebut, sehingga edit helper menghindari menjalankan ulang suite berat penuh untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya memisahkan subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket berat impor tidak memiliki seluruh ekor Node.
    - CI PR/main normal dengan sengaja melewati sweep batch extension dan shard `agentic-plugins` khusus rilis. Full Release Validation mengirim workflow anak `Plugin Prerelease` terpisah untuk suite berat plugin/extension tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input penemuan message-tool atau konteks runtime
      compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas perutean dan normalisasi
      murni.
    - Jaga suite integrasi runner tertanam tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id bercakupan dan perilaku compaction tetap mengalir
      melalui jalur `run.ts` / `compact.ts` nyata; pengujian khusus helper
      bukan pengganti yang cukup untuk jalur integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Konfigurasi Vitest dasar menggunakan `threads` secara bawaan.
    - Konfigurasi Vitest bersama menetapkan `isolate: false` dan menggunakan
      runner non-terisolasi di seluruh proyek root, e2e, dan konfigurasi live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`, tetapi juga berjalan pada
      runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari konfigurasi Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node anak
      Vitest secara bawaan untuk mengurangi churn kompilasi V8 selama proses lokal besar.
      Atur `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku V8
      stok.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menunjukkan lane arsitektural mana yang dipicu oleh diff.
    - Hook pre-commit hanya untuk pemformatan. Hook ini men-stage ulang file yang diformat dan
      tidak menjalankan lint, typecheck, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push ketika Anda
      memerlukan gate pemeriksaan lokal cerdas.
    - `pnpm test:changed` merutekan melalui lane bercakupan murah secara bawaan. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agen
      memutuskan bahwa edit harness, konfigurasi, paket, atau kontrak benar-benar memerlukan
      cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku perutean
      yang sama, hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mundur
      ketika rata-rata beban host sudah tinggi, sehingga beberapa proses
      Vitest bersamaan menimbulkan dampak lebih kecil secara bawaan.
    - Konfigurasi Vitest dasar menandai file proyek/konfigurasi sebagai
      `forceRerunTriggers` sehingga rerun mode-changed tetap benar ketika wiring
      pengujian berubah.
    - Konfigurasi mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada host
      yang didukung; atur `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging perf">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
      output perincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data waktu shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Proses seluruh konfigurasi menggunakan path konfigurasi sebagai kunci; shard CI
      berpola include menambahkan nama shard sehingga shard yang difilter dapat dilacak
      secara terpisah.
    - Ketika satu pengujian panas masih menghabiskan sebagian besar waktunya pada impor startup,
      tempatkan dependensi berat di balik seam lokal sempit `*.runtime.ts` dan
      mock seam itu secara langsung alih-alih melakukan deep-import helper runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan jalur proyek-root native untuk diff commit
      tersebut dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark tree kotor
      saat ini dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan konfigurasi Vitest root.
    - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Perintah: `pnpm test:stability:gateway`
- Konfigurasi: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara bawaan
  - Mendorong churn pesan gateway sintetis, memori, dan payload besar melalui jalur event diagnostik
  - Mengkueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundel stabilitas diagnostik
  - Menegaskan bahwa recorder tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi terkuras kembali ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa kunci
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Konfigurasi: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E plugin bundel di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara bawaan).
  - Berjalan dalam mode senyap secara bawaan untuk mengurangi overhead I/O konsol.
- Override berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi pada 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan kunci nyata
  - Lebih banyak bagian bergerak dibanding pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- Berkas: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai Gateway OpenShell terisolasi di host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + eksekusi SSH
  - Memverifikasi perilaku sistem berkas kanonis-jarak-jauh melalui jembatan fs sandbox
- Ekspektasi:
  - Hanya ikut-serta; bukan bagian dari proses `pnpm test:e2e` default
  - Memerlukan CLI `openshell` lokal serta daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan Gateway dan sandbox pengujian
- Override berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI non-default atau skrip wrapper

### Langsung (penyedia nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- Berkas: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian langsung Plugin bawaan di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah penyedia/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format penyedia, kekhasan pemanggilan alat, masalah autentikasi, dan perilaku batas laju
- Ekspektasi:
  - Sengaja tidak stabil untuk CI (jaringan nyata, kebijakan penyedia nyata, kuota, gangguan layanan)
  - Membutuhkan biaya / menggunakan batas laju
  - Lebih baik menjalankan subset yang dipersempit daripada “semuanya”
- Proses langsung memuat `~/.profile` untuk mengambil API key yang hilang.
- Secara default, proses langsung tetap mengisolasi `HOME` dan menyalin materi konfigurasi/autentikasi ke home pengujian sementara agar fixture unit tidak dapat memutasi `~/.openclaw` nyata Anda.
- Tetapkan `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda sengaja membutuhkan pengujian langsung untuk menggunakan direktori home nyata Anda.
- `pnpm test:live` sekarang default ke mode yang lebih senyap: ini mempertahankan keluaran progres `[live] ...`, tetapi menekan pemberitahuan `~/.profile` tambahan dan membisukan log bootstrap Gateway/percakapan Bonjour. Tetapkan `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup lengkap kembali.
- Rotasi API key (spesifik penyedia): tetapkan `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-langsung melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba ulang pada respons batas laju.
- Keluaran progres/Heartbeat:
  - Suite langsung sekarang memancarkan baris progres ke stderr sehingga panggilan penyedia yang panjang terlihat aktif meskipun penangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres penyedia/Gateway mengalir langsung selama proses langsung.
  - Sesuaikan Heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan Heartbeat Gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan Gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya mati” / kegagalan spesifik penyedia / pemanggilan alat: jalankan `pnpm test:live` yang dipersempit

## Pengujian langsung (menyentuh jaringan)

Untuk matriks model langsung, smoke backend CLI, smoke ACP, harness app-server Codex, dan semua pengujian langsung penyedia media (Deepgram, BytePlus, ComfyUI, gambar, musik, video, harness media) — plus penanganan kredensial untuk proses langsung — lihat [Menguji suite langsung](/id/help/testing-live). Untuk daftar periksa pembaruan khusus dan validasi Plugin, lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model langsung: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan berkas langsung kunci-profil yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan memasang direktori konfigurasi lokal dan workspace Anda (dan memuat `~/.profile` jika dipasang). Entry point lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner langsung Docker default ke batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut ketika Anda
  secara eksplisit menginginkan pemindaian lengkap yang lebih besar.
- `test:docker:all` membangun image Docker langsung sekali melalui `test:docker:live-build`, mengemas OpenClaw sekali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image polos hanya runner Node/Git untuk lane install/update/plugin-dependency; lane tersebut memasang tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas app yang dibangun. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` menjalankan rencana yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas sumber daya mencegah lane langsung berat, npm-install, dan multi-service semuanya dimulai sekaligus. Jika satu lane lebih berat daripada batas aktif, scheduler tetap dapat memulainya saat pool kosong lalu membiarkannya berjalan sendiri sampai kapasitas tersedia lagi. Defaultnya adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya ketika host Docker memiliki ruang tambahan. Runner menjalankan preflight Docker secara default, menghapus container OpenClaw E2E usang, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih panjang terlebih dahulu pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI bagi lane terpilih, kebutuhan paket/image, dan kredensial.
- `Package Acceptance` adalah gate paket native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Ini menyelesaikan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane Docker E2E reusable terhadap tarball persis itu alih-alih mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan keluasan: `smoke`, `package`, `product`, dan `full`. Lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins) untuk kontrak paket/pembaruan/Plugin, matriks penyintas published-upgrade, default rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri grafik build statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi paket seperti Commander, UI prompt, undici, atau logging sebelum dispatch perintah; guard juga menjaga chunk jalankan Gateway yang dibundel tetap dalam anggaran dan menolak impor statis dari jalur Gateway dingin yang diketahui. Smoke CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema config, dan perintah daftar model.
- Kompatibilitas legacy Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga batas itu, harness hanya menoleransi celah metadata paket yang sudah dikirim: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, berkas patch yang hilang di fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi install-record Plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi metadata config selama `plugins update`. Untuk paket setelah `2026.4.25`, jalur tersebut menjadi kegagalan ketat.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` mem-boot satu atau beberapa container nyata dan memverifikasi jalur integrasi tingkat lebih tinggi.

Runner Docker model langsung juga bind-mount hanya home auth CLI yang diperlukan (atau semua yang didukung ketika proses tidak dipersempit), lalu menyalinnya ke home container sebelum proses berjalan sehingga OAuth CLI eksternal dapat menyegarkan token tanpa memutasi penyimpanan auth host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode yang ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness server aplikasi Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observabilitas: `pnpm qa:otel:smoke` adalah lane checkout sumber QA privat. Ini sengaja bukan bagian dari lane rilis Docker paket karena tarball npm tidak menyertakan QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding lengkap): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agen tarball npm: `pnpm test:docker:npm-onboard-channel-agent` memasang tarball OpenClaw yang sudah dikemas secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, menjalankan doctor, dan menjalankan satu giliran agen OpenAI tiruan. Gunakan kembali tarball yang sudah dibuat dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke pergantian channel pembaruan: `pnpm test:docker:update-channel-switch` memasang tarball OpenClaw yang sudah dikemas secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipertahankan dan kerja plugin pascapembaruan, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke penyintas upgrade: `pnpm test:docker:upgrade-survivor` memasang tarball OpenClaw yang sudah dikemas di atas fixture pengguna lama yang kotor dengan agen, konfigurasi channel, daftar izin plugin, status dependensi plugin usang, dan file workspace/session yang ada. Ini menjalankan pembaruan paket plus doctor non-interaktif tanpa kunci provider atau channel live, lalu memulai Gateway loopback dan memeriksa pelestarian konfigurasi/status plus anggaran startup/status.
- Smoke penyintas upgrade terpublikasi: `pnpm test:docker:published-upgrade-survivor` memasang `openclaw@latest` secara default, menanam file pengguna yang ada secara realistis, mengonfigurasi baseline itu dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi terpublikasi itu ke tarball kandidat, menjalankan doctor non-interaktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent yang dikonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, dan anggaran status RPC. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta scheduler agregat memperluas baseline eksak dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `all-since-2026.4.23`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; set reported-issues menyertakan `configured-plugin-installs` untuk perbaikan pemasangan plugin OpenClaw eksternal otomatis. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`.
- Smoke konteks runtime session: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor untuk cabang penulisan ulang prompt terdampak yang terduplikasi.
- Smoke pemasangan global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas tree saat ini, memasangnya dengan `bun install -g` dalam home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan provider gambar bawaan alih-alih menggantung. Gunakan kembali tarball yang sudah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh container root, update, dan direct-npm. Smoke pembaruan default ke npm `latest` sebagai baseline stabil sebelum upgrade ke tarball kandidat. Timpa dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` workflow Install Smoke di GitHub. Pemeriksaan installer non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku pemasangan lokal pengguna. Setel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/update/direct-npm di rerun lokal.
- CI Install Smoke melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env itu saat cakupan langsung `npm install -g` diperlukan.
- Smoke CLI hapus workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membangun image Dockerfile root secara default, menanam dua agen dengan satu workspace dalam home container terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku workspace yang dipertahankan. Gunakan kembali image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua container, auth WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber plus layer Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Regresi reasoning minimal web_search OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan skema provider dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway yang ditanam + bridge stdio + smoke frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundle Pi (server MCP stdio nyata + smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagent (Gateway nyata + teardown child MCP stdio setelah cron terisolasi dan run subagent sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke install/update untuk path lokal, `file:`, registry npm dengan dependensi hoisted, ref git bergerak, kitchen-sink ClawHub, pembaruan marketplace, dan aktifkan/inspeksi bundle Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Setel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan paket/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal hermetik.
- Smoke pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks siklus hidup Plugin: `pnpm test:docker:plugin-lifecycle-matrix` memasang tarball OpenClaw yang sudah dikemas dalam container polos, memasang plugin npm, mengubah aktif/nonaktif, meng-upgrade dan men-downgrade-nya melalui registry npm lokal, menghapus kode yang terpasang, lalu memverifikasi uninstall masih menghapus status usang sambil mencatat metrik RSS/CPU untuk setiap fase siklus hidup.
- Smoke metadata muat ulang konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke install/update untuk path lokal, `file:`, registry npm dengan dependensi hoisted, ref git bergerak, fixture ClawHub, pembaruan marketplace, dan aktifkan/inspeksi bundle Claude. `pnpm test:docker:plugin-update` mencakup perilaku pembaruan tanpa perubahan untuk plugin yang terpasang. `pnpm test:docker:plugin-lifecycle-matrix` mencakup pemasangan, pengaktifan, penonaktifan, upgrade, downgrade, dan uninstall kode hilang untuk plugin npm dengan pelacakan resource.

Untuk melakukan prebuild dan menggunakan kembali image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat disetel. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip menariknya jika belum tersedia secara lokal. Pengujian Docker QR dan installer mempertahankan Dockerfile masing-masing karena pengujian itu memvalidasi perilaku paket/pemasangan, bukan runtime aplikasi yang dibangun bersama.

Runner Docker model live juga melakukan bind-mount checkout saat ini sebagai read-only dan
men-stage-nya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda yang persis.
Langkah staging melewati cache lokal-saja yang besar dan output build app seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, dan direktori output `.build` lokal app atau
Gradle agar run live Docker tidak menghabiskan menit-menit untuk menyalin
artefak spesifik mesin.
Runner tersebut juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` agar probe live gateway tidak memulai
worker channel Telegram/Discord/dll. sungguhan di dalam container.
`test:docker:live-models` masih menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live gateway
dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ini memulai
container Gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang dipin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
request chat sungguhan melalui proxy `/api/chat/completions` milik Open WebUI.
Run pertama bisa terasa jauh lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start-nya sendiri.
Lane ini mengharapkan kunci model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run berbasis Docker.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage sungguhan. Ini mem-boot container Gateway
yang sudah diberi seed, memulai container kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi discovery percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, routing pengiriman outbound, dan notifikasi channel +
izin bergaya Claude melalui bridge MCP stdio sungguhan. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
benar-benar dipancarkan bridge, bukan sekadar apa yang kebetulan diekspos SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` deterministik dan tidak memerlukan kunci model
live. Ini membangun image Docker repo, memulai server probe MCP stdio sungguhan
di dalam container, mewujudkan server tersebut melalui runtime MCP bundle Pi
tertanam, mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` deterministik dan tidak memerlukan kunci model
live. Ini memulai Gateway yang sudah diberi seed dengan server probe MCP stdio sungguhan, menjalankan
turn cron terisolasi dan turn child sekali-jalan `/subagents spawn`, lalu memverifikasi
proses child MCP keluar setelah setiap run.

Smoke thread bahasa sederhana ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk workflow regresi/debug. Ini mungkin diperlukan lagi untuk validasi routing thread ACP, jadi jangan hapus.

Env var berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk install CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum test dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya me-mount direktori/file yang diperlukan yang diinferensikan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan kembali image `openclaw:local-live` yang sudah ada untuk rerun yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk meng-override prompt nonce-check yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk meng-override tag image Open WebUI yang dipin

## Sanity dokumentasi

Jalankan pemeriksaan docs setelah edit dokumentasi: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga memerlukan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Pemanggilan tool Gateway (OpenAI mock, gateway + loop agent nyata): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis config + auth ditegakkan): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval reliabilitas agent (skills)

Kita sudah memiliki beberapa test aman untuk CI yang berperilaku seperti “eval reliabilitas agent”:

- Pemanggilan tool mock melalui gateway + loop agent nyata (`src/gateway/gateway.test.ts`).
- Flow wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat skills dicantumkan di prompt, apakah agent memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agent membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak workflow:** skenario multi-turn yang menegaskan urutan tool, carryover riwayat sesi, dan batas sandbox.

Eval mendatang harus tetap deterministik terlebih dahulu:

- Runner skenario menggunakan provider mock untuk menegaskan panggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario berfokus skill (gunakan vs hindari, gating, prompt injection).
- Eval live opsional (opt-in, dibatasi env) hanya setelah suite aman untuk CI tersedia.

## Test kontrak (bentuk plugin dan channel)

Test kontrak memverifikasi bahwa setiap plugin dan channel terdaftar mematuhi
kontrak interface-nya. Test ini mengiterasi semua plugin yang ditemukan dan menjalankan suite
assertion bentuk dan perilaku. Lane unit `pnpm test` default sengaja
melewati file smoke dan seam bersama ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh surface channel atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak channel

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, kapabilitas)
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
- **registry** - Bentuk registry Plugin

### Kontrak provider

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak flow auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Discovery Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/interface Plugin
- **wizard** - Wizard setup

### Kapan menjalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi channel atau provider plugin
- Setelah me-refactor registrasi atau discovery plugin

Test kontrak berjalan di CI dan tidak memerlukan kunci API sungguhan.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan secara live:

- Tambahkan regresi aman untuk CI jika memungkinkan (provider mock/stub, atau tangkap transformasi bentuk request yang persis)
- Jika secara inheren hanya-live (rate limit, kebijakan auth), pertahankan test live tetap sempit dan opt-in melalui env var
- Lebih pilih menargetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay request provider → test model langsung
  - bug pipeline sesi/riwayat/tool gateway → smoke live gateway atau test mock gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam test tersebut. Test sengaja gagal pada id target yang tidak terklasifikasi agar kelas baru tidak dapat dilewati diam-diam.

## Terkait

- [Menguji live](/id/help/testing-live)
- [Menguji update dan plugin](/id/help/testing-updates-plugins)
- [CI](/id/ci)
