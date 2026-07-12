---
read_when:
    - Ви хочете запустити OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки з налаштування та конфігурації Ollama
    - Ви хочете використовувати моделі комп’ютерного зору Ollama для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T13:37:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw взаємодіє з нативним API Ollama (`/api/chat`), а не із сумісною з OpenAI
кінцевою точкою `/v1`. Підтримуються три режими:

| Режим                   | Що використовується                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Хмара + локально        | Доступний хост Ollama, що обслуговує локальні моделі та (якщо виконано вхід) моделі `:cloud` |
| Лише хмара              | Безпосередньо `https://ollama.com`, без локального демона                                    |
| Лише локально           | Доступний хост Ollama, лише локальні моделі                                                  |

Щодо налаштування лише для хмари зі спеціальним ідентифікатором провайдера `ollama-cloud` див.
[Ollama Cloud](/uk/providers/ollama-cloud). Використовуйте посилання `ollama-cloud/<model>`, якщо
потрібно відокремити хмарну маршрутизацію від локального провайдера `ollama`.

<Warning>
Не використовуйте сумісну з OpenAI URL-адресу `/v1` (`http://host:11434/v1`). Вона порушує виклик інструментів, і моделі можуть виводити необроблений JSON виклику інструмента як звичайний текст. Використовуйте нативну URL-адресу: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Канонічний ключ конфігурації — `baseUrl`. `baseURL` також приймається для
прикладів у стилі OpenAI SDK, але в новій конфігурації слід використовувати `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні хости та хости LAN">
    URL-адреси Ollama для local loopback, приватної мережі, `.local` і простих імен хостів не потребують справжнього bearer-токена. OpenClaw використовує для них маркер `ollama-local`.
  </Accordion>
  <Accordion title="Віддалені хости та хости Ollama Cloud">
    Загальнодоступні віддалені хости та `https://ollama.com` потребують справжніх облікових даних: `OLLAMA_API_KEY`, профілю автентифікації або `apiKey` провайдера. Для безпосереднього використання розміщеного сервісу віддавайте перевагу провайдеру `ollama-cloud`.
  </Accordion>
  <Accordion title="Власні ідентифікатори провайдерів">
    Власний провайдер з `api: "ollama"` дотримується тих самих правил. Наприклад, провайдер `ollama-remote`, спрямований на приватний хост LAN, може використовувати `apiKey: "ollama-local"`; підагенти розпізнають цей маркер через хук провайдера Ollama, а не вважають його відсутніми обліковими даними. `agents.defaults.memorySearch.provider` також може вказувати на власний ідентифікатор провайдера, щоб вбудовування використовували відповідну кінцеву точку Ollama.
  </Accordion>
  <Accordion title="Профілі автентифікації">
    `auth-profiles.json` зберігає облікові дані для ідентифікатора провайдера; налаштування кінцевої точки (`baseUrl`, `api`, моделі, заголовки, тайм-аути) розміщуйте в `models.providers.<id>`. Старі пласкі файли, як-от `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не є форматом середовища виконання; `openclaw doctor --fix` перетворює їх на канонічний профіль ключа API `ollama-windows:default` із резервною копією. Значення `baseUrl` у такому застарілому файлі є зайвим і має бути перенесене до конфігурації провайдера.
  </Accordion>
  <Accordion title="Область дії вбудовувань пам’яті">
    Bearer-автентифікація для вбудовувань пам’яті Ollama обмежена хостом, для якого її оголошено:

    - Ключ рівня провайдера надсилається лише на хост цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише на відповідний віддалений хост вбудовувань.
    - Окреме значення змінної середовища `OLLAMA_API_KEY` вважається домовленістю Ollama Cloud і за замовчуванням не надсилається на локальні або самостійно розміщені хости.

  </Accordion>
</AccordionGroup>

## Початок роботи

<Tabs>
  <Tab title="Початкове налаштування (рекомендовано)">
    <Steps>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama**, а потім режим: **Хмара + локально**, **Лише хмара** або **Лише локально**.
      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує стандартні розміщені хмарні моделі. `Cloud + Local` та `Local only` запитують базову URL-адресу Ollama, виявляють доступні моделі й автоматично завантажують вибрану локальну модель, якщо її немає. Установлений тег `:latest`, як-от `gemma4:latest`, показується один раз без дублювання `gemma4`. `Cloud + Local` також перевіряє, чи виконано на хості вхід для доступу до хмари.
      </Step>
      <Step title="Перевірте">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Неінтерактивний режим:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` і `--custom-model-id` необов’язкові; якщо їх не вказати, використовуються локальний хост за замовчуванням і запропонована модель `gemma4`.

  </Tab>

  <Tab title="Ручне налаштування">
    <Steps>
      <Step title="Установіть і запустіть Ollama">
        Завантажте її з [ollama.com/download](https://ollama.com/download), а потім завантажте модель:

        ```bash
        ollama pull gemma4
        ```

        Для гібридного доступу до хмари виконайте `ollama signin` на тому самому хості.
      </Step>
      <Step title="Установіть облікові дані">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # локальний хост/LAN, підійде будь-яке значення
        export OLLAMA_API_KEY="your-real-key"   # лише https://ollama.com
        ```

        Або в конфігурації: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Виберіть модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або в конфігурації:

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

## Хмарні моделі через локальний хост

`Cloud + Local` маршрутизує як локальні моделі, так і моделі `:cloud` через один доступний
хост Ollama — це гібридний потік Ollama та режим, який слід вибрати під час налаштування,
якщо потрібні обидва типи моделей.

OpenClaw запитує базову URL-адресу, виявляє локальні моделі та перевіряє
стан `ollama signin`. Якщо вхід виконано, він пропонує стандартні розміщені моделі
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Якщо
вхід не виконано, налаштування залишається лише локальним, доки ви не виконаєте `ollama signin`.

Для доступу лише до хмари без локального демона використовуйте `openclaw onboard --auth-choice ollama-cloud` і див. [Ollama Cloud](/uk/providers/ollama-cloud) — цей шлях не потребує `ollama signin` або запущеного сервера:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється в реальному часі з
`https://ollama.com/api/tags` і обмежений 500 записами, тому засіб вибору відображає
поточний каталог розміщених моделей. Якщо `ollama.com` недоступний або не повертає
моделей під час налаштування, OpenClaw повертається до свого жорстко закодованого списку пропозицій, щоб
початкове налаштування все одно завершилося.

## Виявлення моделей (неявний провайдер)

Якщо встановлено `OLLAMA_API_KEY` (або профіль автентифікації) і не визначено ані
`models.providers.ollama`, ані іншого власного провайдера з `api: "ollama"`,
OpenClaw виявляє моделі з `http://127.0.0.1:11434`:

| Поведінка                    | Докладні відомості                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит до каталогу            | `/api/tags`                                                                                                                                                                                                                                                                                                                                        |
| Виявлення можливостей        | `/api/show` у режимі найкращої спроби зчитує `contextWindow`, параметри Modelfile `num_ctx` і можливості (зір/інструменти/мислення)                                                                                                                                                                                                                  |
| Моделі з підтримкою зору     | Можливість `vision` з `/api/show` позначає модель як здатну обробляти зображення (`input: ["text", "image"]`)                                                                                                                                                                                                                                      |
| Виявлення міркування         | Використовує можливість `thinking` з `/api/show`, коли вона доступна; інакше застосовує евристику за назвою (`r1`, `reason`, `reasoning`, `think`), якщо Ollama не надає можливостей. `glm-5.2:cloud` і `deepseek-v4-flash\|pro:cloud` завжди вважаються моделями з міркуванням незалежно від повідомлених можливостей. |
| Обмеження токенів            | `maxTokens` за замовчуванням дорівнює максимальному обмеженню токенів Ollama в OpenClaw                                                                                                                                                                                                                                                            |
| Вартість                     | Уся вартість дорівнює `0`                                                                                                                                                                                                                                                                                                                          |

```bash
ollama list
openclaw models list
```

Налаштування `models.providers.ollama` з явним масивом `models` або
власного провайдера з `api: "ollama"` та `baseUrl`, що не є local loopback,
вимикає автоматичне виявлення; тоді моделі потрібно визначити вручну (див.
[Конфігурація](#configuration)). Запис `models.providers.ollama`, спрямований на
розміщений сервіс `https://ollama.com`, також пропускає виявлення, оскільки моделями Ollama Cloud
керує провайдер. Власні провайдери local loopback, як-от
`http://127.0.0.2:11434`, усе ще вважаються локальними та зберігають автоматичне виявлення.

Можна використовувати повне посилання, як-от `ollama/<pulled-model>:latest`, без
вручну створеного запису `models.json`; OpenClaw розпізнає його в реальному часі. Для хостів,
на яких виконано вхід, вибір відсутнього в списку посилання `ollama/<model>:cloud` перевіряє саме цю
модель через `/api/show` і додає її до каталогу середовища виконання, лише якщо Ollama
підтверджує метадані — друкарські помилки й надалі призводять до помилки невідомої моделі.

### Димові тести

Для вузької текстової перевірки без повного набору агентських інструментів:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Додайте `--file` із зображенням для спрощеної перевірки моделі з підтримкою зору (приймаються PNG/JPEG/WebP;
файли, що не є зображеннями, відхиляються до виклику Ollama — для аудіо використовуйте
`openclaw infer audio transcribe`):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

Жоден із цих шляхів не завантажує інструменти чату, пам’ять або контекст сеансу. Якщо він працює,
а звичайні відповіді агента завершуються помилкою, проблема, імовірно, у здатності моделі працювати з інструментами або агентом,
а не в кінцевій точці.

Вибір моделі за допомогою `/model ollama/<model>` є точним вибором користувача: якщо
налаштований `baseUrl` недоступний, наступна відповідь завершується помилкою провайдера
замість непомітного переходу до іншої налаштованої моделі.

Ізольовані завдання Cron додають одну локальну перевірку безпеки перед початком ходу агента:
якщо вибрана модель розпізнається як провайдер Ollama у local loopback, приватній мережі або `.local`
і `/api/tags` недоступний, OpenClaw записує цей запуск як
`skipped`, зазначаючи модель у тексті помилки. Результат перевірки кінцевої точки кешується на
5 хвилин для кожного хоста, тому повторні завдання Cron для зупиненого демона не запускають усі
запити, що завершаться помилкою.

Перевірка в реальному часі:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Для Ollama Cloud спрямуйте той самий живий тест на розміщену кінцеву точку (за замовчуванням
вбудовування пропускаються; увімкніть примусово через `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, оскільки
хмарний ключ може не надавати доступ до `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Щоб додати модель, завантажте її, і її буде виявлено автоматично:

```bash
ollama pull mistral
```

## Локальний для Node інференс

Агенти можуть делегувати коротке завдання моделі Ollama на спареному настільному комп’ютері або
серверному Node. Запит і відповідь передаються через наявне автентифіковане
з’єднання Gateway/Node; запит виконується на власній local loopback кінцевій точці Ollama
цього Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Запустіть Ollama на Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Підключіть хост Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Схваліть пристрій і його команди Node на хості Gateway, а потім перевірте:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Перше підключення або оновлення, яке додає команди Ollama, може спричинити
    запит на схвалення команд Node. Якщо Node підключається без оголошення
    `ollama.models` і `ollama.chat`, знову перевірте `openclaw nodes pending`.

  </Step>
  <Step title="Використайте його з агента">
    Вбудований plugin Ollama надає інструмент `node_inference`. Агенти спочатку викликають
    `action: "discover"`, а потім `action: "run"` із Node та моделлю з
    отриманого результату (`run` може не вказувати Node, якщо підключено рівно один
    придатний Node). Наприклад: «Вияви моделі Ollama на моїх Node, а потім використай
    найшвидшу завантажену модель, щоб підсумувати цей текст».
  </Step>
</Steps>

Під час виявлення зчитується `/api/tags`, перевіряються можливості через `/api/show` і,
коли доступно, використовується `/api/ps`, щоб першими ранжувати вже завантажені моделі. Повертаються лише
локальні моделі, які Ollama позначає як придатні для чату (можливість `completion`) —
рядки Ollama Cloud і моделі лише для вбудовувань виключаються. Кожен запуск вимикає
мислення моделі та за замовчуванням обмежує вивід 512 токенами (жорстка межа — 8192), якщо
виклик інструмента не запитує інше значення `maxTokens`; деякі моделі (наприклад GPT-OSS)
не підтримують вимкнення мислення й усе одно можуть генерувати токени міркувань.

Щоб Ollama продовжувала працювати на Node без надання агентам доступу до неї:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Перезапустіть Node (`openclaw node restart` або зупиніть і повторно виконайте `openclaw node run`
для сеансу переднього плану). Node припинить оголошувати `ollama.models` і
`ollama.chat`; сама Ollama та провайдер Ollama у Gateway не зазнають змін.
Поверніть значення `true` і перезапустіть, щоб знову ввімкнути функцію; змінена поверхня
команд може знову потребувати схвалення через `openclaw nodes pending` після повторного підключення.

Перевірте команди Node безпосередньо, без ходу агента:

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

`--invoke-timeout` обмежує час, протягом якого Node може виконувати команду;
`--timeout` обмежує загальну тривалість виклику Gateway і має бути більшим.

Локальний для Node інференс завжди використовує власну local loopback кінцеву точку Node — він
не використовує повторно налаштовану віддалену або хмарну адресу `models.providers.ollama.baseUrl`.
Команди Node за замовчуванням доступні на хостах Node з macOS, Linux і Windows
та підпорядковуються звичайній політиці спарювання Node і виконання команд.

## Комп’ютерний зір і опис зображень

Вбудований plugin Ollama реєструє Ollama як провайдера
аналізу медіа з підтримкою зображень, тому OpenClaw може спрямовувати явні запити
на опис зображень і налаштовані типові моделі зображень через локальні або розміщені
моделі комп’ютерного зору Ollama.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` має бути повним посиланням `<provider/model>`; якщо його задано, `infer image
describe` спочатку намагається використати цю модель замість пропуску опису для моделей,
які вже мають вбудовану підтримку комп’ютерного зору. Якщо виклик завершується невдало, OpenClaw може продовжити
через `agents.defaults.imageModel.fallbacks`; помилки підготовки файлу або URL
спричиняють збій до спроби резервного варіанта. Використовуйте `infer image describe` для процесу
аналізу зображень OpenClaw і налаштованого `imageModel`; використовуйте `infer model run
--file` для безпосередньої мультимодальної перевірки з власним запитом.

Щоб зробити Ollama типовим провайдером аналізу вхідних зображень:

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

Надавайте перевагу повному посиланню `ollama/<model>`. Посилання `imageModel` без префікса, як-от
`qwen2.5vl:7b`, нормалізується до `ollama/qwen2.5vl:7b`, лише якщо саме ця модель
указана в `models.providers.ollama.models` із
`input: ["text", "image"]` і жоден інший налаштований провайдер зображень не надає
той самий ідентифікатор без префікса; інакше явно використовуйте префікс провайдера.

Повільні локальні моделі комп’ютерного зору можуть потребувати довшого часу очікування аналізу зображень, ніж
хмарні моделі, і можуть аварійно завершуватися на обладнанні з обмеженими ресурсами, якщо Ollama намагається
виділити повний заявлений контекст комп’ютерного зору моделі. Задайте час очікування
можливості й обмежте `num_ctx`:

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

Цей час очікування застосовується до аналізу вхідних зображень і явного
інструмента `image`. `models.providers.ollama.timeoutSeconds` і далі керує
базовим обмеженням HTTP-запиту Ollama для звичайних викликів моделей.

Перевірка в реальному середовищі:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, явно позначайте моделі
комп’ютерного зору:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, не позначених
як придатні для роботи із зображеннями. За неявного виявлення ця інформація надходить із можливості
комп’ютерного зору `/api/show`.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо задано `OLLAMA_API_KEY`, можна не вказувати `apiKey` у записі провайдера; OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (моделі вручну)">
    Використовуйте явну конфігурацію для розміщення в хмарі, нестандартного хоста або порту, примусово заданих
    вікон контексту чи повністю ручних списків моделей:

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
    Явна конфігурація вимикає автоматичне виявлення, тому моделі потрібно перелічити:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 — URL-адреса нативного API Ollama
            api: "ollama", // Явно: гарантує нативну поведінку виклику інструментів
            timeoutSeconds: 300, // Необов’язково: довший бюджет підключення/потоку для холодних локальних моделей
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Необов’язково: зберігати модель завантаженою між ходами
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Не додавайте `/v1`. Цей шлях вибирає режим сумісності з OpenAI, у якому виклик інструментів ненадійний.
    </Warning>

  </Tab>
</Tabs>

## Поширені рецепти

Замініть ідентифікатори моделей точними назвами з `ollama list` або
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Локальна модель з автоматичним виявленням">
    Ollama на тому самому комп’ютері, що й Gateway, виявляється автоматично:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Не додавайте блок `models.providers.ollama`, якщо вам не потрібне ручне налаштування моделей.

  </Accordion>

  <Accordion title="Хост Ollama у локальній мережі з ручним налаштуванням моделей">
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

    `contextWindow` — це бюджет контексту OpenClaw; `params.num_ctx` надсилається до
    Ollama. Узгоджуйте їх, якщо обладнання не може працювати з повним
    заявленим контекстом моделі.

  </Accordion>

  <Accordion title="Лише Ollama Cloud">
    Без локального демона, безпосереднє використання розміщених моделей:

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

    Щоб замість цієї структури використовувати окремий ідентифікатор провайдера `ollama-cloud`, див.
    [Ollama Cloud](/uk/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Хмара та локальні моделі через демон із виконаним входом">
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
    Використовуйте власні ідентифікатори провайдерів, коли запускаєте кілька серверів Ollama; кожен із них
    отримує власний хост, моделі, автентифікацію та час очікування.

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

    Перед викликом Ollama OpenClaw видаляє префікс активного провайдера (інакше
    використовує звичайний префікс `ollama/`), тому `ollama-large/qwen3.5:27b`
    надходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі справляються з простими запитами, але мають труднощі з повним
    набором інструментів агента. Обмежте інструменти та контекст, перш ніж змінювати глобальні
    параметри середовища виконання:

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

    Використовуйте `compat.supportsTools: false`, лише коли модель або сервер стабільно
    зазнає помилок на схемах інструментів — це обмінює можливості агента на стабільність.
    `localModelLean` вилучає ресурсомісткі інструменти браузера, cron, повідомлень, генерування медіа,
    голосу та PDF із безпосередньої поверхні агента, якщо вони явно не потрібні,
    і переміщує більші каталоги за Tool Search. Це не змінює контекст
    середовища виконання Ollama або режим мислення. Поєднуйте його з `params.num_ctx` і
    `params.thinking: false` для невеликих моделей мислення в стилі Qwen, які зациклюються або
    витрачають свій бюджет на приховані міркування.

  </Accordion>
</AccordionGroup>

### Вибір моделі

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

Власні ідентифікатори провайдерів працюють так само: для посилання, що використовує префікс активного
провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw видаляє цей префікс перед
викликом Ollama, надсилаючи `qwen3:32b`.

Для повільних локальних моделей спочатку віддавайте перевагу налаштуванню на рівні провайдера, перш ніж збільшувати
час очікування всього середовища виконання агента:

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

`timeoutSeconds` охоплює HTTP-запит до моделі: встановлення з’єднання, заголовки,
потокове передавання тіла та загальне захисне переривання отримання. `params.keep_alive`
передається як `keep_alive` верхнього рівня у власних запитах `/api/chat`; задавайте його для кожної
моделі, коли вузьким місцем є час завантаження під час першого звернення.

### Швидка перевірка

```bash
# Демон Ollama доступний із цієї машини
curl http://127.0.0.1:11434/api/tags

# Каталог OpenClaw і вибрана модель
openclaw models list --provider ollama
openclaw models status

# Безпосередня базова перевірка моделі
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Для віддалених хостів замініть `127.0.0.1` на хост із `baseUrl`. Якщо `curl`
працює, а OpenClaw — ні, перевірте, чи Gateway не працює на іншій
машині, у контейнері або під іншим обліковим записом служби.

## Вебпошук Ollama

OpenClaw постачається з **вебпошуком Ollama** як провайдером `web_search`.

| Властивість | Подробиці                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | `models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`; `https://ollama.com` використовує розміщений API безпосередньо             |
| Автентифікація | Без ключа для локального хоста з виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для безпосереднього пошуку через `https://ollama.com` чи захищених автентифікацією хостів |
| Вимога      | Локальні/самостійно розміщені хости мають працювати та мати виконаний вхід через `ollama signin`; безпосередній розміщений пошук потребує `baseUrl: "https://ollama.com"` і справжнього ключа API |

Виберіть його під час `openclaw onboard` або `openclaw configure --section web`, чи задайте:

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

Для безпосереднього розміщеного пошуку через Ollama Cloud:

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

Для самостійно розміщеного хоста OpenClaw спочатку намагається використати локальний проксі
`/api/experimental/web_search`, а потім переходить до розміщеного шляху `/api/web_search`
на тому самому хості; локальний демон із виконаним входом зазвичай відповідає через локальний проксі.
Безпосередні виклики `https://ollama.com` завжди використовують розміщену кінцеву точку `/api/web_search`.

<Note>
Повне налаштування та опис поведінки див. у розділі [Вебпошук Ollama](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий режим сумісності з OpenAI">
    <Warning>
    **Виклик інструментів у цьому режимі ненадійний.** Використовуйте його лише тоді, коли проксі потребує формату OpenAI, а ви не залежите від власного механізму виклику інструментів.
    </Warning>

    Явно задайте `api: "openai-completions"` для проксі, що працює за
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // типове значення: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Цей режим може не підтримувати одночасно потокове передавання та виклик інструментів;
    можливо, доведеться задати `params: { streaming: false }` для моделі.

    У цьому режимі OpenClaw типово додає `options.num_ctx`, щоб Ollama
    без попередження не повертався до контексту на 4096 токенів. Якщо ваш проксі відхиляє
    невідомі поля `options`, вимкніть це:

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
    Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, про яке повідомляє
    `/api/show`, включно з більшими значеннями `PARAMETER num_ctx` із власних
    Modelfile; інакше використовується типове контекстне вікно Ollama в OpenClaw.

    `contextWindow`, `contextTokens` і `maxTokens` на рівні провайдера задають
    типові значення для кожної моделі цього провайдера та можуть бути перевизначені для окремої
    моделі. `contextWindow` — це власний бюджет запиту/Compaction в OpenClaw. Власні
    запити `/api/chat` не задають `options.num_ctx`, якщо ви явно не встановили
    `params.num_ctx`, тому Ollama застосовує власне типове значення моделі,
    `OLLAMA_CONTEXT_LENGTH` або значення на основі VRAM; недійсні, нульові, від’ємні
    або нескінченні значення `params.num_ctx` ігноруються. Якщо стара конфігурація використовувала
    лише `contextWindow`/`maxTokens`, щоб примусово задати контекст власного запиту, запустіть
    `openclaw doctor --fix`, щоб скопіювати їх до `params.num_ctx`. Адаптер,
    сумісний з OpenAI, як і раніше типово додає `options.num_ctx` із
    налаштованого `params.num_ctx` або `contextWindow`; вимкніть це за допомогою
    `injectNumCtxForOpenAICompat: false`, якщо сервер вище за ланцюжком відхиляє `options`.

    Власні записи моделей також приймають поширені параметри середовища виконання Ollama в
    `params`, які передаються як `options` власного `/api/chat`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` і `num_thread`.
    Кілька ключів (`format`, `keep_alive`, `truncate`, `shift`) передаються як
    поля запиту верхнього рівня замість вкладених `options`. OpenClaw передає
    лише ці ключі запиту Ollama, тому параметри лише для середовища виконання, як-от
    `streaming`, ніколи не надсилаються до Ollama. Використовуйте `params.think` (або
    `params.thinking`), щоб задати `think` верхнього рівня; `false` вимикає мислення
    на рівні API для моделей мислення в стилі Qwen.

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

    Параметр `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі також
    працює; якщо задано обидва, пріоритет має явний запис моделі провайдера.

  </Accordion>

  <Accordion title="Керування мисленням">
    OpenClaw передає мислення у форматі, якого очікує Ollama: `think` верхнього рівня, а не
    `options.think`. Автоматично виявлені моделі, для яких `/api/show` повідомляє про
    можливість `thinking`, надають `/think low`, `/think medium`, `/think high`
    і `/think max`; моделі без мислення надають лише `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Або задайте типове значення для моделі:

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

    Параметри `params.think`/`params.thinking` для окремої моделі можуть вимкнути або примусово ввімкнути мислення через API
    для конкретної моделі. OpenClaw зберігає цю явну конфігурацію,
    коли активний запуск має лише неявне типове значення `off`; команда середовища виконання
    з іншим значенням, наприклад `/think medium`, усе одно перевизначає її. Істинний
    запит на мислення ніколи не надсилається моделі, явно позначеній як
    `reasoning: false`; запит `think: false` надсилається завжди.

  </Accordion>

  <Accordion title="Моделі з міркуванням">
    Моделі з назвами `deepseek-r1`, `reasoning`, `reason` або `think` типово вважаються
    здатними до міркування — додаткова конфігурація не потрібна:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama працює локально й безкоштовно, тому вартість усіх моделей дорівнює `0` як для
    автоматично виявлених, так і для визначених вручну моделей.
  </Accordion>

  <Accordion title="Векторні представлення пам’яті">
    Вбудований plugin Ollama реєструє постачальника векторних представлень пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані базову URL-адресу
    Ollama та ключ API, викликає `/api/embed` і, коли можливо, об’єднує кілька фрагментів пам’яті
    в один запит `input`.

    Коли `proxy.enabled=true`, запити векторних представлень до точного локального для хоста
    джерела local loopback, отриманого з налаштованого `baseUrl`, використовують захищений
    прямий шлях OpenClaw замість керованого проксі пересилання. Саме налаштоване
    ім’я хоста має бути `localhost` або літералом IP-адреси зворотного зв’язку — DNS-імена,
    які лише розв’язуються в адресу зворотного зв’язку, усе одно використовують шлях через
    керований проксі. Хости Ollama в LAN, tailnet, приватній або публічній мережі завжди
    залишаються на шляху через керований проксі, а переспрямування на інший хост або порт
    не успадковують довіру. `proxy.loopbackMode: "proxy"` усе одно спрямовує трафік
    зворотного зв’язку через проксі; `proxy.loopbackMode: "block"` забороняє його до
    встановлення з’єднання — див. [Керований проксі](/uk/security/network-proxy#gateway-loopback-mode).

    | Властивість | Значення |
    | --- | --- |
    | Типова модель | `nomic-embed-text` |
    | Автоматичне завантаження | Так, якщо модель відсутня локально |
    | Типова паралельність без пакетування | 1 (для інших постачальників типове значення вище; збільште за допомогою `nonBatchConcurrency`, якщо хост це витримає) |

    Векторні представлення під час запиту використовують префікси пошуку для моделей, які
    їх вимагають або рекомендують: `nomic-embed-text`, `qwen3-embedding` і
    `mxbai-embed-large`. Пакети документів залишаються необробленими, тому наявні індекси
    не потребують міграції формату.

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

    Для віддаленого хоста векторних представлень обмежте автентифікацію областю цього хоста:

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
    Ollama типово використовує **власний API** (`/api/chat`), який одночасно підтримує
    потокове передавання та виклики інструментів — спеціальна конфігурація не потрібна.

    Для власних запитів керування мисленням передається безпосередньо: `/think off`
    і `openclaw agent --thinking off` надсилають `think: false` верхнього рівня, якщо
    явно не налаштовано `params.think`/`params.thinking`; `/think
    low|medium|high` надсилає відповідний рядок інтенсивності; `/think max` відповідає
    найвищій інтенсивності Ollama — `think: "high"`.

    <Tip>
    Щоб натомість використовувати сумісну з OpenAI кінцеву точку, див. розділ «Застарілий режим сумісності з OpenAI» вище — потокове передавання та виклики інструментів у ньому можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Циклічні збої WSL2 (повторні перезавантаження)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює модуль
    systemd `ollama.service` із `Restart=always`. Якщо ця служба автоматично
    запускається й завантажує модель із підтримкою GPU під час завантаження WSL2,
    Ollama може закріпити пам’ять хоста під час завантаження; механізм повернення пам’яті
    Hyper-V не завжди може вивільнити ці сторінки, тому Windows може завершити роботу
    віртуальної машини WSL2, systemd перезапускає Ollama, і цикл повторюється.

    Ознаки: повторні перезавантаження або завершення роботи WSL2, високе використання
    процесора в `app.slice` або `ollama.service` відразу після запуску WSL2, а також
    SIGTERM від systemd, а не від засобу завершення процесів через нестачу пам’яті Linux.

    OpenClaw записує попередження під час запуску, коли виявляє WSL2, увімкнену
    `ollama.service` із `Restart=always` і видимі маркери CUDA.

    Спосіб усунення:

    ```bash
    sudo systemctl disable ollama
    ```

    На боці Windows додайте наведене нижче до `%USERPROFILE%\.wslconfig`, а потім виконайте
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Або скоротіть час підтримання активності чи запускайте Ollama вручну лише за потреби:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Див. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama не виявлено">
    Переконайтеся, що Ollama працює, `OLLAMA_API_KEY` (або профіль автентифікації) задано,
    а `models.providers.ollama` **не** визначено явно:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Завантажте модель локально або визначте її явно в
    `models.providers.ollama`:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="У з’єднанні відмовлено">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Віддалений хост працює з curl, але не з OpenClaw">
    Перевірте на тій самій машині й у тому самому середовищі виконання, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Поширені причини:

    - `baseUrl` указує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL-адреса містить `/v1`, що вибирає поведінку, сумісну з OpenAI, замість власної поведінки Ollama.
    - Віддалений хост потребує змін у брандмауері або прив’язуванні до LAN.
    - Модель наявна в службі на вашому ноутбуці, але відсутня у віддаленій службі.

  </Accordion>

  <Accordion title="Модель виводить JSON інструмента як текст">
    Зазвичай постачальник працює в режимі сумісності з OpenAI або модель не може
    обробляти схеми інструментів. Віддавайте перевагу власному режиму:

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

    Якщо невелика локальна модель усе одно не може працювати зі схемами інструментів, задайте
    `compat.supportsTools: false` у записі цієї моделі та повторіть перевірку.

  </Accordion>

  <Accordion title="Kimi або GLM повертає спотворені символи">
    Розміщені на сервері відповіді Kimi/GLM, що складаються з довгих послідовностей
    немовних символів, вважаються невдалим викликом постачальника, а не успішною
    відповіддю, тому замість збереження пошкодженого тексту в сеансі застосовується
    звичайна обробка повторних спроб, резервного перемикання або помилок.

    Якщо це повториться, зафіксуйте назву моделі, поточний файл сеансу й те,
    чи використовував запуск `Cloud + Local` або `Cloud only`, а потім спробуйте новий
    сеанс і резервну модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує час очікування">
    Великі локальні моделі можуть потребувати тривалого першого завантаження. Обмежте
    час очікування областю постачальника Ollama та, за потреби, залишайте модель
    завантаженою між ходами:

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

    Якщо сам хост повільно приймає з’єднання, `timeoutSeconds` також
    збільшує захищений час очікування підключення для цього постачальника.

  </Accordion>

  <Accordion title="Модель із великим контекстом працює надто повільно або вичерпує пам’ять">
    Багато моделей заявляють контексти, які перевищують можливості вашого обладнання
    для комфортної роботи. Власний режим Ollama використовує власне типове значення
    середовища виконання, якщо не задано `params.num_ctx`. Обмежте як бюджет OpenClaw,
    так і контекст запиту Ollama, щоб отримати передбачувану затримку до першого токена:

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

    Зменште `contextWindow`, якщо OpenClaw надсилає надто великий запит. Зменште
    `params.num_ctx`, якщо контекст середовища виконання Ollama завеликий для машини.
    Зменште `maxTokens`, якщо генерування триває надто довго.

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
</Note>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/uk/providers/ollama-cloud" icon="cloud">
    Налаштування лише для хмари зі спеціальним постачальником `ollama-cloud`.
  </Card>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Вебпошук Ollama" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування та поведінку вебпошуку на основі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
</CardGroup>
