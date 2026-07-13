---
read_when:
    - Вы используете `openclaw browser` и хотите увидеть примеры распространённых задач
    - Вы хотите управлять браузером, запущенным на другом компьютере, через хост Node
    - Вы хотите подключиться к локальному Chrome, в котором выполнен вход, через Chrome MCP
summary: Справочник CLI для `openclaw browser` (жизненный цикл, профили, вкладки, действия, состояние и отладка)
title: Браузер
x-i18n:
    generated_at: "2026-07-13T19:36:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Управляйте интерфейсом управления браузером OpenClaw и выполняйте действия в браузере: управляйте жизненным циклом, профилями, вкладками, снимками, скриншотами, навигацией, вводом, эмуляцией состояния и отладкой.

См. также: [Инструмент браузера](/ru/tools/browser)

## Общие флаги

- `--url <gatewayWsUrl>`: URL WebSocket для Gateway (по умолчанию берётся из конфигурации).
- `--token <token>`: токен Gateway (если требуется).
- `--timeout <ms>`: время ожидания запроса в мс (по умолчанию: `30000`).
- `--expect-final`: ожидать окончательного ответа Gateway.
- `--browser-profile <name>`: выбрать профиль браузера (по умолчанию: `openclaw` или `browser.defaultProfile`).
- `--json`: машиночитаемый вывод (где поддерживается). Это параметр уровня браузера, поэтому
  для однозначной формы указывайте его перед подкомандой, например
  `openclaw browser --json status`. Размещение в конце, например
  `openclaw browser status --json`, также работает, если выбранная дочерняя команда не
  определяет собственный `--json`.

## Быстрый запуск (локально)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Агенты могут выполнить ту же проверку готовности с помощью `browser({ action: "doctor" })`.

## Быстрое устранение неполадок

Если `start` завершается ошибкой `not reachable after start`, сначала устраните проблемы с готовностью CDP. Если `start` и `tabs` выполняются успешно, а `open` или `navigate` завершается ошибкой, уровень управления браузером исправен, а причиной сбоя обычно является блокировка навигации политикой SSRF.

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

- `doctor --deep` добавляет оперативную проверку снимка: она полезна, когда базовая готовность CDP подтверждена, но требуется убедиться, что текущую вкладку можно проверить.
- Для запущенного локального управляемого профиля `status` и `doctor` выводят кэшированную
  графическую диагностику Chrome: классификацию аппаратного и программного обеспечения, средство визуализации,
  бэкенд, устройство и драйвер, сведения о функциях и причинах их отключения, а также возможности
  аппаратного ускорения видео. `openclaw browser --json status` возвращает полные структурированные данные.
  Пассивная проверка состояния никогда не запускает Chrome только для сбора этих сведений.
- `stop` закрывает активный сеанс управления и сбрасывает временные переопределения эмуляции даже для `attachOnly` и удалённых профилей CDP, в которых OpenClaw не запускал процесс браузера самостоятельно. Для локальных управляемых профилей `stop` также останавливает запущенный процесс браузера.
- `start --headless` применяется только к данному запросу запуска и только когда OpenClaw запускает локальный управляемый браузер. Он не изменяет `browser.headless` или конфигурацию профиля и ничего не делает, если браузер уже запущен.
- На хостах Linux без `DISPLAY` или `WAYLAND_DISPLAY` локальные управляемые профили автоматически работают в безголовом режиме, если `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` или `browser.profiles.<name>.headless=false` явно не запрашивает браузер с видимым интерфейсом.

## Если команда отсутствует

