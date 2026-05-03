---
read_when:
    - Devi seguire i log del Gateway da remoto (senza SSH)
    - Vuoi righe di log JSON per gli strumenti
summary: Riferimento CLI per `openclaw logs` (segue i log del Gateway tramite RPC)
title: Log
x-i18n:
    generated_at: "2026-05-03T21:29:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Segui in coda i log su file del Gateway tramite RPC (funziona in modalità remota).

Correlati:

- Panoramica della registrazione: [Registrazione](/it/logging)
- CLI Gateway: [gateway](/it/cli/gateway)

## Opzioni

- `--limit <n>`: numero massimo di righe di log da restituire (predefinito `200`)
- `--max-bytes <n>`: byte massimi da leggere dal file di log (predefinito `250000`)
- `--follow`: segue il flusso dei log
- `--interval <ms>`: intervallo di polling durante il follow (predefinito `1000`)
- `--json`: emette eventi JSON delimitati da righe
- `--plain`: output in testo semplice senza formattazione stilizzata
- `--no-color`: disabilita i colori ANSI
- `--local-time`: renderizza i timestamp nel tuo fuso orario locale

## Opzioni RPC Gateway condivise

`openclaw logs` accetta anche i flag standard del client Gateway:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: timeout in ms (predefinito `30000`)
- `--expect-final`: attende una risposta finale quando la chiamata al Gateway è supportata da un agent

Quando passi `--url`, la CLI non applica automaticamente le credenziali di configurazione o di ambiente. Includi `--token` esplicitamente se il Gateway di destinazione richiede autenticazione.

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
- Se il Gateway local loopback implicito richiede l'abbinamento, si chiude durante la connessione o va in timeout prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul log su file del Gateway configurato. Le destinazioni `--url` esplicite non usano questo fallback.
- Quando usi `--follow`, le disconnessioni transitorie del gateway (chiusura WebSocket, timeout, interruzione della connessione) attivano la riconnessione automatica con backoff esponenziale (fino a 8 tentativi, con limite di 30 s tra i tentativi). A ogni tentativo viene stampato un avviso su stderr e, quando un polling riesce, viene stampata una notifica `[logs] gateway reconnected`. In modalità `--json`, sia l'avviso di nuovo tentativo sia la transizione di riconnessione vengono emessi come record `{"type":"notice"}` su stderr. Gli errori non recuperabili (errore di autenticazione, configurazione errata) terminano comunque immediatamente.

## Correlati

- [Riferimento CLI](/it/cli)
- [Registrazione del Gateway](/it/gateway/logging)
