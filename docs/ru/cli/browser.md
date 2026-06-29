---
read_when:
    - Вы используете `openclaw browser` и хотите получить примеры распространенных задач
    - Вы хотите управлять браузером, запущенным на другом компьютере, через хост Node
    - Вы хотите подключиться к локальному Chrome, где выполнен вход, через Chrome MCP
summary: Справочник CLI для `openclaw browser` (жизненный цикл, профили, вкладки, действия, состояние и отладка)
title: Браузер
x-i18n:
    generated_at: "2026-06-28T22:42:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Управляйте поверхностью управления браузером OpenClaw и запускайте браузерные действия (жизненный цикл, профили, вкладки, снимки, скриншоты, навигация, ввод, эмуляция состояния и отладка).

Связано:

- Инструмент браузера + API: [Инструмент браузера](/ru/tools/browser)

## Общие флаги

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (по умолчанию из конфигурации).
- `--token <token>`: токен Gateway (если требуется).
- `--timeout <ms>`: тайм-аут запроса (мс).
- `--expect-final`: ожидать финальный ответ Gateway.
- `--browser-profile <name>`: выбрать профиль браузера (по умолчанию из конфигурации).
- `--json`: машиночитаемый вывод (где поддерживается).

## Быстрый старт (локально)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Агенты могут запустить такую же проверку готовности с помощью `browser({ action: "doctor" })`.

## Быстрое устранение неполадок

Если `start` завершается ошибкой `not reachable after start`, сначала проверьте готовность CDP. Если `start` и `tabs` выполняются успешно, но `open` или `navigate` завершается ошибкой, плоскость управления браузером исправна, а сбой обычно связан с политикой SSRF для навигации.

