---
read_when:
    - Anda memelihara skrip lama menggunakan `openclaw clawbot ...`
    - Anda memerlukan panduan migrasi ke perintah terkini
summary: Referensi CLI untuk `openclaw clawbot` (namespace alias lama)
title: Clawbot
x-i18n:
    generated_at: "2026-07-12T14:00:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6baf9b4e9bbe8bb31cdc4923c38cd45a883b6e5be921a403335e257dacdc2cd5
    source_path: cli/clawbot.md
    workflow: 16
---

# `openclaw clawbot`

Namespace alias lama yang dipertahankan untuk kompatibilitas mundur. Namespace ini mendaftarkan perintah QR yang sama seperti CLI tingkat teratas, sehingga `openclaw clawbot qr` menerima setiap flag [`openclaw qr`](/id/cli/qr).

## Migrasi

Utamakan perintah tingkat teratas modern:

- `openclaw clawbot qr` -> `openclaw qr`

## Terkait

- [Referensi CLI](/id/cli)
