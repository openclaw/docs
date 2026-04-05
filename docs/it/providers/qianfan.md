---
read_when:
    - Vuoi una singola API key per molti LLM
    - Hai bisogno di indicazioni per configurare Baidu Qianfan
summary: Usa l'API unificata di Qianfan per accedere a molti modelli in OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-05T14:02:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965d83dd968563447ce3571a73bd71c6876275caff8664311a852b2f9827e55b
    source_path: providers/qianfan.md
    workflow: 15
---

# Guida al provider Qianfan

Qianfan è la piattaforma MaaS di Baidu e fornisce una **API unificata** che instrada le richieste verso molti modelli dietro un unico
endpoint e un'unica API key. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando il base URL.

## Prerequisiti

1. Un account Baidu Cloud con accesso all'API Qianfan
2. Una API key dalla console Qianfan
3. OpenClaw installato sul tuo sistema

## Ottenere la tua API key

1. Visita la [Console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Crea una nuova applicazione o selezionane una esistente
3. Genera una API key (formato: `bce-v3/ALTAK-...`)
4. Copia la API key per usarla con OpenClaw

## Configurazione CLI

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## Snippet di configurazione

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

## Note

- Model ref incluso predefinito: `qianfan/deepseek-v3.2`
- Base URL predefinito: `https://qianfan.baidubce.com/v2`
- Il catalogo incluso attualmente contiene `deepseek-v3.2` e `ernie-5.0-thinking-preview`
- Aggiungi o sostituisci `models.providers.qianfan` solo quando hai bisogno di un base URL o di metadati del modello personalizzati
- Qianfan passa attraverso il percorso di transport compatibile con OpenAI, non tramite lo shaping nativo delle richieste OpenAI

## Documentazione correlata

- [Configurazione OpenClaw](/gateway/configuration)
- [Provider di modelli](/concepts/model-providers)
- [Configurazione dell'agente](/concepts/agent)
- [Documentazione API Qianfan](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
