---
read_when:
    - Вы хотите, чтобы агенты показывали правки кода или Markdown в виде diff-файлов
    - Вам нужен URL для просмотра, готового к canvas, или отрендеренный файл diff
    - Вам нужны контролируемые временные артефакты diff с безопасными настройками по умолчанию
sidebarTitle: Diffs
summary: Средство просмотра diff в режиме только для чтения и рендерер файлов для агентов (необязательный инструмент Plugin)
title: Различия
x-i18n:
    generated_at: "2026-06-28T23:50:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` — необязательный инструмент Plugin с краткими встроенными системными указаниями и сопутствующим Skill, который превращает содержимое изменений в доступный только для чтения артефакт diff для агентов.

Он принимает:

- текст `before` и `after`
- унифицированный `patch`

Он может возвращать:

- URL просмотрщика Gateway для представления на canvas
- путь к отрендеренному файлу (PNG или PDF) для доставки в сообщении
- оба результата за один вызов

Если плагин включен, он добавляет краткие указания по использованию в пространство системного промпта, а также предоставляет подробный Skill для случаев, когда агенту нужны более полные инструкции.

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
        Потоки с приоритетом canvas: агенты вызывают `diffs` с `mode: "view"` и открывают `details.viewerUrl` с помощью `canvas present`.
      </Tab>
      <Tab title="file">
        Доставка файла в чате: агенты вызывают `diffs` с `mode: "file"` и отправляют `details.filePath` через `message`, используя `path` или `filePath`.
      </Tab>
      <Tab title="both">
        Комбинированный режим: агенты вызывают `diffs` с `mode: "both"`, чтобы получить оба артефакта за один вызов.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Отключение встроенных системных указаний

Если вы хотите оставить инструмент `diffs` включенным, но отключить его встроенные указания для системного промпта, установите `plugins.entries.diffs.hooks.allowPromptInjection` в `false`:

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

Это блокирует хук `before_prompt_build` плагина diffs, сохраняя доступными сам плагин, инструмент и сопутствующий Skill.

Если вы хотите отключить и указания, и инструмент, отключите плагин.

## Типичный рабочий процесс агента

<Steps>
  <Step title="Вызов diffs">
    Агент вызывает инструмент `diffs` с входными данными.
  </Step>
  <Step title="Чтение details">
    Агент читает поля `details` из ответа.
  </Step>
  <Step title="Представление">
    Агент либо открывает `details.viewerUrl` с помощью `canvas present`, либо отправляет `details.filePath` через `message`, используя `path` или `filePath`, либо делает и то и другое.
  </Step>
</Steps>

## Примеры входных данных

<Tabs>
  <Tab title="До и после">
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

## Справочник входных данных инструмента

Все поля необязательны, если не указано иное.

<ParamField path="before" type="string">
  Исходный текст. Обязательно вместе с `after`, если `patch` не указан.
</ParamField>
<ParamField path="after" type="string">
  Обновленный текст. Обязательно вместе с `before`, если `patch` не указан.
</ParamField>
<ParamField path="patch" type="string">
  Текст унифицированного diff. Взаимоисключается с `before` и `after`.
</ParamField>
<ParamField path="path" type="string">
  Отображаемое имя файла для режима до и после.
</ParamField>
<ParamField path="lang" type="string">
  Подсказка для переопределения языка в режиме до и после. Неизвестные значения и языки вне стандартного набора просмотрщика откатываются к простому тексту, если не установлен плагин
  Diff Viewer Language Pack.
</ParamField>

<ParamField path="title" type="string">
  Переопределение заголовка просмотрщика.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Режим вывода. По умолчанию используется значение плагина `defaults.mode`. Устаревший псевдоним: `"image"` ведет себя как `"file"` и по-прежнему принимается для обратной совместимости.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Тема просмотрщика. По умолчанию используется значение плагина `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Макет diff. По умолчанию используется значение плагина `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Разворачивать неизмененные разделы, когда доступен полный контекст. Только опция отдельного вызова (не ключ по умолчанию плагина).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Формат отрендеренного файла. По умолчанию используется значение плагина `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Предустановка качества для рендеринга PNG или PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Переопределение масштаба устройства (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Максимальная ширина рендеринга в CSS-пикселях (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL артефакта в секундах для просмотрщика и автономных файловых выводов. Максимум 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Переопределение origin URL просмотрщика. Переопределяет `viewerBaseUrl` плагина. Должен быть `http` или `https`, без query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Устаревшие псевдонимы входных данных">
    По-прежнему принимаются для обратной совместимости:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Валидация и ограничения">
    - `before` и `after`: максимум 512 KiB каждый.
    - `patch`: максимум 2 MiB.
    - `path`: максимум 2048 байт.
    - `lang`: максимум 128 байт.
    - `title`: максимум 1024 байта.
    - Ограничение сложности patch: максимум 128 файлов и 120000 строк суммарно.
    - `patch` вместе с `before` или `after` отклоняется.
    - Ограничения безопасности отрендеренного файла (применяются к PNG и PDF):
      - `fileQuality: "standard"`: максимум 8 MP (8 000 000 отрендеренных пикселей).
      - `fileQuality: "hq"`: максимум 14 MP (14 000 000 отрендеренных пикселей).
      - `fileQuality: "print"`: максимум 24 MP (24 000 000 отрендеренных пикселей).
      - Для PDF также действует максимум 50 страниц.

  </Accordion>
</AccordionGroup>

## Подсветка синтаксиса

OpenClaw включает подсветку синтаксиса для распространенных языков исходного кода, конфигурации и документации:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` и `toml`.

