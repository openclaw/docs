---
read_when:
    - Scelta di un percorso di configurazione iniziale
    - Configurazione di un nuovo ambiente
sidebarTitle: Onboarding Overview
summary: Panoramica delle opzioni e dei flussi di configurazione iniziale di OpenClaw
title: Panoramica dell'onboarding
x-i18n:
    generated_at: "2026-07-16T14:58:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw dispone dell'onboarding tramite terminale e app macOS. Entrambi configurano prima l'inferenza:
rilevano l'accesso esistente all'IA, richiedono un completamento in tempo reale e solo successivamente avviano
OpenClaw per configurare gli elementi rimanenti. Un Gateway raggiungibile e configurato,
il cui agente predefinito dispone già di un modello configurato, ignora l'onboarding e apre
la normale interfaccia utente dell'agente. Il flusso da terminale offre inoltre la procedura guidata classica completa per
una configurazione dettagliata.

## Quale percorso utilizzare?

|                  | Onboarding tramite CLI                   | Onboarding tramite app macOS    |
| ---------------- | ---------------------------------------- | ------------------------------- |
| **Piattaforme**  | macOS, Linux, Windows (nativo o WSL2)    | Solo macOS                      |
| **Interfaccia**  | Configurazione dell'inferenza, poi OpenClaw | Configurazione dell'inferenza, poi OpenClaw |
| **Ideale per**   | Server, sistemi headless, controllo completo | Mac desktop, configurazione visiva |
| **Automazione**  | `--non-interactive` per gli script        | Solo manuale                    |
| **Comando**      | `openclaw onboard`                       | Avviare l'app                   |

Per la maggior parte degli utenti è consigliabile iniziare con l'**onboarding tramite CLI**: funziona ovunque e offre
il massimo controllo.

## Cosa configura l'onboarding

La fase guidata dell'inferenza configura esclusivamente:

1. **Provider del modello e autenticazione** — accesso rilevato oppure accesso verificato a un provider,
   chiave API o token
2. **Inferenza verificata** — un completamento reale sul modello effettivo
   dell'agente predefinito

Dopo il superamento del completamento, OpenClaw può configurare lo spazio di lavoro, il Gateway,
il servizio Gateway, i canali, gli agenti, i plugin e altre funzionalità facoltative.

La procedura guidata classica della CLI può inoltre configurare:

1. **Canali** (facoltativo) — canali di chat integrati e inclusi, come
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp e altri
2. **Controlli avanzati del Gateway** — modalità remota, impostazioni di rete e opzioni del daemon

## Onboarding tramite CLI

Eseguire in un terminale qualsiasi:

```bash
openclaw onboard
```

Il flusso guidato rileva l'accesso esistente all'IA, verifica in tempo reale i candidati nell'ordine previsto
e, in caso di errore, passa al successivo. Se il rilevamento non produce risultati, mostra prima OpenAI,
Anthropic, xAI (Grok), Google e OpenRouter. **Altro…** contiene i
provider rimanenti suddivisi in gruppi, mentre un secondo menu presenta regioni, piani e metodi supportati
tramite browser, dispositivo, chiave API o token. Il modello
e la credenziale vengono salvati solo dopo un completamento riuscito; successivamente viene avviato OpenClaw per
configurare lo spazio di lavoro, il Gateway, i canali, gli agenti, i plugin e altre
funzionalità facoltative. **Ignora per ora** termina il flusso senza avviare OpenClaw. Non è previsto
il passaggio alla procedura classica all'interno del flusso; per utilizzare
la procedura guidata classica, uscire ed eseguire `openclaw onboard --classic`.

Dopo il superamento dell'inferenza, OpenClaw può affidare la configurazione dei canali a una procedura guidata
da terminale con input mascherato. Non apre la configurazione guidata o classica del provider; per
modificare il provider del modello o la relativa autenticazione, uscire da OpenClaw ed
eseguire `openclaw onboard`.

Utilizzare `openclaw onboard --classic` per la configurazione dettagliata di modello/autenticazione, canali, skill,
Gateway remoto o importazione. L'aggiunta di `--install-daemon` seleziona inoltre il
flusso classico e installa il servizio in background in un solo passaggio. Utilizzare `openclaw
openclaw` per la configurazione e la riparazione conversazionale non relativa all'inferenza. `openclaw
onboard --modern` è un alias di compatibilità che utilizza lo stesso controllo
dell'inferenza in tempo reale.

Riferimento completo: [Onboarding (CLI)](/it/start/wizard)
Documentazione del comando CLI: [`openclaw onboard`](/it/cli/onboard)

## Onboarding tramite app macOS

Aprire l'app OpenClaw. Se il Gateway locale o remoto configurato è raggiungibile
e l'agente predefinito dispone già di un modello configurato, l'app ignora l'onboarding
e OpenClaw e apre immediatamente la normale interfaccia utente dell'agente.

Per un Gateway nuovo o incompleto, il flusso di primo avvio rileva l'accesso esistente
all'IA (Claude Code, Codex o chiavi API), verifica in tempo reale l'opzione
migliore e la salva solo dopo una risposta reale, passando automaticamente alle alternative e
proponendo un passaggio manuale verificato con chiave API quando non viene rilevato nulla. Le credenziali
sensibili utilizzano un input mascherato. Dopo il superamento dell'inferenza, OpenClaw si avvia e
assiste nella configurazione degli elementi rimanenti.

Gemini CLI rimane disponibile per gli agenti normali dopo la configurazione, ma non viene
proposto per questo controllo dell'inferenza perché non può imporre il test senza strumenti.

Riferimento completo: [Onboarding (app macOS)](/it/start/onboarding)

## Provider personalizzati o non elencati

Se il provider non è elencato, eseguire `openclaw onboard --classic`, scegliere
**Provider personalizzato** e immettere:

- Compatibilità dell'endpoint: compatibile con OpenAI (`/chat/completions`), compatibile con OpenAI Responses (`/responses`), compatibile con Anthropic (`/messages`) oppure sconosciuta (verifica tutte e tre le opzioni e la rileva automaticamente)
- URL di base e chiave API (la chiave API è facoltativa se l'endpoint non ne richiede una)
- ID del modello e alias facoltativo del modello

Possono coesistere più endpoint personalizzati: ciascuno dispone di un proprio ID endpoint.

## Contenuti correlati

- [Guida introduttiva](/it/start/getting-started)
- [Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference)
