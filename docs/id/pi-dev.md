---
read_when:
    - Mengerjakan kode atau pengujian integrasi Pi
    - Menjalankan alur lint, pemeriksaan tipe, dan pengujian langsung khusus Pi
summary: 'Alur kerja pengembang untuk integrasi Pi: kompilasi, pengujian, dan validasi langsung'
title: Alur kerja pengembangan Pi
x-i18n:
    generated_at: "2026-04-30T09:58:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

Alur kerja yang wajar untuk mengerjakan integrasi Pi di OpenClaw.

## Pemeriksaan tipe dan linting

- Gerbang lokal bawaan: `pnpm check`
- Gerbang build: `pnpm build` saat perubahan dapat memengaruhi output build, packaging, atau batas lazy-loading/module
- Gerbang landing penuh untuk perubahan berat Pi: `pnpm check && pnpm test`

## Menjalankan pengujian Pi

Jalankan set pengujian yang berfokus pada Pi secara langsung dengan Vitest:

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

## Pengujian manual

Alur yang disarankan:

- Jalankan Gateway dalam mode dev:
  - `pnpm gateway:dev`
- Picu agent secara langsung:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Gunakan TUI untuk debugging interaktif:
  - `pnpm tui`

Untuk perilaku pemanggilan tool, minta tindakan `read` atau `exec` agar Anda dapat melihat streaming tool dan penanganan payload.

## Reset dari keadaan bersih

State berada di bawah direktori state OpenClaw. Bawaannya adalah `~/.openclaw`. Jika `OPENCLAW_STATE_DIR` diatur, gunakan direktori tersebut sebagai gantinya.

Untuk mereset semuanya:

- `openclaw.json` untuk config
- `agents/<agentId>/agent/auth-profiles.json` untuk profil auth model (kunci API + OAuth)
- `credentials/` untuk state provider/channel yang masih berada di luar penyimpanan profil auth
- `agents/<agentId>/sessions/` untuk riwayat sesi agent
- `agents/<agentId>/sessions/sessions.json` untuk indeks sesi
- `sessions/` jika path legacy ada
- `workspace/` jika Anda menginginkan workspace kosong

Jika Anda hanya ingin mereset sesi, hapus `agents/<agentId>/sessions/` untuk agent tersebut. Jika Anda ingin mempertahankan auth, biarkan `agents/<agentId>/agent/auth-profiles.json` dan state provider apa pun di bawah `credentials/` tetap ada.

## Referensi

- [Pengujian](/id/help/testing)
- [Memulai](/id/start/getting-started)

## Terkait

- [Arsitektur integrasi Pi](/id/pi)
