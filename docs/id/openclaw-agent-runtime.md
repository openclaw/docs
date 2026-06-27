---
read_when:
    - Bekerja pada kode atau pengujian runtime agen OpenClaw
    - Menjalankan alur lint, typecheck, dan pengujian live agent-runtime
summary: 'Alur kerja developer untuk runtime agen OpenClaw: build, pengujian, dan validasi langsung'
title: Alur kerja runtime agen OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:41:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Alur kerja yang wajar untuk mengerjakan runtime agen OpenClaw di OpenClaw.

## Pemeriksaan tipe dan linting

- Gerbang lokal default: `pnpm check`
- Gerbang build: `pnpm build` ketika perubahan dapat memengaruhi output build, pengemasan, atau batas lazy-loading/modul
- Gerbang landing penuh untuk perubahan runtime agen: `pnpm check && pnpm test`

## Menjalankan Pengujian Runtime Agen

Jalankan set pengujian runtime agen secara langsung dengan Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Untuk menyertakan latihan penyedia live:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Ini mencakup rangkaian pengujian unit runtime agen utama:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Pengujian manual

Alur yang disarankan:

- Jalankan Gateway dalam mode dev:
  - `pnpm gateway:dev`
- Picu agen secara langsung:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Gunakan TUI untuk debugging interaktif:
  - `pnpm tui`

Untuk perilaku pemanggilan alat, minta tindakan `read` atau `exec` agar Anda dapat melihat streaming alat dan penanganan payload.

## Reset dari kondisi bersih

State berada di bawah direktori state OpenClaw. Default-nya adalah `~/.openclaw`. Jika `OPENCLAW_STATE_DIR` diatur, gunakan direktori tersebut sebagai gantinya.

Untuk mereset semuanya:

- `openclaw.json` untuk konfigurasi
- `agents/<agentId>/agent/auth-profiles.json` untuk profil autentikasi model (kunci API + OAuth)
- `credentials/` untuk state penyedia/channel yang masih berada di luar penyimpanan profil autentikasi
- `agents/<agentId>/sessions/` untuk riwayat sesi agen
- `agents/<agentId>/sessions/sessions.json` untuk indeks sesi
- `sessions/` jika jalur legacy ada
- `workspace/` jika Anda menginginkan workspace kosong

Jika Anda hanya ingin mereset sesi, hapus `agents/<agentId>/sessions/` untuk agen tersebut. Jika Anda ingin mempertahankan autentikasi, biarkan `agents/<agentId>/agent/auth-profiles.json` dan state penyedia apa pun di bawah `credentials/` tetap ada.

## Referensi

- [Pengujian](/id/help/testing)
- [Memulai](/id/start/getting-started)

## Terkait

- [Arsitektur runtime agen OpenClaw](/id/agent-runtime-architecture)
