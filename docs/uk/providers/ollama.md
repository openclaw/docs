---
read_when:
    - Ви хочете запускати OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні інструкції з налаштування та конфігурації Ollama
    - Вам потрібні візійні моделі Ollama для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-29T03:41:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/self-hosted серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` з `https://ollama.com` або `Local only` з доступним хостом Ollama.

<Warning>
**Користувачі віддаленого Ollama**: Не використовуйте OpenAI-сумісну URL-адресу `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклик інструментів, і моделі можуть виводити необроблений JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами в стилі OpenAI SDK, але нова конфігурація має віддавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Локальні хости Ollama та хости Ollama в LAN не потребують справжнього bearer-токена. OpenClaw використовує локальний маркер `ollama-local` лише для loopback, приватної мережі, `.local` і базових URL Ollama з простим іменем хоста.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера.
  </Accordion>
  <Accordion title="Custom provider ids">
    Користувацькі ідентифікатори провайдерів, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, який вказує на приватний LAN-хост Ollama, може використовувати `apiKey: "ollama-local"`, а субагенти розв’язуватимуть цей маркер через хук провайдера Ollama замість того, щоб трактувати його як відсутні облікові дані. Пошук пам’яті також може задати `agents.defaults.memorySearch.provider` на цей користувацький ідентифікатор провайдера, щоб embeddings використовували відповідну кінцеву точку Ollama.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` зберігає облікові дані для ідентифікатора провайдера. Розміщуйте налаштування кінцевої точки (`baseUrl`, `api`, ідентифікатори моделей, заголовки, тайм-аути) у `models.providers.<id>`. Старі пласкі файли auth-profile на кшталт `{ "ollama-windows": { "apiKey": "ollama-local" } }` не є runtime-форматом; запустіть `openclaw doctor --fix`, щоб переписати їх у канонічний профіль API-ключа `ollama-windows:default` із резервною копією. `baseUrl` у цьому файлі є шумом сумісності, і його слід перенести до конфігурації провайдера.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Коли Ollama використовується для embeddings пам’яті, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ рівня провайдера надсилається лише до хоста Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише до його віддаленого хоста embeddings.
    - Чисте значення env `OLLAMA_API_KEY` трактується як домовленість Ollama Cloud і за замовчуванням не надсилається до локальних або self-hosted хостів.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Найкраще для:** найшвидшого шляху до робочого хмарного або локального налаштування Ollama.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі

      </Step>
      <Step title="Select a model">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує розміщені хмарні значення за замовчуванням. `Cloud + Local` і `Local only` запитують базову URL-адресу Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, наприклад `gemma4:latest`, налаштування показує цю встановлену модель один раз замість того, щоб показувати і `gemma4`, і `gemma4:latest` або знову завантажувати голий псевдонім. `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов в обліковий запис для хмарного доступу.
      </Step>
      <Step title="Verify the model is available">
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

    За бажанням укажіть користувацьку базову URL-адресу або модель:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **Найкраще для:** повного контролю над хмарним або локальним налаштуванням.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: установіть Ollama, увійдіть за допомогою `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: установіть Ollama з [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        Для `Cloud only` використовуйте справжній `OLLAMA_API_KEY`. Для налаштувань із хостом працює будь-яке значення-заповнювач:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або задайте значення за замовчуванням у конфігурації:

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
    `Cloud + Local` використовує доступний хост Ollama як контрольну точку і для локальних, і для хмарних моделей. Це бажаний гібридний потік Ollama.

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує базову URL-адресу Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи хост увійшов в обліковий запис для хмарного доступу за допомогою `ollama signin`. Коли хост увійшов в обліковий запис, OpenClaw також пропонує розміщені хмарні значення за замовчуванням, як-от `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо хост ще не увійшов в обліковий запис, OpenClaw зберігає налаштування лише локальним, доки ви не запустите `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, задає `baseUrl: "https://ollama.com"` і початково заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється наживо з `https://ollama.com/api/tags`, з обмеженням у 500 записів, тож вибір відображає поточний розміщений каталог, а не статичний початковий набір. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих пропозицій, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локально OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або self-hosted серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як локальне значення за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` чи іншого користувацького віддаленого провайдера з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Подробиці                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Запитує `/api/tags`                                                                                                                                                  |
| Виявлення можливостей | Використовує best-effort пошуки `/api/show`, щоб прочитати `contextWindow`, розширені параметри Modelfile `num_ctx` і можливості, зокрема vision/tools              |
| Vision-моделі        | Моделі з можливістю `vision`, повідомленою `/api/show`, позначаються як придатні для зображень (`input: ["text", "image"]`), тож OpenClaw автоматично вставляє зображення в prompt |
| Виявлення reasoning  | Використовує можливості `/api/show`, коли вони доступні, зокрема `thinking`; повертається до евристики за назвою моделі (`r1`, `reasoning`, `think`), коли Ollama пропускає можливості |
| Обмеження токенів    | Задає `maxTokens` на стандартну максимальну межу токенів Ollama, яку використовує OpenClaw                                                                           |
| Вартість             | Задає всі вартості як `0`                                                                                                                                            |

Це дає змогу уникнути ручних записів моделей, водночас підтримуючи каталог узгодженим із локальним екземпляром Ollama. Ви можете використовувати повне посилання на кшталт `ollama/<pulled-model>:latest` у локальному `infer model run`; OpenClaw розв’язує цю встановлену модель із живого каталогу Ollama без потреби у власноруч написаному записі `models.json`.

Для хостів Ollama, які увійшли в обліковий запис, деякі моделі `:cloud` можуть бути доступні через `/api/chat`
і `/api/show` до того, як вони з’являться в `/api/tags`. Коли ви явно вибираєте
повне посилання `ollama/<model>:cloud`, OpenClaw перевіряє саме цю відсутню модель через
`/api/show` і додає її до runtime-каталогу лише якщо Ollama підтверджує
метадані моделі. Одруки все одно завершуються помилкою як невідомі моделі, а не створюються автоматично.

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

Цей шлях усе ще використовує налаштованого провайдера OpenClaw, автентифікацію та нативний
транспорт Ollama, але не запускає хід chat-agent і не завантажує контекст MCP/інструментів. Якщо
це спрацьовує, а звичайні відповіді агента не спрацьовують, далі усувайте проблеми з
prompt агента моделі або місткістю інструментів.

Для вузького smoke-тесту vision-моделі тим самим легким шляхом додайте один або кілька
файлів зображень до `infer model run`. Це надсилає prompt і зображення безпосередньо до
вибраної vision-моделі Ollama без завантаження chat-інструментів, пам’яті або попереднього
контексту сесії:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` приймає файли, визначені як `image/*`, зокрема поширені вхідні PNG,
JPEG і WebP. Файли, що не є зображеннями, відхиляються до виклику Ollama.
Для розпізнавання мовлення використовуйте натомість `openclaw infer audio transcribe`.

Коли ви перемикаєте розмову за допомогою `/model ollama/<model>`, OpenClaw трактує
це як точний вибір користувача. Якщо налаштований `baseUrl` Ollama
недоступний, наступна відповідь завершується помилкою провайдера замість того, щоб непомітно
відповісти з іншої налаштованої резервної моделі.

Ізольовані Cron-завдання виконують одну додаткову локальну перевірку безпеки перед запуском ходу агента. Якщо вибрана модель розв’язується до локального, приватно-мережевого або `.local` провайдера Ollama і `/api/tags` недоступний, OpenClaw записує цей запуск Cron як `skipped` із вибраним `ollama/<model>` у тексті помилки. Передперевірка кінцевої точки кешується на 5 хвилин, тому кілька Cron-завдань, спрямованих на той самий зупинений демон Ollama, не запускають усі невдалі запити до моделі.

Перевірте наживо локальний текстовий шлях, шлях нативного потоку й embeddings для локального Ollama за допомогою:

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
Якщо ви явно задаєте `models.providers.ollama` або налаштовуєте власного віддаленого провайдера, наприклад `models.providers.ollama-cloud` з `api: "ollama"`, автоматичне виявлення пропускається, і моделі потрібно визначати вручну. Власні loopback-провайдери, як-от `http://127.0.0.2:11434`, усе одно вважаються локальними. Див. розділ явної конфігурації нижче.
</Note>

## Зір і опис зображень

Вбудований Ollama Plugin реєструє Ollama як медіа-провайдера з підтримкою зображень для розуміння медіа. Це дає OpenClaw змогу маршрутизувати явні запити на опис зображень і налаштовані типові значення моделей зображень через локальні або хостингові vision-моделі Ollama.

Для локального зору завантажте модель, що підтримує зображення:

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

`--model` має бути повним посиланням `<provider/model>`. Коли його задано, `openclaw infer image describe` запускає цю модель напряму замість пропуску опису через те, що модель підтримує нативний зір.

Використовуйте `infer image describe`, коли потрібні потік провайдера розуміння зображень OpenClaw, налаштований `agents.defaults.imageModel` і форма вихідного опису зображення. Використовуйте `infer model run --file`, коли потрібна сира перевірка мультимодальної моделі з власним prompt і одним або кількома зображеннями.

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

Віддавайте перевагу повному посиланню `ollama/<model>`. Якщо та сама модель перелічена в `models.providers.ollama.models` з `input: ["text", "image"]` і жоден інший налаштований провайдер зображень не надає цей голий ID моделі, OpenClaw також нормалізує голе посилання `imageModel`, наприклад `qwen2.5vl:7b`, до `ollama/qwen2.5vl:7b`. Якщо більше ніж один налаштований провайдер зображень має той самий голий ID, явно використовуйте префікс провайдера.

Повільним локальним vision-моделям може знадобитися довший timeout для розуміння зображень, ніж хмарним моделям. Вони також можуть аварійно завершуватися або зупинятися, коли Ollama намагається виділити повний заявлений vision-контекст на обмеженому обладнанні. Задайте timeout для capability і обмежте `num_ctx` у записі моделі, коли вам потрібен лише звичайний хід опису зображення:

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

Цей timeout застосовується до розуміння вхідних зображень і до явного інструмента `image`, який агент може викликати під час ходу. `models.providers.ollama.timeoutSeconds` на рівні провайдера й надалі керує базовим запобіжником HTTP-запиту Ollama для звичайних викликів моделі.

Перевірте наживо явний інструмент зображень для локального Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви вручну визначаєте `models.providers.ollama.models`, позначайте vision-моделі підтримкою введення зображень:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити опису зображень для моделей, не позначених як сумісні із зображеннями. За неявного виявлення OpenClaw читає це з Ollama, коли `/api/show` повідомляє про vision capability.

## Конфігурація

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Найпростіший шлях увімкнення лише локально — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо `OLLAMA_API_KEY` задано, можна опустити `apiKey` у записі провайдера, і OpenClaw заповнить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Використовуйте явну конфігурацію, коли потрібне хостингове хмарне налаштування, Ollama працює на іншому хості/порту, потрібно примусово задати конкретні вікна контексту або списки моделей, чи потрібні повністю ручні визначення моделей.

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

  <Tab title="Custom base URL">
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автоматичне виявлення, тому визначайте моделі вручну):

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
    Не додавайте `/v1` до URL. Шлях `/v1` використовує режим, сумісний з OpenAI, у якому tool calling ненадійний. Використовуйте базовий URL Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

