---
read_when:
    - Генерування або редагування зображень через агента
    - Налаштування провайдерів і моделей для генерації зображень
    - Розуміння параметрів інструмента image_generate
sidebarTitle: Image generation
summary: Генеруйте та редагуйте зображення через image_generate у OpenAI, Google, fal, MiniMax, ComfyUI, OpenRouter, LiteLLM, xAI, Vydra
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-26T05:36:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати та редагувати зображення за допомогою налаштованих вами провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється, лише якщо доступний принаймні один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів вашого агента, налаштуйте `agents.defaults.imageGenerationModel`, встановіть API-ключ провайдера або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

<Steps>
  <Step title="Налаштуйте автентифікацію">
    Встановіть API-ключ принаймні для одного провайдера (наприклад, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) або увійдіть через OpenAI Codex OAuth.
  </Step>
  <Step title="Виберіть модель за замовчуванням (необов’язково)">
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

    Codex OAuth використовує те саме посилання на модель `openai/gpt-image-2`. Коли налаштовано OAuth-профіль `openai-codex`, OpenClaw спрямовує запити на зображення через цей OAuth-профіль замість того, щоб спочатку намагатися використати `OPENAI_API_KEY`. Явна конфігурація `models.providers.openai` (API-ключ, власний/Azure base URL) знову вмикає маршрут прямого OpenAI Images API.

  </Step>
  <Step title="Зверніться до агента">
    _"Згенеруй зображення дружнього робота-маскота."_

    Агент автоматично викликає `image_generate`. Дозвільний список інструментів не потрібен — інструмент увімкнено за замовчуванням, коли провайдер доступний.

  </Step>
</Steps>

<Warning>
Для сумісних з OpenAI LAN-ендпоінтів, таких як LocalAI, зберігайте власний `models.providers.openai.baseUrl` і явно вмикайте `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Приватні та внутрішні ендпоінти зображень за замовчуванням залишаються заблокованими.
</Warning>

## Поширені маршрути

| Ціль                                                 | Посилання на модель                               | Автентифікація                        |
| ---------------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Генерація зображень OpenAI з API-оплатою             | `openai/gpt-image-2`                              | `OPENAI_API_KEY`                      |
| Генерація зображень OpenAI з автентифікацією через підписку Codex | `openai/gpt-image-2`                              | OpenAI Codex OAuth                    |
| OpenAI PNG/WebP із прозорим фоном                    | `openai/gpt-image-1.5`                            | `OPENAI_API_KEY` або OpenAI Codex OAuth |
| Генерація зображень через OpenRouter                 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                  |
| Генерація зображень через LiteLLM                    | `litellm/gpt-image-2`                             | `LITELLM_API_KEY`                     |
| Генерація зображень Google Gemini                    | `google/gemini-3.1-flash-image-preview`           | `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Той самий інструмент `image_generate` обробляє як генерацію з тексту, так і редагування за опорним зображенням. Використовуйте `image` для одного опорного зображення або `images` для кількох опорних зображень. Підтримувані провайдером підказки для виводу, такі як `quality`, `outputFormat` і `background`, передаються далі, коли це доступно, і позначаються як проігноровані, якщо провайдер їх не підтримує. Вбудована підтримка прозорого фону є специфічною для OpenAI; інші провайдери все одно можуть зберігати PNG alpha, якщо їхній бекенд її повертає.

## Підтримувані провайдери

| Провайдер  | Модель за замовчуванням                | Підтримка редагування               | Автентифікація                                       |
| ---------- | -------------------------------------- | ---------------------------------- | ---------------------------------------------------- |
| ComfyUI    | `workflow`                             | Так (1 зображення, налаштовується workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари |
| fal        | `fal-ai/flux/dev`                      | Так                                | `FAL_KEY`                                            |
| Google     | `gemini-3.1-flash-image-preview`       | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                |
| LiteLLM    | `gpt-image-2`                          | Так (до 5 вхідних зображень)       | `LITELLM_API_KEY`                                    |
| MiniMax    | `image-01`                             | Так (опорне зображення об’єкта)    | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                          | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)      | `OPENROUTER_API_KEY`                                 |
| Vydra      | `grok-imagine`                         | Ні                                 | `VYDRA_API_KEY`                                      |
| xAI        | `grok-imagine-image`                   | Так (до 5 зображень)               | `XAI_API_KEY`                                        |

Використовуйте `action: "list"`, щоб переглянути доступні провайдери та моделі під час виконання:

```text
/tool image_generate action=list
```

## Можливості провайдерів

