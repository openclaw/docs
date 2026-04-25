---
read_when:
    - Додавання керованої агентом автоматизації браузера
    - Налагодження того, чому openclaw втручається у роботу вашого Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку для macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T10:18:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64c8b99911a4cf7d109c2e1eecb6beac9ce5c08115faccbeaf962819c98f2915
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Пояснення для початківців:

- Уявіть це як **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої справжньої сесії Chrome, у якій ви виконали вхід, через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (помаранчевий акцент за замовчуванням).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки, скриншоти, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли увімкнено browser
  Plugin.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для щоденного використання. Це безпечне, ізольоване середовище для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте повідомлення “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` взагалі відсутній або агент каже, що browser tool
недоступний, перейдіть до [Відсутня команда браузера або інструмент](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Стандартний інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє той самий інструмент із назвою `browser`:

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

Для значень за замовчуванням потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Якщо вимкнути лише Plugin, це прибере CLI `openclaw browser`, gateway-метод `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваша конфігурація `browser.*` залишиться недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Browser Plugin постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: вибирати
  правильний профіль, тримати ref в межах тієї самої вкладки, використовувати `tabId`/labels для
  вибору вкладок і завантажувати browser skill для багатокрокової роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити статус/вкладки, позначати вкладки задач, робити snapshot перед дією, повторно знімати
  snapshot після змін в інтерфейсі, один раз відновлювати stale ref і повідомляти про login/2FA/captcha або
  camera/microphone blockers як про ручну дію, а не вгадувати.

Skills, вбудовані в Plugin, відображаються в доступних skills агента, коли
Plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
звернення не оплачують повну вартість у токенах.

## Відсутня команда браузера або інструмент

