---
read_when:
    - Створення музики або аудіо через агента
    - Налаштування провайдерів і моделей генерації музики
    - Розуміння параметрів інструмента music_generate
sidebarTitle: Music generation
summary: Генеруйте музику через music_generate у робочих процесах ComfyUI, fal, Google Lyria, MiniMax і OpenRouter
title: Генерація музики
x-i18n:
    generated_at: "2026-06-27T18:26:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

Інструмент `music_generate` дає агенту змогу створювати музику або аудіо через
спільну можливість генерації музики з налаштованими провайдерами — ComfyUI,
fal, Google, MiniMax і OpenRouter наразі.

Для запусків агента з підтримкою сесії OpenClaw запускає генерацію музики як
фонове завдання, відстежує його в реєстрі завдань, а потім знову будить агента,
коли трек готовий, щоб агент міг повідомити користувача й прикріпити
готове аудіо. Агент завершення дотримується звичайного для сесії режиму
видимої відповіді: автоматична доставка фінальної відповіді, коли це
налаштовано, або `message(action="send")`, коли сесія вимагає інструмент
повідомлень. Якщо сесія запитувача неактивна або її активне пробудження
зазнає невдачі, а частина згенерованого аудіо все ще відсутня у відповіді
завершення, OpenClaw надсилає ідемпотентний прямий резервний варіант лише
з відсутнім аудіо.

<Note>
Вбудований спільний інструмент з’являється лише тоді, коли доступний принаймні
один провайдер генерації музики. Якщо ви не бачите `music_generate` серед
інструментів агента, налаштуйте `agents.defaults.musicGenerationModel` або
додайте API-ключ провайдера.
</Note>

## Швидкий старт

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        Задайте API-ключ принаймні для одного провайдера, наприклад
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
        _"Згенеруй бадьорий синтпоп-трек про нічну поїздку крізь
        неонове місто."_

        Агент автоматично викликає `music_generate`. Додавати інструмент
        до списку дозволених не потрібно.
      </Step>
    </Steps>

    Для прямих синхронних контекстів без запуску агента з підтримкою сесії
    вбудований інструмент усе одно повертається до вбудованої генерації та
    повертає фінальний шлях до медіа в результаті інструмента.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Налаштуйте `plugins.entries.comfy.config.music` за допомогою workflow
        JSON і вузлів prompt/output.
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

Приклади prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Підтримувані провайдери

| Провайдер  | Модель за замовчуванням       | Вхідні референси | Підтримувані елементи керування                      | Автентифікація                         |
| ---------- | ----------------------------- | ---------------- | ---------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                    | До 1 зображення  | Музика або аудіо, визначені workflow                 | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`   | Немає            | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` або `FAL_API_KEY`            |
| Google     | `lyria-3-clip-preview`        | До 10 зображень  | `lyrics`, `instrumental`, `format`                   | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                   | Немає            | `lyrics`, `instrumental`, `format=mp3`               | `MINIMAX_API_KEY` або MiniMax OAuth    |
| OpenRouter | `google/lyria-3-pro-preview`  | До 1 зображення  | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### Матриця можливостей

Явний контракт режимів, який використовують `music_generate`, контрактні тести
та спільна live-перевірка:

| Провайдер  | `generate` | `edit` | Ліміт редагування | Спільні live-доріжки                                                        |
| ---------- | :--------: | :----: | ----------------- | --------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 зображення      | Не входить до спільної перевірки; покрито `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Немає             | `generate`                                                                  |
| Google     |     ✓      |   ✓    | 10 зображень      | `generate`, `edit`                                                          |
| MiniMax    |     ✓      |   —    | Немає             | `generate`                                                                  |
| OpenRouter |     ✓      |   ✓    | 1 зображення      | `generate`, `edit`                                                          |

Використовуйте `action: "list"`, щоб під час виконання переглянути доступні
спільні провайдери та моделі:

```text
/tool music_generate action=list
```

Використовуйте `action: "status"`, щоб переглянути активне завдання генерації
музики з підтримкою сесії:

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
  Перевизначення провайдера/моделі (наприклад, `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Необов’язковий текст пісні, коли провайдер підтримує явне введення lyrics.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Запитати лише інструментальний результат, коли провайдер це підтримує.
