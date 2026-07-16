---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-07-16T18:36:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- Perangkat pengujian lengkap (rangkaian, live, Docker): [Pengujian](/id/help/testing)
- Validasi pembaruan dan paket plugin: [Menguji pembaruan dan plugin](/id/help/testing-updates-plugins)

## Default agen

Sesi agen menjalankan satu/beberapa pengujian terfokus dan pemeriksaan statis ringan secara lokal hanya
untuk sumber tepercaya dan ketika instalasi dependensi yang ada sudah siap. Jangan pernah
menjalankan alat repositori yang tidak tepercaya secara lokal. Rangkaian yang lebih besar, gate perubahan dengan
fan-out pemeriksaan tipe/lint, build, Docker, lane paket, E2E, pembuktian live, dan
validasi lintas platform dijalankan dari jarak jauh melalui Crabbox. Pembuktian berat oleh pengelola
tepercaya secara default menggunakan Blacksmith Testbox. Alur kerja Testbox yang dikonfigurasi
memuat kredensial, sehingga kode kontributor atau fork yang tidak tepercaya harus menggunakan
CI fork tanpa rahasia atau AWS Crabbox langsung yang disanitasi sebagai gantinya.

Jangan melakukan pemanasan awal untuk pekerjaan yang diperkirakan. Dapatkan backend secara lazy ketika
perintah berat pertama siap, gunakan kembali id `tbx_...` yang dikembalikan untuk perintah berat
berikutnya, sinkronkan checkout saat ini pada setiap proses, dan hentikan sebelum serah terima.

