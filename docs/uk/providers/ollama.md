---
read_when:
    - Ви хочете запускати OpenClaw з хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки щодо налаштування та конфігурації Ollama
    - Ви хочете використовувати моделі Ollama з підтримкою vision для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-27T12:54:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a281eb9b7cf85705e749921f4fec7a998ea8bd186e7a95804cb307e41cd739cf
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/самостійно розгорнутих серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` з `https://ollama.com` або `Local only` через доступний хост Ollama.

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте URL OpenAI-сумісного `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклики інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації слід надавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні хости та хости LAN">
    Локальні хости Ollama та хости Ollama в LAN не потребують справжнього bearer-токена. OpenClaw використовує локальний маркер `ollama-local` лише для base URL Ollama з loopback, приватною мережею, `.local` і простими іменами хостів.
  </Accordion>
  <Accordion title="Віддалені хости та хости Ollama Cloud">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, auth profile або `apiKey` провайдера.
  </Accordion>
  <Accordion title="Власні id провайдерів">
    Власні id провайдерів, у яких задано `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, який вказує на приватний хост Ollama у LAN, може використовувати `apiKey: "ollama-local"`, і субагенти розв’язуватимуть цей маркер через хук провайдера Ollama, а не трактуватимуть його як відсутні облікові дані.
  </Accordion>
  <Accordion title="Область embedding для memory">
    Коли Ollama використовується для embedding memory, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ на рівні провайдера надсилається лише на хост Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише на його віддалений хост embedding.
    - Чисте значення змінної середовища `OLLAMA_API_KEY` вважається конвенцією Ollama Cloud і типово не надсилається на локальні або самостійно розгорнуті хости.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний спосіб налаштування і режим.

<Tabs>
  <Tab title="Onboarding (рекомендовано)">
    **Найкраще для:** найшвидшого шляху до робочого хмарного або локального налаштування Ollama.

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Виберіть режим">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує типові хмарні налаштування. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі та автоматично виконують pull вибраної локальної моделі, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, наприклад `gemma4:latest`, налаштування показує цю встановлену модель один раз замість того, щоб показувати і `gemma4`, і `gemma4:latest` або знову виконувати pull для простого псевдоніма. `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для доступу до cloud.
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Неінтерактивний режим

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    За бажанням можна вказати власний base URL або модель:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Ручне налаштування">
    **Найкраще для:** повного контролю над хмарним або локальним налаштуванням.

    <Steps>
      <Step title="Виберіть cloud або local">
        - **Cloud + Local**: встановіть Ollama, увійдіть через `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: встановіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Виконайте pull локальної моделі (лише local)">
        ```bash
        ollama pull gemma4
        # або
        ollama pull gpt-oss:20b
        # або
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте справжній `OLLAMA_API_KEY`. Для конфігурацій на базі хоста підійде будь-яке значення-заповнювач:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Або налаштуйте у своєму файлі конфігурації
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перегляньте й задайте модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або задайте типову модель у конфігурації:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Хмарні моделі

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` використовує доступний хост Ollama як контрольну точку і для локальних, і для хмарних моделей. Це рекомендований Ollama гібридний сценарій.

    Під час налаштування виберіть **Cloud + Local**. OpenClaw запитає base URL Ollama, виявить локальні моделі з цього хоста та перевірить, чи хост увійшов у cloud через `ollama signin`. Якщо хост увійшов у систему, OpenClaw також запропонує типові хмарні моделі, такі як `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо хост ще не увійшов у систему, OpenClaw залишить налаштування в режимі лише local, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Під час налаштування виберіть **Cloud only**. OpenClaw запитає `OLLAMA_API_KEY`, встановить `baseUrl: "https://ollama.com"` і заповнить список доступних хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, який показується під час `openclaw onboard`, динамічно заповнюється з `https://ollama.com/api/tags`, обмежується 500 записами, тож вибір відображає поточний розміщений каталог, а не статичний набір. Якщо `ollama.com` недоступний або під час налаштування не повертає моделі, OpenClaw повертається до попередніх жорстко закодованих підказок, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише local OpenClaw виявляє моделі у налаштованому екземплярі Ollama. Цей шлях призначений для локальних або самостійно розгорнутих серверів Ollama.

    OpenClaw наразі пропонує `gemma4` як типову локальну модель.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або auth profile) і **не** визначаєте `models.providers.ollama` чи інший власний віддалений провайдер з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка             | Деталі                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу        | Виконує запити до `/api/tags`                                                                                                                                         |
