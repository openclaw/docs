---
read_when:
    - Ви хочете запустити OpenClaw з хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки щодо налаштування та конфігурації Ollama
    - Вам потрібні моделі бачення Ollama для розпізнавання зображень
summary: Запустіть OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-28T01:19:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80709e808ebcb694574e95a4269d29ade0532fe69f0f0386c2796871627560e6
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/самостійно розміщених серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` із `https://ollama.com` або `Local only` через доступний хост Ollama.

<Warning>
**Користувачі віддаленого Ollama**: Не використовуйте URL `/v1`, сумісний з OpenAI (`http://host:11434/v1`), з OpenClaw. Це порушує виклики інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації слід надавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні хости та хости LAN">
    Локальні хости Ollama та хости в LAN не потребують справжнього bearer-токена. OpenClaw використовує локальний маркер `ollama-local` лише для loopback, private-network, `.local` і base URL Ollama з голим ім’ям хоста.
  </Accordion>
  <Accordion title="Віддалені хости та хости Ollama Cloud">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера.
  </Accordion>
  <Accordion title="Власні ідентифікатори провайдерів">
    Власні ідентифікатори провайдерів, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, що вказує на приватний хост Ollama у LAN, може використовувати `apiKey: "ollama-local"`, і підагенти розв’язуватимуть цей маркер через хук провайдера Ollama замість того, щоб трактувати його як відсутні облікові дані.
  </Accordion>
  <Accordion title="Область дії embedding-пам’яті">
    Коли Ollama використовується для embedding-пам’яті, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ на рівні провайдера надсилається лише до хоста Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише до його віддаленого хоста embedding.
    - Чисте значення змінної середовища `OLLAMA_API_KEY` розглядається як домовленість Ollama Cloud і за замовчуванням не надсилається до локальних або self-hosted хостів.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Onboarding (рекомендовано)">
    **Найкраще для:** найшвидшого способу отримати робоче хмарне або локальне налаштування Ollama.

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Виберіть свій режим">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує типові розміщені хмарні значення за замовчуванням. `Cloud + Local` і `Local only` запитують base URL Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, наприклад `gemma4:latest`, налаштування показує цю встановлену модель один раз замість того, щоб показувати і `gemma4`, і `gemma4:latest` або знову завантажувати голий псевдонім. `Cloud + Local` також перевіряє, чи виконано вхід у cloud access на цьому хості Ollama.
      </Step>
      <Step title="Переконайтеся, що модель доступна">
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

    За бажанням укажіть власний base URL або модель:

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
      <Step title="Виберіть хмарний або локальний режим">
        - **Cloud + Local**: встановіть Ollama, увійдіть через `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: встановіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Завантажте локальну модель (лише локально)">
        ```bash
        ollama pull gemma4
        # або
        ollama pull gpt-oss:20b
        # або
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для налаштувань на основі хоста підійде будь-яке значення-заповнювач:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Або налаштуйте у своєму файлі конфігурації
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перегляньте та встановіть свою модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або встановіть значення за замовчуванням у конфігурації:

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

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує base URL Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи виконано на хості вхід для cloud access через `ollama signin`. Якщо на хості виконано вхід, OpenClaw також пропонує типові розміщені хмарні значення за замовчуванням, наприклад `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо на хості ще не виконано вхід, OpenClaw залишає налаштування лише локальним, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, встановлює `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, який показується під час `openclaw onboard`, заповнюється в реальному часі з `https://ollama.com/api/tags` і обмежується 500 записами, щоб засіб вибору відображав поточний розміщений каталог, а не статичний набір. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих пропозицій, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локального використання OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або self-hosted серверів Ollama.

    OpenClaw зараз пропонує `gemma4` як локальне значення за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` або інший власний віддалений провайдер з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка             | Докладно                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит до каталогу     | Виконує запит до `/api/tags`                                                                                                                                              |
| Виявлення можливостей | Використовує best-effort пошуки `/api/show`, щоб зчитати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` та можливості, зокрема vision/tools                  |
| Моделі vision         | Моделі з можливістю `vision`, повідомленою `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення до prompt |
| Виявлення reasoning   | Позначає `reasoning` за допомогою евристики назви моделі (`r1`, `reasoning`, `think`)                                                                                   |
| Ліміти токенів        | Встановлює `maxTokens` на типовий максимальний ліміт токенів Ollama, який використовує OpenClaw                                                                          |
| Вартість              | Встановлює всю вартість у `0`                                                                                                                                             |

Це дає змогу уникнути ручного додавання моделей, зберігаючи каталог синхронізованим із локальним екземпляром Ollama. Ви можете використовувати повний ref, наприклад `ollama/<pulled-model>:latest`, у локальному `infer model run`; OpenClaw розв’язує цю встановлену модель із живого каталогу Ollama без потреби в рукописному записі `models.json`.

```bash
# Переглянути, які моделі доступні
ollama list
openclaw models list
```

Для вузького smoke-тесту генерації тексту, який уникає повної поверхні інструментів агента,
використовуйте локальний `infer model run` з повним ref моделі Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Цей шлях усе ще використовує налаштований у OpenClaw провайдер, автентифікацію та нативний транспорт Ollama, але не запускає хід chat-agent і не завантажує контекст MCP/інструментів. Якщо це спрацьовує, а звичайні відповіді агента — ні, далі діагностуйте можливості моделі щодо prompt/інструментів агента.

Коли ви перемикаєте розмову за допомогою `/model ollama/<model>`, OpenClaw трактує це як точний вибір користувача. Якщо налаштований `baseUrl` Ollama недоступний, наступна відповідь завершується помилкою провайдера замість того, щоб мовчки відповісти з іншої налаштованої резервної моделі.

Ізольовані завдання Cron виконують одну додаткову локальну перевірку безпеки перед запуском ходу агента. Якщо вибрана модель розв’язується до локального, private-network або `.local` провайдера Ollama і `/api/tags` недоступний, OpenClaw записує цей запуск Cron як `skipped` із вибраним `ollama/<model>` у тексті помилки. Попередня перевірка кінцевої точки кешується на 5 хвилин, тому кілька завдань Cron, спрямованих на той самий зупинений демон Ollama, не запускають усі запити до моделі, що завершуються помилкою.

Виконайте live-перевірку локального текстового шляху, шляху нативного потоку та embeddings із локальним Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Щоб додати нову модель, просто завантажте її через Ollama:

```bash
ollama pull mistral
```

Нова модель буде автоматично виявлена й стане доступною для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama` або налаштовуєте власний віддалений провайдер, наприклад `models.providers.ollama-cloud`, з `api: "ollama"`, автоматичне виявлення пропускається, і ви повинні визначати моделі вручну. Власні loopback-провайдери, наприклад `http://127.0.0.2:11434`, усе одно вважаються локальними. Див. розділ явної конфігурації нижче.
</Note>

