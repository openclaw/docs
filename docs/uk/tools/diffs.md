---
read_when:
    - Ви хочете, щоб агенти показували редагування коду або markdown як diff-ы
    - You want a canvas-ready viewer URL or a rendered diff file
    - Вам потрібні контрольовані тимчасові артефакти diff з безпечними типовими налаштуваннями
summary: Переглядач diff лише для читання та renderer файлів для агентів (необов’язковий Plugin tool)
title: Diffs
x-i18n:
    generated_at: "2026-04-23T21:14:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` — це необов’язковий Plugin tool з короткими вбудованими системними вказівками та супровідним Skill, який перетворює вміст змін на артефакт diff лише для читання для агентів.

Він приймає або:

- текст `before` і `after`
- unified `patch`

Він може повертати:

- URL переглядача gateway для представлення в canvas
- шлях до rendered-файла (PNG або PDF) для доставки повідомленням
- обидва варіанти в одному виклику

Коли Plugin увімкнено, він додає стислі вказівки щодо використання в простір system prompt, а також відкриває детальний Skill для випадків, коли агенту потрібні повніші інструкції.

## Швидкий старт

1. Увімкніть Plugin.
2. Викликайте `diffs` з `mode: "view"` для потоків, орієнтованих на canvas.
3. Викликайте `diffs` з `mode: "file"` для потоків доставки файлів у чат.
4. Викликайте `diffs` з `mode: "both"`, коли вам потрібні обидва артефакти.

## Увімкнення Plugin

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## Вимкнення вбудованих системних вказівок

Якщо ви хочете залишити tool `diffs` увімкненим, але вимкнути його вбудовані вказівки в system prompt, установіть `plugins.entries.diffs.hooks.allowPromptInjection` у `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Це блокує hook `before_prompt_build` Plugin `diffs`, водночас зберігаючи доступними сам Plugin, tool і супровідний Skill.

Якщо ви хочете вимкнути і вказівки, і tool, натомість вимкніть сам Plugin.

## Типовий робочий процес агента

1. Агент викликає `diffs`.
2. Агент читає поля `details`.
3. Агент або:
   - відкриває `details.viewerUrl` через `canvas present`
   - надсилає `details.filePath` через `message`, використовуючи `path` або `filePath`
   - робить і те, і інше

## Приклади вводу

Before і after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Довідник по вводу tool

Усі поля необов’язкові, якщо не зазначено інше:

- `before` (`string`): початковий текст. Обов’язковий разом із `after`, коли `patch` пропущено.
- `after` (`string`): оновлений текст. Обов’язковий разом із `before`, коли `patch` пропущено.
- `patch` (`string`): текст unified diff. Взаємовиключний з `before` і `after`.
- `path` (`string`): відображуване ім’я файла для режиму before/after.
- `lang` (`string`): підказка перевизначення мови для режиму before/after. Невідомі значення повертаються до plain text.
- `title` (`string`): перевизначення заголовка переглядача.
- `mode` (`"view" | "file" | "both"`): режим виводу. Типово використовується значення Plugin `defaults.mode`.
  Застарілий псевдонім: `"image"` поводиться як `"file"` і все ще приймається для зворотної сумісності.
- `theme` (`"light" | "dark"`): тема переглядача. Типово використовується значення Plugin `defaults.theme`.
- `layout` (`"unified" | "split"`): макет diff. Типово використовується значення Plugin `defaults.layout`.
- `expandUnchanged` (`boolean`): розгортати незмінені секції, коли повний контекст доступний. Параметр лише для окремого виклику (не є ключем типових значень Plugin).
- `fileFormat` (`"png" | "pdf"`): формат rendered-файла. Типово використовується значення Plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): профіль якості для рендерингу PNG або PDF.
- `fileScale` (`number`): перевизначення масштабу пристрою (`1`-`4`).
- `fileMaxWidth` (`number`): максимальна ширина рендерингу в CSS-пікселях (`640`-`2400`).
- `ttlSeconds` (`number`): TTL артефакта в секундах для переглядача й окремих файлових виводів. Типово 1800, максимум 21600.
- `baseUrl` (`string`): перевизначення origin URL переглядача. Перевизначає Plugin `viewerBaseUrl`. Має бути `http` або `https`, без query/hash.

Застарілі псевдоніми вводу все ще приймаються для зворотної сумісності:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Валідація та обмеження:

- `before` і `after` — максимум 512 KiB кожен.
- `patch` — максимум 2 MiB.
- `path` — максимум 2048 байтів.
- `lang` — максимум 128 байтів.
- `title` — максимум 1024 байтів.
- Обмеження складності patch: максимум 128 файлів і 120000 рядків загалом.
- Одночасне використання `patch` разом із `before` або `after` відхиляється.
- Обмеження безпеки rendered-файлів (застосовуються до PNG і PDF):
  - `fileQuality: "standard"`: максимум 8 MP (8,000,000 rendered pixels).
  - `fileQuality: "hq"`: максимум 14 MP (14,000,000 rendered pixels).
  - `fileQuality: "print"`: максимум 24 MP (24,000,000 rendered pixels).
  - Для PDF також діє максимум 50 сторінок.

## Контракт виводу details

Tool повертає структуровані метадані в `details`.

Спільні поля для режимів, які створюють переглядач:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, якщо доступні)

Поля файла, коли рендериться PNG або PDF:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (те саме значення, що й `filePath`, для сумісності з tool `message`)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Псевдоніми сумісності також повертаються для наявних викликачів:

- `format` (те саме значення, що й `fileFormat`)
- `imagePath` (те саме значення, що й `filePath`)
- `imageBytes` (те саме значення, що й `fileBytes`)
- `imageQuality` (те саме значення, що й `fileQuality`)
- `imageScale` (те саме значення, що й `fileScale`)
- `imageMaxWidth` (те саме значення, що й `fileMaxWidth`)

Підсумок поведінки за режимами:

- `mode: "view"`: лише поля переглядача.
- `mode: "file"`: лише поля файла, без артефакта переглядача.
- `mode: "both"`: поля переглядача плюс поля файла. Якщо рендеринг файла завершується помилкою, переглядач усе одно повертається з `fileError` і псевдонімом сумісності `imageError`.

## Згорнуті незмінені секції

- Переглядач може показувати рядки на кшталт `N unmodified lines`.
- Елементи керування розгортанням на цих рядках є умовними й не гарантуються для кожного типу вводу.
- Елементи керування розгортанням з’являються, коли rendered diff має розгортані дані контексту, що типово для вводу before/after.
- Для багатьох unified patch input пропущені тіла контексту недоступні в розібраних patch hunks, тому рядок може з’являтися без елементів керування розгортанням. Це очікувана поведінка.
- `expandUnchanged` застосовується лише тоді, коли існує розгортаний контекст.

## Типові значення Plugin

Задайте загальні типові значення Plugin у `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

