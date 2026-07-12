---
read_when:
    - Створення або редагування зображень за допомогою агента
    - Налаштування постачальників і моделей для генерування зображень
    - Розуміння параметрів інструмента image_generate
sidebarTitle: Image generation
summary: Створюйте та редагуйте зображення за допомогою image_generate в OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Генерування зображень
x-i18n:
    generated_at: "2026-07-12T13:46:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

Інструмент `image_generate` створює та редагує зображення через налаштованих
провайдерів. У сеансах чату він працює асинхронно: OpenClaw реєструє
фонове завдання, негайно повертає ідентифікатор завдання та активує агента,
коли провайдер завершує роботу. Агент завершення дотримується звичайного для
сеансу режиму видимої відповіді: автоматично доставляє остаточну відповідь,
якщо це налаштовано, або використовує `message(action="send")`, якщо сеанс
вимагає застосування інструмента повідомлень. Якщо сеанс запитувача неактивний
або його активна спроба активації завершується невдало, OpenClaw надсилає
ідемпотентну пряму резервну відповідь зі створеними зображеннями, щоб результат
не було втрачено.

<Note>
Інструмент відображається лише тоді, коли доступний принаймні один провайдер
генерування зображень. Якщо серед інструментів вашого агента немає
`image_generate`, налаштуйте `agents.defaults.imageGenerationModel`, задайте
API-ключ провайдера або ввійдіть через OpenAI ChatGPT/Codex OAuth.
</Note>

## Швидкий початок

<Steps>
  <Step title="Налаштуйте автентифікацію">
    Задайте API-ключ принаймні для одного провайдера (наприклад,
    `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) або ввійдіть через
    OpenAI Codex OAuth.
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

    ChatGPT/Codex OAuth використовує те саме посилання на модель
    `openai/gpt-image-2`. Коли налаштовано профіль OAuth `openai`, OpenClaw
    спрямовує запити зображень через цей профіль OAuth, а не намагається
    спочатку використати `OPENAI_API_KEY`. Явна конфігурація
    `models.providers.openai` (API-ключ, власна або Azure базова URL-адреса)
    знову вмикає прямий маршрут через OpenAI Images API.

  </Step>
  <Step title="Зверніться до агента">
    _"Створи зображення дружнього робота-талісмана."_

    Агент автоматично викликає `image_generate`. Додавати інструмент до списку
    дозволених не потрібно — його ввімкнено за замовчуванням, коли доступний
    провайдер. Інструмент повертає ідентифікатор фонового завдання, а після
    завершення агент надсилає створений вкладений файл через інструмент
    `message`.

  </Step>
</Steps>

<Warning>
Для сумісних з OpenAI кінцевих точок у локальній мережі, як-от LocalAI,
збережіть власне значення `models.providers.openai.baseUrl` і явно надайте
дозвіл за допомогою
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Приватні та
внутрішні кінцеві точки зображень за замовчуванням залишаються заблокованими.
</Warning>

## Поширені маршрути

| Мета                                                   | Посилання на модель                                 | Автентифікація                         |
| ------------------------------------------------------ | --------------------------------------------------- | -------------------------------------- |
| Генерування зображень OpenAI з оплатою через API        | `openai/gpt-image-2`                                | `OPENAI_API_KEY`                       |
| Генерування зображень OpenAI з автентифікацією підписки Codex | `openai/gpt-image-2`                          | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP OpenAI із прозорим тлом                       | `openai/gpt-image-1.5`                              | `OPENAI_API_KEY` або OpenAI Codex OAuth |
| Генерування зображень DeepInfra                        | `deepinfra/black-forest-labs/FLUX-1-schnell`        | `DEEPINFRA_API_KEY`                    |
| Виразне або кероване стилем генерування fal Krea 2     | `fal/krea/v2/medium/text-to-image`                  | `FAL_KEY`                              |
| Генерування зображень OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview`  | `OPENROUTER_API_KEY`                   |
| Генерування зображень LiteLLM                          | `litellm/gpt-image-2`                               | `LITELLM_API_KEY`                      |
| Генерування зображень Microsoft Foundry MAI            | `microsoft-foundry/<deployment-name>`               | `AZURE_OPENAI_API_KEY` або Entra ID    |
| Генерування зображень Google Gemini                    | `google/gemini-3.1-flash-image-preview`             | `GEMINI_API_KEY` або `GOOGLE_API_KEY`  |

Той самий інструмент підтримує генерування зображень із тексту та редагування
за еталонним зображенням. Використовуйте `image` для одного еталона або
`images` для кількох. Для моделей Krea 2 у fal ці еталони надсилаються як
стильові референси, а не як вхідні дані для редагування. Підтримувані
провайдером підказки щодо результату, як-от `quality`, `outputFormat` і
`background`, передаються, коли вони доступні, а якщо провайдер не заявляє
про їх підтримку, вони позначаються як проігноровані. Вбудована підтримка
прозорого тла є специфічною для OpenAI; інші провайдери також можуть зберігати
альфа-канал PNG, якщо його створює їхня серверна система.

## Підтримувані провайдери

| Провайдер         | Модель за замовчуванням                 | Підтримка редагування                    | Автентифікація                                        |
| ----------------- | --------------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Так (1 зображення, налаштоване процесом) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари   |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Так (1 зображення)                       | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Так (обмеження залежать від моделі)      | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Так (до 5 зображень)                     | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                 |
| LiteLLM           | `gpt-image-2`                           | Так (до 5 вхідних зображень)             | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Так (лише моделі MAI-Image-2.5)          | `AZURE_OPENAI_API_KEY` або Entra ID (`az login`)      |
| MiniMax           | `image-01`                              | Так (еталон суб’єкта)                    | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Так (до 5 зображень)                     | `OPENAI_API_KEY` або OpenAI ChatGPT/Codex OAuth       |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)             | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Ні                                       | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Так (до 3 зображень)                     | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб перевірити доступних провайдерів і моделі
під час виконання:

