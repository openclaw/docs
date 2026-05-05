---
read_when:
    - Vous installez, configurez ou auditez le Plugin WhatsApp
summary: Ajoute la surface de canal WhatsApp pour envoyer et recevoir des messages OpenClaw.
title: Plugin WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:18:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# Plugin WhatsApp

Ajoute la surface de canal WhatsApp pour l’envoi et la réception de messages OpenClaw.

## Distribution

- Paquet : `@openclaw/whatsapp`
- Mode d’installation : npm ; ClawHub

## Surface

channels: whatsapp

## Note d’installation sous Windows

Sous Windows, le Plugin WhatsApp a besoin que Git soit dans le `PATH` pendant l’installation npm, car l’une de ses dépendances Baileys/libsignal est récupérée depuis une URL git. Installez Git for Windows, puis redémarrez le shell et relancez l’installation :

```powershell
winget install --id Git.Git -e
```

Portable Git fonctionne également si son répertoire `bin` est dans le `PATH`.

## Documentation associée

- [whatsapp](/fr/channels/whatsapp)
