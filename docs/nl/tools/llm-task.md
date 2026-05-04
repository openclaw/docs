---
read_when:
    - Je wilt een LLM-stap met alleen JSON binnen workflows
    - Je hebt schema-gevalideerde LLM-uitvoer nodig voor automatisering
summary: LLM-taken uitsluitend in JSON voor workflows (optionele Plugin-tool)
title: LLM-taak
x-i18n:
    generated_at: "2026-05-04T07:09:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` is een **optionele Plugin-tool** die een LLM-taak met alleen JSON uitvoert en
gestructureerde uitvoer retourneert (optioneel gevalideerd tegen JSON Schema).

Dit is ideaal voor workflow-engines zoals Lobster: je kunt één LLM-stap toevoegen
zonder voor elke workflow aangepaste OpenClaw-code te schrijven.

## De Plugin inschakelen

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

2. Sta de optionele tool toe:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Gebruik `tools.allow` alleen wanneer je een restrictieve allowlist-modus wilt.

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

`allowedModels` is een allowlist van `provider/model`-tekenreeksen. Als dit is ingesteld, wordt elk verzoek
buiten de lijst geweigerd.

## Toolparameters

- `prompt` (tekenreeks, vereist)
- `input` (elke waarde, optioneel)
- `schema` (object, optioneel JSON Schema)
- `provider` (tekenreeks, optioneel)
- `model` (tekenreeks, optioneel)
- `thinking` (tekenreeks, optioneel)
- `authProfileId` (tekenreeks, optioneel)
- `temperature` (getal, optioneel)
- `maxTokens` (getal, optioneel)
- `timeoutMs` (getal, optioneel)

`thinking` accepteert de standaard redeneerpresets van OpenClaw, zoals `low` of `medium`.

## Uitvoer

Retourneert `details.json` met de geparseerde JSON (en valideert tegen
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

## Veiligheidsopmerkingen

- De tool werkt met **alleen JSON** en instrueert het model om uitsluitend JSON uit te voeren (geen
  code fences, geen commentaar).
- Er worden voor deze uitvoering geen tools aan het model beschikbaar gesteld.
- Behandel uitvoer als niet-vertrouwd, tenzij je valideert met `schema`.
- Plaats goedkeuringen vóór elke stap met neveneffecten (verzenden, posten, uitvoeren).

## Gerelateerd

- [Denk-niveaus](/nl/tools/thinking)
- [Sub-agents](/nl/tools/subagents)
- [Slash-commando's](/nl/tools/slash-commands)
