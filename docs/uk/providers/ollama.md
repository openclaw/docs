---
read_when:
    - Ви хочете запускати OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки з налаштування та конфігурації Ollama
    - Вам потрібні моделі комп’ютерного зору Ollama для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-06-27T18:12:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/самостійно розміщених серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` із `https://ollama.com` або `Local only` через доступний хост Ollama.

OpenClaw також реєструє `ollama-cloud` як повноцінний ідентифікатор розміщеного провайдера для
прямого використання Ollama Cloud. Використовуйте посилання на кшталт `ollama-cloud/kimi-k2.5:cloud`, коли
потрібна маршрутизація лише до хмари без спільного використання локального ідентифікатора провайдера `ollama`.

Окрему сторінку налаштування лише для хмари див. у [Ollama Cloud](/uk/providers/ollama-cloud).

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте OpenAI-сумісну URL-адресу `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклики інструментів, і моделі можуть виводити необроблений JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації слід надавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Локальні та LAN-хости Ollama не потребують справжнього bearer-токена. OpenClaw використовує локальний маркер `ollama-local` лише для loopback, приватної мережі, `.local` і URL-адрес базового хоста Ollama без домену.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера. Для прямого розміщеного використання надавайте перевагу провайдеру `ollama-cloud`.
  </Accordion>
  <Accordion title="Custom provider ids">
    Користувацькі ідентифікатори провайдерів, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, який вказує на приватний LAN-хост Ollama, може використовувати `apiKey: "ollama-local"`, і субагенти розв’язуватимуть цей маркер через hook провайдера Ollama, а не вважатимуть його відсутніми обліковими даними. Пошук у пам’яті також може задати `agents.defaults.memorySearch.provider` на цей користувацький ідентифікатор провайдера, щоб embeddings використовували відповідну кінцеву точку Ollama.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` зберігає облікові дані для ідентифікатора провайдера. Розміщуйте параметри кінцевої точки (`baseUrl`, `api`, ідентифікатори моделей, заголовки, тайм-аути) у `models.providers.<id>`. Старі пласкі файли профілів автентифікації, як-от `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не є runtime-форматом; запустіть `openclaw doctor --fix`, щоб переписати їх у канонічний профіль API-ключа `ollama-windows:default` із резервною копією. `baseUrl` у цьому файлі є шумом сумісності й має бути перенесений у конфігурацію провайдера.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Коли Ollama використовується для memory embeddings, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ на рівні провайдера надсилається лише на хост Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише на його віддалений хост embeddings.
    - Чисте значення env `OLLAMA_API_KEY` трактується як конвенція Ollama Cloud і за замовчуванням не надсилається локальним або самостійно розміщеним хостам.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний метод налаштування та режим.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Найкраще для:** найшвидший шлях до робочого хмарного або локального налаштування Ollama.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Choose your mode">
        - **Хмара + локально** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Лише хмара** — розміщені моделі Ollama через `https://ollama.com`
        - **Лише локально** — лише локальні моделі

      </Step>
      <Step title="Select a model">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує розміщені хмарні значення за замовчуванням. `Cloud + Local` і `Local only` запитують базову URL-адресу Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, як-от `gemma4:latest`, налаштування показує цю встановлену модель один раз, а не показує одночасно `gemma4` і `gemma4:latest` чи знову завантажує голий псевдонім. `Cloud + Local` також перевіряє, чи цей хост Ollama виконал вхід для хмарного доступу.
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
    **Найкраще для:** повний контроль над хмарним або локальним налаштуванням.

    <Steps>
      <Step title="Choose cloud or local">
        - **Хмара + локально**: установіть Ollama, увійдіть за допомогою `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Лише хмара**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Лише локально**: установіть Ollama з [ollama.com/download](https://ollama.com/download)

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
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для налаштувань, підтриманих хостом, підійде будь-яке placeholder-значення:

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
    `Cloud + Local` використовує доступний хост Ollama як точку керування для локальних і хмарних моделей. Це бажаний гібридний потік Ollama.

    Використовуйте **Хмара + локально** під час налаштування. OpenClaw запитує базову URL-адресу Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи хост увійшов для хмарного доступу за допомогою `ollama signin`. Коли хост увійшов, OpenClaw також пропонує розміщені хмарні значення за замовчуванням, як-от `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо хост ще не увійшов, OpenClaw залишає налаштування лише локальним, доки ви не запустите `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Використовуйте **Лише хмара** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, задає `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється наживо з `https://ollama.com/api/tags` з обмеженням у 500 записів, тому вибір відображає поточний розміщений каталог, а не статичне початкове наповнення. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих пропозицій, щоб onboarding усе одно завершився.

    Ви також можете налаштувати повноцінного хмарного провайдера напряму:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    У режимі лише локально OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або самостійно розміщених серверів Ollama.

    OpenClaw наразі пропонує `gemma4` як локальне значення за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` або іншого користувацького віддаленого провайдера з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Деталі                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Запитує `/api/tags`                                                                                                                                                  |
| Визначення можливостей | Використовує best-effort запити `/api/show`, щоб прочитати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, зокрема vision/tools             |
| Vision-моделі        | Моделі з можливістю `vision`, повідомленою `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення в prompt |
| Визначення reasoning | Використовує можливості `/api/show`, коли вони доступні, зокрема `thinking`; повертається до евристики за назвою моделі (`r1`, `reasoning`, `think`), коли Ollama пропускає можливості |
| Ліміти токенів       | Задає `maxTokens` на стандартну межу max-token Ollama, яку використовує OpenClaw                                                                                     |
| Вартість             | Задає всі вартості як `0`                                                                                                                                            |

