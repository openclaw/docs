---
read_when:
    - |-
      Vuoi un passaggio LLM solo JSON all'interno dei workflow】【：】【“】【analysis to=functions.read  天天中彩票能json
      {"path":"/home/runner/work/docs/docs/source/docs/tools/llm-task.md"}
    - Ti serve output LLM validato tramite schema per l'automazione
summary: Attività LLM solo JSON per i workflow (strumento Plugin facoltativo)
title: Attività LLM
x-i18n:
    generated_at: "2026-04-24T09:06:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` è uno **strumento Plugin facoltativo** che esegue un'attività LLM solo JSON e
restituisce output strutturato (facoltativamente validato rispetto a JSON Schema).

È l'ideale per motori di workflow come Lobster: puoi aggiungere un singolo passaggio LLM
senza scrivere codice OpenClaw personalizzato per ogni workflow.

## Abilita il Plugin

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

2. Inserisci lo strumento nella allowlist (è registrato con `optional: true`):

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

`allowedModels` è una allowlist di stringhe `provider/model`. Se impostata, qualsiasi richiesta
fuori dall'elenco viene rifiutata.

## Parametri dello strumento

- `prompt` (stringa, obbligatorio)
- `input` (qualsiasi valore, facoltativo)
- `schema` (oggetto, JSON Schema facoltativo)
- `provider` (stringa, facoltativo)
- `model` (stringa, facoltativo)
- `thinking` (stringa, facoltativo)
- `authProfileId` (stringa, facoltativo)
- `temperature` (numero, facoltativo)
- `maxTokens` (numero, facoltativo)
- `timeoutMs` (numero, facoltativo)

`thinking` accetta i preset di reasoning standard di OpenClaw, come `low` o `medium`.

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

## Note di sicurezza

- Lo strumento è **solo JSON** e istruisce il modello a produrre solo JSON (senza
  code fence, senza commenti).
- Nessuno strumento viene esposto al modello per questa esecuzione.
- Tratta l'output come non attendibile a meno che tu non lo validi con `schema`.
- Inserisci approvazioni prima di qualsiasi passaggio con effetti collaterali (invio, pubblicazione, exec).

## Correlati

- [Thinking levels](/it/tools/thinking)
- [Sub-agents](/it/tools/subagents)
- [Slash commands](/it/tools/slash-commands)
