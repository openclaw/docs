---
read_when:
    - Ви хочете запускати OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні інструкції з налаштування та конфігурації Ollama
    - Вам потрібні моделі бачення Ollama для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-28T11:23:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5b31171f7c6d2e97507b4b7c7daf6140a29b9531a4b1e1589f3cc010ec44904
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/самостійно розміщених серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` із `https://ollama.com` або `Local only` із доступним хостом Ollama.

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте з OpenClaw OpenAI-сумісний URL `/v1` (`http://host:11434/v1`). Це ламає виклик інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації варто надавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні та LAN-хости">
    Локальним і LAN-хостам Ollama не потрібен справжній bearer-токен. OpenClaw використовує локальний маркер `ollama-local` лише для local loopback, приватної мережі, `.local` і базових URL Ollama з простими іменами хостів.
  </Accordion>
  <Accordion title="Віддалені хости та хости Ollama Cloud">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера.
  </Accordion>
  <Accordion title="Власні ідентифікатори провайдерів">
    Власні ідентифікатори провайдерів, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, що вказує на приватний LAN-хост Ollama, може використовувати `apiKey: "ollama-local"`, і субагенти розв’язуватимуть цей маркер через hook провайдера Ollama, а не трактуватимуть його як відсутні облікові дані. Пошук у пам’яті також може встановити `agents.defaults.memorySearch.provider` на цей власний ідентифікатор провайдера, щоб embeddings використовували відповідну кінцеву точку Ollama.
  </Accordion>
  <Accordion title="Профілі автентифікації">
    `auth-profiles.json` зберігає облікові дані для ідентифікатора провайдера. Параметри кінцевої точки (`baseUrl`, `api`, ідентифікатори моделей, заголовки, тайм-аути) розміщуйте в `models.providers.<id>`. Старі пласкі файли профілів автентифікації, як-от `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не є runtime-форматом; запустіть `openclaw doctor --fix`, щоб переписати їх у канонічний API-key профіль `ollama-windows:default` із резервною копією. `baseUrl` у цьому файлі є шумом сумісності, і його слід перенести до конфігурації провайдера.
  </Accordion>
  <Accordion title="Область embeddings пам’яті">
    Коли Ollama використовується для embeddings пам’яті, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ рівня провайдера надсилається лише на хост Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише на відповідний віддалений хост embeddings.
    - Чисте значення env `OLLAMA_API_KEY` трактується як домовленість Ollama Cloud і за замовчуванням не надсилається на локальні або самостійно розміщені хости.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Онбординг (рекомендовано)">
    **Найкраще для:** найшвидшого шляху до робочого хмарного або локального налаштування Ollama.

    <Steps>
      <Step title="Запустіть онбординг">
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
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує типові значення для розміщеної хмари. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, як-от `gemma4:latest`, налаштування показує цю встановлену модель один раз, а не показує одночасно `gemma4` і `gemma4:latest` чи знову завантажує простий псевдонім. `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для хмарного доступу.
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
        - **Cloud + Local**: встановіть Ollama, увійдіть за допомогою `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: встановіть Ollama з [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Завантажте локальну модель (лише локальний режим)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте справжній `OLLAMA_API_KEY`. Для налаштувань із хостом підійде будь-яке значення-заповнювач:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перегляньте та задайте свою модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або задайте типове значення в конфігурації:

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
    `Cloud + Local` використовує доступний хост Ollama як контрольну точку для локальних і хмарних моделей. Це рекомендований Ollama гібридний потік.

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує базовий URL Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи виконано вхід на хості для хмарного доступу за допомогою `ollama signin`. Коли на хості виконано вхід, OpenClaw також пропонує типові значення розміщеної хмари, як-от `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо на хості ще не виконано вхід, OpenClaw залишає налаштування лише локальним, доки ви не запустите `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, задає `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей початковими значеннями. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється наживо з `https://ollama.com/api/tags` і обмежений 500 записами, тому вибір відображає поточний розміщений каталог, а не статичний початковий набір. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих пропозицій, щоб онбординг усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локальної роботи OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або самостійно розміщених серверів Ollama.

    Зараз OpenClaw пропонує `gemma4` як локальне типове значення.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` чи інший власний віддалений провайдер з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Деталі                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Запитує `/api/tags`                                                                                                                                                  |
| Виявлення можливостей | Використовує best-effort запити `/api/show`, щоб прочитати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, зокрема vision/tools             |
| Моделі vision        | Моделі з можливістю `vision`, повідомленою `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тож OpenClaw автоматично вставляє зображення в prompt |
| Виявлення reasoning  | Використовує можливості `/api/show`, коли вони доступні, зокрема `thinking`; повертається до евристики за назвою моделі (`r1`, `reasoning`, `think`), коли Ollama пропускає можливості |
| Ліміти токенів       | Встановлює `maxTokens` на типовий максимальний ліміт токенів Ollama, який використовує OpenClaw                                                                      |
| Вартість             | Встановлює всю вартість у `0`                                                                                                                                        |

