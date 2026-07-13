---
read_when:
    - Создание скриптов или отладка браузера агента через локальный API управления
    - Ищете справочник по CLI `openclaw browser`?
    - Добавление пользовательской автоматизации браузера со снимками и ссылками-идентификаторами
summary: API управления браузером OpenClaw, справочник CLI и действия для сценариев
title: API управления браузером
x-i18n:
    generated_at: "2026-07-13T18:41:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Для установки, настройки и устранения неполадок см. [Браузер](/ru/tools/browser).
На этой странице приведена справочная информация по локальному управляющему HTTP API, `openclaw browser`
CLI и шаблонам автоматизации (снимки, ссылки, ожидания, процессы отладки).

## Управляющий API (необязательно)

Только для локальных интеграций Gateway предоставляет небольшой HTTP API, доступный через интерфейс обратной петли.
Этот автономный сервер включается явно — задайте переменную среды
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` в среде службы Gateway
и перезапустите Gateway, после чего HTTP-конечные точки станут доступны. Без
этой переменной среда управления браузером продолжает работать через CLI и
инструменты агента, но управляющий порт обратной петли не прослушивается.

- Состояние/запуск/остановка: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Профили: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Снимок/снимок экрана: `GET /snapshot`, `POST /screenshot`
- Действия: `POST /navigate`, `POST /act`
- Перехватчики: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Загрузки: `POST /download`, `POST /wait/download`
- Разрешения: `POST /permissions/grant`
- Отладка: `GET /console`, `POST /pdf`
- Отладка: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Сеть: `POST /response/body`
- Состояние: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Состояние: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Настройки: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` — пакетная форма, которую CLI использует внутри для
подкоманд `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
при написании прямых сценариев предпочитайте специализированные маршруты вкладок, указанные выше.

Все конечные точки принимают `?profile=<name>`. `POST /start?headless=true` запрашивает
одноразовый запуск в безоконном режиме для локальных управляемых профилей без изменения сохранённой
конфигурации браузера; профили только для подключения, удалённого CDP и существующего сеанса отклоняют
это переопределение, поскольку OpenClaw не запускает соответствующие браузерные процессы.

Для конечных точек вкладок `targetId` — имя поля для совместимости. Предпочтительно передавать
`suggestedTargetId` из `GET /tabs` или `POST /tabs/open`; также принимаются метки и дескрипторы `tabId`,
например `t1`. Необработанные идентификаторы целей CDP и уникальные префиксы необработанных
идентификаторов целей по-прежнему работают, но являются непостоянными диагностическими дескрипторами.

Если настроена аутентификация Gateway с общим секретом, HTTP-маршруты браузера также требуют аутентификации:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` или аутентификация HTTP Basic с этим паролем

Примечания:

- Этот автономный браузерный API обратной петли **не** использует заголовки идентификации доверенного прокси или
  Tailscale Serve.
- Если `gateway.auth.mode` имеет значение `none` или `trusted-proxy`, эти браузерные
  маршруты обратной петли не наследуют соответствующие режимы передачи идентификационных данных; оставляйте их доступными только через интерфейс обратной петли.

### Контракт ошибок `/act`

`POST /act` использует структурированный ответ об ошибке для ошибок проверки на уровне маршрута и
нарушений политик:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Текущие значения `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` отсутствует или не распознано.
- `ACT_INVALID_REQUEST` (HTTP 400): полезная нагрузка действия не прошла нормализацию или проверку.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` использовалось с неподдерживаемым типом действия.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (или `wait --fn`) отключено в конфигурации.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` верхнего уровня или в пакете конфликтует с целью запроса.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): действие не поддерживается для профилей существующего сеанса.

Другие ошибки среды выполнения по-прежнему могут возвращать `{ "error": "<message>" }` без
поля `code`.

### Требование Playwright

Для некоторых функций (переход/действие/ИИ-снимок/ролевой снимок, снимки экрана элементов,
PDF) требуется Playwright. Если Playwright не установлен, эти конечные точки возвращают
понятную ошибку 501.

Что продолжает работать без Playwright:

- Снимки ARIA
- Снимки доступности в ролевом стиле (`--interactive`, `--compact`,
  `--depth`, `--efficient`), когда доступен WebSocket CDP для отдельной вкладки. Это
  резервный вариант для проверки и поиска ссылок; Playwright остаётся основным
  механизмом выполнения действий.
- Снимки экрана страницы для управляемого браузера `openclaw`, когда доступен WebSocket CDP
  для отдельной вкладки
- Снимки экрана страницы для профилей `existing-session` / Chrome MCP
- Снимки экрана по ссылкам `existing-session` (`--ref`) из вывода снимка

Для чего по-прежнему требуется Playwright:

