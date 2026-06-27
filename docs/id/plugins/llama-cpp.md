---
read_when:
    - Anda ingin embedding pencarian memori dari model GGUF lokal
    - Anda sedang mengonfigurasi memorySearch.provider = "local"
    - Anda memerlukan Plugin OpenClaw yang memiliki runtime node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Instal provider llama.cpp resmi untuk embedding memori GGUF lokal
title: Penyedia llama.cpp
x-i18n:
    generated_at: "2026-06-27T17:48:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` adalah plugin penyedia eksternal resmi untuk embedding GGUF lokal.
Plugin ini memiliki dependensi runtime `node-llama-cpp` yang digunakan oleh
`memorySearch.provider: "local"`.

Instal sebelum menggunakan embedding memori lokal:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Paket npm utama `openclaw` tidak menyertakan `node-llama-cpp`. Menyimpan
dependensi native di plugin ini mencegah pembaruan npm OpenClaw biasa
menghapus runtime yang diinstal secara manual di dalam direktori paket OpenClaw.

## Konfigurasi

Atur penyedia pencarian memori ke `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

Model default adalah `embeddinggemma-300m-qat-Q8_0.gguf`. Anda juga dapat mengarahkan
`local.modelPath` ke file `.gguf` lokal.

## Runtime Native

Gunakan Node 24 untuk jalur instalasi native yang paling lancar. Checkout sumber yang menggunakan pnpm
mungkin perlu menyetujui dan membangun ulang dependensi native:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Untuk embedding lokal dengan gesekan lebih rendah, gunakan penyedia layanan lokal seperti
Ollama atau LM Studio sebagai gantinya.
