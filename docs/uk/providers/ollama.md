---
read_when:
    - Ви хочете запустити OpenClaw з хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки щодо налаштування та конфігурації Ollama
    - Ви хочете використовувати візуальні моделі Ollama для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-27T23:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 814d7e9380e31e7f5a8db7afd9230e42979d8bb1fcaf5473dd9bb1f415a8b2ac
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/self-hosted серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` проти `https://ollama.com` або `Local only` проти доступного хоста Ollama.

<Warning>
**Користувачі віддаленого Ollama**: Не використовуйте OpenAI-сумісну URL-адресу `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклик інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами в стилі OpenAI SDK, але в новій конфігурації слід віддавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні та LAN-хости">
    Локальні та LAN-хости Ollama не потребують справжнього bearer-токена. OpenClaw використовує маркер `ollama-local` лише для loopback, приватної мережі, `.local` і базових URL Ollama з простим іменем хоста.
  </Accordion>
  <Accordion title="Віддалені хости та Ollama Cloud">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера.
  </Accordion>
  <Accordion title="Користувацькі id провайдерів">
    Користувацькі id провайдерів, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, який вказує на приватний LAN-хост Ollama, може використовувати `apiKey: "ollama-local"`, і субагенти розв’яжуть цей маркер через хук провайдера Ollama замість того, щоб вважати його відсутніми обліковими даними.
  </Accordion>
  <Accordion title="Область дії embedding'ів пам’яті">
    Коли Ollama використовується для embedding'ів пам’яті, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ на рівні провайдера надсилається лише на хост Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише на його віддалений embedding-хост.
    - Чисте значення змінної середовища `OLLAMA_API_KEY` трактується як угода для Ollama Cloud і за замовчуванням не надсилається на локальні або self-hosted хости.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Onboarding (рекомендовано)">
    **Найкраще для:** найшвидшого шляху до робочого налаштування Ollama cloud або local.

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
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує стандартні хмарні варіанти за замовчуванням. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, наприклад `gemma4:latest`, налаштування показує цю встановлену модель один раз замість того, щоб показувати і `gemma4`, і `gemma4:latest`, або знову завантажувати псевдонім без тегу. `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для доступу до cloud.
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

    За бажанням можна вказати користувацький базовий URL або модель:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Ручне налаштування">
    **Найкраще для:** повного контролю над cloud або local налаштуванням.

    <Steps>
      <Step title="Виберіть cloud або local">
        - **Cloud + Local**: встановіть Ollama, увійдіть за допомогою `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: встановіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Завантажте локальну модель (лише local)">
        ```bash
        ollama pull gemma4
        # або
        ollama pull gpt-oss:20b
        # або
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для конфігурацій із хостом підійде будь-яке значення-заповнювач:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Лише local
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
    `Cloud + Local` використовує доступний хост Ollama як точку керування і для локальних, і для хмарних моделей. Це рекомендований Ollama гібридний сценарій.

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує базовий URL Ollama, виявляє локальні моделі на цьому хості та перевіряє, чи хост увійшов у систему для cloud-доступу за допомогою `ollama signin`. Якщо хост увійшов у систему, OpenClaw також пропонує хмарні варіанти за замовчуванням, такі як `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо хост ще не увійшов у систему, OpenClaw залишає налаштування в режимі лише local, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, встановлює `baseUrl: "https://ollama.com"` і ініціалізує список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список cloud-моделей, який показується під час `openclaw onboard`, заповнюється в реальному часі з `https://ollama.com/api/tags`, з обмеженням до 500 записів, тому засіб вибору відображає поточний розміщений каталог, а не статичний початковий список. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих рекомендацій, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише local OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або self-hosted серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як локальне значення за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` або інший користувацький віддалений провайдер з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Докладно                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Виконує запити до `/api/tags`                                                                                                                                          |
| Виявлення можливостей | Використовує найкращі спроби запитів до `/api/show`, щоб зчитати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, зокрема vision/tools       |
| Візуальні моделі     | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як сумісні із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично вставляє зображення в prompt |
| Виявлення reasoning  | Позначає `reasoning` за допомогою евристики за назвою моделі (`r1`, `reasoning`, `think`)                                                                             |
| Ліміти токенів       | Встановлює `maxTokens` на стандартне обмеження максимальної кількості токенів Ollama, яке використовує OpenClaw                                                     |
| Вартість             | Встановлює всі вартості в `0`                                                                                                                                          |

