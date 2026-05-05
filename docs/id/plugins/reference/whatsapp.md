---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit Plugin WhatsApp
summary: Menambahkan antarmuka kanal WhatsApp untuk mengirim dan menerima pesan OpenClaw.
title: Plugin WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:18:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# Plugin WhatsApp

Menambahkan permukaan saluran WhatsApp untuk mengirim dan menerima pesan OpenClaw.

## Distribusi

- Paket: `@openclaw/whatsapp`
- Rute instalasi: npm; ClawHub

## Permukaan

channels: whatsapp

## Catatan instalasi Windows

Di Windows, Plugin WhatsApp memerlukan Git pada `PATH` selama instalasi npm karena salah satu dependensi Baileys/libsignal-nya diambil dari URL git. Instal Git for Windows, lalu mulai ulang shell dan jalankan kembali instalasinya:

```powershell
winget install --id Git.Git -e
```

Portable Git juga berfungsi jika direktori `bin`-nya ada di `PATH`.

## Dokumentasi terkait

- [whatsapp](/id/channels/whatsapp)
