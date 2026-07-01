---
read_when:
    - Devi seguire i log del Gateway da remoto (senza SSH)
    - Vuoi righe di log JSON per gli strumenti
summary: Riferimento CLI per `openclaw logs` (leggere in streaming i log del Gateway tramite RPC)
title: Registri
x-i18n:
    generated_at: "2026-07-01T15:25:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Segue in tempo reale i log su file del Gateway tramite RPC (funziona in modalità remota).

Correlati:

- Panoramica della registrazione: [Registrazione](/it/logging)
- CLI del Gateway: [gateway](/it/cli/gateway)

## Opzioni

- `--limit <n>`: numero massimo di righe di log da restituire (predefinito `200`)
- `--max-bytes <n>`: numero massimo di byte da leggere dal file di log (predefinito `250000`)
- `--follow`: segue il flusso dei log
- `--interval <ms>`: intervallo di polling durante il follow (predefinito `1000`)
- `--json`: emette eventi JSON delimitati da righe
- `--plain`: output in testo semplice senza formattazione stilizzata
- `--no-color`: disabilita i colori ANSI
- `--local-time`: mostra i timestamp nel tuo fuso orario locale (predefinito)
- `--utc`: mostra i timestamp in UTC

## Opzioni RPC condivise del Gateway

`openclaw logs` accetta anche i flag standard del client Gateway:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: timeout in ms (predefinito `30000`)
- `--expect-final`: attende una risposta finale quando la chiamata al Gateway è supportata da un agent

Quando passi `--url`, la CLI non applica automaticamente la configurazione o le credenziali dell'ambiente. Includi `--token` esplicitamente se il Gateway di destinazione richiede autenticazione.

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Note

- I timestamp vengono mostrati nel tuo fuso orario locale per impostazione predefinita. Usa `--utc` per l'output in UTC.
- Se il Gateway local loopback implicito richiede l'abbinamento, si chiude durante la connessione o va in timeout prima che `logs.tail` risponda, `openclaw logs` passa automaticamente al log su file del Gateway configurato. Le destinazioni `--url` esplicite non usano questo fallback.
- `openclaw logs --follow` non segue i fallback su file configurato dopo errori RPC impliciti del Gateway locale. Su Linux, usa il journal Gateway user-systemd attivo per PID quando disponibile e stampa l'origine del log selezionata; altrimenti continua a ritentare il Gateway live invece di seguire un file affiancato potenzialmente obsoleto.
- Quando usi `--follow`, le disconnessioni transitorie del gateway (chiusura WebSocket, timeout, caduta della connessione) attivano la riconnessione automatica con backoff esponenziale (fino a 8 tentativi, con limite di 30 s tra i tentativi). A ogni tentativo viene stampato un avviso su stderr e, quando un polling riesce, viene stampato un avviso `[logs] gateway reconnected`. In modalità `--json`, sia l'avviso di nuovo tentativo sia la transizione di riconnessione vengono emessi come record `{"type":"notice"}` su stderr. Gli errori non recuperabili (errore di autenticazione, configurazione errata) terminano comunque immediatamente.
- In modalità `--follow --json`, le transizioni dell'origine dei log vengono emesse come record `{"type":"meta"}`. I consumer dovrebbero tracciare i cursori per ogni `sourceKind`: uno stream può passare dall'output su file del Gateway (`sourceKind: "file"`) al fallback sul journal locale (`sourceKind: "journal"`, `localFallback: true`, con `service.pid`/`service.unit`) e tornare all'output su file del Gateway dopo il ripristino. Non presupporre una singola origine stabile o un singolo cursore per tutta la sessione follow, e tollera righe sovrapposte quando il ripristino riproduce il cursore del file del Gateway.

## Correlati

- [Riferimento CLI](/it/cli)
- [Registrazione del Gateway](/it/gateway/logging)