| Можливість           | ComfyUI              | fal               | Google         | MiniMax                 | OpenAI         | Vydra | xAI            |
| -------------------- | -------------------- | ----------------- | -------------- | ----------------------- | -------------- | ----- | -------------- |
| Генерація (макс. кількість) | Визначається workflow | 4                 | 4              | 9                       | 4              | 1     | 4              |
| Редагування / опорне зображення | 1 зображення (workflow) | 1 зображення     | До 5 зображень | 1 зображення (опорне зображення об’єкта) | До 5 зображень | —     | До 5 зображень |
| Керування розміром   | —                    | ✓                 | ✓              | —                       | До 4K          | —     | —              |
| Співвідношення сторін | —                   | ✓ (лише генерація) | ✓             | ✓                       | —              | —     | ✓              |
| Роздільна здатність (1K/2K/4K) | —            | ✓                 | ✓              | —                       | —              | —     | 1K, 2K         |

## Параметри інструмента

<ParamField path="prompt" type="string" required>
  Запит для генерації зображення. Обов’язковий для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Використовуйте `"list"`, щоб переглянути доступні провайдери та моделі під час виконання.
</ParamField>
<ParamField path="model" type="string">
  Перевизначення провайдера/моделі (наприклад, `openai/gpt-image-2`). Використовуйте `openai/gpt-image-1.5` для прозорих фонів в OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Шлях або URL одного опорного зображення для режиму редагування.
</ParamField>
<ParamField path="images" type="string[]">
  Кілька опорних зображень для режиму редагування (до 5 у провайдерів, які це підтримують).
</ParamField>
<ParamField path="size" type="string">
  Підказка щодо розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Співвідношення сторін: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Підказка щодо роздільної здатності.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Підказка щодо якості, якщо провайдер її підтримує.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Підказка щодо формату виводу, якщо провайдер її підтримує.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Підказка щодо фону, якщо провайдер її підтримує. Використовуйте `transparent` з `outputFormat: "png"` або `"webp"` для провайдерів, що підтримують прозорість.
