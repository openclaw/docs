---
read_when:
    - Anda perlu menangkap traffic transport OpenClaw secara lokal untuk debugging
    - Anda ingin memeriksa sesi proxy debug, blob, atau preset kueri bawaan
summary: Referensi CLI untuk `openclaw proxy`, proxy debug lokal dan inspector capture
title: Proxy
x-i18n:
    generated_at: "2026-04-24T09:02:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Jalankan proxy debug eksplisit lokal dan periksa traffic yang ditangkap.

Ini adalah perintah debugging untuk investigasi tingkat transport. Perintah ini dapat memulai
proxy lokal, menjalankan perintah anak dengan capture diaktifkan, mencantumkan sesi capture,
membuat kueri pola traffic umum, membaca blob yang ditangkap, dan membersihkan data
capture lokal.

## Perintah

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Preset kueri

`openclaw proxy query --preset <name>` menerima:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Catatan

- `start` secara default menggunakan `127.0.0.1` kecuali `--host` diatur.
- `run` memulai proxy debug lokal lalu menjalankan perintah setelah `--`.
- Capture adalah data debugging lokal; gunakan `openclaw proxy purge` saat selesai.

## Terkait

- [Referensi CLI](/id/cli)
- [Auth proxy tepercaya](/id/gateway/trusted-proxy-auth)
