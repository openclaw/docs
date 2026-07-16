---
read_when:
    - Ви хочете, щоб агенти показували зміни в коді або Markdown у вигляді різниць
    - Вам потрібна готова для canvas URL-адреса засобу перегляду або відтворений файл різниці.
    - Вам потрібні контрольовані тимчасові артефакти різниці із безпечними параметрами за замовчуванням
sidebarTitle: Diffs
summary: Засіб перегляду відмінностей і візуалізації файлів лише для читання для агентів (необов’язковий інструмент плагіна)
title: Відмінності
x-i18n:
    generated_at: "2026-07-16T18:40:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` — це необов’язковий вбудований інструмент Plugin, який перетворює текст до/після або уніфікований патч на артефакт різниці лише для читання. Він також додає на початок системного запиту короткі настанови для агента й постачається із супровідною навичкою з докладнішими інструкціями.

Вхідні дані: текст `before` + `after` або уніфікований `patch` (взаємовиключні варіанти).

Вихідні дані: URL засобу перегляду Gateway для представлення на полотні, шлях до відтвореного файлу PNG/PDF для надсилання в повідомленні або обидва варіанти.

## Швидкий початок

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
        Потоки, орієнтовані насамперед на полотно: агенти викликають `diffs` з `mode: "view"` і відкривають `details.viewerUrl` за допомогою `canvas present`.
      </Tab>
      <Tab title="file">
        Надсилання файлу в чаті: агенти викликають `diffs` з `mode: "file"` і надсилають `details.filePath` з `message` за допомогою `path` або `filePath`.
      </Tab>
      <Tab title="both">
        Комбінований режим (типовий): агенти викликають `diffs` з `mode: "both"`, щоб отримати обидва артефакти одним викликом.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Вимкнення вбудованих системних настанов

Щоб зберегти інструмент, але прибрати настанови, додані на початок системного запиту, задайте для `plugins.entries.diffs.hooks.allowPromptInjection` значення `false`:

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

Це блокує хук `before_prompt_build` Plugin, залишаючи інструмент і навичку доступними. Щоб вимкнути і настанови, і інструмент, натомість вимкніть Plugin.

## Довідник вхідних параметрів інструмента

Усі поля необов’язкові, якщо не зазначено інше.

<ParamField path="before" type="string">
  Початковий текст. Обов’язковий разом із `after`, якщо `patch` не вказано.
</ParamField>
<ParamField path="after" type="string">
  Оновлений текст. Обов’язковий разом із `before`, якщо `patch` не вказано.
</ParamField>
<ParamField path="patch" type="string">
  Текст уніфікованої різниці. Взаємовиключний із `before` та `after`.
</ParamField>
<ParamField path="path" type="string">
  Відображуване ім’я файлу для режиму до/після.
</ParamField>
<ParamField path="lang" type="string">
  Підказка для перевизначення мови в режимі до/після. Невідомі значення та мови поза типовим набором засобу перегляду повертаються до звичайного тексту, якщо не встановлено Plugin мовного пакета засобу перегляду різниці.
</ParamField>
<ParamField path="title" type="string">
  Перевизначення заголовка засобу перегляду.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Режим виведення. Типово використовується значення Plugin `defaults.mode` (`both`). Застарілий псевдонім: `"image"` працює так само, як `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Тема засобу перегляду. Типово використовується значення Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Компонування різниці. Типово використовується значення Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Розгортати незмінені розділи, коли доступний повний контекст. Параметр лише для окремого виклику (не типовий ключ Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Формат відтвореного файлу. Типово використовується значення Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Попередньо налаштований рівень якості відтворення PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Перевизначення масштабу пристрою (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Максимальна ширина відтворення в пікселях CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL артефакту в секундах для засобу перегляду та окремих файлових результатів. Максимум — `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Перевизначення джерела URL засобу перегляду. Перевизначає `viewerBaseUrl` Plugin. Має бути `http` або `https`, без запиту чи хешу.
</ParamField>

<AccordionGroup>
  <Accordion title="Перевірка та обмеження">
    - `before`/`after`: максимум 512 КіБ кожен.
    - `patch`: максимум 2 МіБ.
    - `path`: максимум 2048 байтів.
    - `lang`: максимум 128 байтів.
    - `title`: максимум 1024 байти.
    - Обмеження складності патча: максимум 128 файлів і 120000 рядків загалом.
    - `patch` разом із `before`/`after` відхиляється.
    - Безпекові обмеження для відтворених файлів (PNG і PDF):
      - `fileQuality: "standard"`: максимум 8 МП (8,000,000 відтворених пікселів).
      - `fileQuality: "hq"`: максимум 14 МП.
      - `fileQuality: "print"`: максимум 24 МП.
      - PDF також обмежено 50 сторінками.

  </Accordion>
