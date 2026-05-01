---
read_when:
    - Protokollausgabe oder -formate ändern
    - Debuggen von CLI- oder Gateway-Ausgaben
summary: Protokollierungsoberflächen, Datei-Logs, WS-Log-Stile und Konsolenformatierung
title: Gateway-Protokollierung
x-i18n:
    generated_at: "2026-05-01T06:42:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# Logging

Eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) finden Sie unter [/logging](/de/logging).

OpenClaw hat zwei Log-„Oberflächen“:

- **Konsolenausgabe** (was Sie im Terminal / in der Debug UI sehen).
- **Datei-Logs** (JSON-Zeilen), die vom Gateway-Logger geschrieben werden.

## Dateibasierter Logger

- Die standardmäßige rotierende Logdatei liegt unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`
  - Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.
- Aktive Logdateien rotieren bei `logging.maxFileBytes` (Standard: 100 MB), behalten
  bis zu fünf nummerierte Archive und schreiben anschließend in eine neue aktive Datei.
- Pfad und Level der Logdatei können über `~/.openclaw/openclaw.json` konfiguriert werden:
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
- `--verbose` wirkt sich nur auf die **Konsolen-Ausführlichkeit** (und den WS-Logstil) aus; es
  erhöht **nicht** den Datei-Log-Level.
- Um nur bei ausführlicher Ausgabe sichtbare Details in Datei-Logs zu erfassen, setzen Sie `logging.level` auf `debug` oder
  `trace`.

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace` und schreibt sie in Datei-Logs,
während sie weiterhin auf stdout/stderr ausgegeben werden.

Sie können die Konsolen-Ausführlichkeit unabhängig anpassen über:

- `logging.consoleLevel` (Standard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Schwärzung

OpenClaw kann sensible Tokens maskieren, bevor Log- oder Transkriptausgaben den
Prozess verlassen. Diese Schwärzungsrichtlinie für Logs wird auf Konsolen-, Datei-Log-, OTLP-
Log-Record- und Sitzungstranskript-Textausgaben angewendet, sodass passende geheime Werte
maskiert werden, bevor JSONL-Zeilen oder Nachrichten auf die Festplatte geschrieben werden.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array von Regex-Strings (überschreibt die Standards)
  - Verwenden Sie rohe Regex-Strings (automatisch `gi`) oder `/pattern/flags`, wenn Sie eigene Flags benötigen.
  - Treffer werden maskiert, indem die ersten 6 + letzten 4 Zeichen beibehalten werden (Länge >= 18), andernfalls `***`.
  - Die Standards decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke, verbreitete Token-Präfixe und Feldnamen für Zahlungsdaten wie Kartennummer, CVC/CVV, gemeinsames Zahlungstoken und Zahlungsnachweis ab.

Einige Sicherheitsgrenzen schwärzen immer, unabhängig von `logging.redactSensitive`.
Dazu gehören Tool-Aufrufereignisse der Control UI, `sessions_history`-Toolausgaben,
Diagnose-Supportexporte, Provider-Fehlerbeobachtungen, Anzeige von Exec-Genehmigungsbefehlen
und Gateway-WebSocket-Protokoll-Logs. Diese Oberflächen können weiterhin
`logging.redactPatterns` als zusätzliche Muster verwenden, aber `redactSensitive: "off"`
bewirkt nicht, dass sie rohe Geheimnisse ausgeben.

## Gateway-WebSocket-Logs

Das Gateway gibt WebSocket-Protokoll-Logs in zwei Modi aus:

- **Normalmodus (kein `--verbose`)**: Nur „interessante“ RPC-Ergebnisse werden ausgegeben:
  - Fehler (`ok=false`)
  - langsame Aufrufe (Standardschwelle: `>= 50ms`)
  - Parse-Fehler
- **Ausführlicher Modus (`--verbose`)**: Gibt sämtlichen WS-Anfrage-/Antwortverkehr aus.

### WS-Logstil

`openclaw gateway` unterstützt einen Stil-Schalter pro Gateway:

- `--ws-log auto` (Standard): Normalmodus ist optimiert; ausführlicher Modus verwendet kompakte Ausgabe
- `--ws-log compact`: kompakte Ausgabe (gepaarte Anfrage/Antwort), wenn ausführlich
- `--ws-log full`: vollständige Ausgabe pro Frame, wenn ausführlich
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

Der Konsolenformatter ist **TTY-aware** und gibt konsistente, präfixierte Zeilen aus.
Subsystem-Logger halten die Ausgabe gruppiert und leicht überfliegbar.

Verhalten:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-Farben** (stabil pro Subsystem) plus Level-Färbung
- **Farbe, wenn die Ausgabe ein TTY ist oder die Umgebung wie ein Rich-Terminal aussieht** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), berücksichtigt `NO_COLOR`
- **Verkürzte Subsystem-Präfixe**: entfernt führendes `gateway/` + `channels/`, behält die letzten 2 Segmente (z. B. `whatsapp/outbound`)
- **Sub-Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`)
- **`logRaw()`** für QR-/UX-Ausgabe (kein Präfix, keine Formatierung)
- **Konsolenstile** (z. B. `pretty | compact | json`)
- **Konsolen-Log-Level** getrennt vom Datei-Log-Level (Datei behält vollständige Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist)
- **WhatsApp-Nachrichtentexte** werden auf `debug` geloggt (verwenden Sie `--verbose`, um sie zu sehen)

Dadurch bleiben bestehende Datei-Logs stabil, während interaktive Ausgaben leichter überfliegbar werden.

## Verwandt

- [Logging](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnoseexport](/de/gateway/diagnostics)
