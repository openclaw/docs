---
read_when:
    - Генерування музики або аудіо через агента
    - Налаштування постачальників і моделей генерації музики
    - Розуміння параметрів інструмента music_generate
sidebarTitle: Music generation
summary: Генеруйте музику через music_generate у робочих процесах Google Lyria, MiniMax і ComfyUI
title: Генерація музики
x-i18n:
    generated_at: "2026-05-05T00:49:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e14a5a10dd485c2d3dbbd23a0fc2c12de500d9f7bfb7db471c27ed2a99ad650
    source_path: tools/music-generation.md
    workflow: 16
---

Інструмент `music_generate` дає агенту змогу створювати музику або аудіо через
спільну можливість генерації музики з налаштованими провайдерами — Google,
MiniMax і налаштованим через workflow ComfyUI на сьогодні.

Для запусків агента із session-backed OpenClaw запускає генерацію музики як
фонове завдання, відстежує його в журналі завдань, а потім знову пробуджує агента,
коли трек готовий, щоб агент міг повідомити користувача й прикріпити
готове аудіо. У групових/канальних чатах, які використовують видиму доставку
лише через інструмент повідомлень, агент передає результат через інструмент повідомлень.

<Note>
Вбудований спільний інструмент з’являється лише тоді, коли доступний хоча б один
провайдер генерації музики. Якщо ви не бачите `music_generate` серед інструментів
вашого агента, налаштуйте `agents.defaults.musicGenerationModel` або задайте
API-ключ провайдера.
</Note>

## Швидкий старт

<Tabs>
  <Tab title="На основі спільного провайдера">
    <Steps>
      <Step title="Налаштуйте автентифікацію">
        Задайте API-ключ принаймні для одного провайдера — наприклад
        `GEMINI_API_KEY` або `MINIMAX_API_KEY`.
      </Step>
      <Step title="Виберіть модель за замовчуванням (необов’язково)">
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
        _"Згенеруй бадьорий synthpop-трек про нічну поїздку через
        неонове місто."_

        Агент автоматично викликає `music_generate`. Список дозволених
        інструментів не потрібен.
      </Step>
    </Steps>

    Для прямих синхронних контекстів без запуску агента із session-backed
    вбудований інструмент усе одно повертається до inline-генерації та повертає
    фінальний шлях до медіа в результаті інструмента.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Налаштуйте workflow">
        Налаштуйте `plugins.entries.comfy.config.music` із workflow
        JSON і вузлами prompt/output.
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

Приклади prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Підтримувані провайдери

| Провайдер | Модель за замовчуванням | Вхідні reference | Підтримувані елементи керування                         | Автентифікація                         |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | До 1 зображення  | Визначена workflow музика або аудіо                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | До 10 зображень  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Немає            | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` або MiniMax OAuth    |

### Матриця можливостей

Явний контракт режимів, який використовують `music_generate`, контрактні тести й
спільний live sweep:

| Провайдер | `generate` | `edit` | Ліміт редагування | Спільні live lanes                                                        |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 зображення | Не входить до спільного sweep; покривається `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 зображень | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Немає       | `generate`                                                                |

Використовуйте `action: "list"`, щоб переглянути доступних спільних провайдерів і моделі
під час виконання:

```text
/tool music_generate action=list
```

Використовуйте `action: "status"`, щоб переглянути активне session-backed завдання музики:

```text
/tool music_generate action=status
```

Приклад прямої генерації:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
  Prompt для генерації музики. Обов’язковий для `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` повертає поточне завдання сесії; `"list"` перевіряє провайдерів.
