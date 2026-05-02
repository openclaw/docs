---
read_when:
    - Ändern der Logging-Ausgabe oder -Formate
    - CLI- oder Gateway-Ausgabe debuggen
summary: Logging-Oberflächen, Datei-Logs, WS-Log-Stile und Konsolenformatierung
title: Gateway-Protokollierung
x-i18n:
    generated_at: "2026-05-02T06:33:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb5f5ccd77909e82bd2938a33514ce8361c69910eb945c731d9b2c8266174c13
    source_path: gateway/logging.md
    workflow: 16
---

# Protokollierung

Eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) finden Sie unter [/logging](/de/logging).

OpenClaw hat zwei Log-„Oberflächen“:

- **Konsolenausgabe** (was Sie im Terminal / in der Debug-Oberfläche sehen).
- **Datei-Logs** (JSON-Zeilen), geschrieben vom Gateway-Logger.

## Dateibasierter Logger

- Die standardmäßige rotierende Logdatei liegt unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`
  - Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.
- Aktive Logdateien rotieren bei `logging.maxFileBytes` (Standard: 100 MB), behalten
  bis zu fünf nummerierte Archive und schreiben anschließend in eine neue aktive Datei weiter.
- Der Pfad und das Level der Logdatei können über `~/.openclaw/openclaw.json` konfiguriert werden:
  - `logging.file`
  - `logging.level`

Das Dateiformat ist ein JSON-Objekt pro Zeile.

Der Logs-Tab der Control UI verfolgt diese Datei über das Gateway (`logs.tail`).
Die CLI kann dasselbe tun:

```bash
openclaw logs --follow
```

**Ausführlichkeit vs. Log-Level**

- **Datei-Logs** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` wirkt sich nur auf die **Konsolenausführlichkeit** (und den WS-Logstil) aus; es erhöht **nicht**
  das Datei-Log-Level.
- Um nur bei ausführlicher Ausgabe verfügbare Details in Datei-Logs zu erfassen, setzen Sie `logging.level` auf `debug` oder
  `trace`.
- Trace-Logging enthält außerdem diagnostische Timing-Zusammenfassungen für ausgewählte Hot Paths,
  etwa die Vorbereitung der Plugin-Tool-Factory. Siehe
  [/tools/plugin#slow-plugin-tool-setup](/de/tools/plugin#slow-plugin-tool-setup).

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace` und schreibt sie in Datei-Logs,
während sie weiterhin nach stdout/stderr ausgibt.

Sie können die Konsolenausführlichkeit unabhängig anpassen über:

- `logging.consoleLevel` (Standard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Maskierung

OpenClaw kann sensible Tokens maskieren, bevor Log- oder Transkriptausgabe den
Prozess verlässt. Diese Maskierungsrichtlinie für Logging wird auf Text-Sinks für Konsole, Datei-Logs, OTLP-
Logeinträge und Sitzungsprotokolle angewendet, sodass übereinstimmende geheime Werte
maskiert werden, bevor JSONL-Zeilen oder Nachrichten auf die Festplatte geschrieben werden.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array von Regex-Strings (überschreibt die Standardwerte)
  - Verwenden Sie rohe Regex-Strings (automatisch `gi`) oder `/pattern/flags`, wenn Sie benutzerdefinierte Flags benötigen.
  - Treffer werden maskiert, indem die ersten 6 + letzten 4 Zeichen behalten werden (Länge >= 18), andernfalls `***`.
  - Die Standardwerte decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke, verbreitete Token-Präfixe und Feldnamen für Zahlungsdaten wie Kartennummer, CVC/CVV, geteiltes Zahlungstoken und Zahlungsdaten ab.

Einige Sicherheitsgrenzen maskieren immer, unabhängig von `logging.redactSensitive`.
Dazu gehören Tool-Call-Ereignisse der Control UI, `sessions_history`-Tool-Ausgabe,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, die Anzeige von Exec-Freigabebefehlen
und Gateway-WebSocket-Protokoll-Logs. Diese Oberflächen können weiterhin
`logging.redactPatterns` als zusätzliche Muster verwenden, aber `redactSensitive: "off"`
führt nicht dazu, dass sie rohe Geheimnisse ausgeben.

## Gateway-WebSocket-Logs

Das Gateway gibt WebSocket-Protokoll-Logs in zwei Modi aus:

- **Normalmodus (kein `--verbose`)**: Nur „interessante“ RPC-Ergebnisse werden ausgegeben:
  - Fehler (`ok=false`)
  - langsame Aufrufe (Standardschwellenwert: `>= 50ms`)
  - Parse-Fehler
- **Ausführlicher Modus (`--verbose`)**: Gibt den gesamten WS-Anfrage-/Antwortverkehr aus.

### WS-Logstil

`openclaw gateway` unterstützt eine Stilumschaltung pro Gateway:

- `--ws-log auto` (Standard): Normalmodus ist optimiert; ausführlicher Modus verwendet kompakte Ausgabe
- `--ws-log compact`: kompakte Ausgabe (gepaarte Anfrage/Antwort) bei ausführlicher Ausgabe
- `--ws-log full`: vollständige Ausgabe pro Frame bei ausführlicher Ausgabe
- `--compact`: Alias für `--ws-log compact`

Beispiele:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Konsolenformatierung (Subsystem-Logging)

Der Konsolenformatter ist **TTY-bewusst** und gibt konsistente, präfixierte Zeilen aus.
Subsystem-Logger halten die Ausgabe gruppiert und gut scanbar.

Verhalten:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-Farben** (stabil pro Subsystem) plus Level-Färbung
- **Farbe, wenn die Ausgabe ein TTY ist oder die Umgebung wie ein Rich-Terminal wirkt** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), berücksichtigt `NO_COLOR`
- **Verkürzte Subsystem-Präfixe**: entfernt führendes `gateway/` + `channels/`, behält die letzten 2 Segmente (z. B. `whatsapp/outbound`)
- **Sub-Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`)
- **`logRaw()`** für QR-/UX-Ausgabe (kein Präfix, keine Formatierung)
- **Konsolenstile** (z. B. `pretty | compact | json`)
- **Konsolen-Log-Level** getrennt vom Datei-Log-Level (Datei behält vollständige Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist)
- **WhatsApp-Nachrichtentexte** werden mit `debug` protokolliert (verwenden Sie `--verbose`, um sie zu sehen)

Dadurch bleiben bestehende Datei-Logs stabil, während interaktive Ausgaben gut scanbar werden.

## Verwandte Themen

- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnoseexport](/de/gateway/diagnostics)
