---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit plugin opencode
summary: Menambahkan dukungan penyedia model OpenCode ke OpenClaw.
title: Plugin OpenCode
x-i18n:
    generated_at: "2026-07-16T18:28:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

Menambahkan dukungan penyedia model OpenCode ke OpenClaw.

## Distribusi

- Paket: `@openclaw/opencode-provider`
- Rute penginstalan: disertakan dalam OpenClaw

## Permukaan

penyedia: `opencode`; kontrak: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Sesi native

OpenClaw secara otomatis mendeteksi CLI `opencode` pada Gateway dan node yang dipasangkan. Sesi
yang tersimpan kemudian muncul dalam grup bilah sisi sesi **OpenCode**, dengan penelusuran
transkrip hanya-baca melalui perintah resmi `opencode --pure db ... --format json`
dan `opencode --pure export`. Lingkungan terbatas dan mode `--pure`
mencegah penelusuran katalog memuat plugin proyek atau mewarisi kredensial
Gateway yang tidak terkait.

Nonaktifkan **OpenCode Session Catalog** di **Config > Plugins > OpenCode** untuk
menonaktifkan penemuan. Fitur ini diaktifkan secara default.

<!-- openclaw-plugin-reference:manual-end -->

## Dokumentasi terkait

- [opencode](/id/providers/opencode)
