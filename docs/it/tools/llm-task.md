---
read_when:
    - Vuoi un passaggio LLM solo JSON all'interno dei flussi di lavoro
    - Hai bisogno di output LLM convalidato tramite schema per l'automazione
summary: Attività LLM solo JSON per i flussi di lavoro (strumento plugin opzionale)
title: Attività LLM
x-i18n:
    generated_at: "2026-04-05T14:06:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# Attività LLM

`llm-task` è uno **strumento plugin opzionale** che esegue un'attività LLM solo JSON e
restituisce output strutturato (facoltativamente convalidato rispetto a JSON Schema).

È ideale per motori di workflow come Lobster: puoi aggiungere un singolo passaggio LLM
senza scrivere codice OpenClaw personalizzato per ogni workflow.

## Abilitare il plugin

1. Abilita il plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Aggiungi lo strumento alla allowlist (viene registrato con `optional: true`):

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

## Configurazione (facoltativa)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` è una allowlist di stringhe `provider/model`. Se impostata, qualsiasi richiesta
al di fuori dell'elenco viene rifiutata.

## Parametri dello strumento

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

`thinking` accetta i preset standard di ragionamento OpenClaw, come `low` o `medium`.

## Output

Restituisce `details.json` contenente il JSON analizzato (e lo convalida rispetto a
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

- Lo strumento è **solo JSON** e istruisce il modello a produrre solo JSON (senza
  recinzioni di codice, senza commenti).
- Nessuno strumento viene esposto al modello per questa esecuzione.
- Tratta l'output come non attendibile a meno che non lo convalidi con `schema`.
- Inserisci approvazioni prima di qualsiasi passaggio con effetti collaterali (send, post, exec).
