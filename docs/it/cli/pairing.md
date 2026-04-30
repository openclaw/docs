---
read_when:
    - Stai usando DM in modalità di pairing e devi approvare i mittenti
summary: Riferimento CLI per `openclaw pairing` (approva/elenca le richieste di associazione)
title: Abbinamento
x-i18n:
    generated_at: "2026-04-30T08:44:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Approva o ispeziona le richieste di associazione via DM (per i canali che supportano l'associazione).

Correlati:

- Flusso di associazione: [Associazione](/it/channels/pairing)

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

Opzioni:

- `[channel]`: id del canale posizionale
- `--channel <channel>`: id del canale esplicito
- `--account <accountId>`: id dell'account per canali multi-account
- `--json`: output leggibile dalla macchina

Note:

- Se sono configurati più canali che supportano l'associazione, devi fornire un canale, posizionalmente oppure con `--channel`.
- I canali delle estensioni sono consentiti purché l'id del canale sia valido.

## `pairing approve`

Approva un codice di associazione in sospeso e consenti quel mittente.

Utilizzo:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando è configurato esattamente un canale che supporta l'associazione

Opzioni:

- `--channel <channel>`: id del canale esplicito
- `--account <accountId>`: id dell'account per canali multi-account
- `--notify`: invia una conferma al richiedente sullo stesso canale

Bootstrap del proprietario:

- Se `commands.ownerAllowFrom` è vuoto quando approvi un codice di associazione, OpenClaw registra anche il mittente approvato come proprietario dei comandi, usando una voce con ambito di canale come `telegram:123456789`.
- Questo esegue il bootstrap solo del primo proprietario. Le approvazioni di associazione successive non sostituiscono né espandono `commands.ownerAllowFrom`.
- Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose come `/diagnostics`, `/export-trajectory`, `/config` e le approvazioni exec.

## Note

- Input del canale: passalo posizionalmente (`pairing list telegram`) oppure con `--channel <channel>`.
- `pairing list` supporta `--account <accountId>` per canali multi-account.
- `pairing approve` supporta `--account <accountId>` e `--notify`.
- Se è configurato un solo canale che supporta l'associazione, `pairing approve <code>` è consentito.
- Se hai approvato un mittente prima che esistesse questo bootstrap, esegui `openclaw doctor`; avvisa quando non è configurato alcun proprietario dei comandi e mostra il comando `openclaw config set commands.ownerAllowFrom ...` per risolvere il problema.

## Correlati

- [Riferimento CLI](/it/cli)
- [Associazione dei canali](/it/channels/pairing)
