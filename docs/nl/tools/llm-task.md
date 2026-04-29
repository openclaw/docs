---
read_when:
    - Je wilt een LLM-stap met alleen JSON binnen werkstromen
    - Je hebt schema-gevalideerde LLM-uitvoer nodig voor automatisering
summary: LLM-taken met alleen JSON voor werkstromen (optionele plugin-tool)
title: LLM-taak
x-i18n:
    generated_at: "2026-04-29T23:24:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` is een **optionele Plugin-tool** die een LLM-taak met alleen JSON uitvoert en
gestructureerde uitvoer retourneert (optioneel gevalideerd tegen JSON Schema).

Dit is ideaal voor workflow-engines zoals Lobster: je kunt één LLM-stap toevoegen
zonder aangepaste OpenClaw-code voor elke workflow te schrijven.

## Schakel de Plugin in

1. Schakel de Plugin in:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Zet de tool op de allowlist (deze is geregistreerd met `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Configuratie (optioneel)

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

`allowedModels` is een allowlist van `provider/model`-strings. Als deze is ingesteld, wordt elk verzoek
buiten de lijst geweigerd.

## Toolparameters

- `prompt` (string, vereist)
- `input` (any, optioneel)
- `schema` (object, optioneel JSON Schema)
- `provider` (string, optioneel)
- `model` (string, optioneel)
- `thinking` (string, optioneel)
- `authProfileId` (string, optioneel)
- `temperature` (number, optioneel)
- `maxTokens` (number, optioneel)
- `timeoutMs` (number, optioneel)

`thinking` accepteert de standaard redeneerpresets van OpenClaw, zoals `low` of `medium`.

## Uitvoer

Retourneert `details.json` met de geparste JSON (en valideert tegen
`schema` wanneer opgegeven).

## Voorbeeld: Lobster-workflowstap

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

## Veiligheidsnotities

- De tool is **alleen JSON** en instrueert het model om alleen JSON uit te voeren (geen
  code fences, geen commentaar).
- Er worden voor deze uitvoering geen tools aan het model blootgesteld.
- Behandel uitvoer als onvertrouwd tenzij je valideert met `schema`.
- Plaats goedkeuringen vóór elke stap met neveneffecten (verzenden, posten, uitvoeren).

## Gerelateerd

- [Denk­niveaus](/nl/tools/thinking)
- [Subagenten](/nl/tools/subagents)
- [Slash-opdrachten](/nl/tools/slash-commands)
