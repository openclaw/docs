---
read_when:
    - Stai usando i messaggi diretti in modalità di abbinamento e devi approvare i mittenti
summary: Riferimento CLI per `openclaw pairing` (approvare/elencare le richieste di associazione)
title: Associazione
x-i18n:
    generated_at: "2026-05-06T17:54:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Approva o ispeziona le richieste di abbinamento via DM (per i canali che supportano l'abbinamento).

Correlati:

- Flusso di abbinamento: [Abbinamento](/it/channels/pairing)

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

Opzioni:

- `[channel]`: ID canale posizionale
- `--channel <channel>`: ID canale esplicito
- `--account <accountId>`: ID account per canali multi-account
- `--json`: output leggibile da macchina

Note:

- Se sono configurati più canali con supporto all'abbinamento, devi fornire un canale in posizione o con `--channel`.
- I canali di estensione sono consentiti purché l'ID canale sia valido.

## `pairing approve`

Approva un codice di abbinamento in sospeso e consenti quel mittente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando è configurato esattamente un canale con supporto all'abbinamento

Opzioni:

- `--channel <channel>`: ID canale esplicito
- `--account <accountId>`: ID account per canali multi-account
- `--notify`: invia una conferma al richiedente sullo stesso canale

Bootstrap del proprietario:

- Se `commands.ownerAllowFrom` è vuoto quando approvi un codice di abbinamento, OpenClaw registra anche il mittente approvato come proprietario dei comandi, usando una voce con ambito di canale come `telegram:123456789`.
- Questo inizializza solo il primo proprietario. Le approvazioni di abbinamento successive non sostituiscono né espandono `commands.ownerAllowFrom`.
- Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose come `/diagnostics`, `/export-trajectory`, `/config` e le approvazioni exec.

## Note

- Input del canale: passalo in posizione (`pairing list telegram`) o con `--channel <channel>`.
- `pairing list` supporta `--account <accountId>` per i canali multi-account.
- `pairing approve` supporta `--account <accountId>` e `--notify`.
- Se è configurato un solo canale con supporto all'abbinamento, `pairing approve <code>` è consentito.
- Se hai approvato un mittente prima dell'esistenza di questo bootstrap, esegui `openclaw doctor`; avvisa quando non è configurato alcun proprietario dei comandi e mostra il comando `openclaw config set commands.ownerAllowFrom ...` per risolvere il problema.

## Correlati

- [Riferimento CLI](/it/cli)
- [Abbinamento dei canali](/it/channels/pairing)
