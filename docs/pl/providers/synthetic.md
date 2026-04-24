---
read_when:
    - Chcesz używać Synthetic jako dostawcy modeli
    - Potrzebujesz konfiguracji klucza API Synthetic lub base URL
summary: Używaj zgodnego z Anthropic API Synthetic w OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-24T09:29:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 15
---

[Synthetic](https://synthetic.new) udostępnia endpointy zgodne z Anthropic.
OpenClaw rejestruje go jako dostawcę `synthetic` i używa API Anthropic
Messages.

| Właściwość | Wartość                              |
| ----------- | ------------------------------------ |
| Dostawca    | `synthetic`                          |
| Uwierzytelnianie | `SYNTHETIC_API_KEY`            |
| API         | Anthropic Messages                   |
| Base URL    | `https://api.synthetic.new/anthropic` |

## Pierwsze kroki

<Steps>
  <Step title="Pobierz klucz API">
    Uzyskaj `SYNTHETIC_API_KEY` ze swojego konta Synthetic albo pozwól,
    aby kreator onboardingu poprosił Cię o niego.
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Sprawdź domyślny model">
    Po onboardingu domyślny model jest ustawiony na:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Klient Anthropic w OpenClaw automatycznie dopisuje `/v1` do base URL, więc używaj
`https://api.synthetic.new/anthropic` (a nie `/anthropic/v1`). Jeśli Synthetic
zmieni swój base URL, nadpisz `models.providers.synthetic.baseUrl`.
</Warning>

## Przykład konfiguracji

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Wbudowany katalog

Wszystkie modele Synthetic używają kosztu `0` (wejście/wyjście/cache).

| ID modelu                                              | Okno kontekstu | Maks. tokeny | Reasoning | Wejście      |
| ------------------------------------------------------ | -------------- | ------------ | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536       | nie       | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192        | tak       | text         |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000      | nie       | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192        | nie       | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192        | nie       | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192        | nie       | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192        | nie       | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192        | nie       | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192        | nie       | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192        | nie       | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192        | nie       | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192        | tak       | text + image |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192        | nie       | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192        | nie       | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192        | nie       | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192        | nie       | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000      | nie       | text         |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000      | nie       | text         |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000      | tak       | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192        | nie       | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192        | tak       | text         |

<Tip>
Model ref mają postać `synthetic/<modelId>`. Użyj
`openclaw models list --provider synthetic`, aby zobaczyć wszystkie modele dostępne na Twoim
koncie.
</Tip>

<AccordionGroup>
  <Accordion title="Allowlist modeli">
    Jeśli włączysz allowlist modeli (`agents.defaults.models`), dodaj każdy
    model Synthetic, którego planujesz używać. Modele spoza allowlist będą ukryte
    przed agentem.
  </Accordion>

  <Accordion title="Nadpisanie base URL">
    Jeśli Synthetic zmieni endpoint API, nadpisz base URL w konfiguracji:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    Pamiętaj, że OpenClaw automatycznie dopisuje `/v1`.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Zasady dostawców, model ref i zachowanie failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawców.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Panel Synthetic i dokumentacja API.
  </Card>
</CardGroup>
