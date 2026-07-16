---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit plugin acpx
summary: Backend runtime ACP OpenClaw dengan pengelolaan sesi dan transport yang dimiliki oleh plugin.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T18:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

Backend runtime ACP OpenClaw dengan pengelolaan sesi dan transportasi yang dimiliki Plugin.

## Distribusi

- Paket: `@openclaw/acpx`
- Jalur instalasi: npm; ClawHub

## Permukaan

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Sesi native Pi

Runtime bawaan otomatis mendeteksi penyimpanan sesi Pi di Gateway dan node yang dipasangkan. Sesi yang tersimpan muncul dalam grup bilah samping sesi **Pi**, dengan penelusuran transkrip hanya-baca dari format sesi JSONL Pi yang terdokumentasi. Katalog mendukung direktori sesi proyek dan global `settings.json` serta `PI_CODING_AGENT_DIR` dan `PI_CODING_AGENT_SESSION_DIR`. Jalur relatif ditentukan dari direktori yang berisi file `settings.json` masing-masing.

Nonaktifkan **Pi Session Catalog** di **Config > Plugins > ACPX Runtime** untuk menonaktifkan penemuan. Fitur ini diaktifkan secara default.

<!-- openclaw-plugin-reference:manual-end -->

## Dokumentasi terkait

- [acpx](/id/tools/acp-agents-setup)
