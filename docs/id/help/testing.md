---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan pengujian regresi untuk bug model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Perangkat pengujian: rangkaian pengujian unit/e2e/live, runner Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-07-19T04:59:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20e0aa22bf16561334f83342abffabb387ed0b41b901773939123ecfbc0ae330
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga rangkaian Vitest (unit/integrasi, e2e, live) ditambah runner Docker. Halaman ini membahas cakupan setiap rangkaian, perintah yang harus dijalankan untuk alur kerja tertentu, cara pengujian live menemukan kredensial, serta cara menambahkan regresi untuk bug penyedia/model di dunia nyata.

<Note>
**Tumpukan QA (qa-lab, qa-channel, jalur transportasi live)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - arsitektur, permukaan perintah, penulisan skenario, dan profil Matrix.
- [Kartu skor kematangan](/id/maturity/scorecard) - cara bukti QA rilis mendukung keputusan stabilitas dan LTS.
- [Channel QA](/id/channels/qa-channel) - plugin transportasi sintetis yang digunakan oleh skenario berbasis repositori.

Halaman ini membahas rangkaian pengujian reguler serta runner Docker/Parallels. [Runner khusus QA](#qa-specific-runners) di bawah mencantumkan pemanggilan `qa` yang konkret dan merujuk kembali ke referensi di atas.
</Note>

## Mulai cepat

Pada sebagian besar hari:

- Gate lengkap (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Menjalankan rangkaian lengkap secara lokal dengan lebih cepat pada mesin berkapasitas besar: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung juga merutekan path plugin/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Saat melakukan iterasi pada satu kegagalan, utamakan proses yang ditargetkan terlebih dahulu.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Jalur QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan tambahan:

- Laporan cakupan V8 informasional: `pnpm test:coverage`
- Rangkaian E2E: `pnpm test:e2e`

## Direktori Sementara Pengujian

Gunakan helper bersama di `test/helpers/temp-dir.ts` untuk direktori sementara milik pengujian agar kepemilikan bersifat eksplisit dan pembersihan tetap berada dalam siklus hidup pengujian:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("menggunakan ruang kerja sementara", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // gunakan ruang kerja
});
```

`useAutoCleanupTempDirTracker(afterEach)` sengaja tidak menyediakan metode pembersihan manual - Vitest memiliki pembersihan setelah setiap pengujian. Helper tingkat rendah yang lebih lama (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) masih tersedia untuk pengujian yang belum dimigrasikan; hindari penggunaan baru helper tersebut dan hindari pemanggilan `fs.mkdtemp*` baru secara langsung, kecuali pengujian secara eksplisit memverifikasi perilaku direktori sementara mentah. Jika direktori sementara langsung benar-benar diperlukan, tambahkan komentar izin yang dapat diaudit beserta alasannya:

```ts
// openclaw-temp-dir: allow memverifikasi perilaku pembersihan fs mentah
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` melaporkan pembuatan direktori sementara langsung yang baru dan penggunaan manual helper bersama yang baru dalam baris diff yang ditambahkan, tanpa memblokir gaya pembersihan yang sudah ada. Ini mengikuti klasifikasi path pengujian yang sama dengan `scripts/changed-lanes.mjs` dan melewati implementasi helper bersama itu sendiri. `check:changed` menjalankan laporan ini untuk path pengujian yang berubah sebagai sinyal CI khusus peringatan (anotasi peringatan GitHub, bukan kegagalan).

## Alur kerja live dan Docker/Parallels

Saat men-debug penyedia/model nyata (memerlukan kredensial nyata):

- Rangkaian live (model + probe alat/gambar Gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: dispatch `OpenClaw Performance` dengan
  `live_openai_candidate=true` untuk giliran agen `openai/gpt-5.6-luna` nyata atau
  `deep_profile=true` untuk artefak CPU/heap/trace Kova. Proses terjadwal harian
  menerbitkan laporan jalur penyedia tiruan, profil mendalam, dan GPT-5.6 Luna ke
  `openclaw/clawgrit-reports` dari job penerbit terpisah yang menggunakan artefak;
  autentikasi penerbit yang hilang atau tidak valid menyebabkan proses terjadwal dan
  `profile=release` gagal. Dispatch manual non-rilis mempertahankan artefak GitHub
  dan memperlakukan penerbitan laporan sebagai saran. Laporan penyedia tiruan juga
  menyertakan angka boot Gateway tingkat sumber, memori, tekanan plugin, loop hello
  model palsu berulang, dan startup CLI.
- Penyisiran model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih menjalankan satu giliran teks ditambah probe kecil bergaya pembacaan file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan satu giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil alur kerja live/E2E yang dapat digunakan kembali dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker
    yang dibagi menurut penyedia.
  - Untuk menjalankan ulang CI secara terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret penyedia baru dengan sinyal tinggi ke `scripts/ci-hydrate-live-auth.sh`
    serta `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan jalur live Docker terhadap path app-server Codex, mengikat
    DM Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui binding plugin native, bukan ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness app-server Codex
    milik plugin, memverifikasi `/codex status` dan `/codex models`, serta secara default
    menjalankan probe gambar, cron MCP, subagen, dan Guardian. Nonaktifkan
    probe subagen dengan `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat
    mengisolasi kegagalan lain. Untuk pemeriksaan subagen yang terfokus, nonaktifkan
    probe lainnya:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Proses ini keluar setelah probe subagen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ditetapkan.
- Smoke penginstalan Codex sesuai permintaan: `pnpm test:docker:codex-on-demand`
  - Menginstal tarball OpenClaw yang dikemas di Docker, menjalankan onboarding
    dengan kunci API OpenAI, dan memverifikasi plugin Codex beserta dependensi
    `@openai/codex` diunduh sesuai permintaan ke root proyek npm terkelola.
- Smoke paket live plugin npm Codex: `pnpm test:docker:live-codex-npm-plugin`
  - Menginstal paket kandidat OpenClaw dan plugin Codex yang persis ke Docker,
    lalu menggunakan kunci OpenAI nyata untuk preflight CLI dan giliran dalam sesi yang sama.
  - Giliran tindak lanjutnya dengan pemikiran sedang tanpa percobaan ulang harus mengirim progres, terus
    bekerja melalui pembacaan ruang kerja acak dan penulisan artefak yang persis,
    lalu mengirim penyelesaian. Giliran terminal yang hanya berisi progres menyebabkan jalur gagal.
- Smoke dependensi alat plugin live: `pnpm test:docker:live-plugin-tool`
  - Mengemas plugin fixture dengan dependensi `slugify` nyata, menginstalnya
    melalui `npm-pack:`, memverifikasi dependensi di bawah root proyek npm
    terkelola, lalu meminta model OpenAI live untuk memanggil alat plugin dan
    mengembalikan slug tersembunyi.
- Smoke perintah penyelamatan OpenClaw: `pnpm test:live:system-agent-rescue-channel`
  - Pemeriksaan berlapis opsional untuk permukaan perintah penyelamatan channel pesan.
    Menjalankan `/openclaw status`, mengantrekan perubahan model persisten,
    membalas `/openclaw yes`, dan memverifikasi path penulisan audit/konfigurasi.
- Smoke Docker saat pertama kali menjalankan OpenClaw: `pnpm test:docker:system-agent-first-run`
  - Dimulai dari direktori status OpenClaw yang kosong dan terlebih dahulu membuktikan CLI
    `openclaw setup` yang dikemas gagal secara tertutup tanpa inferensi. Kemudian
    menguji dan mengaktifkan Claude palsu melalui modul aktivasi yang dikemas.
    Hanya setelah itu permintaan CLI terpaket yang samar mencapai perencana dan
    ditetapkan menjadi penyiapan bertipe, diikuti operasi model sekali jalan, agen,
    konfigurasi Discord, dan SecretRef. Proses ini memvalidasi konfigurasi dan entri audit.
    Ini merupakan bukti pendukung gate/operasi, bukan bukti onboarding interaktif atau
    agen/alat/persetujuan OpenClaw. Jalur yang sama disediakan di QA Lab oleh
    `pnpm openclaw qa suite --scenario system-agent-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` ditetapkan, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` yang terisolasi
  terhadap `moonshot/kimi-k2.6`. Verifikasi bahwa JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Jika Anda hanya memerlukan satu kasus yang gagal, utamakan mempersempit pengujian live melalui variabel lingkungan daftar izin yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah ini tersedia bersama rangkaian pengujian utama saat Anda memerlukan realisme QA-lab.

CI menjalankan QA Lab dalam alur kerja khusus. Paritas agentik disarangkan di bawah
`QA-Lab - All Lanes` dan validasi rilis, bukan sebagai alur kerja PR mandiri.
Validasi luas harus menggunakan `Full Release Validation` dengan
`rerun_group=qa-parity` atau grup QA pemeriksaan rilis. Pemeriksaan rilis stabil/default
mempertahankan soak live/Docker menyeluruh di balik `run_release_soak=true`; profil
`full` memaksa soak aktif. `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan
dari dispatch manual dengan jalur paritas tiruan, jalur Matrix live,
jalur Telegram live yang dikelola Convex, dan jalur Discord live yang dikelola Convex sebagai
job paralel. QA terjadwal dan pemeriksaan rilis menjalankan profil rilis Matrix
melalui adaptor live bersama. Default CLI Matrix dan input alur kerja manual
tetap `all`; dispatch `all` manual menyebar ke profil transportasi, media, dan
E2EE, sedangkan dispatch terfokus dapat memilih `fast`, `release`, atau
`transport`. `OpenClaw Release Checks` menjalankan paritas ditambah profil adaptor live Matrix
yang dapat digunakan kembali dan jalur Telegram sebelum persetujuan rilis. Pemeriksaan
transportasi rilis menggunakan `mock-openai/gpt-5.6-luna` agar tetap deterministik dan
menghindari startup plugin penyedia normal. Gateway transportasi live ini
menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh rangkaian paritas QA.

Shard media live rilis lengkap menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibuat sekali untuk setiap commit yang dipilih,
lalu mengambilnya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, alih-alih membuatnya ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo secara langsung pada host.
  - Menulis artefak tingkat teratas `qa-evidence.json`, `qa-suite-summary.json`, dan
    `qa-suite-report.md` untuk kumpulan skenario yang dipilih, termasuk
    pilihan skenario alur campuran, Vitest, dan Playwright.
  - Saat dipicu oleh `pnpm openclaw qa run --qa-profile <profile>`, menyematkan
    kartu skor profil taksonomi yang dipilih dalam `qa-evidence.json` yang sama.
    `smoke-ci` menulis bukti ringkas (`evidenceMode: "slim"`, tanpa
    `execution` per entri). `release` mencakup bagian kesiapan rilis yang dikurasi; `all`
    memilih setiap kategori kematangan aktif dan menargetkan pemicuan alur kerja
    Bukti Profil QA secara eksplisit saat artefak kartu skor lengkap diperlukan.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan worker
    Gateway yang terisolasi. `qa-channel` secara default menggunakan konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    worker, atau `--concurrency 1` untuk jalur serial lama.
  - Keluar dengan nilai bukan nol ketika skenario apa pun gagal. Gunakan `--allow-failures` untuk
    menghasilkan artefak tanpa kode keluar kegagalan.
  - Mendukung mode penyedia `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server penyedia lokal yang didukung AIMock untuk cakupan eksperimental
    fixture dan mock protokol tanpa menggantikan jalur `mock-openai`
    yang mempertimbangkan skenario.
- `pnpm openclaw qa coverage --match <query>`
  - Mencari ID skenario, judul, permukaan, ID cakupan, referensi dokumentasi, referensi
    kode, plugin, dan persyaratan penyedia, lalu mencetak target suite
    yang cocok.
  - Gunakan ini sebelum menjalankan QA Lab saat Anda mengetahui perilaku atau jalur file
    yang tersentuh tetapi tidak mengetahui skenario terkecil. Hanya sebagai saran—tetap pilih bukti
    mock, live, Multipass, Matrix, atau transportasi berdasarkan perilaku yang
    diubah.
- `pnpm test:plugins:kitchen-sink-live`
  - Menjalankan rangkaian pengujian Plugin OpenAI Kitchen Sink live melalui QA Lab.
    Menginstal paket Kitchen Sink eksternal, memverifikasi inventaris permukaan
    SDK plugin, memeriksa `/healthz` dan `/readyz`, merekam bukti
    CPU/RSS Gateway, menjalankan satu giliran OpenAI live, dan memeriksa diagnostik
    adversarial. Memerlukan autentikasi OpenAI live seperti `OPENAI_API_KEY`. Dalam
    sesi Testbox yang telah dihidrasi, profil autentikasi live Testbox otomatis
    dimuat saat pembantu `openclaw-testbox-env` tersedia.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan tolok ukur startup Gateway beserta paket kecil skenario mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan gabungan pengamatan
    CPU di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai pengamatan CPU panas yang berkelanjutan (`--cpu-core-warn`,
    default `0.9`; `--hot-wall-warn-ms`, default `30000`), sehingga lonjakan singkat saat startup
    dicatat sebagai metrik tanpa tampak seperti regresi penggunaan penuh CPU Gateway
    yang berlangsung selama beberapa menit.
  - Berjalan terhadap artefak `dist` hasil build; jalankan build terlebih dahulu saat checkout
    belum memiliki keluaran runtime terbaru.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai, dengan tetap
    menggunakan flag pemilihan skenario dan penyedia/model yang sama seperti `qa suite`.
  - Proses live meneruskan input autentikasi QA yang praktis untuk guest:
    kunci penyedia berbasis env, jalur konfigurasi penyedia live QA, dan
    `CODEX_HOME` jika tersedia.
  - Direktori keluaran harus tetap berada di bawah root repo agar guest dapat menulis kembali
    melalui ruang kerja yang dipasang.
  - Menulis laporan + ringkasan QA normal beserta log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membuat tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI noninteraktif, mengonfigurasi
    Telegram secara default, memverifikasi runtime Plugin terpaket dimuat tanpa
    perbaikan dependensi startup, menjalankan doctor, dan menjalankan satu giliran agen lokal
    terhadap endpoint OpenAI yang di-mock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan jalur instalasi terpaket
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi hasil build yang deterministik untuk transkrip konteks runtime
    tertanam. Memverifikasi bahwa konteks runtime OpenClaw tersembunyi dipertahankan sebagai
    pesan khusus yang tidak ditampilkan alih-alih bocor ke giliran pengguna yang
    terlihat, lalu mengisi JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulang sesi tersebut ke cabang aktif dengan cadangan.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan onboarding
    paket yang telah diinstal, mengonfigurasi Telegram melalui CLI terinstal, lalu menggunakan kembali
    jalur QA Telegram live dengan paket terinstal tersebut sebagai Gateway
    SUT.
  - Wrapper hanya memasang sumber harness `qa-lab` dari checkout;
    paket terinstal memiliki `dist`, `openclaw/plugin-sdk`, dan runtime
    Plugin bawaan, sehingga jalur ini tidak mencampurkan Plugin checkout saat ini ke dalam
    paket yang diuji.
  - Secara default menggunakan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; tetapkan
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang telah diresolusi
    alih-alih menginstal dari registry.
  - Secara default memancarkan pengukuran waktu RTT berulang dalam `qa-evidence.json` dengan
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Timpa
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, atau
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` untuk menyesuaikan proses.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` memilih skenario QA Telegram yang akan
    disampel; target RTT yang didukung adalah `channel-canary`.
  - Menggunakan kredensial env Telegram atau sumber kredensial Convex yang sama seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, tetapkan
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` beserta
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran Convex tersedia di
    CI, wrapper Docker memilih Convex secara otomatis.
  - Wrapper memvalidasi env kredensial Telegram atau Convex pada host
    sebelum pekerjaan build/instalasi Docker. Tetapkan
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` hanya saat
    secara sengaja men-debug penyiapan prakredensial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menimpa
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk jalur ini. Saat kredensial Convex
    dipilih dan tidak ada peran yang ditetapkan, wrapper menggunakan `ci` di CI
    dan `maintainer` di luar CI.
  - GitHub Actions menyediakan jalur ini sebagai alur kerja maintainer manual
    `NPM Telegram Beta E2E`. Jalur ini tidak berjalan saat penggabungan. Alur kerja menggunakan
    environment `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga menyediakan `Package Acceptance` untuk bukti produk proses sampingan
  terhadap satu paket kandidat. Alur ini menerima referensi Git, spesifikasi npm yang dipublikasikan,
  URL tarball HTTPS beserta SHA-256, kebijakan URL tepercaya, atau artefak tarball
  dari proses lain (`source=ref|npm|url|trusted-url|artifact`), mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  penjadwal E2E Docker yang ada dengan profil jalur `smoke`, `package`, `product`, `full`,
  atau `custom`. Tetapkan `telegram_mode=mock-openai` atau
  `live-frontier` untuk menjalankan alur kerja QA Telegram terhadap artefak
  `package-under-test` yang sama.
  - Bukti produk beta terbaru:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bukti URL tarball yang persis memerlukan digest dan menggunakan kebijakan keamanan URL publik:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Mirror tarball enterprise/privat menggunakan kebijakan sumber tepercaya yang eksplisit:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` membaca `.github/package-trusted-sources.json` dari referensi alur kerja tepercaya dan tidak menerima kredensial URL atau bypass jaringan privat melalui input alur kerja. Jika kebijakan bernama tersebut mendeklarasikan autentikasi bearer, konfigurasikan secret tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Bukti artefak mengunduh artefak tarball dari proses Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mengemas dan menginstal build OpenClaw saat ini di Docker, memulai
    Gateway dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/Plugin bawaan melalui
    pengeditan konfigurasi.
  - Memverifikasi bahwa penemuan penyiapan membiarkan Plugin yang dapat diunduh tetapi belum dikonfigurasi
    tetap tidak ada, perbaikan doctor terkonfigurasi pertama menginstal setiap
    Plugin unduhan yang hilang secara eksplisit, dan restart kedua tidak menjalankan
    perbaikan dependensi tersembunyi.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum
    menjalankan `openclaw update --tag <candidate>`, dan memverifikasi bahwa
    doctor pascapembaruan kandidat membersihkan sisa dependensi Plugin lama
    tanpa perbaikan postinstall dari sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke pembaruan instalasi paket native di seluruh guest Parallels.
    Setiap platform yang dipilih terlebih dahulu menginstal paket baseline yang diminta,
    kemudian menjalankan perintah `openclaw update` yang telah diinstal di guest yang sama dan
    memverifikasi versi yang terinstal, status pembaruan, kesiapan Gateway, serta
    satu giliran agen lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux`
    saat melakukan iterasi pada satu guest. Gunakan `--json` untuk jalur artefak ringkasan
    dan status per jalur.
  - Jalur OpenAI secara default menggunakan `openai/gpt-5.6-luna` untuk bukti giliran agen live.
    Teruskan `--model <provider/model>` atau tetapkan
    `OPENCLAW_PARALLELS_OPENAI_MODEL` untuk memvalidasi model OpenAI lain.
  - Bungkus proses lokal yang panjang dengan batas waktu host agar macetnya transportasi Parallels
    tidak menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log jalur bertingkat di bawah
    `/tmp/openclaw-parallels-npm-update.*`. Periksa `windows-update.log`,
    `macos-update.log`, atau `linux-update.log` sebelum menganggap wrapper
    luar macet.
  - Pembaruan Windows dapat menghabiskan 10 hingga 15 menit untuk pekerjaan doctor pascapembaruan dan
    pembaruan paket pada guest dingin; kondisi tersebut masih sehat selama
    log debug npm bertingkat terus bertambah.
  - Jangan jalankan wrapper agregat ini secara paralel dengan masing-masing jalur smoke Parallels
    macOS, Windows, atau Linux. Jalur-jalur tersebut berbagi status VM dan dapat
    bertabrakan saat pemulihan snapshot, penyajian paket, atau status Gateway guest.
  - Bukti pascapembaruan menjalankan permukaan Plugin bawaan normal karena
    facade kapabilitas seperti ucapan, pembuatan gambar, dan pemahaman
    media dimuat melalui API runtime bawaan meskipun giliran agen
    itu sendiri hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server penyedia AIMock lokal untuk pengujian smoke
    protokol langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan jalur QA live Matrix terhadap homeserver Tuwunel sekali pakai
    yang didukung Docker. Hanya untuk checkout sumber - instalasi terpaket tidak menyertakan
    `qa-lab`.
  - CLI lengkap, katalog profil/skenario, variabel lingkungan, dan tata letak artefak:
    [Jalur smoke Matrix](/id/concepts/qa-e2e-automation#matrix-smoke-lanes).
- `pnpm openclaw qa telegram`
  - Menjalankan jalur QA live Telegram terhadap grup privat nyata menggunakan
    token bot driver dan SUT dari lingkungan.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat
    Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial kumpulan bersama.
    Gunakan mode lingkungan secara default, atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    untuk memilih menggunakan penyewaan kumpulan.
  - Pengaturan default mencakup canary, pembatasan penyebutan, pengalamatan perintah, `/status`,
    balasan antarbot yang disebutkan, dan balasan perintah native inti.
    Pengaturan default `mock-openai` juga mencakup regresi rantai balasan deterministik dan
    streaming pesan akhir Telegram. Gunakan `--list-scenarios`
    untuk probe opsional seperti `session_status`.
  - Keluar dengan nilai bukan nol saat ada skenario yang gagal. Gunakan `--allow-failures` untuk
    menghasilkan artefak tanpa kode keluar kegagalan.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT
    mengekspos nama pengguna Telegram.
  - Untuk pengamatan antarbot yang stabil, aktifkan Bot-to-Bot Communication Mode
    di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati
    lalu lintas bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan `qa-evidence.json` di bawah
    `.artifacts/qa-e2e/...`. Skenario balasan mencakup RTT dari permintaan pengiriman
    driver hingga balasan SUT yang diamati.

`Mantis Telegram Live` adalah pembungkus bukti PR untuk jalur ini. Pembungkus ini menjalankan
ref kandidat dengan kredensial Telegram yang disewa melalui Convex, merender
bundel laporan/bukti QA yang disunting di browser desktop Crabbox, merekam bukti
MP4, menghasilkan GIF yang dipangkas berdasarkan gerakan, mengunggah bundel artefak, dan
memposting bukti PR sebaris melalui Mantis GitHub App saat `pr_number`
ditetapkan. Pengelola dapat memulainya dari UI Actions melalui `Mantis Scenario`
(`scenario_id: telegram-live`) atau langsung dari komentar pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
```

`Mantis Telegram Desktop Proof` adalah pembungkus sebelum/sesudah Telegram Desktop
native yang bersifat agentik untuk bukti visual PR. Mulai dari UI Actions dengan
`instructions` bebas, melalui `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), atau dari komentar PR:

```text
@openclaw-mantis telegram desktop proof
```

Agen Mantis membaca PR, menentukan perilaku yang terlihat di Telegram untuk membuktikan
perubahan, menjalankan jalur bukti Telegram Desktop Crabbox pengguna nyata pada
ref dasar dan kandidat, mengulang hingga GIF native berguna,
menulis manifes `motionPreview` berpasangan, dan memposting tabel GIF
2 kolom yang sama melalui Mantis GitHub App saat `pr_number` ditetapkan.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Menyewa atau menggunakan kembali desktop Linux Crabbox, menginstal Telegram
    Desktop native, mengonfigurasi OpenClaw dengan token bot SUT Telegram yang disewa,
    memulai Gateway, dan merekam bukti tangkapan layar/MP4 dari
    desktop VNC yang terlihat.
  - Secara default menggunakan `--credential-source convex` sehingga alur kerja hanya memerlukan
    rahasia broker Convex. Gunakan `--credential-source env` dengan variabel
    `OPENCLAW_QA_TELEGRAM_*` yang sama seperti `pnpm openclaw qa telegram`.
  - Telegram Desktop tetap memerlukan login/profil pengguna. Token bot
    hanya mengonfigurasi OpenClaw. Gunakan `--telegram-profile-archive-env <name>`
    untuk arsip profil `.tgz` base64, atau gunakan `--keep-lease` dan lakukan login
    secara manual melalui VNC satu kali.
  - Menulis `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png`, dan `telegram-desktop-builder.mp4`
    di bawah direktori keluaran.

Jalur transport live berbagi satu kontrak standar agar transport baru tidak
menyimpang; matriks cakupan per jalur tersedia di
[Ikhtisar QA - Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` adalah rangkaian sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
diaktifkan untuk QA transport live, lab QA memperoleh penyewaan eksklusif dari
kumpulan yang didukung Convex, mengirim Heartbeat untuk penyewaan tersebut selama jalur berjalan, dan
melepaskan penyewaan saat dimatikan. Nama bagian ini sudah ada sebelum dukungan Discord, Slack, dan
WhatsApp; kontrak penyewaan digunakan bersama lintas jenis.

Perancah proyek Convex referensi: `qa/convex-credential-broker/`

Variabel lingkungan wajib:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu rahasia untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default lingkungan: `OPENCLAW_QA_CREDENTIAL_ROLE` (secara default `ci` di CI, `maintainer` jika tidak)

Variabel lingkungan opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID pelacakan opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex `http://` loopback untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` seharusnya menggunakan `https://` dalam operasi normal.

Perintah admin pengelola (tambah/hapus/daftar kumpulan) secara khusus memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pembantu CLI untuk pengelola:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum proses live untuk memeriksa URL situs Convex, rahasia broker,
prefiks endpoint, batas waktu HTTP, dan keterjangkauan admin/daftar tanpa mencetak
nilai rahasia. Gunakan `--json` untuk keluaran yang dapat dibaca mesin dalam skrip dan utilitas
CI.

Kontrak endpoint default (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Permintaan diautentikasi dengan header `Authorization: Bearer <role secret>`;
isi di bawah menghilangkan header tersebut:

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
- `POST /admin/add` (khusus rahasia pengelola)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (khusus rahasia pengelola)
  - Permintaan: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Pelindung penyewaan aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (khusus rahasia pengelola)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string ID chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang salah format.

Bentuk payload untuk jenis pengguna nyata Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, dan `telegramApiId` harus berupa string numerik.
- `tdlibArchiveSha256` dan `desktopTdataArchiveSha256` harus berupa string heksadesimal SHA-256.
- `kind: "telegram-user"` dicadangkan untuk alur kerja bukti Telegram Desktop Mantis. Jalur QA Lab generik tidak boleh memperolehnya.

Payload multisaluran yang divalidasi broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Jalur Slack juga dapat menyewa dari kumpulan, tetapi validasi payload Slack
saat ini berada di runner QA Slack, bukan di broker. Gunakan
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
untuk baris Slack.

### Menambahkan saluran ke QA

Arsitektur dan nama pembantu skenario untuk adaptor saluran baru tersedia di
[Ikhtisar QA - Menambahkan saluran](/id/concepts/qa-e2e-automation#adding-a-channel).
Batas minimum: implementasikan runner transport pada seam host `qa-lab` bersama,
tambahkan `adapterFactory` untuk skenario bersama, deklarasikan `qaRunners` dalam
manifes plugin, pasang sebagai `openclaw qa <runner>`, dan tulis skenario di bawah
`qa/scenarios/`.

## Rangkaian pengujian (apa yang berjalan di mana)

Anggap rangkaian ini sebagai "realisme yang meningkat" (serta ketidakstabilan/biaya yang meningkat).

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: proses tanpa target menggunakan kumpulan shard `vitest.full-*.config.ts` dan dapat
  memperluas shard multiproyek menjadi konfigurasi per proyek untuk penjadwalan
  paralel
- Berkas: inventaris inti/unit di bawah `src/**/*.test.ts`,
  `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di
  shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (autentikasi Gateway, perutean, peralatan, penguraian, konfigurasi)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan pemuat permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture plugin kecil yang dihasilkan,
    bukan API sumber plugin bawaan nyata. Pemuatan API plugin nyata termasuk dalam
    rangkaian kontrak/integrasi milik plugin.

Kebijakan dependensi native:

- Instalasi pengujian default melewati build opus Discord native opsional. Suara
  Discord menggunakan `libopus-wasm` bawaan, dan `@discordjs/opus` tetap dinonaktifkan di
  `allowBuilds` agar pengujian lokal dan jalur Testbox tidak mengompilasi addon
  native.
- Bandingkan performa opus native di repo benchmark `libopus-wasm`, bukan
  dalam loop instalasi/pengujian OpenClaw default. Jangan atur `@discordjs/opus` menjadi
  `true` dalam `allowBuilds` default; hal itu membuat loop instalasi/pengujian
  yang tidak terkait mengompilasi kode native.

<AccordionGroup>
  <Accordion title="Proyek, shard, dan jalur bercakupan">

    - Proses `pnpm test` tanpa target menjalankan tiga belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`), bukan satu proses native proyek root yang sangat besar. Ini mengurangi RSS puncak pada mesin dengan beban tinggi dan mencegah pekerjaan balasan otomatis/plugin membuat rangkaian pengujian yang tidak terkait kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan graf proyek `vitest.config.ts` native root karena perulangan pemantauan multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` terlebih dahulu merutekan target file/direktori eksplisit melalui jalur terbatas, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tidak perlu menanggung seluruh biaya awal proyek root.
    - `pnpm test:changed` secara default memperluas path Git yang berubah menjadi jalur terbatas berbiaya rendah: pengeditan pengujian langsung, file `*.test.ts` saudara, pemetaan sumber eksplisit, dan dependensi lokal dalam graf impor. Pengeditan konfigurasi/penyiapan/paket tidak menjalankan pengujian secara luas, kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gerbang pemeriksaan lokal cerdas yang lazim untuk pekerjaan berskala sempit. Gerbang ini mengklasifikasikan diff menjadi inti, pengujian inti, ekstensi, pengujian ekstensi, aplikasi, dokumentasi, metadata rilis, peralatan Docker live, dan peralatan lainnya, lalu menjalankan perintah pemeriksaan tipe, lint, dan guard yang sesuai. Gerbang ini tidak menjalankan pengujian Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` secara eksplisit sebagai bukti pengujian. Peningkatan versi yang hanya menyentuh metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan, dengan guard yang menolak perubahan paket di luar bidang versi tingkat atas.
    - Pengeditan harness ACP Docker live menjalankan pemeriksaan terfokus: sintaksis shell untuk skrip autentikasi Docker live dan uji coba kering penjadwal Docker live. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; pengeditan dependensi, ekspor, versi, dan permukaan paket lainnya tetap menggunakan guard yang lebih luas.
    - Pengujian unit dengan impor ringan dari agen, perintah, plugin, pembantu balasan otomatis, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui jalur `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file yang sarat status/runtime tetap menggunakan jalur yang ada.
    - File sumber pembantu `plugin-sdk` dan `commands` tertentu juga memetakan eksekusi mode perubahan ke pengujian saudara eksplisit dalam jalur ringan tersebut, sehingga pengeditan pembantu tidak menjalankan ulang seluruh rangkaian berat untuk direktori itu.
    - `auto-reply` memiliki kelompok khusus untuk pembantu inti tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya membagi subtree balasan menjadi shard pelaksana agen, dispatch, serta perintah/perutean status agar satu kelompok yang sarat impor tidak menguasai seluruh ekor proses Node.
    - CI PR/main normal sengaja melewati penyisiran batch plugin bawaan dan shard `agentic-plugins` khusus rilis. Validasi Rilis Lengkap menjalankan workflow turunan `Plugin Prerelease` terpisah untuk rangkaian yang sarat plugin tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan pelaksana tertanam">

    - Saat mengubah input penemuan alat pesan atau konteks runtime
      Compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi pembantu terfokus untuk batas perutean dan normalisasi
      murni.
    - Pastikan rangkaian integrasi pelaksana tertanam tetap sehat:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Rangkaian tersebut memverifikasi bahwa ID terbatas dan perilaku Compaction tetap mengalir
      melalui path `run.ts` / `compact.ts` yang sebenarnya; pengujian khusus pembantu
      bukan pengganti yang memadai untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Konfigurasi dasar Vitest menggunakan `threads` secara default.
    - Konfigurasi Vitest bersama menetapkan `isolate: false` dan menggunakan
      pelaksana nonterisolasi di seluruh proyek root serta konfigurasi e2e dan live.
    - Jalur UI root mempertahankan penyiapan dan pengoptimal `jsdom`, tetapi juga berjalan pada
      pelaksana nonterisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari konfigurasi Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node turunan
      Vitest secara default guna mengurangi pekerjaan kompilasi V8 berulang selama eksekusi lokal besar.
      Tetapkan `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkannya dengan perilaku V8
      standar.
    - `scripts/run-vitest.mjs` menghentikan eksekusi Vitest non-pemantauan eksplisit
      setelah 5 menit tanpa keluaran stdout atau stderr. Tetapkan
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` untuk menonaktifkan pengawas bagi
      investigasi yang sengaja tidak menghasilkan keluaran.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menunjukkan jalur arsitektural yang dipicu oleh sebuah diff.
    - Hook pra-commit hanya melakukan pemformatan. Hook ini memasukkan kembali file yang telah diformat ke staging
      dan tidak menjalankan lint, pemeriksaan tipe, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum serah terima atau push ketika Anda
      memerlukan gerbang pemeriksaan lokal cerdas.
    - `pnpm test:changed` secara default merutekan melalui jalur terbatas berbiaya rendah. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agen
      memutuskan bahwa pengeditan harness, konfigurasi, paket, atau kontrak benar-benar memerlukan
      cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku perutean
      yang sama, hanya dengan batas pekerja yang lebih tinggi.
    - Penskalaan otomatis pekerja lokal sengaja dibuat konservatif dan dikurangi
      ketika rata-rata beban host sudah tinggi, sehingga beberapa eksekusi Vitest serentak
      secara default menimbulkan dampak yang lebih kecil.
    - Konfigurasi dasar Vitest menandai file proyek/konfigurasi sebagai
      `forceRerunTriggers` agar eksekusi ulang mode perubahan tetap tepat ketika
      pengkabelan pengujian berubah.
    - Konfigurasi mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` agar tetap aktif pada
      host yang didukung; tetapkan `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      untuk satu lokasi cache eksplisit bagi pembuatan profil langsung.

  </Accordion>

  <Accordion title="Debug performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest beserta
      keluaran perincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan pembuatan profil yang sama pada
      file yang berubah sejak `origin/main`.
    - Data waktu shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Eksekusi seluruh konfigurasi menggunakan path konfigurasi sebagai kunci; shard CI
      dengan pola penyertaan menambahkan nama shard agar shard yang difilter dapat dilacak
      secara terpisah.
    - Ketika satu pengujian berat masih menghabiskan sebagian besar waktunya pada impor awal,
      pertahankan dependensi berat di balik batas lokal `*.runtime.ts` yang sempit dan
      tirukan batas tersebut secara langsung, alih-alih melakukan deep import pembantu runtime
      hanya untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan `test:changed`
      yang dirutekan dengan path proyek root native untuk diff yang telah di-commit tersebut
      dan menampilkan waktu nyata beserta RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark pada
      working tree kotor saat ini dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan konfigurasi root Vitest.
    - `pnpm test:perf:profile:main` menulis profil CPU thread utama untuk
      overhead startup dan transformasi Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap pelaksana untuk
      rangkaian unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Perintah: `pnpm test:stability:gateway`
- Konfigurasi: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts`, dan `test/vitest/vitest.infra.config.ts`, masing-masing dipaksa menggunakan satu pekerja
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik yang diaktifkan secara default
  - Menggerakkan perputaran pesan gateway, memori, dan muatan besar sintetis melalui path peristiwa diagnostik
  - Mengueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup pembantu persistensi bundel stabilitas diagnostik
  - Memastikan perekam tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi kembali terkuras hingga nol
- Ekspektasi:
  - Aman untuk CI dan tanpa kunci
  - Jalur sempit untuk tindak lanjut regresi stabilitas, bukan pengganti rangkaian Gateway lengkap

### E2E (agregat repo)

- Perintah: `pnpm test:e2e`
- Cakupan:
  - Menjalankan jalur E2E smoke Gateway
  - Menjalankan jalur E2E browser Control UI dengan mock
- Ekspektasi:
  - Aman untuk CI dan tanpa kunci
  - Memerlukan Playwright Chromium terinstal

### E2E (smoke Gateway)

- Perintah: `pnpm test:e2e:gateway`
- Konfigurasi: `test/vitest/vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E plugin bawaan di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, selaras dengan bagian repo lainnya.
  - Menggunakan pekerja adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Pengesampingan yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah pekerja (dibatasi hingga 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali keluaran konsol mendetail.
- Cakupan:
  - Perilaku end-to-end Gateway multi-instans
  - Permukaan WebSocket/HTTP, pemasangan Node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan kunci nyata
  - Memiliki lebih banyak komponen bergerak daripada pengujian unit (dapat berjalan lebih lambat)

### E2E (browser Control UI dengan mock)

- Perintah: `pnpm test:ui:e2e`
- Konfigurasi: `test/vitest/vitest.ui-e2e.config.ts`
- File: `ui/src/**/*.e2e.test.ts`
- Cakupan:
  - Memulai Control UI Vite
  - Mengendalikan halaman Chromium nyata melalui Playwright
  - Mengganti WebSocket Gateway dengan mock deterministik dalam browser
- Ekspektasi:
  - Berjalan di CI sebagai bagian dari `pnpm test:e2e`
  - Tidak memerlukan Gateway, agen, atau kunci penyedia nyata
  - Dependensi browser harus tersedia (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Menggunakan kembali gateway OpenShell lokal yang aktif
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + eksekusi SSH
  - Memverifikasi perilaku sistem file kanonis-jarak-jauh melalui bridge fs sandbox
- Ekspektasi:
  - Hanya berdasarkan pilihan; bukan bagian dari eksekusi default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal serta daemon Docker yang berfungsi
  - Memerlukan gateway OpenShell lokal yang aktif beserta sumber konfigurasinya
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` yang terisolasi, lalu menghancurkan sandbox pengujian
- Pengesampingan yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian ketika menjalankan rangkaian e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI atau skrip pembungkus non-default
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` untuk mengekspos konfigurasi gateway terdaftar ke pengujian terisolasi
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` untuk mengganti IP gateway Docker yang digunakan oleh fixture kebijakan host

### Live (penyedia nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `test/vitest/vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian langsung plugin bawaan di bawah `extensions/`
- Bawaan: **diaktifkan** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - "Apakah penyedia/model ini benar-benar berfungsi _saat ini_ dengan kredensial nyata?"
  - Mendeteksi perubahan format penyedia, kekhasan pemanggilan alat, masalah autentikasi, dan perilaku batas laju
- Ekspektasi:
  - Sengaja tidak stabil untuk CI (jaringan nyata, kebijakan penyedia nyata, kuota, gangguan layanan)
  - Memerlukan biaya / menggunakan batas laju
  - Utamakan menjalankan subset yang dipersempit daripada "semuanya"
- Proses langsung menggunakan kunci API yang telah diekspor dan profil autentikasi yang telah disiapkan.
- Secara bawaan, proses langsung tetap mengisolasi `HOME` dan menyalin materi konfigurasi/autentikasi ke direktori utama pengujian sementara agar fixture unit tidak dapat mengubah `~/.openclaw` Anda yang sebenarnya.
- Tetapkan `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda memang perlu agar pengujian langsung menggunakan direktori utama Anda yang sebenarnya.
- `pnpm test:live` secara bawaan menggunakan mode yang lebih senyap: mode ini mempertahankan keluaran progres `[live] ...` dan membisukan log bootstrap Gateway/percakapan Bonjour. Tetapkan `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin menampilkan kembali log startup lengkap.
- Rotasi kunci API (khusus penyedia): tetapkan `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau penimpaan per proses langsung melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba kembali saat menerima respons batas laju.
- Keluaran progres/heartbeat:
  - Rangkaian pengujian langsung menampilkan baris progres ke stderr agar panggilan penyedia yang lama tetap terlihat aktif meskipun penangkapan konsol Vitest tidak menampilkan keluaran.
  - `test/vitest/vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest agar baris progres penyedia/Gateway langsung mengalir selama proses langsung.
  - Sesuaikan heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan heartbeat Gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Rangkaian pengujian mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Mengubah jaringan Gateway / protokol WS / pemasangan: tambahkan `pnpm test:e2e`
- Men-debug "bot saya tidak aktif" / kegagalan khusus penyedia / pemanggilan alat: jalankan `pnpm test:live` yang dipersempit

## Pengujian langsung (yang mengakses jaringan)

Untuk matriks model langsung, smoke backend CLI, smoke ACP, harness app-server
Codex, dan semua pengujian langsung penyedia media (Deepgram, BytePlus, ComfyUI,
gambar, musik, video, harness media) - serta penanganan kredensial untuk proses langsung

- lihat [Menguji rangkaian pengujian langsung](/id/help/testing-live). Untuk daftar periksa khusus pembaruan dan
  validasi plugin, lihat
  [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini dibagi menjadi dua kelompok:

- Runner model langsung: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file langsung kunci profil yang sesuai di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan memasang direktori konfigurasi lokal, ruang kerja, dan file env profil opsional Anda. Titik masuk lokal yang sesuai adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner langsung Docker mempertahankan batas praktisnya sendiri jika diperlukan:
  `test:docker:live-models` secara bawaan menggunakan kumpulan terkurasi yang didukung dan menghasilkan sinyal tinggi, dan
  `test:docker:live-gateway` secara bawaan menggunakan `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Tetapkan `OPENCLAW_LIVE_MAX_MODELS`
  atau variabel env Gateway ketika Anda secara eksplisit menginginkan batas yang lebih kecil atau pemindaian yang lebih besar.
- `test:docker:all` membangun image Docker langsung satu kali melalui `test:docker:live-build`, mengemas OpenClaw satu kali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan kembali dua image `scripts/e2e/Dockerfile`. Image dasar hanya merupakan runner Node/Git untuk jalur instalasi/pembaruan/dependensi plugin; jalur tersebut memasang tarball yang telah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk jalur fungsionalitas aplikasi hasil build. Definisi jalur Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana yang dipilih. Agregat menggunakan penjadwal lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sedangkan batas sumber daya mencegah jalur langsung berat, instalasi npm, dan multi-layanan dimulai secara bersamaan. Jika satu jalur lebih berat daripada batas aktif, penjadwal tetap dapat memulainya ketika kumpulan kosong, lalu menjalankannya sendiri hingga kapasitas kembali tersedia. Nilai bawaan adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (serta penimpaan `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` lainnya) hanya ketika host Docker memiliki kapasitas lebih besar. Runner melakukan pemeriksaan awal Docker secara bawaan, menghapus container E2E OpenClaw yang usang, menampilkan status setiap 30 detik, menyimpan waktu jalur yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan waktu tersebut untuk memulai jalur yang lebih lama terlebih dahulu pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk menampilkan manifes jalur berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk menampilkan rencana CI bagi jalur yang dipilih, kebutuhan paket/image, dan kredensial.
- `Package Acceptance` adalah gerbang paket bawaan GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Gerbang ini menentukan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, `source=trusted-url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan jalur E2E Docker yang dapat digunakan kembali terhadap tarball tersebut alih-alih mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan luas cakupan: `smoke`, `package`, `product`, dan `full` (serta `custom` untuk daftar jalur eksplisit). Lihat [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins) untuk kontrak paket/pembaruan/plugin, matriks keberlangsungan pemutakhiran terbitan, nilai bawaan rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Pengaman ini menelusuri graf build statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika graf bootstrap pra-dispatch tersebut mengimpor secara statis paket eksternal apa pun (Commander, UI prompt, undici, logging, dan dependensi berat saat startup yang serupa semuanya dihitung) sebelum dispatch perintah; pengaman ini juga membatasi chunk proses Gateway yang dibundel pada 70 KB dan menolak impor statis jalur Gateway dingin yang diketahui (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) dari chunk tersebut. `scripts/release-check.ts` secara terpisah melakukan smoke test pada CLI yang dikemas dengan `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema`, dan `models list --provider openai`.
- Kompatibilitas lama Package Acceptance dibatasi hingga `2026.4.25` (`2026.4.25-beta.*` disertakan). Hingga batas tersebut, harness hanya menoleransi kekurangan metadata paket yang telah dirilis: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, file patch yang hilang dalam fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi lama catatan instalasi plugin, persistensi catatan instalasi marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Untuk paket setelah `2026.4.25`, jalur tersebut merupakan kegagalan ketat.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` menjalankan satu atau beberapa container nyata dan memverifikasi jalur integrasi tingkat tinggi.
- Jalur E2E Docker/Bash yang menginstal tarball OpenClaw yang dikemas melalui `scripts/lib/openclaw-e2e-instance.sh` membatasi `npm install` pada `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (bawaan `600s`; tetapkan `0` untuk menonaktifkan wrapper guna men-debug).

Runner Docker model langsung juga hanya melakukan bind-mount pada direktori utama autentikasi CLI yang diperlukan
(atau semua yang didukung ketika proses tidak dipersempit), lalu menyalinnya ke
direktori utama container sebelum proses dijalankan agar OAuth CLI eksternal dapat memperbarui token
tanpa mengubah penyimpanan autentikasi host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara bawaan, dengan cakupan ketat Droid/OpenCode melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen pengembangan: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observabilitas: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, dan `pnpm qa:observability:smoke` merupakan jalur checkout sumber QA privat. Jalur tersebut sengaja tidak menjadi bagian dari jalur rilis Docker paket karena tarball npm tidak menyertakan QA Lab.
- Smoke langsung Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding lengkap): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/saluran/agen tarball npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang dikemas secara global di Docker, mengonfigurasi OpenAI melalui onboarding referensi env beserta Telegram secara bawaan, menjalankan doctor, dan menjalankan satu giliran agen OpenAI tiruan. Gunakan kembali tarball yang telah dibangun dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build ulang host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti saluran dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` atau `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke perjalanan pengguna rilis: `pnpm test:docker:release-user-journey` menginstal tarball OpenClaw yang telah dikemas secara global di direktori home Docker yang bersih, menjalankan onboarding, mengonfigurasi penyedia OpenAI tiruan, menjalankan satu giliran agen, menginstal/menghapus instalan plugin eksternal, mengonfigurasi ClickClack terhadap fixture lokal, memverifikasi perpesanan keluar/masuk, memulai ulang Gateway, dan menjalankan doctor.
- Smoke onboarding bertipe untuk rilis: `pnpm test:docker:release-typed-onboarding` menginstal tarball yang telah dikemas, mengoperasikan `openclaw onboard` melalui TTY nyata, mengonfigurasi OpenAI sebagai penyedia env-ref, memverifikasi bahwa kunci mentah tidak dipersistenkan, dan menjalankan satu giliran agen tiruan.
- Smoke media/memori rilis: `pnpm test:docker:release-media-memory` menginstal tarball yang telah dikemas, memverifikasi pemahaman gambar dari lampiran PNG, keluaran pembuatan gambar yang kompatibel dengan OpenAI, pemanggilan kembali melalui pencarian memori, dan bertahannya pemanggilan kembali setelah Gateway dimulai ulang.
- Smoke perjalanan pengguna peningkatan versi rilis: `pnpm test:docker:release-upgrade-user-journey` secara default menginstal baseline terbaru yang telah dipublikasikan dan lebih lama daripada tarball kandidat, mengonfigurasi status penyedia/plugin/ClickClack pada paket yang dipublikasikan, meningkatkan versi ke tarball kandidat, lalu menjalankan ulang perjalanan inti agen/plugin/channel. Jika tidak ada baseline lama yang telah dipublikasikan, versi kandidat digunakan kembali. Ganti baseline dengan `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke marketplace plugin rilis: `pnpm test:docker:release-plugin-marketplace` menginstal dari marketplace fixture lokal, memperbarui plugin yang terinstal, menghapus instalannya, dan memverifikasi bahwa CLI plugin menghilang serta metadata instalasi dipangkas.
- Smoke instalasi skill: `pnpm test:docker:skill-install` menginstal tarball OpenClaw yang telah dikemas secara global di Docker, menonaktifkan instalasi arsip yang diunggah dalam konfigurasi, menemukan slug skill ClawHub aktif saat ini dari pencarian, menginstalnya dengan `openclaw skills install`, dan memverifikasi skill yang terinstal beserta metadata asal/kunci `.clawhub`.
- Smoke peralihan channel pembaruan: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang telah dikemas secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipersistenkan dan berfungsinya plugin setelah pembaruan, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke ketahanan setelah peningkatan versi: `pnpm test:docker:upgrade-survivor` menginstal tarball OpenClaw yang telah dikemas di atas fixture pengguna lama yang tidak bersih, dengan agen, konfigurasi channel, daftar izin plugin, status dependensi plugin yang usang, serta file ruang kerja/sesi yang sudah ada. Ini menjalankan pembaruan paket dan doctor noninteraktif tanpa penyedia aktif atau kunci channel, lalu memulai Gateway loopback dan memeriksa pemeliharaan konfigurasi/status beserta batas waktu startup/status.
- Smoke ketahanan setelah peningkatan versi yang dipublikasikan: `pnpm test:docker:published-upgrade-survivor` secara default menginstal `openclaw@latest`, mengisi file pengguna yang sudah ada secara realistis, mengonfigurasi baseline tersebut dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi yang dipublikasikan tersebut ke tarball kandidat, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent yang dikonfigurasi, pemeliharaan status, startup, `/healthz`, `/readyz`, serta batas waktu status RPC. Ganti satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta penjadwal agregat memperluas baseline lokal persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; kumpulan isu yang dilaporkan mencakup `configured-plugin-installs` untuk perbaikan otomatis instalasi plugin OpenClaw eksternal. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`, menyelesaikan token baseline meta seperti `last-stable-4` atau `all-since-2026.4.23`, dan Full Release Validation memperluas gerbang paket pengujian rilis berkepanjangan menjadi `last-stable-4 2026.4.23 2026.5.2 2026.4.15` beserta `reported-issues`.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi beserta perbaikan oleh doctor terhadap cabang penulisan ulang prompt terduplikasi yang terdampak.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas pohon saat ini, menginstalnya dengan `bun install -g` di direktori home terisolasi, dan memverifikasi bahwa `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih berhenti merespons. Gunakan kembali tarball yang telah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang telah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker penginstal: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di antara container root, pembaruan, dan direct-npm. Smoke pembaruan secara default menggunakan npm `latest` sebagai baseline stabil sebelum meningkatkan versi ke tarball kandidat. Ganti secara lokal dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, atau dengan input `update_baseline_version` alur kerja Install Smoke di GitHub. Pemeriksaan penginstal non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menyamarkan perilaku instalasi lokal pengguna. Atur `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/pembaruan/direct-npm pada pengulangan lokal.
- Pipeline CI Install Smoke melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env tersebut ketika cakupan langsung `npm install -g` diperlukan.
- Smoke CLI penghapusan ruang kerja bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) secara default membuat image Dockerfile root, mengisi dua agen dengan satu ruang kerja dalam direktori home container terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON yang valid beserta perilaku ruang kerja yang dipertahankan. Gunakan kembali image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway dan siklus hidup host: `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`) mempertahankan smoke autentikasi/kesehatan WebSocket LAN dua container, lalu menggunakan Admin HTTP loopback untuk membuktikan pemagaran persiapan, akses kontrol yang dipertahankan, pemulihan resume, dan penghentian/pemulaian dalam container yang sama setelah dipersiapkan. Pemeriksaan mulai ulang harus selesai sebelum lease awal kedaluwarsa, memverifikasi bahwa status penangguhan bersifat lokal bagi proses sementara konfigurasi Gateway yang dipersistenkan dan identitas container tetap bertahan, serta menghasilkan JSON waktu fase yang dapat dibaca mesin.
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membuat image E2E sumber beserta lapisan Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi bahwa snapshot peran CDP mencakup URL tautan, elemen yang dapat diklik karena kursor, referensi iframe, dan metadata frame.
- Regresi penalaran minimal web_search OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi bahwa `web_search` menaikkan `reasoning.effort` dari `minimal` menjadi `low`, lalu memaksa skema penyedia menolak dan memeriksa bahwa detail mentah muncul dalam log Gateway.
- Jembatan channel MCP (Gateway yang telah diisi + jembatan stdio + smoke frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Peralatan MCP bundle OpenClaw (server MCP stdio nyata + smoke izin/tolak profil OpenClaw tertanam): `pnpm test:docker:agent-bundle-mcp-tools` (skrip: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + penghentian proses turunan MCP stdio setelah eksekusi cron terisolasi dan subagen sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke instalasi/pembaruan untuk jalur lokal, `file:`, registri npm dengan dependensi yang di-hoist, metadata paket npm yang cacat, referensi git yang berpindah, paket lengkap ClawHub, pembaruan marketplace, serta pengaktifan/inspeksi bundle Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Atur `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau ganti pasangan paket/runtime lengkap default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal yang hermetis.
- Smoke pembaruan plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks siklus hidup plugin: `pnpm test:docker:plugin-lifecycle-matrix` menginstal tarball OpenClaw yang telah dikemas dalam container kosong, menginstal plugin npm, mengaktifkan/menonaktifkannya, meningkatkan dan menurunkan versinya melalui registri npm lokal, menghapus kode yang terinstal, lalu memverifikasi bahwa penghapusan instalasi tetap menghapus status usang sambil mencatat metrik RSS/CPU untuk setiap fase siklus hidup.
- Smoke metadata pemuatan ulang konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke instalasi/pembaruan untuk jalur lokal, `file:`, registri npm dengan dependensi yang di-hoist, referensi git yang berpindah, fixture ClawHub, pembaruan marketplace, serta pengaktifan/inspeksi bundle Claude. `pnpm test:docker:plugin-update` mencakup perilaku pembaruan tanpa perubahan untuk plugin yang terinstal. `pnpm test:docker:plugin-lifecycle-matrix` mencakup instalasi plugin npm dengan pelacakan sumber daya, pengaktifan, penonaktifan, peningkatan versi, penurunan versi, dan penghapusan instalasi ketika kode hilang.

Untuk membuat sebelumnya dan menggunakan kembali image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Penggantian image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap diutamakan jika ditetapkan. Ketika `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip akan menariknya jika image tersebut belum tersedia secara lokal. Pengujian Docker QR dan penginstal mempertahankan Dockerfile masing-masing karena keduanya memvalidasi perilaku paket/instalasi, bukan runtime aplikasi hasil build bersama.

Runner Docker model aktif juga memasang checkout saat ini sebagai bind mount hanya-baca
dan menempatkannya ke dalam direktori kerja sementara di dalam container. Hal ini menjaga
image runtime tetap ramping sambil tetap menjalankan Vitest terhadap sumber/konfigurasi lokal
Anda secara persis. Langkah penempatan melewati cache besar yang hanya bersifat lokal dan keluaran build
aplikasi seperti `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta
direktori keluaran `.build` lokal aplikasi atau Gradle agar eksekusi aktif Docker tidak
menghabiskan waktu beberapa menit untuk menyalin artefak khusus mesin. Runner juga menetapkan
`OPENCLAW_SKIP_CHANNELS=1` agar probe aktif Gateway tidak memulai worker channel
Telegram/Discord/dll. yang sebenarnya di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` ketika Anda perlu mempersempit atau mengecualikan cakupan aktif
Gateway dari lane Docker tersebut.

`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ini memulai
container Gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang versinya dipatok terhadap Gateway tersebut, masuk melalui
Open WebUI, memverifikasi bahwa `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan percakapan nyata melalui proksi `/api/chat/completions` milik Open WebUI. Tetapkan
`OPENWEBUI_SMOKE_MODE=models` untuk pemeriksaan Pipeline CI jalur rilis yang harus berhenti
setelah masuk ke Open WebUI dan penemuan model, tanpa menunggu penyelesaian model aktif.
Eksekusi pertama dapat terasa jauh lebih lambat karena Docker mungkin perlu
menarik image Open WebUI dan Open WebUI mungkin perlu menyelesaikan
penyiapan cold-start-nya sendiri. Lane ini mengharapkan kunci model aktif yang dapat digunakan, yang disediakan melalui
lingkungan proses, profil autentikasi yang telah ditempatkan, atau
`OPENCLAW_PROFILE_FILE` eksplisit. Eksekusi yang berhasil mencetak payload JSON kecil seperti
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` sengaja dibuat deterministik dan tidak memerlukan
akun Telegram, Discord, atau iMessage nyata. Ini mem-boot container Gateway
yang telah diisi, memulai container kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata
lampiran, perilaku antrean peristiwa aktif, perutean pengiriman keluar, serta notifikasi
channel + izin bergaya Claude melalui jembatan MCP stdio nyata. Pemeriksaan
notifikasi memeriksa frame MCP stdio mentah secara langsung sehingga smoke tersebut
memvalidasi apa yang benar-benar dihasilkan jembatan, bukan sekadar apa yang kebetulan
diekspos oleh SDK klien tertentu.

`test:docker:agent-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan
kunci model aktif. Proses ini membangun image Docker repositori, memulai server
probe MCP stdio nyata di dalam kontainer, mewujudkan server tersebut melalui
runtime MCP bundel OpenClaw tertanam, menjalankan alat, lalu memverifikasi bahwa
`coding` dan `messaging` mempertahankan alat `bundle-mcp`, sedangkan `minimal` dan
`tools.deny: ["bundle-mcp"]` memfilternya.

`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan kunci
model aktif. Proses ini memulai Gateway berisi data awal dengan server probe MCP stdio nyata,
menjalankan giliran cron terisolasi dan giliran turunan sekali jalan `sessions_spawn`, lalu
memverifikasi bahwa proses turunan MCP berhenti setelah setiap proses berjalan.

Smoke test manual thread ACP dengan bahasa biasa (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi perutean thread ACP, jadi jangan hapus.

Variabel env yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) dipasang ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) dipasang ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` dipasang dan dimuat sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya variabel env yang dimuat dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori konfigurasi/ruang kerja sementara dan tanpa pemasangan autentikasi CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`, kecuali proses sudah menggunakan direktori bind CI/terkelola) dipasang ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file autentikasi CLI eksternal di bawah `$HOME` dipasang hanya-baca di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default (digunakan saat proses tidak dibatasi ke penyedia tertentu): `.factory`, `.gemini`, `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Proses penyedia yang dibatasi hanya memasang direktori/file yang diperlukan berdasarkan inferensi dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar yang dipisahkan koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk membatasi proses
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter penyedia di dalam kontainer
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan kembali image `openclaw:local-live` yang ada bagi proses ulang yang tidak memerlukan pembangunan ulang
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway bagi smoke test Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke test Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipatok

## Pemeriksaan kewajaran dokumentasi

Jalankan pemeriksaan dokumentasi setelah mengedit dokumentasi: `pnpm check:docs`.
Jalankan validasi anchor Mintlify lengkap jika Anda juga memerlukan pemeriksaan judul dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi luring (aman untuk CI)

Berikut adalah regresi "pipeline nyata" tanpa penyedia nyata:

- Pemanggilan alat Gateway (OpenAI tiruan, gateway + loop agen nyata): `src/gateway/gateway.test.ts` (kasus: "menjalankan pemanggilan alat OpenAI tiruan secara menyeluruh melalui loop agen gateway")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis konfigurasi + autentikasi diberlakukan): `src/gateway/gateway.test.ts` (kasus: "menjalankan wizard melalui ws dan menulis konfigurasi token autentikasi")

## Evaluasi keandalan agen (Skills)

Kami sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti "evaluasi keandalan agen":

- Pemanggilan alat tiruan melalui gateway + loop agen nyata (`src/gateway/gateway.test.ts`).
- Alur wizard menyeluruh yang memvalidasi pengkabelan sesi dan efek konfigurasi (`src/gateway/gateway.test.ts`).

Hal yang masih belum tersedia untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** ketika Skills tercantum dalam prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang menegaskan urutan alat, penerusan riwayat sesi, dan batas sandbox.

Evaluasi mendatang harus mengutamakan sifat deterministik:

- Runner skenario yang menggunakan penyedia tiruan untuk menegaskan pemanggilan + urutan alat, pembacaan file skill, dan pengkabelan sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, pembatasan, injeksi prompt).
- Evaluasi aktif opsional (keikutsertaan eksplisit, dibatasi env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk plugin dan saluran)

