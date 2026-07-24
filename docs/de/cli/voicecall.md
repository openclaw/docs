---
read_when:
    - Sie verwenden das Voice-Call-Plugin und möchten jeden CLI-Einstiegspunkt
    - Sie benötigen Tabellen mit Flags und Standardwerten für setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose und start
summary: CLI-Referenz für `openclaw voicecall` (Befehlsoberfläche des Sprachanruf-Plugins)
title: Sprachanruf
x-i18n:
    generated_at: "2026-07-24T04:29:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` ist ein von einem Plugin bereitgestellter Befehl. Er wird nur angezeigt, wenn das Voice-Call-Plugin installiert und aktiviert ist.

Wenn der Gateway ausgeführt wird, werden operative Befehle (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, `status`) an die Voice-Call-Laufzeit dieses Gateways weitergeleitet. Ist kein Gateway erreichbar, greifen sie auf eine eigenständige CLI-Laufzeit zurück.

## Unterbefehle

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

| Unterbefehl | Beschreibung                                                     |
| ---------- | --------------------------------------------------------------- |
| `setup`    | Bereitschaftsprüfungen für Provider und Webhook anzeigen.                     |
| `smoke`    | Bereitschaftsprüfungen ausführen; einen echten Testanruf nur mit `--yes` tätigen. |
| `call`     | Einen ausgehenden Sprachanruf einleiten.                                |
| `start`    | Alias für `call`; `--to` ist erforderlich und `--message` optional. |
| `continue` | Eine Nachricht sprechen und auf die nächste Antwort warten.                 |
| `speak`    | Eine Nachricht sprechen, ohne auf eine Antwort zu warten.                 |
| `dtmf`     | DTMF-Ziffern an einen aktiven Anruf senden.                             |
| `end`      | Einen aktiven Anruf beenden.                                         |
| `status`   | Aktive Anrufe prüfen (oder einen einzelnen anhand von `--call-id`).                   |
| `tail`     | `calls.jsonl` fortlaufend anzeigen (nützlich bei Provider-Tests).              |
| `latency`  | Metriken zur Antwortlatenz aus `calls.jsonl` zusammenfassen.              |
| `expose`   | Tailscale Serve/Funnel für den Webhook-Endpunkt umschalten.         |

## Einrichtung und Smoke-Test

### `setup`

Gibt standardmäßig lesbare Bereitschaftsprüfungen aus. Übergeben Sie für Skripte `--json`.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Führt dieselben Bereitschaftsprüfungen aus. Tätigt nur dann einen echten Telefonanruf, wenn sowohl
`--to` als auch `--yes` vorhanden sind.

| Flag               | Standardwert                           | Beschreibung                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | (keiner)                            | Telefonnummer für einen echten Smoke-Test.  |
| `--message <text>` | `OpenClaw voice call smoke test.` | Während des Smoke-Test-Anrufs zu sprechende Nachricht. |
| `--mode <mode>`    | `notify`                          | Anrufmodus: `notify` oder `conversation`.  |
| `--yes`            | `false`                           | Den echten ausgehenden Anruf tatsächlich tätigen.  |
| `--json`           | `false`                           | Maschinenlesbares JSON ausgeben.            |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # Probelauf
openclaw voicecall smoke --to "+15555550123" --yes  # echter Benachrichtigungsanruf
```

<Note>
Für externe Provider (`plivo`, `telnyx`, `twilio`) benötigen `setup` und `smoke` eine öffentliche Webhook-URL von `publicUrl`, einen Tunnel oder eine Tailscale-Freigabe. Ein Loopback- oder privater Serve-Fallback wird abgelehnt, da Netzbetreiber ihn nicht erreichen können.
</Note>

## Anruflebenszyklus

### `call`

Einen ausgehenden Sprachanruf einleiten.

| Flag                   | Erforderlich | Standardwert           | Beschreibung                                                                |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | ja      | (keiner)            | Nachricht, die gesprochen wird, sobald der Anruf verbunden ist.                                   |
| `-t, --to <phone>`     | nein       | Konfiguration `toNumber` | Anzurufende Telefonnummer im E.164-Format.                                                |
| `--mode <mode>`        | nein       | `conversation`    | Anrufmodus: `notify` (nach der Nachricht auflegen) oder `conversation` (Verbindung offen halten). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hallo"
openclaw voicecall call -m "Zur Information" --mode notify
```

