---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan regresi untuk bug model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Kit pengujian: rangkaian unit/e2e/live, runner Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-07-04T04:07:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga rangkaian Vitest (unit/integrasi, e2e, live) dan sekumpulan kecil
runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap rangkaian (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, pra-push, debugging).
- Bagaimana pengujian live menemukan kredensial dan memilih model/penyedia.
- Cara menambahkan regresi untuk masalah model/penyedia dunia nyata.

<Note>
**Stack QA (qa-lab, qa-channel, jalur transport live)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - arsitektur, permukaan perintah, penulisan skenario.
- [QA Matrix](/id/concepts/qa-matrix) - referensi untuk `pnpm openclaw qa matrix`.
- [Kartu skor kematangan](/id/maturity/scorecard) - bagaimana bukti QA rilis mendukung keputusan stabilitas dan LTS.
- [Channel QA](/id/channels/qa-channel) - Plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini membahas cara menjalankan rangkaian pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([Runner khusus QA](#qa-specific-runners)) mencantumkan pemanggilan `qa` konkret dan merujuk kembali ke referensi di atas.
</Note>

## Mulai cepat

Hampir setiap hari:

- Gerbang penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan rangkaian penuh lokal lebih cepat di mesin yang lega: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path ekstensi/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Dahulukan menjalankan target spesifik saat Anda mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Jalur QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau ingin keyakinan tambahan:

- Gerbang coverage: `pnpm test:coverage`
- Rangkaian E2E: `pnpm test:e2e`

## Direktori Temp Pengujian

Utamakan helper bersama di `test/helpers/temp-dir.ts` untuk direktori
sementara milik pengujian. Helper ini membuat kepemilikan eksplisit dan menjaga cleanup dalam
siklus hidup pengujian yang sama:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` sengaja tidak mengekspos metode cleanup manual; Vitest
memiliki cleanup setelah setiap pengujian. Helper tingkat lebih rendah yang ada tetap tersedia untuk pengujian yang
belum dipindahkan, tetapi pengujian baru dan yang sudah dimigrasikan harus menggunakan tracker
pembersihan otomatis. Hindari penggunaan manual baru `makeTempDir`, `cleanupTempDirs`, atau
`createTempDirTracker` dan hindari panggilan `fs.mkdtemp*` mentah baru dalam pengujian
kecuali sebuah kasus secara eksplisit memverifikasi perilaku temp-dir mentah. Tambahkan komentar
izin yang dapat diaudit dengan alasan konkret saat sebuah pengujian sengaja membutuhkan direktori temp
mentah:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Untuk visibilitas migrasi, `node scripts/report-test-temp-creations.mjs` melaporkan
pembuatan temp-dir mentah baru dan penggunaan helper bersama manual baru pada baris diff yang ditambahkan
tanpa memblokir gaya cleanup yang sudah ada. Cakupan filenya sengaja
mengikuti klasifikasi path pengujian yang sama dengan `scripts/changed-lanes.mjs`
alih-alih mempertahankan heuristik nama file helper pengujian terpisah, sambil melewati
implementasi helper bersama itu sendiri. `check:changed` menjalankan laporan ini untuk
path pengujian yang berubah sebagai sinyal CI hanya-peringatan; temuannya berupa anotasi peringatan
GitHub, bukan kegagalan.

Saat men-debug penyedia/model nyata (memerlukan kredensial nyata):

- Rangkaian live (model + probe alat/gambar Gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: dispatch `OpenClaw Performance` dengan
  `live_openai_candidate=true` untuk giliran agen `openai/gpt-5.5` nyata atau
  `deep_profile=true` untuk artefak CPU/heap/trace Kova. Eksekusi terjadwal harian
  memublikasikan artefak jalur penyedia tiruan, deep-profile, dan GPT 5.5 ke
  `openclaw/clawgrit-reports` saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi. Laporan
  penyedia tiruan juga mencakup angka boot Gateway tingkat sumber, memori,
  tekanan Plugin, hello-loop model palsu berulang, dan startup CLI.
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih sekarang menjalankan satu giliran teks plus probe kecil bergaya pembacaan file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan satu giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Coverage CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang dipecah berdasarkan penyedia.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret penyedia baru bernilai-sinyal tinggi ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke chat-terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan jalur live Docker terhadap path app-server Codex, mengikat DM
    Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan polos dan lampiran gambar
    dirutekan melalui binding Plugin native alih-alih ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe gambar,
    MCP cron, sub-agen, dan Guardian. Nonaktifkan probe sub-agen dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan app-server Codex
    lainnya. Untuk pemeriksaan sub-agen terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke instalasi on-demand Codex: `pnpm test:docker:codex-on-demand`
  - Menginstal tarball OpenClaw terpaket di Docker, menjalankan onboarding API-key
    OpenAI, dan memverifikasi Plugin Codex plus dependensi `@openai/codex`
    diunduh ke root proyek npm terkelola sesuai permintaan.
- Smoke dependensi alat Plugin live: `pnpm test:docker:live-plugin-tool`
  - Mengemas Plugin fixture dengan dependensi `slugify` nyata, menginstalnya melalui
    `npm-pack:`, memverifikasi dependensi di bawah root proyek npm terkelola,
    lalu meminta model OpenAI live memanggil alat Plugin dan mengembalikan slug
    tersembunyi.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in belt-and-suspenders untuk permukaan perintah penyelamatan channel pesan.
    Ini menjalankan `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam kontainer tanpa config dengan CLI Claude palsu pada `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi penulisan config bertipe yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Memulai dari direktori state OpenClaw kosong, memverifikasi entrypoint Crestodian
    onboard modern, menerapkan penulisan setup/model/agen/Plugin Discord + SecretRef,
    memvalidasi config, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  secara terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya membutuhkan satu kasus gagal, utamakan mempersempit pengujian live melalui variabel env allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah ini berada di samping rangkaian pengujian utama saat Anda membutuhkan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. Paritas agentic bersarang di bawah
`QA-Lab - All Lanes` dan validasi rilis, bukan workflow PR mandiri.
Validasi luas harus menggunakan `Full Release Validation` dengan
`rerun_group=qa-parity` atau grup QA release-checks. Pemeriksaan rilis stabil/default
menempatkan soak live/Docker menyeluruh di belakang `run_release_soak=true`; profil
`full` memaksa soak aktif. `QA-Lab - All Lanes`
berjalan setiap malam di `main` dan dari dispatch manual dengan jalur paritas tiruan, jalur Matrix
live, jalur Telegram live yang dikelola Convex, dan jalur Discord live yang dikelola Convex
sebagai job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix
`--profile fast` secara eksplisit, sementara input CLI Matrix dan workflow manual
tetap default ke `all`; dispatch manual dapat memecah `all` menjadi job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release
Checks` menjalankan paritas plus jalur Matrix cepat dan Telegram sebelum persetujuan
rilis, menggunakan `mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap
deterministik dan menghindari startup Plugin penyedia normal. Gateway transport live ini
menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh rangkaian paritas
QA.

Shard media live rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit yang dipilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA yang didukung repo langsung di host.
  - Menulis artefak tingkat atas `qa-evidence.json`, `qa-suite-summary.json`, dan
    `qa-suite-report.md` untuk set skenario yang dipilih, termasuk pilihan
    skenario alur campuran, Vitest, dan Playwright.
  - Saat dipicu oleh `pnpm openclaw qa run --qa-profile <profile>`, menyematkan
    scorecard profil taksonomi yang dipilih dalam `qa-evidence.json` yang sama.
    `smoke-ci` menulis evidence ramping, yang menetapkan `evidenceMode: "slim"` dan menghilangkan
    `execution` per entri. `release` mencakup irisan kesiapan rilis yang dikurasi;
    `all` memilih setiap kategori kematangan aktif dan ditujukan untuk dispatch workflow
    QA Profile Evidence secara eksplisit ketika artefak scorecard lengkap
    diperlukan.
  - Menjalankan beberapa skenario yang dipilih secara paralel secara default dengan pekerja
    Gateway yang terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    pekerja, atau `--concurrency 1` untuk lane serial lama.
  - Keluar dengan non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode penyedia `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server penyedia lokal berbasis AIMock untuk cakupan fixture
    eksperimental dan mock protokol tanpa menggantikan lane `mock-openai` yang sadar skenario.
- `pnpm openclaw qa coverage --match <query>`
  - Mencari ID skenario, judul, permukaan, ID cakupan, referensi docs, referensi kode,
    Plugin, dan persyaratan penyedia, lalu mencetak target suite yang cocok.
  - Gunakan ini sebelum menjalankan QA Lab ketika Anda mengetahui perilaku atau path file
    yang disentuh tetapi bukan skenario terkecilnya. Ini hanya bersifat advisori; tetap pilih proof
    mock, live, Multipass, Matrix, atau transport dari perilaku yang diubah.
- `pnpm test:plugins:kitchen-sink-live`
  - Menjalankan gauntlet Plugin OpenAI Kitchen Sink live melalui QA Lab. Ini
    menginstal paket Kitchen Sink eksternal, memverifikasi inventaris permukaan plugin SDK,
    memeriksa `/healthz` dan `/readyz`, merekam evidence CPU/RSS Gateway,
    menjalankan satu giliran OpenAI live, dan memeriksa diagnostik adversarial.
    Memerlukan auth OpenAI live seperti `OPENAI_API_KEY`. Dalam sesi Testbox
    yang telah dihidrasi, ini otomatis mengambil profil live-auth Testbox ketika helper
    `openclaw-testbox-env` ada.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup Gateway ditambah paket kecil skenario QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan singkat saat startup dicatat sebagai metrik
    tanpa terlihat seperti regresi Gateway peg berdurasi beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu ketika checkout belum
    memiliki output runtime yang segar.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan kembali flag pemilihan penyedia/model yang sama seperti `qa suite`.
  - Run live meneruskan input auth QA yang didukung dan praktis untuk guest:
    kunci penyedia berbasis env, path konfigurasi penyedia live QA, dan `CODEX_HOME`
    ketika ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis balik melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal beserta log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi runtime Plugin yang dipaketkan dimuat tanpa perbaikan
    dependency saat startup, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap endpoint OpenAI
    yang di-mock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane packaged-install yang sama
    dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi-terbangun deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi bahwa konteks runtime OpenClaw tersembunyi dipersistenkan sebagai
    pesan kustom non-display alih-alih bocor ke giliran pengguna yang terlihat,
    lalu men-seed JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke branch aktif dengan backup.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan onboarding installed-package,
    mengonfigurasi Telegram melalui CLI yang terinstal, lalu menggunakan kembali
    lane QA Telegram live dengan paket terinstal itu sebagai SUT Gateway.
  - Wrapper hanya me-mount sumber harness `qa-lab` dari checkout; paket
    terinstal memiliki `dist`, `openclaw/plugin-sdk`, dan runtime Plugin
    yang dibundel sehingga lane tidak mencampur Plugin checkout saat ini ke dalam paket
    yang diuji.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; set
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah di-resolve alih-alih
    menginstal dari registry.
  - Memancarkan timing RTT berulang dalam `qa-evidence.json` secara default dengan
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Override
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, atau
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` untuk menyesuaikan run RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` menerima daftar ID check QA Telegram
    yang dipisahkan koma untuk di-sample; ketika tidak diset, check default yang mampu RTT
    adalah `telegram-mentioned-message-reply`.
  - Menggunakan kredensial env Telegram yang sama atau sumber kredensial Convex seperti
    `pnpm openclaw qa telegram`. Untuk automasi CI/rilis, set
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret role. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret role Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - Wrapper memvalidasi env kredensial Telegram atau Convex di host sebelum
    pekerjaan build/install Docker. Set `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    hanya ketika sengaja men-debug setup pra-kredensial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` meng-override
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk lane ini. Ketika kredensial Convex
    dipilih dan tidak ada role yang diset, wrapper menggunakan `ci` di CI dan
    `maintainer` di luar CI.
  - GitHub Actions mengekspos lane ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow menggunakan environment
    `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk proof produk side-run
  terhadap satu kandidat paket. Ini menerima ref tepercaya, spec npm terpublikasi,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  scheduler Docker E2E yang sudah ada dengan profil lane smoke, package, product, full, atau custom.
  Set `telegram_mode=mock-openai` atau `live-frontier` untuk menjalankan workflow
  QA Telegram terhadap artefak `package-under-test` yang sama.
  - Proof produk beta terbaru:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Proof URL tarball persis memerlukan digest dan menggunakan kebijakan keamanan URL publik:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Mirror tarball enterprise/private menggunakan kebijakan sumber tepercaya eksplisit:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` membaca `.github/package-trusted-sources.json` dari ref workflow tepercaya dan tidak menerima kredensial URL atau bypass jaringan privat melalui input workflow. Jika kebijakan bernama mendeklarasikan bearer auth, konfigurasikan secret tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Proof artefak mengunduh artefak tarball dari run Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mengemas dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI terkonfigurasi, lalu mengaktifkan channel/Plugin yang dibundel melalui edit konfigurasi.
  - Memverifikasi bahwa discovery setup membiarkan Plugin unduhan yang belum dikonfigurasi tetap absen,
    perbaikan doctor pertama yang dikonfigurasi menginstal setiap Plugin unduhan yang hilang
    secara eksplisit, dan restart kedua tidak menjalankan perbaikan dependency tersembunyi.
  - Juga menginstal baseline npm lama yang dikenal, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi bahwa doctor pasca-update kandidat
    membersihkan sisa dependency Plugin legacy tanpa perbaikan postinstall sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke update packaged-install native di seluruh guest Parallels. Setiap
    platform yang dipilih pertama-tama menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` yang terinstal di guest yang sama dan memverifikasi
    versi terinstal, status update, kesiapan Gateway, dan satu giliran agen lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    mengiterasi pada satu guest. Gunakan `--json` untuk path artefak ringkasan dan
    status per-lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk proof giliran agen live secara
    default. Berikan `--model <provider/model>` atau set
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ketika sengaja memvalidasi model
    OpenAI lain.
  - Bungkus run lokal yang lama dengan timeout host agar stall transport Parallels tidak dapat
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap wrapper luar hang.
  - Update Windows dapat menghabiskan 10 hingga 15 menit dalam pekerjaan doctor pasca-update dan update paket
    pada guest dingin; itu masih sehat ketika log debug npm bertingkat
    terus maju.
  - Jangan menjalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi state VM dan dapat bertabrakan saat
    restore snapshot, serving paket, atau state Gateway guest.
  - Proof pasca-update menjalankan permukaan Plugin bundel normal karena
    facade capability seperti speech, image generation, dan media
    understanding dimuat melalui API runtime bundel meskipun giliran agen
    itu sendiri hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Memulai hanya server penyedia AIMock lokal untuk pengujian smoke protokol
    langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan jalur QA langsung Matrix terhadap homeserver Tuwunel sekali pakai yang didukung Docker. Hanya checkout sumber - instalasi paket tidak menyertakan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, variabel env, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan jalur QA langsung Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grup harus berupa id chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial bersama dalam kumpulan. Gunakan mode env secara bawaan, atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut memakai sewa kumpulan.
  - Bawaan mencakup canary, gerbang mention, pengalamatan perintah, `/status`, balasan bot-ke-bot yang disebut, dan balasan perintah native inti. Bawaan `mock-openai` juga mencakup regresi rantai balasan deterministik dan streaming pesan akhir Telegram. Gunakan `--list-scenarios` untuk probe opsional seperti `session_status`.
  - Keluar dengan kode non-nol ketika skenario apa pun gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos nama pengguna Telegram.
  - Untuk pengamatan bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati lalu lintas bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan `qa-evidence.json` di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang diamati.

`Mantis Telegram Live` adalah wrapper bukti PR di sekitar jalur ini. Ia menjalankan
ref kandidat dengan kredensial Telegram yang disewa melalui Convex, merender bundel
laporan/bukti QA yang telah disunting di browser desktop Crabbox, merekam bukti MP4,
menghasilkan GIF yang dipangkas berdasarkan gerakan, mengunggah bundel artefak, dan memposting bukti PR
inline melalui Mantis GitHub App ketika `pr_number` diatur. Maintainer dapat
memulainya dari UI Actions melalui `Mantis Scenario` (`scenario_id:
telegram-live`) atau langsung dari komentar pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` adalah wrapper agentic native Telegram Desktop
sebelum/sesudah untuk bukti visual PR. Mulai dari UI Actions dengan
`instructions` bentuk bebas, melalui `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), atau dari komentar PR:

```text
@openclaw-mantis telegram desktop proof
```

Agen Mantis membaca PR, memutuskan perilaku yang terlihat di Telegram apa yang membuktikan
perubahan, menjalankan jalur bukti Telegram Desktop pengguna nyata Crabbox pada ref acuan dan
kandidat, mengiterasi hingga GIF native berguna, menulis manifes
`motionPreview` berpasangan, dan memposting tabel GIF 2 kolom yang sama melalui
Mantis GitHub App ketika `pr_number` diatur.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Menyewa atau menggunakan ulang desktop Linux Crabbox, menginstal Telegram Desktop native, mengonfigurasi OpenClaw dengan token bot SUT Telegram yang disewa, memulai Gateway, dan merekam bukti tangkapan layar/MP4 dari desktop VNC yang terlihat.
  - Bawaan ke `--credential-source convex` sehingga workflow hanya membutuhkan rahasia broker Convex. Gunakan `--credential-source env` dengan variabel `OPENCLAW_QA_TELEGRAM_*` yang sama seperti `pnpm openclaw qa telegram`.
  - Telegram Desktop tetap membutuhkan login/profil pengguna. Token bot hanya mengonfigurasi OpenClaw. Gunakan `--telegram-profile-archive-env <name>` untuk arsip profil `.tgz` base64, atau gunakan `--keep-lease` dan masuk secara manual melalui VNC sekali.
  - Menulis `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, dan `telegram-desktop-builder.mp4` di bawah direktori output.

Jalur transport langsung berbagi satu kontrak standar agar transport baru tidak menyimpang; matriks cakupan per jalur berada di [ikhtisar QA → Cakupan transport langsung](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Ketika `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
QA transport langsung, lab QA memperoleh sewa eksklusif dari kumpulan yang didukung Convex, mengirim Heartbeat untuk
sewa itu saat jalur berjalan, dan melepaskan sewa saat shutdown. Nama bagian ini ada sebelum
dukungan Discord, Slack, dan WhatsApp; kontrak sewa dibagikan di seluruh jenis.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Variabel env yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu rahasia untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Bawaan env: `OPENCLAW_QA_CREDENTIAL_ROLE` (bawaan ke `ci` di CI, jika tidak `maintainer`)

Variabel env opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (bawaan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (bawaan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (bawaan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (bawaan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (bawaan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id jejak opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex loopback `http://` untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (tambah/hapus/daftar kumpulan) memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` secara khusus.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum menjalankan langsung untuk memeriksa URL situs Convex, rahasia broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/daftar tanpa mencetak
nilai rahasia. Gunakan `--json` untuk output yang dapat dibaca mesin di skrip dan
utilitas CI.

Kontrak endpoint bawaan (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Permintaan: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukses: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Habis/dapat dicoba ulang: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Sukses: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sukses: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /release`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sukses: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /admin/add` (hanya rahasia maintainer)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Sukses: `{ status: "ok", credential }`
- `POST /admin/remove` (hanya rahasia maintainer)
  - Permintaan: `{ credentialId, actorId }`
  - Sukses: `{ status: "ok", changed, credential }`
  - Penjaga sewa aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya rahasia maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Sukses: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string id chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang salah bentuk.

Bentuk payload untuk jenis pengguna nyata Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, dan `telegramApiId` harus berupa string numerik.
- `tdlibArchiveSha256` dan `desktopTdataArchiveSha256` harus berupa string heksadesimal SHA-256.
- `kind: "telegram-user"` dicadangkan untuk workflow bukti Telegram Desktop Mantis. Jalur QA Lab generik tidak boleh memperolehnya.

Payload multi-channel yang divalidasi broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Jalur Slack juga dapat menyewa dari kumpulan, tetapi validasi payload Slack saat ini
berada di runner QA Slack, bukan broker. Gunakan
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
untuk baris Slack.

### Menambahkan channel ke QA

Arsitektur dan nama helper skenario untuk adapter channel baru berada di [ikhtisar QA → Menambahkan channel](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` dalam manifes Plugin, pasang sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite sebagai "realisme yang meningkat" (dan flakiness/biaya yang meningkat):

### Unit / integrasi (bawaan)

- Perintah: `pnpm test`
- Config: run tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi config per proyek untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (auth Gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture Plugin kecil yang dihasilkan, bukan
    API sumber Plugin bundel nyata. Pemuatan API Plugin nyata termasuk dalam
    suite kontrak/integrasi milik Plugin.

Kebijakan dependensi native:

- Instalasi pengujian bawaan melewati build opus Discord native opsional. Suara Discord menggunakan `libopus-wasm` yang dibundel, dan `@discordjs/opus` tetap dinonaktifkan di `allowBuilds` sehingga pengujian lokal dan jalur Testbox tidak mengompilasi addon native.
- Bandingkan performa opus native di repo benchmark `libopus-wasm`, bukan di loop instalasi/pengujian OpenClaw bawaan. Jangan atur `@discordjs/opus` ke `true` di `allowBuilds` bawaan; itu membuat loop instalasi/pengujian yang tidak terkait mengompilasi kode native.

<AccordionGroup>
  <Accordion title="Proyek, shard, dan jalur bercakupan">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native yang sangat besar. Ini memangkas puncak RSS pada mesin yang sedang berbeban dan mencegah pekerjaan auto-reply/ekstensi membuat suite yang tidak terkait kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan grafik proyek native root `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane berskop terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup penuh proyek root.
    - `pnpm test:changed` memperluas path git yang berubah menjadi lane berskop murah secara default: edit pengujian langsung, file saudara `*.test.ts`, pemetaan sumber eksplisit, dan dependen grafik impor lokal. Edit config/setup/package tidak menjalankan pengujian secara luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal cerdas normal untuk pekerjaan sempit. Ini mengklasifikasikan diff ke core, pengujian core, ekstensi, pengujian ekstensi, app, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan perintah typecheck, lint, dan guard yang sesuai. Ini tidak menjalankan pengujian Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian. Kenaikan versi yang hanya metadata rilis menjalankan pemeriksaan versi/config/dependensi-root tertarget, dengan guard yang menolak perubahan package di luar field versi tingkat atas.
    - Edit harness Docker ACP live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip auth Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, ekspor, versi, dan permukaan package lain tetap menggunakan guard yang lebih luas.
    - Pengujian unit ringan impor dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/berat runtime tetap berada pada lane yang ada.
    - File sumber helper `plugin-sdk` dan `commands` tertentu juga memetakan run mode perubahan ke pengujian saudara eksplisit di lane ringan tersebut, sehingga edit helper menghindari menjalankan ulang suite berat penuh untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya membagi subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket berat impor tidak menanggung seluruh ekor Node.
    - CI PR/main normal sengaja melewati sapuan batch ekstensi dan shard khusus rilis `agentic-plugins`. Validasi Rilis Penuh mengirim workflow turunan `Plugin Prerelease` terpisah untuk suite yang berat plugin/ekstensi tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input penemuan message-tool atau konteks runtime
      compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi
      murni.
    - Jaga suite integrasi runner tertanam tetap sehat:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id berskop dan perilaku compaction tetap mengalir
      melalui path `run.ts` / `compact.ts` nyata; pengujian khusus helper
      bukan pengganti yang memadai untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Config Vitest dasar default ke `threads`.
    - Config Vitest bersama menetapkan `isolate: false` dan menggunakan
      runner non-terisolasi di seluruh proyek root, e2e, dan config live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi juga berjalan pada
      runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari config Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node
      turunan Vitest secara default untuk mengurangi churn kompilasi V8 selama run lokal besar.
      Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku V8
      standar.
    - `scripts/run-vitest.mjs` menghentikan run Vitest non-watch eksplisit setelah
      5 menit tanpa output stdout atau stderr. Setel
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` untuk menonaktifkan watchdog bagi
      investigasi yang sengaja senyap.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektur yang dipicu oleh sebuah diff.
    - Hook pre-commit hanya memformat. Hook ini men-stage ulang file yang diformat dan
      tidak menjalankan lint, typecheck, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push saat Anda
      memerlukan gate pemeriksaan lokal cerdas.
    - `pnpm test:changed` dirutekan melalui lane berskop murah secara default. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agent
      memutuskan bahwa edit harness, config, package, atau contract benar-benar memerlukan
      cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing
      yang sama, hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mundur
      ketika rata-rata beban host sudah tinggi, sehingga beberapa run Vitest bersamaan
      menimbulkan dampak lebih kecil secara default.
    - Config Vitest dasar menandai proyek/file config sebagai
      `forceRerunTriggers` sehingga run ulang mode perubahan tetap benar ketika wiring pengujian
      berubah.
    - Config mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada host yang didukung;
      setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging perf">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
      output rincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data timing shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Run seluruh config menggunakan path config sebagai key; shard CI include-pattern
      menambahkan nama shard sehingga shard yang difilter dapat dilacak
      secara terpisah.
    - Ketika satu pengujian panas masih menghabiskan sebagian besar waktunya pada impor startup,
      simpan dependensi berat di balik seam lokal sempit `*.runtime.ts` dan
      mock seam itu langsung alih-alih melakukan deep-import helper runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan path root-project native untuk diff yang sudah di-commit itu
      dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark pada tree kotor
      saat ini dengan merutekan daftar file yang berubah melalui
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
  - Mengkueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundle stabilitas diagnostik
  - Memastikan recorder tetap terbatas, sampel RSS sintetis tetap di bawah budget tekanan, dan kedalaman antrean per sesi kembali terkuras ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (agregat repo)

- Perintah: `pnpm test:e2e`
- Cakupan:
  - Menjalankan lane E2E smoke gateway
  - Menjalankan lane E2E browser Control UI yang di-mock
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Memerlukan Playwright Chromium terinstal

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E bundled-plugin di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: default 1).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi pada 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan networking yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak bagian bergerak daripada pengujian unit (bisa lebih lambat)

### E2E (browser Control UI yang di-mock)

- Perintah: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- File: `ui/src/**/*.e2e.test.ts`
- Cakupan:
  - Memulai Vite Control UI
  - Menggerakkan halaman Chromium nyata melalui Playwright
  - Mengganti Gateway WebSocket dengan mock dalam browser yang deterministik
- Ekspektasi:
  - Berjalan di CI sebagai bagian dari `pnpm test:e2e`
  - Tidak memerlukan Gateway, agent, atau key provider nyata
  - Dependensi browser harus tersedia (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Menggunakan ulang gateway OpenShell lokal yang aktif
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` + eksekusi SSH nyata
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Memerlukan gateway OpenShell lokal yang aktif dan sumber config-nya
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan sandbox pengujian
- Override berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke binary CLI non-default atau skrip wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` untuk mengekspos config gateway terdaftar ke pengujian terisolasi
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` untuk mengganti IP gateway Docker yang digunakan oleh fixture kebijakan host

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- Berkas: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live Plugin bundel di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (mengatur `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - "Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?"
  - Menangkap perubahan format provider, keunikan pemanggilan tool, masalah autentikasi, dan perilaku batas laju
- Ekspektasi:
  - Secara desain tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, gangguan)
  - Memerlukan biaya / menggunakan batas laju
  - Lebih baik menjalankan subset yang dipersempit daripada "semuanya"
- Run live menggunakan kunci API yang sudah diekspor dan profil autentikasi yang sudah disiapkan.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin materi konfigurasi/autentikasi ke home pengujian sementara sehingga fixture unit tidak dapat mengubah `~/.openclaw` nyata Anda.
- Atur `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda sengaja memerlukan pengujian live menggunakan direktori home nyata Anda.
- `pnpm test:live` default ke mode yang lebih senyap: mode ini mempertahankan output progres `[live] ...` dan membisukan log bootstrap gateway/obrolan Bonjour. Atur `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup lengkap kembali.
- Rotasi kunci API (spesifik provider): atur `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba ulang pada respons batas laju.
- Output progres/heartbeat:
  - Suite live sekarang memancarkan baris progres ke stderr sehingga panggilan provider yang lama terlihat aktif bahkan saat penangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway mengalir segera selama run live.
  - Sesuaikan heartbeat model-langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug "bot saya down" / kegagalan spesifik provider / pemanggilan tool: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness app-server Codex, dan semua pengujian live media-provider (Deepgram, BytePlus, ComfyUI, image, music, video, media harness) - ditambah penanganan kredensial untuk run live - lihat [Menguji suite live](/id/help/testing-live). Untuk checklist validasi pembaruan dan Plugin khusus, lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan berkas live profile-key yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori konfigurasi lokal, workspace, dan berkas env profil opsional Anda. Entrypoint lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker menjaga batas praktisnya sendiri saat diperlukan:
  `test:docker:live-models` default ke set high-signal yang didukung dan dikurasi, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Atur `OPENCLAW_LIVE_MAX_MODELS`
  atau variabel env gateway ketika Anda secara eksplisit menginginkan batas yang lebih kecil atau pemindaian yang lebih besar.
- `test:docker:all` membangun image Docker live sekali melalui `test:docker:live-build`, mengemas OpenClaw sekali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image bare hanyalah runner Node/Git untuk lane install/update/plugin-dependency; lane tersebut me-mount tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas built-app. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi plan yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas sumber daya mencegah lane live berat, npm-install, dan multi-service semuanya dimulai sekaligus. Jika satu lane lebih berat daripada batas aktif, scheduler masih dapat memulainya ketika pool kosong lalu menjaganya berjalan sendiri sampai kapasitas tersedia lagi. Default-nya 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya ketika host Docker memiliki ruang kapasitas lebih. Runner melakukan preflight Docker secara default, menghapus kontainer E2E OpenClaw yang usang, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih lama terlebih dahulu pada run berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifest lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak plan CI bagi lane yang dipilih, kebutuhan package/image, dan kredensial.
- `Package Acceptance` adalah gate package native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Gate ini me-resolve satu package kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane E2E Docker yang dapat digunakan ulang terhadap tarball yang sama persis alih-alih mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan keluasan: `smoke`, `package`, `product`, dan `full`. Lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins) untuk kontrak package/update/Plugin, matriks survivor published-upgrade, default rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri graf built statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi package seperti Commander, prompt UI, undici, atau logging sebelum dispatch perintah; guard ini juga menjaga chunk run gateway bundel tetap di bawah anggaran dan menolak impor statis dari path gateway dingin yang diketahui. Smoke CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema config, dan perintah daftar-model.
- Kompatibilitas legacy Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga batas tersebut, harness hanya menoleransi celah metadata package yang sudah dikirim: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, berkas patch yang hilang dalam fixture git turunan tarball, `update.channel` persisten yang hilang, lokasi install-record Plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi metadata config selama `plugins update`. Untuk package setelah `2026.4.25`, path tersebut menjadi kegagalan ketat.
- Runner smoke kontainer: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` mem-boot satu atau lebih kontainer nyata dan memverifikasi path integrasi tingkat lebih tinggi.
- Lane E2E Docker/Bash yang menginstal tarball OpenClaw terkemas melalui `scripts/lib/openclaw-e2e-instance.sh` membatasi `npm install` pada `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (default `600s`; atur `0` untuk menonaktifkan wrapper saat debugging).

Runner Docker model live juga hanya melakukan bind-mount home autentikasi CLI yang diperlukan (atau semua yang didukung ketika run tidak dipersempit), lalu menyalinnya ke home kontainer sebelum run sehingga OAuth CLI eksternal dapat menyegarkan token tanpa mengubah penyimpanan autentikasi host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observabilitas: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, dan `pnpm qa:observability:smoke` adalah lane source-checkout QA privat. Lane ini sengaja bukan bagian dari lane rilis Docker package karena tarball npm menghilangkan QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding lengkap): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agen tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw terkemas secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, menjalankan doctor, dan menjalankan satu giliran agen OpenAI tiruan. Gunakan ulang tarball yang sudah dibangun dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` atau `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke perjalanan pengguna rilis: `pnpm test:docker:release-user-journey` memasang tarball OpenClaw yang sudah dikemas secara global di home Docker yang bersih, menjalankan onboarding, mengonfigurasi provider OpenAI tiruan, menjalankan satu giliran agen, memasang/menghapus Plugin eksternal, mengonfigurasi ClickClack terhadap fixture lokal, memverifikasi pengiriman pesan keluar/masuk, memulai ulang Gateway, dan menjalankan doctor.
- Smoke onboarding bertipe rilis: `pnpm test:docker:release-typed-onboarding` memasang tarball yang sudah dikemas, menjalankan `openclaw onboard` melalui TTY nyata, mengonfigurasi OpenAI sebagai provider env-ref, memverifikasi tidak ada persistensi kunci mentah, dan menjalankan satu giliran agen tiruan.
- Smoke media/memori rilis: `pnpm test:docker:release-media-memory` memasang tarball yang sudah dikemas, memverifikasi pemahaman gambar dari lampiran PNG, keluaran pembuatan gambar yang kompatibel dengan OpenAI, pengingatan pencarian memori, dan ketahanan pengingatan setelah Gateway dimulai ulang.
- Smoke perjalanan pengguna upgrade rilis: `pnpm test:docker:release-upgrade-user-journey` secara default memasang baseline terbitan terbaru yang lebih lama daripada tarball kandidat, mengonfigurasi status provider/Plugin/ClickClack pada paket terbitan, melakukan upgrade ke tarball kandidat, lalu menjalankan ulang perjalanan inti agen/Plugin/channel. Jika tidak ada baseline terbitan yang lebih lama, versi kandidat digunakan kembali. Timpa baseline dengan `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke marketplace Plugin rilis: `pnpm test:docker:release-plugin-marketplace` memasang dari marketplace fixture lokal, memperbarui Plugin terpasang, menghapusnya, dan memverifikasi CLI Plugin menghilang dengan metadata pemasangan dipangkas.
- Smoke pemasangan Skill: `pnpm test:docker:skill-install` memasang tarball OpenClaw yang sudah dikemas secara global di Docker, menonaktifkan pemasangan arsip unggahan di config, me-resolve slug skill ClawHub live saat ini dari pencarian, memasangnya dengan `openclaw skills install`, dan memverifikasi skill terpasang beserta metadata origin/lock `.clawhub`.
- Smoke peralihan channel update: `pnpm test:docker:update-channel-switch` memasang tarball OpenClaw yang sudah dikemas secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipersistenkan dan pekerjaan Plugin pasca-update, lalu beralih kembali ke paket `stable` dan memeriksa status update.
- Smoke penyintas upgrade: `pnpm test:docker:upgrade-survivor` memasang tarball OpenClaw yang sudah dikemas di atas fixture pengguna lama yang kotor dengan agen, config channel, allowlist Plugin, status dependensi Plugin usang, dan file workspace/sesi yang sudah ada. Ini menjalankan update paket beserta doctor non-interaktif tanpa provider live atau kunci channel, lalu memulai Gateway loopback dan memeriksa pelestarian config/status beserta anggaran startup/status.
- Smoke penyintas upgrade terbitan: `pnpm test:docker:published-upgrade-survivor` secara default memasang `openclaw@latest`, menanam file pengguna yang sudah ada secara realistis, mengonfigurasi baseline tersebut dengan resep perintah bawaan, memvalidasi config yang dihasilkan, memperbarui pemasangan terbitan itu ke tarball kandidat, menjalankan doctor non-interaktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent terkonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, dan anggaran status RPC. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta scheduler agregat memperluas baseline lokal persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; set reported-issues menyertakan `configured-plugin-installs` untuk perbaikan otomatis pemasangan Plugin OpenClaw eksternal. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`, me-resolve token baseline meta seperti `last-stable-4` atau `all-since-2026.4.23`, dan Full Release Validation memperluas gate paket release-soak menjadi `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi beserta perbaikan doctor untuk cabang prompt-rewrite duplikat yang terdampak.
- Smoke pemasangan global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas tree saat ini, memasangnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan provider gambar bawaan, bukan menggantung. Gunakan kembali tarball yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh container root, update, dan direct-npm. Smoke update secara default memakai npm `latest` sebagai baseline stable sebelum upgrade ke tarball kandidat. Timpa dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` workflow Install Smoke di GitHub. Pemeriksaan installer non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku pemasangan lokal pengguna. Atur `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/update/direct-npm di antara rerun lokal.
- CI Install Smoke melewati update global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env tersebut saat cakupan direct `npm install -g` diperlukan.
- Smoke CLI hapus workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) secara default membangun image Dockerfile root, menanam dua agen dengan satu workspace di home container terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid beserta perilaku workspace yang dipertahankan. Gunakan kembali image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua container, auth WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber plus layer Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Regresi reasoning minimal OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan schema provider dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway tertanam + bridge stdio + smoke frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundel OpenClaw (server MCP stdio nyata + smoke allow/deny profil OpenClaw tertanam): `pnpm test:docker:agent-bundle-mcp-tools` (skrip: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Pembersihan Cron/subagen MCP (Gateway nyata + teardown child MCP stdio setelah run cron terisolasi dan subagen one-shot): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke install/update untuk path lokal, `file:`, registry npm dengan dependensi hoisted, metadata paket npm cacat, ref git bergerak, ClawHub kitchen-sink, update marketplace, dan enable/inspect Claude-bundle): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Atur `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan paket/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal hermetik.
- Smoke update Plugin tidak berubah: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks siklus hidup Plugin: `pnpm test:docker:plugin-lifecycle-matrix` memasang tarball OpenClaw yang sudah dikemas di container kosong, memasang Plugin npm, mengaktifkan/menonaktifkan, melakukan upgrade dan downgrade melalui registry npm lokal, menghapus kode terpasang, lalu memverifikasi uninstall tetap menghapus status usang sambil mencatat metrik RSS/CPU untuk setiap fase siklus hidup.
- Smoke metadata reload config: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke install/update untuk path lokal, `file:`, registry npm dengan dependensi hoisted, ref git bergerak, fixture ClawHub, update marketplace, dan enable/inspect Claude-bundle. `pnpm test:docker:plugin-update` mencakup perilaku update tidak berubah untuk Plugin terpasang. `pnpm test:docker:plugin-lifecycle-matrix` mencakup pemasangan Plugin npm yang dilacak sumber dayanya, enable, disable, upgrade, downgrade, dan uninstall saat kode hilang.

Untuk melakukan prebuild dan menggunakan kembali image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat diatur. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` mengarah ke image bersama remote, skrip menariknya jika belum lokal. Pengujian Docker QR dan installer mempertahankan Dockerfile masing-masing karena memvalidasi perilaku paket/pemasangan, bukan runtime aplikasi terbangun bersama.

Runner Docker model live juga melakukan bind-mount checkout saat ini secara read-only dan
men-staging-nya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap sumber/konfigurasi lokal persis milik Anda.
Langkah staging melewati cache besar yang hanya lokal dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build` lokal aplikasi atau
Gradle agar run live Docker tidak menghabiskan beberapa menit untuk menyalin
artefak khusus mesin.
Runner tersebut juga menyetel `OPENCLAW_SKIP_CHANNELS=1` agar probe live gateway tidak memulai
worker saluran Telegram/Discord/dll. nyata di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live
gateway dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ini memulai
container gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang dipin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Setel `OPENWEBUI_SMOKE_MODE=models` untuk pemeriksaan CI jalur rilis yang harus berhenti
setelah sign-in Open WebUI dan penemuan model, tanpa menunggu penyelesaian model live.
Run pertama bisa terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan penyiapan cold-start miliknya sendiri.
Lane ini mengharapkan kunci model live yang dapat digunakan. Sediakan melalui environment
proses, profil auth yang di-staging, atau `OPENCLAW_PROFILE_FILE` eksplisit.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak membutuhkan akun
Telegram, Discord, atau iMessage nyata. Ini mem-boot container Gateway yang di-seed,
memulai container kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, routing pengiriman keluar, serta notifikasi saluran +
izin gaya Claude melalui bridge MCP stdio nyata. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
benar-benar dipancarkan bridge, bukan hanya apa yang kebetulan ditampilkan oleh SDK klien tertentu.
`test:docker:agent-bundle-mcp-tools` deterministik dan tidak membutuhkan kunci model live.
Ini membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam container, mewujudkan server tersebut melalui runtime MCP bundle OpenClaw tertanam,
mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` tetap mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` deterministik dan tidak membutuhkan kunci model live.
Ini memulai Gateway yang di-seed dengan server probe MCP stdio nyata, menjalankan
giliran cron terisolasi dan satu giliran anak one-shot `sessions_spawn`, lalu memverifikasi
proses anak MCP keluar setelah setiap run.

Smoke thread bahasa biasa ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk workflow regresi/debug. Ini mungkin diperlukan lagi untuk validasi routing thread ACP, jadi jangan hapus.

Env var berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` di-mount dan di-source sebelum menjalankan tes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori konfigurasi/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum tes dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run penyedia yang dipersempit hanya me-mount direktori/file yang diperlukan, disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter penyedia di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang sudah ada bagi rerun yang tidak membutuhkan build ulang
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipin

## Pemeriksaan kewajaran dokumentasi

Jalankan pemeriksaan dokumentasi setelah edit dokumentasi: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga membutuhkan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi "pipeline nyata" tanpa penyedia nyata:

- Pemanggilan tool Gateway (mock OpenAI, gateway nyata + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis konfigurasi + auth ditegakkan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agen (Skills)

Kita sudah memiliki beberapa tes aman untuk CI yang berperilaku seperti "evaluasi keandalan agen":

- Pemanggilan tool mock melalui gateway nyata + loop agen (`src/gateway/gateway.test.ts`).
- Flow wizard end-to-end yang memvalidasi wiring sesi dan efek konfigurasi (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** ketika skills dicantumkan dalam prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak workflow:** skenario multi-turn yang menegaskan urutan tool, penerusan riwayat sesi, dan batas sandbox.

Evaluasi mendatang harus tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan penyedia mock untuk menegaskan pemanggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario berfokus skill (gunakan vs hindari, gating, prompt injection).
- Evaluasi live opsional (opt-in, dijaga env) hanya setelah suite aman untuk CI tersedia.

## Tes kontrak (bentuk Plugin dan saluran)

Tes kontrak memverifikasi bahwa setiap Plugin dan saluran terdaftar mematuhi
kontrak antarmukanya. Tes ini mengiterasi semua Plugin yang ditemukan dan menjalankan suite
asersi bentuk dan perilaku. Lane unit `pnpm test` default sengaja
melewati file smoke dan seam bersama ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh surface saluran atau penyedia bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak saluran: `pnpm test:contracts:channels`
- Hanya kontrak penyedia: `pnpm test:contracts:plugins`

### Kontrak saluran

Berada di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk Plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard penyiapan
- **session-binding** - Perilaku binding sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi saluran
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status penyedia

Berada di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status saluran
- **registry** - Bentuk registry Plugin

### Kontrak penyedia

Berada di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak flow auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime penyedia
- **shape** - Bentuk/antarmuka Plugin
- **wizard** - Wizard penyiapan

### Kapan menjalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi Plugin saluran atau penyedia
- Setelah me-refactor registrasi atau penemuan Plugin

Tes kontrak berjalan di CI dan tidak membutuhkan kunci API nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki isu penyedia/model yang ditemukan secara live:

- Tambahkan regresi aman untuk CI jika memungkinkan (penyedia mock/stub, atau tangkap transformasi bentuk permintaan yang persis)
- Jika secara inheren hanya live (batas laju, kebijakan auth), pertahankan tes live tetap sempit dan opt-in melalui env var
- Lebih baik menargetkan layer terkecil yang menangkap bug:
  - bug konversi/replay permintaan penyedia → tes model langsung
  - bug pipeline sesi/riwayat/tool gateway → smoke live gateway atau tes mock gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam tes tersebut. Tes sengaja gagal pada id target yang tidak terklasifikasi agar kelas baru tidak dapat dilewati secara diam-diam.

## Terkait

- [Testing live](/id/help/testing-live)
- [Testing updates and plugins](/id/help/testing-updates-plugins)
- [CI](/id/ci)
