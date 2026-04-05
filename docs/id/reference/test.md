---
read_when:
    - Menjalankan atau memperbaiki test
summary: Cara menjalankan test secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-05T14:06:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# Test

- Kit pengujian lengkap (suite, live, Docker): [Testing](/id/help/testing)

- `pnpm test:force`: Menghentikan proses gateway yang masih tersisa yang menahan port kontrol default, lalu menjalankan suite Vitest penuh dengan port gateway terisolasi agar test server tidak bertabrakan dengan instance yang sedang berjalan. Gunakan ini saat eksekusi gateway sebelumnya meninggalkan port 18789 dalam keadaan terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Threshold global adalah 70% untuk lines/branches/functions/statements. Cakupan mengecualikan entrypoint yang berat di integrasi (wiring CLI, bridge gateway/telegram, server statis webchat) agar target tetap fokus pada logika yang bisa diuji unit.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: menjalankan config proyek Vitest native dengan `--changed origin/main`. Config dasar memperlakukan file proyek/config sebagai `forceRerunTriggers` agar perubahan wiring tetap memicu rerun luas saat diperlukan.
- `pnpm test`: menjalankan config root projects Vitest native secara langsung. Filter file bekerja secara native di seluruh proyek yang dikonfigurasi.
- Config dasar Vitest sekarang default ke `pool: "threads"` dan `isolate: false`, dengan runner non-isolated bersama diaktifkan di seluruh config repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` menjalankan `vitest.extensions.config.ts`.
- `pnpm test:extensions`: menjalankan suite extension/plugin.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi import + rincian import Vitest untuk eksekusi root projects native.
- `pnpm test:perf:imports:changed`: profiling import yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk unit runner (`.artifacts/vitest-runner-profile`).
- Integrasi gateway: opt-in melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan test smoke end-to-end gateway (pairing multi-instance WS/HTTP/node). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan setel `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan test live provider (minimax/zai). Memerlukan API key dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak di-skip.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, login melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat proksi nyata melalui `/api/chat/completions`. Memerlukan model key live yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai container Gateway yang sudah diseed dan container klien kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi penemuan percakapan terarah, pembacaan transkrip, metadata lampiran, perilaku antrean event live, routing pengiriman keluar, serta notifikasi channel + izin gaya Claude melalui bridge stdio yang nyata. Asersi notifikasi Claude membaca frame MCP stdio mentah secara langsung agar smoke mencerminkan apa yang benar-benar dipancarkan bridge.

## Gate PR lokal

Untuk pemeriksaan land/gate PR lokal, jalankan:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` flake pada host yang sibuk, jalankan ulang sekali sebelum menganggapnya regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latensi model (key lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: “Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan.”

Eksekusi terakhir (2025-12-31, 20 run):

- minimax median 1279ms (min 1114, maks 2431)
- opus median 2454ms (min 1224, maks 3170)

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

Output mencakup `sampleCount`, avg, p50, p95, min/max, distribusi exit-code/signal, dan ringkasan RSS maksimum untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per run sehingga pencatatan waktu dan pengambilan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke yang ditargetkan ke `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak suite penuh ke `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini terhadap fixture dengan `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk test smoke onboarding dalam container.

Alur cold-start penuh di container Linux yang bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menggerakkan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan `qrcode-terminal` dimuat di runtime Node Docker yang didukung (Node 24 default, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```
