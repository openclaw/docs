---
read_when:
    - Vuoi eseguire OpenClaw contro un server vLLM locale
    - Vuoi endpoint `/v1` compatibili con OpenAI con i tuoi modelli
summary: Esegui OpenClaw con vLLM (server locale compatibile con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-05T14:02:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM può servire modelli open-source (e alcuni personalizzati) tramite un'API HTTP **compatibile con OpenAI**. OpenClaw può connettersi a vLLM usando l'API `openai-completions`.

OpenClaw può anche **rilevare automaticamente** i modelli disponibili da vLLM quando fai opt-in con `VLLM_API_KEY` (qualsiasi valore funziona se il tuo server non applica l'autenticazione) e non definisci una voce esplicita `models.providers.vllm`.

## Avvio rapido

1. Avvia vLLM con un server compatibile con OpenAI.

Il tuo URL base dovrebbe esporre endpoint `/v1` (ad es. `/v1/models`, `/v1/chat/completions`). vLLM viene comunemente eseguito su:

- `http://127.0.0.1:8000/v1`

2. Esegui l'opt-in (qualsiasi valore funziona se non è configurata alcuna autenticazione):

```bash
export VLLM_API_KEY="vllm-local"
```

3. Seleziona un modello (sostituisci con uno degli ID modello del tuo vLLM):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Rilevamento dei modelli (provider implicito)

Quando `VLLM_API_KEY` è impostato (oppure esiste un profilo auth) e **non** definisci `models.providers.vllm`, OpenClaw interroga:

- `GET http://127.0.0.1:8000/v1/models`

…e converte gli ID restituiti in voci di modello.

Se imposti esplicitamente `models.providers.vllm`, il rilevamento automatico viene saltato e devi definire i modelli manualmente.

## Configurazione esplicita (modelli manuali)

Usa la configurazione esplicita quando:

- vLLM è eseguito su un host/porta diversi.
- Vuoi fissare i valori `contextWindow`/`maxTokens`.
- Il tuo server richiede una vera chiave API (oppure vuoi controllare gli header).

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Risoluzione dei problemi

- Controlla che il server sia raggiungibile:

```bash
curl http://127.0.0.1:8000/v1/models
```

- Se le richieste falliscono con errori di autenticazione, imposta una vera `VLLM_API_KEY` che corrisponda alla configurazione del tuo server, oppure configura esplicitamente il provider sotto `models.providers.vllm`.

## Comportamento in stile proxy

vLLM viene trattato come backend proxy-style `/v1` compatibile con OpenAI, non come endpoint
OpenAI nativo.

- la modellazione delle richieste riservata al solo OpenAI nativo non si applica qui
- nessun `service_tier`, nessun `store` di Responses, nessun suggerimento di prompt-cache e nessuna modellazione del payload di compatibilità con il ragionamento OpenAI
- gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`)
  non vengono iniettati su `baseUrl` vLLM personalizzati