Це дозволяє уникнути ручного додавання моделей, зберігаючи каталог узгодженим із локальним екземпляром Ollama. Ви можете використовувати повне посилання, наприклад `ollama/<pulled-model>:latest`, у локальному `infer model run`; OpenClaw розв’язує цю встановлену модель із живого каталогу Ollama без потреби у вручну написаному записі `models.json`.

```bash
# Перегляньте, які моделі доступні
ollama list
openclaw models list
```

Для вузького smoke-тесту генерації тексту, який обходить повну поверхню інструментів агента,
використовуйте локальний `infer model run` із повним посиланням на модель Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Цей шлях усе ще використовує налаштований у OpenClaw провайдер, автентифікацію та нативний транспорт Ollama, але не запускає хід chat-агента й не завантажує контекст MCP/tool. Якщо це спрацьовує, а звичайні відповіді агента — ні, далі слід діагностувати здатність моделі працювати з агентськими prompt/tool.

Коли ви перемикаєте розмову за допомогою `/model ollama/<model>`, OpenClaw трактує це як точний вибір користувача. Якщо налаштований `baseUrl` Ollama недоступний, наступна відповідь завершиться помилкою провайдера замість того, щоб мовчки відповісти з іншої налаштованої резервної моделі.

Виконайте живу перевірку локального текстового шляху, шляху нативного stream і embedding'ів із локальним Ollama за допомогою:

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
Якщо ви явно задаєте `models.providers.ollama` або налаштовуєте користувацький віддалений провайдер, наприклад `models.providers.ollama-cloud`, з `api: "ollama"`, автовиявлення пропускається, і ви повинні визначити моделі вручну. Користувацькі loopback-провайдери, такі як `http://127.0.0.2:11434`, усе одно вважаються локальними. Дивіться розділ про явну конфігурацію нижче.
</Note>

## Vision і опис зображень

Вбудований Plugin Ollama реєструє Ollama як провайдера розуміння медіа, сумісного із зображеннями. Це дозволяє OpenClaw маршрутизувати явні запити на опис зображень і налаштовані значення image-model за замовчуванням через локальні або розміщені візуальні моделі Ollama.

Для локального vision завантажте модель, яка підтримує зображення:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Потім перевірте через infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` має бути повним посиланням у форматі `<provider/model>`. Якщо його задано, `openclaw infer image describe` запускає цю модель напряму замість того, щоб пропускати опис, оскільки модель підтримує нативний vision.

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

Повільним локальним vision-моделям може знадобитися довший таймаут для розуміння зображень, ніж хмарним моделям. Вони також можуть аварійно завершуватися або зупинятися, коли Ollama намагається виділити весь заявлений vision-контекст на обладнанні з обмеженими ресурсами. Установіть таймаут можливості та обмежте `num_ctx` у записі моделі, якщо вам потрібен лише звичайний хід опису зображення:

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

Цей таймаут застосовується до вхідного розуміння зображень і до явного інструмента `image`, який агент може викликати під час ходу. `models.providers.ollama.timeoutSeconds` на рівні провайдера, як і раніше, керує базовим захистом HTTP-запиту Ollama для звичайних викликів моделі.

Виконайте живу перевірку явного інструмента зображень із локальним Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте vision-моделі як такі, що підтримують вхід зображень:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, які не позначені як сумісні із зображеннями. За неявного виявлення OpenClaw зчитує це з Ollama, коли `/api/show` повідомляє про можливість vision.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший шлях увімкнення лише local — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо задано `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, коли вам потрібне налаштування hosted cloud, Ollama працює на іншому хості/порту, ви хочете примусово задати конкретні вікна контексту або списки моделей, або вам потрібні повністю ручні визначення моделей.

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

  <Tab title="Користувацький базовий URL">
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автовиявлення, тому визначайте моделі вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 — використовуйте URL нативного API Ollama
            api: "ollama", // Явно задайте для гарантованої нативної поведінки виклику інструментів
            timeoutSeconds: 300, // Необов’язково: дайте холодним локальним моделям більше часу на підключення та stream
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