</ParamField>
<ParamField path="image" type="string">
  Один шлях до референсного зображення або URL.
</ParamField>
<ParamField path="images" type="string[]">
  Кілька референсних зображень (до 10 у провайдерів, що це підтримують).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Цільова тривалість у секундах, коли провайдер підтримує підказки тривалості.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Підказка щодо формату виводу, коли провайдер її підтримує.
</ParamField>
<ParamField path="filename" type="string">Підказка щодо імені вихідного файлу.</ParamField>

<Note>
Не всі провайдери підтримують усі параметри. OpenClaw все одно перевіряє жорсткі
обмеження, як-от кількість вхідних даних, до надсилання. Коли провайдер підтримує
тривалість, але використовує менший максимум, ніж запитане значення, OpenClaw
обмежує його найближчою підтримуваною тривалістю. Справді непідтримувані
необов’язкові підказки ігноруються з попередженням, коли вибраний провайдер або
модель не може їх виконати. Результати інструмента повідомляють застосовані
налаштування; `details.normalization` фіксує будь-яке зіставлення
запитаного із застосованим.
</Note>

Тайм-аути запитів до провайдера є лише операторською конфігурацією. OpenClaw
використовує `agents.defaults.musicGenerationModel.timeoutMs`, коли його
налаштовано, підвищує значення нижче 120000ms до 120000ms, а в іншому разі
за замовчуванням встановлює для запитів до провайдера 300000ms.

## Асинхронна поведінка

Генерація музики з підтримкою сесії виконується як фонове завдання:

- **Фонове завдання:** `music_generate` створює фонове завдання, негайно
  повертає відповідь про запуск/завдання, а пізніше публікує готовий трек
  у наступному повідомленні агента.
- **Запобігання дублюванню:** доки завдання має стан `queued` або `running`,
  подальші виклики `music_generate` у тій самій сесії повертають статус
  завдання замість запуску ще однієї генерації. Використовуйте
  `action: "status"`, щоб перевірити явно.
- **Перегляд статусу:** `openclaw tasks list` або `openclaw tasks show <taskId>`
  показує статус queued, running і термінальний статус.
- **Пробудження після завершення:** OpenClaw вводить внутрішню подію завершення
  назад у ту саму сесію, щоб модель сама могла написати наступну відповідь
  для користувача.
- **Підказка prompt:** подальші користувацькі/ручні ходи в тій самій сесії
  отримують невелику runtime-підказку, коли завдання генерації музики вже
  виконується, щоб модель не викликала `music_generate` наосліп знову.
- **Резервний варіант без сесії:** прямі/локальні контексти без реальної
  сесії агента виконуються вбудовано й повертають фінальний аудіорезультат
  у тому самому ході.

### Життєвий цикл завдання

| Стан        | Значення                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------- |
| `queued`    | Завдання створено, очікує, доки провайдер його прийме.                                       |
| `running`   | Провайдер обробляє (зазвичай від 30 секунд до 3 хвилин залежно від провайдера й тривалості). |
| `succeeded` | Трек готовий; агент прокидається й публікує його в розмові.                                  |
| `failed`    | Помилка або тайм-аут провайдера; агент прокидається з деталями помилки.                      |

Перевірка статусу з CLI:

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
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Порядок вибору провайдера

OpenClaw пробує провайдерів у такому порядку:

1. Параметр `model` із виклику інструмента (якщо агент його вказує).
2. `musicGenerationModel.primary` з конфігурації.
3. `musicGenerationModel.fallbacks` за порядком.
4. Автовиявлення лише за замовчуваннями провайдера з налаштованою автентифікацією:
   - спочатку поточний провайдер за замовчуванням;
   - решта зареєстрованих провайдерів генерації музики в порядку provider-id.

Якщо провайдер зазнає невдачі, наступний кандидат пробується автоматично.
Якщо не вдається жоден, помилка містить деталі кожної спроби.