Минимальная последовательность:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Подробные инструкции: [Устранение неполадок браузера](/ru/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Жизненный цикл

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Примечания:

- `doctor --deep` добавляет живую пробу снимка. Это полезно, когда базовая
  готовность CDP в порядке, но нужно доказательство, что текущую вкладку можно проверить.
- Для `attachOnly` и удаленных профилей CDP `openclaw browser stop` закрывает
  активный сеанс управления и очищает временные переопределения эмуляции, даже если
  OpenClaw не запускал процесс браузера самостоятельно.
- Для локальных управляемых профилей `openclaw browser stop` останавливает созданный процесс браузера.
- `openclaw browser start --headless` применяется только к этому запросу запуска и
  только когда OpenClaw запускает локальный управляемый браузер. Он не переписывает
  `browser.headless` или конфигурацию профиля и ничего не делает для уже запущенного
  браузера.
- На хостах Linux без `DISPLAY` или `WAYLAND_DISPLAY` локальные управляемые профили
  автоматически запускаются в headless-режиме, если только `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` или `browser.profiles.<name>.headless=false`
  явно не запрашивает видимый браузер.

## Если команда отсутствует

Если `openclaw browser` является неизвестной командой, проверьте `plugins.allow` в
`~/.openclaw/openclaw.json`.

Когда `plugins.allow` присутствует, явно укажите встроенный Plugin браузера,
если в конфигурации уже нет корневого блока `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явный корневой блок `browser`, например `browser.enabled=true` или
`browser.profiles.<name>`, также активирует встроенный Plugin браузера при
ограничительном списке разрешенных Plugins.

Связано: [Инструмент браузера](/ru/tools/browser#missing-browser-command-or-tool)

## Профили

Профили — это именованные конфигурации маршрутизации браузера. На практике:

- `openclaw`: запускает выделенный экземпляр Chrome, управляемый OpenClaw, или подключается к нему (изолированный каталог пользовательских данных).
- `user`: управляет существующим сеансом Chrome с выполненным входом через Chrome DevTools MCP.
- пользовательские профили CDP: указывают на локальную или удаленную конечную точку CDP.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Использовать конкретный профиль:

```bash
openclaw browser --browser-profile work tabs
```

## Вкладки

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` сначала возвращает `suggestedTargetId`, затем стабильный `tabId`, например `t1`,
необязательную метку и необработанный `targetId`. Агенты должны передавать
`suggestedTargetId` обратно в `focus`, `close`, снимки и действия. Метку можно
назначить с помощью `open --label`, `tab new --label` или `tab label`; принимаются
метки, идентификаторы вкладок, необработанные идентификаторы целей и уникальные
префиксы идентификаторов целей.
Поле запроса по-прежнему называется `targetId` для совместимости, но оно принимает
эти ссылки на вкладки. Рассматривайте необработанные идентификаторы целей как
диагностические дескрипторы, а не как долговременную память агента.
Когда Chromium заменяет базовую необработанную цель во время навигации или отправки формы,
OpenClaw сохраняет стабильный `tabId`/метку за заменяющей вкладкой,
если может доказать соответствие. Необработанные идентификаторы целей остаются изменчивыми; предпочитайте
`suggestedTargetId`.

## Снимок / скриншот / действия

Снимок:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Скриншот:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Примечания:

- `--full-page` предназначен только для снимков страниц; его нельзя сочетать с `--ref`
  или `--element`.
- Профили `existing-session` / `user` поддерживают скриншоты страниц и скриншоты `--ref`
  из вывода снимка, но не CSS-скриншоты `--element`.
- `--labels` накладывает текущие ссылки снимка на скриншот. В профилях на базе
  Playwright это работает с `--full-page` (наложение меток на всю страницу),
  `--ref` (наложение меток на вырезанный элемент по ARIA-ссылке) и `--element`
  (наложение меток на вырезанный элемент по CSS-селектору); в режимах вырезания элемента метки
  проецируются относительно элемента. Ответ также включает массив
  `annotations` с рамкой каждого ref. Каждый элемент содержит `ref`,
  `number`, `role`, необязательное `name` и `box: {x, y, width, height}`;
  координаты указаны в пространстве захваченного изображения (viewport / fullpage /
  относительно элемента). Поле опускается, когда оно пустое.
  Профили `existing-session` отображают наложение chrome-mcp на скриншотах страниц,
  но не используют вспомогательный механизм проекции Playwright и не включают
  `annotations`; CSS-скриншоты `--element` там не поддерживаются. Без
  Playwright или chrome-mcp скриншоты с метками недоступны. Предыдущие
  выпуски игнорировали `--full-page`, `--ref` и `--element` на скриншотах Playwright
  с метками и всегда возвращали захват viewport; теперь скриншоты с метками
  учитывают эти области.
- `snapshot --urls` добавляет найденные назначения ссылок к AI-снимкам, чтобы
  агенты могли выбирать прямые цели навигации, а не угадывать только по тексту ссылок.

Навигация/щелчок/ввод (автоматизация UI на основе ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` принимает исходный код функции, выражение или тело оператора.
Тела операторов оборачиваются как асинхронные функции, поэтому используйте `return` для значения,
которое хотите получить обратно. Используйте `evaluate --timeout-ms <ms>`, когда функция на стороне страницы может
требовать больше времени, чем стандартный тайм-аут evaluate.

Ответы действий возвращают текущий необработанный `targetId` после замены страницы,
вызванной действием, когда OpenClaw может доказать заменяющую вкладку. Скрипты все равно должны
сохранять и передавать `suggestedTargetId`/метки для долговременных рабочих процессов.

Помощники файлов и диалогов:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Управляемые профили Chrome сохраняют обычные загрузки, запущенные щелчком, в каталог загрузок OpenClaw
(`/tmp/openclaw/downloads` по умолчанию или настроенный временный корень).
Используйте `waitfordownload` или `download`, когда агенту нужно дождаться
конкретного файла и вернуть его путь; эти явные ожидатели владеют следующей загрузкой.
Загрузки файлов принимают файлы из временного корня загрузок OpenClaw и управляемые OpenClaw
входящие медиа, включая ссылки `media://inbound/<id>` и относительные к sandbox
`media/inbound/<id>`. Вложенные ссылки media, обход путей и произвольные
локальные пути по-прежнему отклоняются.
Когда действие открывает модальный диалог, ответ действия возвращает
`blockedByDialog` с `browserState.dialogs.pending`; передайте `--dialog-id`, чтобы
ответить на него напрямую. Диалоги, обработанные вне OpenClaw, появляются в
`browserState.dialogs.recent`.

## Состояние и хранилище

Viewport + эмуляция:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookie + хранилище:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Отладка

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Существующий Chrome через MCP

Используйте встроенный профиль `user` или создайте собственный профиль `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Путь existing-session по умолчанию — автоматическое подключение Chrome MCP только на хосте. Если браузер уже
запущен с конечной точкой DevTools, передайте `--cdp-url`, чтобы Chrome MCP подключился к этой конечной точке вместо этого.
Для Docker, Browserless или других удаленных настроек, где семантика Chrome MCP не нужна, используйте
профиль CDP.

Текущие ограничения existing-session:

- действия на основе снимков используют refs, а не CSS-селекторы
- `browser.actionTimeoutMs` задает по умолчанию для поддерживаемых запросов `act` значение 60000 мс, когда
  вызывающие стороны не указывают `timeoutMs`; `timeoutMs` для отдельного вызова по-прежнему имеет приоритет.
- `click` выполняет только щелчок левой кнопкой
- `type` не поддерживает `slowly=true`
- `press` не поддерживает `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` и `evaluate` отклоняют
  переопределения тайм-аута для отдельного вызова
- `select` поддерживает только одно значение
- `wait --load networkidle` не поддерживается для профилей существующих сеансов (работает с управляемыми и raw/remote CDP)
- загрузка файлов требует `--ref` / `--input-ref`, не поддерживает CSS
  `--element` и сейчас поддерживает только один файл за раз
- хуки диалогов не поддерживают `--timeout`
- снимки экрана поддерживают захват страницы и `--ref`, но не CSS `--element`
- `responsebody`, перехват загрузок, экспорт PDF и пакетные действия по-прежнему
  требуют управляемый браузер или профиль raw CDP

## Удаленное управление браузером (прокси хоста узла)

Если Gateway работает на другой машине, чем браузер, запустите **хост узла** на машине с Chrome/Brave/Edge/Chromium. Gateway будет проксировать действия браузера на этот узел (отдельный сервер управления браузером не требуется).

Используйте `gateway.nodes.browser.mode`, чтобы управлять автоматической маршрутизацией, и `gateway.nodes.browser.node`, чтобы закрепить конкретный узел, если подключено несколько.

Безопасность + удаленная настройка: [Инструмент браузера](/ru/tools/browser), [Удаленный доступ](/ru/gateway/remote), [Tailscale](/ru/gateway/tailscale), [Безопасность](/ru/gateway/security)

## См. также

- [Справочник CLI](/ru/cli)
- [Браузер](/ru/tools/browser)
