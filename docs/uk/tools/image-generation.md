---
read_when:
    - Генерація зображень через агента
    - Налаштування провайдерів і моделей для генерації зображень
    - Розуміння параметрів інструмента `image_generate`
summary: Генеруйте та редагуйте зображення за допомогою налаштованих провайдерів (OpenAI, OpenAI Codex OAuth, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-23T23:28:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81d06d2be0d347be2aec54b02037c85fa4dcf71ccbc3c1b5d0aacac0b58892da
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати й редагувати зображення за допомогою налаштованих провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний принаймні один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів свого агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Задайте API-ключ принаймні для одного провайдера (наприклад, `OPENAI_API_KEY` або `GEMINI_API_KEY`) або увійдіть через OpenAI Codex OAuth.
2. За потреби задайте бажану модель:

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

Codex OAuth використовує той самий ref моделі `openai/gpt-image-2`. Коли налаштовано OAuth-профіль `openai-codex`, OpenClaw спрямовує запити на зображення через цей самий OAuth-профіль замість того, щоб спочатку пробувати `OPENAI_API_KEY`. Явна власна конфігурація зображень `models.providers.openai`, наприклад API-ключ або custom/Azure base URL, знову перемикає маршрут на прямий OpenAI Images API.

3. Попросіть агента: _«Згенеруй зображення дружнього маскота-робота.»_

Агент автоматично викликає `image_generate`. Додавати інструмент до allow-list не потрібно — він увімкнений за замовчуванням, коли доступний провайдер.

## Підтримувані провайдери

| Провайдер | Модель за замовчуванням          | Підтримка редагування              | Автентифікація                                         |
| --------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI    | `gpt-image-2`                    | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth                |
| Google    | `gemini-3.1-flash-image-preview` | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                  |
| fal       | `fal-ai/flux/dev`                | Так                                | `FAL_KEY`                                              |
| MiniMax   | `image-01`                       | Так (reference зображення об’єкта) | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                       | Так (1 зображення, визначається workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари    |
| Vydra     | `grok-imagine`                   | Ні                                 | `VYDRA_API_KEY`                                        |
| xAI       | `grok-imagine-image`             | Так (до 5 зображень)               | `XAI_API_KEY`                                          |

Використовуйте `action: "list"`, щоб переглянути доступні провайдери та моделі під час виконання:

```
/tool image_generate action=list
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
Prompt генерації зображення. Обов’язковий для `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Використовуйте `"list"`, щоб переглянути доступні провайдери та моделі під час виконання.
</ParamField>

<ParamField path="model" type="string">
Перевизначення провайдера/моделі, наприклад `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Шлях або URL одного reference-зображення для режиму редагування.
</ParamField>

<ParamField path="images" type="string[]">
Кілька reference-зображень для режиму редагування (до 5).
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
Підказка якості, якщо провайдер це підтримує.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Підказка формату виводу, якщо провайдер це підтримує.
</ParamField>

<ParamField path="count" type="number">
Кількість зображень для генерації (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Необов’язковий тайм-аут запиту до провайдера в мілісекундах.
</ParamField>

<ParamField path="filename" type="string">
Підказка імені вихідного файлу.
</ParamField>

<ParamField path="openai" type="object">
Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>

Не всі провайдери підтримують усі параметри. Коли fallback-провайдер підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед надсиланням переналаштовує запит до найближчого підтримуваного розміру, співвідношення сторін або роздільної здатності. Непідтримувані підказки виводу, такі як `quality` або `outputFormat`, відкидаються для провайдерів, які не декларують підтримку, і зазначаються в результаті інструмента.

Результати інструмента повідомляють про застосовані налаштування. Коли OpenClaw переналаштовує геометрію під час fallback провайдера, повернуті значення `size`, `aspectRatio` і `resolution` відображають те, що фактично було надіслано, а `details.normalization` фіксує перетворення від запитаного до застосованого.

## Конфігурація

### Вибір моделі

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Порядок вибору провайдерів

Під час генерації зображення OpenClaw пробує провайдерів у такому порядку:

1. Параметр **`model`** з виклику інструмента (якщо агент його вказує)
2. **`imageGenerationModel.primary`** з конфігурації
3. **`imageGenerationModel.fallbacks`** у заданому порядку
4. **Автовиявлення** — використовуються лише типові значення провайдерів, підкріплені автентифікацією:
   - спочатку поточний типовий провайдер
   - далі решта зареєстрованих провайдерів генерації зображень у порядку provider-id

Якщо провайдер завершується помилкою (помилка автентифікації, rate limit тощо), автоматично пробується наступний кандидат. Якщо всі завершуються помилкою, помилка містить подробиці кожної спроби.

Примітки:

- Автовиявлення враховує стан автентифікації. Типовий провайдер потрапляє до списку кандидатів лише тоді, коли OpenClaw дійсно може автентифікувати цього провайдера.
- Автовиявлення увімкнене за замовчуванням. Установіть `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Використовуйте `action: "list"`, щоб переглянути поточно зареєстрованих провайдерів, їхні типові моделі та підказки щодо env vars для автентифікації.

### Редагування зображень

OpenAI, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування reference-зображень. Передайте шлях або URL reference-зображення:

```
"Згенеруй акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, Google і xAI підтримують до 5 reference-зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### OpenAI `gpt-image-2`

Генерація зображень OpenAI за замовчуванням використовує `openai/gpt-image-2`. Якщо налаштовано OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий OAuth-профіль, що й для моделей чату за підпискою Codex, і надсилає запит на зображення через бекенд Codex Responses; він не переходить непомітно на `OPENAI_API_KEY` для цього запиту. Щоб примусово використовувати прямий маршрут OpenAI Images API, явно налаштуйте `models.providers.openai` з API-ключем, custom base URL або Azure endpoint. Старішу модель `openai/gpt-image-1` усе ще можна явно вибрати, але для нових запитів генерації та редагування зображень OpenAI слід використовувати `gpt-image-2`.

`gpt-image-2` підтримує як генерацію зображень із тексту, так і редагування reference-зображень через той самий інструмент `image_generate`. OpenClaw передає до OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat` і reference-зображення. OpenAI не отримує `aspectRatio` або `resolution` безпосередньо; коли це можливо, OpenClaw перетворює їх у підтримуваний `size`, інакше інструмент повідомляє про них як про проігноровані перевизначення.

Параметри, специфічні для OpenAI, розміщені в об’єкті `openai`:

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

`openai.background` приймає значення `transparent`, `opaque` або `auto`; прозорий вивід вимагає `outputFormat` `png` або `webp`. `openai.outputCompression` застосовується до виводу JPEG/WebP.

Згенеруйте одне 4K-зображення в альбомній орієнтації:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Чистий редакційний постер для генерації зображень OpenClaw" size=3840x2160 count=1
```

Згенеруйте два квадратні зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Два візуальні напрями для іконки спокійного застосунку продуктивності" size=1024x1024 count=2
```

Відредагуйте одне локальне reference-зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Збережи об’єкт, заміни тло на яскраву студійну сцену" image=/path/to/reference.png size=1024x1536
```

Редагування з кількома reference-зображеннями:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Поєднай образ персонажа з першого зображення з кольоровою палітрою другого" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб спрямувати генерацію зображень OpenAI через розгортання Azure OpenAI замість `api.openai.com`, див. [endpoints Azure OpenAI](/uk/providers/openai#azure-openai-endpoints) у документації провайдера OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи автентифікації MiniMax:

- `minimax/image-01` для налаштувань з API-ключем
- `minimax-portal/image-01` для OAuth-налаштувань

## Можливості провайдерів

| Можливість            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерація             | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (виводи визначаються workflow) | Так (1) | Так (до 4)           |
| Редагування/reference | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, reference об’єкта) | Так (1 зображення, визначається workflow) | Ні      | Так (до 5 зображень) |
| Керування розміром    | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Співвідношення сторін | Ні                   | Так                  | Так (лише генерація) | Так                       | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні         | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований провайдер xAI використовує `/v1/images/generations` для запитів лише з prompt і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Кількість: до 4
- References: один `image` або до п’яти `images`
- Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільні здатності: `1K`, `2K`
- Вивід: повертається як вкладення зображень, якими керує OpenClaw

OpenClaw навмисно не відкриває нативні для xAI параметри `quality`, `mask`, `user` або додаткові нативні співвідношення сторін, доки ці елементи керування не з’являться в спільному міжпровайдерному контракті `image_generate`.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального ComfyUI і workflow Comfy Cloud
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, пошуку, виконання коду та TTS
- [Довідник з конфігурації](/uk/gateway/configuration-reference#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і failover