Задайте `agents.defaults.mediaGenerationAutoProviderFallback: false`, щоб
використовувати лише явні записи `model`, `primary` і `fallbacks`.

## Примітки щодо провайдерів

<AccordionGroup>
  <Accordion title="ComfyUI">
    Керується workflow і залежить від налаштованого графа та зіставлення вузлів
    для полів prompt/output. Вбудований Plugin `comfy` підключається до
    спільного інструмента `music_generate` через реєстр провайдерів
    генерації музики.
  </Accordion>
  <Accordion title="fal">
    Використовує endpoints моделей fal через спільний шлях автентифікації
    провайдера. Вбудований провайдер за замовчуванням використовує
    `fal-ai/minimax-music/v2.6`, а також надає `fal-ai/ace-step/prompt-to-audio`
    і `fal-ai/stable-audio-25/text-to-audio` для запитів prompt-to-audio.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Використовує пакетну генерацію Lyria 3. Поточний вбудований потік
    підтримує prompt, необов’язковий текст lyrics і необов’язкові
    референсні зображення.
  </Accordion>
  <Accordion title="MiniMax">
    Використовує пакетний endpoint `music_generation`. Підтримує prompt,
    необов’язкові lyrics, інструментальний режим і mp3-вивід через
    автентифікацію API-ключем `minimax` або OAuth `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    Використовує аудіовихід OpenRouter chat completions з увімкненим
    streaming. Вбудований провайдер за замовчуванням використовує
    `google/lyria-3-pro-preview`, а також надає
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Вибір правильного шляху

- **Спільний шлях із підтримкою провайдерів** — коли потрібні вибір моделі,
  перемикання між провайдерами у разі збою та вбудований асинхронний потік
  завдання/статусу.
- **Шлях Plugin (ComfyUI)** — коли потрібен власний граф workflow або
  провайдер, який не входить до спільної вбудованої можливості генерації
  музики.

Якщо ви налагоджуєте поведінку, специфічну для ComfyUI, див.
[ComfyUI](/uk/providers/comfy). Якщо ви налагоджуєте спільну поведінку
провайдера, почніть із [fal](/uk/providers/fal), [Google (Gemini)](/uk/providers/google),
[MiniMax](/uk/providers/minimax) або [OpenRouter](/uk/providers/openrouter).

## Режими можливостей провайдера

Спільний контракт генерації музики підтримує явні оголошення режимів:

- `generate` для генерації лише за промптом.
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

Застарілих пласких полів, як-от `maxInputImages`, `supportsLyrics` і
`supportsFormat`, **недостатньо**, щоб оголосити підтримку редагування. Провайдери
мають явно оголошувати `generate` і `edit`, щоб live-тести, контрактні
тести та спільний інструмент `music_generate` могли детерміновано перевіряти
підтримку режимів.

## Live-тести

Опціональне live-покриття для спільних вбудованих провайдерів:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Обгортка репозиторію:

```bash
pnpm test:live:media music
```

Цей live-файл за замовчуванням використовує вже експортовані env vars провайдера
перед збереженими профілями автентифікації та запускає покриття для `generate`
і оголошеного `edit`, коли провайдер увімкнув режим редагування. Поточне покриття:

- `google`: `generate` плюс `edit`
- `fal`: лише `generate`
- `minimax`: лише `generate`
- `openrouter`: `generate` плюс `edit`
- `comfy`: окреме live-покриття Comfy, не спільний обхід провайдерів

Опціональне live-покриття для вбудованого музичного шляху ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Live-файл Comfy також покриває робочі процеси зображень і відео comfy, коли ці
розділи налаштовані.

## Пов’язане

- [Фонові завдання](/uk/automation/tasks) — відстеження завдань для від’єднаних запусків `music_generate`
- [ComfyUI](/uk/providers/comfy)
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `musicGenerationModel`
- [Google (Gemini)](/uk/providers/google)
- [MiniMax](/uk/providers/minimax)
- [Моделі](/uk/concepts/models) — конфігурація моделей і перемикання після збою
- [Огляд інструментів](/uk/tools)
