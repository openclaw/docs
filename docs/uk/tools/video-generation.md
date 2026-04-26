---
read_when:
    - Створення відео через агента
    - Налаштування провайдерів і моделей для генерації відео
    - Розуміння параметрів інструмента `video_generate`
sidebarTitle: Video generation
summary: Створюйте відео за допомогою `video_generate` з тексту, зображень або посилань на відео через 14 бекендів провайдерів
title: Генерація відео
x-i18n:
    generated_at: "2026-04-26T05:36:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

Агенти OpenClaw можуть створювати відео з текстових запитів, еталонних зображень або
наявних відео. Підтримуються чотирнадцять бекендів провайдерів, кожен із
різними варіантами моделей, режимами введення та наборами функцій. Агент
автоматично вибирає відповідного провайдера на основі вашої конфігурації та
доступних API-ключів.

<Note>
Інструмент `video_generate` з’являється лише тоді, коли доступний принаймні один провайдер
генерації відео. Якщо ви його не бачите серед інструментів агента, задайте
API-ключ провайдера або налаштуйте `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw розглядає генерацію відео як три режими виконання:

- `generate` — запити text-to-video без еталонних медіафайлів.
- `imageToVideo` — запит містить одне або кілька еталонних зображень.
- `videoToVideo` — запит містить одне або кілька еталонних відео.

Провайдери можуть підтримувати будь-яку підмножину цих режимів. Інструмент
перевіряє активний режим перед надсиланням і показує підтримувані режими в `action=list`.

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
    > Згенеруй 5-секундне кінематографічне відео з дружнім лобстером, який катається на серфі на заході сонця.

    Агент автоматично викликає `video_generate`. Дозволяти інструмент
    окремо не потрібно.

  </Step>
</Steps>

## Як працює асинхронна генерація

Генерація відео є асинхронною. Коли агент викликає `video_generate` у
сесії:

1. OpenClaw надсилає запит провайдеру й одразу повертає ідентифікатор завдання.
2. Провайдер обробляє завдання у фоновому режимі (зазвичай від 30 секунд до 5 хвилин залежно від провайдера та роздільної здатності).
3. Коли відео готове, OpenClaw пробуджує ту саму сесію внутрішньою подією завершення.
4. Агент публікує готове відео назад у вихідну розмову.

Поки завдання виконується, дубльовані виклики `video_generate` у тій самій
сесії повертають поточний статус завдання замість запуску ще однієї
генерації. Використовуйте `openclaw tasks list` або `openclaw tasks show <taskId>`, щоб
перевірити прогрес через CLI.

Поза запусками агента, прив’язаними до сесії (наприклад, для прямих викликів інструмента),
інструмент повертається до вбудованої генерації та повертає фінальний шлях до медіафайлу
в тому самому ході.

Згенеровані відеофайли зберігаються в керованому OpenClaw сховищі медіафайлів, якщо
провайдер повертає байти. Типове обмеження збереження для згенерованих відео відповідає
ліміту для відеомедіа, а `agents.defaults.mediaMaxMb` підвищує його для
більших рендерів. Якщо провайдер також повертає розміщений вихідний URL, OpenClaw
може передати цей URL замість помилки завдання, якщо локальне збереження
відхиляє занадто великий файл.

### Життєвий цикл завдання

| Стан        | Значення                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Завдання створено, очікує, поки провайдер його прийме.                                           |
| `running`   | Провайдер обробляє запит (зазвичай від 30 секунд до 5 хвилин залежно від провайдера та роздільної здатності). |
| `succeeded` | Відео готове; агент пробуджується та публікує його в розмові.                                    |
| `failed`    | Помилка провайдера або тайм-аут; агент пробуджується з деталями помилки.                         |

Перевіряйте статус через CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Якщо для поточної сесії завдання відео вже має стан `queued` або `running`,
`video_generate` повертає статус наявного завдання замість запуску нового.
Використовуйте `action: "status"`, щоб перевірити явно без запуску нової
генерації.

## Підтримувані провайдери

| Провайдер             | Модель за замовчуванням          | Текст | Еталонне зображення                                 | Еталонне відео                                  | Автентифікація                           |
| --------------------- | -------------------------------- | :---: | --------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                     |  ✓    | Так (віддалений URL)                                | Так (віддалений URL)                            | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`        |  ✓    | До 2 зображень (лише моделі I2V; перший і останній кадр) | —                                           | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`        |  ✓    | До 2 зображень (перший і останній кадр через role)  | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`   |  ✓    | До 9 еталонних зображень                            | До 3 відео                                      | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                       |  ✓    | 1 зображення                                        | —                                               | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`   |  ✓    | 1 зображення; до 9 із Seedance reference-to-video   | До 3 відео з Seedance reference-to-video        | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview`  |  ✓    | 1 зображення                                        | 1 відео                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`             |  ✓    | 1 зображення                                        | —                                               | `MINIMAX_API_KEY` або MiniMax OAuth      |
| OpenAI                | `sora-2`                         |  ✓    | 1 зображення                                        | 1 відео                                         | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                     |  ✓    | Так (віддалений URL)                                | Так (віддалений URL)                            | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                         |  ✓    | 1 зображення                                        | 1 відео                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`         |  ✓    | 1 зображення                                        | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                           |  ✓    | 1 зображення (`kling`)                              | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`             |  ✓    | 1 зображення першого кадру або до 7 `reference_image` | 1 відео                                      | `XAI_API_KEY`                            |

Деякі провайдери приймають додаткові або альтернативні змінні середовища для API-ключів. Докладніше дивіться
на окремих [сторінках провайдерів](#related).

Запустіть `video_generate action=list`, щоб під час виконання переглянути доступних провайдерів, моделі та
режими виконання.

### Матриця можливостей

Явний контракт режимів, який використовують `video_generate`, контрактні тести та
спільний live sweep:

| Провайдер | `generate` | `imageToVideo` | `videoToVideo` | Спільні live-режими сьогодні                                                                                                             |
| --------- | :--------: | :------------: | :------------: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` пропущено, оскільки цьому провайдеру потрібні віддалені відео-URL `http(s)`                  |
| BytePlus  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI   |     ✓      |       ✓        |       —        | Не входить до спільного sweep; покриття, специфічне для workflow, міститься в тестах Comfy                                               |
| fal       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` лише при використанні Seedance reference-to-video                                             |
| Google    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; спільний `videoToVideo` пропущено, оскільки поточний Gemini/Veo sweep на основі буфера не приймає такий ввід |
| MiniMax   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| OpenAI    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; спільний `videoToVideo` пропущено, оскільки цей шлях org/input наразі потребує доступу до inpaint/remix на боці провайдера |
| Qwen      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` пропущено, оскільки цьому провайдеру потрібні віддалені відео-URL `http(s)`                  |
| Runway    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` виконується лише тоді, коли вибрана модель — `runway/gen4_aleph`                             |
| Together  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| Vydra     |     ✓      |       ✓        |       —        | `generate`; спільний `imageToVideo` пропущено, оскільки вбудований `veo3` підтримує лише текст, а вбудований `kling` вимагає віддалений URL зображення |
| xAI       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` пропущено, оскільки цьому провайдеру наразі потрібен віддалений MP4 URL                      |

