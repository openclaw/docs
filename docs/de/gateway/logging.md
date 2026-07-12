---
read_when:
    - Ändern der Protokollausgabe oder -formate
    - CLI- oder Gateway-Ausgabe debuggen
summary: Logging-Oberflächen, Dateiprotokolle, WS-Protokollstile und Konsolenformatierung
title: Gateway-Protokollierung
x-i18n:
    generated_at: "2026-07-12T15:20:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Protokollierung

Eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) finden Sie unter [/logging](/de/logging).

OpenClaw verfügt über zwei Protokollierungsoberflächen:

- **Konsolenausgabe** – was Sie im Terminal / in der Debug-UI sehen.
- **Dateiprotokolle** – vom Gateway-Logger geschriebene JSON-Zeilen.

Beim Start protokolliert das Gateway das aufgelöste Standard-Agentenmodell sowie die Modusstandardwerte, die neue Sitzungen beeinflussen:

```text
Agentenmodell: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` stammt vom Standard-Agenten, aus den Modellparametern oder aus dem globalen Agentenstandard; ist es nicht festgelegt, wird `medium` angezeigt. `fast` stammt vom Standard-Agenten oder aus den `fastMode`-Parametern des Modells.

## Dateibasierter Logger

- Die standardmäßige rotierende Protokolldatei befindet sich unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`, datiert nach der lokalen Zeitzone des Gateway-Hosts. Wenn dieses Verzeichnis unsicher oder nicht beschreibbar ist (falscher Eigentümer, für alle beschreibbar, ein symbolischer Link), weicht OpenClaw stattdessen auf einen benutzerspezifischen Pfad unter `os.tmpdir()/openclaw-<uid>` aus; unter Windows wird immer dieser Rückfallpfad im temporären Betriebssystemverzeichnis verwendet.
- Aktive Protokolldateien werden bei `logging.maxFileBytes` rotiert (Standard: 100 MB), wobei bis zu fünf nummerierte Archive (`.1` bis `.5`) aufbewahrt werden und das Schreiben in einer neuen aktiven Datei fortgesetzt wird.
- Konfigurieren Sie Pfad und Stufe der Protokolldatei über `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- Das Dateiformat besteht aus einem JSON-Objekt pro Zeile.

Codepfade für Gespräche, Echtzeit-Sprachkommunikation und verwaltete Räume verwenden den gemeinsamen Dateilogger für begrenzte Lebenszyklusdatensätze, die für die betriebliche Fehlerdiagnose und den OTLP-Protokollexport vorgesehen sind. Transkripttext, Audionutzdaten, Turn-IDs, Anruf-IDs und Provider-Element-IDs werden niemals in den Protokolldatensatz kopiert.

Der Reiter „Protokolle“ der Control UI verfolgt diese Datei über das Gateway (`logs.tail`). Die CLI macht dasselbe:

```bash
openclaw logs --follow
```

### Ausführlichkeit und Protokollstufen

- **Dateiprotokolle** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` beeinflusst nur die **Ausführlichkeit der Konsole** (und den WS-Protokollstil) – die Protokollstufe der Datei wird dadurch **nicht** erhöht.
- Um ausschließlich bei ausführlicher Ausgabe verfügbare Details in Dateiprotokollen zu erfassen, setzen Sie `logging.level` auf `debug` oder `trace`.
- Die Trace-Protokollierung umfasst außerdem diagnostische Zeitübersichten für ausgewählte häufig ausgeführte Pfade, beispielsweise die Vorbereitung von Plugin-Werkzeugfabriken. Siehe [/tools/plugin#slow-plugin-tool-setup](/de/tools/plugin#slow-plugin-tool-setup).

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace`, schreibt diese Ausgaben in Dateiprotokolle und gibt sie weiterhin über stdout/stderr aus.

Passen Sie die Ausführlichkeit der Konsole unabhängig davon an:

