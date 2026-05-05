---
read_when:
    - Генерування музики або аудіо за допомогою агента
    - Налаштування провайдерів і моделей для генерації музики
    - Розуміння параметрів інструмента music_generate
sidebarTitle: Music generation
summary: Створюйте музику через music_generate у робочих процесах Google Lyria, MiniMax і ComfyUI
title: Генерація музики
x-i18n:
    generated_at: "2026-05-05T05:18:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

Інструмент `music_generate` дає агенту змогу створювати музику або аудіо через
спільну можливість генерації музики з налаштованими провайдерами — Google,
MiniMax і налаштованим через workflow ComfyUI на сьогодні.

Для запусків агента з підтримкою сесії OpenClaw запускає генерацію музики як
фонове завдання, відстежує його в реєстрі завдань, а потім знову пробуджує агента,
коли трек готовий, щоб агент міг повідомити користувача й прикріпити
готове аудіо. У групових чатах або каналах, які використовують видиму доставку
лише через інструмент повідомлень, агент передає результат через інструмент повідомлень. Якщо
агент завершення пише лише приватну фінальну відповідь, OpenClaw повертається до
прямого надсилання в канал із згенерованим медіа. Пробудження після завершення явно
попереджає агента, що звичайні фінальні відповіді в цих маршрутах є приватними.

<Note>
Вбудований спільний інструмент з'являється лише тоді, коли доступний принаймні один провайдер
генерації музики. Якщо ви не бачите `music_generate` серед інструментів свого агента,
налаштуйте `agents.defaults.musicGenerationModel` або задайте
API-ключ провайдера.
</Note>

## Швидкий старт

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        Задайте API-ключ принаймні для одного провайдера — наприклад
        `GEMINI_API_KEY` або `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _"Згенеруй бадьорий synthpop-трек про нічну поїздку крізь
        неонове місто."_

        Агент автоматично викликає `music_generate`. Додавати інструмент
        до списку дозволених не потрібно.
      </Step>
    </Steps>

    Для прямих синхронних контекстів без запуску агента з підтримкою сесії
    вбудований інструмент усе одно повертається до вбудованої генерації та повертає
    кінцевий шлях до медіа в результаті інструмента.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Налаштуйте `plugins.entries.comfy.config.music` із workflow
        JSON і вузлами prompt/output.
      </Step>
      <Step title="Cloud auth (optional)">
        Для Comfy Cloud задайте `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Приклади prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Підтримувані провайдери

| Провайдер | Типова модель          | Reference inputs | Підтримувані елементи керування                         | Auth                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | До 1 зображення  | Визначена workflow музика або аудіо                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | До 10 зображень  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Немає            | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` або MiniMax OAuth    |

### Матриця можливостей

Явний контракт режимів, який використовують `music_generate`, контрактні тести та
спільний live sweep:

| Провайдер | `generate` | `edit` | Ліміт редагування | Спільні live lanes                                                      |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 зображення | Не входить до спільного sweep; покрито `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 зображень | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Немає       | `generate`                                                                |

Використовуйте `action: "list"`, щоб перевірити доступних спільних провайдерів і моделі під час
виконання:

```text
/tool music_generate action=list
```

Використовуйте `action: "status"`, щоб перевірити активне завдання генерації музики з підтримкою сесії:

```text
/tool music_generate action=status
```

Приклад прямої генерації:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
  Prompt для генерації музики. Обов'язковий для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` повертає поточне завдання сесії; `"list"` перевіряє провайдерів.
