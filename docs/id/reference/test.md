---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (vitest) dan kapan menggunakan mode paksa/cakupan
title: Pengujian
x-i18n:
    generated_at: "2026-07-12T14:38:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Kit pengujian lengkap (suite, langsung, Docker): [Pengujian](/id/help/testing)
- Validasi pembaruan dan paket Plugin: [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins)

## Default agen

Sesi agen menjalankan pengujian dan validasi yang intensif secara komputasi dari jarak jauh
melalui Crabbox. Kode pengelola tepercaya secara default menggunakan Blacksmith Testbox. Alur kerja
Testbox yang dikonfigurasi memuat kredensial, sehingga kode kontributor tidak tepercaya atau
kode fork harus menggunakan CI fork tanpa rahasia atau AWS Crabbox langsung yang disanitasi.

Jika tugas kode tepercaya kemungkinan memerlukan pengujian atau pembuktian berat, lakukan pemanasan awal
segera dalam sesi perintah latar belakang, lanjutkan pekerjaan selama proses pemuatan berlangsung,
gunakan kembali id `tbx_...` yang dikembalikan, sinkronkan checkout saat ini pada setiap proses, dan
hentikan sebelum serah terima:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Setelah penggunaan ulang pertama berhasil, pembungkus mencatat basis lease,
dependensi, dan sidik jari alur kerja Testbox di bawah `.crabbox/testbox-leases/`.
Pengeditan khusus sumber tetap menggunakan ulang kotak yang telah dipanaskan. Perubahan basis penggabungan, lockfile,
masukan pengelola paket, pembungkus, atau alur kerja Testbox akan ditutup saat gagal dan memerlukan
lease baru. Setiap proses tetap menyinkronkan checkout saat ini.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` hanya untuk diagnostik yang disengaja, bukan
pembuktian rilis.

Perintah pengujian lokal di bawah ditujukan untuk alur kerja manusia atau fallback agen eksplisit
yang diminta pengguna. Ketidaktersediaan penyedia jarak jauh harus dilaporkan; hal tersebut
bukan izin untuk menjalankan gate lokal yang luas secara diam-diam.

Untuk kode tidak tepercaya, lakukan pemanasan awal dengan `--provider aws`. Setiap proses harus menetapkan
`CRABBOX_ENV_ALLOW=CI`, meneruskan `--provider aws --no-hydrate`, dan menggunakan
`HOME` jarak jauh sementara yang baru sebelum memasang dependensi atau menjalankan
pengujian. Gunakan lease yang baru dipanaskan dan dikhususkan untuk sumber tidak tepercaya tersebut; jangan pernah menggunakan ulang
lease tepercaya atau yang sebelumnya telah dimuati. Jalankan biner Crabbox tepercaya yang telah terpasang
dari checkout `main` tepercaya yang bersih dan ambil hanya PR jarak jauh dengan
`--fresh-pr`; jangan pernah menjalankan pembungkus atau konfigurasi checkout tidak tepercaya secara lokal.
Hapus penetapan `CRABBOX_AWS_INSTANCE_PROFILE` dan tutup saat gagal kecuali
`aws.instanceProfile` yang dihasilkan kosong. Sebelum pemasangan/pengujian apa pun, gunakan alat
berjalur absolut yang tepercaya untuk mewajibkan token IMDSv2, membuktikan bahwa endpoint kredensial IAM
mengembalikan 404, dan memverifikasi bahwa `git rev-parse HEAD` jarak jauh sama dengan SHA lengkap
head PR yang telah ditinjau. Ikat lease ke SHA tersebut dan hentikan/panaskan ulang saat head
berubah. Unggah `scripts/crabbox-untrusted-bootstrap.sh` tepercaya dari `main` yang bersih
bersama `--fresh-pr`; skrip tersebut memasang Node/pnpm yang disematkan, memverifikasi SHA
dan penyematan pengelola paket, mengisolasi `HOME`, memasang dependensi, lalu menjalankan
pengujian yang diminta. Jika broker tidak dapat membuktikan bahwa tidak ada peran atau tidak ada PR jarak jauh,
gunakan CI fork tanpa rahasia. Jangan gunakan `hydrate-github`, `--no-sync`, atau
alur kerja Testbox yang dimuati kredensial.
Hapus penetapan semua penggantian `CRABBOX_TAILSCALE*`, paksa `--network public
--tailscale=false`, bersihkan flag simpul keluar/LAN, dan wajibkan `crabbox inspect` untuk
melaporkan jaringan publik tanpa status Tailscale sebelum mengunggah skrip apa pun.

## Urutan lokal rutin

1. `pnpm test:changed` untuk pembuktian Vitest dalam cakupan perubahan.
2. `pnpm test <path-or-filter>` untuk satu berkas, direktori, atau target eksplisit.
3. `pnpm test` hanya ketika Anda sengaja memerlukan suite Vitest lokal lengkap.

Dalam worktree Codex atau checkout tertaut/sparse, agen menghindari penggunaan langsung
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` secara lokal:

