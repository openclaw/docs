---
read_when:
    - Stai installando, configurando o verificando il Plugin WhatsApp
summary: Aggiunge l'interfaccia del canale WhatsApp per inviare e ricevere messaggi OpenClaw.
title: Plugin WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:18:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# Plugin WhatsApp

Aggiunge la superficie del canale WhatsApp per inviare e ricevere messaggi OpenClaw.

## Distribuzione

- Pacchetto: `@openclaw/whatsapp`
- Percorso di installazione: npm; ClawHub

## Superficie

canali: whatsapp

## Nota di installazione per Windows

Su Windows, il Plugin WhatsApp richiede Git in `PATH` durante l'installazione npm perché una delle sue dipendenze Baileys/libsignal viene recuperata da un URL git. Installa Git per Windows, quindi riavvia la shell ed esegui di nuovo l'installazione:

```powershell
winget install --id Git.Git -e
```

Anche Git portabile funziona se la sua directory `bin` è in `PATH`.

## Documentazione correlata

- [whatsapp](/it/channels/whatsapp)
