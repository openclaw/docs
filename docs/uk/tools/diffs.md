---
read_when:
    - Ви хочете, щоб агенти показували зміни в коді або Markdown у форматі diff
    - Вам потрібна URL-адреса переглядача, готова для полотна, або відрендерений файл відмінностей
    - Вам потрібні керовані тимчасові артефакти різниць із безпечними типовими налаштуваннями
sidebarTitle: Diffs
summary: Переглядач diff і рендерер файлів лише для читання для агентів (необов’язковий інструмент Plugin)
title: Відмінності
x-i18n:
    generated_at: "2026-05-11T21:00:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9a3dfcab6b4c654645075e3768c13726e10df10632d62ffeeb4de7cc41edf58
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` — це додатковий інструмент Plugin із короткими вбудованими системними настановами та супровідним Skill, який перетворює вміст змін на доступний лише для читання артефакт diff для агентів.

Він приймає або:

- текст `before` і `after`
- уніфікований `patch`

Він може повернути:

- URL переглядача Gateway для презентації на canvas
- шлях до відрендереного файла (PNG або PDF) для доставлення повідомленням
- обидва результати в одному виклику

Коли Plugin увімкнено, він додає стислі настанови з використання на початок простору системного prompt і також надає докладний Skill для випадків, коли агенту потрібні повніші інструкції.

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
        Потоки, орієнтовані на canvas: агенти викликають `diffs` з `mode: "view"` і відкривають `details.viewerUrl` через `canvas present`.
      </Tab>
      <Tab title="file">
        Доставлення файлів у чаті: агенти викликають `diffs` з `mode: "file"` і надсилають `details.filePath` через `message`, використовуючи `path` або `filePath`.
      </Tab>
      <Tab title="both">
        Комбіновано: агенти викликають `diffs` з `mode: "both"`, щоб отримати обидва артефакти в одному виклику.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Вимкнення вбудованих системних настанов

Якщо потрібно залишити інструмент `diffs` увімкненим, але вимкнути його вбудовані настанови системного prompt, установіть `plugins.entries.diffs.hooks.allowPromptInjection` у `false`:

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

Це блокує хук `before_prompt_build` Plugin diffs, залишаючи Plugin, інструмент і супровідний Skill доступними.

Якщо потрібно вимкнути і настанови, і інструмент, вимкніть сам Plugin.

## Типовий робочий процес агента

<Steps>
  <Step title="Виклик diffs">
    Агент викликає інструмент `diffs` із вхідними даними.
  </Step>
  <Step title="Читання details">
    Агент читає поля `details` з відповіді.
  </Step>
  <Step title="Презентація">
    Агент або відкриває `details.viewerUrl` через `canvas present`, або надсилає `details.filePath` через `message`, використовуючи `path` чи `filePath`, або робить і те, і те.
  </Step>
</Steps>

## Приклади введення

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

## Довідник вхідних даних інструмента

Усі поля необов’язкові, якщо не зазначено інше.

<ParamField path="before" type="string">
  Початковий текст. Обов’язковий разом з `after`, коли `patch` не вказано.
</ParamField>
<ParamField path="after" type="string">
  Оновлений текст. Обов’язковий разом з `before`, коли `patch` не вказано.
</ParamField>
<ParamField path="patch" type="string">
  Текст уніфікованого diff. Взаємовиключний з `before` і `after`.
</ParamField>
<ParamField path="path" type="string">
  Відображуване ім’я файла для режиму до і після.
</ParamField>
<ParamField path="lang" type="string">
  Підказка перевизначення мови для режиму до і після. Невідомі значення повертаються до звичайного тексту.
</ParamField>
<ParamField path="title" type="string">
  Перевизначення заголовка переглядача.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Режим виводу. За замовчуванням використовується типове значення Plugin `defaults.mode`. Застарілий псевдонім: `"image"` поводиться як `"file"` і досі приймається для зворотної сумісності.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Тема переглядача. За замовчуванням використовується типове значення Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Макет diff. За замовчуванням використовується типове значення Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Розгортати незмінені розділи, коли доступний повний контекст. Лише параметр окремого виклику (не типовий ключ Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Формат відрендереного файла. За замовчуванням використовується типове значення Plugin `defaults.fileFormat`.
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
  TTL артефакта в секундах для виводів переглядача та автономного файла. Максимум 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Перевизначення origin URL переглядача. Перевизначає Plugin `viewerBaseUrl`. Має бути `http` або `https`, без query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Застарілі псевдоніми введення">
    Досі приймаються для зворотної сумісності:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Валідація та обмеження">
    - `before` і `after` максимум по 512 KiB кожен.
    - `patch` максимум 2 MiB.
    - `path` максимум 2048 байтів.
    - `lang` максимум 128 байтів.
    - `title` максимум 1024 байти.
    - Обмеження складності patch: максимум 128 файлів і 120000 рядків загалом.
    - `patch` разом з `before` або `after` відхиляється.
    - Обмеження безпеки відрендерених файлів (застосовуються до PNG і PDF):
      - `fileQuality: "standard"`: максимум 8 MP (8 000 000 відрендерених пікселів).
      - `fileQuality: "hq"`: максимум 14 MP (14 000 000 відрендерених пікселів).
      - `fileQuality: "print"`: максимум 24 MP (24 000 000 відрендерених пікселів).
      - PDF також має максимум 50 сторінок.

  </Accordion>
</AccordionGroup>

## Контракт вихідних details

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
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, коли доступні)

  </Accordion>
  <Accordion title="Поля файла">
    Поля файла, коли рендериться PNG або PDF:

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
| `"file"` | Лише поля файла, без артефакта переглядача.                                                                            |
| `"both"` | Поля переглядача плюс поля файла. Якщо рендеринг файла не вдається, переглядач усе одно повертається з `fileError` і псевдонімом `imageError`. |

## Згорнуті незмінені розділи

- Переглядач може показувати рядки на кшталт `N unmodified lines`.
- Елементи керування розгортанням на цих рядках є умовними й не гарантуються для кожного типу введення.
- Елементи керування розгортанням з’являються, коли відрендерений diff має дані контексту, які можна розгорнути, що типово для введення до і після.
- Для багатьох вхідних уніфікованих patch пропущені тіла контексту недоступні в розібраних hunks patch, тому рядок може з’являтися без елементів керування розгортанням. Це очікувана поведінка.
- `expandUnchanged` застосовується лише тоді, коли існує контекст, який можна розгорнути.

## Типові значення Plugin

Установіть типові значення для всього Plugin у `~/.openclaw/openclaw.json`:

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
            ttlSeconds: 21600,
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
- `ttlSeconds`

Явні параметри інструмента перевизначають ці типові значення.

### Постійна конфігурація URL переглядача

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
  `false`: запити не з loopback до маршрутів переглядача заборонені. `true`: віддалені переглядачі дозволені, якщо токенізований шлях дійсний.
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
- TTL артефакта за замовчуванням становить 30 хвилин, якщо не вказано інше.
- Максимальний прийнятий TTL переглядача становить 6 годин.
- Очищення запускається за нагоди після створення артефакта.
- Протерміновані артефакти видаляються.
- Резервне очищення видаляє застарілі папки старші за 24 години, коли метадані відсутні.

## URL переглядача та поведінка мережі

Маршрут переглядача:

- `/plugins/diffs/view/{artifactId}/{token}`

Ресурси переглядача:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Документ переглядача визначає ці ресурси відносно URL переглядача, тому необов’язковий префікс шляху `baseUrl` також зберігається для обох запитів ресурсів.

Поведінка побудови URL:

- Якщо надано `baseUrl` виклику інструмента, він використовується після суворої валідації.
- Інакше, якщо налаштовано Plugin `viewerBaseUrl`, використовується він.
- Без жодного перевизначення URL переглядача за замовчуванням використовує loopback `127.0.0.1`.
- Якщо режим прив’язки Gateway — `custom` і встановлено `gateway.customBindHost`, використовується цей host.

Правила `baseUrl`:

- Має бути `http://` або `https://`.
- Query і hash відхиляються.
- Дозволено origin плюс необов’язковий базовий шлях.

