---
read_when:
    - Генерування відео через агента
    - Налаштування провайдерів і моделей генерації відео
    - Розуміння параметрів інструмента `video_generate`
sidebarTitle: Video generation
summary: Генеруйте відео через `video_generate` з тексту, зображення або посилань на відео в 14 бекендах провайдерів
title: Генерація відео
x-i18n:
    generated_at: "2026-04-28T00:36:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7270b98c8f1f791555913de6c7ce119032b616083b62786a17f692fbd4aab1e6
    source_path: tools/video-generation.md
    workflow: 15
---

Агенти OpenClaw можуть генерувати відео з текстових prompt, еталонних зображень або
наявних відео. Підтримується п’ятнадцять бекендів провайдерів, кожен із
різними варіантами моделей, режимами введення та наборами можливостей. Агент автоматично вибирає
потрібного провайдера на основі вашої конфігурації та доступних API-ключів.

<Note>
Інструмент `video_generate` з’являється лише тоді, коли доступний принаймні один провайдер
генерації відео. Якщо ви не бачите його серед інструментів агента, задайте
API-ключ провайдера або налаштуйте `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw розглядає генерацію відео як три режими середовища виконання:

- `generate` — запити text-to-video без еталонних медіа.
- `imageToVideo` — запит містить одне або більше еталонних зображень.
- `videoToVideo` — запит містить одне або більше еталонних відео.

Провайдери можуть підтримувати будь-яку підмножину цих режимів. Інструмент перевіряє
активний режим перед надсиланням і повідомляє про підтримувані режими в `action=list`.

## Швидкий старт

<Steps>
  <Step title="Налаштуйте автентифікацію">
    Задайте API-ключ для будь-якого підтримуваного провайдера:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Виберіть типову модель (необов’язково)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Попросіть агента">
    > Згенеруй 5-секундне кінематографічне відео дружнього лобстера, який катається на серфі на заході сонця.

    Агент автоматично викликає `video_generate`. Дозволений список інструментів
    не потрібен.

  </Step>
</Steps>

## Як працює асинхронна генерація

Генерація відео є асинхронною. Коли агент викликає `video_generate` у
сесії:

1. OpenClaw надсилає запит провайдеру й одразу повертає ідентифікатор задачі.
2. Провайдер обробляє завдання у фоновому режимі (зазвичай від 30 секунд до 5 хвилин залежно від провайдера та роздільної здатності).
3. Коли відео готове, OpenClaw пробуджує ту саму сесію внутрішньою подією завершення.
4. Агент публікує готове відео назад в оригінальну розмову.

Поки завдання виконується, дубльовані виклики `video_generate` у тій самій
сесії повертають поточний стан задачі замість запуску нової
генерації. Використовуйте `openclaw tasks list` або `openclaw tasks show <taskId>`, щоб
перевірити поступ із CLI.

Поза запусками агента, прив’язаними до сесії (наприклад, прямі виклики інструмента),
інструмент повертається до вбудованої генерації та повертає остаточний шлях до медіафайлу
в тому самому ході.

Згенеровані відеофайли зберігаються в керованому OpenClaw сховищі медіа, коли
провайдер повертає байти. Типове обмеження збереження згенерованого відео відповідає
ліміту відеомедіа, а `agents.defaults.mediaMaxMb` підвищує його для
більших рендерів. Якщо провайдер також повертає розміщений URL виходу, OpenClaw
може доставити цей URL замість помилки задачі, якщо локальне збереження
відхиляє завеликий файл.

### Життєвий цикл задачі

| Стан        | Значення                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Задачу створено, вона очікує, доки провайдер її прийме.                                          |
| `running`   | Провайдер обробляє її (зазвичай від 30 секунд до 5 хвилин залежно від провайдера та роздільної здатності). |
| `succeeded` | Відео готове; агент прокидається та публікує його в розмову.                                     |
| `failed`    | Помилка провайдера або тайм-аут; агент прокидається з відомостями про помилку.                   |

Перевірка стану з CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Якщо для поточної сесії задача відео вже має стан `queued` або `running`,
`video_generate` повертає стан наявної задачі замість запуску нової.
Використовуйте `action: "status"`, щоб явно перевірити стан без запуску нової
генерації.

## Підтримувані провайдери

| Провайдер             | Типова модель                  | Текст | Еталонне зображення                                  | Еталонне відео                                  | Автентифікація                          |
| --------------------- | ------------------------------ | :---: | ---------------------------------------------------- | ----------------------------------------------- | --------------------------------------- |
| Alibaba               | `wan2.6-t2v`                   |  ✓    | Так (віддалений URL)                                 | Так (віддалений URL)                            | `MODELSTUDIO_API_KEY`                   |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`      |  ✓    | До 2 зображень (лише моделі I2V; перший і останній кадр) | —                                           | `BYTEPLUS_API_KEY`                      |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      |  ✓    | До 2 зображень (перший і останній кадр через роль)   | —                                               | `BYTEPLUS_API_KEY`                      |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` |  ✓    | До 9 еталонних зображень                             | До 3 відео                                      | `BYTEPLUS_API_KEY`                      |
| ComfyUI               | `workflow`                     |  ✓    | 1 зображення                                         | —                                               | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`        |  ✓    | —                                                    | —                                               | `DEEPINFRA_API_KEY`                     |
| fal                   | `fal-ai/minimax/video-01-live` |  ✓    | 1 зображення; до 9 із Seedance reference-to-video    | До 3 відео з Seedance reference-to-video        | `FAL_KEY`                               |
| Google                | `veo-3.1-fast-generate-preview`|  ✓    | 1 зображення                                         | 1 відео                                         | `GEMINI_API_KEY`                        |
| MiniMax               | `MiniMax-Hailuo-2.3`           |  ✓    | 1 зображення                                         | —                                               | `MINIMAX_API_KEY` або MiniMax OAuth     |
| OpenAI                | `sora-2`                       |  ✓    | 1 зображення                                         | 1 відео                                         | `OPENAI_API_KEY`                        |
| Qwen                  | `wan2.6-t2v`                   |  ✓    | Так (віддалений URL)                                 | Так (віддалений URL)                            | `QWEN_API_KEY`                          |
| Runway                | `gen4.5`                       |  ✓    | 1 зображення                                         | 1 відео                                         | `RUNWAYML_API_SECRET`                   |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`       |  ✓    | 1 зображення                                         | —                                               | `TOGETHER_API_KEY`                      |
| Vydra                 | `veo3`                         |  ✓    | 1 зображення (`kling`)                               | —                                               | `VYDRA_API_KEY`                         |
| xAI                   | `grok-imagine-video`           |  ✓    | 1 зображення першого кадру або до 7 `reference_image` | 1 відео                                       | `XAI_API_KEY`                           |

Деякі провайдери приймають додаткові або альтернативні змінні середовища API-ключів. Див.
окремі [сторінки провайдерів](#related) для подробиць.

Запустіть `video_generate action=list`, щоб під час виконання переглянути доступних провайдерів, моделі та
режими середовища виконання.

### Матриця можливостей

Явний контракт режимів, що використовується `video_generate`, контрактними тестами та
спільним live sweep:

| Провайдер | `generate` | `imageToVideo` | `videoToVideo` | Спільні live-канали сьогодні                                                                                                           |
| --------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` пропускається, оскільки цьому провайдеру потрібні віддалені URL відео `http(s)`            |
| BytePlus  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI   |     ✓      |       ✓        |       —        | Не входить до спільного sweep; покриття, специфічне для workflow, живе разом із тестами Comfy                                         |
| DeepInfra |     ✓      |       —        |       —        | `generate`; нативні схеми відео DeepInfra у комплектному контракті є text-to-video                                                     |
| fal       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` лише під час використання Seedance reference-to-video                                       |
| Google    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; спільний `videoToVideo` пропускається, оскільки поточний sweep Gemini/Veo на основі буфера не приймає це введення |
| MiniMax   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; спільний `videoToVideo` пропускається, оскільки цей шлях org/input зараз потребує доступу до provider-side inpaint/remix |
| Qwen      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` пропускається, оскільки цьому провайдеру потрібні віддалені URL відео `http(s)`            |
| Runway    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` запускається лише тоді, коли вибрана модель — `runway/gen4_aleph`                          |
| Together  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                              |
| Vydra     |     ✓      |       ✓        |       —        | `generate`; спільний `imageToVideo` пропускається, оскільки комплектний `veo3` є лише текстовим, а комплектний `kling` потребує віддалений URL зображення |
| xAI       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` пропускається, оскільки цьому провайдеру наразі потрібен віддалений URL MP4                |

