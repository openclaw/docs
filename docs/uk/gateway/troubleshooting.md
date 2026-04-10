---
read_when:
    - Центр усунення неполадок направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника з діагностики за симптомами з точними командами
summary: Детальний посібник з усунення неполадок для gateway, каналів, автоматизації, вузлів і браузера
title: Усунення неполадок
x-i18n:
    generated_at: "2026-04-10T20:41:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ef2faccba26ede307861504043a6415bc1f12dc64407771106f63ddc5b107f5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення неполадок gateway

Ця сторінка є детальним посібником.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете пройти швидкий потік первинної діагностики.

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
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/служб.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису та,
  де це підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли логи/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити збійно завершуються лише для довгих сесій/запусків моделі, яким потрібен beta-шлях 1M.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на ключ Anthropic API.
3. Налаштуйте резервні моделі, щоб виконання продовжувалося, коли запити Anthropic з довгим контекстом відхиляються.

Пов’язане:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-compatible backend проходить прямі probe, але збоять запуски агента

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделі OpenClaw збоять лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Зверніть увагу на таке:

- прямі малі виклики успішні, але запуски OpenClaw збоять лише на більших prompt
- помилки backend про те, що `messages[].content` очікує рядок
- збої backend, які з’являються лише при більшій кількості токенів у prompt або в повних
  prompt середовища виконання агента

Поширені ознаки:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі малі запити успішні, але ходи агента OpenClaw збоять через збої backend/моделі
  (наприклад, Gemma у деяких збірках `inferrs`) → транспорт OpenClaw
  імовірно вже налаштований правильно; проблема в тому, що backend не справляється з більшою формою
  prompt середовища виконання агента.
- після вимкнення tools збоїв стає менше, але вони не зникають → схеми tools були
  частиною навантаження, але решта проблеми все ще пов’язана з upstream місткістю моделі/сервера
  або помилкою backend.

Варіанти виправлення:

1. Встановіть `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядковий вміст.
2. Встановіть `compat.supportsTools: false` для моделей/backend, які не можуть
   надійно обробляти поверхню схем tools OpenClaw.
3. За можливості зменште навантаження prompt: менший bootstrap workspace, коротша
   історія сесії, легша локальна модель або backend із кращою підтримкою довгого контексту.
4. Якщо прямі малі запити й далі проходять, а ходи агента OpenClaw усе ще збоять
   всередині backend, розглядайте це як обмеження upstream сервера/моделі й створіть
   там repro з формою payload, яка приймається.

Пов’язане:

- [/gateway/local-models](/uk/gateway/local-models)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але ніхто не відповідає, перевірте маршрутизацію та політики перед тим, як щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Pairing очікує на розгляд для відправників у DM.
- Обмеження згадок у групах (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення групи ігнорується, доки немає згадки.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправника/канал відфільтровано політикою.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення dashboard/control UI

Коли dashboard/control UI не може підключитися, перевірте URL, режим auth і припущення про безпечний контекст.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильний URL probe і URL dashboard.
- Невідповідність режиму auth/токена між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Поширені ознаки:

- `device identity required` → небезпечний контекст або відсутня auth пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з browser origin не на loopback без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  flow auth пристрою на основі challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або використав застарілу часову мітку) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом із paired
  токеном пристрою. Виклики з явними `deviceToken` / явними `scopes` зберігають
  запитаний ними набір scope.
- Поза цим шляхом повторної спроби пріоритет auth для connect такий:
  спочатку явний shared token/password, потім явний `deviceToken`, потім збережений токен пристрою,
  потім bootstrap token.
- На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як limiter зафіксує збій. Тому дві хибні
  одночасні повторні спроби від того самого клієнта можуть призвести до `retry later`
  для другої спроби замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з browser-origin
  → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
- повторюване `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена та за потреби повторно схваліть/перегенеруйте токен пристрою.
- `gateway connect failed:` → неправильний host/port/url призначення.

### Швидка таблиця кодів деталей auth

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                 | Рекомендована дія                                                                                                                                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий shared token.            | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, а потім вставте його в налаштуваннях Control UI.                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | Shared token не збігся з токеном auth gateway.           | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явними `deviceToken` / `scopes` зберігають запитані scope. Якщо й далі не вдається, виконайте [контрольний список відновлення після розсинхронізації токена](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для конкретного пристрою застарів або відкликаний. | Перегенеруйте/повторно схваліть токен пристрою через [CLI devices](/cli/devices), а потім перепідключіться.                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | Ідентичність пристрою відома, але не схвалена для цієї ролі. | Схваліть запит, що очікує: `openclaw devices list`, потім `openclaw devices approve <requestId>`.                                                                                                                                                                                       |

Перевірка міграції auth пристрою v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо логи показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим nonce challenge

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано заборонено:

- сесії з токеном paired-device можуть керувати лише **власним** пристроєм, якщо
  виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scope,
  які вже має сесія виклику

Пов’язане:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими auth gateway)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/cli/devices)

## Служба gateway не працює

