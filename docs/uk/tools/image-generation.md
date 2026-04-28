---
read_when:
    - Генерування або редагування зображень через агента
    - Налаштування провайдерів і моделей для генерації зображень
    - Розуміння параметрів інструмента image_generate
sidebarTitle: Image generation
summary: Генеруйте та редагуйте зображення через image_generate у OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-28T00:36:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати та редагувати зображення за допомогою
налаштованих провайдерів. Згенеровані зображення автоматично доставляються як
медіавкладення у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний принаймні один провайдер
генерації зображень. Якщо ви не бачите `image_generate` серед інструментів
вашого агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера
або увійдіть за допомогою OpenAI Codex OAuth.
</Note>

## Швидкий старт

<Steps>
  <Step title="Налаштуйте auth">
    Задайте API-ключ принаймні для одного провайдера (наприклад `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) або увійдіть за допомогою OpenAI Codex OAuth.
  </Step>
  <Step title="Виберіть типову модель (необов’язково)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth використовує те саме посилання на модель `openai/gpt-image-2`. Коли
    налаштовано профіль OAuth `openai-codex`, OpenClaw маршрутизує запити
    на зображення через цей профіль OAuth замість того, щоб спочатку пробувати
    `OPENAI_API_KEY`. Явна конфігурація `models.providers.openai` (API-ключ,
    власний/Azure base URL) знову перемикає на прямий маршрут OpenAI Images API.

  </Step>
  <Step title="Попросіть агента">
    _"Згенеруй зображення дружнього робота-маскота."_

    Агент автоматично викликає `image_generate`. Жодного allow-listing інструментів
    не потрібно — його ввімкнено типово, коли доступний провайдер.

  </Step>
</Steps>

<Warning>
Для сумісних з OpenAI LAN-ендпойнтів, таких як LocalAI, зберігайте власний
`models.providers.openai.baseUrl` і явно вмикайте його через
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Приватні та
внутрішні ендпойнти зображень типово залишаються заблокованими.
</Warning>

## Типові маршрути

| Ціль                                                 | Посилання на модель                                 | Auth                                   |
| ---------------------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| Генерація зображень OpenAI з оплатою через API       | `openai/gpt-image-2`                                | `OPENAI_API_KEY`                       |
| Генерація зображень OpenAI з auth через підписку Codex | `openai/gpt-image-2`                              | OpenAI Codex OAuth                     |
| OpenAI PNG/WebP з прозорим фоном                     | `openai/gpt-image-1.5`                              | `OPENAI_API_KEY` або OpenAI Codex OAuth |
| Генерація зображень DeepInfra                        | `deepinfra/black-forest-labs/FLUX-1-schnell`        | `DEEPINFRA_API_KEY`                    |
| Генерація зображень OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview`  | `OPENROUTER_API_KEY`                   |
| Генерація зображень LiteLLM                          | `litellm/gpt-image-2`                               | `LITELLM_API_KEY`                      |
| Генерація зображень Google Gemini                    | `google/gemini-3.1-flash-image-preview`             | `GEMINI_API_KEY` або `GOOGLE_API_KEY`  |

Той самий інструмент `image_generate` обробляє як генерацію за текстом, так і
редагування за референсним зображенням. Використовуйте `image` для одного референсу
або `images` для кількох референсів.
Підказки щодо виводу, які підтримує провайдер, як-от `quality`, `outputFormat` і
`background`, пересилаються, коли це можливо, і позначаються як проігноровані,
коли провайдер їх не підтримує. Вбудована підтримка прозорого фону
є специфічною для OpenAI; інші провайдери все ж можуть зберігати PNG alpha, якщо
їхній backend це видає.

## Підтримувані провайдери

| Провайдер  | Типова модель                          | Підтримка редагування              | Auth                                                  |
| ---------- | -------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                             | Так (1 зображення, налаштовується workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари   |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`     | Так (1 зображення)                 | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                      | Так                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`       | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                 |
| LiteLLM    | `gpt-image-2`                          | Так (до 5 вхідних зображень)       | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                             | Так (референс об’єкта)             | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                          | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview`| Так (до 5 вхідних зображень)       | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                         | Ні                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                   | Так (до 5 зображень)               | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб переглянути доступні провайдери та моделі під час runtime:

```text
/tool image_generate action=list
```

## Можливості провайдерів

| Можливість           | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| -------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Генерація (макс. кількість) | Визначається workflow | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Редагування / референс | 1 зображення (workflow) | 1 зображення | 1 зображення    | До 5 зображень | 1 зображення (референс об’єкта) | До 5 зображень | —     | До 5 зображень |
| Керування розміром   | —                  | ✓         | ✓                 | ✓              | —                     | До 4K          | —     | —              |
| Співвідношення сторін | —                 | —         | ✓ (лише генерація) | ✓             | ✓                     | —              | —     | ✓              |
| Роздільність (1K/2K/4K) | —               | —         | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Параметри інструмента

<ParamField path="prompt" type="string" required>
  Prompt для генерації зображення. Обов’язковий для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Використовуйте `"list"`, щоб переглянути доступні провайдери та моделі під час runtime.
</ParamField>
<ParamField path="model" type="string">
  Перевизначення провайдера/моделі (наприклад `openai/gpt-image-2`). Використовуйте
  `openai/gpt-image-1.5` для прозорих фонів в OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Шлях або URL одного референсного зображення для режиму редагування.
</ParamField>
<ParamField path="images" type="string[]">
  Кілька референсних зображень для режиму редагування (до 5 у провайдерів, які це підтримують).
</ParamField>
<ParamField path="size" type="string">
  Підказка щодо розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Співвідношення сторін: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Підказка щодо роздільності.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Підказка щодо якості, якщо провайдер це підтримує.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Підказка щодо формату виводу, якщо провайдер це підтримує.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Підказка щодо фону, якщо провайдер це підтримує. Використовуйте `transparent` з
  `outputFormat: "png"` або `"webp"` для провайдерів, які підтримують прозорість.
</ParamField>
<ParamField path="count" type="number">Кількість зображень для генерації (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Необов’язковий тайм-аут запиту до провайдера в мілісекундах.</ParamField>
<ParamField path="filename" type="string">Підказка щодо імені вихідного файла.</ParamField>
<ParamField path="openai" type="object">
  Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. Коли резервний провайдер підтримує
близький варіант геометрії замість точно запитаного, OpenClaw зіставляє його
з найближчим підтримуваним розміром, співвідношенням сторін або роздільністю перед відправленням.
Непідтримувані підказки виводу відкидаються для провайдерів, які не заявляють
про їх підтримку, і відображаються в результаті інструмента. Результати інструмента показують
застосовані налаштування; `details.normalization` фіксує будь-яке
перетворення від запитаного до застосованого.
</Note>

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

OpenClaw пробує провайдерів у такому порядку:

1. **Параметр `model`** з виклику інструмента (якщо агент його вказує).
2. **`imageGenerationModel.primary`** з конфігурації.
3. **`imageGenerationModel.fallbacks`** у заданому порядку.
4. **Автовиявлення** — лише типові провайдери з auth:
   - спочатку поточний типовий провайдер;
   - потім решта зареєстрованих провайдерів генерації зображень у порядку provider-id.

Якщо провайдер завершується помилкою (помилка auth, обмеження швидкості тощо), автоматично
пробується наступний налаштований кандидат. Якщо всі завершуються помилкою, повідомлення про помилку містить
деталі кожної спроби.

<AccordionGroup>
  <Accordion title="Перевизначення моделей для окремого виклику є точними">
    Перевизначення `model` для окремого виклику пробує лише цей провайдер/модель і
    не продовжує до налаштованих primary/fallback або автовиявлених провайдерів.
  </Accordion>
  <Accordion title="Автовиявлення враховує auth">
    Типовий провайдер потрапляє до списку кандидатів лише тоді, коли OpenClaw
    справді може автентифікуватися в цього провайдера. Встановіть
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати лише
    явні записи `model`, `primary` і `fallbacks`.
  </Accordion>
  <Accordion title="Тайм-аути">
    Установіть `agents.defaults.imageGenerationModel.timeoutMs` для повільних
    backend генерації зображень. Параметр інструмента `timeoutMs` для окремого виклику перевизначає
    налаштоване типове значення.
  </Accordion>
  <Accordion title="Перегляд під час runtime">
    Використовуйте `action: "list"`, щоб переглянути поточно зареєстрованих провайдерів,
    їхні типові моделі та підказки щодо auth env var.
  </Accordion>
</AccordionGroup>

### Редагування зображень

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI і xAI підтримують редагування
референсних зображень. Передайте шлях або URL референсного зображення:

```text
"Згенеруй акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 референсних зображень через
параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

## Детальний розбір провайдерів

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (і gpt-image-1.5)">
    Генерація зображень OpenAI типово використовує `openai/gpt-image-2`. Якщо
    налаштовано профіль OAuth `openai-codex`, OpenClaw повторно використовує той самий
    профіль OAuth, який Codex використовує для моделей чату з підпискою, і надсилає
    запит на зображення через backend Codex Responses. Застарілі базові URL Codex,
    такі як `https://chatgpt.com/backend-api`, канонізуються до
    `https://chatgpt.com/backend-api/codex` для запитів на зображення. OpenClaw
    **не** виконує тихе резервне перемикання на `OPENAI_API_KEY` для такого запиту —
    щоб примусово використовувати прямий маршрут OpenAI Images API, налаштуйте
    `models.providers.openai` явно, вказавши API-ключ, власний base URL
    або ендпойнт Azure.

    Моделі `openai/gpt-image-1.5`, `openai/gpt-image-1` і
    `openai/gpt-image-1-mini` усе ще можна вибрати явно. Використовуйте
    `gpt-image-1.5` для виводу PNG/WebP із прозорим фоном; поточний API
    `gpt-image-2` відхиляє `background: "transparent"`.

    `gpt-image-2` підтримує як генерацію зображення за текстом, так і
    редагування за референсним зображенням через той самий інструмент `image_generate`.
    OpenClaw пересилає в OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat`
    і референсні зображення. OpenAI **не** отримує
    `aspectRatio` або `resolution` напряму; коли це можливо, OpenClaw зіставляє
    їх із підтримуваним `size`, інакше інструмент повідомляє про них як про
    проігноровані перевизначення.

    Специфічні для OpenAI параметри містяться в об’єкті `openai`:

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

    `openai.background` приймає `transparent`, `opaque` або `auto`;
    прозорий вивід потребує `outputFormat` зі значенням `png` або `webp` і
    модель зображень OpenAI, яка підтримує прозорість. OpenClaw маршрутизує типові
    запити `gpt-image-2` із прозорим фоном на `gpt-image-1.5`.
    `openai.outputCompression` застосовується до виводу JPEG/WebP.

    Підказка верхнього рівня `background` не залежить від провайдера й наразі зіставляється
    з тим самим полем запиту OpenAI `background`, коли вибрано провайдера OpenAI.
    Провайдери, які не заявляють підтримку фону, повертають
    його в `ignoredOverrides` замість отримання непідтримуваного параметра.

    Щоб маршрутизувати генерацію зображень OpenAI через розгортання Azure OpenAI
    замість `api.openai.com`, див.
    [ендпойнти Azure OpenAI](/uk/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Моделі зображень OpenRouter">
    Генерація зображень OpenRouter використовує той самий `OPENROUTER_API_KEY` і
    маршрутизується через image API chat completions від OpenRouter. Вибирайте
    моделі зображень OpenRouter з префіксом `openrouter/`:

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

    OpenClaw пересилає в OpenRouter `prompt`, `count`, референсні зображення та
    сумісні з Gemini підказки `aspectRatio` / `resolution`.
    Поточні вбудовані скорочення для моделей зображень OpenRouter включають
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`. Використовуйте
    `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

  </Accordion>
  <Accordion title="Подвійний auth MiniMax">
    Генерація зображень MiniMax доступна через обидва вбудовані шляхи
    auth MiniMax:

    - `minimax/image-01` для налаштувань з API-ключем
    - `minimax-portal/image-01` для налаштувань OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Вбудований провайдер xAI використовує `/v1/images/generations` для запитів
    лише з prompt і `/v1/images/edits`, коли присутній `image` або `images`.

    - Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Кількість: до 4
    - Референси: один `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільності: `1K`, `2K`
    - Вивід: повертається як керовані OpenClaw вкладення зображень

    OpenClaw навмисно не надає нативні для xAI `quality`, `mask`,
    `user` або додаткові співвідношення сторін, доступні лише нативно, доки ці
    елементи керування не з’являться у спільному міжпровайдерному контракті `image_generate`.

  </Accordion>
</AccordionGroup>

## Приклади

<Tabs>
  <Tab title="Генерація (4K альбомний формат)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Генерація (прозорий PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Еквівалентний CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Генерація (два квадратні)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Редагування (один референс)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Редагування (кілька референсів)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Ті самі прапорці `--output-format` і `--background` доступні в
`openclaw infer image edit`; `--openai-background` залишається
специфічним для OpenAI псевдонімом. Вбудовані провайдери, крім OpenAI, наразі не
заявляють явного керування фоном, тому для них `background: "transparent"` позначається
як проігнороване.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [ComfyUI](/uk/providers/comfy) — налаштування локального workflow ComfyUI та Comfy Cloud
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, пошуку, виконання коду та TTS
- [Довідник із конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і failover
