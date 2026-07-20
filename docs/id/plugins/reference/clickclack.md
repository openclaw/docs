---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit plugin clickclack
summary: Menambahkan permukaan channel Clickclack untuk mengirim dan menerima pesan OpenClaw.
title: Plugin Clickclack
x-i18n:
    generated_at: "2026-07-20T03:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e59a11826dfc14a7c6945930547804b10e9cb5144d9cdb75657be9f8f4e9129f
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Plugin Clickclack

Menambahkan permukaan channel Clickclack untuk mengirim dan menerima pesan OpenClaw.

## Distribusi

- Paket: `@openclaw/clickclack`
- Rute instalasi: npm; ClawHub: `clawhub:@openclaw/clickclack`

## Permukaan

channel: `clickclack`

Plugin dapat secara opsional membuat channel ClickClack yang disinkronkan dengan siklus hidup
untuk setiap sesi OpenClaw. Channel diskusi terkelola menggunakan sesi samping dari agen yang sama
untuk observasi dan relai, sedangkan sesi utama yang terhubung menerima
alat khusus penarikan `discussion`. Lihat [Diskusi sesi ClickClack](/id/channels/clickclack#session-discussions)
untuk persyaratan konfigurasi dan visibilitas alat sesi.

## Dokumentasi terkait

- [clickclack](/id/channels/clickclack)
