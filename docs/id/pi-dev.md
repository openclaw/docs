---
read_when:
    - Mengerjakan kode atau test integrasi Pi
    - Menjalankan alur lint, typecheck, dan live test khusus Pi
summary: 'Alur kerja developer untuk integrasi Pi: build, test, dan validasi live'
title: Alur Kerja Pengembangan Pi
x-i18n:
    generated_at: "2026-04-05T13:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Alur Kerja Pengembangan Pi

Panduan ini merangkum alur kerja yang masuk akal untuk mengerjakan integrasi Pi di OpenClaw.

## Type Checking dan Linting

- Gate lokal default: `pnpm check`
- Gate build: `pnpm build` ketika perubahan dapat memengaruhi output build, packaging, atau batas lazy-loading/modul
- Gate landing penuh untuk perubahan yang banyak menyentuh Pi: `pnpm check && pnpm test`

## Menjalankan Test Pi

Jalankan set test yang berfokus pada Pi secara langsung dengan Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Untuk menyertakan pengujian provider live:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Ini mencakup suite unit Pi utama:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Pengujian Manual

Alur yang direkomendasikan:

- Jalankan gateway dalam mode dev:
  - `pnpm gateway:dev`
- Picu agen secara langsung:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Gunakan TUI untuk debugging interaktif:
  - `pnpm tui`

Untuk perilaku pemanggilan alat, berikan prompt untuk tindakan `read` atau `exec` agar Anda dapat melihat streaming alat dan penanganan payload.

## Reset Clean Slate

State berada di bawah direktori state OpenClaw. Default-nya adalah `~/.openclaw`. Jika `OPENCLAW_STATE_DIR` ditetapkan, gunakan direktori tersebut sebagai gantinya.

Untuk mereset semuanya:

- `openclaw.json` untuk konfigurasi
- `agents/<agentId>/agent/auth-profiles.json` untuk profile autentikasi model (API key + OAuth)
- `credentials/` untuk state provider/channel yang masih berada di luar penyimpanan profile autentikasi
- `agents/<agentId>/sessions/` untuk riwayat sesi agen
- `agents/<agentId>/sessions/sessions.json` untuk indeks sesi
- `sessions/` jika path lama masih ada
- `workspace/` jika Anda menginginkan workspace kosong

Jika Anda hanya ingin mereset sesi, hapus `agents/<agentId>/sessions/` untuk agen tersebut. Jika Anda ingin mempertahankan autentikasi, biarkan `agents/<agentId>/agent/auth-profiles.json` dan state provider apa pun di bawah `credentials/` tetap ada.

## Referensi

- [Testing](/help/testing)
- [Getting Started](/start/getting-started)
