---
read_when:
    - Ви хочете, щоб агенти показували зміни коду або Markdown як diff-и
    - Вам потрібна URL-адреса переглядача, готова для полотна, або відрендерений файл diff
    - Потрібні контрольовані тимчасові артефакти diff із безпечними стандартними налаштуваннями
sidebarTitle: Diffs
summary: Переглядач diff і рендерер файлів лише для читання для агентів (необов’язковий інструмент Plugin)
title: Відмінності
x-i18n:
    generated_at: "2026-06-27T18:23:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` — це необов’язковий інструмент плагіна з короткими вбудованими системними настановами та супровідною навичкою, яка перетворює вміст змін на артефакт diff лише для читання для агентів.

Він приймає або:

- текст `before` і `after`
- уніфікований `patch`

Він може повернути:

- URL переглядача Gateway для презентації canvas
- шлях до відрендереного файлу (PNG або PDF) для доставки повідомлення
- обидва результати в одному виклику

Коли плагін увімкнено, він додає стислі настанови з використання до простору системного промпта, а також надає детальну навичку для випадків, коли агенту потрібні повніші інструкції.

## Швидкий старт

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
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
        Потоки з пріоритетом canvas: агенти викликають `diffs` з `mode: "view"` і відкривають `details.viewerUrl` через `canvas present`.
      </Tab>
      <Tab title="file">
        Доставка файлів у чаті: агенти викликають `diffs` з `mode: "file"` і надсилають `details.filePath` через `message`, використовуючи `path` або `filePath`.
      </Tab>
      <Tab title="both">
        Комбінований режим: агенти викликають `diffs` з `mode: "both"`, щоб отримати обидва артефакти в одному виклику.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Вимкнення вбудованих системних настанов

Якщо потрібно залишити інструмент `diffs` увімкненим, але вимкнути його вбудовані настанови системного промпта, встановіть `plugins.entries.diffs.hooks.allowPromptInjection` у `false`:

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

Це блокує хук `before_prompt_build` плагіна diffs, залишаючи плагін, інструмент і супровідну навичку доступними.

Якщо потрібно вимкнути і настанови, і інструмент, натомість вимкніть плагін.

## Типовий робочий процес агента

<Steps>
  <Step title="Call diffs">
    Агент викликає інструмент `diffs` із вхідними даними.
  </Step>
  <Step title="Read details">
    Агент читає поля `details` з відповіді.
  </Step>
  <Step title="Present">
    Агент або відкриває `details.viewerUrl` через `canvas present`, надсилає `details.filePath` через `message`, використовуючи `path` або `filePath`, або робить і те, й інше.
  </Step>
</Steps>

## Приклади вхідних даних

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

Усі поля необов’язкові, якщо не зазначено інше.

<ParamField path="before" type="string">
  Початковий текст. Обов’язковий разом із `after`, якщо `patch` не вказано.
</ParamField>
<ParamField path="after" type="string">
  Оновлений текст. Обов’язковий разом із `before`, якщо `patch` не вказано.
</ParamField>
<ParamField path="patch" type="string">
  Текст уніфікованого diff. Взаємовиключний із `before` і `after`.
</ParamField>
<ParamField path="path" type="string">
  Ім’я файлу для відображення в режимі before and after.
</ParamField>
<ParamField path="lang" type="string">
  Підказка перевизначення мови для режиму before and after. Невідомі значення та мови поза стандартним набором переглядача повертаються до звичайного тексту, якщо не встановлено
  плагін Diff Viewer Language Pack.
</ParamField>

