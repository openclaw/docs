---
read_when:
    - WhatsApp Plugin'ini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: OpenClaw mesajlarını göndermek ve almak için WhatsApp kanal yüzeyini ekler.
title: WhatsApp Plugin
x-i18n:
    generated_at: "2026-05-05T06:18:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# WhatsApp Plugin'i

OpenClaw mesajlarını göndermek ve almak için WhatsApp kanal yüzeyini ekler.

## Dağıtım

- Paket: `@openclaw/whatsapp`
- Kurulum yolu: npm; ClawHub

## Yüzey

channels: whatsapp

## Windows kurulum notu

Windows'ta WhatsApp Plugin'i, Baileys/libsignal bağımlılıklarından biri git URL'sinden alındığı için npm kurulumu sırasında `PATH` üzerinde Git gerektirir. Git for Windows'ı kurun, ardından kabuğu yeniden başlatıp kurulumu yeniden çalıştırın:

```powershell
winget install --id Git.Git -e
```

Taşınabilir Git de `bin` dizini `PATH` üzerinde olduğu sürece çalışır.

## İlgili belgeler

- [whatsapp](/tr/channels/whatsapp)
