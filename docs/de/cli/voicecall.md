---
read_when:
    - Sie verwenden das Sprachanruf-Plugin und möchten jeden CLI-Einstiegspunkt
    - Sie benötigen Tabellen mit Flags und Standardwerten für setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose und start
summary: CLI-Referenz für `openclaw voicecall` (Befehlsoberfläche des Sprachanruf-Plugins)
title: Sprachanruf
x-i18n:
    generated_at: "2026-07-12T15:10:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` ist ein von einem Plugin bereitgestellter Befehl. Er wird nur angezeigt, wenn das Sprachanruf-Plugin installiert und aktiviert ist.

Wenn der Gateway ausgeführt wird, werden operative Befehle (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, `status`) an die Sprachanruf-Runtime dieses Gateways weitergeleitet. Ist kein Gateway erreichbar, greifen sie auf eine eigenständige CLI-Runtime zurück.

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

| Unterbefehl | Beschreibung                                                                  |
| ----------- | ----------------------------------------------------------------------------- |
| `setup`     | Zeigt Prüfungen der Provider- und Webhook-Bereitschaft an.                    |
| `smoke`     | Führt Bereitschaftsprüfungen durch; tätigt nur mit `--yes` einen echten Testanruf. |
| `call`      | Initiiert einen ausgehenden Sprachanruf.                                      |
| `start`     | Alias für `call`, wobei `--to` erforderlich und `--message` optional ist.     |
| `continue`  | Spricht eine Nachricht und wartet auf die nächste Antwort.                    |
| `speak`     | Spricht eine Nachricht, ohne auf eine Antwort zu warten.                      |
| `dtmf`      | Sendet DTMF-Ziffern an einen aktiven Anruf.                                   |
| `end`       | Beendet einen aktiven Anruf.                                                  |
| `status`    | Prüft aktive Anrufe (oder einen bestimmten über `--call-id`).                 |
| `tail`      | Verfolgt `calls.jsonl` fortlaufend (nützlich bei Provider-Tests).             |
| `latency`   | Fasst Metriken zur Antwortlatenz aus `calls.jsonl` zusammen.                  |
| `expose`    | Schaltet Tailscale Serve/Funnel für den Webhook-Endpunkt um.                  |

## Einrichtung und Funktionstest

### `setup`

Gibt standardmäßig menschenlesbare Bereitschaftsprüfungen aus. Verwenden Sie `--json` für Skripte.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Führt dieselben Bereitschaftsprüfungen durch. Tätigt nur dann einen echten Telefonanruf, wenn sowohl `--to` als auch `--yes` angegeben sind.

| Flag               | Standardwert                      | Beschreibung                                      |
| ------------------ | --------------------------------- | ------------------------------------------------- |
| `-t, --to <phone>` | (keiner)                          | Telefonnummer für einen echten Funktionstest.     |
| `--message <text>` | `OpenClaw voice call smoke test.` | Während des Testanrufs zu sprechende Nachricht.   |
| `--mode <mode>`    | `notify`                          | Anrufmodus: `notify` oder `conversation`.         |
| `--yes`            | `false`                           | Tätigt tatsächlich den echten ausgehenden Anruf.  |
| `--json`           | `false`                           | Gibt maschinenlesbares JSON aus.                  |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # Probelauf
openclaw voicecall smoke --to "+15555550123" --yes  # echter Benachrichtigungsanruf
```

<Note>
Für externe Provider (`plivo`, `telnyx`, `twilio`) benötigen `setup` und `smoke` eine öffentliche Webhook-URL aus `publicUrl`, einem Tunnel oder einer Tailscale-Freigabe. Ein Loopback- oder privater Serve-Fallback wird abgelehnt, da die Telekommunikationsanbieter ihn nicht erreichen können.
</Note>

## Anruflebenszyklus

### `call`

Initiiert einen ausgehenden Sprachanruf.

| Flag                   | Erforderlich | Standardwert     | Beschreibung                                                                                      |
| ---------------------- | ------------ | ---------------- | ------------------------------------------------------------------------------------------------- |
| `-m, --message <text>` | ja           | (keiner)         | Nachricht, die gesprochen wird, sobald der Anruf verbunden ist.                                  |
| `-t, --to <phone>`     | nein         | config `toNumber` | Anzurufende Telefonnummer im E.164-Format.                                                       |
| `--mode <mode>`        | nein         | `conversation`   | Anrufmodus: `notify` (nach der Nachricht auflegen) oder `conversation` (Verbindung offen halten). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias für `call` mit einer anderen Standardstruktur der Flags.

| Flag               | Erforderlich | Standardwert   | Beschreibung                                                     |
| ------------------ | ------------ | -------------- | ---------------------------------------------------------------- |
| `--to <phone>`     | ja           | (keiner)       | Anzurufende Telefonnummer.                                       |
| `--message <text>` | nein         | (keiner)       | Nachricht, die gesprochen wird, sobald der Anruf verbunden ist.  |
| `--mode <mode>`    | nein         | `conversation` | Anrufmodus: `notify` oder `conversation`.                         |

### `continue`

Spricht eine Nachricht und wartet auf eine Antwort.

| Flag               | Erforderlich | Beschreibung             |
| ------------------ | ------------ | ------------------------ |
| `--call-id <id>`   | ja           | Anruf-ID.                |
| `--message <text>` | ja           | Zu sprechende Nachricht. |

### `speak`

Spricht eine Nachricht, ohne auf eine Antwort zu warten.

| Flag               | Erforderlich | Beschreibung             |
| ------------------ | ------------ | ------------------------ |
| `--call-id <id>`   | ja           | Anruf-ID.                |
| `--message <text>` | ja           | Zu sprechende Nachricht. |

### `dtmf`

Sendet DTMF-Ziffern an einen aktiven Anruf.

| Flag                | Erforderlich | Beschreibung                                                |
| ------------------- | ------------ | ----------------------------------------------------------- |
| `--call-id <id>`    | ja           | Anruf-ID.                                                   |
| `--digits <digits>` | ja           | DTMF-Ziffern (zum Beispiel `ww123456#` für Wartepausen).    |

