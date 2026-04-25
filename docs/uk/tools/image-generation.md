---
read_when:
    - Генерування зображень через агента
    - Налаштування провайдерів і моделей для генерування зображень
    - Розуміння параметрів інструмента `image_generate`
summary: Генеруйте та редагуйте зображення за допомогою налаштованих провайдерів (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-25T17:34:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0eadcc8d600530d577977c4d8c8d5a08a8b1ede0ca55e37f232c823d26abb69b
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати й редагувати зображення за допомогою налаштованих вами провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється, лише коли доступний принаймні один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів вашого агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера або виконайте вхід через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Задайте API-ключ принаймні для одного провайдера (наприклад, `OPENAI_API_KEY`, `GEMINI_API_KEY` або `OPENROUTER_API_KEY`) або виконайте вхід через OpenAI Codex OAuth.
2. За бажанням задайте бажану модель:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // Необов’язковий типовий тайм-аут запиту провайдера для image_generate.
        timeoutMs: 180_000,
      },
    },
  },
}
```

Codex OAuth використовує те саме посилання на модель `openai/gpt-image-2`. Коли
налаштовано профіль OAuth `openai-codex`, OpenClaw маршрутизує запити на зображення
через цей самий профіль OAuth замість того, щоб спочатку намагатися використати `OPENAI_API_KEY`.
Явна користувацька конфігурація зображень `models.providers.openai`, наприклад API-ключ або
користувацький/Azure base URL, знову перемикає на прямий маршрут OpenAI Images API.
Для OpenAI-сумісних LAN endpoints, таких як LocalAI, збережіть користувацький
`models.providers.openai.baseUrl` і явно ввімкніть це через
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; приватні/внутрішні
endpoints зображень за замовчуванням залишаються заблокованими.

3. Попросіть агента: _"Згенеруй зображення дружнього робота-маскота."_

Агент автоматично викликає `image_generate`. Жодного allow-listing інструментів не потрібно — він увімкнений за замовчуванням, коли доступний провайдер.

## Поширені маршрути

| Ціль                                                 | Посилання на модель                                 | Автентифікація                        |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| Генерація зображень OpenAI з оплатою через API       | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| Генерація зображень OpenAI з автентифікацією за підпискою Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                   |
| Генерація зображень OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| Генерація зображень Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Той самий інструмент `image_generate` обробляє генерацію з тексту в зображення і
редагування із зображеннями-референсами. Використовуйте `image` для одного референса або `images` для кількох референсів.
Підтримувані провайдером підказки щодо виводу, такі як `quality`, `outputFormat` і
специфічний для OpenAI `background`, пересилаються, коли це можливо, і позначаються як
проігноровані, якщо провайдер їх не підтримує.

## Підтримувані провайдери

| Провайдер  | Типова модель                           | Підтримка редагування               | Автентифікація                                       |
| ---------- | --------------------------------------- | ---------------------------------- | ---------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)       | `OPENROUTER_API_KEY`                                 |
| Google     | `gemini-3.1-flash-image-preview`        | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                |
| fal        | `fal-ai/flux/dev`                       | Так                                | `FAL_KEY`                                            |
| MiniMax    | `image-01`                              | Так (референс об’єкта)             | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | Так (1 зображення, визначається workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари  |
| Vydra      | `grok-imagine`                          | Ні                                 | `VYDRA_API_KEY`                                      |
| xAI        | `grok-imagine-image`                    | Так (до 5 зображень)               | `XAI_API_KEY`                                        |

Використовуйте `action: "list"`, щоб перевірити доступні провайдери й моделі під час виконання:

```
/tool image_generate action=list
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
Підказка для генерації зображення. Обов’язкова для `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Використовуйте `"list"`, щоб перевірити доступні провайдери й моделі під час виконання.
</ParamField>

<ParamField path="model" type="string">
Перевизначення провайдера/моделі, наприклад `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Шлях або URL одного зображення-референса для режиму редагування.
</ParamField>

<ParamField path="images" type="string[]">
Кілька зображень-референсів для режиму редагування (до 5).
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
Підказка якості, коли провайдер це підтримує.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Підказка формату виводу, коли провайдер це підтримує.
</ParamField>

