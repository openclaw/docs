---
read_when:
    - Mengerjakan kode atau pengujian integrasi Pi
    - Menjalankan alur lint, typecheck, dan pengujian live khusus Pi
summary: 'Alur kerja developer untuk integrasi Pi: build, pengujian, dan validasi live'
title: Alur kerja pengembangan Pi
x-i18n:
    generated_at: "2026-04-24T09:16:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

Panduan ini merangkum alur kerja yang masuk akal untuk mengerjakan integrasi Pi di OpenClaw.

## Type Checking dan Linting

- Gate lokal default: `pnpm check`
- Gate build: `pnpm build` saat perubahan dapat memengaruhi output build, packaging, atau batas lazy-loading/modul
- Gate penuh sebelum landing untuk perubahan yang berat pada Pi: `pnpm check && pnpm test`

## Menjalankan Pengujian Pi

Jalankan kumpulan pengujian yang berfokus pada Pi langsung dengan Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Untuk menyertakan latihan provider live:

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

Untuk perilaku pemanggilan alat, beri prompt untuk tindakan `read` atau `exec` agar Anda dapat melihat streaming alat dan penanganan payload.

## Reset Clean Slate

Status berada di bawah direktori status OpenClaw. Default-nya adalah `~/.openclaw`. Jika `OPENCLAW_STATE_DIR` disetel, gunakan direktori itu sebagai gantinya.

Untuk mereset semuanya:

- `openclaw.json` untuk config
- `agents/<agentId>/agent/auth-profiles.json` untuk profil auth model (API key + OAuth)
- `credentials/` untuk status provider/saluran yang masih berada di luar penyimpanan profil auth
- `agents/<agentId>/sessions/` untuk riwayat sesi agen
- `agents/<agentId>/sessions/sessions.json` untuk indeks sesi
- `sessions/` jika path lama masih ada
- `workspace/` jika Anda menginginkan workspace kosong

Jika Anda hanya ingin mereset sesi, hapus `agents/<agentId>/sessions/` untuk agen tersebut. Jika Anda ingin mempertahankan auth, biarkan `agents/<agentId>/agent/auth-profiles.json` dan status provider apa pun di bawah `credentials/` tetap ada.

## Referensi

- [Pengujian](/id/help/testing)
- [Mulai](/id/start/getting-started)

## Terkait

- [Arsitektur integrasi Pi](/id/pi)
