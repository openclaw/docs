---
summary: 'Cara OpenClaw menyusun runtime agen bawaan: tata letak kode, batasan, manifes sumber daya, dan pemilihan runtime.'
title: Arsitektur runtime agen
x-i18n:
    generated_at: "2026-07-19T16:20:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e09ff21b4369a7c102db51e4458ad3ba1e86c9fe43a3a8bff72eef1713d2d51
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw memiliki runtime agen bawaan. Kode runtime berada di bawah `src/agents/`, transport model/penyedia berada di bawah `src/llm/`, dan kontrak untuk plugin diekspos melalui barrel `openclaw/plugin-sdk/*`.

## Tata Letak Runtime

| Jalur                               | Menangani                                                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Perulangan percobaan bawaan (`run.ts`, `run/`), pemilihan model dan normalisasi penyedia (`model*.ts`), parameter permintaan per penyedia (`extra-params.*`), compaction, serta pengkabelan transkrip dan sesi.                            |
| `src/agents/sessions/`              | Persistensi sesi (`session-manager.ts`), penemuan sumber daya (`package-manager.ts`, `resource-loader.ts`), pemuatan `extensions` dalam sesi, templat prompt, Skills, tema, dan perender alat berbasis TUI (`tools/`). |
| `packages/agent-core/`              | Inti agen yang dapat digunakan kembali (`@openclaw/agent-core`): perulangan agen, tipe harness, pesan, pembantu compaction, templat prompt, Skills, dan kontrak penyimpanan sesi.                                                           |
| `src/agents/runtime/`               | Fasad OpenClaw yang menghubungkan `@openclaw/agent-core` ke runtime LLM SDK plugin serta mengekspor ulang runtime tersebut beserta utilitas proksi lokal.                                                                                             |
| `src/agents/agent-tools*.ts`        | Definisi alat milik OpenClaw, skema parameter, kebijakan alat, adaptor sebelum/sesudah pemanggilan alat, serta alat pengeditan host/sandbox.                                                                                            |
| `src/agents/agent-hooks/`           | Hook runtime bawaan: perlindungan compaction, instruksi compaction, pemangkasan konteks.                                                                                                                                   |
| `src/agents/harness/`               | Registri harness, kebijakan pemilihan, dan siklus hidup untuk harness bawaan dan harness yang didaftarkan oleh plugin.                                                                                                                       |
| `src/llm/`                          | Registri model/penyedia, pembantu transport, dan implementasi stream khusus penyedia (`src/llm/providers/`).                                                                                                          |

## Batasan

Inti memanggil runtime bawaan melalui modul OpenClaw dan barrel SDK; tidak ada lagi paket kerangka kerja agen eksternal. Plugin menggunakan titik masuk `openclaw/plugin-sdk/*` yang terdokumentasi dan tidak mengimpor internal `src/**`.

`@earendil-works/pi-tui` tetap menjadi dependensi pihak ketiga: toolkit komponen terminal yang digunakan oleh TUI lokal dan perender alat sesi. Menginternalisasikannya akan menjadi upaya vendoring terpisah.

## Manifes

Paket sumber daya mendeklarasikan sumber daya OpenClaw dalam metadata `package.json`. Entri berupa jalur file atau glob yang relatif terhadap akar paket:

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

Jenis sumber daya yang tidak tercantum dalam manifes menggunakan penemuan direktori konvensional `extensions/`, `skills/`, `prompts/`, dan `themes/` sebagai mekanisme cadangan.

## Pemilihan Runtime

- ID runtime bawaan adalah `openclaw`. Alias lama `pi` dinormalisasi menjadi `openclaw`; `codex-app-server` dinormalisasi menjadi `codex`.
- Harness plugin mendaftarkan ID runtime tambahan (misalnya `codex`).
- Kebijakan runtime adalah konfigurasi `agentRuntime.id` yang dicakup per model/penyedia (entri model mengungguli entri penyedia). Nilai yang tidak ditetapkan atau `default` diresolusikan menjadi `auto`.
- `auto` memilih harness plugin terdaftar yang mendukung rute penyedia efektif; jika tidak, runtime bawaan OpenClaw digunakan. Awalan penyedia atau model saja tidak pernah memilih harness.
- OpenAI dapat memilih `codex` secara implisit hanya untuk rute HTTPS resmi Platform Responses atau ChatGPT Responses yang persis cocok tanpa penggantian permintaan yang dibuat secara eksplisit. Adaptor Completions, endpoint khusus, dan rute dengan perilaku permintaan yang dibuat secara eksplisit tetap menggunakan `openclaw`; endpoint HTTP teks biasa resmi ditolak. Lihat [runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).

## Generasi Runtime Model

Saat Gateway dimulai, konfigurasi, plugin, atau publikasi autentikasi membangun satu generasi runtime model yang telah disiapkan untuk setiap agen yang dikonfigurasi. Setiap generasi memiliki templat autentikasi yang ditemukan, registri model, dan katalog model yang diproyeksikan sebagai satu snapshot atomik. Proses agen membuat turunan penyimpanan autentikasi dan registri yang dapat diubah dari snapshot tersebut; jalur penelusuran, status, cron, doctor, TUI, PDF, dan gambar membaca katalog yang dipublikasikan alih-alih mengulangi penemuan sistem file.

Runtime tertanam mandiri memublikasikan bentuk snapshot yang sama pada batas aktivasinya. Generasi yang gagal atau kedaluwarsa tidak pernah disajikan bersamaan dengan generasi parsial yang lebih baru; pemilik siklus hidup harus terlebih dahulu memublikasikan pengganti yang lengkap.

## Terkait

- [Alur kerja runtime agen OpenClaw](/id/openclaw-agent-runtime)
- [Runtime agen](/id/concepts/agent-runtimes)
