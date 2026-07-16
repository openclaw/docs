---
read_when:
    - Ви хочете запускати OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки з установлення та налаштування Ollama
    - Вам потрібні моделі комп’ютерного зору Ollama для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-07-16T18:31:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw взаємодіє з нативним API Ollama (`/api/chat`), а не із сумісною з OpenAI
кінцевою точкою `/v1`. Підтримуються три режими:

| Режим                  | Що використовується                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------- |
| Хмара + локально       | Доступний хост Ollama, що обслуговує локальні моделі та (якщо виконано вхід) моделі `:cloud` |
| Лише хмара             | Безпосередньо `https://ollama.com`, без локального демона                                 |
| Лише локально          | Доступний хост Ollama, лише локальні моделі                                             |

Щодо налаштування лише для хмари з окремим ідентифікатором провайдера `ollama-cloud` див.
[Ollama Cloud](/uk/providers/ollama-cloud). Використовуйте посилання `ollama-cloud/<model>`, коли
потрібно відокремити хмарну маршрутизацію від локального провайдера `ollama`.

<Warning>
Не використовуйте сумісну з OpenAI URL-адресу `/v1` (`http://host:11434/v1`). Вона порушує виклик інструментів, і моделі можуть виводити необроблений JSON виклику інструмента як звичайний текст. Використовуйте нативну URL-адресу: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Канонічний ключ конфігурації — `baseUrl`. `baseURL` також приймається для
прикладів у стилі OpenAI SDK, але в новій конфігурації слід використовувати `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні хости та хости локальної мережі">
    URL-адреси Ollama для loopback, приватної мережі, `.local` і простого імені хоста не потребують справжнього bearer-токена. OpenClaw використовує для них маркер `ollama-local`.
  </Accordion>
  <Accordion title="Віддалені хости та хости Ollama Cloud">
    Загальнодоступні віддалені хости та `https://ollama.com` потребують справжніх облікових даних: `OLLAMA_API_KEY`, профілю автентифікації або `apiKey` провайдера. Для безпосереднього використання розміщеної служби надавайте перевагу провайдеру `ollama-cloud`.
  </Accordion>
  <Accordion title="Власні ідентифікатори провайдерів">
    Власний провайдер із `api: "ollama"` дотримується тих самих правил. Наприклад, провайдер `ollama-remote`, спрямований на приватний хост локальної мережі, може використовувати `apiKey: "ollama-local"`; підагенти розпізнають цей маркер через хук провайдера Ollama, а не вважають його відсутніми обліковими даними. `agents.defaults.memorySearch.provider` також може вказувати на власний ідентифікатор провайдера, щоб вбудовування використовували цю кінцеву точку Ollama.
  </Accordion>
  <Accordion title="Профілі автентифікації">
    `auth-profiles.json` зберігає облікові дані для ідентифікатора провайдера; параметри кінцевої точки (`baseUrl`, `api`, моделі, заголовки, тайм-аути) слід указувати в `models.providers.<id>`. Старі пласкі файли, як-от `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не є форматом середовища виконання; `openclaw doctor --fix` перетворює їх на канонічний профіль API-ключа `ollama-windows:default` зі створенням резервної копії. Значення `baseUrl` у такому застарілому файлі є зайвим і має бути перенесене до конфігурації провайдера.
  </Accordion>
  <Accordion title="Область дії вбудовувань пам’яті">
    Bearer-автентифікація для вбудовувань пам’яті Ollama обмежена хостом, для якого її було оголошено:

    - Ключ рівня провайдера надсилається лише на хост цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише на його віддалений хост вбудовувань.
    - Чисте значення змінної середовища `OLLAMA_API_KEY` вважається домовленістю Ollama Cloud і за замовчуванням не надсилається локальним або самостійно розміщеним хостам.

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

        Під час нового керованого налаштування OpenClaw спочатку перевіряє типовий або налаштований
        хост Ollama. Якщо встановлена модель заявляє про підтримку інструментів, спільна
        послідовність налаштування CLI/macOS одразу пропонує її та перевіряє за допомогою реального
        завершення. Ця автоматична перевірка ніколи не завантажує модель; якщо придатної
        встановленої моделі немає, початкове налаштування переходить до звичайного засобу вибору Ollama.
      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує типові хмарні моделі. `Cloud + Local` та `Local only` запитують базову URL-адресу Ollama, виявляють доступні моделі й автоматично завантажують вибрану локальну модель, якщо її немає. Установлений тег `:latest`, як-от `gemma4:latest`, показується один раз замість дублювання `gemma4`. `Cloud + Local` також перевіряє, чи виконано на хості вхід для доступу до хмари.
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

    `--custom-base-url` та `--custom-model-id` необов’язкові; якщо їх не вказати, використовуватимуться типовий локальний хост і запропонована модель `gemma4`.

  </Tab>

  <Tab title="Ручне налаштування">
    <Steps>
      <Step title="Установіть і запустіть Ollama">
        Завантажте її з [ollama.com/download](https://ollama.com/download), а потім завантажте модель:

        ```bash
        ollama pull gemma4
        ```

        Для гібридного доступу до хмари запустіть `ollama signin` на тому самому хості.
      </Step>
      <Step title="Установіть облікові дані">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # локальний хост або хост локальної мережі, підходить будь-яке значення
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

`Cloud + Local` спрямовує локальні моделі та моделі `:cloud` через один доступний
хост Ollama — це гібридний процес Ollama й режим, який слід вибрати під час налаштування,
якщо потрібні обидва варіанти.

OpenClaw запитує базову URL-адресу, виявляє локальні моделі та перевіряє
стан `ollama signin`. Якщо вхід виконано, він пропонує типові розміщені моделі
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Якщо
вхід не виконано, налаштування залишається лише локальним, доки не буде запущено `ollama signin`.

Для доступу лише до хмари без локального демона використовуйте `openclaw onboard --auth-choice ollama-cloud` і див. [Ollama Cloud](/uk/providers/ollama-cloud) — цей варіант не потребує `ollama signin` або запущеного сервера:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

Список хмарних моделей, що відображається під час `openclaw onboard`, динамічно отримується з
`https://ollama.com/api/tags` і обмежений 500 записами, тому засіб вибору відображає
поточний каталог розміщених моделей. Якщо `ollama.com` недоступний або не повертає
моделей під час налаштування, OpenClaw використовує як резервний варіант жорстко закодований список рекомендованих моделей, щоб
початкове налаштування все одно завершилося.

