---
read_when:
    - Usi il plugin per le chiamate vocali e desideri tutti i punti di ingresso della CLI
    - Ti servono tabelle dei flag e valori predefiniti per setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose e start
summary: Riferimento CLI per `openclaw voicecall` (interfaccia dei comandi del plugin per chiamate vocali)
title: Chiamata vocale
x-i18n:
    generated_at: "2026-07-12T06:55:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` è un comando fornito da un plugin. Compare solo quando il plugin per le chiamate vocali
è installato e abilitato.

Quando il Gateway è in esecuzione, i comandi operativi (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, `status`) vengono instradati al runtime
delle chiamate vocali di quel Gateway. Se nessun Gateway è raggiungibile, viene usato come ripiego un runtime
CLI autonomo.

## Sottocomandi

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Sottocomando | Descrizione                                                               |
| ------------ | ------------------------------------------------------------------------- |
| `setup`      | Mostra i controlli di disponibilità del provider e del Webhook.           |
| `smoke`      | Esegue i controlli di disponibilità; effettua una chiamata di prova reale solo con `--yes`. |
| `call`       | Avvia una chiamata vocale in uscita.                                      |
| `start`      | Alias di `call` con `--to` obbligatorio e `--message` facoltativo.         |
| `continue`   | Pronuncia un messaggio e attende la risposta successiva.                   |
| `speak`      | Pronuncia un messaggio senza attendere una risposta.                       |
| `dtmf`       | Invia cifre DTMF a una chiamata attiva.                                    |
| `end`        | Termina una chiamata attiva.                                               |
| `status`     | Esamina le chiamate attive (oppure una tramite `--call-id`).               |
| `tail`       | Segue `calls.jsonl` in tempo reale (utile durante i test del provider).    |
| `latency`    | Riepiloga le metriche di latenza dei turni da `calls.jsonl`.               |
| `expose`     | Attiva o disattiva Tailscale Serve/Funnel per l'endpoint Webhook.          |

## Configurazione e test rapido

### `setup`

Per impostazione predefinita, stampa controlli di disponibilità leggibili. Passare `--json` per gli script.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Esegue gli stessi controlli di disponibilità. Effettua una chiamata telefonica reale solo quando sono presenti sia
`--to` sia `--yes`.

| Flag               | Valore predefinito                | Descrizione                                         |
| ------------------ | --------------------------------- | --------------------------------------------------- |
| `-t, --to <phone>` | (nessuno)                         | Numero di telefono da chiamare per una prova reale. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Messaggio da pronunciare durante la chiamata di prova. |
| `--mode <mode>`    | `notify`                          | Modalità di chiamata: `notify` o `conversation`.    |
| `--yes`            | `false`                           | Effettua realmente la chiamata in uscita.           |
| `--json`           | `false`                           | Stampa JSON leggibile dalla macchina.                |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # esecuzione simulata
openclaw voicecall smoke --to "+15555550123" --yes  # chiamata di notifica reale
```

<Note>
Per i provider esterni (`plivo`, `telnyx`, `twilio`), `setup` e `smoke` richiedono un URL Webhook pubblico ottenuto da `publicUrl`, da un tunnel o dall'esposizione tramite Tailscale. Un ripiego tramite local loopback o Serve privato viene rifiutato perché gli operatori telefonici non possono raggiungerlo.
</Note>

## Ciclo di vita della chiamata

### `call`

Avvia una chiamata vocale in uscita.

| Flag                   | Obbligatorio | Valore predefinito | Descrizione                                                                       |
| ---------------------- | ------------ | ------------------- | --------------------------------------------------------------------------------- |
| `-m, --message <text>` | sì           | (nessuno)           | Messaggio da pronunciare quando la chiamata viene connessa.                        |
| `-t, --to <phone>`     | no           | config `toNumber`   | Numero di telefono E.164 da chiamare.                                              |
| `--mode <mode>`        | no           | `conversation`      | Modalità di chiamata: `notify` (termina dopo il messaggio) o `conversation` (rimane aperta). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias di `call` con una diversa struttura predefinita dei flag.

| Flag               | Obbligatorio | Valore predefinito | Descrizione                                                |
| ------------------ | ------------ | ------------------- | ---------------------------------------------------------- |
| `--to <phone>`     | sì           | (nessuno)           | Numero di telefono da chiamare.                             |
| `--message <text>` | no           | (nessuno)           | Messaggio da pronunciare quando la chiamata viene connessa. |
| `--mode <mode>`    | no           | `conversation`      | Modalità di chiamata: `notify` o `conversation`.            |

### `continue`

Pronuncia un messaggio e attende una risposta.

| Flag               | Obbligatorio | Descrizione             |
| ------------------ | ------------ | ----------------------- |
| `--call-id <id>`   | sì           | ID della chiamata.      |
| `--message <text>` | sì           | Messaggio da pronunciare. |

### `speak`

Pronuncia un messaggio senza attendere una risposta.

| Flag               | Obbligatorio | Descrizione             |
| ------------------ | ------------ | ----------------------- |
| `--call-id <id>`   | sì           | ID della chiamata.      |
| `--message <text>` | sì           | Messaggio da pronunciare. |

### `dtmf`

Invia cifre DTMF a una chiamata attiva.

| Flag                | Obbligatorio | Descrizione                                                 |
| ------------------- | ------------ | ----------------------------------------------------------- |
| `--call-id <id>`    | sì           | ID della chiamata.                                          |
| `--digits <digits>` | sì           | Cifre DTMF (ad esempio `ww123456#` per inserire delle attese). |