Підтримувані типові значення:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

Явні параметри tool перевизначають ці типові значення.

Постійна конфігурація URL переглядача:

- `viewerBaseUrl` (`string`, необов’язково)
  - Plugin-owned fallback для повернених посилань переглядача, коли виклик tool не передає `baseUrl`.
  - Має бути `http` або `https`, без query/hash.

Приклад:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Конфігурація безпеки

- `security.allowRemoteViewer` (`boolean`, типово `false`)
  - `false`: запити не через loopback до маршрутів переглядача відхиляються.
  - `true`: віддалені переглядачі дозволені, якщо tokenized path валідний.

Приклад:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Життєвий цикл артефактів і сховище

- Артефакти зберігаються в підпапці temp: `$TMPDIR/openclaw-diffs`.
- Метадані артефакта переглядача містять:
  - випадковий ID артефакта (20 hex chars)
  - випадковий token (48 hex chars)
  - `createdAt` і `expiresAt`
  - шлях до збереженого `viewer.html`
- Типовий TTL артефакта — 30 хвилин, якщо не вказано інше.
- Максимально дозволений TTL переглядача — 6 годин.
- Очищення запускається опортуністично після створення артефакта.
- Прострочені артефакти видаляються.
- Резервне очищення видаляє застарілі папки старші за 24 години, коли метадані відсутні.

## URL переглядача та мережева поведінка

Маршрут переглядача:

- `/plugins/diffs/view/{artifactId}/{token}`

Ресурси переглядача:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Документ переглядача розв’язує ці ресурси відносно URL переглядача, тому необов’язковий префікс шляху `baseUrl` зберігається і для запитів до ресурсів.

Поведінка побудови URL:

- Якщо передано `baseUrl` у виклику tool, використовується він після суворої валідації.
- Інакше, якщо налаштовано Plugin `viewerBaseUrl`, використовується він.
- Без жодного перевизначення URL переглядача типово використовує loopback `127.0.0.1`.
- Якщо режим bind gateway — `custom` і задано `gateway.customBindHost`, використовується цей хост.

