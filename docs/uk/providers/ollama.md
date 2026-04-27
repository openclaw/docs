---
read_when:
    - Ви хочете запускати OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки щодо налаштування та конфігурації Ollama
    - Ви хочете використовувати vision-моделі Ollama для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-27T11:02:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ed7ba98c3c6ed3f4b68a104349ac7597fe79f36d0a846bf364a1e2e09be7b5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для хмарних hosted-моделей і локальних/self-hosted серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` через `https://ollama.com` або `Local only` через доступний хост Ollama.

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте OpenAI-сумісний URL `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклики інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте нативний URL API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації слід надавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні хости та хости в LAN">
    Локальним хостам Ollama і хостам Ollama в LAN не потрібен справжній bearer token. OpenClaw використовує локальний маркер `ollama-local` лише для loopback, private-network, `.local` і базових URL Ollama з простим ім’ям хоста.
  </Accordion>
  <Accordion title="Віддалені хости та Ollama Cloud">
    Віддалені публічні хости й Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера.
  </Accordion>
  <Accordion title="Власні id провайдера">
    Власні id провайдера, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, що вказує на приватний хост Ollama в LAN, може використовувати `apiKey: "ollama-local"`, і субагенти розв’язуватимуть цей маркер через хук провайдера Ollama, а не трактуватимуть його як відсутні облікові дані.
  </Accordion>
  <Accordion title="Область дії embedding пам’яті">
    Коли Ollama використовується для embedding пам’яті, bearer-автентифікація обмежується тим хостом, де її було оголошено:

    - Ключ на рівні провайдера надсилається лише на хост Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише на його віддалений хост embedding.
    - Чисте значення змінної середовища `OLLAMA_API_KEY` трактується як угода для Ollama Cloud і за замовчуванням не надсилається на локальні або self-hosted хости.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний спосіб налаштування й режим.

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
      <Step title="Виберіть свій режим">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, що маршрутизуються через цей хост
        - **Cloud only** — hosted-моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує стандартні hosted-хмарні моделі. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі й автоматично виконують pull для вибраної локальної моделі, якщо її ще немає. `Cloud + Local` також перевіряє, чи виконано вхід цього хоста Ollama для хмарного доступу.
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

    За бажанням укажіть власний базовий URL або модель:

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
        - **Cloud + Local**: установіть Ollama, увійдіть через `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: установіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Виконайте pull локальної моделі (лише локальний режим)">
        ```bash
        ollama pull gemma4
        # або
        ollama pull gpt-oss:20b
        # або
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте справжній `OLLAMA_API_KEY`. Для конфігурацій на основі хоста підійде будь-яке значення-заглушка:

        ```bash
        # Cloud
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

        Або задайте стандартне значення в конфігурації:

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

    Під час налаштування використовуйте **Cloud + Local**. OpenClaw запитує базовий URL Ollama, виявляє локальні моделі на цьому хості та перевіряє, чи виконано вхід цього хоста для хмарного доступу через `ollama signin`. Якщо вхід на хості виконано, OpenClaw також пропонує стандартні hosted-хмарні моделі, як-от `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо вхід на хості ще не виконано, OpenClaw залишає налаштування лише локальним, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює через hosted API Ollama за адресою `https://ollama.com`.

    Під час налаштування використовуйте **Cloud only**. OpenClaw запитує `OLLAMA_API_KEY`, установлює `baseUrl: "https://ollama.com"` і ініціалізує список hosted-хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, який показується під час `openclaw onboard`, заповнюється в реальному часі з `https://ollama.com/api/tags`, обмежується 500 записами, тому список вибору відображає поточний hosted-каталог, а не статичний початковий набір. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих пропозицій, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локального використання OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначено для локальних або self-hosted серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як стандартну локальну модель.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` чи інший власний віддалений провайдер із `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка | Деталі |
| --------- | ------ |
| Запит каталогу | Виконує запити до `/api/tags` |
| Виявлення можливостей | Використовує best-effort пошук через `/api/show`, щоб зчитати `contextWindow`, розширені параметри Modelfile `num_ctx` і можливості, зокрема vision/tools |
| Vision-моделі | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично інжектує зображення в prompt |
| Виявлення reasoning | Позначає `reasoning` за допомогою евристики за назвою моделі (`r1`, `reasoning`, `think`) |
| Ліміти токенів | Установлює `maxTokens` на стандартне обмеження максимальних токенів Ollama, яке використовує OpenClaw |
| Вартість | Установлює всі вартості в `0` |

