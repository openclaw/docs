---
read_when:
    - Вам нужна настройка Moonshot K2 (Moonshot Open Platform) или Kimi Coding
    - Необходимо различать отдельные конечные точки, ключи и ссылки на модели
    - Вам нужна готовая конфигурация для копирования и вставки для любого из провайдеров
summary: Настройка Moonshot K2 и Kimi Coding (отдельные провайдеры и ключи)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-13T20:13:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot предоставляет API Kimi с конечными точками, совместимыми с OpenAI. Установите
модель по умолчанию на `moonshot/kimi-k2.6` для Moonshot Open Platform или
`kimi/kimi-for-coding` для Kimi Coding.

<Warning>
Moonshot и Kimi Coding — **разные провайдеры**, каждый из которых поставляется как отдельный внешний плагин. Ключи не взаимозаменяемы, конечные точки различаются, как и ссылки на модели (`moonshot/...` и `kimi/...`).
</Warning>

## Встроенный каталог моделей

[//]: # "moonshot-kimi-k2-ids:start"

| Ссылка на модель                  | Название               | Рассуждение | Входные данные | Контекст | Макс. вывод |
| --------------------------------- | ---------------------- | ----------- | -------------- | -------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Нет         | текст, изображение | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Всегда включено | текст, изображение | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Нет         | текст, изображение | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Да          | текст           | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Да          | текст           | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Нет         | текст           | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Оценки стоимости в каталоге используют опубликованные Moonshot тарифы с оплатой по мере использования: для Kimi
K2.7 Code — $0.19/MTok при попадании в кэш, $0.95/MTok за входные данные и $4.00/MTok за вывод; для Kimi
K2.6 — $0.16/MTok при попадании в кэш, $0.95/MTok за входные данные и $4.00/MTok за вывод; для Kimi K2.5
— $0.10/MTok при попадании в кэш, $0.60/MTok за входные данные и $3.00/MTok за вывод. Для остальных
записей каталога сохраняются заполнители с нулевой стоимостью, если вы не переопределите их в конфигурации.

Kimi K2.7 Code всегда использует встроенный режим рассуждения. OpenClaw предоставляет для этой модели только состояние
`on` и не отправляет поля `thinking` и
`reasoning_effort`, как требует Moonshot. Также не отправляются переопределения
параметров выборки (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`), поскольку K2.7 фиксирует их на значениях провайдера по умолчанию. Kimi K2.6 остаётся
моделью по умолчанию при первоначальной настройке.

## Начало работы

Moonshot и Kimi Coding поставляются как внешние плагины — установите нужный плагин перед
первоначальной настройкой.

<Tabs>
  <Tab title="API Moonshot">
    **Лучше всего подходит для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Установите плагин">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Выберите регион конечной точки">
        | Вариант аутентификации | Конечная точка                 | Регион        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Международный |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Китай         |
      </Step>
      <Step title="Запустите первоначальную настройку">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Для конечной точки в Китае:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Установите модель по умолчанию">
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
      <Step title="Проверьте доступность моделей">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Выполните оперативную дымовую проверку">
        Используйте изолированный каталог состояния, если хотите проверить доступ к модели и
        учёт стоимости, не затрагивая обычные сеансы:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        В ответе JSON должны быть указаны `provider: "moonshot"` и
        `model: "kimi-k2.6"`. Если Moonshot возвращает метаданные об использовании,
        запись расшифровки ответа ассистента сохраняет нормализованное использование
        токенов и оценочную стоимость в `usage.cost`.
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
    **Лучше всего подходит для:** задач, связанных с кодом, через конечную точку Kimi Coding.

    <Note>
    Kimi Coding использует другой ключ API и префикс провайдера (`kimi/...`), чем Moonshot (`moonshot/...`). Стабильная ссылка на модель — `kimi/kimi-for-coding`; устаревшие ссылки `kimi/kimi-code` и `kimi/k2p5` по-прежнему принимаются и нормализуются в этот идентификатор модели.
    </Note>

    <Steps>
      <Step title="Установите плагин">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Запустите первоначальную настройку">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Установите модель по умолчанию">
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
      <Step title="Проверьте доступность модели">
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

Плагин Moonshot также регистрирует **Kimi** как провайдера `web_search`, работающего на базе веб-поиска Moonshot.

<Steps>
  <Step title="Запустите интерактивную настройку веб-поиска">
    ```bash
    openclaw configure --section web
    ```

    Выберите **Kimi** в разделе веб-поиска, чтобы сохранить
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Настройте регион и модель веб-поиска">
    Интерактивная настройка запрашивает следующие параметры:

    | Параметр            | Варианты                                                             |
    | ------------------- | -------------------------------------------------------------------- |
    | Регион API          | `https://api.moonshot.ai/v1` (международный) или `https://api.moonshot.cn/v1` (Китай) |
    | Модель веб-поиска   | По умолчанию `kimi-k2.6`                                      |

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
  <Accordion title="Встроенный режим рассуждения">
    Kimi K2.7 Code всегда использует встроенный режим рассуждения. Moonshot требует, чтобы клиенты
    не отправляли поле `thinking` для этой модели, поэтому OpenClaw предоставляет только `on` и
    игнорирует устаревшие настройки `off`. K2.7 также фиксирует `temperature`, `top_p`, `n`,
    `presence_penalty` и `frequency_penalty`; OpenClaw не отправляет настроенные
    переопределения этих полей.

    Другие модели Moonshot Kimi поддерживают двоичный встроенный режим рассуждения:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Настройте его отдельно для каждой модели через `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw сопоставляет уровни `/think` среды выполнения для этих моделей:

    | Уровень `/think` | Поведение Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Любой уровень, кроме off | `thinking.type=enabled`    |

    <Warning>
    Когда режим рассуждения Moonshot включён, `tool_choice` должен иметь значение `auto` или `none`. Закреплённый выбор инструмента (`type: "tool"` или `type: "function"`) вместо этого принудительно возвращает режим рассуждения к `disabled`, чтобы запрошенный инструмент всё же был выполнен; `tool_choice: "required"` вместо этого нормализуется в `auto`. Это относится ко всем моделям Moonshot, кроме Kimi K2.7 Code, режим рассуждения которой нельзя отключить: при несовместимости её `tool_choice` нормализуется в `auto`.
    </Warning>

    Kimi K2.6 также принимает необязательное поле `thinking.keep`, которое управляет
    сохранением `reasoning_content` между несколькими ходами. Установите значение `"all"`, чтобы сохранять полную
    цепочку рассуждений между ходами; не указывайте его (или оставьте значение `null`), чтобы использовать
    стратегию сервера по умолчанию. OpenClaw передаёт `thinking.keep` только для
    `moonshot/kimi-k2.6` и удаляет его для других моделей. Kimi K2.7 Code
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

  <Accordion title="Санитизация идентификаторов вызовов инструментов">
    Moonshot Kimi предоставляет нативные идентификаторы tool_call вида `functions.<name>:<index>`. OpenClaw сохраняет первое вхождение каждого нативного идентификатора Kimi, а последующие дубликаты преобразует в детерминированные идентификаторы `call_*` в стиле OpenAI. Соответствующие результаты инструментов переназначаются на тот же идентификатор, поэтому при повторном воспроизведении сохраняется уникальность без удаления первого нативного идентификатора Kimi. Это поведение встроено в поставляемый в комплекте провайдер Moonshot и не настраивается пользователем.
  </Accordion>

  <Accordion title="Совместимость использования при потоковой передаче">
    Нативные конечные точки Moonshot (`https://api.moonshot.ai/v1` и
    `https://api.moonshot.cn/v1`) заявляют о совместимости учёта использования при потоковой передаче.
    OpenClaw определяет это по хосту конечной точки, а не по идентификатору провайдера, поэтому пользовательский
    идентификатор провайдера, указывающий на тот же нативный хост Moonshot, наследует такое же
    поведение учёта использования при потоковой передаче.

    При использовании каталожных тарифов K2.6 данные потокового использования, включающие входные, выходные
    и прочитанные из кеша токены, также преобразуются в локальную оценочную стоимость в долларах США для
    `/status`, `/usage full`, `/usage cost` и учёта сеансов
    на основе транскриптов.

  </Accordion>

  <Accordion title="Справочник конечных точек и ссылок на модели">
    | Провайдер   | Префикс ссылки на модель | Конечная точка                      | Переменная окружения аутентификации        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Конечная точка Kimi Coding           | `KIMI_API_KEY`      |
    | Веб-поиск | Н/Д              | Совпадает с регионом API Moonshot    | `KIMI_API_KEY` или `MOONSHOT_API_KEY` |

    - Веб-поиск Kimi использует `KIMI_API_KEY` или `MOONSHOT_API_KEY`, а по умолчанию — `https://api.moonshot.ai/v1` с моделью `kimi-k2.6`.
    - При необходимости переопределите сведения о ценах и контексте в `models.providers`.
    - Если Moonshot опубликует другие ограничения контекста для модели, соответствующим образом скорректируйте `contextWindow`.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Веб-поиск" href="/ru/tools/web" icon="magnifying-glass">
    Настройка провайдеров веб-поиска, включая Kimi.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации провайдеров, моделей и плагинов.
  </Card>
  <Card title="Открытая платформа Moonshot" href="https://platform.moonshot.ai" icon="globe">
    Управление ключами API Moonshot и документация.
  </Card>
</CardGroup>