Распространенные псевдонимы, такие как `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt` и `ps1`, нормализуются к этим стандартным языкам.

Установите Plugin языкового пакета просмотрщика различий, чтобы подсвечивать другие языки:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Когда языковой пакет доступен, OpenClaw может подсвечивать гораздо больше языков. Если пакет не установлен, файлы вне списка по умолчанию все равно отображаются как читаемый простой текст. Примеры включают Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI и diff-файлы.

Подробности см. в разделе [Plugin Diffs Language Pack](/ru/plugins/reference/diffs-language-pack), а каталог языков и псевдонимов верхнего уровня Shiki — в [языках Shiki](https://shiki.style/languages).

## Контракт сведений вывода

Инструмент возвращает структурированные метаданные в `details`.

<AccordionGroup>
  <Accordion title="Поля просмотрщика">
    Общие поля для режимов, создающих просмотрщик:

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
  <Accordion title="Поля файла">
    Поля файла при рендеринге PNG или PDF:

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
  <Accordion title="Псевдонимы совместимости">
    Также возвращаются для существующих вызывающих сторон:

    - `format` (то же значение, что и `fileFormat`)
    - `imagePath` (то же значение, что и `filePath`)
    - `imageBytes` (то же значение, что и `fileBytes`)
    - `imageQuality` (то же значение, что и `fileQuality`)
    - `imageScale` (то же значение, что и `fileScale`)
    - `imageMaxWidth` (то же значение, что и `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Сводка поведения режимов:

| Режим    | Что возвращается                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Только поля просмотрщика.                                                                                                           |
| `"file"` | Только поля файла, без артефакта просмотрщика.                                                                                      |
| `"both"` | Поля просмотрщика плюс поля файла. Если рендеринг файла завершается неудачей, просмотрщик все равно возвращается с псевдонимом `fileError` и `imageError`. |

## Свернутые неизмененные разделы

- Средство просмотра может показывать строки вида `N unmodified lines`.
- Элементы управления раскрытием для таких строк условны и не гарантируются для каждого вида ввода.
- Элементы управления раскрытием появляются, когда отрисованный diff содержит данные раскрываемого контекста, что типично для ввода до и после.
- Для многих входных данных в формате unified patch пропущенные тела контекста недоступны в разобранных hunks патча, поэтому строка может отображаться без элементов управления раскрытием. Это ожидаемое поведение.
- `expandUnchanged` применяется только при наличии раскрываемого контекста.

## Настройки Plugin по умолчанию

Задайте настройки по умолчанию для всего plugin в `~/.openclaw/openclaw.json`:

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

Поддерживаемые настройки по умолчанию:

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

Явные параметры инструмента переопределяют эти настройки по умолчанию.

### Постоянная конфигурация URL средства просмотра

<ParamField path="viewerBaseUrl" type="string">
  Резервное значение, принадлежащее Plugin, для возвращаемых ссылок средства просмотра, когда вызов инструмента не передает `baseUrl`. Должно быть `http` или `https`, без строки запроса/хэша.
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
  `false`: не-loopback-запросы к маршрутам средства просмотра отклоняются. `true`: удаленные средства просмотра разрешены, если токенизированный путь действителен.
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

- Артефакты хранятся во временной подпапке: `$TMPDIR/openclaw-diffs`.
- Метаданные артефакта просмотрщика содержат:
  - случайный ID артефакта (20 шестнадцатеричных символов)
  - случайный токен (48 шестнадцатеричных символов)
  - `createdAt` и `expiresAt`
  - сохраненный путь `viewer.html`
- TTL артефакта по умолчанию составляет 30 минут, если не указан.
- Максимально допустимый TTL просмотрщика составляет 6 часов.
- Очистка запускается оппортунистически после создания артефакта.
- Истекшие артефакты удаляются.
- Резервная очистка удаляет устаревшие папки старше 24 часов, если метаданные отсутствуют.

## URL просмотрщика и сетевое поведение

Маршрут просмотрщика:

- `/plugins/diffs/view/{artifactId}/{token}`

Ресурсы просмотрщика:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`, когда diff использует язык из Diff Viewer Language Pack

Документ просмотрщика разрешает эти ресурсы относительно URL просмотрщика, поэтому необязательный префикс пути `baseUrl` также сохраняется для обоих запросов ресурсов.

Поведение построения URL:

- Если в tool-call предоставлен `baseUrl`, он используется после строгой проверки.
- Иначе, если настроен `viewerBaseUrl` плагина, используется он.
- Без любого из этих переопределений URL просмотрщика по умолчанию указывает на loopback `127.0.0.1`.
- Если режим привязки Gateway равен `custom` и задан `gateway.customBindHost`, используется этот хост.

Правила `baseUrl`:

- Должен быть `http://` или `https://`.
- Query и hash отклоняются.
- Разрешены origin плюс необязательный базовый путь.

## Модель безопасности

<AccordionGroup>
  <Accordion title="Viewer hardening">
    - По умолчанию только loopback.
    - Токенизированные пути просмотрщика со строгой проверкой ID и токена.
    - CSP ответа просмотрщика:
      - `default-src 'none'`
      - скрипты и ресурсы только из self
      - без исходящих `connect-src`
    - Ограничение удаленных промахов при включенном удаленном доступе:
      - 40 сбоев за 60 секунд
      - блокировка на 60 секунд (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="File rendering hardening">
    - Маршрутизация запросов браузера для скриншотов по умолчанию запрещающая.
    - Разрешены только локальные ресурсы просмотрщика из `http://127.0.0.1/plugins/diffs/assets/*`.
    - Внешние сетевые запросы блокируются.

  </Accordion>
</AccordionGroup>

## Требования браузера для файлового режима

`mode: "file"` и `mode: "both"` требуют Chromium-совместимый браузер.

Порядок разрешения:

<Steps>
  <Step title="Config">
    `browser.executablePath` в конфигурации OpenClaw.
  </Step>
  <Step title="Environment variables">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platform fallback">
    Резервное обнаружение команды/пути платформы.
  </Step>
</Steps>

Распространенный текст ошибки:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Исправьте, установив Chrome, Chromium, Edge или Brave либо задав один из вариантов пути к исполняемому файлу выше.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Input validation errors">
    - `Provide patch or both before and after text.` — укажите оба значения `before` и `after` или предоставьте `patch`.
    - `Provide either patch or before/after input, not both.` — не смешивайте режимы ввода.
    - `Invalid baseUrl: ...` — используйте origin `http(s)` с необязательным путем, без query/hash.
    - `{field} exceeds maximum size (...)` — уменьшите размер полезной нагрузки.
    - Отклонение большого patch — уменьшите количество файлов patch или общее число строк.

  </Accordion>
  <Accordion title="Viewer accessibility">
    - URL просмотрщика по умолчанию разрешается в `127.0.0.1`.
    - Для сценариев удаленного доступа:
      - задайте `viewerBaseUrl` плагина, или
      - передайте `baseUrl` для каждого вызова инструмента, или
      - используйте `gateway.bind=custom` и `gateway.customBindHost`
    - Если `gateway.trustedProxies` включает loopback для прокси на том же хосте (например, Tailscale Serve), необработанные loopback-запросы просмотрщика без перенаправленных заголовков client-IP завершаются отказом по замыслу.
    - Для такой топологии прокси:
      - предпочитайте `mode: "file"` или `mode: "both"`, когда вам нужно только вложение, или
      - намеренно включите `security.allowRemoteViewer` и задайте `viewerBaseUrl` плагина либо передайте прокси/публичный `baseUrl`, когда нужен URL просмотрщика, которым можно поделиться
    - Включайте `security.allowRemoteViewer` только если вам намеренно нужен внешний доступ к просмотрщику.

  </Accordion>
  <Accordion title="Unmodified-lines row has no expand button">
    Это может происходить для ввода patch, когда patch не содержит разворачиваемого контекста. Это ожидаемо и не указывает на сбой просмотрщика.
  </Accordion>
  <Accordion title="Artifact not found">
    - Срок действия артефакта истек из-за TTL.
    - Токен или путь изменился.
    - Очистка удалила устаревшие данные.

  </Accordion>
</AccordionGroup>

## Эксплуатационные рекомендации

- Предпочитайте `mode: "view"` для локальных интерактивных ревью в canvas.
- Предпочитайте `mode: "file"` для исходящих чат-каналов, которым нужно вложение.
- Оставляйте `allowRemoteViewer` отключенным, если вашему развертыванию не требуются URL удаленного просмотрщика.
- Задавайте явный короткий `ttlSeconds` для чувствительных diff.
- Избегайте отправки секретов во входных данных diff, когда это не требуется.
- Если ваш канал агрессивно сжимает изображения (например, Telegram или WhatsApp), предпочитайте вывод PDF (`fileFormat: "pdf"`).

<Note>
Движок рендеринга diff работает на [Diffs](https://diffs.com).
</Note>

## Связанные материалы

- [Браузер](/ru/tools/browser)
- [Плагины](/ru/tools/plugin)
- [Обзор инструментов](/ru/tools)
