---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk bug model/penyedia
    - Men-debug perilaku gateway + agen
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan apa yang dicakup setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-07-02T08:49:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
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

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - arsitektur, permukaan perintah, penulisan skenario.
- [QA Matrix](/id/concepts/qa-matrix) - referensi untuk `pnpm openclaw qa matrix`.
- [Kartu skor kematangan](/id/maturity/scorecard) - bagaimana bukti QA rilis mendukung keputusan stabilitas dan LTS.
- [Channel QA](/id/channels/qa-channel) - Plugin transport sintetis yang digunakan oleh skenario yang didukung repo.

Halaman ini mencakup menjalankan rangkaian pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([Runner khusus QA](#qa-specific-runners)) mencantumkan pemanggilan `qa` konkret dan merujuk kembali ke referensi di atas.
</Note>

## Mulai cepat

Sebagian besar hari:

- Gerbang penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan rangkaian penuh lokal yang lebih cepat di mesin lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path ekstensi/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan run tertarget terlebih dahulu saat Anda mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan ekstra:

- Gerbang cakupan: `pnpm test:coverage`
- Rangkaian E2E: `pnpm test:e2e`

## Direktori Temp Pengujian

Utamakan helper bersama di `test/helpers/temp-dir.ts` untuk direktori sementara
milik pengujian. Helper ini membuat kepemilikan eksplisit dan menjaga pembersihan dalam
siklus hidup pengujian yang sama:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` sengaja tidak mengekspos metode pembersihan manual; Vitest
memiliki pembersihan setelah setiap pengujian. Helper level rendah yang ada tetap tersedia untuk pengujian yang
belum dipindahkan, tetapi pengujian baru dan yang dimigrasikan sebaiknya menggunakan tracker
pembersih otomatis. Hindari penggunaan manual baru `makeTempDir`, `cleanupTempDirs`, atau
`createTempDirTracker` dan hindari panggilan bare `fs.mkdtemp*` baru dalam pengujian
kecuali sebuah kasus secara eksplisit memverifikasi perilaku temp-dir mentah. Tambahkan komentar
allow yang dapat diaudit dengan alasan konkret saat pengujian sengaja membutuhkan direktori temp
bare:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Untuk visibilitas migrasi, `node scripts/report-test-temp-creations.mjs` melaporkan
pembuatan temp-dir bare baru dan penggunaan helper bersama manual baru pada baris diff
yang ditambahkan tanpa memblokir gaya pembersihan yang ada. Cakupan filenya sengaja
mengikuti klasifikasi path pengujian yang sama yang digunakan oleh `scripts/changed-lanes.mjs`
alih-alih mempertahankan heuristik nama file helper pengujian terpisah, sambil melewati
implementasi helper bersama itu sendiri. `check:changed` menjalankan laporan ini untuk
path pengujian yang berubah sebagai sinyal CI peringatan saja; temuannya adalah anotasi
peringatan GitHub, bukan kegagalan.

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Rangkaian live (model + probe tool/gambar Gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: dispatch `OpenClaw Performance` dengan
  `live_openai_candidate=true` untuk turn agen `openai/gpt-5.5` nyata atau
  `deep_profile=true` untuk artefak CPU/heap/trace Kova. Run terjadwal harian
  menerbitkan artefak lane mock-provider, deep-profile, dan GPT 5.5 ke
  `openclaw/clawgrit-reports` saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi. Laporan
  mock-provider juga mencakup angka boot Gateway tingkat sumber, memori,
  tekanan Plugin, hello-loop model palsu berulang, dan startup CLI.
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih kini menjalankan satu turn teks plus probe kecil bergaya pembacaan file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan turn gambar kecil.
    Nonaktifkan probe ekstra dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan provider.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E reusable dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang di-shard berdasarkan provider.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret provider baru dengan sinyal tinggi ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan caller
    terjadwal/rilisnya.
- Smoke bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan lane live Docker terhadap path app-server Codex, mengikat DM Slack sintetis
    dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan polos dan lampiran gambar
    dirutekan melalui binding Plugin native alih-alih ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan turn agen Gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe gambar,
    cron MCP, sub-agent, dan Guardian. Nonaktifkan probe sub-agent dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan lain
    app-server Codex. Untuk pemeriksaan sub-agent terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agent kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke instalasi sesuai permintaan Codex: `pnpm test:docker:codex-on-demand`
  - Menginstal tarball OpenClaw yang dipaketkan di Docker, menjalankan onboarding kunci API OpenAI,
    dan memverifikasi Plugin Codex plus dependensi `@openai/codex`
    telah diunduh ke root proyek npm terkelola sesuai permintaan.
- Smoke dependensi tool Plugin live: `pnpm test:docker:live-plugin-tool`
  - Memaketkan Plugin fixture dengan dependensi `slugify` nyata, menginstalnya melalui
    `npm-pack:`, memverifikasi dependensi di bawah root proyek npm terkelola,
    lalu meminta model OpenAI live memanggil tool Plugin dan mengembalikan
    slug tersembunyi.
- Smoke perintah rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in belt-and-suspenders untuk permukaan perintah rescue channel pesan.
    Ini menjalankan `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/konfigurasi.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam container tanpa konfigurasi dengan CLI Claude palsu pada `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi tulis konfigurasi bertipe
    yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Memulai dari direktori state OpenClaw kosong, memverifikasi entrypoint Crestodian onboard
    modern, menerapkan penulisan setup/model/agen/Plugin Discord + SecretRef,
    memvalidasi konfigurasi, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup dalam QA Lab oleh
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

Perintah ini berada di samping rangkaian pengujian utama saat Anda membutuhkan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. Paritas agentic berada di bawah
`QA-Lab - All Lanes` dan validasi rilis, bukan workflow PR mandiri.
Validasi luas sebaiknya menggunakan `Full Release Validation` dengan
`rerun_group=qa-parity` atau grup QA release-checks. Pemeriksaan rilis stabil/default
menjaga soak live/Docker lengkap di belakang `run_release_soak=true`; profil
`full` memaksa soak aktif. `QA-Lab - All Lanes`
berjalan setiap malam pada `main` dan dari dispatch manual dengan lane paritas mock, lane Matrix
live, lane Telegram live yang dikelola Convex, dan lane Discord live yang dikelola Convex
sebagai job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix
`--profile fast` secara eksplisit, sementara input default CLI Matrix dan workflow manual
tetap `all`; dispatch manual dapat men-shard `all` menjadi job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release
Checks` menjalankan paritas plus lane Matrix fast dan Telegram sebelum persetujuan
rilis, menggunakan `mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap
deterministik dan menghindari startup provider-plugin normal. Gateway transport live ini
menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh rangkaian paritas
QA.

Shard media live rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit
terpilih, lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menulis artefak tingkat atas `qa-evidence.json`, `qa-suite-summary.json`, dan
    `qa-suite-report.md` untuk set skenario yang dipilih, termasuk pilihan
    skenario alur campuran, Vitest, dan Playwright.
  - Saat dijalankan oleh `pnpm openclaw qa run --qa-profile <profile>`, menyematkan
    kartu skor profil taksonomi yang dipilih dalam `qa-evidence.json` yang sama.
    `smoke-ci` menulis bukti ramping, yang menetapkan `evidenceMode: "slim"` dan menghilangkan
    `execution` per entri. `release` mencakup irisan kesiapan rilis yang dikurasi;
    `all` memilih setiap kategori kematangan aktif dan ditujukan untuk dispatch workflow
    QA Profile Evidence eksplisit saat artefak kartu skor lengkap
    diperlukan.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan worker
    Gateway terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    worker, atau `--concurrency 1` untuk lane serial lama.
  - Keluar dengan non-zero saat skenario apa pun gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan
    fixture eksperimental dan mock protokol tanpa menggantikan lane
    `mock-openai` yang sadar skenario.
- `pnpm openclaw qa coverage --match <query>`
  - Mencari ID skenario, judul, surface, ID cakupan, referensi docs, referensi kode,
    Plugin, dan persyaratan provider, lalu mencetak target suite yang cocok.
  - Gunakan ini sebelum menjalankan QA Lab saat Anda mengetahui perilaku atau path file
    yang tersentuh tetapi bukan skenario terkecilnya. Ini hanya bersifat saran; tetap pilih bukti mock,
    live, Multipass, Matrix, atau transport dari perilaku yang diubah.
- `pnpm test:plugins:kitchen-sink-live`
  - Menjalankan gauntlet Plugin live OpenAI Kitchen Sink melalui QA Lab. Ini
    menginstal paket eksternal Kitchen Sink, memverifikasi inventaris surface Plugin SDK,
    memeriksa `/healthz` dan `/readyz`, merekam bukti CPU/RSS
    Gateway, menjalankan satu turn OpenAI live, dan memeriksa diagnostik adversarial.
    Memerlukan autentikasi OpenAI live seperti `OPENAI_API_KEY`. Dalam sesi Testbox
    terhidrasi, ini otomatis memuat profil live-auth Testbox saat helper
    `openclaw-testbox-env` tersedia.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup Gateway plus paket skenario mock QA Lab kecil
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat dicatat sebagai metrik
    tanpa tampak seperti regresi Gateway peg berdurasi beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu saat checkout belum
    memiliki output runtime yang segar.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
  - Menggunakan kembali flag pemilihan provider/model yang sama seperti `qa suite`.
  - Proses live meneruskan input autentikasi QA yang didukung dan praktis untuk guest:
    key provider berbasis env, path konfigurasi provider live QA, dan `CODEX_HOME`
    saat ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis balik melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding API key OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi runtime Plugin terpaket dimuat tanpa perbaikan dependensi
    startup, menjalankan doctor, dan menjalankan satu turn agen lokal terhadap endpoint
    OpenAI yang di-mock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane instalasi terpaket
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi terbangun yang deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipersistenkan sebagai
    pesan kustom non-display alih-alih bocor ke turn pengguna yang terlihat,
    lalu menanam JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulang ke branch aktif dengan cadangan.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan onboarding paket terinstal,
    mengonfigurasi Telegram melalui CLI terinstal, lalu menggunakan kembali lane QA
    Telegram live dengan paket terinstal itu sebagai SUT Gateway.
  - Wrapper hanya me-mount sumber harness `qa-lab` dari checkout; paket
    terinstal memiliki `dist`, `openclaw/plugin-sdk`, dan runtime Plugin bundled
    sehingga lane tidak mencampur Plugin checkout saat ini ke dalam paket
    yang diuji.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; tetapkan
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah di-resolve alih-alih
    menginstal dari registry.
  - Mengeluarkan timing RTT berulang dalam `qa-evidence.json` secara default dengan
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Override
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, atau
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` untuk menyesuaikan proses RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` menerima daftar ID pemeriksaan QA
    Telegram yang dipisahkan koma untuk disampel; saat tidak ditetapkan, pemeriksaan default
    yang mendukung RTT adalah `telegram-mentioned-message-reply`.
  - Menggunakan kredensial env Telegram yang sama atau sumber kredensial Convex seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, tetapkan
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - Wrapper memvalidasi env kredensial Telegram atau Convex pada host sebelum
    pekerjaan build/install Docker. Tetapkan `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    hanya saat sengaja men-debug setup pra-kredensial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menggantikan
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk lane ini. Saat kredensial Convex
    dipilih dan tidak ada peran yang ditetapkan, wrapper menggunakan `ci` di CI dan
    `maintainer` di luar CI.
  - GitHub Actions mengekspos lane ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow menggunakan environment
    `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk side-run
  terhadap satu kandidat paket. Ini menerima ref tepercaya, spesifikasi npm yang dipublikasikan,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  scheduler Docker E2E yang ada dengan profil lane smoke, package, product, full, atau custom.
  Tetapkan `telegram_mode=mock-openai` atau `live-frontier` untuk menjalankan workflow
  QA Telegram terhadap artefak `package-under-test` yang sama.
  - Bukti produk beta terbaru:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bukti URL tarball persis memerlukan digest dan menggunakan kebijakan keamanan URL publik:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Mirror tarball enterprise/privat menggunakan kebijakan sumber tepercaya eksplisit:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` membaca `.github/package-trusted-sources.json` dari ref workflow tepercaya dan tidak menerima kredensial URL atau bypass jaringan privat input workflow. Jika kebijakan bernama mendeklarasikan autentikasi bearer, konfigurasikan secret tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Bukti artefak mengunduh artefak tarball dari run Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mengemas dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/Plugin bundled melalui edit
    konfigurasi.
  - Memverifikasi discovery setup membiarkan Plugin unduhan yang belum dikonfigurasi tetap tidak ada,
    perbaikan doctor terkonfigurasi pertama menginstal setiap Plugin unduhan yang hilang
    secara eksplisit, dan restart kedua tidak menjalankan perbaikan dependensi
    tersembunyi.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi doctor pasca-update
    kandidat membersihkan sisa dependensi Plugin legacy tanpa perbaikan postinstall
    sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke update instalasi paket native di seluruh guest Parallels. Setiap
    platform yang dipilih pertama-tama menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` yang terinstal dalam guest yang sama dan memverifikasi
    versi terinstal, status update, kesiapan Gateway, dan satu turn agen lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    melakukan iterasi pada satu guest. Gunakan `--json` untuk path artefak ringkasan dan
    status per lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk bukti turn agen live secara
    default. Berikan `--model <provider/model>` atau tetapkan
    `OPENCLAW_PARALLELS_OPENAI_MODEL` saat sengaja memvalidasi model
    OpenAI lain.
  - Bungkus run lokal yang panjang dalam timeout host agar stall transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap wrapper luar macet.
  - Update Windows dapat menghabiskan 10 hingga 15 menit dalam doctor pasca-update dan pekerjaan
    update paket pada guest dingin; itu masih sehat saat log debug npm bertingkat
    terus bergerak.
  - Jangan menjalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Semuanya berbagi state VM dan dapat bertabrakan pada
    pemulihan snapshot, penyajian paket, atau state Gateway guest.
  - Bukti pasca-update menjalankan surface Plugin bundled normal karena
    facade kapabilitas seperti speech, image generation, dan media
    understanding dimuat melalui API runtime bundled meskipun turn agen
    itu sendiri hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server penyedia AIMock lokal untuk pengujian smoke protokol langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel sekali pakai yang didukung Docker. Hanya checkout sumber - instalasi paket tidak menyertakan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, env var, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial pool bersama. Gunakan mode env secara default, atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut menggunakan lease pool.
  - Default mencakup canary, gating mention, pengalamatan perintah, `/status`, balasan bot-ke-bot yang disebutkan, dan balasan perintah native inti. Default `mock-openai` juga mencakup regresi deterministic reply-chain dan streaming pesan final Telegram. Gunakan `--list-scenarios` untuk probe opsional seperti `session_status`.
  - Keluar dengan non-zero saat skenario apa pun gagal. Gunakan `--allow-failures` saat Anda menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati traffic bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan `qa-evidence.json` di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang diamati.

`Mantis Telegram Live` adalah wrapper bukti PR di sekitar lane ini. Ini menjalankan ref kandidat dengan kredensial Telegram yang di-lease Convex, merender laporan QA yang disunting dan bundel bukti di browser desktop Crabbox, merekam bukti MP4, menghasilkan GIF yang dipangkas berdasarkan gerakan, mengunggah bundel artefak, dan memposting bukti PR inline melalui Mantis GitHub App saat `pr_number` diatur. Maintainer dapat memulainya dari UI Actions melalui `Mantis Scenario` (`scenario_id:
telegram-live`) atau langsung dari komentar pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` adalah wrapper agentic native Telegram Desktop sebelum/sesudah untuk bukti visual PR. Mulai dari UI Actions dengan `instructions` bentuk bebas, melalui `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), atau dari komentar PR:

```text
@openclaw-mantis telegram desktop proof
```

Agen Mantis membaca PR, memutuskan perilaku yang terlihat di Telegram mana yang membuktikan perubahan, menjalankan lane bukti Telegram Desktop pengguna nyata Crabbox pada ref baseline dan kandidat, mengiterasi hingga GIF native berguna, menulis manifes `motionPreview` berpasangan, dan memposting tabel GIF 2 kolom yang sama melalui Mantis GitHub App saat `pr_number` diatur.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Me-lease atau menggunakan ulang desktop Linux Crabbox, menginstal Telegram Desktop native, mengonfigurasi OpenClaw dengan token bot SUT Telegram yang di-lease, memulai gateway, dan merekam bukti screenshot/MP4 dari desktop VNC yang terlihat.
  - Default ke `--credential-source convex` sehingga workflow hanya memerlukan secret broker Convex. Gunakan `--credential-source env` dengan variabel `OPENCLAW_QA_TELEGRAM_*` yang sama seperti `pnpm openclaw qa telegram`.
  - Telegram Desktop masih memerlukan login/profil pengguna. Token bot hanya mengonfigurasi OpenClaw. Gunakan `--telegram-profile-archive-env <name>` untuk arsip profil `.tgz` base64, atau gunakan `--keep-lease` dan login manual melalui VNC sekali.
  - Menulis `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, dan `telegram-desktop-builder.mp4` di bawah direktori output.

Lane transport live berbagi satu kontrak standar agar transport baru tidak menyimpang; matriks cakupan per-lane berada di [ikhtisar QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetik luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk QA transport live, lab QA memperoleh lease eksklusif dari pool yang didukung Convex, melakukan Heartbeat pada lease tersebut saat lane berjalan, dan merilis lease saat shutdown. Nama bagian ini mendahului dukungan Discord, Slack, dan WhatsApp; kontrak lease dibagikan di semua jenis.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Env var yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, selain itu `maintainer`)

Env var opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID trace opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex `http://` loopback untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` harus menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (pool tambah/hapus/daftar) secara spesifik memerlukan `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum run live untuk memeriksa URL situs Convex, secret broker, prefiks endpoint, timeout HTTP, dan keterjangkauan admin/list tanpa mencetak nilai secret. Gunakan `--json` untuk output yang dapat dibaca mesin dalam skrip dan utilitas CI.

Kontrak endpoint default (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Permintaan: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Berhasil: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Habis/dapat dicoba ulang: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Berhasil: `{ status: "ok", index, data }`
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
  - Guard lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya secret maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string ID chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang malformed.

Bentuk payload untuk jenis pengguna nyata Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, dan `telegramApiId` harus berupa string numerik.
- `tdlibArchiveSha256` dan `desktopTdataArchiveSha256` harus berupa string hex SHA-256.
- `kind: "telegram-user"` dicadangkan untuk workflow bukti Mantis Telegram Desktop. Lane QA Lab generik tidak boleh memperolehnya.

Payload multi-channel yang divalidasi broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Lane Slack juga dapat me-lease dari pool, tetapi validasi payload Slack saat ini berada di runner QA Slack, bukan di broker. Gunakan `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` untuk baris Slack.

### Menambahkan channel ke QA

Arsitektur dan nama helper skenario untuk adapter channel baru berada di [ikhtisar QA → Menambahkan channel](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` dalam manifes Plugin, mount sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Suite pengujian (apa berjalan di mana)

Anggap suite sebagai "realisme meningkat" (dan flakiness/biaya meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfig: run tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi konfig per-proyek untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam-proses (auth gateway, routing, tooling, parsing, konfig)
  - Regresi deterministic untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan `runtime-api.js` yang luas dengan fixture Plugin kecil yang dihasilkan, bukan API sumber Plugin bundled nyata. Load API Plugin nyata termasuk dalam suite kontrak/integrasi milik Plugin.

Kebijakan dependensi native:

- Instalasi pengujian default melewati build opus Discord native opsional. Voice Discord menggunakan `libopus-wasm` bundled, dan `@discordjs/opus` tetap dinonaktifkan di `allowBuilds` sehingga pengujian lokal dan lane Testbox tidak mengompilasi addon native.
- Bandingkan performa opus native di repo benchmark `libopus-wasm`, bukan di loop install/test OpenClaw default. Jangan atur `@discordjs/opus` ke `true` dalam `allowBuilds` default; itu membuat loop install/test yang tidak terkait mengompilasi kode native.

<AccordionGroup>
  <Accordion title="Proyek, shard, dan lane tercakup">

    - Eksekusi `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses proyek root native yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sedang sibuk dan mencegah pekerjaan balasan otomatis/ekstensi membuat suite yang tidak terkait kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan grafik proyek root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane berskala terbatas terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tidak perlu membayar biaya startup penuh proyek root.
    - `pnpm test:changed` secara default memperluas path git yang berubah menjadi lane berskala terbatas yang murah: edit test langsung, file sibling `*.test.ts`, pemetaan sumber eksplisit, dan dependen grafik impor lokal. Edit config/setup/package tidak menjalankan test secara luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal cerdas normal untuk pekerjaan sempit. Perintah ini mengklasifikasikan diff menjadi core, test core, ekstensi, test ekstensi, app, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan perintah typecheck, lint, dan guard yang sesuai. Perintah ini tidak menjalankan test Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti test. Kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi-root bertarget, dengan guard yang menolak perubahan package di luar field versi tingkat atas.
    - Edit harness Docker ACP live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip auth Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan saat diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, ekspor, versi, dan permukaan package lain tetap menggunakan guard yang lebih luas.
    - Test unit ringan impor dari agen, command, Plugin, helper balasan otomatis, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/berat-runtime tetap berada di lane yang sudah ada.
    - File sumber helper `plugin-sdk` dan `commands` tertentu juga memetakan eksekusi mode berubah ke test sibling eksplisit di lane ringan tersebut, sehingga edit helper tidak menjalankan ulang seluruh suite berat untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, test integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI lebih lanjut membagi subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket berat impor tidak menguasai seluruh ekor Node.
    - CI PR/main normal secara sengaja melewati sweep batch ekstensi dan shard khusus rilis `agentic-plugins`. Full Release Validation menjalankan workflow anak `Plugin Prerelease` terpisah untuk suite yang berat Plugin/ekstensi tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input discovery alat pesan atau konteks runtime Compaction,
      pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi
      murni.
    - Jaga suite integrasi runner tertanam tetap sehat:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id berskala terbatas dan perilaku Compaction tetap mengalir
      melalui path nyata `run.ts` / `compact.ts`; test khusus helper
      bukan pengganti yang memadai untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Config dasar Vitest secara default menggunakan `threads`.
    - Config Vitest bersama menetapkan `isolate: false` dan menggunakan runner
      non-terisolasi di seluruh proyek root, e2e, dan config live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi juga berjalan pada
      runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari config Vitest bersama.
    - `scripts/run-vitest.mjs` secara default menambahkan `--no-maglev` untuk proses Node
      anak Vitest guna mengurangi churn kompilasi V8 selama eksekusi lokal besar.
      Tetapkan `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkannya dengan perilaku
      V8 standar.
    - `scripts/run-vitest.mjs` menghentikan eksekusi Vitest non-watch eksplisit setelah
      5 menit tanpa output stdout atau stderr. Tetapkan
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` untuk menonaktifkan watchdog untuk
      investigasi yang sengaja senyap.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh diff.
    - Hook pre-commit hanya untuk pemformatan. Hook ini melakukan stage ulang file yang diformat dan
      tidak menjalankan lint, typecheck, atau test.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push saat Anda
      memerlukan gate pemeriksaan lokal cerdas.
    - `pnpm test:changed` secara default merutekan melalui lane berskala terbatas yang murah. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya saat agen
      memutuskan bahwa edit harness, config, package, atau kontrak benar-benar membutuhkan cakupan
      Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing
      yang sama, hanya dengan batas worker yang lebih tinggi.
    - Autoscaling worker lokal sengaja konservatif dan mundur
      saat rata-rata beban host sudah tinggi, sehingga beberapa eksekusi
      Vitest konkuren secara default menimbulkan dampak lebih kecil.
    - Config dasar Vitest menandai proyek/file config sebagai
      `forceRerunTriggers` sehingga rerun mode berubah tetap benar saat wiring
      test berubah.
    - Config mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada host yang didukung;
      tetapkan `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
      output perincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data waktu shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Eksekusi seluruh config menggunakan path config sebagai kunci; shard CI
      include-pattern menambahkan nama shard sehingga shard terfilter dapat dilacak
      secara terpisah.
    - Saat satu test panas masih menghabiskan sebagian besar waktunya pada impor startup,
      letakkan dependensi berat di balik seam lokal sempit `*.runtime.ts` dan
      mock seam itu secara langsung alih-alih melakukan deep-import helper runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan path proyek root native untuk diff yang sudah di-commit
      tersebut dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark terhadap tree kotor saat ini
      dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan config root Vitest.
    - `pnpm test:perf:profile:main` menulis profil CPU thread utama untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Command: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara default
  - Menjalankan churn pesan gateway sintetis, memori, dan payload besar melalui path event diagnostik
  - Mengueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundle stabilitas diagnostik
  - Memastikan recorder tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per-sesi kembali turun ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa kunci
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway lengkap

### E2E (agregat repo)

- Command: `pnpm test:e2e`
- Cakupan:
  - Menjalankan lane E2E smoke gateway
  - Menjalankan lane E2E browser Control UI yang di-mock
- Ekspektasi:
  - Aman untuk CI dan tanpa kunci
  - Memerlukan Playwright Chromium sudah terinstal

### E2E (smoke gateway)

- Command: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan test E2E Plugin terbundel di bawah `extensions/`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, sama seperti bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: default 1).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi pada 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan di pipeline)
  - Tidak memerlukan kunci nyata
  - Lebih banyak bagian bergerak daripada test unit (bisa lebih lambat)

### E2E (browser Control UI yang di-mock)

- Command: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- File: `ui/src/**/*.e2e.test.ts`
- Cakupan:
  - Memulai Vite Control UI
  - Menjalankan halaman Chromium nyata melalui Playwright
  - Mengganti WebSocket Gateway dengan mock dalam-browser yang deterministik
- Ekspektasi:
  - Berjalan di CI sebagai bagian dari `pnpm test:e2e`
  - Tidak memerlukan Gateway, agen, atau kunci provider nyata
  - Dependensi browser harus tersedia (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke backend OpenShell

- Command: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Menggunakan ulang gateway OpenShell lokal yang aktif
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + exec SSH
  - Memverifikasi perilaku filesystem remote-kanonis melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari eksekusi default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Memerlukan gateway OpenShell lokal aktif dan sumber config-nya
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan sandbox test
- Override berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan test saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI non-default atau skrip wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` untuk mengekspos config gateway terdaftar ke test terisolasi
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` untuk mengganti IP gateway Docker yang digunakan oleh fixture kebijakan host

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live bundled-plugin di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (mengatur `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - "Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?"
  - Menangkap perubahan format provider, kejanggalan tool-calling, masalah autentikasi, dan perilaku rate limit
- Ekspektasi:
  - Sengaja tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, gangguan layanan)
  - Memerlukan biaya / menggunakan rate limit
  - Lebih baik menjalankan subset yang dipersempit daripada "semuanya"
- Jalankan live menggunakan kunci API yang sudah diekspor dan profil autentikasi yang sudah disiapkan.
- Secara default, jalankan live tetap mengisolasi `HOME` dan menyalin material konfigurasi/autentikasi ke home pengujian sementara sehingga fixture unit tidak dapat mengubah `~/.openclaw` asli Anda.
- Atur `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda sengaja perlu pengujian live menggunakan direktori home asli Anda.
- `pnpm test:live` secara default menggunakan mode yang lebih senyap: mode ini mempertahankan output progres `[live] ...` dan membisukan log bootstrap gateway/obrolan Bonjour. Atur `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup lengkap kembali.
- Rotasi kunci API (khusus provider): atur `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba ulang saat menerima respons rate limit.
- Output progres/heartbeat:
  - Suite live kini memancarkan baris progres ke stderr sehingga panggilan provider yang lama terlihat aktif meskipun tangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway mengalir langsung selama jalankan live.
  - Sesuaikan heartbeat direct-model dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug "bot saya mati" / kegagalan khusus provider / tool calling: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness app-server Codex, dan semua pengujian live provider media (Deepgram, BytePlus, ComfyUI, gambar, musik, video, harness media) - plus penanganan kredensial untuk jalankan live - lihat [Menguji suite live](/id/help/testing-live). Untuk checklist khusus validasi pembaruan dan plugin, lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner live-model: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori konfigurasi lokal, workspace, dan file env profil opsional Anda. Entrypoint lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker mempertahankan batas praktisnya sendiri bila diperlukan:
  `test:docker:live-models` secara default menggunakan set terseleksi yang didukung dan bernilai sinyal tinggi, dan
  `test:docker:live-gateway` secara default menggunakan `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Atur `OPENCLAW_LIVE_MAX_MODELS`
  atau env var gateway ketika Anda secara eksplisit menginginkan batas yang lebih kecil atau pemindaian yang lebih besar.
- `test:docker:all` membangun image Docker live sekali melalui `test:docker:live-build`, mengemas OpenClaw sekali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image dasar hanya runner Node/Git untuk lane install/update/plugin-dependency; lane tersebut me-mount tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas built-app. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` menjalankan rencana yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas resource mencegah lane live berat, npm-install, dan multi-service semuanya dimulai sekaligus. Jika satu lane lebih berat daripada batas aktif, scheduler tetap dapat memulainya ketika pool kosong lalu membiarkannya berjalan sendiri hingga kapasitas tersedia kembali. Defaultnya adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya ketika host Docker memiliki ruang kapasitas lebih. Runner melakukan preflight Docker secara default, menghapus container OpenClaw E2E yang usang, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih lama lebih dulu pada jalankan berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI bagi lane yang dipilih, kebutuhan package/image, dan kredensial.
- `Package Acceptance` adalah gate package native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Gate ini menyelesaikan satu package kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane Docker E2E yang dapat digunakan ulang terhadap tarball persis tersebut alih-alih mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan keluasan: `smoke`, `package`, `product`, dan `full`. Lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins) untuk kontrak package/update/plugin, matriks published-upgrade survivor, default rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri grafik build statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi package seperti Commander, UI prompt, undici, atau logging sebelum dispatch perintah; guard juga menjaga chunk run gateway yang dibundel tetap dalam anggaran dan menolak import statis dari path gateway dingin yang diketahui. Smoke CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema konfigurasi, dan perintah daftar model.
- Kompatibilitas legacy Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga batas tersebut, harness hanya menoleransi celah metadata package yang sudah dikirimkan: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` persisten yang hilang, lokasi install-record plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Untuk package setelah `2026.4.25`, path tersebut menjadi kegagalan ketat.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` mem-boot satu atau beberapa container nyata dan memverifikasi path integrasi tingkat lebih tinggi.
- Lane Docker/Bash E2E yang menginstal tarball OpenClaw terkemas melalui `scripts/lib/openclaw-e2e-instance.sh` membatasi `npm install` pada `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (default `600s`; atur `0` untuk menonaktifkan wrapper saat debugging).

Runner Docker live-model juga hanya bind-mount home autentikasi CLI yang diperlukan (atau semua yang didukung ketika jalankan tidak dipersempit), lalu menyalinnya ke home container sebelum dijalankan sehingga OAuth CLI eksternal dapat menyegarkan token tanpa mengubah store autentikasi host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observability: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, dan `pnpm qa:observability:smoke` adalah lane source-checkout QA privat. Lane tersebut sengaja tidak menjadi bagian dari lane rilis Docker package karena tarball npm menghilangkan QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding lengkap): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agen tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw terkemas secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, menjalankan doctor, dan menjalankan satu giliran agen OpenAI tiruan. Gunakan ulang tarball yang sudah dibangun dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` atau `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke perjalanan pengguna rilis: `pnpm test:docker:release-user-journey` menginstal tarball OpenClaw yang sudah dikemas secara global di home Docker yang bersih, menjalankan onboarding, mengonfigurasi provider OpenAI tiruan, menjalankan satu giliran agent, menginstal/menghapus instalasi Plugin eksternal, mengonfigurasi ClickClack terhadap fixture lokal, memverifikasi pesan keluar/masuk, memulai ulang Gateway, dan menjalankan doctor.
- Smoke onboarding bertipe rilis: `pnpm test:docker:release-typed-onboarding` menginstal tarball yang sudah dikemas, menjalankan `openclaw onboard` melalui TTY nyata, mengonfigurasi OpenAI sebagai provider env-ref, memverifikasi tidak ada persistensi kunci mentah, dan menjalankan satu giliran agent tiruan.
- Smoke media/memori rilis: `pnpm test:docker:release-media-memory` menginstal tarball yang sudah dikemas, memverifikasi pemahaman gambar dari lampiran PNG, keluaran pembuatan gambar yang kompatibel dengan OpenAI, recall pencarian memori, dan kelangsungan recall setelah Gateway dimulai ulang.
- Smoke perjalanan pengguna upgrade rilis: `pnpm test:docker:release-upgrade-user-journey` secara default menginstal baseline terbitan terbaru yang lebih lama daripada tarball kandidat, mengonfigurasi status provider/Plugin/ClickClack pada paket terbitan, melakukan upgrade ke tarball kandidat, lalu menjalankan ulang perjalanan inti agent/Plugin/channel. Jika tidak ada baseline terbitan yang lebih lama, versi kandidat digunakan kembali. Timpa baseline dengan `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke marketplace Plugin rilis: `pnpm test:docker:release-plugin-marketplace` menginstal dari marketplace fixture lokal, memperbarui Plugin yang terinstal, menghapus instalasinya, dan memverifikasi CLI Plugin hilang dengan metadata instalasi dipangkas.
- Smoke instalasi Skill: `pnpm test:docker:skill-install` menginstal tarball OpenClaw yang sudah dikemas secara global di Docker, menonaktifkan instalasi arsip unggahan dalam konfigurasi, menyelesaikan slug skill ClawHub live saat ini dari pencarian, menginstalnya dengan `openclaw skills install`, dan memverifikasi skill yang terinstal plus metadata asal/kunci `.clawhub`.
- Smoke pergantian channel pembaruan: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang sudah dikemas secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipersistenkan dan pekerjaan pascapembaruan Plugin, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke penyintas upgrade: `pnpm test:docker:upgrade-survivor` menginstal tarball OpenClaw yang sudah dikemas di atas fixture pengguna lama yang kotor dengan agent, konfigurasi channel, allowlist Plugin, status dependensi Plugin kedaluwarsa, serta file workspace/session yang sudah ada. Ini menjalankan pembaruan paket plus doctor noninteraktif tanpa provider live atau kunci channel, lalu memulai Gateway loopback dan memeriksa pelestarian konfigurasi/status plus anggaran startup/status.
- Smoke penyintas upgrade terbitan: `pnpm test:docker:published-upgrade-survivor` secara default menginstal `openclaw@latest`, menyemai file pengguna yang sudah ada secara realistis, mengonfigurasi baseline tersebut dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi terbitan itu ke tarball kandidat, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent yang dikonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, dan anggaran status RPC. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta scheduler agregat memperluas baseline lokal persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; set reported-issues mencakup `configured-plugin-installs` untuk perbaikan instalasi Plugin OpenClaw eksternal otomatis. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`, menyelesaikan token meta baseline seperti `last-stable-4` atau `all-since-2026.4.23`, dan Full Release Validation memperluas gate paket release-soak menjadi `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke konteks runtime session: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor atas cabang prompt-rewrite duplikat yang terdampak.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas tree saat ini, menginstalnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan provider gambar bawaan alih-alih macet. Gunakan kembali tarball yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh container root, update, dan direct-npm miliknya. Smoke pembaruan secara default menggunakan npm `latest` sebagai baseline stabil sebelum upgrade ke tarball kandidat. Timpa secara lokal dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, atau dengan input `update_baseline_version` milik workflow Install Smoke di GitHub. Pemeriksaan installer non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku instalasi lokal pengguna. Setel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/update/direct-npm di seluruh pengulangan lokal.
- CI Install Smoke melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env tersebut saat cakupan langsung `npm install -g` diperlukan.
- Smoke CLI penghapusan workspace bersama agent: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) secara default membangun image Dockerfile root, menyemai dua agent dengan satu workspace di home container terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku workspace yang dipertahankan. Gunakan kembali image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua container, auth WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber plus layer Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, elemen dapat diklik yang dipromosikan kursor, ref iframe, dan metadata frame.
- Regresi reasoning minimal OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan skema provider dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway tersemai + bridge stdio + smoke frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- MCP tools bundel OpenClaw (server MCP stdio nyata + smoke allow/deny profil OpenClaw tertanam): `pnpm test:docker:agent-bundle-mcp-tools` (skrip: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagent (Gateway nyata + teardown child MCP stdio setelah Cron terisolasi dan run subagent sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke instalasi/pembaruan untuk path lokal, `file:`, registry npm dengan dependensi yang di-hoist, metadata paket npm malformed, ref git bergerak, kitchen-sink ClawHub, pembaruan marketplace, dan aktifkan/inspeksi bundel Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Setel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan paket/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal hermetik.
- Smoke pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks lifecycle Plugin: `pnpm test:docker:plugin-lifecycle-matrix` menginstal tarball OpenClaw yang sudah dikemas di container kosong, menginstal Plugin npm, mengalihkan enable/disable, melakukan upgrade dan downgrade melalui registry npm lokal, menghapus kode yang terinstal, lalu memverifikasi uninstall tetap menghapus status kedaluwarsa sambil mencatat metrik RSS/CPU untuk setiap fase lifecycle.
- Smoke metadata reload konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke instalasi/pembaruan untuk path lokal, `file:`, registry npm dengan dependensi yang di-hoist, ref git bergerak, fixture ClawHub, pembaruan marketplace, dan aktifkan/inspeksi bundel Claude. `pnpm test:docker:plugin-update` mencakup perilaku pembaruan tanpa perubahan untuk Plugin terinstal. `pnpm test:docker:plugin-lifecycle-matrix` mencakup instalasi, enable, disable, upgrade, downgrade, dan uninstall kode-hilang untuk Plugin npm dengan pelacakan sumber daya.

Untuk melakukan prebuild dan menggunakan kembali image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat disetel. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip akan menariknya jika belum ada secara lokal. Pengujian Docker QR dan installer mempertahankan Dockerfile masing-masing karena memvalidasi perilaku paket/instalasi, bukan runtime aplikasi-terbangun bersama.

Pelaksana Docker model langsung juga melakukan bind-mount checkout saat ini sebagai hanya-baca dan
menyiapkannya ke workdir sementara di dalam kontainer. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap sumber/konfigurasi lokal persis milik Anda.
Langkah penyiapan melewati cache besar yang hanya lokal dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build` lokal aplikasi atau
Gradle agar run langsung Docker tidak menghabiskan menit-menit untuk menyalin
artefak khusus mesin.
Pelaksana itu juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` agar probe langsung gateway tidak memulai
worker kanal Telegram/Discord/dll. nyata di dalam kontainer.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan langsung gateway
dari jalur Docker tersebut.
`test:docker:openwebui` adalah uji asap kompatibilitas tingkat lebih tinggi: ini memulai
kontainer Gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai kontainer Open WebUI yang dipin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proksi `/api/chat/completions` milik Open WebUI.
Tetapkan `OPENWEBUI_SMOKE_MODE=models` untuk pemeriksaan CI jalur rilis yang harus berhenti
setelah masuk Open WebUI dan penemuan model, tanpa menunggu penyelesaian model langsung.
Run pertama bisa terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan penyiapan cold-start miliknya sendiri.
Jalur ini mengharapkan kunci model langsung yang dapat digunakan. Sediakan melalui environment
proses, profil auth yang disiapkan, atau `OPENCLAW_PROFILE_FILE` eksplisit.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage nyata. Ini mem-boot kontainer Gateway
berseed, memulai kontainer kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event langsung, perutean kirim keluar, serta notifikasi kanal +
izin bergaya Claude melalui jembatan MCP stdio nyata. Pemeriksaan notifikasi
memeriksa frame MCP stdio mentah secara langsung sehingga uji asap memvalidasi apa yang
benar-benar dipancarkan jembatan, bukan hanya apa yang kebetulan diekspos SDK klien tertentu.
`test:docker:agent-bundle-mcp-tools` deterministik dan tidak memerlukan kunci model langsung.
Ini membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam kontainer, mematerialisasikan server tersebut melalui runtime MCP bundle OpenClaw
tertanam, mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` deterministik dan tidak memerlukan kunci model langsung.
Ini memulai Gateway berseed dengan server probe MCP stdio nyata, menjalankan
giliran cron terisolasi dan giliran anak sekali jalan `sessions_spawn`, lalu memverifikasi
proses anak MCP keluar setelah setiap run.

Uji asap thread ACP bahasa biasa manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk alur kerja regresi/debug. Ini mungkin diperlukan lagi untuk validasi perutean thread ACP, jadi jangan hapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) dipasang ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) dipasang ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` dipasang dan disource sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang disource dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori konfigurasi/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) dipasang ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` dipasang hanya-baca di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run penyedia yang dipersempit hanya memasang direktori/file yang diperlukan yang diinfer dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter penyedia di dalam kontainer
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan kembali image `openclaw:local-live` yang ada untuk rerun yang tidak memerlukan build ulang
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk uji asap Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh uji asap Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipin

## Kewarasan docs

Jalankan pemeriksaan docs setelah edit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga membutuhkan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi "pipeline nyata" tanpa penyedia nyata:

- Pemanggilan tool Gateway (mock OpenAI, gateway nyata + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis konfigurasi + auth diberlakukan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agen (Skills)

Kita sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti "evaluasi keandalan agen":

- Pemanggilan tool mock melalui Gateway nyata + loop agen (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek konfigurasi (`src/gateway/gateway.test.ts`).

Yang masih belum ada untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat Skills dicantumkan di prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum penggunaan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang mengasersi urutan tool, penerusan riwayat sesi, dan batas sandbox.

Evaluasi masa depan harus tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan penyedia mock untuk mengasersi panggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, injeksi prompt).
- Evaluasi langsung opsional (opt-in, digate env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk Plugin dan kanal)

Pengujian kontrak memverifikasi bahwa setiap Plugin dan kanal terdaftar mematuhi
kontrak antarmukanya. Pengujian ini mengiterasi semua Plugin yang ditemukan dan menjalankan suite
asersi bentuk dan perilaku. Jalur unit default `pnpm test` sengaja
melewati file seam bersama dan uji asap ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh surface kanal atau penyedia bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Kontrak kanal saja: `pnpm test:contracts:channels`
- Kontrak penyedia saja: `pnpm test:contracts:plugins`

### Kontrak kanal

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk Plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard penyiapan
- **session-binding** - Perilaku pengikatan sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi kanal
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Pemberlakuan kebijakan grup

### Kontrak status penyedia

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status kanal
- **registry** - Bentuk registry Plugin

### Kontrak penyedia

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/pemilihan auth
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime penyedia
- **shape** - Bentuk/antarmuka Plugin
- **wizard** - Wizard penyiapan

### Kapan menjalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi Plugin kanal atau penyedia
- Setelah merefaktor pendaftaran atau penemuan Plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan kunci API nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah penyedia/model yang ditemukan secara langsung:

- Tambahkan regresi aman untuk CI jika memungkinkan (penyedia mock/stub, atau tangkap transformasi bentuk permintaan persisnya)
- Jika secara inheren hanya langsung (batas laju, kebijakan auth), pertahankan pengujian langsung tetap sempit dan opt-in melalui env var
- Lebih pilih menargetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan penyedia → pengujian model langsung
  - bug pipeline sesi/riwayat/tool gateway → uji asap langsung gateway atau pengujian mock gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu mengasersi id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian tersebut. Pengujian itu sengaja gagal pada id target yang tidak terklasifikasi agar kelas baru tidak dapat dilewati diam-diam.

## Terkait

- [Pengujian langsung](/id/help/testing-live)
- [Pengujian pembaruan dan Plugin](/id/help/testing-updates-plugins)
- [CI](/id/ci)
