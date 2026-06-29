---
read_when:
    - Добавление автоматизации браузера, управляемой агентом
    - Отладка того, почему openclaw мешает вашему Chrome
    - Реализация настроек браузера и жизненного цикла в приложении macOS
summary: Интегрированная служба управления браузером + команды действий
title: Browser (управляемый OpenClaw)
x-i18n:
    generated_at: "2026-06-28T23:50:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw может запускать **выделенный профиль Chrome/Brave/Edge/Chromium**, которым управляет агент.
Он изолирован от вашего личного браузера и управляется через небольшой локальный
сервис управления внутри Gateway (только loopback).

Вид для начинающих:

- Думайте о нем как об **отдельном браузере только для агента**.
- Профиль `openclaw` **не** затрагивает ваш личный профиль браузера.
- Агент может **открывать вкладки, читать страницы, нажимать и вводить текст** в безопасном контуре.
- Встроенный профиль `user` подключается к вашему реальному сеансу Chrome с выполненным входом через Chrome MCP.

## Что вы получаете

- Отдельный профиль браузера с именем **openclaw** (по умолчанию с оранжевым акцентом).
- Детерминированное управление вкладками (список/открытие/фокус/закрытие).
- Действия агента (нажатие/ввод/перетаскивание/выбор), снимки состояния, скриншоты, PDF.
- Встроенный Skill `browser-automation`, который обучает агентов циклу восстановления
  по снимкам состояния, стабильным вкладкам, устаревшим ссылкам и ручным блокерам, когда включен
  браузерный Plugin.
- Необязательная поддержка нескольких профилей (`openclaw`, `work`, `remote`, ...).

Этот браузер **не** предназначен для ежедневного использования. Это безопасная, изолированная поверхность для
автоматизации и проверки агентом.

## Быстрый старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Если вы видите "Browser disabled", включите браузер в конфигурации (см. ниже) и перезапустите
Gateway.

