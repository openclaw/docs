---
read_when:
    - Stai utilizzando messaggi diretti in modalità di associazione e devi approvare i mittenti
summary: Riferimento CLI per `openclaw pairing` (approvazione/elenco delle richieste di associazione)
title: Associazione
x-i18n:
    generated_at: "2026-07-16T14:03:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Approva o esamina le richieste di associazione tramite messaggio diretto per i canali che supportano l'associazione (solo messaggi diretti di chat: l'associazione di nodi/dispositivi usa `openclaw devices`).

Correlato: [Flusso di associazione](/it/channels/pairing)

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

Elenca le richieste di associazione in sospeso per un canale.

| Opzione                 | Descrizione                                     |
| ----------------------- | ----------------------------------------------- |
| `[channel]`      | ID del canale come argomento posizionale        |
| `--channel <channel>`      | ID esplicito del canale                         |
| `--account <accountId>`      | ID dell'account per i canali con più account    |
| `--json`      | output leggibile dalla macchina                 |

Se sono configurati più canali che supportano l'associazione, specificare un canale come argomento posizionale o tramite `--channel`. I canali delle estensioni funzionano purché l'ID del canale sia valido.

## `pairing approve`

Approva un codice di associazione in sospeso e autorizza il relativo mittente.

Utilizzo:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando è configurato esattamente un canale che supporta l'associazione

Opzioni: `--channel <channel>`, `--account <accountId>`, `--notify` (invia una conferma al richiedente sullo stesso canale).

### Configurazione iniziale del proprietario

Se `commands.ownerAllowFrom` è vuoto quando si approva un codice di associazione, OpenClaw registra anche il mittente approvato come proprietario dei comandi, utilizzando una voce relativa al canale, come `telegram:123456789`. Questa operazione configura solo il primo proprietario: le successive approvazioni delle associazioni non sostituiscono né ampliano mai `commands.ownerAllowFrom`.

Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose come `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` e le approvazioni di esecuzione. L'associazione consente soltanto a un mittente di comunicare con l'agente; di per sé non concede privilegi da proprietario oltre a questa configurazione iniziale una tantum.

Se un mittente è stato approvato prima dell'introduzione di questa configurazione iniziale, eseguire `openclaw doctor`; viene mostrato un avviso quando non è configurato alcun proprietario dei comandi, insieme al comando `openclaw config set commands.ownerAllowFrom ...` esatto per risolvere il problema.

## Correlati

- [Riferimento della CLI](/it/cli)
- [Associazione dei canali](/it/channels/pairing)
