---
read_when:
    - Mengerjakan kode runtime atau pengujian agen OpenClaw
    - Menjalankan alur lint, pemeriksaan tipe, dan pengujian langsung agent-runtime
summary: 'Alur kerja pengembang untuk runtime agen OpenClaw: build, pengujian, dan validasi langsung'
title: Alur kerja runtime agen OpenClaw
x-i18n:
    generated_at: "2026-07-16T18:13:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Alur kerja pengembang untuk runtime agen (`src/agents/`) di repo OpenClaw.

## Pemeriksaan tipe dan linting

- Gerbang lokal default: `pnpm check` (pemeriksaan tipe, linting, penjaga kebijakan)
- Gerbang build: `pnpm build` ketika perubahan dapat memengaruhi keluaran build, pengemasan, atau batas pemuatan lambat/modul
- Gerbang prapush lengkap: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Menjalankan Pengujian Runtime Agen

Jalankan rangkaian pengujian unit runtime agen:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Glob pertama juga mencakup rangkaian `agent-tools*`, `agent-settings`, dan
`agent-tool-definition-adapter*`.

Pengujian langsung dikecualikan dari konfigurasi unit; jalankan melalui
wrapper langsung (menetapkan `OPENCLAW_LIVE_TEST=1` dan memerlukan kredensial penyedia):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Pengujian manual

- Jalankan Gateway dalam mode pengembangan (melewati koneksi saluran melalui `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Picu satu giliran agen melalui Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- Gunakan TUI untuk penelusuran kesalahan interaktif: `pnpm tui`

Untuk perilaku pemanggilan alat, berikan prompt untuk tindakan `read` atau `exec` agar Anda dapat mengamati
streaming alat dan penanganan payload.

## Reset ke kondisi bersih

Status disimpan di direktori status OpenClaw: `~/.openclaw` secara default, atau
`$OPENCLAW_STATE_DIR` jika ditetapkan. Path relatif terhadap direktori tersebut:

| Path                                           | Berisi                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | Konfigurasi                                                        |
| `state/openclaw.sqlite`                        | Basis data status runtime bersama                                  |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Profil autentikasi model per agen (kunci API + OAuth) dan status runtime |
| `credentials/`                                 | Kredensial penyedia/saluran di luar penyimpanan profil autentikasi |
| `agents/<agentId>/sessions/`                   | Riwayat transkrip dan sumber migrasi sesi lama                     |
| `sessions/`                                    | Penyimpanan sesi satu agen lama (khusus instalasi lama)            |
| `workspace/`                                   | Ruang kerja agen default (agen tambahan menggunakan `workspace-<agentId>`)   |

Hapus path tersebut untuk melakukan reset penuh. Reset yang lebih terbatas:

- Khusus sesi: jangan hapus `agents/<agentId>/agent/openclaw-agent.sqlite`; baris sesi disimpan di sana bersama status per agen lainnya. Gunakan `/new` atau `/reset` untuk memulai sesi baru bagi satu obrolan, dan `openclaw sessions cleanup` untuk pemeliharaan sesi.
- Pertahankan autentikasi: biarkan `agents/<agentId>/agent/openclaw-agent.sqlite` dan `credentials/` tetap di tempatnya.

File `auth-profiles.json` lama tidak lagi dibaca saat runtime;
`openclaw doctor --fix` mengimpornya ke penyimpanan SQLite.

## Referensi

- [Pengujian](/id/help/testing)
- [Memulai](/id/start/getting-started)

## Terkait

- [Arsitektur runtime agen OpenClaw](/id/agent-runtime-architecture)