- `navigate`
- `act`
- ИИ-снимки, использующие собственный формат ИИ-снимков Playwright
- Снимки экрана элементов по CSS-селектору (`--element`)
- полный экспорт браузерной страницы в PDF

Снимки экрана элементов также не принимают `--full-page`; маршрут возвращает `fullPage is
not supported for element screenshots`.

Если отображается `Playwright is not available in this gateway build`, в поставляемом
Gateway отсутствует основная зависимость среды выполнения браузера. Переустановите или обновите
OpenClaw, затем перезапустите Gateway. Для Docker также установите двоичные файлы браузера
Chromium, как показано ниже.

#### Установка Playwright в Docker

Если Gateway работает в Docker, избегайте `npx playwright` (конфликты переопределений npm).
Для пользовательских образов добавьте Chromium в образ при сборке:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Для существующего образа выполните установку через поставляемый CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Чтобы сохранять загруженные файлы браузера, задайте `PLAYWRIGHT_BROWSERS_PATH` (например,
`/home/node/.cache/ms-playwright`) и убедитесь, что `/home/node` сохраняется через
`OPENCLAW_HOME_VOLUME` или подключение каталога хоста. OpenClaw автоматически обнаруживает сохранённый
Chromium в Linux. См. [Docker](/ru/install/docker).

## Принцип работы (внутреннее устройство)

Небольшой управляющий сервер обратной петли принимает HTTP-запросы и подключается к браузерам на основе Chromium через CDP. Расширенные действия (щелчок/ввод/снимок/PDF) выполняются через Playwright поверх CDP; если Playwright отсутствует, доступны только операции, не зависящие от Playwright. Агент видит единый стабильный интерфейс, а локальные и удалённые браузеры и профили могут свободно заменяться на нижележащем уровне.

## Краткий справочник по CLI

Все команды принимают `--browser-profile <name>` для выбора определённого профиля и `--json` для машиночитаемого вывода.

<AccordionGroup>

<Accordion title="Основы: состояние, вкладки, открытие/фокусировка/закрытие">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # добавить активную проверку снимка
openclaw browser start
openclaw browser start --headless # одноразовый запуск локального управляемого браузера без окна
openclaw browser stop            # также сбрасывает эмуляцию для подключения без запуска/удалённого CDP
openclaw browser reset-profile   # перемещает данные браузера профиля в корзину
openclaw browser tabs
openclaw browser tab             # сокращение для текущей вкладки
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Профили: просмотр, создание, удаление">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Проверка: снимок экрана, снимок, консоль, ошибки, запросы">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # или --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Действия: переход, щелчок, ввод, перетаскивание, ожидание, вычисление">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # или e12 для ролевых ссылок
openclaw browser click-coords 120 340        # координаты области просмотра
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Состояние: файлы cookie, хранилище, автономный режим, заголовки, геопозиция, устройство">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear для удаления
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Примечания:

- Доступный агенту инструмент `browser` предоставляет `action=download` (обязательные `ref` и
  `path`) и `action=waitfordownload` (необязательный `path`). Оба возвращают сохранённый
  URL загрузки, предлагаемое имя файла и защищённый локальный путь. Явный перехват
  загрузок доступен для управляемых профилей Playwright; профили существующих сеансов
  возвращают ошибку неподдерживаемой операции.
- Предпочитайте атомарную загрузку через диалог выбора: передавайте триггер `--ref` вместе с загрузкой, чтобы OpenClaw подготовил и выполнил нажатие в одном запросе. Вариант `upload` только с путями по-прежнему поддерживается, когда последующий триггер предусмотрен намеренно. Используйте `--input-ref` или `--element`, чтобы задать значение поля выбора файла напрямую. `dialog` — это вызов подготовки; выполните его перед нажатием кнопкой мыши или клавиши, которое открывает диалог. Если действие открывает модальное окно, ответ действия содержит `blockedByDialog` и `browserState.dialogs.pending`; передайте этот `dialogId`, чтобы ответить напрямую. Диалоги, обработанные вне OpenClaw, отображаются в `browserState.dialogs.recent`.
- `click`/`type`/и т. д. требуют `ref` из `snapshot` (числовой `12`, ссылка роли `e12` или интерактивная ссылка ARIA `ax12`). CSS-селекторы намеренно не поддерживаются для действий. Используйте `click-coords`, когда единственной надёжной целью является позиция в видимой области просмотра.
- Пути загрузок и трассировок ограничены временными корневыми каталогами OpenClaw: `/tmp/openclaw{,/downloads}` (резервный вариант: `${os.tmpdir()}/openclaw/...`).
- `upload` принимает файлы из временного корневого каталога загрузок OpenClaw и
  управляемых OpenClaw входящих медиафайлов. На управляемые входящие медиафайлы можно ссылаться как
  `media://inbound/<id>`, через относительный для песочницы путь `media/inbound/<id>` или разрешённый
  путь внутри каталога управляемых входящих медиафайлов. Вложенные ссылки на медиафайлы,
  обход каталогов, символические ссылки, жёсткие ссылки и произвольные локальные пути по-прежнему отклоняются.