## Vision і опис зображень

Комплектний Plugin Ollama реєструє Ollama як провайдера розуміння медіа, здатного працювати із зображеннями. Це дає OpenClaw змогу маршрутизувати явні запити на опис зображень і налаштовані значення за замовчуванням для моделей зображень через локальні або розміщені vision-моделі Ollama.

Для локального vision завантажте модель, яка підтримує зображення:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Потім перевірте за допомогою CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` має бути повним ref у форматі `<provider/model>`. Коли його задано, `openclaw infer image describe` запускає цю модель безпосередньо замість того, щоб пропускати опис, оскільки модель підтримує нативне vision.

Щоб зробити Ollama моделлю розуміння зображень за замовчуванням для вхідних медіа, налаштуйте `agents.defaults.imageModel`:

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

Повільним локальним vision-моделям може знадобитися довший тайм-аут для розуміння зображень, ніж хмарним моделям. Вони також можуть аварійно завершуватися або зупинятися, коли Ollama намагається виділити весь заявлений контекст vision на обладнанні з обмеженими ресурсами. Установіть тайм-аут можливості та обмежте `num_ctx` у записі моделі, коли вам потрібен лише звичайний хід опису зображення:

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

Цей тайм-аут застосовується до розуміння вхідних зображень і до явного інструмента `image`, який агент може викликати під час ходу. `models.providers.ollama.timeoutSeconds` на рівні провайдера, як і раніше, керує базовим запобіжником HTTP-запиту Ollama для звичайних викликів моделі.

Виконайте live-перевірку явного інструмента зображення з локальним Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте vision-моделі як такі, що підтримують вхідні зображення:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, які не позначені як здатні працювати із зображеннями. За неявного виявлення OpenClaw зчитує це з Ollama, коли `/api/show` повідомляє про можливість vision.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший шлях увімкнення режиму лише локального використання — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо задано `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, коли вам потрібне розміщене хмарне налаштування, Ollama працює на іншому хості/порту, ви хочете примусово задати певні вікна контексту або списки моделей, або вам потрібні повністю ручні визначення моделей.

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
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автоматичне виявлення, тому визначайте моделі вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 — використовуйте URL нативного API Ollama
            api: "ollama", // Явно задайте, щоб гарантувати нативну поведінку виклику інструментів
            timeoutSeconds: 300, // Необов’язково: дайте холодним локальним моделям більше часу на підключення і потокову передачу
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

