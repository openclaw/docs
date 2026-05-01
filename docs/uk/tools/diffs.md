---
read_when:
    - Ви хочете, щоб агенти показували зміни коду або Markdown як diff-и
    - Вам потрібна URL-адреса переглядача, готова для полотна, або відрендерений файл відмінностей
    - Вам потрібні керовані тимчасові артефакти різниць із безпечними налаштуваннями за замовчуванням
sidebarTitle: Diffs
summary: Переглядач відмінностей і засіб рендерингу файлів лише для читання для агентів (необов’язковий інструмент Plugin)
title: Відмінності
x-i18n:
    generated_at: "2026-05-01T20:42:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` — це необов’язковий Plugin tool із короткими вбудованими системними вказівками та супровідним skill, який перетворює вміст змін на артефакт diff лише для читання для агентів.

Він приймає або:

- текст `before` і `after`
- уніфікований `patch`

Він може повернути:

- URL переглядача Gateway для подання на canvas
- шлях до відрендереного файлу (PNG або PDF) для доставлення повідомленням
- обидва виходи за один виклик

Коли ввімкнено, Plugin додає стислі вказівки з використання в простір системного prompt, а також надає детальний skill для випадків, коли агенту потрібні повніші інструкції.

## Швидкий старт

<Steps>
  <Step title="Установіть Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
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
        Потоки з пріоритетом canvas: агенти викликають `diffs` з `mode: "view"` і відкривають `details.viewerUrl` через `canvas present`.
      </Tab>
      <Tab title="file">
        Доставлення файлу в чаті: агенти викликають `diffs` з `mode: "file"` і надсилають `details.filePath` через `message`, використовуючи `path` або `filePath`.
      </Tab>
      <Tab title="both">
        Комбіновано: агенти викликають `diffs` з `mode: "both"`, щоб отримати обидва артефакти за один виклик.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Вимкнення вбудованих системних вказівок

Якщо ви хочете залишити tool `diffs` увімкненим, але вимкнути його вбудовані вказівки системного prompt, установіть `plugins.entries.diffs.hooks.allowPromptInjection` у `false`:

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

Це блокує hook `before_prompt_build` Plugin diffs, водночас залишаючи Plugin, tool і супровідний skill доступними.

Якщо ви хочете вимкнути і вказівки, і tool, натомість вимкніть Plugin.

## Типовий робочий процес агента

<Steps>
  <Step title="Викличте diffs">
    Агент викликає tool `diffs` із вхідними даними.
  </Step>
  <Step title="Прочитайте details">
    Агент читає поля `details` з відповіді.
  </Step>
  <Step title="Подайте">
    Агент або відкриває `details.viewerUrl` через `canvas present`, надсилає `details.filePath` через `message`, використовуючи `path` або `filePath`, або робить і те, й інше.
  </Step>
</Steps>

## Приклади вхідних даних

<Tabs>
  <Tab title="До і після">
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

## Довідник вхідних даних tool

Усі поля необов’язкові, якщо не зазначено інше.

<ParamField path="before" type="string">
  Оригінальний текст. Обов’язково разом із `after`, коли `patch` пропущено.
</ParamField>
<ParamField path="after" type="string">
  Оновлений текст. Обов’язково разом із `before`, коли `patch` пропущено.
</ParamField>
<ParamField path="patch" type="string">
  Текст уніфікованого diff. Взаємовиключний із `before` і `after`.
</ParamField>
<ParamField path="path" type="string">
  Ім’я файлу для показу в режимі до і після.
</ParamField>
<ParamField path="lang" type="string">
  Підказка перевизначення мови для режиму до і після. Невідомі значення повертаються до простого тексту.
