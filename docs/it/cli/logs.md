---
read_when:
    - Devi seguire in tempo reale i log del Gateway da remoto (senza SSH)
    - Vuoi righe di log JSON per gli strumenti
summary: Riferimento della CLI per `openclaw logs` (visualizzazione continua dei log del Gateway tramite RPC)
title: Registri
x-i18n:
    generated_at: "2026-07-12T06:53:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Segue in tempo reale i log su file del Gateway tramite RPC. Funziona in modalità remota.

## Opzioni

- `--limit <n>`: numero massimo di righe di log da restituire (valore predefinito `200`)
- `--max-bytes <n>`: numero massimo di byte da leggere dal file di log (valore predefinito `250000`)
- `--follow`: segue il flusso dei log
- `--interval <ms>`: intervallo di polling durante il monitoraggio (valore predefinito `1000`)
- `--json`: emette eventi JSON delimitati da righe
- `--plain`: output in testo semplice senza formattazione stilizzata
- `--no-color`: disabilita i colori ANSI
- `--local-time`: visualizza le marche temporali nel fuso orario locale (valore predefinito)
- `--utc`: visualizza le marche temporali in UTC

## Opzioni RPC condivise del Gateway

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: timeout in ms (valore predefinito `30000`)
- `--expect-final`: attende una risposta finale quando la chiamata al Gateway è gestita da un agente

Il passaggio di `--url` impedisce l'applicazione automatica delle credenziali di configurazione; includi esplicitamente `--token` se il Gateway di destinazione richiede l'autenticazione.

## Esempi

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Comportamento di ripiego e ripristino

- Se il Gateway local loopback implicito richiede l'associazione, chiude la connessione durante il collegamento o raggiunge il timeout prima che `logs.tail` risponda, `openclaw logs` passa automaticamente al log su file del Gateway configurato. Le destinazioni `--url` esplicite non utilizzano mai questo ripiego.
- `--follow` non passa al file configurato dopo un errore RPC del Gateway locale implicito: un file affiancato obsoleto potrebbe rendere fuorviante il monitoraggio in tempo reale. Su Linux utilizza invece, quando disponibile, il journal del Gateway user-systemd attivo in base al PID (e stampa l'origine selezionata); altrimenti continua a tentare la connessione al Gateway attivo.
- Durante `--follow`, le disconnessioni temporanee (chiusura WebSocket, timeout, interruzione della connessione) attivano la riconnessione automatica con backoff esponenziale: fino a 8 tentativi, con un massimo di 30 s tra un tentativo e l'altro. A ogni nuovo tentativo viene stampato un avviso su stderr e, quando un polling riesce, viene stampata una notifica `[logs] gateway reconnected`. In modalità `--json`, entrambi vengono emessi su stderr come record `{"type":"notice"}`. Gli errori non recuperabili (autenticazione non riuscita, configurazione errata) causano comunque l'uscita immediata.
- In modalità `--follow --json`, le transizioni tra le origini dei log vengono emesse come record `{"type":"meta"}`. Tieni traccia dei cursori separatamente per ogni `sourceKind`: un flusso può passare dall'output del file del Gateway (`sourceKind: "file"`) al ripiego sul journal locale (`sourceKind: "journal"`, `localFallback: true`, con `service.pid`/`service.unit`) e tornare all'output del file del Gateway dopo il ripristino. Non presumere che l'origine o il cursore rimangano invariati per l'intera sessione e tollera righe sovrapposte quando il ripristino riproduce nuovamente il cursore del file del Gateway.

## Risorse correlate

- [Panoramica della registrazione](/it/logging)
- [CLI del Gateway](/it/cli/gateway)
- [Riferimento della CLI](/it/cli)
- [Registrazione del Gateway](/it/gateway/logging)
