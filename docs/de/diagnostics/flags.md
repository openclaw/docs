---
read_when:
    - Sie benötigen gezielte Debug-Logs, ohne die globalen Logging-Stufen zu erhöhen
    - Sie müssen subsystem-spezifische Logs für den Support erfassen
summary: Diagnose-Flags für gezielte Debug-Protokolle
title: Diagnose-Flags
x-i18n:
    generated_at: "2026-06-27T17:27:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

Diagnose-Flags ermöglichen es Ihnen, gezielte Debug-Logs zu aktivieren, ohne überall ausführliches Logging einzuschalten. Flags sind opt-in und haben keine Wirkung, sofern ein Subsystem sie nicht prüft.

## Funktionsweise

- Flags sind Zeichenfolgen (Groß-/Kleinschreibung wird ignoriert).
- Sie können Flags in der Konfiguration oder über eine Env-Überschreibung aktivieren.
- Wildcards werden unterstützt:
  - `telegram.*` entspricht `telegram.http`
  - `*` aktiviert alle Flags

## Per Konfiguration aktivieren

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
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

Starten Sie den Gateway neu, nachdem Sie Flags geändert haben.

## Env-Überschreibung (einmalig)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Alle Flags deaktivieren:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` ist eine Deaktivierungsüberschreibung auf Prozessebene: Sie deaktiviert
Flags aus Env und Konfiguration für diesen Prozess.

## Profiling-Flags

Profiler-Flags aktivieren gezielte Timing-Spans, ohne globale Logging-Level
zu erhöhen. Sie sind standardmäßig deaktiviert.

Alle durch den Profiler geschützten Spans für einen Gateway-Lauf aktivieren:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Nur Profiler-Spans für den Antwort-Dispatch aktivieren:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Nur Profiler-Spans für Start, Tool und Thread des Codex-App-Servers aktivieren:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Profiler-Flags aus der Konfiguration aktivieren:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Starten Sie den Gateway neu, nachdem Sie Konfigurations-Flags geändert haben. Um ein Profiler-Flag zu deaktivieren,
entfernen Sie es aus `diagnostics.flags` und starten Sie neu. Um vorübergehend jedes
Diagnose-Flag zu deaktivieren, auch wenn die Konfiguration Profiler-Flags aktiviert, starten Sie den Prozess mit:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Timeline-Artefakte

Das Flag `timeline` schreibt strukturierte Timing-Ereignisse für Start und Laufzeit für
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

Der Dateipfad der Timeline stammt weiterhin aus
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Wenn `timeline` nur über die
Konfiguration aktiviert ist, werden die frühesten Spans zum Laden der Konfiguration nicht ausgegeben, weil OpenClaw die
Konfiguration noch nicht gelesen hat; nachfolgende Start-Spans verwenden das Konfigurations-Flag.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` und
`OPENCLAW_DIAGNOSTICS=*` aktivieren ebenfalls die Timeline, weil sie jedes
Diagnose-Flag aktivieren. Verwenden Sie vorzugsweise `timeline`, wenn Sie nur das JSONL-Timing-
Artefakt möchten.

Timeline-Datensätze verwenden den Umschlag `openclaw.diagnostics.v1`. Ereignisse können
Prozess-IDs, Phasennamen, Span-Namen, Dauern, Plugin-IDs, Abhängigkeitsanzahlen,
Event-Loop-Verzögerungsstichproben, Namen von Provider-Operationen, Exit-Status von Kindprozessen
und Namen/Meldungen von Startfehlern enthalten. Behandeln Sie Timeline-Dateien als lokale Diagnose-
Artefakte; prüfen Sie sie, bevor Sie sie außerhalb Ihres Rechners teilen.

## Speicherort der Logs

Flags geben Logs in die standardmäßige Diagnose-Logdatei aus. Standardmäßig:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Wenn Sie `logging.file` setzen, verwenden Sie stattdessen diesen Pfad. Logs sind JSONL (ein JSON-Objekt pro Zeile). Redaction gilt weiterhin basierend auf `logging.redactSensitive`.

## Logs extrahieren

Wählen Sie die neueste Logdatei aus:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Nach Telegram-HTTP-Diagnosen filtern:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Nach Brave Search-HTTP-Diagnosen filtern:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Oder während der Reproduktion mitverfolgen:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Für Remote-Gateways können Sie auch `openclaw logs --follow` verwenden (siehe [/cli/logs](/de/cli/logs)).

## Hinweise

- Wenn `logging.level` höher als `warn` gesetzt ist, können diese Logs unterdrückt werden. Der Standardwert `info` ist geeignet.
- `brave.http` loggt Anfrage-URLs/Query-Parameter von Brave Search, Antwortstatus/-Timing sowie Cache-Hit/Miss/Write-Ereignisse. API-Schlüssel oder Antwortinhalte werden nicht geloggt, Suchanfragen können jedoch sensibel sein.
- Flags können gefahrlos aktiviert bleiben; sie wirken sich nur auf das Logvolumen des jeweiligen Subsystems aus.
- Verwenden Sie [/logging](/de/logging), um Log-Ziele, Level und Redaction zu ändern.

## Verwandte Themen

- [Gateway-Diagnose](/de/gateway/diagnostics)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
