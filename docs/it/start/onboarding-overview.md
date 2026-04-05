---
read_when:
    - Scegliere un percorso di onboarding
    - Configurare un nuovo ambiente
sidebarTitle: Onboarding Overview
summary: Panoramica delle opzioni e dei flussi di onboarding di OpenClaw
title: Panoramica dell'onboarding
x-i18n:
    generated_at: "2026-04-05T14:04:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374697c1dbe0c3871c43164076fbed7119ef032f4a40d0f6e421051f914806e5
    source_path: start/onboarding-overview.md
    workflow: 15
---

# Panoramica dell'onboarding

OpenClaw ha due percorsi di onboarding. Entrambi configurano l'autenticazione, il Gateway e
i canali di chat opzionali — differiscono solo nel modo in cui interagisci con la configurazione.

## Quale percorso dovrei usare?

|                | Onboarding CLI                         | Onboarding dell'app macOS |
| -------------- | -------------------------------------- | ------------------------- |
| **Piattaforme**  | macOS, Linux, Windows (nativo o WSL2) | Solo macOS                |
| **Interfaccia**  | Procedura guidata nel terminale       | Interfaccia guidata nell'app |
| **Ideale per**   | Server, ambienti headless, controllo completo | Mac desktop, configurazione visiva |
| **Automazione** | `--non-interactive` per gli script    | Solo manuale              |
| **Comando**    | `openclaw onboard`                     | Avvia l'app               |

La maggior parte degli utenti dovrebbe iniziare con l'**onboarding CLI** — funziona
ovunque e ti offre il massimo controllo.

## Cosa configura l'onboarding

Indipendentemente dal percorso scelto, l'onboarding configura:

1. **Provider di modelli e autenticazione** — chiave API, OAuth o token di configurazione per il provider scelto
2. **Workspace** — directory per i file dell'agente, i modelli bootstrap e la memoria
3. **Gateway** — porta, indirizzo di bind, modalità di autenticazione
4. **Canali** (opzionale) — canali di chat integrati e plugin inclusi come
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp e altri
5. **Daemon** (opzionale) — servizio in background in modo che il Gateway si avvii automaticamente

## Onboarding CLI

Esegui in qualsiasi terminale:

```bash
openclaw onboard
```

Aggiungi `--install-daemon` per installare anche il servizio in background in un solo passaggio.

Riferimento completo: [Onboarding (CLI)](/start/wizard)
Documentazione del comando CLI: [`openclaw onboard`](/cli/onboard)

## Onboarding dell'app macOS

Apri l'app OpenClaw. La procedura guidata del primo avvio ti accompagna negli stessi passaggi
con un'interfaccia visiva.

Riferimento completo: [Onboarding (app macOS)](/start/onboarding)

## Provider personalizzati o non elencati

Se il tuo provider non è elencato nell'onboarding, scegli **Provider personalizzato** e
inserisci:

- Modalità di compatibilità API (compatibile con OpenAI, compatibile con Anthropic o rilevamento automatico)
- URL di base e chiave API
- ID del modello e alias opzionale

Più endpoint personalizzati possono coesistere — ognuno ottiene il proprio ID endpoint.
