---
read_when:
    - Ви хочете, щоб агенти показували зміни коду або Markdown у вигляді порівняльних змін
    - Вам потрібна URL-адреса переглядача, готова для полотна, або файл відрендереної різниці
    - Вам потрібні контрольовані тимчасові артефакти diff із безпечними типовими налаштуваннями
sidebarTitle: Diffs
summary: Переглядач diff і рендерер файлів лише для читання для агентів (необов’язковий інструмент Plugin)
title: Відмінності
x-i18n:
    generated_at: "2026-04-28T11:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` — це необов'язковий інструмент plugin із короткими вбудованими системними вказівками та супровідним skill, який перетворює вміст змін на артефакт diff лише для читання для агентів.

Він приймає або:

- текст `before` і `after`
- уніфікований `patch`

Він може повернути:

- URL переглядача Gateway для показу на canvas
- шлях до згенерованого файла (PNG або PDF) для доставлення повідомлення
- обидва виходи в одному виклику

Коли ввімкнено, plugin додає стислі вказівки з використання до простору системного prompt, а також надає докладний skill для випадків, коли агенту потрібні повніші інструкції.

## Швидкий старт

<Steps>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        Потоки, орієнтовані на canvas: агенти викликають `diffs` з `mode: "view"` і відкривають `details.viewerUrl` за допомогою `canvas present`.
      </Tab>
      <Tab title="file">
        Доставлення файлів у чаті: агенти викликають `diffs` з `mode: "file"` і надсилають `details.filePath` через `message`, використовуючи `path` або `filePath`.
      </Tab>
      <Tab title="both">
        Комбінований режим: агенти викликають `diffs` з `mode: "both"`, щоб отримати обидва артефакти в одному виклику.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Вимкнення вбудованих системних вказівок

Якщо потрібно залишити інструмент `diffs` увімкненим, але вимкнути його вбудовані вказівки системного prompt, встановіть `plugins.entries.diffs.hooks.allowPromptInjection` у `false`:

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

Це блокує hook `before_prompt_build` plugin diffs, зберігаючи доступними plugin, інструмент і супровідний skill.

Якщо потрібно вимкнути і вказівки, і інструмент, натомість вимкніть plugin.

## Типовий робочий процес агента

<Steps>
  <Step title="Call diffs">
    Агент викликає інструмент `diffs` із вхідними даними.
  </Step>
  <Step title="Read details">
    Агент читає поля `details` з відповіді.
  </Step>
  <Step title="Present">
    Агент або відкриває `details.viewerUrl` за допомогою `canvas present`, надсилає `details.filePath` через `message`, використовуючи `path` або `filePath`, або робить і те, й інше.
  </Step>
</Steps>

## Приклади введення

<Tabs>
  <Tab title="Before and after">
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

## Довідник вхідних даних інструмента

Усі поля необов'язкові, якщо не зазначено інше.

<ParamField path="before" type="string">
  Початковий текст. Обов'язковий разом з `after`, коли `patch` пропущено.
</ParamField>
<ParamField path="after" type="string">
  Оновлений текст. Обов'язковий разом з `before`, коли `patch` пропущено.
</ParamField>
<ParamField path="patch" type="string">
  Текст уніфікованого diff. Взаємовиключний з `before` і `after`.
</ParamField>
<ParamField path="path" type="string">
  Ім'я файла для відображення в режимі до і після.
</ParamField>
<ParamField path="lang" type="string">
  Підказка для перевизначення мови в режимі до і після. Невідомі значення повертаються до звичайного тексту.