- Fallback lokal yang diminta pengguna secara eksplisit untuk berkas kecil:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Gate perubahan atau pembuktian luas: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` agar pnpm berjalan di dalam Testbox.
- `exitCode` akhir dan JSON waktu dari pembungkus merupakan hasil perintah. Proses Blacksmith GitHub Actions yang didelegasikan mungkin menampilkan `cancelled` setelah perintah SSH berhasil karena Testbox dihentikan dari luar tindakan keepalive; periksa ringkasan pembungkus dan keluaran perintah sebelum menganggapnya sebagai kegagalan.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mempertahankan serialisasi pemeriksaan berat di dalam worktree saat ini, bukan di direktori umum Git, untuk perintah seperti `pnpm check:changed` dan `pnpm test ...` yang ditargetkan. Gunakan hanya pada host lokal berkapasitas tinggi ketika Anda sengaja menjalankan pemeriksaan independen di seluruh worktree tertaut.

## Perintah inti

Proses pembungkus pengujian diakhiri dengan ringkasan singkat `[test] passed|failed|skipped ... in ...`; baris durasi Vitest sendiri tetap menjadi detail per shard.

| Perintah                                          | Fungsinya                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Target berkas/direktori eksplisit dirutekan melalui jalur Vitest yang tercakup. Proses tanpa target merupakan pembuktian suite lengkap: grup shard tetap diperluas menjadi konfigurasi daun untuk eksekusi paralel lokal, dengan fanout shard yang diharapkan dicetak sebelum dimulai. Grup ekstensi selalu diperluas menjadi konfigurasi shard per ekstensi, bukan satu proses proyek root raksasa. |
| `pnpm test:changed`                               | Proses pengujian perubahan cerdas yang ringan: target presisi dari pengeditan pengujian langsung, berkas saudara `*.test.ts`, pemetaan sumber eksplisit, dan grafik impor lokal. Perubahan luas/konfigurasi/paket dilewati kecuali dipetakan ke pengujian presisi.                                                                                          |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Proses pengujian perubahan luas yang eksplisit; gunakan ketika pengeditan harness/konfigurasi/paket pengujian harus kembali ke perilaku pengujian perubahan Vitest yang lebih luas.                                                                                                                                                                     |
| `pnpm test:force`                                 | Membebaskan porta Gateway OpenClaw yang dikonfigurasi (default `18789`), lalu menjalankan suite lengkap dengan porta Gateway terisolasi agar pengujian server tidak bertabrakan dengan instans yang sedang berjalan.                                                                                                                                     |
| `pnpm test:coverage`                              | Menghasilkan laporan cakupan V8 informasional untuk jalur unit default (`vitest.unit.config.ts`); tidak ada ambang cakupan yang diberlakukan.                                                                                                                                                                                                          |
| `pnpm test:coverage:changed`                      | Cakupan unit hanya untuk berkas yang berubah sejak `origin/main`.                                                                                                                                                                                                                                                                                     |
| `pnpm changed:lanes`                              | Menampilkan jalur arsitektur yang dipicu oleh diff terhadap `origin/main`.                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | Mendelegasikan ke Crabbox/Testbox secara default di luar CI, lalu menjalankan gate pemeriksaan perubahan cerdas di dalam turunan jarak jauh: pemformatan beserta pemeriksaan tipe, lint, dan perintah penjaga untuk jalur terdampak. Tidak menjalankan Vitest; gunakan `pnpm test:changed` atau `pnpm test <target>` untuk pembuktian pengujian.          |

## Status pengujian bersama dan pembantu proses

- `src/test-utils/openclaw-test-state.ts`: gunakan dari Vitest ketika pengujian memerlukan `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfigurasi, ruang kerja, direktori agen, atau penyimpanan profil autentikasi yang terisolasi.
- `pnpm test:env-mutations:report`: laporan nonpemblokiran tentang pengujian/harness yang secara langsung memodifikasi `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR`, atau kunci lingkungan terkait. Gunakan untuk menemukan kandidat migrasi ke pembantu status pengujian bersama.
- `test/helpers/openclaw-test-instance.ts`: pengujian E2E tingkat proses yang memerlukan Gateway berjalan, lingkungan CLI, pengambilan log, dan pembersihan dalam satu tempat.
- Jalur E2E Docker/Bash yang memuat `scripts/lib/docker-e2e-image.sh` dapat meneruskan `docker_e2e_test_state_shell_b64 <label> <scenario>` ke dalam kontainer dan mendekodenya dengan `scripts/lib/openclaw-e2e-instance.sh`; skrip multi-home dapat meneruskan `docker_e2e_test_state_function_b64` dan memanggil `openclaw_test_state_create <label> <scenario>` dalam setiap alur. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` menulis berkas lingkungan host yang dapat dimuat (tanda `--` sebelum `create` mencegah runtime Node yang lebih baru memperlakukan `--env-file` sebagai flag Node). Jalur yang meluncurkan Gateway dapat memuat `scripts/lib/openclaw-e2e-instance.sh` untuk resolusi titik masuk, startup OpenAI tiruan, peluncuran latar depan/latar belakang, pemeriksaan kesiapan, ekspor lingkungan status, dump log, dan pembersihan proses.

## Jalur Control UI, TUI, dan ekstensi

- **E2E Control UI dengan mock:** `pnpm test:ui:e2e` menjalankan jalur Vitest + Playwright yang memulai Vite Control UI dan mengendalikan halaman Chromium nyata terhadap WebSocket Gateway dengan mock. Pengujian berada di `ui/src/**/*.e2e.test.ts`; mock/kontrol bersama berada di `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` menyertakan jalur ini. Eksekusi agen secara default menggunakan Testbox/Crabbox, termasuk pembuktian tertarget; gunakan `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` hanya sebagai fallback lokal yang dinyatakan secara eksplisit.
- **Pengujian PTY TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` menjalankan jalur PTY cepat dengan backend palsu. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` atau `pnpm tui:pty:test:watch --mode local` menjalankan smoke test `tui --local` yang lebih lambat, yang hanya menggunakan mock untuk endpoint model eksternal. Lakukan asersi pada teks stabil yang terlihat atau pemanggilan fixture, bukan snapshot ANSI mentah.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard ekstensi/Plugin. Plugin saluran yang berat, Plugin peramban, dan OpenAI dijalankan sebagai shard khusus; grup Plugin lainnya tetap dikelompokkan. `pnpm test extensions/<id>` menjalankan satu jalur Plugin bawaan.
- Berkas sumber yang memiliki pengujian pendamping dipetakan ke pengujian tersebut sebelum beralih ke glob direktori yang lebih luas. Perubahan helper di bawah `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, dan `src/plugins/contracts` menggunakan graf impor lokal untuk menjalankan pengujian yang mengimpornya, alih-alih menjalankan setiap shard secara luas ketika jalur dependensinya presisi.
- Target direktori kontrak didistribusikan ke jalur kontraknya: `pnpm test src/channels/plugins/contracts` menjalankan empat konfigurasi kontrak saluran dan `pnpm test src/plugins/contracts` menjalankan konfigurasi kontrak Plugin, karena proyek generik `channels`/`plugins` mengecualikan `contracts/**`.
- `auto-reply` dibagi menjadi tiga konfigurasi khusus (`core`, `top-level`, `reply`) agar harness balasan tidak mendominasi pengujian status/token/helper tingkat atas yang lebih ringan.
- Berkas pengujian `plugin-sdk` dan `commands` tertentu diarahkan melalui jalur ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus yang berat pada waktu proses tetap berada di jalur yang sudah ada.
- Konfigurasi dasar Vitest secara default menggunakan `pool: "threads"` dan `isolate: false`, dengan runner non-terisolasi bersama yang diaktifkan di seluruh konfigurasi repositori.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.

