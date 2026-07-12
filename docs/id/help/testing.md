---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan pengujian regresi untuk bug model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Perangkat pengujian: rangkaian pengujian unit/e2e/live, runner Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-07-12T14:16:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga rangkaian pengujian Vitest (unit/integrasi, e2e, live) serta runner Docker. Halaman ini membahas cakupan setiap rangkaian, perintah yang harus dijalankan untuk alur kerja tertentu, cara pengujian live menemukan kredensial, dan cara menambahkan pengujian regresi untuk bug penyedia/model di dunia nyata.

<Note>
**Tumpukan QA (qa-lab, qa-channel, jalur transportasi live)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - arsitektur, permukaan perintah, penyusunan skenario.
- [QA matriks](/id/concepts/qa-matrix) - referensi untuk `pnpm openclaw qa matrix`.
- [Kartu skor kematangan](/id/maturity/scorecard) - cara bukti QA rilis mendukung keputusan stabilitas dan LTS.
- [Saluran QA](/id/channels/qa-channel) - plugin transportasi sintetis yang digunakan oleh skenario berbasis repositori.

Halaman ini membahas rangkaian pengujian reguler dan runner Docker/Parallels. [Runner khusus QA](#qa-specific-runners) di bawah mencantumkan pemanggilan `qa` konkret dan merujuk kembali ke referensi di atas.
</Note>

## Mulai cepat

Untuk sebagian besar hari:

- Gerbang lengkap (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Eksekusi lokal yang lebih cepat untuk rangkaian lengkap pada mesin dengan sumber daya memadai: `pnpm test:max`
- Perulangan pemantauan langsung Vitest: `pnpm test:watch`
- Penargetan file langsung juga merutekan jalur plugin/saluran: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Saat mengiterasi satu kegagalan, utamakan eksekusi yang ditargetkan terlebih dahulu.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Jalur QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda mengubah pengujian atau menginginkan keyakinan tambahan:

- Laporan cakupan V8 informatif: `pnpm test:coverage`
- Rangkaian E2E: `pnpm test:e2e`

## Direktori Sementara Pengujian

Gunakan pembantu bersama di `test/helpers/temp-dir.ts` untuk direktori sementara milik pengujian agar kepemilikannya eksplisit dan pembersihan tetap berada dalam siklus hidup pengujian:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` sengaja tidak menyediakan metode pembersihan manual—Vitest memiliki pembersihan setelah setiap pengujian. Pembantu tingkat rendah yang lebih lama (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) masih tersedia untuk pengujian yang belum dimigrasikan; hindari penggunaan baru atas pembantu tersebut dan hindari pemanggilan baru `fs.mkdtemp*` secara langsung, kecuali pengujian secara eksplisit memverifikasi perilaku direktori sementara mentah. Saat direktori sementara langsung benar-benar diperlukan, tambahkan komentar izin yang dapat diaudit beserta alasannya:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` melaporkan pembuatan direktori sementara langsung yang baru dan penggunaan manual baru atas pembantu bersama dalam baris diff yang ditambahkan, tanpa memblokir gaya pembersihan yang sudah ada. Skrip ini mengikuti klasifikasi jalur pengujian yang sama seperti `scripts/changed-lanes.mjs` dan melewati implementasi pembantu bersama itu sendiri. `check:changed` menjalankan laporan ini untuk jalur pengujian yang berubah sebagai sinyal CI khusus peringatan (anotasi peringatan GitHub, bukan kegagalan).

## Alur kerja live dan Docker/Parallels

Saat men-debug penyedia/model nyata (memerlukan kredensial nyata):

- Rangkaian live (model + probe alat/gambar Gateway): `pnpm test:live`
- Targetkan satu file live tanpa banyak keluaran: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: jalankan `OpenClaw Performance` dengan `live_openai_candidate=true` untuk satu giliran agen `openai/gpt-5.6-luna` nyata atau `deep_profile=true` untuk artefak CPU/heap/trace Kova. Eksekusi terjadwal harian menerbitkan laporan jalur penyedia tiruan, profil mendalam, dan GPT-5.6 Luna ke `openclaw/clawgrit-reports` dari tugas penerbit terpisah yang mengonsumsi artefak; autentikasi penerbit yang hilang atau tidak valid menggagalkan eksekusi terjadwal dan `profile=release`. Pemanggilan manual non-rilis mempertahankan artefak GitHub dan memperlakukan penerbitan laporan sebagai anjuran. Laporan penyedia tiruan juga mencakup angka boot Gateway tingkat sumber, memori, tekanan plugin, perulangan sapaan model palsu berulang, dan waktu mulai CLI.
- Penyapuan model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih menjalankan satu giliran teks serta probe kecil bergaya pembacaan file. Model yang metadatanya menyatakan dukungan masukan `image` juga menjalankan satu giliran gambar kecil. Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan `OpenClaw Release Checks` manual sama-sama memanggil alur kerja live/E2E yang dapat digunakan kembali dengan `include_live_suites: true`, yang mencakup tugas matriks model live Docker yang dibagi berdasarkan penyedia.
  - Untuk eksekusi ulang CI terfokus, jalankan `OpenClaw Live And E2E Checks (Reusable)` dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan rahasia penyedia baru dengan sinyal tinggi ke `scripts/ci-hydrate-live-auth.sh`, `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`, serta pemanggil terjadwal/rilisnya.
- Pemeriksaan singkat obrolan terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan jalur live Docker terhadap jalur server aplikasi Codex, mengikat DM Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar dirutekan melalui pengikatan plugin native, bukan ACP.
- Pemeriksaan singkat harness server aplikasi Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness server aplikasi Codex milik plugin, memverifikasi `/codex status` dan `/codex models`, serta secara default menjalankan probe gambar, MCP cron, subagen, dan Guardian. Nonaktifkan probe subagen dengan `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan lain. Untuk pemeriksaan subagen yang terfokus, nonaktifkan probe lainnya:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Proses ini berhenti setelah probe subagen, kecuali `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ditetapkan.
- Pemeriksaan singkat instalasi Codex sesuai permintaan: `pnpm test:docker:codex-on-demand`
  - Menginstal tarball OpenClaw yang telah dipaketkan di Docker, menjalankan orientasi kunci API OpenAI, dan memverifikasi bahwa plugin Codex serta dependensi `@openai/codex` telah diunduh sesuai permintaan ke akar proyek npm terkelola.
- Pemeriksaan singkat dependensi alat plugin live: `pnpm test:docker:live-plugin-tool`
  - Mengemas plugin perlengkapan pengujian dengan dependensi `slugify` nyata, menginstalnya melalui `npm-pack:`, memverifikasi dependensi tersebut di bawah akar proyek npm terkelola, lalu meminta model OpenAI live untuk memanggil alat plugin dan mengembalikan slug tersembunyi.
- Pemeriksaan singkat perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opsional berlapis untuk permukaan perintah penyelamatan saluran pesan. Menjalankan `/crestodian status`, mengantrekan perubahan model persisten, membalas `/crestodian yes`, dan memverifikasi jalur penulisan audit/konfigurasi.
- Pemeriksaan singkat Docker untuk eksekusi pertama Crestodian: `pnpm test:docker:crestodian-first-run`
  - Dimulai dari direktori status OpenClaw kosong dan pertama-tama membuktikan bahwa CLI `openclaw crestodian` yang dipaketkan gagal secara tertutup tanpa inferensi. Kemudian menguji dan mengaktifkan Claude palsu melalui modul aktivasi yang dipaketkan. Hanya setelah itu, permintaan CLI paket yang tidak persis mencapai perencana dan diselesaikan menjadi penyiapan bertipe, diikuti operasi sekali jalan untuk model, agen, plugin Discord, dan SecretRef. Proses ini memvalidasi konfigurasi dan entri audit. Ini merupakan bukti pendukung gerbang/operasi, bukan bukti orientasi interaktif atau agen/alat/persetujuan Crestodian. Jalur yang sama tersedia di QA Lab melalui `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Pemeriksaan singkat biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` ditetapkan, jalankan `openclaw models list --provider moonshot --json`, lalu jalankan `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` yang terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi bahwa JSON melaporkan Moonshot/K2.6 dan transkrip asisten menyimpan `usage.cost` yang telah dinormalisasi.

<Tip>
Jika Anda hanya memerlukan satu kasus yang gagal, utamakan mempersempit pengujian live melalui variabel lingkungan daftar izin yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah-perintah ini berdampingan dengan rangkaian pengujian utama saat Anda memerlukan realisme QA Lab.

CI menjalankan QA Lab dalam alur kerja khusus. Kesetaraan agentik berada di bawah `QA-Lab - All Lanes` dan validasi rilis, bukan sebagai alur kerja PR mandiri. Validasi luas harus menggunakan `Full Release Validation` dengan `rerun_group=qa-parity` atau grup QA pemeriksaan rilis. Pemeriksaan rilis stabil/default mempertahankan soak live/Docker menyeluruh di balik `run_release_soak=true`; profil `full` memaksa soak aktif. `QA-Lab - All Lanes` berjalan setiap malam di `main` dan dari pemanggilan manual, dengan jalur kesetaraan tiruan, jalur Matrix live, jalur Telegram live yang dikelola Convex, serta jalur Discord live yang dikelola Convex sebagai tugas paralel. QA terjadwal dan pemeriksaan rilis meneruskan `--profile fast` untuk Matrix secara eksplisit, sedangkan CLI Matrix dan masukan alur kerja manual tetap menggunakan nilai default `all`; pemanggilan manual dapat membagi `all` menjadi tugas `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release Checks` menjalankan kesetaraan beserta jalur cepat Matrix dan Telegram sebelum persetujuan rilis, menggunakan `mock-openai/gpt-5.6-luna` untuk pemeriksaan transportasi rilis agar tetap deterministik dan menghindari startup plugin penyedia normal. Gateway transportasi live ini menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh rangkaian kesetaraan QA.

Shard media live rilis lengkap menggunakan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki `ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan citra bersama `ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali untuk setiap commit terpilih, lalu mengambilnya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repositori secara langsung di host.
  - Menulis artefak tingkat teratas `qa-evidence.json`, `qa-suite-summary.json`, dan
    `qa-suite-report.md` untuk kumpulan skenario yang dipilih, termasuk
    pilihan skenario alur campuran, Vitest, dan Playwright.
  - Saat dipicu oleh `pnpm openclaw qa run --qa-profile <profile>`, menyematkan
    kartu skor profil taksonomi yang dipilih dalam `qa-evidence.json` yang sama.
    `smoke-ci` menulis bukti ringkas (`evidenceMode: "slim"`, tanpa
    `execution` per entri). `release` mencakup bagian kesiapan rilis yang telah dikurasi; `all`
    memilih setiap kategori kematangan aktif dan menargetkan pemicuan alur kerja
    QA Profile Evidence secara eksplisit saat artefak kartu skor lengkap diperlukan.
  - Secara bawaan menjalankan beberapa skenario terpilih secara paralel dengan
    pekerja Gateway yang terisolasi. `qa-channel` menggunakan konkurensi 4 secara bawaan (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    pekerja, atau `--concurrency 1` untuk jalur serial lama.
  - Keluar dengan kode bukan nol saat skenario mana pun gagal. Gunakan `--allow-failures` untuk
    menghasilkan artefak tanpa kode keluar kegagalan.
  - Mendukung mode penyedia `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server penyedia lokal berbasis AIMock untuk cakupan eksperimental
    fixture dan mock protokol tanpa menggantikan jalur `mock-openai`
    yang sadar skenario.
- `pnpm openclaw qa coverage --match <query>`
  - Mencari ID skenario, judul, permukaan, ID cakupan, referensi dokumentasi, referensi
    kode, plugin, dan persyaratan penyedia, lalu mencetak target suite
    yang cocok.
  - Gunakan ini sebelum menjalankan QA Lab saat Anda mengetahui perilaku atau jalur berkas
    yang disentuh, tetapi tidak mengetahui skenario terkecil. Hanya bersifat saran - tetap pilih bukti
    mock, langsung, Multipass, Matrix, atau transportasi berdasarkan perilaku yang
    diubah.
- `pnpm test:plugins:kitchen-sink-live`
  - Menjalankan rangkaian pengujian lengkap Plugin OpenAI Kitchen Sink langsung melalui QA Lab.
    Memasang paket eksternal Kitchen Sink, memverifikasi inventaris permukaan SDK
    plugin, memeriksa `/healthz` dan `/readyz`, merekam bukti CPU/RSS
    Gateway, menjalankan satu giliran OpenAI langsung, dan memeriksa diagnostik
    adversarial. Memerlukan autentikasi OpenAI langsung seperti `OPENAI_API_KEY`. Dalam
    sesi Testbox yang telah dihidrasi, perintah ini secara otomatis memuat profil autentikasi langsung
    Testbox saat pembantu `openclaw-testbox-env` tersedia.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan tolok ukur startup Gateway beserta paket kecil skenario QA Lab tiruan
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan gabungan pengamatan CPU
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara bawaan hanya menandai pengamatan CPU panas yang berkelanjutan (`--cpu-core-warn`,
    bawaan `0.9`; `--hot-wall-warn-ms`, bawaan `30000`), sehingga lonjakan singkat saat startup
    direkam sebagai metrik tanpa tampak seperti regresi Gateway
    yang terus membebani CPU selama beberapa menit.
  - Berjalan terhadap artefak `dist` yang telah dibangun; jalankan pembangunan terlebih dahulu saat checkout
    belum memiliki keluaran runtime terbaru.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai, dengan tetap
    menggunakan flag pemilihan skenario serta penyedia/model yang sama seperti `qa suite`.
  - Eksekusi langsung meneruskan masukan autentikasi QA yang praktis untuk tamu:
    kunci penyedia berbasis env, jalur konfigurasi penyedia langsung QA, dan
    `CODEX_HOME` jika tersedia.
  - Direktori keluaran harus tetap berada di bawah akar repositori agar tamu dapat menulis kembali
    melalui ruang kerja yang dipasang.
  - Menulis laporan + ringkasan QA normal beserta log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, memasangnya secara global di
    Docker, menjalankan orientasi kunci API OpenAI secara noninteraktif, mengonfigurasi
    Telegram secara bawaan, memverifikasi runtime Plugin yang dikemas dapat dimuat tanpa
    perbaikan dependensi startup, menjalankan doctor, dan menjalankan satu giliran agen lokal
    terhadap endpoint OpenAI tiruan.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan jalur pemasangan paket
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi-terbangun yang deterministik untuk transkrip konteks runtime
    tertanam. Memverifikasi konteks runtime OpenClaw yang tersembunyi tetap bertahan sebagai
    pesan kustom yang tidak ditampilkan, alih-alih bocor ke giliran pengguna yang terlihat,
    lalu memasukkan JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulang sesi tersebut ke cabang aktif beserta cadangannya.
- `pnpm test:docker:npm-telegram-live`
  - Memasang kandidat paket OpenClaw di Docker, menjalankan orientasi
    paket terpasang, mengonfigurasi Telegram melalui CLI yang terpasang, lalu menggunakan kembali
    jalur QA Telegram langsung dengan paket terpasang tersebut sebagai Gateway
    SUT.
  - Pembungkus hanya memasang sumber harness `qa-lab` dari checkout;
    paket terpasang memiliki `dist`, `openclaw/plugin-sdk`, dan runtime
    Plugin bawaan, sehingga jalur tersebut tidak mencampurkan Plugin checkout saat ini ke
    dalam paket yang diuji.
  - Secara bawaan menggunakan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; tetapkan
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang telah diresolusi, alih-alih
    memasangnya dari registri.
  - Secara bawaan menghasilkan pengukuran waktu RTT berulang di `qa-evidence.json` dengan
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Timpa
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, atau
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` untuk menyesuaikan eksekusi.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` menerima daftar ID pemeriksaan QA
    Telegram yang dipisahkan koma untuk dijadikan sampel; jika tidak ditetapkan, pemeriksaan bawaan yang mendukung
    RTT adalah `telegram-mentioned-message-reply`.
  - Menggunakan kredensial env Telegram atau sumber kredensial Convex yang sama seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, tetapkan
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` beserta
    `OPENCLAW_QA_CONVEX_SITE_URL` dan rahasia peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan rahasia peran Convex tersedia di
    CI, pembungkus Docker memilih Convex secara otomatis.
  - Pembungkus memvalidasi env kredensial Telegram atau Convex di host
    sebelum pekerjaan pembangunan/pemasangan Docker. Tetapkan
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` hanya saat
    dengan sengaja melakukan debug pada penyiapan sebelum kredensial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menimpa
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk jalur ini. Saat kredensial
    Convex dipilih dan tidak ada peran yang ditetapkan, pembungkus menggunakan `ci` di CI
    dan `maintainer` di luar CI.
  - GitHub Actions menyediakan jalur ini sebagai alur kerja pengelola manual
    `NPM Telegram Beta E2E`. Jalur ini tidak berjalan saat penggabungan. Alur kerja menggunakan
    lingkungan `qa-live-shared` dan sewa kredensial CI Convex.
- GitHub Actions juga menyediakan `Package Acceptance` untuk bukti produk eksekusi sampingan
  terhadap satu paket kandidat. Alur ini menerima referensi Git, spesifikasi npm yang dipublikasikan,
  URL tarball HTTPS beserta SHA-256, kebijakan URL tepercaya, atau artefak tarball
  dari eksekusi lain (`source=ref|npm|url|trusted-url|artifact`), mengunggah
  `openclaw-current.tgz` yang telah dinormalisasi sebagai `package-under-test`, lalu menjalankan
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

- Bukti URL tarball yang tepat memerlukan digest dan menggunakan kebijakan keamanan URL publik:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Mirror tarball perusahaan/privat menggunakan kebijakan sumber tepercaya yang eksplisit:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` membaca `.github/package-trusted-sources.json` dari referensi alur kerja tepercaya dan tidak menerima kredensial URL maupun bypass jaringan privat melalui masukan alur kerja. Jika kebijakan bernama mendeklarasikan autentikasi bearer, konfigurasikan rahasia tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Bukti artefak mengunduh artefak tarball dari eksekusi Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mengemas dan memasang build OpenClaw saat ini di Docker, memulai
    Gateway dengan OpenAI yang telah dikonfigurasi, lalu mengaktifkan saluran/Plugin bawaan melalui
    penyuntingan konfigurasi.
  - Memverifikasi penemuan penyiapan membiarkan Plugin yang dapat diunduh tetapi belum dikonfigurasi
    tetap tidak ada, perbaikan doctor pertama yang dikonfigurasi memasang setiap
    Plugin yang dapat diunduh dan hilang secara eksplisit, dan mulai ulang kedua tidak menjalankan
    perbaikan dependensi tersembunyi.
  - Juga memasang baseline npm lama yang diketahui, mengaktifkan Telegram sebelum
    menjalankan `openclaw update --tag <candidate>`, dan memverifikasi
    doctor setelah pembaruan milik kandidat membersihkan sisa dependensi Plugin lama
    tanpa perbaikan pascapemasangan dari sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke pembaruan pemasangan paket native pada tamu Parallels.
    Setiap platform yang dipilih terlebih dahulu memasang paket baseline yang diminta,
    kemudian menjalankan perintah `openclaw update` yang telah terpasang pada tamu yang sama dan
    memverifikasi versi terpasang, status pembaruan, kesiapan Gateway, dan
    satu giliran agen lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux`
    saat melakukan iterasi pada satu tamu. Gunakan `--json` untuk jalur artefak ringkasan
    dan status per jalur.
  - Jalur OpenAI menggunakan `openai/gpt-5.6-luna` secara bawaan untuk bukti giliran agen
    langsung. Teruskan `--model <provider/model>` atau tetapkan
    `OPENCLAW_PARALLELS_OPENAI_MODEL` untuk memvalidasi model OpenAI lain.
  - Bungkus eksekusi lokal yang panjang dengan batas waktu host agar kemacetan transportasi Parallels
    tidak menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log jalur bertingkat di bawah
    `/tmp/openclaw-parallels-npm-update.*`. Periksa `windows-update.log`,
    `macos-update.log`, atau `linux-update.log` sebelum menganggap pembungkus luar
    macet.
  - Pembaruan Windows dapat menghabiskan 10 hingga 15 menit untuk pekerjaan doctor setelah pembaruan dan
    pembaruan paket pada tamu dingin; proses tersebut masih sehat selama
    log debug npm bertingkat terus bertambah.
  - Jangan menjalankan pembungkus agregat ini secara paralel dengan jalur smoke Parallels
    macOS, Windows, atau Linux individual. Jalur-jalur tersebut berbagi status VM dan dapat
    bertabrakan saat pemulihan snapshot, penyajian paket, atau status Gateway tamu.
  - Bukti setelah pembaruan menjalankan permukaan Plugin bawaan normal karena
    fasad kapabilitas seperti ucapan, pembuatan gambar, dan pemahaman
    media dimuat melalui API runtime bawaan meskipun giliran agen
    itu sendiri hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server penyedia AIMock lokal untuk pengujian smoke
    protokol secara langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan jalur QA langsung Matrix terhadap homeserver Tuwunel sekali
    pakai yang didukung Docker. Hanya untuk checkout sumber - instalasi terpaket
    tidak menyertakan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, variabel lingkungan, dan tata letak artefak:
    [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan jalur QA langsung Telegram terhadap grup privat nyata menggunakan
    token bot penggerak dan SUT dari lingkungan.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID percakapan
    Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial bersama dari kumpulan.
    Gunakan mode lingkungan secara default, atau tetapkan `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    untuk memilih menggunakan sewa dari kumpulan.
  - Cakupan default meliputi canary, pembatasan sebutan, pengalamatan perintah, `/status`,
    balasan antarbotor yang disebut, dan balasan perintah native inti.
    Default `mock-openai` juga mencakup regresi rantai balasan deterministik dan
    streaming pesan akhir Telegram. Gunakan `--list-scenarios`
    untuk pemeriksaan opsional seperti `session_status`.
  - Keluar dengan kode bukan nol ketika ada skenario yang gagal. Gunakan `--allow-failures`
    untuk menghasilkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT
    memiliki nama pengguna Telegram.
  - Untuk pengamatan antarbotor yang stabil, aktifkan Bot-to-Bot Communication Mode
    di `@BotFather` untuk kedua bot dan pastikan bot penggerak dapat mengamati
    lalu lintas bot dalam grup.
  - Menulis laporan QA Telegram, ringkasan, dan `qa-evidence.json` di bawah
    `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan pengiriman
    penggerak hingga balasan SUT teramati.

`Mantis Telegram Live` adalah pembungkus bukti PR untuk jalur ini. Pembungkus ini menjalankan
ref kandidat dengan kredensial Telegram yang disewa melalui Convex, merender
bundel laporan/bukti QA yang disunting dalam peramban desktop Crabbox, merekam bukti
MP4, menghasilkan GIF yang dipangkas berdasarkan gerakan, mengunggah bundel artefak, dan
memposting bukti PR sebaris melalui Mantis GitHub App ketika `pr_number`
ditetapkan. Pengelola dapat memulainya dari UI Actions melalui `Mantis Scenario`
(`scenario_id: telegram-live`) atau langsung dari komentar pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` adalah pembungkus sebelum/sesudah Telegram Desktop
native berbasis agen untuk bukti visual PR. Mulai dari UI Actions dengan
`instructions` berbentuk bebas, melalui `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), atau dari komentar PR:

```text
@openclaw-mantis telegram desktop proof
```

Agen Mantis membaca PR, menentukan perilaku yang terlihat di Telegram untuk membuktikan
perubahan, menjalankan jalur bukti pengguna nyata Telegram Desktop Crabbox pada
ref dasar dan kandidat, melakukan iterasi hingga GIF native berguna,
menulis manifes `motionPreview` berpasangan, dan memposting tabel GIF
2 kolom yang sama melalui Mantis GitHub App ketika `pr_number` ditetapkan.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Menyewa atau menggunakan kembali desktop Linux Crabbox, memasang Telegram
    Desktop native, mengonfigurasi OpenClaw dengan token bot SUT Telegram yang disewa,
    memulai Gateway, dan merekam bukti tangkapan layar/MP4 dari
    desktop VNC yang terlihat.
  - Secara default menggunakan `--credential-source convex` sehingga alur kerja hanya memerlukan
    rahasia broker Convex. Gunakan `--credential-source env` dengan variabel
    `OPENCLAW_QA_TELEGRAM_*` yang sama seperti `pnpm openclaw qa telegram`.
  - Telegram Desktop tetap memerlukan login/profil pengguna. Token bot
    hanya mengonfigurasi OpenClaw. Gunakan `--telegram-profile-archive-env <name>`
    untuk arsip profil `.tgz` base64, atau gunakan `--keep-lease` dan masuk
    secara manual melalui VNC satu kali.
  - Menulis `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png`, dan `telegram-desktop-builder.mp4`
    di bawah direktori keluaran.

Jalur transportasi langsung berbagi satu kontrak standar agar transportasi baru tidak
menyimpang; matriks cakupan per jalur tersedia di
[Ikhtisar QA - Cakupan transportasi langsung](/id/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` adalah rangkaian sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Ketika `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
diaktifkan untuk QA transportasi langsung, laboratorium QA memperoleh sewa eksklusif dari
kumpulan yang didukung Convex, mengirim Heartbeat untuk sewa tersebut selama jalur berjalan, dan
melepaskan sewa saat penghentian. Nama bagian ini mendahului dukungan Discord, Slack, dan
WhatsApp; kontrak sewa digunakan bersama lintas jenis.

Kerangka proyek Convex referensi: `qa/convex-credential-broker/`

Variabel lingkungan wajib:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu rahasia untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default lingkungan: `OPENCLAW_QA_CREDENTIAL_ROLE` (secara default `ci` di CI, selain itu `maintainer`)

Variabel lingkungan opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID pelacakan opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex local loopback `http://` hanya untuk pengembangan lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin pengelola (menambah/menghapus/mencantumkan kumpulan) secara khusus memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pembantu CLI untuk pengelola:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum eksekusi langsung untuk memeriksa URL situs Convex, rahasia broker,
prefiks titik akhir, batas waktu HTTP, dan keterjangkauan admin/daftar tanpa mencetak
nilai rahasia. Gunakan `--json` untuk keluaran yang dapat dibaca mesin dalam skrip dan utilitas
CI.

Kontrak titik akhir default (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Permintaan diautentikasi dengan header `Authorization: Bearer <role secret>`;
badan di bawah menghilangkan header tersebut:

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
- `POST /admin/add` (hanya rahasia pengelola)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (hanya rahasia pengelola)
  - Permintaan: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Pelindung sewa aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya rahasia pengelola)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string ID percakapan Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang formatnya salah.

Bentuk payload untuk jenis pengguna nyata Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, dan `telegramApiId` harus berupa string numerik.
- `tdlibArchiveSha256` dan `desktopTdataArchiveSha256` harus berupa string heksadesimal SHA-256.
- `kind: "telegram-user"` dicadangkan untuk alur kerja bukti Mantis Telegram Desktop. Jalur QA Lab generik tidak boleh memperolehnya.

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
Persyaratan minimum: implementasikan runner transportasi pada seam host `qa-lab` bersama,
tambahkan `adapterFactory` untuk skenario bersama, deklarasikan `qaRunners` dalam
manifes plugin, pasang sebagai `openclaw qa <runner>`, dan tulis skenario di bawah
`qa/scenarios/`.

## Rangkaian pengujian (apa yang berjalan di mana)

Anggap rangkaian ini sebagai "realisme yang meningkat" (serta tingkat ketidakstabilan/biaya yang meningkat).

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: eksekusi tanpa target menggunakan kumpulan shard `vitest.full-*.config.ts` dan dapat
  memperluas shard multiproyek menjadi konfigurasi per proyek untuk penjadwalan
  paralel
- Berkas: inventaris inti/unit di bawah `src/**/*.test.ts`,
  `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan dalam
  shard `unit-ui` khusus
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (autentikasi Gateway, perutean, alat, penguraian, konfigurasi)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan pemuat permukaan publik harus membuktikan perilaku fallback
    `api.js` dan `runtime-api.js` yang luas dengan fixture plugin kecil yang dihasilkan,
    bukan API sumber plugin terbundel nyata. Pemuatan API plugin nyata termasuk dalam
    rangkaian kontrak/integrasi yang dimiliki plugin.

Kebijakan dependensi native:

- Instalasi pengujian default melewati build opus native Discord opsional. Suara Discord
  menggunakan `libopus-wasm` terbundel, dan `@discordjs/opus` tetap dinonaktifkan dalam
  `allowBuilds` agar pengujian lokal dan jalur Testbox tidak mengompilasi
  addon native.
- Bandingkan kinerja opus native dalam repositori tolok ukur `libopus-wasm`, bukan
  dalam siklus instalasi/pengujian default OpenClaw. Jangan menetapkan `@discordjs/opus` menjadi
  `true` dalam `allowBuilds` default; hal itu membuat siklus instalasi/pengujian yang tidak terkait
  mengompilasi kode native.

<AccordionGroup>
  <Accordion title="Proyek, shard, dan jalur bercakupan">

    - Eksekusi `pnpm test` tanpa target menjalankan tiga belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses proyek root native yang sangat besar. Ini mengurangi RSS puncak pada mesin dengan beban tinggi dan mencegah pekerjaan auto-reply/Plugin menghambat rangkaian pengujian yang tidak terkait.
    - `pnpm test --watch` tetap menggunakan grafik proyek native root `vitest.config.ts`, karena loop pemantauan multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target berkas/direktori eksplisit terlebih dahulu melalui jalur terbatas, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tidak perlu menanggung biaya penuh saat memulai proyek root.
    - `pnpm test:changed` secara default memperluas jalur git yang berubah menjadi jalur terbatas yang ringan: pengeditan pengujian langsung, berkas saudara `*.test.ts`, pemetaan sumber eksplisit, dan dependensi grafik impor lokal. Pengeditan konfigurasi/penyiapan/paket tidak menjalankan pengujian secara luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gerbang pemeriksaan lokal cerdas yang lazim untuk pekerjaan dengan cakupan sempit. Perintah ini mengklasifikasikan diff menjadi inti, pengujian inti, ekstensi, pengujian ekstensi, aplikasi, dokumentasi, metadata rilis, peralatan Docker langsung, dan peralatan, kemudian menjalankan perintah pemeriksaan tipe, lint, dan penjaga yang sesuai. Perintah ini tidak menjalankan pengujian Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` secara eksplisit untuk bukti pengujian. Peningkatan versi yang hanya menyentuh metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan, dengan penjaga yang menolak perubahan paket di luar bidang versi tingkat atas.
    - Pengeditan harness ACP Docker langsung menjalankan pemeriksaan terfokus: sintaks shell untuk skrip autentikasi Docker langsung dan simulasi penjadwal Docker langsung. Perubahan `package.json` hanya disertakan saat diff terbatas pada `scripts["test:docker:live-*"]`; pengeditan dependensi, ekspor, versi, dan permukaan paket lainnya tetap menggunakan penjaga yang lebih luas.
    - Pengujian unit dengan impor ringan dari agen, perintah, Plugin, pembantu auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui jalur `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; berkas dengan banyak status/beban runtime tetap berada di jalur yang sudah ada.
    - Berkas sumber pembantu `plugin-sdk` dan `commands` tertentu juga memetakan eksekusi mode berubah ke pengujian saudara eksplisit pada jalur ringan tersebut, sehingga pengeditan pembantu tidak menjalankan ulang seluruh rangkaian berat untuk direktori itu.
    - `auto-reply` memiliki kelompok khusus untuk pembantu inti tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subpohon `src/auto-reply/reply/**`. CI selanjutnya membagi subpohon balasan menjadi shard agent-runner, dispatch, dan commands/state-routing agar satu kelompok dengan impor berat tidak menguasai seluruh bagian akhir Node.
    - CI PR/main normal sengaja melewati penyisiran batch Plugin bawaan dan shard khusus rilis `agentic-plugins`. Validasi Rilis Lengkap menjalankan alur kerja turunan `Plugin Prerelease` yang terpisah untuk rangkaian sarat Plugin tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah masukan penemuan alat pesan atau konteks runtime
      Compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi pembantu terfokus untuk batas perutean dan normalisasi
      murni.
    - Jaga kesehatan rangkaian integrasi runner tertanam:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Rangkaian tersebut memverifikasi bahwa ID terbatas dan perilaku Compaction
      tetap mengalir melalui jalur `run.ts` / `compact.ts` yang sebenarnya;
      pengujian yang hanya mencakup pembantu bukanlah pengganti yang memadai
      untuk jalur integrasi tersebut.

  </Accordion>

  <Accordion title="Default kumpulan dan isolasi Vitest">

    - Konfigurasi dasar Vitest secara default menggunakan `threads`.
    - Konfigurasi Vitest bersama menetapkan `isolate: false` dan menggunakan
      runner tanpa isolasi di seluruh proyek root, konfigurasi e2e, dan
      konfigurasi langsung.
    - Jalur UI root mempertahankan penyiapan dan pengoptimal `jsdom`, tetapi juga
      berjalan pada runner bersama tanpa isolasi.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari konfigurasi Vitest bersama.
    - `scripts/run-vitest.mjs` secara default menambahkan `--no-maglev` untuk
      proses turunan Node Vitest guna mengurangi pengulangan kompilasi V8
      selama eksekusi lokal yang besar. Tetapkan
      `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkannya dengan perilaku
      V8 standar.
    - `scripts/run-vitest.mjs` menghentikan eksekusi Vitest eksplisit tanpa mode
      pemantauan setelah 5 menit tanpa keluaran stdout atau stderr. Tetapkan
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` untuk menonaktifkan pengawas
      bagi investigasi yang sengaja tidak menghasilkan keluaran.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan jalur arsitektur yang dipicu oleh suatu diff.
    - Hook pra-commit hanya melakukan pemformatan. Hook ini memasukkan kembali
      berkas yang telah diformat ke staging dan tidak menjalankan lint,
      pemeriksaan tipe, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum serah terima atau
      push saat Anda memerlukan gerbang pemeriksaan lokal cerdas.
    - `pnpm test:changed` secara default merutekan melalui jalur terbatas yang
      ringan. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya
      ketika agen memutuskan bahwa pengeditan harness, konfigurasi, paket, atau
      kontrak benar-benar memerlukan cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku
      perutean yang sama, hanya dengan batas worker yang lebih tinggi.
    - Penskalaan otomatis worker lokal sengaja dibuat konservatif dan dikurangi
      ketika rata-rata beban host sudah tinggi, sehingga beberapa eksekusi
      Vitest secara bersamaan secara default menimbulkan lebih sedikit dampak.
    - Konfigurasi dasar Vitest menandai berkas proyek/konfigurasi sebagai
      `forceRerunTriggers` agar eksekusi ulang mode berubah tetap benar saat
      pengawatan pengujian berubah.
    - Konfigurasi mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada
      host yang didukung; tetapkan `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      untuk satu lokasi cache eksplisit bagi pemrofilan langsung.

  </Accordion>

  <Accordion title="Debug performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest beserta
      keluaran perincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan pemrofilan yang sama
      pada berkas yang berubah sejak `origin/main`.
    - Data waktu shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Eksekusi seluruh konfigurasi menggunakan jalur konfigurasi sebagai kunci;
      shard CI dengan pola penyertaan menambahkan nama shard agar shard yang
      difilter dapat dilacak secara terpisah.
    - Ketika satu pengujian berat masih menghabiskan sebagian besar waktunya
      pada impor awal, simpan dependensi berat di balik batas lokal
      `*.runtime.ts` yang sempit dan tirukan batas tersebut secara langsung,
      alih-alih mengimpor secara mendalam pembantu runtime hanya untuk
      meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan jalur proyek root native untuk diff
      yang telah di-commit tersebut dan mencetak waktu nyata beserta RSS
      maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark terhadap
      pohon kerja kotor saat ini dengan merutekan daftar berkas yang berubah
      melalui `scripts/test-projects.mjs` dan konfigurasi Vitest root.
    - `pnpm test:perf:profile:main` menulis profil CPU thread utama untuk biaya
      awal dan transformasi Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      rangkaian unit dengan paralelisme berkas dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (Gateway)

- Perintah: `pnpm test:stability:gateway`
- Konfigurasi: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts`, dan `test/vitest/vitest.infra.config.ts`, masing-masing dipaksa menggunakan satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara default
  - Menggerakkan perputaran sintetis pesan gateway, memori, dan muatan besar melalui jalur peristiwa diagnostik
  - Mengueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup pembantu persistensi bundel stabilitas diagnostik
  - Memastikan recorder tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi kembali kosong
- Ekspektasi:
  - Aman untuk CI dan tidak memerlukan kunci
  - Jalur sempit untuk tindak lanjut regresi stabilitas, bukan pengganti rangkaian Gateway lengkap

### E2E (agregat repo)

- Perintah: `pnpm test:e2e`
- Cakupan:
  - Menjalankan jalur E2E smoke Gateway
  - Menjalankan jalur E2E peramban Control UI dengan tiruan
- Ekspektasi:
  - Aman untuk CI dan tidak memerlukan kunci
  - Memerlukan Playwright Chromium terinstal

### E2E (smoke Gateway)

- Perintah: `pnpm test:e2e:gateway`
- Konfigurasi: `test/vitest/vitest.e2e.config.ts`
- Berkas: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E Plugin bawaan di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode senyap secara default untuk mengurangi biaya I/O konsol.
- Penimpaan yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksakan jumlah worker (dibatasi hingga 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali keluaran konsol terperinci.
- Cakupan:
  - Perilaku gateway ujung-ke-ujung multi-instans
  - Permukaan WebSocket/HTTP, pemasangan Node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan dalam pipeline)
  - Tidak memerlukan kunci nyata
  - Memiliki lebih banyak komponen bergerak daripada pengujian unit (dapat lebih lambat)

### E2E (peramban Control UI dengan tiruan)

- Perintah: `pnpm test:ui:e2e`
- Konfigurasi: `test/vitest/vitest.ui-e2e.config.ts`
- Berkas: `ui/src/**/*.e2e.test.ts`
- Cakupan:
  - Memulai Vite Control UI
  - Menggerakkan halaman Chromium nyata melalui Playwright
  - Mengganti WebSocket Gateway dengan tiruan deterministik di dalam peramban
- Ekspektasi:
  - Berjalan di CI sebagai bagian dari `pnpm test:e2e`
  - Tidak memerlukan Gateway, agen, atau kunci penyedia nyata
  - Dependensi peramban harus tersedia (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- Berkas: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Menggunakan kembali gateway OpenShell lokal yang aktif
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell milik OpenClaw melalui `sandbox ssh-config` + eksekusi SSH nyata
  - Memverifikasi perilaku sistem berkas kanonis jarak jauh melalui jembatan sistem berkas sandbox
- Ekspektasi:
  - Hanya ikut serta secara eksplisit; bukan bagian dari eksekusi default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal beserta daemon Docker yang berfungsi
  - Memerlukan gateway OpenShell lokal yang aktif dan sumber konfigurasinya
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan sandbox pengujian
- Penimpaan yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan rangkaian e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI atau skrip pembungkus non-default
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` untuk mengekspos konfigurasi gateway terdaftar kepada pengujian terisolasi
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` untuk menimpa IP gateway Docker yang digunakan oleh fixture kebijakan host

### Langsung (penyedia nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `test/vitest/vitest.live.config.ts`
- Berkas: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian langsung Plugin bawaan di bawah `extensions/`
- Bawaan: **diaktifkan** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - "Apakah penyedia/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?"
  - Menangkap perubahan format penyedia, kekhasan pemanggilan alat, masalah autentikasi, dan perilaku batas laju
- Ekspektasi:
  - Sengaja tidak stabil di CI (jaringan nyata, kebijakan penyedia nyata, kuota, gangguan layanan)
  - Mengeluarkan biaya / menggunakan batas laju
  - Sebaiknya jalankan subset yang dipersempit, bukan "semuanya"
- Proses langsung menggunakan kunci API yang sudah diekspor dan profil autentikasi yang telah disiapkan.
- Secara bawaan, proses langsung tetap mengisolasi `HOME` serta menyalin materi konfigurasi/autentikasi ke direktori home pengujian sementara agar fixture unit tidak dapat mengubah `~/.openclaw` Anda yang sebenarnya.
- Tetapkan `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya jika Anda sengaja memerlukan pengujian langsung untuk menggunakan direktori home Anda yang sebenarnya.
- `pnpm test:live` secara bawaan menggunakan mode yang lebih senyap: keluaran progres `[live] ...` tetap ditampilkan, sedangkan log bootstrap Gateway/keluaran ramai Bonjour dibisukan. Tetapkan `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin menampilkan kembali log startup lengkap.
- Rotasi kunci API (khusus penyedia): tetapkan `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), atau gunakan penggantian khusus pengujian langsung melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba ulang saat menerima respons batas laju.
- Keluaran progres/Heartbeat:
  - Rangkaian pengujian langsung mengirim baris progres ke stderr agar pemanggilan penyedia yang lama tetap terlihat aktif meskipun penangkapan konsol Vitest sedang senyap.
  - `test/vitest/vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest agar baris progres penyedia/Gateway langsung mengalir selama proses langsung.
  - Sesuaikan Heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan Heartbeat Gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Rangkaian mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Mengubah jaringan Gateway / protokol WS / pemasangan: tambahkan `pnpm test:e2e`
- Men-debug "bot saya tidak aktif" / kegagalan khusus penyedia / pemanggilan alat: jalankan `pnpm test:live` yang dipersempit

## Pengujian langsung (mengakses jaringan)

Untuk matriks model langsung, pengujian singkat backend CLI, pengujian singkat ACP, harness
server aplikasi Codex, dan semua pengujian langsung penyedia media (Deepgram, BytePlus, ComfyUI,
gambar, musik, video, harness media) - ditambah penanganan kredensial untuk proses langsung

- lihat [Menguji rangkaian langsung](/id/help/testing-live). Untuk daftar periksa khusus pembaruan dan
  validasi Plugin, lihat
  [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model langsung: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan berkas langsung kunci profil yang sesuai di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan memasang direktori konfigurasi lokal, ruang kerja, dan berkas env profil opsional Anda. Titik masuk lokal yang sesuai adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner langsung Docker mempertahankan batas praktisnya sendiri jika diperlukan:
  `test:docker:live-models` secara bawaan menggunakan kumpulan terseleksi yang didukung dan berindikasi kuat, sedangkan
  `test:docker:live-gateway` secara bawaan menggunakan `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Tetapkan `OPENCLAW_LIVE_MAX_MODELS`
  atau variabel env Gateway jika Anda secara eksplisit menginginkan batas yang lebih kecil atau pemindaian yang lebih luas.
- `test:docker:all` membangun image Docker langsung satu kali melalui `test:docker:live-build`, mengemas OpenClaw satu kali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan kembali dua image `scripts/e2e/Dockerfile`. Image dasar hanya merupakan runner Node/Git untuk jalur instalasi/pembaruan/dependensi Plugin; jalur tersebut memasang tarball yang telah dibangun sebelumnya. Image fungsional menginstal tarball yang sama ke `/app` untuk jalur fungsionalitas aplikasi hasil build. Definisi jalur Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` menjalankan rencana yang dipilih. Agregat tersebut menggunakan penjadwal lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sedangkan batas sumber daya mencegah jalur langsung berat, instalasi npm, dan multilayanan dimulai bersamaan. Jika satu jalur lebih berat daripada batas aktif, penjadwal tetap dapat memulainya saat kumpulan kosong, lalu membiarkannya berjalan sendiri hingga kapasitas kembali tersedia. Nilai bawaan adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (dan penggantian `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` lainnya) hanya jika host Docker memiliki kapasitas lebih besar. Runner secara bawaan melakukan pemeriksaan awal Docker, menghapus kontainer E2E OpenClaw yang kedaluwarsa, mencetak status setiap 30 detik, menyimpan waktu jalur yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan waktu tersebut untuk memulai jalur yang lebih lama terlebih dahulu pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes jalur berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI bagi jalur yang dipilih, kebutuhan paket/image, dan kredensial.
- `Package Acceptance` adalah gerbang paket bawaan GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Gerbang ini menentukan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, `source=trusted-url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan jalur E2E Docker yang dapat digunakan kembali terhadap tarball yang persis sama, alih-alih mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan luas cakupan: `smoke`, `package`, `product`, dan `full` (ditambah `custom` untuk daftar jalur eksplisit). Lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins) untuk kontrak paket/pembaruan/Plugin, matriks keberlangsungan peningkatan versi yang telah diterbitkan, nilai bawaan rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Penjaga ini menelusuri graf hasil build statis dari `dist/entry.js` dan `dist/cli/run-main.js`, lalu gagal jika graf bootstrap sebelum pengiriman perintah tersebut mengimpor paket eksternal apa pun secara statis (Commander, UI prompt, undici, logging, dan dependensi berat saat startup serupa semuanya dihitung) sebelum pengiriman perintah; penjaga ini juga membatasi potongan proses Gateway yang dibundel hingga 70 KB dan menolak impor statis jalur Gateway yang diketahui jarang digunakan (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) dari potongan tersebut. `scripts/release-check.ts` secara terpisah melakukan pengujian singkat terhadap CLI yang dikemas dengan `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema`, dan `models list --provider openai`.
- Kompatibilitas lama Package Acceptance dibatasi hingga `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga batas tersebut, harness hanya menoleransi kekurangan metadata paket yang telah dirilis: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang tidak tersedia, berkas patch yang tidak tersedia dalam fixture git turunan tarball, `update.channel` tersimpan yang tidak tersedia, lokasi catatan instalasi Plugin lama, persistensi catatan instalasi marketplace yang tidak tersedia, dan migrasi metadata konfigurasi selama `plugins update`. Untuk paket setelah `2026.4.25`, jalur tersebut merupakan kegagalan mutlak.
- Runner pengujian singkat kontainer: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` menjalankan satu atau beberapa kontainer nyata dan memverifikasi jalur integrasi tingkat tinggi.
- Jalur E2E Docker/Bash yang menginstal tarball OpenClaw terkemas melalui `scripts/lib/openclaw-e2e-instance.sh` membatasi `npm install` pada `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (bawaan `600s`; tetapkan `0` untuk menonaktifkan pembungkus saat men-debug).

Runner Docker model langsung juga hanya memasang home autentikasi CLI yang diperlukan
(atau semua yang didukung jika proses tidak dipersempit), lalu menyalinnya ke
home kontainer sebelum proses berjalan agar OAuth CLI eksternal dapat menyegarkan token
tanpa mengubah penyimpanan autentikasi host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Pengujian singkat pengikatan ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara bawaan, dengan cakupan Droid/OpenCode yang ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Pengujian singkat backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Pengujian singkat harness server aplikasi Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen pengembangan: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Pengujian singkat observabilitas: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, dan `pnpm qa:observability:smoke` adalah jalur checkout sumber QA privat. Jalur tersebut sengaja tidak menjadi bagian dari jalur rilis Docker paket karena tarball npm tidak menyertakan QA Lab.
- Pengujian singkat langsung Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wisaya orientasi awal (TTY, penyusunan kerangka lengkap): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Pengujian singkat orientasi awal/kanal/agen tarball npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw terkemas secara global di Docker, mengonfigurasi OpenAI melalui orientasi awal referensi env beserta Telegram secara bawaan, menjalankan doctor, lalu menjalankan satu giliran agen OpenAI tiruan. Gunakan kembali tarball yang telah dibangun dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build ulang host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti kanal dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` atau `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke perjalanan pengguna rilis: `pnpm test:docker:release-user-journey` menginstal tarball OpenClaw yang telah dikemas secara global di direktori home Docker yang bersih, menjalankan orientasi awal, mengonfigurasi penyedia OpenAI tiruan, menjalankan satu giliran agen, menginstal/menghapus instalasi plugin eksternal, mengonfigurasi ClickClack terhadap fixture lokal, memverifikasi perpesanan keluar/masuk, memulai ulang Gateway, dan menjalankan doctor.
- Smoke orientasi awal bertipe untuk rilis: `pnpm test:docker:release-typed-onboarding` menginstal tarball yang telah dikemas, menjalankan `openclaw onboard` melalui TTY nyata, mengonfigurasi OpenAI sebagai penyedia referensi variabel lingkungan, memverifikasi bahwa kunci mentah tidak disimpan, dan menjalankan satu giliran agen tiruan.
- Smoke media/memori rilis: `pnpm test:docker:release-media-memory` menginstal tarball yang telah dikemas, memverifikasi pemahaman gambar dari lampiran PNG, keluaran pembuatan gambar yang kompatibel dengan OpenAI, pemanggilan kembali melalui pencarian memori, serta kemampuan pemanggilan kembali untuk bertahan setelah Gateway dimulai ulang.
- Smoke perjalanan pengguna peningkatan versi rilis: `pnpm test:docker:release-upgrade-user-journey` secara default menginstal baseline terbitan terbaru yang lebih lama daripada tarball kandidat, mengonfigurasi status penyedia/plugin/ClickClack pada paket yang diterbitkan, meningkatkan versi ke tarball kandidat, lalu menjalankan kembali perjalanan inti agen/plugin/saluran. Jika tidak ada baseline terbitan yang lebih lama, pengujian ini menggunakan kembali versi kandidat. Ganti baseline dengan `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke marketplace plugin rilis: `pnpm test:docker:release-plugin-marketplace` menginstal dari marketplace fixture lokal, memperbarui plugin yang terinstal, menghapus instalasinya, dan memverifikasi bahwa CLI plugin menghilang serta metadata instalasinya dipangkas.
- Smoke instalasi Skill: `pnpm test:docker:skill-install` menginstal tarball OpenClaw yang telah dikemas secara global di Docker, menonaktifkan instalasi arsip yang diunggah dalam konfigurasi, menemukan slug skill ClawHub aktif saat ini melalui pencarian, menginstalnya dengan `openclaw skills install`, dan memverifikasi skill yang terinstal beserta metadata asal/penguncian `.clawhub`.
- Smoke peralihan saluran pembaruan: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang telah dikemas secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi saluran tersimpan dan pekerjaan plugin setelah pembaruan, lalu kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke ketahanan peningkatan versi: `pnpm test:docker:upgrade-survivor` menginstal tarball OpenClaw yang telah dikemas di atas fixture pengguna lama yang tidak bersih, berisi agen, konfigurasi saluran, daftar izin plugin, status dependensi plugin usang, serta berkas ruang kerja/sesi yang sudah ada. Pengujian ini menjalankan pembaruan paket dan doctor noninteraktif tanpa kunci penyedia atau saluran aktif, lalu memulai Gateway local loopback dan memeriksa preservasi konfigurasi/status serta batas waktu mulai/status.
- Smoke ketahanan peningkatan versi terbitan: `pnpm test:docker:published-upgrade-survivor` secara default menginstal `openclaw@latest`, mengisi berkas pengguna yang sudah ada secara realistis, mengonfigurasi baseline tersebut dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi terbitan tersebut ke tarball kandidat, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway local loopback dan memeriksa maksud yang dikonfigurasi, preservasi status, proses mulai, `/healthz`, `/readyz`, serta batas waktu status RPC. Ganti satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta penjadwal agregat memperluas baseline lokal tertentu dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; kumpulan isu yang dilaporkan mencakup `configured-plugin-installs` untuk perbaikan otomatis instalasi plugin OpenClaw eksternal. Penerimaan Paket mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`, menguraikan token baseline meta seperti `last-stable-4` atau `all-since-2026.4.23`, dan Validasi Rilis Lengkap memperluas gerbang paket pengujian ketahanan rilis menjadi `last-stable-4 2026.4.23 2026.5.2 2026.4.15` beserta `reported-issues`.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi serta perbaikan doctor untuk cabang penulisan ulang prompt terdampak yang terduplikasi.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas pohon saat ini, menginstalnya dengan `bun install -g` di direktori home terisolasi, dan memverifikasi bahwa `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih macet. Gunakan kembali tarball yang telah dibuat sebelumnya dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang telah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker penginstal: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di antara kontainer root, pembaruan, dan npm langsung. Smoke pembaruan secara default menggunakan npm `latest` sebagai baseline stabil sebelum meningkatkan versi ke tarball kandidat. Ganti secara lokal dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, atau melalui input `update_baseline_version` milik alur kerja Install Smoke di GitHub. Pemeriksaan penginstal non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menyamarkan perilaku instalasi lokal pengguna. Tetapkan `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/pembaruan/npm langsung pada pengujian ulang lokal.
- CI Install Smoke melewati pembaruan global npm langsung yang duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa variabel lingkungan tersebut saat cakupan langsung `npm install -g` diperlukan.
- Smoke CLI penghapusan ruang kerja bersama oleh agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) secara default membuat image Dockerfile root, mengisi dua agen dengan satu ruang kerja dalam direktori home kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON yang valid serta perilaku ruang kerja yang dipertahankan. Gunakan kembali image smoke instalasi dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway dan siklus hidup host: `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`) mempertahankan smoke autentikasi/kesehatan WebSocket LAN dua kontainer, lalu menggunakan HTTP Admin local loopback untuk membuktikan pembatasan persiapan, akses kontrol yang dipertahankan, pemulihan setelah melanjutkan, serta penghentian/pemulaian dalam kontainer yang sama dan telah dipersiapkan. Pemeriksaan mulai ulang harus selesai sebelum masa sewa awal berakhir, memverifikasi bahwa status penangguhan bersifat lokal bagi proses sementara konfigurasi Gateway tersimpan dan identitas kontainer tetap bertahan, serta menghasilkan JSON waktu fase yang dapat dibaca mesin.
- Smoke snapshot CDP peramban: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membuat image E2E sumber beserta lapisan Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi bahwa snapshot peran CDP mencakup URL tautan, elemen yang dapat diklik dan dipromosikan oleh kursor, referensi iframe, serta metadata frame.
- Regresi penalaran minimal `web_search` OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi bahwa `web_search` menaikkan `reasoning.effort` dari `minimal` menjadi `low`, lalu memaksa penolakan skema penyedia dan memeriksa bahwa detail mentah muncul dalam log Gateway.
- Jembatan saluran MCP (Gateway yang telah diisi + jembatan stdio + smoke frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Alat MCP bundel OpenClaw (server MCP stdio nyata + smoke izin/tolak profil OpenClaw tertanam): `pnpm test:docker:agent-bundle-mcp-tools` (skrip: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + penghentian proses anak MCP stdio setelah eksekusi cron terisolasi dan subagen sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke instalasi/pembaruan untuk jalur lokal, `file:`, registri npm dengan dependensi yang diangkat, metadata paket npm yang rusak, ref git yang berpindah, paket lengkap ClawHub, pembaruan marketplace, serta pengaktifan/pemeriksaan bundel Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Tetapkan `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau ganti pasangan paket/runtime paket lengkap default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal yang hermetis.
- Smoke pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks siklus hidup Plugin: `pnpm test:docker:plugin-lifecycle-matrix` menginstal tarball OpenClaw yang telah dikemas dalam kontainer kosong, menginstal plugin npm, mengaktifkan/menonaktifkannya, meningkatkan dan menurunkan versinya melalui registri npm lokal, menghapus kode yang terinstal, lalu memverifikasi bahwa penghapusan instalasi tetap menghapus status usang sambil mencatat metrik RSS/CPU untuk setiap fase siklus hidup.
- Smoke metadata pemuatan ulang konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke instalasi/pembaruan untuk jalur lokal, `file:`, registri npm dengan dependensi yang diangkat, ref git yang berpindah, fixture ClawHub, pembaruan marketplace, serta pengaktifan/pemeriksaan bundel Claude. `pnpm test:docker:plugin-update` mencakup perilaku pembaruan tanpa perubahan untuk plugin yang terinstal. `pnpm test:docker:plugin-lifecycle-matrix` mencakup instalasi, pengaktifan, penonaktifan, peningkatan versi, penurunan versi, dan penghapusan instalasi saat kode hilang untuk plugin npm dengan pelacakan sumber daya.

Untuk membuat terlebih dahulu dan menggunakan kembali image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Penggantian image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap diprioritaskan jika ditetapkan. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip akan menariknya jika belum tersedia secara lokal. Pengujian Docker QR dan penginstal tetap menggunakan Dockerfile masing-masing karena keduanya memvalidasi perilaku paket/instalasi, bukan runtime aplikasi hasil build bersama.

Runner Docker model aktif juga memasang checkout saat ini sebagai volume hanya-baca
dan menyalinnya ke direktori kerja sementara di dalam kontainer. Hal ini menjaga
image runtime tetap ramping sekaligus tetap menjalankan Vitest terhadap
sumber/konfigurasi lokal Anda secara persis. Langkah penyalinan melewati cache besar
yang hanya digunakan secara lokal dan keluaran build aplikasi seperti `.pnpm-store`,
`.worktrees`, `__openclaw_vitest__`, serta direktori keluaran `.build` atau Gradle
lokal aplikasi agar eksekusi aktif Docker tidak menghabiskan waktu beberapa menit
untuk menyalin artefak khusus mesin. Runner juga menetapkan
`OPENCLAW_SKIP_CHANNELS=1` agar pemeriksaan aktif Gateway tidak memulai worker
saluran Telegram/Discord/dan sebagainya yang nyata di dalam kontainer.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan
aktif Gateway dari jalur Docker tersebut.

`test:docker:openwebui` adalah pengujian kompatibilitas tingkat tinggi: pengujian ini memulai
kontainer Gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai kontainer Open WebUI dengan versi yang dipatok agar terhubung ke Gateway tersebut, masuk melalui
Open WebUI, memverifikasi bahwa `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan percakapan nyata melalui proksi `/api/chat/completions` milik Open WebUI. Atur
`OPENWEBUI_SMOKE_MODE=models` untuk pemeriksaan CI jalur rilis yang harus berhenti
setelah proses masuk Open WebUI dan penemuan model, tanpa menunggu penyelesaian
model langsung. Proses pertama dapat terasa lebih lambat karena Docker mungkin perlu
menarik citra Open WebUI dan Open WebUI mungkin perlu menyelesaikan penyiapan
awal dinginnya sendiri. Jalur ini memerlukan kunci model langsung yang dapat digunakan, yang disediakan melalui
lingkungan proses, profil autentikasi yang telah disiapkan, atau
`OPENCLAW_PROFILE_FILE` eksplisit. Proses yang berhasil mencetak payload JSON kecil seperti
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` sengaja dibuat deterministik dan tidak memerlukan
akun Telegram, Discord, atau iMessage nyata. Pengujian ini menjalankan kontainer Gateway
yang telah diberi data awal, memulai kontainer kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata
lampiran, perilaku antrean peristiwa langsung, perutean pengiriman keluar, serta notifikasi
kanal + izin bergaya Claude melalui jembatan MCP stdio yang sebenarnya. Pemeriksaan
notifikasi memeriksa frame MCP stdio mentah secara langsung sehingga pengujian
memvalidasi apa yang benar-benar dipancarkan oleh jembatan, bukan hanya apa yang kebetulan
diekspos oleh SDK klien tertentu.

`test:docker:agent-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan
kunci model langsung. Pengujian ini membangun citra Docker repo, memulai server probe MCP stdio
nyata di dalam kontainer, mewujudkan server tersebut melalui runtime MCP bundel
OpenClaw tertanam, mengeksekusi alat, lalu memverifikasi bahwa
`coding` dan `messaging` mempertahankan alat `bundle-mcp`, sedangkan `minimal` dan
`tools.deny: ["bundle-mcp"]` memfilternya.

`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan kunci
model langsung. Pengujian ini memulai Gateway yang telah diberi data awal dengan server probe MCP stdio nyata,
menjalankan giliran cron terisolasi dan giliran turunan sekali jalan `sessions_spawn`, lalu
memverifikasi bahwa proses turunan MCP berhenti setelah setiap proses.

Pengujian alur percakapan bahasa alami ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi perutean utas ACP, jadi jangan hapus.

Variabel lingkungan yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (bawaan: `~/.openclaw`) dipasang ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (bawaan: `~/.openclaw/workspace`) dipasang ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` dipasang dan dimuat sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya variabel lingkungan yang dimuat dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori konfigurasi/ruang kerja sementara dan tanpa pemasangan autentikasi CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (bawaan: `~/.cache/openclaw/docker-cli-tools`, kecuali proses sudah menggunakan direktori bind CI/terkelola) dipasang ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/berkas autentikasi CLI eksternal di bawah `$HOME` dipasang hanya-baca di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori bawaan (digunakan ketika proses tidak dibatasi pada penyedia tertentu): `.factory`, `.gemini`, `.minimax`
  - Berkas bawaan: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Proses yang dibatasi berdasarkan penyedia hanya memasang direktori/berkas yang diperlukan sebagaimana disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar yang dipisahkan koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk membatasi proses
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter penyedia di dalam kontainer
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan kembali citra `openclaw:local-live` yang sudah ada bagi proses ulang yang tidak memerlukan pembangunan ulang
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan variabel lingkungan)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh Gateway bagi pengujian Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh pengujian Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag citra Open WebUI yang dipatok

## Pemeriksaan kewajaran dokumentasi

Jalankan pemeriksaan dokumentasi setelah mengedit dokumen: `pnpm check:docs`.
Jalankan validasi anchor Mintlify lengkap ketika Anda juga memerlukan pemeriksaan judul dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi luring (aman untuk CI)

Berikut adalah regresi "pipeline nyata" tanpa penyedia nyata:

- Pemanggilan alat Gateway (OpenAI tiruan, Gateway nyata + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wisaya Gateway (WS `wizard.start`/`wizard.next`, menulis konfigurasi + autentikasi diberlakukan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agen (Skills)

Kami sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti "evaluasi keandalan agen":

- Pemanggilan alat tiruan melalui Gateway dan loop agen nyata (`src/gateway/gateway.test.ts`).
- Alur wisaya menyeluruh yang memvalidasi pengkabelan sesi dan efek konfigurasi (`src/gateway/gateway.test.ts`).

Yang masih belum tersedia untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** ketika Skills dicantumkan dalam prompt, apakah agen memilih Skills yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multigiliran yang menegaskan urutan alat, keberlanjutan riwayat sesi, dan batas sandbox.

Evaluasi mendatang harus tetap mengutamakan sifat deterministik:

- Pelaksana skenario yang menggunakan penyedia tiruan untuk menegaskan pemanggilan alat + urutannya, pembacaan berkas Skills, dan pengkabelan sesi.
- Rangkaian kecil skenario yang berfokus pada Skills (gunakan vs hindari, pembatasan, injeksi prompt).
- Evaluasi langsung opsional (keikutsertaan eksplisit, dibatasi oleh variabel lingkungan) hanya setelah rangkaian aman untuk CI tersedia.

## Pengujian kontrak (bentuk Plugin dan kanal)

Pengujian kontrak memverifikasi bahwa setiap Plugin dan kanal yang terdaftar mematuhi
kontrak antarmukanya. Pengujian ini mengiterasi semua Plugin yang ditemukan dan menjalankan
rangkaian penegasan bentuk dan perilaku. Jalur unit `pnpm test` bawaan
sengaja melewati berkas sambungan bersama dan pengujian ini; jalankan perintah
kontrak secara eksplisit ketika Anda menyentuh permukaan kanal atau penyedia bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak kanal: `pnpm test:contracts:channels`
- Hanya kontrak penyedia: `pnpm test:contracts:plugins`

### Kontrak kanal

Berada di `src/channels/plugins/contracts/*.contract.test.ts`. Kategori
tingkat atas saat ini:

- **katalog-kanal** - metadata entri katalog kanal bawaan/registri
- **Plugin** (didukung registri, dibagi menjadi shard) - bentuk dasar pendaftaran Plugin
- **hanya-permukaan** (didukung registri, dibagi menjadi shard) - pemeriksaan bentuk per permukaan untuk `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory`, dan `gateway`
- **pengikatan-sesi** (didukung registri) - perilaku pengikatan sesi
- **payload-keluar** - struktur dan normalisasi payload pesan
- **kebijakan-grup** (fallback) - pemberlakuan kebijakan grup bawaan per kanal
- **pengutasan** (didukung registri, dibagi menjadi shard) - penanganan id utas
- **direktori** (didukung registri, dibagi menjadi shard) - API direktori/daftar anggota
- **registri** dan **plugins-core.\*** - registri Plugin kanal, pemuat, dan internal otorisasi penulisan konfigurasi

Pembantu harness penangkapan-dispatch masuk dan payload-keluar yang digunakan oleh rangkaian ini
diekspos secara internal melalui `src/plugin-sdk/channel-contract-testing.ts`
(dikecualikan dari npm, bukan subjalur SDK publik); tidak ada berkas mandiri
`inbound.contract.test.ts` di direktori ini.

### Kontrak penyedia

Berada di `src/plugins/contracts/*.contract.test.ts`. Kategori saat ini
mencakup:

- **bentuk** - bentuk manifes Plugin, API, dan ekspor runtime
- **pendaftaran-Plugin** (+ paralel) - kasus pendaftaran manifes
- **manifes-paket** - persyaratan manifes paket
- **pemuat** - perilaku penyiapan/pembongkaran pemuat Plugin
- **registri** - isi dan pencarian registri kontrak Plugin
- **penyedia** - perilaku penyedia bersama di seluruh penyedia bawaan, serta penyedia pencarian web
- **pilihan-autentikasi** - metadata pilihan autentikasi dan perilaku penyiapan
- **penghentian-katalog-penyedia** - metadata katalog penyedia yang tidak digunakan lagi
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - kontrak wisaya penyiapan penyedia
- **penyedia-embedding**, **penyedia-embedding-memori**, **penyedia-pengambilan-web**, **tts** - kontrak penyedia khusus kapabilitas
- **tindakan-sesi**, **lampiran-sesi**, **proyeksi-entri-sesi** - kontrak status sesi milik Plugin
- **giliran-terjadwal** - metadata giliran terjadwal Plugin dan batas stempel waktu
- **hook-host**, **siklus-hidup-konteks-proses**, **efek-samping-impor-runtime**, **sambungan-runtime** - kontrak siklus hidup host/runtime Plugin dan batas impor
- **dependensi-runtime-ekstensi** - penempatan dependensi runtime untuk ekstensi

### Kapan dijalankan

- Setelah mengubah ekspor atau subjalur plugin-sdk
- Setelah menambahkan atau memodifikasi Plugin kanal atau penyedia
- Setelah merefaktor pendaftaran atau penemuan Plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan kunci API nyata.

## Menambahkan regresi (panduan)

Ketika Anda memperbaiki masalah penyedia/model yang ditemukan secara langsung:

- Tambahkan regresi yang aman untuk CI jika memungkinkan (penyedia tiruan/stub, atau tangkap transformasi bentuk permintaan yang tepat)
- Jika masalahnya secara inheren hanya terjadi langsung (batas laju, kebijakan autentikasi), pertahankan pengujian langsung agar sempit dan bersifat keikutsertaan eksplisit melalui variabel lingkungan
- Utamakan penargetan lapisan terkecil yang menangkap bug:
  - bug konversi/pemutaran ulang permintaan penyedia -> pengujian model langsung
  - bug sesi/riwayat/pipeline alat Gateway -> pengujian Gateway langsung atau pengujian tiruan Gateway yang aman untuk CI
- Batas pengaman penelusuran SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` memperoleh satu target sampel per kelas SecretRef dari metadata registri (`listSecretTargetRegistryEntries()`), lalu menegaskan bahwa id eksekusi segmen penelusuran ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian tersebut. Pengujian sengaja gagal pada id target yang tidak diklasifikasikan agar kelas baru tidak dapat dilewati secara diam-diam.

## Terkait

- [Pengujian langsung](/id/help/testing-live)
- [Pengujian pembaruan dan Plugin](/id/help/testing-updates-plugins)
- [CI](/id/ci)