Використовуйте їх як стартові точки й замінюйте ідентифікатори моделей на точні назви з `ollama list` або `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Локальна модель з автоматичним виявленням">
    Використовуйте це, коли Ollama працює на тій самій машині, що й Gateway, і ви хочете, щоб OpenClaw автоматично виявляв установлені моделі.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Цей шлях зберігає мінімальну конфігурацію. Не додавайте блок `models.providers.ollama`, якщо не хочете визначати моделі вручну.

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

    `contextWindow` — це бюджет контексту на боці OpenClaw. `params.num_ctx` надсилається до Ollama для запиту. Узгоджуйте їх, коли ваше обладнання не може запускати повний заявлений контекст моделі.

  </Accordion>

  <Accordion title="Лише Ollama Cloud">
    Використовуйте це, коли ви не запускаєте локальний демон і хочете безпосередньо використовувати розміщені моделі Ollama.

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

  <Accordion title="Хмара плюс локальний режим через демон із виконаним входом">
    Використовуйте це, коли локальний демон Ollama або демон у LAN має виконаний вхід через `ollama signin` і повинен обслуговувати як локальні моделі, так і моделі `:cloud`.

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
    Використовуйте власні ідентифікатори провайдерів, коли у вас є більше ніж один сервер Ollama. Кожен провайдер отримує власний хост, моделі, автентифікацію, тайм-аут і refs моделей.

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

    Коли OpenClaw надсилає запит, префікс активного провайдера прибирається, тому `ollama-large/qwen3.5:27b` надходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі можуть відповідати на прості prompts, але їм важко працювати з повною поверхнею інструментів агента. Почніть з обмеження інструментів і контексту, перш ніж змінювати глобальні налаштування середовища виконання.

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

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер стабільно не справляється зі схемами інструментів. Це обмінює можливості агента на стабільність.
    `localModelLean` прибирає з поверхні агента інструменти браузера, Cron і повідомлень, але не змінює контекст середовища виконання Ollama чи режим thinking. Поєднуйте його з явними `params.num_ctx` і `params.thinking: false` для невеликих thinking-моделей у стилі Qwen, які зациклюються або витрачають бюджет відповіді на приховане reasoning.

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

Також підтримуються власні ідентифікатори провайдерів Ollama. Коли ref моделі використовує префікс активного
провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw прибирає лише цей
префікс перед викликом Ollama, щоб сервер отримав `qwen3:32b`.

Для повільних локальних моделей надавайте перевагу налаштуванню запитів у межах провайдера, перш ніж збільшувати
тайм-аут усього середовища виконання агента:

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

`timeoutSeconds` застосовується до HTTP-запиту моделі, зокрема до встановлення з’єднання,
заголовків, потокової передачі тіла й повного переривання guarded-fetch. `params.keep_alive`
пересилається до Ollama як `keep_alive` верхнього рівня в нативних запитах `/api/chat`;
задавайте його для кожної моделі, коли вузьким місцем є час завантаження під час першого ходу.

### Швидка перевірка

```bash
# Демон Ollama видимий для цієї машини
curl http://127.0.0.1:11434/api/tags

# Каталог OpenClaw і вибрана модель
openclaw models list --provider ollama
openclaw models status

# Прямий smoke-тест моделі
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Для віддалених хостів замініть `127.0.0.1` на хост, який використовується в `baseUrl`. Якщо `curl` працює, а OpenClaw — ні, перевірте, чи Gateway не працює на іншій машині, у контейнері або під іншим службовим обліковим записом.

## Ollama Web Search

OpenClaw підтримує **Ollama Web Search** як вбудований провайдер `web_search`.