### `start`

Alias für `call` mit einer anderen Standardform der Flags.

| Flag               | Erforderlich | Standardwert        | Beschreibung                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | ja      | (keiner)         | Anzurufende Telefonnummer.                    |
| `--message <text>` | nein       | (keiner)         | Nachricht, die gesprochen wird, sobald der Anruf verbunden ist. |
| `--mode <mode>`    | nein       | `conversation` | Anrufmodus: `notify` oder `conversation`.   |

### `continue`

Eine Nachricht sprechen und auf eine Antwort warten.

| Flag               | Erforderlich | Beschreibung       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | ja      | Anruf-ID.          |
| `--message <text>` | ja      | Zu sprechende Nachricht. |

### `speak`

Eine Nachricht sprechen, ohne auf eine Antwort zu warten.

| Flag               | Erforderlich | Beschreibung       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | ja      | Anruf-ID.          |
| `--message <text>` | ja      | Zu sprechende Nachricht. |

### `dtmf`

DTMF-Ziffern an einen aktiven Anruf senden.

| Flag                | Erforderlich | Beschreibung                                      |
| ------------------- | -------- | ------------------------------------------------ |
| `--call-id <id>`    | ja      | Anruf-ID.                                         |
| `--digits <digits>` | ja      | DTMF-Ziffern (beispielsweise `ww123456#` für Wartezeiten). |

### `end`

Einen aktiven Anruf beenden.

| Flag             | Erforderlich | Beschreibung |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | ja      | Anruf-ID.    |

### `status`

Aktive Anrufe prüfen.

| Flag             | Standardwert | Beschreibung                  |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | (keiner)  | Ausgabe auf einen Anruf beschränken. |
| `--json`         | `false` | Maschinenlesbares JSON ausgeben. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Protokolle und Metriken

### `tail`

Zeigt das Voice-Call-JSONL-Protokoll fortlaufend an. Gibt beim Start die letzten `--since` Zeilen aus und
überträgt anschließend neue Zeilen, sobald sie geschrieben werden.

| Flag            | Standardwert                    | Beschreibung                    |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | aus dem Plugin-Speicher aufgelöst | Pfad zu `calls.jsonl`.         |
| `--since <n>`   | `25`                       | Anzahl der Zeilen, die vor der fortlaufenden Anzeige ausgegeben werden. |
| `--poll <ms>`   | `250` (mindestens 50)         | Abfrageintervall in Millisekunden. |

### `latency`

Fasst Metriken zur Antwortlatenz und Hörwartezeit aus `calls.jsonl` zusammen. Die Ausgabe ist
JSON mit Zusammenfassungen für `recordsScanned`, `turnLatency` und `listenWait`.

| Flag            | Standardwert                    | Beschreibung                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | aus dem Plugin-Speicher aufgelöst | Pfad zu `calls.jsonl`.               |
| `--last <n>`    | `200` (mindestens 1)          | Anzahl der zu analysierenden aktuellen Datensätze. |

## Webhooks freigeben

### `expose`

Aktiviert, deaktiviert oder ändert die Tailscale-Serve/Funnel-Konfiguration für den
Voice-Webhook.

| Flag                  | Standardwert                                   | Beschreibung                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (Tailnet) oder `funnel` (öffentlich). |
| `--path <path>`       | Konfiguration `tailscale.path` oder `--serve-path` | Freizugebender Tailscale-Pfad.                       |
| `--port <port>`       | Konfiguration `serve.port` oder `3334`             | Lokaler Webhook-Port.                             |
| `--serve-path <path>` | Konfiguration `serve.path` oder `/voice/webhook`   | Lokaler Webhook-Pfad.                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Geben Sie den Webhook-Endpunkt nur für Netzwerke frei, denen Sie vertrauen. Bevorzugen Sie nach Möglichkeit Tailscale Serve gegenüber Funnel.
</Warning>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Voice-Call-Plugin](/de/plugins/voice-call)
