---
read_when:
    - Вы хотите, чтобы агенты показывали изменения кода или Markdown в виде diff-файлов
    - Вам нужен URL средства просмотра для Canvas или отрисованный файл различий
    - Вам нужны контролируемые временные артефакты различий с безопасными настройками по умолчанию
sidebarTitle: Diffs
summary: Средство просмотра различий и визуализации файлов только для чтения для агентов (необязательный инструмент плагина)
title: Различия
x-i18n:
    generated_at: "2026-07-13T20:20:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` — это необязательный встроенный инструмент плагина, который преобразует текст до и после изменения или унифицированный патч в доступный только для чтения артефакт различий. Он также добавляет краткие инструкции для агента в начало системного промпта и поставляется с сопутствующим навыком с более полными инструкциями.

Входные данные: текст `before` + `after` или унифицированный `patch` (взаимоисключающие варианты).

Выходные данные: URL средства просмотра Gateway для представления на холсте, путь к отрисованному файлу PNG/PDF для отправки в сообщении или оба варианта.

## Быстрый старт

<Steps>
  <Step title="Установите плагин">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Включите плагин">
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
  <Step title="Выберите режим">
    <Tabs>
      <Tab title="view">
        Сценарии с приоритетом холста: агенты вызывают `diffs` с `mode: "view"` и открывают `details.viewerUrl` с `canvas present`.
      </Tab>
      <Tab title="file">
        Отправка файла в чате: агенты вызывают `diffs` с `mode: "file"` и отправляют `details.filePath` с `message`, используя `path` или `filePath`.
      </Tab>
      <Tab title="both">
        Комбинированный режим (по умолчанию): агенты вызывают `diffs` с `mode: "both"`, чтобы получить оба артефакта одним вызовом.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Отключение встроенных системных инструкций

Чтобы сохранить инструмент, но убрать добавляемые в начало системного промпта инструкции, установите для `plugins.entries.diffs.hooks.allowPromptInjection` значение `false`:

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

Это блокирует хук `before_prompt_build` плагина, сохраняя доступность инструмента и навыка. Чтобы отключить и инструкции, и инструмент, отключите сам плагин.

## Справочник входных данных инструмента

Все поля необязательны, если не указано иное.

<ParamField path="before" type="string">
  Исходный текст. Требуется вместе с `after`, если `patch` не указан.
</ParamField>
<ParamField path="after" type="string">
  Обновлённый текст. Требуется вместе с `before`, если `patch` не указан.
</ParamField>
<ParamField path="patch" type="string">
  Текст унифицированных различий. Взаимоисключающий с `before` и `after`.
</ParamField>
<ParamField path="path" type="string">
  Отображаемое имя файла для режима «до/после».
</ParamField>
<ParamField path="lang" type="string">
  Подсказка для переопределения языка в режиме «до/после». Неизвестные значения и языки вне стандартного набора средства просмотра отображаются как обычный текст, если не установлен плагин Diff Viewer Language Pack.
