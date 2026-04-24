---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-04-24T09:27:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- Kit pengujian lengkap (suite, live, Docker): [Pengujian](/id/help/testing)

- `pnpm test:force`: Membunuh proses Gateway yang masih tersisa yang menahan port control default, lalu menjalankan suite Vitest penuh dengan port Gateway terisolasi agar pengujian server tidak bentrok dengan instance yang sedang berjalan. Gunakan ini saat eksekusi Gateway sebelumnya meninggalkan port 18789 dalam keadaan terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gate cakupan unit untuk file yang dimuat, bukan cakupan semua file seluruh repo. Ambang batasnya 70% lines/functions/statements dan 55% branches. Karena `coverage.all` bernilai false, gate mengukur file yang dimuat oleh suite cakupan unit alih-alih memperlakukan setiap file sumber split-lane sebagai tidak tercakup.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: memperluas path git yang berubah ke lane Vitest yang dicakup ketika diff hanya menyentuh file source/test yang dapat dirutekan. Perubahan config/setup tetap kembali ke eksekusi root project native sehingga edit wiring tetap menjalankan ulang secara luas bila diperlukan.
- `pnpm changed:lanes`: menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan smart changed gate untuk diff terhadap `origin/main`. Perintah ini menjalankan pekerjaan core dengan lane pengujian core, pekerjaan extension dengan lane pengujian extension, pekerjaan test-only hanya dengan typecheck/tests test, memperluas perubahan Plugin SDK publik atau kontrak plugin ke satu pass validasi extension, dan menjaga version bump yang hanya metadata rilis tetap pada pemeriksaan terarah untuk version/config/root-dependency.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest yang dicakup. Eksekusi tanpa target menggunakan grup shard tetap dan diperluas ke leaf config untuk eksekusi paralel lokal; grup extension selalu diperluas ke config shard per-extension alih-alih satu proses root-project raksasa.
- Eksekusi shard penuh dan extension memperbarui data timing lokal di `.artifacts/vitest-shard-timings.json`; eksekusi berikutnya menggunakan timing tersebut untuk menyeimbangkan shard yang lambat dan cepat. Setel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak timing lokal.
- File pengujian `plugin-sdk` dan `commands` tertentu kini dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, sehingga kasus runtime-heavy tetap berada di lane yang sudah ada.
- File source helper `plugin-sdk` dan `commands` tertentu juga memetakan `pnpm test:changed` ke pengujian sibling eksplisit di lane ringan tersebut, sehingga edit helper kecil menghindari menjalankan ulang suite berat yang didukung runtime.
- `auto-reply` kini juga dipecah menjadi tiga config khusus (`core`, `top-level`, `reply`) sehingga harness balasan tidak mendominasi pengujian status/token/helper tingkat atas yang lebih ringan.
- Konfigurasi dasar Vitest sekarang default ke `pool: "threads"` dan `isolate: false`, dengan runner non-isolated bersama diaktifkan di seluruh config repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard extension/plugin. Plugin channel berat, browser Plugin, dan OpenAI berjalan sebagai shard khusus; grup plugin lainnya tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane Plugin bundled.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi import + rincian import Vitest, sambil tetap menggunakan routing lane yang dicakup untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profil import yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan jalur changed-mode yang dirutekan dengan eksekusi root-project native untuk diff git committed yang sama.
- `pnpm test:perf:changed:bench -- --worktree` membandingkan himpunan perubahan worktree saat ini tanpa commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis CPU profile untuk main thread Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis CPU + heap profile untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap leaf config Vitest full-suite secara serial dan menulis data durasi yang dikelompokkan plus artefak JSON/log per-config. Test Performance Agent menggunakan ini sebagai baseline sebelum mencoba perbaikan pengujian lambat.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: membandingkan laporan berkelompok setelah perubahan yang berfokus pada performa.
- Integrasi Gateway: opt-in melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan smoke test end-to-end Gateway (WS/HTTP multi-instance/node pairing). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; atur dengan `OPENCLAW_E2E_WORKERS=<n>` dan setel `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan live test provider (minimax/zai). Memerlukan API key dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) untuk membuka skip.
- `pnpm test:docker:all`: Membangun image live-test bersama dan image Docker E2E sekali, lalu menjalankan lane smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` pada konkurensi 8 secara default. Atur pool utama dengan `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` dan tail pool sensitif provider dengan `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; keduanya default ke 8. Awal lane diberi jeda 2 detik secara default untuk menghindari create storm pada daemon Docker lokal; timpa dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner berhenti menjadwalkan lane pooled baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` disetel, dan setiap lane memiliki timeout 120 menit yang dapat ditimpa dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Log per-lane ditulis di bawah `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, login melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat proxied nyata melalui `/api/chat/completions`. Memerlukan key model live yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil untuk CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai container Gateway yang sudah disemai dan container klien kedua yang men-spawn `openclaw mcp serve`, lalu memverifikasi discovery percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, routing pengiriman keluar, dan notifikasi gaya Claude untuk channel + izin melalui bridge stdio nyata. Asersi notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dipancarkan bridge.

## Gate PR lokal

Untuk pemeriksaan gate/land PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` flaky pada host yang sibuk, jalankan ulang sekali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host yang terbatas memori, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latensi model (key lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: “Reply with a single word: ok. No punctuation or extra text.”

Eksekusi terakhir (2025-12-31, 20 eksekusi):

- median minimax 1279ms (min 1114, maks 2431)
- median opus 2454ms (min 1224, maks 3170)

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

Output mencakup `sampleCount`, avg, p50, p95, min/maks, distribusi exit-code/signal, dan ringkasan RSS maksimum untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per eksekusi sehingga penangkapan timing dan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke yang ditargetkan di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak full-suite di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini terhadap fixture dengan `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk smoke test onboarding dalam container.

Alur cold-start penuh dalam container Linux yang bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menggerakkan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai Gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan helper runtime QR yang dipelihara dimuat di runtime Node Docker yang didukung (default Node 24, kompatibel Node 22):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian live](/id/help/testing-live)