Setelah penggunaan kembali pertama berhasil, wrapper mencatat basis lease,
dependensi, dan sidik jari alur kerja Testbox di bawah `.crabbox/testbox-leases/`.
Perubahan yang hanya menyentuh sumber tetap menggunakan kembali box yang sudah dipanaskan. Perubahan pada basis merge, lockfile,
input pengelola paket, wrapper, atau alur kerja Testbox akan gagal secara tertutup dan memerlukan
lease baru. Setiap proses tetap menyinkronkan checkout saat ini.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` hanya untuk diagnostik yang disengaja, bukan
pembuktian rilis.

Perintah pengujian lokal di bawah ini ditujukan untuk alur kerja manusia dan pembuktian agen yang terbatas.
Ketidaktersediaan penyedia jarak jauh harus dilaporkan; hal tersebut bukan izin untuk
menjalankan gate lokal yang luas secara diam-diam.

Untuk pembuktian berat yang tidak tepercaya, lakukan pemanasan secara lazy dengan `--provider aws`. Setiap proses harus menetapkan
`CRABBOX_ENV_ALLOW=CI`, meneruskan `--provider aws --no-hydrate`, dan menggunakan
`HOME` jarak jauh sementara yang baru sebelum menginstal dependensi atau menjalankan
pengujian. Gunakan lease yang baru dipanaskan dan dikhususkan untuk sumber tidak tepercaya tersebut; jangan pernah menggunakan kembali
lease tepercaya atau lease yang sebelumnya telah memuat kredensial. Jalankan biner Crabbox tepercaya yang terinstal
dari checkout `main` tepercaya yang bersih dan ambil hanya PR jarak jauh dengan
`--fresh-pr`; jangan pernah menjalankan wrapper atau konfigurasi dari checkout tidak tepercaya secara lokal.
Hapus penetapan `CRABBOX_AWS_INSTANCE_PROFILE` dan gagal secara tertutup kecuali
`aws.instanceProfile` yang dihasilkan kosong. Sebelum instalasi/pengujian apa pun, gunakan
alat jalur absolut tepercaya untuk mewajibkan token IMDSv2, membuktikan bahwa endpoint kredensial IAM
mengembalikan 404, dan memverifikasi `git rev-parse HEAD` jarak jauh sama dengan SHA lengkap
head PR yang telah ditinjau. Ikat lease ke SHA tersebut dan hentikan/panaskan ulang ketika head
berubah. Unggah `scripts/crabbox-untrusted-bootstrap.sh` tepercaya dari
`main` yang bersih bersama `--fresh-pr`; skrip tersebut menginstal Node/pnpm yang disematkan, memverifikasi SHA
dan penyematan pengelola paket, mengisolasi `HOME`, menginstal dependensi, lalu menjalankan
pengujian yang diminta. Jika broker tidak dapat membuktikan tidak adanya peran atau tidak ada PR jarak jauh,
gunakan CI fork tanpa rahasia. Jangan gunakan `hydrate-github`, `--no-sync`, atau
alur kerja Testbox yang telah memuat kredensial.
Hapus semua penggantian `CRABBOX_TAILSCALE*`, paksa `--network public
--tailscale=false`, hapus flag exit-node/LAN, dan wajibkan `crabbox inspect` untuk
melaporkan jaringan publik tanpa status Tailscale sebelum mengunggah skrip apa pun.

## Urutan lokal rutin

1. `pnpm test:changed` untuk pembuktian Vitest dengan cakupan perubahan.
2. `pnpm test <path-or-filter>` untuk satu file, direktori, atau target eksplisit.
3. `pnpm test` hanya ketika Anda sengaja memerlukan rangkaian Vitest lokal lengkap.

Dalam worktree Codex atau checkout tertaut/sparse, agen menghindari penggunaan lokal langsung
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Pembuktian terfokus terbatas dengan dependensi yang siap:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Pemeriksaan perubahan dengan klasifikasi terlebih dahulu: `node scripts/check-changed.mjs`; rencana khusus dokumentasi,
  tanpa perubahan, dan metadata kecil tetap dijalankan secara lokal ketika dependensi siap,
  sedangkan rencana berat atau yang dependensinya tidak tersedia didelegasikan ke Testbox.
- Pembuktian luas eksplisit dengan lease yang dipertahankan: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` agar pnpm berjalan di dalam Testbox.
- `exitCode` akhir dari wrapper dan JSON pengaturan waktu merupakan hasil perintah. Proses GitHub Actions Blacksmith yang didelegasikan dapat menampilkan `cancelled` setelah perintah SSH berhasil karena Testbox dihentikan dari luar tindakan keepalive; periksa ringkasan wrapper dan keluaran perintah sebelum menganggapnya sebagai kegagalan.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mempertahankan serialisasi pemeriksaan berat di dalam worktree saat ini, bukan di direktori bersama Git, untuk perintah seperti `pnpm check:changed` dan `pnpm test ...` yang ditargetkan. Gunakan hanya pada host lokal berkapasitas tinggi ketika Anda sengaja menjalankan pemeriksaan independen di beberapa worktree tertaut.

## Perintah inti

Proses wrapper pengujian diakhiri dengan ringkasan singkat `[test] passed|failed|skipped ... in ...`; baris durasi Vitest sendiri tetap menjadi detail per shard.

| Perintah                                           | Fungsinya                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Target file/direktori eksplisit dirutekan melalui lane Vitest dengan cakupan terbatas. Proses tanpa target merupakan pembuktian rangkaian lengkap: grup shard tetap diperluas menjadi konfigurasi leaf untuk eksekusi paralel lokal, dengan fan-out shard yang diharapkan dicetak sebelum dimulai. Grup ekstensi selalu diperluas menjadi konfigurasi shard per ekstensi, bukan satu proses proyek root yang sangat besar.           |
| `pnpm test:changed`                               | Proses pengujian perubahan cerdas yang ringan: target presisi dari pengeditan pengujian langsung, file `*.test.ts` saudara, pemetaan sumber eksplisit, dan graf impor lokal. Perubahan luas/konfigurasi/paket dilewati kecuali dipetakan ke pengujian yang presisi.                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Proses pengujian perubahan luas eksplisit; gunakan ketika pengeditan harness/konfigurasi/paket pengujian harus kembali ke perilaku pengujian perubahan Vitest yang lebih luas.                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | Membebaskan port Gateway OpenClaw yang dikonfigurasi (default `18789`), lalu menjalankan rangkaian lengkap dengan port Gateway terisolasi agar pengujian server tidak bertabrakan dengan instans yang sedang berjalan.                                                                                                                                                                                    |
| `pnpm test:coverage`                              | Menghasilkan laporan cakupan V8 informasional untuk lane unit default (`vitest.unit.config.ts`); tidak ada ambang cakupan yang diberlakukan.                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | Cakupan unit hanya untuk file yang berubah sejak `origin/main`.                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | Menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | Mengklasifikasikan lane yang berubah sebelum memilih eksekusi. Rencana khusus dokumentasi, tanpa perubahan, dan metadata kecil tetap dijalankan secara lokal ketika dependensi siap; rencana dengan fan-out pemeriksaan tipe/lint, lane berat lainnya, atau dependensi lokal yang tidak tersedia didelegasikan ke Crabbox/Testbox di luar CI. Tidak menjalankan Vitest; gunakan `pnpm test:changed` atau `pnpm test <target>` untuk pembuktian pengujian. |