| Виявлення можливостей | Використовує best-effort запити до `/api/show`, щоб зчитувати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, зокрема vision/tools         |
| Моделі vision         | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тож OpenClaw автоматично впроваджує зображення в промпт |
| Виявлення reasoning   | Позначає `reasoning` за евристикою назви моделі (`r1`, `reasoning`, `think`)                                                                                         |
| Ліміти токенів        | Установлює `maxTokens` на типове обмеження максимальних токенів Ollama, яке використовує OpenClaw                                                                   |
| Вартість              | Установлює всі вартості в `0`                                                                                                                                         |

Це дає змогу уникнути ручних записів моделей, зберігаючи каталог узгодженим із локальним екземпляром Ollama.

```bash
# Подивіться, які моделі доступні
ollama list
openclaw models list
```

Щоб додати нову модель, просто виконайте pull через Ollama:

```bash
ollama pull mistral
```

Нова модель буде автоматично виявлена й доступна до використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama` або налаштовуєте власного віддаленого провайдера, наприклад `models.providers.ollama-cloud` з `api: "ollama"`, автовиявлення пропускається, і моделі потрібно визначати вручну. Власні loopback-провайдери, такі як `http://127.0.0.2:11434`, усе ще вважаються локальними. Див. розділ про явну конфігурацію нижче.
</Note>

## Vision і опис зображень

Вбудований плагін Ollama реєструє Ollama як провайдера розуміння медіа з підтримкою зображень. Це дає OpenClaw змогу маршрутизувати явні запити на опис зображень і налаштовані типові моделі зображень через локальні або розміщені vision-моделі Ollama.

Для локального vision виконайте pull моделі, яка підтримує зображення:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Потім перевірте через CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` має бути повним посиланням `<provider/model>`. Коли його задано, `openclaw infer image describe` запускає цю модель безпосередньо, а не пропускає опис через те, що модель підтримує нативний vision.

Щоб зробити Ollama типовою моделлю розуміння зображень для вхідних медіа, налаштуйте `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Повільним локальним vision-моделям може знадобитися довший тайм-аут розуміння зображень, ніж хмарним моделям. Вони також можуть аварійно завершуватися або зупинятися, коли Ollama намагається виділити повний оголошений контекст vision на обмеженому обладнанні. Задайте тайм-аут для можливості та обмежте `num_ctx` у записі моделі, якщо вам потрібен лише звичайний хід опису зображення:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Цей тайм-аут застосовується до вхідного розуміння зображень і до явного інструмента `image`, який агент може викликати під час ходу. `models.providers.ollama.timeoutSeconds` на рівні провайдера й надалі керує базовим захистом HTTP-запитів Ollama для звичайних викликів моделей.

