---
read_when:
    - Einen Arbeitsbereich manuell initialisieren
summary: Arbeitsbereichsvorlage für HEARTBEAT.md
title: HEARTBEAT.md-Vorlage
x-i18n:
    generated_at: "2026-06-27T18:12:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md-Vorlage

`HEARTBEAT.md` befindet sich im Agent-Arbeitsbereich. Lassen Sie die Datei leer oder nur mit Markdown-Kommentaren und Überschriften, wenn OpenClaw Heartbeat-Modellaufrufe überspringen soll.

Die Standard-Laufzeitvorlage ist:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Fügen Sie unterhalb der Kommentare nur kurze Aufgaben hinzu, wenn der Agent regelmäßig etwas prüfen soll. Halten Sie Heartbeat-Anweisungen klein, da sie bei wiederkehrenden Weckvorgängen gelesen werden.

## Verwandte Themen

- [Heartbeat-Konfiguration](/de/gateway/config-agents)
