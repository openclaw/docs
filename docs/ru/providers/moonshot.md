---
read_when:
    - Вам нужна настройка Moonshot K2 (Moonshot Open Platform), а не Kimi Coding
    - Вам нужно понимать отдельные конечные точки, ключи и ссылки на модели
    - Вам нужна конфигурация для копирования и вставки для любого из двух провайдеров
summary: Настройка Moonshot K2 и Kimi Coding (отдельные провайдеры и ключи)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-28T23:38:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot предоставляет Kimi API с OpenAI-совместимыми конечными точками. Настройте
провайдер и задайте модель по умолчанию `moonshot/kimi-k2.6` либо используйте
Kimi Coding с `kimi/kimi-for-coding`.

<Warning>
Moonshot и Kimi Coding — это **отдельные провайдеры**. Ключи не взаимозаменяемы, конечные точки различаются, а ссылки на модели отличаются (`moonshot/...` и `kimi/...`).
</Warning>

## Встроенный каталог моделей

[//]: # "moonshot-kimi-k2-ids:start"

| Ссылка на модель                  | Название               | Рассуждение       | Ввод                | Контекст | Макс. вывод |
| --------------------------------- | ---------------------- | ----------------- | ------------------- | -------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Нет               | текст, изображение  | 262,144  | 262,144     |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Всегда включено   | текст, изображение  | 262,144  | 262,144     |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Нет               | текст, изображение  | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Да                | текст               | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Да                | текст               | 262,144  | 262,144     |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Нет               | текст               | 256,000  | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Оценки стоимости в каталоге для текущих моделей K2, размещенных у Moonshot, используют
опубликованные Moonshot тарифы с оплатой по мере использования: Kimi K2.7 Code — $0.19/MTok при попадании в кэш,
$0.95/MTok за ввод и $4.00/MTok за вывод; Kimi K2.6 — $0.16/MTok при попадании в кэш,
$0.95/MTok за ввод и $4.00/MTok за вывод; Kimi K2.5 — $0.10/MTok при попадании в кэш,
$0.60/MTok за ввод и $3.00/MTok за вывод. Другие устаревшие записи каталога сохраняют
заполнители с нулевой стоимостью, если вы не переопределите их в конфигурации.

Kimi K2.7 Code всегда использует встроенное мышление. OpenClaw предоставляет только состояние мышления `on`
для этой модели и опускает исходящие элементы управления `thinking` и
`reasoning_effort`, как того требует Moonshot. OpenClaw также опускает
переопределения сэмплирования, которые K2.7 фиксирует на значениях провайдера по умолчанию. Kimi K2.6 остается
моделью по умолчанию при первоначальной настройке.

## Начало работы

Выберите провайдера и выполните шаги настройки.

<Tabs>
  <Tab title="Moonshot API">
    **Лучше всего подходит для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | Выбор аутентификации | Конечная точка                 | Регион |
        | -------------------- | ------------------------------ | ------ |
        | `moonshot-api-key`   | `https://api.moonshot.ai/v1`   | Международный |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`  | Китай  |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Или для конечной точки в Китае:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        Используйте изолированный каталог состояния, когда нужно проверить доступ к модели и отслеживание стоимости
        без изменения ваших обычных сессий:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON-ответ должен сообщить `provider: "moonshot"` и
        `model: "kimi-k2.6"`. Запись транскрипта ассистента сохраняет нормализованное
        использование токенов и оценочную стоимость в `usage.cost`, когда Moonshot возвращает
        метаданные использования.
      </Step>
    </Steps>

    ### Пример конфигурации

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    Установите официальный Plugin, затем перезапустите Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Лучше всего подходит для:** задач, ориентированных на код, через конечную точку Kimi Coding.

    <Note>
    Kimi Coding использует другой ключ API и префикс провайдера (`kimi/...`), чем Moonshot (`moonshot/...`). Стабильная ссылка на модель API — `kimi/kimi-for-coding`; устаревшие ссылки `kimi/kimi-code` и `kimi/k2p5` по-прежнему принимаются и нормализуются к этому идентификатору модели API.
    </Note>

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Пример конфигурации

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Веб-поиск Kimi

Plugin Moonshot также регистрирует **Kimi** как провайдера `web_search` на базе веб-поиска Moonshot.

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    Выберите **Kimi** в разделе веб-поиска, чтобы сохранить
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure the web search region and model">
    Интерактивная настройка запрашивает:

    | Настройка           | Варианты                                                             |
    | ------------------- | -------------------------------------------------------------------- |
    | Регион API          | `https://api.moonshot.ai/v1` (международный) или `https://api.moonshot.cn/v1` (Китай) |
    | Модель веб-поиска   | По умолчанию `kimi-k2.6`                                             |

  </Step>
</Steps>

Конфигурация находится в `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Native thinking mode">
    Kimi K2.7 Code всегда использует встроенное мышление. Moonshot требует, чтобы клиенты
    опускали поле `thinking` для этой модели, поэтому OpenClaw предоставляет только `on` и
    игнорирует устаревшие настройки `off`. K2.7 также фиксирует `temperature`, `top_p`, `n`,
    `presence_penalty` и `frequency_penalty`; OpenClaw опускает настроенные
    переопределения для этих полей.

    Другие модели Moonshot Kimi поддерживают бинарное встроенное мышление:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Настройте его для каждой модели через `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw сопоставляет уровни `/think` во время выполнения для этих моделей:

    | Уровень `/think`    | Поведение Moonshot        |
    | ------------------- | ------------------------- |
    | `/think off`        | `thinking.type=disabled`  |
    | Любой уровень не off | `thinking.type=enabled`   |

    <Warning>
    Когда мышление Moonshot включено, `tool_choice` должен быть `auto` или `none`. OpenClaw нормализует несовместимые значения в `auto`. Это включает Kimi K2.7 Code, режим мышления которого нельзя отключить, чтобы сохранить закрепленный выбор инструмента.
    </Warning>

    Kimi K2.6 также принимает необязательное поле `thinking.keep`, которое управляет
    многоходовым сохранением `reasoning_content`. Установите для него значение `"all"`, чтобы сохранять полное
    рассуждение между ходами; опустите его (или оставьте `null`), чтобы использовать
    серверную стратегию по умолчанию. OpenClaw передает `thinking.keep` только для
    `moonshot/kimi-k2.6` и удаляет его из других моделей. Kimi K2.7 Code
    по умолчанию сохраняет полную историю рассуждений, а OpenClaw полностью опускает
    поле `thinking`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Очистка id вызовов инструментов">
    Moonshot Kimi отдает нативные tool_call ids вида `functions.<name>:<index>`. Для транспорта OpenAI-completions OpenClaw сохраняет первое появление каждого нативного id Kimi и переписывает последующие дубликаты в детерминированные id в стиле OpenAI `call_*`. Соответствующие результаты инструментов сопоставляются с тем же id, поэтому воспроизведение остается уникальным без удаления первого нативного id Kimi.

    Чтобы принудительно включить строгую очистку для пользовательского OpenAI-совместимого провайдера, задайте `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Совместимость потоковой передачи использования">
    Нативные конечные точки Moonshot (`https://api.moonshot.ai/v1` и
    `https://api.moonshot.cn/v1`) объявляют совместимость потоковой передачи использования на
    общем транспорте `openai-completions`. OpenClaw определяет это по возможностям
    конечной точки, поэтому совместимые пользовательские id провайдеров, нацеленные на те же нативные
    хосты Moonshot, наследуют то же поведение streaming-usage.

    При каталожной цене K2.6 потоковые данные использования, которые включают входные, выходные
    и cache-read токены, также преобразуются в локальную расчетную стоимость в USD для
    `/status`, `/usage full`, `/usage cost` и учета сессий
    на основе транскриптов.

  </Accordion>

  <Accordion title="Справочник конечных точек и ссылок на модели">
    | Провайдер | Префикс ссылки на модель | Конечная точка | Переменная окружения для авторизации |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Конечная точка Kimi Coding    | `KIMI_API_KEY`      |
    | Веб-поиск | N/A              | Та же, что и регион Moonshot API | `KIMI_API_KEY` или `MOONSHOT_API_KEY` |

    - Веб-поиск Kimi использует `KIMI_API_KEY` или `MOONSHOT_API_KEY` и по умолчанию обращается к `https://api.moonshot.ai/v1` с моделью `kimi-k2.6`.
    - При необходимости переопределите цены и метаданные контекста в `models.providers`.
    - Если Moonshot публикует другие ограничения контекста для модели, соответствующим образом скорректируйте `contextWindow`.

  </Accordion>
</AccordionGroup>

## Связанное

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Веб-поиск" href="/ru/tools/web" icon="magnifying-glass">
    Настройка провайдеров веб-поиска, включая Kimi.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации для провайдеров, моделей и plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Управление ключами Moonshot API и документация.
  </Card>
</CardGroup>