</ParamField>
<ParamField path="model" type="string">
  Перевизначення провайдера/моделі (наприклад `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Необов'язковий текст пісні, коли провайдер підтримує явне введення lyrics.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Запит на instrumental-only результат, коли провайдер це підтримує.
</ParamField>
<ParamField path="image" type="string">
  Шлях або URL до одного reference image.
</ParamField>
<ParamField path="images" type="string[]">
  Кілька reference images (до 10 у провайдерів, які це підтримують).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Цільова тривалість у секундах, коли провайдер підтримує підказки тривалості.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Підказка щодо формату виводу, коли провайдер це підтримує.
</ParamField>
<ParamField path="filename" type="string">Підказка щодо імені вихідного файлу.</ParamField>
<ParamField path="timeoutMs" type="number">Необов'язковий таймаут запиту до провайдера в мілісекундах. Значення нижче 10000ms підвищуються до 10000ms і відображаються в результаті інструмента.</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. OpenClaw усе одно перевіряє жорсткі
обмеження, як-от кількість вхідних даних, перед надсиланням. Коли провайдер підтримує
тривалість, але використовує коротший максимум, ніж запитане значення, OpenClaw
обмежує його найближчою підтримуваною тривалістю. Справді непідтримувані необов'язкові підказки
ігноруються з попередженням, коли вибраний провайдер або модель не може їх
виконати. Результати інструмента повідомляють застосовані налаштування; `details.normalization`
фіксує будь-яке зіставлення запитаного із застосованим.
</Note>

## Асинхронна поведінка

Генерація музики з підтримкою сесії виконується як фонове завдання:

- **Фонове завдання:** `music_generate` створює фонове завдання, одразу повертає
  відповідь про запуск/завдання, а пізніше публікує готовий трек у
  подальшому повідомленні агента.
- **Запобігання дублюванню:** доки завдання має стан `queued` або `running`, наступні
  виклики `music_generate` у тій самій сесії повертають статус завдання замість
  запуску ще однієї генерації. Використовуйте `action: "status"` для явної перевірки.
- **Перегляд статусу:** `openclaw tasks list` або `openclaw tasks show <taskId>`
  перевіряє статуси queued, running і terminal.
- **Пробудження після завершення:** OpenClaw вставляє внутрішню подію завершення назад
  у ту саму сесію, щоб модель могла сама написати follow-up для користувача.
- **Підказка prompt:** пізніші користувацькі/ручні ходи в тій самій сесії отримують невелику
  runtime-підказку, коли музичне завдання вже виконується, щоб модель
  не викликала `music_generate` знову без потреби.
- **Fallback без сесії:** прямі/локальні контексти без реальної сесії агента
  виконуються inline і повертають кінцевий аудіорезультат у тому самому ході.

### Життєвий цикл завдання

| Стан        | Значення                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `queued`    | Завдання створено, очікує прийняття провайдером.                                                                 |
| `running`   | Провайдер обробляє запит (зазвичай від 30 секунд до 3 хвилин залежно від провайдера та тривалості).              |
| `succeeded` | Трек готовий; агент прокидається й публікує його в розмові.                                                      |
| `failed`    | Помилка провайдера або тайм-аут; агент прокидається з подробицями помилки.                                       |

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
2. `musicGenerationModel.primary` з конфігурації.
3. `musicGenerationModel.fallbacks` по порядку.
4. Автовизначення лише за стандартними провайдерами, підкріпленими автентифікацією:
   - спочатку поточний стандартний провайдер;
   - решта зареєстрованих провайдерів генерації музики за порядком ідентифікаторів провайдерів.

Якщо провайдер не спрацьовує, наступний кандидат пробується автоматично. Якщо всі
спроби невдалі, помилка містить подробиці кожної спроби.

Установіть `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати лише
явні записи `model`, `primary` і `fallbacks`.

## Примітки щодо провайдерів

<AccordionGroup>
  <Accordion title="ComfyUI">
    Керується робочим процесом і залежить від налаштованого графа та зіставлення вузлів
    для полів запиту/виводу. Вбудований plugin `comfy` підключається до
    спільного інструмента `music_generate` через реєстр провайдерів
    генерації музики.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Використовує пакетну генерацію Lyria 3. Поточний вбудований потік підтримує
    prompt, необов’язковий текст лірики та необов’язкові еталонні зображення.
  </Accordion>
  <Accordion title="MiniMax">
    Використовує пакетний endpoint `music_generation`. Підтримує prompt, необов’язкову
    лірику, інструментальний режим, керування тривалістю та виведення mp3 через
    автентифікацію API-ключем `minimax` або OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Вибір правильного шляху

- **Спільний шлях на базі провайдерів**, коли потрібні вибір моделі, резервне
  перемикання провайдера та вбудований асинхронний потік завдань/статусу.
- **Шлях Plugin (ComfyUI)**, коли потрібен власний граф робочого процесу або
  провайдер, що не входить до спільної вбудованої можливості для музики.

Якщо ви налагоджуєте поведінку, специфічну для ComfyUI, див.
[ComfyUI](/uk/providers/comfy). Якщо ви налагоджуєте спільну поведінку
провайдера, почніть із [Google (Gemini)](/uk/providers/google) або
[MiniMax](/uk/providers/minimax).

## Режими можливостей провайдера

Спільний контракт генерації музики підтримує явні оголошення режимів:

- `generate` для генерації лише за prompt.
- `edit`, коли запит містить одне або більше еталонних зображень.

Нові реалізації провайдерів мають надавати перевагу явним блокам режимів:

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

Застарілих плоских полів, таких як `maxInputImages`, `supportsLyrics` і
`supportsFormat`, **недостатньо** для оголошення підтримки редагування. Провайдери
мають явно оголошувати `generate` і `edit`, щоб live-тести, контрактні
тести та спільний інструмент `music_generate` могли детерміновано перевіряти
підтримку режимів.

## Live-тести

Live-покриття, яке вмикається вручну, для спільних вбудованих провайдерів:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Обгортка репозиторію:

```bash
pnpm test:live:media music
```

Цей live-файл завантажує відсутні env-змінні провайдера з `~/.profile`, за замовчуванням надає перевагу
live/env API-ключам перед збереженими профілями автентифікації та запускає покриття як
`generate`, так і оголошеного `edit`, коли провайдер вмикає режим редагування.
Поточне покриття:

- `google`: `generate` плюс `edit`
- `minimax`: лише `generate`
- `comfy`: окреме живе покриття Comfy, не спільна перевірка провайдера

Опційне живе покриття для вбудованого музичного шляху ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Файл живих тестів Comfy також охоплює робочі процеси зображень і відео comfy, коли ці
розділи налаштовано.

## Пов’язане

- [Фонові завдання](/uk/automation/tasks) — відстеження завдань для відокремлених запусків `music_generate`
- [ComfyUI](/uk/providers/comfy)
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `musicGenerationModel`
- [Google (Gemini)](/uk/providers/google)
- [MiniMax](/uk/providers/minimax)
- [Моделі](/uk/concepts/models) — конфігурація моделей і відновлення після збоїв
- [Огляд інструментів](/uk/tools)
