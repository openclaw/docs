---
read_when:
    - Je wilt een LLM-stap die alleen JSON retourneert binnen workflows
    - Je hebt schemagevalideerde LLM-uitvoer nodig voor automatisering
summary: LLM-taken met uitsluitend JSON voor werkstromen (optioneel Plugin-hulpmiddel)
title: LLM-taak
x-i18n:
    generated_at: "2026-05-07T13:27:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` is een **optionele Plugin-tool** die een JSON-only LLM-taak uitvoert en
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

Gebruik `tools.allow` alleen wanneer je de beperkende allowlist-modus wilt.

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

`allowedModels` is een allowlist van `provider/model`-strings. Als dit is ingesteld, wordt elk verzoek
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

### Belangrijke beperking

Het onderstaande voorbeeld gaat ervan uit dat de **zelfstandige Lobster CLI** draait in een omgeving waar `openclaw.invoke` al de juiste Gateway-URL/auth-context heeft.

Voor de gebundelde **embedded** Lobster-runner binnen OpenClaw is dit geneste CLI-patroon **momenteel niet betrouwbaar**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Totdat embedded Lobster een ondersteunde bridge voor deze flow heeft, geef je de voorkeur aan:

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

## Veiligheidsnotities

- De tool is **JSON-only** en instrueert het model om alleen JSON uit te voeren (geen
  code fences, geen commentaar).
- Er worden voor deze run geen tools aan het model blootgesteld.
- Behandel uitvoer als niet-vertrouwd, tenzij je valideert met `schema`.
- Plaats goedkeuringen vóór elke stap met bijwerkingen (send, post, exec).

## Gerelateerd

- [Thinking-niveaus](/nl/tools/thinking)
- [Sub-agents](/nl/tools/subagents)
- [Slash commands](/nl/tools/slash-commands)
