---
read_when:
    - Генерація зображень через агента
    - Налаштування провайдерів і моделей для генерації зображень
    - Розуміння параметрів інструмента `image_generate`
summary: Генеруйте та редагуйте зображення за допомогою налаштованих провайдерів (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-24T16:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8e721918f5d610163894f33fbfd39ade6694be8bf4ad47c7c691d780d49637
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати та редагувати зображення за допомогою ваших налаштованих провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний принаймні один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів вашого агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Установіть API-ключ щонайменше для одного провайдера (наприклад, `OPENAI_API_KEY`, `GEMINI_API_KEY` або `OPENROUTER_API_KEY`) або увійдіть через OpenAI Codex OAuth.
2. За бажанням укажіть бажану модель:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth використовує те саме посилання на модель `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw спрямовує запити на
зображення через той самий OAuth-профіль замість того, щоб спочатку пробувати `OPENAI_API_KEY`.
Явна власна конфігурація зображень `models.providers.openai`, наприклад API-ключ або
власний/Azure базовий URL, знову перемикає на прямий маршрут OpenAI Images API.
Для OpenAI-сумісних LAN-ендпоінтів, таких як LocalAI, збережіть власний
`models.providers.openai.baseUrl` і явно ввімкніть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; приватні/внутрішні
ендпоінти зображень за замовчуванням залишаються заблокованими.

3. Попросіть агента: _"Згенеруй зображення дружнього робота-маскота."_

Агент автоматично викликає `image_generate`. Жодного списку дозволених інструментів не потрібно — він увімкнений за замовчуванням, коли доступний провайдер.

## Поширені маршрути

| Ціль                                                 | Посилання на модель                               | Автентифікація                      |
| ---------------------------------------------------- | ------------------------------------------------- | ----------------------------------- |
| Генерація зображень OpenAI з білінгом API            | `openai/gpt-image-2`                              | `OPENAI_API_KEY`                    |
| Генерація зображень OpenAI з автентифікацією підписки Codex | `openai/gpt-image-2`                              | OpenAI Codex OAuth                  |
| Генерація зображень OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                |
| Генерація зображень Google Gemini                    | `google/gemini-3.1-flash-image-preview`           | `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Той самий інструмент `image_generate` обробляє як генерацію з тексту в зображення,
так і редагування з еталонними зображеннями. Використовуйте `image` для одного еталона
або `images` для кількох еталонів.
Підказки для виводу, які підтримує провайдер, наприклад `quality`, `outputFormat` і
специфічний для OpenAI `background`, передаються далі, коли це можливо, і позначаються як
проігноровані, якщо провайдер їх не підтримує.

## Підтримувані провайдери

| Провайдер | Модель за замовчуванням                | Підтримка редагування              | Автентифікація                                        |
| --------- | -------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI    | `gpt-image-2`                          | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)       | `OPENROUTER_API_KEY`                                  |
| Google    | `gemini-3.1-flash-image-preview`       | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                 |
| fal       | `fal-ai/flux/dev`                      | Так                                | `FAL_KEY`                                             |
| MiniMax   | `image-01`                             | Так (еталон об’єкта)               | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                             | Так (1 зображення, визначене workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари   |
| Vydra     | `grok-imagine`                         | Ні                                 | `VYDRA_API_KEY`                                       |
| xAI       | `grok-imagine-image`                   | Так (до 5 зображень)               | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб переглянути доступні провайдери та моделі під час виконання:

```
/tool image_generate action=list
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
Підказка для генерації зображення. Обов’язкова для `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Використовуйте `"list"`, щоб переглянути доступні провайдери та моделі під час виконання.
</ParamField>

<ParamField path="model" type="string">
Перевизначення провайдера/моделі, наприклад `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Шлях або URL одного еталонного зображення для режиму редагування.
</ParamField>

<ParamField path="images" type="string[]">
Кілька еталонних зображень для режиму редагування (до 5).
</ParamField>

<ParamField path="size" type="string">
Підказка розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Співвідношення сторін: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Підказка роздільної здатності.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Підказка якості, якщо провайдер її підтримує.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Підказка формату виводу, якщо провайдер її підтримує.
</ParamField>

<ParamField path="count" type="number">
Кількість зображень для генерації (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Необов’язковий тайм-аут запиту до провайдера в мілісекундах.
</ParamField>

<ParamField path="filename" type="string">
Підказка імені вихідного файла.
</ParamField>

<ParamField path="openai" type="object">
Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>

Не всі провайдери підтримують усі параметри. Коли резервний провайдер підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед відправленням переналаштовує на найближчий підтримуваний розмір, співвідношення сторін або роздільну здатність. Непідтримувані підказки виводу, такі як `quality` або `outputFormat`, відкидаються для провайдерів, які не оголошують їхню підтримку, і відображаються в результаті інструмента.

Результати інструмента повідомляють про застосовані налаштування. Коли OpenClaw переналаштовує геометрію під час переходу до резервного провайдера, повернені значення `size`, `aspectRatio` і `resolution` відображають те, що було фактично надіслано, а `details.normalization` фіксує перетворення від запитаного до застосованого.

## Конфігурація

### Вибір моделі

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Порядок вибору провайдера

Під час генерації зображення OpenClaw пробує провайдерів у такому порядку:

1. Параметр **`model`** із виклику інструмента (якщо агент його вказує)
2. **`imageGenerationModel.primary`** із конфігурації
3. **`imageGenerationModel.fallbacks`** по порядку
4. **Автовизначення** — використовує лише типові налаштування провайдерів із підтримкою автентифікації:
   - спочатку поточний провайдер за замовчуванням
   - потім решта зареєстрованих провайдерів генерації зображень у порядку provider-id

Якщо провайдер завершується невдачею (помилка автентифікації, ліміт запитів тощо), автоматично пробується наступний кандидат. Якщо всі завершуються невдачею, помилка містить деталі кожної спроби.

Примітки:

- Автовизначення враховує автентифікацію. Типовий провайдер потрапляє до списку кандидатів
  лише тоді, коли OpenClaw справді може автентифікувати цього провайдера.
- Автовизначення увімкнене за замовчуванням. Установіть
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень
  використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Використовуйте `action: "list"`, щоб переглянути поточно зареєстрованих провайдерів, їхні
  моделі за замовчуванням і підказки щодо auth env vars.

### Редагування зображень

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування еталонних зображень. Передайте шлях або URL еталонного зображення:

```
"Згенеруй акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 еталонних зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### Моделі зображень OpenRouter

Генерація зображень OpenRouter використовує той самий `OPENROUTER_API_KEY` і маршрутизується через API зображень chat completions OpenRouter. Вибирайте моделі зображень OpenRouter з префіксом `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw передає в OpenRouter `prompt`, `count`, еталонні зображення та сумісні з Gemini підказки `aspectRatio` / `resolution`. Поточні вбудовані скорочення моделей зображень OpenRouter включають `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`; використовуйте `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

### OpenAI `gpt-image-2`

Генерація зображень OpenAI за замовчуванням використовує `openai/gpt-image-2`. Якщо
налаштовано OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий OAuth-профіль,
що використовується моделями чату підписки Codex, і надсилає запит на зображення
через бекенд Codex Responses; для цього запиту він не переходить непомітно на
`OPENAI_API_KEY`. Щоб примусово використовувати пряму маршрутизацію через OpenAI Images API,
явно налаштуйте `models.providers.openai` з API-ключем, власним base URL
або ендпоінтом Azure. Старішу модель
`openai/gpt-image-1` усе ще можна вибрати явно, але нові запити OpenAI
на генерацію та редагування зображень мають використовувати `gpt-image-2`.

`gpt-image-2` підтримує як генерацію зображень із тексту, так і редагування з
еталонними зображеннями через той самий інструмент `image_generate`. OpenClaw передає в OpenAI `prompt`,
`count`, `size`, `quality`, `outputFormat` і еталонні зображення.
OpenAI не отримує `aspectRatio` або `resolution` безпосередньо; коли це можливо,
OpenClaw відображає їх у підтримуваний `size`, інакше інструмент повідомляє про них як про
проігноровані перевизначення.

Параметри, специфічні для OpenAI, містяться в об’єкті `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` приймає `transparent`, `opaque` або `auto`; прозорі
результати вимагають `outputFormat` `png` або `webp`. `openai.outputCompression`
застосовується до результатів JPEG/WebP.

Згенерувати одне горизонтальне 4K-зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Згенерувати два квадратні зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Відредагувати одне локальне еталонне зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Відредагувати з кількома еталонами:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб маршрутизувати генерацію зображень OpenAI через розгортання Azure OpenAI замість
`api.openai.com`, див. [Ендпоінти Azure OpenAI](/uk/providers/openai#azure-openai-endpoints)
у документації провайдера OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи автентифікації MiniMax:

- `minimax/image-01` для налаштувань з API-ключем
- `minimax-portal/image-01` для налаштувань з OAuth

## Можливості провайдерів

| Можливість            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерація             | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (виводи визначаються workflow) | Так (1) | Так (до 4)           |
| Редагування/еталон    | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, еталон об’єкта) | Так (1 зображення, визначене workflow) | Ні      | Так (до 5 зображень) |
| Керування розміром    | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Співвідношення сторін | Ні                   | Так                  | Так (лише генерація) | Так                       | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні         | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований провайдер xAI використовує `/v1/images/generations` для запитів
лише з підказкою і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Кількість: до 4
- Еталони: один `image` або до п’яти `images`
- Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільні здатності: `1K`, `2K`
- Результати: повертаються як вкладення зображень, якими керує OpenClaw

OpenClaw навмисно не відкриває специфічні для xAI `quality`, `mask`, `user` або
додаткові співвідношення сторін, доступні лише нативно, доки ці елементи керування не з’являться в спільному
міжпровайдерному контракті `image_generate`.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального ComfyUI і workflow Comfy Cloud
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео й мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування зображень, відео, пошуку, виконання коду й TTS Grok
- [Довідник із конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і перемикання на резервні варіанти
