---
read_when:
    - Ви хочете, щоб агенти показували зміни коду або markdown як diff-и
    - Ви хочете URL-адресу переглядача, готову для canvas, або відрендерений diff-файл
    - Вам потрібні контрольовані тимчасові артефакти diff із безпечними типовими налаштуваннями
sidebarTitle: Diffs
summary: Засіб перегляду diff лише для читання та рендерер файлів для агентів (необов’язковий інструмент Plugin)
title: Diff-и
x-i18n:
    generated_at: "2026-04-26T07:03:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` — це необов’язковий інструмент Plugin із короткими вбудованими системними настановами та супровідним skill, який перетворює вміст змін на артефакт diff лише для читання для агентів.

Він приймає або:

- текст `before` і `after`
- уніфікований `patch`

Він може повертати:

- URL-адресу переглядача gateway для показу в canvas
- шлях до відрендереного файлу (PNG або PDF) для доставлення в повідомленні
- обидва результати за один виклик

Коли Plugin увімкнено, він додає лаконічні настанови щодо використання в простір системного промпту, а також надає докладний skill для випадків, коли агенту потрібні повніші інструкції.

## Швидкий початок

<Steps>
  <Step title="Увімкніть Plugin">
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
  </Step>
  <Step title="Виберіть режим">
    <Tabs>
      <Tab title="view">
        Потоки, орієнтовані на canvas: агенти викликають `diffs` з `mode: "view"` і відкривають `details.viewerUrl` через `canvas present`.
      </Tab>
      <Tab title="file">
        Доставлення файлу в чат: агенти викликають `diffs` з `mode: "file"` і надсилають `details.filePath` через `message`, використовуючи `path` або `filePath`.
      </Tab>
      <Tab title="both">
        Комбінований варіант: агенти викликають `diffs` з `mode: "both"`, щоб отримати обидва артефакти за один виклик.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Вимкнення вбудованих системних настанов

Якщо ви хочете залишити інструмент `diffs` увімкненим, але вимкнути його вбудовані настанови в системному промпті, установіть `plugins.entries.diffs.hooks.allowPromptInjection` у `false`:

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

Це блокує хук `before_prompt_build` Plugin diffs, але залишає доступними Plugin, інструмент і супровідний skill.

Якщо ви хочете вимкнути і настанови, і сам інструмент, натомість вимкніть Plugin.

## Типовий робочий процес агента

<Steps>
  <Step title="Виклик diffs">
    Агент викликає інструмент `diffs` із вхідними даними.
  </Step>
  <Step title="Читання details">
    Агент читає поля `details` із відповіді.
  </Step>
  <Step title="Показ">
    Агент або відкриває `details.viewerUrl` через `canvas present`, надсилає `details.filePath` через `message`, використовуючи `path` або `filePath`, або робить і те, і інше.
  </Step>
</Steps>

## Приклади вхідних даних

<Tabs>
  <Tab title="Before і after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Довідка щодо вхідних параметрів інструмента

Усі поля необов’язкові, якщо не зазначено інше.

<ParamField path="before" type="string">
  Початковий текст. Обов’язковий разом із `after`, коли `patch` не вказано.
</ParamField>
<ParamField path="after" type="string">
  Оновлений текст. Обов’язковий разом із `before`, коли `patch` не вказано.
</ParamField>
<ParamField path="patch" type="string">
  Текст уніфікованого diff. Взаємовиключний із `before` і `after`.
</ParamField>
<ParamField path="path" type="string">
  Ім’я файлу для показу в режимі before/after.
</ParamField>
<ParamField path="lang" type="string">
  Підказка для перевизначення мови в режимі before/after. Невідомі значення повертаються до звичайного тексту.
