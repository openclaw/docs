---
read_when:
    - Menjalankan atau memperbaiki test
summary: Cara menjalankan test secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Tests
x-i18n:
    generated_at: "2026-04-26T11:38:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- Kit pengujian lengkap (suite, live, Docker): [Testing](/id/help/testing)

- `pnpm test:force`: Membunuh proses gateway yang masih tertinggal dan menahan port kontrol default, lalu menjalankan suite Vitest penuh dengan port gateway terisolasi agar test server tidak bertabrakan dengan instance yang sedang berjalan. Gunakan ini ketika proses gateway sebelumnya meninggalkan port 18789 tetap terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gate cakupan unit untuk file yang dimuat, bukan cakupan semua-file seluruh repo. Ambangnya adalah 70% lines/functions/statements dan 55% branches. Karena `coverage.all` bernilai false, gate ini mengukur file yang dimuat oleh suite cakupan unit alih-alih memperlakukan setiap file sumber split-lane sebagai tidak tercakup.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: memperluas path git yang berubah menjadi lane Vitest bercakupan saat diff hanya menyentuh file source/test yang dapat dirutekan. Perubahan config/setup tetap fallback ke proses proyek root native agar edit wiring menjalankan ulang secara luas saat diperlukan.
- `pnpm test:changed:focused`: proses test changed untuk inner-loop. Ini hanya menjalankan target presisi dari edit test langsung, file sibling `*.test.ts`, mapping source eksplisit, dan graph import lokal. Perubahan luas/config/package dilewati alih-alih diperluas ke fallback changed-test penuh.
- `pnpm changed:lanes`: menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan gate changed pintar untuk diff terhadap `origin/main`. Ini menjalankan pekerjaan core dengan lane test core, pekerjaan extension dengan lane test extension, pekerjaan hanya-test dengan hanya typecheck/tests test, memperluas perubahan public Plugin SDK atau kontrak plugin ke satu proses validasi extension, dan menjaga bump versi yang hanya metadata rilis pada pemeriksaan versi/config/dependensi root yang ditargetkan.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest bercakupan. Proses tanpa target menggunakan grup shard tetap dan diperluas ke leaf config untuk eksekusi paralel lokal; grup extension selalu diperluas ke config shard per-extension alih-alih satu proses root-project raksasa.
- Proses shard penuh, extension, dan include-pattern memperbarui data timing lokal di `.artifacts/vitest-shard-timings.json`; proses seluruh-config berikutnya menggunakan timing tersebut untuk menyeimbangkan shard lambat dan cepat. Shard CI include-pattern menambahkan nama shard ke kunci timing, yang menjaga timing shard terfilter tetap terlihat tanpa menggantikan data timing seluruh-config. Atur `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak timing lokal.
- File test `plugin-sdk` dan `commands` tertentu kini dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus yang berat di runtime tetap berada di lane yang sudah ada.
- File source dengan test sibling dipetakan ke sibling tersebut sebelum fallback ke glob direktori yang lebih luas. Edit helper di bawah `test/helpers/channels` dan `test/helpers/plugins` menggunakan graph import lokal untuk menjalankan test yang mengimpor alih-alih menjalankan luas setiap shard ketika path dependensinya presisi.
- `auto-reply` kini juga terpecah menjadi tiga config khusus (`core`, `top-level`, `reply`) sehingga harness reply tidak mendominasi test status/token/helper tingkat atas yang lebih ringan.
- Config Vitest dasar kini default ke `pool: "threads"` dan `isolate: false`, dengan runner non-isolated bersama diaktifkan di seluruh config repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard extension/plugin. Plugin channel berat, plugin browser, dan OpenAI berjalan sebagai shard khusus; grup plugin lain tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane plugin bawaan.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi import + rincian import Vitest, sambil tetap menggunakan perutean lane bercakupan untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profil import yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membenchmark jalur mode changed yang dirutekan terhadap proses root-project native untuk diff git ter-commit yang sama.
- `pnpm test:perf:changed:bench -- --worktree` membenchmark set perubahan worktree saat ini tanpa commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk main thread Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap leaf config Vitest full-suite secara serial dan menulis data durasi yang dikelompokkan plus artefak JSON/log per-config. Test Performance Agent menggunakan ini sebagai baseline sebelum mencoba perbaikan slow-test.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: membandingkan laporan terkelompok setelah perubahan yang berfokus pada performa.
- Integrasi gateway: opt-in melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan smoke test end-to-end gateway (pairing WS/HTTP/node multi-instance). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan atur `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan live test provider (minimax/zai). Memerlukan API key dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) untuk membatalkan skip.
- `pnpm test:docker:all`: Membangun shared live-test image dan Docker E2E image satu kali, lalu menjalankan lane smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` melalui scheduler berbobot. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` mengontrol slot proses dan default-nya 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` mengontrol pool tail yang sensitif provider dan default-nya 10. Batas lane berat default ke `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; batas provider default ke satu lane berat per provider melalui `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, dan `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gunakan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` untuk host yang lebih besar. Start lane diberi jeda 2 detik secara default untuk menghindari badai create pada daemon Docker lokal; timpa dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner melakukan preflight Docker secara default, membersihkan container OpenClaw E2E basi, mengeluarkan status active-lane setiap 30 detik, membagikan cache tool CLI provider di antara lane yang kompatibel, mencoba ulang kegagalan live-provider sementara sekali secara default (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), dan menyimpan timing lane di `.artifacts/docker-tests/lane-timings.json` untuk pengurutan longest-first pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane tanpa menjalankan Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` untuk menyesuaikan output status, atau `OPENCLAW_DOCKER_ALL_TIMINGS=0` untuk menonaktifkan penggunaan ulang timing. Gunakan `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` hanya untuk lane deterministik/lokal atau `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` hanya untuk lane live-provider; alias paketnya adalah `pnpm test:docker:local:all` dan `pnpm test:docker:live:all`. Mode live-only menggabungkan lane live main dan tail menjadi satu pool longest-first sehingga bucket provider dapat mengemas pekerjaan Claude, Codex, dan Gemini bersama-sama. Runner berhenti menjadwalkan lane pool baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` diatur, dan setiap lane memiliki timeout fallback 120 menit yang dapat ditimpa dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail tertentu menggunakan batas per-lane yang lebih ketat. Perintah setup Docker backend CLI memiliki timeout tersendiri melalui `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per-lane ditulis di bawah `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: Membangun container source E2E berbasis Chromium, memulai CDP mentah plus Gateway terisolasi, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL link, clickables yang dipromosikan oleh kursor, referensi iframe, dan metadata frame.
- Probe Docker live backend CLI dapat dijalankan sebagai lane terfokus, misalnya `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, atau `pnpm test:docker:live-cli-backend:codex:mcp`. Claude dan Gemini memiliki alias `:resume` dan `:mcp` yang sepadan.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, login melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat proksi nyata melalui `/api/chat/completions`. Memerlukan live model key yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai seeded Gateway container dan container klien kedua yang men-spawn `openclaw mcp serve`, lalu memverifikasi discovery percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, perutean pengiriman keluar, dan notifikasi channel + izin bergaya Claude melalui jembatan stdio nyata. Assertion notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dikeluarkan jembatan.

## Gate PR lokal

Untuk pemeriksaan gate/land PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` flake pada host yang sibuk, jalankan ulang sekali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latensi model (key lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: “Reply with a single word: ok. No punctuation or extra text.”

Proses terakhir (2025-12-31, 20 kali):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## Benchmark startup CLI

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: kedua preset

Output mencakup `sampleCount`, avg, p50, p95, min/max, distribusi exit-code/signal, dan ringkasan max RSS untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per proses sehingga pengambilan timing dan profil menggunakan harness yang sama.

Konvensi output yang disimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke yang ditargetkan di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak full-suite di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini terhadap fixture dengan `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk smoke test onboarding dalam container.

Alur cold-start penuh di container Linux yang bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menggerakkan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan helper runtime QR yang dipelihara dimuat di runtime Node Docker yang didukung (default Node 24, kompatibel Node 22):

```bash
pnpm test:docker:qr
```

## Terkait

- [Testing](/id/help/testing)
- [Testing live](/id/help/testing-live)