## Gateway dan E2E

- Integrasi Gateway bersifat opsional: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: agregat E2E repositori = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: smoke test menyeluruh Gateway (pemasangan pasangan WS/HTTP/Node multi-instans). Secara default menggunakan `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>`, dan aktifkan log terperinci dengan `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: pengujian langsung penyedia (Claude/Minimax/DeepSeek/z.ai/dll., dibatasi oleh `*.live.test.ts`). Memerlukan kunci API dan `LIVE=1` (atau `OPENCLAW_LIVE_TEST=1`) agar tidak dilewati; aktifkan keluaran terperinci dengan `OPENCLAW_LIVE_TEST_QUIET=0`.

## Rangkaian lengkap Docker (`pnpm test:docker:all`)

Membangun image pengujian langsung bersama, mengemas OpenClaw satu kali sebagai tarball npm, membangun/menggunakan kembali image runner Node/Git dasar serta image fungsional yang memasang tarball tersebut ke `/app`, lalu menjalankan jalur smoke test Docker melalui penjadwal berbobot. `scripts/package-openclaw-for-docker.mjs` adalah satu-satunya pengemas paket lokal/CI dan memvalidasi tarball beserta `dist/postinstall-inventory.json` sebelum digunakan oleh Docker.

- Image dasar (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): jalur penginstal/pembaruan/dependensi Plugin; memasang tarball yang telah dibuat sebelumnya alih-alih sumber repositori yang disalin.
- Image fungsional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): jalur fungsionalitas aplikasi hasil build yang normal.
- Definisi jalur: `scripts/lib/docker-e2e-scenarios.mjs`. Perencana: `scripts/lib/docker-e2e-plan.mjs`. Pelaksana: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` menghasilkan rencana CI milik penjadwal (jalur, jenis image, kebutuhan paket/image langsung, skenario status, pemeriksaan kredensial) tanpa membangun atau menjalankan Docker.

