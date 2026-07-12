---
read_when:
    - Je wilt Gmail Pub/Sub-gebeurtenissen koppelen aan OpenClaw
    - Je hebt de volledige lijst met vlaggen en de standaardwaarden nodig
summary: CLI-referentie voor `openclaw webhooks` (Gmail Pub/Sub-configuratie en runner)
title: Webhooks
x-i18n:
    generated_at: "2026-07-12T08:47:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Hulpprogramma's en integraties voor Webhooks. Momenteel is dit onderdeel beperkt tot Gmail Pub/Sub-stromen die zijn gebaseerd op de meegeleverde `gog`-watcher.

## Subcommando's

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Subcommando   | Beschrijving                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `gmail setup` | Eenmalige wizard: Gmail-watch, Pub/Sub-onderwerp/-abonnement en aflevering bij de OpenClaw-hook.      |
| `gmail run`   | Voert `gog watch serve` plus de lus voor automatische verlenging van de watch op de voorgrond uit.    |

<Note>
De Gateway start `gog gmail watch serve` bij het opstarten ook automatisch zodra `hooks.enabled=true` en `hooks.gmail.account` zijn ingesteld (ingesteld door `gmail setup`). `gmail run` gebruikt dezelfde logica op de voorgrond en is nuttig voor foutopsporing of wanneer de Gateway-watcher is uitgeschakeld. Zie [Gmail Pub/Sub-integratie](/nl/automation/cron-jobs#gmail-pubsub-integration) voor details over automatisch starten en de mogelijkheid om dit uit te schakelen met `OPENCLAW_SKIP_GMAIL_WATCHER`.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Installeert `gcloud` en `gog` als deze ontbreken, verifieert `gcloud`, maakt het Pub/Sub-onderwerp en -abonnement aan, start de Gmail-watch en schrijft de configuratie `hooks.gmail` met `hooks.enabled=true`. Toont `Volgende: openclaw webhooks gmail run`.

### Vereist

| Vlag                | Beschrijving                      |
| ------------------- | --------------------------------- |
| `--account <email>` | Gmail-account dat moet worden gevolgd. |

### Pub/Sub-opties

| Vlag                    | Standaard              | Beschrijving                                                                                                                                                 |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--project <id>`        | (geen)                 | GCP-project-id (de eigenaar van de OAuth-client). Valt terug op de eigen project-id van het onderwerp en vervolgens op het project dat uit de `gog`-referenties is bepaald. |
| `--topic <name>`        | `gog-gmail-watch`      | Naam van het Pub/Sub-onderwerp.                                                                                                                              |
| `--subscription <name>` | `gog-gmail-watch-push` | Naam van het Pub/Sub-abonnement.                                                                                                                             |
| `--label <label>`       | `INBOX`                | Gmail-label dat moet worden gevolgd.                                                                                                                        |
| `--push-endpoint <url>` | (geen)                 | Expliciet Pub/Sub-push-eindpunt. Overschrijft Tailscale.                                                                                                    |

### OpenClaw-afleveringsopties

| Vlag                   | Standaard                                         | Beschrijving               |
| ---------------------- | ------------------------------------------------- | -------------------------- |
| `--hook-url <url>`     | Opgebouwd uit `hooks.path` en de Gateway-poort    | URL van de OpenClaw-Webhook. |
| `--hook-token <token>` | `hooks.token` of een gegenereerd token            | Token voor de OpenClaw-Webhook. |
| `--push-token <token>` | Gegenereerd token                                 | Pushtoken dat wordt doorgestuurd naar `gog watch serve`. |

### Opties voor `gog watch serve`

| Vlag                  | Standaard       | Beschrijving                                                                                                                                                                       |
| --------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Bindhost voor `gog watch serve`.                                                                                                                                                   |
| `--port <port>`       | `8788`          | Poort voor `gog watch serve`.                                                                                                                                                     |
| `--path <path>`       | `/gmail-pubsub` | Pad voor `gog watch serve`. Wordt gedwongen ingesteld op `/` wanneer Tailscale is ingeschakeld zonder expliciet doel, omdat Tailscale het pad verwijdert voordat het wordt geproxyd. |
| `--include-body`      | `true`          | Neemt fragmenten van de e-mailtekst op. Er is geen CLI-vlag om dit uit te schakelen; stel in plaats daarvan `hooks.gmail.includeBody: false` in de configuratie in.                |
| `--max-bytes <n>`     | `20000`         | Maximumaantal bytes per tekstfragment.                                                                                                                                            |
| `--renew-minutes <n>` | `720` (12u)     | Verlengt de Gmail-watch elke N minuten.                                                                                                                                            |

### Beschikbaarstelling via Tailscale

| Vlag                      | Standaard | Beschrijving                                                                |
| ------------------------- | --------- | --------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`  | Stelt het push-eindpunt beschikbaar via Tailscale: `funnel`, `serve` of `off`. |
| `--tailscale-path <path>` | (geen)    | Pad voor Tailscale serve/funnel.                                            |
| `--tailscale-target <t>`  | (geen)    | Doel voor Tailscale serve/funnel (poort, `host:port` of URL).                |

### Uitvoer

| Vlag     | Beschrijving                                               |
| -------- | ---------------------------------------------------------- |
| `--json` | Toont een machineleesbare samenvatting in plaats van tekst. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Voert `gog watch serve` plus de lus voor automatische verlenging van de watch op de voorgrond uit en start `gog watch serve` na een vertraging van 2 seconden opnieuw als het onverwacht wordt afgesloten.

`run` accepteert dezelfde vlaggen voor Pub/Sub, OpenClaw-aflevering, `gog watch serve` en Tailscale als `setup`, met de volgende uitzonderingen:

- `--account` is **optioneel** bij `run`; er wordt teruggevallen op `hooks.gmail.account`.
- `run` accepteert **geen** `--project`, `--push-endpoint` of `--json`.
- Elke vlag valt terug op de overeenkomende configuratiewaarde `hooks.gmail.*` (geschreven door `setup`) en vervolgens op dezelfde ingebouwde standaardwaarde die `setup` gebruikt, met één uitzondering: `--tailscale` gebruikt bij `run` standaard `off` (niet `funnel`) wanneer noch de vlag, noch `hooks.gmail.tailscale.mode` is ingesteld.

| Categorie          | Vlaggen                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw-aflevering | `--hook-url`, `--hook-token`, `--push-token`                                    |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Voor `run` is de waarde van `--topic` het volledige pad van het Pub/Sub-onderwerp (`projects/.../topics/...`), niet alleen de korte onderwerpnaam.
</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Webhook-automatisering](/nl/automation/cron-jobs)
- [Gmail Pub/Sub-integratie](/nl/automation/cron-jobs#gmail-pubsub-integration)
