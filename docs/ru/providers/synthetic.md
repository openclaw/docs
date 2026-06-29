---
read_when:
    - Вы хотите использовать Synthetic в качестве поставщика моделей
    - Вам нужен ключ Synthetic API или настроенный базовый URL
summary: Используйте Anthropic-совместимый API Synthetic в OpenClaw
title: Синтетический
x-i18n:
    generated_at: "2026-06-28T23:40:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) предоставляет Anthropic-совместимые конечные точки.
OpenClaw регистрирует его как поставщика `synthetic` и использует Anthropic
Messages API.

| Свойство | Значение                              |
| -------- | ------------------------------------- |
| Поставщик | `synthetic`                           |
| Аутентификация | `SYNTHETIC_API_KEY`                   |
| API      | Anthropic Messages                    |
| Базовый URL | `https://api.synthetic.new/anthropic` |

## Начало работы

<Steps>
  <Step title="Get an API key">
    Получите `SYNTHETIC_API_KEY` в своей учетной записи Synthetic или дайте
    мастеру первоначальной настройки запросить его у вас.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verify the default model">
    После первоначальной настройки модель по умолчанию задается как:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Клиент Anthropic в OpenClaw автоматически добавляет `/v1` к базовому URL, поэтому используйте
`https://api.synthetic.new/anthropic` (а не `/anthropic/v1`). Если Synthetic
изменит свой базовый URL, переопределите `models.providers.synthetic.baseUrl`.
</Warning>

## Пример конфигурации

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

## Встроенный каталог

Все модели Synthetic используют стоимость `0` (ввод/вывод/кэш).

| ID модели                                              | Контекстное окно | Максимум токенов | Рассуждение | Ввод              |
| ------------------------------------------------------ | ---------------- | ---------------- | ----------- | ----------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000          | 65,536           | нет         | текст             |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000          | 8,192            | да          | текст             |
| `hf:zai-org/GLM-4.7`                                   | 198,000          | 128,000          | нет         | текст             |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000          | 8,192            | нет         | текст             |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000          | 8,192            | нет         | текст             |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000          | 8,192            | нет         | текст             |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000          | 8,192            | нет         | текст             |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000          | 8,192            | нет         | текст             |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000          | 8,192            | нет         | текст             |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000          | 8,192            | нет         | текст             |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000          | 8,192            | нет         | текст             |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000          | 8,192            | да          | текст + изображение |
| `hf:openai/gpt-oss-120b`                               | 128,000          | 8,192            | нет         | текст             |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000          | 8,192            | нет         | текст             |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000          | 8,192            | нет         | текст             |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000          | 8,192            | нет         | текст + изображение |
| `hf:zai-org/GLM-4.5`                                   | 128,000          | 128,000          | нет         | текст             |
| `hf:zai-org/GLM-4.6`                                   | 198,000          | 128,000          | нет         | текст             |
| `hf:zai-org/GLM-5`                                     | 256,000          | 128,000          | да          | текст + изображение |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000          | 8,192            | нет         | текст             |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000          | 8,192            | да          | текст             |

<Tip>
Ссылки на модели используют форму `synthetic/<modelId>`. Используйте
`openclaw models list --provider synthetic`, чтобы увидеть все модели, доступные в вашей
учетной записи.
</Tip>

<AccordionGroup>
  <Accordion title="Model allowlist">
    Если вы включаете список разрешенных моделей (`agents.defaults.models`), добавьте каждую
    модель Synthetic, которую планируете использовать. Модели не из списка разрешенных будут скрыты
    от агента.
  </Accordion>

  <Accordion title="Base URL override">
    Если Synthetic изменит свою конечную точку API, переопределите базовый URL в конфигурации:

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

    Помните, что OpenClaw автоматически добавляет `/v1`.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Правила поставщиков, ссылки на модели и поведение при отказе.
  </Card>
  <Card title="Configuration reference" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая настройки поставщиков.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Панель управления Synthetic и документация API.
  </Card>
</CardGroup>
