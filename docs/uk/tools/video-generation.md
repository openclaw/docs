---
read_when:
    - Генерування відео за допомогою агента
    - Налаштування постачальників і моделей генерації відео
    - Розуміння параметрів інструмента video_generate
sidebarTitle: Video generation
summary: Генеруйте відео за допомогою video_generate з текстових, графічних або відеореференсів у 16 бекендах провайдерів.
title: Генерація відео
x-i18n:
    generated_at: "2026-04-28T11:28:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
    source_path: tools/video-generation.md
    workflow: 16
---

Агенти OpenClaw можуть генерувати відео з текстових промптів, референсних зображень або
наявних відео. Підтримуються шістнадцять бекендів провайдерів, кожен із
різними варіантами моделей, режимами введення та наборами функцій. Агент вибирає
потрібного провайдера автоматично на основі вашої конфігурації та доступних API-ключів.

<Note>
Інструмент `video_generate` з’являється лише тоді, коли доступний принаймні один
провайдер генерації відео. Якщо ви не бачите його серед інструментів агента, задайте
API-ключ провайдера або налаштуйте `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw розглядає генерацію відео як три режими виконання:

- `generate` — запити текст-у-відео без референсних медіа.
- `imageToVideo` — запит містить одне або кілька референсних зображень.
- `videoToVideo` — запит містить одне або кілька референсних відео.

Провайдери можуть підтримувати будь-яку підмножину цих режимів. Інструмент перевіряє
активний режим перед надсиланням і повідомляє підтримувані режими в `action=list`.

## Швидкий старт

<Steps>
  <Step title="Налаштуйте автентифікацію">
    Задайте API-ключ для будь-якого підтримуваного провайдера:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Виберіть модель за замовчуванням (необов’язково)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Попросіть агента">
    > Згенеруй 5-секундне кінематографічне відео про дружнього лобстера, який серфить на заході сонця.

    Агент автоматично викликає `video_generate`. Додавати інструмент до списку дозволених
    не потрібно.

  </Step>
</Steps>

## Як працює асинхронна генерація

Генерація відео є асинхронною. Коли агент викликає `video_generate` у
сеансі:

1. OpenClaw надсилає запит провайдеру й одразу повертає id завдання.
2. Провайдер обробляє завдання у фоновому режимі (зазвичай від 30 секунд до 5 хвилин, залежно від провайдера та роздільної здатності).
3. Коли відео готове, OpenClaw пробуджує той самий сеанс внутрішньою подією завершення.
4. Агент публікує готове відео назад в оригінальну розмову.

Поки завдання виконується, повторні виклики `video_generate` у тому самому
сеансі повертають поточний статус завдання замість запуску ще однієї
генерації. Використовуйте `openclaw tasks list` або `openclaw tasks show <taskId>`, щоб
перевірити прогрес із CLI.

Поза запусками агентів із підтримкою сеансу (наприклад, прямими викликами інструментів)
інструмент повертається до inline-генерації та повертає кінцевий шлях до медіа
в тому самому ході.

Згенеровані відеофайли зберігаються в керованому OpenClaw медіасховищі, коли
провайдер повертає байти. Обмеження збереження згенерованого відео за замовчуванням відповідає
ліміту відеомедіа, а `agents.defaults.mediaMaxMb` підвищує його для
більших рендерів. Коли провайдер також повертає URL розміщеного результату, OpenClaw
може доставити цей URL замість того, щоб завершити завдання помилкою, якщо локальне збереження
відхиляє завеликий файл.

### Життєвий цикл завдання

| Стан        | Значення                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Завдання створено, очікує, поки провайдер його прийме.                                          |
| `running`   | Провайдер обробляє його (зазвичай від 30 секунд до 5 хвилин, залежно від провайдера та роздільної здатності). |
| `succeeded` | Відео готове; агент пробуджується та публікує його в розмову.                                   |
| `failed`    | Помилка провайдера або тайм-аут; агент пробуджується з деталями помилки.                        |

Перевірте статус із CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Якщо відеозавдання вже має стан `queued` або `running` для поточного сеансу,
`video_generate` повертає статус наявного завдання замість запуску нового.
Використовуйте `action: "status"`, щоб перевірити явно, не запускаючи нову
генерацію.

## Підтримувані провайдери

| Провайдер             | Модель за замовчуванням          | Текст | Референс зображення                                  | Референс відео                                  | Автентифікація                          |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Так (віддалений URL)                                 | Так (віддалений URL)                            | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | До 2 зображень (лише моделі I2V; перший + останній кадр) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | До 2 зображень (перший + останній кадр через роль)   | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | До 9 референсних зображень                           | До 3 відео                                      | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 зображення                                         | —                                               | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 зображення; до 9 із Seedance reference-to-video    | До 3 відео із Seedance reference-to-video       | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 зображення                                         | 1 відео                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 зображення                                         | —                                               | `MINIMAX_API_KEY` або MiniMax OAuth      |
| OpenAI                | `sora-2`                        |  ✓   | 1 зображення                                         | 1 відео                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | До 4 зображень (перший/останній кадр або референси)  | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Так (віддалений URL)                                 | Так (віддалений URL)                            | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 зображення                                         | 1 відео                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 зображення                                         | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 зображення (`kling`)                               | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 зображення першого кадру або до 7 `reference_image`s | 1 відео                                         | `XAI_API_KEY`                            |

Деякі провайдери приймають додаткові або альтернативні змінні середовища API-ключів. Див.
окремі [сторінки провайдерів](#related) для подробиць.

Запустіть `video_generate action=list`, щоб під час виконання переглянути доступних провайдерів, моделі та
режими виконання.

### Матриця можливостей

Явний контракт режимів, який використовують `video_generate`, контрактні тести та
спільна live-перевірка:

| Провайдер  | `generate` | `imageToVideo` | `videoToVideo` | Спільні live-лінії сьогодні                                                                                                              |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` пропущено, бо цьому провайдеру потрібні віддалені `http(s)` URL відео                         |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Не входить до спільної перевірки; покриття для конкретних workflow міститься в тестах Comfy                                              |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; нативні відеосхеми DeepInfra у вбудованому контракті є text-to-video                                                         |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` лише за використання Seedance reference-to-video                                               |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; спільний `videoToVideo` пропущено, бо поточна перевірка Gemini/Veo на основі буфера не приймає такі вхідні дані |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; спільний `videoToVideo` пропущено, бо цей шлях org/input наразі потребує доступу до inpaint/remix на боці провайдера |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` пропущено, бо цьому провайдеру потрібні віддалені `http(s)` URL відео                         |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` запускається лише тоді, коли вибрана модель — `runway/gen4_aleph`                              |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; спільний `imageToVideo` пропущено, бо вбудований `veo3` підтримує лише текст, а вбудований `kling` потребує віддаленого URL зображення |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` пропущено, бо цьому провайдеру наразі потрібен віддалений MP4 URL                              |

