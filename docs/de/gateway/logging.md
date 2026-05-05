---
read_when:
    - Ändern der Logging-Ausgabe oder -Formate
    - CLI- oder Gateway-Ausgabe debuggen
summary: Logging-Oberflächen, Datei-Logs, WS-Log-Stile und Konsolenformatierung
title: Gateway-Protokollierung
x-i18n:
    generated_at: "2026-05-05T01:46:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# Protokollierung

Eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) finden Sie unter [/logging](/de/logging).

OpenClaw hat zwei Protokollierungs-„Oberflächen“:

- **Konsolenausgabe** (was Sie im Terminal / in der Debug-UI sehen).
- **Dateiprotokolle** (JSON-Zeilen), die vom Gateway-Logger geschrieben werden.

Beim Start protokolliert das Gateway das aufgelöste standardmäßige Agentenmodell zusammen mit den
Modus-Standardwerten, die neue Sitzungen betreffen, zum Beispiel:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` stammt vom Standard-Agenten, von Modellparametern oder vom globalen Agentenstandard;
wenn es nicht gesetzt ist, zeigt die Startzusammenfassung `medium`. `fast` stammt vom
Standard-Agenten oder aus den `fastMode`-Parametern des Modells.

## Dateibasierter Logger

- Die standardmäßige rotierende Protokolldatei liegt unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`
  - Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.
- Aktive Protokolldateien rotieren bei `logging.maxFileBytes` (Standard: 100 MB), behalten
  bis zu fünf nummerierte Archive und schreiben anschließend in eine neue aktive Datei.
- Pfad und Level der Protokolldatei können über `~/.openclaw/openclaw.json` konfiguriert werden:
  - `logging.file`
  - `logging.level`

Das Dateiformat ist ein JSON-Objekt pro Zeile.

Der Logs-Tab der Control UI verfolgt diese Datei über das Gateway (`logs.tail`).
Die CLI kann dasselbe tun:

```bash
openclaw logs --follow
```

**Ausführlichkeit vs. Log-Level**

- **Dateiprotokolle** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` wirkt sich nur auf die **Konsolenausführlichkeit** (und den WS-Protokollstil) aus; es erhöht **nicht**
  das Log-Level der Datei.
- Um nur bei ausführlicher Ausgabe sichtbare Details in Dateiprotokollen zu erfassen, setzen Sie `logging.level` auf `debug` oder
  `trace`.
- Trace-Protokollierung enthält außerdem diagnostische Timing-Zusammenfassungen für ausgewählte Hot Paths,
  wie etwa die Vorbereitung von Plugin-Tool-Factories. Siehe
  [/tools/plugin#slow-plugin-tool-setup](/de/tools/plugin#slow-plugin-tool-setup).

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace` und schreibt sie in Dateiprotokolle,
während sie weiterhin auf stdout/stderr ausgibt.

Sie können die Konsolenausführlichkeit unabhängig einstellen über:

- `logging.consoleLevel` (Standard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Schwärzung

OpenClaw kann sensible Tokens maskieren, bevor Protokoll- oder Transkriptausgaben den
Prozess verlassen. Diese Richtlinie zur Protokollschwärzung wird auf Text-Senken für Konsole, Dateiprotokoll, OTLP-
Log-Record und Sitzungstranskript angewendet, sodass übereinstimmende geheime Werte
maskiert werden, bevor JSONL-Zeilen oder Nachrichten auf die Festplatte geschrieben werden.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array von Regex-Strings (überschreibt Standardwerte)
  - Verwenden Sie rohe Regex-Strings (automatisch `gi`) oder `/pattern/flags`, wenn Sie benutzerdefinierte Flags benötigen.
  - Treffer werden maskiert, indem die ersten 6 + letzten 4 Zeichen beibehalten werden (Länge >= 18), andernfalls `***`.
  - Standardwerte decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke, verbreitete Token-Präfixe und Feldnamen für Zahlungszugangsdaten wie Kartennummer, CVC/CVV, gemeinsames Zahlungstoken und Zahlungszugangsdaten ab.

Einige Sicherheitsgrenzen schwärzen immer, unabhängig von `logging.redactSensitive`.
Dazu gehören Tool-Call-Ereignisse der Control UI, Tool-Ausgaben von `sessions_history`,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, die Anzeige von Exec-Freigabebefehlen
und Gateway-WebSocket-Protokolle. Diese Oberflächen können weiterhin
`logging.redactPatterns` als zusätzliche Muster verwenden, aber `redactSensitive: "off"`
führt nicht dazu, dass sie rohe geheime Werte ausgeben.

## Gateway-WebSocket-Protokolle

Das Gateway gibt WebSocket-Protokolle in zwei Modi aus:

- **Normaler Modus (kein `--verbose`)**: Nur „interessante“ RPC-Ergebnisse werden ausgegeben:
  - Fehler (`ok=false`)
  - langsame Aufrufe (Standardschwelle: `>= 50ms`)
  - Parse-Fehler
- **Ausführlicher Modus (`--verbose`)**: Gibt den gesamten WS-Anfrage-/Antwortverkehr aus.

### WS-Protokollstil

`openclaw gateway` unterstützt einen Stil-Umschalter pro Gateway:

- `--ws-log auto` (Standard): normaler Modus ist optimiert; ausführlicher Modus verwendet kompakte Ausgabe
- `--ws-log compact`: kompakte Ausgabe (gekoppelte Anfrage/Antwort) bei ausführlicher Ausgabe
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

## Konsolenformatierung (Subsystem-Protokollierung)

Der Konsolenformatter ist **TTY-bewusst** und gibt konsistente, präfixierte Zeilen aus.
Subsystem-Logger halten Ausgaben gruppiert und gut erfassbar.

Verhalten:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-Farben** (stabil pro Subsystem) plus Level-Farbgebung
- **Farbe, wenn die Ausgabe ein TTY ist oder die Umgebung wie ein Rich-Terminal wirkt** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), berücksichtigt `NO_COLOR`
- **Verkürzte Subsystem-Präfixe**: entfernt führende `gateway/` + `channels/`, behält die letzten 2 Segmente (z. B. `whatsapp/outbound`)
- **Sub-Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`)
- **`logRaw()`** für QR-/UX-Ausgabe (kein Präfix, keine Formatierung)
- **Konsolenstile** (z. B. `pretty | compact | json`)
- **Konsolen-Log-Level** getrennt vom Datei-Log-Level (Datei behält vollständige Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist)
- **WhatsApp-Nachrichtentexte** werden auf `debug` protokolliert (verwenden Sie `--verbose`, um sie zu sehen)

Dadurch bleiben bestehende Dateiprotokolle stabil, während interaktive Ausgaben gut erfassbar werden.

## Verwandte Themen

- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnoseexport](/de/gateway/diagnostics)
