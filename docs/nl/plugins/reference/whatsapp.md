---
read_when:
    - Je installeert, configureert of controleert de WhatsApp-plugin
summary: Voegt de WhatsApp-kanaalinterface toe voor het verzenden en ontvangen van OpenClaw-berichten.
title: WhatsApp-Plugin
x-i18n:
    generated_at: "2026-05-05T06:18:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# WhatsApp Plugin

Voegt het WhatsApp-kanaaloppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

## Distributie

- Pakket: `@openclaw/whatsapp`
- Installatieroute: npm; ClawHub

## Oppervlak

channels: whatsapp

## Installatieopmerking voor Windows

Op Windows heeft de WhatsApp Plugin Git op `PATH` nodig tijdens npm install, omdat een van de Baileys/libsignal-afhankelijkheden via een git-URL wordt opgehaald. Installeer Git for Windows, herstart daarna de shell en voer de installatie opnieuw uit:

```powershell
winget install --id Git.Git -e
```

Portable Git werkt ook als de `bin`-directory ervan op `PATH` staat.

## Gerelateerde documentatie

- [whatsapp](/nl/channels/whatsapp)
