---
read_when:
    - Генерування музики або аудіо за допомогою агента
    - Налаштування провайдерів і моделей для генерації музики
    - Розуміння параметрів інструмента music_generate
sidebarTitle: Music generation
summary: Генеруйте музику за допомогою music_generate у робочих процесах Google Lyria, MiniMax і ComfyUI
title: Генерація музики
x-i18n:
    generated_at: "2026-05-02T08:04:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

Інструмент `music_generate` дає агенту змогу створювати музику або аудіо через спільну можливість генерації музики з налаштованими провайдерами — Google, MiniMax і налаштованим через workflow ComfyUI на сьогодні.

Для запусків агентів із підтримкою сесій OpenClaw запускає генерацію музики як фонове завдання, відстежує його в журналі завдань, а потім знову пробуджує агента, коли трек готовий, щоб агент міг опублікувати готове аудіо назад у початковий канал.

<Note>
Вбудований спільний інструмент з’являється лише тоді, коли доступний принаймні один провайдер генерації музики. Якщо ви не бачите `music_generate` серед інструментів свого агента, налаштуйте `agents.defaults.musicGenerationModel` або задайте API-ключ провайдера.
</Note>

## Швидкий старт

<Tabs>
  <Tab title="Із підтримкою спільного провайдера">
    <Steps>
      <Step title="Налаштуйте автентифікацію">
        Задайте API-ключ принаймні для одного провайдера — наприклад
        `GEMINI_API_KEY` або `MINIMAX_API_KEY`.
      </Step>
      <Step title="Виберіть типову модель (необов’язково)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Попросіть агента">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Агент автоматично викликає `music_generate`. Список дозволених інструментів не потрібен.
      </Step>
    </Steps>

    Для прямих синхронних контекстів без запуску агента із підтримкою сесії вбудований інструмент усе ще повертається до вбудованої генерації й повертає кінцевий шлях до медіафайлу в результаті інструмента.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Налаштуйте workflow">
        Налаштуйте `plugins.entries.comfy.config.music` за допомогою workflow JSON і вузлів prompt/output.
      </Step>
      <Step title="Хмарна автентифікація (необов’язково)">
        Для Comfy Cloud задайте `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Викличте інструмент">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Приклади запитів:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Підтримувані провайдери

| Провайдер | Типова модель          | Референсні вхідні дані | Підтримувані параметри керування                         | Автентифікація                         |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | До 1 зображення    | Музика або аудіо, визначені workflow                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | До 10 зображень  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Немає             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` або MiniMax OAuth    |

### Матриця можливостей

Явний контракт режимів, який використовують `music_generate`, контрактні тести й спільний live sweep:

| Провайдер | `generate` | `edit` | Ліміт редагування | Спільні live lanes                                                        |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 зображення | Не входить до спільного sweep; покривається `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 зображень | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Немає       | `generate`                                                                |

Використовуйте `action: "list"`, щоб перевірити доступних спільних провайдерів і моделі під час виконання:

```text
/tool music_generate action=list
```

Використовуйте `action: "status"`, щоб перевірити активне сесійне музичне завдання:

```text
/tool music_generate action=status
```

Приклад прямої генерації:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
  Запит для генерації музики. Обов’язковий для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` повертає поточне сесійне завдання; `"list"` перевіряє провайдерів.