## Status pengujian bersama dan pembantu proses

- `src/test-utils/openclaw-test-state.ts`: gunakan dari Vitest ketika pengujian memerlukan `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfigurasi, ruang kerja, direktori agen, atau penyimpanan profil autentikasi yang terisolasi.
- `pnpm test:env-mutations:report`: laporan non-blocking tentang pengujian/harness yang mengubah `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR`, atau kunci lingkungan terkait secara langsung. Gunakan untuk menemukan kandidat migrasi bagi pembantu status pengujian bersama.
- `test/helpers/openclaw-test-instance.ts`: pengujian E2E tingkat proses yang memerlukan Gateway yang berjalan, lingkungan CLI, pengambilan log, dan pembersihan di satu tempat.
- Lane E2E Docker/Bash yang memuat `scripts/lib/docker-e2e-image.sh` dapat meneruskan `docker_e2e_test_state_shell_b64 <label> <scenario>` ke dalam kontainer dan mendekodenya dengan `scripts/lib/openclaw-e2e-instance.sh`; skrip multi-home dapat meneruskan `docker_e2e_test_state_function_b64` dan memanggil `openclaw_test_state_create <label> <scenario>` dalam setiap alur. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` menulis file lingkungan host yang dapat dimuat (tanda `--` sebelum `create` mencegah runtime Node yang lebih baru memperlakukan `--env-file` sebagai flag Node). Lane yang menjalankan Gateway dapat memuat `scripts/lib/openclaw-e2e-instance.sh` untuk resolusi entrypoint, startup OpenAI tiruan, peluncuran latar depan/latar belakang, probe kesiapan, ekspor lingkungan status, dump log, dan pembersihan proses.

## Lane Control UI, TUI, dan ekstensi

