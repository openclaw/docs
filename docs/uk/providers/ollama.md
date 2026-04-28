---
read_when:
    - Ви хочете запускати OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні настанови з налаштування та конфігурації Ollama
    - Вам потрібні візійні моделі Ollama для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-28T17:56:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd2e2a7ceba03f60cb43c0e9407603a7b661791cd03d55a805a9598ee089ac48
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/самостійно розміщених серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` із `https://ollama.com` або `Local only` із доступним хостом Ollama.

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте сумісну з OpenAI URL-адресу `/v1` (`http://host:11434/v1`) з OpenClaw. Це порушує виклики інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але нова конфігурація має надавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Локальним і LAN-хостам Ollama не потрібен справжній bearer-токен. OpenClaw використовує локальний маркер `ollama-local` лише для loopback, приватної мережі, `.local` і базових URL-адрес Ollama з простими іменами хостів.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера.
  </Accordion>
  <Accordion title="Custom provider ids">
    Користувацькі ідентифікатори провайдерів, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, який вказує на приватний LAN-хост Ollama, може використовувати `apiKey: "ollama-local"`, і субагенти розв’язуватимуть цей маркер через hook провайдера Ollama замість того, щоб трактувати його як відсутні облікові дані. Пошук у пам’яті також може встановити `agents.defaults.memorySearch.provider` на цей користувацький ідентифікатор провайдера, щоб embeddings використовували відповідний endpoint Ollama.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` зберігає облікові дані для ідентифікатора провайдера. Налаштування endpoint (`baseUrl`, `api`, ідентифікатори моделей, заголовки, таймаути) розміщуйте в `models.providers.<id>`. Старі плоскі файли профілів автентифікації, як-от `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не є runtime-форматом; запустіть `openclaw doctor --fix`, щоб переписати їх у канонічний профіль API-ключа `ollama-windows:default` із резервною копією. `baseUrl` у цьому файлі є шумом сумісності, і його слід перенести в конфігурацію провайдера.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Коли Ollama використовується для embeddings пам’яті, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ рівня провайдера надсилається лише до Ollama-хоста цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише до його віддаленого хоста embedding.
    - Чисте значення змінної середовища `OLLAMA_API_KEY` трактується як домовленість Ollama Cloud і типово не надсилається до локальних або самостійно розміщених хостів.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

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
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі

      </Step>
      <Step title="Select a model">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує стандартні параметри для розміщеної хмари. `Cloud + Local` і `Local only` запитують базову URL-адресу Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, як-от `gemma4:latest`, налаштування показує цю встановлену модель один раз замість того, щоб показувати і `gemma4`, і `gemma4:latest` або знову завантажувати простий alias. `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для хмарного доступу.
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

    За потреби вкажіть користувацьку базову URL-адресу або модель:

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
        - **Cloud + Local**: встановіть Ollama, увійдіть за допомогою `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: встановіть Ollama з [ollama.com/download](https://ollama.com/download)

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
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для налаштувань із хостом підходить будь-яке значення-заповнювач:

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

        Або встановіть стандартне значення в конфігурації:

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

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує базову URL-адресу Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи хост увійшов у систему для хмарного доступу за допомогою `ollama signin`. Коли хост увійшов у систему, OpenClaw також пропонує стандартні розміщені хмарні моделі, як-от `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо хост ще не увійшов у систему, OpenClaw залишає налаштування лише локальним, доки ви не запустите `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, встановлює `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється наживо з `https://ollama.com/api/tags`, з обмеженням у 500 записів, тому вибір відображає поточний розміщений каталог, а не статичний початковий набір. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих пропозицій, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локальної роботи OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або самостійно розміщених серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як локальне стандартне значення.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви встановлюєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` чи іншого користувацького віддаленого провайдера з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Подробиці                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Запитує `/api/tags`                                                                                                                                                  |
| Виявлення можливостей | Використовує best-effort запити `/api/show`, щоб прочитати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, зокрема vision/tools             |
| Vision-моделі        | Моделі з можливістю `vision`, повідомленою `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення в prompt |
| Виявлення reasoning  | Використовує можливості `/api/show`, коли вони доступні, зокрема `thinking`; повертається до евристики за назвою моделі (`r1`, `reasoning`, `think`), коли Ollama не надає можливостей |
| Ліміти токенів       | Встановлює `maxTokens` на стандартну верхню межу токенів Ollama, яку використовує OpenClaw                                                                           |
| Витрати              | Встановлює всі витрати на `0`                                                                                                                                        |

Це уникає ручних записів моделей, водночас підтримуючи каталог узгодженим із локальним екземпляром Ollama. Ви можете використовувати повний ref, як-от `ollama/<pulled-model>:latest`, у локальному `infer model run`; OpenClaw розв’язує цю встановлену модель із живого каталогу Ollama без потреби в ручному записі `models.json`.

```bash
# See what models are available
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

Цей шлях усе одно використовує налаштованого провайдера OpenClaw, автентифікацію та нативний
транспорт Ollama, але не запускає хід чат-агента й не завантажує MCP/інструментальний контекст. Якщо
це спрацьовує, а звичайні відповіді агента ні, далі діагностуйте здатність моделі працювати з
prompt агента та інструментами.

Для вузького smoke-тесту vision-моделі тим самим легким шляхом додайте один або більше
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

`model run --file` приймає файли, визначені як `image/*`, зокрема поширені вхідні PNG,
JPEG і WebP. Файли, що не є зображеннями, відхиляються до виклику Ollama.
Для розпізнавання мовлення натомість використовуйте `openclaw infer audio transcribe`.

Коли ви перемикаєте розмову за допомогою `/model ollama/<model>`, OpenClaw трактує
це як точний вибір користувача. Якщо налаштований Ollama `baseUrl`
недоступний, наступна відповідь завершується помилкою провайдера замість того, щоб непомітно
відповісти з іншої налаштованої fallback-моделі.

Ізольовані завдання cron виконують одну додаткову локальну перевірку безпеки перед запуском
ходу агента. Якщо вибрана модель розв’язується до локального, приватно-мережевого або `.local`
провайдера Ollama і `/api/tags` недоступний, OpenClaw записує цей запуск cron
як `skipped` із вибраним `ollama/<model>` у тексті помилки. Preflight endpoint
кешується на 5 хвилин, тому кілька завдань cron, спрямованих на той самий
зупинений daemon Ollama, не запускають усі одразу невдалі запити до моделі.

Перевірте наживо локальний текстовий шлях, нативний streaming-шлях і embeddings з
локальним Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Щоб додати нову модель, просто завантажте її через Ollama:

```bash
ollama pull mistral
```

Нову модель буде автоматично виявлено й вона стане доступною для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama` або налаштовуєте користувацького віддаленого провайдера, наприклад `models.providers.ollama-cloud` з `api: "ollama"`, автоматичне виявлення пропускається, і вам потрібно визначати моделі вручну. Користувацькі провайдери loopback, як-от `http://127.0.0.2:11434`, усе ще вважаються локальними. Дивіться розділ явної конфігурації нижче.
</Note>

## Комп’ютерний зір і опис зображень

Вбудований Ollama Plugin реєструє Ollama як провайдера розуміння медіа з підтримкою зображень. Це дає OpenClaw змогу маршрутизувати явні запити на опис зображень і налаштовані стандартні моделі зображень через локальні або розміщені в хмарі моделі комп’ютерного зору Ollama.

Для локального комп’ютерного зору завантажте модель, що підтримує зображення:

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

`--model` має бути повним посиланням `<provider/model>`. Коли його задано, `openclaw infer image describe` запускає цю модель напряму, замість того щоб пропускати опис через те, що модель підтримує вбудований комп’ютерний зір.

Використовуйте `infer image describe`, коли вам потрібні потік провайдера розуміння зображень OpenClaw, налаштований `agents.defaults.imageModel` і форма виводу опису зображення. Використовуйте `infer model run --file`, коли вам потрібна сира перевірка мультимодальної моделі з користувацьким промптом і одним або кількома зображеннями.

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

Надавайте перевагу повному посиланню `ollama/<model>`. Якщо та сама модель указана в `models.providers.ollama.models` з `input: ["text", "image"]` і жоден інший налаштований провайдер зображень не надає цей чистий ID моделі, OpenClaw також нормалізує чисте посилання `imageModel`, наприклад `qwen2.5vl:7b`, до `ollama/qwen2.5vl:7b`. Якщо більше ніж один налаштований провайдер зображень має той самий чистий ID, явно використовуйте префікс провайдера.

Повільним локальним моделям комп’ютерного зору може знадобитися довший тайм-аут розуміння зображень, ніж хмарним моделям. Вони також можуть аварійно завершувати роботу або зупинятися, коли Ollama намагається виділити повний заявлений контекст комп’ютерного зору на обмеженому обладнанні. Задайте тайм-аут можливості й обмежте `num_ctx` у записі моделі, коли вам потрібен лише звичайний хід опису зображення:

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

Цей тайм-аут застосовується до розуміння вхідних зображень і до явного інструмента `image`, який агент може викликати під час ходу. `models.providers.ollama.timeoutSeconds` на рівні провайдера й надалі керує базовим запобіжником HTTP-запиту Ollama для звичайних викликів моделі.

Виконайте live-перевірку явного інструмента зображень із локальною Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте моделі комп’ютерного зору як такі, що підтримують введення зображень:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, які не позначені як здатні працювати із зображеннями. За неявного виявлення OpenClaw зчитує це з Ollama, коли `/api/show` повідомляє про можливість комп’ютерного зору.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший шлях увімкнення лише для локального використання — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо `OLLAMA_API_KEY` задано, ви можете пропустити `apiKey` у записі провайдера, і OpenClaw заповнить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна конфігурація (моделі вручну)">
    Використовуйте явну конфігурацію, коли потрібне розгорнуте у хмарі налаштування, Ollama працює на іншому хості/порту, потрібно примусово задати певні контекстні вікна або списки моделей, чи потрібні повністю ручні визначення моделей.

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

  <Tab title="Власна базова URL-адреса">
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автоматичне виявлення, тож визначайте моделі вручну):

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
    Не додавайте `/v1` до URL-адреси. Шлях `/v1` використовує режим, сумісний з OpenAI, де виклик інструментів ненадійний. Використовуйте базову URL-адресу Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