</ParamField>
<ParamField path="model" type="string">
  Перевизначення провайдера/моделі (наприклад, `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Необов’язковий текст пісні, коли провайдер підтримує явне введення тексту пісні.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Запит на вихід лише з інструменталом, коли провайдер це підтримує.
</ParamField>
<ParamField path="image" type="string">
  Шлях або URL одного референсного зображення.
</ParamField>
<ParamField path="images" type="string[]">
  Кілька референсних зображень (до 10 у провайдерів, які це підтримують).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Цільова тривалість у секундах, коли провайдер підтримує підказки тривалості.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Підказка формату вихідного файлу, коли провайдер це підтримує.
</ParamField>
<ParamField path="filename" type="string">Підказка імені вихідного файлу.</ParamField>
<ParamField path="timeoutMs" type="number">Необов’язковий тайм-аут запиту до провайдера в мілісекундах. Значення нижче 10000ms підвищуються до 10000ms і повідомляються в результаті інструмента.</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. OpenClaw усе одно перевіряє жорсткі обмеження, такі як кількість вхідних даних, перед надсиланням. Коли провайдер підтримує тривалість, але має коротший максимум за запитане значення, OpenClaw обмежує значення найближчою підтримуваною тривалістю. Справді непідтримувані необов’язкові підказки ігноруються з попередженням, коли вибраний провайдер або модель не можуть їх виконати. Результати інструмента повідомляють застосовані налаштування; `details.normalization` фіксує будь-яке зіставлення запитаного із застосованим.
</Note>

## Асинхронна поведінка

Сесійна генерація музики виконується як фонове завдання:

- **Фонове завдання:** `music_generate` створює фонове завдання, негайно повертає відповідь про старт/завдання й пізніше публікує готовий трек у наступному повідомленні агента.
- **Запобігання дублюванню:** доки завдання має стан `queued` або `running`, пізніші виклики `music_generate` у тій самій сесії повертають статус завдання замість запуску ще однієї генерації. Використовуйте `action: "status"` для явної перевірки.
- **Перегляд статусу:** `openclaw tasks list` або `openclaw tasks show <taskId>` перевіряє статуси в черзі, виконання й завершення.
- **Пробудження після завершення:** OpenClaw вводить внутрішню подію завершення назад у ту саму сесію, щоб модель могла сама написати наступне повідомлення для користувача.
- **Підказка запиту:** пізніші користувацькі/ручні ходи в тій самій сесії отримують невелику runtime-підказку, коли музичне завдання вже виконується, щоб модель не викликала `music_generate` повторно наосліп.
- **Fallback без сесії:** прямі/локальні контексти без справжньої сесії агента виконуються inline і повертають кінцевий аудіорезультат у тому самому ході.

### Життєвий цикл завдання

| Стан        | Значення                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Завдання створено, очікує, доки провайдер його прийме.                                        |
| `running`   | Провайдер обробляє запит (зазвичай від 30 секунд до 3 хвилин залежно від провайдера й тривалості). |
| `succeeded` | Трек готовий; агент пробуджується й публікує його в розмову.                                  |
| `failed`    | Помилка провайдера або тайм-аут; агент пробуджується з деталями помилки.                      |

Перевірте статус із CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Конфігурація

### Вибір моделі

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Порядок вибору провайдера

OpenClaw пробує провайдерів у такому порядку:

1. Параметр `model` із виклику інструмента (якщо агент його вказує).
2. `musicGenerationModel.primary` із конфігурації.
3. `musicGenerationModel.fallbacks` по порядку.
4. Автовиявлення лише за типовими провайдерами з підтримкою автентифікації:
   - спочатку поточний типовий провайдер;
   - решта зареєстрованих провайдерів генерації музики в порядку provider-id.

Якщо провайдер зазнає невдачі, наступний кандидат пробується автоматично. Якщо всі зазнають невдачі, помилка містить деталі кожної спроби.

Задайте `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати лише явні записи `model`, `primary` і `fallbacks`.

## Примітки щодо провайдерів

<AccordionGroup>
  <Accordion title="ComfyUI">
    Керується workflow і залежить від налаштованого графа та зіставлення вузлів для полів prompt/output. Вбудований plugin `comfy` під’єднується до спільного інструмента `music_generate` через реєстр провайдерів генерації музики.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Використовує пакетну генерацію Lyria 3. Поточний вбудований потік підтримує prompt, необов’язковий текст пісні й необов’язкові референсні зображення.
  </Accordion>
  <Accordion title="MiniMax">
    Використовує пакетний endpoint `music_generation`. Підтримує prompt, необов’язковий текст пісні, інструментальний режим, керування тривалістю та вихід mp3 через автентифікацію API-ключем `minimax` або OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Вибір правильного шляху

- **Із підтримкою спільного провайдера**, коли вам потрібні вибір моделі, failover провайдера й вбудований асинхронний потік завдання/статусу.
- **Шлях Plugin (ComfyUI)**, коли вам потрібен власний workflow-граф або провайдер, який не входить до спільної вбудованої музичної можливості.

Якщо ви налагоджуєте специфічну для ComfyUI поведінку, див. [ComfyUI](/uk/providers/comfy). Якщо ви налагоджуєте поведінку спільного провайдера, почніть із [Google (Gemini)](/uk/providers/google) або [MiniMax](/uk/providers/minimax).

## Режими можливостей провайдера

Спільний контракт генерації музики підтримує явні оголошення режимів:

- `generate` для генерації лише за prompt.
- `edit`, коли запит містить одне або кілька референсних зображень.

Нові реалізації провайдерів мають віддавати перевагу явним блокам режимів:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Застарілих плоских полів, таких як `maxInputImages`, `supportsLyrics` і `supportsFormat`, **недостатньо** для оголошення підтримки редагування. Провайдери мають явно оголошувати `generate` і `edit`, щоб live tests, контрактні тести та спільний інструмент `music_generate` могли детерміновано перевіряти підтримку режимів.

## Live tests

Opt-in live-покриття для спільних вбудованих провайдерів:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Обгортка репозиторію:

```bash
pnpm test:live:media music
```

Цей live-файл завантажує відсутні змінні середовища провайдера з `~/.profile`, за замовчуванням надає перевагу live/env API-ключам перед збереженими профілями автентифікації та запускає покриття і `generate`, і оголошеного `edit`, коли провайдер увімкнув режим edit. Поточне покриття:

- `google`: `generate` плюс `edit`
- `minimax`: лише `generate`
- `comfy`: окреме live-покриття Comfy, не спільний sweep провайдерів

Opt-in live-покриття для вбудованого музичного шляху ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Файл Comfy live також охоплює робочі процеси зображень і відео Comfy, коли ці розділи налаштовано.

## Пов’язане

- [Фонові завдання](/uk/automation/tasks) — відстеження завдань для від’єднаних запусків `music_generate`
- [ComfyUI](/uk/providers/comfy)
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `musicGenerationModel`
- [Google (Gemini)](/uk/providers/google)
- [MiniMax](/uk/providers/minimax)
- [Моделі](/uk/concepts/models) — конфігурація моделей і перемикання після збою
- [Огляд інструментів](/uk/tools)