## Типові рецепти

Використовуйте їх як відправні точки й замінюйте id моделей на точні назви з `ollama list` або `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Локальна модель з автовиявленням">
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

  <Accordion title="LAN-хост Ollama з ручними моделями">
    Для LAN-хостів використовуйте нативні URL Ollama. Не додавайте `/v1`.

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

    `contextWindow` — це бюджет контексту на боці OpenClaw. `params.num_ctx` надсилається в Ollama для запиту. Узгоджуйте їх, коли ваше обладнання не може працювати з повним заявленим контекстом моделі.

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

  <Accordion title="Cloud плюс local через daemon із виконаним входом">
    Використовуйте це, коли локальний або LAN daemon Ollama увійшов у систему через `ollama signin` і має обслуговувати і локальні моделі, і моделі `:cloud`.

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
    Використовуйте користувацькі id провайдерів, коли у вас більше ніж один сервер Ollama. Кожен провайдер отримує власні хост, моделі, автентифікацію, таймаут і посилання на моделі.

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

    Коли OpenClaw надсилає запит, активний префікс провайдера прибирається, тож `ollama-large/qwen3.5:27b` надходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі можуть відповідати на прості запити, але мати труднощі з повною поверхнею інструментів агента. Почніть з обмеження інструментів і контексту, перш ніж змінювати глобальні налаштування runtime.

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

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер стабільно не справляються зі схемами інструментів. Це обмінює можливості агента на стабільність.
    `localModelLean` прибирає browser, cron і message tools з поверхні агента, але не змінює runtime-контекст Ollama або режим thinking. Поєднуйте це з явними `params.num_ctx` і `params.thinking: false` для невеликих thinking-моделей у стилі Qwen, які зациклюються або витрачають бюджет відповіді на приховане reasoning.

  </Accordion>
</AccordionGroup>

### Вибір моделі

Після налаштування всі ваші моделі Ollama доступні:

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

Також підтримуються користувацькі id провайдерів Ollama. Коли посилання на модель використовує активний
префікс провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw прибирає лише цей
префікс перед викликом Ollama, щоб сервер отримав `qwen3:32b`.

Для повільних локальних моделей віддавайте перевагу налаштуванню запитів на рівні провайдера перед збільшенням
таймауту runtime всього агента:

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
заголовками, stream тіла та повним перериванням guarded-fetch. `params.keep_alive`
передається в Ollama як `keep_alive` верхнього рівня в нативних запитах `/api/chat`;
задавайте це для кожної моделі, коли вузьким місцем є час завантаження першого ходу.

### Швидка перевірка

```bash
# Ollama daemon видимий для цієї машини
curl http://127.0.0.1:11434/api/tags

# Каталог OpenClaw і вибрана модель
openclaw models list --provider ollama
openclaw models status

# Прямий smoke-тест моделі
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Для віддалених хостів замініть `127.0.0.1` на хост, використаний у `baseUrl`. Якщо `curl` працює, а OpenClaw — ні, перевірте, чи Gateway не працює на іншій машині, у контейнері або під іншим сервісним обліковим записом.

## Ollama Web Search

OpenClaw підтримує **Ollama Web Search** як вбудований провайдер `web_search`.

