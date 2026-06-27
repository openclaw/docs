---
read_when:
    - Je wilt een LLM-stap met alleen JSON binnen workflows
    - Je hebt schemagevalideerde LLM-output nodig voor automatisering
summary: JSON-only LLM-taken voor workflows (optionele Plugin-tool)
title: LLM-taak
x-i18n:
    generated_at: "2026-06-27T18:27:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` is een **optionele Plugin-tool** die een JSON-only LLM-taak uitvoert en
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

`allowedModels` is een allowlist van `provider/model`-tekenreeksen. Indien ingesteld, wordt elk verzoek
buiten de lijst geweigerd.

## Toolparameters

- `prompt` (tekenreeks, vereist)
- `input` (alles, optioneel)
- `schema` (object, optioneel JSON Schema)
- `provider` (tekenreeks, optioneel)
- `model` (tekenreeks, optioneel)
- `thinking` (tekenreeks, optioneel)
- `authProfileId` (tekenreeks, optioneel)
- `temperature` (getal, optioneel)
- `maxTokens` (getal, optioneel)
- `timeoutMs` (getal, optioneel)

`thinking` accepteert de standaard OpenClaw-redeneerpresets, zoals `low` of `medium`.

## Uitvoer

Retourneert `details.json` met de geparste JSON (en valideert tegen
`schema` wanneer opgegeven).

## Voorbeeld: Lobster-workflowstap

### Belangrijke beperking

Het onderstaande voorbeeld gaat ervan uit dat de **zelfstandige Lobster CLI** draait in een omgeving waar `openclaw.invoke` al de juiste Gateway-URL/auth-context heeft.

Voor de gebundelde **ingebedde** Lobster-runner binnen OpenClaw is dit geneste CLI-patroon **momenteel niet betrouwbaar**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Totdat ingebedde Lobster een ondersteunde bridge voor deze flow heeft, geef de voorkeur aan:

- directe `llm-task`-toolaanroepen buiten Lobster, of
- Lobster-stappen die niet afhankelijk zijn van geneste `openclaw.invoke`-aanroepen.

Voorbeeld voor zelfstandige Lobster CLI:

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

- De tool is **JSON-only** en instrueert het model om alleen JSON uit te voeren (geen
  code fences, geen commentaar).
- Er worden geen tools aan het model blootgesteld voor deze run.
- Behandel uitvoer als niet-vertrouwd, tenzij je valideert met `schema`.
- Plaats goedkeuringen vóór elke stap met neveneffecten (send, post, exec).

## Gerelateerd

- [Thinking-niveaus](/nl/tools/thinking)
- [Subagents](/nl/tools/subagents)
- [Slash-commando's](/nl/tools/slash-commands)
