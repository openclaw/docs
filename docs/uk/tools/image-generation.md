---
read_when:
    - Створення або редагування зображень через агента
    - Налаштування провайдерів і моделей генерації зображень
    - Розуміння параметрів інструмента image_generate
sidebarTitle: Image generation
summary: Створюйте й редагуйте зображення через image_generate в OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Генерування зображень
x-i18n:
    generated_at: "2026-06-27T18:26:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

Інструмент `image_generate` дає змогу агенту створювати й редагувати зображення за допомогою ваших налаштованих провайдерів. У сеансах чату генерація зображень виконується асинхронно: OpenClaw записує фонове завдання, негайно повертає ідентифікатор завдання й пробуджує агента, коли провайдер завершує роботу. Агент завершення дотримується звичайного режиму видимої відповіді сеансу: автоматичне доставлення фінальної відповіді, якщо це налаштовано, або `message(action="send")`, коли сеанс вимагає інструмент повідомлень. Якщо сеанс запитувача неактивний або його активне пробудження не вдається, а деяких згенерованих зображень усе ще бракує у відповіді завершення, OpenClaw надсилає ідемпотентний прямий резервний варіант лише з відсутніми зображеннями.

<Note>
Інструмент з’являється лише тоді, коли доступний принаймні один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів свого агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера або ввійдіть через OpenAI ChatGPT/Codex OAuth.
</Note>

## Швидкий старт

<Steps>
  <Step title="Налаштуйте автентифікацію">
    Задайте API-ключ принаймні для одного провайдера (наприклад, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) або ввійдіть через OpenAI Codex OAuth.
  </Step>
  <Step title="Виберіть стандартну модель (необов’язково)">
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

    ChatGPT/Codex OAuth використовує той самий референс моделі `openai/gpt-image-2`. Коли налаштовано OAuth-профіль `openai`, OpenClaw маршрутизує запити зображень через цей OAuth-профіль замість того, щоб спершу пробувати `OPENAI_API_KEY`. Явна конфігурація `models.providers.openai` (API-ключ, власний/Azure базовий URL) знову вмикає прямий маршрут OpenAI Images API.

  </Step>
  <Step title="Попросіть агента">
    _"Згенеруй зображення дружнього робота-маскота."_

    Агент автоматично викликає `image_generate`. Список дозволених інструментів не потрібен — інструмент увімкнено за замовчуванням, коли доступний провайдер. Інструмент повертає ідентифікатор фонового завдання, а потім агент завершення надсилає згенероване вкладення через інструмент `message`, коли воно готове.

  </Step>
</Steps>

<Warning>
Для сумісних з OpenAI LAN-ендпоїнтів, таких як LocalAI, залишайте власний `models.providers.openai.baseUrl` і явно ввімкніть це через `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Приватні та внутрішні ендпоїнти зображень залишаються заблокованими за замовчуванням.
</Warning>

## Поширені маршрути

| Мета                                                 | Референс моделі                                          | Автентифікація                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Генерація зображень OpenAI з оплатою через API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Генерація зображень OpenAI з автентифікацією передплати Codex | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI PNG/WebP із прозорим фоном               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` або OpenAI Codex OAuth |
| Генерація зображень DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 експресивна/стильово керована генерація      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Генерація зображень OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Генерація зображень LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Генерація зображень Microsoft Foundry MAI               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` або Entra ID     |
| Генерація зображень Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` або `GOOGLE_API_KEY`   |

Той самий інструмент `image_generate` обробляє перетворення тексту на зображення та редагування з референсними зображеннями. Використовуйте `image` для одного референсу або `images` для кількох референсів. Для моделей Krea 2 на fal ці референси надсилаються як референси стилю, а не як вхідні дані для редагування.
Підказки виводу, які підтримує провайдер, як-от `quality`, `outputFormat` і `background`, передаються, коли доступні, і повідомляються як проігноровані, коли провайдер їх не підтримує. Вбудована підтримка прозорого фону специфічна для OpenAI; інші провайдери все ще можуть зберігати PNG-альфа-канал, якщо їхній бекенд його створює.

## Підтримувані провайдери