Перевірте explicit image tool з локальним Ollama у live-режимі за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте vision-моделі підтримкою вхідних зображень:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, які не позначені як такі, що підтримують зображення. За неявного виявлення OpenClaw зчитує це з Ollama, коли `/api/show` повідомляє про можливість vision.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший шлях увімкнення лише локального режиму — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо задано `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, коли вам потрібне розміщене хмарне налаштування, Ollama працює на іншому хості/порту, ви хочете примусово задати конкретні вікна контексту або списки моделей, або вам потрібні повністю ручні визначення моделей.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Власний base URL">
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автовиявлення, тож моделі потрібно визначати вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 — використовуйте URL нативного API Ollama
            api: "ollama", // Явно задайте, щоб гарантувати нативну поведінку виклику інструментів
            timeoutSeconds: 300, // Необов’язково: дайте холодним локальним моделям більше часу на підключення і стримінг
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Необов’язково: тримати модель завантаженою між ходами
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Не додавайте `/v1` до URL. Шлях `/v1` використовує режим, сумісний з OpenAI, де виклик інструментів ненадійний. Використовуйте базовий URL Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

## Поширені рецепти

Використовуйте ці приклади як стартові точки й замінюйте id моделей на точні назви з `ollama list` або `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Локальна модель з автовиявленням">
    Використовуйте це, коли Ollama працює на тій самій машині, що й Gateway, і ви хочете, щоб OpenClaw автоматично виявляв встановлені моделі.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Цей шлях зберігає конфігурацію мінімальною. Не додавайте блок `models.providers.ollama`, якщо не хочете визначати моделі вручну.

  </Accordion>

  <Accordion title="Хост Ollama у LAN з ручними моделями">
    Для хостів у LAN використовуйте нативні URL Ollama. Не додавайте `/v1`.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` — це бюджет контексту на боці OpenClaw. `params.num_ctx` надсилається до Ollama для запиту. Узгоджуйте їх, коли ваше обладнання не може запустити повний заявлений контекст моделі.

  </Accordion>

  <Accordion title="Лише Ollama Cloud">
    Використовуйте це, коли ви не запускаєте локальний демон і хочете працювати безпосередньо з розміщеними моделями Ollama.

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Cloud плюс local через демон з виконаним входом">
    Використовуйте це, коли локальний демон Ollama або демон Ollama у LAN увійшов у систему через `ollama signin` і має обслуговувати і локальні моделі, і моделі `:cloud`.

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Кілька хостів Ollama">
    Використовуйте власні id провайдерів, коли у вас більше ніж один сервер Ollama. Кожен провайдер отримує власний хост, моделі, автентифікацію, тайм-аут і посилання на моделі.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    Коли OpenClaw надсилає запит, префікс активного провайдера видаляється, тож `ollama-large/qwen3.5:27b` надходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі можуть відповідати на прості промпти, але погано справляються з повною поверхнею інструментів агента. Почніть з обмеження інструментів і контексту, перш ніж змінювати глобальні параметри runtime.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер стабільно не справляється зі schema інструментів. Це обмінює можливості агента на стабільність.
    `localModelLean` прибирає інструменти browser, cron і message з поверхні агента, але не змінює контекст runtime Ollama чи режим thinking. Поєднуйте це з явними `params.num_ctx` і `params.thinking: false` для невеликих thinking-моделей у стилі Qwen, які зациклюються або витрачають бюджет відповіді на приховане reasoning.

  </Accordion>
</AccordionGroup>

### Вибір моделі

Після налаштування всі ваші моделі Ollama будуть доступні:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

Також підтримуються власні id провайдерів Ollama. Коли посилання на модель використовує префікс активного
провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw видаляє лише цей
префікс перед викликом Ollama, тож сервер отримує `qwen3:32b`.

Для повільних локальних моделей краще спочатку налаштувати параметри запитів на рівні провайдера, а не збільшувати
тайм-аут runtime всього агента:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` застосовується до HTTP-запиту моделі, включно з установленням з’єднання,
заголовками, стримінгом тіла і повним скасуванням guarded-fetch. `params.keep_alive`
пересилається до Ollama як верхньорівневий `keep_alive` у нативних запитах `/api/chat`;
задавайте його для кожної моделі, коли вузьким місцем є час завантаження на першому ході.

### Швидка перевірка

```bash
# Демон Ollama видимий цій машині
curl http://127.0.0.1:11434/api/tags

# Каталог OpenClaw і вибрана модель
openclaw models list --provider ollama
openclaw models status

# Пряма перевірка моделі
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Для віддалених хостів замініть `127.0.0.1` на хост, використаний у `baseUrl`. Якщо `curl` працює, а OpenClaw — ні, перевірте, чи Gateway не працює на іншій машині, у контейнері або під іншим службовим обліковим записом.

## Ollama Web Search

OpenClaw підтримує **Ollama Web Search** як вбудованого провайдера `web_search`.

| Властивість | Деталі                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує ваш налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` використовує розміщений API безпосередньо |
| Автентифікація | Без ключа для локальних хостів Ollama з виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів, захищених автентифікацією |
| Вимога      | Локальні/самостійно розгорнуті хости мають працювати й бути авторизованими через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` плюс справжній Ollama API key |

Виберіть **Ollama Web Search** під час `openclaw onboard` або `openclaw configure --section web`, або задайте:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Для прямого розміщеного пошуку через Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Для локального демона з виконаним входом OpenClaw використовує проксі демона `/api/experimental/web_search`. Для `https://ollama.com` він викликає розміщений ендпоїнт `/api/web_search` безпосередньо.

