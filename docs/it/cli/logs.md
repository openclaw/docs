---
read_when:
    - Hai bisogno di seguire i log del Gateway da remoto (senza SSH)
    - Vuoi righe di log JSON per gli strumenti
summary: Riferimento CLI per `openclaw logs` (seguire i log del gateway tramite RPC)
title: Log
x-i18n:
    generated_at: "2026-04-24T08:34:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Segui i log file del Gateway tramite RPC (funziona in modalità remota).

Correlati:

- Panoramica del logging: [Logging](/it/logging)
- CLI del Gateway: [gateway](/it/cli/gateway)

## Opzioni

- `--limit <n>`: numero massimo di righe di log da restituire (predefinito `200`)
- `--max-bytes <n>`: numero massimo di byte da leggere dal file di log (predefinito `250000`)
- `--follow`: segue il flusso di log
- `--interval <ms>`: intervallo di polling durante il follow (predefinito `1000`)
- `--json`: emette eventi JSON delimitati da riga
- `--plain`: output di testo semplice senza formattazione stilizzata
- `--no-color`: disabilita i colori ANSI
- `--local-time`: visualizza i timestamp nel tuo fuso orario locale

## Opzioni condivise Gateway RPC

`openclaw logs` accetta anche i flag standard del client Gateway:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: timeout in ms (predefinito `30000`)
- `--expect-final`: attende una risposta finale quando la chiamata Gateway è supportata da agente

Quando passi `--url`, la CLI non applica automaticamente credenziali da configurazione o ambiente. Includi `--token` esplicitamente se il Gateway di destinazione richiede autenticazione.

## Esempi

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Note

- Usa `--local-time` per visualizzare i timestamp nel tuo fuso orario locale.
- Se il Gateway local loopback richiede pairing, `openclaw logs` usa automaticamente come fallback il file di log locale configurato. Le destinazioni `--url` esplicite non usano questo fallback.

## Correlati

- [Riferimento CLI](/it/cli)
- [Logging del Gateway](/it/gateway/logging)