Якщо після оновлення `openclaw browser` невідомий, відсутній `browser.request` або агент повідомляє, що browser tool недоступний, зазвичай причина в тому, що список `plugins.allow` не містить `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика інструментів застосовується лише після завантаження. Повне видалення `plugins.allow` також відновлює поведінку за замовчуванням.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **справжньої сесії Chrome**
  з виконаним входом.

Для викликів browser tool агентом:

- За замовчуванням: використовуйте ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні сесії з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли ви хочете конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете режим managed за замовчуванням.

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

<AccordionGroup>

<Accordion title="Порти та доступність">

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = Gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зміщує похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не встановлено, за замовчуванням використовується керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP для віддаленого (не-loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до handshake WebSocket для віддаленого CDP.
- `actionTimeoutMs` — це типовий бюджет часу для запитів browser `act`, коли викликаюча сторона не передає `timeoutMs`. Клієнтський транспорт додає невелике додаткове вікно, щоб довгі очікування могли завершитися замість тайм-ауту на межі HTTP.
- `tabCleanup` — це best-effort очищення вкладок, відкритих основними сесіями браузера агента. Очищення життєвого циклу субагента, Cron і ACP усе ще закриває свої явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними до повторного використання, а потім закривають неактивні або надлишкові відстежувані вкладки у фоновому режимі.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера й відкриття вкладок захищені SSRF-перевіркою перед навігацією та повторно перевіряються в режимі best-effort на фінальному URL `http(s)` після неї.
- У строгому режимі SSRF також перевіряються виявлення віддалених CDP endpoint і запити `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, яким керує OpenClaw. Керований Chrome запускається напряму за замовчуванням, тому налаштування проксі provider не послаблюють SSRF-перевірки браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію браузерного проксі, якщо доступ браузера до приватної мережі не увімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` за замовчуванням вимкнено; увімкнюйте його лише тоді, коли доступ браузера до приватної мережі свідомо вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений.
- `headless` можна встановити глобально або для окремого локального керованого профілю. Значення для конкретного профілю мають пріоритет над `browser.headless`, тож один локально запущений профіль може залишатися headless, а інший — видимим.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично переходять у headless, якщо ні середовище, ні конфігурація профілю/глобальна
  конфігурація явно не вибирає режим headed. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локальні керовані профілі в режимі headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим headed і повертає
  зрозумілу помилку на хостах Linux без сервера дисплея.
- `executablePath` можна встановити глобально або для окремого локального керованого профілю. Значення для конкретного профілю мають пріоритет над `browser.executablePath`, тому різні керовані профілі можуть запускати різні браузери на базі Chromium.
- `color` (верхнього рівня та для окремого профілю) тонує інтерфейс браузера, щоб ви могли бачити, який профіль активний.
- Профіль за замовчуванням — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб увімкнути браузер користувача з виконаним входом.
- Порядок автовизначення: системний браузер за замовчуванням, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нестандартного профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо ваш **системний браузер за замовчуванням** базується на Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовизначення. `~` розгортається до домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або встановіть це в конфігурації для кожної платформи:

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

`executablePath` для окремого профілю впливає лише на локальні керовані профілі, які запускає OpenClaw.
Профілі `existing-session` натомість підключаються до вже запущеного браузера,
а профілі віддаленого CDP використовують браузер за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування та може запускати локальний браузер.
- **Віддалене керування (хост node):** запустіть хост node на машині, де є браузер; Gateway проксіює до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключатися до віддаленого браузера на базі Chromium. У такому разі OpenClaw не запускатиме локальний браузер.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає та не змінює наявні браузери existing-session або віддаленого CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Його зміна для
  запущеного локального керованого профілю позначає цей профіль для restart/reconcile, щоб
  наступний запуск використовував новий бінарний файл.

Поведінка під час зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддаленого CDP: `openclaw browser stop` закриває активну
  сесію керування та звільняє перевизначення емуляції Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени в query-рядку (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час викликів endpoint `/json/*` і під час підключення
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів,
а не зберігати їх у файлах конфігурації.

## Browser proxy для Node (zero-config за замовчуванням)

Якщо ви запускаєте **хост node** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики browser tool до цього node без додаткової конфігурації браузера.
Це стандартний шлях для віддалених Gateway.

Примітки:

- Хост node надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` на node (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/стандартної поведінки: усі налаштовані профілі залишаються доступними через proxy, зокрема маршрути створення/видалення профілів.
- Якщо ви встановите `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядатиме це як межу принципу найменших привілеїв: цілитися можна лише в профілі з allowlist, а маршрути створення/видалення постійних профілів блокуються на поверхні proxy.
- Вимкніть це, якщо воно вам не потрібне:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостинговий віддалений CDP)

[Browserless](https://browserless.io) — це хостинговий сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
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

Деякі хостингові сервіси браузера надають **прямий endpoint WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **Виявлення HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі endpoint WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через handshake WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі WebSocket URL без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує виявлення HTTP
  `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого handshake WebSocket на корені без шляху. Це дозволяє
  підключатися навіть для `ws://` без шляху, спрямованого на локальний Chrome, оскільки Chrome лише
  приймає оновлення WebSocket на конкретному шляху для цілі з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode та residential
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
  з [Overview dashboard](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API key Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тому
  окремий крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну годину роботи браузера на місяць.
  Обмеження платних планів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API,
  посібники SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairинг node.
- Автономний loopback HTTP API браузера використовує **лише shared-secret auth**:
  bearer auth за токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентифікації Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено й не налаштовано shared-secret auth, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode`
  уже має значення `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости node у приватній мережі (Tailscale); уникайте публічного доступу.
- Ставтеся до URL/токенів віддаленого CDP як до секретів; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим endpoint (HTTPS або WSS) і токенам із коротким строком дії.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керованими OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом user data + портом CDP
- **віддаленими**: явний URL CDP (браузер на базі Chromium, що працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автоматичне підключення Chrome DevTools MCP

Значення за замовчуванням:

- Профіль `openclaw` автоматично створюється, якщо відсутній.
- Профіль `user` є вбудованим для підключення existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються за бажанням; створюйте їх через `--driver existing-session`.
- Локальні порти CDP виділяються з діапазону **18800–18899** за замовчуванням.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі endpoint керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та інструкції з налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний користувацький профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Поведінка за замовчуванням:

- Вбудований профіль `user` використовує автоматичне підключення Chrome MCP, яке націлюється на
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

1. Відкрийте в цьому браузері сторінку inspect для віддаленого налагодження.
2. Увімкніть віддалене налагодження.
3. Тримайте браузер запущеним і підтвердьте запит на підключення, коли OpenClaw підключатиметься.

Типові сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live attach smoke test:

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
- `tabs` перелічує вже відкриті вкладки вашого браузера
- `snapshot` повертає ref із вибраної live-вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера ввімкнено віддалене налагодження
- браузер показав запит на підключення, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення й перевіряє, що
  Chrome встановлено локально для типових профілів auto-connect, але він не може
  увімкнути віддалене налагодження в самому браузері за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте користувацький профіль existing-session, передайте явну назву цього профілю.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або хост node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, тому що він може
  виконувати дії у вашій сесії браузера з виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він лише підключається.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  встановлено `userDataDir`, його буде передано далі для націлювання на цей каталог user data.
- Existing-session може підключатися на вибраному хості або через підключений
  browser node. Якщо Chrome розташований деінде й browser node не підключено, використовуйте
  віддалений CDP або хост node.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Скриншоти** — працюють захоплення сторінки та захоплення елементів через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Для скриншотів сторінки або елементів за ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` вимагають snapshot ref (без CSS-селекторів). `click-coords` натискає видимі координати viewport і не вимагає snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремого виклику. `select` приймає одне значення.
- **Очікування / завантаження / діалогові вікна** — `wait --url` підтримує точні, підрядкові та glob-шаблони; `wait --load networkidle` не підтримується. Hooks завантаження вимагають `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Hooks діалогових вікон не підтримують перевизначення тайм-ауту.
- **Функції лише для managed** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще вимагають шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог user data**: ніколи не торкається профілю вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб не створювати конфліктів із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, а потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові labels і сирий `targetId`.
  Агентам слід повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний варіант:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це за допомогою `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє типові розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє типові місця встановлення.

## API керування (необов’язково)

Для створення скриптів і налагодження Gateway надає невеликий **HTTP API
керування лише через loopback** і відповідний CLI `openclaw browser` (snapshots, refs, розширені можливості wait,
вивід JSON, робочі процеси налагодження). Повний довідник див. у
[API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome див.
[Усунення несправностей WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування навігації SSRF

Це різні класи помилок, і вони вказують на різні шляхи в коді.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером працює коректно.
- **Блокування навігації SSRF** означає, що площина керування браузером працює коректно, але ціль навігації сторінки відхиляється політикою.

Типові приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування навігації SSRF:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб розрізнити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще нездорова. Розглядайте це як проблему доступності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а проблема в політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером працює коректно.

Важливі деталі поведінки:

- Конфігурація браузера за замовчуванням використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки стану CDP навмисно пропускають застосування SSRF-перевірки доступності браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що подальша ціль `open` або `navigate` буде дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (вся сторінка, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладок.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору, де розташований браузер.
  - У sandboxed sessions `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: sandboxed sessions за замовчуванням використовують `sandbox`, а не-sandbox sessions — `host`.
  - Якщо підключено node з підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента й дозволяє уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція](/uk/gateway/sandboxing) — керування браузером в ізольованих середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і захист