Pengaturan penjadwalan (variabel lingkungan, nilai default dalam tanda kurung):

| Variabel lingkungan                                                                                              | Default             | Tujuan                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Slot proses.                                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Kumpulan tahap akhir yang sensitif terhadap penyedia.                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Batas jalur berat penyedia langsung.                                                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Batas jalur sumber daya npm.                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Batas jalur sumber daya layanan.                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Batas jalur berat per penyedia.                                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Batas per penyedia yang lebih ketat.                                                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Penimpaan untuk host yang lebih besar.                                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Jeda antara dimulainya jalur untuk menghindari lonjakan pembuatan pada daemon Docker lokal.                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 mnt) | Batas waktu fallback per jalur; jalur langsung/tahap akhir tertentu menggunakan batas yang lebih ketat.                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Percobaan ulang untuk kegagalan sementara penyedia langsung.                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | nonaktif            | Mencetak manifes jalur tanpa menjalankan Docker.                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Interval pencetakan status jalur aktif.                                                                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | aktif               | Menggunakan kembali `.artifacts/docker-tests/lane-timings.json` untuk pengurutan dari yang terlama; atur ke `0` untuk menonaktifkannya.                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` hanya untuk jalur deterministik/lokal, `only` hanya untuk jalur penyedia langsung. Alias: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Mode khusus langsung menggabungkan jalur langsung utama dan tahap akhir menjadi satu kumpulan yang diurutkan dari yang terlama agar kelompok penyedia mengemas pekerjaan Claude/Codex/Gemini bersama-sama. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Batas waktu penyiapan Docker backend CLI.                                                                                                                                                                                                                                                                                                              |

Pola variabel lingkungan untuk batas sumber daya adalah `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nama sumber daya menggunakan huruf kapital, karakter nonalfanumerik digabungkan menjadi `_`).

