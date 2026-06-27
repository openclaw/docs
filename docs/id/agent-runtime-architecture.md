---
summary: Bagaimana OpenClaw menjalankan runtime agen bawaan, penyedia, sesi, alat, dan ekstensi.
title: Arsitektur runtime agen
x-i18n:
    generated_at: "2026-06-27T17:08:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw memiliki runtime agen bawaan secara langsung. Kode runtime berada di bawah `src/agents/`, helper model/penyedia berada di bawah `src/llm/`, dan kontrak yang ditujukan untuk Plugin diekspos melalui barrel `openclaw/plugin-sdk/*`.

## Tata Letak Runtime

- `src/agents/embedded-agent-runner/`: loop percobaan agen bawaan, adapter stream penyedia, Compaction, pemilihan model, dan penghubungan sesi.
- `src/agents/sessions/`: persistensi sesi, pemuatan ekstensi, penemuan sumber daya, Skills, prompt, tema, dan perender tool berbasis TUI.
- `packages/agent-core/`: inti agen yang dapat digunakan ulang, tipe harness tingkat lebih rendah, pesan, helper Compaction, templat prompt, dan kontrak tool/sesi.
- `src/agents/runtime/`: facade OpenClaw untuk `@openclaw/agent-core` serta utilitas proxy lokal.
- `src/agents/agent-tools*.ts`: definisi tool, skema, kebijakan, adapter hook sebelum/sesudah, dan dukungan pengeditan host yang dimiliki OpenClaw.
- `src/agents/agent-hooks/`: hook runtime bawaan seperti perlindungan Compaction dan pemangkasan konteks.
- `src/llm/`: registri model/penyedia, helper transport, dan implementasi stream khusus penyedia.

## Batasan

Kode inti memanggil runtime bawaan melalui modul OpenClaw dan barrel SDK, bukan melalui paket agen eksternal lama. Plugin menggunakan entrypoint `openclaw/plugin-sdk/*` yang terdokumentasi dan tidak mengimpor internal `src/**`.

`@earendil-works/pi-tui` tetap menjadi dependensi TUI pihak ketiga. Dependensi ini digunakan sebagai toolkit komponen terminal oleh TUI lokal dan perender sesi; menginternalisasikannya akan menjadi upaya vendoring terpisah.

## Manifes

Paket sumber daya mendeklarasikan sumber daya OpenClaw dalam metadata paket:

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

Manajer paket juga menemukan direktori konvensional `extensions/`, `skills/`, `prompts/`, dan `themes/`.

## Pemilihan Runtime

ID runtime bawaan default adalah `openclaw`. Harness Plugin dapat mendaftarkan ID runtime tambahan. `auto` memilih harness Plugin yang mendukung ketika ada, dan jika tidak, menggunakan runtime OpenClaw bawaan.

## Terkait

- [Alur kerja runtime agen OpenClaw](/id/openclaw-agent-runtime)
- [Runtime agen](/id/concepts/agent-runtimes)
