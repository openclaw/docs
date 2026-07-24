---
read_when:
    - Sie möchten Gmail-Pub/Sub-Ereignisse in OpenClaw integrieren
    - Sie benötigen die vollständige Liste der Flags und die Standardwerte
summary: CLI-Referenz für `openclaw webhooks` (Gmail-Pub/Sub-Einrichtung und Runner)
title: Webhooks
x-i18n:
    generated_at: "2026-07-24T04:52:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
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

| Unterbefehl    | Beschreibung                                                                           |
| -------------- | -------------------------------------------------------------------------------------- |
| `gmail setup` | Einmaliger Assistent: Gmail-Watch, Pub/Sub-Thema/-Abonnement und Zustellung an den OpenClaw-Hook. |
| `gmail run`   | Führt `gog watch serve` zusammen mit der Schleife zur automatischen Watch-Verlängerung im Vordergrund aus. |

<Note>
Das Gateway startet `gog gmail watch serve` beim Hochfahren ebenfalls automatisch, sobald `hooks.enabled=true` und `hooks.gmail.account` festgelegt sind (durch `gmail setup`). `gmail run` verwendet dieselbe Logik im Vordergrund und ist für die Fehlerbehebung oder bei deaktiviertem Gateway-Watcher nützlich. Einzelheiten zum automatischen Start und zur Deaktivierung über `OPENCLAW_SKIP_GMAIL_WATCHER` finden Sie unter [Gmail-Pub/Sub-Integration](/de/automation/cron-jobs#gmail-pubsub-integration).
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Installiert bei Bedarf `gcloud` und `gog`, authentifiziert `gcloud`, erstellt das Pub/Sub-Thema und -Abonnement, startet die Gmail-Watch und schreibt die `hooks.gmail`-Konfiguration mit `hooks.enabled=true`. Gibt `Next: openclaw webhooks gmail run` aus.

### Erforderlich

| Flag                | Beschreibung                   |
| ------------------- | ------------------------------ |
| `--account <email>` | Zu überwachendes Gmail-Konto. |

### Pub/Sub-Optionen

| Flag                    | Standardwert           | Beschreibung                                                                                                                             |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (keiner)               | GCP-Projekt-ID (Eigentümer des OAuth-Clients). Greift ersatzweise auf die eigene Projekt-ID des Themas und danach auf das aus den Anmeldedaten von `gog` ermittelte Projekt zurück. |
| `--topic <name>`        | `gog-gmail-watch`      | Name des Pub/Sub-Themas.                                                                                                                 |
| `--subscription <name>` | `gog-gmail-watch-push` | Name des Pub/Sub-Abonnements.                                                                                                            |
| `--label <label>`       | `INBOX`                | Zu überwachendes Gmail-Label.                                                                                                            |
| `--push-endpoint <url>` | (keiner)               | Expliziter Pub/Sub-Push-Endpunkt. Überschreibt Tailscale.                                                                                 |

### OpenClaw-Zustellungsoptionen

| Flag                   | Standardwert                                      | Beschreibung                                |
| ---------------------- | ------------------------------------------------- | ------------------------------------------- |
| `--hook-url <url>`     | Aus `hooks.path` und dem Gateway-Port erstellt | OpenClaw-Webhook-URL.                       |
| `--hook-token <token>` | `hooks.token` oder ein generiertes Token          | OpenClaw-Webhook-Token.                     |
| `--push-token <token>` | Generiertes Token                                 | An `gog watch serve` weitergeleitetes Push-Token. |

### Optionen für `gog watch serve`

| Flag                  | Standardwert    | Beschreibung                                                                                                                                  |
| --------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Bind-Host von `gog watch serve`.                                                                                                             |
| `--port <port>`       | `8788`          | Port von `gog watch serve`.                                                                                                                  |
| `--path <path>`       | `/gmail-pubsub` | Pfad von `gog watch serve`. Wird auf `/` erzwungen, wenn Tailscale ohne explizites Ziel aktiviert ist, da Tailscale den Pfad vor dem Proxying entfernt. |
| `--include-body`      | `true`          | Fügt Ausschnitte des E-Mail-Texts ein. Es gibt kein CLI-Flag zum Deaktivieren; legen Sie stattdessen `hooks.gmail.includeBody: false` in der Konfiguration fest. |
| `--max-bytes <n>`     | `20000`         | Maximale Byte-Anzahl pro Textausschnitt.                                                                                                      |
| `--renew-minutes <n>` | `720` (12h)     | Verlängert die Gmail-Watch alle N Minuten.                                                                                                    |

### Bereitstellung über Tailscale

| Flag                      | Standardwert | Beschreibung                                                      |
| ------------------------- | ------------ | ----------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Stellt den Push-Endpunkt über Tailscale bereit: `funnel`, `serve` oder `off`. |
| `--tailscale-path <path>` | (keiner)     | Pfad für Tailscale Serve/Funnel.                                  |
| `--tailscale-target <t>`  | (keiner)     | Ziel für Tailscale Serve/Funnel (Port, `host:port` oder URL). |

### Ausgabe

| Flag     | Beschreibung                                                |
| -------- | ----------------------------------------------------------- |
| `--json` | Gibt statt Text eine maschinenlesbare Zusammenfassung aus. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Führt `gog watch serve` zusammen mit der Schleife zur automatischen Watch-Verlängerung im Vordergrund aus und startet `gog watch serve` nach einer Verzögerung von 2s neu, falls es unerwartet beendet wird.

`run` akzeptiert dieselben Pub/Sub-, OpenClaw-Zustellungs-, `gog watch serve`- und Tailscale-Flags wie `setup`, mit folgenden Ausnahmen:

- `--account` ist bei `run` **optional**; ersatzweise wird `hooks.gmail.account` verwendet.
- `run` akzeptiert `--project`, `--push-endpoint` oder `--json` **nicht**.
- Jedes Flag greift ersatzweise auf den entsprechenden `hooks.gmail.*`-Konfigurationswert zurück (geschrieben von `setup`) und danach auf denselben integrierten Standardwert, den `setup` verwendet, mit einer Ausnahme: `--tailscale` verwendet bei `run` standardmäßig `off` (nicht `funnel`), wenn weder das Flag noch `hooks.gmail.tailscale.mode` festgelegt ist.

| Kategorie         | Flags                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw-Zustellung | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Für `run` ist der Wert von `--topic` der vollständige Pfad des Pub/Sub-Themas (`projects/.../topics/...`) und nicht nur der kurze Themenname.
</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Webhook-Automatisierung](/de/automation/cron-jobs)
- [Gmail-Pub/Sub-Integration](/de/automation/cron-jobs#gmail-pubsub-integration)
