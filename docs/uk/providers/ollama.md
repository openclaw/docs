---
read_when:
    - Ви хочете запускати OpenClaw з хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки з установлення та налаштування Ollama
    - Вам потрібні моделі зору Ollama для розуміння зображень
summary: Запустіть OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-07-01T08:32:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/самостійно розгорнутих серверів Ollama. Ollama можна використовувати у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` через `https://ollama.com` або `Local only` через доступний хост Ollama.

OpenClaw також реєструє `ollama-cloud` як першокласний ідентифікатор розміщеного провайдера для
прямого використання Ollama Cloud. Використовуйте посилання на кшталт `ollama-cloud/kimi-k2.5:cloud`, коли
потрібна маршрутизація лише в хмару без спільного використання локального ідентифікатора провайдера `ollama`.

Окрему сторінку налаштування лише для хмари див. у [Ollama Cloud](/uk/providers/ollama-cloud).

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте OpenAI-сумісну URL-адресу `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклик інструментів, і моделі можуть виводити необроблений JSON інструментів як звичайний текст. Натомість використовуйте URL-адресу нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації слід надавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні та LAN-хости">
    Локальним і LAN-хостам Ollama не потрібен справжній bearer-токен. OpenClaw використовує локальний маркер `ollama-local` лише для URL-адрес Ollama з local loopback, приватною мережею, `.local` і простим іменем хоста.
  </Accordion>
  <Accordion title="Віддалені хости та Ollama Cloud">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера. Для прямого розміщеного використання надавайте перевагу провайдеру `ollama-cloud`.
  </Accordion>
  <Accordion title="Власні ідентифікатори провайдерів">
    Власні ідентифікатори провайдерів, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, що вказує на приватний LAN-хост Ollama, може використовувати `apiKey: "ollama-local"`, а підагенти розв'язуватимуть цей маркер через хук провайдера Ollama замість того, щоб вважати його відсутніми обліковими даними. Пошук у пам'яті також може встановити `agents.defaults.memorySearch.provider` на цей власний ідентифікатор провайдера, щоб ембеддинги використовували відповідну кінцеву точку Ollama.
  </Accordion>
  <Accordion title="Профілі автентифікації">
    `auth-profiles.json` зберігає облікові дані для ідентифікатора провайдера. Розміщуйте параметри кінцевої точки (`baseUrl`, `api`, ідентифікатори моделей, заголовки, таймаути) у `models.providers.<id>`. Старі плоскі файли профілів автентифікації, як-от `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не є форматом часу виконання; запустіть `openclaw doctor --fix`, щоб переписати їх у канонічний профіль API-ключа `ollama-windows:default` із резервною копією. `baseUrl` у цьому файлі є шумом сумісності, і його слід перенести до конфігурації провайдера.
  </Accordion>
  <Accordion title="Область ембеддингів пам'яті">
    Коли Ollama використовується для ембеддингів пам'яті, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ рівня провайдера надсилається лише до хоста Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише до його віддаленого хоста ембеддингів.
    - Значення змінної середовища лише `OLLAMA_API_KEY` трактується як угода Ollama Cloud і за замовчуванням не надсилається до локальних або самостійно розгорнутих хостів.

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
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує розміщені хмарні типові значення. `Cloud + Local` і `Local only` запитують базову URL-адресу Ollama, виявляють доступні моделі й автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, як-от `gemma4:latest`, налаштування показує цю встановлену модель один раз замість показу і `gemma4`, і `gemma4:latest` або повторного завантаження простого псевдоніма. `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для хмарного доступу.
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

    За бажанням укажіть власну базову URL-адресу або модель:

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
      <Step title="Виберіть хмару або локальний режим">
        - **Cloud + Local**: установіть Ollama, увійдіть за допомогою `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: установіть Ollama з [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Завантажте локальну модель (лише локально)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для налаштувань із підтримкою хоста підійде будь-яке значення-заповнювач:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перегляньте та встановіть свою модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або встановіть типове значення в конфігурації:

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
    `Cloud + Local` використовує доступний хост Ollama як контрольну точку і для локальних, і для хмарних моделей. Це рекомендований гібридний потік Ollama.

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує базову URL-адресу Ollama, виявляє локальні моделі з цього хоста й перевіряє, чи хост увійшов у систему для хмарного доступу за допомогою `ollama signin`. Коли хост увійшов у систему, OpenClaw також пропонує розміщені хмарні типові значення, як-от `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо хост ще не увійшов у систему, OpenClaw зберігає налаштування лише локальним, доки ви не запустите `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama на `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, встановлює `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється наживо з `https://ollama.com/api/tags`, обмежений 500 записами, тому вибір відображає поточний розміщений каталог, а не статичний початковий набір. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих пропозицій, щоб онбординг усе одно завершився.

    Ви також можете налаштувати першокласного хмарного провайдера напряму:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    У режимі лише локально OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або самостійно розгорнутих серверів Ollama.

    OpenClaw наразі пропонує `gemma4` як локальне типове значення.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви встановлюєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` або іншого власного віддаленого провайдера з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama на `http://127.0.0.1:11434`.

| Поведінка             | Деталі                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу        | Запитує `/api/tags`                                                                                                                                                  |
| Виявлення можливостей | Використовує best-effort пошуки `/api/show`, щоб прочитати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, зокрема vision/tools                       |
| Vision-моделі        | Моделі з можливістю `vision`, повідомленою `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення в промпт  |
| Виявлення міркування  | Використовує можливості `/api/show`, коли вони доступні, зокрема `thinking`; повертається до евристики за назвою моделі (`r1`, `reasoning`, `think`), коли Ollama пропускає можливості |
| Ліміти токенів        | Встановлює `maxTokens` на типовий максимальний ліміт токенів Ollama, який використовує OpenClaw                                                                                                |
| Вартість             | Встановлює всі вартості на `0`                                                                                                                                                |

Це усуває потребу в ручних записах моделей, зберігаючи каталог узгодженим із локальним екземпляром Ollama. Ви можете використовувати повне посилання на кшталт `ollama/<pulled-model>:latest` у локальному `infer model run`; OpenClaw розв'язує цю встановлену модель із live-каталогу Ollama без потреби в написаному вручну записі `models.json`.

Для хостів Ollama, у які виконано вхід, деякі моделі `:cloud` можуть бути доступні через `/api/chat`
і `/api/show` до того, як вони з'являться в `/api/tags`. Коли ви явно вибираєте
повне посилання `ollama/<model>:cloud`, OpenClaw перевіряє саме цю відсутню модель за допомогою
`/api/show` і додає її до каталогу часу виконання лише якщо Ollama підтверджує
метадані моделі. Одруківки й надалі завершуються помилкою як невідомі моделі, а не створюються автоматично.

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

Цей шлях усе одно використовує налаштованого провайдера, автентифікацію та нативний транспорт Ollama
OpenClaw, але не запускає хід чат-агента й не завантажує контекст MCP/інструментів. Якщо
це працює, а звичайні відповіді агента не працюють, далі діагностуйте промпт агента моделі
і місткість інструментів.

Для вузького smoke-тесту vision-моделі на тому самому lean-шляху додайте один або кілька
файлів зображень до `infer model run`. Це надсилає промпт і зображення безпосередньо до
вибраної vision-моделі Ollama без завантаження чат-інструментів, пам'яті або попереднього
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

`model run --file` приймає файли, виявлені як `image/*`, зокрема поширені вхідні PNG,
JPEG і WebP. Файли, що не є зображеннями, відхиляються до виклику Ollama.
Для розпізнавання мовлення натомість використовуйте `openclaw infer audio transcribe`.

Коли ви перемикаєте розмову за допомогою `/model ollama/<model>`, OpenClaw розглядає
це як точний вибір користувача. Якщо налаштований Ollama `baseUrl`
недоступний, наступна відповідь завершується помилкою провайдера замість того, щоб непомітно
відповісти з іншої налаштованої резервної моделі.

Ізольовані cron-завдання виконують одну додаткову локальну перевірку безпеки перед запуском
ходу агента. Якщо вибрана модель розв’язується в локального, приватно-мережевого або `.local`
провайдера Ollama і `/api/tags` недоступний, OpenClaw записує цей cron-запуск
як `skipped` із вибраним `ollama/<model>` у тексті помилки. Попередня перевірка
кінцевої точки кешується на 5 хвилин, тож кілька cron-завдань, спрямованих на той самий
зупинений демон Ollama, не запускатимуть усі невдалі запити моделі.

Виконайте live-перевірку локального текстового шляху, нативного потокового шляху та embeddings
проти локального Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Для smoke-тестів Ollama Cloud з API-ключем спрямуйте live-тест на `https://ollama.com`
і виберіть розміщену модель із поточного каталогу:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Cloud smoke запускає текст, нативний потік і вебпошук. За замовчуванням він пропускає embeddings
для `https://ollama.com`, оскільки API-ключі Ollama Cloud можуть не авторизувати
`/api/embed`. Установіть `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, коли явно хочете,
щоб live-тест завершувався невдало, якщо налаштований cloud-ключ не може використовувати кінцеву точку embed.

Щоб додати нову модель, просто витягніть її через Ollama:

```bash
ollama pull mistral
```

Нову модель буде автоматично виявлено й вона стане доступною для використання.

<Note>
Якщо ви явно встановили `models.providers.ollama` або налаштували власного віддаленого провайдера, наприклад `models.providers.ollama-cloud`, з `api: "ollama"`, автоматичне виявлення пропускається, і моделі потрібно визначати вручну. Власні loopback-провайдери, такі як `http://127.0.0.2:11434`, усе ще розглядаються як локальні. Дивіться розділ явної конфігурації нижче.
</Note>

## Vision і опис зображень

Вбудований Ollama Plugin реєструє Ollama як провайдера media-understanding із підтримкою зображень. Це дає OpenClaw змогу маршрутизувати явні запити опису зображень і налаштовані стандартні image-model через локальні або розміщені vision-моделі Ollama.

Для локального vision витягніть модель, що підтримує зображення:

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

`--model` має бути повним посиланням `<provider/model>`. Коли його встановлено, `openclaw infer image describe` спершу пробує цю модель замість того, щоб пропускати опис через підтримку моделлю нативного vision. Якщо виклик моделі завершується невдало, OpenClaw може продовжити через налаштовані `agents.defaults.imageModel.fallbacks`; помилки підготовки файлу або URL усе ще завершуються невдачею до спроб резервних варіантів.

Використовуйте `infer image describe`, коли вам потрібні потік провайдера image-understanding OpenClaw, налаштований `agents.defaults.imageModel` і форма виводу опису зображення. Використовуйте `infer model run --file`, коли вам потрібна сира перевірка мультимодальної моделі з власним prompt і одним або кількома зображеннями.

Щоб зробити Ollama стандартною моделлю image-understanding для вхідних медіа, налаштуйте `agents.defaults.imageModel`:

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

Віддавайте перевагу повному посиланню `ollama/<model>`. Якщо ту саму модель указано в `models.providers.ollama.models` з `input: ["text", "image"]` і жоден інший налаштований провайдер зображень не надає цей голий ID моделі, OpenClaw також нормалізує голе посилання `imageModel`, наприклад `qwen2.5vl:7b`, до `ollama/qwen2.5vl:7b`. Якщо більше ніж один налаштований провайдер зображень має той самий голий ID, явно використовуйте префікс провайдера.

Повільним локальним vision-моделям може знадобитися довший тайм-аут image-understanding, ніж cloud-моделям. Вони також можуть аварійно завершуватися або зупинятися, коли Ollama намагається виділити повний заявлений vision-контекст на обмеженому обладнанні. Установіть тайм-аут capability і обмежте `num_ctx` в записі моделі, коли вам потрібен лише звичайний хід опису зображення:

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

Цей тайм-аут застосовується до вхідного розуміння зображень і до явного інструмента `image`, який агент може викликати під час ходу. Провайдерський `models.providers.ollama.timeoutSeconds` усе ще керує базовим обмежувачем HTTP-запиту Ollama для звичайних викликів моделі.

Виконайте live-перевірку явного інструмента image проти локального Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначте vision-моделі підтримкою введення зображень:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити опису зображень для моделей, які не позначені як image-capable. За неявного виявлення OpenClaw читає це з Ollama, коли `/api/show` повідомляє про vision capability.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший шлях увімкнення лише для локального використання — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо `OLLAMA_API_KEY` встановлено, можна опустити `apiKey` у записі провайдера, і OpenClaw заповнить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, коли вам потрібне налаштування розміщеного cloud, Ollama працює на іншому host/port, ви хочете примусово задати конкретні context windows або списки моделей, або вам потрібні повністю ручні визначення моделей.

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
    Якщо Ollama працює на іншому host або port (явна конфігурація вимикає автоматичне виявлення, тож визначайте моделі вручну):

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
    Не додавайте `/v1` до URL. Шлях `/v1` використовує режим, сумісний з OpenAI, де виклик інструментів ненадійний. Використовуйте базовий URL Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

## Поширені рецепти

Використовуйте їх як початкові точки й замінюйте ID моделей точними назвами з `ollama list` або `openclaw models list --provider ollama`.

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

  <Accordion title="Cloud плюс локальний доступ через авторизований демон">
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

    Коли OpenClaw надсилає запит, активний префікс провайдера вилучається, тому `ollama-large/qwen3.5:27b` доходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі можуть відповідати на прості запити, але мають труднощі з повною поверхнею інструментів агента. Спершу обмежте інструменти й контекст, перш ніж змінювати глобальні налаштування runtime.

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

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер стабільно падає на схемах інструментів. Це обмінює можливості агента на стабільність.
    `localModelLean` прибирає браузер, cron та інструменти повідомлень із прямої поверхні агента й за замовчуванням розміщує більші каталоги за структурованими елементами керування пошуком інструментів, окрім випадків, коли запуск має зберегти семантику прямого доставлення повідомлень, але не змінює runtime-контекст Ollama або режим мислення. Поєднуйте це з явними `params.num_ctx` і `params.thinking: false` для малих моделей мислення в стилі Qwen, які зациклюються або витрачають бюджет відповіді на приховане міркування.

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

Власні ідентифікатори провайдерів Ollama також підтримуються. Коли посилання на модель використовує активний
префікс провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw вилучає лише цей
префікс перед викликом Ollama, тому сервер отримує `qwen3:32b`.

Для повільних локальних моделей надавайте перевагу налаштуванню запитів у межах провайдера, перш ніж збільшувати
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

`timeoutSeconds` застосовується до HTTP-запиту моделі, включно з установленням з’єднання,
заголовками, потоковим передаванням тіла й загальним перериванням захищеного fetch. `params.keep_alive`
передається до Ollama як верхньорівневий `keep_alive` у нативних запитах `/api/chat`;
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

Для віддалених хостів замініть `127.0.0.1` на хост, використаний у `baseUrl`. Якщо `curl` працює, а OpenClaw ні, перевірте, чи Gateway запускається на іншій машині, у контейнері або під іншим обліковим записом служби.

## Ollama Web Search

OpenClaw підтримує **Ollama Web Search** як вбудованого провайдера `web_search`.

| Властивість | Деталі                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований вами хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` використовує розміщений API напряму |
| Автентифікація | Без ключа для локальних хостів Ollama із виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів із захищеною автентифікацією |
| Вимога      | Локальні або самостійно розміщені хости мають бути запущені й мати виконаний вхід через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` і справжнього API-ключа Ollama |

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

Для локального daemon із виконаним входом OpenClaw використовує проксі `/api/experimental/web_search` цього daemon. Для `https://ollama.com` він напряму викликає розміщений endpoint `/api/web_search`.

<Note>
Повне налаштування й деталі поведінки див. у [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **Виклик інструментів в OpenAI-сумісному режимі ненадійний.** Використовуйте цей режим лише якщо вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
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

    Цей режим може не підтримувати потокове передавання й виклик інструментів одночасно. Можливо, вам доведеться вимкнути потокове передавання за допомогою `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням додає `options.num_ctx`, щоб Ollama мовчки не повертався до контекстного вікна 4096. Якщо ваш проксі або upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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
    Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, повідомлене Ollama, коли воно доступне, включно з більшими значеннями `PARAMETER num_ctx` із власних Modelfiles. Інакше він повертається до стандартного контекстного вікна Ollama, яке використовує OpenClaw.

    Ви можете задати стандартні значення `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера для кожної моделі під цим провайдером Ollama, а потім перевизначати їх для окремої моделі за потреби. `contextWindow` — це бюджет prompt і Compaction в OpenClaw. Нативні запити Ollama залишають `options.num_ctx` незаданим, якщо ви явно не налаштуєте `params.num_ctx`, тож Ollama може застосувати власне значення за замовчуванням на основі моделі, `OLLAMA_CONTEXT_LENGTH` або VRAM. Щоб обмежити або примусово задати runtime-контекст Ollama для кожного запиту без перебудови Modelfile, задайте `params.num_ctx`; некоректні, нульові, від’ємні та нескінченні значення ігноруються. Якщо ви оновили старішу конфігурацію, яка використовувала лише `contextWindow` або `maxTokens`, щоб примусово задати контекст нативного запиту Ollama, запустіть `openclaw doctor --fix`, щоб скопіювати ці явні бюджети провайдера або моделі в `params.num_ctx`. OpenAI-сумісний адаптер Ollama усе ще за замовчуванням додає `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це через `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Нативні записи моделей Ollama також приймають поширені runtime-параметри Ollama в `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw передає лише ключі запиту Ollama, тому runtime-параметри OpenClaw, як-от `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надіслати верхньорівневий `think` Ollama; `false` вимикає мислення на рівні API для моделей мислення в стилі Qwen.

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
    Для нативних моделей Ollama OpenClaw передає керування мисленням так, як цього очікує Ollama: верхньорівневий `think`, а не `options.think`. Автоматично виявлені моделі, відповідь `/api/show` яких містить capability `thinking`, надають `/think low`, `/think medium`, `/think high` і `/think max`; моделі без мислення надають лише `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Також можна задати стандартне значення моделі:

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

    `params.think` або `params.thinking` для окремої моделі може вимкнути або примусово ввімкнути мислення API Ollama для конкретної налаштованої моделі. OpenClaw зберігає ці явні параметри моделі, коли активний запуск має лише неявне стандартне значення `off`; runtime-команди, відмінні від off, як-от `/think medium`, усе ще перевизначають активний запуск.

  </Accordion>

  <Accordion title="Моделі міркування">
    OpenClaw за замовчуванням вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` здатними до міркування.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безкоштовний і працює локально, тому всі витрати на моделі встановлено на $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Вбудовування пам’яті">
    Вбудований Plugin Ollama реєструє постачальника вбудовувань пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані базову URL-адресу
    Ollama й API-ключ, викликає поточний endpoint Ollama `/api/embed` і, коли можливо,
    об’єднує кілька фрагментів пам’яті в один запит `input`.

    Коли `proxy.enabled=true`, запити вбудовувань пам’яті Ollama до точного
    host-local loopback origin, отриманого з налаштованого `baseUrl`, використовують
    захищений прямий шлях OpenClaw замість керованого прямого proxy. Налаштоване
    ім’я хоста саме має бути `localhost` або loopback IP-літералом; DNS-імена,
    які лише розв’язуються в loopback, усе одно використовують керований proxy-шлях.
    LAN, tailnet, приватні мережеві й публічні хости Ollama також залишаються на
    керованому proxy-шляху. Переспрямування на інший хост або порт не успадковують довіру.
    Оператори все ще можуть установити глобальне налаштування `proxy.loopbackMode: "proxy"`,
    щоб надсилати loopback-трафік через proxy, або `proxy.loopbackMode: "block"`,
    щоб забороняти loopback-з’єднання до відкриття з’єднання; див.
    [Керований proxy](/uk/security/network-proxy#gateway-loopback-mode) щодо впливу
    цього налаштування на весь процес.

    | Властивість | Значення |
    | ------------- | ------------------- |
    | Модель за замовчуванням | `nomic-embed-text` |
    | Автоматичне завантаження | Так — модель вбудовувань автоматично завантажується, якщо її немає локально |

    Вбудовування під час запиту використовують префікси пошуку для моделей, які їх потребують або рекомендують, зокрема `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам’яті залишаються необробленими, щоб наявні індекси не потребували міграції формату.

    Щоб вибрати Ollama як постачальника вбудовувань для пошуку в пам’яті:

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

    Для віддаленого хоста вбудовувань тримайте автентифікацію обмеженою цим хостом:

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

  <Accordion title="Конфігурація стримінгу">
    Інтеграція Ollama в OpenClaw за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує стримінг і виклики інструментів одночасно. Спеціальна конфігурація не потрібна.

    Для нативних запитів `/api/chat` OpenClaw також передає керування мисленням безпосередньо в Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневе `think: false`, якщо не налаштовано явне значення моделі `params.think`/`params.thinking`, тоді як `/think low|medium|high` надсилають відповідний верхньорівневий рядок зусилля `think`. `/think max` відображається на найвище нативне зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісний endpoint, див. розділ «Застарілий OpenAI-сумісний режим» вище. У цьому режимі стримінг і виклики інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Цикл аварійного перезапуску WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює systemd-юніт `ollama.service` з `Restart=always`. Якщо цей сервіс запускається автоматично й завантажує модель з GPU-підтримкою під час старту WSL2, Ollama може закріпити пам’ять хоста, поки модель завантажується. Механізм повернення пам’яті Hyper-V не завжди може звільнити ці закріплені сторінки, тому Windows може завершити VM WSL2, systemd знову запускає Ollama, і цикл повторюється.

    Типові ознаки:

    - повторні перезавантаження або завершення WSL2 з боку Windows
    - високе навантаження CPU в `app.slice` або `ollama.service` невдовзі після запуску WSL2
    - SIGTERM від systemd, а не подія Linux OOM-killer

    OpenClaw записує попередження під час запуску, коли виявляє WSL2, увімкнений `ollama.service` з `Restart=always` і видимі маркери CUDA.

    Пом’якшення:

    ```bash
    sudo systemctl disable ollama
    ```

    Додайте це до `%USERPROFILE%\.wslconfig` на боці Windows, потім виконайте `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Установіть коротший keep-alive в середовищі сервісу Ollama або запускайте Ollama вручну лише тоді, коли він потрібен:

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
    - Віддалений хост потребує змін firewall або LAN-прив’язки на боці Ollama.
    - Модель присутня в daemon на вашому ноутбуці, але відсутня у віддаленому daemon.

  </Accordion>

  <Accordion title="Модель виводить JSON інструменту як текст">
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

    Якщо мала локальна модель усе ще не проходить схеми інструментів, установіть `compat.supportsTools: false` для запису цієї моделі й перевірте повторно.

  </Accordion>

  <Accordion title="Kimi або GLM повертає спотворені символи">
    Розміщені відповіді Kimi/GLM, які є довгими нелінгвістичними послідовностями символів, обробляються як невдалий вивід постачальника, а не як успішна відповідь асистента. Це дає змогу звичайній повторній спробі, fallback або обробці помилки продовжити роботу без збереження пошкодженого тексту в сесії.

    Якщо це повторюється, зафіксуйте сире ім’я моделі, поточний файл сесії та чи запуск використовував `Cloud + Local` або `Cloud only`, потім спробуйте нову сесію й fallback-модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує час очікування">
    Великі локальні моделі можуть потребувати тривалого першого завантаження до початку стримінгу. Обмежте timeout постачальником Ollama і, за бажання, попросіть Ollama тримати модель завантаженою між ходами:

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

  <Accordion title="Модель із великим контекстом надто повільна або вичерпує пам’ять">
    Багато моделей Ollama оголошують контексти, більші за ті, які ваше обладнання може комфортно виконувати. Нативний Ollama використовує власне значення контексту runtime за замовчуванням, якщо ви не встановите `params.num_ctx`. Обмежте і бюджет OpenClaw, і контекст запиту Ollama, коли вам потрібна передбачувана затримка до першого токена:

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
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
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
    Повне налаштування й деталі поведінки для вебпошуку на базі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