## Поширені рецепти

Використовуйте їх як стартові точки й замінюйте ID моделей на точні назви з `ollama list` або `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
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

  <Accordion title="LAN Ollama host with manual models">
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

    `contextWindow` — це бюджет контексту на боці OpenClaw. `params.num_ctx` надсилається до Ollama для запиту. Тримайте їх узгодженими, коли ваше обладнання не може запустити повний заявлений контекст моделі.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Використовуйте це, коли ви не запускаєте локальний демон і хочете напряму використовувати хостингові моделі Ollama.

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

  <Accordion title="Cloud plus local through a signed-in daemon">
    Використовуйте це, коли локальний або LAN-демон Ollama увійшов у систему через `ollama signin` і має обслуговувати як локальні моделі, так і моделі `:cloud`.

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

  <Accordion title="Multiple Ollama hosts">
    Використовуйте власні ID провайдерів, коли маєте більше ніж один сервер Ollama. Кожен провайдер отримує власний хост, моделі, автентифікацію, timeout і посилання на моделі.

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

    Коли OpenClaw надсилає запит, активний префікс провайдера прибирається, тому `ollama-large/qwen3.5:27b` доходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Деякі локальні моделі можуть відповідати на прості prompts, але мають труднощі з повною поверхнею інструментів агента. Почніть з обмеження інструментів і контексту, перш ніж змінювати глобальні налаштування runtime.

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

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер стабільно не працюють зі схемами інструментів. Це обмінює можливості агента на стабільність.
    `localModelLean` прибирає браузер, cron та інструменти повідомлень із поверхні агента, але не змінює runtime-контекст Ollama або режим мислення. Поєднуйте це з явними `params.num_ctx` і `params.thinking: false` для невеликих моделей мислення у стилі Qwen, які зациклюються або витрачають бюджет відповіді на приховане міркування.

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

Також підтримуються користувацькі ідентифікатори провайдера Ollama. Коли посилання на модель використовує префікс активного провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw видаляє лише цей префікс перед викликом Ollama, щоб сервер отримав `qwen3:32b`.

Для повільних локальних моделей віддавайте перевагу налаштуванню запитів у межах провайдера перед збільшенням загального тайм-ауту runtime агента:

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

`timeoutSeconds` застосовується до HTTP-запиту моделі, включно з установленням з’єднання, заголовками, потоковою передачею тіла та загальним перериванням guarded-fetch. `params.keep_alive` передається до Ollama як верхньорівневий `keep_alive` у нативних запитах `/api/chat`; встановлюйте його для окремої моделі, коли час завантаження першого ходу є вузьким місцем.

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

OpenClaw підтримує **вебпошук Ollama** як вбудованого провайдера `web_search`.

| Властивість | Деталь                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` використовує розміщений API напряму |
| Автентифікація | Без ключа для локальних хостів Ollama з виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` чи хостів, захищених автентифікацією |
| Вимога      | Локальні/самостійно розміщені хости мають бути запущені та з виконаним входом через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` і справжнього API-ключа Ollama |

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