## Виявлення моделей (неявний провайдер)

Коли задано `OLLAMA_API_KEY` (або профіль автентифікації) і не визначено ні
`models.providers.ollama`, ні іншого власного провайдера з `api: "ollama"`,
OpenClaw виявляє моделі з `http://127.0.0.1:11434`:

| Поведінка             | Подробиці                                                                                                                                                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу        | `/api/tags`                                                                                                                                                                                                                                                                              |
| Виявлення можливостей | `/api/show` у режимі найкращих зусиль зчитує `contextWindow`, параметри Modelfile `num_ctx` і можливості (зір/інструменти/міркування)                                                                                                                                           |
| Моделі із зором       | Можливість `vision` з `/api/show` позначає модель як здатну обробляти зображення (`input: ["text", "image"]`)                                                                                                                                                                           |
| Виявлення міркування  | Використовує можливість `thinking` з `/api/show`, якщо вона доступна; якщо Ollama не надає можливостей, застосовує евристику за назвою (`r1`, `reason`, `reasoning`, `think`). `glm-5.2:cloud` та `deepseek-v4-flash\|pro:cloud` завжди вважаються моделями міркування незалежно від заявлених можливостей. |
| Обмеження токенів     | `maxTokens` за замовчуванням дорівнює максимальному обмеженню токенів Ollama в OpenClaw                                                                                                                                                                                                   |
| Вартість              | Усі значення вартості — `0`                                                                                                                                                                                                                                                      |

