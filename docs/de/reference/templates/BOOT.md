---
read_when:
    - Hinzufügen einer BOOT.md-Checkliste
summary: Arbeitsbereichsvorlage für BOOT.md
title: BOOT.md-Vorlage
x-i18n:
    generated_at: "2026-07-24T04:09:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Fügen Sie hier kurze, eindeutige Startanweisungen hinzu. Der mitgelieferte `boot-md`-Hook führt diese Datei bei jedem Start des Gateways einmal pro Agent-Arbeitsbereich aus, sofern die Datei vorhanden ist und Inhalt enthält, der nicht ausschließlich aus Leerraum besteht. Mehrere Agents, die sich einen Arbeitsbereich teilen, lösen nur eine Ausführung aus.

Der Hook wird deaktiviert ausgeliefert. Aktivieren Sie ihn zuerst:

```bash
openclaw hooks enable boot-md
```

Wenn ein Checklistenpunkt eine Nachricht sendet, verwenden Sie das Nachrichten-Tool und antworten Sie anschließend mit dem exakten stillen Token `NO_REPLY` (Groß-/Kleinschreibung wird nicht berücksichtigt).

## Verwandte Themen

- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Hooks](/de/automation/hooks#boot-md)