Це дає змогу уникнути ручного додавання моделей і водночас зберігати каталог узгодженим із локальним екземпляром Ollama.

```bash
# Подивитися, які моделі доступні
ollama list
openclaw models list
```

Щоб додати нову модель, просто виконайте її pull через Ollama:

```bash
ollama pull mistral
```

Нова модель буде автоматично виявлена й стане доступною для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama` або налаштовуєте власний віддалений провайдер, наприклад `models.providers.ollama-cloud` з `api: "ollama"`, автовиявлення пропускається, і моделі потрібно визначати вручну. Власні loopback-провайдери, наприклад `http://127.0.0.2:11434`, усе ще вважаються локальними. Див. розділ про явну конфігурацію нижче.
</Note>

## Vision і опис зображень

Вбудований Plugin Ollama реєструє Ollama як провайдера розуміння медіа із підтримкою зображень. Це дозволяє OpenClaw маршрутизувати явні запити на опис зображень і налаштовані стандартні image-моделі через локальні або hosted vision-моделі Ollama.

Для локального vision виконайте pull моделі, що підтримує зображення:

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

`--model` має бути повним посиланням `<provider/model>`. Коли його задано, `openclaw infer image describe` запускає цю модель безпосередньо замість того, щоб пропускати опис, оскільки модель підтримує нативний vision.

Щоб зробити Ollama стандартною моделлю розуміння зображень для вхідних медіа, налаштуйте `agents.defaults.imageModel`:

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

Повільним локальним vision-моделям може знадобитися довший timeout для розуміння зображень, ніж хмарним моделям. Вони також можуть аварійно завершуватися або зупинятися, коли Ollama намагається виділити весь заявлений контекст vision на обмеженому обладнанні. Установіть timeout можливості й обмежте `num_ctx` у записі моделі, якщо вам потрібен лише звичайний хід опису зображення:

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

Цей timeout застосовується до розуміння вхідних зображень і до явного інструмента `image`, який агент може викликати під час ходу. Значення `models.providers.ollama.timeoutSeconds` на рівні провайдера, як і раніше, керує захистом HTTP-запиту Ollama для звичайних викликів моделі.

Для live-перевірки явного інструмента image з локальним Ollama використовуйте:

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
  <Tab title="Базово (неявне виявлення)">
    Найпростіший шлях увімкнення режиму лише локально — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо задано `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явно (ручні моделі)">
    Використовуйте явну конфігурацію, якщо вам потрібне hosted-хмарне налаштування, Ollama працює на іншому хості/порту, ви хочете примусово задати конкретні context window або списки моделей, або хочете повністю ручні визначення моделей.

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
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автовиявлення, тому визначайте моделі вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 — використовуйте нативний URL API Ollama
            api: "ollama", // Явно задайте, щоб гарантувати нативну поведінку виклику інструментів
            timeoutSeconds: 300, // Необов’язково: дайте холодним локальним моделям більше часу на підключення та потокову передачу
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
    Не додавайте `/v1` до URL. Шлях `/v1` використовує OpenAI-сумісний режим, у якому виклик інструментів працює ненадійно. Використовуйте базовий URL Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

## Поширені рецепти

Використовуйте їх як відправні точки й замінюйте id моделей точними назвами з `ollama list` або `openclaw models list --provider ollama`.

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
    Використовуйте це, коли ви не запускаєте локальний daemon і хочете напряму використовувати hosted-моделі Ollama.

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
    Використовуйте це, коли локальний daemon Ollama або daemon Ollama в LAN увійшов через `ollama signin` і має обслуговувати і локальні моделі, і моделі `:cloud`.

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
    Використовуйте власні id провайдерів, коли у вас є більше ніж один сервер Ollama. Кожен провайдер отримує власний хост, моделі, автентифікацію, timeout і посилання на моделі.

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

    Коли OpenClaw надсилає запит, префікс активного провайдера прибирається, тож `ollama-large/qwen3.5:27b` надходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі можуть відповідати на прості prompt, але погано працювати з повною поверхнею інструментів агента. Почніть з обмеження інструментів і контексту, перш ніж змінювати глобальні налаштування runtime.

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

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер стабільно збоять на схемах інструментів. Це зменшує можливості агента заради стабільності.
    `localModelLean` прибирає браузер, Cron і інструменти повідомлень з поверхні агента, але не змінює runtime-контекст Ollama або режим thinking. Поєднуйте це з явними `params.num_ctx` і `params.thinking: false` для невеликих Qwen-подібних thinking-моделей, які зациклюються або витрачають бюджет відповіді на приховане reasoning.

  </Accordion>
</AccordionGroup>

### Вибір моделі

Після налаштування всі ваші моделі Ollama стають доступними:

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
провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw прибирає лише цей
префікс перед викликом Ollama, щоб сервер отримав `qwen3:32b`.

Для повільних локальних моделей віддавайте перевагу налаштуванню запитів на рівні провайдера, перш ніж підвищувати
timeout усього runtime агента:

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
заголовками, потоковою передачею тіла й загальним перериванням guarded-fetch. `params.keep_alive`
пересилається до Ollama як верхньорівневий `keep_alive` у нативних запитах `/api/chat`;
задавайте його для конкретної моделі, коли вузьким місцем є час завантаження під час першого ходу.

### Швидка перевірка

```bash
# Ollama daemon видимий для цієї машини
curl http://127.0.0.1:11434/api/tags

