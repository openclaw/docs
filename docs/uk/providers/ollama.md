---
read_when:
    - Ви хочете запустити OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки з налаштування та конфігурації Ollama
    - Ви хочете використовувати візійні моделі Ollama для розуміння зображень
summary: Запустіть OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-27T22:38:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80cde6774a3e62a2ab4f0c41480e94d3af8f8980b21e4a29280f99ea1c2f6fb0
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/self-hosted серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` проти `https://ollama.com` або `Local only` проти доступного хоста Ollama.

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте OpenAI-сумісний URL `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклик інструментів, і моделі можуть виводити необроблений JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації слід надавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні хости та хости локальної мережі">
    Локальні хости Ollama та хости локальної мережі не потребують справжнього bearer token. OpenClaw використовує маркер `ollama-local` лише для loopback, private-network, `.local` і URL Ollama з bare hostname.
  </Accordion>
  <Accordion title="Віддалені хости та хости Ollama Cloud">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжні облікові дані через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера.
  </Accordion>
  <Accordion title="Власні ідентифікатори провайдерів">
    Власні ідентифікатори провайдерів, які встановлюють `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, який вказує на приватний хост Ollama у локальній мережі, може використовувати `apiKey: "ollama-local"`, і субагенти розв’яжуть цей маркер через хук провайдера Ollama, а не трактуватимуть його як відсутні облікові дані.
  </Accordion>
  <Accordion title="Область embeddings пам’яті">
    Коли Ollama використовується для embeddings пам’яті, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ на рівні провайдера надсилається лише на хост Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише на його віддалений embedding-хост.
    - Чисте значення env `OLLAMA_API_KEY` вважається угодою Ollama Cloud і за замовчуванням не надсилається на локальні або self-hosted хости.

  </Accordion>
</AccordionGroup>

## Початок роботи

Оберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Onboarding (рекомендовано)">
    **Найкраще для:** найшвидшого шляху до робочого налаштування Ollama Cloud або локального Ollama.

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Оберіть свій режим">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує стандартні хмарні значення за замовчуванням. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, наприклад `gemma4:latest`, налаштування показує цю встановлену модель один раз замість того, щоб показувати і `gemma4`, і `gemma4:latest` або знову завантажувати псевдонім без тега. `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для доступу до хмари.
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

    За бажанням вкажіть власний базовий URL або модель:

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
      <Step title="Оберіть хмарний або локальний режим">
        - **Cloud + Local**: установіть Ollama, увійдіть через `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: установіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Завантажте локальну модель (лише local only)">
        ```bash
        ollama pull gemma4
        # або
        ollama pull gpt-oss:20b
        # або
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для конфігурацій, що працюють через хост, підійде будь-яке значення-заповнювач:

        ```bash
        # Хмара
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Лише локально
        export OLLAMA_API_KEY="ollama-local"

        # Або налаштуйте у своєму файлі конфігурації
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перегляньте й установіть свою модель">
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
    `Cloud + Local` використовує доступний хост Ollama як точку керування як для локальних, так і для хмарних моделей. Це бажаний гібридний сценарій Ollama.

    Під час налаштування використовуйте **Cloud + Local**. OpenClaw запитує базовий URL Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи хост увійшов у систему для доступу до хмари через `ollama signin`. Якщо хост увійшов у систему, OpenClaw також пропонує розміщені хмарні значення за замовчуванням, такі як `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо хост іще не увійшов у систему, OpenClaw зберігає налаштування лише локальним, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює через розміщений API Ollama за адресою `https://ollama.com`.

    Під час налаштування використовуйте **Cloud only**. OpenClaw запитує `OLLAMA_API_KEY`, установлює `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється в реальному часі з `https://ollama.com/api/tags`, з обмеженням до 500 записів, тому вибір відображає поточний розміщений каталог, а не статичний початковий список. Якщо `ollama.com` недоступний або під час налаштування не повертає моделей, OpenClaw повертається до попередніх жорстко закодованих пропозицій, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локального використання OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або self-hosted серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як локальне значення за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви встановлюєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` або інший власний віддалений провайдер з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Деталі                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит до каталогу    | Виконує запити до `/api/tags`                                                                                                                                         |
