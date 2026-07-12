---
read_when:
    - Ändern der Protokollausgabe oder -formate
    - CLI- oder Gateway-Ausgabe debuggen
summary: Protokollierungsoberflächen, Dateiprotokolle, WS-Protokollstile und Konsolenformatierung
title: Gateway-Protokollierung
x-i18n:
    generated_at: "2026-07-12T01:40:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Protokollierung

Eine benutzerorientierte Übersicht (CLI + Control UI + Konfiguration) finden Sie unter [/logging](/de/logging).

OpenClaw verfügt über zwei Protokollausgaben:

- **Konsolenausgabe** – das, was Sie im Terminal bzw. in der Debug-Benutzeroberfläche sehen.
- **Dateiprotokolle** – JSON-Zeilen, die vom Gateway-Logger geschrieben werden.

Beim Start protokolliert das Gateway das aufgelöste Standardmodell des Agenten sowie die Modusvorgaben, die sich auf neue Sitzungen auswirken:

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` stammt vom Standardagenten, aus den Modellparametern oder aus der globalen Agentenvorgabe; wenn kein Wert festgelegt ist, wird `medium` angezeigt. `fast` stammt vom Standardagenten oder aus den `fastMode`-Parametern des Modells.

## Dateibasierter Logger

- Die standardmäßige rotierende Protokolldatei befindet sich unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`, datiert nach der lokalen Zeitzone des Gateway-Hosts. Wenn dieses Verzeichnis unsicher oder nicht beschreibbar ist (falscher Eigentümer, für alle beschreibbar oder ein symbolischer Link), verwendet OpenClaw stattdessen einen benutzerspezifischen Pfad unter `os.tmpdir()/openclaw-<uid>`; unter Windows wird immer dieser Ausweichpfad im temporären Betriebssystemverzeichnis verwendet.
- Aktive Protokolldateien werden bei `logging.maxFileBytes` rotiert (Standard: 100 MB). Dabei werden bis zu fünf nummerierte Archive (`.1` bis `.5`) aufbewahrt und die Aufzeichnung in einer neuen aktiven Datei fortgesetzt.
- Konfigurieren Sie Pfad und Stufe der Protokolldatei über `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- Das Dateiformat besteht aus einem JSON-Objekt pro Zeile.

Die Codepfade für Gespräche, Echtzeitsprachkommunikation und verwaltete Räume verwenden den gemeinsamen Dateilogger für begrenzte Lebenszyklusdatensätze, die zur betrieblichen Fehlerdiagnose und zum OTLP-Protokollexport bestimmt sind. Transkripttext, Audiodaten, Zug-IDs, Anruf-IDs und Provider-Element-IDs werden niemals in den Protokolldatensatz kopiert.

Der Reiter „Protokolle“ der Control UI verfolgt diese Datei über das Gateway (`logs.tail`). Die CLI verfährt ebenso:

```bash
openclaw logs --follow
```

### Ausführliche Ausgabe und Protokollstufen

- **Dateiprotokolle** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` beeinflusst nur die **Ausführlichkeit der Konsolenausgabe** (und den Stil der WS-Protokolle) – die Stufe der Dateiprotokolle wird dadurch **nicht** erhöht.
- Um Details, die nur bei ausführlicher Ausgabe erscheinen, in Dateiprotokollen zu erfassen, setzen Sie `logging.level` auf `debug` oder `trace`.
- Die Trace-Protokollierung umfasst außerdem diagnostische Zeitzusammenfassungen für ausgewählte häufig durchlaufene Codepfade, etwa die Vorbereitung der Plugin-Werkzeug-Factory. Siehe [/tools/plugin#slow-plugin-tool-setup](/de/tools/plugin#slow-plugin-tool-setup).

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace`, schreibt die Ausgaben in die Dateiprotokolle und gibt sie weiterhin auf stdout/stderr aus.

Passen Sie die Ausführlichkeit der Konsole unabhängig davon an:

- `logging.consoleLevel` (Standard: `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; Standard ist `pretty` auf einem TTY, andernfalls `compact`)

## Schwärzung