```text
/tool image_generate action=list
```

Використовуйте `action: "status"`, щоб перевірити активне завдання генерування
зображень для поточного сеансу:

```text
/tool image_generate action=status
```

## Можливості провайдерів

| Можливість             | ComfyUI                 | DeepInfra    | fal                                                     | Google           | Microsoft Foundry | MiniMax                    | OpenAI           | Vydra | xAI              |
| ---------------------- | ----------------------- | ------------ | ------------------------------------------------------- | ---------------- | ----------------- | -------------------------- | ---------------- | ----- | ---------------- |
| Генерування (макс. кількість) | 1                 | 4            | 4                                                       | 4                | 1                 | 9                          | 4                | 1     | 4                |
| Редагування / еталон    | 1 зображення (процес)   | 1 зображення | Flux: 1; GPT: 10; стильові референси Krea: 10; NB2: 14 | До 5 зображень   | 1 зображення      | 1 зображення (еталон суб’єкта) | До 5 зображень | -     | До 3 зображень   |
| Керування розміром      | -                       | ✓            | ✓                                                       | ✓                | ✓                 | -                          | До 4K            | -     | -                |
| Співвідношення сторін   | -                       | -            | ✓                                                       | ✓                | -                 | ✓                          | -                | -     | ✓                |
| Роздільна здатність (1K/2K/4K) | -                | -            | ✓                                                       | ✓                | -                 | -                          | -                | -     | 1K, 2K           |

## Параметри інструмента