- `logging.consoleLevel` (Standard: `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; auf einem TTY standardmäßig `pretty`, andernfalls `compact`)

## Schwärzung

OpenClaw maskiert vertrauliche Token, bevor Protokoll- oder Transkriptausgaben den Prozess verlassen. Diese Schwärzungsrichtlinie gilt für Konsolen-, Dateiprotoll-, OTLP-Protokolldatensatz- und Sitzungstranskript-Textausgaben, sodass übereinstimmende Geheimniswerte maskiert werden, bevor JSONL-Zeilen oder Nachrichten auf die Festplatte geschrieben werden.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array von Regex-Zeichenfolgen (überschreibt die Standardwerte)
  - Verwenden Sie rohe Regex-Zeichenfolgen (automatisch `gi`) oder `/pattern/flags` für benutzerdefinierte Flags.
  - Übereinstimmungen werden maskiert, wobei die ersten 6 und die letzten 4 Zeichen erhalten bleiben (Werte mit >= 18 Zeichen); kürzere Werte werden zu `***`.
  - Die Standardwerte decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke, verbreitete Präfixe für Anbieter-Token und Feldnamen für Zahlungszugangsdaten ab (Kartennummer, CVC/CVV, gemeinsames Zahlungs-Token, Zahlungszugangsdaten).

Einige Sicherheitsgrenzen schwärzen unabhängig von `logging.redactSensitive` immer: Control-UI-Werkzeugaufrufereignisse, Werkzeugausgaben von `sessions_history`, Exporte für den Diagnosesupport, Beobachtungen von Provider-Fehlern, die Befehlsanzeige bei Ausführungsgenehmigungen und Gateway-WebSocket-Protokolle. Diese Oberflächen berücksichtigen `logging.redactPatterns` weiterhin als zusätzliche Muster, aber `redactSensitive: "off"` führt nicht dazu, dass sie unmaskierte Geheimnisse ausgeben.

## Gateway-WebSocket-Protokolle

Das Gateway gibt WebSocket-Protokolle in zwei Modi aus:

- **Normalmodus (ohne `--verbose`)**: Nur „interessante“ RPC-Ergebnisse werden ausgegeben – Fehler (`ok=false`), langsame Aufrufe (Standardschwellenwert: `>= 50ms`) und Analysefehler.
- **Ausführlicher Modus (`--verbose`)**: Gibt den gesamten WS-Anfrage-/Antwortverkehr aus.

### WS-Protokollstil

`openclaw gateway` unterstützt eine Stiloption pro Gateway:

- `--ws-log auto` (Standard): Der Normalmodus ist optimiert; der ausführliche Modus verwendet eine kompakte Ausgabe.
- `--ws-log compact`: Kompakte Ausgabe (gekoppelte Anfrage/Antwort) im ausführlichen Modus.
- `--ws-log full`: Vollständige Ausgabe pro Frame im ausführlichen Modus.
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

Der Konsolenformatierer ist **TTY-fähig** und gibt einheitliche Zeilen mit Präfixen aus. Subsystem-Logger halten die Ausgabe gruppiert und übersichtlich:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`).
- **Subsystem-Farben** (stabil pro Subsystem, aus dem Namen gehasht) sowie Stufenfarben.
- **Farbe, wenn die Ausgabe ein TTY ist** oder die Umgebung einem leistungsfähigen Terminal entspricht (`TERM`/`COLORTERM`/`TERM_PROGRAM`); berücksichtigt `NO_COLOR` und `FORCE_COLOR`.
- **Verkürzte Subsystem-Präfixe**: Ein führendes Segment `gateway/`, `channels/` oder `providers/` wird entfernt; anschließend werden höchstens die letzten 2 verbleibenden Segmente beibehalten (z. B. wird `channels/turn/kernel` als `turn/kernel` angezeigt). Bekannte Kanal-Subsysteme (`telegram`, `whatsapp`, `slack` usw.) werden immer auf den reinen Kanalnamen reduziert.
- **Untergeordnete Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`).
- **`logRaw()`** für QR-/UX-Ausgaben (kein Präfix, keine Formatierung).
- **Konsolenstile**: `pretty` | `compact` | `json`.
- Die **Konsolenprotokollstufe** ist von der Dateiprotokollstufe getrennt (die Datei behält sämtliche Details bei, wenn `logging.level` auf `debug`/`trace` gesetzt ist).
- **WhatsApp-Nachrichtentexte** werden mit `debug` protokolliert (verwenden Sie `--verbose`, um sie anzuzeigen).

Dadurch bleiben Dateiprotokolle stabil, während interaktive Ausgaben übersichtlich dargestellt werden.

## Verwandte Themen

- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnoseexport](/de/gateway/diagnostics)
