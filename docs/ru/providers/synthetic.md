---
read_when:
    - Вы хотите использовать Synthetic в качестве провайдера моделей
    - Вам необходимо настроить ключ Synthetic API или базовый URL
summary: Использование Anthropic-совместимого API Synthetic в OpenClaw
title: Синтетический
x-i18n:
    generated_at: "2026-07-12T11:49:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) предоставляет конечные точки, совместимые с Anthropic.
OpenClaw включает его как провайдера `synthetic` и использует API Anthropic
Messages.

| Свойство    | Значение                              |
| ------------ | ------------------------------------- |
| Провайдер    | `synthetic`                           |
| Авторизация  | `SYNTHETIC_API_KEY`                   |
| API          | Anthropic Messages                    |
| Базовый URL  | `https://api.synthetic.new/anthropic` |

## Начало работы

<Steps>
  <Step title="Получите ключ API">
    Получите `SYNTHETIC_API_KEY` в своей учетной записи Synthetic или позвольте процессу
    первоначальной настройки запросить его.
  </Step>
  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Проверьте модель по умолчанию">
    Первоначальная настройка устанавливает следующую модель по умолчанию:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Клиент Anthropic в OpenClaw автоматически добавляет `/v1` к базовому URL, поэтому используйте
`https://api.synthetic.new/anthropic` (а не `/anthropic/v1`). Если Synthetic
изменит базовый URL, переопределите `models.providers.synthetic.baseUrl`.
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

Для всех моделей Synthetic стоимость равна `0` (ввод/вывод/кэш).

| Идентификатор модели                                   | Окно контекста | Макс. токенов | Рассуждение | Ввод                 |
| ------------------------------------------------------ | -------------- | ------------- | ----------- | -------------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536        | нет         | текст                |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192         | да          | текст                |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000       | нет         | текст                |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192         | нет         | текст                |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192         | нет         | текст                |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192         | нет         | текст                |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192         | нет         | текст                |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192         | нет         | текст                |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192         | нет         | текст                |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192         | нет         | текст                |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192         | нет         | текст                |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192         | да          | текст + изображение  |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192         | нет         | текст                |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192         | нет         | текст                |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192         | нет         | текст                |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192         | нет         | текст + изображение  |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000       | нет         | текст                |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000       | нет         | текст                |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000       | да          | текст + изображение  |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192         | нет         | текст                |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192         | да          | текст                |

<Tip>
Ссылки на модели имеют формат `synthetic/<modelId>`. Используйте
`openclaw models list --provider synthetic`, чтобы просмотреть все модели, доступные для вашей
учетной записи.
</Tip>

<AccordionGroup>
  <Accordion title="Список разрешенных моделей">
    Если вы включили список разрешенных моделей (`agents.defaults.models`), добавьте в него все
    модели Synthetic, которые планируете использовать. Модели, отсутствующие в списке разрешенных,
    скрыты от агента.
  </Accordion>

  <Accordion title="Переопределение базового URL">
    Если Synthetic изменит конечную точку API, переопределите базовый URL:

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

    OpenClaw по-прежнему автоматически добавляет `/v1`.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Провайдеры моделей" href="/ru/concepts/model-providers" icon="layers">
    Правила провайдеров, ссылки на модели и поведение при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая настройки провайдеров.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Панель управления Synthetic и документация API.
  </Card>
</CardGroup>
