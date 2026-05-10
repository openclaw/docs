---
read_when:
    - Sie möchten Gmail-Pub/Sub-Ereignisse in OpenClaw einbinden
    - Sie benötigen die vollständige Liste der Flags und Standardwerte
summary: CLI-Referenz für `openclaw webhooks` (Gmail Pub/Sub-Einrichtung und -Runner)
title: Webhooks
x-i18n:
    generated_at: "2026-05-10T19:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook-Hilfsfunktionen und Integrationen. Derzeit ist diese Oberfläche auf Gmail-Pub/Sub-Abläufe beschränkt, die mit dem gebündelten `gog`-Watcher integriert sind.

## Unterbefehle

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Unterbefehl   | Beschreibung                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `gmail setup` | Gmail-Watch, Pub/Sub-Topic/-Subscription und das OpenClaw-Webhook-Zustellziel konfigurieren.             |
| `gmail run`   | `gog watch serve` zusammen mit der Schleife zur automatischen Watch-Erneuerung ausführen.                |

## `webhooks gmail setup`

Gmail-Watch, Pub/Sub und OpenClaw-Webhook-Zustellung konfigurieren.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Erforderlich

| Flag                | Beschreibung                    |
| ------------------- | -------------------------------- |
| `--account <email>` | Zu überwachendes Gmail-Konto.   |

### Pub/Sub-Optionen

| Flag                    | Standardwert          | Beschreibung                                             |
| ----------------------- | --------------------- | -------------------------------------------------------- |
| `--project <id>`        | (keiner)              | GCP-Projekt-ID (der Besitzer des OAuth-Clients).         |
| `--topic <name>`        | `gog-gmail-watch`     | Pub/Sub-Topic-Name.                                      |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub-Subscription-Name.                              |
| `--label <label>`       | `INBOX`               | Zu überwachendes Gmail-Label.                            |
| `--push-endpoint <url>` | (keiner)              | Expliziter Pub/Sub-Push-Endpunkt. Überschreibt Tailscale. |

### OpenClaw-Zustelloptionen

| Flag                   | Standardwert | Beschreibung                         |
| ---------------------- | ------------ | ------------------------------------ |
| `--hook-url <url>`     | (keiner)     | OpenClaw-Webhook-URL.                |
| `--hook-token <token>` | (keiner)     | OpenClaw-Webhook-Token.              |
| `--push-token <token>` | (keiner)     | Push-Token, der an `gog watch serve` weitergeleitet wird. |

### `gog watch serve`-Optionen

| Flag                  | Standardwert   | Beschreibung                                                             |
| --------------------- | -------------- | ------------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`    | Bind-Host für `gog watch serve`.                                         |
| `--port <port>`       | `8788`         | Port für `gog watch serve`.                                              |
| `--path <path>`       | `/gmail-pubsub` | Pfad für `gog watch serve`.                                             |
| `--include-body`      | `true`         | E-Mail-Textauszüge einschließen. Übergeben Sie `--no-include-body`, um dies zu deaktivieren. |
| `--max-bytes <n>`     | `20000`        | Maximale Byteanzahl pro Textauszug.                                      |
| `--renew-minutes <n>` | `720` (12h)    | Gmail-Watch alle N Minuten erneuern.                                     |

### Tailscale-Freigabe

| Flag                      | Standardwert | Beschreibung                                                                    |
| ------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`     | Push-Endpunkt über tailscale freigeben: `funnel`, `serve` oder `off`.           |
| `--tailscale-path <path>` | (keiner)     | Pfad für tailscale serve/funnel.                                                |
| `--tailscale-target <t>`  | (keiner)     | Ziel für Tailscale serve/funnel (Port, `host:port` oder URL).                   |

### Ausgabe

| Flag     | Beschreibung                                                |
| -------- | ----------------------------------------------------------- |
| `--json` | Eine maschinenlesbare Zusammenfassung statt Text ausgeben.  |

## `webhooks gmail run`

`gog watch serve` zusammen mit der Schleife zur automatischen Watch-Erneuerung im Vordergrund ausführen.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` akzeptiert dieselben `gog watch serve`-, OpenClaw-Zustell-, Pub/Sub- und Tailscale-Flags wie `setup`, mit folgenden Ausnahmen:

- `--account` ist bei `run` **optional** (es greift auf das konfigurierte Konto zurück).
- `run` akzeptiert **nicht** `--project`, `--push-endpoint` oder `--json`.
- `run`-Flags haben keine eingebauten Standardwerte; fehlende Werte greifen auf die von `setup` geschriebenen Werte zurück.

| Kategorie          | Flags                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw-Zustellung | `--hook-url`, `--hook-token`, `--push-token`                                    |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Für `run` ist der Wert von `--topic` der vollständige Pub/Sub-Topic-Pfad (`projects/.../topics/...`), nicht nur der kurze Topic-Name.
</Note>

## End-to-End-Ablauf

Siehe [Gmail-Pub/Sub-Integration](/de/automation/cron-jobs#gmail-pubsub-integration) für das GCP-Projekt, OAuth und die Gateway-seitige Einrichtung, die zu diesen CLI-Befehlen passt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Webhook-Automatisierung](/de/automation/cron-jobs)
- [Gmail Pub/Sub](/de/automation/cron-jobs#gmail-pubsub-integration)
