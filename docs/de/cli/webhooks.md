---
read_when:
    - Sie möchten Gmail-Pub/Sub-Ereignisse mit OpenClaw verbinden
    - Sie benötigen die vollständige Liste der Flags und die Standardwerte.
summary: CLI-Referenz für `openclaw webhooks` (Einrichtung und Runner für Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-07-12T01:34:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook-Hilfsfunktionen und -Integrationen. Derzeit ist dieser Bereich auf Gmail-Pub/Sub-Abläufe beschränkt, die auf dem mitgelieferten `gog`-Watcher basieren.

## Unterbefehle

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Unterbefehl   | Beschreibung                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `gmail setup` | Einmaliger Assistent: Gmail-Überwachung, Pub/Sub-Thema und -Abonnement sowie Hook-Zustellung an OpenClaw. |
| `gmail run`   | Führt `gog watch serve` zusammen mit der automatischen Erneuerung der Überwachung im Vordergrund aus.     |

<Note>
Der Gateway startet `gog gmail watch serve` beim Hochfahren ebenfalls automatisch, sobald `hooks.enabled=true` aktiviert und `hooks.gmail.account` festgelegt ist (durch `gmail setup`). `gmail run` verwendet dieselbe Logik im Vordergrund und ist für die Fehlerbehebung oder bei deaktiviertem Gateway-Watcher hilfreich. Einzelheiten zum automatischen Start und zur Deaktivierung über `OPENCLAW_SKIP_GMAIL_WATCHER` finden Sie unter [Gmail-Pub/Sub-Integration](/de/automation/cron-jobs#gmail-pubsub-integration).
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Installiert bei Bedarf `gcloud` und `gog`, authentifiziert `gcloud`, erstellt das Pub/Sub-Thema und -Abonnement, startet die Gmail-Überwachung und schreibt die Konfiguration `hooks.gmail` mit `hooks.enabled=true`. Gibt `Next: openclaw webhooks gmail run` aus.

### Erforderlich

| Flag                | Beschreibung                     |
| ------------------- | -------------------------------- |
| `--account <email>` | Zu überwachendes Gmail-Konto.    |

### Pub/Sub-Optionen

| Flag                    | Standardwert           | Beschreibung                                                                                                                                                                                                     |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (keiner)               | GCP-Projekt-ID (Eigentümer des OAuth-Clients). Verwendet ersatzweise zunächst die Projekt-ID des Themas und anschließend das aus den `gog`-Anmeldedaten ermittelte Projekt.                                        |
| `--topic <name>`        | `gog-gmail-watch`      | Name des Pub/Sub-Themas.                                                                                                                                                                                         |
| `--subscription <name>` | `gog-gmail-watch-push` | Name des Pub/Sub-Abonnements.                                                                                                                                                                                    |
| `--label <label>`       | `INBOX`                | Zu überwachendes Gmail-Label.                                                                                                                                                                                    |
| `--push-endpoint <url>` | (keiner)               | Expliziter Pub/Sub-Push-Endpunkt. Überschreibt Tailscale.                                                                                                                                                        |

### OpenClaw-Zustellungsoptionen

| Flag                   | Standardwert                                  | Beschreibung                      |
| ---------------------- | --------------------------------------------- | --------------------------------- |
| `--hook-url <url>`     | Aus `hooks.path` und dem Gateway-Port gebildet | OpenClaw-Webhook-URL.             |
| `--hook-token <token>` | `hooks.token` oder ein generiertes Token       | OpenClaw-Webhook-Token.           |
| `--push-token <token>` | Generiertes Token                              | An `gog watch serve` weitergeleitetes Push-Token. |

### Optionen für `gog watch serve`

| Flag                  | Standardwert    | Beschreibung                                                                                                                                                                                                                  |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Bind-Host für `gog watch serve`.                                                                                                                                                                                              |
| `--port <port>`       | `8788`          | Port für `gog watch serve`.                                                                                                                                                                                                   |
| `--path <path>`       | `/gmail-pubsub` | Pfad für `gog watch serve`. Wird bei aktiviertem Tailscale ohne explizites Ziel auf `/` gesetzt, da Tailscale den Pfad vor der Proxy-Weiterleitung entfernt.                                                                  |
| `--include-body`      | `true`          | Bezieht Auszüge aus dem E-Mail-Text ein. Es gibt kein CLI-Flag, um dies zu deaktivieren; legen Sie stattdessen `hooks.gmail.includeBody: false` in der Konfiguration fest.                                                     |
| `--max-bytes <n>`     | `20000`         | Maximale Byteanzahl pro Textauszug.                                                                                                                                                                                           |
| `--renew-minutes <n>` | `720` (12h)     | Erneuert die Gmail-Überwachung alle N Minuten.                                                                                                                                                                                |

### Tailscale-Bereitstellung

| Flag                      | Standardwert | Beschreibung                                                                                   |
| ------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`     | Stellt den Push-Endpunkt über Tailscale bereit: `funnel`, `serve` oder `off`.                  |
| `--tailscale-path <path>` | (keiner)     | Pfad für Tailscale Serve/Funnel.                                                               |
| `--tailscale-target <t>`  | (keiner)     | Ziel für Tailscale Serve/Funnel (Port, `host:port` oder URL).                                   |

### Ausgabe

| Flag     | Beschreibung                                                    |
| -------- | --------------------------------------------------------------- |
| `--json` | Gibt statt Text eine maschinenlesbare Zusammenfassung aus.      |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Führt `gog watch serve` zusammen mit der automatischen Erneuerung der Überwachung im Vordergrund aus und startet `gog watch serve` nach einer Verzögerung von 2 Sekunden neu, wenn es unerwartet beendet wird.

`run` akzeptiert dieselben Flags für Pub/Sub, die OpenClaw-Zustellung, `gog watch serve` und Tailscale wie `setup`, mit folgenden Ausnahmen:

- `--account` ist bei `run` **optional**; falls nicht angegeben, wird `hooks.gmail.account` verwendet.
- `run` akzeptiert `--project`, `--push-endpoint` und `--json` **nicht**.
- Jedes Flag verwendet ersatzweise zunächst den entsprechenden Konfigurationswert unter `hooks.gmail.*` (von `setup` geschrieben) und anschließend denselben integrierten Standardwert wie `setup`. Es gibt eine Ausnahme: Wenn weder das Flag noch `hooks.gmail.tailscale.mode` festgelegt ist, verwendet `--tailscale` bei `run` standardmäßig `off` (nicht `funnel`).

| Kategorie          | Flags                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw-Zustellung | `--hook-url`, `--hook-token`, `--push-token`                                    |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Bei `run` ist der Wert von `--topic` der vollständige Pfad des Pub/Sub-Themas (`projects/.../topics/...`) und nicht nur der kurze Themenname.
</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Webhook-Automatisierung](/de/automation/cron-jobs)
- [Gmail-Pub/Sub-Integration](/de/automation/cron-jobs#gmail-pubsub-integration)
