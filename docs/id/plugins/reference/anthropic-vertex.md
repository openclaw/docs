---
read_when:
    - Anda sedang memasang, mengonfigurasi, atau mengaudit plugin anthropic-vertex
summary: Plugin penyedia Anthropic Vertex OpenClaw untuk model Claude di Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T17:51:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin penyedia Anthropic Vertex OpenClaw untuk model Claude di Google Vertex AI.

## Distribusi

- Paket: `@openclaw/anthropic-vertex-provider`
- Rute pemasangan: npm; ClawHub

## Permukaan

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Gunakan `anthropic-vertex/claude-fable-5` jika model tersedia di region Google Cloud Anda.
Fable 5 selalu menggunakan pemikiran adaptif dan secara default memakai upaya `high`. `/think off` dan
`/think minimal` menggunakan upaya `low` karena model tidak mendukung penonaktifan pemikiran.

<!-- openclaw-plugin-reference:manual-end -->