## Параметри інструмента

### Обов’язкові

<ParamField path="prompt" type="string" required>
  Текстовий опис відео, яке потрібно згенерувати. Обов’язковий для `action: "generate"`.
</ParamField>

### Вхідні дані контенту

<ParamField path="image" type="string">Одне еталонне зображення (шлях або URL).</ParamField>
<ParamField path="images" type="string[]">Кілька еталонних зображень (до 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Необов’язкові підказки ролей для кожної позиції, паралельні об’єднаному списку зображень.
Канонічні значення: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Одне еталонне відео (шлях або URL).</ParamField>
<ParamField path="videos" type="string[]">Кілька еталонних відео (до 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Необов’язкові підказки ролей для кожної позиції, паралельні об’єднаному списку відео.
Канонічне значення: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Одне еталонне аудіо (шлях або URL). Використовується для фонової музики або
еталону голосу, якщо провайдер підтримує аудіовхід.
</ParamField>
<ParamField path="audioRefs" type="string[]">Кілька еталонних аудіо (до 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Необов’язкові підказки ролей для кожної позиції, паралельні об’єднаному списку аудіо.
Канонічне значення: `reference_audio`.
</ParamField>

<Note>
Підказки ролей передаються провайдеру як є. Канонічні значення походять із
об’єднання `VideoGenerationAssetRole`, але провайдери можуть приймати додаткові
рядки ролей. Масиви `*Roles` не повинні містити більше записів, ніж
відповідний список еталонів; помилки на одиницю завершуються зрозумілою помилкою.
Використовуйте порожній рядок, щоб залишити слот незаповненим. Для xAI встановіть кожну роль зображення як
`reference_image`, щоб використовувати його режим генерації `reference_images`; опустіть
роль або використовуйте `first_frame` для image-to-video з одним зображенням.
</Note>

### Керування стилем

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` або `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` або `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Цільова тривалість у секундах (округлюється до найближчого значення, яке підтримує провайдер).
</ParamField>
<ParamField path="size" type="string">Підказка розміру, якщо провайдер її підтримує.</ParamField>
<ParamField path="audio" type="boolean">
  Увімкнути згенероване аудіо у вихідному результаті, якщо підтримується. Відрізняється від `audioRef*` (вхідні дані).
</ParamField>
<ParamField path="watermark" type="boolean">Увімкнути або вимкнути водяний знак провайдера, якщо підтримується.</ParamField>

`adaptive` — це специфічний для провайдера сигнальний маркер: він передається як є
провайдерам, які оголошують `adaptive` у своїх можливостях (наприклад, BytePlus
Seedance використовує його для автоматичного визначення співвідношення сторін із
розмірів вхідного зображення). Провайдери, які його не оголошують, показують це значення через
`details.ignoredOverrides` у результаті інструмента, щоб було видно, що його пропущено.

### Додатково

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` повертає поточне завдання сесії; `"list"` перевіряє провайдерів.
</ParamField>
<ParamField path="model" type="string">Перевизначення провайдера/моделі (наприклад, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Підказка для імені вихідного файла.</ParamField>
<ParamField path="timeoutMs" type="number">Необов’язковий тайм-аут запиту до провайдера в мілісекундах.</ParamField>
<ParamField path="providerOptions" type="object">
  Специфічні для провайдера параметри як JSON-об’єкт (наприклад, `{"seed": 42, "draft": true}`).
  Провайдери, які оголошують типізовану схему, перевіряють ключі та типи; невідомі
  ключі або невідповідності пропускають кандидата під час fallback. Провайдери без
  оголошеної схеми отримують параметри як є. Запустіть `video_generate action=list`,
  щоб побачити, що приймає кожен провайдер.
</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. OpenClaw нормалізує тривалість до
найближчого значення, яке підтримує провайдер, і переназначає трансформовані підказки геометрії,
наприклад size-to-aspect-ratio, коли fallback-провайдер надає іншу
поверхню керування. По-справжньому непідтримувані перевизначення ігноруються за принципом best effort
і повідомляються як попередження в результаті інструмента. Жорсткі обмеження можливостей
(наприклад, надто багато еталонних вхідних даних) завершуються помилкою ще до надсилання. Результати інструмента
показують застосовані налаштування; `details.normalization` фіксує будь-яке
перетворення від запитаного до застосованого.
</Note>

Еталонні вхідні дані вибирають режим виконання:

- Немає еталонних медіафайлів → `generate`
- Будь-яке еталонне зображення → `imageToVideo`
- Будь-яке еталонне відео → `videoToVideo`
- Еталонні аудіовхідні дані **не** змінюють визначений режим; вони застосовуються
  поверх режиму, який вибирають еталонні зображення/відео, і працюють лише
  з провайдерами, які оголошують `maxInputAudios`.

Змішані еталонні зображення та відео не є стабільною спільною поверхнею можливостей.
Рекомендується використовувати один тип еталона на запит.

#### Fallback і типізовані параметри

Деякі перевірки можливостей застосовуються на рівні fallback, а не на межі
інструмента, тому запит, який перевищує ліміти основного провайдера, все ще
може виконатися на здатному fallback-провайдері:

- Активний кандидат, який не оголошує `maxInputAudios` (або `0`), пропускається, якщо
  запит містить еталонні аудіодані; буде спробувано наступного кандидата.
- Якщо `maxDurationSeconds` активного кандидата менше за запитане `durationSeconds`
  і список `supportedDurationSeconds` не оголошено → кандидата пропускають.
- Запит містить `providerOptions`, а активний кандидат явно
  оголошує типізовану схему `providerOptions` → кандидата пропускають, якщо надані ключі
  відсутні в схемі або типи значень не збігаються. Провайдери без
  оголошеної схеми отримують параметри як є (backward-compatible
  pass-through). Провайдер може відмовитися від усіх provider options,
  оголосивши порожню схему (`capabilities.providerOptions: {}`), що
  призводить до того самого пропуску, що й невідповідність типів.

Перша причина пропуску в запиті записується на рівні `warn`, щоб оператори бачили, коли
їхній основний провайдер було пропущено; наступні пропуски записуються на рівні `debug`, щоб
довгі ланцюжки fallback не створювали зайвого шуму. Якщо кожного кандидата пропущено, сукупна
помилка містить причину пропуску для кожного.

## Дії

| Дія        | Що вона робить                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| `generate` | Типова дія. Створює відео з указаного запиту та необов’язкових еталонних вхідних даних.                    |
| `status`   | Перевіряє стан поточного відеозавдання для поточної сесії без запуску нової генерації.                     |
| `list`     | Показує доступних провайдерів, моделі та їхні можливості.                                                   |

## Вибір моделі

OpenClaw визначає модель у такому порядку:

1. **Параметр інструмента `model`** — якщо агент указує його у виклику.
2. **`videoGenerationModel.primary`** із конфігурації.
3. **`videoGenerationModel.fallbacks`** по черзі.
4. **Автовизначення** — провайдери з дійсною автентифікацією, починаючи з
   поточного провайдера за замовчуванням, а потім решта провайдерів в алфавітному
   порядку.

Якщо провайдер завершується помилкою, автоматично виконується спроба з наступним кандидатом. Якщо всі
кандидати завершуються помилкою, помилка містить деталі кожної спроби.

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

    Моделі T2V (`*-t2v-*`) не приймають вхідні зображення; моделі I2V і
    загальні моделі `*-pro-*` підтримують одне еталонне зображення (перший
    кадр). Передайте зображення позиційно або встановіть `role: "first_frame"`.
    Ідентифікатори моделей T2V автоматично перемикаються на відповідний варіант I2V,
    коли надається зображення.

    Підтримувані ключі `providerOptions`: `seed` (number), `draft` (boolean —
    примусово задає 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Потребує Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Ідентифікатор провайдера: `byteplus-seedance15`. Модель:
    `seedance-1-5-pro-251215`.

    Використовує уніфікований API `content[]`. Підтримує не більше 2 вхідних зображень
    (`first_frame` + `last_frame`). Усі вхідні дані мають бути віддаленими URL `https://`.
    Встановіть `role: "first_frame"` / `"last_frame"` для кожного зображення або
    передайте зображення позиційно.

    `aspectRatio: "adaptive"` автоматично визначає співвідношення сторін із вхідного зображення.
    `audio: true` відображається на `generate_audio`. `providerOptions.seed`
    (number) передається далі.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Потребує Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Ідентифікатор провайдера: `byteplus-seedance2`. Моделі:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Використовує уніфікований API `content[]`. Підтримує до 9 еталонних зображень,
    3 еталонних відео та 3 еталонних аудіо. Усі вхідні дані мають бути віддаленими
    URL `https://`. Установіть `role` для кожного ресурсу — підтримувані значення:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` автоматично визначає співвідношення сторін із вхідного зображення.
    `audio: true` відображається на `generate_audio`. `providerOptions.seed`
    (number) передається далі.

  </Accordion>
  <Accordion title="ComfyUI">
    Виконання локально або в хмарі на основі workflow. Підтримує text-to-video та
    image-to-video через налаштований граф.
  </Accordion>
  <Accordion title="fal">
    Використовує потік із чергою для довготривалих завдань. Більшість відеомоделей fal
    приймають одне еталонне зображення. Моделі Seedance 2.0 reference-to-video
    приймають до 9 зображень, 3 відео та 3 еталонних аудіо, але
    не більше 12 еталонних файлів загалом.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Підтримує одне еталонне зображення або одне еталонне відео.
  </Accordion>
  <Accordion title="MiniMax">
    Лише одне еталонне зображення.
  </Accordion>
  <Accordion title="OpenAI">
    Передається далі лише перевизначення `size`. Інші перевизначення стилю
    (`aspectRatio`, `resolution`, `audio`, `watermark`) ігноруються з
    попередженням.
  </Accordion>
  <Accordion title="Qwen">
    Той самий бекенд DashScope, що й у Alibaba. Еталонні вхідні дані мають бути віддаленими
    URL `http(s)`; локальні файли відхиляються одразу.
  </Accordion>
  <Accordion title="Runway">
    Підтримує локальні файли через data URI. Для video-to-video потрібен
    `runway/gen4_aleph`. Запуски лише з текстом підтримують співвідношення сторін
    `16:9` і `9:16`.
  </Accordion>
  <Accordion title="Together">
    Лише одне еталонне зображення.
  </Accordion>
  <Accordion title="Vydra">
    Використовує `https://www.vydra.ai/api/v1` безпосередньо, щоб уникнути
    перенаправлень, які скидають автентифікацію. `veo3` вбудовано лише як text-to-video; `kling` потребує
    віддаленого URL зображення.
  </Accordion>
  <Accordion title="xAI">
    Підтримує text-to-video, image-to-video з одним зображенням першого кадру, до 7
    входів `reference_image` через xAI `reference_images`, а також потоки
    віддаленого редагування/розширення відео.
  </Accordion>
</AccordionGroup>

## Режими можливостей провайдерів

Спільний контракт генерації відео підтримує можливості, специфічні для режиму,
а не лише плоскі агреговані ліміти. Нові реалізації провайдерів
мають надавати перевагу явним блокам режимів:

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

Плоских агрегованих полів, таких як `maxInputImages` і `maxInputVideos`,
**недостатньо**, щоб оголосити підтримку режимів трансформації. Провайдери повинні
явно оголошувати `generate`, `imageToVideo` і `videoToVideo`, щоб live-
тести, контрактні тести та спільний інструмент `video_generate` могли
детерміновано перевіряти підтримку режимів.

Коли одна модель у провайдера має ширшу підтримку еталонних вхідних даних, ніж
решта, використовуйте `maxInputImagesByModel`, `maxInputVideosByModel` або
`maxInputAudiosByModel` замість підвищення ліміту для всього режиму.

## Live-тести

Opt-in live-покриття для спільних вбудованих провайдерів:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Обгортка репозиторію:

```bash
pnpm test:live:media video
```

Цей live-файл завантажує відсутні змінні середовища провайдерів із `~/.profile`, надає
перевагу live/env API-ключам перед збереженими профілями автентифікації за замовчуванням і запускає
безпечний для релізу smoke-тест за замовчуванням:

- `generate` для кожного провайдера у sweep, крім FAL.
- Односекундний запит про лобстера.
- Ліміт операції для кожного провайдера з
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням).

FAL є opt-in, оскільки затримка черги на боці провайдера може домінувати
в часі релізу:

```bash
pnpm test:live:media video --video-providers fal
```

Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені
режими трансформації, які спільний sweep може безпечно виконувати з локальними медіафайлами:

- `imageToVideo`, коли `capabilities.imageToVideo.enabled`.
- `videoToVideo`, коли `capabilities.videoToVideo.enabled` і
  провайдер/модель приймає локальне відео на основі буфера у спільному
  sweep.

Наразі спільний live-режим `videoToVideo` охоплює лише `runway`, якщо ви
вибираєте `runway/gen4_aleph`.

## Конфігурація

Установіть модель генерації відео за замовчуванням у конфігурації OpenClaw:

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
- [Довідник із конфігурації](/uk/gateway/config-agents#agent-defaults)
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
