---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-04-30T10:11:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- Kit pengujian lengkap (suite, langsung, Docker): [Pengujian](/id/help/testing)

- `pnpm test:force`: Mematikan proses gateway tersisa yang menahan port kontrol default, lalu menjalankan rangkaian lengkap Vitest dengan port Gateway terisolasi agar pengujian server tidak bertabrakan dengan instance yang sedang berjalan. Gunakan ini ketika proses Gateway sebelumnya membuat port 18789 tetap terpakai.
- `pnpm test:coverage`: Menjalankan rangkaian unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gate cakupan unit untuk file yang dimuat, bukan cakupan semua file seluruh repo. Ambangnya adalah 70% baris/fungsi/pernyataan dan 55% cabang. Karena `coverage.all` bernilai false, gate ini mengukur file yang dimuat oleh rangkaian cakupan unit, bukan memperlakukan setiap file sumber split-lane sebagai tidak tercakup.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: proses pengujian perubahan pintar yang murah. Ini menjalankan target presisi dari pengeditan pengujian langsung, file sibling `*.test.ts`, pemetaan sumber eksplisit, dan grafik impor lokal. Perubahan luas/config/package dilewati kecuali dipetakan ke pengujian presisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: proses pengujian perubahan luas eksplisit. Gunakan ketika pengeditan harness/config/package pengujian harus kembali ke perilaku changed-test Vitest yang lebih luas.
- `pnpm changed:lanes`: menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan gate pemeriksaan perubahan pintar untuk diff terhadap `origin/main`. Ini menjalankan typecheck, lint, dan perintah guard untuk lane arsitektural yang terdampak, tetapi tidak menjalankan pengujian Vitest. Gunakan `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest terskop. Proses tanpa target menggunakan grup shard tetap dan memperluas ke config leaf untuk eksekusi paralel lokal; grup ekstensi selalu diperluas ke config shard per ekstensi, bukan satu proses root-project raksasa.
- Proses wrapper pengujian diakhiri dengan ringkasan singkat `[test] passed|failed|skipped ... in ...`. Baris durasi bawaan Vitest tetap menjadi detail per-shard.
- State pengujian OpenClaw bersama: gunakan `src/test-utils/openclaw-test-state.ts` dari Vitest ketika pengujian membutuhkan `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture config, workspace, direktori agent, atau penyimpanan auth-profile yang terisolasi.
- Helper E2E proses: gunakan `test/helpers/openclaw-test-instance.ts` ketika pengujian E2E tingkat proses Vitest membutuhkan Gateway berjalan, env CLI, penangkapan log, dan pembersihan di satu tempat.
- Helper E2E Docker/Bash: lane yang melakukan source `scripts/lib/docker-e2e-image.sh` dapat meneruskan `docker_e2e_test_state_shell_b64 <label> <scenario>` ke dalam container dan mendekodenya dengan `scripts/lib/openclaw-e2e-instance.sh`; skrip multi-home dapat meneruskan `docker_e2e_test_state_function_b64` dan memanggil `openclaw_test_state_create <label> <scenario>` di setiap flow. Pemanggil tingkat lebih rendah dapat menggunakan `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` untuk snippet shell di dalam container, atau `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` untuk file env host yang dapat di-source. `--` sebelum `create` mencegah runtime Node yang lebih baru memperlakukan `--env-file` sebagai flag Node. Lane Docker/Bash yang meluncurkan Gateway dapat melakukan source `scripts/lib/openclaw-e2e-instance.sh` di dalam container untuk resolusi entrypoint, startup OpenAI tiruan, peluncuran Gateway foreground/background, probe kesiapan, ekspor env state, dump log, dan pembersihan proses.
- Proses shard lengkap, ekstensi, dan include-pattern memperbarui data timing lokal di `.artifacts/vitest-shard-timings.json`; proses whole-config berikutnya menggunakan timing tersebut untuk menyeimbangkan shard lambat dan cepat. Shard CI include-pattern menambahkan nama shard ke kunci timing, yang menjaga timing shard terfilter tetap terlihat tanpa mengganti data timing whole-config. Atur `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak timing lokal.
- File pengujian `plugin-sdk` dan `commands` terpilih kini dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, membiarkan kasus runtime-heavy tetap di lane yang sudah ada.
- File sumber dengan pengujian sibling dipetakan ke sibling tersebut sebelum fallback ke glob direktori yang lebih luas. Pengeditan helper di bawah `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, dan `src/plugins/contracts` menggunakan grafik impor lokal untuk menjalankan pengujian yang mengimpor, bukan menjalankan luas setiap shard ketika path dependensi presisi.
- `auto-reply` kini juga dibagi menjadi tiga config khusus (`core`, `top-level`, `reply`) sehingga harness balasan tidak mendominasi pengujian status/token/helper top-level yang lebih ringan.
- Config dasar Vitest kini default ke `pool: "threads"` dan `isolate: false`, dengan runner non-terisolasi bersama diaktifkan di seluruh config repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard ekstensi/plugin. Plugin channel berat, Plugin browser, dan OpenAI berjalan sebagai shard khusus; grup plugin lain tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane plugin bawaan.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + rincian impor Vitest, sembari tetap menggunakan perutean lane terskop untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profiling impor yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membenchmark path changed-mode yang dirutekan terhadap proses root-project native untuk diff git committed yang sama.
- `pnpm test:perf:changed:bench -- --worktree` membenchmark set perubahan worktree saat ini tanpa commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap config leaf Vitest full-suite secara serial dan menulis data durasi tergroup beserta artefak JSON/log per-config. Test Performance Agent menggunakan ini sebagai baseline sebelum mencoba perbaikan pengujian lambat.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: membandingkan laporan tergroup setelah perubahan yang berfokus pada performa.
- Integrasi Gateway: ikut serta melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan pengujian smoke end-to-end Gateway (pairing multi-instance WS/HTTP/node). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan atur `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan pengujian live provider (minimax/zai). Membutuhkan kunci API dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak dilewati.
- `pnpm test:docker:all`: Membangun image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, membangun/menggunakan ulang image runner Node/Git kosong serta image fungsional yang menginstal tarball tersebut ke `/app`, lalu menjalankan lane smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` melalui scheduler berbobot. Image kosong (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) digunakan untuk lane installer/update/plugin-dependency; lane tersebut memasang tarball prabangun, bukan menggunakan sumber repo yang disalin. Image fungsional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) digunakan untuk lane fungsionalitas built-app normal. `scripts/package-openclaw-for-docker.mjs` adalah satu-satunya packer package lokal/CI dan memvalidasi tarball serta `dist/postinstall-inventory.json` sebelum Docker mengonsumsinya. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana terpilih. `node scripts/test-docker-all.mjs --plan-json` menghasilkan rencana CI milik scheduler untuk lane terpilih, jenis image, kebutuhan package/live-image, skenario state, dan pemeriksaan kredensial tanpa membangun atau menjalankan Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` mengontrol slot proses dan default ke 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` mengontrol pool tail yang sensitif terhadap provider dan default ke 10. Batas lane berat default ke `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; batas provider default ke satu lane berat per provider melalui `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, dan `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gunakan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` untuk host yang lebih besar. Jika satu lane melebihi batas bobot atau sumber daya efektif pada host dengan paralelisme rendah, lane tersebut tetap dapat mulai dari pool kosong dan akan berjalan sendiri hingga melepas kapasitas. Start lane diberi jeda 2 detik secara default untuk menghindari lonjakan create daemon Docker lokal; override dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner melakukan preflight Docker secara default, membersihkan container E2E OpenClaw stale, memancarkan status active-lane setiap 30 detik, berbagi cache tool CLI provider antar lane yang kompatibel, mencoba ulang kegagalan transient live-provider sekali secara default (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), dan menyimpan timing lane di `.artifacts/docker-tests/lane-timings.json` untuk pengurutan longest-first pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifest lane tanpa menjalankan Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` untuk menyesuaikan output status, atau `OPENCLAW_DOCKER_ALL_TIMINGS=0` untuk menonaktifkan penggunaan ulang timing. Gunakan `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` hanya untuk lane deterministik/lokal atau `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` hanya untuk lane live-provider; alias package adalah `pnpm test:docker:local:all` dan `pnpm test:docker:live:all`. Mode live-only menggabungkan lane live main dan tail menjadi satu pool longest-first sehingga bucket provider dapat mengemas pekerjaan Claude, Codex, dan Gemini bersama-sama. Runner berhenti menjadwalkan lane pooled baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` diatur, dan setiap lane memiliki timeout fallback 120 menit yang dapat dioverride dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail terpilih menggunakan batas per-lane yang lebih ketat. Perintah penyiapan Docker backend CLI memiliki timeout sendiri melalui `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per-lane, `summary.json`, `failures.json`, dan timing fase ditulis di bawah `.artifacts/docker-tests/<run-id>/`; gunakan `pnpm test:docker:timings <summary.json>` untuk memeriksa lane lambat dan `pnpm test:docker:rerun <run-id|summary.json|failures.json>` untuk mencetak perintah rerun tertarget yang murah.
- `pnpm test:docker:browser-cdp-snapshot`: Membangun container E2E sumber berbasis Chromium, memulai CDP mentah plus Gateway terisolasi, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP menyertakan URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Probe Docker live backend CLI dapat dijalankan sebagai lane terfokus, misalnya `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, atau `pnpm test:docker:live-cli-backend:codex:mcp`. Claude dan Gemini memiliki alias `:resume` dan `:mcp` yang sesuai.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, masuk melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat terproksi nyata melalui `/api/chat/completions`. Membutuhkan kunci model live yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti rangkaian unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai container Gateway yang sudah diseed dan container klien kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi penemuan percakapan terutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, perutean pengiriman outbound, dan notifikasi channel + izin bergaya Claude melalui bridge stdio nyata. Assertion notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dipancarkan bridge.

## Gate PR lokal

Untuk pemeriksaan land/gate PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` gagal sesekali pada host yang sedang terbebani, jalankan ulang sekali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Tolok ukur latensi model (kunci lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: “Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan.”

Jalankan terakhir (2025-12-31, 20 kali):

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

Output mencakup `sampleCount`, rata-rata, p50, p95, min/maks, distribusi exit-code/sinyal, dan ringkasan RSS maksimum untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per proses jalan sehingga waktu dan pengambilan profil memakai harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke tertarget di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak suite lengkap di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini dengan fixture menggunakan `pnpm test:startup:bench:check`

## E2E onboarding (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk pengujian smoke onboarding berbasis kontainer.

Alur cold-start lengkap dalam kontainer Linux bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menjalankan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai Gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan helper runtime QR yang dikelola dimuat di runtime Docker Node yang didukung (default Node 24, kompatibel Node 22):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian langsung](/id/help/testing-live)
