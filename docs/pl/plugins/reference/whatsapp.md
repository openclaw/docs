---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz Plugin WhatsApp
summary: Dodaje interfejs kanału WhatsApp do wysyłania i odbierania wiadomości OpenClaw.
title: Plugin WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:18:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# Plugin WhatsApp

Dodaje interfejs kanału WhatsApp do wysyłania i odbierania wiadomości OpenClaw.

## Dystrybucja

- Pakiet: `@openclaw/whatsapp`
- Ścieżka instalacji: npm; ClawHub

## Interfejs

channels: whatsapp

## Uwaga dotycząca instalacji w Windows

W Windows plugin WhatsApp wymaga Git w `PATH` podczas instalacji npm, ponieważ jedna z jego zależności Baileys/libsignal jest pobierana z adresu URL git. Zainstaluj Git for Windows, następnie uruchom ponownie powłokę i ponownie uruchom instalację:

```powershell
winget install --id Git.Git -e
```

Portable Git również działa, jeśli jego katalog `bin` znajduje się w `PATH`.

## Powiązana dokumentacja

- [whatsapp](/pl/channels/whatsapp)
