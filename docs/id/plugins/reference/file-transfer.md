---
read_when:
    - Anda sedang memasang, mengonfigurasi, atau mengaudit plugin transfer file
summary: Ambil, tampilkan daftar, dan tulis file pada node yang dipasangkan melalui perintah node khusus. Melewati pemotongan stdout bash dengan menggunakan base64 melalui node.invoke untuk file biner hingga 16 MB.
title: Plugin Transfer File
x-i18n:
    generated_at: "2026-07-16T18:27:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin Transfer File

Ambil, cantumkan, dan tulis file pada Node yang dipasangkan melalui perintah Node khusus. Menghindari pemotongan stdout bash dengan menggunakan base64 melalui node.invoke untuk file biner hingga 16 MB.

## Distribusi

- Paket: `@openclaw/file-transfer`
- Rute instalasi: disertakan dalam OpenClaw

## Permukaan

kontrak: `tools`
