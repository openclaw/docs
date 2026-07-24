---
read_when:
    - Manuelles Initialisieren eines Arbeitsbereichs
summary: Workspace-Vorlage für HEARTBEAT.md
title: HEARTBEAT.md-Vorlage
x-i18n:
    generated_at: "2026-07-24T04:55:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d5b02cd62708a87515c4ae59bd2ffab3e4c8ebf81f4126fdd43ced756241b151
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md-Vorlage

`HEARTBEAT.md` befindet sich im Agent-Arbeitsbereich und enthält die regelmäßige Heartbeat-Checkliste. Lassen Sie die Datei leer oder verwenden Sie ausschließlich Leerzeichen, Markdown-Kommentare, ATX-Überschriften, leere Listenstrukturen (`- `, `* [ ]`) oder Codeblock-Markierungen, damit OpenClaw den Heartbeat-Modellaufruf vollständig überspringt (`reason=empty-heartbeat-file`).

Standardmäßig ausgelieferter Inhalt:

```markdown
<!-- Heartbeat template; comments-only content prevents scheduled heartbeat API calls. -->

# Lassen Sie diese Datei leer (oder verwenden Sie ausschließlich Kommentare), um Heartbeat-API-Aufrufe zu überspringen.

# Fügen Sie unten eine kurze Checkliste hinzu, wenn der Heartbeat den gemeinsamen Kontext prüfen soll.
```

Fügen Sie nur dann unter den Kommentarzeilen eine kurze Checkliste hinzu, wenn die Elemente in einem einzigen Heartbeat-Durchlauf gemeinsam geprüft werden sollen. Halten Sie sie kurz: Heartbeat-Durchläufe lesen diese Datei bei jedem Intervall (standardmäßig alle 30 Minuten), sodass überladene Anweisungen bei jeder Aktivierung Tokens verbrauchen.

Erstellen Sie für unabhängig geplante oder ausschließlich bei Fälligkeit auszuführende Prüfungen [Cron-Jobs](/de/automation/cron-jobs). Heartbeat-Notizen unterstützen keine Scheduler-Syntax mehr. Führen Sie `openclaw doctor --fix` aus, um ältere `tasks:`-Blöcke zu konvertieren.

## Verwandte Themen

- [Heartbeat](/de/gateway/heartbeat)
- [Heartbeat-Konfiguration](/de/gateway/config-agents)