## Параметри інструмента

### Обов’язкові

<ParamField path="prompt" type="string" required>
  Текстовий опис відео, яке потрібно згенерувати. Обов’язковий для `action: "generate"`.
</ParamField>

### Вхідні дані контенту

<ParamField path="image" type="string">Одне еталонне зображення (шлях або URL).</ParamField>
<ParamField path="images" type="string[]">Кілька еталонних зображень (до 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Необов’язкові підказки ролей за позиціями, паралельні до об’єднаного списку зображень.
Канонічні значення: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Одне еталонне відео (шлях або URL).</ParamField>
<ParamField path="videos" type="string[]">Кілька еталонних відео (до 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Необов’язкові підказки ролей за позиціями, паралельні до об’єднаного списку відео.
Канонічне значення: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Одне еталонне аудіо (шлях або URL). Використовується для фонового музичного супроводу або
еталона голосу, коли провайдер підтримує аудіовходи.
</ParamField>
<ParamField path="audioRefs" type="string[]">Кілька еталонних аудіо (до 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Необов’язкові підказки ролей за позиціями, паралельні до об’єднаного списку аудіо.
Канонічне значення: `reference_audio`.
</ParamField>

<Note>
Підказки ролей передаються провайдеру як є. Канонічні значення походять з
об’єднання `VideoGenerationAssetRole`, але провайдери можуть приймати додаткові
рядки ролей. Масиви `*Roles` не повинні містити більше записів, ніж
відповідний список еталонів; помилки на один елемент дають зрозуміле повідомлення.
Використовуйте порожній рядок, щоб залишити позицію незаданою. Для xAI встановлюйте для кожної ролі зображення
`reference_image`, щоб використовувати режим генерації `reference_images`; не вказуйте
роль або використовуйте `first_frame` для image-to-video з одним зображенням.
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
  Увімкнути згенероване аудіо у виході, коли це підтримується. Відрізняється від `audioRef*` (входів).
</ParamField>
<ParamField path="watermark" type="boolean">Перемикає watermark провайдера, коли це підтримується.</ParamField>

`adaptive` — це sentinel, специфічний для провайдера: він передається як є
провайдерам, які оголошують `adaptive` у своїх можливостях (наприклад, BytePlus
Seedance використовує його для автоматичного визначення співвідношення сторін за
розмірами вхідного зображення). Провайдери, які його не оголошують, показують значення через
`details.ignoredOverrides` у результаті інструмента, щоб було видно, що його проігноровано.

### Додатково

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` повертає поточну задачу сесії; `"list"` перевіряє провайдерів.
</ParamField>
<ParamField path="model" type="string">Перевизначення провайдера/моделі (наприклад, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Підказка для назви вихідного файла.</ParamField>
<ParamField path="timeoutMs" type="number">Необов’язковий тайм-аут запиту до провайдера в мілісекундах.</ParamField>
<ParamField path="providerOptions" type="object">
  Специфічні для провайдера параметри як JSON-об’єкт (наприклад, `{"seed": 42, "draft": true}`).
  Провайдери, які оголошують типізовану схему, перевіряють ключі та типи; невідомі
  ключі або невідповідності пропускають кандидата під час резервного переходу. Провайдери без
  оголошеної схеми отримують параметри як є. Запустіть `video_generate action=list`,
  щоб побачити, що приймає кожен провайдер.
</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. OpenClaw нормалізує тривалість до
найближчого значення, підтримуваного провайдером, і переназначає перекладені підказки геометрії,
наприклад перетворення size у aspectRatio, коли резервний провайдер надає іншу
поверхню керування. Справді непідтримувані перевизначення ігноруються по можливості
та повідомляються як попередження в результаті інструмента. Жорсткі обмеження можливостей
(наприклад, забагато еталонних входів) завершуються помилкою до надсилання. Результати інструмента
повідомляють про застосовані налаштування; `details.normalization` фіксує будь-яке
перетворення з запитаного на застосоване.
</Note>

Еталонні входи вибирають режим середовища виконання:

- Немає еталонних медіа → `generate`
- Будь-яке еталонне зображення → `imageToVideo`
- Будь-яке еталонне відео → `videoToVideo`
- Еталонні аудіовходи **не** змінюють визначений режим; вони застосовуються
  поверх будь-якого режиму, який вибирають еталонні зображення/відео, і працюють
  лише з провайдерами, що оголошують `maxInputAudios`.

Змішані еталонні зображення й відео не є стабільною спільною поверхнею можливостей.
Для одного запиту краще використовувати один тип еталонів.

#### Резервний перехід і типізовані параметри

Деякі перевірки можливостей застосовуються на рівні резервного переходу, а не на межі
інструмента, тому запит, що перевищує ліміти основного провайдера, усе ще може
виконатися на придатному резервному:

- Активний кандидат, який не оголошує `maxInputAudios` (або має значення `0`), пропускається, коли
  запит містить еталонні аудіо; пробується наступний кандидат.
- Активний кандидат має `maxDurationSeconds`, менший за запитаний `durationSeconds`,
  і не має оголошеного списку `supportedDurationSeconds` → пропускається.
- Запит містить `providerOptions`, а активний кандидат явно
  оголошує типізовану схему `providerOptions` → пропускається, якщо передані ключі
  відсутні у схемі або типи значень не збігаються. Провайдери без
  оголошеної схеми отримують параметри як є (зворотно сумісний
  passthrough). Провайдер може відмовитися від усіх provider options,
  оголосивши порожню схему (`capabilities.providerOptions: {}`), що
  призводить до такого самого пропуску, як і невідповідність типів.

Перша причина пропуску в запиті журналюється на рівні `warn`, щоб оператори бачили, коли
їхній основний провайдер було пропущено; наступні пропуски журналюються на рівні `debug`, щоб
довгі ланцюжки резервного переходу не створювали шум. Якщо пропущено кожного кандидата, агрегована
помилка містить причину пропуску для кожного з них.

## Дії

| Дія        | Що вона робить                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| `generate` | Типова дія. Створює відео з указаного prompt і необов’язкових еталонних входів.                             |
| `status`   | Перевіряє стан поточної відеозадачі для поточної сесії без запуску нової генерації.                         |
| `list`     | Показує доступних провайдерів, моделі та їхні можливості.                                                   |

## Вибір моделі

OpenClaw визначає модель у такому порядку:

1. **Параметр інструмента `model`** — якщо агент указує його у виклику.
2. **`videoGenerationModel.primary`** з конфігурації.
3. **`videoGenerationModel.fallbacks`** у заданому порядку.
4. **Автовизначення** — провайдери, які мають дійсну автентифікацію, починаючи з
   поточного типового провайдера, а потім решта провайдерів в алфавітному
   порядку.

Якщо провайдер завершується помилкою, автоматично пробується наступний кандидат. Якщо всі
кандидати завершуються помилкою, помилка містить подробиці кожної спроби.

Установіть `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати
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

## Примітки щодо провайдерів

<AccordionGroup>
  <Accordion title="Alibaba">
    Використовує асинхронну кінцеву точку DashScope / Model Studio. Еталонні зображення та
    відео мають бути віддаленими URL `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Ідентифікатор провайдера: `byteplus`.

    Моделі: `seedance-1-0-pro-250528` (типова),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Моделі T2V (`*-t2v-*`) не приймають входи зображень; моделі I2V і
    загальні моделі `*-pro-*` підтримують одне еталонне зображення (перший
    кадр). Передайте зображення позиційно або задайте `role: "first_frame"`.
    Ідентифікатори моделей T2V автоматично перемикаються на відповідний варіант I2V,
    коли надається зображення.

    Підтримувані ключі `providerOptions`: `seed` (number), `draft` (boolean —
    примусово 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Потребує Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Ідентифікатор провайдера: `byteplus-seedance15`. Модель:
    `seedance-1-5-pro-251215`.

    Використовує уніфікований API `content[]`. Підтримує щонайбільше 2 вхідні зображення
    (`first_frame` + `last_frame`). Усі входи мають бути віддаленими URL `https://`.
    Установлюйте `role: "first_frame"` / `"last_frame"` для кожного зображення або
    передавайте зображення позиційно.

    `aspectRatio: "adaptive"` автоматично визначає співвідношення з вхідного зображення.
    `audio: true` перетворюється на `generate_audio`. `providerOptions.seed`
    (number) передається далі.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Потребує Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Ідентифікатор провайдера: `byteplus-seedance2`. Моделі:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Використовує уніфікований API `content[]`. Підтримує до 9 еталонних зображень,
    3 еталонних відео та 3 еталонних аудіо. Усі входи мають бути віддаленими
    URL `https://`. Задавайте `role` для кожного ресурсу — підтримувані значення:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` автоматично визначає співвідношення з вхідного зображення.
    `audio: true` перетворюється на `generate_audio`. `providerOptions.seed`
    (number) передається далі.

  </Accordion>
  <Accordion title="ComfyUI">
    Локальне або хмарне виконання на основі workflow. Підтримує text-to-video та
    image-to-video через налаштований граф.
  </Accordion>
  <Accordion title="fal">
    Використовує потік із чергою для довготривалих завдань. Більшість відеомоделей fal
    приймають одне еталонне зображення. Моделі Seedance 2.0 reference-to-video
    приймають до 9 зображень, 3 відео та 3 еталонних аудіо, при цьому
    загальна кількість еталонних файлів не має перевищувати 12.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Підтримує одне еталонне зображення або одне еталонне відео.
  </Accordion>
  <Accordion title="MiniMax">
    Лише одне еталонне зображення.
  </Accordion>
  <Accordion title="OpenAI">
    Передається лише перевизначення `size`. Інші перевизначення стилю
    (`aspectRatio`, `resolution`, `audio`, `watermark`) ігноруються з
    попередженням.
  </Accordion>
  <Accordion title="Qwen">
    Той самий бекенд DashScope, що й у Alibaba. Еталонні входи мають бути віддаленими
    URL `http(s)`; локальні файли відхиляються одразу.
  </Accordion>
  <Accordion title="Runway">
    Підтримує локальні файли через data URI. Для video-to-video потрібен
    `runway/gen4_aleph`. Текстові запуски показують співвідношення сторін `16:9` і `9:16`.
  </Accordion>
  <Accordion title="Together">
    Лише одне еталонне зображення.
  </Accordion>
  <Accordion title="Vydra">
    Використовує `https://www.vydra.ai/api/v1` безпосередньо, щоб уникнути перенаправлень,
    які втрачають автентифікацію. `veo3` комплектно постачається лише як text-to-video; `kling` потребує
    віддалений URL зображення.
  </Accordion>
  <Accordion title="xAI">
    Підтримує text-to-video, image-to-video з одним зображенням першого кадру, до 7
    входів `reference_image` через xAI `reference_images`, а також віддалені
    потоки редагування/розширення відео.
  </Accordion>
</AccordionGroup>

## Режими можливостей провайдера

Спільний контракт генерації відео підтримує можливості, специфічні для режиму,
а не лише пласкі агреговані ліміти. Нові реалізації провайдерів
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

Пласкіх агрегованих полів, таких як `maxInputImages` і `maxInputVideos`,
**недостатньо**, щоб оголосити підтримку режимів перетворення. Провайдери мають
явно оголошувати `generate`, `imageToVideo` і `videoToVideo`, щоб live-
тести, контрактні тести та спільний інструмент `video_generate` могли
детерміновано перевіряти підтримку режимів.

Коли одна модель у провайдера має ширшу підтримку еталонних входів, ніж
решта, використовуйте `maxInputImagesByModel`, `maxInputVideosByModel` або
`maxInputAudiosByModel` замість підвищення ліміту для всього режиму.

## Live-тести

Opt-in live-покриття для спільних комплектних провайдерів:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Обгортка репозиторію:

```bash
pnpm test:live:media video
```

Цей live-файл завантажує відсутні змінні середовища провайдерів із `~/.profile`, типово віддає
перевагу API-ключам із live/env перед збереженими auth profile і запускає
безпечний для релізу smoke-тест за замовчуванням:

- `generate` для кожного провайдера в sweep, крім FAL.
- Односекундний prompt із лобстером.
- Ліміт операції для кожного провайдера з
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням).

FAL є opt-in, оскільки затримка черги на стороні провайдера може домінувати у часі
релізу:

```bash
pnpm test:live:media video --video-providers fal
```

Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені
режими перетворення, які спільний sweep може безпечно перевіряти з локальними медіа:

- `imageToVideo`, коли `capabilities.imageToVideo.enabled`.
- `videoToVideo`, коли `capabilities.videoToVideo.enabled` і
  провайдер/модель приймає локальне відеовведення на основі буфера в спільному
  sweep.

Сьогодні спільний live-канал `videoToVideo` охоплює `runway`, лише коли ви
вибираєте `runway/gen4_aleph`.

## Конфігурація

Установіть типову модель генерації відео у вашій конфігурації OpenClaw:

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
- [Фонові задачі](/uk/automation/tasks) — відстеження задач для асинхронної генерації відео
- [BytePlus](/uk/concepts/model-providers#byteplus-international)
- [ComfyUI](/uk/providers/comfy)
- [Довідник з конфігурації](/uk/gateway/config-agents#agent-defaults)
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