## Поширені рецепти

Використовуйте їх як початкові варіанти та замінюйте ідентифікатори моделей точними назвами з `ollama list` або `openclaw models list --provider ollama`.

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

  <Accordion title="LAN-хост Ollama з ручними моделями">
    Використовуйте нативні URL-адреси Ollama для LAN-хостів. Не додавайте `/v1`.

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

    `contextWindow` — це бюджет контексту на боці OpenClaw. `params.num_ctx` надсилається до Ollama для запиту. Тримайте їх узгодженими, коли ваше обладнання не може запускати повний заявлений контекст моделі.

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

  <Accordion title="Хмара плюс локальні моделі через авторизований демон">
    Використовуйте це, коли локальний або LAN-демон Ollama авторизований через `ollama signin` і має обслуговувати як локальні моделі, так і моделі `:cloud`.

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
    Використовуйте власні ідентифікатори провайдерів, коли маєте більше ніж один сервер Ollama. Кожен провайдер отримує власний хост, моделі, автентифікацію, тайм-аут і посилання на моделі.

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

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер надійно дає збій на схемах інструментів. Це обмінює можливості агента на стабільність.
    `localModelLean` прибирає інструменти браузера, cron і повідомлень із поверхні агента, але не змінює runtime-контекст Ollama або режим мислення. Поєднуйте це з явними `params.num_ctx` і `params.thinking: false` для малих Qwen-подібних моделей мислення, які зациклюються або витрачають свій бюджет відповіді на приховане міркування.

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
префікс провайдера, як-от `ollama-spark/qwen3:32b`, OpenClaw видаляє лише цей
префікс перед викликом Ollama, щоб сервер отримав `qwen3:32b`.

