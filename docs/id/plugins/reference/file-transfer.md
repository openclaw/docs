---
read_when:
    - Anda sedang memasang, mengonfigurasi, atau mengaudit plugin transfer berkas
summary: Ambil, cantumkan, dan tulis berkas pada Node yang dipasangkan melalui perintah Node khusus. Melewati pemotongan stdout bash dengan menggunakan base64 melalui node.invoke untuk berkas biner hingga 16 MB.
title: Plugin Transfer File
x-i18n:
    generated_at: "2026-07-12T14:26:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin Transfer File

Ambil, cantumkan, dan tulis file pada Node yang dipasangkan melalui perintah Node khusus. Menghindari pemotongan stdout bash dengan menggunakan base64 melalui node.invoke untuk file biner hingga 16 MB.

## Distribusi

- Paket: `@openclaw/file-transfer`
- Jalur instalasi: disertakan dalam OpenClaw

## Antarmuka

kontrak: alat
