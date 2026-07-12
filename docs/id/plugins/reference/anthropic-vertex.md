---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit plugin anthropic-vertex
summary: Plugin penyedia Anthropic Vertex OpenClaw untuk model Claude di Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-12T14:30:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin penyedia Anthropic Vertex OpenClaw untuk model Claude di Google Vertex AI.

## Distribusi

- Paket: `@openclaw/anthropic-vertex-provider`
- Jalur instalasi: npm; ClawHub

## Permukaan

penyedia: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Gunakan `anthropic-vertex/claude-fable-5` jika model tersebut tersedia di wilayah Google Cloud Anda.
Fable 5 selalu menggunakan pemikiran adaptif dan secara bawaan memakai upaya `high`. `/think off` dan
`/think minimal` menggunakan upaya `low` karena model tersebut tidak mendukung penonaktifan pemikiran.

## Claude Sonnet 5

Gunakan `anthropic-vertex/claude-sonnet-5` dengan endpoint `global`, `us`, atau `eu`
milik Vertex. Sonnet 5 secara bawaan menggunakan pemikiran adaptif dengan upaya `high` dan mendukung
`/think off` atau tingkat native `/think xhigh|max`. OpenClaw secara otomatis memublikasikan
jendela konteks 1.000.000 token dan batas keluaran 128.000 tokennya.

Harga katalog mengikuti tarif global perkenalan Vertex sebesar `$2/$10` per
juta token masukan/keluaran hingga 31 Agustus 2026, lalu `$3/$15` mulai
1 September. Endpoint multiwilayah `us` dan `eu` menggunakan
premi 10% yang didokumentasikan oleh Vertex.

<!-- openclaw-plugin-reference:manual-end -->
