---
read_when:
    - Центр усунення несправностей направив вас сюди для поглибленої діагностики
    - Вам потрібні стабільні розділи runbook за симптомами з точними командами
summary: Поглиблений runbook з усунення несправностей для шлюзу, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-06T15:29:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0202e8858310a0bfc1c994cd37b01c3b2d6c73c8a74740094e92dc3c4c36729
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей шлюзу

Ця сторінка — поглиблений runbook.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете пройти швидкий потік тріажу.

## Послідовність команд

Спочатку виконайте ці команди в такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running` і `RPC probe: ok`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/сервісу.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису і,
  де підтримується, результати probe/audit, наприклад `works` або `audit ok`.

## Anthropic 429: потрібне додаткове використання для довгого контексту

Використовуйте це, коли журнали/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- Для вибраної моделі Anthropic Opus/Sonnet встановлено `params.context1m: true`.
- Поточні облікові дані Anthropic не дають права на використання довгого контексту.
- Запити падають лише на довгих сесіях/запусках моделі, яким потрібен beta-шлях 1M.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використовуйте облікові дані Anthropic, які дають право на запити з довгим контекстом, або перейдіть на ключ API Anthropic.
3. Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic з довгим контекстом відхиляються.

Пов’язане:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Немає відповідей

Якщо канали підключені, але нічого не відповідає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Pairing очікує підтвердження для відправників у DM.
- Обмеження згадування для груп (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist для каналу/групи.

Типові ознаки:

- `drop guild message (mention required` → групове повідомлення ігнорується, доки немає згадки.
- `pairing request` → відправника потрібно схвалити.
- `blocked` / `allowlist` → відправника/канал відфільтровано політикою.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення dashboard/control UI

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильний URL probe і URL dashboard.
- Невідповідність режиму/токена автентифікації між клієнтом і шлюзом.
- Використання HTTP там, де потрібна ідентичність пристрою.

Типові ознаки:

- `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з origin браузера, що не є loopback, без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або використав застарілий timestamp) для поточного рукостискання.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом із pair-ованим
  токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` зберігають
  свій запитаний набір scope.
- Поза цим шляхом повторної спроби пріоритет автентифікації connect такий: спочатку явний спільний
  токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою,
  потім bootstrap-токен.
- В асинхронному шляху Tailscale Serve Control UI невдалі спроби для одного й того самого
  `{scope, ip}` серіалізуються до того, як лімітер зафіксує помилку. Тому дві хибні
  одночасні повторні спроби від того самого клієнта можуть призвести до `retry later`
  у другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з browser-origin
  → повторні невдалі спроби з того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
- повторюване `unauthorized` після цієї повторної спроби → розсинхронізація спільного токена/токена пристрою; оновіть конфігурацію токена та за потреби повторно схваліть/ротуйте токен пристрою.
- `gateway connect failed:` → неправильний хост/порт/URL призначення.

### Швидка карта кодів деталей автентифікації

Використовуйте `error.details.code` з невдалого відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                 | Рекомендована дія                                                                                                                                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.          | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштуваннях Control UI.                                                                                                                     |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації шлюзу. | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явним `deviceToken` / `scopes` зберігають запитувані scope. Якщо все ще не працює, виконайте [контрольний список відновлення після дрейфу токена](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для конкретного пристрою застарів або відкликаний. | Ротуйте/повторно схваліть токен пристрою за допомогою [devices CLI](/cli/devices), потім перепідключіться.                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | Ідентичність пристрою відома, але не схвалена для цієї ролі. | Схваліть очікуваний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`.                                                                                                                                                                                       |

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і переконайтеся, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим challenge nonce

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхиляються:

- сесії токена pair-ованого пристрою можуть керувати лише **власним** пристроєм, якщо
  виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті scope оператора,
  які сесія виклику вже має

Пов’язане:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими автентифікації шлюзу)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/cli/devices)

## Сервіс шлюзу не працює