</AccordionGroup>

## Підсвічування синтаксису

Вбудовані мови:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` та `toml`.

Поширені псевдоніми (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` тощо) нормалізуються до цих мов.

Установіть Plugin мовного пакета засобу перегляду різниці, щоб отримати більше мов (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff та інші):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Без пакета непідтримувані мови все одно відтворюються як читабельний звичайний текст. Повний каталог див. у розділах [Plugin мовного пакета Diffs](/uk/plugins/reference/diffs-language-pack) і [мови Shiki](https://shiki.style/languages).

## Контракт вихідних даних

Усі успішні результати містять `changed`: однакові вхідні дані до/після повертають `false` без створення артефакту; відтворені результати повертають `true`.

<AccordionGroup>
  <Accordion title="Поля засобу перегляду (режими view і both)">
    - `changed`
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
  <Accordion title="Поля файлу (режими file і both)">
    - `changed`
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
</AccordionGroup>

| Режим     | Повертає                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | Лише поля засобу перегляду.                                                                             |
| `"file"` | Лише поля файлу, без артефакту засобу перегляду.                                                           |
| `"both"` | Поля засобу перегляду та поля файлу. Якщо відтворити файл не вдається, засіб перегляду все одно повертається з `fileError`. |

### Згорнуті незмінені розділи

Засіб перегляду показує рядки на кшталт `N unmodified lines`. Елементи керування розгортанням з’являються лише тоді, коли відтворена різниця містить контекстні дані, які можна розгорнути (типово для вхідних даних до/після). У багатьох уніфікованих патчах тіла контексту у фрагментах відсутні, тому рядок може з’явитися без елемента керування розгортанням — це очікувана поведінка, а не помилка. `expandUnchanged` застосовується лише за наявності контексту, який можна розгорнути.

### Навігація між кількома файлами

Патчі, що змінюють кілька файлів, починаються з картки зведення змінених файлів: загальна кількість `+N` / `-N`, кількість для кожного файлу, позначки додавання/видалення/перейменування та якірні посилання для переходу до кожного файлу. У відтворених файлах PNG/PDF зберігається кількість у заголовку кожного файлу, але інтерактивні перемикачі подання прибираються, оскільки у статичному файлі вони не працюють.

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
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

Підтримувані ключі `defaults`: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Явні параметри виклику інструмента перевизначають їх.

### Постійна конфігурація URL засобу перегляду

<ParamField path="viewerBaseUrl" type="string">
  Резервне значення, яким керує Plugin, для повернутих посилань засобу перегляду, коли виклик інструмента не передає `baseUrl`. Має бути `http` або `https`, без запиту чи хешу.
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
  `false`: запити до маршрутів засобу перегляду не з кільцевої адреси відхиляються. `true`: віддалені засоби перегляду дозволені, якщо шлях із токеном дійсний.
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

- Артефакти зберігаються в `$TMPDIR/openclaw-diffs`.
- Метадані засобу перегляду зберігають випадковий 20-символьний шістнадцятковий ідентифікатор артефакту, випадковий 48-символьний шістнадцятковий токен, `createdAt`/`expiresAt` і збережений шлях `viewer.html`.
- Типовий TTL артефакту: 30 хвилин. Максимальний прийнятний TTL: 6 годин.
- Очищення виконується за нагоди після кожного виклику створення артефакту; прострочені артефакти видаляються.
- Резервне сканування видаляє застарілі папки, старші за 24 години, якщо метадані відсутні.

## URL засобу перегляду та мережева поведінка

Маршрут засобу перегляду: `/plugins/diffs/view/{artifactId}/{token}`

Ресурси засобу перегляду:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (лише коли diff використовує мову мовного пакета)

Документ засобу перегляду визначає ці ресурси відносно URL-адреси засобу перегляду, тому необов’язковий префікс шляху `baseUrl` також застосовується до запитів ресурсів.

Порядок визначення URL-адреси: `baseUrl` виклику інструмента (після суворої перевірки) -> `viewerBaseUrl` плагіна -> стандартне значення loopback `127.0.0.1`. Якщо режим прив’язки Gateway — `custom` і задано `gateway.customBindHost`, замість loopback використовується цей хост.

Правила `baseUrl`: значення має бути `http://` або `https://`; запит і хеш відхиляються; дозволено origin із необов’язковим базовим шляхом.

## Модель безпеки

<AccordionGroup>
  <Accordion title="Захист засобу перегляду">
    - За замовчуванням доступ лише через loopback.
    - Токенізовані шляхи засобу перегляду із суворою перевіркою шаблонів ідентифікатора й токена.
    - CSP відповіді засобу перегляду: `default-src 'none'`; скрипти й ресурси — лише із self; без вихідних `connect-src`.
    - Обмеження частоти віддалених невдалих запитів, коли ввімкнено віддалений доступ: 40 невдалих спроб за 60 секунд спричиняють блокування на 60 секунд (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Захист відтворення файлів">
    - Маршрутизація запитів браузера для знімків екрана за замовчуванням усе забороняє.
    - Дозволено лише локальні ресурси засобу перегляду з `http://127.0.0.1/plugins/diffs/assets/*`.
    - Зовнішні мережеві запити заблоковано.

  </Accordion>
</AccordionGroup>

## Вимоги до браузера для файлового режиму

Для `mode: "file"` і `mode: "both"` потрібен браузер, сумісний із Chromium.

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
    Типові шляхи встановлення та пошуки `PATH` для Chrome, Chromium, Edge і Brave.
  </Step>
</Steps>

Типовий текст помилки: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Щоб виправити її, установіть Chrome, Chromium, Edge або Brave чи задайте один із наведених вище параметрів шляху до виконуваного файлу.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки перевірки вхідних даних">
    - `Provide patch or both before and after text.` -- укажіть і `before`, і `after` або надайте `patch`.
    - `Provide either patch or before/after input, not both.` -- не поєднуйте режими введення.
    - `Invalid baseUrl: ...` -- використовуйте origin `http(s)` з необов’язковим шляхом, без запиту чи хешу.
    - `{field} exceeds maximum size (...)` -- зменште розмір корисного навантаження.
    - Відхилення великого патча -- зменште кількість файлів патча або загальну кількість рядків.

  </Accordion>
  <Accordion title="Доступність засобу перегляду">
    - За замовчуванням URL-адреса засобу перегляду визначається як `127.0.0.1`.
    - Для віддаленого доступу задайте `viewerBaseUrl` плагіна, передавайте `baseUrl` під час кожного виклику або використовуйте `gateway.bind=custom` з `gateway.customBindHost`.
    - Якщо `gateway.trustedProxies` включає loopback для проксі на тому самому хості (наприклад, Tailscale Serve), необроблені loopback-запити засобу перегляду без пересланих заголовків IP-адреси клієнта навмисно завершуються відмовою.
    - Для такої топології проксі віддавайте перевагу `mode: "file"`/`"both"` для вкладення або навмисно ввімкніть `security.allowRemoteViewer` разом із `viewerBaseUrl` плагіна чи `baseUrl` проксі для посилання на засіб перегляду, яким можна поділитися.
    - Вмикайте `security.allowRemoteViewer`, лише коли потрібен зовнішній доступ до засобу перегляду.

  </Accordion>
  <Accordion title="У рядку незмінених рядків немає кнопки розгортання">
    Це очікувана поведінка для вхідного патча без контексту, який можна розгорнути; це не помилка засобу перегляду.
  </Accordion>
  <Accordion title="Артефакт не знайдено">
    - Термін дії артефакту минув через TTL.
    - Токен або шлях змінено.
    - Під час очищення видалено застарілі дані.

  </Accordion>
</AccordionGroup>

## Рекомендації з експлуатації

- Віддавайте перевагу `mode: "view"` для локальних інтерактивних перевірок на полотні.
- Віддавайте перевагу `mode: "file"` для вихідних каналів чату, яким потрібне вкладення.
- Не вмикайте `allowRemoteViewer`, якщо розгортанню не потрібні віддалені URL-адреси засобу перегляду.
- Задайте явне коротке значення `ttlSeconds` для конфіденційних diff.
- Не надсилайте секрети у вхідних даних diff, якщо це не потрібно.
- Якщо канал застосовує інтенсивне стиснення зображень (наприклад, Telegram або WhatsApp), віддавайте перевагу виведенню у форматі PDF (`fileFormat: "pdf"`).

<Note>
Рушій відтворення diff працює на основі [Diffs](https://diffs.com).
</Note>

## Пов’язані матеріали

- [Браузер](/uk/tools/browser)
- [Плагіни](/uk/tools/plugin)
- [Огляд інструментів](/uk/tools)