| Виявлення можливостей | Використовує best-effort пошуки `/api/show`, щоб прочитати `contextWindow`, розширені параметри Modelfile `num_ctx` і можливості, зокрема vision/tools             |
| Візійні моделі       | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення до prompt |
| Виявлення reasoning  | Позначає `reasoning` за допомогою евристики назви моделі (`r1`, `reasoning`, `think`)                                                                               |
| Ліміти токенів       | Установлює `maxTokens` на стандартне обмеження максимальних токенів Ollama, яке використовує OpenClaw                                                               |
| Вартість             | Установлює всі вартості в `0`                                                                                                                                         |

Це дає змогу уникнути ручного додавання моделей, водночас зберігаючи каталог узгодженим із локальним екземпляром Ollama. Ви можете використовувати повне посилання, наприклад `ollama/<pulled-model>:latest`, у локальному `infer model run`; OpenClaw розв’язує цю встановлену модель із живого каталогу Ollama без потреби в рукописному записі `models.json`.

```bash
# Переглянути доступні моделі
ollama list
openclaw models list
```

Для вузької smoke-перевірки генерації тексту, яка уникає повної поверхні інструментів агента,
використовуйте локальний `infer model run` із повним посиланням на модель Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Цей шлях і далі використовує налаштований у OpenClaw провайдер, автентифікацію та нативний транспорт Ollama, але не запускає хід chat-agent і не завантажує контекст MCP/інструментів. Якщо це працює, а звичайні відповіді агента — ні, далі усувайте несправності можливостей моделі щодо агентних prompt/інструментів.

Коли ви перемикаєте розмову через `/model ollama/<model>`, OpenClaw трактує це як точний вибір користувача. Якщо налаштований `baseUrl` Ollama недоступний, наступна відповідь завершується помилкою провайдера замість того, щоб мовчки відповідати з іншої налаштованої резервної моделі.

Щоб виконати живу перевірку локального текстового шляху, нативного stream-шляху й embeddings
проти локального Ollama, використайте:

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
Якщо ви явно встановлюєте `models.providers.ollama` або налаштовуєте власний віддалений провайдер, наприклад `models.providers.ollama-cloud`, з `api: "ollama"`, автоматичне виявлення пропускається, і вам потрібно визначати моделі вручну. Власні loopback-провайдери, як-от `http://127.0.0.2:11434`, усе одно вважаються локальними. Див. розділ явної конфігурації нижче.
</Note>

## Vision і опис зображень

Убудований Plugin Ollama реєструє Ollama як провайдера розуміння медіа, що підтримує зображення. Це дозволяє OpenClaw маршрутизувати явні запити на опис зображень і налаштовані значення image-model за замовчуванням через локальні або розміщені візійні моделі Ollama.

Для локального vision завантажте модель, яка підтримує зображення:

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

`--model` має бути повним посиланням у форматі `<provider/model>`. Коли його встановлено, `openclaw infer image describe` запускає цю модель безпосередньо замість того, щоб пропускати опис, оскільки модель підтримує нативне vision.

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

Повільним локальним vision-моделям може знадобитися довший тайм-аут на розуміння зображень, ніж хмарним моделям. Вони також можуть аварійно завершуватися або зупинятися, коли Ollama намагається виділити весь заявлений vision-контекст на обладнанні з обмеженими ресурсами. Установіть тайм-аут для цієї можливості й обмежте `num_ctx` у записі моделі, коли вам потрібен лише звичайний хід опису зображення:

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

Цей тайм-аут застосовується до вхідного розуміння зображень і до явного інструмента `image`, який агент може викликати під час ходу. `models.providers.ollama.timeoutSeconds` на рівні провайдера, як і раніше, керує базовим захистом HTTP-запиту Ollama для звичайних викликів моделі.

Щоб виконати живу перевірку явного інструмента зображень проти локального Ollama, використайте:

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

