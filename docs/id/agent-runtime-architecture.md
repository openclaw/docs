---
summary: 'Cara OpenClaw menyusun runtime agen bawaan: tata letak kode, batasan, manifes sumber daya, dan pemilihan runtime.'
title: Arsitektur runtime agen
x-i18n:
    generated_at: "2026-07-16T17:44:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw memiliki runtime agen bawaan. Kode runtime berada di bawah `src/agents/`, transport model/penyedia berada di bawah `src/llm/`, dan kontrak yang ditujukan untuk plugin diekspos melalui barrel `openclaw/plugin-sdk/*`.

## Tata Letak Runtime

| Jalur                               | Mencakup                                                                                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Perulangan percobaan bawaan (`run.ts`, `run/`), pemilihan model dan normalisasi penyedia (`model*.ts`), parameter permintaan per penyedia (`extra-params.*`), Compaction, pengawatan transkrip dan sesi.                            |
| `src/agents/sessions/`              | Persistensi sesi (`session-manager.ts`), penemuan sumber daya (`package-manager.ts`, `resource-loader.ts`), pemuatan `extensions` dalam sesi, templat prompt, Skills, tema, dan perender alat berbasis TUI (`tools/`). |
| `packages/agent-core/`              | Inti agen yang dapat digunakan kembali (`@openclaw/agent-core`): perulangan agen, tipe harness, pesan, pembantu Compaction, templat prompt, Skills, dan kontrak penyimpanan sesi.                                                           |
| `src/agents/runtime/`               | Fasad OpenClaw yang menghubungkan `@openclaw/agent-core` ke runtime LLM SDK plugin serta mengekspor ulang runtime tersebut beserta utilitas proksi lokal.                                                                                             |
| `src/agents/agent-tools*.ts`        | Definisi alat milik OpenClaw, skema parameter, kebijakan alat, adaptor sebelum/setelah pemanggilan alat, serta alat penyuntingan host/sandbox.                                                                                            |
| `src/agents/agent-hooks/`           | Hook runtime bawaan: perlindungan Compaction, instruksi Compaction, pemangkasan konteks.                                                                                                                                   |
| `src/agents/harness/`               | Registri harness, kebijakan pemilihan, dan siklus hidup untuk harness bawaan serta harness yang didaftarkan oleh plugin.                                                                                                                       |
| `src/llm/`                          | Registri model/penyedia, pembantu transport, dan implementasi aliran khusus penyedia (`src/llm/providers/`).                                                                                                          |

## Batasan

Inti memanggil runtime bawaan melalui modul OpenClaw dan barrel SDK; tidak ada lagi paket kerangka kerja agen eksternal. Plugin menggunakan titik masuk `openclaw/plugin-sdk/*` yang terdokumentasi dan tidak mengimpor internal `src/**`.

`@earendil-works/pi-tui` tetap menjadi dependensi pihak ketiga: toolkit komponen terminal yang digunakan oleh TUI lokal dan perender alat sesi. Menginternalisasikannya akan menjadi upaya vendorisasi tersendiri.

## Manifes

Paket sumber daya mendeklarasikan sumber daya OpenClaw dalam metadata `package.json`. Entri berupa jalur berkas atau glob yang relatif terhadap akar paket:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Jenis sumber daya yang tidak tercantum dalam manifes akan kembali menggunakan penemuan direktori konvensional `extensions/`, `skills/`, `prompts/`, dan `themes/`.

## Pemilihan Runtime

- ID runtime bawaan adalah `openclaw`. Alias lama `pi` dinormalisasi menjadi `openclaw`; `codex-app-server` dinormalisasi menjadi `codex`.
- Harness plugin mendaftarkan ID runtime tambahan (misalnya `codex`).
- Kebijakan runtime adalah konfigurasi `agentRuntime.id` yang tercakup pada model/penyedia (entri model lebih diprioritaskan daripada entri penyedia). Nilai yang tidak ditetapkan atau `default` diubah menjadi `auto`.
- `auto` memilih harness plugin terdaftar yang mendukung rute penyedia efektif; jika tidak, runtime bawaan OpenClaw yang dipilih. Prefiks penyedia atau model saja tidak pernah memilih harness.
- OpenAI dapat memilih `codex` secara implisit hanya untuk rute resmi HTTPS Platform Responses atau ChatGPT Responses yang sama persis tanpa penggantian permintaan yang dibuat pengguna. Adaptor Completions, titik akhir khusus, dan rute dengan perilaku permintaan yang dibuat pengguna tetap menggunakan `openclaw`; titik akhir HTTP teks biasa resmi ditolak. Lihat [runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).

## Terkait

- [Alur kerja runtime agen OpenClaw](/id/openclaw-agent-runtime)
- [Runtime agen](/id/concepts/agent-runtimes)
