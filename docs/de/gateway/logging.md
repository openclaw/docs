---
read_when:
    - Logging-Ausgabe oder -Formate ändern
    - CLI- oder Gateway-Ausgabe debuggen
summary: Logging-Oberflächen, Dateilogs, WS-Log-Stile und Konsolenformatierung
title: Gateway-Logging
x-i18n:
    generated_at: "2026-04-26T11:29:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Für einen benutzerorientierten Überblick (CLI + Control UI + Konfiguration) siehe [/logging](/de/logging).

OpenClaw hat zwei Log-„Oberflächen“:

- **Konsolenausgabe** (was Sie im Terminal / Debug UI sehen).
- **Dateilogs** (JSON Lines), die vom Gateway-Logger geschrieben werden.

## Dateibasierter Logger

- Die standardmäßige rotierende Log-Datei liegt unter `/tmp/openclaw/` (eine Datei pro Tag): `openclaw-YYYY-MM-DD.log`
  - Das Datum verwendet die lokale Zeitzone des Gateway-Hosts.
- Aktive Log-Dateien werden bei `logging.maxFileBytes` rotiert (Standard: 100 MB), wobei
  bis zu fünf nummerierte Archive behalten werden und in eine neue aktive Datei weitergeschrieben wird.
- Der Log-Dateipfad und das Log-Level können über `~/.openclaw/openclaw.json` konfiguriert werden:
  - `logging.file`
  - `logging.level`

Das Dateiformat ist ein JSON-Objekt pro Zeile.

Der Logs-Tab der Control UI folgt dieser Datei über das Gateway (`logs.tail`).
Die CLI kann dasselbe tun:

```bash
openclaw logs --follow
```

**Verbose vs. Log-Level**

- **Dateilogs** werden ausschließlich durch `logging.level` gesteuert.
- `--verbose` beeinflusst nur die **Ausführlichkeit der Konsolenausgabe** (und den WS-Log-Stil); es erhöht **nicht**
  das Log-Level der Dateilogs.
- Um nur in Verbose sichtbare Details in Dateilogs zu erfassen, setzen Sie `logging.level` auf `debug` oder
  `trace`.

## Konsolenerfassung

Die CLI erfasst `console.log/info/warn/error/debug/trace` und schreibt sie in Dateilogs,
während sie weiterhin auf stdout/stderr ausgegeben werden.

Sie können die Ausführlichkeit der Konsolenausgabe unabhängig anpassen über:

- `logging.consoleLevel` (Standard `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaktion von Tool-Zusammenfassungen

Ausführliche Tool-Zusammenfassungen (z. B. `🛠️ Exec: ...`) können sensible Tokens maskieren, bevor sie den
Konsolenstream erreichen. Dies gilt **nur für Tools** und verändert Dateilogs nicht.

- `logging.redactSensitive`: `off` | `tools` (Standard: `tools`)
- `logging.redactPatterns`: Array aus Regex-Strings (überschreibt die Standardwerte)
  - Verwenden Sie rohe Regex-Strings (automatisch `gi`) oder `/pattern/flags`, wenn Sie benutzerdefinierte Flags benötigen.
  - Treffer werden maskiert, indem die ersten 6 + letzten 4 Zeichen beibehalten werden (Länge >= 18), sonst `***`.
  - Die Standardwerte decken gängige Schlüsselzuweisungen, CLI-Flags, JSON-Felder, Bearer-Header, PEM-Blöcke und verbreitete Token-Präfixe ab.

## Gateway-WebSocket-Logs

Das Gateway gibt WebSocket-Protokolllogs in zwei Modi aus:

- **Normaler Modus (ohne `--verbose`)**: Es werden nur „interessante“ RPC-Ergebnisse ausgegeben:
  - Fehler (`ok=false`)
  - langsame Aufrufe (Standardschwelle: `>= 50ms`)
  - Parse-Fehler
- **Verbose-Modus (`--verbose`)**: Gibt den gesamten WS-Request-/Response-Verkehr aus.

### WS-Log-Stil

`openclaw gateway` unterstützt einen Stil-Schalter pro Gateway:

- `--ws-log auto` (Standard): normaler Modus ist optimiert; der Verbose-Modus verwendet kompakte Ausgabe
- `--ws-log compact`: kompakte Ausgabe (gepaarter Request/Response) im Verbose-Modus
- `--ws-log full`: vollständige Ausgabe pro Frame im Verbose-Modus
- `--compact`: Alias für `--ws-log compact`

Beispiele:

```bash
# optimiert (nur Fehler/langsame Aufrufe)
openclaw gateway

# gesamten WS-Verkehr anzeigen (gepaart)
openclaw gateway --verbose --ws-log compact

# gesamten WS-Verkehr anzeigen (vollständige Metadaten)
openclaw gateway --verbose --ws-log full
```

## Konsolenformatierung (Subsystem-Logging)

Der Konsolen-Formatter ist **TTY-bewusst** und gibt konsistente Zeilen mit Präfix aus.
Subsystem-Logger halten die Ausgabe gruppiert und gut lesbar.

Verhalten:

- **Subsystem-Präfixe** in jeder Zeile (z. B. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem-Farben** (stabil pro Subsystem) plus Level-Farbgebung
- **Farbe, wenn die Ausgabe ein TTY ist oder die Umgebung wie ein Rich Terminal aussieht** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respektiert `NO_COLOR`
- **Verkürzte Subsystem-Präfixe**: entfernt führendes `gateway/` + `channels/`, behält die letzten 2 Segmente bei (z. B. `whatsapp/outbound`)
- **Sub-Logger pro Subsystem** (automatisches Präfix + strukturiertes Feld `{ subsystem }`)
- **`logRaw()`** für QR-/UX-Ausgabe (kein Präfix, keine Formatierung)
- **Konsolenstile** (z. B. `pretty | compact | json`)
- **Konsolen-Log-Level** getrennt vom Dateilog-Level (Datei behält alle Details, wenn `logging.level` auf `debug`/`trace` gesetzt ist)
- **WhatsApp-Nachrichtentexte** werden auf `debug` geloggt (verwenden Sie `--verbose`, um sie zu sehen)

Dadurch bleiben bestehende Dateilogs stabil, während interaktive Ausgabe gut lesbar wird.

## Verwandt

- [Logging](/de/logging)
- [OpenTelemetry-Export](/de/gateway/opentelemetry)
- [Diagnostics Export](/de/gateway/diagnostics)