## Параметри інструмента

### Обов’язкові

<ParamField path="prompt" type="string" required>
  Текстовий опис відео, яке потрібно згенерувати. Обов’язково для `action: "generate"`.
</ParamField>

### Вхідні дані вмісту

<ParamField path="image" type="string">Одне еталонне зображення (шлях або URL).</ParamField>
<ParamField path="images" type="string[]">Кілька еталонних зображень (до 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Необов'язкові підказки ролей для кожної позиції, паралельні до об'єднаного списку зображень.
Канонічні значення: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Одне еталонне відео (шлях або URL).</ParamField>
<ParamField path="videos" type="string[]">Кілька еталонних відео (до 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Необов'язкові підказки ролей для кожної позиції, паралельні до об'єднаного списку відео.
Канонічне значення: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Одне еталонне аудіо (шлях або URL). Використовується для фонової музики або голосового
еталона, коли провайдер підтримує аудіовходи.
</ParamField>
<ParamField path="audioRefs" type="string[]">Кілька еталонних аудіо (до 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Необов'язкові підказки ролей для кожної позиції, паралельні до об'єднаного списку аудіо.
Канонічне значення: `reference_audio`.
</ParamField>

<Note>
Підказки ролей передаються провайдеру без змін. Канонічні значення походять з
об'єднання `VideoGenerationAssetRole`, але провайдери можуть приймати додаткові
рядки ролей. Масиви `*Roles` не повинні мати більше записів, ніж
відповідний список еталонів; помилки зсуву на один елемент завершуються зрозумілою помилкою.
Використовуйте порожній рядок, щоб залишити слот незаданим. Для xAI задайте кожній ролі зображення
`reference_image`, щоб використати його режим генерації `reference_images`; пропустіть
роль або використайте `first_frame` для перетворення одного зображення на відео.
</Note>

### Керування стилем

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` або `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` або `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Цільова тривалість у секундах (округлюється до найближчого значення, підтримуваного провайдером).
</ParamField>
<ParamField path="size" type="string">Підказка розміру, коли провайдер її підтримує.</ParamField>
<ParamField path="audio" type="boolean">
  Увімкнути згенероване аудіо у вихідному результаті, коли це підтримується. Відрізняється від `audioRef*` (входи).
</ParamField>
<ParamField path="watermark" type="boolean">Перемкнути водяний знак провайдера, коли це підтримується.</ParamField>

`adaptive` — це специфічний для провайдера sentinel: він передається без змін
провайдерам, які декларують `adaptive` у своїх можливостях (наприклад, BytePlus
Seedance використовує його для автоматичного визначення співвідношення з розмірів
вхідного зображення). Провайдери, які його не декларують, показують значення через
`details.ignoredOverrides` у результаті інструмента, щоб пропуск був видимим.

### Розширені параметри

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` повертає поточне завдання сесії; `"list"` перевіряє провайдерів.
</ParamField>
<ParamField path="model" type="string">Перевизначення провайдера/моделі (наприклад, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Підказка імені вихідного файлу.</ParamField>
<ParamField path="timeoutMs" type="number">Необов'язковий тайм-аут запиту до провайдера в мілісекундах.</ParamField>
<ParamField path="providerOptions" type="object">
  Специфічні для провайдера параметри як JSON-об'єкт (наприклад, `{"seed": 42, "draft": true}`).
  Провайдери, які декларують типізовану схему, перевіряють ключі та типи; невідомі
  ключі або невідповідності пропускають кандидата під час fallback. Провайдери без
  задекларованої схеми отримують параметри без змін. Запустіть `video_generate action=list`,
  щоб побачити, що приймає кожен провайдер.
</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. OpenClaw нормалізує тривалість до
найближчого значення, підтримуваного провайдером, і перепризначає перекладені підказки геометрії,
такі як розмір у співвідношення сторін, коли fallback-провайдер надає іншу
поверхню керування. Справді непідтримувані перевизначення ігноруються за принципом найкращого зусилля
та повідомляються як попередження в результаті інструмента. Жорсткі обмеження можливостей
(наприклад, забагато еталонних входів) завершуються помилкою до надсилання. Результати інструмента
повідомляють застосовані налаштування; `details.normalization` фіксує будь-яке
перетворення із запитаного в застосоване.
</Note>

Еталонні входи вибирають режим виконання:

- Немає еталонних медіа → `generate`
- Будь-який еталон зображення → `imageToVideo`
- Будь-який еталон відео → `videoToVideo`
- Еталонні аудіовходи **не** змінюють визначений режим; вони застосовуються
  поверх будь-якого режиму, який вибирають еталони зображень/відео, і працюють лише
  з провайдерами, які декларують `maxInputAudios`.

Змішані еталони зображень і відео не є стабільною спільною поверхнею можливостей.
Надавайте перевагу одному типу еталона на запит.

#### Fallback і типізовані параметри

Деякі перевірки можливостей застосовуються на рівні fallback, а не на
межі інструмента, тому запит, який перевищує обмеження основного провайдера, може
все одно виконатися на здатному fallback:

- Активний кандидат, який не декларує `maxInputAudios` (або декларує `0`), пропускається, коли
  запит містить аудіоеталони; пробується наступний кандидат.
- `maxDurationSeconds` активного кандидата нижче за запитаний `durationSeconds`
  без задекларованого списку `supportedDurationSeconds` → пропускається.
- Запит містить `providerOptions`, а активний кандидат явно
  декларує типізовану схему `providerOptions` → пропускається, якщо надані ключі
  відсутні в схемі або типи значень не збігаються. Провайдери без
  задекларованої схеми отримують параметри без змін (зворотно сумісне
  наскрізне передавання). Провайдер може відмовитися від усіх параметрів провайдера,
  задекларувавши порожню схему (`capabilities.providerOptions: {}`), що
  спричиняє такий самий пропуск, як і невідповідність типів.

Перша причина пропуску в запиті логується на рівні `warn`, щоб оператори бачили, коли
їхній основний провайдер був пропущений; наступні пропуски логуються на рівні `debug`, щоб
довгі ланцюжки fallback залишалися тихими. Якщо кожен кандидат пропущено,
агрегована помилка містить причину пропуску для кожного.

## Дії

| Дія        | Що вона робить                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | За замовчуванням. Створює відео з наданого prompt і необов'язкових еталонних входів.                    |
| `status`   | Перевіряє стан поточного відеозавдання для поточної сесії без запуску іншої генерації.                  |
| `list`     | Показує доступних провайдерів, моделі та їхні можливості.                                                |

## Вибір моделі

OpenClaw визначає модель у такому порядку:

1. **Параметр інструмента `model`** — якщо агент указує його у виклику.
2. **`videoGenerationModel.primary`** з конфігурації.
3. **`videoGenerationModel.fallbacks`** за порядком.
4. **Автовиявлення** — провайдери, які мають чинну автентифікацію, починаючи з
   поточного провайдера за замовчуванням, а потім решта провайдерів в алфавітному
   порядку.

Якщо провайдер завершується помилкою, наступний кандидат пробується автоматично. Якщо всі
кандидати завершуються помилкою, помилка містить деталі з кожної спроби.

Задайте `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати
лише явні записи `model`, `primary` і `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Нотатки провайдерів

<AccordionGroup>
  <Accordion title="Alibaba">
    Використовує асинхронний endpoint DashScope / Model Studio. Еталонні зображення та
    відео мають бути віддаленими URL `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID провайдера: `byteplus`.

    Моделі: `seedance-1-0-pro-250528` (за замовчуванням),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Моделі T2V (`*-t2v-*`) не приймають входи зображень; моделі I2V і
    загальні моделі `*-pro-*` підтримують одне еталонне зображення (перший
    кадр). Передайте зображення позиційно або задайте `role: "first_frame"`.
    ID моделей T2V автоматично перемикаються на відповідний варіант I2V,
    коли надано зображення.

    Підтримувані ключі `providerOptions`: `seed` (number), `draft` (boolean —
    примусово задає 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Потребує Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID провайдера: `byteplus-seedance15`. Модель:
    `seedance-1-5-pro-251215`.

    Використовує уніфікований API `content[]`. Підтримує щонайбільше 2 вхідні зображення
    (`first_frame` + `last_frame`). Усі входи мають бути віддаленими URL `https://`.
    Задайте `role: "first_frame"` / `"last_frame"` для кожного зображення або
    передайте зображення позиційно.

    `aspectRatio: "adaptive"` автоматично визначає співвідношення з вхідного зображення.
    `audio: true` відображається на `generate_audio`. `providerOptions.seed`
    (number) передається далі.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Потребує Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID провайдера: `byteplus-seedance2`. Моделі:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Використовує уніфікований API `content[]`. Підтримує до 9 еталонних зображень,
    3 еталонних відео та 3 еталонних аудіо. Усі входи мають бути віддаленими
    URL `https://`. Задайте `role` для кожного ресурсу — підтримувані значення:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` автоматично визначає співвідношення з вхідного зображення.
    `audio: true` відображається на `generate_audio`. `providerOptions.seed`
    (number) передається далі.

  </Accordion>
  <Accordion title="ComfyUI">
    Локальне або хмарне виконання на основі workflow. Підтримує text-to-video і
    image-to-video через налаштований граф.
  </Accordion>
  <Accordion title="fal">
    Використовує потік на основі черги для довготривалих завдань. Більшість відеомоделей fal
    приймають одне еталонне зображення. Моделі Seedance 2.0 reference-to-video
    приймають до 9 зображень, 3 відео та 3 аудіоеталонів, щонайбільше
    12 еталонних файлів загалом.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Підтримує один еталон зображення або один еталон відео.
  </Accordion>
  <Accordion title="MiniMax">
    Лише один еталон зображення.
  </Accordion>
  <Accordion title="OpenAI">
    Передається лише перевизначення `size`. Інші перевизначення стилю
    (`aspectRatio`, `resolution`, `audio`, `watermark`) ігноруються з
    попередженням.
  </Accordion>
  <Accordion title="OpenRouter">
    Використовує асинхронний API `/videos` OpenRouter. OpenClaw надсилає
    завдання, опитує `polling_url` і завантажує або `unsigned_urls`, або
    документований endpoint вмісту завдання. Вбудований стандартний `google/veo-3.1-fast`
    оголошує тривалості 4/6/8 секунд, роздільні здатності `720P`/`1080P` і
    співвідношення сторін `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Такий самий backend DashScope, як в Alibaba. Еталонні входи мають бути віддаленими
    URL `http(s)`; локальні файли відхиляються наперед.
  </Accordion>
  <Accordion title="Runway">
    Підтримує локальні файли через data URI. Video-to-video потребує
    `runway/gen4_aleph`. Запуски лише з текстом надають співвідношення сторін
    `16:9` і `9:16`.
  </Accordion>
  <Accordion title="Together">
    Лише один еталон зображення.
  </Accordion>
  <Accordion title="Vydra">
    Використовує `https://www.vydra.ai/api/v1` напряму, щоб уникнути редиректів,
    які скидають автентифікацію. `veo3` вбудовано лише як text-to-video; `kling` потребує
    віддаленого URL зображення.
  </Accordion>
  <Accordion title="xAI">
    Підтримує text-to-video, single first-frame image-to-video, до 7
    входів `reference_image` через xAI `reference_images` і віддалені
    потоки редагування/продовження відео.
  </Accordion>
</AccordionGroup>

## Режими можливостей провайдера

Спільний контракт генерації відео підтримує можливості, специфічні для режимів,
а не лише плоскі сукупні обмеження. Нові реалізації постачальників
мають віддавати перевагу явним блокам режимів:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Плоских сукупних полів, таких як `maxInputImages` і `maxInputVideos`,
**недостатньо**, щоб оголосити підтримку режимів перетворення. Постачальники мають
явно оголошувати `generate`, `imageToVideo` і `videoToVideo`, щоб live-тести,
контрактні тести та спільний інструмент `video_generate` могли детерміновано
перевіряти підтримку режимів.

Коли одна модель у постачальника має ширшу підтримку референсних вхідних даних, ніж
інші, використовуйте `maxInputImagesByModel`, `maxInputVideosByModel` або
`maxInputAudiosByModel` замість підвищення обмеження для всього режиму.

## Live-тести

Увімкніть за згодою live-покриття для спільних вбудованих постачальників:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Обгортка репозиторію:

```bash
pnpm test:live:media video
```

Цей live-файл завантажує відсутні змінні середовища постачальника з `~/.profile`, за замовчуванням
надає перевагу API-ключам із live/env перед збереженими профілями автентифікації та за замовчуванням
запускає безпечний для релізу smoke-тест:

- `generate` для кожного не-FAL постачальника в перевірці.
- Односекундний prompt із омаром.
- Обмеження операцій для кожного постачальника з
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням).

FAL вмикається за згодою, оскільки затримка черги на боці постачальника може домінувати
у часі релізу:

```bash
pnpm test:live:media video --video-providers fal
```

Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені
режими перетворення, які спільна перевірка може безпечно виконати з локальними медіа:

- `imageToVideo`, коли `capabilities.imageToVideo.enabled`.
- `videoToVideo`, коли `capabilities.videoToVideo.enabled` і
  постачальник/модель приймає локальний відеоввід на основі буфера у спільній
  перевірці.

Наразі спільна live-доріжка `videoToVideo` покриває `runway` лише тоді, коли ви
вибираєте `runway/gen4_aleph`.

## Конфігурація

Установіть стандартну модель генерації відео у вашій конфігурації OpenClaw:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Або через CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Пов’язане

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Фонові завдання](/uk/automation/tasks) — відстеження завдань для асинхронної генерації відео
- [BytePlus](/uk/concepts/model-providers#byteplus-international)
- [ComfyUI](/uk/providers/comfy)
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults)
- [fal](/uk/providers/fal)
- [Google (Gemini)](/uk/providers/google)
- [MiniMax](/uk/providers/minimax)
- [Моделі](/uk/concepts/models)
- [OpenAI](/uk/providers/openai)
- [Qwen](/uk/providers/qwen)
- [Runway](/uk/providers/runway)
- [Together AI](/uk/providers/together)
- [Огляд інструментів](/uk/tools)
- [Vydra](/uk/providers/vydra)
- [xAI](/uk/providers/xai)
