---
read_when:
    - Devi catturare localmente il traffico di trasporto di OpenClaw per il debug
    - Vuoi ispezionare sessioni del proxy di debug, blob o preset di query integrati
summary: Riferimento CLI per `openclaw proxy`, il proxy di debug locale e l'ispettore delle catture
title: proxy
x-i18n:
    generated_at: "2026-04-23T08:27:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Esegui il proxy di debug locale esplicito e ispeziona il traffico catturato.

Questo è un comando di debug per l'analisi a livello di trasporto. Può avviare un
proxy locale, eseguire un comando figlio con la cattura abilitata, elencare le sessioni
di cattura, interrogare pattern di traffico comuni, leggere i blob catturati e cancellare
i dati di cattura locali.

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

- `start` usa come predefinito `127.0.0.1` a meno che non sia impostato `--host`.
- `run` avvia un proxy di debug locale e poi esegue il comando dopo `--`.
- Le catture sono dati di debug locali; usa `openclaw proxy purge` quando hai finito.
