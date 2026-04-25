---
read_when:
    - Генерація зображень через агента
    - Налаштування провайдерів і моделей для генерації зображень
    - Розуміння параметрів інструмента `image_generate`
summary: Генеруйте та редагуйте зображення за допомогою налаштованих провайдерів (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, LiteLLM, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-25T18:33:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 787624476525ff5b8ed7d62a7cb0bac473cc9671136daf10f41d668ef2ddf3c5
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати та редагувати зображення за допомогою ваших налаштованих провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний щонайменше один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів вашого агента, налаштуйте `agents.defaults.imageGenerationModel`, укажіть API-ключ провайдера або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Установіть API-ключ принаймні для одного провайдера (наприклад, `OPENAI_API_KEY`, `GEMINI_API_KEY` або `OPENROUTER_API_KEY`) або увійдіть через OpenAI Codex OAuth.
2. За бажанням установіть бажану модель:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // Необов’язковий типовий тайм-аут запиту до провайдера для image_generate.
        timeoutMs: 180_000,
      },
    },
  },
}
```

Codex OAuth використовує те саме посилання на модель `openai/gpt-image-2`. Коли налаштовано OAuth-профіль `openai-codex`, OpenClaw спрямовує запити на зображення через цей самий OAuth-профіль, замість того щоб спочатку намагатися використати `OPENAI_API_KEY`. Явна власна конфігурація зображень `models.providers.openai`, наприклад API-ключ або користувацький/Azure base URL, знову перемикає на прямий маршрут OpenAI Images API. Для OpenAI-сумісних LAN-ендпойнтів, таких як LocalAI, зберігайте власний `models.providers.openai.baseUrl` і явно вмикайте це через `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; приватні/внутрішні ендпойнти зображень за замовчуванням залишаються заблокованими.

3. Попросіть агента: _"Згенеруй зображення дружнього робота-маскота."_

Агент автоматично викликає `image_generate`. Жодного списку дозволених інструментів не потрібно — він увімкнений за замовчуванням, коли доступний провайдер.

## Поширені маршрути