</ParamField>
<ParamField path="title" type="string">
  Переопределение заголовка средства просмотра.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Режим вывода. По умолчанию используется значение плагина `defaults.mode` (`both`). Устаревший псевдоним: `"image"` работает идентично `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Тема средства просмотра. По умолчанию используется значение плагина `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Макет различий. По умолчанию используется значение плагина `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Разворачивать неизменённые разделы, когда доступен полный контекст. Параметр только для отдельного вызова (не ключ значения плагина по умолчанию).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Формат отрисованного файла. По умолчанию используется значение плагина `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Предустановка качества отрисовки PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Переопределение масштаба устройства (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Максимальная ширина отрисовки в пикселях CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Срок жизни артефакта в секундах для выходных данных средства просмотра и отдельных файлов. Максимум — `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Переопределение источника URL средства просмотра. Переопределяет значение плагина `viewerBaseUrl`. Должно быть `http` или `https`, без строки запроса и хеша.
</ParamField>

<AccordionGroup>
  <Accordion title="Проверка и ограничения">
    - `before`/`after`: максимум 512 КиБ каждый.
    - `patch`: максимум 2 МиБ.
    - `path`: максимум 2048 байт.
    - `lang`: максимум 128 байт.
    - `title`: максимум 1024 байта.
    - Ограничение сложности патча: максимум 128 файлов и 120000 строк суммарно.
    - Сочетание `patch` с `before`/`after` отклоняется.
    - Ограничения безопасности отрисованных файлов (PNG и PDF):
      - `fileQuality: "standard"`: максимум 8 Мпикс. (8,000,000 отрисованных пикселей).
      - `fileQuality: "hq"`: максимум 14 Мпикс.
      - `fileQuality: "print"`: максимум 24 Мпикс.
      - Для PDF также действует ограничение в 50 страниц.

  </Accordion>
</AccordionGroup>

## Подсветка синтаксиса

Встроенные языки:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` и `toml`.

Распространённые псевдонимы (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` и т. д.) нормализуются в эти языки.

Для поддержки дополнительных языков (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff и других) установите плагин Diff Viewer Language Pack:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Без пакета неподдерживаемые языки всё равно отображаются как читаемый обычный текст. Сведения об исходном каталоге см. в разделах [Плагин Diffs Language Pack](/ru/plugins/reference/diffs-language-pack) и [Языки Shiki](https://shiki.style/languages).

## Контракт выходных данных

Все успешные результаты содержат `changed`: при идентичных входных данных «до» и «после» возвращается `false` без создания артефакта; для отрисованных результатов возвращается `true`.

<AccordionGroup>
  <Accordion title="Поля средства просмотра (режимы view и both)">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, если доступны)

  </Accordion>
  <Accordion title="Поля файла (режимы file и both)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (то же значение, что и `filePath`, для совместимости с инструментом сообщений)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| Режим     | Возвращаемые данные                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | Только поля средства просмотра.                                                                             |
| `"file"` | Только поля файла, без артефакта средства просмотра.                                                           |
| `"both"` | Поля средства просмотра и поля файла. Если отрисовка файла завершается с ошибкой, средство просмотра всё равно возвращается с `fileError`. |

### Свёрнутые неизменённые разделы

Средство просмотра показывает строки вида `N unmodified lines`. Элементы управления разворачиванием появляются только в том случае, если отрисованные различия содержат данные контекста, доступные для разворачивания (обычно для входных данных «до/после»). Во многих унифицированных патчах тела контекста в блоках отсутствуют, поэтому строка может отображаться без элемента управления разворачиванием — это ожидаемое поведение, а не ошибка. `expandUnchanged` применяется только при наличии контекста, доступного для разворачивания.

### Навигация по нескольким файлам

Патчи, затрагивающие более одного файла, начинаются со сводной карточки изменённых файлов: общее количество `+N` / `-N`, количество для каждого файла, значки добавления, удаления и переименования, а также якорные ссылки для перехода к каждому файлу. В отрисованных файлах PNG/PDF сохраняются количества в заголовках каждого файла, но удаляются интерактивные переключатели представления, поскольку в статическом файле они не работают.

## Значения плагина по умолчанию

Задайте общие значения плагина по умолчанию в `~/.openclaw/openclaw.json`:

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

Поддерживаемые ключи `defaults`: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Явные параметры вызова инструмента переопределяют их.

### Конфигурация постоянного URL средства просмотра

<ParamField path="viewerBaseUrl" type="string">
  Резервное значение, принадлежащее плагину, для возвращаемых ссылок средства просмотра, когда вызов инструмента не передаёт `baseUrl`. Должно быть `http` или `https`, без строки запроса и хеша.
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

## Конфигурация безопасности

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: запросы к маршрутам средства просмотра не с loopback-адресов запрещены. `true`: удалённые средства просмотра разрешены, если токенизированный путь действителен.
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

## Жизненный цикл и хранение артефактов

- Артефакты хранятся в `$TMPDIR/openclaw-diffs`.
- Метаданные средства просмотра содержат случайный 20-символьный шестнадцатеричный идентификатор артефакта, случайный 48-символьный шестнадцатеричный токен, `createdAt`/`expiresAt` и сохранённый путь `viewer.html`.
- Срок жизни артефакта по умолчанию: 30 минут. Максимальный допустимый срок жизни: 6 часов.
- Очистка выполняется по возможности после каждого вызова создания артефакта; просроченные артефакты удаляются.
- Резервная очистка удаляет устаревшие папки старше 24 часов при отсутствии метаданных.

## URL средства просмотра и сетевое поведение

Маршрут средства просмотра: `/plugins/diffs/view/{artifactId}/{token}`

Ресурсы средства просмотра:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (только когда в diff используется язык языкового пакета)

Документ средства просмотра разрешает эти ресурсы относительно URL средства просмотра, поэтому необязательный префикс пути `baseUrl` также применяется к запросам ресурсов.

Порядок разрешения URL: `baseUrl` вызова инструмента (после строгой проверки) -> `viewerBaseUrl` плагина -> значение по умолчанию для loopback `127.0.0.1`. Если режим привязки Gateway — `custom` и задан `gateway.customBindHost`, вместо loopback используется этот хост.

Правила для `baseUrl`: значение должно быть `http://` или `https://`; строка запроса и хеш отклоняются; допускается источник с необязательным базовым путём.

## Модель безопасности

<AccordionGroup>
  <Accordion title="Усиление защиты средства просмотра">
    - По умолчанию доступ только через loopback.
    - Пути средства просмотра с токенами и строгой проверкой формата идентификатора и токена.
    - CSP ответа средства просмотра: `default-src 'none'`; скрипты и ресурсы — только из того же источника; исходящие `connect-src` запрещены.
    - Ограничение частоты удалённых промахов при включённом удалённом доступе: 40 ошибок за 60 секунд приводят к блокировке на 60 секунд (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Усиление защиты при рендеринге файлов">
    - Маршрутизация запросов браузера для снимков экрана по умолчанию запрещена.
    - Разрешены только локальные ресурсы средства просмотра из `http://127.0.0.1/plugins/diffs/assets/*`.
    - Внешние сетевые запросы блокируются.

  </Accordion>
</AccordionGroup>

## Требования к браузеру для файлового режима

Для `mode: "file"` и `mode: "both"` требуется браузер, совместимый с Chromium.

Порядок разрешения:

<Steps>
  <Step title="Конфигурация">
    `browser.executablePath` в конфигурации OpenClaw.
  </Step>
  <Step title="Переменные среды">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Резервный вариант для платформы">
    Типичные пути установки и поиск через `PATH` для Chrome, Chromium, Edge и Brave.
  </Step>
</Steps>

Типичный текст ошибки: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Чтобы исправить её, установите Chrome, Chromium, Edge или Brave либо задайте один из указанных выше параметров пути к исполняемому файлу.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Ошибки проверки входных данных">
    - `Provide patch or both before and after text.` — укажите и `before`, и `after` либо предоставьте `patch`.
    - `Provide either patch or before/after input, not both.` — не смешивайте режимы ввода.
    - `Invalid baseUrl: ...` — используйте источник `http(s)` с необязательным путём, без строки запроса и хеша.
    - `{field} exceeds maximum size (...)` — уменьшите размер полезной нагрузки.
    - Отклонение крупного патча — уменьшите количество файлов патча или общее число строк.

  </Accordion>
  <Accordion title="Доступность средства просмотра">
    - По умолчанию URL средства просмотра разрешается в `127.0.0.1`.
    - Для удалённого доступа задайте `viewerBaseUrl` плагина, передавайте `baseUrl` при каждом вызове или используйте `gateway.bind=custom` с `gateway.customBindHost`.
    - Если `gateway.trustedProxies` включает loopback для прокси на том же хосте (например, Tailscale Serve), необработанные loopback-запросы к средству просмотра без перенаправленных заголовков IP-адреса клиента намеренно отклоняются.
    - Для такой топологии прокси предпочтительно использовать `mode: "file"`/`"both"` для вложения либо намеренно включить `security.allowRemoteViewer` вместе с `viewerBaseUrl` плагина или `baseUrl` прокси, чтобы получить общедоступную ссылку на средство просмотра.
    - Включайте `security.allowRemoteViewer`, только если предполагается внешний доступ к средству просмотра.

  </Accordion>
  <Accordion title="В строке неизменённых строк нет кнопки разворачивания">
    Это ожидаемо для входных данных патча без доступного для разворачивания контекста; это не сбой средства просмотра.
  </Accordion>
  <Accordion title="Артефакт не найден">
    - Срок действия артефакта истёк из-за TTL.
    - Токен или путь изменился.
    - При очистке были удалены устаревшие данные.

  </Accordion>
</AccordionGroup>

## Рекомендации по эксплуатации

- Для локальной интерактивной проверки на холсте предпочтительно использовать `mode: "view"`.
- Для исходящих каналов чата, которым требуется вложение, предпочтительно использовать `mode: "file"`.
- Оставляйте `allowRemoteViewer` отключённым, если вашему развёртыванию не требуются удалённые URL средства просмотра.
- Для конфиденциальных diff явно задавайте короткое значение `ttlSeconds`.
- Не отправляйте секреты во входных данных diff, если это не требуется.
- Если ваш канал применяет сильное сжатие изображений (например, Telegram или WhatsApp), предпочтительно использовать вывод в PDF (`fileFormat: "pdf"`).

<Note>
Движок рендеринга diff работает на базе [Diffs](https://diffs.com).
</Note>

## Связанные материалы

- [Браузер](/ru/tools/browser)
- [Плагины](/ru/tools/plugin)
- [Обзор инструментов](/ru/tools)
