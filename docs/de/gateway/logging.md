---
read_when:
    - Ändern der Protokollausgabe oder -formate
    - Debuggen der CLI- oder Gateway-Ausgabe
summary: Protokollierungsoberflächen, Dateiprotokolle, WS-Protokollstile und Konsolenformatierung
title: Gateway-Protokollierung
x-i18n:
    generated_at: "2026-07-24T03:48:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f0b11a68611032c29c31091b2411982487e7f5df3ecf4f1e3b586e7d21e543d3
    source_path: gateway/logging.md
    workflow: 16
---

# Protokollierung

Eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) finden Sie unter [/logging](/de/logging).

OpenClaw verfügt über zwei Protokollierungsoberflächen:

- **Konsolenausgabe** – was im Terminal bzw. in der Debug-Benutzeroberfläche angezeigt wird.
- **Dateiprotokolle** – vom Gateway-Logger geschriebene JSON-Zeilen.

Beim Start protokolliert das Gateway das aufgelöste Standardmodell des Agenten sowie die Modusstandards, die sich auf neue Sitzungen auswirken:

```text
Agentenmodell: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` stammt vom Standardagenten, aus den Modellparametern oder aus dem globalen Agentenstandard; wenn der Wert nicht festgelegt ist, wird `medium` angezeigt. `fast` stammt vom Standardagenten oder aus den `fastMode`-Parametern des Modells.

## Dateibasierter Logger

- Standardmäßig befinden sich die rotierenden Protokolldateien unter `/tmp/openclaw/` (eine Datei pro Tag), datiert entsprechend der lokalen Zeitzone des Gateway-Hosts. Das Standardprofil verwendet `openclaw-YYYY-MM-DD.log`; benannte Profile verwenden `openclaw-<profile>-YYYY-MM-DD.log` (zum Beispiel `openclaw-dev-YYYY-MM-DD.log`). Wenn dieses Verzeichnis unsicher oder nicht beschreibbar ist (falscher Eigentümer, weltweit beschreibbar oder ein symbolischer Link), weicht OpenClaw stattdessen auf einen benutzerspezifischen Pfad unter `os.tmpdir()/openclaw-<uid>` aus; unter Windows wird immer dieser Fallback im temporären Betriebssystemverzeichnis verwendet.
- Aktive Protokolldateien werden bei `logging.maxFileBytes` rotiert (Standard: 100 MB). Dabei werden bis zu fünf nummerierte Archive (`.1` bis `.5`) aufbewahrt und die Protokollierung in einer neuen aktiven Datei fortgesetzt.
- Konfigurieren Sie Pfad und Stufe der Protokolldatei über `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- Das Dateiformat besteht aus einem JSON-Objekt pro Zeile.

Die Codepfade für Gespräche, Echtzeitsprachkommunikation und verwaltete Räume verwenden den gemeinsamen Dateiprotokollierer für begrenzte Lebenszyklusdatensätze, die zur operativen Fehlersuche und zum OTLP-Protokollexport bestimmt sind. Transkripttext, Audiodaten, Turn-IDs, Anruf-IDs und Provider-Element-IDs werden niemals in den Protokolldatensatz kopiert.

Der Tab „Protokolle“ der Control UI verfolgt diese Datei über das Gateway (`logs.tail`). Die CLI tut dasselbe:

```bash
openclaw logs --follow
```

### Ausführlichkeit und Protokollstufen

- **Dateiprotokolle** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` wirkt sich nur auf die **Ausführlichkeit der Konsole** (und den WS-Protokollstil) aus – die Dateiprotokollstufe wird dadurch **nicht** erhöht.
- Um ausschließlich bei ausführlicher Ausgabe verfügbare Details in Dateiprotokollen zu erfassen, setzen Sie `logging.level` auf `debug` oder `trace`.
- Die Trace-Protokollierung enthält außerdem diagnostische Zeitmessungszusammenfassungen für ausgewählte häufig ausgeführte Pfade, etwa die Vorbereitung der Plugin-Werkzeug-Factory. Siehe [/tools/plugin#slow-plugin-tool-setup](/de/tools/plugin#slow-plugin-tool-setup).

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace`, schreibt sie in Dateiprotokolle und gibt sie weiterhin über stdout/stderr aus.

Passen Sie die Ausführlichkeit der Konsole unabhängig davon an:

- `logging.consoleLevel` (Standard: `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; standardmäßig `pretty` bei einem TTY, andernfalls `compact`)

## Schwärzung

