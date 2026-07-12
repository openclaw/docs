---
read_when:
    - U wilt een LLM-stap met uitsluitend JSON binnen workflows
    - U hebt schema-gevalideerde LLM-uitvoer nodig voor automatisering
summary: LLM-taken met uitsluitend JSON voor workflows (optionele plugintool)
title: LLM-taak
x-i18n:
    generated_at: "2026-07-12T09:23:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` is een gebundelde **optionele Plugin-tool** die één LLM-aanroep met uitsluitend JSON uitvoert en gestructureerde uitvoer retourneert, desgewenst gevalideerd aan de hand van een JSON Schema. Hiermee krijgen workflow-engines zoals Lobster een LLM-stap zonder aangepaste OpenClaw-code per workflow.

## Inschakelen

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

2. Sta de tool toe:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` voegt `llm-task` toe aan het actieve toolprofiel zonder andere kerntools te beperken. Gebruik in plaats daarvan alleen `tools.allow` als je een beperkende modus met een lijst van toegestane tools wilt.

## Configuratie (optioneel)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` is een lijst van toegestane `provider/model`-tekenreeksen; een aanvraag voor elk ander model wordt geweigerd. Alle andere sleutels zijn terugvalwaarden per aanroep die worden gebruikt wanneer die parameter in de toolaanroep ontbreekt.

## Toolparameters

| Parameter       | Type   | Opmerkingen                                                                                                                                                                        |
| --------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | Verplicht. Taakinstructie voor het LLM.                                                                                                                                           |
| `input`         | any    | Optionele payload; wordt naar JSON geserialiseerd en aan de prompt toegevoegd.                                                                                                    |
| `schema`        | object | Optioneel JSON Schema waaraan de geparseerde uitvoer moet voldoen.                                                                                                                |
| `provider`      | string | Overschrijft `defaultProvider` / de standaardprovider van de agent.                                                                                                               |
| `model`         | string | Overschrijft `defaultModel`; accepteert losse model-id's, aliassen of een `provider/model`-verwijzing (een dubbel providerprefix wordt automatisch verwijderd).                   |
| `thinking`      | string | Redeneerniveau (bijvoorbeeld `low`, `medium`); moet worden ondersteund door het vastgestelde model.                                                                                |
| `authProfileId` | string | Overschrijft `defaultAuthProfileId`.                                                                                                                                               |
| `temperature`   | number | Op basis van beste inspanning; niet alle providers respecteren deze waarde.                                                                                                       |
| `maxTokens`     | number | Bovengrens voor uitvoertokens op basis van beste inspanning.                                                                                                                      |
| `timeoutMs`     | number | Time-out voor de uitvoering; standaard `30000`.                                                                                                                                   |

## Uitvoer

Retourneert `details.json` (de geparseerde, aan de hand van het schema gevalideerde JSON) plus `details.provider` en `details.model`, die aangeven wat daadwerkelijk is uitgevoerd.

## Voorbeeld: Lobster-workflowstap

### Belangrijke beperking

Het onderstaande voorbeeld gaat ervan uit dat de **zelfstandige Lobster CLI** wordt uitgevoerd waar `openclaw.invoke` al over de juiste Gateway-URL en authenticatiecontext beschikt.

Voor de gebundelde, **ingebedde** Lobster-runner binnen OpenClaw is dit geneste CLI-patroon **momenteel niet betrouwbaar**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Totdat ingebedde Lobster een ondersteunde brug voor deze stroom heeft, geef je de voorkeur aan:

- directe `llm-task`-toolaanroepen buiten Lobster; of
- Lobster-stappen die niet afhankelijk zijn van geneste `openclaw.invoke`-aanroepen.

Voorbeeld voor de zelfstandige Lobster CLI:

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

- **Uitsluitend JSON**: het model krijgt de instructie om alleen een JSON-waarde te retourneren, zonder codeblokken of commentaar.
- **Geen tools**: bij de onderliggende uitvoering zijn tools uitgeschakeld, zodat het model tijdens de taak geen aanroepen kan doen.
- Behandel de uitvoer als niet-vertrouwd, tenzij je deze met `schema` valideert.
- Plaats goedkeuringen vóór elke stap met neveneffecten (verzenden, plaatsen, uitvoeren) die deze uitvoer gebruikt.

## Gerelateerd

- [Redeneerniveaus](/nl/tools/thinking)
- [Subagents](/nl/tools/subagents)
- [Slash-opdrachten](/nl/tools/slash-commands)
