---
read_when:
    - Центр усунення проблем направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника, побудовані за симптомами, з точними командами
summary: Поглиблений посібник з усунення проблем для gateway, каналів, автоматизації, nodes і browser
title: Усунення проблем
x-i18n:
    generated_at: "2026-04-25T05:56:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення проблем Gateway

Ця сторінка — поглиблений посібник.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете швидкий сценарій діагностики.

## Послідовність команд

Спочатку виконайте ці команди саме в такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/сервісу.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису і,
  де це підтримується, результати probe/audit на кшталт `works` або `audit ok`.

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити збоять лише в довгих сесіях/запусках моделі, яким потрібен бета-шлях 1M.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використовуйте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на ключ Anthropic API.
3. Налаштуйте резервні моделі, щоб запуски продовжувалися, коли Anthropic відхиляє запити з довгим контекстом.

Пов’язано:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і вартість](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний бекенд проходить прямі probe, але запуски агента збоять

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw збоять лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте таке:

- прямі малі виклики успішні, але запуски OpenClaw збоять лише на більших prompts
- помилки бекенда про те, що `messages[].content` очікує рядок
- падіння бекенда, які з’являються лише за більших значень prompt-token або повних
  prompt середовища виконання агента

Поширені ознаки:

- `messages[...].content: invalid type: sequence, expected a string` → бекенд
  відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі малі запити успішні, але запуски агента OpenClaw збоять через падіння
  бекенда/моделі (наприклад, Gemma у деяких збірках `inferrs`) → транспорт OpenClaw,
  імовірно, уже налаштований правильно; бекенд збоїть на більшій формі prompt середовища агента.
- збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів
  були частиною навантаження, але решта проблеми все ще спричинена обмеженнями
  upstream-моделі/сервера або помилкою бекенда.

Варіанти виправлення:

1. Встановіть `compat.requiresStringContent: true` для бекендів Chat Completions, які підтримують лише рядковий вміст.
2. Встановіть `compat.supportsTools: false` для моделей/бекендів, які не можуть
   надійно обробляти поверхню схем інструментів OpenClaw.
3. Де можливо, зменште навантаження на prompt: менший початковий набір робочого простору, коротша
   історія сесії, легша локальна модель або бекенд із кращою підтримкою довгого контексту.
4. Якщо прямі малі запити й далі проходять, а ходи агента OpenClaw все ще падають
   усередині бекенда, вважайте це обмеженням upstream-сервера/моделі й подайте
   туди відтворюваний приклад із прийнятою формою payload.

Пов’язано:

- [Локальні моделі](/uk/gateway/local-models)
- [Конфігурація](/uk/gateway/configuration)
- [OpenAI-сумісні endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але ніхто не відповідає, перевірте маршрутизацію та політики, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте таке:

- Pairing очікує розгляду для відправників у DM.
- Вимога згадки в групі (`requireMention`, `mentionPatterns`).
- Невідповідність allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення групи ігнорується, доки немає згадки.
- `pairing request` → відправника потрібно схвалити.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язано:

- [Усунення проблем каналів](/uk/channels/troubleshooting)
- [Pairing](/uk/channels/pairing)
- [Групи](/uk/channels/groups)

## Підключення dashboard/control UI

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте таке:

- Правильні URL для probe і dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Поширені ознаки:

- `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з origin браузера не на loopback без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  challenge-орієнтований потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або використав застарілу часову мітку) для поточного рукостискання.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scopes, збережений разом із токеном сполученого пристрою. Викликачі з явним `deviceToken` / явними `scopes` зберігають свій запитаний набір scopes.
- Поза цим шляхом повторної спроби пріоритет автентифікації під час підключення такий: спочатку явний спільний
  токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою,
  потім bootstrap-токен.
- На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як limiter зафіксує збій. Тому дві некоректні
  одночасні повторні спроби від того самого клієнта можуть показати `retry later`
  для другої спроби замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з browser-origin
  → повторні збої від того самого нормалізованого `Origin` тимчасово блокуються;
  інший localhost-origin використовує окремий bucket.
- повторні `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена та за потреби повторно схваліть/ротувати токен пристрою.
- `gateway connect failed:` → неправильний host/port/url призначення.

### Швидка мапа кодів деталей автентифікації

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                                | Вставте/задайте токен у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштування Control UI.                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації gateway.                                                                                                                                     | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scopes; викликачі з явним `deviceToken` / `scopes` зберігають запитані scopes. Якщо все ще збоїть, виконайте [контрольний список відновлення при розсинхронізації токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для конкретного пристрою застарів або був відкликаний.                                                                                                                          | Ротувати/повторно схваліть токен пристрою за допомогою [CLI devices](/uk/cli/devices), а потім перепідключіться.                                                                                                                                                                           |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` й використайте `requestId` / `remediationHint`, якщо вони є. | Схваліть запит, що очікує розгляду: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/ролі використовують той самий потік після того, як ви перевірите запитаний доступ.                                                                          |

Перевірка міграції Device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і переконайтеся, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим challenge nonce

Якщо у `openclaw devices rotate` / `revoke` / `remove` неочікувано відмовлено:

- сесії токенів сполучених пристроїв можуть керувати лише **власним** пристроєм, якщо
  викликач додатково не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scopes,
  які сесія викликача вже має

Пов’язано:

- [Control UI](/uk/web/control-ui)
- [Конфігурація](/uk/gateway/configuration) (режими автентифікації gateway)
- [Автентифікація через trusted proxy](/uk/gateway/trusted-proxy-auth)
- [Віддалений доступ](/uk/gateway/remote)
- [Пристрої](/uk/cli/devices)

## Сервіс Gateway не запущений

Використовуйте це, коли сервіс встановлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Шукайте таке:

- `Runtime: stopped` із підказками щодо завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` vs `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки щодо очищення `Other gateway-like services detected (best effort)`.

Поширені ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було пошкоджено й він втратив `gateway.mode`. Виправлення: встановіть `gateway.mode="local"` у своїй конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації gateway (токен/пароль або trusted-proxy, якщо налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні модулі launchd/systemd/schtasks. У більшості конфігурацій на машині має бути один gateway; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язано:

- [Фонове виконання та інструмент процесів](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відновив останню справну конфігурацію

Використовуйте це, коли Gateway запускається, але журнали повідомляють, що він відновив `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Шукайте таке:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Файл `openclaw.json.clobbered.*` із часовою міткою поруч з активною конфігурацією
- Системну подію main-agent, що починається з `Config recovery warning`

Що сталося:

- Відхилена конфігурація не пройшла перевірку під час запуску або гарячого перезавантаження.
- OpenClaw зберіг відхилений payload як `.clobbered.*`.
- Активну конфігурацію було відновлено з останньої перевіреної справної копії.
- Наступний хід main-agent отримає попередження не переписувати відхилену конфігурацію бездумно.
- Якщо всі проблеми перевірки були в межах `plugins.entries.<id>...`, OpenClaw
  не відновлював би весь файл. Локальні збої Plugin залишаються помітними, а не пов’язані
  налаштування користувача зберігаються в активній конфігурації.

Перевірка та виправлення:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Поширені ознаки:

- Існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або читання під час запуску.
- Існує `.rejected.*` → запис конфігурації, що належав OpenClaw, не пройшов перевірки схеми або clobber-перевірки перед фіксацією.
- `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було визнано пошкодженим, оскільки він втратив поля або розмір порівняно з резервною копією last-known-good.
- `Config last-known-good promotion skipped` → кандидат містив замасковані заповнювачі секретів на кшталт `***`.

Варіанти виправлення:

1. Залиште відновлену активну конфігурацію, якщо вона правильна.
2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
3. Перед перезапуском виконайте `openclaw config validate`.
4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.

Пов’язано:

- [Конфігурація: сувора перевірка](/uk/gateway/configuration#strict-validation)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Config](/uk/cli/config)
- [Doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно показує блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи пов’язане попередження з резервним SSH, кількома gateway, відсутніми scopes або невизначеними посиланнями auth.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback-цілі.
- `multiple reachable gateways detected` → відповіла більш ніж одна ціль. Зазвичай це означає навмисну конфігурацію з кількома gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але RPC деталей обмежені scopes; сполучіть ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібне сполучення/схвалення перед звичайним доступом operator.
- невизначений текст попередження SecretRef `gateway.auth.*` / `gateway.remote.*` → матеріал auth був недоступний у цьому шляху команди для цілі, що не спрацювала.

Пов’язано:

- [Gateway](/uk/cli/gateway)
- [Кілька gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, але повідомлення не проходять

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиках, дозволах і правилах доставки конкретного каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте таке:

- Політику DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи та вимоги до згадки.
- Відсутні дозволи/scopes API каналу.

Поширені ознаки:

- `mention required` → повідомлення ігнорується політикою згадки в групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з auth/дозволами каналу.

Пов’язано:

- [Усунення проблем каналів](/uk/channels/troubleshooting)
- [WhatsApp](/uk/channels/whatsapp)
- [Telegram](/uk/channels/telegram)
- [Discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустилися чи не доставили результат, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте таке:

- Cron увімкнено і присутній наступний wake.
- Статус історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/журналів/середовища виконання.
- `heartbeat skipped` з `reason=quiet-hours` → поза межами активного вікна годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але на цей тік жодне завдання не настав час виконувати.
- `heartbeat: unknown accountId` → недійсний ID облікового запису для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat визначилася як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) має значення `block`.

Пов’язано:

- [Заплановані завдання: усунення проблем](/uk/automation/cron-jobs#troubleshooting)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Heartbeat](/uk/gateway/heartbeat)

## Збій інструмента сполученого Node

Якщо Node сполучений, але інструменти збоять, ізолюйте стан foreground, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Шукайте таке:

- Node онлайн з очікуваними capability.
- Дозволи ОС для camera/mic/location/screen.
- Стан схвалень виконання та allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення виконання.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язано:

- [Усунення проблем Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)
- [Схвалення exec](/uk/tools/exec-approvals)

## Збій інструмента browser

Використовуйте це, коли дії інструмента browser збоять, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте таке:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Коректний шлях до виконуваного файлу браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

Поширені ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажувався.
- `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, таку як `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або вихідний за межі діапазону порт.
- `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP поки не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку inspect браузера, увімкніть remote debugging, залиште браузер відкритим, схваліть перший запит на підключення, а потім повторіть спробу. Якщо стан входу в обліковий запис не потрібен, віддайте перевагу керованому профілю `openclaw`.
- `No Chrome tabs found for profile="user"` → у профілі підключення Chrome MCP немає відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний з хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для підключення не має досяжної цілі, або HTTP-endpoint відповів, але WebSocket CDP все одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточному встановленні gateway відсутня залежність середовища виконання `playwright-core` вбудованого browser Plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть gateway. Знімки ARIA та базові знімки сторінки все ще можуть працювати, але навігація, AI snapshots, знімки елементів за CSS-селекторами та експорт PDF залишаться недоступними.
- `fullPage is not supported for element screenshots` → запит на знімок екрана поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів Chrome MCP потребують посилань snapshot, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → надсилайте по одному завантаженню за виклик у профілях Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `existing-session type does not support timeoutMs overrides.` → не використовуйте `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session, або використайте керований/CDP-профіль браузера, коли потрібен власний timeout.
- `existing-session evaluate does not support timeoutMs overrides.` → не використовуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session, або використайте керований/CDP-профіль браузера, коли потрібен власний timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` досі потребує керованого браузера або сирого профілю CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керувальну сесію та скинути стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язано:

- [Усунення проблем browser](/uk/tools/browser-linux-troubleshooting)
- [Browser (керований OpenClaw)](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість збоїв після оновлення — це дрейф конфігурації або жорсткіші типові значення, які тепер примусово застосовуються.

### 1) Змінилася поведінка перевизначення auth і URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалений gateway, хоча ваш локальний сервіс справний.
- Явні виклики `--url` не використовують резервно збережені облікові дані.

Поширені ознаки:

- `gateway connect failed:` → неправильна URL-ціль.
- `unauthorized` → endpoint досяжний, але auth неправильний.

### 2) Захисні обмеження для bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують чинного шляху auth gateway: спільного токена/пароля або правильно налаштованого розгортання `trusted-proxy` не на loopback.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Поширені ознаки:

- `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху auth gateway.
- `Connectivity probe: failed` при запущеному runtime → gateway живий, але недоступний із поточним auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Запити на схвалення пристроїв, що очікують розгляду, для dashboard/nodes.
- Запити на схвалення DM pairing, що очікують розгляду, після змін політики або ідентичності.

Поширені ознаки:

- `device identity required` → вимоги auth пристрою не виконано.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація сервісу й runtime усе ще не збігаються, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язано:

- [Pairing під керуванням gateway](/uk/gateway/pairing)
- [Автентифікація](/uk/gateway/authentication)
- [Фонове виконання та інструмент процесів](/uk/gateway/background-process)

## Пов’язано

- [Посібник Gateway](/uk/gateway)
- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