Використовуйте це, коли службу встановлено, але процес не залишається активним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також сканує служби на рівні системи
```

Зверніть увагу на таке:

- `Runtime: stopped` з підказками щодо виходу.
- Невідповідність конфігурації служби (`Config (cli)` vs `Config (service)`).
- Конфлікти портів/слухачів.
- Додаткові встановлення launchd/systemd/schtasks при використанні `--deep`.
- Підказки для очищення `Other gateway-like services detected (best effort)`.

Поширені ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було пошкоджено й у ньому втрачено `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у своїй конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, стандартний шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка не до loopback без коректного шляху auth gateway (token/password або trusted-proxy, якщо налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні модулі launchd/systemd/schtasks. У більшості конфігурацій має бути один gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язане:

- [/gateway/background-process](/uk/gateway/background-process)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження gateway probe

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно виводить блок попереджень.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи пов’язане попередження з резервним переходом через SSH, кількома gateway, відсутніми scope або нерозв’язаними auth refs.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback-цілі.
- `multiple reachable gateways detected` → відповіла більше ніж одна ціль. Зазвичай це означає навмисну конфігурацію з кількома gateway або застарілі/дубльовані listeners.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але детальний RPC обмежений scope; виконайте pairing ідентичності пристрою або використайте облікові дані з `operator.read`.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → auth-матеріал був недоступний у цьому шляху команди для цілі, що не пройшла перевірку.

Пов’язане:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host)
- [/gateway/remote](/uk/gateway/remote)

## Канал підключено, але повідомлення не проходять

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиках, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Зверніть увагу на таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи та вимоги до згадок.
- Відсутні дозволи/scope API каналу.

Поширені ознаки:

- `mention required` → повідомлення ігнорується через політику згадок у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з auth/дозволами каналу.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка cron і heartbeat

Якщо cron або heartbeat не запустився чи не доставився, спочатку перевірте стан scheduler, а вже потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнений і присутній час наступного пробудження.
- Стан історії запусків job (`ok`, `skipped`, `error`).
- Причини пропуску heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
- `cron: timer tick failed` → збій tick scheduler; перевірте помилки файлів/логів/runtime.
- `heartbeat skipped` з `reason=quiet-hours` → поза межами вікна активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але на цьому tick жодне із завдань не підлягає виконанню.
- `heartbeat: unknown accountId` → недійсний account id для цілі доставки heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль heartbeat була визначена як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) має значення `block`.

Пов’язане:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Збій paired tool вузла

Якщо вузол paired, але tools не працюють, ізолюйте стан foreground, дозволи та схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Вузол online з очікуваними capability.
- Надані дозволи ОС для camera/mic/location/screen.
- Стан exec approvals і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок вузла має бути у foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → схвалення exec очікує.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано через allowlist.

Пов’язане:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Збій browser tool

Використовуйте це, коли дії browser tool завершуються з помилкою, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи задано `plugins.allow` і чи включає воно `browser`.
- Коректний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Наявність локального Chrome для профілів `existing-session` / `user`.

Поширені ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → bundled browser plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому plugin ніколи не завантажувався.
- `Failed to start Chrome CDP on port` → процес браузера не вдалося запустити.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або неприпустимий порт.
- `No Chrome tabs found for profile="user"` → у профілі приєднання Chrome MCP немає відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недосяжна з хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для приєднання не має досяжної цілі, або HTTP endpoint відповів, але CDP WebSocket усе одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточному встановленні gateway відсутній повний пакет Playwright; знімки ARIA і базові знімки сторінки все ще можуть працювати, але навігація, AI snapshots, знімки елементів за CSS-селекторами та експорт PDF залишаються недоступними.
- `fullPage is not supported for element screenshots` → запит screenshot поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики screenshot для Chrome MCP / `existing-session` мають використовувати захоплення сторінки або snapshot `--ref`, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks завантаження файлів у Chrome MCP потребують snapshot refs, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → для профілів Chrome MCP надсилайте одне завантаження за виклик.
- `existing-session dialog handling does not support timeoutMs.` → hooks діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або сирого профілю CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline для профілів лише для приєднання або віддалених CDP-профілів → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну сесію керування та скинути стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язане:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість проблем після оновлення — це дрейф конфігурації або суворіші стандартні значення, які тепер застосовуються.

### 1) Змінилася поведінка auth і перевизначення URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть спрямовуватися на remote, тоді як ваша локальна служба працює нормально.
- Явні виклики `--url` не переходять до збережених облікових даних.

Поширені ознаки:

- `gateway connect failed:` → неправильна URL-ціль.
- `unauthorized` → endpoint досяжний, але auth неправильна.

### 2) Guardrails для bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Bind не до loopback (`lan`, `tailnet`, `custom`) потребують коректного шляху auth gateway: shared token/password auth або правильно налаштованого розгортання `trusted-proxy` не на loopback.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Поширені ознаки:

- `refusing to bind gateway ... without auth` → bind не до loopback без коректного шляху auth gateway.
- `RPC probe: failed` коли runtime працює → gateway живий, але недоступний із поточними auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Pending-схвалення пристроїв для dashboard/nodes.
- Pending-схвалення pairing для DM після змін політики або ідентичності.

Поширені ознаки:

- `device identity required` → auth пристрою не виконано.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація служби й runtime усе ще не збігаються, перевстановіть метадані служби з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [/gateway/pairing](/uk/gateway/pairing)
- [/gateway/authentication](/uk/gateway/authentication)
- [/gateway/background-process](/uk/gateway/background-process)