Если `openclaw browser` является неизвестной командой, проверьте `plugins.allow` в `~/.openclaw/openclaw.json`. Если присутствует `plugins.allow`, явно добавьте встроенный плагин браузера в список, если в конфигурации ещё нет корневого блока `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явный корневой блок `browser` (например, `browser.enabled=true` или `browser.profiles.<name>`) также активирует встроенный плагин браузера при ограничивающем списке разрешённых плагинов.

См. также: [Инструмент браузера](/ru/tools/browser#missing-browser-command-or-tool)

## Профили

Профили — это именованные конфигурации маршрутизации браузера:

- `openclaw` (по умолчанию): запускает выделенный экземпляр Chrome под управлением OpenClaw или подключается к нему (с изолированным каталогом пользовательских данных).
- `user`: управляет существующим сеансом Chrome с выполненным входом через Chrome DevTools MCP.
- пользовательские профили CDP: указывают на локальную или удалённую конечную точку CDP.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Чтобы использовать определённый профиль с любой подкомандой, укажите `--browser-profile <name>`, например `openclaw browser --browser-profile work tabs`.

В macOS команда `system-profiles` выводит реальные профили Chrome, Brave, Edge или Chromium, доступные на хосте. Команда `import-profile` расшифровывает их файлы cookie после однократного запроса согласия через macOS Keychain/Touch ID и внедряет их в новый профиль под управлением OpenClaw. Импортируются только файлы cookie; локальное хранилище и IndexedDB не изменяются. Некоторые сеансы Google используют привязанные к устройству учётные данные сеанса (DBSC), поэтому после импорта может всё равно потребоваться повторная аутентификация.

Когда приложение macOS использует локальный Gateway, оно может однократно предложить этот импорт и сделать изолированный импортированный профиль профилем по умолчанию для работы агентов в браузере. Для импорта всегда требуется явный щелчок; успешный импорт или отклонение предложения предотвращает последующие автоматические запросы, а **Settings → General → Browser login** остаётся доступным для повторного импорта.

Импорт системных профилей включён по умолчанию. Установите `browser.allowSystemProfileImport=false`, чтобы отключить импорт как через CLI, так и по запросу агента. Импорт выполняется локально на хосте и не может осуществляться через прокси Node браузера.

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

`tabs` сначала возвращает `suggestedTargetId`, затем стабильный `tabId` (например, `t1`), необязательную метку и необработанный `targetId`. Передавайте `suggestedTargetId` обратно в `focus`, `close`, команды создания снимков и действия. Назначьте метку с помощью `open --label`, `tab new --label` или `tab label`; принимаются метки, идентификаторы вкладок, необработанные идентификаторы целей и уникальные префиксы идентификаторов целей. Для совместимости поле запроса по-прежнему называется `targetId`, но принимает любую из этих ссылок на вкладку.

Необработанные идентификаторы целей — это нестабильные диагностические дескрипторы, а не долговременная память агента: когда Chromium заменяет базовую необработанную цель во время навигации или отправки формы, OpenClaw сохраняет привязку стабильного `tabId`/метки к заменившей её вкладке, если может достоверно установить соответствие. Предпочтительно использовать `suggestedTargetId`.

## Снимки / скриншоты / действия

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

- `--full-page` предназначен только для снимков страницы; его нельзя сочетать с `--ref` или `--element`.
- Профили `existing-session` / `user` поддерживают скриншоты страницы и скриншоты `--ref` из результатов снимка, но не скриншоты CSS `--element`.
- `--labels` накладывает текущие ссылки из снимка на скриншот. В профилях на основе Playwright он работает с `--full-page` (наложение на всю страницу), `--ref` (наложение на фрагмент элемента по ссылке ARIA) и `--element` (наложение на фрагмент элемента по селектору CSS); в режимах фрагмента элемента метки проецируются относительно элемента. Ответ также содержит массив `annotations` (не включается, если пуст) с ограничивающей рамкой каждой ссылки: `ref`, `number`, `role`, необязательное поле `name` и `box: {x, y, width, height}` в системе координат полученного изображения (область просмотра / вся страница / относительно элемента).
  Профили `existing-session` визуализируют наложение chrome-mcp на скриншотах страницы, но не используют вспомогательную проекцию Playwright и не включают `annotations`; скриншоты CSS `--element` в них не поддерживаются. Без Playwright или chrome-mcp скриншоты с метками недоступны.
- `snapshot --urls` добавляет обнаруженные целевые адреса ссылок в снимки для ИИ, чтобы агенты могли выбирать прямые цели навигации, а не угадывать их только по тексту ссылок.

Навигация, щелчки и ввод (автоматизация интерфейса на основе ссылок):

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

`evaluate --fn` принимает исходный код функции, выражение или тело инструкции. Тела инструкций оборачиваются в асинхронные функции, поэтому используйте `return` для значения, которое требуется получить. Используйте `--timeout-ms`, если функции на стороне страницы может потребоваться больше времени, чем предусмотрено стандартным временем ожидания вычисления. `browser.evaluateEnabled=false` (по умолчанию: `true`) отключает как `evaluate`, так и `wait --fn`.

Ответы на действия возвращают текущий необработанный `targetId` после вызванной действием замены страницы, если OpenClaw может достоверно определить заменившую вкладку. Для долговременных рабочих процессов скриптам всё равно следует сохранять и передавать `suggestedTargetId`/метки.

Вспомогательные средства для файлов и диалоговых окон:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Управляемые профили Chrome сохраняют обычные загрузки, инициированные щелчком, в каталог загрузок OpenClaw (по умолчанию `/tmp/openclaw/downloads` или настроенный корневой временный каталог). Используйте `waitfordownload` или `download`, когда агенту необходимо дождаться определённого файла и вернуть путь к нему; эти явные средства ожидания перехватывают следующую загрузку. Для отправки принимаются файлы из корневого временного каталога отправок OpenClaw и входящие медиафайлы под управлением OpenClaw, включая ссылки `media://inbound/<id>` и `media/inbound/<id>`, относительные к песочнице. Вложенные ссылки на медиафайлы, обход каталогов и произвольные локальные пути отклоняются.