| Ціль                                                 | Посилання на модель                               | Автентифікація                        |
| ---------------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Генерація зображень OpenAI з оплатою через API       | `openai/gpt-image-2`                              | `OPENAI_API_KEY`                      |
| Генерація зображень OpenAI з автентифікацією за підпискою Codex | `openai/gpt-image-2`                    | OpenAI Codex OAuth                    |
| OpenAI PNG/WebP із прозорим тлом                     | `openai/gpt-image-1.5`                            | `OPENAI_API_KEY` або OpenAI Codex OAuth |
| Генерація зображень OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                |
| Генерація зображень LiteLLM                          | `litellm/gpt-image-2`                             | `LITELLM_API_KEY`                     |
| Генерація зображень Google Gemini                    | `google/gemini-3.1-flash-image-preview`           | `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Той самий інструмент `image_generate` обробляє як генерацію з тексту в зображення, так і редагування за еталонним зображенням. Використовуйте `image` для одного еталона або `images` для кількох еталонів. Підказки щодо виводу, які підтримує провайдер, як-от `quality`, `outputFormat` і специфічний для OpenAI параметр `background`, передаються далі, коли це можливо, а якщо провайдер їх не підтримує — позначаються як проігноровані.

## Підтримувані провайдери

| Провайдер | Типова модель                          | Підтримка редагування               | Автентифікація                                        |
| --------- | -------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| OpenAI    | `gpt-image-2`                          | Так (до 4 зображень)                | `OPENAI_API_KEY` або OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)      | `OPENROUTER_API_KEY`                                  |
| LiteLLM   | `gpt-image-2`                          | Так (до 5 вхідних зображень)        | `LITELLM_API_KEY`                                     |
| Google    | `gemini-3.1-flash-image-preview`       | Так                                 | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                 |
| fal       | `fal-ai/flux/dev`                      | Так                                 | `FAL_KEY`                                             |
| MiniMax   | `image-01`                             | Так (еталон об’єкта)                | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                             | Так (1 зображення, налаштоване у workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари |
| Vydra     | `grok-imagine`                         | Ні                                  | `VYDRA_API_KEY`                                       |
| xAI       | `grok-imagine-image`                   | Так (до 5 зображень)                | `XAI_API_KEY`                                         |

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
Перевизначення провайдера/моделі, наприклад `openai/gpt-image-2`; використовуйте `openai/gpt-image-1.5` для прозорого тла OpenAI.
</ParamField>

<ParamField path="image" type="string">
Шлях до одного еталонного зображення або URL для режиму редагування.
</ParamField>

<ParamField path="images" type="string[]">
Кілька еталонних зображень для режиму редагування (до 5).
</ParamField>

<ParamField path="size" type="string">
Підказка щодо розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Співвідношення сторін: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Підказка щодо роздільної здатності.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Підказка щодо якості, якщо провайдер її підтримує.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Підказка щодо формату виводу, якщо провайдер її підтримує.
</ParamField>

<ParamField path="count" type="number">
Кількість зображень для генерації (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Необов’язковий тайм-аут запиту до провайдера в мілісекундах.
</ParamField>

<ParamField path="filename" type="string">
Підказка щодо імені вихідного файла.
</ParamField>

<ParamField path="openai" type="object">
Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>

Не всі провайдери підтримують усі параметри. Коли резервний провайдер підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед відправленням зіставляє його з найближчим підтримуваним `size`, `aspectRatio` або `resolution`. Непідтримувані підказки виводу, як-от `quality` або `outputFormat`, відкидаються для провайдерів, які не декларують їх підтримку, і відображаються в результаті інструмента.

Результати інструмента показують застосовані налаштування. Коли OpenClaw змінює геометрію під час резервного переходу між провайдерами, повернуті значення `size`, `aspectRatio` і `resolution` відображають те, що було фактично надіслано, а `details.normalization` фіксує перетворення від запитаного до застосованого.

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

Під час генерації зображення OpenClaw пробує провайдерів у такому порядку:

1. **Параметр `model`** з виклику інструмента (якщо агент його вказує)
2. **`imageGenerationModel.primary`** з конфігурації
3. **`imageGenerationModel.fallbacks`** у заданому порядку
4. **Автовизначення** — використовує лише типові значення провайдерів, підкріплені автентифікацією:
   - спочатку поточний типовий провайдер
   - далі решта зареєстрованих провайдерів генерації зображень у порядку `provider-id`

Якщо провайдер завершується помилкою (помилка автентифікації, обмеження швидкості тощо), автоматично пробується наступний налаштований кандидат. Якщо всі завершаться помилкою, помилка міститиме подробиці кожної спроби.

Примітки:

- Перевизначення `model` для окремого виклику є точним: OpenClaw пробує лише цього провайдера/цю модель і не переходить далі до налаштованого primary/fallback або автовизначених провайдерів.
- Автовизначення враховує автентифікацію. Типовий провайдер потрапляє до списку кандидатів лише тоді, коли OpenClaw справді може автентифікуватися в цього провайдера.
- Автовизначення ввімкнено за замовчуванням. Установіть `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Установіть `agents.defaults.imageGenerationModel.timeoutMs` для повільних бекендів зображень.
  Параметр інструмента `timeoutMs` для окремого виклику перевизначає налаштоване значення за замовчуванням.
- Використовуйте `action: "list"`, щоб переглянути поточно зареєстрованих провайдерів, їхні типові моделі та підказки щодо env-змінних для автентифікації.

### Редагування зображень

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування еталонних зображень. Передайте шлях до еталонного зображення або URL:

```
"Згенеруй акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 еталонних зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

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

OpenClaw передає до OpenRouter `prompt`, `count`, еталонні зображення та сумісні з Gemini підказки `aspectRatio` / `resolution`. Поточні вбудовані скорочення для моделей зображень OpenRouter включають `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`; використовуйте `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

### OpenAI `gpt-image-2`

Генерація зображень OpenAI за замовчуванням використовує `openai/gpt-image-2`. Якщо налаштовано OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий OAuth-профіль, який застосовується моделями чату за підпискою Codex, і надсилає запит на зображення через бекенд Codex Responses. Застарілі базові URL Codex, як-от `https://chatgpt.com/backend-api`, канонізуються до `https://chatgpt.com/backend-api/codex` для запитів на зображення. Для такого запиту немає безшумного резервного переходу на `OPENAI_API_KEY`. Щоб примусово використовувати пряме маршрутизування через OpenAI Images API, явно налаштуйте `models.providers.openai` з API-ключем, власним base URL або ендпойнтом Azure. Моделі `openai/gpt-image-1.5`, `openai/gpt-image-1` і `openai/gpt-image-1-mini` усе ще можна явно вибрати. Використовуйте `gpt-image-1.5` для виводу PNG/WebP із прозорим тлом; поточний API `gpt-image-2` відхиляє `background: "transparent"`.

