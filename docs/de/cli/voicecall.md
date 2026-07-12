---
read_when:
    - Sie verwenden das Sprachanruf-Plugin und möchten jeden CLI-Einstiegspunkt
    - Sie benötigen Tabellen mit Flags und Standardwerten für `setup`, `smoke`, `call`, `continue`, `speak`, `dtmf`, `end`, `status`, `tail`, `latency`, `expose` und `start`
summary: CLI-Referenz für `openclaw voicecall` (Befehlsoberfläche des Sprachanruf-Plugins)
title: Sprachanruf
x-i18n:
    generated_at: "2026-07-12T01:30:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` ist ein von einem Plugin bereitgestellter Befehl. Er wird nur angezeigt, wenn das Sprachanruf-Plugin installiert und aktiviert ist.

Wenn der Gateway ausgeführt wird, werden operative Befehle (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) an die Sprachanruf-Laufzeit dieses Gateways weitergeleitet. Wenn kein Gateway erreichbar ist, greifen sie auf eine eigenständige CLI-Laufzeit zurück.

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

| Unterbefehl | Beschreibung                                                                 |
| ----------- | ---------------------------------------------------------------------------- |
| `setup`     | Zeigt Bereitschaftsprüfungen für Provider und Webhook an.                    |
| `smoke`     | Führt Bereitschaftsprüfungen durch; startet nur mit `--yes` einen echten Testanruf. |
| `call`      | Initiiert einen ausgehenden Sprachanruf.                                     |
| `start`     | Alias für `call`, wobei `--to` erforderlich und `--message` optional ist.    |
| `continue`  | Gibt eine Nachricht wieder und wartet auf die nächste Antwort.               |
| `speak`     | Gibt eine Nachricht wieder, ohne auf eine Antwort zu warten.                 |
| `dtmf`      | Sendet DTMF-Ziffern an einen aktiven Anruf.                                  |
| `end`       | Beendet einen aktiven Anruf.                                                 |
| `status`    | Prüft aktive Anrufe oder einen einzelnen über `--call-id`.                   |
| `tail`      | Verfolgt `calls.jsonl` fortlaufend (nützlich bei Provider-Tests).            |
| `latency`   | Fasst Metriken zur Durchgangslatenz aus `calls.jsonl` zusammen.              |
| `expose`    | Schaltet Tailscale Serve/Funnel für den Webhook-Endpunkt um.                 |

## Einrichtung und Funktionstest

### `setup`

Gibt standardmäßig menschenlesbare Bereitschaftsprüfungen aus. Verwenden Sie `--json` für Skripte.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Führt dieselben Bereitschaftsprüfungen durch. Ein echter Telefonanruf wird nur gestartet, wenn sowohl `--to` als auch `--yes` angegeben sind.

| Flag               | Standardwert                      | Beschreibung                                      |
| ------------------ | --------------------------------- | ------------------------------------------------- |
| `-t, --to <phone>` | (keiner)                          | Telefonnummer für einen echten Funktionstest.     |
| `--message <text>` | `OpenClaw voice call smoke test.` | Beim Testanruf wiederzugebende Nachricht.          |
| `--mode <mode>`    | `notify`                          | Anrufmodus: `notify` oder `conversation`.          |
| `--yes`            | `false`                           | Startet tatsächlich den ausgehenden echten Anruf. |
| `--json`           | `false`                           | Gibt maschinenlesbares JSON aus.                   |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # Probelauf
openclaw voicecall smoke --to "+15555550123" --yes  # Echter Benachrichtigungsanruf
```

<Note>
Für externe Provider (`plivo`, `telnyx`, `twilio`) benötigen `setup` und `smoke` eine öffentliche Webhook-URL aus `publicUrl`, einen Tunnel oder eine Freigabe über Tailscale. Ein Rückgriff auf local loopback oder einen privaten Serve-Endpunkt wird abgelehnt, da Telefonnetzbetreiber ihn nicht erreichen können.
</Note>

## Lebenszyklus eines Anrufs

### `call`

Initiiert einen ausgehenden Sprachanruf.

| Flag                   | Erforderlich | Standardwert     | Beschreibung                                                                           |
| ---------------------- | ------------ | ---------------- | -------------------------------------------------------------------------------------- |
| `-m, --message <text>` | ja           | (keiner)         | Nachricht, die wiedergegeben wird, sobald der Anruf verbunden ist.                     |
| `-t, --to <phone>`     | nein         | Konfig. `toNumber` | Anzurufende Telefonnummer im E.164-Format.                                            |
| `--mode <mode>`        | nein         | `conversation`   | Anrufmodus: `notify` (nach der Nachricht auflegen) oder `conversation` (offen bleiben). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias für `call` mit einer anderen Standardstruktur der Flags.

| Flag               | Erforderlich | Standardwert   | Beschreibung                                                       |
| ------------------ | ------------ | -------------- | ------------------------------------------------------------------ |
| `--to <phone>`     | ja           | (keiner)       | Anzurufende Telefonnummer.                                         |
| `--message <text>` | nein         | (keiner)       | Nachricht, die wiedergegeben wird, sobald der Anruf verbunden ist. |
| `--mode <mode>`    | nein         | `conversation` | Anrufmodus: `notify` oder `conversation`.                           |

### `continue`

Gibt eine Nachricht wieder und wartet auf eine Antwort.

| Flag               | Erforderlich | Beschreibung             |
| ------------------ | ------------ | ------------------------ |
| `--call-id <id>`   | ja           | Anruf-ID.                |
| `--message <text>` | ja           | Wiederzugebende Nachricht. |

### `speak`

Gibt eine Nachricht wieder, ohne auf eine Antwort zu warten.

| Flag               | Erforderlich | Beschreibung             |
| ------------------ | ------------ | ------------------------ |
| `--call-id <id>`   | ja           | Anruf-ID.                |
| `--message <text>` | ja           | Wiederzugebende Nachricht. |

### `dtmf`

Sendet DTMF-Ziffern an einen aktiven Anruf.

| Flag                | Erforderlich | Beschreibung                                                   |
| ------------------- | ------------ | -------------------------------------------------------------- |
| `--call-id <id>`    | ja           | Anruf-ID.                                                      |
| `--digits <digits>` | ja           | DTMF-Ziffern (zum Beispiel `ww123456#` für Wartepausen).        |

