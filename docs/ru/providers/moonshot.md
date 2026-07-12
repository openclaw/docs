---
read_when:
    - Вы хотите настроить Moonshot K2 (Moonshot Open Platform) или Kimi Coding
    - Необходимо понимать различия между отдельными конечными точками, ключами и ссылками на модели
    - Вам нужна конфигурация, которую можно скопировать и вставить для любого из провайдеров
summary: Настройка Moonshot K2 и Kimi Coding (отдельные провайдеры и ключи)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T11:47:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot предоставляет API Kimi с конечными точками, совместимыми с OpenAI. Установите
моделью по умолчанию `moonshot/kimi-k2.6` для Moonshot Open Platform или
`kimi/kimi-for-coding` для Kimi Coding.

<Warning>
Moonshot и Kimi Coding — **отдельные провайдеры**, каждый из которых поставляется как отдельный внешний Plugin. Ключи не взаимозаменяемы, конечные точки различаются, как и ссылки на модели (`moonshot/...` и `kimi/...`).
</Warning>

## Встроенный каталог моделей

[//]: # "moonshot-kimi-k2-ids:start"

| Ссылка на модель                  | Название               | Рассуждение       | Входные данные    | Контекст | Макс. вывод |
| --------------------------------- | ---------------------- | ----------------- | ----------------- | -------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Нет               | текст, изображение | 262,144  | 262,144     |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Всегда включено   | текст, изображение | 262,144  | 262,144     |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Нет               | текст, изображение | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Да                | текст              | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Да                | текст              | 262,144  | 262,144     |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Нет               | текст              | 256,000  | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Оценки стоимости в каталоге основаны на опубликованных Moonshot тарифах с оплатой по мере использования: для Kimi
K2.7 Code — $0.19/MTok при попадании в кэш, $0.95/MTok за входные данные и $4.00/MTok за выходные данные; для Kimi
K2.6 — $0.16/MTok при попадании в кэш, $0.95/MTok за входные данные и $4.00/MTok за выходные данные; для Kimi K2.5
— $0.10/MTok при попадании в кэш, $0.60/MTok за входные данные и $3.00/MTok за выходные данные. Для остальных записей
каталога сохраняются заполнители с нулевой стоимостью, если вы не переопределите их в конфигурации.

Kimi K2.7 Code всегда использует встроенный режим рассуждения. Для этой модели OpenClaw предоставляет только состояние `on`
и не отправляет поля `thinking` и
`reasoning_effort`, как того требует Moonshot. Также не отправляются переопределения
параметров выборки (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`), поскольку для K2.7 они зафиксированы на значениях провайдера по умолчанию. Kimi K2.6 остаётся
моделью по умолчанию при первоначальной настройке.

## Начало работы

Moonshot и Kimi Coding являются внешними плагинами — установите нужный перед
первоначальной настройкой.

<Tabs>
  <Tab title="API Moonshot">
    **Лучше всего подходит для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Установите Plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Выберите регион конечной точки">
        | Вариант аутентификации | Конечная точка                 | Регион          |
        | ---------------------- | ------------------------------ | --------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Международный   |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Китай           |
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
      <Step title="Убедитесь, что модели доступны">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Выполните оперативную быструю проверку">
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
        `model: "kimi-k2.6"`. Запись ответа ассистента в стенограмме сохраняет нормализованные
        данные об использовании токенов и оценочную стоимость в `usage.cost`, если Moonshot возвращает
        метаданные об использовании.
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
    **Лучше всего подходит для:** задач, ориентированных на работу с кодом, через конечную точку Kimi Coding.

    <Note>
    Kimi Coding использует другой ключ API и другой префикс провайдера (`kimi/...`), чем Moonshot (`moonshot/...`). Стабильная ссылка на модель — `kimi/kimi-for-coding`; устаревшие ссылки `kimi/kimi-code` и `kimi/k2p5` по-прежнему принимаются и нормализуются до этого идентификатора модели.
    </Note>

    <Steps>
      <Step title="Установите Plugin">
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
      <Step title="Убедитесь, что модель доступна">
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

Plugin Moonshot также регистрирует **Kimi** как провайдера `web_search`, работающего на основе веб-поиска Moonshot.

<Steps>
  <Step title="Запустите интерактивную настройку веб-поиска">
    ```bash
    openclaw configure --section web
    ```

    Выберите **Kimi** в разделе веб-поиска, чтобы сохранить
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Настройте регион и модель веб-поиска">
    Во время интерактивной настройки предлагается указать:

    | Параметр            | Варианты                                                              |
    | ------------------- | --------------------------------------------------------------------- |
    | Регион API          | `https://api.moonshot.ai/v1` (международный) или `https://api.moonshot.cn/v1` (Китай) |
    | Модель веб-поиска   | По умолчанию `kimi-k2.6`                                              |

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
    не передавали поле `thinking` для этой модели, поэтому OpenClaw предоставляет только `on` и
    игнорирует устаревшие настройки `off`. Для K2.7 также зафиксированы `temperature`, `top_p`, `n`,
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

    OpenClaw сопоставляет уровни `/think` во время выполнения для этих моделей:

    | Уровень `/think`        | Поведение Moonshot          |
    | ---------------------- | --------------------------- |
    | `/think off`           | `thinking.type=disabled`    |
    | Любой уровень, кроме off | `thinking.type=enabled`   |

    <Warning>
    Когда режим рассуждения Moonshot включён, `tool_choice` должен иметь значение `auto` или `none`. Закреплённый выбор инструмента (`type: "tool"` или `type: "function"`) вместо этого принудительно возвращает режим рассуждения в состояние `disabled`, чтобы запрошенный инструмент всё равно был запущен; значение `tool_choice: "required"` вместо этого нормализуется до `auto`. Это относится ко всем моделям Moonshot, кроме Kimi K2.7 Code, режим рассуждения которой нельзя отключить: при несовместимости её `tool_choice` нормализуется до `auto`.
    </Warning>

    Kimi K2.6 также принимает необязательное поле `thinking.keep`, которое управляет
    сохранением `reasoning_content` между несколькими ходами. Установите для него значение `"all"`, чтобы сохранять
    полный ход рассуждений между ходами; не указывайте его (или оставьте значение `null`), чтобы использовать
    стратегию сервера по умолчанию. OpenClaw передает `thinking.keep` только для
    `moonshot/kimi-k2.6` и удаляет его для других моделей. Kimi K2.7 Code
    по умолчанию сохраняет полную историю рассуждений, а OpenClaw полностью
    исключает поле `thinking`.

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

  <Accordion title="Нормализация идентификаторов вызовов инструментов">
    Moonshot Kimi возвращает собственные идентификаторы tool_call в формате `functions.<name>:<index>`. OpenClaw сохраняет первое вхождение каждого собственного идентификатора Kimi, а последующие дубликаты заменяет детерминированными идентификаторами `call_*` в стиле OpenAI. Соответствующим результатам инструментов назначаются те же идентификаторы, поэтому при повторном воспроизведении они остаются уникальными, а первый собственный идентификатор Kimi сохраняется. Это поведение встроено в поставляемый Plugin Moonshot и не настраивается пользователем.
  </Accordion>

  <Accordion title="Совместимость потоковой передачи данных об использовании">
    Собственные конечные точки Moonshot (`https://api.moonshot.ai/v1` и
    `https://api.moonshot.cn/v1`) заявляют о совместимости с потоковой передачей данных об использовании.
    OpenClaw определяет ее по узлу конечной точки, а не по идентификатору провайдера, поэтому пользовательский
    идентификатор провайдера, указывающий на тот же собственный узел Moonshot, наследует такое же
    поведение потоковой передачи данных об использовании.

    При использовании цен K2.6 из каталога потоковые данные об использовании, включающие входные, выходные
    и считанные из кеша токены, также преобразуются в локальную оценочную стоимость в долларах США для
    `/status`, `/usage full`, `/usage cost` и учета сеансов
    на основе расшифровок.

  </Accordion>

  <Accordion title="Справочник конечных точек и ссылок на модели">
    | Провайдер  | Префикс ссылки на модель | Конечная точка                 | Переменная окружения для аутентификации |
    | ---------- | ------------------------ | ------------------------------ | --------------------------------------- |
    | Moonshot   | `moonshot/`              | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`                      |
    | Moonshot CN| `moonshot/`              | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`                      |
    | Kimi Coding| `kimi/`                  | Конечная точка Kimi Coding     | `KIMI_API_KEY`                          |
    | Веб-поиск  | Н/Д                      | Соответствует региону Moonshot API | `KIMI_API_KEY` или `MOONSHOT_API_KEY` |

    - Веб-поиск Kimi использует `KIMI_API_KEY` или `MOONSHOT_API_KEY`; по умолчанию применяется `https://api.moonshot.ai/v1` с моделью `kimi-k2.6`.
    - При необходимости переопределите цены и метаданные контекста в `models.providers`.
    - Если Moonshot публикует другие ограничения контекста для модели, соответствующим образом скорректируйте `contextWindow`.

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
    Управление ключами Moonshot API и документация.
  </Card>
</CardGroup>