Це дає змогу уникнути ручних записів моделей, водночас підтримуючи каталог узгодженим із локальним екземпляром Ollama. Ви можете використовувати повне посилання, як-от `ollama/<pulled-model>:latest`, у локальному `infer model run`; OpenClaw розв’язує цю встановлену модель із живого каталогу Ollama без потреби в написаному вручну записі `models.json`.

```bash
# See what models are available
ollama list
openclaw models list
```

Для вузького smoke-тесту генерації тексту, який уникає повної поверхні інструментів агента,
використовуйте локальний `infer model run` із повним посиланням на модель Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Цей шлях усе одно використовує налаштований провайдер OpenClaw, автентифікацію та нативний
транспорт Ollama, але не запускає хід чат-агента і не завантажує контекст MCP/інструментів. Якщо
це успішно виконується, тоді як звичайні відповіді агента не працюють, далі діагностуйте
здатність моделі працювати з agent prompt/інструментами.

Коли ви перемикаєте розмову за допомогою `/model ollama/<model>`, OpenClaw трактує
це як точний вибір користувача. Якщо налаштований `baseUrl` Ollama
недоступний, наступна відповідь завершується помилкою провайдера, а не мовчки
відповідає з іншої налаштованої резервної моделі.

Ізольовані Cron-завдання виконують одну додаткову локальну перевірку безпеки перед запуском
ходу агента. Якщо вибрана модель розв’язується в локальний, приватно-мережевий або `.local`
провайдер Ollama і `/api/tags` недоступний, OpenClaw записує цей запуск Cron
як `skipped` із вибраним `ollama/<model>` у тексті помилки. Попередня перевірка кінцевої точки
кешується на 5 хвилин, тому кілька Cron-завдань, спрямованих на той самий
зупинений демон Ollama, не запускають усі невдалі запити до моделі.

Перевірте наживо локальний текстовий шлях, нативний потоковий шлях і embeddings на
локальному Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Щоб додати нову модель, просто завантажте її через Ollama:

```bash
ollama pull mistral
```

Нова модель буде автоматично виявлена й доступна для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama` або налаштовуєте власного віддаленого провайдера, як-от `models.providers.ollama-cloud` з `api: "ollama"`, автовиявлення пропускається, і ви маєте визначити моделі вручну. Власні провайдери local loopback, як-от `http://127.0.0.2:11434`, усе одно трактуються як локальні. Дивіться розділ явної конфігурації нижче.
</Note>

## Vision і опис зображень

Вбудований Plugin Ollama реєструє Ollama як провайдера розуміння медіа з підтримкою зображень. Це дає OpenClaw змогу спрямовувати явні запити на опис зображень і налаштовані типові значення моделей для зображень через локальні або розміщені vision-моделі Ollama.

