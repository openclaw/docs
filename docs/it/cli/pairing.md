---
read_when:
    - Stai usando DM in modalità pairing e devi approvare i mittenti
summary: Riferimento CLI per `openclaw pairing` (approvare/elencare richieste di pairing)
title: Pairing
x-i18n:
    generated_at: "2026-04-24T08:34:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Approva o ispeziona richieste di pairing DM (per i canali che supportano il pairing).

Correlati:

- Flusso di pairing: [Pairing](/it/channels/pairing)

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

Elenca le richieste di pairing in sospeso per un canale.

Opzioni:

- `[channel]`: id canale posizionale
- `--channel <channel>`: id canale esplicito
- `--account <accountId>`: id account per canali multi-account
- `--json`: output leggibile dalla macchina

Note:

- Se sono configurati più canali compatibili con il pairing, devi fornire un canale in forma posizionale o con `--channel`.
- I canali di estensione sono consentiti purché l'id del canale sia valido.

## `pairing approve`

Approva un codice di pairing in sospeso e consente quel mittente.

Utilizzo:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando è configurato esattamente un canale compatibile con il pairing

Opzioni:

- `--channel <channel>`: id canale esplicito
- `--account <accountId>`: id account per canali multi-account
- `--notify`: invia una conferma al richiedente sullo stesso canale

## Note

- Input del canale: passalo in forma posizionale (`pairing list telegram`) o con `--channel <channel>`.
- `pairing list` supporta `--account <accountId>` per i canali multi-account.
- `pairing approve` supporta `--account <accountId>` e `--notify`.
- Se è configurato un solo canale compatibile con il pairing, è consentito `pairing approve <code>`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Channel pairing](/it/channels/pairing)