### `end`

Beendet einen aktiven Anruf.

| Flag             | Erforderlich | Beschreibung |
| ---------------- | ------------ | ------------ |
| `--call-id <id>` | ja           | Anruf-ID.    |

### `status`

Prüft aktive Anrufe.

| Flag             | Standardwert | Beschreibung                               |
| ---------------- | ------------ | ------------------------------------------ |
| `--call-id <id>` | (keiner)     | Beschränkt die Ausgabe auf einen Anruf.    |
| `--json`         | `false`      | Gibt maschinenlesbares JSON aus.           |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Protokolle und Metriken

### `tail`

Verfolgt das JSONL-Protokoll der Sprachanrufe fortlaufend. Gibt beim Start die letzten mit `--since` angegebenen Zeilen aus und zeigt anschließend neue Zeilen an, sobald sie geschrieben werden.

| Flag            | Standardwert                    | Beschreibung                                       |
| --------------- | ------------------------------- | -------------------------------------------------- |
| `--file <path>` | aus dem Plugin-Speicher ermittelt | Pfad zu `calls.jsonl`.                           |
| `--since <n>`   | `25`                            | Anzahl der vor Beginn der Verfolgung auszugebenden Zeilen. |
| `--poll <ms>`   | `250` (mindestens 50)           | Abfrageintervall in Millisekunden.                 |

### `latency`

Fasst Metriken zur Durchgangslatenz und zur Wartezeit beim Zuhören aus `calls.jsonl` zusammen. Die Ausgabe ist JSON mit Zusammenfassungen für `recordsScanned`, `turnLatency` und `listenWait`.

| Flag            | Standardwert                    | Beschreibung                                      |
| --------------- | ------------------------------- | ------------------------------------------------- |
| `--file <path>` | aus dem Plugin-Speicher ermittelt | Pfad zu `calls.jsonl`.                          |
| `--last <n>`    | `200` (mindestens 1)            | Anzahl der zu analysierenden neuesten Datensätze. |

## Webhooks freigeben

### `expose`

Aktiviert, deaktiviert oder ändert die Tailscale-Serve/Funnel-Konfiguration für den Sprach-Webhook.

| Flag                  | Standardwert                                  | Beschreibung                                        |
| --------------------- | --------------------------------------------- | --------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                      | `off`, `serve` (Tailnet) oder `funnel` (öffentlich). |
| `--path <path>`       | Konfig. `tailscale.path` oder `--serve-path`  | Freizugebender Tailscale-Pfad.                      |
| `--port <port>`       | Konfig. `serve.port` oder `3334`              | Lokaler Webhook-Port.                               |
| `--serve-path <path>` | Konfig. `serve.path` oder `/voice/webhook`    | Lokaler Webhook-Pfad.                               |

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