# Каталог OpenClaw і вибрана модель
openclaw models list --provider ollama
openclaw models status

# Пряма перевірка моделі
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Для віддалених хостів замініть `127.0.0.1` на хост, використаний у `baseUrl`. Якщо `curl` працює, а OpenClaw — ні, перевірте, чи Gateway не працює на іншій машині, у контейнері або під іншим службовим акаунтом.

## Вебпошук Ollama

OpenClaw підтримує **Ollama Web Search** як вбудований провайдер `web_search`.

| Властивість | Деталі |
| ----------- | ------ |
| Хост | Використовує ваш налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); для `https://ollama.com` напряму використовується hosted API |
| Автентифікація | Без ключа для локальних хостів Ollama з виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів, захищених автентифікацією |
| Вимога | Локальні/self-hosted хости мають бути запущені та мати виконаний вхід через `ollama signin`; для прямого hosted-пошуку потрібні `baseUrl: "https://ollama.com"` і справжній API-ключ Ollama |

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

Для локального daemon із виконаним входом OpenClaw використовує проксі daemon через `/api/experimental/web_search`. Для `https://ollama.com` він напряму викликає hosted endpoint `/api/web_search`.

<Note>
Повні відомості про налаштування та поведінку див. у [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **Виклик інструментів в OpenAI-сумісному режимі працює ненадійно.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо вам потрібно використовувати OpenAI-сумісний endpoint (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

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

    У цьому режимі потокове передавання та виклик інструментів можуть не підтримуватися одночасно. Можливо, вам доведеться вимкнути потокове передавання через `params: { streaming: false }` у конфігурації моделі.

    Коли для Ollama використовується `api: "openai-completions"`, OpenClaw за замовчуванням інжектує `options.num_ctx`, щоб Ollama тихо не повертався до context window 4096. Якщо ваш проксі/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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

  <Accordion title="Context window">
    Для автоматично виявлених моделей OpenClaw використовує context window, про який повідомляє Ollama, коли він доступний, включно з більшими значеннями `PARAMETER num_ctx` із власних Modelfile. Інакше він повертається до стандартного context window Ollama, який використовує OpenClaw.

    Ви можете задати стандартні значення `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера для кожної моделі цього провайдера Ollama, а потім за потреби перевизначати їх для конкретних моделей. `contextWindow` — це бюджет prompt і Compaction на боці OpenClaw. У нативних запитах Ollama `options.num_ctx` залишається незаданим, якщо ви явно не налаштуєте `params.num_ctx`, тож Ollama може застосувати власне значення за замовчуванням моделі, `OLLAMA_CONTEXT_LENGTH` або значення на основі VRAM. Щоб обмежити або примусово задати runtime-контекст Ollama для окремого запиту без перебудови Modelfile, використовуйте `params.num_ctx`; недійсні, нульові, від’ємні та нескінченні значення ігноруються. OpenAI-сумісний адаптер Ollama усе ще за замовчуванням інжектує `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це через `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Нативні записи моделей Ollama також приймають поширені параметри runtime Ollama в `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw пересилає лише ключі запиту Ollama, тож параметри runtime OpenClaw, як-от `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надсилати верхньорівневий параметр Ollama `think`; `false` вимикає thinking на рівні API для Qwen-подібних thinking-моделей.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` для конкретної моделі теж працює. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над стандартним значенням агента.

  </Accordion>

  <Accordion title="Керування thinking">
    Для нативних моделей Ollama OpenClaw пересилає керування thinking у форматі, якого очікує Ollama: верхньорівневий `think`, а не `options.think`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Ви також можете задати стандартне значення для моделі:

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

    `params.think` або `params.thinking` для конкретної моделі можуть вимикати або примусово вмикати thinking API Ollama для певної налаштованої моделі. Команди runtime, як-от `/think off`, усе одно застосовуються до активного запуску.

  </Accordion>

  <Accordion title="Моделі reasoning">
    OpenClaw за замовчуванням вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` здатними до reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Жодної додаткової конфігурації не потрібно. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama є безкоштовним і працює локально, тому вартість усіх моделей установлюється в $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Embedding пам’яті">
    Вбудований Plugin Ollama реєструє провайдера embedding пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані base URL
    й API-ключ Ollama, викликає актуальний endpoint Ollama `/api/embed` і
    об’єднує кілька фрагментів пам’яті в один запит `input`, коли це можливо.

    | Властивість | Значення |
    | ----------- | -------- |
    | Стандартна модель | `nomic-embed-text` |
    | Автоматичний pull | Так — модель embedding автоматично виконує pull, якщо локально її немає |

    Embedding під час запиту використовують retrieval-префікси для моделей, які цього потребують або рекомендують це, зокрема `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам’яті залишаються сирими, тож наявним індексам не потрібна міграція формату.

    Щоб вибрати Ollama як провайдера embedding для пошуку в пам’яті:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

    Для віддаленого хоста embedding обмежуйте автентифікацію цим хостом:

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

  <Accordion title="Конфігурація потокового передавання">
    Інтеграція Ollama в OpenClaw за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно і потокове передавання, і виклик інструментів. Жодної спеціальної конфігурації не потрібно.

    Для нативних запитів `/api/chat` OpenClaw також напряму пересилає керування thinking до Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневий `think: false`, тоді як `/think low|medium|high` надсилають відповідний рядок зусилля верхнього рівня `think`. `/think max` зіставляється з найвищим нативним рівнем зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісний endpoint, див. розділ «Застарілий OpenAI-сумісний режим» вище. У цьому режимі потокове передавання та виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
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
    Якщо вашої моделі немає в списку, або виконайте pull моделі локально, або явно визначте її в `models.providers.ollama`.

    ```bash
    ollama list  # Подивитися, що встановлено
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="Відхилено з’єднання">
    Перевірте, що Ollama запущено на правильному порту:

    ```bash
    # Перевірити, чи запущено Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Віддалений хост працює з curl, але не з OpenClaw">
    Перевіряйте з тієї самої машини й того самого runtime, де запущено Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Поширені причини:

    - `baseUrl` вказує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає OpenAI-сумісну поведінку замість нативного Ollama.
    - Віддаленому хосту потрібні зміни firewall або прив’язки LAN на боці Ollama.
    - Модель наявна в daemon вашого ноутбука, але відсутня у віддаленому daemon.

  </Accordion>

  <Accordion title="Модель виводить JSON інструментів як текст">
    Зазвичай це означає, що провайдер використовує OpenAI-сумісний режим або модель не може обробити схеми інструментів.

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

    Якщо невелика локальна модель усе ще не справляється зі схемами інструментів, задайте `compat.supportsTools: false` у записі цієї моделі та перевірте ще раз.

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує timeout">
    Великим локальним моделям може знадобитися багато часу для першого завантаження до початку потокового передавання. Тримайте timeout в області провайдера Ollama й за бажанням попросіть Ollama тримати модель завантаженою між ходами:

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

    Якщо сам хост повільно приймає з’єднання, `timeoutSeconds` також подовжує захищений timeout підключення Undici для цього провайдера.

  </Accordion>

  <Accordion title="Модель із великим контекстом занадто повільна або вичерпує пам’ять">
    Багато моделей Ollama заявляють контекст, який більший, ніж ваше обладнання може комфортно обробляти. Нативний Ollama використовує власний стандартний runtime-контекст Ollama, якщо ви не задасте `params.num_ctx`. Обмежуйте і бюджет OpenClaw, і контекст запиту Ollama, коли вам потрібна передбачувана затримка до першого токена:

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

    Спочатку зменшуйте `contextWindow`, якщо OpenClaw надсилає надто великий prompt. Зменшуйте `params.num_ctx`, якщо Ollama завантажує runtime-контекст, який завеликий для цієї машини. Зменшуйте `maxTokens`, якщо генерація триває надто довго.

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язано

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування та поведінку вебпошуку на основі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник з конфігурації.
  </Card>
</CardGroup>
