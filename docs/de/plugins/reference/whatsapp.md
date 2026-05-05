---
read_when:
    - Sie installieren, konfigurieren oder prüfen das WhatsApp-Plugin
summary: Fügt die WhatsApp-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.
title: WhatsApp-Plugin
x-i18n:
    generated_at: "2026-05-05T06:18:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# WhatsApp-Plugin

Fügt die WhatsApp-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

## Distribution

- Paket: `@openclaw/whatsapp`
- Installationsweg: npm; ClawHub

## Oberfläche

channels: whatsapp

## Hinweis zur Windows-Installation

Unter Windows benötigt das WhatsApp-Plugin während der npm-Installation Git auf `PATH`, weil eine seiner Baileys/libsignal-Abhängigkeiten von einer Git-URL abgerufen wird. Installieren Sie Git for Windows, starten Sie dann die Shell neu und führen Sie die Installation erneut aus:

```powershell
winget install --id Git.Git -e
```

Portable Git funktioniert ebenfalls, wenn sich sein `bin`-Verzeichnis auf `PATH` befindet.

## Zugehörige Dokumentation

- [whatsapp](/de/channels/whatsapp)
