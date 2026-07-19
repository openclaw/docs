---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit plugin llama-cpp
summary: Inferensi teks dan embedding GGUF lokal melalui node-llama-cpp.
title: Plugin Llama Cpp
x-i18n:
    generated_at: "2026-07-19T05:12:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2756d4b3e00bbe37b4dedec1d54d28bfe6662e8105504317a402293254ce0240
    source_path: plugins/reference/llama-cpp.md
    workflow: 16
---

# Plugin Llama Cpp

Inferensi teks dan embedding GGUF lokal melalui node-llama-cpp.

## Distribusi

- Paket: `@openclaw/llama-cpp-provider`
- Rute instalasi: npm; ClawHub

## Permukaan

penyedia: `llama-cpp`; kontrak: `embeddingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Model teks default

Selama penyiapan interaktif, OpenClaw menawarkan Gemma 4 E4B IT Q4_K_M sebagai
unduhan bawaan berukuran sekitar 5.0 GB. Penawaran ini memerlukan setidaknya 16 GiB
RAM total. Model yang sudah tersimpan dalam cache tetap terdeteksi pada mesin yang lebih kecil.

Untuk menggunakan model lain, atur `params.modelPath` ke GGUF kustom apa pun. Model kustom
tidak tunduk pada persyaratan RAM untuk unduhan bawaan. Pada mesin yang tidak memenuhi
persyaratan, Anda juga dapat menjalankan model yang lebih kecil melalui Ollama atau LM Studio, atau
memilih penyedia cloud.

<!-- openclaw-plugin-reference:manual-end -->

## Dokumentasi terkait

- [llama-cpp](/id/plugins/llama-cpp)