</ParamField>
<ParamField path="title" type="string">
  Перевизначення заголовка переглядача.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Режим виводу. За замовчуванням використовується стандартне значення plugin `defaults.mode`. Застарілий псевдонім: `"image"` поводиться як `"file"` і все ще приймається для зворотної сумісності.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Тема переглядача. За замовчуванням використовується стандартне значення plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Макет diff. За замовчуванням використовується стандартне значення plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Розгортати незмінені розділи, коли доступний повний контекст. Лише параметр для окремого виклику (не ключ стандартних значень plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Формат згенерованого файла. За замовчуванням використовується стандартне значення plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Попередній набір якості для рендерингу PNG або PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Перевизначення масштабу пристрою (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Максимальна ширина рендерингу в пікселях CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL артефакта в секундах для переглядача і автономних файлових виходів. Максимум 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Перевизначення origin URL переглядача. Перевизначає plugin `viewerBaseUrl`. Має бути `http` або `https`, без query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Все ще приймаються для зворотної сумісності:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` і `after`: максимум 512 KiB кожне.
    - `patch`: максимум 2 MiB.
    - `path`: максимум 2048 байтів.
    - `lang`: максимум 128 байтів.
    - `title`: максимум 1024 байти.
    - Обмеження складності patch: максимум 128 файлів і 120000 рядків загалом.
    - `patch` разом із `before` або `after` відхиляються.
    - Обмеження безпеки згенерованого файла (застосовуються до PNG і PDF):
      - `fileQuality: "standard"`: максимум 8 MP (8 000 000 згенерованих пікселів).
      - `fileQuality: "hq"`: максимум 14 MP (14 000 000 згенерованих пікселів).
      - `fileQuality: "print"`: максимум 24 MP (24 000 000 згенерованих пікселів).
      - PDF також має максимум 50 сторінок.

  </Accordion>
</AccordionGroup>

## Контракт вихідних деталей

Інструмент повертає структуровані метадані в `details`.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Спільні поля для режимів, які створюють переглядач:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, коли доступно)

  </Accordion>
  <Accordion title="File fields">
    Поля файла, коли згенеровано PNG або PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (те саме значення, що й `filePath`, для сумісності з інструментом повідомлень)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
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

| Режим    | Що повертається                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Лише поля переглядача.                                                                                                            |
| `"file"` | Лише поля файлу, без артефакта переглядача.                                                                                       |
| `"both"` | Поля переглядача разом із полями файлу. Якщо рендеринг файлу зазнає невдачі, переглядач усе одно повертається з `fileError` і псевдонімом `imageError`. |

## Згорнуті незмінені розділи

- Переглядач може показувати рядки на кшталт `N unmodified lines`.
- Елементи керування розгортанням у таких рядках є умовними й не гарантуються для кожного типу вхідних даних.
- Елементи керування розгортанням з’являються, коли відрендерений diff має контекстні дані, які можна розгорнути, що типово для вхідних даних до й після.
- Для багатьох вхідних даних у форматі unified patch пропущені тіла контексту недоступні в розібраних фрагментах patch, тому рядок може з’явитися без елементів керування розгортанням. Це очікувана поведінка.
- `expandUnchanged` застосовується лише тоді, коли існує контекст, який можна розгорнути.

## Стандартні налаштування Plugin

Установіть стандартні налаштування для всього Plugin у `~/.openclaw/openclaw.json`:

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

Підтримувані стандартні налаштування:

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

Явні параметри інструмента перевизначають ці стандартні налаштування.

### Конфігурація сталої URL-адреси переглядача

<ParamField path="viewerBaseUrl" type="string">
  Резервний варіант, керований Plugin, для повернених посилань переглядача, коли виклик інструмента не передає `baseUrl`. Має бути `http` або `https`, без query/hash.
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

## Життєвий цикл і зберігання артефактів

- Артефакти зберігаються в тимчасовій підпапці: `$TMPDIR/openclaw-diffs`.
- Метадані артефакта переглядача містять:
  - випадковий ID артефакта (20 шістнадцяткових символів)
  - випадковий токен (48 шістнадцяткових символів)
  - `createdAt` і `expiresAt`
  - збережений шлях `viewer.html`
- Стандартний TTL артефакта становить 30 хвилин, якщо не вказано інше.
- Максимальний прийнятий TTL переглядача становить 6 годин.
- Очищення запускається ситуативно після створення артефакта.
- Прострочені артефакти видаляються.
- Резервне очищення видаляє застарілі папки, старші за 24 години, коли метадані відсутні.

## URL-адреса переглядача та мережева поведінка

Маршрут переглядача:

- `/plugins/diffs/view/{artifactId}/{token}`

Ресурси переглядача:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Документ переглядача розпізнає ці ресурси відносно URL-адреси переглядача, тому необов’язковий префікс шляху `baseUrl` також зберігається для обох запитів ресурсів.

Поведінка побудови URL-адреси:

- Якщо надано `baseUrl` виклику інструмента, він використовується після суворої валідації.
- Інакше, якщо налаштовано `viewerBaseUrl` Plugin, він використовується.
- Без жодного з перевизначень URL-адреса переглядача за замовчуванням використовує loopback `127.0.0.1`.
- Якщо режим прив’язки gateway дорівнює `custom` і задано `gateway.customBindHost`, використовується цей host.

Правила `baseUrl`:

- Має бути `http://` або `https://`.
- Query і hash відхиляються.
- Дозволено origin плюс необов’язковий базовий шлях.

## Модель безпеки

<AccordionGroup>
  <Accordion title="Посилення захисту переглядача">
    - За замовчуванням лише loopback.
    - Токенізовані шляхи переглядача із суворою валідацією ID і токена.
    - CSP відповіді переглядача:
      - `default-src 'none'`
      - скрипти й ресурси лише з self
      - без вихідного `connect-src`
    - Обмеження частоти віддалених промахів, коли ввімкнено віддалений доступ:
      - 40 невдалих спроб за 60 секунд
      - блокування на 60 секунд (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Посилення безпеки рендерингу файлів">
    - Маршрутизація запитів браузера для знімків екрана за замовчуванням забороняє все.
    - Дозволені лише локальні ресурси переглядача з `http://127.0.0.1/plugins/diffs/assets/*`.
    - Зовнішні мережеві запити заблоковано.

  </Accordion>
</AccordionGroup>

## Вимоги браузера для файлового режиму

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
    Резервне виявлення команди/шляху платформи.
  </Step>
</Steps>

Поширений текст помилки:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Виправте це, встановивши Chrome, Chromium, Edge або Brave, чи задавши один із параметрів шляху до виконуваного файлу вище.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки перевірки вхідних даних">
    - `Provide patch or both before and after text.` — додайте і `before`, і `after`, або надайте `patch`.
    - `Provide either patch or before/after input, not both.` — не змішуйте режими введення.
    - `Invalid baseUrl: ...` — використовуйте origin `http(s)` з необов’язковим шляхом, без query/hash.
    - `{field} exceeds maximum size (...)` — зменште розмір payload.
    - Відхилення великого patch — зменште кількість файлів patch або загальну кількість рядків.

  </Accordion>
  <Accordion title="Доступність переглядача">
    - URL переглядача за замовчуванням розв’язується в `127.0.0.1`.
    - Для сценаріїв віддаленого доступу:
      - задайте для plugin `viewerBaseUrl`, або
      - передайте `baseUrl` для кожного виклику інструмента, або
      - використовуйте `gateway.bind=custom` і `gateway.customBindHost`
    - Якщо `gateway.trustedProxies` містить loopback для проксі на тому самому хості (наприклад Tailscale Serve), необроблені loopback-запити переглядача без пересланих заголовків IP клієнта за проєктом завершуються закрито.
    - Для такої топології проксі:
      - надавайте перевагу `mode: "file"` або `mode: "both"`, коли вам потрібне лише вкладення, або
      - свідомо увімкніть `security.allowRemoteViewer` і задайте для plugin `viewerBaseUrl` або передайте проксі/публічний `baseUrl`, коли вам потрібен URL переглядача, яким можна поділитися
    - Увімкніть `security.allowRemoteViewer` лише тоді, коли вам справді потрібен зовнішній доступ до переглядача.

  </Accordion>
  <Accordion title="Рядок незмінених рядків не має кнопки розгортання">
    Це може статися для вхідних даних patch, коли patch не містить контексту, який можна розгорнути. Це очікувано й не вказує на збій переглядача.
  </Accordion>
  <Accordion title="Артефакт не знайдено">
    - Термін дії артефакту минув через TTL.
    - Token або шлях змінився.
    - Очищення видалило застарілі дані.

  </Accordion>
</AccordionGroup>

## Операційні рекомендації

- Надавайте перевагу `mode: "view"` для локальних інтерактивних переглядів у canvas.
- Надавайте перевагу `mode: "file"` для вихідних чат-каналів, яким потрібне вкладення.
- Тримайте `allowRemoteViewer` вимкненим, якщо ваше розгортання не потребує віддалених URL переглядача.
- Задавайте явно короткі `ttlSeconds` для конфіденційних diff.
- Уникайте надсилання секретів у вхідних даних diff, коли це не потрібно.
- Якщо ваш канал агресивно стискає зображення (наприклад Telegram або WhatsApp), надавайте перевагу виводу PDF (`fileFormat: "pdf"`).

<Note>
Рушій рендерингу diff працює на основі [Diffs](https://diffs.com).
</Note>

## Пов’язане

- [Браузер](/uk/tools/browser)
- [Plugins](/uk/tools/plugin)
- [Огляд інструментів](/uk/tools)
