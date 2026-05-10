---
read_when:
    - Je wilt Gmail Pub/Sub-gebeurtenissen koppelen aan OpenClaw
    - Je hebt de volledige lijst met flags en standaardwaarden nodig
summary: CLI-referentie voor `openclaw webhooks` (Gmail Pub/Sub-configuratie en uitvoerder)
title: Webhooks
x-i18n:
    generated_at: "2026-05-10T19:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook-helpers en -integraties. Op dit moment is dit oppervlak beperkt tot Gmail Pub/Sub-flows die integreren met de meegeleverde `gog`-watcher.

## Subcommando's

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Subcommando    | Beschrijving                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| `gmail setup` | Configureer Gmail-watch, Pub/Sub-topic/-subscription en het OpenClaw-webhookbezorgdoel. |
| `gmail run`   | Voer `gog watch serve` uit plus de automatische vernieuwingslus voor de watch.                                        |

## `webhooks gmail setup`

Configureer Gmail-watch, Pub/Sub en OpenClaw-webhookbezorging.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Vereist

| Vlag                | Beschrijving             |
| ------------------- | ----------------------- |
| `--account <email>` | Gmail-account om te bewaken. |

### Pub/Sub-opties

| Vlag                    | Standaard                | Beschrijving                                          |
| ----------------------- | ---------------------- | ---------------------------------------------------- |
| `--project <id>`        | (geen)                 | GCP-project-id (de eigenaar van de OAuth-client).             |
| `--topic <name>`        | `gog-gmail-watch`      | Naam van Pub/Sub-topic.                                  |
| `--subscription <name>` | `gog-gmail-watch-push` | Naam van Pub/Sub-subscription.                           |
| `--label <label>`       | `INBOX`                | Gmail-label om te bewaken.                                |
| `--push-endpoint <url>` | (geen)                 | Expliciet Pub/Sub-pushendpoint. Overschrijft Tailscale. |

### OpenClaw-bezorgopties

| Vlag                   | Standaard | Beschrijving                                |
| ---------------------- | ------- | ------------------------------------------ |
| `--hook-url <url>`     | (geen)  | OpenClaw-webhook-URL.                      |
| `--hook-token <token>` | (geen)  | OpenClaw-webhook-token.                    |
| `--push-token <token>` | (geen)  | Push-token dat wordt doorgestuurd naar `gog watch serve`. |

### `gog watch serve`-opties

| Vlag                  | Standaard         | Beschrijving                                                       |
| --------------------- | --------------- | ----------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Bind-host voor `gog watch serve`.                                      |
| `--port <port>`       | `8788`          | Poort voor `gog watch serve`.                                           |
| `--path <path>`       | `/gmail-pubsub` | Pad voor `gog watch serve`.                                           |
| `--include-body`      | `true`          | Neem snippets van de e-mailbody op. Geef `--no-include-body` door om dit uit te schakelen. |
| `--max-bytes <n>`     | `20000`         | Maximaal aantal bytes per bodysnippet.                                       |
| `--renew-minutes <n>` | `720` (12u)     | Vernieuw Gmail-watch elke N minuten.                                |

### Tailscale-blootstelling

| Vlag                      | Standaard  | Beschrijving                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Stel pushendpoint beschikbaar via Tailscale: `funnel`, `serve` of `off`. |
| `--tailscale-path <path>` | (geen)   | Pad voor Tailscale serve/funnel.                                 |
| `--tailscale-target <t>`  | (geen)   | Doel voor Tailscale serve/funnel (poort, `host:port` of URL).       |

### Uitvoer

| Vlag     | Beschrijving                                       |
| -------- | ------------------------------------------------- |
| `--json` | Druk een machineleesbare samenvatting af in plaats van tekst. |

## `webhooks gmail run`

Voer `gog watch serve` uit plus de automatische vernieuwingslus voor de watch op de voorgrond.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` accepteert dezelfde `gog watch serve`-, OpenClaw-bezorg-, Pub/Sub- en Tailscale-vlaggen als `setup`, behalve:

- `--account` is **optioneel** bij `run` (het valt terug op het geconfigureerde account).
- `run` accepteert **geen** `--project`, `--push-endpoint` of `--json`.
- `run`-vlaggen hebben geen ingebouwde standaardwaarden; ontbrekende waarden vallen terug op de waarden die door `setup` zijn geschreven.

| Categorie          | Vlaggen                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw-bezorging | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Voor `run` is de waarde van `--topic` het volledige Pub/Sub-topicpad (`projects/.../topics/...`), niet alleen de korte topicnaam.
</Note>

## End-to-end-flow

Zie [Gmail Pub/Sub-integratie](/nl/automation/cron-jobs#gmail-pubsub-integration) voor de GCP-project-, OAuth- en Gateway-side configuratie die bij deze CLI-commando's hoort.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Webhook-automatisering](/nl/automation/cron-jobs)
- [Gmail Pub/Sub](/nl/automation/cron-jobs#gmail-pubsub-integration)