### `end`

Beendet einen aktiven Anruf.

| Flag             | Erforderlich | Beschreibung |
| ---------------- | ------------ | ------------ |
| `--call-id <id>` | ja           | Anruf-ID.    |

### `status`

Prüft aktive Anrufe.

| Flag             | Standardwert | Beschreibung                                |
| ---------------- | ------------ | ------------------------------------------- |
| `--call-id <id>` | (keiner)     | Beschränkt die Ausgabe auf einen Anruf.     |
| `--json`         | `false`      | Gibt maschinenlesbares JSON aus.            |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Protokolle und Metriken

### `tail`

Verfolgt das JSONL-Protokoll der Sprachanrufe fortlaufend. Gibt beim Start die letzten `--since` Zeilen aus und überträgt anschließend neue Zeilen, sobald sie geschrieben werden.

| Flag            | Standardwert               | Beschreibung                                         |
| --------------- | -------------------------- | ---------------------------------------------------- |
| `--file <path>` | aus dem Plugin-Speicher ermittelt | Pfad zu `calls.jsonl`.                         |
| `--since <n>`   | `25`                       | Anzahl der Zeilen, die vor der fortlaufenden Ausgabe ausgegeben werden. |
| `--poll <ms>`   | `250` (Minimum 50)         | Abfrageintervall in Millisekunden.                   |

### `latency`

Fasst Metriken zur Antwortlatenz und Wartezeit beim Zuhören aus `calls.jsonl` zusammen. Die Ausgabe ist JSON mit Zusammenfassungen für `recordsScanned`, `turnLatency` und `listenWait`.

| Flag            | Standardwert               | Beschreibung                                      |
| --------------- | -------------------------- | ------------------------------------------------- |
| `--file <path>` | aus dem Plugin-Speicher ermittelt | Pfad zu `calls.jsonl`.                      |
| `--last <n>`    | `200` (Minimum 1)          | Anzahl der zu analysierenden neuesten Datensätze. |

## Webhooks freigeben

### `expose`

Aktiviert, deaktiviert oder ändert die Tailscale-Serve/Funnel-Konfiguration für den Sprach-Webhook.

| Flag                  | Standardwert                              | Beschreibung                                         |
| --------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (Tailnet) oder `funnel` (öffentlich). |
| `--path <path>`       | config `tailscale.path` oder `--serve-path` | Freizugebender Tailscale-Pfad.                     |
| `--port <port>`       | config `serve.port` oder `3334`           | Lokaler Webhook-Port.                                |
| `--serve-path <path>` | config `serve.path` oder `/voice/webhook` | Lokaler Webhook-Pfad.                                |

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
- [Sprachanruf-Plugin](/de/plugins/voice-call)