Pengujian kontrak memverifikasi bahwa setiap plugin dan saluran terdaftar mematuhi
kontrak antarmukanya. Pengujian ini mengiterasi semua plugin yang ditemukan dan menjalankan
suite pernyataan bentuk dan perilaku. Jalur unit `pnpm test` default
secara sengaja melewati file seam bersama dan smoke test ini; jalankan perintah kontrak
secara eksplisit saat Anda menyentuh permukaan saluran atau penyedia bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak saluran: `pnpm test:contracts:channels`
- Hanya kontrak penyedia: `pnpm test:contracts:plugins`

### Kontrak saluran

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`. Kategori
tingkat atas saat ini:

- **channel-catalog** - metadata entri katalog saluran bawaan/registri
- **plugin** (didukung registri, dipecah menjadi shard) - bentuk pendaftaran plugin dasar
- **surfaces-only** (didukung registri, dipecah menjadi shard) - pemeriksaan bentuk per permukaan untuk `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory`, dan `gateway`
- **session-binding** (didukung registri) - perilaku pengikatan sesi
- **outbound-payload** - struktur dan normalisasi payload pesan
- **group-policy** (fallback) - pemberlakuan kebijakan grup default per saluran
- **threading** (didukung registri, dipecah menjadi shard) - penanganan id thread
- **directory** (didukung registri, dipecah menjadi shard) - API direktori/daftar anggota
- **registry** dan **plugins-core.\*** - registri plugin saluran, pemuat, dan internal otorisasi penulisan konfigurasi

Helper harness penangkapan-dispatch masuk dan payload-keluar yang digunakan oleh
suite ini diekspos secara internal melalui `src/plugin-sdk/channel-contract-testing.ts`
(dikecualikan dari npm, bukan subpath SDK publik); tidak ada file mandiri
`inbound.contract.test.ts` di direktori ini.

### Kontrak penyedia

Terletak di `src/plugins/contracts/*.contract.test.ts`. Kategori saat ini
meliputi:

- **shape** - bentuk manifes plugin, API, dan ekspor runtime
- **plugin-registration** (+ paralel) - kasus pendaftaran manifes
- **package-manifest** - persyaratan manifes paket
- **loader** - perilaku penyiapan/pembongkaran pemuat plugin
- **registry** - isi dan pencarian registri kontrak plugin
- **providers** - perilaku penyedia bersama di seluruh penyedia bawaan, serta penyedia pencarian web
- **auth-choice** - metadata pilihan autentikasi dan perilaku penyiapan
- **provider-catalog-deprecation** - metadata katalog penyedia yang tidak digunakan lagi
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - kontrak wizard penyiapan penyedia
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - kontrak penyedia khusus kapabilitas
- **session-actions**, **session-attachments**, **session-entry-projection** - kontrak status sesi milik plugin
- **scheduled-turns** - metadata giliran terjadwal plugin dan batas stempel waktu
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - kontrak siklus hidup host/runtime plugin dan batas impor
- **extension-runtime-dependencies** - penempatan dependensi runtime untuk ekstensi

### Kapan dijalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi plugin saluran atau penyedia
- Setelah merefaktor pendaftaran atau penemuan plugin

Pengujian kontrak dijalankan dalam CI dan tidak memerlukan kunci API nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah penyedia/model yang ditemukan secara langsung:

- Tambahkan regresi aman untuk CI jika memungkinkan (penyedia tiruan/stub, atau tangkap transformasi bentuk permintaan yang tepat)
- Jika masalah tersebut pada dasarnya hanya dapat diuji secara langsung (batas laju, kebijakan autentikasi), pertahankan pengujian langsung agar tetap sempit dan bersifat keikutsertaan eksplisit melalui variabel env
- Utamakan penargetan lapisan terkecil yang dapat menangkap bug:
  - bug konversi/pemutaran ulang permintaan penyedia -> pengujian model langsung
  - bug pipeline sesi/riwayat/alat gateway -> smoke test gateway langsung atau pengujian tiruan gateway yang aman untuk CI
- Pagar pengaman penelusuran SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` memperoleh satu target sampel per kelas SecretRef dari metadata registri (`listSecretTargetRegistryEntries()`), lalu menegaskan bahwa id eksekusi dengan segmen penelusuran ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian tersebut. Pengujian ini sengaja gagal pada id target yang belum diklasifikasikan agar kelas baru tidak dapat dilewati secara diam-diam.

## Terkait

- [Pengujian langsung](/id/help/testing-live)
- [Pengujian pembaruan dan plugin](/id/help/testing-updates-plugins)
- [CI](/id/ci)
