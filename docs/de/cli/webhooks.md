---
read_when:
    - Sie möchten Gmail-Pub/Sub-Ereignisse mit OpenClaw verbinden
    - Sie benötigen die vollständige Liste der Flags und die Standardwerte
summary: CLI-Referenz für `openclaw webhooks` (Einrichtung und Runner für Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-07-12T15:12:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook-Hilfsfunktionen und -Integrationen. Derzeit ist dieser Bereich auf Gmail-Pub/Sub-Abläufe beschränkt, die auf dem gebündelten `gog`-Watcher basieren.

## Unterbefehle

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Unterbefehl   | Beschreibung                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `gmail setup` | Einmaliger Assistent: Gmail-Überwachung, Pub/Sub-Thema/-Abonnement und Zustellung an den OpenClaw-Hook.             |
| `gmail run`   | Führt `gog watch serve` zusammen mit der Schleife zur automatischen Verlängerung der Überwachung im Vordergrund aus. |

<Note>
Der Gateway startet beim Hochfahren außerdem automatisch `gog gmail watch serve`, sobald `hooks.enabled=true` aktiviert und `hooks.gmail.account` festgelegt ist (wird durch `gmail setup` festgelegt). `gmail run` verwendet dieselbe Logik im Vordergrund und ist für die Fehlerbehebung oder bei deaktiviertem Gateway-Watcher nützlich. Einzelheiten zum automatischen Start und zur Deaktivierung über `OPENCLAW_SKIP_GMAIL_WATCHER` finden Sie unter [Gmail-Pub/Sub-Integration](/de/automation/cron-jobs#gmail-pubsub-integration).
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Installiert `gcloud` und `gog`, falls sie fehlen, authentifiziert `gcloud`, erstellt das Pub/Sub-Thema und -Abonnement, startet die Gmail-Überwachung und schreibt die `hooks.gmail`-Konfiguration mit `hooks.enabled=true`. Gibt `Next: openclaw webhooks gmail run` aus.

### Erforderlich

| Flag                | Beschreibung                    |
| ------------------- | ------------------------------- |
| `--account <email>` | Zu überwachendes Gmail-Konto.   |

### Pub/Sub-Optionen

| Flag                    | Standard               | Beschreibung                                                                                                                                                                  |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (keiner)               | GCP-Projekt-ID (Eigentümer des OAuth-Clients). Verwendet ersatzweise die Projekt-ID des Themas und anschließend das aus den `gog`-Anmeldedaten ermittelte Projekt.               |
| `--topic <name>`        | `gog-gmail-watch`      | Name des Pub/Sub-Themas.                                                                                                                                                       |
| `--subscription <name>` | `gog-gmail-watch-push` | Name des Pub/Sub-Abonnements.                                                                                                                                                  |
| `--label <label>`       | `INBOX`                | Zu überwachendes Gmail-Label.                                                                                                                                                  |
| `--push-endpoint <url>` | (keiner)               | Expliziter Pub/Sub-Push-Endpunkt. Überschreibt Tailscale.                                                                                                                      |

### OpenClaw-Zustellungsoptionen

| Flag                   | Standard                                           | Beschreibung                                      |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------- |
| `--hook-url <url>`     | Aus `hooks.path` und dem Gateway-Port erstellt     | OpenClaw-Webhook-URL.                             |
| `--hook-token <token>` | `hooks.token` oder ein generiertes Token           | OpenClaw-Webhook-Token.                           |
| `--push-token <token>` | Generiertes Token                                  | An `gog watch serve` weitergeleitetes Push-Token. |

### Optionen für `gog watch serve`

| Flag                  | Standardwert    | Beschreibung                                                                                                                                                                        |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Bind-Host für `gog watch serve`.                                                                                                                                                    |
| `--port <port>`       | `8788`          | Port für `gog watch serve`.                                                                                                                                                         |
| `--path <path>`       | `/gmail-pubsub` | Pfad für `gog watch serve`. Wird auf `/` erzwungen, wenn Tailscale ohne explizites Ziel aktiviert ist, da Tailscale den Pfad vor der Proxy-Weiterleitung entfernt.                   |
| `--include-body`      | `true`          | Schließt Ausschnitte des E-Mail-Texts ein. Es gibt keinen CLI-Flag zum Deaktivieren; setzen Sie stattdessen `hooks.gmail.includeBody: false` in der Konfiguration.                  |
| `--max-bytes <n>`     | `20000`         | Maximale Anzahl von Bytes pro Textausschnitt.                                                                                                                                       |
| `--renew-minutes <n>` | `720` (12h)     | Erneuert die Gmail-Überwachung alle N Minuten.                                                                                                                                      |

### Bereitstellung über Tailscale

| Flag                      | Standardwert | Beschreibung                                                                                   |
| ------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`     | Stellt den Push-Endpunkt über Tailscale bereit: `funnel`, `serve` oder `off`.                  |
| `--tailscale-path <path>` | (keiner)     | Pfad für Tailscale Serve/Funnel.                                                               |
| `--tailscale-target <t>`  | (keines)     | Ziel für Tailscale Serve/Funnel (Port, `host:port` oder URL).                                  |

### Ausgabe

| Flag     | Beschreibung                                                  |
| -------- | ------------------------------------------------------------- |
| `--json` | Gibt anstelle von Text eine maschinenlesbare Zusammenfassung aus. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Führt `gog watch serve` zusammen mit der Schleife zur automatischen Erneuerung der Überwachung im Vordergrund aus und startet `gog watch serve` nach einer Verzögerung von 2s neu, falls es unerwartet beendet wird.

`run` akzeptiert dieselben Pub/Sub-, OpenClaw-Zustellungs-, `gog watch serve`- und Tailscale-Flags wie `setup`, mit folgenden Ausnahmen:

- `--account` ist bei `run` **optional**; als Rückfallwert wird `hooks.gmail.account` verwendet.
- `run` akzeptiert `--project`, `--push-endpoint` und `--json` **nicht**.
- Für jeden Flag wird zunächst auf den entsprechenden Konfigurationswert unter `hooks.gmail.*` (von `setup` geschrieben) und anschließend auf denselben integrierten Standardwert zurückgegriffen, den `setup` verwendet. Eine Ausnahme gilt: Wenn weder der Flag noch `hooks.gmail.tailscale.mode` festgelegt ist, verwendet `--tailscale` bei `run` standardmäßig `off` (nicht `funnel`).

| Kategorie          | Flags                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw-Zustellung | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Bei `run` ist der Wert von `--topic` der vollständige Pub/Sub-Themenpfad (`projects/.../topics/...`) und nicht nur der kurze Themenname.
</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Webhook-Automatisierung](/de/automation/cron-jobs)
- [Gmail-Pub/Sub-Integration](/de/automation/cron-jobs#gmail-pubsub-integration)