- **E2E tiruan Control UI:** `pnpm test:ui:e2e` menjalankan jalur Vitest + Playwright yang memulai Vite Control UI dan mengoperasikan halaman Chromium nyata terhadap WebSocket Gateway tiruan. Pengujian berada di `ui/src/**/*.e2e.test.ts`; tiruan/kontrol bersama berada di `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` mencakup jalur ini. Eksekusi agen secara default menggunakan Testbox/Crabbox, termasuk pembuktian tertarget; gunakan `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` hanya sebagai fallback lokal yang eksplisit.
- **Pengujian PTY TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` menjalankan jalur PTY backend palsu yang cepat. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` atau `pnpm tui:pty:test:watch --mode local` menjalankan smoke `tui --local` yang lebih lambat, yang hanya meniru endpoint model eksternal. Tegaskan teks terlihat yang stabil atau pemanggilan fixture, bukan snapshot ANSI mentah.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard ekstensi/plugin. Plugin saluran berat, plugin browser, dan OpenAI dijalankan sebagai shard khusus; grup plugin lainnya tetap dikelompokkan. `pnpm test extensions/<id>` menjalankan satu jalur plugin bawaan.
- Berkas sumber dengan pengujian sejawat dipetakan ke pengujian sejawat tersebut sebelum beralih ke glob direktori yang lebih luas. Perubahan helper di bawah `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, dan `src/plugins/contracts` menggunakan graf impor lokal untuk menjalankan pengujian yang mengimpornya alih-alih menjalankan setiap shard secara luas ketika jalur dependensinya presisi.
- Target direktori kontrak disebarkan ke jalur kontraknya: `pnpm test src/channels/plugins/contracts` menjalankan empat konfigurasi kontrak saluran dan `pnpm test src/plugins/contracts` menjalankan konfigurasi kontrak plugin, karena proyek generik `channels`/`plugins` mengecualikan `contracts/**`.
- `auto-reply` dibagi menjadi tiga konfigurasi khusus (`core`, `top-level`, `reply`) agar harness balasan tidak mendominasi pengujian status/token/helper tingkat atas yang lebih ringan.
- Berkas pengujian `plugin-sdk` dan `commands` yang dipilih dirutekan melalui jalur ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus yang berat bagi runtime tetap berada di jalur yang sudah ada.
- Konfigurasi dasar Vitest secara default menggunakan `pool: "threads"` dan `isolate: false`, dengan runner bersama yang tidak terisolasi diaktifkan di seluruh konfigurasi repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.

## Gateway dan E2E

- Integrasi Gateway bersifat opsional: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: agregat E2E repo = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: pengujian smoke Gateway menyeluruh (pemasangan WS/HTTP/node multi-instans). Secara default menggunakan `threads` + `isolate: false` dengan worker adaptif dalam `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>`, log terperinci dengan `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: pengujian langsung penyedia (Claude/Minimax/DeepSeek/z.ai/dll., dibatasi oleh `*.live.test.ts`). Memerlukan kunci API dan `LIVE=1` (atau `OPENCLAW_LIVE_TEST=1`) agar tidak dilewati; keluaran terperinci dengan `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suite Docker lengkap (`pnpm test:docker:all`)

Membangun image pengujian langsung bersama, mengemas OpenClaw sekali sebagai tarball npm, membangun/menggunakan kembali image runner Node/Git dasar serta image fungsional yang menginstal tarball tersebut ke dalam `/app`, lalu menjalankan jalur smoke Docker melalui penjadwal berbobot. `scripts/package-openclaw-for-docker.mjs` adalah satu-satunya pengemas paket lokal/CI dan memvalidasi tarball serta `dist/postinstall-inventory.json` sebelum digunakan oleh Docker.

- Image dasar (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): jalur penginstal/pembaruan/dependensi plugin; memasang tarball yang telah dibuat sebelumnya alih-alih sumber repo yang disalin.
- Image fungsional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): jalur fungsionalitas aplikasi yang telah dibangun secara normal.
- Definisi jalur: `scripts/lib/docker-e2e-scenarios.mjs`. Perencana: `scripts/lib/docker-e2e-plan.mjs`. Pelaksana: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` menghasilkan rencana CI milik penjadwal (jalur, jenis image, kebutuhan paket/image langsung, skenario status, pemeriksaan kredensial) tanpa membangun atau menjalankan Docker.

Pengaturan penjadwalan (variabel lingkungan, nilai default dalam tanda kurung):

| Variabel lingkungan                                                                                             | Default             | Tujuan                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Slot proses.                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Kumpulan ekor yang sensitif terhadap penyedia.                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Batas jalur penyedia langsung yang berat.                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Batas jalur sumber daya npm.                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Batas jalur sumber daya layanan.                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Batas jalur berat per penyedia.                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Batas per penyedia yang lebih sempit.                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Penimpaan untuk host yang lebih besar.                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Penundaan antarpermulaan jalur untuk menghindari lonjakan pembuatan pada daemon Docker lokal.                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Batas waktu fallback per jalur; jalur langsung/ekor tertentu menggunakan batas yang lebih ketat.                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Percobaan ulang untuk kegagalan sementara penyedia langsung.                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Cetak manifes jalur tanpa menjalankan Docker.                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Interval pencetakan status jalur aktif.                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | Gunakan kembali `.artifacts/docker-tests/lane-timings.json` untuk pengurutan dari yang terlama; atur ke `0` untuk menonaktifkannya.                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` hanya untuk jalur deterministik/lokal, `only` hanya untuk jalur penyedia langsung. Alias: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Mode hanya-langsung menggabungkan jalur langsung utama dan ekor menjadi satu kumpulan dari yang terlama agar bucket penyedia mengemas pekerjaan Claude/Codex/Gemini bersama-sama. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Batas waktu penyiapan Docker backend CLI.                                                                                                                                                                                                                                                  |

Pola variabel lingkungan untuk batas sumber daya adalah `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nama sumber daya diubah menjadi huruf besar, karakter nonalfanumerik diringkas menjadi `_`).

Perilaku lainnya: runner melakukan preflight Docker secara default, membersihkan container E2E OpenClaw yang usang, berbagi cache alat CLI penyedia di antara lane yang kompatibel, dan berhenti menjadwalkan lane pool baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ditetapkan. Jika satu lane melampaui batas bobot/sumber daya efektif pada host dengan paralelisme rendah, lane tersebut tetap dapat dimulai dari pool kosong dan berjalan sendiri hingga kapasitas dilepaskan. Log per lane, `summary.json`, `failures.json`, dan waktu setiap fase ditulis di bawah `.artifacts/docker-tests/<run-id>/`; gunakan `pnpm test:docker:timings <summary.json>` untuk memeriksa lane yang lambat dan `pnpm test:docker:rerun <run-id|summary.json|failures.json>` untuk mencetak perintah pengulangan proses yang murah dan terarah.

### Lane Docker penting

| Perintah                                                                    | Memverifikasi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Container E2E sumber berbasis Chromium dengan CDP mentah + Gateway terisolasi; snapshot peran CDP `browser doctor --deep` mencakup URL tautan, elemen yang dapat diklik yang dipromosikan oleh kursor, referensi iframe, dan metadata frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `pnpm test:docker:skill-install`                                            | Menginstal tarball yang telah dikemas dalam runner Docker kosong dengan `skills.install.allowUploadedArchives: false`, mengidentifikasi slug skill terkini dari pencarian langsung ClawHub, menginstalnya melalui `openclaw skills install`, dan memverifikasi `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, serta `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Probe langsung backend CLI yang terfokus; Gemini memiliki alias `:resume` dan `:mcp` yang sesuai.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI dalam Docker: masuk, periksa `/api/models`, jalankan percakapan nyata yang diproksikan melalui `/api/chat/completions`. Memerlukan kunci model langsung yang dapat digunakan dan mengambil image eksternal; tidak diharapkan stabil di CI seperti rangkaian unit/e2e.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm test:docker:mcp-channels`                                             | Container Gateway yang telah di-seed beserta container klien yang menjalankan `openclaw mcp serve`: penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean peristiwa langsung, perutean pengiriman keluar, serta notifikasi kanal + izin bergaya Claude melalui bridge stdio nyata (assertion membaca frame MCP stdio mentah secara langsung).                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:upgrade-survivor`                                         | Menginstal tarball yang telah dikemas di atas fixture pengguna lama yang kotor, menjalankan pembaruan paket beserta doctor noninteraktif tanpa kunci penyedia/kanal langsung, memulai Gateway loopback, lalu memeriksa agar agen, konfigurasi kanal, daftar izin plugin, workspace, berkas sesi, status dependensi plugin lama yang usang, proses mulai, dan status RPC tetap bertahan.                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:published-upgrade-survivor`                               | Menginstal `openclaw@latest` secara default, mengisi berkas pengguna lama yang realistis, mengonfigurasi melalui resep `openclaw config set` bawaan, memperbarui ke tarball yang telah dikemas, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memeriksa `/healthz`, `/readyz`, dan status RPC. Ganti dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, perluas matriks dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, atau tambahkan fixture skenario dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (mencakup `configured-plugin-installs` dan `stale-source-plugin-shadow`). Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline(s)` / `_scenarios` dan mengidentifikasi token meta seperti `last-stable-4` atau `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Harness ketahanan peningkatan versi yang telah dipublikasikan dalam skenario `plugin-deps-cleanup`, dimulai dari `openclaw@2026.4.23` secara default. Alur kerja `Update Migration` memperluasnya dengan `baselines=all-since-2026.4.23` untuk membuktikan pembersihan dependensi plugin yang dikonfigurasi di luar Full Release CI.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `pnpm test:docker:plugins`                                                  | Smoke test instalasi/pembaruan untuk path lokal, `file:`, paket registry npm dengan dependensi yang di-hoist, referensi git yang berpindah, fixture ClawHub, pembaruan marketplace, serta pengaktifan/pemeriksaan bundle Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## Gate PR lokal

Untuk pemeriksaan pendaratan/gate PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` mengalami kegagalan sesekali pada host yang sibuk, jalankan ulang satu kali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Alat performa pengujian

- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + perincian impor Vitest, sambil tetap menggunakan perutean lane terbatas untuk target berkas/direktori eksplisit. `pnpm test:perf:imports:changed` membatasi pembuatan profil yang sama ke berkas yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` menguji tolok ukur path mode perubahan yang dirutekan terhadap eksekusi proyek root native untuk diff git ter-commit yang sama; `pnpm test:perf:changed:bench -- --worktree` menguji tolok ukur kumpulan perubahan worktree saat ini tanpa melakukan commit terlebih dahulu.
- `pnpm test:perf:profile:main` menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap konfigurasi leaf Vitest dari rangkaian lengkap secara serial dan menulis data durasi yang dikelompokkan beserta artefak JSON/log per konfigurasi. Laporan rangkaian lengkap mengisolasi berkas secara default agar grafik modul yang dipertahankan dan jeda GC dari berkas sebelumnya tidak dibebankan pada assertion berikutnya; teruskan `-- --no-isolate` hanya saat sengaja membuat profil akumulasi worker bersama. Test Performance Agent menggunakan ini sebagai baseline sebelum mencoba perbaikan pengujian lambat. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` membandingkan laporan yang dikelompokkan setelah perubahan yang berfokus pada performa.
- Eksekusi shard lengkap, ekstensi, dan pola penyertaan memperbarui data waktu lokal di `.artifacts/vitest-shard-timings.json`; eksekusi seluruh konfigurasi berikutnya menggunakan waktu tersebut untuk menyeimbangkan shard lambat dan cepat. Shard CI pola penyertaan menambahkan nama shard ke kunci waktu, sehingga waktu shard yang difilter tetap terlihat tanpa menggantikan data waktu seluruh konfigurasi. Tetapkan `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak waktu lokal.

## Tolok ukur

<Accordion title="Latensi model (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Prompt default: "Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan."

</Accordion>

<Accordion title="Proses mulai CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: gabungan kedua preset

Output mencakup `sampleCount`, rata-rata, p50, p95, min/maks, distribusi kode keluar/sinyal, dan RSS maksimum per perintah. `--cpu-prof-dir` / `--heap-prof-dir` menulis profil V8 untuk setiap eksekusi.

Output tersimpan: `pnpm test:startup:bench:smoke` menulis `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` menulis `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture yang disimpan di repositori: `test/fixtures/cli-startup-bench.json`, diperbarui oleh `pnpm test:startup:bench:update`, dibandingkan oleh `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Startup Gateway (scripts/bench-gateway-startup.ts)">

Secara default menggunakan entri CLI hasil build di `dist/entry.js`; jalankan `pnpm build` terlebih dahulu. Teruskan `--entry scripts/run-node.mjs` untuk mengukur runner sumber sebagai gantinya, dan pisahkan hasil tersebut dari baseline entri hasil build.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

ID kasus: `default`, `skipChannels` (startup saluran dilewati), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 Plugin manifes), `fiftyStartupLazyPlugins` (50 Plugin manifes yang dimuat secara malas saat startup).

Output mencakup output proses pertama, `/healthz`, `/readyz`, waktu log pemantauan HTTP, waktu log kesiapan Gateway, waktu CPU, rasio inti CPU, RSS maksimum, heap, metrik pelacakan startup, penundaan event loop, dan metrik detail tabel pencarian Plugin. Skrip menetapkan `OPENCLAW_GATEWAY_STARTUP_TRACE=1` di lingkungan Gateway turunan.

`/healthz` adalah keaktifan (server HTTP dapat merespons). `/readyz` adalah kesiapan penggunaan (sidecar Plugin startup, saluran, dan pekerjaan pascapemasangan yang penting bagi kesiapan telah selesai). Hook startup dijalankan secara asinkron dan tidak termasuk dalam jaminan kesiapan. Waktu log kesiapan adalah stempel waktu internal Gateway, berguna untuk atribusi sisi proses tetapi bukan pengganti probe eksternal `/readyz`.

Gunakan output JSON atau `--output` saat membandingkan perubahan. Gunakan `--cpu-prof-dir` hanya setelah output pelacakan menunjukkan pekerjaan impor, kompilasi, atau yang terikat CPU yang tidak dapat dijelaskan hanya oleh pengaturan waktu fase.

</Accordion>

<Accordion title="Mulai ulang Gateway (scripts/bench-gateway-restart.ts)">

Hanya macOS dan Linux (menggunakan SIGUSR1 untuk mulai ulang dalam proses; langsung gagal di Windows). Default entri hasil build dan penggantian `--entry scripts/run-node.mjs` sama seperti startup Gateway di atas.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

ID kasus: `skipChannels`, `skipChannelsAcpxProbe` (probe startup ACPX aktif), `skipChannelsNoAcpxProbe` (probe nonaktif), `default`, `fiftyPlugins`.

Output mencakup `/healthz` berikutnya, `/readyz` berikutnya, waktu henti, pengaturan waktu kesiapan mulai ulang, CPU, RSS, metrik pelacakan startup untuk proses pengganti, dan metrik pelacakan mulai ulang untuk penanganan sinyal, pengurasan pekerjaan aktif, fase penutupan, mulai berikutnya, pengaturan waktu kesiapan, dan snapshot memori. Skrip menetapkan `OPENCLAW_GATEWAY_STARTUP_TRACE=1` dan `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Gunakan benchmark ini saat perubahan menyentuh pensinyalan mulai ulang, handler penutupan, startup setelah mulai ulang, penghentian sidecar, serah terima layanan, atau kesiapan setelah mulai ulang. Mulai dengan `skipChannels` untuk mengisolasi mekanisme Gateway dari startup saluran; gunakan `default` atau kasus dengan banyak Plugin hanya setelah kasus sempit menjelaskan jalur mulai ulang. Metrik pelacakan merupakan petunjuk atribusi, bukan putusan — nilai perubahan mulai ulang berdasarkan beberapa sampel, rentang pemilik yang sesuai, perilaku `/healthz`/`/readyz`, dan kontrak mulai ulang yang terlihat oleh pengguna.

</Accordion>

## E2E orientasi (Docker)

Opsional; hanya diperlukan untuk uji cepat orientasi dalam kontainer. Alur startup dingin lengkap dalam kontainer Linux yang bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Menjalankan wizard interaktif melalui pseudo-tty, memverifikasi berkas konfigurasi/ruang kerja/sesi, lalu memulai Gateway dan menjalankan `openclaw health`.

## Uji cepat impor QR (Docker)

Memastikan helper runtime QR yang dipelihara dapat dimuat pada runtime Docker Node yang didukung (Node 24 sebagai default, kompatibel dengan Node 22):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian langsung](/id/help/testing-live)
- [Pengujian pembaruan dan Plugin](/id/help/testing-updates-plugins)
