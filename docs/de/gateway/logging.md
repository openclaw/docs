---
read_when:
    - Ändern von Logging-Ausgabe oder -Formaten
    - CLI- oder Gateway-Ausgabe debuggen
summary: Protokollierungsoberflächen, Dateiprotokolle, WS-Protokollstile und Konsolenformatierung
title: Gateway-Protokollierung
x-i18n:
    generated_at: "2026-06-27T17:31:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# Protokollierung

Eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) finden Sie unter [/logging](/de/logging).

OpenClaw hat zwei Log-„Oberflächen“:

- **Konsolenausgabe** (was Sie im Terminal / in der Debug-UI sehen).
- **Datei-Logs** (JSON-Zeilen), die vom Gateway-Logger geschrieben werden.

Beim Start protokolliert der Gateway das aufgelöste Standard-Agentenmodell zusammen mit den
Modus-Standardeinstellungen, die neue Sitzungen beeinflussen, zum Beispiel:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` stammt vom Standard-Agenten, aus Modellparametern oder aus dem globalen Agentenstandard;
wenn es nicht gesetzt ist, zeigt die Startzusammenfassung `medium`. `fast` stammt vom
Standard-Agenten oder aus den Modellparametern `fastMode`.

## Dateibasierter Logger

- Die standardmäßige rotierende Logdatei liegt unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`
  - Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.
- Aktive Logdateien rotieren bei `logging.maxFileBytes` (Standard: 100 MB), wobei
  bis zu fünf nummerierte Archive behalten werden und in eine neue aktive Datei weitergeschrieben wird.
- Pfad und Level der Logdatei können über `~/.openclaw/openclaw.json` konfiguriert werden:
  - `logging.file`
  - `logging.level`

Das Dateiformat ist ein JSON-Objekt pro Zeile.

Codepfade für Talk, Echtzeit-Sprache und verwaltete Räume verwenden den gemeinsamen Datei-Logger für
begrenzte Lebenszyklusdatensätze. Diese Datensätze sind für operatives Debugging
und den OTLP-Logexport gedacht; Transkripttext, Audio-Payloads, Turn-IDs, Call-IDs und
Provider-Item-IDs werden nicht in den Logdatensatz kopiert.

Der Tab „Logs“ der Control UI verfolgt diese Datei über den Gateway (`logs.tail`).
Die CLI kann dasselbe tun:

```bash
openclaw logs --follow
```

**Ausführlichkeit vs. Log-Level**

- **Datei-Logs** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` beeinflusst nur die **Ausführlichkeit der Konsole** (und den WS-Logstil); es erhöht **nicht**
  den Datei-Log-Level.
- Um Details, die nur bei verbose sichtbar sind, in Datei-Logs zu erfassen, setzen Sie `logging.level` auf `debug` oder
  `trace`.
- Trace-Logging enthält außerdem diagnostische Timing-Zusammenfassungen für ausgewählte Hot Paths,
  zum Beispiel die Vorbereitung der Plugin-Tool-Factory. Siehe
  [/tools/plugin#slow-plugin-tool-setup](/de/tools/plugin#slow-plugin-tool-setup).

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace` und schreibt sie in Datei-Logs,
während sie weiterhin auf stdout/stderr ausgibt.

Sie können die Ausführlichkeit der Konsole unabhängig einstellen über:

- `logging.consoleLevel` (Standard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Schwärzung

OpenClaw kann vertrauliche Tokens maskieren, bevor Log- oder Transkriptausgaben den
Prozess verlassen. Diese Log-Schwärzungsrichtlinie wird auf Konsole, Datei-Log, OTLP-
Logdatensatz und Textsenken für Sitzungstranskripte angewendet, sodass passende geheime Werte
maskiert werden, bevor JSONL-Zeilen oder Nachrichten auf die Festplatte geschrieben werden.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array von Regex-Strings (überschreibt Standards)
  - Verwenden Sie rohe Regex-Strings (automatisch `gi`) oder `/pattern/flags`, wenn Sie benutzerdefinierte Flags benötigen.
  - Treffer werden maskiert, indem die ersten 6 + letzten 4 Zeichen beibehalten werden (Länge >= 18), andernfalls `***`.
  - Die Standards decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke, verbreitete Token-Präfixe und Feldnamen für Zahlungsdaten wie Kartennummer, CVC/CVV, gemeinsames Zahlungstoken und Zahlungsdaten ab.

Einige Sicherheitsgrenzen schwärzen immer, unabhängig von `logging.redactSensitive`.
Dazu gehören Tool-Call-Ereignisse der Control UI, Tool-Ausgaben von `sessions_history`,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, die Anzeige von Exec-Genehmigungsbefehlen
und Gateway-WebSocket-Protokolllogs. Diese Oberflächen können weiterhin
`logging.redactPatterns` als zusätzliche Muster verwenden, aber `redactSensitive: "off"`
führt nicht dazu, dass sie rohe Secrets ausgeben.

## Gateway-WebSocket-Logs

Der Gateway gibt WebSocket-Protokolllogs in zwei Modi aus:

- **Normaler Modus (kein `--verbose`)**: Nur „interessante“ RPC-Ergebnisse werden ausgegeben:
  - Fehler (`ok=false`)
  - langsame Aufrufe (Standardschwelle: `>= 50ms`)
  - Parse-Fehler
- **Verbose-Modus (`--verbose`)**: Gibt den gesamten WS-Anfrage-/Antwortverkehr aus.

### WS-Logstil

`openclaw gateway` unterstützt einen Stil-Umschalter pro Gateway:

- `--ws-log auto` (Standard): Normaler Modus ist optimiert; Verbose-Modus verwendet kompakte Ausgabe
- `--ws-log compact`: kompakte Ausgabe (gepaarte Anfrage/Antwort) bei verbose
- `--ws-log full`: vollständige Ausgabe pro Frame bei verbose
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

Der Konsolenformatierer ist **TTY-aware** und gibt konsistente, präfixierte Zeilen aus.
Subsystem-Logger halten die Ausgabe gruppiert und gut scanbar.

Verhalten:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-Farben** (stabil pro Subsystem) plus Level-Färbung
- **Farbe, wenn die Ausgabe ein TTY ist oder die Umgebung wie ein Rich-Terminal aussieht** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respektiert `NO_COLOR`
- **Verkürzte Subsystem-Präfixe**: entfernt führendes `gateway/` + `channels/`, behält die letzten 2 Segmente (z. B. `whatsapp/outbound`)
- **Sub-Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`)
- **`logRaw()`** für QR-/UX-Ausgabe (kein Präfix, keine Formatierung)
- **Konsolenstile** (z. B. `pretty | compact | json`)
- **Konsolen-Log-Level** getrennt vom Datei-Log-Level (Datei behält vollständige Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist)
- **WhatsApp-Nachrichtentexte** werden auf `debug` protokolliert (verwenden Sie `--verbose`, um sie zu sehen)

So bleiben bestehende Datei-Logs stabil, während interaktive Ausgabe gut scanbar wird.

## Verwandt

- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnoseexport](/de/gateway/diagnostics)