Використовуйте це, коли сервіс установлено, але процес не утримується запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також сканувати системні сервіси
```

Зверніть увагу на таке:

- `Runtime: stopped` з підказками щодо завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Типові ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим шлюзу не ввімкнено, або файл конфігурації було пошкоджено й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind не на loopback без дійсного шляху автентифікації шлюзу (токен/пароль або trusted-proxy там, де його налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні launchd/systemd/schtasks-юнити. У більшості конфігурацій має бути один шлюз на машину; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язане:

- [/gateway/background-process](/uk/gateway/background-process)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження probe шлюзу

Використовуйте це, коли `openclaw gateway probe` досягає цілі, але все одно виводить блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження резервного SSH-шляху, кількох шлюзів, відсутніх scope або нерозв’язаних auth refs.

Типові ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback-цілі.
- `multiple reachable gateways detected` → відповіла більш ніж одна ціль. Зазвичай це означає навмисну багатошлюзову конфігурацію або застарілі/дубльовані слухачі.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → connect спрацював, але детальний RPC обмежено scope; pair-уйте ідентичність пристрою або використовуйте облікові дані з `operator.read`.
- нерозв’язане попередження SecretRef для `gateway.auth.*` / `gateway.remote.*` → матеріали автентифікації були недоступні в цьому шляху команди для цілі, що завершилася помилкою.

Пов’язане:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host)
- [/gateway/remote](/uk/gateway/remote)

## Канал підключений, але повідомлення не проходять

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Зверніть увагу на таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи та вимоги до згадки.
- Відсутні дозволи/scopes API каналу.

Типові ознаки:

- `mention required` → повідомлення ігнорується політикою згадки в групі.
- `pairing` / сліди очікуваного схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема автентифікації/дозволів каналу.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка cron і heartbeat

Якщо cron або heartbeat не спрацювали чи не були доставлені, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнено і є наступне пробудження.
- Статус історії запусків завдань (`ok`, `skipped`, `error`).
- Причини пропуску heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Типові ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/журналів/runtime.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не підлягає виконанню в цьому тіку.
- `heartbeat: unknown accountId` → недійсний id облікового запису для цілі доставки heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль heartbeat була зіставлена з призначенням у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) має значення `block`.

Пов’язане:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Збій інструмента pair-ованого вузла

Якщо вузол pair-ований, але інструменти не працюють, окремо перевірте передній план, дозволи та стан схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Вузол у мережі з очікуваними можливостями.
- Надані ОС-дозволи для камери/мікрофона/геолокації/екрана.
- Стан схвалень exec і allowlist.

Типові ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок вузла має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язане:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Збій browser tool

Використовуйте це, коли дії browser tool не працюють, хоча сам шлюз справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Дійсний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

Типові ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому плагін ніколи не завантажився.
- `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → у налаштованого URL CDP неправильний або позадіапазонний порт.
- `No Chrome tabs found for profile="user"` → профіль приєднання Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недосяжна з хоста шлюзу.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль attach-only не має досяжної цілі, або HTTP-кінцева точка відповіла, але CDP WebSocket усе одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточному встановленні шлюзу немає повного пакета Playwright; знімки ARIA і базові знімки сторінки все ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селекторами та експорт PDF залишаються недоступними.
- `fullPage is not supported for element screenshots` → запит на знімок екрана змішав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів Chrome MCP потребують посилань зі знімка, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → надсилайте по одному завантаженню за виклик у профілях Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` усе ще потребує керованого браузера або сирого профілю CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або віддаленого CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керовану сесію та звільнити стан емуляції Playwright/CDP без перезапуску всього шлюзу.

Пов’язане:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися і щось раптом зламалося

Більшість проблем після оновлення пов’язані з дрейфом конфігурації або з жорсткішими типовими значеннями, які тепер застосовуються.

### 1) Змінилася поведінка автентифікації та перевизначення URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на remote, навіть якщо локальний сервіс працює нормально.
- Явні виклики `--url` не повертаються до збережених облікових даних.

Типові ознаки:

- `gateway connect failed:` → неправильна ціль URL.
- `unauthorized` → кінцева точка досяжна, але автентифікація неправильна.

### 2) Guardrails для bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Bind не на loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації шлюзу: спільна автентифікація токеном/паролем або правильно налаштоване розгортання `trusted-proxy` не на loopback.
- Старі ключі, як-от `gateway.token`, не замінюють `gateway.auth.token`.

Типові ознаки:

- `refusing to bind gateway ... without auth` → bind не на loopback без дійсного шляху автентифікації шлюзу.
- `RPC probe: failed` while runtime is running → шлюз живий, але недоступний із поточними auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Очікувані схвалення пристроїв для dashboard/nodes.
- Очікувані схвалення DM pairing після змін політики або ідентичності.

Типові ознаки:

- `device identity required` → вимоги device auth не виконано.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо конфігурація сервісу та runtime все ще не збігаються після перевірок, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [/gateway/pairing](/uk/gateway/pairing)
- [/gateway/authentication](/uk/gateway/authentication)
- [/gateway/background-process](/uk/gateway/background-process)