OpenClaw maskiert sensible Token, bevor Protokoll- oder Transkriptausgaben den Prozess verlassen. Diese Schwärzungsrichtlinie gilt für die Konsole, Dateiprotokolle, OTLP-Protokolldatensätze und Sitzungstranskript-Textausgaben, sodass übereinstimmende geheime Werte maskiert werden, bevor JSONL-Zeilen oder Nachrichten auf die Festplatte geschrieben werden.

- Die Schwärzung sensibler Werte ist immer aktiviert.
- `logging.redactPatterns`: Array aus Regex-Zeichenfolgen (überschreibt die Standardwerte)
  - Verwenden Sie rohe Regex-Zeichenfolgen (automatisch `gi`) oder `/pattern/flags` für benutzerdefinierte Flags.
  - Übereinstimmungen werden maskiert, wobei die ersten 6 und die letzten 4 Zeichen erhalten bleiben (Werte mit mindestens 18 Zeichen); kürzere Werte werden zu `***`.
  - Die Standardwerte decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke, verbreitete Token-Präfixe von Anbietern und Feldnamen für Zahlungszugangsdaten ab (Kartennummer, CVC/CVV, gemeinsames Zahlungs-Token, Zahlungszugangsdaten).

Sicherheitsgrenzen wie Werkzeugaufrufereignisse der Control UI, die Ausgabe von `sessions_history`, Diagnoseexporte, Provider-Fehler, die Anzeige von Ausführungsgenehmigungen und Gateway-WebSocket-Protokolle führen immer eine Schwärzung durch. `logging.redactPatterns` fügt bereitstellungsspezifische Muster hinzu.

## Gateway-WebSocket-Protokolle

Das Gateway gibt WebSocket-Protokollprotokolle in zwei Modi aus:

- **Normaler Modus (ohne `--verbose`)**: Nur „interessante“ RPC-Ergebnisse werden ausgegeben – Fehler (`ok=false`), langsame Aufrufe (Standardschwellenwert: `>= 50ms`) und Analysefehler.
- **Ausführlicher Modus (`--verbose`)**: Gibt den gesamten WS-Anfrage-/Antwortverkehr aus.

### WS-Protokollstil

`openclaw gateway` unterstützt eine Stilauswahl pro Gateway:

- `--ws-log auto` (Standard): Der normale Modus ist optimiert; der ausführliche Modus verwendet eine kompakte Ausgabe.
- `--ws-log compact`: kompakte Ausgabe (gekoppelte Anfrage/Antwort) im ausführlichen Modus.
- `--ws-log full`: vollständige Ausgabe pro Frame im ausführlichen Modus.
- `--compact`: Alias für `--ws-log compact`.

```bash
# optimiert (nur Fehler/langsame Aufrufe)
openclaw gateway

# gesamten WS-Verkehr anzeigen (gekoppelt)
openclaw gateway --verbose --ws-log compact

# gesamten WS-Verkehr anzeigen (vollständige Metadaten)
openclaw gateway --verbose --ws-log full
```

## Konsolenformatierung (Subsystem-Protokollierung)

Der Konsolenformatierer ist **TTY-fähig** und gibt konsistente Zeilen mit Präfix aus. Subsystem-Logger halten die Ausgabe gruppiert und übersichtlich:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`).
- **Subsystem-Farben** (stabil pro Subsystem, aus dem Namen gehasht) sowie eine Farbcodierung der Stufen.
- **Farben, wenn die Ausgabe ein TTY ist** oder die Umgebung einem leistungsfähigen Terminal entspricht (`TERM`/`COLORTERM`/`TERM_PROGRAM`); berücksichtigt `NO_COLOR` und `FORCE_COLOR`.
- **Verkürzte Subsystem-Präfixe**: Ein führendes Segment `gateway/`, `channels/` oder `providers/` wird entfernt; anschließend werden höchstens die letzten 2 verbleibenden Segmente beibehalten (z. B. wird `channels/turn/kernel` als `turn/kernel` angezeigt). Bekannte Kanal-Subsysteme (`telegram`, `whatsapp`, `slack` usw.) werden immer auf den reinen Kanalnamen reduziert.
- **Untergeordnete Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`).
- **`logRaw()`** für QR-/UX-Ausgaben (kein Präfix, keine Formatierung).
- **Konsolenstile**: `pretty` | `compact` | `json`.
- **Konsolenprotokollstufe** und Dateiprotokollstufe sind voneinander getrennt (die Datei behält sämtliche Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist).
- **WhatsApp-Nachrichtentexte** werden mit `debug` protokolliert (verwenden Sie `--verbose`, um sie anzuzeigen).

Dadurch bleiben Dateiprotokolle stabil, während interaktive Ausgaben übersichtlich dargestellt werden.

## Verwandte Themen

- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnoseexport](/de/gateway/diagnostics)
