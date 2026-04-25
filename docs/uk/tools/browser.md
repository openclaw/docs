---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку macOS
summary: Інтегрована служба керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T05:04:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdcc8c16f474f5265bcbd38bcc3266ad3bad9e61d378750427baa69349fefd89
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невелику локальну
службу керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (помаранчевий акцент за замовчуванням).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, знімки екрана, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли plugin браузера ввімкнено.
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

Якщо ви бачите “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` взагалі відсутня або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда браузера або інструмент](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Інструмент `browser` за замовчуванням — це вбудований plugin. Вимкніть його, щоб замінити іншим plugin, який реєструє ту саму назву інструмента `browser`:

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

Для значень за замовчуванням потрібні і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Вимкнення лише plugin прибирає CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та службу керування як єдине ціле; ваша конфігурація `browser.*` залишається незмінною для заміни.

Зміни конфігурації браузера вимагають перезапуску Gateway, щоб plugin міг повторно зареєструвати свою службу.

## Вказівки для агента

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: вибирати
  правильний профіль, тримати ref в одній і тій самій вкладці, використовувати `tabId`/мітки для націлювання на вкладки та завантажувати skill браузера для багатоетапної роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити статус/вкладки, позначити вкладки завдання, зробити snapshot перед дією, повторно зробити snapshot
  після змін в інтерфейсі, один раз відновити stale refs і повідомляти про блокування через login/2FA/captcha або
  камеру/мікрофон як про ручну дію замість здогадок.

Skills, що постачаються разом із plugin, відображаються в списку доступних skills агента, коли
plugin увімкнено. Повні інструкції skill завантажуються за потреби, тому звичайні
звернення не оплачують повну вартість у токенах.

## Відсутня команда браузера або інструмент

Якщо `openclaw browser` невідома після оновлення, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичайна причина — список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням plugin, а політика інструментів застосовується лише після завантаження. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль під’єднання Chrome MCP до вашої **справжньої авторизованої сесії Chrome**.

Для викликів інструмента браузера агентом:

- За замовчуванням: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні авторизовані сесії, а користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на під’єднання.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера знаходяться в `~/.openclaw/openclaw.json`.

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

<AccordionGroup>

<Accordion title="Порти та досяжність">

- Служба керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тому самому сімействі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, за замовчуванням використовується керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок досяжності HTTP віддаленого (не-loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до рукостискань WebSocket віддаленого CDP.
- `tabCleanup` — це очищення з найкращими зусиллями для вкладок, відкритих основними сесіями браузера агента. Очищення життєвого циклу subagent, Cron і ACP все одно закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії залишають активні вкладки придатними до повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені від SSRF перед навігацією та повторно перевіряються з найкращими зусиллями на фінальному URL `http(s)` після неї.
- У строгому режимі SSRF також перевіряються виявлення endpoint віддаленого CDP і запити до `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють браузер, яким керує OpenClaw, автоматично. Керований Chrome за замовчуванням запускається напряму, щоб налаштування проксі провайдера не послаблювали перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію браузерного проксі, якщо доступ браузера до приватної мережі не було навмисно ввімкнено.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` за замовчуванням вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі свідомо вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже працює.
- `headless` можна встановити глобально або для кожного локального керованого профілю. Значення для профілю перевизначають `browser.headless`, тож один локально запущений профіль може залишатися headless, а інший — видимим.
- `executablePath` можна встановити глобально або для кожного локального керованого профілю. Значення для профілю перевизначають `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на базі Chromium.
- `color` (верхній рівень і для кожного профілю) підфарбовує інтерфейс браузера, щоб ви бачили, який профіль активний.
- Профіль за замовчуванням — `openclaw` (керований окремий). Використовуйте `defaultProfile: "user"`, щоб перейти на браузер авторизованого користувача.
- Порядок авто-визначення: системний типовий браузер, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має під’єднуватися до нетипового профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним типовим** браузером є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовизначення. `~` розгортається в домашній каталог вашої ОС:

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

`executablePath` для профілю впливає лише на локальні керовані профілі, які OpenClaw
запускає. Профілі `existing-session` натомість під’єднуються до вже запущеного браузера,
а профілі віддаленого CDP використовують браузер, що стоїть за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає службу керування loopback і може запускати локальний браузер.
- **Віддалене керування (вузол node):** запустіть вузол node на машині, де є браузер; Gateway проксіює до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.
- `headless` впливає лише на локальні керовані профілі, які OpenClaw запускає. Він не перезапускає і не змінює браузери existing-session або віддаленого CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Зміна його для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  під час наступного запуску використовувався новий бінарний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддаленого CDP: `openclaw browser stop` закриває активну
  сесію керування та звільняє перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику endpoint `/json/*` і під час підключення
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів,
а не комітити їх у файли конфігурації.

## Проксі браузера Node (нульова конфігурація за замовчуванням)