| Властивість | Докладно                                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує ваш налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` використовує розміщений API безпосередньо |
| Автентифікація | Без ключа для локальних хостів Ollama з виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів, захищених автентифікацією |
| Вимога      | Локальні/self-hosted хости мають бути запущені й мати виконаний вхід через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` плюс справжній ключ API Ollama |

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

Для локального демона з виконаним входом OpenClaw використовує проксі `/api/experimental/web_search` цього демона. Для `https://ollama.com` він викликає розміщену кінцеву точку `/api/web_search` безпосередньо.

<Note>
Повні відомості про налаштування і поведінку див. у [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий режим сумісності з OpenAI">
    <Warning>
    **Виклик інструментів ненадійний у режимі сумісності з OpenAI.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо вам потрібно використовувати натомість кінцеву точку, сумісну з OpenAI (наприклад, за проксі, що підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Цей режим може не підтримувати одночасно потокову передачу й виклик інструментів. Можливо, вам доведеться вимкнути потокову передачу через `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням додає `options.num_ctx`, щоб Ollama мовчки не повернувся до вікна контексту 4096. Якщо ваш проксі/апстрим відхиляє невідомі поля `options`, вимкніть цю поведінку:

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
    Для автоматично виявлених моделей OpenClaw використовує вікно контексту, повідомлене Ollama, коли воно доступне, зокрема більші значення `PARAMETER num_ctx` із власних Modelfile. Інакше він повертається до типового вікна контексту Ollama, яке використовує OpenClaw.

    Ви можете задати значення `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера як типові для кожної моделі під цим провайдером Ollama, а потім за потреби перевизначити їх для окремих моделей. `contextWindow` — це бюджет prompt і Compaction у OpenClaw. Нативні запити Ollama залишають `options.num_ctx` незаданим, якщо ви явно не налаштували `params.num_ctx`, тож Ollama може застосувати власне значення моделі, `OLLAMA_CONTEXT_LENGTH` або типове значення на основі VRAM. Щоб обмежити або примусово задати контекст виконання Ollama для кожного запиту без перебудови Modelfile, задайте `params.num_ctx`; недійсні, нульові, від’ємні й нескінченні значення ігноруються. Сумісний з OpenAI адаптер Ollama усе ще за замовчуванням додає `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це через `injectNumCtxForOpenAICompat: false`, якщо ваш апстрим відхиляє `options`.

    Нативні записи моделей Ollama також приймають поширені параметри середовища виконання Ollama в `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw пересилає лише ключі запиту Ollama, тому параметри середовища виконання OpenClaw, такі як `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надіслати `think` верхнього рівня Ollama; `false` вимикає thinking на рівні API для thinking-моделей у стилі Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі теж працює. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над значенням за замовчуванням агента.

  </Accordion>

  <Accordion title="Керування thinking">
    Для нативних моделей Ollama OpenClaw пересилає керування thinking так, як цього очікує Ollama: `think` верхнього рівня, а не `options.think`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Ви також можете задати значення моделі за замовчуванням:

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

    `params.think` або `params.thinking` для окремої моделі можуть вимкнути або примусово ввімкнути thinking API Ollama для конкретної налаштованої моделі. Команди середовища виконання, такі як `/think off`, як і раніше, застосовуються до активного запуску.

  </Accordion>

  <Accordion title="Моделі reasoning">
    OpenClaw за замовчуванням трактує моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` як такі, що підтримують reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безкоштовний і працює локально, тому вартість усіх моделей задається як $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Embedding-пам’яті">
    Вбудований Plugin Ollama реєструє провайдера embedding-пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані base URL
    та ключ API Ollama, викликає поточну кінцеву точку Ollama `/api/embed` і
    за можливості об’єднує кілька фрагментів пам’яті в один запит `input`.

    | Властивість   | Значення            |
    | ------------- | ------------------- |
    | Типова модель | `nomic-embed-text`  |
    | Автозавантаження | Так — модель embedding автоматично завантажується локально, якщо її ще немає |

    Embedding під час запиту використовують префікси retrieval для моделей, які їх потребують або рекомендують, зокрема `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам’яті залишаються сирими, тому наявним індексам не потрібна міграція формату.

    Щоб вибрати Ollama як провайдера embedding для пошуку в пам’яті:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Типове значення для Ollama. Збільшіть на потужніших хостах, якщо повторна індексація надто повільна.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Для віддаленого хоста embedding залишайте автентифікацію в межах цього хоста:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Конфігурація потокової передачі">
    Інтеграція Ollama в OpenClaw за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно потокову передачу й виклик інструментів. Жодної спеціальної конфігурації не потрібно.

    Для нативних запитів `/api/chat` OpenClaw також пересилає керування thinking безпосередньо до Ollama: `/think off` і `openclaw agent --thinking off` надсилають `think: false` верхнього рівня, тоді як `/think low|medium|high` надсилають відповідний рядок effort верхнього рівня `think`. `/think max` зіставляється з найвищим нативним рівнем effort Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати кінцеву точку, сумісну з OpenAI, див. розділ "Застарілий режим сумісності з OpenAI" вище. У цьому режимі потокова передача й виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення неполадок

<AccordionGroup>
  <Accordion title="Цикл збоїв WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює юніт systemd `ollama.service` із `Restart=always`. Якщо цей сервіс автозапускається і завантажує модель із підтримкою GPU під час запуску WSL2, Ollama може фіксувати пам’ять хоста під час завантаження моделі. Механізм повернення пам’яті Hyper-V не завжди може звільнити ці зафіксовані сторінки, тому Windows може завершити роботу ВМ WSL2, systemd знову запускає Ollama — і цикл повторюється.

    Типові ознаки:

    - повторні перезавантаження або завершення роботи WSL2 з боку Windows
    - високе навантаження CPU в `app.slice` або `ollama.service` незабаром після запуску WSL2
    - SIGTERM від systemd, а не подія Linux OOM-killer

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

    Задайте коротший keep-alive у змінних середовища сервісу Ollama або запускайте Ollama вручну лише тоді, коли він вам потрібен:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Див. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama не виявлено">
    Переконайтеся, що Ollama запущено, що ви задали `OLLAMA_API_KEY` (або профіль автентифікації), і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Перевірте, що API доступний:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Якщо вашої моделі немає у списку, або завантажте її локально, або визначте її явно в `models.providers.ollama`.

    ```bash
    ollama list  # Переглянути, що встановлено
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="З’єднання відхилено">
    Перевірте, що Ollama працює на правильному порту:

    ```bash
    # Перевірити, чи запущено Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Віддалений хост працює з curl, але не з OpenClaw">
    Перевірте з тієї самої машини і в тому самому середовищі виконання, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Поширені причини:

    - `baseUrl` вказує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає сумісну з OpenAI поведінку замість нативного Ollama.
    - Віддалений хост потребує змін у firewall або прив’язці до LAN на боці Ollama.
    - Модель присутня в демоні на вашому ноутбуці, але відсутня у віддаленому демоні.

  </Accordion>

  <Accordion title="Модель виводить JSON інструментів як текст">
    Зазвичай це означає, що провайдер використовує режим сумісності з OpenAI або модель не може обробляти схеми інструментів.

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

    Якщо невелика локальна модель усе ще не справляється зі схемами інструментів, задайте `compat.supportsTools: false` для запису цієї моделі й повторіть перевірку.

  </Accordion>

  <Accordion title="Холодна локальна модель завершується за тайм-аутом">
    Великим локальним моделям може знадобитися тривале початкове завантаження перед початком потокової передачі. Залишайте тайм-аут у межах провайдера Ollama і, за бажанням, попросіть Ollama тримати модель завантаженою між ходами:

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

  <Accordion title="Модель із великим контекстом занадто повільна або не вистачає пам’яті">
    Багато моделей Ollama заявляють контексти, більші за ті, які ваше обладнання може комфортно обробляти. Нативний Ollama використовує власне типове значення контексту виконання Ollama, якщо ви не задаєте `params.num_ctx`. Обмежуйте і бюджет OpenClaw, і контекст запиту Ollama, коли вам потрібна передбачувана затримка до першого токена:

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

    Спочатку зменшуйте `contextWindow`, якщо OpenClaw надсилає занадто великий prompt. Зменшуйте `params.num_ctx`, якщо Ollama завантажує контекст виконання, занадто великий для цієї машини. Зменшуйте `maxTokens`, якщо генерація триває надто довго.

  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення неполадок](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, refs моделей і поведінки перемикання при відмові.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування і поведінку пошуку в інтернеті на основі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
</CardGroup>