Для локального vision витягніть модель, яка підтримує зображення:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Потім перевірте за допомогою infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` має бути повним посиланням `<provider/model>`. Коли його задано, `openclaw infer image describe` запускає цю модель напряму замість пропуску опису через те, що модель підтримує нативний vision.

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

Надавайте перевагу повному посиланню `ollama/<model>`. Якщо та сама модель указана в `models.providers.ollama.models` з `input: ["text", "image"]` і жоден інший налаштований провайдер зображень не надає цей простий ID моделі, OpenClaw також нормалізує просте посилання `imageModel`, як-от `qwen2.5vl:7b`, до `ollama/qwen2.5vl:7b`. Якщо більше ніж один налаштований провайдер зображень має той самий простий ID, явно використовуйте префікс провайдера.

Повільним локальним vision-моделям може знадобитися довший тайм-аут розуміння зображень, ніж хмарним моделям. Вони також можуть аварійно завершувати роботу або зупинятися, коли Ollama намагається виділити повний заявлений vision-контекст на обмеженому обладнанні. Задайте тайм-аут можливості та обмежте `num_ctx` у записі моделі, коли вам потрібен лише звичайний хід опису зображення:

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

Цей тайм-аут застосовується до розуміння вхідних зображень і до явного інструмента `image`, який агент може викликати під час ходу. `models.providers.ollama.timeoutSeconds` на рівні провайдера й надалі керує базовим захистом HTTP-запиту Ollama для звичайних викликів моделі.

Live-перевірка явного інструмента зображень із локальним Ollama:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте vision-моделі підтримкою введення зображень:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, які не позначені як здатні працювати із зображеннями. За неявного виявлення OpenClaw зчитує це з Ollama, коли `/api/show` повідомляє про vision-можливість.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший шлях увімкнення лише для локального використання — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо `OLLAMA_API_KEY` задано, можна опустити `apiKey` у записі провайдера, і OpenClaw заповнить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, коли потрібне розміщене хмарне налаштування, Ollama працює на іншому хості/порту, ви хочете примусово задати конкретні вікна контексту або списки моделей, чи потрібні повністю ручні визначення моделей.

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
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автовиявлення, тож визначайте моделі вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Не додавайте `/v1` до URL. Шлях `/v1` використовує режим, сумісний з OpenAI, де виклики інструментів ненадійні. Використовуйте базовий URL Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

## Поширені рецепти

Використовуйте їх як відправні точки та замінюйте ID моделей точними назвами з `ollama list` або `openclaw models list --provider ollama`.

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
    Використовуйте нативні URL Ollama для LAN-хостів. Не додавайте `/v1`.

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
    Використовуйте це, коли ви не запускаєте локальний демон і хочете напряму використовувати розміщені моделі Ollama.

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

  <Accordion title="Хмара плюс локальні моделі через демон із виконаним входом">
    Використовуйте це, коли локальний або LAN-демон Ollama ввійшов через `ollama signin` і має обслуговувати як локальні моделі, так і моделі `:cloud`.

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
    Використовуйте власні ID провайдерів, коли маєте більше ніж один сервер Ollama. Кожен провайдер отримує власний хост, моделі, автентифікацію, тайм-аут і посилання на моделі.

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

    Коли OpenClaw надсилає запит, активний префікс провайдера вилучається, тож `ollama-large/qwen3.5:27b` доходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі можуть відповідати на прості підказки, але мають труднощі з повною поверхнею інструментів агента. Почніть з обмеження інструментів і контексту, перш ніж змінювати глобальні налаштування середовища виконання.

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

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер стабільно дає збій на схемах інструментів. Це обмінює можливості агента на стабільність.
    `localModelLean` прибирає інструменти браузера, cron і повідомлень із поверхні агента, але не змінює контекст середовища виконання Ollama або режим мислення. Поєднуйте це з явними `params.num_ctx` і `params.thinking: false` для невеликих Qwen-подібних thinking-моделей, які зациклюються або витрачають бюджет відповіді на приховане міркування.

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

Також підтримуються користувацькі ідентифікатори провайдерів Ollama. Коли посилання на модель використовує активний
префікс провайдера, як-от `ollama-spark/qwen3:32b`, OpenClaw прибирає лише цей
префікс перед викликом Ollama, щоб сервер отримав `qwen3:32b`.

Для повільних локальних моделей спершу налаштовуйте запити на рівні провайдера, перш ніж збільшувати
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

`timeoutSeconds` застосовується до HTTP-запиту моделі, включно з установленням з'єднання,
заголовками, потоковою передачею тіла та повним перериванням захищеного отримання. `params.keep_alive`
передається в Ollama як верхньорівневий `keep_alive` для нативних запитів `/api/chat`;
задавайте його для кожної моделі, коли час завантаження першого ходу є вузьким місцем.

### Швидка перевірка

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Для віддалених хостів замініть `127.0.0.1` на хост, використаний у `baseUrl`. Якщо `curl` працює, а OpenClaw ні, перевірте, чи Gateway не працює на іншій машині, у контейнері або під іншим службовим обліковим записом.

## Вебпошук Ollama

OpenClaw підтримує **вебпошук Ollama** як вбудований провайдер `web_search`.

| Властивість | Подробиці                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` використовує розміщений API напряму |
| Автентифікація | Без ключа для локальних хостів Ollama із виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` чи хостів із захищеним доступом               |
| Вимога | Локальні/самостійно розміщені хости мають бути запущені й мати виконаний вхід через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` і справжній API-ключ Ollama |

Виберіть **вебпошук Ollama** під час `openclaw onboard` або `openclaw configure --section web`, або задайте:

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

