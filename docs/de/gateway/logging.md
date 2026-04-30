---
read_when:
    - Ändern der Logging-Ausgabe oder -formate
    - Fehlersuche bei CLI- oder Gateway-Ausgaben
summary: Logging-Oberflächen, Datei-Logs, WS-Logstile und Konsolenformatierung
title: Gateway-Protokollierung
x-i18n:
    generated_at: "2026-04-30T06:54:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# Logging

Eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) finden Sie unter [/logging](/de/logging).

OpenClaw hat zwei Log-„Oberflächen“:

- **Konsolenausgabe** (was Sie im Terminal / in der Debug UI sehen).
- **Datei-Logs** (JSON-Zeilen), die vom Gateway-Logger geschrieben werden.

## Dateibasierter Logger

- Die standardmäßige rotierende Log-Datei liegt unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`
  - Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.
- Aktive Log-Dateien rotieren bei `logging.maxFileBytes` (Standard: 100 MB), behalten
  bis zu fünf nummerierte Archive und schreiben anschließend in eine neue aktive Datei.
- Pfad und Level der Log-Datei können über `~/.openclaw/openclaw.json` konfiguriert werden:
  - `logging.file`
  - `logging.level`

Das Dateiformat ist ein JSON-Objekt pro Zeile.

Der Logs-Tab der Control UI liest diese Datei fortlaufend über das Gateway (`logs.tail`).
Die CLI kann dasselbe tun:

```bash
openclaw logs --follow
```

**Verbose-Modus vs. Log-Level**

- **Datei-Logs** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` wirkt sich nur auf die **Ausführlichkeit der Konsole** (und den WS-Log-Stil) aus; es erhöht **nicht**
  das Datei-Log-Level.
- Um Details, die nur im Verbose-Modus erscheinen, in Datei-Logs zu erfassen, setzen Sie `logging.level` auf `debug` oder
  `trace`.

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace` und schreibt sie in Datei-Logs,
während sie weiterhin auf stdout/stderr ausgibt.

Sie können die Ausführlichkeit der Konsole unabhängig konfigurieren über:

- `logging.consoleLevel` (Standard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaktion

OpenClaw kann sensible Tokens maskieren, bevor Log- oder Transkriptausgaben den
Prozess verlassen. Diese Richtlinie zur Log-Redaktion wird auf Konsole, Datei-Log, OTLP-
Log-Datensatz und Textsenken für Sitzungs-Transkripte angewendet, sodass passende geheime Werte
maskiert werden, bevor JSONL-Zeilen oder Nachrichten auf die Festplatte geschrieben werden.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array von Regex-Strings (überschreibt Standardwerte)
  - Verwenden Sie rohe Regex-Strings (automatisch `gi`) oder `/pattern/flags`, wenn Sie benutzerdefinierte Flags benötigen.
  - Treffer werden maskiert, indem die ersten 6 + letzten 4 Zeichen beibehalten werden (Länge >= 18), andernfalls `***`.
  - Standardwerte decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke und verbreitete Token-Präfixe ab.

Einige Sicherheitsgrenzen redigieren immer, unabhängig von `logging.redactSensitive`.
Dazu gehören Tool-Call-Ereignisse der Control UI, Tool-Ausgaben von `sessions_history`,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, die Anzeige von Exec-Freigabebefehlen
und Gateway-WebSocket-Protokoll-Logs. Diese Oberflächen können weiterhin
`logging.redactPatterns` als zusätzliche Muster verwenden, aber `redactSensitive: "off"`
führt nicht dazu, dass rohe Geheimnisse ausgegeben werden.

## Gateway-WebSocket-Logs

Das Gateway gibt WebSocket-Protokoll-Logs in zwei Modi aus:

- **Normalmodus (kein `--verbose`)**: Nur „interessante“ RPC-Ergebnisse werden ausgegeben:
  - Fehler (`ok=false`)
  - langsame Aufrufe (Standardschwelle: `>= 50ms`)
  - Parse-Fehler
- **Verbose-Modus (`--verbose`)**: Gibt den gesamten WS-Anfrage-/Antwortverkehr aus.

### WS-Log-Stil

`openclaw gateway` unterstützt einen Stil-Schalter pro Gateway:

- `--ws-log auto` (Standard): Normalmodus ist optimiert; Verbose-Modus verwendet kompakte Ausgabe
- `--ws-log compact`: kompakte Ausgabe (gepaarte Anfrage/Antwort) im Verbose-Modus
- `--ws-log full`: vollständige Ausgabe pro Frame im Verbose-Modus
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

Der Konsolen-Formatter ist **TTY-bewusst** und gibt konsistente, präfixierte Zeilen aus.
Subsystem-Logger halten die Ausgabe gruppiert und leicht erfassbar.

Verhalten:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-Farben** (stabil pro Subsystem) plus Level-Färbung
- **Farbe, wenn die Ausgabe ein TTY ist oder die Umgebung wie ein Rich-Terminal aussieht** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respektiert `NO_COLOR`
- **Verkürzte Subsystem-Präfixe**: entfernt führendes `gateway/` + `channels/`, behält die letzten 2 Segmente (z. B. `whatsapp/outbound`)
- **Sub-Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`)
- **`logRaw()`** für QR-/UX-Ausgabe (kein Präfix, keine Formatierung)
- **Konsolenstile** (z. B. `pretty | compact | json`)
- **Konsolen-Log-Level** getrennt vom Datei-Log-Level (Datei behält vollständige Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist)
- **WhatsApp-Nachrichtentexte** werden auf `debug` geloggt (verwenden Sie `--verbose`, um sie zu sehen)

Dadurch bleiben bestehende Datei-Logs stabil, während interaktive Ausgabe leichter erfassbar wird.

## Verwandte Themen

- [Logging](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnose-Export](/de/gateway/diagnostics)
