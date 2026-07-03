---
read_when:
    - Ви хочете запускати OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні інструкції з налаштування та конфігурації Ollama
    - Вам потрібні моделі бачення Ollama для розуміння зображень
summary: Запускайте OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:58:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/самостійно розміщених серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` із `https://ollama.com` або `Local only` через доступний хост Ollama.

OpenClaw також реєструє `ollama-cloud` як повноцінний ідентифікатор розміщеного провайдера для
прямого використання Ollama Cloud. Використовуйте посилання на кшталт `ollama-cloud/kimi-k2.5:cloud`, коли
потрібна лише хмарна маршрутизація без спільного використання локального ідентифікатора провайдера `ollama`.

Окрему сторінку налаштування лише для хмари див. у [Ollama Cloud](/uk/providers/ollama-cloud).

<Warning>
**Користувачі віддаленого Ollama**: Не використовуйте з OpenClaw OpenAI-сумісний URL `/v1` (`http://host:11434/v1`). Це ламає виклики інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації варто надавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні та LAN-хости">
    Локальні та LAN-хости Ollama не потребують справжнього bearer-токена. OpenClaw використовує локальний маркер `ollama-local` лише для loopback, приватної мережі, `.local` і базових URL Ollama з простим іменем хоста.
  </Accordion>
  <Accordion title="Віддалені хости та хости Ollama Cloud">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера. Для прямого розміщеного використання надавайте перевагу провайдеру `ollama-cloud`.
  </Accordion>
  <Accordion title="Користувацькі ідентифікатори провайдерів">
    Користувацькі ідентифікатори провайдерів, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, що вказує на приватний LAN-хост Ollama, може використовувати `apiKey: "ollama-local"`, і підагенти розв’язуватимуть цей маркер через хук провайдера Ollama, а не трактуватимуть його як відсутні облікові дані. Пошук у пам’яті також може задати `agents.defaults.memorySearch.provider` як цей користувацький ідентифікатор провайдера, щоб embeddings використовували відповідну кінцеву точку Ollama.
  </Accordion>
  <Accordion title="Профілі автентифікації">
    `auth-profiles.json` зберігає облікові дані для ідентифікатора провайдера. Розміщуйте налаштування кінцевої точки (`baseUrl`, `api`, ідентифікатори моделей, заголовки, тайм-аути) у `models.providers.<id>`. Старі пласкі файли профілів автентифікації, як-от `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не є runtime-форматом; запустіть `openclaw doctor --fix`, щоб переписати їх у канонічний профіль API-ключа `ollama-windows:default` із резервною копією. `baseUrl` у цьому файлі є шумом сумісності, і його слід перенести до конфігурації провайдера.
  </Accordion>
  <Accordion title="Область embeddings пам’яті">
    Коли Ollama використовується для embeddings пам’яті, bearer-автентифікація обмежується хостом, де її було оголошено:

    - Ключ рівня провайдера надсилається лише на хост Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише на його віддалений хост embeddings.
    - Чисте значення env `OLLAMA_API_KEY` трактується як конвенція Ollama Cloud і типово не надсилається на локальні або самостійно розміщені хости.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний метод і режим налаштування.

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
        - **Хмара + локально** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Лише хмара** — розміщені моделі Ollama через `https://ollama.com`
        - **Лише локально** — лише локальні моделі

      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує розміщені хмарні типові значення. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. Коли Ollama повідомляє про встановлений тег `:latest`, наприклад `gemma4:latest`, налаштування показує цю встановлену модель один раз замість того, щоб показувати і `gemma4`, і `gemma4:latest` або знову завантажувати голий псевдонім. `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для доступу до хмари.
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

    За бажанням укажіть користувацький базовий URL або модель:

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
        - **Хмара + локально**: установіть Ollama, увійдіть за допомогою `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Лише хмара**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Лише локально**: установіть Ollama з [ollama.com/download](https://ollama.com/download)

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
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для налаштувань із хостом підійде будь-яке placeholder-значення:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перевірте та задайте свою модель">
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
  <Tab title="Хмара + локально">
    `Cloud + Local` використовує доступний хост Ollama як контрольну точку і для локальних, і для хмарних моделей. Це бажаний гібридний потік Ollama.

    Використовуйте **Хмара + локально** під час налаштування. OpenClaw запитує базовий URL Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи хост увійшов у систему для хмарного доступу через `ollama signin`. Коли хост увійшов у систему, OpenClaw також пропонує розміщені хмарні типові значення, як-от `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо хост ще не увійшов у систему, OpenClaw залишає налаштування лише локальним, доки ви не запустите `ollama signin`.

  </Tab>

  <Tab title="Лише хмара">
    `Cloud only` працює з розміщеним API Ollama на `https://ollama.com`.

    Використовуйте **Лише хмара** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, задає `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється наживо з `https://ollama.com/api/tags`, обмежений 500 записами, тому вибір відображає поточний розміщений каталог, а не статичний початковий набір. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих пропозицій, щоб онбординг усе одно завершився.

    Ви також можете напряму налаштувати повноцінного хмарного провайдера:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Лише локально">
    У режимі лише локально OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або самостійно розміщених серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як локальне типове значення.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama` або іншого користувацького віддаленого провайдера з `api: "ollama"`, OpenClaw виявляє моделі з локального екземпляра Ollama на `http://127.0.0.1:11434`.

| Поведінка            | Деталі                                                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Запитує `/api/tags`                                                                                                                                                           |
| Виявлення можливостей | Використовує best-effort-запити `/api/show`, щоб прочитати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, зокрема vision/tools                       |
| Vision-моделі        | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично вставляє зображення в prompt |
| Виявлення reasoning  | Використовує можливості `/api/show`, коли вони доступні, зокрема `thinking`; повертається до евристики за назвою моделі (`r1`, `reasoning`, `think`), коли Ollama пропускає можливості |
| Ліміти токенів       | Задає `maxTokens` як типовий ліміт максимальної кількості токенів Ollama, який використовує OpenClaw                                                                           |
| Вартість             | Задає всі вартості як `0`                                                                                                                                                      |

Це усуває потребу в ручних записах моделей, зберігаючи каталог узгодженим із локальним екземпляром Ollama. Ви можете використовувати повне посилання на кшталт `ollama/<pulled-model>:latest` у локальному `infer model run`; OpenClaw розв’язує цю встановлену модель із live-каталогу Ollama без потреби в написаному вручну записі `models.json`.

Для хостів Ollama, що увійшли в систему, деякі моделі `:cloud` можуть бути придатними до використання через `/api/chat`
і `/api/show` до того, як вони з’являться в `/api/tags`. Коли ви явно вибираєте
повне посилання `ollama/<model>:cloud`, OpenClaw перевіряє саме цю відсутню модель через
`/api/show` і додає її до runtime-каталогу лише якщо Ollama підтверджує
метадані моделі. Хибні назви й далі завершуються помилкою як невідомі моделі, а не створюються автоматично.

```bash
# See what models are available
ollama list
openclaw models list
```

Для вузького smoke-тесту генерації тексту, який оминає повну поверхню інструментів агента,
використовуйте локальний `infer model run` із повним посиланням на модель Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Цей шлях усе ще використовує налаштований провайдер OpenClaw, автентифікацію та нативний
транспорт Ollama, але не запускає хід chat-агента і не завантажує контекст MCP/інструментів. Якщо
це успішно, а звичайні відповіді агента падають, далі усувайте несправності з місткістю моделі для
prompt агента/інструментів.

Для вузького smoke-тесту vision-моделі тим самим легким шляхом додайте один або кілька
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

`model run --file` приймає файли, визначені як `image/*`, зокрема поширені вхідні PNG, JPEG і WebP. Не зображення відхиляються до виклику Ollama. Для розпізнавання мовлення натомість використовуйте `openclaw infer audio transcribe`.

Коли ви перемикаєте розмову за допомогою `/model ollama/<model>`, OpenClaw розглядає це як точний вибір користувача. Якщо налаштований Ollama `baseUrl` недоступний, наступна відповідь завершується помилкою провайдера, а не мовчки відповідає з іншої налаштованої резервної моделі.

Ізольовані cron-завдання виконують одну додаткову локальну перевірку безпеки перед запуском ходу агента. Якщо вибрана модель розв’язується в локальний, приватно-мережевий або `.local` провайдер Ollama і `/api/tags` недоступний, OpenClaw записує цей cron-запуск як `skipped` з вибраним `ollama/<model>` у тексті помилки. Попередня перевірка endpoint кешується на 5 хвилин, тому кілька cron-завдань, спрямованих на той самий зупинений daemon Ollama, не запускають усі невдалі запити до моделі.

Перевірте наживо локальний текстовий шлях, шлях нативного stream і embeddings проти локального Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Для smoke-тестів ключа API Ollama Cloud спрямуйте live-тест на `https://ollama.com` і виберіть розміщену модель із поточного каталогу:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Cloud smoke запускає текст, нативний stream і вебпошук. За замовчуванням він пропускає embeddings для `https://ollama.com`, тому що ключі API Ollama Cloud можуть не авторизувати `/api/embed`. Установіть `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, коли явно хочете, щоб live-тест завершився невдачею, якщо налаштований cloud-ключ не може використовувати embed endpoint.

Щоб додати нову модель, просто завантажте її через Ollama:

```bash
ollama pull mistral
```

Нову модель буде автоматично виявлено, і вона стане доступною для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama` або налаштовуєте власний віддалений провайдер, наприклад `models.providers.ollama-cloud` з `api: "ollama"`, автоматичне виявлення пропускається, і ви маєте визначити моделі вручну. Власні loopback-провайдери, як-от `http://127.0.0.2:11434`, все одно вважаються локальними. Див. розділ явної конфігурації нижче.
</Note>

## Локальний для Node inference

Агенти можуть делегувати коротке завдання моделі Ollama, установленій на спареному desktop- або server-вузлі. Prompt і відповідь проходять через наявне автентифіковане з’єднання Gateway/node; запит до моделі виконується на вибраному вузлі проти його стандартного loopback endpoint Ollama (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Запустіть Ollama на вузлі">
    Завантажте принаймні одну chat-модель і тримайте Ollama запущеним:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Під’єднайте хост вузла">
    На тій самій машині, що й Ollama, під’єднайте хост вузла до Gateway:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Схваліть новий пристрій і його оголошені команди вузла на хості Gateway, потім перевірте вузол:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Перше під’єднання і оновлення, яке додає команди Ollama, можуть обидва запускати схвалення команд вузла. Якщо вузол під’єднується без оголошення `ollama.models` і `ollama.chat`, знову перевірте `openclaw nodes pending`.

  </Step>
  <Step title="Попросіть агента використати локальний inference">
    Вбудований Ollama Plugin надає інструмент `node_inference`. Агенти спочатку використовують `action: "discover"`, потім `action: "run"` з поверненими вузлом і моделлю. Якщо під’єднано рівно один придатний вузол, `run` може опустити вузол.

    Наприклад: “Вияви моделі Ollama на моїх вузлах, потім використай найшвидшу завантажену модель, щоб підсумувати цей текст.”

  </Step>
</Steps>

Виявлення читає `/api/tags`, перевіряє можливості `/api/show` і використовує `/api/ps`, коли доступно, щоб ранжувати вже завантажені моделі першими. Воно повертає лише локальні моделі, придатні для chat: рядки Ollama Cloud і моделі лише для embedding виключаються. Кожен запуск просить Ollama вимкнути thinking моделі й обмежує вивід 512 токенами, якщо виклик інструмента не просить інше значення `maxTokens`. Деякі моделі, як-от GPT-OSS, не підтримують вимкнення thinking і все одно можуть використовувати reasoning tokens.

Щоб тримати Ollama запущеним на вузлі, не роблячи його доступним агентам, задайте таке в конфігурації, яку використовує цей хост вузла:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Якщо вузол використовує foreground-команду `openclaw node run` із налаштування вище, зупиніть цей процес і знову запустіть команду. Якщо він використовує встановлену службу вузла, виконайте `openclaw node restart`.

Вузол припиняє оголошувати `ollama.models` і `ollama.chat`; сам Ollama і Ollama-провайдер Gateway залишаються без змін. Установіть значення `true` і перезапустіть вузол, щоб знову оголошувати локальний inference. Змінена поверхня команд може потребувати схвалення через `openclaw nodes pending` після повторного під’єднання.

Ви можете перевірити ті самі команди вузла без ходу агента:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

Node-локальний inference навмисно не перевикористовує віддалений або cloud `models.providers.ollama.baseUrl`. Запустіть Ollama на стандартному loopback endpoint вузла. Команди вузла доступні за замовчуванням на хостах вузлів macOS, Linux і Windows та залишаються під дією звичайної політики pairing вузлів і команд.

## Vision та опис зображень

Вбудований Ollama Plugin реєструє Ollama як провайдера розуміння медіа з підтримкою зображень. Це дає OpenClaw змогу спрямовувати явні запити опису зображень і налаштовані стандартні image-моделі через локальні або розміщені vision-моделі Ollama.

Для локального vision завантажте модель, що підтримує зображення:

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

`--model` має бути повним ref `<provider/model>`. Коли його задано, `openclaw infer image describe` спочатку пробує цю модель, а не пропускає опис через те, що модель підтримує нативний vision. Якщо виклик моделі завершується невдачею, OpenClaw може продовжити через налаштовані `agents.defaults.imageModel.fallbacks`; помилки підготовки файлу або URL все одно завершуються невдачею до спроб fallback.

Використовуйте `infer image describe`, коли потрібні потік провайдера розуміння зображень OpenClaw, налаштований `agents.defaults.imageModel` і форма виводу опису зображення. Використовуйте `infer model run --file`, коли потрібен сирий probe мультимодальної моделі з власним prompt і одним або кількома зображеннями.

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

Надавайте перевагу повному ref `ollama/<model>`. Якщо та сама модель перелічена в `models.providers.ollama.models` з `input: ["text", "image"]` і жоден інший налаштований image-провайдер не надає цей bare ID моделі, OpenClaw також нормалізує bare ref `imageModel`, як-от `qwen2.5vl:7b`, до `ollama/qwen2.5vl:7b`. Якщо більш ніж один налаштований image-провайдер має той самий bare ID, явно використовуйте префікс провайдера.

Повільним локальним vision-моделям може знадобитися довший timeout розуміння зображень, ніж cloud-моделям. Вони також можуть аварійно завершуватися або зупинятися, коли Ollama намагається виділити повний оголошений vision context на обмеженому обладнанні. Задайте timeout можливості й обмежте `num_ctx` у записі моделі, коли вам потрібен лише звичайний хід опису зображення:

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

Цей timeout застосовується до вхідного розуміння зображень і до явного інструмента `image`, який агент може викликати під час ходу. Provider-level `models.providers.ollama.timeoutSeconds` усе ще керує базовим guard HTTP-запиту Ollama для звичайних викликів моделі.

Перевірте наживо явний image-інструмент проти локального Ollama за допомогою:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначте vision-моделі підтримкою image-вводу:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити опису зображень для моделей, які не позначені як image-capable. За неявного виявлення OpenClaw читає це з Ollama, коли `/api/show` повідомляє про vision-можливість.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший шлях увімкнення лише локально — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо `OLLAMA_API_KEY` задано, можна опустити `apiKey` у записі провайдера, і OpenClaw заповнить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, коли потрібне налаштування hosted cloud, Ollama працює на іншому хості/порту, ви хочете примусово задати конкретні context windows або списки моделей, або вам потрібні повністю ручні визначення моделей.

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
    Не додавайте `/v1` до URL. Шлях `/v1` використовує OpenAI-сумісний режим, у якому tool calling ненадійний. Використовуйте базовий URL Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

## Поширені рецепти

Використовуйте їх як початкові варіанти та замінюйте ідентифікатори моделей точними назвами з `ollama list` або `openclaw models list --provider ollama`.

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

    Цей шлях зводить конфігурацію до мінімуму. Не додавайте блок `models.providers.ollama`, якщо не хочете визначати моделі вручну.

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

    `contextWindow` — це бюджет контексту на боці OpenClaw. `params.num_ctx` надсилається до Ollama для запиту. Узгоджуйте їх, коли ваше обладнання не може запускати повний заявлений контекст моделі.

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

  <Accordion title="Multiple Ollama hosts">
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

    Коли OpenClaw надсилає запит, префікс активного провайдера вилучається, тож `ollama-large/qwen3.5:27b` надходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Деякі локальні моделі можуть відповідати на прості промпти, але мають труднощі з повною поверхнею інструментів агента. Почніть з обмеження інструментів і контексту, перш ніж змінювати глобальні налаштування середовища виконання.

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

    Використовуйте `compat.supportsTools: false` лише тоді, коли модель або сервер стабільно дає збій на схемах інструментів. Це обмінює можливості агента на стабільність.
    `localModelLean` прибирає браузер, cron та інструменти повідомлень із прямої поверхні агента й за замовчуванням переносить більші каталоги за структуровані елементи керування Tool Search, окрім випадків, коли запуск має зберегти семантику прямої доставки повідомлень, але це не змінює контекст середовища виконання Ollama або режим мислення. Поєднуйте це з явними `params.num_ctx` і `params.thinking: false` для малих моделей мислення в стилі Qwen, які зациклюються або витрачають бюджет відповіді на приховане міркування.

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

Власні ідентифікатори провайдерів Ollama також підтримуються. Коли посилання на модель використовує префікс активного
провайдера, як-от `ollama-spark/qwen3:32b`, OpenClaw вилучає лише цей
префікс перед викликом Ollama, тож сервер отримує `qwen3:32b`.

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

`timeoutSeconds` застосовується до HTTP-запиту моделі, включно з установленням з’єднання,
заголовками, потоковою передачею тіла та загальним перериванням захищеного fetch. `params.keep_alive`
передається до Ollama як верхньорівневий `keep_alive` у нативних запитах `/api/chat`;
задавайте його для кожної моделі, коли вузьким місцем є час завантаження першого звернення.

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

Для віддалених хостів замініть `127.0.0.1` на хост, використаний у `baseUrl`. Якщо `curl` працює, а OpenClaw — ні, перевірте, чи Gateway не працює на іншій машині, у контейнері або під іншим обліковим записом служби.

## Вебпошук Ollama

OpenClaw підтримує **Вебпошук Ollama** як вбудованого провайдера `web_search`.

| Властивість | Деталі                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` використовує розміщений API напряму |
| Автентифікація | Без ключа для локальних хостів Ollama із виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` чи хостів із захищеною автентифікацією |
| Вимога      | Локальні/самостійно розміщені хости мають працювати й бути авторизовані через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` і справжнього API-ключа Ollama |

Виберіть **Вебпошук Ollama** під час `openclaw onboard` або `openclaw configure --section web`, або задайте:

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

Для локального демона з виконаним входом OpenClaw використовує проксі демона `/api/experimental/web_search`. Для `https://ollama.com` він напряму викликає розміщену кінцеву точку `/api/web_search`.

<Note>
Повне налаштування й деталі поведінки див. у [Вебпошук Ollama](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **Виклик інструментів ненадійний у режимі сумісності з OpenAI.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо натомість потрібно використати сумісну з OpenAI кінцеву точку (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

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

    Цей режим може не підтримувати потокову передачу й виклик інструментів одночасно. Можливо, вам потрібно буде вимкнути потокову передачу за допомогою `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням вставляє `options.num_ctx`, щоб Ollama не повертався непомітно до контекстного вікна 4096. Якщо ваш проксі або upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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

  <Accordion title="Context windows">
    Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, повідомлене Ollama, коли воно доступне, включно з більшими значеннями `PARAMETER num_ctx` із власних Modelfile. Інакше він повертається до стандартного контекстного вікна Ollama, яке використовує OpenClaw.

    Ви можете задати типові значення рівня провайдера `contextWindow`, `contextTokens` і `maxTokens` для кожної моделі цього провайдера Ollama, а потім за потреби перевизначати їх для окремих моделей. `contextWindow` — це бюджет підказки й Compaction в OpenClaw. Нативні запити Ollama залишають `options.num_ctx` незаданим, якщо ви явно не налаштуєте `params.num_ctx`, тож Ollama може застосувати власне типове значення моделі, `OLLAMA_CONTEXT_LENGTH` або типове значення на основі VRAM. Щоб обмежити або примусово задати контекст виконання Ollama для окремого запиту без перебудови Modelfile, задайте `params.num_ctx`; недійсні, нульові, від’ємні та нескінченні значення ігноруються. Якщо ви оновили старішу конфігурацію, яка використовувала лише `contextWindow` або `maxTokens`, щоб примусово задати контекст нативного запиту Ollama, запустіть `openclaw doctor --fix`, щоб скопіювати ці явні бюджети провайдера або моделі в `params.num_ctx`. OpenAI-сумісний адаптер Ollama досі типово вставляє `options.num_ctx` із налаштованого `params.num_ctx` або `contextWindow`; вимкніть це за допомогою `injectNumCtxForOpenAICompat: false`, якщо ваш upstream відхиляє `options`.

    Записи нативних моделей Ollama також приймають поширені параметри виконання Ollama в `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw пересилає лише ключі запитів Ollama, тому параметри виконання OpenClaw, як-от `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надіслати верхньорівневий Ollama `think`; `false` вимикає мислення на рівні API для моделей мислення в стилі Qwen.

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

    Для окремої моделі також працює `agents.defaults.models["ollama/<model>"].params.num_ctx`. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над типовим значенням агента.

  </Accordion>

  <Accordion title="Керування мисленням">
    Для нативних моделей Ollama OpenClaw пересилає керування мисленням так, як очікує Ollama: верхньорівневий `think`, а не `options.think`. Автоматично виявлені моделі, чия відповідь `/api/show` містить можливість `thinking`, показують `/think low`, `/think medium`, `/think high` і `/think max`; моделі без мислення показують лише `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Ви також можете задати типове значення моделі:

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

    Параметри окремої моделі `params.think` або `params.thinking` можуть вимикати або примусово вмикати мислення API Ollama для конкретної налаштованої моделі. OpenClaw зберігає ці явні параметри моделі, коли активний запуск має лише неявне типове значення `off`; команди виконання не `off`, як-от `/think medium`, усе одно перевизначають активний запуск.

  </Accordion>

  <Accordion title="Моделі міркування">
    OpenClaw типово розглядає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` як здатні до міркування.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткове налаштування не потрібне. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безкоштовна й працює локально, тому вартість усіх моделей встановлено на $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Векторні подання пам’яті">
    Вбудований Ollama Plugin реєструє провайдера векторних подань пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовану базову URL-адресу
    Ollama і ключ API, викликає поточну кінцеву точку Ollama `/api/embed` і, коли можливо,
    об’єднує кілька фрагментів пам’яті в один запит `input`.

    Коли `proxy.enabled=true`, запити векторних подань пам’яті Ollama до точної
    host-local loopback origin, отриманої з налаштованого `baseUrl`, використовують
    захищений прямий шлях OpenClaw замість керованого прямого проксі. Налаштоване
    ім’я хоста саме має бути `localhost` або літералом IP loopback; DNS-імена, які
    лише розв’язуються в loopback, усе одно використовують керований шлях проксі.
    Хости Ollama в LAN, tailnet, приватній мережі та публічній мережі також залишаються
    на керованому шляху проксі. Перенаправлення на інший хост або порт не успадковують довіру.
    Оператори все ще можуть задати глобальний параметр `proxy.loopbackMode: "proxy"`,
    щоб надсилати loopback-трафік через проксі, або `proxy.loopbackMode: "block"`,
    щоб заборонити loopback-з’єднання до відкриття з’єднання; див.
    [Керований проксі](/uk/security/network-proxy#gateway-loopback-mode), щоб дізнатися про
    вплив цього параметра на весь процес.

    | Властивість    | Значення               |
    | --------------- | ---------------------- |
    | Типова модель   | `nomic-embed-text`     |
    | Автозавантаження | Так — модель векторних подань автоматично завантажується, якщо її немає локально |

    Векторні подання під час запиту використовують префікси отримання для моделей, які їх вимагають або рекомендують, зокрема `nomic-embed-text`, `qwen3-embedding` і `mxbai-embed-large`. Пакети документів пам’яті залишаються сирими, щоб наявні індекси не потребували міграції формату.

    Щоб вибрати Ollama як провайдера векторних подань для пошуку в пам’яті:

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

    Для віддаленого хоста векторних подань тримайте автентифікацію обмеженою цим хостом:

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
    Інтеграція Ollama в OpenClaw типово використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує потокове передавання та виклики інструментів одночасно. Спеціальне налаштування не потрібне.

    Для нативних запитів `/api/chat` OpenClaw також пересилає керування мисленням безпосередньо до Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневий `think: false`, якщо не налаштовано явне значення моделі `params.think`/`params.thinking`, а `/think low|medium|high` надсилають відповідний рядок зусилля верхньорівневого `think`. `/think max` відображається на найвище нативне зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісну кінцеву точку, див. розділ "Застарілий OpenAI-сумісний режим" вище. Потокове передавання та виклики інструментів можуть не працювати одночасно в цьому режимі.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Цикл аварій WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює systemd-модуль `ollama.service` з `Restart=always`. Якщо ця служба автоматично запускається й завантажує модель із підтримкою GPU під час завантаження WSL2, Ollama може закріпити пам’ять хоста, доки модель завантажується. Повернення пам’яті Hyper-V не завжди може повернути ці закріплені сторінки, тому Windows може завершити VM WSL2, systemd знову запускає Ollama, і цикл повторюється.

    Типові докази:

    - повторні перезавантаження або завершення WSL2 з боку Windows
    - високе навантаження CPU в `app.slice` або `ollama.service` невдовзі після запуску WSL2
    - SIGTERM від systemd, а не подія Linux OOM-killer

    OpenClaw записує попередження під час запуску, коли виявляє WSL2, увімкнений `ollama.service` з `Restart=always` і видимі маркери CUDA.

    Пом’якшення:

    ```bash
    sudo systemctl disable ollama
    ```

    Додайте це до `%USERPROFILE%\.wslconfig` на боці Windows, а потім запустіть `wsl --shutdown`:

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
    Переконайтеся, що Ollama запущена, що ви задали `OLLAMA_API_KEY` (або профіль автентифікації), і що ви **не** визначили явний запис `models.providers.ollama`:

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
    Перевірте з тієї самої машини й середовища виконання, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Типові причини:

    - `baseUrl` вказує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL використовує `/v1`, що вибирає OpenAI-сумісну поведінку замість нативної Ollama.
    - Віддалений хост потребує змін фаєрвола або прив’язки LAN на боці Ollama.
    - Модель є в демоні вашого ноутбука, але її немає у віддаленому демоні.

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

    Якщо мала локальна модель усе ще не справляється зі схемами інструментів, задайте `compat.supportsTools: false` у записі цієї моделі й повторіть тест.

  </Accordion>

  <Accordion title="Kimi або GLM повертає спотворені символи">
    Розміщені відповіді Kimi/GLM, які є довгими, нелінгвістичними послідовностями символів, обробляються як невдалий вивід провайдера, а не як успішна відповідь помічника. Це дозволяє звичайній повторній спробі, резервному варіанту або обробці помилок спрацювати без збереження пошкодженого тексту в сеансі.

    Якщо це повторюється, зафіксуйте сиру назву моделі, поточний файл сеансу та чи запуск використовував `Cloud + Local` або `Cloud only`, а потім спробуйте новий сеанс і резервну модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує час очікування">
    Великим локальним моделям може знадобитися тривале перше завантаження перед початком потокового передавання. Тримайте час очікування обмеженим провайдером Ollama і, за бажання, попросіть Ollama тримати модель завантаженою між ходами:

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

  <Accordion title="Модель із великим контекстом надто повільна або вичерпує пам’ять">
    Багато моделей Ollama заявляють контексти, більші за ті, які ваше обладнання може комфортно виконувати. Нативний Ollama використовує власне стандартне значення контексту виконання Ollama, якщо ви не задасте `params.num_ctx`. Обмежте і бюджет OpenClaw, і контекст запиту Ollama, коли потрібна передбачувана затримка до першого токена:

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

    Спочатку зменште `contextWindow`, якщо OpenClaw надсилає занадто великий prompt. Зменште `params.num_ctx`, якщо Ollama завантажує контекст виконання, який занадто великий для машини. Зменште `maxTokens`, якщо генерація триває занадто довго.

  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
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
    Повне налаштування та деталі поведінки вебпошуку на базі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
