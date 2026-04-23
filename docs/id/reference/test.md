---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (`vitest`) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-04-23T13:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Pengujian

- Kit pengujian lengkap (suite, live, Docker): [Pengujian](/id/help/testing)

- `pnpm test:force`: Menghentikan proses gateway yang masih tertinggal dan menahan port kontrol default, lalu menjalankan suite Vitest lengkap dengan port gateway terisolasi agar pengujian server tidak berbenturan dengan instance yang sedang berjalan. Gunakan ini saat proses gateway sebelumnya membuat port 18789 tetap terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gate cakupan unit untuk file yang dimuat, bukan cakupan semua file di seluruh repo. Ambangnya adalah 70% lines/functions/statements dan 55% branches. Karena `coverage.all` bernilai false, gate ini mengukur file yang dimuat oleh suite cakupan unit alih-alih menganggap setiap file sumber split-lane sebagai tidak tercakup.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: memperluas path git yang berubah menjadi lane Vitest terbatas ketika diff hanya menyentuh file source/test yang bisa dirutekan. Perubahan config/setup tetap kembali ke native root projects run agar perubahan wiring menjalankan ulang cakupan luas saat diperlukan.
- `pnpm changed:lanes`: menampilkan lane arsitektur yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan gate perubahan pintar untuk diff terhadap `origin/main`. Ini menjalankan pekerjaan core dengan lane pengujian core, pekerjaan extension dengan lane pengujian extension, pekerjaan khusus pengujian hanya dengan typecheck/pengujian pengujian, memperluas perubahan public Plugin SDK atau plugin-contract ke validasi extension, dan menjaga version bump yang hanya berupa metadata rilis pada pemeriksaan version/config/root-dependency yang terarah.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest terbatas. Eksekusi tanpa target menggunakan kelompok shard tetap dan diperluas ke leaf configs untuk eksekusi paralel lokal; kelompok extension selalu diperluas ke config shard per-extension, bukan satu proses root-project besar.
- Eksekusi shard penuh dan extension memperbarui data timing lokal di `.artifacts/vitest-shard-timings.json`; eksekusi berikutnya menggunakan timing tersebut untuk menyeimbangkan shard lambat dan cepat. Setel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak timing lokal.
- File pengujian `plugin-sdk` dan `commands` tertentu kini dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus yang berat saat runtime tetap berada di lane yang sudah ada.
- File source helper `plugin-sdk` dan `commands` tertentu juga memetakan `pnpm test:changed` ke pengujian sibling eksplisit di lane ringan tersebut, sehingga perubahan helper kecil tidak memicu ulang suite berat yang didukung runtime.
- `auto-reply` kini juga dibagi menjadi tiga config khusus (`core`, `top-level`, `reply`) agar harness reply tidak mendominasi pengujian status/token/helper top-level yang lebih ringan.
- Config dasar Vitest kini menggunakan default `pool: "threads"` dan `isolate: false`, dengan runner bersama non-isolated diaktifkan di seluruh config repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard extension/plugin. Extension channel berat dan OpenAI berjalan sebagai shard khusus; kelompok extension lain tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane plugin bawaan.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi import + rincian import Vitest, sambil tetap menggunakan perutean lane terbatas untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profiling import yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membenchmark path mode changed yang dirutekan terhadap native root-project run untuk diff git ter-commit yang sama.
- `pnpm test:perf:changed:bench -- --worktree` membenchmark set perubahan worktree saat ini tanpa perlu commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- Integrasi Gateway: opt-in melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan smoke test end-to-end gateway (pairing multi-instance WS/HTTP/node). Default menggunakan `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan setel `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan pengujian live provider (minimax/zai). Memerlukan API key dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak di-skip.
- `pnpm test:docker:all`: Membangun image live-test bersama dan image Docker E2E satu kali, lalu menjalankan lane smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` pada konkurensi 4 secara default. Sesuaikan dengan `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Runner berhenti menjadwalkan lane pooled baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` disetel, dan setiap lane memiliki timeout 120 menit yang dapat dioverride dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lane yang sensitif terhadap startup atau provider dijalankan secara eksklusif setelah pool paralel. Log per-lane ditulis di bawah `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: Menjalankan OpenClaw + Open WebUI dalam Docker, masuk melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat proxied nyata melalui `/api/chat/completions`. Memerlukan live model key yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Menjalankan container Gateway yang sudah disemai dan container klien kedua yang memunculkan `openclaw mcp serve`, lalu memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, perutean pengiriman keluar, serta notifikasi channel + izin bergaya Claude melalui bridge stdio nyata. Asersi notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke test mencerminkan apa yang benar-benar dipancarkan oleh bridge.

## Gate PR lokal

Untuk pemeriksaan land/gate PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` flake pada host yang sibuk, jalankan ulang sekali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan keterbatasan memori, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latensi model (key lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: “Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan.”

Eksekusi terakhir (2025-12-31, 20 kali):

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

Output mencakup `sampleCount`, avg, p50, p95, min/max, distribusi exit-code/signal, dan ringkasan RSS maksimum untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per eksekusi sehingga pengambilan timing dan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke terarah di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak suite penuh di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini terhadap fixture dengan `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk smoke test onboarding dalam container.

Alur cold-start penuh dalam container Linux bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menjalankan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai gateway dan menjalankan `openclaw health`.

## Smoke test impor QR (Docker)

Memastikan `qrcode-terminal` dimuat di runtime Docker Node yang didukung (default Node 24, kompatibel dengan Node 22):

```bash
pnpm test:docker:qr
```