Це усуває потребу в ручних записах моделей, зберігаючи каталог узгодженим із локальним екземпляром Ollama. Ви можете використовувати повне посилання, як-от `ollama/<pulled-model>:latest`, у локальному `infer model run`; OpenClaw розв’язує цю встановлену модель із live-каталогу Ollama без потреби в написаному вручну записі `models.json`.

Для хостів Ollama з виконаним входом деякі моделі `:cloud` можуть бути доступні через `/api/chat`
і `/api/show` до того, як вони з’являться в `/api/tags`. Коли ви явно вибираєте
повне посилання `ollama/<model>:cloud`, OpenClaw перевіряє саме цю відсутню модель через
`/api/show` і додає її до runtime-каталогу лише якщо Ollama підтверджує metadata
моделі. Помилки введення все одно завершуються як невідомі моделі, а не створюються автоматично.

```bash
# See what models are available
ollama list
openclaw models list
```

Для вузького smoke-тесту генерації тексту, який уникає повної поверхні інструментів агента,
використовуйте локальний `infer model run` з повним посиланням на модель Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Цей шлях усе ще використовує налаштованого провайдера OpenClaw, автентифікацію та нативний
транспорт Ollama, але не запускає turn чат-агента і не завантажує MCP/контекст інструментів. Якщо
це проходить успішно, а звичайні відповіді агента не працюють, далі діагностуйте prompt агента моделі
та місткість інструментів.

Для вузького smoke-тесту vision-моделі на тому самому легкому шляху додайте один або кілька
файлів зображень до `infer model run`. Це надсилає prompt і зображення безпосередньо до
вибраної vision-моделі Ollama без завантаження чат-інструментів, пам’яті або попереднього
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

`model run --file` приймає файли, визначені як `image/*`, зокрема поширені вхідні дані PNG,
JPEG і WebP. Файли, що не є зображеннями, відхиляються до виклику Ollama.
Для розпізнавання мовлення натомість використовуйте `openclaw infer audio transcribe`.

Коли ви перемикаєте розмову за допомогою `/model ollama/<model>`, OpenClaw вважає
це точним вибором користувача. Якщо налаштований Ollama `baseUrl`
недоступний, наступна відповідь завершиться помилкою провайдера, а не мовчазно
відповість з іншої налаштованої резервної моделі.

Ізольовані Cron-завдання виконують одну додаткову локальну перевірку безпеки перед запуском
ходу агента. Якщо вибрана модель розв’язується до локального, приватно-мережевого або `.local`
провайдера Ollama і `/api/tags` недоступний, OpenClaw записує цей запуск Cron
як `skipped` з вибраним `ollama/<model>` у тексті помилки. Попередня перевірка
ендпойнта кешується на 5 хвилин, тому кілька Cron-завдань, спрямованих на той самий
зупинений демон Ollama, не запускатимуть усі помилкові запити до моделі.

