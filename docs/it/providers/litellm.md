---
read_when:
    - Vuoi instradare OpenClaw tramite un proxy LiteLLM
    - Hai bisogno di monitoraggio dei costi, logging o instradamento dei modelli tramite LiteLLM
summary: Esegui OpenClaw tramite LiteLLM Proxy per accesso unificato ai modelli e monitoraggio dei costi
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T14:01:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) è un gateway LLM open-source che fornisce un'API unificata per oltre 100 provider di modelli. Instrada OpenClaw tramite LiteLLM per ottenere monitoraggio centralizzato dei costi, logging e la flessibilità di cambiare backend senza modificare la configurazione di OpenClaw.

## Perché usare LiteLLM con OpenClaw?

- **Monitoraggio dei costi** — Vedi esattamente quanto OpenClaw spende su tutti i modelli
- **Instradamento dei modelli** — Passa tra Claude, GPT-4, Gemini, Bedrock senza modifiche di configurazione
- **Chiavi virtuali** — Crea chiavi con limiti di spesa per OpenClaw
- **Logging** — Log completi di richiesta/risposta per il debug
- **Fallback** — Failover automatico se il provider primario non è disponibile

## Avvio rapido

### Tramite onboarding

```bash
openclaw onboard --auth-choice litellm-api-key
```

### Configurazione manuale

1. Avvia LiteLLM Proxy:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. Punta OpenClaw a LiteLLM:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

Questo è tutto. OpenClaw ora viene instradato tramite LiteLLM.

## Configurazione

### Variabili d'ambiente

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### File di configurazione

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Chiavi virtuali

Crea una chiave dedicata per OpenClaw con limiti di spesa:

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

Usa la chiave generata come `LITELLM_API_KEY`.

## Instradamento dei modelli

LiteLLM può instradare le richieste di modello verso backend diversi. Configuralo nel tuo `config.yaml` di LiteLLM:

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw continua a richiedere `claude-opus-4-6` — LiteLLM gestisce l'instradamento.

## Visualizzazione dell'utilizzo

Controlla la dashboard o l'API di LiteLLM:

```bash
# Informazioni sulla chiave
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Log di spesa
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Note

- LiteLLM è in esecuzione su `http://localhost:4000` per impostazione predefinita
- OpenClaw si connette tramite l'endpoint `/v1` in stile proxy compatibile con OpenAI di LiteLLM
- Il request shaping nativo solo OpenAI non si applica tramite LiteLLM:
  niente `service_tier`, niente `store` di Responses, niente hint di prompt-cache e nessun payload shaping di compatibilità del reasoning OpenAI
- Gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`)
  non vengono iniettati su base URL LiteLLM personalizzati

## Vedi anche

- [Documentazione LiteLLM](https://docs.litellm.ai)
- [Provider di modelli](/concepts/model-providers)
