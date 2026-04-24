---
read_when:
    - Scegliere un percorso di onboarding
    - Configurare un nuovo ambiente
sidebarTitle: Onboarding Overview
summary: Panoramica delle opzioni e dei flussi di onboarding di OpenClaw
title: Panoramica dell'onboarding
x-i18n:
    generated_at: "2026-04-24T09:02:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw ha due percorsi di onboarding. Entrambi configurano auth, il Gateway e
i canali di chat facoltativi — differiscono solo nel modo in cui interagisci con la configurazione.

## Quale percorso dovrei usare?

|                | Onboarding CLI                         | Onboarding app macOS      |
| -------------- | -------------------------------------- | ------------------------- |
| **Piattaforme** | macOS, Linux, Windows (nativo o WSL2) | Solo macOS                |
| **Interfaccia** | Procedura guidata da terminale        | UI guidata nell'app       |
| **Ideale per** | Server, headless, controllo completo   | Desktop Mac, configurazione visiva |
| **Automazione** | `--non-interactive` per script        | Solo manuale              |
| **Comando**    | `openclaw onboard`                     | Avvia l'app               |

La maggior parte degli utenti dovrebbe iniziare con **l'onboarding CLI** — funziona ovunque e ti dà
il massimo controllo.

## Cosa configura l'onboarding

Indipendentemente dal percorso scelto, l'onboarding configura:

1. **Provider del modello e auth** — chiave API, OAuth o setup token per il provider scelto
2. **Workspace** — directory per file dell'agente, template bootstrap e memoria
3. **Gateway** — porta, indirizzo di bind, modalità auth
4. **Canali** (facoltativi) — canali di chat integrati e inclusi come
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp e altri
5. **Daemon** (facoltativo) — servizio in background così il Gateway si avvia automaticamente

## Onboarding CLI

Esegui in qualsiasi terminale:

```bash
openclaw onboard
```

Aggiungi `--install-daemon` per installare anche il servizio in background in un unico passaggio.

Riferimento completo: [Onboarding (CLI)](/it/start/wizard)
Documentazione del comando CLI: [`openclaw onboard`](/it/cli/onboard)

## Onboarding dell'app macOS

Apri l'app OpenClaw. La procedura guidata del primo avvio ti accompagna negli stessi passaggi
con un'interfaccia visiva.

Riferimento completo: [Onboarding (app macOS)](/it/start/onboarding)

## Provider personalizzati o non elencati

Se il tuo provider non è elencato nell'onboarding, scegli **Custom Provider** e
inserisci:

- Modalità di compatibilità API (OpenAI-compatible, Anthropic-compatible o auto-detect)
- Base URL e chiave API
- Model ID e alias facoltativo

Possono coesistere più endpoint personalizzati — ognuno riceve il proprio endpoint ID.

## Correlati

- [Per iniziare](/it/start/getting-started)
- [Riferimento CLI di configurazione](/it/start/wizard-cli-reference)
