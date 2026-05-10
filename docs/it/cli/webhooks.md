---
read_when:
    - Vuoi collegare gli eventi Gmail Pub/Sub a OpenClaw
    - Ti serve l'elenco completo dei flag e dei valori predefiniti
summary: Riferimento CLI per `openclaw webhooks` (configurazione e runner Gmail Pub/Sub)
title: Webhook
x-i18n:
    generated_at: "2026-05-10T19:30:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Helper e integrazioni Webhook. Oggi questa superficie è limitata ai flussi Gmail Pub/Sub che si integrano con il watcher `gog` incluso.

## Sottocomandi

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Sottocomando | Descrizione                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `gmail setup` | Configura il watch di Gmail, il topic/la sottoscrizione Pub/Sub e la destinazione di consegna Webhook di OpenClaw. |
| `gmail run`   | Esegue `gog watch serve` più il ciclo di rinnovo automatico del watch.                                  |

## `webhooks gmail setup`

Configura il watch di Gmail, Pub/Sub e la consegna Webhook di OpenClaw.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Obbligatorio

| Flag                | Descrizione                |
| ------------------- | -------------------------- |
| `--account <email>` | Account Gmail da osservare. |

### Opzioni Pub/Sub

| Flag                    | Predefinito            | Descrizione                                                    |
| ----------------------- | ---------------------- | -------------------------------------------------------------- |
| `--project <id>`        | (nessuno)              | ID del progetto GCP (il proprietario del client OAuth).        |
| `--topic <name>`        | `gog-gmail-watch`      | Nome del topic Pub/Sub.                                        |
| `--subscription <name>` | `gog-gmail-watch-push` | Nome della sottoscrizione Pub/Sub.                             |
| `--label <label>`       | `INBOX`                | Etichetta Gmail da osservare.                                  |
| `--push-endpoint <url>` | (nessuno)              | Endpoint push Pub/Sub esplicito. Sovrascrive Tailscale.        |

### Opzioni di consegna OpenClaw

| Flag                   | Predefinito | Descrizione                         |
| ---------------------- | ----------- | ----------------------------------- |
| `--hook-url <url>`     | (nessuno)   | URL Webhook di OpenClaw.            |
| `--hook-token <token>` | (nessuno)   | Token Webhook di OpenClaw.          |
| `--push-token <token>` | (nessuno)   | Token push inoltrato a `gog watch serve`. |

### Opzioni di `gog watch serve`

| Flag                  | Predefinito    | Descrizione                                                             |
| --------------------- | -------------- | ----------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`    | Host di bind di `gog watch serve`.                                      |
| `--port <port>`       | `8788`         | Porta di `gog watch serve`.                                             |
| `--path <path>`       | `/gmail-pubsub` | Percorso di `gog watch serve`.                                         |
| `--include-body`      | `true`         | Include frammenti del corpo dell'email. Passa `--no-include-body` per disabilitare. |
| `--max-bytes <n>`     | `20000`        | Byte massimi per frammento del corpo.                                   |
| `--renew-minutes <n>` | `720` (12h)    | Rinnova il watch di Gmail ogni N minuti.                                |

### Esposizione Tailscale

| Flag                      | Predefinito | Descrizione                                                                    |
| ------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `--tailscale <mode>`      | `funnel`    | Espone l'endpoint push tramite Tailscale: `funnel`, `serve` oppure `off`.       |
| `--tailscale-path <path>` | (nessuno)   | Percorso per tailscale serve/funnel.                                           |
| `--tailscale-target <t>`  | (nessuno)   | Destinazione Tailscale serve/funnel (porta, `host:port` oppure URL).           |

### Output

| Flag     | Descrizione                                                   |
| -------- | ------------------------------------------------------------- |
| `--json` | Stampa un riepilogo leggibile dalla macchina invece del testo. |

## `webhooks gmail run`

Esegue `gog watch serve` più il ciclo di rinnovo automatico del watch in primo piano.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` accetta gli stessi flag di `gog watch serve`, consegna OpenClaw, Pub/Sub e Tailscale di `setup`, con le seguenti eccezioni:

- `--account` è **facoltativo** su `run` (usa come fallback l'account configurato).
- `run` **non** accetta `--project`, `--push-endpoint` o `--json`.
- I flag di `run` non hanno valori predefiniti integrati; i valori mancanti usano come fallback i valori scritti da `setup`.

| Categoria          | Flag                                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| Consegna OpenClaw  | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Per `run`, il valore `--topic` è il percorso completo del topic Pub/Sub (`projects/.../topics/...`), non solo il nome breve del topic.
</Note>

## Flusso end-to-end

Consulta [Integrazione Gmail Pub/Sub](/it/automation/cron-jobs#gmail-pubsub-integration) per la configurazione del progetto GCP, OAuth e lato Gateway che si abbina a questi comandi CLI.

## Correlati

- [Riferimento CLI](/it/cli)
- [Automazione Webhook](/it/automation/cron-jobs)
- [Gmail Pub/Sub](/it/automation/cron-jobs#gmail-pubsub-integration)