| Властивість | Докладно                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований вами хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` використовує hosted API напряму |
| Автентифікація | Без ключа для локальних хостів Ollama з виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів із захищеною автентифікацією |
| Вимога      | Локальні/self-hosted хости мають працювати та бути авторизованими через `ollama signin`; прямий hosted-пошук вимагає `baseUrl: "https://ollama.com"` плюс справжній ключ API Ollama |

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

Для прямого hosted-пошуку через Ollama Cloud:

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

Для локального daemon з виконаним входом OpenClaw використовує проксі daemon через `/api/experimental/web_search`. Для `https://ollama.com` він напряму викликає hosted endpoint `/api/web_search`.

<Note>
Повні відомості про налаштування та поведінку дивіться в [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **Виклик інструментів у OpenAI-сумісному режимі ненадійний.** Використовуйте цей режим лише якщо вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо вам потрібно натомість використовувати OpenAI-сумісний endpoint (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

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

    Цей режим може не підтримувати одночасно streaming і виклик інструментів. Може знадобитися вимкнути streaming через `params: { streaming: false }` у конфігурації моделі.

    Коли з Ollama використовується `api: "openai-completions"`, OpenClaw за замовчуванням додає `options.num_ctx`, щоб Ollama мовчки не повертався до вікна контексту 4096. Якщо ваш проксі/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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
    Для автовиявлених моделей OpenClaw використовує вікно контексту, яке повідомляє Ollama, якщо воно доступне, зокрема більші значення `PARAMETER num_ctx` з користувацьких Modelfile. Інакше він повертається до типового вікна контексту Ollama, яке використовує OpenClaw.

    Ви можете задати значення за замовчуванням `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера для кожної моделі під цим провайдером Ollama, а потім перевизначити їх для окремих моделей за потреби. `contextWindow` — це бюджет prompt і Compaction у OpenClaw. Нативні запити Ollama залишають `options.num_ctx` незаданим, якщо ви явно не налаштуєте `params.num_ctx`, щоб Ollama міг застосувати власне значення за замовчуванням моделі, `OLLAMA_CONTEXT_LENGTH` або значення на основі VRAM. Щоб обмежити або примусово задати контекст runtime на запит в Ollama без перебудови Modelfile, установіть `params.num_ctx`; невалідні, нульові, від’ємні та нескінченні значення ігноруються. OpenAI-сумісний адаптер Ollama, як і раніше, за замовчуванням додає `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це через `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Записи нативних моделей Ollama також приймають поширені параметри runtime Ollama в `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw пересилає лише ключі запиту Ollama, тому параметри runtime OpenClaw, як-от `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надсилати `think` верхнього рівня Ollama; `false` вимикає thinking на рівні API для thinking-моделей у стилі Qwen.

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
    Для нативних моделей Ollama OpenClaw пересилає керування thinking так, як очікує Ollama: `think` верхнього рівня, а не `options.think`.

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

    `params.think` або `params.thinking` для окремої моделі можуть вимкнути або примусово ввімкнути thinking API Ollama для конкретної налаштованої моделі. Команди runtime, такі як `/think off`, однаково застосовуються до активного запуску.

  </Accordion>

  <Accordion title="Моделі reasoning">
    OpenClaw за замовчуванням вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` сумісними з reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama є безплатним і працює локально, тому вартість усіх моделей встановлена на рівні $0. Це стосується як автовиявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Embedding'и пам’яті">
    Вбудований Plugin Ollama реєструє провайдера embedding'ів пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані базовий URL
    та API-ключ Ollama, викликає поточний endpoint Ollama `/api/embed` і групує
    кілька фрагментів пам’яті в один запит `input`, коли це можливо.

    | Властивість    | Значення            |
    | --------------- | ------------------- |
    | Модель за замовчуванням | `nomic-embed-text`  |
    | Auto-pull       | Так — embedding-модель автоматично завантажується локально, якщо її немає |

    Embedding'и під час запиту використовують retrieval-префікси для моделей, які їх вимагають або рекомендують, зокрема `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам’яті залишаються сирими, тож наявним індексам не потрібна міграція формату.

    Щоб вибрати Ollama як провайдера embedding'ів для пошуку в пам’яті:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Для віддаленого embedding-хоста обмежуйте автентифікацію цим хостом:

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

  <Accordion title="Конфігурація streaming">
    Інтеграція Ollama в OpenClaw за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно streaming і виклик інструментів. Жодної спеціальної конфігурації не потрібно.

    Для нативних запитів `/api/chat` OpenClaw також напряму пересилає керування thinking до Ollama: `/think off` і `openclaw agent --thinking off` надсилають `think: false` верхнього рівня, тоді як `/think low|medium|high` надсилають відповідний рядок зусилля `think` верхнього рівня. `/think max` зіставляється з найвищим нативним рівнем зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісний endpoint, дивіться розділ «Застарілий OpenAI-сумісний режим» вище. У цьому режимі streaming і виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення проблем

<AccordionGroup>
  <Accordion title="Цикл збоїв WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює systemd unit `ollama.service` з `Restart=always`. Якщо цей сервіс автозапускається й завантажує модель з підтримкою GPU під час завантаження WSL2, Ollama може закріпити пам’ять хоста під час завантаження моделі. Hyper-V не завжди може вивільнити ці закріплені сторінки, тому Windows може завершити роботу ВМ WSL2, systemd знову запускає Ollama — і цикл повторюється.

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

    Задайте коротший keep-alive у середовищі сервісу Ollama або запускайте Ollama вручну лише тоді, коли він вам потрібен:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Дивіться [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama не виявлено">
    Переконайтеся, що Ollama запущено, що ви задали `OLLAMA_API_KEY` (або профіль автентифікації) і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Переконайтеся, що API доступний:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Якщо вашої моделі немає у списку, або завантажте її локально, або явно визначте її в `models.providers.ollama`.

    ```bash
    ollama list  # Переглянути, що встановлено
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="Підключення відхилено">
    Перевірте, що Ollama працює на правильному порту:

    ```bash
    # Перевірити, чи запущено Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Віддалений хост працює з curl, але не з OpenClaw">
    Перевірте з тієї самої машини й того самого runtime, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Поширені причини:

    - `baseUrl` вказує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає OpenAI-сумісну поведінку замість нативного Ollama.
    - Віддаленому хосту потрібні зміни firewall або LAN-прив’язки на боці Ollama.
    - Модель є в daemon на вашому ноутбуці, але відсутня у віддаленому daemon.

  </Accordion>

  <Accordion title="Модель виводить JSON інструментів як текст">
    Зазвичай це означає, що провайдер використовує OpenAI-сумісний режим або модель не може працювати зі схемами інструментів.

    Віддавайте перевагу нативному режиму Ollama:

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

    Якщо невелика локальна модель усе ще не справляється зі схемами інструментів, задайте `compat.supportsTools: false` у записі цієї моделі та перевірте знову.

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує таймаут">
    Великим локальним моделям може знадобитися довге перше завантаження, перш ніж почнеться streaming. Залишайте таймаут у межах провайдера Ollama і, за бажанням, попросіть Ollama тримати модель завантаженою між ходами:

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

    Якщо сам хост повільно приймає з’єднання, `timeoutSeconds` також подовжує захищений таймаут підключення Undici для цього провайдера.

  </Accordion>

  <Accordion title="Модель з великим контекстом надто повільна або їй бракує пам’яті">
    Багато моделей Ollama заявляють контекст, більший за той, який ваше обладнання може комфортно обробити. Нативний Ollama використовує власне значення контексту runtime за замовчуванням, якщо ви не задаєте `params.num_ctx`. Обмежуйте і бюджет OpenClaw, і контекст запиту Ollama, якщо хочете передбачувану затримку до першого токена:

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

    Спочатку зменшуйте `contextWindow`, якщо OpenClaw надсилає занадто великий prompt. Зменшуйте `params.num_ctx`, якщо Ollama завантажує runtime-контекст, який завеликий для машини. Зменшуйте `maxTokens`, якщо генерація триває занадто довго.

  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення проблем](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування та поведінку для вебпошуку на базі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник з конфігурації.
  </Card>
</CardGroup>