Перевірте наживо локальний текстовий шлях, шлях нативного потоку та embeddings щодо
локального Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Для smoke-тестів Ollama Cloud з API-ключем спрямуйте live-тест на `https://ollama.com`
і виберіть розміщену модель з поточного каталогу:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Cloud-smoke запускає текст, нативний потік і вебпошук. Він типово пропускає embeddings для
`https://ollama.com`, оскільки API-ключі Ollama Cloud можуть не авторизувати
`/api/embed`. Установіть `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, коли ви явно хочете,
щоб live-тест завершувався помилкою, якщо налаштований хмарний ключ не може використовувати embed-ендпойнт.

Щоб додати нову модель, просто завантажте її через Ollama:

```bash
ollama pull mistral
```

Нову модель буде автоматично виявлено, і вона стане доступною для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama` або налаштовуєте власного віддаленого провайдера, наприклад `models.providers.ollama-cloud` з `api: "ollama"`, автоматичне виявлення пропускається, і вам потрібно визначити моделі вручну. Власні loopback-провайдери, як-от `http://127.0.0.2:11434`, усе одно вважаються локальними. Див. розділ явної конфігурації нижче.
</Note>

## Vision і опис зображень

Вбудований Ollama Plugin реєструє Ollama як провайдера розуміння медіа з підтримкою зображень. Це дає OpenClaw змогу маршрутизувати явні запити опису зображень і налаштовані типові значення моделей зображень через локальні або розміщені vision-моделі Ollama.

Для локального vision завантажте модель, що підтримує зображення:

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

`--model` має бути повним посиланням `<provider/model>`. Коли його встановлено, `openclaw infer image describe` запускає цю модель напряму, а не пропускає опис через те, що модель підтримує нативний vision.

Використовуйте `infer image describe`, коли вам потрібен потік OpenClaw для провайдера розуміння зображень, налаштований `agents.defaults.imageModel` і форма виводу опису зображення. Використовуйте `infer model run --file`, коли вам потрібна сира перевірка мультимодальної моделі з власним prompt і одним або кількома зображеннями.

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

Віддавайте перевагу повному посиланню `ollama/<model>`. Якщо та сама модель зазначена в `models.providers.ollama.models` з `input: ["text", "image"]` і жоден інший налаштований провайдер зображень не надає цей bare ID моделі, OpenClaw також нормалізує bare-посилання `imageModel`, як-от `qwen2.5vl:7b`, до `ollama/qwen2.5vl:7b`. Якщо більше ніж один налаштований провайдер зображень має той самий bare ID, явно використовуйте префікс провайдера.

Повільним локальним vision-моделям може знадобитися довший таймаут розуміння зображень, ніж хмарним моделям. Вони також можуть аварійно завершуватися або зупинятися, коли Ollama намагається виділити повний заявлений vision-контекст на обмеженому обладнанні. Установіть таймаут capability і обмежте `num_ctx` у записі моделі, коли вам потрібен лише звичайний хід опису зображення:

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

Цей таймаут застосовується до вхідного розуміння зображень і до явного інструмента `image`, який агент може викликати під час ходу. `models.providers.ollama.timeoutSeconds` на рівні провайдера все ще керує базовим обмежувачем HTTP-запиту Ollama для звичайних викликів моделей.

Перевірте наживо явний інструмент зображень щодо локального Ollama за допомогою:

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

OpenClaw відхиляє запити опису зображень для моделей, які не позначені як сумісні із зображеннями. За неявного виявлення OpenClaw читає це з Ollama, коли `/api/show` повідомляє про vision capability.