<ParamField path="title" type="string">
  Перевизначення заголовка переглядача.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Режим виводу. За замовчуванням використовується стандартне значення плагіна `defaults.mode`. Застарілий псевдонім: `"image"` поводиться як `"file"` і досі приймається для зворотної сумісності.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Тема переглядача. За замовчуванням використовується стандартне значення плагіна `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Макет diff. За замовчуванням використовується стандартне значення плагіна `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Розгортати незмінені розділи, коли доступний повний контекст. Лише параметр окремого виклику (не ключ стандартних значень плагіна).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Формат відрендереного файлу. За замовчуванням використовується стандартне значення плагіна `defaults.fileFormat`.
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
  TTL артефакту в секундах для вихідних даних переглядача та окремого файлу. Максимум 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Перевизначення origin URL переглядача. Перевизначає `viewerBaseUrl` плагіна. Має бути `http` або `https`, без query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Досі приймаються для зворотної сумісності:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` і `after` — максимум 512 KiB кожен.
    - `patch` — максимум 2 MiB.
    - `path` — максимум 2048 байтів.
    - `lang` — максимум 128 байтів.
    - `title` — максимум 1024 байти.
    - Обмеження складності patch: максимум 128 файлів і 120000 рядків загалом.
    - `patch` разом із `before` або `after` відхиляються.
    - Безпекові обмеження відрендереного файлу (застосовуються до PNG і PDF):
      - `fileQuality: "standard"`: максимум 8 MP (8,000,000 відрендерених пікселів).
      - `fileQuality: "hq"`: максимум 14 MP (14,000,000 відрендерених пікселів).
      - `fileQuality: "print"`: максимум 24 MP (24,000,000 відрендерених пікселів).
      - PDF також має максимум 50 сторінок.

  </Accordion>
</AccordionGroup>

## Підсвічування синтаксису

OpenClaw містить підсвічування синтаксису для поширених мов вихідного коду, конфігурації та документації:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` і `toml`.

Поширені псевдоніми, як-от `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt` і `ps1`, нормалізуються до цих стандартних мов.

Установіть Plugin Diff Viewer Language Pack, щоб підсвічувати інші мови:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Коли мовний пакет доступний, OpenClaw може підсвічувати значно більше мов. Якщо пакет не встановлено, файли поза стандартним списком усе одно відображаються як читабельний звичайний текст. Приклади: Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI та diff-файли.

