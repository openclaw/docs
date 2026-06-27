---
read_when:
    - Vuoi un passaggio LLM solo JSON all'interno dei flussi di lavoro
    - Ti serve un output LLM convalidato tramite schema per l'automazione
summary: Attività LLM solo JSON per workflow (strumento Plugin opzionale)
title: Attività LLM
x-i18n:
    generated_at: "2026-06-27T18:21:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

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

2. Consenti lo strumento opzionale:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Usa `tools.allow` solo quando vuoi la modalità allowlist restrittiva.

## Configurazione (opzionale)

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

`allowedModels` è una allowlist di stringhe `provider/model`. Se impostata, qualsiasi richiesta
fuori dall'elenco viene rifiutata.

## Parametri dello strumento

- `prompt` (stringa, obbligatorio)
- `input` (qualsiasi, opzionale)
- `schema` (oggetto, JSON Schema opzionale)
- `provider` (stringa, opzionale)
- `model` (stringa, opzionale)
- `thinking` (stringa, opzionale)
- `authProfileId` (stringa, opzionale)
- `temperature` (numero, opzionale)
- `maxTokens` (numero, opzionale)
- `timeoutMs` (numero, opzionale)

`thinking` accetta i preset di ragionamento OpenClaw standard, come `low` o `medium`.

## Output

Restituisce `details.json` contenente il JSON analizzato (e lo convalida rispetto a
`schema` quando fornito).

## Esempio: passaggio di workflow Lobster

### Limitazione importante

L'esempio seguente presuppone che la **CLI Lobster standalone** sia in esecuzione in un ambiente in cui `openclaw.invoke` ha già l'URL del gateway e il contesto di autenticazione corretti.

Per il runner Lobster **embedded** incluso in OpenClaw, questo pattern CLI annidato **non è attualmente affidabile**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Finché Lobster embedded non avrà un bridge supportato per questo flusso, preferisci:

- chiamate dirette allo strumento `llm-task` al di fuori di Lobster, oppure
- passaggi Lobster che non dipendono da chiamate `openclaw.invoke` annidate.

Esempio di CLI Lobster standalone:

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
  blocchi di codice, senza commenti).
- Nessuno strumento viene esposto al modello per questa esecuzione.
- Considera l'output non attendibile a meno che tu non lo convalidi con `schema`.
- Inserisci approvazioni prima di qualsiasi passaggio con effetti collaterali (send, post, exec).

## Correlati

- [Livelli di ragionamento](/it/tools/thinking)
- [Sub-agent](/it/tools/subagents)
- [Comandi slash](/it/tools/slash-commands)
