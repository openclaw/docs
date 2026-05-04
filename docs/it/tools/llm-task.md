---
read_when:
    - Vuoi un passaggio LLM esclusivamente JSON nei flussi di lavoro
    - È necessario un risultato dell'LLM validato da schema per l'automazione
summary: Attività LLM solo JSON per flussi di lavoro (strumento Plugin facoltativo)
title: Attività LLM
x-i18n:
    generated_at: "2026-05-04T07:09:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` è un **tool Plugin facoltativo** che esegue un task LLM solo JSON e
restituisce output strutturato (facoltativamente validato rispetto a JSON Schema).

È ideale per motori di workflow come Lobster: puoi aggiungere un singolo passaggio LLM
senza scrivere codice OpenClaw personalizzato per ogni workflow.

## Abilitare il Plugin

1. Abilita il Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Consenti il tool facoltativo:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Usa `tools.allow` solo quando vuoi la modalità allowlist restrittiva.

## Configurazione (facoltativa)

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

`allowedModels` è un'allowlist di stringhe `provider/model`. Se impostata, qualsiasi richiesta
fuori dall'elenco viene rifiutata.

## Parametri del tool

- `prompt` (string, obbligatorio)
- `input` (any, facoltativo)
- `schema` (object, JSON Schema facoltativo)
- `provider` (string, facoltativo)
- `model` (string, facoltativo)
- `thinking` (string, facoltativo)
- `authProfileId` (string, facoltativo)
- `temperature` (number, facoltativo)
- `maxTokens` (number, facoltativo)
- `timeoutMs` (number, facoltativo)

`thinking` accetta i preset di ragionamento standard di OpenClaw, come `low` o `medium`.

## Output

Restituisce `details.json` contenente il JSON analizzato (e lo valida rispetto a
`schema` quando fornito).

## Esempio: passaggio di workflow Lobster

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

## Note sulla sicurezza

- Il tool è **solo JSON** e indica al modello di produrre solo JSON (senza
  code fence, senza commenti).
- Nessun tool viene esposto al modello per questa esecuzione.
- Tratta l'output come non attendibile a meno che tu non lo validi con `schema`.
- Inserisci le approvazioni prima di qualsiasi passaggio con effetti collaterali (send, post, exec).

## Correlati

- [Livelli di thinking](/it/tools/thinking)
- [Sub-agents](/it/tools/subagents)
- [Comandi slash](/it/tools/slash-commands)