Див. [Plugin Diffs Language Pack](/uk/plugins/reference/diffs-language-pack) для деталей і [мови Shiki](https://shiki.style/languages) для upstream-каталогу мов і псевдонімів Shiki.

## Контракт деталей виводу

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
    Поля файлу, коли відтворюється PNG або PDF:

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

| Режим    | Що повертається                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Лише поля переглядача.                                                                                                  |
| `"file"` | Лише поля файлу, без артефакту переглядача.                                                                             |
| `"both"` | Поля переглядача разом із полями файлу. Якщо відтворення файлу не вдається, переглядач усе одно повертається з `fileError` і псевдонімом `imageError`. |

## Згорнуті незмінені розділи

- Переглядач може показувати рядки на кшталт `N unmodified lines`.
- Елементи керування розгортанням у цих рядках є умовними й не гарантуються для кожного типу вхідних даних.
- Елементи керування розгортанням з’являються, коли відтворений diff має розгортані контекстні дані, що типово для вхідних даних до і після.
- Для багатьох вхідних даних unified patch пропущені тіла контексту недоступні в розібраних hunks патча, тому рядок може з’явитися без елементів керування розгортанням. Це очікувана поведінка.
- `expandUnchanged` застосовується лише тоді, коли існує розгортаний контекст.

## Типові значення Plugin

Задайте типові значення для всього Plugin у `~/.openclaw/openclaw.json`:

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

### Конфігурація постійної URL-адреси переглядача

<ParamField path="viewerBaseUrl" type="string">
  Резервний варіант, яким володіє Plugin, для повернених посилань переглядача, коли виклик інструмента не передає `baseUrl`. Має бути `http` або `https`, без query/hash.
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
- Метадані артефакту переглядача містять:
  - випадковий ID артефакту (20 шістнадцяткових символів)
  - випадковий токен (48 шістнадцяткових символів)
  - `createdAt` і `expiresAt`
  - збережений шлях `viewer.html`
- Типовий TTL артефакту становить 30 хвилин, якщо його не вказано.
- Максимально прийнятий TTL переглядача становить 6 годин.
- Очищення запускається за можливості після створення артефакту.
- Прострочені артефакти видаляються.
- Резервне очищення видаляє застарілі папки старші за 24 години, коли метадані відсутні.

## URL переглядача та мережева поведінка

Маршрут переглядача:

- `/plugins/diffs/view/{artifactId}/{token}`

Ресурси переглядача:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`, коли diff використовує мову з Diff Viewer Language Pack

Документ переглядача розв’язує ці ресурси відносно URL переглядача, тому необов’язковий префікс шляху `baseUrl` також зберігається для обох запитів ресурсів.

Поведінка побудови URL:

- Якщо надано `baseUrl` виклику інструмента, він використовується після суворої перевірки.
- Інакше, якщо налаштовано `viewerBaseUrl` Plugin, він використовується.
- Без жодного перевизначення URL переглядача типово вказує на loopback `127.0.0.1`.
- Якщо режим прив’язування Gateway дорівнює `custom` і встановлено `gateway.customBindHost`, використовується цей хост.

Правила `baseUrl`:

- Має бути `http://` або `https://`.
- Query і hash відхиляються.
- Дозволено origin плюс необов’язковий базовий шлях.

## Модель безпеки

<AccordionGroup>
  <Accordion title="Посилення захисту переглядача">
    - Типово лише loopback.
    - Токенізовані шляхи переглядача із суворою перевіркою ID і токена.
    - CSP відповіді переглядача:
      - `default-src 'none'`
      - скрипти й ресурси лише з self
      - без вихідного `connect-src`
    - Обмеження віддалених промахів, коли віддалений доступ увімкнено:
      - 40 помилок за 60 секунд
      - блокування на 60 секунд (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Посилення захисту рендерингу файлів">
    - Маршрутизація запитів браузера для скриншотів типово забороняє все.
    - Дозволено лише локальні ресурси переглядача з `http://127.0.0.1/plugins/diffs/assets/*`.
    - Зовнішні мережеві запити блокуються.

  </Accordion>
</AccordionGroup>

## Вимоги браузера для файлового режиму

`mode: "file"` і `mode: "both"` потребують Chromium-сумісного браузера.

Порядок розв’язання:

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
  <Accordion title="Помилки перевірки вводу">
    - `Provide patch or both before and after text.` — додайте обидва значення `before` і `after` або надайте `patch`.
    - `Provide either patch or before/after input, not both.` — не змішуйте режими вводу.
    - `Invalid baseUrl: ...` — використовуйте origin `http(s)` з необов’язковим шляхом, без query/hash.
    - `{field} exceeds maximum size (...)` — зменште розмір payload.
    - Відхилення великого patch — зменште кількість файлів patch або загальну кількість рядків.

  </Accordion>
  <Accordion title="Доступність переглядача">
    - URL переглядача типово розв’язується в `127.0.0.1`.
    - Для сценаріїв віддаленого доступу:
      - задайте `viewerBaseUrl` Plugin, або
      - передайте `baseUrl` для кожного виклику інструмента, або
      - використовуйте `gateway.bind=custom` і `gateway.customBindHost`
    - Якщо `gateway.trustedProxies` містить loopback для проксі на тому самому хості (наприклад Tailscale Serve), прямі loopback-запити переглядача без пересланих заголовків client-IP за проєктом завершуються fail closed.
    - Для такої топології проксі:
      - віддавайте перевагу `mode: "file"` або `mode: "both"`, коли потрібне лише вкладення, або
      - навмисно ввімкніть `security.allowRemoteViewer` і задайте `viewerBaseUrl` Plugin або передайте проксі/публічний `baseUrl`, коли потрібен URL переглядача, яким можна поділитися
    - Вмикайте `security.allowRemoteViewer` лише тоді, коли ви маєте намір надати зовнішній доступ до переглядача.

  </Accordion>
  <Accordion title="Рядок незмінених рядків не має кнопки розгортання">
    Це може статися для вводу patch, коли patch не містить контексту, який можна розгорнути. Це очікувано й не вказує на збій переглядача.
  </Accordion>
  <Accordion title="Артефакт не знайдено">
    - Термін дії артефакту минув через TTL.
    - Токен або шлях змінився.
    - Очищення видалило застарілі дані.

  </Accordion>
</AccordionGroup>

## Операційні рекомендації

- Віддавайте перевагу `mode: "view"` для локальних інтерактивних оглядів у canvas.
- Віддавайте перевагу `mode: "file"` для вихідних чат-каналів, яким потрібне вкладення.
- Тримайте `allowRemoteViewer` вимкненим, якщо ваш deployment не потребує віддалених URL переглядача.
- Задавайте явний короткий `ttlSeconds` для чутливих diff.
- Уникайте надсилання секретів у ввід diff, коли це не потрібно.
- Якщо ваш канал агресивно стискає зображення (наприклад Telegram або WhatsApp), віддавайте перевагу PDF-виводу (`fileFormat: "pdf"`).

<Note>
Рушій рендерингу diff працює на основі [Diffs](https://diffs.com).
</Note>

## Пов’язане

- [Браузер](/uk/tools/browser)
- [Plugins](/uk/tools/plugin)
- [Огляд інструментів](/uk/tools)
