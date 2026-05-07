---
read_when:
    - Sie möchten einen LLM-Schritt in Arbeitsabläufen, der ausschließlich JSON ausgibt
    - Sie benötigen schema-validierte LLM-Ausgaben für die Automatisierung
summary: JSON-only-LLM-Aufgaben für Workflows (optionales Plugin-Tool)
title: LLM-Aufgabe
x-i18n:
    generated_at: "2026-05-07T13:26:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
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

Verwenden Sie `tools.allow` nur, wenn Sie den restriktiven Allowlist-Modus möchten.

## Konfiguration (optional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` ist eine Allowlist von `provider/model`-Strings. Wenn sie festgelegt ist, wird jede Anfrage
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

`thinking` akzeptiert die standardmäßigen OpenClaw-Reasoning-Voreinstellungen, etwa `low` oder `medium`.

## Ausgabe

Gibt `details.json` zurück, das das geparste JSON enthält (und gegen
`schema` validiert, wenn angegeben).

## Beispiel: Lobster-Workflow-Schritt

### Wichtige Einschränkung

Das folgende Beispiel setzt voraus, dass die **eigenständige Lobster CLI** in einer Umgebung ausgeführt wird, in der `openclaw.invoke` bereits den korrekten Gateway-URL-/Auth-Kontext hat.

Für den gebündelten **eingebetteten** Lobster-Runner innerhalb von OpenClaw ist dieses verschachtelte CLI-Muster **derzeit nicht zuverlässig**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Bis eingebettetes Lobster eine unterstützte Bridge für diesen Ablauf hat, bevorzugen Sie entweder:

- direkte `llm-task`-Tool-Aufrufe außerhalb von Lobster oder
- Lobster-Schritte, die nicht auf verschachtelte `openclaw.invoke`-Aufrufe angewiesen sind.

Beispiel für eigenständige Lobster CLI:

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

- Das Tool ist **ausschließlich JSON** und weist das Modell an, nur JSON auszugeben (keine
  Code-Fences, keine Kommentare).
- Dem Modell werden für diesen Lauf keine Tools bereitgestellt.
- Behandeln Sie die Ausgabe als nicht vertrauenswürdig, sofern Sie sie nicht mit `schema` validieren.
- Platzieren Sie Genehmigungen vor jedem Schritt mit Seiteneffekten (senden, posten, ausführen).

## Siehe auch

- [Thinking-Stufen](/de/tools/thinking)
- [Sub-Agents](/de/tools/subagents)
- [Slash-Befehle](/de/tools/slash-commands)
