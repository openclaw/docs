---
read_when:
    - Sie möchten einen reinen JSON-LLM-Schritt innerhalb von Workflows
    - Sie benötigen schema-validierte LLM-Ausgaben für die Automatisierung
summary: Nur-JSON-LLM-Aufgaben für Workflows (optionales Plugin-Tool)
title: LLM-Aufgabe
x-i18n:
    generated_at: "2026-05-04T02:25:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` ist ein **optionales Plugin-Tool**, das eine JSON-only-LLM-Aufgabe ausführt und
strukturierte Ausgabe zurückgibt (optional gegen JSON Schema validiert).

Dies ist ideal für Workflow-Engines wie Lobster: Sie können einen einzelnen LLM-Schritt
hinzufügen, ohne für jeden Workflow benutzerdefinierten OpenClaw-Code schreiben zu müssen.

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

`thinking` akzeptiert die standardmäßigen OpenClaw-Reasoning-Voreinstellungen, wie `low` oder `medium`.

## Ausgabe

Gibt `details.json` mit dem geparsten JSON zurück (und validiert gegen
`schema`, wenn angegeben).

## Beispiel: Lobster-Workflow-Schritt

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

- Das Tool ist **JSON-only** und weist das Modell an, nur JSON auszugeben (keine
  Code-Fences, keine Kommentare).
- Für diesen Lauf werden dem Modell keine Tools bereitgestellt.
- Behandeln Sie die Ausgabe als nicht vertrauenswürdig, sofern Sie sie nicht mit `schema` validieren.
- Platzieren Sie Genehmigungen vor jedem Schritt mit Nebeneffekten (send, post, exec).

## Verwandte Themen

- [Denkstufen](/de/tools/thinking)
- [Sub-Agenten](/de/tools/subagents)
- [Slash-Befehle](/de/tools/slash-commands)
