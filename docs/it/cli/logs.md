---
read_when:
    - Hai bisogno di seguire da remoto i log del Gateway (senza SSH)
    - Vuoi righe di log JSON per strumenti automatici
summary: Riferimento CLI per `openclaw logs` (segue i log del gateway tramite RPC)
title: logs
x-i18n:
    generated_at: "2026-04-05T13:47:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Segue i log dei file del Gateway tramite RPC (funziona in modalità remota).

Correlati:

- Panoramica del logging: [Logging](/logging)
- CLI del Gateway: [gateway](/cli/gateway)

## Opzioni

- `--limit <n>`: numero massimo di righe di log da restituire (predefinito `200`)
- `--max-bytes <n>`: numero massimo di byte da leggere dal file di log (predefinito `250000`)
- `--follow`: segue il flusso dei log
- `--interval <ms>`: intervallo di polling durante il follow (predefinito `1000`)
- `--json`: emette eventi JSON delimitati da riga
- `--plain`: output di testo semplice senza formattazione stilizzata
- `--no-color`: disabilita i colori ANSI
- `--local-time`: renderizza i timestamp nel tuo fuso orario locale

## Opzioni RPC Gateway condivise

`openclaw logs` accetta anche i flag standard del client Gateway:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: timeout in ms (predefinito `30000`)
- `--expect-final`: attende una risposta finale quando la chiamata al Gateway è supportata da un agente

Quando passi `--url`, la CLI non applica automaticamente credenziali da configurazione o ambiente. Includi esplicitamente `--token` se il Gateway di destinazione richiede autenticazione.

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

- Usa `--local-time` per renderizzare i timestamp nel tuo fuso orario locale.
- Se il Gateway local loopback chiede il pairing, `openclaw logs` usa automaticamente come fallback il file di log locale configurato. I target espliciti passati con `--url` non usano questo fallback.