</ParamField>
<ParamField path="model" type="string">
  Перевизначення провайдера/моделі (наприклад `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Необов’язковий текст lyrics, коли провайдер підтримує явне введення lyrics.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Запросити лише інструментальний результат, коли провайдер це підтримує.
</ParamField>
<ParamField path="image" type="string">
  Шлях або URL до одного reference-зображення.
</ParamField>
<ParamField path="images" type="string[]">
  Кілька reference-зображень (до 10 у провайдерів, які це підтримують).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Цільова тривалість у секундах, коли провайдер підтримує підказки щодо тривалості.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Підказка формату виводу, коли провайдер це підтримує.
</ParamField>
<ParamField path="filename" type="string">Підказка імені файлу виводу.</ParamField>
<ParamField path="timeoutMs" type="number">Необов’язковий timeout запиту до провайдера в мілісекундах. Значення нижче 10000ms підвищуються до 10000ms і повідомляються в результаті інструмента.</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. OpenClaw усе одно перевіряє жорсткі
ліміти, як-от кількість вхідних даних, перед надсиланням. Коли провайдер підтримує
тривалість, але має коротший максимум, ніж запитане значення, OpenClaw
обмежує його до найближчої підтримуваної тривалості. Справді непідтримувані
необов’язкові підказки ігноруються з попередженням, коли вибраний провайдер або модель
не може їх виконати. Результати інструмента повідомляють застосовані налаштування;
`details.normalization` фіксує будь-яке зіставлення запитаного із застосованим.
</Note>

## Асинхронна поведінка

Session-backed генерація музики виконується як фонове завдання:

- **Фонове завдання:** `music_generate` створює фонове завдання, негайно повертає
  відповідь started/task і публікує готовий трек пізніше в подальшому
  повідомленні агента.
- **Запобігання дублікатам:** поки завдання має стан `queued` або `running`, наступні
  виклики `music_generate` у тій самій сесії повертають статус завдання замість
  запуску ще однієї генерації. Використовуйте `action: "status"` для явної перевірки.
- **Перегляд статусу:** `openclaw tasks list` або `openclaw tasks show <taskId>`
  перевіряє queued, running і terminal status.
- **Пробудження після завершення:** OpenClaw вводить внутрішню подію завершення назад
  у ту саму сесію, щоб модель могла сама написати подальше повідомлення
  для користувача.
- **Підказка prompt:** подальші користувацькі/ручні ходи в тій самій сесії отримують невелику
  runtime-підказку, коли музичне завдання вже виконується, щоб модель
  не викликала `music_generate` знову наосліп.
- **Fallback без сесії:** прямі/локальні контексти без реальної сесії агента
  виконуються inline і повертають фінальний аудіорезультат у тому самому ході.

### Життєвий цикл завдання

| Стан        | Значення                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Завдання створено, очікує, поки провайдер його прийме.                                         |
| `running`   | Провайдер обробляє запит (зазвичай від 30 секунд до 3 хвилин залежно від провайдера й тривалості). |
| `succeeded` | Трек готовий; агент пробуджується й публікує його в розмові.                                  |
| `failed`    | Помилка провайдера або timeout; агент пробуджується з деталями помилки.                        |

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

### Порядок вибору провайдерів

OpenClaw пробує провайдерів у такому порядку:

1. Параметр `model` із виклику інструмента (якщо агент його вказує).
2. `musicGenerationModel.primary` із конфігурації.
3. `musicGenerationModel.fallbacks` за порядком.
4. Автовиявлення лише з використанням стандартних провайдерів із автентифікацією:
   - спочатку поточний провайдер за замовчуванням;
   - решта зареєстрованих провайдерів генерації музики в порядку provider-id.

Якщо провайдер завершується помилкою, наступний кандидат пробується автоматично. Якщо всі
завершуються помилкою, помилка містить деталі кожної спроби.

Задайте `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб використовувати лише
явні записи `model`, `primary` і `fallbacks`.

## Нотатки про провайдерів

<AccordionGroup>
  <Accordion title="ComfyUI">
    Керується workflow і залежить від налаштованого графа та зіставлення вузлів
    для полів prompt/output. Вбудований Plugin `comfy` підключається до
    спільного інструмента `music_generate` через реєстр провайдерів
    генерації музики.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Використовує пакетну генерацію Lyria 3. Поточний вбудований потік підтримує
    prompt, необов’язковий текст lyrics і необов’язкові reference-зображення.
  </Accordion>
  <Accordion title="MiniMax">
    Використовує пакетний endpoint `music_generation`. Підтримує prompt, необов’язкові
    lyrics, інструментальний режим, керування тривалістю та mp3-вивід через
    автентифікацію API-ключем `minimax` або OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Вибір правильного шляху

- **На основі спільного провайдера**, коли вам потрібні вибір моделі, відмовостійке
  перемикання провайдерів і вбудований async потік завдання/статусу.
- **Шлях Plugin (ComfyUI)**, коли вам потрібен власний граф workflow або
  провайдер, який не входить до спільної вбудованої можливості музики.

Якщо ви налагоджуєте поведінку, специфічну для ComfyUI, див.
[ComfyUI](/uk/providers/comfy). Якщо ви налагоджуєте поведінку спільного провайдера,
почніть із [Google (Gemini)](/uk/providers/google) або
[MiniMax](/uk/providers/minimax).

## Режими можливостей провайдера

Спільний контракт генерації музики підтримує явні оголошення режимів:

- `generate` для генерації лише за prompt.
- `edit`, коли запит містить одне або кілька reference-зображень.

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

Застарілих плоских полів, як-от `maxInputImages`, `supportsLyrics` і
`supportsFormat`, **недостатньо**, щоб оголосити підтримку edit. Провайдери
мають явно оголошувати `generate` і `edit`, щоб live-тести, контрактні
тести та спільний інструмент `music_generate` могли детерміновано перевіряти
підтримку режимів.

## Live-тести

Opt-in live-покриття для спільних вбудованих провайдерів:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Обгортка репозиторію:

```bash
pnpm test:live:media music
```

Цей live-файл завантажує відсутні env vars провайдерів із `~/.profile`, за замовчуванням надає
перевагу live/env API-ключам перед збереженими auth profiles і запускає покриття
`generate` та оголошене `edit`, коли провайдер вмикає режим edit. Поточне покриття:

- `google`: `generate` плюс `edit`
- `minimax`: лише `generate`
- `comfy`: окреме live-покриття Comfy, не спільний provider sweep

Opt-in live-покриття для вбудованого музичного шляху ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Live-файл Comfy також охоплює робочі процеси зображень і відео comfy, коли ці
розділи налаштовано.

## Пов’язане

- [Фонові завдання](/uk/automation/tasks) — відстеження завдань для відокремлених запусків `music_generate`
- [ComfyUI](/uk/providers/comfy)
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `musicGenerationModel`
- [Google (Gemini)](/uk/providers/google)
- [MiniMax](/uk/providers/minimax)
- [Моделі](/uk/concepts/models) — конфігурація моделей і перемикання в разі збою
- [Огляд інструментів](/uk/tools)
