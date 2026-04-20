---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника на основі симптомів із точними командами
summary: Детальний посібник з усунення несправностей для Gateway, каналів, автоматизації, Node і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-20T12:31:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2afb105376bb467e5a344e6d73726908cb718fa13116b751fddb494a0b641c42
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Gateway

Ця сторінка — детальний посібник.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете швидкий сценарій первинної діагностики.

## Драбина команд

Спершу виконайте ці команди в такому порядку:

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
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису та,
  де це підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- Для вибраної моделі Anthropic Opus/Sonnet встановлено `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити падають лише на довгих сеансах/запусках моделі, яким потрібен шлях 1M beta.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на Anthropic API key.
3. Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.

Пов’язане:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний backend проходить прямі probe, але запуски агента падають

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw падають лише на звичайних ходах агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Зверніть увагу на таке:

- прямі малі виклики успішні, але запуски OpenClaw падають лише на більших prompt
- помилки backend про те, що `messages[].content` має очікувати рядок
- збої backend, які з’являються лише за більшої кількості prompt-token або в повних prompt середовища виконання агента

Типові сигнатури:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі малі запити успішні, але запуски агента OpenClaw падають через збої backend/моделі
  (наприклад, Gemma на деяких збірках `inferrs`) → транспорт OpenClaw,
  імовірно, уже правильний; проблема в тому, що backend не справляється з більшими prompt
  середовища виконання агента.
- збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів
  були частиною навантаження, але решта проблеми все одно знаходиться вище за течією:
  це обмеження моделі/сервера або помилка backend.

Варіанти виправлення:

1. Встановіть `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядковий вміст.
2. Встановіть `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти
   поверхню схем інструментів OpenClaw.
3. Зменште навантаження на prompt, де це можливо: менший bootstrap робочого простору, коротша
   історія сеансу, легша локальна модель або backend із кращою підтримкою довгого контексту.
4. Якщо прямі малі запити й далі проходять, а ходи агента OpenClaw все одно аварійно завершуються
   всередині backend, розглядайте це як обмеження upstream сервера/моделі й створіть
   там repro із прийнятою формою payload.

Пов’язане:

- [/gateway/local-models](/uk/gateway/local-models)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але нічого не відповідає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Pairing очікує на підтвердження для відправників у DM.
- Обмеження згадок у групах (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Типові сигнатури:

- `drop guild message (mention required` → групове повідомлення ігнорується, доки немає згадки.
- `pairing request` → відправник потребує схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення до dashboard/control UI

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильні URL probe і dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Типові сигнатури:

- `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з не-loopback origin браузера без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або застарілу часову мітку) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений із пов’язаним
  токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` зберігають свій
  запитаний набір scope.
- Поза цим шляхом повторної спроби пріоритет автентифікації підключення такий:
  спочатку явний shared token/password, потім явний `deviceToken`, далі збережений токен пристрою,
  а потім bootstrap token.
- В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як обмежувач зафіксує невдачу. Тому дві одночасні
  хибні повторні спроби від того самого клієнта можуть дати `retry later`
  на другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з browser-origin
  → повторні невдалі спроби з того самого нормалізованого `Origin` тимчасово блокуються;
  інший localhost origin використовує окремий bucket.
- повторювані `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена та за потреби повторно схваліть/перевипустіть токен пристрою.
- `gateway connect failed:` → неправильний host/port/url призначення.

### Швидка таблиця кодів деталей автентифікації

Використовуйте `error.details.code` з невдалого `connect` response, щоб вибрати наступну дію:

| Код деталей                 | Значення                                                                                                                                                                                    | Рекомендована дія                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Клієнт не надіслав обов’язковий shared token.                                                                                                                                               | Вставте/задайте токен у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштуваннях Control UI.                                                                                                                      |
| `AUTH_TOKEN_MISMATCH`       | Shared token не збігся з токеном автентифікації Gateway.                                                                                                                                    | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явним `deviceToken` / `scopes` зберігають запитані scope. Якщо все ще не вдається, виконайте [контрольний список відновлення після дрейфу токена](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для окремого пристрою застарів або був відкликаний.                                                                                                                        | Перевипустіть/повторно схваліть токен пристрою за допомогою [devices CLI](/cli/devices), а потім перепідключіться.                                                                                                                                                                       |
| `PAIRING_REQUIRED`          | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` для `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використайте `requestId` / `remediationHint`, якщо вони є. | Схваліть запит, що очікує: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Підвищення scope/ролі використовують той самий потік після перевірки запитаного доступу.                                                                                               |

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим nonce challenge

Якщо `openclaw devices rotate` / `revoke` / `remove` несподівано заборонено:

- сеанси токена пов’язаного пристрою можуть керувати лише **власним**
  пристроєм, якщо викликальник також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scope,
  які сеанс викликальника вже має

Пов’язане:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими автентифікації gateway)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/cli/devices)

## Сервіс Gateway не запущено

Використовуйте це, коли сервіс установлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також проскануйте системні сервіси
```

Зверніть увагу на таке:

- `Runtime: stopped` із підказками щодо завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові встановлення launchd/systemd/schtasks при використанні `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Типові сигнатури:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було пошкоджено, і він втратив `gateway.mode`. Виправлення: установіть `gateway.mode="local"` у своїй конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка до не-loopback адреси без коректного шляху автентифікації gateway (token/password або trusted-proxy, якщо налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні модулі launchd/systemd/schtasks. У більшості конфігурацій на машині має бути один gateway; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язане:

- [/gateway/background-process](/uk/gateway/background-process)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/doctor](/uk/gateway/doctor)