<ParamField path="prompt" type="string" required>
  Текстовий запит для генерування зображення. Обов’язковий для
  `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Використовуйте `"status"`, щоб перевірити активне завдання сеансу, або
  `"list"`, щоб перевірити доступних провайдерів і моделі під час виконання.
</ParamField>
<ParamField path="model" type="string">
  Перевизначення провайдера або моделі (наприклад, `openai/gpt-image-2`).
  Використовуйте `openai/gpt-image-1.5` для прозорого тла OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Шлях або URL-адреса одного еталонного зображення для режиму редагування.
</ParamField>
<ParamField path="images" type="string[]">
  Кілька еталонних зображень для режиму редагування або моделей зі стильовими
  референсами (до 14 через спільний інструмент; специфічні для провайдера
  обмеження все одно застосовуються).
</ParamField>
<ParamField path="size" type="string">
  Підказка щодо розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`,
  `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Співвідношення сторін: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`,
  `2.35:1`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`,
  `21:9`, `1:2`, `4:1`, `1:4`, `8:1`, `1:8`. Провайдери перевіряють власну
  підмножину, специфічну для моделі.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Підказка щодо роздільної здатності.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Підказка щодо якості, якщо провайдер її підтримує.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Підказка щодо формату результату, якщо провайдер її підтримує.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Підказка щодо тла, якщо провайдер її підтримує. Використовуйте `transparent`
  з `outputFormat: "png"` або `"webp"` для провайдерів, здатних створювати
  прозоре тло.
</ParamField>
<ParamField path="count" type="number">Кількість зображень для генерування (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Необов’язковий час очікування запиту до провайдера в мілісекундах. Коли Codex
  викликає `image_generate` через динамічні інструменти, це значення для
  окремого виклику все одно перевизначає налаштоване значення за замовчуванням
  і обмежується 600000 мс.
</ParamField>
<ParamField path="filename" type="string">Підказка щодо назви вихідного файлу.</ParamField>
<ParamField path="openai" type="object">
  Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і
  `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Керування креативністю fal Krea 2. Значення за замовчуванням — `medium`.
</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. Якщо резервний провайдер
підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед
надсиланням зіставляє запит із найближчим підтримуваним розміром,
співвідношенням сторін або роздільною здатністю. Непідтримувані підказки щодо
результату відкидаються для провайдерів, які не заявляють про їх підтримку, і
зазначаються в результаті інструмента. Результати інструмента містять
застосовані параметри; `details.normalization` фіксує будь-яке перетворення
запитаних значень на застосовані.
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

OpenClaw випробовує провайдерів у такому порядку:

1. Параметр **`model`** із виклику інструмента (якщо агент його вказує).
2. **`imageGenerationModel.primary`** із конфігурації.
3. **`imageGenerationModel.fallbacks`** у заданому порядку.
4. **Автовиявлення** — лише стандартні постачальники з налаштованою автентифікацією:
   - спочатку поточний стандартний постачальник;
   - потім решта зареєстрованих постачальників генерації зображень у порядку ідентифікаторів постачальників.

