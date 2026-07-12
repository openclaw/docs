---
read_when:
    - Scegliere un percorso di configurazione iniziale
    - Configurazione di un nuovo ambiente
sidebarTitle: Onboarding Overview
summary: Panoramica delle opzioni e dei flussi di configurazione iniziale di OpenClaw
title: Panoramica dell'onboarding
x-i18n:
    generated_at: "2026-07-12T07:30:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw offre l'onboarding tramite terminale e app macOS. Entrambi configurano prima l'inferenza:
rilevano l'accesso esistente all'IA, richiedono un completamento effettivo e solo dopo avviano
Crestodian per configurare il resto. Un Gateway raggiungibile e configurato,
il cui agente predefinito dispone già di un modello configurato, salta l'onboarding e apre
la normale interfaccia dell'agente. Il flusso da terminale offre inoltre la procedura guidata classica completa per
una configurazione dettagliata.

## Quale percorso devo usare?

|                  | Onboarding tramite CLI                    | Onboarding tramite app macOS        |
| ---------------- | ----------------------------------------- | ----------------------------------- |
| **Piattaforme**  | macOS, Linux, Windows (nativo o WSL2)     | Solo macOS                          |
| **Interfaccia**  | Configurazione dell'inferenza, poi Crestodian | Configurazione dell'inferenza, poi Crestodian |
| **Ideale per**   | Server, sistemi headless, controllo completo | Mac desktop, configurazione visiva |
| **Automazione**  | `--non-interactive` per gli script        | Solo manuale                        |
| **Comando**      | `openclaw onboard`                        | Avviare l'app                       |

La maggior parte degli utenti dovrebbe iniziare con l'**onboarding tramite CLI**: funziona ovunque e offre
il massimo controllo.

## Cosa configura l'onboarding

La fase guidata dell'inferenza configura soltanto:

1. **Fornitore del modello e autenticazione** — accesso rilevato o una chiave API verificata
2. **Inferenza verificata** — un completamento reale sul modello effettivo
   dell'agente predefinito

Dopo il superamento del completamento, Crestodian può configurare lo spazio di lavoro, il Gateway,
il servizio Gateway, i canali, gli agenti, i Plugin e altre funzionalità facoltative.

La procedura guidata classica della CLI può inoltre configurare:

1. **Canali** (facoltativo) — canali di chat integrati e inclusi, come
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp e altri
2. **Controlli avanzati del Gateway** — modalità remota, impostazioni di rete e opzioni del daemon

## Onboarding tramite CLI

Esegui in qualsiasi terminale:

```bash
openclaw onboard
```

Il flusso guidato rileva l'accesso esistente all'IA, verifica in tempo reale i candidati nell'ordine previsto,
passa al successivo in caso di errore e consente l'inserimento manuale mascherato della chiave. Salva
il modello e la credenziale solo dopo un completamento riuscito, quindi avvia Crestodian
per configurare lo spazio di lavoro, il Gateway, i canali, gli agenti, i Plugin e altre
funzionalità facoltative. Prima dell'inferenza non viene avviato Crestodian, non esiste un percorso
che ignori l'IA né un passaggio alla procedura classica all'interno del flusso. Esci ed esegui
`openclaw onboard --classic` se preferisci la procedura guidata classica.

Dopo il superamento dell'inferenza, Crestodian può affidare la configurazione dei canali a una procedura guidata
da terminale con input mascherato. Non apre la configurazione guidata o classica del fornitore; esci da Crestodian ed
esegui `openclaw onboard` per modificare il fornitore del modello o la relativa autenticazione.

Usa `openclaw onboard --classic` per una configurazione dettagliata di modello/autenticazione, canali, Skills,
Gateway remoto o importazione. L'aggiunta di `--install-daemon` seleziona inoltre
il flusso classico e installa il servizio in background in un solo passaggio. Usa `openclaw
crestodian` per la configurazione e la riparazione conversazionale non relative all'inferenza. `openclaw
onboard --modern` è un alias di compatibilità che utilizza lo stesso controllo
dell'inferenza in tempo reale.

Riferimento completo: [Onboarding (CLI)](/it/start/wizard)
Documentazione del comando CLI: [`openclaw onboard`](/it/cli/onboard)

## Onboarding tramite app macOS

Apri l'app OpenClaw. Se il Gateway locale o remoto configurato è raggiungibile
e l'agente predefinito dispone già di un modello configurato, l'app salta l'onboarding
e Crestodian e apre immediatamente la normale interfaccia dell'agente.

Per un Gateway nuovo o incompleto, il flusso di primo avvio rileva l'accesso esistente
all'IA (Claude Code, Codex o chiavi API), verifica in tempo reale l'opzione
migliore e la salva solo dopo una risposta reale, passando automaticamente alle alternative e
offrendo un passaggio verificato per l'inserimento manuale della chiave API quando non viene trovato nulla. Le credenziali
sensibili utilizzano un input mascherato. Una volta superata l'inferenza, Crestodian si avvia e
aiuta a configurare il resto.

Gemini CLI rimane disponibile per i normali agenti dopo la configurazione, ma non viene
proposta per questo controllo dell'inferenza perché non può imporre la verifica senza strumenti.

Riferimento completo: [Onboarding (app macOS)](/it/start/onboarding)

## Fornitori personalizzati o non elencati

Se il tuo fornitore non è elencato, esegui `openclaw onboard --classic`, scegli
**Fornitore personalizzato** e inserisci:

- Compatibilità dell'endpoint: compatibile con OpenAI (`/chat/completions`), compatibile con OpenAI Responses (`/responses`), compatibile con Anthropic (`/messages`) oppure sconosciuta (verifica tutte e tre le opzioni e la rileva automaticamente)
- URL di base e chiave API (la chiave API è facoltativa se l'endpoint non ne richiede una)
- ID del modello e alias facoltativo del modello

Possono coesistere più endpoint personalizzati: ciascuno riceve un ID endpoint distinto.

## Contenuti correlati

- [Introduzione](/it/start/getting-started)
- [Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference)
