---
read_when:
    - Vuoi collegare gli eventi Pub/Sub di Gmail a OpenClaw
    - Ti servono l'elenco completo dei flag e i valori predefiniti
summary: Riferimento della CLI per `openclaw webhooks` (configurazione ed esecuzione di Gmail Pub/Sub)
title: Webhook
x-i18n:
    generated_at: "2026-07-12T06:59:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Helper e integrazioni per i Webhook. Attualmente questa funzionalità è limitata ai flussi Pub/Sub di Gmail basati sul watcher `gog` incluso.

## Sottocomandi

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Sottocomando  | Descrizione                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `gmail setup` | Procedura guidata iniziale: monitoraggio di Gmail, argomento/sottoscrizione Pub/Sub e recapito degli hook a OpenClaw. |
| `gmail run`   | Esegue `gog watch serve` insieme al ciclo di rinnovo automatico del monitoraggio in primo piano.     |

<Note>
Il Gateway avvia inoltre automaticamente `gog gmail watch serve` all'avvio quando sono impostati `hooks.enabled=true` e `hooks.gmail.account` (configurati da `gmail setup`). `gmail run` esegue la stessa logica in primo piano ed è utile per il debug o quando il watcher del Gateway è disabilitato. Per i dettagli sull'avvio automatico e sull'opzione di esclusione `OPENCLAW_SKIP_GMAIL_WATCHER`, consulta [Integrazione Pub/Sub di Gmail](/it/automation/cron-jobs#gmail-pubsub-integration).
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Installa `gcloud` e `gog` se mancanti, autentica `gcloud`, crea l'argomento e la sottoscrizione Pub/Sub, avvia il monitoraggio di Gmail e scrive la configurazione `hooks.gmail` con `hooks.enabled=true`. Visualizza `Avanti: openclaw webhooks gmail run`.

### Obbligatorio

| Opzione             | Descrizione                    |
| ------------------- | ------------------------------ |
| `--account <email>` | Account Gmail da monitorare.   |

### Opzioni Pub/Sub

| Opzione                 | Valore predefinito      | Descrizione                                                                                                                                                                |
| ----------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (nessuno)               | ID del progetto GCP (proprietario del client OAuth). In alternativa usa l'ID del progetto dell'argomento, quindi il progetto ricavato dalle credenziali di `gog`.           |
| `--topic <name>`        | `gog-gmail-watch`       | Nome dell'argomento Pub/Sub.                                                                                                                                               |
| `--subscription <name>` | `gog-gmail-watch-push`  | Nome della sottoscrizione Pub/Sub.                                                                                                                                         |
| `--label <label>`       | `INBOX`                 | Etichetta Gmail da monitorare.                                                                                                                                             |
| `--push-endpoint <url>` | (nessuno)               | Endpoint push Pub/Sub esplicito. Ha la precedenza su Tailscale.                                                                                                             |

### Opzioni di recapito di OpenClaw

| Opzione                | Valore predefinito                              | Descrizione                      |
| ---------------------- | ------------------------------------------------ | -------------------------------- |
| `--hook-url <url>`     | Generato da `hooks.path` e dalla porta del Gateway | URL del Webhook di OpenClaw.     |
| `--hook-token <token>` | `hooks.token` o un token generato                | Token del Webhook di OpenClaw.   |
| `--push-token <token>` | Token generato                                   | Token push inoltrato a `gog watch serve`. |

### Opzioni di `gog watch serve`

| Opzione               | Valore predefinito | Descrizione                                                                                                                                                                                                                       |
| --------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`        | Host di associazione di `gog watch serve`.                                                                                                                                                                                        |
| `--port <port>`       | `8788`             | Porta di `gog watch serve`.                                                                                                                                                                                                       |
| `--path <path>`       | `/gmail-pubsub`    | Percorso di `gog watch serve`. Viene forzato a `/` quando Tailscale è abilitato senza una destinazione esplicita, poiché Tailscale rimuove il percorso prima di inoltrare tramite proxy.                                             |
| `--include-body`      | `true`             | Include estratti del corpo delle email. Non esiste un'opzione CLI per disabilitarlo; imposta invece `hooks.gmail.includeBody: false` nella configurazione.                                                                          |
| `--max-bytes <n>`     | `20000`            | Numero massimo di byte per estratto del corpo.                                                                                                                                                                                     |
| `--renew-minutes <n>` | `720` (12 h)       | Rinnova il monitoraggio di Gmail ogni N minuti.                                                                                                                                                                                    |

### Esposizione tramite Tailscale

| Opzione                   | Valore predefinito | Descrizione                                                                    |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| `--tailscale <mode>`      | `funnel`           | Espone l'endpoint push tramite Tailscale: `funnel`, `serve` oppure `off`.       |
| `--tailscale-path <path>` | (nessuno)          | Percorso per serve/funnel di Tailscale.                                        |
| `--tailscale-target <t>`  | (nessuno)          | Destinazione serve/funnel di Tailscale (porta, `host:port` oppure URL).         |

### Output

| Opzione  | Descrizione                                                       |
| -------- | ----------------------------------------------------------------- |
| `--json` | Visualizza un riepilogo leggibile da una macchina anziché testo.  |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Esegue `gog watch serve` insieme al ciclo di rinnovo automatico del monitoraggio in primo piano, riavviando `gog watch serve` dopo un ritardo di 2 s se termina in modo imprevisto.

`run` accetta le stesse opzioni Pub/Sub, di recapito di OpenClaw, di `gog watch serve` e di Tailscale di `setup`, con le seguenti eccezioni:

- `--account` è **facoltativo** per `run`; in sua assenza viene usato `hooks.gmail.account`.
- `run` **non** accetta `--project`, `--push-endpoint` o `--json`.
- Ogni opzione usa in alternativa il valore di configurazione `hooks.gmail.*` corrispondente (scritto da `setup`), quindi lo stesso valore predefinito integrato usato da `setup`, con un'eccezione: per `run`, il valore predefinito di `--tailscale` è `off` (non `funnel`) quando non sono impostati né l'opzione né `hooks.gmail.tailscale.mode`.

| Categoria                    | Opzioni                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub                      | `--account`, `--topic`, `--subscription`, `--label`                              |
| Recapito di OpenClaw         | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`            | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale                    | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Per `run`, il valore di `--topic` è il percorso completo dell'argomento Pub/Sub (`projects/.../topics/...`), non soltanto il nome abbreviato dell'argomento.
</Note>

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Automazione tramite Webhook](/it/automation/cron-jobs)
- [Integrazione Pub/Sub di Gmail](/it/automation/cron-jobs#gmail-pubsub-integration)
