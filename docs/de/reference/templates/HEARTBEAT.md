---
read_when:
    - Manuelles Einrichten eines Arbeitsbereichs
summary: Workspace-Vorlage für HEARTBEAT.md
title: HEARTBEAT.md-Vorlage
x-i18n:
    generated_at: "2026-07-12T02:09:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md-Vorlage

`HEARTBEAT.md` befindet sich im Agenten-Arbeitsbereich und enthält die Checkliste für den regelmäßigen Heartbeat. Lassen Sie die Datei leer oder verwenden Sie ausschließlich Leerraum, Markdown-Kommentare, ATX-Überschriften, leere Listenansätze (`- `, `* [ ]`) oder Codeblock-Markierungen, damit OpenClaw den Heartbeat-Modellaufruf vollständig überspringt (`reason=empty-heartbeat-file`).

Mitgelieferter Standardinhalt:

```markdown
<!-- Heartbeat-Vorlage; ein Inhalt, der ausschließlich aus Kommentaren besteht, verhindert geplante Heartbeat-API-Aufrufe. -->

# Lassen Sie diese Datei leer (oder verwenden Sie nur Kommentare), um Heartbeat-API-Aufrufe zu überspringen.

# Fügen Sie unten Aufgaben hinzu, wenn der Agent regelmäßig etwas überprüfen soll.
```

Fügen Sie unterhalb der Kommentarzeilen nur dann kurze Aufgaben hinzu, wenn Sie regelmäßige Prüfungen wünschen. Halten Sie die Datei kurz: Heartbeat-Ausführungen lesen diese Datei bei jedem Intervall (standardmäßig alle 30 Minuten), sodass aufgeblähte Anweisungen bei jeder Aktivierung Tokens verbrauchen.

Verwenden Sie für ausschließlich fällige Prüfungen anstelle einer einfachen Checkliste einen strukturierten `tasks:`-Block mit den Feldern `interval` und `prompt` für jede Aufgabe. Format und Verhalten finden Sie unter [HEARTBEAT.md](/de/gateway/heartbeat#heartbeatmd-optional).

## Verwandte Themen

- [Heartbeat](/de/gateway/heartbeat)
- [Heartbeat-Konfiguration](/de/gateway/config-agents)