```bash
ollama list
openclaw models list
```

Установлення `models.providers.ollama` із явним масивом `models` або
власного провайдера з `api: "ollama"` і не-loopback значенням `baseUrl` вимикає
автоматичне виявлення; тоді моделі потрібно визначати вручну (див.
[Конфігурація](#configuration)). Запис `models.providers.ollama`, спрямований на
розміщений `https://ollama.com`, також пропускає виявлення, оскільки моделями Ollama Cloud
керує провайдер. Власні loopback-провайдери, як-от
`http://127.0.0.2:11434`, усе ще вважаються локальними й зберігають автоматичне виявлення.

Можна використовувати повне посилання, як-от `ollama/<pulled-model>:latest`, без
власноруч створеного запису `models.json`; OpenClaw розпізнає його динамічно. Для хостів,
на яких виконано вхід, вибір відсутнього у списку посилання `ollama/<model>:cloud` перевіряє саме цю
модель за допомогою `/api/show` і додає її до каталогу середовища виконання, лише якщо Ollama
підтверджує метадані — посилання з помилками усе одно не розпізнаються як відомі моделі.

### Димові тести

Для вузької текстової перевірки без повної поверхні інструментів агента:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Відповідай точно так: pong" \
    --json
```

Додайте `--file` із зображенням для спрощеної перевірки моделі зору (підтримуються PNG/JPEG/WebP;
файли, що не є зображеннями, відхиляються до виклику Ollama — використовуйте
`openclaw infer audio transcribe` для аудіо):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Опиши це зображення одним реченням." \
    --file ./photo.jpg \
    --json
```

Жоден із цих варіантів не завантажує інструменти чату, пам’ять або контекст сеансу. Якщо він успішний,
а звичайні відповіді агента не працюють, імовірно, проблема полягає в здатності моделі
працювати з інструментами або агентом, а не в кінцевій точці.

Вибір моделі за допомогою `/model ollama/<model>` є точним вибором користувача: якщо
налаштований `baseUrl` недоступний, наступна відповідь завершується помилкою провайдера,
а не непомітним переходом до іншої налаштованої моделі.

Ізольовані завдання Cron додають одну локальну перевірку безпеки перед початком ходу агента:
якщо вибрана модель відповідає локальному/приватно-мережевому/`.local` провайдеру Ollama
і `/api/tags` недоступний, OpenClaw записує цей запуск як
`skipped`, зазначаючи модель у тексті помилки. Ця перевірка кінцевої точки кешується на
5 хвилин для кожного хоста, тому повторювані завдання Cron для зупиненого демона не
запускають усі запити, приречені на помилку.

Перевірка наживо:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Для Ollama Cloud спрямуйте той самий тест наживо на розміщену кінцеву точку (за замовчуванням
вбудовування пропускаються; примусово ввімкніть їх за допомогою `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, оскільки
хмарний ключ може не надавати доступ до `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Щоб додати модель, завантажте її — її буде виявлено автоматично:

```bash
ollama pull mistral
```

## Локальний для Node інференс

Агенти можуть делегувати коротке завдання моделі Ollama на спареному настільному комп’ютері або
серверному Node. Запит і відповідь передаються через наявне автентифіковане
з’єднання Gateway/Node; запит виконується через власну loopback-кінцеву точку Ollama
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

    Перше підключення або оновлення, що додає команди Ollama, може ініціювати
    схвалення команд Node. Якщо Node підключається, не оголошуючи
    `ollama.models` і `ollama.chat`, знову перевірте `openclaw nodes pending`.

  </Step>
  <Step title="Використовуйте його з агента">
    Вбудований plugin Ollama надає інструмент `node_inference`. Агенти спочатку викликають
    `action: "discover"`, а потім `action: "run"` із Node і моделлю з
    цього результату (`run` може не вказувати Node, якщо підключено
    рівно один придатний Node). Наприклад: «Вияви моделі Ollama на моїх Node, а потім використай
    найшвидшу завантажену модель, щоб підсумувати цей текст».
  </Step>
</Steps>

Виявлення зчитує `/api/tags`, перевіряє можливості `/api/show` і використовує
`/api/ps`, коли він доступний, щоб першими ранжувати вже завантажені моделі. Воно повертає лише
локальні моделі, які Ollama позначає як придатні для чату (можливість `completion`) —
рядки Ollama Cloud і моделі лише для вбудовувань виключаються. Кожен запуск вимикає
міркування моделі та за замовчуванням обмежує вивід 512 токенами (жорстке обмеження 8192), якщо
виклик інструмента не запитує інше значення `maxTokens`; деякі моделі (наприклад GPT-OSS)
не підтримують вимкнення міркування й можуть усе одно виводити токени міркування.

Щоб Ollama продовжувала працювати на Node без надання агентам доступу до неї:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Перезапустіть Node (`openclaw node restart` або зупиніть і повторно запустіть `openclaw node run`
для сеансу на передньому плані). Node припинить оголошувати `ollama.models` і
`ollama.chat`; сама Ollama та провайдер Ollama у Gateway залишаться без змін.
Поверніть значення `true` і перезапустіть, щоб увімкнути знову; змінена поверхня
команд може знову потребувати схвалення `openclaw nodes pending` після повторного підключення.

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

`--invoke-timeout` обмежує час, протягом якого Node має виконати команду;
`--timeout` обмежує загальну тривалість виклику Gateway і має бути більшим.

Локальний для Node інференс завжди використовує власну loopback-кінцеву точку Node — він
не використовує повторно налаштований віддалений/хмарний `models.providers.ollama.baseUrl`.
Команди Node за замовчуванням доступні на хостах Node з macOS, Linux і Windows
та підпорядковуються звичайній політиці спарювання Node і команд.

## Комп’ютерний зір та опис зображень

Вбудований plugin Ollama реєструє Ollama як провайдера
розуміння медіа з підтримкою зображень, тому OpenClaw може спрямовувати явні запити
на опис зображень і налаштовані типові моделі зображень через локальні або розміщені
моделі комп’ютерного зору Ollama.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` має бути повним посиланням `<provider/model>`; якщо його задано, `infer image
describe` спочатку намагається використати цю модель, а не пропускає опис для моделей,
які вже мають вбудовану підтримку комп’ютерного зору. Якщо виклик завершується помилкою, OpenClaw може продовжити
через `agents.defaults.imageModel.fallbacks`; помилки підготовки файлу/URL
спричиняють збій до спроби резервного варіанта. Використовуйте `infer image describe` для процесу
розуміння зображень OpenClaw і налаштованого `imageModel`; використовуйте `infer model run
--file` для необробленої мультимодальної перевірки з власним запитом.

Щоб зробити Ollama типовим провайдером розуміння зображень для вхідних медіа:

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
`qwen2.5vl:7b`, нормалізується до `ollama/qwen2.5vl:7b` лише тоді, коли саме ця модель
зазначена в `models.providers.ollama.models` із
`input: ["text", "image"]` і жоден інший налаштований провайдер зображень не надає
той самий ідентифікатор без префікса; інакше явно використовуйте префікс провайдера.

Повільні локальні моделі комп’ютерного зору можуть потребувати довшого тайм-ауту розуміння зображень, ніж
хмарні моделі, і можуть аварійно завершуватися на обладнанні з обмеженими ресурсами, якщо Ollama намагається
виділити повний заявлений контекст комп’ютерного зору моделі. Установіть тайм-аут
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

Цей тайм-аут застосовується до розуміння вхідних зображень і до явного
інструмента `image`. `models.providers.ollama.timeoutSeconds` і далі керує
базовим обмеженням HTTP-запиту Ollama для звичайних викликів моделі.

Перевірка наживо:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, явно позначте моделі
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
    Якщо задано `OLLAMA_API_KEY`, у записі провайдера можна не вказувати `apiKey`; OpenClaw заповнить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (моделі вручну)">
    Використовуйте явну конфігурацію для розміщення в хмарі, нестандартного хоста/порту, примусово заданих
    контекстних вікон або повністю ручних списків моделей:

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
    Явна конфігурація вимикає автоматичне виявлення, тому моделі потрібно вказати у списку:

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

    Не додавайте блок `models.providers.ollama`, якщо моделі не потрібно задавати вручну.

  </Accordion>

  <Accordion title="Хост Ollama у LAN з моделями, заданими вручну">
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
    Ollama. Узгоджуйте їх, якщо обладнання не може виконувати модель із повним
    заявленим контекстом.

  </Accordion>

  <Accordion title="Лише Ollama Cloud">
    Без локального демона, безпосередньо розміщені моделі:

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

    Для спеціального ідентифікатора провайдера `ollama-cloud` замість цієї структури див.
    [Ollama Cloud](/uk/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Хмарні та локальні моделі через демон із виконаним входом">
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
    Власні ідентифікатори провайдерів під час роботи з кількома серверами Ollama; кожен має
    власний хост, моделі, автентифікацію та час очікування.

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

    OpenClaw видаляє префікс активного провайдера (за відсутності використовує простий
    префікс `ollama/`) перед викликом Ollama, тому `ollama-large/qwen3.5:27b`
    надходить до Ollama як `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Полегшений профіль локальної моделі">
    Деякі локальні моделі опрацьовують прості запити, але мають труднощі з повним набором
    інструментів агента. Обмежте інструменти й контекст, перш ніж змінювати глобальні
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
    зазнає помилки на схемах інструментів — це обмінює можливості агента на стабільність.
    `localModelLean` вилучає ресурсомісткі інструменти браузера, cron, повідомлень, генерування
    медіа, голосу та PDF із безпосереднього набору інструментів агента, якщо вони явно не потрібні,
    і переміщує більші каталоги за Tool Search. Це не змінює контекст середовища виконання
    Ollama чи режим мислення. Поєднуйте це з `params.num_ctx` і
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

Власні ідентифікатори провайдерів працюють так само: для посилання, що використовує префікс
активного провайдера, як-от `ollama-spark/qwen3:32b`, OpenClaw видаляє цей префікс перед
викликом Ollama, надсилаючи `qwen3:32b`.

Для повільних локальних моделей надавайте перевагу налаштуванню на рівні провайдера, перш ніж
збільшувати час очікування всього середовища виконання агента:

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

`timeoutSeconds` охоплює HTTP-запит до моделі: установлення з’єднання, заголовки,
потокове передавання тіла й загальне переривання захищеного отримання. `params.keep_alive`
передається як верхньорівневий `keep_alive` у нативних запитах `/api/chat`; задайте його для
окремої моделі, коли час завантаження під час першого звернення є вузьким місцем.

### Швидка перевірка

```bash
# Демон Ollama доступний із цієї машини
curl http://127.0.0.1:11434/api/tags

# Каталог OpenClaw і вибрана модель
openclaw models list --provider ollama
openclaw models status

# Пряма базова перевірка моделі
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Відповідай точно: ok"
```

Для віддалених хостів замініть `127.0.0.1` на хост `baseUrl`. Якщо `curl`
працює, а OpenClaw — ні, перевірте, чи Gateway працює на іншій
машині, у контейнері або під іншим обліковим записом служби.

## Вебпошук Ollama

OpenClaw постачається з **вебпошуком Ollama** як провайдером `web_search`.

| Властивість | Подробиці                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | `models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`; `https://ollama.com` використовує розміщений API безпосередньо                          |
| Автентифікація | Без ключа для локального хоста з виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку `https://ollama.com` чи захищених автентифікацією хостів           |
| Вимога      | Локальні/самостійно розміщені хости мають працювати та мати виконаний вхід за допомогою `ollama signin`; для прямого розміщеного пошуку потрібен `baseUrl: "https://ollama.com"` і справжній ключ API |

Виберіть його під час `openclaw onboard` або `openclaw configure --section web` чи задайте:

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

Для самостійно розміщеного хоста OpenClaw спочатку намагається використати локальний проксі
`/api/experimental/web_search`, а потім переходить до розміщеного шляху `/api/web_search` на тому самому хості;
локальний демон із виконаним входом зазвичай відповідає через локальний проксі. Прямі виклики
`https://ollama.com` завжди використовують розміщену кінцеву точку `/api/web_search`.

<Note>
Повний опис налаштування та поведінки див. у розділі [Вебпошук Ollama](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий режим, сумісний з OpenAI">
    <Warning>
    **Виклик інструментів у цьому режимі ненадійний.** Використовуйте його лише тоді, коли проксі потребує формату OpenAI, а ви не залежите від нативного виклику інструментів.
    </Warning>

    Явно задайте `api: "openai-completions"` для проксі за адресою
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

    Цей режим може не підтримувати потокове передавання та виклик інструментів одночасно; для моделі
    може знадобитися `params: { streaming: false }`.

    У цьому режимі OpenClaw типово додає `options.num_ctx`, щоб Ollama
    не переходив непомітно до контексту на 4096 токенів. Якщо проксі відхиляє
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
    типові значення для кожної моделі цього провайдера, які можна перевизначити для окремої
    моделі. `contextWindow` — це власний бюджет запиту/Compaction OpenClaw. Нативні
    запити `/api/chat` не задають `options.num_ctx`, якщо ви явно не задасте
    `params.num_ctx`, тому Ollama застосовує власне типове значення моделі,
    `OLLAMA_CONTEXT_LENGTH` або значення на основі VRAM; недійсні, нульові, від’ємні
    або нескінченні значення `params.num_ctx` ігноруються. Якщо старіша конфігурація використовувала
    лише `contextWindow`/`maxTokens`, щоб примусово задати контекст нативного запиту, виконайте
    `openclaw doctor --fix`, щоб скопіювати їх у `params.num_ctx`. Адаптер,
    сумісний з OpenAI, як і раніше типово додає `options.num_ctx` із
    налаштованого `params.num_ctx` або `contextWindow`; вимкніть це за допомогою
    `injectNumCtxForOpenAICompat: false`, якщо сервер відхиляє `options`.

    Записи нативних моделей також приймають загальні параметри середовища виконання Ollama в
    `params`, які передаються як нативні `/api/chat` `options`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` і `num_thread`.
    Кілька ключів (`format`, `keep_alive`, `truncate`, `shift`) передаються як
    верхньорівневі поля запиту, а не як вкладені `options`. OpenClaw передає
    лише ці ключі запиту Ollama, тому параметри лише для середовища виконання, як-от
    `streaming`, ніколи не надсилаються до Ollama. Використовуйте `params.think` (або
    `params.thinking`), щоб задати верхньорівневий `think`; `false` вимикає мислення
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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі також
    працює; явний запис моделі провайдера має пріоритет, якщо задано обидва.

  </Accordion>

  <Accordion title="Керування мисленням">
    OpenClaw передає параметр мислення так, як очікує Ollama: верхньорівневий `think`, а не
    `options.think`. Автоматично виявлені моделі, для яких `/api/show` повідомляє про
    можливість `thinking`, надають `/think low`, `/think medium`, `/think high`
    і `/think max`; моделі без мислення надають лише `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Або встановіть модель за замовчуванням:

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

    Параметри окремої моделі `params.think`/`params.thinking` можуть вимкнути або примусово ввімкнути
    міркування API для певної моделі. OpenClaw зберігає цю явну конфігурацію,
    коли активний запуск має лише неявне значення за замовчуванням `off`; команда середовища виконання
    з режимом, відмінним від вимкненого, наприклад `/think medium`, усе одно має вищий пріоритет. Запит
    із увімкненим міркуванням ніколи не надсилається моделі, явно позначеній
    `reasoning: false`; запит `think: false` надсилається завжди.

  </Accordion>

  <Accordion title="Моделі з міркуванням">
    Моделі з назвами `deepseek-r1`, `reasoning`, `reason` або `think` за замовчуванням
    вважаються здатними до міркування — додаткова конфігурація не потрібна:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama працює локально й безплатно, тому вартість усіх моделей становить `0` як для
    автоматично виявлених, так і для визначених вручну моделей.
  </Accordion>

  <Accordion title="Вбудовування пам’яті">
    Вбудований Plugin Ollama реєструє постачальника вбудовувань пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані базову URL-адресу Ollama
    і ключ API, викликає `/api/embed` та, коли це можливо, об’єднує кілька фрагментів пам’яті
    в один запит `input`.

    Коли `proxy.enabled=true`, запити вбудовування до точного локального
    loopback-джерела хоста, отриманого з налаштованого `baseUrl`, використовують захищений
    прямий шлях OpenClaw замість керованого проксі пересилання. Налаштоване
    ім’я хоста має бути саме `localhost` або літералом loopback-IP-адреси — DNS-імена,
    які лише розв’язуються в loopback-адресу, усе одно використовують шлях керованого проксі. Хости Ollama
    у LAN, tailnet, приватній або публічній мережі завжди залишаються на
    шляху керованого проксі, а переспрямування на інший хост або порт не успадковують
    довіру. `proxy.loopbackMode: "proxy"` усе одно спрямовує loopback-трафік через
    проксі; `proxy.loopbackMode: "block"` забороняє його до встановлення з’єднання —
    див. [Керований проксі](/uk/security/network-proxy#gateway-loopback-mode).

    | Властивість | Значення |
    | --- | --- |
    | Модель за замовчуванням | `nomic-embed-text` |
    | Автоматичне завантаження | Так, якщо модель відсутня локально |
    | Стандартна паралельність вбудовування | 1 (для інших постачальників стандартне значення вище; збільште за допомогою `nonBatchConcurrency`, якщо хост це витримає) |

    Вбудовування під час запиту використовують префікси отримання для моделей, які їх потребують
    або рекомендують: `nomic-embed-text`, `qwen3-embedding` та
    `mxbai-embed-large`. Пакети документів залишаються необробленими, тому наявні індекси
    не потребують міграції формату.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Стандартне значення для Ollama. Збільште на потужніших хостах, якщо повторне індексування надто повільне.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Для віддаленого хоста вбудовувань обмежте автентифікацію цим хостом:

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
    Ollama за замовчуванням використовує **власний API** (`/api/chat`), який одночасно підтримує
    потокове передавання та виклики інструментів — спеціальна конфігурація не потрібна.

    Для власних запитів керування міркуванням передається безпосередньо: `/think off`
    і `openclaw agent --thinking off` надсилають верхньорівневий `think: false`, якщо
    не налаштовано явний `params.think`/`params.thinking`; `/think
    low|medium|high` надсилають відповідний рядок інтенсивності; `/think max` відповідає
    найвищій інтенсивності Ollama — `think: "high"`.

    <Tip>
    Щоб натомість використовувати сумісну з OpenAI кінцеву точку, див. розділ «Застарілий режим сумісності з OpenAI» вище — потокове передавання та виклики інструментів у ньому можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Цикл аварійного завершення WSL2 (повторні перезапуски)">
    У WSL2 з NVIDIA/CUDA офіційний інсталятор Ollama для Linux створює
    модуль systemd `ollama.service` із `Restart=always`. Якщо ця служба
    запускається автоматично й завантажує модель із підтримкою GPU під час запуску WSL2, Ollama може закріпити
    пам’ять хоста під час завантаження; механізм повернення пам’яті Hyper-V не завжди може звільнити
    ці сторінки, тому Windows може завершити роботу віртуальної машини WSL2, systemd перезапускає
    Ollama, і цикл повторюється.

    Ознаки: повторні перезапуски або завершення WSL2, високе навантаження на CPU в `app.slice` чи
    `ollama.service` одразу після запуску WSL2, а також SIGTERM від systemd, а не
    від засобу завершення процесів через нестачу пам’яті Linux.

    OpenClaw записує попередження під час запуску, коли виявляє WSL2, увімкнений
    `ollama.service` із `Restart=always` та видимі маркери CUDA.

    Спосіб усунення:

    ```bash
    sudo systemctl disable ollama
    ```

    У Windows додайте наведене нижче до `%USERPROFILE%\.wslconfig`, а потім виконайте
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
    Переконайтеся, що Ollama працює, `OLLAMA_API_KEY` (або профіль автентифікації) налаштовано,
    а `models.providers.ollama` **не** визначено явно:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Завантажте модель локально або явно визначте її в
    `models.providers.ollama`:

    ```bash
    ollama list  # Переглянути встановлені моделі
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="У з’єднанні відмовлено">
    ```bash
    # Перевірити, чи працює Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Віддалений хост працює з curl, але не з OpenClaw">
    Перевірте на тій самій машині та в тому самому середовищі виконання, де працює Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Поширені причини:

    - `baseUrl` указує на `localhost`, але Gateway працює в Docker або на іншому хості.
    - URL-адреса використовує `/v1`, через що вибирається поведінка, сумісна з OpenAI, замість власної поведінки Ollama.
    - Віддалений хост потребує змін у брандмауері або прив’язуванні до LAN.
    - Модель є в демоні на вашому ноутбуці, але не у віддаленому демоні.

  </Accordion>

  <Accordion title="Модель виводить JSON інструменту як текст">
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

    Якщо невелика локальна модель усе одно не може обробити схеми інструментів, установіть
    `compat.supportsTools: false` у записі цієї моделі та повторіть перевірку.

  </Accordion>

  <Accordion title="Kimi або GLM повертає спотворені символи">
    Довгі, позбавлені мовного змісту послідовності символів у відповідях розміщених Kimi/GLM
    вважаються невдалим викликом постачальника, а не успішною відповіддю, тому
    замість збереження пошкодженого тексту в сеансі застосовується звичайна
    обробка повторних спроб, резервної моделі або помилок.

    Якщо це повториться, зафіксуйте назву моделі, поточний файл сеансу та
    чи використовував запуск `Cloud + Local` або `Cloud only`, а потім спробуйте новий
    сеанс і резервну модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Відповідай точно: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує час очікування">
    Великим локальним моделям може знадобитися багато часу для першого завантаження. Обмежте час очікування
    постачальником Ollama та за потреби залишайте модель завантаженою між ходами:

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
    подовжує захищений час очікування з’єднання для цього постачальника.

  </Accordion>

  <Accordion title="Модель із великим контекстом працює надто повільно або вичерпує пам’ять">
    Багато моделей заявляють контексти, завеликі для комфортної роботи
    на вашому обладнанні. Власний режим Ollama використовує стандартне значення свого середовища виконання, якщо
    не встановлено `params.num_ctx`. Обмежте і бюджет OpenClaw, і контекст запиту Ollama,
    щоб забезпечити передбачувану затримку до першого токена:

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
    Огляд усіх постачальників, посилань на моделі та поведінки перемикання в разі відмови.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Вебпошук Ollama" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування та поведінку вебпошуку на базі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
</CardGroup>
