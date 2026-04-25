---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера + життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (під керуванням OpenClaw)
x-i18n:
    generated_at: "2026-04-25T10:49:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c38c6dc17fc324d5baef6c03f36a02e6a168b9389c553b559690b0cc3c1d1da6
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої справжньої сесії Chrome, у якій ви вже ввійшли, через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкриття/фокус/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, знімки екрана, PDF.
- Вбудований Skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли увімкнено browser Plugin.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим щоденним основним браузером. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви бачите повідомлення “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` взагалі відсутня або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда браузера або інструмент](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє ту саму назву інструмента `browser`:

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

Для типових налаштувань потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Вимкнення лише Plugin прибирає CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваш конфіг `browser.*` залишається недоторканим для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний, завжди активний контракт: вибирати
  правильний профіль, тримати ref у межах тієї самої вкладки, використовувати `tabId`/мітки для
  вибору вкладки та завантажувати browser Skill для багатоетапної роботи.
- Вбудований Skill `browser-automation` містить довший робочий цикл:
  спочатку перевіряти status/вкладки, позначати вкладки задач, робити snapshot перед дією,
  повторно знімати snapshot після змін в UI, один раз відновлювати stale ref і
  повідомляти про login/2FA/captcha або блокування camera/microphone як про ручну дію замість вгадування.

Skills, вбудовані в Plugin, відображаються в доступних Skills агента, коли
Plugin увімкнено. Повні інструкції Skill завантажуються за потреби, тому звичайні
звернення не несуть повної вартості в токенах.

## Відсутня команда браузера або інструмент

Якщо `openclaw browser` невідома після оновлення, відсутній `browser.request` або агент повідомляє, що інструмент браузера недоступний, зазвичай причина — список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика інструментів застосовується лише після завантаження. Повне видалення `plugins.allow` теж відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **справжньої сесії Chrome**
  з активним входом.

Для викликів інструмента браузера агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні сесії з активним входом і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб типовим був керований режим.

## Конфігурація

Налаштування браузера містяться в `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // типово: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // увімкніть лише для довіреного доступу до приватної мережі
      // allowPrivateNetwork: true, // застарілий псевдонім
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // застаріле перевизначення одного профілю
    remoteCdpTimeoutMs: 1500, // тайм-аут HTTP віддаленого CDP (мс)
    remoteCdpHandshakeTimeoutMs: 3000, // тайм-аут WebSocket handshake віддаленого CDP (мс)
    actionTimeoutMs: 60000, // типовий тайм-аут act браузера (мс)
    tabCleanup: {
      enabled: true, // типово: true
      idleMinutes: 120, // установіть 0, щоб вимкнути очищення неактивних вкладок
      maxTabsPerSession: 8, // установіть 0, щоб вимкнути ліміт на сесію
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

<AccordionGroup>

<Accordion title="Порти та доступність">

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; установлюйте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується локальний керований порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP для віддаленого (не loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до WebSocket handshakes віддаленого CDP.
- `actionTimeoutMs` — це типовий бюджет для запитів `act` браузера, коли викликач не передає `timeoutMs`. Клієнтський транспорт додає невелике запасне вікно, щоб тривалі очікування могли завершитися замість тайм-ауту на межі HTTP.
- `tabCleanup` — це best-effort очищення для вкладок, відкритих основними browser-сесіями агента. Очищення життєвого циклу subagent, Cron і ACP усе ще закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними до повторного використання, а потім у фоновому режимі закривають неактивні або надлишкові відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені від SSRF перед переходом і потім повторно перевіряються в режимі best-effort на фінальному URL `http(s)`.
- У строгому режимі SSRF також перевіряються виявлення віддалених кінцевих точок CDP і запити до `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, яким керує OpenClaw. Керований Chrome типово запускається напряму, щоб налаштування proxy provider не послаблювали перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці Chrome proxy через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію browser proxy, якщо доступ браузера до приватної мережі не увімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнений; увімкніть його лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним застарілим псевдонімом.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений.
- `headless` можна встановити глобально або для окремого локального керованого профілю. Значення для конкретного профілю мають пріоритет над `browser.headless`, тож один локально запущений профіль може залишатися headless, поки інший лишається видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий запуск у режимі headless для локальних керованих профілів без
  перезапису `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  remote CDP відхиляють це перевизначення, оскільки OpenClaw не запускає ці
  процеси браузера.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  типово автоматично переходять у режим headless, якщо ні середовище, ні конфігурація профілю/глобальна
  конфігурація явно не вибирає режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локально керовані браузери в режимі headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає зрозумілу помилку на хостах Linux без сервера дисплея;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна встановити глобально або для окремого локального керованого профілю. Значення конкретного профілю мають пріоритет над `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на базі Chromium.
- `color` (верхній рівень і рівень профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований окремий). Використовуйте `defaultProfile: "user"`, щоб увімкнути браузер користувача з активним входом.
- Порядок автовиявлення: системний типовий браузер, якщо він базується на Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не встановлюйте `cdpUrl` для цього driver.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нестандартного профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним типовим** браузером є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовиявлення. `~` розгортається до домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або встановіть це в конфігурації, для кожної платформи:

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

`executablePath` для конкретного профілю впливає лише на локальні керовані профілі, які запускає
OpenClaw. Профілі `existing-session` натомість підключаються до вже запущеного браузера,
а профілі remote CDP використовують браузер, що стоїть за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування і може запускати локальний браузер.
- **Віддалене керування (host Node):** запустіть host Node на машині, де є браузер; Gateway проксіює до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на базі Chromium. У цьому разі OpenClaw не запускатиме локальний браузер.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери existing-session або remote CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Його зміна для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  під час наступного запуску використовувався новий бінарний файл.

Поведінка під час зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і remote CDP: `openclaw browser stop` закриває активну
  сесію керування і скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени в параметрах запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікаційні дані під час виклику кінцевих точок `/json/*` і під час підключення
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів, а не зберігати їх у файлах конфігурації.

## Node browser proxy (типово без додаткової конфігурації)

Якщо ви запускаєте **host Node** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики browser tool до цього вузла без додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Host Node надає доступ до свого локального сервера керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами створення/видалення профілів.
- Якщо ви встановите `nodeHost.browserProxy.allowProfiles`, OpenClaw трактуватиме це як межу найменших привілеїв: можна буде звертатися лише до профілів з allowlist, а маршрути створення/видалення постійних профілів будуть заблоковані на поверхні proxy.
- Вимкніть, якщо не хочете цього:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hosted remote CDP)

[Browserless](https://browserless.io) — це хостингова служба Chromium, яка надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для віддаленого профілю браузера найпростішим варіантом є прямий URL WebSocket
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
- Виберіть кінцеву точку регіону, що відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі хостингові сервіси браузерів надають **пряму кінцеву точку WebSocket**, а не
стандартне HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три форми
URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S) discovery** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Резервного переходу до WebSocket немає.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається безпосередньо через WebSocket handshake і повністю пропускає
  `/json/version`.
- **Кореневі URL WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP
  discovery через `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо discovery повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого WebSocket handshake на корені без шляху. Це дозволяє
  bare `ws://`, спрямованому на локальний Chrome, усе одно підключатися, оскільки Chrome
  приймає WebSocket upgrades лише на конкретному шляху для цілі, отриманому з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode та residential
proxy.

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
  з [панелі Overview](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній ключ API Browserbase.
- Browserbase автоматично створює сесію браузера під час WebSocket-підключення, тому
  крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну годину браузера на місяць.
  Див. [ціни](https://www.browserbase.com/pricing) для лімітів платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повного API
  reference, посібників SDK та прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing вузла.
- Автономний loopback browser HTTP API використовує **лише автентифікацію спільним секретом**:
  bearer auth з токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve та `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback browser API.
- Якщо керування браузером увімкнено і не налаштовано жодної автентифікації спільним секретом, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` вже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які host Node у приватній мережі (Tailscale); уникайте публічного доступу.
- Ставтеся до URL/токенів віддаленого CDP як до секретів; краще використовувати змінні середовища або менеджер секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і токенам із коротким строком дії.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium працює в іншому місці)
- **наявна сесія**: ваш наявний профіль Chrome через автоматичне підключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для підключення до наявної сесії Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються за бажанням; створюйте їх через `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний кастомний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автоматичне підключення Chrome MCP, яке націлене на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або нетипового профілю Chrome:

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
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw під’єднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test підключення в реальному часі:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Ознаки успішного підключення:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує ваші вже відкриті вкладки браузера
- `snapshot` повертає ref із вибраної активної вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера увімкнено віддалене налагодження
- браузер показав запит на підключення, і ви його прийняли
- `openclaw doctor` переносить стару конфігурацію браузера на основі розширення та перевіряє,
  що Chrome локально встановлений для типових профілів автоматичного підключення, але не може
  увімкнути віддалене налагодження в браузері за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан браузера користувача з активним входом.
- Якщо ви використовуєте кастомний профіль existing-session, передайте його явну назву.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або host Node можуть запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях ризикованіший, ніж ізольований профіль `openclaw`, тому що він може
  виконувати дії всередині вашої сесії браузера з активним входом.
- OpenClaw не запускає браузер для цього driver; він лише підключається.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, він передається далі для націлювання на цей каталог даних користувача.
- Existing-session може підключатися на вибраному host або через підключений
  browser Node. Якщо Chrome розташований деінде і browser Node не підключено, використовуйте
  remote CDP або host Node.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Знімки екрана** — працюють захоплення сторінки та захоплення елементів через `--ref`; CSS-селектори `--element` не працюють. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для знімків сторінки або елементів на основі ref.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot ref (без CSS-селекторів). `click-coords` натискає у видимих координатах viewport і не потребує snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремого виклику. `select` приймає одне значення.
- **Очікування / завантаження / діалогові вікна** — `wait --url` підтримує точні, підрядкові та glob-шаблони; `wait --load networkidle` не підтримується. Hooks завантаження потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Hooks діалогових вікон не підтримують перевизначення тайм-ауту.

- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається вашого особистого профілю браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агентам слід повторно використовувати `suggestedTargetId`; сирі id лишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це через `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє поширені каталоги встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **HTTP API керування
лише через loopback** плюс відповідний CLI `openclaw browser` (snapshot, ref, wait
розширення, вивід JSON, робочі процеси налагодження). Див.
[API керування браузером](/uk/tools/browser-control) для повного довідника.

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними host WSL2 Gateway + Windows Chrome див.
[Усунення несправностей WSL2 + Windows + remote Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти блокування SSRF під час навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером справна.
- **Блокування SSRF під час навігації** означає, що площина керування браузером справна, але ціль переходу сторінки відхиляється політикою.

Поширені приклади:

- Збій запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладки завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Скористайтеся цією мінімальною послідовністю, щоб розрізнити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему доступності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а збій виникає в політиці навігації або на цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки справності CDP навмисно пропускають застосування доступності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Вказівки з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Надавайте перевагу вузьким виняткам для host, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (усю сторінку, елемент або позначені ref).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладки.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або remote CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де розташований браузер.
  - У sandboxed-сесіях `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: sandboxed-сесії типово використовують `sandbox`, не-sandbox сесії типово використовують `host`.
  - Якщо підключено Node з підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це робить роботу агента детермінованою та допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція sandbox](/uk/gateway/sandboxing) — керування браузером у sandboxed-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і зміцнення захисту
