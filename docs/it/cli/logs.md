---
read_when:
    - Devi seguire i log del Gateway da remoto (senza SSH)
    - Vuoi righe di log JSON per gli strumenti
summary: Riferimento CLI per `openclaw logs` (segue i log del Gateway tramite RPC)
title: Log
x-i18n:
    generated_at: "2026-06-27T17:19:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Segue i log su file del Gateway tramite RPC (funziona in modalità remota).

Correlato:

- Panoramica della registrazione: [Registrazione](/it/logging)
- CLI del Gateway: [gateway](/it/cli/gateway)

## Opzioni

- `--limit <n>`: numero massimo di righe di log da restituire (predefinito `200`)
- `--max-bytes <n>`: numero massimo di byte da leggere dal file di log (predefinito `250000`)
- `--follow`: segui il flusso dei log
- `--interval <ms>`: intervallo di polling durante il follow (predefinito `1000`)
- `--json`: emetti eventi JSON delimitati da righe
- `--plain`: output in testo semplice senza formattazione stilizzata
- `--no-color`: disabilita i colori ANSI
- `--local-time`: mostra i timestamp nel tuo fuso orario locale (predefinito)
- `--utc`: mostra i timestamp in UTC

## Opzioni RPC Gateway condivise

`openclaw logs` accetta anche i flag standard del client Gateway:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--timeout <ms>`: timeout in ms (predefinito `30000`)
- `--expect-final`: attendi una risposta finale quando la chiamata al Gateway è supportata da un agente

Quando passi `--url`, la CLI non applica automaticamente le credenziali di configurazione o di ambiente. Includi `--token` esplicitamente se il Gateway di destinazione richiede l'autenticazione.

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

- Per impostazione predefinita, i timestamp vengono mostrati nel tuo fuso orario locale. Usa `--utc` per l'output in UTC.
- Se il Gateway local loopback implicito richiede l'abbinamento, si chiude durante la connessione o scade prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul log su file del Gateway configurato. Le destinazioni `--url` esplicite non usano questo fallback.
- `openclaw logs --follow` non segue i fallback su file configurato dopo errori RPC del Gateway locale implicito. Su Linux, usa il journal del Gateway user-systemd attivo per PID quando disponibile e stampa l'origine dei log selezionata; altrimenti continua a ritentare il Gateway live invece di seguire un file affiancato potenzialmente obsoleto.
- Quando si usa `--follow`, disconnessioni transitorie del gateway (chiusura WebSocket, timeout, caduta della connessione) attivano la riconnessione automatica con backoff esponenziale (fino a 8 tentativi, con limite di 30 s tra i tentativi). A ogni tentativo viene stampato un avviso su stderr e, quando un poll riesce, viene stampato un avviso `[logs] gateway reconnected`. In modalità `--json`, sia l'avviso di nuovo tentativo sia la transizione di riconnessione vengono emessi come record `{"type":"notice"}` su stderr. Gli errori non recuperabili (errore di autenticazione, configurazione errata) terminano comunque immediatamente.

## Correlato

- [Riferimento CLI](/it/cli)
- [Registrazione Gateway](/it/gateway/logging)
