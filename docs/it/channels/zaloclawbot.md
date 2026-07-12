---
read_when:
    - Vuoi un bot assistente personale per Zalo con accesso tramite codice QR
    - Stai installando o risolvendo i problemi del Plugin di canale openclaw-zaloclawbot
summary: Configurazione del canale Zalo ClawBot tramite il plugin esterno openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T06:50:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw si connette a Zalo ClawBot tramite il plugin esterno `@zalo-platforms/openclaw-zaloclawbot` presente nel catalogo. L'accesso utilizza un codice QR di Zalo Mini App; l'id del plugin nella configurazione è `openclaw-zaloclawbot`.

## Compatibilità

| Versione del plugin | Versione di OpenClaw | dist-tag npm | Stato         |
| ------------------- | -------------------- | ------------ | -------------- |
| 0.1.4               | >=2026.4.10          | `latest`     | Attivo / Beta  |

## Prerequisiti

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) installato (CLI `openclaw` disponibile)
- Un account Zalo su un dispositivo mobile per scansionare il codice QR di accesso

## Installazione con la procedura guidata iniziale (consigliata)

```bash
openclaw onboard
```

Scegli **Zalo ClawBot** dal menu dei canali. La procedura guidata installa il plugin dal catalogo ufficiale (con verifica dell'integrità), visualizza il codice QR di accesso nel terminale e completa la configurazione del canale dopo che lo hai scansionato con l'app Zalo.

## Installazione manuale

Per aggiungere il canale a un Gateway già configurato tramite la procedura guidata iniziale:

### 1. Installa il plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Usa esattamente la versione specificata, affinché OpenClaw verifichi il pacchetto rispetto all'hash di integrità del catalogo durante l'installazione.

### 2. Abilita il plugin nella configurazione

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Genera un codice QR ed effettua l'accesso

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Scansiona il codice QR visualizzato nel terminale con l'app mobile Zalo, accetta i Termini di utilizzo all'interno della Zalo Mini App e autorizza la sessione.

### 4. Riavvia il Gateway

```bash
openclaw gateway restart
```

## Funzionamento

A differenza del canale Zalo standard, che richiede la registrazione di un proprio account ufficiale Zalo (OA) e la configurazione di credenziali statiche per sviluppatori, Zalo ClawBot è un **assistente personale associato al proprietario** su un'infrastruttura ufficiale condivisa:

1. **Configurazione iniziale:** il codice QR rimanda a una Zalo Mini App che associa direttamente al tuo ID utente Zalo un bot privato appena creato, ospitato da un OA ufficiale condiviso.
2. **Privacy vincolata al proprietario:** il bot comunica esclusivamente con il suo proprietario. I messaggi degli altri utenti vengono scartati a livello di piattaforma.
3. **Percorso API ufficiale:** il plugin utilizza le API della Zalo Bot Platform, non l'automazione del browser o delle sessioni web.

## Dettagli interni

Il plugin comunica con Zalo tramite un ciclo persistente di polling prolungato (`getUpdates`). I Webhook sono disabilitati per impostazione predefinita durante le esecuzioni locali del Gateway da desktop o terminale. I messaggi vengono elaborati lato client e instradati all'ambiente di esecuzione locale dell'agente.

Il plugin gestisce le credenziali del bot nella directory di stato di OpenClaw. Considera sensibile questa directory e applicale gli stessi criteri di controllo degli accessi e di backup previsti per il resto dello stato di OpenClaw.

L'ambiente di esecuzione di questo plugin risiede interamente nel pacchetto esterno `@zalo-platforms/openclaw-zaloclawbot`; i dettagli sul comportamento riportati di seguito, al di là dell'installazione e della configurazione, provengono dai manutentori del plugin e non sono stati verificati rispetto al codice sorgente del nucleo di OpenClaw.

## Risoluzione dei problemi

- **Timeout dell'accesso tramite QR:** per motivi di sicurezza, il token di accesso (`zbsk`) scade dopo 5 minuti. Se il codice QR scade prima che tu riesca a scansionarlo, esegui nuovamente il comando di accesso per generarne uno nuovo.
- **Impossibile caricare il Gateway:** verifica che la versione di OpenClaw sull'host sia `2026.4.10` o successiva. Le versioni precedenti non supportano il registro delle installazioni di plugin npm esterni richiesto da questo ID.

## Risorse correlate

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Zalo](/it/channels/zalo) - il canale integrato Zalo Bot Creator / Marketplace
- [Associazione](/it/channels/pairing) - autenticazione tramite messaggio diretto e flusso di associazione
- [Plugin](/it/tools/plugin) - installazione e gestione dei plugin