Для повільних локальних моделей віддавайте перевагу налаштуванню запитів на рівні провайдера перед збільшенням
тайм-ауту runtime всього агента:

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
заголовками, потоковою передачею тіла й загальним guarded-fetch abort. `params.keep_alive`
передається до Ollama як верхньорівневий `keep_alive` у нативних запитах `/api/chat`;
задавайте його для кожної моделі, коли вузьким місцем є час завантаження першого ходу.

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

Для віддалених хостів замініть `127.0.0.1` на хост, використаний у `baseUrl`. Якщо `curl` працює, а OpenClaw ні, перевірте, чи Gateway не працює на іншій машині, у контейнері або під іншим сервісним обліковим записом.

## Вебпошук Ollama

OpenClaw підтримує **вебпошук Ollama** як вбудований провайдер `web_search`.

| Властивість | Деталі                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує ваш налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` використовує розміщений API напряму |
| Auth        | Без ключа для локальних хостів Ollama із виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів із захищеним доступом |
| Вимога      | Локальні/самостійно розміщені хости мають бути запущені та мати виконаний вхід через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` і справжнього API-ключа Ollama |

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

Для локального daemon із виконаним входом OpenClaw використовує проксі daemon `/api/experimental/web_search`. Для `https://ollama.com` він викликає розміщений endpoint `/api/web_search` напряму.