</ParamField>
<ParamField path="title" type="string">
  Перевизначення заголовка переглядача.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Режим виводу. За замовчуванням використовується типове значення Plugin `defaults.mode`. Застарілий псевдонім: `"image"` поводиться як `"file"` і все ще приймається для зворотної сумісності.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Тема переглядача. За замовчуванням використовується типове значення Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Макет diff. За замовчуванням використовується типове значення Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Розгортати незмінені секції, коли доступний повний контекст. Опція лише для окремого виклику (не ключ типових значень Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Формат відрендереного файлу. За замовчуванням використовується типове значення Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Набір якості для рендерингу PNG або PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Перевизначення масштабу пристрою (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Максимальна ширина рендерингу в CSS-пікселях (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL артефакту в секундах для виводів переглядача й автономного файлу. Максимум 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Перевизначення origin URL переглядача. Перевизначає Plugin `viewerBaseUrl`. Має бути `http` або `https`, без query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Застарілі псевдоніми вхідних даних">
    Усе ще приймаються для зворотної сумісності:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Валідація та обмеження">
    - `before` і `after` кожен максимум 512 KiB.
    - `patch` максимум 2 MiB.
    - `path` максимум 2048 байтів.
    - `lang` максимум 128 байтів.
    - `title` максимум 1024 байти.
    - Обмеження складності patch: максимум 128 файлів і 120000 рядків загалом.
    - `patch` разом із `before` або `after` відхиляються.
    - Обмеження безпеки відрендереного файлу (застосовуються до PNG і PDF):
      - `fileQuality: "standard"`: максимум 8 MP (8,000,000 відрендерених пікселів).
      - `fileQuality: "hq"`: максимум 14 MP (14,000,000 відрендерених пікселів).
      - `fileQuality: "print"`: максимум 24 MP (24,000,000 відрендерених пікселів).
      - PDF також має максимум 50 сторінок.

  </Accordion>
</AccordionGroup>

## Контракт вихідних details

Tool повертає структуровані метадані в `details`.

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
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, коли доступно)

  </Accordion>
  <Accordion title="Поля файлу">
    Поля файлу, коли рендериться PNG або PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (те саме значення, що й `filePath`, для сумісності з message tool)
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

| Режим    | Що повертається                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Лише поля переглядача.                                                                                                 |
| `"file"` | Лише поля файлу, без артефакту переглядача.                                                                            |
| `"both"` | Поля переглядача плюс поля файлу. Якщо рендеринг файлу завершується невдало, переглядач усе одно повертається з `fileError` і псевдонімом `imageError`. |

## Згорнуті незмінені секції

- Переглядач може показувати рядки на кшталт `N unmodified lines`.
- Елементи керування розгортанням на цих рядках умовні й не гарантуються для кожного виду вхідних даних.
- Елементи керування розгортанням з’являються, коли відрендерений diff має дані контексту, які можна розгорнути, що типово для вхідних даних до і після.
- Для багатьох вхідних даних уніфікованого patch пропущені тіла контексту недоступні в розібраних фрагментах patch, тому рядок може з’явитися без елементів керування розгортанням. Це очікувана поведінка.
- `expandUnchanged` застосовується лише коли існує контекст, який можна розгорнути.

## Типові значення Plugin

Задайте типові значення на рівні Plugin у `~/.openclaw/openclaw.json`:

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

### Конфігурація постійного URL переглядача

<ParamField path="viewerBaseUrl" type="string">
  Резервний варіант, що належить Plugin, для повернених посилань переглядача, коли виклик tool не передає `baseUrl`. Має бути `http` або `https`, без query/hash.
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
  `false`: non-loopback запити до маршрутів переглядача заборонено. `true`: віддалені переглядачі дозволені, якщо токенізований шлях чинний.
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
- Метадані артефакту переглядача містять:
  - випадковий ID артефакту (20 hex chars)
  - випадковий токен (48 hex chars)
  - `createdAt` і `expiresAt`
  - збережений шлях `viewer.html`
- Типовий TTL артефакту становить 30 хвилин, якщо не зазначено інше.
- Максимальний прийнятий TTL переглядача становить 6 годин.
- Очищення запускається опортуністично після створення артефакту.
- Прострочені артефакти видаляються.
- Резервне очищення видаляє застарілі папки, старші за 24 години, коли метадані відсутні.

## URL переглядача та мережева поведінка

Маршрут переглядача:

- `/plugins/diffs/view/{artifactId}/{token}`

Ресурси переглядача:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Документ переглядача розв’язує ці ресурси відносно URL переглядача, тому необов’язковий префікс шляху `baseUrl` також зберігається для обох запитів ресурсів.

Поведінка побудови URL:

- Якщо надано `baseUrl` виклику tool, він використовується після суворої валідації.
- Інакше, якщо налаштовано Plugin `viewerBaseUrl`, використовується він.
- Без будь-якого перевизначення URL переглядача за замовчуванням використовує loopback `127.0.0.1`.
- Якщо режим прив’язування Gateway — `custom` і встановлено `gateway.customBindHost`, використовується цей хост.

Правила `baseUrl`:

- Має бути `http://` або `https://`.
- Query і hash відхиляються.
- Дозволено origin плюс необов’язковий базовий шлях.

## Модель безпеки

<AccordionGroup>
  <Accordion title="Посилення захисту переглядача">
    - Лише loopback за замовчуванням.
    - Токенізовані шляхи переглядача зі строгою перевіркою ID і токена.
    - CSP відповіді переглядача:
      - `default-src 'none'`
      - скрипти й ресурси лише з self
      - без вихідного `connect-src`
    - Обмеження віддалених промахів, коли віддалений доступ увімкнено:
      - 40 збоїв за 60 секунд
      - 60-секундне блокування (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Посилення захисту рендерингу файлів">
    - Маршрутизація браузерних запитів для знімків екрана за замовчуванням усе забороняє.
    - Дозволені лише локальні ресурси переглядача з `http://127.0.0.1/plugins/diffs/assets/*`.
    - Зовнішні мережеві запити заблоковано.

  </Accordion>
</AccordionGroup>

## Вимоги браузера для файлового режиму

`mode: "file"` і `mode: "both"` потребують Chromium-сумісного браузера.

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

Виправте, встановивши Chrome, Chromium, Edge або Brave, або задавши один із варіантів шляху до виконуваного файла вище.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки перевірки вхідних даних">
    - `Provide patch or both before and after text.` — додайте і `before`, і `after`, або надайте `patch`.
    - `Provide either patch or before/after input, not both.` — не змішуйте режими введення.
    - `Invalid baseUrl: ...` — використовуйте джерело `http(s)` з необов’язковим шляхом, без query/hash.
    - `{field} exceeds maximum size (...)` — зменште розмір корисного навантаження.
    - Відхилення великого патча — зменште кількість файлів патча або загальну кількість рядків.

  </Accordion>
  <Accordion title="Доступність переглядача">
    - URL переглядача за замовчуванням розв’язується в `127.0.0.1`.
    - Для сценаріїв віддаленого доступу:
      - задайте `viewerBaseUrl` Plugin, або
      - передайте `baseUrl` для кожного виклику інструмента, або
      - використайте `gateway.bind=custom` і `gateway.customBindHost`
    - Якщо `gateway.trustedProxies` містить loopback для проксі на тому самому хості (наприклад, Tailscale Serve), необроблені loopback-запити переглядача без перенаправлених заголовків client-IP навмисно завершуються закрито.
    - Для такої топології проксі:
      - надавайте перевагу `mode: "file"` або `mode: "both"`, коли потрібне лише вкладення, або
      - навмисно ввімкніть `security.allowRemoteViewer` і задайте `viewerBaseUrl` Plugin або передайте проксі/публічний `baseUrl`, коли потрібен URL переглядача, яким можна поділитися
    - Вмикайте `security.allowRemoteViewer` лише тоді, коли вам потрібен зовнішній доступ до переглядача.

  </Accordion>
  <Accordion title="У рядку незмінених рядків немає кнопки розгортання">
    Це може трапитися для введення патча, коли патч не містить розгортного контексту. Це очікувано й не вказує на збій переглядача.
  </Accordion>
  <Accordion title="Артефакт не знайдено">
    - Термін дії артефакта минув через TTL.
    - Токен або шлях змінився.
    - Очищення видалило застарілі дані.

  </Accordion>
</AccordionGroup>

## Операційні рекомендації

- Надавайте перевагу `mode: "view"` для локальних інтерактивних рев’ю в canvas.
- Надавайте перевагу `mode: "file"` для вихідних каналів чату, яким потрібне вкладення.
- Тримайте `allowRemoteViewer` вимкненим, якщо ваше розгортання не потребує віддалених URL переглядача.
- Задавайте явні короткі `ttlSeconds` для чутливих diff.
- Не надсилайте секрети у вхідних даних diff, якщо це не потрібно.
- Якщо ваш канал сильно стискає зображення (наприклад, Telegram або WhatsApp), надавайте перевагу виводу PDF (`fileFormat: "pdf"`).

<Note>
Рушій рендерингу diff працює на основі [Diffs](https://diffs.com).
</Note>

## Пов’язане

- [Браузер](/uk/tools/browser)
- [Plugins](/uk/tools/plugin)
- [Огляд інструментів](/uk/tools)