`gpt-image-2` підтримує як генерацію з тексту в зображення, так і редагування за еталонним зображенням через той самий інструмент `image_generate`. OpenClaw передає до OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat` і еталонні зображення. OpenAI не отримує `aspectRatio` або `resolution` напряму; коли можливо, OpenClaw зіставляє їх із підтримуваним `size`, інакше інструмент повідомляє про них як про проігноровані перевизначення.

Специфічні для OpenAI параметри розташовані в об’єкті `openai`:

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

`openai.background` приймає значення `transparent`, `opaque` або `auto`; для прозорого виводу потрібні `outputFormat` `png` або `webp` і модель зображень OpenAI з підтримкою прозорості. OpenClaw спрямовує запити на прозоре тло для типового `gpt-image-2` до `gpt-image-1.5`. `openai.outputCompression` застосовується до виводу JPEG/WebP.

Коли ви просите агента створити зображення OpenAI з прозорим тлом, очікуваний виклик інструмента має такий вигляд:

```json
{
  "model": "openai/gpt-image-1.5",
  "prompt": "Проста червона кругла наліпка на прозорому тлі",
  "outputFormat": "png",
  "openai": {
    "background": "transparent"
  }
}
```

Явна модель `openai/gpt-image-1.5` зберігає переносимість запиту між зведеннями інструментів і harnesses. Якщо агент натомість використовує типовий `openai/gpt-image-2` з `openai.background: "transparent"` у публічному маршруті OpenAI або OpenAI Codex OAuth, OpenClaw переписує запит до провайдера на `gpt-image-1.5`. Azure та користувацькі OpenAI-сумісні ендпойнти зберігають свої налаштовані назви deployment/model.

Згенерувати одне ландшафтне зображення 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Чистий редакційний постер для генерації зображень OpenClaw" size=3840x2160 count=1
```

Згенерувати прозорий PNG:

```
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="Проста червона кругла наліпка на прозорому тлі" outputFormat=png openai='{"background":"transparent"}'
```

Згенерувати два квадратні зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Два візуальні напрями для іконки спокійного застосунку продуктивності" size=1024x1024 count=2
```

Відредагувати одне локальне еталонне зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Зберегти об’єкт, замінити тло на яскраву студійну постановку" image=/path/to/reference.png size=1024x1536
```

Редагування з кількома еталонами:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Поєднати ідентичність персонажа з першого зображення з палітрою кольорів із другого" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб спрямувати генерацію зображень OpenAI через deployment Azure OpenAI замість `api.openai.com`, див. [ендпойнти Azure OpenAI](/uk/providers/openai#azure-openai-endpoints) у документації провайдера OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи автентифікації MiniMax:

- `minimax/image-01` для конфігурацій з API-ключем
- `minimax-portal/image-01` для конфігурацій з OAuth

## Можливості провайдерів

| Можливість           | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерація            | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (виводи, визначені workflow)   | Так (1) | Так (до 4)           |
| Редагування/еталон   | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, еталон об’єкта) | Так (1 зображення, налаштоване у workflow) | Ні | Так (до 5 зображень) |
| Керування розміром   | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Співвідношення сторін | Ні                  | Так                  | Так (лише генерація) | Так                       | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні         | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований провайдер xAI використовує `/v1/images/generations` для запитів лише з prompt і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Кількість: до 4
- Еталони: один `image` або до п’яти `images`
- Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільні здатності: `1K`, `2K`
- Вивід: повертається як вкладення зображень, керовані OpenClaw

OpenClaw навмисно не відкриває специфічні для xAI параметри `quality`, `mask`, `user` або додаткові власні співвідношення сторін, доки ці елементи керування не з’являться у спільному міжпровайдерному контракті `image_generate`.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального ComfyUI та Comfy Cloud workflow
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, пошуку, виконання коду та TTS
- [Довідник з конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і перемикання на резервний варіант
