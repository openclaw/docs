---
read_when:
    - Додавання керованої агентом автоматизації браузера
    - Налагодження причин, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера + життєвого циклу в застосунку macOS
summary: Інтегрована служба керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-06-27T18:23:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера й керується через невеликий локальний
сервіс керування всередині Gateway (лише local loopback).

Погляд для початківців:

- Уявляйте це як **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному каналі.
- Вбудований профіль `user` під’єднується до вашої реальної сесії Chrome із виконаним входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований Skill `browser-automation`, який навчає агентів циклу відновлення для snapshot,
  stable-tab, stale-ref і manual-blocker, коли браузерний
  plugin увімкнено.
- Необов’язкову підтримку кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для щоденного використання. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте "Browser disabled", увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутня або агент каже, що браузерний інструмент
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` є вбудованим plugin. Вимкніть його, щоб замінити іншим plugin, який реєструє ту саму назву інструмента `browser`:

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

Для типових значень потрібні і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Вимкнення лише plugin прибирає CLI `openclaw browser`, метод gateway `browser.request`, інструмент агента й сервіс керування як єдине ціле; ваша конфігурація `browser.*` залишається недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб plugin міг повторно зареєструвати свій сервіс.

## Настанови для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` містить `web_search` і
`web_fetch`, але не містить повного інструмента `browser`. Якщо агент або
створений субагент має використовувати браузерну автоматизацію, додайте browser на етапі
профілю:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Для одного агента використовуйте `agents.list[].tools.alsoAllow: ["browser"]`.
Лише `tools.subagents.tools.allow: ["browser"]` недостатньо, бо політика субагента
застосовується після фільтрації профілю.

Браузерний plugin постачається з двома рівнями настанов для агента:

- Опис інструмента `browser` містить стислий постійно активний контракт: вибирати
  правильний профіль, утримувати refs у межах тієї самої вкладки, використовувати `tabId`/мітки для
  націлювання на вкладку й завантажувати браузерний Skill для багатоетапної роботи.
- Вбудований Skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити status/tabs, позначити вкладки завдання, зробити snapshot перед дією, повторити snapshot
  після змін UI, один раз відновитися після stale refs і повідомляти про login/2FA/captcha або
  блокувальники camera/microphone як про ручну дію замість припущень.

