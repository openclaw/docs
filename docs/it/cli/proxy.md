---
read_when:
    - Hai bisogno di acquisire localmente il traffico di trasporto di OpenClaw per il debug
    - Vuoi ispezionare sessioni del proxy di debug, blob o preset di query integrati
summary: Riferimento CLI per `openclaw proxy`, il proxy di debug locale e l’ispettore di acquisizione
title: Proxy
x-i18n:
    generated_at: "2026-04-24T08:34:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Esegui il proxy di debug locale esplicito e ispeziona il traffico acquisito.

Questo è un comando di debug per l’analisi a livello di trasporto. Può avviare un
proxy locale, eseguire un comando figlio con l’acquisizione abilitata, elencare le sessioni
di acquisizione, interrogare pattern di traffico comuni, leggere blob acquisiti e ripulire i dati
di acquisizione locali.

## Comandi

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Preset di query

`openclaw proxy query --preset <name>` accetta:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Note

- `start` usa come predefinito `127.0.0.1` a meno che non venga impostato `--host`.
- `run` avvia un proxy di debug locale e poi esegue il comando dopo `--`.
- Le acquisizioni sono dati di debug locali; usa `openclaw proxy purge` quando hai finito.

## Correlati

- [Riferimento CLI](/it/cli)
- [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth)
