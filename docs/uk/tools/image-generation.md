---
read_when:
    - Генерування зображень через агента
    - Налаштування провайдерів і моделей для генерування зображень
    - Розуміння параметрів інструмента `image_generate`
summary: Генеруйте та редагуйте зображення за допомогою налаштованих провайдерів (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, LiteLLM, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-25T18:14:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40ec0e9a004e769b3db8b98b1a687097cb4bc6aa78dc903e4f6a17c3731156c0
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати та редагувати зображення за допомогою налаштованих провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний щонайменше один провайдер генерування зображень. Якщо ви не бачите `image_generate` у списку інструментів вашого агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Установіть API-ключ щонайменше для одного провайдера (наприклад, `OPENAI_API_KEY`, `GEMINI_API_KEY` або `OPENROUTER_API_KEY`) або увійдіть через OpenAI Codex OAuth.
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
налаштовано OAuth-профіль `openai-codex`, OpenClaw маршрутизує запити на зображення
через той самий OAuth-профіль замість того, щоб спочатку пробувати `OPENAI_API_KEY`.
Явна користувацька конфігурація зображень `models.providers.openai`, наприклад API-ключ або
власний/Azure base URL, знову вмикає прямий маршрут через OpenAI Images API.
Для сумісних з OpenAI LAN-ендпоінтів, таких як LocalAI, збережіть користувацький
`models.providers.openai.baseUrl` і явно ввімкніть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; приватні/внутрішні
ендпоінти зображень типово залишаються заблокованими.

3. Попросіть агента: _"Згенеруй зображення дружнього робота-маскота."_

Агент автоматично викликає `image_generate`. Жодного allow-list для інструментів не потрібно — він увімкнений типово, коли провайдер доступний.

## Поширені маршрути

| Ціль                                                 | Посилання на модель                                | Автентифікація                      |
| ---------------------------------------------------- | -------------------------------------------------- | ----------------------------------- |
| Генерування зображень OpenAI з оплатою через API     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                    |
| Генерування зображень OpenAI з автентифікацією через підписку Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                  |
| Генерування зображень OpenRouter                     | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                |
| Генерування зображень LiteLLM                        | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                   |
| Генерування зображень Google Gemini                  | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` or `GOOGLE_API_KEY` |

Той самий інструмент `image_generate` обробляє як генерацію з тексту в зображення, так і
редагування за еталонним зображенням. Використовуйте `image` для одного еталона або `images` для
кількох еталонів. Підказки щодо виходу, які підтримуються провайдером, такі як `quality`, `outputFormat` і
специфічний для OpenAI `background`, передаються далі, коли це можливо, і позначаються як
проігноровані, якщо провайдер їх не підтримує.

## Підтримувані провайдери

| Провайдер  | Типова модель                          | Підтримка редагування               | Автентифікація                                        |
| ---------- | -------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                          | Так (до 4 зображень)                | `OPENAI_API_KEY` або OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview`| Так (до 5 вхідних зображень)        | `OPENROUTER_API_KEY`                                  |
| LiteLLM    | `gpt-image-2`                          | Так (до 5 вхідних зображень)        | `LITELLM_API_KEY`                                     |
| Google     | `gemini-3.1-flash-image-preview`       | Так                                 | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                 |
| fal        | `fal-ai/flux/dev`                      | Так                                 | `FAL_KEY`                                             |
| MiniMax    | `image-01`                             | Так (еталон суб’єкта)               | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                             | Так (1 зображення, залежно від workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари |
| Vydra      | `grok-imagine`                         | Ні                                  | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                   | Так (до 5 зображень)                | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб переглянути доступні провайдери й моделі під час виконання:

```
/tool image_generate action=list
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
Промпт для генерування зображення. Обов’язковий для `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Використовуйте `"list"`, щоб переглянути доступні провайдери й моделі під час виконання.
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
Підказка формату виходу, якщо провайдер її підтримує.
</ParamField>

<ParamField path="count" type="number">
Кількість зображень для генерування (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Необов’язковий тайм-аут запиту провайдера в мілісекундах.
</ParamField>

<ParamField path="filename" type="string">
Підказка імені вихідного файлу.
</ParamField>

<ParamField path="openai" type="object">
Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>

Не всі провайдери підтримують усі параметри. Коли резервний провайдер підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед відправленням переналаштовує запит до найближчого підтримуваного розміру, співвідношення сторін або роздільної здатності. Непідтримувані підказки виходу, такі як `quality` або `outputFormat`, відкидаються для провайдерів, які не заявляють такої підтримки, і зазначаються в результаті інструмента.

Результати інструмента показують застосовані налаштування. Коли OpenClaw переналаштовує геометрію під час резервного переходу між провайдерами, повернуті значення `size`, `aspectRatio` і `resolution` відображають те, що було фактично надіслано, а `details.normalization` фіксує перетворення від запитаного до застосованого.

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

### Порядок вибору провайдера

Під час генерування зображення OpenClaw пробує провайдерів у такому порядку:

1. **Параметр `model`** з виклику інструмента (якщо агент його вказує)
2. **`imageGenerationModel.primary`** з конфігурації
3. **`imageGenerationModel.fallbacks`** у заданому порядку
4. **Автовизначення** — використовує лише типові значення провайдерів, підкріплені автентифікацією:
   - спочатку поточний типовий провайдер
   - потім решта зареєстрованих провайдерів генерування зображень у порядку provider-id

Якщо провайдер не спрацьовує (помилка автентифікації, обмеження швидкості тощо), автоматично пробується наступний налаштований кандидат. Якщо не спрацьовують усі, помилка містить деталі кожної спроби.

Примітки:

- Перевизначення `model` для окремого виклику є точним: OpenClaw пробує лише цю пару провайдер/модель
  і не переходить далі до налаштованих primary/fallback або автовизначених
  провайдерів.
- Автовизначення враховує автентифікацію. Типове значення провайдера потрапляє до списку кандидатів
  лише тоді, коли OpenClaw справді може автентифікувати цей провайдер.
- Автовизначення типово ввімкнене. Установіть
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень
  використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Установіть `agents.defaults.imageGenerationModel.timeoutMs` для повільних бекендів зображень.
  Параметр інструмента `timeoutMs` для окремого виклику перевизначає налаштоване типове значення.
- Використовуйте `action: "list"`, щоб переглянути наразі зареєстрованих провайдерів, їхні
  типові моделі та підказки щодо env var для автентифікації.

### Редагування зображень

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування еталонних зображень. Передайте шлях або URL еталонного зображення:

```
"Згенеруй акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 еталонних зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### Моделі зображень OpenRouter

Генерування зображень OpenRouter використовує той самий `OPENROUTER_API_KEY` і маршрутизується через image API chat completions OpenRouter. Вибирайте моделі зображень OpenRouter з префіксом `openrouter/`:

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

OpenClaw передає до OpenRouter `prompt`, `count`, еталонні зображення та сумісні з Gemini підказки `aspectRatio` / `resolution`. Поточні вбудовані скорочення для моделей зображень OpenRouter включають `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`; використовуйте `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

### OpenAI `gpt-image-2`

Генерування зображень OpenAI типово використовує `openai/gpt-image-2`. Якщо
налаштовано OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий OAuth-профіль,
що й для чат-моделей за підпискою Codex, і надсилає запит на зображення
через бекенд Codex Responses. Застарілі base URL Codex, такі як
`https://chatgpt.com/backend-api`, канонікалізуються до
`https://chatgpt.com/backend-api/codex` для запитів на зображення. Для такого запиту він не
переходить мовчки до `OPENAI_API_KEY`. Щоб примусово використовувати прямий маршрут через OpenAI
Images API, явно налаштуйте `models.providers.openai` з API-ключем,
власним base URL або ендпоінтом Azure. Старішу модель
`openai/gpt-image-1` усе ще можна явно вибрати, але нові запити OpenAI на
генерування та редагування зображень повинні використовувати `gpt-image-2`.

`gpt-image-2` підтримує як генерацію з тексту в зображення, так і редагування за еталонним зображенням
через той самий інструмент `image_generate`. OpenClaw передає до OpenAI `prompt`,
`count`, `size`, `quality`, `outputFormat` і еталонні зображення.
OpenAI не отримує `aspectRatio` або `resolution` напряму; коли можливо,
OpenClaw відображає їх у підтримуваний `size`, інакше інструмент позначає їх як
проігноровані перевизначення.

Опції, специфічні для OpenAI, містяться в об’єкті `openai`:

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

`openai.background` приймає значення `transparent`, `opaque` або `auto`; прозорі
вихідні дані потребують `outputFormat` `png` або `webp`. `openai.outputCompression`
застосовується до виходів JPEG/WebP.

Згенерувати одне ландшафтне зображення 4K:

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

Щоб маршрутизувати генерування зображень OpenAI через розгортання Azure OpenAI замість
`api.openai.com`, дивіться [ендпоінти Azure OpenAI](/uk/providers/openai#azure-openai-endpoints)
у документації провайдера OpenAI.

Генерування зображень MiniMax доступне через обидва вбудовані шляхи автентифікації MiniMax:

- `minimax/image-01` для конфігурацій з API-ключем
- `minimax-portal/image-01` для конфігурацій з OAuth

## Можливості провайдерів

| Можливість            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерування           | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (виходи, визначені workflow)   | Так (1) | Так (до 4)           |
| Редагування/еталон    | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, еталон суб’єкта) | Так (1 зображення, залежно від workflow) | Ні      | Так (до 5 зображень) |
| Керування розміром    | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Співвідношення сторін | Ні                   | Так                  | Так (лише генерування) | Так                      | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні         | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований провайдер xAI використовує `/v1/images/generations` для запитів лише з промптом
і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Кількість: до 4
- Еталони: один `image` або до п’яти `images`
- Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільна здатність: `1K`, `2K`
- Виходи: повертаються як вкладення зображень, керовані OpenClaw

OpenClaw навмисно не відкриває нативні для xAI `quality`, `mask`, `user` або
додаткові співвідношення сторін, доступні лише нативно, доки ці елементи керування не з’являться у спільному
міжпровайдерному контракті `image_generate`.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального workflow ComfyUI і Comfy Cloud
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування зображень, відео, пошуку, виконання коду та TTS Grok
- [Довідник із конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і перемикання на резервні варіанти