Skills, вбудовані в plugin, перелічуються серед доступних Skills агента, коли
plugin увімкнено. Повні інструкції Skill завантажуються на вимогу, тому звичайні
ходи не сплачують повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо `openclaw browser` невідома після оновлення, `browser.request` відсутній або агент повідомляє, що браузерний інструмент недоступний, звична причина — список `plugins.allow`, який пропускає `browser`, і відсутній кореневий блок конфігурації `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явний кореневий блок `browser`, наприклад `browser.enabled=true` або `browser.profiles.<name>`, активує вбудований браузерний plugin навіть за обмежувального `plugins.allow`, відповідно до поведінки конфігурації каналів. `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` самі собою не замінюють членство в allowlist. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль Chrome MCP attach для вашої **реальної сесії Chrome із виконаним входом**.

Для викликів браузерного інструмента агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні сесії з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/схвалити будь-який attach prompt.
- `profile` — явне перевизначення, коли потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете керований режим за замовчуванням.

## Конфігурація

Налаштування браузера містяться в `~/.openclaw/openclaw.json`.

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

### Зір скриншотів (підтримка текстової моделі)

Коли основна модель є лише текстовою (без підтримки vision/мультимодальності), браузерні
скриншоти повертають блоки зображень, які модель не може прочитати. Браузерні скриншоти
повторно використовують наявну конфігурацію розуміння зображень, тому модель зображень,
налаштована для розуміння медіа, може описувати скриншоти як текст без будь-яких
специфічних для браузера налаштувань моделі.

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

**Як це працює:**

1. Агент викликає `browser screenshot` → зображення, як зазвичай, записується на диск.
2. Браузерний інструмент запитує наявний runtime розуміння зображень, чи
   може він описати скриншот за допомогою налаштованих медіамоделей зображень, спільних медіамоделей,
   типових значень image-model або image provider на основі автентифікації.
3. Модель vision повертає текстовий опис, який обгортається через
   `wrapExternalContent` (захист від prompt injection) і повертається агенту
   як текстовий блок замість блоку зображення.
4. Якщо розуміння зображень недоступне, пропущене або завершується помилкою, браузер повертається
   до повернення початкового блоку зображення.

Використовуйте наявні поля `tools.media.image` / `tools.media.models` для model
fallbacks, timeouts, byte limits, profiles і налаштувань provider request.

Якщо активна основна модель уже підтримує vision і явна модель розуміння зображень
не налаштована, OpenClaw зберігає звичайний результат зображення, щоб
основна модель могла прочитати скриншот напряму.

<AccordionGroup>

<Accordion title="Ports and reachability">

- Сервіс керування прив’язується до local loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для
  віддалених профілів CDP або під’єднання до endpoint existing-session. `cdpUrl` типово вказує на
  керований локальний порт CDP, коли не заданий.
- `remoteCdpTimeoutMs` застосовується до перевірок HTTP-доступності CDP для remote і `attachOnly`,
  а також до HTTP-запитів відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до
  їхніх CDP WebSocket handshakes.
- `localLaunchTimeoutMs` — це бюджет для локально запущеного керованого процесу Chrome,
  щоб він відкрив свій HTTP endpoint CDP. `localCdpReadyTimeoutMs` — це
  подальший бюджет для готовності CDP websocket після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, VPS низького класу або старішому обладнанні, де Chromium
  запускається повільно. Значення мають бути додатними цілими числами до `120000` мс; недійсні
  значення конфігурації відхиляються.
- Повторні помилки запуску/готовності керованого Chrome перериваються circuit breaker для кожного
  профілю. Після кількох послідовних помилок OpenClaw ненадовго призупиняє нові спроби
  запуску замість створення Chromium під час кожного виклику браузерного інструмента. Виправте
  проблему запуску, вимкніть браузер, якщо він не потрібен, або перезапустіть
  Gateway після ремонту.
- `actionTimeoutMs` — типовий бюджет для браузерних запитів `act`, коли викликач не передає `timeoutMs`. Клієнтський транспорт додає невелике вікно запасу, щоб довгі очікування могли завершитися, а не перерватися на межі HTTP.
- `tabCleanup` — best-effort очищення вкладок, відкритих основними агентськими браузерними сесіями. Очищення життєвого циклу subagent, cron і ACP досі закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними до повторного використання, а потім закривають неактивні або надлишкові відстежувані вкладки у фоновому режимі.

</Accordion>

<Accordion title="SSRF policy">

- Навігація браузера й відкриття вкладок захищені від SSRF перед навігацією та, за можливості, повторно перевіряються після цього на фінальній `http(s)` URL-адресі.
- У строгому режимі SSRF також перевіряються виявлення віддаленої CDP-кінцевої точки та проби `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/провайдера `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, керований OpenClaw. Керований Chrome за замовчуванням запускається напряму, тож налаштування проксі провайдера не послаблюють SSRF-перевірки браузера.
- Проби готовності local loopback CDP, керовані OpenClaw, і WebSocket-підключення DevTools оминають керований мережевий проксі для точної запущеної loopback-кінцевої точки, тому `openclaw browser start` і далі працює, коли операторський проксі блокує loopback-вихід.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію браузера через проксі, якщо доступ браузера до приватної мережі не ввімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено за замовчуванням; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і надалі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений.
- `headless` можна задати глобально або для окремого локального керованого профілю. Значення профілю перевизначають `browser.headless`, тож один локально запущений профіль може залишатися headless, а інший — видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий headless-запуск для локальних керованих профілів без переписування
  `browser.headless` або конфігурації профілю. Профілі наявного сеансу, attach-only і
  віддалені CDP-профілі відхиляють це перевизначення, бо OpenClaw не запускає ці
  процеси браузера.
- На Linux-хостах без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично за замовчуванням переходять у headless, коли ні середовище, ні профільна/глобальна
  конфігурація явно не обирають режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локальні керовані браузери headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає дієву помилку на Linux-хостах без display-сервера;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задати глобально або для окремого локального керованого профілю. Значення профілю перевизначають `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на базі Chromium. Обидві форми приймають `~` для домашнього каталогу вашої ОС.