Когда действие открывает модальное диалоговое окно, ответ на действие возвращает `blockedByDialog` с `browserState.dialogs.pending`; передайте `--dialog-id`, чтобы ответить на него напрямую. Диалоговые окна, обработанные вне OpenClaw, отображаются в `browserState.dialogs.recent`.

## Состояние и хранилище

Область просмотра и эмуляция:

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

Файлы cookie + хранилище:

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

По умолчанию existing-session использует автоматическое подключение Chrome MCP только на хосте. Если браузер уже запущен с конечной точкой DevTools, передайте `--cdp-url`, чтобы Chrome MCP подключился к этой конечной точке. Для Docker, Browserless и других удалённых конфигураций, где семантика Chrome MCP не требуется, используйте вместо этого профиль CDP.

Текущие ограничения existing-session:

- Действия на основе снимков используют ссылки, а не селекторы CSS.
- `browser.actionTimeoutMs` по умолчанию задаёт для поддерживаемых запросов `act` значение 60000 мс, если вызывающая сторона не указала `timeoutMs`; значение `timeoutMs` для отдельного вызова по-прежнему имеет приоритет.
- `click` поддерживает только щелчок левой кнопкой мыши.
- `type` не поддерживает `slowly=true`.
- `press` не поддерживает `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` и `fill` отклоняют переопределения времени ожидания для отдельных вызовов; `evaluate` принимает `--timeout-ms`.
- `select` поддерживает только одно значение.
- `wait --load networkidle` не поддерживается (работает с управляемыми и необработанными/удалёнными профилями CDP).
- Для загрузки файлов требуются `--ref` / `--input-ref`; селекторы CSS `--element` не поддерживаются, и за один раз можно загрузить только один файл.
- Обработчики диалоговых окон не поддерживают `--timeout`.
- Снимки экрана поддерживают захват страниц и `--ref`, но не селекторы CSS `--element`.
- `responsebody`, перехват загрузок, экспорт PDF и пакетные действия по-прежнему требуют управляемого браузера или необработанного профиля CDP.

## Удалённое управление браузером (прокси хоста Node)

Если Gateway работает на машине, отличной от той, где запущен браузер, запустите **хост Node** на машине с Chrome/Brave/Edge/Chromium. Gateway проксирует действия браузера на этот узел; отдельный сервер управления браузером не требуется.

Используйте `gateway.nodes.browser.mode` для управления автоматической маршрутизацией и `gateway.nodes.browser.node`, чтобы закрепить конкретный узел, если подключено несколько узлов.

Безопасность и удалённая настройка: [Инструмент браузера](/ru/tools/browser), [Удалённый доступ](/ru/gateway/remote), [Tailscale](/ru/gateway/tailscale), [Безопасность](/ru/gateway/security)

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Браузер](/ru/tools/browser)