Якщо постачальник зазнає помилки (помилка автентифікації, обмеження частоти запитів тощо), автоматично випробовується наступний налаштований
кандидат. Якщо всі спроби невдалі, помилка містить подробиці
кожної спроби.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Перевизначення `model` для окремого виклику випробовує лише зазначеного постачальника/модель і
    не переходить до налаштованої основної, резервних або автоматично виявлених постачальників.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Стандартна модель постачальника потрапляє до списку кандидатів лише тоді, коли OpenClaw може
    фактично автентифікуватися в цього постачальника. Установіть
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати лише
    явно задані записи `model`, `primary` і `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Для повільних систем обробки зображень установіть `agents.defaults.imageGenerationModel.timeoutMs`.
    Параметр інструмента `timeoutMs` для окремого виклику перевизначає налаштоване
    стандартне значення, а налаштовані стандартні значення перевизначають стандартні значення
    постачальника, задані плагіном. Розміщені в Google і OpenRouter постачальники зображень використовують стандартне значення
    180 секунд; генерація зображень Microsoft Foundry MAI, xAI та Azure OpenAI використовує
    600 секунд. Виклики динамічних інструментів Codex використовують стандартне значення 120 секунд для мосту
    `image_generate` і дотримуються того самого налаштованого бюджету часу очікування, обмеженого
    максимальним значенням мосту динамічних інструментів OpenClaw у 600000 мс.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Використовуйте `action: "list"`, щоб переглянути поточних зареєстрованих постачальників,
    їхні стандартні моделі та підказки щодо змінних середовища для автентифікації.
  </Accordion>
</AccordionGroup>

### Редагування зображень

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI та xAI підтримують редагування еталонних зображень. Моделі Krea 2 у fal використовують
ті самі поля `image` / `images` як стильові еталони, а не як вхідні дані
для редагування. Передайте шлях або URL еталонного зображення:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter і Google підтримують до 5 еталонних зображень через параметр
`images`; xAI підтримує до 3. fal підтримує 1 еталонне зображення для
перетворення зображення на зображення у Flux, до 10 для редагування GPT Image 2, до 10 стильових еталонів
для Krea 2 і до 14 для редагування Nano Banana 2. Microsoft Foundry, MiniMax
і ComfyUI підтримують 1.

## Докладно про постачальників

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    Для генерації зображень OpenAI стандартно використовується `openai/gpt-image-2`. Якщо налаштовано
    профіль OAuth `openai`, OpenClaw повторно використовує той самий
    профіль OAuth, що й моделі чату за передплатою Codex, і надсилає
    запит зображення через серверну частину Codex Responses. Застарілі базові
    URL-адреси Codex, як-от `https://chatgpt.com/backend-api`, канонізуються до
    `https://chatgpt.com/backend-api/codex` для запитів зображень. OpenClaw
    **не** переходить непомітно до `OPENAI_API_KEY` для такого запиту —
    щоб примусово спрямувати запит безпосередньо до OpenAI Images API, явно налаштуйте
    `models.providers.openai` із ключем API, власною базовою URL-адресою
    або кінцевою точкою Azure.

    Моделі `openai/gpt-image-1.5`, `openai/gpt-image-1` і
    `openai/gpt-image-1-mini` усе ще можна вибрати явно. Використовуйте
    `gpt-image-1.5` для виведення PNG/WebP із прозорим тлом; поточний
    API `gpt-image-2` відхиляє `background: "transparent"`.

    `gpt-image-2` підтримує як генерацію зображень із тексту, так і
    редагування еталонних зображень через той самий інструмент `image_generate`.
    OpenClaw передає до OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat`
    та еталонні зображення. OpenAI **не** отримує
    `aspectRatio` або `resolution` безпосередньо; коли це можливо, OpenClaw зіставляє
    їх із підтримуваним значенням `size`, інакше інструмент повідомляє про них як про
    проігноровані перевизначення.

    Параметри, специфічні для OpenAI, розміщено в об’єкті `openai`:

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
    для прозорого виведення потрібен `outputFormat` зі значенням `png` або `webp` і
    модель зображень OpenAI із підтримкою прозорості. OpenClaw спрямовує стандартні
    запити `gpt-image-2` із прозорим тлом до `gpt-image-1.5`.
    `openai.outputCompression` застосовується до виведення JPEG/WebP та ігнорується
    для виведення PNG.

    Підказка верхнього рівня `background` не залежить від постачальника й наразі зіставляється
    з тим самим полем запиту OpenAI `background`, коли вибрано постачальника OpenAI.
    Постачальники, які не заявляють підтримку тла, повертають
    її в `ignoredOverrides`, замість того щоб отримувати непідтримуваний параметр.

    Щоб спрямувати генерацію зображень OpenAI через розгортання Azure OpenAI
    замість `api.openai.com`, див.
    [Кінцеві точки Azure OpenAI](/uk/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    Генерація зображень Microsoft Foundry використовує імена розгорнутих розгортань зображень MAI
    із префіксом постачальника `microsoft-foundry/`. Стандартної моделі на рівні постачальника
    немає, оскільки API MAI очікує ім’я вашого розгортання в
    полі `model`:

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

    Постачальник використовує API MAI від Microsoft Foundry, а не OpenAI Images API:

    - Кінцева точка генерації: `/mai/v1/images/generations`
    - Кінцева точка редагування: `/mai/v1/images/edits`
    - Автентифікація: `AZURE_OPENAI_API_KEY` / ключ API постачальника або Entra ID через `az login`
    - Виведення: одне зображення PNG
    - Розмір: стандартно `1024x1024`; ширина й висота мають становити щонайменше 768 пікселів кожна,
      а загальна кількість пікселів не має перевищувати 1 048 576
    - Редагування: одне еталонне зображення PNG або JPEG, підтримується лише
      розгортаннями `MAI-Image-2.5-Flash` і `MAI-Image-2.5`

    Для генерації лише за запитом можна використовувати власне ім’я розгортання, налаштувавши тільки
    кінцеву точку Foundry. Для редагування з власними іменами розгортань потрібні
    метадані початкового налаштування/моделі, щоб OpenClaw міг перевірити, що розгортання
    працює на основі `MAI-Image-2.5-Flash` або `MAI-Image-2.5`.

    Поточні моделі зображень MAI: `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` і `MAI-Image-2`. Відомості про налаштування
    та поведінку моделей чату див. у розділі [плагін Microsoft Foundry](/uk/plugins/reference/microsoft-foundry).

  </Accordion>
  <Accordion title="OpenRouter image models">
    Генерація зображень OpenRouter використовує той самий `OPENROUTER_API_KEY` і
    спрямовує запити через API зображень завершення чату OpenRouter. Вибирайте
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

    OpenClaw передає до OpenRouter `prompt`, `count`, еталонні зображення та
    сумісні з Gemini підказки `aspectRatio` / `resolution`.
    Поточні вбудовані скорочення моделей зображень OpenRouter включають
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`. Використовуйте
    `action: "list"`, щоб переглянути, що надає ваш налаштований плагін.

  </Accordion>
  <Accordion title="fal Krea 2">
    Моделі Krea 2 у fal використовують власну схему Krea від fal замість універсальної
    схеми `image_size`, яку використовує Flux. OpenClaw надсилає:

    - `aspect_ratio` для підказок щодо співвідношення сторін
    - `creativity`, зі стандартним значенням `medium`
    - `image_style_references`, коли надано `image` або `images`

    Вибирайте Krea 2 Medium для швидшого створення виразних ілюстрацій, а Krea 2 Large —
    для повільнішого створення деталізованіших фотореалістичних і текстурованих зображень:

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

    Наразі Krea 2 повертає одне зображення на запит. Для Krea віддавайте перевагу `aspectRatio`;
    OpenClaw зіставляє `size` із найближчим підтримуваним співвідношенням сторін Krea та
    відхиляє `resolution` для Krea, а не відкидає його. Використовуйте `fal.creativity`,
    коли потрібен власний рівень творчості Krea:

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
  <Accordion title="MiniMax dual-auth">
    Генерація зображень MiniMax доступна через обидва вбудовані
    шляхи автентифікації MiniMax:

    - `minimax/image-01` для налаштувань із ключем API
    - `minimax-portal/image-01` для налаштувань OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Вбудований постачальник xAI використовує `/v1/images/generations` для запитів
    лише із запитом і `/v1/images/edits`, коли наявне `image` або `images`.

    - Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Кількість: до 4
    - Еталони: одне `image` або до трьох `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Роздільна здатність: `1K`, `2K`
    - Виведення: повертається як вкладення зображень, керовані OpenClaw

    OpenClaw навмисно не надає власні параметри xAI `quality`, `mask`,
    `user` або співвідношення сторін `auto`, доки ці засоби керування не з’являться в спільному
    міжпостачальницькому контракті `image_generate`.

  </Accordion>
</AccordionGroup>

## Приклади

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Еквівалентна команда CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generate (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

Еквівалентна команда CLI:

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
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Два візуальні напрями для значка застосунку для спокійної продуктивності" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Редагування (одне референсне зображення)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Зберегти об’єкт, замінити тло на яскраву студійну сцену" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Редагування (кілька референсних зображень)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Поєднати образ персонажа з першого зображення з колірною палітрою другого" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Стильові референси Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Виразний редакційний портрет із використанням цієї колірної палітри та друкованої текстури" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Ті самі прапорці `--output-format`, `--background`, `--quality` і
`--openai-moderation` доступні для `openclaw infer image edit`;
`--openai-background` залишається псевдонімом, специфічним для OpenAI. Наразі
вбудовані провайдери, окрім OpenAI, не оголошують явного керування тлом, тому
для них `background: "transparent"` позначається як проігнорований параметр.

## Пов’язані матеріали

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [ComfyUI](/uk/providers/comfy) — налаштування локальних робочих процесів ComfyUI та Comfy Cloud
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [Plugin Microsoft Foundry](/uk/plugins/reference/microsoft-foundry) — налаштування чату Microsoft Foundry і зображень MAI
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування зображень, відео, пошуку, виконання коду та синтезу мовлення Grok
- [Довідник із конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і перемикання в разі відмови
