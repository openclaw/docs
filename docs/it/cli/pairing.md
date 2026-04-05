---
read_when:
    - Stai usando DM in modalità abbinamento e devi approvare i mittenti
summary: Riferimento CLI per `openclaw pairing` (approvare/elencare richieste di abbinamento)
title: pairing
x-i18n:
    generated_at: "2026-04-05T13:48:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Approva o ispeziona le richieste di abbinamento DM (per i canali che supportano l'abbinamento).

Correlato:

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

Elenca le richieste di abbinamento in attesa per un canale.

Opzioni:

- `[channel]`: ID canale posizionale
- `--channel <channel>`: ID canale esplicito
- `--account <accountId>`: ID account per canali multi-account
- `--json`: output leggibile da macchina

Note:

- Se sono configurati più canali in grado di gestire l'abbinamento, devi fornire un canale in forma posizionale o con `--channel`.
- I canali plugin sono consentiti purché l'ID canale sia valido.

## `pairing approve`

Approva un codice di abbinamento in attesa e consente quel mittente.

Utilizzo:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando è configurato esattamente un solo canale in grado di gestire l'abbinamento

Opzioni:

- `--channel <channel>`: ID canale esplicito
- `--account <accountId>`: ID account per canali multi-account
- `--notify`: invia una conferma al richiedente sullo stesso canale

## Note

- Input canale: passalo in forma posizionale (`pairing list telegram`) o con `--channel <channel>`.
- `pairing list` supporta `--account <accountId>` per canali multi-account.
- `pairing approve` supporta `--account <accountId>` e `--notify`.
- Se è configurato un solo canale in grado di gestire l'abbinamento, è consentito `pairing approve <code>`.