| Провайдер          | Стандартна модель                           | Підтримка редагування                       | Автентифікація                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Так (1 зображення, налаштовано workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Так (1 зображення)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Так (обмеження залежать від моделі)        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Так (до 5 вхідних зображень)         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Так (лише моделі MAI-Image-2.5)    | `AZURE_OPENAI_API_KEY` або Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Так (референс об’єкта)            | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Ні                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Так (до 5 зображень)               | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб переглянути доступних провайдерів і моделі під час виконання:

```text
/tool image_generate action=list
```

Використовуйте `action: "status"`, щоб переглянути активне завдання генерації зображень для поточного сеансу:

```text
/tool image_generate action=status
```

## Можливості провайдерів

| Можливість            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Генерація (макс. кількість)  | Визначено workflow   | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Редагування / референс      | 1 зображення (workflow) | 1 зображення   | Flux: 1; GPT: 10; референси стилю Krea: 10; NB2: 14 | До 5 зображень | 1 зображення           | 1 зображення (референс об’єкта) | До 5 зображень | -     | До 5 зображень |
| Керування розміром          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | До 4K       | -     | -              |
| Співвідношення сторін          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Роздільна здатність (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Параметри інструмента

<ParamField path="prompt" type="string" required>
  Запит для генерації зображення. Обов’язковий для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Використовуйте `"status"`, щоб переглянути активне завдання сеансу, або `"list"`, щоб переглянути доступних провайдерів і моделі під час виконання.
</ParamField>
<ParamField path="model" type="string">
  Перевизначення провайдера/моделі (наприклад, `openai/gpt-image-2`). Використовуйте `openai/gpt-image-1.5` для прозорих фонів OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Шлях або URL одного референсного зображення для режиму редагування.
</ParamField>
<ParamField path="images" type="string[]">
  Кілька референсних зображень для режиму редагування або моделей із референсами стилю (до 10 через спільний інструмент; обмеження конкретного провайдера все одно застосовуються).
</ParamField>
<ParamField path="size" type="string">
  Підказка розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Співвідношення сторін: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Провайдери перевіряють власну підмножину для конкретної моделі.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Підказка роздільної здатності.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Підказка якості, коли провайдер її підтримує.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Підказка формату виводу, коли провайдер її підтримує.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Підказка фону, коли провайдер її підтримує. Використовуйте `transparent` з `outputFormat: "png"` або `"webp"` для провайдерів із підтримкою прозорості.
</ParamField>
<ParamField path="count" type="number">Кількість зображень для генерації (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Необов’язковий тайм-аут запиту до провайдера в мілісекундах. Коли Codex викликає `image_generate` через динамічні інструменти, це значення для окремого виклику все одно перевизначає налаштоване стандартне значення й обмежується 600000 мс.
</ParamField>
<ParamField path="filename" type="string">Підказка імені вихідного файлу.</ParamField>
<ParamField path="openai" type="object">
  Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Керування креативністю fal Krea 2. Стандартне значення — `medium`.
</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. Коли резервний провайдер підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед надсиланням зіставляє його з найближчим підтримуваним розміром, співвідношенням сторін або роздільною здатністю.
Непідтримувані підказки виводу відкидаються для провайдерів, які не заявляють підтримку, і про це повідомляється в результаті інструмента. Результати інструмента повідомляють застосовані налаштування; `details.normalization` фіксує будь-яке перетворення із запитаного в застосоване.
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
4. **Автовиявлення** - лише типові значення провайдера, підкріплені автентифікацією:
   - поточний типовий провайдер першим;
   - решта зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.

Якщо провайдер зазнає невдачі (помилка автентифікації, ліміт частоти запитів тощо), автоматично пробується наступний налаштований
кандидат. Якщо всі зазнають невдачі, помилка містить подробиці
з кожної спроби.

<AccordionGroup>
  <Accordion title="Перевизначення моделі для окремого виклику є точними">
    Перевизначення `model` для окремого виклику пробує лише цей провайдер/модель і
    не переходить до налаштованих основного/резервного чи автоматично виявлених провайдерів.
  </Accordion>
  <Accordion title="Автовиявлення враховує автентифікацію">
    Типове значення провайдера потрапляє до списку кандидатів лише тоді, коли OpenClaw може
    фактично автентифікувати цей провайдер. Установіть
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати лише
    явні записи `model`, `primary` і `fallbacks`.
  </Accordion>
  <Accordion title="Тайм-аути">
    Установіть `agents.defaults.imageGenerationModel.timeoutMs` для повільних бекендів
    зображень. Параметр інструмента `timeoutMs` для окремого виклику перевизначає налаштоване
    типове значення, а налаштовані типові значення перевизначають типові значення провайдерів,
    задані Plugin. Провайдери зображень, розміщені в Google і OpenRouter, використовують типові значення
    180 секунд; генерація зображень Microsoft Foundry MAI, xAI і Azure OpenAI використовує
    600 секунд. Виклики динамічних інструментів Codex використовують типове значення мосту `image_generate`
    120 секунд і, коли налаштовано, дотримуються того самого бюджету тайм-ауту, обмеженого
    максимальним значенням мосту динамічних інструментів OpenClaw у 600000 мс.
  </Accordion>
  <Accordion title="Перевірка під час виконання">
    Використовуйте `action: "list"`, щоб перевірити поточно зареєстрованих провайдерів,
    їхні типові моделі та підказки щодо змінних середовища для автентифікації.
  </Accordion>
</AccordionGroup>

### Редагування зображень

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI і xAI підтримують редагування еталонних зображень. Моделі Krea 2 на fal використовують
ті самі поля `image` / `images` як стильові референси замість вхідних даних для редагування. Передайте
шлях до еталонного зображення або URL:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 еталонних зображень через параметр
`images`. fal підтримує 1 еталонне зображення для Flux image-to-image, до
10 для редагувань GPT Image 2, до 10 стильових референсів для Krea 2 і до
14 для редагувань Nano Banana 2. Microsoft Foundry, MiniMax і ComfyUI підтримують 1.

## Поглиблений огляд провайдерів

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (і gpt-image-1.5)">
    Генерація зображень OpenAI типово використовує `openai/gpt-image-2`. Якщо налаштовано
    профіль OAuth `openai`, OpenClaw повторно використовує той самий
    профіль OAuth, який застосовується моделями чату за підпискою Codex, і надсилає
    запит зображення через бекенд Codex Responses. Застарілі базові URL Codex,
    як-от `https://chatgpt.com/backend-api`, канонізуються до
    `https://chatgpt.com/backend-api/codex` для запитів зображень. OpenClaw
    **не** повертається непомітно до `OPENAI_API_KEY` для цього запиту -
    щоб примусово спрямувати через прямий OpenAI Images API, налаштуйте
    `models.providers.openai` явно з API-ключем, користувацьким базовим URL
    або кінцевою точкою Azure.

    Моделі `openai/gpt-image-1.5`, `openai/gpt-image-1` і
    `openai/gpt-image-1-mini` усе ще можна вибрати явно. Використовуйте
    `gpt-image-1.5` для виводу PNG/WebP із прозорим фоном; поточний
    API `gpt-image-2` відхиляє `background: "transparent"`.

    `gpt-image-2` підтримує як генерацію зображень із тексту, так і
    редагування за еталонним зображенням через той самий інструмент `image_generate`.
    OpenClaw пересилає `prompt`, `count`, `size`, `quality`, `outputFormat`
    і еталонні зображення до OpenAI. OpenAI **не** отримує
    `aspectRatio` або `resolution` напряму; коли можливо, OpenClaw зіставляє
    їх із підтримуваним `size`, інакше інструмент повідомляє про них як про
    проігноровані перевизначення.

    Специфічні для OpenAI параметри містяться в об'єкті `openai`:

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
    прозорий вивід вимагає `outputFormat` `png` або `webp` і
    моделі зображень OpenAI з підтримкою прозорості. OpenClaw спрямовує типові
    запити `gpt-image-2` із прозорим фоном до `gpt-image-1.5`.
    `openai.outputCompression` застосовується до виводу JPEG/WebP та ігнорується
    для виводу PNG.

    Підказка верхнього рівня `background` є нейтральною щодо провайдера і наразі зіставляється
    з тим самим полем запиту OpenAI `background`, коли вибрано провайдера OpenAI.
    Провайдери, які не оголошують підтримку фону, повертають
    її в `ignoredOverrides` замість отримання непідтримуваного параметра.

    Щоб спрямувати генерацію зображень OpenAI через розгортання Azure OpenAI
    замість `api.openai.com`, див.
    [кінцеві точки Azure OpenAI](/uk/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Моделі зображень Microsoft Foundry MAI">
    Генерація зображень Microsoft Foundry використовує назви розгорнутих розгортань зображень MAI
    під префіксом провайдера `microsoft-foundry/`. Типової моделі на рівні провайдера
    немає, оскільки MAI API очікує назву вашого розгортання в полі
    `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    Провайдер використовує MAI API Microsoft Foundry, а не OpenAI Images API:

    - Кінцева точка генерації: `/mai/v1/images/generations`
    - Кінцева точка редагування: `/mai/v1/images/edits`
    - Автентифікація: `AZURE_OPENAI_API_KEY` / API-ключ провайдера або Entra ID через `az login`
    - Вивід: одне зображення PNG
    - Розмір: типовий `1024x1024`; ширина й висота мають бути щонайменше 768 px кожна,
      а загальна кількість пікселів має бути не більш ніж 1,048,576
    - Редагування: одне еталонне зображення PNG або JPEG, підтримується лише розгортаннями
      `MAI-Image-2.5-Flash` і `MAI-Image-2.5`

    Генерація лише за промптом може використовувати користувацьку назву розгортання, якщо налаштовано тільки
    кінцеву точку Foundry. Редагування з користувацькими назвами розгортань потребують
    метаданих онбордингу/моделі, щоб OpenClaw міг перевірити, що розгортання
    підтримується `MAI-Image-2.5-Flash` або `MAI-Image-2.5`.

    Поточні моделі зображень MAI: `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` і `MAI-Image-2`. Див.
    [Plugin Microsoft Foundry](/uk/plugins/reference/microsoft-foundry) для налаштування
    і поведінки чат-моделей.

  </Accordion>
  <Accordion title="Моделі зображень OpenRouter">
    Генерація зображень OpenRouter використовує той самий `OPENROUTER_API_KEY` і
    маршрутизується через API зображень chat completions OpenRouter. Вибирайте
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

    OpenClaw пересилає `prompt`, `count`, еталонні зображення та
    сумісні з Gemini підказки `aspectRatio` / `resolution` до OpenRouter.
    Поточні вбудовані скорочення моделей зображень OpenRouter включають
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`. Використовуйте
    `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

  </Accordion>
  <Accordion title="fal Krea 2">
    Моделі Krea 2 на fal використовують власну схему Krea від fal замість загальної
    схеми `image_size`, яку використовує Flux. OpenClaw надсилає:

    - `aspect_ratio` для підказок співвідношення сторін
    - `creativity`, типово `medium`
    - `image_style_references`, коли надано `image` або `images`

    Виберіть Krea 2 Medium для швидшої виразної ілюстрації та Krea 2 Large
    для повільнішого, детальнішого фотореалістичного й текстурованого вигляду:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 наразі повертає одне зображення на запит. Для Krea надавайте перевагу `aspectRatio`;
    OpenClaw зіставляє `size` з найближчим підтримуваним співвідношенням сторін Krea і
    відхиляє `resolution` для Krea, а не пропускає його. Використовуйте `fal.creativity`,
    коли потрібен власний рівень креативності Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="Подвійна автентифікація MiniMax">
    Генерація зображень MiniMax доступна через обидва вбудовані шляхи
    автентифікації MiniMax:

    - `minimax/image-01` для налаштувань з API-ключем
    - `minimax-portal/image-01` для налаштувань OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Вбудований провайдер xAI використовує `/v1/images/generations` для запитів
    лише за промптом і `/v1/images/edits`, коли наявний `image` або `images`.

    - Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Кількість: до 4
    - Референси: одне `image` або до п'яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільності: `1K`, `2K`
    - Вивід: повертається як вкладення зображень, керовані OpenClaw

    OpenClaw навмисно не надає xAI-власні `quality`, `mask`,
    `user` або додаткові лише нативні співвідношення сторін, доки ці елементи керування не існуватимуть
    у спільному міжпровайдерному контракті `image_generate`.

  </Accordion>
</AccordionGroup>

## Приклади

<Tabs>
  <Tab title="Генерація (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Генерація (прозорий PNG)">
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
  <Tab title="Генерація (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

Еквівалент CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Генерування (два квадратні)">
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
  <Tab title="Стильові референси Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Ті самі прапорці `--output-format`, `--background`, `--quality` і
`--openai-moderation` доступні в `openclaw infer image edit`;
`--openai-background` залишається специфічним для OpenAI псевдонімом. Постачальники в комплекті,
крім OpenAI, наразі не оголошують явного керування тлом, тому
`background: "transparent"` для них повідомляється як проігнорований.

## Пов’язане

- [Огляд інструментів](/uk/tools) - усі доступні інструменти агента
- [ComfyUI](/uk/providers/comfy) - налаштування локального робочого процесу ComfyUI і Comfy Cloud
- [fal](/uk/providers/fal) - налаштування постачальника зображень і відео fal
- [Google (Gemini)](/uk/providers/google) - налаштування постачальника зображень Gemini
- [Plugin Microsoft Foundry](/uk/plugins/reference/microsoft-foundry) - налаштування чату Microsoft Foundry і зображень MAI
- [MiniMax](/uk/providers/minimax) - налаштування постачальника зображень MiniMax
- [OpenAI](/uk/providers/openai) - налаштування постачальника OpenAI Images
- [Vydra](/uk/providers/vydra) - налаштування зображень, відео й мовлення Vydra
- [xAI](/uk/providers/xai) - налаштування зображень, відео, пошуку, виконання коду й TTS Grok
- [Довідник із конфігурації](/uk/gateway/config-agents#agent-defaults) - конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) - конфігурація моделей і аварійне перемикання