Если `openclaw browser` полностью отсутствует или агент сообщает, что браузерный инструмент
недоступен, перейдите к разделу [Отсутствует команда или инструмент браузера](/ru/tools/browser#missing-browser-command-or-tool).

## Управление Plugin

Инструмент `browser` по умолчанию является встроенным Plugin. Отключите его, чтобы заменить другим Plugin, который регистрирует то же имя инструмента `browser`:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Для настроек по умолчанию нужны и `plugins.entries.browser.enabled`, **и** `browser.enabled=true`. Отключение только Plugin удаляет CLI `openclaw browser`, метод Gateway `browser.request`, инструмент агента и сервис управления как единое целое; ваша конфигурация `browser.*` остается нетронутой для замены.

Изменения конфигурации браузера требуют перезапуска Gateway, чтобы Plugin мог заново зарегистрировать свой сервис.

## Инструкции для агента

Примечание о профиле инструментов: `tools.profile: "coding"` включает `web_search` и
`web_fetch`, но не включает полный инструмент `browser`. Если агент или
порожденный субагент должен использовать автоматизацию браузера, добавьте браузер на этапе
профиля:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Для одного агента используйте `agents.list[].tools.alsoAllow: ["browser"]`.
Одного `tools.subagents.tools.allow: ["browser"]` недостаточно, потому что политика субагентов
применяется после фильтрации профиля.

Браузерный Plugin поставляется с двумя уровнями инструкций для агента:

- Описание инструмента `browser` содержит компактный постоянно действующий контракт: выбирайте
  правильный профиль, удерживайте ссылки на той же вкладке, используйте `tabId`/метки для
  нацеливания на вкладки и загружайте браузерный Skill для многошаговой работы.
- Встроенный Skill `browser-automation` содержит более длинный рабочий цикл:
  сначала проверять статус/вкладки, помечать вкладки задачи, делать снимок состояния перед действием, повторно делать снимок состояния
  после изменений UI, один раз восстанавливать устаревшие ссылки и сообщать о блокерах входа/2FA/captcha или
  камеры/микрофона как о ручном действии, а не гадать.

Skills, встроенные в Plugin, перечислены в доступных Skills агента, когда
Plugin включен. Полные инструкции Skill загружаются по требованию, поэтому обычные
ходы не оплачивают полную стоимость в токенах.

## Отсутствует команда или инструмент браузера

Если после обновления `openclaw browser` неизвестна, `browser.request` отсутствует или агент сообщает, что браузерный инструмент недоступен, обычная причина — список `plugins.allow`, в котором нет `browser`, и отсутствие корневого блока конфигурации `browser`. Добавьте его:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явный корневой блок `browser`, например `browser.enabled=true` или `browser.profiles.<name>`, активирует встроенный браузерный Plugin даже при ограничительном `plugins.allow`, что соответствует поведению конфигурации каналов. `plugins.entries.browser.enabled=true` и `tools.alsoAllow: ["browser"]` сами по себе не заменяют членство в списке разрешений. Полное удаление `plugins.allow` также восстанавливает поведение по умолчанию.

## Профили: `openclaw` и `user`

- `openclaw`: управляемый, изолированный браузер (расширение не требуется).
- `user`: встроенный профиль подключения Chrome MCP для вашего **реального сеанса Chrome с выполненным входом**.

Для вызовов браузерного инструмента агентом:

- По умолчанию: используйте изолированный браузер `openclaw`.
- Предпочитайте `profile="user"`, когда важны существующие сеансы с выполненным входом и пользователь
  находится за компьютером, чтобы нажать/одобрить любой запрос подключения.
- `profile` — это явное переопределение, когда нужен конкретный режим браузера.

Задайте `browser.defaultProfile: "openclaw"`, если хотите по умолчанию использовать управляемый режим.

## Конфигурация

Настройки браузера находятся в `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

### Визуальное распознавание скриншотов (поддержка текстовых моделей)

Когда основная модель является только текстовой (без поддержки зрения/мультимодальности), браузерные
скриншоты возвращают блоки изображений, которые модель не может читать. Браузерные скриншоты
переиспользуют существующую конфигурацию понимания изображений, поэтому модель изображений,
настроенная для понимания медиа, может описывать скриншоты как текст без каких-либо
специальных настроек модели для браузера.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Как это работает:**

1. Агент вызывает `browser screenshot` → изображение как обычно сохраняется на диск.
2. Браузерный инструмент спрашивает существующий runtime понимания изображений, может ли он
   описать скриншот с помощью настроенных медиа-моделей изображений, общих медиа-моделей,
   настроек по умолчанию для модели изображений или поставщика изображений с авторизацией.
3. Модель зрения возвращает текстовое описание, которое оборачивается через
   `wrapExternalContent` (защита от prompt injection) и возвращается агенту
   как текстовый блок вместо блока изображения.
4. Если понимание изображений недоступно, пропущено или завершается с ошибкой, браузер
   возвращается к исходному блоку изображения.

Используйте существующие поля `tools.media.image` / `tools.media.models` для резервных
моделей, тайм-аутов, лимитов байтов, профилей и настроек запросов к поставщику.

Если активная основная модель уже поддерживает зрение и явная модель
понимания изображений не настроена, OpenClaw сохраняет обычный результат изображения, чтобы
основная модель могла читать скриншот напрямую.

<AccordionGroup>

<Accordion title="Порты и доступность">

- Сервис управления привязывается к loopback на порту, производном от `gateway.port` (по умолчанию `18791` = gateway + 2). Переопределение `gateway.port` или `OPENCLAW_GATEWAY_PORT` сдвигает производные порты в том же семействе.
- Локальные профили `openclaw` автоматически назначают `cdpPort`/`cdpUrl`; задавайте их только для
  удаленных профилей CDP или подключения к endpoint существующего сеанса. `cdpUrl` по умолчанию указывает на
  управляемый локальный порт CDP, если не задан.
- `remoteCdpTimeoutMs` применяется к проверкам HTTP-доступности удаленного CDP и `attachOnly`,
  а также к HTTP-запросам открытия вкладок; `remoteCdpHandshakeTimeoutMs` применяется к
  их WebSocket-рукопожатиям CDP.
- `localLaunchTimeoutMs` — это бюджет времени для локально запущенного управляемого процесса Chrome,
  чтобы открыть свой HTTP endpoint CDP. `localCdpReadyTimeoutMs` — это
  последующий бюджет для готовности WebSocket CDP после обнаружения процесса.
  Увеличьте эти значения на Raspberry Pi, слабых VPS или старом оборудовании, где Chromium
  запускается медленно. Значения должны быть положительными целыми числами до `120000` мс; недопустимые
  значения конфигурации отклоняются.
- Повторяющиеся сбои запуска/готовности управляемого Chrome размыкаются предохранителем для каждого
  профиля. После нескольких последовательных сбоев OpenClaw ненадолго приостанавливает новые попытки
  запуска вместо того, чтобы порождать Chromium при каждом вызове браузерного инструмента. Исправьте
  проблему запуска, отключите браузер, если он не нужен, или перезапустите
  Gateway после исправления.
- `actionTimeoutMs` — это бюджет по умолчанию для браузерных запросов `act`, когда вызывающий код не передает `timeoutMs`. Клиентский транспорт добавляет небольшое окно запаса, чтобы долгие ожидания могли завершиться, а не прерывались тайм-аутом на границе HTTP.
- `tabCleanup` — это очистка наилучшим усилием для вкладок, открытых браузерными сеансами основного агента. Очистка жизненного цикла субагентов, cron и ACP по-прежнему закрывает их явно отслеживаемые вкладки в конце сеанса; основные сеансы сохраняют активные вкладки переиспользуемыми, а затем в фоне закрывают простаивающие или лишние отслеживаемые вкладки.

</Accordion>

<Accordion title="Политика SSRF">

- Навигация браузера и открытие вкладок защищаются от SSRF до навигации и по мере возможности повторно проверяются после нее на итоговом URL `http(s)`.
- В строгом режиме SSRF также проверяются обнаружение удаленной конечной точки CDP и пробы `/json/version` (`cdpUrl`).
- Переменные окружения Gateway/провайдера `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` и `NO_PROXY` не проксируют автоматически браузер, управляемый OpenClaw. Управляемый Chrome по умолчанию запускается напрямую, чтобы настройки прокси провайдера не ослабляли проверки SSRF браузера.
- Локальные пробы готовности CDP, управляемые OpenClaw, и WebSocket-подключения DevTools обходят управляемый сетевой прокси для точной запущенной конечной точки loopback, поэтому `openclaw browser start` продолжает работать, когда операторский прокси блокирует исходящий трафик loopback.
- Чтобы проксировать сам управляемый браузер, передайте явные флаги прокси Chrome через `browser.extraArgs`, например `--proxy-server=...` или `--proxy-pac-url=...`. Строгий режим SSRF блокирует явную маршрутизацию браузера через прокси, если доступ браузера к частной сети не включен намеренно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` по умолчанию отключен; включайте только когда доступ браузера к частной сети намеренно считается доверенным.
- `browser.ssrfPolicy.allowPrivateNetwork` остается поддерживаемым как устаревший псевдоним.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` означает никогда не запускать локальный браузер; только подключаться, если он уже запущен.
- `headless` можно задать глобально или для каждого локального управляемого профиля. Значения профиля переопределяют `browser.headless`, поэтому один локально запущенный профиль может оставаться headless, а другой - видимым.
- `POST /start?headless=true` и `openclaw browser start --headless` запрашивают
  одноразовый headless-запуск для локальных управляемых профилей без перезаписи
  `browser.headless` или конфигурации профиля. Профили существующего сеанса, attach-only и
  удаленные CDP-профили отклоняют это переопределение, потому что OpenClaw не запускает эти
  браузерные процессы.
- На Linux-хостах без `DISPLAY` или `WAYLAND_DISPLAY` локальные управляемые профили
  автоматически по умолчанию используют headless-режим, когда ни окружение, ни профиль/глобальная
  конфигурация явно не выбирают headed-режим. `openclaw browser status --json`
  сообщает `headlessSource` как `env`, `profile`, `config`,
  `request`, `linux-display-fallback` или `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` принудительно запускает локальные управляемые браузеры в headless-режиме для
  текущего процесса. `OPENCLAW_BROWSER_HEADLESS=0` принудительно включает headed-режим для обычных
  запусков и возвращает применимую ошибку на Linux-хостах без сервера отображения;
  явный запрос `start --headless` все равно имеет приоритет для этого одного запуска.
- `executablePath` можно задать глобально или для каждого локального управляемого профиля. Значения профиля переопределяют `browser.executablePath`, поэтому разные управляемые профили могут запускать разные браузеры на базе Chromium. Обе формы принимают `~` для домашнего каталога вашей ОС.
- `color` (верхнего уровня и для профиля) окрашивает UI браузера, чтобы вы могли видеть, какой профиль активен.
- Профиль по умолчанию - `openclaw` (управляемый автономный). Используйте `defaultProfile: "user"`, чтобы выбрать браузер вошедшего в систему пользователя.
- Порядок автообнаружения: системный браузер по умолчанию, если он на базе Chromium; иначе Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` использует Chrome DevTools MCP вместо сырого CDP. Он может подключаться через авто подключение Chrome MCP или через `cdpUrl`, если у вас уже есть конечная точка DevTools для запущенного браузера.
- Задайте `browser.profiles.<name>.userDataDir`, когда профиль existing-session должен подключаться к пользовательскому профилю Chromium не по умолчанию (Brave, Edge и т. д.). Этот путь также принимает `~` для домашнего каталога вашей ОС.

</Accordion>

</AccordionGroup>

## Использование Brave или другого браузера на базе Chromium

Если ваш **системный браузер по умолчанию** основан на Chromium (Chrome/Brave/Edge/и т. д.),
OpenClaw использует его автоматически. Задайте `browser.executablePath`, чтобы переопределить
автообнаружение. Значения `executablePath` верхнего уровня и для профиля принимают `~`
для домашнего каталога вашей ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Или задайте это в конфигурации для каждой платформы:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` для профиля влияет только на локальные управляемые профили, которые OpenClaw
запускает. Профили `existing-session` вместо этого подключаются к уже запущенному браузеру,
а удаленные CDP-профили используют браузер за `cdpUrl`.

## Локальное и удаленное управление

- **Локальное управление (по умолчанию):** Gateway запускает службу управления loopback и может запускать локальный браузер.
- **Удаленное управление (Node-хост):** запустите Node-хост на машине, где находится браузер; Gateway проксирует действия браузера к нему.
- **Удаленный CDP:** задайте `browser.profiles.<name>.cdpUrl` (или `browser.cdpUrl`), чтобы
  подключиться к удаленному браузеру на базе Chromium. В этом случае OpenClaw не будет запускать локальный браузер.
- Для внешне управляемых CDP-сервисов на loopback (например, Browserless в
  Docker, опубликованный на `127.0.0.1`) также задайте `attachOnly: true`. CDP на loopback
  без `attachOnly` считается локальным профилем браузера, управляемым OpenClaw.
- `headless` влияет только на локальные управляемые профили, которые запускает OpenClaw. Он не перезапускает и не меняет браузеры existing-session или удаленные CDP-браузеры.
- `executablePath` следует тому же правилу локального управляемого профиля. Изменение его для
  запущенного локального управляемого профиля помечает этот профиль для перезапуска/согласования, чтобы
  следующий запуск использовал новый бинарный файл.

Поведение остановки зависит от режима профиля:

- локальные управляемые профили: `openclaw browser stop` останавливает процесс браузера, который
  запустил OpenClaw
- профили attach-only и удаленные CDP-профили: `openclaw browser stop` закрывает активный
  сеанс управления и освобождает переопределения эмуляции Playwright/CDP (viewport,
  цветовую схему, локаль, часовой пояс, offline-режим и подобное состояние), даже
  если OpenClaw не запускал процесс браузера

Удаленные CDP URL могут включать auth:

- Токены запроса (например, `https://provider.example?token=<token>`)
- HTTP Basic auth (например, `https://user:pass@provider.example`)

OpenClaw сохраняет auth при вызове конечных точек `/json/*` и при подключении
к CDP WebSocket. Для токенов предпочитайте переменные окружения или менеджеры секретов
вместо коммита их в конфигурационные файлы.

## Прокси браузера Node (нулевая конфигурация по умолчанию)

Если вы запускаете **Node-хост** на машине, где находится ваш браузер, OpenClaw может
автоматически маршрутизировать вызовы браузерных инструментов к этому Node без дополнительной конфигурации браузера.
Это путь по умолчанию для удаленных Gateway.

Примечания:

- Node-хост предоставляет свой локальный сервер управления браузером через **прокси-команду**.
- Профили берутся из собственной конфигурации `browser.profiles` Node (такой же, как локальная).
- `nodeHost.browserProxy.allowProfiles` необязателен. Оставьте его пустым для устаревшего/стандартного поведения: все настроенные профили остаются доступными через прокси, включая маршруты создания/удаления профилей.
- Если вы задаете `nodeHost.browserProxy.allowProfiles`, OpenClaw рассматривает это как границу минимальных привилегий: целевыми могут быть только профили из allowlist, а маршруты постоянного создания/удаления профилей блокируются на поверхности прокси.
- Отключите, если это не нужно:
  - На Node: `nodeHost.browserProxy.enabled=false`
  - На Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (размещенный удаленный CDP)

[Browserless](https://browserless.io) - размещенный Chromium-сервис, который предоставляет
URL подключения CDP по HTTPS и WebSocket. OpenClaw может использовать любую форму, но
для удаленного профиля браузера самый простой вариант - прямой WebSocket URL
из документации Browserless по подключению.

Пример:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Примечания:

- Замените `<BROWSERLESS_API_KEY>` на ваш настоящий токен Browserless.
- Выберите конечную точку региона, соответствующую вашей учетной записи Browserless (см. их документацию).
- Если Browserless дает вам базовый HTTPS URL, вы можете либо преобразовать его в
  `wss://` для прямого CDP-подключения, либо оставить HTTPS URL и позволить OpenClaw
  обнаружить `/json/version`.

### Browserless Docker на том же хосте

Когда Browserless самостоятельно размещен в Docker, а OpenClaw работает на хосте, рассматривайте
Browserless как внешне управляемый CDP-сервис:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Адрес в `browser.profiles.browserless.cdpUrl` должен быть доступен из процесса
OpenClaw. Browserless также должен объявлять соответствующую достижимую конечную точку;
задайте Browserless `EXTERNAL` на ту же базу WebSocket, публичную для OpenClaw, например
`ws://127.0.0.1:3000`, `ws://browserless:3000` или стабильный частный адрес сети
Docker. Если `/json/version` возвращает `webSocketDebuggerUrl`, указывающий на
адрес, недоступный OpenClaw, CDP HTTP может выглядеть исправным, а подключение
WebSocket все равно будет завершаться ошибкой.

Не оставляйте `attachOnly` незаданным для профиля Browserless на loopback. Без
`attachOnly` OpenClaw считает порт loopback локальным управляемым профилем
браузера и может сообщать, что порт используется, но не принадлежит OpenClaw.

## Провайдеры прямого WebSocket CDP

Некоторые размещенные браузерные сервисы предоставляют **прямую WebSocket** конечную точку, а не
стандартное обнаружение CDP на основе HTTP (`/json/version`). OpenClaw принимает три
формы CDP URL и автоматически выбирает правильную стратегию подключения:

- **Обнаружение HTTP(S)** - `http://host[:port]` или `https://host[:port]`.
  OpenClaw вызывает `/json/version`, чтобы обнаружить URL WebSocket-отладчика, затем
  подключается. Без отката на WebSocket.
- **Прямые WebSocket-конечные точки** - `ws://host[:port]/devtools/<kind>/<id>` или
  `wss://...` с путем `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw подключается напрямую через WebSocket-handshake и полностью пропускает
  `/json/version`.
- **Голые корни WebSocket** - `ws://host[:port]` или `wss://host[:port]` без
  пути `/devtools/...` (например, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw сначала пробует HTTP
  обнаружение `/json/version` (нормализуя схему к `http`/`https`);
  если обнаружение возвращает `webSocketDebuggerUrl`, он используется, иначе OpenClaw
  откатывается к прямому WebSocket-handshake на голом корне. Если объявленная
  WebSocket-конечная точка отклоняет CDP-handshake, но настроенный голый корень
  принимает его, OpenClaw также откатывается к этому корню. Это позволяет голому `ws://`,
  указывающему на локальный Chrome, все равно подключиться, поскольку Chrome принимает WebSocket
  upgrade только на конкретном пути цели из `/json/version`, тогда как размещенные
  провайдеры могут все равно использовать свою корневую WebSocket-конечную точку, когда их конечная точка
  обнаружения объявляет краткоживущий URL, неподходящий для Playwright CDP.

`openclaw browser doctor` использует ту же логику «сначала обнаружение, затем откат на WebSocket»,
что и runtime-подключение, поэтому URL голого корня, который успешно подключается, не
помечается диагностикой как недоступный.

### Browserbase

[Browserbase](https://www.browserbase.com) - облачная платформа для запуска
headless-браузеров со встроенным решением CAPTCHA, stealth-режимом и резидентскими
прокси.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Примечания:

- [Зарегистрируйтесь](https://www.browserbase.com/sign-up) и скопируйте ваш **API Key**
  из [панели Overview](https://www.browserbase.com/overview).
- Замените `<BROWSERBASE_API_KEY>` на ваш настоящий API-ключ Browserbase.
- Browserbase автоматически создает браузерную сессию при подключении WebSocket, поэтому
  шаг ручного создания сессии не нужен.
- Бесплатный тариф позволяет одну одновременную сессию и один браузерный час в месяц.
  См. [тарифы](https://www.browserbase.com/pricing), чтобы узнать лимиты платных планов.
- См. [документацию Browserbase](https://docs.browserbase.com) для полного справочника API,
  руководств по SDK и примеров интеграции.

### Notte

[Notte](https://www.notte.cc) - облачная платформа для запуска headless-
браузеров со встроенной маскировкой, residential-прокси и CDP-нативным
WebSocket-Gateway.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Примечания:

- [Зарегистрируйтесь](https://console.notte.cc) и скопируйте ваш **API Key** со
  страницы настроек консоли.
- Замените `<NOTTE_API_KEY>` на ваш настоящий API-ключ Notte.
- Notte автоматически создает браузерную сессию при подключении WebSocket, поэтому шаг
  ручного создания сессии не нужен. Сессия уничтожается при отключении
  WebSocket.
- Бесплатный тариф позволяет пять одновременных сессий и 100 браузерных
  часов за все время. См. [тарифы](https://www.notte.cc/#pricing), чтобы узнать лимиты платных планов.
- См. [документацию Notte](https://docs.notte.cc) для полного справочника API, руководств по SDK
  и примеров интеграции.

## Безопасность

Ключевые идеи:

- Управление браузером доступно только через local loopback; доступ проходит через аутентификацию Gateway или сопряжение узла.
- Автономный HTTP API браузера через local loopback использует **только аутентификацию общим секретом**:
  bearer-аутентификацию токеном Gateway, `x-openclaw-password` или HTTP Basic auth с
  настроенным паролем Gateway.
- Заголовки идентичности Tailscale Serve и `gateway.auth.mode: "trusted-proxy"` **не**
  аутентифицируют этот автономный API браузера через local loopback.
- Если управление браузером включено, а аутентификация общим секретом не настроена, OpenClaw
  генерирует токен Gateway только для времени выполнения при этом запуске. Явно настройте
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` или
  `OPENCLAW_GATEWAY_PASSWORD`, если клиентам нужен стабильный секрет между
  перезапусками.
- OpenClaw **не** генерирует этот токен автоматически, когда `gateway.auth.mode` уже равен
  `password`, `none` или `trusted-proxy`.
- Держите Gateway и любые узловые хосты в частной сети (Tailscale); избегайте публичного доступа.
- Считайте удаленные CDP URL/токены секретами; предпочитайте переменные окружения или менеджер секретов.

Советы по удаленному CDP:

- По возможности предпочитайте зашифрованные конечные точки (HTTPS или WSS) и короткоживущие токены.
- Не встраивайте долгоживущие токены напрямую в файлы конфигурации.

## Профили (несколько браузеров)

OpenClaw поддерживает несколько именованных профилей (конфигураций маршрутизации). Профили могут быть:

- **управляемые OpenClaw**: выделенный экземпляр браузера на основе Chromium с собственным каталогом пользовательских данных + CDP-портом
- **удаленные**: явный CDP URL (браузер на основе Chromium, запущенный в другом месте)
- **существующая сессия**: ваш существующий профиль Chrome через автоматическое подключение Chrome DevTools MCP

Значения по умолчанию:

- Профиль `openclaw` создается автоматически, если отсутствует.
- Профиль `user` встроен для подключения к существующей сессии Chrome MCP.
- Профили существующих сессий, кроме `user`, включаются явно; создайте их с `--driver existing-session`.
- Локальные CDP-порты по умолчанию выделяются из диапазона **18800-18899**.
- Удаление профиля перемещает его локальный каталог данных в Корзину.

Все конечные точки управления принимают `?profile=<name>`; CLI использует `--browser-profile`.

## Существующая сессия через Chrome DevTools MCP

OpenClaw также может подключаться к запущенному профилю браузера на основе Chromium через
официальный сервер Chrome DevTools MCP. При этом повторно используются вкладки и состояние входа,
уже открытые в этом профиле браузера.

Официальные справочные материалы и инструкции по настройке:

- [Chrome для разработчиков: используйте Chrome DevTools MCP с вашей браузерной сессией](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Встроенный профиль:

- `user`

Необязательно: создайте собственный пользовательский профиль существующей сессии, если вам нужно
другое имя, цвет или каталог данных браузера.

Поведение по умолчанию:

- Встроенный профиль `user` использует автоматическое подключение Chrome MCP, которое нацелено на
  стандартный локальный профиль Google Chrome.

Используйте `userDataDir` для Brave, Edge, Chromium или нестандартного профиля Chrome.
`~` раскрывается в домашний каталог вашей ОС:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Затем в соответствующем браузере:

1. Откройте страницу инспектирования этого браузера для удаленной отладки.
2. Включите удаленную отладку.
3. Оставьте браузер запущенным и подтвердите запрос на подключение, когда OpenClaw подключится.

Распространенные страницы инспектирования:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke-тест живого подключения:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Как выглядит успешный результат:

- `status` показывает `driver: existing-session`
- `status` показывает `transport: chrome-mcp`
- `status` показывает `running: true`
- `tabs` перечисляет уже открытые вкладки вашего браузера
- `snapshot` возвращает ссылки из выбранной живой вкладки

Что проверить, если подключение не работает:

- целевой браузер на основе Chromium имеет версию `144+`
- удаленная отладка включена на странице инспектирования этого браузера
- браузер показал запрос согласия на подключение, и вы его приняли
- если Chrome был запущен с явным `--remote-debugging-port`, задайте
  `browser.profiles.<name>.cdpUrl` на эту конечную точку DevTools вместо использования
  автоматического подключения Chrome MCP
- `openclaw doctor` переносит старую конфигурацию браузера на основе расширения и проверяет, что
  Chrome установлен локально для стандартных профилей автоматического подключения, но не может
  включить за вас удаленную отладку на стороне браузера

Использование агентом:

- Используйте `profile="user"`, когда вам нужно состояние браузера, в котором пользователь вошел в систему.
- Если вы используете пользовательский профиль существующей сессии, передайте это явное имя профиля.
- Выбирайте этот режим только когда пользователь находится за компьютером, чтобы подтвердить запрос
  на подключение.
- Gateway или узловой хост может запустить `npx chrome-devtools-mcp@latest --autoConnect`

Примечания:

- Этот путь рискованнее, чем изолированный профиль `openclaw`, потому что он может
  действовать внутри вашей браузерной сессии с выполненным входом.
- OpenClaw не запускает браузер для этого драйвера; он только подключается.
- Здесь OpenClaw использует официальный поток Chrome DevTools MCP `--autoConnect`. Если
  задан `userDataDir`, он передается дальше, чтобы выбрать этот каталог пользовательских данных.
- Existing-session может подключаться на выбранном хосте или через подключенный
  браузерный узел. Если Chrome находится в другом месте и браузерный узел не подключен, используйте
  удаленный CDP или узловой хост.

### Пользовательский запуск Chrome MCP

Переопределите запускаемый сервер Chrome DevTools MCP для каждого профиля, когда стандартный
поток `npx chrome-devtools-mcp@latest` не подходит (офлайн-хосты,
закрепленные версии, поставляемые вендором бинарные файлы):

| Поле         | Что оно делает                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Исполняемый файл для запуска вместо `npx`. Разрешается как есть; абсолютные пути учитываются.                              |
| `mcpArgs`    | Массив аргументов, передаваемый дословно в `mcpCommand`. Заменяет стандартные аргументы `chrome-devtools-mcp@latest --autoConnect`. |

Когда `cdpUrl` задан в профиле существующей сессии, OpenClaw пропускает
`--autoConnect` и автоматически передает конечную точку в Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (HTTP-конечная точка обнаружения DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямой CDP WebSocket).

Флаги конечной точки и `userDataDir` нельзя комбинировать: когда задан `cdpUrl`,
`userDataDir` игнорируется при запуске Chrome MCP, поскольку Chrome MCP подключается к
запущенному браузеру за конечной точкой, а не открывает каталог
профиля.

<Accordion title="Existing-session feature limitations">

По сравнению с управляемым профилем `openclaw`, драйверы существующих сессий более ограничены:

- **Скриншоты** - захваты страниц и захваты элементов `--ref` работают; CSS-селекторы `--element` не работают. `--full-page` нельзя комбинировать с `--ref` или `--element`. Playwright не требуется для скриншотов страниц или элементов на основе ref.
- **Действия** - `click`, `type`, `hover`, `scrollIntoView`, `drag` и `select` требуют refs снимка (без CSS-селекторов). `click-coords` нажимает по координатам видимой области просмотра и не требует ref снимка. `click` поддерживает только левую кнопку. `type` не поддерживает `slowly=true`; используйте `fill` или `press`. `press` не поддерживает `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` и `evaluate` не поддерживают тайм-ауты для отдельного вызова. `select` принимает одно значение.
- **Ожидание / загрузка / диалог** - `wait --url` поддерживает точные совпадения, подстроки и glob-шаблоны; `wait --load networkidle` не поддерживается в профилях существующих сессий (работает в управляемых и raw/remote CDP-профилях). Хуки загрузки требуют `ref` или `inputRef`, по одному файлу за раз, без CSS `element`. Хуки диалогов не поддерживают переопределение тайм-аута или `dialogId`.
- **Видимость диалога** - ответы действий управляемого браузера включают `blockedByDialog` и `browserState.dialogs.pending`, когда действие открывает модальный диалог; снимки также включают состояние ожидающего диалога. Ответьте с `browser dialog --accept/--dismiss --dialog-id <id>`, пока диалог ожидает ответа. Диалоги, обработанные вне OpenClaw, появляются в `browserState.dialogs.recent`.
- **Функции только для управляемого режима** - пакетные действия, экспорт PDF, перехват загрузок и `responsebody` по-прежнему требуют путь управляемого браузера.

</Accordion>

## Гарантии изоляции

- **Выделенный каталог пользовательских данных**: никогда не затрагивает ваш личный профиль браузера.
- **Выделенные порты**: избегает `9222`, чтобы предотвратить конфликты с рабочими процессами разработки.
- **Детерминированное управление вкладками**: `tabs` сначала возвращает `suggestedTargetId`, затем
  стабильные дескрипторы `tabId`, такие как `t1`, необязательные метки и raw `targetId`.
  Агентам следует повторно использовать `suggestedTargetId`; raw ids остаются доступны для
  отладки и совместимости.

## Выбор браузера

При локальном запуске OpenClaw выбирает первый доступный:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Можно переопределить с помощью `browser.executablePath`.

Платформы:

- macOS: проверяет `/Applications` и `~/Applications`.
- Linux: проверяет распространенные расположения Chrome/Brave/Edge/Chromium в `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` и
  `/usr/lib/chromium-browser`, а также управляемый Playwright Chromium в
  `PLAYWRIGHT_BROWSERS_PATH` или `~/.cache/ms-playwright`.
- Windows: проверяет распространенные места установки.

## API управления (необязательно)

Для скриптинга и отладки Gateway предоставляет небольшой **HTTP API управления только через local loopback**
плюс соответствующий CLI `openclaw browser` (снимки, refs, ожидание,
power-ups, вывод JSON, рабочие процессы отладки). Полный справочник см. в
[API управления браузером](/ru/tools/browser-control).

## Устранение неполадок

Для проблем, специфичных для Linux (особенно snap Chromium), см.
[Устранение неполадок браузера](/ru/tools/browser-linux-troubleshooting).

Для конфигураций WSL2 Gateway + Windows Chrome с разделенными хостами см.
[Устранение неполадок WSL2 + Windows + удаленного Chrome CDP](/ru/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Сбой запуска CDP и блокировка SSRF при навигации

Это разные классы сбоев, и они указывают на разные пути кода.

- **Сбой запуска или готовности CDP** означает, что OpenClaw не может подтвердить исправность плоскости управления браузером.
- **Блокировка SSRF при навигации** означает, что плоскость управления браузером исправна, но целевой адрес навигации страницы отклоняется политикой.

Распространенные примеры:

- Сбой запуска или готовности CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, когда
    внешний CDP-сервис local loopback настроен без `attachOnly: true`
- Блокировка SSRF при навигации:
  - Потоки `open`, `navigate`, snapshot или открытия вкладок завершаются ошибкой политики браузера/сети, при этом `start` и `tabs` по-прежнему работают

Используйте эту минимальную последовательность, чтобы разделить эти два случая:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Как читать результаты:

- Если `start` завершается ошибкой `not reachable after start`, сначала устраняйте неполадки готовности CDP.
- Если `start` успешен, но `tabs` завершается ошибкой, плоскость управления все еще неисправна. Считайте это проблемой доступности CDP, а не проблемой навигации по странице.
- Если `start` и `tabs` успешны, но `open` или `navigate` завершается ошибкой, плоскость управления браузером запущена, а сбой находится в политике навигации или на целевой странице.
- Если `start`, `tabs` и `open` все успешны, базовый путь управления управляемым браузером исправен.

Важные детали поведения:

- Конфигурация браузера по умолчанию использует объект политики SSRF с отказом по умолчанию, даже если вы не настраиваете `browser.ssrfPolicy`.
- Для управляемого профиля local loopback `openclaw` проверки работоспособности CDP намеренно пропускают принудительную проверку доступности по SSRF для собственной локальной плоскости управления OpenClaw.
- Защита навигации отделена. Успешный результат `start` или `tabs` не означает, что последующая цель `open` или `navigate` разрешена.

Рекомендации по безопасности:

- **Не** ослабляйте политику SSRF браузера по умолчанию.
- Предпочитайте узкие исключения для хостов, такие как `hostnameAllowlist` или `allowedHostnames`, вместо широкого доступа к частной сети.
- Используйте `dangerouslyAllowPrivateNetwork: true` только в намеренно доверенных средах, где доступ браузера к частной сети необходим и проверен.

## Инструменты агента и как работает управление

Агент получает **один инструмент** для автоматизации браузера:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Как это сопоставляется:

- `browser snapshot` возвращает стабильное дерево UI (AI или ARIA).
- `browser act` использует идентификаторы `ref` из snapshot для клика, ввода, перетаскивания или выбора.
- `browser screenshot` захватывает пиксели (всю страницу, элемент или refs с метками).
- `browser doctor` проверяет готовность Gateway, Plugin, профиля, браузера и вкладки.
- `browser` принимает:
  - `profile` для выбора именованного профиля браузера (openclaw, chrome или удаленный CDP).
  - `target` (`sandbox` | `host` | `node`) для выбора места, где находится браузер.
  - В изолированных сеансах `target: "host"` требует `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Если `target` не указан: изолированные сеансы по умолчанию используют `sandbox`, сеансы без песочницы по умолчанию используют `host`.
  - Если подключен узел с поддержкой браузера, инструмент может автоматически направить запрос к нему, если вы не закрепите `target="host"` или `target="node"`.

Это сохраняет детерминированность агента и помогает избегать хрупких селекторов.

## Связанные разделы

- [Обзор инструментов](/ru/tools) - все доступные инструменты агента
- [Песочница](/ru/gateway/sandboxing) - управление браузером в изолированных средах
- [Безопасность](/ru/gateway/security) - риски управления браузером и усиление защиты