<ParamField path="count" type="number">
Кількість зображень для генерації (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Необов’язковий тайм-аут запиту до провайдера в мілісекундах.
</ParamField>

<ParamField path="filename" type="string">
Підказка щодо назви вихідного файла.
</ParamField>

<ParamField path="openai" type="object">
Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>

Не всі провайдери підтримують усі параметри. Коли fallback-провайдер підтримує близький геометричний варіант замість точно запитаного, OpenClaw перед відправленням зіставляє його з найближчим підтримуваним розміром, співвідношенням сторін або роздільною здатністю. Непідтримувані підказки виводу, такі як `quality` або `outputFormat`, відкидаються для провайдерів, які не оголошують їх підтримку, і про це повідомляється в результаті інструмента.

Результати інструмента повідомляють про застосовані налаштування. Коли OpenClaw виконує зіставлення геометрії під час fallback провайдера, повернені значення `size`, `aspectRatio` і `resolution` відображають те, що було фактично надіслано, а `details.normalization` фіксує перетворення із запитаного в застосоване.

## Конфігурація

### Вибір моделі

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
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

### Порядок вибору провайдерів

Під час генерації зображення OpenClaw пробує провайдерів у такому порядку:

1. **Параметр `model`** із виклику інструмента (якщо агент його вказує)
2. **`imageGenerationModel.primary`** із конфігурації
3. **`imageGenerationModel.fallbacks`** по порядку
4. **Автовиявлення** — використовує лише типові значення провайдерів, підкріплені автентифікацією:
   - спочатку поточний типовий провайдер
   - решта зареєстрованих провайдерів генерації зображень у порядку provider-id

Якщо провайдер завершується помилкою (помилка автентифікації, rate limit тощо), автоматично пробується наступний налаштований кандидат. Якщо помиляються всі, помилка містить подробиці кожної спроби.

Примітки:

- Перевизначення `model` для окремого виклику є точним: OpenClaw пробує лише цей провайдер/модель
  і не переходить до налаштованих primary/fallback або автовиявлених
  провайдерів.
- Автовиявлення враховує автентифікацію. Типове значення провайдера потрапляє до списку кандидатів
  лише тоді, коли OpenClaw справді може автентифікувати цього провайдера.
- Автовиявлення ввімкнено за замовчуванням. Установіть
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо ви хочете, щоб генерація зображень
  використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Установіть `agents.defaults.imageGenerationModel.timeoutMs` для повільних бекендів зображень.
  Параметр інструмента `timeoutMs` для окремого виклику перевизначає налаштоване типове значення.
- Використовуйте `action: "list"`, щоб переглянути поточні зареєстровані провайдери, їхні
  типові моделі й підказки щодо env vars для автентифікації.

### Редагування зображень

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування зображень-референсів. Передайте шлях або URL зображення-референса:

```
"Згенеруй акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 зображень-референсів через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### Моделі зображень OpenRouter

Генерація зображень OpenRouter використовує той самий `OPENROUTER_API_KEY` і маршрутизується через image API chat completions OpenRouter. Вибирайте моделі зображень OpenRouter з префіксом `openrouter/`:

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

OpenClaw пересилає `prompt`, `count`, зображення-референси й сумісні з Gemini підказки `aspectRatio` / `resolution` до OpenRouter. Поточні вбудовані скорочення моделей зображень OpenRouter включають `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`; використовуйте `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

### OpenAI `gpt-image-2`

Генерація зображень OpenAI за замовчуванням використовує `openai/gpt-image-2`. Якщо
налаштовано профіль OAuth `openai-codex`, OpenClaw повторно використовує той самий профіль OAuth,
який застосовується для чат-моделей за підпискою Codex, і надсилає запит на зображення
через бекенд Codex Responses. Застарілі base URL Codex, такі як
`https://chatgpt.com/backend-api`, канонізуються до
`https://chatgpt.com/backend-api/codex` для запитів на зображення. Він не
виконує мовчазного fallback до `OPENAI_API_KEY` для такого запиту. Щоб примусово використовувати прямий маршрут
OpenAI Images API, явно налаштуйте `models.providers.openai` з API-ключем,
користувацьким base URL або endpoint Azure. Старішу модель
`openai/gpt-image-1` усе ще можна явно вибрати, але нові запити OpenAI на
генерацію та редагування зображень повинні використовувати `gpt-image-2`.

`gpt-image-2` підтримує як генерацію зображень із тексту, так і редагування із
зображеннями-референсами через той самий інструмент `image_generate`. OpenClaw пересилає `prompt`,
`count`, `size`, `quality`, `outputFormat` і зображення-референси до OpenAI.
OpenAI не отримує `aspectRatio` або `resolution` безпосередньо; коли це можливо,
OpenClaw зіставляє їх із підтримуваним `size`, інакше інструмент повідомляє про них як про
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

Згенеруйте одне ландшафтне зображення 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Згенеруйте два квадратні зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Відредагуйте одне локальне зображення-референс:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Збережи об’єкт, заміни тло на яскраву студійну сцену" image=/path/to/reference.png size=1024x1536
```

Редагування з кількома референсами:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Поєднай ідентичність персонажа з першого зображення з палітрою кольорів із другого" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб маршрутизувати генерацію зображень OpenAI через розгортання Azure OpenAI замість
`api.openai.com`, див. [Azure OpenAI endpoints](/uk/providers/openai#azure-openai-endpoints)
у документації провайдера OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи автентифікації MiniMax:

- `minimax/image-01` для налаштувань із API-ключем
- `minimax-portal/image-01` для налаштувань із OAuth

## Можливості провайдерів

| Можливість            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерація             | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (виводи визначаються workflow) | Так (1) | Так (до 4)           |
| Редагування/референс  | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, референс об’єкта) | Так (1 зображення, визначається workflow) | Ні      | Так (до 5 зображень) |
| Керування розміром    | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Співвідношення сторін | Ні                   | Так                  | Так (лише генерація) | Так                        | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні           | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований провайдер xAI використовує `/v1/images/generations` для запитів лише з prompt
і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Count: до 4
- Референси: один `image` або до п’яти `images`
- Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільні здатності: `1K`, `2K`
- Виводи: повертаються як вкладення зображень, якими керує OpenClaw

OpenClaw навмисно не надає специфічні для xAI `quality`, `mask`, `user` або
додаткові нативні співвідношення сторін, доки ці елементи керування не з’являться в спільному
міжпровайдерному контракті `image_generate`.

## Пов’язано

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального workflow ComfyUI і Comfy Cloud
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео й мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, пошуку, виконання коду та TTS
- [Довідник із конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і аварійне перемикання
