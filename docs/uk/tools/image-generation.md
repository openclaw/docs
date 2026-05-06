---
read_when:
    - Створення або редагування зображень через агента
    - Налаштування провайдерів і моделей генерації зображень
    - Розуміння параметрів інструмента image_generate
sidebarTitle: Image generation
summary: Генеруйте й редагуйте зображення через image_generate в OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Генерація зображень
x-i18n:
    generated_at: "2026-05-06T02:29:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8036e8846c38e9bfce4e618caac13fa35e89ae183f81e5a496a29feeb9656369
    source_path: tools/image-generation.md
    workflow: 16
---

Інструмент `image_generate` дає агенту змогу створювати та редагувати зображення за допомогою ваших
налаштованих провайдерів. Згенеровані зображення автоматично надсилаються як медіавкладення
у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний принаймні один провайдер генерації зображень.
Якщо ви не бачите `image_generate` серед інструментів свого агента,
налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера
або ввійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

<Steps>
  <Step title="Налаштуйте автентифікацію">
    Задайте API-ключ принаймні для одного провайдера (наприклад, `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) або ввійдіть через OpenAI Codex OAuth.
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

    Codex OAuth використовує те саме посилання на модель `openai/gpt-image-2`. Коли
    налаштовано OAuth-профіль `openai-codex`, OpenClaw спрямовує запити зображень
    через цей OAuth-профіль замість того, щоб спершу пробувати
    `OPENAI_API_KEY`. Явна конфігурація `models.providers.openai` (API-ключ,
    власна/Azure базова URL-адреса) знову вмикає прямий маршрут OpenAI Images API.

  </Step>
  <Step title="Попросіть агента">
    _"Згенеруй зображення дружнього робота-маскота."_

    Агент автоматично викликає `image_generate`. Список дозволених інструментів
    не потрібен - він увімкнений за замовчуванням, коли доступний провайдер.

  </Step>
</Steps>

<Warning>
Для OpenAI-сумісних кінцевих точок LAN, як-от LocalAI, збережіть власний
`models.providers.openai.baseUrl` і явно погодьтеся за допомогою
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Приватні та
внутрішні кінцеві точки зображень залишаються заблокованими за замовчуванням.
</Warning>

## Поширені маршрути

| Ціль                                                 | Посилання на модель                                          | Автентифікація                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Генерація зображень OpenAI з оплатою через API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Генерація зображень OpenAI з автентифікацією передплати Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI PNG/WebP із прозорим тлом               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` або OpenAI Codex OAuth |
| Генерація зображень DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Генерація зображень OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Генерація зображень LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Генерація зображень Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` або `GOOGLE_API_KEY`   |

Той самий інструмент `image_generate` обробляє перетворення тексту на зображення та редагування
за референсними зображеннями. Використовуйте `image` для одного референсу або `images` для кількох референсів.
Підказки виводу, які підтримує провайдер, як-от `quality`, `outputFormat` і
`background`, передаються, коли доступні, і повідомляються як проігноровані, коли
провайдер їх не підтримує. Вбудована підтримка прозорого тла
специфічна для OpenAI; інші провайдери все одно можуть зберігати альфа-канал PNG, якщо їхній
бекенд його видає.

## Підтримувані провайдери

| Провайдер   | Модель за замовчуванням                           | Підтримка редагування                       | Автентифікація                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Так (1 зображення, налаштовано робочим процесом) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари    |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Так (1 зображення)                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Так                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | Так (до 5 вхідних зображень)         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Так (референс об’єкта)            | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Ні                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Так (до 5 зображень)               | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб переглянути доступних провайдерів і моделі під час виконання:

```text
/tool image_generate action=list
```

## Можливості провайдерів

| Можливість            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Генерація (макс. кількість)  | Визначається робочим процесом   | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Редагування / референс      | 1 зображення (робочий процес) | 1 зображення   | 1 зображення           | До 5 зображень | 1 зображення (реф. об’єкта) | До 5 зображень | -     | До 5 зображень |
| Керування розміром          | -                  | ✓         | ✓                 | ✓              | -                     | До 4K       | -     | -              |
| Співвідношення сторін          | -                  | -         | ✓ (лише генерація) | ✓              | ✓                     | -              | -     | ✓              |
| Роздільна здатність (1K/2K/4K) | -                  | -         | ✓                 | ✓              | -                     | -              | -     | 1K, 2K         |

## Параметри інструмента

<ParamField path="prompt" type="string" required>
  Промпт для генерації зображення. Обов’язковий для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Використовуйте `"list"`, щоб переглянути доступних провайдерів і моделі під час виконання.
</ParamField>
<ParamField path="model" type="string">
  Перевизначення провайдера/моделі (наприклад, `openai/gpt-image-2`). Використовуйте
  `openai/gpt-image-1.5` для прозорих фонів OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Шлях або URL до одного референсного зображення для режиму редагування.
</ParamField>
<ParamField path="images" type="string[]">
  Кілька референсних зображень для режиму редагування (до 5 у провайдерів, що підтримують це).
</ParamField>
<ParamField path="size" type="string">
  Підказка розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Співвідношення сторін: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Підказка роздільної здатності.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Підказка якості, коли провайдер її підтримує.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Підказка формату виводу, коли провайдер її підтримує.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Підказка тла, коли провайдер її підтримує. Використовуйте `transparent` з
  `outputFormat: "png"` або `"webp"` для провайдерів, що підтримують прозорість.
</ParamField>
<ParamField path="count" type="number">Кількість зображень для генерації (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">Необов’язковий тайм-аут запиту до провайдера в мілісекундах.</ParamField>
<ParamField path="filename" type="string">Підказка імені вихідного файлу.</ParamField>
<ParamField path="openai" type="object">
  Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. Коли резервний провайдер підтримує
близький варіант геометрії замість точно запитаного, OpenClaw перед поданням
зіставляє його з найближчим підтримуваним розміром, співвідношенням сторін або роздільною здатністю.
Непідтримувані підказки виводу відкидаються для провайдерів, які не оголошують
підтримку, і повідомляються в результаті інструмента. Результати інструмента повідомляють застосовані
налаштування; `details.normalization` фіксує будь-яке перетворення
із запитаного в застосоване.
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

1. **Параметр `model`** з виклику інструмента (якщо агент його вказує).
2. **`imageGenerationModel.primary`** з конфігурації.
3. **`imageGenerationModel.fallbacks`** за порядком.
4. **Автовиявлення** - лише значення за замовчуванням провайдерів із підтриманою автентифікацією:
   - спочатку поточний провайдер за замовчуванням;
   - решта зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.

Якщо провайдер зазнає невдачі (помилка автентифікації, обмеження частоти тощо), автоматично
пробується наступний налаштований кандидат. Якщо всі зазнають невдачі, помилка містить подробиці
кожної спроби.

<AccordionGroup>
  <Accordion title="Перевизначення моделі для окремого виклику є точними">
    Перевизначення `model` для окремого виклику пробує лише цього провайдера/модель і
    не переходить до налаштованих primary/fallback або автовиявлених провайдерів.
  </Accordion>
  <Accordion title="Автовиявлення враховує автентифікацію">
    Значення провайдера за замовчуванням потрапляє до списку кандидатів лише тоді, коли OpenClaw може
    фактично автентифікувати цього провайдера. Задайте
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати лише
    явні записи `model`, `primary` і `fallbacks`.
  </Accordion>
  <Accordion title="Тайм-аути">
    Задайте `agents.defaults.imageGenerationModel.timeoutMs` для повільних бекендів
    зображень. Параметр інструмента `timeoutMs` для окремого виклику перевизначає налаштоване
    значення за замовчуванням.
  </Accordion>
  <Accordion title="Перевірка під час виконання">
    Використовуйте `action: "list"`, щоб переглянути поточно зареєстрованих провайдерів,
    їхні моделі за замовчуванням і підказки env-var для автентифікації.
  </Accordion>
</AccordionGroup>

### Редагування зображень

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI та xAI підтримують редагування
референсних зображень. Передайте шлях або URL до референсного зображення:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 референсних зображень через параметр
`images`. fal, MiniMax і ComfyUI підтримують 1.

## Детальні огляди провайдерів

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (і gpt-image-1.5)">
    Генерація зображень OpenAI за замовчуванням використовує `openai/gpt-image-2`. Якщо
    налаштовано OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий
    OAuth-профіль, який застосовується чат-моделями підписки Codex, і надсилає
    запит зображення через бекенд Codex Responses. Застарілі базові URL-адреси Codex,
    як-от `https://chatgpt.com/backend-api`, канонізуються до
    `https://chatgpt.com/backend-api/codex` для запитів зображень. OpenClaw
    **не** виконує непомітний відкат до `OPENAI_API_KEY` для цього запиту -
    щоб примусово спрямувати маршрутизацію напряму через OpenAI Images API, налаштуйте
    `models.providers.openai` явно з API-ключем, власною базовою URL-адресою
    або кінцевою точкою Azure.

    Моделі `openai/gpt-image-1.5`, `openai/gpt-image-1` і
    `openai/gpt-image-1-mini` все ще можна вибрати явно. Використовуйте
    `gpt-image-1.5` для виводу PNG/WebP із прозорим фоном; поточний
    API `gpt-image-2` відхиляє `background: "transparent"`.

    `gpt-image-2` підтримує як генерацію зображення з тексту, так і
    редагування за референсним зображенням через той самий інструмент `image_generate`.
    OpenClaw пересилає `prompt`, `count`, `size`, `quality`, `outputFormat`
    і референсні зображення до OpenAI. OpenAI **не** отримує
    `aspectRatio` або `resolution` напряму; коли можливо, OpenClaw зіставляє
    їх із підтримуваним `size`, інакше інструмент повідомляє про них як про
    проігноровані перевизначення.

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

    `openai.background` приймає `transparent`, `opaque` або `auto`;
    прозорий вивід потребує `outputFormat` `png` або `webp` і
    моделі зображень OpenAI, здатної працювати з прозорістю. OpenClaw маршрутизує стандартні
    запити `gpt-image-2` із прозорим фоном до `gpt-image-1.5`.
    `openai.outputCompression` застосовується до виводу JPEG/WebP.

    Підказка верхнього рівня `background` є нейтральною щодо провайдера й наразі зіставляється
    з тим самим полем запиту OpenAI `background`, коли вибрано провайдера OpenAI.
    Провайдери, які не оголошують підтримку фону, повертають
    її в `ignoredOverrides` замість отримання непідтримуваного параметра.

    Щоб маршрутизувати генерацію зображень OpenAI через розгортання Azure OpenAI
    замість `api.openai.com`, див.
    [кінцеві точки Azure OpenAI](/uk/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Моделі зображень OpenRouter">
    Генерація зображень OpenRouter використовує той самий `OPENROUTER_API_KEY` і
    маршрутизується через API зображень чат-доповнень OpenRouter. Вибирайте
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

    OpenClaw пересилає `prompt`, `count`, референсні зображення та
    сумісні з Gemini підказки `aspectRatio` / `resolution` до OpenRouter.
    Поточні вбудовані скорочення моделей зображень OpenRouter включають
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`. Використовуйте
    `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

  </Accordion>
  <Accordion title="Подвійна автентифікація MiniMax">
    Генерація зображень MiniMax доступна через обидва вбудовані
    шляхи автентифікації MiniMax:

    - `minimax/image-01` для налаштувань з API-ключем
    - `minimax-portal/image-01` для налаштувань OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Вбудований провайдер xAI використовує `/v1/images/generations` для запитів лише з промптом
    і `/v1/images/edits`, коли присутній `image` або `images`.

    - Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Кількість: до 4
    - Референси: один `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільності: `1K`, `2K`
    - Вивід: повертається як вкладення зображень, керовані OpenClaw

    OpenClaw навмисно не надає нативні для xAI `quality`, `mask`,
    `user` або додаткові лише нативні співвідношення сторін, доки ці елементи керування не з’являться
    у спільному міжпровайдерному контракті `image_generate`.

  </Accordion>
</AccordionGroup>

## Приклади

<Tabs>
  <Tab title="Згенерувати (4K ландшафт)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Згенерувати (прозорий PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Еквівалент CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Згенерувати (два квадратні)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Редагувати (один референс)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Редагувати (кілька референсів)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Ті самі прапорці `--output-format` і `--background` доступні в
`openclaw infer image edit`; `--openai-background` залишається
специфічним для OpenAI псевдонімом. Вбудовані провайдери, крім OpenAI, наразі не оголошують
явного керування фоном, тому `background: "transparent"` для них повідомляється
як проігнорований.

## Пов’язане

- [Огляд інструментів](/uk/tools) - усі доступні інструменти агента
- [ComfyUI](/uk/providers/comfy) - налаштування локального робочого процесу ComfyUI і Comfy Cloud
- [fal](/uk/providers/fal) - налаштування провайдера зображень і відео fal
- [Google (Gemini)](/uk/providers/google) - налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) - налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) - налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) - налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) - налаштування зображень, відео, пошуку, виконання коду та TTS Grok
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) - конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) - конфігурація моделей і відмовостійке перемикання