## Gateway відновив останню відому справну конфігурацію

Використовуйте це, коли Gateway запускається, але в журналах сказано, що він відновив `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Зверніть увагу на таке:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Файл із часовою міткою `openclaw.json.clobbered.*` поруч з активною конфігурацією
- Подія системи main-agent, яка починається з `Config recovery warning`

Що сталося:

- Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
- OpenClaw зберіг відхилений payload як `.clobbered.*`.
- Активну конфігурацію було відновлено з останньої перевіреної справної копії.
- Наступний хід main-agent отримує попередження не переписувати відхилену конфігурацію навмання.

Перевірка та виправлення:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Типові сигнатури:

- існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або читання під час запуску.
- існує `.rejected.*` → запис конфігурації, що належить OpenClaw, не пройшов перевірку схеми або перевірки clobber перед фіксацією.
- `Config write rejected:` → під час запису була спроба прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
- `Config last-known-good promotion skipped` → кандидат містив замасковані заповнювачі секретів, наприклад `***`.

Варіанти виправлення:

1. Залиште відновлену активну конфігурацію, якщо вона правильна.
2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
3. Запустіть `openclaw config validate` перед перезапуском.
4. Якщо редагуєте вручну, зберігайте повну JSON5-конфігурацію, а не лише частковий об’єкт, який хотіли змінити.

Пов’язане:

- [/gateway/configuration#strict-validation](/uk/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/uk/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось достукується, але все одно виводить блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження резервного переходу на SSH, кількох gateway, відсутніх scope або нерозв’язаних auth refs.

Типові сигнатури:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіло більше однієї цілі. Зазвичай це означає навмисну конфігурацію з кількома gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але детальний RPC обмежено scope; виконайте pairing ідентичності пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібне pairing/схвалення перед звичайним доступом оператора.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → auth-матеріал був недоступний у цьому шляху команди для цілі, що не вдалася.

Пов’язане:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host)
- [/gateway/remote](/uk/gateway/remote)

## Канал підключено, але повідомлення не проходять

Якщо стан каналу — підключено, але потік повідомлень мертвий, зосередьтеся на політиках, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Зверніть увагу на таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Group allowlist і вимоги до згадок.
- Відсутні дозволи/scopes API каналу.

Типові сигнатури:

- `mention required` → повідомлення ігнорується політикою згадок у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з автентифікацією/дозволами каналу.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустилися або не доставилися, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнено, і присутній час наступного пробудження.
- Стан історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Типові сигнатури:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій тика планувальника; перевірте помилки файлів/журналів/середовища виконання.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися на цьому тику.
- `heartbeat: unknown accountId` → недійсний account id для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat було визначено як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для окремого агента) має значення `block`.

Пов’язане:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Збій інструмента пов’язаного Node

Якщо Node пов’язаний, але інструменти не працюють, ізолюйте стан foreground, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Node онлайн з очікуваними можливостями.
- Надані дозволи ОС на камеру/мікрофон/геолокацію/екран.
- Стан схвалень exec і allowlist.

Типові сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано через allowlist.

Пов’язане:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Збій browser tool

Використовуйте це, коли дії browser tool не вдаються, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи встановлено `plugins.allow` і чи містить воно `browser`.
- Коректний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Наявність локального Chrome для профілів `existing-session` / `user`.

Типові сигнатури:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажувався.
- `Failed to start Chrome CDP on port` → процес браузера не зміг запуститися.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, як-от `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або недопустимий порт.
- `No Chrome tabs found for profile="user"` → профіль приєднання Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недосяжна з хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише з приєднанням не має досяжної цілі, або HTTP endpoint відповіла, але CDP WebSocket все одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточній інсталяції gateway відсутній повний пакет Playwright; знімки ARIA та базові знімки сторінки все ще можуть працювати, але навігація, AI snapshots, знімки елементів за CSS-селекторами та експорт PDF залишаються недоступними.
- `fullPage is not supported for element screenshots` → запит на screenshot поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики screenshot для Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів Chrome MCP потребують snapshot refs, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик у профілях Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` все ще потребує керованого браузера або профілю raw CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → запустіть `openclaw browser stop --browser-profile <name>`, щоб закрити активний сеанс керування й звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язане:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість збоїв після оновлення — це дрейф конфігурації або суворіші типові значення, які тепер примусово застосовуються.

### 1) Змінилася поведінка автентифікації та перевизначення URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалений вузол, тоді як ваш локальний сервіс справний.
- Явні виклики `--url` не переходять на резервні збережені облікові дані.

Типові сигнатури:

- `gateway connect failed:` → неправильна ціль URL.
- `unauthorized` → endpoint досяжна, але автентифікація неправильна.

### 2) Обмеження bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Прив’язки до не-loopback адрес (`lan`, `tailnet`, `custom`) потребують коректного шляху автентифікації gateway: shared token/password auth або правильно налаштованого розгортання `trusted-proxy` для не-loopback адрес.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Типові сигнатури:

- `refusing to bind gateway ... without auth` → прив’язка до не-loopback адреси без коректного шляху автентифікації gateway.
- `Connectivity probe: failed`, хоча середовище виконання запущене → gateway працює, але недоступний із поточними auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Незавершені схвалення пристроїв для dashboard/nodes.
- Незавершені схвалення pairing для DM після змін політики або ідентичності.

Типові сигнатури:

- `device identity required` → вимоги device auth не виконано.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо конфігурація сервісу та середовище виконання все ще не збігаються після перевірок, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [/gateway/pairing](/uk/gateway/pairing)
- [/gateway/authentication](/uk/gateway/authentication)
- [/gateway/background-process](/uk/gateway/background-process)
