---
read_when:
    - Scelta di un percorso di onboarding
    - Configurazione di un nuovo ambiente
sidebarTitle: Onboarding Overview
summary: Panoramica delle opzioni e dei flussi di configurazione iniziale di OpenClaw
title: Panoramica dell'avvio guidato
x-i18n:
    generated_at: "2026-05-10T19:52:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw offre due percorsi di configurazione iniziale. Entrambi configurano l'autenticazione, il Gateway e
i canali di chat opzionali: differiscono solo nel modo in cui interagisci con la configurazione.

## Quale percorso dovrei usare?

|                | Configurazione iniziale tramite CLI       | Configurazione iniziale tramite app macOS |
| -------------- | ----------------------------------------- | ----------------------------------------- |
| **Piattaforme** | macOS, Linux, Windows (nativo o WSL2)     | Solo macOS                                |
| **Interfaccia** | Procedura guidata nel terminale           | UI guidata nell'app                       |
| **Ideale per**  | Server, ambienti headless, pieno controllo | Mac desktop, configurazione visiva        |
| **Automazione** | `--non-interactive` per gli script        | Solo manuale                              |
| **Comando**     | `openclaw onboard`                        | Avvia l'app                               |

La maggior parte degli utenti dovrebbe iniziare con la **configurazione iniziale tramite CLI**: funziona ovunque e offre
il massimo controllo.

## Che cosa configura la procedura iniziale

Indipendentemente dal percorso scelto, la configurazione iniziale imposta:

1. **Provider del modello e autenticazione**: chiave API, OAuth o token di configurazione per il provider scelto
2. **Workspace**: directory per i file degli agenti, i template di bootstrap e la memoria
3. **Gateway**: porta, indirizzo di bind, modalità di autenticazione
4. **Canali** (opzionale): canali di chat integrati e inclusi nel bundle come
   iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp e altri
5. **Daemon** (opzionale): servizio in background per avviare automaticamente il Gateway

## Configurazione iniziale tramite CLI

Esegui in qualsiasi terminale:

```bash
openclaw onboard
```

Aggiungi `--install-daemon` per installare anche il servizio in background in un unico passaggio.

Riferimento completo: [Configurazione iniziale (CLI)](/it/start/wizard)
Documentazione del comando CLI: [`openclaw onboard`](/it/cli/onboard)

## Configurazione iniziale tramite app macOS

Apri l'app OpenClaw. La procedura guidata al primo avvio ti accompagna negli stessi passaggi
con un'interfaccia visiva.

Riferimento completo: [Configurazione iniziale (app macOS)](/it/start/onboarding)

## Provider personalizzati o non elencati

Se il tuo provider non è elencato nella configurazione iniziale, scegli **Provider personalizzato** e
inserisci:

- Modalità di compatibilità API (compatibile con OpenAI, compatibile con Anthropic o rilevamento automatico)
- URL di base e chiave API
- ID modello e alias opzionale

Più endpoint personalizzati possono coesistere: ciascuno ottiene il proprio ID endpoint.

## Correlati

- [Introduzione](/it/start/getting-started)
- [Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference)