## Модель безпеки

<AccordionGroup>
  <Accordion title="Зміцнення захисту переглядача">
    - За замовчуванням лише loopback.
    - Токенізовані шляхи переглядача зі строгою перевіркою ID і токена.
    - CSP відповіді переглядача:
      - `default-src 'none'`
      - скрипти й ресурси лише з self
      - без вихідного `connect-src`
    - Обмеження віддалених промахів, коли віддалений доступ увімкнено:
      - 40 невдач за 60 секунд
      - блокування на 60 секунд (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Зміцнення захисту рендерингу файлів">
    - Маршрутизація запитів браузера для знімків екрана за замовчуванням заборонена.
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

Виправте, встановивши Chrome, Chromium, Edge або Brave, або задавши один із наведених вище варіантів шляху до виконуваного файлу.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки валідації введення">
    - `Provide patch or both before and after text.` — додайте і `before`, і `after`, або надайте `patch`.
    - `Provide either patch or before/after input, not both.` — не змішуйте режими введення.
    - `Invalid baseUrl: ...` — використовуйте origin `http(s)` з необов'язковим шляхом, без query/hash.
    - `{field} exceeds maximum size (...)` — зменште розмір payload.
    - Відхилення великого патча — зменште кількість файлів патча або загальну кількість рядків.

  </Accordion>
  <Accordion title="Доступність переглядача">
    - URL переглядача за замовчуванням визначається як `127.0.0.1`.
    - Для сценаріїв віддаленого доступу:
      - задайте `viewerBaseUrl` Plugin, або
      - передайте `baseUrl` для кожного виклику інструмента, або
      - використовуйте `gateway.bind=custom` і `gateway.customBindHost`
    - Якщо `gateway.trustedProxies` містить loopback для проксі на тому самому хості (наприклад Tailscale Serve), сирі loopback-запити переглядача без перенаправлених заголовків client-IP за задумом завершуються закритою відмовою.
    - Для такої топології проксі:
      - надавайте перевагу `mode: "file"` або `mode: "both"`, коли вам потрібне лише вкладення, або
      - навмисно увімкніть `security.allowRemoteViewer` і задайте `viewerBaseUrl` Plugin або передайте проксі/публічний `baseUrl`, коли вам потрібен URL переглядача, яким можна поділитися
    - Увімкніть `security.allowRemoteViewer` лише тоді, коли вам потрібен зовнішній доступ до переглядача.

  </Accordion>
  <Accordion title="Рядок незмінених рядків не має кнопки розгортання">
    Це може трапитися для введення патча, коли патч не містить розгортного контексту. Це очікувано й не вказує на збій переглядача.
  </Accordion>
  <Accordion title="Артефакт не знайдено">
    - Термін дії артефакту минув через TTL.
    - Токен або шлях змінився.
    - Очищення видалило застарілі дані.

  </Accordion>
</AccordionGroup>

## Операційні рекомендації

- Надавайте перевагу `mode: "view"` для локальних інтерактивних переглядів у полотні.
- Надавайте перевагу `mode: "file"` для вихідних чат-каналів, яким потрібне вкладення.
- Тримайте `allowRemoteViewer` вимкненим, якщо ваше розгортання не потребує віддалених URL переглядача.
- Задавайте явно короткі `ttlSeconds` для чутливих diff.
- Уникайте надсилання секретів у вхідних даних diff, коли це не потрібно.
- Якщо ваш канал агресивно стискає зображення (наприклад Telegram або WhatsApp), надавайте перевагу виводу PDF (`fileFormat: "pdf"`).

<Note>
Рушій рендерингу diff працює на основі [Diffs](https://diffs.com).
</Note>

## Пов'язане

- [Браузер](/uk/tools/browser)
- [Plugins](/uk/tools/plugin)
- [Огляд інструментів](/uk/tools)
