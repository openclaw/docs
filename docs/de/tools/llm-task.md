---
read_when:
    - Sie möchten einen reinen JSON-LLM-Schritt innerhalb von Workflows.
    - Sie benötigen schemavalidierte LLM-Ausgabe für Automatisierung
summary: Nur-JSON-LLM-Aufgaben für Workflows (optionales Plugin-Tool)
title: LLM-Aufgabe
x-i18n:
    generated_at: "2026-06-27T18:19:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` ist ein **optionales Plugin-Tool**, das eine reine JSON-LLM-Aufgabe ausführt und
strukturierte Ausgabe zurückgibt (optional gegen JSON Schema validiert).

Dies ist ideal für Workflow-Engines wie Lobster: Sie können einen einzelnen LLM-Schritt hinzufügen,
ohne für jeden Workflow eigenen OpenClaw-Code zu schreiben.

## Plugin aktivieren

1. Aktivieren Sie das Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Erlauben Sie das optionale Tool:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Verwenden Sie `tools.allow` nur, wenn Sie den restriktiven Allowlist-Modus nutzen möchten.

## Konfiguration (optional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` ist eine Allowlist von `provider/model`-Strings. Wenn sie gesetzt ist, wird jede Anfrage
außerhalb der Liste abgelehnt.

## Tool-Parameter

- `prompt` (String, erforderlich)
- `input` (beliebig, optional)
- `schema` (Objekt, optionales JSON Schema)
- `provider` (String, optional)
- `model` (String, optional)
- `thinking` (String, optional)
- `authProfileId` (String, optional)
- `temperature` (Zahl, optional)
- `maxTokens` (Zahl, optional)
- `timeoutMs` (Zahl, optional)

`thinking` akzeptiert die standardmäßigen OpenClaw-Reasoning-Voreinstellungen, wie `low` oder `medium`.

## Ausgabe

Gibt `details.json` zurück, das das geparste JSON enthält (und gegen
`schema` validiert, wenn angegeben).

## Beispiel: Lobster-Workflow-Schritt

### Wichtige Einschränkung

Das folgende Beispiel setzt voraus, dass die **eigenständige Lobster-CLI** in einer Umgebung läuft, in der `openclaw.invoke` bereits den richtigen Gateway-URL-/Auth-Kontext hat.

Für den gebündelten **eingebetteten** Lobster-Runner innerhalb von OpenClaw ist dieses verschachtelte CLI-Muster **derzeit nicht zuverlässig**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Bis eingebettetes Lobster eine unterstützte Bridge für diesen Ablauf hat, bevorzugen Sie entweder:

- direkte `llm-task`-Tool-Aufrufe außerhalb von Lobster oder
- Lobster-Schritte, die nicht auf verschachtelte `openclaw.invoke`-Aufrufe angewiesen sind.

Beispiel für die eigenständige Lobster-CLI:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Sicherheitshinweise

- Das Tool ist **nur JSON** und weist das Modell an, nur JSON auszugeben (keine
  Code-Fences, kein Kommentar).
- Für diesen Durchlauf werden dem Modell keine Tools bereitgestellt.
- Behandeln Sie die Ausgabe als nicht vertrauenswürdig, sofern Sie sie nicht mit `schema` validieren.
- Platzieren Sie Genehmigungen vor jedem Schritt mit Seiteneffekten (Senden, Posten, Ausführen).

## Verwandte Themen

- [Thinking-Stufen](/de/tools/thinking)
- [Sub-Agents](/de/tools/subagents)
- [Slash-Befehle](/de/tools/slash-commands)