Для локального демона з виконаним входом OpenClaw використовує проксі демона `/api/experimental/web_search`. Для `https://ollama.com` він викликає розміщену кінцеву точку `/api/web_search` напряму.

<Note>
Повні подробиці налаштування та поведінки див. у розділі [вебпошук Ollama](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **Виклик інструментів в OpenAI-сумісному режимі ненадійний.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо натомість потрібно використовувати OpenAI-сумісну кінцеву точку (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

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

    Цей режим може не підтримувати потокову передачу й виклик інструментів одночасно. Можливо, вам доведеться вимкнути потокову передачу за допомогою `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням вставляє `options.num_ctx`, щоб Ollama мовчки не відкотилася до контекстного вікна 4096. Якщо ваш проксі або upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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

  <Accordion title="Контекстні вікна">
    Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, про яке повідомляє Ollama, коли воно доступне, включно з більшими значеннями `PARAMETER num_ctx` із користувацьких Modelfile. Інакше він повертається до стандартного контекстного вікна Ollama, яке використовує OpenClaw.

    Ви можете задати стандартні значення `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера для кожної моделі цього провайдера Ollama, а потім перевизначати їх для окремих моделей за потреби. `contextWindow` — це бюджет підказки й Compaction в OpenClaw. Нативні запити Ollama залишають `options.num_ctx` незаданим, якщо ви явно не налаштували `params.num_ctx`, тож Ollama може застосувати власне значення моделі, `OLLAMA_CONTEXT_LENGTH` або стандарт на основі VRAM. Щоб обмежити або примусово задати контекст середовища виконання Ollama для кожного запиту без перебудови Modelfile, задайте `params.num_ctx`; недійсні, нульові, від'ємні та нескінченні значення ігноруються. OpenAI-сумісний адаптер Ollama і далі за замовчуванням вставляє `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це за допомогою `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Нативні записи моделей Ollama також приймають поширені параметри середовища виконання Ollama у `params`, включно з `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw передає лише ключі запиту Ollama, тому параметри середовища виконання OpenClaw, як-от `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надіслати верхньорівневий Ollama `think`; `false` вимикає мислення на рівні API для моделей мислення в стилі Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі також працює. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над стандартом агента.

  </Accordion>

  <Accordion title="Керування мисленням">
    Для нативних моделей Ollama OpenClaw передає керування мисленням так, як очікує Ollama: верхньорівневий `think`, а не `options.think`. Автоматично виявлені моделі, відповідь `/api/show` яких містить можливість `thinking`, показують `/think low`, `/think medium`, `/think high` і `/think max`; моделі без мислення показують лише `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Ви також можете задати стандарт для моделі:

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

    `params.think` або `params.thinking` для окремої моделі може вимкнути або примусово ввімкнути мислення API Ollama для конкретної налаштованої моделі. OpenClaw зберігає ці явні параметри моделі, коли активний запуск має лише неявне стандартне значення `off`; команди середовища виконання не `off`, як-от `/think medium`, усе одно перевизначають активний запуск.

  </Accordion>

  <Accordion title="Моделі міркування">
    OpenClaw за замовчуванням вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` здатними до міркування.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безплатна й працює локально, тому всі вартості моделей установлені в $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Ембеддинги пам'яті">
    Вбудований Plugin Ollama реєструє провайдер ембеддингів пам'яті для
    [пошуку в пам'яті](/uk/concepts/memory). Він використовує налаштований базовий URL Ollama
    та API-ключ, викликає поточну кінцеву точку Ollama `/api/embed` і за можливості об'єднує
    кілька фрагментів пам'яті в один запит `input`.

    | Властивість      | Значення               |
    | ------------- | ------------------- |
    | Стандартна модель | `nomic-embed-text`  |
    | Автоматичне завантаження     | Так — модель ембеддингів завантажується автоматично, якщо її немає локально |

    Ембеддинги під час запиту використовують префікси отримання для моделей, які їх потребують або рекомендують, зокрема `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам'яті залишаються сирими, щоб наявні індекси не потребували міграції формату.

    Щоб вибрати Ollama як провайдера ембеддингів для пошуку в пам'яті:

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

    Для віддаленого хоста ембеддингів тримайте автентифікацію обмеженою цим хостом:

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
    Інтеграція OpenClaw з Ollama за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує потокову передачу й виклик інструментів одночасно. Спеціальна конфігурація не потрібна.

    Для нативних запитів `/api/chat` OpenClaw також передає керування мисленням напряму в Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневий `think: false`, якщо не налаштовано явне значення моделі `params.think`/`params.thinking`, тоді як `/think low|medium|high` надсилають відповідний верхньорівневий рядок зусилля `think`. `/think max` зіставляється з найвищим нативним зусиллям Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісну кінцеву точку, див. розділ "Застарілий OpenAI-сумісний режим" вище. Потокова передача й виклик інструментів можуть не працювати одночасно в цьому режимі.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Цикл збоїв WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює systemd-модуль `ollama.service` із `Restart=always`. Якщо ця служба запускається автоматично й завантажує модель із підтримкою GPU під час завантаження WSL2, Ollama може закріпити пам'ять хоста, доки модель завантажується. Механізм повернення пам'яті Hyper-V не завжди може повернути ці закріплені сторінки, тому Windows може завершити VM WSL2, systemd знову запускає Ollama, і цикл повторюється.

    Типові ознаки:

    - повторні перезавантаження або завершення WSL2 з боку Windows
    - високе навантаження CPU в `app.slice` або `ollama.service` невдовзі після запуску WSL2
    - SIGTERM від systemd, а не подія Linux OOM-killer

    OpenClaw реєструє попередження під час запуску, коли виявляє WSL2, увімкнений `ollama.service` з `Restart=always` і видимі маркери CUDA.

    Пом’якшення:

    ```bash
    sudo systemctl disable ollama
    ```

    Додайте це до `%USERPROFILE%\.wslconfig` на стороні Windows, а потім виконайте `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Задайте коротший keep-alive у середовищі сервісу Ollama або запускайте Ollama вручну лише тоді, коли він потрібен:

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
    Якщо вашої моделі немає в списку, або завантажте модель локально, або явно визначте її в `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="У з’єднанні відмовлено">
    Перевірте, що Ollama запущено на правильному порту:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Віддалений хост працює з curl, але не з OpenClaw">
    Перевірте з тієї самої машини та runtime, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Поширені причини:

    - `baseUrl` вказує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає OpenAI-сумісну поведінку замість нативної Ollama.
    - Віддаленому хосту потрібні зміни firewall або прив’язки LAN на стороні Ollama.
    - Модель є в daemon вашого ноутбука, але відсутня у віддаленому daemon.

  </Accordion>

  <Accordion title="Модель виводить JSON інструменту як текст">
    Зазвичай це означає, що провайдер використовує OpenAI-сумісний режим або модель не може обробляти схеми інструментів.

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

    Якщо мала локальна модель усе ще не справляється зі схемами інструментів, задайте `compat.supportsTools: false` у записі цієї моделі й протестуйте знову.

  </Accordion>

  <Accordion title="Kimi або GLM повертає спотворені символи">
    Розміщені відповіді Kimi/GLM, які є довгими, немовними послідовностями символів, обробляються як невдалий вивід провайдера, а не як успішна відповідь асистента. Це дає змогу звичайній повторній спробі, fallback або обробці помилок перебрати керування без збереження пошкодженого тексту в сесії.

    Якщо це повторюється, зафіксуйте сире ім’я моделі, поточний файл сесії та чи використовував запуск `Cloud + Local` або `Cloud only`, а потім спробуйте нову сесію та fallback-модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодна локальна модель завершується за тайм-аутом">
    Великим локальним моделям може знадобитися тривале перше завантаження, перш ніж почнеться streaming. Обмежте timeout провайдером Ollama і, за бажанням, попросіть Ollama тримати модель завантаженою між ходами:

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

    Якщо сам хост повільно приймає з’єднання, `timeoutSeconds` також подовжує захищений timeout з’єднання Undici для цього провайдера.

  </Accordion>

  <Accordion title="Модель із великим контекстом занадто повільна або вичерпує пам’ять">
    Багато моделей Ollama оголошують контексти, які більші, ніж ваше обладнання може комфортно виконувати. Нативна Ollama використовує власний стандартний runtime-контекст Ollama, якщо ви не задасте `params.num_ctx`. Обмежте і бюджет OpenClaw, і контекст запиту Ollama, коли вам потрібна передбачувана затримка до першого токена:

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

    Спочатку зменште `contextWindow`, якщо OpenClaw надсилає забагато prompt. Зменште `params.num_ctx`, якщо Ollama завантажує runtime-контекст, завеликий для машини. Зменште `maxTokens`, якщо генерація триває надто довго.

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Вебпошук Ollama" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повне налаштування та подробиці поведінки для вебпошуку на базі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