OpenClaw maskiert vertrauliche Token, bevor Protokoll- oder Transkriptausgaben den Prozess verlassen. Diese Schwärzungsrichtlinie gilt für Konsolenausgaben, Dateiprotokolle, OTLP-Protokolldatensätze und Sitzungstranskripttexte, sodass übereinstimmende Geheimwerte maskiert werden, bevor JSONL-Zeilen oder Nachrichten auf den Datenträger geschrieben werden.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array aus Zeichenfolgen mit regulären Ausdrücken (überschreibt die Standardwerte)
  - Verwenden Sie reine Zeichenfolgen mit regulären Ausdrücken (automatisch `gi`) oder `/pattern/flags` für benutzerdefinierte Flags.
  - Bei Übereinstimmungen bleiben die ersten 6 und die letzten 4 Zeichen sichtbar (bei Werten mit mindestens 18 Zeichen); kürzere Werte werden zu `***`.
  - Die Standardmuster decken übliche Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke, verbreitete Präfixe für Provider-Token sowie Feldnamen für Zahlungszugangsdaten ab (Kartennummer, CVC/CVV, gemeinsam verwendetes Zahlungs-Token, Zahlungszugangsdaten).

Einige Sicherheitsgrenzen schwärzen unabhängig von `logging.redactSensitive` immer: Werkzeugaufrufereignisse der Control UI, Ausgaben des Werkzeugs `sessions_history`, Exporte für den Diagnosesupport, Beobachtungen von Provider-Fehlern, die Anzeige von Befehlen zur Ausführungsgenehmigung und Gateway-WebSocket-Protokolle. Diese Oberflächen berücksichtigen `logging.redactPatterns` weiterhin als zusätzliche Muster, aber `redactSensitive: "off"` bewirkt nicht, dass sie unmaskierte Geheimnisse ausgeben.

## Gateway-WebSocket-Protokolle

Das Gateway gibt WebSocket-Protokolle in zwei Modi aus:

- **Normalmodus (ohne `--verbose`)**: Nur „interessante“ RPC-Ergebnisse werden ausgegeben – Fehler (`ok=false`), langsame Aufrufe (Standardschwellenwert: `>= 50ms`) und Analysefehler.
- **Ausführlicher Modus (`--verbose`)**: Gibt den gesamten WS-Anfrage-/Antwortverkehr aus.

### Stil der WS-Protokolle

`openclaw gateway` unterstützt eine Gateway-spezifische Stiloption:

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
- **Subsystem-Farben** (stabil pro Subsystem, aus dem Namen gehasht) sowie stufenabhängige Farben.
- **Farben, wenn die Ausgabe ein TTY ist** oder die Umgebung einem leistungsfähigen Terminal entspricht (`TERM`/`COLORTERM`/`TERM_PROGRAM`); `NO_COLOR` und `FORCE_COLOR` werden berücksichtigt.
- **Verkürzte Subsystem-Präfixe**: Ein führendes Segment `gateway/`, `channels/` oder `providers/` wird entfernt; anschließend werden höchstens die letzten zwei verbleibenden Segmente beibehalten (z. B. wird `channels/turn/kernel` als `turn/kernel` angezeigt). Bekannte Kanal-Subsysteme (`telegram`, `whatsapp`, `slack` usw.) werden stets auf den reinen Kanalnamen verkürzt.
- **Untergeordnete Logger nach Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`).
- **`logRaw()`** für QR-/UX-Ausgaben (kein Präfix, keine Formatierung).
- **Konsolenstile**: `pretty` | `compact` | `json`.
- Die **Konsolenprotokollstufe** ist von der Dateiprotokollstufe getrennt (die Datei behält alle Details bei, wenn `logging.level` auf `debug`/`trace` gesetzt ist).
- **WhatsApp-Nachrichtentexte** werden auf der Stufe `debug` protokolliert (verwenden Sie `--verbose`, um sie anzuzeigen).

Dadurch bleiben die Dateiprotokolle stabil, während die interaktive Ausgabe übersichtlich dargestellt wird.

## Verwandte Themen

- [Protokollierung](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnoseexport](/de/gateway/diagnostics)
