---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit plugin clickclack
summary: Menambahkan antarmuka kanal Clickclack untuk mengirim dan menerima pesan OpenClaw.
title: Plugin Clickclack
x-i18n:
    generated_at: "2026-07-21T12:35:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fcb39341009946dc38a12cc24496e65fd704ed3f2f9aff44bb2dd29fdedaef26
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Plugin Clickclack

Menambahkan antarmuka channel Clickclack untuk mengirim dan menerima pesan OpenClaw.

## Distribusi

- Paket: `@openclaw/clickclack`
- Rute instalasi: npm; ClawHub: `clawhub:@openclaw/clickclack`

## Antarmuka

channel: `clickclack`; kontrak: `tools`

<!-- openclaw-plugin-reference:manual-start -->

Plugin ini dapat secara opsional membuat channel ClickClack yang tersinkronisasi dengan siklus hidup
untuk setiap sesi OpenClaw. Channel diskusi terkelola menggunakan sesi sampingan
dengan agen yang sama untuk pengamatan dan relai, sedangkan sesi utama yang terlampir menerima
alat `discussion` khusus penarikan. Lihat [diskusi sesi ClickClack](/id/channels/clickclack#session-discussions)
untuk persyaratan konfigurasi dan visibilitas alat sesi.

<!-- openclaw-plugin-reference:manual-end -->

## Dokumentasi terkait

- [clickclack](/id/channels/clickclack)
