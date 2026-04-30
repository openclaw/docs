---
read_when:
    - Devi seguire i log del Gateway da remoto (senza SSH)
    - Vuoi righe di log JSON per gli strumenti
summary: Riferimento CLI per `openclaw logs` (segue i log del Gateway tramite RPC)
title: Log
x-i18n:
    generated_at: "2026-04-30T08:43:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Esegue il tail dei log su file del Gateway tramite RPC (funziona in modalità remota).

Correlati:

- Panoramica dei log: [Log](/it/logging)
- CLI del Gateway: [gateway](/it/cli/gateway)

## Opzioni

- `--limit <n>`: numero massimo di righe di log da restituire (predefinito `200`)
- `--max-bytes <n>`: numero massimo di byte da leggere dal file di log (predefinito `250000`)
- `--follow`: segue lo stream dei log
- `--interval <ms>`: intervallo di polling durante il follow (predefinito `1000`)
- `--json`: emette eventi JSON delimitati da righe
- `--plain`: output in testo normale senza formattazione stilizzata
- `--no-color`: disabilita i colori ANSI
- `--local-time`: mostra i timestamp nel tuo fuso orario locale

## Opzioni RPC condivise del Gateway

`openclaw logs` accetta anche i flag client standard del Gateway:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: timeout in ms (predefinito `30000`)
- `--expect-final`: attende una risposta finale quando la chiamata al Gateway è supportata da un agente

Quando passi `--url`, la CLI non applica automaticamente la configurazione o le credenziali dell'ambiente. Includi `--token` esplicitamente se il Gateway di destinazione richiede l'autenticazione.

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

- Usa `--local-time` per mostrare i timestamp nel tuo fuso orario locale.
- Se il Gateway local loopback implicito richiede l'abbinamento, si chiude durante la connessione o va in timeout prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul log su file del Gateway configurato. Le destinazioni `--url` esplicite non usano questo fallback.

## Correlati

- [Riferimento CLI](/it/cli)
- [Log del Gateway](/it/gateway/logging)
