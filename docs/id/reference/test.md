---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-04-30T18:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Kit pengujian lengkap (rangkaian pengujian, pengujian langsung, Docker): [Pengujian](/id/help/testing)

- `pnpm test:force`: Menghentikan paksa proses Gateway yang masih tersisa dan menahan port kontrol default, lalu menjalankan seluruh rangkaian Vitest dengan port Gateway terisolasi agar pengujian server tidak bertabrakan dengan instans yang sedang berjalan. Gunakan ini ketika proses Gateway sebelumnya membuat port 18789 tetap terpakai.
- `pnpm test:coverage`: Menjalankan rangkaian unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gate cakupan unit untuk file yang dimuat, bukan cakupan semua file seluruh repo. Ambangnya adalah 70% untuk baris/fungsi/pernyataan dan 55% untuk cabang. Karena `coverage.all` bernilai false, gate ini mengukur file yang dimuat oleh rangkaian cakupan unit, alih-alih memperlakukan setiap file sumber split-lane sebagai tidak tercakup.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: proses pengujian perubahan cerdas yang murah. Ini menjalankan target presisi dari edit pengujian langsung, file sibling `*.test.ts`, pemetaan sumber eksplisit, dan grafik impor lokal. Perubahan luas/konfigurasi/paket dilewati kecuali dipetakan ke pengujian yang presisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: proses pengujian perubahan luas eksplisit. Gunakan ini ketika edit harness/konfigurasi/paket pengujian harus kembali ke perilaku pengujian perubahan Vitest yang lebih luas.
- `pnpm changed:lanes`: menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan gate pemeriksaan perubahan cerdas untuk diff terhadap `origin/main`. Ini menjalankan typecheck, lint, dan perintah guard untuk lane arsitektural yang terdampak, tetapi tidak menjalankan pengujian Vitest. Gunakan `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest berskop. Proses tanpa target memakai grup shard tetap dan mengembang ke konfigurasi leaf untuk eksekusi paralel lokal; grup ekstensi selalu mengembang ke konfigurasi shard per-ekstensi, bukan satu proses root-project raksasa.
- Proses wrapper pengujian berakhir dengan ringkasan singkat `[test] passed|failed|skipped ... in ...`. Baris durasi milik Vitest tetap menjadi detail per-shard.
- Status pengujian OpenClaw bersama: gunakan `src/test-utils/openclaw-test-state.ts` dari Vitest ketika sebuah pengujian memerlukan `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfigurasi, workspace, direktori agen, atau penyimpanan auth-profile yang terisolasi.
- Helper E2E proses: gunakan `test/helpers/openclaw-test-instance.ts` ketika pengujian E2E level proses Vitest memerlukan Gateway yang berjalan, env CLI, pengambilan log, dan pembersihan di satu tempat.
- Helper E2E Docker/Bash: lane yang melakukan source `scripts/lib/docker-e2e-image.sh` dapat meneruskan `docker_e2e_test_state_shell_b64 <label> <scenario>` ke dalam kontainer dan mendekodenya dengan `scripts/lib/openclaw-e2e-instance.sh`; skrip multi-home dapat meneruskan `docker_e2e_test_state_function_b64` dan memanggil `openclaw_test_state_create <label> <scenario>` di setiap alur. Pemanggil level lebih rendah dapat menggunakan `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` untuk cuplikan shell di dalam kontainer, atau `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` untuk file env host yang dapat di-source. `--` sebelum `create` mencegah runtime Node yang lebih baru memperlakukan `--env-file` sebagai flag Node. Lane Docker/Bash yang meluncurkan Gateway dapat melakukan source `scripts/lib/openclaw-e2e-instance.sh` di dalam kontainer untuk resolusi entrypoint, startup OpenAI tiruan, peluncuran Gateway foreground/background, probe kesiapan, ekspor env status, dump log, dan pembersihan proses.
- Proses shard penuh, ekstensi, dan include-pattern memperbarui data timing lokal di `.artifacts/vitest-shard-timings.json`; proses whole-config berikutnya memakai timing tersebut untuk menyeimbangkan shard lambat dan cepat. Shard CI include-pattern menambahkan nama shard ke kunci timing, sehingga timing shard terfilter tetap terlihat tanpa mengganti data timing whole-config. Setel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak timing lokal.
- File pengujian `plugin-sdk` dan `commands` terpilih sekarang dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus runtime-heavy tetap di lane yang sudah ada.
- File sumber dengan pengujian sibling dipetakan ke sibling tersebut sebelum fallback ke glob direktori yang lebih luas. Edit helper di bawah `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, dan `src/plugins/contracts` memakai grafik impor lokal untuk menjalankan pengujian yang mengimpor, alih-alih menjalankan luas setiap shard ketika jalur dependensinya presisi.
- `auto-reply` sekarang juga dipisah menjadi tiga konfigurasi khusus (`core`, `top-level`, `reply`) sehingga harness reply tidak mendominasi pengujian status/token/helper top-level yang lebih ringan.
- Konfigurasi dasar Vitest sekarang default ke `pool: "threads"` dan `isolate: false`, dengan runner non-terisolasi bersama diaktifkan di seluruh konfigurasi repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard ekstensi/plugin. Plugin channel berat, Plugin browser, dan OpenAI berjalan sebagai shard khusus; grup Plugin lainnya tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane Plugin bawaan.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + rincian impor Vitest, sambil tetap memakai perutean lane berskop untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profiling impor yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` melakukan benchmark jalur changed-mode yang dirutekan terhadap proses root-project native untuk diff git commit yang sama.
- `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark kumpulan perubahan worktree saat ini tanpa perlu commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap konfigurasi leaf Vitest full-suite secara serial dan menulis data durasi berkelompok plus artefak JSON/log per-konfigurasi. Test Performance Agent menggunakan ini sebagai baseline sebelum mencoba perbaikan pengujian lambat.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: membandingkan laporan berkelompok setelah perubahan yang berfokus pada performa.
- Integrasi Gateway: ikut serta melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan pengujian smoke end-to-end Gateway (pairing multi-instans WS/HTTP/node). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan setel `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan pengujian live provider (minimax/zai). Memerlukan API key dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak diskip.
- `pnpm test:docker:all`: Membangun image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, membangun/memakai ulang image runner Node/Git bare plus image fungsional yang memasang tarball itu ke `/app`, lalu menjalankan lane smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` melalui scheduler berbobot. Image bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) digunakan untuk lane installer/update/dependensi-plugin; lane tersebut me-mount tarball prabangun alih-alih memakai sumber repo yang disalin. Image fungsional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) digunakan untuk lane fungsionalitas built-app normal. `scripts/package-openclaw-for-docker.mjs` adalah satu-satunya packer paket lokal/CI dan memvalidasi tarball plus `dist/postinstall-inventory.json` sebelum Docker mengonsumsinya. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi plan terpilih. `node scripts/test-docker-all.mjs --plan-json` memancarkan plan CI milik scheduler untuk lane terpilih, jenis image, kebutuhan paket/live-image, skenario status, dan pemeriksaan kredensial tanpa membangun atau menjalankan Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` mengontrol slot proses dan default ke 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` mengontrol pool tail yang sensitif provider dan default ke 10. Batas lane berat default ke `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; batas provider default ke satu lane berat per provider melalui `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, dan `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gunakan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` untuk host yang lebih besar. Jika satu lane melampaui batas bobot atau sumber daya efektif pada host dengan paralelisme rendah, lane itu tetap dapat dimulai dari pool kosong dan akan berjalan sendiri sampai melepas kapasitas. Awal lane diberi jeda 2 detik secara default untuk menghindari lonjakan pembuatan daemon Docker lokal; ubah dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner melakukan preflight Docker secara default, membersihkan kontainer E2E OpenClaw yang usang, memancarkan status active-lane setiap 30 detik, membagikan cache tool CLI provider antar-lane yang kompatibel, mencoba ulang kegagalan live-provider sementara sekali secara default (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), dan menyimpan timing lane di `.artifacts/docker-tests/lane-timings.json` untuk pengurutan terpanjang-dulu pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane tanpa menjalankan Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` untuk menyesuaikan output status, atau `OPENCLAW_DOCKER_ALL_TIMINGS=0` untuk menonaktifkan penggunaan ulang timing. Gunakan `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` hanya untuk lane deterministik/lokal atau `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` hanya untuk lane live-provider; alias paketnya adalah `pnpm test:docker:local:all` dan `pnpm test:docker:live:all`. Mode live-only menggabungkan lane live utama dan tail ke satu pool terpanjang-dulu sehingga bucket provider dapat mengemas pekerjaan Claude, Codex, dan Gemini bersama. Runner berhenti menjadwalkan lane pooled baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` disetel, dan setiap lane memiliki timeout fallback 120 menit yang dapat diubah dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail terpilih memakai batas per-lane yang lebih ketat. Perintah setup Docker backend CLI memiliki timeout sendiri melalui `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per-lane, `summary.json`, `failures.json`, dan timing fase ditulis di bawah `.artifacts/docker-tests/<run-id>/`; gunakan `pnpm test:docker:timings <summary.json>` untuk memeriksa lane lambat dan `pnpm test:docker:rerun <run-id|summary.json|failures.json>` untuk mencetak perintah rerun tertarget yang murah.
- `pnpm test:docker:browser-cdp-snapshot`: Membangun kontainer E2E sumber berbasis Chromium, memulai CDP mentah plus Gateway terisolasi, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP menyertakan URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Probe Docker live backend CLI dapat dijalankan sebagai lane terfokus, misalnya `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, atau `pnpm test:docker:live-cli-backend:codex:mcp`. Claude dan Gemini memiliki alias `:resume` dan `:mcp` yang sesuai.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, masuk melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat proksi nyata melalui `/api/chat/completions`. Memerlukan key model live yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti rangkaian unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai kontainer Gateway ber-seed dan kontainer klien kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, perutean kirim outbound, dan notifikasi channel + izin gaya Claude melalui bridge stdio nyata. Assertion notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dipancarkan bridge.
- `pnpm test:docker:upgrade-survivor`: Menginstal tarball OpenClaw yang sudah dikemas di atas fixture pengguna lama yang kotor, menjalankan pembaruan paket serta doctor noninteraktif tanpa provider live atau kunci channel, lalu memulai Gateway loopback dan memeriksa bahwa agent, konfigurasi channel, daftar izin plugin, file workspace/sesi, status stale plugin runtime-deps, startup, dan status RPC tetap bertahan.

## Gerbang PR lokal

Untuk pemeriksaan penggabungan/gerbang PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` gagal tidak stabil pada mesin yang terbebani, jalankan ulang satu kali sebelum memperlakukannya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk mesin dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Tolok ukur latensi model (kunci lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt bawaan: “Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan.”

Jalankan terakhir (2025-12-31, 20 kali jalan):

- median minimax 1279ms (min 1114, maks 2431)
- median opus 2454ms (min 1224, maks 3170)

## Tolok ukur startup CLI

Skrip: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Penggunaan:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: kedua preset

Output mencakup `sampleCount`, rata-rata, p50, p95, min/maks, distribusi exit-code/sinyal, dan ringkasan RSS maksimum untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per jalankan sehingga pengukuran waktu dan pengambilan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke tertarget di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak suite penuh di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang disertakan di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang disertakan:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini dengan fixture menggunakan `pnpm test:startup:bench:check`

## E2E onboarding (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk uji smoke onboarding dalam kontainer.

Alur cold-start penuh dalam kontainer Linux bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menjalankan wizard interaktif melalui pseudo-tty, memverifikasi file konfigurasi/workspace/sesi, lalu memulai Gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan helper runtime QR yang dipelihara dimuat pada runtime Docker Node yang didukung (Node 24 bawaan, kompatibel Node 22):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian live](/id/help/testing-live)
