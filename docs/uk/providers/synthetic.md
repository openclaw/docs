---
read_when:
    - Ви хочете використовувати Synthetic як постачальника моделей
    - Потрібно налаштувати ключ Synthetic API або базову URL-адресу
summary: Використання API Synthetic, сумісного з Anthropic, в OpenClaw
title: Синтетичний
x-i18n:
    generated_at: "2026-07-12T13:44:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) надає кінцеві точки, сумісні з Anthropic.
OpenClaw постачається з ним як із провайдером `synthetic` і використовує API
Anthropic Messages.

| Властивість  | Значення                              |
| ------------ | ------------------------------------- |
| Провайдер    | `synthetic`                           |
| Автентифікація | `SYNTHETIC_API_KEY`                 |
| API          | Anthropic Messages                    |
| Базова URL-адреса | `https://api.synthetic.new/anthropic` |

## Початок роботи

<Steps>
  <Step title="Отримайте ключ API">
    Отримайте `SYNTHETIC_API_KEY` у своєму обліковому записі Synthetic або
    дозвольте майстру початкового налаштування запитати його.
  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Перевірте модель за замовчуванням">
    Під час початкового налаштування моделлю за замовчуванням встановлюється:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Клієнт Anthropic в OpenClaw автоматично додає `/v1` до базової URL-адреси, тому
використовуйте `https://api.synthetic.new/anthropic` (а не `/anthropic/v1`).
Якщо Synthetic змінить базову URL-адресу, перевизначте
`models.providers.synthetic.baseUrl`.
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

## Вбудований каталог

Усі моделі Synthetic мають вартість `0` (введення/виведення/кеш).

| Ідентифікатор моделі                                   | Контекстне вікно | Макс. токенів | Міркування | Вхідні дані    |
| ------------------------------------------------------ | ---------------- | ------------- | ---------- | -------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000          | 65,536        | ні         | текст          |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000          | 8,192         | так        | текст          |
| `hf:zai-org/GLM-4.7`                                   | 198,000          | 128,000       | ні         | текст          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000          | 8,192         | ні         | текст          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000          | 8,192         | ні         | текст          |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000          | 8,192         | ні         | текст          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000          | 8,192         | ні         | текст          |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000          | 8,192         | ні         | текст          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000          | 8,192         | ні         | текст          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000          | 8,192         | ні         | текст          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000          | 8,192         | ні         | текст          |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000          | 8,192         | так        | текст + зображення |
| `hf:openai/gpt-oss-120b`                               | 128,000          | 8,192         | ні         | текст          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000          | 8,192         | ні         | текст          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000          | 8,192         | ні         | текст          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000          | 8,192         | ні         | текст + зображення |
| `hf:zai-org/GLM-4.5`                                   | 128,000          | 128,000       | ні         | текст          |
| `hf:zai-org/GLM-4.6`                                   | 198,000          | 128,000       | ні         | текст          |
| `hf:zai-org/GLM-5`                                     | 256,000          | 128,000       | так        | текст + зображення |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000          | 8,192         | ні         | текст          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000          | 8,192         | так        | текст          |

<Tip>
Посилання на моделі мають формат `synthetic/<modelId>`. Скористайтеся
`openclaw models list --provider synthetic`, щоб переглянути всі моделі,
доступні у вашому обліковому записі.
</Tip>

<AccordionGroup>
  <Accordion title="Список дозволених моделей">
    Якщо ви ввімкнули список дозволених моделей (`agents.defaults.models`),
    додайте до нього кожну модель Synthetic, яку плануєте використовувати.
    Моделі, яких немає в списку дозволених, приховуються від агента.
  </Accordion>

  <Accordion title="Перевизначення базової URL-адреси">
    Якщо Synthetic змінить кінцеву точку API, перевизначте базову URL-адресу:

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

    OpenClaw усе одно автоматично додає `/v1`.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Правила провайдерів, посилання на моделі та поведінка резервного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, зокрема налаштування провайдерів.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Панель керування Synthetic і документація API.
  </Card>
</CardGroup>
