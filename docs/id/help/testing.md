---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk bug model/penyedia
    - Mendiagnosis perilaku Gateway + agen
summary: 'Kit pengujian: rangkaian unit/e2e/live, runner Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-04-30T18:38:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, live) dan sekumpulan kecil
runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, pra-push, debugging).
- Bagaimana pengujian live menemukan kredensial dan memilih model/penyedia.
- Bagaimana menambahkan regresi untuk masalah model/penyedia dunia nyata.

<Note>
**Tumpukan QA (qa-lab, qa-channel, jalur transport live)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) — arsitektur, permukaan perintah, penulisan skenario.
- [QA Matriks](/id/concepts/qa-matrix) — referensi untuk `pnpm openclaw qa matrix`.
- [Kanal QA](/id/channels/qa-channel) — plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini mencakup menjalankan suite pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([Runner khusus QA](#qa-specific-runners)) mencantumkan pemanggilan `qa` yang konkret dan merujuk kembali ke referensi di atas.
</Note>

## Mulai cepat

Sebagian besar hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan suite penuh lokal lebih cepat di mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung kini juga merutekan path ekstensi/kanal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan run tertarget terlebih dahulu saat Anda sedang mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Jalur QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau ingin keyakinan ekstra:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug penyedia/model nyata (memerlukan kredensial nyata):

- Suite live (model + probe alat/gambar gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih kini menjalankan giliran teks plus probe kecil bergaya pembacaan file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan giliran gambar kecil.
    Nonaktifkan probe ekstra dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang di-shard berdasarkan penyedia.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret penyedia baru bernilai sinyal tinggi ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke chat terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan jalur live Docker terhadap path app-server Codex, mengikat DM
    Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui binding Plugin native alih-alih ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe gambar,
    MCP cron, sub-agen, dan Guardian. Nonaktifkan probe sub-agen dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan app-server Codex
    lain. Untuk pemeriksaan sub-agen terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in berlapis untuk permukaan perintah penyelamatan kanal pesan.
    Ini menjalankan `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/konfigurasi.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam kontainer tanpa konfigurasi dengan Claude CLI palsu di `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi penulisan konfigurasi bertipe
    yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Dimulai dari direktori state OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan penulisan setup/model/agen/Plugin Discord + SecretRef,
    memvalidasi konfigurasi, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  yang terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya membutuhkan satu kasus yang gagal, utamakan mempersempit pengujian live melalui variabel env allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah-perintah ini berada di samping suite pengujian utama saat Anda memerlukan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. `Parity gate` berjalan pada PR yang cocok dan
dari dispatch manual dengan penyedia mock. `QA-Lab - All Lanes` berjalan setiap malam di
`main` dan dari dispatch manual dengan gate paritas mock, jalur Matrix live,
jalur Telegram live yang dikelola Convex, dan jalur Discord live yang dikelola Convex sebagai
job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix `--profile fast`
secara eksplisit, sementara default input CLI Matrix dan workflow manual tetap
`all`; dispatch manual dapat men-shard `all` menjadi job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release Checks` menjalankan paritas plus
jalur Matrix dan Telegram cepat sebelum persetujuan rilis, menggunakan
`mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap deterministik
dan menghindari startup Plugin penyedia normal. Gateway transport live ini menonaktifkan
pencarian memori; perilaku memori tetap dicakup oleh suite paritas QA.

Shard media live rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit yang dipilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan worker
    gateway terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario terpilih). Gunakan `--concurrency <count>` untuk menyetel jumlah
    worker, atau `--concurrency 1` untuk jalur serial lama.
  - Keluar non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode penyedia `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server penyedia lokal berbasis AIMock untuk cakupan fixture
    dan mock protokol eksperimental tanpa menggantikan jalur `mock-openai`
    yang sadar skenario.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup gateway plus paket kecil skenario QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat dicatat sebagai metrik
    tanpa terlihat seperti regresi gateway yang mematok CPU selama beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu saat checkout belum
    memiliki output runtime segar.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan ulang flag pemilihan penyedia/model yang sama seperti `qa suite`.
  - Run live meneruskan input auth QA yang didukung dan praktis untuk guest:
    kunci penyedia berbasis env, path konfigurasi penyedia live QA, dan `CODEX_HOME`
    saat ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis balik melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi bahwa mengaktifkan Plugin menginstal dependensi runtime sesuai
    kebutuhan, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap endpoint OpenAI
    yang di-mock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan jalur packaged-install
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi terbangun yang deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipersistenkan sebagai
    pesan kustom non-tampilan alih-alih bocor ke giliran pengguna yang terlihat,
    lalu men-seed JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke cabang aktif dengan cadangan.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan onboarding paket terinstal,
    mengonfigurasi Telegram melalui CLI terinstal, lalu menggunakan ulang jalur QA Telegram live
    dengan paket terinstal tersebut sebagai Gateway SUT.
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
  terhadap satu paket kandidat. Ini menerima ref tepercaya, spec npm terpublikasi,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  scheduler Docker E2E yang ada dengan profil jalur smoke, package, product, full, atau custom.
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

- Bukti artefak mengunduh artefak tarball dari proses Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Mengemas dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/plugin bawaan melalui pengeditan
    konfigurasi.
  - Memverifikasi bahwa penemuan penyiapan membiarkan dependensi runtime Plugin
    yang belum dikonfigurasi tetap tidak ada, proses Gateway atau doctor pertama yang dikonfigurasi menginstal dependensi runtime setiap Plugin bawaan sesuai kebutuhan, dan restart kedua tidak
    menginstal ulang dependensi yang sudah diaktifkan.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi bahwa doctor pascapembaruan kandidat
    memperbaiki dependensi runtime channel bawaan tanpa perbaikan postinstall
    dari sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke pembaruan instalasi paket native di seluruh tamu Parallels. Setiap
    platform yang dipilih terlebih dahulu menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` yang terinstal di tamu yang sama dan memverifikasi
    versi terinstal, status pembaruan, kesiapan Gateway, dan satu giliran agen
    lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    mengiterasi pada satu tamu. Gunakan `--json` untuk jalur artefak ringkasan dan
    status per-lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agen live secara
    default. Teruskan `--model <provider/model>` atau atur
    `OPENCLAW_PARALLELS_OPENAI_MODEL` saat sengaja memvalidasi model
    OpenAI lain.
  - Bungkus proses lokal yang panjang dengan timeout host agar macetnya transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bersarang di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum mengasumsikan wrapper luar macet.
  - Pembaruan Windows dapat menghabiskan 10 hingga 15 menit dalam perbaikan dependensi
    doctor/runtime pascapembaruan pada tamu cold; itu masih sehat saat log debug
    npm bersarang terus bergerak.
  - Jangan menjalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi status VM dan dapat bertabrakan saat
    pemulihan snapshot, penyajian paket, atau status Gateway tamu.
  - Bukti pascapembaruan menjalankan permukaan Plugin bawaan normal karena
    facade kapabilitas seperti speech, pembuatan gambar, dan pemahaman media
    dimuat melalui API runtime bawaan bahkan saat giliran agen
    itu sendiri hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server penyedia AIMock lokal untuk pengujian smoke
    protokol langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel sekali pakai yang didukung Docker. Hanya checkout sumber — instalasi paket tidak mengirimkan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, variabel env, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grup harus berupa id chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial pooled bersama. Gunakan mode env secara default, atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut memakai lease pooled.
  - Keluar non-nol saat skenario mana pun gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos nama pengguna Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati lalu lintas bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak pesan yang diamati di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang diamati.

Lane transport live berbagi satu kontrak standar sehingga transport baru tidak menyimpang; matriks cakupan per-lane berada di [ikhtisar QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram Bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA lab memperoleh lease eksklusif dari pool yang didukung Convex, mengirim Heartbeat
untuk lease tersebut saat lane berjalan, dan melepas lease saat shutdown.

Scaffold proyek referensi Convex:

- `qa/convex-credential-broker/`

Variabel env wajib:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, `maintainer` selain itu)

Variabel env opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id jejak opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex `http://` loopback untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` harus menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (tambah/hapus/daftar pool) secara khusus memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum proses live untuk memeriksa URL situs Convex, secret broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/daftar tanpa mencetak
nilai secret. Gunakan `--json` untuk output yang dapat dibaca mesin dalam skrip dan utilitas
CI.

Kontrak endpoint default (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Permintaan: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukses: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Habis/dapat dicoba ulang: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sukses: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /release`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sukses: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /admin/add` (hanya secret maintainer)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Sukses: `{ status: "ok", credential }`
- `POST /admin/remove` (hanya secret maintainer)
  - Permintaan: `{ credentialId, actorId }`
  - Sukses: `{ status: "ok", changed, credential }`
  - Pelindung lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya secret maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Sukses: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string id chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang salah bentuk.

### Menambahkan channel ke QA

Nama arsitektur dan helper skenario untuk adapter channel baru berada di [ikhtisar QA → Menambahkan channel](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` dalam manifest Plugin, mount sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Suite pengujian (apa berjalan di mana)

Anggap suite sebagai “realisme yang meningkat” (dan flakiness/biaya yang meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: proses tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multiproyek menjadi konfigurasi per proyek untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (auth Gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture Plugin kecil yang dihasilkan, bukan
    API sumber Plugin bawaan nyata. Muatan API Plugin nyata termasuk dalam
    suite kontrak/integrasi milik Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sibuk dan mencegah pekerjaan auto-reply/extension menghambat suite yang tidak terkait.
    - `pnpm test --watch` tetap menggunakan grafik proyek root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane berscope terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup penuh proyek root.
    - `pnpm test:changed` memperluas path git yang berubah menjadi lane berscope murah secara default: edit test langsung, file saudara `*.test.ts`, pemetaan sumber eksplisit, dan dependensi grafik impor lokal. Edit config/setup/package tidak menjalankan test secara luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal cerdas normal untuk pekerjaan sempit. Perintah ini mengklasifikasikan diff menjadi core, test core, extensions, test extension, apps, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan typecheck, lint, dan perintah guard yang sesuai. Perintah ini tidak menjalankan test Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti test. Kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi-root tertarget, dengan guard yang menolak perubahan package di luar field versi tingkat atas.
    - Edit harness ACP Docker live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip auth Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, export, versi, dan permukaan package lain tetap menggunakan guard yang lebih luas.
    - Test unit ringan impor dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/berat-runtime tetap pada lane yang ada.
    - File sumber helper `plugin-sdk` dan `commands` terpilih juga memetakan run mode-berubah ke test saudara eksplisit di lane ringan tersebut, sehingga edit helper menghindari menjalankan ulang suite berat penuh untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, test integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI juga memecah subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket berat-impor tidak memikul seluruh ekor Node.
    - CI PR/main normal secara sengaja melewati sweep batch extension dan shard `agentic-plugins` khusus rilis. Full Release Validation menjalankan workflow anak `Plugin Prerelease` terpisah untuk suite yang berat plugin/extension tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input penemuan message-tool atau konteks runtime compaction,
      pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi
      murni.
    - Jaga agar suite integrasi runner tertanam tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id berscope dan perilaku compaction tetap mengalir
      melalui path `run.ts` / `compact.ts` yang nyata; test khusus helper
      bukan pengganti yang memadai untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Config dasar Vitest default ke `threads`.
    - Config Vitest bersama menetapkan `isolate: false` dan menggunakan runner
      non-terisolasi di seluruh proyek root, config e2e, dan live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi juga berjalan pada
      runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari config Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node anak
      Vitest secara default guna mengurangi churn kompilasi V8 selama run lokal besar.
      Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku
      V8 bawaan.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh sebuah diff.
    - Hook pre-commit hanya untuk formatting. Hook ini melakukan restage file yang diformat dan
      tidak menjalankan lint, typecheck, atau test.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push ketika Anda
      memerlukan gate pemeriksaan lokal cerdas.
    - `pnpm test:changed` dirutekan melalui lane berscope murah secara default. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agent
      memutuskan bahwa edit harness, config, package, atau kontrak benar-benar memerlukan
      cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing
      yang sama, hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mundur
      ketika load average host sudah tinggi, sehingga beberapa run Vitest
      bersamaan secara default menimbulkan dampak lebih kecil.
    - Config dasar Vitest menandai proyek/file config sebagai
      `forceRerunTriggers` sehingga rerun mode-berubah tetap benar ketika wiring
      test berubah.
    - Config mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada host yang didukung;
      setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
      output import-breakdown.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data timing shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Run seluruh-config menggunakan path config sebagai kunci; shard CI include-pattern
      menambahkan nama shard sehingga shard terfilter dapat dilacak
      secara terpisah.
    - Ketika satu test panas masih menghabiskan sebagian besar waktunya pada impor startup,
      pertahankan dependensi berat di balik seam lokal `*.runtime.ts` yang sempit dan
      mock seam itu langsung alih-alih melakukan deep-import helper runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan path root-project native untuk diff commit
      tersebut dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark pada tree
      kotor saat ini dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan config root Vitest.
    - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Perintah: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Scope:
  - Memulai Gateway local loopback nyata dengan diagnostik aktif secara default
  - Mendorong churn pesan gateway sintetis, memori, dan payload besar melalui path event diagnostik
  - Mengkueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundle stabilitas diagnostik
  - Memastikan recorder tetap berbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi kembali terkuras ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (gateway smoke)

- Perintah: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan test E2E bundled-plugin di bawah `extensions/`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode silent secara default untuk mengurangi overhead I/O console.
- Override berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi pada 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output console verbose.
- Scope:
  - Perilaku end-to-end gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak bagian bergerak dibanding test unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Memulai gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + eksekusi SSH
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway dan sandbox test
- Override berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan test saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke binary CLI non-default atau skrip wrapper

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan test live bundled-plugin di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Scope:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, keunikan tool-calling, masalah auth, dan perilaku rate limit
- Ekspektasi:
  - Secara desain tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, outage)
  - Memerlukan biaya / menggunakan rate limit
  - Lebih baik menjalankan subset yang dipersempit daripada “semuanya”
- Run live melakukan source `~/.profile` untuk mengambil API key yang hilang.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin material config/auth ke home test sementara sehingga fixture unit tidak dapat memutasi `~/.openclaw` nyata Anda.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda sengaja membutuhkan test live menggunakan direktori home nyata Anda.
- `pnpm test:live` kini default ke mode yang lebih senyap: mempertahankan output progres `[live] ...`, tetapi menekan pemberitahuan tambahan `~/.profile` dan membisukan log bootstrap gateway/obrolan Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup lengkap kembali.
- Rotasi API key (spesifik provider): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; test mencoba ulang pada respons rate limit.
- Output progres/heartbeat:
  - Suite live kini memancarkan baris progres ke stderr sehingga panggilan provider panjang terlihat aktif bahkan ketika tangkapan console Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi console Vitest sehingga baris progres provider/gateway langsung stream selama run live.
  - Sesuaikan heartbeat direct-model dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan Gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya down” / kegagalan khusus provider / pemanggilan tool: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness app-server Codex, dan semua pengujian live provider media (Deepgram, BytePlus, ComfyUI, gambar, musik, video, harness media) — plus penanganan kredensial untuk run live — lihat [Pengujian — suite live](/id/help/testing-live).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori konfigurasi lokal dan workspace Anda (dan mengambil sumber `~/.profile` jika di-mount). Entrypoint lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker default ke batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut saat Anda
  secara eksplisit menginginkan pemindaian menyeluruh yang lebih besar.
- `test:docker:all` membangun image Docker live sekali melalui `test:docker:live-build`, mengemas OpenClaw sekali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image bare hanya runner Node/Git untuk lane install/update/plugin-dependency; lane tersebut me-mount tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas built-app. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` menjalankan plan yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas resource mencegah lane live berat, npm-install, dan multi-service semuanya dimulai sekaligus. Jika satu lane lebih berat daripada batas aktif, scheduler masih dapat memulainya saat pool kosong lalu membiarkannya berjalan sendiri sampai kapasitas tersedia lagi. Default-nya adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya saat host Docker memiliki headroom lebih besar. Runner melakukan preflight Docker secara default, menghapus container OpenClaw E2E yang usang, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih panjang terlebih dahulu pada run berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifest lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak plan CI untuk lane terpilih, kebutuhan package/image, dan kredensial.
- `Package Acceptance` adalah gate package native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Gate ini me-resolve satu kandidat package dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane Docker E2E reusable terhadap tarball persis tersebut, bukan mengemas ulang ref yang dipilih. `workflow_ref` memilih workflow/skrip harness tepercaya, sementara `package_ref` memilih commit/branch/tag sumber untuk dikemas saat `source=ref`; ini memungkinkan logika acceptance saat ini memvalidasi commit tepercaya yang lebih lama. Profil diurutkan berdasarkan cakupan: `smoke` adalah install/channel/agent cepat plus Gateway/config, `package` adalah kontrak package/update/Plugin plus fixture keyless upgrade-survivor dan pengganti native default untuk sebagian besar cakupan package/update Parallels, `product` menambahkan channel MCP, pembersihan Cron/subagent, pencarian web OpenAI, dan OpenWebUI, dan `full` menjalankan chunk Docker jalur rilis dengan OpenWebUI. Validasi rilis menjalankan delta package khusus (`bundled-channel-deps-compat plugins-offline`) plus QA package Telegram karena chunk Docker jalur rilis sudah mencakup lane package/update/Plugin yang tumpang tindih. Perintah rerun Docker GitHub tertarget yang dihasilkan dari artifact menyertakan artifact package sebelumnya dan input image yang disiapkan jika tersedia, sehingga lane yang gagal dapat menghindari pembangunan ulang package dan image.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri grafik build statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi package seperti Commander, prompt UI, undici, atau logging sebelum dispatch perintah; guard juga menjaga chunk run Gateway yang dibundel tetap di bawah anggaran dan menolak impor statis dari jalur Gateway dingin yang diketahui. Smoke CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema config, dan perintah daftar model.
- Kompatibilitas legacy Package Acceptance dibatasi pada `2026.4.25` (`2026.4.25-beta.*` disertakan). Hingga cutoff tersebut, harness hanya menoleransi celah metadata shipped-package: entri inventaris QA private yang dihilangkan, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` persisten yang hilang, lokasi install-record Plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi metadata config selama `plugins update`. Untuk package setelah `2026.4.25`, jalur tersebut menjadi kegagalan ketat.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, dan `test:docker:config-reload` mem-boot satu atau lebih container nyata dan memverifikasi jalur integrasi tingkat lebih tinggi.

Runner Docker model live juga hanya bind-mount home auth CLI yang diperlukan (atau semua yang didukung saat run tidak dipersempit), lalu menyalinnya ke home container sebelum run agar OAuth CLI eksternal dapat menyegarkan token tanpa memutasi store auth host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode yang ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness server aplikasi Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observabilitas: `pnpm qa:otel:smoke` adalah lane checkout sumber QA privat. Ini sengaja bukan bagian dari lane rilis Docker paket karena tarball npm tidak menyertakan QA Lab.
- Smoke langsung Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agen tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang sudah dipaketkan secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, memverifikasi doctor memperbaiki dependensi runtime Plugin yang diaktifkan, dan menjalankan satu giliran agen OpenAI tiruan. Gunakan ulang tarball yang sudah dibuat dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati pembangunan ulang host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke peralihan channel pembaruan: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang sudah dipaketkan secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipersistenkan dan pekerjaan pascapembaruan Plugin, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke penyintas upgrade: `pnpm test:docker:upgrade-survivor` menginstal tarball OpenClaw yang sudah dipaketkan di atas fixture pengguna lama yang kotor dengan agen, config channel, allowlist Plugin, status dependensi runtime Plugin yang basi, serta file workspace/sesi yang sudah ada. Ini menjalankan pembaruan paket plus doctor non-interaktif tanpa provider langsung atau kunci channel, lalu memulai Gateway loopback dan memeriksa preservasi config/status serta anggaran startup/status.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor untuk cabang penulisan ulang prompt terduplikasi yang terdampak.
- Smoke instal global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` memaketkan tree saat ini, menginstalnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan provider gambar bawaan alih-alih macet. Gunakan ulang tarball yang sudah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di antara kontainer root, pembaruan, dan direct-npm. Smoke pembaruan secara default memakai npm `latest` sebagai baseline stable sebelum upgrade ke tarball kandidat. Timpa dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` milik workflow Install Smoke di GitHub. Pemeriksaan installer non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menyamarkan perilaku instal lokal pengguna. Tetapkan `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan ulang cache root/update/direct-npm di seluruh rerun lokal.
- CI Install Smoke melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env itu ketika cakupan direct `npm install -g` diperlukan.
- Smoke CLI hapus workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) secara default membangun image Dockerfile root, menyemai dua agen dengan satu workspace di home kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON yang valid plus perilaku workspace yang dipertahankan. Gunakan ulang image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua kontainer, auth WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber plus layer Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, elemen dapat diklik yang dipromosikan kursor, ref iframe, dan metadata frame.
- Regresi reasoning minimal OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa skema provider menolak dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway tersemai + bridge stdio + smoke notification-frame Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundle Pi (server MCP stdio nyata + smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + teardown anak MCP stdio setelah cron terisolasi dan run subagen sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke instal, instal/uninstal ClawHub kitchen-sink, pembaruan marketplace, dan aktifkan/inspeksi bundle Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Tetapkan `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan paket/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian memakai server fixture ClawHub lokal yang hermetik.
- Smoke pembaruan Plugin tidak berubah: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadata muat ulang config: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Dependensi runtime Plugin bawaan: `pnpm test:docker:bundled-channel-deps` secara default membangun image runner Docker kecil, membangun dan memaketkan OpenClaw sekali di host, lalu me-mount tarball itu ke setiap skenario instal Linux. Gunakan ulang image dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, lewati pembangunan ulang host setelah build lokal baru dengan `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, atau arahkan ke tarball yang sudah ada dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Agregat Docker penuh dan chunk bundled-channel jalur rilis mempra-paketkan tarball ini sekali, lalu men-shard pemeriksaan channel bawaan ke lane independen, termasuk lane pembaruan terpisah untuk Telegram, Discord, Slack, Feishu, memory-lancedb, dan ACPX. Chunk rilis memisahkan smoke channel, target pembaruan, dan kontrak setup/runtime menjadi `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b`, dan `bundled-channels-contracts`; chunk agregat `bundled-channels` tetap tersedia untuk rerun manual. Workflow rilis juga memisahkan chunk installer provider dan chunk instal/uninstal Plugin bawaan; chunk lama `package-update`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat untuk rerun manual. Gunakan `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` untuk mempersempit matriks channel saat menjalankan lane bawaan secara langsung, atau `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` untuk mempersempit skenario pembaruan. Run Docker per skenario secara default memakai `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; skenario pembaruan multi-target secara default memakai `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Lane ini juga memverifikasi bahwa `channels.<id>.enabled=false` dan `plugins.entries.<id>.enabled=false` menekan perbaikan doctor/dependensi runtime.
- Persempit dependensi runtime Plugin bawaan saat iterasi dengan menonaktifkan skenario yang tidak terkait, misalnya:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Untuk membangun lebih dulu dan menggunakan ulang image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Timpa image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang ketika ditetapkan. Ketika `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip menariknya jika belum ada secara lokal. Pengujian Docker QR dan installer mempertahankan Dockerfile sendiri karena keduanya memvalidasi perilaku paket/instal, bukan runtime aplikasi-terbangun bersama.

Runner Docker model langsung juga melakukan bind-mount checkout saat ini secara read-only dan
men-stage-nya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap sumber/konfigurasi lokal persis Anda.
Langkah staging melewati cache lokal-saja berukuran besar dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build` lokal aplikasi atau
Gradle agar run Docker langsung tidak menghabiskan menit-menit untuk menyalin
artefak khusus mesin.
Runner tersebut juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` sehingga probe langsung gateway tidak memulai
worker saluran Telegram/Discord/dll. sungguhan di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan langsung gateway
dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ini memulai
container gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang di-pin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat sungguhan melalui proxy `/api/chat/completions` Open WebUI.
Run pertama bisa terasa jauh lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan penyiapan cold-start-nya sendiri.
Lane ini mengharapkan kunci model langsung yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run yang di-Docker-kan.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak membutuhkan akun
Telegram, Discord, atau iMessage sungguhan. Ini mem-boot container Gateway ber-seed,
memulai container kedua yang men-spawn `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean peristiwa langsung, perutean kirim keluar, serta notifikasi saluran +
izin bergaya Claude melalui bridge MCP stdio sungguhan. Pemeriksaan notifikasi
memeriksa frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
benar-benar dipancarkan bridge, bukan hanya apa yang kebetulan diekspos oleh SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak membutuhkan kunci
model langsung. Ini membangun image Docker repo, memulai server probe MCP stdio sungguhan
di dalam container, mewujudkan server tersebut melalui runtime MCP bundle Pi tertanam,
mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak membutuhkan kunci model
langsung. Ini memulai Gateway ber-seed dengan server probe MCP stdio sungguhan, menjalankan
giliran cron terisolasi dan giliran anak one-shot `/subagents spawn`, lalu memverifikasi
proses anak MCP keluar setelah setiap run.

Smoke thread bahasa biasa ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi perutean thread ACP, jadi jangan hapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori konfigurasi/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum test dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run penyedia yang dipersempit hanya me-mount direktori/file yang dibutuhkan yang disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter penyedia di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang sudah ada untuk rerun yang tidak membutuhkan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk mengganti prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk mengganti tag image Open WebUI yang di-pin

## Sanity docs

Jalankan pemeriksaan docs setelah edit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga membutuhkan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline sungguhan” tanpa penyedia sungguhan:

- Pemanggilan tool Gateway (mock OpenAI, gateway sungguhan + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis konfigurasi + auth ditegakkan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agen (skills)

Kita sudah memiliki beberapa test aman-CI yang berperilaku seperti “evaluasi keandalan agen”:

- Pemanggilan tool mock melalui gateway sungguhan + loop agen (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek konfigurasi (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** ketika skills dicantumkan dalam prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/arg yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-turn yang meng-assert urutan tool, penerusan riwayat sesi, dan batas sandbox.

Evaluasi mendatang sebaiknya tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan penyedia mock untuk meng-assert pemanggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, prompt injection).
- Evaluasi langsung opsional (opt-in, env-gated) hanya setelah suite aman-CI tersedia.

## Test kontrak (bentuk Plugin dan saluran)

Test kontrak memverifikasi bahwa setiap Plugin dan saluran yang terdaftar mematuhi
kontrak antarmukanya. Test ini mengiterasi semua Plugin yang ditemukan dan menjalankan suite
assertion bentuk dan perilaku. Lane unit `pnpm test` default sengaja
melewati file smoke dan seam bersama ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh permukaan saluran atau penyedia bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Kontrak saluran saja: `pnpm test:contracts:channels`
- Kontrak penyedia saja: `pnpm test:contracts:plugins`

### Kontrak saluran

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk Plugin dasar (id, name, capabilities)
- **setup** - Kontrak wizard penyiapan
- **session-binding** - Perilaku binding sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi saluran
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status penyedia

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status saluran
- **registry** - Bentuk registry Plugin

### Kontrak penyedia

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime penyedia
- **shape** - Bentuk/antarmuka Plugin
- **wizard** - Wizard penyiapan

### Kapan dijalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi Plugin saluran atau penyedia
- Setelah me-refactor pendaftaran atau penemuan Plugin

Test kontrak berjalan di CI dan tidak memerlukan kunci API sungguhan.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah penyedia/model yang ditemukan secara langsung:

- Tambahkan regresi aman-CI jika memungkinkan (penyedia mock/stub, atau tangkap transformasi bentuk permintaan yang persis)
- Jika secara inheren hanya langsung (rate limit, kebijakan auth), jaga test langsung tetap sempit dan opt-in via env var
- Lebih baik targetkan layer terkecil yang menangkap bug:
  - bug konversi/replay permintaan penyedia → test model langsung
  - bug pipeline sesi/riwayat/tool gateway → smoke langsung gateway atau test mock gateway aman-CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu meng-assert id exec segmen traversal ditolak.
  - Jika Anda menambahkan family target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam test tersebut. Test sengaja gagal pada id target yang belum diklasifikasikan agar kelas baru tidak dapat dilewati diam-diam.

## Terkait

- [Testing live](/id/help/testing-live)
- [CI](/id/ci)
