---
read_when:
    - Stai usando i messaggi diretti in modalità di associazione e devi approvare i mittenti
summary: Riferimento CLI per `openclaw pairing` (approvare/elencare le richieste di associazione)
title: Associazione
x-i18n:
    generated_at: "2026-07-12T06:54:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Approva o esamina le richieste di abbinamento tramite messaggio diretto per i canali che supportano l'abbinamento (solo messaggi diretti delle chat; per l'abbinamento di nodi/dispositivi si usa `openclaw devices`).

Correlato: [Flusso di abbinamento](/it/channels/pairing)

## Comandi

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Elenca le richieste di abbinamento in sospeso per un canale.

| Opzione                 | Descrizione                                  |
| ----------------------- | -------------------------------------------- |
| `[channel]`             | ID posizionale del canale                    |
| `--channel <channel>`   | ID esplicito del canale                      |
| `--account <accountId>` | ID dell'account per i canali multi-account   |
| `--json`                | output leggibile automaticamente             |

Se sono configurati più canali che supportano l'abbinamento, specifica un canale come argomento posizionale o tramite `--channel`. I canali di estensione funzionano purché l'ID del canale sia valido.

## `pairing approve`

Approva un codice di abbinamento in sospeso e autorizza il relativo mittente.

Utilizzo:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando è configurato esattamente un canale che supporta l'abbinamento

Opzioni: `--channel <channel>`, `--account <accountId>`, `--notify` (invia una conferma al richiedente sullo stesso canale).

### Configurazione iniziale del proprietario

Se `commands.ownerAllowFrom` è vuoto quando approvi un codice di abbinamento, OpenClaw registra anche il mittente approvato come proprietario dei comandi, utilizzando una voce specifica del canale, ad esempio `telegram:123456789`. Questa operazione configura solo il primo proprietario: le successive approvazioni di abbinamento non sostituiscono né ampliano mai `commands.ownerAllowFrom`.

Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose, come `/diagnostics`, `/export-trajectory`, `/config` e le approvazioni di esecuzione. L'abbinamento consente soltanto a un mittente di comunicare con l'agente; di per sé non concede privilegi di proprietario oltre a questa configurazione iniziale una tantum.

Se hai approvato un mittente prima dell'introduzione di questa configurazione iniziale, esegui `openclaw doctor`: il comando avvisa quando non è configurato alcun proprietario dei comandi e mostra il comando esatto `openclaw config set commands.ownerAllowFrom ...` per risolvere il problema.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Abbinamento dei canali](/it/channels/pairing)