OpenClaw відхиляє запити на опис зображень для моделей, які не позначені як здатні працювати із зображеннями. За неявного виявлення OpenClaw читає це з Ollama, коли `/api/show` повідомляє про можливість vision.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший шлях увімкнення режиму лише локального використання — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо `OLLAMA_API_KEY` встановлено, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, коли вам потрібне розміщене хмарне налаштування, Ollama працює на іншому хості/порту, ви хочете примусово встановити певні вікна контексту або списки моделей, або вам потрібні повністю ручні визначення моделей.

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

  <Tab title="Власний базовий URL">
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автоматичне виявлення, тому визначайте моделі вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 — використовуйте URL нативного API Ollama
            api: "ollama", // Укажіть явно, щоб гарантувати нативну поведінку виклику інструментів
            timeoutSeconds: 300, // Необов’язково: дайте холодним локальним моделям більше часу на підключення й stream
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
    Не додавайте `/v1` до URL. Шлях `/v1` використовує OpenAI-сумісний режим, у якому виклик інструментів ненадійний. Використовуйте базовий URL Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

## Поширені рецепти

Використовуйте їх як відправні точки й замінюйте ідентифікатори моделей на точні назви з `ollama list` або `openclaw models list --provider ollama`.

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

    Цей шлях зберігає конфігурацію мінімальною. Не додавайте блок `models.providers.ollama`, якщо не хочете визначати моделі вручну.

  </Accordion>

  <Accordion title="Хост Ollama у локальній мережі з ручними моделями">
    Для хостів локальної мережі використовуйте нативні URL Ollama. Не додавайте `/v1`.

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

    `contextWindow` — це бюджет контексту на боці OpenClaw. `params.num_ctx` надсилається до Ollama для запиту. Тримайте їх узгодженими, коли ваше обладнання не може працювати з повним заявленим контекстом моделі.

  </Accordion>

  <Accordion title="Лише Ollama Cloud">
    Використовуйте це, коли ви не запускаєте локальний daemon і хочете напряму використовувати розміщені моделі Ollama.

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

  <Accordion title="Хмара плюс локально через daemon, у який виконано вхід">
    Використовуйте це, коли локальний daemon Ollama або daemon у локальній мережі увійшов через `ollama signin` і має обслуговувати як локальні моделі, так і моделі `:cloud`.

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
    Використовуйте власні ідентифікатори провайдерів, коли у вас більше ніж один сервер Ollama. Кожен провайдер отримує власний хост, моделі, автентифікацію, тайм-аут і посилання на моделі.

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

    Коли OpenClaw надсилає запит, префікс активного провайдера прибирається, тож `ollama-large/qwen3.5:27b` потрапляє до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі можуть відповідати на прості prompt, але погано справляються з повною поверхнею інструментів агента. Почніть з обмеження інструментів і контексту, перш ніж змінювати глобальні налаштування runtime.

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
    `localModelLean` прибирає browser, Cron і message-інструменти з поверхні агента, але не змінює runtime-контекст Ollama чи режим thinking. Поєднуйте його з явними `params.num_ctx` і `params.thinking: false` для невеликих thinking-моделей у стилі Qwen, які зациклюються або витрачають бюджет відповіді на приховане reasoning.

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

Також підтримуються власні ідентифікатори провайдерів Ollama. Коли посилання
на модель використовує префікс активного провайдера, наприклад `ollama-spark/qwen3:32b`,
OpenClaw прибирає лише цей префікс перед викликом Ollama, тож сервер отримує `qwen3:32b`.

Для повільних локальних моделей надавайте перевагу налаштуванню запитів у межах провайдера, перш ніж підвищувати
тайм-аут усього runtime агента:

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

`timeoutSeconds` застосовується до HTTP-запиту моделі, включно з налаштуванням з’єднання,
заголовками, stream-передачею тіла й загальним перериванням guarded-fetch. `params.keep_alive`
передається до Ollama як `keep_alive` верхнього рівня в нативних запитах `/api/chat`;
установлюйте його для кожної моделі, коли вузьким місцем є час завантаження на першому ході.

### Швидка перевірка

