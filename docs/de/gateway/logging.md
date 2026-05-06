---
read_when:
    - Protokollausgabe oder -formate ändern
    - Debuggen von CLI- oder Gateway-Ausgaben
summary: Logging-Oberflächen, Datei-Logs, WS-Logstile und Konsolenformatierung
title: Gateway-Protokollierung
x-i18n:
    generated_at: "2026-05-06T06:48:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# Protokollierung

Für eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) siehe [/logging](/de/logging).

OpenClaw hat zwei Log-„Oberflächen“:

- **Konsolenausgabe** (was Sie im Terminal / in der Debug UI sehen).
- **Datei-Logs** (JSON-Zeilen), geschrieben vom Gateway-Logger.

Beim Start protokolliert der Gateway das aufgelöste Standardmodell des Agenten zusammen mit den
Modus-Standardwerten, die neue Sitzungen beeinflussen, zum Beispiel:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` stammt aus dem Standardagenten, den Modellparametern oder dem globalen Agentenstandard;
wenn es nicht gesetzt ist, zeigt die Startzusammenfassung `medium`. `fast` stammt aus dem
Standardagenten oder den Modellparametern `fastMode`.

## Dateibasierter Logger

- Die standardmäßige rotierende Logdatei liegt unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`
  - Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.
- Aktive Logdateien rotieren bei `logging.maxFileBytes` (Standard: 100 MB), behalten
  bis zu fünf nummerierte Archive und schreiben anschließend in eine neue aktive Datei.
- Der Pfad und das Level der Logdatei können über `~/.openclaw/openclaw.json` konfiguriert werden:
  - `logging.file`
  - `logging.level`

Das Dateiformat ist ein JSON-Objekt pro Zeile.

Der Logs-Tab der Control UI verfolgt diese Datei über den Gateway (`logs.tail`).
Die CLI kann dasselbe tun:

```bash
openclaw logs --follow
```

**Ausführlichkeit vs. Log-Level**

- **Datei-Logs** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` beeinflusst nur die **Konsolenausführlichkeit** (und den WS-Logstil); es erhöht **nicht**
  das Log-Level der Datei.
- Um nur im ausführlichen Modus sichtbare Details in Datei-Logs zu erfassen, setzen Sie `logging.level` auf `debug` oder
  `trace`.
- Trace-Protokollierung enthält außerdem diagnostische Timing-Zusammenfassungen für ausgewählte Hot Paths,
  zum Beispiel die Vorbereitung von Plugin-Tool-Factories. Siehe
  [/tools/plugin#slow-plugin-tool-setup](/de/tools/plugin#slow-plugin-tool-setup).

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace` und schreibt sie in Datei-Logs,
während sie weiterhin auf stdout/stderr ausgibt.

Sie können die Konsolenausführlichkeit unabhängig einstellen über:

- `logging.consoleLevel` (Standard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Schwärzung

OpenClaw kann sensible Tokens maskieren, bevor Log- oder Transkriptausgaben den
Prozess verlassen. Diese Log-Schwärzungsrichtlinie wird auf Konsolen-, Datei-Log-, OTLP-
Log-Record- und Sitzungstranskript-Text-Senken angewendet, sodass passende geheime Werte
maskiert werden, bevor JSONL-Zeilen oder Nachrichten auf die Festplatte geschrieben werden.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array von Regex-Strings (überschreibt Standardwerte)
  - Verwenden Sie rohe Regex-Strings (automatisch `gi`) oder `/pattern/flags`, wenn Sie benutzerdefinierte Flags benötigen.
  - Treffer werden maskiert, indem die ersten 6 + letzten 4 Zeichen beibehalten werden (Länge >= 18), andernfalls `***`.
  - Standardwerte decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke, verbreitete Token-Präfixe und Feldnamen für Zahlungsdaten wie Kartennummer, CVC/CVV, gemeinsames Zahlungstoken und Zahlungsnachweis ab.

Einige Sicherheitsgrenzen schwärzen immer, unabhängig von `logging.redactSensitive`.
Dazu gehören Tool-Aufruf-Ereignisse der Control UI, Tool-Ausgaben von `sessions_history`,
Diagnose-Support-Exporte, Provider-Fehlerbeobachtungen, die Anzeige von Exec-Genehmigungsbefehlen
und Gateway-WebSocket-Protokoll-Logs. Diese Oberflächen können weiterhin
`logging.redactPatterns` als zusätzliche Muster verwenden, aber `redactSensitive: "off"`
führt nicht dazu, dass sie rohe Geheimnisse ausgeben.

## Gateway-WebSocket-Logs

Der Gateway gibt WebSocket-Protokoll-Logs in zwei Modi aus:

- **Normalmodus (kein `--verbose`)**: Nur „interessante“ RPC-Ergebnisse werden ausgegeben:
  - Fehler (`ok=false`)
  - langsame Aufrufe (Standardschwelle: `>= 50ms`)
  - Parse-Fehler
- **Ausführlicher Modus (`--verbose`)**: Gibt den gesamten WS-Anfrage-/Antwortverkehr aus.

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

## Konsolenformatierung (Subsystem-Protokollierung)

Der Konsolenformatierer ist **TTY-aware** und gibt konsistente, präfixierte Zeilen aus.
Subsystem-Logger halten die Ausgabe gruppiert und gut erfassbar.

Verhalten:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-Farben** (stabil pro Subsystem) plus Level-Farbgebung
- **Farbe, wenn die Ausgabe ein TTY ist oder die Umgebung wie ein leistungsfähiges Terminal aussieht** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respektiert `NO_COLOR`
- **Verkürzte Subsystem-Präfixe**: entfernt führendes `gateway/` + `channels/`, behält die letzten 2 Segmente (z. B. `whatsapp/outbound`)
- **Sub-Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`)
- **`logRaw()`** für QR-/UX-Ausgabe (kein Präfix, keine Formatierung)
- **Konsolenstile** (z. B. `pretty | compact | json`)
- **Konsolen-Log-Level** getrennt vom Datei-Log-Level (Datei behält vollständige Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist)
- **WhatsApp-Nachrichtentexte** werden auf `debug` protokolliert (verwenden Sie `--verbose`, um sie zu sehen)

Dadurch bleiben bestehende Datei-Logs stabil, während interaktive Ausgaben gut erfassbar werden.

## Verwandte Themen

- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnoseexport](/de/gateway/diagnostics)