### `end`

Termina una chiamata attiva.

| Flag             | Obbligatorio | Descrizione        |
| ---------------- | ------------ | ------------------ |
| `--call-id <id>` | sì           | ID della chiamata. |

### `status`

Esamina le chiamate attive.

| Flag             | Valore predefinito | Descrizione                             |
| ---------------- | ------------------- | --------------------------------------- |
| `--call-id <id>` | (nessuno)           | Limita l'output a una sola chiamata.    |
| `--json`         | `false`             | Stampa JSON leggibile dalla macchina.   |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Log e metriche

### `tail`

Segue in tempo reale il log JSONL delle chiamate vocali. All'avvio stampa le ultime `--since` righe, quindi
trasmette le nuove righe man mano che vengono scritte.

| Flag            | Valore predefinito              | Descrizione                                  |
| --------------- | -------------------------------- | -------------------------------------------- |
| `--file <path>` | risolto dall'archivio del plugin | Percorso di `calls.jsonl`.                   |
| `--since <n>`   | `25`                             | Righe da stampare prima di seguire il file.  |
| `--poll <ms>`   | `250` (minimo 50)                | Intervallo di polling in millisecondi.       |

### `latency`

Riepiloga le metriche di latenza dei turni e di attesa dell'ascolto da `calls.jsonl`. L'output è
in formato JSON con i riepiloghi `recordsScanned`, `turnLatency` e `listenWait`.

| Flag            | Valore predefinito              | Descrizione                                  |
| --------------- | -------------------------------- | -------------------------------------------- |
| `--file <path>` | risolto dall'archivio del plugin | Percorso di `calls.jsonl`.                   |
| `--last <n>`    | `200` (minimo 1)                 | Numero di record recenti da analizzare.      |

## Esposizione dei Webhook

### `expose`

Abilita, disabilita o modifica la configurazione Tailscale Serve/Funnel per il
Webhook vocale.

| Flag                  | Valore predefinito                        | Descrizione                                        |
| --------------------- | ----------------------------------------- | -------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (tailnet) o `funnel` (pubblico).    |
| `--path <path>`       | config `tailscale.path` o `--serve-path` | Percorso Tailscale da esporre.                     |
| `--port <port>`       | config `serve.port` o `3334`             | Porta locale del Webhook.                          |
| `--serve-path <path>` | config `serve.path` o `/voice/webhook`   | Percorso locale del Webhook.                       |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Esporre l'endpoint Webhook solo alle reti considerate attendibili. Quando possibile, preferire Tailscale Serve a Funnel.
</Warning>

## Contenuti correlati

- [Riferimento CLI](/it/cli)
- [Plugin per le chiamate vocali](/it/plugins/voice-call)