<Note>
Повне налаштування та деталі поведінки див. у [вебпошуку Ollama](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий режим, сумісний з OpenAI">
    <Warning>
    **Виклик інструментів ненадійний у режимі, сумісному з OpenAI.** Використовуйте цей режим лише якщо вам потрібен формат OpenAI для proxy й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо натомість потрібно використовувати endpoint, сумісний з OpenAI (наприклад, за proxy, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

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

    Цей режим може не підтримувати потокову передачу й виклик інструментів одночасно. Можливо, доведеться вимкнути потокову передачу через `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням інжектує `options.num_ctx`, щоб Ollama не повертався непомітно до контекстного вікна 4096. Якщо ваш proxy/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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
    Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, повідомлене Ollama, коли воно доступне, включно з більшими значеннями `PARAMETER num_ctx` із користувацьких Modelfiles. Інакше він повертається до типового контекстного вікна Ollama, яке використовує OpenClaw.

    Ви можете задати типові значення `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера для кожної моделі під цим провайдером Ollama, а потім перевизначати їх для окремих моделей за потреби. `contextWindow` — це бюджет prompt і Compaction OpenClaw. Нативні запити Ollama лишають `options.num_ctx` незаданим, якщо ви явно не налаштуєте `params.num_ctx`, тож Ollama може застосувати власну модель, `OLLAMA_CONTEXT_LENGTH` або типове значення на основі VRAM. Щоб обмежити або примусово задати runtime-контекст Ollama для кожного запиту без перебудови Modelfile, задайте `params.num_ctx`; недійсні, нульові, від’ємні та нескінченні значення ігноруються. Ollama-адаптер, сумісний з OpenAI, усе ще за замовчуванням інжектує `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це через `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Нативні записи моделей Ollama також приймають поширені runtime-опції Ollama у `params`, включно з `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw передає лише ключі запитів Ollama, тож runtime-параметри OpenClaw, як-от `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надіслати верхньорівневий Ollama `think`; `false` вимикає мислення на рівні API для Qwen-подібних моделей мислення.

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

    Також працює `agents.defaults.models["ollama/<model>"].params.num_ctx` на рівні моделі. Якщо налаштовано обидва, явний запис моделі провайдера має пріоритет над типовим значенням агента.

  </Accordion>

  <Accordion title="Керування мисленням">
    Для нативних моделей Ollama OpenClaw передає керування мисленням так, як очікує Ollama: верхньорівневий `think`, а не `options.think`. Автоматично виявлені моделі, чия відповідь `/api/show` містить capability `thinking`, показують `/think low`, `/think medium`, `/think high` і `/think max`; моделі без мислення показують лише `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Також можна задати типове значення моделі:

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

    `params.think` або `params.thinking` на рівні моделі може вимкнути або примусово ввімкнути API-мислення Ollama для конкретної налаштованої моделі. OpenClaw зберігає ці явні параметри моделі, коли активний запуск має лише неявне типове значення `off`; runtime-команди, відмінні від off, як-от `/think medium`, усе ще перевизначають активний запуск.

  </Accordion>

  <Accordion title="Моделі міркування">
    OpenClaw за замовчуванням вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` здатними до міркування.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безплатний і працює локально, тому всі вартості моделей установлені на $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Ембедінги пам’яті">
    Вбудований plugin Ollama реєструє провайдер ембедінгів пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштований базовий URL Ollama
    та API-ключ, викликає поточний endpoint Ollama `/api/embed` і, коли можливо, об’єднує
    кілька фрагментів пам’яті в один запит `input`.

    | Властивість    | Значення            |
    | --------------- | ------------------- |
    | Типова модель   | `nomic-embed-text`  |
    | Auto-pull       | Так — модель ембедінгів автоматично завантажується, якщо її немає локально |

    Ембедінги під час запиту використовують retrieval prefixes для моделей, які їх потребують або рекомендують, включно з `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам’яті лишаються сирими, щоб наявні індекси не потребували міграції формату.

    Щоб вибрати Ollama як провайдер ембедінгів пошуку в пам’яті:

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

    Для віддаленого хоста ембедінгів тримайте автентифікацію обмеженою цим хостом:

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
    Інтеграція OpenClaw з Ollama за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує потокове передавання та виклики інструментів одночасно. Спеціальна конфігурація не потрібна.

    Для нативних запитів `/api/chat` OpenClaw також напряму передає керування мисленням до Ollama: `/think off` і `openclaw agent --thinking off` надсилають `think: false` верхнього рівня, якщо не налаштовано явне значення `params.think`/`params.thinking` моделі, а `/think low|medium|high` надсилають відповідний рядок рівня зусилля `think` верхнього рівня. `/think max` відповідає найвищому нативному рівню зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати сумісну з OpenAI кінцеву точку, див. розділ «Застарілий режим сумісності з OpenAI» вище. Потокове передавання та виклики інструментів можуть не працювати одночасно в цьому режимі.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Цикл збоїв WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює systemd-юніт `ollama.service` з `Restart=always`. Якщо ця служба запускається автоматично й завантажує модель із підтримкою GPU під час запуску WSL2, Ollama може закріпити пам’ять хоста, доки модель завантажується. Механізм повернення пам’яті Hyper-V не завжди може звільнити ці закріплені сторінки, тому Windows може завершити VM WSL2, systemd знову запускає Ollama, і цикл повторюється.

    Типові ознаки:

    - повторні перезавантаження або завершення WSL2 з боку Windows
    - високе навантаження CPU в `app.slice` або `ollama.service` невдовзі після запуску WSL2
    - SIGTERM від systemd, а не подія Linux OOM-killer

    OpenClaw записує попередження під час запуску, коли виявляє WSL2, увімкнений `ollama.service` з `Restart=always` і видимі маркери CUDA.

    Пом’якшення:

    ```bash
    sudo systemctl disable ollama
    ```

    Додайте це до `%USERPROFILE%\.wslconfig` на стороні Windows, потім виконайте `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Установіть коротший keep-alive у середовищі служби Ollama або запускайте Ollama вручну лише тоді, коли вона потрібна:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Див. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama не виявлено">
    Переконайтеся, що Ollama запущено, що ви встановили `OLLAMA_API_KEY` (або профіль автентифікації) і що ви **не** визначили явний запис `models.providers.ollama`:

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
    Перевірте з тієї самої машини та середовища виконання, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Типові причини:

    - `baseUrl` указує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає сумісну з OpenAI поведінку замість нативної Ollama.
    - Віддалений хост потребує змін firewall або прив’язки до LAN на стороні Ollama.
    - Модель є в демоні вашого ноутбука, але її немає у віддаленому демоні.

  </Accordion>

  <Accordion title="Модель виводить JSON інструменту як текст">
    Зазвичай це означає, що постачальник використовує сумісний з OpenAI режим або модель не може обробляти схеми інструментів.

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

    Якщо невелика локальна модель усе ще не справляється зі схемами інструментів, установіть `compat.supportsTools: false` у записі цієї моделі й перевірте ще раз.

  </Accordion>

  <Accordion title="Kimi або GLM повертає спотворені символи">
    Розміщені відповіді Kimi/GLM, які є довгими нелігвістичними послідовностями символів, обробляються як невдалий вивід постачальника, а не як успішна відповідь асистента. Це дає змогу звичайному повтору, fallback або обробці помилки спрацювати без збереження пошкодженого тексту в сесії.

    Якщо це повторюється, зафіксуйте сире ім’я моделі, поточний файл сесії та чи запуск використовував `Cloud + Local` або `Cloud only`, потім спробуйте нову сесію та fallback-модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодна локальна модель завершується за тайм-аутом">
    Великим локальним моделям може знадобитися тривале перше завантаження перед початком потокового передавання. Обмежте тайм-аут постачальником Ollama й за потреби попросіть Ollama тримати модель завантаженою між ходами:

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

    Якщо сам хост повільно приймає з’єднання, `timeoutSeconds` також подовжує захищений тайм-аут підключення Undici для цього постачальника.

  </Accordion>

  <Accordion title="Модель із великим контекстом надто повільна або вичерпує пам’ять">
    Багато моделей Ollama оголошують контексти, більші за ті, які ваше обладнання може комфортно виконувати. Нативна Ollama використовує власне стандартне значення контексту середовища виконання Ollama, якщо ви не встановите `params.num_ctx`. Обмежте і бюджет OpenClaw, і контекст запиту Ollama, коли хочете передбачувану затримку до першого токена:

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

    Спочатку зменште `contextWindow`, якщо OpenClaw надсилає забагато prompt. Зменште `params.num_ctx`, якщо Ollama завантажує контекст середовища виконання, який завеликий для машини. Зменште `maxTokens`, якщо генерація триває надто довго.

  </Accordion>
</AccordionGroup>

<Note>
Більше довідки: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Вибір моделей" href="/uk/concepts/models" icon="brain">
    Як вибирати й конфігурувати моделі.
  </Card>
  <Card title="Вебпошук Ollama" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повне налаштування та деталі поведінки вебпошуку на базі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