## Конфігурація

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Найпростіший шлях увімкнення лише для локального середовища — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо `OLLAMA_API_KEY` встановлено, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw заповнить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Використовуйте явну конфігурацію, коли вам потрібне хмарне розміщення, Ollama працює на іншому хості/порту, ви хочете примусово задати конкретні вікна контексту або списки моделей, чи вам потрібні повністю ручні визначення моделей.

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
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автоматичне виявлення, тому визначте моделі вручну):

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
    Використовуйте нативні URL Ollama для хостів LAN. Не додавайте `/v1`.

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

    `contextWindow` — це бюджет контексту на стороні OpenClaw. `params.num_ctx` надсилається до Ollama для запиту. Тримайте їх узгодженими, коли ваше обладнання не може запускати повний заявлений контекст моделі.

  </Accordion>

  <Accordion title="Ollama Cloud only">
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

  <Accordion title="Cloud plus local through a signed-in daemon">
    Використовуйте це, коли локальний або LAN-демон Ollama увійшов через `ollama signin` і має обслуговувати як локальні моделі, так і моделі `:cloud`.

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
    Використовуйте власні ID провайдерів, коли у вас більше ніж один сервер Ollama. Кожен провайдер отримує власний хост, моделі, автентифікацію, таймаут і посилання на моделі.

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

    Коли OpenClaw надсилає запит, префікс активного провайдера вилучається, тож `ollama-large/qwen3.5:27b` надходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі можуть відповідати на прості запити, але мають труднощі з повною поверхнею інструментів агента. Почніть з обмеження інструментів і контексту, перш ніж змінювати глобальні налаштування runtime.

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
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

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер стабільно дає збої на схемах інструментів. Це обмінює можливості агента на стабільність.
    `localModelLean` прибирає інструменти браузера, cron і повідомлень із прямої поверхні агента та за замовчуванням переміщує більші каталоги за структуровані елементи керування Tool Search, окрім випадків, коли виконання має зберігати семантику прямої доставки повідомлень, але не змінює runtime-контекст Ollama або режим мислення. Поєднуйте це з явними `params.num_ctx` і `params.thinking: false` для невеликих моделей мислення в стилі Qwen, які зациклюються або витрачають бюджет відповіді на приховане міркування.

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

Також підтримуються власні ідентифікатори провайдерів Ollama. Коли посилання на модель використовує префікс активного
провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw вилучає лише цей
префікс перед викликом Ollama, тож сервер отримує `qwen3:32b`.

Для повільних локальних моделей віддавайте перевагу налаштуванню запитів у межах провайдера, перш ніж збільшувати
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

`timeoutSeconds` застосовується до HTTP-запиту моделі, включно з установленням з'єднання,
заголовками, потоковою передачею тіла та загальним перериванням guarded-fetch. `params.keep_alive`
передається до Ollama як верхньорівневий `keep_alive` у нативних запитах `/api/chat`;
задавайте його для кожної моделі, коли вузьким місцем є час завантаження на першому ході.

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

Для віддалених хостів замініть `127.0.0.1` на хост, використаний у `baseUrl`. Якщо `curl` працює, а OpenClaw ні, перевірте, чи Gateway працює на іншій машині, у контейнері або під іншим сервісним обліковим записом.

## Ollama Web Search

OpenClaw підтримує **Ollama Web Search** як вбудованого провайдера `web_search`.

| Властивість | Деталі                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований вами хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` використовує розміщений API напряму |
| Автентифікація | Без ключа для локальних хостів Ollama із виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів, захищених автентифікацією |
| Вимога      | Локальні/самостійно розміщені хости мають бути запущені та з виконаним входом через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` плюс справжній API-ключ Ollama |

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

Для локального daemon із виконаним входом OpenClaw використовує proxy daemon `/api/experimental/web_search`. Для `https://ollama.com` він викликає розміщений endpoint `/api/web_search` напряму.

