---
read_when:
    - Vuoi un passaggio LLM solo JSON all'interno dei flussi di lavoro
    - Hai bisogno di output di LLM convalidato tramite schema per l'automazione
summary: Attività LLM solo JSON per flussi di lavoro (strumento plugin opzionale)
title: Attività LLM
x-i18n:
    generated_at: "2026-05-07T13:26:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` è uno **strumento Plugin opzionale** che esegue un'attività LLM solo JSON e
restituisce un output strutturato (facoltativamente validato rispetto a JSON Schema).

È ideale per motori di workflow come Lobster: puoi aggiungere un singolo passaggio LLM
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
- `input` (qualsiasi, opzionale)
- `schema` (oggetto, JSON Schema opzionale)
- `provider` (stringa, opzionale)
- `model` (stringa, opzionale)
- `thinking` (stringa, opzionale)
- `authProfileId` (stringa, opzionale)
- `temperature` (numero, opzionale)
- `maxTokens` (numero, opzionale)
- `timeoutMs` (numero, opzionale)

`thinking` accetta i preset di ragionamento standard di OpenClaw, come `low` o `medium`.

## Risultato

Restituisce `details.json` contenente il JSON analizzato (e lo valida rispetto a
`schema` quando fornito).

## Esempio: passaggio di workflow Lobster

### Limitazione importante

L'esempio seguente presume che la **CLI Lobster standalone** sia in esecuzione in un ambiente in cui `openclaw.invoke` ha già l'URL del Gateway e il contesto di autenticazione corretti.

Per il runner Lobster **incorporato** incluso in OpenClaw, questo pattern di CLI annidata **non è attualmente affidabile**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Finché Lobster incorporato non avrà un bridge supportato per questo flusso, preferisci una delle seguenti opzioni:

- chiamate dirette allo strumento `llm-task` fuori da Lobster, oppure
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

- Lo strumento è **solo JSON** e istruisce il modello a produrre solo JSON (nessun
  blocco di codice, nessun commento).
- Nessuno strumento viene esposto al modello per questa esecuzione.
- Tratta l'output come non attendibile, a meno che tu non lo validi con `schema`.
- Inserisci le approvazioni prima di qualsiasi passaggio con effetti collaterali (send, post, exec).

## Correlati

- [Livelli di ragionamento](/it/tools/thinking)
- [Sub-agenti](/it/tools/subagents)
- [Comandi slash](/it/tools/slash-commands)
