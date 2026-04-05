---
read_when:
    - Chcesz używać jednego klucza API do wielu LLM-ów
    - Potrzebujesz wskazówek dotyczących konfiguracji Baidu Qianfan
summary: Używaj zunifikowanego API Qianfan, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-05T14:03:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965d83dd968563447ce3571a73bd71c6876275caff8664311a852b2f9827e55b
    source_path: providers/qianfan.md
    workflow: 15
---

# Przewodnik po providerze Qianfan

Qianfan to platforma MaaS firmy Baidu, która udostępnia **zunifikowane API** kierujące żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodna z OpenAI, więc większość SDK OpenAI działa po zmianie base URL.

## Wymagania wstępne

1. Konto Baidu Cloud z dostępem do API Qianfan
2. Klucz API z konsoli Qianfan
3. OpenClaw zainstalowany w systemie

## Uzyskanie klucza API

1. Odwiedź [konsolę Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Utwórz nową aplikację lub wybierz istniejącą
3. Wygeneruj klucz API (format: `bce-v3/ALTAK-...`)
4. Skopiuj klucz API do użycia z OpenClaw

## Konfiguracja CLI

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## Fragment konfiguracji

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

## Uwagi

- Domyślne odwołanie do dołączonego modelu: `qianfan/deepseek-v3.2`
- Domyślny base URL: `https://qianfan.baidubce.com/v2`
- Dołączony katalog obecnie zawiera `deepseek-v3.2` i `ernie-5.0-thinking-preview`
- Dodawaj lub nadpisuj `models.providers.qianfan` tylko wtedy, gdy potrzebujesz niestandardowego base URL lub metadanych modelu
- Qianfan działa przez ścieżkę transportu zgodną z OpenAI, a nie przez natywne kształtowanie żądań OpenAI

## Powiązana dokumentacja

- [Konfiguracja OpenClaw](/pl/gateway/configuration)
- [Providerzy modeli](/pl/concepts/model-providers)
- [Konfiguracja agenta](/pl/concepts/agent)
- [Dokumentacja API Qianfan](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