```bash
# Daemon Ollama доступний для цієї машини
curl http://127.0.0.1:11434/api/tags

# Каталог OpenClaw і вибрана модель
openclaw models list --provider ollama
openclaw models status

# Пряма smoke-перевірка моделі
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Для віддалених хостів замініть `127.0.0.1` на хост, указаний у `baseUrl`. Якщо `curl` працює, а OpenClaw — ні, перевірте, чи Gateway не запущено на іншій машині, у контейнері або під іншим обліковим записом сервісу.

## Вебпошук Ollama

OpenClaw підтримує **Ollama Web Search** як убудований провайдер `web_search`.

| Властивість | Деталі                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований вами хост Ollama (`models.providers.ollama.baseUrl`, якщо встановлено, інакше `http://127.0.0.1:11434`); `https://ollama.com` напряму використовує розміщений API |
| Автентифікація | Без ключа для локальних хостів Ollama, у які виконано вхід; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів, захищених автентифікацією |
| Вимога      | Локальні/self-hosted хости мають працювати й мати виконаний вхід через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` плюс справжній ключ Ollama API |

Виберіть **Ollama Web Search** під час `openclaw onboard` або `openclaw configure --section web`, або встановіть:

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

Для локального daemon, у який виконано вхід, OpenClaw використовує проксі `/api/experimental/web_search` цього daemon. Для `https://ollama.com` він напряму викликає розміщену кінцеву точку `/api/web_search`.

