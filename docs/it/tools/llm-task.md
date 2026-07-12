---
read_when:
    - Vuoi un passaggio LLM con output esclusivamente JSON all'interno dei flussi di lavoro
    - Hai bisogno di un output dell'LLM convalidato rispetto a uno schema per l'automazione
summary: Attività LLM esclusivamente JSON per i flussi di lavoro (strumento Plugin facoltativo)
title: Attività LLM
x-i18n:
    generated_at: "2026-07-12T07:33:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` è uno **strumento Plugin opzionale incluso** che esegue una singola
chiamata LLM esclusivamente JSON e restituisce un output strutturato, facoltativamente
convalidato rispetto a uno schema JSON. Fornisce ai motori di workflow come Lobster
un passaggio LLM senza richiedere codice OpenClaw personalizzato per ogni workflow.

## Abilitazione

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

2. Consenti lo strumento:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` aggiunge `llm-task` al profilo degli strumenti attivo senza
limitare gli altri strumenti principali. Usa invece `tools.allow` solo se desideri
una modalità restrittiva basata su un elenco di elementi consentiti.

## Configurazione (facoltativa)

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

`allowedModels` è un elenco di stringhe `provider/model` consentite; una richiesta
per qualsiasi altro modello viene rifiutata. Tutte le altre chiavi sono valori di
ripiego per chiamata, usati quando la chiamata allo strumento omette il relativo parametro.

## Parametri dello strumento

| Parametro       | Tipo   | Note                                                                                                                                                              |
| --------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | Obbligatorio. Istruzione dell'attività per l'LLM.                                                                                                                  |
| `input`         | any    | Payload facoltativo; viene serializzato in JSON e aggiunto al prompt.                                                                                              |
| `schema`        | object | Schema JSON facoltativo rispetto al quale deve essere convalidato l'output analizzato.                                                                             |
| `provider`      | string | Sostituisce `defaultProvider` / il provider predefinito dell'agente.                                                                                               |
| `model`         | string | Sostituisce `defaultModel`; accetta ID di modello semplici, alias o un riferimento `provider/model` (un prefisso del provider duplicato viene rimosso automaticamente). |
| `thinking`      | string | Livello di ragionamento (ad es. `low`, `medium`); deve essere supportato dal modello risolto.                                                                       |
| `authProfileId` | string | Sostituisce `defaultAuthProfileId`.                                                                                                                                |
| `temperature`   | number | Applicato quando possibile; non tutti i provider lo rispettano.                                                                                                   |
| `maxTokens`     | number | Limite massimo, applicato quando possibile, per i token di output.                                                                                                 |
| `timeoutMs`     | number | Timeout dell'esecuzione; valore predefinito `30000`.                                                                                                               |

## Output

Restituisce `details.json` (il JSON analizzato e convalidato rispetto allo schema), oltre a
`details.provider` e `details.model`, che indicano rispettivamente il provider e il modello
effettivamente utilizzati.

## Esempio: passaggio di un workflow Lobster

### Limitazione importante

L'esempio seguente presuppone che la **CLI Lobster autonoma** sia in esecuzione in un
ambiente in cui `openclaw.invoke` dispone già del corretto contesto dell'URL e
dell'autenticazione del Gateway.

Per l'esecutore Lobster **incorporato** incluso in OpenClaw, questo schema di CLI
nidificata **non è attualmente affidabile**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Finché Lobster incorporato non disporrà di un bridge supportato per questo flusso,
preferisci una delle seguenti opzioni:

- chiamate dirette allo strumento `llm-task` al di fuori di Lobster; oppure
- passaggi Lobster che non dipendano da chiamate `openclaw.invoke` nidificate.

Esempio con la CLI Lobster autonoma:

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

- **Solo JSON**: al modello viene richiesto di restituire esclusivamente un valore JSON,
  senza blocchi di codice né commenti.
- **Nessuno strumento**: l'esecuzione sottostante ha gli strumenti disabilitati, quindi il
  modello non può effettuare chiamate esterne durante l'attività.
- Considera l'output non attendibile, a meno che non venga convalidato con `schema`.
- Inserisci le approvazioni prima di qualsiasi passaggio con effetti collaterali
  (invio, pubblicazione, esecuzione) che utilizzi questo output.

## Contenuti correlati

- [Livelli di ragionamento](/it/tools/thinking)
- [Sottoagenti](/it/tools/subagents)
- [Comandi slash](/it/tools/slash-commands)