Для локального daemon із виконаним входом OpenClaw використовує проксі `/api/experimental/web_search` цього daemon. Для `https://ollama.com` він напряму викликає розміщений endpoint `/api/web_search`.

<Note>
Повне налаштування та подробиці поведінки див. у [вебпошуку Ollama](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **Виклики інструментів ненадійні в OpenAI-сумісному режимі.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо натомість потрібно використовувати OpenAI-сумісний endpoint (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

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

    Цей режим може не підтримувати потокову передачу та виклики інструментів одночасно. Може знадобитися вимкнути потокову передачу за допомогою `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw типово ін’єктує `options.num_ctx`, щоб Ollama не повертався непомітно до контекстного вікна 4096. Якщо ваш проксі/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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
    Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, повідомлене Ollama, коли воно доступне, включно з більшими значеннями `PARAMETER num_ctx` із користувацьких Modelfile. Інакше він повертається до стандартного контекстного вікна Ollama, яке використовує OpenClaw.

    Ви можете встановити стандартні значення `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера для кожної моделі під цим провайдером Ollama, а потім за потреби перевизначати їх для окремих моделей. `contextWindow` — це бюджет prompt і Compaction в OpenClaw. Нативні запити Ollama залишають `options.num_ctx` незаданим, якщо ви явно не налаштуєте `params.num_ctx`, щоб Ollama міг застосувати власне стандартне значення моделі, `OLLAMA_CONTEXT_LENGTH` або значення на основі VRAM. Щоб обмежити або примусово задати runtime-контекст Ollama для окремого запиту без перебудови Modelfile, задайте `params.num_ctx`; недійсні, нульові, від’ємні та нескінченні значення ігноруються. OpenAI-сумісний адаптер Ollama все ще типово ін’єктує `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це за допомогою `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Нативні записи моделей Ollama також приймають загальні runtime-параметри Ollama у `params`, включно з `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw передає лише ключі запиту Ollama, тому runtime-параметри OpenClaw, такі як `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надсилати верхньорівневий Ollama `think`; `false` вимикає мислення на рівні API для моделей мислення у стилі Qwen.

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

    Також працює `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над стандартним значенням агента.

  </Accordion>

  <Accordion title="Керування мисленням">
    Для нативних моделей Ollama OpenClaw передає керування мисленням так, як очікує Ollama: верхньорівневий `think`, а не `options.think`. Автоматично виявлені моделі, відповідь `/api/show` яких містить можливість `thinking`, показують `/think low`, `/think medium`, `/think high` і `/think max`; моделі без мислення показують лише `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Ви також можете задати стандартне значення моделі:

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

    `params.think` або `params.thinking` для окремої моделі може вимкнути або примусово ввімкнути мислення Ollama API для конкретної налаштованої моделі. OpenClaw зберігає ці явні параметри моделі, коли активний запуск має лише неявне стандартне значення `off`; runtime-команди не `off`, такі як `/think medium`, усе одно перевизначають активний запуск.

  </Accordion>

  <Accordion title="Моделі міркування">
    OpenClaw типово вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` здатними до міркування.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безкоштовний і працює локально, тому вартість усіх моделей задано як $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Вбудовування пам’яті">
    Вбудований Plugin Ollama реєструє провайдера вбудовувань пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштований базовий URL Ollama
    і API-ключ, викликає поточний endpoint `/api/embed` Ollama та за можливості об’єднує
    кілька фрагментів пам’яті в один запит `input`.

    | Властивість       | Значення            |
    | ------------- | ------------------- |
    | Стандартна модель | `nomic-embed-text`  |
    | Автоматичне завантаження | Так — модель вбудовувань автоматично завантажується, якщо її немає локально |

    Вбудовування під час запиту використовують префікси retrieval для моделей, які їх потребують або рекомендують, включно з `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам’яті залишаються необробленими, щоб наявні індекси не потребували міграції формату.

    Щоб вибрати Ollama як провайдера вбудовувань для пошуку в пам’яті:

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

    Для віддаленого хоста вбудовувань обмежуйте автентифікацію цим хостом:

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

  <Accordion title="Конфігурація потокового передавання">
    Інтеграція OpenClaw з Ollama за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує потокове передавання та виклик інструментів одночасно. Спеціальна конфігурація не потрібна.

    Для нативних запитів `/api/chat` OpenClaw також передає керування міркуванням безпосередньо в Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневе `think: false`, якщо не налаштовано явне значення моделі `params.think`/`params.thinking`, тоді як `/think low|medium|high` надсилають відповідний верхньорівневий рядок зусилля `think`. `/think max` зіставляється з найвищим нативним зусиллям Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісний endpoint, див. розділ "Застарілий OpenAI-сумісний режим" вище. У цьому режимі потокове передавання та виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Цикл аварійного завершення WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює systemd unit `ollama.service` з `Restart=always`. Якщо цей сервіс автоматично запускається і завантажує модель із підтримкою GPU під час запуску WSL2, Ollama може закріпити пам'ять хоста під час завантаження моделі. Механізм повернення пам'яті Hyper-V не завжди може звільнити ці закріплені сторінки, тому Windows може завершити VM WSL2, systemd знову запускає Ollama, і цикл повторюється.

    Типові ознаки:

    - повторні перезавантаження або завершення WSL2 з боку Windows
    - високе навантаження CPU в `app.slice` або `ollama.service` невдовзі після запуску WSL2
    - SIGTERM від systemd, а не подія Linux OOM-killer

    OpenClaw записує попередження під час запуску, коли виявляє WSL2, увімкнений `ollama.service` з `Restart=always` і видимі маркери CUDA.

    Пом'якшення:

    ```bash
    sudo systemctl disable ollama
    ```

    Додайте це до `%USERPROFILE%\.wslconfig` на боці Windows, а потім виконайте `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Задайте коротший keep-alive в середовищі сервісу Ollama або запускайте Ollama вручну лише тоді, коли вона потрібна:

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
    Якщо вашої моделі немає в списку, завантажте модель локально або явно визначте її в `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="У з'єднанні відмовлено">
    Перевірте, що Ollama працює на правильному порту:

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

    Типові причини:

    - `baseUrl` вказує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає OpenAI-сумісну поведінку замість нативної Ollama.
    - Віддалений хост потребує змін firewall або прив'язування LAN на боці Ollama.
    - Модель присутня в daemon на вашому ноутбуці, але не у віддаленому daemon.

  </Accordion>

  <Accordion title="Модель виводить JSON інструмента як текст">
    Зазвичай це означає, що провайдер використовує OpenAI-сумісний режим або модель не може обробляти схеми інструментів.

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

    Якщо невелика локальна модель усе ще не працює зі схемами інструментів, задайте `compat.supportsTools: false` для цього запису моделі та повторіть тест.

  </Accordion>

  <Accordion title="Kimi або GLM повертає спотворені символи">
    Hosted-відповіді Kimi/GLM, які є довгими нелінгвістичними послідовностями символів, обробляються як невдалий вивід провайдера, а не як успішна відповідь асистента. Це дає змогу звичайному повтору, fallback або обробці помилок взяти керування на себе без збереження пошкодженого тексту в сесії.

    Якщо це повторюється, зафіксуйте raw-назву моделі, поточний файл сесії та чи використовував запуск `Cloud + Local` або `Cloud only`, а потім спробуйте нову сесію та fallback-модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує час очікування">
    Великим локальним моделям може знадобитися тривале перше завантаження перед початком потокового передавання. Обмежте timeout провайдером Ollama і, за потреби, попросіть Ollama тримати модель завантаженою між ходами:

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

    Якщо сам хост повільно приймає з'єднання, `timeoutSeconds` також розширює захищений timeout підключення Undici для цього провайдера.

  </Accordion>

  <Accordion title="Модель із великим контекстом надто повільна або вичерпує пам'ять">
    Багато моделей Ollama оголошують контексти, більші за ті, які ваше обладнання може комфортно запускати. Нативна Ollama використовує власне стандартне значення runtime-контексту Ollama, якщо ви не задаєте `params.num_ctx`. Обмежте і бюджет OpenClaw, і контекст запиту Ollama, коли потрібна передбачувана затримка до першого токена:

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

    Спочатку зменште `contextWindow`, якщо OpenClaw надсилає забагато prompt. Зменште `params.num_ctx`, якщо Ollama завантажує runtime-контекст, який завеликий для машини. Зменште `maxTokens`, якщо генерація триває надто довго.

  </Accordion>
</AccordionGroup>

<Note>
Більше довідки: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, refs моделей і поведінки failover.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="Вебпошук Ollama" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повне налаштування та деталі поведінки вебпошуку на основі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