<Note>
Повні відомості про налаштування й поведінку див. у [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **Виклик інструментів в OpenAI-сумісному режимі ненадійний.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо вам потрібно використовувати натомість OpenAI-сумісну кінцеву точку (наприклад, за проксі, який підтримує лише формат OpenAI), явно встановіть `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // за замовчуванням: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    У цьому режимі може не підтримуватися одночасно streaming і виклик інструментів. Можливо, вам доведеться вимкнути streaming через `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням додає `options.num_ctx`, щоб Ollama не переходив мовчки до контекстного вікна 4096. Якщо ваш проксі/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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
    Для моделей, виявлених автоматично, OpenClaw використовує контекстне вікно, про яке повідомляє Ollama, коли воно доступне, включно з більшими значеннями `PARAMETER num_ctx` із власних Modelfile. Інакше він повертається до стандартного контекстного вікна Ollama, яке використовує OpenClaw.

    Ви можете встановити типові значення `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера для кожної моделі в цьому провайдері Ollama, а потім за потреби перевизначати їх для окремих моделей. `contextWindow` — це бюджет prompt і Compaction у OpenClaw. У нативних запитах Ollama `options.num_ctx` залишається не встановленим, якщо ви явно не налаштуєте `params.num_ctx`, щоб Ollama міг застосувати власні типові значення моделі, `OLLAMA_CONTEXT_LENGTH` або значення на основі VRAM. Щоб обмежити або примусово встановити контекст runtime Ollama для окремого запиту без перебудови Modelfile, установіть `params.num_ctx`; некоректні, нульові, від’ємні й нескінченні значення ігноруються. OpenAI-сумісний адаптер Ollama, як і раніше, за замовчуванням додає `options.num_ctx` із налаштованих `params.num_ctx` або `contextWindow`; вимкніть це через `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Нативні записи моделей Ollama також приймають поширені параметри runtime Ollama в `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw пересилає лише ключі запитів Ollama, тож параметри runtime OpenClaw, як-от `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надіслати top-level `think` Ollama; `false` вимикає thinking на рівні API для thinking-моделей у стилі Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі теж працює. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над типовим значенням агента.

  </Accordion>

  <Accordion title="Керування thinking">
    Для нативних моделей Ollama OpenClaw пересилає керування thinking так, як цього очікує Ollama: top-level `think`, а не `options.think`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Ви також можете встановити типове значення для моделі:

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

    `params.think` або `params.thinking` для окремої моделі можуть вимкнути або примусово встановити thinking API Ollama для конкретної налаштованої моделі. Команди runtime, як-от `/think off`, усе одно застосовуються до активного запуску.

  </Accordion>

  <Accordion title="Reasoning-моделі">
    OpenClaw за замовчуванням вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` здатними до reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Жодної додаткової конфігурації не потрібно. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безплатний і працює локально, тому вартість усіх моделей встановлено на рівні $0. Це стосується як моделей, виявлених автоматично, так і моделей, визначених вручну.
  </Accordion>

  <Accordion title="Embeddings пам’яті">
    Убудований Plugin Ollama реєструє провайдера embeddings пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані базовий URL Ollama
    і ключ API, викликає поточну кінцеву точку Ollama `/api/embed` та пакетно
    обробляє кілька фрагментів пам’яті в одному запиті `input`, коли це можливо.

    | Властивість       | Значення            |
    | ----------------- | ------------------- |
    | Модель за замовчуванням | `nomic-embed-text`  |
    | Автоматичне завантаження | Так — embedding-модель автоматично завантажується, якщо її немає локально |

    Embeddings під час запиту використовують retrieval-префікси для моделей, які їх потребують або рекомендують, зокрема `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам’яті залишаються сирими, тому наявним індексам не потрібна міграція формату.

    Щоб вибрати Ollama як провайдера embeddings для пошуку в пам’яті:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

    Для віддаленого embedding-хоста зберігайте автентифікацію в межах цього хоста:

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

  <Accordion title="Конфігурація streaming">
    Інтеграція Ollama в OpenClaw за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно streaming і виклик інструментів. Жодної спеціальної конфігурації не потрібно.

    Для нативних запитів `/api/chat` OpenClaw також напряму передає керування thinking до Ollama: `/think off` і `openclaw agent --thinking off` надсилають top-level `think: false`, тоді як `/think low|medium|high` надсилають відповідний рядок зусилля top-level `think`. `/think max` відображається на найвищий нативний рівень зусиль Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісну кінцеву точку, див. розділ «Застарілий OpenAI-сумісний режим» вище. У цьому режимі streaming і виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Цикл збоїв WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює systemd-юніт `ollama.service` з `Restart=always`. Якщо цей сервіс автоматично запускається і завантажує модель з підтримкою GPU під час завантаження WSL2, Ollama може зафіксувати пам’ять хоста під час завантаження моделі. Механізм повернення пам’яті Hyper-V не завжди може повернути ці зафіксовані сторінки, тому Windows може завершити роботу віртуальної машини WSL2, systemd знову запустить Ollama — і цикл повториться.

    Типові ознаки:

    - повторні перезавантаження або завершення роботи WSL2 з боку Windows
    - високе навантаження CPU в `app.slice` або `ollama.service` невдовзі після запуску WSL2
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

    Установіть коротший keep-alive у середовищі сервісу Ollama або запускайте Ollama вручну лише тоді, коли він вам потрібен:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Див. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama не виявлено">
    Переконайтеся, що Ollama запущено, що ви встановили `OLLAMA_API_KEY` (або профіль автентифікації), і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Перевірте, що API доступний:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Якщо вашої моделі немає в списку, або завантажте модель локально, або визначте її явно в `models.providers.ollama`.

    ```bash
    ollama list  # Переглянути, що встановлено
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="У підключенні відмовлено">
    Перевірте, що Ollama працює на правильному порту:

    ```bash
    # Перевірити, чи запущено Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Віддалений хост працює з curl, але не з OpenClaw">
    Перевірте з тієї самої машини й у тому самому runtime, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Типові причини:

    - `baseUrl` вказує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає OpenAI-сумісну поведінку замість нативного Ollama.
    - Для віддаленого хоста потрібні зміни firewall або прив’язки до локальної мережі на боці Ollama.
    - Модель присутня в daemon на вашому ноутбуці, але відсутня у віддаленому daemon.

  </Accordion>

  <Accordion title="Модель виводить JSON інструментів як текст">
    Зазвичай це означає, що провайдер використовує OpenAI-сумісний режим або модель не може працювати зі схемами інструментів.

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

    Якщо невелика локальна модель і далі не справляється зі схемами інструментів, установіть `compat.supportsTools: false` у записі цієї моделі й перевірте знову.

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує тайм-аут">
    Великим локальним моделям може знадобитися тривале початкове завантаження до початку streaming. Залишайте тайм-аут обмеженим провайдером Ollama й за бажанням попросіть Ollama тримати модель завантаженою між ходами:

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

  <Accordion title="Модель з великим контекстом надто повільна або їй бракує пам’яті">
    Багато моделей Ollama заявляють контексти, які перевищують можливості вашого обладнання для комфортної роботи. Нативний Ollama використовує власний типовий runtime-контекст Ollama, якщо ви не встановите `params.num_ctx`. Обмежте як бюджет OpenClaw, так і контекст запиту Ollama, якщо вам потрібна передбачувана затримка до першого токена:

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

    Спочатку зменшуйте `contextWindow`, якщо OpenClaw надсилає надто великий prompt. Зменшуйте `params.num_ctx`, якщо Ollama завантажує runtime-контекст, який завеликий для машини. Зменшуйте `maxTokens`, якщо генерація триває надто довго.

  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язано

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі й поведінки failover.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування й поведінку вебпошуку на базі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