<Note>
Повні подробиці налаштування й поведінки див. у [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **Виклик інструментів в OpenAI-сумісному режимі ненадійний.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо вам потрібно натомість використовувати OpenAI-сумісний ендпоїнт (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // типово: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    У цьому режимі потокова передача й виклик інструментів можуть не працювати одночасно. Можливо, вам доведеться вимкнути стримінг через `params: { streaming: false }` у конфігурації моделі.

    Коли для Ollama використовується `api: "openai-completions"`, OpenClaw типово додає `options.num_ctx`, щоб Ollama непомітно не повертався до вікна контексту 4096. Якщо ваш проксі/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Вікна контексту">
    Для автоматично виявлених моделей OpenClaw використовує вікно контексту, про яке повідомляє Ollama, коли воно доступне, включно з більшими значеннями `PARAMETER num_ctx` із власних Modelfile. В іншому разі використовується типове вікно контексту Ollama, яке використовує OpenClaw.

    Ви можете задати типові значення `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера для кожної моделі цього провайдера Ollama, а потім перевизначити їх для окремих моделей за потреби. `contextWindow` — це бюджет промпта й Compaction на боці OpenClaw. Нативні запити Ollama залишають `options.num_ctx` незаданим, якщо ви явно не налаштуєте `params.num_ctx`, тож Ollama може застосувати власну модель, `OLLAMA_CONTEXT_LENGTH` або типове значення на основі VRAM. Щоб обмежити або примусово задати контекст runtime Ollama для кожного запиту без перебудови Modelfile, задайте `params.num_ctx`; некоректні, нульові, від’ємні та нескінченні значення ігноруються. OpenAI-сумісний адаптер Ollama усе ще типово додає `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це через `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Нативні записи моделей Ollama також приймають поширені параметри runtime Ollama в `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw пересилає лише ключі запиту Ollama, тож параметри runtime OpenClaw, такі як `streaming`, не витікають до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надіслати верхньорівневий `think` Ollama; `false` вимикає thinking на рівні API для thinking-моделей у стилі Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    Також працює `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над типовим значенням агента.

  </Accordion>

  <Accordion title="Керування thinking">
    Для нативних моделей Ollama OpenClaw пересилає керування thinking так, як цього очікує Ollama: верхньорівневий `think`, а не `options.think`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Ви також можете задати типове значення для моделі:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think` або `params.thinking` для окремої моделі можуть вимикати або примусово вмикати thinking API Ollama для конкретної налаштованої моделі. Команди runtime, такі як `/think off`, усе одно застосовуються до активного запуску.

  </Accordion>

  <Accordion title="Моделі reasoning">
    OpenClaw типово вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` такими, що підтримують reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безкоштовний і працює локально, тому для всіх моделей вартість встановлюється в $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Embedding для memory">
    Вбудований плагін Ollama реєструє провайдера embedding для memory
    для [пошуку в memory](/uk/concepts/memory). Він використовує налаштовані base URL
    і API key Ollama, викликає поточний ендпоїнт Ollama `/api/embed` і за
    можливості об’єднує кілька фрагментів memory в один запит `input`.

    | Властивість    | Значення            |
    | --------------- | ------------------- |
    | Типова модель   | `nomic-embed-text`  |
    | Auto-pull       | Так — модель embedding автоматично завантажується, якщо її локально немає |

    Embedding під час запиту використовують retrieval-префікси для моделей, які цього потребують або рекомендують, зокрема `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів memory залишаються сирими, тож наявні індекси не потребують міграції формату.

    Щоб вибрати Ollama як провайдера embedding для пошуку в memory:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

    Для віддаленого хоста embedding залишайте автентифікацію обмеженою цим хостом:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              model: "nomic-embed-text",
              apiKey: "ollama-local",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Конфігурація стримінгу">
    Інтеграція Ollama в OpenClaw типово використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно стримінг і виклик інструментів. Жодна спеціальна конфігурація не потрібна.

    Для нативних запитів `/api/chat` OpenClaw також безпосередньо пересилає керування thinking до Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневий `think: false`, а `/think low|medium|high` надсилають відповідний рядок зусилля верхнього рівня `think`. `/think max` відображається на найвище нативне зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісний ендпоїнт, див. розділ "Застарілий OpenAI-сумісний режим" вище. У цьому режимі стримінг і виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Цикл аварій у WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює systemd-юнит `ollama.service` із `Restart=always`. Якщо цей сервіс автоматично запускається і завантажує модель з підтримкою GPU під час завантаження WSL2, Ollama може закріплювати пам’ять хоста під час завантаження моделі. Повернення пам’яті Hyper-V не завжди може повернути ці закріплені сторінки, тож Windows може завершити роботу віртуальної машини WSL2, systemd знову запускає Ollama, і цикл повторюється.

    Типові ознаки:

    - повторні перезавантаження або завершення роботи WSL2 з боку Windows
    - високе навантаження CPU в `app.slice` або `ollama.service` незабаром після запуску WSL2
    - SIGTERM від systemd замість події Linux OOM-killer

    OpenClaw записує попередження під час запуску, коли виявляє WSL2, увімкнений `ollama.service` з `Restart=always` і видимі маркери CUDA.

    Пом’якшення:

    ```bash
    sudo systemctl disable ollama
    ```

    Додайте це до `%USERPROFILE%\.wslconfig` на боці Windows, а потім виконайте `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Задайте коротший keep-alive у середовищі сервісу Ollama або запускайте Ollama вручну лише тоді, коли він вам потрібен:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Див. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama не виявлено">
    Переконайтеся, що Ollama запущено, що ви задали `OLLAMA_API_KEY` (або auth profile), і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Переконайтеся, що API доступний:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Якщо ваша модель не відображається, або виконайте pull моделі локально, або визначте її явно в `models.providers.ollama`.

    ```bash
    ollama list  # Подивитися, що встановлено
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="У з’єднанні відмовлено">
    Перевірте, що Ollama працює на правильному порту:

    ```bash
    # Перевірити, чи запущено Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Віддалений хост працює з curl, але не з OpenClaw">
    Перевіряйте з тієї самої машини й у тому самому runtime, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Поширені причини:

    - `baseUrl` вказує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає OpenAI-сумісну поведінку замість нативної Ollama.
    - Віддаленому хосту потрібні зміни firewall або прив’язки LAN на боці Ollama.
    - Модель присутня в демоні вашого ноутбука, але відсутня у віддаленому демоні.

  </Accordion>

  <Accordion title="Модель виводить JSON інструментів як текст">
    Зазвичай це означає, що провайдер використовує OpenAI-сумісний режим або модель не може працювати зі schema інструментів.

    Надавайте перевагу нативному режиму Ollama:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Якщо невелика локальна модель усе ще не справляється зі schema інструментів, задайте `compat.supportsTools: false` у записі цієї моделі та перевірте ще раз.

  </Accordion>

  <Accordion title="Холодна локальна модель завершується за тайм-аутом">
    Великим локальним моделям може знадобитися довге початкове завантаження до початку стримінгу. Залишайте тайм-аут обмеженим провайдером Ollama й, за бажання, попросіть Ollama тримати модель завантаженою між ходами:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Якщо сам хост повільно приймає з’єднання, `timeoutSeconds` також подовжує захищений тайм-аут підключення Undici для цього провайдера.

  </Accordion>

  <Accordion title="Модель із великим контекстом працює надто повільно або вичерпує пам’ять">
    Багато моделей Ollama заявляють контексти, які перевищують можливості вашого обладнання для комфортної роботи. Нативна Ollama використовує власний типовий контекст runtime Ollama, якщо ви не задасте `params.num_ctx`. Обмежуйте і бюджет OpenClaw, і контекст запиту Ollama, коли вам потрібна передбачувана затримка до першого токена:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Спочатку зменшуйте `contextWindow`, якщо OpenClaw надсилає надто великий промпт. Зменшуйте `params.num_ctx`, якщо Ollama завантажує контекст runtime, який завеликий для цієї машини. Зменшуйте `maxTokens`, якщо генерація триває надто довго.

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Вибір моделей" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні подробиці налаштування й поведінки вебпошуку на базі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
</CardGroup>
