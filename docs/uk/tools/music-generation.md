---
read_when:
    - Генерація музики або аудіо через агента
    - Налаштування providers і моделей для генерації музики
    - Розуміння параметрів інструмента music_generate
summary: Генерувати музику зі спільними providers, включно з plugins на основі workflow
title: Генерація музики
x-i18n:
    generated_at: "2026-04-23T21:16:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b03922bf032586f649e677d1d8c08250b1fd5dc95f1cdde050a058562feb3da
    source_path: tools/music-generation.md
    workflow: 15
---

Інструмент `music_generate` дає агенту змогу створювати музику або аудіо через
спільну можливість генерації музики з налаштованими providers, такими як Google,
MiniMax і ComfyUI, налаштований через workflow.

Для агентних сесій на основі спільних providers OpenClaw запускає генерацію музики як
фонове завдання, відстежує його в task ledger, а потім знову пробуджує агента, коли
трек готовий, щоб агент міг опублікувати готове аудіо назад у вихідний канал.

<Note>
Вбудований спільний інструмент з’являється лише тоді, коли доступний принаймні один provider генерації музики. Якщо ви не бачите `music_generate` серед інструментів агента, налаштуйте `agents.defaults.musicGenerationModel` або задайте API-ключ provider.
</Note>

## Швидкий старт

### Генерація на основі спільних providers

1. Задайте API-ключ принаймні для одного provider, наприклад `GEMINI_API_KEY` або
   `MINIMAX_API_KEY`.
2. За бажанням задайте бажану модель:

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

3. Попросіть агента: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

Агент автоматично викличе `music_generate`. Додавання в allow-list інструментів не потрібне.

Для прямих синхронних контекстів без agent-run на основі сесії вбудований
інструмент усе одно повертається до inline-генерації та повертає фінальний шлях до media в
результаті інструмента.

Приклади prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Генерація Comfy на основі workflow

Вбудований plugin `comfy` підключається до спільного інструмента `music_generate` через
registry provider генерації музики.

1. Налаштуйте `models.providers.comfy.music` із JSON workflow та
   вузлами prompt/output.
2. Якщо ви використовуєте Comfy Cloud, задайте `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY`.
3. Попросіть агента згенерувати музику або викличте інструмент напряму.

Приклад:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Підтримка вбудованих shared providers

| Provider | Типова модель         | Опорні входи      | Підтримувані елементи керування                       | API-ключ                               |
| -------- | --------------------- | ----------------- | ---------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`            | До 1 зображення   | Музика або аудіо, визначені workflow                  | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | До 10 зображень  | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`          | Немає             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                 |

### Матриця оголошених можливостей

Це явний контракт режимів, який використовують `music_generate`, contract tests
і shared live sweep.

| Provider | `generate` | `edit` | Ліміт edit | Shared live lanes                                                         |
| -------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  | Так        | Так    | 1 зображення | Не входить до shared sweep; покривається в `extensions/comfy/comfy.live.test.ts` |
| Google   | Так        | Так    | 10 зображень | `generate`, `edit`                                                        |
| MiniMax  | Так        | Ні     | Немає       | `generate`                                                                |

Використовуйте `action: "list"`, щоб переглянути доступні shared providers і моделі під час
виконання:

```text
/tool music_generate action=list
```

Використовуйте `action: "status"`, щоб переглянути активне завдання генерації музики, прив’язане до поточної сесії:

```text
/tool music_generate action=status
```

Приклад прямої генерації:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Параметри вбудованого інструмента

| Параметр          | Тип       | Опис                                                                                           |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `prompt`          | string    | Prompt для генерації музики (обов’язковий для `action: "generate"`)                            |
| `action`          | string    | `"generate"` (типово), `"status"` для поточного завдання сесії, або `"list"` для перегляду providers |
| `model`           | string    | Перевизначення provider/model, наприклад `google/lyria-3-pro-preview` або `comfy/workflow`    |
| `lyrics`          | string    | Необов’язковий текст пісні, якщо provider підтримує явний ввід lyrics                          |
| `instrumental`    | boolean   | Запросити лише інструментальний вивід, якщо provider це підтримує                              |
| `image`           | string    | Шлях або URL одного опорного зображення                                                        |
| `images`          | string[]  | Кілька опорних зображень (до 10)                                                               |
| `durationSeconds` | number    | Бажана тривалість у секундах, якщо provider підтримує підказки тривалості                      |
| `format`          | string    | Підказка щодо формату виводу (`mp3` або `wav`), якщо provider це підтримує                     |
| `filename`        | string    | Підказка для імені вихідного файла                                                             |

Не всі providers підтримують усі параметри. OpenClaw усе одно перевіряє жорсткі обмеження,
такі як кількість входів, до надсилання. Коли provider підтримує тривалість, але
має коротший максимум, ніж запитане значення, OpenClaw автоматично обмежує
його до найближчої підтримуваної тривалості. Справді непідтримувані необов’язкові підказки ігноруються
з попередженням, коли вибраний provider або модель не може їх виконати.

Результати інструмента повідомляють застосовані налаштування. Коли OpenClaw обмежує тривалість під час fallback provider, повернуте `durationSeconds` відображає надіслане значення, а `details.normalization.durationSeconds` показує перетворення від запитаного до застосованого.

## Асинхронна поведінка для шляху на основі shared providers

