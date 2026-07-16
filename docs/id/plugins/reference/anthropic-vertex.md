---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit plugin anthropic-vertex
summary: Plugin penyedia Anthropic Vertex OpenClaw untuk model Claude di Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-16T18:26:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin penyedia Anthropic Vertex OpenClaw untuk model Claude di Google Vertex AI.

## Distribusi

- Paket: `@openclaw/anthropic-vertex-provider`
- Rute instalasi: npm; ClawHub

## Permukaan

penyedia: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Gunakan `anthropic-vertex/claude-fable-5` jika model tersedia di region Google Cloud Anda.
Fable 5 selalu menggunakan pemikiran adaptif dan secara default memakai upaya `high`. `/think off` dan
`/think minimal` menggunakan upaya `low` karena model tidak mendukung penonaktifan pemikiran.

## Claude Sonnet 5

Gunakan `anthropic-vertex/claude-sonnet-5` dengan endpoint `global`, `us`, atau `eu`
milik Vertex. Sonnet 5 secara default menggunakan pemikiran adaptif dengan upaya `high` dan mendukung
`/think off` atau tingkat bawaan `/think xhigh|max`. OpenClaw memublikasikan
jendela konteks 1.000.000 token dan batas keluaran 128.000 token secara otomatis.

Harga katalog mengikuti tarif global perkenalan Vertex sebesar `$2/$10` per
juta token masukan/keluaran hingga 31 Agustus 2026, lalu `$3/$15` mulai
1 September. Endpoint multi-region `us` dan `eu` menggunakan
premi 10% yang didokumentasikan Vertex.

<!-- openclaw-plugin-reference:manual-end -->
