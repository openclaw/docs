---
read_when:
    - Ви хочете використовувати Synthetic як provider моделей
    - Вам потрібно налаштувати ключ API Synthetic або base URL
summary: Використовуйте Anthropic-сумісний API Synthetic в OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-23T21:08:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3cc907fab62bb421488a4ca1892e08c6b6f77e43cc33179f787a9b6b134513f9
    source_path: providers/synthetic.md
    workflow: 15
---

[Synthetic](https://synthetic.new) відкриває Anthropic-сумісні endpoints.
OpenClaw реєструє його як provider `synthetic` і використовує
Anthropic Messages API.

| Властивість | Значення                              |
| ----------- | ------------------------------------- |
| Provider    | `synthetic`                           |
| Auth        | `SYNTHETIC_API_KEY`                   |
| API         | Anthropic Messages                    |
| Base URL    | `https://api.synthetic.new/anthropic` |

## Початок роботи

<Steps>
  <Step title="Отримайте ключ API">
    Отримайте `SYNTHETIC_API_KEY` у своєму обліковому записі Synthetic або дозвольте
    майстру онбордингу запросити його.
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Перевірте типову модель">
    Після онбордингу типовою моделлю буде:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Клієнт Anthropic в OpenClaw автоматично додає `/v1` до base URL, тому використовуйте
`https://api.synthetic.new/anthropic` (а не `/anthropic/v1`). Якщо Synthetic
змінить свій base URL, перевизначте `models.providers.synthetic.baseUrl`.
</Warning>

## Приклад конфігурації

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

## Каталог моделей

Усі моделі Synthetic використовують вартість `0` (input/output/cache).

| ID моделі                                              | Контекстне вікно | Макс. токенів | Reasoning | Вхід         |
| ------------------------------------------------------ | ---------------- | ------------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000          | 65,536        | ні        | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000          | 8,192         | так       | text         |
| `hf:zai-org/GLM-4.7`                                   | 198,000          | 128,000       | ні        | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000          | 8,192         | ні        | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000          | 8,192         | ні        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000          | 8,192         | ні        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000          | 8,192         | ні        | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000          | 8,192         | ні        | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000          | 8,192         | ні        | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000          | 8,192         | ні        | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000          | 8,192         | ні        | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000          | 8,192         | так       | text + image |
| `hf:openai/gpt-oss-120b`                               | 128,000          | 8,192         | ні        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000          | 8,192         | ні        | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000          | 8,192         | ні        | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000          | 8,192         | ні        | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128,000          | 128,000       | ні        | text         |
| `hf:zai-org/GLM-4.6`                                   | 198,000          | 128,000       | ні        | text         |
| `hf:zai-org/GLM-5`                                     | 256,000          | 128,000       | так       | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000          | 8,192         | ні        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000          | 8,192         | так       | text         |

<Tip>
Refs моделей мають форму `synthetic/<modelId>`. Використовуйте
`openclaw models list --provider synthetic`, щоб побачити всі моделі, доступні у вашому
обліковому записі.
</Tip>

<AccordionGroup>
  <Accordion title="Allowlist моделей">
    Якщо ви вмикаєте allowlist моделей (`agents.defaults.models`), додайте кожну
    модель Synthetic, яку плануєте використовувати. Моделі, яких немає в allowlist, будуть приховані
    від агента.
  </Accordion>

  <Accordion title="Перевизначення Base URL">
    Якщо Synthetic змінить свій endpoint API, перевизначте base URL у конфігурації:

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

    Пам’ятайте, що OpenClaw автоматично додає `/v1`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Правила provider-ів, refs моделей і поведінка failover.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями provider-а.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Dashboard Synthetic і документація API.
  </Card>
</CardGroup>