Правила `baseUrl`:

- Має починатися з `http://` або `https://`.
- Query і hash відхиляються.
- Дозволено origin плюс необов’язковий базовий шлях.

## Модель безпеки

Посилення безпеки переглядача:

- Лише loopback за замовчуванням.
- Tokenized viewer paths із суворою валідацією ID і token.
- CSP відповіді переглядача:
  - `default-src 'none'`
  - скрипти й ресурси лише із self
  - без вихідного `connect-src`
- Throttling віддалених промахів, коли віддалений доступ увімкнено:
  - 40 збоїв за 60 секунд
  - блокування на 60 секунд (`429 Too Many Requests`)

Посилення безпеки рендерингу файлів:

- Маршрутизація запитів браузера для скриншотів за замовчуванням заборонена.
- Дозволені лише локальні ресурси переглядача з `http://127.0.0.1/plugins/diffs/assets/*`.
- Зовнішні мережеві запити блокуються.

## Вимоги до браузера для файлового режиму

`mode: "file"` і `mode: "both"` потребують Chromium-сумісного браузера.

Порядок розв’язання:

1. `browser.executablePath` у конфігурації OpenClaw.
2. Змінні середовища:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Резервне виявлення команди/шляху платформи.

Типовий текст помилки:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Виправлення: установіть Chrome, Chromium, Edge або Brave, або задайте один із наведених вище параметрів шляху до виконуваного файла.

## Усунення проблем

Помилки валідації вводу:

- `Provide patch or both before and after text.`
  - Передайте і `before`, і `after`, або надайте `patch`.
- `Provide either patch or before/after input, not both.`
  - Не змішуйте режими вводу.
- `Invalid baseUrl: ...`
  - Використовуйте origin `http(s)` з необов’язковим шляхом, без query/hash.
- `{field} exceeds maximum size (...)`
  - Зменште розмір payload.
- Відхилення великого patch
  - Зменште кількість файлів patch або загальну кількість рядків.

Проблеми з доступністю переглядача:

- URL переглядача типово розв’язується в `127.0.0.1`.
- Для сценаріїв віддаленого доступу або:
  - задайте Plugin `viewerBaseUrl`, або
  - передавайте `baseUrl` для кожного виклику tool, або
  - використовуйте `gateway.bind=custom` і `gateway.customBindHost`
- Якщо `gateway.trustedProxies` містить loopback для проксі на тому самому хості (наприклад, Tailscale Serve), сирі loopback-запити до переглядача без forwarded client-IP headers навмисно завершуються безпечною відмовою.
- Для такої топології проксі:
  - надавайте перевагу `mode: "file"` або `mode: "both"`, коли вам потрібне лише вкладення, або
  - свідомо вмикайте `security.allowRemoteViewer` і задавайте Plugin `viewerBaseUrl` або передавайте proxy/public `baseUrl`, коли вам потрібен URL переглядача, яким можна ділитися
- Увімкніть `security.allowRemoteViewer` лише тоді, коли ви справді хочете зовнішній доступ до переглядача.

Рядок незмінених рядків не має кнопки розгортання:

- Це може трапитися для вводу patch, коли patch не містить розгортаного контексту.
- Це очікувана поведінка і не означає збій переглядача.

Артефакт не знайдено:

- Артефакт прострочився через TTL.
- Token або шлях було змінено.
- Очищення видалило застарілі дані.

## Операційні рекомендації

- Надавайте перевагу `mode: "view"` для локальних інтерактивних review у canvas.
- Надавайте перевагу `mode: "file"` для вихідних chat-каналів, яким потрібне вкладення.
- Залишайте `allowRemoteViewer` вимкненим, якщо вашому розгортанню не потрібні віддалені URL переглядача.
- Для чутливих diff задавайте явні короткі `ttlSeconds`.
- Уникайте надсилання секретів у вхідних diff без необхідності.
- Якщо ваш канал агресивно стискає зображення (наприклад, Telegram або WhatsApp), надавайте перевагу виводу PDF (`fileFormat: "pdf"`).

Рушій рендерингу diff:

- Працює на базі [Diffs](https://diffs.com).

## Пов’язані документи

- [Огляд tools](/uk/tools)
- [Plugins](/uk/tools/plugin)
- [Browser](/uk/tools/browser)