Perilaku lainnya: runner melakukan pemeriksaan awal Docker secara default, membersihkan kontainer E2E OpenClaw yang kedaluwarsa, berbagi cache alat CLI penyedia di antara lane yang kompatibel, dan berhenti menjadwalkan lane terkelompok baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ditetapkan. Jika satu lane melampaui batas bobot/sumber daya efektif pada host dengan paralelisme rendah, lane tersebut tetap dapat dimulai dari pool kosong dan berjalan sendiri hingga melepaskan kapasitas. Log per lane, `summary.json`, `failures.json`, dan waktu setiap fase ditulis di bawah `.artifacts/docker-tests/<run-id>/`; gunakan `pnpm test:docker:timings <summary.json>` untuk memeriksa lane yang lambat dan `pnpm test:docker:rerun <run-id|summary.json|failures.json>` untuk mencetak perintah pengujian ulang tertarget yang ringan.

### Lane Docker penting

| Perintah                                                                    | Memverifikasi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Kontainer E2E sumber berbasis Chromium dengan CDP mentah + Gateway terisolasi; snapshot peran CDP `browser doctor --deep` mencakup URL tautan, elemen yang dapat diklik dan dipromosikan kursor, referensi iframe, serta metadata frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:skill-install`                                            | Menginstal tarball yang telah dikemas dalam runner Docker polos dengan `skills.install.allowUploadedArchives: false`, mencari slug skill terkini melalui pencarian langsung ClawHub, menginstalnya melalui `openclaw skills install`, serta memverifikasi `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, dan `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Probe langsung backend CLI yang terfokus; Gemini memiliki alias `:resume` dan `:mcp` yang sesuai.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI dalam Docker: masuk, memeriksa `/api/models`, menjalankan percakapan nyata yang diproksi melalui `/api/chat/completions`. Memerlukan kunci model langsung yang dapat digunakan dan menarik image eksternal; tidak diharapkan stabil di CI seperti rangkaian pengujian unit/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:mcp-channels`                                             | Kontainer Gateway yang telah diisi data awal serta kontainer klien yang menjalankan `openclaw mcp serve`: penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean peristiwa langsung, perutean pengiriman keluar, serta notifikasi kanal + izin bergaya Claude melalui jembatan stdio nyata (asersi membaca frame MCP stdio mentah secara langsung).                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:upgrade-survivor`                                         | Menginstal tarball yang telah dikemas di atas fixture pengguna lama yang kotor, menjalankan pembaruan paket serta doctor noninteraktif tanpa kunci penyedia/kanal langsung, memulai Gateway loopback, lalu memeriksa agar agen, konfigurasi kanal, daftar izin Plugin, berkas ruang kerja/sesi, status dependensi Plugin lawas yang kedaluwarsa, proses mulai, dan status RPC tetap bertahan.                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm test:docker:published-upgrade-survivor`                               | Menginstal `openclaw@latest` secara default, mengisi berkas pengguna yang sudah ada secara realistis, mengonfigurasi melalui resep bawaan `openclaw config set`, memperbarui ke tarball yang telah dikemas, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, serta memeriksa `/healthz`, `/readyz`, dan status RPC. Ganti dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, perluas matriks dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, atau tambahkan fixture skenario dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (mencakup `configured-plugin-installs` dan `stale-source-plugin-shadow`). Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline(s)` / `_scenarios` dan menguraikan token meta seperti `last-stable-4` atau `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Harness ketahanan peningkatan versi terpublikasi dalam skenario `plugin-deps-cleanup`, yang secara default dimulai dari `openclaw@2026.4.23`. Alur kerja `Update Migration` memperluasnya dengan `baselines=all-since-2026.4.23` untuk membuktikan pembersihan dependensi Plugin yang dikonfigurasi di luar CI Rilis Penuh.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:plugins`                                                  | Uji asap penginstalan/pembaruan untuk jalur lokal, `file:`, paket registri npm dengan dependensi yang diangkat, referensi git yang bergerak, fixture ClawHub, pembaruan marketplace, serta pengaktifan/pemeriksaan bundel Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Gerbang PR lokal

Untuk pemeriksaan pendaratan/gerbang PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` gagal secara sporadis pada host yang sibuk, jalankan ulang sekali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan keterbatasan memori:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Peralatan kinerja pengujian

- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + perincian impor Vitest, sembari tetap menggunakan perutean jalur tercakup untuk target file/direktori eksplisit. `pnpm test:perf:imports:changed` membatasi pembuatan profil yang sama pada file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mengukur kinerja jalur mode perubahan yang dirutekan terhadap proses bawaan proyek root untuk diff git terkomit yang sama; `pnpm test:perf:changed:bench -- --worktree` mengukur kinerja kumpulan perubahan worktree saat ini tanpa harus melakukan commit terlebih dahulu.
- `pnpm test:perf:profile:main` menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap konfigurasi turunan Vitest untuk rangkaian lengkap secara serial dan menulis data durasi yang dikelompokkan beserta artefak JSON/log per konfigurasi. Laporan rangkaian lengkap mengisolasi file secara default agar grafik modul yang dipertahankan dan jeda GC dari file sebelumnya tidak dibebankan pada assertion berikutnya; teruskan `-- --no-isolate` hanya saat sengaja membuat profil akumulasi worker bersama. Agen Kinerja Pengujian menggunakan ini sebagai baseline sebelum mencoba memperbaiki pengujian yang lambat. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` membandingkan laporan yang dikelompokkan setelah perubahan yang berfokus pada kinerja.
- Proses shard lengkap, ekstensi, dan pola penyertaan memperbarui data waktu lokal di `.artifacts/vitest-shard-timings.json`; proses seluruh konfigurasi berikutnya menggunakan waktu tersebut untuk menyeimbangkan shard lambat dan cepat. Shard CI pola penyertaan menambahkan nama shard ke kunci waktu, sehingga waktu shard terfilter tetap terlihat tanpa menggantikan data waktu seluruh konfigurasi. Atur `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak waktu lokal.

## Tolok ukur

<Accordion title="Latensi model (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Variabel lingkungan opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Prompt default: "Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan."

</Accordion>

<Accordion title="Waktu mulai CLI (scripts/bench-cli-startup.ts)">

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

Keluaran mencakup `sampleCount`, rata-rata, p50, p95, min/maks, distribusi kode keluar/sinyal, dan RSS maksimum per perintah. `--cpu-prof-dir` / `--heap-prof-dir` menulis profil V8 untuk setiap proses.

Keluaran tersimpan: `pnpm test:startup:bench:smoke` menulis `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` menulis `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture yang disimpan dalam repositori: `test/fixtures/cli-startup-bench.json`, diperbarui oleh `pnpm test:startup:bench:update`, dibandingkan oleh `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Waktu mulai Gateway (scripts/bench-gateway-startup.ts)">

Secara default menggunakan entri CLI hasil build di `dist/entry.js`; jalankan `pnpm build` terlebih dahulu. Teruskan `--entry scripts/run-node.mjs` untuk mengukur runner sumber sebagai gantinya, dan pisahkan hasil tersebut dari baseline entri hasil build.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

ID kasus: `default`, `skipChannels` (waktu mulai saluran dilewati), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 Plugin manifes), `fiftyStartupLazyPlugins` (50 Plugin manifes dengan pemuatan lambat saat mulai).

