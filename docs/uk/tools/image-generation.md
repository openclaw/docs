---
read_when:
    - Генерація зображень через агента
    - Налаштування providers і моделей для генерації зображень
    - Розуміння параметрів інструмента image_generate
summary: Генерувати та редагувати зображення за допомогою налаштованих providers (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-23T21:15:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ca23553fa80fbc286046baa2bdb639aab76a24f2d55dc1764085f57b24be29e
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати й редагувати зображення за допомогою ваших налаштованих providers. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний принаймні один provider генерації зображень. Якщо ви не бачите `image_generate` серед інструментів агента, налаштуйте `agents.defaults.imageGenerationModel` або задайте API-ключ provider.
</Note>

## Швидкий старт

1. Задайте API-ключ принаймні для одного provider (наприклад, `OPENAI_API_KEY` або `GEMINI_API_KEY`).
2. За бажанням задайте бажану модель:

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

3. Попросіть агента: _"Generate an image of a friendly lobster mascot."_

Агент автоматично викличе `image_generate`. Додавання в allow-list інструментів не потрібне — він типово ввімкнений, коли доступний provider.

## Підтримувані providers

| Provider     | Типова модель                   | Підтримка редагування            | API-ключ                                              |
| ------------ | ------------------------------- | -------------------------------- | ----------------------------------------------------- |
| OpenAI       | `gpt-image-2`                   | Так (до 4 зображень)             | `OPENAI_API_KEY`                                      |
| OpenAI Codex | `gpt-image-2`                   | Так (до 4 зображень)             | OpenAI Codex OAuth                                    |
| Google       | `gemini-3.1-flash-image-preview` | Так                             | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                 |
| fal          | `fal-ai/flux/dev`               | Так                              | `FAL_KEY`                                             |
| MiniMax      | `image-01`                      | Так (посилання на subject)       | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI      | `workflow`                      | Так (1 зображення, залежить від workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для cloud |
| Vydra        | `grok-imagine`                  | Ні                               | `VYDRA_API_KEY`                                       |
| xAI          | `grok-imagine-image`            | Так (до 5 зображень)             | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб переглянути доступні providers і моделі під час виконання:

```
/tool image_generate action=list
```

## Параметри інструмента

| Параметр      | Тип       | Опис                                                                                  |
| ------------- | --------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string    | Prompt для генерації зображення (обов’язковий для `action: "generate"`)               |
| `action`      | string    | `"generate"` (типово) або `"list"` для перегляду providers                            |
| `model`       | string    | Перевизначення provider/model, наприклад `openai/gpt-image-2`                         |
| `image`       | string    | Шлях або URL одного опорного зображення для режиму редагування                        |
| `images`      | string[]  | Кілька опорних зображень для режиму редагування (до 5)                                |
| `size`        | string    | Підказка розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`     |
| `aspectRatio` | string    | Співвідношення сторін: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string    | Підказка роздільної здатності: `1K`, `2K` або `4K`                                    |
| `count`       | number    | Кількість зображень для генерації (1–4)                                               |
| `filename`    | string    | Підказка для імені вихідного файла                                                    |

Не всі providers підтримують усі параметри. Коли fallback-provider підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед надсиланням переналаштовує на найближчий підтримуваний `size`, `aspectRatio` або `resolution`. Справді непідтримувані перевизначення все одно повідомляються в результаті інструмента.

Результати інструмента повідомляють застосовані налаштування. Коли OpenClaw переналаштовує геометрію під час fallback provider, повернуті значення `size`, `aspectRatio` і `resolution` відображають те, що фактично було надіслано, а `details.normalization` фіксує перетворення від запитаного до застосованого.

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

### Порядок вибору provider

Під час генерації зображення OpenClaw пробує providers у такому порядку:

1. **Параметр `model`** з виклику інструмента (якщо агент його вказує)
2. **`imageGenerationModel.primary`** з config
3. **`imageGenerationModel.fallbacks`** у вказаному порядку
4. **Автовизначення** — використовує лише типові значення providers, підкріплені auth:
   - спочатку поточний типовий provider
   - далі решта зареєстрованих providers генерації зображень у порядку provider-id

Якщо provider не спрацьовує (помилка auth, rate limit тощо), автоматично пробується наступний кандидат. Якщо не спрацювали всі, помилка містить подробиці кожної спроби.

Примітки:

- Автовизначення враховує auth. Типове значення provider потрапляє до списку кандидатів
  лише тоді, коли OpenClaw справді може автентифікувати цей provider.
- Автовизначення типово ввімкнено. Установіть
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Використовуйте `action: "list"`, щоб переглянути поточно зареєстрованих providers,
  їхні типові моделі та підказки щодо auth env-var.

### Редагування зображень

OpenAI, Google, fal, MiniMax, ComfyUI та xAI підтримують редагування опорних зображень. Передайте шлях або URL опорного зображення:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, Google та xAI підтримують до 5 опорних зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### OpenAI `gpt-image-2`

Генерація зображень OpenAI типово використовує `openai/gpt-image-2`. Старішу
модель `openai/gpt-image-1` усе ще можна вибрати явно, але для нових запитів на генерацію зображень і редагування зображень через OpenAI слід використовувати `gpt-image-2`.

`gpt-image-2` підтримує як генерацію text-to-image, так і редагування опорних зображень через той самий інструмент `image_generate`. OpenClaw передає в OpenAI `prompt`,
`count`, `size` і опорні зображення. OpenAI не отримує
`aspectRatio` або `resolution` напряму; коли можливо, OpenClaw відображає їх у
підтримуваний `size`, інакше інструмент повідомляє про них як про проігноровані перевизначення.

Згенерувати одне landscape-зображення 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Згенерувати два квадратні зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Відредагувати одне локальне опорне зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Редагування з кількома опорними зображеннями:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб маршрутизувати генерацію зображень OpenAI через розгортання Azure OpenAI замість
`api.openai.com`, див. [Azure OpenAI endpoints](/uk/providers/openai#azure-openai-endpoints)
у документації провайдера OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи auth MiniMax:

- `minimax/image-01` для налаштувань через API-ключ
- `minimax-portal/image-01` для налаштувань через OAuth

## Можливості providers

| Можливість           | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                              | Vydra   | xAI                  |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ------------------------------------ | ------- | -------------------- |
| Generate             | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (визначені workflow outputs)     | Так (1) | Так (до 4)           |
| Edit/reference       | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, subject ref) | Так (1 зображення, залежить від workflow) | Ні  | Так (до 5 зображень) |
| Керування size       | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                   | Ні      | Ні                   |
| Aspect ratio         | Ні                   | Так                  | Так (лише generate) | Так                        | Ні                                   | Ні      | Так                  |
| Resolution (1K/2K/4K) | Ні                  | Так                  | Так                 | Ні                         | Ні                                   | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований provider xAI використовує `/v1/images/generations` для запитів лише з prompt
і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Count: до 4
- Опорні зображення: один `image` або до п’яти `images`
- Aspect ratios: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resolutions: `1K`, `2K`
- Outputs: повертаються як керовані OpenClaw вкладення зображень

OpenClaw навмисно не надає xAI-нативні `quality`, `mask`, `user` або
додаткові native-only aspect ratios, доки ці елементи керування не з’являться в спільному
крос-провайдерному контракті `image_generate`.

## Пов’язане

- [Огляд Tools](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування provider зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального ComfyUI та Comfy Cloud workflow
- [Google (Gemini)](/uk/providers/google) — налаштування provider зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування provider зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування provider OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та speech у Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, search, виконання коду та TTS
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults) — config `imageGenerationModel`
- [Models](/uk/concepts/models) — конфігурація моделей і failover