<Note>
Повне налаштування й деталі поведінки див. у [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **Виклик інструментів ненадійний в OpenAI-сумісному режимі.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для proxy і ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо натомість потрібно використовувати OpenAI-сумісний endpoint (наприклад, за proxy, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

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

    Цей режим може не підтримувати одночасно потокову передачу та виклик інструментів. Може знадобитися вимкнути потокову передачу за допомогою `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням інжектує `options.num_ctx`, щоб Ollama не поверталася тихо до контекстного вікна 4096. Якщо ваш proxy/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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
    Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, про яке повідомляє Ollama, коли воно доступне, включно з більшими значеннями `PARAMETER num_ctx` із власних Modelfiles. Інакше він повертається до стандартного контекстного вікна Ollama, яке використовує OpenClaw.

    Ви можете задати стандартні значення `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера для кожної моделі під цим провайдером Ollama, а потім за потреби перевизначити їх для окремої моделі. `contextWindow` — це бюджет prompt і Compaction в OpenClaw. Нативні запити Ollama залишають `options.num_ctx` незаданим, якщо ви явно не налаштуєте `params.num_ctx`, щоб Ollama могла застосувати власні стандартні значення моделі, `OLLAMA_CONTEXT_LENGTH` або на основі VRAM. Щоб обмежити або примусово задати runtime-контекст Ollama для кожного запиту без перебудови Modelfile, задайте `params.num_ctx`; недійсні, нульові, від'ємні та нескінченні значення ігноруються. Якщо ви оновили старішу конфігурацію, яка використовувала лише `contextWindow` або `maxTokens`, щоб примусово задати контекст нативного запиту Ollama, запустіть `openclaw doctor --fix`, щоб скопіювати ці явні бюджети провайдера або моделі в `params.num_ctx`. OpenAI-сумісний адаптер Ollama все ще за замовчуванням інжектує `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це через `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Нативні записи моделей Ollama також приймають поширені runtime-опції Ollama у `params`, включно з `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw пересилає лише ключі запиту Ollama, тому runtime-параметри OpenClaw, такі як `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надіслати верхньорівневий Ollama `think`; `false` вимикає мислення на рівні API для моделей мислення в стилі Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі також працює. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над стандартним значенням агента.

  </Accordion>

  <Accordion title="Керування мисленням">
    Для нативних моделей Ollama OpenClaw пересилає керування мисленням так, як очікує Ollama: верхньорівневий `think`, а не `options.think`. Автоматично виявлені моделі, чия відповідь `/api/show` містить capability `thinking`, відкривають `/think low`, `/think medium`, `/think high` і `/think max`; моделі без мислення відкривають лише `/think off`.

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

    `params.think` або `params.thinking` для окремої моделі можуть вимкнути або примусово ввімкнути мислення API Ollama для конкретної налаштованої моделі. OpenClaw зберігає ці явні параметри моделі, коли активне виконання має лише неявне стандартне `off`; runtime-команди не-`off`, такі як `/think medium`, все одно перевизначають активне виконання.

  </Accordion>

  <Accordion title="Моделі міркування">
    OpenClaw за замовчуванням розглядає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` як здатні до міркування.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безплатна й працює локально, тому вартість усіх моделей установлено на $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Ембеддинги пам’яті">
    Вбудований Plugin Ollama реєструє постачальника ембеддингів пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовану базову URL-адресу
    Ollama та API-ключ, викликає поточну кінцеву точку Ollama `/api/embed` і, коли можливо,
    об’єднує кілька фрагментів пам’яті в один запит `input`.

    Коли `proxy.enabled=true`, запити ембеддингів пам’яті Ollama до точного
    джерела host-local loopback, отриманого з налаштованого `baseUrl`, використовують
    захищений прямий шлях OpenClaw замість керованого проксі пересилання. Налаштоване
    ім’я хоста саме має бути `localhost` або літералом loopback IP;
    DNS-імена, які лише резолвляться в loopback, усе одно використовують керований шлях проксі.
    Хости Ollama в LAN, tailnet, приватній мережі та публічні хости також залишаються на
    керованому шляху проксі. Перенаправлення на інший хост або порт не успадковують довіру.
    Оператори все ще можуть задати глобальне налаштування `proxy.loopbackMode: "proxy"`, щоб
    спрямовувати loopback-трафік через проксі, або `proxy.loopbackMode: "block"`,
    щоб забороняти loopback-з’єднання до відкриття з’єднання; див.
    [Керований проксі](/uk/security/network-proxy#gateway-loopback-mode) щодо
    впливу цього налаштування на весь процес.

    | Властивість       | Значення               |
    | ------------- | ------------------- |
    | Модель за замовчуванням | `nomic-embed-text`  |
    | Автоматичне завантаження     | Так — модель ембеддингів автоматично завантажується, якщо її немає локально |

    Ембеддинги під час запиту використовують префікси retrieval для моделей, які вимагають або рекомендують їх, зокрема `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам’яті залишаються необробленими, щоб наявні індекси не потребували міграції формату.

    Щоб вибрати Ollama як постачальника ембеддингів для пошуку в пам’яті:

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

    Для віддаленого хоста ембеддингів обмежуйте автентифікацію цим хостом:

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

  <Accordion title="Налаштування потокового передавання">
    Інтеграція Ollama в OpenClaw за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно потокове передавання та виклики інструментів. Спеціальне налаштування не потрібне.

    Для нативних запитів `/api/chat` OpenClaw також передає керування thinking безпосередньо в Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневе `think: false`, якщо не налаштовано явне значення моделі `params.think`/`params.thinking`, а `/think low|medium|high` надсилають відповідний верхньорівневий рядок зусилля `think`. `/think max` зіставляється з найвищим нативним зусиллям Ollama, `think: "high"`.

    <Tip>
    Якщо потрібно використовувати OpenAI-сумісну кінцеву точку, див. розділ "Застарілий OpenAI-сумісний режим" вище. У цьому режимі потокове передавання та виклики інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Цикл аварійних збоїв WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний Linux-інсталятор Ollama створює systemd-модуль `ollama.service` з `Restart=always`. Якщо ця служба автоматично запускається й завантажує модель із підтримкою GPU під час запуску WSL2, Ollama може закріпити пам’ять хоста, поки модель завантажується. Механізм повернення пам’яті Hyper-V не завжди може повернути ці закріплені сторінки, тому Windows може завершити VM WSL2, systemd знову запускає Ollama, і цикл повторюється.

    Типові ознаки:

    - повторні перезавантаження або завершення WSL2 з боку Windows
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

    Задайте коротший keep-alive в середовищі служби Ollama або запускайте Ollama вручну лише тоді, коли вона потрібна:

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
    Перевірте, що Ollama працює на правильному порту:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Віддалений хост працює з curl, але не з OpenClaw">
    Перевірте з тієї самої машини й runtime, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Типові причини:

    - `baseUrl` вказує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає OpenAI-сумісну поведінку замість нативної Ollama.
    - Віддалений хост потребує змін firewall або прив’язки LAN на боці Ollama.
    - Модель наявна в daemon вашого ноутбука, але не у віддаленому daemon.

  </Accordion>

  <Accordion title="Модель виводить JSON інструмента як текст">
    Зазвичай це означає, що постачальник використовує OpenAI-сумісний режим або модель не може обробляти схеми інструментів.

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

    Якщо мала локальна модель усе ще не справляється зі схемами інструментів, задайте `compat.supportsTools: false` для цього запису моделі й повторіть тест.

  </Accordion>

  <Accordion title="Kimi або GLM повертає спотворені символи">
    Розміщені відповіді Kimi/GLM, які є довгими нелінгвістичними послідовностями символів, обробляються як невдалий вивід постачальника, а не як успішна відповідь асистента. Це дає змогу звичайному повтору, fallback або обробці помилок узяти керування без збереження пошкодженого тексту в сесії.

    Якщо це повторюється, зафіксуйте необроблену назву моделі, поточний файл сесії та чи використовував запуск `Cloud + Local` або `Cloud only`, а потім спробуйте нову сесію й fallback-модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує час очікування">
    Великі локальні моделі можуть потребувати тривалого першого завантаження перед початком потокового передавання. Обмежуйте timeout постачальником Ollama і, за бажання, попросіть Ollama тримати модель завантаженою між ходами:

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

    Якщо сам хост повільно приймає з’єднання, `timeoutSeconds` також подовжує захищений timeout підключення Undici для цього постачальника.

  </Accordion>

  <Accordion title="Модель із великим контекстом надто повільна або їй бракує пам’яті">
    Багато моделей Ollama оголошують контексти, більші за ті, які ваше обладнання може комфортно запускати. Нативна Ollama використовує власне значення контексту runtime за замовчуванням, якщо ви не задаєте `params.num_ctx`. Обмежуйте і бюджет OpenClaw, і контекст запиту Ollama, коли потрібна передбачувана затримка до першого токена:

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

    Спершу зменште `contextWindow`, якщо OpenClaw надсилає забагато prompt. Зменште `params.num_ctx`, якщо Ollama завантажує runtime-контекст, завеликий для машини. Зменште `maxTokens`, якщо генерація триває надто довго.

  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Вебпошук Ollama" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повне налаштування й подробиці поведінки вебпошуку на основі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