Keluaran mencakup keluaran proses pertama, `/healthz`, `/readyz`, waktu log mulai mendengarkan HTTP, waktu log kesiapan Gateway, waktu CPU, rasio inti CPU, RSS maksimum, heap, metrik jejak waktu mulai, penundaan event loop, dan metrik terperinci tabel pencarian Plugin. Skrip mengatur `OPENCLAW_GATEWAY_STARTUP_TRACE=1` di lingkungan Gateway turunan.

`/healthz` menunjukkan status hidup (server HTTP dapat merespons). `/readyz` menunjukkan kesiapan untuk digunakan (sidecar Plugin waktu mulai, saluran, dan pekerjaan pascapemasangan yang sangat penting bagi kesiapan telah selesai). Hook waktu mulai dikirim secara asinkron dan bukan bagian dari jaminan kesiapan. Waktu log kesiapan adalah stempel waktu internal Gateway, berguna untuk atribusi pada sisi proses tetapi bukan pengganti pemeriksaan eksternal `/readyz`.

Gunakan keluaran JSON atau `--output` saat membandingkan perubahan. Gunakan `--cpu-prof-dir` hanya setelah keluaran jejak menunjukkan pekerjaan impor, kompilasi, atau yang dibatasi CPU yang tidak dapat dijelaskan hanya oleh waktu setiap fase.

</Accordion>

<Accordion title="Mulai ulang Gateway (scripts/bench-gateway-restart.ts)">

Khusus macOS dan Linux (menggunakan SIGUSR1 untuk memulai ulang di dalam proses; langsung gagal di Windows). Menggunakan default entri hasil build dan penggantian `--entry scripts/run-node.mjs` yang sama seperti waktu mulai Gateway di atas.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

ID kasus: `skipChannels`, `skipChannelsAcpxProbe` (pemeriksaan waktu mulai ACPX aktif), `skipChannelsNoAcpxProbe` (pemeriksaan nonaktif), `default`, `fiftyPlugins`.

Keluaran mencakup `/healthz` berikutnya, `/readyz` berikutnya, waktu henti, waktu kesiapan mulai ulang, CPU, RSS, metrik jejak waktu mulai untuk proses pengganti, serta metrik jejak mulai ulang untuk penanganan sinyal, pengosongan pekerjaan aktif, fase penutupan, proses mulai berikutnya, waktu kesiapan, dan snapshot memori. Skrip mengatur `OPENCLAW_GATEWAY_STARTUP_TRACE=1` dan `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Gunakan tolok ukur ini ketika perubahan menyentuh pensinyalan mulai ulang, handler penutupan, waktu mulai setelah mulai ulang, penghentian sidecar, serah terima layanan, atau kesiapan setelah mulai ulang. Mulailah dengan `skipChannels` untuk mengisolasi mekanisme Gateway dari waktu mulai saluran; gunakan kasus `default` atau yang sarat Plugin hanya setelah kasus sempit menjelaskan jalur mulai ulang. Metrik jejak merupakan petunjuk atribusi, bukan putusan — nilai perubahan mulai ulang berdasarkan beberapa sampel, rentang pemilik yang sesuai, perilaku `/healthz`/`/readyz`, dan kontrak mulai ulang yang terlihat oleh pengguna.

</Accordion>

## E2E orientasi (Docker)

Opsional; hanya diperlukan untuk uji asap orientasi dalam kontainer. Alur mulai dingin lengkap dalam kontainer Linux yang bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Menjalankan wizard interaktif melalui pseudo-tty, memverifikasi file konfigurasi/workspace/sesi, kemudian memulai Gateway dan menjalankan `openclaw health`.

## Uji asap impor QR (Docker)

Memastikan helper runtime QR yang dipelihara dapat dimuat pada runtime Docker Node yang didukung (Node 24 secara default, kompatibel dengan Node 22):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian langsung](/id/help/testing-live)
- [Pengujian pembaruan dan Plugin](/id/help/testing-updates-plugins)