Якщо ви запускаєте **вузол node host** на машині, де знаходиться ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього вузла без жодної додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Вузол node host надає свій локальний сервер керування браузером через **команду proxy**.
- Профілі беруться з власної конфігурації вузла `browser.profiles` (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами create/delete профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядає це як межу найменших привілеїв: націлювати можна лише профілі з allowlist, а маршрути create/delete постійних профілів блокуються на поверхні proxy.
- Вимкніть це, якщо не хочете використовувати:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку з цих форм, але
для профілю віддаленого браузера найпростішим варіантом є прямий URL WebSocket
із документації Browserless щодо підключення.

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
- Виберіть endpoint регіону, який відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі розміщені сервіси браузерів надають **прямий endpoint WebSocket**, а не
стандартне виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **Виявлення HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL відлагодження WebSocket, а потім
  підключається. Резервного переходу до WebSocket немає.
- **Прямі endpoint WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Порожні кореневі WebSocket** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP
  виявлення `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого рукостискання WebSocket на порожньому корені. Це дозволяє
  порожньому `ws://`, спрямованому на локальний Chrome, усе одно підключатися, оскільки Chrome
  приймає оновлення WebSocket лише на конкретному шляху для цілі з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless браузерів із вбудованим розв’язанням CAPTCHA, stealth mode і residential
proxies.

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
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API key Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тож
  ручний крок створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію й одну годину браузера на місяць.
  Див. [pricing](https://www.browserbase.com/pricing) щодо обмежень платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повного довідника API,
  посібників SDK та прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing вузла.
- Окремий loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  bearer auth за токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve та `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API браузера.
- Якщо керування браузером увімкнено і жодну автентифікацію спільним секретом не налаштовано, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які вузли node host у приватній мережі (Tailscale); уникайте публічного відкриття.
- Ставтеся до URL/токенів віддаленого CDP як до секретів; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим endpoint (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути такими:

- **керований OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалений**: явний URL CDP (браузер на базі Chromium, що працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типова поведінка:

- Профіль `openclaw` автоматично створюється, якщо його немає.
- Профіль `user` є вбудованим для під’єднання existing-session через Chrome MCP.
- Профілі existing-session є opt-in, окрім `user`; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP за замовчуванням виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Кошика.

Усі endpoint керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може під’єднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

- [Chrome for Developers: Використання Chrome DevTools MCP із вашою сесією браузера](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автопідключення Chrome MCP, яке націлюється на
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

Живий smoke test під’єднання:

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
- `snapshot` повертає refs із вибраної живої вкладки

Що перевірити, якщо під’єднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера ввімкнено віддалене налагодження
- браузер показав запит на згоду на під’єднання, і ви його прийняли
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення і перевіряє, що
  Chrome локально встановлено для типових профілів автопідключення, але не може
  увімкнути віддалене налагодження на стороні браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан авторизованого браузера користувача.
- Якщо ви використовуєте власний профіль existing-session, передайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити запит
  на під’єднання.
- Gateway або вузол node host можуть запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях ризикованіший за ізольований профіль `openclaw`, оскільки він може
  діяти всередині вашої авторизованої сесії браузера.
- OpenClaw не запускає браузер для цього драйвера; він лише під’єднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  встановлено `userDataDir`, його буде передано далі, щоб націлитися на цей каталог даних користувача.
- Existing-session може під’єднуватися на вибраному host або через підключений
  вузол браузера. Якщо Chrome знаходиться деінде і жоден вузол браузера не підключено, використовуйте
  натомість віддалений CDP або вузол node host.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Знімки екрана** — працюють захоплення сторінки та захоплення елемента через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для знімків екрана сторінки чи елемента на основі ref.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` вимагають snapshot refs (без CSS-селекторів). `click` підтримує лише ліву кнопку. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремих викликів. `select` приймає одне значення.
- **Очікування / завантаження / діалог** — `wait --url` підтримує точні, підрядкові та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження вимагають `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-ауту.
- **Лише керовані можливості** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще вимагають шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається вашого особистого профілю браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
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
- Linux: шукає `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряє типові місця встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **HTTP API керування лише через loopback**
та відповідний CLI `openclaw browser` (snapshot, refs, розширені можливості wait,
вивід JSON, робочі процеси налагодження). Див.
[API керування браузером](/uk/tools/browser-control) для повного довідника.

## Усунення несправностей

Проблеми, специфічні для Linux (особливо snap Chromium), див. у
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними host WSL2 Gateway + Windows Chrome див.
[Усунення несправностей WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти блокування SSRF навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером працює справно.
- **Блокування SSRF навігації** означає, що площина керування браузером працює справно, але ціль навігації сторінки відхиляється політикою.

Поширені приклади:

- Збій запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб розрізнити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте несправності готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще нездорова. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінкою.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером працює справно.

Важливі деталі поведінки:

- Конфігурація браузера за замовчуванням використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального loopback керованого профілю `openclaw` перевірки справності CDP навмисно пропускають перевірку досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Вказівки з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Віддавайте перевагу вузьким виняткам для host, таким як `hostnameAllowlist` або `allowedHostnames`, а не широкому доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для натискання/введення/перетягування/вибору.
- `browser screenshot` захоплює пікселі (повна сторінка, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, plugin, профілю, браузера та вкладок.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де знаходиться браузер.
  - У sandbox-сесіях `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: sandbox-сесії за замовчуванням використовують `sandbox`, не-sandbox сесії — `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента й уникає крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Пісочниця](/uk/gateway/sandboxing) — керування браузером у sandbox-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