- `upload` также может напрямую задавать значения полей выбора файла через `--input-ref` или `--element`.

Стабильные идентификаторы и метки вкладок сохраняются при замене исходной цели Chromium, когда OpenClaw
может достоверно определить заменяющую вкладку, например при наличии уникальной пары старой и новой вкладки для одного URL или
когда после отправки формы одна старая вкладка заменяется одной новой. При неоднозначной
замене нескольких вкладок с одинаковым URL назначаются новые дескрипторы. Исходные идентификаторы целей по-прежнему
непостоянны; в скриптах предпочитайте `suggestedTargetId` из `tabs`.

Краткий обзор флагов снимков:

- `--format ai` (по умолчанию с Playwright): снимок для ИИ с числовыми ссылками (`aria-ref="<n>"`).
- `--format aria`: дерево доступности со ссылками `axN`. Когда Playwright доступен, OpenClaw связывает ссылки с идентификаторами DOM серверной части на активной странице, чтобы их можно было использовать для последующих действий; в противном случае считайте вывод предназначенным только для просмотра.
- `--efficient` (или `--mode efficient`): компактный предустановленный снимок ролей. Задайте `browser.snapshotDefaults.mode: "efficient"`, чтобы сделать его вариантом по умолчанию (см. [конфигурацию Gateway](/ru/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` принудительно создают снимок ролей со ссылками `ref=e12`. `--frame "<iframe>"` ограничивает снимки ролей фреймом iframe.
- При использовании Playwright параметр `--labels` добавляет снимок экрана с наложенными метками ссылок
  (выводит `MEDIA:<path>`), а также массив `annotations` с ограничивающей
  рамкой каждой ссылки. При `screenshot` метки на основе Playwright работают с `--full-page`,
  `--ref` и `--element`; при `snapshot` сопутствующий снимок экрана по-прежнему
  ограничен областью просмотра. Профили существующих сеансов и chrome-mcp отображают наложенные метки на
  снимках страницы, но не возвращают `annotations` и не используют вспомогательную функцию Playwright
  для проекции всей страницы, ссылок и элементов. Без Playwright или chrome-mcp
  снимки экрана с метками недоступны.
- `--urls` добавляет обнаруженные адреса ссылок к снимкам для ИИ.

## Снимки и ссылки

OpenClaw поддерживает два стиля «снимков»:

- **Снимок для ИИ (числовые ссылки)**: `openclaw browser snapshot` (по умолчанию; `--format ai`)
  - Вывод: текстовый снимок с числовыми ссылками.
  - Действия: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутри ссылка разрешается через `aria-ref` Playwright.

- **Снимок ролей (ссылки ролей вида `e12`)**: `openclaw browser snapshot --interactive` (или `--compact`, `--depth`, `--selector`, `--frame`)
  - Вывод: список или дерево на основе ролей с `[ref=e12]` (и необязательным `[nth=1]`).
  - Действия: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутри ссылка разрешается через `getByRole(...)` (а для дубликатов также через `nth()`).
  - Добавьте `--labels`, чтобы включить снимок экрана с наложенными метками `e12`. В
    профилях на основе Playwright при этом также возвращаются метаданные ограничивающей рамки для каждой ссылки
    (`annotations[]`).
  - Добавьте `--urls`, когда текст ссылки неоднозначен и агенту нужны конкретные
    цели перехода.

- **Снимок ARIA (ссылки ARIA вида `ax12`)**: `openclaw browser snapshot --format aria`
  - Вывод: дерево доступности в виде структурированных узлов.
  - Действия: `openclaw browser click ax12` работает, когда путь создания снимка может связать
    ссылку через Playwright и идентификаторы DOM серверной части Chrome.
- Если Playwright недоступен, снимки ARIA всё равно могут быть полезны для
  просмотра, но ссылки могут быть недоступны для действий. Создайте новый снимок с `--format ai`
  или `--interactive`, когда нужны ссылки для действий.
- Проверка в Docker для резервного пути через исходный CDP: `pnpm test:docker:browser-cdp-snapshot`
  запускает Chromium с CDP, выполняет `browser doctor --deep` и проверяет, что снимки
  ролей содержат URL ссылок, интерактивные элементы, определённые по курсору, и метаданные iframe.

Поведение ссылок:

- Ссылки **не сохраняются при переходах**; если что-либо завершается с ошибкой, повторно выполните `snapshot` и используйте новую ссылку.
- `/act` возвращает текущий исходный `targetId` после замены, вызванной действием,
  если заменяющую вкладку удаётся достоверно определить. Продолжайте использовать стабильные идентификаторы и метки вкладок для
  последующих команд.
- Если снимок ролей был создан с `--frame`, ссылки ролей ограничены этим iframe до создания следующего снимка ролей.
- Неизвестные или устаревшие ссылки `axN` немедленно завершаются с ошибкой вместо перехода к
  селектору `aria-ref` Playwright. В таком случае создайте новый снимок на той же вкладке.

## Расширенные возможности ожидания

Можно ожидать не только время или текст:

- Ожидание URL (поддерживаются шаблоны glob Playwright):
  - `openclaw browser wait --url "**/dash"`
- Ожидание состояния загрузки:
  - `openclaw browser wait --load networkidle`
  - Поддерживается в управляемых профилях `openclaw` и профилях исходного или удалённого CDP. Профили, использующие драйвер `existing-session` (включая профиль `user` по умолчанию), отклоняют `networkidle`; используйте в них ожидания `--url`, `--text`, селектора или `--fn`.
- Ожидание выполнения предиката JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Ожидание появления селектора:
  - `openclaw browser wait "#main"`

Их можно комбинировать:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Процессы отладки

Если действие завершается с ошибкой (например, «не виден», «нарушение строгого режима», «перекрыт»):

1. `openclaw browser snapshot --interactive`
2. Используйте `click <ref>` / `type <ref>` (в интерактивном режиме предпочитайте ссылки ролей)
3. Если ошибка сохраняется: используйте `openclaw browser highlight <ref>`, чтобы увидеть, на что нацелен Playwright
4. Если страница ведёт себя необычно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глубокой отладки запишите трассировку:
   - `openclaw browser trace start`
   - воспроизведите проблему
   - `openclaw browser trace stop` (выводит `TRACE:<path>`)

## Вывод JSON

`--json` предназначен для скриптов и структурированных инструментов.

Примеры:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Снимки ролей в JSON содержат `refs`, а также небольшой блок `stats` (строки/символы/ссылки/интерактивные элементы), чтобы инструменты могли оценивать размер и плотность полезной нагрузки.

## Параметры состояния и среды

Они полезны для сценариев «заставить сайт вести себя как X»:

- Файлы cookie: `cookies`, `cookies set`, `cookies clear`
- Хранилище: `storage local|session get|set|clear`
- Автономный режим: `set offline on|off`
- Заголовки: `set headers --headers-json '{"X-Debug":"1"}'` (или позиционная форма `set headers '{"X-Debug":"1"}'`)
- Базовая HTTP-аутентификация: `set credentials user pass` (или `--clear`)
- Геолокация: `set geo <lat> <lon> --origin "https://example.com"` (или `--clear`)
- Медиа: `set media dark|light|no-preference|none`
- Часовой пояс / локаль: `set timezone ...`, `set locale ...`
- Устройство / область просмотра:
  - `set device "iPhone 14"` (предустановки устройств Playwright)
  - `set viewport 1280 720`

## Безопасность и конфиденциальность

- Профиль браузера openclaw может содержать активные сеансы входа; считайте его конфиденциальным.
- `browser act kind=evaluate` / `openclaw browser evaluate` и `wait --fn`
  выполняют произвольный JavaScript в контексте страницы. Инъекция промпта может
  управлять этим выполнением. Отключите его с помощью `browser.evaluateEnabled=false`, если оно вам не требуется.
- `openclaw browser evaluate --fn` принимает исходный код функции, выражение или
  тело инструкции. Тела инструкций оборачиваются в асинхронные функции, поэтому используйте
  `return` для значения, которое требуется вернуть. Используйте `--timeout-ms <ms>`, если
  функции на стороне страницы может потребоваться больше времени, чем предусмотрено стандартным тайм-аутом вычисления.
- Сведения о входе и мерах против ботов (X/Twitter и т. д.) см. в разделе [Вход через браузер и публикация в X/Twitter](/ru/tools/browser-login).
- Не предоставляйте общий доступ к хосту Gateway/Node (только loopback или tailnet).
- Удалённые конечные точки CDP обладают широкими возможностями; используйте туннель и защищайте их.

Пример строгого режима (частные и внутренние адреса по умолчанию блокируются):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // необязательное точное разрешение
    },
  },
}
```

## Связанные материалы

- [Браузер](/ru/tools/browser) — обзор, конфигурация, профили, безопасность
- [Вход через браузер](/ru/tools/browser-login) — вход на сайты
- [Устранение неполадок браузера в Linux](/ru/tools/browser-linux-troubleshooting)
- [Устранение неполадок браузера в WSL2](/ru/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