- Agent-run на основі сесії: `music_generate` створює фонове завдання, негайно повертає started/task response, а готовий трек публікує пізніше в follow-up повідомленні агента.
- Запобігання дублюванню: поки фонове завдання в тій самій сесії ще має стан `queued` або `running`, подальші виклики `music_generate` повертають статус завдання замість запуску нової генерації.
- Перевірка статусу: використовуйте `action: "status"`, щоб переглянути активне завдання генерації музики, прив’язане до поточної сесії, не запускаючи нову генерацію.
- Відстеження завдань: використовуйте `openclaw tasks list` або `openclaw tasks show <taskId>`, щоб переглядати статус queued, running і terminal для генерації.
- Пробудження після завершення: OpenClaw ін’єктує внутрішню подію завершення назад у ту саму сесію, щоб модель могла сама написати follow-up для користувача.
- Підказка в prompt: подальші user/manual turns у тій самій сесії отримують невелику runtime-підказку, коли завдання генерації музики вже виконується, щоб модель не викликала `music_generate` повторно всліпу.
- Резервний варіант без сесії: прямі/локальні контексти без реальної agent-сесії все одно виконуються inline і повертають фінальний результат аудіо в тому самому turn.

### Життєвий цикл завдання

Кожен запит `music_generate` проходить через чотири стани:

1. **queued** -- завдання створено, воно чекає, поки provider прийме його.
2. **running** -- provider обробляє його (зазвичай від 30 секунд до 3 хвилин, залежно від provider і тривалості).
3. **succeeded** -- трек готовий; агент пробуджується і публікує його в розмову.
4. **failed** -- помилка provider або timeout; агент пробуджується з деталями помилки.

Перевірка статусу з CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Запобігання дублюванню: якщо для поточної сесії завдання музики вже має стан `queued` або `running`, `music_generate` повертає статус наявного завдання замість запуску нового. Використовуйте `action: "status"`, щоб явно перевірити це без запуску нової генерації.

## Конфігурація

### Вибір моделі

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Порядок вибору provider

Під час генерації музики OpenClaw пробує providers у такому порядку:

1. параметр `model` із виклику інструмента, якщо агент його вказує
2. `musicGenerationModel.primary` з config
3. `musicGenerationModel.fallbacks` у заданому порядку
4. Автовизначення, використовуючи лише типові значення providers, підкріплені auth:
   - спочатку поточний типовий provider
   - далі решта зареєстрованих providers генерації музики в порядку provider-id

Якщо provider не спрацьовує, автоматично пробується наступний кандидат. Якщо не спрацьовують усі, помилка
містить подробиці кожної спроби.

Установіть `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете,
щоб генерація музики використовувала лише явні записи `model`, `primary` і `fallbacks`.

## Примітки щодо providers

- Google використовує пакетну генерацію Lyria 3. Поточний вбудований потік підтримує
  prompt, необов’язковий текст lyrics і необов’язкові опорні зображення.
- MiniMax використовує пакетний ендпоінт `music_generation`. Поточний вбудований потік
  підтримує prompt, необов’язкові lyrics, instrumental mode, керування тривалістю і
  вивід у mp3.
- Підтримка ComfyUI керується workflow і залежить від налаштованого графа та
  зіставлення вузлів для полів prompt/output.

## Режими можливостей provider

Спільний контракт генерації музики тепер підтримує явні оголошення режимів:

- `generate` для генерації лише за prompt
- `edit`, коли запит містить одне або кілька опорних зображень

Нові реалізації providers повинні надавати перевагу явним блокам режимів:

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
`supportsFormat`, недостатньо, щоб оголосити підтримку edit. Providers повинні
явно оголошувати `generate` і `edit`, щоб live tests, contract tests і
спільний інструмент `music_generate` могли детерміновано перевіряти підтримку режимів.

## Вибір правильного шляху

- Використовуйте шлях на основі shared providers, коли вам потрібні вибір моделі, failover provider і вбудований асинхронний потік task/status.
- Використовуйте шлях plugin, наприклад ComfyUI, коли вам потрібен власний граф workflow або provider, який не входить до shared bundled capability генерації музики.
- Якщо ви налагоджуєте поведінку, специфічну для ComfyUI, див. [ComfyUI](/uk/providers/comfy). Якщо ви налагоджуєте поведінку shared providers, почніть з [Google (Gemini)](/uk/providers/google) або [MiniMax](/uk/providers/minimax).

## Live tests

Opt-in live-покриття для shared bundled providers:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Обгортка репозиторію:

```bash
pnpm test:live:media music
```

Цей live-файл завантажує відсутні env vars provider з `~/.profile`, типово надає
перевагу live/env API-ключам над збереженими auth profiles і запускає покриття
і для `generate`, і для оголошеного `edit`, коли provider вмикає режим edit.

Сьогодні це означає:

- `google`: `generate` плюс `edit`
- `minimax`: лише `generate`
- `comfy`: окреме live-покриття Comfy, не shared provider sweep

Opt-in live-покриття для bundled-шляху музики ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Live-файл Comfy також покриває workflows зображень і відео comfy, коли ці
розділи налаштовані.

## Пов’язане

- [Фонові завдання](/uk/automation/tasks) - відстеження завдань для відокремлених запусків `music_generate`
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults) - config `musicGenerationModel`
- [ComfyUI](/uk/providers/comfy)
- [Google (Gemini)](/uk/providers/google)
- [MiniMax](/uk/providers/minimax)
- [Models](/uk/concepts/models) - конфігурація моделей і failover
- [Огляд Tools](/uk/tools)