</ParamField>
<ParamField path="count" type="number">Кількість зображень для генерації (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Необов’язковий таймаут запиту до провайдера в мілісекундах.</ParamField>
<ParamField path="filename" type="string">Підказка щодо імені вихідного файла.</ParamField>
<ParamField path="openai" type="object">
  Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. Коли резервний провайдер підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед відправленням зіставляє запитаний розмір, співвідношення сторін або роздільну здатність із найближчим підтримуваним варіантом. Непідтримувані підказки виводу відкидаються для провайдерів, які не оголошують їх підтримку, і відображаються в результаті інструмента. Результати інструмента повідомляють про застосовані параметри; `details.normalization` фіксує будь-яке перетворення із запитаного значення в застосоване.
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

### Порядок вибору провайдера

OpenClaw пробує провайдерів у такому порядку:

1. **Параметр `model`** із виклику інструмента (якщо агент його вказує).
2. **`imageGenerationModel.primary`** із конфігурації.
3. **`imageGenerationModel.fallbacks`** по порядку.
4. **Автовиявлення** — лише типові значення провайдерів, підкріплені автентифікацією:
   - спочатку поточний провайдер за замовчуванням;
   - далі решта зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.

Якщо провайдер завершується помилкою (помилка автентифікації, ліміт швидкості тощо), автоматично пробується наступний налаштований кандидат. Якщо помиляються всі, помилка містить подробиці кожної спроби.

<AccordionGroup>
  <Accordion title="Перевизначення моделі для окремого виклику є точним">
    Перевизначення `model` для окремого виклику пробує лише цей провайдер/цю модель і не переходить до налаштованих primary/fallback або автовиявлених провайдерів.
  </Accordion>
  <Accordion title="Автовиявлення враховує автентифікацію">
    Типове значення провайдера потрапляє до списку кандидатів, лише коли OpenClaw справді може автентифікувати цей провайдер. Установіть `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати лише явні записи `model`, `primary` і `fallbacks`.
  </Accordion>
  <Accordion title="Таймаути">
    Установіть `agents.defaults.imageGenerationModel.timeoutMs` для повільних бекендів зображень. Параметр інструмента `timeoutMs` для окремого виклику перевизначає налаштоване значення за замовчуванням.
  </Accordion>
  <Accordion title="Перегляд під час виконання">
    Використовуйте `action: "list"`, щоб переглянути поточно зареєстрованих провайдерів, їхні моделі за замовчуванням і підказки щодо змінних середовища для автентифікації.
  </Accordion>
</AccordionGroup>

### Редагування зображень

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування опорних зображень. Передайте шлях або URL опорного зображення:

```text
"Згенеруй акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 опорних зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

## Детальніше про провайдерів

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (і gpt-image-1.5)">
    Для генерації зображень OpenAI за замовчуванням використовується `openai/gpt-image-2`. Якщо налаштовано OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий OAuth-профіль, що й для чат-моделей підписки Codex, і надсилає запит на зображення через бекенд Codex Responses. Застарілі базові URL Codex, такі як `https://chatgpt.com/backend-api`, канонізуються до `https://chatgpt.com/backend-api/codex` для запитів на зображення. OpenClaw **не** виконує безшумного резервного переходу до `OPENAI_API_KEY` для цього запиту — щоб примусово використовувати прямий маршрут OpenAI Images API, явно налаштуйте `models.providers.openai` з API-ключем, власним base URL або ендпоінтом Azure.

    Моделі `openai/gpt-image-1.5`, `openai/gpt-image-1` і
    `openai/gpt-image-1-mini` також можна явно вибрати. Використовуйте
    `gpt-image-1.5` для PNG/WebP із прозорим фоном; поточний API
    `gpt-image-2` відхиляє `background: "transparent"`.

    `gpt-image-2` підтримує як генерацію зображень із тексту, так і
    редагування за опорним зображенням через той самий інструмент
    `image_generate`. OpenClaw передає до OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat`
    та опорні зображення. OpenAI **не** отримує
    `aspectRatio` або `resolution` безпосередньо; коли це можливо, OpenClaw зіставляє
    їх із підтримуваним `size`, інакше інструмент повідомляє про них як
    про проігноровані перевизначення.

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

    `openai.background` приймає `transparent`, `opaque` або `auto`;
    прозорий вивід потребує `outputFormat` `png` або `webp` і
    моделі зображень OpenAI з підтримкою прозорості. OpenClaw спрямовує типові
    запити `gpt-image-2` на прозорий фон до `gpt-image-1.5`.
    `openai.outputCompression` застосовується до виводу JPEG/WebP.

    Підказка верхнього рівня `background` не прив’язана до конкретного провайдера і наразі зіставляється
    з тим самим полем запиту OpenAI `background`, коли вибрано провайдера OpenAI.
    Провайдери, які не оголошують підтримку фону, повертають
    це значення в `ignoredOverrides` замість отримання непідтримуваного параметра.

    Щоб спрямувати генерацію зображень OpenAI через розгортання Azure OpenAI
    замість `api.openai.com`, див.
    [ендпоінти Azure OpenAI](/uk/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Моделі зображень OpenRouter">
    Генерація зображень OpenRouter використовує той самий `OPENROUTER_API_KEY` і
    спрямовується через image API chat completions від OpenRouter. Вибирайте
    моделі зображень OpenRouter із префіксом `openrouter/`:

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

    OpenClaw передає до OpenRouter `prompt`, `count`, опорні зображення та
    підказки `aspectRatio` / `resolution`, сумісні з Gemini.
    Поточні вбудовані скорочені позначення моделей зображень OpenRouter включають
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`. Використовуйте
    `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

  </Accordion>
  <Accordion title="Подвійна автентифікація MiniMax">
    Генерація зображень MiniMax доступна через обидва вбудовані шляхи
    автентифікації MiniMax:

    - `minimax/image-01` для налаштувань з API-ключем
    - `minimax-portal/image-01` для налаштувань OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Вбудований провайдер xAI використовує `/v1/images/generations` для запитів
    лише з prompt і `/v1/images/edits`, коли присутній `image` або `images`.

    - Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Кількість: до 4
    - Опорні зображення: один `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільні здатності: `1K`, `2K`
    - Вивід: повертається як вкладення зображень під керуванням OpenClaw

    OpenClaw навмисно не надає специфічні для xAI параметри `quality`, `mask`,
    `user` або додаткові співвідношення сторін, доступні лише в xAI, доки ці елементи керування не з’являться
    у спільному міжпровайдерному контракті `image_generate`.

  </Accordion>
</AccordionGroup>

## Приклади

<Tabs>
  <Tab title="Генерація (пейзаж 4K)">
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
  <Tab title="Редагування (одне опорне зображення)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Редагування (кілька опорних зображень)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Ті самі прапорці `--output-format` і `--background` також доступні в
`openclaw infer image edit`; `--openai-background` залишається
специфічним для OpenAI псевдонімом. Вбудовані провайдери, окрім OpenAI, сьогодні не оголошують
явного керування фоном, тому `background: "transparent"` для них позначається
як проігнороване.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [ComfyUI](/uk/providers/comfy) — налаштування локального workflow ComfyUI і Comfy Cloud
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, пошуку, виконання коду та TTS
- [Довідник із конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і аварійне перемикання