- `color` (верхнього рівня та профільний) підфарбовує інтерфейс браузера, щоб було видно, який профіль активний.
- Профіль за замовчуванням — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб вибрати браузер користувача з виконаним входом.
- Порядок автовиявлення: системний браузер за замовчуванням, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Він може підключатися через автопідключення Chrome MCP або через `cdpUrl`, коли у вас уже є DevTools-кінцева точка для запущеного браузера.
- Задайте `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нестандартного профілю користувача Chromium (Brave, Edge тощо). Цей шлях також приймає `~` для домашнього каталогу вашої ОС.

</Accordion>

</AccordionGroup>

## Використання Brave або іншого браузера на базі Chromium

Якщо ваш **системний браузер за замовчуванням** базується на Chromium (Chrome/Brave/Edge/тощо),
OpenClaw використовує його автоматично. Задайте `browser.executablePath`, щоб перевизначити
автовиявлення. Значення `executablePath` верхнього рівня та профільні значення приймають `~`
для домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або задайте це в конфігурації для кожної платформи:

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

Профільний `executablePath` впливає лише на локальні керовані профілі, які запускає
OpenClaw. Профілі `existing-session` натомість підключаються до вже запущеного браузера,
а віддалені CDP-профілі використовують браузер за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (за замовчуванням):** Gateway запускає службу керування local loopback і може запускати локальний браузер.
- **Віддалене керування (node host):** запустіть node host на машині, де є браузер; Gateway проксіює дії браузера до нього.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих CDP-сервісів на loopback (наприклад Browserless у
  Docker, опублікований на `127.0.0.1`) також задайте `attachOnly: true`. Loopback CDP
  без `attachOnly` розглядається як локальний профіль браузера, керований OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає й не змінює браузери existing-session або віддалені CDP-браузери.
- `executablePath` дотримується того самого правила локального керованого профілю. Зміна його для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використав новий виконуваний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддалені CDP-профілі: `openclaw browser stop` закриває активний
  сеанс керування та звільняє перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, offline-режим і подібний стан), навіть
  якщо OpenClaw не запускав процес браузера

Віддалені CDP-URL можуть містити автентифікацію:

- Токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику кінцевих точок `/json/*` і під час підключення
до CDP WebSocket. Для токенів надавайте перевагу змінним середовища або менеджерам секретів
замість коміту їх у файли конфігурації.

## Проксі браузера Node (zero-config за замовчуванням)

Якщо ви запускаєте **node host** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструментів браузера до цього вузла без додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Node host надає свій локальний сервер керування браузером через **команду проксі**.
- Профілі беруться з власної конфігурації `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядає це як межу найменших привілеїв: цільовими можуть бути лише профілі з allowlist, а сталі маршрути створення/видалення профілів блокуються на поверхні проксі.
- Вимкніть, якщо це не потрібно:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостований віддалений CDP)

[Browserless](https://browserless.io) — це хостований сервіс Chromium, який надає
CDP URL-адреси підключення через HTTPS і WebSocket. OpenClaw може використовувати обидві форми, але
для віддаленого профілю браузера найпростіший варіант — прямий WebSocket URL
з документації Browserless щодо підключення.

Приклад:

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

Примітки:

- Замініть `<BROWSERLESS_API_KEY>` на ваш справжній токен Browserless.
- Оберіть регіональну кінцеву точку, що відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає базовий HTTPS URL, ви можете або перетворити його на
  `wss://` для прямого CDP-підключення, або залишити HTTPS URL і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому самому хості

Коли Browserless самостійно розміщений у Docker, а OpenClaw працює на хості, розглядайте
Browserless як зовнішньо керований CDP-сервіс:

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

Адреса в `browser.profiles.browserless.cdpUrl` має бути доступною з процесу
OpenClaw. Browserless також має рекламувати відповідну доступну кінцеву точку;
задайте Browserless `EXTERNAL` на ту саму WebSocket-базу, публічну для OpenClaw, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну адресу мережі
Docker. Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на
адресу, недоступну для OpenClaw, CDP HTTP може виглядати справним, тоді як
WebSocket-підключення все одно не вдасться.

Не залишайте `attachOnly` незаданим для loopback-профілю Browserless. Без
`attachOnly` OpenClaw розглядає loopback-порт як локальний керований профіль браузера
і може повідомити, що порт використовується, але не належить OpenClaw.

## Прямі WebSocket CDP-провайдери

Деякі хостовані браузерні сервіси надають **пряму WebSocket** кінцеву точку, а не
стандартне HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три
форми CDP URL і автоматично обирає правильну стратегію підключення:

- **HTTP(S)-виявлення** - `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити WebSocket URL налагоджувача, а потім
  підключається. Без резервного WebSocket.
- **Прямі WebSocket-кінцеві точки** - `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через WebSocket handshake і повністю пропускає
  `/json/version`.
- **Голі WebSocket-корені** - `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спершу пробує HTTP
  виявлення `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, використовується він, інакше OpenClaw
  переходить до прямого WebSocket handshake на голому корені. Якщо рекламована
  WebSocket-кінцева точка відхиляє CDP handshake, але налаштований голий корінь
  приймає його, OpenClaw також повертається до цього кореня. Це дозволяє голому `ws://`,
  спрямованому на локальний Chrome, усе одно підключитися, оскільки Chrome приймає WebSocket
  upgrades лише на конкретному цільовому шляху з `/json/version`, тоді як хостовані
  провайдери все ще можуть використовувати свою кореневу WebSocket-кінцеву точку, коли їхня кінцева точка
  виявлення рекламує короткоживучий URL, непридатний для Playwright CDP.

`openclaw browser doctor` використовує ту саму логіку спершу-виявлення, WebSocket-fallback,
що й runtime attach, тому голий кореневий URL, який успішно підключається, не
позначається діагностикою як недоступний.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth-режимом і residential
проксі.

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

Примітки:

- [Зареєструйтеся](https://www.browserbase.com/sign-up) і скопіюйте свій **API Key**
  з [панелі огляду](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на свій справжній API-ключ Browserbase.
- Browserbase автоматично створює браузерну сесію під час підключення WebSocket, тому
  крок ручного створення сесії не потрібен.
- Безплатний рівень дозволяє одну одночасну сесію та одну браузерну годину на місяць.
  Див. [ціни](https://www.browserbase.com/pricing), щоб дізнатися ліміти платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com), щоб отримати повний
  довідник API, посібники SDK та приклади інтеграції.

### Notte

[Notte](https://www.notte.cc) — це хмарна платформа для запуску headless
браузерів із вбудованим stealth, резидентними проксі та CDP-native
Gateway WebSocket.

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

Примітки:

- [Зареєструйтеся](https://console.notte.cc) і скопіюйте свій **API Key** зі
  сторінки налаштувань консолі.
- Замініть `<NOTTE_API_KEY>` на свій справжній API-ключ Notte.
- Notte автоматично створює браузерну сесію під час підключення WebSocket, тому
  крок ручного створення сесії не потрібен. Сесію знищується, коли
  WebSocket відключається.
- Безплатний рівень дозволяє п’ять одночасних сесій і 100 браузерних годин
  протягом усього строку користування. Див. [ціни](https://www.notte.cc/#pricing), щоб дізнатися ліміти платних планів.
- Див. [документацію Notte](https://docs.notte.cc), щоб отримати повний довідник API, посібники SDK
  та приклади інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або сполучення вузлів.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  автентифікацію bearer токеном Gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем Gateway.
- Заголовки ідентичності Tailscale Serve та `gateway.auth.mode: "trusted-proxy"` **не**
  автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено й автентифікацію спільним секретом не налаштовано, OpenClaw
  генерує лише runtime-токен Gateway для цього запуску. Налаштуйте
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` або
  `OPENCLAW_GATEWAY_PASSWORD` явно, якщо клієнтам потрібен стабільний секрет між
  перезапусками.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости вузлів у приватній мережі (Tailscale); уникайте публічного доступу.
- Розглядайте віддалені CDP URL/токени як секрети; надавайте перевагу env vars або менеджеру секретів.

Поради щодо віддаленого CDP:

- Надавайте перевагу зашифрованим endpoint (HTTPS або WSS) і короткостроковим токенам, де це можливо.
- Уникайте вбудовування довгострокових токенів безпосередньо у конфігураційні файли.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **openclaw-managed**: виділений екземпляр браузера на базі Chromium із власним каталогом даних користувача + CDP-портом
- **remote**: явний CDP URL (браузер на базі Chromium, що працює в іншому місці)
- **existing session**: ваш наявний профіль Chrome через автоматичне підключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` є вбудованим для приєднання до наявної сесії Chrome MCP.
- Профілі наявних сесій, окрім `user`, вмикаються явно; створюйте їх за допомогою `--driver existing-session`.
- Локальні CDP-порти типово виділяються з діапазону **18800-18899**.
- Видалення профілю переміщує його локальний каталог даних до Кошика.

Усі контрольні endpoint приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може приєднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання для налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний користувацький профіль наявної сесії, якщо вам потрібні
інша назва, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автоматичне підключення Chrome MCP, яке націлюється на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або нетипового профілю Chrome.
`~` розгортається до домашнього каталогу вашої ОС:

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

Потім у відповідному браузері:

1. Відкрийте сторінку inspect цього браузера для віддаленого налагодження.
2. Увімкніть віддалене налагодження.
3. Залиште браузер запущеним і схваліть запит на підключення, коли OpenClaw приєднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test живого приєднання:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Як виглядає успіх:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує ваші вже відкриті вкладки браузера
- `snapshot` повертає refs з вибраної живої вкладки

Що перевірити, якщо приєднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- віддалене налагодження ввімкнено на сторінці inspect цього браузера
- браузер показав запит згоди на приєднання, і ви його прийняли
- якщо Chrome запущено з явним `--remote-debugging-port`, задайте
  `browser.profiles.<name>.cdpUrl` на цей endpoint DevTools замість покладання
  на автоматичне підключення Chrome MCP
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення та перевіряє, що
  Chrome встановлено локально для типових профілів автоматичного підключення, але він не може
  увімкнути для вас віддалене налагодження з боку браузера

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте користувацький профіль наявної сесії, передайте цю явну назву профілю.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб схвалити запит
  на приєднання.
- Gateway або хост вузла може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  діяти всередині вашої сесії браузера з виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він лише приєднується.
- OpenClaw тут використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його передають далі, щоб націлитися на цей каталог даних користувача.
- Наявна сесія може приєднуватися на вибраному хості або через підключений
  браузерний вузол. Якщо Chrome розміщено в іншому місці й браузерний вузол не підключено, використовуйте
  віддалений CDP або хост вузла натомість.

### Користувацький запуск Chrome MCP

Перевизначте породжений сервер Chrome DevTools MCP для кожного профілю, коли типовий
потік `npx chrome-devtools-mcp@latest` не відповідає вашим потребам (офлайн-хости,
зафіксовані версії, вендорні бінарні файли):

| Поле         | Що воно робить                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл для запуску замість `npx`. Розв’язується як є; абсолютні шляхи поважаються.                              |
| `mcpArgs`    | Масив аргументів, переданий дослівно до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли `cdpUrl` задано для профілю наявної сесії, OpenClaw пропускає
`--autoConnect` і автоматично передає endpoint до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (HTTP endpoint виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий CDP WebSocket).

Прапорці endpoint і `userDataDir` не можна поєднувати: коли задано `cdpUrl`,
`userDataDir` ігнорується для запуску Chrome MCP, оскільки Chrome MCP приєднується до
запущеного браузера за endpoint, а не відкриває каталог
профілю.

<Accordion title="Обмеження функції наявної сесії">

Порівняно з керованим профілем `openclaw`, драйвери наявної сесії мають більше обмежень:

- **Знімки екрана** - знімки сторінки та знімки елементів `--ref` працюють; CSS-селектори `--element` — ні. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для знімків сторінки або елементів на основі ref.
- **Дії** - `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot refs (без CSS-селекторів). `click-coords` натискає видимі координати viewport і не потребує snapshot ref. `click` підтримує лише ліву кнопку. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремих викликів. `select` приймає одне значення.
- **Очікування / завантаження / діалог** - `wait --url` підтримує точні, підрядкові та glob-шаблони; `wait --load networkidle` не підтримується в профілях наявної сесії (працює в керованих і raw/remote CDP профілях). Хуки завантаження потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-аутів або `dialogId`.
- **Видимість діалогу** - відповіді дій керованого браузера містять `blockedByDialog` і `browserState.dialogs.pending`, коли дія відкриває модальний діалог; snapshots також містять стан діалогів, що очікують. Відповідайте за допомогою `browser dialog --accept/--dismiss --dialog-id <id>`, доки діалог очікує. Діалоги, оброблені поза OpenClaw, з’являються в `browserState.dialogs.recent`.
- **Функції лише для керованого режиму** - пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Виділений каталог даних користувача**: ніколи не торкається вашого особистого профілю браузера.
- **Виділені порти**: уникає `9222`, щоб запобігти конфліктам із dev workflows.
- **Детерміноване керування вкладками**: `tabs` повертає спочатку `suggestedTargetId`, потім
  стабільні handles `tabId`, як-от `t1`, необов’язкові мітки та raw `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; raw ids залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw обирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Можна перевизначити за допомогою `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`, а також Chromium, керований Playwright, у
  `PLAYWRIGHT_BROWSERS_PATH` або `~/.cache/ms-playwright`.
- Windows: перевіряє поширені розташування встановлення.

## Control API (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **loopback-only HTTP
control API** плюс відповідний CLI `openclaw browser` (snapshots, refs, посилені очікування,
JSON-вивід, debug workflows). Див.
[Browser control API](/uk/tools/browser-control), щоб отримати повний довідник.

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення проблем із браузером](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій WSL2 Gateway + Windows Chrome з розділеним хостом див.
[Усунення проблем WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування SSRF під час навігації

Це різні класи помилок, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити справність площини керування браузером.
- **Блокування SSRF під час навігації** означає, що площина керування браузером справна, але ціль навігації сторінки відхилено політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, коли
    налаштовано зовнішню CDP-службу loopback без `attachOnly: true`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, створення знімка або відкриття вкладки завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб відокремити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усуньте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему доступності CDP, а не як проблему навігації сторінкою.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером запущена, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера за замовчуванням використовує об’єкт політики SSRF із fail-closed, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для керованого профілю `openclaw` з local loopback перевірки справності CDP навмисно пропускають застосування доступності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Надавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібний і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево інтерфейсу (AI або ARIA).
- `browser act` використовує ідентифікатори `ref` зі знімка, щоб клацати/вводити/перетягувати/вибирати.
- `browser screenshot` захоплює пікселі (повна сторінка, елемент або позначені `ref`).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладки.
- `browser` приймає:
  - `profile`, щоб вибрати іменований профіль браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`), щоб вибрати, де розміщено браузер.
  - У ізольованих сеансах `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: ізольовані сеанси за замовчуванням використовують `sandbox`, неізольовані сеанси за замовчуванням використовують `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизувати до нього, якщо ви не закріпите `target="host"` або `target="node"`.

Це робить агента детермінованим і дає змогу уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) - усі доступні інструменти агента
- [Ізоляція](/uk/gateway/sandboxing) - керування браузером в ізольованих середовищах
- [Безпека](/uk/gateway/security) - ризики керування браузером і посилення захисту
