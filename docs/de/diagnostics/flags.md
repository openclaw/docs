---
read_when:
    - Sie benötigen gezielte Debug-Logs, ohne die globalen Logging-Level anzuheben
    - Sie müssen subsystem-spezifische Logs für den Support erfassen
summary: Diagnose-Flags für gezielte Debug-Logs
title: Diagnose-Flags
x-i18n:
    generated_at: "2026-04-30T06:51:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

Diagnose-Flags ermöglichen gezielte Debug-Logs, ohne ausführliches Logging überall zu aktivieren. Flags sind Opt-in und haben keine Wirkung, solange ein Subsystem sie nicht prüft.

## Funktionsweise

- Flags sind Zeichenfolgen (Groß-/Kleinschreibung wird ignoriert).
- Sie können Flags in der Konfiguration oder über einen Env-Override aktivieren.
- Platzhalter werden unterstützt:
  - `telegram.*` entspricht `telegram.http`
  - `*` aktiviert alle Flags

## Über Konfiguration aktivieren

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Mehrere Flags:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Starten Sie das Gateway neu, nachdem Sie Flags geändert haben.

## Env-Override (einmalig)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Alle Flags deaktivieren:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Timeline-Artefakte

Das `timeline`-Flag schreibt strukturierte Timing-Ereignisse für Start und Laufzeit für
externe QA-Harnesses:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Sie können es auch in der Konfiguration aktivieren:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Der Dateipfad für die Timeline stammt weiterhin aus
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Wenn `timeline` nur über die
Konfiguration aktiviert ist, werden die frühesten Spans zum Laden der Konfiguration nicht ausgegeben, weil OpenClaw die
Konfiguration noch nicht gelesen hat; nachfolgende Start-Spans verwenden das Konfigurations-Flag.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` und
`OPENCLAW_DIAGNOSTICS=*` aktivieren ebenfalls die Timeline, weil sie jedes
Diagnose-Flag aktivieren. Verwenden Sie bevorzugt `timeline`, wenn Sie nur das JSONL-Timing-Artefakt benötigen.

Timeline-Datensätze verwenden den `openclaw.diagnostics.v1`-Umschlag. Ereignisse können
Prozess-IDs, Phasennamen, Span-Namen, Dauern, Plugin-IDs, Abhängigkeitszähler,
Event-Loop-Verzögerungsstichproben, Provider-Operationsnamen, Exit-Status von Unterprozessen
und Namen/Meldungen von Startfehlern enthalten. Behandeln Sie Timeline-Dateien als lokale Diagnoseartefakte;
prüfen Sie sie, bevor Sie sie außerhalb Ihres Rechners teilen.

## Speicherort der Logs

Flags schreiben Logs in die standardmäßige Diagnose-Logdatei. Standardmäßig:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Wenn Sie `logging.file` setzen, verwenden Sie stattdessen diesen Pfad. Logs sind JSONL (ein JSON-Objekt pro Zeile). Schwärzung wird weiterhin gemäß `logging.redactSensitive` angewendet.

## Logs extrahieren

Wählen Sie die neueste Logdatei aus:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Nach Telegram-HTTP-Diagnose filtern:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Oder beim Reproduzieren mitlesen:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Für Remote-Gateways können Sie auch `openclaw logs --follow` verwenden (siehe [/cli/logs](/de/cli/logs)).

## Hinweise

- Wenn `logging.level` höher als `warn` gesetzt ist, können diese Logs unterdrückt werden. Der Standardwert `info` ist geeignet.
- Flags können aktiviert bleiben; sie beeinflussen nur das Logvolumen für das jeweilige Subsystem.
- Verwenden Sie [/logging](/de/logging), um Logziele, Level und Schwärzung zu ändern.

## Verwandte Themen

- [Gateway-Diagnose](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
