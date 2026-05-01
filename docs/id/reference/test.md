---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan tes secara lokal (vitest) dan kapan menggunakan mode paksa/cakupan
title: Pengujian
x-i18n:
    generated_at: "2026-05-01T09:28:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07ca45e6c21016ad403ea010bd2e5460acc059c004138e04a714a3506f0e5cda
    source_path: reference/test.md
    workflow: 16
---

- Kit pengujian lengkap (suite, live, Docker): [Pengujian](/id/help/testing)

- `pnpm test:force`: Menghentikan paksa proses Gateway yang masih tersisa dan menahan port kontrol default, lalu menjalankan seluruh suite Vitest dengan port Gateway terisolasi agar pengujian server tidak bentrok dengan instans yang sedang berjalan. Gunakan ini ketika proses Gateway sebelumnya meninggalkan port 18789 dalam keadaan terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gate cakupan unit untuk file yang dimuat, bukan cakupan semua file seluruh repo. Ambang batasnya adalah 70% baris/fungsi/pernyataan dan 55% cabang. Karena `coverage.all` bernilai false, gate ini mengukur file yang dimuat oleh suite cakupan unit, alih-alih memperlakukan setiap file sumber split-lane sebagai tidak tercakup.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: menjalankan pengujian perubahan pintar yang murah. Perintah ini menjalankan target presisi dari edit pengujian langsung, file sibling `*.test.ts`, pemetaan sumber eksplisit, dan graf impor lokal. Perubahan luas/konfigurasi/paket dilewati kecuali perubahan tersebut dipetakan ke pengujian yang presisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: menjalankan pengujian perubahan luas secara eksplisit. Gunakan ini ketika edit harness/konfigurasi/paket pengujian harus fallback ke perilaku changed-test Vitest yang lebih luas.
- `pnpm changed:lanes`: menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan gate pemeriksaan perubahan pintar untuk diff terhadap `origin/main`. Perintah ini menjalankan typecheck, lint, dan perintah guard untuk lane arsitektural yang terdampak, tetapi tidak menjalankan pengujian Vitest. Gunakan `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest terskopa. Eksekusi tanpa target menggunakan grup shard tetap dan diperluas ke konfigurasi leaf untuk eksekusi paralel lokal; grup ekstensi selalu diperluas ke konfigurasi shard per ekstensi, bukan satu proses root-project raksasa.
- Eksekusi wrapper pengujian berakhir dengan ringkasan singkat `[test] passed|failed|skipped ... in ...`. Baris durasi milik Vitest tetap menjadi detail per-shard.
- State pengujian OpenClaw bersama: gunakan `src/test-utils/openclaw-test-state.ts` dari Vitest ketika pengujian memerlukan `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfigurasi, workspace, direktori agent, atau penyimpanan auth-profile yang terisolasi.
- Helper E2E proses: gunakan `test/helpers/openclaw-test-instance.ts` ketika pengujian E2E tingkat proses Vitest memerlukan Gateway berjalan, env CLI, penangkapan log, dan cleanup di satu tempat.
- Helper E2E Docker/Bash: lane yang men-source `scripts/lib/docker-e2e-image.sh` dapat meneruskan `docker_e2e_test_state_shell_b64 <label> <scenario>` ke dalam container dan mendekodenya dengan `scripts/lib/openclaw-e2e-instance.sh`; skrip multi-home dapat meneruskan `docker_e2e_test_state_function_b64` dan memanggil `openclaw_test_state_create <label> <scenario>` di setiap flow. Pemanggil level lebih rendah dapat menggunakan `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` untuk snippet shell di dalam container, atau `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` untuk file env host yang dapat di-source. `--` sebelum `create` mencegah runtime Node yang lebih baru memperlakukan `--env-file` sebagai flag Node. Lane Docker/Bash yang meluncurkan Gateway dapat men-source `scripts/lib/openclaw-e2e-instance.sh` di dalam container untuk resolusi entrypoint, startup OpenAI tiruan, peluncuran Gateway foreground/background, probe kesiapan, ekspor env state, dump log, dan cleanup proses.
- Eksekusi shard penuh, ekstensi, dan include-pattern memperbarui data timing lokal di `.artifacts/vitest-shard-timings.json`; eksekusi whole-config berikutnya menggunakan timing tersebut untuk menyeimbangkan shard lambat dan cepat. Shard CI include-pattern menambahkan nama shard ke kunci timing, sehingga timing shard yang difilter tetap terlihat tanpa menggantikan data timing whole-config. Setel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak timing lokal.
- File pengujian `plugin-sdk` dan `commands` terpilih kini dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus yang berat runtime tetap berada di lane yang sudah ada.
- File sumber dengan pengujian sibling dipetakan ke sibling tersebut sebelum fallback ke glob direktori yang lebih luas. Edit helper di bawah `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, dan `src/plugins/contracts` menggunakan graf impor lokal untuk menjalankan pengujian yang mengimpor, alih-alih menjalankan setiap shard secara luas ketika path dependensinya presisi.
- `auto-reply` kini juga dipecah menjadi tiga konfigurasi khusus (`core`, `top-level`, `reply`) sehingga harness reply tidak mendominasi pengujian status/token/helper top-level yang lebih ringan.
- Konfigurasi dasar Vitest kini default ke `pool: "threads"` dan `isolate: false`, dengan runner non-terisolasi bersama diaktifkan di seluruh konfigurasi repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard ekstensi/plugin. Plugin channel berat, Plugin browser, dan OpenAI berjalan sebagai shard khusus; grup Plugin lain tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane Plugin bundled.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + breakdown impor Vitest, sambil tetap menggunakan routing lane terskopa untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profiling impor yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membenchmark path changed-mode yang dirutekan terhadap eksekusi root-project native untuk diff git committed yang sama.
- `pnpm test:perf:changed:bench -- --worktree` membenchmark set perubahan worktree saat ini tanpa perlu commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap konfigurasi leaf Vitest full-suite secara serial dan menulis data durasi tergroup beserta artefak JSON/log per-konfigurasi. Test Performance Agent menggunakan ini sebagai baseline sebelum mencoba perbaikan pengujian lambat.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: membandingkan laporan tergroup setelah perubahan yang berfokus pada performa.
- Integrasi Gateway: ikut serta melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan pengujian smoke end-to-end Gateway (pairing multi-instans WS/HTTP/node). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan setel `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan pengujian live provider (minimax/zai). Memerlukan kunci API dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak diskip.
- `pnpm test:docker:all`: Membangun image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, membangun/menggunakan ulang image runner Node/Git bare plus image fungsional yang menginstal tarball tersebut ke `/app`, lalu menjalankan lane smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` melalui scheduler berbobot. Image bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) digunakan untuk lane installer/update/dependensi-plugin; lane tersebut memasang tarball prabangun, bukan menggunakan sumber repo yang disalin. Image fungsional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) digunakan untuk lane fungsionalitas built-app normal. `scripts/package-openclaw-for-docker.mjs` adalah satu-satunya packer paket lokal/CI dan memvalidasi tarball beserta `dist/postinstall-inventory.json` sebelum Docker mengonsumsinya. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi plan yang dipilih. `node scripts/test-docker-all.mjs --plan-json` memancarkan plan CI milik scheduler untuk lane terpilih, jenis image, kebutuhan paket/live-image, skenario state, dan pemeriksaan kredensial tanpa membangun atau menjalankan Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` mengontrol slot proses dan default ke 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` mengontrol pool tail yang sensitif terhadap provider dan default ke 10. Batas lane berat default ke `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; batas provider default ke satu lane berat per provider melalui `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, dan `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gunakan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` untuk host yang lebih besar. Jika satu lane melebihi batas bobot atau sumber daya efektif pada host berparalelisme rendah, lane itu tetap dapat dimulai dari pool kosong dan akan berjalan sendiri hingga melepaskan kapasitas. Start lane dijeda 2 detik secara default untuk menghindari badai create daemon Docker lokal; override dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner melakukan preflight Docker secara default, membersihkan container E2E OpenClaw stale, memancarkan status lane aktif setiap 30 detik, membagikan cache tool CLI provider antar lane yang kompatibel, mencoba ulang kegagalan live-provider sementara sekali secara default (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), dan menyimpan timing lane di `.artifacts/docker-tests/lane-timings.json` untuk pengurutan longest-first pada eksekusi berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifest lane tanpa menjalankan Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` untuk menyesuaikan output status, atau `OPENCLAW_DOCKER_ALL_TIMINGS=0` untuk menonaktifkan penggunaan ulang timing. Gunakan `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` hanya untuk lane deterministik/lokal atau `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` hanya untuk lane live-provider; alias paketnya adalah `pnpm test:docker:local:all` dan `pnpm test:docker:live:all`. Mode live-only menggabungkan lane live utama dan tail ke dalam satu pool longest-first sehingga bucket provider dapat memadatkan pekerjaan Claude, Codex, dan Gemini bersama-sama. Runner berhenti menjadwalkan lane pooled baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` disetel, dan setiap lane memiliki timeout fallback 120 menit yang dapat dioverride dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail terpilih menggunakan batas per-lane yang lebih ketat. Perintah setup Docker backend CLI memiliki timeout sendiri melalui `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per-lane, `summary.json`, `failures.json`, dan timing fase ditulis di bawah `.artifacts/docker-tests/<run-id>/`; gunakan `pnpm test:docker:timings <summary.json>` untuk memeriksa lane lambat dan `pnpm test:docker:rerun <run-id|summary.json|failures.json>` untuk mencetak perintah rerun tertarget yang murah.
- `pnpm test:docker:browser-cdp-snapshot`: Membangun container E2E sumber berbasis Chromium, memulai CDP mentah plus Gateway terisolasi, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP menyertakan URL tautan, clickables yang dipromosikan cursor, ref iframe, dan metadata frame.
- Probe Docker live backend CLI dapat dijalankan sebagai lane terfokus, misalnya `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, atau `pnpm test:docker:live-cli-backend:codex:mcp`. Claude dan Gemini memiliki alias `:resume` dan `:mcp` yang sesuai.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, masuk melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat nyata yang diproksi melalui `/api/chat/completions`. Memerlukan kunci model live yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil untuk CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai container Gateway ber-seed dan container klien kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, routing kirim keluar, serta notifikasi channel + izin gaya Claude melalui bridge stdio nyata. Assertion notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dipancarkan bridge.
- `pnpm test:docker:upgrade-survivor`: Menginstal tarball OpenClaw yang dipaketkan di atas fixture pengguna lama yang kotor, menjalankan pembaruan paket plus doctor noninteraktif tanpa kunci penyedia atau kanal live, lalu memulai Gateway loopback dan memeriksa bahwa agen, konfigurasi kanal, daftar izin Plugin, file workspace/sesi, status runtime-deps Plugin yang usang, startup, dan status RPC tetap bertahan.
- `pnpm test:docker:published-upgrade-survivor`: Menginstal `openclaw@latest` secara default, mengisi file pengguna yang sudah ada secara realistis tanpa kunci penyedia atau kanal live, mengonfigurasi baseline tersebut dengan resep perintah `openclaw config set` bawaan, memperbarui instalasi yang dipublikasikan itu ke tarball OpenClaw yang dipaketkan, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa bahwa intent yang dikonfigurasi, file workspace/sesi, status konfigurasi/runtime-deps Plugin yang usang, startup, `/healthz`, `/readyz`, dan status RPC tetap bertahan atau diperbaiki dengan bersih. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, perluas matriks persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, atau tambahkan fixture skenario dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`.

## Gerbang PR lokal

Untuk pemeriksaan land/gate PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` flake pada host yang sedang terbebani, jalankan ulang sekali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latensi model (kunci lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt bawaan: “Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan.”

Eksekusi terakhir (2025-12-31, 20 run):

- median minimax 1279ms (min 1114, maks 2431)
- median opus 2454ms (min 1224, maks 3170)

## Benchmark waktu mulai CLI

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

Output menyertakan `sampleCount`, avg, p50, p95, min/maks, distribusi exit-code/signal, dan ringkasan RSS maks untuk setiap perintah. Opsional `--cpu-prof-dir` / `--heap-prof-dir` menulis profil V8 per run sehingga pengukuran waktu dan penangkapan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke tertarget di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak suite lengkap di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini terhadap fixture dengan `pnpm test:startup:bench:check`

## E2E onboarding (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk uji smoke onboarding dalam container.

Alur cold-start penuh dalam container Linux bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menjalankan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan helper runtime QR yang dipelihara dapat dimuat di bawah runtime Docker Node yang didukung (Node 24 bawaan, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian live](/id/help/testing-live)