</ParamField>
<ParamField path="title" type="string">
  Перевизначення заголовка переглядача.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Режим виводу. Типово використовується типове значення Plugin `defaults.mode`. Застарілий псевдонім: `"image"` поводиться як `"file"` і досі приймається для зворотної сумісності.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Тема переглядача. Типово використовується типове значення Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Макет diff. Типово використовується типове значення Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Розгортати незмінені секції, коли доступний повний контекст. Лише параметр окремого виклику (не ключ типових значень Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Формат відрендереного файлу. Типово використовується типове значення Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Пресет якості для рендерингу PNG або PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Перевизначення масштабу пристрою (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Максимальна ширина рендерингу в CSS-пікселях (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL артефакту в секундах для переглядача та окремих файлів. Максимум 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Перевизначення origin URL переглядача. Перевизначає `viewerBaseUrl` Plugin. Має бути `http` або `https`, без query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Застарілі псевдоніми вхідних даних">
    Досі приймаються для зворотної сумісності:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Валідація та обмеження">
    - `before` і `after` — максимум по 512 KiB.
    - `patch` — максимум 2 MiB.
    - `path` — максимум 2048 байтів.
    - `lang` — максимум 128 байтів.
    - `title` — максимум 1024 байти.
    - Обмеження складності patch: максимум 128 файлів і 120000 рядків загалом.
    - `patch` разом із `before` або `after` відхиляється.
    - Обмеження безпеки для відрендерених файлів (застосовуються до PNG і PDF):
      - `fileQuality: "standard"`: максимум 8 MP (8,000,000 відрендерених пікселів).
      - `fileQuality: "hq"`: максимум 14 MP (14,000,000 відрендерених пікселів).
      - `fileQuality: "print"`: максимум 24 MP (24,000,000 відрендерених пікселів).
      - Для PDF також є максимум 50 сторінок.

  </Accordion>
</AccordionGroup>

## Контракт вихідних даних details

Інструмент повертає структуровані метадані в `details`.

<AccordionGroup>
  <Accordion title="Поля переглядача">
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

  </Accordion>
  <Accordion title="Поля файлу">
    Поля файлу, коли рендериться PNG або PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (те саме значення, що й `filePath`, для сумісності з інструментом message)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Псевдоніми сумісності">
    Також повертаються для наявних викликачів:

    - `format` (те саме значення, що й `fileFormat`)
    - `imagePath` (те саме значення, що й `filePath`)
    - `imageBytes` (те саме значення, що й `fileBytes`)
    - `imageQuality` (те саме значення, що й `fileQuality`)
    - `imageScale` (те саме значення, що й `fileScale`)
    - `imageMaxWidth` (те саме значення, що й `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Підсумок поведінки режимів:

| Режим    | Що повертається                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Лише поля переглядача.                                                                                                  |
| `"file"` | Лише поля файлу, без артефакту переглядача.                                                                             |
| `"both"` | Поля переглядача плюс поля файлу. Якщо рендеринг файлу не вдається, переглядач усе одно повертається з `fileError` і псевдонімом `imageError`. |

## Згорнуті незмінені секції

- Переглядач може показувати рядки на кшталт `N unmodified lines`.
- Елементи керування розгортанням у таких рядках є умовними й не гарантуються для кожного типу вхідних даних.
- Елементи керування розгортанням з’являються, коли відрендерений diff має дані розгортаного контексту, що типово для вхідних даних before/after.
- Для багатьох вхідних уніфікованих patch пропущені тіла контексту недоступні в розібраних patch hunk, тому рядок може з’являтися без елементів керування розгортанням. Це очікувана поведінка.
- `expandUnchanged` застосовується лише тоді, коли існує розгортаний контекст.

## Типові значення Plugin

Установіть типові значення на рівні Plugin у `~/.openclaw/openclaw.json`:

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

Явні параметри інструмента перевизначають ці типові значення.

### Постійна конфігурація URL переглядача

<ParamField path="viewerBaseUrl" type="string">
  Резервне значення, яким володіє Plugin, для повернених посилань переглядача, коли виклик інструмента не передає `baseUrl`. Має бути `http` або `https`, без query/hash.
</ParamField>

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

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: запити не з loopback до маршрутів переглядача відхиляються. `true`: віддалені переглядачі дозволені, якщо токенізований шлях дійсний.
</ParamField>

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

## Життєвий цикл артефактів і зберігання

- Артефакти зберігаються в тимчасовій підпапці: `$TMPDIR/openclaw-diffs`.
- Метадані артефакту переглядача містять:
  - випадковий ідентифікатор артефакту (20 hex-символів)
  - випадковий токен (48 hex-символів)
  - `createdAt` і `expiresAt`
  - збережений шлях `viewer.html`
- Типовий TTL артефакту — 30 хвилин, якщо не вказано інше.
- Максимально прийнятний TTL переглядача — 6 годин.
- Очищення виконується опортуністично після створення артефакту.
- Прострочені артефакти видаляються.
- Резервне очищення видаляє застарілі папки старші за 24 години, коли метадані відсутні.

## URL переглядача та мережева поведінка

Маршрут переглядача:

- `/plugins/diffs/view/{artifactId}/{token}`

Ресурси переглядача:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Документ переглядача визначає ці ресурси відносно URL переглядача, тому необов’язковий префікс шляху `baseUrl` також зберігається для обох запитів до ресурсів.

Поведінка побудови URL:

- Якщо передано `baseUrl` у виклику інструмента, використовується він після суворої валідації.
- Інакше, якщо налаштовано `viewerBaseUrl` Plugin, використовується воно.
- Без жодного перевизначення URL переглядача типово використовує loopback `127.0.0.1`.
- Якщо режим прив’язки gateway — `custom` і встановлено `gateway.customBindHost`, використовується цей хост.

Правила `baseUrl`:

- Має починатися з `http://` або `https://`.
- Query і hash відхиляються.
- Дозволено origin плюс необов’язковий базовий шлях.

## Модель безпеки

<AccordionGroup>
  <Accordion title="Захист переглядача">
    - Типово лише loopback.
    - Токенізовані шляхи переглядача із суворою валідацією ID і токена.
    - CSP відповіді переглядача:
      - `default-src 'none'`
      - скрипти й ресурси лише із self
      - без вихідного `connect-src`
    - Обмеження частоти промахів для віддаленого доступу, коли віддалений доступ увімкнено:
      - 40 збоїв за 60 секунд
      - 60 секунд блокування (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Захист рендерингу файлів">
    - Маршрутизація запитів браузера для знімків екрана типово заборонена.
    - Дозволені лише локальні ресурси переглядача з `http://127.0.0.1/plugins/diffs/assets/*`.
    - Зовнішні мережеві запити блокуються.

  </Accordion>
</AccordionGroup>

## Вимоги браузера для режиму file

`mode: "file"` і `mode: "both"` потребують браузера, сумісного з Chromium.

Порядок визначення:

<Steps>
  <Step title="Конфігурація">
    `browser.executablePath` у конфігурації OpenClaw.
  </Step>
  <Step title="Змінні середовища">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Резервний варіант платформи">
    Резервне виявлення команд/шляхів платформи.
  </Step>
</Steps>

Типовий текст помилки:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Виправлення: установіть Chrome, Chromium, Edge або Brave, або задайте один із наведених вище параметрів шляху до виконуваного файла.

## Усунення проблем

<AccordionGroup>
  <Accordion title="Помилки валідації вхідних даних">
    - `Provide patch or both before and after text.` — вкажіть і `before`, і `after`, або надайте `patch`.
    - `Provide either patch or before/after input, not both.` — не змішуйте режими вхідних даних.
    - `Invalid baseUrl: ...` — використовуйте origin `http(s)` з необов’язковим шляхом, без query/hash.
    - `{field} exceeds maximum size (...)` — зменште розмір корисного навантаження.
    - Відхилення великого patch — зменште кількість файлів у patch або загальну кількість рядків.

  </Accordion>
  <Accordion title="Доступність переглядача">
    - URL переглядача типово резольвиться в `127.0.0.1`.
    - Для сценаріїв віддаленого доступу:
      - установіть `viewerBaseUrl` Plugin, або
      - передавайте `baseUrl` для кожного виклику інструмента, або
      - використовуйте `gateway.bind=custom` і `gateway.customBindHost`
    - Якщо `gateway.trustedProxies` включає loopback для проксі на тому самому хості (наприклад, Tailscale Serve), сирі loopback-запити переглядача без заголовків пересилання IP клієнта відхиляються навмисно в безпечний бік.
    - Для такої топології проксі:
      - надавайте перевагу `mode: "file"` або `mode: "both"`, коли вам потрібне лише вкладення, або
      - навмисно увімкніть `security.allowRemoteViewer` і встановіть `viewerBaseUrl` Plugin або передайте проксі/публічний `baseUrl`, коли вам потрібна URL-адреса переглядача, якою можна поділитися
    - Увімкнюйте `security.allowRemoteViewer` лише тоді, коли вам справді потрібен зовнішній доступ до переглядача.

  </Accordion>
  <Accordion title="Рядок незмінених рядків не має кнопки розгортання">
    Це може траплятися для вхідних patch, коли patch не містить розгортаного контексту. Це очікувана поведінка й не вказує на збій переглядача.
  </Accordion>
  <Accordion title="Артефакт не знайдено">
    - Артефакт прострочив TTL.
    - Токен або шлях було змінено.
    - Очищення видалило застарілі дані.

  </Accordion>
</AccordionGroup>

## Операційні рекомендації

- Надавайте перевагу `mode: "view"` для локальних інтерактивних переглядів у canvas.
- Надавайте перевагу `mode: "file"` для зовнішніх чат-каналів, яким потрібне вкладення.
- Тримайте `allowRemoteViewer` вимкненим, якщо вашому розгортанню не потрібні віддалені URL переглядача.
- Установлюйте явні короткі `ttlSeconds` для чутливих diff.
- Уникайте надсилання секретів у вхідних даних diff, якщо це не потрібно.
- Якщо ваш канал агресивно стискає зображення (наприклад, Telegram або WhatsApp), надавайте перевагу виводу PDF (`fileFormat: "pdf"`).

<Note>
Рушій рендерингу diff працює на основі [Diffs](https://diffs.com).
</Note>

## Пов’язано

- [Browser](/uk/tools/browser)
- [Plugins](/uk/tools/plugin)
- [Огляд інструментів](/uk/tools)
